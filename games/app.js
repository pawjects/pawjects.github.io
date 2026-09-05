'use strict';
/* =========================================================================
   RETRO ARCADE — hub + games (single app.js loaded by index.html).
   The hub script below defines the console-style game shelf and the ARCADE
   registry. Each game below it is an IIFE module that builds its own screen
   (top bar + bezel + canvas + hint), registers with ARCADE, and only runs
   while it is the active game. Zero dependencies, works from file://.
   ========================================================================= */

/* ----------------------------- helpers --------------------------------- */
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const pad6=n=>String(Math.max(0,Math.floor(n))).padStart(6,'0');
const $=id=>document.getElementById(id);

/* ----------------------------- canvas ---------------------------------- */
const bgc=$('bg').getContext('2d');
function fitBg(){
  const s=Math.max(innerWidth/480,innerHeight/640);
  $('bg').style.width=(480*s)+'px';
  $('bg').style.height=(640*s)+'px';
}
addEventListener('resize',fitBg); fitBg();

/* --------------------------- pixel font --------------------------------- */
const FONT={
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','#####'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','....#','...#.','..##.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','....#','.###.'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'!':['..#..','..#..','..#..','..#..','.....','..#..','..#..'],
'-':['.....','.....','.....','#####','.....','.....','.....'],
'.':['.....','.....','.....','.....','.....','.##..','.##..'],
':':['.....','.##..','.##..','.....','.##..','.##..','.....'],
'/':['....#','...#.','..#..','.#...','#....','.....','.....'],
'<':['#....','.#...','..#..','...#.','..#..','.#...','#....'],
'>':['....#','...#.','..#..','.#...','..#..','...#.','....#'],
"'":['..#..','..#..','.#...','.....','.....','.....','.....'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'?':['.###.','#...#','....#','...#.','..#..','.....','..#..'],
'%':['##..#','##..#','..#..','..#..','.#..#','.#..##','.....'],
};

function drawTextOn(ctx,str,x,y,scale,color,glow,align){
  str=String(str).toUpperCase();
  const cw=6*scale;
  let sx=x;
  if(align==='center')sx=x-(str.length*cw-scale)/2;
  else if(align==='right')sx=x-str.length*cw+scale;
  ctx.save();
  ctx.fillStyle=color;
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=glow;}
  for(let i=0;i<str.length;i++){
    const g=FONT[str[i]];
    if(g){
      for(let r=0;r<7;r++){
        const row=g[r];
        for(let c=0;c<row.length;c++){
          if(row[c]==='#')ctx.fillRect(sx+i*cw+c*scale, y+r*scale, scale, scale);
        }
      }
    }
  }
  ctx.restore();
}

/* ----------------------------- audio ------------------------------------ */
let AC=null;
function ensureAudio(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function blip(f0,f1,dur,type,vol){
  if(!AC)return;
  const t=AC.currentTime;
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(AC.destination);
  o.start(t);o.stop(t+dur+0.02);
}
const sfx={
  move:()=>blip(320,300,0.05,'square',0.05),
  open:()=>{[523,784].forEach((f,i)=>blip(f,f,0.09,'square',0.09,i*0.07));},
  close:()=>{[392,262].forEach((f,i)=>blip(f,f,0.09,'square',0.09,i*0.07));},
};

/* --------------------------- background --------------------------------- */
const nebula=document.createElement('canvas');nebula.width=480;nebula.height=640;
(function(){
  const g=nebula.getContext('2d');
  const gr=g.createRadialGradient(240,224,40,240,224,380);
  gr.addColorStop(0,'rgba(24,48,105,0.5)');
  gr.addColorStop(0.5,'rgba(10,16,44,0.28)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,480,640);
})();
const stars=[];
for(let l=0;l<3;l++){
  stars[l]=[];
  for(let i=0;i<60;i++){
    stars[l].push({x:rand(0,480),y:rand(0,640),sp:rand(8,20)+l*14,sz:l===2?2:1});
  }
}
function drawBg(t){
  const ctx=bgc;
  ctx.fillStyle='#020308';ctx.fillRect(0,0,480,640);
  ctx.drawImage(nebula,0,0);
  for(let l=0;l<3;l++){
    ctx.globalAlpha=[0.3,0.5,0.85][l];
    ctx.fillStyle='#dfe8ff';
    for(const s of stars[l]){
      s.y+=s.sp*0.016;
      if(s.y>640){s.y=-2;s.x=rand(0,480);}
      ctx.fillRect(s.x,s.y,s.sz,s.sz);
    }
  }
  ctx.globalAlpha=1;
}

/* --------------------------- game catalog ------------------------------- */
const GAMES=[
  {id:'swarm',    name:'COSMIC SWARM', genre:'SHOOTER', ctl:['ARROWS / AD','SPACE'],        hiKey:'cs_hi',        acc:'#ff5d6c'},
  {id:'t2048',    name:'2048',         genre:'PUZZLE',  ctl:['ARROWS / WASD'],              hiKey:'t2048_best',    acc:'#7ff7ff'},
  {id:'snake',    name:'SNAKE',        genre:'ARCADE',  ctl:['ARROWS / WASD'],              hiKey:'snake_hi',      acc:'#5dff8c'},
  {id:'tetris',   name:'TETRIS',       genre:'PUZZLE',  ctl:['ARROWS','UP ROTATE','SPACE'], hiKey:'tetris_hi',     acc:'#b78bff'},
  {id:'breakout', name:'BREAKOUT',     genre:'ARCADE',  ctl:['ARROWS / AD','SPACE'],        hiKey:'breakout_hi',   acc:'#ffd34d'},
  {id:'flappy',   name:'FLAPPY BIRD',  genre:'FLAPPER', ctl:['SPACE / TAP'],                hiKey:'flappy_hi',     acc:'#ff7ac8'},
  {id:'racing',   name:'CAR RACING',   genre:'RACING',  ctl:['ARROWS / WASD'],              hiKey:'racing_hi',     acc:'#6fd0ff'},
  {id:'invaders', name:'SPACE INVADERS',genre:'SHOOTER',ctl:['ARROWS / AD','SPACE'],        hiKey:'invaders_hi',   acc:'#ff9f43'},
];
function getHi(g){
  try{return +localStorage.getItem(g.hiKey)||0;}catch(e){return 0;}
}

/* --------------------------- card icons --------------------------------- */
function iconCanvas(draw){
  const c=document.createElement('canvas');c.width=48;c.height=48;
  const g=c.getContext('2d');
  draw(g);
  return c;
}
function px(g,x,y,w,h,col){g.fillStyle=col;g.fillRect(x,y,w,h);}
function makeIcons(){
  const icons={};
  icons.swarm=iconCanvas(g=>{
    px(g,17,4,1,2,'#ff5d6c');px(g,16,6,3,1,'#ff5d6c');
    px(g,14,7,5,1,'#ff5d6c');px(g,12,8,9,1,'#ff5d6c');
    px(g,14,9,5,1,'#ff5d6c');px(g,15,10,3,1,'#ff5d6c');
    px(g,16,11,1,2,'#ff5d6c');
    px(g,20,16,1,4,'#27d9ff');px(g,19,17,3,1,'#27d9ff');px(g,19,18,3,1,'#27d9ff');
    px(g,18,19,5,1,'#27d9ff');px(g,16,20,9,1,'#27d9ff');px(g,18,21,5,1,'#27d9ff');
    px(g,20,22,1,4,'#27d9ff');
    px(g,24,23,3,2,'#ffd34d');
    px(g,28,20,4,4,'#ffd34d');
    px(g,26,22,8,2,'#ffd34d');
  });
  icons.t2048=iconCanvas(g=>{
    px(g,4,4,18,18,'#0a0d18');
    px(g,6,6,6,6,'#7ff7ff');px(g,6,14,6,6,'#ff9f43');
    px(g,14,6,6,6,'#5dff8c');px(g,14,14,6,6,'#ffd34d');
    px(g,6,6,6,2,'rgba(255,255,255,0.4)');px(g,14,6,6,2,'rgba(255,255,255,0.4)');
  });
  icons.snake=iconCanvas(g=>{
    px(g,10,8,4,2,'#5dff8c');px(g,14,8,4,2,'#5dff8c');px(g,18,8,4,2,'#5dff8c');
    px(g,20,10,2,4,'#5dff8c');px(g,20,14,2,4,'#5dff8c');
    px(g,10,14,4,2,'#5dff8c');px(g,14,14,4,2,'#5dff8c');px(g,18,14,4,2,'#5dff8c');
    px(g,8,16,2,4,'#5dff8c');px(g,8,20,2,4,'#5dff8c');
    px(g,10,20,4,2,'#5dff8c');px(g,14,20,4,2,'#5dff8c');
    px(g,6,8,2,2,'#7ff7ff');
    px(g,30,12,4,4,'#ff5d6c');px(g,31,13,2,2,'rgba(255,255,255,0.6)');
  });
  icons.tetris=iconCanvas(g=>{
    px(g,14,4,4,4,'#7ff7ff');px(g,18,4,4,4,'#7ff7ff');px(g,22,4,4,4,'#7ff7ff');px(g,26,4,4,4,'#7ff7ff');
    px(g,12,10,4,4,'#b78bff');px(g,16,10,4,4,'#b78bff');px(g,20,10,4,4,'#b78bff');px(g,16,14,4,4,'#b78bff');
    px(g,12,18,4,4,'#ffd34d');px(g,16,18,4,4,'#ffd34d');px(g,12,22,4,4,'#ffd34d');px(g,16,22,4,4,'#ffd34d');
    px(g,24,16,4,4,'#ff5d6c');px(g,28,16,4,4,'#ff5d6c');px(g,28,20,4,4,'#ff5d6c');px(g,32,20,4,4,'#ff5d6c');
  });
  icons.breakout=iconCanvas(g=>{
    for(let i=0;i<4;i++)px(g,6+i*10,6,8,3,['#ff5d6c','#ffd34d','#7ff7ff','#b78bff'][i]);
    for(let i=0;i<4;i++)px(g,6+i*10,11,8,3,['#ff9f43','#5dff8c','#6fd0ff','#ff7ac8'][i]);
    px(g,21,24,6,6,'#ffffff');
    px(g,10,34,28,4,'#7ff7ff');px(g,10,34,28,1,'rgba(255,255,255,0.5)');
  });
  icons.flappy=iconCanvas(g=>{
    // bird
    px(g,18,12,6,6,'#ffd34d');px(g,20,10,2,2,'#ff7ac8');
    px(g,16,14,2,2,'#ffd34d');px(g,22,14,2,2,'#ffd34d');
    // pipe
    px(g,14,30,4,12,'#7ff7ff');px(g,22,26,4,16,'#7ff7ff');
    px(g,14,30,1,12,'#0a0d18');px(g,22,26,1,16,'#0a0d18');
    // ground
    px(g,8,42,28,4,'#5dff8c');px(g,8,42,28,1,'rgba(255,255,255,0.3)');
  });
  icons.racing=iconCanvas(g=>{
    // car body
    px(g,16,18,16,8,'#ff5d6c');px(g,14,20,20,4,'#ff5d6c');
    px(g,14,24,20,2,'#7f8bb0');
    // wheels
    px(g,18,26,4,4,'#020308');px(g,24,26,4,4,'#020308');
    px(g,18,26,4,1,'#3a3a3a');px(g,24,26,4,1,'#3a3a3a');
    // headlights
    px(g,34,20,2,2,'#ffd34d');px(g,34,22,2,2,'#ffd34d');
    // road lines
    px(g,4,34,40,2,'#4a5168');px(g,8,34,2,2,'#ffd34d');px(g,16,34,2,2,'#ffd34d');px(g,24,34,2,2,'#ffd34d');px(g,32,34,2,2,'#ffd34d');
  });
  icons.invaders=iconCanvas(g=>{
    // alien
    px(g,18,8,12,8,'#ff9f43');px(g,20,6,8,2,'#ff9f43');
    px(g,22,10,4,2,'#0a0d18');px(g,18,12,2,2,'#0a0d18');px(g,26,12,2,2,'#0a0d18');
    // legs
    px(g,18,16,2,4,'#ff9f43');px(g,26,16,2,4,'#ff9f43');
    px(g,18,18,2,2,'#0a0d18');px(g,26,18,2,2,'#0a0d18');
    // eyes
    px(g,21,9,2,2,'#020308');px(g,25,9,2,2,'#020308');
    // shields
    px(g,6,28,36,8,'#7ff7ff');px(g,6,28,36,1,'rgba(255,255,255,0.4)');
    px(g,14,36,16,4,'#5dff8c');px(g,14,36,16,1,'rgba(255,255,255,0.3)');
  });
  return icons;
}

/* --------------------------- console shelf ------------------------------ */
const icons=makeIcons();
const shelf=$('shelf');
const cards=[];
let sel=0;
const scoreEls={};
function buildCards(){
  shelf.innerHTML='';
  cards.length=0;
  GAMES.forEach((g,i)=>{
    const card=document.createElement('div');
    card.className='card'+(i===0?' sel':'');
    card.dataset.idx=i;
    card.setAttribute('role','option');
    card.setAttribute('aria-selected',i===0);
    card.setAttribute('tabindex','0');
    card.innerHTML=
      '<div class="cicon"><canvas width="48" height="48"></canvas></div>'+
      '<div class="cname">'+g.name+'</div>'+
      '<div class="ctag">'+g.genre+'</div>'+
      '<div class="cctl">'+g.ctl.map(c=>'<span>'+c+'</span>').join('')+'</div>'+
      '<div class="playhint">PRESS ENTER TO PLAY</div>'+
      '<div class="cbest"><span>BEST</span> '+pad6(getHi(g))+'</div>';
    card.querySelector('canvas').getContext('2d').drawImage(icons[g.id],0,0);
    card.addEventListener('click',()=>moveSel(i,true));
    card.addEventListener('mouseenter',()=>setSel(i));
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();moveSel(i,true);}
    });
    shelf.appendChild(card);
    cards.push(card);
    scoreEls[g.id]=card.querySelector('.cbest');
  });
}
function setSel(i){
  sel=clamp(i,0,GAMES.length-1);
  cards.forEach((c,idx)=>{
    c.classList.toggle('sel',idx===sel);
    c.setAttribute('aria-selected',idx===sel);
  });
}
function centerOn(i){
  const card=cards[i];
  if(card)shelf.scrollTo({left:card.offsetLeft-(shelf.clientWidth-card.offsetWidth)/2,behavior:'smooth'});
}
function moveSel(i,open){
  setSel(i);
  sfx.move();
  centerOn(sel);
  if(open)ARCADE.launch(GAMES[sel].id);
}
/* keep the selected card in sync with the scroll position (drag / wheel) */
shelf.addEventListener('scroll',()=>{
  if(!cards.length)return;
  const c=shelf.clientWidth/2,off=shelf.getBoundingClientRect().left;
  let best=0,bd=Infinity;
  cards.forEach((card,i)=>{
    const r=card.getBoundingClientRect();
    const d=Math.abs((r.left-off)+r.width/2-c);
    if(d<bd){bd=d;best=i;}
  });
  setSel(best);
});
$('prevBtn').addEventListener('click',()=>moveSel(sel-1));
$('nextBtn').addEventListener('click',()=>moveSel(sel+1));
/* map vertical wheel to horizontal shelf scrolling */
shelf.addEventListener('wheel',e=>{
  if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){
    e.preventDefault();
    shelf.scrollLeft+=e.deltaY;
  }
},{passive:false});

/* --------------------------- title canvas ------------------------------- */
const tcv=$('title');
const tctx=tcv.getContext('2d');
function drawTitle(t){
  tctx.clearRect(0,0,520,176);
  const pulse=1+Math.sin(t*2.2)*0.22;
  drawTextOn(tctx,'RETRO',260,30,5.2,'#7ff7ff',8+pulse*4,'center');
  drawTextOn(tctx,'ARCADE',260,84,5.2,'#ffd34d',8+pulse*4,'center');
  drawTextOn(tctx,'8 GAMES / ONE CONSOLE',260,138,1,'#4a5168',0,'center');
  drawTextOn(tctx,'SELECT + PRESS ENTER',260,158,0.85,'#6fd0ff',0,'center');
}

/* --------------------------- ARCADE registry ---------------------------- */
var ARCADE={
  active:null,
  games:{},
  register(id,api){
    this.games[id]=api;
    updRot();
    // hash deep-link (#/swarm) can launch a game before it registers; start it now
    if(this.active===id&&api&&api.start)api.start();
  },
  launch(id){
    const g=GAMES.find(x=>x.id===id);
    if(!g||this.active===id)return;
    this.exit(true);
    this.active=id;
    $('screen-'+id).classList.add('open');
    $('cabinet').style.display='none';
    ensureAudio();sfx.open();
    const api=this.games[id];
    if(api&&api.start)api.start();
    if(location.hash!=='#/'+id)location.hash='#/'+id;
  },
  exit(silent){
    const id=this.active;
    if(!id)return;
    this.active=null;
    const api=this.games[id];
    if(api&&api.stop)api.stop();
    $('screen-'+id).classList.remove('open');
    $('cabinet').style.display='';
    if(!silent)sfx.close();
    history.replaceState(null,'',location.pathname+location.search);
  },
  reportScore(id,hi){
    const el=scoreEls[id];
    if(el)el.innerHTML='<span>BEST</span> '+pad6(hi);
  }
};

/* Build a game screen: top bar (menu button + title), bezel + canvas, hint.
   Returns the canvas element so each game module can draw into it. */
function mountScreen(id,title,hint){
  const el=$('screen-'+id);
  el.innerHTML=
    '<div class="gtopbar"><button class="mbtn" type="button" onclick="ARCADE.exit()">&#9664; MENU</button>'+
    '<div class="gtitle"><b>NOW PLAYING:</b> '+title+'</div></div>'+
    '<div class="bezel"><canvas id="g-'+id+'" width="480" height="640"></canvas><div class="scanlines"></div></div>'+
    '<div class="hint">'+hint+'</div>'+
    '<div class="rot">ROTATE FOR A BIGGER VIEW</div>';
  return $('g-'+id);
}
/* rotate hint: nudges players to turn a phone sideways on short landscape screens */
function updRot(){
  const show=innerWidth>innerHeight&&innerHeight<500&&innerWidth<1000;
  document.querySelectorAll('.rot').forEach(el=>el.style.display=show?'block':'none');
}
addEventListener('resize',updRot);

/* --------------------------- keyboard ----------------------------------- */
addEventListener('keydown',e=>{
  ensureAudio();
  if(ARCADE.active)return;
  switch(e.code){
    case'ArrowRight':case'KeyD':moveSel(sel+1);e.preventDefault();break;
    case'ArrowLeft':case'KeyA':moveSel(sel-1);e.preventDefault();break;
    case'Enter':case'Space':moveSel(sel,true);e.preventDefault();break;
    case'Digit1':case'Numpad1':ARCADE.launch(GAMES[0].id);break;
    case'Digit2':case'Numpad2':ARCADE.launch(GAMES[1].id);break;
    case'Digit3':case'Numpad3':ARCADE.launch(GAMES[2].id);break;
    case'Digit4':case'Numpad4':ARCADE.launch(GAMES[3].id);break;
    case'Digit5':case'Numpad5':ARCADE.launch(GAMES[4].id);break;
    case'Digit6':case'Numpad6':ARCADE.launch(GAMES[5].id);break;
    case'Digit7':case'Numpad7':ARCADE.launch(GAMES[6].id);break;
    case'Digit8':case'Numpad8':ARCADE.launch(GAMES[7].id);break;
  }
});

