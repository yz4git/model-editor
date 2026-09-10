import {sanitize} from './model.js';
const bell=(x,c,s)=>Math.exp(-(((x-c)/s)**2)),smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// M(p) = normalizeHeight[ V0 + sum_k (p_k-p0_k) D_k(V0,J) ].
// D_k are local radial-basis deformation fields anchored to measured joints J.
export function generateDataModel(data,parameters,face=false,subdivide=false){const p=sanitize(parameters),J=data.joints,neck=J.neck[1],hip=J.pelvis[1],eye=J['l-eye'],jaw=J.jaw;
let vertices=data.vertices.map(([x,y,z])=>{const ax=Math.abs(x),sgn=Math.sign(x),head=smooth(neck-.025,neck+.055,y),body=1-head,waist=bell(y,.65,.07)*body,shoulder=bell(y,J['l-shoulder'][1],.065)*body,arm=smooth(.095,.16,ax)*smooth(.55,.68,y),pelvis=bell(y,hip,.09)*body;
let xx=x*(1+(p.waist-1)*waist+(p.hips-1)*pelvis*.8+(p.shoulders-1)*shoulder*.8),yy=y+(p.legs-1)*Math.min(y,hip),zz=z*(1+(p.waist-1)*waist*.7+(p.hips-1)*pelvis*.35);
xx+=sgn*(p.shoulders-1)*.065*arm;
const mass=(p.muscle-.35),limbCenter=y<hip?Math.abs(J['l-knee'][0]):.18;const limb=smooth(.07,.14,ax)*body;
xx+=mass*.15*(x-sgn*limbCenter)*limb*bell(y,y<hip?.32:.72,.16);zz+=mass*.13*z*body*(bell(y,.76,.07)+bell(y,.32,.13));
xx+=(p.faceWidth-1)*x*head;xx+=(p.jaw-1)*x*bell(y,jaw[1],.032)*head;
const ew=bell(ax,eye[0],.025)*bell(y,eye[1],.028)*smooth(0,.04,z);xx+=sgn*(p.eyes-1)*eye[0]*ew;
zz+=(p.nose-1)*.022*bell(x,0,.012)*bell(y,eye[1]-.027,.025)*smooth(.055,.095,z);
const mouthY=jaw[1]+.022;yy+=(p.lips-1)*(y-mouthY)*.75*bell(y,mouthY,.012)*bell(x,0,.03)*smooth(.06,.09,z);zz+=(p.lips-1)*.005*bell(y,mouthY,.012)*bell(x,0,.03)*smooth(.06,.09,z);
xx*=1+(p.head-1)*head;yy+=(p.head-1)*(y-neck)*head;zz*=1+(p.head-1)*head;
return [xx,yy,zz];});
let min=Infinity,max=-Infinity;for(const v of vertices){min=Math.min(min,v[1]);max=Math.max(max,v[1]);}const scale=p.height/(max-min);vertices=vertices.map(v=>[v[0]*scale,(v[1]-min)*scale,v[2]*scale]);
let faces=[],materials=[];data.faces.forEach((f,index)=>{if(face&&f.some(i=>data.vertices[i][1]<neck-.018))return;for(let i=1;i<f.length-1;i++){faces.push([f[0],f[i],f[i+1]]);materials.push(index>=data.bodyFaceCount?1:0);}});
// Topology-preserving midpoint refinement; not a claim of additional measured detail.
if(subdivide){const cache=new Map(),next=[],mats=[];const midpoint=(a,b)=>{const key=a<b?a+','+b:b+','+a;if(!cache.has(key)){cache.set(key,vertices.length);vertices.push(vertices[a].map((v,i)=>(v+vertices[b][i])*.5));}return cache.get(key);};faces.forEach(([a,b,c],i)=>{const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);mats.push(...Array(4).fill(materials[i]));});faces=next;materials=mats;}
const normals=vertices.map(()=>[0,0,0]);for(const [a,b,c] of faces){const u=vertices[b].map((v,i)=>v-vertices[a][i]),v=vertices[c].map((v,i)=>v-vertices[a][i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const idx of [a,b,c])for(let j=0;j<3;j++)normals[idx][j]+=n[j];}for(const n of normals){const l=Math.hypot(...n)||1;for(let j=0;j<3;j++)n[j]/=l;}
const out=new Float32Array(faces.length*9),ns=new Float32Array(out.length),colors=new Float32Array(out.length);let k=0;faces.forEach((f,fi)=>{for(const i of f){out.set(vertices[i],k);ns.set(normals[i],k);colors.set(materials[fi]?[.28,.37,.39]:[.70,.77,.76],k);k+=3;}});
return {vertices:out,normals:ns,colors,height:p.height,headY:((neck+.075)+(p.legs-1)*hip+(p.head-1)*.075-min)*scale};}
