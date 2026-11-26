import { BALANCE } from '../config/balance.js';
import { ENEMIES } from '../data/enemies.js';

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

    // Burn DoT state (M3)
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.burnFxTimer = 0;
    this.burnDps = 0;
    this.burnCarry = 0;

    this.body.setSize(cfg.width, cfg.height);
    this.setCollideWorldBounds(true);

    if (cfg.behavior === 'patrol') {
      this.body.setAllowGravity(true);
      this.dir = Math.random() < 0.5 ? -1 : 1;
      this.setFlipX(this.dir < 0);
    } else {
      this.body.setAllowGravity(false);
      this.waveTime = (Math.random() * Math.PI * 2) / cfg.waveFrequency;
    }
  }

  refreshVisualTint() {
    if (this.hitFlashTimer > 0) {
      this.setTintFill(0xffffff);
    } else if (this.burnTimer > 0) {
      this.setTint(BALANCE.AFFIXES.BURN.TINT_COLOR);
    } else {
      this.clearTint();
    }
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

    this.knockbackTimer = Math.max(this.knockbackTimer, durationMs);

    if (this.cfg.behavior === 'patrol') {
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
    // Refresh timer without stacking
    this.burnTimer = durationMs;
    this.burnDps = dps;

    if (!wasBurning) {
      this.burnTickTimer = BALANCE.AFFIXES.BURN.TICK_INTERVAL_MS;
      this.burnFxTimer = 0;
      this.burnCarry = 0;
    }

    this.refreshVisualTint();
  }

  update(delta, player, platformBounds) {
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
    }
  }

  updatePatrol(platformBounds) {
    const cfg = this.cfg;
    const onGround = this.body.blocked.down || this.body.touching.down;

    if (this.body.blocked.left) {
      this.dir = 1;
    } else if (this.body.blocked.right) {
      this.dir = -1;
    } else if (onGround) {
      const probeX = this.x + this.dir * (this.body.halfWidth + cfg.edgeProbeOffsetX);
      const probeY = this.body.bottom + cfg.edgeProbeOffsetY;

      let hasFloorAhead = false;
      for (let i = 0; i < platformBounds.length; i++) {
        const b = platformBounds[i];
        if (probeX >= b.left && probeX <= b.right && probeY >= b.top && probeY <= b.bottom) {
          hasFloorAhead = true;
          break;
        }
      }

      if (!hasFloorAhead) {
        this.dir *= -1;
      }
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
}
