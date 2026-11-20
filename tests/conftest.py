"""Load the pure-Python modules (engine, model, calibration) without Home Assistant installed."""
import importlib
import sys
import types
from pathlib import Path

PKG = Path(__file__).resolve().parents[1] / "custom_components" / "trigon"
pkg = types.ModuleType("trigon")
pkg.__path__ = [str(PKG)]
sys.modules["trigon"] = pkg
for name in ("engine", "model", "calibration"):
    importlib.import_module(f"trigon.{name}")
