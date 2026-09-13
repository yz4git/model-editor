// Layered textured guide families. Static silhouette and clump overlap come first.
const mix=(a,b,t)=>a+(b-a)*t;
const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const cubic=(a,b,c,d)=>t=>a.map((x,i)=>x*(1-t)**3+3*b[i]*t*(1-t)**2+3*c[i]*t*t*(1-t)+d[i]*t**3);
const hash=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function buildHair(s,solid,cards,grid){
 if(s.hairStyle==='none')return;
 const vol=s.hairVolume,part=s.hairPart*.018,center=[0,.946,.032],radius=[.0495*vol,.0605*vol,.0605*vol];
 solid.texture=3;solid.anisotropy=.35;cards.texture=1;cards.normalTexture=2;cards.normalScale=.45;cards.alphaCutoff=.20;cards.anisotropy=.75;
 function scalp(p,lift=0,force=false){const d=p.map((x,i)=>(x-center[i])/radius[i]),n=Math.hypot(...d);return n<1+lift||force?p.map((x,i)=>center[i]+d[i]/Math.max(n,.001)*radius[i]*(1+lift)):p;}
 const radial=p=>norm(p.map((x,i)=>(x-center[i])/(radius[i]*radius[i])));
 grid(solid,24,96,(u,v)=>{const a=v*Math.PI*2,theta=.002+u*(1.48-Math.cos(a)*.46+.024*Math.sin(a*9)),r=1+.001*Math.sin(a*29);return [Math.sin(a)*Math.sin(theta)*radius[0]*r,center[1]+Math.cos(theta)*radius[1],center[2]+Math.cos(a)*Math.sin(theta)*radius[2]*r];},undefined,(u,v)=>[(v*12)%1,u]);
 function ribbon(path,width,tile,seed,{fitted=false,lift=.0007,normal=null,wisp=false}={}){
  const rows=wisp?24:32,frames=[];let previous=null;
  for(let i=0;i<=rows;i++){const u=i/rows,p=path(u),before=path(Math.max(0,u-.001)),after=path(Math.min(1,u+.001)),t=norm(after.map((x,k)=>x-before[k]));
   let n=fitted?radial(p):previous?cross(previous,t):normal||radial(p);
   n=norm(n.map((x,k)=>x-t[k]*dot(n,t)));let across=norm(cross(t,n));
   if(previous&&dot(across,previous)<0){across=across.map(x=>-x);n=n.map(x=>-x);}previous=across;frames.push({p,n,across});
  }
  const offset=cards.vertices.length/3;
  grid(cards,rows,4,(u,v)=>{const {p,n,across}=frames[Math.round(u*rows)],taper=(.74+.26*Math.sin(u*Math.PI))*(1-.22*u),w=width*taper,arch=width*.04*(1-(v*2-1)**2),q=p.map((x,k)=>x+across[k]*(v-.5)*w*2+n[k]*(lift+arch));return fitted?scalp(q,.006):q;},undefined,(u,v)=>[(tile+.015+v*.97)/4,u*.997]);
  for(let i=0;i<=rows;i++)for(let j=0;j<=4;j++){const u=i/rows,shade=(.77+.23*Math.min(1,u*5))*(.88+.18*hash(seed));for(let k=0;k<3;k++)cards.colors[(offset+i*5+j)*3+k]*=shade;}
 }
 function stack(path,width,seed,options={}){for(let layer=0;layer<3;layer++)ribbon(path,width*(1-layer*.10),layer===2?1:0,seed+layer,{...options,lift:(options.lift||.0006)+layer*.0003});}
 const fringeGuides=[
  [-.026,.985,.061,-.045,.966,.084,-.049,.939,.078,.0070],
  [-.015,1.001,.047,-.018,.976,.091,-.036,.946,.091,.0100],
  [-.006,1.006,.036,.009,.983,.091,-.018,.939,.096,.0120],
  [.006,1.006,.035,.031,.983,.091,.008,.942,.098,.0130],
  [.015,1.001,.042,.045,.976,.086,.027,.951,.090,.0100],
  [.026,.992,.054,.053,.970,.076,.045,.946,.079,.0080],
 ];
 if(s.fringe>.005)fringeGuides.forEach((g,i)=>{const [rx,ry,rz,cx,cy,cz,tx,ty,tz,width]=g,root=[part+rx*.47,ry,rz],tip=[tx,ty+(.45-s.fringe)*.037,tz],path=cubic(root,[part+rx*.9,1.010-Math.abs(rx)*.4,.073],[cx,cy,cz],tip);stack(u=>scalp(path(u),.012),width*vol,i,{fitted:true});ribbon(u=>scalp(path(u),.03),width*.83,2,i+31,{fitted:true,lift:.0022});});
 // Crown and temples sweep toward the tie, rather than forming a smooth cap.
 for(const side of [-1,1])for(let i=0;i<16;i++){
  const q=i/15,root=[part+side*(.001+q*.013),1.006-q*.025,.048-q*.068],control=[side*(.042+q*.008),.999-q*.029,.067-q*.084],temple=[side*(.051-q*.013),.951-q*.013,.022-q*.048],end=s.hairStyle==='ponytail'?[side*.006,.974,-.030]:[side*(.045-q*.02),.930-s.hairLength*.012,.026-q*.063];
  const raw=cubic(root,control,temple,end),path=u=>scalp(raw(u),.017+hash(i)*.008,true);stack(path,(.0068+hash(i+4)*.0022)*vol,i+40,{fitted:true,lift:.0005+q*.0004});
 }
 // Hairline sweeps fill the sides and nape, travelling upward into the tie.
 if(s.hairStyle==='ponytail')for(let i=0;i<38;i++){
  const az=.78+i/37*(Math.PI*2-1.56),theta=1.55-Math.cos(az)*.50+(hash(i)-.5)*.065,side=Math.sign(Math.sin(az)),root=[Math.sin(az)*Math.sin(theta)*radius[0],center[1]+Math.cos(theta)*radius[1],center[2]+Math.cos(az)*Math.sin(theta)*radius[2]],raw=cubic(root,[root[0]*1.04,root[1]+.010,root[2]-.014],[side*.035,.968,-.025],[side*.005,.975,-.031]);
  stack(u=>scalp(raw(u),.012+hash(i)*.006,true),.0065*vol,i+190,{fitted:true,lift:.0006});
 }
 if(s.hairStyle==='ponytail'){
  for(let layer=0;layer<3;layer++)for(let i=0;i<16;i++){
   const a=i/16*Math.PI*2+layer*.21,dx=Math.cos(a),dz=Math.sin(a),r=(.009+layer*.004)*vol,spread=1+s.hairSpread*.7,tip=.787-s.hairLength*.10+hash(i+layer*17)*.037;
   const raw=cubic([dx*.005,.977,-.031+dz*.005],[dx*r*1.7,.997,-.079+dz*r],[.008+dx*r*spread,.875,-.105+dz*r*spread],[.014+dx*r*.65,tip,-.077+dz*r*.8]);
   const path=u=>{const q=raw(u),wave=Math.sin(u*Math.PI*2+hash(i)*2)*u*u;return [q[0]+wave*.004,q[1],q[2]+wave*.002];};
   ribbon(path,(layer===0?.0105:.007)*vol,layer===2?1:0,i+layer*17,{normal:[dx,0,dz],lift:0});if(layer===2)ribbon(path,.0055*vol,2,i+81,{normal:[dx,0,dz],lift:.0008});
  }
  // Compact hair-wrapped tie, with a continuous ring around the gathering.
  grid(solid,10,48,(u,v)=>{const a=v*Math.PI*2,b=u*Math.PI*2,r=.0118+.0018*Math.cos(b);return [Math.sin(a)*r,.977+Math.cos(a)*r,-.035+Math.sin(b)*.0018];},undefined,(u,v)=>[v,u]);
 }else if(s.hairStyle==='bob')for(let i=0;i<30;i++){const a=.83+i/29*(Math.PI*2-1.66),x=Math.sin(a),z=Math.cos(a),raw=cubic([x*.031,.990,.032+z*.034],[x*.055,.957,.032+z*.061],[x*(.053+s.hairSpread*.009),.908,.032+z*.066],[x*.043,.886-s.hairLength*.052+hash(i)*.012,.032+z*.050]);stack(raw,.008*vol,i+120,{normal:[x,0,z]});}
 for(const side of [-1,1])for(let i=0;i<7;i++){const x=side*(.039+i*.0015),path=cubic([x,.978-i*.002,.066],[x+side*.009,.962,.076],[x+side*.01,.934,.080],[x-side*.003,.906-s.hairLength*.026+i*.003,.070]);ribbon(path,.0032+s.flyaways*.002,2,i+140,{normal:[side*.45,0,1]});}
 if(s.flyaways>.01)for(let i=0;i<20;i++){const a=.65+i/19*5,dx=Math.sin(a),dz=Math.cos(a),raw=cubic([part+dx*.011,1.005,.032],[dx*.042,1.014+s.flyaways*.004,.032+dz*.038],[dx*.055,.973,.032+dz*.063],[dx*.05,.947-hash(i)*.016,.032+dz*.06]);ribbon(raw,.0018*s.flyaways,3,i+160,{normal:[dx,.2,dz],wisp:true});}
}
