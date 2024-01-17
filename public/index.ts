import { easePolyInOut } from 'd3-ease';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
if (!ctx) throw new Error("Failed to get context");

const color = Math.floor(Math.random() * 255)
const id = Math.floor(Math.random() * 2 ** 30);

let radius = 10;

let moves: {
  r: number,
  sx: number,
  sy: number,
  gx: number,
  gy: number,
  startTime: number,
  color: number,
  id: number,
}[] = [
    {
      r: radius,
      sx: canvas.clientWidth / 2,
      sy: canvas.clientHeight / 2,
      gx: canvas.clientWidth / 2,
      gy: canvas.clientHeight / 2,
      startTime: 0,
      color,
      id,
    }
  ];

// p.x = p.sx = p.gx = canvas.clientWidth / 2;
// p.y = p.sy = p.gy = canvas.clientHeight / 2;

const moveTime = 1 * 1000;

console.log(color)

let offsetX = 0;
let offsetY = 0;
let mvx = 0;
let mvy = 0;
let prevtime = 0;

function render(time: number) {
  let dt = prevtime ? time - prevtime : 0;
  prevtime = time;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // console.log(mvx, mvy);

  offsetX += mvx * (dt / 1000);
  offsetY += mvy * (dt / 1000);

  mvx *= 0.90;
  mvy *= 0.90;

  if (Math.abs(mvx) < 1) {
    mvx = 0;
  }
  if (Math.abs(mvy) < 1) {
    mvy = 0;
  }

  // ctx.beginPath();
  // ctx.ellipse(p.x, p.y, p.w, p.h, 0, 0, Math.PI * 2);
  // ctx.fill();
  // ctx.fil(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);

  moves.forEach(m => {
    ctx.fillStyle = `hsl(${m.color}, 100%, 50%)`;
    ctx.lineWidth = m.r * 2;
    ctx.strokeStyle = `hsl(${m.color}, 100%, 50%)`;
    let amount = Math.max(0, Math.min(easePolyInOut((+new Date() - m.startTime) / moveTime), 1));

    let dx = m.sx - m.gx;
    let dy = m.sy - m.gy;
    let ex = m.sx - dx * amount;
    let ey = m.sy - dy * amount;

    ctx.beginPath();
    ctx.ellipse(m.sx + offsetX, m.sy + offsetY, m.r, m.r, 0, 0, Math.PI * 2);
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(ex + offsetX, ey + offsetY, m.r, m.r, 0, 0, Math.PI * 2);
    ctx.fill();

    if (amount !== 1) {
      ctx.beginPath()
      ctx.ellipse(m.gx + offsetX, m.gy + offsetY, m.r, m.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(m.sx + offsetX, m.sy + offsetY);
    ctx.lineTo(ex + offsetX, ey + offsetY);
    ctx.stroke();
  })

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

let server = new WebSocket(((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + "/");

let mousedown = false;
let moved = false;
let lmx = 0;
let lmy = 0;
let smx = 0;
let smy = 0;
let mousedownstart = 0;

window.addEventListener('pointerdown', (ev) => {
  mousedown = true;
  moved = false;
  lmx = ev.pageX;
  lmy = ev.pageY;
  smx = ev.pageX;
  smy = ev.pageY;
  mousedownstart = +new Date();
})

window.addEventListener('pointermove', (ev) => {
  if (mousedown) {
    const t = +new Date();
    if (t - mousedownstart > 500) {
      mousedownstart = +new Date();
      smx = ev.pageX;
      smy = ev.pageY;
    }

    moved = true;
    let dx = ev.pageX - lmx;
    let dy = ev.pageY - lmy;

    offsetX += dx;
    offsetY += dy;

    lmx = ev.pageX;
    lmy = ev.pageY;
  }
})

window.addEventListener('pointerup', (ev) => {
  mousedown = false;
  if (!moved) {
    let last = [...moves].reverse().find(v => v.id === id)!;
    let timePasted = +new Date() - last.startTime;
    let startTime = +new Date();
    if (timePasted < moveTime) {
      startTime = last.startTime + moveTime;
    }

    moves.push({
      startTime,
      color,
      gx: ev.pageX - offsetX,
      gy: ev.pageY - offsetY,
      sx: last.gx,
      sy: last.gy,
      r: radius,
      id,
    });

    server.send(JSON.stringify(moves.filter(v => v.id === id)));
  } else {
    let t = +new Date() - mousedownstart;
    mvx = (ev.pageX - smx) / (t / 1000);
    mvy = (ev.pageY - smy) / (t / 1000);
    if (isNaN(mvx)) mvx = 0;
    if (isNaN(mvy)) mvy = 0;

    if (Math.abs(mvx) > 2000) mvx = Math.sign(mvx) * 2000;
    if (Math.abs(mvy) > 2000) mvy = Math.sign(mvy) * 2000;
    console.log(mvx, mvy);
  }
})

server.addEventListener('message', (ev) => {
  const data = JSON.parse(ev.data);
  console.log("Received", data);
  const id = data[0].id;
  moves = moves.filter(v => v.id !== id);
  moves.push(...data);
  moves.sort((a, b) => a.startTime - b.startTime)
})
