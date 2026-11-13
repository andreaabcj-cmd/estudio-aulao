/* Editor: slides, palco com arrastar/redimensionar/girar, guias, desfazer, linha do tempo e arquivo. */
(function () {
  var EA = window.EA;
  function ic(n) { return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (window.ICONES_TABLER[n] || '') + '</svg>' }
  EA.ic = ic;
  /* 07/11 (os de frente/trás confundiam): dois quadrados; o cheio é o objeto escolhido, na frente ou atrás do outro */
  window.ICONES_TABLER['ea-frente'] = '<path d="M9 9V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3"/><rect x="3" y="9" width="11" height="11" rx="2" fill="currentColor"/><path d="M20 22v-6M17.5 18.5L20 16l2.5 2.5"/>';
  window.ICONES_TABLER['ea-tras'] = '<path d="M9 9V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3V9z" fill="currentColor"/><rect x="3" y="9" width="11" height="11" rx="2"/><path d="M20 16v6M17.5 19.5L20 22l2.5-2.5"/>';
  var E = EA.Ed = { p: null, si: 0, sel: [], t: 0, hist: [], histI: -1, k: 1, painel: null, timeline: false };
  var $ = function (s, r) { return (r || document).querySelector(s) };

  /* ---------- estrutura da tela ---------- */
  function montaTela() {
    $('#app').innerHTML =
      '<header class="ed-topo"><div class="ed-marca"><div class="ed-logo">' + ic('presentation') + '</div><div><input id="titulo" class="ed-titulo" spellcheck="false" aria-label="Nome do material"><small id="estado">Salvo neste computador</small></div></div>' +
      '<div class="ed-acoes"><button id="bMeus" title="Meus materiais">' + ic('folder') + 'Materiais</button><button id="bDesf" title="Desfazer (Ctrl+Z)" class="so-ic">' + ic('arrow-back-up') + '</button><button id="bRef" title="Refazer (Ctrl+Y)" class="so-ic">' + ic('arrow-forward-up') + '</button><span class="sep"></span>' +
      '<button id="bAbrir" title="Abrir um arquivo .aulao ou uma apresentação do PowerPoint / Google Slides (.pptx)">' + ic('file-import') + 'Abrir</button><button id="bSalvar" title="Salvar em arquivo .aulao (Ctrl+S)">' + ic('device-floppy') + 'Salvar arquivo</button><button id="bImagem" class="sec" title="O slide atual em PNG, 3840 × 2160 no horizontal e 2160 × 3840 no vertical">' + ic('photo') + 'Exportar imagem</button><button id="bExportar" class="sec" title="Um HTML só, que funciona sem internet">' + ic('file-export') + 'Exportar HTML</button><button id="bApr" class="prim" title="Apresentar (F5)">' + ic('player-play') + 'Apresentar</button></div></header>' +
      '<nav class="ed-inserir">' + [['modelos', 'layout-2', 'Modelos'], ['texto', 'typography', 'Texto'], ['formas', 'shape', 'Formas'], ['icones', 'icons', 'Ícones'], ['elementos', 'layout-cards', 'Elementos'], ['personagens', 'user-circle', 'Personagens'], ['efeitos', 'sparkles', 'Efeitos'], ['midia', 'photo', 'Mídia'], ['gravar', 'video', 'Gravar'], ['sons', 'volume', 'Sons']].map(function (b) { return '<button data-painel="' + b[0] + '">' + ic(b[1]) + '<span>' + b[2] + '</span></button>' }).join('') + '<span class="mola"></span><button id="bVideo" class="tg" title="Cortar o vídeo selecionado">' + ic('cut') + '<span>Editar vídeo</span></button><button id="bTempo" class="tg">' + ic('timeline') + '<span>Linha do tempo</span></button></nav>' +
      '<div class="ed-corpo"><aside class="ed-slides"><div id="lista"></div><button id="bNovo" class="ed-novo">' + ic('plus') + 'Novo slide</button></aside>' +
      '<aside class="ed-painel" id="painel" hidden></aside>' +
      '<main class="ed-centro"><div class="ed-area" id="area"><div class="ed-host" id="host"><div class="palco" id="palco"></div><div class="ed-guias" id="guias"></div><div class="ed-sel" id="caixaSel"></div></div></div><section class="ed-tempo" id="tempo" hidden></section></main>' +
      '<aside class="ed-insp" id="insp"></aside></div><input type="file" id="arqAbrir" accept=".aulao,.json,.pptx" hidden>';
    ligaBotoes();
  }

  /* ---------- histórico ---------- */
  function foto() { return JSON.stringify({ slides: E.p.slides, tema: E.p.tema, titulo: E.p.titulo }) }
  /* 09/11: mídia e volume da música ficam fora da foto do desfazer. Esta assinatura curta diz se mudaram, para o
     salvamento automático não deixar passar (subir um áudio ou mexer no volume não salvava) */
  function fora() { var m = E.p.midia || {}; return Object.keys(m).map(function (k) { return k + ':' + ((m[k] && m[k].dados) || '').length }).join() + '|' + E.p.musicaVol }
  var fotoAtual = null, foraAtual = null, tempoSalva = null, juntaAtual = null, juntaT = 0;
  /* 09/11: junta = nome de uma rajada (setas do teclado, digitar o nome do material). A rajada inteira vira um passo só
     do desfazer, em vez de um por tecla, que enchia o histórico e voltava 1 px por vez */
  EA.mudou = function (leve, junta) {
    var f = foto(), x = fora();
    if (f === fotoAtual) { if (x !== foraAtual) { foraAtual = x; marcaSalvar() } return }
    var agora = Date.now();
    if (junta && junta === juntaAtual && agora - juntaT < 1200 && E.histI > 0 && E.histI === E.hist.length - 1) E.hist[E.histI] = f;
    else { E.hist = E.hist.slice(0, E.histI + 1); E.hist.push(f); if (E.hist.length > 80) E.hist.shift() }
    juntaAtual = junta || null; juntaT = agora;
    E.histI = E.hist.length - 1; fotoAtual = f; foraAtual = x;
    marcaSalvar();
    if (!leve) miniatura(E.si);
  };
  function marcaSalvar() {
    var e = $('#estado'); if (e) e.textContent = 'Salvando…';
    clearTimeout(tempoSalva);
    tempoSalva = setTimeout(function () { tempoSalva = null; if (!E.p) return; grava(E.p) }, 500);
  }
  /* 09/11: o mesmo material aberto em duas abas. Quando a outra aba guarda, esta fica "atrasada": avisa, e o próximo
     salvamento daqui vai para uma CÓPIA (identidade nova), para não passar por cima do trabalho feito lá */
  var outraAba = false;
  function avisaOutraAba() {
    var e = $('#estado'); if (e) e.textContent = 'Alterado em outra aba: aqui vira cópia';
    EA.aviso('Este material foi alterado em outra aba. Recarregue esta página para ver a versão nova. Se continuar mexendo aqui, guardo como uma cópia, sem apagar a outra.');
  }
  if (EA.Guardar.ouve) EA.Guardar.ouve(function (m) {
    if (!m || m.t !== 'salvou' || !E.p || m.id !== E.p.id || outraAba) return;
    outraAba = true; avisaOutraAba();
  });
  /* 09/11: todo salvamento no navegador passa por aqui: trata a cópia da outra aba e nunca deixa a falha sem aviso */
  function grava(p, avisar) {
    if (outraAba && p === E.p) {
      outraAba = false; p.id = EA.uid(); p.titulo = (p.titulo || 'Material') + ' (outra aba)';
      var ti = $('#titulo'); if (ti) ti.value = p.titulo;
      EA.aviso('Este material foi alterado em outra aba. O que você fez aqui ficou guardado como cópia: "' + p.titulo + '".');
    }
    return EA.Guardar.salva(p).then(function () {
      var e = $('#estado'); if (e && p === E.p && !tempoSalva && !outraAba) e.textContent = 'Salvo neste computador';
    }, function (x) {
      console.error(x);
      var e = $('#estado'); if (e && p === E.p) e.textContent = 'Não consegui salvar: use Salvar arquivo';
      if (avisar) EA.aviso('Não consegui guardar neste navegador. Use "Salvar arquivo" para não perder o material.');
    });
  }
  function volta(k) {
    if (k < 0 || k >= E.hist.length) return;
    E.histI = k; fotoAtual = E.hist[k]; juntaAtual = null;
    var d = JSON.parse(E.hist[k]);
    E.p.slides = d.slides; E.p.tema = d.tema; E.p.titulo = d.titulo;
    E.si = EA.limita(E.si, 0, E.p.slides.length - 1); E.sel = E.sel.filter(acha);
    tudo(); marcaSalvar();
  }

  /* ---------- acesso ---------- */
  function slide() { return E.p.slides[E.si] }
  function acha(id) { return slide().objs.find(function (o) { return o.id === id }) }
  EA.slideAtual = slide; EA.objAtual = function () { return E.sel.length === 1 ? acha(E.sel[0]) : null }; EA.objsSel = function () { return E.sel.map(acha).filter(Boolean) };

  /* ---------- miniaturas ---------- */
  function lista() {
    var l = $('#lista'); l.innerHTML = '';
    E.p.slides.forEach(function (s, k) {
      var b = EA.el('div', 'ed-mini' + (k === E.si ? ' on' : ''));
      b.dataset.k = k; b.draggable = true;
      b.innerHTML = '<span class="ed-mini-n">' + (k + 1) + '</span>' + (s.musica ? '<span class="ed-mini-mus" title="' + EA.esc(s.musica === 'parar' ? 'A música para aqui' : 'Começa aqui: ' + EA.Musica.nome(s.musica, E.p)) + '">' + ic(s.musica === 'parar' ? 'music-off' : 'music') + '</span>' : '') + '<div class="ed-mini-v"></div><div class="ed-mini-a"><button data-a="dup" title="Duplicar">' + ic('copy') + '</button><button data-a="del" title="Apagar">' + ic('trash') + '</button></div>';
      $('.ed-mini-v', b).appendChild(EA.slideEstatico(s, E.p, 164));
      l.appendChild(b);
    });
  }
  EA.listaSlides = lista;
  function miniatura(k) {
    var b = $('.ed-mini[data-k="' + k + '"]'); if (!b) return;
    var v = $('.ed-mini-v', b); v.innerHTML = ''; v.appendChild(EA.slideEstatico(E.p.slides[k], E.p, 164));
  }
  EA.miniatura = function () { miniatura(E.si) };

  /* ---------- palco ---------- */
  function ajusta() {
    var d = EA.dimSlide(slide()), a = $('#area'), f = Math.min((a.clientWidth - 40) / d.w, (a.clientHeight - 40) / d.h);
    E.k = Math.max(.2, f);
    var h = $('#host'); h.style.width = d.w * E.k + 'px'; h.style.height = d.h * E.k + 'px';
    $('#palco').style.transform = 'scale(' + E.k + ')';
    desenhaSel();
  }
  var quizAqui = null;
  function desenha() {
    var pa = $('#palco'), s = slide();
    EA.aplicaTema(pa, E.p.tema); pa.innerHTML = ''; pa.style.background = '';
    EA.aplicaOrient(pa, s);
    var largura = EA.dimSlide(s).w; if (largura !== E.larguraPalco) { E.larguraPalco = largura; ajusta() }
    EA.pintaFundo(pa, s, E.p);
    if (s.quiz) pa.appendChild(EA.Quiz.previa(s.quiz, E.p));
    s.objs.forEach(function (o) {
      var est = E.t > 0 && EA.temKf(o) ? EA.estadoEm(o, E.t) : (o.kf && o.kf.length ? EA.estadoEm(o, E.t) : o);
      /* o personagem aparece com a animação e o lado que valem no instante da agulha */
      var oAgora = EA.comEfetivo(o, E.t);
      var e = EA.criaObjeto(oAgora, { projeto: E.p, estatico: true });
      EA.geometria(e, est);
      pa.appendChild(e);
      vivo(e, oAgora);
    });
    EA.pintaOverlay(pa, s);
    desenhaSel();
  }
  /* no editor personagens e efeitos mexem de verdade, para ver o que vai sair */
  function vivo(e, o) {
    if (o.tipo === 'camera' && o.props.verAqui && EA.IA) EA.IA.cam.liga(e, o);
    if (o.tipo === 'lutador' || o.tipo === 'efeito' || o.tipo === 'rig') {
      var s = EA.ligaSprites(e, o, {});
      if (s && o.tipo === 'efeito' && !s.cfg.loop) { s.cfg.loop = true; s.aoFim = null; $('.ob-sprite', e).style.opacity = 1 }
    }
    var v = $('video', e); if (v) { v.muted = true; v.currentTime = .01 }
  }
  EA.redesenha = function () { desenha(); miniatura(E.si) };
  /* gráficos, balão e efeitos desenham na medida do objeto: depois de mudar o tamanho, desenha de novo */
  EA.refazConteudo = function (o) {
    if (o.tipo !== 'ui' && o.tipo !== 'apres' && o.tipo !== 'forma') return;
    var e = elDe(o.id), l = e && $('.ob-l', e); if (!l) return;
    var g = estadoAtual(o);
    l.innerHTML = EA.conteudo(Object.assign({}, o, { w: g.w, h: g.h }), { projeto: E.p, estatico: true });
  };
  /* 09/11: o painel Músicas, se estiver aberto, é refeito junto (ficava com o slide antigo depois de desfazer ou duplicar) */
  function tudo() { $('#titulo').value = E.p.titulo; lista(); desenha(); EA.Inspetor.mostra(); timeline(); botoesDesf(); if (EA.Paineis && EA.Paineis.redesenhaMus) EA.Paineis.redesenhaMus() }
  EA.tudo = tudo;
  function botoesDesf() { $('#bDesf').disabled = E.histI <= 0; $('#bRef').disabled = E.histI >= E.hist.length - 1 }

  /* caixa de seleção */
  var ALCAS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  /* cantos: a bolinha fica na altura da de girar e marca, na horizontal, onde a curva termina */
  function campoCanto(o) {
    var p = o.props;
    if (o.tipo === 'forma') return !EA.FORMA_PONTOS[p.forma] && p.forma !== 'circulo' && p.forma !== 'linha' ? { k: 'raio', pad: 14 } : null;
    if (o.tipo === 'video') return { k: 'raio', pad: 0 };
    if (o.tipo === 'ui' && EA.ELEMENTOS[p.modelo] && EA.ELEMENTOS[p.modelo].raio != null) return { k: 'raio', pad: EA.ELEMENTOS[p.modelo].raio };
    if (o.tipo !== 'imagem') return null;
    if (!p.masc) return { k: 'raio', pad: 0 };
    return EA.MASCARAS[p.masc] === EA.MASCARAS.ret ? { k: 'raioMasc', pad: 14 } : null;
  }
  function cantoMax(g) { return Math.min(g.w, g.h) / 2 }
  /* em pixels de tela; num quadrado, para antes de cair em cima da bolinha azul */
  function cantoX(o, g, cc) {
    var v = o.props[cc.k], r = v == null ? cc.pad : v;
    return Math.min(Math.min(r, cantoMax(g)) * E.k, Math.max(0, g.w * E.k / 2 - 22));
  }
  function pintaCanto(o) {
    var e = elDe(o.id), m = e && $('.ob-masc', e), l = e && $('.ob-preenche', e);
    if (m) m.style.clipPath = EA.clipMascara(o.props); else if (l) l.style.borderRadius = o.props.raio + 'px';
  }
  /* 13/11: na aba Animação, cada peça que entra mostra no canto de cima à esquerda o número do clique (0 = já está quando o slide abre).
     Fica nesta camada só do editor, fora da peça girada: não vai para miniatura, imagem, HTML nem apresentação */
  function pintaNumeros(c) {
    if (!EA.Inspetor || !EA.Inspetor.aba || EA.Inspetor.aba() !== 'anim' || !EA.numerosEntrada) return;
    var s = slide(), r = EA.numerosEntrada(s), K = E.k || 1;
    s.objs.forEach(function (o) {
      var v = r.n[o.id] || 0, en = o.entrada || {};
      if (!(v >= 1 || (en.tipo && en.tipo !== 'nenhuma'))) return;
      var g = estadoAtual(o), a = (g.rot || 0) * Math.PI / 180, fx = -g.w / 2 - 13 / K, fy = -g.h / 2 - 13 / K;
      var x = g.x + g.w / 2 + fx * Math.cos(a) - fy * Math.sin(a), y = g.y + g.h / 2 + fx * Math.sin(a) + fy * Math.cos(a);
      var b = EA.el('i', 'sel-num' + (v >= 1 ? '' : ' zero') + (E.sel.indexOf(o.id) >= 0 ? ' on' : ''), String(v));
      b.dataset.num = o.id; b.title = (v >= 1 ? 'Entra no clique ' + v : 'Já aparece quando o slide abre') + ': ' + nomeObj(o);
      b.style.left = x * K + 'px'; b.style.top = y * K + 'px';
      if (v >= 1) b.style.background = EA.corPasso ? EA.corPasso(v) : '';
      c.appendChild(b);
    });
  }
  function desenhaSel() {
    var c = $('#caixaSel'); c.innerHTML = '';
    pintaNumeros(c);
    var os = EA.objsSel();
    if (!os.length) return;
    var um = os.length === 1 ? os[0] : null;
    if (um) {
      var g = estadoAtual(um);
      var b = EA.el('div', 'sel-caixa' + (um.travado ? ' trav' : ''));
      b.style.cssText = 'left:' + g.x * E.k + 'px;top:' + g.y * E.k + 'px;width:' + g.w * E.k + 'px;height:' + g.h * E.k + 'px;transform:rotate(' + (g.rot || 0) + 'deg)';
      if (E.ajustando === um.id) { montaCorte(b, um); c.appendChild(b); botoesDesf(); return }
      if (um.travado) b.innerHTML = '<i class="sel-cadeado" title="Travado">' + ic('lock') + '</i>';
      if (!um.travado) b.innerHTML = ALCAS.map(function (a) { return '<i class="alca a-' + a + '" data-alca="' + a + '"></i>' }).join('') + '<i class="alca-gira" data-alca="gira"></i>';
      if (!um.travado && um.tipo === 'ui' && um.props.modelo === 'balao' && E.sel.length === 1) {
        var cau = um.props.cauda || EA.CAUDA_PADRAO;
        if (!cau.sem) {
          var ld = EA.balaoLado(g.w, g.h, cau);
          if (ld) { var bx = ld.lado === 'n' || ld.lado === 's' ? ld.c : (ld.lado === 'l' ? g.w : 0), by = ld.lado === 'o' || ld.lado === 'l' ? ld.c : (ld.lado === 's' ? g.h : 0); b.insertAdjacentHTML('beforeend', '<i class="alca-base" data-alca="base" title="Deslizar a base do rabinho" style="left:' + bx * E.k + 'px;top:' + by * E.k + 'px"></i>') }
          b.insertAdjacentHTML('beforeend', '<i class="alca-cauda" data-alca="cauda" title="Mover e esticar o rabinho" style="left:' + cau.x * g.w * E.k + 'px;top:' + cau.y * g.h * E.k + 'px"></i>');
        }
      }
      var cc = !um.travado && campoCanto(um);
      if (cc) b.insertAdjacentHTML('beforeend', '<i class="alca-canto" data-alca="canto" title="Arredondar os cantos" style="left:' + cantoX(um, g, cc) + 'px"></i>');
      if (!um.travado && um.tipo === 'rig' && um.props.posar && um.props.pose) {
        /* o esqueleto: ossos desenhados por cima e uma bolinha para cada junta que mexe */
        var cr = um.props.corte || { x: 0, y: 0, w: 1, h: 1 }, jt = EA.Rig.juntas(um.props, g.w * cr.w, g.h * cr.h), W = g.w * E.k, H = g.h * E.k, ox = cr.x * g.w, oy = cr.y * g.h;
        b.insertAdjacentHTML('beforeend', '<svg class="sel-ossos" width="' + W + '" height="' + H + '">' + jt.ossos.map(function (q) { return '<line x1="' + (q[0] + ox) * E.k + '" y1="' + (q[1] + oy) * E.k + '" x2="' + (q[2] + ox) * E.k + '" y2="' + (q[3] + oy) * E.k + '"/>' }).join('') + '</svg>');
        jt.bolas.forEach(function (q) { b.insertAdjacentHTML('beforeend', '<i class="alca-osso" data-alca="osso" data-j="' + q.k + '" style="left:' + (q.x + ox) * E.k + 'px;top:' + (q.y + oy) * E.k + 'px"></i>') });
      }
      c.appendChild(b);
    } else os.forEach(function (o) {
      var g = estadoAtual(o), b = EA.el('div', 'sel-caixa multi');
      b.style.cssText = 'left:' + g.x * E.k + 'px;top:' + g.y * E.k + 'px;width:' + g.w * E.k + 'px;height:' + g.h * E.k + 'px;transform:rotate(' + (g.rot || 0) + 'deg)';
      c.appendChild(b);
    });
    botoesDesf();
  }
  EA.desenhaSel = desenhaSel;
  function estadoAtual(o) { return o.kf && o.kf.length ? EA.estadoEm(o, E.t) : o }
  function aplicaGeo(o, g) {
    /* com keyframes: guarda no instante da agulha. Sem keyframes e com a agulha adiante: cria a animação */
    if (E.t > 0 || (o.kf && o.kf.length)) {
      if (!o.kf || !o.kf.length) o.kf = [{ t: 0, x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot, op: o.op }];
      var q = o.kf.find(function (f) { return Math.abs(f.t - E.t) < .06 });
      if (!q) { q = Object.assign({ t: E.t, ease: 'suave' }, EA.estadoEm(o, E.t)); o.kf.push(q); o.kf.sort(function (a, b) { return a.t - b.t }) }
      Object.assign(q, g);
      if (q.t === 0) Object.assign(o, g);
    } else Object.assign(o, g);
  }
  EA.aplicaGeo = aplicaGeo;
  /* a marca do instante da agulha; cria se ainda não houver */
  E.marcaAqui = function (o) {
    var g = estadoAtual(o);
    aplicaGeo(o, { x: g.x, y: g.y, w: g.w, h: g.h, rot: g.rot, op: g.op });
    return EA.kfMarca(o, E.t);
  };
  /* ---------- máscara: escolher a forma e ajustar a foto dentro dela ---------- */
  var CORTAVEIS = { imagem: 1, boneco: 1, lutador: 1, rig: 1, desenho: 1 };
  E.cortavel = function (o) { return !!CORTAVEIS[o.tipo] };
  function lugarDaFoto(e, k) { return e && $(k === '2' ? '.ui-post-a' : '.ui-foto', e) }
  /* a moldura, em pixels do objeto: a caixa inteira ou, em cartão e post, só o lugar da foto */
  function quadroCorte(o, k) {
    var g = estadoAtual(o);
    if (o.tipo !== 'ui') return { x: 0, y: 0, w: g.w, h: g.h };
    var e = elDe(o.id), n = lugarDaFoto(e, k), x = 0, y = 0, q = n;
    if (!n) return { x: 0, y: 0, w: g.w, h: g.h };
    while (q && q !== e) { x += q.offsetLeft; y += q.offsetTop; q = q.offsetParent; if (q && q !== e) { x += q.clientLeft; y += q.clientTop } }
    return { x: x, y: y, w: n.offsetWidth, h: n.offsetHeight };
  }
  /* proporção da imagem inteira */
  function proporcao(o, k) {
    var c = o.props['corte' + k], fr = quadroCorte(o, k);
    if (c) return c.w * fr.w / (c.h * fr.h);
    var e = elDe(o.id), r = o.tipo === 'ui' ? lugarDaFoto(e, k) : e, i = r && $('img', r);
    return i && i.naturalWidth ? i.naturalWidth / i.naturalHeight : fr.w / fr.h;
  }
  function cobre(ar, fr) { var w = Math.max(1, fr.h * ar / fr.w); return { w: w, h: w * fr.w / (ar * fr.h) } }
  /* a primeira vez: o corte começa exatamente como a foto já aparece */
  function corteDeHoje(o, k) {
    var p = o.props, fr = quadroCorte(o, k), ar = proporcao(o, k), u;
    if (o.tipo === 'imagem' && !p.masc) {
      if ((p.ajuste || 'contain') === 'fill') return { x: 0, y: 0, w: 1, h: 1 };
      if ((p.ajuste || 'contain') === 'contain') { var z = Math.min(1, fr.h * ar / fr.w) === 1 ? 1 : fr.h * ar / fr.w, hh = z * fr.w / (ar * fr.h); return { x: (1 - z) / 2, y: (1 - hh) / 2, w: z, h: hh } }
      u = cobre(ar, fr); return { x: (1 - u.w) / 2, y: p.topo ? 0 : (1 - u.h) / 2, w: u.w, h: u.h };
    }
    if (o.tipo !== 'imagem' && o.tipo !== 'ui') return { x: 0, y: 0, w: 1, h: 1 };
    var f = k === '2' ? { x: 50, y: 0, z: 1 } : EA.posFoto(p), ox = f.x / 100, oy = f.y / 100;
    u = cobre(ar, fr);
    return { x: ox + ((1 - u.w) * ox - ox) * f.z, y: oy + ((1 - u.h) * oy - oy) * f.z, w: u.w * f.z, h: u.h * f.z };
  }
  function garanteCorte(o, k) { if (!o.props['corte' + k]) { o.props['corte' + k] = corteDeHoje(o, k); desenha() } return o.props['corte' + k] }
  E.pintaFoto = function (o, k) {
    k = k || '';
    var e = elDe(o.id), c = o.props['corte' + k], r = o.tipo === 'ui' ? lugarDaFoto(e, k) : e, i = r && $('.ob-corte-i', r); if (!i || !c) return;
    i.style.left = c.x * 100 + '%'; i.style.top = c.y * 100 + '%'; i.style.width = c.w * 100 + '%'; i.style.height = c.h * 100 + '%';
  };
  /* zoom: 1 = a foto cobrindo a moldura. Aproxima em volta do meio da moldura */
  E.zoomDe = function (o, k) {
    var c = o.props['corte' + k]; if (!c) return k ? 1 : (o.props.zoom || 1);
    return c.w / cobre(proporcao(o, k), quadroCorte(o, k)).w;
  };
  E.poeZoom = function (o, k, z) {
    var c = garanteCorte(o, k), fr = quadroCorte(o, k), ar = proporcao(o, k), u = cobre(ar, fr), r = EA.limita(z, .2, 6) * u.w / c.w;
    c.x = .5 - (.5 - c.x) * r; c.y = .5 - (.5 - c.y) * r; c.w *= r; c.h *= r;
    E.pintaFoto(o, k); if (E.ajustando === o.id) desenhaSel();
  };
  /* a caixa mudou: a imagem não deforma, cresce por igual e mantém o centro no mesmo ponto */
  function reescala(c0, g0, ng) {
    var s = Math.max(ng.w / g0.w, ng.h / g0.h), w = c0.w * g0.w * s / ng.w, h = c0.h * g0.h * s / ng.h;
    return { x: c0.x + c0.w / 2 - w / 2, y: c0.y + c0.h / 2 - h / 2, w: w, h: h };
  }
  E.reescalaCorte = function (o, c0, g0, ng) { o.props.corte = reescala(c0, g0, ng); E.pintaFoto(o) };
  /* a moldura mudou e a imagem fica parada no slide. l, t, r, b: bordas novas em pixels do objeto antigo */
  function moldura(o, g0, c0, l, t, r, b) {
    var w = r - l, h = b - t, an = (g0.rot || 0) * Math.PI / 180, dx = l + w / 2 - g0.w / 2, dy = t + h / 2 - g0.h / 2, cx = g0.x + g0.w / 2 + dx * Math.cos(an) - dy * Math.sin(an), cy = g0.y + g0.h / 2 + dx * Math.sin(an) + dy * Math.cos(an);
    var ng = { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w: Math.round(w), h: Math.round(h) };
    aplicaGeo(o, ng);
    o.props.corte = { x: (c0.x * g0.w - l) / ng.w, y: (c0.y * g0.h - t) / ng.h, w: c0.w * g0.w / ng.w, h: c0.h * g0.h / ng.h };
    var e = elDe(o.id); if (e) EA.geometria(e, Object.assign({}, estadoAtual(o), ng));
    E.pintaFoto(o);
  }
  /* a imagem apagada que aparece por fora da moldura; a mesma peça, para não piscar ao arrastar */
  function fantasma(o, k) {
    if (E.fantasmaEl) return E.fantasmaEl;
    var e = elDe(o.id), r = o.tipo === 'ui' ? lugarDaFoto(e, k) : e, f = EA.el('div', 'corte-fantasma'), orig = r && $('.ob-corte-i', r);
    if (orig) {
      [].forEach.call(orig.children, function (n) { f.appendChild(n.cloneNode(true)) });
      [].forEach.call(orig.querySelectorAll('canvas'), function (cv, i) { var nv = f.querySelectorAll('canvas')[i]; nv.width = cv.width; nv.height = cv.height; nv.getContext('2d').drawImage(cv, 0, 0) });
    }
    return (E.fantasmaEl = f);
  }
  function montaCorte(b, o) {
    var k = E.ajusteK, c = o.props['corte' + k]; if (!c) return;
    b.className = 'sel-caixa ajustando';
    var fr = quadroCorte(o, k), K = E.k, ix = (fr.x + c.x * fr.w) * K, iy = (fr.y + c.y * fr.h) * K, iw = c.w * fr.w * K, ih = c.h * fr.h * K;
    var f = fantasma(o, k); f.style.cssText = 'left:' + ix + 'px;top:' + iy + 'px;width:' + iw + 'px;height:' + ih + 'px'; b.appendChild(f);
    var im = '<div class="corte-img" style="left:' + ix + 'px;top:' + iy + 'px;width:' + iw + 'px;height:' + ih + 'px">' + ['nw', 'ne', 'se', 'sw'].map(function (a) { return '<i class="corte-ci a-' + a + '" data-alca="ci-' + a + '" title="Aumentar ou diminuir a imagem"></i>' }).join('') + '</div>';
    var q = '<div class="corte-q" style="left:' + fr.x * K + 'px;top:' + fr.y * K + 'px;width:' + fr.w * K + 'px;height:' + fr.h * K + 'px">' + (o.tipo === 'ui' ? '' : ALCAS.map(function (a) { return '<i class="corte-qa a-' + a + '" data-alca="cq-' + a + '" title="Cortar"></i>' }).join('')) + '</div>';
    b.insertAdjacentHTML('beforeend', im + q + '<span class="sel-dica" style="top:' + (Math.min(iy, fr.y * K) - 50) + 'px;left:' + (fr.x + fr.w / 2) * K + 'px">' + (o.tipo === 'ui' ? 'Arraste a imagem' : 'Arraste a imagem · bordas pretas cortam') + ' · rodinha aproxima · Esc termina</span>');
  }
  E.poeMascara = function (o, k) {
    var p = o.props, def = EA.MASCARAS[k];
    if (!k) { delete p.masc; delete p.zoom; delete p.fx; delete p.fy; delete p.fundoMasc; delete p.raioMasc; if (E.ajustando === o.id) E.fimAjuste(); EA.mudou(); desenha(); EA.Inspetor.mostra(); return }
    var estreia = !p.masc, e = elDe(o.id), im = e && $('img', e), ar = im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1;
    p.masc = k;
    if (estreia) {
      if (p.fx == null) p.fx = 50;
      if (p.fy == null) p.fy = p.topo || ar < .95 ? 12 : 50;       /* em foto em pé, o rosto costuma estar em cima */
    }
    /* na primeira máscara, forma que pede caixa quadrada acerta sozinha, sem sair do lugar; depois a caixa é sua */
    var g = estadoAtual(o);
    if (estreia && def.quadrada && Math.abs(g.w - g.h) > 1) { var l = Math.min(g.w, g.h), ng0 = { x: Math.round(g.x + (g.w - l) / 2), y: Math.round(g.y + (g.h - l) / 2), w: l, h: l }; if (p.corte) p.corte = reescala(p.corte, g, ng0); aplicaGeo(o, ng0) }
    EA.mudou(); desenha(); EA.Inspetor.mostra();
  };
  E.comecaAjuste = function (o, k) {
    k = k || '';
    if (E.ajustando) E.fimAjuste();
    E.corteAntes = o.props['corte' + k] ? JSON.stringify(o.props['corte' + k]) : null;
    garanteCorte(o, k);
    E.corteInicio = JSON.stringify(o.props['corte' + k]);
    E.ajustando = o.id; E.ajusteK = k; E.fantasmaEl = null;
    document.body.classList.add('ajustando-foto'); desenhaSel(); EA.Inspetor.mostra();
  };
  E.fimAjuste = function () {
    if (!E.ajustando) return;
    var o = acha(E.ajustando), k = E.ajusteK || '';
    E.ajustando = null; E.ajusteK = ''; E.fantasmaEl = null;
    document.body.classList.remove('ajustando-foto');
    /* abriu e não mexeu: fica tudo como estava */
    if (o && !E.corteAntes && JSON.stringify(o.props['corte' + k]) === E.corteInicio) { delete o.props['corte' + k]; desenha() }
    else if (o) { var c = o.props['corte' + k]; if (c && o.tipo !== 'ui' && Math.abs(c.x) < .002 && Math.abs(c.y) < .002 && Math.abs(c.w - 1) < .002 && Math.abs(c.h - 1) < .002 && o.tipo !== 'imagem') { delete o.props['corte' + k]; desenha() } }
    desenhaSel(); EA.mudou(); EA.miniatura(); EA.Inspetor.mostra();
  };
  function elDe(id) { return $('#palco [data-id="' + id + '"]') }
  function seleciona(ids, somar) {
    if (somar) { ids.forEach(function (i) { var k = E.sel.indexOf(i); if (k >= 0) E.sel.splice(k, 1); else E.sel.push(i) }) } else E.sel = ids;
    desenhaSel(); EA.Inspetor.mostra(); timeline();
  }
  EA.seleciona = seleciona;

  /* guias: bordas e centro do palco e dos outros objetos */
  function linhasGuia(excluir) {
    var ds = EA.dimSlide(slide()), xs = [0, ds.w / 2, ds.w], ys = [0, ds.h / 2, ds.h];
    slide().objs.forEach(function (o) { if (excluir.indexOf(o.id) >= 0) return; var g = estadoAtual(o); xs.push(g.x, g.x + g.w / 2, g.x + g.w); ys.push(g.y, g.y + g.h / 2, g.y + g.h) });
    return { xs: xs, ys: ys };
  }
  function encaixa(vals, linhas) {
    var melhor = null, lim = 6 / E.k;
    vals.forEach(function (v) { linhas.forEach(function (l) { var d = l - v; if (Math.abs(d) < lim && (melhor === null || Math.abs(d) < Math.abs(melhor.d))) melhor = { d: d, l: l } }) });
    return melhor;
  }
  function guias(xl, yl) {
    var g = $('#guias'); g.innerHTML = '';
    if (xl != null) { var a = EA.el('i', 'g-v'); a.style.left = xl * E.k + 'px'; g.appendChild(a) }
    if (yl != null) { var b = EA.el('i', 'g-h'); b.style.top = yl * E.k + 'px'; g.appendChild(b) }
  }

  /* cartão e post: guarda o tamanho do lugar da foto para ela não deformar quando o elemento muda de tamanho */
  function fotosDoElemento(o) {
    if (o.tipo !== 'ui') return null;
    var l = [];
    ['', '2'].forEach(function (k) { var c = o.props['corte' + k]; if (c) { var q = quadroCorte(o, k); l.push({ k: k, c: Object.assign({}, c), g: { w: q.w, h: q.h } }) } });
    return l.length ? l : null;
  }
  /* um ponto do palco em pixels do objeto, mesmo girado */
  function emObjeto(g, x, y) {
    var a = -(g.rot || 0) * Math.PI / 180, rx = x - (g.x + g.w / 2), ry = y - (g.y + g.h / 2);
    return { x: rx * Math.cos(a) - ry * Math.sin(a) + g.w / 2, y: rx * Math.sin(a) + ry * Math.cos(a) + g.h / 2 };
  }
  /* ---------- arrastar ---------- */
  function ligaPalco() {
    var host = $('#host'), arr = null;
    host.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0) return;
      if (ev.target.isContentEditable) return;
      if (editando) fimEdicao();
      /* 13/11: clicar no número do clique escolhe a peça */
      var num = ev.target.dataset && ev.target.dataset.num;
      if (num && acha(num)) { seleciona([num]); return }
      var alca = ev.target.dataset && ev.target.dataset.alca;
      var r = host.getBoundingClientRect(), px = (ev.clientX - r.left) / E.k, py = (ev.clientY - r.top) / E.k;
      if (E.ajustando) {
        var ob0 = acha(E.ajustando), k0 = E.ajusteK || '', c0 = ob0 && ob0.props['corte' + k0];
        if (ob0 && c0) {
          var g0 = Object.assign({}, estadoAtual(ob0)), fr0 = quadroCorte(ob0, k0), base = { o: ob0, k: k0, g0: g0, fr: fr0, c0: Object.assign({}, c0), px: px, py: py };
          if (alca && /^c[qi]-/.test(alca)) { arr = Object.assign(base, { tipo: alca.slice(0, 2) === 'cq' ? 'corteQ' : 'corteI', canto: alca.slice(3) }); host.setPointerCapture(ev.pointerId); return }
          /* clicou na imagem ou na moldura: arrasta a imagem. Fora das duas: termina */
          var lc = emObjeto(g0, px, py), ix0 = fr0.x + c0.x * fr0.w, iy0 = fr0.y + c0.y * fr0.h;
          var naImg = lc.x >= ix0 && lc.x <= ix0 + c0.w * fr0.w && lc.y >= iy0 && lc.y <= iy0 + c0.h * fr0.h, naMold = lc.x >= fr0.x && lc.x <= fr0.x + fr0.w && lc.y >= fr0.y && lc.y <= fr0.y + fr0.h;
          if (naImg || naMold) { arr = Object.assign(base, { tipo: 'foto' }); host.setPointerCapture(ev.pointerId); return }
        }
        E.fimAjuste();
        alca = null;
      }
      if (alca && EA.objAtual()) {
        var o = EA.objAtual(); arr = { tipo: alca === 'gira' ? 'gira' : alca === 'cauda' || alca === 'base' || alca === 'canto' || alca === 'osso' ? alca : 'muda', alca: alca, j: ev.target.dataset.j, o: o, g0: Object.assign({}, estadoAtual(o)), corte0: o.props.corte ? Object.assign({}, o.props.corte) : null, lugares: fotosDoElemento(o), px: px, py: py, razao: o.tipo === 'lutador' || o.tipo === 'efeito' || o.tipo === 'boneco' || o.tipo === 'icone' || o.tipo === 'rig' || o.tipo === 'desenho' || (o.tipo === 'ui' && EA.ELEMENTOS[o.props.modelo] && EA.ELEMENTOS[o.props.modelo].razao) };
      } else {
        var e = ev.target.closest('.ob');
        if (e && !$('#palco').contains(e)) e = null;
        var id = e && e.dataset.id;
        var ob = id && acha(id);
        if (ob && ob.travado && E.sel.indexOf(id) < 0) { seleciona([id]); return }
        if (id) {
          if (ev.shiftKey || ev.ctrlKey) seleciona([id], true);
          else if (E.sel.indexOf(id) < 0) seleciona([id]);
          var os = EA.objsSel().filter(function (x) { return !x.travado });
          arr = { tipo: 'move', os: os, ini: os.map(function (x) { return Object.assign({}, estadoAtual(x)) }), px: px, py: py, moveu: false };
        } else {
          if (!ev.shiftKey) seleciona([]);
          arr = { tipo: 'laco', px: px, py: py, el: EA.el('div', 'laco') };
          host.appendChild(arr.el);
        }
      }
      host.setPointerCapture(ev.pointerId);
    });
    host.addEventListener('pointermove', function (ev) {
      if (!arr) return;
      var r = host.getBoundingClientRect(), x = (ev.clientX - r.left) / E.k, y = (ev.clientY - r.top) / E.k, dx = x - arr.px, dy = y - arr.py;
      if (arr.tipo === 'move') {
        if (!arr.moveu && Math.abs(dx) + Math.abs(dy) < 3 / E.k) return;
        arr.moveu = true;
        var a = arr.ini[0], lin = linhasGuia(arr.os.map(function (o) { return o.id })), xl = null, yl = null;
        if (a && !ev.altKey && arr.os.length === 1) {
          var nx = a.x + dx, ny = a.y + dy, ex = encaixa([nx, nx + a.w / 2, nx + a.w], lin.xs), ey = encaixa([ny, ny + a.h / 2, ny + a.h], lin.ys);
          if (ex) { dx += ex.d; xl = ex.l } if (ey) { dy += ey.d; yl = ey.l }
        }
        guias(xl, yl);
        arr.os.forEach(function (o, k) {
          var i = arr.ini[k], g = { x: Math.round(i.x + dx), y: Math.round(i.y + dy) };
          aplicaGeo(o, g);
          var e = elDe(o.id); if (e) { e.style.left = g.x + 'px'; e.style.top = g.y + 'px' }
        });
        desenhaSel();
      } else if (arr.tipo === 'muda') {
        /* 09/11: a conta é feita nas bordas do objeto, em pixels dele (a ideia de moldura()), e o centro novo é girado de volta
           para o palco: com o objeto girado, a borda oposta fica parada. O tamanho mínimo segura a borda que anda, não a oposta */
        var g0 = arr.g0, an = (g0.rot || 0) * Math.PI / 180, c = Math.cos(-an), s = Math.sin(-an), lx = dx * c - dy * s, ly = dx * s + dy * c, h = arr.alca, MIN = 12, be = 0, bc = 0, bd = g0.w, bb = g0.h;
        if (/e/.test(h)) bd = Math.max(g0.w + lx, MIN); if (/w/.test(h)) be = Math.min(lx, g0.w - MIN);
        if (/s/.test(h)) bb = Math.max(g0.h + ly, MIN); if (/n/.test(h)) bc = Math.min(ly, g0.h - MIN);
        if ((arr.razao && h.length === 2) !== ev.shiftKey && h.length === 2) {
          var rz = g0.w / g0.h, nw = Math.max(bd - be, (bb - bc) * rz); var nh = nw / rz;
          if (/w/.test(h)) be = bd - nw; else bd = be + nw; if (/n/.test(h)) bc = bb - nh; else bb = bc + nh;
        }
        var lw = Math.max(MIN, Math.round(bd - be)), lh = Math.max(MIN, Math.round(bb - bc));
        if (/w/.test(h)) be = bd - lw; else bd = be + lw; if (/n/.test(h)) bc = bb - lh; else bb = bc + lh;
        var mx0 = (be + bd) / 2 - g0.w / 2, my0 = (bc + bb) / 2 - g0.h / 2;
        var ng = { x: Math.round(g0.x + g0.w / 2 + mx0 * c + my0 * s - lw / 2), y: Math.round(g0.y + g0.h / 2 - mx0 * s + my0 * c - lh / 2), w: lw, h: lh };
        aplicaGeo(arr.o, ng);
        var ee = elDe(arr.o.id); if (ee) { EA.geometria(ee, Object.assign({}, estadoAtual(arr.o), ng)) }
        if (arr.corte0 && arr.o.tipo !== 'ui') E.reescalaCorte(arr.o, arr.corte0, g0, ng);
        if (arr.lugares) arr.lugares.forEach(function (q) { var f = quadroCorte(arr.o, q.k); arr.o.props['corte' + q.k] = reescala(q.c, q.g, f); E.pintaFoto(arr.o, q.k) });
        desenhaSel();
      } else if (arr.tipo === 'foto') {
        /* a imagem vai para onde o mouse for, sem limite; perto das bordas da moldura ela encosta, Alt solta */
        var an1 = -(arr.g0.rot || 0) * Math.PI / 180, ldx = dx * Math.cos(an1) - dy * Math.sin(an1), ldy = dx * Math.sin(an1) + dy * Math.cos(an1), c1 = arr.o.props['corte' + arr.k], f1 = arr.fr, nx1 = arr.c0.x * f1.w + ldx, ny1 = arr.c0.y * f1.h + ldy, iw1 = arr.c0.w * f1.w, ih1 = arr.c0.h * f1.h, lim1 = 6 / E.k;
        if (!ev.altKey) {
          var ax = [0, f1.w - iw1, (f1.w - iw1) / 2], ay = [0, f1.h - ih1, (f1.h - ih1) / 2];
          ax.forEach(function (v) { if (Math.abs(nx1 - v) < lim1) nx1 = v }); ay.forEach(function (v) { if (Math.abs(ny1 - v) < lim1) ny1 = v });
        }
        c1.x = nx1 / f1.w; c1.y = ny1 / f1.h;
        E.pintaFoto(arr.o, arr.k);
        desenhaSel();
      } else if (arr.tipo === 'corteI') {
        /* alça azul: aumenta ou diminui a imagem inteira, sem deformar, com o canto oposto parado */
        var c2 = arr.o.props['corte' + arr.k], f2 = arr.fr, p2 = emObjeto(arr.g0, x, y), ix2 = f2.x + arr.c0.x * f2.w, iy2 = f2.y + arr.c0.y * f2.h, iw2 = arr.c0.w * f2.w, ih2 = arr.c0.h * f2.h, le = /w/.test(arr.canto), ci = /n/.test(arr.canto);
        var fixoX = le ? ix2 + iw2 : ix2, fixoY = ci ? iy2 + ih2 : iy2, s2 = Math.max(.02, Math.max(Math.abs(p2.x - fixoX) / iw2, Math.abs(p2.y - fixoY) / ih2)), nw2 = iw2 * s2, nh2 = ih2 * s2;
        c2.x = ((le ? fixoX - nw2 : fixoX) - f2.x) / f2.w; c2.y = ((ci ? fixoY - nh2 : fixoY) - f2.y) / f2.h; c2.w = nw2 / f2.w; c2.h = nh2 / f2.h;
        E.pintaFoto(arr.o, arr.k);
        desenhaSel();
      } else if (arr.tipo === 'corteQ') {
        /* borda preta: muda só a moldura. Pode até passar da imagem; a imagem fica parada no slide */
        var p3 = emObjeto(arr.g0, x, y), g3 = arr.g0, l3 = 0, t3 = 0, r3 = g3.w, b3 = g3.h, cq = arr.canto, m3 = 16;
        if (/w/.test(cq)) l3 = Math.min(p3.x, r3 - m3); if (/e/.test(cq)) r3 = Math.max(p3.x, l3 + m3);
        if (/n/.test(cq)) t3 = Math.min(p3.y, b3 - m3); if (/s/.test(cq)) b3 = Math.max(p3.y, t3 + m3);
        moldura(arr.o, g3, arr.c0, l3, t3, r3, b3);
        desenhaSel();
      } else if (arr.tipo === 'cauda' || arr.tipo === 'base') {
        /* o ponteiro em coordenadas do balão, mesmo girado */
        var gb = arr.g0, ab = -(gb.rot || 0) * Math.PI / 180, cxb = gb.x + gb.w / 2, cyb = gb.y + gb.h / 2, rx = x - cxb, ry = y - cyb, ux = rx * Math.cos(ab) - ry * Math.sin(ab) + gb.w / 2, uy = rx * Math.sin(ab) + ry * Math.cos(ab) + gb.h / 2;
        var pc = arr.o.props; if (!pc.cauda) pc.cauda = EA.clona(EA.CAUDA_PADRAO);
        if (arr.tipo === 'cauda') { pc.cauda.x = Math.round(ux / gb.w * 1000) / 1000; pc.cauda.y = Math.round(uy / gb.h * 1000) / 1000 }
        else { var lb = EA.balaoLado(gb.w, gb.h, pc.cauda); if (lb) pc.cauda.pos = EA.limita(lb.lado === 'n' || lb.lado === 's' ? ux / gb.w : uy / gb.h, 0, 1) }
        var pb = elDe(arr.o.id) && $('.ui-balao2 path', elDe(arr.o.id)); if (pb) pb.setAttribute('d', EA.balaoPath(gb.w, gb.h, pc.cauda));
        arr.mudouCauda = true;
        desenhaSel();
      } else if (arr.tipo === 'osso') {
        var go = arr.g0, lo = emObjeto(go, x, y), co = arr.o.props.corte || { x: 0, y: 0, w: 1, h: 1 };
        EA.Rig.arrasta(arr.o.props, arr.j, lo.x - co.x * go.w, lo.y - co.y * go.h, go.w * co.w, go.h * co.h);
        EA.Rig.aplica(elDe(arr.o.id), arr.o);
        desenhaSel();
      } else if (arr.tipo === 'canto') {
        /* o ponteiro em coordenadas do objeto, mesmo girado */
        var gc = arr.g0, ac = -(gc.rot || 0) * Math.PI / 180, ucx = (x - (gc.x + gc.w / 2)) * Math.cos(ac) - (y - (gc.y + gc.h / 2)) * Math.sin(ac) + gc.w / 2;
        arr.o.props[campoCanto(arr.o).k] = Math.round(EA.limita(ucx, 0, cantoMax(gc)));
        pintaCanto(arr.o);
        desenhaSel();
      } else if (arr.tipo === 'gira') {
        var g = arr.g0, cx = g.x + g.w / 2, cy = g.y + g.h / 2, ang = Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90;
        if (ev.shiftKey || Math.abs(((ang % 90) + 90) % 90) < 3) ang = Math.round(ang / (ev.shiftKey ? 15 : 90)) * (ev.shiftKey ? 15 : 90);
        ang = Math.round(((ang % 360) + 360) % 360);
        aplicaGeo(arr.o, { rot: ang });
        var er = elDe(arr.o.id); if (er) er.style.transform = 'rotate(' + ang + 'deg)';
        desenhaSel();
      } else if (arr.tipo === 'laco') {
        var lx0 = Math.min(x, arr.px), ly0 = Math.min(y, arr.py);
        arr.el.style.cssText = 'left:' + lx0 * E.k + 'px;top:' + ly0 * E.k + 'px;width:' + Math.abs(dx) * E.k + 'px;height:' + Math.abs(dy) * E.k + 'px';
        arr.caixa = { x: lx0, y: ly0, w: Math.abs(dx), h: Math.abs(dy) };
      }
    });
    function solta() {
      if (!arr) return;
      guias(null, null);
      if (arr.tipo === 'laco') {
        arr.el.remove();
        if (arr.caixa && arr.caixa.w > 5) {
          var c = arr.caixa, dentro = slide().objs.filter(function (o) { var g = estadoAtual(o); return g.x < c.x + c.w && g.x + g.w > c.x && g.y < c.y + c.h && g.y + g.h > c.y }).map(function (o) { return o.id });
          seleciona(dentro);
        }
      } else if (arr.tipo !== 'move' || arr.moveu) {
        if (arr.tipo === 'muda') EA.refazConteudo(arr.o);
        EA.mudou(); EA.Inspetor.atualizaGeo(); timeline();
        if (arr.tipo === 'osso') EA.miniatura();
      }
      arr = null;
    }
    host.addEventListener('pointerup', solta); host.addEventListener('pointercancel', solta);
    /* rodinha: aproxima e afasta a foto enquanto ajusta */
    host.addEventListener('wheel', function (ev) {
      if (!E.ajustando) return;
      var o = acha(E.ajustando); if (!o) return;
      ev.preventDefault();
      var kz = E.ajusteK || '', nz = E.zoomDe(o, kz) * (ev.deltaY < 0 ? 1.08 : 1 / 1.08);
      E.poeZoom(o, kz, nz);
      var zz = $('#insp [data-zoom="' + kz + '"]'); if (zz) zz.value = Math.round(nz * 100);
      clearTimeout(host.tRoda); host.tRoda = setTimeout(function () { EA.mudou() }, 300);
    }, { passive: false });
    /* edição de texto no próprio palco */
    host.addEventListener('dblclick', function (ev) {
      /* o arrastar captura o ponteiro: o alvo real é o que está embaixo do mouse */
      /* dois cliques dentro do corte: termina, como no Google Slides */
      if (E.ajustando) { E.fimAjuste(); return }
      var sob = document.elementFromPoint(ev.clientX, ev.clientY), e = sob && sob.closest('#palco .ob'); if (!e) return;
      var o = acha(e.dataset.id); if (!o) return;
      if (CORTAVEIS[o.tipo]) { if (!o.travado) { E.sel = [o.id]; E.comecaAjuste(o) } return }
      /* foto de cartão, post ou site: dois cliques cortam; no modelo cinza, lembra onde escolher */
      var lugar = o.tipo === 'ui' && sob.closest('.ui-foto, .ui-post-a');
      if (lugar) {
        var kl = lugar.classList.contains('ui-post-a') ? '2' : '';
        if (o.props['midia' + kl] || o.props['src' + kl]) { if (!o.travado) { E.sel = [o.id]; E.comecaAjuste(o, kl) } }
        else EA.aviso('Escolha ou suba a foto no painel Design, à direita.');
        return;
      }
      var campo = sob.closest('[data-campo]') || $('[data-campo]', e);
      if (campo) comecaEdicao(o, campo);
    });
    /* 09/11: escutas do documento entram uma vez só, mesmo que a tela seja montada de novo (senão colava em dobro) */
    if (!docLigado.palco) { docLigado.palco = 1; document.addEventListener('pointerdown', function (ev) { if (editando && !editando.campo.contains(ev.target) && !ev.target.closest('.in-alinha')) fimEdicao() }, true) }
    host.addEventListener('input', function () { if (editando && guardaEdicao()) marcaSalvar() });
    host.addEventListener('contextmenu', function (ev) {
      var e = ev.target.closest('.ob'); if (!e) return;
      ev.preventDefault();
      if (E.sel.indexOf(e.dataset.id) < 0) seleciona([e.dataset.id]);
      menuObjeto(ev.clientX, ev.clientY);
    });
  }
  var editando = null, docLigado = {};
  function comecaEdicao(o, campo) {
    editando = { o: o, campo: campo };
    campo.contentEditable = 'true'; campo.classList.add('editando'); campo.focus();
    var r = document.createRange(); r.selectNodeContents(campo); var s = getSelection(); s.removeAllRanges(); s.addRange(r);
    $('#caixaSel').style.display = 'none';
  }
  /* 09/11: passa o que está escrito na caixa para o material, sem sair da edição. Assim o texto que ainda está sendo
     digitado entra no salvamento automático, no Salvar arquivo e não se perde ao fechar a aba. Devolve true se mudou */
  function guardaEdicao() {
    if (!editando) return false;
    var o = editando.o, c = editando.campo, k = c.dataset.campo, h = c.innerHTML;
    if (o.tipo === 'ui' && o.props.modelo === 'codigo' && k === 't') h = EA.esc(EA.codigoTexto(h)).replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');   /* sem as marcas de destaque */
    var antes = o.tipo === 'texto' ? o.props.html : (o.props.campos || {})[k];
    if (o.tipo === 'texto') o.props.html = h; else if (o.props.campos) o.props.campos[k] = h;
    return antes !== h;
  }
  function fimEdicao() {
    if (!editando) return;
    guardaEdicao();
    var c = editando.campo;
    c.contentEditable = 'false'; c.classList.remove('editando');
    editando = null; $('#caixaSel').style.display = '';
    EA.mudou(); EA.Inspetor.mostra();
  }
  EA.fimEdicao = fimEdicao;
  EA.editando = function () { return !!editando };
  /* negrito, itálico e sublinhado: no trecho selecionado; sem seleção, na caixa inteira */
  /* 12/11: o que vem colado de fora vira texto com formatação simples; nenhum estilo, classe ou fonte de fora entra */
  var COLA_OK = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', UL: 'ul', OL: 'ol', LI: 'li', BR: 'br', P: 'div', DIV: 'div', H1: 'div', H2: 'div', H3: 'div', H4: 'div', H5: 'div', H6: 'div', TR: 'div', BLOCKQUOTE: 'div' };
  function limpaColado(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html'), sai = document.createElement('div');
    (function anda(de, para) {
      [].forEach.call(de.childNodes, function (n) {
        if (n.nodeType === 3) { para.appendChild(document.createTextNode(n.nodeValue.replace(/[\r\n]+/g, ' '))); return }
        if (n.nodeType !== 1 || /^(SCRIPT|STYLE|META|LINK|TITLE|HEAD|IMG|SVG|IFRAME|OBJECT|TEMPLATE)$/.test(n.tagName)) return;
        var st = (n.getAttribute('style') || '').toLowerCase(), t = COLA_OK[n.tagName], alvo = para;
        if (!t && n.tagName === 'SPAN') t = /font-weight:\s*(bold|[6-9]00)/.test(st) ? 'b' : /font-style:\s*italic/.test(st) ? 'i' : /text-decoration[^;]*underline/.test(st) ? 'u' : '';
        if (t) { alvo = document.createElement(t); para.appendChild(alvo); if (t === 'br') return }
        anda(n, alvo);
      });
    })(doc.body, sai);
    return sai.innerHTML.replace(/^\s+|\s+$/g, '');
  }
  EA.limpaColado = limpaColado;
  EA.formataTexto = function (o, cmd) {
    var s = getSelection();
    function naCaixa(campo) { var r = document.createRange(); r.selectNodeContents(campo); s.removeAllRanges(); s.addRange(r); document.execCommand(cmd) }
    if (editando) {
      if (!s.isCollapsed && editando.campo.contains(s.anchorNode)) { document.execCommand(cmd); return }
      naCaixa(editando.campo); s.collapseToEnd(); return;
    }
    var e = elDe(o.id), campo = e && $('[data-campo]', e); if (!campo) return;
    campo.contentEditable = 'true'; campo.focus();
    naCaixa(campo);
    o.props.html = campo.innerHTML;
    campo.contentEditable = 'false'; s.removeAllRanges(); campo.blur();
    EA.mudou(); EA.miniatura();
  };

  function menuObjeto(x, y) {
    fechaMenu();
    var m = EA.el('div', 'ed-menu');
    m.style.left = x + 'px'; m.style.top = y + 'px';
    [['Duplicar', 'duplicar', 'Ctrl+D'], ['Copiar', 'copiar', 'Ctrl+C'], ['Trazer para a frente', 'frente', ''], ['Levar para trás', 'tras', ''], ['Virar para o outro lado', 'virar', ''], ['Travar / destravar', 'trava', ''], ['Apagar', 'apagar', 'Del']].forEach(function (i) {
      var b = EA.el('button', '', i[0] + '<small>' + i[2] + '</small>'); b.onclick = function () { fechaMenu(); EA.acao(i[1]) }; m.appendChild(b);
    });
    /* 09/11: baixar de novo a própria imagem ou vídeo (e a legenda). O que já vem no Estúdio (src) não entra */
    var os = EA.objsSel(), um = os.length === 1 ? os[0] : null, md = um && (um.tipo === 'imagem' || um.tipo === 'video') && um.props.midia && E.p.midia[um.props.midia];
    if (md && (md.dados || md.url)) {
      var ext = function (u, pad) { var q = /^data:(\w+)\/([\w+.-]+)/.exec(u || ''); return q ? ({ jpeg: 'jpg', 'svg+xml': 'svg', quicktime: 'mov', 'x-matroska': 'mkv' }[q[2]] || q[2]) : pad };
      var nomeBase = String(md.nome || (um.tipo === 'video' ? 'video' : 'imagem')).replace(/\.[\w]{2,4}$/, '').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'midia';
      var sv = EA.el('button', '', 'Salvar no computador<small></small>');
      sv.onclick = function () { fechaMenu(); fetch(md.url || md.dados).then(function (r) { return r.blob() }).then(function (bl) { EA.Guardar.baixa(bl, nomeBase + '.' + ext(md.dados, um.tipo === 'video' ? 'webm' : 'png')) }) };
      m.insertBefore(sv, m.lastChild);
      if (um.tipo === 'video' && um.props.legenda && um.props.legenda.cues && um.props.legenda.cues.length) {
        var sl = EA.el('button', '', 'Salvar a legenda (.srt)<small></small>');
        sl.onclick = function () {
          fechaMenu();
          var t = function (x) { var ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), mi = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000, z = function (n, k) { return ('000' + n).slice(-k) }; return z(h, 2) + ':' + z(mi, 2) + ':' + z(s, 2) + ',' + z(r, 3) };
          var srt = um.props.legenda.cues.map(function (c, i) { return (i + 1) + '\r\n' + t(c.i) + ' --> ' + t(Math.max(c.f, c.i + .3)) + '\r\n' + c.t + '\r\n' }).join('\r\n');
          EA.Guardar.baixa(new Blob(['﻿' + srt], { type: 'application/x-subrip' }), nomeBase + '.srt');
        };
        m.insertBefore(sl, m.lastChild);
      }
    }
    document.body.appendChild(m);
    setTimeout(function () { document.addEventListener('pointerdown', fechaMenuFora) }, 0);
  }
  function fechaMenuFora(e) { if (!e.target.closest('.ed-menu')) fechaMenu() }
  function fechaMenu() { var m = $('.ed-menu'); if (m) m.remove(); document.removeEventListener('pointerdown', fechaMenuFora) }

  /* ---------- ações ---------- */
  /* 09/11: copiar um objeto põe uma marca nossa na área de transferência do sistema. Ao colar, a cópia de dentro só vale
     se a marca ainda estiver lá; se você copiou outra coisa depois (um print, um texto), vale o que está no sistema */
  var clip = null, MARCA = 'estudio-aulao/objetos/' + EA.uid(), clipSemMarca = false, copiaForcada = false, nCopias = 0;
  /* o foco está num campo de escrever? (régua, cor, caixinha e lista não contam: neles Ctrl+Z e Delete são do slide) */
  function campoTexto() {
    var a = document.activeElement, t = a && a.tagName;
    return EA.editando() || (!!a && (t === 'TEXTAREA' || a.isContentEditable || (t === 'INPUT' && !/^(range|color|checkbox|radio|button|file)$/.test(a.type))));
  }
  function livre() { return !!E.p && !$('#apresenta').classList.contains('apresenta') && !document.querySelector('.ed-modal') }
  function aoCopiar(ev) {
    if (!copiaForcada && (!livre() || campoTexto())) return;
    var os = EA.objsSel(); if (!os.length) return;      /* nada selecionado: a cópia anterior continua valendo */
    nCopias++; clip = EA.clona(os);
    if (ev.clipboardData) { ev.clipboardData.setData('text/plain', MARCA); ev.preventDefault(); clipSemMarca = false } else clipSemMarca = true;
    if (ev.type === 'cut') EA.acao('apagar');
  }
  EA.acao = function (a) {
    var s = slide(), os = EA.objsSel();
    /* alinhar não mexe nos travados */
    if (/^(centrar|meio|esq|dir|topo|base)$/.test(a)) os = os.filter(function (o) { return !o.travado });
    switch (a) {
      case 'apagar': if (!os.length) return;
        /* travado não se apaga sem querer (08/11) */
        if (os.some(function (o) { return o.travado })) { if (os.every(function (o) { return o.travado })) { EA.aviso('Está travado. Destrave no cadeado para apagar.'); return } E.sel = os.filter(function (o) { return !o.travado }).map(function (o) { return o.id }); EA.aviso('Os travados ficaram.') }
        s.objs = s.objs.filter(function (o) { return E.sel.indexOf(o.id) < 0 }); s.objs.forEach(function (o) { if (o.troca && E.sel.indexOf(o.troca.por) >= 0) o.troca = null }); E.sel = []; break;
      case 'duplicar': if (!os.length) return; var nov = os.map(function (o) { var c = EA.clona(o); delete c.travado; c.id = EA.uid(); c.liga = EA.uid(); c.x += 24; c.y += 24; c.troca = null; (c.kf || []).forEach(function (f) { f.x += 24; f.y += 24 }); return c }); s.objs = s.objs.concat(nov); E.sel = nov.map(function (o) { return o.id }); break;
      /* 09/11: pelo menu não existe o evento de copiar: pede um ao navegador; se ele negar, tenta a área de transferência direto */
      case 'copiar': if (!os.length) return; clip = EA.clona(os); clipSemMarca = true; copiaForcada = true; try { document.execCommand('copy') } catch (x) { } copiaForcada = false;
        if (clipSemMarca && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(MARCA).then(function () { clipSemMarca = false }, function () { });
        return;
      /* 09/11: a cópia colada leva as marcas de animação junto (caía em cima do original) e não nasce travada */
      case 'colar': if (!clip || !clip.length) return; var col = clip.map(function (o) { var c = EA.clona(o); delete c.travado; c.id = EA.uid(); c.x += 24; c.y += 24; c.troca = null; (c.kf || []).forEach(function (f) { if (f.x != null) f.x += 24; if (f.y != null) f.y += 24 }); return c }); s.objs = s.objs.concat(col); E.sel = col.map(function (o) { return o.id }); break;
      case 'frente': os.forEach(function (o) { s.objs.splice(s.objs.indexOf(o), 1); s.objs.push(o) }); break;
      case 'tras': os.slice().reverse().forEach(function (o) { s.objs.splice(s.objs.indexOf(o), 1); s.objs.unshift(o) }); break;
      case 'trava': os.forEach(function (o) { o.travado = !o.travado }); break;
      case 'virar': if (!os.length) return; os.forEach(function (o) {
        /* com a linha do tempo aberta e a agulha adiante, a virada fica marcada naquele instante */
        if (E.timeline && E.t > .05) { var m = E.marcaAqui(o); m.vira = !EA.efetivoEm(o, E.t).vira }
        else { o.props = o.props || {}; o.props.vira = !o.props.vira }
      }); break;
      case 'centrar': os.forEach(function (o) { aplicaGeo(o, { x: Math.round((EA.dimSlide(s).w - o.w) / 2) }) }); break;
      case 'meio': os.forEach(function (o) { aplicaGeo(o, { y: Math.round((EA.dimSlide(s).h - o.h) / 2) }) }); break;
      case 'esq': var mn = Math.min.apply(null, os.map(function (o) { return o.x })); os.forEach(function (o) { aplicaGeo(o, { x: mn }) }); break;
      case 'dir': var mx = Math.max.apply(null, os.map(function (o) { return o.x + o.w })); os.forEach(function (o) { aplicaGeo(o, { x: mx - o.w }) }); break;
      case 'topo': var mt = Math.min.apply(null, os.map(function (o) { return o.y })); os.forEach(function (o) { aplicaGeo(o, { y: mt }) }); break;
      case 'base': var mb = Math.max.apply(null, os.map(function (o) { return o.y + o.h })); os.forEach(function (o) { aplicaGeo(o, { y: mb - o.h }) }); break;
      default: return;
    }
    EA.mudou(); desenha(); EA.Inspetor.mostra(); timeline();
  };
  /* insere objeto no centro; ou troca o selecionado, mantendo lugar e animações */
  EA.insere = function (o, centrar) {
    if (E.trocando && EA.objAtual()) {
      var v = EA.objAtual();
      o.id = v.id; o.liga = v.liga; o.x = v.x; o.y = v.y; o.rot = v.rot; o.op = v.op; o.entrada = v.entrada; o.loop = v.loop; o.kf = v.kf; o.kfRepete = v.kfRepete; o.troca = v.troca; o.acao = v.acao;
      var f = Math.min(v.w / o.w, v.h / o.h), nw = Math.round(o.w * f), nh = Math.round(o.h * f);   // cabe na caixa do antigo, centrado
      o.x = Math.round(v.x + (v.w - nw) / 2); o.y = Math.round(v.y + (v.h - nh) / 2); o.w = nw; o.h = nh;
      slide().objs[slide().objs.indexOf(v)] = o;
      E.trocando = false; document.body.classList.remove('trocando');
    } else {
      /* os botões do painel guardam um molde: cada um colocado no slide precisa de identidade própria */
      o.id = EA.uid(); o.liga = EA.uid();
      var dn = EA.dimSlide(slide());
      if (dn.h > dn.w && o.w > dn.w - 40) { var rz = (dn.w - 40) / o.w; o.w = Math.round(o.w * rz); o.h = Math.round(o.h * rz) }   // no slide em pé, o que é largo precisa caber
      if (centrar !== false) { o.x = Math.round((dn.w - o.w) / 2); o.y = Math.round((dn.h - o.h) / 2) }
      slide().objs.push(o);
    }
    E.sel = [o.id];
    EA.mudou(); desenha(); EA.Inspetor.mostra(); timeline();
  };
  /* gira um estado (objeto ou marca de animação) 90 graus em volta do centro do slide */
  function giraEstado(g, base, paraPe) {
    var w = g.w == null ? base.w : g.w, h = g.h == null ? base.h : g.h, x = g.x == null ? base.x : g.x, y = g.y == null ? base.y : g.y, r = g.rot == null ? (base.rot || 0) : g.rot;
    var cx = x + w / 2, cy = y + h / 2, nx = paraPe ? EA.H - cy : cy, ny = paraPe ? cx : EA.H - cx;
    g.x = nx - w / 2; g.y = ny - h / 2; g.rot = r + (paraPe ? 90 : -90);
  }
  /* muda o formato do slide: o que já está nele gira junto; o que entrar depois entra em pé */
  E.orientar = function (v) {
    var s = slide(), paraPe = v === 'v';
    if (s.quiz || (s.orient === 'v') === paraPe) return;
    if (editando) fimEdicao();
    s.objs.forEach(function (o) {
      (o.kf || []).forEach(function (f) { giraEstado(f, o, paraPe) });
      giraEstado(o, o, paraPe);
    });
    var f = s.fundo;
    if (f && f.tipo === 'gradiente') f.ang = (((f.ang || 135) + (paraPe ? 90 : -90)) + 360) % 360 || 360;
    if (f && f.tipo === 'imagem' && f.midia) {
      var ang = (f.giro && f.giro.midia === f.midia ? f.giro.ang : 0) + (paraPe ? 90 : -90);
      if (ang) f.giro = { midia: f.midia, ang: ang }; else delete f.giro;
    }
    if (paraPe) s.orient = 'v'; else delete s.orient;
    EA.mudou(); tudo();
  };
  EA.novoDeModelo = function (m) {
    var s = m.f();
    E.p.slides.splice(E.si + 1, 0, s); E.si++; E.sel = []; E.t = 0;
    EA.mudou(true); tudo();
  };
  EA.irSlide = function (k) { if (EA.Musica) EA.Musica.parar(); setTimeout(function () { if (EA.Paineis.redesenhaMus) EA.Paineis.redesenhaMus() }, 0); if (editando) fimEdicao(); if (E.ajustando) { E.ajustando = null; document.body.classList.remove('ajustando-foto') } E.si = EA.limita(k, 0, E.p.slides.length - 1); E.sel = []; E.t = 0;
    var minis = document.querySelectorAll('#lista .ed-mini');
    if (minis.length !== E.p.slides.length) { tudo(); return }
    [].forEach.call(minis, function (b, j) { b.classList.toggle('on', j === E.si) });
    desenha(); EA.Inspetor.mostra(); timeline(); botoesDesf();
  };

  function ligaBotoes() {
    $('#titulo').addEventListener('input', function () { E.p.titulo = this.value; EA.mudou(true, 'titulo') });
    $('#bDesf').onclick = function () { volta(E.histI - 1) }; $('#bRef').onclick = function () { volta(E.histI + 1) };
    $('#bApr').onclick = function () { apresentar(E.si) };
    $('#bSalvar').onclick = salvarArq; $('#bExportar').onclick = exportar; $('#bImagem').onclick = exportarImagem;
    $('#bAbrir').onclick = function () { $('#arqAbrir').click() };
    $('#arqAbrir').onchange = abrirArq;
    $('#bMeus').onclick = EA.telaMateriais;
    $('#bNovo').onclick = function () { EA.Paineis.abre('modelos') };
    $('#bVideo').onclick = function () { var o = EA.objAtual(); if (o && o.tipo === 'video' && o.props.midia) EA.EditorVideo.abre(o); else EA.aviso('Selecione um vídeo no slide para cortar.') };
    $('#bTempo').onclick = function () { E.timeline = !E.timeline; this.classList.toggle('on', E.timeline); $('#tempo').hidden = !E.timeline; if (!E.timeline) { if (E.tocando) E.tocando(); E.t = 0; desenha() } timeline(); ajusta(); EA.Inspetor.mostra() };
    [].forEach.call(document.querySelectorAll('[data-painel]'), function (b) { b.onclick = function () { EA.Paineis.abre(b.dataset.painel) } });
    var l = $('#lista'), arrastado = null;
    l.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]'), m = ev.target.closest('.ed-mini'); if (!m) return;
      var k = +m.dataset.k;
      if (a) {
        ev.stopPropagation();
        if (a.dataset.a === 'dup') {
          var c = EA.clona(E.p.slides[k]); c.id = EA.uid(); c.objs.forEach(function (o) { var v = o.id; o.id = EA.uid(); c.objs.forEach(function (x) { if (x.troca && x.troca.por === v) x.troca.por = o.id }) });
          /* 12/11: a cópia fica com a mesma transição do original; o Mover mágico só liga quando a pessoa escolhe na aba Slide */
          E.p.slides.splice(k + 1, 0, c); E.si = k + 1;
        } else {
          if (E.p.slides.length === 1) { EA.aviso('O material precisa de pelo menos um slide.'); return }
          E.p.slides.splice(k, 1); E.si = EA.limita(E.si >= k ? E.si - 1 : E.si, 0, E.p.slides.length - 1);
        }
        E.sel = []; EA.mudou(true); tudo(); return;
      }
      EA.irSlide(k);
    });
    l.addEventListener('dragstart', function (e) { var m = e.target.closest('.ed-mini'); if (m) { arrastado = +m.dataset.k; m.classList.add('arrasta') } });
    l.addEventListener('dragover', function (e) { e.preventDefault(); [].forEach.call(l.children, function (c) { c.classList.remove('alvo') }); var m = e.target.closest('.ed-mini'); if (m) m.classList.add('alvo') });
    l.addEventListener('drop', function (e) {
      e.preventDefault(); var m = e.target.closest('.ed-mini'); if (!m || arrastado == null) return;
      var para = +m.dataset.k, s = E.p.slides.splice(arrastado, 1)[0]; E.p.slides.splice(para, 0, s); E.si = para; arrastado = null; EA.mudou(true); tudo();
    });
    /* 09/11: arrastar um slide e desistir (Esc ou soltar fora) não deixa a lista marcada */
    l.addEventListener('dragend', function () { arrastado = null; [].forEach.call(l.children, function (c) { c.classList.remove('arrasta', 'alvo') }) });
    var area = $('#area');
    area.addEventListener('dragover', function (e) { e.preventDefault() });
    area.addEventListener('drop', function (e) {
      /* 09/11: vários arquivos soltos de uma vez entram todos */
      e.preventDefault(); var dt = e.dataTransfer, fs = [].slice.call(dt.files || []);
      if (fs.length) { fs.forEach(function (f) { EA.Paineis.arquivoMidia(f) }); return }
      /* imagem arrastada de outro site: vem só o endereço */
      var mm = (dt.getData('text/html') || '').match(/<img[^>]+src=["']([^"']+)["']/i), url = mm ? mm[1].replace(/&amp;/g, '&') : (dt.getData('text/uri-list') || '').split(/\s+/)[0];
      if (url && /^(https?:|data:image\/)/i.test(url)) EA.Paineis.gifDoEndereco(url, true).then(function (g) { if (g) EA.Paineis.arquivoMidia(g); else EA.aviso('Esse site não deixa pegar a imagem. Salve ela no computador e arraste o arquivo.') });
    });
    /* 09/11: o que é do documento entra uma vez só, mesmo que a tela seja montada de novo */
    if (docLigado.botoes) return; docLigado.botoes = 1;
    document.addEventListener('keydown', teclas);
    window.addEventListener('resize', ajusta);
    /* 12/11: colar dentro de uma caixa de texto em edição: o texto de fora trazia fonte, tamanho e cor dele e quebrava a fonte escolhida */
    document.addEventListener('paste', function (ev) {
      var a = document.activeElement; if (!a || !a.isContentEditable || !a.closest('#palco')) return;
      var cd = ev.clipboardData; if (!cd) return;
      var html = cd.getData('text/html'), txt = cd.getData('text/plain');
      if (!html && !txt) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      if (!html) { document.execCommand('insertText', false, txt); return }
      document.execCommand('insertHTML', false, limpaColado(html));
    }, true);
    /* colar imagem direto do Ctrl+V */
    document.addEventListener('paste', function (ev) {
      if (!livre() || campoTexto()) return;
      var cd = ev.clipboardData, its = [].slice.call(cd.items || []);
      /* 09/11: a última coisa copiada foi um objeto daqui (a marca ainda está lá): cola ele */
      if (clip && clip.length && cd.getData('text/plain') === MARCA) { ev.preventDefault(); EA.acao('colar'); return }
      var gif = its.filter(function (i) { return i.kind === 'file' && i.type === 'image/gif' })[0];
      if (gif) { ev.preventDefault(); EA.Paineis.arquivoMidia(gif.getAsFile()); return }
      var it = its.filter(function (i) { return i.type.indexOf('image/') === 0 })[0], fIt = it && it.getAsFile();
      /* GIF copiado de um site: o navegador entrega só uma foto parada; o GIF de verdade vem do endereço dele (08/11) */
      var html = cd.getData('text/html') || '', mm = html.match(/<img[^>]+src=["']([^"']+)["']/i), url = mm ? mm[1].replace(/&amp;/g, '&') : (cd.getData('text/uri-list') || '').split(/\s+/)[0];
      if (url && /^(https?:|data:image\/gif)/i.test(url)) {
        ev.preventDefault();
        EA.Paineis.gifDoEndereco(url).then(function (g) { if (g) EA.Paineis.arquivoMidia(g); else if (fIt) EA.Paineis.arquivoMidia(fIt) });
        return;
      }
      if (fIt && /file:\/\/\/[^"']+\.gif/i.test(html)) EA.aviso('O PowerPoint entrega só uma foto parada do GIF. Para vir animado: abra o .pptx no Estúdio, ou salve o GIF e use Mídia.');
      if (fIt) { ev.preventDefault(); EA.Paineis.arquivoMidia(fIt); return }
      /* só quando o navegador não deixou pôr a marca: aí vale a regra antiga */
      if (clip && clipSemMarca) EA.acao('colar');
    });
    document.addEventListener('copy', aoCopiar); document.addEventListener('cut', aoCopiar);
    /* 09/11: arquivo solto fora do palco (painéis, barra de cima): o navegador abria o arquivo no lugar do Estúdio */
    function temArquivo(e) { var t = e.dataTransfer && e.dataTransfer.types; return !!t && [].indexOf.call(t, 'Files') >= 0 }
    document.addEventListener('dragover', function (e) { if (!temArquivo(e) || e.defaultPrevented) return; e.preventDefault(); e.dataTransfer.dropEffect = 'none' });
    document.addEventListener('drop', function (e) { if (temArquivo(e)) e.preventDefault() });
  }
  function teclas(e) {
    if ($('#apresenta').classList.contains('apresenta')) return;
    if (document.querySelector('.ed-modal')) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') e.preventDefault(); return }
    /* 09/11: desfazer, refazer e apagar só ficam com o campo quando é um campo de escrever. Numa régua, cor, caixinha ou lista
       (onde o Ctrl+Z do navegador não faz nada) valem para o slide. As setas continuam sendo do campo */
    var texto = campoTexto(), dig = texto || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !texto) { e.preventDefault(); volta(E.histI + (e.shiftKey ? 1 : -1)); return }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !texto) { e.preventDefault(); volta(E.histI + 1); return }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); salvarArq(); return }
    if (e.key === 'F5') { e.preventDefault(); apresentar(E.si); return }
    if (e.key === 'Escape') { if (E.ajustando) { E.fimAjuste(); return } if (EA.editando()) { fimEdicao(); return } if (E.trocando) { E.trocando = false; document.body.classList.remove('trocando'); return } EA.Paineis.fecha(); return }
    if (!texto && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); EA.acao('apagar'); return }
    if (dig) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); EA.acao('duplicar'); return }
    /* 09/11: Ctrl+C e Ctrl+X são tratados nos eventos copy/cut (aoCopiar). Se o navegador não mandar o evento, copia do jeito antigo */
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { var nc = nCopias; setTimeout(function () { var os = E.p ? EA.objsSel() : []; if (nc === nCopias && os.length) { clip = EA.clona(os); clipSemMarca = true } }, 0); return }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); seleciona(slide().objs.map(function (o) { return o.id })); return }

    var passo = e.shiftKey ? 10 : 1, d = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[e.key];
    if (d && E.sel.length) {
      e.preventDefault();
      EA.objsSel().filter(function (o) { return !o.travado }).forEach(function (o) { var g = estadoAtual(o); aplicaGeo(o, { x: g.x + d[0], y: g.y + d[1] }); var el = elDe(o.id); if (el) { el.style.left = (g.x + d[0]) + 'px'; el.style.top = (g.y + d[1]) + 'px' } });
      desenhaSel(); EA.mudou(true, 'seta:' + E.sel.join()); EA.Inspetor.atualizaGeo(); clearTimeout(teclas.t); teclas.t = setTimeout(EA.miniatura, 300);
    }
  }

  /* ---------- linha do tempo ---------- */
  var SEG = 8;
  function timeline() {
    var c = $('#tempo'); if (!E.timeline) return;
    var o = EA.objAtual(), kf = (o && o.kf) || [];
    var dur = Math.max(SEG, Math.ceil(kf.length ? kf[kf.length - 1].t + 1 : SEG));
    var regua = ''; for (var s = 0; s <= dur; s++) regua += '<span style="left:' + s / dur * 100 + '%">' + s + 's</span>';
    c.innerHTML = '<div class="tp-esq"><b>' + (o ? nomeObj(o) : 'Selecione um objeto') + '</b><div class="tp-bts"><button id="tpPoe" title="Marca a posição atual neste instante" ' + (o ? '' : 'disabled') + '>' + ic('diamond') + 'Marcar aqui</button><button id="tpTira" title="Apaga a marca selecionada" ' + (o && kf.length ? '' : 'disabled') + '>' + ic('trash') + '</button><button id="tpPlay" title="Toca a animação" ' + (o && kf.length > 1 ? '' : 'disabled') + '>' + ic('player-play') + '</button></div>' +
      '<label class="tp-rep"><input type="checkbox" id="tpRep" ' + (o && o.kfRepete ? 'checked' : '') + ' ' + (o ? '' : 'disabled') + '> Repetir</label><select id="tpEase" title="Como chega nesta marca" ' + (o && kf.length ? '' : 'disabled') + '><option value="suave">Suave</option><option value="reta">Constante</option><option value="chegar">Freando</option><option value="saltar">Com salto</option><option value="degraus">Em degraus</option></select></div>' +
      '<div class="tp-dir"><div class="tp-regua" id="tpRegua">' + regua + '</div><div class="tp-trilha" id="tpTrilha">' + kf.map(function (f, k) { return '<i class="tp-kf' + (Math.abs(f.t - E.t) < .06 ? ' on' : '') + (EA.kfTemEvento(f) ? ' ev' : '') + '" title="' + EA.esc(resumoMarca(f)) + '" data-k="' + k + '" style="left:' + f.t / dur * 100 + '%"></i>' }).join('') + '</div><i class="tp-ag" id="tpAg" style="left:' + E.t / dur * 100 + '%"><b>' + E.t.toFixed(1) + 's</b></i>' +
      '<p class="tp-dica">' + (function () { var m = o && EA.kfMarca(o, E.t); if (m && EA.kfTemEvento(m)) return '<b>Nesta marca:</b> ' + EA.esc(resumoMarca(m)); return kf.length ? 'Leve a agulha para outro instante e mexa no objeto. O que você arrastar ou escolher nas abas Design e Animação fica marcado ali.' : 'Leve a agulha para frente e arraste o objeto, ou escolha uma animação ou um som nas abas Design e Animação. Fica tudo marcado naquele instante.' })() + '</p></div>';
    var dir = $('.tp-dir', c), trilha = $('#tpTrilha');
    function tempoDe(ev) { var r = trilha.getBoundingClientRect(); return Math.round(EA.limita((ev.clientX - r.left) / r.width, 0, 1) * dur * 10) / 10 }
    var agulhaArr = false, kfArr = null;
    dir.onpointerdown = function (ev) {
      if (E.tocando) E.tocando();
      if (ev.target.classList.contains('tp-kf')) { kfArr = kf[+ev.target.dataset.k]; E.t = kfArr.t; if (kfArr.t === 0) kfArr = null }
      else { agulhaArr = true; E.t = tempoDe(ev) }
      dir.setPointerCapture(ev.pointerId); desenha(); moveAg();
    };
    function moveAg() { var a = $('#tpAg'); if (a) { a.style.left = E.t / dur * 100 + '%'; $('b', a).textContent = E.t.toFixed(1) + 's' } }
    dir.onpointermove = function (ev) {
      if (agulhaArr) { E.t = tempoDe(ev); moveAg(); desenha() }
      else if (kfArr) { kfArr.t = Math.max(.1, tempoDe(ev)); E.t = kfArr.t; moveAg(); var i = $('.tp-kf.on', c); if (i) i.style.left = kfArr.t / dur * 100 + '%'; desenha() }
    };
    dir.onpointerup = function () {
      if (kfArr) { o.kf.sort(function (a, b) { return a.t - b.t }); EA.mudou() }
      var mudar = agulhaArr || kfArr; agulhaArr = false; kfArr = null; if (mudar) { timeline(); EA.Inspetor.mostra() }
    };
    var atual = kf.find(function (f) { return Math.abs(f.t - E.t) < .06 });
    if (atual) $('#tpEase').value = atual.ease || 'suave';
    $('#tpEase').onchange = function () { if (atual) { atual.ease = this.value; EA.mudou() } };
    $('#tpRep').onchange = function () { o.kfRepete = this.checked; EA.mudou() };
    $('#tpPoe').onclick = function () { var g = estadoAtual(o); if (!o.kf || !o.kf.length) { o.kf = [{ t: 0, x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot, op: o.op }] } aplicaGeo(o, { x: g.x, y: g.y, w: g.w, h: g.h, rot: g.rot, op: g.op }); EA.mudou(); timeline() };
    $('#tpTira').onclick = function () { var k = o.kf.findIndex(function (f) { return Math.abs(f.t - E.t) < .06 }); if (k < 0) k = o.kf.length - 1; o.kf.splice(k, 1); if (o.kf.length === 1) { Object.assign(o, { x: o.kf[0].x, y: o.kf[0].y, w: o.kf[0].w, h: o.kf[0].h, rot: o.kf[0].rot, op: o.kf[0].op }); o.kf = [] } EA.mudou(); desenha(); timeline() };
    /* tocar: a agulha anda junto e, no fim, tudo volta para o começo (o objeto e a caixa de seleção juntos) */
    $('#tpPlay').onclick = function () {
      if (E.tocando) { E.tocando(); return }
      E.t = 0; desenha();
      var h = EA.tocaKf(elDe(o.id), Object.assign({}, o, { kfRepete: false }), 0, E.p), t0 = performance.now(), d = EA.kfDur(o), id, bt = this;
      bt.innerHTML = ic('player-stop');
      E.tocando = function () { cancelAnimationFrame(id); if (h) h.para(); E.tocando = null; E.t = 0; desenha(); timeline(); EA.Inspetor.mostra() };
      (function passo() {
        var s = (performance.now() - t0) / 1000;
        if (s >= d + .2) { E.tocando(); return }
        E.t = Math.min(s, d); moveAg(); desenhaSel();
        id = requestAnimationFrame(passo);
      })();
    };
  }
  EA.timeline = timeline;
  function resumoMarca(f) {
    var l = [];
    if (f.anim) l.push('animação ' + (EA.ANIM_NOMES && EA.ANIM_NOMES[f.anim] || f.anim));
    if (f.vira != null) l.push(f.vira ? 'vira para o outro lado' : 'volta ao lado normal');
    if (f.efeito && EA.ENTRADAS[f.efeito]) l.push('efeito ' + EA.ENTRADAS[f.efeito].nome);
    if (f.loop && EA.LOOPS[f.loop]) l.push(f.loop === 'nenhum' ? 'para o movimento' : 'movimento ' + EA.LOOPS[f.loop].nome);
    if (f.som) l.push('som ' + (EA.SONS[f.som] ? EA.SONS[f.som].nome : 'próprio'));
    return l.join(' · ');
  }
  function nomeObj(o) {
    var n = { texto: 'Texto', forma: 'Forma', icone: 'Ícone', imagem: 'Imagem', video: 'Vídeo', boneco: 'Personagem', lutador: 'Personagem', efeito: 'Efeito', ui: 'Elemento', apres: 'Efeito', camera: 'Câmera ao vivo' }[o.tipo] || o.tipo;
    if ((o.tipo === 'rig' || o.tipo === 'desenho') && o.props.nome) n = o.props.nome;
    if (o.tipo === 'apres' && EA.FX_APRES[o.props.ef]) n = EA.FX_APRES[o.props.ef].nome;
    if (o.tipo === 'texto') n = (o.props.html || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 26) || n;
    if (o.tipo === 'ui' && EA.ELEMENTOS[o.props.modelo]) n = EA.ELEMENTOS[o.props.modelo].nome;
    if (o.tipo === 'lutador' && o.props.lut) n = o.props.lut.nome;
    if (o.tipo === 'efeito' && o.props.fx) n = o.props.fx.nome;
    return n;
  }
  EA.nomeObj = nomeObj;

  /* ---------- apresentar, salvar, exportar ---------- */
  function apresentar(de) {
    if (editando) fimEdicao();
    /* o editor dorme enquanto apresenta: nada dele desenha nem ocupa o navegador por trás */
    document.body.classList.add('apresentando'); EA.editorOculto = true;
    new EA.Player($('#apresenta'), E.p, { inicio: de, aoFechar: function (k) {
      document.body.classList.remove('apresentando'); EA.editorOculto = false; ajusta();
      EA.irSlide(k < 0 ? 0 : k);
    } });
  }
  EA.apresentar = apresentar;
  /* fechar a aba, trocar de aba ou minimizar: o que estava esperando para salvar é salvo já */
  function salvaJa() {
    if (!E.p) return;
    var mudouTexto = guardaEdicao();
    if (tempoSalva || mudouTexto) { clearTimeout(tempoSalva); tempoSalva = null; grava(E.p) }
  }
  window.addEventListener('pagehide', salvaJa);
  document.addEventListener('visibilitychange', function () { if (document.hidden) salvaJa(); else if (outraAba) avisaOutraAba() });
  function salvarArq() {
    if (guardaEdicao()) marcaSalvar();
    EA.Guardar.salvaArquivo(EA.Guardar.paraTexto(E.p), EA.Guardar.nomeArquivo(E.p.titulo) + '.aulao', 'application/json', '.aulao').then(function (ok) { if (ok) EA.aviso('Arquivo salvo no seu computador.') });
  }
  function abrirArq() {
    var f = this.files[0]; this.value = ''; if (!f) return;
    /* 07/11: PowerPoint e Google Slides (baixado como .pptx) viram um material novo */
    if (/\.pptx$/i.test(f.name)) {
      EA.aviso('Lendo o PowerPoint…');
      EA.ImportarPptx.abrir(f, function (i, n) { EA.aviso('Lendo o PowerPoint… slide ' + i + ' de ' + n) }).then(function (r) {
        carrega(r.projeto); grava(r.projeto, true); EA.aviso('PowerPoint aberto: ' + r.projeto.slides.length + ' slides.'); EA.ImportarPptx.relatorio(r);
      }).catch(function (e) { console.error(e); EA.aviso('Não consegui abrir este PowerPoint: ' + e.message) });
      return;
    }
    f.text().then(function (t) {
      var p = JSON.parse(t);
      if (!p || !Array.isArray(p.slides) || p.slides.some(function (s) { return !s || !Array.isArray(s.objs) })) throw new Error('arquivo');
      if (!p.id) p.id = EA.uid(); if (!p.titulo) p.titulo = 'Material';
      salvaJa();
      /* 09/11: o arquivo tem a mesma identidade de um material guardado neste navegador? Se o conteúdo for diferente,
         abre como cópia: a versão do navegador (que pode ser mais nova) não é apagada */
      function miolo(q) { return JSON.stringify({ slides: q.slides, tema: q.tema }) }
      return EA.Guardar.lista().catch(function () { return [] }).then(function (l) {
        var m = miolo(p), mesmo = E.p && E.p.id === p.id ? E.p : l.find(function (q) { return q.id === p.id });
        if (mesmo && miolo(mesmo) !== m) {
          var ja = l.find(function (q) { return q.id !== p.id && miolo(q) === m });
          if (ja) { carrega(ja); EA.aviso('Este arquivo já estava guardado aqui: abri ele.'); return }
          p.id = EA.uid(); p.titulo += ' (do arquivo)';
          EA.aviso('Abri o arquivo como uma cópia. A versão que estava neste navegador continua em "Meus materiais".');
        }
        carrega(p); grava(p, true);
      });
    }).catch(function (e) { console.error(e); EA.aviso('Este arquivo não é um material do Estúdio Aulão.') });
  }
  function exportar() {
    var b = $('#bExportar'); b.disabled = true;
    EA.aviso('Montando o HTML…');
    EA.Exportar.gerar(E.p).then(function (h) {
      var mb = (h.length / 1048576).toFixed(1);
      return EA.Guardar.salvaArquivo(h, EA.Guardar.nomeArquivo(E.p.titulo) + '.html', 'text/html', '.html').then(function (ok) { if (ok) EA.aviso('HTML exportado (' + mb + ' MB). Abre em qualquer navegador, sem internet.') });
    }).catch(function (e) { EA.aviso('Não consegui exportar: ' + e.message) }).then(function () { b.disabled = false });
  }
  EA.exportar = exportar;
  var tempoAviso;
  EA.aviso = function (t) {
    var a = $('#aviso'); if (!a) { a = EA.el('div', 'ed-aviso'); a.id = 'aviso'; document.body.appendChild(a) }
    a.textContent = t; a.classList.add('ver'); clearTimeout(tempoAviso); tempoAviso = setTimeout(function () { a.classList.remove('ver') }, 3600);
  };

  /* o slide atual, como está no palco */
  function exportarImagem() {
    var b = $('#bImagem'); if (b.disabled) return;
    if (editando) fimEdicao();
    b.disabled = true; EA.aviso('Gerando a imagem…');
    EA.imagemDoPalco($('#palco'), EA.dimSlide(slide())).then(function (r) {
      var nome = (E.p.titulo || 'Slide').replace(/[\\/:*?"<>|]+/g, ' ').trim() + ' - slide ' + (E.si + 1) + '.png', url = URL.createObjectURL(r.blob), a = document.createElement('a');
      a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url) }, 60000);
      EA.aviso('Imagem salva em Downloads: ' + r.w + ' × ' + r.h + ' (' + (r.blob.size / 1048576).toFixed(1) + ' MB).');
    }).catch(function () { EA.aviso('Não consegui gerar a imagem deste slide.') }).then(function () { b.disabled = false });
  }
  /* ---------- abrir ---------- */
  function identidadesUnicas(p) {
    p.slides.forEach(function (s) {
      var vistos = {};
      s.objs.forEach(function (o) { if (vistos[o.id]) { o.id = EA.uid(); o.liga = EA.uid() } vistos[o.id] = 1 });
    });
  }
  /* 09/11: mídia que não é usada em lugar nenhum sai na hora de ABRIR o material (nunca ao apagar: o desfazer conta com ela).
     Só sai o que não aparece em nenhum ponto do material (slides, quiz, músicas); áudio fica sempre, porque é subido para escolher depois */
  function tiraMidiaSolta(p) {
    var ks = Object.keys(p.midia).filter(function (k) { return p.midia[k] && p.midia[k].tipo !== 'audio' }); if (!ks.length) return;
    var resto = JSON.stringify(Object.assign({}, p, { midia: null }));
    ks.forEach(function (k) { if (resto.indexOf(k) < 0) delete p.midia[k] });
  }
  function carrega(p) {
    /* 09/11: trocar de material guarda antes o que estava esperando, e a cópia de objetos não passa de um material para outro */
    if (E.p && E.p !== p) salvaJa();
    if (E.p !== p) clip = null;
    outraAba = false; juntaAtual = null;
    E.p = p; EA.projetoAtual = p; E.si = 0; E.sel = []; E.t = 0;
    if (!p.midia) p.midia = {};
    identidadesUnicas(p);
    fotoAtual = null; E.hist = []; E.histI = -1;
    if (!p.slides.length) p.slides.push(EA.MODELOS.find(function (m) { return m.id === 'capa' }).f());
    /* 09/11: limpeza desligada por ora: apagaria imagens guardadas na Mídia para usar depois. Fica para decidir com calma */
    fotoAtual = foto(); foraAtual = fora(); E.hist = [fotoAtual]; E.histI = 0;
    if (!$('#host')) { montaTela(); ligaPalco(); EA.Inspetor.liga() }
    tudo(); ajusta();
  }
  EA.carrega = carrega;
  EA.telaMateriais = function () {
    EA.Guardar.lista().then(function (l) {
      var f = EA.el('div', 'ed-modal');
      f.innerHTML = '<div class="ed-modal-c"><button class="ed-x" data-x>' + ic('x') + '</button><h2>Meus materiais</h2><p>Ficam guardados só neste navegador, neste computador. Salve em arquivo para ter uma cópia.</p><div class="mat-grade"><button class="mat-novo" data-novo>' + ic('plus') + '<b>Novo material</b></button>' +
        l.map(function (p) { return '<div class="mat" data-id="' + p.id + '"><div class="mat-v"></div><b>' + EA.esc(p.titulo) + '</b><small>' + p.slides.length + ' slides · ' + new Date(p.mudado).toLocaleDateString('pt-BR') + '</small><button class="mat-del" data-del="' + p.id + '" title="Apagar">' + ic('trash') + '</button></div>' }).join('') + '</div></div>';
      document.body.appendChild(f);
      l.forEach(function (p) { var v = $('.mat[data-id="' + p.id + '"] .mat-v', f); if (v && p.slides[0]) { var keep = EA.projetoAtual; EA.projetoAtual = p; v.appendChild(EA.slideEstatico(p.slides[0], p, 236, true)); EA.projetoAtual = keep } });
      f.onclick = function (e) {
        if (e.target.closest('[data-x]') || (e.target === f && E.p)) { f.remove(); return }
        if (e.target.closest('[data-novo]')) { var n = EA.novoProjeto('Novo aulão'); n.slides.push(EA.MODELOS.find(function (m) { return m.id === 'capa' }).f()); f.remove(); carrega(n); grava(n, true); return }
        var d = e.target.closest('[data-del]');
        /* 09/11: apagar o material aberto não deixa mais a tela vazia: abre o mais recente que sobrou, ou um novo */
        if (d) {
          e.stopPropagation(); var q = l.find(function (p) { return p.id === d.dataset.del }); if (!q || !confirm('Apagar "' + q.titulo + '" deste computador?')) return;
          var aberto = !!E.p && E.p.id === q.id;
          if (aberto) { if (editando) fimEdicao(); clearTimeout(tempoSalva); tempoSalva = null }
          EA.Guardar.apaga(q.id).then(function () {
            f.remove(); if (!aberto) return;
            clearTimeout(tempoSalva); tempoSalva = null;
            return EA.Guardar.lista().catch(function () { return [] }).then(function (r) {
              if (r.length) { carrega(r[0]); return }
              var n = EA.novoProjeto('Novo aulão'); n.slides.push(EA.MODELOS.find(function (m) { return m.id === 'capa' }).f()); carrega(n); return grava(n, true);
            });
          }).then(EA.telaMateriais, function (x) { console.error(x); EA.aviso('Não consegui apagar este material.') });
          return;
        }
        var m = e.target.closest('.mat'); if (m) { f.remove(); carrega(l.find(function (p) { return p.id === m.dataset.id })) }
      };
    });
  };
  /* primeira abertura: o último material, ou um novo com exemplo */
  EA.Guardar.lista().then(function (l) {
    if (l.length) carrega(l[0]);
    else {
      var p = EA.novoProjeto('Meu primeiro aulão');
      ['capa', 'tres', 'fluxo', 'antesdepois', 'quiz', 'rpg'].forEach(function (id) { p.slides.push(EA.MODELOS.find(function (m) { return m.id === id }).f()) });
      carrega(p); grava(p, true);
    }
  }).catch(function () { var p = EA.novoProjeto('Meu aulão'); p.slides.push(EA.MODELOS[1].f()); carrega(p) });
})();
