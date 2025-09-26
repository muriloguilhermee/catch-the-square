// Elementos
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const scoreEl = document.getElementById('score');
    const bestEl = document.getElementById('best');
    const timeLeftEl = document.getElementById('timeLeft');
    const duration = document.getElementById('duration');
    const durationVal = document.getElementById('durationVal');
    const sizeRange = document.getElementById('sizeRange');
    const sizeVal = document.getElementById('sizeVal');
    const mode = document.getElementById('mode');

    // Estado
    let running = false;
    let lastTime = 0;
    let score = 0;
    let best = Number(localStorage.getItem('catch_best') || '0');
    let timeLeft = Number(duration.value);
    let target = {x:100,y:100,size:Number(sizeRange.value),vx:150,vy:120};
    let autoplay=false;
    let paused = false;

    bestEl.textContent = best;
    scoreEl.textContent = score;
    timeLeftEl.textContent = timeLeft;
    durationVal.textContent = duration.value + 's';
    sizeVal.textContent = sizeRange.value + 'px';

    // Ajusta para alta-DPI
    function resizeCanvas(){
      const ratio = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function placeTargetRandom(){
      const padding = 10 + target.size/2;
      target.x = padding + Math.random()*(canvas.clientWidth - padding*2);
      target.y = padding + Math.random()*(canvas.clientHeight - padding*2);
    }

    placeTargetRandom();

    function startGame(){
      score = 0;scoreEl.textContent = score;
      timeLeft = Number(duration.value);timeLeftEl.textContent = timeLeft;
      target.size = Number(sizeRange.value);
      placeTargetRandom();
      lastTime = performance.now();
      running = true;
      paused = false;
      requestAnimationFrame(loop);
    }

    function pauseGame(){
      if(!running) return;
      paused = !paused;
      pauseBtn.textContent = paused ? 'Retomar' : 'Pausar';
      if(!paused) { lastTime = performance.now(); requestAnimationFrame(loop); }
    }

    function resetGame(){
      running = false;
      paused = false;
      score = 0; scoreEl.textContent = score;
      timeLeft = Number(duration.value); timeLeftEl.textContent = timeLeft;
      pauseBtn.textContent = 'Pausar';
      placeTargetRandom();
      draw();
    }

    function endGame(){
      running = false;
      if(score > best){ best = score; localStorage.setItem('catch_best', String(best)); bestEl.textContent = best; }
      // mostra um pequeno overlay simples
      setTimeout(()=>{
        ctx.fillStyle = 'rgba(2,6,23,0.6)';
        ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '28px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Fim de jogo!  Pontuação: ' + score, canvas.clientWidth/2, canvas.clientHeight/2);
      }, 80);
    }

    // Loop principal
    function loop(now){
      if(!running || paused) return;
      const dt = Math.min(0.1, (now - lastTime)/1000);
      lastTime = now;

      // tempo
      timeLeft -= dt;
      if(timeLeft <= 0){ timeLeft = 0; timeLeftEl.textContent = '0'; endGame(); return; }
      timeLeftEl.textContent = Math.ceil(timeLeft);

      // movimenta alvo (movimento simples)
      const speedFactor = 1 + score*0.05;
      target.x += target.vx * dt * speedFactor;
      target.y += target.vy * dt * speedFactor;

      // colisão com borda
      if(target.x < target.size/2 || target.x > canvas.clientWidth - target.size/2) target.vx *= -1;
      if(target.y < target.size/2 || target.y > canvas.clientHeight - target.size/2) target.vy *= -1;

      // modo dificl: teleporte aleatório ocasional
      if(mode.value === 'hard' && Math.random() < 0.01 + score*0.001) placeTargetRandom();

      draw();
      requestAnimationFrame(loop);
    }

    function draw(){
      // limpa
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);

      // desenha gradiente de fundo sutil
      const g = ctx.createLinearGradient(0,0,0,canvas.clientHeight);
      g.addColorStop(0, 'rgba(6,12,28,0.6)');
      g.addColorStop(1, 'rgba(8,18,32,0.4)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);

      // desenha alvo
      ctx.save();
      ctx.translate(target.x, target.y);
      // sombra
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(-target.size/2, -target.size/2, target.size, target.size);
      ctx.restore();

      // HUD
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(8,8,190,56);
        ctx.fillStyle = '#cfe8ff';
        ctx.font = '14px system-ui';
        ctx.fillText('Clique no quadrado!', 18, 28);
        ctx.fillStyle = '#bcd9ff';
        ctx.font = '20px system-ui';
        ctx.fillText('Pontos: ' + score, 18, 50);
    }

    // detectar clique / toque
    function getCanvasPos(e){
      const rect = canvas.getBoundingClientRect();
      const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
      const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
      return {x: clientX - rect.left, y: clientY - rect.top};
    }

    function onClick(e){
      if(!running) return;
      const p = getCanvasPos(e);
      const dx = p.x - target.x;
      const dy = p.y - target.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const half = target.size/2;
      if(Math.abs(dx) <= half && Math.abs(dy) <= half){
        // acerto
        score += 1;
        scoreEl.textContent = score;
        // pequenas recompensas dependendo do modo
        if(mode.value === 'relax') timeLeft += 0.8;
        // aumenta velocidade ligeiramente invertendo e alterando a velocidade
        target.vx = (Math.random()*200 - 100) * (0.8 + Math.random()*1.4);
        target.vy = (Math.random()*200 - 100) * (0.8 + Math.random()*1.4);

        // teleport para variar
        placeTargetRandom();
      }
    }

    canvas.addEventListener('mousedown', onClick);
    canvas.addEventListener('touchstart', function(e){ e.preventDefault(); onClick(e); }, {passive:false});

    // botões
    startBtn.addEventListener('click', ()=>{ startGame(); });
    pauseBtn.addEventListener('click', ()=>{ pauseGame(); });
    resetBtn.addEventListener('click', ()=>{ resetGame(); });

    duration.addEventListener('input', ()=>{ durationVal.textContent = duration.value + 's'; if(!running) { timeLeft = Number(duration.value); timeLeftEl.textContent = timeLeft; } });
    sizeRange.addEventListener('input', ()=>{ sizeVal.textContent = sizeRange.value + 'px'; target.size = Number(sizeRange.value); });

    // desenha primeiro frame
    draw();

    // dicas de teclado (opcional)
    window.addEventListener('keydown', (e)=>{
      if(e.key === ' '){ e.preventDefault(); if(!running) startGame(); else pauseGame(); }
      if(e.key.toLowerCase() === 'r') resetGame();
    });

    // salva recorde ao fechar
    window.addEventListener('beforeunload', ()=>{ localStorage.setItem('catch_best', String(best)); });