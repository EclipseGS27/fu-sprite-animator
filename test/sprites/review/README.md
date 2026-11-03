# Optional local detector review corpus

The project owner supplied eleven PNGs for detector debugging in November 2026.
The images are private test inputs and are not included in this repository. To run
`test/unit/detector-regression.test.ts`, place local copies here with these names:

| Test filename | Uploaded filename |
| --- | --- |
| cloud.png | cloud-ff7-battle-stance-v0-q4xkqpeqv38c1-removebg-preview.png |
| barret.png | Gemini_Generated_Image_tpzhrutpzhrutpzh-removebg-preview.png |
| tifa.png | EbscJzgX0AA0Eae-removebg-preview.png |
| aerith.png | EakZVH0WAAY09Mx-removebg-preview.png |
| hero_sword.png | Hero 1.png |
| hero_mage.png | Hero 2.png |
| hero_ranger.png | Hero 3.png |
| golem.png | Golem.png |
| dragon.png | Dragon.png |
| wolf.png | Phantom Wolf.png |
| wraith.png | Wraith.png |

The suite skips automatically when the complete corpus is absent. These PNGs are
gitignored so local runs do not publish the uploaded artwork.

Only the specific Cloud landmark regions have visual location assertions. Pixel
fidelity tests on the other images verify preservation, not anatomical accuracy.
Templates are selected explicitly: wolf = quadruped, dragon = winged, wraith =
floating, others = humanoid. The detector does not infer creature type.
