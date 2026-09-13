import {makeTextures} from './textures.js';
import {buildHair} from './hair.js';
import {sanitize} from './model.js';
import {generateDataModel,deformPoint} from './data-model.js';
import {clamp,smooth,makeRig,weightsFor} from './rig.js';
export const studioDefaults={hairStyle:'ponytail',hairVolume:1,hairLength:.5,fringe:.45,hairPart:-.35,hairSpread:.35,flyaways:.35,skinColor:'#b9c7c2',hairColor:'#302a30',irisColor:'#557069',irisSize:1,pupilSize:1,lashLength:.55,lashDensity:.65,eyeWetness:.7,hairShine:.55,roughness:.6,blink:0,smile:0,mouthOpen:0};
export const studioRanges={hairVolume:[.85,1.25],hairPart:[-1,1],irisSize:[.75,1.3],pupilSize:[.6,1.5]};
export function sanitizeStudio(s={}){s=s&&typeof s==='object'?s:{};const p={...studioDefaults};if(['none','short','bob','ponytail'].includes(s.hairStyle))p.hairStyle=s.hairStyle;for(const k of ['skinColor','hairColor','irisColor'])if(/^#[0-9a-f]{6}$/i.test(s[k]))p[k]=s[k];for(const k in p)if(typeof p[k]==='number'&&Number.isFinite(s[k]))p[k]=clamp(s[k],...(studioRanges[k]||[0,1]));return p;}
const color=hex=>[1,3,5].map(i=>{const c=parseInt(hex.slice(i,i+2),16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
const bell=(x,c,s)=>Math.exp(-(((x-c)/s)**2));
function newPart(name,group,tint){return {name,group,tint,vertices:[],normals:[],colors:[],joints:[],weights:[],blink:[],smile:[],mouth:[],indices:[],uvs:[]};}
function addVertex(part,p,n,c,skin,morphs,uv=[0,0]){const i=part.vertices.length/3;part.vertices.push(...p);part.uvs.push(...uv);part.normals.push(...n);part.colors.push(...c);part.joints.push(...skin.joints);part.weights.push(...skin.weights);for(let j=0;j<3;j++)part[['blink','smile','mouth'][j]].push(...morphs[j]);return i;}
function surfaceNormals(part){part.normals=Array(part.vertices.length).fill(0);for(let t=0;t<part.indices.length;t+=3){const [a,b,c]=part.indices.slice(t,t+3).map(i=>i*3),p=part.vertices,u=[0,1,2].map(k=>p[b+k]-p[a+k]),v=[0,1,2].map(k=>p[c+k]-p[a+k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const i of [a,b,c])for(let k=0;k<3;k++)part.normals[i+k]+=n[k];}for(let i=0;i<part.normals.length;i+=3){const n=Math.hypot(...part.normals.slice(i,i+3));if(n<1e-12){part.normals[i]=0;part.normals[i+1]=0;part.normals[i+2]=1;}else for(let k=0;k<3;k++)part.normals[i+k]/=n;}}
export function buildCharacter(data,parameters,settings,face=false,subdivide=false){
 const p=sanitize(parameters),s=sanitizeStudio(settings),base=generateDataModel(data,p,face,subdivide,true),t=base.topology,J=data.joints;
 const transform=v=>{const d=deformPoint(v,data,p);return [d[0]*t.scale,(d[1]-t.min)*t.scale,d[2]*t.scale];};
 const delta=(v,d)=>{const a=transform(v),b=transform(v.map((x,i)=>x+d[i]));return b.map((x,i)=>x-a[i]);};
 const skin=color(s.skinColor),hair=color(s.hairColor),parts=[newPart('Body','body',skin),newPart('Head','head',skin),newPart('Eyes','head',[.8,.85,.84]),newPart('Hair','hair',hair),newPart('Eyelids','head',skin),newPart('Eyebrows','head',hair),newPart('EyeRims','head',skin.map((c,i)=>c*[1,.79,.76][i])),newPart('Eyelashes','head',hair.map(c=>c*.65)),newPart('TearDucts','head',skin.map((c,i)=>c*[1,.71,.70][i])),newPart('HairStrands','hair',hair)],caches=parts.map(()=>new Map());
 function expression(v,eye){const [x,y,z]=v,a=Math.abs(x),front=smooth(.065,.09,z);if(eye)return [[0,0,0],[0,0,0],[0,0,0]];
 const smile=front*bell(y,.889,.014)*bell(a,.022,.018),jaw=front*(1-smooth(.884,.892,y))*bell(y,.874,.026)*bell(x,0,.047);
 return [[0,0,0],delta(v,[Math.sign(x)*.003*smile,.006*smile,.001*smile]),delta(v,[0,-.012*jaw,-.003*jaw])];}
 t.faces.forEach((f,fi)=>{if(t.materials[fi])return;const partIndex=f.reduce((a,i)=>a+t.sourceVertices[i][1],0)/3>=J.neck[1]?1:0,part=parts[partIndex],cache=caches[partIndex];for(const i of f){if(!cache.has(i)){const v=t.sourceVertices[i];cache.set(i,addVertex(part,t.vertices[i],t.normals[i],part.tint,weightsFor(v,data),expression(v,false)));}part.indices.push(cache.get(i));}});
 const headSkin={joints:[4,0,0,0],weights:[1,0,0,0]},zero=[[0,0,0],[0,0,0],[0,0,0]];
 function grid(part,rows,cols,point,morph=()=>zero,uv=(u,v)=>[v,u]){const offset=part.vertices.length/3;for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){const v=point(i/rows,j/cols);addVertex(part,transform(v),[0,1,0],part.tint,headSkin,morph(v,i/rows,j/cols),uv(i/rows,j/cols));}for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=offset+i*(cols+1)+j,b=a+cols+1;part.indices.push(a,b,a+1,a+1,b,b+1);}}
 // Dense fitted eyes: the corneal dome and texture share stable frontal UVs.
 parts[2].tint=[1,1,1];parts[2].texture=0;
 for(const side of [-1,1]){const eye=J[side>0?'l-eye':'r-eye'];
  grid(parts[2],36,64,(u,v)=>{const t=.0001+u*(Math.PI-.0002),a=v*Math.PI*2,front=Math.cos(t);return [eye[0]+Math.sin(t)*Math.sin(a)*.0086,eye[1]+Math.sin(t)*Math.cos(a)*.0084,eye[2]+front*.0089+Math.max(0,front)**12*.0006];},undefined,(u,v)=>[.5+Math.sin(u*Math.PI)*Math.sin(v*Math.PI*2)*.5,.5-Math.sin(u*Math.PI)*Math.cos(v*Math.PI*2)*.5]);
  for(const upper of [true,false]){
   const point=(u,v,closed)=>{const x=(v*2-1)*.0088,arc=Math.sqrt(Math.max(0,1-(x/.0088)**2)),open=(upper?.0038:-.0038)*arc,edge=closed?-.0006*arc:open,outer=(upper?.0083:-.0083)*arc,dy=outer*(1-u)+edge*u;return [eye[0]+x,eye[1]+dy,eye[2]+Math.sqrt(Math.max(.000001,.0098**2-x*x-dy*dy))+.0001];};
   const blink=(a,u,v)=>[transform(point(u,v,true)).map((x,i)=>x-transform(a)[i]),[0,0,0],[0,0,0]];
   grid(parts[4],10,40,(u,v)=>point(u,v,false),blink);
   // A rounded wet margin gives the lid thickness from oblique views.
   const rim=(u,v,closed)=>{const a=point(1,v,closed),angle=u*Math.PI*2,r=.00030*Math.sin(v*Math.PI);return [a[0],a[1]+Math.sin(angle)*r,a[2]+Math.cos(angle)*r];};
   grid(parts[6],6,40,(u,v)=>rim(u,v,false),(a,u,v)=>[transform(rim(u,v,true)).map((x,i)=>x-transform(a)[i]),[0,0,0],[0,0,0]]);
   // Short curved ribbons rise from the moving lid edge; no floating lash strip.
   if(s.lashLength>.005&&s.lashDensity>.005){const count=Math.round((upper?19:13)*( .35+s.lashDensity*.9));for(let j=0;j<count;j++){
    const at=.08+.84*(j+.5)/count,len=((upper?.0015:.0008)+s.lashLength*(upper?.003:.0015))*(.78+.22*Math.sin(j*4.3)**2),width=(upper?.00036:.00024);
    const lash=(u,v,closed)=>{const a=point(1,at,closed),spread=(at-.5)*u*.0035+Math.sin(j*5)*u*.00035,x=a[0]+spread+(v-.5)*width*(1-u*.6),y=a[1]+(upper?1:-1)*len*(u*.55+u*u*.45);return [x,y,a[2]+len*(Math.sin(u*Math.PI*.65)*.85)+.0003];};
    grid(parts[7],5,2,(u,v)=>lash(u,v,false),(a,u,v)=>[transform(lash(u,v,true)).map((x,i)=>x-transform(a)[i]),[0,0,0],[0,0,0]],(u,v)=>[(3+.05+v*.9)/4,u*.98]);
   }}
  }
  grid(parts[8],10,18,(u,v)=>{const t=.0001+u*(Math.PI-.0002),a=v*Math.PI*2;return [eye[0]-side*.0083+Math.sin(t)*Math.sin(a)*.00105,eye[1]-.0005+Math.cos(t)*.00085,eye[2]+.0045+Math.sin(t)*Math.cos(a)*.00105];});
 }
 // Individual lash ribbons retain their silhouette at small screen sizes.
 // Project narrow brow ribbons onto the original skin; then use the same facial deformer.
 const browFaces=[];data.faces.slice(0,data.bodyFaceCount).forEach(f=>{if(f.some(i=>data.vertices[i][1]>.963)||f.every(i=>data.vertices[i][1]<.928)||f.every(i=>data.vertices[i][2]<.06))return;for(let i=1;i<f.length-1;i++)browFaces.push([data.vertices[f[0]],data.vertices[f[i]],data.vertices[f[i+1]]]);});
 const browZ=(x,y)=>{let z=-Infinity;for(const [a,b,c]of browFaces){const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-12)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,w=1-u-v;if(u>=0&&v>=0&&w>=0)z=Math.max(z,u*a[2]+v*b[2]+w*c[2]);}return Number.isFinite(z)?z+.0007:.082;};
 for(const side of [-1,1])grid(parts[5],3,32,(u,v)=>{const x=side*(.007+.030*v),center=.941+.004*Math.sin(v*Math.PI)-.004*v,y=center+(u-.5)*.0050*(.95-.70*v);return [x,y,browZ(x,y)];},undefined,(u,v)=>[(.03+u*.94)/4,v*.97]);
 parts[5].texture=1;parts[5].alphaCutoff=.12;
 buildHair(s,parts[3],parts[9],grid);
 for(const part of parts.slice(2))surfaceNormals(part);
 // Normal deltas travel with expressions in GLB and update the preview as well.
 for(const part of parts){part.morphNormals={};for(const key of ['blink','smile','mouth'])if(part[key].some(x=>Math.abs(x)>1e-10)){
  const posed={vertices:part.vertices.map((x,i)=>x+part[key][i]),indices:part.indices};surfaceNormals(posed);part.morphNormals[key]=new Float32Array(posed.normals.map((x,i)=>x-part.normals[i]));
 }
 for(const k of ['vertices','normals','colors','weights','blink','smile','mouth','uvs'])part[k]=new Float32Array(part[k]);part.joints=new Uint16Array(part.joints);part.indices=new Uint32Array(part.indices);
 part.roughness=part.group==='hair'? .62-s.hairShine*.37:part.name==='Eyes'?.23-s.eyeWetness*.16:['EyeRims','TearDucts'].includes(part.name)?.26-s.eyeWetness*.15:Math.max(.25,s.roughness);}
 delete base.topology;
 return {...base,parts:parts.filter(part=>part.indices.length),rig:makeRig(data,transform),studio:s,textures:makeTextures(s)};
}
