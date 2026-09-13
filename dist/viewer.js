import {shaders} from './render-shaders.js';
import {poseAt,skinMatrices,identity} from './rig.js';
export class Viewer {
 constructor(canvas){
 this.canvas=canvas;this.gl=canvas.getContext('webgl',{antialias:true,alpha:true,preserveDrawingBuffer:true});const gl=this.gl;if(!gl)throw Error('WebGLを利用できません。Safariで開き直してください。');
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const highp=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT).precision>0,derivatives=highp&&!!gl.getExtension('OES_standard_derivatives');
 this.program=gl.createProgram();const source=shaders(highp,derivatives);gl.attachShader(this.program,shader(gl.VERTEX_SHADER,source[0]));gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,source[1]));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.disable(gl.DITHER);this.uniforms={};for(const k of ['yaw','pitch','zoom','aspect','target','expression','bones','roughness','baseMap','normalMap','textured','normalScale','alphaCutoff','anisotropy','clearcoat','shadowPass','shadowZoom','hasShadows','shadowMap'])this.uniforms[k]=gl.getUniformLocation(this.program,k==='bones'?'bones[0]':k);
 gl.uniform1i(this.uniforms.baseMap,0);gl.uniform1i(this.uniforms.normalMap,1);gl.uniform1i(this.uniforms.shadowMap,2);this.textures=[];this.anisotropySupported=derivatives;
 this.attributes={};for(const k of ['position','normal','color','joints','weights','blink','smile','mouth'])this.attributes[k]=gl.getAttribLocation(this.program,k);this.drawParts=[];
 this.shadowTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1024,1024,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
 for(const [key,value]of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,key,value);
 this.shadowDepth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,this.shadowDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,1024,1024);
 this.shadowFramebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFramebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.shadowTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.shadowDepth);
 this.shadowSupported=highp&&gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);

 }
 setMesh(mesh,wire=false){const gl=this.gl;for(const p of this.drawParts)for(const b of Object.values(p.buffers))gl.deleteBuffer(b);for(const t of this.textures)gl.deleteTexture(t);this.mesh=mesh;this.drawParts=[];this.wire=wire;this.lastExpression=null;
 this.textures=(mesh.textures||[]).map(a=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,a.width,a.height,0,gl.RGBA,gl.UNSIGNED_BYTE,a.pixels);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.generateMipmap(gl.TEXTURE_2D);return t;});
 if(!this.fallback){this.fallback=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.fallback);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);}
 const parts=mesh.parts||[{name:'Surface',group:'body',vertices:mesh.vertices,normals:mesh.normals,colors:mesh.colors,roughness:.6}];
 for(const p of parts){const indices=p.indices||Array.from({length:p.vertices.length/3},(_,i)=>i),order=[];for(let t=0;t<indices.length;t+=3){const [a,b,c]=[indices[t],indices[t+1],indices[t+2]];order.push(...(wire?[a,b,b,c,c,a]:[a,b,c]));}const buffers={},morphNormals={};let normalBase;
 for(const [name,key,size]of [['position','vertices',3],['normal','normals',3],['color','colors',3],['joints','joints',4],['weights','weights',4],['blink','blink',4],['smile','smile',4],['mouth','mouth',3]]){const values=new Float32Array(order.length*size),src=p[key],packed=name==='blink'||name==='smile',sourceSize=packed?3:size;for(let i=0;i<order.length;i++)for(let k=0;k<size;k++)values[i*size+k]=packed&&k===3?(p.uvs?.[order[i]*2+(name==='smile'?1:0)]||0):src?src[order[i]*sourceSize+k]:(name==='weights'&&k===0?1:0);buffers[name]=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffers[name]);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);if(name==='normal')normalBase=values;}
 for(const [key,src]of Object.entries(p.morphNormals||{})){const expanded=new Float32Array(order.length*3);for(let i=0;i<order.length;i++)for(let k=0;k<3;k++)expanded[i*3+k]=src[order[i]*3+k];morphNormals[key]=expanded;}
 this.drawParts.push({group:p.group,buffers,count:order.length,roughness:p.roughness,texture:p.texture,normalTexture:p.normalTexture,normalScale:p.normalScale||0,alphaCutoff:p.alphaCutoff||0,anisotropy:p.anisotropy||0,clearcoat:p.clearcoat||0,normalBase,normalWork:Object.keys(morphNormals).length?new Float32Array(normalBase.length):null,morphNormals});}
 }
 render(state){const gl=this.gl,c=this.canvas,dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(c.clientWidth*dpr)),h=Math.max(1,Math.round(c.clientHeight*dpr));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}gl.useProgram(this.program);gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!this.mesh)return;
 const sample=poseAt(state.pose,state.clip,state.time,state.expression),bones=this.mesh.rig?skinMatrices(this.mesh.rig,sample.rotations):new Float32Array(Array.from({length:17},identity).flat());if(!this.lastExpression||sample.expression.some((x,i)=>x!==this.lastExpression[i])){for(const p of this.drawParts)if(p.normalWork){p.normalWork.set(p.normalBase);for(const [key,src]of Object.entries(p.morphNormals)){const weight=sample.expression[['blink','smile','mouth'].indexOf(key)];if(weight)for(let i=0;i<src.length;i++)p.normalWork[i]+=src[i]*weight;}gl.bindBuffer(gl.ARRAY_BUFFER,p.buffers.normal);gl.bufferSubData(gl.ARRAY_BUFFER,0,p.normalWork);}this.lastExpression=[...sample.expression];}gl.uniformMatrix4fv(this.uniforms.bones,false,bones);gl.uniform3fv(this.uniforms.expression,sample.expression);gl.uniform1f(this.uniforms.target,state.mode==='face'?this.mesh.headY:this.mesh.height*.51);
 const views=state.multi?[{x:0,y:h/2,w:w/2,h:h/2,yaw:0},{x:w/2,y:h/2,w:w/2,h:h/2,yaw:Math.PI/2},{x:0,y:0,w:w/2,h:h/2,yaw:Math.PI},{x:w/2,y:0,w:w/2,h:h/2,yaw:-Math.PI/2}]:[{x:0,y:0,w,h,yaw:state.yaw}];

 for(const v of views){
  gl.uniform1f(this.uniforms.yaw,v.yaw);gl.uniform1f(this.uniforms.pitch,state.multi?0:state.pitch);gl.uniform1f(this.uniforms.zoom,state.zoom*(state.multi?.93:1));gl.uniform1f(this.uniforms.aspect,v.w/v.h);
  gl.uniform1f(this.uniforms.shadowZoom,state.mode==='face'?4.5:.8);
  const shadows=this.shadowSupported&&!this.wire;gl.uniform1f(this.uniforms.hasShadows,0);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.fallback);
  if(shadows){
   gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFramebuffer);gl.viewport(0,0,1024,1024);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(this.uniforms.shadowPass,1);this.drawGeometry(state);
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);
  }
  gl.uniform1f(this.uniforms.shadowPass,0);gl.uniform1f(this.uniforms.hasShadows,shadows?1:0);gl.viewport(v.x,v.y,v.w,v.h);this.drawGeometry(state);
 }
 }
 drawGeometry(state){const gl=this.gl;
 for(const p of this.drawParts){if(state.visibility?.[p.group]===false)continue;for(const [name,b] of Object.entries(p.buffers)){const a=this.attributes[name];if(a<0)continue;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,['joints','weights','blink','smile'].includes(name)?4:3,gl.FLOAT,false,0,0);}gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures[p.texture]||this.fallback);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.textures[p.normalTexture]||this.fallback);gl.uniform1f(this.uniforms.textured,!this.wire&&p.texture!==undefined?1:0);gl.uniform1f(this.uniforms.normalScale,this.wire?0:p.normalScale);gl.uniform1f(this.uniforms.alphaCutoff,this.wire?0:p.alphaCutoff);gl.uniform1f(this.uniforms.anisotropy,this.wire||!this.anisotropySupported?0:p.anisotropy);gl.uniform1f(this.uniforms.clearcoat,p.clearcoat);gl.uniform1f(this.uniforms.roughness,p.roughness);gl.drawArrays(this.wire?gl.LINES:gl.TRIANGLES,0,p.count);}
 }
}
