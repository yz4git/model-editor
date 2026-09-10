# Photo-to-parameter fitting

## Workflow

Open **画像からモデルを作る**, choose frontal face or full-body mode, and select an image. Automatic detection runs locally in a classic Web Worker using MediaPipe Tasks Vision 0.10.14. Model/runtime assets are downloaded from jsDelivr and Google's model bucket on demand; the photo is never posted to an external service or stored in localStorage. Model parameters retain the existing autosave behavior.

Detected points are editable on the image by drag, point-selection + tap, or arrow keys. If detection is unavailable, manual guide points require explicit position confirmation before calculation. Guides are labeled as unverified and are never treated as detected features. Results list current and fitted values; **モデルに反映** applies only the fitted group and switches to the measured data model. A one-step undo restores the pre-application model state. Face and body photos may be applied sequentially.

## Model and fitting

The forward field in `data-model.js` is shared by rendering and fitting through `deformPoint`. Reproducible reference anchors use source joint centers and nearest measured surface vertices. Face metrics are cheek width / forehead-to-chin length, jaw width / face length, eye separation / face length, and central lip outer height / mouth width. Body metrics are shoulder separation / shoulder-to-hip distance, waist and pelvis silhouette width / that distance, and mean hip-knee-ankle path length / that distance.

Photo landmark coordinates are converted to pixel units before distance calculations, avoiding aspect-ratio bias. Scale and translation cancel in the ratios. In-plane rotation is handled by Euclidean distances and a body-aligned silhouette scan. A bounded coordinate-descent solver minimizes the sum of squared log-ratio errors using the actual deformation field. No confidence percentage or population accuracy claim is assigned to the optimizer residual.

Face fitting adjusts `faceWidth`, `jaw`, `eyes`, `lips`. Body fitting adjusts `shoulders`, `waist`, `hips`, `legs`. Optional known height is accepted in the existing 145–205 cm range. Other parameters and the other shape group are preserved. Nose depth, muscle amount and global head size are not fitted from frontal measurements. Side mode fits nose projection separately; muscle amount and global head size remain unchanged. Open-mouth face detections retain lip thickness by default.

## Detection safeguards and limitations

- Reject zero/multiple detections and insufficient body visibility; strong side views are rejected.
- Estimate waist/pelvis contour from the center-connected segmentation mask, not shoulder/hip skeletal distances.
- Segmentation may include clothing or touching arms. The points must be inspected; a human-shaped photo is not a body scan.
- Side-view depth, perspective distortion, occlusion, hair and expression are not reconstructed. These are static shape estimates, not identity-perfect avatars.
- Parameter limits and ratio residuals are displayed, including a prominent note for large mismatch.
- Loading is cancelable by mode/image changes or closing; stale results are discarded. Inference has a 90-second timeout and manual mode remains available.
- Images are resized to at most 1600px on the longest edge. Decoding uses the browser's image orientation support, with manual 90-degree rotation. Unsupported HEIC images need conversion to JPEG/PNG/WebP.
- Detection requires browser support for Worker, OffscreenCanvas and ImageBitmap, and first-load network access to the external runtime/model hosts. Manual measurement and model fitting use only bundled code/data.

## Primary API references

- https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
- https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js
- https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
- https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker

Runtime: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs`
WASM root: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm`
Face model: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`
Pose model: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`

## Side images

Select `faceSide` (顔・側面) or `bodySide` (体・側面). Both horizontal orientations are supported by absolute projected distances. The reference model is projected onto its Z/Y plane, rather than the frontal X/Y plane. Side application opens the 3D side view.

- Face: forehead/chin provide scale and in-plane vertical direction. Nose-root to tip distance perpendicular to that direction fits the existing nose parameter. Four editable points.
- Body: the visible shoulder/hip provide scale/direction. Center-connected mask spans at chest (22% down the torso), waist (50%) and hip (100%) fit three new independent parameters: chestDepth, waistDepth, hipsDepth. Eight editable points.
- The depth controls alter Z only in the measured data model, preserving every frontal X/Y coordinate. Face width, jaw width, eye spacing and body width parameters are preserved when a side photo is applied. The implicit model also supports depth controls.
- Side detection reuses the existing face/pose detector but maps profile measurements and rejects clearly frontal inputs. Complete profiles may defeat the detector; manual points remain available and require position confirmation. Clothing and arms can contaminate masks. True lateral, upright images are needed. These measurements do not reconstruct arbitrary 3D shape or camera perspective.
- Synthetic side projections recover the four fitted parameters within 0.02 slider units. Horizontal-mirror invariance and exact preservation of frontal model coordinates pass. Real-profile automatic detection and iPhone Safari interaction remain unverified.
