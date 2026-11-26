# GAME DESIGN DOCUMENT: Sonsuz Yankı

Version: 0.4 (M1-M5A complete, M5B next)
Engine/Stack: HTML5 + Phaser 3 (CDN), vanilla JS (ES modules), no build step required
Primary targets: phones and tablets (landscape), desktop browser as secondary

> RULE FOR THE AI AGENT: This document is the source of truth. Build ONLY the milestone requested in the current prompt. Do not implement features from later milestones early. Keep all gameplay numbers in `src/config/balance.js` (data-driven), never hard-coded inside scenes.

---

## 0. Project Status and Implementation Notes

- **Game name:** Sonsuz Yankı.
- **M1 Foundation: DONE. M2 Combat core: DONE. M3 Weapons: DONE. M4 Chests and passives: DONE. M5A Endless rooms: DONE.** Do not rewrite these systems; extend them.
- **Scenes:** BootScene (placeholder textures), GameScene (gameplay + fast 400 ms room transitions), UIScene (HUD + top-center `"Room N"` + 1.5 s room banner + weapon compare modal + passive icon row + Rage buff timer, runs in parallel with GameScene), GameOverScene (`"Room reached: N"`, 500 ms input lock, resets run to Room 1).
- **Entities:** Player (central `player.stats` and Spring Shoes double jump), Enemy (Slime, Bat, depth-scaled HP/damage/gold, `knockbackTimer` and Burn DoT), Chest (Wooden, Silver, Golden, depth-scaled price), Coin, WeaponPickup, ItemPickup, Projectile (arrows & orbs collide with platforms/walls; boomerangs pass through). **Systems:** TouchControls, AutoAttack (melee + ranged), RoomManager (reusable static platform group, entry/exit doors, Combat & Treasure rooms, 4 cycling palettes every 10 rooms), LootSystem (`createWeaponInstance`, `rollChestTier`, `rollChestTierByWeights`, `rollChestLoot`), ObjectPool (`releaseAll` on room teardown), AudioManager (no-op stub until M6).
- **Data:** `src/data/weapons.js` (all 6 weapons), `src/data/passives.js` (all 9 passives), `src/data/enemies.js`, `src/data/roomTemplates.js` (10 validated templates + `validateRoomTemplates()`). All numbers live in `src/config/balance.js`.
- **Player values in use:** Max HP 100, move speed 240, `MAX_VELOCITY_X` 900, invulnerability 800 ms after hit (1000 ms on room entry), spawn X 88 next to left entry door, central `player.stats` modifier computation so `balance.js` is never mutated.
- **Rooms & Spawner in use:** `depth = roomNumber - 1`; Combat rooms (`3 + floor(depth * 0.6)` quota, `min(12, 4 + floor(depth / 4))` max alive, 0.5 s warning marker, 30% chance of 1 chest with weights 70/25/5, 1.5 s coin magnet sweep on clear before unlocking green exit door) and Treasure rooms every 5th room (1-3 chests with weights 20/55/25, exit door open from start).
- **Gold & Chests in use:** coin value 1, 3-6 base coins per kill scaled by `(1 + 0.06 * depth)` and Greedy Coin, magnet radius 80 (extended by Magnet Ring), max 60 active coins; 3 chest tiers (base 30/80/200 scaled by `1 + 0.10 * depth`) auto-opening within 70 px with 400 ms shake -> flash/burst -> 45% weapon / 40% passive / 15% consumable (Heal Orb, Rage Orb).
- **Weapons in use:** 5 rarities (Common to Legendary), depth-scaled damage (`1 + 0.08 * depth`), 3 M3 affixes (Burn, Knockback, Crit), 10% enemy weapon drop chance, 1.5 s ground pickup cooldown, pooled projectiles (max 30), pooled weapon/item pickups and FX, active weapon icon with rarity frame + stacked passive icon row under HP bar.
- **Debug:** open with `?debug=1` (runs `validateRoomTemplates()` once at startup; shows FPS, touch pointers, room/depth/type, velocity, enemy/quota, coin, and chest counts; keys/buttons `G` drop weapon, `C` spawn chest, `V` +100 gold, `N` clear room & open exit door) and `?room=15` to start at Room 15.
- **Known simplifications (fine for now):** audio is a stub, enemies are not pooled (max alive capped at 12), Archer/Charger/Elite/Boss/Rest rooms arrive in M5B.

