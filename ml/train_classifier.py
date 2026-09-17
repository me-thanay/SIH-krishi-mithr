"""Fine-tune EfficientNetV2-S (ImageNet pretrained) on an ImageFolder dataset.

Used for both stage-2 classifiers of the diagnosis pipeline:
    PlantDoc leaf disease  (ml/train_plantdoc.py wrapper)
    IP102 pest species     python ml/train_classifier.py --data ml/datasets/ip102_cls_cache --tag ip102 \
                               --class-names ml/datasets/ip102_cls_cache/classes.json --img-size 224 --eval-size 256

Expects <data>/train/<class>/*.jpg and <data>/test/<class>/*.jpg. If <data>/val exists it is used
for model selection, otherwise a stratified slice of train is held out.

Outputs (ml/models/):
    <tag>_efficientnet_v2_s.pt   checkpoint with weights + class metadata
    <tag>_labels.json            class index -> folder / name (+ plant / disease for PlantDoc)
    <tag>_metrics.json           val/test accuracy, macro-F1, per-class report
    <tag>_confusion_matrix.png   test-split confusion matrix
    <tag>_training_log.csv       per-epoch loss / accuracy
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset, Subset
from torchvision import datasets, transforms
from torchvision.models import EfficientNet_V2_S_Weights, efficientnet_v2_s

from plantdoc_common import (
    CACHE_DIR,
    IMAGENET_MEAN,
    IMAGENET_STD,
    MODEL_DIR,
    describe_class,
)


# ----------------------------------------------------------------------------- data


def build_transforms(img_size: int, eval_size: int, trivial_augment: bool = True):
    aug = [
        transforms.RandomResizedCrop(img_size, scale=(0.55, 1.0), ratio=(0.8, 1.25)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
    ]
    if trivial_augment:
        aug.append(transforms.TrivialAugmentWide())
    else:
        aug += [
            transforms.RandomRotation(25),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.03),
        ]
    train_tf = transforms.Compose(
        aug
        + [
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
            transforms.RandomErasing(p=0.25, scale=(0.02, 0.15)),
        ]
    )
    eval_tf = transforms.Compose(
        [
            transforms.Resize(int(eval_size * 1.14)),
            transforms.CenterCrop(eval_size),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )
    return train_tf, eval_tf


class RemappedTest(Dataset):
    """PlantDoc test folder mapped onto the train class indices; unknown classes are dropped."""

    def __init__(self, root: Path, train_classes: list[str], transform):
        self.samples: list[tuple[Path, int]] = []
        self.transform = transform
        class_to_idx = {c: i for i, c in enumerate(train_classes)}
        skipped: dict[str, int] = {}
        for class_dir in sorted(p for p in root.iterdir() if p.is_dir()):
            idx = class_to_idx.get(class_dir.name)
            files = [p for p in class_dir.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
            if idx is None:
                skipped[class_dir.name] = len(files)
                continue
            self.samples += [(p, idx) for p in files]
        if skipped:
            print(f"Test classes not present in train (skipped): {skipped}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, i):
        path, label = self.samples[i]
        img = datasets.folder.default_loader(str(path))
        return self.transform(img), label


def stratified_split(targets: list[int], val_fraction: float, seed: int):
    rng = random.Random(seed)
    by_class: dict[int, list[int]] = {}
    for i, t in enumerate(targets):
        by_class.setdefault(t, []).append(i)
    train_idx, val_idx = [], []
    for indices in by_class.values():
        rng.shuffle(indices)
        n_val = max(1, int(round(len(indices) * val_fraction))) if len(indices) > 3 else 0
        val_idx += indices[:n_val]
        train_idx += indices[n_val:]
    return train_idx, val_idx


# ----------------------------------------------------------------------------- model


def build_model(num_classes: int, dropout: float = 0.3, stochastic_depth: float = 0.2) -> nn.Module:
    model = efficientnet_v2_s(weights=EfficientNet_V2_S_Weights.IMAGENET1K_V1, stochastic_depth_prob=stochastic_depth)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=dropout, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    return model


def set_backbone_trainable(model: nn.Module, trainable: bool) -> None:
    for p in model.features.parameters():
        p.requires_grad = trainable


# ----------------------------------------------------------------------------- loops


@torch.no_grad()
def evaluate(model, loader, device, criterion=None):
    model.eval()
    total, correct, top3, loss_sum = 0, 0, 0, 0.0
    all_preds, all_targets = [], []
    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)
        with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=device.type == "cuda"):
            logits = model(images)
        if criterion is not None:
            loss_sum += criterion(logits.float(), targets).item() * targets.size(0)
        preds = logits.argmax(1)
        correct += (preds == targets).sum().item()
        top3 += (logits.topk(3, dim=1).indices == targets[:, None]).any(1).sum().item()
        total += targets.size(0)
        all_preds.append(preds.cpu())
        all_targets.append(targets.cpu())
    preds = torch.cat(all_preds).numpy() if all_preds else np.array([])
    targets = torch.cat(all_targets).numpy() if all_targets else np.array([])
    return {
        "loss": loss_sum / max(total, 1),
        "acc": correct / max(total, 1),
        "top3": top3 / max(total, 1),
        "preds": preds,
        "targets": targets,
    }


def mix_batch(images, targets, num_classes, mixup_alpha, cutmix_alpha, prob):
    """Apply Mixup or CutMix (chosen 50/50) to a batch; returns images and soft targets."""
    soft = nn.functional.one_hot(targets, num_classes).float()
    if prob <= 0 or random.random() > prob or (mixup_alpha <= 0 and cutmix_alpha <= 0):
        return images, soft
    perm = torch.randperm(images.size(0), device=images.device)
    use_cutmix = cutmix_alpha > 0 and (mixup_alpha <= 0 or random.random() < 0.5)
    if use_cutmix:
        lam = float(np.random.beta(cutmix_alpha, cutmix_alpha))
        h, w = images.shape[-2:]
        cut_ratio = math.sqrt(1.0 - lam)
        ch, cw = int(h * cut_ratio), int(w * cut_ratio)
        cy, cx = random.randint(0, h - 1), random.randint(0, w - 1)
        y1, y2 = max(cy - ch // 2, 0), min(cy + ch // 2, h)
        x1, x2 = max(cx - cw // 2, 0), min(cx + cw // 2, w)
        images = images.clone()
        images[:, :, y1:y2, x1:x2] = images[perm][:, :, y1:y2, x1:x2]
        lam = 1.0 - ((y2 - y1) * (x2 - x1) / (h * w))
    else:
        lam = float(np.random.beta(mixup_alpha, mixup_alpha))
        images = lam * images + (1.0 - lam) * images[perm]
    soft = lam * soft + (1.0 - lam) * soft[perm]
    return images, soft


def train_one_epoch(model, loader, optimizer, scheduler, scaler, criterion, device, mix_cfg=None):
    model.train()
    total, correct, loss_sum = 0, 0, 0.0
    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)
        loss_targets = targets
        if mix_cfg:
            images, loss_targets = mix_batch(images, targets, **mix_cfg)
        optimizer.zero_grad(set_to_none=True)
        with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=device.type == "cuda"):
            logits = model(images)
            loss = criterion(logits, loss_targets)
        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        nn.utils.clip_grad_norm_(model.parameters(), 5.0)
        scaler.step(optimizer)
        scaler.update()
        if scheduler is not None:
            scheduler.step()
        loss_sum += loss.item() * targets.size(0)
        correct += (logits.argmax(1) == targets).sum().item()
        total += targets.size(0)
    return loss_sum / total, correct / total


def cosine_with_warmup(optimizer, warmup_steps: int, total_steps: int):
    def lr_lambda(step: int):
        if step < warmup_steps:
            return (step + 1) / warmup_steps
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1 + math.cos(math.pi * min(1.0, progress)))

    return torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)


# ----------------------------------------------------------------------------- main


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=CACHE_DIR, help="root with train/ [val/] test/ ImageFolders")
    parser.add_argument("--tag", default="plantdoc", help="prefix for artifacts in ml/models/")
    parser.add_argument("--class-names", type=Path, default=None,
                        help="optional JSON {folder_name: human name}; PlantDoc names are derived automatically")
    parser.add_argument("--img-size", type=int, default=300, help="train crop size (EfficientNetV2-S recipe: 300)")
    parser.add_argument("--eval-size", type=int, default=384, help="eval/inference size (recipe: 384)")
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--epochs", type=int, default=30, help="full fine-tuning epochs")
    parser.add_argument("--head-epochs", type=int, default=2, help="classifier-only warm-up epochs")
    parser.add_argument("--lr", type=float, default=2e-4, help="backbone LR during fine-tuning")
    parser.add_argument("--head-lr", type=float, default=1e-3)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--label-smoothing", type=float, default=0.1)
    parser.add_argument("--dropout", type=float, default=0.3)
    parser.add_argument("--stochastic-depth", type=float, default=0.2)
    parser.add_argument("--mixup", type=float, default=0.0, help="Mixup alpha (0 disables)")
    parser.add_argument("--cutmix", type=float, default=0.0, help="CutMix alpha (0 disables)")
    parser.add_argument("--mix-prob", type=float, default=0.8, help="probability of mixing a batch")
    parser.add_argument("--no-trivial-augment", action="store_true", help="use rotation+colour jitter instead")
    parser.add_argument("--val-fraction", type=float, default=0.15)
    parser.add_argument("--patience", type=int, default=8)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--device", default=None, help="cuda, cpu, or omit to auto-detect")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=Path, default=None, help="default ml/models/<tag>_efficientnet_v2_s.pt")
    args = parser.parse_args()
    if args.out is None:
        args.out = MODEL_DIR / f"{args.tag}_efficientnet_v2_s.pt"
    if args.class_names is None and (args.data / "classes.json").exists():
        args.class_names = args.data / "classes.json"
    human_names: dict[str, str] | None = (
        {str(k): str(v) for k, v in json.loads(args.class_names.read_text()).items()} if args.class_names else None
    )

    def artifact(suffix: str) -> Path:
        return MODEL_DIR / f"{args.tag}_{suffix}"

    torch.manual_seed(args.seed)
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.backends.cudnn.benchmark = True

    if args.device:
        device = torch.device(args.device)
    else:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}" + (f" ({torch.cuda.get_device_name(0)})" if device.type == "cuda" else ""))

    train_root, val_root, test_root = args.data / "train", args.data / "val", args.data / "test"
    if not train_root.exists():
        raise SystemExit(f"{train_root} missing. Run the matching ml/prepare_*.py first.")

    train_tf, eval_tf = build_transforms(args.img_size, args.eval_size, not args.no_trivial_augment)
    full_train = datasets.ImageFolder(train_root, transform=train_tf)
    classes = full_train.classes
    num_classes = len(classes)

    if val_root.exists():
        train_ds: Dataset = full_train
        val_ds: Dataset = RemappedTest(val_root, classes, eval_tf)
    else:
        full_train_eval = datasets.ImageFolder(train_root, transform=eval_tf)
        train_idx, val_idx = stratified_split(full_train.targets, args.val_fraction, args.seed)
        train_ds = Subset(full_train, train_idx)
        val_ds = Subset(full_train_eval, val_idx)
    test_ds = RemappedTest(test_root, classes, eval_tf)
    print(f"Classes: {num_classes} | train {len(train_ds)} | val {len(val_ds)} | test {len(test_ds)}")

    loader_kwargs = dict(
        num_workers=args.workers,
        pin_memory=device.type == "cuda",
        persistent_workers=args.workers > 0,
    )
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, drop_last=True, **loader_kwargs)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size * 2, shuffle=False, **loader_kwargs)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size * 2, shuffle=False, **loader_kwargs)

    # NOTE: channels_last is deliberately not used; it is ~10x slower for EfficientNetV2 on some
    # consumer GPUs / cuDNN builds (measured 4 img/s vs 41 img/s on an RTX 3050).
    model = build_model(num_classes, args.dropout, args.stochastic_depth).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=args.label_smoothing)
    mix_cfg = (
        dict(num_classes=num_classes, mixup_alpha=args.mixup, cutmix_alpha=args.cutmix, prob=args.mix_prob)
        if (args.mixup > 0 or args.cutmix > 0)
        else None
    )
    scaler = torch.amp.GradScaler(enabled=device.type == "cuda")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    log_path = artifact("training_log.csv")
    log_file = open(log_path, "w", newline="")
    log = csv.writer(log_file)
    log.writerow(["phase", "epoch", "train_loss", "train_acc", "val_loss", "val_acc", "val_top3", "lr", "seconds"])

    best_acc, best_state, bad_epochs = -1.0, None, 0

    def maybe_save(phase: str, epoch: int, val: dict):
        nonlocal best_acc, best_state, bad_epochs
        if val["acc"] > best_acc:
            best_acc = val["acc"]
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            bad_epochs = 0
            print(f"  new best val acc {best_acc:.4f} ({phase} epoch {epoch})")
        else:
            bad_epochs += 1

    # Phase 1: train only the new classifier head so the pretrained features are not disturbed.
    if args.head_epochs > 0:
        set_backbone_trainable(model, False)
        head_opt = torch.optim.AdamW(model.classifier.parameters(), lr=args.head_lr, weight_decay=args.weight_decay)
        for epoch in range(1, args.head_epochs + 1):
            t0 = time.time()
            tr_loss, tr_acc = train_one_epoch(model, train_loader, head_opt, None, scaler, criterion, device)
            val = evaluate(model, val_loader, device, criterion)
            dt = time.time() - t0
            print(f"[head {epoch}/{args.head_epochs}] loss {tr_loss:.3f} acc {tr_acc:.3f} | "
                  f"val loss {val['loss']:.3f} acc {val['acc']:.3f} top3 {val['top3']:.3f} | {dt:.0f}s")
            log.writerow(["head", epoch, f"{tr_loss:.4f}", f"{tr_acc:.4f}", f"{val['loss']:.4f}",
                          f"{val['acc']:.4f}", f"{val['top3']:.4f}", args.head_lr, f"{dt:.0f}"])
            maybe_save("head", epoch, val)

    # Phase 2: unfreeze everything, discriminative LRs, cosine schedule with warm-up.
    set_backbone_trainable(model, True)
    bad_epochs = 0
    optimizer = torch.optim.AdamW(
        [
            {"params": model.features.parameters(), "lr": args.lr},
            {"params": model.classifier.parameters(), "lr": args.lr * 5},
        ],
        weight_decay=args.weight_decay,
    )
    steps_per_epoch = len(train_loader)
    scheduler = cosine_with_warmup(optimizer, warmup_steps=steps_per_epoch, total_steps=steps_per_epoch * args.epochs)

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        tr_loss, tr_acc = train_one_epoch(model, train_loader, optimizer, scheduler, scaler, criterion, device, mix_cfg)
        val = evaluate(model, val_loader, device, criterion)
        dt = time.time() - t0
        lr_now = optimizer.param_groups[0]["lr"]
        print(f"[ft {epoch}/{args.epochs}] loss {tr_loss:.3f} acc {tr_acc:.3f} | "
              f"val loss {val['loss']:.3f} acc {val['acc']:.3f} top3 {val['top3']:.3f} | lr {lr_now:.2e} | {dt:.0f}s")
        log.writerow(["finetune", epoch, f"{tr_loss:.4f}", f"{tr_acc:.4f}", f"{val['loss']:.4f}",
                      f"{val['acc']:.4f}", f"{val['top3']:.4f}", f"{lr_now:.2e}", f"{dt:.0f}"])
        log_file.flush()
        maybe_save("finetune", epoch, val)
        if bad_epochs >= args.patience:
            print(f"Early stopping: no val improvement for {args.patience} epochs.")
            break

    log_file.close()

    # Final evaluation of the best checkpoint on the untouched test split.
    model.load_state_dict(best_state)
    test = evaluate(model, test_loader, device, criterion)
    print(f"\nBest val acc {best_acc:.4f} | TEST acc {test['acc']:.4f} top3 {test['top3']:.4f}")

    from sklearn.metrics import classification_report, confusion_matrix, f1_score

    display_names = {c: (human_names.get(c, c) if human_names else c) for c in classes}
    report = classification_report(
        test["targets"], test["preds"], labels=list(range(num_classes)),
        target_names=[display_names[c] for c in classes], output_dict=True, zero_division=0,
    )
    macro_f1 = f1_score(test["targets"], test["preds"], average="macro")
    print(f"TEST macro-F1 {macro_f1:.4f}")

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        cm = confusion_matrix(test["targets"], test["preds"], labels=list(range(num_classes)))
        tick_names = [display_names[c] for c in classes]
        big = num_classes > 40
        fig, ax = plt.subplots(figsize=(18, 16) if big else (14, 12))
        ax.imshow(cm / np.maximum(cm.sum(1, keepdims=True), 1) if big else cm, cmap="Greens")
        ax.set_xticks(range(num_classes)); ax.set_yticks(range(num_classes))
        ax.set_xticklabels(tick_names, rotation=90, fontsize=5 if big else 8)
        ax.set_yticklabels(tick_names, fontsize=5 if big else 8)
        ax.set_xlabel("Predicted"); ax.set_ylabel("True")
        ax.set_title(f"{args.tag} test — EfficientNetV2-S (acc {test['acc']:.3f}, macro-F1 {macro_f1:.3f})")
        if not big:
            for i in range(num_classes):
                for j in range(num_classes):
                    if cm[i, j]:
                        ax.text(j, i, cm[i, j], ha="center", va="center", fontsize=6)
        fig.tight_layout()
        fig.savefig(artifact("confusion_matrix.png"), dpi=150)
    except Exception as exc:
        print(f"Could not render confusion matrix: {exc}")

    class_info = []
    for i, c in enumerate(classes):
        if human_names is not None:
            class_info.append({"index": i, "folder": c, "name": human_names.get(c, c), "plant": None, "disease": None})
        else:
            plant, disease = describe_class(c)
            class_info.append({"index": i, "folder": c, "name": f"{plant} - {disease}", "plant": plant, "disease": disease})
    checkpoint = {
        "tag": args.tag,
        "arch": "efficientnet_v2_s",
        "img_size": args.eval_size,
        "train_size": args.img_size,
        "mean": IMAGENET_MEAN,
        "std": IMAGENET_STD,
        "classes": classes,
        "class_info": class_info,
        "model_state": {k: v.half() if v.is_floating_point() else v for k, v in best_state.items()},
        "metrics": {"val_acc": best_acc, "test_acc": test["acc"], "test_top3": test["top3"], "test_macro_f1": macro_f1},
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    torch.save(checkpoint, args.out)
    artifact("labels.json").write_text(json.dumps(class_info, indent=2))
    artifact("metrics.json").write_text(json.dumps(
        {**checkpoint["metrics"], "per_class": report, "args": {k: str(v) for k, v in vars(args).items()}}, indent=2))
    print(f"Saved model to {args.out}")


if __name__ == "__main__":
    main()
