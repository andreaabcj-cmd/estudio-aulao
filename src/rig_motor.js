/* Bonecos por ossos, vindos do Quadro Vivo: ângulos viram desenho. Não editar à mão: ferramentas/gerar_quadro_vivo.py. */
window.EA_RIG_MOTOR=(function(){
'use strict';
const CX=150,TH=138,SLN=142,UPL=74,FOL=66,HK=1.13,HKB=1.42,GROUND=552,HPX=150,HPY=124;
const rad=a=>a*Math.PI/180,deg=r=>r*180/Math.PI,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const n2=v=>{v=Math.round(v*100)/100;return v===0?0:v;};
const SIN=(t,per,ph)=>Math.sin(2*Math.PI*t/per+(ph||0));
/* ---------- cores ---------- */
const isHex=h=>typeof h==='string'&&/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h);
function rgbOf(h){h=h.slice(1);if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255];}
function mix(a,b,t){if(!isHex(a)||!isHex(b))return a;const A=rgbOf(a),B=rgbOf(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
const dk=(h,t)=>mix(h,'#000000',t),lt=(h,t)=>mix(h,'#ffffff',t);
/* ---------- geometria dos ossos (rig.js) ---------- */
const Tm=side=>side==='L'?{m:true,p:(x,y)=>[2*CX-x,y]}:{m:false,p:(x,y)=>[x,y]};
const F=v=>n2(v);
function taper(T,b,t,wb,wt){
  const dx=t[0]-b[0],dy=t[1]-b[1],L=Math.hypot(dx,dy)||1e-6,n=[-dy/L,dx/L];
  const p1=T.p(b[0]+n[0]*wb,b[1]+n[1]*wb),p2=T.p(t[0]+n[0]*wt,t[1]+n[1]*wt),p3=T.p(t[0]-n[0]*wt,t[1]-n[1]*wt),p4=T.p(b[0]-n[0]*wb,b[1]-n[1]*wb);
  const sw=T.m?1:0;
  return `M${F(p1[0])} ${F(p1[1])}L${F(p2[0])} ${F(p2[1])}A${F(wt)} ${F(wt)} 0 0 ${sw} ${F(p3[0])} ${F(p3[1])}L${F(p4[0])} ${F(p4[1])}A${F(wb)} ${F(wb)} 0 0 ${sw} ${F(p1[0])} ${F(p1[1])}Z`;
}
function disk(T,c,r){const p=T.p(c[0],c[1]);return `M${F(p[0]-r)} ${F(p[1])}A${F(r)} ${F(r)} 0 1 0 ${F(p[0]+r)} ${F(p[1])}A${F(r)} ${F(r)} 0 1 0 ${F(p[0]-r)} ${F(p[1])}Z`;}
function finger(T,base,a1,l1,a2,l2,w){
  const j=[base[0]+l1*Math.cos(a1),base[1]+l1*Math.sin(a1)],t=[j[0]+l2*Math.cos(a2),j[1]+l2*Math.sin(a2)];
  return taper(T,base,j,w,w*.92)+taper(T,j,t,w*.92,w*.8);
}
function armGeo(side,A,B,shY){
  const T=Tm(side),sh=[CX+37*B.tk,166+shY],[w0,w1,w2]=[10.4*B.ak,7.2*B.ak,5.5*B.ak],HS=2.6*B.hs;
  const u1=[Math.cos(rad(A.up)),Math.sin(rad(A.up))],u2=[Math.cos(rad(A.fore)),Math.sin(rad(A.fore))];
  const ul=A.ul==null?1:A.ul,el=[sh[0]+UPL*ul*u1[0],sh[1]+UPL*ul*u1[1]],wr=[el[0]+FOL*u2[0],el[1]+FOL*u2[1]],o={};
  o.upper=taper(T,sh,el,w0,w1);o.fore=taper(T,el,wr,w1,w2);o.elbow=disk(T,el,w1);
  const n1=[-u1[1],u1[0]],U=(u,v)=>T.p(sh[0]+u1[0]*u+n1[0]*v,sh[1]+u1[1]*u+n1[1]*v),sk=B.ak*1.12,
    q=[U(-3,-13.5*sk),U(28,-12.5*sk),U(28,12.5*sk),U(-3,13.5*sk),U(-13*sk,9*sk),U(-13*sk,-9*sk),U(-3,-13.5*sk)],J=a=>a.map(F).join(' ');
  o.sleeve=`M${J(q[0])}L${J(q[1])}L${J(q[2])}L${J(q[3])}C${J(q[4])} ${J(q[5])} ${J(q[6])}Z`;
  const s=A.s,base=A.fore+s*A.wrist,hd=[Math.cos(rad(base)),Math.sin(rad(base))],hn=[-hd[1],hd[0]];
  const Lq=(x,y)=>[wr[0]+HS*(hd[0]*x+hn[0]*y*s*A.sq),wr[1]+HS*(hd[1]*x+hn[1]*y*s*A.sq)];
  const pp=[[-.5,-3.8],[3,-4.8],[8,-5.2],[10.5,-4.8],[11.8,-1.5],[11.8,1.5],[10.5,4.8],[8,5.2],[3,4.8],[-.5,3.8]].map(([x,y])=>J(T.p(...Lq(x,y))));
  o.palm=`M${pp[0]}C${pp[1]} ${pp[2]} ${pp[3]}C${pp[4]} ${pp[5]} ${pp[6]}C${pp[7]} ${pp[8]} ${pp[9]}Z`;
  const lanes=[-3.3,-1.1,1.1,3.3];
  A.f.forEach(([a1,l1,a2,l2],i)=>{const fan=lanes[i]*A.spread*1.5;
    o['f'+(i+1)]=finger(T,Lq(9,lanes[i]),rad(base+s*(a1+fan)),l1*HS,rad(base+s*(a2+fan)),l2*HS,(1.22-i*.05)*HS);});
  const[t1,tl1,t2,tl2]=A.th;o.th=finger(T,Lq(3.5,-3.6),rad(base+s*t1),tl1*HS,rad(base+s*t2),tl2*HS,1.4*HS);
  o.wr=wr;o.base=base;o.el=el;return o;
}
/* pernas: quadril → joelho → tornozelo; pé acompanha a canela */
function legGeo(side,L,B,lk,kind,swx){
  const T=Tm(side),H=[CX+18*lk+swx,252],a=rad(L.hip),b=rad(L.knee);
  const K=[H[0]+TH*L.fl*Math.cos(a),H[1]+TH*L.fl*Math.sin(a)],sl=L.sl==null?1:L.sl,A=[K[0]+SLN*sl*Math.cos(b),K[1]+SLN*sl*Math.sin(b)];
  const hem=[K[0]+(SLN*sl-18*sl)*Math.cos(b),K[1]+(SLN*sl-18*sl)*Math.sin(b)],o={};
  if(kind==='pants'){o.thigh=taper(T,H,K,20.5*lk,15*lk);o.shin=taper(T,K,hem,15*lk,12.6*lk);o.knee=disk(T,K,15*lk);o.ank=taper(T,hem,A,7.8,7.4);}
  else{o.thigh=taper(T,H,K,14*lk,10.8*lk);o.shin=taper(T,K,A,10.8*lk,7.4);o.knee=disk(T,K,10.8*lk);o.ank='';
    if(kind==='shorts'){const f=.55,P=[H[0]+(K[0]-H[0])*f,H[1]+(K[1]-H[1])*f];o.sho=taper(T,H,P,16.8*lk,13.2*lk);}}
  const ax=T.m?2*CX-A[0]:A[0];
  o.shoe=`translate(${F(ax)} ${F(A[1])})${T.m?' scale(-1 1)':''} rotate(${F(L.knee-90)})`;
  return o;
}
/* ---------- cabeça: rosto paramétrico ---------- */
const ell=(cx,cy,rx,ry)=>{const k=.5523;return `M${F(cx)} ${F(cy-ry)}C${F(cx+k*rx)} ${F(cy-ry)} ${F(cx+rx)} ${F(cy-k*ry)} ${F(cx+rx)} ${F(cy)}C${F(cx+rx)} ${F(cy+k*ry)} ${F(cx+k*rx)} ${F(cy+ry)} ${F(cx)} ${F(cy+ry)}C${F(cx-k*rx)} ${F(cy+ry)} ${F(cx-rx)} ${F(cy+k*ry)} ${F(cx-rx)} ${F(cy)}C${F(cx-rx)} ${F(cy-k*ry)} ${F(cx-k*rx)} ${F(cy-ry)} ${F(cx)} ${F(cy-ry)}Z`;};
function browD(m,by,tilt,arch){
  const X=m?x=>300-x:x=>x,ox=128.5,ix=146,yo=by+tilt*2.5,yi=by-tilt*2.5,th=2.5,P=(x,y)=>F(X(x))+' '+F(y);
  return `M${P(ox,yo)}C${P(ox+4.6,yo-arch)} ${P(ix-5.6,yi-arch-.4)} ${P(ix,yi)}L${P(ix,yi+th)}C${P(ix-5.6,yi-arch-.4+th)} ${P(ox+4.6,yo-arch+th)} ${P(ox,yo+th+1)}Z`;
}
function mouthD(sm,w,op,inset){
  const my=114,cy=my-sm*3.4,ins=inset||0,ww=w-ins*1.3,uy=my-2.2+sm*1.1+ins*.9,by=my+2.8+op*1.3+sm*3.2-ins*1.4,cu=uy+.5-ins*.2;
  return `M${F(CX-ww)} ${F(cy+ins*.4)}C${F(CX-ww*.62)} ${F(uy-.3)} ${F(CX-ww*.2)} ${F(uy-.2)} ${F(CX)} ${F(cu)}C${F(CX+ww*.2)} ${F(uy-.2)} ${F(CX+ww*.62)} ${F(uy-.3)} ${F(CX+ww)} ${F(cy+ins*.4)}C${F(CX+ww*.5)} ${F(by)} ${F(CX-ww*.5)} ${F(by)} ${F(CX-ww)} ${F(cy+ins*.4)}Z`;
}
const MOODS={
  neutral:{bY:78.6,bT:0,bA:3.2,eL:4.7,eR:4.7,sm:.15,mw:6.4,mo:0},
  happy:{bY:76.6,bT:.25,bA:3.8,eL:3.7,eR:3.7,sm:1,mw:8,mo:3.4},
  confident:{bY:78,bT:-.2,bA:3.4,eL:4.1,eR:4.1,sm:.7,mw:7.4,mo:.4},
  surprised:{bY:72.6,bT:.4,bA:4.6,eL:6.3,eR:6.3,sm:0,mw:3.8,mo:8.5},
  sad:{bY:79.4,bT:1.15,bA:2.6,eL:4.1,eR:4.1,sm:-.95,mw:5.4,mo:0},
  angry:{bY:80,bT:-1.2,bA:1.6,eL:3.5,eR:3.5,sm:-.7,mw:6.4,mo:1.6},
  wink:{bY:76.8,bT:.2,bA:3.6,eL:3.9,eR:.5,sm:.95,mw:7.8,mo:2.4}
};
function faceD(Fp){
  const bl=1-.93*clamp(Fp.bl,0,1),lk=Fp.look,d={};
  d.browL=browD(false,Fp.bY,Fp.bT,Fp.bA);d.browR=browD(true,Fp.bY-(Fp.bR||0),Fp.bT,Fp.bA);
  const rl=Math.max(.45,Fp.eL*bl),rr=Math.max(.45,Fp.eR*bl);
  d.eyeL=ell(137.6+lk,92.1,4.1,rl);d.eyeR=ell(162.4+lk,92.1,4.1,rr);
  const lo=(4.7-rl)*.55,lo2=(4.7-rr)*.55;
  d.lidL=`M${F(131.35+lk)} ${F(88.15+lo)}C${F(134.18+lk)} ${F(85.55+lo)} ${F(140.96+lk)} ${F(85.55+lo)} ${F(143.78+lk)} ${F(87.58+lo)}`;d.lidR=`M${F(168.65+lk)} ${F(88.15+lo2)}C${F(165.82+lk)} ${F(85.55+lo2)} ${F(159.04+lk)} ${F(85.55+lo2)} ${F(156.22+lk)} ${F(87.58+lo2)}`;
  d.shL=ell(138.9+lk,90.3,1.25*Math.min(1,rl/3),1.25*Math.min(1,rl/3));d.shR=ell(163.7+lk,90.3,1.25*Math.min(1,rr/3),1.25*Math.min(1,rr/3));
  const mo=Fp.mo;d.mouth=mouthD(Fp.sm,Fp.mw,mo,0);d.mouthIn=mouthD(Fp.sm,Fp.mw,mo,1.5);d.mIn=clamp((mo-.8)/2.2,0,1);
  return d;
}
/* ---------- cabelos ---------- */
const FACE='M150 49.16C168.08 49.16 180.51 62.72 180.51 84.19C180.51 106.79 168.08 124.87 150 128.26C131.92 124.87 119.49 106.79 119.49 84.19C119.49 62.72 131.92 49.16 150 49.16Z';
const circ=(x,y,r)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
const HAIR={
 short:{f:'M117 91C111 56 128 38 150 38C172 38 189 56 183 91C181 80 177 72 170 67C160 71 140 71 130 67C123 72 119 80 117 91Z',st:'M138 44C136 52 134 58 131 64M160 42C162 50 164 56 167 62'},
 side:{f:'M116 93C107 52 130 34 153 36C177 38 193 58 184 93C182 78 176 68 166 62C156 67 142 73 128 77C122 81 118 87 116 93Z',st:'M150 40C140 48 132 58 126 70M164 44C168 50 172 58 174 66'},
 buzz:{f:'M119 82C115 56 131 45 150 45C169 45 185 56 181 82C178 69 170 61 150 59C130 61 122 69 119 82Z',op:.78},
 long:{b:'M111 74C104 40 128 29 150 29C172 29 196 40 189 74L202 216C196 240 172 246 150 241C128 246 104 240 98 216Z',f:'M117 93C109 54 130 38 150 38C170 38 191 54 183 93C180 79 170 66 150 58C130 66 120 79 117 93Z',st:'M138 44C132 56 126 70 122 86M162 44C168 56 174 70 178 86',bst:'M128 120C126 160 124 200 122 232M172 120C174 160 176 200 178 232'},
 wavy:{b:'M203.98 88.15 C213.83 94.39 215.3 124.23 206.07 130.76 C211.29 140.89 197.84 164.67 186.86 164.73 C186.8 176.66 167.44 192.1 159.2 186.78 C153.19 195.01 130.84 189.18 127.28 178.45 C117.68 181.52 101.62 161.71 104.33 150.16 C93.33 147.15 84.56 119.94 91.82 111.29 C84.14 102.65 91.3 74.29 102.03 70.77 C99.17 59.24 115.46 38.72 125.31 41.44 C128.58 31.45 150.82 28.82 157.09 37.69 C165.38 31.18 186.14 41.58 186.75 52.55 C197.29 52.61 209.35 77.52 203.98 88.15 Z',f:'M118.36 87.58 C113.84 55.94 136.44 40.12 159.04 42.38 C179.38 44.64 188.42 62.72 182.77 89.84 C179.38 76.28 172.6 67.24 163.56 62.72 C152.26 72.89 135.31 80.8 118.36 87.58 Z'},
 bob:{b:'M112 75C106 40 130 31 150 31C170 31 194 40 188 75L195 138C185 148 170 146 160 141L140 141C130 146 115 148 105 138Z',f:'M116 93C108 52 130 36 152 37C176 38 192 56 184 93C182 78 174 68 162 63C152 70 140 74 128 78C122 82 118 87 116 93Z',st:'M146 42C138 50 132 60 128 72'},
 bun:{b:circ(150,38,15),f:'M118 88C112 56 130 42 150 42C170 42 188 56 182 88C180 78 174 68 166 64C158 68 142 68 134 64C126 68 120 78 118 88Z',st:'M150 24C146 28 146 34 148 38'},
 ponytail:{b:'M176 52C214 46 232 100 208 154C202 170 188 172 186 160C198 128 196 94 174 78Z',f:'M117 91C111 56 128 38 150 38C172 38 189 56 183 91C181 80 177 72 170 67C160 71 140 71 130 67C123 72 119 80 117 91Z',st:'M138 44C136 52 134 58 131 64',x:'<path d="M174 60C182 56 190 62 190 72C188 80 180 82 174 76Z" fill="#E11D48"/>'},
 afro:{b:[circ(150,70,38),circ(116,86,24),circ(184,86,24),circ(126,56,22),circ(174,56,22),circ(150,48,22),circ(108,108,14),circ(192,108,14)].join(''),f:'M118 84C115 66 128 55 142 55C146 51 154 51 158 55C172 55 185 66 182 84C177 74 169 70 162 72C156 65 144 65 138 72C131 70 123 74 118 84Z'},
 bald:{}
};
/* ---------- calçados ---------- */
const SHOE_BODY='M16.5 0C14.5 -8 3.5 -10 -7.5 -8C-11.5 -6 -14.5 0 -14.5 10L25.5 10C25.5 4 21.5 2 16.5 0Z';
function shoeSVG(c,kind){
  const sc=c.shoes;
  if(kind==='boot')return `<path d="M-9 -34L9 -34L10 -8C16 -6 24 2 25.5 10L-14.5 10C-14.5 0 -12 -6 -9 -8Z" fill="${sc}"/><path d="M-9 -34L9 -34L9 -28L-9 -28Z" fill="${dk(sc,.25)}"/><path d="M-16 10L27.5 10L27.5 16L-16 16Z" fill="${dk(sc,.45)}"/>`;
  if(kind==='dress')return `<path d="${SHOE_BODY}" fill="${sc}"/><path d="M-6 -7C0 -9 8 -7 14 -2" stroke="${lt(sc,.28)}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M-16 10L27.5 10L27.5 14L-16 14Z" fill="${dk(sc,.5)}"/>`;
  return `<path d="${SHOE_BODY}" fill="${sc}"/><path d="M25.5 10C25.5 4 21.5 1.5 15.5 -.5C11.5 3 10.5 7 10.5 10Z" fill="#fff"/><path d="M-16 10L27.5 10L27.5 16L-16 16Z" fill="#fff"/><path d="M-4 -4L6 -5M-3 0L7 -1" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`;
}
/* ---------- torso / roupas ---------- */
function torsoSVG(c,B){
  const sk=c.skin,top=c.top,bot=c.bottom,ts=c.ts,sd=dk(top,.1);let s='';
  const neck=`<path d="M139 108L161 108L163 152C159 164 141 164 137 152Z" fill="${sk}"/><path d="M139 108L161 108L162 142C155 135 146 128 139 126Z" fill="${dk(sk,.18)}" opacity=".85"/>`;
  s+=neck;
  const base='M110 166C114 158 127 154 137 152C141 163 159 163 163 152C173 154 186 158 190 166L184 248L116 248Z';
  const shade=`<path d="M177 176L176 246L184 248L187 186Z" fill="${dk(top,.13)}" opacity=".9"/>`;
  if(ts==='dress'){
    s+=`<path d="M110 166C114 158 127 154 137 152C141 163 159 163 163 152C173 154 186 158 190 166L184 250C196 296 206 336 214 394C180 404 120 404 86 394C94 336 104 296 116 250Z" fill="${top}"/><path d="M176 250C188 296 198 336 206 396L214 394C206 336 196 296 184 250Z" fill="${dk(top,.13)}" opacity=".9"/><path d="M116 250L184 250L184 258L116 258Z" fill="${dk(top,.22)}"/><path d="M150 262L150 392" stroke="${dk(top,.1)}" stroke-width="1.4" opacity=".5"/>`;
  }else if(ts==='tank'){
    s+=`<path d="M124 172C126 160 131 154 137 152C141 166 159 166 163 152C169 154 174 160 176 172L184 248L116 248Z" fill="${top}"/>${shade}`;
  }else if(ts==='labcoat'){
    s+=`<path d="M137 152C141 163 159 163 163 152L172 250L128 250Z" fill="${c.inner||'#7c93b3'}"/><path d="M108 168C112 159 127 154 137 152L150 214L128 336L100 336Z" fill="${top}"/><path d="M192 168C188 159 173 154 163 152L150 214L172 336L200 336Z" fill="${top}"/><path d="M192 168L200 336L172 336L150 214Z" fill="${dk(top,.07)}"/><path d="M137 152L150 214L163 152" fill="none" stroke="${dk(top,.2)}" stroke-width="2.4" stroke-linejoin="round"/><path d="M114 262L134 262L134 284L114 284Z" fill="none" stroke="${dk(top,.2)}" stroke-width="1.6"/><path d="M122 262L122 256" stroke="#2563eb" stroke-width="2.4" stroke-linecap="round"/><path d="M137 152L131 160L143 168Z" fill="${dk(top,.1)}"/><path d="M163 152L169 160L157 168Z" fill="${dk(top,.1)}"/>`;
  }else{
    s+=`<path d="${base}" fill="${top}"/>${shade}`;
    if(ts==='polo')s+=`<path d="M137 152L146 164L140 172L128 160Z" fill="${lt(top,.35)}"/><path d="M163 152L154 164L160 172L172 160Z" fill="${lt(top,.35)}"/><path d="M150 164L150 196" stroke="${dk(top,.18)}" stroke-width="1.6"/><circle cx="150" cy="172" r="1.5" fill="${dk(top,.35)}"/><circle cx="150" cy="184" r="1.5" fill="${dk(top,.35)}"/>`;
    else if(ts==='hoodie')s+=`<path d="M134 152C138 170 162 170 166 152" fill="none" stroke="${dk(top,.2)}" stroke-width="9" stroke-linecap="round"/><path d="M143 168L141 196M157 168L159 196" stroke="#f1f5f9" stroke-width="2.2" stroke-linecap="round"/><circle cx="141" cy="198" r="2.2" fill="#f1f5f9"/><circle cx="159" cy="198" r="2.2" fill="#f1f5f9"/><path d="M128 220L172 220L178 246L122 246Z" fill="${dk(top,.14)}" opacity=".7"/><path d="M116 246L184 246L184 254L116 254Z" fill="${dk(top,.16)}"/>`;
    else if(ts==='suit')s+=`<path d="M139 154L150 208L161 154Z" fill="#f8fafc"/><path d="M137 152L150 214L128 224L122 178Z" fill="${dk(top,.06)}"/><path d="M163 152L150 214L172 224L178 178Z" fill="${dk(top,.06)}"/><path d="M137 152L150 214L163 152" fill="none" stroke="${dk(top,.3)}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="150" cy="226" r="2.2" fill="${dk(top,.35)}"/><path d="M121 232L137 232" stroke="${dk(top,.3)}" stroke-width="2" stroke-linecap="round"/>`;
    else if(ts==='long')s+=`<path d="M137 152C141 163 159 163 163 152" fill="none" stroke="${dk(top,.14)}" stroke-width="2"/>`;
    else s+=`<path d="M137 152C141 163 159 163 163 152" fill="none" stroke="${dk(top,.14)}" stroke-width="2"/>`;
  }
  return s;
}
function bottomSVG(c,B){/* peças atrás do torso */
  const bs=c.bs,dress=c.ts==='dress',b=c.bottom,lk=B.lk;let s='';
  const pelv=dress?c.skin:b;
  s+=`<path d="M${F(150-33*lk)} 248L${F(150+33*lk)} 248L${F(150+10)} 304L${F(150-10)} 304Z" fill="${pelv}"/>`;
  return s;
}
function bottomFront(c,B){/* cinto, saia: por cima do torso */
  const bs=c.bs,ts=c.ts,b=c.bottom;let s='';
  if(ts==='dress')return s;
  if(bs==='skirt')s+=`<path d="M117 246L183 246C190 290 201 332 209 372C180 384 120 384 91 372C99 332 110 290 117 246Z" fill="${b}"/><path d="M175 262C183 296 192 338 200 378L209 372C201 332 190 290 183 246Z" fill="${dk(b,.15)}" opacity=".85"/><path d="M117 246L183 246L183 255L117 255Z" fill="${dk(b,.25)}"/><path d="M150 258L150 378" stroke="${dk(b,.12)}" stroke-width="1.4" opacity=".5"/>`;
  else if(ts!=='hoodie'&&ts!=='labcoat'){s+=`<path d="M116 246L184 246L184 256L116 256Z" fill="#3b2a22"/>`;
    if(bs==='pants')s+=`<path d="M123 262C129 276 131 286 129 296M177 262C171 276 169 286 171 296" fill="none" stroke="${dk(b,.22)}" stroke-width="1.6" stroke-linecap="round"/><path d="M139 312L161 312" stroke="${dk(b,.22)}" stroke-width="1.6" stroke-linecap="round"/>`;}
  return s;
}
/* ---------- cabeça (fundo e frente) ---------- */
function headBack(c){const h=HAIR[c.hs]||HAIR.short;if(!h.b)return'';
  let s=`<path d="${h.b}" fill="${c.hair}"/>`;if(h.bst)s+=`<path d="${h.bst}" stroke="${dk(c.hair,.3)}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>`;return s;}
function headFront(c,D){
  const sk=c.skin,hr=c.hair,h=HAIR[c.hs]||HAIR.short,ear=ell(120,92,5.6,9);let s='';
  s+=`<path d="M120.06 83.06C123.17 83.06 125.7 87.11 125.7 92.1C125.7 97.09 123.17 101.14 120.06 101.14C116.94 101.14 114.41 97.09 114.41 92.1C114.41 87.11 116.94 83.06 120.06 83.06Z" fill="${dk(sk,.06)}"/><path d="M179.94 83.06C183.06 83.06 185.59 87.11 185.59 92.1C185.59 97.09 183.06 101.14 179.94 101.14C176.83 101.14 174.29 97.09 174.29 92.1C174.29 87.11 176.83 83.06 179.94 83.06Z" fill="${dk(sk,.06)}"/>`;
  if(c.earring)s+=`<circle cx="119.5" cy="104.5" r="2.6" fill="#e2b24a"/><circle cx="180.5" cy="104.5" r="2.6" fill="#e2b24a"/>`;
  s+=`<path d="${FACE}" fill="${sk}"/>`;
  s+=`<ellipse cx="135.3" cy="105.7" rx="5.6" ry="2.9" fill="#e0614f" opacity=".28"/><ellipse cx="164.7" cy="105.7" rx="5.6" ry="2.9" fill="#e0614f" opacity=".28"/>`;
  s+=`<path d="M151.1 94.4L149.4 103.4L152.8 104.5" fill="none" stroke="${dk(sk,.25)}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const lip=mix(sk,'#b4424c',.62);
  s+=`<path data-p="mouth" d="${D.mouth.d}" fill="${lip}"/><path data-p="mouthIn" d="${D.mouthIn.d}" fill="#5b1f27" opacity="${D.mouthIn.opacity}"/>`;
  s+=`<path data-p="eyeL" d="${D.eyeL.d}" fill="#1e1411"/><path data-p="eyeR" d="${D.eyeR.d}" fill="#1e1411"/><path data-p="shL" d="${D.shL.d}" fill="#fff"/><path data-p="shR" d="${D.shR.d}" fill="#fff"/><path data-p="lidL" d="${D.lidL.d}" fill="none" stroke="#1e1411" stroke-width="1.7" stroke-linecap="round"/><path data-p="lidR" d="${D.lidR.d}" fill="none" stroke="#1e1411" stroke-width="1.7" stroke-linecap="round"/>`;
  const bc=c.hs==='bald'||c.hs==='buzz'?dk(hr,.05):hr;
  s+=`<path data-p="browL" d="${D.browL.d}" fill="${bc}"/><path data-p="browR" d="${D.browR.d}" fill="${bc}"/>`;
  if(c.beard)s+=`<path d="M121 98C122 126 138 141 150 141C162 141 178 126 179 98C174 112 166 119 150 119C134 119 126 112 121 98Z" fill="${hr}"/>`;
  if(c.mustache||c.beard)s+=`<path d="M137 107C143 102 148 106.5 150 106.5C152 106.5 157 102 163 107C158 111.5 152 109.5 150 109.5C148 109.5 142 111.5 137 107Z" fill="${hr}"/>`;
  if(h.f)s+=`<path d="${h.f}" fill="${hr}"${h.op?` opacity="${h.op}"`:''}/>`+(h.st?`<path d="${h.st}" stroke="${dk(hr,.3)}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`:'')+(h.x||'');
  if(c.glasses)s+=`<circle cx="137.6" cy="92.1" r="10.2" fill="rgba(255,255,255,.2)" stroke="#111827" stroke-width="2.4"/><circle cx="162.4" cy="92.1" r="10.2" fill="rgba(255,255,255,.2)" stroke="#111827" stroke-width="2.4"/><path d="M147.8 91Q150 88.5 152.2 91M127.4 90L120 88M172.6 90L180 88" fill="none" stroke="#111827" stroke-width="2.4" stroke-linecap="round"/>`;
  if(c.shades)s+=`<path d="M125 85L149 85L148 95C147 101 140 103 135 102C129 100 125 95 125 85ZM151 85L175 85C175 95 171 100 165 102C160 103 153 101 152 95Z" fill="#111827"/><path d="M149 87L151 87M125 86L119 84M175 86L181 84" stroke="#111827" stroke-width="2.4" stroke-linecap="round"/><path d="M129 88L136 88" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>`;
  if(c.hat)s+=`<path d="M113 70C104 22 196 22 187 70C170 63 130 63 113 70Z" fill="${c.top}"/><path d="M150 28L150 64" stroke="${dk(c.top,.2)}" stroke-width="1.6" opacity=".5"/><path d="M107 67C126 75 174 75 193 67C199 71 198 77 187 79C166 83 134 83 113 79C102 77 101 71 107 67Z" fill="${dk(c.top,.28)}"/>`;
  if(c.headset)s+=`<path d="M119 80C116 26 184 26 181 80" fill="none" stroke="#1f2937" stroke-width="4.6" stroke-linecap="round"/><rect x="110" y="76" width="12" height="28" rx="6" fill="#334155"/><rect x="178" y="76" width="12" height="28" rx="6" fill="#334155"/><path d="M114 100C112 124 126 136 142 128" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/><circle cx="143" cy="128" r="4.2" fill="#1f2937"/>`;
  return s;
}
/* ---------- objetos na mão ---------- */
const PROPS={
  phone:'<rect x="6" y="-8" width="32" height="16" rx="3.5" fill="#1f2937"/><rect x="9" y="-6" width="24" height="12" rx="2" fill="#93c5fd"/><circle cx="36" cy="0" r="1" fill="#475569"/>',
  clip:'<rect x="6" y="-15" width="38" height="30" rx="3" fill="#a16207"/><rect x="9" y="-12" width="32" height="24" rx="1.5" fill="#fff"/><rect x="2" y="-5" width="9" height="10" rx="2" fill="#64748b"/><path d="M16 -7H36M16 -2H36M16 3H30" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round"/>',
  cup:'<path d="M6 -9H26L24 11C24 13 22 14 20 14H12C10 14 8 13 8 11Z" fill="#fff" stroke="#cbd5e1" stroke-width="1.4"/><path d="M7 -2H25L24.4 3H7.6Z" fill="#b45309"/><path d="M26 -3C34 -3 34 7 25 7" fill="none" stroke="#cbd5e1" stroke-width="2.4"/><path d="M12 -13C10 -17 14 -18 12 -22M18 -13C16 -17 20 -18 18 -22" stroke="#cbd5e1" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>'
};
/* ---------- gestos de mão ---------- */
const GEST={
 relaxada:{wrist:4,s:1,sq:.55,spread:0,f:[[10,4.8,30,4.4],[8,5.4,28,5],[6,5.2,26,4.8],[4,4.4,22,4]],th:[-10,4.5,8,4]},
 aberta:{wrist:0,s:-1,sq:1,spread:1,f:[[-9,5.2,-7,4.8],[-3,5.8,-2,5.2],[3,5.5,3,5],[9,4.6,10,4.2]],th:[-58,4.6,-42,4.2]},
 apontar:{wrist:0,s:1,sq:1,spread:0,f:[[0,5.6,0,5.2],[80,3.4,160,2.6],[84,3.2,162,2.5],[88,3,165,2.3]],th:[-30,4.4,10,3.6]},
 paz:{wrist:0,s:1,sq:1,spread:.5,f:[[-10,5.6,-9,5.2],[6,5.8,6,5.3],[80,3.2,162,2.5],[84,3,165,2.3]],th:[-20,4,60,3.4]},
 oferecer:{wrist:-14,s:-1,sq:.8,spread:.2,f:[[-4,5.2,8,4.8],[-2,5.8,10,5.2],[0,5.5,12,5],[2,4.6,14,4.2]],th:[-40,4.6,-22,4.2]},
 punho:{wrist:0,s:1,sq:1,spread:0,f:[[72,3.6,152,3],[74,3.6,154,3],[76,3.4,152,2.8],[78,3,150,2.6]],th:[-38,4,40,3.2]},
 joia:{wrist:0,s:1,sq:1,spread:0,f:[[72,3.6,152,3],[74,3.6,154,3],[76,3.4,152,2.8],[78,3,150,2.6]],th:[-8,6,-6,5]},
 grip:{wrist:0,s:1,sq:1,spread:0,f:[[52,4.2,118,3.4],[54,4.2,120,3.4],[56,4,118,3.2],[58,3.6,116,3]],th:[-26,4.2,28,3.4]}
};
const mkA=(up,fore,g)=>{const G=GEST[g||'relaxada'];return{up,fore,ul:1,wrist:G.wrist,s:G.s,sq:G.sq,spread:G.spread,f:G.f.map(x=>x.slice()),th:G.th.slice()};};
/* ---------- interpolação de parâmetros ---------- */
const ANG=new Set(['up','fore','hip','knee']);
const angLerp=(a,b,t)=>{const d=((b-a+540)%360)-180;return a+d*t;};
function lerpP(a,b,t,key){
  if(typeof a==='number')return ANG.has(key)?angLerp(a,b,t):a+(b-a)*t;
  if(Array.isArray(a))return a.map((v,i)=>lerpP(v,b[i],t,key));
  const o={};for(const k in b)o[k]=(k in a)?lerpP(a[k],b[k],t,k):b[k];return o;
}
/* ---------- movimentos (função do tempo em segundos) ---------- */
function rest(X){return{arms:{R:mkA(84,88,'relaxada'),L:mkA(84,88,'relaxada')},legs:{R:{hip:88,fl:1,sl:1,knee:90},L:{hip:88,fl:1,sl:1,knee:90}},
  body:{sx:0,by:0,lean:0,shr:0,hx:0,hy:0,hr:0,look:0,br:0,sh:1},ph:0,air:0};}
function ik(X,T,pref,ul){/* alvo do pulso → ângulos do braço direito */
  ul=ul||1;const U1=UPL*ul,S=[CX+37*X.B.tk,166],dx=T[0]-S[0],dy=T[1]-S[1];let d=Math.hypot(dx,dy);d=Math.min(d,U1+FOL-.5);d=Math.max(d,Math.abs(U1-FOL)+.5);
  const b=Math.atan2(dy,dx),A=Math.acos(clamp((U1*U1+d*d-FOL*FOL)/(2*U1*d),-1,1));
  let best=null;[1,-1].forEach(sg=>{const u=b+sg*A,el=[S[0]+U1*Math.cos(u),S[1]+U1*Math.sin(u)],sc=pref(el);if(!best||sc>best.sc)best={sc,u,el};});
  const f=Math.atan2(T[1]-best.el[1],T[0]-best.el[0]);return{up:deg(best.u),fore:deg(f)};
}
const OUT=el=>el[0]*1.0,DOWN=el=>el[1];
function setArm(P,side,up,fore,g){P.arms[side]=mkA(up,fore,g);}
function ikArm(P,X,side,T,pref,g,ul){const r=ik(X,T,pref,ul);P.arms[side]=mkA(r.up,r.fore,g);P.arms[side].ul=ul||1;}
function mixArm(P,side,up,fore,g1,g2,w){P.arms[side]=lerpP(mkA(up,fore,g1),mkA(up,fore,g2),w);}
const ease3=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const MV={};
MV.idle=(t,X)=>{const P=rest(X);P.body.sx=1.1*SIN(t,5.2);P.body.hr=1.1*SIN(t,4.4);P.body.hx=.7*SIN(t,5.2,1);
  P.arms.R.up+=1.6*SIN(t,3.6);P.arms.L.up+=1.6*SIN(t,3.6,2.2);P.arms.R.wrist+=2*SIN(t,3.6,1);P.arms.L.wrist+=2*SIN(t,3.6,3);return P;};
MV.none=(t,X)=>{const P=rest(X);P.frozen=1;return P;};
MV.walk=(t,X)=>{const P=rest(X),ph=2*Math.PI*t/1.0,lR=Math.max(0,Math.sin(ph)),lL=Math.max(0,Math.sin(ph+Math.PI));
  P.legs.R.fl=1-.3*lR;P.legs.L.fl=1-.3*lL;P.legs.R.knee=90-6*lR;P.legs.L.knee=90-6*lL;
  P.body.by=-3.5*Math.abs(Math.sin(ph));P.body.sx=3*Math.sin(ph);P.body.lean=1.6*Math.sin(ph);P.body.hr=-1.8*Math.sin(ph);
  P.arms.R.up=84+12*Math.sin(ph);P.arms.R.fore=P.arms.R.up+8;P.arms.L.up=84-12*Math.sin(ph);P.arms.L.fore=P.arms.L.up+8;return P;};
MV.run=(t,X)=>{const P=rest(X),ph=2*Math.PI*t/.56,lR=Math.max(0,Math.sin(ph)),lL=Math.max(0,Math.sin(ph+Math.PI));
  P.legs.R.fl=1-.5*lR;P.legs.L.fl=1-.5*lL;P.legs.R.knee=90-12*lR;P.legs.L.knee=90-12*lL;P.legs.R.hip=86;P.legs.L.hip=86;
  P.body.by=-8*Math.abs(Math.sin(ph));P.body.sx=2*Math.sin(ph);P.body.lean=5+2*Math.sin(ph);P.body.hr=-2.5*Math.sin(ph);
  const a=Math.sin(ph),b=Math.sin(ph+Math.PI);
  setArm(P,'R',62+20*a,-52+22*a,'punho');setArm(P,'L',62+20*b,-52+22*b,'punho');return P;};
MV.wave=(t,X)=>{const P=MV.idle(t,X);const r=mkA(-32,-84,'aberta');r.fore+=11*SIN(t,.9);r.wrist+=7*SIN(t,.9,.6);P.arms.R=r;P.body.hr+=3;P.body.sx+=1;return P;};
MV.point=(t,X)=>{const P=MV.idle(t,X);const r=mkA(-24,-16,'apontar');r.wrist+=4*SIN(t,1.4);r.fore+=2*SIN(t,2.2);P.arms.R=r;P.body.look=2.4;P.body.hx+=2;return P;};
MV.raise=(t,X)=>{const P=MV.idle(t,X);const r=mkA(-80,-90,'aberta');r.fore+=3*SIN(t,1.6);r.wrist+=4*SIN(t,1.6,.8);P.arms.R=r;P.body.hr+=2;return P;};
MV.think=(t,X)=>{const P=MV.idle(t,X);ikArm(P,X,'R',[171,139+1.2*SIN(t,2.6)],DOWN,'relaxada',.5);ikArm(P,X,'L',[138,224],DOWN,'relaxada');
  P.body.hr=5+1.5*SIN(t,4);P.body.look=-2.4;P.body.hx=-1;return P;};
MV.cross=(t,X)=>{const P=MV.idle(t,X);ikArm(P,X,'R',[150,232],DOWN,'relaxada');ikArm(P,X,'L',[152,212],DOWN,'relaxada');return P;};
MV.hips=(t,X)=>{const P=MV.idle(t,X);ikArm(P,X,'R',[CX+37*X.B.tk-4,250],OUT,'relaxada');ikArm(P,X,'L',[CX+37*X.B.tk-4,250],OUT,'relaxada');P.body.hr=2*SIN(t,5);return P;};
MV.clap=(t,X)=>{const P=MV.idle(t,X),c=.5+.5*Math.cos(2*Math.PI*t/.7),g=3+17*c;
  ikArm(P,X,'R',[CX+g,212],OUT,'aberta');ikArm(P,X,'L',[CX+g,212],OUT,'aberta');P.body.by=-1.5*c;P.body.hr=0;return P;};
MV.shrug=(t,X)=>{const P=MV.idle(t,X),k=ease3(clamp(.5+.62*Math.sin(2*Math.PI*t/2.4-1.3),0,1));
  const mk=()=>lerpP(mkA(84,88,'relaxada'),mkA(70,-26,'aberta'),k);P.arms.R=mk();P.arms.L=mk();P.body.shr=9*k;P.body.hr=5*k*SIN(t,2.4,.4);return P;};
MV.jump=(t,X)=>{const P=rest(X),T=1.3,p=(t/T)%1,air=p<.14?0:p<.74?Math.sin(Math.PI*(p-.14)/.6):0;
  P.body.by=-96*air;P.air=air;P.legs.R.fl=1-.22*air;P.legs.L.fl=1-.22*air;P.legs.R.sl=1-.3*air;P.legs.L.sl=1-.3*air;P.legs.R.hip=88-4*air;P.legs.L.hip=88-4*air;
  const mk=()=>lerpP(mkA(84,88,'relaxada'),mkA(-48,-72,'aberta'),air);P.arms.R=mk();P.arms.L=mk();P.body.hr=2*air*SIN(t,.5);return P;};
MV.cheer=(t,X)=>{const P=rest(X),ph=2*Math.PI*t/.7;P.body.by=-6*Math.abs(Math.sin(ph/2));P.body.sx=1.4*Math.sin(ph/2);
  const r=mkA(-50,-72+9*Math.sin(ph),'aberta');r.wrist=6*Math.sin(ph+1);const l=mkA(-50,-72-9*Math.sin(ph),'aberta');l.wrist=6*Math.sin(ph);P.arms.R=r;P.arms.L=l;
  P.legs.R.fl=1-.1*Math.max(0,Math.sin(ph/2));P.legs.L.fl=1-.1*Math.max(0,-Math.sin(ph/2));P.body.hr=3*Math.sin(ph/2);return P;};
MV.dance=(t,X)=>{const P=rest(X),ph=2*Math.PI*t/1.0,s=Math.sin(ph),lR=Math.max(0,s),lL=Math.max(0,-s);
  P.legs.R.fl=1-.26*lR;P.legs.L.fl=1-.26*lL;P.legs.R.knee=90-8*lR;P.legs.L.knee=90-8*lL;P.body.sx=7*s;P.body.lean=5*s;P.body.by=-3*Math.abs(Math.sin(ph));P.body.hr=7*s;
  setArm(P,'R',-14+34*s,-70+30*s,'aberta');setArm(P,'L',-14-34*s,-70-30*s,'aberta');P.body.shr=2*Math.abs(s);return P;};
MV.talk=(t,X)=>{const P=MV.idle(t,X);const r=mkA(66+8*SIN(t,1.9),-30+24*SIN(t,1.3,1),'aberta');r.wrist=8*SIN(t,1.3);const l=mkA(76+6*SIN(t,2.3,2),-6+20*SIN(t,1.7,.4),'aberta');l.wrist=-6*SIN(t,1.7);
  P.arms.R=r;P.arms.L=l;P.body.hr=2.5*SIN(t,2.9);P.body.hy=1.2*SIN(t,.8);P.talk=1;return P;};
MV.present=(t,X)=>{const P=MV.idle(t,X);const r=mkA(18,4+3*SIN(t,2.4),'oferecer');r.wrist+=3*SIN(t,2.4,1);P.arms.R=r;const l=mkA(80,70,'relaxada');P.arms.L=l;P.body.look=2.6;P.body.hx+=2;P.body.hr+=2;return P;};
MV.thumbs=(t,X)=>{const P=MV.idle(t,X);const r=mkA(58,-82+4*SIN(t,1.4),'joia');r.wrist+=3*SIN(t,1.4);P.arms.R=r;P.body.hr=2;return P;};
MV.phone=(t,X)=>{const P=MV.idle(t,X);ikArm(P,X,'R',[CX+37*X.B.tk+8,138],DOWN,'grip',.62);ikArm(P,X,'L',[CX+37*X.B.tk-4,250],OUT,'relaxada');P.ph=1;P.body.hr=-3+1.5*SIN(t,3.5);P.body.hx=-2;return P;};
const MV_IDS=Object.keys(MV);
/* ---------- compõe o estado completo de um personagem num instante ---------- */
const HASH=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);};
function target(e,ch,B,t){
  const X={B},fn=MV[e.mv||'idle']||MV.idle,P=fn(t,X),bd=P.body,mood=MOODS[e.mood]||MOODS.neutral;
  P.face=Object.assign({},mood,{look:bd.look||0,bl:0,bR:0});
  /* cabeça */
  const hm=e.hm||'none';
  if(hm==='yes'){bd.hy+=5*Math.sin(2*Math.PI*t/.85)-1;bd.hr+=0;P.face.bT+=0;}
  else if(hm==='no'){bd.hx+=5*SIN(t,1.1);bd.hr+=7*SIN(t,1.1);P.face.look+=2*SIN(t,1.1);}
  else if(hm==='look'){bd.hr+=9*SIN(t,5.5);bd.hx+=4*SIN(t,5.5);P.face.look+=3*SIN(t,5.5,.4);}
  /* boca falando */
  if(e.mm==='talk'||P.talk){const a=.65+.35*Math.sin(t*3.1);P.face.mo=Math.max(P.face.mo,0)+ .4+4.2*Math.abs(Math.sin(t*9.5))*a;P.face.mw=P.face.mw*(.82+.18*Math.cos(t*9.5));}
  /* respiração e piscada */
  if(!P.frozen){bd.br=0;const per=3.6+(e.id%3)*.37,ph=((t+(e.id||0)*.9)%per),dur=.14;
    if(ph>per-dur)P.face.bl=Math.sin((ph-(per-dur))/dur*Math.PI);}
  /* objeto na mão direita */
  if(ch.prop&&ch.prop!=='none'&&!['wave','raise','point','thumbs','clap'].includes(e.mv))P.arms.R=lerpP(P.arms.R,mkA(P.arms.R.up,P.arms.R.fore,'grip'),1);
  return P;
}
/* ---------- parâmetros → atributos ---------- */
const BUILDS={slim:{tk:.92,lk:.92,ak:.92,hs:.96},mid:{tk:1,lk:1,ak:1,hs:1},strong:{tk:1.14,lk:1.1,ak:1.14,hs:1.06}};
const DEF={skin:'#f1c27d',hair:'#3b2a1a',top:'#2563eb',bottom:'#1f2937',shoes:'#111827',hs:'short',ts:'tee',bs:'pants',bd:'mid',shs:'sneaker',prop:'none',glasses:false,shades:false,headset:false,tie:false,hat:false,beard:false,mustache:false,badge:false,earring:false};
const LONGS=new Set(['long','hoodie','suit','labcoat']),NOSLEEVE=new Set(['tank']);
function dyn(ch,P){
  const B=BUILDS[ch.bd]||BUILDS.mid,bd=P.body,D={},legKind=(ch.ts==='dress'||ch.bs==='skirt')?'skin':(ch.bs==='shorts'?'shorts':'pants');
  D.all={transform:`translate(${F(bd.sx)} ${F(bd.by)}) translate(0 ${GROUND}) scale(1 ${F(1+.007*bd.br)}) translate(0 ${-GROUND})`};
  D.shadow={transform:`translate(${F(bd.sx)} 0) translate(150 556) scale(${F(1-.38*(P.air||0))} 1) translate(-150 -556)`,opacity:F(.14*(1-.5*(P.air||0)))};
  D.upper={transform:`rotate(${F(bd.lean)} 150 252)`};
  const hp=`translate(${F(bd.hx)} ${F(bd.hy)}) rotate(${F(bd.hr)} ${HPX} ${HPY}) translate(${HPX} ${HPY}) scale(${HK}) translate(${-HPX} ${-HPY})`;
  D.headB={transform:hp};D.headF={transform:hp};
  ['R','L'].forEach(sd=>{
    const g=armGeo(sd,P.arms[sd],B,-bd.shr);
    ['upper','fore','elbow','sleeve','palm','f1','f2','f3','f4','th'].forEach(k=>D[k+sd]={d:g[k]});
    D['arm'+sd]=g;
    const lg=legGeo(sd,P.legs[sd],B,B.lk,legKind,0);
    ['thigh','shin','knee','ank','sho'].forEach(k=>{if(lg[k]!==undefined)D[k+sd]={d:lg[k]};});
    D['shoe'+sd]={transform:lg.shoe};
  });
  const g=D.armR,fx=faceD(P.face);
  D.propR={transform:`translate(${F(g.wr[0])} ${F(g.wr[1])}) rotate(${F(g.base)})`};
  D.phone={transform:`translate(${F(g.wr[0])} ${F(g.wr[1])}) rotate(${F(g.base)})`,opacity:F(clamp(P.ph||0,0,1))};
  for(const k in fx)if(k!=='mIn')D[k]={d:fx[k]};D.mouthIn.opacity=F(fx.mIn);
  return D;
}
/* ---------- marcação SVG completa ---------- */
const at=o=>{let s='';for(const k in o){if(k==='d'&&o.d===undefined)continue;s+=` ${k}="${o[k]}"`;}return s;};
function markup(ch0,P,rid){
  const ch=Object.assign({},DEF,ch0),B=BUILDS[ch.bd]||BUILDS.mid,D=dyn(ch,P),sk=ch.skin;
  const legKind=(ch.ts==='dress'||ch.bs==='skirt')?'skin':(ch.bs==='shorts'?'shorts':'pants'),legFill=legKind==='pants'?ch.bottom:sk;
  const sleeveCol=ch.top,long=LONGS.has(ch.ts),armFill=long?sleeveCol:sk,sleeve=!NOSLEEVE.has(ch.ts);
  let h=`<g class="r2" data-rid="${rid==null?'':rid}">`;
  h+=`<ellipse data-p="shadow" cx="150" cy="556" rx="64" ry="7" fill="#000"${at(D.shadow)}/>`;
  h+=`<g data-p="all"${at(D.all)}>`;
  /* pernas */
  h+='<g>';
  const shs=ch.shs==='boot'?'boot':ch.shs==='dress'?'dress':'sneaker';
  ['L','R'].forEach(sd=>{
    h+=`<path data-p="thigh${sd}" d="${D['thigh'+sd].d}" fill="${legFill}"/><path data-p="shin${sd}" d="${D['shin'+sd].d}" fill="${legFill}"/><path data-p="knee${sd}" d="${D['knee'+sd].d}" fill="${legFill}"/>`;
    if(D['ank'+sd])h+=`<path data-p="ank${sd}" d="${D['ank'+sd].d}" fill="${sk}"/>`;
    if(D['sho'+sd])h+=`<path data-p="sho${sd}" d="${D['sho'+sd].d}" fill="${ch.bottom}"/>`;
    h+=`<g data-p="shoe${sd}" transform="${D['shoe'+sd].transform}">${shoeSVG(ch,shs)}</g>`;
  });
  h+='</g>';
  /* tronco (gira em volta do quadril) */
  h+=`<g data-p="upper"${at(D.upper)}>`;
  h+=`<g data-p="headB"${at(D.headB)}>${headBack(ch)}</g>`;
  h+=`<g transform="translate(150 0) scale(${B.tk} 1) translate(-150 0)">${bottomSVG(ch,B)}${torsoSVG(ch,B)}${bottomFront(ch,B)}`;
  if(ch.tie)h+=`<path d="M144 158L156 158L154.5 169L145.5 169Z" fill="#b91c1c"/><path d="M145.5 168L154.5 168L159 228L150 240L141 228Z" fill="#dc2626"/>`;
  if(ch.badge)h+=`<path d="M139 153L151 199M161 153L151 199" stroke="#ef4444" stroke-width="2.2" fill="none"/><rect x="140" y="198" width="22" height="28" rx="3" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="1"/><rect x="140" y="198" width="22" height="8" rx="3" fill="${dk(ch.top,.2)}"/><circle cx="151" cy="214" r="4.6" fill="#cbd5e1"/><path d="M144 222H158" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>`;
  h+='</g>';
  /* braços */
  ['L','R'].forEach(sd=>{
    h+=`<g>`;
    h+=`<path data-p="upper${sd}" d="${D['upper'+sd].d}" fill="${armFill}"/><path data-p="fore${sd}" d="${D['fore'+sd].d}" fill="${armFill}"/><path data-p="elbow${sd}" d="${D['elbow'+sd].d}" fill="${armFill}"/>`;
    h+=`<path data-p="sleeve${sd}" d="${D['sleeve'+sd].d}" fill="${sleeveCol}"${sleeve?'':' display="none"'}/>`;
    h+=`<path data-p="palm${sd}" d="${D['palm'+sd].d}" fill="${sk}"/>`;
    ['f1','f2','f3','f4','th'].forEach(k=>h+=`<path data-p="${k}${sd}" d="${D[k+sd].d}" fill="${sk}"/>`);
    h+='</g>';
  });
  /* objetos */
  if(ch.prop&&ch.prop!=='none')h+=`<g data-p="propR"${at(D.propR)}><g transform="scale(1.3)">${PROPS[ch.prop]||''}</g></g>`;
  else h+=`<g data-p="phone"${at(D.phone)}>${PROPS.phone}</g>`;
  h+=`<g data-p="headF"${at(D.headF)}>${headFront(ch,D)}</g>`;
  h+='</g></g></g>';
  return h;
}
/* aplica D em um nó vivo */
function apply(g,D){
  let c=g.__c;if(!c){c={};g.querySelectorAll('[data-p]').forEach(n=>c[n.getAttribute('data-p')]=n);g.__c=c;}
  for(const k in c){const o=D[k];if(!o)continue;const n=c[k];
    if(o.d!==undefined)n.setAttribute('d',o.d);if(o.transform!==undefined)n.setAttribute('transform',o.transform);if(o.opacity!==undefined)n.setAttribute('opacity',o.opacity);}
}
/* ---------- busto (ícones da categoria Pessoas), 120×150 ---------- */
function bust(o){
  const ch=Object.assign({},DEF,o);ch.glasses=!!o.glasses;ch.headset=!!o.headset;ch.tie=!!o.tie;ch.beard=!!o.beard;ch.badge=!!o.badge;
  if(o.suit){ch.ts='suit';ch.top='#1f2937';}else ch.top='var(--c,'+(o.top||'#2563eb')+')';
  if(o.hoodie)ch.ts='hoodie';
  if(o.plain){ch.skin='#cbd5e1';ch.hs='bald';ch.ts='tee';ch.top='var(--c,#94a3b8)';ch.glasses=ch.headset=ch.tie=ch.beard=ch.badge=false;}
  const B={tk:1.35,lk:1,ak:1.1,hs:1},face=Object.assign({},MOODS[o.mood||'neutral']||MOODS.neutral,{look:0,bl:0,bR:0});
  if(o.mm==='talk')face.mo=3.6;
  const fx=faceD(face),D={};for(const k in fx)if(k!=='mIn')D[k]={d:fx[k]};D.mouthIn.opacity=F(fx.mIn);
  const long=LONGS.has(ch.ts),armFill=long?ch.top:ch.skin,hp=`translate(${HPX} ${HPY}) scale(${HKB}) translate(${-HPX} ${-HPY})`;
  let s=`<clipPath id="r2bc"><rect width="120" height="150"/></clipPath><g clip-path="url(#r2bc)"><g transform="scale(.6316) translate(-55 18)">`;
  s+=`<g transform="${hp}">${headBack(ch)}</g><g transform="translate(150 0) scale(${B.tk} 1) translate(-150 0)">${torsoSVG(ch,B)}`;
  if(ch.tie)s+=`<path d="M144 158L156 158L154.5 169L145.5 169Z" fill="#b91c1c"/><path d="M145.5 168L154.5 168L159 228L150 240L141 228Z" fill="#dc2626"/>`;
  if(ch.badge)s+=`<path d="M139 153L151 199M161 153L151 199" stroke="#ef4444" stroke-width="2.2" fill="none"/><rect x="140" y="198" width="22" height="28" rx="3" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="1"/><rect x="140" y="198" width="22" height="8" rx="3" fill="${dk(ch.top,.2)}"/><circle cx="151" cy="214" r="4.6" fill="#cbd5e1"/>`;
  s+='</g>';
  ['L','R'].forEach(sd=>{const g=armGeo(sd,mkA(84,88,'relaxada'),B,0);s+=`<path d="${g.upper}" fill="${armFill}"/><path d="${g.fore}" fill="${armFill}"/><path d="${g.elbow}" fill="${armFill}"/>`+(NOSLEEVE.has(ch.ts)?'':`<path d="${g.sleeve}" fill="${ch.top}"/>`);});
  s+=`<g transform="${hp}">${headFront(ch,D)}</g></g></g>`;
  return s;
}
return{markup,target,dyn,apply,mkA,rest,GEST,BUILDS,DEF,MOODS,CX,UPL,FOL,TH,SLN,HPX,HPY};
})();
