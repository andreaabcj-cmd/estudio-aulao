/* Quiz num slide só: as perguntas moram dentro do slide e o feedback é animado, sem slides de resposta.
   Modelos: padrao (visual do Aulão) e rpg (batalha por turnos em pixel art, com lutadores e efeitos). Quem clica é quem apresenta. */
(function () {
  var EA = window.EA, esc = EA.esc, LETRAS = 'ABCDEF';
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }

  EA.fxMeta = function (id) {
    var lista = window.FX_INDEX || window.EA_FX_META || [];
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  };
  /* efeito solto em cima do palco, centrado num ponto; some sozinho */
  function fxSolto(palco, id, cx, cy, altura, vel) {
    var fx = EA.fxMeta(id); if (!fx) return null;
    var h = altura || fx.h * 2, w = h * fx.w / fx.h, c = EA.el('canvas', 'fx-solto');
    c.style.cssText = 'left:' + (cx - w / 2) + 'px;top:' + (cy - h / 2) + 'px;width:' + w + 'px;height:' + h + 'px';
    palco.appendChild(c);
    var s = EA.spriteFx(c, fx, { loop: false, vel: vel || 1 }); s.aoFim = function () { c.remove() };
    setTimeout(function () { c.remove() }, 4000);   /* trava: efeito solto nunca fica preso na tela */
    return s;
  }
  EA.fxSolto = fxSolto;
  /* 07/11 (o confete ficava na tela e era exagerado): estouro curto de pontinhos na cor do tema, que some em menos de 1 s */
  function festa(palco, cx, cy, raio) {
    var R = raio || 120, cores = ['var(--azul)', '#22c55e', '#f59e0b', 'var(--azul)'], cx0 = EA.el('div', 'qz-festa');
    cx0.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px';
    for (var i = 0; i < 18; i++) {
      var a = i / 18 * Math.PI * 2 + Math.random() * .3, d = R * (.55 + Math.random() * .45), p = EA.el('i');
      p.style.background = cores[i % cores.length];
      if (i % 3 === 0) { p.style.width = '10px'; p.style.height = '4px' }
      cx0.appendChild(p);
      p.animate([{ transform: 'translate(-50%,-50%) rotate(' + a + 'rad) translateX(0) scale(.4)', opacity: 0 }, { opacity: 1, offset: .15 },
        { transform: 'translate(-50%,-50%) rotate(' + a + 'rad) translateX(' + d + 'px) scale(1)', opacity: 0 }], { duration: 650 + Math.random() * 200, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' });
    }
    palco.appendChild(cx0);
    setTimeout(function () { cx0.remove() }, 1000);
  }
  EA.festa = festa;

  EA.GOLPES = {
    corte: { nome: 'Corte', corpo: true, fx: 'impacts/crit-hit', som: 'golpe', alt: 230 },
    fogo: { nome: 'Fogo', fx: 'explosions/small-explosion', som: 'fogo', alt: 300 },
    gelo: { nome: 'Gelo', fx: 'ice/ice-shatter', som: 'gelo', alt: 260 },
    raio: { nome: 'Raio', fx: 'lightning/lightning-strike', som: 'raio', alt: 380 },
    luz: { nome: 'Luz', fx: 'holy/smite', som: 'magia', alt: 360 }
  };
  EA.CENARIOS = { floresta: 'Floresta', caverna: 'Caverna', neve: 'Neve', lava: 'Lava', noite: 'Noite' };
  EA.Quiz = {};
  /* tipos de resposta: uma (uma certa), varias (marcar todas as certas), ligar (pares) */
  EA.Quiz.tipo = function (p) { return p.tipo === 'varias' || p.tipo === 'ligar' || p.tipo === 'completar' ? p.tipo : 'uma' };
  /* completar a frase (07/11): compara sem acento, sem maiúscula e sem ponto final; aceita várias respostas separadas por | */
  EA.Quiz.norma = function (s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().replace(/[.!?;,]+$/, '') };
  EA.Quiz.respostas = function (p) { return String(p.resp || '').split('|').map(function (x) { return x.trim() }).filter(Boolean) };
  EA.Quiz.certas = function (p) { return p.certas && p.certas.length ? p.certas : [p.certa || 0] };
  EA.Quiz.confere = function (p, r) {
    var t = EA.Quiz.tipo(p);
    if (r === 'tempo') return false;   /* o cronômetro acabou sem resposta */
    if (t === 'completar') return EA.Quiz.respostas(p).map(EA.Quiz.norma).indexOf(EA.Quiz.norma(r)) >= 0;
    if (t === 'varias') { var c = EA.Quiz.certas(p); return r.length === c.length && c.every(function (k) { return r.indexOf(k) >= 0 }) }
    if (t === 'ligar') return p.pares.every(function (_, k) { return r[k] == k });
    return r === p.certa;
  };

  /* quais efeitos este quiz usa (o exportador embute só estes) */
  EA.Quiz.fxUsados = function (q) {
    var l = ['ui/heart-lost'];
    if (q.modelo === 'mon' || q.modelo === 'fps' || q.modelo === 'penalti' || q.modelo === 'tatico') l = ['spawn/poof', 'impacts/blunt-hit'];
    if (q.modelo === 'rpg') {
      var g = EA.GOLPES[q.golpe] || EA.GOLPES.corte;
      l = l.concat([g.fx, 'impacts/blunt-hit', 'impacts/crit-hit', 'spawn/poof', 'ui/quest-complete']);
    }
    return l;
  };
  EA.Quiz.lutadoresUsados = function (q) { return q.modelo === 'rpg' || q.modelo === 'mon' ? [q.heroi && q.heroi.lut, q.inimigo && q.inimigo.lut].filter(Boolean) : [] };
  /* outros arquivos do jogo (cenário em camadas, golpes, texturas) */
  EA.Quiz.arquivosUsados = function (q) {
    if (q.modelo === 'tatico') EA.Quiz.atualizaCenario(q);
    var l = [];
    if (q.modelo === 'rpg' && q.cenImg) l = l.concat(q.cenImg.camadas);
    if ((q.modelo === 'penalti' || q.modelo === 'tatico') && q.arte) l = l.concat(Object.keys(q.arte).filter(function (k) { return q.modoPen === 'duelo' || !/^(fb|gb)_/.test(k) }).map(function (k) { return q.arte[k] }));
    if (q.modelo === 'mon') { if (q.fundoImg) l.push(q.fundoImg); if (q.golpeImg) l.push(q.golpeImg.caminho); if (q.golpeIni) l.push(q.golpeIni.caminho) }
    if (q.modelo === 'fps' && q.tema) { l.push(q.tema.inimigo.caminho, q.tema.arma.caminho, q.tema.municao); if (q.tema.arma.impacto) l.push(q.tema.arma.impacto.caminho); (q.tema.salas || []).forEach(function (s) { [s.chao, s.parede, s.fundoT, s.teto, s.copa, s.ceuImg].forEach(function (c) { if (c) l.push(c) }); s.objs.forEach(function (o) { l.push(o.i) }); s.liga.forEach(function (k) { l.push(k.porta) }) }) }
    return l;
  };
  EA.Quiz.credito = function (q) {
    var c = [(q.heroi && q.heroi.lut && q.heroi.lut.credito), (q.inimigo && q.inimigo.lut && q.inimigo.lut.credito)].filter(Boolean);
    return c.length ? c[0] : '';
  };

  /* ---------- modelo padrão ---------- */
  function montaPadrao(raiz, q, ctx) {
    raiz.className = 'quiz quiz-padrao';
    raiz.innerHTML = '<div class="qp-topo"><span class="ui-pilula qp-rot"></span><div class="qp-pontos"></div></div><h2 class="qp-p"></h2><div class="qp-ops"></div><button class="ui-botao qp-conf" data-acao="confirma" disabled>Confirmar</button><div class="qp-exp"></div>';
    var eP = raiz.querySelector('.qp-p'), eO = raiz.querySelector('.qp-ops'), eE = raiz.querySelector('.qp-exp'), eR = raiz.querySelector('.qp-rot'), eD = raiz.querySelector('.qp-pontos'), eC = raiz.querySelector('.qp-conf'), estado = null;

    /* ---------- ligar o correto: tanto faz começar pela esquerda ou pela direita, clicando ou arrastando ---------- */
    function caixa(el) {
      var r = el.getBoundingClientRect(), o = eO.getBoundingClientRect(), f = (o.width / eO.offsetWidth) || 1;
      return { x0: (r.left - o.left) / f, x1: (r.right - o.left) / f, y: (r.top - o.top + r.height / 2) / f };
    }
    function fio(x0, y0, x1, y1, cls) { var m = (x0 + x1) / 2; return '<path class="' + (cls || '') + '" d="M' + x0 + ' ' + y0 + ' C' + m + ' ' + y0 + ' ' + m + ' ' + y1 + ' ' + x1 + ' ' + y1 + '"/>' }
    function itemL(k) { return eO.querySelector('.ql-i[data-e="' + k + '"]') }
    function itemD(k) { return eO.querySelector('.ql-i[data-d="' + k + '"]') }
    function desenhaFios(solto) {
      var sv = eO.querySelector('.ql-fios'); if (!sv) return;
      var h = Object.keys(estado.lig).map(function (e) { var a = caixa(itemL(e)), b = caixa(itemD(estado.lig[e])); return fio(a.x1, a.y, b.x0, b.y, estado.fim && estado.fim[e] || '') }).join('');
      if (estado.extra) h += estado.extra;
      if (solto) h += fio(solto.x0, solto.y0, solto.x1, solto.y1, 'solto');
      sv.innerHTML = h;
      [].forEach.call(eO.querySelectorAll('.ql-i'), function (i) {
        var lig = i.dataset.e != null ? estado.lig[i.dataset.e] != null : Object.keys(estado.lig).some(function (e) { return estado.lig[e] == i.dataset.d });
        i.classList.toggle('ligado', lig);
        i.classList.toggle('pend', !!(estado.pend && estado.pend.el === i));
      });
      if (!estado.fim) eC.disabled = Object.keys(estado.lig).length < eO.querySelectorAll('[data-e]').length;
    }
    function liga(a, b) {
      var e = a.dataset.e != null ? a : b, d = a.dataset.d != null ? a : b;
      Object.keys(estado.lig).forEach(function (x) { if (estado.lig[x] == d.dataset.d) delete estado.lig[x] });
      estado.lig[e.dataset.e] = +d.dataset.d;
      estado.pend = null; EA.Som.tocar('clique'); desenhaFios();
      var novo = eO.querySelectorAll('.ql-fios path'), ult = novo[novo.length - 1];
      if (ult && ult.animate && !ctx.estatico) { var L = ult.getTotalLength(); ult.animate([{ strokeDasharray: L, strokeDashoffset: L }, { strokeDasharray: L, strokeDashoffset: 0 }], { duration: 240, easing: 'ease-out' }) }
    }
    function montaLigar(p) {
      var n = p.pares.length, ordem = p.pares.map(function (_, k) { return k });
      if (!ctx.estatico) { do { ordem.sort(function () { return Math.random() - .5 }) } while (n > 1 && ordem.every(function (v, k) { return v === k })) } else ordem.push(ordem.shift());
      eO.className = 'qp-liga n' + n;
      /* 09/11: os textos do quiz são texto puro; escapados, "a < b" ou "<div>" aparecem como foram escritos */
      eO.innerHTML = '<div class="ql-col">' + p.pares.map(function (x, k) { return '<button class="ql-i" data-e="' + k + '"><span>' + esc(x.a) + '</span><i></i></button>' }).join('') + '</div><div class="ql-col">' + ordem.map(function (k) { return '<button class="ql-i" data-d="' + k + '"><i></i><span>' + esc(p.pares[k].b) + '</span></button>' }).join('') + '</div><svg class="ql-fios"></svg>';
      eC.className = 'ui-botao qp-conf ver'; eC.disabled = true;
      if (ctx.estatico) return;
      var arr = null;
      eO.onpointerdown = function (ev) {
        if (estado.fim) return;
        var i = ev.target.closest('.ql-i'); if (!i) { estado.pend = null; desenhaFios(); return }
        ev.preventDefault();
        var pendAqui = estado.pend && estado.pend.el;
        if (pendAqui && pendAqui !== i && ((pendAqui.dataset.e != null) !== (i.dataset.e != null))) { liga(pendAqui, i); return }
        /* clicar de novo num item ligado desfaz a ligação */
        if (i.dataset.e != null && estado.lig[i.dataset.e] != null) delete estado.lig[i.dataset.e];
        else if (i.dataset.d != null) Object.keys(estado.lig).forEach(function (x) { if (estado.lig[x] == i.dataset.d) delete estado.lig[x] });
        estado.pend = { el: i }; arr = i; desenhaFios();
      };
      eO.onpointermove = function (ev) {
        if (!arr) return;
        var a = caixa(arr), o = eO.getBoundingClientRect(), f = (o.width / eO.offsetWidth) || 1;
        desenhaFios({ x0: arr.dataset.e != null ? a.x1 : a.x0, y0: a.y, x1: (ev.clientX - o.left) / f, y1: (ev.clientY - o.top) / f });
      };
      eO.onpointerup = function (ev) {
        if (!arr) return;
        var s = document.elementFromPoint(ev.clientX, ev.clientY), alvo = s && s.closest && s.closest('.ql-i'), de = arr; arr = null;
        if (alvo && alvo !== de && ((alvo.dataset.e != null) !== (de.dataset.e != null))) liga(de, alvo); else desenhaFios();
      };
    }
    function respondeLigar(p) {
      estado.fim = {}; estado.extra = '';
      Object.keys(estado.lig).forEach(function (e) { estado.fim[e] = estado.lig[e] == e ? 'bom' : 'ruim' });
      p.pares.forEach(function (_, k) { if (estado.lig[k] != k) { var a = caixa(itemL(k)), b = caixa(itemD(k)); estado.extra += fio(a.x1, a.y, b.x0, b.y, 'mostra') } });
      desenhaFios();
      [].forEach.call(eO.querySelectorAll('[data-e]'), function (i) { i.classList.add(estado.fim[i.dataset.e]) });
      [].forEach.call(eO.querySelectorAll('[data-d]'), function (i) { var quem = Object.keys(estado.lig).find(function (x) { return estado.lig[x] == i.dataset.d }); i.classList.add(quem != null ? estado.fim[quem] : 'ruim') });
      return eO;
    }
    /* resumo final (07/11): cada pergunta com certo ou errado; nas erradas, a resposta certa */
    function certaTexto(p) {
      var t = EA.Quiz.tipo(p);
      if (t === 'completar') return EA.Quiz.respostas(p)[0] || '';
      if (t === 'ligar') return p.pares.map(function (x) { return x.a + ' → ' + x.b }).join(' · ');
      if (t === 'varias') return EA.Quiz.certas(p).map(function (k) { return p.ops[k] }).join(' · ');
      return p.ops[p.certa] || '';
    }
    function resumo(info) {
      return '<ol class="qp-resumo">' + info.perguntas.map(function (p, k) {
        var ok = info.marcas[k], perg = String(p.p || '').replace(/_{2,}/, '___');   /* 09/11: texto puro, não se tira mais o que parece marcação */
        return '<li class="' + (ok ? 'ok' : 'nao') + '"><i>' + (ok ? '✓' : '✗') + '</i><div><span>' + EA.esc(perg) + '</span>' + (ok ? '' : '<small>Certa: ' + EA.esc(certaTexto(p)) + '</small>') + '</div></li>';
      }).join('') + '</ol>';
    }
    return {
      mostra: function (i, p) {
        var tipo = EA.Quiz.tipo(p);
        estado = { tipo: tipo, marcados: {}, lig: {}, pend: null };
        eR.textContent = 'Pergunta ' + (i + 1) + ' de ' + q.perguntas.length + (tipo === 'varias' ? ' · marque todas as certas' : tipo === 'ligar' ? ' · ligue os pares' : tipo === 'completar' ? ' · complete a frase' : '');
        eD.innerHTML = q.perguntas.map(function (_, k) { return '<i class="' + (k === i ? 'agora' : '') + '"></i>' }).join('');
        /* 09/11: os textos do quiz são texto puro; escapados, "a < b" ou "<div>" aparecem como foram escritos */
        eP.innerHTML = tipo === 'completar' ? esc(p.p || 'Escreva a frase com ___ no lugar da palavra').replace(/_{2,}/, '<span class="qp-lacuna"></span>') : esc(p.p || 'Escreva a pergunta');
        eE.className = 'qp-exp'; eE.innerHTML = '';
        eC.className = 'ui-botao qp-conf'; eC.disabled = true;
        if (tipo === 'ligar') montaLigar(p);
        else if (tipo === 'completar') {
          eO.onpointerdown = eO.onpointermove = eO.onpointerup = null;
          eO.className = 'qp-compl'; eO.innerHTML = '<input class="qp-digita" type="text" placeholder="Escreva aqui a palavra que falta" autocomplete="off" spellcheck="false">';
          eC.className = 'ui-botao qp-conf ver';
          var inp = eO.querySelector('input'), lac = eP.querySelector('.qp-lacuna');
          inp.oninput = function () { eC.disabled = !inp.value.trim(); if (lac) lac.textContent = inp.value };
          if (ctx.estatico) inp.disabled = true; else setTimeout(function () { if (inp.isConnected) inp.focus() }, 420);
        } else {
          eO.onpointerdown = eO.onpointermove = eO.onpointerup = null;
          eO.innerHTML = p.ops.map(function (o, k) { return '<button class="qp-op' + (tipo === 'varias' ? ' marcavel' : '') + '" data-k="' + k + '"><b>' + (tipo === 'varias' ? '' : LETRAS[k]) + '</b><span>' + EA.esc(o) + '</span></button>' }).join('');
          eO.className = 'qp-ops n' + p.ops.length;
          if (tipo === 'varias') eC.className = 'ui-botao qp-conf ver';
        }
        if (!ctx.estatico) {
          eP.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
          [].forEach.call(eO.querySelectorAll('.qp-op,.ql-i'), function (b, k) { b.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 340, delay: 90 + k * 50, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }) });
        }
      },
      /* múltipla escolha: clicar marca e desmarca */
      clica: function (k) {
        if (!estado || estado.tipo !== 'varias') return false;
        /* 09/11: tecla de uma opção que não existe (ex.: 4 com 3 opções) não marca nada */
        var b = eO.children[k]; if (!b) return true;
        estado.marcados[k] = !estado.marcados[k];
        b.classList.toggle('marcada', estado.marcados[k]); b.querySelector('b').innerHTML = estado.marcados[k] ? EA.ICO.ok : '';
        eC.disabled = !Object.keys(estado.marcados).some(function (x) { return estado.marcados[x] });
        return true;
      },
      resposta: function () {
        if (!estado || eC.disabled) return null;
        if (estado.tipo === 'varias') return Object.keys(estado.marcados).filter(function (x) { return estado.marcados[x] }).map(Number);
        if (estado.tipo === 'ligar') return estado.lig;
        if (estado.tipo === 'completar') { var v = eO.querySelector('input').value.trim(); return v || null }
        return null;
      },
      responde: function (i, p, r) {
        var tipo = EA.Quiz.tipo(p), certo = EA.Quiz.confere(p, r), alvo = null, bs = eO.children;
        eC.className = 'ui-botao qp-conf';
        if (tipo === 'ligar') alvo = respondeLigar(p);
        else if (tipo === 'completar') {
          var ip = eO.querySelector('input'), lc = eP.querySelector('.qp-lacuna'), rs = EA.Quiz.respostas(p);
          ip.disabled = true; ip.classList.add(certo ? 'certa' : 'errada');
          if (lc) { lc.textContent = certo ? ip.value : (rs[0] || ''); lc.classList.add(certo ? 'certa' : 'errada') }
          if (!certo) { ip.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 400 }); eO.insertAdjacentHTML('beforeend', '<div class="qp-era">Resposta: <b>' + EA.esc(rs[0] || '') + '</b></div>') }
          alvo = eO;
        } else if (tipo === 'varias') {
          var certas = EA.Quiz.certas(p);
          [].forEach.call(bs, function (x, k) {
            x.disabled = true;
            var deve = certas.indexOf(k) >= 0, marcou = r.indexOf(k) >= 0;
            if (deve && marcou) { x.classList.add('certa'); x.querySelector('b').innerHTML = EA.ICO.ok }
            else if (deve) { x.classList.add('certa', 'faltou'); x.querySelector('b').innerHTML = EA.ICO.ok }
            else if (marcou) { x.classList.add('errada'); x.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 400 }) }
            else x.classList.add('apagado');
          });
          alvo = eO.querySelector('.certa') || eO;
        } else {
          var b = bs[r], bc = bs[p.certa];
          [].forEach.call(bs, function (x) { x.disabled = true; x.classList.add('apagado') });
          bc.classList.remove('apagado'); bc.classList.add('certa'); bc.querySelector('b').innerHTML = EA.ICO.ok;
          if (!certo && b) { b.classList.remove('apagado'); b.classList.add('errada'); b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(0)' }], { duration: 400 }) }
          alvo = bc;
        }
        if (certo) {
          EA.Som.tocar('certo');
          if (alvo !== eO) alvo.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)', offset: .4 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
          var rr = alvo.getBoundingClientRect(), rp = raiz.getBoundingClientRect(), f = rp.width / EA.W;

          festa(raiz, (rr.left - rp.left + rr.width / 2) / f, (rr.top - rp.top + rr.height / 2) / f, 110);
        } else EA.Som.tocar('errado');
        var d = raiz.querySelectorAll('.qp-pontos i')[i]; if (d) d.className = certo ? 'ok' : 'nao';
        eE.innerHTML = '<b>' + (certo ? 'Isso!' : r === 'tempo' ? 'O tempo acabou.' : 'Não foi dessa vez.') + '</b> ' + EA.esc(p.exp || '') + '<span class="qp-seg">Continuar →</span>';
        eE.className = 'qp-exp ver ' + (certo ? 'bom' : 'ruim');
        return espera(200);
      },
      fim: function (acertos, total, resultado, info) {
        var nota = acertos / total, est = nota === 1 ? 3 : nota >= .6 ? 2 : nota > 0 ? 1 : 0;
        info = info || { marcas: [], perguntas: [] };
        var erradas = info.perguntas.filter(function (_, k) { return !info.marcas[k] });
        var h = '<div class="qp-fim"><div class="qp-estrelas">';
        for (var i = 0; i < 3; i++) h += '<svg viewBox="0 0 24 24" class="' + (i < est ? 'on' : '') + '"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8-6-3.4-6 3.4 1.3-6.8-5-4.7 6.8-.8z"/></svg>';
        h += '</div><h2>' + acertos + ' de ' + total + ' certas</h2><p>' + (nota === 1 ? 'Gabaritou!' : nota >= .6 ? 'Mandou bem.' : 'Vale rever este tema.') + '</p>' + (q.resumo ? resumo(info) : '') + '<div class="qp-fim-b"><button data-acao="recomeca" class="ui-botao claro">Jogar de novo</button>' + (q.refazErradas && erradas.length ? '<button data-acao="erradas" class="ui-botao claro">Refazer as erradas (' + erradas.length + ')</button>' : '') + '<button data-acao="segue" class="ui-botao">Continuar →</button></div></div>';
        raiz.innerHTML = h;
        if (q.resumo) raiz.querySelector('.qp-fim').classList.add('com-resumo');
        [].forEach.call(raiz.querySelectorAll('.qp-estrelas svg.on'), function (s, k) { s.animate([{ transform: 'scale(0) rotate(-60deg)' }, { transform: 'scale(1.25)', offset: .7 }, { transform: 'scale(1)' }], { duration: 420, delay: 200 + k * 220, fill: 'backwards', easing: 'ease-out' }); setTimeout(function () { EA.Som.tocar('moeda') }, 200 + k * 220) });
        if (nota >= .6) { EA.Som.tocar('nivel'); festa(raiz, EA.W / 2, 200, 170) } else EA.Som.tocar('derrota');
      }
    };
  }

  /* ---------- cenário em pixel, desenhado por código ---------- */
  var PALETAS = {
    floresta: { ceu: ['#7ec8e3', '#a9dcec', '#d4eef2', '#eef7e0'], longe: '#7fb59a', meio: '#3f8a6b', perto: '#1f5a48', chao: ['#5a9e4b', '#3f7d3a', '#2d5d2c'], forma: 'arvore' },
    caverna: { ceu: ['#17131f', '#231c2e', '#2f2740', '#3a3150'], longe: '#2e2640', meio: '#221b30', perto: '#150f20', chao: ['#5b5068', '#433a52', '#2e2740'], forma: 'estalactite' },
    neve: { ceu: ['#9fc4e8', '#bcd7f0', '#d8e8f6', '#eef6fc'], longe: '#c2d6ea', meio: '#9db8d4', perto: '#6f8fb0', chao: ['#f4f9ff', '#d5e4f3', '#a9c1da'], forma: 'pico' },
    lava: { ceu: ['#1c0a10', '#3b1016', '#6a1a18', '#b43a18'], longe: '#4a1414', meio: '#2c0d10', perto: '#180709', chao: ['#3a2a2a', '#2a1c1e', '#ff7a1a'], forma: 'pico' },
    noite: { ceu: ['#0b1424', '#111f38', '#1a2c4e', '#27406b'], longe: '#1a2b4a', meio: '#132039', perto: '#0b1526', chao: ['#2e4a4a', '#1f3636', '#142626'], forma: 'arvore', lua: true }
  };
  function pintaCenario(canvas, nome) {
    var P = PALETAS[nome] || PALETAS.floresta, W = 320, H = 180, x = canvas.getContext('2d'), i, sem = 7;
    canvas.width = W; canvas.height = H;
    function r() { sem = (sem * 16807) % 2147483647; return (sem & 0xffff) / 0xffff }
    var chao = 112, bH = chao / P.ceu.length;
    P.ceu.forEach(function (c, k) { x.fillStyle = c; x.fillRect(0, Math.floor(k * bH), W, Math.ceil(bH) + 1); if (k) { x.fillStyle = c; for (i = 0; i < W; i += 2) x.fillRect(i + (Math.floor(k * bH) % 2), Math.floor(k * bH) - 2, 1, 2) } });
    if (P.lua) { x.fillStyle = '#e8eefc'; x.beginPath(); x.arc(250, 30, 14, 0, 7); x.fill(); x.fillStyle = '#c9d4ee'; x.fillRect(244, 24, 3, 3); x.fillRect(254, 34, 4, 3); for (i = 0; i < 40; i++) { x.fillStyle = '#cfe0ff'; x.fillRect(r() * W | 0, r() * 70 | 0, 1, 1) } }
    function camada(cor, base, alto, passo, forma) {
      x.fillStyle = cor;
      for (var px = -passo; px < W + passo; px += passo * (.7 + r() * .6)) {
        var a = alto * (.55 + r() * .45), l = passo * (.8 + r() * .6), y;
        if (forma === 'arvore') {
          x.fillRect(px + l / 2 - 1, base - a * .4, 3, a * .4 + 2);
          for (y = 0; y < a; y += 3) { var w = l * (1 - y / a) * .95; x.fillRect(px + l / 2 - w / 2, base - a * .25 - y, w, 3) }
        } else if (forma === 'estalactite') {
          for (y = 0; y < a; y += 3) { var w2 = l * (1 - y / a); x.fillRect(px + l / 2 - w2 / 2, y, w2, 3); x.fillRect(px + l / 2 - w2 / 2, base - y, w2, 3) }
        } else {
          for (y = 0; y < a; y += 3) { var w3 = l * 1.6 * (1 - y / a); x.fillRect(px + l / 2 - w3 / 2, base - y, w3, 3) }
        }
      }
      x.fillRect(0, base, W, chao - base + 2);
    }
    camada(P.longe, chao - 6, 60, 26, P.forma);
    camada(P.meio, chao - 2, 44, 20, P.forma);
    camada(P.perto, chao, 26, 16, P.forma);
    x.fillStyle = P.chao[0]; x.fillRect(0, chao, W, H - chao);
    x.fillStyle = P.chao[1]; for (i = 0; i < 160; i++) x.fillRect(r() * W | 0, chao + 2 + r() * (H - chao) | 0, 2 + r() * 5 | 0, 1);
    x.fillStyle = P.chao[2]; x.fillRect(0, chao, W, 1); for (i = 0; i < 70; i++) x.fillRect(r() * W | 0, chao + 3 + r() * (H - chao) | 0, 1 + r() * 3 | 0, 1);
    if (P.chao[2] === '#ff7a1a') { x.fillStyle = '#ffd34d'; for (i = 0; i < 24; i++) x.fillRect(r() * W | 0, chao + 4 + r() * 12 | 0, 3 + r() * 8 | 0, 1) }
  }

  /* ---------- batalha RPG ---------- */
  function montaRpg(raiz, q, ctx) {
    var CHAO = 438;
    raiz.className = 'quiz quiz-rpg';
    var he = (q.heroi && q.heroi.lut) || null, ini = (q.inimigo && q.inimigo.lut) || null;
    var nomeHe = (q.heroi && q.heroi.nome) || 'Herói', nomeIni = (q.inimigo && q.inimigo.nome) || (ini && ini.nome) || 'Inimigo';
    raiz.innerHTML = (q.cenImg ? EA.Quiz.fundoCamadas(q.cenImg, q.cenFixo || ctx.estatico) : '<canvas class="rpg-ceu"></canvas>') + '<div class="rpg-cena"><canvas class="rpg-he"></canvas><canvas class="rpg-ini"></canvas></div>' +
      '<div class="rpg-st esq"><div class="rpg-st-n">' + esc(nomeHe) + '</div><div class="rpg-vida"><i class="r"></i><i class="v"></i></div><div class="rpg-st-c"></div></div>' +
      '<div class="rpg-st dir"><div class="rpg-st-n">' + esc(nomeIni) + '</div><div class="rpg-vida"><i class="r"></i><i class="v"></i></div></div>' +
      '<div class="rpg-rodada"></div><div class="rpg-jan"><div class="rpg-p"></div><div class="rpg-ops"></div><div class="rpg-exp"></div></div><div class="rpg-flash"></div>';
    if (!q.cenImg) pintaCenario(raiz.querySelector('.rpg-ceu'), q.cenario || 'floresta'); else EA.Quiz.ligaCamadas(raiz);
    var cHe = raiz.querySelector('.rpg-he'), cIni = raiz.querySelector('.rpg-ini'), cena = raiz.querySelector('.rpg-cena'), flash = raiz.querySelector('.rpg-flash');
    /* escala em número inteiro, para o pixel continuar nítido: herói com uns 190 px de altura, monstro até 260 */
    function escala(lut, alvo) { return lut ? (lut.esc || Math.max(1, Math.round(alvo / lut.h))) : 2 }
    var escHe = escala(he, 190), escIni = escala(ini, ini && ini.tipo === 'chefe' ? 280 : ini && ini.h <= 16 ? 130 : 200);
    function lugar(c, lut, esc2, cx, lado) {
      var w = lut.w * esc2, h = lut.h * esc2;
      c.style.cssText += ';width:' + w + 'px;height:' + h + 'px;left:' + (cx - w / 2 - (lut.ox || 0) * esc2 * lado) + 'px;top:' + (CHAO - h + (lut.pe == null ? 8 : lut.pe) * esc2) + 'px';
    }
    var sHe = null, sIni = null;
    /* tempos: deslocamento de 1,25 s (chefe 2 s) e cerca de 10 quadros por segundo */
    var DESLOCA = 1250, CURVA = 'cubic-bezier(.4,0,.45,1)', RITMO = 1;
    function durAnim(lut, nome) { var a = lut.anims[nome]; return a ? a.n / a.fps / RITMO * 1000 : 400 }
    /* parado: fica uns 7 s numa respiração e só troca quando ela termina a volta, sem cortar o movimento */
    var TROCA_PARADO = 7000;
    function parado(sp, lut) {
      var l = lut.idles;
      if (!l || l.length < 2) { sp.anim('idle', null, true); return }
      var agora = performance.now();
      if (!sp.respira || agora - sp.respiraDesde >= TROCA_PARADO) {
        var outras = l.filter(function (n) { return n !== sp.respira });
        sp.respira = outras[Math.floor(Math.random() * outras.length)];
        sp.respiraDesde = agora;
      }
      sp.anim(sp.respira, function () { parado(sp, lut) }, false);
    }
    if (he) { lugar(cHe, he, escHe, 300, 1); sHe = EA.spriteLutador(cHe, he, 'idle'); sHe.cfg.loop = true; sHe.vel = RITMO; if (!ctx.estatico) parado(sHe, he) }
    if (ini) { lugar(cIni, ini, escIni, 960, -1); cIni.style.transform = 'scaleX(-1)'; sIni = EA.spriteLutador(cIni, ini, 'idle'); sIni.cfg.loop = true; sIni.vel = RITMO; if (!ctx.estatico) parado(sIni, ini) }
    if (ctx.estatico) { if (sHe) sHe.fixa(0); if (sIni) sIni.fixa(0) }
    /* todas as perguntas são feitas: a barra de cada um tem uma parte por pergunta, e cada golpe tira uma parte */
    var total = q.perguntas.length, vidaHe = total, vidaIni = total, serie = 0, vencedor = null;
    if (!ctx.estatico && EA.Musica && q.musica) EA.Musica.tocar(q.musica, ctx.projeto);
    var bHe = raiz.querySelector('.rpg-st.esq .rpg-vida'), bIni = raiz.querySelector('.rpg-st.dir .rpg-vida'), eC = raiz.querySelector('.rpg-st-c');
    var eP = raiz.querySelector('.rpg-p'), eO = raiz.querySelector('.rpg-ops'), eE = raiz.querySelector('.rpg-exp'), eR = raiz.querySelector('.rpg-rodada'), jan = raiz.querySelector('.rpg-jan');
    function barra(b, f) { b.querySelector('.v').style.width = f * 100 + '%'; setTimeout(function () { b.querySelector('.r').style.width = f * 100 + '%' }, 350); b.classList.toggle('baixa', f <= .34) }
    function atkNome(lut) { var nomes = Object.keys(lut.anims); for (var i = 0; i < nomes.length; i++) if (!/^(idle\d*|walk|run|hurt|death|jump|fall|land|dodge|flight|pulo|pulinho|costas|agacha|re)$/.test(nomes[i])) return nomes[i]; return 'idle' }
    function numero(txt, cx, cy, cls) {
      var n = EA.el('div', 'rpg-num ' + (cls || ''), txt); n.style.left = cx + 'px'; n.style.top = cy + 'px'; raiz.appendChild(n);
      n.animate([{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-34px) scale(1.25)', opacity: 1, offset: .2 }, { transform: 'translate(-50%,-52px) scale(1)', opacity: 1, offset: .7 }, { transform: 'translate(-50%,-84px) scale(1)', opacity: 0 }], { duration: 950, easing: 'ease-out' }).onfinish = function () { n.remove() };
    }
    function tremeTela(forte) { var a = forte ? 12 : 6; cena.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + -a + 'px,' + a / 2 + 'px)' }, { transform: 'translate(' + a + 'px,' + -a / 2 + 'px)' }, { transform: 'translate(' + -a / 2 + 'px,0)' }, { transform: 'translate(0,0)' }], { duration: 260 }) }
    function pisca(cor) { flash.style.background = cor; flash.animate([{ opacity: .55 }, { opacity: 0 }], { duration: 240 }) }
    function acerta(sp, c, esc2, crit) { c.animate([{ filter: 'brightness(3) saturate(0)' }, { filter: 'none' }], { duration: 180, easing: 'steps(3)' }); sp.parado = true; setTimeout(function () { sp.parado = false }, crit ? 110 : 60) }

    /* ---------- deslocamentos: lado 1 = herói (anda para a direita), -1 = inimigo ---------- */
    function pose(lado, x, y, deCostas) { return 'translate(' + lado * x + 'px,' + (y || 0) + 'px) scaleX(' + (deCostas ? -lado : lado) + ')' }
    function distancia() {
      var a = (he.corpo || he.w * .5) * escHe / 2, b = (ini.corpo || ini.w * .5) * escIni / 2;
      return Math.max(120, 660 - a - b - 6);
    }
    function avanca(c, sp, lut, lado, dx) {
      EA.Som.tocar('passo'); sp.anim('run', null, true);
      return c.animate([{ transform: pose(lado, 0) }, { transform: pose(lado, dx) }], { duration: lut.desloca || DESLOCA, easing: CURVA, fill: 'forwards' });
    }
    /* volta para o lugar do jeito de cada um: correndo, de pulo (como no Chrono Trigger), de ré ou em pulinhos */
    function retorna(c, sp, lut, lado, dx, ida, fim) {
      /* o herói guardado nos slides antigos ainda diz "pulo": agora ele volta com a mesma corrida da ida */
      var tipo = lut.id === 'heroi_mono' ? 'corre' : lut.volta || 'corre', dur = lut.desloca || DESLOCA, esc3 = lut === he ? escHe : escIni, q = [], k, t, va;
      function chega() { va.cancel(); ida.cancel(); parado(sp, lut); setTimeout(fim, 180) }
      if (tipo === 'pulo') {
        /* impulso virado para onde vai pular, salto baixo, e ao cair agacha já olhando de novo para o inimigo */
        var ox = (lut.ox || 0) * esc3 * 2, de = function (x, y) { return { transform: 'translate(' + lado * (x + ox) + 'px,' + (y || 0) + 'px) scaleX(' + -lado + ')' } };
        var IMP = 200, AR = 720, POUSO = 180;
        if (lut.anims.agacha) sp.anim('agacha', null, true);
        var impulso = c.animate([de(dx), de(dx)], { duration: IMP, fill: 'forwards' });
        impulso.onfinish = function () {
          for (k = 0; k <= 16; k++) { t = k / 16; q.push(de(dx * (1 - t), -70 * 4 * t * (1 - t))) }
          sp.anim(lut.anims.pulo ? 'pulo' : 'run', null, false);
          if (lut.anims.pulo) sp.cfg.dt = AR / 1000 / lut.anims.pulo.n;
          EA.Som.tocar('surgir');
          var ar = c.animate(q, { duration: AR, easing: 'linear', fill: 'forwards' });
          ar.onfinish = function () {
            if (lut.anims.agacha) sp.anim('agacha', null, true);
            va = c.animate([{ transform: pose(lado, 0) }, { transform: pose(lado, 0) }], { duration: POUSO, fill: 'forwards' });
            va.onfinish = function () { ar.cancel(); impulso.cancel(); chega() };
          };
        };
        return;
      }
      if (tipo === 'pulinhos') {
        /* os quadros já sobem e descem: aqui ele só anda enquanto está no ar */
        var saltos = 3, um = lut.anims.pulinho ? lut.anims.pulinho.n / lut.anims.pulinho.fps * 1000 : 450;
        for (k = 0; k <= 36; k++) {
          t = k / 36; var s3 = Math.min(saltos - 1e-6, t * saltos), i3 = Math.floor(s3), f = s3 - i3;
          q.push({ transform: pose(lado, dx * (1 - (i3 + f * f * (3 - 2 * f)) / saltos), lut.anims.pulinho ? 0 : -70 * 4 * f * (1 - f), true) });
        }
        sp.anim(lut.anims.pulinho ? 'pulinho' : 'run', null, true);
        va = c.animate(q, { duration: um * saltos, easing: 'linear', fill: 'forwards' });
      } else {
        var costas = tipo !== 're', ox2 = costas ? (lut.ox || 0) * esc3 * 2 : 0;
        sp.anim(tipo === 're' && lut.anims.re ? 're' : 'run', null, true);
        va = c.animate([{ transform: pose(lado, dx + ox2, 0, costas) }, { transform: pose(lado, ox2, 0, costas) }], { duration: tipo === 're' ? dur * 1.15 : dur, easing: CURVA, fill: 'forwards' });
      }
      va.onfinish = chega;
    }
    /* opc.final: este golpe mata na hora em que acerta; a tela só segue depois de morrer e de quem bateu voltar */
    function ataqueHeroi(crit, opc) {
      opc = opc || {};
      var morte = null, g = EA.GOLPES[q.golpe] || EA.GOLPES.corte, cx = 960, cy = CHAO - Math.min(ini.h * escIni, 280) * .5;
      var nomes = ['attack1', 'attack2', 'attack3'];
      /* cada acerto usa um golpe; no crítico vem o combo com os três */
      var seq = crit ? nomes.slice() : [nomes[(Math.max(serie, 1) - 1) % 3]];
      function bate(ultimo) {
        EA.Som.tocar(crit && ultimo ? 'critico' : g.som);
        fxSolto(cena, crit && g.corpo ? 'impacts/crit-hit' : g.fx, cx, cy, crit && ultimo ? g.alt * 1.3 : g.alt);
        if (opc.final && ultimo) {
          tremeTela(true); numero(opc.texto || (crit ? 'CRÍTICO!' : 'Acertou!'), cx, cy - 90, crit || opc.texto ? 'crit' : '');
          vidaIni = 0; barra(bIni, 0); if (EA.Musica && q.musica) EA.Musica.parar(1.2); morte = morre(sIni, cIni, escIni, 960);
          return;
        }
        acerta(sIni, cIni, escIni, crit); tremeTela(crit && ultimo);
        sIni.anim('hurt', function () { parado(sIni, ini) });
        if (ultimo) {
          numero(crit ? 'CRÍTICO!' : 'Acertou!', cx, cy - 90, crit ? 'crit' : '');
          vidaIni = Math.max(0, vidaIni - 1); barra(bIni, vidaIni / total);
        }
      }
      function golpes(k, fim) {
        var atk = seq[k], ult = k === seq.length - 1, dA = durAnim(he, atk), feito = false;
        sHe.anim(atk, function () { if (feito) return; feito = true; if (ult) fim(); else golpes(k + 1, fim) }, false);
        setTimeout(function () { bate(ult) }, dA * .5);
      }
      var dxH = distancia();
      return new Promise(function (ok) {
        if (g.corpo) {
          var ida = avanca(cHe, sHe, he, 1, dxH);
          ida.onfinish = function () { golpes(0, function () { retorna(cHe, sHe, he, 1, dxH, ida, ok) }) };
        } else {
          EA.Som.tocar('magia');
          golpes(0, function () { parado(sHe, he); setTimeout(ok, 700) });
        }
      }).then(function () { return morte });
    }
    function ataqueInimigo(opc) {
      opc = opc || {};
      var morte = null, atk = atkNome(ini), dx = distancia(), cx = 300, cy = CHAO - 110;
      function bate() {
        EA.Som.tocar('dano'); fxSolto(cena, 'impacts/blunt-hit', cx, cy, 220); pisca('#ff3b4e');
        if (opc.final) {
          tremeTela(true); numero(opc.texto || 'Errou!', cx, cy - 110, 'ruim');
          vidaHe = 0; barra(bHe, 0); if (EA.Musica && q.musica) EA.Musica.parar(1.2); morte = morre(sHe, cHe, escHe, 300);
          return;
        }
        acerta(sHe, cHe, escHe); tremeTela(true);
        sHe.anim('hurt', function () { parado(sHe, he) }, false);
        numero('Errou!', cx, cy - 110, 'ruim');
        vidaHe = Math.max(0, vidaHe - 1); barra(bHe, vidaHe / total);
      }
      return new Promise(function (ok) {
        var ida = avanca(cIni, sIni, ini, -1, dx);
        ida.onfinish = function () {
          var fim = false, dA = durAnim(ini, atk);
          sIni.anim(atk, function () { if (fim) return; fim = true; retorna(cIni, sIni, ini, -1, dx, ida, ok) }, false);
          setTimeout(bate, dA * .5);
        };
      }).then(function () { return morte });
    }
    function desintegra(c, sp, virado) { return EA.Quiz.desintegra(c, sp, cena, virado) }
    function morre(sp, c, esc2, cx) {
      var lut = sp === sHe ? he : ini;
      if (lut.morte === 'particulas' || !lut.anims.death) return desintegra(c, sp, lut === ini);
      EA.Som.tocar('explosao');
      return new Promise(function (ok) {
        sp.anim('death', function () { fxSolto(cena, 'spawn/poof', cx, CHAO - 70, 240); c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, fill: 'forwards' }); setTimeout(ok, 800) }, false);
      });
    }
    return {
      mostra: function (i, p) {
        eR.textContent = 'Rodada ' + (i + 1) + '/' + total;
        /* 09/11: os textos do quiz são texto puro; escapados, "a < b" ou "<div>" aparecem como foram escritos */
        eP.innerHTML = EA.esc(p.p || 'Escreva a pergunta');
        eO.innerHTML = p.ops.map(function (o, k) { return '<button class="rpg-op" data-k="' + k + '"><b>' + LETRAS[k] + '</b><span>' + EA.esc(o) + '</span></button>' }).join('');
        eO.className = 'rpg-ops n' + p.ops.length;
        eE.className = 'rpg-exp'; eE.innerHTML = '';
        jan.classList.remove('resp');
        if (!ctx.estatico) jan.animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: 'steps(6)' });
      },
      responde: function (i, p, k) {
        var certo = k === p.certa, bs = eO.children;
        [].forEach.call(bs, function (x) { x.disabled = true; x.classList.add('apagado') });
        bs[p.certa].classList.remove('apagado'); bs[p.certa].classList.add('certa');
        if (!certo) { bs[k].classList.remove('apagado'); bs[k].classList.add('errada') }
        EA.Som.tocar(certo ? 'certo' : 'errado');
        /* a última pergunta decide: vence quem tem mais vida e, no empate, quem deu o último golpe */
        var quem = certo ? 'he' : 'ini', vence = null;
        if (i === total - 1) {
          var vHe = vidaHe - (certo ? 0 : 1), vIni = vidaIni - (certo ? 1 : 0);
          vence = vHe > vIni ? 'he' : vIni > vHe ? 'ini' : quem;
          vencedor = vence;
        }
        if (certo) { serie++; eC.textContent = serie > 1 ? 'Série ×' + serie : '' } else { serie = 0; eC.textContent = '' }
        function luta() {
          var f = vence === quem, d = certo ? ataqueHeroi(serie >= 3, { final: f }) : ataqueInimigo({ final: f });
          /* quem levou a pior nesta rodada não bate por último: o vencedor responde com o golpe final */
          if (vence && !f) d = d.then(function () { return vence === 'he' ? ataqueHeroi(false, { final: true, texto: 'Golpe final!' }) : ataqueInimigo({ final: true, texto: 'Golpe final!' }) });
          return d;
        }
        /* a janela mostra a resposta por um instante e sai; só volta com todos de novo nos seus lugares */
        return new Promise(function (ok) { setTimeout(ok, 300) }).then(function () {
          var sai = jan.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(30px)', opacity: 0 }], { duration: 220, easing: 'steps(4)', fill: 'forwards' });
          return luta().then(function () { sai.cancel(); jan.animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: 'steps(6)' }) });
        }).then(function () {
          eE.innerHTML = '<b>' + (certo ? 'Certo!' : 'Resposta certa: ' + LETRAS[p.certa] + '.') + '</b> ' + EA.esc(p.exp || '') + '<span class="rpg-seg">Continuar ▸</span>';
          eE.className = 'rpg-exp ver';
          jan.classList.add('resp');
        });
      },
      fim: function (acertos, tot, resultado) {
        var ganhou = vencedor ? vencedor === 'he' : resultado !== 'perdeu';
        jan.style.display = 'none';
        mostraFim();
        function mostraFim() {
        var f = EA.el('div', 'rpg-fim ' + (ganhou ? 'ganhou' : 'perdeu'), '<h2>' + (ganhou ? 'Vitória!' : 'Derrota…') + '</h2><p>' + acertos + ' de ' + tot + ' certas</p><div><button data-acao="recomeca" class="rpg-b">Lutar de novo</button><button data-acao="segue" class="rpg-b prim">Continuar ▸</button></div>' + (EA.Quiz.credito(q) ? '<small class="rpg-cred">' + esc(EA.Quiz.credito(q)) + '</small>' : ''));
        raiz.appendChild(f);
        f.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.06)', opacity: 1, offset: .7 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], { duration: 420, easing: 'steps(8)', fill: 'both' });
        if (ganhou) { EA.Som.tocar('vitoria'); festa(raiz, EA.W / 2, 280, 170); if (sHe) sHe.anim(he.anims.cheer ? 'cheer' : 'attack3', function () { parado(sHe, he) }) } else EA.Som.tocar('derrota');
        }
      }
    };
  }

  /* quem não tem animação de morrer se desfaz em partículas: cada pixel do último quadro sobe e apaga, de cima para baixo.
     Com entra = true é o mesmo filme de trás para a frente: os pixels vêm do ar e formam o personagem. */
  EA.Quiz.desintegra = function (c, sp, cena, virado, entra) {
    return new Promise(function (ok) {
      var d, cw = c.width, ch = c.height;
      function mostra() { c.style.visibility = ''; c.animate([{ filter: 'brightness(4) saturate(0)' }, { filter: 'none' }], { duration: 420, easing: 'steps(4)' }) }
      try { d = c.getContext('2d').getImageData(0, 0, cw, ch).data } catch (e) {
        if (entra) { mostra(); setTimeout(ok, 420); return }
        c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, fill: 'forwards' }); setTimeout(ok, 800); return
      }
      var esc2 = parseFloat(c.style.width) / cw, x0 = parseFloat(c.style.left), y0 = parseFloat(c.style.top), passo = Math.max(1, Math.round(3 / esc2)), bloco = Math.ceil(esc2 * passo), ps = [], x, y, o;
      for (y = 0; y < ch; y += passo) for (x = 0; x < cw; x += passo) {
        o = (y * cw + x) * 4;
        if (d[o + 3] > 60) ps.push({ x: x0 + (virado ? cw - 1 - x : x) * esc2, y: y0 + y * esc2, r: d[o], g: d[o + 1], b: d[o + 2], at: y / ch * 650 + Math.random() * 260, vx: (Math.random() - .35) * 70 * (virado ? -1 : 1), vy: -(40 + Math.random() * 130), v: 700 + Math.random() * 650 });
      }
      function filme(fim) {
        var tela = EA.el('canvas', 'rpg-part'); tela.width = EA.W; tela.height = EA.H; cena.appendChild(tela);
        var g = tela.getContext('2d'), t0 = performance.now(), TOTAL = 2260, VEL = entra ? 1.4 : 1;
        (function passoP(t) {
          var dt = (t - t0) * VEL, tempo = entra ? TOTAL - dt : dt, vivos = 0;
          g.clearRect(0, 0, EA.W, EA.H);
          ps.forEach(function (p) {
            var a = tempo - p.at, f = a <= 0 ? 0 : a / p.v;
            if (f >= 1) { if (entra) vivos++; return }
            vivos++;
            var mx = p.vx * f * 1.6 + Math.sin((p.y + a * .006) * 2) * 8 * f, my = p.vy * f * 1.6 - 30 * f * f;
            /* a cor vai para uma brasa clara antes de apagar */
            var q2 = Math.min(1, f * 1.8);
            g.globalAlpha = 1 - f * f;
            g.fillStyle = 'rgb(' + Math.round(p.r + (255 - p.r) * q2) + ',' + Math.round(p.g + (214 - p.g) * q2) + ',' + Math.round(p.b + (120 - p.b) * q2) + ')';
            var lado = f > .6 ? Math.max(2, bloco - 1) : bloco;
            g.fillRect(Math.round(p.x + mx), Math.round(p.y + my), lado, lado);
          });
          g.globalAlpha = 1;
          var acabou = entra ? tempo <= 0 : (!vivos || dt >= 3200);
          if (!acabou) requestAnimationFrame(passoP); else { tela.remove(); fim() }
        })(t0);
      }
      if (entra) {
        c.style.visibility = 'hidden';
        EA.Som.tocar('surgir');
        EA.Som.tocar('spawn'); filme(function () { mostra(); setTimeout(ok, 420) });
        return;
      }
      sp.parado = true;
      c.animate([{ filter: 'none' }, { filter: 'brightness(4) saturate(0)', offset: .5 }, { filter: 'brightness(2)' }], { duration: 420, easing: 'steps(4)', fill: 'forwards' });
      EA.Som.tocar('magia');
      setTimeout(function () { c.style.visibility = 'hidden'; EA.Som.tocar('explosao'); filme(ok) }, 420);
    });
  };

  /* ---------- motor comum ---------- */
  /* fundo em camadas que deslizam devagar, atrás da cena */
  EA.Quiz.ligaCamadas = function (raiz) {
    [].forEach.call(raiz.querySelectorAll('canvas.rpg-cam'), function (cv) {
      var im = EA.imagem(cv.dataset.src), pinta = function () {
        if (!im.naturalWidth) return;
        cv.width = im.naturalWidth * 2; cv.height = im.naturalHeight;
        var g = cv.getContext('2d'); g.drawImage(im, 0, 0); g.drawImage(im, im.naturalWidth, 0);
      };
      if (im.complete) pinta(); else im.addEventListener('load', pinta, { once: true });
    });
  };
  EA.Quiz.fundoCamadas = function (c, fixo) {
    var n = c.camadas.length;
    return '<div class="rpg-fundo" style="top:-' + Math.max(266, c.desl || 0) + 'px">' + c.camadas.map(function (u, k) { 
      if (k && !fixo && (c.fixas || []).indexOf(k) < 0) return '<canvas class="rpg-cam" data-src="' + EA.url(u) + '" style="animation-duration:' + Math.round(240 - 200 * k / Math.max(1, n - 1)) + 's"></canvas>';
      return '<div class="rpg-cam" style="background-image:url(' + EA.url(u) + ');animation:none"></div>';
    }).join('') + '</div>';
  };
  /* slide guarda uma cópia do cenário: no editor ela acompanha o mapa atual (o HTML exportado já leva a cópia certa) */
  EA.Quiz.atualizaCenario = function (q) {
    if (q.cenId && window.JOGOS && JOGOS.cenarios[q.cenId]) q.cenImg = JOGOS.cenarios[q.cenId];
    /* monstrinhos: os fundos antigos do pacote não têm os círculos onde os monstros pisam */
    if (q.modelo === 'mon' && window.JOGOS && JOGOS.mon && JOGOS.mon.fundos.indexOf(q.fundoImg) < 0) q.fundoImg = JOGOS.mon.fundos[0];
    /* pênalti: a arte e as medidas de cada pose acompanham o catálogo */
    if (q.modelo === 'penalti' && window.JOGOS && JOGOS.ia) {
      q.arte = q.arte || {}; q.penM = {};
      Object.keys(JOGOS.ia).forEach(function (k) { var d = JOGOS.ia[k]; if (!/^(fut|fb|gol|gb|som)_/.test(k) && k !== 'bola' && k !== 'trofeu') return; q.arte[k] = d.src; if (d.pe) q.penM[k] = { w: d.w, h: d.h, caixa: d.caixa, pe: d.pe, piv: d.piv } });
    }
    /* missão tática: só a arte que o jogo usa, para o HTML exportado não levar peso à toa */
    if (q.modelo === 'tatico' && window.JOGOS && JOGOS.ia) {
      q.arte = q.arte || {};
      Object.keys(q.arte).forEach(function (k) { delete q.arte[k] });
      ['tat_cena1', 'tat_cena2', 'tat_cena3', 'tat_cena4', 'tat_cena5', 'tat_chao', 'tat_arma', 'tat_arma_braco', 'tat_mao', 'tat_tablet', 'tat_retrato', 'tat_tenso', 'tat_frustrado', 'tat_vitoria', 'tat_mirando', 'tat_correndo', 'tat_ajoelhado', 'riv_parado', 'riv_agachado', 'riv_tiro', 'riv_atingido', 'riv_caido', 'riv_parado_b', 'riv_agachado_b', 'riv_tiro_b', 'riv_atingido_b', 'riv_caido_b', 'riv_parado_c', 'riv_agachado_c', 'riv_tiro_c', 'riv_atingido_c', 'riv_caido_c'].concat(Object.keys(JOGOS.ia).filter(function (k) { return /^som_t_/.test(k) })).forEach(function (k) { if (JOGOS.ia[k]) q.arte[k] = JOGOS.ia[k].src });
    }
    /* tiro: o slide guarda uma cópia do tema; ela acompanha as folhas atuais */
    if (q.modelo === 'fps' && q.tema && window.JOGOS && JOGOS.fps) q.tema = JOGOS.fps[q.tema.id] || JOGOS.fps.soldado;
  };
  EA.Quiz.MONTA = { padrao: montaPadrao, rpg: montaRpg };
  EA.Quiz.musicaPadrao = function (q) { return q.musica != null ? q.musica : ({ fps: 'jogo_tiro', mon: 'jogo_mon_batalha' })[q.modelo] || '' };
  EA.Quiz.montar = function (raiz, q, ctx) {
    if (q.musica == null && EA.Quiz.musicaPadrao(q)) q.musica = EA.Quiz.musicaPadrao(q);
    ctx = ctx || {};
    var todas = q.perguntas && q.perguntas.length ? q.perguntas : [{ p: 'Escreva a pergunta', ops: ['Opção A', 'Opção B'], certa: 0, exp: '' }];
    /* nos jogos só entram perguntas de uma resposta */
    var perguntas = q.modelo === 'padrao' || !q.modelo ? todas : todas.filter(function (p) { return EA.Quiz.tipo(p) === 'uma' });
    if (!perguntas.length) perguntas = [{ p: 'Este jogo só usa perguntas de uma resposta certa.', ops: ['Entendi', 'Vou trocar'], certa: 0, exp: '' }];
    /* missão tática: entra só o número de perguntas escolhido para cada parte */
    if (q.modelo === 'tatico' && q.nTerr != null) perguntas = perguntas.slice(0, q.nTerr + (q.nBomba || 0));
    q = Object.assign({}, q, { perguntas: perguntas });
    EA.Quiz.atualizaCenario(q);
    var tela, i, acertos, travado, respondida, acabou, resultado, errou, marcas, relogio = null, base = perguntas, qBase = q;
    var serio = q.modelo === 'padrao' || !q.modelo;
    function comeca(lista) {
      paraTempo();
      perguntas = lista || base; q = Object.assign({}, qBase, { perguntas: perguntas });
      /* 09/11: ao recomeçar, o jogo anterior solta os relógios e escutas dele */
      if (tela && tela.desmonta) { try { tela.desmonta() } catch (e) { console.error(e) } }
      tela = (EA.Quiz.MONTA[q.modelo] || montaPadrao)(raiz, q, ctx);
      i = 0; acertos = 0; travado = false; respondida = false; acabou = false; resultado = null; errou = false; marcas = [];
      tela.mostra(0, perguntas[0]); comecaTempo();
    }
    /* cronômetro por pergunta (07/11, só no quiz sério): a barra esvazia; nos 3 últimos segundos faz tique; zerou, conta como errada */
    function paraTempo() { if (relogio) { clearInterval(relogio.t); if (relogio.el) relogio.el.remove(); relogio = null } }
    function comecaTempo() {
      paraTempo();
      var seg = +q.tempoPerg || 0; if (!serio || !seg || ctx.estatico) return;
      var el = EA.el('div', 'qp-tempo', '<i></i><b>' + seg + '</b>'), fim = performance.now() + seg * 1000, ult = seg;
      raiz.appendChild(el);
      relogio = { el: el, t: setInterval(function () {
        if (!raiz.isConnected) { paraTempo(); return }
        var falta = Math.max(0, (fim - performance.now()) / 1000), s = Math.ceil(falta);
        el.querySelector('i').style.width = (falta / seg * 100) + '%'; el.querySelector('b').textContent = s;
        el.classList.toggle('acabando', falta <= 5);
        if (s < ult) { ult = s; if (s <= 3 && s > 0) EA.Som.tocar('contagem') }
        if (falta <= 0) { paraTempo(); responder('tempo') }
      }, 100) };
    }
    function responder(r) {
      if (travado || respondida || acabou || ctx.estatico) return;
      var p = perguntas[i];
      if (typeof r === 'number' && EA.Quiz.tipo(p) === 'uma' && r >= p.ops.length) return;
      /* 09/11: o jogo pode avisar que a pergunta ainda não está na tela (ex.: o personagem andando até os alvos) */
      if (tela.pronto && !tela.pronto()) return;
      travado = true; respondida = true; paraTempo();
      var ok = EA.Quiz.confere(p, r) && !errou;
      if (ok) acertos++;
      marcas[i] = ok;
      /* "repete": o jogo devolve a mesma pergunta; acertar depois de errar não conta como certa de primeira */
      /* 09/11: se o jogo tropeçar ao mostrar a resposta, o quiz destrava e segue (antes a apresentação inteira congelava) */
      var pr; try { pr = Promise.resolve(tela.responde(i, p, r)) } catch (e) { pr = Promise.reject(e) }
      pr.then(function (x) { travado = false; if (x === 'repete') { respondida = false; errou = true; return } if (x) { resultado = x; termina() } }, function (e) { console.error(e); travado = false });
    }
    function clicaOpcao(k) {
      var p = perguntas[i];
      if (EA.Quiz.tipo(p) === 'uma') responder(k);
      else if (tela.clica && !respondida) tela.clica(k);
    }
    function termina() { acabou = true; paraTempo(); tela.fim(acertos, perguntas.length, resultado || (acertos / perguntas.length >= .7 ? 'venceu' : 'perdeu'), { marcas: marcas, perguntas: perguntas }) }
    function avancar() {
      if (ctx.estatico || travado) return true;
      if (acabou) return false;
      if (!respondida) return true;
      respondida = false; errou = false; i++;
      if (i >= perguntas.length) termina(); else { tela.mostra(i, perguntas[i]); comecaTempo() }
      return true;
    }
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]');
      if (b && !b.disabled) { e.stopPropagation(); EA.Som.tocar('clique'); clicaOpcao(+b.dataset.k); return }
      var a = e.target.closest('[data-acao]');
      if (a) {
        e.stopPropagation();
        if (a.dataset.acao === 'confirma') { var r = tela.resposta && tela.resposta(); if (r) responder(r) }
        else if (a.dataset.acao === 'recomeca') { raiz.innerHTML = ''; comeca() }
        else if (a.dataset.acao === 'erradas') { var er = perguntas.filter(function (_, k) { return !marcas[k] }); raiz.innerHTML = ''; comeca(er.length ? er : null) }
        else if (ctx.aoContinuar) ctx.aoContinuar();
        return;
      }
      if (e.target.closest('.qp-exp.ver,.rpg-exp.ver,.pen-exp.ver')) { e.stopPropagation(); avancar(); return }
      if (e.target.closest('.qp-liga,.qp-ops')) e.stopPropagation();
    });
    comeca();
    return {
      avancar: avancar,
      tecla: function (t) {
        var n = '1234'.indexOf(t); if (n < 0) n = 'abcd'.indexOf(String(t).toLowerCase());
        var p = perguntas[i], tp = p && EA.Quiz.tipo(p);
        if (n >= 0 && !respondida && !acabou && tp !== 'ligar') { clicaOpcao(n); return true }
        if (t === 'Enter' && !respondida && !acabou && tp && tp !== 'uma') { var r = tela.resposta && tela.resposta(); if (r) responder(r); return true }
        if ((t === 'r' || t === 'R') && acabou) { raiz.innerHTML = ''; comeca(); return true }
        return false;
      },
      recomecar: function () { raiz.innerHTML = ''; comeca() }
    };
  };
  EA.Quiz.previa = function (q, projeto) {
    var r = EA.el('div', 'quiz');
    EA.Quiz.montar(r, q, { estatico: true, projeto: projeto });
    return r;
  };
})();
