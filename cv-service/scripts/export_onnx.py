"""Export a CLIP model's vision tower to a dynamic-int8 ONNX file.

Build/dev only: needs torch + transformers + onnx (requirements-export.txt).
At runtime the service serves the resulting file with onnxruntime; no torch.

Usage:
    python scripts/export_onnx.py
    python scripts/export_onnx.py --model openai/clip-vit-base-patch32
    python scripts/export_onnx.py --purge-cache   # drop the HF weight cache (Render build)
"""

from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL = "openai/clip-vit-base-patch32"


def onnx_path_for(hf_id: str) -> Path:
    """Single source of truth for the file naming (mirrored in app/embedding.py)."""
    return SERVICE_ROOT / "model" / f"{hf_id.replace('/', '__')}_int8.onnx"


def _purge_hf_cache(hf_id: str) -> None:
    hub = Path(os.environ.get("HF_HOME", Path.home() / ".cache" / "huggingface")) / "hub"
    target = hub / f"models--{hf_id.replace('/', '--')}"
    if target.is_dir():
        shutil.rmtree(target)
        print(f"purged {target}")


def export(hf_id: str, out: Path, purge_cache: bool) -> None:
    import torch
    from onnxruntime.quantization import QuantType, quantize_dynamic
    from torch import nn
    from transformers import CLIPModel

    class VisionTower(nn.Module):
        """vision_model + visual_projection — exactly CLIPModel.get_image_features."""

        def __init__(self, model: CLIPModel) -> None:
            super().__init__()
            self.vision_model = model.vision_model
            self.visual_projection = model.visual_projection

        def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
            feats = self.vision_model(pixel_values=pixel_values).pooler_output
            return self.visual_projection(feats)

    out.parent.mkdir(parents=True, exist_ok=True)
    fp32 = out.with_suffix(".fp32.onnx")

    print(f"loading {hf_id} ...")
    model = CLIPModel.from_pretrained(hf_id).eval()
    tower = VisionTower(model)

    print(f"exporting fp32 -> {fp32.name} ...")
    try:
        torch.onnx.export(
            tower,
            torch.zeros(1, 3, 224, 224),
            fp32.as_posix(),
            input_names=["pixel_values"],
            output_names=["embedding"],
            dynamic_axes={"pixel_values": {0: "batch"}, "embedding": {0: "batch"}},
            opset_version=17,
            dynamo=False,
        )
    except Exception as exc:  # legacy exporter removed in newer torch builds
        print(f"legacy exporter unavailable ({exc}); using dynamo exporter")
        torch.onnx.export(
            tower,
            torch.zeros(1, 3, 224, 224),
            fp32.as_posix(),
            input_names=["pixel_values"],
            output_names=["embedding"],
            dynamic_axes={"pixel_values": {0: "batch"}, "embedding": {0: "batch"}},
            opset_version=17,
        )
    del tower, model

    print("quantising weights to int8 (per-channel) ...")
    quantize_dynamic(
        fp32.as_posix(), out.as_posix(), weight_type=QuantType.QInt8, per_channel=True
    )
    fp32.unlink()

    if purge_cache:
        _purge_hf_cache(hf_id)

    print(f"done: {out} ({out.stat().st_size / 1e6:.0f} MB)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Hugging Face model id")
    parser.add_argument("--out", type=Path, default=None, help="output .onnx path")
    parser.add_argument(
        "--purge-cache", action="store_true", help="delete the downloaded HF weights afterwards"
    )
    args = parser.parse_args()
    export(args.model, args.out or onnx_path_for(args.model), args.purge_cache)


if __name__ == "__main__":
    main()
