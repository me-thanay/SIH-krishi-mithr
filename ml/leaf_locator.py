"""Locate the dominant leaf region in a camera photo before disease classification.

Colour segmentation in HSV (green + yellow/brown foliage tones) followed by the largest
connected component. Cheap, dependency-light (OpenCV ships with ultralytics), and good enough
to crop away soil, hands and sky so the classifier sees mostly leaf.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from PIL import Image


def locate_leaf(
    img: Image.Image,
    min_fraction: float = 0.04,
    min_green_ratio: float = 0.35,
    margin: float = 0.06,
) -> dict[str, Any] | None:
    """Return {"box": [x1,y1,x2,y2], "coverage": float, "green_ratio": float} for the main leaf.

    None means no plausible leaf: too little foliage colour, or the candidate region is mostly
    brown/yellow without green (walls, soil, wood) which the classifier would otherwise mislabel.
    """
    try:
        import cv2
    except ImportError:
        return None

    w, h = img.size
    scale = 512 / max(w, h)
    small = img.resize((max(1, int(w * scale)), max(1, int(h * scale)))) if scale < 1 else img
    rgb = np.asarray(small)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)

    # OpenCV hue range is 0-179. Green foliage ~ 25-95; yellow/brown diseased tissue ~ 10-25.
    green = cv2.inRange(hsv, (25, 40, 30), (95, 255, 255))
    yellow_brown = cv2.inRange(hsv, (8, 60, 40), (25, 255, 230))
    mask = cv2.bitwise_or(green, yellow_brown)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n <= 1:
        return None
    idx = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, bw, bh, area = (int(v) for v in stats[idx])
    coverage = area / float(mask.shape[0] * mask.shape[1])
    if coverage < min_fraction:
        return None

    # Real leaves are mostly green even when diseased; reject brown/yellow-only regions.
    component = labels == idx
    green_ratio = float(np.count_nonzero(green[component])) / max(1, int(component.sum()))
    if green_ratio < min_green_ratio:
        return None

    # Expand a little and map back to full-resolution coordinates.
    sx, sy = w / mask.shape[1], h / mask.shape[0]
    mx, my = bw * margin, bh * margin
    x1 = int(max(0, (x - mx) * sx))
    y1 = int(max(0, (y - my) * sy))
    x2 = int(min(w, (x + bw + mx) * sx))
    y2 = int(min(h, (y + bh + my) * sy))
    if x2 - x1 < 32 or y2 - y1 < 32:
        return None
    return {"box": [x1, y1, x2, y2], "coverage": round(coverage, 4), "green_ratio": round(green_ratio, 3)}
