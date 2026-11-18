/* hf_a.js (10/11, teste local): lista de checagem, baralho de fichas, roleta de sorteio, letreiro de aeroporto,
   foco entre dois, comparação lado a lado, riscar e corrigir, frase com palavra trocando.
   Ideias das peças do HyperFrames, refeitas do zero com CSS e um pouco de JS (sem biblioteca de fora).
   No editor ficam paradas num estado bonito; na apresentação cada clique faz a peça andar e não passa o slide. */
(function () {
  var EA = window.EA, HF = EA.HF, esc = HF.esc, txt = HF.txt, c = HF.c;
  function lista(p, k, pad) { return p[k] || pad }
  /* 10/11: a faixa "Tamanho do texto" do painel mostra 20 quando não há valor; grava o padrão da peça e redesenha o painel */
  function tam(pr, F, v) { if (pr.tamTexto == null) { pr.tamTexto = v; setTimeout(F.mostra, 0) } }
  /* 10/11: começa sem transição (estado inicial da apresentação) e solta logo depois */
  function semPulo(el, f) { el.classList.add('hfa-st'); f(); el.offsetWidth; setTimeout(function () { el.classList.remove('hfa-st') }, 30) }
  function cada(l, f) { [].forEach.call(l, f) }
  /* 10/11: lista grande: com o ajuste ligado (padrão) a base mede a peça e diminui a letra / divide em páginas */
  function ajuste(p) { return p.ajuste === false ? '' : ' data-hf-cabe="1"' }
  function ckAjuste(cx, pr, F, so) { cx.appendChild(F.ck(so ? 'Texto grande: diminuir a letra para caber' : 'Lista grande: diminuir a letra e dividir em páginas', pr.ajuste !== false, function (v) { pr.ajuste = v; F.muda() })) }
  function json(el, k) { try { return JSON.parse(el.getAttribute(k)) || [] } catch (e) { return [] } }
  HF.css('.hfa-st,.hfa-st *{transition:none!important}' +
    '.hfa-dica{font:600 .5em/1 \'Segoe UI\',Arial,sans-serif;opacity:.55;letter-spacing:.02em;text-align:center}');

  /* ============ 1. Lista de checagem: caneta marca item por item; uma palavra do título vem circulada ============ */
  var CHK_PAD = [{ t: 'Foto com boa luz' }, { t: 'Texto curto e claro' }, { t: 'Preço à vista' }, { t: 'Botão de compra' }];
  HF.css('.hfa-chk{position:relative;box-sizing:border-box;padding:6% 8%;border-radius:18px;font-family:\'Segoe UI\',Arial,sans-serif;box-shadow:0 14px 34px rgba(15,23,42,.14),0 0 0 1px rgba(15,23,42,.06);background-image:radial-gradient(circle,rgba(120,100,80,.13) 1.2px,transparent 1.6px);background-size:22px 22px;display:flex;flex-direction:column;overflow:hidden}' +
    '.hfa-chk-t{margin:0 0 .7em;font-size:1.35em;font-weight:800;line-height:1.2;letter-spacing:-.01em}' +
    '.hfa-chk-w{position:relative;display:inline-block;padding:0 .18em}' +
    '.hfa-chk-w svg{position:absolute;left:-.4em;top:-.32em;width:calc(100% + .8em);height:calc(100% + .64em);overflow:visible;pointer-events:none}' +
    '.hfa-chk svg path{fill:none;stroke:var(--mc);stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1}' +
    '.hfa-chk .hfa-chk-w path{stroke-width:3.2;stroke-dashoffset:0;transition:stroke-dashoffset .9s cubic-bezier(.6,0,.3,1)}' +
    '.hfa-chk.esconde .hfa-chk-w path{stroke-dashoffset:1;transition:none;opacity:0}' +
    '.hfa-chk ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.55em;flex:1;justify-content:center}' +
    '.hfa-chk.hf-paginado ul{justify-content:flex-start}' +
    '.hfa-chk li{display:flex;align-items:center;gap:.6em;line-height:1.25}' +
    '.hfa-chk-b{flex:none;width:1.25em;height:1.25em;overflow:visible}' +
    '.hfa-chk-b rect{fill:none;stroke:currentColor;stroke-opacity:.35;stroke-width:2.2}' +
    '.hfa-chk-b path{stroke-width:4.2;transition:stroke-dashoffset .38s cubic-bezier(.5,0,.3,1)}' +
    '.hfa-chk-x{position:relative;transition:opacity .4s .25s}' +
    '.hfa-chk-x svg{position:absolute;left:-.15em;top:.12em;width:calc(100% + .3em);height:1em;overflow:visible;pointer-events:none;transform:scaleX(0);transform-origin:0 50%;transition:transform .45s .2s cubic-bezier(.5,0,.3,1)}' +
    '.hfa-chk .hfa-chk-x path{stroke-width:3;stroke-dasharray:none}' +
    '.hfa-chk li.on .hfa-chk-b path{stroke-dashoffset:0}' +
    '.hfa-chk.m-ambos li.on .hfa-chk-x svg{transform:none}.hfa-chk.m-ambos li.on .hfa-chk-x{opacity:.55}' +
    '.apresenta .hfa-chk{cursor:pointer}');
  HF.elemento('hf_checklist', { nome: 'Lista de checagem', w: 520, h: 380, corRot: 'Cor da caneta', corPad: '#e11d48', tamTexto: 1,
    cores: [['fundoUi', 'Fundo do cartão', '#fffdf5'], ['corTexto', 'Cor do texto', '#1f2937']],
    campos: { t: 'Antes de', w: 'publicar' }, rotulos: { t: 'Título', w: 'Palavra circulada (vem depois do título)' },
    html: function (p) {
      var its = lista(p, 'itens', CHK_PAD);
      return '<div class="hfa-chk m-' + esc(p.marca || 'ambos') + '" data-hf="hf_checklist"' + ajuste(p) + ' style="--mc:' + esc(p.cor || '#e11d48') + ';font-size:' + (p.tamTexto || 22) + 'px;background-color:' + esc(p.fundoUi || '#fffdf5') + ';color:' + esc(p.corTexto || '#1f2937') + '">' +
        '<h3 class="hfa-chk-t">' + c(p.campos, 't') + ' <span class="hfa-chk-w">' + c(p.campos, 'w') + '<svg viewBox="0 0 100 40" preserveAspectRatio="none"><path pathLength="1" d="M10 24 C 6 9, 40 3, 64 5 C 90 7, 99 16, 94 27 C 88 37, 48 39, 24 35 C 6 31, 1 20, 16 11"/></svg></span></h3><ul>' +
        its.map(function (q) {
          return '<li><svg class="hfa-chk-b" viewBox="0 0 32 32"><rect x="3" y="3" width="26" height="26" rx="6"/><path pathLength="1" d="M7 16 L13.5 24 L28 4"/></svg><span class="hfa-chk-x">' + txt(q.t) +
            '<svg viewBox="0 0 100 10" preserveAspectRatio="none"><path pathLength="1" vector-effect="non-scaling-stroke" d="M0 6 Q 28 3, 52 5.5 T 100 4"/></svg></span></li>' }).join('') +
        '</ul></div>';
    },
    cabe: function (el) { return HF.cabe(el, { grupos: [el.querySelectorAll('li')] }) },
    painel: function (cx, o, F) {
      var pr = o.props; if (!pr.itens) pr.itens = EA.clona(CHK_PAD); tam(pr, F, 22);
      ckAjuste(cx, pr, F);
      cx.appendChild(F.campo('A caneta marca', F.sel(pr.marca || 'ambos', [['ambos', 'Visto e risco no texto'], ['visto', 'Só o visto na caixinha']], function (v) { pr.marca = v; F.muda() })));
      F.listaItens(cx, o, pr.itens, 'Itens da lista', [{ k: 't', tipo: 'linha', ph: 'item da lista' }], function () { return { t: '' } }, 'Novo item');
      F.nota('Na apresentação: a palavra do título é circulada sozinha; cada clique marca o próximo item. Depois do último, o próximo clique recomeça a lista. Com "Lista grande" ligado, lista que não cabe fica com a letra menor e, se ainda assim não couber, vira páginas (um clique a mais passa de página).');
    }
  }, function (el) {
    var lis = el.querySelectorAll('li'), ul = el.querySelector('ul'), n = 0, pg = 0, ind = HF.passos(el, 'dentro');
    /* 10/11: com páginas, passos = itens + trocas de página (o clique depois do último item da página vira a página) */
    var cb = el._cabe, pags = cb ? cb.paginas : [[]], total = lis.length + pags.length - 1;
    /* 10/11: começo = nada marcado e o círculo da palavra se desenhando de novo */
    function comeco() {
      n = 0; pg = 0; if (cb) cb.mostra(0); cada(lis, function (l) { l.classList.remove('on') }); ind(0, total);
      semPulo(el, function () { el.classList.add('esconde') });
      setTimeout(function () { if (HF.vivo(el)) el.classList.remove('esconde') }, 500);
    }
    comeco();
    el.addEventListener('click', function (ev) {
      HF.para(ev); if (!lis.length) return;
      if (n + pg >= total) { comeco(); HF.som(el, 'pagina'); return }
      var esta = pags[pg];
      if (cb && pg < pags.length - 1 && n > esta[esta.length - 1]) { pg++; HF.folheia(ul, function () { cb.mostra(pg) }); HF.som(el, 'pagina') }
      else { lis[n++].classList.add('on'); HF.som(el, 'toque') }
      ind(n + pg, total);
    });
  });

  /* ============ 2. Baralho de fichas: clique vira a ficha (resposta); o próximo manda ela para o fundo ============ */
  var BAR_PAD = [{ t: 'O que é o Pixel?', r: 'Um código no site que conta quem comprou depois de ver o anúncio.' }, { t: 'O que é CTR?', r: 'De cada 100 pessoas que veem o anúncio, quantas clicam.' }, { t: 'O que é público?', r: 'O grupo de pessoas que vai ver o anúncio.' }];
  HF.css('.hfa-bar{position:relative;font-family:\'Segoe UI\',Arial,sans-serif;perspective:1400px}' +
    '.hfa-bar-c{position:absolute;left:4%;right:4%;top:0;bottom:12%;transform-origin:50% 100%;transform:translateY(calc(var(--k)*5%)) scale(calc(1 - var(--k)*.06));opacity:calc(3 - var(--k));transition:transform .6s cubic-bezier(.34,1.5,.5,1),opacity .4s}' +
    '.hfa-bar-c.voa{transform:translate(0,-38%) rotate(-7deg) scale(1.03);transition:transform .26s cubic-bezier(.3,0,.6,1)}' +
    '.hfa-bar-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.4,1.3,.5,1)}' +
    '.hfa-bar-c.virada .hfa-bar-in{transform:rotateY(180deg)}' +
    '.hfa-bar-in>div{position:absolute;inset:0;box-sizing:border-box;padding:7% 9%;border-radius:22px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:.5em;box-shadow:0 10px 26px rgba(15,23,42,.16),0 0 0 1px rgba(15,23,42,.07)}' +
    '.hfa-bar-in .v{transform:rotateY(180deg);background:var(--bc);color:#fff}' +
    '.hfa-bar-in p{margin:0;font-weight:700;line-height:1.25}.hfa-bar-in .v p{font-weight:600}' +
    '.hfa-bar-in small{position:absolute;top:.8em;left:1em;font:700 .55em \'Segoe UI\',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--bc)}.hfa-bar-in .v small{color:rgba(255,255,255,.8)}' +
    '.hfa-bar-in em{position:absolute;bottom:.9em;left:0;right:0;font:italic 600 .5em \'Segoe UI\',sans-serif;opacity:.5}' +
    '.hfa-bar-in .f:before{content:"";position:absolute;left:0;top:0;bottom:0;width:8px;border-radius:22px 0 0 22px;background:var(--bc)}' +
    '.apresenta .hfa-bar{cursor:pointer}');
  HF.elemento('hf_baralho', { nome: 'Baralho de fichas', w: 480, h: 320, corRot: 'Cor do verso', corPad: '#7c3aed', tamTexto: 1,
    cores: [['fundoUi', 'Fundo das fichas', '#ffffff'], ['corTexto', 'Cor do texto', '#0f172a']], campos: {},
    html: function (p) {
      var fs = lista(p, 'fichas', BAR_PAD), n = fs.length;
      return '<div class="hfa-bar" data-hf="hf_baralho" style="--bc:' + esc(p.cor || '#7c3aed') + ';font-size:' + (p.tamTexto || 26) + 'px">' + fs.map(function (q, i) {
        return '<div class="hfa-bar-c" style="--k:' + i + ';z-index:' + (n - i) + '"><div class="hfa-bar-in"><div class="f" style="background:' + esc(p.fundoUi || '#ffffff') + ';color:' + esc(p.corTexto || '#0f172a') + '"><small>' + (i + 1) + ' / ' + n + '</small><p>' + txt(q.t) + '</p><em>' + (q.r ? 'clique para ver a resposta' : 'clique para a próxima') + '</em></div>' +
          '<div class="v"><small>Resposta</small><p>' + txt(q.r) + '</p></div></div></div>' }).join('') + '</div>';
    },
    painel: function (cx, o, F) {
      var pr = o.props; if (!pr.fichas) pr.fichas = EA.clona(BAR_PAD); tam(pr, F, 26);
      F.listaItens(cx, o, pr.fichas, 'Fichas', [{ k: 't', tipo: 'linha', ph: 'frente (pergunta)' }, { k: 'r', tipo: 'area', ph: 'verso (resposta) — pode ficar vazio' }], function () { return { t: '', r: '' } }, 'Nova ficha');
      F.nota('Na apresentação: o 1º clique vira a ficha e mostra a resposta; o próximo manda a ficha para o fundo do baralho e traz a seguinte. Ficha sem resposta passa direto. Depois da última, o próximo clique volta o baralho ao começo.');
    }
  }, function (el) {
    var cs = el.querySelectorAll('.hfa-bar-c'), ordem = [], ocup = false, feitos = 0, total = -1, ind = HF.passos(el);
    function temR(cd) { return !!cd.querySelector('.v p').textContent }
    /* 10/11: passos = virar cada ficha com resposta + passar para a seguinte; a última não passa: o clique depois dela recomeça */
    cada(cs, function (x, i) { ordem.push(i); total += temR(x) ? 2 : 1 });
    function arruma() { ordem.forEach(function (i, k) { cs[i].style.setProperty('--k', k); cs[i].style.zIndex = ordem.length - k }) }
    function proxima() {
      var cd = cs[ordem[0]];
      ocup = true; cd.classList.add('voa'); HF.som(el, 'entrada');
      setTimeout(function () {
        if (!HF.vivo(el)) return;
        ordem.push(ordem.shift()); cd.classList.remove('voa', 'virada'); arruma();
        setTimeout(function () { ocup = false }, 250);
      }, 270);
    }
    ind(0, total);
    el.addEventListener('click', function (ev) {
      HF.para(ev); if (ocup || !cs.length) return;
      /* depois da última ficha, ela vai para o fundo e o baralho volta à ordem do começo */
      if (feitos >= total) { feitos = 0; ind(0, total); if (cs.length > 1) proxima(); else cs[0].classList.remove('virada'); return }
      var cd = cs[ordem[0]];
      if (temR(cd) && !cd.classList.contains('virada')) { cd.classList.add('virada'); HF.som(el, 'pagina') }
      else proxima();
      ind(++feitos, total);
    });
  });

  /* ============ 3. Roleta de sorteio: fita de nomes gira e para num sorteado ============ */
  var ROL_PAD = [{ t: 'Ana' }, { t: 'Bruno' }, { t: 'Carla' }, { t: 'Diego' }, { t: 'Elisa' }];
  HF.css('.hfa-rol{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.25em;font-family:\'Segoe UI\',Arial,sans-serif;box-sizing:border-box}' +
    '.hfa-rol-t{font-size:.5em;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--rc)}' +
    '.hfa-rol-j{position:relative;width:100%;height:4.2em;overflow:hidden;border-radius:.3em;box-shadow:inset 0 0 0 2px rgba(15,23,42,.08),0 10px 26px rgba(15,23,42,.12)}' +
    '.hfa-rol-j:before{content:"";position:absolute;left:0;right:0;top:1.4em;height:1.4em;background:var(--rc);opacity:.13;border-top:3px solid var(--rc);border-bottom:3px solid var(--rc);box-sizing:border-box}' +
    '.hfa-rol-fita{position:absolute;left:0;right:0;top:0;-webkit-mask-image:linear-gradient(transparent,#000 30%,#000 70%,transparent);mask-image:linear-gradient(transparent,#000 30%,#000 70%,transparent)}' +
    '.hfa-rol-fita span{display:block;height:1.4em;line-height:1.4em;text-align:center;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 1.2em}' +
    '.hfa-rol-seta{position:absolute;top:2.1em;width:0;height:0;margin-top:-.32em;border:.32em solid transparent}' +
    '.hfa-rol-seta.e{left:.15em;border-left-color:var(--rc)}.hfa-rol-seta.d{right:.15em;border-right-color:var(--rc)}' +
    '.hfa-rol-fita span.ganhou{animation:hfaRolPop .55s cubic-bezier(.3,1.6,.5,1);color:var(--rc)}' +
    '@keyframes hfaRolPop{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}' +
    '.hfa-rol .hfa-dica{font-size:.32em;margin-top:.3em}' +
    '.apresenta .hfa-rol{cursor:pointer}');
  HF.elemento('hf_roleta', { nome: 'Roleta de sorteio', w: 520, h: 260, corRot: 'Cor de destaque', corPad: '#ea580c', tamTexto: 1,
    cores: [['fundoUi', 'Fundo da janela', '#ffffff'], ['corTexto', 'Cor dos nomes', '#0f172a']],
    campos: { t: 'Quem responde agora?' }, rotulos: { t: 'Título' },
    html: function (p) {
      var op = lista(p, 'opcoes', ROL_PAD).filter(function (q) { return q.t }), n = op.length || 1;
      function nome(i) { return op.length ? txt(op[(i + n) % n].t) : '…' }
      return '<div class="hfa-rol" data-hf="hf_roleta" data-som="' + (p.semSom ? 0 : 1) + '" data-unico="' + (p.semRepetir ? 1 : 0) + '" data-op="' + esc(JSON.stringify(op.map(function (q) { return q.t }))) + '" style="--rc:' + esc(p.cor || '#ea580c') + ';font-size:' + (p.tamTexto || 44) + 'px;color:' + esc(p.corTexto || '#0f172a') + '">' +
        '<div class="hfa-rol-t">' + c(p.campos, 't') + '</div><div class="hfa-rol-j" style="background:' + esc(p.fundoUi || '#ffffff') + '"><div class="hfa-rol-fita"><span>' + nome(-1) + '</span><span>' + nome(0) + '</span><span>' + nome(1) + '</span></div><i class="hfa-rol-seta e"></i><i class="hfa-rol-seta d"></i></div>' +
        '<div class="hfa-dica">clique para sortear</div></div>';
    },
    painel: function (cx, o, F) {
      var pr = o.props; if (!pr.opcoes) pr.opcoes = EA.clona(ROL_PAD); tam(pr, F, 44);
      cx.appendChild(F.ck('Sem repetir (cada um sai uma vez só)', pr.semRepetir, function (v) { pr.semRepetir = v; F.muda() }));
      cx.appendChild(F.ck('Tique-tique enquanto gira', !pr.semSom, function (v) { pr.semSom = !v; F.muda() }));
      F.listaItens(cx, o, pr.opcoes, 'Opções do sorteio', [{ k: 't', tipo: 'linha', ph: 'nome ou opção' }], function () { return { t: '' } }, 'Nova opção');
      F.nota('Na apresentação: cada clique gira a roleta e ela para numa opção sorteada. Uma rodada tem tantos sorteios quanto opções; com "sem repetir", cada uma sai uma vez. No fim da rodada, o próximo clique volta ao começo.');
    }
  }, function (el) {
    var op = json(el, 'data-op'), fita = el.querySelector('.hfa-rol-fita'), dica = el.querySelector('.hfa-dica'), som = el.dataset.som === '1', unico = el.dataset.unico === '1', atual = 0, saiu = [], gira = false, feitos = 0, ind = HF.passos(el);
    if (!op.length) return;
    function linha(t, cl) { return '<span' + (cl ? ' class="' + cl + '"' : '') + '>' + esc(t) + '</span>' }
    /* 10/11: passos = sorteios; uma rodada tem tantos sorteios quanto opções. Depois dela, o clique volta a roleta ao começo */
    var inicio = fita.innerHTML;
    ind(0, op.length);
    el.addEventListener('click', function (ev) {
      HF.para(ev); if (gira) return;
      if (feitos >= op.length) { feitos = 0; saiu = []; atual = 0; fita.innerHTML = inicio; dica.textContent = 'clique para sortear'; ind(0, op.length); HF.som(el, 'pagina'); return }
      var livres = [], k, recomeca = false;
      for (k = 0; k < op.length; k++) if (!unico || saiu.indexOf(k) < 0) livres.push(k);
      if (!livres.length) { saiu = []; recomeca = true; for (k = 0; k < op.length; k++) livres.push(k) }
      ind(++feitos, op.length);
      var alvo = livres[Math.floor(Math.random() * livres.length)];
      if (unico) saiu.push(alvo);
      /* fita: anterior, atual, ~25 sorteios aleatórios, o escolhido e o seguinte */
      var seq = [(atual - 1 + op.length) % op.length, atual], volta = 22 + Math.floor(Math.random() * 6);
      for (k = 0; k < volta; k++) seq.push(Math.floor(Math.random() * op.length));
      seq.push(alvo, (alvo + 1) % op.length); seq[seq.length - 3] = (alvo - 1 + op.length) % op.length;
      var M = seq.length - 2;
      fita.innerHTML = seq.map(function (i) { return linha(op[i]) }).join('');
      gira = true; dica.textContent = recomeca ? 'todos já saíram — recomeçando' : 'sorteando…';
      var an = fita.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-1.4 * (M - 1)) + 'em)' }], { duration: 2600 + Math.random() * 500, easing: 'cubic-bezier(.12,.7,.12,1)', fill: 'forwards' });
      var lin = fita.firstChild.offsetHeight || 1, ult = 0, ultSom = 0;
      function tique(t) {
        if (!gira || !HF.vivo(el)) return;
        var m = new DOMMatrixReadOnly(getComputedStyle(fita).transform), i = Math.round(-m.m42 / lin);
        if (i !== ult && t - ultSom > 55) { ult = i; ultSom = t; if (som) HF.som(el, 'clique') }
        requestAnimationFrame(tique);
      }
      requestAnimationFrame(tique);
      an.onfinish = function () {
        gira = false; if (!HF.vivo(el)) return;
        atual = alvo;
        fita.innerHTML = linha(op[seq[M - 1]]) + linha(op[alvo], 'ganhou') + linha(op[seq[M + 1]]);
        an.cancel(); HF.som(el, 'sucesso');
        dica.textContent = feitos >= op.length ? (unico ? 'todos já saíram' : 'fim da rodada') + ' — clique para recomeçar' : unico ? 'faltam ' + (op.length - saiu.length) : 'clique para sortear de novo';
      };
    });
  });

  /* ============ 4. Letreiro de aeroporto: plaquinhas viram letra por letra até a próxima frase ============ */
  var LET_PAD = [{ t: 'Bem-vindos' }, { t: 'Aula 3: anúncios' }, { t: 'Vamos começar' }];
  var LET_SORTE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function letFrases(p) { var m = !p.minusc; return lista(p, 'frases', LET_PAD).map(function (q) { var s = String(q.t || '').replace(/\s+/g, ' ').trim(); return m ? s.toLocaleUpperCase('pt-BR') : s }).filter(function (s) { return s }) }
  function letCols(fr) { return Math.max(1, Math.min(32, fr.reduce(function (m, s) { return Math.max(m, s.length) }, 1))) }
  function letCentra(s, n) { s = s.slice(0, n); var e = Math.floor((n - s.length) / 2); return new Array(e + 1).join(' ') + s + new Array(n - s.length - e + 1).join(' ') }
  HF.css('.hfa-let{box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:4%;border-radius:16px;font-family:Consolas,\'Courier New\',monospace;box-shadow:inset 0 2px 10px rgba(0,0,0,.35),0 12px 30px rgba(15,23,42,.18)}' +
    '.hfa-let-l{display:flex;gap:.12em;width:100%;justify-content:center}' +
    '.hfa-let b{position:relative;flex:1 1 0;max-width:1.05em;height:1.45em;display:flex;align-items:center;justify-content:center;border-radius:.1em;background:linear-gradient(var(--lt) 0 50%,var(--lt2) 50%);box-shadow:0 .05em .1em rgba(0,0,0,.4);font-weight:700;line-height:1}' +
    '.hfa-let b:after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:rgba(0,0,0,.45)}' +
    '.hfa-let b i{font-style:normal;display:block}' +
    '.apresenta .hfa-let{cursor:pointer}');
  HF.elemento('hf_letreiro', { nome: 'Letreiro de aeroporto', w: 760, h: 150, corRot: 'Cor das plaquinhas', corPad: '#1e293b',
    cores: [['corTexto', 'Cor das letras', '#fde68a'], ['fundoUi', 'Fundo do letreiro', '#0b1120']], campos: {},
    html: function (p, o) {
      var fr = letFrases(p), n = letCols(fr), w = (o && o.w) || 760, h = (o && o.h) || 150, s = letCentra(fr[0] || '', n), cor = p.cor || '#1e293b';
      var fs = Math.max(8, Math.min((w * .92) / (n * 1.17), (h * .9) / 1.6));
      return '<div class="hfa-let" data-hf="hf_letreiro" data-som="' + (p.semSom ? 0 : 1) + '" data-fr="' + esc(JSON.stringify(fr)) + '" style="font-size:' + fs.toFixed(1) + 'px;background:' + esc(p.fundoUi || '#0b1120') + ';color:' + esc(p.corTexto || '#fde68a') + ';--lt:' + esc(cor) + ';--lt2:color-mix(in srgb,' + esc(cor) + ' 82%,#000)">' +
        '<div class="hfa-let-l">' + s.split('').map(function (ch) { return '<b><i>' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</i></b>' }).join('') + '</div></div>';
    },
    painel: function (cx, o, F) {
      var pr = o.props; if (!pr.frases) pr.frases = EA.clona(LET_PAD);
      cx.appendChild(F.ck('Tudo em letra maiúscula', !pr.minusc, function (v) { pr.minusc = !v; F.muda() }));
      cx.appendChild(F.ck('Som das plaquinhas', !pr.semSom, function (v) { pr.semSom = !v; F.muda() }));
      F.listaItens(cx, o, pr.frases, 'Frases do letreiro', [{ k: 't', tipo: 'linha', ph: 'frase (até 32 letras)' }], function () { return { t: '' } }, 'Nova frase');
      F.nota('Na apresentação: cada clique vira as plaquinhas, letra por letra, até a próxima frase. Depois da última, volta para a primeira. Frases curtas ficam com letras maiores.');
    }
  }, function (el) {
    var fr = json(el, 'data-fr'), bs = el.querySelectorAll('b'), at = 0, gen = 0, som = el.dataset.som === '1', ultSom = 0, ind = HF.passos(el);
    if (fr.length < 2) return;
    /* 10/11: passos = frases depois da primeira; depois da última, o clique vira tudo de volta para a primeira (o começo) */
    ind(0, fr.length - 1);
    function vira(b, ch) {
      var i = b.firstChild;
      b.animate([{ transform: 'perspective(5em) rotateX(0)' }, { transform: 'perspective(5em) rotateX(-90deg)', offset: .5 }, { transform: 'perspective(5em) rotateX(0)' }], { duration: 110, easing: 'linear' });
      setTimeout(function () { i.innerHTML = ch === ' ' ? '&nbsp;' : esc(ch) }, 55);
      var t = Date.now(); if (som && t - ultSom > 70) { ultSom = t; HF.som(el, 'clique') }
    }
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      at = (at + 1) % fr.length; ind(at, fr.length - 1); var g = ++gen, alvo = letCentra(fr[at], bs.length);
      cada(bs, function (b, k) {
        var ch = alvo.charAt(k), velho = b.firstChild.textContent.replace(/ /g, ' ');
        if (velho === ch) return;
        var seq = [], q = 2 + Math.floor(Math.random() * 3);
        while (q--) seq.push(LET_SORTE.charAt(Math.floor(Math.random() * LET_SORTE.length)));
        seq.push(ch);
        (function passo(j) {
          setTimeout(function () { if (g !== gen || !HF.vivo(el)) return; vira(b, seq[j]); if (j + 1 < seq.length) passo(j + 1) }, j ? 120 : k * 38);
        })(0);
      });
    });
  });

  /* ============ 5. Foco entre dois: um cartão fica nítido e o outro recua ============ */
  HF.css('.hfa-foc{display:flex;gap:4%;align-items:stretch;font-family:\'Segoe UI\',Arial,sans-serif;box-sizing:border-box;padding:3% 2%}' +
    '.hfa-foc-c{flex:1;box-sizing:border-box;padding:1.1em 1.2em;border-radius:20px;border-top:7px solid var(--fc);box-shadow:0 12px 30px rgba(15,23,42,.14),0 0 0 1px rgba(15,23,42,.06);display:flex;flex-direction:column;gap:.45em;transition:transform .65s cubic-bezier(.2,.9,.25,1.15),opacity .5s,filter .5s,box-shadow .5s}' +
    '.hfa-foc-c h4{margin:0;font-size:1.35em;line-height:1.15;color:var(--fc);font-weight:800}' +
    '.hfa-foc-c p{margin:0;line-height:1.35}' +
    '.hfa-foc.fa .b,.hfa-foc.fb .a{transform:scale(.93);opacity:.55}' +
    '.hfa-foc.fa .a,.hfa-foc.fb .b{transform:scale(1.03);box-shadow:0 22px 48px rgba(15,23,42,.22),0 0 0 3px var(--fc)}' +
    '.apresenta .hfa-foc.fa .b,.apresenta .hfa-foc.fb .a{filter:blur(2px) grayscale(.5);opacity:.4}' +
    '.apresenta .hfa-foc{cursor:pointer}');
  HF.elemento('hf_foco', { nome: 'Foco entre dois', w: 760, h: 250, corRot: 'Cor do segundo cartão', corPad: '#2563eb', tamTexto: 1,
    cores: [['corA', 'Cor do primeiro cartão', '#e11d48'], ['fundoUi', 'Fundo dos cartões', '#ffffff'], ['corTexto', 'Cor do texto', '#0f172a']],
    campos: { ta: 'Do jeito antigo', da: 'Post solto, sem plano, só quando sobra tempo.', tb: 'Do jeito novo', db: 'Calendário simples: 3 posts por semana, cada um com um objetivo.' },
    rotulos: { ta: 'Título do primeiro', da: 'Texto do primeiro', tb: 'Título do segundo', db: 'Texto do segundo' },
    html: function (p) {
      var bg = 'background:' + esc(p.fundoUi || '#ffffff') + ';';
      return '<div class="hfa-foc ' + (p.focoInicio === 'b' ? 'fb' : p.focoInicio === 'n' ? '' : 'fa') + '" data-hf="hf_foco" style="font-size:' + (p.tamTexto || 20) + 'px;color:' + esc(p.corTexto || '#0f172a') + '">' +
        '<div class="hfa-foc-c a" style="' + bg + '--fc:' + esc(p.corA || '#e11d48') + '"><h4>' + c(p.campos, 'ta') + '</h4><p>' + c(p.campos, 'da') + '</p></div>' +
        '<div class="hfa-foc-c b" style="' + bg + '--fc:' + esc(p.cor || '#2563eb') + '"><h4>' + c(p.campos, 'tb') + '</h4><p>' + c(p.campos, 'db') + '</p></div></div>';
    },
    painel: function (cx, o, F) {
      var pr = o.props;
      cx.appendChild(F.campo('Começa com o foco no', F.sel(pr.focoInicio || 'a', [['a', 'Primeiro cartão'], ['b', 'Segundo cartão'], ['n', 'Nenhum (os dois iguais)']], function (v) { pr.focoInicio = v; F.muda() })));
      F.nota('Na apresentação: o 1º clique passa o foco para o outro cartão e o 2º deixa os dois iguais (começando sem foco: 1º e 2º cartão). O que perde o foco fica menor e embaçado. O clique seguinte volta ao começo.');
    }
  }, function (el) {
    /* 10/11: passos = 2. Começando num cartão: 1º passa o foco ao outro, 2º deixa os dois iguais (para comparar).
       Começando sem foco: 1º primeiro cartão, 2º segundo. Depois, o clique volta ao começo. */
    var ini = el.classList.contains('fa') ? 'fa' : el.classList.contains('fb') ? 'fb' : '', n = 0, ind = HF.passos(el);
    var seq = ini === 'fa' ? ['fa', 'fb', ''] : ini === 'fb' ? ['fb', 'fa', ''] : ['', 'fa', 'fb'];
    function poe(k) { el.classList.remove('fa', 'fb'); if (seq[k]) el.classList.add(seq[k]); ind(k, 2) }
    ind(0, 2);
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      n = n >= 2 ? 0 : n + 1; poe(n); HF.som(el, n ? 'toque' : 'pagina');
    });
  });

  /* ============ 6. Comparação lado a lado: os cartões abrem inclinados e depois destacam um lado de cada vez ============ */
  var CMP_A = [{ t: 'Cresce devagar' }, { t: 'Fala com quem já segue' }, { t: 'Bom para criar laço' }];
  var CMP_B = [{ t: 'Resultado mais rápido' }, { t: 'Alcança gente nova' }, { t: 'Dá para medir cada real' }];
  HF.css('.hfa-cmp{position:relative;display:flex;gap:5%;font-family:\'Segoe UI\',Arial,sans-serif;perspective:1200px;box-sizing:border-box;padding:2% 1%}' +
    '.hfa-cmp-c{flex:1;box-sizing:border-box;padding:1em 1.1em;border-radius:20px;box-shadow:0 12px 30px rgba(15,23,42,.14),0 0 0 1px rgba(15,23,42,.06);display:flex;flex-direction:column;gap:.55em;transition:transform .75s cubic-bezier(.2,.9,.25,1.12),opacity .55s,box-shadow .45s;overflow:hidden}' +
    '.hfa-cmp-c.e{transform-origin:100% 50%}.hfa-cmp-c.d{transform-origin:0 50%}' +
    '.hfa-cmp-tag{align-self:flex-start;padding:.18em .7em;border-radius:99px;background:var(--cc);color:#fff;font-size:.62em;font-weight:800;letter-spacing:.06em;text-transform:uppercase}' +
    '.hfa-cmp-c h4{margin:0;font-size:1.4em;line-height:1.1;font-weight:800;color:var(--cc)}' +
    '.hfa-cmp-c ul{list-style:none;margin:.1em 0 0;padding:0;display:flex;flex-direction:column;gap:.45em}' +
    '.hfa-cmp-c li{display:flex;gap:.5em;align-items:flex-start;line-height:1.25;transition:opacity .45s,transform .5s cubic-bezier(.2,.9,.3,1.2);transition-delay:calc(.25s + var(--i)*.09s)}' +
    '.hfa-cmp-c li:before{content:"";flex:none;width:.55em;height:.55em;margin-top:.33em;border-radius:50%;background:var(--cc)}' +
    '.hfa-cmp-vs{position:absolute;left:50%;top:50%;width:2.4em;height:2.4em;margin:-1.2em 0 0 -1.2em;border-radius:50%;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.8em;box-shadow:0 6px 16px rgba(15,23,42,.3);z-index:2;transition:transform .5s cubic-bezier(.3,1.6,.5,1)}' +
    '.hfa-cmp.fechado .hfa-cmp-c.e{transform:translateX(-8%) rotateY(38deg) scale(.9);opacity:.35}' +
    '.hfa-cmp.fechado .hfa-cmp-c.d{transform:translateX(8%) rotateY(-38deg) scale(.9);opacity:.35}' +
    '.hfa-cmp.fechado li{opacity:0;transform:translateY(.6em);transition-delay:0s}.hfa-cmp.fechado .hfa-cmp-vs{transform:scale(0)}' +
    '.hfa-cmp.he .hfa-cmp-c.e,.hfa-cmp.hd .hfa-cmp-c.d{transform:scale(1.04);box-shadow:0 22px 48px rgba(15,23,42,.2),0 0 0 3px var(--cc)}' +
    '.hfa-cmp.he .hfa-cmp-c.d,.hfa-cmp.hd .hfa-cmp-c.e{transform:scale(.95);opacity:.45}' +
    '.apresenta .hfa-cmp{cursor:pointer}');
  HF.elemento('hf_compara', { nome: 'Comparação lado a lado', w: 820, h: 320, corRot: 'Cor do lado direito', corPad: '#2563eb', tamTexto: 1,
    cores: [['corA', 'Cor do lado esquerdo', '#f59e0b'], ['fundoUi', 'Fundo dos cartões', '#ffffff'], ['corTexto', 'Cor do texto', '#0f172a']],
    campos: { ea: 'sem pagar', ta: 'Orgânico', eb: 'com verba', tb: 'Anúncio' },
    rotulos: { ea: 'Etiqueta da esquerda', ta: 'Título da esquerda', eb: 'Etiqueta da direita', tb: 'Título da direita' },
    html: function (p) {
      var bg = 'background:' + esc(p.fundoUi || '#ffffff') + ';';
      function lado(k, cls, cor, its) {
        return '<div class="hfa-cmp-c ' + cls + '" style="' + bg + '--cc:' + esc(cor) + '"><span class="hfa-cmp-tag">' + c(p.campos, 'e' + k) + '</span><h4>' + c(p.campos, 't' + k) + '</h4><ul>' +
          its.map(function (q, i) { return '<li style="--i:' + i + '">' + txt(q.t) + '</li>' }).join('') + '</ul></div>';
      }
      return '<div class="hfa-cmp" data-hf="hf_compara"' + ajuste(p) + ' style="font-size:' + (p.tamTexto || 20) + 'px;color:' + esc(p.corTexto || '#0f172a') + '">' +
        lado('a', 'e', p.corA || '#f59e0b', lista(p, 'itensA', CMP_A)) + (p.semVs ? '' : '<b class="hfa-cmp-vs">VS</b>') + lado('b', 'd', p.cor || '#2563eb', lista(p, 'itensB', CMP_B)) + '</div>';
    },
    cabe: function (el) { var cs = el.querySelectorAll('.hfa-cmp-c'); return HF.cabe(el, { grupos: [cs[0].querySelectorAll('li'), cs[1].querySelectorAll('li')], caixas: [cs[0], cs[1]] }) },
    painel: function (cx, o, F) {
      var pr = o.props; if (!pr.itensA) pr.itensA = EA.clona(CMP_A); if (!pr.itensB) pr.itensB = EA.clona(CMP_B);
      ckAjuste(cx, pr, F);
      cx.appendChild(F.ck('Bolinha "VS" no meio', !pr.semVs, function (v) { pr.semVs = !v; F.muda() }));
      F.listaItens(cx, o, pr.itensA, 'Itens da esquerda', [{ k: 't', tipo: 'linha', ph: 'item' }], function () { return { t: '' } }, 'Novo item à esquerda');
      F.listaItens(cx, o, pr.itensB, 'Itens da direita', [{ k: 't', tipo: 'linha', ph: 'item' }], function () { return { t: '' } }, 'Novo item à direita');
      F.nota('Na apresentação os cartões começam inclinados. 1º clique: abrem e os itens aparecem. 2º: destaca a esquerda. 3º: destaca a direita. 4º: fecha e volta ao começo. Com "Lista grande" ligado e itens demais, a letra diminui e, se ainda não couber, a lista vira páginas: cada página tem abrir/passar página, esquerda e direita.');
    }
  }, function (el) {
    /* 10/11: passos = abrir, destacar a esquerda, destacar a direita; depois, o clique fecha de novo (o começo) */
    /* 10/11: com páginas, cada página tem 3 passos (abrir ou passar de página, esquerda, direita) */
    var n = 0, pg = 0, ind = HF.passos(el), cb = el._cabe, total = 3 * (cb ? cb.paginas.length : 1), uls = el.querySelectorAll('.hfa-cmp-c ul');
    semPulo(el, function () { el.classList.add('fechado') });
    ind(0, total);
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      n = n >= total ? 0 : n + 1;
      var k = n ? Math.floor((n - 1) / 3) : 0, r = n ? (n - 1) % 3 : -1;
      if (cb && k !== pg) { pg = k; if (n) HF.folheia(uls, function () { cb.mostra(k) }); else cb.mostra(0) }
      el.classList.toggle('fechado', n === 0); el.classList.toggle('he', r === 1); el.classList.toggle('hd', r === 2);
      HF.som(el, n === 1 ? 'surgir' : !n || r === 0 ? 'pagina' : 'toque'); ind(n, total);
    });
  });

  /* ============ 7. Riscar e corrigir: a frase errada leva um risco e a certa aparece ============ */
  HF.css('.hfa-ris{display:flex;flex-direction:column;justify-content:center;gap:.6em;font-family:\'Segoe UI\',Arial,sans-serif;box-sizing:border-box;padding:2% 3%}' +
    '.hfa-ris>div{display:flex;align-items:flex-start;gap:.55em;line-height:1.3}' +
    '.hfa-ris svg{flex:none;width:1.15em;height:1.15em;margin-top:.08em;border-radius:50%;padding:.18em;box-sizing:border-box;fill:none;stroke:#fff;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}' +
    '.hfa-ris-e svg{background:var(--re)}.hfa-ris-c svg{background:var(--rc)}' +
    '.hfa-ris-e [data-campo]{background:linear-gradient(var(--re),var(--re)) no-repeat 0 58%/0% .11em;transition:background-size .55s cubic-bezier(.6,0,.3,1),color .4s .3s}' +
    '.hfa-ris-c{transition:opacity .45s .45s,transform .55s .45s cubic-bezier(.2,.9,.3,1.3)}' +
    '.hfa-ris-c [data-campo]{font-weight:700;background:linear-gradient(var(--rcl),var(--rcl)) no-repeat 0 88%/0% .45em;transition:background-size .6s .85s cubic-bezier(.6,0,.3,1)}' +
    '.hfa-ris.feito .hfa-ris-e [data-campo]{background-size:100% .11em;color:color-mix(in srgb,currentColor 50%,transparent)}' +
    '.hfa-ris.feito .hfa-ris-c [data-campo]{background-size:100% .45em}' +
    '.hfa-ris:not(.feito) .hfa-ris-c{opacity:0;transform:translateY(.5em)}' +
    '.apresenta .hfa-ris{cursor:pointer}');
  HF.elemento('hf_riscar', { nome: 'Riscar e corrigir', w: 640, h: 190, corRot: 'Cor do certo', corPad: '#16a34a', tamTexto: 1,
    cores: [['corErro', 'Cor do errado', '#e11d48'], ['corTexto', 'Cor do texto', '#0f172a']],
    campos: { e: 'O Pixel só serve para quem vende pela internet.', c: 'O Pixel mede qualquer ação no site: cadastro, contato ou compra.' },
    rotulos: { e: 'Frase errada', c: 'Frase certa' },
    html: function (p) {
      var cc = esc(p.cor || '#16a34a');
      return '<div class="hfa-ris feito" data-hf="hf_riscar" style="--rc:' + cc + ';--rcl:color-mix(in srgb,' + cc + ' 22%,transparent);--re:' + esc(p.corErro || '#e11d48') + ';font-size:' + (p.tamTexto || 26) + 'px;color:' + esc(p.corTexto || '#0f172a') + '">' +
        '<div class="hfa-ris-e"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg><span>' + c(p.campos, 'e') + '</span></div>' +
        '<div class="hfa-ris-c"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>' + c(p.campos, 'c') + '</span></div></div>';
    },
    painel: function (cx, o, F) { tam(o.props, F, 26); F.nota('Aqui no Design aparece já corrigido, para você ver tudo. Na apresentação começa só com a frase errada: o clique risca ela e mostra a certa. Outro clique volta ao começo.') }
  }, function (el) {
    /* 10/11: um passo só (o aviso de passos some quando é 1); o clique seguinte volta ao começo */
    var ind = HF.passos(el);
    semPulo(el, function () { el.classList.remove('feito') });
    ind(0, 1);
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      var f = el.classList.toggle('feito'); HF.som(el, f ? 'certo' : 'pagina'); ind(f ? 1 : 0, 1);
    });
  });

  /* ============ 8. Frase com palavra trocando: a palavra em destaque troca com letras pulando ============ */
  var FRA_PAD = [{ t: 'claro' }, { t: 'curto' }, { t: 'útil' }, { t: 'verdadeiro' }];
  HF.css('.hfa-fra{display:flex;align-items:center;justify-content:center;text-align:center;font-family:\'Segoe UI\',Arial,sans-serif;font-weight:700;box-sizing:border-box;padding:2% 3%}' +
    '.hfa-fra p{margin:0;line-height:1.45}' +
    '.hfa-fra-g{display:inline-grid;vertical-align:bottom;padding:0 .28em;margin:0 .05em;border-radius:.22em;overflow:hidden;line-height:1.3}' +
    '.hfa-fra.fundo .hfa-fra-g{background:var(--fc);color:#fff;box-shadow:0 .08em .25em color-mix(in srgb,var(--fc) 40%,transparent)}' +
    '.hfa-fra.letra .hfa-fra-g{color:var(--fc);background:linear-gradient(var(--fc),var(--fc)) no-repeat 50% 92%/80% .08em}' +
    '.hfa-fra-w{grid-area:1/1;justify-self:center;white-space:nowrap;visibility:hidden}' +
    '.hfa-fra-w.on,.hfa-fra-w.sai{visibility:visible}' +
    '.hfa-fra-w i{display:inline-block;font-style:normal}' +
    '.hfa-fra.vivo .hfa-fra-w.on i{animation:hfaFraEn .5s cubic-bezier(.2,1.4,.4,1) both;animation-delay:calc(var(--l)*.035s + .12s)}' +
    '.hfa-fra.vivo .hfa-fra-w.sai i{animation:hfaFraSai .3s cubic-bezier(.6,0,.8,.4) both;animation-delay:calc(var(--l)*.02s)}' +
    '@keyframes hfaFraEn{from{transform:translateY(105%) rotate(10deg);opacity:0}to{transform:none;opacity:1}}' +
    '@keyframes hfaFraSai{from{transform:none;opacity:1}to{transform:translateY(-105%) rotate(-8deg);opacity:0}}' +
    '.apresenta .hfa-fra{cursor:pointer}');
  HF.elemento('hf_frase', { nome: 'Frase com palavra trocando', w: 820, h: 150, corRot: 'Cor da palavra', corPad: '#7c3aed', tamTexto: 1,
    cores: [['corTexto', 'Cor do texto', '#0f172a']],
    campos: { a: 'Todo post precisa ser', b: 'para quem lê.' }, rotulos: { a: 'Começo da frase', b: 'Fim da frase' },
    html: function (p) {
      var ws = lista(p, 'palavras', FRA_PAD).filter(function (q) { return q.t });
      if (!ws.length) ws = [{ t: '…' }];
      return '<div class="hfa-fra ' + (p.estilo === 'letra' ? 'letra' : 'fundo') + '" data-hf="hf_frase"' + ajuste(p) + ' style="--fc:' + esc(p.cor || '#7c3aed') + ';font-size:' + (p.tamTexto || 40) + 'px;color:' + esc(p.corTexto || '#0f172a') + '"><p>' + c(p.campos, 'a') + ' <span class="hfa-fra-g">' +
        ws.map(function (q, i) { return '<span class="hfa-fra-w' + (i ? '' : ' on') + '">' + String(q.t).split('').map(function (ch, l) { return '<i style="--l:' + l + '">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</i>' }).join('') + '</span>' }).join('') +
        '</span> ' + c(p.campos, 'b') + '</p></div>';
    },
    cabe: function (el) { return HF.cabe(el, { paginar: false }) },
    painel: function (cx, o, F) {
      var pr = o.props; if (!pr.palavras) pr.palavras = EA.clona(FRA_PAD); tam(pr, F, 40);
      ckAjuste(cx, pr, F, true);
      cx.appendChild(F.campo('Destaque da palavra', F.sel(pr.estilo || 'fundo', [['fundo', 'Fundo colorido'], ['letra', 'Letra colorida com traço']], function (v) { pr.estilo = v; F.muda() })));
      F.listaItens(cx, o, pr.palavras, 'Palavras que trocam', [{ k: 't', tipo: 'linha', ph: 'palavra' }], function () { return { t: '' } }, 'Nova palavra');
      F.nota('Na apresentação: cada clique troca a palavra em destaque pela próxima da lista (depois da última, volta à primeira). O espaço fica do tamanho da maior palavra, para a frase não pular.');
    }
  }, function (el) {
    /* 10/11: passos = palavras depois da primeira; depois da última, o clique volta à primeira (o começo) */
    var ws = el.querySelectorAll('.hfa-fra-w'), i = 0, tm = 0, ind = HF.passos(el);
    el.classList.add('vivo'); ind(0, ws.length - 1);
    el.addEventListener('click', function (ev) {
      HF.para(ev); if (ws.length < 2) return;
      cada(ws, function (w) { w.classList.remove('sai') });
      ws[i].classList.remove('on'); ws[i].classList.add('sai');
      var velho = ws[i]; clearTimeout(tm); tm = setTimeout(function () { if (HF.vivo(el)) velho.classList.remove('sai') }, 700);
      i = (i + 1) % ws.length; ws[i].classList.add('on'); HF.som(el, i ? 'toque' : 'pagina'); ind(i, ws.length - 1);
    });
  });
})();
