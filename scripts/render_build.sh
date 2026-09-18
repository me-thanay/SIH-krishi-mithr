#!/usr/bin/env bash
# Render Native Python build — requirements.txt includes CPU PyTorch.
set -euo pipefail
PIP_REQUIRE_HASHES=0 pip install --no-cache-dir --upgrade pip
PIP_REQUIRE_HASHES=0 pip install --no-cache-dir -r requirements.txt
