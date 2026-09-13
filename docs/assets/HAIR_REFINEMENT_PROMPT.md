# Hair atlas refinement

Mode: built-in imagegen

## Initial edit prompt

Use case: precise-object-edit
Asset type: 1024 x 1024 square RGBA game hair-card UV atlas, material albedo and opacity asset.
Input image 1 is the edit target and a reference for the four-column atlas layout ONLY.
Primary request: replace the four broad dense gray wig-like shapes with four vertical islands of clearly separated, individual, fine, straight hair filaments. Keep the four equally spaced columns side-by-side. Each island occupies its own quarter of the atlas and never crosses a column boundary. Roots are at the top, loose irregular pointed tips at the bottom.
Transparency: genuine clean alpha transparency everywhere outside the individual hairs, including the many long gaps BETWEEN hairs inside each column. Left to right, approximately 25%, 40%, 60%, and 80% of each column interior should be fully transparent. This means the fourth island is mostly empty space with a modest number of sparse, separately visible filaments; the first island is dense but still visibly pierced by many thin transparent channels. Do not fake transparency with black, white, checkerboard, or colored pixels.
Filaments: hundreds of very thin mostly parallel vertical strands, each varying naturally in width and length, each ending as a distinct fine tapered point. Tips end at varied vertical positions over the final quarter of the image. A few fine flyaways are acceptable but keep almost all hairs straight. Some neighboring strands can touch, but never merge into broad solid ribbons or clumps.
Color palette: neutral grayscale only, high contrast dark-gray and light-gray strand-level albedo detail, no color tint. Crisp filament texture, no directional illumination or broad highlights and shadows.
Composition: full flat orthographic material texture, about 3% top and bottom margins and small gutters between all four islands. Every strand attaches at the top root region and points down. No text, labels, frame, watermark, skin, head, scalp, hairbrush, scene, or cast shadow.
Avoid: opaque rounded wigs, thick smooth clumps, smooth soft illumination, blurred edges, solid rectangular backplates, baked backgrounds, broad or rounded ends.

## Alpha correction prompt

Use case: background-extraction
Asset type: game hair-card atlas requiring actual PNG RGBA alpha transparency.
Input image 1 is the exact edit target. Remove only the black background and black gaps between the hairs, making those pixels genuinely TRANSPARENT with alpha 0. Keep all four islands of gray individual fine hair filaments, their shape, their density gradient, their positions, their fine pointed ends, and all grayscale strand details unchanged. Preserve semitransparent antialiasing around each hair. Output a true transparent PNG with an alpha channel, not an image of transparency. No black background, no white background, no checkerboard painted into the image. This is a texture used on game cards: the scene must be visible through the spaces between strands. Do not add any content, text, shadow, backdrop, or border.

