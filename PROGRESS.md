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

## Side image update
- [x] Face and body side modes, profile points, mask-derived depth estimates and manual correction.
- [x] Three independent body-depth parameters, nose fitting and side-view application.
- [x] Synthetic recovery, mirrored input and frontal-shape preservation checks.
- [ ] Real profile detector / iPhone verification.

- [x] Added seven independent facial refinements in both generators; existing JSON settings remain compatible.

- [x] Added image-derived contour fallback for complete side portraits with hair occlusion.
- [x] Actual uploaded-image and mirrored-image detector checks pass; forehead is marked inferred and requires confirmation.

## Expanded profile controls

Side-face fitting now adjusts five controls from six editable landmarks: nose, chinProjection, foreheadDepth, chinLength and the new mouthProjection. There are 13 facial / 23 total controls. Synthetic non-neutral projections recover all five within 0.02 slider units and remain invariant under mirroring (numerical tolerance 1e-8). Forehead remains inferred and confirmation is required. Browser/iPhone operation has not been verified.

## 2026-09-12 — Character Studio 0.3

Implemented the reference workflow as local character tools: part visibility, procedural hair, reference overlay/four-view comparison, three real morph targets with fitted eyelid geometry, 17-joint skinning, joint tests, 3-second Greeting/FaceStudy, material controls, PNG/posed OBJ/rigged GLB and settings v2 migration. Shape and photo-fitting behavior is preserved. Tripo/Blender service integration is not present. Automated geometry/export checks and software-rasterized shape inspection completed; browser/iPhone and Blender import QA remain unverified. See docs/CHARACTER_STUDIO.md for exact scope.

## 2026-09-12 — Detailed face editor 0.4

Expanded 13 to 66 facial shape controls across outline/forehead, brows, eyes, nose, cheeks, mouth, jaw/chin and ears (76 total including body). Added shared anatomical deformation fields, skin-projected brows, per-region selection/reset, face gesture undo and nudge buttons. Body presets preserve facial work. All 66 min/max endpoint checks, neutral coordinate comparison, legacy settings, one-sided squint, existing photo/profile tests and rigged GLB checks pass. Mixed edits were inspected through software geometry rasterization; no browser/iPhone or Blender import QA was performed. See docs/FACE_EDITOR.md.
