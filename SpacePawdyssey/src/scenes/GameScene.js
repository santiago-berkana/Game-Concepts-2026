'use strict';

// ═══════════════════════════════════════════════════════════
//  GAME SCENE  — core puzzle / board logic
// ═══════════════════════════════════════════════════════════
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  // ── Lifecycle ────────────────────────────────────────────
  init({ lvIdx = 0, score = 0 }) {
    this.lvIdx        = lvIdx;
    this.score        = score;
    this.inputState   = INPUT_STATE.POS;
    this.mechX        = W / 2;
    this.ball         = null;
    this.ballColor    = null;
    this.bounces      = 0;
    this.cycleElapsed = 0;
    this.aimBoosted   = false;
    this.presetColor  = null;
    this.palette      = null;
  }

  create() {
    const lv = LEVELS[this.lvIdx];
    this.shots = lv.shots;
    this._buildBG();
    this._buildWalls(lv.walls);
    this._buildForcefield();
    this._buildGrid(lv.grid);
    this._buildTopBar();
    this._buildBottomBar();
    this._buildMech();
    this._buildInput();
    this._startCycleTimer();
    this._refreshUI();
    this._refreshHint();
  }

  update(_, delta) {
    if (this.inputState === INPUT_STATE.END) return;
    this.cycleElapsed = (this.cycleElapsed + delta) % CYCLE_MS;
    if (this.cycleBar) {
      const fill = 1 - this.cycleElapsed / CYCLE_MS;
      const BX = UI.timerX, BY = UI.timerY, BW = UI.timerW, BH = UI.timerH, R = UI.timerR;
      this.cycleBar.clear();
      this.cycleBar.fillStyle(UI.timerTrack, UI.timerTrackA);
      this.cycleBar.fillRoundedRect(BX, BY, BW, BH, R);
      this.cycleBar.fillStyle(UI.timerFill, UI.timerFillA);
      if (fill > 0) this.cycleBar.fillRoundedRect(BX, BY, Math.max(BW * fill, R * 2), BH, R);
    }

    if (this.inputState === INPUT_STATE.SHOOT && this.ball) {
      const sub = delta / 1000 / 3;
      for (let i = 0; i < 3 && this.ball; i++) this._stepBall(sub);
      if (this.ball && this.lifeTxt) {
        const rem = BALL_LIFE - (this.time.now - this.ball._born);
        if (rem < 3000) {
          this.lifeTxt.setText(`${Math.ceil(rem / 1000)}s`)
            .setPosition(this.ball.x + 10, this.ball.y - 14)
            .setVisible(true);
        } else {
          this.lifeTxt.setVisible(false);
        }
      }
    }
  }

  // ── Background ───────────────────────────────────────────
  _buildBG() {
    // ── Layer 0 : base background ─────────────────────────
    if (this.textures.exists('bg')) {
      this.add.image(W / 2, H / 2, 'bg').setDepth(0);
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, UI.bgFill).setDepth(0);
    }

    // ── Layer 1 : decorations overlay ─────────────────────
    if (this.textures.exists('bg-deco')) {
      this.add.image(W / 2, H / 2, 'bg-deco').setDepth(1);
    } else {
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(UI.bgDecoFill, UI.bgDecoA);
      [[70,230],[292,252],[88,368],[280,390],[56,480],[308,460]].forEach(([x, y]) => {
        g.fillCircle(x, y, 10);
        [[-9,-11],[9,-11],[-13,-2],[13,-2]].forEach(([dx, dy]) => g.fillCircle(x + dx, y + dy, 5));
      });
    }

    this.aimGfx = this.add.graphics().setDepth(100);
  }

  // ── Segmented LED walls ──────────────────────────────────
  _buildWalls(wallDef) {
    this.wallData = {};
    const buildWall = (key, colors, isVert, baseX, baseY, totalLen, thick) => {
      const n = colors.length, segLen = totalLen / n;
      const mg = this.make.graphics({ add: false });
      mg.fillStyle(0xffffff);
      mg.fillRect(baseX, baseY, isVert ? thick : totalLen, isVert ? totalLen : thick);
      const mask = mg.createGeometryMask();
      const rects = colors.map((k, i) => {
        const rx = isVert ? baseX : baseX + i * segLen;
        const ry = isVert ? baseY + i * segLen : baseY;
        return this.add.rectangle(rx, ry, isVert ? thick : segLen, isVert ? segLen : thick, COLORS[k])
          .setOrigin(0, 0).setDepth(1).setMask(mask);
      });
      this.wallData[key] = { rects, colors: [...colors], n, segLen, isVert, baseX, baseY, totalLen, thick, mask };
    };
    buildWall('left',  wallDef.left,  true,  0,          PLAY_T, PLAY_H,          WALL_W);
    buildWall('right', wallDef.right, true,  W - WALL_W, PLAY_T, PLAY_H,          WALL_W);
    buildWall('top',   wallDef.top,   false, PLAY_L,     TOP_BAR_H, PLAY_R - PLAY_L, TOP_WALL_H);
  }

  _wallSegColor(side, bx, by) {
    const w = this.wallData[side];
    const pos  = w.isVert ? by  : bx;
    const base = w.isVert ? w.baseY : w.baseX;
    return w.colors[Phaser.Math.Clamp(Math.floor((pos - base) / w.segLen), 0, w.n - 1)];
  }

  // ── Clockwise LED cycle ───────────────────────────────────
  _startCycleTimer() {
    this.cycleBar = this.add.graphics().setDepth(12);
    this.time.addEvent({ delay: CYCLE_MS, callback: this._doCycle, callbackScope: this, loop: true });
  }

  _doCycle() {
    if (this.inputState === INPUT_STATE.END) return;
    const ld = this.wallData['left'], td = this.wallData['top'], rd = this.wallData['right'];
    const chain = [...[...ld.colors].reverse(), ...td.colors, ...rd.colors];
    const nc = [chain[chain.length - 1], ...chain.slice(0, chain.length - 1)];
    ld.colors = nc.slice(0, ld.n).reverse();
    td.colors = nc.slice(ld.n, ld.n + td.n);
    rd.colors = nc.slice(ld.n + td.n);
    this._slideWall(ld, 'up');
    this._slideWall(td, 'right');
    this._slideWall(rd, 'down');
  }

  _slideWall(w, dir) {
    const { baseX, baseY, segLen, thick, n, mask, colors } = w;
    const old = [...w.rects];
    if (dir === 'right') {
      const nr = this.add.rectangle(baseX - segLen, baseY, segLen, thick, COLORS[colors[0]])
        .setOrigin(0, 0).setMask(mask).setDepth(1);
      this.tweens.add({ targets: nr, x: baseX, duration: SLIDE_DUR, ease: 'Cubic.InOut' });
      old.forEach(r => this.tweens.add({ targets: r, x: r.x + segLen, duration: SLIDE_DUR, ease: 'Cubic.InOut' }));
      this.time.delayedCall(SLIDE_DUR + 30, () => { old[n - 1].destroy(); w.rects = [nr, ...old.slice(0, n - 1)]; });
    } else if (dir === 'down') {
      const nr = this.add.rectangle(baseX, baseY - segLen, thick, segLen, COLORS[colors[0]])
        .setOrigin(0, 0).setMask(mask).setDepth(1);
      this.tweens.add({ targets: nr, y: baseY, duration: SLIDE_DUR, ease: 'Cubic.InOut' });
      old.forEach(r => this.tweens.add({ targets: r, y: r.y + segLen, duration: SLIDE_DUR, ease: 'Cubic.InOut' }));
      this.time.delayedCall(SLIDE_DUR + 30, () => { old[n - 1].destroy(); w.rects = [nr, ...old.slice(0, n - 1)]; });
    } else { // 'up'
      const nr = this.add.rectangle(baseX, baseY + n * segLen, thick, segLen, COLORS[colors[n - 1]])
        .setOrigin(0, 0).setMask(mask).setDepth(1);
      this.tweens.add({ targets: nr, y: baseY + (n - 1) * segLen, duration: SLIDE_DUR, ease: 'Cubic.InOut' });
      old.forEach(r => this.tweens.add({ targets: r, y: r.y - segLen, duration: SLIDE_DUR, ease: 'Cubic.InOut' }));
      this.time.delayedCall(SLIDE_DUR + 30, () => { old[0].destroy(); w.rects = [...old.slice(1), nr]; });
    }
  }

  // ── Forcefield ───────────────────────────────────────────
  _buildForcefield() {
    this.add.rectangle(PLAY_L, FORCE_Y - 4, PLAY_R - PLAY_L, 8, 0x00ffff, 0.15).setOrigin(0, 0).setDepth(5);
    const glow = this.add.rectangle(PLAY_L, FORCE_Y - 2, PLAY_R - PLAY_L, 4, 0x00ffff, 0.55).setOrigin(0, 0).setDepth(5);
    this.tweens.add({ targets: glow, alpha: 0.12, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  // ── Block grid ───────────────────────────────────────────
  _buildGrid(rows) {
    this.grid = rows.map((rowStr, r) =>
      Array.from({ length: COLS }, (_, c) => {
        const k = rowStr[c];
        if (!k || k === '.') return null;
        const { x, y } = cellXY(r, c);
        const rect = this.add.rectangle(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2, BLOCK_SIZE - 2, BLOCK_SIZE - 2, COLORS[k]).setDepth(3);
        rect.setStrokeStyle(1, 0x000000, 0.3).setScale(0.05);
        this.tweens.add({ targets: rect, scaleX: 1, scaleY: 1, duration: 100, ease: 'Back.Out', delay: (r * COLS + c) * 5 });
        return { key: k, rect };
      })
    );
  }

  // ── Top bar ──────────────────────────────────────────────
  _buildTopBar() {
    const g = this.add.graphics().setDepth(10);
    g.fillStyle(UI.panelFill);
    g.fillRect(0, 0, W, TOP_BAR_H - 20);
    g.fillRoundedRect(0, TOP_BAR_H - 40, W, 48, { bl: UI.topBarRadius, br: UI.topBarRadius, tl: 0, tr: 0 });
    g.fillStyle(UI.accent);
    g.fillTriangle(42, 2, 86, 2, 64, -28); g.fillTriangle(W - 86, 2, W - 42, 2, W - 64, -28);
    g.fillStyle(UI.topEarInner, UI.topEarInnerA);
    g.fillTriangle(50, 2, 78, 2, 64, -18); g.fillTriangle(W - 78, 2, W - 50, 2, W - 64, -18);
    g.lineStyle(UI.panelStrokeW, UI.accent, UI.topBarStrokeA);
    g.strokeRoundedRect(0, 0, W, TOP_BAR_H, { bl: UI.topBarRadius, br: UI.topBarRadius, tl: 0, tr: 0 });
    g.strokeTriangle(42, 2, 86, 2, 64, -28); g.strokeTriangle(W - 86, 2, W - 42, 2, W - 64, -28);

    this.add.text(14, 8, 'AMMO', { fontSize: '10px', fill: UI.txtAccent, fontStyle: 'bold' }).setDepth(11);
    this.ammoTxt  = this.add.text(14, 22, '', { fontSize: '24px', fill: UI.txtWhite, fontStyle: 'bold' }).setDepth(11);
    this.add.text(W / 2, 7, 'SPACE  PAW-DYSSEY', { fontSize: '15px', fill: UI.txtGold, fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(11);
    this.lvTxt    = this.add.text(W - 12, 8,  '', { fontSize: '11px', fill: UI.txtAccent, fontStyle: 'bold' }).setOrigin(1, 0).setDepth(11);
    this.scoreTxt = this.add.text(W - 12, 26, '', { fontSize: '11px', fill: UI.txtScore }).setOrigin(1, 0).setDepth(11);

    this.muteTxt = this.add.text(W / 2, 46, '♪ MUSIC ON', { fontSize: '10px', fill: UI.txtAccent })
      .setOrigin(0.5).setDepth(12).setInteractive({ useHandCursor: true });
    this.muteTxt.on('pointerup', () => {
      const m = music.toggleMute();
      this.muteTxt.setText(m ? '♪ MUSIC OFF' : '♪ MUSIC ON').setAlpha(m ? 0.4 : 1);
    });
  }

  // ── Bottom bar (boosters) ────────────────────────────────
  _buildBottomBar() {
    const g = this.add.graphics().setDepth(10);
    g.fillStyle(UI.panelFill);
    g.fillRoundedRect(0, BOT_BAR_Y, W, H - BOT_BAR_Y, { tl: UI.botBarRadius, tr: UI.botBarRadius, bl: 0, br: 0 });
    g.lineStyle(UI.panelStrokeW, UI.accent, UI.botBarStrokeA);
    g.strokeRoundedRect(0, BOT_BAR_Y, W, H - BOT_BAR_Y, { tl: UI.botBarRadius, tr: UI.botBarRadius, bl: 0, br: 0 });

    const cy = BOT_BAR_Y + (H - BOT_BAR_Y) / 2;
    const SPRITE_KEYS = { 'AIM': 'btn-aim', 'SHIFT': 'btn-shift', 'MORE!': 'btn-more' };
    [
      { x: W * 0.2, emoji: '🎯', label: 'AIM'   },
      { x: W * 0.5, emoji: '🌈', label: 'SHIFT' },
      { x: W * 0.8, emoji: '🎱', label: 'MORE!' },
    ].forEach(({ x, emoji, label }) => {
      const key = SPRITE_KEYS[label];
      if (this.textures.exists(key)) {
        // ── Sprite button ──────────────────────────────────────
        const btn = this.add.image(x, cy, key).setInteractive({ useHandCursor: true }).setDepth(11);
        btn.on('pointerover', () => btn.setTint(UI.btnSpriteTint));
        btn.on('pointerout',  () => btn.clearTint());
        btn.on('pointerup',   () => this._onBooster(label));
      } else {
        // ── Programmatic fallback ──────────────────────────────
        const btn = this.add.circle(x, cy, UI.btnRadius, UI.btnFill).setInteractive({ useHandCursor: true }).setDepth(11);
        btn.setStrokeStyle(UI.panelStrokeW, UI.accent);
        this.add.text(x, cy - 7,  emoji, { fontSize: '20px' }).setOrigin(0.5).setDepth(12);
        this.add.text(x, cy + 17, label, { fontSize: '9px', fill: UI.txtAccent, fontStyle: 'bold' }).setOrigin(0.5).setDepth(12);
        btn.on('pointerover', () => btn.setFillStyle(UI.btnHover));
        btn.on('pointerout',  () => btn.setFillStyle(UI.btnFill));
        btn.on('pointerup',   () => this._onBooster(label));
      }
    });
  }

  // ── Booster logic ────────────────────────────────────────
  _onBooster(label) {
    if (this.inputState === INPUT_STATE.END) return;
    if (label === 'AIM') {
      if (this.aimBoosted) return;
      this.aimBoosted = true;
      const t = this.add.text(W / 2, MECH_Y - 72, '🎯 AIM EXTENDED!', { fontSize: '13px', fill: UI.txtGold, fontStyle: 'bold' }).setOrigin(0.5).setDepth(90);
      this.tweens.add({ targets: t, y: MECH_Y - 115, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
    } else if (label === 'SHIFT') {
      if (this.palette) return;
      this._showColorPalette();
    } else if (label === 'MORE!') {
      this.shots += 8;
      this._refreshUI();
      const t = this.add.text(W / 2, MECH_Y - 72, '🎱 +8 BALLS!', { fontSize: '13px', fill: UI.txtWin, fontStyle: 'bold' }).setOrigin(0.5).setDepth(90);
      this.tweens.add({ targets: t, y: MECH_Y - 115, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
    }
  }

  // ── SHIFT: colour palette popup ──────────────────────────
  _showColorPalette() {
    const colors = remainingColors(this.grid);
    if (!colors.length) return;
    const PAD = 16, CR = 18, GAP = 14;
    const cols = Math.min(colors.length, 4);
    const rows = Math.ceil(colors.length / cols);
    const boxW = cols * (CR * 2 + GAP) + PAD * 2 - GAP;
    const boxH = rows * (CR * 2 + GAP) + PAD * 2 + 28 - GAP;
    const bx = W / 2 - boxW / 2;
    const by = FORCE_Y - boxH - 12;

    const container = this.add.container(0, 0).setDepth(150);
    this.palette = container;

    const bg = this.add.graphics();
    bg.fillStyle(UI.paletteBg, UI.paletteBgA);
    bg.fillRoundedRect(bx, by, boxW, boxH, UI.paletteRadius);
    bg.lineStyle(UI.panelStrokeW, UI.accent, UI.paletteStrokeA);
    bg.strokeRoundedRect(bx, by, boxW, boxH, UI.paletteRadius);
    container.add(bg);

    const title = this.add.text(W / 2, by + 11, 'Choose colour', { fontSize: '11px', fill: UI.txtAccent, fontStyle: 'bold' }).setOrigin(0.5, 0);
    container.add(title);

    const closeBtn = this.add.text(bx + boxW - 10, by + 8, '✕', { fontSize: '13px', fill: UI.txtLose })
      .setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', () => this._closePalette());
    container.add(closeBtn);

    colors.forEach((k, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = bx + PAD + CR + col * (CR * 2 + GAP);
      const cy = by + 28 + PAD + CR + row * (CR * 2 + GAP);
      const circle = this.add.circle(cx, cy, CR, COLORS[k]).setInteractive({ useHandCursor: true });
      circle.setStrokeStyle(2.5, 0xffffff, 0.35);
      circle.on('pointerover', () => circle.setStrokeStyle(3, 0xffffff, 0.9));
      circle.on('pointerout',  () => circle.setStrokeStyle(2.5, 0xffffff, 0.35));
      circle.on('pointerup',   () => {
        this.presetColor = k;
        this.ballSprite.setFillStyle(COLORS[k]);
        this._closePalette();
        const t = this.add.text(W / 2, MECH_Y - 72, '🌈 COLOR SET!', { fontSize: '13px', fill: UI.txtGold, fontStyle: 'bold' }).setOrigin(0.5).setDepth(90);
        this.tweens.add({ targets: t, y: MECH_Y - 115, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
      });
      container.add(circle);
    });

    container.setAlpha(0).setScale(0.85);
    this.tweens.add({ targets: container, alpha: 1, scaleX: 1, scaleY: 1, duration: 160, ease: 'Back.Out' });
  }

  _closePalette() {
    if (!this.palette) return;
    const p = this.palette; this.palette = null;
    this.tweens.add({ targets: p, alpha: 0, scaleX: 0.85, scaleY: 0.85, duration: 120, onComplete: () => p.destroy() });
  }

  // ── Cat-mech ─────────────────────────────────────────────
  _buildMech() {
    if (this.textures.exists('mech')) {
      this.mechImg = this.add.image(this.mechX, MECH_Y + 4, 'mech').setDepth(6).setOrigin(0.5, 0.5);
      this.mechGfx = null;
    } else {
      this.mechGfx = this.add.graphics().setDepth(6);
      this.mechImg = null;
    }
    const ballTex = this.textures.exists('ball');
    this.ballSprite = ballTex
      ? this.add.image(this.mechX, MECH_Y - 36, 'ball').setDepth(6)
      : this.add.circle(this.mechX, MECH_Y - 36, BALL_R, BALL_WHITE).setDepth(6);
    if (!ballTex) this.ballSprite.setStrokeStyle(1.5, 0xffffff, 0.5);
    this.lifeTxt = this.add.text(0, 0, '', { fontSize: '11px', fill: UI.txtDanger, fontStyle: 'bold' })
      .setOrigin(0).setVisible(false).setDepth(101);
    this.hintTxt = this.add.text(W / 2, MECH_Y + 28, '', { fontSize: '11px', fill: UI.txtAccent, fontStyle: 'bold' })
      .setOrigin(0.5, 0).setDepth(80);
    this._drawMech();
  }

  _drawMech() {
    // ── Sprite path ──────────────────────────────────────────
    if (this.mechImg) {
      this.mechImg.x = this.mechX;
      if (this.ballSprite) this.ballSprite.x = this.mechX;
      return;
    }
    // ── Programmatic fallback ────────────────────────────────
    const g = this.mechGfx, mx = this.mechX, my = MECH_Y;
    g.clear();
    g.lineStyle(1, UI.accent, 0.3);
    g.strokeLineShape(new Phaser.Geom.Line(PLAY_L + 4, my + 28, PLAY_R - 4, my + 28));
    g.fillStyle(0x576574); g.fillEllipse(mx - 24, my + 16, 18, 11); g.fillEllipse(mx + 24, my + 16, 18, 11);
    g.fillStyle(0xff7043);  g.fillEllipse(mx - 24, my + 23, 13, 7);  g.fillEllipse(mx + 24, my + 23, 13, 7);
    g.fillStyle(0x8fb8d8); g.fillEllipse(mx, my + 4, 58, 44);
    g.lineStyle(2, 0xd4eaf7, 0.6); g.strokeEllipse(mx, my + 4, 58, 44);
    g.fillStyle(0x2d7ab5); g.fillEllipse(mx, my - 3, 36, 28);
    g.lineStyle(1.5, 0x6ab8e8, 0.7); g.strokeEllipse(mx, my - 3, 36, 28);
    g.fillStyle(0xf5cba7); g.fillCircle(mx, my - 4, 11);
    g.fillTriangle(mx - 9, my - 13, mx - 5, my - 13, mx - 8, my - 20);
    g.fillTriangle(mx + 5, my - 13, mx + 9, my - 13, mx + 8, my - 20);
    g.fillStyle(0xe91e8c, 0.7);
    g.fillTriangle(mx - 8, my - 13, mx - 6, my - 13, mx - 7, my - 18);
    g.fillTriangle(mx + 6, my - 13, mx + 8, my - 13, mx + 7, my - 18);
    g.fillStyle(0x1a1a2e); g.fillCircle(mx - 3.5, my - 6, 2.2); g.fillCircle(mx + 3.5, my - 6, 2.2);
    g.fillStyle(0xffffff); g.fillCircle(mx - 2.8, my - 7, 0.9); g.fillCircle(mx + 4.2, my - 7, 0.9);
    g.fillStyle(0xe91e8c); g.fillTriangle(mx - 2, my - 3, mx + 2, my - 3, mx, my - 1);
    g.lineStyle(1, 0xffffff, 0.55);
    g.strokeLineShape(new Phaser.Geom.Line(mx - 10, my - 2.5, mx - 4.5, my - 1.5));
    g.strokeLineShape(new Phaser.Geom.Line(mx - 10, my + 0.5, mx - 4.5, my + 0.0));
    g.strokeLineShape(new Phaser.Geom.Line(mx + 4.5, my - 1.5, mx + 10, my - 2.5));
    g.strokeLineShape(new Phaser.Geom.Line(mx + 4.5, my + 0.0, mx + 10, my + 0.5));
    g.fillStyle(0x576574); g.fillRect(mx - 4, my - 40, 8, 24);
    g.fillStyle(0x2c3e50); g.fillRect(mx - 5.5, my - 46, 11, 10);
    g.fillStyle(0x7f8c8d); g.fillRect(mx - 5, my - 48, 10, 4);
    if (this.ballSprite) this.ballSprite.x = mx;
  }

  // ── Input ─────────────────────────────────────────────────
  _buildInput() {
    this.input.once('pointerdown', () => music.start());
    let startX = 0, moved = false;
    this.input.on('pointerdown', ptr => {
      startX = ptr.x; moved = false;
      if (this.inputState === INPUT_STATE.AIM && Math.abs(ptr.x - this.mechX) < 54 && ptr.y > MECH_Y - 55) {
        this.inputState = INPUT_STATE.POS;
        this.aimGfx.clear();
        this._refreshHint();
      }
    });
    this.input.on('pointermove', ptr => {
      if (this.inputState === INPUT_STATE.POS && Math.abs(ptr.x - startX) > 5) {
        moved = true;
        this.mechX = Phaser.Math.Clamp(ptr.x, PLAY_L + 34, PLAY_R - 34);
        this._drawMech();
      } else if (this.inputState === INPUT_STATE.AIM) {
        this._drawAimLine(ptr.x, ptr.y);
      }
    });
    this.input.on('pointerup', ptr => {
      if (this.inputState === INPUT_STATE.END) return;
      if (this.palette) return;
      if (this.inputState === INPUT_STATE.POS && !moved) {
        this.inputState = INPUT_STATE.AIM;
        this._refreshHint();
      } else if (this.inputState === INPUT_STATE.AIM && ptr.y < MECH_Y - 22) {
        this._doShoot(ptr.x, ptr.y);
      }
    });
  }

  // ── Aim dotted line ──────────────────────────────────────
  _drawAimLine(tx, ty) {
    this.aimGfx.clear();
    const a = Math.atan2(ty - MECH_Y, tx - this.mechX);
    if (Math.sin(a) >= -0.05) return;
    let x = this.mechX, y = MECH_Y - 42, dx = Math.cos(a), dy = Math.sin(a);
    const limit = this.aimBoosted ? AIM_BOOSTED : AIM_BASE;
    this.aimGfx.fillStyle(0xffffff, UI.aimA);
    for (let i = 0; i < limit && y > TOP_BAR_H; i++) {
      x += dx * 11; y += dy * 11;
      if (x <= PLAY_L + BALL_R) { x = PLAY_L + BALL_R; dx =  Math.abs(dx); }
      if (x >= PLAY_R - BALL_R) { x = PLAY_R - BALL_R; dx = -Math.abs(dx); }
      if (y <= PLAY_T + BALL_R) { y = PLAY_T + BALL_R; dy =  Math.abs(dy); }
      if (i % 2 === 0) this.aimGfx.fillCircle(x, y, 2);
    }
  }

  // ── Shoot ─────────────────────────────────────────────────
  _doShoot(tx, ty) {
    if (this.shots <= 0) return;
    this._closePalette();
    this.aimGfx.clear();
    const a = Math.atan2(ty - MECH_Y, tx - this.mechX);
    const b = this.add.circle(this.mechX, MECH_Y - 42, BALL_R, BALL_WHITE).setDepth(50);
    b.setStrokeStyle(1.5, 0xffffff, 0.5);
    b._vx = Math.cos(a) * BALL_SPEED;
    b._vy = Math.sin(a) * BALL_SPEED;
    b._born = this.time.now;
    b._entered = false;

    if (this.presetColor) {
      this.ballColor = this.presetColor;
      b.setFillStyle(COLORS[this.presetColor]);
      b.setStrokeStyle(1.5, 0xffffff, 0.6);
      this.presetColor = null;
    } else {
      this.ballColor = null;
      b.setFillStyle(BALL_WHITE);
    }
    this.ball = b;
    this.bounces = 0;
    this.shots--;
    this.inputState = INPUT_STATE.SHOOT;
    this.ballSprite.setFillStyle(BALL_WHITE).setVisible(false);
    this._refreshUI();
    this._refreshHint();
  }

  // ── Ball physics ──────────────────────────────────────────
  _stepBall(dt) {
    const b = this.ball;
    b.x += b._vx * dt; b.y += b._vy * dt;
    if (b.y < FORCE_Y) {
      if (b.x <= PLAY_L + BALL_R) { b.x = PLAY_L + BALL_R; b._vx =  Math.abs(b._vx); this._paintBall('left',  b.x, b.y); }
      if (b.x >= PLAY_R - BALL_R) { b.x = PLAY_R - BALL_R; b._vx = -Math.abs(b._vx); this._paintBall('right', b.x, b.y); }
    }
    if (b.y <= PLAY_T + BALL_R) { b.y = PLAY_T + BALL_R; b._vy = Math.abs(b._vy); this._paintBall('top', b.x, b.y); }
    if (!b._entered && b.y < FORCE_Y) b._entered = true;
    if (b._entered && b._vy > 0 && b.y >= FORCE_Y - BALL_R) { b.y = FORCE_Y - BALL_R; b._vy = -Math.abs(b._vy); this.bounces++; }
    this._checkBlocks();
    if (this.time.now - b._born >= BALL_LIFE || this.bounces >= MAX_BOUNCE) this._ballDie();
  }

  _paintBall(side, bx, by) {
    this.bounces++;
    const key = this._wallSegColor(side, bx, by);
    this.ballColor = key;
    this.ball.setFillStyle(COLORS[key]);
  }

  // ── Block collision (pierce same colour) ─────────────────
  _checkBlocks() {
    const b = this.ball; let bounced = false;
    for (let ri = 0; ri < this.grid.length; ri++) {
      const row = this.grid[ri]; if (!row) continue;
      for (let ci = 0; ci < COLS; ci++) {
        const cell = row[ci]; if (!cell) continue;
        const rx = GRID_X + ci * BLOCK_SIZE, ry = GRID_Y + ri * BLOCK_SIZE;
        const nx = Phaser.Math.Clamp(b.x, rx, rx + BLOCK_SIZE);
        const ny = Phaser.Math.Clamp(b.y, ry, ry + BLOCK_SIZE);
        if (Math.hypot(b.x - nx, b.y - ny) > BALL_R) continue;
        if (this.ballColor === cell.key) {
          this._popBlock(ri, ci); this.score += 10; this._refreshUI();
          if (isEmpty(this.grid)) { this._ballDie(); return; }
        } else if (!bounced) {
          const cx = rx + BLOCK_SIZE / 2, cy = ry + BLOCK_SIZE / 2;
          const ovX = BLOCK_SIZE / 2 + BALL_R - Math.abs(b.x - cx);
          const ovY = BLOCK_SIZE / 2 + BALL_R - Math.abs(b.y - cy);
          if (ovX < ovY) { b._vx = -b._vx; b.x += b.x < cx ? -ovX : ovX; }
          else           { b._vy = -b._vy; b.y += b.y < cy ? -ovY : ovY; }
          this.bounces++; bounced = true; return;
        }
      }
    }
  }

  _popBlock(r, c) {
    const cell = this.grid[r][c]; if (!cell) return;
    this.grid[r][c] = null;
    const { x, y } = cellXY(r, c), cx = x + BLOCK_SIZE / 2, cy = y + BLOCK_SIZE / 2;
    this.tweens.add({ targets: cell.rect, scaleX: 1.7, scaleY: 1.7, alpha: 0, duration: 180, ease: 'Power2', onComplete: () => cell.rect.destroy() });
    const lbl = this.add.text(cx, cy - 2, '+10', { fontSize: '10px', fill: UI.txtGold, fontStyle: 'bold' }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: lbl, y: cy - 26, alpha: 0, duration: 450, onComplete: () => lbl.destroy() });
  }

  _ballDie() {
    if (!this.ball) return;
    this.ball.destroy(); this.ball = null; this.ballColor = null;
    this.lifeTxt?.setVisible(false);
    if (isEmpty(this.grid)) { this._endGame(true);  return; }
    if (this.shots <= 0)    { this._endGame(false); return; }
    this.inputState = INPUT_STATE.POS;
    this.ballSprite.setFillStyle(BALL_WHITE).setVisible(true);
    this._refreshHint();
  }

  // ── End screen ────────────────────────────────────────────
  _endGame(win) {
    this.inputState = INPUT_STATE.END;
    this.aimGfx.clear(); this.hintTxt?.setText('');
    this._closePalette();
    this.add.rectangle(W / 2, H / 2, W, H, UI.overlayColor, UI.overlayA).setDepth(200);
    this.add.text(W / 2, H / 2 - 100, win ? '🐱 LEVEL CLEAR!' : '💀 OUT OF AMMO',
      { fontSize: '28px', fill: win ? UI.txtWin : UI.txtLose, fontStyle: 'bold' }).setOrigin(0.5).setDepth(201);
    this.add.text(W / 2, H / 2 - 54, `Score: ${this.score}`, { fontSize: '22px', fill: UI.txtWhite }).setOrigin(0.5).setDepth(201);
    const hasNext = win && this.lvIdx + 1 < LEVELS.length;
    if (hasNext) this._uiBtn(W / 2, H / 2 + 8,  '▶ NEXT LEVEL', UI.txtGold,   () => this.scene.restart({ lvIdx: this.lvIdx + 1, score: this.score }));
    this._uiBtn(W / 2, H / 2 + (hasNext ? 72 : 8), '↺ RETRY', UI.txtAccent, () => this.scene.restart({ lvIdx: this.lvIdx, score: 0 }));
  }

  // ── UI helpers ────────────────────────────────────────────
  _refreshUI() {
    this.ammoTxt.setText(`×${this.shots}`);
    this.lvTxt.setText(LEVELS[this.lvIdx].title);
    this.scoreTxt.setText(`${this.score} pts`);
  }

  _refreshHint() {
    const msgs = {
      [INPUT_STATE.POS]:   '← DRAG TO MOVE  |  TAP TO LOCK →',
      [INPUT_STATE.AIM]:   '👆 TAP ABOVE TO SHOOT',
      [INPUT_STATE.SHOOT]: '',
      [INPUT_STATE.END]:   '',
    };
    this.hintTxt?.setText(msgs[this.inputState] ?? '');
  }

  _uiBtn(x, y, label, color, cb) {
    const t = this.add.text(x, y, label, {
      fontSize: '20px', fill: color,
      fontStyle: 'bold', backgroundColor: UI.endBtnBg, padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(202);
    t.on('pointerover', () => t.setAlpha(0.7));
    t.on('pointerout',  () => t.setAlpha(1));
    t.on('pointerup',   cb);
  }
}
