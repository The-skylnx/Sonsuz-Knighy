# Sonsuz Yankı

A fast, mobile-first 2D platformer dungeon crawler built with HTML5, Phaser 3 (CDN), and vanilla ES modules (no build step).

## Milestone Status: M5A — Endless Rooms

### What Was Built

#### M1 — Foundation
- **Scaling & orientation:** `1280x720` logical resolution with `Phaser.Scale.FIT` (`CENTER_BOTH`), safe-area inset padding, and portrait `"Please rotate your device"` overlay.
- **Mobile browser hardening:** Blocks page scrolling, pull-to-refresh, pinch/double-tap zoom, text selection, and long-press context menu.
- **Controls & Movement:** Multi-touch Left/Right + Jump buttons (`input.addPointer(3)`, haptics where supported), keyboard parity (`WASD` / Arrows + `Space`), variable jump height, coyote time (`100 ms`), and jump buffer (`120 ms`).

#### M2 — Combat Core
- **Enemies, HP & Gold:** Slime (platform patrol with edge detection) and Bat (sine-wave flight), `0.5s` spawn warning markers, `100` base Max HP with `800 ms` invulnerability blink, pooled coins (capped at `60`), and `"You died"` screen with a `500 ms` restart input guard.

#### M3 — Weapons
- **6 Weapon Types & 5 Rarities:** Rusty Sword, Dagger, Battle Axe, Short Bow, Magic Staff, and Boomerang generated via `createWeaponInstance` across Common–Legendary rarities with `Burn`, `Knockback`, and `Crit` affixes, `10%` enemy drop chance, and gameplay-pausing side-by-side compare modal (`EQUIP` / `LEAVE`).

#### M4 — Chests and Passives
- **3 Chest Tiers & 9 Passives:** Wooden (`30`), Silver (`80`), and Golden (`200`) chests auto-opening within `70 px` (`45%` weapon / `40%` passive / `15%` consumable); 9 stacking passives via central `player.stats` (including Spring Shoes double jump), Heal Orb & Rage Orb consumables, and HUD passive stack icons.

#### M5A — Endless Rooms
- **RoomManager & 10 Validated Templates (`src/systems/RoomManager.js`, `src/data/roomTemplates.js`):**
  - Builds single-screen rooms from 10 hand-authored platform templates and tears down previous rooms leak-free by clearing a single reusable static physics group and releasing all active object pools (`coins`, `projectiles`, `pickups`, `FX`, `texts`).
  - Includes `validateRoomTemplates()` checking `<= 95 px` vertical steps, `<= 150 px` horizontal gaps, door keep-out zones, and unobstructed ground paths (runs once at startup under `?debug=1`).
- **Doors & Fast Transitions:**
  - Decorative left entry door and stateful right exit door (red with iron bars while locked; glowing green with right arrow once cleared).
  - Walking into the open exit door triggers a `400 ms` transition (`200 ms` fade out -> room rebuild -> `200 ms` fade in) with `1 s` spawn invulnerability while touch controls remain active.
- **Combat & Treasure Rooms + Quota Spawner:**
  - **Combat rooms:** Quota `3 + floor(depth * 0.6)` enemies with max alive `min(12, 4 + floor(depth / 4))` and a `30%` chance of 1 chest (`70 / 25 / 5` tier weights). On room clear, all remaining coins magnetize to the player for `1.5 s` before the exit door unlocks.
  - **Treasure rooms (every 5th room: 5, 10, 15, ...):** No enemies, `1–3` chests (`20 / 55 / 25` tier weights), exit door open immediately.
- **Depth Scaling & Cycling Palettes:**
  - `depth = roomNumber - 1` scales enemy HP (`+12%/depth`), contact damage (`+8%/depth`), gold drops (`+6%/depth`), chest prices (`+10%/depth`), and weapon damage (`+8%/depth`).
  - Cycles through 4 dungeon color palettes every 10 rooms (`Crypt Slate`, `Mossy Catacombs`, `Ember Forge`, `Astral Sanctum`).
- **Projectile Collisions:** Arrows and homing magic orbs spark and despawn on hitting platforms or room walls, while boomerangs pass cleanly through platforms.
- **HUD, Summary & Debug:** Top-center `"Room N"` counter, `1.5 s` room entry banner (`"Room N"` or `"Treasure Room"`), `"Room reached: N"` on Game Over (restart resets to Room 1), `?room=15` URL start parameter, and `N` / `CLEAR (N)` under `?debug=1` to clear the room and open the exit door immediately.

---

## How to Run Locally

Because the game uses ES modules (`<script type="module">`), open it through a local HTTP server rather than `file://`.

Open PowerShell or a terminal in this project folder and run **one** of the following commands:

### Option A — Node.js (`npx`, recommended)
```powershell
npx http-server . -p 8080 -a 0.0.0.0 -c-1
```

### Option B — Python (alternative)
```powershell
python -m http.server 8080 --bind 0.0.0.0
```

Then open **http://localhost:8080** (or **http://localhost:8080/?debug=1&room=15** to test debug tools starting at Room 15) in your browser.

---

## How to Test on Your Phone Over Wi-Fi

1. Connect your **PC** and your **phone** to the **same Wi-Fi network**.
2. Start the local server on your PC bound to `0.0.0.0` using one of the commands above.
3. Find your PC's local IPv4 address in PowerShell:
   ```powershell
   ipconfig
   ```
   Look under **Wireless LAN adapter Wi-Fi** for **IPv4 Address**, e.g. `192.168.1.42`.
4. Open `http://192.168.1.42:8080` on your phone's browser and rotate to **landscape**.

> **Troubleshooting:** If the page does not load on your phone, ensure your Windows network profile is **Private** or allow incoming port `8080` in **Windows Defender Firewall**.

---

## Publishing

After each milestone, commit and push changes to `origin main`:

```powershell
git add -A
git commit -m "<milestone>: <short summary>"
git push
```

---

## Known Issues / Limitations (M5A)
- **Audio is stubbed:** `AudioManager` provides no-op SFX hooks until M6 per `GDD.md`.
- **iOS Safari haptics:** iOS Safari does not support `navigator.vibrate()`, so button vibration only triggers on supported browsers/devices.
- **Phaser CDN:** Phaser 3 loads from jsDelivr CDN until offline PWA packaging in M6.
