import { BALANCE } from '../config/balance.js';
import { ENEMIES } from '../data/enemies.js';
import { WEAPONS } from '../data/weapons.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Chest } from '../entities/Chest.js';
import { Coin, WeaponPickup, ItemPickup } from '../entities/Pickup.js';
import { Projectile } from '../entities/Projectile.js';
import { TouchControls } from '../systems/TouchControls.js';
import { AutoAttack } from '../systems/AutoAttack.js';
import { ObjectPool } from '../systems/ObjectPool.js';
import { AudioManager } from '../systems/AudioManager.js';
import {
  createWeaponInstance,
  createRandomWeaponDrop,
  rollChestTier,
  rollChestLoot
} from '../systems/LootSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.physics.world.resume();

    this.gold = 0;
    this.passiveHudRevision = 0;
    this.killsTowardChest = 0;
    this.isGameOver = false;
    this.isCompareOpen = false;
    this.comparingPickup = null;
    this.isDebugEnabled =
      new URLSearchParams(window.location.search).get('debug') === '1';

    this.activeEnemies = [];
    this.activeChests = [];
    this.pendingWarnings = [];
    this.platformBounds = [];
    this.spawnSurfaces = [];
    this.spawnTimer = BALANCE.SPAWNER.INITIAL_SPAWN_DELAY_MS;
    this.initialSpawnsRemaining = BALANCE.SPAWNER.INITIAL_SPAWN_COUNT;

    this.audioManager = new AudioManager();

    this.drawBackgroundGrid();
    this.createRoomPlatforms();

    this.player = new Player(
      this,
      BALANCE.PLAYER.SPAWN_X,
      BALANCE.PLAYER.SPAWN_Y
    );
    const starterWeapon = createWeaponInstance(
      BALANCE.PLAYER.STARTING_WEAPON,
      BALANCE.PLAYER.STARTING_RARITY,
      0
    );
    this.player.setWeapon(starterWeapon);
    this.physics.add.collider(this.player, this.platforms);

    this.setupEnemyGroups();
    this.setupPools();

    this.autoAttack = new AutoAttack(this, this.player);

    this.setupKeyboard();
    this.touchControls = new TouchControls(this);

    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
    this.scene.launch('UIScene');
  }

  drawBackgroundGrid() {
    const gCfg = BALANCE.GAME;
    const gfx = this.add.graphics();
    gfx.lineStyle(1, gCfg.GRID_COLOR, gCfg.GRID_ALPHA);

    for (let x = 0; x <= gCfg.WIDTH; x += gCfg.GRID_SIZE) {
      gfx.lineBetween(x, 0, x, gCfg.HEIGHT);
    }
    for (let y = 0; y <= gCfg.HEIGHT; y += gCfg.GRID_SIZE) {
      gfx.lineBetween(0, y, gCfg.WIDTH, y);
    }
  }

  createRoomPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    const room = BALANCE.TEST_ROOM;

    this.addStaticPlatform(
      room.GROUND.x,
      room.GROUND.y,
      room.GROUND.width,
      room.GROUND.height,
      room.GROUND.color,
      room.GROUND.topColor,
      room.GROUND.topHeight,
      true
    );

    for (const plat of room.PLATFORMS) {
      this.addStaticPlatform(
        plat.x,
        plat.y,
        plat.width,
        plat.height,
        room.PLATFORM_COLOR,
        room.PLATFORM_TOP_COLOR,
        room.PLATFORM_TOP_HEIGHT,
        false
      );
    }
  }

  addStaticPlatform(x, y, width, height, fillColor, topColor, topHeight, isGround) {
    const rect = this.add.rectangle(x, y, width, height, fillColor);
    this.platforms.add(rect);
    rect.body.updateFromGameObject();

    const halfW = width / 2;
    const halfH = height / 2;
    const bounds = {
      left: x - halfW,
      right: x + halfW,
      top: y - halfH,
      bottom: y + halfH,
      isGround
    };
    this.platformBounds.push(bounds);
    this.spawnSurfaces.push(bounds);

    this.add.rectangle(
      x,
      y - halfH + topHeight / 2,
      width,
      topHeight,
      topColor
    );
  }

  setupEnemyGroups() {
    this.slimeGroup = this.physics.add.group({
      collideWorldBounds: true,
      allowGravity: true
    });
    this.batGroup = this.physics.add.group({
      collideWorldBounds: true,
      allowGravity: false
    });

    this.physics.add.collider(this.slimeGroup, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.slimeGroup,
      this.onPlayerTouchEnemy,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.batGroup,
      this.onPlayerTouchEnemy,
      null,
      this
    );
  }

  setupPools() {
    const cCfg = BALANCE.COMBAT;
    const gCfg = BALANCE.GOLD;
    const pCfg = BALANCE.PROJECTILES;
    const wCfg = BALANCE.WEAPONS_DROP;
    const iCfg = BALANCE.ITEM_PICKUPS;
    const bCfg = BALANCE.AFFIXES.BURN;
    const puffCfg = BALANCE.PUFF_FX;
    const sTxtCfg = BALANCE.STATUS_TEXT;

    // 1. Coins pool (capped at 60)
    this.coinGroup = this.physics.add.group();
    this.physics.add.collider(
      this.coinGroup,
      this.platforms,
      null,
      (coin) => coin.active && !coin.isMagnetized
    );

    this.coinPool = new ObjectPool(
      () => {
        const coin = new Coin(this);
        this.coinGroup.add(coin);
        coin.deactivate();
        return coin;
      },
      (coin, x, y) => {
        coin.spawn(x, y);
      },
      gCfg.POOL_INITIAL,
      gCfg.MAX_ACTIVE_COINS
    );

    // 2. Projectiles pool (capped at 30)
    this.projectileGroup = this.physics.add.group({
      allowGravity: false
    });
    this.physics.add.overlap(
      this.projectileGroup,
      this.slimeGroup,
      this.onProjectileOverlapEnemy,
      null,
      this
    );
    this.physics.add.overlap(
      this.projectileGroup,
      this.batGroup,
      this.onProjectileOverlapEnemy,
      null,
      this
    );

    this.projectilePool = new ObjectPool(
      () => {
        const proj = new Projectile(this);
        this.projectileGroup.add(proj);
        proj.deactivate();
        return proj;
      },
      (proj, x, y, aimAngle, weaponInstance) => {
        proj.spawn(x, y, aimAngle, weaponInstance);
      },
      pCfg.POOL_INITIAL,
      pCfg.MAX_ACTIVE
    );

    // 3. Ground weapon pickups pool
    this.weaponPickupGroup = this.physics.add.group();
    this.physics.add.collider(this.weaponPickupGroup, this.platforms);

    this.weaponPickupPool = new ObjectPool(
      () => {
        const pickup = new WeaponPickup(this);
        this.weaponPickupGroup.add(pickup);
        pickup.deactivate();
        return pickup;
      },
      (pickup, x, y, weaponInstance, cooldownMs, popVx, popVy) => {
        pickup.spawn(x, y, weaponInstance, cooldownMs, popVx, popVy);
      },
      wCfg.POOL_INITIAL,
      wCfg.MAX_ACTIVE
    );

    // 4. Passive & consumable item pickups pool
    this.itemPickupGroup = this.physics.add.group();
    this.physics.add.collider(this.itemPickupGroup, this.platforms);

    this.itemPickupPool = new ObjectPool(
      () => {
        const item = new ItemPickup(this);
        this.itemPickupGroup.add(item);
        item.deactivate();
        return item;
      },
      (item, x, y, payload) => {
        item.spawn(x, y, payload);
      },
      iCfg.POOL_INITIAL,
      iCfg.MAX_ACTIVE
    );

    // 5. Floating damage/heal numbers pool
    this.damageTextPool = new ObjectPool(
      () => {
        const txt = this.add.text(0, 0, '', {
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          fontSize: cCfg.DMG_TEXT_FONT_SIZE,
          fontStyle: 'bold',
          color: cCfg.DMG_TEXT_COLOR,
          stroke: cCfg.DMG_TEXT_STROKE,
          strokeThickness: cCfg.DMG_TEXT_STROKE_WIDTH
        });
        txt.setOrigin(0.5);
        txt.setDepth(cCfg.DMG_TEXT_DEPTH);
        txt.setActive(false);
        txt.setVisible(false);
        return { textObj: txt, elapsed: 0 };
      },
      (entry, x, y, label, style = 'normal') => {
        const jitterX = Phaser.Math.Between(
          -cCfg.DMG_TEXT_SPREAD_X,
          cCfg.DMG_TEXT_SPREAD_X
        );
        entry.textObj.setPosition(x + jitterX, y + cCfg.DMG_TEXT_OFFSET_Y);
        entry.textObj.setText(String(label));

        if (style === 'crit') {
          entry.textObj.setFontSize(cCfg.CRIT_TEXT_FONT_SIZE);
          entry.textObj.setColor(cCfg.CRIT_TEXT_COLOR);
        } else if (style === 'burn') {
          entry.textObj.setFontSize(cCfg.BURN_TEXT_FONT_SIZE);
          entry.textObj.setColor(cCfg.BURN_TEXT_COLOR);
        } else if (style === 'heal') {
          entry.textObj.setFontSize(cCfg.HEAL_TEXT_FONT_SIZE);
          entry.textObj.setColor(cCfg.HEAL_TEXT_COLOR);
        } else {
          entry.textObj.setFontSize(cCfg.DMG_TEXT_FONT_SIZE);
          entry.textObj.setColor(cCfg.DMG_TEXT_COLOR);
        }

        entry.textObj.setAlpha(1);
        entry.textObj.setActive(true);
        entry.textObj.setVisible(true);
        entry.elapsed = 0;
      },
      cCfg.DMG_TEXT_POOL_INITIAL
    );

    // 6. Floating item pickup banner text pool
    this.statusTextPool = new ObjectPool(
      () => {
        const txt = this.add.text(0, 0, '', {
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          fontSize: sTxtCfg.FONT_SIZE,
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: sTxtCfg.STROKE,
          strokeThickness: sTxtCfg.STROKE_WIDTH
        });
        txt.setOrigin(0.5);
        txt.setDepth(sTxtCfg.DEPTH);
        txt.setActive(false);
        txt.setVisible(false);
        return { textObj: txt, elapsed: 0 };
      },
      (entry, x, y, message, hexColor = '#ffffff') => {
        const clampedX = Phaser.Math.Clamp(
          x,
          sTxtCfg.EDGE_CLAMP_X,
          BALANCE.GAME.WIDTH - sTxtCfg.EDGE_CLAMP_X
        );
        entry.textObj.setPosition(clampedX, y + sTxtCfg.OFFSET_Y);
        entry.textObj.setText(message);
        entry.textObj.setColor(hexColor);
        entry.textObj.setAlpha(1);
        entry.textObj.setActive(true);
        entry.textObj.setVisible(true);
        entry.elapsed = 0;
      },
      sTxtCfg.POOL_INITIAL
    );

    // 7. Hit spark effects pool
    this.hitEffectPool = new ObjectPool(
      () => {
        const img = this.add.image(0, 0, 'hit_effect');
        img.setDepth(cCfg.FX_DEPTH);
        img.setActive(false);
        img.setVisible(false);
        return { img, elapsed: 0 };
      },
      (entry, x, y) => {
        entry.img.setPosition(x, y);
        entry.img.setRotation(Math.random() * Math.PI);
        entry.img.setScale(cCfg.HIT_EFFECT_START_SCALE);
        entry.img.setAlpha(1);
        entry.img.setActive(true);
        entry.img.setVisible(true);
        entry.elapsed = 0;
      },
      cCfg.HIT_EFFECT_POOL_INITIAL
    );

    // 8. Burn flame effects pool
    this.burnEffectPool = new ObjectPool(
      () => {
        const img = this.add.image(0, 0, 'burn_flame');
        img.setDepth(cCfg.FX_DEPTH);
        img.setActive(false);
        img.setVisible(false);
        return { img, elapsed: 0 };
      },
      (entry, x, y) => {
        const offsetX = Phaser.Math.Between(-10, 10);
        const offsetY = Phaser.Math.Between(-8, 6);
        entry.img.setPosition(x + offsetX, y + offsetY);
        entry.img.setScale(1);
        entry.img.setAlpha(0.95);
        entry.img.setActive(true);
        entry.img.setVisible(true);
        entry.elapsed = 0;
      },
      bCfg.FX_POOL_INITIAL
    );

    // 9. Puff & chest burst particle pool
    this.puffPool = new ObjectPool(
      () => {
        const img = this.add.image(0, 0, 'puff_particle');
        img.setDepth(cCfg.FX_DEPTH);
        img.setActive(false);
        img.setVisible(false);
        return {
          img,
          vx: 0,
          vy: 0,
          elapsed: 0,
          duration: 300,
          startScale: 1,
          endScale: 0.2
        };
      },
      (entry, x, y, vx, vy, duration, tintColor, startScale = 1, endScale = 0.25) => {
        entry.vx = vx;
        entry.vy = vy;
        entry.elapsed = 0;
        entry.duration = duration;
        entry.startScale = startScale;
        entry.endScale = endScale;

        entry.img.setPosition(x, y);
        entry.img.setTint(tintColor);
        entry.img.setScale(startScale);
        entry.img.setAlpha(0.95);
        entry.img.setActive(true);
        entry.img.setVisible(true);
      },
      puffCfg.POOL_INITIAL
    );

    // 10. Chest open flash pool
    this.chestFlashPool = new ObjectPool(
      () => {
        const img = this.add.image(0, 0, 'chest_flash');
        img.setDepth(cCfg.FX_DEPTH + 1);
        img.setActive(false);
        img.setVisible(false);
        return { img, elapsed: 0 };
      },
      (entry, x, y, tintColor) => {
        entry.elapsed = 0;
        entry.img.setPosition(x, y);
        entry.img.setTint(tintColor);
        entry.img.setScale(0.4);
        entry.img.setAlpha(1);
        entry.img.setActive(true);
        entry.img.setVisible(true);
      },
      2
    );

    // 11. Melee arc swing visuals pool
    this.swingPool = new ObjectPool(
      () => {
        const img = this.add.image(0, 0, 'sword_arc');
        img.setDepth(cCfg.FX_DEPTH);
        img.setActive(false);
        img.setVisible(false);
        return {
          img,
          elapsed: 0,
          duration: 1,
          startAngle: 0,
          endAngle: 0
        };
      },
      (entry, aimAngle, weapon, baseCfg) => {
        const scale = weapon.range / cCfg.SWING_BASE_RADIUS;
        const halfSweep = baseCfg.swingSweepRad * 0.5;
        const dirSign = Math.cos(aimAngle) >= 0 ? 1 : -1;

        entry.startAngle = aimAngle - halfSweep * dirSign;
        entry.endAngle = aimAngle + halfSweep * dirSign;
        entry.duration = baseCfg.swingDurationMs;
        entry.elapsed = 0;

        entry.img.setPosition(this.player.x, this.player.y);
        entry.img.setScale(scale);
        entry.img.setRotation(entry.startAngle);
        entry.img.setAlpha(cCfg.SWING_ALPHA);
        entry.img.setActive(true);
        entry.img.setVisible(true);
      },
      cCfg.SWING_POOL_INITIAL
    );
  }

  setupKeyboard() {
    const kb = this.input.keyboard;
    if (!kb) {
      this.cursors = null;
      this.keys = null;
      return;
    }

    kb.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'W', 'A', 'S', 'D']);

    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      g: Phaser.Input.Keyboard.KeyCodes.G,
      c: Phaser.Input.Keyboard.KeyCodes.C,
      v: Phaser.Input.Keyboard.KeyCodes.V
    });
  }

  spawnSwingVisual(aimAngle, weapon, baseCfg) {
    this.swingPool.acquire(aimAngle, weapon, baseCfg);
  }

  spawnProjectile(x, y, aimAngle, weaponInstance) {
    this.projectilePool.acquire(x, y, aimAngle, weaponInstance);
  }

  spawnBurnEffect(x, y) {
    this.burnEffectPool.acquire(x, y);
  }

  spawnDoubleJumpPuff(x, y) {
    const pCfg = BALANCE.PUFF_FX;
    for (let i = 0; i < pCfg.DOUBLE_JUMP_COUNT; i++) {
      const t = pCfg.DOUBLE_JUMP_COUNT > 1 ? i / (pCfg.DOUBLE_JUMP_COUNT - 1) - 0.5 : 0;
      const vx = t * 2 * pCfg.DOUBLE_JUMP_SPREAD_VX;
      const vy = Phaser.Math.Between(pCfg.DOUBLE_JUMP_VY_MIN, pCfg.DOUBLE_JUMP_VY_MAX);
      this.puffPool.acquire(
        x + t * 18,
        y - 2,
        vx,
        vy,
        pCfg.DOUBLE_JUMP_DURATION_MS,
        pCfg.DOUBLE_JUMP_COLOR,
        1.05,
        0.25
      );
    }
  }

  spawnWeaponPickup(
    x,
    y,
    weaponInstance,
    cooldownMs = BALANCE.WEAPONS_DROP.PICKUP_COOLDOWN_MS,
    popVx = 0,
    popVy = BALANCE.WEAPONS_DROP.POP_VY
  ) {
    this.weaponPickupPool.acquire(x, y, weaponInstance, cooldownMs, popVx, popVy);
  }

  spawnRandomPlatformChest() {
    const cCfg = BALANCE.CHESTS;
    if (this.activeChests.length >= cCfg.MAX_ACTIVE) {
      return;
    }

    // Prefer the 4 elevated platforms, with ground fallback
    const elevated = this.spawnSurfaces.filter((s) => !s.isGround);
    const pool = elevated.length > 0 ? elevated : this.spawnSurfaces;
    const minSpacingSq = cCfg.MIN_CHEST_SPACING * cCfg.MIN_CHEST_SPACING;

    let chosenX = BALANCE.GAME.WIDTH / 2;
    let chosenY = BALANCE.TEST_ROOM.GROUND.y - BALANCE.TEST_ROOM.GROUND.height / 2 - cCfg.HEIGHT / 2;

    for (let attempt = 0; attempt < cCfg.MAX_PLACE_ATTEMPTS; attempt++) {
      const surface = pool[Phaser.Math.Between(0, pool.length - 1)];
      const minX = Math.max(cCfg.GROUND_SAFE_X, surface.left + cCfg.EDGE_MARGIN);
      const maxX = Math.min(
        BALANCE.GAME.WIDTH - cCfg.GROUND_SAFE_X,
        surface.right - cCfg.EDGE_MARGIN
      );
      if (maxX < minX) {
        continue;
      }

      const x = Phaser.Math.Between(Math.round(minX), Math.round(maxX));
      const y = surface.top - cCfg.HEIGHT / 2;
      chosenX = x;
      chosenY = y;

      let tooClose = false;
      for (let i = 0; i < this.activeChests.length; i++) {
        const other = this.activeChests[i];
        const dx = other.x - x;
        const dy = other.y - y;
        if (dx * dx + dy * dy < minSpacingSq) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) {
        break;
      }
    }

    const tierId = rollChestTier();
    const chest = new Chest(this, chosenX, chosenY, tierId, 0);
    this.activeChests.push(chest);
  }

  spawnDebugChestNearPlayer() {
    if (this.isGameOver || this.isCompareOpen || !this.player || this.player.isDead) {
      return;
    }

    const cCfg = BALANCE.CHESTS;
    // Keep max 2 chests at once by replacing oldest closed chest if already full
    if (this.activeChests.length >= cCfg.MAX_ACTIVE) {
      const closedIdx = this.activeChests.findIndex((c) => c.state === 'closed');
      if (closedIdx !== -1) {
        this.activeChests[closedIdx].destroy();
        this.activeChests.splice(closedIdx, 1);
      } else {
        return;
      }
    }

    const wCfg = BALANCE.WEAPONS_DROP;
    let targetX = this.player.x + this.player.facingDir * cCfg.DEBUG_OFFSET_X;
    if (targetX < wCfg.DEBUG_DROP_MIN_X || targetX > wCfg.DEBUG_DROP_MAX_X) {
      targetX = this.player.x - this.player.facingDir * cCfg.DEBUG_OFFSET_X;
    }
    targetX = Phaser.Math.Clamp(
      targetX,
      cCfg.DEBUG_CLAMP_X,
      BALANCE.GAME.WIDTH - cCfg.DEBUG_CLAMP_X
    );

    // Place chest flush on the highest surface below player's waist at targetX
    let bestSurface = this.spawnSurfaces[0];
    let bestTop = Infinity;
    for (let i = 0; i < this.spawnSurfaces.length; i++) {
      const s = this.spawnSurfaces[i];
      if (
        targetX >= s.left + 20 &&
        targetX <= s.right - 20 &&
        s.top >= this.player.y - 8 &&
        s.top < bestTop
      ) {
        bestTop = s.top;
        bestSurface = s;
      }
    }

    const chestY = bestSurface.top - cCfg.HEIGHT / 2;
    const tierId = rollChestTier();
    const chest = new Chest(this, targetX, chestY, tierId, 0);
    this.activeChests.push(chest);
  }

  addDebugGold() {
    if (this.isGameOver || this.isCompareOpen) {
      return;
    }
    const amt = BALANCE.GOLD.DEBUG_ADD_AMOUNT;
    this.gold += amt;
    if (this.player) {
      this.statusTextPool.acquire(
        this.player.x,
        this.player.y,
        `+${amt} Gold`,
        '#ffd166'
      );
    }
  }

  onChestBurstOpen(chest) {
    const cCfg = BALANCE.CHESTS;
    const wCfg = BALANCE.WEAPONS_DROP;
    const loot = rollChestLoot(chest.tierId, 0);

    let burstColor = chest.tierCfg.latchColor;
    if (loot.category === 'weapon') {
      burstColor = BALANCE.RARITIES[loot.weapon.rarity].color;
    } else if (loot.category === 'passive') {
      burstColor = BALANCE.RARITIES[loot.passive.rarity].color;
    } else {
      burstColor = loot.consumable.color;
    }

    // Light flash + burst particles
    this.chestFlashPool.acquire(chest.x, chest.y - 4, burstColor);
    for (let i = 0; i < cCfg.BURST_PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / cCfg.BURST_PARTICLE_COUNT + Math.random() * 0.35;
      const speed = Phaser.Math.Between(cCfg.BURST_SPEED_MIN, cCfg.BURST_SPEED_MAX);
      this.puffPool.acquire(
        chest.x,
        chest.y - 4,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 40,
        cCfg.BURST_DURATION_MS,
        burstColor,
        1.15,
        0.2
      );
    }

    // Pop loot item out
    if (loot.category === 'weapon') {
      const popVx = Phaser.Math.Between(
        -wCfg.CHEST_POP_VX_SPREAD,
        wCfg.CHEST_POP_VX_SPREAD
      );
      this.spawnWeaponPickup(
        chest.x,
        chest.y - 10,
        loot.weapon,
        wCfg.PICKUP_COOLDOWN_MS,
        popVx,
        wCfg.CHEST_POP_VY
      );
    } else {
      this.itemPickupPool.acquire(chest.x, chest.y - 10, loot);
    }
  }

  collectItemPickup(itemPickup) {
    const payload = itemPickup.payload;
    if (!payload) {
      return;
    }

    this.audioManager.playItemPickup();

    if (payload.category === 'passive') {
      const passive = payload.passive;
      const rCfg = BALANCE.RARITIES[passive.rarity] || BALANCE.RARITIES.common;
      this.player.addPassive(passive.id);
      this.passiveHudRevision += 1;
      this.statusTextPool.acquire(
        this.player.x,
        this.player.y,
        passive.pickupText,
        rCfg.hex
      );
    } else if (payload.category === 'consumable') {
      const cons = payload.consumable;
      if (cons.id === 'heal_orb') {
        const amount = Math.max(
          1,
          Math.round(this.player.maxHp * cons.healMaxHpRatio)
        );
        this.player.heal(amount);
        this.statusTextPool.acquire(
          this.player.x,
          this.player.y,
          `Heal Orb +${amount} HP`,
          cons.hex
        );
      } else if (cons.id === 'rage_orb') {
        this.player.activateRage(cons.durationMs);
        const pct = Math.round(cons.attackSpeedPct * 100);
        this.statusTextPool.acquire(
          this.player.x,
          this.player.y,
          `Rage Orb +${pct}% atk spd`,
          cons.hex
        );
      }
    }
  }

  dropDebugWeaponNearPlayer() {
    if (this.isGameOver || this.isCompareOpen || !this.player || this.player.isDead) {
      return;
    }

    const wCfg = BALANCE.WEAPONS_DROP;
    let targetX = this.player.x + this.player.facingDir * wCfg.DEBUG_DROP_OFFSET_X;
    if (targetX < wCfg.DEBUG_DROP_MIN_X || targetX > wCfg.DEBUG_DROP_MAX_X) {
      targetX = this.player.x - this.player.facingDir * wCfg.DEBUG_DROP_OFFSET_X;
    }
    targetX = Phaser.Math.Clamp(targetX, wCfg.DEBUG_DROP_MIN_X, wCfg.DEBUG_DROP_MAX_X);

    const weapon = createRandomWeaponDrop(0);
    this.spawnWeaponPickup(targetX, this.player.y - 12, weapon, wCfg.PICKUP_COOLDOWN_MS);
  }

  onProjectileOverlapEnemy(objA, objB) {
    const proj = objA instanceof Projectile ? objA : objB;
    const enemy = proj === objA ? objB : objA;
    if (this.isGameOver || this.isCompareOpen || !proj.canHitEnemy(enemy)) {
      return;
    }

    proj.registerEnemyHit(enemy);
    this.applyWeaponInstanceHit(enemy, proj.weaponInstance, proj.x, proj.y);
  }

  applyWeaponInstanceHit(enemy, weaponInstance, sourceX, sourceY) {
    if (!enemy || !enemy.active || enemy.isDead) {
      return;
    }

    const baseCfg = WEAPONS[weaponInstance.baseId] || WEAPONS.rusty_sword;
    const aCfg = BALANCE.AFFIXES;

    let damage = Math.max(
      1,
      Math.round(weaponInstance.damage * this.player.damageMultiplier)
    );
    let isCrit = false;
    let hasKnockbackAffix = false;
    let hasBurnAffix = false;

    for (let i = 0; i < weaponInstance.affixes.length; i++) {
      const affix = weaponInstance.affixes[i];
      if (affix.type === 'crit') {
        const chance = aCfg.CRIT.BASE_CHANCE + affix.value;
        if (Math.random() < chance) {
          isCrit = true;
          damage = Math.round(damage * aCfg.CRIT.MULTIPLIER);
        }
      } else if (affix.type === 'knockback') {
        hasKnockbackAffix = true;
      } else if (affix.type === 'burn') {
        hasBurnAffix = true;
      }
    }

    this.hitEffectPool.acquire(enemy.x, enemy.y);
    this.damageTextPool.acquire(
      enemy.x,
      enemy.y - enemy.cfg.height / 2,
      damage,
      isCrit ? 'crit' : 'normal'
    );

    const killed = enemy.takeDamage(damage);
    if (killed) {
      this.handleEnemyKilled(enemy);
      return;
    }

    this.audioManager.playEnemyHit();

    const kbSpeed =
      (baseCfg.builtInKnockbackSpeed || 0) +
      (hasKnockbackAffix ? aCfg.KNOCKBACK.SPEED : 0);
    const kbDuration = hasKnockbackAffix
      ? aCfg.KNOCKBACK.DURATION_MS
      : baseCfg.builtInKnockbackMs || 0;

    if (kbSpeed > 0 && kbDuration > 0) {
      enemy.applyKnockback(sourceX, sourceY, kbSpeed, kbDuration);
    }

    if (hasBurnAffix) {
      const burnDps = damage * aCfg.BURN.DPS_RATIO;
      enemy.applyBurn(burnDps, aCfg.BURN.DURATION_MS);
    }
  }

  applyBurnTickDamage(enemy, damage) {
    if (!enemy || !enemy.active || enemy.isDead) {
      return;
    }

    this.damageTextPool.acquire(
      enemy.x,
      enemy.y - enemy.cfg.height / 2,
      damage,
      'burn'
    );

    const killed = enemy.takeDamage(damage);
    if (killed) {
      this.handleEnemyKilled(enemy);
    }
  }

  applyThornDamage(enemy, damage) {
    if (!enemy || !enemy.active || enemy.isDead || damage <= 0) {
      return;
    }

    this.hitEffectPool.acquire(enemy.x, enemy.y);
    this.damageTextPool.acquire(
      enemy.x,
      enemy.y - enemy.cfg.height / 2,
      damage,
      'normal'
    );

    const killed = enemy.takeDamage(damage);
    if (killed) {
      this.handleEnemyKilled(enemy);
    } else {
      this.audioManager.playEnemyHit();
    }
  }

  handleEnemyKilled(enemy) {
    this.audioManager.playEnemyDeath();
    this.dropCoinsForEnemy(enemy);

    if (Math.random() < BALANCE.WEAPONS_DROP.ENEMY_DROP_CHANCE) {
      const droppedWeapon = createRandomWeaponDrop(0);
      this.spawnWeaponPickup(
        enemy.x,
        enemy.y,
        droppedWeapon,
        BALANCE.WEAPONS_DROP.PICKUP_COOLDOWN_MS
      );
    }

    // Vampire Fang passive heal check
    const healed = this.player.onEnemyKilled();
    if (healed > 0) {
      this.damageTextPool.acquire(
        this.player.x,
        this.player.y - this.player.height / 2,
        `+${healed}`,
        'heal'
      );
    }

    // Spawn a chest every 8 kills (up to 2 active chests at once)
    this.killsTowardChest += 1;
    if (this.killsTowardChest >= BALANCE.CHESTS.KILLS_PER_SPAWN) {
      this.killsTowardChest = 0;
      this.spawnRandomPlatformChest();
    }

    this.removeEnemy(enemy);
  }

  dropCoinsForEnemy(enemy) {
    const baseCount = Phaser.Math.Between(enemy.cfg.goldMin, enemy.cfg.goldMax);
    const exact = baseCount * this.player.stats.goldMultiplier;
    const count = Math.floor(exact) + (Math.random() < exact % 1 ? 1 : 0);

    for (let i = 0; i < count; i++) {
      this.coinPool.acquire(enemy.x, enemy.y);
    }
  }

  removeEnemy(enemy) {
    const idx = this.activeEnemies.indexOf(enemy);
    if (idx !== -1) {
      this.activeEnemies.splice(idx, 1);
    }
    enemy.destroy();
  }

  openWeaponCompare(pickup) {
    if (this.isCompareOpen || this.isGameOver || !pickup || !pickup.active) {
      return;
    }

    this.isCompareOpen = true;
    this.comparingPickup = pickup;
    this.touchControls.resetPointers();
    this.physics.world.pause();

    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.scene.isActive()) {
      uiScene.showCompareCard(this.player.weapon, pickup.weaponInstance);
    }
  }

  confirmEquipWeapon() {
    if (!this.isCompareOpen || !this.comparingPickup) {
      return;
    }

    const oldWeapon = this.player.weapon;
    const pickup = this.comparingPickup;
    const newWeapon = pickup.weaponInstance;

    pickup.deactivate();
    this.weaponPickupPool.release(pickup);

    this.player.setWeapon(newWeapon);
    this.autoAttack.resetCooldown();
    this.audioManager.playWeaponEquip();

    if (oldWeapon) {
      this.spawnWeaponPickup(
        this.player.x,
        this.player.y,
        oldWeapon,
        BALANCE.WEAPONS_DROP.PICKUP_COOLDOWN_MS
      );
    }

    this.comparingPickup = null;
    this.isCompareOpen = false;
    this.physics.world.resume();
  }

  cancelEquipWeapon() {
    if (!this.isCompareOpen) {
      return;
    }

    if (this.comparingPickup && this.comparingPickup.active) {
      this.comparingPickup.resetCooldown();
    }

    this.comparingPickup = null;
    this.isCompareOpen = false;
    this.physics.world.resume();
  }

  onPlayerTouchEnemy(_player, enemy) {
    if (this.isGameOver || this.isCompareOpen || !enemy.active || enemy.isDead) {
      return;
    }

    const tookHit = this.player.takeDamage(enemy.contactDamage);
    if (!tookHit) {
      return;
    }

    // Thorn Armor reflects contact damage to the enemy that touched the player
    if (this.player.stats.thornDamage > 0) {
      this.applyThornDamage(enemy, this.player.stats.thornDamage);
    }

    if (this.player.isDead) {
      this.audioManager.playPlayerDeath();
      this.handlePlayerDeath();
    } else {
      this.audioManager.playPlayerHit();
    }
  }

  handlePlayerDeath() {
    this.isGameOver = true;
    this.isCompareOpen = false;
    this.comparingPickup = null;
    this.physics.world.resume();
    this.touchControls.resetPointers();

    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.scene.isActive()) {
      uiScene.hideCompareCard();
    }

    for (const w of this.pendingWarnings) {
      w.sprite.destroy();
    }
    this.pendingWarnings.length = 0;

    for (const enemy of this.activeEnemies) {
      if (enemy.body) {
        enemy.setVelocity(0, 0);
      }
    }

    this.scene.launch('GameOverScene');
  }

  updateEnemySpawner(delta) {
    const s = BALANCE.SPAWNER;

    for (let i = this.pendingWarnings.length - 1; i >= 0; i--) {
      const warning = this.pendingWarnings[i];
      warning.elapsed += delta;

      const pulse =
        (Math.sin(warning.elapsed * s.WARNING_PULSE_SPEED) + 1) * 0.5;
      const scale = Phaser.Math.Linear(
        s.WARNING_MIN_SCALE,
        s.WARNING_MAX_SCALE,
        pulse
      );
      warning.sprite.setScale(scale);

      if (warning.elapsed >= s.WARNING_DURATION_MS) {
        warning.sprite.destroy();
        this.pendingWarnings.splice(i, 1);
        this.spawnEnemyNow(warning.typeKey, warning.x, warning.y);
      }
    }

    const totalCount = this.activeEnemies.length + this.pendingWarnings.length;
    if (totalCount >= s.MAX_ALIVE) {
      return;
    }

    this.spawnTimer -= delta;
    if (this.spawnTimer > 0) {
      return;
    }

    if (this.initialSpawnsRemaining > 0) {
      const toQueue = Math.min(
        this.initialSpawnsRemaining,
        s.MAX_ALIVE - totalCount
      );
      for (let i = 0; i < toQueue; i++) {
        this.queueEnemySpawn();
      }
      this.initialSpawnsRemaining = 0;
    } else {
      this.queueEnemySpawn();
    }

    this.spawnTimer = s.SPAWN_INTERVAL_MS;
  }

  queueEnemySpawn() {
    const s = BALANCE.SPAWNER;
    const typeKey = Math.random() < s.SLIME_CHANCE ? 'slime' : 'bat';
    const pos = this.pickSafeSpawnPosition(typeKey);

    const sprite = this.add.image(pos.x, pos.y, 'spawn_warning');
    sprite.setDepth(BALANCE.COMBAT.FX_DEPTH);

    this.pendingWarnings.push({
      typeKey,
      x: pos.x,
      y: pos.y,
      elapsed: 0,
      sprite
    });
  }

  pickSafeSpawnPosition(typeKey) {
    const s = BALANCE.SPAWNER;
    const minDistSq = s.MIN_PLAYER_DISTANCE * s.MIN_PLAYER_DISTANCE;
    let chosen = { x: s.FALLBACK_SPAWN_X, y: s.FALLBACK_SPAWN_Y };

    for (let attempt = 0; attempt < s.MAX_SPAWN_ATTEMPTS; attempt++) {
      let x;
      let y;

      if (typeKey === 'slime') {
        const surface =
          this.spawnSurfaces[Phaser.Math.Between(0, this.spawnSurfaces.length - 1)];
        const minX = surface.left + s.PLATFORM_EDGE_MARGIN;
        const maxX = surface.right - s.PLATFORM_EDGE_MARGIN;
        x = Phaser.Math.Between(Math.round(minX), Math.round(maxX));
        y = surface.top - ENEMIES.slime.height / 2;
      } else {
        x = Phaser.Math.Between(s.BAT_MIN_X, s.BAT_MAX_X);
        y = Phaser.Math.Between(s.BAT_MIN_Y, s.BAT_MAX_Y);
      }

      chosen = { x, y };
      const dx = x - this.player.x;
      const dy = y - this.player.y;
      if (dx * dx + dy * dy >= minDistSq) {
        return chosen;
      }
    }

    return chosen;
  }

  spawnEnemyNow(typeKey, x, y) {
    if (this.isGameOver) {
      return;
    }

    const enemy = new Enemy(this, x, y, typeKey);
    if (typeKey === 'slime') {
      this.slimeGroup.add(enemy);
      enemy.body.setAllowGravity(true);
    } else {
      this.batGroup.add(enemy);
      enemy.body.setAllowGravity(false);
    }
    enemy.setCollideWorldBounds(true);
    enemy.body.setSize(enemy.cfg.width, enemy.cfg.height);

    this.activeEnemies.push(enemy);
  }

  updateChests(delta) {
    for (let i = this.activeChests.length - 1; i >= 0; i--) {
      const chest = this.activeChests[i];
      const finished = chest.update(delta, this.player);
      if (finished) {
        chest.destroy();
        this.activeChests.splice(i, 1);
      }
    }
  }

  updatePools(delta) {
    const cCfg = BALANCE.COMBAT;
    const bCfg = BALANCE.AFFIXES.BURN;
    const sTxtCfg = BALANCE.STATUS_TEXT;
    const chCfg = BALANCE.CHESTS;

    // Coins
    this.coinPool.forEachActive((coin) => {
      const pickedUp = coin.updateCoin(delta, this.player);
      if (pickedUp) {
        this.gold += coin.value;
        this.audioManager.playCoinPickup();
        coin.deactivate();
        this.coinPool.release(coin);
      }
    });

    // Projectiles
    this.projectilePool.forEachActive((proj) => {
      const shouldRelease = proj.updateProjectile(
        delta,
        this.player,
        this.activeEnemies
      );
      if (shouldRelease) {
        proj.deactivate();
        this.projectilePool.release(proj);
      }
    });

    // Passive & consumable pickups
    if (!this.isGameOver && !this.isCompareOpen) {
      this.itemPickupPool.forEachActive((item) => {
        const collected = item.updateItem(delta, this.player);
        if (collected) {
          this.collectItemPickup(item);
          item.deactivate();
          this.itemPickupPool.release(item);
        }
      });
    }

    // Ground weapon pickups
    if (!this.isGameOver && !this.isCompareOpen) {
      let triggeredPickup = null;
      this.weaponPickupPool.forEachActive((pickup) => {
        const touched = pickup.updatePickup(delta, this.player);
        if (touched && !triggeredPickup) {
          triggeredPickup = pickup;
        }
      });
      if (triggeredPickup) {
        this.openWeaponCompare(triggeredPickup);
      }
    }

    // Floating damage/heal numbers
    this.damageTextPool.forEachActive((entry) => {
      entry.elapsed += delta;
      const t = entry.elapsed / cCfg.DMG_TEXT_DURATION_MS;
      if (t >= 1) {
        entry.textObj.setActive(false);
        entry.textObj.setVisible(false);
        this.damageTextPool.release(entry);
        return;
      }
      entry.textObj.y -= (cCfg.DMG_TEXT_RISE_SPEED * delta) / 1000;
      entry.textObj.setAlpha(1 - t * t);
    });

    // Floating pickup status banners
    this.statusTextPool.forEachActive((entry) => {
      entry.elapsed += delta;
      const t = entry.elapsed / sTxtCfg.DURATION_MS;
      if (t >= 1) {
        entry.textObj.setActive(false);
        entry.textObj.setVisible(false);
        this.statusTextPool.release(entry);
        return;
      }
      entry.textObj.y -= (sTxtCfg.RISE_SPEED * delta) / 1000;
      entry.textObj.setAlpha(t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3);
    });

    // Hit sparks
    this.hitEffectPool.forEachActive((entry) => {
      entry.elapsed += delta;
      const t = entry.elapsed / cCfg.HIT_EFFECT_DURATION_MS;
      if (t >= 1) {
        entry.img.setActive(false);
        entry.img.setVisible(false);
        this.hitEffectPool.release(entry);
        return;
      }
      entry.img.setScale(
        Phaser.Math.Linear(
          cCfg.HIT_EFFECT_START_SCALE,
          cCfg.HIT_EFFECT_END_SCALE,
          t
        )
      );
      entry.img.setAlpha(1 - t);
    });

    // Burn flame effects
    this.burnEffectPool.forEachActive((entry) => {
      entry.elapsed += delta;
      const t = entry.elapsed / bCfg.FX_DURATION_MS;
      if (t >= 1) {
        entry.img.setActive(false);
        entry.img.setVisible(false);
        this.burnEffectPool.release(entry);
        return;
      }
      entry.img.y -= (bCfg.FX_RISE_SPEED * delta) / 1000;
      entry.img.setScale(1 - 0.35 * t);
      entry.img.setAlpha(0.95 * (1 - t));
    });

    // Puff & chest burst particles
    this.puffPool.forEachActive((entry) => {
      entry.elapsed += delta;
      const t = entry.elapsed / entry.duration;
      if (t >= 1) {
        entry.img.setActive(false);
        entry.img.setVisible(false);
        this.puffPool.release(entry);
        return;
      }
      const dtSec = delta / 1000;
      entry.img.x += entry.vx * dtSec;
      entry.img.y += entry.vy * dtSec;
      entry.img.setScale(Phaser.Math.Linear(entry.startScale, entry.endScale, t));
      entry.img.setAlpha(0.95 * (1 - t));
    });

    // Chest open flash
    this.chestFlashPool.forEachActive((entry) => {
      entry.elapsed += delta;
      const t = entry.elapsed / chCfg.FLASH_DURATION_MS;
      if (t >= 1) {
        entry.img.setActive(false);
        entry.img.setVisible(false);
        this.chestFlashPool.release(entry);
        return;
      }
      entry.img.setScale(Phaser.Math.Linear(0.45, 1.35, t));
      entry.img.setAlpha(1 - t);
    });

    // Melee swing visuals
    this.swingPool.forEachActive((entry) => {
      entry.elapsed += delta;
      const t = entry.elapsed / entry.duration;
      if (t >= 1) {
        entry.img.setActive(false);
        entry.img.setVisible(false);
        this.swingPool.release(entry);
        return;
      }
      entry.img.setPosition(this.player.x, this.player.y);
      entry.img.setRotation(
        Phaser.Math.Linear(entry.startAngle, entry.endAngle, t)
      );
      entry.img.setAlpha(cCfg.SWING_ALPHA * (1 - t));
    });
  }

  getAliveEnemyCount() {
    return this.activeEnemies.length;
  }

  getActiveCoinCount() {
    return this.coinPool ? this.coinPool.activeCount : 0;
  }

  update(_time, delta) {
    if (this.isCompareOpen) {
      return;
    }

    if (this.isGameOver) {
      this.updatePools(delta);
      return;
    }

    if (this.isDebugEnabled && this.keys) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.g)) {
        this.dropDebugWeaponNearPlayer();
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.c)) {
        this.spawnDebugChestNearPlayer();
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.v)) {
        this.addDebugGold();
      }
    }

    this.touchControls.update();

    const kbLeft = this.cursors ? (this.cursors.left.isDown || this.keys.a.isDown) : false;
    const kbRight = this.cursors ? (this.cursors.right.isDown || this.keys.d.isDown) : false;
    const kbJumpDown = this.cursors
      ? (this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown)
      : false;
    const kbJumpJustPressed = this.cursors
      ? (
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.keys.w) ||
        Phaser.Input.Keyboard.JustDown(this.keys.space)
      )
      : false;

    const inputState = {
      left: kbLeft || this.touchControls.left,
      right: kbRight || this.touchControls.right,
      jumpDown: kbJumpDown || this.touchControls.jumpDown,
      jumpJustPressed: kbJumpJustPressed || this.touchControls.jumpJustPressed
    };

    this.player.update(delta, inputState);
    this.autoAttack.update(delta, this.activeEnemies);

    this.updateEnemySpawner(delta);

    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      this.activeEnemies[i].update(delta, this.player, this.platformBounds);
    }

    this.updateChests(delta);
    this.updatePools(delta);
  }
}
