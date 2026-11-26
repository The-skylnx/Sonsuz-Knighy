import { BALANCE } from '../config/balance.js';
import { WEAPONS } from '../data/weapons.js';

export class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 0, 0, 'coin');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const g = BALANCE.GOLD;
    this.body.setSize(g.COIN_SIZE, g.COIN_SIZE);
    this.value = g.COIN_VALUE;
    this.ageMs = 0;
    this.isMagnetized = false;

    this.deactivate();
  }

  spawn(x, y) {
    const g = BALANCE.GOLD;
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setAllowGravity(true);
    this.setCollideWorldBounds(true);
    this.setBounce(g.BOUNCE);
    this.setDragX(g.DRAG_X);

    const vx = Phaser.Math.Between(g.POP_VX_MIN, g.POP_VX_MAX);
    const vy = Phaser.Math.Between(g.POP_VY_MIN, g.POP_VY_MAX);
    this.setVelocity(vx, vy);

    this.ageMs = 0;
    this.isMagnetized = false;
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
    this.isMagnetized = false;
  }

  forceMagnetize() {
    if (!this.active) {
      return;
    }
    this.ageMs = Math.max(this.ageMs, BALANCE.GOLD.MAGNET_DELAY_MS);
    if (!this.isMagnetized) {
      this.isMagnetized = true;
      this.body.setAllowGravity(false);
      this.setDragX(0);
    }
  }

  updateCoin(delta, player) {
    if (!this.active) {
      return false;
    }

    this.ageMs += delta;
    const g = BALANCE.GOLD;

    if (!player || player.isDead || this.ageMs < g.MAGNET_DELAY_MS) {
      return false;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= g.PICKUP_RADIUS) {
      return true;
    }

    if (!this.isMagnetized && dist <= player.magnetRadius) {
      this.isMagnetized = true;
      this.body.setAllowGravity(false);
      this.setDragX(0);
    }

    if (this.isMagnetized && dist > 0.001) {
      this.setVelocity(
        (dx / dist) * g.MAGNET_SPEED,
        (dy / dist) * g.MAGNET_SPEED
      );
    }

    return false;
  }
}

export class WeaponPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 0, 0, 'icon_rusty_sword');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const wCfg = BALANCE.WEAPONS_DROP;
    this.setAlpha(0);
    this.body.setSize(wCfg.BODY_SIZE, wCfg.BODY_SIZE);

    this.visualContainer = scene.add.container(0, 0);
    this.visualContainer.setDepth(wCfg.DEPTH);

    this.glowImg = scene.add.image(0, 0, 'pickup_glow');
    this.frameGfx = scene.add.graphics();
    this.iconImg = scene.add.image(0, 0, 'icon_rusty_sword');

    this.visualContainer.add([this.glowImg, this.frameGfx, this.iconImg]);

    this.weaponInstance = null;
    this.cooldownMs = 0;
    this.bobTime = 0;

    this.deactivate();
  }

  spawn(
    x,
    y,
    weaponInstance,
    cooldownMs = BALANCE.WEAPONS_DROP.PICKUP_COOLDOWN_MS,
    popVx = 0,
    popVy = BALANCE.WEAPONS_DROP.POP_VY
  ) {
    const wCfg = BALANCE.WEAPONS_DROP;
    const rarityCfg = BALANCE.RARITIES[weaponInstance.rarity] || BALANCE.RARITIES.common;
    const baseWeapon = WEAPONS[weaponInstance.baseId] || WEAPONS.rusty_sword;

    this.weaponInstance = weaponInstance;
    this.cooldownMs = cooldownMs;
    this.bobTime = Math.random() * 1000;

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(0);

    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setAllowGravity(true);
    this.setCollideWorldBounds(true);
    this.setBounce(wCfg.BOUNCE);
    this.setDragX(wCfg.DRAG_X);
    this.setVelocity(popVx, popVy);

    this.glowImg.setTint(rarityCfg.color);
    this.iconImg.setTexture(baseWeapon.iconKey);

    const half = (wCfg.ICON_SIZE + 8) / 2;
    this.frameGfx.clear();
    this.frameGfx.fillStyle(0x161622, 0.85);
    this.frameGfx.fillRoundedRect(-half, -half, half * 2, half * 2, 8);
    this.frameGfx.lineStyle(2, rarityCfg.color, 1);
    this.frameGfx.strokeRoundedRect(-half, -half, half * 2, half * 2, 8);

    this.visualContainer.setPosition(x, y + wCfg.VISUAL_OFFSET_Y);
    this.visualContainer.setVisible(true);
    this.updateVisualAlpha();
  }

  resetCooldown() {
    this.cooldownMs = BALANCE.WEAPONS_DROP.PICKUP_COOLDOWN_MS;
    this.updateVisualAlpha();
  }

  updateVisualAlpha() {
    const wCfg = BALANCE.WEAPONS_DROP;
    this.visualContainer.setAlpha(
      this.cooldownMs > 0 ? wCfg.COOLDOWN_ALPHA : wCfg.READY_ALPHA
    );
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    if (this.visualContainer) {
      this.visualContainer.setVisible(false);
    }
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
    this.weaponInstance = null;
  }

  updatePickup(delta, player) {
    if (!this.active) {
      return false;
    }

    const wCfg = BALANCE.WEAPONS_DROP;
    this.bobTime += delta;

    if (this.cooldownMs > 0) {
      this.cooldownMs = Math.max(0, this.cooldownMs - delta);
      if (this.cooldownMs <= 0) {
        this.updateVisualAlpha();
      }
    }

    const bobOffset = Math.sin(this.bobTime * wCfg.BOB_SPEED) * wCfg.BOB_AMPLITUDE;
    const pulse = (Math.sin(this.bobTime * wCfg.BOB_SPEED * 1.6) + 1) * 0.5;
    this.glowImg.setAlpha(wCfg.GLOW_IDLE_ALPHA + pulse * wCfg.GLOW_PULSE_ALPHA);
    this.glowImg.setScale(0.92 + pulse * 0.16);

    this.visualContainer.setPosition(
      this.x,
      this.y + wCfg.VISUAL_OFFSET_Y + bobOffset
    );

    if (this.cooldownMs > 0 || !player || player.isDead) {
      return false;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return dx * dx + dy * dy <= wCfg.TRIGGER_RADIUS * wCfg.TRIGGER_RADIUS;
  }
}

