(() => {
  const canvas = document.getElementById("rift");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let t = 0;

  // Parallax offsets (very subtle)
  let px = 0, py = 0;
  let targetPx = 0, targetPy = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  window.addEventListener("resize", resize);
  resize();

  // Parallax on desktop mousemove (soft)
  window.addEventListener("mousemove", (e) => {
    const nx = (e.clientX / w) * 2 - 1; // -1..1
    const ny = (e.clientY / h) * 2 - 1;
    targetPx = nx * 18;
    targetPy = ny * 14;
  }, { passive: true });

  // Smooth layers
  const layers = [
    { amp: 14, freq: 0.010, speed: 0.0060, glow: 0.35, alpha: 0.12 },
    { amp: 26, freq: 0.007, speed: 0.0048, glow: 0.55, alpha: 0.09 },
    { amp: 40, freq: 0.005, speed: 0.0038, glow: 0.85, alpha: 0.05 },
  ];

  function drawBackground() {
    // subtle vertical gradient
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(255,255,255,0.030)");
    g.addColorStop(0.55, "rgba(255,255,255,0.010)");
    g.addColorStop(1, "rgba(0,0,0,0.00)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // faint particles (slow)
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 40; i++) {
      const x = (Math.sin((t*0.0012) + i*9.2) * 0.5 + 0.5) * w;
      const y = (Math.cos((t*0.0010) + i*7.1) * 0.5 + 0.5) * h;
      const r = 0.7 + (i % 3) * 0.35;
      ctx.fillStyle = "rgba(255,255,255,0.055)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function drawRift() {
    const isMobile = w < 640;
    const baseY = isMobile ? h * 0.60 : h * 0.52;

    // soften parallax on mobile
    const ox = isMobile ? 0 : px;
    const oy = isMobile ? 0 : py;

    // gentle dark fade
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    ctx.fillRect(0, 0, w, h);

    for (const L of layers) {
      const points = [];
      const steps = 150;

      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * w;
        const n1 = Math.sin((x * L.freq) + (t * L.speed));
        const n2 = Math.sin((x * (L.freq * 1.7)) + (t * (L.speed * 0.9)));
        const n3 = Math.sin((x * (L.freq * 2.6)) + (t * (L.speed * 0.45)));
        const y = baseY + (n1 * L.amp) + (n2 * (L.amp * 0.55)) + (n3 * (L.amp * 0.18));
        points.push({ x: x + ox*0.25, y: y + oy*0.20 });
      }

      // outer glow
      ctx.save();
      ctx.lineWidth = 10;
      ctx.strokeStyle = `rgba(255,255,255,${L.alpha * L.glow})`;
      ctx.shadowColor = "rgba(255,255,255,0.32)";
      ctx.shadowBlur = 28;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();

      // inner line
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = `rgba(255,255,255,${L.alpha + 0.04})`;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();

      // shimmer sweep (very slow)
      const shimmerX = (Math.sin(t*0.004) * 0.5 + 0.5) * w;
      const shimmerW = w * 0.14;
      const grad = ctx.createLinearGradient(shimmerX - shimmerW, 0, shimmerX + shimmerW, 0);
      grad.addColorStop(0, "rgba(255,255,255,0.0)");
      grad.addColorStop(0.5, `rgba(255,255,255,0.055)`);
      grad.addColorStop(1, "rgba(255,255,255,0.0)");

      ctx.globalCompositeOperation = "screen";
      ctx.lineWidth = 6;
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";

      ctx.restore();
    }

    // subtle center fog (adds "expensive" depth)
    const cx = w*0.5 + (isMobile ? 0 : px*0.2);
    const cy = baseY + (isMobile ? 0 : py*0.2);

    const fog = ctx.createRadialGradient(cx, cy, 40, cx, cy, Math.max(w, h) * 0.55);
    fog.addColorStop(0, "rgba(255,255,255,0.050)");
    fog.addColorStop(1, "rgba(255,255,255,0.00)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);
  }

  function frame() {
    // smooth parallax easing
    px += (targetPx - px) * 0.04;
    py += (targetPy - py) * 0.04;

    t += 1;
    ctx.clearRect(0, 0, w, h);
    drawBackground();
    drawRift();
    requestAnimationFrame(frame);
  }

  frame();
})();
