import { WEAPONS } from '../data/weapons.js';
import { isTargetVisible } from './LineOfSight.js';

export class AutoAttack {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.cooldownTimer = 0;
  }

  resetCooldown() {
    this.cooldownTimer = 0;
  }

  update(delta, enemies, losObstacles) {
    if (!this.player || this.player.isDead) {
      return;
    }

    const weapon = this.player.weapon;
    if (!weapon) {
      return;
    }

    this.cooldownTimer = Math.max(0, this.cooldownTimer - delta);

    const nearest = this.findNearestVisibleEnemyInRange(
      enemies,
      weapon.range,
      losObstacles
    );
    if (!nearest) {
      return;
    }

    // Auto-face nearest visible enemy inside weapon range
    const dx = nearest.x - this.player.x;
    if (Math.abs(dx) > 0.5) {
      this.player.setFacing(dx < 0 ? -1 : 1);
    }

    if (this.cooldownTimer > 0) {
      return;
    }

    const effectiveInterval = weapon.intervalMs / this.player.attackSpeedMultiplier;
    this.cooldownTimer = effectiveInterval;

    if (weapon.type === 'ranged') {
      this.performRangedAttack(nearest, weapon);
    } else {
      this.performMeleeAttack(nearest, enemies, weapon, losObstacles);
    }
  }

  findNearestVisibleEnemyInRange(enemies, range, losObstacles) {
    let bestEnemy = null;
    let bestDistSq = range * range;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy || !enemy.active || enemy.isDead) {
        continue;
      }

      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > bestDistSq) {
        continue;
      }

      if (!isTargetVisible(this.player.x, this.player.y, enemy, losObstacles)) {
        continue;
      }

      bestDistSq = distSq;
      bestEnemy = enemy;
    }

    return bestEnemy;
  }

  performMeleeAttack(primaryTarget, enemies, weapon, losObstacles) {
    const baseCfg = WEAPONS[weapon.baseId];
    const aimAngle = Math.atan2(
      primaryTarget.y - this.player.y,
      primaryTarget.x - this.player.x
    );

    this.scene.audioManager.playSwing();
    this.scene.spawnSwingVisual(aimAngle, weapon, baseCfg);

    // Single-target fast melee (Dagger)
    if (!baseCfg.hitAllInArc) {
      if (isTargetVisible(this.player.x, this.player.y, primaryTarget, losObstacles)) {
        this.scene.applyWeaponInstanceHit(
          primaryTarget,
          weapon,
          this.player.x,
          this.player.y
        );
      }
      return;
    }

    // Arc melee (Rusty Sword, Battle Axe): check visibility per enemy
    const halfArcRad = Phaser.Math.DegToRad(weapon.arcAngleDeg * 0.5);
    const rangeSq = weapon.range * weapon.range;

    const candidates = enemies.slice();
    for (let i = 0; i < candidates.length; i++) {
      const enemy = candidates[i];
      if (!enemy || !enemy.active || enemy.isDead) {
        continue;
      }

      if (enemy === primaryTarget) {
        if (isTargetVisible(this.player.x, this.player.y, enemy, losObstacles)) {
          this.scene.applyWeaponInstanceHit(
            enemy,
            weapon,
            this.player.x,
            this.player.y
          );
        }
        continue;
      }

      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      if (dx * dx + dy * dy > rangeSq) {
        continue;
      }

      const angleToEnemy = Math.atan2(dy, dx);
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToEnemy - aimAngle));
      if (
        angleDiff <= halfArcRad &&
        isTargetVisible(this.player.x, this.player.y, enemy, losObstacles)
      ) {
        this.scene.applyWeaponInstanceHit(
          enemy,
          weapon,
          this.player.x,
          this.player.y
        );
      }
    }
  }

  performRangedAttack(target, weapon) {
    const aimAngle = Math.atan2(
      target.y - this.player.y,
      target.x - this.player.x
    );

    this.scene.audioManager.playRangedShot();
    this.scene.spawnProjectile(
      this.player.x,
      this.player.y,
      aimAngle,
      weapon
    );
  }
}
