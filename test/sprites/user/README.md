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

## What the automatic rig does with them
Review images: `SPRITES=user/sword_blue_blade,user/dragon_green:winged OWN=1 npx vitest run -c vitest.tools.config.ts test/tools/landmarks.test.ts`,
`npx vitest run -c vitest.tools.config.ts test/tools/user-report.test.ts`, and for weapons
`OUT=<dir>/ npx vitest run -c vitest.tools.config.ts test/tools/weapon-debug.test.ts`.

**First run** (before tuning on these sprites): no weapon found on any party sprite, so all were
proposed facing right; ground shadows went to the legs; no legs found on the real dragon and wolf.

**After tuning** (2026-11-02, checked by `test/unit/user-sprites.test.ts`):
- All 11 import losslessly with a usable rig and an exact rest pose.
- **Weapons**: the glowing blade, the greatsword and the spear are found (the spear from its head
  to the hand; the part crossing the body stays with the arms). No weapon is invented on the
  brawler, the dress mage or the thief. Not found yet: the summoner's ringed staff and the
  chronomancer's staff (both cross the body with ornaments at the top).
- **Facing**: from the weapon when there is one — right for the blade and spear users (left).
  The greatsword user is proposed facing right (his blade hangs on his right) though he faces left.
  Without a weapon, the Studio uses the facing you chose last, says it is a guess, and the
  proposal banner has a one-click *← Left / Right →* that rebuilds the skeleton facing that way.
- **Ground shadows** are found under the six party sprites that have one and get their own
  *Shadow* part on the root, so they stay on the floor instead of moving with the legs.
- **Dragon and wolf**: legs are now found where the legs separate below the body (feet at
  different heights, slanted legs); both face right. The dragon's near and far wings, head,
  neck and curled tail land on the right areas; the wolf gets head, body, four legs and tail.
- Robes and dresses: legs placed by proportion (as designed).