/* --------------------------- hash routing ------------------------------- */
addEventListener('hashchange',()=>{
  const m=location.hash.match(/^#\/([a-z0-9]+)$/);
  if(m)ARCADE.launch(m[1]);
  else if(ARCADE.active)ARCADE.exit(true);
});
(function boot(){
  const m=location.hash.match(/^#\/([a-z0-9]+)$/);
  if(m)ARCADE.launch(m[1]);
})();

/* --------------------------- Telegram Mini App ------------------------- */
(function(){
  if(!window.Telegram||!Telegram.WebApp)return;
  try{
    const wa=Telegram.WebApp;
    wa.ready();
    wa.expand();
    if(wa.disableVerticalSwipes)wa.disableVerticalSwipes();
    if(wa.setHeaderColor)wa.setHeaderColor('#020308');
    if(wa.setBackgroundColor)wa.setBackgroundColor('#020308');
    addEventListener('resize',()=>{fitBg();updRot();});
  }catch(e){}
})();

/* --------------------------- boot --------------------------------------- */
buildCards();
function loop(now){
  const t=now/1000;
  drawBg(t);
  drawTitle(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ============================ THE GAMES ============================ */
/* ============================ COSMIC SWARM ============================ */
(function(){
'use strict';
const ID='swarm';

/* ----------------------------- helpers --------------------------------- */
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;
const pad6=n=>String(Math.max(0,Math.floor(n))).padStart(6,'0');
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];

/* ----------------------------- canvas ---------------------------------- */
const W=480,H=640;
const cv=mountScreen(ID,'COSMIC SWARM','<b>H</b> hub &nbsp;·&nbsp; <b>&#8592; &#8594; / A D</b> move &nbsp;·&nbsp; <b>SPACE</b> fire &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; <b>M</b> mute &nbsp;·&nbsp; touch: drag + auto-fire');
const ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;

function fit(){
  const sc=document.getElementById('screen-'+ID);
  const bez=cv.parentElement;
  const cs=getComputedStyle(bez),ss=getComputedStyle(sc);
  const tb=sc.querySelector('.gtopbar'),hi=sc.querySelector('.hint'),ro=sc.querySelector('.rot');
  let padW=parseFloat(ss.paddingLeft)+parseFloat(ss.paddingRight)+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
  let padH=parseFloat(ss.paddingTop)+parseFloat(ss.paddingBottom)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  if(tb)padH+=tb.offsetHeight+parseFloat(getComputedStyle(tb).marginBottom||'0');
  if(hi)padH+=hi.offsetHeight+parseFloat(getComputedStyle(hi).marginTop||'0');
  if(ro&&ro.offsetHeight)padH+=ro.offsetHeight+8;
  const s=Math.max(0.15,Math.min((sc.clientWidth-padW)/W,(sc.clientHeight-padH)/H,2.4));
  cv.style.width=Math.round(W*s)+'px';
  cv.style.height=Math.round(H*s)+'px';
}
addEventListener('resize',()=>{if(window.ARCADE&&ARCADE.active===ID)fit();});

/* --------------------------- pixel font --------------------------------- */
const FONT={
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','#####'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','....#','...#.','..##.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','....#','.###.'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'!':['..#..','..#..','..#..','..#..','.....','..#..','..#..'],
'-':['.....','.....','.....','#####','.....','.....','.....'],
'.':['.....','.....','.....','.....','.....','.##..','.##..'],
':':['.....','.##..','.##..','.....','.##..','.##..','.....'],
'/':['....#','...#.','..#..','.#...','#....','.....','.....'],
'<':['#....','.#...','..#..','...#.','..#..','.#...','#....'],
'>':['....#','...#.','..#..','.#...','..#..','...#.','....#'],
"'":['..#..','..#..','.#...','.....','.....','.....','.....'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'?':['.###.','#...#','....#','...#.','..#..','.....','..#..'],
'%':['##..#','##..#','..#..','..#..','.#..#','.#..##','.....'],
};

function drawText(str,x,y,scale,color,glow,align){
  str=String(str).toUpperCase();
  const cw=6*scale;
  let sx=x;
  if(align==='center')sx=x-(str.length*cw-scale)/2;
  else if(align==='right')sx=x-str.length*cw+scale;
  ctx.save();
  ctx.fillStyle=color;
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=9;}
  for(let i=0;i<str.length;i++){
    const g=FONT[str[i]];
    if(g){
      for(let r=0;r<7;r++){
        const row=g[r];
        for(let c=0;c<row.length;c++){
          if(row[c]==='#')ctx.fillRect(sx+i*cw+c*scale, y+r*scale, scale, scale);
        }
      }
    }
  }
  ctx.restore();
}

/* ----------------------------- sprites ---------------------------------- */
function makeSprite(rows,pal){
  const h=rows.length,w=Math.max(...rows.map(r=>r.length));
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d');
  for(let y=0;y<h;y++){const row=rows[y];for(let x=0;x<w;x++){
    const col=pal[row[x]]; if(col){g.fillStyle=col;g.fillRect(x,y,1,1);}
  }}
  return {img:c,w:w,h:h};
}
function glowSprite(src,color,blur){
  const c=document.createElement('canvas');
  c.width=src.w+blur*4; c.height=src.h+blur*4;
  const g=c.getContext('2d');
  g.shadowColor=color; g.shadowBlur=blur;
  g.drawImage(src.img,blur*2,blur*2);
  g.shadowBlur=0;
  g.drawImage(src.img,blur*2,blur*2);
  return {img:c,w:src.w,h:src.h,gw:c.width,gh:c.height};
}
function drawSprite(s,x,y,scale){
  const w=(s.gw||s.w)*scale,h=(s.gh||s.h)*scale;
  ctx.drawImage(s.img,Math.round(x-w/2),Math.round(y-h/2),w,h);
}

const SHIP=makeSprite([
'.....#.....',
'....###....',
'....###....',
'...#####...',
'..##.#.##..',
'.###.#.###.',
'.###.#.###.',
'##..###..##',
'###########',
],{'#':'#27d9ff','+':'#eaffff'});
const SHIP_GLOW=glowSprite(SHIP,'#27d9ff',6);

const SPR_GRUNT=makeSprite([
'...#####...',
'..##...##..',
'.#.#...#.#.',
'##..#.#..##',
'###########',
'.#..#.#..#.',
'..##.#.##..',
'...#...#...',
],{'#':'#ff5d6c'});
const SPR_DIVER=makeSprite([
'....#.#....',
'...#####...',
'..##-#-##..',
'.###-#-###.',
'##..###..##',
'.#..#.#..#.',
'..#.....#..',
],{'#':'#3fa9ff','-':'#0d3f8c'});
const SPR_TANK=makeSprite([
'..#######..',
'.###-#-###.',
'##..#.#..##',
'##..###..##',
'##.#####.##',
'###########',
'.##..#..##.',
'..#.....#..',
],{'#':'#5dff8c','-':'#0d7a2e'});
const SPRITES=[SPR_GRUNT,SPR_DIVER,SPR_TANK];
const SPR_GLOW=[glowSprite(SPR_GRUNT,'#ff5d6c',5),glowSprite(SPR_DIVER,'#3fa9ff',5),glowSprite(SPR_TANK,'#5dff8c',5)];
const EN_R=[10,10,13];

/* ----------------------------- audio ------------------------------------ */
let AC=null,master=null,muted=false;
try{muted=localStorage.getItem('cs_mute')==='1';}catch(e){}
function ensureAudio(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f0,f1,dur,type,vol,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(master);
  o.start(t);o.stop(t+dur+0.02);
}
function noise(dur,vol,fc,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const len=Math.floor(AC.sampleRate*dur);
  const buf=AC.createBuffer(1,len,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1000;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f);f.connect(g);g.connect(master);
  src.start(t);
}
const sfx={
  laser:()=>tone(880,220,0.09,'square',0.12),
  eshot:()=>tone(320,140,0.08,'sawtooth',0.07),
  boom:()=>{noise(0.35,0.5,1200);tone(150,40,0.3,'sine',0.4);},
  boomBig:()=>{noise(0.9,0.7,700);tone(110,30,0.8,'sine',0.5);tone(60,25,1,'triangle',0.4);},
  dive:()=>{tone(700,300,0.16,'square',0.1);},
  hit:()=>tone(500,300,0.06,'square',0.12),
  power:()=>{[523,659,784].forEach((f,i)=>tone(f,f,0.1,'square',0.12,i*0.07));},
  life:()=>{[392,523,659,784].forEach((f,i)=>tone(f,f,0.12,'square',0.12,i*0.09));},
  wave:()=>{[392,523,659,784,1046].forEach((f,i)=>tone(f,f,0.14,'square',0.12,i*0.1));},
  over:()=>{[392,330,262,196,131].forEach((f,i)=>tone(f,f,0.3,'square',0.14,i*0.22));},
  hi:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,f,0.12,'triangle',0.15,i*0.08));},
  shield:()=>tone(1200,600,0.1,'triangle',0.12),
};
function toggleMute(){
  muted=!muted;
  try{localStorage.setItem('cs_mute',muted?'1':'0');}catch(e){}
}

/* --------------------------- background --------------------------------- */
const nebula=document.createElement('canvas');nebula.width=W;nebula.height=H;
(function(){
  const g=nebula.getContext('2d');
  const gr=g.createRadialGradient(W/2,H*0.35,40,W/2,H*0.35,380);
  gr.addColorStop(0,'rgba(24,48,105,0.5)');
  gr.addColorStop(0.5,'rgba(10,16,44,0.28)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
})();
const stars=[];
for(let l=0;l<3;l++){
  stars[l]=[];
  for(let i=0;i<60;i++){
    stars[l].push({x:rand(0,W),y:rand(0,H),sp:rand(8,20)+l*14,sz:l===2?2:1});
  }
}

/* --------------------------- game state --------------------------------- */
let state='title';        // title | playing | waveclear | gameover
let paused=false;
let score=0,hi=0,wave=0,lives=3;
let hiBeaten=false,invaded=false;
let nextLifeAt=15000;
let carrierCycle=0;
let diveTimer=3;
let shake=0,hitStop=0,flash=0,banner='',bannerT=0,lastBonus=0;
try{hi=+localStorage.getItem('cs_hi')||0;}catch(e){}

let bullets=[],ebullets=[],particles=[],rings=[],floaters=[],powerups=[];
let enemies=[];
const formation={x:W/2,y:64,dir:1,sp:0,entered:0,alive:0};

const player={x:W/2,y:H-64,fireCd:0,power:1,shield:false,inv:0,dead:false,respawn:0};

const demos=[];
for(let i=0;i<3;i++)demos.push({type:randi(0,2),t:rand(0,10),y:rand(140,320)});

/* --------------------------- hub link ----------------------------------- */
function exitToHub(){
  if(window.ARCADE)ARCADE.exit();
}
function pushScore(){
  if(window.ARCADE)ARCADE.reportScore(ID,hi);
}

function resetPlayer(){
  player.x=W/2;player.y=H-64;player.fireCd=0;player.power=1;
  player.shield=false;player.inv=0;player.dead=false;player.respawn=0;
}
function startGame(){
  score=0;lives=3;wave=0;hiBeaten=false;invaded=false;paused=false;
  nextLifeAt=15000;carrierCycle=0;shake=0;hitStop=0;flash=0;
  resetPlayer();
  spawnWave(1);
  state='playing';
}
function endGame(invade){
  state='gameover';invaded=!!invade;
  if(score>hi){hi=score;try{localStorage.setItem('cs_hi',hi);}catch(e){}sfx.hi();}
  pushScore();
  sfx.over();
}
function addScore(n){
  score+=n;
  if(score>hi){hi=score;hiBeaten=true;try{localStorage.setItem('cs_hi',hi);}catch(e){}}
  if(score>=nextLifeAt){nextLifeAt+=15000;lives=Math.min(6,lives+1);sfx.life();
    floaters.push({x:player.x,y:player.y-30,txt:'1UP',t:0,life:1,col:'#ffd34d'});}
}

/* --------------------------- waves -------------------------------------- */
function slotPos(en){return{x:formation.x+(en.col-2)*48,y:formation.y+en.row*42};}
function spawnWave(n){
  wave=n;
  formation.x=W/2;formation.y=64;formation.dir=1;
  formation.entered=0;formation.alive=20;formation.sp=34+wave*7;
  bullets=[];ebullets=[];powerups=[];floaters=[];
  diveTimer=2.2;
  const order=[];
  for(let i=0;i<20;i++)order.push(i);
  for(let i=19;i>0;i--){const j=randi(0,i);[order[i],order[j]]=[order[j],order[i]];}
  enemies=[];
  for(let k=0;k<20;k++){
    const col=k%5,row=Math.floor(k/5);
    const type=row===0?2:(row===1?1:0);
    const en={
      type:type,col:col,row:row,hp:type===2?2:1,
      state:'entry',entryT:0,entryDur:rand(1.0,1.5),entryDelay:0.14*order[k],
      entryFrom:{x:rand(0,W),y:rand(-180,-50)},
      wob:rand(0,TAU),fireCd:rand(1,3),flash:0,
      carrier:false,dead:false,dive:null,
      x:rand(0,W),y:rand(-180,-50),
    };
    enemies.push(en);
  }
  enemies[randi(0,19)].carrier=true;
  banner='WAVE '+wave;bannerT=1.7;
  sfx.wave();
}

/* --------------------------- combat ------------------------------------- */
function firePlayer(){
  const bx=player.x,by=player.y-12;
  if(player.power>=3){
    bullets.push({x:bx-14,y:by,vx:0,vy:-470,dead:false});
    bullets.push({x:bx,y:by,vx:0,vy:-470,dead:false});
    bullets.push({x:bx+14,y:by,vx:0,vy:-470,dead:false});
  }else if(player.power===2){
    bullets.push({x:bx-6,y:by,vx:0,vy:-470,dead:false});
    bullets.push({x:bx+6,y:by,vx:0,vy:-470,dead:false});
  }else{
    bullets.push({x:bx,y:by,vx:0,vy:-470,dead:false});
  }
  player.fireCd=player.power>=3?0.22:0.26;
  sfx.laser();
}
function shootEnemy(en){
  if(ebullets.length>6+Math.floor(wave/2))return;
  const a=Math.atan2(player.y-en.y,player.x-en.x)+rand(-0.12,0.12);
  const sp=150+wave*8;
  ebullets.push({x:en.x,y:en.y+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,dead:false});
  sfx.eshot();
}
function startDive(en){
  en.state='dive';
  en.dive={t:0,mode:Math.random()<0.55?'swoop':'return',targetX:player.x,wob:rand(0,TAU),dir:Math.random()<0.5?1:-1};
}
function killEnemy(en){
  en.dead=true;formation.alive--;
  const pts=[100,150,300][en.type];
  addScore(pts);
  floaters.push({x:en.x,y:en.y-14,txt:String(pts),t:0,life:0.8,col:en.type===2?'#5dff8c':'#ffffff'});
  explode(en.x,en.y,en.type===2?2:1);
  hitStop=Math.max(hitStop,0.045);
  shake=Math.min(shake+3,10);
  if(en.carrier)dropPower(en.x,en.y);
  sfx.boom();
}
function dropPower(x,y){
  let type;
  if(wave%5===4)type='1';
  else type=['D','T','S'][carrierCycle++%3];
  powerups.push({x:x,y:y,type:type,vy:90,t:rand(0,TAU)});
}
function killPlayer(){
  if(player.inv>0)return;
  if(player.shield){player.shield=false;player.inv=0.6;sfx.shield();return;}
  player.dead=true;player.respawn=1.4;
  lives--;player.power=1;player.shield=false;
  explode(player.x,player.y,3);
  shake=14;hitStop=0.22;flash=0.35;
  sfx.boomBig();
}
function respawnPlayer(){
  player.dead=false;player.x=W/2;player.inv=2.5;player.fireCd=0.4;
}
function explode(x,y,size){
  const n=size===3?46:(size===2?22:13);
  const colors=['#ffffff','#ffd9a0','#ff5d6c','#ff9f43','#ffe74c'];
  for(let i=0;i<n;i++){
    const a=rand(0,TAU),sp=rand(30,size===3?240:150);
    particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      life:rand(0.3,size===3?0.9:0.6),t:0,col:pick(colors),sz:rand(1,size===3?3:2)});
  }
  rings.push({x:x,y:y,r:4,max:size===3?70:40,life:0.45,t:0,col:size===3?'#ffd9a0':'#7ff7ff'});
}

/* --------------------------- input -------------------------------------- */
const pressed={left:false,right:false,fire:false};
let touching=false;
addEventListener('keydown',e=>{
  if(!window.ARCADE||ARCADE.active!==ID)return;
  ensureAudio();
  if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  switch(e.code){
    case'ArrowLeft':case'KeyA':pressed.left=true;break;
    case'ArrowRight':case'KeyD':pressed.right=true;break;
    case'Space':
      if(state==='title'||state==='gameover'){if(!e.repeat)startGame();}
      else pressed.fire=true;
      break;
    case'Enter':
      if((state==='title'||state==='gameover')&&!e.repeat)startGame();
      break;
    case'KeyH':if(!e.repeat)exitToHub();break;
    case'KeyM':if(!e.repeat)toggleMute();break;
    case'KeyP':case'Escape':if(!e.repeat&&state==='playing')paused=!paused;break;
  }
});
addEventListener('keyup',e=>{
  switch(e.code){
    case'ArrowLeft':case'KeyA':pressed.left=false;break;
    case'ArrowRight':case'KeyD':pressed.right=false;break;
    case'Space':pressed.fire=false;break;
  }
});
addEventListener('blur',()=>{pressed.left=pressed.right=pressed.fire=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')paused=true;});

function touchX(e){
  const r=cv.getBoundingClientRect();
  const tx=(e.touches[0].clientX-r.left)/r.width*W;
  player.x=clamp(tx,14,W-14);
}
cv.addEventListener('touchstart',e=>{
  e.preventDefault();ensureAudio();
  touching=true;touchX(e);
  if(state==='title'||state==='gameover')startGame();
},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();touchX(e);},{passive:false});
cv.addEventListener('touchend',e=>{e.preventDefault();touching=false;},{passive:false});

/* --------------------------- update ------------------------------------- */
function updateFx(dt){
  for(const b of bullets){b.y+=b.vy*dt;b.x+=b.vx*dt;}
  for(const b of ebullets){b.y+=b.vy*dt;b.x+=b.vx*dt;}
  for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;}
  for(const r of rings){r.t+=dt;}
  for(const f of floaters){f.t+=dt;f.y-=24*dt;}
  for(const p of powerups){p.t+=dt;p.y+=p.vy*dt;p.x+=Math.sin(p.t*3)*30*dt;}
  bullets=bullets.filter(b=>!b.dead&&b.y>-12);
  ebullets=ebullets.filter(b=>b.y<H+16&&b.x>-10&&b.x<W+10);
  particles=particles.filter(p=>p.t<p.life);
  rings=rings.filter(r=>r.t<r.life);
  floaters=floaters.filter(f=>f.t<f.life);
  powerups=powerups.filter(p=>p.y<H+20);
}
function update(dt,t){
  for(let l=0;l<3;l++)for(const s of stars[l]){s.y+=s.sp*dt;if(s.y>H){s.y=-2;s.x=rand(0,W);}}
  flash=Math.max(0,flash-dt*1.6);

  if(state==='title'){
    for(const d of demos)d.t+=dt;
    return;
  }
  if(state==='gameover'){updateFx(dt);return;}

  if(!player.dead){
    // movement + fire
    let mv=0;
    if(pressed.left)mv--;
    if(pressed.right)mv++;
    player.x=clamp(player.x+mv*300*dt,14,W-14);
    player.fireCd-=dt;
    if((pressed.fire||touching)&&player.fireCd<=0)firePlayer();
    if(player.inv>0)player.inv-=dt;
  }else{
    player.respawn-=dt;
    if(player.respawn<=0){
      if(lives<=0)endGame(false);
      else respawnPlayer();
    }
  }

  updateWorld(dt);

  if(state==='waveclear'){
    bannerT-=dt;
    if(bannerT<=0){spawnWave(wave+1);state='playing';}
  }
}
function updateWorld(dt){
  updateFx(dt);

  // formation drift (once fully entered)
  if(formation.entered>=20&&formation.alive>0){
    const sp=formation.sp*(0.7+(20-formation.alive)/20*0.8);
    formation.x+=formation.dir*sp*dt;
    const left=formation.x-(2*48+10),right=formation.x+(2*48+10);
    if(left<10){formation.x=10+2*48+10;formation.dir=1;formation.y+=13;}
    if(right>W-10){formation.x=W-10-2*48-10;formation.dir=-1;formation.y+=13;}
    if(formation.y>=420){endGame(true);return;}
  }

  // enemies
  for(const en of enemies){
    if(en.dead)continue;
    en.flash=Math.max(0,en.flash-dt);
    if(en.state==='entry'){
      en.entryDelay-=dt;
      if(en.entryDelay<=0){
        en.entryT+=dt/en.entryDur;
        const t=Math.min(1,en.entryT);
        const s=slotPos(en);
        const p=t*t*(3-2*t); // ease in-out
        en.x=en.entryFrom.x+(s.x-en.entryFrom.x)*p+Math.sin(t*10+en.wob)*10*(1-t);
        en.y=en.entryFrom.y+(s.y-en.entryFrom.y)*p;
        if(t>=1){en.x=s.x;en.y=s.y;en.state='formation';formation.entered++;en.fireCd=rand(1,2.5);}
      }
    }else if(en.state==='formation'){
      const s=slotPos(en);
      en.x=s.x;en.y=s.y;
      en.fireCd-=dt;
      if(en.fireCd<=0){en.fireCd=rand(2.2,4.2);shootEnemy(en);}
    }else{
      updateDive(en,dt);
    }
  }

  // dive waves
  diveTimer-=dt;
  if(diveTimer<=0&&formation.alive>0&&formation.entered>=20){
    const pool=enemies.filter(e=>!e.dead&&e.state==='formation');
    const count=Math.min(4,pool.length,1+Math.floor(wave/2));
    for(let i=0;i<count;i++)startDive(pool[randi(0,pool.length-1)]);
    diveTimer=Math.max(1.8,4.6-wave*0.35);
    if(count>0)sfx.dive();
  }

  // player bullets vs enemies
  for(const b of bullets){
    if(b.dead)continue;
    for(const en of enemies){
      if(en.dead)continue;
      if(Math.hypot(b.x-en.x,b.y-en.y)<EN_R[en.type]+3){
        b.dead=true;
        en.hp--;en.flash=0.12;
        if(en.hp<=0)killEnemy(en);
        else{sfx.hit();for(let i=0;i<4;i++)particles.push({x:b.x,y:b.y,vx:rand(-60,60),vy:rand(-60,60),life:0.3,t:0,col:'#ffffff',sz:1});}
        break;
      }
    }
  }

  // enemy bullets vs player
  if(!player.dead&&player.inv<=0){
    for(const b of ebullets){
      if(Math.hypot(b.x-player.x,b.y-player.y)<11){
        b.dead=true;
        killPlayer();
        break;
      }
    }
    // ramming enemies
    if(!player.dead){
      for(const en of enemies){
        if(en.dead)continue;
        if(Math.hypot(en.x-player.x,en.y-player.y)<EN_R[en.type]+11){
          killPlayer();
          break;
        }
      }
    }
  }

  // powerups
  if(!player.dead){
    for(const p of powerups){
      if(Math.hypot(p.x-player.x,p.y-player.y)<22){
        p.y=H+40; // consume
        if(p.type==='D')player.power=2;
        else if(p.type==='T')player.power=3;
        else if(p.type==='S')player.shield=true;
        else{lives=Math.min(6,lives+1);sfx.life();}
        floaters.push({x:p.x,y:p.y-12,txt:p.type==='S'?'SHIELD':(p.type==='1'?'1UP':'POWER'),t:0,life:0.9,col:'#7ff7ff'});
        sfx.power();
      }
    }
  }

  // wave clear
  if(formation.alive===0&&state==='playing'){
    state='waveclear';
    lastBonus=1000*lives;
    addScore(lastBonus);
    banner='WAVE CLEAR';bannerT=2.2;
    floaters.push({x:W/2,y:H/2-30,txt:'BONUS +'+lastBonus,t:0,life:1.6,col:'#ffd34d'});
  }
}
function updateDive(en,dt){
  const d=en.dive;
  d.t+=dt;
  const fast=en.type===1;
  if(d.mode==='swoop'){
    d.targetX=player.x;
    const vy=Math.min(60+300*d.t+(fast?80:0),380);
    en.y+=vy*dt;
    en.x+=(d.targetX-en.x)*1.6*dt+Math.sin(d.t*5+d.wob)*70*dt+d.dir*20*dt;
    if(en.y>H+30){en.dead=true;formation.alive--;}
  }else{
    if(d.t<1.1){
      d.targetX=player.x;
      const vy=Math.min(60+260*d.t,330);
      en.y+=vy*dt;
      en.x+=(d.targetX-en.x)*1.2*dt+Math.sin(d.t*6+d.wob)*50*dt;
    }else{
      const s=slotPos(en);
      en.x+=(s.x-en.x)*Math.min(1,2.6*dt);
      en.y+=(s.y-en.y)*Math.min(1,2.4*dt);
      if(Math.abs(s.x-en.x)<4&&Math.abs(s.y-en.y)<4){
        en.state='formation';en.dive=null;en.fireCd=rand(2,4);
      }
    }
  }
}

/* --------------------------- draw --------------------------------------- */
function draw(t){
  ctx.save();
  ctx.fillStyle='#020308';ctx.fillRect(0,0,W,H);
  ctx.drawImage(nebula,0,0);

  // stars
  for(let l=0;l<3;l++){
    ctx.globalAlpha=[0.3,0.5,0.85][l];
    ctx.fillStyle='#dfe8ff';
    for(const s of stars[l])ctx.fillRect(s.x,s.y,s.sz,s.sz);
  }
  ctx.globalAlpha=1;

  // screen shake on world
  if(shake>0.3){ctx.translate(rand(-shake,shake),rand(-shake,shake));shake*=0.88;if(shake<0.3)shake=0;}

  // title demo ships
  if(state==='title'){
    for(const d of demos){
      const x=W/2+Math.sin(d.t*1.3+d.type)*170;
      drawSprite(SPR_GLOW[d.type],x,d.y+Math.sin(d.t*2.2)*26,2);
    }
    drawSprite(SHIP_GLOW,W/2,H-70,2);
  }

  // powerups
  for(const p of powerups){
    const c=p.type==='D'?'#3fa9ff':p.type==='T'?'#ff9f43':p.type==='S'?'#5dff8c':'#ff5d6c';
    ctx.shadowColor=c;ctx.shadowBlur=8;
    ctx.fillStyle=c;
    ctx.fillRect(p.x-6,p.y-9,12,18);
    ctx.fillStyle='#ffffff';
    ctx.fillRect(p.x-6,p.y-9,12,3);
    ctx.shadowBlur=0;
    drawText(p.type,p.x,p.y-4,1.2,'#020308',false,'center');
  }

  // enemies
  for(const en of enemies){
    if(en.dead)continue;
    drawSprite(SPR_GLOW[en.type],en.x,en.y,2);
    if(en.flash>0){
      ctx.globalAlpha=Math.min(0.8,en.flash*8);
      ctx.fillStyle='#ffffff';
      ctx.fillRect(en.x-11,en.y-8,22,16);
      ctx.globalAlpha=1;
    }
  }

  // player
  if((state==='playing'||state==='waveclear')&&!player.dead){
    if(!(player.inv>0&&Math.floor(t*14)%2===0)){
      drawSprite(SHIP_GLOW,player.x,player.y,2);
      if(player.shield){
        ctx.strokeStyle='rgba(120,255,220,0.5)';
        ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(player.x,player.y,17,t,TAU);ctx.stroke();
      }
    }
  }

  // bullets
  ctx.shadowColor='#7ff7ff';ctx.shadowBlur=8;
  ctx.fillStyle='#eaffff';
  for(const b of bullets)ctx.fillRect(b.x-1,b.y-5,2,10);
  ctx.shadowBlur=0;
  ctx.shadowColor='#ff9a5c';ctx.shadowBlur=6;
  ctx.fillStyle='#ffd9b0';
  for(const b of ebullets)ctx.fillRect(b.x-2,b.y-4,4,8);
  ctx.shadowBlur=0;

  // particles (additive)
  ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,1-p.t/p.life);
    ctx.fillStyle=p.col;
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';

  // rings
  for(const r of rings){
    const pr=r.t/r.life;
    ctx.globalAlpha=1-pr;
    ctx.strokeStyle=r.col;
    ctx.lineWidth=2*(1-pr)+0.5;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r+(r.max-r.r)*pr,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // floaters
  for(const f of floaters){
    ctx.globalAlpha=clamp(1-f.t/f.life,0,1);
    drawText(f.txt,f.x,f.y,1.2,f.col,false,'center');
  }
  ctx.globalAlpha=1;

  ctx.restore();

  // flash
  if(flash>0){
    ctx.fillStyle='rgba(255,255,255,'+Math.min(0.5,flash)+')';
    ctx.fillRect(0,0,W,H);
  }

  // HUD
  if(state==='playing'||state==='waveclear'||state==='gameover')drawHUD();

  // banners / screens
  if(state==='title')drawTitle(t);
  else if(state==='gameover')drawGameOver(t);
  if(banner&&bannerT>0&&(state==='playing'||state==='waveclear'))drawBanner();
  if(paused)drawPaused();
}

function drawHUD(){
  drawText('SCORE',12,12,1,'#6fd0ff',false);
  drawText(pad6(score),12,22,1.6,'#ffffff',true);
  drawText('WAVE',W/2-24,12,1,'#6fd0ff',false);
  drawText(String(wave),W/2,23,1.6,'#ffffff',true,'center');
  drawText('HI',W-58,12,1,'#ffd34d',false);
  drawText(pad6(hi),W-8,22,1.6,'#ffd34d',true,'right');
  for(let i=0;i<lives;i++)drawSprite(SHIP,16+i*22,H-14,1.3);
  if(player.shield)drawText('SHIELD',W-8,H-12,0.8,'#5dff8c',false,'right');
  drawText('M '+(muted?'OFF':'ON'),8,H-12,0.8,'#5a6280',false);
}

function drawBanner(){
  const a=bannerT>1.35?(1.7-bannerT)/0.35:(bannerT<0.45?bannerT/0.45:1);
  ctx.globalAlpha=clamp(a,0,1);
  const big=banner==='WAVE CLEAR';
  drawText(banner,W/2,280,big?2.6:3.2,'#7ff7ff',true,'center');
  if(big)drawText('BONUS +'+lastBonus,W/2,325,1.3,'#ffd34d',true,'center');
  ctx.globalAlpha=1;
}

function drawTitle(t){
  ctx.fillStyle='rgba(2,3,8,0.55)';ctx.fillRect(0,0,W,H);
  drawText('COSMIC',W/2,140,4.4,'#7ff7ff',true,'center');
  drawText('SWARM',W/2,188,4.4,'#ffd34d',true,'center');
  drawText('A RETRO ARCADE SHOOTER',W/2,238,1,'#4a5168',false,'center');
  drawText('MOVE: ARROWS / A D',W/2,340,1.1,'#cfe0ff',false,'center');
  drawText('FIRE: SPACE',W/2,362,1.1,'#cfe0ff',false,'center');
  drawText('PAUSE: P    MUTE: M',W/2,384,1.1,'#cfe0ff',false,'center');
  drawText('TOUCH: DRAG + AUTOFIRE',W/2,406,1.1,'#8fa0c8',false,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,452,1.4,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER OR TAP TO START',W/2,510,1.5,'#7ff7ff',true,'center');
}

function drawGameOver(t){
  ctx.fillStyle='rgba(2,3,8,0.72)';ctx.fillRect(0,0,W,H);
  drawText('GAME OVER',W/2,220,4,'#ff5d6c',true,'center');
  if(invaded)drawText('THE SWARM INVADES!',W/2,272,1.3,'#ff9a5c',true,'center');
  drawText('SCORE '+pad6(score),W/2,330,1.8,'#ffffff',true,'center');
  if(hiBeaten)drawText('NEW HIGH SCORE!',W/2,366,1.4,'#ffd34d',true,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,402,1.3,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER TO PLAY AGAIN',W/2,496,1.5,'#7ff7ff',true,'center');
}

function drawPaused(){
  ctx.fillStyle='rgba(2,3,8,0.6)';ctx.fillRect(0,0,W,H);
  drawText('PAUSED',W/2,300,3,'#7ff7ff',true,'center');
  drawText('PRESS P TO RESUME',W/2,350,1.3,'#cfe0ff',true,'center');
}

/* --------------------------- main loop ---------------------------------- */
let last=performance.now();
let raf=null;
function loop(now){
  if(!window.ARCADE||ARCADE.active!==ID){raf=null;return;}
  const dt=Math.min(0.1,(now-last)/1000);
  last=now;
  if(!paused){
    if(hitStop>0)hitStop-=dt;
    else update(dt,now/1000);
  }
  draw(now/1000);
  raf=requestAnimationFrame(loop);
}
ARCADE.register(ID,{start:function(){fit();if(!raf)raf=requestAnimationFrame(loop);}});
})();

/* ============================ 2048 ============================ */
(function(){
'use strict';
const ID='t2048';

/* ----------------------------- helpers --------------------------------- */
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;
const pad6=n=>String(Math.max(0,Math.floor(n))).padStart(6,'0');
const easeInOut=p=>p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
const pop=p=>{const c1=1.70158,c3=c1+1;return p>=1?1:1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2);};

/* ----------------------------- canvas ---------------------------------- */
const W=480,H=640;
const cv=mountScreen(ID,'2048','<b>H</b> hub &nbsp;·&nbsp; <b>&#8592; &#8594; &#8593; &#8595; / WASD</b> move &nbsp;·&nbsp; <b>N</b> new game &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; <b>M</b> mute &nbsp;·&nbsp; touch: swipe');
const ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;

function fit(){
  const sc=document.getElementById('screen-'+ID);
  const bez=cv.parentElement;
  const cs=getComputedStyle(bez),ss=getComputedStyle(sc);
  const tb=sc.querySelector('.gtopbar'),hi=sc.querySelector('.hint'),ro=sc.querySelector('.rot');
  let padW=parseFloat(ss.paddingLeft)+parseFloat(ss.paddingRight)+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
  let padH=parseFloat(ss.paddingTop)+parseFloat(ss.paddingBottom)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  if(tb)padH+=tb.offsetHeight+parseFloat(getComputedStyle(tb).marginBottom||'0');
  if(hi)padH+=hi.offsetHeight+parseFloat(getComputedStyle(hi).marginTop||'0');
  if(ro&&ro.offsetHeight)padH+=ro.offsetHeight+8;
  const s=Math.max(0.15,Math.min((sc.clientWidth-padW)/W,(sc.clientHeight-padH)/H,2.4));
  cv.style.width=Math.round(W*s)+'px';
  cv.style.height=Math.round(H*s)+'px';
}
addEventListener('resize',()=>{if(window.ARCADE&&ARCADE.active===ID)fit();});

/* --------------------------- pixel font --------------------------------- */
const FONT={
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','#####'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','....#','...#.','..##.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','....#','.###.'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'!':['..#..','..#..','..#..','..#..','.....','..#..','..#..'],
'-':['.....','.....','.....','#####','.....','.....','.....'],
'.':['.....','.....','.....','.....','.....','.##..','.##..'],
':':['.....','.##..','.##..','.....','.##..','.##..','.....'],
'/':['....#','...#.','..#..','.#...','#....','.....','.....'],
'<':['#....','.#...','..#..','...#.','..#..','.#...','#....'],
'>':['....#','...#.','..#..','.#...','..#..','...#.','....#'],
"'":['..#..','..#..','.#...','.....','.....','.....','.....'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'?':['.###.','#...#','....#','...#.','..#..','.....','..#..'],
'%':['##..#','##..#','..#..','..#..','.#..#','.#..##','.....'],
};

function drawText(str,x,y,scale,color,glow,align){
  str=String(str).toUpperCase();
  const cw=6*scale;
  let sx=x;
  if(align==='center')sx=x-(str.length*cw-scale)/2;
  else if(align==='right')sx=x-str.length*cw+scale;
  ctx.save();
  ctx.fillStyle=color;
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=9;}
  for(let i=0;i<str.length;i++){
    const g=FONT[str[i]];
    if(g){
      for(let r=0;r<7;r++){
        const row=g[r];
        for(let c=0;c<row.length;c++){
          if(row[c]==='#')ctx.fillRect(sx+i*cw+c*scale, y+r*scale, scale, scale);
        }
      }
    }
  }
  ctx.restore();
}

/* ----------------------------- audio ------------------------------------ */
let AC=null,master=null,muted=false;
try{muted=localStorage.getItem('t2048_mute')==='1';}catch(e){}
function ensureAudio(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f0,f1,dur,type,vol,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(master);
  o.start(t);o.stop(t+dur+0.02);
}
const sfx={
  move:()=>tone(240,190,0.05,'square',0.05),
  block:()=>tone(110,90,0.05,'square',0.04),
  merge:(v)=>{const f=400*Math.pow(2,(Math.log2(v)-1)*0.15);tone(f,f*1.26,0.09,'square',0.11);tone(f*1.5,f*1.5,0.07,'triangle',0.05,0.03);},
  win:()=>{[523,659,784,1046,1318].forEach((f,i)=>tone(f,f,0.12,'square',0.12,i*0.09));},
  over:()=>{[392,330,262,196,131].forEach((f,i)=>tone(f,f,0.3,'square',0.14,i*0.22));},
  hi:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,f,0.12,'triangle',0.15,i*0.08));},
  start:()=>{[392,523,659,784].forEach((f,i)=>tone(f,f,0.12,'square',0.11,i*0.09));},
};
function toggleMute(){
  muted=!muted;
  try{localStorage.setItem('t2048_mute',muted?'1':'0');}catch(e){}
}

