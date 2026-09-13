import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inflateSync} from 'node:zlib';
import {defaults} from '../dist/model.js';
import {buildCharacter,studioDefaults,sanitizeStudio} from '../dist/character.js';
import {toGLB} from '../dist/glb.js';
import {texturePNG} from '../dist/textures.js';
import {Viewer} from '../dist/viewer.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/base-model.json',import.meta.url)));
const base=buildCharacter(data,defaults,studioDefaults);
// Decode the generated PNG with Node's independent DEFLATE implementation.
function decodePNG(bytes){const b=Buffer.from(bytes);assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10]);const chunks=[];let width,height;for(let i=8;i<b.length;){const n=b.readUInt32BE(i),tag=b.toString('ascii',i+4,i+8),v=b.subarray(i+8,i+8+n);if(tag==='IHDR'){width=v.readUInt32BE(0);height=v.readUInt32BE(4);}if(tag==='IDAT')chunks.push(v);i+=n+12;}const rows=inflateSync(Buffer.concat(chunks));assert.equal(rows.length,(width*4+1)*height);const pixels=new Uint8Array(width*height*4);for(let y=0;y<height;y++){assert.equal(rows[y*(width*4+1)],0);pixels.set(rows.subarray(y*(width*4+1)+1,(y+1)*(width*4+1)),y*width*4);}return {width,height,pixels};}
for(const t of base.textures){const result=decodePNG(texturePNG(t));assert.equal(result.width,t.width);assert.deepEqual(result.pixels,t.pixels);}
const binary=toGLB(base),view=new DataView(binary),len=view.getUint32(12,true),doc=JSON.parse(new TextDecoder().decode(new Uint8Array(binary,20,len))),binStart=28+len;
assert.equal(doc.images.length,4);assert.equal(doc.textures.length,4);assert(doc.extensionsUsed.includes('KHR_materials_anisotropy'));assert(!doc.extensionsRequired,'standard material fallback must remain possible');
doc.images.forEach((im,i)=>{assert.equal(im.mimeType,'image/png');assert.equal(im.uri,undefined);const bv=doc.bufferViews[im.bufferView];assert.deepEqual(decodePNG(new Uint8Array(binary,binStart+bv.byteOffset,bv.byteLength)).pixels,base.textures[i].pixels);});
for(const part of base.parts){const primitive=doc.meshes.find(x=>x.name===part.name).primitives[0],mat=doc.materials[primitive.material],count=part.vertices.length/3;assert.equal(part.uvs.length,count*2);assert(part.uvs.every(v=>v>=0&&v<=1));
 if(part.texture!==undefined){assert.equal(doc.accessors[primitive.attributes.TEXCOORD_0].count,count);assert.equal(mat.pbrMetallicRoughness.baseColorTexture.index,part.texture);}
 if(part.alphaCutoff)assert.equal(mat.alphaMode,'MASK');
 for(const [i,key]of ['blink','smile','mouth'].entries())if(part.morphNormals[key]){assert.equal(doc.accessors[primitive.targets[i].NORMAL].count,count);assert(part.morphNormals[key].every(Number.isFinite));}
}
// Close both lid margins at the same seam even after strong facial edits.
const changed=buildCharacter(data,{...defaults,eyeSize:1.15,eyeHeight:1.2,eyeTilt:.85},{...studioDefaults,hairPart:.7,hairSpread:.9,irisColor:'#996633',irisSize:1.25,pupilSize:1.4});
const lids=changed.parts.find(p=>p.name==='Eyelids'),perLid=11*41;
for(let side=0;side<2;side++)for(let j=0;j<=40;j++)for(let k=0;k<3;k++){const a=((side*2)*perLid+10*41+j)*3+k,b=((side*2+1)*perLid+10*41+j)*3+k;assert(Math.abs(lids.vertices[a]+lids.blink[a]-lids.vertices[b]-lids.blink[b])<1e-6);}
assert.notDeepEqual(changed.textures[0].pixels,base.textures[0].pixels);
assert.notDeepEqual(changed.parts.find(p=>p.name==='Hair').vertices,base.parts.find(p=>p.name==='Hair').vertices);
assert.deepEqual(sanitizeStudio(null),studioDefaults);assert.equal(sanitizeStudio({irisSize:999,pupilSize:NaN}).irisSize,1.3);
// Exercise the real packing path: eight attributes, UV in spare morph components,
// expression-normal updates, texture cleanup, and analytic/wireframe fallbacks.
let id=0,bound,shaderSources=[],bufferData=new Map(),deleted=0;const gl=new Proxy({
 createShader:()=>({}),shaderSource:(s,source)=>shaderSources.push(source),getShaderParameter:()=>true,getProgramParameter:()=>true,getExtension:()=>true,getShaderPrecisionFormat:()=>({precision:23}),getAttribLocation:(_,name)=>['position','normal','color','joints','weights','blink','smile','mouth'].indexOf(name),getUniformLocation:(_,name)=>name,
 createBuffer:()=>++id,bindBuffer:(_,b)=>bound=b,bufferData:(_,v)=>bufferData.set(bound,new Float32Array(v)),bufferSubData:(_,offset,v)=>{assert(v.every(Number.isFinite));bufferData.set(bound,new Float32Array(v));},createTexture:()=>++id,deleteTexture:()=>deleted++,
},{get:(t,k)=>k in t?t[k]:(()=>{})});
globalThis.devicePixelRatio=1;const viewer=new Viewer({getContext:()=>gl,clientWidth:500,clientHeight:500});viewer.setMesh(base);assert.equal(Object.keys(viewer.attributes).length,8);
for(let j=0;j<base.parts.length;j++){const p=base.parts[j],draw=viewer.drawParts[j],packed=bufferData.get(draw.buffers.blink),other=bufferData.get(draw.buffers.smile);for(let i=0;i<p.indices.length;i++){assert.equal(packed[i*4+3],p.uvs[p.indices[i]*2]);assert.equal(other[i*4+3],p.uvs[p.indices[i]*2+1]);}}
const state={mode:'face',yaw:0,pitch:0,zoom:5.3,multi:false,expression:[1,0,0],clip:'none',time:0};viewer.render(state);viewer.setMesh(base,true);viewer.render({...state,multi:true});viewer.setMesh({vertices:base.vertices,normals:base.normals,colors:base.colors,headY:base.headY,height:base.height});viewer.render(state);assert(deleted>=8);
const low=new Viewer({getContext:()=>new Proxy(gl,{get:(t,k)=>k==='getShaderPrecisionFormat'?()=>({precision:0}):t[k]})});assert.equal(low.anisotropySupported,false);
console.log(JSON.stringify({materialChecks:'pass',embeddedPNGs:4,parts:base.parts.length,triangles:base.parts.reduce((n,p)=>n+p.indices.length/3,0),glbBytes:binary.byteLength,vertexAttributes:8}));
