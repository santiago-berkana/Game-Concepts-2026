CAT-MECH / SHOOTER SPRITE
──────────────────────────
File name  : mech.png
Canvas size: ~80 × 80 px  (can be larger — Phaser won't scale it automatically)
Format     : PNG with transparency

When present this image replaces the programmatic cat-mech
drawing in _buildMech() / _drawMech().

Placement
• Origin is (0.5, 0.5) — the sprite is centered on mechX, MECH_Y+4.
• The barrel of the gun should point UPWARD from the center.
• The small colored "next ball" indicator circle still appears
  at  mechX, MECH_Y-36  on top of this sprite (depth 6).

Tips
• The mech slides left/right when the player drags — only the
  x position changes, so keep the design symmetrical.
• Depth is 6 (same layer as the ball indicator).
• If you want to scale it, add  .setScale(n)  in _buildMech()
  after the this.add.image() call.
