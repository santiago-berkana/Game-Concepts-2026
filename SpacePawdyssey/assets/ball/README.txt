BALL SPRITE
────────────
File name  : ball.png
Canvas size: 14 × 14 px  (matches BALL_R = 7, diameter = 14)
Format     : PNG with transparency

When present this image replaces the white circle used as the
"queued ball" indicator on top of the mech (ballSprite).

Note: the in-flight ball (the one you actually shoot) is still
drawn as a colored circle in _doShoot() — it changes fill color
dynamically as it bounces off walls. A sprite override for the
in-flight ball is not wired up yet; ask for it if needed.

Tips
• Keep it roughly circular so it looks right in the SHIFT
  color-picker palette and on the mech indicator.
• Depth is 6 (just above the mech layer).
