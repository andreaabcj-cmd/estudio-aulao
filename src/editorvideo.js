/* Editor de vídeo básico (09/11/2026): cortar o começo, o fim e pedaços do meio.
   O corte não estraga o vídeo original: guarda só os trechos tirados (props.cortes = [[de, até], …]) e o vídeo pula eles
   na hora de tocar (isso vale também no HTML exportado, por render.js). Ctrl+Z desfaz. Dá para baixar o vídeo já cortado. */
(function () {
  var EA = window.EA;
  function fmt(s) { s = Math.max(0, s || 0); var m = Math.floor(s / 60), x = s - m * 60; return m + ':' + (x < 10 ? '0' : '') + x.toFixed(1).replace('.', ',') }
  /* junta trechos que se encostam e põe em ordem */
  function arruma(l, dur) {
    var q = l.map(function (c) { return [Math.max(0, Math.min(c[0], c[1])), Math.min(dur, Math.max(c[0], c[1]))] }).filter(function (c) { return c[1] - c[0] > .05 }).sort(function (a, b) { return a[0] - b[0] }), r = [];
    q.forEach(function (c) { var u = r[r.length - 1]; if (u && c[0] <= u[1] + .05) u[1] = Math.max(u[1], c[1]); else r.push([+c[0].toFixed(2), +c[1].toFixed(2)]) });
    return r;
  }
  function sobra(cortes, dur) { var t = dur; cortes.forEach(function (c) { t -= c[1] - c[0] }); return Math.max(0, t) }

  EA.EditorVideo = {
    abre: function (o) {
      var src = EA.urlMidia(EA.projetoAtual, o.props.midia); if (!src) return;
      var cortes = (o.props.cortes || []).map(function (c) { return c.slice() }), sel = null, dur = 0;
      var m = EA.el('div', 'ed-modal');
      m.innerHTML = '<div class="ed-modal-c ev"><button class="ed-x" data-x>×</button><h2>Editar vídeo</h2><p>Arraste na faixa para marcar um pedaço e corte. O original não se perde: Ctrl+Z desfaz.</p>' +
        '<video class="ev-v" playsinline></video>' +
        '<div class="ev-linha"><button data-k="play" class="prim">▶ Tocar</button><span class="ev-t" data-k="t">0:00,0</span><span class="ev-dur" data-k="dur"></span></div>' +
        '<div class="ev-faixa" data-k="faixa"><div class="ev-quadros" data-k="quadros"></div><div class="ev-cortes" data-k="cortes"></div><div class="ev-sel" data-k="sel" hidden></div><i class="ev-agulha" data-k="ag"></i></div>' +
        '<div class="ev-linha ev-bts"><button data-k="ini">✂ Cortar o começo até aqui</button><button data-k="fim">✂ Cortar daqui até o fim</button><button data-k="corta" disabled>✂ Cortar o pedaço marcado</button><button data-k="limpa">Desfazer todos os cortes</button></div>' +
        '<div class="ev-lista" data-k="lista"></div>' +
        '<div class="imp-bt"><button data-k="baixa">Baixar o vídeo cortado</button><button class="prim" data-k="ok">Pronto</button></div></div>';
      var $ = function (k) { return m.querySelector('[data-k=' + k + ']') }, v = m.querySelector('video'), faixa = $('faixa');
      v.src = src;
      function pos(t) { return dur ? t / dur * 100 : 0 }
      function desenha() {
        $('cortes').innerHTML = cortes.map(function (c, i) { return '<i style="left:' + pos(c[0]) + '%;width:' + (pos(c[1]) - pos(c[0])) + '%" title="Cortado: ' + fmt(c[0]) + ' a ' + fmt(c[1]) + '"></i>' }).join('');
        var s = $('sel'); if (sel) { s.hidden = false; s.style.left = pos(Math.min(sel[0], sel[1])) + '%'; s.style.width = Math.abs(pos(sel[1]) - pos(sel[0])) + '%' } else s.hidden = true;
        $('corta').disabled = !sel || Math.abs(sel[1] - sel[0]) < .1;
        $('dur').textContent = 'Vídeo: ' + fmt(dur) + (cortes.length ? ' → fica com ' + fmt(sobra(cortes, dur)) : '');
        $('lista').innerHTML = cortes.length ? cortes.map(function (c, i) { return '<span>✂ ' + fmt(c[0]) + ' a ' + fmt(c[1]) + ' <button data-des="' + i + '" title="Devolver este pedaço">↩</button></span>' }).join('') : '<small>Nenhum corte ainda.</small>';
      }
      function agulha() { $('ag').style.left = pos(v.currentTime) + '%'; $('t').textContent = fmt(v.currentTime) }
      /* tocando: pula os pedaços cortados */
      function pula() { if (!dur) return; var t = v.currentTime; for (var i = 0; i < cortes.length; i++) if (t >= cortes[i][0] - .02 && t < cortes[i][1]) { if (cortes[i][1] >= dur - .05) { v.pause(); v.currentTime = cortes[i][0] } else v.currentTime = cortes[i][1]; break } }
      var laco = function () { if (!m.isConnected) return; if (!v.paused) pula(); agulha(); requestAnimationFrame(laco) };
      v.addEventListener('loadedmetadata', function () {
        /* 09/11: vídeo gravado pelo navegador chega sem tamanho (Infinity): até saber o tamanho de verdade, dur fica 0 e a faixa e os cortes não respondem */
        dur = v.duration; if (!isFinite(dur) || dur <= 0) { dur = 0; v.currentTime = 1e9; v.addEventListener('durationchange', function f() { if (isFinite(v.duration) && v.duration > 0) { dur = v.duration; v.currentTime = 0; v.removeEventListener('durationchange', f); confere(); desenha(); miniaturas() } }) }
        else { confere(); desenha(); miniaturas() }
      });
      /* 09/11: cortes guardados que tiram o vídeo inteiro (ele nunca tocaria no slide) são desfeitos ao abrir */
      function confere() { cortes = arruma(cortes, dur); if (cortes.length && sobra(cortes, dur) < .1) { cortes = []; EA.aviso('Os cortes guardados tiravam o vídeo inteiro: foram desfeitos.') } }
      /* tirinha de miniaturas para achar os pontos com o olho */
      function miniaturas() {
        var n = 12, w = document.createElement('video'), i = 0; w.src = src; w.muted = true; w.preload = 'auto';
        w.addEventListener('loadeddata', function prox() {
          if (i >= n || !m.isConnected) return;
          w.currentTime = Math.min(dur - .05, (i + .5) * dur / n);
          w.onseeked = function () { var c = document.createElement('canvas'); c.width = 96; c.height = 54; c.getContext('2d').drawImage(w, 0, 0, 96, 54); $('quadros').appendChild(c); i++; prox() };
        });
      }
      requestAnimationFrame(laco);
      $('play').onclick = function () { if (v.paused) { pula(); v.play(); this.textContent = '⏸ Pausar' } else { v.pause(); this.textContent = '▶ Tocar' } };
      v.onpause = function () { $('play').textContent = '▶ Tocar' };
      /* arrastar na faixa: marca um pedaço; só clicar: leva a agulha */
      var arr = null;
      function tempoEm(ev) { var r = faixa.getBoundingClientRect(); return Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * dur }
      faixa.onpointerdown = function (ev) { if (!dur) return; faixa.setPointerCapture(ev.pointerId); arr = { t0: tempoEm(ev), x0: ev.clientX }; sel = null; v.currentTime = arr.t0; desenha() };
      faixa.onpointermove = function (ev) { if (!arr) return; if (Math.abs(ev.clientX - arr.x0) > 4) { sel = [arr.t0, tempoEm(ev)]; v.currentTime = sel[1]; desenha() } };
      faixa.onpointerup = function () { arr = null; if (sel) { sel = [Math.min(sel[0], sel[1]), Math.max(sel[0], sel[1])]; desenha() } };
      /* 09/11: não aceita corte que leve o vídeo inteiro embora (ele ficava sem tocar no slide e o download não fazia nada) */
      function poe(c) { if (!dur) return; var n = arruma(cortes.concat([c]), dur); if (sobra(n, dur) < .1) { EA.aviso('Assim o vídeo inteiro seria cortado. Deixe pelo menos um pedaço.'); return } cortes = n; sel = null; desenha() }
      $('ini').onclick = function () { if (dur && v.currentTime > .05) poe([0, v.currentTime]) };
      $('fim').onclick = function () { if (dur && v.currentTime < dur - .05) poe([v.currentTime, dur]) };
      $('corta').onclick = function () { if (sel) poe(sel) };
      $('limpa').onclick = function () { cortes = []; sel = null; desenha() };
      $('lista').onclick = function (ev) { var b = ev.target.closest('[data-des]'); if (b) { cortes.splice(+b.dataset.des, 1); desenha() } };
      function fecha(salva) {
        v.pause();
        if (salva) { if (cortes.length) o.props.cortes = cortes; else delete o.props.cortes; if (EA.refazConteudo) EA.refazConteudo(o); EA.redesenha(); EA.mudou(); if (EA.Inspetor) EA.Inspetor.mostra() }
        m.remove();
      }
      $('ok').onclick = function () { fecha(true) };
      m.querySelector('[data-x]').onclick = function () { fecha(true) };
      /* baixar já cortado: toca só os pedaços que ficaram e grava (leva o tempo do vídeo que sobrou) */
      $('baixa').onclick = function () {
        var bt = this; if (bt.disabled) return;
        if (!dur) { EA.aviso('O vídeo ainda está carregando. Tente de novo em um instante.'); return }
        var fica = [], t = 0; cortes.forEach(function (c) { if (c[0] > t) fica.push([t, c[0]]); t = Math.max(t, c[1]) }); if (t < dur) fica.push([t, dur]);
        if (!fica.length) { EA.aviso('Não sobrou nenhum pedaço do vídeo para baixar.'); return }
        var w = document.createElement('video'); w.src = src; w.playsInline = true; w.style.cssText = 'position:fixed;left:-9999px;width:2px;height:2px';
        /* 09/11: navegador sem gravação de vídeo (Safari) ou vídeo que não abre: avisa e devolve o botão, em vez de ficar em "Preparando…" para sempre */
        var rec = null, relogio = null, acabou = false;
        function desiste(msg) {
          if (acabou) return; acabou = true; clearInterval(relogio); w.ontimeupdate = w.onended = w.onseeked = w.onerror = null;
          try { w.pause() } catch (e) { } try { if (rec && rec.state !== 'inactive') { rec.onstop = null; rec.stop() } } catch (e) { }
          w.remove(); bt.disabled = false; bt.textContent = 'Baixar o vídeo cortado'; EA.aviso(msg);
        }
        if (!window.MediaRecorder || !(w.captureStream || w.mozCaptureStream)) { EA.aviso('Este navegador não consegue baixar o vídeo cortado. Use o Chrome ou o Edge.'); return }
        w.onerror = function () { desiste('Não consegui abrir este vídeo para gravar.') };
        document.body.appendChild(w);
        bt.disabled = true; bt.textContent = 'Preparando…';
        w.addEventListener('loadeddata', function () {
         try {
          var st = w.captureStream ? w.captureStream() : w.mozCaptureStream(), tipo = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find(function (q) { return MediaRecorder.isTypeSupported(q) }), ext = tipo && /mp4/.test(tipo) ? 'mp4' : 'webm';
          rec = new MediaRecorder(st, tipo ? { mimeType: tipo, videoBitsPerSecond: 2500000 } : {}); var partes = [], k = 0, total = sobra(cortes, dur), feito = 0;
          rec.ondataavailable = function (e) { if (e.data.size) partes.push(e.data) };
          rec.onstop = function () {
            acabou = true; clearInterval(relogio); w.ontimeupdate = w.onended = w.onerror = null;
            w.remove(); bt.disabled = false; bt.textContent = 'Baixar o vídeo cortado';
            var nome = String((EA.projetoAtual.midia[o.props.midia] || {}).nome || 'video').replace(/\.\w{2,4}$/, '') + ' (cortado).' + ext;
            EA.Guardar.baixa(new Blob(partes, { type: ext === 'mp4' ? 'video/mp4' : 'video/webm' }), nome);
          };
          function trecho() {
            if (k >= fica.length) { rec.stop(); return }
            var f = fica[k], fechado = false;
            /* 09/11: quem fecha cada pedaço é o próprio vídeo (timeupdate/ended) mais um relógio, e não o desenho da tela,
               que congela com a aba escondida ou a janela minimizada e deixava passar os pedaços cortados */
            function vigia() {
              if (acabou || fechado) return;
              if (w.currentTime >= f[1] - .03 || w.ended) { fechado = true; clearInterval(relogio); w.ontimeupdate = w.onended = null; w.pause(); feito += f[1] - f[0]; if (rec.state === 'recording') rec.pause(); k++; trecho(); return }
              bt.textContent = 'Gravando ' + Math.round((feito + w.currentTime - f[0]) / total * 100) + '%…';
            }
            w.currentTime = f[0];
            w.onseeked = function () {
              w.onseeked = null;
              if (rec.state === 'inactive') rec.start(500); else rec.resume();
              var toca = w.play(); if (toca && toca.catch) toca.catch(function (e) { if (!fechado && (!e || e.name !== 'AbortError')) desiste('O navegador não deixou tocar o vídeo para gravar.') });
              w.ontimeupdate = w.onended = vigia; relogio = setInterval(vigia, 50);
            };
          }
          trecho();
         } catch (e) { desiste('Não consegui gravar o vídeo cortado neste navegador.') }
        }, { once: true });
      };
      document.body.appendChild(m);
    }
  };
})();