---

## 1. Vision

A fast, juicy 2D side-view platformer dungeon crawler. The player moves and jumps; the character attacks automatically. Defeat enemies, collect gold, open chests, find weapons, and grow stronger room after room in a dungeon that feels endless. Every run should feel different because of random rooms, random weapons, and random passive upgrades.

### Design pillars
1. **One-thumb-per-hand simplicity:** only move + jump. Everything else is automatic.
2. **Constant reward:** something good drops every few seconds (gold, loot, level of power).
3. **Visible power growth:** the player must feel noticeably stronger every 2-3 rooms.
4. **Mobile first:** every decision is judged on a 6-inch phone screen first.
5. **Juice:** hit-stop, screen shake, particles, floating damage numbers, coin pop sounds.

---

## 2. Technical Requirements (HIGHEST PRIORITY)

- **Logical resolution:** 1280x720 (16:9). Use `Phaser.Scale.FIT` with `autoCenter: CENTER_BOTH`. Must look correct on phones, tablets, and desktop.
- **Orientation:** landscape. If portrait, show a full-screen overlay: "Please rotate your device".
- **Touch:** multi-touch enabled (`input.addPointer(3)`). Left/right buttons and jump button must work at the same time.
- **Prevent:** page scroll, pull-to-refresh, double-tap zoom, text selection, long-press context menu (`touch-action: none`, `user-select: none`, `viewport` meta with `user-scalable=no`).
- **Safe areas:** respect notches (`env(safe-area-inset-*)`).
- **Performance:** stable 60 FPS on a mid-range phone. Use object pooling for projectiles, coins, damage numbers, particles. Cap active enemies at 12, active coins at 60.
- **Offline:** no network calls. Include a basic PWA manifest + service worker in the final milestone.
- **Saving:** `localStorage` for meta progress and settings, wrapped in try/catch.
- **Input parity:** keyboard (Arrow keys / WASD + Space) must work too.
- **Placeholder art first:** use generated shapes/colors and simple SFX hooks; final art swapped in later without code changes (use a central `assets.js` manifest).

---

## 3. Controls

| Action | Touch | Keyboard |
|---|---|---|
| Move left/right | Bottom-left on-screen buttons (large, semi-transparent) | A/D or Left/Right |
| Jump | Bottom-right large button | W / Up / Space |
| Attack | AUTOMATIC | AUTOMATIC |
| Open chest | AUTOMATIC when standing at chest with enough gold (shows price bubble) | AUTOMATIC |
| Pause | Small top-right button | Esc |

Button size: minimum 96px logical, 24px edge margin. Buttons give visual pressed feedback and light haptic (`navigator.vibrate(10)`) where supported.

### Movement feel (tune in balance.js)
- Gravity: 1400, move speed: 240, jump velocity: -560
- Coyote time: 100 ms, jump buffer: 120 ms
- Variable jump height (release early = shorter jump)
- Optional double jump (unlocked by passive item)

---

## 4. Core Loop

```
Enter room -> enemies spawn -> auto-attack kills them -> gold drops
-> collect gold -> room cleared, doors open -> chests / weapon drops appear
-> open chest or grab weapon -> get stronger -> next room (harder)
```

Every run: start weak, die eventually, earn Shards, buy permanent upgrades, start again stronger.

---

## 5. Player

Base stats (all in balance.js):
- Max HP: 100
- Move speed: 240
- Damage multiplier: 1.0
- Attack speed multiplier: 1.0
- Gold pickup magnet radius: 80
- Invulnerability after hit: 800 ms (blink effect)
- Starting weapon: Rusty Sword