/* --------------------------- hub link ----------------------------------- */
function exitToHub(){
  if(window.ARCADE)ARCADE.exit();
}
function pushScore(){
  if(window.ARCADE)ARCADE.reportScore(ID,best);
}

/* --------------------------- background --------------------------------- */
const nebula=document.createElement('canvas');nebula.width=W;nebula.height=H;
(function(){
  const g=nebula.getContext('2d');
  const gr=g.createRadialGradient(W/2,H*0.35,40,W/2,H*0.35,380);
  gr.addColorStop(0,'rgba(24,48,105,0.5)');
  gr.addColorStop(0.5,'rgba(10,16,44,0.28)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
})();
const stars=[];
for(let l=0;l<3;l++){
  stars[l]=[];
  for(let i=0;i<60;i++){
    stars[l].push({x:rand(0,W),y:rand(0,H),sp:rand(8,20)+l*14,sz:l===2?2:1});
  }
}

/* --------------------------- board -------------------------------------- */
const BX=35,BY=140,PAD=10,CELL=90,GAP=10; // board 410x410
function cellXY(c,r){return{x:BX+PAD+c*(CELL+GAP),y:BY+PAD+r*(CELL+GAP)};}
function cellCenter(c,r){const p=cellXY(c,r);return{x:p.x+CELL/2,y:p.y+CELL/2};}
function tileColor(v){
  if(v>=2048)return v===2048?'#27d9ff':'#ff7ac8';
  return ({2:'#7ff7ff',4:'#5dff8c',8:'#ffd34d',16:'#ff9f43',32:'#ff5d6c',64:'#ff7ac8',128:'#b78bff',256:'#6fd0ff',512:'#ffe74c',1024:'#ffffff'})[v]||'#7ff7ff';
}
function numScale(v){
  const d=String(v).length;
  return d===1?4.2:d===2?3.6:d===3?2.8:d===4?2.3:1.8;
}

/* --------------------------- game state --------------------------------- */
let state='title';        // title | playing | gameover
let paused=false;
let score=0,best=0,startBest=0;
let won=false,bestBeaten=false;
let banner='',bannerT=0;
let cells=[],tiles=[];
let moveLock=false,pendingDir=null,pendingOver=false,moveEnd=0;
let now=0;
let particles=[],rings=[],floaters=[];
try{best=+localStorage.getItem('t2048_best')||0;}catch(e){}

function startGame(){
  score=0;won=false;bestBeaten=false;paused=false;
  startBest=best;moveLock=false;pendingDir=null;pendingOver=false;
  banner='';bannerT=0;
  cells=[];tiles=[];
  for(let c=0;c<4;c++){cells[c]=[];for(let r=0;r<4;r++)cells[c][r]=null;}
  for(let i=0;i<2;i++){const t=makeNewTile();if(t)tiles.push(t);}
  state='playing';
  sfx.start();
}
function makeNewTile(){
  const empties=[];
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)if(!cells[c][r])empties.push([c,r]);
  if(!empties.length)return null;
  const [c,r]=empties[randi(0,empties.length-1)];
  const v=Math.random()<0.9?2:4;
  cells[c][r]={v};
  const p=cellCenter(c,r);
  return {c,r,v,fromX:p.x,fromY:p.y,toX:p.x,toY:p.y,merge:false,spawn:true,animStart:now};
}
function canMove(){
  for(let c=0;c<4;c++)for(let r=0;r<4;r++){
    const v=cells[c][r]?cells[c][r].v:0;
    if(v===0)return true;
    if(c<3&&cells[c+1][r]&&cells[c+1][r].v===v)return true;
    if(r<3&&cells[c][r+1]&&cells[c][r+1].v===v)return true;
  }
  return false;
}
function endGame(){
  state='gameover';
  bestBeaten=score>startBest&&score>0;
  pushScore();
  if(bestBeaten)sfx.hi();else sfx.over();
}
function mergeFx(x,y,v){
  const col=tileColor(v);
  for(let i=0;i<10;i++){
    const a=rand(0,TAU),sp=rand(30,120);
    particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(0.25,0.55),t:0,col,sz:rand(1,2)});
  }
  if(v>=64)rings.push({x,y,r:6,max:36,life:0.4,t:0,col});
}

/* --------------------------- move logic --------------------------------- */
// slide a line toward index 0; froms[j] = source indices that produced out[j]
function slideLine(line){
  const out=new Array(4).fill(0);
  const froms=[[],[],[],[]];
  let pos=0,moved=false;
  for(let i=0;i<4;i++){
    const v=line[i];
    if(v===0)continue;
    if(out[pos]===0){
      out[pos]=v;froms[pos].push(i);
      if(i!==pos)moved=true;
    }else if(out[pos]===v&&froms[pos].length===1){
      out[pos]=v*2;froms[pos].push(i);moved=true;
    }else{
      pos++;out[pos]=v;froms[pos].push(i);
      if(i!==pos)moved=true;
    }
  }
  return {out,froms,moved};
}
function getLine(dir,li){
  const vals=[],coords=[];
  for(let i=0;i<4;i++){
    let c,r;
    if(dir===0){c=i;r=li;}        // left : row
    else if(dir===2){c=3-i;r=li;} // right: row reversed
    else if(dir===1){c=li;r=i;}   // up   : column
    else{c=li;r=3-i;}             // down : column reversed
    vals.push(cells[c][r]?cells[c][r].v:0);
    coords.push({c,r});
  }
  return {vals,coords};
}
function doMove(dir){
  if(state!=='playing'||moveLock)return;
  const results=[];
  let moved=false,gained=0,maxMerge=0;
  for(let li=0;li<4;li++){
    const {vals,coords}=getLine(dir,li);
    const {out,froms,moved:m}=slideLine(vals);
    if(m)moved=true;
    for(let j=0;j<4;j++){
      if(out[j]===0)continue;
      const srcs=froms[j].map(i=>coords[i]);
      results.push({c:coords[j].c,r:coords[j].r,v:out[j],srcs});
      if(srcs.length===2){gained+=out[j];maxMerge=Math.max(maxMerge,out[j]);}
    }
  }
  if(!moved){sfx.block();return;}

  const old=[];
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)if(cells[c][r]){
    const p=cellCenter(c,r);old.push({c,r,x:p.x,y:p.y});
  }
  const oldAt=(c,r)=>old.find(o=>o.c===c&&o.r===r);

  for(let c=0;c<4;c++)for(let r=0;r<4;r++)cells[c][r]=null;
  const next=[];
  for(const res of results){
    cells[res.c][res.r]={v:res.v};
    const src=res.srcs[res.srcs.length-1];
    const from=oldAt(src.c,src.r)||{x:cellCenter(res.c,res.r).x,y:cellCenter(res.c,res.r).y};
    const to=cellCenter(res.c,res.r);
    next.push({c:res.c,r:res.r,v:res.v,fromX:from.x,fromY:from.y,toX:to.x,toY:to.y,merge:res.srcs.length===2,spawn:false,animStart:now});
  }

  if(!won){
    for(const res of results){
      if(res.v>=2048){
        won=true;banner='YOU WIN!';bannerT=2.4;sfx.win();
        const p=cellCenter(res.c,res.r);
        floaters.push({x:p.x,y:p.y-26,txt:'2048!',t:0,life:1.4,col:'#ffd34d'});
        break;
      }
    }
  }

  const sp=makeNewTile();
  if(sp)next.push(sp);
  tiles=next;

  if(gained>0){
    score+=gained;
    if(score>best){best=score;try{localStorage.setItem('t2048_best',best);}catch(e){}}
    sfx.merge(maxMerge);
    for(const res of results){
      if(res.srcs.length===2){
        const p=cellCenter(res.c,res.r);
        mergeFx(p.x,p.y,res.v);
        floaters.push({x:p.x,y:p.y-16,txt:'+'+res.v,t:0,life:0.7,col:res.v>=128?'#ffd34d':'#7ff7ff'});
      }
    }
  }else{
    sfx.move();
  }

  moveLock=true;moveEnd=now+0.17;
  if(!canMove())pendingOver=true;
}
function requestMove(dir){
  if(moveLock){pendingDir=dir;return;}
  doMove(dir);
}

/* --------------------------- input -------------------------------------- */
addEventListener('keydown',e=>{
  if(!window.ARCADE||ARCADE.active!==ID)return;
  ensureAudio();
  const k=e.code;
  if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  const dirMap={ArrowLeft:0,KeyA:0,ArrowUp:1,KeyW:1,ArrowRight:2,KeyD:2,ArrowDown:3,KeyS:3};
  if(k in dirMap){
    if(state==='title'||state==='gameover'){if(!e.repeat)startGame();}
    else if(state==='playing'&&!paused)requestMove(dirMap[k]);
    return;
  }
  switch(k){
    case'Enter':case'Space':
      if((state==='title'||state==='gameover')&&!e.repeat)startGame();
      break;
    case'KeyN':case'KeyR':
      if(!e.repeat)startGame();
      break;
    case'KeyH':if(!e.repeat)exitToHub();break;
    case'KeyM':if(!e.repeat)toggleMute();break;
    case'KeyP':case'Escape':if(!e.repeat&&state==='playing')paused=!paused;break;
  }
});
addEventListener('blur',()=>{if(state==='playing')paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')paused=true;});

let tsx=0,tsy=0;
cv.addEventListener('touchstart',e=>{
  e.preventDefault();ensureAudio();
  const t=e.touches[0];tsx=t.clientX;tsy=t.clientY;
},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();},{passive:false});
cv.addEventListener('touchend',e=>{
  e.preventDefault();
  const t=e.changedTouches[0];
  const dx=t.clientX-tsx,dy=t.clientY-tsy;
  const ad=Math.abs(dx),bd=Math.abs(dy);
  if(ad<20&&bd<20){ // tap
    if(state==='title'||state==='gameover')startGame();
    return;
  }
  if(state==='playing'&&!paused)requestMove(ad>bd?(dx>0?2:0):(dy>0?3:1));
},{passive:false});
cv.addEventListener('mousedown',()=>{
  if(state==='title'||state==='gameover')startGame();
});

/* --------------------------- update ------------------------------------- */
function updateFx(dt){
  for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;}
  for(const r of rings){r.t+=dt;}
  for(const f of floaters){f.t+=dt;f.y-=24*dt;}
  particles=particles.filter(p=>p.t<p.life);
  rings=rings.filter(r=>r.t<r.life);
  floaters=floaters.filter(f=>f.t<f.life);
}
function update(dt){
  for(let l=0;l<3;l++)for(const s of stars[l]){s.y+=s.sp*dt;if(s.y>H){s.y=-2;s.x=rand(0,W);}}
  if(moveLock&&now>=moveEnd){
    moveLock=false;
    if(pendingOver){pendingOver=false;pendingDir=null;endGame();}
    else if(pendingDir!==null){const d=pendingDir;pendingDir=null;doMove(d);}
  }
  if(bannerT>0)bannerT-=dt;
  updateFx(dt);
}

/* --------------------------- draw --------------------------------------- */
function drawBoard(){
  ctx.save();
  ctx.fillStyle='#05060d';
  ctx.fillRect(BX,BY,410,410);
  ctx.strokeStyle='#2e3350';
  ctx.shadowColor='rgba(0,255,190,0.18)';
  ctx.shadowBlur=14;
  ctx.strokeRect(BX+0.5,BY+0.5,409,409);
  ctx.restore();
  for(let c=0;c<4;c++)for(let r=0;r<4;r++){
    const p=cellXY(c,r);
    ctx.fillStyle='#0a0d18';
    ctx.fillRect(p.x,p.y,CELL,CELL);
    ctx.strokeStyle='#1a1f33';
    ctx.strokeRect(p.x+0.5,p.y+0.5,CELL-1,CELL-1);
  }
}
function drawTile(v,x,y,scale,alpha){
  const col=tileColor(v);
  const s=CELL*scale;
  const px=Math.round(x-s/2),py=Math.round(y-s/2);
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.shadowColor=col;ctx.shadowBlur=16*scale;
  ctx.fillStyle=col;ctx.fillRect(px,py,s,s);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(px,py,s,Math.max(2,3*scale));
  ctx.fillStyle='rgba(0,0,0,0.28)';ctx.fillRect(px,py+s-2,s,2);
  ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.strokeRect(px+0.5,py+0.5,s-1,s-1);
  const ns=numScale(v)*scale;
  drawText(v,x,py+(s-7*ns)/2,ns,'#05060a',false,'center');
  ctx.restore();
}
function drawTiles(){
  for(const t of tiles){
    let x=t.toX,y=t.toY,scale=1,alpha=1;
    if(t.animStart!==undefined){
      const dur=t.spawn?0.16:0.11;
      const p=clamp((now-t.animStart)/dur,0,1);
      const e=easeInOut(p);
      x=t.fromX+(t.toX-t.fromX)*e;
      y=t.fromY+(t.toY-t.fromY)*e;
      if(t.spawn){scale=pop(p);alpha=Math.min(1,p*2.5);}
      else if(t.merge)scale=1+0.22*Math.sin(p*Math.PI);
    }
    drawTile(t.v,x,y,scale,alpha);
  }
}
function scoreBox(x,label,val){
  ctx.save();
  ctx.fillStyle='#0c0f1c';
  ctx.fillRect(x,18,92,50);
  ctx.strokeStyle='#2e3350';
  ctx.lineWidth=1;
  ctx.strokeRect(x+0.5,18.5,91,49);
  ctx.shadowColor='rgba(0,255,190,0.25)';
  ctx.shadowBlur=8;
  ctx.strokeRect(x+0.5,18.5,91,49);
  ctx.restore();
  drawText(label,x+6,26,0.8,'#6fd0ff',false);
  const s=String(Math.floor(val));
  const ns=s.length>5?1.3:1.7;
  drawText(s,x+86,40,ns,'#ffffff',true,'right');
}
function drawHUD(){
  drawText('2048',20,26,2.6,'#7ff7ff',true);
  if(won)drawText('YOU WIN!',20,64,1.1,'#ffd34d',true);
  scoreBox(268,'SCORE',score);
  scoreBox(368,'BEST',best);
  drawText('ARROWS / WASD MOVE',20,610,0.8,'#4a5168',false);
  drawText('N NEW  P PAUSE  M MUTE',250,610,0.8,'#4a5168',false);
  drawText('M '+(muted?'OFF':'ON'),446,610,0.8,'#5a6280',false);
}
function drawBanner(){
  const a=bannerT>1.9?(2.4-bannerT)/0.5:(bannerT<0.4?bannerT/0.4:1);
  ctx.globalAlpha=clamp(a,0,1);
  drawText(banner,W/2,118,2.6,'#ffd34d',true,'center');
  ctx.globalAlpha=1;
}
function drawTitle(t){
  drawBoard();
  const demo=[[2,4,8,16],[16,8,4,2],[2,4,8,16],[16,8,4,2]];
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){
    const p=cellCenter(c,r);
    drawTile(demo[r][c],p.x,p.y,1,0.4);
  }
  ctx.fillStyle='rgba(2,3,8,0.55)';ctx.fillRect(0,0,W,H);
  drawText('2048',W/2,110,4.4,'#7ff7ff',true,'center');
  drawText('RETRO NUMBER TILE GAME',W/2,162,1,'#4a5168',false,'center');
  drawText('MOVE: ARROWS / WASD',W/2,290,1.1,'#cfe0ff',false,'center');
  drawText('MERGE SAME TILES TO REACH 2048',W/2,312,1.1,'#cfe0ff',false,'center');
  drawText('PAUSE: P    MUTE: M    NEW: N',W/2,334,1.1,'#cfe0ff',false,'center');
  drawText('TOUCH: SWIPE',W/2,356,1.1,'#8fa0c8',false,'center');
  drawText('BEST '+pad6(best),W/2,400,1.4,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER OR TAP TO START',W/2,490,1.5,'#7ff7ff',true,'center');
}
function drawGameOver(t){
  ctx.fillStyle='rgba(2,3,8,0.72)';ctx.fillRect(0,0,W,H);
  drawText('GAME OVER',W/2,220,4,'#ff5d6c',true,'center');
  drawText('NO MOVES LEFT',W/2,272,1.3,'#ff9a5c',true,'center');
  drawText('SCORE '+pad6(score),W/2,330,1.8,'#ffffff',true,'center');
  if(bestBeaten)drawText('NEW HIGH SCORE!',W/2,366,1.4,'#ffd34d',true,'center');
  drawText('BEST '+pad6(best),W/2,402,1.3,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER TO PLAY AGAIN',W/2,496,1.5,'#7ff7ff',true,'center');
}
function drawPaused(){
  ctx.fillStyle='rgba(2,3,8,0.6)';ctx.fillRect(0,0,W,H);
  drawText('PAUSED',W/2,300,3,'#7ff7ff',true,'center');
  drawText('PRESS P TO RESUME',W/2,350,1.3,'#cfe0ff',true,'center');
}
function draw(t){
  ctx.save();
  ctx.fillStyle='#020308';ctx.fillRect(0,0,W,H);
  ctx.drawImage(nebula,0,0);

  for(let l=0;l<3;l++){
    ctx.globalAlpha=[0.3,0.5,0.85][l];
    ctx.fillStyle='#dfe8ff';
    for(const s of stars[l])ctx.fillRect(s.x,s.y,s.sz,s.sz);
  }
  ctx.globalAlpha=1;

  if(state!=='title'){drawBoard();drawTiles();}

  // particles (additive)
  ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,1-p.t/p.life);
    ctx.fillStyle=p.col;
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';

  // rings
  for(const r of rings){
    const pr=r.t/r.life;
    ctx.globalAlpha=1-pr;
    ctx.strokeStyle=r.col;
    ctx.lineWidth=2*(1-pr)+0.5;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r+(r.max-r.r)*pr,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // floaters
  for(const f of floaters){
    ctx.globalAlpha=clamp(1-f.t/f.life,0,1);
    drawText(f.txt,f.x,f.y,1.2,f.col,false,'center');
  }
  ctx.globalAlpha=1;

  ctx.restore();

  // HUD + screens
  if(state==='playing'||state==='gameover')drawHUD();
  if(state==='title')drawTitle(t);
  else if(state==='gameover')drawGameOver(t);
  if(banner&&bannerT>0&&state==='playing')drawBanner();
  if(paused)drawPaused();
}

/* --------------------------- main loop ---------------------------------- */
let last=performance.now();
let raf=null;
function loop(ms){
  if(!window.ARCADE||ARCADE.active!==ID){raf=null;return;}
  const dt=Math.min(0.1,(ms-last)/1000);
  last=ms;
  now=ms/1000;
  if(!paused)update(dt);
  draw(now);
  raf=requestAnimationFrame(loop);
}
ARCADE.register(ID,{start:function(){fit();if(!raf)raf=requestAnimationFrame(loop);}});
})();

