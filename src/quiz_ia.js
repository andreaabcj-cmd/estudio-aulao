/* Dois jogos com arte gerada no PC: Pênalti e Missão Tática. Só o gênero: nomes, cenários e personagens são próprios. Vai no HTML exportado. */
(function () {
  var EA = window.EA, LETRAS = 'ABCD';
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }
  function img(src, cls, css) { var i = EA.el('img', cls); i.alt = ''; i.draggable = false; i.src = EA.url(src || ''); if (css) i.style.cssText = css; return i }
  function textoGrande(raiz, txt, cls) {
    var n = EA.el('div', 'ia-grito ' + (cls || ''), txt); raiz.appendChild(n);
    n.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.12)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .8 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }], { duration: 1500, easing: 'ease-out' }).onfinish = function () { n.remove() };
  }
  function fimIa(raiz, ganhou, acertos, tot, titulo, b1, sub) {
    var f = EA.el('div', 'ia-fim ' + (ganhou ? 'ganhou' : 'perdeu'), '<h2>' + titulo + '</h2><p>' + (sub || acertos + ' de ' + tot + ' certas') + '</p><div><button data-acao="recomeca" class="ui-botao claro">' + b1 + '</button><button data-acao="segue" class="ui-botao">Continuar →</button></div>');
    raiz.appendChild(f);
    f.animate([{ transform: 'translate(-50%,-40%)', opacity: 0 }, { transform: 'translate(-50%,-50%)', opacity: 1 }], { duration: 600, delay: 300, fill: 'backwards', easing: 'cubic-bezier(.2,.8,.2,1)' });
    EA.Som.tocar(ganhou ? 'vitoria' : 'derrota');
    if (ganhou) EA.festa(raiz, EA.W / 2, 280, 170);
  }

  /* ---------- clima das telas finais: em cima da pintura, no mesmo traço ---------- */
  function climaFim(raiz, tipo) {
    var c = EA.el('canvas', 'pen-clima'), g = c.getContext('2d'), W = 1280, H = 720, i, ant = performance.now(), it = [], fase = 0;
    c.width = W; c.height = H; raiz.insertBefore(c, raiz.querySelector('.ia-fim') || null);
    function r(a, b) { return a + Math.random() * (b - a) }
    if (tipo === 'chuva') {
      for (i = 0; i < 190; i++) it.push({ x: r(-80, W + 80), y: r(-H, H), v: r(620, 1050), l: r(14, 34), a: r(.14, .42), z: r(.6, 1) });
    } else {
      for (i = 0; i < 90; i++) it.push({ x: r(0, W), y: r(-H, H), v: r(60, 170), l: r(7, 13), a: r(0, 6.3), g: r(2, 6), b: r(0, 6.3), c: ['#ff5d73', '#ffd166', '#4fd1ff', '#6be3a4', '#ffffff', '#c77dff'][i % 6] });
    }
    var poca = [], bri = [];
    (function p() {
      if (!c.isConnected) return;
      var t = performance.now(), dt = Math.min(.05, (t - ant) / 1000); ant = t; fase += dt;
      g.clearRect(0, 0, W, H);
      if (tipo === 'chuva') {
        g.lineCap = 'round';
        it.forEach(function (d) {
          d.y += d.v * dt; d.x -= d.v * .09 * dt;
          if (d.y > H * (.72 + d.z * .28)) {
            if (Math.random() < .5) poca.push({ x: d.x, y: d.y, v: 0, z: d.z });
            d.y = r(-160, -20); d.x = r(-60, W + 120);
          }
          g.strokeStyle = 'rgba(205,226,246,' + d.a + ')'; g.lineWidth = d.z * 1.3;
          g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x + d.l * .09, d.y - d.l); g.stroke();
        });
        poca = poca.filter(function (o) {
          o.v += dt; if (o.v > .34) return false;
          var f = o.v / .34;
          g.strokeStyle = 'rgba(215,232,250,' + (1 - f) * .5 + ')'; g.lineWidth = 1;
          g.beginPath(); g.ellipse(o.x, o.y, 3 + f * 13 * o.z, 1 + f * 4 * o.z, 0, 0, 6.3); g.stroke();
          return true;
        });
      } else {
        /* brilhos que acendem e apagam, mais confete caindo e girando */
        if (Math.random() < .28) bri.push({ x: r(0, W), y: r(0, H * .55), v: 0, d: r(.35, .9), t: r(9, 26) });
        bri = bri.filter(function (b) {
          b.v += dt; if (b.v >= b.d) return false;
          var a = Math.sin(b.v / b.d * Math.PI), l = b.t * (.5 + a);
          g.fillStyle = 'rgba(255,255,255,' + a * .92 + ')';
          g.beginPath(); g.moveTo(b.x, b.y - l); g.quadraticCurveTo(b.x, b.y, b.x + l, b.y); g.quadraticCurveTo(b.x, b.y, b.x, b.y + l); g.quadraticCurveTo(b.x, b.y, b.x - l, b.y); g.quadraticCurveTo(b.x, b.y, b.x, b.y - l); g.fill();
          return true;
        });
        it.forEach(function (o) {
          o.y += o.v * dt; o.b += dt * 2.2; o.a += o.g * dt; var x = o.x + Math.sin(o.b) * 22;
          if (o.y > H + 20) { o.y = r(-60, -10); o.x = r(0, W) }
          g.save(); g.translate(x, o.y); g.rotate(o.a); g.scale(1, Math.cos(o.a * 1.7)); g.fillStyle = o.c; g.fillRect(-o.l / 2, -o.l / 4, o.l, o.l / 2); g.restore();
        });
      }
      requestAnimationFrame(p);
    })();
    return c;
  }

  /* ---------- pênalti ----------
     Cada personagem é um "ator": todas as poses ficam carregadas, alinhadas pelo pé de apoio (medido em ferramentas/gerar_penalti.py),
     então trocar de pose não dá tranco. Bola e goleiro são calculados quadro a quadro. */
  var GOL = { esq: 393, dir: 885, trave: 296, chao: 478, meio: 640 };
  var BOLA0 = { x: 640, y: 535, s: .8 };
  function suave(f) { return f * f * (3 - 2 * f) }
  function tween(dur, fn, curva) {
    return new Promise(function (ok) {
      var ini = performance.now();
      (function p() {
        var f = Math.min(1, (performance.now() - ini) / dur);
        fn(curva ? curva(f) : f, f);
        if (f < 1) requestAnimationFrame(p); else ok();
      })();
    });
  }
  function montaPenalti(raiz, q, ctx) {
    var A = q.arte, M = q.penM || {}, total = q.perguntas.length, duelo = q.modoPen === 'duelo', nomes = [q.time || 'Meu time', q.time2 || 'Visitante'];
    raiz.className = 'quiz quiz-ia quiz-pen' + (duelo ? ' duelo' : '');
    raiz.innerHTML = '<div class="ia-fundo" style="background-image:url(' + EA.url(A.fut_estadio) + ')"></div><i class="pen-farol e"></i><i class="pen-farol d"></i><canvas class="pen-brilho" width="1280" height="340"></canvas>' +
      '<div class="pen-placar"></div><div class="pen-perg"></div><div class="pen-lado esq"></div><div class="pen-lado dir"></div><div class="pen-cena"></div><div class="pen-exp"></div>';
    var cena = raiz.querySelector('.pen-cena'), eP = raiz.querySelector('.pen-perg'), eE = raiz.querySelector('.pen-exp'), ePl = raiz.querySelector('.pen-placar'), eL = raiz.querySelector('.pen-lado.esq'), eD = raiz.querySelector('.pen-lado.dir');

    /* ator: pivô no chão, entre os pés. x, y, s (tamanho), r (giro), sy (achatado), vira (espelha) */
    function ator(z) {
      var a = { el: EA.el('div', 'pen-ator'), poses: {}, atual: null, x: 0, y: 0, s: 1, r: 0, sy: 1, vira: 1 };
      a.el.style.zIndex = z;
      a.add = function (nome, id, alt, modo) {  
        var m = M[id]; if (!m || !A[id]) return;
        /* k: escala fixa da pose, medida pelo número 7 (atacante) e pela cabeça (goleiro). Medir pela altura da imagem fazia o corpo mudar de tamanho na troca.
           modo "centro" gira e alinha pelo meio do corpo */
        var c = m.caixa, k = alt;
        var px = modo === 'centro' || modo === 'meio' ? (c[0] + c[2]) / 2 : m.pe[0], py = modo === 'centro' ? (c[1] + c[3]) / 2 : m.pe[1];
        var g = EA.el('div', 'pen-pose'); g.style.display = 'none';
        var i = img(A[id]); i.style.cssText = 'position:absolute;width:' + m.w * k + 'px;left:' + -px * k + 'px;top:' + -py * k + 'px';
        g.appendChild(i);
        a.el.appendChild(g); a.poses[nome] = { g: g, i: i, k: k, px: px, py: py };
      };
      a.rig = function (nome, id) {   /* troca a arte da pose por duas camadas: corpo por cima, perna girando atrás dele */
        var P = a.poses[nome], mc = M[id + '_corpo'], mp = M[id + '_perna'];
        if (!P || !mc || !mp || !A[id + '_corpo'] || !A[id + '_perna'] || !mp.piv) return;
        var w = P.i.style.width, l = P.i.style.left, t = P.i.style.top, css = 'position:absolute;width:' + w + ';left:' + l + ';top:' + t;
        var perna = img(A[id + '_perna'], '', css), corpo = img(A[id + '_corpo'], '', css);
        perna.style.transformOrigin = mp.piv[0] * P.k + 'px ' + mp.piv[1] * P.k + 'px';
        P.g.innerHTML = ''; P.g.appendChild(perna); P.g.appendChild(corpo); P.perna = perna;
      };
      a.pose = function (n) { if (a.atual === n || !a.poses[n]) return; if (a.atual) a.poses[a.atual].g.style.display = 'none'; a.poses[n].g.style.display = ''; a.atual = n };
      a.poe = function () { a.el.style.transform = 'translate(' + a.x + 'px,' + a.y + 'px) rotate(' + a.r + 'deg) scale(' + a.s * a.vira + ',' + a.s * a.sy + ')' };
      cena.appendChild(a.el);
      return a;
    }
    function atacante(pre) {
      /* pose do chute: a nova é o padrão; dá para voltar à antiga no painel */
      var a = ator(4), novo = M[pre + '_chute2'];
      a.add('costas', pre + '_costas', .484, 'meio'); a.add('preparo', pre + '_preparo', .4375); a.add('corrida', pre + '_corrida', .4375); a.add('chute', pre + (novo ? '_chute2' : '_chute'), novo ? .45 : .4375);
      a.add('comemora', pre + '_comemora', .461, 'meio'); a.add('lamenta', pre + '_lamenta', .37, 'meio');
      a.rig('chute', pre + (novo ? '_chute2' : '_chute'));
      return a;
    }
    function goleiro(pre) {
      var a = ator(2);
      a.add('base', pre + '_base', .241, 'meio'); a.add('voo', pre + '_voo_esq', .235, 'centro'); a.add('caido', pre + '_caido', .135, 'meio'); a.add('joelho', pre + '_joelho', .13, 'meio');
      return a;
    }
    var sombra = EA.el('i', 'pen-sombra'), bola = img(A.bola, 'pen-bola'), marcas = EA.el('div', 'pen-marcas'), cal = EA.el('i', 'pen-cal');
    cal.style.left = BOLA0.x + 'px'; cal.style.top = (BOLA0.y + 24 * BOLA0.s) + 'px';
    cena.appendChild(marcas); cena.appendChild(cal); cena.appendChild(sombra); cena.appendChild(bola);
    /* cada dupla já é de times opostos: atacante de branco contra goleiro listrado, e o contrário */
    var elenco = [{ jog: atacante('fut'), gol: goleiro('gol') }];
    if (duelo) elenco.push({ jog: atacante('fb'), gol: goleiro('gb') });
    elenco.forEach(function (e) { e.jog.el.style.display = 'none'; e.gol.el.style.display = 'none' });
    var J = null, K = null, respira = true, respJ = true, vivo = true, B = { x: 0, y: 0, r: 0, s: BOLA0.s, chao: BOLA0.y + 24 * BOLA0.s, o: 1 };
    function poeBola() {
      bola.style.transform = 'translate(' + (B.x - 27) + 'px,' + (B.y - 27) + 'px) rotate(' + B.r + 'deg) scale(' + B.s + ')'; bola.style.opacity = B.o;
      var alt = Math.max(0, B.chao - B.y - 24 * B.s), l = 40 * B.s * (1 + alt / 600);
      sombra.style.transform = 'translate(' + (B.x - l / 2) + 'px,' + (B.chao - 6 * B.s) + 'px)'; sombra.style.width = l + 'px'; sombra.style.height = 12 * B.s + 'px'; sombra.style.opacity = B.semSombra ? 0 : B.o * Math.max(.08, .42 - alt / 700);
    }

    /* ---------- sons do jogo: curtos, e a torcida em laço. Sem o som, cai no efeito de sempre ---------- */
    var buf = {}, somCx = null, torcida = null, LACO = [.3, 20.3];
    /* no HTML exportado o som vem embutido, e o fetch recusa esse endereço: lê direto */
    function bytesDe(u) {
      if (!/^data:/.test(u)) return fetch(u).then(function (r) { return r.arrayBuffer() });
      var b = atob(u.slice(u.indexOf(',') + 1)), a = new Uint8Array(b.length);
      for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
      return Promise.resolve(a.buffer);
    }
    function carregaSons() {
      if (ctx.estatico) return;
      somCx = EA.Som.contexto(); if (!somCx) return;
      ['som_chute', 'som_trave', 'som_apito', 'som_gol', 'som_vaia', 'som_torcida'].forEach(function (n) {
        if (!A[n]) return;
        bytesDe(EA.url(A[n])).then(function (b) { return somCx.decodeAudioData(b) }).then(function (d) {
          buf[n] = d; if (n === 'som_torcida') ligaTorcida();
        }).catch(function () { });
      });
    }
    function toca(nome, reserva, ganho) {
      if (buf[nome] && somCx && !EA.Som.mudo()) {
        if (somCx.state === 'suspended') somCx.resume();
        var o = somCx.createBufferSource(), g = somCx.createGain();
        o.buffer = buf[nome]; g.gain.value = (ganho || 1) * EA.Som.volume();
        o.connect(g); g.connect(somCx.destination); o.start();
      } else if (!buf[nome] && reserva) EA.Som.tocar(reserva);
    }
    /* só uma torcida por vez, mesmo recomeçando o jogo */
    function ligaTorcida() {
      if (torcida || !buf.som_torcida || !raiz.isConnected) return;
      if (EA.Quiz._torcidaPen) EA.Quiz._torcidaPen();
      if (somCx.state === 'suspended') somCx.resume();
      var o = somCx.createBufferSource(), g = somCx.createGain();
      o.buffer = buf.som_torcida; o.loop = true; o.loopStart = LACO[0]; o.loopEnd = LACO[1];
      g.gain.value = 0; o.connect(g); g.connect(somCx.destination); o.start(0, LACO[0]);
      g.gain.linearRampToValueAtTime(alvoTorcida(), somCx.currentTime + 1.2);
      torcida = { o: o, g: g, alvo: alvoTorcida() };
      EA.Quiz._torcidaPen = function () { paraTorcida(.15) };
    }
    function alvoTorcida() { return EA.Som.mudo() ? 0 : .8 * EA.Som.volume() }
    function paraTorcida(s) {
      if (!torcida) return;
      var t = torcida; torcida = null;
      t.g.gain.cancelScheduledValues(somCx.currentTime); t.g.gain.setValueAtTime(t.g.gain.value, somCx.currentTime);
      t.g.gain.linearRampToValueAtTime(0, somCx.currentTime + s);
      try { t.o.stop(somCx.currentTime + s + .05) } catch (e) { }
    }
    carregaSons();

    /* ---------- placar ---------- */
    var pontos = [], chutes = [[], []], gols = [0, 0], porTime = [Math.ceil(total / 2), Math.floor(total / 2)];
    function bolas(lista, n, agora) { var h = ''; for (var k = 0; k < n; k++) h += '<i class="' + (lista[k] === true ? 'ok' : lista[k] === false ? 'nao' : k === agora ? 'agora' : '') + '"></i>'; return h }
    function placar(i) {
      if (!duelo) { ePl.innerHTML = '<b>' + EA.esc(nomes[0]) + '</b><div class="pen-bolas">' + bolas(pontos, total, i) + '</div>'; return }
      var t = i >= 0 ? i % 2 : -1;
      ePl.innerHTML = '<div class="pen-t ' + (t === 0 ? 'vez' : '') + '"><b>' + EA.esc(nomes[0]) + '</b><div class="pen-bolas">' + bolas(chutes[0], porTime[0], t === 0 ? chutes[0].length : -1) + '</div></div><div class="pen-gols">' + gols[0] + '<u>X</u>' + gols[1] + '</div><div class="pen-t dir ' + (t === 1 ? 'vez' : '') + '"><b>' + EA.esc(nomes[1]) + '</b><div class="pen-bolas">' + bolas(chutes[1], porTime[1], t === 1 ? chutes[1].length : -1) + '</div></div>';
    }

    /* ---------- cantos: a alternativa diz para onde vai o chute ---------- */
    function cantos(n) {
      var e = 498, d = 780, alto = 352, baixo = 438, m = (alto + baixo) / 2;
      if (n <= 2) return [{ x: e, y: m }, { x: d, y: m }];
      if (n === 3) return [{ x: e, y: alto }, { x: e, y: baixo }, { x: d, y: m }];
      return [{ x: e, y: alto }, { x: e, y: baixo }, { x: d, y: alto }, { x: d, y: baixo }];
    }

    /* ---------- efeitos leves ---------- */
    function impactoChute() {
      var c = EA.el('i', 'pen-anel'); c.style.left = B.x + 'px'; c.style.top = B.y + 'px'; cena.appendChild(c);
      c.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: .8 }, { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 0 }], { duration: 240, easing: 'ease-out' }).onfinish = function () { c.remove() };
      for (var n = 0; n < 7; n++) (function () {
        var g = EA.el('i', 'pen-grama'), a = -Math.PI * (.15 + Math.random() * .7), d = 26 + Math.random() * 40;
        g.style.left = B.x + 'px'; g.style.top = B.y + 18 + 'px'; cena.appendChild(g);
        g.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * d + 'px,' + (Math.sin(a) * d + 22) + 'px) rotate(200deg)', opacity: 0 }], { duration: 300 + Math.random() * 160, easing: 'ease-out' }).onfinish = function () { g.remove() };
      })();
      cena.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,5px)' }, { transform: 'translate(2px,-2px)' }, { transform: 'none' }], { duration: 150 });
    }
    function poeira(x, y) {
      for (var n = 0; n < 6; n++) (function () {
        var g = EA.el('i', 'pen-poeira'), d = (Math.random() - .5) * 70;
        g.style.left = x + d * .4 + 'px'; g.style.top = y + 'px'; cena.appendChild(g);
        g.animate([{ transform: 'scale(.4)', opacity: .55 }, { transform: 'translate(' + d + 'px,-16px) scale(1.4)', opacity: 0 }], { duration: 420, easing: 'ease-out' }).onfinish = function () { g.remove() };
      })();
    }
    /* ---------- rede: uma caixa em perspectiva, com fundo, laterais e teto. Só o fundo se move, e só quando a bola entra. ---------- */
    var rede = (function () {
      var F = { e: GOL.esq + 9, d: GOL.dir - 9, c: GOL.trave + 8, b: GOL.chao - 1 }, T = { e: 448, d: 830, c: 322, b: 460 }, COL = 22, LIN = 8, W = COL + 1, H = LIN + 1, CX = (T.e + T.d) / 2, CY = (T.c + T.b) / 2;
      var cv = EA.el('canvas', 'pen-malha'), g = cv.getContext('2d'), est = document.createElement('canvas'), z = new Float32Array(W * H), v = new Float32Array(W * H);
      cv.width = EA.W; cv.height = 500; est.width = EA.W; est.height = 500;
      function no(c, l) { return l * W + c }
      function fios(ct, a, b, c, d, nu, nv) {   /* quadrilátero a-b em cima, d-c embaixo */
        var i, f;
        ct.beginPath();
        for (i = 0; i <= nu; i++) { f = i / nu; ct.moveTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); ct.lineTo(d[0] + (c[0] - d[0]) * f, d[1] + (c[1] - d[1]) * f) }
        for (i = 0; i <= nv; i++) { f = i / nv; ct.moveTo(a[0] + (d[0] - a[0]) * f, a[1] + (d[1] - a[1]) * f); ct.lineTo(b[0] + (c[0] - b[0]) * f, b[1] + (c[1] - b[1]) * f) }
        ct.stroke();
      }
      /* laterais e teto não mudam: ficam prontos */
      (function () {
        var c = est.getContext('2d'); c.lineWidth = 1; c.strokeStyle = 'rgba(238,244,250,.5)';
        fios(c, [F.e, F.c], [T.e, T.c], [T.e, T.b], [F.e, F.b], 4, LIN);
        fios(c, [T.d, T.c], [F.d, F.c], [F.d, F.b], [T.d, T.b], 4, LIN);
        c.strokeStyle = 'rgba(238,244,250,.42)';
        fios(c, [F.e, F.c], [F.d, F.c], [T.d, T.c], [T.e, T.c], COL, 3);
      })();
      function pos(c, l) {
        var zz = z[no(c, l)], x = T.e + (T.d - T.e) * c / COL, y = T.c + (T.b - T.c) * l / LIN, f = Math.min(.16, Math.max(-.05, zz * .0022));
        return { x: x + (CX - x) * f, y: y + (CY - y) * f + Math.max(0, zz) * .05 };
      }
      function desenha() {
        g.clearRect(0, 0, cv.width, cv.height); g.drawImage(est, 0, 0);
        g.lineWidth = 1; g.strokeStyle = 'rgba(240,246,252,.62)'; g.beginPath();
        var c, l, a, b;
        for (l = 0; l < H; l++) for (c = 0; c < W; c++) {
          a = pos(c, l);
          if (c < COL) { b = pos(c + 1, l); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y) }
          if (l < LIN) { b = pos(c, l + 1); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y) }
        }
        g.stroke();
      }
      desenha();
      var ant = 0, ativo = false;
      function passo() {
        var c, l, i, e = 0;
        for (l = 1; l < LIN; l++) for (c = 1; c < COL; c++) {
          i = no(c, l);
          v[i] += ((z[i - 1] + z[i + 1] + z[i - W] + z[i + W]) / 4 - z[i]) * .3 - z[i] * .05;
          v[i] *= .84;
        }
        for (i = 0; i < z.length; i++) { z[i] += v[i]; e += Math.abs(v[i]) + Math.abs(z[i]) * .05 }
        return e;
      }
      return {
        cv: cv,
        tique: function (t) {
          if (!ativo) { ant = t; return }
          var n = Math.max(1, Math.min(3, Math.round((t - ant) / 16.7))); ant = t;
          var e = 0; while (n--) e = passo();
          desenha();
          if (e < .6) { ativo = false; z.fill(0); v.fill(0); desenha() }
        },
        puxa: function (x, y, forca) {
          var cc = (x - T.e) / (T.d - T.e) * COL, ll = (y - T.c) / (T.b - T.c) * LIN, c, l, d;
          for (l = 1; l < LIN; l++) for (c = 1; c < COL; c++) { d = (c - cc) * (c - cc) + (l - ll) * (l - ll); v[no(c, l)] += forca * Math.exp(-d / 5) }
          ativo = true;
        },
        fundoEm: function (x, y) {
          var c = Math.max(1, Math.min(COL - 1, Math.round((x - T.e) / (T.d - T.e) * COL))), l = Math.max(1, Math.min(LIN - 1, Math.round((y - T.c) / (T.b - T.c) * LIN)));
          return { z: z[no(c, l)], v: v[no(c, l)], p: pos(c, l), x0: T.e + (T.d - T.e) * c / COL, y0: T.c + (T.b - T.c) * l / LIN };
        }
      };
    })();
    cena.insertBefore(rede.cv, cena.firstChild);

    /* ---------- laço: respiração e brilho da torcida ---------- */
    var cB = raiz.querySelector('.pen-brilho'), gB = cB.getContext('2d'), luzes = [], ult = 0;
    function brilhos(t) {
      var dt = Math.min(50, t - ult); ult = t;
      if (Math.random() < .2) {
        var lado = Math.random(), x = lado < .5 ? 20 + Math.random() * 360 : 900 + Math.random() * 360, y = 190 + Math.random() * 140;
        if (Math.random() < .25) { x = 380 + Math.random() * 520; y = 135 + Math.random() * 50 }
        luzes.push({ x: x, y: y, v: 0, d: 240 + Math.random() * 420, t: 1.2 + Math.random() * 2, c: Math.random() < .75 ? '#fff' : Math.random() < .5 ? '#bfe3ff' : '#ffe9b0' });
      }
      gB.clearRect(0, 0, 1280, 340);
      luzes = luzes.filter(function (l) {
        l.v += dt; if (l.v >= l.d) return false;
        var f = l.v / l.d, a = Math.sin(f * Math.PI), r = l.t * (.6 + a);
        gB.globalAlpha = a * .65; gB.fillStyle = l.c;
        gB.fillRect(l.x - r * 2.2, l.y - .5, r * 4.4, 1); gB.fillRect(l.x - .5, l.y - r * 2.2, 1, r * 4.4); gB.fillRect(l.x - r * .5, l.y - r * .5, r, r);
        return true;
      });
      gB.globalAlpha = 1;
    }
    function laco(t) {
      if (!raiz.isConnected) { paraTorcida(.2); return }
      if (!vivo) return;
      if (torcida && torcida.alvo !== alvoTorcida()) { torcida.alvo = alvoTorcida(); torcida.g.gain.setTargetAtTime(torcida.alvo, somCx.currentTime, .06) }
      brilhos(t); rede.tique(t);
      if (J && K) {
        var a = Math.sin(t / 620), b = Math.sin(t / 540 + 1.3);
        /* respiração só no corpo: estica a partir do chão, sem andar nem girar, e os pés ficam onde estão */
        if (respJ) { J.sy = 1 + a * .008; J.poe() }
        if (respira) { K.sy = 1 + b * .012; K.poe() }
      }
      requestAnimationFrame(laco);
    }

    /* ---------- bola ---------- */
    function voa(alvo, dir, dur, escFim) {
      var ini = { x: B.x, y: B.y, r: B.r, s: B.s }, chao0 = B.chao, giro = dir * (1500 + Math.random() * 500), curva = dir * (18 + Math.random() * 16), arco = 40 + Math.max(0, 500 - alvo.y) * .14;
      return tween(dur, function (e, f) {
        B.x = ini.x + (alvo.x - ini.x) * e + Math.sin(f * Math.PI) * curva;
        B.y = ini.y + (alvo.y - ini.y) * e - Math.sin(f * Math.PI) * arco;
        B.s = 1 / (1 / ini.s + (1 / escFim - 1 / ini.s) * e);
        B.r = ini.r + giro * f * (1 - f * .25);
        B.chao = chao0 + (GOL.chao - 4 - chao0) * e;
        poeBola();
      }, function (f) { return 1 - Math.pow(1 - f, 1.45) });
    }
    /* depois da pancada: gravidade, quiques perdendo força e, no chão, rola até parar.
       O chão acompanha a profundidade: bola vindo para a câmera fica maior e desce na tela. O texto do jogo não espera a bola, mas ela segue até parar */
    var vidaBola = 0, PROF = 364;
    function solta(vx, vy, chao, rest, dur, perto, giro, sumir) {
      var ant = performance.now(), ini = ant, v = { x: vx, y: vy, s: perto || 0 }, g = 1500, s0 = B.s, eu = ++vidaBola, avisou = false, RAIO = 25;
      B.chao = chao;
      return new Promise(function (ok) {
        (function p() {
          if (eu !== vidaBola || !raiz.isConnected) { ok(); return }
          var t = performance.now(), dt = Math.min(.04, (t - ant) / 1000); ant = t;
          v.y += g * dt; B.x += v.x * dt; B.y += v.y * dt;
          B.s = Math.max(.3, B.s + v.s * dt);
          var chaoAgora = chao + (B.s - s0) * PROF, pe = chaoAgora - RAIO * B.s, noChao = false;
          B.chao = chaoAgora;
          if (B.y >= pe) {
            B.y = pe;
            if (v.y > 70) { if (B.naRede && v.y > 220) rede.puxa(B.x, Math.min(B.y, 440), Math.min(3, v.y * .008)); v.y = -v.y * rest; v.x *= .82; v.s *= .82; giro *= .75 }
            else {
              noChao = true; v.y = 0;
              /* rolando: atrito constante e o giro casa com o caminho percorrido */
              var fr = Math.pow(.1, dt); v.x *= fr; v.s *= fr;
              giro = v.x / (RAIO * B.s) * 57.3;
              if (Math.abs(v.x) < 4 && Math.abs(v.s) < .006) { v.x = 0; v.s = 0; giro = 0 }
            }
          } else giro *= Math.pow(.6, dt);
          B.r += giro * dt;
          if (sumir) { B.o = Math.max(0, 1 - (t - ini - sumir) / 300) }
          poeBola();
          if (!avisou && t - ini >= dur) { avisou = true; ok() }
          var parou = noChao && !v.x && !v.s;
          if (parou || (sumir && B.o <= 0)) { if (!avisou) ok(); return }
          requestAnimationFrame(p);
        })();
      });
    }

    /* ---------- goleiro: agacha, salta em parábola, inclina conforme sobe e desce, cai, desliza, levanta num joelho ---------- */
    function salta(xAlvo, altura, dir, atraso) {
      var x0 = K.x, y0 = GOL.chao + 6, base = K.s;
      respira = false; K.sy = 1; K.r = 0;
      return espera(atraso).then(function () {
        return tween(95, function (e) { K.sy = 1 - .16 * e; K.poe() });
      }).then(function () {
        K.sy = 1; K.pose('voo'); K.vira = dir > 0 ? -1 : 1;
        var yC0 = y0 - 62, yC1 = y0 - 26;
        return tween(440, function (f) {
          K.x = x0 + (xAlvo - x0) * f;
          K.y = yC0 + (yC1 - yC0) * f - altura * 4 * f * (1 - f);
          /* nariz sobe no salto e desce na queda */
          K.r = dir * (-20 + 34 * f); K.poe();
        });
      }).then(function () {
        EA.Som.tocar('passo'); poeira(K.x, y0);
        K.pose('caido'); K.y = y0; K.r = 0; K.poe();
        var xC = K.x;
        return tween(300, function (e, f) {
          K.x = xC + dir * 38 * e;
          K.y = y0 - Math.sin(f * Math.PI) * 13 * (1 - f);
          K.sy = 1 - Math.sin(f * Math.PI) * .07; K.poe();
        }, function (f) { return 1 - Math.pow(1 - f, 2) });
      }).then(function () { return espera(420) }).then(function () {
        K.sy = 1; K.pose('joelho');
        return tween(340, function (e) { K.sy = .82 + .18 * e; K.y = y0 + (1 - e) * 5; K.poe() }, suave);
      });
    }

    /* ---------- atacante ---------- */
    var PE0 = { x: 350, y: 730 }, PE1 = { x: 597, y: 572, s: .72 };
    function corridaAte() {
      var i0 = performance.now(), pas = 0;
      respJ = false; J.sy = 1;
      return tween(560, function (e, f) {
        J.x = PE0.x + (PE1.x - 18 - PE0.x) * e;
        J.y = PE0.y + (PE1.y + 14 - PE0.y) * e - Math.abs(Math.sin(f * Math.PI * 3)) * 11;
        J.s = 1 + (PE1.s - 1) * e;
        J.r = Math.sin(f * Math.PI * 3) * 2;
        var n = Math.floor(f * 3); if (n !== pas) { pas = n; EA.Som.tocar('passo') }
        J.poe();
      }, function (f) { return f * f * (1.6 - .6 * f) });
    }
    /* preparo demorado subindo em diagonal, contato seco com uma pausa mínima, e a perna termina de subir num chicote curto.
       Quem dá o movimento é a troca de desenho: a articulação só arremata */
    function chute(aoBater) {
      var P = J.poses.chute, x0 = PE1.x - 18, y0 = PE1.y + 14;
      J.r = 0; J.s = PE1.s; J.sy = 1; J.pose('preparo'); J.x = x0; J.y = y0; J.poe();
      return tween(210, function (e) {
        J.x = x0 + 18 * e; J.y = y0 - 14 * e; J.r = -3 * e; J.poe();
      }, function (f) { return 1 - Math.pow(1 - f, 2) }).then(function () {
        J.pose('corrida'); J.x = PE1.x; J.y = PE1.y; J.r = 12; J.poe();   /* inclina para o pé descer até a bola */
        return espera(34);
      }).then(function () {
        aoBater();
        return espera(46);   /* o peso do chute: tudo segura por um instante */
      }).then(function () {
        J.pose('chute'); J.poe();
        return tween(150, function (e, f) {
          if (P && P.perna) P.perna.style.transform = 'rotate(' + 24 * (1 - e) + 'deg)';
          J.r = 8 * (1 - e); J.y = PE1.y - Math.sin(f * Math.PI) * 9; J.poe();
        }, function (f) { return 1 - Math.pow(1 - f, 3) });
      });
    }

    function alinha(i) {
      var t = duelo ? i % 2 : 0, e = elenco[t];
      elenco.forEach(function (x) { x.jog.el.style.display = 'none'; x.gol.el.style.display = 'none' });
      J = e.jog; K = e.gol; J.el.style.display = ''; K.el.style.display = '';
      J.pose('costas'); J.x = PE0.x; J.y = PE0.y; J.s = 1; J.r = 0; J.sy = 1; J.vira = 1; J.poe();
      K.pose('base'); K.x = GOL.meio; K.y = GOL.chao + 6; K.s = 1; K.r = 0; K.sy = 1; K.vira = 1; K.poe();
      var pe = J.poses.chute; if (pe && pe.perna) pe.perna.style.transform = '';
      vidaBola++; B.naRede = false; B.semSombra = false; B.x = BOLA0.x; B.y = BOLA0.y; B.r = 0; B.s = BOLA0.s; B.o = 1; B.chao = BOLA0.y + 24 * BOLA0.s; poeBola();
      ligaTorcida();
      return t;
    }
    var vez = 0;
    return {
      mostra: function (i, p) {
        vez = alinha(i);
        placar(i);
        /* 09/11: os textos do quiz são texto puro; escapados, "a < b" ou "<div>" aparecem como foram escritos */
        eP.innerHTML = (duelo ? '<small>Vez de ' + EA.esc(nomes[vez]) + '</small>' : '') + EA.esc(p.p || 'Escreva a pergunta');
        eE.className = 'pen-exp'; eE.innerHTML = '';
        var n = p.ops.length, meio = Math.ceil(n / 2), cs = cantos(n);
        function bt(o, k) { return '<button class="pen-op" data-k="' + k + '"><b>' + LETRAS[k] + '</b><span>' + EA.esc(o) + '</span></button>' }
        eL.innerHTML = p.ops.slice(0, meio).map(function (o, k) { return bt(o, k) }).join('');
        eD.innerHTML = p.ops.slice(meio).map(function (o, k) { return bt(o, k + meio) }).join('');
        marcas.innerHTML = cs.map(function (c, k) { return '<i data-m="' + k + '" style="left:' + c.x + 'px;top:' + c.y + 'px">' + LETRAS[k] + '</i>' }).join('');
        marcas.style.display = '';
        [].forEach.call(raiz.querySelectorAll('.pen-op'), function (b) {
          var m = marcas.querySelector('[data-m="' + b.dataset.k + '"]');
          b.onmouseenter = function () { if (m) m.classList.add('acesa') }; b.onmouseleave = function () { if (m) m.classList.remove('acesa') };
        });
        respira = true; respJ = true;
        if (!ctx.estatico) {
          [eP, eL, eD].forEach(function (x, k) { x.animate([{ opacity: 0, transform: 'translateY(' + (k ? 18 : -18) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: k * 90, fill: 'backwards', easing: 'cubic-bezier(.2,.8,.2,1)' }) });
          J.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
          if (ult === 0) { ult = performance.now(); requestAnimationFrame(laco) }
        }
      },
      responde: function (i, p, k) {
        var certo = k === p.certa, bs = raiz.querySelectorAll('.pen-op'), cs = cantos(p.ops.length), alvo = cs[k], dir = alvo.x < GOL.meio ? -1 : 1, alto = alvo.y < (GOL.trave + GOL.chao) / 2;
        [].forEach.call(bs, function (b) { b.disabled = true; var kk = +b.dataset.k; b.classList.add(kk === p.certa ? 'certa' : kk === k ? 'errada' : 'apagado') });
        EA.Som.tocar(certo ? 'certo' : 'errado');
        marcas.style.display = 'none';
        ligaTorcida(); toca('som_apito', null, .75);
        var saida = certo ? 'gol' : ['defesa', 'trave', 'fora'][Math.floor(Math.random() * 3)];
        pontos[i] = certo;
        var T = 520, fim, kAlto = alto ? 120 : 38;
        return espera(380).then(corridaAte).then(function () {
          fim = new Promise(function (acaba) {
            var voltaIdle = function () { J.pose('costas'); J.r = 0; J.sy = 1; J.poe(); respJ = true };
            chute(function () {
              toca('som_chute', 'golpe'); impactoChute();
              if (saida === 'gol') {
                /* o goleiro sempre erra: vai para o outro lado */
                var ladoK = -dir;
                salta(GOL.meio + ladoK * 210, 60 + Math.random() * 70, ladoK, 120);
                voa(alvo, dir, T, .56).then(function () {
                  /* a bola afunda na rede, a rede segura e devolve */
                  EA.Som.tocar('sumir'); B.naRede = true; rede.puxa(B.x, B.y, 19);
                  setTimeout(acaba, 90);
                  var bx = B.x, by = B.y, bs = B.s, br = B.r;
                  return tween(300, function (e, f) {
                    var n = rede.fundoEm(bx, by), fz = Math.max(0, n.z);
                    B.x = bx + (n.p.x - n.x0); B.y = by + (n.p.y - n.y0);
                    B.s = bs * (1 - Math.min(.3, fz * .0028)); B.r = br + dir * 380 * (1 - Math.pow(1 - f, 2));
                    poeBola();
                  }).then(function () {
                    return solta(-dir * 26, 90, GOL.chao - 8, .34, 900, .012, -dir * 220);
                  });
                }).then(acaba);
              } else if (saida === 'defesa') {
                /* a mão chega junto com a bola: em 60% do salto ele está no alvo */
                var xK = Math.max(GOL.esq + 70, Math.min(GOL.dir - 70, GOL.meio + (alvo.x - dir * 34 - GOL.meio) / .62));
                salta(xK, kAlto, dir, Math.max(0, T - 95 - 264));
                voa(alvo, dir, T, .56).then(function () {
                  EA.Som.tocar('dano');
                  return solta(dir * (120 + Math.random() * 60), -320, GOL.chao + 8, .46, 500, .17, dir * 900);
                }).then(acaba);
              } else if (saida === 'trave') {
                var naBarra = alto && Math.random() < .5, ponto = naBarra ? { x: alvo.x, y: GOL.trave + 6 } : { x: dir < 0 ? GOL.esq + 6 : GOL.dir - 6, y: alvo.y };
                salta(GOL.meio + dir * 190, kAlto, dir, 150);
                voa(ponto, dir, T - 30, .56).then(function () {
                  toca('som_trave', 'critico');
                  return solta(naBarra ? dir * 60 : dir * 105, naBarra ? 120 : -220, GOL.chao + 4, .5, 500, .2, -dir * 1100);
                }).then(acaba);
              } else {
                var pf = alto ? { x: alvo.x + dir * 40, y: GOL.trave - 70 } : { x: dir < 0 ? GOL.esq - 74 : GOL.dir + 74, y: alvo.y - 26 };
                salta(GOL.meio + dir * 190, kAlto, dir, 170);
                voa(pf, dir, T + 40, .5).then(function () {
                  /* segue o mesmo caminho, diminuindo, até sumir na arquibancada. Sem chão por perto, sem sombra */
                  var x0 = B.x, y0 = B.y, s0 = B.s, r0 = B.r, vx = (B.x - BOLA0.x) / Math.max(40, BOLA0.y - B.y), xF = x0 + vx * 90 + dir * 46, yF = y0 - (alto ? 92 : 78);
                  B.semSombra = true;
                  setTimeout(acaba, 330);
                  return tween(760, function (e, f) {
                    B.x = x0 + (xF - x0) * e; B.y = y0 + (yF - y0) * e; B.s = s0 + (.16 - s0) * e; B.r = r0 + dir * 620 * f;
                    B.o = f < .78 ? 1 : 1 - (f - .78) / .22; poeBola();
                  }, function (f) { return 1 - Math.pow(1 - f, 2) });
                }).then(acaba);
              }
            }).then(function () { return espera(190) }).then(voltaIdle);
          });
          return fim;
        }).then(function () {
          /* o atacante fica um instante parado antes de reagir */
          return espera(140);
        }).then(function () {
          respJ = false;
          if (duelo) { chutes[vez].push(certo); if (certo) gols[vez]++ }
          placar(-1);
          if (saida === 'gol') {
            toca('som_gol', 'nivel'); textoGrande(raiz, 'GOL!', 'bom'); EA.festa(raiz, EA.W / 2, 240, 160);
            J.pose('comemora');
          } else {
            textoGrande(raiz, saida === 'defesa' ? 'Defendeu!' : saida === 'trave' ? 'Na trave!' : 'Pra fora!', 'ruim');
            J.pose('lamenta');
          }
          J.r = 0; J.sy = 1; J.s = PE1.s; J.poe();
          /* a pose é de salto: sobe um pouco, freando, e para lá em cima */
          if (saida === 'gol') { var yS = J.y; tween(300, function (e) { J.y = yS - 34 * e; J.poe() }, function (f) { return 1 - Math.pow(1 - f, 3) }) }
          return espera(1100);
        }).then(function () {
          eE.innerHTML = '<b>' + (certo ? 'Isso!' : 'Resposta certa: ' + LETRAS[p.certa] + '.') + '</b> ' + EA.esc(p.exp || '') + '<span>Continuar →</span>';
          eE.className = 'pen-exp ver qp-exp ' + (certo ? 'bom' : 'ruim');
        });
      },
      fim: function (acertos, tot, res) {
        vivo = false; paraTorcida(res === 'perdeu' && !duelo ? 1.4 : 4);
        var ganhou = duelo ? true : res !== 'perdeu', timeVence = gols[0] === gols[1] ? -1 : gols[0] > gols[1] ? 0 : 1;
        placar(-1);
        [].forEach.call(raiz.querySelectorAll('.pen-perg,.pen-lado,.pen-exp,.pen-cena,.pen-brilho,.pen-farol'), function (x) { x.style.display = 'none' });
        var fundo = raiz.querySelector('.ia-fundo');
        if (duelo) {
          if (timeVence === 0) fundo.style.backgroundImage = 'url(' + EA.url(A.trofeu) + ')';
          else if (timeVence === 1 && A.fb_comemora) raiz.appendChild(img(A.fb_comemora, 'pen-triste'));
          fimIa(raiz, ganhou, acertos, tot, timeVence < 0 ? 'Empate!' : EA.esc(nomes[timeVence]) + ' venceu!', 'Jogar de novo', gols[0] + ' x ' + gols[1]);
          if (timeVence >= 0 && !ctx.estatico) climaFim(raiz, 'festa');
          return;
        }
        fundo.style.backgroundImage = 'url(' + EA.url(ganhou ? A.trofeu : A.fut_derrota) + ')';
        if (!ganhou) raiz.appendChild(img(A.fut_lamenta, 'pen-triste'));
        fimIa(raiz, ganhou, acertos, tot, ganhou ? 'Campeão!' : 'Fim de jogo', 'Jogar de novo');
        toca(ganhou ? 'som_gol' : 'som_vaia');
        if (!ctx.estatico) climaFim(raiz, ganhou ? 'festa' : 'chuva');
      }
    };
  }

  /* ---------- C4 vista de cima: cada fio sai da placa, sobe e volta ao detonador; cortar separa as duas metades ---------- */
  function bombaSvg(n, visor) {
    var CORES = ['#e23b34', '#2f86f0', '#f3c63a', '#2fbf6b'], s = '';
    [34, 214, 394].forEach(function (x) {
      s += '<rect x="' + x + '" y="118" width="172" height="330" rx="8" fill="#c7a26a" stroke="#2e2212" stroke-width="5"/>' +
        '<rect x="' + (x + 7) + '" y="125" width="14" height="316" rx="5" fill="#dcbd88"/><rect x="' + (x + 150) + '" y="125" width="15" height="316" rx="5" fill="#a98452"/>' +
        '<path d="M' + (x + 44) + ' 118 L' + (x + 86) + ' 158 L' + (x + 128) + ' 118 M' + (x + 44) + ' 448 L' + (x + 86) + ' 408 L' + (x + 128) + ' 448" fill="none" stroke="#a07c4b" stroke-width="3"/>' +
        '<path d="M' + (x + 30) + ' 300 h28 M' + (x + 118) + ' 260 h24 M' + (x + 110) + ' 420 h30" stroke="#a98452" stroke-width="2.5"/>';
    });
    [[168, 40], [386, 44]].forEach(function (f) {
      s += '<rect x="20" y="' + f[0] + '" width="568" height="' + f[1] + '" rx="4" fill="#23262b" stroke="#0c0d10" stroke-width="4"/>' +
        '<path d="M40 ' + (f[0] + 9) + ' L118 ' + (f[0] + 16) + ' L205 ' + (f[0] + 7) + ' L330 ' + (f[0] + 18) + ' L452 ' + (f[0] + 8) + ' L570 ' + (f[0] + 14) + '" fill="none" stroke="#565b63" stroke-width="3"/>' +
        '<path d="M60 ' + (f[0] + 30) + ' L180 ' + (f[0] + 25) + ' L300 ' + (f[0] + 31) + ' L440 ' + (f[0] + 26) + ' L560 ' + (f[0] + 31) + '" fill="none" stroke="#3b3f46" stroke-width="3"/>';
    });
    s += '<rect x="136" y="194" width="336" height="222" rx="8" fill="#14663c" stroke="#08240f" stroke-width="5"/>' +
      '<path d="M150 216 H238 V240 M150 232 H208 V300 H150 M150 396 H250 V372 M262 404 V356 M286 404 V372 H300 M150 340 H190 V372 H150 M150 356 H172" fill="none" stroke="#3ccf80" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<g fill="#e4c357"><circle cx="150" cy="216" r="4"/><circle cx="150" cy="232" r="4"/><circle cx="150" cy="300" r="4"/><circle cx="150" cy="340" r="4"/><circle cx="150" cy="356" r="4"/><circle cx="150" cy="372" r="4"/><circle cx="150" cy="396" r="4"/><circle cx="262" cy="404" r="4"/><circle cx="286" cy="404" r="4"/></g>' +
      '<rect x="166" y="318" width="60" height="42" rx="2" fill="#15171a" stroke="#000" stroke-width="2"/><path d="M172 318 v-6 M184 318 v-6 M196 318 v-6 M208 318 v-6 M220 318 v-6 M172 360 v6 M184 360 v6 M196 360 v6 M208 360 v6 M220 360 v6" stroke="#c8ccd2" stroke-width="3"/>' +
      '<circle cx="256" cy="340" r="15" fill="#2a2f5e" stroke="#0e1030" stroke-width="3"/><circle cx="256" cy="340" r="6" fill="#4b53a4"/>';
    s += '<rect x="160" y="212" width="170" height="74" rx="6" fill="#0a0d0c" stroke="#000" stroke-width="4"/><rect x="168" y="220" width="154" height="58" rx="3" fill="#08230f"/>' +
      '<text class="bo-visor" x="245" y="266" text-anchor="middle">' + (visor || '--:--') + '</text>';
    s += '<rect x="340" y="206" width="122" height="198" rx="8" fill="#1c1f24" stroke="#000" stroke-width="4"/>';
    for (var l = 0, d = 1; l < 4; l++) for (var c = 0; c < 3; c++) {
      var txt = l < 3 ? d++ : ['*', '0', '#'][c], x = 350 + c * 35, y = 216 + l * 46;
      s += '<g class="bo-tecla"><rect x="' + x + '" y="' + y + '" width="31" height="40" rx="5"/><text x="' + (x + 15.5) + '" y="' + (y + 27) + '" text-anchor="middle">' + txt + '</text></g>';
    }
    s += '<circle class="bo-led" cx="294" cy="310" r="9"/><circle cx="294" cy="372" r="9" fill="#24402e" stroke="#0a1a10" stroke-width="2"/>';
    var vao = n > 1 ? n - 1 : 1;
    for (var k = 0; k < n; k++) {
      var tx = n > 1 ? 196 + k * (216 / vao) : 304, dx = n > 1 ? 104 + k * (400 / vao) : 304, topo = 8 + (k % 2) * 20, meio = (tx + dx) / 2, cor = CORES[k % 4];
      var a = 'M' + tx + ' 196 C' + tx + ' 120 ' + (tx + (meio - tx) * .25) + ' ' + topo + ' ' + meio + ' ' + topo, b = 'M' + meio + ' ' + topo + ' C' + (dx - (dx - meio) * .25) + ' ' + topo + ' ' + dx + ' 72 ' + dx + ' 116';
      s += '<g class="bo-fio" data-x="' + meio + '" data-y="' + topo + '" data-tx="' + tx + '" data-dx="' + dx + '">' +
        '<g class="m1"><path d="' + a + '" fill="none" stroke="#0a0a0c" stroke-width="12" stroke-linecap="round"/><path d="' + a + '" fill="none" stroke="' + cor + '" stroke-width="7" stroke-linecap="round"/></g>' +
        '<g class="m2"><path d="' + b + '" fill="none" stroke="#0a0a0c" stroke-width="12" stroke-linecap="round"/><path d="' + b + '" fill="none" stroke="' + cor + '" stroke-width="7" stroke-linecap="round"/></g></g>' +
        '<rect x="' + (tx - 9) + '" y="190" width="18" height="16" rx="2" fill="#d4d7dc" stroke="#222" stroke-width="2.5"/>' +
        '<rect x="' + (dx - 9) + '" y="108" width="18" height="34" rx="3" fill="#b3b8bf" stroke="#222" stroke-width="3"/><rect x="' + (dx - 9) + '" y="126" width="18" height="6" fill="#d8413b"/>';
    }
    return '<svg class="bomba" viewBox="0 -8 608 470"><ellipse cx="304" cy="450" rx="290" ry="14" fill="rgba(0,0,0,.35)"/>' + s + '</svg>';
  }
  /* alicate de corte: duas metades que giram no pino; a boca fica no ponto (0,0) */
  function alicateSvg() {
    function metade(c, sinal) {
      return '<g class="ali-b ' + c + '"><path d="M0 0 L' + (10 * sinal) + ' 4 L' + (22 * sinal) + ' 46 L' + (6 * sinal) + ' 56 Z" fill="#aab1ba" stroke="#15171a" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M' + (8 * sinal) + ' 54 C' + (30 * sinal) + ' 78 ' + (30 * sinal) + ' 130 ' + (44 * sinal) + ' 210 L' + (22 * sinal) + ' 214 C' + (8 * sinal) + ' 140 ' + (-2 * sinal) + ' 96 ' + (-6 * sinal) + ' 66 Z" fill="#d9362e" stroke="#15171a" stroke-width="4" stroke-linejoin="round"/></g>';
    }
    return '<svg viewBox="-70 -14 140 240" width="140" height="240" style="overflow:visible;display:block;margin:0 0 0 -70px">' + metade('a', 1) + metade('b', -1) + '<circle cx="0" cy="52" r="9" fill="#dfe3e8" stroke="#15171a" stroke-width="3.5"/></svg>';
  }
  /* a arminha do placar de eliminação: desenho nosso */
  var ARMINHA = '<svg viewBox="0 0 64 26"><path fill="#fff" d="M1 7h35l3-4h9v4h15v5H46l-5 3h-6l-3 10h-9l3-10h-6l-6 5H5l3-8H1z"/></svg>';

  /* mancha na parede: uma por tiro que atravessa, jogada para o lado de trás */
  function manchaParede(w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; c.className = 'tat-mancha';
    var g = c.getContext('2d'), cx = w * .3, cy = h * .42, k, a, d;
    function r(a, b) { return a + Math.random() * (b - a) }
    ['#5e0a11', '#84101a'].forEach(function (cor, e) {
      g.fillStyle = cor;
      for (k = 0; k < 16; k++) { a = r(-1, 1); d = r(0, w * (e ? .14 : .2)); g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r(8, 26) * (e ? .7 : 1), r(6, 20) * (e ? .7 : 1), a, 0, 6.3); g.fill() }
    });
    g.fillStyle = '#6d0c14';
    for (k = 0; k < 90; k++) { a = r(-.9, .9); d = r(w * .14, w * .68); var t = r(1, 5.5) * (1 - d / w * .8); g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .9, t * 1.7, t, a, 0, 6.3); g.fill() }
    g.strokeStyle = '#650b13'; g.lineCap = 'round';
    for (k = 0; k < 7; k++) { var x = cx + r(-w * .1, w * .24), y = cy + r(-4, h * .1); g.lineWidth = r(2, 5); g.beginPath(); g.moveTo(x, y); g.lineTo(x + r(-3, 3), y + r(h * .12, h * .46)); g.stroke() }
    return c;
  }
  /* sangue na tela, no mesmo traço suave do jogo */
  function sangueTela() {
    var c = document.createElement('canvas'); c.width = 640; c.height = 360; c.className = 'tat-sangue';
    var g = c.getContext('2d'), k;
    function r(a, b) { return a + Math.random() * (b - a) }
    var v = g.createRadialGradient(320, 180, 110, 320, 180, 390); v.addColorStop(0, 'rgba(90,5,12,0)'); v.addColorStop(1, 'rgba(90,5,12,.82)');
    g.fillStyle = v; g.fillRect(0, 0, 640, 360);
    for (k = 0; k < 11; k++) {
      var e = k % 4, cx = e === 0 ? r(0, 70) : e === 1 ? r(570, 640) : r(30, 610), cy = e === 2 ? r(0, 36) : e === 3 ? r(318, 360) : r(10, 350), t = r(9, 26), i;
      g.fillStyle = k % 2 ? '#6d0a13' : '#8d101b';
      for (i = 0; i < 7; i++) { g.beginPath(); g.ellipse(cx + r(-t, t) * .8, cy + r(-t, t) * .55, r(t * .22, t * .55), r(t * .15, t * .42), r(0, 3.1), 0, 6.3); g.fill() }
      /* respingos finos em volta */
      for (i = 0; i < 26; i++) { var a = r(0, 6.3), d = r(t * .9, t * 3); g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r(.5, 2.1), 0, 6.3); g.fill() }
      g.strokeStyle = '#7a0d17'; g.lineCap = 'round';
      for (i = 0; i < 2; i++) { var x = cx + r(-t, t) * .7; g.lineWidth = r(1, 2.6); g.beginPath(); g.moveTo(x, cy); g.lineTo(x, cy + r(14, 60)); g.stroke() }
    }
    return c;
  }

  /* ---------- missão tática ---------- */
  /* x e pe: onde o inimigo pisa em cada lugar. parede: onde o sangue suja quando ele está encostado numa */
  var LUGARES_TAT = [
    { c: 'tat_cena1', x: 745, pe: 560, h: 270, parede: { x: 790, y: 250, w: 190, h: 190 } },
    { c: 'tat_cena2', x: 730, pe: 572, h: 285, parede: null },
    { c: 'tat_cena3', x: 740, pe: 548, h: 300, parede: null },
    { c: 'tat_cena4', x: 760, pe: 525, h: 320, parede: { x: 810, y: 260, w: 190, h: 190 } }
  ];
  /* a arma: gx,gy é o canto da imagem; a ponta do cano e o pivô (na empunhadura) são lidos do desenho */
  /* a pose agachada disparando: altura e ponta do cano em relação à altura do terrorista em pé */
  var TIRO_AG = { h: .74, dx: -.215, dy: .543 };
  var ARMA = { gx: 630, gy: 335, w: 800, h: 437, ponta: [.303, .107], pivo: [.62, .85], descanso: { r: -8, x: 26, y: 50 } };
  function montaTatico(raiz, q, ctx) {
    var A = q.arte, total = q.perguntas.length;
    var combate = Math.min(total, Math.max(q.nBomba === 0 ? 1 : 0, q.nTerr == null ? Math.min(4, Math.ceil(total / 2)) : q.nTerr));
    var nomeA = q.nomeA || 'Minha equipe', tempo = q.tempo == null ? 20 : q.tempo, relogio = null, cortados = 0, eliminados = 0, turno = 0;
    raiz.className = 'quiz quiz-ia quiz-tat';
    raiz.innerHTML = '<div class="ia-fundo"></div><div class="tat-cena"></div><div class="tat-feed"></div><img class="tat-braco" alt=""><div class="tat-card"><div class="tat-tela"><div class="tat-rot"></div><div class="tat-p"></div><div class="tat-ops"></div><div class="tat-exp"></div></div></div><div class="tat-escuro"></div><div class="ia-flash"></div>';
    var fundo = raiz.querySelector('.ia-fundo'), cena = raiz.querySelector('.tat-cena'), feed = raiz.querySelector('.tat-feed'), eR = raiz.querySelector('.tat-rot'), eP = raiz.querySelector('.tat-p'), eO = raiz.querySelector('.tat-ops'), eE = raiz.querySelector('.tat-exp'), card = raiz.querySelector('.tat-card'), braco = raiz.querySelector('.tat-braco'), escuro = raiz.querySelector('.tat-escuro'), flash = raiz.querySelector('.ia-flash');
    braco.src = EA.url(A.tat_tablet);
    var ordemFios = null, ordemTeclas = null, uniformes = {}, uniforme = '', ultimoUni = null, rival = null, arma = null, bracoArma = null, bomba = null, rosto = null, alicate = null, lugar = null, agachado = false;
    /* ---------- sons: os efeitos próprios deste jogo, e a música e o vento em laço, bem baixos. Sem o arquivo, cai no efeito de sempre ---------- */
    /* 09/11: os sons decodificados ficam guardados no próprio quiz: jogar de novo não decodifica tudo outra vez */
    var somBuf = raiz._somTat || (raiz._somTat = {}), desmontado = false, somCx = null, fundos = {}, baixoFundo = 1, vigiaFundo = null, GANHO_FUNDO = { som_t_musica: .34, som_t_vento: .3 };
    function bytesSom(u) {
      if (!/^data:/.test(u)) return fetch(u).then(function (r) { return r.arrayBuffer() });
      var b = atob(u.slice(u.indexOf(',') + 1)), a = new Uint8Array(b.length);
      for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
      return Promise.resolve(a.buffer);
    }
    function carregaSons() {
      if (ctx.estatico) return;
      somCx = EA.Som.contexto(); if (!somCx) return;
      Object.keys(A).filter(function (n) { return /^som_t_/.test(n) }).forEach(function (n) {
        (somBuf[n] ? Promise.resolve(somBuf[n]) : bytesSom(EA.url(A[n])).then(function (b) { return somCx.decodeAudioData(b) })).then(function (d) {
          somBuf[n] = d; if (GANHO_FUNDO[n]) ligaFundo(n);
        }).catch(function () { });
      });
    }
    function som(nome, reserva, ganho, atraso) {
      if (!somBuf[nome] || !somCx) { if (reserva) EA.Som.tocar(reserva); return }
      if (EA.Som.mudo()) return;
      if (somCx.state === 'suspended') somCx.resume();
      var o = somCx.createBufferSource(), g = somCx.createGain();
      o.buffer = somBuf[nome]; g.gain.value = (ganho || 1) * EA.Som.volume() * 1.6;
      o.connect(g); g.connect(somCx.destination); o.start(somCx.currentTime + (atraso || 0));
    }
    function alvoFundo(n) { return EA.Som.mudo() ? 0 : GANHO_FUNDO[n] * EA.Som.volume() * baixoFundo }
    /* uma música só, mesmo recomeçando; a sobra de .3 s nas pontas evita o clique do MP3 no laço */
    function ligaFundo(n) {
      if (fundos[n] || desmontado || !raiz.isConnected) return;
      EA.Quiz._fundosTat = EA.Quiz._fundosTat || {};
      if (EA.Quiz._fundosTat[n]) EA.Quiz._fundosTat[n]();
      if (somCx.state === 'suspended') somCx.resume();
      var o = somCx.createBufferSource(), g = somCx.createGain(), d = somBuf[n];
      o.buffer = d; o.loop = true; o.loopStart = .3; o.loopEnd = d.duration - .3;
      g.gain.value = 0; o.connect(g); g.connect(somCx.destination); o.start(0, .3);
      g.gain.linearRampToValueAtTime(alvoFundo(n), somCx.currentTime + 2);
      fundos[n] = { o: o, g: g, alvo: alvoFundo(n) };
      EA.Quiz._fundosTat[n] = function () { paraFundo(n, .15) };
      if (!vigiaFundo) vigiaFundo = setInterval(function () {
        if (!raiz.isConnected) { Object.keys(fundos).forEach(function (k) { paraFundo(k, .2) }); clearInterval(vigiaFundo); vigiaFundo = null; return }
        Object.keys(fundos).forEach(function (k) { ajustaFundo(k, .25) });
      }, 300);
    }
    function ajustaFundo(n, s) {
      var f = fundos[n], a = alvoFundo(n); if (!f || f.alvo === a) return;
      f.alvo = a; f.g.gain.setTargetAtTime(a, somCx.currentTime, s);
    }
    function paraFundo(n, s) {
      var f = fundos[n]; if (!f) return; delete fundos[n];
      f.g.gain.cancelScheduledValues(somCx.currentTime); f.g.gain.setValueAtTime(f.g.gain.value, somCx.currentTime);
      f.g.gain.linearRampToValueAtTime(0, somCx.currentTime + s);
      try { f.o.stop(somCx.currentTime + s + .05) } catch (e) { }
    }
    function abaixaFundo(v) { baixoFundo = v; Object.keys(fundos).forEach(function (n) { ajustaFundo(n, .05) }) }
    carregaSons();
    function pisca(cor, f) { flash.style.background = cor; flash.animate([{ opacity: f || .6 }, { opacity: 0 }], { duration: 320 }) }
    function para() { if (relogio) { clearInterval(relogio); relogio = null } }
    /* o placar de eliminação: quem elimina fica à esquerda, a arminha no meio; aparece devagar */
    function mataFeed(a, clsA, b, clsB) {
      feed.innerHTML = '';
      var d = EA.el('div', '', '<b class="' + clsA + '">' + EA.esc(a) + '</b>' + ARMINHA + '<b class="' + clsB + '">' + EA.esc(b) + '</b>');
      feed.appendChild(d); d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
    }
    function pontoArma(p) {
      var px = ARMA.w * ARMA.pivo[0], py = ARMA.h * ARMA.pivo[1], dx = ARMA.w * p[0] - px, dy = ARMA.h * p[1] - py, a = (lugar ? lugar.rotArma || 0 : 0) * Math.PI / 180;
      return { x: ARMA.gx + px + dx * Math.cos(a) - dy * Math.sin(a), y: ARMA.gy + py + dx * Math.sin(a) + dy * Math.cos(a) };
    }
    /* o clarão sai da ponta do cano e fica atrás da arma */
    function clarao(x, y, tam, ang) {
      var f = EA.el('div', 'tat-disparo', '<svg viewBox="-50 -50 100 100"><defs><radialGradient id="tatF"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffe9a0"/><stop offset=".7" stop-color="#ff9a3c"/><stop offset="1" stop-color="#ff5a1e" stop-opacity=".2"/></radialGradient></defs><path fill="url(#tatF)" d="M0 -50 L9 -13 L38 -30 L17 -3 L50 4 L15 10 L27 38 L3 16 L-8 46 L-10 15 L-38 28 L-17 3 L-50 -6 L-15 -9 L-30 -36 L-6 -14Z"/></svg>');
      f.style.cssText = 'left:' + (x - tam / 2) + 'px;top:' + (y - tam / 2) + 'px;width:' + tam + 'px;height:' + tam + 'px;rotate:' + ang + 'deg';
      cena.appendChild(f);
      f.animate([{ opacity: 1, transform: 'scale(.55)' }, { opacity: 1, transform: 'scale(1.1)', offset: .4 }, { opacity: 0, transform: 'scale(1.2)' }], { duration: 95 }).onfinish = function () { f.remove() };
    }
    function umTiro() {
      if (!arma) return;
      som('som_t_tiro' + (1 + Math.floor(Math.random() * 3)), 'tiro');
      som('som_t_capsula', null, .55, .34 + Math.random() * .1);
      var p = pontoArma(ARMA.ponta);
      clarao(p.x, p.y, 170, Math.random() * 360);
      arma.animate([{ translate: '0 0' }, { translate: '16px 12px', offset: .22 }, { translate: '0 0' }], { duration: 150, easing: 'ease-out' });
      cena.animate([{ transform: 'none' }, { transform: 'translate(2px,3px)', offset: .3 }, { transform: 'none' }], { duration: 120 });
    }
    /* um ou dois tiros, ao acaso */
    function rajada() {
      var n = Math.random() < .5 ? 1 : 2, r = Promise.resolve();
      for (var k = 0; k < n; k++) r = r.then(function () { umTiro(); return espera(130) });
      return r;
    }
    function poeRival(src) {
      var h = lugar.h * (agachado ? .72 : 1);
      rival.style.left = lugar.x + 'px'; rival.style.top = (lugar.pe - h) + 'px'; rival.style.height = h + 'px';
      if (src) rival.src = EA.url(src);
    }
    function poeArma(r, x, y) { if (!arma) return; arma.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg)' }
    /* o giro que faz o cano apontar para o peito do inimigo */
    function miraArma() {
      var px = ARMA.gx + ARMA.w * ARMA.pivo[0], py = ARMA.gy + ARMA.h * ARMA.pivo[1], h = lugar.h * (agachado ? .72 : 1);
      var alvo = Math.atan2(lugar.pe - h * .7 - py, lugar.x - px), base = Math.atan2(ARMA.h * (ARMA.ponta[1] - ARMA.pivo[1]), ARMA.w * (ARMA.ponta[0] - ARMA.pivo[0]));
      var d = (alvo - base) * 180 / Math.PI;
      return Math.max(-14, Math.min(14, d));
    }
    function sobeArma() {
      var D = ARMA.descanso, R = lugar.rotArma;
      bracoArma.style.visibility = '';
      som('som_t_empunha');
      bracoArma.animate([{ transform: 'translate(-150px,300px)' }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
      return tween(340, function (e) { poeArma(D.r + (R - D.r) * e, D.x * (1 - e), D.y * (1 - e)) }, function (f) { return 1 - Math.pow(1 - f, 3) });
    }
    function desceArma() {
      if (!arma || bracoArma.style.visibility === 'hidden') return;
      var D = ARMA.descanso, R = lugar.rotArma, b = bracoArma;
      b.animate([{ transform: 'none' }, { transform: 'translate(-150px,300px)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' }).onfinish = function () { b.style.visibility = 'hidden' };
      tween(340, function (e) { poeArma(R + (D.r - R) * e, D.x * e, D.y * e) }, function (f) { return f * f * (3 - 2 * f) });
    }
    function pose(n) { return A['riv_' + n + uniforme] || A['riv_' + n] }
    function sorteiaUniforme(i) {
      if (uniformes[i] == null) {
        var op = ['', '_b', '_c'].filter(function (u) { return u !== ultimoUni });
        uniformes[i] = ultimoUni = op[Math.floor(Math.random() * op.length)];
      }
      uniforme = uniformes[i];
      ['parado', 'agachado', 'tiro', 'atingido', 'caido'].forEach(function (n) { if (pose(n)) new Image().src = EA.url(pose(n)) });
    }
    function faseCombate(i, volta) {
      lugar = LUGARES_TAT[i % LUGARES_TAT.length];
      fundo.style.backgroundImage = 'url(' + EA.url(A[lugar.c]) + ')';
      agachado = i % 2 === 1;
      raiz.classList.remove('bomba'); card.className = 'tat-card'; braco.style.display = '';
      sorteiaUniforme(i);
      rival = img(pose(agachado ? 'agachado' : 'parado'), 'tat-rival'); poeRival();
      if (!ctx.estatico) rival.classList.add('idle');
      arma = EA.el('div', 'tat-arma'); arma.style.cssText = 'left:' + ARMA.gx + 'px;top:' + ARMA.gy + 'px;width:' + ARMA.w + 'px;height:' + ARMA.h + 'px;transform-origin:' + ARMA.pivo[0] * 100 + '% ' + ARMA.pivo[1] * 100 + '%';
      bracoArma = img(A.tat_arma_braco, 'tat-arma-b'); bracoArma.style.visibility = 'hidden'; arma.appendChild(bracoArma);
      arma.appendChild(img(A.tat_arma, ''));
      lugar.rotArma = miraArma(); poeArma(ARMA.descanso.r, ARMA.descanso.x, ARMA.descanso.y);
      cena.appendChild(rival); cena.appendChild(arma);
      if (!ctx.estatico && !volta) {
        rival.animate([{ transform: 'translateX(70px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.3,.7,.2,1)' });
      }
    }
    var ALVO_C4 = { x: 626, y: 318, w: 478 };
    function pontoC4(x, y) { var s = ALVO_C4.w / 608; return { x: ALVO_C4.x + x * s, y: ALVO_C4.y + (y + 8) * s } }
    function trocaRosto(nome) {
      if (!rosto || rosto.dataset.n === nome) return;
      rosto.dataset.n = nome; rosto.src = EA.url(A[nome]);
      if (!ctx.estatico) rosto.animate([{ transform: 'translateY(6px) scale(.985)', opacity: .55 }, { transform: 'none', opacity: 1 }], { duration: 180 });
    }
    function faseBomba(nFios, cara) {
      fundo.style.backgroundImage = 'url(' + EA.url(A.tat_chao) + ')';
      raiz.classList.add('bomba'); card.className = 'tat-card lado'; braco.style.display = 'none';
      var cima = EA.el('div', 'tb-cima'); cima.style.backgroundImage = 'url(' + EA.url(A.tat_cena3) + ')';
      rosto = img(A[cara], 'tb-rosto'); rosto.dataset.n = cara; cima.appendChild(rosto);
      cena.appendChild(cima); cena.appendChild(EA.el('div', 'tb-traco'));
      bomba = EA.el('div', 'tb-c4', bombaSvg(nFios)); bomba.style.cssText = 'left:' + ALVO_C4.x + 'px;top:' + ALVO_C4.y + 'px;width:' + ALVO_C4.w + 'px';
      cena.appendChild(bomba);
      if (!ordemFios) { ordemFios = []; for (var n = 0; n < nFios; n++) ordemFios.splice(Math.floor(Math.random() * (n + 1)), 0, n) }
      var fios = bomba.querySelectorAll('.bo-fio'); ordemFios.slice(0, cortados).forEach(function (n) { abreFio(fios[n], 1) });
      if (!ordemTeclas) { ordemTeclas = []; for (var t = 0; t < 12; t++) ordemTeclas.splice(Math.floor(Math.random() * (t + 1)), 0, t) }
      acendeTeclas();
      alicate = EA.el('div', 'tb-ali', alicateSvg()); cena.appendChild(alicate); poeAlicate(1240, 800, -36, 18);
      ['tat_tenso', 'tat_frustrado', 'tat_retrato'].forEach(function (n) { new Image().src = EA.url(A[n]) });
    }
    function acendeTeclas() {
      var teclas = bomba.querySelectorAll('.bo-tecla');
      ordemTeclas.slice(0, cortados * 3).forEach(function (j) { teclas[j].classList.add('acesa') });
    }
    function abreFio(f, e) {
      var y = +f.dataset.y, tx = +f.dataset.tx, dx = +f.dataset.dx;
      f.querySelector('.m1').setAttribute('transform', 'rotate(' + (tx <= dx ? -15 : 15) * e + ' ' + tx + ' 196)');
      f.querySelector('.m2').setAttribute('transform', 'rotate(' + (tx <= dx ? 15 : -15) * e + ' ' + dx + ' 116)');
      f.classList.toggle('cortado', e >= 1); void y;
    }
    function poeAlicate(x, y, ang, abre) {
      if (!alicate) return;
      alicate.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + ang + 'deg)';
      alicate.querySelector('.a').setAttribute('transform', 'rotate(' + (-abre) + ' 0 52)');
      alicate.querySelector('.b').setAttribute('transform', 'rotate(' + abre + ' 0 52)');
    }
    /* o alicate vai até o fio devagar, abre, hesita e fecha */
    function corta(fio) {
      var alvo = pontoC4(+fio.dataset.x, +fio.dataset.y);
      som('som_t_abre', null, .9, .42);
      return tween(720, function (e) { poeAlicate(1240 + (alvo.x - 1240) * e, 800 + (alvo.y - 800) * e, -36 + 8 * e, 18) }, function (f) { return 1 - Math.pow(1 - f, 3) }).then(function () {
        return espera(260);
      }).then(function () {
        return tween(90, function (e) { poeAlicate(alvo.x, alvo.y, -28, 18 * (1 - e)) });
      }).then(function () {
        som('som_t_corte', 'critico');
        EA.fxSolto(cena, 'impacts/blunt-hit', alvo.x, alvo.y, 90);
        cena.animate([{ transform: 'translate(0,2px)' }, { transform: 'none' }], { duration: 90 });
        return tween(130, function (e) { abreFio(fio, e) });
      }).then(function () { fio.classList.add('cortado') });
    }
    function tiraAlicate() {
      var m = alicate.style.transform.match(/translate\(([-\d.]+)px, ?([-\d.]+)px/), x0 = +m[1], y0 = +m[2];
      tween(480, function (e) { poeAlicate(x0 + (1240 - x0) * e, y0 + (800 - y0) * e, -28 - 8 * e, 18 * e) }, function (f) { return f * f });
    }
    function contagem(i, p) {
      para();
      var visor = bomba && bomba.querySelector('.bo-visor'); if (!visor) return;
      if (!tempo || ctx.estatico) { visor.textContent = tempo ? '00:' + ('0' + tempo).slice(-2) : '--:--'; return }
      var ate = performance.now() + tempo * 1000, avisado = -1;
      function pinta() {
        var s = Math.max(0, (ate - performance.now()) / 1000), t = Math.ceil(s);
        visor.textContent = '00:' + ('0' + t).slice(-2);
        if (t !== avisado && t > 0) {
          avisado = t; som('som_t_bip', t <= 5 ? 'clique' : null, t <= 5 ? .85 : .22);
          if (t <= 5) { som('som_t_bip', null, .6, .16); visor.classList.add('urgente'); trocaRosto('tat_tenso') }
        }
        if (s <= 0) {
          para();
          if (!raiz.isConnected) return;
          /* acabou o tempo: conta como escolher errado */
          var errado = [].find.call(eO.querySelectorAll('[data-k]'), function (x) { return +x.dataset.k !== p.certa });
          if (errado) errado.click();
        }
      }
      pinta(); relogio = setInterval(pinta, 200);
    }
    /* a bomba explode: corta para o mapa visto de muito longe */
    function explosao() {
      var el = EA.el('div', 'tat-boom'); el.style.backgroundImage = 'url(' + EA.url(A.tat_cena5) + ')';
      var c = document.createElement('canvas'); c.width = 1280; c.height = 720; el.appendChild(c); raiz.insertBefore(el, escuro);
      var g = c.getContext('2d'), X = 640, Y = 400, ini = performance.now(), fumo = [], cacos = [], k;
      function r(a, b) { return a + Math.random() * (b - a) }
      for (k = 0; k < 34; k++) { var a1 = r(0, 6.3); fumo.push({ a: a1, v: r(60, 230), t: r(26, 70), d: r(0, .22), c: r(45, 95) }) }
      for (k = 0; k < 46; k++) { var a2 = r(0, 6.3); cacos.push({ vx: Math.cos(a2) * r(120, 520), vy: Math.sin(a2) * r(120, 460) - 160, s: r(2, 6) }) }
      abaixaFundo(.12);
      som('som_t_explosao', 'explosao', 1.15); pisca('#fff4c8', 1);
      el.animate([{ transform: 'scale(1.32)' }, { transform: 'scale(1.03)' }], { duration: 1500, easing: 'cubic-bezier(.15,.8,.2,1)', fill: 'forwards' });
      c.animate([{ transform: 'translate(-12px,8px)' }, { transform: 'translate(10px,-8px)' }, { transform: 'translate(-7px,-5px)' }, { transform: 'translate(6px,5px)' }, { transform: 'none' }], { duration: 480 });
      return tween(1700, function (e, f) {
        var t = f * 1.7;
        g.clearRect(0, 0, 1280, 720);
        fumo.forEach(function (p) {
          var u = Math.max(0, t - p.d); if (!u) return;
          var R = p.t * (1 + u * 1.5), d = p.v * Math.sqrt(u);
          g.fillStyle = 'rgba(' + p.c + ',' + (p.c - 4) + ',' + (p.c - 10) + ',' + Math.min(.82, u * 4) * (1 - u / 3) + ')';
          g.beginPath(); g.arc(X + Math.cos(p.a) * d, Y + Math.sin(p.a) * d * .72 - u * 46, R, 0, 6.3); g.fill();
        });
        var rf = 250 * (1 - Math.pow(1 - Math.min(1, t / .42), 3)), af = t < .5 ? 1 : Math.max(0, 1 - (t - .5) / .75);
        if (af > 0) {
          var bola = g.createRadialGradient(X, Y, 0, X, Y, Math.max(1, rf));
          bola.addColorStop(0, 'rgba(255,255,235,' + af + ')'); bola.addColorStop(.38, 'rgba(255,214,90,' + af + ')'); bola.addColorStop(.72, 'rgba(255,110,30,' + af * .92 + ')'); bola.addColorStop(1, 'rgba(160,30,10,0)');
          g.fillStyle = bola; g.beginPath(); g.arc(X, Y, rf, 0, 6.3); g.fill();
        }
        if (t < .8) { g.strokeStyle = 'rgba(255,255,255,' + (1 - t / .8) * .7 + ')'; g.lineWidth = 7 * (1 - t / .8) + 1; g.beginPath(); g.ellipse(X, Y, t * 880, t * 620, 0, 0, 6.3); g.stroke() }
        g.fillStyle = '#26190f';
        cacos.forEach(function (p) { g.fillRect(X + p.vx * t, Y + p.vy * t + 300 * t * t, p.s, p.s) });
      }).then(function () { return el });
    }
    /* mesma regra do jogo de tiro: a tela apaga, fica só o aviso e a mesma pergunta volta */
    function telaTentar(i, p, titulo, sub, extras) {
      return new Promise(function (fim) {
        var f = EA.el('div', 'tat-fimmorte', '<h2>' + titulo + '</h2><p>' + sub + '</p><button class="ui-botao claro">Tentar de novo</button>'), b = f.querySelector('button');
        raiz.appendChild(f);
        f.animate([{ transform: 'translate(-50%,-44%)', opacity: 0 }, { transform: 'translate(-50%,-50%)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          f.remove(); extras.forEach(function (x) { if (x) x.remove() });
          escuro.classList.remove('on'); cena.style.transform = '';
          abaixaFundo(1);
          mostra(i, p, true);
          fim('repete');
        });
        b.focus();
      });
    }
    function tabletBaixo(s) { if (card.classList.contains('baixo') !== s && !raiz.classList.contains('bomba')) som(s ? 'som_t_desce' : 'som_t_sobe'); card.classList.toggle('baixo', s); braco.classList.toggle('baixo', s) }
    function morreJogador(i, p) {
      /* o inimigo atira, o sangue vem, a mão esquerda sobe, a arma fica à direita e tudo cai devagar */
      var mao = null, sangue = sangueTela();
      rival.animate([{ transform: 'none' }, { transform: 'translateX(-10px)', offset: .3 }, { transform: 'none' }], { duration: 170, iterations: 2 });
      if (agachado && pose('tiro')) { rival.style.height = lugar.h * TIRO_AG.h + 'px'; rival.style.top = (lugar.pe - lugar.h * TIRO_AG.h) + 'px'; rival.src = EA.url(pose('tiro')) }
      var cano = agachado ? { x: lugar.x + lugar.h * TIRO_AG.dx, y: lugar.pe - lugar.h * TIRO_AG.dy } : { x: lugar.x - lugar.h * .11, y: lugar.pe - lugar.h * .735 };
      function tiroNele() { som('som_t_rival' + (1 + Math.floor(Math.random() * 2)), 'tiro'); clarao(cano.x, cano.y, lugar.h * .24, Math.random() * 360) }
      tiroNele();
      return espera(170).then(function () { tiroNele(); return espera(120) }).then(function () {
        abaixaFundo(.2);
        som('som_t_dano', 'dano', 1.1); pisca('#ff2d3d', .7);
        raiz.insertBefore(sangue, feed);
        sangue.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 });
        mataFeed('Terrorist', 'b', nomeA, 'a');
        cena.animate([{ transform: 'translate(-14px,7px)' }, { transform: 'translate(12px,-6px)' }, { transform: 'none' }], { duration: 280 });
        mao = img(A.tat_mao, 'tat-mao'); cena.appendChild(mao);
        return tween(300, function (e) { mao.style.transform = 'translateY(' + (420 * (1 - e)) + 'px) rotate(' + (10 * e) + 'deg)' }, function (f) { return 1 - Math.pow(1 - f, 3) });
      }).then(function () { return espera(460) }).then(function () {
        /* cai suavemente: as duas mãos descem e a visão acompanha o corpo */
        som('som_t_queda');
        return tween(1250, function (e) {
          mao.style.transform = 'translate(' + (-60 * e) + 'px,' + (520 * e) + 'px) rotate(' + (10 - 24 * e) + 'deg)';
          poeArma(ARMA.descanso.r + 24 * e, ARMA.descanso.x + 70 * e, ARMA.descanso.y + 430 * e);
          cena.style.transform = 'translateY(' + (e * -40) + 'px) rotate(' + (e * 4) + 'deg) scale(' + (1 + e * .06) + ')';
          fundo.style.transform = cena.style.transform;
        }, function (f) { return f * f * (3 - 2 * f) });
      }).then(function () {
        escuro.classList.add('on');
        return espera(620);
      }).then(function () {
        fundo.style.transform = '';
        return telaTentar(i, p, 'Você morreu', 'A mesma pergunta volta.', [sangue]);
      });
    }
    function mostra(i, p, volta) {
      turno = i; para();
      cena.innerHTML = ''; feed.innerHTML = ''; rival = arma = bomba = rosto = alicate = null; fundo.style.transform = ''; cena.style.transform = '';
      var eBomba = i >= combate, nFios = total - combate;
      eR.textContent = eBomba ? 'DESARME · FIO ' + (i - combate + 1) + ' DE ' + nFios : 'RODADA ' + (i + 1) + ' DE ' + combate;
      /* 09/11: os textos do quiz são texto puro; escapados, "a < b" ou "<div>" aparecem como foram escritos */
      eP.innerHTML = EA.esc(p.p || 'Escreva a pergunta');
      eP.classList.toggle('longa', (p.p || '').length > 90);
      eO.innerHTML = p.ops.map(function (o, k) { return '<button class="tat-op" data-k="' + k + '"><b>' + LETRAS[k] + '</b><span>' + EA.esc(o) + '</span></button>' }).join('');
      eE.className = 'tat-exp'; eE.innerHTML = ''; card.classList.remove('resp');
      if (eBomba) { faseBomba(nFios, volta ? 'tat_frustrado' : 'tat_tenso'); contagem(i, p); if (volta && !ctx.estatico) setTimeout(function () { trocaRosto('tat_tenso') }, 1100) } else faseCombate(i, volta);
      tabletBaixo(false);
      if (!ctx.estatico && !volta) {
        fundo.animate([{ opacity: .2 }, { opacity: 1 }], { duration: 500 });
        if (eBomba) card.animate([{ transform: 'translateX(-60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
        else [card, braco].forEach(function (e) { e.animate([{ translate: '0 520px' }, { translate: '0 0' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }) });
      }
    }
    return {
      /* 09/11: ao recomeçar, a partida antiga para o relógio da bomba e o vigia do som (antes sobrava um por partida) */
      desmonta: function () { desmontado = true; para(); if (vigiaFundo) { clearInterval(vigiaFundo); vigiaFundo = null } },
      mostra: function (i, p) { mostra(i, p, false) },
      responde: function (i, p, k) {
        para();
        var certo = k === p.certa, eBomba = i >= combate, b = eO.querySelector('[data-k="' + k + '"]');
        som('som_t_toque', 'clique');
        [].forEach.call(eO.children, function (x) { x.disabled = true });
        function mostraExp() {
          eE.innerHTML = '<b>' + (certo ? 'Certo!' : 'Resposta certa: ' + LETRAS[p.certa] + '.') + '</b> ' + EA.esc(p.exp || '') + '<span>Continuar →</span>';
          eE.className = 'tat-exp ver rpg-exp'; card.classList.add('resp');
          tabletBaixo(false); desceArma();
        }
        if (eBomba) {
          /* a resposta só se revela depois do corte: até lá, é a mesma tensão */
          [].forEach.call(eO.children, function (x) { if (x !== b) x.classList.add('apagado') });
          b.classList.add('escolha');
          trocaRosto('tat_tenso');
          var fio = bomba.querySelectorAll('.bo-fio')[ordemFios[cortados]];
          return corta(fio).then(function () { return espera(certo ? 360 : 220) }).then(function () {
            b.classList.remove('escolha'); b.classList.add(certo ? 'certa' : 'errada');
            if (certo) {
              cortados++;
              som('som_t_desarmado', 'certo');
              acendeTeclas();
              var v = bomba.querySelector('.bo-visor'); v.classList.remove('urgente');
              bomba.querySelector('.bo-led').classList.add('ok');
              trocaRosto('tat_retrato'); tiraAlicate();
              return espera(620).then(mostraExp);
            }
            som('som_t_errado', 'errado');
            return espera(120).then(explosao).then(function (el) {
              escuro.classList.add('on');
              return espera(620).then(function () { return telaTentar(i, p, 'A bomba explodiu', 'A mesma pergunta volta.', [el]) });
            });
          });
        }
        if (rival) rival.classList.remove('idle');
        /* errando, nada aponta a certa: a pergunta vai voltar */
        [].forEach.call(eO.children, function (x) { if (x !== b) x.classList.add('apagado') });
        b.classList.add(certo ? 'certa' : 'errada');
        som(certo ? 'som_t_certo' : 'som_t_errado', certo ? 'certo' : 'errado');
        return espera(300).then(function () {
          tabletBaixo(true);
          /* a mão esquerda larga o tablet e vai para a arma */
          if (certo) return sobeArma();
          return espera(360);
        }).then(function () {
          if (!certo) return morreJogador(i, p);
          return rajada().then(function () {
            eliminados++;
            if (lugar.parede) {
              var pa = lugar.parede, m = manchaParede(pa.w, pa.h);
              m.style.left = pa.x + 'px'; m.style.top = pa.y + 'px';
              cena.insertBefore(m, rival);
              m.animate([{ transform: 'scale(.35)', opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 90, easing: 'ease-out' });
            }
            som('som_t_impacto', 'dano');
            rival.src = EA.url(pose('atingido'));
            mataFeed(nomeA, 'a', 'Terrorist', 'b');
            return espera(420);
          }).then(function () {
            agachado = false;
            rival.src = EA.url(pose('caido')); rival.classList.add('caido');
            rival.style.left = lugar.x + 'px'; rival.style.height = lugar.h * .28 + 'px'; rival.style.top = (lugar.pe - lugar.h * .25) + 'px';
            rival.animate([{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'ease-in' });
            som('som_t_corpo', 'sumir');
            return espera(620);
          }).then(mostraExp);
        });
      },
      fim: function (acertos, tot) {
        para();
        paraFundo('som_t_musica', 2.4);
        card.style.display = 'none'; braco.style.display = 'none'; cena.innerHTML = ''; feed.innerHTML = ''; raiz.classList.remove('bomba');
        fundo.style.backgroundImage = 'url(' + EA.url(A.tat_cena3) + ')';
        var pct = tot ? Math.round(acertos / tot * 100) : 0;
        function cena2() {
          if (!raiz.isConnected || !mvp) return;
          var el = mvp; mvp = null; clearTimeout(tempoMvp);
          el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380 }).onfinish = function () { el.remove() };
          fundo.classList.remove('escurecido');
          var par = EA.el('div', 'mvp-par');
          par.appendChild(img(A.tat_vitoria, 'mvp-soldado'));
          var c = EA.el('div', 'mvp-card', '<div class="fita"><b>' + acertos + '/' + tot + '</b><small>ACERTOS</small><b>' + eliminados + '</b><small>ELIMINADOS</small><b>' + pct + '%</b><small>PRECISÃO</small></div><div class="foto"></div><h3>' + EA.esc(nomeA) + '</h3><hr><em>O protagonista</em><span>Pela melhor participação</span>');
          c.querySelector('.foto').style.backgroundImage = 'url(' + EA.url(A.tat_retrato) + ')';
          par.appendChild(c); cena.appendChild(par);
          par.animate([{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
          fimIa(raiz, true, acertos, tot, 'Missão cumprida!', 'Tentar de novo');
        }
        /* o banner: atrás do painel uma bala em câmera lenta deixa o rastro branco e para */
        fundo.classList.add('escurecido');
        var mvp = EA.el('div', 'mvp', '<div class="mvp-topo"><i>»</i>BOMBA DESARMADA<i>«</i></div><div class="mvp-faixa"><div class="sil"></div><div class="rastro"></div><div class="bala"></div><div class="hud"><div class="foto"></div><div class="txt"><u>MVP da missão</u><hr><b>' + EA.esc(nomeA) + '</b></div></div><svg class="as" viewBox="0 0 100 140"><rect x="3" y="3" width="94" height="134" rx="10" fill="rgba(226,235,245,.55)"/><text x="16" y="32" font-size="24" font-weight="700" fill="#16506f" font-family="Arial,sans-serif">A</text><path fill="#f4f7fa" d="M50 44 C60 60 76 68 76 84 C76 96 60 98 54 88 C54 96 56 102 62 106 H38 C44 102 46 96 46 88 C40 98 24 96 24 84 C24 68 40 60 50 44Z"/></svg></div>');
        mvp.querySelector('.foto').style.backgroundImage = 'url(' + EA.url(A.tat_retrato) + ')';
        var sil = mvp.querySelector('.sil');
        [['tat_mirando', 170, 230], ['tat_correndo', 340, 180], ['riv_agachado', 950, 170], ['tat_ajoelhado', 1120, 210]].forEach(function (s) { var e = img(A[s[0]], ''); e.style.left = s[1] + 'px'; e.style.height = s[2] + 'px'; sil.appendChild(e) });
        var gran = img(A.tat_retrato, 'mvp-grande'); mvp.appendChild(gran);
        cena.appendChild(mvp);
        if (ctx.estatico) return;
        EA.Som.tocar('vitoria'); som('som_t_bala');
        var hud = mvp.querySelector('.hud'), rastro = mvp.querySelector('.rastro'), bala = mvp.querySelector('.bala');
        mvp.querySelector('.mvp-topo').animate([{ opacity: 0, transform: 'translate(-50%,-14px)' }, { opacity: 1, transform: 'translate(-50%,0)' }], { duration: 360, fill: 'both' });
        mvp.querySelector('.mvp-faixa').animate([{ opacity: 0, transform: 'scaleY(.2)' }, { opacity: 1, transform: 'none' }], { duration: 360, fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)' });
        hud.animate([{ opacity: 0, transform: 'translateX(-18px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 500, fill: 'both' });
        gran.animate([{ translate: '-50% 120px', opacity: 0 }, { translate: '-50% 0', opacity: 1 }], { duration: 560, delay: 240, fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)' });
        tween(3300, function (e) {
          var x = -60 + 1120 * e;
          bala.style.left = x + 'px'; rastro.style.width = Math.max(0, x + 40) + 'px';
        }, function (f) { return 1 - Math.pow(1 - f, 2.6) });
        var tempoMvp = setTimeout(cena2, 4300);
        mvp.addEventListener('click', function (e) { e.stopPropagation(); cena2() });
      }
    };
  }
  EA.Quiz.MONTA.penalti = montaPenalti;
  EA.Quiz.MONTA.tatico = montaTatico;
})();