### Auto-attack rules
- Each weapon has its own cooldown and range.
- Every tick, find the nearest valid enemy inside weapon range (line of sight not required for v1).
- Player auto-faces that enemy; if none in range, face movement direction.
- Melee weapons: short arc hit with brief swing animation.
- Ranged weapons: spawn a projectile toward the target.
- Attack never blocks movement.

---

## 6. Weapons

One active weapon at a time. Touching a ground weapon pauses the action briefly and shows a compare card: current vs new (damage, speed, range, special) with large **EQUIP** and **LEAVE** buttons (tap-friendly). Replaced weapon is dropped on the ground.

### Rarity
| Rarity | Color | Stat multiplier | Special effects |
|---|---|---|---|
| Common | Gray | 1.0x | 0 |
| Uncommon | Green | 1.25x | 0-1 |
| Rare | Blue | 1.6x | 1 |
| Epic | Purple | 2.1x | 1-2 |
| Legendary | Gold | 3.0x | 2 |

### Weapon types (v1 set)
| Weapon | Type | Base dmg | Interval (ms) | Range | Notes |
|---|---|---|---|---|---|
| Rusty Sword | Melee | 10 | 500 | 90 | Starter |
| Dagger | Melee | 6 | 220 | 70 | Very fast |
| Battle Axe | Melee | 24 | 900 | 100 | Hits all enemies in arc |
| Short Bow | Ranged | 9 | 600 | 420 | Straight projectile |
| Magic Staff | Ranged | 14 | 800 | 360 | Slow homing orb |
| Boomerang | Ranged | 11 | 700 | 300 | Returns, hits twice |

### Special effects (random affixes)
Burn (damage over time), Freeze (slow), Lightning (chain to 1 nearby enemy), Lifesteal (small), Knockback, Crit chance, Pierce.

Weapon stats are generated at drop time from base stats x rarity multiplier x small random variance (+/-10%) x depth scaling.

---

## 7. Enemies

All enemies drop gold on death. Stats scale with room depth: `hp *= 1 + 0.12 * depth`, `damage *= 1 + 0.08 * depth`.

| Enemy | Behavior | HP | Contact dmg | Gold |
|---|---|---|---|---|
| Slime | Walks along platform, turns at edges | 20 | 8 | 3-5 |
| Bat | Flies in sine wave toward player | 12 | 6 | 4-6 |
| Archer | Stays on platform, shoots every 2s | 18 | 10 (arrow) | 6-8 |
| Charger | Telegraphs 0.5s then dashes | 40 | 14 | 8-12 |
| Elite (any, tinted + bigger) | 3x HP, drops a guaranteed weapon or big gold | x3 | x1.5 | x5 |

Enemy spawn count per room: `3 + floor(depth * 0.6)` capped at 12 alive. Spawn with a short 0.5s warning marker so players are never hit by spawns.

### Bosses (every 10th room)
Large enemy with 2-3 simple attack patterns (dash, projectile fan, ground slam shockwave). Guaranteed Epic+ chest on defeat. One boss design in v1, more later.

---

## 8. Gold and Chests

- Enemies drop gold coins that pop outward with physics, then magnetize to the player inside the magnet radius. Coin sound pitch rises with quick consecutive pickups.
- Gold is spent ONLY on chests (and later, shop).

### Chest tiers
| Chest | Base price | Loot quality |
|---|---|---|
| Wooden | 30 | Mostly Common/Uncommon |
| Silver | 80 | Mostly Uncommon/Rare |
| Golden | 200 | Rare/Epic, small Legendary chance |

Price scales with depth: `price *= 1 + 0.10 * depth`.
Each chest shows a floating price. When the player stands near it with enough gold, it opens automatically (anticipation shake -> burst -> item pops out). If not enough gold, price flashes red.

### Chest loot table
- 45% weapon, 40% passive item, 15% consumable (heal orb, temporary buff).
- Rarity weights depend on chest tier (defined in balance.js).

