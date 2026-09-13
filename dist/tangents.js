// UV tangent basis for glTF normal maps and anisotropic materials. Tangent.w
// preserves mirrored-UV handedness; degenerate UVs get an orthogonal fallback.
export function makeTangents(part){
 const count=part.vertices.length/3,a=new Float64Array(count*3),b=new Float64Array(count*3),out=new Float32Array(count*4),p=part.vertices,uv=part.uvs;
 for(let j=0;j<part.indices.length;j+=3){const [i0,i1,i2]=part.indices.slice(j,j+3),du1=uv[i1*2]-uv[i0*2],dv1=uv[i1*2+1]-uv[i0*2+1],du2=uv[i2*2]-uv[i0*2],dv2=uv[i2*2+1]-uv[i0*2+1],det=du1*dv2-du2*dv1;if(Math.abs(det)<1e-12)continue;
  for(let k=0;k<3;k++){const x=p[i1*3+k]-p[i0*3+k],y=p[i2*3+k]-p[i0*3+k],u=(x*dv2-y*dv1)/det,v=(y*du1-x*du2)/det;for(const i of [i0,i1,i2]){a[i*3+k]+=u;b[i*3+k]+=v;}}
 }
 for(let i=0;i<count;i++){const n=Array.from(part.normals.slice(i*3,i*3+3)),d=n.reduce((s,x,k)=>s+x*a[i*3+k],0);let t=n.map((x,k)=>a[i*3+k]-x*d),length=Math.hypot(...t);
  if(length<1e-10){t=Math.abs(n[1])<.9?[n[2],0,-n[0]]:[0,-n[2],n[1]];length=Math.hypot(...t)||1;}t=t.map(x=>x/length);
  const c=[n[1]*t[2]-n[2]*t[1],n[2]*t[0]-n[0]*t[2],n[0]*t[1]-n[1]*t[0]],hand=c.reduce((s,x,k)=>s+x*b[i*3+k],0)<0?-1:1;out.set([...t,hand],i*4);
 }
 return out;
}
