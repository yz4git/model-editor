# Face editor 0.4

The shape editor now offers **66 facial controls across eight regions**, up from 13. Together with the 10 body controls, there are 76 shape parameters. This is an independent parametric implementation inspired by the granularity of [Dragon's Dogma 2 character editing examples](https://steamcommunity.com/sharedfiles/filedetails/?id=3186965498), inspected 2026-09-12. It does not use Capcom's assets or formulas and does not promise identical ranges or visual quality.

| Region | Controls | Examples |
| --- | ---: | --- |
| Outline / forehead | 8 | Head length/depth, facial feature height, temples, forehead height/slope |
| Brows | 8 | Height, spacing, bone projection, inner/outer depth, angle, arch, thickness |
| Eyes | 10 | Spacing, size, height/depth, tilt, width, upper/lower lids, independent left/right narrowing |
| Nose | 11 | Projection/width, length, bridge width/height/bump, tip size/angle, alar width/height/size |
| Cheeks | 5 | Volume, cheekbone height/width/depth, hollowing |
| Mouth | 10 | Total/upper/lower lip thickness, width/projection, height, corners, lower lip position, Cupid's bow, philtrum length |
| Jaw / chin | 8 | Jaw width/height/depth/angle, chin length/projection/width/cleft |
| Ears | 6 | Size, height, angle, flare, pointed tips, lobes |

## Editing

The initial camera opens on the face. Choose a region to show its controls, and use the slider or ± buttons (0.005 increments). All face values use 1.000 as neutral. Reset affects only the selected region; the face undo button restores the preceding face gesture or reset while retaining body changes. Body presets preserve the full face configuration. Existing front/side/back/four-view controls and reference overlays remain available.

## Geometry and compatibility

The 53 new local displacement fields act on real coordinates. The measured face, eyes, procedural lids, brows, hair, facial morph targets and joint anchors share that mapping. A separate skin-projected brow mesh makes brow editing visible. The implicit generator also receives the extended fields through an anatomical coordinate mapping and recomputes averaged normals; it represents the brow region as surface shape without the separate colored brow mesh.

Existing body/face template coordinates at neutral values match the previous version within 1e-8. Older version 1/2 settings default new controls to 1 and keep the existing fields. New controls round-trip through the existing version 2 settings format. Image fitting continues to adjust its designated calibrated controls and preserves other manual fields; it does not automatically infer all 66 controls. GLB and OBJ capture the expanded geometry, and the existing rig and three expression targets remain available in measured mode.

These are bounded local sculpting approximations. Strong combinations can produce unnatural facial proportions or self-intersections, especially around lips and eyelids. There is no collision-aware facial solver, scan reconstruction guarantee, game-specific slider conversion, makeup system or wrinkle texture generator.

## Checks

- Both endpoints of every facial control produce finite, unchanged-count measured geometry and an actual position change.
- Local displacement fields leave torso sample coordinates unchanged. Head-length normalization can change overall proportions while retaining the selected total height.
- Left-only eye narrowing does not change the corresponding right-side displacement.
- Region reset preserves other face groups and body settings; legacy sanitization uses neutral additions.
- Mixed edits retain finite eye/lid/brow/hair geometry, expression deltas, and valid GLB structure.
- Existing geometry, photo fitting, profile fitting and studio export checks pass.
- Neutral coordinates were compared with the previous implementation; mixed facial edits were inspected using software rasterization. No browser/iPhone interaction or external Blender import was run in this environment.