---

## 9. Passive Items

Stack during a run. Examples:
- Heart Charm: +20 max HP
- Boots of Wind: +12% move speed
- Spring Shoes: unlock double jump
- Greedy Coin: +25% gold from enemies
- Magnet Ring: larger gold magnet radius
- Sharp Stone: +15% damage
- Quick Gloves: +15% attack speed
- Vampire Fang: heal 1 HP per 5 kills
- Thorn Armor: reflect small contact damage

Show picked-up passives as small icons in a row under the HUD.

---

## 10. Dungeon Structure

- The dungeon is a sequence of single-screen rooms (1280x720). Depth counter increases forever ("Room 37").
- Room types:
  - **Combat room** (most common): enemies spawn, doors lock until cleared.
  - **Treasure room** (every ~5th): 1-3 chests, no enemies.
  - **Boss room** (every 10th).
  - **Rest room** (after boss): free heal + 1 free chest.
- Rooms are built from hand-authored **layout templates** (arrays of platform rectangles) chosen randomly, with random spawn points. 8-10 templates in v1. Templates must ensure every platform is reachable with a single jump.
- Visual theme changes every 10 rooms (tint/palette swap), mechanics unchanged.
- Transition between rooms: quick fade, 0.4s, player spawns at the left door.

---

## 11. Meta Progression

- On death: show run summary (rooms reached, gold collected, enemies killed, best weapon).
- Earn **Shards** = `depth * 5 + kills * 0.2`.
- Permanent upgrades bought with Shards in the main menu: Max HP, Starting Gold, Damage, Gold Gain, Chest Discount, Start with random Uncommon weapon.
- Persist in localStorage. Add a "Reset progress" option in settings.

---

## 12. UI / HUD

- Top-left: HP bar. Top-center: Room number. Top-right: Gold count + pause button.
- Under HP: weapon icon with rarity-colored frame, passive icons row.
- Floating damage numbers (white normal, yellow crit).
- All text in a bold, readable font (minimum 28px logical height for key info).
- Menus use large touch-friendly buttons (min 80px tall).

---

## 13. Juice and Feedback

- Hit-stop 40-60 ms on strong hits, screen shake on boss slam and player damage.
- Enemy hit flash (white), death burst particles, coin sparkle.
- Chest open: light flash, item bounce, rarity-colored glow beam for Epic/Legendary.
- Player squash & stretch on jump/land.
- All SFX/music routed through one `AudioManager` with mute toggle (start muted until first tap, per browser rules).

---

## 14. Project Structure

```
/index.html
/style.css
/manifest.json            (final milestone)
/sw.js                    (final milestone)
/src
  main.js
  /config
    balance.js            all numbers
    assets.js             asset manifest
  /scenes
    BootScene.js
    MenuScene.js
    GameScene.js
    UIScene.js
    GameOverScene.js
  /entities
    Player.js
    Enemy.js (+ subclasses)
    Boss.js
    Chest.js
    Pickup.js (coin, weapon, item)
    Projectile.js
  /systems
    AutoAttack.js
    RoomManager.js
    LootSystem.js
    SaveSystem.js
    AudioManager.js
    TouchControls.js
    ObjectPool.js
  /data
    weapons.js
    passives.js
    enemies.js
    roomTemplates.js
```

---

## 15. Milestones (build ONE at a time)

**M1 - Foundation (DONE):** project, scaling, rotate overlay, touch + keyboard controls, player movement/jump feel, one test room.
*Done when:* runs on phone and desktop, buttons multitouch, jump feels good, no scrolling/zoom.

**M2 - Combat core (DONE):** auto-attack system, Rusty Sword, Slime + Bat, damage/HP, gold drops + magnet pickup, HUD (HP, gold).
*Done when:* player auto-kills enemies, coins drop and collect, player can die.