/* ============================ SNAKE ============================ */
(function(){
'use strict';
const ID='snake';

/* ----------------------------- helpers --------------------------------- */
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;
const pad6=n=>String(Math.max(0,Math.floor(n))).padStart(6,'0');

/* ----------------------------- canvas ---------------------------------- */
const W=480,H=640;
const cv=mountScreen(ID,'SNAKE','<b>H</b> hub &nbsp;·&nbsp; <b>&#8592; &#8594; &#8593; &#8595; / WASD</b> steer &nbsp;·&nbsp; <b>N</b> new game &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; <b>M</b> mute &nbsp;·&nbsp; touch: swipe');
const ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;

function fit(){
  const sc=document.getElementById('screen-'+ID);
  const bez=cv.parentElement;
  const cs=getComputedStyle(bez),ss=getComputedStyle(sc);
  const tb=sc.querySelector('.gtopbar'),hi=sc.querySelector('.hint'),ro=sc.querySelector('.rot');
  let padW=parseFloat(ss.paddingLeft)+parseFloat(ss.paddingRight)+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
  let padH=parseFloat(ss.paddingTop)+parseFloat(ss.paddingBottom)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  if(tb)padH+=tb.offsetHeight+parseFloat(getComputedStyle(tb).marginBottom||'0');
  if(hi)padH+=hi.offsetHeight+parseFloat(getComputedStyle(hi).marginTop||'0');
  if(ro&&ro.offsetHeight)padH+=ro.offsetHeight+8;
  const s=Math.max(0.15,Math.min((sc.clientWidth-padW)/W,(sc.clientHeight-padH)/H,2.4));
  cv.style.width=Math.round(W*s)+'px';
  cv.style.height=Math.round(H*s)+'px';
}
addEventListener('resize',()=>{if(window.ARCADE&&ARCADE.active===ID)fit();});

/* --------------------------- pixel font --------------------------------- */
const FONT={
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','#####'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','....#','...#.','..##.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','....#','.###.'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'!':['..#..','..#..','..#..','..#..','.....','..#..','..#..'],
'-':['.....','.....','.....','#####','.....','.....','.....'],
'.':['.....','.....','.....','.....','.....','.##..','.##..'],
':':['.....','.##..','.##..','.....','.##..','.##..','.....'],
'/':['....#','...#.','..#..','.#...','#....','.....','.....'],
'<':['#....','.#...','..#..','...#.','..#..','.#...','#....'],
'>':['....#','...#.','..#..','.#...','..#..','...#.','....#'],
"'":['..#..','..#..','.#...','.....','.....','.....','.....'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'?':['.###.','#...#','....#','...#.','..#..','.....','..#..'],
'%':['##..#','##..#','..#..','..#..','.#..#','.#..##','.....'],
};

function drawText(str,x,y,scale,color,glow,align){
  str=String(str).toUpperCase();
  const cw=6*scale;
  let sx=x;
  if(align==='center')sx=x-(str.length*cw-scale)/2;
  else if(align==='right')sx=x-str.length*cw+scale;
  ctx.save();
  ctx.fillStyle=color;
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=9;}
  for(let i=0;i<str.length;i++){
    const g=FONT[str[i]];
    if(g){
      for(let r=0;r<7;r++){
        const row=g[r];
        for(let c=0;c<row.length;c++){
          if(row[c]==='#')ctx.fillRect(sx+i*cw+c*scale, y+r*scale, scale, scale);
        }
      }
    }
  }
  ctx.restore();
}

/* ----------------------------- audio ------------------------------------ */
let AC=null,master=null,muted=false;
try{muted=localStorage.getItem('snake_mute')==='1';}catch(e){}
function ensureAudio(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f0,f1,dur,type,vol,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(master);
  o.start(t);o.stop(t+dur+0.02);
}
function noise(dur,vol,fc,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const len=Math.floor(AC.sampleRate*dur);
  const buf=AC.createBuffer(1,len,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1000;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f);f.connect(g);g.connect(master);
  src.start(t);
}
const sfx={
  eat:()=>{[523,659,784].forEach((f,i)=>tone(f,f,0.07,'square',0.1,i*0.045));},
  turn:()=>tone(180,140,0.04,'square',0.05),
  die:()=>{noise(0.5,0.5,900);[392,262,196,131].forEach((f,i)=>tone(f,f*0.9,0.22,'sawtooth',0.12,i*0.1));},
  over:()=>{[392,330,262,196,131].forEach((f,i)=>tone(f,f,0.3,'square',0.14,i*0.22));},
  hi:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,f,0.12,'triangle',0.15,i*0.08));},
  start:()=>{[392,523,659,784].forEach((f,i)=>tone(f,f,0.12,'square',0.11,i*0.09));},
};
function toggleMute(){
  muted=!muted;
  try{localStorage.setItem('snake_mute',muted?'1':'0');}catch(e){}
}

/* --------------------------- background --------------------------------- */
const nebula=document.createElement('canvas');nebula.width=W;nebula.height=H;
(function(){
  const g=nebula.getContext('2d');
  const gr=g.createRadialGradient(W/2,H*0.35,40,W/2,H*0.35,380);
  gr.addColorStop(0,'rgba(24,48,105,0.5)');
  gr.addColorStop(0.5,'rgba(10,16,44,0.28)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
})();
const stars=[];
for(let l=0;l<3;l++){
  stars[l]=[];
  for(let i=0;i<60;i++){
    stars[l].push({x:rand(0,W),y:rand(0,H),sp:rand(8,20)+l*14,sz:l===2?2:1});
  }
}

/* --------------------------- game state --------------------------------- */
const COLS=24,ROWS=32,CELL=20;
let state='title';        // title | playing | gameover
let paused=false;
let score=0,hi=0,hiBeaten=false;
let snake=[],dir={x:1,y:0},queue=[];
let stepTimer=0,step=0.15,food=null,ate=0;
let particles=[],rings=[],floaters=[];
try{hi=+localStorage.getItem('snake_hi')||0;}catch(e){}

/* --------------------------- hub link ----------------------------------- */
function exitToHub(){
  if(window.ARCADE)ARCADE.exit();
}
function pushScore(){
  if(window.ARCADE)ARCADE.reportScore(ID,hi);
}

function startGame(){
  score=0;hiBeaten=false;paused=false;ate=0;step=0.15;queue=[];
  snake=[];dir={x:1,y:0};
  const cx=Math.floor(COLS/2),cy=Math.floor(ROWS/2);
  for(let i=0;i<4;i++)snake.push({x:cx-i,y:cy});
  spawnFood();
  stepTimer=step;
  state='playing';
  sfx.start();
}
function spawnFood(){
  const occ=new Set(snake.map(s=>s.y*COLS+s.x));
  const free=[];
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(!occ.has(y*COLS+x))free.push({x,y});
  food=free[randi(0,free.length-1)];
}
function endGame(){
  state='gameover';
  if(score>hi){hi=score;hiBeaten=true;try{localStorage.setItem('snake_hi',hi);}catch(e){}sfx.hi();}
  pushScore();
  sfx.over();
}
function die(){
  // explosion along the snake
  for(const s of snake){
    if(Math.random()<0.5){
      for(let i=0;i<4;i++){
        const a=rand(0,TAU);
        particles.push({x:s.x*CELL+CELL/2,y:s.y*CELL+CELL/2,vx:Math.cos(a)*rand(30,140),vy:Math.sin(a)*rand(30,140),life:rand(0.3,0.7),t:0,col:'#5dff8c',sz:rand(1,2)});
      }
    }
  }
  rings.push({x:snake[0].x*CELL+CELL/2,y:snake[0].y*CELL+CELL/2,r:4,max:90,life:0.5,t:0,col:'#ff5d6c'});
  shake=12;flash=0.3;
  sfx.die();
  endGame();
}
let shake=0,flash=0;

function pushDir(d){
  const last=queue.length?queue[queue.length-1]:dir;
  if(last.x===-d.x&&last.y===-d.y)return; // no reversing
  if(last.x===d.x&&last.y===d.y)return;    // no duplicates
  if(queue.length<3)queue.push(d);
}
function stepSnake(){
  if(queue.length)dir=queue.shift();
  const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  // wall?
  if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS){die();return;}
  // self? (the tail is safe when it moves away this step)
  const willEat=head.x===food.x&&head.y===food.y;
  const body=willEat?snake:snake.slice(0,-1);
  for(const s of body)if(s.x===head.x&&s.y===head.y){die();return;}
  snake.unshift(head);
  if(head.x===food.x&&head.y===food.y){
    score+=10;
    if(score>hi){hi=score;try{localStorage.setItem('snake_hi',hi);}catch(e){}}
    ate++;
    step=Math.max(0.07,step-0.003);
    sfx.eat();
    const px=head.x*CELL+CELL/2,py=head.y*CELL+CELL/2;
    for(let i=0;i<10;i++){
      const a=rand(0,TAU),sp=rand(30,130);
      particles.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(0.25,0.55),t:0,col:'#ff5d6c',sz:rand(1,2)});
    }
    rings.push({x:px,y:py,r:3,max:34,life:0.35,t:0,col:'#ff5d6c'});
    floaters.push({x:px,y:py-16,txt:'+10',t:0,life:0.7,col:'#7ff7ff'});
    spawnFood();
  }else{
    snake.pop();
  }
  stepTimer=step;
}

/* --------------------------- input -------------------------------------- */
addEventListener('keydown',e=>{
  if(!window.ARCADE||ARCADE.active!==ID)return;
  ensureAudio();
  if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  const dirMap={ArrowLeft:{x:-1,y:0},KeyA:{x:-1,y:0},ArrowUp:{x:0,y:-1},KeyW:{x:0,y:-1},ArrowRight:{x:1,y:0},KeyD:{x:1,y:0},ArrowDown:{x:0,y:1},KeyS:{x:0,y:1}};
  const k=e.code;
  if(k in dirMap){
    if(state==='title'||state==='gameover'){if(!e.repeat)startGame();}
    else if(state==='playing'&&!paused)pushDir(dirMap[k]);
    return;
  }
  switch(k){
    case'Enter':case'Space':
      if((state==='title'||state==='gameover')&&!e.repeat)startGame();
      break;
    case'KeyN':case'KeyR':
      if(!e.repeat)startGame();
      break;
    case'KeyH':if(!e.repeat)exitToHub();break;
    case'KeyM':if(!e.repeat)toggleMute();break;
    case'KeyP':case'Escape':if(!e.repeat&&state==='playing')paused=!paused;break;
  }
});
addEventListener('blur',()=>{if(state==='playing')paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')paused=true;});

let tsx=0,tsy=0;
cv.addEventListener('touchstart',e=>{
  e.preventDefault();ensureAudio();
  const t=e.touches[0];tsx=t.clientX;tsy=t.clientY;
},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();},{passive:false});
cv.addEventListener('touchend',e=>{
  e.preventDefault();
  const t=e.changedTouches[0];
  const dx=t.clientX-tsx,dy=t.clientY-tsy;
  const ad=Math.abs(dx),bd=Math.abs(dy);
  if(ad<20&&bd<20){ // tap
    if(state==='title'||state==='gameover')startGame();
    return;
  }
  if(state==='playing'&&!paused)pushDir(ad>bd?{x:dx>0?1:-1,y:0}:{x:0,y:dy>0?1:-1});
},{passive:false});
cv.addEventListener('mousedown',()=>{
  if(state==='title'||state==='gameover')startGame();
});

/* --------------------------- update ------------------------------------- */
function updateFx(dt){
  for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;}
  for(const r of rings){r.t+=dt;}
  for(const f of floaters){f.t+=dt;f.y-=24*dt;}
  particles=particles.filter(p=>p.t<p.life);
  rings=rings.filter(r=>r.t<r.life);
  floaters=floaters.filter(f=>f.t<f.life);
}
function update(dt){
  for(let l=0;l<3;l++)for(const s of stars[l]){s.y+=s.sp*dt;if(s.y>H){s.y=-2;s.x=rand(0,W);}}
  flash=Math.max(0,flash-dt*1.6);
  if(shake>0.3){shake*=0.88;if(shake<0.3)shake=0;}
  if(state!=='playing'){updateFx(dt);return;}
  stepTimer-=dt;
  if(stepTimer<=0)stepSnake();
  updateFx(dt);
}

/* --------------------------- draw --------------------------------------- */
function gridX(c){return c*CELL;}
function drawGrid(){
  ctx.save();
  ctx.strokeStyle='rgba(46,51,80,0.35)';
  ctx.lineWidth=1;
  for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL+0.5,0);ctx.lineTo(x*CELL+0.5,H);ctx.stroke();}
  for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL+0.5);ctx.lineTo(W,y*CELL+0.5);ctx.stroke();}
  ctx.restore();
}
function drawFood(t){
  const px=food.x*CELL+CELL/2,py=food.y*CELL+CELL/2;
  const pulse=1+Math.sin(t*5)*0.15;
  const r=CELL/2-4;
  ctx.save();
  ctx.shadowColor='#ff5d6c';ctx.shadowBlur=12;
  ctx.fillStyle='#ff5d6c';
  ctx.beginPath();ctx.arc(px,py,r*pulse,0,TAU);ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.55)';
  ctx.beginPath();ctx.arc(px-3,py-3,2.5,0,TAU);ctx.fill();
  ctx.restore();
}
function drawSnake(){
  ctx.save();
  // body (tail first so head draws on top)
  for(let i=snake.length-1;i>=1;i--){
    const s=snake[i];
    const px=s.x*CELL+CELL/2,py=s.y*CELL+CELL/2;
    const grad=i/snake.length;
    ctx.fillStyle='#0d3f2e';
    ctx.globalAlpha=0.35+0.5*(1-grad);
    ctx.fillRect(s.x*CELL+2,s.y*CELL+2,CELL-4,CELL-4);
  }
  ctx.globalAlpha=1;
  // glowing body
  for(let i=snake.length-1;i>=1;i--){
    const s=snake[i];
    ctx.shadowColor='#5dff8c';ctx.shadowBlur=7;
    ctx.fillStyle='#5dff8c';
    ctx.fillRect(s.x*CELL+3,s.y*CELL+3,CELL-6,CELL-6);
  }
  ctx.shadowBlur=0;
  // head
  const h=snake[0];
  ctx.shadowColor='#7ff7ff';ctx.shadowBlur=14;
  ctx.fillStyle='#7ff7ff';
  ctx.fillRect(h.x*CELL+1,h.y*CELL+1,CELL-2,CELL-2);
  ctx.shadowBlur=0;
  // eyes
  ctx.fillStyle='#020308';
  const ex=h.x*CELL+CELL/2+dir.x*4,ey=h.y*CELL+CELL/2+dir.y*4;
  if(dir.y===0){ // horizontal
    ctx.fillRect(ex-3,ey-3,3,3);
    ctx.fillRect(ex-3,ey+1,3,3);
  }else{ // vertical
    ctx.fillRect(ex-3,ey-3,3,3);
    ctx.fillRect(ex+1,ey-3,3,3);
  }
  // tongue flick
  if(Math.floor(t*6)%3===0){
    ctx.fillStyle='#ff5d6c';
    ctx.fillRect(h.x*CELL+CELL/2+dir.x*9-1,h.y*CELL+CELL/2+dir.y*9-1,3,3);
  }
  ctx.restore();
}

function drawHUD(){
  drawText('SCORE',12,12,1,'#6fd0ff',false);
  drawText(pad6(score),12,22,1.6,'#ffffff',true);
  drawText('HI',W-58,12,1,'#ffd34d',false);
  drawText(pad6(hi),W-8,22,1.6,'#ffd34d',true,'right');
  drawText('M '+(muted?'OFF':'ON'),8,H-12,0.8,'#5a6280',false);
}
function drawTitle(t){
  // demo snake slithering behind
  const demo=[];
  for(let i=0;i<10;i++){
    const px=W/2+Math.sin(t*1.4+i*0.55)*130;
    const py=280+i*14+Math.sin(t*1.8+i)*10;
    demo.push({x:px,y:py});
  }
  ctx.save();
  for(let i=demo.length-1;i>=1;i--){
    ctx.fillStyle='#5dff8c';
    ctx.globalAlpha=0.6-i/demo.length*0.5;
    ctx.fillRect(demo[i].x-6,demo[i].y-6,12,12);
  }
  ctx.globalAlpha=1;
  ctx.shadowColor='#7ff7ff';ctx.shadowBlur=14;
  ctx.fillStyle='#7ff7ff';
  ctx.fillRect(demo[0].x-8,demo[0].y-8,16,16);
  ctx.shadowBlur=0;
  ctx.restore();

  ctx.fillStyle='rgba(2,3,8,0.55)';ctx.fillRect(0,0,W,H);
  drawText('SNAKE',W/2,110,4.4,'#5dff8c',true,'center');
  drawText('RETRO NEON SERPENT',W/2,162,1,'#4a5168',false,'center');
  drawText('STEER: ARROWS / WASD',W/2,340,1.1,'#cfe0ff',false,'center');
  drawText('EAT THE ORBS TO GROW',W/2,362,1.1,'#cfe0ff',false,'center');
  drawText('PAUSE: P    MUTE: M    NEW: N',W/2,384,1.1,'#cfe0ff',false,'center');
  drawText('TOUCH: SWIPE',W/2,406,1.1,'#8fa0c8',false,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,452,1.4,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER OR TAP TO START',W/2,510,1.5,'#7ff7ff',true,'center');
}
function drawGameOver(t){
  ctx.fillStyle='rgba(2,3,8,0.72)';ctx.fillRect(0,0,W,H);
  drawText('GAME OVER',W/2,220,4,'#ff5d6c',true,'center');
  drawText('YOU CRASHED!',W/2,272,1.3,'#ff9a5c',true,'center');
  drawText('SCORE '+pad6(score),W/2,330,1.8,'#ffffff',true,'center');
  if(hiBeaten)drawText('NEW HIGH SCORE!',W/2,366,1.4,'#ffd34d',true,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,402,1.3,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER TO PLAY AGAIN',W/2,496,1.5,'#7ff7ff',true,'center');
}
function drawPaused(){
  ctx.fillStyle='rgba(2,3,8,0.6)';ctx.fillRect(0,0,W,H);
  drawText('PAUSED',W/2,300,3,'#7ff7ff',true,'center');
  drawText('PRESS P TO RESUME',W/2,350,1.3,'#cfe0ff',true,'center');
}
let t=0;
function draw(ms){
  t=ms;
  ctx.save();
  ctx.fillStyle='#020308';ctx.fillRect(0,0,W,H);
  ctx.drawImage(nebula,0,0);

  for(let l=0;l<3;l++){
    ctx.globalAlpha=[0.3,0.5,0.85][l];
    ctx.fillStyle='#dfe8ff';
    for(const s of stars[l])ctx.fillRect(s.x,s.y,s.sz,s.sz);
  }
  ctx.globalAlpha=1;

  if(shake>0.3)ctx.translate(rand(-shake,shake),rand(-shake,shake));

  drawGrid();
  if(state!=='title'&&food)drawFood(t);
  if(state==='playing'||state==='gameover')drawSnake();

  // particles (additive)
  ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,1-p.t/p.life);
    ctx.fillStyle=p.col;
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';

  // rings
  for(const r of rings){
    const pr=r.t/r.life;
    ctx.globalAlpha=1-pr;
    ctx.strokeStyle=r.col;
    ctx.lineWidth=2*(1-pr)+0.5;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r+(r.max-r.r)*pr,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // floaters
  for(const f of floaters){
    ctx.globalAlpha=clamp(1-f.t/f.life,0,1);
    drawText(f.txt,f.x,f.y,1.2,f.col,false,'center');
  }
  ctx.globalAlpha=1;

  ctx.restore();

  if(flash>0){
    ctx.fillStyle='rgba(255,255,255,'+Math.min(0.5,flash)+')';
    ctx.fillRect(0,0,W,H);
  }

  if(state==='playing'||state==='gameover')drawHUD();
  if(state==='title')drawTitle(t);
  else if(state==='gameover')drawGameOver(t);
  if(paused)drawPaused();
}

/* --------------------------- main loop ---------------------------------- */
let last=performance.now();
let raf=null;
function loop(now){
  if(!window.ARCADE||ARCADE.active!==ID){raf=null;return;}
  const dt=Math.min(0.1,(now-last)/1000);
  last=now;
  if(!paused)update(dt);
  draw(now/1000);
  raf=requestAnimationFrame(loop);
}
ARCADE.register(ID,{start:function(){fit();if(!raf)raf=requestAnimationFrame(loop);}});
})();

/* ============================ TETRIS ============================ */
(function(){
'use strict';
const ID='tetris';

/* ----------------------------- helpers --------------------------------- */
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;
const pad6=n=>String(Math.max(0,Math.floor(n))).padStart(6,'0');

/* ----------------------------- canvas ---------------------------------- */
const W=480,H=640;
const cv=mountScreen(ID,'TETRIS','<b>H</b> hub &nbsp;·&nbsp; <b>&#8592; &#8594;</b> move &nbsp;·&nbsp; <b>&#8593;/X</b> rotate &nbsp;·&nbsp; <b>&#8595;</b> soft drop &nbsp;·&nbsp; <b>SPACE</b> hard drop &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; <b>M</b> mute &nbsp;·&nbsp; touch: swipe');
const ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;

function fit(){
  const sc=document.getElementById('screen-'+ID);
  const bez=cv.parentElement;
  const cs=getComputedStyle(bez),ss=getComputedStyle(sc);
  const tb=sc.querySelector('.gtopbar'),hi=sc.querySelector('.hint'),ro=sc.querySelector('.rot');
  let padW=parseFloat(ss.paddingLeft)+parseFloat(ss.paddingRight)+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
  let padH=parseFloat(ss.paddingTop)+parseFloat(ss.paddingBottom)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  if(tb)padH+=tb.offsetHeight+parseFloat(getComputedStyle(tb).marginBottom||'0');
  if(hi)padH+=hi.offsetHeight+parseFloat(getComputedStyle(hi).marginTop||'0');
  if(ro&&ro.offsetHeight)padH+=ro.offsetHeight+8;
  const s=Math.max(0.15,Math.min((sc.clientWidth-padW)/W,(sc.clientHeight-padH)/H,2.4));
  cv.style.width=Math.round(W*s)+'px';
  cv.style.height=Math.round(H*s)+'px';
}
addEventListener('resize',()=>{if(window.ARCADE&&ARCADE.active===ID)fit();});

/* --------------------------- pixel font --------------------------------- */
const FONT={
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','#####'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','....#','...#.','..##.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','....#','.###.'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'!':['..#..','..#..','..#..','..#..','.....','..#..','..#..'],
'-':['.....','.....','.....','#####','.....','.....','.....'],
'.':['.....','.....','.....','.....','.....','.##..','.##..'],
':':['.....','.##..','.##..','.....','.##..','.##..','.....'],
'/':['....#','...#.','..#..','.#...','#....','.....','.....'],
'<':['#....','.#...','..#..','...#.','..#..','.#...','#....'],
'>':['....#','...#.','..#..','.#...','..#..','...#.','....#'],
"'":['..#..','..#..','.#...','.....','.....','.....','.....'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'?':['.###.','#...#','....#','...#.','..#..','.....','..#..'],
'%':['##..#','##..#','..#..','..#..','.#..#','.#..##','.....'],
};

function drawText(str,x,y,scale,color,glow,align){
  str=String(str).toUpperCase();
  const cw=6*scale;
  let sx=x;
  if(align==='center')sx=x-(str.length*cw-scale)/2;
  else if(align==='right')sx=x-str.length*cw+scale;
  ctx.save();
  ctx.fillStyle=color;
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=9;}
  for(let i=0;i<str.length;i++){
    const g=FONT[str[i]];
    if(g){
      for(let r=0;r<7;r++){
        const row=g[r];
        for(let c=0;c<row.length;c++){
          if(row[c]==='#')ctx.fillRect(sx+i*cw+c*scale, y+r*scale, scale, scale);
        }
      }
    }
  }
  ctx.restore();
}

/* ----------------------------- audio ------------------------------------ */
let AC=null,master=null,muted=false;
try{muted=localStorage.getItem('tetris_mute')==='1';}catch(e){}
function ensureAudio(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f0,f1,dur,type,vol,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(master);
  o.start(t);o.stop(t+dur+0.02);
}
function noise(dur,vol,fc,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const len=Math.floor(AC.sampleRate*dur);
  const buf=AC.createBuffer(1,len,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1000;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f);f.connect(g);g.connect(master);
  src.start(t);
}
const sfx={
  move:()=>tone(220,190,0.04,'square',0.05),
  rotate:()=>tone(330,300,0.05,'square',0.06),
  soft:()=>tone(200,170,0.03,'square',0.04),
  drop:()=>{noise(0.12,0.3,1400);tone(300,90,0.12,'square',0.12);},
  lock:()=>tone(160,90,0.09,'square',0.1),
  clear:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,f,0.1,'square',0.11,i*0.06));},
  level:()=>{[392,523,659,784,1046].forEach((f,i)=>tone(f,f,0.12,'square',0.12,i*0.09));},
  over:()=>{[392,330,262,196,131].forEach((f,i)=>tone(f,f,0.3,'square',0.14,i*0.22));},
  hi:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,f,0.12,'triangle',0.15,i*0.08));},
  start:()=>{[392,523,659,784].forEach((f,i)=>tone(f,f,0.12,'square',0.11,i*0.09));},
};
function toggleMute(){
  muted=!muted;
  try{localStorage.setItem('tetris_mute',muted?'1':'0');}catch(e){}
}

