// Authored guide families: fitted scalp, flattened volume locks, layered cards.
// All points are transformed by the same head deformation as the face.
const mix=(a,b,t)=>a*(1-t)+b*t;
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const curve=(a,b,c,d)=>t=>a.map((v,i)=>v*(1-t)**3+3*b[i]*t*(1-t)**2+3*c[i]*t*t*(1-t)+d[i]*t**3);
export function buildHair(s,solid,cards,grid){
 if(s.hairStyle==='none')return;
 const vol=s.hairVolume,part=s.hairPart*.021;
 const onScalp=(path,force=false)=>u=>{const p=path(u),center=[0,.946,.034],r=[.050*vol,.061*vol,.061*vol],q=p.map((x,i)=>(x-center[i])/r[i]),d=Math.hypot(...q);return d<1.017||force?p.map((x,i)=>center[i]+q[i]/Math.max(d,.001)*r[i]*1.017):p;};
 solid.texture=3;solid.normalTexture=2;solid.normalScale=.35;solid.anisotropy=.45;
 cards.texture=1;cards.normalTexture=2;cards.normalScale=.65;cards.alphaCutoff=.36;cards.anisotropy=.7;
 grid(solid,28,96,(u,v)=>{const az=v*Math.PI*2,front=Math.cos(az),limit=1.70-front*.6+.024*Math.sin(az*7),theta=.006+u*limit,ridge=1+.004*Math.sin(az*39+u*4);return [Math.sin(az)*Math.sin(theta)*.050*vol*ridge,.946+Math.cos(theta)*.061*vol,.034+Math.cos(az)*Math.sin(theta)*.061*vol*ridge];},undefined,(u,v)=>[(v*16)%1*.245+.002,u*.92]);
 function lock(path,width,seed,volume=true,fly=false){
  const frame=u=>{const p=path(u),d=norm(path(Math.min(1,u+.001)).map((x,i)=>x-path(Math.max(0,u-.001))[i])),axis=Math.abs(d[1])>.9?[0,0,1]:[0,1,0],n=norm(cross(d,axis)),b=norm(cross(n,d));return {p,n,b};};
  const taper=u=>(.82+.18*Math.sin(u*Math.PI))*(1-.98*u**3);
  if(volume)grid(solid,18,8,(u,v)=>{const {p,n,b}=frame(u),a=v*Math.PI*2,w=width*taper(u);return p.map((x,i)=>x+w*(n[i]*Math.cos(a)+b[i]*Math.sin(a)*.23));},undefined,(u,v)=>[.002+v*.244,u*.92]);
  const layers=fly?1:2;for(let layer=0;layer<layers;layer++){const angle=layer?-.28:.24,tile=fly?3:seed%3;grid(cards,volume?20:10,3,(u,v)=>{const {p,n,b}=frame(u),spread=(v-.5)*2*width*(fly?.85:1.10)*(1-u*.30),offset=width*.27+.00025;return p.map((x,i)=>x+spread*(n[i]*Math.cos(angle)+b[i]*Math.sin(angle))+b[i]*offset);},undefined,(u,v)=>[(tile+.015+v*.97)/4,u*.999]);}
 }
 // Swept, overlapping bangs; length changes at the tip, roots retain the part.
 if(s.fringe>.005)for(let i=0;i<15;i++){const q=(i-7)/7,x=q*.042,side=Math.abs(q),root=part+x*.40,tipX=x+.007*(1-side),endY=.951-s.fringe*.038+side*.017;
  lock(onScalp(curve([root,1.003-side*.010,.030],[x*.8+.008,1.004-side*.017,.071],[x+.011,.957,.092-side*.015],[tipX,endY,.090-side*.019])),(.0056+.001*Math.sin(i*3))*vol,i);}
 // Crown layers flow from the part toward the temples and the tie/back.
 for(const side of [-1,1])for(let i=0;i<10;i++){const a=1.08+i*.205,z=.034+Math.cos(a)*.058*vol,x=side*Math.sin(a)*.049*vol;
  const end=s.hairStyle==='ponytail'?[side*.010,.976,-.027]:[x,.917-s.hairLength*.035,z];
  lock(onScalp(curve([part+side*.006,1.005,.030-i*.003],[side*.043,1.006,.052-i*.008],[x,.955,z],end),true),.0072*vol,i+3);}
 if(s.hairStyle==='ponytail'){
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=.012*vol,dx=Math.cos(a)*r,dz=Math.sin(a)*r,spread=s.hairSpread,tip=.792-s.hairLength*.105+(i%5)*.002;
   lock(curve([dx*.5,.977,-.022+dz*.5],[dx*1.4,.981,-.092+dz],[.009+dx*(1+spread),.863,-.094+dz],[.007+dx*(.4+spread),tip,-.067+dz*.8]),.0072*vol,i);}
 }else if(s.hairStyle==='bob')for(let i=0;i<22;i++){const a=.85+i/21*(Math.PI*2-1.7),x=Math.sin(a),z=Math.cos(a);lock(curve([x*.025,.991,.034+z*.032],[x*.053,.964,.034+z*.062],[x*(.053+s.hairSpread*.005),.902,.034+z*.064],[x*.046,.881-s.hairLength*.050+(i%3)*.002,.034+z*.052]),.0085*vol,i);}
 // Closely spaced short edge cards soften the scalp's silhouette.
 for(let i=0;i<56;i++){const az=.72+i/55*(Math.PI*2-1.44),front=Math.cos(az),limit=1.70-front*.6+.024*Math.sin(az*7);const path=u=>{const theta=limit-.14+u*.26,a=az+Math.sin(u*Math.PI)*.018;return [Math.sin(a)*Math.sin(theta)*.0505*vol,.946+Math.cos(theta)*.0615*vol,.034+Math.cos(a)*Math.sin(theta)*.0615*vol];};lock(path,.0025,i,false,false);}
 // Wisps frame the cheeks; sparse atlas makes individual tapered strands.
 for(const side of [-1,1])for(let i=0;i<4;i++){const x=side*(.042+i*.002),length=.042+s.hairLength*.030;lock(curve([x,.977,.071],[x+side*.009,.955,.081],[x+side*.007,.931,.081],[x-side*.002,.952-length-i*.003,.072]),.0025+s.flyaways*.0025,i,false,true);}
 if(s.flyaways>.01)for(let i=0;i<8;i++){const a=i*Math.PI/4,side=Math.sin(a),z=Math.cos(a);lock(curve([part+side*.011,1.005,.034],[side*.040,1.016+s.flyaways*.005,.034+z*.035],[side*.055,.976,.034+z*.062],[side*.052,.951,.034+z*.061]),.0018*s.flyaways,i,false,true);}
}
