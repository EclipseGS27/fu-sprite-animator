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
| Attacks from the character sheet do not animate | Settings → *Animate actions from chat cards* must be on, and the attacking token needs a sprite rig. `SpriteAnimator.resolveClip(item)` shows what would play and why (`source`, `key`); `SpriteAnimator.describe(item)` shows how the item was read. |
| The wrong animation plays for an ability | Change it for everyone (Settings → *Sprite animations for abilities*), for one character (actor sheet header → *Sprite animation choices*) or for one item (item sheet header → *Sprite animation*). See docs/ABILITY_MAPPING.md. |
| A character plays a different animation than chosen | Its rig lacks the roles that animation needs (a wolf cannot "Bow attack"), so the closest one it can play is used. The Studio library dims animations a rig cannot play and says which roles are missing. |
| Targets react a little before fu-animations' hit | fu-animations has no "hit landed" signal yet, so its timing is estimated; cut-ins and boss scenes delay its hits. Turn off *Targets react* if it bothers you. |
| A defeated character does not get up | It rises when its HP goes above 0. If *Defeated pose at 0 HP* was turned off meanwhile, reload the scene. |
| A creature's head ended up at its tail | Set *Character faces* in the Inspector, or choose *What is it?* again on the banner to rebuild the skeleton. |
| A creature's legs, tail or wings are off | Drag the joints onto the art and press the wand; curled tails that touch a leg are placed by proportion. |
| "Ability animations list chooses animations that no longer exist" (self-test) | A world animation was deleted; pick another in Settings → *Sprite animations for abilities* (it is marked "missing"). |
| Run the self-test | Console: `await SpriteAnimator.selfTest()` |
