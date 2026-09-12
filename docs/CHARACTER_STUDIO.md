# Character Studio 0.3

Reference: [Tripo character workflow](https://www.tripo3d.ai/blog/gpt-6-astra-3d-character-workflow), accessed 2026-09-12. The implemented stages are component review, assembly inspection, rig deformation checks, facial controls, material consistency and a short animation. This implementation runs locally in the browser and does not call Tripo, Blender, or an AI generation service. It does not generate a textured likeness from an image or import third-party rigs.

## Workflow

1. Shape: existing 23 shape controls and front/side face/body fitting remain available. Image measurements keep their existing confirmation, residual and range-limit behavior.
2. Hair / comparison: show or hide body, head and hair; choose none, short, bob or ponytail and adjust volume, length and fringe. Overlay a local reference image, or use synchronized orthographic front/right/back/left views. The overlay is session-only, is not uploaded or included in settings, and is omitted from PNG exports.
3. Face / motion: actual Blink, Smile and MouthOpen vertex deltas, separate fitted lid surfaces, head turn, left arm raise, elbow bend, knee bend. The three-second Greeting and FaceStudy clips support play, pause and scrubbing. Playing a clip temporarily uses its own pose; stopping restores manual controls. Animation stops while the document is hidden.
4. Finish: shared skin color, independent hair color, roughness, preview PNG, assembled OBJ and GLB export. Version 2 settings contain shape, hair/material/expression and manual pose. Version 1 settings remain supported.

## Representation and limits

Body/head partition the original measured topology at the neck without moving the seam. Eyes, hair and lids remain separate meshes. Hair is procedural stylized geometry; it is not reconstructed from the photograph. The 17-joint rig follows the same normalized parameter deformation as the body. Analytical local weights blend up to four influences. Hair and eyelids follow the head. Fingers are attached to the hand, not individually rigged. There is no cloth simulation, automatic retopology, collision solver, UV texture generation or hair physics. Large poses can still show local weight artifacts; the controls are deformation studies, not a production rig certification.

The measured generator now retains the full character while the face view changes the camera. OBJ in face view exports the head-related parts. GLB always exports all parts, including temporarily hidden parts, plus the current manual pose/expression as its default and two independent clips. OBJ captures the current animation sample when an animation is selected. The implicit generator and its existing OBJ output are preserved; studio editing and rigged GLB require the measured generator.

## GLB implementation

Follows the [Khronos glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html): Y-up metres, component-aligned accessors, indexed primitives, normalized weights, inverse bind matrices, relative POSITION morph targets and quaternion/weight channels sampled at 24 fps. The preview uses the same rig hierarchy, rotations and morph deltas. Material colors are vertex colors with metallic=0 and adjustable roughness. Existing geometry normals are used during morphing; they are not high-quality expression-specific normal maps.

No external CDN is needed for the character studio. Optional MediaPipe photo detection retains its existing external model download. The WebGL vertex shader uses eight attributes and seventeen matrix uniforms. DPR is capped at 2; animation frames are requested only during playback or interaction.

## Validation

`check-studio.mjs` validates finite geometry, parts and indices, normalized weights, bind-pose identity, no foot drift in Greeting, real expression deltas, source proportion changes, and GLB headers, offsets and animation dimensions. Original model and photo-fitting checks also pass. Independent software rasterization of neutral, closed-eye, greeting, side and back geometry was inspected to refine scalp/eyelid alignment. This was a geometry inspection, not a browser screenshot. Browser/iPhone interaction and opening the GLB in Blender have not been verified in this environment.
