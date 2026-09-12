# FORM — Character Studio

A mobile-first, dependency-free WebGL editor with two mathematical generators: a measured MakeHuman CC0 template with local shape fields, and an independent anatomical implicit surface.

- Photo-to-model: automatic face/body landmarks, editable image points, calibrated parameter fitting, apply and undo
- 76 shape parameters (66 face / 10 body), 3 presets, body/face close-up, front/side/back views
- Orbit/pinch/zoom controls; settings autosave, JSON import/export
- OBJ mesh export with position welding
- Local OBJ cross-section analysis and JSON measurement export
- Web Worker generation; core generation has no CDN dependency; optional photo detection downloads MediaPipe assets

Run `npm start`, open http://localhost:4173 . Run `npm test` for geometry/export checks.

See [research and equations](docs/RESEARCH.md), [measurements](docs/base-analysis.json), [validation](docs/VALIDATION.md), and [asset provenance](THIRD_PARTY.md). v0.2 provides both a MakeHuman CC0 template with joint-anchored mathematical deformation and an independent implicit surface model. One actual reference mesh is analyzed; population fitting and measured reconstruction accuracy are not complete.

See [photo fitting](docs/PHOTO_FITTING.md) for supported measurements, local image processing, and limitations.

Side images: select 顔・側面 for nose/forehead/chin/mouth projection and chin length, or 体・側面 for chest/waist/pelvis depth. Front widths remain unchanged. Both left-facing and right-facing photos work; automatic landmark suggestions can be manually corrected.

Expanded face controls: nose width, eye size, mouth width, cheek volume, chin length, chin projection and forehead depth. Both generators support these controls; legacy settings default them to neutral. Image fitting adjusts only its designated parameters and preserves these manual refinements.


## Character Studio 0.3

Adds separate body/head/hair inspection, four hair styles (including none), reference overlays and four-view comparison, real facial morphs and eyelids, a 17-joint rig with four pose controls, Greeting/FaceStudy clips, shared materials, and rigged animated GLB export. No Tripo account or Blender connection is used. See [workflow and limits](docs/CHARACTER_STUDIO.md).


## Detailed face editor 0.4

66 facial controls in eight selectable regions, per-region reset, face undo, 0.005 nudge buttons and separate brow geometry. Body presets preserve facial edits; prior settings remain compatible. Measured and implicit generators support the additional deformation fields. See [controls and validation](docs/FACE_EDITOR.md).