/**
 * Pooled pickup for passives and consumables popping out of chests.
 */
export class ItemPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 0, 0, 'coin');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const iCfg = BALANCE.ITEM_PICKUPS;
    this.setAlpha(0);
    this.body.setSize(iCfg.BODY_SIZE, iCfg.BODY_SIZE);

    this.visualContainer = scene.add.container(0, 0);
    this.visualContainer.setDepth(iCfg.DEPTH);

    this.glowImg = scene.add.image(0, 0, 'pickup_glow');
    this.circleGfx = scene.add.graphics();
    this.letterText = scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: iCfg.LETTER_FONT_SIZE,
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#0d0d16',
      strokeThickness: 3
    });
    this.letterText.setOrigin(0.5);

    this.visualContainer.add([this.glowImg, this.circleGfx, this.letterText]);

    this.payload = null; // { category: 'passive' | 'consumable', passive?, consumable? }
    this.ageMs = 0;
    this.bobTime = 0;

    this.deactivate();
  }

  spawn(x, y, payload) {
    const iCfg = BALANCE.ITEM_PICKUPS;
    this.payload = payload;
    this.ageMs = 0;
    this.bobTime = Math.random() * 1000;

    let color = 0xffffff;
    let letter = '?';
    if (payload.category === 'passive') {
      const rCfg = BALANCE.RARITIES[payload.passive.rarity] || BALANCE.RARITIES.common;
      color = rCfg.color;
      letter = payload.passive.letter;
    } else if (payload.category === 'consumable') {
      color = payload.consumable.color;
      letter = payload.consumable.letter;
    }

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(0);

    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setAllowGravity(true);
    this.setCollideWorldBounds(true);
    this.setBounce(iCfg.BOUNCE);
    this.setDragX(iCfg.DRAG_X);

    const vx = Phaser.Math.Between(iCfg.POP_VX_MIN, iCfg.POP_VX_MAX);
    this.setVelocity(vx, iCfg.POP_VY);

    this.glowImg.setTint(color);
    this.glowImg.setScale(0.78);

    this.circleGfx.clear();
    this.circleGfx.fillStyle(0x161622, 0.92);
    this.circleGfx.fillCircle(0, 0, iCfg.CIRCLE_RADIUS);
    this.circleGfx.lineStyle(iCfg.BORDER_WIDTH, color, 1);
    this.circleGfx.strokeCircle(0, 0, iCfg.CIRCLE_RADIUS);

    this.letterText.setText(letter);

    this.visualContainer.setPosition(x, y + iCfg.VISUAL_OFFSET_Y);
    this.visualContainer.setVisible(true);
    this.visualContainer.setAlpha(1);
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    if (this.visualContainer) {
      this.visualContainer.setVisible(false);
    }
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
    this.payload = null;
  }

  updateItem(delta, player) {
    if (!this.active) {
      return false;
    }

    const iCfg = BALANCE.ITEM_PICKUPS;
    this.ageMs += delta;
    this.bobTime += delta;

    const bobOffset = Math.sin(this.bobTime * iCfg.BOB_SPEED) * iCfg.BOB_AMPLITUDE;
    const pulse = (Math.sin(this.bobTime * iCfg.BOB_SPEED * 1.8) + 1) * 0.5;
    this.glowImg.setAlpha(0.45 + pulse * 0.3);

    this.visualContainer.setPosition(
      this.x,
      this.y + iCfg.VISUAL_OFFSET_Y + bobOffset
    );

    if (this.ageMs < iCfg.COLLECT_DELAY_MS || !player || player.isDead) {
      return false;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return dx * dx + dy * dy <= iCfg.PICKUP_RADIUS * iCfg.PICKUP_RADIUS;
  }
}
