"""Materialise a cloned git repo whose file names are invalid on Windows.

Some dataset repos (PlantDoc, PlantDoc-OD) contain names with `?`, `*`, `:` or > 255 chars,
so `git clone` downloads the pack but fails on checkout. This writes every blob from HEAD
directly, sanitising names, and stores the original->safe mapping in `_name_map.json`.

Usage:
    git clone --depth 1 <url> <dir>          # checkout error is expected
    python ml/tools/safe_checkout.py <dir>
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

BAD = re.compile(r'[<>:"|?*]')
MAX_NAME = 100


def main(repo: Path) -> None:
    repo = repo.resolve()
    entries = subprocess.run(
        ["git", "-C", str(repo), "ls-tree", "-r", "HEAD"], capture_output=True, text=True, check=True
    ).stdout.splitlines()

    items: list[tuple[str, str, Path]] = []
    name_map: dict[str, str] = {}
    for line in entries:
        meta, path = line.split("\t", 1)
        sha = meta.split()[2]
        safe = BAD.sub("_", path)
        parent, name = safe.rsplit("/", 1) if "/" in safe else ("", safe)
        if len(name) > MAX_NAME:
            stem, ext = (name.rsplit(".", 1) + [""])[:2]
            name = f"{stem[:MAX_NAME - 20]}_{sha[:8]}" + (f".{ext}" if ext else "")
        safe = f"{parent}/{name}" if parent else name
        if safe != path:
            name_map[path] = safe
        items.append((sha, path, repo / safe))

    print(f"{len(items)} files, {len(name_map)} renamed")
    proc = subprocess.Popen(
        ["git", "-C", str(repo), "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE
    )
    assert proc.stdin and proc.stdout
    written = 0
    for sha, original, dst in items:
        if dst.exists():
            continue
        proc.stdin.write((sha + "\n").encode())
        proc.stdin.flush()
        header = proc.stdout.readline().decode().split()
        if len(header) != 3:
            print(f"missing blob for {original}")
            continue
        data = proc.stdout.read(int(header[2]))
        proc.stdout.read(1)
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(data)
        written += 1
    proc.stdin.close()
    proc.wait()
    (repo / "_name_map.json").write_text(json.dumps(name_map, indent=1))
    print(f"written {written}; mapping saved to {repo / '_name_map.json'}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