/* --------------------------- background --------------------------------- */
const nebula=document.createElement('canvas');nebula.width=W;nebula.height=H;
(function(){
  const g=nebula.getContext('2d');
  const gr=g.createRadialGradient(W/2,H*0.35,40,W/2,H*0.35,380);
  gr.addColorStop(0,'rgba(24,48,105,0.5)');
  gr.addColorStop(0.5,'rgba(10,16,44,0.28)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
})();
const stars=[];
for(let l=0;l<3;l++){
  stars[l]=[];
  for(let i=0;i<60;i++){
    stars[l].push({x:rand(0,W),y:rand(0,H),sp:rand(8,20)+l*14,sz:l===2?2:1});
  }
}

/* --------------------------- pieces ------------------------------------- */
const SHAPES={
  I:{cells:[[0,1],[1,1],[2,1],[3,1]],col:'#7ff7ff'},
  O:{cells:[[1,0],[2,0],[1,1],[2,1]],col:'#ffd34d'},
  T:{cells:[[1,0],[0,1],[1,1],[2,1]],col:'#b78bff'},
  S:{cells:[[1,0],[2,0],[0,1],[1,1]],col:'#5dff8c'},
  Z:{cells:[[0,0],[1,0],[1,1],[2,1]],col:'#ff5d6c'},
  J:{cells:[[0,0],[0,1],[1,1],[2,1]],col:'#6fd0ff'},
  L:{cells:[[2,0],[0,1],[1,1],[2,1]],col:'#ff9f43'},
};
const PIECE_KEYS=['I','O','T','S','Z','J','L'];
function rotateCW(cells){
  return cells.map(([x,y])=>[y,3-x]);
}
function rotateCCW(cells){
  return cells.map(([x,y])=>[3-y,x]);
}

/* --------------------------- game state --------------------------------- */
const COLS=10,ROWS=20,CELL=22,BX=130,BY=95; // board 220x440 centered
let state='title';        // title | playing | gameover
let paused=false;
let score=0,hi=0,hiBeaten=false;
let lines=0,level=1,piecesDropped=0;
let board=[],cur=null,nextKey='I';
let tickTimer=0,softTimer=0;
let banner='',bannerT=0;
let particles=[],rings=[],floaters=[];
let shake=0,flash=0;
try{hi=+localStorage.getItem('tetris_hi')||0;}catch(e){}

/* --------------------------- hub link ----------------------------------- */
function exitToHub(){
  if(window.ARCADE)ARCADE.exit();
}
function pushScore(){
  if(window.ARCADE)ARCADE.reportScore(ID,hi);
}

function gravity(){return Math.max(0.05,0.8*Math.pow(0.82,level-1));}
function startGame(){
  score=0;lines=0;level=1;piecesDropped=0;hiBeaten=false;paused=false;
  banner='';bannerT=0;shake=0;flash=0;
  board=[];
  for(let c=0;c<COLS;c++){board[c]=[];for(let r=0;r<ROWS;r++)board[c][r]=null;}
  nextKey=PIECE_KEYS[randi(0,PIECE_KEYS.length-1)];
  spawnPiece();
  tickTimer=gravity();
  state='playing';
  sfx.start();
}
function spawnPiece(){
  cur={key:nextKey,cells:SHAPES[nextKey].cells.map(([x,y])=>[x,y]),x:3,y:0,col:SHAPES[nextKey].col};
  nextKey=PIECE_KEYS[randi(0,PIECE_KEYS.length-1)];
  if(!fits(cur.cells,cur.x,cur.y))endGame();
}
function fits(cells,x,y){
  for(const [cx,cy] of cells){
    const gx=x+cx,gy=y+cy;
    if(gx<0||gx>=COLS||gy>=ROWS)return false;
    if(gy>=0&&board[gx][gy])return false;
  }
  return true;
}
function mergePiece(){
  for(const [cx,cy] of cur.cells){
    const gx=cur.x+cx,gy=cur.y+cy;
    if(gy>=0)board[gx][gy]=cur.col;
  }
  clearLines();
  spawnPiece();
}
function clearLines(){
  const full=[];
  for(let r=0;r<ROWS;r++){
    let ok=true;
    for(let c=0;c<COLS;c++)if(!board[c][r]){ok=false;break;}
    if(ok)full.push(r);
  }
  if(!full.length){sfx.lock();return;}
  const n=full.length;
  const pts=[0,100,300,500,800][Math.min(n,4)]*level;
  score+=pts;
  if(score>hi){hi=score;try{localStorage.setItem('tetris_hi',hi);}catch(e){}}
  // fx on cleared cells
  for(const r of full){
    for(let c=0;c<COLS;c++){
      const px=BX+c*CELL+CELL/2,py=BY+r*CELL+CELL/2;
      for(let i=0;i<6;i++){
        const a=rand(0,TAU),sp=rand(40,160);
        particles.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(0.3,0.6),t:0,col:pick(['#ffffff','#7ff7ff','#ffd34d','#ff5d6c','#5dff8c']),sz:rand(1,2)});
      }
    }
    rings.push({x:BX+COLS*CELL/2,y:BY+r*CELL+CELL/2,r:10,max:110,life:0.45,t:0,col:'#ffffff'});
  }
  // remove rows (highest index first so indices stay valid)
  const fs=[...full].sort((a,b)=>b-a);
  for(const r of fs)for(let c=0;c<COLS;c++)board[c].splice(r,1);
  for(let i=0;i<n;i++)board.forEach(col=>col.unshift(null));
  lines+=n;
  floaters.push({x:BX+COLS*CELL/2,y:BY+ROWS*CELL-30,txt:'+'+pts,t:0,life:1.1,col:n===4?'#ffd34d':'#7ff7ff'});
  if(n===4)floaters.push({x:BX+COLS*CELL/2,y:BY+ROWS*CELL-58,txt:'TETRIS!',t:0,life:1.3,col:'#ffd34d'});
  const nl=Math.floor(lines/10)+1;
  if(nl>level){
    level=nl;
    banner='LEVEL '+level;bannerT=1.4;
    sfx.level();
    floaters.push({x:BX+COLS*CELL/2,y:BY+ROWS*CELL-86,txt:'SPEED UP',t:0,life:1.2,col:'#ff9f43'});
  }
  shake=Math.min(8,4+n*2);flash=Math.min(0.35,0.12*n);
  sfx.clear();
}
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
function endGame(){
  state='gameover';
  if(score>hi){hi=score;hiBeaten=true;try{localStorage.setItem('tetris_hi',hi);}catch(e){}sfx.hi();}
  pushScore();
  sfx.over();
}
function tryMove(dx,dy){
  if(fits(cur.cells,cur.x+dx,cur.y+dy)){
    cur.x+=dx;cur.y+=dy;
    return true;
  }
  return false;
}
function tryRotate(dir){
  const nc=dir===1?rotateCW(cur.cells):rotateCCW(cur.cells);
  for(const kick of [0,-1,1,-2,2]){
    if(fits(nc,cur.x+kick,cur.y)){
      cur.cells=nc;cur.x+=kick;
      sfx.rotate();
      return;
    }
  }
}
function softDrop(){
  if(!tryMove(0,1)){
    mergePiece();
    tickTimer=gravity();
  }else{
    score+=1;
    if(score>hi){hi=score;try{localStorage.setItem('tetris_hi',hi);}catch(e){}}
    tickTimer=gravity()*0.06;
    sfx.soft();
  }
}
function hardDrop(){
  let d=0;
  while(fits(cur.cells,cur.x,cur.y+1)){cur.y++;d++;}
  score+=d*2;
  if(score>hi){hi=score;try{localStorage.setItem('tetris_hi',hi);}catch(e){}}
  sfx.drop();
  mergePiece();
  tickTimer=gravity();
}
function ghostY(){
  let y=cur.y;
  while(fits(cur.cells,cur.x,y+1))y++;
  return y;
}

/* --------------------------- input -------------------------------------- */
addEventListener('keydown',e=>{
  if(!window.ARCADE||ARCADE.active!==ID)return;
  ensureAudio();
  if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  const k=e.code;
  if(state==='title'||state==='gameover'){
    if(k==='KeyH'&&!e.repeat){exitToHub();return;}
    if(k==='KeyM'&&!e.repeat){toggleMute();return;}
    if((k==='Enter'||k==='Space'||k==='ArrowUp')&&!e.repeat)startGame();
    return;
  }
  if(state!=='playing'||paused)return;
  switch(k){
    case'ArrowLeft':case'KeyA':if(tryMove(-1,0))sfx.move();break;
    case'ArrowRight':case'KeyD':if(tryMove(1,0))sfx.move();break;
    case'ArrowDown':case'KeyS':softDrop();break;
    case'ArrowUp':case'KeyX':case'KeyW':if(!e.repeat)tryRotate(1);break;
    case'KeyZ':case'KeyQ':if(!e.repeat)tryRotate(-1);break;
    case'Space':if(!e.repeat)hardDrop();break;
    case'KeyH':if(!e.repeat)exitToHub();break;
    case'KeyM':if(!e.repeat)toggleMute();break;
    case'KeyN':case'KeyR':if(!e.repeat)startGame();break;
    case'KeyP':case'Escape':if(!e.repeat)paused=!paused;break;
  }
});
addEventListener('blur',()=>{if(state==='playing')paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')paused=true;});

let tsx=0,tsy=0,tsTime=0;
cv.addEventListener('touchstart',e=>{
  e.preventDefault();ensureAudio();
  const t=e.touches[0];tsx=t.clientX;tsy=t.clientY;tsTime=performance.now();
},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();},{passive:false});
cv.addEventListener('touchend',e=>{
  e.preventDefault();
  const t=e.changedTouches[0];
  const dx=t.clientX-tsx,dy=t.clientY-tsy;
  const ad=Math.abs(dx),bd=Math.abs(dy);
  if(ad<20&&bd<20){
    if(state==='title'||state==='gameover')startGame();
    else if(state==='playing'&&!paused)tryRotate(1);
    return;
  }
  if(state==='playing'&&!paused){
    if(ad>bd){if(tryMove(dx>0?1:-1,0))sfx.move();}
    else if(dy>0)softDrop();
    else tryRotate(1);
  }
},{passive:false});
cv.addEventListener('mousedown',()=>{
  if(state==='title'||state==='gameover')startGame();
});

/* --------------------------- update ------------------------------------- */
function updateFx(dt){
  for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;}
  for(const r of rings){r.t+=dt;}
  for(const f of floaters){f.t+=dt;f.y-=24*dt;}
  particles=particles.filter(p=>p.t<p.life);
  rings=rings.filter(r=>r.t<r.life);
  floaters=floaters.filter(f=>f.t<f.life);
}
function update(dt){
  for(let l=0;l<3;l++)for(const s of stars[l]){s.y+=s.sp*dt;if(s.y>H){s.y=-2;s.x=rand(0,W);}}
  flash=Math.max(0,flash-dt*1.6);
  if(shake>0.3){shake*=0.88;if(shake<0.3)shake=0;}
  if(bannerT>0)bannerT-=dt;
  if(state!=='playing'){updateFx(dt);return;}
  tickTimer-=dt;
  if(tickTimer<=0){
    tickTimer=gravity();
    if(!tryMove(0,1))mergePiece();
  }
  updateFx(dt);
}

/* --------------------------- draw --------------------------------------- */
function cellXY(c,r){return{x:BX+c*CELL,y:BY+r*CELL};}
function drawBlock(x,y,size,col,glow){
  const px=Math.round(x),py=Math.round(y);
  ctx.save();
  if(glow)ctx.shadowColor=col;
  if(glow)ctx.shadowBlur=glow;
  ctx.fillStyle=col;
  ctx.fillRect(px,py,size,size);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.32)';
  ctx.fillRect(px,py,size,Math.max(2,size*0.14));
  ctx.fillStyle='rgba(0,0,0,0.28)';
  ctx.fillRect(px,py+size-2,size,2);
  ctx.strokeStyle='rgba(0,0,0,0.45)';
  ctx.strokeRect(px+0.5,py+0.5,size-1,size-1);
  ctx.restore();
}
function drawBoardFrame(){
  ctx.save();
  ctx.fillStyle='#05060d';
  ctx.fillRect(BX-8,BY-8,COLS*CELL+16,ROWS*CELL+16);
  ctx.strokeStyle='#2e3350';
  ctx.shadowColor='rgba(0,255,190,0.18)';
  ctx.shadowBlur=14;
  ctx.strokeRect(BX-7.5,BY-7.5,COLS*CELL+15,ROWS*CELL+15);
  ctx.restore();
}
function drawCell(c,r,col){
  const p=cellXY(c,r);
  drawBlock(p.x+1,p.y+1,CELL-2,col,6);
}
function drawGhost(){
  const gy=ghostY();
  if(gy===cur.y)return;
  ctx.save();
  ctx.globalAlpha=0.18;
  for(const [cx,cy] of cur.cells){
    const p=cellXY(cur.x+cx,gy+cy);
    ctx.fillStyle=cur.col;
    ctx.fillRect(p.x+2,p.y+2,CELL-4,CELL-4);
  }
  ctx.restore();
}
function drawPiece(piece,x,y,alpha,scale){
  ctx.save();
  ctx.globalAlpha=alpha;
  for(const [cx,cy] of piece.cells){
    const px=x+cx*CELL*scale,py=y+cy*CELL*scale;
    drawBlock(px+1,py+1,CELL*scale-2,piece.col,5);
  }
  ctx.restore();
}
function drawNext(){
  drawText('NEXT',380,128,1,'#6fd0ff',false);
  ctx.save();
  ctx.fillStyle='#0c0f1c';
  ctx.fillRect(378,142,94,94);
  ctx.strokeStyle='#2e3350';
  ctx.strokeRect(378.5,142.5,93,93);
  ctx.restore();
  const s=SHAPES[nextKey];
  // center the piece in the 94px box
  let minx=9,miny=9,maxx=-9,maxy=-9;
  for(const [cx,cy] of s.cells){minx=Math.min(minx,cx);maxx=Math.max(maxx,cx);miny=Math.min(miny,cy);maxy=Math.max(maxy,cy);}
  const pw=(maxx-minx+1)*CELL*0.55,ph=(maxy-miny+1)*CELL*0.55;
  const ox=378+47-pw/2,oy=142+47-ph/2;
  for(const [cx,cy] of s.cells){
    drawBlock(ox+(cx-minx)*CELL*0.55+1,oy+(cy-miny)*CELL*0.55+1,CELL*0.55-2,s.col,4);
  }
}
function box(x,y,w,h,label,val,col){
  ctx.save();
  ctx.fillStyle='#0c0f1c';
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='#2e3350';
  ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  ctx.shadowColor='rgba(0,255,190,0.25)';
  ctx.shadowBlur=8;
  ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  ctx.restore();
  drawText(label,x+6,y+8,0.8,'#6fd0ff',false);
  const s=String(Math.floor(val));
  const ns=s.length>5?1.2:1.6;
  drawText(s,x+w-6,y+22,ns,col,true,'right');
}
function drawHUD(){
  drawText('TETRIS',BX,24,2.2,'#7ff7ff',true);
  box(BX,58,220,42,'SCORE',score,'#ffffff');
  box(BX,108,220,42,'HI-SCORE',hi,'#ffd34d');
  box(378,248,94,42,'LINES',lines,'#ffffff');
  box(378,298,94,42,'LEVEL',level,'#ff9f43');
  drawText('ARROWS / WASD',BX,600,0.8,'#4a5168',false);
  drawText('MOVE ROT DROP  P PAUSE',BX,616,0.8,'#4a5168',false);
  drawText('M '+(muted?'OFF':'ON'),452,616,0.8,'#5a6280',false);
}
function drawBanner(){
  const a=bannerT>1.05?(1.4-bannerT)/0.35:(bannerT<0.4?bannerT/0.4:1);
  ctx.globalAlpha=clamp(a,0,1);
  drawText(banner,W/2,320,2.6,'#ffd34d',true,'center');
  ctx.globalAlpha=1;
}
function drawTitle(t){
  // falling demo pieces
  const demos=[
    {key:'T',x:60,y:(t*90)%520,a:0.25},
    {key:'S',x:150,y:(t*70+120)%520,a:0.2},
    {key:'Z',x:280,y:(t*110+60)%520,a:0.22},
    {key:'L',x:390,y:(t*80+200)%520,a:0.25},
  ];
  for(const d of demos){
    const s=SHAPES[d.key];
    drawPiece({cells:s.cells,col:s.col},d.x,d.y,d.a,0.7);
  }
  ctx.fillStyle='rgba(2,3,8,0.55)';ctx.fillRect(0,0,W,H);
  drawText('TETRIS',W/2,110,4.4,'#7ff7ff',true,'center');
  drawText('RETRO NEON BLOCKS',W/2,162,1,'#4a5168',false,'center');
  drawText('MOVE: < >    ROTATE: UP/X',W/2,340,1.1,'#cfe0ff',false,'center');
  drawText('SOFT DROP: V    HARD DROP: SPACE',W/2,362,1.1,'#cfe0ff',false,'center');
  drawText('PAUSE: P    MUTE: M    NEW: N',W/2,384,1.1,'#cfe0ff',false,'center');
  drawText('TOUCH: SWIPE',W/2,406,1.1,'#8fa0c8',false,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,452,1.4,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER OR TAP TO START',W/2,510,1.5,'#7ff7ff',true,'center');
}
function drawGameOver(t){
  ctx.fillStyle='rgba(2,3,8,0.72)';ctx.fillRect(0,0,W,H);
  drawText('GAME OVER',W/2,220,4,'#ff5d6c',true,'center');
  drawText('THE STACK IS FULL',W/2,272,1.3,'#ff9a5c',true,'center');
  drawText('SCORE '+pad6(score),W/2,330,1.8,'#ffffff',true,'center');
  if(hiBeaten)drawText('NEW HIGH SCORE!',W/2,366,1.4,'#ffd34d',true,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,402,1.3,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER TO PLAY AGAIN',W/2,496,1.5,'#7ff7ff',true,'center');
}
function drawPaused(){
  ctx.fillStyle='rgba(2,3,8,0.6)';ctx.fillRect(0,0,W,H);
  drawText('PAUSED',W/2,300,3,'#7ff7ff',true,'center');
  drawText('PRESS P TO RESUME',W/2,350,1.3,'#cfe0ff',true,'center');
}
function draw(t){
  ctx.save();
  ctx.fillStyle='#020308';ctx.fillRect(0,0,W,H);
  ctx.drawImage(nebula,0,0);

  for(let l=0;l<3;l++){
    ctx.globalAlpha=[0.3,0.5,0.85][l];
    ctx.fillStyle='#dfe8ff';
    for(const s of stars[l])ctx.fillRect(s.x,s.y,s.sz,s.sz);
  }
  ctx.globalAlpha=1;

  if(shake>0.3)ctx.translate(rand(-shake,shake),rand(-shake,shake));

  drawBoardFrame();

  if(state!=='title'){
    // settled cells
    for(let c=0;c<COLS;c++)for(let r=0;r<ROWS;r++)if(board[c][r])drawCell(c,r,board[c][r]);
    if(cur){
      drawGhost();
      drawPiece(cur,cur.x*CELL+BX,cur.y*CELL+BY,1,1);
    }
    drawNext();
  }

  // particles (additive)
  ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,1-p.t/p.life);
    ctx.fillStyle=p.col;
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';

  // rings
  for(const r of rings){
    const pr=r.t/r.life;
    ctx.globalAlpha=1-pr;
    ctx.strokeStyle=r.col;
    ctx.lineWidth=2*(1-pr)+0.5;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r+(r.max-r.r)*pr,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // floaters
  for(const f of floaters){
    ctx.globalAlpha=clamp(1-f.t/f.life,0,1);
    drawText(f.txt,f.x,f.y,1.2,f.col,false,'center');
  }
  ctx.globalAlpha=1;

  ctx.restore();

  if(flash>0){
    ctx.fillStyle='rgba(255,255,255,'+Math.min(0.5,flash)+')';
    ctx.fillRect(0,0,W,H);
  }

  if(state==='playing'||state==='gameover')drawHUD();
  if(state==='title')drawTitle(t);
  else if(state==='gameover')drawGameOver(t);
  if(banner&&bannerT>0&&state==='playing')drawBanner();
  if(paused)drawPaused();
}

/* --------------------------- main loop ---------------------------------- */
let last=performance.now();
let raf=null;
function loop(now){
  if(!window.ARCADE||ARCADE.active!==ID){raf=null;return;}
  const dt=Math.min(0.1,(now-last)/1000);
  last=now;
  if(!paused)update(dt);
  draw(now/1000);
  raf=requestAnimationFrame(loop);
}
ARCADE.register(ID,{start:function(){fit();if(!raf)raf=requestAnimationFrame(loop);}});
})();

/* ============================ BREAKOUT ============================ */
(function(){
'use strict';
const ID='breakout';

/* ----------------------------- helpers --------------------------------- */
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;
const pad6=n=>String(Math.max(0,Math.floor(n))).padStart(6,'0');
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];

/* ----------------------------- canvas ---------------------------------- */
const W=480,H=640;
const cv=mountScreen(ID,'BREAKOUT','<b>H</b> hub &nbsp;·&nbsp; <b>&#8592; &#8594; / A D</b> move &nbsp;·&nbsp; <b>SPACE</b> launch &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; <b>M</b> mute &nbsp;·&nbsp; touch: drag');
const ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;

function fit(){
  const sc=document.getElementById('screen-'+ID);
  const bez=cv.parentElement;
  const cs=getComputedStyle(bez),ss=getComputedStyle(sc);
  const tb=sc.querySelector('.gtopbar'),hi=sc.querySelector('.hint'),ro=sc.querySelector('.rot');
  let padW=parseFloat(ss.paddingLeft)+parseFloat(ss.paddingRight)+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
  let padH=parseFloat(ss.paddingTop)+parseFloat(ss.paddingBottom)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  if(tb)padH+=tb.offsetHeight+parseFloat(getComputedStyle(tb).marginBottom||'0');
  if(hi)padH+=hi.offsetHeight+parseFloat(getComputedStyle(hi).marginTop||'0');
  if(ro&&ro.offsetHeight)padH+=ro.offsetHeight+8;
  const s=Math.max(0.15,Math.min((sc.clientWidth-padW)/W,(sc.clientHeight-padH)/H,2.4));
  cv.style.width=Math.round(W*s)+'px';
  cv.style.height=Math.round(H*s)+'px';
}
addEventListener('resize',()=>{if(window.ARCADE&&ARCADE.active===ID)fit();});

/* --------------------------- pixel font --------------------------------- */
const FONT={
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','#####'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','....#','...#.','..##.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','....#','.###.'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'!':['..#..','..#..','..#..','..#..','.....','..#..','..#..'],
'-':['.....','.....','.....','#####','.....','.....','.....'],
'.':['.....','.....','.....','.....','.....','.##..','.##..'],
':':['.....','.##..','.##..','.....','.##..','.##..','.....'],
'/':['....#','...#.','..#..','.#...','#....','.....','.....'],
'<':['#....','.#...','..#..','...#.','..#..','.#...','#....'],
'>':['....#','...#.','..#..','.#...','..#..','...#.','....#'],
"'":['..#..','..#..','.#...','.....','.....','.....','.....'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'?':['.###.','#...#','....#','...#.','..#..','.....','..#..'],
'%':['##..#','##..#','..#..','..#..','.#..#','.#..##','.....'],
};

function drawText(str,x,y,scale,color,glow,align){
  str=String(str).toUpperCase();
  const cw=6*scale;
  let sx=x;
  if(align==='center')sx=x-(str.length*cw-scale)/2;
  else if(align==='right')sx=x-str.length*cw+scale;
  ctx.save();
  ctx.fillStyle=color;
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=9;}
  for(let i=0;i<str.length;i++){
    const g=FONT[str[i]];
    if(g){
      for(let r=0;r<7;r++){
        const row=g[r];
        for(let c=0;c<row.length;c++){
          if(row[c]==='#')ctx.fillRect(sx+i*cw+c*scale, y+r*scale, scale, scale);
        }
      }
    }
  }
  ctx.restore();
}

/* ----------------------------- audio ------------------------------------ */
let AC=null,master=null,muted=false;
try{muted=localStorage.getItem('breakout_mute')==='1';}catch(e){}
function ensureAudio(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f0,f1,dur,type,vol,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(master);
  o.start(t);o.stop(t+dur+0.02);
}
function noise(dur,vol,fc,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const len=Math.floor(AC.sampleRate*dur);
  const buf=AC.createBuffer(1,len,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1000;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f);f.connect(g);g.connect(master);
  src.start(t);
}
const sfx={
  bounce:()=>tone(420,380,0.05,'square',0.07),
  paddle:()=>tone(560,480,0.06,'square',0.08),
  brick:(row)=>{const f=500+row*70;tone(f,f*1.2,0.07,'square',0.09);},
  crack:()=>tone(300,240,0.05,'square',0.06),
  miss:()=>{tone(220,80,0.3,'sawtooth',0.14);noise(0.3,0.3,600);},
  level:()=>{[392,523,659,784,1046].forEach((f,i)=>tone(f,f,0.12,'square',0.12,i*0.09));},
  over:()=>{[392,330,262,196,131].forEach((f,i)=>tone(f,f,0.3,'square',0.14,i*0.22));},
  hi:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,f,0.12,'triangle',0.15,i*0.08));},
  start:()=>{[392,523,659,784].forEach((f,i)=>tone(f,f,0.12,'square',0.11,i*0.09));},
};
function toggleMute(){
  muted=!muted;
  try{localStorage.setItem('breakout_mute',muted?'1':'0');}catch(e){}
}

