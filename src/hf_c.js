/* hf_c.js — 10/11: peças para tutorial de tela (ensinar a usar apps com prints), inspiradas no HyperFrames
   (screen-flow-carousel, sticky-mock-swap, cursor-glyph-trail, cursor-zoom-follow, input-feedback, signup-flow, code-diff),
   refeitas do zero com CSS + JS puro. No editor ficam paradas e bonitas; na apresentação cada clique na peça avança
   um passo; depois do último, o próximo clique recomeça a peça (nunca passa o slide). */
(function () {
  var EA = window.EA, HF = EA.HF, esc = HF.esc;
  var ICO_FOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 18l6-6 4 4 3-3 5 5"/></svg>';
  var ICO_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg>';
  var ICO_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M17 7L7 17M7 7l10 10"/></svg>';
  var SETA = '<svg viewBox="0 0 24 24"><path d="M5 2.5l13.5 12.2l-6.1.6l3.6 7.2l-2.8 1.3l-3.5-7.3l-4.7 4.2z" fill="#fff" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  var MOLDURAS = [['celular', 'Celular'], ['computador', 'Computador (navegador)'], ['nenhuma', 'Sem moldura']];
  var ENCAIXES = [['cobre', 'Preencher a tela (corta as sobras)'], ['inteiro', 'Mostrar o print inteiro']];
  function cor(p) { return esc(p.cor || '#2563eb') }
  function num(v, d) { v = parseFloat(v); return isNaN(v) ? d : v }

  /* ---------- pedaços comuns: moldura, print e o lugar vazio que pede o print ---------- */
  function vazio(msg) {
    return '<div class="hfc-vazio"><i class="hfc-vz-b"></i><i class="hfc-vz-l"></i><i class="hfc-vz-l c"></i><i class="hfc-vz-l"></i><div class="hfc-vz-m">' + ICO_FOTO + '<span>' + esc(msg) + '</span><small>Ponha o print no painel Design</small></div></div>';
  }
  /* print de um passo q ({ k, enc, z, fx, fy }); sem print, o lugar vazio. 10/11: cada print tem encaixe, zoom e posição próprios */
  function print(p, q, ctx, msg) {
    var u = EA.urlFoto(p, q.k, ctx);
    if (!u) return vazio(msg);
    var x = num(q.fx, 50), y = num(q.fy, 0), z = num(q.z, 1);
    return '<img draggable="false" alt="" src="' + esc(u) + '" style="object-fit:' + ((q.enc || p.encaixe) === 'inteiro' ? 'contain' : 'cover') + ';object-position:' + x + '% ' + y + '%;transform-origin:' + x + '% ' + y + '%;transform:scale(' + z + ')">';
  }
  /* 10/11: o Estilo vai para o topo do painel, logo abaixo do nome */
  function noTopo(c, el) { var h = c.querySelector('.in-grupo'); c.insertBefore(el, h ? h.nextSibling : c.firstChild) }
  /* tamanho da moldura que cabe na caixa (bw x bh) */
  function cabe(tipo, bw, bh) {
    var r = tipo === 'celular' ? .49 : tipo === 'computador' ? 1.5 : 1.6, w = Math.min(bw, bh * r);
    return { w: Math.round(w), h: Math.round(w / r) };
  }
  /* moldura: dentro = o que vai na tela; clsTela vai na tela (ex.: 'ui-foto', para o ajuste de foto do editor achar) */
  function moldura(tipo, dentro, clsTela) {
    var tela = '<div class="hfc-tela' + (clsTela ? ' ' + clsTela : '') + '">' + dentro + '</div>';
    if (tipo === 'celular') return '<div class="hfc-m hfc-m-cel">' + tela + '<i class="hfc-ilha"></i></div>';
    if (tipo === 'computador') return '<div class="hfc-m hfc-m-pc"><div class="hfc-barra"><i></i><i></i><i></i><b></b></div>' + tela + '</div>';
    return '<div class="hfc-m hfc-m-sem">' + tela + '</div>';
  }
  /* digita um texto aos poucos; vale() diz se ainda é a vez dele (outro clique cancela) */
  function digita(raiz, alvo, s, ms, vale, fim) {
    var i = 0; alvo.textContent = '';
    HF.som(raiz, 'digitar');
    (function vai() {
      if (!HF.vivo(raiz) || !vale()) return;
      if (i >= s.length) { if (fim) fim(); return }
      alvo.textContent = s.slice(0, ++i);
      setTimeout(vai, ms);
    })();
  }
  /* 10/11: muda o estado sem animar (para recomeçar a peça como ela abriu) */
  function seco(el, f) { el.classList.add('hfc-seco'); f(); void el.offsetWidth; el.classList.remove('hfc-seco') }
  function depois(raiz, ms, f) { setTimeout(function () { if (HF.vivo(raiz)) f() }, ms) }

  /* ===================== 1 e 2. Telas do app: carrossel de telas / tela com explicações =====================
     10/11: as duas variantes leem os mesmos dados (p.passos = [{ k, t, d, enc, z, fx, fy }]): no carrossel t é a legenda;
     na tela com explicações t é o título e d o texto. Trocar o Estilo só troca o modelo; prints, ajustes e textos ficam. */
  var PASSOS_PADRAO = [
    { k: '11', t: 'Abra as configurações', d: 'Toque nos três pontinhos no canto de cima e escolha Configurações.' },
    { k: '12', t: 'Entre em Ferramentas comerciais', d: 'Aqui ficam o perfil da empresa, o catálogo e as mensagens automáticas.' },
    { k: '13', t: 'Escolha Mensagem de ausência', d: 'Ligue a chave, escreva o texto e escolha quando ela deve ser enviada.' }];
  /* materiais antigos do carrossel guardavam em p.telas */
  /* 10/11: a chave de cada print é número a partir de 11 (midia11, src12…): o HTML exportado só leva fotos com chave em número.
     Antes era 'p1', 'p2'…; ao abrir, os passos antigos ganham chave nova e o print vai junto */
  function novaChave(arr) { var m = 10; arr.forEach(function (q) { if (/^\d+$/.test(q.k)) m = Math.max(m, +q.k) }); return String(m + 1) }
  function migraPassos(p) {
    if (!p.passos) p.passos = EA.clona(p.telas || PASSOS_PADRAO);
    delete p.telas;
    p.passos.forEach(function (q) {
      if (/^\d+$/.test(q.k) && +q.k > 10) return;
      var n = novaChave(p.passos);
      ['midia', 'src', 'corte'].forEach(function (c) { if (p[c + q.k] != null) { p[c + n] = p[c + q.k]; delete p[c + q.k] } });
      q.k = n;
    });
    return p.passos;
  }
  function passosDe(p) { return migraPassos(p) }
  var ESTILOS_TELAS = [['hf_telas', 'Carrossel de telas'], ['hf_explica', 'Tela com explicações']];
  function painelTelas(c, o, F) {
    var p = o.props, arr = migraPassos(p), explica = p.modelo === 'hf_explica';
    noTopo(c, F.campo('Estilo', F.sel(p.modelo, ESTILOS_TELAS, function (v) { p.modelo = v; F.muda(); F.mostra() })));
    c.appendChild(F.campo('Moldura', F.sel(p.moldura || 'celular', MOLDURAS, function (v) { p.moldura = v; F.muda() })));
    if (explica) c.appendChild(F.campo('A tela fica', F.sel(p.lado || 'esquerda', [['esquerda', 'À esquerda do texto'], ['direita', 'À direita do texto']], function (v) { p.lado = v; F.muda() })));
    listaPassos(c, o, F, arr, explica);
    F.nota(explica ? 'Na apresentação, cada clique na peça troca o print e o texto para o próximo passo. Depois do último, o próximo clique recomeça.'
      : 'Na apresentação, cada clique na peça desliza para a próxima tela e troca a legenda. Depois da última tela, o próximo clique recomeça do início.');
  }
  HF.elemento('hf_telas', { nome: 'Telas do app', w: 760, h: 560, corRot: 'Cor de destaque', corPad: '#2563eb', tamTexto: 1, campos: {},
    html: function (p, o, ctx) {
      var W = o && o.w || 760, H = o && o.h || 560, its = passosDe(p), tipo = p.moldura || 'celular', fs = p.tamTexto || 20;
      var f = cabe(tipo, W * (tipo === 'celular' ? .46 : .66), H - 30 - fs * 2.6), pas = Math.round(f.w * (tipo === 'celular' ? 1.06 : .9));
      return '<div class="hfc-telas" data-hf="hf_telas" style="--hc:' + cor(p) + ';--fw:' + f.w + 'px;--fh:' + f.h + 'px;--pas:' + pas + 'px"><div class="hfc-tl-pista">' +
        its.map(function (q, i) { return '<div class="hfc-tl-it" data-pos="' + Math.min(i, 3) + '">' + moldura(tipo, print(p, q, ctx, 'Print da tela ' + (i + 1))) + '</div>' }).join('') +
        '</div><div class="hfc-tl-rod"><div class="hfc-tl-leg" style="font-size:' + fs + 'px">' + its.map(function (q, i) { return '<p class="' + (i ? '' : 'on') + '">' + HF.txt(q.t) + '</p>' }).join('') + '</div></div></div>';
    },
    painel: painelTelas
  }, function (el) {
    var its = el.querySelectorAll('.hfc-tl-it'), leg = el.querySelectorAll('.hfc-tl-leg p'), n = its.length - 1, ind = HF.passos(el), at = 0;
    function mostra() {
      [].forEach.call(its, function (x, i) { x.dataset.pos = Math.max(-3, Math.min(3, i - at)) });
      [].forEach.call(leg, function (x, i) { x.classList.toggle('on', i === at) });
      ind(at, n);
    }
    ind(0, n);
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      if (at >= n) { at = 0; seco(el, mostra); return }  /* 10/11: depois da última tela, recomeça */
      at++; HF.som(el, 'pagina'); mostra();
    });
  });

  /* oculto: não aparece na lista de Elementos; chega pelo Estilo de "Telas do app" (e materiais antigos continuam abrindo) */
  HF.elemento('hf_explica', { nome: 'Telas do app', oculto: true, w: 900, h: 520, corRot: 'Cor de destaque', corPad: '#2563eb', tamTexto: 1, campos: {},
    html: function (p, o, ctx) {
      var W = o && o.w || 900, H = o && o.h || 520, its = passosDe(p), tipo = p.moldura || 'celular', n = its.length;
      var f = cabe(tipo, W * (tipo === 'celular' ? .4 : .56), H - 16);
      return '<div class="hfc-ex' + (p.lado === 'direita' ? ' dir' : '') + '" data-hf="hf_explica" style="--hc:' + cor(p) + ';--fw:' + f.w + 'px;--fh:' + f.h + 'px">' +
        '<div class="hfc-ex-mold">' + moldura(tipo, its.map(function (q, i) { return '<div class="hfc-ex-tl' + (i ? '' : ' on') + '">' + print(p, q, ctx, 'Print do passo ' + (i + 1)) + '</div>' }).join('')) + '</div>' +
        '<div class="hfc-ex-txt"><div class="hfc-ex-pilha">' + its.map(function (q, i) {
          return '<div class="hfc-ex-p' + (i ? '' : ' on') + '"><span class="hfc-ex-et"><b>' + (i + 1) + '</b>Passo ' + (i + 1) + ' de ' + n + '</span><h3>' + HF.txt(q.t) + '</h3><p style="font-size:' + (p.tamTexto || 21) + 'px">' + HF.txt(q.d) + '</p></div>' }).join('') +
        '</div><div class="hfc-ex-bar">' + its.map(function (q, i) { return '<i class="' + (i ? '' : 'on') + '"></i>' }).join('') + '</div></div></div>';
    },
    painel: painelTelas
  }, function (el) {
    var tl = el.querySelectorAll('.hfc-ex-tl'), ps = el.querySelectorAll('.hfc-ex-p'), bs = el.querySelectorAll('.hfc-ex-bar i'), n = ps.length - 1, ind = HF.passos(el), at = 0;
    ind(0, n);
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      if (at >= n) {  /* 10/11: depois do último passo, volta ao primeiro */
        at = 0;
        seco(el, function () { [tl, ps, bs].forEach(function (l) { [].forEach.call(l, function (x, i) { x.classList.remove('saiu'); x.classList.toggle('on', i === 0) }) }) });
        ind(0, n); return;
      }
      var velho = at; at++; HF.som(el, 'pagina'); ind(at, n);
      tl[velho].classList.remove('on'); tl[velho].classList.add('saiu'); tl[at].classList.add('on');
      ps[velho].classList.remove('on'); ps[velho].classList.add('saiu'); ps[at].classList.add('on');
      [].forEach.call(bs, function (x, i) { x.classList.toggle('on', i <= at) });
    });
  });

  /* lista de passos com print: um lugar de foto por passo (chave fixa k), ajuste do print, textos, subir/descer/apagar */
  function listaPassos(c, o, F, arr, explica) {
    var p = o.props;
    arr.forEach(function (q, i) {
      var n0 = c.childNodes.length;
      F.lugarFoto(c, o, q.k, (explica ? 'Passo ' : 'Tela ') + (i + 1));
      /* o ajuste do editor só sabe mexer na foto principal; aqui entram os controles próprios de cada print (logo abaixo) */
      [].slice.call(c.childNodes, n0).forEach(function (n) {
        if (n.querySelector && n.querySelector('input[data-zoom]')) n.remove();
        else if (n.tagName === 'BUTTON' && /Ajustar a foto|Terminar ajuste/.test(n.textContent)) n.remove();
        else if (n.tagName === 'BUTTON' && /Voltar à foto de exemplo/.test(n.textContent)) n.lastChild.textContent = 'Tirar este print';
      });
      if (p['midia' + q.k] || p['src' + q.k]) ajustePrint(c, F, p, q);
      c.appendChild(F.campo(explica ? 'Título' : 'Legenda', F.txt(q.t, function (v) { q.t = v; F.refaz() })));
      if (explica) c.appendChild(F.campo('Explicação', F.area(q.d, function (v) { q.d = v; F.refaz() }, '', 3)));
      c.appendChild(botoesItem(F, arr, i, function () { delete p['midia' + q.k]; delete p['src' + q.k]; delete p['corte' + q.k] }));
    });
    var nv = EA.el('button', 'in-botao prim', '+ ' + (explica ? 'Novo passo' : 'Nova tela')); nv.type = 'button';
    nv.onclick = function () { arr.push({ k: novaChave(arr), t: explica ? 'Novo passo' : '', d: '' }); F.muda(); F.mostra() };
    c.appendChild(nv);
  }
  /* 10/11: ajuste de cada print (fica no próprio passo): encaixe, zoom, posição e centralizar */
  function ajustePrint(c, F, p, q) {
    var cx = EA.el('div', 'hfc-aj');
    cx.appendChild(F.campo('Encaixe deste print', F.sel(q.enc || p.encaixe || 'cobre', ENCAIXES, function (v) { q.enc = v; F.muda() })));
    cx.appendChild(F.faixa('Zoom', Math.round(num(q.z, 1) * 100), function (v) { q.z = v / 100; F.refaz() }, 100, 400, '%'));
    cx.appendChild(F.faixa('Posição na horizontal', Math.round(num(q.fx, 50)), function (v) { q.fx = v; F.refaz() }, 0, 100, '%'));
    cx.appendChild(F.faixa('Posição na vertical (0 = topo)', Math.round(num(q.fy, 0)), function (v) { q.fy = v; F.refaz() }, 0, 100, '%'));
    var ce = EA.el('button', 'in-botao', 'Centralizar e tirar o zoom'); ce.type = 'button';
    ce.onclick = function () { q.fx = 50; q.fy = 50; q.z = 1; F.muda(); F.mostra() };
    cx.appendChild(ce); c.appendChild(cx);
  }
  /* subir / descer / apagar de um item de lista (apagar deixa ao menos um) */
  function botoesItem(F, arr, i, aoApagar) {
    var q = arr[i], lin = EA.el('div', 'in-linha');
    [['↑ Subir', -1], ['↓ Descer', 1]].forEach(function (s) {
      var b = EA.el('button', 'in-botao', s[0]); b.type = 'button'; b.disabled = !arr[i + s[1]];
      b.onclick = function () { var j = i + s[1]; arr[i] = arr[j]; arr[j] = q; F.muda(); F.mostra() };
      lin.appendChild(b);
    });
    var ap = EA.el('button', 'in-botao', 'Apagar'); ap.type = 'button'; ap.disabled = arr.length < 2;
    ap.onclick = function () { arr.splice(i, 1); if (aoApagar) aoApagar(); F.muda(); F.mostra() };
    lin.appendChild(ap); return lin;
  }

  /* ===================== 3 e 4. Cliques em passos / Zoom que segue o clique ===================== */
  var PONTOS_PADRAO = [{ x: 14, y: 20, t: 'Clique em Configurações' }, { x: 55, y: 46, t: 'Escolha a opção certa' }, { x: 84, y: 86, t: 'Clique em Salvar' }];
  function aprox(p) { return Math.max(1.2, num(p.aproxima, 180) / 100) }
  function cliquesHtml(chave, zoom) {
    return function (p, o, ctx) {
      var pts = p.pontos || PONTOS_PADRAO, u = EA.urlFoto(p, '', ctx), tipo = p.moldura || 'computador', p0 = pts[0] || { x: 50, y: 50 }, s = aprox(p), zq = '';
      var x0 = num(p0.x, 50), y0 = num(p0.y, 50);
      var foto = u ? (p.corte ? EA.corteHtml(p.corte, '<img class="ob-preenche" draggable="false" alt="" src="' + esc(u) + '" style="object-fit:fill">') : '<img draggable="false" alt="" src="' + esc(u) + '" style="' + EA.posFoto({ fx: p.fx, fy: p.fy == null ? 0 : p.fy, zoom: p.zoom }).css + '">') : vazio('Print da tela');
      /* no editor, o zoom mostra o pedaço que vai aparecer de perto no 1º ponto */
      if (zoom && pts.length) { var lw = 100 / s, lx = Math.max(0, Math.min(100 - lw, x0 - lw / 2)), ly = Math.max(0, Math.min(100 - lw, y0 - lw / 2)); zq = '<i class="hfc-zq" style="left:' + lx + '%;top:' + ly + '%;width:' + lw + '%;height:' + lw + '%"></i>' }
      var dentro = '<div class="hfc-cam">' + foto + zq + pts.map(function (q, i) { return '<span class="hfc-mk" style="left:' + num(q.x, 50) + '%;top:' + num(q.y, 50) + '%">' + (i + 1) + '</span>' }).join('') +
        '<div class="hfc-ras">' + [1, 2, 3, 4, 5].map(function (i) { return '<i style="--i:' + i + ';left:' + x0 + '%;top:' + y0 + '%"></i>' }).join('') + '</div>' +
        '<div class="hfc-cur" style="left:' + Math.min(96, x0 + 3) + '%;top:' + Math.min(94, y0 + 5) + '%">' + SETA + '</div></div><div class="hfc-rot"></div>';
      return '<div class="hfc-cq' + (zoom ? ' zoom' : '') + '" data-hf="' + chave + '" data-pts="' + esc(JSON.stringify(pts.map(function (q) { return { x: num(q.x, 50), y: num(q.y, 50), t: q.t || '' } }))) + '" data-s="' + s + '" style="--hc:' + cor(p) + ';font-size:' + (p.tamTexto || 18) + 'px">' + (tipo === 'celular' ? celCentro(o, moldura(tipo, dentro, 'ui-foto')) : moldura(tipo, dentro, 'ui-foto')) + '</div>';
    };
  }
  /* celular numa caixa larga: fica em pé, no meio, sem esticar */
  function celCentro(o, m) {
    var f = cabe('celular', o && o.w || 820, o && o.h || 500);
    return '<div class="hfc-cq-cel" style="width:' + f.w + 'px;height:' + f.h + 'px;left:calc(50% - ' + f.w / 2 + 'px);top:calc(50% - ' + f.h / 2 + 'px)">' + m + '</div>';
  }
  function cliquesPainel(zoom) {
    return function (c, o, F) {
      var p = o.props; if (!p.pontos) p.pontos = EA.clona(PONTOS_PADRAO);
      /* 10/11: as duas variantes usam os mesmos dados (print, pontos, moldura); trocar o Estilo só troca o modelo */
      noTopo(c, F.campo('Estilo', F.sel(p.modelo, [['hf_cliques', 'Setinha clicando'], ['hf_zoom', 'Zoom que segue o clique']], function (v) { p.modelo = v; F.muda(); F.mostra() })));
      c.appendChild(F.campo('Moldura', F.sel(p.moldura || 'computador', MOLDURAS, function (v) { p.moldura = v; F.muda(); F.mostra() })));
      if (zoom) c.appendChild(F.faixa('Quanto aproxima', num(p.aproxima, 180), function (v) { p.aproxima = v; F.refaz() }, 130, 300, '%'));
      c.appendChild(F.grupo('Onde clicar'));
      F.nota('Arraste os números em cima da miniatura para pôr cada clique no lugar certo.');
      pontosNaMiniatura(c, o, F);
      F.listaItens(c, o, p.pontos, 'Texto de cada clique', [{ k: 't', tipo: 'linha', ph: 'texto que aparece (pode ficar vazio)' }], function () { return { x: 50, y: 50, t: '' } }, 'Novo clique');
      F.nota(zoom ? 'Na apresentação, cada clique na peça aproxima a câmera do próximo ponto, a seta vai até lá e clica. Depois do último ponto, um clique afasta a câmera; o seguinte recomeça do início.'
        : 'Na apresentação, cada clique na peça leva a seta (com um rastro) até o próximo ponto e mostra o clique e o texto. Depois do último ponto, o próximo clique recomeça.');
    };
  }
  /* miniatura da peça dentro do painel, com os números arrastáveis */
  function pontosNaMiniatura(c, o, F) {
    var p = o.props, d = EA.ELEMENTOS[p.modelo], W = o.w, H = o.h, cx = EA.el('div', 'hfc-pv'), inn = EA.el('div', 'hfc-pv-in');
    inn.style.width = W + 'px'; inn.style.height = H + 'px';
    inn.innerHTML = d.html(p, o, { projeto: EA.projetoAtual });
    cx.appendChild(inn); c.appendChild(cx);
    function escala() { var k = (cx.clientWidth || 260) / W; inn.style.transform = 'scale(' + k + ')'; cx.style.height = Math.round(H * k) + 'px' }
    escala(); requestAnimationFrame(escala);
    var tela = inn.querySelector('.hfc-tela'), arr = null;
    [].forEach.call(inn.querySelectorAll('.hfc-mk'), function (m, i) {
      m.title = 'Arraste para mudar o lugar do clique ' + (i + 1);
      m.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); arr = m; m.setPointerCapture(ev.pointerId); m.classList.add('arrasta') });
      m.addEventListener('pointermove', function (ev) {
        if (arr !== m) return;
        var r = tela.getBoundingClientRect(), x = Math.round(Math.max(0, Math.min(100, (ev.clientX - r.left) / r.width * 100)) * 10) / 10, y = Math.round(Math.max(0, Math.min(100, (ev.clientY - r.top) / r.height * 100)) * 10) / 10;
        p.pontos[i].x = x; p.pontos[i].y = y; m.style.left = x + '%'; m.style.top = y + '%';
      });
      m.addEventListener('pointerup', function () { if (arr !== m) return; arr = null; m.classList.remove('arrasta'); F.muda() });
    });
  }
  function cliquesVida(zoom) {
    return function (el) {
      var pts = JSON.parse(el.dataset.pts || '[]'), s = num(el.dataset.s, 1.8), tela = el.querySelector('.hfc-tela'), cam = el.querySelector('.hfc-cam'),
        cur = el.querySelector('.hfc-cur'), ras = [].slice.call(el.querySelectorAll('.hfc-ras i')), rot = el.querySelector('.hfc-rot'), at = -1, g = 0;
      var total = pts.length + (zoom ? 1 : 0), ind = HF.passos(el);
      function poe(n, x, y) { n.style.left = x + '%'; n.style.top = y + '%' }
      /* começo (igual ao abrir o slide): seta no canto de baixo, câmera longe, sem animar até lá */
      function inicio() {
        at = -1; g++;
        seco(el, function () {
          [cur].concat(ras).forEach(function (n) { poe(n, 88, 90) });
          cam.style.transform = ''; cam.style.setProperty('--inv', 1);
          rot.classList.remove('on'); el.classList.remove('anda');
          [].forEach.call(el.querySelectorAll('.hfc-onda'), function (o) { o.remove() });
        });
        ind(0, total);
      }
      function camera(x, y, z) {
        var W = tela.offsetWidth, H = tela.offsetHeight, tx = Math.max(W - W * z, Math.min(0, W / 2 - x / 100 * W * z)), ty = Math.max(H - H * z, Math.min(0, H / 2 - y / 100 * H * z));
        cam.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + z + ')'; cam.style.setProperty('--inv', 1 / z);
        return { tx: tx, ty: ty, W: W, H: H, z: z };
      }
      function rotulo(q, v) {
        rot.classList.remove('on'); if (!q.t) return;
        /* lugar do ponto na tela (com zoom, onde ele cai depois de aproximar) */
        var x = v ? (q.x / 100 * v.W * v.z + v.tx) / v.W * 100 : q.x, y = v ? (q.y / 100 * v.H * v.z + v.ty) / v.H * 100 : q.y;
        rot.textContent = q.t; poe(rot, x, y);
        rot.classList.toggle('e', x > 60); rot.classList.toggle('c', y > 72);
        rot.classList.add('on');
      }
      function onda(q) {
        var o = EA.el('span', 'hfc-onda'); poe(o, q.x, q.y); cam.appendChild(o);
        cur.classList.add('aperta'); setTimeout(function () { cur.classList.remove('aperta') }, 180);
        setTimeout(function () { o.remove() }, 900); HF.som(el, 'clique');
      }
      inicio();
      el.addEventListener('click', function (ev) {
        HF.para(ev);
        if (at + 1 >= total) return inicio();  /* 10/11: depois do fim, recomeça */
        at++; var meu = ++g; ind(at + 1, total);
        rot.classList.remove('on');
        if (at === pts.length) { camera(50, 50, 1); return }  /* só no zoom: afasta no fim */
        var q = pts[at], v = zoom ? camera(q.x, q.y, s) : null;
        el.classList.add('anda'); poe(cur, q.x, q.y); ras.forEach(function (r) { poe(r, q.x, q.y) });
        setTimeout(function () { if (!HF.vivo(el) || meu !== g) return; el.classList.remove('anda'); onda(q); rotulo(q, v) }, zoom ? 920 : 780);
      });
    };
  }
  HF.elemento('hf_cliques', { nome: 'Cliques na tela', w: 820, h: 500, fotos: [['', 'Print da tela']], corRot: 'Cor do clique', corPad: '#2563eb', tamTexto: 1, campos: {},
    html: cliquesHtml('hf_cliques', false), painel: cliquesPainel(false) }, cliquesVida(false));
  HF.elemento('hf_zoom', { nome: 'Cliques na tela', oculto: true, w: 820, h: 500, fotos: [['', 'Print da tela']], corRot: 'Cor do clique', corPad: '#2563eb', tamTexto: 1, campos: {},
    html: cliquesHtml('hf_zoom', true), painel: cliquesPainel(true) }, cliquesVida(true));

  /* ===================== 5. Campo com erro e acerto ===================== */
  HF.elemento('hf_campoerro', { nome: 'Campo com erro e acerto', w: 520, h: 170, corRot: 'Cor do campo em uso', corPad: '#2563eb', tamTexto: 1,
    campos: { rot: 'E-mail', err: 'ana@exemplo', msg: 'Falta o “.com” no final do e-mail.', ok: 'ana@exemplo.com', fim: 'Tudo certo!' },
    rotulos: { rot: 'Nome do campo', err: 'Valor errado', msg: 'Mensagem de erro', ok: 'Valor certo', fim: 'Mensagem de acerto' },
    html: function (p) {
      var cp = p.campos || {}, certo = p.verDesign === 'certo';
      return '<div class="hfc-ce ' + (certo ? 'certo' : 'erro') + '" data-hf="hf_campoerro" data-err="' + esc(HF.semTag(cp.err)) + '" data-ok="' + esc(HF.semTag(cp.ok)) + '" style="--hc:' + cor(p) + ';font-size:' + (p.tamTexto || 22) + 'px">' +
        '<label>' + HF.c(cp, 'rot') + '</label><div class="hfc-ce-cx"><span class="hfc-ce-v">' + HF.c(cp, certo ? 'ok' : 'err') + '</span><i class="hfc-ce-car"></i><i class="hfc-ce-ic x">' + ICO_X + '</i><i class="hfc-ce-ic ok">' + ICO_OK + '</i></div>' +
        '<div class="hfc-ce-ms"><span class="m-e">' + HF.c(cp, 'msg') + '</span><span class="m-ok">' + HF.c(cp, 'fim') + '</span></div></div>';
    },
    painel: function (c, o, F) {
      var p = o.props;
      c.appendChild(F.campo('Mostrar aqui no Design', F.sel(p.verDesign || 'erro', [['erro', 'O erro'], ['certo', 'O acerto']], function (v) { p.verDesign = v; F.muda() })));
      F.nota('Na apresentação o campo começa vazio. 1º clique: digita o valor errado. 2º: o campo treme vermelho e mostra o erro. 3º: apaga e digita o valor certo, que fica verde. O clique seguinte recomeça.');
    }
  }, function (el) {
    var v = el.querySelector('.hfc-ce-v'), fase = 0, g = 0, err = el.dataset.err || '', ok = el.dataset.ok || '', ind = HF.passos(el);
    function inicio() { fase = 0; g++; seco(el, function () { el.className = 'hfc-ce'; v.textContent = '' }); ind(0, 3) }
    inicio();
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      if (fase >= 3) return inicio();  /* 10/11: depois do acerto, recomeça vazio */
      fase++; ind(fase, 3); var meu = ++g; function vale() { return meu === g }
      if (fase === 1) { el.className = 'hfc-ce foco'; digita(el, v, err, 70, vale) }
      if (fase === 2) { v.textContent = err; el.className = 'hfc-ce erro treme'; HF.som(el, 'errosuave'); depois(el, 500, function () { el.classList.remove('treme') }) }
      if (fase === 3) {
        el.className = 'hfc-ce foco';
        /* apaga de trás para frente e digita o certo */
        (function apaga() {
          if (!HF.vivo(el) || !vale()) return;
          if (v.textContent.length) { v.textContent = v.textContent.slice(0, -1); return setTimeout(apaga, 28) }
          digita(el, v, ok, 65, vale, function () { el.className = 'hfc-ce certo'; HF.som(el, 'certo') });
        })();
      }
    });
  });

  /* ===================== 6. Tela de cadastro ===================== */
  var LINHAS_PADRAO = [{ t: 'Nome completo', v: 'Ana Silva' }, { t: 'E-mail', v: 'ana@exemplo.com' }, { t: 'Senha', v: 'minhasenha1', tipo: 'senha' }];
  HF.elemento('hf_cadastro', { nome: 'Tela de cadastro', w: 420, h: 520, corRot: 'Cor do botão', corPad: '#2563eb', tamTexto: 1,
    campos: { tit: 'Crie sua conta', sub: 'Leva menos de um minuto.', bt: 'Criar conta', fim: 'Conta criada!' },
    rotulos: { tit: 'Título', sub: 'Frase abaixo do título', bt: 'Texto do botão', fim: 'Mensagem de sucesso' },
    html: function (p) {
      var cp = p.campos || {}, ls = p.linhas || LINHAS_PADRAO, fs = p.tamTexto || 17;
      return '<div class="hfc-cd" data-hf="hf_cadastro"' + (p.ajuste === false ? '' : ' data-hf-cabe="1"') + ' style="--hc:' + cor(p) + ';font-size:' + fs + 'px"><h3>' + HF.c(cp, 'tit') + '</h3><p class="hfc-cd-sub">' + HF.c(cp, 'sub') + '</p>' +
        ls.map(function (q) { var val = String(q.v || ''); return '<div class="hfc-cd-f feito" data-v="' + esc(val) + '"' + (q.tipo === 'senha' ? ' data-senha="1"' : '') + '><label>' + HF.txt(q.t) + '</label><div class="hfc-cd-cx"><span class="hfc-cd-v">' + esc(q.tipo === 'senha' ? val.replace(/./g, '•') : val) + '</span><i class="hfc-cd-car"></i><i class="hfc-cd-ok">' + ICO_OK + '</i></div></div>' }).join('') +
        '<div class="hfc-cd-bt"><span>' + HF.c(cp, 'bt') + '</span><i class="hfc-cd-gira"></i></div>' +
        '<div class="hfc-cd-fim"><i>' + ICO_OK + '</i><b>' + HF.c(cp, 'fim') + '</b></div></div>';
    },
    /* 10/11: muitos campos: a letra diminui para caber (formulário não vira página: cada campo é um passo) */
    cabe: function (el) { return HF.cabe(el, { paginar: false }) },
    painel: function (c, o, F) {
      var p = o.props; if (!p.linhas) p.linhas = EA.clona(LINHAS_PADRAO);
      c.appendChild(F.ck('Muitos campos: diminuir a letra para caber', p.ajuste !== false, function (v) { p.ajuste = v; F.muda() }));
      /* 10/11: cada campo numa caixinha, um controle embaixo do outro (na lista em linha ficava apertado) */
      c.appendChild(F.grupo('Campos do formulário'));
      p.linhas.forEach(function (q, i) {
        var cx = EA.el('div', 'hfc-item');
        cx.appendChild(EA.el('b', 'hfc-item-t', 'Campo ' + (i + 1)));
        cx.appendChild(F.campo('Tipo', F.sel(q.tipo || '', [['', 'Texto normal'], ['senha', 'Senha (aparece em bolinhas)']], function (v) { q.tipo = v; F.muda() })));
        cx.appendChild(F.campo('Nome do campo', F.txt(q.t, function (v) { q.t = v; F.refaz() }, 'ex.: E-mail')));
        cx.appendChild(F.campo('Valor de exemplo', F.txt(q.v, function (v) { q.v = v; F.refaz() }, 'o que vai ser digitado')));
        cx.appendChild(botoesItem(F, p.linhas, i));
        c.appendChild(cx);
      });
      var nv = EA.el('button', 'in-botao prim', '+ Novo campo'); nv.type = 'button';
      nv.onclick = function () { p.linhas.push({ t: 'Novo campo', v: '' }); F.muda(); F.mostra() };
      c.appendChild(nv);
      F.nota('Na apresentação os campos começam vazios. Cada clique na peça preenche o próximo campo (digitando). O último clique aperta o botão e mostra o sucesso. O clique seguinte volta ao formulário vazio.');
    }
  }, function (el) {
    var fs = el.querySelectorAll('.hfc-cd-f'), bt = el.querySelector('.hfc-cd-bt'), at = -1, g = 0, total = fs.length + 1, ind = HF.passos(el, 'dentro');
    function inicio() {
      at = -1; g++;
      seco(el, function () { el.classList.remove('pronto'); bt.classList.remove('aperta', 'gira'); [].forEach.call(fs, function (f) { f.classList.remove('feito', 'foco'); f.querySelector('.hfc-cd-v').textContent = '' }) });
      ind(0, total);
    }
    inicio();
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      if (at >= fs.length) return inicio();  /* 10/11: depois do "Conta criada!", volta ao formulário vazio */
      at++; ind(at + 1, total); var meu = ++g; function vale() { return meu === g }
      /* o campo anterior termina na hora, se a pessoa clicou antes de acabar de digitar */
      [].forEach.call(fs, function (f, i) { if (i < at) { f.classList.remove('foco'); f.classList.add('feito'); var s = f.dataset.v || ''; f.querySelector('.hfc-cd-v').textContent = f.dataset.senha ? s.replace(/./g, '•') : s } });
      if (at < fs.length) {
        var f = fs[at], s = f.dataset.v || ''; f.classList.add('foco');
        digita(el, f.querySelector('.hfc-cd-v'), f.dataset.senha ? s.replace(/./g, '•') : s, 60, vale, function () { f.classList.remove('foco'); f.classList.add('feito') });
        return;
      }
      bt.classList.add('aperta'); HF.som(el, 'clique');
      depois(el, 160, function () { if (vale()) { bt.classList.remove('aperta'); bt.classList.add('gira') } });
      depois(el, 1100, function () { if (vale()) { el.classList.add('pronto'); HF.som(el, 'sucesso') } });
    });
  });

  /* ===================== 7. Código antes e depois ===================== */
  var ANTES_PADRAO = "function preco(valor) {\n  return valor;\n}\n\nmostra(preco(100));";
  var DEPOIS_PADRAO = "function preco(valor, desconto) {\n  var final = valor - desconto;\n  return final;\n}\n\nmostra(preco(100, 15));";
  /* diferença linha a linha (guarda a maior parte em comum) */
  function diferenca(a, b) {
    var n = a.length, m = b.length, t = [], i, j, r = [];
    for (i = n; i >= 0; i--) { t[i] = []; for (j = m; j >= 0; j--) t[i][j] = i === n || j === m ? 0 : a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]) }
    i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { r.push({ t: '=', x: a[i], na: i + 1, nb: j + 1 }); i++; j++ }
      else if (t[i + 1][j] >= t[i][j + 1]) { r.push({ t: '-', x: a[i], na: i + 1 }); i++ }
      else { r.push({ t: '+', x: b[j], nb: j + 1 }); j++ }
    }
    while (i < n) { r.push({ t: '-', x: a[i], na: i + 1 }); i++ }
    while (j < m) { r.push({ t: '+', x: b[j], nb: j + 1 }); j++ }
    return r;
  }
  HF.elemento('hf_diff', { nome: 'Código antes e depois', w: 720, h: 380, corRot: 'Cor do título', corPad: '#6f88a8', tamTexto: 1,
    campos: { tit: 'loja.js' }, rotulos: { tit: 'Nome do arquivo' },
    html: function (p) {
      var a = String(p.antes == null ? ANTES_PADRAO : p.antes).replace(/\r/g, '').split('\n'), b = String(p.depois == null ? DEPOIS_PADRAO : p.depois).replace(/\r/g, '').split('\n');
      var cls = { '=': 'ig', '-': 'sai', '+': 'entra' };
      return '<div class="hfc-df" data-hf="hf_diff" style="--ht:' + esc(p.cor || '#6f88a8') + ';font-size:' + (p.tamTexto || 17) + 'px"><div class="hfc-df-t"><i></i><i></i><i></i>' + HF.c(p.campos || {}, 'tit') + '<em class="hfc-df-et"><span class="a">Antes</span><span class="b">Depois</span></em></div><div class="hfc-df-c">' +
        diferenca(a, b).map(function (l) { return '<div class="hfc-df-l ' + cls[l.t] + '"><span class="hfc-df-n"><span class="a">' + (l.na || '') + '</span><span class="b">' + (l.nb || '') + '</span></span><span class="hfc-df-s">' + (l.t === '=' ? ' ' : l.t === '-' ? '−' : '+') + '</span><span class="hfc-df-x">' + (esc(l.x) || ' ') + '</span></div>' }).join('') + '</div></div>';
    },
    painel: function (c, o, F) {
      var p = o.props;
      c.appendChild(F.grupo('Código'));
      c.appendChild(F.campo('Antes', F.area(p.antes == null ? ANTES_PADRAO : p.antes, function (v) { p.antes = v; F.refaz() }, '', 6)));
      c.appendChild(F.campo('Depois', F.area(p.depois == null ? DEPOIS_PADRAO : p.depois, function (v) { p.depois = v; F.refaz() }, '', 6)));
      F.nota('Aqui no Design aparece a diferença: linhas que saem em vermelho (−) e as que entram em verde (+). Na apresentação começa só o código de antes; o clique na peça risca e tira as linhas velhas e faz as novas entrarem em verde. O clique seguinte volta ao código de antes.');
    }
  }, function (el) {
    var feito = false, g = 0, ind = HF.passos(el, 'dentro');
    function inicio() { feito = false; g++; seco(el, function () { el.classList.remove('fase-depois', 'assentou', 'marca'); el.classList.add('fase-antes') }); ind(0, 1) }
    inicio();
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      if (feito) return inicio();  /* 10/11: depois da troca, volta ao código de antes */
      feito = true; ind(1, 1); var meu = ++g; HF.som(el, 'teclado');
      el.classList.add('marca');
      depois(el, 650, function () { if (meu === g) { el.classList.remove('fase-antes', 'marca'); el.classList.add('fase-depois') } });
      depois(el, 3200, function () { if (meu === g) el.classList.add('assentou') });
    });
  });

  /* ===================== estilos ===================== */
  HF.css(
    /* moldura e lugar vazio */
    '.hfc-m{position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;width:100%;height:100%}' +
    '.hfc-m-cel{background:#111827;border-radius:36px;padding:9px;box-shadow:0 18px 40px rgba(15,23,42,.28),inset 0 0 0 2px #374151}' +
    '.hfc-m-cel>.hfc-tela{border-radius:28px}.hfc-ilha{position:absolute;top:16px;left:50%;width:28%;height:15px;transform:translateX(-50%);background:#111827;border-radius:10px;z-index:8}' +
    '.hfc-m-pc{background:#fff;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 14px 36px rgba(15,23,42,.16)}' +
    '.hfc-barra{height:30px;flex:none;display:flex;align-items:center;gap:6px;padding:0 12px;background:#f1f5f9;border-bottom:1px solid #e2e8f0}.hfc-barra i{width:10px;height:10px;border-radius:50%;background:#ef4444}.hfc-barra i+i{background:#f59e0b}.hfc-barra i+i+i{background:#22c55e}.hfc-barra b{flex:1;max-width:55%;height:16px;margin-left:10px;border-radius:8px;background:#fff;border:1px solid #e2e8f0}' +
    '.hfc-m-sem{border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,.15)}' +
    '.hfc-tela{position:relative;flex:1;min-height:0;overflow:hidden;background:#f1f5f9}.hfc-tela>img,.hfc-cam>img,.hfc-ex-tl>img{position:absolute;inset:0;width:100%;height:100%;display:block;background:#fff}' +
    '.hfc-vazio{position:absolute;inset:0;display:flex;flex-direction:column;gap:7%;background:linear-gradient(#f8fafc,#e9eef5);font:600 15px/1.3 "Segoe UI",Arial,sans-serif;color:#64748b}' +
    '.hfc-vz-b{display:block;height:11%;max-height:48px;min-height:16px;flex:none;background:var(--hc,#2563eb);opacity:.8}.hfc-vz-l{display:block;height:9px;width:70%;margin:0 0 -4% 9%;border-radius:6px;background:#dbe3ec;flex:none}.hfc-vz-l.c{width:48%}' +
    '.hfc-vz-m{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px;text-align:center}.hfc-vz-m svg{width:38px;height:38px;color:#94a3b8}.hfc-vz-m small{font-size:12px;font-weight:500;color:#94a3b8}' +
    /* telas em sequência */
    '.hfc-seco,.hfc-seco *{transition:none!important;animation:none!important}' +
    '.hfc-telas{position:absolute;inset:0;font-family:"Segoe UI",Arial,sans-serif;color:#0f172a}' +
    '.hfc-tl-pista{position:absolute;left:0;right:0;top:0;height:calc(var(--fh) + 30px);overflow:hidden}' +
    '.hfc-tl-it{position:absolute;left:50%;top:8px;width:var(--fw);height:var(--fh);margin-left:calc(var(--fw) / -2);transition:transform .75s cubic-bezier(.65,0,.35,1),opacity .75s,filter .75s;z-index:3}' +
    '.hfc-tl-it[data-pos="1"]{transform:translateX(var(--pas)) scale(.8);opacity:.45;filter:saturate(.6);z-index:2}.hfc-tl-it[data-pos="-1"]{transform:translateX(calc(var(--pas) * -1)) scale(.8);opacity:.45;filter:saturate(.6);z-index:2}' +
    '.hfc-tl-it[data-pos="2"],.hfc-tl-it[data-pos="3"]{transform:translateX(calc(var(--pas) * 1.7)) scale(.62);opacity:0;z-index:1}.hfc-tl-it[data-pos="-2"],.hfc-tl-it[data-pos="-3"]{transform:translateX(calc(var(--pas) * -1.7)) scale(.62);opacity:0;z-index:1}' +
    '.hfc-tl-rod{position:absolute;left:0;right:0;bottom:4px;display:flex;flex-direction:column;align-items:center;gap:10px}' +
    '.hfc-tl-leg{display:grid;width:100%;font-weight:700}.hfc-tl-leg p{grid-area:1/1;margin:0;padding:0 12px;text-align:center;line-height:1.25;opacity:0;transform:translateY(10px);transition:opacity .45s,transform .55s}.hfc-tl-leg p.on{opacity:1;transform:none;transition-delay:.25s}' +
    /* tela com explicações */
    '.hfc-ex{position:absolute;inset:0;display:flex;align-items:center;gap:44px;font-family:"Segoe UI",Arial,sans-serif;color:#0f172a}.hfc-ex.dir{flex-direction:row-reverse}' +
    '.hfc-ex-mold{flex:none;width:var(--fw);height:var(--fh)}' +
    '.hfc-ex-tl{position:absolute;inset:0;opacity:0;transform:translateY(7%);transition:opacity .5s,transform .7s cubic-bezier(.22,1,.36,1)}.hfc-ex-tl.on{opacity:1;transform:none;z-index:2}.hfc-ex-tl.saiu{opacity:0;transform:translateY(-4%) scale(.96)}' +
    '.hfc-ex-txt{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:26px}' +
    '.hfc-ex-pilha{display:grid}.hfc-ex-p{grid-area:1/1;opacity:0;transform:translateX(26px);transition:opacity .45s,transform .6s cubic-bezier(.22,1,.36,1);pointer-events:none}.hfc-ex-p.on{opacity:1;transform:none;transition-delay:.15s;pointer-events:auto}.hfc-ex-p.saiu{transform:translateX(-26px);transition-delay:0s}' +
    '.hfc-ex-et{display:inline-flex;align-items:center;gap:10px;font:700 14px "Segoe UI",Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--hc)}.hfc-ex-et b{width:34px;height:34px;border-radius:50%;background:var(--hc);color:#fff;display:grid;place-items:center;font-size:17px;letter-spacing:0}' +
    '.hfc-ex-p h3{margin:14px 0 10px;font:800 32px/1.15 "Segoe UI",Arial,sans-serif}.hfc-ex-p p{margin:0;line-height:1.45;color:#475569}' +
    '.hfc-ex-bar{display:flex;gap:6px}.hfc-ex-bar i{flex:1;max-width:70px;height:6px;border-radius:4px;background:#e2e8f0;position:relative;overflow:hidden}.hfc-ex-bar i::after{content:"";position:absolute;inset:0;background:var(--hc);transform:scaleX(0);transform-origin:left;transition:transform .6s .15s}.hfc-ex-bar i.on::after{transform:none}' +
    /* cliques e zoom */
    '.hfc-cq{position:absolute;inset:0;font-family:"Segoe UI",Arial,sans-serif}.hfc-cq-cel{position:absolute}' +
    '.hfc-cam{position:absolute;inset:0;transform-origin:0 0;transition:transform .9s cubic-bezier(.65,0,.35,1);--inv:1}' +
    '.hfc-mk{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:var(--hc);color:#fff;font:800 15px/30px "Segoe UI",Arial,sans-serif;text-align:center;box-shadow:0 0 0 3px #fff,0 4px 12px rgba(0,0,0,.3);z-index:4;cursor:grab;touch-action:none;user-select:none}.hfc-mk.arrasta{cursor:grabbing;transform:scale(1.2)}' +
    '.apresenta .hfc-mk,.apresenta .hfc-zq{display:none}' +
    '.hfc-zq{position:absolute;border:2px dashed var(--hc);border-radius:8px;box-shadow:0 0 0 2000px rgba(15,23,42,.14);z-index:3;pointer-events:none}' +
    '.hfc-cur{position:absolute;width:34px;height:34px;margin:-4px 0 0 -7px;z-index:6;pointer-events:none;transform-origin:7px 4px;transform:scale(var(--inv));transition:left .75s cubic-bezier(.65,0,.35,1),top .75s cubic-bezier(.65,0,.35,1),transform .9s cubic-bezier(.65,0,.35,1);filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}.hfc-cur svg{width:100%;height:100%;display:block;transition:transform .12s}.hfc-cur.aperta svg{transform:scale(.82)}' +
    '.hfc-ras i{position:absolute;width:calc(12px * var(--inv));height:calc(12px * var(--inv));margin:calc(-6px * var(--inv)) 0 0 calc(-6px * var(--inv));border-radius:50%;background:var(--hc);opacity:0;z-index:5;pointer-events:none;transition:left calc(.75s + var(--i) * .07s) cubic-bezier(.65,0,.35,1) calc(var(--i) * .03s),top calc(.75s + var(--i) * .07s) cubic-bezier(.65,0,.35,1) calc(var(--i) * .03s),opacity .35s}' +
    '.hfc-cq.anda .hfc-ras i{opacity:calc(.42 - var(--i) * .07);transition:left calc(.75s + var(--i) * .07s) cubic-bezier(.65,0,.35,1) calc(var(--i) * .03s),top calc(.75s + var(--i) * .07s) cubic-bezier(.65,0,.35,1) calc(var(--i) * .03s),opacity .1s}' +
    '.hfc-onda{position:absolute;width:calc(64px * var(--inv));height:calc(64px * var(--inv));margin:calc(-32px * var(--inv)) 0 0 calc(-32px * var(--inv));border-radius:50%;border:3px solid var(--hc);box-sizing:border-box;background:color-mix(in srgb,var(--hc) 22%,transparent);z-index:5;pointer-events:none;animation:hfcOnda .8s ease-out forwards}' +
    '@keyframes hfcOnda{from{transform:scale(.15);opacity:1}to{transform:scale(1.35);opacity:0}}' +
    '.hfc-rot{position:absolute;z-index:9;max-width:44%;margin:26px 0 0 20px;background:#0f172a;color:#fff;font-weight:600;line-height:1.3;padding:9px 15px;border-radius:10px;border-left:4px solid var(--hc);box-shadow:0 10px 26px rgba(15,23,42,.3);opacity:0;transform:translateY(6px);transition:opacity .25s,transform .3s;pointer-events:none;white-space:normal;width:max-content}' +
    '.hfc-rot.on{opacity:1;transform:none}.hfc-rot.e{translate:-100% 0;margin-left:-20px}.hfc-rot.c{translate:0 -100%;margin-top:-26px}.hfc-rot.e.c{translate:-100% -100%}' +
    /* campo com erro e acerto */
    '.hfc-ce{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:9px;font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;--ce:#dc2626;--cv:#16a34a}' +
    '.hfc-ce label{font-weight:700;font-size:.8em;color:#334155}' +
    '.hfc-ce-cx{position:relative;display:flex;align-items:center;gap:10px;height:2.6em;padding:0 16px 0 18px;background:#fff;border:2px solid #cbd5e1;border-radius:12px;transition:border-color .25s,box-shadow .25s,background .25s}' +
    '.hfc-ce.foco .hfc-ce-cx{border-color:var(--hc);box-shadow:0 0 0 4px color-mix(in srgb,var(--hc) 20%,transparent)}.hfc-ce.erro .hfc-ce-cx{border-color:var(--ce);background:#fef2f2;box-shadow:0 0 0 4px rgba(220,38,38,.14)}.hfc-ce.certo .hfc-ce-cx{border-color:var(--cv);background:#f0fdf4;box-shadow:0 0 0 4px rgba(22,163,74,.14)}' +
    '.hfc-ce-v{white-space:nowrap;overflow:hidden}.hfc-ce-car{display:none;width:2px;height:1.15em;margin-left:-9px;background:var(--hc);animation:hfcPisca 1s steps(1) infinite}.hfc-ce.foco .hfc-ce-car{display:block}' +
    '.hfc-ce-ic{width:28px;height:28px;flex:none;border-radius:50%;display:none;place-items:center;color:#fff;margin-left:auto;animation:hfcPop .35s cubic-bezier(.34,1.56,.64,1)}.hfc-ce-ic svg{width:16px;height:16px}.hfc-ce.erro .hfc-ce-ic.x{display:grid;background:var(--ce)}.hfc-ce.certo .hfc-ce-ic.ok{display:grid;background:var(--cv)}' +
    '.hfc-ce-ms{display:grid;min-height:1.4em;font-weight:600;font-size:.75em}.hfc-ce-ms>span{grid-area:1/1;opacity:0;transform:translateY(-5px);transition:opacity .25s,transform .25s}.hfc-ce.erro .m-e{opacity:1;transform:none;color:var(--ce)}.hfc-ce.certo .m-ok{opacity:1;transform:none;color:var(--cv)}' +
    '.hfc-ce.treme .hfc-ce-cx{animation:hfcTreme .45s}' +
    '@keyframes hfcTreme{20%{transform:translateX(-10px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}@keyframes hfcPisca{50%{opacity:0}}@keyframes hfcPop{from{transform:scale(0)}}' +
    /* tela de cadastro */
    '.hfc-cd{position:absolute;inset:0;box-sizing:border-box;display:flex;flex-direction:column;gap:13px;padding:28px 30px;background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 18px 44px rgba(15,23,42,.14);font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;overflow:hidden}' +
    '.hfc-cd h3{margin:0;font-size:1.55em;font-weight:800;line-height:1.15}.hfc-cd-sub{margin:-6px 0 4px;color:#64748b;font-size:.88em}' +
    '.hfc-cd-f label{display:block;margin-bottom:5px;font-size:.8em;font-weight:700;color:#334155}' +
    '.hfc-cd-cx{display:flex;align-items:center;height:2.6em;padding:0 12px 0 14px;border:2px solid #e2e8f0;border-radius:10px;background:#f8fafc;transition:border-color .2s,box-shadow .2s,background .2s}.hfc-cd-v{white-space:nowrap;overflow:hidden}' +
    '.hfc-cd-f.foco .hfc-cd-cx{border-color:var(--hc);background:#fff;box-shadow:0 0 0 4px color-mix(in srgb,var(--hc) 18%,transparent)}.hfc-cd-f.feito .hfc-cd-cx{background:#fff;border-color:#cbd5e1}' +
    '.hfc-cd-car{display:none;width:2px;height:1.1em;margin-left:1px;background:var(--hc);animation:hfcPisca 1s steps(1) infinite}.hfc-cd-f.foco .hfc-cd-car{display:block}' +
    '.hfc-cd-ok{display:none;margin-left:auto;width:22px;height:22px;flex:none;border-radius:50%;background:#16a34a;color:#fff;place-items:center;animation:hfcPop .35s cubic-bezier(.34,1.56,.64,1)}.hfc-cd-ok svg{width:13px;height:13px}.hfc-cd-f.feito .hfc-cd-ok{display:grid}' +
    '.hfc-cd-bt{position:relative;margin-top:auto;height:2.9em;flex:none;border-radius:12px;background:var(--hc);color:#fff;font-weight:700;font-size:1.05em;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px color-mix(in srgb,var(--hc) 35%,transparent);transition:transform .15s}' +
    '.hfc-cd-bt.aperta{transform:scale(.95)}.hfc-cd-gira{display:none;width:20px;height:20px;border-radius:50%;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;animation:hfcGira .7s linear infinite}.hfc-cd-bt.gira span{display:none}.hfc-cd-bt.gira .hfc-cd-gira{display:block}' +
    '.hfc-cd-fim{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#fff;opacity:0;pointer-events:none;transition:opacity .35s}.hfc-cd-fim i{width:78px;height:78px;border-radius:50%;background:#16a34a;color:#fff;display:grid;place-items:center;transform:scale(0);transition:transform .5s .1s cubic-bezier(.34,1.56,.64,1)}.hfc-cd-fim i svg{width:40px;height:40px}.hfc-cd-fim b{font-size:1.4em}' +
    '.hfc-cd.pronto .hfc-cd-fim{opacity:1;pointer-events:auto}.hfc-cd.pronto .hfc-cd-fim i{transform:none}@keyframes hfcGira{to{transform:rotate(360deg)}}' +
    /* código antes e depois */
    '.hfc-df{position:absolute;inset:0;display:flex;flex-direction:column;background:#0b1424;color:#c9d6e8;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(5,15,35,.35)}' +
    '.hfc-df-t{display:flex;align-items:center;gap:7px;padding:13px 18px 8px;font:700 12px "Segoe UI",Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ht)}.hfc-df-t>i{width:10px;height:10px;border-radius:50%;background:#2a3c56}.hfc-df-t>span{margin-left:6px}' +
    '.hfc-df-et{margin-left:auto;font-style:normal;display:grid}.hfc-df-et span{grid-area:1/1;padding:3px 10px;border-radius:20px;transition:opacity .3s;text-align:center}.hfc-df-et .a{background:rgba(239,68,68,.16);color:#fca5a5;opacity:0}.hfc-df-et .b{background:rgba(34,197,94,.16);color:#86efac}' +
    '.hfc-df.fase-antes .hfc-df-et .a{opacity:1}.hfc-df.fase-antes .hfc-df-et .b{opacity:0}' +
    '.hfc-df-c{flex:1;min-height:0;overflow:hidden;padding:4px 0 14px;font-family:Consolas,"JetBrains Mono","Courier New",monospace;font-weight:500;line-height:1.65}' +
    '.hfc-df-l{display:flex;white-space:pre;max-height:1.65em;overflow:hidden;transition:max-height .55s cubic-bezier(.65,0,.35,1),opacity .45s,background .5s}' +
    '.hfc-df-n{width:3em;flex:none;text-align:right;padding-right:.9em;color:#3d5373;user-select:none;display:grid}.hfc-df-n span{grid-area:1/1}.hfc-df-n .a{opacity:0}' +
    '.hfc-df-s{width:1.3em;flex:none;text-align:center}.hfc-df-x{flex:1;padding-right:16px;overflow:hidden;text-overflow:ellipsis}' +
    '.hfc-df-l.sai{background:rgba(239,68,68,.15);color:#fecaca}.hfc-df-l.sai .hfc-df-s{color:#f87171}.hfc-df-l.sai .hfc-df-n .a{opacity:1}.hfc-df-l.entra{background:rgba(34,197,94,.14);color:#dcfce7}.hfc-df-l.entra .hfc-df-s{color:#4ade80}' +
    '.hfc-df.fase-antes .hfc-df-l.entra{max-height:0;opacity:0}.hfc-df.fase-antes .hfc-df-l.sai{background:none;color:inherit}.hfc-df.fase-antes .hfc-df-s{color:transparent}.hfc-df.fase-antes .hfc-df-n .a{opacity:1}.hfc-df.fase-antes .hfc-df-n .b{opacity:0}' +
    '.hfc-df.fase-antes.marca .hfc-df-l.sai{background:rgba(239,68,68,.28);color:#fecaca;text-decoration:line-through;text-decoration-color:#f87171}.hfc-df.fase-antes.marca .hfc-df-l.sai .hfc-df-s{color:#f87171}' +
    '.hfc-df.fase-depois .hfc-df-l.sai{max-height:0;opacity:0}.hfc-df.fase-depois .hfc-df-l.entra{animation:hfcBrilho 1.2s ease-out}.hfc-df.assentou .hfc-df-l.entra{background:rgba(34,197,94,.08)}' +
    '@keyframes hfcBrilho{from{background:rgba(34,197,94,.45)}}' +
    /* caixinhas do painel Design (ajuste de print, campos do cadastro) */
    '.hfc-aj{border-left:3px solid #cbd5e1;padding:2px 0 2px 10px;margin:2px 0 10px}.hfc-aj .in-botao{margin-bottom:0}' +
    '.hfc-item{border:1px solid #e2e8f0;border-left:3px solid #3b82f6;border-radius:8px;padding:8px 10px 2px;margin-bottom:8px;background:#fff}.hfc-item-t{display:block;font-size:12px;color:#64748b;margin-bottom:4px}.hfc-item .in-linha .in-botao{margin-bottom:6px;padding-left:4px;padding-right:4px;white-space:nowrap}' +
    /* miniatura com os pontos no painel Design */
    '.hfc-pv{position:relative;width:100%;overflow:hidden;border-radius:8px;background:#e2e8f0;margin:2px 0 10px}.hfc-pv-in{position:absolute;left:0;top:0;transform-origin:0 0}.hfc-pv .hfc-mk{width:46px;height:46px;margin:-23px 0 0 -23px;font-size:23px;line-height:46px}.hfc-pv .hfc-cur,.hfc-pv .hfc-ras{display:none}'
  );
})();
