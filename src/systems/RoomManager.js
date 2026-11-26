import { BALANCE } from '../config/balance.js';
import { ROOM_TEMPLATES } from '../data/roomTemplates.js';

export class RoomManager {
  constructor(scene, staticPlatformGroup) {
    this.scene = scene;
    this.platforms = staticPlatformGroup;

    this.roomNumber = 1;
    this.depth = 0;
    this.roomType = 'combat';
    this.roomWidth = BALANCE.GAME.WIDTH;
    this.roomHeight = BALANCE.GAME.HEIGHT;
    this.currentTemplate = null;
    this.lastTemplateId = null;

    this.enemiesToSpawn = 0;
    this.maxAliveEnemies = 0;
    this.isCleared = false;
    this.isExitOpen = false;
    this.clearMagnetTimerMs = 0;

    this.platformBounds = [];
    this.spawnSurfaces = [];
    this.losObstacles = [];
    this.roomVisuals = [];

    this.doorPulseTime = 0;
    this.createDoors();
  }

  createDoors() {
    const rCfg = BALANCE.ROOMS;
    const groundTop = rCfg.GROUND.y - rCfg.GROUND.height / 2;
    const doorY = groundTop - rCfg.DOOR_HEIGHT / 2;

    // Decorative entry door (left)
    this.entryDoorGfx = this.scene.add.graphics();
    this.entryDoorGfx.setDepth(rCfg.DOOR_DEPTH);
    this.drawEntryDoor(rCfg.ENTRY_DOOR_X, doorY);

    // Exit door (right)
    this.exitDoorContainer = this.scene.add.container(rCfg.EXIT_DOOR_X, doorY);
    this.exitDoorContainer.setDepth(rCfg.DOOR_DEPTH);

    this.exitGlow = this.scene.add.image(0, 0, 'pickup_glow');
    this.exitGlow.setScale(1.45);
    this.exitGlow.setVisible(false);

    this.exitDoorGfx = this.scene.add.graphics();
    this.exitArrowGfx = this.scene.add.graphics();

    this.exitDoorContainer.add([this.exitGlow, this.exitDoorGfx, this.exitArrowGfx]);
  }

  drawEntryDoor(cx, cy) {
    const rCfg = BALANCE.ROOMS;
    const hw = rCfg.DOOR_WIDTH / 2;
    const hh = rCfg.DOOR_HEIGHT / 2;

    this.entryDoorGfx.clear();
    this.entryDoorGfx.fillStyle(rCfg.ENTRY_FILL_COLOR, 1);
    this.entryDoorGfx.fillRoundedRect(
      cx - hw,
      cy - hh,
      rCfg.DOOR_WIDTH,
      rCfg.DOOR_HEIGHT,
      { tl: 18, tr: 18, bl: 0, br: 0 }
    );
    this.entryDoorGfx.lineStyle(3, rCfg.ENTRY_FRAME_COLOR, 1);
    this.entryDoorGfx.strokeRoundedRect(
      cx - hw,
      cy - hh,
      rCfg.DOOR_WIDTH,
      rCfg.DOOR_HEIGHT,
      { tl: 18, tr: 18, bl: 0, br: 0 }
    );
  }