/* --------------------------- background --------------------------------- */
const nebula=document.createElement('canvas');nebula.width=W;nebula.height=H;
(function(){
  const g=nebula.getContext('2d');
  const gr=g.createRadialGradient(W/2,H*0.35,40,W/2,H*0.35,380);
  gr.addColorStop(0,'rgba(24,48,105,0.5)');
  gr.addColorStop(0.5,'rgba(10,16,44,0.28)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
})();
const stars=[];
for(let l=0;l<3;l++){
  stars[l]=[];
  for(let i=0;i<60;i++){
    stars[l].push({x:rand(0,W),y:rand(0,H),sp:rand(8,20)+l*14,sz:l===2?2:1});
  }
}

/* --------------------------- game state --------------------------------- */
const BX=18,BW=52,BH=20,BG=4,ROWS=8,COLS=8;
const BRICK_COLS=['#ff5d6c','#ff9f43','#ffd34d','#5dff8c','#7ff7ff','#6fd0ff','#b78bff','#ff7ac8'];
const PADDLE_W=72,PADDLE_H=10,PADDLE_Y=592;
let state='title';        // title | ready | playing | gameover
let paused=false;
let score=0,hi=0,hiBeaten=false;
let level=1,lives=3;
let paddle={x:W/2-36};
let ball={x:0,y:0,vx:0,vy:0,r:5,speed:0};
let bricks=[];
let banner='',bannerT=0;
let particles=[],rings=[],floaters=[];
let shake=0,flash=0;
try{hi=+localStorage.getItem('breakout_hi')||0;}catch(e){}

/* --------------------------- hub link ----------------------------------- */
function exitToHub(){
  if(window.ARCADE)ARCADE.exit();
}
function pushScore(){
  if(window.ARCADE)ARCADE.reportScore(ID,hi);
}

function brickRect(b){
  return{x:BX+b.c*(BW+BG),y:90+b.r*(BH+BG),w:BW,h:BH};
}
function buildWall(){
  bricks=[];
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      bricks.push({c,r,hp:r<2?2:1,col:BRICK_COLS[r]});
    }
  }
}
function startGame(){
  score=0;level=1;lives=3;hiBeaten=false;paused=false;
  banner='';bannerT=0;shake=0;flash=0;
  buildWall();
  resetBall();
  state='ready';
  sfx.start();
}
function resetBall(){
  paddle.x=W/2-PADDLE_W/2;
  ball.x=paddle.x+PADDLE_W/2;
  ball.y=PADDLE_Y-8;
  ball.vx=0;ball.vy=0;
  ball.speed=240+level*15;
  state='ready';
}
function launch(){
  const a=-Math.PI/2+rand(-0.42,0.42);
  ball.vx=Math.cos(a)*ball.speed;
  ball.vy=Math.sin(a)*ball.speed;
  state='playing';
}
function endGame(){
  state='gameover';
  if(score>hi){hi=score;hiBeaten=true;try{localStorage.setItem('breakout_hi',hi);}catch(e){}sfx.hi();}
  pushScore();
  sfx.over();
}
function loseLife(){
  lives--;
  sfx.miss();
  shake=8;flash=0.2;
  rings.push({x:ball.x,y:ball.y,r:6,max:70,life:0.5,t:0,col:'#ff5d6c'});
  if(lives<=0){endGame();return;}
  resetBall();
}
function hitBrick(b){
  const r=brickRect(b);
  const cx=r.x+r.w/2,cy=r.y+r.h/2;
  b.hp--;
  sfx.brick(b.r);
  if(b.hp>0){
    sfx.crack();
    for(let i=0;i<5;i++){
      const a=rand(0,TAU);
      particles.push({x:cx,y:cy,vx:Math.cos(a)*rand(40,110),vy:Math.sin(a)*rand(40,110),life:0.3,t:0,col:'#ffffff',sz:1});
    }
    return;
  }
  // destroyed
  const pts=(ROWS-b.r)*10;
  score+=pts;
  if(score>hi){hi=score;try{localStorage.setItem('breakout_hi',hi);}catch(e){}}
  floaters.push({x:cx,y:cy-8,txt:String(pts),t:0,life:0.7,col:b.col});
  for(let i=0;i<12;i++){
    const a=rand(0,TAU),sp=rand(40,160);
    particles.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(0.25,0.55),t:0,col:b.col,sz:rand(1,2)});
  }
  rings.push({x:cx,y:cy,r:4,max:44,life:0.4,t:0,col:b.col});
  shake=Math.min(shake+2,7);
  const alive=bricks.filter(br=>br.hp>0);
  if(alive.length===0){
    level++;
    banner='LEVEL '+level;bannerT=1.6;
    buildWall();
    resetBall();
    sfx.level();
    floaters.push({x:W/2,y:480,txt:'CLEAR!',t:0,life:1.2,col:'#ffd34d'});
  }
}
function collideBricks(){
  let hit=false;
  for(const b of bricks){
    if(b.hp<=0)continue;
    const r=brickRect(b);
    const cx=clamp(ball.x,r.x,r.x+r.w);
    const cy=clamp(ball.y,r.y,r.y+r.h);
    const dx=ball.x-cx,dy=ball.y-cy;
    const d2=dx*dx+dy*dy;
    if(d2<=ball.r*ball.r){
      // determine side by penetration
      const px=Math.min(ball.x-r.x,r.x+r.w-ball.x);
      const py=Math.min(ball.y-r.y,r.y+r.h-ball.y);
      if(px<py)ball.vx=-ball.vx;
      else ball.vy=-ball.vy;
      // push out
      const d=Math.sqrt(d2)||1;
      ball.x=cx+dx/d*(ball.r+0.5);
      ball.y=cy+dy/d*(ball.r+0.5);
      hitBrick(b);
      hit=true;
    }
  }
  return hit;
}

/* --------------------------- input -------------------------------------- */
const pressed={left:false,right:false};
addEventListener('keydown',e=>{
  if(!window.ARCADE||ARCADE.active!==ID)return;
  ensureAudio();
  if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  switch(e.code){
    case'ArrowLeft':case'KeyA':pressed.left=true;break;
    case'ArrowRight':case'KeyD':pressed.right=true;break;
    case'Space':case'Enter':
      if(!e.repeat){
        if(state==='title'||state==='gameover')startGame();
        else if(state==='ready')launch();
      }
      break;
    case'KeyH':if(!e.repeat)exitToHub();break;
    case'KeyM':if(!e.repeat)toggleMute();break;
    case'KeyN':case'KeyR':if(!e.repeat)startGame();break;
    case'KeyP':case'Escape':if(!e.repeat&&(state==='playing'||state==='ready'))paused=!paused;break;
  }
});
addEventListener('keyup',e=>{
  switch(e.code){
    case'ArrowLeft':case'KeyA':pressed.left=false;break;
    case'ArrowRight':case'KeyD':pressed.right=false;break;
  }
});
addEventListener('blur',()=>{pressed.left=pressed.right=false;if(state==='playing')paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='playing'||state==='ready'))paused=true;});

function movePaddleTo(clientX){
  const r=cv.getBoundingClientRect();
  const x=(clientX-r.left)/r.width*W;
  paddle.x=clamp(x-PADDLE_W/2,4,W-PADDLE_W-4);
}
cv.addEventListener('touchstart',e=>{
  e.preventDefault();ensureAudio();
  movePaddleTo(e.touches[0].clientX);
  if(state==='title'||state==='gameover')startGame();
  else if(state==='ready')launch();
},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();movePaddleTo(e.touches[0].clientX);},{passive:false});
cv.addEventListener('mousemove',e=>{
  const r=cv.getBoundingClientRect();
  const mx=e.clientX-r.left;
  if(mx>=0&&mx<=r.width)movePaddleTo(e.clientX);
});
cv.addEventListener('mousedown',()=>{
  ensureAudio();
  if(state==='title'||state==='gameover')startGame();
  else if(state==='ready')launch();
});

/* --------------------------- update ------------------------------------- */
function updateFx(dt){
  for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;}
  for(const r of rings){r.t+=dt;}
  for(const f of floaters){f.t+=dt;f.y-=24*dt;}
  particles=particles.filter(p=>p.t<p.life);
  rings=rings.filter(r=>r.t<r.life);
  floaters=floaters.filter(f=>f.t<f.life);
}
function update(dt){
  for(let l=0;l<3;l++)for(const s of stars[l]){s.y+=s.sp*dt;if(s.y>H){s.y=-2;s.x=rand(0,W);}}
  flash=Math.max(0,flash-dt*1.6);
  if(shake>0.3){shake*=0.88;if(shake<0.3)shake=0;}
  if(bannerT>0)bannerT-=dt;
  if(state==='title'||state==='gameover'){updateFx(dt);return;}
  if(paused){updateFx(dt);return;}

  // paddle
  let mv=0;
  if(pressed.left)mv--;
  if(pressed.right)mv++;
  paddle.x=clamp(paddle.x+mv*440*dt,4,W-PADDLE_W-4);

  if(state==='ready'){
    ball.x=paddle.x+PADDLE_W/2;
    ball.y=PADDLE_Y-8;
    updateFx(dt);
    return;
  }

  // ball
  ball.x+=ball.vx*dt;
  ball.y+=ball.vy*dt;

  // walls
  if(ball.x<ball.r){ball.x=ball.r;ball.vx=-ball.vx;sfx.bounce();}
  if(ball.x>W-ball.r){ball.x=W-ball.r;ball.vx=-ball.vx;sfx.bounce();}
  if(ball.y<ball.r){ball.y=ball.r;ball.vy=-ball.vy;sfx.bounce();}

  // paddle
  if(ball.vy>0&&ball.y+ball.r>=PADDLE_Y&&ball.y+ball.r<=PADDLE_Y+PADDLE_H+6&&
     ball.x>=paddle.x-4&&ball.x<=paddle.x+PADDLE_W+4){
    const rel=clamp((ball.x-(paddle.x+PADDLE_W/2))/(PADDLE_W/2),-1,1);
    const ang=rel*1.15-Math.PI/2;
    const sp=Math.min(520,ball.speed*1.03);
    ball.speed=sp;
    ball.vx=Math.cos(ang)*sp;
    ball.vy=Math.sin(ang)*sp;
    ball.y=PADDLE_Y-ball.r;
    sfx.paddle();
    for(let i=0;i<4;i++){
      particles.push({x:ball.x,y:PADDLE_Y,vx:rand(-50,50),vy:rand(-110,-40),life:0.25,t:0,col:'#7ff7ff',sz:1});
    }
  }

  // bricks
  collideBricks();

  // lost ball
  if(ball.y>H+20)loseLife();

  updateFx(dt);
}

/* --------------------------- draw --------------------------------------- */
function drawBrick(b){
  const r=brickRect(b);
  const col=b.hp>1?b.col:'#7f8bb0';
  ctx.save();
  ctx.shadowColor=b.col;ctx.shadowBlur=8;
  ctx.fillStyle=b.col;
  ctx.fillRect(r.x,r.y,r.w,r.h);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.35)';
  ctx.fillRect(r.x,r.y,r.w,4);
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.fillRect(r.x,r.y+r.h-3,r.w,3);
  ctx.strokeStyle='rgba(0,0,0,0.4)';
  ctx.strokeRect(r.x+0.5,r.y+0.5,r.w-1,r.h-1);
  if(b.hp>1){
    ctx.fillStyle='rgba(255,255,255,0.25)';
    ctx.fillRect(r.x+6,r.y+7,r.w-12,2);
  }
  ctx.restore();
}
function drawPaddle(){
  ctx.save();
  ctx.shadowColor='#7ff7ff';ctx.shadowBlur=14;
  ctx.fillStyle='#7ff7ff';
  ctx.fillRect(paddle.x,paddle.y,PADDLE_W,PADDLE_H);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.fillRect(paddle.x,paddle.y,PADDLE_W,3);
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.fillRect(paddle.x,paddle.y+PADDLE_H-3,PADDLE_W,3);
  ctx.strokeStyle='rgba(0,0,0,0.45)';
  ctx.strokeRect(paddle.x+0.5,paddle.y+0.5,PADDLE_W-1,PADDLE_H-1);
  ctx.restore();
}
function drawBall(){
  ctx.save();
  ctx.shadowColor='#ffffff';ctx.shadowBlur=12;
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,TAU);ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.7)';
  ctx.beginPath();ctx.arc(ball.x-1.5,ball.y-1.5,1.6,0,TAU);ctx.fill();
  ctx.restore();
}
function drawHUD(){
  drawText('SCORE',12,12,1,'#6fd0ff',false);
  drawText(pad6(score),12,22,1.6,'#ffffff',true);
  drawText('HI',W-58,12,1,'#ffd34d',false);
  drawText(pad6(hi),W-8,22,1.6,'#ffd34d',true,'right');
  drawText('LV',W/2-24,12,1,'#6fd0ff',false);
  drawText(String(level),W/2,23,1.6,'#ffffff',true,'center');
  // lives as mini paddles
  for(let i=0;i<lives;i++){
    const x=16+i*20,y=H-16;
    ctx.save();
    ctx.shadowColor='#7ff7ff';ctx.shadowBlur=6;
    ctx.fillStyle='#7ff7ff';
    ctx.fillRect(x,y,14,4);
    ctx.restore();
  }
  drawText('M '+(muted?'OFF':'ON'),8,H-12,0.8,'#5a6280',false);
}
function drawBanner(){
  const a=bannerT>1.25?(1.6-bannerT)/0.35:(bannerT<0.4?bannerT/0.4:1);
  ctx.globalAlpha=clamp(a,0,1);
  drawText(banner,W/2,280,2.8,'#7ff7ff',true,'center');
  ctx.globalAlpha=1;
}
function drawTitle(t){
  // demo ball bouncing behind
  const dy=Math.abs(((t*160)%(H-140))-60)+60;
  ctx.save();
  ctx.shadowColor='#ffffff';ctx.shadowBlur=10;
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.arc(W/2,dy,5,0,TAU);ctx.fill();
  ctx.restore();

  ctx.fillStyle='rgba(2,3,8,0.55)';ctx.fillRect(0,0,W,H);
  drawText('BREAKOUT',W/2,110,4.4,'#ffd34d',true,'center');
  drawText('RETRO NEON BRICKS',W/2,162,1,'#4a5168',false,'center');
  drawText('MOVE: ARROWS / A D',W/2,340,1.1,'#cfe0ff',false,'center');
  drawText('LAUNCH: SPACE',W/2,362,1.1,'#cfe0ff',false,'center');
  drawText('PAUSE: P    MUTE: M    NEW: N',W/2,384,1.1,'#cfe0ff',false,'center');
  drawText('TOUCH: DRAG + TAP TO LAUNCH',W/2,406,1.1,'#8fa0c8',false,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,452,1.4,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER OR TAP TO START',W/2,510,1.5,'#7ff7ff',true,'center');
}
function drawGameOver(t){
  ctx.fillStyle='rgba(2,3,8,0.72)';ctx.fillRect(0,0,W,H);
  drawText('GAME OVER',W/2,220,4,'#ff5d6c',true,'center');
  drawText('OUT OF LIVES',W/2,272,1.3,'#ff9a5c',true,'center');
  drawText('SCORE '+pad6(score),W/2,330,1.8,'#ffffff',true,'center');
  if(hiBeaten)drawText('NEW HIGH SCORE!',W/2,366,1.4,'#ffd34d',true,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,402,1.3,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER TO PLAY AGAIN',W/2,496,1.5,'#7ff7ff',true,'center');
}
function drawPaused(){
  ctx.fillStyle='rgba(2,3,8,0.6)';ctx.fillRect(0,0,W,H);
  drawText('PAUSED',W/2,300,3,'#7ff7ff',true,'center');
  drawText('PRESS P TO RESUME',W/2,350,1.3,'#cfe0ff',true,'center');
}
function draw(t){
  ctx.save();
  ctx.fillStyle='#020308';ctx.fillRect(0,0,W,H);
  ctx.drawImage(nebula,0,0);

  for(let l=0;l<3;l++){
    ctx.globalAlpha=[0.3,0.5,0.85][l];
    ctx.fillStyle='#dfe8ff';
    for(const s of stars[l])ctx.fillRect(s.x,s.y,s.sz,s.sz);
  }
  ctx.globalAlpha=1;

  if(shake>0.3)ctx.translate(rand(-shake,shake),rand(-shake,shake));

  if(state!=='title'){
    for(const b of bricks)if(b.hp>0)drawBrick(b);
    drawPaddle();
    drawBall();
  }

  // particles (additive)
  ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,1-p.t/p.life);
    ctx.fillStyle=p.col;
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';

  // rings
  for(const r of rings){
    const pr=r.t/r.life;
    ctx.globalAlpha=1-pr;
    ctx.strokeStyle=r.col;
    ctx.lineWidth=2*(1-pr)+0.5;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r+(r.max-r.r)*pr,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // floaters
  for(const f of floaters){
    ctx.globalAlpha=clamp(1-f.t/f.life,0,1);
    drawText(f.txt,f.x,f.y,1.2,f.col,false,'center');
  }
  ctx.globalAlpha=1;

  ctx.restore();

  if(flash>0){
    ctx.fillStyle='rgba(255,255,255,'+Math.min(0.5,flash)+')';
    ctx.fillRect(0,0,W,H);
  }

  if(state==='playing'||state==='ready'||state==='gameover')drawHUD();
  if(state==='title')drawTitle(t);
  else if(state==='gameover')drawGameOver(t);
  if(banner&&bannerT>0&&(state==='playing'||state==='ready'))drawBanner();
  if(paused)drawPaused();
}

/* --------------------------- main loop ---------------------------------- */
let last=performance.now();
let raf=null;
function loop(now){
  if(!window.ARCADE||ARCADE.active!==ID){raf=null;return;}
  const dt=Math.min(0.1,(now-last)/1000);
  last=now;
  if(!paused)update(dt);
  draw(now/1000);
  raf=requestAnimationFrame(loop);
}
ARCADE.register(ID,{start:function(){fit();if(!raf)raf=requestAnimationFrame(loop);}});
})();

/* ============================ FLAPPY BIRD ============================ */
(function(){
'use strict';
const ID='flappy';

/* ----------------------------- helpers --------------------------------- */
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;
const pad6=n=>String(Math.max(0,Math.floor(n))).padStart(6,'0');

/* ----------------------------- canvas ---------------------------------- */
const W=480,H=640;
const cv=mountScreen(ID,'FLAPPY BIRD','<b>H</b> hub &nbsp;·&nbsp; <b>SPACE / TAP</b> flap &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; <b>M</b> mute');
const ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;

function fit(){
  const sc=document.getElementById('screen-'+ID);
  const bez=cv.parentElement;
  const cs=getComputedStyle(bez),ss=getComputedStyle(sc);
  const tb=sc.querySelector('.gtopbar'),hi=sc.querySelector('.hint'),ro=sc.querySelector('.rot');
  let padW=parseFloat(ss.paddingLeft)+parseFloat(ss.paddingRight)+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
  let padH=parseFloat(ss.paddingTop)+parseFloat(ss.paddingBottom)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  if(tb)padH+=tb.offsetHeight+parseFloat(getComputedStyle(tb).marginBottom||'0');
  if(hi)padH+=hi.offsetHeight+parseFloat(getComputedStyle(hi).marginTop||'0');
  if(ro&&ro.offsetHeight)padH+=ro.offsetHeight+8;
  const s=Math.max(0.15,Math.min((sc.clientWidth-padW)/W,(sc.clientHeight-padH)/H,2.4));
  cv.style.width=Math.round(W*s)+'px';
  cv.style.height=Math.round(H*s)+'px';
}
addEventListener('resize',()=>{if(window.ARCADE&&ARCADE.active===ID)fit();});

/* --------------------------- pixel font --------------------------------- */
const FONT={
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','#####'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','....#','...#.','..##.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','....#','.###.'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'!':['..#..','..#..','..#..','..#..','.....','..#..','..#..'],
'-':['.....','.....','.....','#####','.....','.....','.....'],
'.':['.....','.....','.....','.....','.....','.##..','.##..'],
':':['.....','.##..','.##..','.....','.##..','.##..','.....'],
'/':['....#','...#.','..#..','.#...','#....','.....','.....'],
'<':['#....','.#...','..#..','...#.','..#..','.#...','#....'],
'>':['....#','...#.','..#..','.#...','..#..','...#.','....#'],
"'":['..#..','..#..','.#...','.....','.....','.....','.....'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'?':['.###.','#...#','....#','...#.','..#..','.....','..#..'],
'%':['##..#','##..#','..#..','..#..','.#..#','.#..##','.....'],
};

function drawText(str,x,y,scale,color,glow,align){
  str=String(str).toUpperCase();
  const cw=6*scale;
  let sx=x;
  if(align==='center')sx=x-(str.length*cw-scale)/2;
  else if(align==='right')sx=x-str.length*cw+scale;
  ctx.save();
  ctx.fillStyle=color;
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=9;}
  for(let i=0;i<str.length;i++){
    const g=FONT[str[i]];
    if(g){
      for(let r=0;r<7;r++){
        const row=g[r];
        for(let c=0;c<row.length;c++){
          if(row[c]==='#')ctx.fillRect(sx+i*cw+c*scale, y+r*scale, scale, scale);
        }
      }
    }
  }
  ctx.restore();
}

/* ----------------------------- audio ------------------------------------ */
let AC=null,master=null,muted=false;
try{muted=localStorage.getItem('flappy_mute')==='1';}catch(e){}
function ensureAudio(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f0,f1,dur,type,vol,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(master);
  o.start(t);o.stop(t+dur+0.02);
}
function noise(dur,vol,fc,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const len=Math.floor(AC.sampleRate*dur);
  const buf=AC.createBuffer(1,len,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1000;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f);f.connect(g);g.connect(master);
  src.start(t);
}
const sfx={
  flap:()=>tone(500,760,0.07,'square',0.1),
  score:()=>{[784,1175].forEach((f,i)=>tone(f,f,0.09,'square',0.12,i*0.07));},
  hit:()=>{noise(0.35,0.5,900);tone(220,60,0.3,'sawtooth',0.14);},
  over:()=>{[392,330,262,196,131].forEach((f,i)=>tone(f,f,0.3,'square',0.14,i*0.22));},
  hi:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,f,0.12,'triangle',0.15,i*0.08));},
  start:()=>{[392,523,659,784].forEach((f,i)=>tone(f,f,0.12,'square',0.11,i*0.09));},
};
function toggleMute(){
  muted=!muted;
  try{localStorage.setItem('flappy_mute',muted?'1':'0');}catch(e){}
}

/* --------------------------- background --------------------------------- */
const nebula=document.createElement('canvas');nebula.width=W;nebula.height=H;
(function(){
  const g=nebula.getContext('2d');
  const gr=g.createRadialGradient(W/2,H*0.35,40,W/2,H*0.35,380);
  gr.addColorStop(0,'rgba(24,48,105,0.5)');
  gr.addColorStop(0.5,'rgba(10,16,44,0.28)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
})();
const stars=[];
for(let l=0;l<3;l++){
  stars[l]=[];
  for(let i=0;i<60;i++){
    stars[l].push({x:rand(0,W),y:rand(0,H),sp:rand(8,20)+l*14,sz:l===2?2:1});
  }
}

/* --------------------------- game state --------------------------------- */
const GROUND_Y=592;
const BIRD_X=120,BIRD_R=13;
const PIPE_W=72,PIPE_GAP=172;
let state='title';        // title | playing | gameover
let paused=false;
let score=0,hi=0,hiBeaten=false;
let bird={y:0,vy:0,rot:0};
let pipes=[],spawnT=0;
let flash=0;
let particles=[],rings=[],floaters=[];
try{hi=+localStorage.getItem('flappy_hi')||0;}catch(e){}

/* --------------------------- hub link ----------------------------------- */
function exitToHub(){
  if(window.ARCADE)ARCADE.exit();
}
function pushScore(){
  if(window.ARCADE)ARCADE.reportScore(ID,hi);
}

function flap(){
  if(state==='playing'&&!paused){
    bird.vy=-430;
    sfx.flap();
  }
}
function startGame(){
  score=0;hiBeaten=false;paused=false;flash=0;
  pipes=[];spawnT=1.0;particles=[];rings=[];floaters=[];
  bird.y=H*0.42;bird.vy=0;bird.rot=0;
  state='playing';
  sfx.start();
}
function endGame(){
  state='gameover';
  if(score>hi){hi=score;hiBeaten=true;try{localStorage.setItem('flappy_hi',hi);}catch(e){}sfx.hi();}
  pushScore();
  sfx.over();
}
function spawnPipe(){
  const cy=rand(150,GROUND_Y-150);
  pipes.push({x:W+40,cy:cy,scored:false});
}
function hitBird(){
  flash=0.35;
  for(let i=0;i<22;i++){
    const a=rand(0,TAU),sp=rand(40,190);
    particles.push({x:bird.x,y:bird.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(0.3,0.7),t:0,col:pick(['#ffd34d','#ff7ac8','#ffffff','#ff9f43']),sz:rand(1,2.5)});
  }
  rings.push({x:bird.x,y:bird.y,r:4,max:80,life:0.5,t:0,col:'#ffd34d'});
  sfx.hit();
  endGame();
}
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];

