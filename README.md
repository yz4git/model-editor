# FORM — Human Model Editor

A mobile-first, dependency-free WebGL editor that extracts human body and face meshes from an explicit anatomical implicit field.

- 12 shape parameters, 3 presets, body/face close-up, front/side/back views
- Orbit/pinch/zoom controls; settings autosave, JSON import/export
- OBJ mesh export with position welding
- Local OBJ cross-section analysis and JSON measurement export
- Web Worker generation; no CDN or runtime network dependency

Run `npm start`, open http://localhost:4173 . Run `npm test` for geometry/export checks.

See [research and equations](docs/RESEARCH.md). v0.2 provides both a MakeHuman CC0 template with joint-anchored mathematical deformation and an independent implicit surface model. One actual reference mesh is analyzed; population fitting and measured reconstruction accuracy are not complete.
