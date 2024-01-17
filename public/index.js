(() => {
  // node_modules/d3-ease/src/poly.js
  var exponent = 3;
  var polyIn = function custom(e) {
    e = +e;
    function polyIn2(t) {
      return Math.pow(t, e);
    }
    polyIn2.exponent = custom;
    return polyIn2;
  }(exponent);
  var polyOut = function custom2(e) {
    e = +e;
    function polyOut2(t) {
      return 1 - Math.pow(1 - t, e);
    }
    polyOut2.exponent = custom2;
    return polyOut2;
  }(exponent);
  var polyInOut = function custom3(e) {
    e = +e;
    function polyInOut2(t) {
      return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
    }
    polyInOut2.exponent = custom3;
    return polyInOut2;
  }(exponent);

  // index.ts
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("Failed to get context");
  var color = Math.floor(Math.random() * 255);
  var id = Math.floor(Math.random() * 2 ** 30);
  var radius = 50;
  var moves = [
    {
      r: radius,
      sx: canvas.clientWidth / 2,
      sy: canvas.clientHeight / 2,
      gx: canvas.clientWidth / 2,
      gy: canvas.clientHeight / 2,
      startTime: 0,
      color,
      id
    }
  ];
  var moveTime = 1 * 1e3;
  console.log(color);
  function render() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    moves.forEach((m) => {
      ctx.fillStyle = `hsl(${m.color}, 100%, 50%)`;
      ctx.lineWidth = m.r * 2;
      ctx.strokeStyle = `hsl(${m.color}, 100%, 50%)`;
      let amount = Math.max(0, Math.min(polyInOut((+/* @__PURE__ */ new Date() - m.startTime) / moveTime), 1));
      let dx = m.sx - m.gx;
      let dy = m.sy - m.gy;
      let ex = m.sx - dx * amount;
      let ey = m.sy - dy * amount;
      ctx.beginPath();
      ctx.ellipse(m.sx, m.sy, m.r, m.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ex, ey, m.r, m.r, 0, 0, Math.PI * 2);
      ctx.fill();
      if (amount !== 1) {
        ctx.beginPath();
        ctx.ellipse(m.gx, m.gy, m.r, m.r, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(m.sx, m.sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    });
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  var server = new WebSocket("ws://localhost:8080");
  window.addEventListener("click", (ev) => {
    let last = [...moves].reverse().find((v) => v.id === id);
    let timePasted = +/* @__PURE__ */ new Date() - last.startTime;
    let startTime = +/* @__PURE__ */ new Date();
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
      id
    });
    server.send(JSON.stringify(moves.filter((v) => v.id === id)));
  });
  server.addEventListener("message", (ev) => {
    const data = JSON.parse(ev.data);
    console.log("Received", data);
    const id2 = data[0].id;
    moves = moves.filter((v) => v.id !== id2);
    moves.push(...data);
    moves.sort((a, b) => a.startTime - b.startTime);
  });
})();
