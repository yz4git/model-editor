export function shaders(highp,derivatives){return [`
attribute vec3 position,normal,color,mouth;attribute vec4 joints,weights,blink,smile;
uniform mat4 bones[17];uniform vec3 expression;uniform float yaw,pitch,zoom,aspect,target,shadowPass,shadowZoom;
varying ${highp?'highp':'mediump'} vec3 N,C,P;varying ${highp?'highp':'mediump'} vec2 UV;
vec3 lightPosition(vec3 p){vec3 l=normalize(vec3(-.5,.8,1.)),r=normalize(cross(vec3(0.,1.,0.),l)),u=cross(l,r);return vec3(dot(p,r),dot(p,u),dot(p,l));}
void main(){
 mat4 skin=bones[int(joints.x)]*weights.x+bones[int(joints.y)]*weights.y+bones[int(joints.z)]*weights.z+bones[int(joints.w)]*weights.w;
 vec3 v=position+blink.xyz*expression.x+smile.xyz*expression.y+mouth*expression.z;
 mat3 ry=mat3(cos(yaw),0.,-sin(yaw),0.,1.,0.,sin(yaw),0.,cos(yaw));mat3 rx=mat3(1.,0.,0.,0.,cos(pitch),sin(pitch),0.,-sin(pitch),cos(pitch));
 P=rx*ry*((skin*vec4(v,1.)).xyz-vec3(0.,target,0.));N=rx*ry*(skin*vec4(normal,0.)).xyz;C=color;UV=vec2(blink.w,smile.w);
 vec3 q=lightPosition(P);gl_Position=shadowPass>.5?vec4(q.xy*shadowZoom,-q.z*.5,1.):vec4(P.x*zoom/aspect,P.y*zoom,P.z*-.25,1.);
}`,`${derivatives?'#extension GL_OES_standard_derivatives : enable\n':''}precision ${highp?'highp':'mediump'} float;
varying vec3 N,C,P;varying vec2 UV;
uniform sampler2D baseMap,normalMap,shadowMap;uniform float textured,normalScale,alphaCutoff,roughness,anisotropy,clearcoat,shadowPass,shadowZoom,hasShadows;
vec3 srgb(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
vec3 lightPosition(vec3 p){vec3 l=normalize(vec3(-.5,.8,1.)),r=normalize(cross(vec3(0.,1.,0.),l)),u=cross(l,r);return vec3(dot(p,r),dot(p,u),dot(p,l));}
float visibility(vec3 n){
 if(hasShadows<.5)return 1.;vec3 q=lightPosition(P);vec2 uv=q.xy*shadowZoom*.5+.5;if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return 1.;
 float depth=.5-q.z*.25,bias=(.00030+.00060*(1.-max(dot(n,normalize(vec3(-.5,.8,1.))),0.)))*(4.5/shadowZoom),sum=0.;
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){vec4 d=texture2D(shadowMap,uv+vec2(float(i),float(j))/1024.);sum+=step(depth-bias,d.r+d.g/255.);}
 return sum/9.;
}
vec3 direct(vec3 n,vec3 v,vec3 l,vec3 albedo,float r,vec3 tangent){
 vec3 h=normalize(v+l);float nl=max(dot(n,l),0.),nv=max(dot(n,v),.001),nh=max(dot(n,h),0.),vh=max(dot(v,h),0.);
 float a=max(r*r,.025),a2=a*a,d=a2/(3.14159*pow(nh*nh*(a2-1.)+1.,2.)),k=(r+1.)*(r+1.)/8.,g=nl/(nl*(1.-k)+k)*nv/(nv*(1.-k)+k),f=.04+.96*pow(1.-vh,5.);
 if(anisotropy>0.){vec3 t=normalize(tangent-n*dot(n,tangent)),b=normalize(cross(n,t));float at=mix(a,1.,anisotropy*anisotropy),ht=dot(h,t)/at,hb=dot(h,b)/a,den=ht*ht+hb*hb+nh*nh;d=1./max(.00001,3.14159*at*a*den*den);}
 return albedo*nl*.72+vec3(min(2.,d*g*f/max(4.*nv,.001)));
}
// Rectangular studio emitters provide broad reflections rather than a painted
// highlight. Reflection shape moves with the surface and camera.
vec3 environment(vec3 direction,float r){
 vec3 d=normalize(direction),key=normalize(vec3(-.45,.65,1.));float soft=.015+r*r*.65;
 float panel=(1.-smoothstep(.26,.26+soft,abs(d.x-key.x)))*(1.-smoothstep(.32,.32+soft,abs(d.y-key.y)))*smoothstep(.25,.5,d.z);
 float fill=(1.-smoothstep(.11,.11+soft,abs(d.x-.65)))*(1.-smoothstep(.44,.44+soft,abs(d.y-.15)))*smoothstep(.1,.4,d.z);
 return mix(vec3(.07,.055,.045),vec3(.25,.31,.39),d.y*.5+.5)+vec3(3.8,3.5,3.1)*panel+vec3(.65,.85,1.2)*fill;
}
void main(){
 vec4 tex=mix(vec4(1.),texture2D(baseMap,UV),textured);if(tex.a<alphaCutoff)discard;
 if(shadowPass>.5){float z=gl_FragCoord.z;gl_FragColor=vec4(floor(z*255.)/255.,fract(z*255.),0.,1.);return;}
 vec3 n=normalize(N),flow=vec3(1.,0.,0.);if(!gl_FrontFacing)n=-n;
 ${derivatives?`vec3 q1=dFdx(P),q2=dFdy(P);vec2 st1=dFdx(UV),st2=dFdy(UV);vec3 t=q1*st2.y-q2*st1.y,b=-q1*st2.x+q2*st1.x;float det=st1.x*st2.y-st1.y*st2.x,handed=det<0.?-1.:1.;t*=handed;b*=handed;t=normalize(t-n*dot(n,t)+vec3(.000001));b=normalize(b-n*dot(n,b)+vec3(.000001));flow=t;if(normalScale>0.&&abs(det)>.00000001){vec3 nm=texture2D(normalMap,UV).xyz*2.-1.;nm.xy*=normalScale;n=normalize(t*nm.x+b*nm.y+n*nm.z);}`:''}
 vec3 albedo=C*srgb(max(tex.rgb,vec3(0.))),v=vec3(0.,0.,1.),l=normalize(vec3(-.5,.8,1.));float r=max(.09,roughness),shadow=visibility(n);
 vec3 c=albedo*(.14+.10*max(n.y,0.))+direct(n,v,l,albedo,r,flow)*1.05*shadow+direct(n,v,normalize(vec3(.8,.15,.6)),albedo,r,flow)*.25;
 float fresnel=.04+.96*pow(1.-max(n.z,0.),5.);c+=environment(reflect(-v,n),r)*fresnel*(.5+.5*shadow)*(1.-r)*(1.-r);
 if(clearcoat>0.)c+=environment(reflect(-v,n),.025)*.045*clearcoat*shadow;
 c+=vec3(.020,.028,.039)*pow(1.-abs(n.z),4.);
 gl_FragColor=vec4(pow(c/(vec3(1.)+c*.28),vec3(1./2.2)),1.);
}`];}
