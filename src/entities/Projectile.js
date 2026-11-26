import { BALANCE } from '../config/balance.js';
import { WEAPONS } from '../data/weapons.js';
import { isTargetVisible } from '../systems/LineOfSight.js';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 0, 0, 'proj_arrow');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(BALANCE.PROJECTILES.DEPTH);
    this.weaponInstance = null;
    this.baseCfg = null;
    this.behavior = 'straight';
    this.travelAngle = 0;
    this.speed = 0;
    this.returnSpeed = 0;
    this.maxRange = 0;
    this.traveledDist = 0;
    this.leg = 'outbound';
    this.elapsedMs = 0;
    this.hasStopped = false;
    this.hitEnemies = new Set();

    this.deactivate();
  }

  spawn(x, y, aimAngle, weaponInstance) {
    const baseCfg = WEAPONS[weaponInstance.baseId];
    const pCfg = BALANCE.PROJECTILES;

    this.weaponInstance = weaponInstance;
    this.baseCfg = baseCfg;
    this.behavior = baseCfg.projectileBehavior || 'straight';
    this.travelAngle = aimAngle;
    this.speed = baseCfg.projectileSpeed;
    this.returnSpeed = baseCfg.returnSpeed || baseCfg.projectileSpeed;
    this.maxRange = weaponInstance.range;
    this.traveledDist = 0;
    this.leg = 'outbound';
    this.elapsedMs = 0;
    this.hasStopped = false;
    this.hitEnemies.clear();

    this.setTexture(baseCfg.projectileTexture);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setAllowGravity(false);

    if (this.behavior === 'straight') {
      this.body.setSize(pCfg.ARROW_HEIGHT * 2, pCfg.ARROW_HEIGHT * 2);
      this.setRotation(aimAngle);
    } else if (this.behavior === 'homing') {
      this.body.setSize(pCfg.ORB_SIZE, pCfg.ORB_SIZE);
      this.setRotation(0);
    } else {
      this.body.setSize(pCfg.BOOMERANG_SIZE, pCfg.BOOMERANG_SIZE);
      this.setRotation(0);
    }

    this.setVelocity(
      Math.cos(aimAngle) * this.speed,
      Math.sin(aimAngle) * this.speed
    );
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.hitEnemies.clear();
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
  }

  triggerReturnLeg() {
    if (this.behavior !== 'boomerang' || this.leg === 'return') {
      return;
    }
    this.leg = 'return';
    this.hitEnemies.clear(); // Allow hitting the same enemy on return leg
  }

  canHitEnemy(enemy) {
    if (!this.active || this.hasStopped || !enemy || !enemy.active || enemy.isDead) {
      return false;
    }
    return !this.hitEnemies.has(enemy);
  }

  registerEnemyHit(enemy) {
    this.hitEnemies.add(enemy);
    if (this.behavior !== 'boomerang') {
      this.hasStopped = true;
    }
  }

  updateProjectile(delta, player, enemies, roomWidth, roomHeight, losObstacles) {
    if (!this.active) {
      return false;
    }
    if (this.hasStopped) {
      return true;
    }

    const pCfg = BALANCE.PROJECTILES;
    this.elapsedMs += delta;
    if (this.elapsedMs >= pCfg.MAX_LIFETIME_MS) {
      return true;
    }

    const pad = pCfg.WALL_HIT_PAD;
    const hitWall =
      this.x <= pad ||
      this.x >= roomWidth - pad ||
      this.y <= pad ||
      this.y >= roomHeight - pad;

    if (hitWall) {
      const clampedX = Phaser.Math.Clamp(this.x, pad, roomWidth - pad);
      const clampedY = Phaser.Math.Clamp(this.y, pad, roomHeight - pad);

      if (this.behavior === 'boomerang') {
        if (this.leg === 'outbound') {
          this.scene.spawnProjectileImpactSpark(clampedX, clampedY);
          this.triggerReturnLeg();
        }
      } else {
        this.scene.spawnProjectileImpactSpark(clampedX, clampedY);
        return true;
      }
    }

    // Safety bounds removal
    const margin = pCfg.ROOM_MARGIN;
    if (
      this.x < -margin ||
      this.x > roomWidth + margin ||
      this.y < -margin ||
      this.y > roomHeight + margin
    ) {
      return true;
    }

    const dtSec = delta / 1000;

    if (this.behavior === 'homing') {
      const target = this.findNearestEnemy(enemies, losObstacles);
      if (target) {
        const desiredAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.travelAngle = Phaser.Math.Angle.RotateTo(
          this.travelAngle,
          desiredAngle,
          this.baseCfg.turnRateRadPerSec * dtSec
        );
      }
      this.setVelocity(
        Math.cos(this.travelAngle) * this.speed,
        Math.sin(this.travelAngle) * this.speed
      );
    } else if (this.behavior === 'boomerang') {
      this.rotation += pCfg.BOOMERANG_SPIN_SPEED * delta;

      if (this.leg === 'outbound') {
        this.traveledDist += this.speed * dtSec;
        if (this.traveledDist >= this.maxRange) {
          this.triggerReturnLeg();
        }
      }

      if (this.leg === 'return') {
        if (!player || player.isDead) {
          return true;
        }
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= pCfg.BOOMERANG_CATCH_RADIUS) {
          return true;
        }
        this.setVelocity(
          (dx / dist) * this.returnSpeed,
          (dy / dist) * this.returnSpeed
        );
      }
    }

    return false;
  }

  findNearestEnemy(enemies, losObstacles) {
    let bestVisible = null;
    let bestVisibleDistSq = Infinity;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || !e.active || e.isDead) {
        continue;
      }
      if (!isTargetVisible(this.x, this.y, e, losObstacles)) {
        continue;
      }
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestVisibleDistSq) {
        bestVisibleDistSq = dSq;
        bestVisible = e;
      }
    }
    return bestVisible;
  }
}

