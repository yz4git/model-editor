// Independent controls inspired by detailed RPG character creators. Neutral = 1.
const control=(key,label,min=.65,max=1.35)=>[key,label,min,max,.005];
export const faceGroups=[
 ['輪郭・額',[
 ['faceWidth','顔幅',.85,1.2,.005],['foreheadDepth','額の奥行き',.7,1.3,.005],
 control('headLength','頭の縦の長さ'),control('headDepth','頭の奥行き'),control('faceHeight','顔パーツ全体の高さ'),control('templeWidth','こめかみの幅'),control('foreheadHeight','額の高さ'),control('foreheadSlope','額の傾き')]],
 ['眉',[
 control('browHeight','眉の高さ'),control('browSpacing','眉の間隔'),control('browProjection','眉骨の突出'),control('browInnerDepth','眉頭の前後'),control('browOuterDepth','眉尻の前後'),control('browAngle','眉の角度'),control('browArch','眉の山'),control('browThickness','眉の太さ')]],
 ['目',[
 ['eyes','目の間隔',.8,1.2,.005],['eyeSize','目の大きさ',.75,1.25,.005],
 control('eyeHeight','目の高さ'),control('eyeDepth','目の奥行き'),control('eyeTilt','目尻の角度'),control('eyeWidth','目の横幅'),control('upperLid','上まぶたの高さ'),control('lowerLid','下まぶたの高さ'),control('eyeSquintL','左目の細さ'),control('eyeSquintR','右目の細さ')]],
 ['鼻',[
 ['nose','鼻の突出',.6,1.5,.005],['noseWidth','鼻全体の幅',.65,1.4,.005],
 control('noseLength','鼻の長さ'),control('noseBridgeWidth','鼻筋の幅'),control('noseBridgeHeight','鼻筋の高さ'),control('noseBridgeBump','鼻筋のふくらみ'),control('noseTipSize','鼻先の大きさ'),control('noseTipAngle','鼻先の角度'),control('nostrilWidth','小鼻の幅'),control('nostrilHeight','小鼻の高さ'),control('nostrilSize','小鼻の大きさ')]],
 ['頬',[
 ['cheekVolume','頬のふくらみ',.7,1.35,.005],control('cheekHeight','頬骨の高さ'),control('cheekWidth','頬骨の幅'),control('cheekDepth','頬骨の前後'),control('cheekHollow','頬のくぼみ')]],
 ['口',[
 ['lips','唇全体の厚さ',.6,1.5,.005],['mouthWidth','口幅',.7,1.3,.005],['mouthProjection','口元の突出',.6,1.4,.005],
 control('mouthHeight','口の高さ'),control('mouthCorners','口角の高さ'),control('upperLipThickness','上唇の厚さ'),control('lowerLipThickness','下唇の厚さ'),control('lowerLipPosition','下唇の前後'),control('cupidBow','上唇の山'),control('philtrumLength','鼻の下の長さ')]],
 ['顎',[
 ['jaw','顎の幅',.75,1.25,.005],['chinLength','顎先の長さ',.7,1.3,.005],['chinProjection','顎先の前後',.6,1.4,.005],
 control('jawHeight','下顎の高さ'),control('jawDepth','下顎の前後'),control('jawAngle','エラの張り'),control('chinWidth','顎先の幅'),control('chinCleft','顎先のくぼみ')]],
 ['耳',[
 control('earSize','耳の大きさ'),control('earHeight','耳の高さ'),control('earAngle','耳の角度'),control('earFlare','耳の開き'),control('earTip','耳先の尖り'),control('earLobe','耳たぶの長さ')]]
];
export const faceKeys=faceGroups.flatMap(([,rows])=>rows.map(r=>r[0]));
const legacy=new Set(['faceWidth','foreheadDepth','eyes','eyeSize','nose','noseWidth','cheekVolume','lips','mouthWidth','mouthProjection','jaw','chinLength','chinProjection']);
export const detailedFaceKeys=faceKeys.filter(k=>!legacy.has(k));
export const detailedFaceDefaults=Object.fromEntries(detailedFaceKeys.map(k=>[k,1]));
export function resetFaceGroup(params,index){const next={...params};for(const [k]of faceGroups[index]?.[1]||[])next[k]=1;return next;}
