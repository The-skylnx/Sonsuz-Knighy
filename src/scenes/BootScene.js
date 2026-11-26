import { BALANCE } from '../config/balance.js';
import { ENEMIES } from '../data/enemies.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.createPlayerTexture();
    this.createSlimeTexture();
    this.createBatTexture();
    this.createArcherTexture();
    this.createChargerTexture();
    this.createCoinTexture();
    this.createSwordArcTexture();
    this.createHitEffectTexture();
    this.createSpawnWarningTexture();
    this.createProjectileTextures();
    this.createBurnFlameTexture();
    this.createPickupGlowTexture();
    this.createWeaponIcons();
    this.createChestTextures();
    this.createPuffAndFlashTextures();

    this.scene.start('GameScene');
  }

  createPlayerTexture() {
    const p = BALANCE.PLAYER;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    gfx.fillStyle(p.COLOR, 1);
    gfx.fillRect(0, 0, p.WIDTH, p.HEIGHT);

    gfx.lineStyle(p.BORDER_WIDTH, p.BORDER_COLOR, 1);
    gfx.strokeRect(
      p.BORDER_WIDTH / 2,
      p.BORDER_WIDTH / 2,
      p.WIDTH - p.BORDER_WIDTH,
      p.HEIGHT - p.BORDER_WIDTH
    );

    gfx.fillStyle(p.EYE_COLOR, 1);
    gfx.fillRect(p.EYE_OFFSET_X, p.EYE_OFFSET_Y, p.EYE_WIDTH, p.EYE_HEIGHT);

    gfx.generateTexture('player', p.WIDTH, p.HEIGHT);
    gfx.destroy();
  }

  createSlimeTexture() {
    const s = ENEMIES.slime;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    gfx.fillStyle(s.color, 1);
    gfx.fillRoundedRect(0, 2, s.width, s.height - 2, { tl: 12, tr: 12, bl: 4, br: 4 });

    gfx.lineStyle(s.borderWidth, s.borderColor, 1);
    gfx.strokeRoundedRect(
      s.borderWidth / 2,
      2 + s.borderWidth / 2,
      s.width - s.borderWidth,
      s.height - 2 - s.borderWidth,
      { tl: 12, tr: 12, bl: 4, br: 4 }
    );

    gfx.fillStyle(s.eyeColor, 1);
    gfx.fillRect(s.width * 0.56, s.height * 0.42, 4, 5);
    gfx.fillRect(s.width * 0.76, s.height * 0.42, 4, 5);

    gfx.generateTexture(s.id, s.width, s.height);
    gfx.destroy();
  }

  createBatTexture() {
    const b = ENEMIES.bat;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    const cx = b.width / 2;
    const cy = b.height / 2;

    gfx.fillStyle(b.color, 1);
    gfx.fillTriangle(0, 2, cx, cy - 2, 6, b.height - 2);
    gfx.fillTriangle(b.width, 2, cx, cy - 2, b.width - 6, b.height - 2);

    gfx.fillCircle(cx, cy + 1, b.height * 0.36);
    gfx.lineStyle(b.borderWidth, b.borderColor, 1);
    gfx.strokeCircle(cx, cy + 1, b.height * 0.36);

    gfx.fillStyle(b.eyeColor, 1);
    gfx.fillRect(cx - 2, cy - 2, 3, 3);
    gfx.fillRect(cx + 3, cy - 2, 3, 3);

    gfx.generateTexture(b.id, b.width, b.height);
    gfx.destroy();
  }

  createArcherTexture() {
    const a = ENEMIES.archer;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // Hooded cloak body (facing right)
    gfx.fillStyle(a.color, 1);
    gfx.fillRoundedRect(2, 6, a.width - 8, a.height - 6, { tl: 10, tr: 8, bl: 2, br: 2 });
    gfx.fillTriangle(6, 8, 16, 0, 24, 8);

    gfx.lineStyle(a.borderWidth, a.borderColor, 1);
    gfx.strokeRoundedRect(2, 6, a.width - 8, a.height - 6, { tl: 10, tr: 8, bl: 2, br: 2 });

    // Eye
    gfx.fillStyle(a.eyeColor, 1);
    gfx.fillRect(18, 13, 5, 5);

    // Front bow arc (right side)
    gfx.lineStyle(2.5, a.bowColor, 1);
    gfx.beginPath();
    gfx.arc(a.width - 10, a.height * 0.54, 10, -1.1, 1.1, false);
    gfx.strokePath();

    gfx.generateTexture(a.id, a.width, a.height);
    gfx.destroy();
  }

  createChargerTexture() {
    const c = ENEMIES.charger;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // Heavy armored torso
    gfx.fillStyle(c.color, 1);
    gfx.fillRoundedRect(1, 5, c.width - 6, c.height - 5, 6);

    gfx.lineStyle(c.borderWidth, c.borderColor, 1);
    gfx.strokeRoundedRect(1, 5, c.width - 6, c.height - 5, 6);

    // Forward charging horn (facing right)
    gfx.fillStyle(c.hornColor, 1);
    gfx.fillTriangle(c.width - 8, 9, c.width, 4, c.width - 4, 16);

    // Angry eye
    gfx.fillStyle(c.eyeColor, 1);
    gfx.fillRect(c.width - 15, 13, 6, 5);

    gfx.generateTexture(c.id, c.width, c.height);
    gfx.destroy();
  }

  createCoinTexture() {
    const g = BALANCE.GOLD;
    const size = g.COIN_SIZE;
    const half = size / 2;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    gfx.fillStyle(g.COIN_COLOR, 1);
    gfx.fillCircle(half, half, half - 1);

    gfx.lineStyle(g.COIN_BORDER_WIDTH, g.COIN_BORDER_COLOR, 1);
    gfx.strokeCircle(half, half, half - 1);

    gfx.fillStyle(g.COIN_SHINE_COLOR, 1);
    gfx.fillCircle(half - 2, half - 2, 2.5);

    gfx.generateTexture('coin', size, size);
    gfx.destroy();
  }

  createSwordArcTexture() {
    const c = BALANCE.COMBAT;
    const size = c.SWING_TEXTURE_SIZE;
    const center = size / 2;
    const outerR = c.SWING_BASE_RADIUS;
    const maxThickness = c.SWING_MAX_THICKNESS;
    const halfArc = c.SWING_HALF_ARC_RAD;
    const steps = c.SWING_ARC_STEPS;

    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(c.SWING_COLOR, 1);

    for (let i = 0; i < steps; i++) {
      const u0 = i / steps;
      const u1 = (i + 1) / steps;
      const a0 = -halfArc + 2 * halfArc * u0;
      const a1 = -halfArc + 2 * halfArc * u1;

      const rIn0 = outerR - maxThickness * Math.sin(Math.PI * u0);
      const rIn1 = outerR - maxThickness * Math.sin(Math.PI * u1);

      const ox0 = center + Math.cos(a0) * outerR;
      const oy0 = center + Math.sin(a0) * outerR;
      const ox1 = center + Math.cos(a1) * outerR;
      const oy1 = center + Math.sin(a1) * outerR;

      const ix0 = center + Math.cos(a0) * rIn0;
      const iy0 = center + Math.sin(a0) * rIn0;
      const ix1 = center + Math.cos(a1) * rIn1;
      const iy1 = center + Math.sin(a1) * rIn1;

      gfx.fillTriangle(ox0, oy0, ox1, oy1, ix1, iy1);
      gfx.fillTriangle(ox0, oy0, ix1, iy1, ix0, iy0);
    }

    gfx.generateTexture('sword_arc', size, size);
    gfx.destroy();
  }

  createHitEffectTexture() {
    const c = BALANCE.COMBAT;
    const size = c.HIT_EFFECT_SIZE;
    const half = size / 2;
    const inner = size * 0.16;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    gfx.fillStyle(c.HIT_EFFECT_COLOR, 1);
    gfx.fillTriangle(0, half, half, half - inner, half, half + inner);
    gfx.fillTriangle(size, half, half, half - inner, half, half + inner);
    gfx.fillTriangle(half, 0, half - inner, half, half + inner, half);
    gfx.fillTriangle(half, size, half - inner, half, half + inner, half);
    gfx.fillCircle(half, half, inner * 1.2);

    gfx.generateTexture('hit_effect', size, size);
    gfx.destroy();
  }

  createSpawnWarningTexture() {
    const s = BALANCE.SPAWNER;
    const size = s.WARNING_SIZE;
    const half = size / 2;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    gfx.lineStyle(s.WARNING_STROKE_WIDTH, s.WARNING_COLOR, 1);
    gfx.strokeCircle(half, half, half - 2);

    gfx.fillStyle(s.WARNING_INNER_COLOR, 1);
    gfx.fillRect(half - 2, 7, 4, size - 18);
    gfx.fillRect(half - 2, size - 9, 4, 4);

    gfx.generateTexture('spawn_warning', size, size);
    gfx.destroy();
  }

  createProjectileTextures() {
    const p = BALANCE.PROJECTILES;
    const ep = BALANCE.ENEMY_PROJECTILES;

    // Player Arrow
    const arrowGfx = this.make.graphics({ x: 0, y: 0, add: false });
    const aw = p.ARROW_WIDTH;
    const ah = p.ARROW_HEIGHT;
    arrowGfx.fillStyle(p.ARROW_COLOR, 1);
    arrowGfx.fillRect(2, ah / 2 - 1, aw - 9, 2);
    arrowGfx.fillStyle(p.ARROW_HEAD_COLOR, 1);
    arrowGfx.fillTriangle(aw, ah / 2, aw - 8, 0, aw - 8, ah);
    arrowGfx.generateTexture('proj_arrow', aw, ah);
    arrowGfx.destroy();

    // Enemy Arrow (distinct crimson tip)
    const eArrowGfx = this.make.graphics({ x: 0, y: 0, add: false });
    const eaw = ep.WIDTH;
    const eah = ep.HEIGHT;
    eArrowGfx.fillStyle(ep.SHAFT_COLOR, 1);
    eArrowGfx.fillRect(2, eah / 2 - 1, eaw - 9, 2);
    eArrowGfx.fillStyle(ep.HEAD_COLOR, 1);
    eArrowGfx.fillTriangle(eaw, eah / 2, eaw - 8, 0, eaw - 8, eah);
    eArrowGfx.generateTexture('enemy_arrow', eaw, eah);
    eArrowGfx.destroy();

    // Homing Orb
    const orbSize = p.ORB_SIZE;
    const orbHalf = orbSize / 2;
    const orbGfx = this.make.graphics({ x: 0, y: 0, add: false });
    orbGfx.fillStyle(p.ORB_OUTER_COLOR, 0.9);
    orbGfx.fillCircle(orbHalf, orbHalf, orbHalf - 1);
    orbGfx.fillStyle(p.ORB_INNER_COLOR, 1);
    orbGfx.fillCircle(orbHalf, orbHalf, orbHalf * 0.45);
    orbGfx.generateTexture('proj_orb', orbSize, orbSize);
    orbGfx.destroy();

    // Boomerang
    const bSize = p.BOOMERANG_SIZE;
    const bHalf = bSize / 2;
    const bGfx = this.make.graphics({ x: 0, y: 0, add: false });
    bGfx.fillStyle(p.BOOMERANG_COLOR, 1);
    bGfx.fillTriangle(2, 2, bSize - 2, bHalf, bHalf, bHalf);
    bGfx.fillTriangle(2, bSize - 2, bSize - 2, bHalf, bHalf, bHalf);
    bGfx.lineStyle(2, p.BOOMERANG_BORDER_COLOR, 1);
    bGfx.lineBetween(3, 3, bSize - 3, bHalf);
    bGfx.lineBetween(3, bSize - 3, bSize - 3, bHalf);
    bGfx.generateTexture('proj_boomerang', bSize, bSize);
    bGfx.destroy();
  }

  createBurnFlameTexture() {
    const b = BALANCE.AFFIXES.BURN;
    const size = b.FX_SIZE;
    const half = size / 2;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    gfx.fillStyle(b.FX_OUTER_COLOR, 1);
    gfx.fillTriangle(half, 0, 1, size - 2, size - 1, size - 2);
    gfx.fillCircle(half, size - 4, half - 2);

    gfx.fillStyle(b.FX_INNER_COLOR, 1);
    gfx.fillCircle(half, size - 4, (half - 2) * 0.5);

    gfx.generateTexture('burn_flame', size, size);
    gfx.destroy();
  }

  createPickupGlowTexture() {
    const size = BALANCE.WEAPONS_DROP.GLOW_SIZE;
    const half = size / 2;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    gfx.fillStyle(0xffffff, 0.16);
    gfx.fillCircle(half, half, half);
    gfx.fillStyle(0xffffff, 0.28);
    gfx.fillCircle(half, half, half * 0.72);
    gfx.fillStyle(0xffffff, 0.42);
    gfx.fillCircle(half, half, half * 0.46);

    gfx.generateTexture('pickup_glow', size, size);
    gfx.destroy();
  }

  createWeaponIcons() {
    const size = BALANCE.WEAPONS_DROP.ICON_SIZE;

    let gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.lineStyle(4, 0xd8e2dc, 1);
    gfx.lineBetween(8, size - 8, size - 6, 6);
    gfx.lineStyle(3, 0xf4a261, 1);
    gfx.lineBetween(7, size - 13, 15, size - 5);
    gfx.lineStyle(3, 0x9c6644, 1);
    gfx.lineBetween(5, size - 5, 10, size - 10);
    gfx.generateTexture('icon_rusty_sword', size, size);
    gfx.destroy();

    gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.lineStyle(3, 0xe0fbfc, 1);
    gfx.lineBetween(11, size - 11, size - 8, 8);
    gfx.lineStyle(3, 0xadb5bd, 1);
    gfx.lineBetween(9, size - 14, 16, size - 7);
    gfx.lineStyle(3, 0x6c757d, 1);
    gfx.lineBetween(7, size - 7, 12, size - 12);
    gfx.generateTexture('icon_dagger', size, size);
    gfx.destroy();

    gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.lineStyle(3, 0x9c6644, 1);
    gfx.lineBetween(6, size - 6, size - 7, 7);
    gfx.fillStyle(0xced4da, 1);
    gfx.fillTriangle(size - 9, 9, size - 2, 4, size - 4, 17);
    gfx.fillTriangle(size - 11, 11, size - 18, 4, size - 16, 16);
    gfx.generateTexture('icon_battle_axe', size, size);
    gfx.destroy();

    gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.lineStyle(3, 0xd4a373, 1);
    gfx.beginPath();
    gfx.arc(10, size / 2, 12, -1.1, 1.1, false);
    gfx.strokePath();
    gfx.lineStyle(1.5, 0xffffff, 0.9);
    gfx.lineBetween(15, 5, 15, size - 5);
    gfx.lineStyle(2, 0xe0fbfc, 1);
    gfx.lineBetween(9, size / 2, size - 4, size / 2);
    gfx.generateTexture('icon_short_bow', size, size);
    gfx.destroy();

    gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.lineStyle(3, 0x9d4edd, 1);
    gfx.lineBetween(6, size - 6, size - 10, 10);
    gfx.fillStyle(0xc77dff, 1);
    gfx.fillCircle(size - 8, 8, 6);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(size - 8, 8, 2.5);
    gfx.generateTexture('icon_magic_staff', size, size);
    gfx.destroy();

    gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.lineStyle(5, 0xf4a261, 1);
    gfx.lineBetween(7, 7, size - 7, size / 2);
    gfx.lineBetween(7, size - 7, size - 7, size / 2);
    gfx.lineStyle(2, 0xfff3b0, 1);
    gfx.lineBetween(8, 7, size - 8, size / 2);
    gfx.lineBetween(8, size - 7, size - 8, size / 2);
    gfx.generateTexture('icon_boomerang', size, size);
    gfx.destroy();
  }

  createChestTextures() {
    const cCfg = BALANCE.CHESTS;
    const w = cCfg.WIDTH;
    const h = cCfg.HEIGHT;

    for (const tierKey of cCfg.TIER_ORDER) {
      const t = cCfg.TIERS[tierKey];

      let gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(t.bodyColor, 1);
      gfx.fillRoundedRect(1, 4, w - 2, h - 4, { tl: 8, tr: 8, bl: 3, br: 3 });
      gfx.lineStyle(2, t.trimColor, 1);
      gfx.strokeRoundedRect(1, 4, w - 2, h - 4, { tl: 8, tr: 8, bl: 3, br: 3 });
      gfx.lineBetween(2, 16, w - 2, 16);
      gfx.lineBetween(10, 5, 10, h - 1);
      gfx.lineBetween(w - 10, 5, w - 10, h - 1);
      gfx.fillStyle(t.latchColor, 1);
      gfx.fillRoundedRect(w / 2 - 4, 12, 8, 9, 2);
      gfx.generateTexture(`chest_${tierKey}_closed`, w, h);
      gfx.destroy();

      gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0x0d0d16, 1);
      gfx.fillRect(3, 12, w - 6, 8);
      gfx.fillStyle(t.bodyColor, 1);
      gfx.fillRoundedRect(1, 16, w - 2, h - 16, 3);
      gfx.lineStyle(2, t.trimColor, 1);
      gfx.strokeRoundedRect(1, 16, w - 2, h - 16, 3);
      gfx.fillStyle(t.bodyColor, 0.9);
      gfx.fillRoundedRect(2, 1, w - 4, 10, { tl: 6, tr: 6, bl: 2, br: 2 });
      gfx.strokeRoundedRect(2, 1, w - 4, 10, { tl: 6, tr: 6, bl: 2, br: 2 });
      gfx.generateTexture(`chest_${tierKey}_open`, w, h);
      gfx.destroy();
    }
  }

  createPuffAndFlashTextures() {
    const pSize = BALANCE.PUFF_FX.PARTICLE_SIZE;
    const pHalf = pSize / 2;
    let gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff, 0.45);
    gfx.fillCircle(pHalf, pHalf, pHalf);
    gfx.fillStyle(0xffffff, 0.95);
    gfx.fillCircle(pHalf, pHalf, pHalf * 0.62);
    gfx.generateTexture('puff_particle', pSize, pSize);
    gfx.destroy();

    const fSize = BALANCE.CHESTS.FLASH_SIZE;
    const fHalf = fSize / 2;
    gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff, 0.25);
    gfx.fillCircle(fHalf, fHalf, fHalf);
    gfx.fillStyle(0xffffff, 0.55);
    gfx.fillCircle(fHalf, fHalf, fHalf * 0.65);
    gfx.fillStyle(0xffffff, 0.95);
    gfx.fillCircle(fHalf, fHalf, fHalf * 0.35);
    gfx.generateTexture('chest_flash', fSize, fSize);
    gfx.destroy();
  }
}
