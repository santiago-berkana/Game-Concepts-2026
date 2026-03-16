'use strict';

// ═══════════════════════════════════════════════════════════
//  LAYOUT
// ═══════════════════════════════════════════════════════════
const W          = 360;
const H          = 640;
const WALL_W     = 14;
const TOP_BAR_H  = 90;
const TOP_WALL_H = 18;
const BOT_BAR_Y  = 572;
const MECH_Y     = 524;
const FORCE_Y    = MECH_Y - 46;
const PLAY_T     = TOP_BAR_H + TOP_WALL_H;
const PLAY_L     = WALL_W;
const PLAY_R     = W - WALL_W;
const PLAY_H     = FORCE_Y - PLAY_T;

// ── Grid ────────────────────────────────────────────────────
const BLOCK_SIZE = 19;
const COLS       = 10;
const GRID_W     = COLS * BLOCK_SIZE;
const GRID_X     = Math.round((W - GRID_W) / 2);
const GRID_Y     = PLAY_T + 3 * BLOCK_SIZE;

// ── Ball ────────────────────────────────────────────────────
const BALL_R     = 7;
const BALL_SPEED = 640;
const BALL_LIFE  = 5000;
const MAX_BOUNCE = 140;
const BALL_WHITE = 0xfff8dc;

// ── Aim ─────────────────────────────────────────────────────
const AIM_BASE    = 37;
const AIM_BOOSTED = Math.round(AIM_BASE * 1.5); // 55

// ── Timing ──────────────────────────────────────────────────
const BPM      = 120;
const CYCLE_MS = Math.round(6 * 4 * (60000 / BPM));
const SLIDE_DUR = 400;

// ── Colour palette ──────────────────────────────────────────
const COLORS = {
  r: 0xe74c3c,
  b: 0x6644ff,
  g: 0x2ecc71,
  y: 0xf1c40f,
  p: 0xe91e8c,
  c: 0x00bcd4,
};

// ── Input states ────────────────────────────────────────────
const INPUT_STATE = {
  POS:   'pos',
  AIM:   'aim',
  SHOOT: 'shoot',
  END:   'end',
};

// ═══════════════════════════════════════════════════════════
//  UI STYLE  — change any value here to restyle the game
// ═══════════════════════════════════════════════════════════
const UI = {

  // ── Shared accent ────────────────────────────────────────
  // Used for panel borders, button borders, aim-guide line
  accent:          0x8151ff,

  // ── Panels (top bar + bottom bar) ────────────────────────
  panelFill:       0x16004f,   // background fill of both bars
  panelStrokeW:    2,          // border width (px)
  topBarRadius:    26,         // bl / br rounded corners of the top bar
  topBarStrokeA:   0.85,       // top bar border opacity
  topEarInner:     0xe91e8c,   // inner colour of the decorative ear triangles
  topEarInnerA:    0.65,       // ear inner opacity
  botBarRadius:    18,         // tl / tr rounded corners of the bottom bar
  botBarStrokeA:   0.7,        // bottom bar border opacity

  // ── Booster buttons ──────────────────────────────────────
  btnFill:         0x3b1d6e,   // resting fill
  btnHover:        0x5b2d8e,   // hover fill
  btnRadius:       27,         // circle radius (px)
  btnSpriteTint:   0xddddff,   // tint applied on hover when using a sprite

  // ── Cycle timer bar ──────────────────────────────────────
  timerX:          20,         // left edge (px)
  timerY:          66,         // top edge — sits below "MUSIC ON" text
  timerW:          W - 40,     // width (320 px)
  timerH:          5,          // height (px)
  timerR:          2.5,        // corner radius
  timerTrack:      0x2d1553,   // empty-track colour
  timerTrackA:     0.8,        // empty-track opacity
  timerFill:       0x9b72f5,   // filled-portion colour
  timerFillA:      0.9,        // filled-portion opacity

  // ── Background fallbacks (no sprite) ─────────────────────
  bgFill:          0x1e0d35,   // plain background rectangle colour
  bgDecoFill:      0x2d1553,   // nebula blob colour
  bgDecoA:         0.38,       // nebula blob opacity

  // ── Colour-picker palette popup ──────────────────────────
  paletteBg:       0x1e0d35,   // popup background
  paletteBgA:      0.96,
  paletteStrokeA:  0.9,        // popup border opacity (colour = accent)
  paletteRadius:   14,         // popup corner radius

  // ── Text colours ─────────────────────────────────────────
  txtAccent:      '#a78bfa',   // labels, hints, mute toggle
  txtGold:        '#f1c40f',   // title, popup feedback messages
  txtWhite:       '#ffffff',   // ammo counter
  txtScore:       '#94a3b8',   // score display
  txtDanger:      '#ff5555',   // ball-life countdown
  txtWin:         '#2ecc71',   // win message / next-level button
  txtLose:        '#e74c3c',   // lose message / palette close btn

  // ── End-screen overlay ────────────────────────────────────
  overlayColor:    0x000000,
  overlayA:        0.80,
  endBtnBg:       '#1e0d35',   // end-screen button background

  // ── Aim dotted line ───────────────────────────────────────
  aimA:            0.42,       // opacity of aim dots (colour is always white)
};
