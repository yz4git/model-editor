import {generate} from './model.js';
import {generateDataModel} from './data-model.js';
onmessage=async({data})=>{try{let m;if(data.source==='data'){const r=await fetch('./base-model.json');if(!r.ok)throw Error('基準データを読み込めません');m=generateDataModel(await r.json(),data.params,data.face,data.res>96);}else m=generate(data.params,data.res,data.face);postMessage({id:data.id,mesh:m},[m.vertices.buffer,m.normals.buffer,m.colors.buffer]);}catch(e){postMessage({id:data.id,error:e.message});}};
