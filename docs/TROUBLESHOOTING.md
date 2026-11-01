# Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| No Studio button | Only GMs see it (token controls). Also in Settings → Module Settings → *Open the Studio*. |
| "Only the GM can save rigs" | Saving writes files to the world folder; the user needs file-upload permission. |
| Token does not animate | The actor needs a profile (Studio → person button). The token's image must have the same shape as the rig's sprite (use the option that sets it). Check *Animate tokens* is on (client setting) and the rig check shows no red problems. Console (F12) messages start with `fu-sprite-animator |`. |
| Token animates but looks cut off at the edges | Set *Token texture* to *Padded*; if the self-test says padded does not work in your Foundry build, use *Clipped* and keep motions inside the sprite. |
| Art is blurry | Rig settings → *Rendering: Pixel art*. Pixel mode samples nearest-neighbour at the sprite's own resolution. |
| Gaps at elbows or knees | Make those parts *Bend* and raise *Joint softness*; check the joint sits on the art's pivot. |
| Part of the torso swings with the arm | Paint those pixels back onto the torso (Paint mode). |
| An animation leaves a limb still | The bone lacks the role the clip uses (rig check lists them). Set the role in the Inspector. |
| Rig fails to open: "image is now …" | The image file changed size since the rig was made. Re-import the sprite. |
| Many tokens are slow | Lower *Most animated tokens*; set idle frame rate to 8–12 fps in rig settings. |
| fu-animations flames/frost outline looks like a capsule on animated tokens | Known: fu-animations reads the token's texture pixels; animated textures fall back to its default shape. |
| Run the self-test | Console: `await SpriteAnimator.selfTest()` |
