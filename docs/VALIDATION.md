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
