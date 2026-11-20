// Loads the panel fresh every time, so changes to panel-main.js do not require a Home Assistant restart.
await import(new URL(`./panel-main.js?t=${Date.now()}`, import.meta.url));
