# Sonsuz Yankı

A fast, mobile-first 2D platformer dungeon crawler built with HTML5, Phaser 3 (CDN), and vanilla ES modules (no build step).

## Milestone Status: M5B — Line of Sight, Enemy Variety, Chest Cleanup

### What Was Built

#### M1 — Foundation
- **Scaling & orientation:** `1280x720` logical resolution with `Phaser.Scale.FIT` (`CENTER_BOTH`), safe-area inset padding, and portrait `"Please rotate your device"` overlay.
- **Controls & Movement:** Multi-touch Left/Right + Jump buttons (`input.addPointer(3)`), keyboard parity (`WASD` / Arrows + `Space`), variable jump height, coyote time (`100 ms`), and jump buffer (`120 ms`).

#### M2 — Combat Core
- **Core Combat, HP & Gold:** Slime (platform patrol) and Bat (sine-wave flight), `0.5s` spawn warning markers, `100` base Max HP with `800 ms` invulnerability blink, pooled coins (capped at `60`), and `"You died"` screen with a `500 ms` restart input guard.

#### M3 — Weapons
- **6 Weapon Types & 5 Rarities:** Rusty Sword, Dagger, Battle Axe, Short Bow, Magic Staff, and Boomerang generated via `createWeaponInstance` across Common–Legendary rarities with `Burn`, `Knockback`, and `Crit` affixes, `10%` enemy drop chance, and gameplay-pausing side-by-side compare modal (`EQUIP` / `LEAVE`).

#### M4 — Chests and Passives
- **Chest Entity & 9 Passives:** 3 chest tiers (Wooden `30`, Silver `80`, Golden `200`) with `45%` weapon / `40%` passive / `15%` consumable loot tables; 9 stacking passives via central `player.stats` (including Spring Shoes double jump), Heal Orb & Rage Orb consumables, and HUD passive stack icons.

#### M5A — Endless Rooms
- **RoomManager & 10 Validated Templates:** Single-screen rooms built from 10 validated templates with leak-free teardown, entry/exit doors, `400 ms` fade transitions (`1 s` spawn invulnerability), enemy quota & max-alive scaling, `1.5 s` room-clear coin magnet sweep, depth scaling, and 4 cycling dungeon palettes every 10 rooms.

#### M5B — Line of Sight, Enemy Variety, Chest Cleanup
- **Line of Sight (`src/systems/LineOfSight.js`):**
  - Liang-Barsky segment-vs-AABB checks against all room platforms and outer walls (supports arbitrary room dimensions for upcoming tall rooms), shrinking each obstacle by `2 px` to prevent false corner blocks.
  - Targets count as **visible** if at least one of 3 rays (center, upper third, lower third) is clear.
  - Enforced across auto-target selection, per-enemy melee hits (including sword/axe cleave), projectile hits, homing orb target acquisition, and Archer shots.
  - **Boomerang bounce:** Touching a platform or room wall on the outbound leg sparks and immediately switches the boomerang to its return leg (which also requires clear LoS to hit enemies).
- **Chest Cleanup:** Removed random chests from combat rooms and removed Treasure rooms (rooms `5, 10, 15, ...` are normal combat rooms). Kept `Chest`, loot tables, passives, and debug `C` / `V` keys for the upcoming Merchant (M5E).
- **New Enemies (`src/data/enemies.js`, `src/entities/Enemy.js`, `src/entities/Projectile.js`):**
  - **Archer** *(unlocks at depth 2 / Room 3)*: HP `18`, contact dmg `10`, gold `6–8`. Stays on platforms facing the player; within `520 px` and visible, flashes for `0.4 s` and fires a pooled enemy arrow every `2 s`.
  - **Charger** *(unlocks at depth 4 / Room 5)*: HP `40`, contact dmg `14`, gold `8–12`. Walks slowly (`70`) along platforms toward the player; within `380 px` at similar height with clear LoS, telegraphs for `0.5 s` (red flash + squash), dashes horizontally at `520` speed (up to `350 px`, stopping at walls and platform edges), then is stunned for `1 s`.
  - **Enemy Projectiles:** Pooled (max `20`), speed `320`, depth-scaled damage (`10 * (1 + 0.08 * depth)`), `3 s` lifetime, destroyed with a spark on platforms, walls, and player impact.
- **Debug (`?debug=1`):** Press `L` (or tap `LOS (L)`) to toggle live green (clear) / red (blocked) visibility rays from the player to the 3 nearest enemies; combine with `G`, `C`, `V`, `N`, and `?room=15`.

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

Then open **http://localhost:8080** (or **http://localhost:8080/?debug=1&room=5** to test Archers, Chargers, and `L` LoS rays immediately) in your browser.

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

## Known Issues / Limitations (M5B)
- **Audio is stubbed:** `AudioManager` provides no-op SFX hooks until M6 per `GDD.md`.
- **iOS Safari haptics:** iOS Safari does not support `navigator.vibrate()`, so button vibration only triggers on supported browsers/devices.
- **Phaser CDN:** Phaser 3 loads from jsDelivr CDN until offline PWA packaging in M6.
