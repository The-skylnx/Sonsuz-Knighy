import { BALANCE } from '../config/balance.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const cfg = BALANCE.PLAYER;
    this.body.setSize(cfg.WIDTH, cfg.HEIGHT);
    this.setCollideWorldBounds(true);

    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.airJumpsRemaining = 0;
    this.isJumping = false;
    this.jumpCutApplied = false;
    this.facingDir = 1;

    this.invulnTimer = 0;
    this.blinkTimer = 0;
    this.isDead = false;
    this.weapon = null;

    // Central passive & temporary buff state (never mutates BALANCE)
    this.passiveCounts = {};
    this.passiveOrder = [];
    this.rageTimerMs = 0;
    this.vampireKillCounter = 0;

    this.stats = {
      maxHp: cfg.MAX_HP,
      moveSpeed: cfg.MOVE_SPEED,
      magnetRadius: cfg.MAGNET_RADIUS,
      damageMultiplier: cfg.DAMAGE_MULTIPLIER,
      attackSpeedMultiplier: cfg.ATTACK_SPEED_MULTIPLIER,
      goldMultiplier: 1.0,
      thornDamage: 0,
      extraAirJumps: 0,
      vampireStacks: 0
    };

    this.hp = this.stats.maxHp;
    this.recalculateStats();
  }

  get maxHp() {
    return this.stats.maxHp;
  }

  get moveSpeed() {
    return this.stats.moveSpeed;
  }

  get damageMultiplier() {
    return this.stats.damageMultiplier;
  }

  get attackSpeedMultiplier() {
    return this.stats.attackSpeedMultiplier;
  }

  get magnetRadius() {
    return this.stats.magnetRadius;
  }

  get isInvulnerable() {
    return this.invulnTimer > 0;
  }

  getPassiveStacks(passiveId) {
    return this.passiveCounts[passiveId] || 0;
  }

  recalculateStats() {
    const cfg = BALANCE.PLAYER;
    const p = BALANCE.PASSIVES;
    const c = BALANCE.CONSUMABLES;

    this.stats.maxHp =
      cfg.MAX_HP + this.getPassiveStacks('heart_charm') * p.HEART_CHARM.MAX_HP_BONUS;
    this.stats.moveSpeed =
      cfg.MOVE_SPEED *
      (1 + this.getPassiveStacks('boots_of_wind') * p.BOOTS_OF_WIND.MOVE_SPEED_PCT);
    this.stats.magnetRadius =
      cfg.MAGNET_RADIUS +
      this.getPassiveStacks('magnet_ring') * p.MAGNET_RING.RADIUS_BONUS;
    this.stats.damageMultiplier =
      cfg.DAMAGE_MULTIPLIER *
      (1 + this.getPassiveStacks('sharp_stone') * p.SHARP_STONE.DAMAGE_PCT);

    const rageBonus = this.rageTimerMs > 0 ? c.RAGE_ORB.attackSpeedPct : 0;
    this.stats.attackSpeedMultiplier =
      cfg.ATTACK_SPEED_MULTIPLIER *
      (1 +
        this.getPassiveStacks('quick_gloves') * p.QUICK_GLOVES.ATTACK_SPEED_PCT +
        rageBonus);

    this.stats.goldMultiplier =
      1 + this.getPassiveStacks('greedy_coin') * p.GREEDY_COIN.GOLD_PCT;
    this.stats.thornDamage =
      this.getPassiveStacks('thorn_armor') * p.THORN_ARMOR.REFLECT_DAMAGE;
    this.stats.extraAirJumps =
      this.getPassiveStacks('spring_shoes') > 0 ? p.SPRING_SHOES.EXTRA_JUMPS : 0;
    this.stats.vampireStacks = this.getPassiveStacks('vampire_fang');

    this.hp = Math.min(this.hp, this.stats.maxHp);
    this.setMaxVelocity(
      Math.max(cfg.MAX_VELOCITY_X, this.stats.moveSpeed),
      cfg.MAX_FALL_SPEED
    );
  }

  addPassive(passiveId) {
    const prevSpringStacks = this.getPassiveStacks('spring_shoes');

    if (!this.passiveCounts[passiveId]) {
      this.passiveCounts[passiveId] = 0;
      this.passiveOrder.push(passiveId);
    }
    this.passiveCounts[passiveId] += 1;

    this.recalculateStats();

    if (passiveId === 'heart_charm') {
      this.heal(BALANCE.PASSIVES.HEART_CHARM.HEAL_AMOUNT);
    } else if (passiveId === 'spring_shoes' && prevSpringStacks === 0) {
      this.airJumpsRemaining = this.stats.extraAirJumps;
    }
  }

  heal(amount) {
    if (this.isDead || amount <= 0) {
      return 0;
    }
    const before = this.hp;
    this.hp = Math.min(this.stats.maxHp, this.hp + Math.round(amount));
    return this.hp - before;
  }

  activateRage(durationMs) {
    this.rageTimerMs = durationMs;
    this.recalculateStats();
  }

  onEnemyKilled() {
    if (this.isDead || this.stats.vampireStacks <= 0) {
      return 0;
    }

    const vCfg = BALANCE.PASSIVES.VAMPIRE_FANG;
    this.vampireKillCounter += 1;
    if (this.vampireKillCounter >= vCfg.KILLS_INTERVAL) {
      this.vampireKillCounter -= vCfg.KILLS_INTERVAL;
      return this.heal(vCfg.HEAL_AMOUNT * this.stats.vampireStacks);
    }
    return 0;
  }

  setWeapon(weaponInstance) {
    this.weapon = weaponInstance;
  }

  setFacing(dir) {
    if (dir < 0) {
      this.facingDir = -1;
      this.setFlipX(true);
    } else if (dir > 0) {
      this.facingDir = 1;
      this.setFlipX(false);
    }
  }

  takeDamage(amount) {
    if (this.isDead || this.isInvulnerable || amount <= 0) {
      return false;
    }

    const cfg = BALANCE.PLAYER;
    this.hp = Math.max(0, this.hp - amount);

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    this.invulnTimer = cfg.INVULN_DURATION_MS;
    this.blinkTimer = 0;
    this.setAlpha(cfg.BLINK_ALPHA_LOW);
    return true;
  }

  die() {
    this.isDead = true;
    this.invulnTimer = 0;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.setAlpha(0);
    this.setVisible(false);
  }

  update(delta, input) {
    if (this.isDead) {
      return;
    }

    const cfg = BALANCE.PLAYER;

    // Temporary Rage Orb buff timer
    if (this.rageTimerMs > 0) {
      this.rageTimerMs = Math.max(0, this.rageTimerMs - delta);
      if (this.rageTimerMs <= 0) {
        this.recalculateStats();
      }
    }

    // Invulnerability blink timer
    if (this.invulnTimer > 0) {
      this.invulnTimer = Math.max(0, this.invulnTimer - delta);
      if (this.invulnTimer <= 0) {
        this.setAlpha(1);
      } else {
        this.blinkTimer += delta;
        if (this.blinkTimer >= cfg.INVULN_BLINK_INTERVAL_MS) {
          this.blinkTimer -= cfg.INVULN_BLINK_INTERVAL_MS;
          this.setAlpha(this.alpha < 1 ? 1 : cfg.BLINK_ALPHA_LOW);
        }
      }
    }

    // Horizontal movement using computed stats.moveSpeed
    const speed = this.stats.moveSpeed;
    if (input.left && !input.right) {
      this.setVelocityX(-speed);
      this.setFacing(-1);
    } else if (input.right && !input.left) {
      this.setVelocityX(speed);
      this.setFacing(1);
    } else {
      this.setVelocityX(0);
    }

    const onGround = this.body.blocked.down || this.body.touching.down;

    // Coyote time & air jump refresh
    if (onGround && this.body.velocity.y >= 0) {
      this.coyoteTimer = cfg.COYOTE_TIME_MS;
      this.airJumpsRemaining = this.stats.extraAirJumps;
      this.isJumping = false;
      this.jumpCutApplied = false;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // Jump buffer tracking
    if (input.jumpJustPressed) {
      this.jumpBufferTimer = cfg.JUMP_BUFFER_MS;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    // Ground/coyote jump takes priority so coyote jumps preserve the air jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.setVelocityY(cfg.JUMP_VELOCITY);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.isJumping = true;
      this.jumpCutApplied = false;
    } else if (this.jumpBufferTimer > 0 && this.airJumpsRemaining > 0) {
      // Double jump in mid-air
      this.airJumpsRemaining -= 1;
      this.setVelocityY(cfg.DOUBLE_JUMP_VELOCITY);
      this.jumpBufferTimer = 0;
      this.isJumping = true;
      this.jumpCutApplied = false;
      this.scene.spawnDoubleJumpPuff(this.x, this.body.bottom);
      this.scene.audioManager.playDoubleJump();
    }

    // Variable jump height: releasing jump early cuts upward velocity once (works on air jumps too)
    if (
      this.isJumping &&
      !this.jumpCutApplied &&
      !input.jumpDown &&
      this.body.velocity.y < 0
    ) {
      this.setVelocityY(this.body.velocity.y * cfg.JUMP_CUT_MULTIPLIER);
      this.jumpCutApplied = true;
    }
  }
}
