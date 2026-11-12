const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const TILE=32,COLS=22,ROWS=15;
let map,player,enemies,items,keys={},running=false,last=0,attackCd=0,spawnTimer=0,depth=1,kills=0,gold=0,potions=2,level=1,xp=0,maxHp=100,hp=100,atk=12;
const $=id=>document.getElementById(id);
function log(s){const p=document.createElement('p');p.textContent=s;$('log').prepend(p);while($('log').children.length>8)$('log').lastChild.remove()}
function carve(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx>0&&yy>0&&xx<COLS-1&&yy<ROWS-1)map[yy][xx]=0}
function makeMap(){
 map=Array.from({length:ROWS},()=>Array(COLS).fill(1));
 // rooms and corridors
 const rooms=[[1,1,7,5],[10,1,10,5],[2,9,7,5],[12,9,8,5],[8,6,5,3]];
 rooms.forEach(r=>carve(...r));
 carve(7,3,4,1);carve(4,5,1,5);carve(8,10,5,1);carve(14,5,1,5);carve(10,7,1,3);
 // scattered floor cracks/torches represented during draw
 player={x:3.5,y:3.5,dirX:1,dirY:0,swing:0,inv:0};
 enemies=[];
 const points=[[13,3],[17,3],[4,11],[16,11],[10,7]];
 points.forEach((p,i)=>enemies.push({x:p[0]+.5,y:p[1]+.5,hp: i===4?42:30,max:i===4?42:30,speed:.65+Math.random()*.15,attack:0,flash:0,kind:i===4?'brute':'slime'}));
 items=[{x:5.5,y:10.5,type:'potion'},{x:18.5,y:11.5,type:'gold'}];
}
function reset(){depth=1;kills=0;gold=0;potions=2;level=1;xp=0;maxHp=100;hp=100;atk=12;makeMap();$('startScreen').classList.add('hidden');$('endScreen').classList.add('hidden');running=true;log('探索を開始した。足音が暗闇に響く……');updateUI();last=performance.now();requestAnimationFrame(loop)}
function tile(x,y){return map[Math.floor(y)]?.[Math.floor(x)]??1}
function moveEntity(e,dx,dy){let nx=e.x+dx,ny=e.y+dy;if(tile(nx,e.y)===0)e.x=nx;if(tile(e.x,ny)===0)e.y=ny}
function attack(){if(!running||attackCd>0)return;attackCd=.34;player.swing=.18;let hit=false;for(const e of enemies){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);if(d<1.45&&(dx*player.dirX+dy*player.dirY)>-.25){e.hp-=atk;e.flash=.12;hit=true;if(e.hp<=0){kills++;gold+=e.kind==='brute'?15:5;xp+=e.kind==='brute'?25:12;log(e.kind==='brute'?'強敵を倒した！':'スライムを倒した。');if(Math.random()<.25){items.push({x:e.x,y:e.y,type:'potion'});log('回復ポーションを落とした。')}checkLevel()}}}if(!hit)log('剣が空を切った。');enemies=enemies.filter(e=>e.hp>0);updateUI()}
function checkLevel(){if(xp>=level*40){xp-=level*40;level++;maxHp+=12;hp=Math.min(maxHp,hp+25);atk+=3;log('レベルアップ！ 攻撃力と最大HPが上昇。')}}
function update(dt){if(!running)return;attackCd=Math.max(0,attackCd-dt);player.swing=Math.max(0,player.swing-dt);player.inv=Math.max(0,player.inv-dt);
 let dx=0,dy=0;if(keys.w||keys.ArrowUp)dy--;if(keys.s||keys.ArrowDown)dy++;if(keys.a||keys.ArrowLeft)dx--;if(keys.d||keys.ArrowRight)dx++;
 if(dx||dy){let l=Math.hypot(dx,dy);dx/=l;dy/=l;player.dirX=dx;player.dirY=dy;let speed=keys.Shift?4.7:2.8;moveEntity(player,dx*speed*dt,dy*speed*dt)}
 for(const e of enemies){let vx=player.x-e.x,vy=player.y-e.y,d=Math.hypot(vx,vy);e.flash=Math.max(0,e.flash-dt);e.attack=Math.max(0,e.attack-dt);if(d<6&&d>.65){moveEntity(e,vx/d*e.speed*dt,vy/d*e.speed*dt)}if(d<.78&&e.attack<=0&&player.inv<=0){hp-=e.kind==='brute'?13:8;e.attack=1.1;player.inv=.45;log(e.kind==='brute'?'強敵の一撃を受けた！':'敵の攻撃を受けた。');updateUI();if(hp<=0)endGame(false)}}
 for(const it of items){if(!it.taken&&Math.hypot(player.x-it.x,player.y-it.y)<.55){it.taken=true;if(it.type==='potion'){potions++;log('回復ポーションを入手。')}else{gold+=10;log('金貨を10枚入手。')}}}
 items=items.filter(i=>!i.taken);
 // Exit tile on far side of the map
 if(player.x>19&&player.y>11&&enemies.length===0){depth++;log(`地下${depth}階へ進んだ。敵の気配が濃くなる……`);makeMap();enemies.push({x:16.5,y:11.5,hp:35+depth*5,max:35+depth*5,speed:.8,attack:0,flash:0,kind:'slime'});$('floor').textContent=String(depth).padStart(2,'0');$('seed').textContent='DEPTH '+String(depth).padStart(2,'0')}
 updateUI();
}
function draw(){
 ctx.fillStyle='#080b10';ctx.fillRect(0,0,720,480);
 const camX=Math.max(0,Math.min(COLS-22,Math.floor(player.x)-11)),camY=Math.max(0,Math.min(ROWS-15,Math.floor(player.y)-7));
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){let sx=x*TILE,sy=y*TILE;let wall=map[y][x]===1;
  ctx.fillStyle=wall?'#202a35':((x+y)%2?'#303b40':'#344044');ctx.fillRect(sx,sy,TILE,TILE);
  if(wall){ctx.fillStyle='#293541';ctx.fillRect(sx+2,sy+2,28,5);ctx.fillStyle='#17212b';ctx.fillRect(sx+3,sy+10,26,20)}else{ctx.fillStyle='#3b4848';ctx.fillRect(sx+5,sy+7,2,2);ctx.fillRect(sx+23,sy+22,2,2)}
  ctx.strokeStyle='#111820';ctx.strokeRect(sx,sy,TILE,TILE);
 }
 // Exit glyph
 ctx.fillStyle=enemies.length===0?'#d6ae69':'#48515a';ctx.fillRect(20*TILE+5,12*TILE+4,22,24);ctx.fillStyle='#111';ctx.fillRect(20*TILE+10,12*TILE+8,12,20);ctx.fillStyle='#e6c27f';ctx.fillRect(20*TILE+18,12*TILE+17,2,2);
 for(const it of items){ctx.fillStyle=it.type==='potion'?'#80d6aa':'#e3c06e';ctx.fillRect(it.x*TILE-5,it.y*TILE-6,10,12);ctx.fillStyle='#f2ead5';ctx.fillRect(it.x*TILE-2,it.y*TILE-9,4,4)}
 for(const e of enemies){let x=e.x*TILE,y=e.y*TILE;ctx.fillStyle=e.flash>0?'#fff':(e.kind==='brute'?'#a65d62':'#79b68b');ctx.fillRect(x-10,y-9,e.kind==='brute'?21:18,18);ctx.fillStyle='#17211e';ctx.fillRect(x-5,y-3,3,3);ctx.fillRect(x+3,y-3,3,3);ctx.fillStyle='#10151a';ctx.fillRect(x-12,y-15,24,3);ctx.fillStyle='#d96f70';ctx.fillRect(x-12,y-15,24*Math.max(0,e.hp/e.max),3)}
 // player
 let px=player.x*TILE,py=player.y*TILE;ctx.fillStyle=player.inv>0?'#fff':'#d5b778';ctx.fillRect(px-7,py-9,14,18);ctx.fillStyle='#303c50';ctx.fillRect(px-6,py-3,12,12);ctx.fillStyle='#e8d7b2';ctx.fillRect(px-4,py-10,8,5);
 ctx.fillStyle='#d8dce3';if(player.swing>0){ctx.save();ctx.translate(px,py);ctx.rotate(Math.atan2(player.dirY,player.dirX));ctx.fillRect(7,-3,22,3);ctx.restore()}else{ctx.fillRect(px+player.dirX*9-1,py+player.dirY*9-1,10,2)}
 // vignette and HUD hint
 const g=ctx.createRadialGradient(px,py,90,px,py,380);g.addColorStop(0,'#0000');g.addColorStop(1,'#05080dbb');ctx.fillStyle=g;ctx.fillRect(0,0,720,480);
 ctx.fillStyle='#d9dfd8';ctx.font='12px monospace';ctx.fillText('FIND THE GOLDEN EXIT  ↘',18,24);
 if(enemies.length===0){ctx.fillStyle='#e5c27f';ctx.fillText('EXIT UNLOCKED',555,24)}
}
function loop(t){if(!running)return;let dt=Math.min(.04,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}
function updateUI(){$('hpText').textContent=`${Math.max(0,Math.ceil(hp))} / ${maxHp}`;$('hpBar').style.width=Math.max(0,hp/maxHp*100)+'%';$('levelText').textContent=level;$('xpBar').style.width=(xp/(level*40)*100)+'%';$('atk').textContent=atk;$('gold').textContent=gold;$('kills').textContent=kills;$('potionCount').textContent='× '+potions;$('floor').textContent=String(depth).padStart(2,'0')}
function endGame(win){running=false;$('endTitle').textContent=win?'DUNGEON CLEARED':'YOU HAVE FALLEN';$('endText').textContent=`到達階層 ${depth} ・ 撃破 ${kills}体 ・ GOLD ${gold}`;$('endScreen').classList.remove('hidden')}
function usePotion(){if(!running||potions<=0||hp>=maxHp)return;potions--;hp=Math.min(maxHp,hp+35);log('回復ポーションを使用。HPが回復した。');updateUI()}
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key===' '?'Space':e.key]=true;if(e.code==='Space')attack()});
window.addEventListener('keyup',e=>{keys[e.key===' '?'Space':e.key]=false});
$('startBtn').onclick=reset;$('retryBtn').onclick=reset;$('potionBtn').onclick=usePotion;
makeMap();draw();updateUI();