/**
 * Pooled enemy projectile (Archer arrow, max 20 active).
 */
export class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 0, 0, 'enemy_arrow');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(BALANCE.ENEMY_PROJECTILES.DEPTH);
    this.damage = 10;
    this.elapsedMs = 0;
    this.hasStopped = false;

    this.deactivate();
  }

  spawn(x, y, angle, damage) {
    const epCfg = BALANCE.ENEMY_PROJECTILES;
    this.damage = damage;
    this.elapsedMs = 0;
    this.hasStopped = false;

    this.setTexture('enemy_arrow');
    this.setPosition(x, y);
    this.setRotation(angle);
    this.setActive(true);
    this.setVisible(true);

    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setAllowGravity(false);
    this.body.setSize(epCfg.HEIGHT * 2, epCfg.HEIGHT * 2);

    this.setVelocity(
      Math.cos(angle) * epCfg.SPEED,
      Math.sin(angle) * epCfg.SPEED
    );
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
  }

  updateEnemyProjectile(delta, roomWidth, roomHeight) {
    if (!this.active) {
      return false;
    }
    if (this.hasStopped) {
      return true;
    }

    const epCfg = BALANCE.ENEMY_PROJECTILES;
    this.elapsedMs += delta;
    if (this.elapsedMs >= epCfg.LIFETIME_MS) {
      return true;
    }

    const pad = epCfg.WALL_HIT_PAD;
    if (
      this.x <= pad ||
      this.x >= roomWidth - pad ||
      this.y <= pad ||
      this.y >= roomHeight - pad
    ) {
      this.scene.spawnProjectileImpactSpark(
        Phaser.Math.Clamp(this.x, pad, roomWidth - pad),
        Phaser.Math.Clamp(this.y, pad, roomHeight - pad)
      );
      return true;
    }

    return false;
  }
}
