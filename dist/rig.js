// Small, shared rig implementation used by the preview and the glTF animation writer.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const boneNames=['Hips','Spine','Chest','Neck','Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
export const parents=[-1,0,1,2,3,2,5,6,2,8,9,0,11,12,0,14,15];
export const jointKeys=['pelvis','spine-2','spine-1','neck','neck','l-shoulder','l-elbow','l-hand','r-shoulder','r-elbow','r-hand','l-upper-leg','l-knee','l-ankle','r-upper-leg','r-knee','r-ankle'];
export const poseDefaults={headTurn:0,armRaise:0,elbowBend:0,kneeBend:0};
export function makeRig(data,transform){return jointKeys.map((key,i)=>({name:boneNames[i],parent:parents[i],position:transform(data.joints[key].map((v,k)=>v+(i===4&&k===1?.028:0)))}));}
export function weightsFor(v,data){
 const [x,y]=v,a=Math.abs(x),J=data.joints,neck=J.neck[1];let pairs;
 if(y>neck-.04){const h=smooth(neck,neck+.04,y),n=smooth(neck-.04,neck,y);pairs=[[2,1-n],[3,n*(1-h)],[4,n*h]];}
 else if(y<J.pelvis[1]-.018){const b=x>=0?11:14,k=J['l-knee'][1],ank=J['l-ankle'][1],hip=smooth(J.pelvis[1]-.1,J.pelvis[1]+.005,y),lower=1-smooth(k-.045,k+.045,y),foot=1-smooth(ank-.015,ank+.035,y);pairs=[[0,hip],[b,(1-hip)*(1-lower)],[b+1,(1-hip)*lower*(1-foot)],[b+2,(1-hip)*lower*foot]];}
 else {const arm=smooth(.105,.151,a),b=x>=0?5:8;
 // Use distance along the measured arm, not world height after posing.
 const elbow=1-smooth(J['l-elbow'][1]-.045,J['l-elbow'][1]+.035,y),hand=1-smooth(J['l-hand'][1]-.015,J['l-hand'][1]+.025,y);
 const chest=smooth(.63,.75,y),spine=smooth(.54,.65,y),torso=chest>.5?2:spine>.5?1:0;
 pairs=[[torso,1-arm],[b,arm*(1-elbow)],[b+1,arm*elbow*(1-hand)],[b+2,arm*elbow*hand]];}
 pairs=pairs.filter(p=>p[1]>1e-6).sort((a,b)=>b[1]-a[1]).slice(0,4);const sum=pairs.reduce((s,p)=>s+p[1],0)||1;return {joints:[0,0,0,0].map((_,i)=>pairs[i]?.[0]||0),weights:[0,0,0,0].map((_,i)=>(pairs[i]?.[1]||0)/sum)};
}
export function quaternion(x=0,y=0,z=0){const a=Math.sin(x/2),b=Math.sin(y/2),c=Math.sin(z/2),d=Math.cos(x/2),e=Math.cos(y/2),f=Math.cos(z/2);return [a*e*f+d*b*c,d*b*f-a*e*c,d*e*c+a*b*f,d*e*f-a*b*c];}
export function poseAt(pose=poseDefaults,clip='none',time=0,expression=[0,0,0]){
 const p={...poseDefaults,...pose},e=[...expression],q=boneNames.map(()=>[0,0,0,1]);let wave=0,head=0;if(clip!=='none')Object.assign(p,poseDefaults);
 if(clip==='greeting'){const t=clamp(time,0,3),envelope=smooth(.15,.9,t)*(1-smooth(2.2,2.95,t));p.armRaise+=envelope*85;p.elbowBend+=envelope*72;wave=Math.sin((t-.9)*Math.PI*5)*envelope*.20;head=Math.sin(t/3*Math.PI)*.12;e[1]=Math.max(e[1],envelope*.6);e[0]=Math.max(e[0],Math.max(0,1-Math.abs(t-1.65)/.13));}
 if(clip==='expression'){e[0]=Math.max(0,1-Math.abs(time-1)/.25);e[1]=smooth(1.4,2.1,time)*(1-smooth(2.5,3,time));e[2]=e[1]*.35;}
 const d=Math.PI/180;q[4]=quaternion(0,p.headTurn*d,head);q[5]=quaternion(0,0,p.armRaise*d);q[6]=quaternion(-p.elbowBend*d,0,0);q[7]=quaternion(0,wave,0);q[12]=quaternion(p.kneeBend*d,0,0);
 return {rotations:q,expression:e};
}
export const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
export function multiply(a,b){const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
export function compose(p,[x,y,z,w]){const xx=x*x,yy=y*y,zz=z*z;return [1-2*(yy+zz),2*(x*y+z*w),2*(x*z-y*w),0,2*(x*y-z*w),1-2*(xx+zz),2*(y*z+x*w),0,2*(x*z+y*w),2*(y*z-x*w),1-2*(xx+yy),0,...p,1];}
export function skinMatrices(rig,rotations){const world=[],flat=new Float32Array(rig.length*16);rig.forEach((b,i)=>{const t=b.position.map((v,k)=>v-(b.parent<0?0:rig[b.parent].position[k])),local=compose(t,rotations[i]);world[i]=b.parent<0?local:multiply(world[b.parent],local);const inv=identity();for(let k=0;k<3;k++)inv[12+k]=-b.position[k];flat.set(multiply(world[i],inv),i*16);});return flat;}
export function skinPoint(v,indices,weights,matrices){const out=[0,0,0];for(let j=0;j<4;j++){const m=indices[j]*16,w=weights[j];for(let k=0;k<3;k++)out[k]+=w*(matrices[m+k]*v[0]+matrices[m+4+k]*v[1]+matrices[m+8+k]*v[2]+matrices[m+12+k]);}return out;}
