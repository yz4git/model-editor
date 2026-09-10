# Research and implementation boundaries — 2026-09-10

## Primary-source survey

| Model | Mathematical representation | Implication for this editor | Source |
|---|---|---|---|
| SMPL | Learned template + linear identity blend shapes + rotation-dependent pose correctives + skinning | Separate shape from pose; learned coefficients require actual registered scans | https://smpl.is.tue.mpg.de/ |
| SMPL-X | Unified body, articulated hands and face; learned from thousands of scans | Whole-body correspondence matters; the initial editor is a static shape tool | https://smpl-x.is.tue.mpg.de/ |
| FLAME | Linear identity/expression spaces with articulated jaw, eyes and neck | Identity controls should be separate from expressions | https://flame.is.tue.mpg.de/ |
| MakeHuman | Common base mesh and morph target interpolation | Common topology makes deltas reusable | https://static.makehumancommunity.org/ |
| STAR | Sparse local pose corrective blend shapes | Local support limits unintended distant deformation | https://star.is.tue.mpg.de/ |
| SUPR | Factorized body-part representation including foot contact deformation | Hands and feet need dedicated models | https://supr.is.tue.mpg.de/ |

Sources accessed during this work: SMPL, SMPL-X, FLAME and MakeHuman license page. STAR/SUPR descriptions are from the SMPL official model directory; their full papers were not analyzed in this version.

FLAME's official page reports FLAME 2023 Open under CC-BY-4.0 (November 2025). Earlier versions have different terms. No FLAME model files are bundled. MakeHuman licensing must distinguish application/base assets from exported models; see https://static.makehumancommunity.org/about/license.html . A reduced CC0 MakeHuman mesh is bundled with provenance in THIRD_PARTY.md.

## Data access and evidence

The first full-resource and line-range requests failed. A subsequent Git blob fetch succeeded for SHA `d26635e9326e3cca30778fd7b9c00062b03cce09`. Its embedded header explicitly dedicates the asset to CC0 (September 2020). The source has 19,158 vertices including helpers and joint markers. The body alone has 13,380 vertices and 13,378 quad faces. The bundled body + two eye helper surfaces retain 13,524 vertices and 13,518 source faces. Joint marker centroids and 19 normalized cross-section bands are measured in `base-analysis.json`.

The asset-derived mode evaluates `M(p) = normalizeHeight[V0 + Σ (p_k − p0_k) D_k(V0,J)]`, using the measured mesh V0 and joint centroids J. D are locally supported Gaussian/ smoothstep deformation fields for shoulder translation, waist/hip scaling, limb mass, head size, jaw width, eye separation, nose projection and lips. These fields are authored, **not learned from a population**. This is a template-based mathematical generator, distinct from the independent implicit-surface generator. It retains body and eye topology, excludes joint marker boxes and clothing helpers, and includes no rig or expressions.

The resulting data-derived body is not a claim to reconstruct arbitrary people. Cross-section measurements include lateral limbs and are bounding widths/depths, not circumferences. OBJ import measures external data locally; it does not automatically fit the model. Raw imported files are never sent to a server.

## Explicit equations implemented

For anatomical section knots `(y_i, r_xi, r_zi, c_zi)`, each radius/center is interpolated with cubic Hermite basis:

`q(t) = (2t³−3t²+1)q_i + (t³−2t²+t)h m_i + (−2t³+3t²)q_(i+1) + (t³−t²)h m_(i+1)`.

Interior slopes use the harmonic mean of adjacent same-sign secants and zero at extrema. End slopes are zero. This avoids spurious negative radii from unrestricted spline overshoot.

`F_section(x,y,z) = max((sqrt((x/r_x(y))² + ((z−c_z(y)−d(x,y))/r_z(y))²)−1) min(r_x,r_z), y_min−y, y−y_max)`.

This is an implicit field, **not an exact signed distance function**. Local facial displacement is a sum of compactly effective Gaussian features `d = Σ a_k exp(−((x−μ_xk)/σ_xk)²−((y−μ_yk)/σ_yk)²)` for nasal bridge/tip, orbit depressions, cheekbones, brows and lips. These are mapped only onto the anterior face.

Anatomical fields join with polynomial smooth minimum `smin(a,b,k)=min(a,b)−k max(k−|a−b|,0)²/(4k²)`. The final surface is `F(x,y,z;p)=0`, sampled on a regular lattice and extracted with six conforming tetrahedra per cell. Triangle winding follows the numerical field gradient. No sphere or box mesh primitives are assembled.

Meters are imposed by dividing requested height by the model's analytic upper bound. Sampled mesh extrema may differ by a fraction of a voxel. Arms/legs are profile fields; feet use longitudinal profiles. Fingers, ears, eyes and mouth are approximations. Eyes are surface coloration over orbit geometry, not separate eyeballs. No oral cavity, teeth, nails, rig, UV atlas, expression model, hair or texture is supplied.

## Resolution and topology

Body and face modes resample the same field over different bounds. Face export is a cropped head/neck surface and is open at the crop boundary. Marching tetrahedra produces triangulated isosurfaces; it is not animation-ready quad topology. OBJ export welds identical positions at 1 micrometer rounding and excludes collapsed faces. Small fingers can merge at low resolution. Normal vectors use cached per-vertex numerical field gradients for smooth shading.

## Remaining validation

Extend beyond the single acquired MakeHuman reference with an openly licensed registered facial model (e.g. FLAME 2023 Open), align coordinates, incorporate its learned shape basis and quantify held-out surface/landmark error. This is required before claiming high-fidelity human reproduction. Add hand-specific basis and retopology/rigging after geometric validation.
