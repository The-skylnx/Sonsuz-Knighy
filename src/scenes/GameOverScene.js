import { BALANCE } from '../config/balance.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const g = BALANCE.GAME_OVER;
    const cx = BALANCE.GAME.WIDTH / 2;
    const cy = BALANCE.GAME.HEIGHT / 2;
    this.restarting = false;
    this.elapsedMs = 0;
    this.validPointerDown = false;

    this.add.rectangle(
      cx,
      cy,
      BALANCE.GAME.WIDTH,
      BALANCE.GAME.HEIGHT,
      g.OVERLAY_COLOR,
      g.OVERLAY_ALPHA
    );

    const title = this.add.text(cx, cy + g.TITLE_OFFSET_Y, g.TITLE_TEXT, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: g.TITLE_FONT_SIZE,
      fontStyle: 'bold',
      color: g.TITLE_COLOR,
      stroke: g.TITLE_STROKE,
      strokeThickness: g.TITLE_STROKE_WIDTH
    });
    title.setOrigin(0.5);

    const btnY = cy + g.BUTTON_OFFSET_Y;
    const btnContainer = this.add.container(cx, btnY);

    const btnGfx = this.add.graphics();
    const drawButton = (fillColor) => {
      btnGfx.clear();
      btnGfx.fillStyle(fillColor, 1);
      btnGfx.fillRoundedRect(
        -g.BUTTON_WIDTH / 2,
        -g.BUTTON_HEIGHT / 2,
        g.BUTTON_WIDTH,
        g.BUTTON_HEIGHT,
        g.BUTTON_RADIUS
      );
      btnGfx.lineStyle(g.BUTTON_BORDER_WIDTH, g.BUTTON_BORDER_COLOR, 1);
      btnGfx.strokeRoundedRect(
        -g.BUTTON_WIDTH / 2,
        -g.BUTTON_HEIGHT / 2,
        g.BUTTON_WIDTH,
        g.BUTTON_HEIGHT,
        g.BUTTON_RADIUS
      );
    };
    drawButton(g.BUTTON_COLOR);

    const btnLabel = this.add.text(0, 0, g.BUTTON_TEXT, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: g.BUTTON_TEXT_SIZE,
      fontStyle: 'bold',
      color: g.BUTTON_TEXT_COLOR
    });
    btnLabel.setOrigin(0.5);

    btnContainer.add([btnGfx, btnLabel]);

    const hitZone = this.add.zone(cx, btnY, g.BUTTON_WIDTH, g.BUTTON_HEIGHT);
    hitZone.setInteractive({ useHandCursor: true });

    hitZone.on('pointerdown', () => {
      if (this.elapsedMs < g.INPUT_DELAY_MS) {
        return;
      }
      this.validPointerDown = true;
      drawButton(g.BUTTON_PRESSED_COLOR);
      btnContainer.setScale(g.PRESSED_SCALE);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(BALANCE.CONTROLS.VIBRATE_MS);
        } catch (_) {
          // Ignore unsupported vibration
        }
      }
    });

    hitZone.on('pointerout', () => {
      this.validPointerDown = false;
      drawButton(g.BUTTON_COLOR);
      btnContainer.setScale(1);
    });

    hitZone.on('pointerup', () => {
      if (this.elapsedMs < g.INPUT_DELAY_MS || !this.validPointerDown) {
        return;
      }
      this.restartRun();
    });

    if (this.input.keyboard) {
      this._onKeySpace = () => {
        if (this.elapsedMs >= g.INPUT_DELAY_MS) {
          this.restartRun();
        }
      };
      this._onKeyEnter = () => {
        if (this.elapsedMs >= g.INPUT_DELAY_MS) {
          this.restartRun();
        }
      };
      this.input.keyboard.on('keydown-SPACE', this._onKeySpace);
      this.input.keyboard.on('keydown-ENTER', this._onKeyEnter);

      this.events.once('shutdown', () => {
        this.input.keyboard.off('keydown-SPACE', this._onKeySpace);
        this.input.keyboard.off('keydown-ENTER', this._onKeyEnter);
      });
    }
  }

  update(_time, delta) {
    this.elapsedMs += delta;
  }

  restartRun() {
    if (this.restarting) {
      return;
    }
    this.restarting = true;

    this.scene.stop('UIScene');
    this.scene.stop('GameOverScene');
    this.scene.start('GameScene');
  }
}