/* --------------------------- input -------------------------------------- */
addEventListener('keydown',e=>{
  if(!window.ARCADE||ARCADE.active!==ID)return;
  ensureAudio();
  if(e.code==='Space'||e.code==='ArrowUp')e.preventDefault();
  switch(e.code){
    case'Space':case'ArrowUp':case'KeyW':
      if(!e.repeat){
        if(state==='title'||state==='gameover')startGame();
        else flap();
      }
      break;
    case'Enter':
      if((state==='title'||state==='gameover')&&!e.repeat)startGame();
      break;
    case'KeyN':case'KeyR':if(!e.repeat)startGame();break;
    case'KeyH':if(!e.repeat)exitToHub();break;
    case'KeyM':if(!e.repeat)toggleMute();break;
    case'KeyP':case'Escape':if(!e.repeat&&state==='playing')paused=!paused;break;
  }
});
addEventListener('blur',()=>{if(state==='playing')paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')paused=true;});

cv.addEventListener('touchstart',e=>{
  e.preventDefault();ensureAudio();
  if(state==='title'||state==='gameover')startGame();
  else flap();
},{passive:false});
cv.addEventListener('mousedown',()=>{
  ensureAudio();
  if(state==='title'||state==='gameover')startGame();
  else flap();
});

/* --------------------------- update ------------------------------------- */
function updateFx(dt){
  for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;}
  for(const r of rings){r.t+=dt;}
  for(const f of floaters){f.t+=dt;f.y-=24*dt;}
  particles=particles.filter(p=>p.t<p.life);
  rings=rings.filter(r=>r.t<r.life);
  floaters=floaters.filter(f=>f.t<f.life);
}
function update(dt){
  for(let l=0;l<3;l++)for(const s of stars[l]){s.y+=s.sp*dt;if(s.y>H){s.y=-2;s.x=rand(0,W);}}
  flash=Math.max(0,flash-dt*1.6);
  if(state==='title'){
    // idle bob
    bird.y=H*0.42+Math.sin(performance.now()/400)*10;
    bird.rot=Math.sin(performance.now()/400)*0.15;
    updateFx(dt);
    return;
  }
  if(state==='gameover'){updateFx(dt);return;}
  if(paused){updateFx(dt);return;}

  // bird physics
  bird.vy+=1500*dt;
  bird.y+=bird.vy*dt;
  bird.rot=clamp(bird.vy/900,-0.5,1.3);

  // pipes
  spawnT-=dt;
  if(spawnT<=0){spawnPipe();spawnT=1.5;}
  const speed=190+score*1.2;
  for(const p of pipes)p.x-=speed*dt;
  pipes=pipes.filter(p=>p.x>-PIPE_W-20);

  // scoring + collision
  for(const p of pipes){
    if(!p.scored&&p.x+PIPE_W<bird.x-BIRD_R){p.scored=true;score++;sfx.score();
      if(score>hi){hi=score;try{localStorage.setItem('flappy_hi',hi);}catch(e){}}
      floaters.push({x:W/2,y:120,txt:String(score),t:0,life:0.6,col:'#7ff7ff'});
    }
    if(bird.x+BIRD_R>p.x&&bird.x-BIRD_R<p.x+PIPE_W){
      if(bird.y-BIRD_R<p.cy-PIPE_GAP/2||bird.y+BIRD_R>p.cy+PIPE_GAP/2){hitBird();break;}
    }
  }
  // ground / ceiling
  if(bird.y+BIRD_R>=GROUND_Y){bird.y=GROUND_Y-BIRD_R;hitBird();}
  else if(bird.y-BIRD_R<0){bird.y=BIRD_R;bird.vy=0;}

  updateFx(dt);
}

/* --------------------------- draw --------------------------------------- */
function drawPipe(p){
  const topH=p.cy-PIPE_GAP/2;
  const botY=p.cy+PIPE_GAP/2;
  const botH=GROUND_Y-botY;
  const col='#5dff8c';
  ctx.save();
  // top pipe
  ctx.shadowColor=col;ctx.shadowBlur=10;
  ctx.fillStyle=col;
  ctx.fillRect(p.x,0,PIPE_W,topH);
  ctx.fillRect(p.x-4,topH-18,PIPE_W+8,18);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillRect(p.x+5,0,6,topH);
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.fillRect(p.x+PIPE_W-5,0,5,topH);
  // bottom pipe
  ctx.shadowColor=col;ctx.shadowBlur=10;
  ctx.fillStyle=col;
  ctx.fillRect(p.x,botY,PIPE_W,botH);
  ctx.fillRect(p.x-4,botY,PIPE_W+8,18);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillRect(p.x+5,botY,6,botH);
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.fillRect(p.x+PIPE_W-5,botY,5,botH);
  ctx.restore();
}
function drawGround(t){
  ctx.save();
  ctx.fillStyle='#0d2b1e';
  ctx.fillRect(0,GROUND_Y,W,H-GROUND_Y);
  ctx.fillStyle='#5dff8c';
  ctx.fillRect(0,GROUND_Y,W,4);
  // scrolling dashes
  ctx.fillStyle='rgba(93,255,140,0.5)';
  const off=(t*120)%40;
  for(let x=-40+off;x<W+40;x+=40)ctx.fillRect(x,GROUND_Y+22,18,3);
  ctx.restore();
}
function drawBird(){
  ctx.save();
  ctx.translate(bird.x,bird.y);
  ctx.rotate(bird.rot);
  ctx.shadowColor='#ffd34d';ctx.shadowBlur=14;
  ctx.fillStyle='#ffd34d';
  ctx.beginPath();ctx.ellipse(0,0,BIRD_R+2,BIRD_R-2,0,0,TAU);ctx.fill();
  ctx.shadowBlur=0;
  // wing
  ctx.fillStyle='#ff7ac8';
  ctx.beginPath();ctx.ellipse(-2,3,6,4,0.5,0,TAU);ctx.fill();
  // belly
  ctx.fillStyle='#fff3c4';
  ctx.beginPath();ctx.ellipse(2,4,7,4,0.3,0,TAU);ctx.fill();
  // eye
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.arc(7,-5,4,0,TAU);ctx.fill();
  ctx.fillStyle='#020308';
  ctx.beginPath();ctx.arc(8,-5,2,0,TAU);ctx.fill();
  // beak
  ctx.fillStyle='#ff9f43';
  ctx.fillRect(11,-3,7,4);
  ctx.restore();
}
function drawHUD(){
  drawText('SCORE',12,12,1,'#6fd0ff',false);
  drawText(pad6(score),12,22,1.6,'#ffffff',true);
  drawText('HI',W-58,12,1,'#ffd34d',false);
  drawText(pad6(hi),W-8,22,1.6,'#ffd34d',true,'right');
  drawText('M '+(muted?'OFF':'ON'),8,H-12,0.8,'#5a6280',false);
}
function drawTitle(t){
  // demo pipe
  ctx.fillStyle='rgba(2,3,8,0.55)';ctx.fillRect(0,0,W,H);
  drawText('FLAPPY',W/2,100,4.6,'#ffd34d',true,'center');
  drawText('BIRD',W/2,158,4.6,'#ff7ac8',true,'center');
  drawText('NEON SKIES FLAPPER',W/2,214,1,'#4a5168',false,'center');
  drawText('FLAP: SPACE / TAP',W/2,340,1.1,'#cfe0ff',false,'center');
  drawText('PAUSE: P    MUTE: M    NEW: N',W/2,362,1.1,'#cfe0ff',false,'center');
  drawText('DODGE THE PIPES',W/2,384,1.1,'#8fa0c8',false,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,440,1.4,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('TAP OR PRESS SPACE TO START',W/2,510,1.5,'#7ff7ff',true,'center');
}
function drawGameOver(t){
  ctx.fillStyle='rgba(2,3,8,0.72)';ctx.fillRect(0,0,W,H);
  drawText('GAME OVER',W/2,210,4,'#ff5d6c',true,'center');
  drawText('CRASHED INTO A PIPE',W/2,264,1.2,'#ff9a5c',true,'center');
  drawText('SCORE '+pad6(score),W/2,330,1.8,'#ffffff',true,'center');
  if(hiBeaten)drawText('NEW HIGH SCORE!',W/2,366,1.4,'#ffd34d',true,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,402,1.3,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('TAP OR PRESS SPACE TO PLAY AGAIN',W/2,496,1.4,'#7ff7ff',true,'center');
}
function drawPaused(){
  ctx.fillStyle='rgba(2,3,8,0.6)';ctx.fillRect(0,0,W,H);
  drawText('PAUSED',W/2,300,3,'#7ff7ff',true,'center');
  drawText('PRESS P TO RESUME',W/2,350,1.3,'#cfe0ff',true,'center');
}
function draw(t){
  ctx.save();
  ctx.fillStyle='#020308';ctx.fillRect(0,0,W,H);
  ctx.drawImage(nebula,0,0);

  for(let l=0;l<3;l++){
    ctx.globalAlpha=[0.3,0.5,0.85][l];
    ctx.fillStyle='#dfe8ff';
    for(const s of stars[l])ctx.fillRect(s.x,s.y,s.sz,s.sz);
  }
  ctx.globalAlpha=1;

  for(const p of pipes)drawPipe(p);
  drawGround(t);
  drawBird();

  // particles (additive)
  ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,1-p.t/p.life);
    ctx.fillStyle=p.col;
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';

  // rings
  for(const r of rings){
    const pr=r.t/r.life;
    ctx.globalAlpha=1-pr;
    ctx.strokeStyle=r.col;
    ctx.lineWidth=2*(1-pr)+0.5;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r+(r.max-r.r)*pr,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // floaters
  for(const f of floaters){
    ctx.globalAlpha=clamp(1-f.t/f.life,0,1);
    drawText(f.txt,f.x,f.y,1.2,f.col,false,'center');
  }
  ctx.globalAlpha=1;

  ctx.restore();

  if(flash>0){
    ctx.fillStyle='rgba(255,255,255,'+Math.min(0.5,flash)+')';
    ctx.fillRect(0,0,W,H);
  }

  if(state==='playing'||state==='gameover')drawHUD();
  if(state==='title')drawTitle(t);
  else if(state==='gameover')drawGameOver(t);
  if(paused)drawPaused();
}

/* --------------------------- main loop ---------------------------------- */
let last=performance.now();
let raf=null;
function loop(now){
  if(!window.ARCADE||ARCADE.active!==ID){raf=null;return;}
  const dt=Math.min(0.1,(now-last)/1000);
  last=now;
  if(!paused)update(dt);
  draw(now/1000);
  raf=requestAnimationFrame(loop);
}
ARCADE.register(ID,{start:function(){fit();if(!raf)raf=requestAnimationFrame(loop);}});
})();

/* ============================ CAR RACING ============================ */
(function(){
'use strict';
const ID='racing';

/* ----------------------------- helpers --------------------------------- */
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;
const pad6=n=>String(Math.max(0,Math.floor(n))).padStart(6,'0');
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];

/* ----------------------------- canvas ---------------------------------- */
const W=480,H=640;
const cv=mountScreen(ID,'CAR RACING','<b>H</b> hub &nbsp;·&nbsp; <b>&#8592; &#8594; / A D</b> steer &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; <b>M</b> mute &nbsp;·&nbsp; touch: drag');
const ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;

function fit(){
  const sc=document.getElementById('screen-'+ID);
  const bez=cv.parentElement;
  const cs=getComputedStyle(bez),ss=getComputedStyle(sc);
  const tb=sc.querySelector('.gtopbar'),hi=sc.querySelector('.hint'),ro=sc.querySelector('.rot');
  let padW=parseFloat(ss.paddingLeft)+parseFloat(ss.paddingRight)+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
  let padH=parseFloat(ss.paddingTop)+parseFloat(ss.paddingBottom)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  if(tb)padH+=tb.offsetHeight+parseFloat(getComputedStyle(tb).marginBottom||'0');
  if(hi)padH+=hi.offsetHeight+parseFloat(getComputedStyle(hi).marginTop||'0');
  if(ro&&ro.offsetHeight)padH+=ro.offsetHeight+8;
  const s=Math.max(0.15,Math.min((sc.clientWidth-padW)/W,(sc.clientHeight-padH)/H,2.4));
  cv.style.width=Math.round(W*s)+'px';
  cv.style.height=Math.round(H*s)+'px';
}
addEventListener('resize',()=>{if(window.ARCADE&&ARCADE.active===ID)fit();});

/* --------------------------- pixel font --------------------------------- */
const FONT={
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','#####'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','....#','...#.','..##.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','....#','.###.'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'!':['..#..','..#..','..#..','..#..','.....','..#..','..#..'],
'-':['.....','.....','.....','#####','.....','.....','.....'],
'.':['.....','.....','.....','.....','.....','.##..','.##..'],
':':['.....','.##..','.##..','.....','.##..','.##..','.....'],
'/':['....#','...#.','..#..','.#...','#....','.....','.....'],
'<':['#....','.#...','..#..','...#.','..#..','.#...','#....'],
'>':['....#','...#.','..#..','.#...','..#..','...#.','....#'],
"'":['..#..','..#..','.#...','.....','.....','.....','.....'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'?':['.###.','#...#','....#','...#.','..#..','.....','..#..'],
'%':['##..#','##..#','..#..','..#..','.#..#','.#..##','.....'],
};

function drawText(str,x,y,scale,color,glow,align){
  str=String(str).toUpperCase();
  const cw=6*scale;
  let sx=x;
  if(align==='center')sx=x-(str.length*cw-scale)/2;
  else if(align==='right')sx=x-str.length*cw+scale;
  ctx.save();
  ctx.fillStyle=color;
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=9;}
  for(let i=0;i<str.length;i++){
    const g=FONT[str[i]];
    if(g){
      for(let r=0;r<7;r++){
        const row=g[r];
        for(let c=0;c<row.length;c++){
          if(row[c]==='#')ctx.fillRect(sx+i*cw+c*scale, y+r*scale, scale, scale);
        }
      }
    }
  }
  ctx.restore();
}

/* ----------------------------- audio ------------------------------------ */
let AC=null,master=null,muted=false;
try{muted=localStorage.getItem('racing_mute')==='1';}catch(e){}
function ensureAudio(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f0,f1,dur,type,vol,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(master);
  o.start(t);o.stop(t+dur+0.02);
}
function noise(dur,vol,fc,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const len=Math.floor(AC.sampleRate*dur);
  const buf=AC.createBuffer(1,len,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1000;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f);f.connect(g);g.connect(master);
  src.start(t);
}
const sfx={
  steer:()=>tone(300,260,0.04,'square',0.04),
  near:()=>tone(700,500,0.08,'square',0.07),
  crash:()=>{noise(0.7,0.7,800);tone(200,40,0.5,'sawtooth',0.3);},
  score:()=>tone(784,784,0.06,'square',0.07),
  over:()=>{[392,330,262,196,131].forEach((f,i)=>tone(f,f,0.3,'square',0.14,i*0.22));},
  hi:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,f,0.12,'triangle',0.15,i*0.08));},
  start:()=>{[392,523,659,784].forEach((f,i)=>tone(f,f,0.12,'square',0.11,i*0.09));},
};
function toggleMute(){
  muted=!muted;
  try{localStorage.setItem('racing_mute',muted?'1':'0');}catch(e){}
}

/* --------------------------- background --------------------------------- */
const nebula=document.createElement('canvas');nebula.width=W;nebula.height=H;
(function(){
  const g=nebula.getContext('2d');
  const gr=g.createRadialGradient(W/2,H*0.35,40,W/2,H*0.35,380);
  gr.addColorStop(0,'rgba(24,48,105,0.5)');
  gr.addColorStop(0.5,'rgba(10,16,44,0.28)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
})();
const stars=[];
for(let l=0;l<3;l++){
  stars[l]=[];
  for(let i=0;i<60;i++){
    stars[l].push({x:rand(0,W),y:rand(0,H),sp:rand(8,20)+l*14,sz:l===2?2:1});
  }
}

/* --------------------------- game state --------------------------------- */
const ROAD_X=100,ROAD_W=280,LANES=3,LANE_W=ROAD_W/LANES;
const CAR_W=44,CAR_H=78;
const PLAYER_Y=556;
const CAR_COLS=['#ff5d6c','#ffd34d','#7ff7ff','#b78bff','#ff9f43','#ff7ac8'];
let state='title';        // title | playing | gameover
let paused=false;
let score=0,hi=0,hiBeaten=false;
let player={x:W/2,idx:1};
let cars=[],spawnT=0;
let speed=320;
let dist=0,nextMilestone=0;
let flash=0,shake=0;
let particles=[],rings=[],floaters=[];
try{hi=+localStorage.getItem('racing_hi')||0;}catch(e){}

/* --------------------------- hub link ----------------------------------- */
function exitToHub(){
  if(window.ARCADE)ARCADE.exit();
}
function pushScore(){
  if(window.ARCADE)ARCADE.reportScore(ID,hi);
}

function laneX(i){return ROAD_X+i*LANE_W+LANE_W/2;}
function startGame(){
  score=0;hiBeaten=false;paused=false;
  cars=[];spawnT=0.8;speed=320;dist=0;nextMilestone=100;
  flash=0;shake=0;particles=[];rings=[];floaters=[];
  player.x=W/2;
  state='playing';
  sfx.start();
}
function endGame(){
  state='gameover';
  if(score>hi){hi=score;hiBeaten=true;try{localStorage.setItem('racing_hi',hi);}catch(e){}sfx.hi();}
  pushScore();
  sfx.over();
}
function crash(car){
  flash=0.35;shake=14;
  sfx.crash();
  const cx=car.x,cy=car.y;
  for(let i=0;i<30;i++){
    const a=rand(0,TAU),sp=rand(40,220);
    particles.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(0.3,0.8),t:0,col:pick(['#ffffff','#ffd34d','#ff5d6c','#ff9f43']),sz:rand(1,3)});
  }
  rings.push({x:cx,y:cy,r:4,max:90,life:0.5,t:0,col:'#ffd34d'});
  rings.push({x:player.x,y:PLAYER_Y,r:4,max:60,life:0.45,t:0,col:'#ff5d6c'});
  endGame();
}
function spawnCar(){
  const idx=randi(0,LANES-1);
  // avoid spawning directly on the player's lane if it's the first car after start
  cars.push({x:laneX(idx),y:-CAR_H-randi(0,120),col:CAR_COLS[randi(0,CAR_COLS.length-1)],idx:idx});
}

/* --------------------------- input -------------------------------------- */
const pressed={left:false,right:false};
addEventListener('keydown',e=>{
  if(!window.ARCADE||ARCADE.active!==ID)return;
  ensureAudio();
  if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  switch(e.code){
    case'ArrowLeft':case'KeyA':pressed.left=true;break;
    case'ArrowRight':case'KeyD':pressed.right=true;break;
    case'Enter':case'Space':
      if((state==='title'||state==='gameover')&&!e.repeat)startGame();
      break;
    case'KeyN':case'KeyR':if(!e.repeat)startGame();break;
    case'KeyH':if(!e.repeat)exitToHub();break;
    case'KeyM':if(!e.repeat)toggleMute();break;
    case'KeyP':case'Escape':if(!e.repeat&&state==='playing')paused=!paused;break;
  }
});
addEventListener('keyup',e=>{
  switch(e.code){
    case'ArrowLeft':case'KeyA':pressed.left=false;break;
    case'ArrowRight':case'KeyD':pressed.right=false;break;
  }
});
addEventListener('blur',()=>{pressed.left=pressed.right=false;if(state==='playing')paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')paused=true;});

function steerTo(clientX){
  const r=cv.getBoundingClientRect();
  const x=(clientX-r.left)/r.width*W;
  player.x=clamp(x,ROAD_X+CAR_W/2,ROAD_X+ROAD_W-CAR_W/2);
}
cv.addEventListener('touchstart',e=>{
  e.preventDefault();ensureAudio();
  steerTo(e.touches[0].clientX);
  if(state==='title'||state==='gameover')startGame();
},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();steerTo(e.touches[0].clientX);},{passive:false});
cv.addEventListener('mousemove',e=>{
  const r=cv.getBoundingClientRect();
  const mx=e.clientX-r.left;
  if(mx>=0&&mx<=r.width&&state==='playing')steerTo(e.clientX);
});
cv.addEventListener('mousedown',()=>{
  ensureAudio();
  if(state==='title'||state==='gameover')startGame();
});

/* --------------------------- update ------------------------------------- */
function updateFx(dt){
  for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;}
  for(const r of rings){r.t+=dt;}
  for(const f of floaters){f.t+=dt;f.y-=24*dt;}
  particles=particles.filter(p=>p.t<p.life);
  rings=rings.filter(r=>r.t<r.life);
  floaters=floaters.filter(f=>f.t<f.life);
}
function update(dt){
  for(let l=0;l<3;l++)for(const s of stars[l]){s.y+=s.sp*dt;if(s.y>H){s.y=-2;s.x=rand(0,W);}}
  flash=Math.max(0,flash-dt*1.6);
  if(shake>0.3){shake*=0.88;if(shake<0.3)shake=0;}
  if(state==='title'||state==='gameover'){updateFx(dt);return;}
  if(paused){updateFx(dt);return;}

  // steer
  let mv=0;
  if(pressed.left)mv--;
  if(pressed.right)mv++;
  player.x=clamp(player.x+mv*380*dt,ROAD_X+CAR_W/2,ROAD_X+ROAD_W-CAR_W/2);

  // distance & score
  dist+=speed*dt;
  score=Math.floor(dist/10);
  if(score>hi){hi=score;try{localStorage.setItem('racing_hi',hi);}catch(e){}}
  if(dist>=nextMilestone){
    nextMilestone+=200;
    speed=Math.min(700,speed+24);
    sfx.score();
    floaters.push({x:W/2,y:120,txt:'SPEED UP',t:0,life:0.8,col:'#ff9f43'});
  }

  // spawn traffic
  spawnT-=dt;
  if(spawnT<=0){
    spawnCar();
    spawnT=Math.max(0.45,1.1-speed/1200);
  }

  // move cars
  for(const c of cars)c.y+=speed*dt;
  cars=cars.filter(c=>c.y<H+60);

  // collision (generous box)
  const px=player.x,py=PLAYER_Y;
  for(const c of cars){
    if(c.y<py+CAR_H-14&&c.y+CAR_H>py+14&&Math.abs(c.x-px)<CAR_W-8){
      crash(c);
      break;
    }
  }

  updateFx(dt);
}

/* --------------------------- draw --------------------------------------- */
function drawCar(x,y,col,w,h,isPlayer){
  ctx.save();
  if(isPlayer)ctx.shadowColor='#7ff7ff';else ctx.shadowColor=col;
  ctx.shadowBlur=isPlayer?16:9;
  // body
  ctx.fillStyle=col;
  ctx.fillRect(x-w/2,y-h/2,w,h);
  ctx.shadowBlur=0;
  // windshield
  ctx.fillStyle='rgba(2,3,8,0.75)';
  ctx.fillRect(x-w/2+6,y-h/2+12,w-12,14);
  // rear window
  ctx.fillRect(x-w/2+6,y+h/2-24,w-12,12);
  // roof
  ctx.fillStyle='rgba(255,255,255,0.18)';
  ctx.fillRect(x-w/2+5,y-h/2+30,w-10,h-58);
  // wheels
  ctx.fillStyle='#020308';
  ctx.fillRect(x-w/2-3,y-h/2+8,4,h-16);
  ctx.fillRect(x+w/2-1,y-h/2+8,4,h-16);
  // headlights
  ctx.fillStyle='#ffd34d';
  ctx.fillRect(x-w/2+4,y-h/2+2,6,3);
  ctx.fillRect(x+w/2-10,y-h/2+2,6,3);
  // taillights
  ctx.fillStyle='#ff5d6c';
  ctx.fillRect(x-w/2+4,y+h/2-5,6,3);
  ctx.fillRect(x+w/2-10,y+h/2-5,6,3);
  ctx.restore();
}
function drawRoad(t){
  ctx.save();
  // road surface
  ctx.fillStyle='#0a0c16';
  ctx.fillRect(ROAD_X,0,ROAD_W,H);
  // edges
  ctx.fillStyle='rgba(255,93,108,0.8)';
  ctx.fillRect(ROAD_X-3,0,3,H);
  ctx.fillRect(ROAD_X+ROAD_W,0,3,H);
  // lane dashes scrolling
  ctx.fillStyle='rgba(127,247,255,0.55)';
  const off=(t*speed)%44;
  for(let i=0;i<LANES-1;i++){
    const lx=ROAD_X+(i+1)*LANE_W;
    for(let y=-44+off;y<H;y+=44)ctx.fillRect(lx-1.5,y,3,22);
  }
  ctx.restore();
}
function drawHUD(){
  drawText('SCORE',12,12,1,'#6fd0ff',false);
  drawText(pad6(score),12,22,1.6,'#ffffff',true);
  drawText('HI',W-58,12,1,'#ffd34d',false);
  drawText(pad6(hi),W-8,22,1.6,'#ffd34d',true,'right');
  drawText('KM/H',W-70,44,0.9,'#4a5168',false);
  drawText(String(Math.round(speed/6)),W-8,56,1.6,'#5dff8c',true,'right');
  drawText('M '+(muted?'OFF':'ON'),8,H-12,0.8,'#5a6280',false);
}
function drawTitle(t){
  ctx.fillStyle='rgba(2,3,8,0.55)';ctx.fillRect(0,0,W,H);
  drawText('NEON',W/2,96,4.2,'#6fd0ff',true,'center');
  drawText('RACER',W/2,150,4.2,'#ff5d6c',true,'center');
  drawText('DODGE THE TRAFFIC',W/2,206,1,'#4a5168',false,'center');
  drawText('STEER: ARROWS / A D',W/2,340,1.1,'#cfe0ff',false,'center');
  drawText('PAUSE: P    MUTE: M    NEW: N',W/2,362,1.1,'#cfe0ff',false,'center');
  drawText('TOUCH: DRAG TO STEER',W/2,384,1.1,'#8fa0c8',false,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,440,1.4,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER OR TAP TO START',W/2,510,1.5,'#7ff7ff',true,'center');
}
function drawGameOver(t){
  ctx.fillStyle='rgba(2,3,8,0.72)';ctx.fillRect(0,0,W,H);
  drawText('WRECKED!',W/2,210,4,'#ff5d6c',true,'center');
  drawText('YOU HIT A CAR',W/2,264,1.3,'#ff9a5c',true,'center');
  drawText('SCORE '+pad6(score),W/2,330,1.8,'#ffffff',true,'center');
  if(hiBeaten)drawText('NEW HIGH SCORE!',W/2,366,1.4,'#ffd34d',true,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,402,1.3,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER TO PLAY AGAIN',W/2,496,1.5,'#7ff7ff',true,'center');
}
function drawPaused(){
  ctx.fillStyle='rgba(2,3,8,0.6)';ctx.fillRect(0,0,W,H);
  drawText('PAUSED',W/2,300,3,'#7ff7ff',true,'center');
  drawText('PRESS P TO RESUME',W/2,350,1.3,'#cfe0ff',true,'center');
}
function draw(t){
  ctx.save();
  ctx.fillStyle='#020308';ctx.fillRect(0,0,W,H);
  ctx.drawImage(nebula,0,0);

  for(let l=0;l<3;l++){
    ctx.globalAlpha=[0.3,0.5,0.85][l];
    ctx.fillStyle='#dfe8ff';
    for(const s of stars[l])ctx.fillRect(s.x,s.y,s.sz,s.sz);
  }
  ctx.globalAlpha=1;

  if(shake>0.3)ctx.translate(rand(-shake,shake),rand(-shake,shake));

  drawRoad(t);
  if(state!=='title'){
    for(const c of cars)drawCar(c.x,c.y,c.col,CAR_W,CAR_H,false);
    drawCar(player.x,PLAYER_Y,'#7ff7ff',CAR_W,CAR_H,true);
  }else{
    // demo car parked on the road
    drawCar(W/2,PLAYER_Y,'#7ff7ff',CAR_W,CAR_H,true);
  }

  // particles (additive)
  ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,1-p.t/p.life);
    ctx.fillStyle=p.col;
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';

  // rings
  for(const r of rings){
    const pr=r.t/r.life;
    ctx.globalAlpha=1-pr;
    ctx.strokeStyle=r.col;
    ctx.lineWidth=2*(1-pr)+0.5;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r+(r.max-r.r)*pr,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // floaters
  for(const f of floaters){
    ctx.globalAlpha=clamp(1-f.t/f.life,0,1);
    drawText(f.txt,f.x,f.y,1.2,f.col,false,'center');
  }
  ctx.globalAlpha=1;

  ctx.restore();

  if(flash>0){
    ctx.fillStyle='rgba(255,255,255,'+Math.min(0.5,flash)+')';
    ctx.fillRect(0,0,W,H);
  }

  if(state==='playing'||state==='gameover')drawHUD();
  if(state==='title')drawTitle(t);
  else if(state==='gameover')drawGameOver(t);
  if(paused)drawPaused();
}

/* --------------------------- main loop ---------------------------------- */
let last=performance.now();
let raf=null;
function loop(now){
  if(!window.ARCADE||ARCADE.active!==ID){raf=null;return;}
  const dt=Math.min(0.1,(now-last)/1000);
  last=now;
  if(!paused)update(dt);
  draw(now/1000);
  raf=requestAnimationFrame(loop);
}
ARCADE.register(ID,{start:function(){fit();if(!raf)raf=requestAnimationFrame(loop);}});
})();

