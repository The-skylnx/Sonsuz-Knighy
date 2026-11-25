import { BALANCE } from './config/balance.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

function preventDefaultBrowserGestures() {
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('selectstart', (e) => e.preventDefault());
  window.addEventListener('dragstart', (e) => e.preventDefault());

  // Prevent iOS Safari pinch-to-zoom and double-tap zoom gestures
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
}

function setupOrientationMonitor(game) {
  const checkOrientation = () => {
    const isPortrait = window.innerHeight > window.innerWidth;
    document.body.classList.toggle('is-portrait', isPortrait);
    if (game && game.scale) {
      game.scale.refresh();
    }
  };

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', () => {
    checkOrientation();
    setTimeout(checkOrientation, 150);
  });

  checkOrientation();
}

preventDefaultBrowserGestures();

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: BALANCE.GAME.WIDTH,
  height: BALANCE.GAME.HEIGHT,
  backgroundColor: BALANCE.GAME.BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: BALANCE.PHYSICS.GRAVITY_Y },
      debug: false
    }
  },
  scene: [BootScene, GameScene, UIScene, GameOverScene]
};

const game = new Phaser.Game(config);
setupOrientationMonitor(game);
