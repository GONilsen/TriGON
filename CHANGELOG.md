# Changelog

## Unreleased

- Panel: one floor at a time with floor chips (Live also has "All floors", with a people count per floor). The choice is remembered per tab.
- Panel: zoom and pan on the map – buttons, mouse wheel, pinch with two fingers, and drag with one finger when zoomed in.
- Live view: dark "glow" map with glowing walls and pulsing occupied rooms, a radar pulse around each person, trails for the last minutes, and animated signal lines from the proxies that hear the selected person.
- People show their Home Assistant profile picture when the person can be matched (via the BLE tracker or name).
- New dashboard card `custom:trigon-card` (loaded automatically, with a visual editor) and a one-click «Where are we» dashboard from the panel.
- `sensor.trigon_map` has new attributes `plans` (background placement) and `person` per person.
- Calibration/Edit: person dots no longer block taps, so you can pick a calibration point where your own dot is.

## 0.9.2

- Entities no longer belong to a «TriGON» device, so names stay «Room - People» / «Name - Position» (newer HA prefixes the device name).
- New option: language for entity names (auto, English, Norwegian).
- Leftover devices from older versions can be deleted.

## 0.9.1

- Manifest categories (presence_location.trackers, sensors.motion_presence).
- Brand images are shipped in `brand/` (shown by Home Assistant 2026.3+); removed dark icons identical to the light ones.

## 0.9.0 – first public release

- Position (floor, room, x/y) per person from Bermuda BLE data: weighted least-squares trilateration with proxy heights and floor levels.
- Fingerprinting from calibration points, blended with trilateration; best-fit floor detection with hysteresis.
- Per-proxy RSSI→distance calibration and per-phone offsets; leave-one-out quality per room.
- TriGON panel: Live, Calibration and Edit (floors, background plans with scale and known point, origin, rooms with wall dragging, 45°/90° snapping and wall lengths, proxies, people from Bermuda devices, YAML backup).
- Sensors per person and per room, occupancy binary sensors, map sensor for custom cards.
- Config entry with options (sidebar, update interval, phone height, max distance, away timeout, entity name language).
- English and Norwegian.
