import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaults,sanitize,generate} from '../dist/model.js';
import {generateDataModel} from '../dist/data-model.js';
import {faceGroups,faceKeys,detailedFaceKeys,resetFaceGroup} from '../dist/face-controls.js';
import {faceDetailDelta} from '../dist/face-deform.js';
import {buildCharacter,studioDefaults} from '../dist/character.js';
import {toGLB} from '../dist/glb.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/base-model.json',import.meta.url))),base=generateDataModel(data,defaults);
assert.equal(faceKeys.length,66);assert.equal(new Set(faceKeys).size,66);assert.equal(detailedFaceKeys.length,53);assert.equal(Object.keys(defaults).length,76);
const legacy=sanitize({nose:1.2,jaw:.9});for(const key of detailedFaceKeys)assert.equal(legacy[key],1);assert.equal(legacy.nose,1.2);assert.deepEqual(sanitize(null),defaults);
for(const [group,rows]of faceGroups){for(const [k,,lo,hi]of rows){for(const end of [lo,hi]){const p={...defaults,[k]:end},m=generateDataModel(data,p);assert(m.vertices.every(Number.isFinite),k);assert.equal(m.vertices.length,base.vertices.length);let maxDelta=0;for(let i=0;i<m.vertices.length;i++)maxDelta=Math.max(maxDelta,Math.abs(m.vertices[i]-base.vertices[i]));assert(maxDelta>1e-5,`${k} lacks a visible geometric effect (${maxDelta})`);}}console.log(group,rows.length,'controls: both endpoints deform');}
for(const key of detailedFaceKeys)assert.deepEqual(faceDetailDelta([.1,.5,.02],{...defaults,[key]:1.3}),[0,0,0]);
const lp={...defaults,eyeSquintL:1.3};assert.notEqual(faceDetailDelta([.018474,.934,.08],lp)[1],0);assert.equal(faceDetailDelta([-.018474,.934,.08],lp)[1],0);
const before={...defaults,mouthHeight:1.25,noseLength:.8,waist:.9},reset=resetFaceGroup(before,5);assert.equal(reset.mouthHeight,1);assert.equal(reset.noseLength,.8);assert.equal(reset.waist,.9);
// Strong but mixed regional edits exercise attachments, facial deltas and the exporter together.
const mixed={...defaults,headLength:1.18,eyeHeight:1.2,eyeTilt:.8,eyeSquintL:1.2,browHeight:1.25,browArch:1.15,noseTipAngle:1.2,mouthHeight:.85,upperLipThickness:1.25,earTip:1.3,chinWidth:.85};
const character=buildCharacter(data,mixed,studioDefaults);assert(character.parts.some(p=>p.name==='Eyebrows'));for(const p of character.parts)for(const k of ['vertices','normals','blink','smile','mouth'])assert(p[k].every(Number.isFinite),p.name+' '+k);assert(toGLB(character).byteLength>100000);
const analytic=generate({...defaults,noseLength:1.2,earTip:1.2,browHeight:1.2},64,true);assert(analytic.vertices.every(Number.isFinite));assert(analytic.normals.every(Number.isFinite));
console.log('Face controls: neutral migration, per-region reset, independent squint, deformed attachments, GLB and analytic fallback pass.');
