// Classic worker: MediaPipe's WASM loader uses importScripts in worker contexts.
const VERSION='0.10.14';
const ROOT=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const MODELS={face:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',body:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'};
onmessage=async({data})=>{let detector,result;const bitmap=data.bitmap;try{
postMessage({stage:'自動検出の準備中… 初回はモデルの読み込みに時間がかかります。'});
const vision=await import(`${ROOT}/vision_bundle.mjs`),files=await vision.FilesetResolver.forVisionTasks(`${ROOT}/wasm`);
const options={baseOptions:{modelAssetPath:MODELS[data.mode.startsWith('face')?'face':'body'],delegate:'CPU'},runningMode:'IMAGE'};
detector=data.mode.startsWith('face')?await vision.FaceLandmarker.createFromOptions(files,{...options,numFaces:2,minFaceDetectionConfidence:.6,minFacePresenceConfidence:.6}):await vision.PoseLandmarker.createFromOptions(files,{...options,numPoses:2,minPoseDetectionConfidence:.6,minPosePresenceConfidence:.6,outputSegmentationMasks:true});
postMessage({stage:'画像の特徴点を検出中…'});
const canvas=new OffscreenCanvas(bitmap.width,bitmap.height);canvas.getContext('2d').drawImage(bitmap,0,0);result=detector.detect(canvas);
const landmarks=data.mode.startsWith('face')?result.faceLandmarks:result.landmarks;
const output={landmarks:landmarks.map(a=>a.map(p=>({x:p.x,y:p.y,z:p.z,visibility:p.visibility}))),worldLandmarks:result.worldLandmarks};
if(result.segmentationMasks?.length===1){const m=result.segmentationMasks[0];output.mask={width:m.width,height:m.height,values:m.getAsFloat32Array().slice()};}
postMessage({result:output},output.mask?[output.mask.values.buffer]:[]);
}catch(e){postMessage({error:'自動検出を利用できませんでした。通信を確認して再試行するか、手動で点を指定してください。',detail:String(e?.message||e)});}finally{if(result?.close)result.close();else result?.segmentationMasks?.forEach(m=>m.close?.());detector?.close?.();bitmap.close?.();}};
