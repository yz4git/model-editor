import assert from 'node:assert/strict';import fs from 'node:fs';import {profileContour} from '../dist/profile-contour.js';
assert.throws(()=>profileContour(new Uint8Array(4),1,1));
for(const c of [0,255]){const a=new Uint8Array(200*200*4).fill(c);assert.throws(()=>profileContour(a,200,200));}
if(process.argv[2]){const w=Number(process.argv[3]),h=Number(process.argv[4]),data=fs.readFileSync(process.argv[2]),r=profileContour(data,w,h),flip=new Uint8Array(data.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++)flip.set(data.subarray((y*w+x)*4,(y*w+x)*4+4),(y*w+w-1-x)*4);const mirrored=profileContour(flip,w,h);for(const k in r.points){assert.equal(mirrored.points[k].x,w-1-r.points[k].x);assert.equal(mirrored.points[k].y,r.points[k].y);}assert.equal(r.requiresConfirmation,true);assert(r.points.noseTip.y>r.points.noseRoot.y);assert(r.points.chin.y>r.points.noseTip.y);console.log('Reference-image contour and mirror checks passed.');}
console.log('Blank and undersized image rejection passed.');
