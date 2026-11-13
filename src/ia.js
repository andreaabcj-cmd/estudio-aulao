/* Recursos de IA do editor (09/11/2026): ditado, tradutor, tirar o fundo, transcrever imagem.
   Testados no laboratório (botão Debug) no PC de casa e no PC do trabalho. Só no editor: o HTML exportado é fechado
   para a internet de propósito, então não leva nada disto. Na 1ª vez cada "cérebro" é baixado e fica guardado no navegador. */
(function () {
  var EA = window.EA, IA = EA.IA = {};
  var CDN = {
    tf: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js',
    ts: 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js',
    tsPor: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/por@1.0.0/4.0.0'
  };
  var libs = {};
  IA.tf = function () { return libs.tf || (libs.tf = import(CDN.tf).then(function (T) { T.env.allowLocalModels = false; return T }, function (e) { libs.tf = null; throw e })) };
  IA.ts = function () { return libs.ts || (libs.ts = new Promise(function (ok, erro) { var s = document.createElement('script'); s.src = CDN.ts; s.onload = function () { ok(window.Tesseract) }; s.onerror = function () { libs.ts = null; erro(new Error('rede')) }; document.head.appendChild(s) })) };
  IA.gpu = function () { return libs.gpu || (libs.gpu = navigator.gpu ? navigator.gpu.requestAdapter().then(function (a) { return !!a }, function () { return false }) : Promise.resolve(false)) };
  /* erro técnico → frase simples */
  IA.erro = function (e) {
    var m = String(e && (e.message || e.name || e) || '');
    if (/fetch|network|rede|load failed|net::|HTTP/i.test(m)) return 'A rede bloqueou o download. Tente no Edge, ou em outra internet.';
    if (/NotAllowed|Permission|denied/i.test(m)) return 'O navegador não deu permissão (microfone ou câmera).';
    if (/memory|alloc/i.test(m)) return 'Faltou memória neste computador.';
    return 'Não deu certo: ' + m.slice(0, 120);
  };

  /* ---------- aviso da primeira vez: diz o que vai ser baixado. fn roda dentro do clique (o tradutor exige isso) ---------- */
  IA.primeiraVez = function (chave, titulo, texto, fn) {
    var visto = false; try { visto = localStorage.getItem('ea_ia_' + chave) === '1' } catch (e) { }
    if (visto) { fn(); return }
    var m = EA.el('div', 'ed-modal');
    m.innerHTML = '<div class="ed-modal-c ia-aviso"><h2>' + EA.esc(titulo) + '</h2><p>' + EA.esc(texto) + '</p><p class="ia-nota">É só na primeira vez: depois fica guardado neste navegador e funciona na hora. Nada do seu material sai do computador.</p><div class="imp-bt"><button data-n>Agora não</button><button class="prim" data-s>Baixar e continuar</button></div></div>';
    m.querySelector('[data-n]').onclick = function () { m.remove() };
    m.querySelector('[data-s]').onclick = function () { try { localStorage.setItem('ea_ia_' + chave, '1') } catch (e) { } m.remove(); fn() };
    document.body.appendChild(m);
  };

  /* ---------- ditado (serviço de voz do navegador) ---------- */
  IA.IDIOMAS_DITADO = [['pt-BR', 'Português'], ['en-US', 'Inglês'], ['es-US', 'Espanhol (EUA)'], ['es-419', 'Espanhol (América Latina) · só no Chrome']];
  IA.temDitado = function () { return !!(window.SpeechRecognition || window.webkitSpeechRecognition) };
  /* botão pronto: idioma + microfone. aoFinal(texto) recebe cada frase fechada; aoParcial mostra o que está ouvindo */
  IA.botaoDitado = function (aoFinal, aoParcial) {
    var w = EA.el('div', 'ia-dita'), s = EA.el('select'), b = EA.el('button', 'in-botao', '🎤 Ditar'), rec = null;
    var ult = ''; try { ult = localStorage.getItem('ea_ia_lingua') || '' } catch (e) { }
    s.innerHTML = IA.IDIOMAS_DITADO.map(function (q) { return '<option value="' + q[0] + '">' + EA.esc(q[1]) + '</option>' }).join(''); if (ult) s.value = ult;
    s.onchange = function () { try { localStorage.setItem('ea_ia_lingua', s.value) } catch (e) { } };
    b.type = 'button';
    b.onclick = function () {
      if (rec) { rec.stop(); return }
      var R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) { EA.aviso('Este navegador não tem ditado. Use o Chrome ou o Edge.'); return }
      rec = new R(); rec.lang = s.value; rec.continuous = true; rec.interimResults = true;
      rec.onresult = function (ev) {
        /* 09/11: o botão saiu da tela (painel refeito): o microfone fecha e o que chegar depois não entra em lugar nenhum */
        if (!w.isConnected) { w.para(); return }
        var p = '';
        for (var k = ev.resultIndex; k < ev.results.length; k++) { if (ev.results[k].isFinal) aoFinal(ev.results[k][0].transcript.trim()); else p += ev.results[k][0].transcript }
        if (aoParcial) aoParcial(p);
      };
      rec.onerror = function (e) { EA.aviso(e.error === 'network' ? 'O serviço de voz deste idioma está bloqueado nesta rede. Tente outro idioma ou outro navegador.' : e.error === 'not-allowed' ? 'O navegador não deixou usar o microfone.' : e.error === 'no-speech' ? 'Não ouvi nada. Tente de novo.' : 'O ditado parou (' + e.error + ').') };
      rec.onend = function () { rec = null; b.textContent = '🎤 Ditar'; b.classList.remove('ia-on'); if (aoParcial) aoParcial('') };
      rec.start(); b.textContent = '⏹ Parar'; b.classList.add('ia-on');
    };
    w.appendChild(s); w.appendChild(b);
    /* 09/11: para de vez (abort solta o microfone na hora e não entrega mais frase); o painel chama isto ao ser refeito */
    w.para = function () { var r = rec; if (!r) return; r.onresult = r.onerror = null; try { r.abort() } catch (e) { try { r.stop() } catch (e2) { } } };
    return w;
  };

  /* ---------- tradutor do navegador ---------- */
  IA.IDIOMAS = [['pt', 'Português'], ['es', 'Espanhol'], ['en', 'Inglês']];
  IA.nomeIdioma = function (k) { var q = IA.IDIOMAS.filter(function (x) { return x[0] === k })[0]; return q ? q[1] : k };
  var tradutores = {};
  /* chamar DENTRO do clique: o Chrome só baixa o idioma com um gesto da pessoa */
  IA.tradutor = function (de, para, aoProgresso) {
    if (!('Translator' in self)) return Promise.reject(new Error('Este navegador não tem tradutor. Use o Chrome ou o Edge atualizados.'));
    var k = de + '>' + para;
    if (!tradutores[k]) {
      tradutores[k] = Translator.create({ sourceLanguage: de, targetLanguage: para, monitor: function (m) { m.addEventListener('downloadprogress', function (e) { if (aoProgresso) aoProgresso(e.loaded) }) } });
      tradutores[k].catch(function () { delete tradutores[k] });
    }
    return tradutores[k];
  };
  function temPalavra(t) { return typeof t === 'string' && /[A-Za-zÀ-ÿ]{2,}/.test(t) && !/^\s*(https?:|data:|var\(|#[0-9a-f]{3,8}\b|assets\/)/i.test(t) }
  /* texto com formatação: traduz só os pedaços de texto, a formatação fica */
  IA.traduzHtml = function (tr, html) {
    var d = document.createElement('div'); d.innerHTML = html || '';
    var nos = [], w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (temPalavra(w.currentNode.nodeValue)) nos.push(w.currentNode);
    return nos.reduce(function (pr, n) {
      return pr.then(function () { var orig = n.nodeValue, ini = orig.match(/^\s*/)[0], fim = orig.match(/\s*$/)[0]; return tr.translate(orig.trim()).then(function (t) { n.nodeValue = ini + t + fim }) });
    }, Promise.resolve()).then(function () { return d.innerHTML });
  };
  IA.traduzTexto = function (tr, t) { return temPalavra(t) ? tr.translate(t) : Promise.resolve(t) };
  /* traduz no lugar (sem cópia): textos, campos dos elementos, quiz, notas e nomes de slide. alvos = [{ o, slide }] */
  var CHAVES = { html: 'h', p: 't', exp: 't', resp: 't', titulo: 't', t: 't', d: 't', n: 't', notas: 't', texto: 't', pergunta: 't', ops: 'l', campos: 'c', nome: 'slide' };
  function ehHtml(x) { return /<[a-z][\s\S]*>/i.test(x) }
  IA.traduzEm = function (tr, alvos, aoProgresso, soContar) {
    var tarefas = [];
    function poe(o, k, v) { tarefas.push(function () { return (ehHtml(v) ? IA.traduzHtml(tr, v) : IA.traduzTexto(tr, v)).then(function (x) { o[k] = x }) }) }
    /* lista numa linha só ("A | B", "Jan, Fev"): traduz cada parte e junta de novo, sem mudar a quantidade */
    function poeLista(o, k, v, sep, cola) {
      tarefas.push(function () {
        var ps = String(v).split(sep).map(function (x) { return x.trim() });
        return ps.reduce(function (pr, x, i) { return pr.then(function () { return IA.traduzTexto(tr, x).then(function (y) { ps[i] = String(y).split(sep).join(' ').trim() }) }) }, Promise.resolve()).then(function () { o[k] = ps.join(cola) });
      });
    }
    function anda(o, ehSlide) {
      if (!o || typeof o !== 'object') return;
      var codigo = o.modelo === 'codigo';
      Object.keys(o).forEach(function (k) {
        var v = o[k], tipo = CHAVES[k];
        if (k === 'midia' || k === 'kf' || k === 'fundo' || k === 'trans' || k === 'acao' || k === 'legenda') return;
        /* 09/11: o que não é frase não se traduz (código, endereço de site, números do gráfico, trecho de código que acende) */
        if (k === 'resp' && typeof v === 'string') { if (temPalavra(v)) poeLista(o, k, v, '|', ' | '); return }
        if (k === 'pares' && Array.isArray(v)) { v.forEach(function (x) { if (x && typeof x === 'object') ['a', 'b'].forEach(function (q) { if (temPalavra(x[q])) poe(x, q, x[q]) }) }); return }
        if (k === 'realces' && Array.isArray(v)) { v.forEach(function (x) { if (x && temPalavra(x.d)) poe(x, 'd', x.d) }); return }
        if (tipo === 'slide') { if (ehSlide && temPalavra(v)) poe(o, k, v); return }
        if ((tipo === 'h' || tipo === 't') && typeof v === 'string') { if (temPalavra(v)) poe(o, k, v); return }
        if (tipo === 'l' && Array.isArray(v)) { v.forEach(function (x, i) { if (temPalavra(x)) poe(v, i, x) }); return }
        if (tipo === 'c' && v && typeof v === 'object') {
          Object.keys(v).forEach(function (q) {
            if (q === 'url' || q === 'dados' || (codigo && q === 't')) return;
            if (q === 'nomes' && typeof v[q] === 'string' && !ehHtml(v[q])) { if (temPalavra(v[q])) poeLista(v, q, v[q], ',', ', '); return }
            if (temPalavra(v[q])) poe(v, q, v[q]);
          });
          return;
        }
        if (v && typeof v === 'object') anda(v, false);
      });
    }
    alvos.forEach(function (a) { anda(a.o, a.slide) });
    if (soContar) return tarefas.length;
    var feitas = 0;
    return tarefas.reduce(function (pr, f) { return pr.then(f).then(function () { feitas++; if (aoProgresso) aoProgresso(feitas, tarefas.length) }) }, Promise.resolve()).then(function () { return tarefas.length });
  };
  /* tem algo para traduzir nesta peça? */
  IA.temTexto = function (o) { return IA.traduzEm(null, [{ o: o.props || {}, slide: false }], null, true) > 0 };

  /* ---------- tirar o fundo (RMBG 1.4: o que passou nos testes; uso não comercial) ---------- */
  var rmbg = null;
  function preparaRmbg(aoProgresso) {
    if (rmbg) return rmbg;
    var arq = {}, prog = function (p) { if (p.status === 'progress' && p.file) arq[p.file] = { l: p.loaded || 0, t: p.total || 0 }; var l = 0, t = 0; Object.keys(arq).forEach(function (k) { l += arq[k].l; t += arq[k].t }); if (t && aoProgresso) aoProgresso(l / t) };
    rmbg = Promise.all([IA.tf(), IA.gpu()]).then(function (q) {
      var T = q[0], faz = function (dev) {
        return Promise.all([
          T.AutoModel.from_pretrained('briaai/RMBG-1.4', { config: { model_type: 'custom' }, device: dev, dtype: dev === 'webgpu' ? 'fp16' : 'q8', progress_callback: prog }),
          T.AutoProcessor.from_pretrained('briaai/RMBG-1.4', { config: { do_normalize: true, do_pad: false, do_rescale: true, do_resize: true, image_mean: [.5, .5, .5], feature_extractor_type: 'ImageFeatureExtractor', image_std: [1, 1, 1], resample: 2, rescale_factor: 1 / 255, size: { width: 1024, height: 1024 } } })
        ]).then(function (r) { return { T: T, model: r[0], proc: r[1], dev: dev } });
      };
      return q[1] ? faz('webgpu').catch(function () { return faz('wasm') }) : faz('wasm');
    });
    rmbg.catch(function () { rmbg = null });
    return rmbg;
  }
  IA.tiraFundo = function (src, aoProgresso) {
    return preparaRmbg(aoProgresso).then(function (R) {
      var T = R.T;
      return T.RawImage.fromURL(src).then(function (im) {
        return R.proc(im).then(function (x) { return R.model({ input: x.pixel_values }) }).then(function (o) {
          return T.RawImage.fromTensor(o.output[0].mul(255).to('uint8')).resize(im.width, im.height).then(function (m) {
            var cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; var g = cv.getContext('2d');
            g.drawImage(im.toCanvas(), 0, 0); var d = g.getImageData(0, 0, im.width, im.height);
            for (var i = 0; i < m.data.length; i++) d.data[i * 4 + 3] = m.data[i];
            g.putImageData(d, 0, 0);
            return { dados: cv.toDataURL('image/png'), w: im.width, h: im.height };
          });
        });
      });
    });
  };

  /* ---------- legenda de vídeo (Whisper médio, só processador: foi o mais rápido no teste) ----------
     Roda numa fila separada do navegador (worker): a tela não congela, dá para ver o progresso e cancelar. */
  var CODIGO_WORKER = [
    "import { pipeline, env } from '" + CDN.tf + "';",
    "env.allowLocalModels = false;",
    "let pipe = null;",
    "self.onmessage = async (e) => {",
    "  const { audio, lingua } = e.data;",
    "  try {",
    "    if (!pipe) pipe = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-base', { device: 'wasm', dtype: 'q8', progress_callback: (p) => { if (p.status === 'progress') self.postMessage({ tipo: 'baixa', file: p.file, loaded: p.loaded || 0, total: p.total || 0 }) } });",
    "    self.postMessage({ tipo: 'pronto' });",
    "    const SR = 16000, PED = 30 * SR, n = Math.max(1, Math.ceil(audio.length / PED)), cues = [];",
    "    for (let i = 0; i < n; i++) {",
    "      const pedaco = audio.subarray(i * PED, Math.min(audio.length, (i + 1) * PED));",
    "      let soma = 0; for (let k = 0; k < pedaco.length; k += 50) soma += pedaco[k] * pedaco[k];",
    "      if (Math.sqrt(soma / (pedaco.length / 50)) > 0.004) {",
    "        const r = await pipe(pedaco, { language: lingua, task: 'transcribe', return_timestamps: true });",
    "        (r.chunks || [{ timestamp: [0, pedaco.length / SR], text: r.text }]).forEach((c) => {",
    "          const a = (c.timestamp[0] || 0) + i * 30, b = (c.timestamp[1] != null ? c.timestamp[1] : pedaco.length / SR) + i * 30, t = (c.text || '').trim();",
    "          if (t) cues.push({ i: Math.round(a * 100) / 100, f: Math.round(b * 100) / 100, t });",
    "        });",
    "      }",
    "      self.postMessage({ tipo: 'pedaco', feito: i + 1, total: n });",
    "    }",
    "    self.postMessage({ tipo: 'fim', cues });",
    "  } catch (err) { self.postMessage({ tipo: 'erro', msg: String((err && err.message) || err) }) }",
    "};"
  ].join('\n');
  var trabalhador = null;
  IA.LINGUAS_LEGENDA = [['portuguese', 'Português', 'pt'], ['spanish', 'Espanhol', 'es'], ['english', 'Inglês', 'en']];
  /* devolve { promessa, cancela }. aoProgresso({ fase: 'audio'|'baixa'|'legenda', f: 0..1, texto }) */
  IA.legenda = function (src, lingua, aoProgresso) {
    var cancelado = false, rejeita = null;
    var promessa = new Promise(function (ok, erro) {
      rejeita = erro;
      aoProgresso({ fase: 'audio', f: 0, texto: 'Separando o áudio…' });
      fetch(src).then(function (r) { return r.arrayBuffer() }).then(function (b) {
        var ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        return ac.decodeAudioData(b).then(function (a) { ac.close(); return a }, function () { ac.close(); throw new Error('Este vídeo não tem som que o navegador consiga ler.') });
      }).then(function (a) {
        if (cancelado) return;
        var ch = a.getChannelData(0), mono = new Float32Array(ch.length);
        if (a.numberOfChannels > 1) { var c2 = a.getChannelData(1); for (var i = 0; i < ch.length; i++) mono[i] = (ch[i] + c2[i]) / 2 } else mono.set(ch);
        if (!trabalhador) trabalhador = new Worker(URL.createObjectURL(new Blob([CODIGO_WORKER], { type: 'text/javascript' })), { type: 'module' });
        var arq = {};
        trabalhador.onmessage = function (e) {
          var m = e.data;
          if (m.tipo === 'baixa') { arq[m.file] = m; var l = 0, t = 0; Object.keys(arq).forEach(function (k) { l += arq[k].loaded; t += arq[k].total }); if (t) aoProgresso({ fase: 'baixa', f: l / t, texto: 'Baixando o legendador ' + Math.round(l / t * 100) + '%…' }) }
          else if (m.tipo === 'pronto') aoProgresso({ fase: 'legenda', f: 0, texto: 'Legendando…' });
          else if (m.tipo === 'pedaco') aoProgresso({ fase: 'legenda', f: m.feito / m.total, texto: 'Legendando ' + Math.round(m.feito / m.total * 100) + '%…' });
          else if (m.tipo === 'fim') ok({ cues: m.cues, duracao: a.duration });
          else if (m.tipo === 'erro') erro(new Error(m.msg));
        };
        /* 09/11: o trabalhador que deu erro (ex.: internet caiu no download) é jogado fora; a próxima tentativa cria outro */
        var meuT = trabalhador;
        trabalhador.onerror = function (e) { if (trabalhador === meuT) trabalhador = null; try { meuT.terminate() } catch (x) { } erro(new Error((e && e.message) || 'rede')) };
        trabalhador.postMessage({ audio: mono, lingua: lingua }, [mono.buffer]);
      }).catch(erro);
    });
    return { promessa: promessa, cancela: function () { cancelado = true; if (trabalhador) { trabalhador.terminate(); trabalhador = null } if (rejeita) rejeita(new Error('cancelado')) } };
  };

  /* ---------- câmera (MediaPipe): uma câmera só, dividida entre a peça ao vivo, a gravação e os gestos ---------- */
  var MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35';
  var MP_SEG = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
  var MP_MAO = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/latest/gesture_recognizer.task';
  IA.mp = function () { return libs.mp || (libs.mp = import(MP + '/vision_bundle.mjs').then(function (M) { return M.FilesetResolver.forVisionTasks(MP + '/wasm').then(function (f) { return { M: M, fs: f } }) }, function (e) { libs.mp = null; throw e })) };
  var cam = IA.cam = { usos: 0, video: null, stream: null, abrindo: null, seg: null, mask: null, ultT: -1 };
  /* abre a câmera (pede de novo sem tamanho se a câmera recusar, como a do celular) */
  /* 09/11: regra única: quem chama pega() chama solta() uma vez, tenha a câmera aberto ou não */
  function apagaCam(st) { try { st.getTracks().forEach(function (t) { t.stop() }) } catch (e) { } }
  cam.pega = function () {
    cam.usos++; clearTimeout(cam.tDesliga);
    if (cam.abrindo) return cam.abrindo;
    var pedidos = [{ width: { ideal: 1280 }, height: { ideal: 720 } }, true], i = 0;
    var meu = cam.abrindo = (function tenta() {
      return navigator.mediaDevices.getUserMedia({ video: pedidos[i], audio: false }).catch(function (e) { if (e.name === 'NotAllowedError' || ++i >= pedidos.length) throw e; return tenta() });
    })().then(function (st) {
      /* a câmera chegou depois de todo mundo já ter desistido dela: apaga na hora (a luzinha não fica acesa) */
      if (cam.abrindo !== meu) { apagaCam(st); throw new Error('A câmera foi fechada antes de ligar.') }
      var v = document.createElement('video'); v.srcObject = st; v.muted = true; v.playsInline = true;
      cam.stream = st; cam.video = v;
      return v.play().then(function () { return v }, function (e) { apagaCam(st); if (cam.stream === st) cam.stream = cam.video = null; throw e });
    });
    meu.catch(function () { if (cam.abrindo === meu) cam.abrindo = null });
    return meu;
  };
  /* devolve a câmera; quando ninguém mais usa, desliga (a luzinha apaga) */
  cam.solta = function () {
    cam.usos = Math.max(0, cam.usos - 1);
    clearTimeout(cam.tDesliga);
    cam.tDesliga = setTimeout(function () {
      if (cam.usos > 0) return;
      if (cam.stream) apagaCam(cam.stream);
      cam.stream = cam.video = cam.abrindo = null; cam.mask = null;
    }, 1500);
  };
  cam.recortador = function () {
    if (cam.seg) return cam.seg;
    cam.seg = Promise.all([IA.mp(), fetch(MP_SEG).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer() }), IA.gpu()]).then(function (q) {
      return q[0].M.ImageSegmenter.createFromOptions(q[0].fs, { baseOptions: { modelAssetBuffer: new Uint8Array(q[1]), delegate: q[2] ? 'GPU' : 'CPU' }, runningMode: 'VIDEO', outputConfidenceMasks: true });
    });
    cam.seg.catch(function () { cam.seg = null });
    return cam.seg;
  };
  /* máscara da pessoa no quadro atual (uma conta por quadro, mesmo com várias peças usando) */
  cam.mascara = function (s) {
    var v = cam.video; if (!v || !s || v.readyState < 2) return cam.mask;
    var t = v.currentTime; if (t === cam.ultT && cam.mask) return cam.mask;
    cam.ultT = t;
    var W = v.videoWidth, H = v.videoHeight, mc = cam.maskCv || (cam.maskCv = document.createElement('canvas'));
    if (mc.width !== W || mc.height !== H) { mc.width = W; mc.height = H }
    s.segmentForVideo(v, performance.now(), function (r) {
      var m = r.confidenceMasks[0], d = m.getAsFloat32Array(), g = mc.getContext('2d'), id = cam.maskId && cam.maskId.width === W && cam.maskId.height === H ? cam.maskId : (cam.maskId = g.createImageData(W, H));
      for (var i = 0; i < d.length; i++) id.data[i * 4 + 3] = d[i] > .5 ? 255 : d[i] * 2 * 255;
      g.putImageData(id, 0, 0); m.close && m.close();
    });
    cam.mask = mc; return mc;
  };
  /* desenha a câmera em g (W×H), cobrindo a área: 'normal', 'desfoca', 'imagem' (fundoImg) ou 'recorte' (sem fundo) */
  cam.quadro = function (g, W, H, modo, fundoImg, espelho, s) {
    var v = cam.video; if (!v || v.readyState < 2) return false;
    var vw = v.videoWidth, vh = v.videoHeight, e = Math.max(W / vw, H / vh), dw = vw * e, dh = vh * e, dx = (W - dw) / 2, dy = (H - dh) / 2;
    var pessoa = cam.pessoaCv || (cam.pessoaCv = document.createElement('canvas'));
    g.save(); g.clearRect(0, 0, W, H);
    if (espelho) { g.translate(W, 0); g.scale(-1, 1) }
    if (modo === 'normal' || !s) { g.drawImage(v, dx, dy, dw, dh); g.restore(); return true }
    if (modo === 'desfoca') { g.filter = 'blur(' + Math.round(Math.max(W, H) / 60 + 6) + 'px)'; g.drawImage(v, dx, dy, dw, dh); g.filter = 'none' }
    else if (modo === 'imagem' && fundoImg && fundoImg.complete && fundoImg.naturalWidth) {
      var ie = Math.max(W / fundoImg.naturalWidth, H / fundoImg.naturalHeight);
      g.save(); if (espelho) { g.translate(W, 0); g.scale(-1, 1) } g.drawImage(fundoImg, (W - fundoImg.naturalWidth * ie) / 2, (H - fundoImg.naturalHeight * ie) / 2, fundoImg.naturalWidth * ie, fundoImg.naturalHeight * ie); g.restore();
    }
    var mk = cam.mascara(s);
    if (mk) {
      if (pessoa.width !== vw || pessoa.height !== vh) { pessoa.width = vw; pessoa.height = vh }
      var pg = pessoa.getContext('2d'); pg.globalCompositeOperation = 'source-over'; pg.clearRect(0, 0, vw, vh); pg.drawImage(mk, 0, 0); pg.globalCompositeOperation = 'source-in'; pg.drawImage(v, 0, 0); pg.globalCompositeOperation = 'source-over';
      g.drawImage(pessoa, dx, dy, dw, dh);
    }
    g.restore(); return true;
  };

  /* peça "Câmera ao vivo": só dentro do Estúdio. Liga quando a peça está na tela e desliga sozinha quando sai */
  cam.liga = function (el, o) {
    if (el.__cam) return; el.__cam = true;
    var p = o.props || {}, cv = el.querySelector('.ob-cam-cv'), ph = el.querySelector('.ob-cam-ph'), s = null, fundo = null, vivo = true;
    if (!cv) return;
    if (p.modo === 'imagem' && p.fundoMidia && EA.projetoAtual) { fundo = new Image(); fundo.src = EA.urlMidia(EA.projetoAtual, p.fundoMidia) }
    cam.pega().then(function () { return p.modo === 'normal' ? null : cam.recortador().catch(function () { return null }) }).then(function (seg) {
      s = seg; if (ph) ph.style.display = 'none';
      (function laco() {
        if (!el.isConnected) { vivo = false; cam.solta(); return }
        if (el.offsetParent !== null) {
          var W = Math.round(el.clientWidth), H = Math.round(el.clientHeight);
          if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H }
          cam.quadro(cv.getContext('2d'), W, H, p.modo || 'desfoca', fundo, p.espelho !== false, s);
        }
        requestAnimationFrame(laco);
      })();
    }, function (e) { el.__cam = false; cam.solta(); if (ph) ph.querySelector('span').textContent = 'Câmera: ' + IA.erro(e) });
  };

  /* gestos no Apresentar: 🖐️ mão aberta avança, ✊ punho volta (segurar meio segundo) */
  IA.gestos = function (aoGesto, aoEstado) {
    var rec = null, parar = false, atual = '', desde = 0, ultimo = 0;
    aoEstado('Ligando a câmera…');
    Promise.all([cam.pega(), IA.mp(), fetch(MP_MAO).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer() }), IA.gpu()]).then(function (q) {
      return q[1].M.GestureRecognizer.createFromOptions(q[1].fs, { baseOptions: { modelAssetBuffer: new Uint8Array(q[2]), delegate: q[3] ? 'GPU' : 'CPU' }, runningMode: 'VIDEO', numHands: 1 });
    }).then(function (r) {
      rec = r; if (parar) { rec.close(); cam.solta(); return }
      aoEstado('🖐️ avança · ✊ volta');
      var ultT = -1;
      (function laco() {
        if (parar) return;
        var v = cam.video;
        if (v && v.readyState >= 2 && v.currentTime !== ultT) {
          ultT = v.currentTime;
          var res = rec.recognizeForVideo(v, performance.now()), g = res.gestures && res.gestures[0] && res.gestures[0][0], nome = g && g.score > .6 ? g.categoryName : '';
          if (nome !== atual) { atual = nome; desde = performance.now() }
          if ((nome === 'Open_Palm' || nome === 'Closed_Fist') && performance.now() - desde > 500 && performance.now() - ultimo > 1200) { ultimo = performance.now(); aoGesto(nome === 'Open_Palm' ? 1 : -1) }
        }
        requestAnimationFrame(laco);
      })();
    }).catch(function (e) { parar = true; cam.solta(); aoEstado(IA.erro(e), true) });
    return function () { if (parar) return; parar = true; if (rec) { rec.close(); cam.solta() } };
  };

  /* ---------- transcrever imagem (Tesseract, modo caprichado: aprovado no teste) ---------- */
  var leitor = null;
  function amplia(src) {
    return new Promise(function (ok, erro) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { var f = im.width < 1600 ? 2 : 1, c = document.createElement('canvas'); c.width = im.width * f; c.height = im.height * f; var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.filter = 'grayscale(1) contrast(1.15)'; g.drawImage(im, 0, 0, c.width, c.height); ok(c) }; im.onerror = function () { erro(new Error('imagem que o navegador não abre')) }; im.src = src });
  }
  IA.transcreve = function (src, aoProgresso) {
    if (!leitor) {
      leitor = IA.ts().then(function (Ts) { return Ts.createWorker('por', 1, { langPath: CDN.tsPor, logger: function (m) { if (aoProgresso && m.progress != null && /loading|initializ/.test(m.status || '')) aoProgresso(m.progress) } }) });
      leitor.catch(function () { leitor = null });
    }
    return Promise.all([leitor, amplia(src)]).then(function (q) { return q[0].recognize(q[1]) }).then(function (r) { return r.data.text.replace(/\n{3,}/g, '\n\n').trim() });
  };
})();
