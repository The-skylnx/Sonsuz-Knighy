import { BALANCE } from '../config/balance.js';
import { ENEMIES } from '../data/enemies.js';
import { isTargetVisible } from '../systems/LineOfSight.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, typeKey, depth = 0) {
    const cfg = ENEMIES[typeKey];
    super(scene, x, y, cfg.id);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const dScale = BALANCE.DEPTH_SCALING;
    this.cfg = cfg;
    this.typeKey = typeKey;
    this.depth = depth;
    this.maxHp = Math.max(1, Math.round(cfg.hp * (1 + dScale.ENEMY_HP_FACTOR * depth)));
    this.hp = this.maxHp;
    this.contactDamage = Math.max(
      1,
      Math.round(cfg.contactDamage * (1 + dScale.ENEMY_DAMAGE_FACTOR * depth))
    );
    this.isDead = false;
    this.hitFlashTimer = 0;
    this.knockbackTimer = 0;

    // Burn DoT state
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.burnFxTimer = 0;
    this.burnDps = 0;
    this.burnCarry = 0;

    // Telegraph / special AI state (Archer & Charger)
    this.telegraphFlashOn = false;
    this.telegraphBlinkTimer = 0;
    this.stateTimer = 0;

    this.body.setSize(cfg.width, cfg.height);
    this.setCollideWorldBounds(true);

    if (cfg.behavior === 'sine_fly') {
      this.body.setAllowGravity(false);
      this.waveTime = (Math.random() * Math.PI * 2) / cfg.waveFrequency;
    } else {
      this.body.setAllowGravity(true);
      this.dir = Math.random() < 0.5 ? -1 : 1;
      this.setFlipX(this.dir < 0);

      if (cfg.behavior === 'archer') {
        this.archerState = 'idle'; // 'idle' | 'telegraph'
        this.archerCooldown = Phaser.Math.Between(
          cfg.initialCooldownMinMs,
          cfg.initialCooldownMaxMs
        );
      } else if (cfg.behavior === 'charger') {
        this.chargerState = 'walk'; // 'walk' | 'telegraph' | 'dash' | 'stun'
        this.dashDir = 1;
        this.dashTraveled = 0;
        this.dashCooldown = cfg.initialDashCooldownMs;
      }
    }
  }

  applyVisualScale(sx, sy) {
    if (this.scaleX === sx && this.scaleY === sy) {
      return;
    }
    const prevSy = this.scaleY;
    this.y += (prevSy - sy) * this.cfg.height * 0.5;
    this.setScale(sx, sy);
    if (this.body) {
      this.body.setSize(this.cfg.width / sx, this.cfg.height / sy);
    }
  }

  refreshVisualTint() {
    if (this.hitFlashTimer > 0) {
      this.setTintFill(0xffffff);
      return;
    }
    if (this.telegraphFlashOn && this.cfg.telegraphTintColor) {
      this.setTintFill(this.cfg.telegraphTintColor);
      return;
    }
    if (this.burnTimer > 0) {
      this.setTint(BALANCE.AFFIXES.BURN.TINT_COLOR);
      return;
    }
    if (this.cfg.behavior === 'charger' && this.chargerState === 'stun') {
      this.setTint(this.cfg.stunTintColor);
      return;
    }
    this.clearTint();
  }

  takeDamage(amount) {
    if (this.isDead || !this.active || amount <= 0) {
      return false;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashTimer = BALANCE.COMBAT.HIT_FLASH_MS;
    this.refreshVisualTint();

    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  applyKnockback(fromX, fromY, speed, durationMs) {
    if (this.isDead || !this.active || speed <= 0 || durationMs <= 0) {
      return;
    }
    // Committed Charger dash is not interrupted by small knockbacks
    if (this.cfg.behavior === 'charger' && this.chargerState === 'dash') {
      return;
    }

    this.knockbackTimer = Math.max(this.knockbackTimer, durationMs);

    if (this.cfg.behavior !== 'sine_fly') {
      const dirSign = this.x >= fromX ? 1 : -1;
      this.setVelocityX(dirSign * speed);
      if (this.body.blocked.down || this.body.touching.down) {
        this.setVelocityY(BALANCE.AFFIXES.KNOCKBACK.GROUND_HOP_VY);
      }
    } else {
      const dx = this.x - fromX;
      const dy = this.y - fromY;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.001) {
        this.setVelocity((dx / dist) * speed, (dy / dist) * speed);
      } else {
        this.setVelocity(speed, 0);
      }
    }
  }

  applyBurn(dps, durationMs) {
    if (this.isDead || !this.active || dps <= 0 || durationMs <= 0) {
      return;
    }

    const wasBurning = this.burnTimer > 0;
    this.burnTimer = durationMs;
    this.burnDps = dps;

    if (!wasBurning) {
      this.burnTickTimer = BALANCE.AFFIXES.BURN.TICK_INTERVAL_MS;
      this.burnFxTimer = 0;
      this.burnCarry = 0;
    }

    this.refreshVisualTint();
  }

  hasFloorInDir(dir, platformBounds) {
    const probeOffsetX = this.cfg.edgeProbeOffsetX || 4;
    const probeOffsetY = this.cfg.edgeProbeOffsetY || 6;
    const probeX = this.x + dir * (this.body.halfWidth + probeOffsetX);
    const probeY = this.body.bottom + probeOffsetY;

    for (let i = 0; i < platformBounds.length; i++) {
      const b = platformBounds[i];
      if (probeX >= b.left && probeX <= b.right && probeY >= b.top && probeY <= b.bottom) {
        return true;
      }
    }
    return false;
  }

  update(delta, player, platformBounds, losObstacles) {
    if (this.isDead || !this.active) {
      return;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - delta);
      if (this.hitFlashTimer <= 0) {
        this.refreshVisualTint();
      }
    }

    // Burn DoT processing
    if (this.burnTimer > 0) {
      const bCfg = BALANCE.AFFIXES.BURN;
      this.burnTimer = Math.max(0, this.burnTimer - delta);

      this.burnFxTimer -= delta;
      if (this.burnFxTimer <= 0) {
        this.burnFxTimer = bCfg.FX_INTERVAL_MS;
        this.scene.spawnBurnEffect(this.x, this.y);
      }

      this.burnTickTimer -= delta;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer += bCfg.TICK_INTERVAL_MS;
        this.burnCarry += this.burnDps * (bCfg.TICK_INTERVAL_MS / 1000);
        const tickDamage =
          this.burnTimer <= 0
            ? Math.round(this.burnCarry)
            : Math.floor(this.burnCarry);
        if (tickDamage >= 1) {
          this.burnCarry = Math.max(0, this.burnCarry - tickDamage);
          this.scene.applyBurnTickDamage(this, tickDamage);
          if (this.isDead || !this.active) {
            return;
          }
        }
      }

      if (this.burnTimer <= 0) {
        this.burnDps = 0;
        this.burnCarry = 0;
        this.refreshVisualTint();
      }
    }

    // Suspend AI movement while knockbackTimer is active
    if (this.knockbackTimer > 0) {
      this.knockbackTimer = Math.max(0, this.knockbackTimer - delta);
      return;
    }

    if (this.cfg.behavior === 'patrol') {
      this.updatePatrol(platformBounds);
    } else if (this.cfg.behavior === 'sine_fly') {
      this.updateSineFly(delta, player);
    } else if (this.cfg.behavior === 'archer') {
      this.updateArcher(delta, player, losObstacles);
    } else if (this.cfg.behavior === 'charger') {
      this.updateCharger(delta, player, platformBounds, losObstacles);
    }
  }

  updatePatrol(platformBounds) {
    const cfg = this.cfg;
    const onGround = this.body.blocked.down || this.body.touching.down;

    if (this.body.blocked.left) {
      this.dir = 1;
    } else if (this.body.blocked.right) {
      this.dir = -1;
    } else if (onGround && !this.hasFloorInDir(this.dir, platformBounds)) {
      this.dir *= -1;
    }

    this.setVelocityX(this.dir * cfg.moveSpeed);
    this.setFlipX(this.dir < 0);
  }

  updateSineFly(delta, player) {
    const cfg = this.cfg;
    this.waveTime += delta;

    let ux = 0;
    let uy = 0;
    if (player && !player.isDead) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        ux = dx / dist;
        uy = dy / dist;
      }
      if (Math.abs(dx) > 2) {
        this.setFlipX(dx < 0);
      }
    }

    const sineOffset = Math.sin(this.waveTime * cfg.waveFrequency) * cfg.waveSpeed;
    this.setVelocity(
      ux * cfg.moveSpeed,
      uy * cfg.moveSpeed + sineOffset
    );
  }

  updateArcher(delta, player, losObstacles) {
    const cfg = this.cfg;
    this.setVelocityX(0);

    if (player && !player.isDead) {
      const dx = player.x - this.x;
      if (Math.abs(dx) > 2) {
        this.setFlipX(dx < 0);
      }
    }

    if (this.archerState === 'idle') {
      this.archerCooldown = Math.max(0, this.archerCooldown - delta);
      if (this.archerCooldown > 0 || !player || player.isDead) {
        return;
      }

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      if (dx * dx + dy * dy > cfg.attackRange * cfg.attackRange) {
        return;
      }

      if (!isTargetVisible(this.x, this.y, player, losObstacles)) {
        return;
      }

      this.archerState = 'telegraph';
      this.stateTimer = cfg.telegraphMs;
      this.telegraphBlinkTimer = 0;
      this.telegraphFlashOn = true;
      this.refreshVisualTint();
      this.scene.audioManager.playEnemyTelegraph();
      return;
    }

    if (this.archerState === 'telegraph') {
      this.stateTimer -= delta;
      this.telegraphBlinkTimer += delta;
      if (this.telegraphBlinkTimer >= cfg.telegraphFlashIntervalMs) {
        this.telegraphBlinkTimer -= cfg.telegraphFlashIntervalMs;
        this.telegraphFlashOn = !this.telegraphFlashOn;
        this.refreshVisualTint();
      }

      if (this.stateTimer <= 0) {
        this.archerState = 'idle';
        this.telegraphFlashOn = false;
        this.refreshVisualTint();

        if (
          player &&
          !player.isDead &&
          isTargetVisible(this.x, this.y, player, losObstacles)
        ) {
          const angle = Math.atan2(player.y - this.y, player.x - this.x);
          const dScale = BALANCE.DEPTH_SCALING;
          const arrowDamage = Math.max(
            1,
            Math.round(cfg.arrowBaseDamage * (1 + dScale.ENEMY_DAMAGE_FACTOR * this.depth))
          );
          this.scene.spawnEnemyProjectile(this.x, this.y, angle, arrowDamage);
          this.scene.audioManager.playEnemyShoot();
          this.archerCooldown = Math.max(200, cfg.fireIntervalMs - cfg.telegraphMs);
        } else {
          this.archerCooldown = cfg.retryBlockedMs;
        }
      }
    }
  }

  updateCharger(delta, player, platformBounds, losObstacles) {
    const cfg = this.cfg;
    const onGround = this.body.blocked.down || this.body.touching.down;

    if (this.chargerState === 'walk') {
      this.dashCooldown = Math.max(0, this.dashCooldown - delta);

      if (!player || player.isDead) {
        this.setVelocityX(0);
        return;
      }

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const wantDir = dx < 0 ? -1 : 1;
      if (Math.abs(dx) > 4) {
        this.dir = wantDir;
        this.setFlipX(this.dir < 0);
      }

      // Walk slowly toward player along platform without walking off ledges
      const blockedWall =
        (this.dir < 0 && this.body.blocked.left) ||
        (this.dir > 0 && this.body.blocked.right);
      const canWalkAhead =
        !blockedWall && (!onGround || this.hasFloorInDir(this.dir, platformBounds));

      this.setVelocityX(canWalkAhead && Math.abs(dx) > 10 ? this.dir * cfg.walkSpeed : 0);

      // Check charge trigger: within 380px, similar height, visible, and floor ahead
      if (
        onGround &&
        this.dashCooldown <= 0 &&
        dx * dx + dy * dy <= cfg.triggerRange * cfg.triggerRange &&
        Math.abs(dy) <= cfg.sameHeightTolerance &&
        this.hasFloorInDir(wantDir, platformBounds) &&
        isTargetVisible(this.x, this.y, player, losObstacles)
      ) {
        this.dashDir = wantDir;
        this.setFlipX(this.dashDir < 0);
        this.setVelocityX(0);
        this.chargerState = 'telegraph';
        this.stateTimer = cfg.telegraphMs;
        this.telegraphBlinkTimer = 0;
        this.telegraphFlashOn = true;
        this.applyVisualScale(cfg.squashScaleX, cfg.squashScaleY);
        this.refreshVisualTint();
        this.scene.audioManager.playEnemyTelegraph();
      }
      return;
    }

    if (this.chargerState === 'telegraph') {
      this.setVelocityX(0);
      this.stateTimer -= delta;
      this.telegraphBlinkTimer += delta;
      if (this.telegraphBlinkTimer >= cfg.telegraphFlashIntervalMs) {
        this.telegraphBlinkTimer -= cfg.telegraphFlashIntervalMs;
        this.telegraphFlashOn = !this.telegraphFlashOn;
        this.refreshVisualTint();
      }

      if (this.stateTimer <= 0) {
        this.telegraphFlashOn = false;
        this.chargerState = 'dash';
        this.dashTraveled = 0;
        this.applyVisualScale(cfg.dashScaleX, cfg.dashScaleY);
        this.refreshVisualTint();
        this.scene.audioManager.playChargerDash();
      }
      return;
    }

    if (this.chargerState === 'dash') {
      this.setVelocityX(this.dashDir * cfg.dashSpeed);
      this.dashTraveled += cfg.dashSpeed * (delta / 1000);

      const hitWall =
        (this.dashDir < 0 && this.body.blocked.left) ||
        (this.dashDir > 0 && this.body.blocked.right);
      const hitEdge = onGround && !this.hasFloorInDir(this.dashDir, platformBounds);

      if (this.dashTraveled >= cfg.maxDashDistance || hitWall || hitEdge) {
        this.setVelocityX(0);
        this.applyVisualScale(1, 1);
        this.chargerState = 'stun';
        this.stateTimer = cfg.stunMs;
        this.refreshVisualTint();
      }
      return;
    }

    if (this.chargerState === 'stun') {
      this.setVelocityX(0);
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        this.chargerState = 'walk';
        this.dashCooldown = cfg.dashCooldownMs;
        this.refreshVisualTint();
      }
    }
  }
}