**M3 - Weapons (DONE):** weapon data, rarity, ground weapon pickup with compare card, all 6 weapon types, special effects (at least Burn, Knockback, Crit).
*Done when:* each weapon feels distinct and swapping works with touch.

**M4 - Chests and passives (DONE):** 3 chest tiers, price scaling, loot tables, passive items, passive icons in HUD.
*Done when:* gold -> chest -> item loop is satisfying and readable.

**M5A - Endless rooms (DONE):** RoomManager, room templates, door lock/unlock, room transitions, depth scaling, treasure rooms, room counter in the HUD, projectile-vs-platform collisions.
*Done when:* a run can continue past Room 20 with rising difficulty and no errors or memory growth.

**M5B - New enemies and boss (NEXT):** Archer, Charger, Elite enemies, first boss on every 10th room, rest room after each boss. (Spec is written after M5A is done.)

**M6 - Meta + polish:** Shards, permanent upgrades, save system, menu, settings, juice pass, AudioManager, PWA.
*Done when:* full loop works: run -> die -> upgrade -> run again; installable on phone.

### 15.1 M3 detailed spec (Weapons)

- **Weapon instance model.** A weapon the player holds or that lies on the ground is an instance: `{ id, baseId, name, type, rarity, damage, intervalMs, range, arcAngleDeg, affixes: [{ type, value }] }`. Create it with `createWeaponInstance(baseId, rarity, depth)` (put it in `src/systems/LootSystem.js`). Final damage = base damage x rarity multiplier x random(0.9, 1.1) x (1 + 0.08 x depth). Depth is 0 until M5.
- **Rarity data in balance.js:** multipliers, colors, affix count ranges (section 6 table) and enemy-drop weights: Common 70, Uncommon 22, Rare 6.5, Epic 1.4, Legendary 0.1. Rarity only scales damage and decides how many affixes roll.
- **AutoAttack** must read the player's active weapon instance and support both melee and projectile types. Rusty Sword behavior from M2 stays the same.
- **Weapon types to implement (stats in section 6):**
  - Dagger: fast, short melee.
  - Battle Axe: wide 160 degree melee arc, hits every enemy in the arc, built-in small knockback.
  - Short Bow: straight pooled arrow, stops on the first enemy hit.
  - Magic Staff: slow homing orb, stops on the first enemy hit.
  - Boomerang: flies out to its range, comes back to the player, can hit the same enemy on both legs.
  - Projectiles are pooled, max 30 active, and are removed when they leave the room.
- **Affixes required in M3:** Burn, Knockback, Crit. (Freeze, Lightning, Lifesteal, Pierce are NOT part of M3.)
  - Burn: enemy takes 30 percent of the hit damage per second for 3 seconds (re-hit refreshes the timer, no stacking). Tint the enemy orange while burning.
  - Knockback: pushes the enemy away for 150 ms during which its AI movement is suspended (Enemy needs a `knockbackTimer`).
  - Crit: chance (base 15 percent plus affix value) for 2x damage, shown as a larger yellow damage number.
  - All affix numbers live in balance.js.
- **Ground weapon pickup:** enemies drop a weapon with a 10 percent chance (balance.js). The pickup bobs up and down, has a rarity-colored glow and a letter or simple shape for its type. Under `?debug=1`, pressing the `G` key (and a small on-screen DEBUG button) drops a random weapon next to the player for testing.
- **Compare card:** touching a pickup (after its 1.5 s pickup cooldown) opens a card in UIScene and pauses gameplay (physics, spawner, timers). Show current weapon vs new weapon: name in rarity color, damage, attacks per second, range, and affix lines. Two big buttons, minimum 88 px tall: **EQUIP** and **LEAVE**. EQUIP swaps the weapons and drops the old one at the player's feet with a 1.5 s pickup cooldown. LEAVE keeps the weapon on the ground (also with the cooldown, so the card does not reopen in a loop). Keyboard: Enter equips, Esc leaves.
- **HUD:** show the active weapon icon with a rarity-colored frame under the HP bar.
- **Pooling:** projectiles, weapon pickups and burn effects must be pooled or reused.

