# Sonsuz Yankı

A fast, mobile-first 2D platformer dungeon crawler built with HTML5, Phaser 3 (CDN), and vanilla ES modules (no build step).

## Milestone Status: M4 — Chests and Passives

### What Was Built

#### M1 — Foundation
- **Scaling & orientation:** `1280x720` logical resolution with `Phaser.Scale.FIT` (`CENTER_BOTH`), safe-area inset padding, and portrait `"Please rotate your device"` overlay.
- **Mobile browser hardening:** Blocks page scrolling, pull-to-refresh, pinch/double-tap zoom, text selection, and long-press context menu.
- **Controls & Movement:** Multi-touch Left/Right + Jump buttons (`input.addPointer(3)`, haptics where supported), keyboard parity (`WASD` / Arrows + `Space`), variable jump height, coyote time (`100 ms`), and jump buffer (`120 ms`).

#### M2 — Combat Core
- **Enemies:** Slime (platform patrol with edge detection) and Bat (sine-wave flight), `0.5s` warning marker before spawning, up to `6` alive at once.
- **HP, Gold & Game Over:** `100` base Max HP, `800 ms` invulnerability blink, pooled coins (capped at `60`) with magnet pickup, and `"You died"` screen with a `500 ms` restart input guard.

#### M3 — Weapons
- **6 Weapon Types & 5 Rarities:** Rusty Sword, Dagger, Battle Axe, Short Bow, Magic Staff, and Boomerang generated via `createWeaponInstance` across Common–Legendary rarities with `Burn`, `Knockback`, and `Crit` affixes.
- **Ground Pickups & Compare Modal:** `10%` enemy drop chance, rarity glow + `1.5s` pickup cooldown, gameplay-pausing side-by-side compare modal (`EQUIP` / `LEAVE`, `Enter` / `Esc`), and active weapon HUD frame.

#### M4 — Chests and Passives
- **Chests (`src/entities/Chest.js`):**
  - 3 tiers: **Wooden (`30` gold)**, **Silver (`80` gold)**, and **Golden (`200` gold)** with floating coin + price bubbles.
  - Spawns on a random platform every `8` enemy kills (max `2` active chests at once, tier weights `60 / 30 / 10`).
  - Automatically opens when the player is within `70 px` with enough gold (`400 ms` anticipation shake -> light flash & radial particle burst -> item pops out); flashes red (throttled to `1s`) if unaffordable.
  - Loot roll per opening: `45%` weapon (uses existing ground pickup + compare card), `40%` passive, `15%` consumable, using per-tier rarity weights in `src/config/balance.js`.
- **9 Stacking Passives (`src/data/passives.js`, `player.stats`):**
  - **Common:** Heart Charm (`+20` max HP & heal `20`), Boots of Wind (`+12%` move speed), Magnet Ring (`+40` magnet radius).
  - **Uncommon:** Sharp Stone (`+15%` damage), Quick Gloves (`+15%` attack speed), Greedy Coin (`+25%` gold from enemies).
  - **Rare:** Thorn Armor (reflects `6` contact damage per stack), Spring Shoes (unlocks 1 extra air jump with a pooled puff effect, preserving coyote time, jump buffer, and variable jump height).
  - **Epic:** Vampire Fang (heals `1` HP per copy every `5` kills).
  - Legendary rolls automatically fall back to the nearest lower rarity with passives (`Epic`). All modifiers live in `player.stats` so `balance.js` is never mutated.
- **Consumables:** **Heal Orb** (restores `30%` max HP) and **Rage Orb** (`+40%` attack speed for `10s`, with a live countdown badge beside the HUD weapon frame).
- **HUD & Pooling:** Passive icon row under the weapon frame with `x2`-style stack badges; pooled `ItemPickup`s, pickup banner texts, chest flashes, and puff/burst particles.
- **Debug (`?debug=1`):** Press `G` (`+WPN`), `C` (`+CHEST`), or `V` (`+100G`), or tap the three on-screen debug buttons.

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

Then open **http://localhost:8080** (or **http://localhost:8080/?debug=1** for the debug overlay and `G` / `C` / `V` debug buttons) in your browser.

---

## How to Test on Your Phone Over Wi-Fi

1. Connect your **PC** and your **phone** to the **same Wi-Fi network**.
2. Start the local server on your PC bound to `0.0.0.0` using one of the commands above.
3. Find your PC's local IPv4 address in PowerShell:
   ```powershell
   ipconfig
   ```
   Look under **Wireless LAN adapter Wi-Fi** for **IPv4 Address**, e.g. `192.168.1.42`.
4. Open `http://192.168.1.42:8080` (or `http://192.168.1.42:8080/?debug=1`) on your phone's browser and rotate to **landscape**.

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

## Known Issues / Limitations (M4)
- **Audio is stubbed:** `AudioManager` provides no-op SFX hooks (including chest shake/open, item pickup, cant-afford, and double jump) until M6 per `GDD.md`.
- **iOS Safari haptics:** iOS Safari does not support `navigator.vibrate()`, so button vibration only triggers on supported browsers/devices.
- **Phaser CDN:** Phaser 3 loads from jsDelivr CDN until offline PWA packaging in M6.
