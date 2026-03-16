'use strict';

// ═══════════════════════════════════════════════════════════
//  BOOT SCENE  — asset preloading / initial scene transition
// ═══════════════════════════════════════════════════════════
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Suppress console errors for intentionally missing sprite slots
    // (every slot is optional — the game falls back to programmatic drawing)
    this.load.on('loaderror', () => {});

    // ── Sprite slots ─────────────────────────────────────────────────────
    // Drop a PNG into the listed path and it automatically replaces the
    // matching programmatic placeholder.  See each folder's README.txt.
    //
    // Key           Path                            Size (recommended)
    // ──────────── ─────────────────────────────── ────────────────────
    // 'bg'          assets/bg/background.png        360 × 640 px
    // 'bg-deco'     assets/bg/background-deco.png   360 × 640 px (transparent)
    // 'mech'        assets/mech/mech.png            ~80 × 80 px  (transparent)
    // 'ball'        assets/ball/ball.png            14 × 14 px   (transparent)
    // 'btn-aim'     assets/ui/btn-aim.png           ~54 × 54 px  (transparent)
    // 'btn-shift'   assets/ui/btn-shift.png         ~54 × 54 px  (transparent)
    // 'btn-more'    assets/ui/btn-more.png          ~54 × 54 px  (transparent)
    // ─────────────────────────────────────────────────────────────────────
    this.load.image('bg',        'assets/bg/background.png');
    this.load.image('bg-deco',   'assets/bg/background-deco.png');
    // this.load.image('mech',      'assets/mech/mech.png');  // disabled — using code mech
    this.load.image('ball',      'assets/ball/ball.png');
    this.load.image('btn-aim',   'assets/ui/btn-aim.png');
    this.load.image('btn-shift', 'assets/ui/btn-shift.png');
    this.load.image('btn-more',  'assets/ui/btn-more.png');
  }

  create() {
    this.scene.start('Game', { lvIdx: 0, score: 0 });
  }
}
