import { BALANCE } from '../config/balance.js';

export class Chest {
  constructor(scene, x, y, tierId, depth = 0) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.tierId = tierId;

    const cCfg = BALANCE.CHESTS;
    this.tierCfg = cCfg.TIERS[tierId] || cCfg.TIERS.wooden;
    this.price = Math.round(
      this.tierCfg.basePrice * (1 + cCfg.DEPTH_PRICE_FACTOR * depth)
    );

    this.state = 'closed'; // 'closed' | 'shaking' | 'opened' | 'done'
    this.stateTimer = 0;
    this.bobTime = Math.random() * 1000;
    this.redFlashCooldownMs = 0;
    this.redFlashTimerMs = 0;

    this.sprite = scene.add.image(x, y, `chest_${this.tierCfg.id}_closed`);
    this.sprite.setDepth(cCfg.DEPTH);

    this.createPriceBubble();
  }

  createPriceBubble() {
    const cCfg = BALANCE.CHESTS;
    this.bubbleContainer = this.scene.add.container(
      this.x,
      this.y + cCfg.BUBBLE_OFFSET_Y
    );
    this.bubbleContainer.setDepth(cCfg.DEPTH + 1);

    const coinIcon = this.scene.add.image(0, 0, 'coin');
    coinIcon.setDisplaySize(cCfg.BUBBLE_COIN_SIZE, cCfg.BUBBLE_COIN_SIZE);

    this.priceText = this.scene.add.text(0, 0, String(this.price), {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: cCfg.BUBBLE_FONT_SIZE,
      fontStyle: 'bold',
      color: cCfg.BUBBLE_TEXT_COLOR,
      stroke: cCfg.BUBBLE_STROKE,
      strokeThickness: cCfg.BUBBLE_STROKE_WIDTH
    });
    this.priceText.setOrigin(0, 0.5);

    const totalW =
      cCfg.BUBBLE_COIN_SIZE + cCfg.BUBBLE_GAP + this.priceText.width;
    coinIcon.x = -totalW / 2 + cCfg.BUBBLE_COIN_SIZE / 2;
    this.priceText.x = coinIcon.x + cCfg.BUBBLE_COIN_SIZE / 2 + cCfg.BUBBLE_GAP;

    this.bubbleContainer.add([coinIcon, this.priceText]);
  }

  triggerCantAffordFlash() {
    const cCfg = BALANCE.CHESTS;
    if (this.redFlashCooldownMs > 0) {
      return;
    }

    this.redFlashCooldownMs = cCfg.RED_FLASH_COOLDOWN_MS;
    this.redFlashTimerMs = cCfg.RED_FLASH_DURATION_MS;
    this.priceText.setColor(cCfg.BUBBLE_RED_COLOR);
    this.bubbleContainer.setScale(1.18);
    this.scene.audioManager.playCantAfford();
  }

  beginOpening() {
    this.state = 'shaking';
    this.stateTimer = 0;
    this.bubbleContainer.setVisible(false);
    this.scene.audioManager.playChestShake();
  }

  completeOpening() {
    this.state = 'opened';
    this.stateTimer = 0;
    this.sprite.setPosition(this.x, this.y);
    this.sprite.setScale(1);
    this.sprite.setTexture(`chest_${this.tierCfg.id}_open`);

    this.scene.audioManager.playChestOpen();
    this.scene.onChestBurstOpen(this);
  }

  update(delta, player) {
    if (this.state === 'done') {
      return true;
    }

    const cCfg = BALANCE.CHESTS;

    if (this.state === 'closed') {
      this.bobTime += delta;
      const bob =
        Math.sin(this.bobTime * cCfg.BUBBLE_BOB_SPEED) *
        cCfg.BUBBLE_BOB_AMPLITUDE;
      this.bubbleContainer.y = this.y + cCfg.BUBBLE_OFFSET_Y + bob;

      if (this.redFlashCooldownMs > 0) {
        this.redFlashCooldownMs = Math.max(0, this.redFlashCooldownMs - delta);
      }
      if (this.redFlashTimerMs > 0) {
        this.redFlashTimerMs = Math.max(0, this.redFlashTimerMs - delta);
        if (this.redFlashTimerMs <= 0) {
          this.priceText.setColor(cCfg.BUBBLE_TEXT_COLOR);
          this.bubbleContainer.setScale(1);
        }
      }

      if (player && !player.isDead) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx * dx + dy * dy <= cCfg.OPEN_RADIUS * cCfg.OPEN_RADIUS) {
          if (this.scene.gold >= this.price) {
            this.scene.gold -= this.price;
            this.beginOpening();
          } else {
            this.triggerCantAffordFlash();
          }
        }
      }
      return false;
    }

    if (this.state === 'shaking') {
      this.stateTimer += delta;
      const offsetX =
        Math.sin(this.stateTimer * cCfg.SHAKE_SPEED) * cCfg.SHAKE_AMPLITUDE_X;
      this.sprite.x = this.x + offsetX;
      const t = Math.min(1, this.stateTimer / cCfg.SHAKE_DURATION_MS);
      this.sprite.setScale(1 + 0.08 * t, 1 - 0.06 * t);

      if (this.stateTimer >= cCfg.SHAKE_DURATION_MS) {
        this.completeOpening();
      }
      return false;
    }

    if (this.state === 'opened') {
      this.stateTimer += delta;
      const t = Math.min(1, this.stateTimer / cCfg.OPEN_LINGER_MS);
      this.sprite.setAlpha(1 - t);
      if (this.stateTimer >= cCfg.OPEN_LINGER_MS) {
        this.state = 'done';
        return true;
      }
    }

    return false;
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    if (this.bubbleContainer) {
      this.bubbleContainer.destroy();
      this.bubbleContainer = null;
    }
    this.state = 'done';
  }
}
