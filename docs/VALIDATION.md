# Validation — 2026-09-10

## Passed
- JavaScript syntax checks for renderer, both generators and worker.
- Independent analytic full body: 41,252 triangles at standard density; finite coordinates/normals and OBJ export.
- Analytic close-up: 127,662 triangles at standard density; finite coordinates/normals and OBJ export.
- Asset-derived body: 27,036 triangles, requested 1.72m produces sampled height 1.7200000286m (Float32 precision).
- All 12 controls cause measurable geometry changes in asset-derived mode.
- Invalid/non-finite and out-of-range settings are sanitized.
- Generated OBJ meshes rendered offline for visual inspection; face detail and whole-body shape checked.
- Improved analytic normals from triangle gradients to cached vertex gradients; corrected wireframe to include all triangle edges.

## Limits
- Full browser automation could not start because the available Playwright installation has no browser binary. No claim of Safari or end-to-end browser verification.
- Offline renders verify mesh geometry, not the exact WebGL UI/material rendering.
- No held-out scan reconstruction, anatomical measurement accuracy, deformation self-intersection or rig/animation suitability guarantee.
- Face exports intentionally crop at the lower neck and are open at that boundary.
- MakeHuman is one reference shape. Authored deformation fields do not constitute a statistically learned population model.

## Photo fitting validation

- Synthetic face/body projections recover known in-range parameters within 0.012 slider units, with mean ratio residual below 0.2%. These are synthetic solver checks, not real-photo accuracy measurements.
- Scale, translation and in-plane rotation leave fitted parameters unchanged in those fixtures.
- Non-square image coordinate conversion, unrelated-parameter preservation, open-mouth lip exclusion, rejection of zero/multiple/low-visibility detections and center-connected silhouette isolation pass.
- Existing mesh/export and all-control sensitivity checks pass after sharing the forward deformer.
- Detector integration follows the official MediaPipe Web APIs; live remote model loading and automatic detection in iPhone Safari are not verified in this environment. CDN requests could not be inspected through the available web-fetch service. Manual image landmark placement uses bundled code and data.

## Side-image update
- Side projection fitting and mirrored profiles pass for nose, chest, waist and pelvis depth.
- Verified exact preservation of measured-model X/Y coordinates under side-only parameter edits.
- Existing frontal fitting and mesh-generation tests pass.
- Real-photo profile detection and iPhone interaction remain unverified.

## Expanded facial controls
- Seven added controls increase facial controls to 12 and total controls to 22.
- All 22 measured-model controls pass geometry sensitivity checks; existing neutral coordinates and export topology stay stable.
- New fields default to 1 when absent from old saved settings. Both independent implicit and measured generators consume them.

## Profile contour regression
- The supplied JPEG was decoded locally, reduced to 512px, and passed through the actual JavaScript detector. Nose-root, tip and chin candidate overlays were visually inspected.
- The horizontally mirrored image produces exactly mirrored points. Blank and undersized inputs are rejected.
- Forehead remains an inferred point requiring confirmation. Real-browser/iPhone interaction remains unverified.

## Expanded profile controls

Side-face fitting now adjusts five controls from six editable landmarks: nose, chinProjection, foreheadDepth, chinLength and the new mouthProjection. There are 13 facial / 23 total controls. Synthetic non-neutral projections recover all five within 0.02 slider units and remain invariant under mirroring (numerical tolerance 1e-8). Forehead remains inferred and confirmation is required. Browser/iPhone operation has not been verified.

## 2026-09-12 — Character Studio 0.3

Implemented the reference workflow as local character tools: part visibility, procedural hair, reference overlay/four-view comparison, three real morph targets with fitted eyelid geometry, 17-joint skinning, joint tests, 3-second Greeting/FaceStudy, material controls, PNG/posed OBJ/rigged GLB and settings v2 migration. Shape and photo-fitting behavior is preserved. Tripo/Blender service integration is not present. Automated geometry/export checks and software-rasterized shape inspection completed; browser/iPhone and Blender import QA remain unverified. See docs/CHARACTER_STUDIO.md for exact scope.

## 2026-09-12 — Detailed face editor 0.4

Expanded 13 to 66 facial shape controls across outline/forehead, brows, eyes, nose, cheeks, mouth, jaw/chin and ears (76 total including body). Added shared anatomical deformation fields, skin-projected brows, per-region selection/reset, face gesture undo and nudge buttons. Body presets preserve facial work. All 66 min/max endpoint checks, neutral coordinate comparison, legacy settings, one-sided squint, existing photo/profile tests and rigged GLB checks pass. Mixed edits were inspected through software geometry rasterization; no browser/iPhone or Blender import QA was performed. See docs/FACE_EDITOR.md.


## 2026-09-13 — Eye and static-hair materials 0.5

- Fitted textured eyes, wet lid rims, tear ducts, curved blink-following lashes and alpha-tested brows.
- Layered scalp/flattened hair locks/cards with swept bangs, crown-to-tie guides, feathered edges and wisps. Added part, spread, flyaway and shine controls; eye color, iris/pupil size, wetness, lash length/density.
- Four local procedural PNG textures embedded in GLB with UVs, normal maps, alpha masks and optional KHR_materials_anisotropy. Expression NORMAL deltas now accompany POSITION deltas. Settings v3 loads v1/v2.
- Relevant checks passed: check-materials, check-studio and check-face-detail. Embedded PNGs independently decoded and pixel-compared; packed preview UV/morph attributes, fallback paths, normalized weights, animation dimensions and closed lid seam (within 1 micrometre) checked.
- Actual GLSL compiled/rendered with Mesa/EGL across six views; fixed derivative precision, hair lighting arithmetic, disappearing brows and crown fit. No browser UI test was performed. iPhone Safari performance and game-engine/Blender imports remain unverified.
- Standard default: 84,436 triangles, 49,376 vertices, 10 parts, 17 joints, 4 embedded PNGs, GLB 10,034,828 bytes. Counts vary with style and lash settings.
- Remaining production work: authored hairstyle polish, scalp/skin texture detail, LODs and engine-specific lighting/deformation verification. Corneal refraction, skin subsurface scattering and hair physics are not included.
