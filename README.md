# SkyDrift - Flight Club prototype

A small shared 3D flight arena. Open a host screen on a laptop or TV; up to four pilots join the exact room from a phone using its QR link. Each phone renders a first-person 3D view of its own aircraft.

This is a local prototype extending the original SkyDrift fork, not a deployed or production-ready service.

## Run locally

```sh
npm ci
npm run build
npm run dev
```

Requires Node.js 20 or newer. The client runs on port 3000 and the Colyseus WebSocket server on port 2567. For phones on local Wi-Fi, open `http://YOUR_LAPTOP_LAN_IP:3000` on the host computer first, not localhost. Permit both ports through the local firewall. The phone and host must be able to reach that address.

1. Open the host screen. It creates a separate room and displays a QR code.
2. Scan the QR on a phone, enter a callsign, and tap "Join as pilot".
3. Accept the landscape/fullscreen prompt or rotate manually. Left stick moves forward/back and left/right. Right stick turns and moves up/down. Release both sticks to hover. Reset returns to the spawn area.
4. The host can orbit and zoom the overview camera.

The advanced connection settings accept a WebSocket URL. HTTPS clients need a reachable `wss://` server. The QR link preserves the selected server and room ID.

## Changes

- Replaced sprawling terrain with a compact green island, hills, trees, sand, surrounding water and sky. Movement stays within a 600-by-600 unit area and a 240-unit ceiling.
- Four pilots plus one non-playing display per room.
- New responsive landing screen, shared overview, QR invitation panel, first-person phone cockpit and landscape/fullscreen prompt.
- Host creates a room; phones join by ID rather than entering arbitrary public matchmaking.
- Server-authoritative assisted RC movement, finite numeric input checks and a 500 ms stale movement reset.
- Neutral controls on pointer cancellation, focus loss and visibility changes.
- 3D rendering loads after joining on both the host and phones. Device pixel ratio is capped at 1.5 to reduce phone rendering load.
- Updated compatible dependencies and corrected inherited TypeScript build errors.

Controls are assisted arcade/RC flight with reversible forward movement, strafing, vertical movement and yaw, not realistic aerodynamic flight. Trees and hills are scenery; obstacle collisions, races and scoring are not implemented. No car mode or device-tilt controls are implemented.

## Verification

```sh
npx playwright install chromium
npm run test:prototype
```

The local browser/network smoke test exercises host creation, first-person phone joining, joystick interaction, server movement in all six directions, four-pilot capacity, independent rooms, second-host rejection, malformed input safety and disconnect cleanup. It saves UI screenshots under the path specified by `SCREENSHOT_DIR` (defaults to `/tmp/skydrift-screenshots`). Testing uses desktop Chromium with a mobile viewport, not real phone hardware. QR links are rendered; physical camera scanning is not tested.

## Before public hosting

- Upgrade the older Colyseus stack and resolve the remaining production audit findings. At prototype verification, `npm audit --omit=dev` reported one high and two moderate findings in the Colyseus/nanoid dependency chain. A major framework upgrade was not forced into this change.
- Add explicit allowed origins, rate limits, session controls and reconnect/resume behavior. Current room IDs act as casual invitations, not authenticated access control. Fullscreen and orientation lock are browser-dependent; a visible manual landscape prompt is provided.
- Deploy the server on a WebSocket-capable host and serve the frontend via HTTPS with a `wss://` endpoint. GitHub Pages alone cannot run this server.
- Test real iOS/Android multi-touch, physical QR scans, slow networks and sustained multiplayer play.
- Movement is clamped at the area boundaries; add visible boundary feedback and obstacle collisions. Host departure currently leaves the room active while pilots remain.

Original project licensing and attribution remain in `LICENSE`.
