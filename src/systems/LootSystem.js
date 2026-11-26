import { BALANCE } from '../config/balance.js';
import { WEAPONS, WEAPON_IDS } from '../data/weapons.js';
import { PASSIVES, PASSIVES_BY_RARITY } from '../data/passives.js';

let nextWeaponUid = 1;

function rollWeightedMap(weightMap, keysOrder = Object.keys(weightMap)) {
  let total = 0;
  for (let i = 0; i < keysOrder.length; i++) {
    total += weightMap[keysOrder[i]] || 0;
  }
  let roll = Math.random() * total;
  for (let i = 0; i < keysOrder.length; i++) {
    const key = keysOrder[i];
    roll -= weightMap[key] || 0;
    if (roll <= 0) {
      return key;
    }
  }
  return keysOrder[0];
}

export function rollRarity() {
  const order = BALANCE.RARITY_ORDER;
  let totalWeight = 0;
  for (let i = 0; i < order.length; i++) {
    totalWeight += BALANCE.RARITIES[order[i]].dropWeight;
  }

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < order.length; i++) {
    const key = order[i];
    roll -= BALANCE.RARITIES[key].dropWeight;
    if (roll <= 0) {
      return key;
    }
  }
  return order[0];
}

function rollAffix(type) {
  const aCfg = BALANCE.AFFIXES;
  if (type === 'burn') {
    return {
      type: 'burn',
      value: aCfg.BURN.DPS_RATIO
    };
  }
  if (type === 'knockback') {
    return {
      type: 'knockback',
      value: aCfg.KNOCKBACK.DURATION_MS
    };
  }
  const bonusRaw =
    aCfg.CRIT.BONUS_MIN + Math.random() * (aCfg.CRIT.BONUS_MAX - aCfg.CRIT.BONUS_MIN);
  const bonusRounded = Math.round(bonusRaw * 100) / 100;
  return {
    type: 'crit',
    value: bonusRounded
  };
}

function rollAffixesForRarity(rarityCfg) {
  const min = rarityCfg.minAffixes;
  const max = rarityCfg.maxAffixes;
  const count = min === max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
  if (count <= 0) {
    return [];
  }

  const pool = BALANCE.AFFIXES.M3_POOL.slice();
  const chosen = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const type = pool.splice(idx, 1)[0];
    chosen.push(rollAffix(type));
  }
  return chosen;
}

export function createWeaponInstance(baseId, rarity = 'common', depth = 0) {
  const base = WEAPONS[baseId] || WEAPONS.rusty_sword;
  const rarityCfg = BALANCE.RARITIES[rarity] || BALANCE.RARITIES.common;
  const sCfg = BALANCE.WEAPON_SCALING;

  const variance =
    sCfg.VARIANCE_MIN + Math.random() * (sCfg.VARIANCE_MAX - sCfg.VARIANCE_MIN);
  const depthMultiplier = 1 + BALANCE.DEPTH_SCALING.WEAPON_DAMAGE_FACTOR * depth;
  const rawDamage = base.baseDamage * rarityCfg.multiplier * variance * depthMultiplier;
  const damage = Math.max(1, Math.round(rawDamage));

  return {
    id: `wpn_${nextWeaponUid++}`,
    baseId: base.id,
    name: base.name,
    type: base.type,
    rarity: rarityCfg.id,
    damage,
    intervalMs: base.intervalMs,
    range: base.range,
    arcAngleDeg: base.arcAngleDeg,
    affixes: rollAffixesForRarity(rarityCfg)
  };
}

export function createRandomWeaponDrop(depth = 0) {
  const baseId = WEAPON_IDS[Math.floor(Math.random() * WEAPON_IDS.length)];
  const rarity = rollRarity();
  return createWeaponInstance(baseId, rarity, depth);
}

export function rollChestTier() {
  const cCfg = BALANCE.CHESTS;
  const weights = {};
  for (const tierKey of cCfg.TIER_ORDER) {
    weights[tierKey] = cCfg.TIERS[tierKey].spawnWeight;
  }
  return rollWeightedMap(weights, cCfg.TIER_ORDER);
}

export function rollChestTierByWeights(weightsMap) {
  return rollWeightedMap(weightsMap, BALANCE.CHESTS.TIER_ORDER);
}

export function rollPassiveForRarity(rolledRarity) {
  const order = BALANCE.RARITY_ORDER;
  let idx = order.indexOf(rolledRarity);
  if (idx === -1) {
    idx = 0;
  }

  // Fall back to nearest lower rarity if no passive exists at rolled rarity
  for (let i = idx; i >= 0; i--) {
    const rarityKey = order[i];
    const list = PASSIVES_BY_RARITY[rarityKey];
    if (list && list.length > 0) {
      const passiveId = list[Math.floor(Math.random() * list.length)];
      return PASSIVES[passiveId];
    }
  }

  return PASSIVES.heart_charm;
}

export function rollConsumable() {
  const key = rollWeightedMap(BALANCE.CONSUMABLES.POOL_WEIGHTS);
  return key === 'rage_orb'
    ? BALANCE.CONSUMABLES.RAGE_ORB
    : BALANCE.CONSUMABLES.HEAL_ORB;
}

export function rollChestLoot(tierId, depth = 0) {
  const cCfg = BALANCE.CHESTS;
  const tierCfg = cCfg.TIERS[tierId] || cCfg.TIERS.wooden;

  const category = rollWeightedMap(cCfg.LOOT_WEIGHTS, [
    'weapon',
    'passive',
    'consumable'
  ]);

  if (category === 'consumable') {
    const consumable = rollConsumable();
    return {
      category: 'consumable',
      consumable
    };
  }

  const rarity = rollWeightedMap(tierCfg.rarityWeights, BALANCE.RARITY_ORDER);

  if (category === 'weapon') {
    const baseId = WEAPON_IDS[Math.floor(Math.random() * WEAPON_IDS.length)];
    return {
      category: 'weapon',
      weapon: createWeaponInstance(baseId, rarity, depth)
    };
  }

  const passive = rollPassiveForRarity(rarity);
  return {
    category: 'passive',
    passive
  };
}

export function formatAffixDescription(affix) {
  const aCfg = BALANCE.AFFIXES;
  if (affix.type === 'burn') {
    const pct = Math.round(affix.value * 100);
    const sec = Math.round(aCfg.BURN.DURATION_MS / 1000);
    return `Burn: ${pct}% dmg/s (${sec}s)`;
  }
  if (affix.type === 'knockback') {
    return `Knockback (${affix.value}ms push)`;
  }
  if (affix.type === 'crit') {
    const totalPct = Math.round((aCfg.CRIT.BASE_CHANCE + affix.value) * 100);
    return `Crit: ${totalPct}% chance (${aCfg.CRIT.MULTIPLIER}x)`;
  }
  return affix.type;
}