/* ============================ SPACE INVADERS ============================ */
(function(){
'use strict';
const ID='invaders';

/* ----------------------------- helpers --------------------------------- */
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const TAU=Math.PI*2;
const pad6=n=>String(Math.max(0,Math.floor(n))).padStart(6,'0');
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];

/* ----------------------------- canvas ---------------------------------- */
const W=480,H=640;
const cv=mountScreen(ID,'SPACE INVADERS','<b>H</b> hub &nbsp;·&nbsp; <b>&#8592; &#8594; / A D</b> move &nbsp;·&nbsp; <b>SPACE</b> fire &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; <b>M</b> mute &nbsp;·&nbsp; touch: drag + tap');
const ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;

function fit(){
  const sc=document.getElementById('screen-'+ID);
  const bez=cv.parentElement;
  const cs=getComputedStyle(bez),ss=getComputedStyle(sc);
  const tb=sc.querySelector('.gtopbar'),hi=sc.querySelector('.hint'),ro=sc.querySelector('.rot');
  let padW=parseFloat(ss.paddingLeft)+parseFloat(ss.paddingRight)+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
  let padH=parseFloat(ss.paddingTop)+parseFloat(ss.paddingBottom)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  if(tb)padH+=tb.offsetHeight+parseFloat(getComputedStyle(tb).marginBottom||'0');
  if(hi)padH+=hi.offsetHeight+parseFloat(getComputedStyle(hi).marginTop||'0');
  if(ro&&ro.offsetHeight)padH+=ro.offsetHeight+8;
  const s=Math.max(0.15,Math.min((sc.clientWidth-padW)/W,(sc.clientHeight-padH)/H,2.4));
  cv.style.width=Math.round(W*s)+'px';
  cv.style.height=Math.round(H*s)+'px';
}
addEventListener('resize',()=>{if(window.ARCADE&&ARCADE.active===ID)fit();});

/* --------------------------- pixel font --------------------------------- */
const FONT={
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','#####'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','....#','...#.','..##.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','....#','.###.'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'!':['..#..','..#..','..#..','..#..','.....','..#..','..#..'],
'-':['.....','.....','.....','#####','.....','.....','.....'],
'.':['.....','.....','.....','.....','.....','.##..','.##..'],
':':['.....','.##..','.##..','.....','.##..','.##..','.....'],
'/':['....#','...#.','..#..','.#...','#....','.....','.....'],
'<':['#....','.#...','..#..','...#.','..#..','.#...','#....'],
'>':['....#','...#.','..#..','.#...','..#..','...#.','....#'],
"'":['..#..','..#..','.#...','.....','.....','.....','.....'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'?':['.###.','#...#','....#','...#.','..#..','.....','..#..'],
'%':['##..#','##..#','..#..','..#..','.#..#','.#..##','.....'],
};

function drawText(str,x,y,scale,color,glow,align){
  str=String(str).toUpperCase();
  const cw=6*scale;
  let sx=x;
  if(align==='center')sx=x-(str.length*cw-scale)/2;
  else if(align==='right')sx=x-str.length*cw+scale;
  ctx.save();
  ctx.fillStyle=color;
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=9;}
  for(let i=0;i<str.length;i++){
    const g=FONT[str[i]];
    if(g){
      for(let r=0;r<7;r++){
        const row=g[r];
        for(let c=0;c<row.length;c++){
          if(row[c]==='#')ctx.fillRect(sx+i*cw+c*scale, y+r*scale, scale, scale);
        }
      }
    }
  }
  ctx.restore();
}

/* ----------------------------- audio ------------------------------------ */
let AC=null,master=null,muted=false;
try{muted=localStorage.getItem('invaders_mute')==='1';}catch(e){}
function ensureAudio(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f0,f1,dur,type,vol,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(master);
  o.start(t);o.stop(t+dur+0.02);
}
function noise(dur,vol,fc,delay){
  if(!AC||muted)return;
  const t=AC.currentTime+(delay||0);
  const len=Math.floor(AC.sampleRate*dur);
  const buf=AC.createBuffer(1,len,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=fc||1000;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f);f.connect(g);g.connect(master);
  src.start(t);
}
const sfx={
  shoot:()=>tone(880,220,0.08,'square',0.1),
  eshoot:()=>tone(320,140,0.08,'sawtooth',0.06),
  alien:()=>tone(200,180,0.04,'square',0.05),
  boom:()=>{noise(0.3,0.4,1100);tone(160,40,0.25,'sine',0.3);},
  big:()=>{noise(0.8,0.6,700);tone(110,30,0.7,'sine',0.4);},
  shield:()=>tone(600,400,0.05,'square',0.06),
  wave:()=>{[392,523,659,784,1046].forEach((f,i)=>tone(f,f,0.14,'square',0.12,i*0.1));},
  over:()=>{[392,330,262,196,131].forEach((f,i)=>tone(f,f,0.3,'square',0.14,i*0.22));},
  hi:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,f,0.12,'triangle',0.15,i*0.08));},
  start:()=>{[392,523,659,784].forEach((f,i)=>tone(f,f,0.12,'square',0.11,i*0.09));},
};
function toggleMute(){
  muted=!muted;
  try{localStorage.setItem('invaders_mute',muted?'1':'0');}catch(e){}
}

/* --------------------------- background --------------------------------- */
const nebula=document.createElement('canvas');nebula.width=W;nebula.height=H;
(function(){
  const g=nebula.getContext('2d');
  const gr=g.createRadialGradient(W/2,H*0.35,40,W/2,H*0.35,380);
  gr.addColorStop(0,'rgba(24,48,105,0.5)');
  gr.addColorStop(0.5,'rgba(10,16,44,0.28)');
  gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
})();
const stars=[];
for(let l=0;l<3;l++){
  stars[l]=[];
  for(let i=0;i<60;i++){
    stars[l].push({x:rand(0,W),y:rand(0,H),sp:rand(8,20)+l*14,sz:l===2?2:1});
  }
}

/* --------------------------- sprites ------------------------------------ */
function alienSprite(rows,cols){
  const c=document.createElement('canvas');c.width=cols;c.height=rows.length;
  const g=c.getContext('2d');
  const pal={'#':'#ff9f43','e':'#020308'};
  for(let y=0;y<rows.length;y++)for(let x=0;x<cols;x++){
    const col=pal[rows[y][x]];
    if(col){g.fillStyle=col;g.fillRect(x,y,1,1);}
  }
  return c;
}
const SPR_INV=[
  // type 0 (bottom row, small squid)
  alienSprite(['..##..','..##..','######','##.##.','..#...','.#..#.','#....#'],8),
  // type 1 (mid row, crab)
  alienSprite(['...#...','..#.#..','##...#.','######','##.##.','#.##.#','#....#'],8),
  // type 2 (top row, octopus)
  alienSprite(['...##...','..#..#..','..####..','##.##.##','##.##.##','#.#..#.#','#..##..#'],9),
];
const ALIEN_COLS=['#ff5d6c','#ffd34d','#b78bff'];
const SCORE_TABLE=[10,20,30];

/* --------------------------- game state --------------------------------- */
const ALIEN_W=34,ALIEN_H=24,ALIEN_GAP=10,ALIEN_ROWS=5,ALIEN_COUNT=8;
const PAD_W=64,PAD_H=12,PAD_Y=596;
let state='title';        // title | playing | gameover
let paused=false;
let score=0,hi=0,lives=3,hiBeaten=false;
let aliens=[],dir=1,alienStep=0.9,stepT=0,dropT=0;
let player={x:W/2,fireCd:0};
let bullets=[],ebullets=[];
let shields=[];
let wave=1;
let flash=0,shake=0,banner='',bannerT=0;
let particles=[],rings=[],floaters=[];
try{hi=+localStorage.getItem('invaders_hi')||0;}catch(e){}

/* --------------------------- hub link ----------------------------------- */
function exitToHub(){
  if(window.ARCADE)ARCADE.exit();
}
function pushScore(){
  if(window.ARCADE)ARCADE.reportScore(ID,hi);
}

function buildAliens(){
  aliens=[];
  for(let r=0;r<ALIEN_ROWS;r++){
    for(let c=0;c<ALIEN_COUNT;c++){
      const type=Math.floor(r/2); // 0,0,1,1,2 → top rows get 2
      aliens.push({type:type,c:c,r:r,x:70+c*(ALIEN_W+ALIEN_GAP),y:70+r*(ALIEN_H+ALIEN_GAP),dead:false,anim:rand(0,1)});
    }
  }
}
function buildShields(){
  shields=[];
  const sw=66,sh=34,sy=500;
  for(let i=0;i<4;i++){
    const sx=40+i*110;
    const cells=[];
    for(let y=0;y<sh;y+=4)for(let x=0;x<sw;x+=4){
      const dx=x/sw,dy=y/sh;
      const inShape=(dx>0.15&&dx<0.85)&&(dy>0.25&&dy<0.95)&&
        !((dx>0.4&&dx<0.6)&&(y<10));
      if(inShape)cells.push({x:sx+x,y:sy+y,w:4,h:4,hp:3});
    }
    shields.push({x:sx,y:sy,cells:cells});
  }
}
function startGame(){
  score=0;lives=3;wave=1;hiBeaten=false;paused=false;
  flash=0;shake=0;banner='';bannerT=0;
  bullets=[];ebullets=[];particles=[];rings=[];floaters=[];
  buildAliens();buildShields();
  dir=1;alienStep=0.9;stepT=0;
  player.x=W/2;player.fireCd=0;
  state='playing';
  sfx.start();
}
function endGame(){
  state='gameover';
  if(score>hi){hi=score;hiBeaten=true;try{localStorage.setItem('invaders_hi',hi);}catch(e){}sfx.hi();}
  pushScore();
  sfx.over();
}
function killAlien(a){
  a.dead=true;
  const pts=SCORE_TABLE[a.type];
  score+=pts;
  if(score>hi){hi=score;try{localStorage.setItem('invaders_hi',hi);}catch(e){}}
  floaters.push({x:a.x,y:a.y-12,txt:String(pts),t:0,life:0.7,col:ALIEN_COLS[a.type]});
  for(let i=0;i<12;i++){
    const ang=rand(0,TAU),sp=rand(40,150);
    particles.push({x:a.x,y:a.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:rand(0.25,0.55),t:0,col:ALIEN_COLS[a.type],sz:rand(1,2)});
  }
  rings.push({x:a.x,y:a.y,r:4,max:40,life:0.4,t:0,col:ALIEN_COLS[a.type]});
  sfx.boom();
}
function killPlayer(){
  lives--;
  flash=0.35;shake=12;
  sfx.big();
  for(let i=0;i<30;i++){
    const ang=rand(0,TAU),sp=rand(40,220);
    particles.push({x:player.x,y:PAD_Y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:rand(0.3,0.8),t:0,col:pick(['#ffffff','#7ff7ff','#ffd34d','#ff5d6c']),sz:rand(1,3)});
  }
  rings.push({x:player.x,y:PAD_Y,r:4,max:80,life:0.5,t:0,col:'#7ff7ff'});
  if(lives<=0){endGame();return;}
  player.x=W/2;player.fireCd=1.0;
}

/* --------------------------- input -------------------------------------- */
const pressed={left:false,right:false,fire:false};
let touching=false;
addEventListener('keydown',e=>{
  if(!window.ARCADE||ARCADE.active!==ID)return;
  ensureAudio();
  if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  switch(e.code){
    case'ArrowLeft':case'KeyA':pressed.left=true;break;
    case'ArrowRight':case'KeyD':pressed.right=true;break;
    case'Space':
      if(state==='title'||state==='gameover'){if(!e.repeat)startGame();}
      else pressed.fire=true;
      break;
    case'Enter':
      if((state==='title'||state==='gameover')&&!e.repeat)startGame();
      break;
    case'KeyN':case'KeyR':if(!e.repeat)startGame();break;
    case'KeyH':if(!e.repeat)exitToHub();break;
    case'KeyM':if(!e.repeat)toggleMute();break;
    case'KeyP':case'Escape':if(!e.repeat&&state==='playing')paused=!paused;break;
  }
});
addEventListener('keyup',e=>{
  switch(e.code){
    case'ArrowLeft':case'KeyA':pressed.left=false;break;
    case'ArrowRight':case'KeyD':pressed.right=false;break;
    case'Space':pressed.fire=false;break;
  }
});
addEventListener('blur',()=>{pressed.left=pressed.right=pressed.fire=false;if(state==='playing')paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')paused=true;});

function touchX(e){
  const r=cv.getBoundingClientRect();
  const tx=(e.touches[0].clientX-r.left)/r.width*W;
  player.x=clamp(tx,28,W-28);
}
cv.addEventListener('touchstart',e=>{
  e.preventDefault();ensureAudio();
  touching=true;touchX(e);
  if(state==='title'||state==='gameover')startGame();
},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();touchX(e);},{passive:false});
cv.addEventListener('touchend',e=>{e.preventDefault();touching=false;},{passive:false});
cv.addEventListener('mousedown',()=>{
  ensureAudio();
  if(state==='title'||state==='gameover')startGame();
});

/* --------------------------- update ------------------------------------- */
function updateFx(dt){
  for(const b of bullets){b.y+=b.vy*dt;b.x+=b.vx*dt;}
  for(const b of ebullets){b.y+=b.vy*dt;b.x+=b.vx*dt;}
  for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;}
  for(const r of rings){r.t+=dt;}
  for(const f of floaters){f.t+=dt;f.y-=24*dt;}
  bullets=bullets.filter(b=>b.y>-12);
  ebullets=ebullets.filter(b=>b.y<H+16);
  particles=particles.filter(p=>p.t<p.life);
  rings=rings.filter(r=>r.t<r.life);
  floaters=floaters.filter(f=>f.t<f.life);
}
function update(dt){
  for(let l=0;l<3;l++)for(const s of stars[l]){s.y+=s.sp*dt;if(s.y>H){s.y=-2;s.x=rand(0,W);}}
  flash=Math.max(0,flash-dt*1.6);
  if(shake>0.3){shake*=0.88;if(shake<0.3)shake=0;}
  if(bannerT>0)bannerT-=dt;
  if(state==='title'||state==='gameover'){updateFx(dt);return;}
  if(paused){updateFx(dt);return;}

  // player movement + fire
  let mv=0;
  if(pressed.left)mv--;
  if(pressed.right)mv++;
  player.x=clamp(player.x+mv*360*dt,28,W-28);
  player.fireCd-=dt;
  if((pressed.fire||touching)&&player.fireCd<=0){
    bullets.push({x:player.x,y:PAD_Y-10,vy:-520,dead:false});
    player.fireCd=0.32;
    sfx.shoot();
  }

  // aliens march
  const alive=aliens.filter(a=>!a.dead);
  if(alive.length===0){
    wave++;
    buildAliens();
    alienStep=Math.max(0.25,0.9-Math.pow(wave,0.6)*0.1);
    banner='WAVE '+wave;bannerT=1.6;
    sfx.wave();
  }else{
    stepT-=dt;
    if(stepT<=0){
      stepT=alienStep;
      let edge=false;
      for(const a of alive){
        a.anim=1-a.anim;
        if((dir>0&&a.x>W-50)||(dir<0&&a.x<50))edge=true;
      }
      if(edge){
        dir*=-1;
        for(const a of alive)a.y+=20;
        if(alive.some(a=>a.y>470)){killPlayer();}
      }else{
        for(const a of alive)a.x+=dir*14;
      }
      sfx.alien();
    }
    // alien fire (bottom-most alien of a random column shoots)
    if(Math.random()<dt*0.55&&ebullets.length<3){
      const bottom={};
      for(const a of alive)bottom[a.c]=a;
      const cols=Object.keys(bottom).map(Number);
      if(cols.length){
        const c=cols[randi(0,cols.length-1)];
        const a=bottom[c];
        ebullets.push({x:a.x,y:a.y+ALIEN_H/2,vy:260+wave*20});
        sfx.eshoot();
      }
    }
  }

  // bullets vs aliens
  for(const b of bullets){
    if(b.dead)continue;
    for(const a of aliens){
      if(a.dead)continue;
      if(Math.abs(b.x-a.x)<ALIEN_W/2&&Math.abs(b.y-a.y)<ALIEN_H/2){
        b.dead=true;
        killAlien(a);
        break;
      }
    }
  }

  // bullets vs shields
  for(const b of bullets){
    if(b.dead)continue;
    outer:
    for(const s of shields){
      for(const c of s.cells){
        if(c.hp>0&&b.x>c.x&&b.x<c.x+4&&b.y>c.y&&b.y<c.y+4){
          c.hp--;b.dead=true;sfx.shield();
          break outer;
        }
      }
    }
  }
  for(const b of ebullets){
    outer:
    for(const s of shields){
      for(const c of s.cells){
        if(c.hp>0&&b.x>c.x&&b.x<c.x+4&&b.y>c.y&&b.y<c.y+4){
          c.hp--;b.dead=true;sfx.shield();
          break outer;
        }
      }
    }
  }

  // bullets vs player
  for(const b of ebullets){
    if(Math.abs(b.x-player.x)<PAD_W/2&&b.y>PAD_Y-6&&b.y<PAD_Y+PAD_H+6){
      b.dead=true;
      killPlayer();
      break;
    }
  }

  // bullets cleanup
  bullets=bullets.filter(b=>!b.dead);
  ebullets=ebullets.filter(b=>!b.dead);

  updateFx(dt);
}

/* --------------------------- draw --------------------------------------- */
function drawAlien(a,t){
  const img=SPR_INV[a.type];
  const bob=Math.floor(t*6)%2===0?a.anim:1-a.anim;
  ctx.save();
  ctx.shadowColor=ALIEN_COLS[a.type];ctx.shadowBlur=9;
  ctx.drawImage(img,a.x-16,a.y-12+bob*2,ALIEN_W,ALIEN_H);
  ctx.restore();
}
function drawPaddle(){
  ctx.save();
  ctx.shadowColor='#7ff7ff';ctx.shadowBlur=14;
  ctx.fillStyle='#7ff7ff';
  ctx.fillRect(player.x-PAD_W/2,PAD_Y,PAD_W,PAD_H);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.fillRect(player.x-PAD_W/2,PAD_Y,PAD_W,3);
  ctx.strokeStyle='rgba(0,0,0,0.45)';
  ctx.strokeRect(player.x-PAD_W/2+0.5,PAD_Y+0.5,PAD_W-1,PAD_H-1);
  ctx.restore();
}
function drawShields(){
  ctx.save();
  for(const s of shields){
    for(const c of s.cells){
      if(c.hp<=0)continue;
      ctx.fillStyle=c.hp===3?'#5dff8c':c.hp===2?'#ffd34d':'#ff5d6c';
      ctx.fillRect(c.x,c.y,c.w,c.h);
    }
  }
  ctx.restore();
}
function drawHUD(){
  drawText('SCORE',12,12,1,'#6fd0ff',false);
  drawText(pad6(score),12,22,1.6,'#ffffff',true);
  drawText('HI',W-58,12,1,'#ffd34d',false);
  drawText(pad6(hi),W-8,22,1.6,'#ffd34d',true,'right');
  // lives as mini paddles
  for(let i=0;i<lives;i++){
    const x=16+i*20,y=H-16;
    ctx.save();
    ctx.shadowColor='#7ff7ff';ctx.shadowBlur=6;
    ctx.fillStyle='#7ff7ff';
    ctx.fillRect(x,y,14,4);
    ctx.restore();
  }
  drawText('M '+(muted?'OFF':'ON'),8,H-12,0.8,'#5a6280',false);
}
function drawBanner(){
  const a=bannerT>1.25?(1.6-bannerT)/0.35:(bannerT<0.4?bannerT/0.4:1);
  ctx.globalAlpha=clamp(a,0,1);
  drawText(banner,W/2,280,2.6,'#7ff7ff',true,'center');
  ctx.globalAlpha=1;
}
function drawTitle(t){
  // demo aliens
  for(let r=0;r<ALIEN_ROWS;r++){
    for(let c=0;c<ALIEN_COUNT;c++){
      const type=Math.floor(r/2);
      const bob=Math.floor(t*4)%2===0?0:2;
      const img=SPR_INV[type];
      const x=90+c*(ALIEN_W+ALIEN_GAP);
      const y=280+r*(ALIEN_H+ALIEN_GAP);
      ctx.save();
      ctx.shadowColor=ALIEN_COLS[type];ctx.shadowBlur=6;
      ctx.drawImage(img,x-16,y-12+bob,ALIEN_W,ALIEN_H);
      ctx.restore();
    }
  }
  ctx.fillStyle='rgba(2,3,8,0.5)';ctx.fillRect(0,0,W,H);
  drawText('SPACE',W/2,96,4.6,'#ff9f43',true,'center');
  drawText('INVADERS',W/2,152,3.6,'#b78bff',true,'center');
  drawText('DEFEND THE EARTH',W/2,236,1,'#4a5168',false,'center');
  drawText('MOVE: ARROWS / A D',W/2,380,1.1,'#cfe0ff',false,'center');
  drawText('FIRE: SPACE',W/2,402,1.1,'#cfe0ff',false,'center');
  drawText('PAUSE: P    MUTE: M    NEW: N',W/2,424,1.1,'#cfe0ff',false,'center');
  drawText('TOUCH: DRAG + AUTO-FIRE',W/2,446,1.1,'#8fa0c8',false,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,492,1.4,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER OR TAP TO START',W/2,530,1.5,'#7ff7ff',true,'center');
}
function drawGameOver(t){
  ctx.fillStyle='rgba(2,3,8,0.72)';ctx.fillRect(0,0,W,H);
  drawText('GAME OVER',W/2,210,4,'#ff5d6c',true,'center');
  drawText('THE INVADERS WON',W/2,264,1.3,'#ff9a5c',true,'center');
  drawText('SCORE '+pad6(score),W/2,330,1.8,'#ffffff',true,'center');
  if(hiBeaten)drawText('NEW HIGH SCORE!',W/2,366,1.4,'#ffd34d',true,'center');
  drawText('HI-SCORE '+pad6(hi),W/2,402,1.3,'#ffd34d',true,'center');
  if(Math.sin(t*3)>-0.3)drawText('PRESS ENTER TO PLAY AGAIN',W/2,496,1.5,'#7ff7ff',true,'center');
}
function drawPaused(){
  ctx.fillStyle='rgba(2,3,8,0.6)';ctx.fillRect(0,0,W,H);
  drawText('PAUSED',W/2,300,3,'#7ff7ff',true,'center');
  drawText('PRESS P TO RESUME',W/2,350,1.3,'#cfe0ff',true,'center');
}
function draw(t){
  ctx.save();
  ctx.fillStyle='#020308';ctx.fillRect(0,0,W,H);
  ctx.drawImage(nebula,0,0);

  for(let l=0;l<3;l++){
    ctx.globalAlpha=[0.3,0.5,0.85][l];
    ctx.fillStyle='#dfe8ff';
    for(const s of stars[l])ctx.fillRect(s.x,s.y,s.sz,s.sz);
  }
  ctx.globalAlpha=1;

  if(shake>0.3)ctx.translate(rand(-shake,shake),rand(-shake,shake));

  if(state!=='title'){
    for(const a of aliens)if(!a.dead)drawAlien(a,t);
    drawShields();
    drawPaddle();
    // bullets
    ctx.shadowColor='#7ff7ff';ctx.shadowBlur=8;
    ctx.fillStyle='#eaffff';
    for(const b of bullets)ctx.fillRect(b.x-1,b.y-4,2,8);
    ctx.shadowBlur=0;
    ctx.shadowColor='#ff9a5c';ctx.shadowBlur=6;
    ctx.fillStyle='#ffd9b0';
    for(const b of ebullets)ctx.fillRect(b.x-2,b.y-5,4,10);
    ctx.shadowBlur=0;
  }

  // particles (additive)
  ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,1-p.t/p.life);
    ctx.fillStyle=p.col;
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  }
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';

  // rings
  for(const r of rings){
    const pr=r.t/r.life;
    ctx.globalAlpha=1-pr;
    ctx.strokeStyle=r.col;
    ctx.lineWidth=2*(1-pr)+0.5;
    ctx.beginPath();ctx.arc(r.x,r.y,r.r+(r.max-r.r)*pr,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=1;

  // floaters
  for(const f of floaters){
    ctx.globalAlpha=clamp(1-f.t/f.life,0,1);
    drawText(f.txt,f.x,f.y,1.2,f.col,false,'center');
  }
  ctx.globalAlpha=1;

  ctx.restore();

  if(flash>0){
    ctx.fillStyle='rgba(255,255,255,'+Math.min(0.5,flash)+')';
    ctx.fillRect(0,0,W,H);
  }

  if(state==='playing'||state==='gameover')drawHUD();
  if(state==='title')drawTitle(t);
  else if(state==='gameover')drawGameOver(t);
  if(banner&&bannerT>0&&state==='playing')drawBanner();
  if(paused)drawPaused();
}

/* --------------------------- main loop ---------------------------------- */
let last=performance.now();
let raf=null;
function loop(now){
  if(!window.ARCADE||ARCADE.active!==ID){raf=null;return;}
  const dt=Math.min(0.1,(now-last)/1000);
  last=now;
  if(!paused)update(dt);
  draw(now/1000);
  raf=requestAnimationFrame(loop);
}
ARCADE.register(ID,{start:function(){fit();if(!raf)raf=requestAnimationFrame(loop);}});
})();