### 15.2 M4 detailed spec (Chests and passives)

- **Chest entity** (`src/entities/Chest.js`): three tiers (Wooden, Silver, Golden) with placeholder art in different colors. Price = base price x (1 + 0.10 x depth), base prices 30 / 80 / 200 (depth is 0 until M5). A price bubble (coin icon + number) floats above each chest.
- **Opening:** automatic when the player is within 70 px and has enough gold. Gold is deducted, then: 400 ms shake, light flash and burst particles, item pops out with a small physics hop. If the player is nearby but cannot afford it, the price flashes red (once per second at most). No button press is needed.
- **Chest placement (no rooms yet):** every 8 enemy kills a chest spawns on a random platform surface, at most 2 chests present at once. Tier weights: Wooden 60, Silver 30, Golden 10. Under `?debug=1`, pressing `C` (and a small on-screen DEBUG button) spawns a random chest next to the player, and gold can be added with `V` (+100).
- **Loot table per chest opening:** 45 percent weapon, 40 percent passive, 15 percent consumable. Rarity weights per tier (all in balance.js):
  - Wooden: Common 60, Uncommon 32, Rare 7, Epic 1, Legendary 0
  - Silver: Common 20, Uncommon 45, Rare 28, Epic 6, Legendary 1
  - Golden: Common 0, Uncommon 10, Rare 55, Epic 30, Legendary 5
- **Weapon result:** create it with `createWeaponInstance` using the rolled rarity, and spawn it as a normal ground weapon pickup so the existing compare card flow is used.
- **Passives** (`src/data/passives.js`, each has id, name, rarity, description, effect values in balance.js). Passives stack (counted), apply instantly, and are auto-collected on touch with a short floating text such as "Heart Charm +20 max HP". After the rarity is rolled, pick a random passive of that rarity; if none exists, fall back to the nearest lower rarity.
  - Common: Heart Charm (+20 max HP and heal 20), Boots of Wind (+12 percent move speed), Magnet Ring (+40 magnet radius)
  - Uncommon: Sharp Stone (+15 percent damage), Quick Gloves (+15 percent attack speed), Greedy Coin (+25 percent gold from enemies)
  - Rare: Thorn Armor (when the player takes contact damage, that enemy takes 6 damage), Spring Shoes (unlock one extra air jump; more copies add nothing)
  - Epic: Vampire Fang (heal 1 HP every 5 kills, per copy)
  - Legendary: none yet (uses the fallback rule)
- **Double jump:** Player supports one extra air jump with a small puff effect; it must work with touch and keyboard and respect coyote time and jump buffer.
- **Consumables** (auto-collected, applied instantly): Heal Orb (restores 30 percent of max HP), Rage Orb (+40 percent attack speed for 10 s, with a small timer icon in the HUD).
- **HUD:** a row of passive icons (placeholder colored circles with a letter) under the weapon frame, with an "x2" style counter for stacks.
- **Pooling:** pickups for items popping out of chests, coins and effects use pools; chests themselves (max 2 alive) do not need a pool.
- **Stats:** Player gets a central place for modifiers (for example `player.stats` with multipliers) so passives never edit balance.js values directly.

### 15.3 M5A detailed spec (Endless rooms)

