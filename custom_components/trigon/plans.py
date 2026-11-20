"""Background floor plans per floor: stored privately in .storage and only served to logged-in users."""

from __future__ import annotations

import re
from pathlib import Path

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN
MAX_BYTES = 15 * 1024 * 1024
TYPES = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
FLOOR_RE = re.compile(r"^[a-z0-9_\-]{1,40}$")


class Plans:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.store = Store(hass, 1, f"{DOMAIN}.plans")
        self.dir = Path(hass.config.path(".storage", f"{DOMAIN}_plans"))
        self.meta: dict[str, dict] = {}

    async def async_load(self) -> None:
        self.meta = (await self.store.async_load()) or {}

    def save(self) -> None:
        self.store.async_delay_save(lambda: self.meta, 1)

    def path(self, floor: str) -> Path | None:
        m = self.meta.get(floor)
        return self.dir / m["file"] if m else None

    async def async_put(self, floor: str, data: bytes, ctype: str, width: int, height: int) -> dict:
        ext = TYPES[ctype]
        fname = f"{floor}.{ext}"

        def _write() -> None:
            self.dir.mkdir(parents=True, exist_ok=True)
            for old in self.dir.glob(f"{floor}.*"):
                old.unlink()
            (self.dir / fname).write_bytes(data)

        await self.hass.async_add_executor_job(_write)
        old = self.meta.get(floor, {})
        # Keep the placement if an image of the same size is replaced, otherwise start at 2 cm per pixel
        same = old.get("width") == width and old.get("height") == height
        self.meta[floor] = {
            "file": fname, "type": ctype, "width": width, "height": height,
            "scale": old.get("scale", 0.02) if same else 0.02,
            "x": old.get("x", 0.0) if same else 0.0,
            "y": old.get("y", 0.0) if same else 0.0,
            "opacity": old.get("opacity", 0.5),
            "v": int(old.get("v", 0)) + 1,
        }
        self.save()
        return self.meta[floor]

    async def async_delete(self, floor: str) -> None:
        p = self.path(floor)
        if p:
            await self.hass.async_add_executor_job(lambda: p.unlink(missing_ok=True))
        self.meta.pop(floor, None)
        self.save()

    def set_transform(self, floor: str, **kw) -> dict | None:
        m = self.meta.get(floor)
        if not m:
            return None
        for k in ("scale", "x", "y", "opacity"):
            if kw.get(k) is not None:
                m[k] = float(kw[k])
        self.save()
        return m


class PlanView(HomeAssistantView):
    url = f"/api/{DOMAIN}/plan/{{floor}}"
    name = f"api:{DOMAIN}:plan"
    requires_auth = True

    def __init__(self) -> None:
        self._plans = None
        self._hass = None

    @property
    def plans(self) -> Plans:
        return self._plans or self._hass.data[DOMAIN].plans

    def _sett_hass(self, request: web.Request) -> bool:
        self._hass = request.app["hass"]
        return DOMAIN in self._hass.data or self._plans is not None

    async def get(self, request: web.Request, floor: str) -> web.StreamResponse:
        if not self._sett_hass(request):
            return web.Response(status=503)
        p = self.plans.path(floor)
        if not p or not FLOOR_RE.match(floor):
            return web.Response(status=404)
        if not await request.app["hass"].async_add_executor_job(p.exists):
            return web.Response(status=404)
        return web.FileResponse(p, headers={"Cache-Control": "no-store",
                                            "Content-Type": self.plans.meta[floor]["type"]})

    async def post(self, request: web.Request, floor: str) -> web.Response:
        if not self._sett_hass(request):
            return web.Response(status=503)
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return web.Response(status=403)
        if not FLOOR_RE.match(floor):
            return web.Response(status=400, text="Invalid floor")
        ctype = request.content_type
        if ctype not in TYPES:
            return web.Response(status=415, text="Only PNG, JPEG or WebP")
        if request.content_length and request.content_length > MAX_BYTES:
            return web.Response(status=413, text="Image too large (max 15 MB)")
        data = await request.read()  # whole body (content.read(n) may return only the first chunk)
        if len(data) > MAX_BYTES:
            return web.Response(status=413, text="Image too large (max 15 MB)")
        try:
            width = int(request.query.get("w", 0))
            height = int(request.query.get("h", 0))
        except ValueError:
            width = height = 0
        meta = await self.plans.async_put(floor, data, ctype, width, height)
        return self.json(meta)

    async def delete(self, request: web.Request, floor: str) -> web.Response:
        if not self._sett_hass(request):
            return web.Response(status=503)
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return web.Response(status=403)
        await self.plans.async_delete(floor)
        return self.json({"ok": True})
