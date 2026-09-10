# FORM — Human Model Editor

A mobile-first, dependency-free WebGL editor with two mathematical generators: a measured MakeHuman CC0 template with local shape fields, and an independent anatomical implicit surface.

- Photo-to-model: automatic face/body landmarks, editable image points, calibrated parameter fitting, apply and undo
- 22 shape parameters, 3 presets, body/face close-up, front/side/back views
- Orbit/pinch/zoom controls; settings autosave, JSON import/export
- OBJ mesh export with position welding
- Local OBJ cross-section analysis and JSON measurement export
- Web Worker generation; core generation has no CDN dependency; optional photo detection downloads MediaPipe assets

Run `npm start`, open http://localhost:4173 . Run `npm test` for geometry/export checks.

See [research and equations](docs/RESEARCH.md), [measurements](docs/base-analysis.json), [validation](docs/VALIDATION.md), and [asset provenance](THIRD_PARTY.md). v0.2 provides both a MakeHuman CC0 template with joint-anchored mathematical deformation and an independent implicit surface model. One actual reference mesh is analyzed; population fitting and measured reconstruction accuracy are not complete.

See [photo fitting](docs/PHOTO_FITTING.md) for supported measurements, local image processing, and limitations.

Side images: select 顔・側面 for nose projection, or 体・側面 for chest/waist/pelvis depth. Front widths remain unchanged. Both left-facing and right-facing photos work; automatic landmark suggestions can be manually corrected.

Expanded face controls: nose width, eye size, mouth width, cheek volume, chin length, chin projection and forehead depth. Both generators support these controls; legacy settings default them to neutral. Image fitting adjusts only its designated parameters and preserves these manual refinements.