- **Depth:** room number N starts at 1 and increases forever; `depth = N - 1`. Depth drives all scaling. For testing, `?room=15` in the URL starts the run at room 15 (works together with `?debug=1`).
- **RoomManager** (`src/systems/RoomManager.js`): builds the current room from a template, tears down the previous room completely, and owns room state (type, enemies still to spawn, cleared flag, doors). Colliders are created once against a reusable static platform group; clear the group between rooms instead of creating new colliders, so nothing leaks.
- **Room templates** (`src/data/roomTemplates.js`): 8 to 10 hand-authored templates, each an array of platforms `{ x, y, width, height }` in the 1280x720 room. A full-width ground is always present. Rules every template must follow: vertical step between platforms that must be reached is at most 95 px (max jump height is 112 px), horizontal gaps are at most 150 px, no platform may sit in the door areas (x < 150 or x > 1130, within 220 px above the ground), and no platform may block the way from the left door to the right door. Add `validateRoomTemplates()` that checks the step and door rules and prints `console.warn` messages; run it once at startup when `?debug=1` is set.
- **Doors:** a decorative entry door at the left edge (the player spawns next to it) and an exit door at the right edge. In a combat room the exit door is locked (red, with bars) until the room is cleared, then it opens (green glow, small arrow pointing right). Walking into the open door triggers the transition. Touch controls stay active the whole time.
- **Transition:** 200 ms fade out, rebuild, 200 ms fade in, player placed at the left door with 1 s of invulnerability. The whole transition must feel under half a second. During the transition the player cannot be hurt and the spawner is paused.
- **Room types in M5A:** Combat (default) and Treasure (every 5th room: 5, 10, 15, ...). M5B will turn every 10th room into a boss room, so in M5A rooms 10, 20, ... are simply Treasure rooms.
  - Combat room: total enemies to spawn = `3 + floor(depth * 0.6)`. Max alive at once = `min(12, 4 + floor(depth / 4))`. Reuse the existing 0.5 s warning-marker spawner, but replace the endless timer spawner with this quota. The room is cleared when the quota has spawned and all enemies are dead. Still only Slime and Bat in M5A.
  - Treasure room: no enemies, 1 to 3 chests (tier weights Wooden 20, Silver 55, Golden 25), exit door open from the start.
  - Combat rooms have a 30 percent chance of containing one chest from the start (tier weights Wooden 70, Silver 25, Golden 5) placed on a random platform. This replaces the "every 8 kills" chest spawn from M4; keep the `C` and `V` debug keys.
- **On room clear:** all coins in the room magnetize to the player for 1.5 s (so no gold is lost), then the door opens. Weapon pickups and unopened chests are left behind when leaving.
- **Depth scaling:** enemy HP x `(1 + 0.12 * depth)`, enemy contact damage x `(1 + 0.08 * depth)`, enemy gold x `(1 + 0.06 * depth)`, chest price x `(1 + 0.10 * depth)` (already in M4, now fed with real depth), weapon damage uses the depth in `createWeaponInstance` for every drop and chest. All factors live in balance.js.
- **Themes:** the palette (background, grid, platform colors) changes every 10 rooms by cycling through 4 palettes in balance.js. Mechanics stay the same.
- **Projectile collisions:** arrows and magic orbs are removed when they hit a platform or room wall (spawn a tiny hit spark). Boomerangs pass through platforms.
- **Cleanup on every transition:** deactivate all projectiles, coins, weapon pickups, chests, burn effects, damage numbers and pending warnings; destroy room platform objects; regenerate `platformBounds` and `spawnSurfaces` used by Slime patrol and the spawner. Player stats, weapon, passives, buffs and gold carry over.
- **HUD:** "Room N" at the top center of UIScene. At the start of each room show a 1.5 s banner ("Room 7", or "Treasure Room"). The Game Over screen shows "Room reached: N". Restart resets the run to room 1 with all run state reset.
- **Debug (`?debug=1`):** `N` key (and a small on-screen DEBUG button) clears the room and opens the door immediately; the debug overlay also shows the room number and depth.

---

## 16. Out of Scope for v1
Multiplayer, online leaderboards, in-app purchases, ads, story/dialogue, multiple characters, shops (later), controller support.

## 17. Coding Rules for the Agent
1. Small, readable modules; no giant single file.
2. All tunable numbers in `balance.js` or `/data`.
3. Use object pooling for anything spawned frequently.
4. After each milestone, update `README.md` with how to run and what was built, and list any known issues.
5. Do not refactor unrelated systems while working on a milestone.
6. If something in this GDD is ambiguous, state the assumption in one line and continue.
