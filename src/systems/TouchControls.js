import { BALANCE } from '../config/balance.js';

export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.left = false;
    this.right = false;
    this.jumpDown = false;
    this.jumpJustPressed = false;

    this._vibrated = {
      left: false,
      right: false,
      jump: false
    };

    // Enable simultaneous multi-touch pointers per GDD section 2 (without duplicating on restart)
    const targetPointers = 2 + BALANCE.GAME.EXTRA_TOUCH_POINTERS;
    const missingPointers = targetPointers - this.scene.input.manager.pointersTotal;
    if (missingPointers > 0) {
      this.scene.input.addPointer(missingPointers);
    }

    this.buttons = this.createButtons();
    this.bindEvents();
  }

  createButtons() {
    const c = BALANCE.CONTROLS;
    const gameW = BALANCE.GAME.WIDTH;
    const gameH = BALANCE.GAME.HEIGHT;

    const dirHalf = c.DIR_BUTTON_SIZE / 2;
    const dirY = gameH - c.EDGE_MARGIN - dirHalf;
    const leftX = c.EDGE_MARGIN + dirHalf;
    const rightX = leftX + c.DIR_BUTTON_SIZE + c.DIR_BUTTON_GAP;

    const jumpHalf = c.JUMP_BUTTON_SIZE / 2;
    const jumpX = gameW - c.EDGE_MARGIN - jumpHalf;
    const jumpY = gameH - c.EDGE_MARGIN - jumpHalf;

    return {
      left: this.createButton(leftX, dirY, c.DIR_BUTTON_SIZE, 'left'),
      right: this.createButton(rightX, dirY, c.DIR_BUTTON_SIZE, 'right'),
      jump: this.createButton(jumpX, jumpY, c.JUMP_BUTTON_SIZE, 'up')
    };
  }

  createButton(x, y, size, direction) {
    const c = BALANCE.CONTROLS;
    const half = size / 2;
    const iconSize = size * c.ICON_SIZE_RATIO;

    const container = this.scene.add.container(x, y);
    container.setScrollFactor(0);
    container.setDepth(c.DEPTH);
    container.setAlpha(c.ALPHA_IDLE);

    const gfx = this.scene.add.graphics();

    // Button background and outline
    gfx.fillStyle(c.FILL_COLOR, c.FILL_ALPHA);
    gfx.fillRoundedRect(-half, -half, size, size, c.BUTTON_RADIUS);

    gfx.lineStyle(c.STROKE_WIDTH, c.STROKE_COLOR, 1);
    gfx.strokeRoundedRect(-half, -half, size, size, c.BUTTON_RADIUS);

    // Directional triangle icon
    gfx.fillStyle(c.ICON_COLOR, 1);
    if (direction === 'left') {
      gfx.fillTriangle(
        -iconSize * 0.85, 0,
        iconSize * 0.65, -iconSize,
        iconSize * 0.65, iconSize
      );
    } else if (direction === 'right') {
      gfx.fillTriangle(
        iconSize * 0.85, 0,
        -iconSize * 0.65, -iconSize,
        -iconSize * 0.65, iconSize
      );
    } else {
      gfx.fillTriangle(
        0, -iconSize * 0.9,
        -iconSize, iconSize * 0.7,
        iconSize, iconSize * 0.7
      );
    }

    container.add(gfx);

    const pad = c.HIT_PADDING;
    return {
      container,
      isPressed: false,
      bounds: {
        left: x - half - pad,
        right: x + half + pad,
        top: y - half - pad,
        bottom: y + half + pad
      }
    };
  }

  bindEvents() {
    // Trigger haptic feedback directly inside pointerdown user gesture
    this._onPointerDown = (pointer) => {
      for (const [key, btn] of Object.entries(this.buttons)) {
        if (this.hitTest(btn, pointer.x, pointer.y) && !this._vibrated[key]) {
          this._vibrated[key] = true;
          this.vibrate();
        }
      }
    };
    this.scene.input.on('pointerdown', this._onPointerDown);

    this._onWindowBlur = () => {
      this.resetPointers();
    };
    this._onVisibilityChange = () => {
      if (document.hidden) {
        this.resetPointers();
      }
    };

    window.addEventListener('blur', this._onWindowBlur);
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    this.scene.events.once('shutdown', () => {
      this.scene.input.off('pointerdown', this._onPointerDown);
      window.removeEventListener('blur', this._onWindowBlur);
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
    });
  }

  resetPointers() {
    const pointers = this.scene.input.manager.pointers;
    for (let i = 0; i < pointers.length; i++) {
      if (pointers[i]) {
        pointers[i].isDown = false;
      }
    }
    this.left = false;
    this.right = false;
    this.jumpDown = false;
    this.jumpJustPressed = false;

    for (const [key, btn] of Object.entries(this.buttons)) {
      this._vibrated[key] = false;
      this.applyVisualState(btn, false);
    }
  }

  hitTest(btn, x, y) {
    const b = btn.bounds;
    return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
  }

  vibrate() {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(BALANCE.CONTROLS.VIBRATE_MS);
      } catch (_) {
        // Ignore unsupported or blocked vibration calls
      }
    }
  }

  applyVisualState(btn, pressed) {
    if (btn.isPressed === pressed) {
      return;
    }
    btn.isPressed = pressed;

    const c = BALANCE.CONTROLS;
    btn.container.setAlpha(pressed ? c.ALPHA_PRESSED : c.ALPHA_IDLE);
    btn.container.setScale(pressed ? c.PRESSED_SCALE : 1);
  }

  update() {
    let leftDown = false;
    let rightDown = false;
    let jumpDown = false;

    const pointers = this.scene.input.manager.pointers;
    for (let i = 0; i < pointers.length; i++) {
      const p = pointers[i];
      if (!p || !p.isDown) {
        continue;
      }

      if (this.hitTest(this.buttons.left, p.x, p.y)) {
        leftDown = true;
      }
      if (this.hitTest(this.buttons.right, p.x, p.y)) {
        rightDown = true;
      }
      if (this.hitTest(this.buttons.jump, p.x, p.y)) {
        jumpDown = true;
      }
    }

    const nextStates = { left: leftDown, right: rightDown, jump: jumpDown };
    for (const [key, isDown] of Object.entries(nextStates)) {
      const btn = this.buttons[key];
      if (isDown && !btn.isPressed && !this._vibrated[key]) {
        this._vibrated[key] = true;
        this.vibrate();
      } else if (!isDown) {
        this._vibrated[key] = false;
      }
      this.applyVisualState(btn, isDown);
    }

    this.jumpJustPressed = jumpDown && !this.jumpDown;
    this.left = leftDown;
    this.right = rightDown;
    this.jumpDown = jumpDown;
  }
}
