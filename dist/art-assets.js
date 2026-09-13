// Generated source images are loaded once in the geometry worker. All exported
// maps are sampled from these same pixels; no network assets are needed by GLB.
let sources=null,pending=null;
export function installArtAssets(images){sources=images;}
export function getArtAssets(){return sources;}
export async function loadArtAssets(){
 if(sources)return sources;
 if(!pending)pending=Promise.all(['iris','hair-atlas'].map(async name=>{
  const r=await fetch(new URL('./assets/'+name+'.png',import.meta.url));
  if(!r.ok)throw Error('目・髪の素材を読み込めません。再読み込みしてください。');
  const bitmap=await createImageBitmap(await r.blob(),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
  const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(bitmap,0,0);bitmap.close();
  return {width:canvas.width,height:canvas.height,pixels:new Uint8Array(ctx.getImageData(0,0,canvas.width,canvas.height).data)};
 })).then(images=>(sources=images)).catch(e=>{pending=null;throw e;});
 return pending;
}
export function sampleImage(image,u,v){
 const x=Math.max(0,Math.min(image.width-1,u*image.width-.5)),y=Math.max(0,Math.min(image.height-1,v*image.height-.5));
 const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,x1=Math.min(x0+1,image.width-1),y1=Math.min(y0+1,image.height-1);
 return [0,1,2,3].map(k=>((image.pixels[(y0*image.width+x0)*4+k]*(1-fx)+image.pixels[(y0*image.width+x1)*4+k]*fx)*(1-fy)+(image.pixels[(y1*image.width+x0)*4+k]*(1-fx)+image.pixels[(y1*image.width+x1)*4+k]*fx)*fy)/255);
}