  refreshExitDoorVisual() {
    const rCfg = BALANCE.ROOMS;
    const hw = rCfg.DOOR_WIDTH / 2;
    const hh = rCfg.DOOR_HEIGHT / 2;

    this.exitDoorGfx.clear();
    this.exitArrowGfx.clear();

    if (this.isExitOpen) {
      this.exitGlow.setTint(rCfg.OPEN_GLOW_COLOR);
      this.exitGlow.setVisible(true);

      this.exitDoorGfx.fillStyle(rCfg.OPEN_DARK_COLOR, 0.95);
      this.exitDoorGfx.fillRoundedRect(
        -hw,
        -hh,
        rCfg.DOOR_WIDTH,
        rCfg.DOOR_HEIGHT,
        { tl: 18, tr: 18, bl: 0, br: 0 }
      );
      this.exitDoorGfx.lineStyle(4, rCfg.OPEN_COLOR, 1);
      this.exitDoorGfx.strokeRoundedRect(
        -hw,
        -hh,
        rCfg.DOOR_WIDTH,
        rCfg.DOOR_HEIGHT,
        { tl: 18, tr: 18, bl: 0, br: 0 }
      );

      this.exitArrowGfx.fillStyle(rCfg.OPEN_GLOW_COLOR, 1);
      this.exitArrowGfx.fillTriangle(-7, -11, -7, 11, 10, 0);
    } else {
      this.exitGlow.setVisible(false);

      this.exitDoorGfx.fillStyle(rCfg.LOCKED_DARK_COLOR, 0.95);
      this.exitDoorGfx.fillRoundedRect(
        -hw,
        -hh,
        rCfg.DOOR_WIDTH,
        rCfg.DOOR_HEIGHT,
        { tl: 18, tr: 18, bl: 0, br: 0 }
      );
      this.exitDoorGfx.lineStyle(3, rCfg.LOCKED_COLOR, 1);
      this.exitDoorGfx.strokeRoundedRect(
        -hw,
        -hh,
        rCfg.DOOR_WIDTH,
        rCfg.DOOR_HEIGHT,
        { tl: 18, tr: 18, bl: 0, br: 0 }
      );

      this.exitDoorGfx.lineStyle(3, rCfg.LOCKED_COLOR, 0.85);
      this.exitDoorGfx.lineBetween(-10, -hh + 6, -10, hh);
      this.exitDoorGfx.lineBetween(0, -hh + 3, 0, hh);
      this.exitDoorGfx.lineBetween(10, -hh + 6, 10, hh);
      this.exitDoorGfx.lineBetween(-hw + 3, 0, hw - 3, 0);
    }
  }

  getPaletteForRoom(roomNumber) {
    const cycle = BALANCE.ROOMS.PALETTE_ROOMS_CYCLE;
    const idx = Math.floor((roomNumber - 1) / cycle) % BALANCE.THEMES.length;
    return BALANCE.THEMES[idx];
  }

  pickNextTemplate() {
    if (ROOM_TEMPLATES.length <= 1) {
      return ROOM_TEMPLATES[0];
    }

    let chosen = ROOM_TEMPLATES[0];
    for (let i = 0; i < 6; i++) {
      const candidate =
        ROOM_TEMPLATES[Math.floor(Math.random() * ROOM_TEMPLATES.length)];
      if (candidate.id !== this.lastTemplateId) {
        chosen = candidate;
        break;
      }
    }
    this.lastTemplateId = chosen.id;
    return chosen;
  }

  teardownCurrentRoom() {
    this.platforms.clear(true, true);

    for (let i = 0; i < this.roomVisuals.length; i++) {
      this.roomVisuals[i].destroy();
    }
    this.roomVisuals.length = 0;
    this.platformBounds.length = 0;
    this.spawnSurfaces.length = 0;
    this.losObstacles.length = 0;
  }

  rebuildLosObstacles() {
    const wt = BALANCE.LOS.OUTER_WALL_THICKNESS;
    const w = this.roomWidth;
    const h = this.roomHeight;

    this.losObstacles.length = 0;
    for (let i = 0; i < this.platformBounds.length; i++) {
      this.losObstacles.push(this.platformBounds[i]);
    }

    // Outer room boundary walls (supports any room width/height)
    this.losObstacles.push(
      { left: -wt, right: 0, top: -wt, bottom: h + wt },
      { left: w, right: w + wt, top: -wt, bottom: h + wt },
      { left: -wt, right: w + wt, top: -wt, bottom: 0 },
      { left: -wt, right: w + wt, top: h, bottom: h + wt }
    );
  }

