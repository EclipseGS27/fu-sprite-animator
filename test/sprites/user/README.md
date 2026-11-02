# The owner's sprites

Real battle sprites provided by the project owner for testing (2026-11-02). Unlike the generated
fixtures in `test/sprites/`, they have **no ground truth**, so tests can only check what must hold
for any art (`test/unit/user-sprites.test.ts`): nothing is lost on import, the automatic rig is
usable, and the rest pose is bit-identical to the file.

They are excluded from the module download (`.gitattributes` → `export-ignore`). Some are fan art of
existing game characters: keep them out of any public release.

| File | What | Notes |
| --- | --- | --- |
| `party_sheet.png` | the original 500×536 sheet of seven characters | native pixel art, no partial transparency |
| `sword_blue_blade.png` | swordsman, glowing blade held low to the left | cut from the sheet (pixels unchanged) |
| `summoner_staff.png` | summoner with a ringed staff | cut from the sheet |
| `greatsword_red_coat.png` | greatsword over the shoulder, long coat | cut from the sheet |
| `brawler_ball.png` | brawler with a ball, wide stance | cut from the sheet |
| `mage_dress_moogle.png` | mage in a long dress holding a doll | cut from the sheet |
| `thief_bracers.png` | small thief with arm bracers | cut from the sheet |
| `beast_spear.png` | horned beast-man with a long spear held across | cut from the sheet |
| `dragon_green.png` | green dragon, wings spread, curled tail, smoke | 677×369, smoothed edges (Illustration mode) |
| `spectral_wolf.png` | glowing wolf, legs spread, wisps at the feet | 677×369, smoothed edges |
| `wraith.png` | hooded wraith with trailing robes, crescent and crystals | 677×369, smoothed edges |
| `chronomancer.png` | mage with an hourglass staff and floating glyphs | 677×369, smoothed edges |

## What the automatic rig does with them (first run)
Review images: `SPRITES=user/sword_blue_blade,user/dragon_green:winged OWN=1 npx vitest run -c vitest.tools.config.ts test/tools/landmarks.test.ts`
and `npx vitest run -c vitest.tools.config.ts test/tools/user-report.test.ts`.

- All 11 import losslessly with a usable rig and an exact rest pose; auto-rig takes 12–260 ms.
- **Facing**: every humanoid is proposed as facing right; most of the party faces left. Facing comes
  from the weapon side, and no weapon was found (below). Fix by hand: *Character faces → Left*.
- **Weapons**: not detected on these 3/4-view sprites (glowing blade, ornamented staff, greatsword
  over the shoulder, spear held across the body); the blades end up on an arm. Drag the *Weapon*
  bone along the blade and paint the blade onto it.
- **Ground shadows** (the dark ellipses under the party's feet) go to the legs and would move with
  them; paint them onto the pelvis or torso.
- **Robes and dresses**: legs placed by proportion (as designed).
- **Dragon and wolf**: the beast detector did not find legs (diagonal legs, spread claws, wings
  widening the silhouette), so both use template proportions; head, neck, wings and body land
  roughly right, legs and tails need fitting. The wraith (floating) and chronomancer come out
  closest to usable.
