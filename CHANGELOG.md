# Changelog

## 0.9.0 – first public release

- Position (floor, room, x/y) per person from Bermuda BLE data: weighted least-squares trilateration with proxy heights and floor levels.
- Fingerprinting from calibration points, blended with trilateration; best-fit floor detection with hysteresis.
- Per-proxy RSSI→distance calibration and per-phone offsets; leave-one-out quality per room.
- TriGON panel: Live, Calibration and Edit (floors, background plans with scale and known point, origin, rooms with wall dragging, 45°/90° snapping and wall lengths, proxies, people from Bermuda devices, YAML backup).
- Sensors per person and per room, occupancy binary sensors, map sensor for custom cards.
- Config entry with options (sidebar, update interval, phone height, max distance, away timeout, entity name language).
- English and Norwegian.
