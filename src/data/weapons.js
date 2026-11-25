export const WEAPONS = {
  rusty_sword: {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    type: 'melee',
    baseDamage: 10,
    intervalMs: 500,
    range: 90,
    arcAngleDeg: 100,
    hitAllInArc: true,
    swingDurationMs: 140,
    swingSweepRad: 1.15,
    builtInKnockbackSpeed: 0,
    builtInKnockbackMs: 0,
    iconKey: 'icon_rusty_sword'
  },

  dagger: {
    id: 'dagger',
    name: 'Dagger',
    type: 'melee',
    baseDamage: 6,
    intervalMs: 220,
    range: 70,
    arcAngleDeg: 55,
    hitAllInArc: false,
    swingDurationMs: 85,
    swingSweepRad: 0.65,
    builtInKnockbackSpeed: 0,
    builtInKnockbackMs: 0,
    iconKey: 'icon_dagger'
  },

  battle_axe: {
    id: 'battle_axe',
    name: 'Battle Axe',
    type: 'melee',
    baseDamage: 24,
    intervalMs: 900,
    range: 100,
    arcAngleDeg: 160,
    hitAllInArc: true,
    swingDurationMs: 220,
    swingSweepRad: 2.79,
    builtInKnockbackSpeed: 190,
    builtInKnockbackMs: 120,
    iconKey: 'icon_battle_axe'
  },

  short_bow: {
    id: 'short_bow',
    name: 'Short Bow',
    type: 'ranged',
    projectileBehavior: 'straight',
    projectileTexture: 'proj_arrow',
    projectileSpeed: 640,
    baseDamage: 9,
    intervalMs: 600,
    range: 420,
    arcAngleDeg: 0,
    builtInKnockbackSpeed: 0,
    builtInKnockbackMs: 0,
    iconKey: 'icon_short_bow'
  },

  magic_staff: {
    id: 'magic_staff',
    name: 'Magic Staff',
    type: 'ranged',
    projectileBehavior: 'homing',
    projectileTexture: 'proj_orb',
    projectileSpeed: 250,
    turnRateRadPerSec: 4.2,
    baseDamage: 14,
    intervalMs: 800,
    range: 360,
    arcAngleDeg: 0,
    builtInKnockbackSpeed: 0,
    builtInKnockbackMs: 0,
    iconKey: 'icon_magic_staff'
  },

  boomerang: {
    id: 'boomerang',
    name: 'Boomerang',
    type: 'ranged',
    projectileBehavior: 'boomerang',
    projectileTexture: 'proj_boomerang',
    projectileSpeed: 440,
    returnSpeed: 500,
    baseDamage: 11,
    intervalMs: 700,
    range: 300,
    arcAngleDeg: 0,
    builtInKnockbackSpeed: 0,
    builtInKnockbackMs: 0,
    iconKey: 'icon_boomerang'
  }
};

export const WEAPON_IDS = Object.keys(WEAPONS);
