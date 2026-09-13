import {generate} from './model.js';
import {buildCharacter} from './character.js';
import {loadArtAssets} from './art-assets.js';
let basePromise;
onmessage=async({data})=>{try{let m;if(data.source==='data'){
 basePromise??=fetch('./base-model.json').then(r=>{if(!r.ok)throw Error('基準データを読み込めません');return r.json();}).catch(e=>{basePromise=null;throw e;});
 const [base]=await Promise.all([basePromise,loadArtAssets()]);m=buildCharacter(base,data.params,data.studio,data.face,data.res>96);
 }else m=generate(data.params,data.res,data.face);const transfers=new Set([m.vertices.buffer,m.normals.buffer,m.colors.buffer]);for(const part of m.parts||[]){for(const v of Object.values(part))if(ArrayBuffer.isView(v))transfers.add(v.buffer);for(const v of Object.values(part.morphNormals||{}))transfers.add(v.buffer);}postMessage({id:data.id,mesh:m},[...transfers]);}catch(e){postMessage({id:data.id,error:e.message});}};
