# Character Studio 0.6

FORM edits a MakeHuman CC0 body/face basis locally, adds authored eye and hair components, and exports a textured, rigged GLB. The [Tripo workflow](https://www.tripo3d.ai/blog/gpt-6-astra-3d-character-workflow) informed component inspection and assembly. The editor does not call Tripo, Blender or an image-generation service at runtime. Generated art is bundled with the site; uploaded reference photographs are not bundled or uploaded.

## Workflow

- Shape: 66 face and 10 body controls; existing frontal/profile fitting. The new **ポートレート顔を読み込む** button applies a manually composed face preset with face undo. It preserves body and studio settings.
- Hair / comparison: none, short, bob and ponytail; part, volume, length, fringe, spread, flyaways and shine; part visibility, reference overlay and four views.
- Face / motion: Blink, Smile and MouthOpen morphs, 17-joint pose inspection, Greeting and FaceStudy clips. Hair is rigidly attached to the head, prioritizing its static appearance.
- Finish: iris color/size, pupil size, wetness, lash length/density, skin/hair colors, roughness, PNG comparison, posed OBJ and rigged GLB. Settings v3 continues to load v1/v2.

## Eyes

The original closed orbital cavities are removed from the rendered head. Each front boundary is retained in its original edge order and connected to an annular lid mesh. Cubic interpolation matches the outer skin tangent; the inner plate wraps around the eye and covers the corneal bulge when closed. The outer boundary remains coincident with the head. The template has separate wet margins, small tear ducts and fine curved lash ribbons. Lash direction changes with blink, rather than translating a comb-shaped strip.

The iris comes from newly generated flat color artwork. UV radius is remapped independently for iris and pupil controls; sclera is composed around it. The eye material uses a corneal surface bulge and optional glTF clear coat. It does not implement true corneal refraction or an engine-specific multilayer eye shader.

## Hair

Hair uses layered curved cards with a continuous frame along each guide, an undercoat below them and a compact wrapped tie. Separate guide families describe swept fringe, crown, temple/nape-to-tie sweeps, staggered ponytail clumps and loose strands. Exposed equal-radius tubes from 0.5 are removed. The refined atlas contains four densities of individual strands, irregular tips and real alpha; its luminance drives a corresponding micro-normal map.

The guide families remain an editable procedural approximation of an authored hairstyle. They are not a groom reconstructed from the photograph. Close-up silhouette polish, more styles, scalp skin detail and LODs remain production work.

## Assets and rendering

Two 1024×1024 source PNGs are checked in under `dist/assets`: generated iris artwork and refined hair strands. The image prompts and provenance are in `docs/assets`. These images were generated for this update; the user's reference JPEG is not part of the repository.

The worker loads the source artwork once and caches static hair maps between edits. It creates four export maps: iris/sclera 512×512, strand color/alpha 1024×1024, strand normals 1024×1024, and undercoat color 256×512. Geometry arrays transfer to the main thread; cached texture pixels stay in the worker. No external CDN is needed for this material workflow. Optional MediaPipe detection retains its existing external model download.

The WebGL 1 preview retains eight vertex attributes and 17 bone matrices. It adds analytic rectangular studio reflections and an alpha-aware 1024px shadow map with 3×3 filtering, alongside the existing GGX lighting and anisotropic hair response. Shadow bias follows the camera's shadow scale. Fragment precision/derivative limitations retain a simpler material path, and incomplete shadow framebuffers disable shadows. This is a custom approximation, not a physically complete engine renderer or measured HDR environment.

## Export

GLB is glTF 2.0, Y-up metres, with indexed geometry, vertex colors, UVs, explicit tangent handedness, normal maps, alpha masks, embedded PNGs, normalized skin weights and inverse bind matrices. Three POSITION morphs accompany NORMAL deltas on moving parts. The current manual pose/expression is the default; two independent 3-second clips are included. Hidden parts are still exported. Hair uses optional `KHR_materials_anisotropy`; eyes use optional `KHR_materials_clearcoat`. Standard metallic-roughness materials remain available to importers that ignore those extensions. Studio lights and preview shadows are not baked into the model; a receiving game must provide lighting.

Default ponytail: **140,380 triangles, 84,522 vertices, 10 parts**, 17 joints and 4 embedded maps; GLB **21,691,988 bytes** with the neutral defaults. Counts vary with style and controls. PNG encoding is lossless but uncompressed DEFLATE; downstream texture compression and LOD generation are not supplied. OBJ exports only the current posed geometry.

## Validation and remaining scope

Related checks cover finite geometry and weights, bind pose, clips, all 66 face-control endpoints, PNG round-trip pixel agreement, GLB map/material/tangent associations, fallback packing and closed-lid occlusion after coupled face edits. The actual shader pair and alpha-aware shadow pass were compiled and rendered using Mesa/EGL in front, profile, closed-eye, back, three-quarter and full-body views. This is an independent renderer check, not a browser UI or iPhone test.

No browser/iPhone performance test or third-party game-engine import was performed. The model is an improved editable/exportable foundation; commercial-game character quality is not established. Skin UV/normal/roughness authoring, subsurface scattering, additional hairstyle authoring, optimized LODs, finger rigging and target-engine deformation/material review remain outstanding.
