# Epic Battle assets — licensing

All image assets in this folder were **authored in-repo for Quizmaster** and are
released into the public domain under **[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)**.
No third-party or copyrighted artwork is used here.

| File            | Description                                              | Source        | License |
| --------------- | -------------------------------------------------------- | ------------- | ------- |
| `legionary.svg` | Roman legionary sprite (neutral palette, facing right)   | Original work | CC0 1.0 |
| `scutum.svg`    | Curved legionary shield, grayscale (tinted per team)     | Original work | CC0 1.0 |
| `crest.svg`     | Horsehair helmet crest, grayscale (tinted per team)      | Original work | CC0 1.0 |
| `spark.svg`     | Clash-line impact burst                                  | Original work | CC0 1.0 |
| `pilum.svg`     | Flying pilum projectile                                  | Original work | CC0 1.0 |

The parallax battlefield (sky, sun, hills, ground), dust puffs, and impact flashes
are drawn procedurally with PixiJS `Graphics` in
`frontend/src/make/quiz/epic-battle/battle-scene.ts` — no image files involved.

The waving army standards on the Epic Battle page are inline SVG rendered directly
in `epic-battle-arena.tsx`, coloured per team.
