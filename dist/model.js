export const defaults={height:1.72,shoulders:1,waist:1,hips:1,muscle:.35,legs:1,head:1,faceWidth:1,jaw:1,eyes:1,nose:1,lips:1,chestDepth:1,waistDepth:1,hipsDepth:1,noseWidth:1,eyeSize:1,mouthWidth:1,cheekVolume:1,chinLength:1,chinProjection:1,foreheadDepth:1,mouthProjection:1};
export const definitions=[['体格',[['height','身長',1.45,2.05,.01],['shoulders','肩幅',.8,1.2,.01],['waist','胴まわり',.75,1.35,.01],['hips','骨盤幅',.8,1.25,.01],['chestDepth','胸の厚み',.7,1.4,.01],['waistDepth','腰の厚み',.7,1.4,.01],['hipsDepth','骨盤の厚み',.7,1.4,.01],['muscle','筋肉量',0,1,.01],['legs','脚の長さ',.88,1.12,.01],['head','頭の大きさ',.88,1.12,.01]]],['顔立ち',[['faceWidth','顔幅',.85,1.2,.01],['jaw','顎幅',.75,1.25,.01],['eyes','目の間隔',.8,1.2,.01],['nose','鼻の高さ',.6,1.5,.01],['lips','唇の厚さ',.6,1.5,.01],['noseWidth','鼻幅',.65,1.4,.01],['eyeSize','目の大きさ',.75,1.25,.01],['mouthWidth','口幅',.7,1.3,.01],['mouthProjection','口元の突出',.6,1.4,.01],['cheekVolume','頬のふくらみ',.7,1.35,.01],['chinLength','顎の長さ',.7,1.3,.01],['chinProjection','顎先の前後',.6,1.4,.01],['foreheadDepth','額の奥行き',.7,1.3,.01]]]];
export function sanitize(a){const p={...defaults};for(const [,ds] of definitions)for(const [k,,lo,hi] of ds)if(Number.isFinite(a[k]))p[k]=Math.max(lo,Math.min(hi,a[k]));return p;}
const g=(x,s)=>Math.exp(-x*x/(s*s));
// Shape preserving cubic Hermite interpolation: derivative is zero at extrema.
function spline(rows,y,col){let i=0;while(i<rows.length-2&&y>rows[i+1][0])i++;const a=rows[i],b=rows[i+1],h=b[0]-a[0],t=Math.max(0,Math.min(1,(y-a[0])/h));const slope=j=>{if(j===0||j===rows.length-1)return 0;const l=(rows[j][col]-rows[j-1][col])/(rows[j][0]-rows[j-1][0]),r=(rows[j+1][col]-rows[j][col])/(rows[j+1][0]-rows[j][0]);return l*r<=0?0:2*l*r/(l+r);};return (2*t*t*t-3*t*t+1)*a[col]+(t*t*t-2*t*t+t)*h*slope(i)+(-2*t*t*t+3*t*t)*b[col]+(t*t*t-t*t)*h*slope(i+1);}
const sm=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
export function createField(p){
const legTop=.86*p.legs,dy=legTop-.86,m=p.muscle;
const torso=[[legTop-.075,.07,.071,0],[legTop,.125*p.hips,.105,.004],[legTop+.09,.145*p.hips,.112,-.005],[1.06+dy,.112*p.waist,.078*p.waist,0],[1.18+dy,.14,.095,0],[1.32+dy,.177*p.shoulders,.104+m*.014,0],[1.39+dy,.155*p.shoulders,.081,0],[1.435+dy,.063,.059,0],[1.48+dy,.052,.054,0]];
const headBase=1.435+dy, hs=p.head, fw=p.faceWidth;
const head=[[0,.036,.042,.012],[.025,.05*p.jaw,.062,.016],[.06,.067*p.jaw,.072,.008],[.11,.076*fw,.079,0],[.155,.078*fw,.081,-.008],[.20,.077*fw,.084,-.013],[.24,.061*fw,.067,-.014],[.268,.026,.03,-.014],[.273,.001,.001,-.014]];
function section(rows,x,y,z,detail=0){const yc=Math.max(rows[0][0],Math.min(rows.at(-1)[0],y));const rx=spline(rows,yc,1),rz=spline(rows,yc,2),zc=spline(rows,yc,3);let radial=(Math.hypot(x/rx,(z-zc-detail)/rz)-1)*Math.min(rx,rz);return Math.max(radial,rows[0][0]-y,y-rows.at(-1)[0]);}
const legs=[[.045,.025,.032,.012],[.12,.03,.035,0],[.29,.051+m*.013,.058+m*.013,-.01],[.43,.046,.044,.005],[.49,.044,.047,.01],[.63,.063+m*.014,.072+m*.012,0],[legTop,.081*p.hips,.085,0],[legTop+.06,.07,.07,0]];
const arms=[[0,.067+m*.012,.067+m*.012,0],[.11,.056+m*.012,.058,0],[.25,.036,.037,0],[.34,.044+m*.007,.039,0],[.47,.026,.026,0],[.53,.032,.019,0],[.58,.029,.016,0],[.61,.015,.011,0]];
return {top:headBase+.273*hs,headBase,field:(x,y,z)=>{
z/=1+(p.chestDepth-1)*g(y-(1.32+dy),.075)+(p.waistDepth-1)*g(y-(1.06+dy),.08)+(p.hipsDepth-1)*g(y-legTop,.08);
let f=section(torso,x,y,z);
let hy=(y-headBase)/hs,hx=x/hs,hz=z/hs;
const anterior=Math.max(0,Math.min(1,(hz-.015)/.04));
hy+=.018*(p.chinLength-1)*g(hy-.027,.035);
hz-=anterior*(.022*(p.chinProjection-1)*g(hy-.025,.032)*g(hx,.045)+.025*(p.foreheadDepth-1)*g(hy-.202,.038));
hx/=1+anterior*((p.noseWidth-1)*g(hx,.025)*g(hy-.102,.026)+(p.mouthWidth-1)*g(hx,.048)*g(hy-.048,.02)+.65*(p.cheekVolume-1)*g(hy-.095,.025));
hz-=anterior*.023*(p.mouthProjection-1)*g(hy-.048,.02)*g(hx,.05);
hz-=anterior*.012*(p.cheekVolume-1)*(g(hx-.04,.025)+g(hx+.04,.025))*g(hy-.095,.022);

let detail=0;if(hz>0&&hy<.20&&hy>0){const e=.033*p.eyes;detail=.028*p.nose*g(hx,.015)*g(hy-.112,.038)+.019*p.nose*g(hx,.019)*g(hy-.09,.013)-.015*(g(hx-e,.022*p.eyeSize)+g(hx+e,.022*p.eyeSize))*g(hy-.137,.013*p.eyeSize)+.006*(g(hx-e,.026)+g(hx+e,.026))*g(hy-.159,.009)+.008*(g(hx-.044,.023)+g(hx+.044,.023))*g(hy-.10,.018)+.009*p.lips*g(hx,.029)*g(hy-.051,.008)+.009*p.lips*g(hx,.029)*g(hy-.039,.007)-.006*g(hx,.027)*g(hy-.046,.0025);}
f=sm(f,section(head,hx,hy,hz,detail)*hs,.016);
const ax=Math.abs(x),lc=.084*p.hips+.018*(1-Math.min(1,y/legTop));
f=sm(f,section(legs,ax-lc,y,z),.027);
// Foot is a varying anatomical longitudinal section, not an attached primitive.
const foot=[[ -.061,.002,.002,.047],[-.045,.027,.035,.047],[0,.036,.041,.048],[.07,.039,.024,.03],[.14,.033,.016,.022],[.164,.002,.002,.022]];
f=sm(f,section(foot,ax-lc,z,y),.012);
const ay=1.363+dy-y, ac=.168*p.shoulders+.39*ay;
if(ay>-.09&&ay<.70)f=sm(f,section(arms,ax-ac,ay,z),.033);
// Four separated fingers, plus thumb, formed from tapered profile fields.
for(let i=0;i<4;i++){const sy=1.363+dy-.567, len=[.081,.094,.087,.068][i],t=sy-y, cx=.168*p.shoulders+.39*.59+(i-1.5)*.015+.22*t;
if(t>-.02&&t<len+.01){const r=.007*Math.sqrt(Math.max(.03,1-Math.pow(Math.max(0,t/len),4)));f=sm(f,Math.max(Math.hypot(ax-cx,z)-r,-t-.01,t-len),.009);}}
const tt=1.363+dy-.50-y;if(tt>0&&tt<.068){const tx=.168*p.shoulders+.39*.52-.041-.13*tt;f=sm(f,Math.max(Math.hypot(ax-tx,z-.007)-.010,-tt,tt-.064),.018);}
// Ear helix approximation using a profile with a recessed center.
const ey=(y-headBase)/hs-.12,ex=ax/hs-.078*fw;
if(Math.abs(ey)<.033&&Math.abs(ex)<.023)f=sm(f,Math.max(Math.hypot(ex/.019,ey/.031)-1,Math.abs(z/hs+.006)/.018-1)*.014,.009);
return f;
}};}
export function generate(params,res=96,face=false){const p=sanitize(params),{field,top,headBase}=createField(p),scale=p.height/top;const lo=face?[-.14,headBase-.035,-.13]:[-.47,-.015,-.19],hi=face?[.14,top+.025,.16]:[.47,top+.025,.23];const step=(hi[1]-lo[1])/res,nx=Math.ceil((hi[0]-lo[0])/step)+1,ny=res+1,nz=Math.ceil((hi[2]-lo[2])/step)+1,N=nx*ny*nz;const val=new Float32Array(N),idx=(x,y,z)=>(y*nz+z)*nx+x;
for(let y=0;y<ny;y++)for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)val[idx(x,y,z)]=field(lo[0]+x*step,lo[1]+y*step,lo[2]+z*step);
const verts=[],normals=[],colors=[];const cs=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],edges=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
const normalCache=new Map();
const emit=(a,b,c)=>{const center=a.map((v,i)=>(v+b[i]+c[i])/3),e=step*.24,n=[field(center[0]+e,center[1],center[2])-field(center[0]-e,center[1],center[2]),field(center[0],center[1]+e,center[2])-field(center[0],center[1]-e,center[2]),field(center[0],center[1],center[2]+e)-field(center[0],center[1],center[2]-e)];const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]),cr=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(cr.reduce((s,v,i)=>s+v*n[i],0)<0)[b,c]=[c,b];const nl=Math.hypot(...n)||1;
for(const q of [a,b,c]){verts.push(...q.map(v=>v*scale));const key=q.map(v=>v.toFixed(7)).join(',');let vn=normalCache.get(key);if(!vn){const e=step*.35;vn=[field(q[0]+e,q[1],q[2])-field(q[0]-e,q[1],q[2]),field(q[0],q[1]+e,q[2])-field(q[0],q[1]-e,q[2]),field(q[0],q[1],q[2]+e)-field(q[0],q[1],q[2]-e)];const len=Math.hypot(...vn)||1;vn=vn.map(v=>v/len);normalCache.set(key,vn);}normals.push(...vn);const h=(q[1]-headBase)/p.head,xx=q[0]/p.head;let col=[.70,.77,.76];if(q[2]>.038&&Math.abs(h-.137)<.009&&(Math.abs(xx-.033*p.eyes)<.014||Math.abs(xx+.033*p.eyes)<.014))col=[.18,.27,.29];if(q[2]>.064&&Math.abs(h-.046)<.003&&Math.abs(xx)<.024)col=[.36,.39,.39];colors.push(...col);}};
for(let y=0;y<ny-1;y++)for(let z=0;z<nz-1;z++)for(let x=0;x<nx-1;x++){const ds=cs.map(c=>val[idx(x+c[0],y+c[1],z+c[2])]);if(ds.every(v=>v>0)||ds.every(v=>v<=0))continue;const qs=cs.map(c=>[lo[0]+(x+c[0])*step,lo[1]+(y+c[1])*step,lo[2]+(z+c[2])*step]);for(const t of tets){const points=[];for(const [a,b] of edges){const ia=t[a],ib=t[b];if((ds[ia]<0)===(ds[ib]<0))continue;const f=ds[ia]/(ds[ia]-ds[ib]);points.push(qs[ia].map((v,i)=>v+f*(qs[ib][i]-v)));}if(points.length===3)emit(...points);else if(points.length===4){emit(points[0],points[1],points[2]);emit(points[1],points[3],points[2]);}}}
return {vertices:new Float32Array(verts),normals:new Float32Array(normals),colors:new Float32Array(colors),height:p.height,headY:(headBase+.13*p.head)*scale};}
export function toOBJ(mesh){const map=new Map(),vs=[],fs=[];for(let i=0;i<mesh.vertices.length;i+=9){const face=[];for(let j=0;j<9;j+=3){const xyz=Array.from(mesh.vertices.slice(i+j,i+j+3)),key=xyz.map(v=>v.toFixed(6)).join(' ');if(!map.has(key)){map.set(key,vs.length+1);vs.push(key);}face.push(map.get(key));}if(new Set(face).size===3)fs.push('f '+face.join(' '));}return '# FORM analytic implicit model; units meters\no human\n'+vs.map(v=>'v '+v).join('\n')+'\n'+fs.join('\n')+'\n';}
