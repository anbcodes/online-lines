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

  // public/index.ts
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("Failed to get context");
  var color = Math.floor(Math.random() * 255);
  var id = Math.floor(Math.random() * 2 ** 30);
  var radius = 10;
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
  var offsetX = 0;
  var offsetY = 0;
  var mvx = 0;
  var mvy = 0;
  var prevtime = 0;
  function render(time) {
    let dt = prevtime ? time - prevtime : 0;
    prevtime = time;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    offsetX += mvx * (dt / 1e3);
    offsetY += mvy * (dt / 1e3);
    mvx *= 0.9;
    mvy *= 0.9;
    if (Math.abs(mvx) < 1) {
      mvx = 0;
    }
    if (Math.abs(mvy) < 1) {
      mvy = 0;
    }
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
      ctx.ellipse(m.sx + offsetX, m.sy + offsetY, m.r, m.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ex + offsetX, ey + offsetY, m.r, m.r, 0, 0, Math.PI * 2);
      ctx.fill();
      if (amount !== 1) {
        ctx.beginPath();
        ctx.ellipse(m.gx + offsetX, m.gy + offsetY, m.r, m.r, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(m.sx + offsetX, m.sy + offsetY);
      ctx.lineTo(ex + offsetX, ey + offsetY);
      ctx.stroke();
    });
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  var server = new WebSocket((window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/");
  var mousedown = false;
  var moved = false;
  var lmx = 0;
  var lmy = 0;
  var smx = 0;
  var smy = 0;
  var mousedownstart = 0;
  window.addEventListener("pointerdown", (ev) => {
    mousedown = true;
    moved = false;
    lmx = ev.pageX;
    lmy = ev.pageY;
    smx = ev.pageX;
    smy = ev.pageY;
    mousedownstart = +/* @__PURE__ */ new Date();
  });
  window.addEventListener("pointermove", (ev) => {
    if (mousedown) {
      const t = +/* @__PURE__ */ new Date();
      if (t - mousedownstart > 500) {
        mousedownstart = +/* @__PURE__ */ new Date();
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
  });
  window.addEventListener("pointerup", (ev) => {
    mousedown = false;
    if (!moved) {
      let last = [...moves].reverse().find((v) => v.id === id);
      let timePasted = +/* @__PURE__ */ new Date() - last.startTime;
      let startTime = +/* @__PURE__ */ new Date();
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
        id
      });
      server.send(JSON.stringify(moves.filter((v) => v.id === id)));
    } else {
      let t = +/* @__PURE__ */ new Date() - mousedownstart;
      mvx = (ev.pageX - smx) / (t / 1e3);
      mvy = (ev.pageY - smy) / (t / 1e3);
      if (isNaN(mvx))
        mvx = 0;
      if (isNaN(mvy))
        mvy = 0;
      if (Math.abs(mvx) > 2e3)
        mvx = Math.sign(mvx) * 2e3;
      if (Math.abs(mvy) > 2e3)
        mvy = Math.sign(mvy) * 2e3;
      console.log(mvx, mvy);
    }
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
