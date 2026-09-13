// Replace the closed MakeHuman orbital cavity with an actual opening and a
// continuous annular lid. The outside rim uses the original head boundary.
const mix=(a,b,t)=>a+(b-a)*t;
const blend=(a,b,t)=>a.map((x,k)=>mix(x,b[k],t));
const tau=Math.PI*2;
export function cutEyeSockets(t){
 const removed=t.faces.map((f,i)=>{if(t.materials[i])return false;const c=[0,1,2].map(k=>f.reduce((n,j)=>n+t.sourceVertices[j][k],0)/3);return ((Math.abs(c[0])-.018474)/.014)**2+((c[1]-.927537)/.0105)**2<1&&c[2]>.07;});
 const edges=new Map();t.faces.forEach((f,i)=>{if(removed[i]||t.materials[i])return;for(let j=0;j<3;j++){const a=f[j],b=f[(j+1)%3],key=a<b?a+','+b:b+','+a;const old=edges.get(key);edges.set(key,old?{...old,count:old.count+1}:{a,b,count:1});}});
 const graph=new Map();for(const {a,b,count}of edges.values())if(count===1){if(!graph.has(a))graph.set(a,[]);if(!graph.has(b))graph.set(b,[]);graph.get(a).push(b);graph.get(b).push(a);}
 const seen=new Set(),loops=[];for(const start of graph.keys()){if(seen.has(start))continue;const loop=[];let at=start,prev=-1;while(!seen.has(at)){seen.add(at);loop.push(at);const next=graph.get(at).find(x=>x!==prev);prev=at;at=next;if(at===undefined)break;}if(loop.length>8&&loop.reduce((s,i)=>s+t.sourceVertices[i][2],0)/loop.length>.078)loops.push(loop);}
 if(loops.length!==2)throw Error('目の接続形状を生成できません。');
 return {removed,loops};
}
export function buildEyes(s,t,sockets,parts,grid,transform){
 const eyes=parts[2],lids=parts[4],rims=parts[6],lashes=parts[7],ducts=parts[8];eyes.tint=[1,1,1];eyes.texture=0;eyes.clearcoat=1;eyes.clearcoatRoughness=.025;eyes.eye=true;
 const boundaryNormals=[],closures=[];
 for(const loop of sockets.loops){
  const side=Math.sign(t.sourceVertices[loop[0]][0]),eye=[side*.018474,.927537,.0755],R=.0108;
  // Front bulge carries a clear coat, the textured iris sits within the sclera.
  grid(eyes,48,80,(u,v)=>{const theta=.0001+u*(Math.PI-.0002),a=v*tau,f=Math.cos(theta);return [eye[0]+Math.sin(theta)*Math.sin(a)*R,eye[1]+Math.sin(theta)*Math.cos(a)*R,eye[2]+f*R+Math.max(0,f)**18*.00065];},undefined,(u,v)=>[.5+Math.sin(u*Math.PI)*Math.sin(v*tau)*.5,.5-Math.sin(u*Math.PI)*Math.cos(v*tau)*.5]);
  // Sort the front boundary in screen angle. Each subdivided edge remains on
  // the original edge, avoiding floating patches or a second skin surface.
  const ordered=[...loop].reverse(),first=t.sourceVertices[ordered[0]],start=Math.atan2(first[1]-eye[1],first[0]-eye[0]),distances=[0];
  for(let j=0;j<ordered.length;j++){const a=t.sourceVertices[ordered[j]],b=t.sourceVertices[ordered[(j+1)%ordered.length]];distances.push(distances[j]+Math.hypot(b[0]-a[0],b[1]-a[1]));}
  const perimeter=distances.at(-1),sorted=ordered.map((i,j)=>({i,a:start+distances[j]/perimeter*tau})),n=sorted.length,cols=n*3;
  function boundary(v){const q=v*n,j=Math.min(n-1,Math.floor(q)),f=q-j,a=sorted[j],b=sorted[(j+1)%n];return {p:blend(t.sourceVertices[a.i],t.sourceVertices[b.i],f),angle:mix(a.a,b.a+(j===n-1?tau:0),f),normal:blend(t.normals[a.i],t.normals[b.i],f)};}
  function margin(angle,closed=false){const x=Math.cos(angle)*.0099,arc=Math.abs(Math.sin(angle)),upper=Math.sin(angle)>0,y=(closed?-.00045:upper?.00415:-.0031)*arc+side*x*.055;return [eye[0]+x,eye[1]+y,eye[2]+Math.sqrt(Math.max(.000002,R*R-x*x-y*y))+.00085];}
  function point(u,v,closed=false){const b=boundary(v),edge=margin(b.angle,closed),p=blend(b.p,edge,u),dx=p[0]-eye[0],dy=p[1]-eye[1],sphere=eye[2]+Math.sqrt(Math.max(.000001,R*R-dx*dx-dy*dy))+.00085;
   // Match the skin's outer tangent, then wrap the tarsal plate around the
   // globe. Covering the corneal bulge also prevents pupil leakage on blink.
   const d=edge.map((x,k)=>x-b.p[k]),nz=Math.max(.25,Math.abs(b.normal[2])),outerSlope=-(b.normal[0]*d[0]+b.normal[1]*d[1])/nz,ex=edge[0]-eye[0],ey=edge[1]-eye[1],innerSlope=-(ex*d[0]+ey*d[1])/Math.sqrt(Math.max(.000005,R*R-ex*ex-ey*ey));
   const u2=u*u,u3=u2*u,z=(2*u3-3*u2+1)*b.p[2]+(u3-2*u2+u)*outerSlope+(-2*u3+3*u2)*edge[2]+(u3-u2)*innerSlope;
   const inside=R*R-dx*dx-dy*dy;
   p[2]=inside>0?Math.max(z,sphere):z;
   // Keep every original boundary edge exact.
   if(u===0)p[2]=b.p[2];return p;
  }
  const morph=(a,u,v)=>[transform(point(u,v,true)).map((x,k)=>x-transform(a)[k]),[0,0,0],[0,0,0]],offset=lids.vertices.length/3;
  grid(lids,14,cols,(u,v)=>point(u,v),morph);
  for(let j=0;j<=cols;j++)boundaryNormals.push({index:offset+j,normal:boundary(j/cols).normal});
  for(let j=0;j<=cols;j++)closures.push({index:offset+14*(cols+1)+j,side});
  // Subtle crease tint is baked into COLOR_0 and follows the same morph.
  for(let i=0;i<=14;i++)for(let j=0;j<=cols;j++){const a=boundary(j/cols).angle,u=i/14,crease=Math.max(0,Math.sin(a))*Math.exp(-(((u-.37)/.13)**2))*.12,water=.06*Math.exp(-(((u-.94)/.06)**2));for(let k=0;k<3;k++)lids.colors[(offset+i*(cols+1)+j)*3+k]*=1-crease-water*[.15,1,1.05][k];}
  const rim=(u,v,closed)=>{const a=v*tau,p=margin(a,closed),r=.00019*Math.abs(Math.sin(a)),angle=u*tau;return [p[0],p[1]+Math.cos(angle)*r,p[2]+Math.sin(angle)*r];};
  grid(rims,6,96,(u,v)=>rim(u,v,false),(a,u,v)=>[transform(rim(u,v,true)).map((x,k)=>x-transform(a)[k]),[0,0,0],[0,0,0]]);
  if(s.lashLength>.005&&s.lashDensity>.005)for(const upper of [true,false]){
   const count=Math.round((upper?50:25)*(.35+s.lashDensity*.8));
   for(let j=0;j<count;j++){const q=.06+.88*(j+.5)/count,angle=(upper?q:1+q)*Math.PI,outer=(side>0?Math.cos(angle):-Math.cos(angle))*.5+.5,seed=(Math.sin(j*127.1+side*17)*43758.5)%1,len=(upper?.0018:.00065)*( .3+s.lashLength*1.5)*(.6+outer*.6)*( .8+Math.abs(seed)*.4),width=upper?.000105:.000065;
    const lash=(u,v,closed)=>{const p=margin(angle,closed),dir=upper?1:-1,fan=Math.cos(angle)*len*.5,rotate=closed&&upper?-1:1;return [p[0]+fan*u+(v-.5)*width*(1-u*.95),p[1]+dir*len*(u*.18+u*u*.82)*rotate,p[2]+len*(u*.7-u*u*.25)+.00015];};
    grid(lashes,6,1,(u,v)=>lash(u,v,false),(a,u,v)=>[transform(lash(u,v,true)).map((x,k)=>x-transform(a)[k]),[0,0,0],[0,0,0]]);
   }
  }
  grid(ducts,10,18,(u,v)=>{const theta=.0001+u*(Math.PI-.0002),a=v*tau;return [eye[0]-side*.0101+Math.sin(theta)*Math.sin(a)*.00065,eye[1]-.0005+Math.cos(theta)*.0005,eye[2]+.0059+Math.sin(theta)*Math.cos(a)*.00065];});
 }
 for(const p of [eyes,lids])for(let i=0;i<p.indices.length;i+=3)[p.indices[i+1],p.indices[i+2]]=[p.indices[i+2],p.indices[i+1]];
 lids.boundaryNormals=boundaryNormals;lids.closureVertices=closures;
}
