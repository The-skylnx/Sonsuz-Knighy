import { BALANCE } from '../config/balance.js';
import { WEAPONS } from '../data/weapons.js';
import { PASSIVES } from '../data/passives.js';
import { formatAffixDescription } from '../systems/LootSystem.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.isDebugEnabled = new URLSearchParams(window.location.search).get('debug') === '1';
    this.lastRenderedWeaponId = null;
    this.lastPassiveRevision = -1;
    this.passiveWidgets = [];

    this.compareOpen = false;
    this.compareElapsedMs = 0;

    this.createHpHud();
    this.createWeaponHud();
    this.createRageBuffHud();
    this.createPassiveRowHud();
    this.createGoldHud();
    this.createCompareModal();

    if (this.isDebugEnabled) {
      this.createDebugOverlay();
      this.createDebugButtons();
    }

    this.bindCompareKeys();
  }

  createHpHud() {
    const h = BALANCE.HUD;
    const x = h.MARGIN_X;
    const y = h.MARGIN_Y;

    this.hpBg = this.add.rectangle(
      x + h.HP_BAR_WIDTH / 2,
      y + h.HP_BAR_HEIGHT / 2,
      h.HP_BAR_WIDTH,
      h.HP_BAR_HEIGHT,
      h.HP_BG_COLOR
    );

    this.hpFill = this.add.rectangle(
      x,
      y + h.HP_BAR_HEIGHT / 2,
      h.HP_BAR_WIDTH,
      h.HP_BAR_HEIGHT,
      h.HP_FILL_COLOR
    );
    this.hpFill.setOrigin(0, 0.5);

    const border = this.add.graphics();
    border.lineStyle(h.HP_BORDER_WIDTH, h.HP_BORDER_COLOR, 1);
    border.strokeRect(x, y, h.HP_BAR_WIDTH, h.HP_BAR_HEIGHT);

    this.hpText = this.add.text(
      x + h.HP_BAR_WIDTH / 2,
      y + h.HP_BAR_HEIGHT / 2,
      '',
      {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: h.FONT_SIZE,
        fontStyle: 'bold',
        color: h.TEXT_COLOR,
        stroke: h.TEXT_STROKE,
        strokeThickness: h.TEXT_STROKE_WIDTH
      }
    );
    this.hpText.setOrigin(0.5, 0.5);
  }

  createWeaponHud() {
    const h = BALANCE.HUD;
    const x = h.MARGIN_X;
    const y = h.MARGIN_Y + h.HP_BAR_HEIGHT + h.WEAPON_FRAME_OFFSET_Y;
    const half = h.WEAPON_FRAME_SIZE / 2;

    this.weaponFrameGfx = this.add.graphics();
    this.weaponIconImg = this.add.image(x + half, y + half, 'icon_rusty_sword');
    this.weaponIconImg.setDisplaySize(
      h.WEAPON_ICON_DISPLAY_SIZE,
      h.WEAPON_ICON_DISPLAY_SIZE
    );
  }

  refreshWeaponHud(weapon) {
    if (!weapon || weapon.id === this.lastRenderedWeaponId) {
      return;
    }
    this.lastRenderedWeaponId = weapon.id;

    const h = BALANCE.HUD;
    const rarityCfg = BALANCE.RARITIES[weapon.rarity] || BALANCE.RARITIES.common;
    const baseCfg = WEAPONS[weapon.baseId] || WEAPONS.rusty_sword;
    const x = h.MARGIN_X;
    const y = h.MARGIN_Y + h.HP_BAR_HEIGHT + h.WEAPON_FRAME_OFFSET_Y;

    this.weaponFrameGfx.clear();
    this.weaponFrameGfx.fillStyle(h.WEAPON_FRAME_BG, 0.92);
    this.weaponFrameGfx.fillRoundedRect(
      x,
      y,
      h.WEAPON_FRAME_SIZE,
      h.WEAPON_FRAME_SIZE,
      h.WEAPON_FRAME_RADIUS
    );
    this.weaponFrameGfx.lineStyle(
      h.WEAPON_FRAME_BORDER_WIDTH,
      rarityCfg.color,
      1
    );
    this.weaponFrameGfx.strokeRoundedRect(
      x,
      y,
      h.WEAPON_FRAME_SIZE,
      h.WEAPON_FRAME_SIZE,
      h.WEAPON_FRAME_RADIUS
    );

    this.weaponIconImg.setTexture(baseCfg.iconKey);
    this.weaponIconImg.setDisplaySize(
      h.WEAPON_ICON_DISPLAY_SIZE,
      h.WEAPON_ICON_DISPLAY_SIZE
    );
  }

  createRageBuffHud() {
    const h = BALANCE.HUD;
    const rageCfg = BALANCE.CONSUMABLES.RAGE_ORB;
    const x =
      h.MARGIN_X +
      h.WEAPON_FRAME_SIZE +
      h.RAGE_BADGE_OFFSET_X +
      h.RAGE_BADGE_RADIUS;
    const y =
      h.MARGIN_Y +
      h.HP_BAR_HEIGHT +
      h.WEAPON_FRAME_OFFSET_Y +
      h.WEAPON_FRAME_SIZE / 2;

    this.rageContainer = this.add.container(x, y);
    this.rageContainer.setVisible(false);

    const gfx = this.add.graphics();
    gfx.fillStyle(0x1e2030, 0.92);
    gfx.fillCircle(0, 0, h.RAGE_BADGE_RADIUS);
    gfx.lineStyle(3, rageCfg.color, 1);
    gfx.strokeCircle(0, 0, h.RAGE_BADGE_RADIUS);

    const iconLetter = this.add.text(0, 0, rageCfg.letter, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: h.PASSIVE_LETTER_SIZE,
      fontStyle: 'bold',
      color: rageCfg.hex,
      stroke: h.TEXT_STROKE,
      strokeThickness: 3
    });
    iconLetter.setOrigin(0.5);

    this.rageTimerText = this.add.text(h.RAGE_BADGE_RADIUS + 8, 0, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: h.RAGE_TIMER_FONT_SIZE,
      fontStyle: 'bold',
      color: rageCfg.hex,
      stroke: h.TEXT_STROKE,
      strokeThickness: 4
    });
    this.rageTimerText.setOrigin(0, 0.5);

    this.rageContainer.add([gfx, iconLetter, this.rageTimerText]);
  }

  createPassiveRowHud() {
    this.passiveRowContainer = this.add.container(0, 0);
  }

  refreshPassiveRowHud(player, revision) {
    if (revision === this.lastPassiveRevision) {
      return;
    }
    this.lastPassiveRevision = revision;

    const h = BALANCE.HUD;
    const radius = h.PASSIVE_ICON_RADIUS;
    const diameter = radius * 2;
    const startX = h.MARGIN_X + radius;
    const centerY =
      h.MARGIN_Y +
      h.HP_BAR_HEIGHT +
      h.WEAPON_FRAME_OFFSET_Y +
      h.WEAPON_FRAME_SIZE +
      h.PASSIVE_ROW_OFFSET_Y +
      radius;

    const order = player.passiveOrder;

    // Ensure enough widget slots exist
    while (this.passiveWidgets.length < order.length) {
      const slotContainer = this.add.container(0, 0);
      const gfx = this.add.graphics();
      const letterTxt = this.add.text(0, 0, '', {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: h.PASSIVE_LETTER_SIZE,
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: h.TEXT_STROKE,
        strokeThickness: 3
      });
      letterTxt.setOrigin(0.5);

      const stackTxt = this.add.text(radius + 2, radius - 2, '', {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: h.PASSIVE_STACK_SIZE,
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: h.TEXT_STROKE,
        strokeThickness: 3
      });
      stackTxt.setOrigin(1, 0.5);

      slotContainer.add([gfx, letterTxt, stackTxt]);
      this.passiveRowContainer.add(slotContainer);
      this.passiveWidgets.push({ slotContainer, gfx, letterTxt, stackTxt });
    }

    for (let i = 0; i < this.passiveWidgets.length; i++) {
      const widget = this.passiveWidgets[i];
      if (i >= order.length) {
        widget.slotContainer.setVisible(false);
        continue;
      }

      const passiveId = order[i];
      const pData = PASSIVES[passiveId];
      const rCfg = BALANCE.RARITIES[pData.rarity] || BALANCE.RARITIES.common;
      const count = player.getPassiveStacks(passiveId);

      const x = startX + i * (diameter + h.PASSIVE_ICON_GAP);
      widget.slotContainer.setPosition(x, centerY);
      widget.slotContainer.setVisible(true);

      widget.gfx.clear();
      widget.gfx.fillStyle(h.WEAPON_FRAME_BG, 0.92);
      widget.gfx.fillCircle(0, 0, radius);
      widget.gfx.lineStyle(2.5, rCfg.color, 1);
      widget.gfx.strokeCircle(0, 0, radius);

      widget.letterTxt.setText(pData.letter);
      widget.letterTxt.setColor(rCfg.hex);

      if (count > 1) {
        widget.stackTxt.setText(`x${count}`);
        widget.stackTxt.setVisible(true);
      } else {
        widget.stackTxt.setVisible(false);
      }
    }
  }

  createGoldHud() {
    const h = BALANCE.HUD;
    const rightX = BALANCE.GAME.WIDTH - h.MARGIN_X;
    const centerY = h.MARGIN_Y + h.HP_BAR_HEIGHT / 2;

    this.goldText = this.add.text(rightX, centerY, '0', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: h.FONT_SIZE,
      fontStyle: 'bold',
      color: h.GOLD_TEXT_COLOR,
      stroke: h.TEXT_STROKE,
      strokeThickness: h.TEXT_STROKE_WIDTH
    });
    this.goldText.setOrigin(1, 0.5);

    this.goldIcon = this.add.image(0, centerY, 'coin');
    this.goldIcon.setDisplaySize(h.GOLD_ICON_SIZE, h.GOLD_ICON_SIZE);
    this.updateGoldIconPosition();
  }

  updateGoldIconPosition() {
    const h = BALANCE.HUD;
    this.goldIcon.x =
      this.goldText.x - this.goldText.width - h.GOLD_ICON_GAP - h.GOLD_ICON_SIZE / 2;
  }

  createCompareModal() {
    const c = BALANCE.COMPARE_CARD;
    const cx = BALANCE.GAME.WIDTH / 2;
    const cy = BALANCE.GAME.HEIGHT / 2;

    this.compareContainer = this.add.container(0, 0);
    this.compareContainer.setDepth(c.DEPTH);
    this.compareContainer.setVisible(false);

    const backdrop = this.add.rectangle(
      cx,
      cy,
      BALANCE.GAME.WIDTH,
      BALANCE.GAME.HEIGHT,
      c.BACKDROP_COLOR,
      c.BACKDROP_ALPHA
    );
    backdrop.setInteractive();

    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(c.PANEL_BG, 0.98);
    panelGfx.fillRoundedRect(
      cx - c.PANEL_WIDTH / 2,
      cy - c.PANEL_HEIGHT / 2,
      c.PANEL_WIDTH,
      c.PANEL_HEIGHT,
      c.PANEL_RADIUS
    );
    panelGfx.lineStyle(c.PANEL_BORDER_WIDTH, c.PANEL_BORDER, 1);
    panelGfx.strokeRoundedRect(
      cx - c.PANEL_WIDTH / 2,
      cy - c.PANEL_HEIGHT / 2,
      c.PANEL_WIDTH,
      c.PANEL_HEIGHT,
      c.PANEL_RADIUS
    );

    this.compareContainer.add([backdrop, panelGfx]);

    this.currentCardWidgets = this.createWeaponColumn(
      cx - c.COL_OFFSET_X,
      cy + c.COL_OFFSET_Y,
      'CURRENT WEAPON'
    );
    this.newCardWidgets = this.createWeaponColumn(
      cx + c.COL_OFFSET_X,
      cy + c.COL_OFFSET_Y,
      'NEW WEAPON'
    );

    const btnY = cy + c.BUTTON_OFFSET_Y;
    this.equipBtn = this.createActionButton(
      cx - c.BUTTON_OFFSET_X,
      btnY,
      'EQUIP',
      c.EQUIP_COLOR,
      c.EQUIP_PRESSED_COLOR,
      () => this.onConfirmEquip()
    );
    this.leaveBtn = this.createActionButton(
      cx + c.BUTTON_OFFSET_X,
      btnY,
      'LEAVE',
      c.LEAVE_COLOR,
      c.LEAVE_PRESSED_COLOR,
      () => this.onCancelEquip()
    );
  }

  createWeaponColumn(centerX, centerY, headerTitle) {
    const c = BALANCE.COMPARE_CARD;
    const topY = centerY - c.COL_HEIGHT / 2;
    const leftX = centerX - c.COL_WIDTH / 2;

    const boxGfx = this.add.graphics();

    const header = this.add.text(centerX, topY + 22, headerTitle, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: c.HEADER_FONT_SIZE,
      fontStyle: 'bold',
      color: c.HEADER_COLOR
    });
    header.setOrigin(0.5);

    const icon = this.add.image(leftX + 38, topY + 72, 'icon_rusty_sword');
    icon.setDisplaySize(38, 38);

    const nameText = this.add.text(leftX + 68, topY + 56, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: c.NAME_FONT_SIZE,
      fontStyle: 'bold',
      color: '#ffffff'
    });

    const rarityText = this.add.text(leftX + 68, topY + 88, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: c.RARITY_FONT_SIZE,
      fontStyle: 'bold',
      color: '#ffffff'
    });

    const statsText = this.add.text(leftX + 24, topY + 128, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: c.STAT_FONT_SIZE,
      fontStyle: 'bold',
      color: c.STAT_COLOR,
      lineSpacing: 8
    });

    const affixText = this.add.text(leftX + 24, topY + 236, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: c.AFFIX_FONT_SIZE,
      fontStyle: 'bold',
      color: c.AFFIX_COLOR,
      lineSpacing: 6,
      wordWrap: { width: c.COL_WIDTH - 48 }
    });

    this.compareContainer.add([
      boxGfx,
      header,
      icon,
      nameText,
      rarityText,
      statsText,
      affixText
    ]);

    return {
      centerX,
      centerY,
      boxGfx,
      icon,
      nameText,
      rarityText,
      statsText,
      affixText
    };
  }

  populateWeaponColumn(widgets, weapon) {
    const c = BALANCE.COMPARE_CARD;
    const rarityCfg = BALANCE.RARITIES[weapon.rarity] || BALANCE.RARITIES.common;
    const baseCfg = WEAPONS[weapon.baseId] || WEAPONS.rusty_sword;

    widgets.boxGfx.clear();
    widgets.boxGfx.fillStyle(c.COL_BG, 1);
    widgets.boxGfx.fillRoundedRect(
      widgets.centerX - c.COL_WIDTH / 2,
      widgets.centerY - c.COL_HEIGHT / 2,
      c.COL_WIDTH,
      c.COL_HEIGHT,
      c.COL_RADIUS
    );
    widgets.boxGfx.lineStyle(c.COL_BORDER_WIDTH, rarityCfg.color, 1);
    widgets.boxGfx.strokeRoundedRect(
      widgets.centerX - c.COL_WIDTH / 2,
      widgets.centerY - c.COL_HEIGHT / 2,
      c.COL_WIDTH,
      c.COL_HEIGHT,
      c.COL_RADIUS
    );

    widgets.icon.setTexture(baseCfg.iconKey);
    widgets.icon.setDisplaySize(38, 38);

    widgets.nameText.setText(weapon.name);
    widgets.nameText.setColor(rarityCfg.hex);

    const typeLabel = weapon.type === 'ranged' ? 'Ranged' : 'Melee';
    widgets.rarityText.setText(`${rarityCfg.name} • ${typeLabel}`);
    widgets.rarityText.setColor(rarityCfg.hex);

    const attacksPerSec = (1000 / weapon.intervalMs).toFixed(2).replace(/\.?0+$/, '');
    widgets.statsText.setText(
      `Damage: ${weapon.damage}\n` +
      `Attacks/s: ${attacksPerSec}\n` +
      `Range: ${weapon.range}`
    );

    if (weapon.affixes && weapon.affixes.length > 0) {
      const lines = weapon.affixes.map((a) => `• ${formatAffixDescription(a)}`);
      widgets.affixText.setText(lines.join('\n'));
      widgets.affixText.setColor(c.AFFIX_COLOR);
    } else {
      widgets.affixText.setText('No special effects');
      widgets.affixText.setColor(c.NO_AFFIX_COLOR);
    }
  }

  createActionButton(x, y, label, baseColor, pressedColor, onTrigger) {
    const c = BALANCE.COMPARE_CARD;
    const btnContainer = this.add.container(x, y);
    const gfx = this.add.graphics();

    const draw = (fillColor) => {
      gfx.clear();
      gfx.fillStyle(fillColor, 1);
      gfx.fillRoundedRect(
        -c.BUTTON_WIDTH / 2,
        -c.BUTTON_HEIGHT / 2,
        c.BUTTON_WIDTH,
        c.BUTTON_HEIGHT,
        c.BUTTON_RADIUS
      );
      gfx.lineStyle(c.BUTTON_BORDER_WIDTH, c.BUTTON_BORDER_COLOR, 1);
      gfx.strokeRoundedRect(
        -c.BUTTON_WIDTH / 2,
        -c.BUTTON_HEIGHT / 2,
        c.BUTTON_WIDTH,
        c.BUTTON_HEIGHT,
        c.BUTTON_RADIUS
      );
    };
    draw(baseColor);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: c.BUTTON_FONT_SIZE,
      fontStyle: 'bold',
      color: c.BUTTON_TEXT_COLOR,
      stroke: '#0d0d16',
      strokeThickness: 4
    });
    text.setOrigin(0.5);

    btnContainer.add([gfx, text]);

    const zone = this.add.zone(x, y, c.BUTTON_WIDTH, c.BUTTON_HEIGHT);
    zone.setInteractive({ useHandCursor: true });

    let validDown = false;
    zone.on('pointerdown', () => {
      if (!this.compareOpen || this.compareElapsedMs < c.INPUT_DELAY_MS) {
        return;
      }
      validDown = true;
      draw(pressedColor);
      btnContainer.setScale(c.PRESSED_SCALE);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(BALANCE.CONTROLS.VIBRATE_MS);
        } catch (_) {
          // Ignore unsupported vibration
        }
      }
    });

    zone.on('pointerout', () => {
      validDown = false;
      draw(baseColor);
      btnContainer.setScale(1);
    });

    zone.on('pointerup', () => {
      if (!this.compareOpen || this.compareElapsedMs < c.INPUT_DELAY_MS || !validDown) {
        return;
      }
      validDown = false;
      draw(baseColor);
      btnContainer.setScale(1);
      onTrigger();
    });

    this.compareContainer.add([btnContainer, zone]);
    return {
      resetVisual: () => {
        validDown = false;
        draw(baseColor);
        btnContainer.setScale(1);
      }
    };
  }

  bindCompareKeys() {
    if (!this.input.keyboard) {
      return;
    }

    const c = BALANCE.COMPARE_CARD;
    this._onEnter = () => {
      if (this.compareOpen && this.compareElapsedMs >= c.INPUT_DELAY_MS) {
        this.onConfirmEquip();
      }
    };
    this._onEsc = () => {
      if (this.compareOpen && this.compareElapsedMs >= c.INPUT_DELAY_MS) {
        this.onCancelEquip();
      }
    };

    this.input.keyboard.on('keydown-ENTER', this._onEnter);
    this.input.keyboard.on('keydown-ESC', this._onEsc);

    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ENTER', this._onEnter);
      this.input.keyboard.off('keydown-ESC', this._onEsc);
    });
  }

  showCompareCard(currentWeapon, newWeapon) {
    this.populateWeaponColumn(this.currentCardWidgets, currentWeapon);
    this.populateWeaponColumn(this.newCardWidgets, newWeapon);

    this.equipBtn.resetVisual();
    this.leaveBtn.resetVisual();

    this.compareElapsedMs = 0;
    this.compareOpen = true;
    this.compareContainer.setVisible(true);
  }

  hideCompareCard() {
    this.compareOpen = false;
    this.compareContainer.setVisible(false);
  }

  onConfirmEquip() {
    if (!this.compareOpen) {
      return;
    }
    this.hideCompareCard();
    if (this.gameScene) {
      this.gameScene.confirmEquipWeapon();
    }
  }

  onCancelEquip() {
    if (!this.compareOpen) {
      return;
    }
    this.hideCompareCard();
    if (this.gameScene) {
      this.gameScene.cancelEquipWeapon();
    }
  }

  createDebugOverlay() {
    const d = BALANCE.DEBUG;
    this.debugText = this.add.text(d.X, d.Y, '', {
      fontFamily: 'Consolas, Menlo, monospace',
      fontSize: d.FONT_SIZE,
      color: d.TEXT_COLOR,
      backgroundColor: d.BG_COLOR,
      padding: { x: d.PADDING_X, y: d.PADDING_Y }
    });
  }

  createDebugButtons() {
    const d = BALANCE.DEBUG;
    const actions = [
      {
        label: d.BTN_WEAPON_LABEL,
        onTap: () => this.gameScene && this.gameScene.dropDebugWeaponNearPlayer()
      },
      {
        label: d.BTN_CHEST_LABEL,
        onTap: () => this.gameScene && this.gameScene.spawnDebugChestNearPlayer()
      },
      {
        label: d.BTN_GOLD_LABEL,
        onTap: () => this.gameScene && this.gameScene.addDebugGold()
      }
    ];

    for (let i = 0; i < actions.length; i++) {
      const cx = d.X + d.BTN_WIDTH / 2 + i * (d.BTN_WIDTH + d.BTN_GAP);
      const cy = d.BTN_Y + d.BTN_HEIGHT / 2;

      const container = this.add.container(cx, cy);
      const gfx = this.add.graphics();
      const draw = (fill) => {
        gfx.clear();
        gfx.fillStyle(fill, 0.9);
        gfx.fillRoundedRect(
          -d.BTN_WIDTH / 2,
          -d.BTN_HEIGHT / 2,
          d.BTN_WIDTH,
          d.BTN_HEIGHT,
          d.BTN_RADIUS
        );
        gfx.lineStyle(2, d.BTN_BORDER_COLOR, 1);
        gfx.strokeRoundedRect(
          -d.BTN_WIDTH / 2,
          -d.BTN_HEIGHT / 2,
          d.BTN_WIDTH,
          d.BTN_HEIGHT,
          d.BTN_RADIUS
        );
      };
      draw(d.BTN_COLOR);

      const txt = this.add.text(0, 0, actions[i].label, {
        fontFamily: 'Consolas, Menlo, monospace',
        fontSize: d.BTN_FONT_SIZE,
        fontStyle: 'bold',
        color: '#ffffff'
      });
      txt.setOrigin(0.5);
      container.add([gfx, txt]);

      const zone = this.add.zone(cx, cy, d.BTN_WIDTH, d.BTN_HEIGHT);
      zone.setInteractive({ useHandCursor: true });

      zone.on('pointerdown', () => {
        draw(d.BTN_PRESSED_COLOR);
        actions[i].onTap();
      });
      zone.on('pointerup', () => draw(d.BTN_COLOR));
      zone.on('pointerout', () => draw(d.BTN_COLOR));
    }
  }

  countActiveTouchPointers() {
    const pointers = this.input.manager.pointers;
    let count = 0;
    for (let i = 0; i < pointers.length; i++) {
      const p = pointers[i];
      if (p && p.isDown && (i >= 1 || p.wasTouch)) {
        count++;
      }
    }
    return count;
  }

  update(_time, delta) {
    if (this.compareOpen) {
      this.compareElapsedMs += delta;
    }

    if (!this.gameScene || !this.gameScene.player) {
      return;
    }

    const h = BALANCE.HUD;
    const player = this.gameScene.player;
    const hpRatio = Phaser.Math.Clamp(player.hp / player.maxHp, 0, 1);

    this.hpFill.displayWidth = h.HP_BAR_WIDTH * hpRatio;
    this.hpText.setText(`${player.hp} / ${player.maxHp}`);

    this.refreshWeaponHud(player.weapon);
    this.refreshPassiveRowHud(player, this.gameScene.passiveHudRevision);

    if (player.rageTimerMs > 0) {
      this.rageContainer.setVisible(true);
      this.rageTimerText.setText(`${(player.rageTimerMs / 1000).toFixed(1)}s`);
    } else if (this.rageContainer.visible) {
      this.rageContainer.setVisible(false);
    }

    const goldStr = String(this.gameScene.gold);
    if (this.goldText.text !== goldStr) {
      this.goldText.setText(goldStr);
      this.updateGoldIconPosition();
    }

    if (this.isDebugEnabled && this.debugText) {
      const fps = Math.round(this.game.loop.actualFps);
      const touchCount = this.countActiveTouchPointers();
      const vx = player.body ? Math.round(player.body.velocity.x) : 0;
      const vy = player.body ? Math.round(player.body.velocity.y) : 0;
      const enemies = this.gameScene.getAliveEnemyCount();
      const coins = this.gameScene.getActiveCoinCount();
      const chests = this.gameScene.activeChests.length;

      this.debugText.setText(
        `FPS: ${fps}\n` +
        `Touch Pointers: ${touchCount}\n` +
        `Player Vel: (${vx}, ${vy})\n` +
        `Enemies: ${enemies} | Coins: ${coins} | Chests: ${chests}`
      );
    }
  }
}
