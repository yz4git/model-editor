import {sanitize} from './model.js';
import {generateDataModel,deformPoint} from './data-model.js';
import {clamp,smooth,makeRig,weightsFor} from './rig.js';
export const studioDefaults={hairStyle:'ponytail',hairVolume:1,hairLength:.5,fringe:.45,skinColor:'#b9c7c2',hairColor:'#302a30',roughness:.6,blink:0,smile:0,mouthOpen:0};
export function sanitizeStudio(s={}){const p={...studioDefaults};for(const k of ['hairStyle'])if(['none','short','bob','ponytail'].includes(s[k]))p[k]=s[k];for(const k of ['skinColor','hairColor'])if(/^#[0-9a-f]{6}$/i.test(s[k]))p[k]=s[k];for(const k of ['hairVolume','hairLength','fringe','roughness','blink','smile','mouthOpen'])if(Number.isFinite(s[k]))p[k]=k==='hairVolume'?clamp(s[k],.85,1.25):clamp(s[k]);return p;}
const color=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const bell=(x,c,s)=>Math.exp(-(((x-c)/s)**2));
function newPart(name,group,tint){return {name,group,tint,vertices:[],normals:[],colors:[],joints:[],weights:[],blink:[],smile:[],mouth:[],indices:[]};}
function addVertex(part,p,n,c,skin,morphs){const i=part.vertices.length/3;part.vertices.push(...p);part.normals.push(...n);part.colors.push(...c);part.joints.push(...skin.joints);part.weights.push(...skin.weights);for(let j=0;j<3;j++)part[['blink','smile','mouth'][j]].push(...morphs[j]);return i;}
function surfaceNormals(part){part.normals=Array(part.vertices.length).fill(0);for(let t=0;t<part.indices.length;t+=3){const [a,b,c]=part.indices.slice(t,t+3).map(i=>i*3),p=part.vertices,u=[0,1,2].map(k=>p[b+k]-p[a+k]),v=[0,1,2].map(k=>p[c+k]-p[a+k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const i of [a,b,c])for(let k=0;k<3;k++)part.normals[i+k]+=n[k];}for(let i=0;i<part.normals.length;i+=3){const n=Math.hypot(...part.normals.slice(i,i+3));if(n<1e-12){part.normals[i]=0;part.normals[i+1]=0;part.normals[i+2]=1;}else for(let k=0;k<3;k++)part.normals[i+k]/=n;}}
export function buildCharacter(data,parameters,settings,face=false,subdivide=false){
 const p=sanitize(parameters),s=sanitizeStudio(settings),base=generateDataModel(data,p,face,subdivide,true),t=base.topology,J=data.joints;
 const transform=v=>{const d=deformPoint(v,data,p);return [d[0]*t.scale,(d[1]-t.min)*t.scale,d[2]*t.scale];};
 const delta=(v,d)=>{const a=transform(v),b=transform(v.map((x,i)=>x+d[i]));return b.map((x,i)=>x-a[i]);};
 const skin=color(s.skinColor),hair=color(s.hairColor),parts=[newPart('Body','body',skin),newPart('Head','head',skin),newPart('Eyes','head',[.8,.85,.84]),newPart('Hair','hair',hair),newPart('Eyelids','head',skin)],caches=parts.map(()=>new Map());
 function expression(v,eye){const [x,y,z]=v,a=Math.abs(x),front=smooth(.065,.09,z);if(eye)return [[0,0,0],[0,0,0],[0,0,0]];
 const smile=front*bell(y,.889,.014)*bell(a,.022,.018),jaw=front*(1-smooth(.884,.892,y))*bell(y,.874,.026)*bell(x,0,.047);
 return [[0,0,0],delta(v,[Math.sign(x)*.003*smile,.006*smile,.001*smile]),delta(v,[0,-.012*jaw,-.003*jaw])];}
 t.faces.forEach((f,fi)=>{const partIndex=t.materials[fi]?2:f.reduce((a,i)=>a+t.sourceVertices[i][1],0)/3>=J.neck[1]?1:0,part=parts[partIndex],cache=caches[partIndex];for(const i of f){if(!cache.has(i)){const v=t.sourceVertices[i];let c=part.tint;if(partIndex===2){const eye=J[v[0]>=0?'l-eye':'r-eye'],r=Math.hypot(v[0]-eye[0],v[1]-eye[1]);c=v[2]>eye[2]+.0055&&r<.0045?(r<.0018?[.045,.06,.065]:[.19,.29,.27]):[.80,.85,.84];}cache.set(i,addVertex(part,t.vertices[i],t.normals[i],c,weightsFor(v,data),expression(v,partIndex===2)));}part.indices.push(cache.get(i));}});
 const headSkin={joints:[4,0,0,0],weights:[1,0,0,0]},zero=[[0,0,0],[0,0,0],[0,0,0]];
 function grid(part,rows,cols,point,morph=()=>zero){const offset=part.vertices.length/3;for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){const v=point(i/rows,j/cols);addVertex(part,transform(v),[0,1,0],part.tint,headSkin,morph(v,i/rows,j/cols));}for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=offset+i*(cols+1)+j,b=a+cols+1;part.indices.push(a,b,a+1,a+1,b,b+1);}}
 // Lid surfaces match the measured eyeball radius; the outer rim lies inside the surrounding skin.
 for(const side of [-1,1])for(const upper of [true,false]){const eye=J[side>0?'l-eye':'r-eye'];const point=(u,v,closed)=>{const x=(v*2-1)*.0088,arc=Math.sqrt(Math.max(0,1-(x/.0088)**2)),open=(upper?.0038:-.0038)*arc,edge=closed?-.0006*arc:open,outer=(upper?.008:-.008)*arc,dy=outer*(1-u)+edge*u;return [eye[0]+x,eye[1]+dy,eye[2]+Math.sqrt(Math.max(.000001,.0092**2-x*x-dy*dy))+.00025];};grid(parts[4],8,28,(u,v)=>point(u,v,false),(a,u,v)=>{const b=point(u,v,true),d=transform(b).map((x,i)=>x-transform(a)[i]);return [d,[0,0,0],[0,0,0]];});}
 const hp=parts[3];if(s.hairStyle!=='none'){
 const vol=s.hairVolume;grid(hp,24,64,(u,v)=>{const az=v*Math.PI*2,front=Math.cos(az),limit=front>0?1.45-front*.48:1.65-front*.5,theta=.015+u*limit,ridge=1+.012*Math.cos(az*28+u*4);return [Math.sin(az)*Math.sin(theta)*.050*vol*ridge,.946+Math.cos(theta)*.061*vol,.034+Math.cos(az)*Math.sin(theta)*.061*vol*ridge];});
 const tube=(point,radius,segments=28)=>grid(hp,segments,10,(u,v)=>{const pos=point(u),next=point(Math.min(1,u+.001)),prev=point(Math.max(0,u-.001)),dir=next.map((x,i)=>x-prev[i]),len=Math.hypot(...dir)||1,d=dir.map(x=>x/len),axis=Math.abs(d[1])>.95?[1,0,0]:[0,1,0],n=[d[1]*axis[2]-d[2]*axis[1],d[2]*axis[0]-d[0]*axis[2],d[0]*axis[1]-d[1]*axis[0]],l=Math.hypot(...n)||1;for(let i=0;i<3;i++)n[i]/=l;const b=[d[1]*n[2]-d[2]*n[1],d[2]*n[0]-d[0]*n[2],d[0]*n[1]-d[1]*n[0]],r=radius*(.8+.2*Math.sin(u*Math.PI))*(1-.92*smooth(.75,1,u)),a=v*Math.PI*2;return pos.map((x,i)=>x+r*(Math.cos(a)*n[i]+Math.sin(a)*b[i]));});
 if(s.fringe>.01)for(let i=-3;i<=3;i++)tube(u=>{const x=i*.010;return [x*(.45+.65*u)+.008*Math.sin(u*Math.PI),1.002-.065*u*(.55+s.fringe*.55),.040+.052*Math.sin(u*Math.PI*.52)];},.008*vol,18);
 if(s.hairStyle==='bob')for(let i=0;i<18;i++){const a=.7+i/17*(Math.PI*2-1.4);tube(u=>[Math.sin(a)*(.045+.009*Math.sin(u*Math.PI))*vol,.979-u*(.10+.08*s.hairLength),.034+Math.cos(a)*(.057+.009*Math.sin(u*Math.PI))*vol],.010*vol);}
 if(s.hairStyle==='ponytail')for(let i=0;i<9;i++){const a=i/9*Math.PI*2;tube(u=>[Math.cos(a)*.014*vol*(.5+.5*u)+.015*Math.sin(u*4),.983-u*(.13+.15*s.hairLength)+Math.sin(u*Math.PI)*.035,-.020-.060*Math.sin(u*Math.PI/2)+Math.sin(a)*.017*vol],.012*vol);}
 }
 for(const part of [parts[3],parts[4]])surfaceNormals(part);
 for(const part of parts){for(const k of ['vertices','normals','colors','weights','blink','smile','mouth'])part[k]=new Float32Array(part[k]);part.joints=new Uint16Array(part.joints);part.indices=new Uint32Array(part.indices);part.roughness=part.group==='hair'?Math.max(.2,s.roughness*.65):Math.max(.25,s.roughness);}
 delete base.topology;
 return {...base,parts:parts.filter(part=>part.indices.length),rig:makeRig(data,transform),studio:s};
}
