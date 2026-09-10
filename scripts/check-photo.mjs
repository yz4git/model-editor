import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaults} from '../dist/model.js';
import {deformPoint} from '../dist/data-model.js';
import {fitParameters,referenceAnchors,detectedPoints,keysByMode,imageMetrics} from '../dist/photo-fit.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/base-model.json',import.meta.url),'utf8')),anchors=referenceAnchors(data);
function project(mode,params,scale=1,angle=0){return Object.fromEntries(Object.entries(anchors[mode]).map(([k,v])=>{const q=deformPoint(v,data,params),x=q[0]*1000,y=-q[1]*1000;return [k,{x:(x*Math.cos(angle)-y*Math.sin(angle))*scale+1000,y:(x*Math.sin(angle)+y*Math.cos(angle))*scale+1500}];}));}
const target={...defaults,faceWidth:1.12,jaw:.89,eyes:1.1,lips:1.2,waist:1.12,shoulders:1.1,hips:.91,legs:1.07};
for(const mode of ['face','body']){
 const r=fitParameters(data,project(mode,target),mode,defaults);
 assert(r.relativeError<.002,mode+' residual');
 for(const k of keysByMode[mode])assert(Math.abs(r.params[k]-target[k])<.012,mode+' '+k+' recovery');
 for(const k in defaults)if(!keysByMode[mode].includes(k))assert.equal(r.params[k],defaults[k],mode+' altered unrelated '+k);
 const invariant=fitParameters(data,project(mode,target,.64,.16),mode,defaults);
 for(const k of r.keys)assert(Math.abs(r.params[k]-invariant.params[k])<1e-8,mode+' image scale/roll/translation bias');
 console.log(JSON.stringify({mode,recovery:true,scaleTranslationRollInvariant:true,residual:r.relativeError}));
}
const held=fitParameters(data,project('face',target),'face',{...defaults,lips:.83},{skipLips:true});assert.equal(held.params.lips,.83);assert(!held.keys.includes('lips'));
assert.throws(()=>detectedPoints({landmarks:[]},'face',800,1000),/検出できません/);assert.throws(()=>detectedPoints({landmarks:[[],[]]},'body',800,1000),/複数人/);
const malformed=project('face',defaults);malformed.eyeL.x=NaN;assert.throws(()=>imageMetrics(malformed,'face'),/指定/);
const inverted=project('body',defaults);inverted.ankleL={...inverted.shoulderL};assert.throws(()=>imageMetrics(inverted,'body'),/順序/);
// Validate the normalized-pixel conversion with a non-square image, and lip gating.
const raw=project('face',target),width=2000,height=1600,landmarks=Array.from({length:478},()=>({x:.5,y:.5,z:0}));
const ids={forehead:10,chin:152,cheekL:234,cheekR:454,jawL:172,jawR:397,eyeL:468,eyeR:473,lipTop:0,lipBottom:17,mouthL:61,mouthR:291};
for(const[k,i]of Object.entries(ids))landmarks[i]={x:raw[k].x/width,y:raw[k].y/height,z:0};
landmarks[1]={x:(landmarks[468].x+landmarks[473].x)/2,y:(landmarks[468].y+landmarks[473].y)/2+.01,z:0};landmarks[13]={x:.5,y:.5,z:0};landmarks[14]={x:.5,y:.5,z:0};
const detected=detectedPoints({landmarks:[landmarks]},'face',width,height);const fromDetected=fitParameters(data,detected.points,'face',defaults);assert(fromDetected.relativeError<.002);assert.equal(detected.skipLips,false);
landmarks[14].y+=.03;assert.equal(detectedPoints({landmarks:[landmarks]},'face',width,height).skipLips,true);
// Center-connected silhouette excludes a separate arm island; visibility is enforced.
const W=200,H=400,pose=Array.from({length:33},()=>({x:.5,y:.5,z:0,visibility:1}));for(const[i,x,y]of [[11,.35,.25],[12,.65,.25],[23,.43,.52],[24,.57,.52],[25,.43,.72],[26,.57,.72],[27,.43,.92],[28,.57,.92]])pose[i]={x,y,z:0,visibility:1};
const values=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if((x>=75&&x<=125)||(x>=30&&x<=40))values[y*W+x]=1;
const body=detectedPoints({landmarks:[pose],mask:{width:W,height:H,values}},'body',W,H);assert(body.points.waistL.x>65);assert(body.points.waistR.x<140);
pose[27].visibility=.1;assert.throws(()=>detectedPoints({landmarks:[pose]},'body',W,H),/隠れ/);
console.log('Passed: unrelated-parameter preservation, open-mouth exclusion, aspect ratio, invalid/multiple/occluded detections, body contour isolation.');
