// Independent PNG decoding for the checked-in 8-bit RGBA source assets.
import fs from 'node:fs';
import {inflateSync} from 'node:zlib';
import {installArtAssets} from '../dist/art-assets.js';
function readPNG(path){
 const b=fs.readFileSync(path),chunks=[];let width,height;
 for(let i=8;i<b.length;){const n=b.readUInt32BE(i),type=b.toString('ascii',i+4,i+8),data=b.subarray(i+8,i+8+n);if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||data[9]!==6||data[12]!==0)throw Error('Expected 8-bit RGBA, non-interlaced PNG');}if(type==='IDAT')chunks.push(data);i+=n+12;}
 const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=new Uint8Array(stride*height);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const f=raw[y*(stride+1)];if(f>4)throw Error('Invalid PNG filter');for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=4?pixels[i-4]:0,b=y?pixels[i-stride]:0,c=y&&x>=4?pixels[i-stride-4]:0;pixels[i]=raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][f];}}
 return {width,height,pixels};
}
installArtAssets(['iris','hair-atlas'].map(name=>readPNG(new URL('../dist/assets/'+name+'.png',import.meta.url))));
