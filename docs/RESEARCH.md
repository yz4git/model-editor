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

FLAME's official page reports FLAME 2023 Open under CC-BY-4.0 (November 2025). Earlier versions have different terms. No FLAME model files are bundled. MakeHuman licensing must distinguish application/base assets from exported models; see https://static.makehumancommunity.org/about/license.html . No third-party mesh assets are redistributed here.

## Data access and evidence

The MakeHuman base OBJ at `makehuman/data/3dobjs/base.obj` was requested through the GitHub connector. The full-resource fetch reported too-large/unsupported; a line-range request returned empty content. Direct public-host retrieval also failed to complete in the available network environment. Therefore this release does **not** claim to have fitted coefficients to that mesh, inspected its vertex statistics, or reproduced scan accuracy.

The implemented coefficients are authored anatomical approximations, not statistically estimated population parameters. OBJ import performs actual vertex-bound and 19-band cross-section measurements locally and exports the measured data. It does not automatically fit the editor's model. Bands include all vertices at a height, including arms; this is deliberately labeled as a bounding measurement rather than body circumference.

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

## Next steps requiring actual data

Download an openly licensed registered model (e.g. FLAME 2023 Open), retain attribution, align coordinates, fit section/feature coefficients or include its learned blend-shape basis, then quantify held-out surface/landmark error. This is required before claiming high-fidelity human reproduction. Add hand-specific basis and retopology/rigging after geometric validation.