  buildRoom(roomNumber) {
    const rCfg = BALANCE.ROOMS;
    this.teardownCurrentRoom();

    this.roomNumber = roomNumber;
    this.depth = Math.max(0, roomNumber - 1);
    this.roomType = 'combat';
    this.roomWidth = BALANCE.GAME.WIDTH;
    this.roomHeight = BALANCE.GAME.HEIGHT;

    const palette = this.getPaletteForRoom(roomNumber);
    this.scene.applyThemePalette(palette);

    const template = this.pickNextTemplate();
    this.currentTemplate = template;

    // Always build full-width ground
    this.addPlatform(
      rCfg.GROUND.x,
      rCfg.GROUND.y,
      rCfg.GROUND.width,
      rCfg.GROUND.height,
      palette.groundColor,
      palette.groundTopColor,
      rCfg.GROUND.topHeight,
      true
    );

    // Build template platforms
    for (let i = 0; i < template.platforms.length; i++) {
      const p = template.platforms[i];
      this.addPlatform(
        p.x,
        p.y,
        p.width,
        p.height,
        palette.platformColor,
        palette.platformTopColor,
        rCfg.PLATFORM_TOP_HEIGHT,
        false
      );
    }

    this.rebuildLosObstacles();

    this.clearMagnetTimerMs = 0;
    this.enemiesToSpawn =
      rCfg.BASE_ENEMY_QUOTA + Math.floor(this.depth * rCfg.QUOTA_DEPTH_FACTOR);
    this.maxAliveEnemies = Math.min(
      rCfg.MAX_ALIVE_CAP,
      rCfg.BASE_MAX_ALIVE + Math.floor(this.depth / rCfg.MAX_ALIVE_DEPTH_DIVISOR)
    );
    this.isCleared = false;
    this.isExitOpen = false;

    this.refreshExitDoorVisual();
  }

  addPlatform(x, y, width, height, fillColor, topColor, topHeight, isGround) {
    const rect = this.scene.add.rectangle(x, y, width, height, fillColor);
    this.platforms.add(rect);
    rect.body.updateFromGameObject();

    const halfW = width / 2;
    const halfH = height / 2;
    const bounds = {
      left: x - halfW,
      right: x + halfW,
      top: y - halfH,
      bottom: y + halfH,
      isGround
    };
    this.platformBounds.push(bounds);
    this.spawnSurfaces.push(bounds);

    const topStrip = this.scene.add.rectangle(
      x,
      y - halfH + topHeight / 2,
      width,
      topHeight,
      topColor
    );
    this.roomVisuals.push(topStrip);
  }

  onCombatRoomCleared() {
    if (this.isCleared) {
      return;
    }
    this.isCleared = true;
    this.clearMagnetTimerMs = BALANCE.ROOMS.CLEAR_MAGNET_DURATION_MS;
    this.scene.magnetizeAllActiveCoins();
  }

  openExitDoorImmediately() {
    this.enemiesToSpawn = 0;
    this.isCleared = true;
    this.clearMagnetTimerMs = 0;
    if (!this.isExitOpen) {
      this.isExitOpen = true;
      this.refreshExitDoorVisual();
      this.scene.audioManager.playDoorOpen();
    }
  }

  update(delta, aliveEnemiesCount, pendingWarningsCount) {
    this.doorPulseTime += delta;

    if (!this.isCleared && this.roomType === 'combat') {
      if (
        this.enemiesToSpawn <= 0 &&
        pendingWarningsCount <= 0 &&
        aliveEnemiesCount <= 0
      ) {
        this.onCombatRoomCleared();
      }
    }

    if (this.isCleared && !this.isExitOpen) {
      this.scene.magnetizeAllActiveCoins();
      this.clearMagnetTimerMs = Math.max(0, this.clearMagnetTimerMs - delta);
      if (this.clearMagnetTimerMs <= 0) {
        this.isExitOpen = true;
        this.refreshExitDoorVisual();
        this.scene.audioManager.playDoorOpen();
      }
    }

    if (this.isExitOpen) {
      const pulse = (Math.sin(this.doorPulseTime * 0.006) + 1) * 0.5;
      this.exitGlow.setAlpha(0.45 + pulse * 0.35);
      this.exitArrowGfx.x = pulse * 4;
    }
  }
}
