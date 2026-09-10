import {generate} from './model.js';
onmessage=({data})=>{try{const m=generate(data.params,data.res,data.face);postMessage({id:data.id,mesh:m},[m.vertices.buffer,m.normals.buffer,m.colors.buffer]);}catch(e){postMessage({id:data.id,error:e.message});}};
