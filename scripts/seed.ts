import { processAndCreateProject } from "../src/lib/services/project-service";
import { getAllProjects } from "../src/db";

async function seed() {
  console.log("🌱 Checking database for existing projects...");
  const existing = await getAllProjects({ includePrivate: true });
  if (existing.length > 0) {
    console.log(`Database already has ${existing.length} projects. Skipping seed.`);
    return;
  }

  console.log("🚀 Seeding demo AI artifacts...");

  // Demo 1: Particle Universe Simulator
  const particleHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>粒子引力星空模拟器</title>
  <meta name="description" content="基于 HTML5 Canvas 构建的高性能交互式粒子引力引力场模拟器">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #050510; overflow: hidden; font-family: sans-serif; color: #fff; }
    #canvas { display: block; width: 100vw; height: 100vh; }
    .ui {
      position: absolute; top: 16px; left: 16px; z-index: 10;
      background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px);
      padding: 12px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
      font-size: 12px; pointer-events: none;
    }
    .ui h1 { font-size: 14px; margin-bottom: 4px; color: #818cf8; }
  </style>
</head>
<body>
  <div class="ui">
    <h1>✨ 粒子引力星空模拟器</h1>
    <p>移动鼠标以生成引力扰动，点击画布释放超新星粒子脉冲</p>
  </div>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = [];
    const count = 120;
    const mouse = { x: -1000, y: -1000 };

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2 + 1,
        color: ['#818cf8', '#c084fc', '#38bdf8', '#f472b6'][Math.floor(Math.random() * 4)]
      });
    }

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('click', (e) => {
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 2.5 + 1.5,
          color: '#fbbf24',
          decay: 0.96,
          life: 1.0
        });
      }
    });

    function loop() {
      ctx.fillStyle = 'rgba(5, 5, 16, 0.2)';
      ctx.fillRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.decay) {
          p.vx *= p.decay;
          p.vy *= p.decay;
          p.life -= 0.015;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
        } else {
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(129, 140, 248, ' + (1 - dist / 100) * 0.2 + ')';
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`;

  await processAndCreateProject({
    title: "粒子引力星空模拟器",
    slug: "particle-simulator",
    description: "基于 HTML5 Canvas 构建的高性能交互式粒子引力引力场模拟器，支持鼠标引力与粒子爆发。",
    category: "animations",
    tags: ["Canvas", "物理引擎", "交互动画"],
    htmlContent: particleHtml,
    isPinned: true,
  });

  // Demo 2: Typing Speed Tester
  const typingHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>打字速度与准确率测试工具</title>
  <meta name="description" content="极简高效的打字测速单页应用，实时计算 WPM 与打字准确率">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #090d16; color: #e2e8f0; font-family: ui-monospace, monospace;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 100vh; padding: 20px;
    }
    .card {
      background: #111827; border: 1px solid #1f2937; border-radius: 16px;
      max-width: 600px; width: 100%; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
    }
    h1 { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #38bdf8; }
    .sample {
      background: #0f172a; padding: 16px; border-radius: 10px; font-size: 15px;
      line-height: 1.6; margin-bottom: 20px; color: #94a3b8; user-select: none;
    }
    textarea {
      width: 100%; background: #030712; border: 1px solid #374151; border-radius: 10px;
      padding: 14px; color: #fff; font-family: inherit; font-size: 14px; outline: none;
      resize: none; transition: border-color 0.2s;
    }
    textarea:focus { border-color: #38bdf8; }
    .stats {
      display: flex; justify-content: space-around; margin-top: 24px; text-align: center;
    }
    .stat-val { font-size: 24px; font-weight: bold; color: #38bdf8; }
    .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚡ 极速打字测速工具</h1>
    <div class="sample" id="sample">The quick brown fox jumps over the lazy dog. Code is like humor. When you have to explain it, it is bad.</div>
    <textarea id="input" rows="3" placeholder="在此输入上方文字开始测试..."></textarea>
    <div class="stats">
      <div><div class="stat-val" id="wpm">0</div><div class="stat-label">WPM (字/分)</div></div>
      <div><div class="stat-val" id="accuracy">100%</div><div class="stat-label">准确率</div></div>
      <div><div class="stat-val" id="timer">0s</div><div class="stat-label">耗时</div></div>
    </div>
  </div>
  <script>
    const sample = document.getElementById('sample').innerText;
    const input = document.getElementById('input');
    const wpmEl = document.getElementById('wpm');
    const accEl = document.getElementById('accuracy');
    const timerEl = document.getElementById('timer');
    let startTime = null;
    let timerInterval = null;

    input.addEventListener('input', () => {
      if (!startTime) {
        startTime = Date.now();
        timerInterval = setInterval(() => {
          const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
          timerEl.innerText = elapsedSec + 's';
        }, 1000);
      }

      const val = input.value;
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const words = val.trim().split(/\\s+/).filter(Boolean).length;
      const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
      wpmEl.innerText = wpm;

      let correct = 0;
      for (let i = 0; i < val.length; i++) {
        if (val[i] === sample[i]) correct++;
      }
      const acc = val.length > 0 ? Math.round((correct / val.length) * 100) : 100;
      accEl.innerText = acc + '%';
    });
  </script>
</body>
</html>`;

  await processAndCreateProject({
    title: "打字速度与准确率测试器",
    slug: "typing-speed-test",
    description: "极简高效的打字测速单页应用，实时计算 WPM (字/分) 与击键准确率。",
    category: "tools",
    tags: ["测速工具", "JavaScript", "效率"],
    htmlContent: typingHtml,
    isPinned: false,
  });

  console.log("🎉 Seed finished successfully!");
}

seed().catch(console.error);
