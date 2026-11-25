import { BALANCE } from '../config/balance.js';
import { WEAPONS } from '../data/weapons.js';

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

  /**
   * Returns true when this projectile should be released back to the pool.
   */
  updateProjectile(delta, player, enemies) {
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

    // Remove when leaving the room
    const margin = pCfg.ROOM_MARGIN;
    if (
      this.x < -margin ||
      this.x > BALANCE.GAME.WIDTH + margin ||
      this.y < -margin ||
      this.y > BALANCE.GAME.HEIGHT + margin
    ) {
      return true;
    }

    const dtSec = delta / 1000;

    if (this.behavior === 'homing') {
      const target = this.findNearestEnemy(enemies);
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
          this.leg = 'return';
          this.hitEnemies.clear(); // Allow hitting the same enemy on return leg
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

  findNearestEnemy(enemies) {
    let best = null;
    let bestDistSq = Infinity;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || !e.active || e.isDead) {
        continue;
      }
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        best = e;
      }
    }
    return best;
  }
}
