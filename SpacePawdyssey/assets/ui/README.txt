UI SPRITES  —  assets/ui/
══════════════════════════════════════════════════════════════

Game canvas : 360 × 640 px  (all coordinates are in this space,
              origin top-left)

There are three optional button sprites.  Drop any or all of
the PNGs below and they replace the corresponding booster button.
Missing files fall back to the programmatic circle + emoji + label.


────────────────────────────────────────────────────────────────
TOP BAR  —  programmatic (no sprite slot)
────────────────────────────────────────────────────────────────
Position    : x 0, y 0
Size        : 360 × 90 px
Depth       : 10
Shape       : flat top, bottom-left + bottom-right corners
              rounded (radius 26)
Fill color  : #120826  (very dark purple)
Border      : 2 px  #7c3aed  (bright purple), same rounded shape
Decorative  : two pointed "ear" triangles clipped at the very top
              center-left ~x 42–86 and center-right ~x 274–318

Text elements inside the top bar (depth 11–12):

  "AMMO" label
    position  : (14, 8)   — left-aligned
    font      : 10 px, bold
    color     : #a78bfa

  Ammo counter  "×10" / "×9" etc.
    position  : (14, 22)  — left-aligned
    font      : 24 px, bold
    color     : #ffffff

  Title  "SPACE  PAW-DYSSEY"
    position  : (180, 7)  — centered (origin 0.5, 0)
    font      : 15 px, bold
    color     : #f1c40f  (gold)

  Level label  "LEVEL 1" etc.
    position  : (348, 8)  — right-aligned (origin 1, 0)
    font      : 11 px, bold
    color     : #a78bfa

  Score  "0 pts" etc.
    position  : (348, 26) — right-aligned (origin 1, 0)
    font      : 11 px, regular
    color     : #94a3b8

  Music toggle  "♪ MUSIC ON" / "♪ MUSIC OFF"
    position  : (180, 46) — centered (origin 0.5)
    font      : 10 px, regular
    color     : #a78bfa  (dimmed to 40 % when muted)
    interactive: tap to toggle

  Cycle timer bar  (capsule, redrawn every frame)
    position  : x 20, y 66
    size      : 320 × 5 px  (W − 40 wide)
    corner radius : 2.5 px
    depth     : 12
    track     : #2d1553  at 80 % opacity  (dark purple — always full width)
    fill      : #9b72f5  at 90 % opacity  (bright purple — shrinks left→right)
    The bar drains fully once per wall-color cycle (~12 seconds at BPM 120).


────────────────────────────────────────────────────────────────
BOTTOM BAR  —  programmatic (no sprite slot)
────────────────────────────────────────────────────────────────
Position    : x 0, y 572
Size        : 360 × 68 px
Depth       : 10
Shape       : top-left + top-right corners rounded (radius 18),
              flat bottom
Fill color  : #120826
Border      : 2 px  #7c3aed

Button center Y : 606  (= 572 + 34, vertical midpoint of the bar)

  ┌─────────────────────────────────────────────────────────┐
  │  BTN 1 — AIM           x  72  (= 360 × 0.2)            │
  │  BTN 2 — SHIFT         x 180  (= 360 × 0.5)            │
  │  BTN 3 — MORE!         x 288  (= 360 × 0.8)            │
  └─────────────────────────────────────────────────────────┘

  Each button (programmatic fallback):
    circle     radius 27, fill #3b1d6e, stroke 2 px #7c3aed
    hover fill #5b2d8e
    emoji text (x, 599)  font 20 px
    label text (x, 623)  font 9 px, bold, color #a78bfa


────────────────────────────────────────────────────────────────
BUTTON SPRITES  (optional replacements)
────────────────────────────────────────────────────────────────
File            Key          Button   Center position
──────────────  ──────────── ──────── ──────────────────────────
btn-aim.png     'btn-aim'    AIM      ( 72, 606)
btn-shift.png   'btn-shift'  SHIFT    (180, 606)
btn-more.png    'btn-more'   MORE!    (288, 606)

Recommended size : ~54 × 54 px  (matches the circle diameter 54 px)
Format           : PNG with transparency
Anchor           : center (0.5, 0.5)
Depth            : 11

When a sprite is active:
  • The programmatic circle, emoji, and label are NOT drawn.
  • Hover effect : light-blue tint  #ddddff
  • Design the sprite as a self-contained button icon — bake
    the icon and label into the PNG.

The bottom-bar background panel is always drawn programmatically;
the sprites sit on top of it.
