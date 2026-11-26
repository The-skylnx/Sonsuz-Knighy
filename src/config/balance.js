export const BALANCE = {
  GAME: {
    WIDTH: 1280,
    HEIGHT: 720,
    BACKGROUND_COLOR: '#161622',
    GRID_COLOR: 0x222238,
    GRID_SIZE: 64,
    GRID_ALPHA: 0.45,
    EXTRA_TOUCH_POINTERS: 3
  },

  PHYSICS: {
    GRAVITY_Y: 1400
  },

  PLAYER: {
    WIDTH: 36,
    HEIGHT: 48,
    COLOR: 0x4cc9f0,
    BORDER_COLOR: 0x90e0ef,
    BORDER_WIDTH: 2,
    EYE_COLOR: 0x161622,
    EYE_OFFSET_X: 22,
    EYE_OFFSET_Y: 11,
    EYE_WIDTH: 8,
    EYE_HEIGHT: 8,
    MOVE_SPEED: 240,
    MAX_VELOCITY_X: 900,
    JUMP_VELOCITY: -560,
    DOUBLE_JUMP_VELOCITY: -560,
    JUMP_CUT_MULTIPLIER: 0.5,
    COYOTE_TIME_MS: 100,
    JUMP_BUFFER_MS: 120,
    MAX_FALL_SPEED: 900,
    SPAWN_X: 88,
    SPAWN_Y: 600,
    MAX_HP: 100,
    DAMAGE_MULTIPLIER: 1.0,
    ATTACK_SPEED_MULTIPLIER: 1.0,
    MAGNET_RADIUS: 80,
    INVULN_DURATION_MS: 800,
    INVULN_BLINK_INTERVAL_MS: 80,
    BLINK_ALPHA_LOW: 0.25,
    STARTING_WEAPON: 'rusty_sword',
    STARTING_RARITY: 'common'
  },

  CONTROLS: {
    EDGE_MARGIN: 28,
    DIR_BUTTON_SIZE: 108,
    DIR_BUTTON_GAP: 20,
    JUMP_BUTTON_SIZE: 128,
    BUTTON_RADIUS: 22,
    HIT_PADDING: 8,
    ALPHA_IDLE: 0.35,
    ALPHA_PRESSED: 0.72,
    PRESSED_SCALE: 0.92,
    FILL_COLOR: 0x2b2d42,
    FILL_ALPHA: 0.85,
    STROKE_COLOR: 0xffffff,
    STROKE_WIDTH: 3,
    ICON_COLOR: 0xffffff,
    ICON_SIZE_RATIO: 0.26,
    VIBRATE_MS: 10,
    DEPTH: 100
  },

  LOS: {
    RECT_SHRINK_PX: 2,
    RAY_OFFSET_RATIO: 1 / 3,
    OUTER_WALL_THICKNESS: 64,
    DEBUG_NEAREST_COUNT: 3,
    DEBUG_CLEAR_COLOR: 0x52b788,
    DEBUG_BLOCKED_COLOR: 0xef476f,
    DEBUG_LINE_WIDTH: 2,
    DEBUG_ALPHA: 0.85,
    DEBUG_DEPTH: 60
  },

  ROOMS: {
    GROUND: {
      x: 640,
      y: 688,
      width: 1280,
      height: 64,
      topHeight: 6
    },
    PLATFORM_TOP_HEIGHT: 4,
    PALETTE_ROOMS_CYCLE: 10,
    BASE_ENEMY_QUOTA: 3,
    QUOTA_DEPTH_FACTOR: 0.6,
    BASE_MAX_ALIVE: 4,
    MAX_ALIVE_DEPTH_DIVISOR: 4,
    MAX_ALIVE_CAP: 12,
    CLEAR_MAGNET_DURATION_MS: 1500,
    FADE_OUT_MS: 200,
    FADE_IN_MS: 200,
    TRANSITION_INVULN_MS: 1000,
    DOOR_WIDTH: 48,
    DOOR_HEIGHT: 88,
    ENTRY_DOOR_X: 32,
    EXIT_DOOR_X: 1248,
    EXIT_TRIGGER_X: 1218,
    EXIT_TRIGGER_MIN_Y: 535,
    DOOR_DEPTH: 12,
    ENTRY_FRAME_COLOR: 0x4a4e69,
    ENTRY_FILL_COLOR: 0x12131f,
    LOCKED_COLOR: 0xef476f,
    LOCKED_DARK_COLOR: 0x2b121c,
    OPEN_COLOR: 0x52b788,
    OPEN_GLOW_COLOR: 0x80ffdb,
    OPEN_DARK_COLOR: 0x122b22,
    VALIDATION: {
      MAX_VERTICAL_STEP: 95,
      MAX_HORIZONTAL_GAP: 150,
      LEFT_DOOR_KEEP_OUT_X: 150,
      RIGHT_DOOR_KEEP_OUT_X: 1130,
      DOOR_KEEP_OUT_HEIGHT_ABOVE_GROUND: 220,
      MIN_GROUND_HEADROOM: 54
    }
  },

  THEMES: [
    {
      name: 'Crypt Slate',
      backgroundColor: '#161622',
      gridColor: 0x222238,
      groundColor: 0x2b2d42,
      groundTopColor: 0x5c677d,
      platformColor: 0x3a405a,
      platformTopColor: 0x7b8cde
    },
    {
      name: 'Mossy Catacombs',
      backgroundColor: '#121e1b',
      gridColor: 0x1d312c,
      groundColor: 0x243b35,
      groundTopColor: 0x52b788,
      platformColor: 0x2d4a43,
      platformTopColor: 0x74c69d
    },
    {
      name: 'Ember Forge',
      backgroundColor: '#211316',
      gridColor: 0x361e24,
      groundColor: 0x3d2229,
      groundTopColor: 0xe07a5f,
      platformColor: 0x4f2c35,
      platformTopColor: 0xf4a261
    },
    {
      name: 'Astral Sanctum',
      backgroundColor: '#191226',
      gridColor: 0x2b1f42,
      groundColor: 0x31234a,
      groundTopColor: 0x9d4edd,
      platformColor: 0x412e61,
      platformTopColor: 0xc77dff
    }
  ],

  DEPTH_SCALING: {
    ENEMY_HP_FACTOR: 0.12,
    ENEMY_DAMAGE_FACTOR: 0.08,
    ENEMY_GOLD_FACTOR: 0.06,
    CHEST_PRICE_FACTOR: 0.10,
    WEAPON_DAMAGE_FACTOR: 0.08
  },

  RARITIES: {
    common: {
      id: 'common',
      name: 'Common',
      color: 0xb0b8c8,
      hex: '#b0b8c8',
      multiplier: 1.0,
      minAffixes: 0,
      maxAffixes: 0,
      dropWeight: 70
    },
    uncommon: {
      id: 'uncommon',
      name: 'Uncommon',
      color: 0x52b788,
      hex: '#52b788',
      multiplier: 1.25,
      minAffixes: 0,
      maxAffixes: 1,
      dropWeight: 22
    },
    rare: {
      id: 'rare',
      name: 'Rare',
      color: 0x4cc9f0,
      hex: '#4cc9f0',
      multiplier: 1.6,
      minAffixes: 1,
      maxAffixes: 1,
      dropWeight: 6.5
    },
    epic: {
      id: 'epic',
      name: 'Epic',
      color: 0xc77dff,
      hex: '#c77dff',
      multiplier: 2.1,
      minAffixes: 1,
      maxAffixes: 2,
      dropWeight: 1.4
    },
    legendary: {
      id: 'legendary',
      name: 'Legendary',
      color: 0xffd166,
      hex: '#ffd166',
      multiplier: 3.0,
      minAffixes: 2,
      maxAffixes: 2,
      dropWeight: 0.1
    }
  },

  RARITY_ORDER: ['common', 'uncommon', 'rare', 'epic', 'legendary'],

  WEAPON_SCALING: {
    VARIANCE_MIN: 0.9,
    VARIANCE_MAX: 1.1,
    DEPTH_FACTOR: 0.08
  },

  AFFIXES: {
    M3_POOL: ['burn', 'knockback', 'crit'],
    BURN: {
      DPS_RATIO: 0.30,
      DURATION_MS: 3000,
      TICK_INTERVAL_MS: 500,
      TINT_COLOR: 0xff7b00,
      FX_INTERVAL_MS: 220,
      FX_DURATION_MS: 380,
      FX_RISE_SPEED: 48,
      FX_POOL_INITIAL: 12,
      FX_SIZE: 12,
      FX_OUTER_COLOR: 0xff7b00,
      FX_INNER_COLOR: 0xffd166
    },
    KNOCKBACK: {
      SPEED: 300,
      DURATION_MS: 150,
      GROUND_HOP_VY: -80
    },
    CRIT: {
      BASE_CHANCE: 0.15,
      BONUS_MIN: 0.05,
      BONUS_MAX: 0.15,
      MULTIPLIER: 2.0
    }
  },

  PROJECTILES: {
    MAX_ACTIVE: 30,
    POOL_INITIAL: 14,
    ROOM_MARGIN: 24,
    WALL_HIT_PAD: 8,
    MAX_LIFETIME_MS: 5000,
    ARROW_WIDTH: 24,
    ARROW_HEIGHT: 8,
    ARROW_COLOR: 0xe0fbfc,
    ARROW_HEAD_COLOR: 0xffd166,
    ORB_SIZE: 18,
    ORB_OUTER_COLOR: 0xc77dff,
    ORB_INNER_COLOR: 0xffffff,
    BOOMERANG_SIZE: 24,
    BOOMERANG_COLOR: 0xf4a261,
    BOOMERANG_BORDER_COLOR: 0xfff3b0,
    BOOMERANG_CATCH_RADIUS: 28,
    BOOMERANG_SPIN_SPEED: 0.016,
    DEPTH: 35
  },

  ENEMY_PROJECTILES: {
    MAX_ACTIVE: 20,
    POOL_INITIAL: 10,
    SPEED: 320,
    LIFETIME_MS: 3000,
    WALL_HIT_PAD: 8,
    WIDTH: 22,
    HEIGHT: 8,
    SHAFT_COLOR: 0xffccd5,
    HEAD_COLOR: 0xff4d6d,
    DEPTH: 36
  },

  WEAPONS_DROP: {
    ENEMY_DROP_CHANCE: 0.10,
    PICKUP_COOLDOWN_MS: 1500,
    POOL_INITIAL: 6,
    MAX_ACTIVE: 16,
    ICON_SIZE: 32,
    GLOW_SIZE: 58,
    BODY_SIZE: 34,
    TRIGGER_RADIUS: 36,
    POP_VY: -190,
    CHEST_POP_VX_SPREAD: 70,
    CHEST_POP_VY: -250,
    DRAG_X: 240,
    BOUNCE: 0.25,
    BOB_AMPLITUDE: 5,
    BOB_SPEED: 0.0045,
    VISUAL_OFFSET_Y: -8,
    COOLDOWN_ALPHA: 0.5,
    READY_ALPHA: 1.0,
    GLOW_IDLE_ALPHA: 0.55,
    GLOW_PULSE_ALPHA: 0.25,
    DEBUG_DROP_OFFSET_X: 60,
    DEBUG_DROP_MIN_X: 48,
    DEBUG_DROP_MAX_X: 1232,
    DEPTH: 30
  },

  // As of M5B, chests no longer spawn randomly inside combat or treasure rooms;
  // kept for debug C key and upcoming Merchant stock (M5E).
  CHESTS: {
    DEBUG_MAX_ACTIVE: 3,
    OPEN_RADIUS: 70,
    WIDTH: 46,
    HEIGHT: 36,
    DEBUG_OFFSET_X: 78,
    DEBUG_CLAMP_X: 160,
    SHAKE_DURATION_MS: 400,
    SHAKE_AMPLITUDE_X: 4,
    SHAKE_SPEED: 0.075,
    OPEN_LINGER_MS: 650,
    RED_FLASH_COOLDOWN_MS: 1000,
    RED_FLASH_DURATION_MS: 280,
    BUBBLE_OFFSET_Y: -34,
    BUBBLE_BOB_AMPLITUDE: 3,
    BUBBLE_BOB_SPEED: 0.004,
    BUBBLE_FONT_SIZE: '22px',
    BUBBLE_TEXT_COLOR: '#ffffff',
    BUBBLE_RED_COLOR: '#ef476f',
    BUBBLE_STROKE: '#0d0d16',
    BUBBLE_STROKE_WIDTH: 4,
    BUBBLE_COIN_SIZE: 18,
    BUBBLE_GAP: 5,
    BURST_PARTICLE_COUNT: 10,
    BURST_SPEED_MIN: 90,
    BURST_SPEED_MAX: 220,
    BURST_DURATION_MS: 420,
    FLASH_SIZE: 84,
    FLASH_DURATION_MS: 240,
    DEPTH: 25,
    LOOT_WEIGHTS: {
      weapon: 45,
      passive: 40,
      consumable: 15
    },
    TIER_ORDER: ['wooden', 'silver', 'golden'],
    TIERS: {
      wooden: {
        id: 'wooden',
        name: 'Wooden Chest',
        basePrice: 30,
        spawnWeight: 60,
        bodyColor: 0x9c6644,
        trimColor: 0xd4a373,
        latchColor: 0xe9ecef,
        rarityWeights: {
          common: 60,
          uncommon: 32,
          rare: 7,
          epic: 1,
          legendary: 0
        }
      },
      silver: {
        id: 'silver',
        name: 'Silver Chest',
        basePrice: 80,
        spawnWeight: 30,
        bodyColor: 0x6c7a9c,
        trimColor: 0xdbe4ff,
        latchColor: 0x4cc9f0,
        rarityWeights: {
          common: 20,
          uncommon: 45,
          rare: 28,
          epic: 6,
          legendary: 1
        }
      },
      golden: {
        id: 'golden',
        name: 'Golden Chest',
        basePrice: 200,
        spawnWeight: 10,
        bodyColor: 0xe09f3e,
        trimColor: 0xfff3b0,
        latchColor: 0xffd166,
        rarityWeights: {
          common: 0,
          uncommon: 10,
          rare: 55,
          epic: 30,
          legendary: 5
        }
      }
    }
  },

  PASSIVES: {
    HEART_CHARM: {
      MAX_HP_BONUS: 20,
      HEAL_AMOUNT: 20
    },
    BOOTS_OF_WIND: {
      MOVE_SPEED_PCT: 0.12
    },
    MAGNET_RING: {
      RADIUS_BONUS: 40
    },
    SHARP_STONE: {
      DAMAGE_PCT: 0.15
    },
    QUICK_GLOVES: {
      ATTACK_SPEED_PCT: 0.15
    },
    GREEDY_COIN: {
      GOLD_PCT: 0.25
    },
    THORN_ARMOR: {
      REFLECT_DAMAGE: 6
    },
    SPRING_SHOES: {
      EXTRA_JUMPS: 1
    },
    VAMPIRE_FANG: {
      HEAL_AMOUNT: 1,
      KILLS_INTERVAL: 5
    }
  },

  CONSUMABLES: {
    POOL_WEIGHTS: {
      heal_orb: 50,
      rage_orb: 50
    },
    HEAL_ORB: {
      id: 'heal_orb',
      name: 'Heal Orb',
      letter: '+',
      color: 0x52b788,
      hex: '#52b788',
      healMaxHpRatio: 0.30
    },
    RAGE_ORB: {
      id: 'rage_orb',
      name: 'Rage Orb',
      letter: 'R',
      color: 0xff595e,
      hex: '#ff595e',
      attackSpeedPct: 0.40,
      durationMs: 10000
    }
  },

  ITEM_PICKUPS: {
    POOL_INITIAL: 6,
    MAX_ACTIVE: 20,
    BODY_SIZE: 30,
    CIRCLE_RADIUS: 15,
    BORDER_WIDTH: 3,
    COLLECT_DELAY_MS: 320,
    PICKUP_RADIUS: 34,
    POP_VX_MIN: -65,
    POP_VX_MAX: 65,
    POP_VY: -250,
    BOUNCE: 0.3,
    DRAG_X: 220,
    BOB_AMPLITUDE: 4,
    BOB_SPEED: 0.005,
    VISUAL_OFFSET_Y: -6,
    LETTER_FONT_SIZE: '18px',
    DEPTH: 31
  },

  PUFF_FX: {
    POOL_INITIAL: 20,
    PARTICLE_SIZE: 14,
    DOUBLE_JUMP_COUNT: 5,
    DOUBLE_JUMP_SPREAD_VX: 95,
    DOUBLE_JUMP_VY_MIN: -30,
    DOUBLE_JUMP_VY_MAX: 40,
    DOUBLE_JUMP_DURATION_MS: 280,
    DOUBLE_JUMP_COLOR: 0xe0fbfc
  },

  STATUS_TEXT: {
    POOL_INITIAL: 6,
    DURATION_MS: 1150,
    RISE_SPEED: 38,
    FONT_SIZE: '22px',
    STROKE: '#0d0d16',
    STROKE_WIDTH: 4,
    OFFSET_Y: -34,
    EDGE_CLAMP_X: 150,
    DEPTH: 55
  },

  SPAWNER: {
    WARNING_DURATION_MS: 500,
    INITIAL_SPAWN_COUNT: 3,
    INITIAL_SPAWN_DELAY_MS: 350,
    SPAWN_INTERVAL_MS: 1400,
    MIN_PLAYER_DISTANCE: 180,
    PLATFORM_EDGE_MARGIN: 28,
    GROUND_MIN_SPAWN_X: 180,
    GROUND_MAX_SPAWN_X: 1120,
    BAT_MIN_X: 170,
    BAT_MAX_X: 1120,
    BAT_MIN_Y: 100,
    BAT_MAX_Y: 420,
    WARNING_SIZE: 34,
    WARNING_STROKE_WIDTH: 3,
    WARNING_COLOR: 0xff4d6d,
    WARNING_INNER_COLOR: 0xfff0f3,
    WARNING_PULSE_SPEED: 0.016,
    WARNING_MIN_SCALE: 0.8,
    WARNING_MAX_SCALE: 1.2,
    MAX_SPAWN_ATTEMPTS: 14,
    FALLBACK_SPAWN_X: 960,
    FALLBACK_SPAWN_Y: 200,
    ENEMY_POOL: [
      { type: 'slime', minDepth: 0, weight: 40 },
      { type: 'bat', minDepth: 0, weight: 25 },
      { type: 'archer', minDepth: 2, weight: 20 },
      { type: 'charger', minDepth: 4, weight: 15 }
    ]
  },

  COMBAT: {
    HIT_FLASH_MS: 90,
    SWING_BASE_RADIUS: 80,
    SWING_TEXTURE_SIZE: 180,
    SWING_MAX_THICKNESS: 22,
    SWING_HALF_ARC_RAD: 0.85,
    SWING_ARC_STEPS: 18,
    SWING_COLOR: 0xe0fbfc,
    SWING_CORE_COLOR: 0xffffff,
    SWING_ALPHA: 0.88,
    SWING_POOL_INITIAL: 4,
    HIT_EFFECT_SIZE: 28,
    HIT_EFFECT_COLOR: 0xfff3b0,
    HIT_EFFECT_DURATION_MS: 160,
    HIT_EFFECT_START_SCALE: 0.45,
    HIT_EFFECT_END_SCALE: 1.35,
    HIT_EFFECT_POOL_INITIAL: 10,
    DMG_TEXT_POOL_INITIAL: 14,
    DMG_TEXT_DURATION_MS: 600,
    DMG_TEXT_RISE_SPEED: 55,
    DMG_TEXT_FONT_SIZE: '26px',
    DMG_TEXT_COLOR: '#ffffff',
    CRIT_TEXT_FONT_SIZE: '36px',
    CRIT_TEXT_COLOR: '#ffd166',
    BURN_TEXT_FONT_SIZE: '22px',
    BURN_TEXT_COLOR: '#ff9f1c',
    HEAL_TEXT_FONT_SIZE: '24px',
    HEAL_TEXT_COLOR: '#52b788',
    DMG_TEXT_STROKE: '#0d0d16',
    DMG_TEXT_STROKE_WIDTH: 4,
    DMG_TEXT_SPREAD_X: 12,
    DMG_TEXT_OFFSET_Y: -18,
    FX_DEPTH: 40,
    DMG_TEXT_DEPTH: 50
  },

  GOLD: {
    MAX_ACTIVE_COINS: 60,
    POOL_INITIAL: 24,
    COIN_VALUE: 1,
    COIN_SIZE: 16,
    COIN_COLOR: 0xffd166,
    COIN_BORDER_COLOR: 0xf4a261,
    COIN_BORDER_WIDTH: 2,
    COIN_SHINE_COLOR: 0xfff3b0,
    POP_VX_MIN: -140,
    POP_VX_MAX: 140,
    POP_VY_MIN: -330,
    POP_VY_MAX: -180,
    BOUNCE: 0.45,
    DRAG_X: 180,
    MAGNET_DELAY_MS: 180,
    MAGNET_SPEED: 560,
    PICKUP_RADIUS: 26,
    COMBO_WINDOW_MS: 600,
    COMBO_PITCH_STEP: 0.06,
    COMBO_MAX_STEPS: 8,
    DEBUG_ADD_AMOUNT: 100
  },

  HUD: {
    MARGIN_X: 28,
    MARGIN_Y: 22,
    HP_BAR_WIDTH: 240,
    HP_BAR_HEIGHT: 30,
    HP_BG_COLOR: 0x2b2d42,
    HP_FILL_COLOR: 0xef476f,
    HP_BORDER_COLOR: 0xffffff,
    HP_BORDER_WIDTH: 2,
    FONT_SIZE: '28px',
    ROOM_FONT_SIZE: '28px',
    TEXT_COLOR: '#ffffff',
    GOLD_TEXT_COLOR: '#ffd166',
    BANNER_FONT_SIZE: '44px',
    BANNER_Y: 205,
    BANNER_DURATION_MS: 1500,
    TEXT_STROKE: '#0d0d16',
    TEXT_STROKE_WIDTH: 4,
    BANNER_STROKE_WIDTH: 6,
    GOLD_ICON_SIZE: 26,
    GOLD_ICON_GAP: 10,
    WEAPON_FRAME_OFFSET_Y: 10,
    WEAPON_FRAME_SIZE: 52,
    WEAPON_FRAME_RADIUS: 10,
    WEAPON_FRAME_BG: 0x1e2030,
    WEAPON_FRAME_BORDER_WIDTH: 3,
    WEAPON_ICON_DISPLAY_SIZE: 34,
    PASSIVE_ROW_OFFSET_Y: 10,
    PASSIVE_ICON_RADIUS: 16,
    PASSIVE_ICON_GAP: 8,
    PASSIVE_LETTER_SIZE: '16px',
    PASSIVE_STACK_SIZE: '14px',
    RAGE_BADGE_OFFSET_X: 12,
    RAGE_BADGE_RADIUS: 16,
    RAGE_TIMER_FONT_SIZE: '20px',
    FADE_OVERLAY_DEPTH: 190
  },

  COMPARE_CARD: {
    BACKDROP_COLOR: 0x0d0d16,
    BACKDROP_ALPHA: 0.76,
    PANEL_WIDTH: 880,
    PANEL_HEIGHT: 520,
    PANEL_RADIUS: 20,
    PANEL_BG: 0x1b1d2e,
    PANEL_BORDER: 0x4a4e69,
    PANEL_BORDER_WIDTH: 3,
    COL_WIDTH: 380,
    COL_HEIGHT: 330,
    COL_OFFSET_X: 205,
    COL_OFFSET_Y: -50,
    COL_BG: 0x24273d,
    COL_RADIUS: 14,
    COL_BORDER_WIDTH: 3,
    HEADER_FONT_SIZE: '20px',
    HEADER_COLOR: '#9aa5ce',
    NAME_FONT_SIZE: '28px',
    RARITY_FONT_SIZE: '18px',
    STAT_FONT_SIZE: '22px',
    STAT_COLOR: '#f4f6fb',
    AFFIX_FONT_SIZE: '20px',
    AFFIX_COLOR: '#80ffdb',
    NO_AFFIX_COLOR: '#6c757d',
    BUTTON_WIDTH: 340,
    BUTTON_HEIGHT: 92,
    BUTTON_RADIUS: 16,
    BUTTON_OFFSET_X: 205,
    BUTTON_OFFSET_Y: 185,
    EQUIP_COLOR: 0x52b788,
    EQUIP_PRESSED_COLOR: 0x40916c,
    LEAVE_COLOR: 0x4a4e69,
    LEAVE_PRESSED_COLOR: 0x36394f,
    BUTTON_BORDER_COLOR: 0xffffff,
    BUTTON_BORDER_WIDTH: 3,
    BUTTON_FONT_SIZE: '30px',
    BUTTON_TEXT_COLOR: '#ffffff',
    PRESSED_SCALE: 0.95,
    INPUT_DELAY_MS: 180,
    DEPTH: 200
  },

  GAME_OVER: {
    INPUT_DELAY_MS: 500,
    OVERLAY_COLOR: 0x0d0d16,
    OVERLAY_ALPHA: 0.78,
    TITLE_TEXT: 'You died',
    TITLE_FONT_SIZE: '64px',
    TITLE_COLOR: '#ef476f',
    TITLE_STROKE: '#0d0d16',
    TITLE_STROKE_WIDTH: 6,
    TITLE_OFFSET_Y: -95,
    SUBTITLE_FONT_SIZE: '30px',
    SUBTITLE_COLOR: '#f4f6fb',
    SUBTITLE_OFFSET_Y: -22,
    BUTTON_TEXT: 'RESTART',
    BUTTON_WIDTH: 280,
    BUTTON_HEIGHT: 88,
    BUTTON_RADIUS: 18,
    BUTTON_OFFSET_Y: 70,
    BUTTON_COLOR: 0x4cc9f0,
    BUTTON_PRESSED_COLOR: 0x3a9fc0,
    BUTTON_BORDER_COLOR: 0xffffff,
    BUTTON_BORDER_WIDTH: 3,
    BUTTON_TEXT_SIZE: '32px',
    BUTTON_TEXT_COLOR: '#0d0d16',
    PRESSED_SCALE: 0.95
  },

  DEBUG: {
    X: 28,
    Y: 168,
    PADDING_X: 10,
    PADDING_Y: 6,
    FONT_SIZE: '14px',
    TEXT_COLOR: '#80ffdb',
    BG_COLOR: '#0d0d16cc',
    BTN_Y: 292,
    BTN_WIDTH: 118,
    BTN_HEIGHT: 36,
    BTN_GAP_X: 8,
    BTN_GAP_Y: 6,
    BTN_RADIUS: 8,
    BTN_COLOR: 0x3a405a,
    BTN_PRESSED_COLOR: 0x4cc9f0,
    BTN_BORDER_COLOR: 0x80ffdb,
    BTN_FONT_SIZE: '13px',
    BTN_WEAPON_LABEL: '+WPN (G)',
    BTN_CHEST_LABEL: '+CHEST (C)',
    BTN_GOLD_LABEL: '+100G (V)',
    BTN_NEXT_LABEL: 'CLEAR (N)',
    BTN_LOS_LABEL: 'LOS (L)'
  }
};
