'use strict';

// ═══════════════════════════════════════════════════════════
//  GAME INIT  — Phaser.Game config + boot
// ═══════════════════════════════════════════════════════════
new Phaser.Game({
  type:            Phaser.AUTO,
  width:           W,
  height:          H,
  backgroundColor: '#0d0015',
  scene:           [BootScene, GameScene],
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  parent: document.body,
});
