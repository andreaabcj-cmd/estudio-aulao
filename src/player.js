/* Apresentação: mostra os slides com passos, transições e quiz. É o mesmo código no botão Apresentar e no HTML exportado. */
(function () {
  var EA = window.EA;
  /* 13/11: número de entrada de cada peça. 0 = já aparece quando o slide abre; 1, 2, 3… = entra no clique 1, 2, 3…; mesmo número = entram juntas.
     Slide antigo, sem número: cada "no clique" ganha o próximo número e "junto com o anterior" fica com o mesmo dele, na ordem das peças (igual a antes).
     Slide com números (do PowerPoint ou já mexido): os números valem; peça posta depois com "no clique" e sem número entra depois de todos (regra de 09/11).
     Troca de objeto: troca.depois diz depois de qual clique ela vem; sem ele, no slide antigo fica na ordem das peças e no slide com números vai para o fim */
  /* 13/11: interativo novo (não o Ponto clicável) anda no clique da fila do slide: o número "Anda no clique".
     Padrão = o mesmo número em que ele entra (logo depois de entrar). false = só anda clicando em cima dele */
  EA.andaNo = function (o, nEntrada) {
    var d = o && o.tipo === 'ui' && o.props && EA.ELEMENTOS[o.props.modelo];
    if (!d || d.grupo !== 'hf' || o.props.andaNo === false) return null;
    return o.props.andaNo != null ? o.props.andaNo : (nEntrada || 0);
  };
  EA.numerosEntrada = function (s) {
    var n = {}, tr = {}, os = s.objs || [], comNum = os.some(function (o) { return (o.entrada && o.entrada.passo != null) || o.saida }), k = 0, tem = false, max = 0;
    function marca(v) { k = tem ? Math.max(k, v) : v; tem = true }
    if (comNum) os.forEach(function (o) {
      var en = o.entrada || {};
      if ((en.quando === 'clique' || en.quando === 'com') && en.passo != null) { n[o.id] = en.passo; marca(en.passo) }
      if (o.saida && o.saida.passo != null) marca(o.saida.passo);
    });
    os.forEach(function (o) {
      var en = o.entrada || {};
      if (n[o.id] == null) {
        if (en.quando === 'clique') { k = (tem ? k : 0) + 1; tem = true; n[o.id] = k }
        else if (en.quando === 'com') { if (!tem) { k = 1; tem = true } n[o.id] = k }
        else n[o.id] = 0;
      }
      if (o.troca && o.troca.por) tr[o.id] = o.troca.depois != null ? o.troca.depois : comNum ? Infinity : k;
    });
    os.forEach(function (o) { if (n[o.id] > max) max = n[o.id]; if (o.saida && o.saida.passo > max) max = o.saida.passo; var an = EA.andaNo(o, n[o.id]); if (an > max) max = an });
    return { n: n, troca: tr, max: max };
  };
  /* 13/11: os passos da apresentação, um por número (entradas e saídas do mesmo número juntas), em ordem; as trocas no lugar delas */
  EA.passosDoSlide = function (s) {
    var r = EA.numerosEntrada(s), g = {}, l = [];
    function pega(v) { if (!g[v]) { g[v] = { objs: [], sai: [] }; l.push({ k: v, t: 0, j: 0, p: g[v] }) } return g[v] }
    (s.objs || []).forEach(function (o, j) {
      var q = (o.entrada || {}).quando;
      if (q === 'clique' || q === 'com') pega(r.n[o.id]).objs.push(o);
      if (o.saida && o.saida.passo != null) pega(o.saida.passo).sai.push(o);
      if (o.troca && o.troca.por) l.push({ k: r.troca[o.id], t: 1, j: j, p: { troca: o } });
      var an = EA.andaNo(o, r.n[o.id]); if (an != null) l.push({ k: an, t: 2, j: j, p: { hf: o } });
    });
    l.sort(function (a, b) { return (a.k === b.k ? 0 : a.k < b.k ? -1 : 1) || a.t - b.t || a.j - b.j });
    return l.map(function (x) { return x.p });
  };
  /* 13/11: grava os números no slide (o editor chama antes de mudar um). A apresentação continua igual */
  EA.fixaNumeros = function (s) {
    var r = EA.numerosEntrada(s);
    (s.objs || []).forEach(function (o) {
      var en = o.entrada = o.entrada || { tipo: 'nenhuma', dur: .5, atraso: 0, quando: 'auto', som: '' }, v = r.n[o.id] || 0;
      en.quando = v || en.quando === 'clique' || en.quando === 'com' ? 'clique' : 'auto'; en.passo = v;
      if (o.troca && o.troca.por && isFinite(r.troca[o.id])) o.troca.depois = r.troca[o.id];
    });
  };
  EA.Player = function (fora, projeto, opts) {
    opts = opts || {};
    EA.projetoAtual = projeto;
    var self = this, i = -1, passos = [], passoAt = 0, camada = null, quiz = null, ocupado = false, pendente = null, slideEl = {};
    fora.classList.add('apresenta');
    EA.aplicaTema(fora, projeto.tema);
    fora.innerHTML = '<div class="apr-palco"><div class="palco"></div></div>' +
      '<div class="apr-barra"><button data-a="ant" title="Voltar (←)">‹</button><span class="apr-n"></span><button data-a="prox" title="Avançar (→ ou espaço)">›</button><div class="apr-prog"><i></i></div><button data-a="indice" title="Índice (I)">Índice</button><button data-a="notas" title="Notas (N)">Notas</button><button data-a="som" title="Som (M)">Som</button><button data-a="tela" title="Tela cheia (F)">Tela cheia</button>' + (EA.IA ? '<button data-a="gestos" title="Passar slide com a mão: 🖐️ avança, ✊ volta">🖐️ Gestos</button>' : '') + (opts.aoFechar ? '<button data-a="fechar" title="Sair (Esc)">Sair</button>' : '') + '</div>' +
      '<div class="apr-indice"></div><div class="apr-notas"></div>';
    var cx = fora.querySelector('.apr-palco'), palco = fora.querySelector('.palco'), bN = fora.querySelector('.apr-n'), bP = fora.querySelector('.apr-prog i'), eI = fora.querySelector('.apr-indice'), eNo = fora.querySelector('.apr-notas'), barra = fora.querySelector('.apr-barra');
    EA.aplicaTema(palco, projeto.tema);

    function ajusta() {
      var d = EA.dimSlide(projeto.slides[i]), f = Math.min(cx.clientWidth / d.w, cx.clientHeight / d.h);
      palco.style.transform = 'translate(-50%,-50%) scale(' + f + ')';
    }
    window.addEventListener('resize', ajusta);

    function monta(s) {
      var c = EA.el('div', 'palco-camada');
      EA.pintaFundo(c, s, projeto);
      var q = null;
      if (s.quiz) {
        var r = EA.el('div', 'quiz'); c.appendChild(r);
        q = EA.Quiz.montar(r, s.quiz, { projeto: projeto, aoContinuar: function () { self.proximo(true) } });
      }
      var els = {};
      s.objs.forEach(function (o) {
        var e = EA.criaObjeto(o, { projeto: projeto }); els[o.id] = e; c.appendChild(e);
        if (o.tipo === 'camera' && EA.IA) EA.IA.cam.liga(e, o);
        var dica = e.querySelector('.ui-cod-dica');
        if (dica) {   /* código: a parte que acende mostra a explicação dela embaixo */
          e.addEventListener('mouseover', function (ev) { var r = ev.target.closest('.ui-cod-real'); if (r && r.dataset.dica) { dica.textContent = r.dataset.dica; dica.classList.add('on') } });
          e.addEventListener('mouseout', function (ev) { if (ev.target.closest('.ui-cod-real')) dica.classList.remove('on') });
        }
        if (o.acao) { e.classList.add('tem-acao'); e.addEventListener('click', function (ev) { ev.stopPropagation(); acao(o.acao) }) }
      });
      /* 13/11: passos montados pelos números de entrada (EA.passosDoSlide): material antigo e do PowerPoint toca igual a antes */
      var ps = EA.passosDoSlide(s);
      EA.pintaOverlay(c, s);
      return { el: c, els: els, passos: ps, quiz: q };
    }
    function acao(a) {
      if (a.tipo === 'proximo') self.proximo(true);
      else if (a.tipo === 'slide') { var k = projeto.slides.findIndex(function (s) { return s.id === a.alvo }); if (k >= 0) self.ir(k) }
      else if (a.tipo === 'som') EA.Som.tocar(a.som, projeto);
      else if (a.tipo === 'link' && a.url) window.open(a.url, '_blank', 'noopener');
    }
    function revela(o, els, atrasoExtra) {
      var e = els[o.id]; if (!e) return;
      e.style.visibility = '';
      EA.tocaEntrada(e, o, { atraso: (o.entrada && o.entrada.atraso || 0) + (atrasoExtra || 0) });
      EA.tocaLoop(e, o);
      EA.tocaKf(e, o, (o.entrada && o.entrada.atraso || 0) + (atrasoExtra || 0), projeto);
      EA.ligaSprites(e, o, {});
      var v = e.querySelector('video'); if (v && o.props.tocar !== false) v.play().catch(function () { });
    }
    function comecaSlide(s, m, pular) {
      /* quem espera clique fica escondido; alvo de troca também */
      var esconde = {};
      s.objs.forEach(function (o) {
        var q = o.entrada && o.entrada.quando;
        if (q === 'clique' || q === 'com') esconde[o.id] = 1;
        if (o.troca && o.troca.por) esconde[o.troca.por] = 1;
      });
      s.objs.forEach(function (o) {
        if (esconde[o.id]) { m.els[o.id].style.visibility = 'hidden'; return }
        if (!pular || !pular[o.id]) revela(o, m.els);
        else { EA.tocaLoop(m.els[o.id], o); EA.ligaSprites(m.els[o.id], o, {}) }
      });
      if (s.som) EA.Som.tocar(s.som, projeto);
    }
    function mostraInfo() {
      var s = projeto.slides[i];
      bN.textContent = (i + 1) + ' / ' + projeto.slides.length;
      bP.style.width = ((i + 1) / projeto.slides.length * 100) + '%';
      eNo.innerHTML = s.notas ? EA.esc(s.notas).replace(/\n/g, '<br>') : '<em>Sem notas neste slide.</em>';
      [].forEach.call(eI.querySelectorAll('button'), function (b, k) { b.classList.toggle('on', k === i) });
    }
    this.ir = function (k, opc) {
      if (k < 0 || k >= projeto.slides.length) return;
      /* 09/11: pedido no meio de uma transição não se perde mais: fica guardado (só o último) e vale quando ela acabar */
      if (ocupado) { pendente = { k: k, opc: opc }; return }
      /* 09/11: narração e sons de arquivo do slide que sai param; a camada velha fica marcada para os sons com atraso dela não tocarem */
      if (EA.Som.pararMidias) EA.Som.pararMidias();
      if (camada) camada.setAttribute('data-saiu', '1');
      var velho = camada, sVelho = projeto.slides[i], s = projeto.slides[k], tr = s.trans || {}, tipo = opc && opc.seco ? 'nenhuma' : tr.tipo, dur = tr.dur == null ? .5 : tr.dur;
      /* slides de formatos diferentes não têm como animar juntos: troca direto, com um esmaecer do palco */
      var outroFormato = !!sVelho && EA.dimSlide(sVelho).w !== EA.dimSlide(s).w;
      if (outroFormato) tipo = 'nenhuma';
      if (EA.Musica) EA.Musica.aplica(projeto, k);
      var m = monta(s);
      palco.appendChild(m.el);
      i = k;
      EA.aplicaOrient(palco, s); ajusta();
      if (outroFormato && !(opc && opc.seco) && dur > 0) palco.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur * 1000 });
      camada = m.el; quiz = m.quiz; passos = m.passos; passoAt = 0; slideEl = m.els;
      var pular = null;
      if (tipo === 'magico' && sVelho && velho) { pular = EA.moverMagico(sVelho, s, m.el, dur) }
      comecaSlide(s, m, pular);
      mostraInfo();
      if (!velho) return;
      ocupado = true;
      EA.tocaTransicao(tipo === 'magico' ? 'cruzar' : tipo, velho, m.el, dur, palco).then(function () { ocupado = false; var p = pendente; pendente = null; if (p && !fechado) self.ir(p.k, p.opc) });
    };
    function darPasso() {
      var p = passos[passoAt++]; if (!p) return false;
      if (p.hf) {
        var w = slideEl[p.hf.id], el = w && w.querySelector('[data-hf]');
        /* ainda não entrou, ou já mostrou todos os passos: segue a fila no mesmo clique */
        if (!el || getComputedStyle(w).visibility === 'hidden' || el._hfFim === true || (el._hfFim == null && el._hfTocado)) return darPasso();
        el._hfTocado = true; passoAt--;
        var r = el.getBoundingClientRect();
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
        return true;
      }
      if (p.troca) {
        var o = p.troca, a = slideEl[o.id], b = slideEl[o.troca.por];
        if (a && b) { if (o.troca.som) EA.Som.tocar(o.troca.som, projeto); EA.tocaTroca(a, b, o.troca.efeito || 'cruzar', camada); var ob = projeto.slides[i].objs.find(function (x) { return x.id === o.troca.por }); if (ob) { EA.tocaLoop(b, ob); EA.ligaSprites(b, ob, {}) } }
      } else {
        p.objs.forEach(function (o) { revela(o, slideEl) });
        (p.sai || []).forEach(function (o) { var e = slideEl[o.id], sa = o.saida; if (e) e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.max(sa.dur || 0, .01) * 1000, delay: (sa.atraso || 0) * 1000, fill: 'forwards' }) });
      }
      return true;
    }
    this.proximo = function (forcar) {
      /* 09/11: clique comum durante a transição continua ignorado (senão pularia passos); avanço mandado (quiz, botão de ação) fica na fila */
      if (ocupado) { if (forcar && i < projeto.slides.length - 1) self.ir(i + 1); return }
      if (!forcar && quiz && quiz.avancar()) return;
      if (!forcar && darPasso()) return;
      if (i < projeto.slides.length - 1) self.ir(i + 1);
    };
    this.anterior = function () { if (i > 0) self.ir(i - 1, { seco: true }) };
    function alterna(el) { el.classList.toggle('ver') }
    function telaCheia() { if (document.fullscreenElement) document.exitFullscreen(); else if (fora.requestFullscreen) fora.requestFullscreen().catch(function () { }) }
    function teclas(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      /* digitando numa caixa (completar a frase): as teclas são do texto; só o Enter confirma */
      if (e.target && e.target.closest && e.target.closest('input,textarea')) { if (e.key === 'Enter' && quiz) { quiz.tecla('Enter'); e.preventDefault() } return }
      if (quiz && quiz.tecla(e.key)) { e.preventDefault(); return }
      switch (e.key) {
        case 'ArrowRight': case 'PageDown': case ' ': case 'Enter': e.preventDefault(); self.proximo(); break;
        case 'ArrowLeft': case 'PageUp': e.preventDefault(); self.anterior(); break;
        case 'Home': self.ir(0, { seco: true }); break;
        case 'End': self.ir(projeto.slides.length - 1, { seco: true }); break;
        case 'n': case 'N': alterna(eNo); break;
        case 'i': case 'I': alterna(eI); break;
        case 'f': case 'F': telaCheia(); break;
        case 'm': case 'M': EA.Som.mudo(!EA.Som.mudo()); fora.querySelector('[data-a=som]').classList.toggle('desl', EA.Som.mudo()); break;
        case 'Escape': if (opts.aoFechar && !document.fullscreenElement) self.fechar(); break;
      }
    }
    document.addEventListener('keydown', teclas);
    /* 09/11: com nome, para sair no fechar. Antes ficavam presos e a apresentação antiga continuava "viva" na seguinte */
    function cliqueFora(e) {
      var b = e.target.closest('[data-a]');
      if (b) {
        var a = b.dataset.a;
        if (a === 'prox') self.proximo(); else if (a === 'ant') self.anterior(); else if (a === 'indice') alterna(eI); else if (a === 'notas') alterna(eNo); else if (a === 'tela') telaCheia(); else if (a === 'gestos') gestos(); else if (a === 'fechar') self.fechar();
        else if (a === 'som') { EA.Som.mudo(!EA.Som.mudo()); b.classList.toggle('desl', EA.Som.mudo()) }
        return;
      }
      var k = e.target.closest('[data-ir]');
      if (k) { self.ir(+k.dataset.ir, { seco: true }); eI.classList.remove('ver'); return }
      if (e.target.closest('.apr-indice,.apr-notas')) return;
      if (e.target.closest('video,a,button,.tem-acao,.quiz')) return;
      self.proximo();
    }
    fora.addEventListener('click', cliqueFora);
    eI.innerHTML = '<h3>Índice</h3>' + projeto.slides.map(function (s, k) {
      var t = s.nome || (s.quiz ? 'Quiz' : ((s.objs.find(function (o) { return o.tipo === 'texto' }) || { props: {} }).props.html || '').replace(/<[^>]+>/g, '')) || 'Slide ' + (k + 1);
      return '<button data-ir="' + k + '"><span>' + String(k + 1).padStart(2, '0') + '</span>' + EA.esc(t).slice(0, 70) + '</button>';
    }).join('');
    /* a barra some quando o mouse fica parado */
    var tempoBarra;
    function mexeu() { barra.classList.remove('some'); clearTimeout(tempoBarra); tempoBarra = setTimeout(function () { barra.classList.add('some') }, 2600) }
    fora.addEventListener('mousemove', mexeu); mexeu();
    /* 09/11: gestos (só dentro do Estúdio). O botão mostra o que está acontecendo */
    var paraGestos = null;
    function gestos() {
      var b = fora.querySelector('[data-a=gestos]');
      if (paraGestos) { paraGestos(); paraGestos = null; b.textContent = '🖐️ Gestos'; b.classList.remove('on'); return }
      b.classList.add('on');
      paraGestos = EA.IA.gestos(function (d) { if (d > 0) self.proximo(); else self.anterior() }, function (txt, erro) { b.textContent = txt; if (erro) { paraGestos = null; b.classList.remove('on'); setTimeout(function () { b.textContent = '🖐️ Gestos' }, 4000) } });
    }
    var fechado = false;
    this.fechar = function () {
      if (fechado) return; fechado = true;
      fora.removeEventListener('click', cliqueFora); fora.removeEventListener('mousemove', mexeu); clearTimeout(tempoBarra);
      if (paraGestos) { paraGestos(); paraGestos = null }
      pendente = null; if (EA.Som.pararMidias) EA.Som.pararMidias();
      if (EA.Musica) EA.Musica.parar();
      document.removeEventListener('keydown', teclas); window.removeEventListener('resize', ajusta);
      if (document.fullscreenElement) document.exitFullscreen();
      fora.innerHTML = ''; fora.classList.remove('apresenta');
      if (opts.aoFechar) opts.aoFechar(i);
    };
    ajusta();
    if (EA.Musica && projeto.musicaVol != null) EA.Musica.volume(projeto.musicaVol);
    self.ir(opts.inicio || 0, { seco: true });
  };
})();
