BACKGROUND SPRITES  —  assets/bg/
══════════════════════════════════════════════════════════════

Game canvas size : 360 × 640 px  (all coordinates below are in
                   this space, origin top-left)

There are TWO independent layers.  Drop either or both PNGs and
they will be loaded automatically.  If a file is missing its
layer falls back to the programmatic placeholder.


────────────────────────────────────────────────────────────────
FILE 1 — background.png          (KEY: 'bg')
────────────────────────────────────────────────────────────────
Canvas size : 360 × 640 px  (exact full canvas — opaque is fine)
Depth       : 0  (lowest layer — everything renders on top)
Anchor      : center (180, 320)

This is the plain base background.
The programmatic placeholder is a solid dark-purple rectangle:
  color  #1e0d35
  covers the entire 360 × 640 canvas


────────────────────────────────────────────────────────────────
FILE 2 — background-deco.png     (KEY: 'bg-deco')
────────────────────────────────────────────────────────────────
Canvas size : 360 × 640 px  — MUST use transparency (PNG)
Depth       : 1  (rendered on top of 'bg')
Anchor      : center (180, 320)

This is the decoration / detail overlay layer.
It sits directly on top of the base background.
Design it as a full 360×640 transparent PNG and paint only the
details you want — the transparent areas will show 'bg' beneath.

The programmatic placeholder draws 6 nebula-like blobs:
  color   #2d1553  at 38 % opacity
  Each blob = 1 center circle (r 10) + 4 satellite circles (r 5)
  Satellite offsets from center: (−9,−11) (9,−11) (−13,−2) (13,−2)

  Blob center positions (x, y):
    1.  ( 70, 230)          4.  (280, 390)
    2.  (292, 252)          5.  ( 56, 480)
    3.  ( 88, 368)          6.  (308, 460)

  All blobs fall inside the play area:
    x  range :  42 – 321
    y  range : 219 – 493
  (Play area bounds: x 14–346, y 108–524 — safe zone for art)


────────────────────────────────────────────────────────────────
LAYER ORDER (bottom → top)
────────────────────────────────────────────────────────────────
  depth  0   bg             base background
  depth  1   bg-deco        decoration overlay
  depth  1   walls          colored wall segments
  depth  2   (wall outline, removed)
  depth  3   block grid
  depth  5   force-field line
  depth  6   cat mech + ball indicator
  depth 10   top / bottom bar panels
  depth 11   UI text
  depth 12   timer capsule bar
  depth 100  aim-line graphics
