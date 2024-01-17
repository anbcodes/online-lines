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

function render() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

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
    ctx.ellipse(m.sx, m.sy, m.r, m.r, 0, 0, Math.PI * 2);
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(ex, ey, m.r, m.r, 0, 0, Math.PI * 2);
    ctx.fill();

    if (amount !== 1) {
      ctx.beginPath()
      ctx.ellipse(m.gx, m.gy, m.r, m.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(m.sx, m.sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  })

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

let server = new WebSocket(((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + "/socket");

window.addEventListener('pointerdown', (ev) => {
  let last = [...moves].reverse().find(v => v.id === id)!;
  let timePasted = +new Date() - last.startTime;
  let startTime = +new Date();
  if (timePasted < moveTime) {
    startTime = last.startTime + moveTime;
  }

  moves.push({
    startTime,
    color,
    gx: ev.x,
    gy: ev.y,
    sx: last.gx,
    sy: last.gy,
    r: radius,
    id,
  });

  server.send(JSON.stringify(moves.filter(v => v.id === id)));
})

server.addEventListener('message', (ev) => {
  const data = JSON.parse(ev.data);
  console.log("Received", data);
  const id = data[0].id;
  moves = moves.filter(v => v.id !== id);
  moves.push(...data);
  moves.sort((a, b) => a.startTime - b.startTime)
})
