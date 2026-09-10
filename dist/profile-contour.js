// Local, image-derived fallback for clean-background side portraits.
// It proposes skin-profile landmarks, not a face-recognition result. Forehead is inferred.
export function profileContour(rgba,width,height){
 if(width<100||height<100||rgba.length!==width*height*4)throw Error('画像が小さすぎます。');
 const rows=[[],[]],minimumRun=Math.max(9,Math.round(width*.025));
 const warm=i=>{const r=rgba[i],g=rgba[i+1],b=rgba[i+2];return rgba[i+3]>100&&r>80&&r>g*1.025&&r>b*1.03&&r-g<95;};
 const bright=i=>rgba[i]>160&&rgba[i+1]>95;
 for(let y=0;y<height;y++){const runs=[];let start=-1,count=0;for(let x=0;x<=width;x++){const i=(y*width+x)*4;if(x<width&&warm(i)){if(start<0){start=x;count=0;}if(bright(i))count++;}else if(start>=0){if(x-start>=minimumRun&&count>=Math.max(5,minimumRun*.45))runs.push([start,x-1]);start=-1;}}if(runs.length){rows[0][y]=runs.at(-1)[1];rows[1][y]=width-1-runs[0][0];}}
 const candidates=[];
 for(let direction=0;direction<2;direction++){const raw=rows[direction],curve=[];for(let y=0;y<height;y++){const vals=[];for(let j=Math.max(0,y-2);j<=Math.min(height-1,y+2);j++)if(Number.isFinite(raw[j]))vals.push(raw[j]);if(vals.length>=3)curve[y]=vals.sort((a,b)=>a-b)[Math.floor(vals.length/2)];}
 let best=null;for(let y=Math.round(height*.1);y<height*.8;y++){const x=curve[y];if(!Number.isFinite(x))continue;const before=[],after=[];for(let j=Math.max(0,y-Math.round(height*.13));j<y-height*.035;j++)if(Number.isFinite(curve[j])&&curve[j]>x-width*.14)before.push([curve[j],j]);for(let j=y+Math.round(height*.035);j<Math.min(height,y+height*.105);j++)if(Number.isFinite(curve[j])&&curve[j]>x-width*.14)after.push([curve[j],j]);if(before.length<8||after.length<8)continue;const root=before.reduce((a,b)=>a[0]<b[0]?a:b),valley=after.reduce((a,b)=>a[0]<b[0]?a:b),prominence=Math.min(x-root[0],x-valley[0]);if(prominence<width*.025)continue;const score=prominence;if(!best||score>best.score)best={x,y,root,score};}
 if(!best)continue;
 // End of the lower-face contour: largest leftward drop after mouth/chin, not the neck.
 let chin=null;for(let y=best.y+Math.round(height*.12);y<Math.min(height*.94,best.y+height*.34);y++){const x=curve[y];if(!Number.isFinite(x)||x<best.x-width*.18)continue;const next=[];for(let j=y+3;j<=Math.min(height-1,y+Math.round(height*.025));j++)if(Number.isFinite(curve[j]))next.push(curve[j]);if(next.length<3)continue;const drop=x-Math.min(...next);if(drop>width*.045&&(!chin||drop>chin.drop))chin={x,y,drop};}
 if(!chin||chin.y-best.root[1]<height*.15||Math.abs(chin.x-best.root[0])>(chin.y-best.root[1])*.5)continue;
 const cutoff=chin.x-width*.035,limit=Math.min(height-1,chin.y+Math.round(height*.025));for(let j=chin.y+1;j<=limit;j++){if(Number.isFinite(curve[j])&&curve[j]>=cutoff){chin.x=curve[j];chin.y=j;}}
 const root={x:best.root[0],y:best.root[1]},tip={x:best.x,y:best.y},end={x:chin.x,y:chin.y};const forehead={x:root.x+.5*(root.x-end.x),y:root.y-.5*(end.y-root.y)};if(forehead.y<0||forehead.x>=width||forehead.x<0)continue;
 const map=p=>({x:direction?width-1-p.x:p.x,y:p.y});candidates.push({score:best.score,points:{forehead:map(forehead),chin:map(end),noseRoot:map(root),noseTip:map(tip)},direction:direction?'left':'right'});
 }
 candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)throw Error('明瞭な横顔の輪郭が見つかりませんでした。');
 if(candidates.length>1&&candidates[0].score<candidates[1].score*1.12)throw Error('横顔の向きを判定できませんでした。');
 return {...candidates[0],requiresConfirmation:true,warnings:['横顔の輪郭から候補点を検出しました。','前髪で隠れる額の基準点は推定です。鼻根・鼻先・顎とあわせて確認してください。'],skipLips:true,method:'profile-contour'};
}
