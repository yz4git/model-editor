# Progress — 2026-09-10

- [x] Save goals before implementation.
- [x] Survey primary body/face model sources; document access limits.
- [x] Implement shape-preserving profiles, facial feature displacement and implicit unions.
- [x] Extract triangles from the field in a Web Worker.
- [x] Implement mobile WebGL editing and OBJ/settings export.
- [x] Save functional initial implementation on main before detailed checks.
- [x] Add local OBJ section measurement utility.
- [x] Retrieved MakeHuman mesh by blob SHA after full-resource fetch failed; measured body topology, joint centroids and 19 section bands.
- [x] Added template-based mathematical generation with measured joint anchors.
- [ ] Statistical shape basis / measured reconstruction accuracy.

This release analyzes one real reference mesh and surveys multiple research model families. Statistical population fitting and held-out reconstruction accuracy remain future work. See docs/RESEARCH.md for exact boundaries.

- [x] Finite geometry/export tests, parameter sensitivity and height checks pass; offline mesh renders inspected.
- [ ] iPhone Safari device verification (browser binary unavailable here).

## Photo fitting update
- [x] Added local automatic face/body detection and manual editable image landmarks.
- [x] Reused the exact forward deformation field for inverse ratio fitting.
- [x] Added estimate table, group-preserving apply, known-height input and undo.
- [x] Added stale-result cancellation, inference timeout and manual fallback.
- [x] Synthetic inverse-fitting, image-ratio invariance, failure-input and regression checks pass.
- [ ] Real-photo detector and iPhone Safari end-to-end validation remain unverified.
