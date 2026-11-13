/* Elementos interativos (07/11): ponto clicável, palavras explicadas, antes e depois,
   abas/sanfona e carrossel de cartas (tipo Tinder). Tudo leve: HTML + CSS + um pouco de JS na apresentação.
   No editor aparecem paradinhos; na apresentação ganham vida (e o clique neles não passa o slide). */
(function () {
  var EA = window.EA, esc = EA.esc;
  function c(campos, k) { return '<span data-campo="' + k + '">' + (campos[k] == null ? '' : campos[k]) + '</span>' }
  function txt(s) { return esc(s || '').replace(/\n/g, '<br>') }
  var I = EA.Interativos = {};

  /* ---------- ponto clicável: cintila; o clique abre uma caixinha de texto ---------- */
  /* 08/11: era 'ponto' e apagava o Ponto-chave (faixa "PARA LEVAR" dos modelos), que já usava esse nome */
  EA.ELEMENTOS.pontoclique = { nome: 'Ponto clicável', grupo: 'interativos', w: 46, h: 46, razao: 1, corRot: 'Cor do ponto', corPad: '#2563eb', tamTexto: 1, cores: [['fundoUi', 'Fundo da caixa', '#ffffff'], ['corTexto', 'Cor do texto da caixa', '#0f172a']],
    campos: { n: '1', t: 'Título', d: 'Escreva aqui a explicação que aparece quando a pessoa clica no ponto.' },
    html: function (p) {
      var cor = p.cor || '#2563eb', lado = p.lado || 'direita', aberto = p.verCaixa ? ' on' : '';
      return '<div class="ui-hot" data-vivo="hot" style="--hc:' + esc(cor) + '"><i class="ui-hot-a"></i><i class="ui-hot-a d2"></i><b class="ui-hot-p">' + c(p.campos, 'n') + '</b>' +
        '<div class="ui-hot-cx l-' + esc(lado) + aberto + '" style="width:' + (p.larguraCaixa || 280) + 'px;' + (p.fundoUi ? 'background:' + esc(p.fundoUi) + ';' : '') + (p.corTexto ? 'color:' + esc(p.corTexto) + ';' : '') + 'font-size:' + (p.tamTexto || 16) + 'px"><b>' + c(p.campos, 't') + '</b><p>' + c(p.campos, 'd') + '</p></div></div>';
    } };

  /* ---------- texto com palavras explicadas: clicar na palavra abre o balãozinho ---------- */
  EA.ELEMENTOS.glossario = { nome: 'Palavras explicadas', grupo: 'interativos', w: 620, h: 140, corRot: 'Cor das palavras', corPad: '#2563eb', tamTexto: 1, cores: [['corTexto', 'Cor do texto', '#0f172a']],
    campos: { t: 'O Pixel conta quantas pessoas compraram depois de ver o anúncio. Assim dá para saber o CTR e o custo por venda.' },
    html: function (p) {
      var t = String(p.campos.t || '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      var ps = (p.palavras || [{ t: 'Pixel', d: 'Um código da Meta no site que avisa quando alguém compra.' }, { t: 'CTR', d: 'De cada 100 pessoas que veem o anúncio, quantas clicam.' }]).filter(function (q) { return q.t });
      var marca = [];
      ps.forEach(function (q, n) { var i = t.indexOf(q.t); if (i >= 0 && !marca.some(function (m) { return i < m[1] && i + q.t.length > m[0] })) marca.push([i, i + q.t.length, n]) });
      marca.sort(function (a, b) { return a[0] - b[0] });
      var out = '', at = 0;
      marca.forEach(function (m) { out += txt(t.slice(at, m[0])) + '<span class="ui-glo-p" data-d="' + esc(ps[m[2]].d || '') + '">' + txt(t.slice(m[0], m[1])) + '</span>'; at = m[1] });
      out += txt(t.slice(at));
      return '<div class="ui-glo" data-vivo="glo" style="--gc:' + esc(p.cor || '#2563eb') + ';font-size:' + (p.tamTexto || 24) + 'px;' + (p.corTexto ? 'color:' + esc(p.corTexto) : '') + '">' + out + '</div>';
    } };

  /* ---------- antes e depois: duas fotos e uma barra que se arrasta ---------- */
  EA.ELEMENTOS.antesdepois = { nome: 'Antes e depois', grupo: 'interativos', w: 640, h: 400, raio: 14, fotos: [['', 'Foto do antes'], ['2', 'Foto do depois']], corRot: 'Cor da barra', corPad: '#ffffff',
    campos: { a: 'Antes', b: 'Depois' },
    html: function (p, o, ctx) {
      var u1 = EA.urlFoto(p, '', ctx), u2 = EA.urlFoto(p, '2', ctx), pos = p.pos == null ? 50 : p.pos;
      function lado(u, k, rot) { return u ? '<img draggable="false" alt="" src="' + esc(u) + '">' : '<span class="ui-ad-vazio ' + k + '">' + rot + '</span>' }
      return '<div class="ui-ad" data-vivo="ad" style="--pos:' + pos + '%;--bc:' + esc(p.cor || '#ffffff') + '"><div class="ui-ad-l">' + lado(u1, 'a', 'foto do antes') + '</div><div class="ui-ad-l ui-ad-d">' + lado(u2, 'b', 'foto do depois') + '</div>' +
        '<span class="ui-ad-r ra">' + c(p.campos, 'a') + '</span><span class="ui-ad-r rb">' + c(p.campos, 'b') + '</span><div class="ui-ad-barra"><i><svg viewBox="0 0 24 24"><path d="M9 6l-6 6l6 6M15 6l6 6l-6 6"/></svg></i></div></div>';
    } };

  /* ---------- abas e sanfona ---------- */
  EA.ITENS_PADRAO = [{ t: 'O que é', d: 'Uma explicação curta do assunto.' }, { t: 'Para que serve', d: 'O motivo de usar isso no dia a dia.' }, { t: 'Como fazer', d: 'O passo a passo, em poucas linhas.' }];
  EA.ELEMENTOS.abas = { nome: 'Abas e sanfona', grupo: 'interativos', w: 620, h: 300, corRot: 'Cor de destaque', corPad: '#2563eb', tamTexto: 1, cores: [['fundoUi', 'Fundo', '#ffffff']], campos: {},
    html: function (p) {
      var its = p.itens || EA.ITENS_PADRAO, cor = p.cor || '#2563eb', fs = 'font-size:' + (p.tamTexto || 18) + 'px;' + (p.fundoUi ? 'background:' + esc(p.fundoUi) + ';' : '');
      if (p.estilo === 'sanfona') return '<div class="ui-sanf" data-vivo="sanf" style="--ac:' + esc(cor) + ';' + fs + '">' + its.map(function (q, i) {
        return '<div class="ui-sanf-i' + (i === 0 ? ' on' : '') + '"><button type="button"><span>' + txt(q.t) + '</span><svg viewBox="0 0 24 24"><path d="M6 9l6 6l6 -6"/></svg></button><div class="ui-sanf-c"><div><p>' + txt(q.d) + '</p></div></div></div>' }).join('') + '</div>';
      return '<div class="ui-abas" data-vivo="abas" style="--ac:' + esc(cor) + ';' + fs + '"><div class="ui-abas-t">' + its.map(function (q, i) { return '<button type="button" class="' + (i === 0 ? 'on' : '') + '">' + txt(q.t) + '</button>' }).join('') + '</div>' +
        '<div class="ui-abas-c">' + its.map(function (q, i) { return '<p class="' + (i === 0 ? 'on' : '') + '">' + txt(q.d) + '</p>' }).join('') + '</div></div>';
    } };

  /* ---------- carrossel de cartas (tipo Tinder): arrasta para um lado ou outro; se a carta tem lado certo, avisa ---------- */
  EA.CARTAS_PADRAO = [{ t: 'Foto do produto com fundo limpo e boa luz', lado: 'd' }, { t: 'Texto enorme cobrindo a foto inteira', lado: 'e' }, { t: 'Preço claro e botão "Comprar agora"', lado: 'd' }];
  EA.ELEMENTOS.cartas = { nome: 'Cartas para arrastar', grupo: 'interativos', w: 420, h: 440, corRot: 'Cor do “sim”', corPad: '#16a34a', cores: [['corNao', 'Cor do “não”', '#e11d48'], ['fundoUi', 'Fundo das cartas', '#ffffff']], tamTexto: 1,
    campos: { e: 'Ruim', d: 'Bom' },
    html: function (p) {
      var cs = p.cartas || EA.CARTAS_PADRAO, fs = 'font-size:' + (p.tamTexto || 22) + 'px;' + (p.fundoUi ? 'background:' + esc(p.fundoUi) + ';' : '');
      return '<div class="ui-cartas" data-vivo="cartas" style="--sim:' + esc(p.cor || '#16a34a') + ';--nao:' + esc(p.corNao || '#e11d48') + '"><div class="ui-cartas-m">' +
        cs.slice().reverse().map(function (q, k) { var i = cs.length - 1 - k; return '<div class="ui-carta" data-i="' + i + '" data-lado="' + esc(q.lado || '') + '" style="' + fs + '--k:' + i + '"><span class="ui-carta-n">' + (i + 1) + '/' + cs.length + '</span><p>' + txt(q.t) + '</p><b class="ui-carta-s e">' + c(p.campos, 'e') + '</b><b class="ui-carta-s d">' + c(p.campos, 'd') + '</b></div>' }).join('') +
        '<div class="ui-cartas-fim"><b>Pronto!</b><span class="ui-cartas-pl"></span><button type="button">Ver de novo</button></div></div>' +
        '<div class="ui-cartas-b"><button type="button" class="e">‹ ' + c(p.campos, 'e') + '</button><button type="button" class="d">' + c(p.campos, 'd') + ' ›</button></div></div>';
    } };

  /* ---------- vida na apresentação ---------- */
  function para(ev) { ev.stopPropagation() }
  var VIDA = {
    hot: function (el) {
      var cx = el.querySelector('.ui-hot-cx');
      el.querySelector('.ui-hot-p').addEventListener('click', function (ev) { para(ev); cx.classList.toggle('on') });
      cx.addEventListener('click', para);
    },
    glo: function (el) {
      var b = EA.el('div', 'ui-glo-b'); el.appendChild(b); var at = null;
      el.addEventListener('click', function (ev) {
        var w = ev.target.closest('.ui-glo-p'); if (!w) { b.classList.remove('on'); at = null; return }
        para(ev);
        if (at === w) { b.classList.remove('on'); w.classList.remove('on'); at = null; return }
        if (at) at.classList.remove('on');
        at = w; w.classList.add('on');
        /* perto do topo do slide o balão abre embaixo da palavra, para não sair da tela */
        var r = w.getBoundingClientRect(), pal = el.closest('.palco'), topo = pal ? r.top - pal.getBoundingClientRect().top : 999, baixo = topo < 110;
        b.textContent = w.dataset.d; b.style.left = (w.offsetLeft + w.offsetWidth / 2) + 'px'; b.style.top = (baixo ? w.offsetTop + w.offsetHeight : w.offsetTop) + 'px';
        b.classList.toggle('baixo', baixo); b.classList.add('on');
      });
    },
    ad: function (el) {
      var arr = false;
      function vai(ev) { var r = el.getBoundingClientRect(); el.style.setProperty('--pos', Math.max(0, Math.min(100, (ev.clientX - r.left) / r.width * 100)) + '%') }
      el.addEventListener('pointerdown', function (ev) { para(ev); arr = true; el.setPointerCapture(ev.pointerId); vai(ev) });
      el.addEventListener('pointermove', function (ev) { if (arr) vai(ev) });
      el.addEventListener('pointerup', function () { arr = false });
      el.addEventListener('click', para);
    },
    abas: function (el) {
      var bs = el.querySelectorAll('.ui-abas-t button'), ps = el.querySelectorAll('.ui-abas-c p');
      [].forEach.call(bs, function (b, i) { b.addEventListener('click', function (ev) { para(ev); [].forEach.call(bs, function (x, k) { x.classList.toggle('on', k === i); ps[k].classList.toggle('on', k === i) }) }) });
      el.addEventListener('click', para);
    },
    sanf: function (el) {
      [].forEach.call(el.querySelectorAll('.ui-sanf-i'), function (it) { it.querySelector('button').addEventListener('click', function (ev) { para(ev); it.classList.toggle('on') }) });
      el.addEventListener('click', para);
    },
    cartas: function (el) {
      var ms = el.querySelector('.ui-cartas-m'), cs = [].slice.call(el.querySelectorAll('.ui-carta')).reverse(), i = 0, certas = 0, comLado = 0, arr = null;
      function topo() { return cs[i] }
      function joga(lado) {
        var cd = topo(); if (!cd) return;
        var certo = cd.dataset.lado ? cd.dataset.lado === lado : null;
        if (certo !== null) { comLado++; if (certo) certas++ }
        cd.classList.add('vai', lado === 'd' ? 'pd' : 'pe');
        if (certo !== null) cd.classList.add(certo ? 'certo' : 'errado');
        if (EA.Som) EA.Som.tocar(certo === false ? 'errosuave' : 'toque');
        cd.style.transform = ''; i++;
        if (i >= cs.length) setTimeout(function () { el.classList.add('acabou'); el.querySelector('.ui-cartas-pl').textContent = comLado ? certas + ' de ' + comLado + ' no lugar certo' : '' }, 380);
      }
      el.querySelector('.ui-cartas-b .e').addEventListener('click', function (ev) { para(ev); joga('e') });
      el.querySelector('.ui-cartas-b .d').addEventListener('click', function (ev) { para(ev); joga('d') });
      el.querySelector('.ui-cartas-fim button').addEventListener('click', function (ev) { para(ev); i = 0; certas = 0; comLado = 0; el.classList.remove('acabou'); cs.forEach(function (x) { x.classList.remove('vai', 'pd', 'pe', 'certo', 'errado'); x.style.transform = '' }) });
      ms.addEventListener('pointerdown', function (ev) { var cd = topo(); if (!cd || !cd.contains(ev.target)) return; para(ev); arr = { x: ev.clientX, cd: cd, k: el.getBoundingClientRect().width / el.offsetWidth || 1 }; cd.setPointerCapture(ev.pointerId); cd.classList.add('arrasta') });
      ms.addEventListener('pointermove', function (ev) { if (!arr) return; var dx = (ev.clientX - arr.x) / arr.k; arr.dx = dx; arr.cd.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 18 + 'deg)'; arr.cd.style.setProperty('--sel', Math.min(1, Math.abs(dx) / 120)); arr.cd.classList.toggle('pd', dx > 30); arr.cd.classList.toggle('pe', dx < -30) });
      ms.addEventListener('pointerup', function () { if (!arr) return; var a = arr; arr = null; a.cd.classList.remove('arrasta', 'pd', 'pe'); if (Math.abs(a.dx || 0) > 110) joga(a.dx > 0 ? 'd' : 'e'); else a.cd.style.transform = '' });
      el.addEventListener('click', para);
    }
  };
  function vive(el) {
    if (el.dataset.vivoOk || !el.closest('.apresenta')) return;
    el.dataset.vivoOk = 1;
    var f = VIDA[el.dataset.vivo]; if (f) f(el);
  }
  function procura(n) { if (n.nodeType !== 1) return; if (n.matches('[data-vivo]')) vive(n); n.querySelectorAll('[data-vivo]').forEach(vive) }
  function comeca() { new MutationObserver(function (l) { l.forEach(function (m) { m.addedNodes.forEach(procura) }) }).observe(document.body, { childList: true, subtree: true }); procura(document.body) }
  if (document.body) comeca(); else document.addEventListener('DOMContentLoaded', comeca);
})();
