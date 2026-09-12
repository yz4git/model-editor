import {detailedFaceKeys} from './face-controls.js';
const bell=(x,c,s)=>Math.exp(-(((x-c)/s)**2));
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// Local displacement fields in the measured template coordinate system.
// Evaluating the same mapping on face, eyes, lids, brows, hair and rig keeps attachments aligned.
export function faceDetailDelta([x,y,z],p){
 if(y<.815)return [0,0,0];
 const d=k=>(p[k]??1)-1,ax=Math.abs(x),sgn=Math.sign(x),head=smooth(.824,.881,y),front=smooth(.035,.075,z)*head;
 let dx=0,dy=0,dz=0;
 dy+=d('headLength')*(y-.844)*.34*head;dz+=d('headDepth')*(z-.034)*.48*head;
 dy+=d('faceHeight')*.025*bell(y,.921,.063)*front;
 dx+=d('templeWidth')*x*.58*bell(y,.952,.029)*bell(ax,.035,.022)*head;
 dy+=d('foreheadHeight')*.024*bell(y,.98,.025)*head;
 dz+=d('foreheadSlope')*(y-.955)*.75*bell(y,.975,.039)*front;
 const brow=bell(y,.943,.012)*bell(ax,.021,.023)*front,inner=bell(ax,.011,.010),outer=bell(ax,.033,.012);
 dy+=d('browHeight')*.018*brow;
 dx+=d('browSpacing')*sgn*.011*brow;
 dz+=(d('browProjection')*.016+d('browInnerDepth')*.014*inner+d('browOuterDepth')*.014*outer)*brow;
 dy+=(d('browAngle')*(ax-.022)*.9+d('browArch')*.017*bell(ax,.022,.011)+d('browThickness')*(y-.943)*1.2)*brow;
 const ex=x-sgn*.018474,ey=y-.927537,eye=bell(ex,0,.021)*bell(ey,0,.019)*smooth(.035,.066,z)*head;
 dy+=d('eyeHeight')*.018*eye;dz+=d('eyeDepth')*.018*eye;
 dy+=d('eyeTilt')*sgn*ex*.70*eye;dx+=d('eyeWidth')*ex*.8*eye;
 dy+=d('upperLid')*.009*bell(ey,.004,.005)*eye-d('lowerLid')*.009*bell(ey,-.004,.005)*eye;
 dy-=d(x>=0?'eyeSquintL':'eyeSquintR')*ey*.9*eye;
 const nose=bell(x,0,.020)*bell(y,.910,.030)*front,bridge=bell(x,0,.013)*bell(y,.926,.023)*front,tip=bell(x,0,.011)*bell(y,.905,.012)*front;
 dy-=d('noseLength')*.022*nose;
 dx+=d('noseBridgeWidth')*x*.8*bridge;dz+=d('noseBridgeHeight')*.018*bridge+d('noseBridgeBump')*.017*bell(y,.921,.009)*bridge;
 dx+=d('noseTipSize')*x*.9*tip;dy+=d('noseTipSize')*(y-.905)*.75*tip;dz+=d('noseTipSize')*.010*tip;
 dy+=d('noseTipAngle')*.015*tip*smooth(.084,.105,z);dz-=d('noseTipAngle')*(y-.905)*.9*tip;
 const nostril=bell(ax,.011,.009)*bell(y,.897,.009)*front;
 dx+=d('nostrilWidth')*sgn*.016*nostril;dy+=d('nostrilHeight')*.014*nostril;
 dx+=d('nostrilSize')*(x-sgn*.011)*1.3*nostril;dy+=d('nostrilSize')*(y-.897)*1.2*nostril;dz+=d('nostrilSize')*.008*nostril;
 const cheek=bell(ax,.036,.023)*bell(y,.916,.023)*front,hollow=bell(ax,.032,.018)*bell(y,.891,.014)*front;
 dy+=d('cheekHeight')*.025*cheek;dx+=d('cheekWidth')*sgn*.024*cheek;dz+=d('cheekDepth')*.025*cheek-d('cheekHollow')*.020*hollow;
 const mouth=bell(x,0,.035)*bell(y,.887,.017)*front,corners=bell(ax,.024,.010)*bell(y,.889,.009)*front,upper=bell(y,.892,.006)*bell(x,0,.026)*front,lower=bell(y,.883,.006)*bell(x,0,.026)*front;
 dy+=d('mouthHeight')*.023*mouth+d('mouthCorners')*.016*corners;
 dy+=d('upperLipThickness')*.009*upper-d('lowerLipThickness')*.010*lower;
 dz+=d('upperLipThickness')*.004*upper+d('lowerLipThickness')*.005*lower+d('lowerLipPosition')*.016*lower;
 dy+=d('cupidBow')*.009*bell(ax,.006,.004)*upper;
 dy-=d('philtrumLength')*.015*bell(x,0,.022)*bell(y,.895,.013)*front;
 const jaw=bell(y,.872,.020)*bell(ax,.031,.025)*head,chin=bell(x,0,.023)*bell(y,.860,.014)*front;
 dy+=d('jawHeight')*.023*jaw;dz+=d('jawDepth')*.022*jaw;
 dx+=d('jawAngle')*sgn*.022*bell(ax,.036,.014)*bell(y,.875,.015)*head;
 dx+=d('chinWidth')*x*1.2*chin;dz-=d('chinCleft')*.012*bell(x,0,.005)*chin;
 const ear=smooth(.037,.049,ax)*bell(y,.909,.025)*(1-smooth(.042,.063,z)),localX=x-sgn*.047,localY=y-.910;
 dx+=d('earSize')*localX*.9*ear;dy+=d('earSize')*localY*.9*ear;dz+=d('earSize')*(z-.022)*.8*ear;
 dy+=d('earHeight')*.023*ear;
 dx-=d('earAngle')*sgn*localY*.8*ear;dy+=d('earAngle')*Math.abs(localX)*.8*ear;
 dx+=d('earFlare')*sgn*.018*ear;dz-=d('earFlare')*.008*ear;
 dy+=d('earTip')*.026*bell(y,.929,.009)*ear;dx+=d('earTip')*sgn*.008*bell(y,.929,.009)*ear;
 dy-=d('earLobe')*.024*bell(y,.892,.010)*ear;
 return [dx,dy,dz];
}
export function detailedFaceActive(p){return detailedFaceKeys.some(k=>Math.abs((p[k]??1)-1)>1e-9);}
// Map the independent implicit generator into the same anatomical coordinates.
export function deformAnalyticFace(vertices,normals,p,headBase,scale){
 if(!detailedFaceActive(p))return;
 const hs=p.head;for(let i=0;i<vertices.length;i+=3){const q=vertices.slice(i,i+3).map(v=>v/scale),v=[q[0]/hs*.60,.843864+(q[1]-headBase)/hs*.572,q[2]/hs*.62+.034],d=faceDetailDelta(v,p);vertices[i]+=d[0]/.60*hs*scale;vertices[i+1]+=d[1]/.572*hs*scale;vertices[i+2]+=d[2]/.62*hs*scale;}
 // Re-average geometric normals at welded positions after deformation.
 const sums=new Map(),keys=[];for(let i=0;i<vertices.length;i+=3){const key=vertices.slice(i,i+3).map(x=>x.toFixed(7)).join(',');keys.push(key);if(!sums.has(key))sums.set(key,[0,0,0]);}
 for(let i=0;i<vertices.length;i+=9){const a=vertices.slice(i,i+3),b=vertices.slice(i+3,i+6),c=vertices.slice(i+6,i+9),u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(let j=0;j<3;j++){const sum=sums.get(keys[i/3+j]);for(let k=0;k<3;k++)sum[k]+=n[k];}}
 for(let i=0;i<keys.length;i++){const n=sums.get(keys[i]),l=Math.hypot(...n)||1;for(let k=0;k<3;k++)normals[i*3+k]=n[k]/l;}
}
