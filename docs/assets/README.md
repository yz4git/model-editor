# Eye and hair source art

Created for FORM 0.6 using the built-in image generation tool. Exact generation and refinement prompts are recorded alongside this file. The initial hair attempt was reviewed, then regenerated/refined to add gaps between individual strands and pointed ends.

- `dist/assets/iris.png`: generated gray-green/hazel iris, a dark circular pupil, radial fibers and no painted reflection; runtime tint and UV remapping provide editability.
- `dist/assets/hair-atlas.png`: four grayscale strand islands, roots above and irregular tips below, with genuine RGBA transparency. Coverage decreases from left to right. Runtime shading neutralizes residual colored edge pixels and applies the chosen hair color.

Generated originals were 1254×1254; the bundled versions are 1024×1024 PNGs for power-of-two mipmaps on WebGL 1. Resize/PNG encoding used Sharp. Hair normals and the undercoat map derive numerically from the bundled color/alpha source, in the material code. Normal-map channels are linear data. Color pixels are decoded as sRGB in the renderer.

The privately supplied portrait was used for visual direction only and is not included. No third-party game textures or meshes were copied into these assets. Base body provenance remains MakeHuman CC0 as recorded in the existing model research documents.
