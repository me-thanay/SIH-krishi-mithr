#!/usr/bin/env bash
# Render Native Python build — installs CPU PyTorch then API/ML deps.
set -euo pipefail
PIP_REQUIRE_HASHES=0 pip install --no-cache-dir --upgrade pip
PIP_REQUIRE_HASHES=0 pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
PIP_REQUIRE_HASHES=0 pip install --no-cache-dir -r requirements.render.txt
