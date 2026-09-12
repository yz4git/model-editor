import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaults} from '../dist/model.js';
import {buildCharacter,studioDefaults,sanitizeStudio} from '../dist/character.js';
import {poseAt,poseDefaults,skinMatrices,skinPoint} from '../dist/rig.js';
import {toGLB,characterOBJ} from '../dist/glb.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/base-model.json',import.meta.url)));
const started=performance.now(),mesh=buildCharacter(data,defaults,studioDefaults);
assert.equal(mesh.rig.length,17);assert.deepEqual(mesh.parts.map(p=>p.name),['Body','Head','Eyes','Hair','Eyelids','Eyebrows']);
const matrices=skinMatrices(mesh.rig,poseAt().rotations);
for(const p of mesh.parts){const n=p.vertices.length/3;for(const k of ['vertices','normals','colors','joints','weights','blink','smile','mouth'])assert(p[k].every(Number.isFinite),p.name+' '+k);assert.equal(p.normals.length,n*3);assert.equal(p.joints.length,n*4);assert(p.indices.every(i=>i<n));for(let i=0;i<n;i++){assert(Math.abs(p.weights.slice(i*4,i*4+4).reduce((a,b)=>a+b,0)-1)<1e-6);assert(p.joints.slice(i*4,i*4+4).every(j=>j<17));const v=p.vertices.slice(i*3,i*3+3),result=skinPoint(v,p.joints.slice(i*4,i*4+4),p.weights.slice(i*4,i*4+4),matrices);assert(result.every((x,k)=>Math.abs(x-v[k])<1e-6),'rest bind drift');}}
const moving=skinMatrices(mesh.rig,poseAt(poseDefaults,'greeting',1.5).rotations),body=mesh.parts[0];let changed=0;for(let i=0;i<body.vertices.length/3;i++){const v=body.vertices.slice(i*3,i*3+3),q=skinPoint(v,body.joints.slice(i*4,i*4+4),body.weights.slice(i*4,i*4+4),moving);if(v[1]<defaults.height*.1)assert(q.every((x,k)=>Math.abs(x-v[k])<1e-6),'greeting foot drift');if(q.some((x,k)=>Math.abs(x-v[k])>.01))changed++;}assert(changed>100);
assert(poseAt(poseDefaults,'greeting',0).rotations.flat().every((x,i)=>Math.abs(x-poseAt(poseDefaults,'greeting',3).rotations.flat()[i])<1e-8));
const lids=mesh.parts.find(p=>p.name==='Eyelids');assert(lids.blink.some(x=>Math.abs(x)>.005));for(const k of ['smile','mouth'])assert(mesh.parts[1][k].some(x=>Math.abs(x)>.001));
const binary=toGLB(mesh),view=new DataView(binary);assert.equal(view.getUint32(0,true),0x46546c67);assert.equal(view.getUint32(8,true),binary.byteLength);const length=view.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(binary,20,length)));assert.equal(json.skins[0].joints.length,17);assert.equal(json.meshes.length,6);assert.deepEqual(json.animations.map(a=>a.name),['Greeting','FaceStudy']);const binLength=view.getUint32(20+length,true);assert.equal(binLength,json.buffers[0].byteLength);for(const b of json.bufferViews){assert.equal(b.byteOffset%4,0);assert(b.byteOffset+b.byteLength<=binLength);}for(const anim of json.animations)for(const c of anim.channels){const s=anim.samplers[c.sampler],input=json.accessors[s.input],output=json.accessors[s.output];assert.equal(output.count,input.count*(c.target.path==='weights'?3:1));}
assert(characterOBJ(mesh,poseDefaults,[0,0,0]).includes('o Hair'));
assert.equal(sanitizeStudio({hairColor:'<script>',hairVolume:Infinity}).hairColor,studioDefaults.hairColor);
const scaled=buildCharacter(data,{...defaults,height:1.5,legs:1.1,head:1.1},{...studioDefaults,hairStyle:'none'});assert(!scaled.parts.some(p=>p.name==='Hair'));assert(scaled.rig[4].position[1]<mesh.rig[4].position[1]);
if(process.argv[2])fs.writeFileSync(process.argv[2],Buffer.from(binary));
console.log(JSON.stringify({studio:true,parts:mesh.parts.length,joints:17,vertices:mesh.parts.reduce((a,p)=>a+p.vertices.length/3,0),morphs:3,clips:json.animations.length,glbBytes:binary.byteLength,seconds:(performance.now()-started)/1000}));
