/* Capturar imagem e gravar a tela pelo próprio navegador. O navegador sempre pergunta o que compartilhar: nada grava sem a pessoa escolher.
   O resultado entra no slide ou vira um arquivo leve no PC; nos dois casos fica só neste computador. */
(function () {
  var EA = window.EA;
  function paraDataUrl(blob) { return new Promise(function (ok, erro) { var f = new FileReader(); f.onload = function () { ok(f.result) }; f.onerror = function () { erro(f.error) }; f.readAsDataURL(blob) }) }
  function pedeTela(audio, leve, estaAba) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return Promise.reject(new Error('Este navegador não deixa capturar a tela. Abra pelo Chrome ou Edge, em http://localhost ou https.'));
    var pede = { video: leve ? { frameRate: 30, width: { max: 1920 }, height: { max: 1080 } } : { frameRate: 30 }, audio: !!audio };
    /* 09/11: no Apresentar o navegador já sugere a própria aba do Estúdio */
    /* e não oferece a tela inteira (gravava o computador todo, com outras janelas) */
    if (estaAba) { pede.preferCurrentTab = true; pede.selfBrowserSurface = 'include'; pede.surfaceSwitching = 'exclude'; pede.monitorTypeSurfaces = 'exclude'; pede.video.displaySurface = 'browser' }
    return navigator.mediaDevices.getDisplayMedia(pede);
  }
  /* para guardar no PC: MP4, que abre em qualquer lugar; WebM só se o navegador não souber gravar MP4 */
  var FORMATOS_LEVES = [
    ['video/mp4;codecs=avc1.640028,mp4a.40.2', 2000000, 'mp4'], ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 2000000, 'mp4'], ['video/mp4;codecs=avc1.640028,opus', 2000000, 'mp4'], ['video/mp4', 2000000, 'mp4'],
    ['video/webm;codecs=vp9,opus', 1500000, 'webm'], ['video/webm', 1500000, 'webm']
  ];
  /* o gravador só leva um áudio: voz e som da tela precisam virar um só */
  function misturaAudio(video, audios) {
    var ac = new AudioContext(), saida = ac.createMediaStreamDestination();
    audios.forEach(function (t) { ac.createMediaStreamSource(new MediaStream([t])).connect(saida) });
    return { pista: new MediaStream(video.concat(saida.stream.getAudioTracks())), ac: ac };
  }
  /* ---------- câmera na gravação (09/11): só a janelinha com a câmera; aqui fica o fundo escolhido ---------- */
  var CAMG = { modo: 'desfoca' };
  function lim(v, a, b) { return Math.max(a, Math.min(b, v)) }
  var segP = null;
  function recortador() { return segP || (segP = EA.IA.cam.recortador().catch(function () { segP = null; return null })) }
  /* ---------- janelinha da câmera: fica por cima de tudo (até de outros programas) ---------- */
  var mon = null;
  function abreMonitor(aoFechar) {
    if (mon) return;
    mon = { aoFechar: aoFechar, vivo: true };
    EA.IA.cam.pega().catch(function (e) { EA.aviso && EA.aviso(EA.IA.erro(e)) });
    function monta(doc, win) {
      doc.title = 'Câmera';
      /* 09/11 (decisão final): a janelinha é só a câmera, mais nada. A gravação não desenha câmera nenhuma por cima:
         ela aparece no vídeo quando a janelinha está na área gravada (tela inteira ou janela). */
      doc.body.style.cssText = 'margin:0;background:#0b1424;height:100vh;overflow:hidden';
      doc.body.innerHTML = '<canvas data-k="cam" style="width:100vw;height:100vh;display:block"></canvas>';
      var cam = doc.querySelector('[data-k=cam]'), gc = cam.getContext('2d'), seg = null;
      recortador().then(function (s) { seg = s });
      (function laco() {
        if (!mon || !mon.vivo) return;
        var W = Math.max(2, Math.round(win.innerWidth)), H = Math.max(2, Math.round(win.innerHeight));
        if (cam.width !== W || cam.height !== H) { cam.width = W; cam.height = H }
        if (CAMG.modo === 'recorte') { gc.fillStyle = '#0b1424'; gc.fillRect(0, 0, W, H) }
        var tem = EA.IA.cam.quadro(gc, W, H, CAMG.modo, null, true, CAMG.modo === 'normal' ? null : seg);
        if (CAMG.modo === 'recorte' && tem) { gc.globalCompositeOperation = 'destination-over'; gc.fillStyle = '#0b1424'; gc.fillRect(0, 0, W, H); gc.globalCompositeOperation = 'source-over' }
        if (!tem) { gc.fillStyle = '#0b1424'; gc.fillRect(0, 0, W, H); gc.fillStyle = '#94a3b8'; gc.font = '15px Segoe UI, Arial'; gc.textAlign = 'center'; gc.fillText('Ligando a câmera…', W / 2, H / 2) }
        win.requestAnimationFrame(laco);
      })();
    }
    function fecha() { if (!mon) return; var m = mon; mon = null; m.vivo = false; EA.IA.cam.solta(); if (m.win && !m.win.closed) try { m.win.close() } catch (e) { } if (m.div) m.div.remove(); if (m.aoFechar) m.aoFechar() }
    mon.fecha = fecha;
    /* Chrome e Edge: janela "picture-in-picture" de verdade. Outros: um quadro flutuante na própria página */
    if (window.documentPictureInPicture) {
      window.documentPictureInPicture.requestWindow({ width: 320, height: 240 }).then(function (w) {
        if (!mon) { w.close(); return }
        mon.win = w; monta(w.document, w); w.addEventListener('pagehide', fecha);
      }, function () { flutua() });
    } else flutua();
    function flutua() {
      if (!mon) return;
      var f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;right:16px;bottom:16px;width:320px;height:240px;border:0;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.35);z-index:900;background:#0b1424';
      document.body.appendChild(f); mon.div = f;
      /* 09/11: a medida é a do quadrinho (320×240), não a da janela inteira: antes deformava e desfocava em tela cheia */
      monta(f.contentDocument, f.contentWindow || window);
    }
  }
  function fechaMonitor() { if (mon) mon.fecha() }

  EA.Gravar = {
    cam: CAMG, abreMonitor: abreMonitor, fechaMonitor: fechaMonitor, monitorAberto: function () { return !!mon },
    paraDataUrl: paraDataUrl,
    /* uma foto da tela escolhida */
    foto: function () {
      return pedeTela(false).then(function (st) {
        var v = document.createElement('video'); v.srcObject = st; v.muted = true;
        function apaga() { st.getTracks().forEach(function (t) { try { t.stop() } catch (e) { } }) }
        return v.play().then(function () { return new Promise(function (r) { setTimeout(r, 350) }) }).then(function () {
          var c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
          return { dados: c.toDataURL('image/png'), w: c.width, h: c.height };
          /* 09/11: a captura fecha sempre, mesmo se algo falhar no caminho (a barra "compartilhando" não fica presa) */
        }).then(function (r) { apaga(); return r }, function (e) { apaga(); throw e });
      });
    },
    /* grava até chamar parar(). aoFim recebe o vídeo */
    gravar: function (opcoes, aoFim, aoErro) {
      /* 09/11: tudo o que foi aberto (tela, microfone, mistura) fica anotado para fechar se algo falhar antes de gravar;
         e parar() durante as perguntas do navegador desiste da gravação em vez de não fazer nada */
      var abertas = [], mist = null, desistiu = false, gravando = false;
      function apaga() { abertas.forEach(function (t) { try { t.stop() } catch (e) { } }); if (mist) try { mist.ac.close() } catch (e) { } }
      function cancelada() { var e = new Error('Captura cancelada.'); e.name = 'NotAllowedError'; return e }
      var ctl = { parar: function () { desistiu = true } };
      /* 09/11: uma pergunta de cada vez (antes as duas janelas abriam juntas): primeiro a tela, colada no clique; depois o microfone */
      pedeTela(opcoes.somTela, opcoes.arquivo, opcoes.estaAba).then(function (tela) {
        abertas = abertas.concat(tela.getTracks());
        if (desistiu) throw cancelada();
        if (!opcoes.mic) return [tela, null];
        return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (m) { abertas = abertas.concat(m.getTracks()); return [tela, m] }, function () { return [tela, null] });
      }).then(function (r) {
        var tela = r[0], mic = r[1], faixas = tela.getTracks().slice(), pista, junta = null, vt = tela.getVideoTracks()[0];
        /* 09/11: parou de compartilhar (ou clicou em parar) enquanto o navegador perguntava do microfone: não grava faixa morta */
        if (desistiu || !vt || vt.readyState === 'ended') throw cancelada();
        if (mic) faixas = faixas.concat(mic.getAudioTracks());
        var audios = faixas.filter(function (t) { return t.kind === 'audio' }), mistura = mist = audios.length > 1 ? misturaAudio(faixas.filter(function (t) { return t.kind === 'video' }), audios) : null;
        pista = mistura ? mistura.pista : new MediaStream(faixas);
        var leve = opcoes.arquivo && FORMATOS_LEVES.find(function (f) { return MediaRecorder.isTypeSupported(f[0]) });
        var tipo = leve ? leve[0] : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(function (t) { return MediaRecorder.isTypeSupported(t) });
        var rec = new MediaRecorder(pista, tipo ? { mimeType: tipo, videoBitsPerSecond: leve ? leve[1] : 2500000, audioBitsPerSecond: leve ? 96000 : undefined } : {}), partes = [], t0 = Date.now();
        rec.ondataavailable = function (e) { if (e.data && e.data.size) partes.push(e.data) };
        rec.onstop = function () {
          faixas.forEach(function (t) { t.stop() });
          if (junta) junta.para();
          if (mistura) mistura.ac.close();
          if (opcoes.arquivo) { var bl = new Blob(partes, { type: rec.mimeType || 'video/webm' }); aoFim({ blob: bl, ext: leve ? leve[2] : 'webm', tamanho: bl.size, duracao: (Date.now() - t0) / 1000 }); return }
          var b = new Blob(partes, { type: 'video/webm' });
          /* 09/11: se a gravação não couber na memória, avisa em vez de ficar muda com o botão preso */
          var vs = (junta ? junta.stream : tela).getVideoTracks()[0].getSettings(); paraDataUrl(b).then(function (d) { aoFim({ dados: d, tamanho: b.size, duracao: (Date.now() - t0) / 1000, w: vs.width || 1280, h: vs.height || 720 }) }, function () { if (aoErro) aoErro(new Error('Não consegui guardar a gravação: ficou grande demais para a memória. Grave um pedaço menor ou use "guardar no PC".')) });
        };
        vt.addEventListener('ended', function () { if (rec.state !== 'inactive') rec.stop() });
        rec.start(1000); gravando = true;
        ctl.parar = function () { if (rec.state !== 'inactive') rec.stop() };
        if (opcoes.aoComecar) opcoes.aoComecar();
      }).catch(function (e) { if (!gravando) apaga(); if (aoErro) aoErro(e) });
      return ctl;
    }
  };
})();
