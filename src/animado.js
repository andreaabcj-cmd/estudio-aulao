/* 16/11: Exportar animado — o slide atual (ou os slides escolhidos, em ordem) vira GIF ou MP4 com as animações tocando
   na ordem da aba Animação (entradas, interativos, trocas, transição entre slides).
   Como funciona: uma apresentação escondida toca os slides; o relógio é nosso (cada animação fica parada e a gente anda ela
   quadro a quadro; os temporizadores da página — setTimeout, setInterval, requestAnimationFrame, performance.now — também
   andam por esse relógio enquanto grava), e cada quadro vira uma foto pelo mesmo caminho do "Exportar imagem".
   Assim o vídeo sai liso e no tempo certo mesmo que a foto demore, sem pedir para gravar a tela.
   Limite: vídeo e câmera dentro do slide não seguem esse relógio (a câmera nem liga na exportação).
   Bibliotecas (MIT, em assets/vendor, carregadas só na hora): mp4-muxer (monta o MP4) e gifenc (monta o GIF). */
(function () {
  var EA = window.EA;
  /* os de verdade, guardados antes de qualquer troca: as esperas da própria gravação não podem andar pelo relógio virtual */
  var stReal = window.setTimeout.bind(window);
  var carregadas = {};
  function carrega(src) {
    if (!carregadas[src]) carregadas[src] = new Promise(function (ok, erro) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { delete carregadas[src]; erro(new Error('não carregou ' + src)) };
      document.head.appendChild(s);
    });
    return carregadas[src];
  }
  var espera = function (ms) { return new Promise(function (ok) { stReal(ok, ms) }) };

  /* "1, 2, 3", "2, 5, 6", "2-5", "2 - 5", "2 a 5" → índices 0..n-1, em ordem, sem repetir.
     O intervalo é cortado em 1..n antes de andar (antes, "1-999999999999" travava a aba) */
  function lerSlides(txt, n) {
    var l = [], ruim = false;
    String(txt || '').replace(/\s*([-–a])\s*/g, '$1').split(/[,;\s]+/).filter(Boolean).forEach(function (p) {
      var m = p.match(/^(\d+)(?:[-–a](\d+))?$/);
      if (!m) { ruim = true; return }
      var a = +m[1], b = m[2] ? +m[2] : a; if (a > b) { var t = a; a = b; b = t }
      if (a < 1 || b > n) ruim = true;
      a = Math.max(1, a); b = Math.min(n, b);
      for (var k = a; k <= b; k++) if (l.indexOf(k - 1) < 0) l.push(k - 1);
    });
    l.sort(function (x, y) { return x - y });
    return { lista: l, ruim: ruim };
  }
  /* tamanho do arquivo: "lado" é o lado maior (slide em pé fica em pé, sem passar do tamanho escolhido) */
  function medidas(dim, lado) {
    var f = lado / Math.max(dim.w, dim.h);
    return { w: Math.round(dim.w * f / 2) * 2, h: Math.round(dim.h * f / 2) * 2 };
  }

  /* ---------- relógio virtual: enquanto grava, os temporizadores da página andam pelo tempo do vídeo ---------- */
  function relogioVirtual() {
    var W = window, orig = { st: W.setTimeout, ct: W.clearTimeout, si: W.setInterval, ci: W.clearInterval, raf: W.requestAnimationFrame, caf: W.cancelAnimationFrame },
      base = performance.now(), agora = 0, fila = [], quadros = [], id = 1e9, nosso = function (i) { return typeof i === 'number' && i > 1e9 };
    function agenda(fn, ms, args, rep) { var t = { id: ++id, fn: fn, args: args, ms: Math.max(0, +ms || 0), rep: rep }; t.quando = agora + t.ms; fila.push(t); return t.id }
    function tira(i) {
      for (var k = 0; k < fila.length; k++) if (fila[k].id === i) { fila.splice(k, 1); return }
      for (k = 0; k < quadros.length; k++) if (quadros[k].id === i) { quadros.splice(k, 1); return }
    }
    W.setTimeout = function (fn, ms) { if (typeof fn !== 'function') return orig.st.apply(W, arguments); return agenda(fn, ms, [].slice.call(arguments, 2), false) };
    W.setInterval = function (fn, ms) { if (typeof fn !== 'function') return orig.si.apply(W, arguments); return agenda(fn, ms, [].slice.call(arguments, 2), true) };
    W.clearTimeout = W.clearInterval = function (i) { if (nosso(i)) tira(i); else orig.ct.call(W, i) };
    W.requestAnimationFrame = function (fn) { var q = { id: ++id, fn: fn }; quadros.push(q); return q.id };
    W.cancelAnimationFrame = function (i) { if (nosso(i)) tira(i); else orig.caf.call(W, i) };
    Object.defineProperty(performance, 'now', { configurable: true, writable: true, value: function () { return base + agora } });
    return {
      /* roda, em ordem, o que vence até "ate" (as promessas de cada um andam antes do seguinte); depois os quadros pedidos */
      anda: function (ate) {
        var guarda = 0;
        function um() {
          var prox = null; fila.forEach(function (t) { if (t.quando <= ate && (!prox || t.quando < prox.quando)) prox = t });
          if (!prox || guarda++ > 3000) {
            agora = Math.max(agora, ate);
            var qs = quadros; quadros = [];
            qs.forEach(function (q) { try { q.fn(base + agora) } catch (e) { console.error(e) } });
            return Promise.resolve();
          }
          agora = Math.max(agora, prox.quando);
          if (prox.rep) prox.quando += Math.max(4, prox.ms); else fila.splice(fila.indexOf(prox), 1);
          try { prox.fn.apply(W, prox.args) } catch (e) { console.error(e) }
          return Promise.resolve().then(um);
        }
        return um();
      },
      /* algo está para acontecer logo (temporizador de uma vez vencendo na janela, ou quadro pedido)? */
      pendente: function (janela) { return quadros.length > 0 || fila.some(function (t) { return !t.rep && t.quando <= agora + janela }) },
      /* devolve os temporizadores de verdade; o que ficou na fila continua, no tempo que faltava */
      solta: function () {
        W.setTimeout = orig.st; W.clearTimeout = orig.ct; W.setInterval = orig.si; W.clearInterval = orig.ci; W.requestAnimationFrame = orig.raf; W.cancelAnimationFrame = orig.caf;
        delete performance.now;
        var f = fila, qs = quadros; fila = []; quadros = [];
        f.forEach(function (t) { var resta = Math.max(0, t.quando - agora); if (t.rep) orig.st.call(W, function () { orig.si.apply(W, [t.fn, t.ms].concat(t.args)); t.fn.apply(W, t.args) }, resta); else orig.st.apply(W, [t.fn, resta].concat(t.args)) });
        qs.forEach(function (q) { orig.raf.call(W, q.fn) });
      }
    };
  }

  /* ---------- gravadores ---------- */
  function gravadorGif(w, h, fps) {
    var G = window.gifenc, gif = G.GIFEncoder(), pend = null, tempo = 0, feito = 0, ms = 1000 / fps;
    /* quadro igual ao anterior só aumenta o tempo dele (GIF bem menor nas pausas). O GIF guarda centésimos de segundo:
       o tempo de cada quadro sai do relógio exato acumulado, para o GIF não ficar mais lento que o MP4 */
    function solta() { if (!pend) return; var d = Math.round(pend.fim / 10) * 10 - feito; feito += d; gif.writeFrame(pend.ix, w, h, { palette: pend.pal, delay: d }); pend = null }
    return {
      pronto: null,
      quadro: function (cv, mesmo) {
        tempo += ms;
        if (pend && mesmo) { pend.fim = tempo; return }
        var d = cv.getContext('2d').getImageData(0, 0, w, h).data;
        if (pend && pend.px.length === d.length) { var igual = true; for (var k = 0; k < d.length; k += 4) if (d[k] !== pend.px[k] || d[k + 1] !== pend.px[k + 1] || d[k + 2] !== pend.px[k + 2]) { igual = false; break } if (igual) { pend.fim = tempo; return } }
        solta();
        var pal = G.quantize(d, 256), ix = G.applyPalette(d, pal);
        pend = { ix: ix, pal: pal, fim: tempo, px: d };
      },
      fim: function () { solta(); gif.finish(); return Promise.resolve(new Blob([gif.bytes()], { type: 'image/gif' })) },
      fecha: function () { }
    };
  }
  function gravadorMp4(w, h, fps) {
    var M = window.Mp4Muxer, alvo = new M.ArrayBufferTarget(), erro = null, n = 0;
    var mux = new M.Muxer({ target: alvo, video: { codec: 'avc', width: w, height: h, frameRate: fps }, fastStart: 'in-memory' });
    var enc = new VideoEncoder({ output: function (c, m) { mux.addVideoChunk(c, m) }, error: function (e) { erro = e } });
    var cfg = { codec: w * h > 1280 * 720 ? 'avc1.640028' : 'avc1.42001f', width: w, height: h, bitrate: w * h > 1280 * 720 ? 8e6 : 4e6, framerate: fps };
    return {
      /* plano B de codec também é conferido: se nenhum servir, a mensagem já diz o que fazer */
      pronto: VideoEncoder.isConfigSupported(cfg).then(function (r) {
        if (r.supported) return;
        cfg.codec = 'avc1.640033';
        return VideoEncoder.isConfigSupported(cfg).then(function (r2) { if (!r2.supported) throw new Error('Este navegador não grava MP4 neste tamanho. Escolha um tamanho menor ou GIF.') });
      }).then(function () { enc.configure(cfg) }),
      quadro: function (cv) {
        if (erro) throw erro;
        var f = new VideoFrame(cv, { timestamp: Math.round(n * 1e6 / fps), duration: Math.round(1e6 / fps) });
        enc.encode(f, { keyFrame: n % (fps * 2) === 0 }); f.close(); n++;
        /* não deixa a fila do codificador crescer sem fim */
        return enc.encodeQueueSize > 8 ? new Promise(function (ok) { (function v() { if (enc.encodeQueueSize <= 2) ok(); else stReal(v, 5) })() }) : null;
      },
      fim: function () { return enc.flush().then(function () { if (erro) throw erro; mux.finalize(); return new Blob([alvo.buffer], { type: 'video/mp4' }) }) },
      /* o codificador é recurso limitado (às vezes da placa): sempre fechado no fim, com sucesso, erro ou cancelamento */
      fecha: function () { try { if (enc.state !== 'closed') enc.close() } catch (e) { } }
    };
  }

  /* ---------- a gravação ----------
     op = { formato: 'gif'|'mp4', slides: [índices], lado: lado maior em px, pausa: s, fps, sinal: { cancelado } }
     aviso(seg, k, t, fracao): andamento (segundos de vídeo, slide k de t, quanto do slide já foi) */
  EA.gravaAnimado = function (op, aviso) {
    var P = EA.projetoAtual, slides = op.slides, fps = op.formato === 'gif' ? (op.fps || 15) : (op.fps || 30), passoMs = 1000 / fps, sinal = op.sinal || {};
    if (op.formato !== 'gif' && !window.VideoEncoder) return Promise.reject(new Error('Este navegador não grava MP4. Use o Chrome ou o Edge, ou escolha GIF.'));
    var dim0 = EA.dimSlide(P.slides[slides[0]]), md = medidas(dim0, op.lado || op.largura || 1280), W = md.w, H = md.h;
    var libs = op.formato === 'gif' ? carrega('assets/vendor/gifenc.js') : carrega('assets/vendor/mp4-muxer.js');
    var fora = EA.el('div'), pl = null, rec = null, rel = null, T = 0, total = 0, falhas = 0, fracao = 0, parte = 0;
    /* escondida, mas "na tela" (as peças que esperam aparecer na tela precisam disso) */
    fora.style.cssText = 'position:fixed;left:0;top:0;width:' + dim0.w + 'px;height:' + dim0.h + 'px;opacity:0;pointer-events:none;z-index:-5;overflow:hidden';
    document.body.appendChild(fora);
    var mudoAntes = EA.Som.mudo(); EA.Som.mudo(true);
    var nascidas = new WeakMap(), mexeu = true, mexeuPasso = false, obs = new MutationObserver(function () { mexeu = true; mexeuPasso = true });
    var cache = {}, ultimo = null, cvSaida = document.createElement('canvas'); cvSaida.width = W; cvSaida.height = H;
    var ctx = cvSaida.getContext('2d', op.formato === 'gif' ? { willReadFrequently: true } : undefined);
    function cancela() { return Promise.reject(new Error('cancelado')) }
    function palco() { return pl.palco() }
    /* o relógio das animações: cada animação nova fica parada e anda conforme T; as que chegam ao fim terminam de verdade (as promessas andam) */
    function prende() {
      var vivas = 0, as = palco().getAnimations ? palco().getAnimations({ subtree: true }) : [];
      as.forEach(function (a) {
        var n = nascidas.get(a);
        if (!n) { n = { t0: T, c0: a.currentTime || 0, fim: false }; nascidas.set(a, n) }
        if (n.fim) return;
        var tm = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {}, alvo = n.c0 + (T - n.t0) * (a.playbackRate || 1);
        if (isFinite(tm.endTime) && alvo >= tm.endTime) { n.fim = true; try { a.finish() } catch (e) { } return }
        try { a.pause(); a.currentTime = alvo } catch (e) { }
        if (isFinite(tm.endTime)) vivas++; else vivas += .001;   /* repetição sem fim conta como "mexendo", mas não segura o passo */
      });
      return vivas;
    }
    /* foto do palco; { cv, nova }: nova = false quando nada mudou e o quadro anterior serve */
    function foto() {
      var precisa = mexeu || !ultimo || [].some.call(palco().getAnimations ? palco().getAnimations({ subtree: true }) : [], function (a) { var n = nascidas.get(a); return n && !n.fim });
      mexeu = false;
      if (!precisa) return Promise.resolve({ cv: ultimo, nova: false });
      var s = P.slides[pl.indice()], d = EA.dimSlide(s || P.slides[slides[0]]);
      return EA.imagemDoPalco(palco(), d, { escala: Math.min(W / d.w, H / d.h), cache: cache, canvas: true, apresenta: true }).then(function (c) { ultimo = c; falhas = 0; return { cv: c, nova: true } }, function (e) {
        /* foto que falha não vira vídeo preto em silêncio: a primeira, ou 5 seguidas, param a gravação com erro */
        falhas++; console.warn('[animado] a foto do quadro falhou', e);
        if (!ultimo || falhas >= 5) throw new Error('Não consegui fotografar o slide.');
        mexeu = true; return { cv: ultimo, nova: false };
      });
    }
    function grava() {
      /* primeiro os temporizadores que vencem até agora, depois as animações no ponto certo, e só então a foto */
      return rel.anda(T).then(function () { prende(); return espera(0) }).then(foto).then(function (f) {
        var c = f.cv;
        if (f.nova || total === 0) {
          ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
          if (c) { var k = Math.min(W / c.width, H / c.height), w = c.width * k, h = c.height * k; ctx.drawImage(c, (W - w) / 2, (H - h) / 2, w, h) }
        }
        var r = rec.quadro(cvSaida, !f.nova && total > 0); T += passoMs; total++;
        if (aviso && total % 5 === 0) aviso((T / 1000).toFixed(1).replace('.', ','), parte, slides.length, fracao);
        return r;
      });
    }
    /* anda o relógio até tudo do passo terminar, depois segura a pausa escolhida.
       "Mexendo" = animação com fim tocando, troca de slide, ou (nos primeiros 8 s do passo) a página mudando ou um
       temporizador para disparar logo (digitação, rótulo do clique, contagem). Teto de 30 s por passo */
    function ateParar(pausa) {
      var quieto = 0, t0 = T; mexeuPasso = false;
      function volta() {
        if (sinal.cancelado) return cancela();
        var vivas = prende(), cedo = T - t0 < 8000;
        var ativo = vivas >= 1 || pl.ocupado() || (cedo && (mexeuPasso || rel.pendente(1500)));
        mexeuPasso = false;
        quieto = ativo ? 0 : quieto + passoMs;
        if (quieto >= Math.max(passoMs * 2, pausa) || T - t0 > 30000) return Promise.resolve();
        return Promise.resolve(grava()).then(volta);
      }
      return volta();
    }
    return libs.then(function () {
      rec = op.formato === 'gif' ? gravadorGif(W, H, fps) : gravadorMp4(W, H, fps);
      return rec.pronto;
    }).then(function () {
      rel = relogioVirtual();
      /* exportando: sem teclado, sem clique de fora, sem câmera, e o quiz não segura o slide (sai parado, com a pausa) */
      /* começa já no 1º slide escolhido (antes abria no slide 1 e o vídeo começava com a transição vinda dele) */
      pl = new EA.Player(fora, P, { exportando: true, inicio: slides[0] });
      obs.observe(fora, { subtree: true, childList: true, attributes: true, characterData: true });
      var pausa = Math.max(0, op.pausa == null ? 1000 : op.pausa * 1000);
      var k = 0;
      function slide() {
        if (k >= slides.length) return Promise.resolve();
        if (sinal.cancelado) return cancela();
        parte = k + 1; fracao = 0;
        if (aviso) aviso(null, parte, slides.length, 0);
        if (k > 0) pl.ir(slides[k]);
        k++;
        var dados = 0, nPassos = EA.passosDoSlide(P.slides[slides[k - 1]]).length;
        /* teto: os passos da fila (cada interativo pode ter vários cliques dentro) com folga, nunca mais de 80 */
        var teto = Math.min(80, 10 + nPassos * 12);
        function passos() {
          return ateParar(pausa).then(function () {
            if (sinal.cancelado) return cancela();
            fracao = Math.min(.95, (dados + 1) / (nPassos + 1));
            if (dados++ > teto || !pl.passo()) return;
            return passos();
          });
        }
        return passos().then(slide);
      }
      return slide();
    }).then(function () {
      return rec.fim();
    }).finally(function () {
      obs.disconnect();
      try { if (pl) pl.fechar() } catch (e) { }
      fora.remove();
      if (rec) rec.fecha();
      function volta() { EA.projetoAtual = P; EA.Som.mudo(mudoAntes) }
      if (!rel) return volta();
      /* o que a apresentação escondida deixou agendado (sons com atraso, letras) roda ainda no mudo, com ela já fora da página;
         só depois os temporizadores de verdade voltam */
      var r = rel; rel = null;
      return r.anda(T + 15000).then(r.solta, r.solta).then(volta, volta);
    });
  };

  /* ---------- a janelinha ---------- */
  EA.Animado = {
    abre: function () {
      var P = EA.projetoAtual, s = EA.slideAtual(), atual = P.slides.indexOf(s) + 1, n = P.slides.length;
      var m = EA.el('div', 'ed-modal'), formato = 'gif';
      m.innerHTML = '<div class="ed-modal-c an-exp"><button class="ed-x" data-x>×</button><h2>Exportar animado</h2>' +
        '<p>As animações tocam na ordem da aba Animação, um clique depois do outro, e viram um arquivo. Vídeos e câmera dentro do slide não entram animados.</p>' +
        '<div class="an-linha"><span>Formato</span><div class="an-fmt"><button data-f="gif" class="on">GIF</button><button data-f="mp4">MP4</button></div></div>' +
        '<label class="an-linha"><span>Slides</span><input data-k="sl" value="' + atual + '" placeholder="ex.: 2, 5, 6 ou 2-5"></label>' +
        '<p class="an-nota" data-k="slnota"></p>' +
        '<label class="an-linha"><span>Tamanho</span><select data-k="tam"></select></label>' +
        '<label class="an-linha"><span>Pausa entre cliques (s)</span><input data-k="pausa" type="number" min="0" max="10" step="0.5" value="1"></label>' +
        '<div class="an-prog" data-k="prog" hidden><div><i data-k="barra"></i></div><span data-k="ptxt"></span></div>' +
        '<div class="imp-bt"><button data-k="cancela">Cancelar</button><button class="prim" data-k="ok">Gerar</button></div></div>';
      var $ = function (k) { return m.querySelector('[data-k=' + k + ']') }, gerando = null, sinal = null;
      /* valor = lado maior; o rótulo mostra o tamanho de verdade conforme o formato do 1º slide escolhido */
      var TAM = { gif: [[480, 'Pequeno'], [640, 'Médio'], [960, 'Grande']], mp4: [[1280, 'HD'], [1920, 'Full HD']] };
      function poeTam(r) {
        var ant = $('tam').value, d = EA.dimSlide(P.slides[(r && r.lista.length) ? r.lista[0] : atual - 1]);
        $('tam').innerHTML = TAM[formato].map(function (t, i) { var md = medidas(d, t[0]); return '<option value="' + t[0] + '"' + ((ant ? +ant === t[0] : i === (formato === 'mp4' ? 0 : 1)) ? ' selected' : '') + '>' + t[1] + ' (' + md.w + ' × ' + md.h + ')</option>' }).join('');
        if (!$('tam').value) $('tam').selectedIndex = formato === 'mp4' ? 0 : 1;
      }
      [].forEach.call(m.querySelectorAll('[data-f]'), function (b) {
        b.onclick = function () { if (gerando) return; formato = b.dataset.f; [].forEach.call(m.querySelectorAll('[data-f]'), function (x) { x.classList.toggle('on', x === b) }); $('tam').innerHTML = ''; poeTam(nota()) };
      });
      function nota() {
        var r = lerSlides($('sl').value, n);
        $('slnota').textContent = r.ruim ? 'Use números de 1 a ' + n + ', separados por vírgula (ex.: 2, 5, 6) ou um intervalo (2-5).' : r.lista.length ? 'Vai gravar: ' + r.lista.map(function (x) { return x + 1 }).join(', ') + (r.lista.length > 1 ? ' (sempre do menor para o maior)' : '') : 'Escolha pelo menos um slide.';
        $('slnota').classList.toggle('ruim', r.ruim || !r.lista.length);
        return r;
      }
      $('sl').oninput = function () { var r = nota(); if (!r.ruim && r.lista.length) poeTam(r) };
      poeTam(nota());
      function fecha() {
        if (gerando) { if (sinal) sinal.cancelado = true; $('cancela').disabled = true; $('ptxt').textContent = 'Cancelando…'; return }
        m.remove();
      }
      m.querySelector('[data-x]').onclick = fecha; $('cancela').onclick = fecha;
      $('ok').onclick = function () {
        if (gerando) return;
        var r = nota(); if (r.ruim || !r.lista.length) { $('sl').focus(); return }
        $('ok').disabled = true; $('prog').hidden = false; $('barra').style.width = '0%'; $('ptxt').textContent = 'Preparando…';
        var de = r.lista.length;
        sinal = { cancelado: false };
        function aviso(seg, k, t, fr) {
          if (sinal.cancelado) return;
          var parte = k || 1; de = t || de;
          $('ptxt').textContent = 'Gravando ' + (de > 1 ? 'slide ' + parte + ' de ' + de : 'o slide') + (seg ? ' · ' + seg + ' s de vídeo' : '') + '…';
          $('barra').style.width = Math.min(98, ((parte - 1) + (fr || 0)) / de * 100) + '%';
        }
        var op = { formato: formato, slides: r.lista, lado: +$('tam').value, pausa: +$('pausa').value || 0, sinal: sinal };
        gerando = EA.gravaAnimado(op, aviso).then(function (blob) {
          var nome = (P.titulo || 'Slides').replace(/[\\/:*?"<>|]+/g, ' ').trim() + ' - slide' + (r.lista.length > 1 ? 's ' : ' ') + r.lista.map(function (x) { return x + 1 }).join(', ') + '.' + formato;
          EA.Guardar.baixa(blob, nome);
          EA.aviso((formato === 'gif' ? 'GIF' : 'Vídeo') + ' pronto (' + (blob.size / 1048576).toFixed(1).replace('.', ',') + ' MB).');
          m.remove();
        }).catch(function (e) {
          if (/cancelado/.test(e && e.message)) { EA.aviso('Exportação cancelada.'); m.remove(); return }
          console.error('[animado]', e);
          $('ptxt').textContent = e && /navegador|fotografar/.test(e.message) ? e.message : 'Não consegui gravar. Tente um tamanho menor ou o formato GIF.';
          $('ok').disabled = false; $('cancela').disabled = false;
        }).then(function () { gerando = null; sinal = null });
      };
      document.body.appendChild(m);
    }
  };
  EA.Animado.lerSlides = lerSlides;
})();
