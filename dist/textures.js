import {getArtAssets,sampleImage} from './art-assets.js';
// Authored image assets, with deterministic UV remapping for iris/pupil edits.
// Rows follow glTF's top-left image origin; the WebGL upload does not flip them.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const noise=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
function asset(name,width,height,sample){const pixels=new Uint8Array(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels.set(sample((x+.5)/width,(y+.5)/height,x,y).map(v=>Math.round(clamp(v)*255)),(y*width+x)*4);return {name,width,height,pixels};}
let cachedKey,cachedTextures,cachedHair,cachedHairSource;
export function makeTextures(s){
 const sources=getArtAssets(),key=[s.irisColor,s.irisSize,s.pupilSize,!!sources].join();if(key===cachedKey)return cachedTextures;
 const iris=rgb(s.irisColor),radius=.235*s.irisSize,pupil=radius*.39*s.pupilSize;
 const eye=asset('Iris and sclera',512,512,(u,v,x,y)=>{const dx=u-.5,dy=v-.5,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),edge=smooth(radius-.003,radius+.003,r),inner=smooth(pupil-.002,pupil+.003,r),limbus=1-.65*smooth(radius*.82,radius,r);
  const fibers=.72+.14*Math.sin(a*151+Math.sin(r*185)*1.6)+.10*Math.sin(a*263-r*160)+.04*noise(x,y),collar=Math.exp(-(((r-pupil*1.28)/(radius*.13))**2)),white=[.89,.88,.84],vein=Math.pow(Math.max(0,Math.sin(a*19+Math.sin(r*70)*2)),28)*smooth(radius*1.5,.55,r)*.06;
  const radial=r<pupil?r/pupil*.134:.134+(r-pupil)/Math.max(.001,radius-pupil)*(.465-.134),art=sources?sampleImage(sources[0],.5+Math.cos(a)*radial,.5+Math.sin(a)*radial):null;
  return [...iris.map((c,k)=>{const hue=art?art[k]*Math.pow(c/[.38,.40,.31][k],.7):c*fibers*limbus+collar*[.11,.065,.02][k],value=.004*(1-inner)+hue*inner;return value*(1-edge)+(white[k]-vein*(k===0?.2:1))*edge;}),1];});
 if(cachedHair&&cachedHairSource===sources){cachedKey=key;cachedTextures=[eye,...cachedHair];return cachedTextures;}
 const hair=asset('Authored hair card atlas',1024,1024,(u,v)=>{const tile=Math.min(3,Math.floor(u*4)),x=u*4-tile;
  if(sources){const art=sampleImage(sources[1],u,.025+v*.95),gray=(art[0]+art[1]+art[2])/3;return [gray,gray,gray,art[3]*smooth(0,.025,x)*(1-smooth(.975,1,x))*smooth(0,.13,v)];}
  const count=[53,34,19,9][tile];let coverage=0,value=0;
  for(let j=0;j<count;j++){const seed=noise(j,tile+1),root=(j+.5)/count,end=.50+(root-.5)*(.3+.5*seed),bend=Math.sin(v*Math.PI)*(seed-.5)*.095,center=root*(1-v*.65)+end*v*.65+bend,tip=.65+.35*noise(j+71,tile),width=(.0025+.003*seed)*(1-smooth(.35,tip,v)),line=(1-smooth(width*.45,width+.0014,Math.abs(x-center)))*(1-smooth(tip-.06,tip,v));coverage=Math.max(coverage,line);value=Math.max(value,line*(.63+.34*seed));}
  const rootShade=.73+.27*smooth(0,.35,v);const shade=(.66+.34*value)*rootShade;return [shade,shade,shade,coverage];});
 const normal=asset('Hair normals from strand detail',1024,1024,(u,v)=>{const height=(a,b)=>{const q=sampleImage(hair,a,b);return q[0]*q[3];},nx=(height(u-1/1024,v)-height(u+1/1024,v))*.8,ny=(height(u,v-1/1024)-height(u,v+1/1024))*.4,n=Math.hypot(nx,ny,1);return [nx/n*.5+.5,ny/n*.5+.5,1/n*.5+.5,1];});
 const mass=asset('Scalp undercoat',256,512,(u,v)=>{const q=sampleImage(hair,(.27+u*.46)/4,.05+v*.7),shade=.55+.30*q[0];return [shade,shade,shade,1];});
 cachedHair=[hair,normal,mass];cachedHairSource=sources;cachedKey=key;cachedTextures=[eye,...cachedHair];return cachedTextures;
}
// Small lossless PNG encoder using valid stored DEFLATE blocks. Synchronous in
// browsers and Node, so exported GLB contains the exact pixels used by preview.
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const u32=n=>new Uint8Array([n>>>24,n>>>16&255,n>>>8&255,n&255]);
function concat(arrays){const out=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let i=0;for(const a of arrays){out.set(a,i);i+=a.length;}return out;}
function chunk(type,data){const t=new TextEncoder().encode(type),body=concat([t,data]);let crc=0xffffffff;for(const b of body)crc=crcTable[(crc^b)&255]^(crc>>>8);return concat([u32(data.length),body,u32((crc^0xffffffff)>>>0)]);}
export function texturePNG({width,height,pixels}){const stride=width*4+1,raw=new Uint8Array(stride*height);for(let y=0;y<height;y++)raw.set(pixels.subarray(y*width*4,(y+1)*width*4),y*stride+1);
 const blocks=[new Uint8Array([0x78,0x01])];for(let i=0;i<raw.length;i+=65535){const n=Math.min(65535,raw.length-i);blocks.push(new Uint8Array([i+n===raw.length?1:0,n&255,n>>>8,(~n)&255,((~n)>>>8)&255]),raw.subarray(i,i+n));}let a=1,b=0;for(const v of raw){a=(a+v)%65521;b=(b+a)%65521;}blocks.push(u32(((b<<16)|a)>>>0));
 return concat([new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',concat([u32(width),u32(height),new Uint8Array([8,6,0,0,0])])),chunk('IDAT',concat(blocks)),chunk('IEND',new Uint8Array())]);}
