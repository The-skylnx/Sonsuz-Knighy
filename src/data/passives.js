import { BALANCE } from '../config/balance.js';

const P = BALANCE.PASSIVES;

export const PASSIVES = {
  heart_charm: {
    id: 'heart_charm',
    name: 'Heart Charm',
    rarity: 'common',
    letter: 'H',
    description: `+${P.HEART_CHARM.MAX_HP_BONUS} max HP & heal ${P.HEART_CHARM.HEAL_AMOUNT}`,
    pickupText: `Heart Charm +${P.HEART_CHARM.MAX_HP_BONUS} max HP`
  },

  boots_of_wind: {
    id: 'boots_of_wind',
    name: 'Boots of Wind',
    rarity: 'common',
    letter: 'B',
    description: `+${Math.round(P.BOOTS_OF_WIND.MOVE_SPEED_PCT * 100)}% move speed`,
    pickupText: `Boots of Wind +${Math.round(P.BOOTS_OF_WIND.MOVE_SPEED_PCT * 100)}% speed`
  },

  magnet_ring: {
    id: 'magnet_ring',
    name: 'Magnet Ring',
    rarity: 'common',
    letter: 'M',
    description: `+${P.MAGNET_RING.RADIUS_BONUS} magnet radius`,
    pickupText: `Magnet Ring +${P.MAGNET_RING.RADIUS_BONUS} magnet`
  },

  sharp_stone: {
    id: 'sharp_stone',
    name: 'Sharp Stone',
    rarity: 'uncommon',
    letter: 'S',
    description: `+${Math.round(P.SHARP_STONE.DAMAGE_PCT * 100)}% damage`,
    pickupText: `Sharp Stone +${Math.round(P.SHARP_STONE.DAMAGE_PCT * 100)}% damage`
  },

  quick_gloves: {
    id: 'quick_gloves',
    name: 'Quick Gloves',
    rarity: 'uncommon',
    letter: 'Q',
    description: `+${Math.round(P.QUICK_GLOVES.ATTACK_SPEED_PCT * 100)}% attack speed`,
    pickupText: `Quick Gloves +${Math.round(P.QUICK_GLOVES.ATTACK_SPEED_PCT * 100)}% atk spd`
  },

  greedy_coin: {
    id: 'greedy_coin',
    name: 'Greedy Coin',
    rarity: 'uncommon',
    letter: 'G',
    description: `+${Math.round(P.GREEDY_COIN.GOLD_PCT * 100)}% gold from enemies`,
    pickupText: `Greedy Coin +${Math.round(P.GREEDY_COIN.GOLD_PCT * 100)}% gold`
  },

  thorn_armor: {
    id: 'thorn_armor',
    name: 'Thorn Armor',
    rarity: 'rare',
    letter: 'T',
    description: `Reflect ${P.THORN_ARMOR.REFLECT_DAMAGE} contact damage`,
    pickupText: `Thorn Armor +${P.THORN_ARMOR.REFLECT_DAMAGE} thorns`
  },

  spring_shoes: {
    id: 'spring_shoes',
    name: 'Spring Shoes',
    rarity: 'rare',
    letter: 'J',
    description: 'Unlock double jump',
    pickupText: 'Spring Shoes: Double Jump!'
  },

  vampire_fang: {
    id: 'vampire_fang',
    name: 'Vampire Fang',
    rarity: 'epic',
    letter: 'V',
    description: `Heal ${P.VAMPIRE_FANG.HEAL_AMOUNT} HP every ${P.VAMPIRE_FANG.KILLS_INTERVAL} kills`,
    pickupText: `Vampire Fang +${P.VAMPIRE_FANG.HEAL_AMOUNT} HP/${P.VAMPIRE_FANG.KILLS_INTERVAL} kills`
  }
};

export const PASSIVES_BY_RARITY = {
  common: ['heart_charm', 'boots_of_wind', 'magnet_ring'],
  uncommon: ['sharp_stone', 'quick_gloves', 'greedy_coin'],
  rare: ['thorn_armor', 'spring_shoes'],
  epic: ['vampire_fang'],
  legendary: []
};
