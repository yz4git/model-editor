# Texture generation prompts

Built-in image_gen used, one independent call per asset.

## iris-hazel-gray-green.png

Use case: photorealistic-natural.
Asset type: production 3D character eye BASE COLOR texture, square high resolution 2048 x 2048 if possible.
Primary request: An ultra-detailed realistic hazel and gray-green human iris, a single complete iris disk centered exactly in the image, perfectly circular. A pure black centered pupil has diameter 30% of the iris diameter. The outer diameter of the entire iris is exactly 90% of the square image width. Outside the iris is uniform pure off-white.
Style/medium: photographic scan fidelity, flat albedo texture. Intricate nonuniform radial stromal fibers, delicate branching fibers, crypts, complex granular irregular pigmentation, a subtle warm hazel collarette around the pupil, cool desaturated gray-green peripheral iris, a darker irregular limbal ring. Real organic variation in the radial structure.
Composition/framing: strict front orthographic scan, no perspective, no eyeball shape, no lens distortion; texture fills square with 5% uniform margins.
Lighting: perfectly even diffuse albedo without ANY directional illumination, shine, gloss, highlight, glint, reflection or cast shadow. Color information only.
Constraints: single isolated iris disk, no eye whites within disk, no eyelids, no lashes, no face, no eyeball render, no labels or typography, no UI, no 3D mockup, no watermark. The black pupil is a clean circular hole without highlights. Preserve fine high frequency photographic tissue detail.

## hair-cards-pale-gray.png

Use case: photorealistic-natural.
Asset type: production 3D hair-card base color and alpha texture atlas; square high resolution 2048 x 2048 if possible, with a TRUE transparent RGBA background.
Primary request: FOUR equal vertical columns of separate long hair locks made of many individually distinguishable pale neutral gray strands. No borders, no labels, no grid. Actual alpha transparency in every gap and all empty background; do NOT draw a checkerboard, gray background or solid background.
Composition: Each column spans one quarter of image width, with safe transparent gutters around each lock and between columns. Hair roots begin near the top edge, long separate strands run down the column, tapered tips end above the bottom border. All hair stays within its own column. From left to right: dense lock, medium density lock, fine sparse lock, and airy loose wisps. Keep a tall narrow lock in each column. Roots at top, tips at bottom; almost straight to gently curved root-to-tip flow. Variable strand lengths and extremely fine tapered individual tips with organic slight asymmetry.
Style/medium: very high fidelity hair texture scan, crisp fine strand separation, suitable for realistic 3D game hair cards. Flat neutral light-gray diffuse albedo; all strands have broadly consistent color with natural mild variations.
Lighting: completely even albedo only, NO specular streaks, NO shine, NO directional shading, NO cast shadows. Texture atlas only.
Constraints: genuine transparency, never simulated transparency. Four hair clusters only, no heads, no rendered characters, no cards as physical objects, no typography, no UI, no mockup, no watermark. Preserve fine semitransparent antialiased strand edges and abundant individual strands.

