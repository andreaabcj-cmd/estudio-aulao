/* Jogos de quiz com os pacotes do PC: batalha de monstrinhos e tiro em primeira pessoa.
   As criaturas são as do próprio pacote, com nomes nossos; nenhum nome, marca ou arte de jogo famoso. Vai no HTML exportado. */
(function () {
  var EA = window.EA, esc = EA.esc, LETRAS = 'ABCDEF';
  var TEXTURAS = {}, CENAS_3D = {};
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }

  function textoFlutua(raiz, txt, cx, cy, cls) {
    var n = EA.el('div', 'rpg-num ' + (cls || ''), txt); n.style.left = cx + 'px'; n.style.top = cy + 'px'; raiz.appendChild(n);
    n.animate([{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-34px) scale(1.2)', opacity: 1, offset: .2 }, { transform: 'translate(-50%,-52px)', opacity: 1, offset: .7 }, { transform: 'translate(-50%,-84px)', opacity: 0 }], { duration: 950, easing: 'ease-out' }).onfinish = function () { n.remove() };
  }
  function barra(b, f) { b.querySelector('.v').style.width = f * 100 + '%'; setTimeout(function () { b.querySelector('.r').style.width = f * 100 + '%' }, 350); b.classList.toggle('baixa', f <= .34) }
  function fimJogo(raiz, q, ganhou, acertos, tot, titulo, b1) {
    var f = EA.el('div', 'rpg-fim ' + (ganhou ? 'ganhou' : 'perdeu'), '<h2>' + titulo + '</h2><p>' + acertos + ' de ' + tot + ' certas</p><div><button data-acao="recomeca" class="rpg-b">' + b1 + '</button><button data-acao="segue" class="rpg-b prim">Continuar ▸</button></div>');
    raiz.appendChild(f);
    f.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.06)', opacity: 1, offset: .7 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], { duration: 420, easing: 'steps(8)', fill: 'both' });
    if (ganhou) { EA.Som.tocar('vitoria'); EA.festa(raiz, EA.W / 2, 280, 170) } else EA.Som.tocar('derrota');
  }

  /* ---------- batalha de monstrinhos ---------- */
  /* os pés pisam no miolo dos círculos, que estão nestes pontos em todas as arenas (ferramentas/gerar_arenas.py usa os mesmos números) */
  var MON_PERTO = { x: 340, y: 436 }, MON_LONGE = { x: 930, y: 288 };
  /* corpo de verdade dentro do quadro de 96: meio dos pés (sem a cauda), linha dos pés e topo */
  var MON_CORPO = { m1: [46, 68, 29], m2: [49.5, 74, 11], m3: [51, 89, 4], m4: [48.5, 72, 25], m5: [42, 72, 26], m6: [51, 81, 21], m7: [46, 71, 25], m8: [42.5, 78, 17], m9: [50, 93, 0], m10: [53, 70, 26], m11: [50, 73, 19], m12: [43.5, 67, 32], m13: [50.5, 76, 22], m14: [48, 91, 11], m15: [49.5, 63, 19], m16: [45.5, 74, 20] };
  /* atacam parados, só com a animação: o golpe acerta no meio dela (4 quadros, cerca de 445 ms) */
  var MON_IMPACTO = 240, MON_ATAQUE = 1000;
  function montaMon(raiz, q, ctx) {
    raiz.className = 'quiz quiz-rpg quiz-mon';
    var me = q.heroi && q.heroi.lut, ele = q.inimigo && q.inimigo.lut;
    raiz.innerHTML = '<div class="mon-fundo" style="background-image:url(' + EA.url(q.fundoImg) + ')"></div><div class="rpg-cena"><div class="mon-move"><canvas class="mon-ele"></canvas></div><div class="mon-move"><canvas class="mon-me"></canvas></div></div>' +
      '<div class="rpg-st dir mon-st-ele"><div class="rpg-st-n">' + esc(q.inimigo.nome) + '</div><div class="rpg-vida"><i class="r"></i><i class="v"></i></div></div>' +
      '<div class="rpg-st esq mon-st-me"><div class="rpg-st-n">' + esc(q.heroi.nome) + '</div><div class="rpg-vida"><i class="r"></i><i class="v"></i></div><div class="rpg-st-c"></div></div>' +
      '<div class="rpg-jan mon-jan"><div class="rpg-p"></div><div class="rpg-ops"></div><div class="rpg-exp"></div></div><div class="rpg-flash"></div>';
    var cena = raiz.querySelector('.rpg-cena'), cMe = raiz.querySelector('.mon-me'), cEle = raiz.querySelector('.mon-ele'), flash = raiz.querySelector('.rpg-flash');
    var mMe = cMe.parentNode, mEle = cEle.parentNode;
    var eP = raiz.querySelector('.rpg-p'), eO = raiz.querySelector('.rpg-ops'), eE = raiz.querySelector('.rpg-exp'), jan = raiz.querySelector('.rpg-jan'), eC = raiz.querySelector('.rpg-st-c');
    var bMe = raiz.querySelector('.mon-st-me .rpg-vida'), bEle = raiz.querySelector('.mon-st-ele .rpg-vida');
    function corpo(l) { return MON_CORPO[l.id] || [48, 90, 6] }
    /* o de perto aparece maior; os muito altos ficam um ponto menores para não bater no quadro de vida */
    function escala(l, perto) { var c = corpo(l); return perto && c[1] - c[2] < 70 ? 4 : 3 }
    var EM = escala(me, true), E = escala(ele, false);
    /* os do pacote olham para a esquerda: o nosso é espelhado, para olhar o adversário */
    function poe(c, l, p, e, espelha) {
      var k = corpo(l), meio = espelha ? 96 - k[0] : k[0];
      c.style.cssText = 'position:absolute;width:' + 96 * e + 'px;height:' + 96 * e + 'px;left:' + Math.round(p.x - meio * e) + 'px;top:' + Math.round(p.y - k[1] * e) + 'px' + (espelha ? ';transform:scaleX(-1)' : '');
    }
    poe(cEle, ele, MON_LONGE, E, false); poe(cMe, me, MON_PERTO, EM, true);
    var sMe = EA.spriteLutador(cMe, me, 'idle'), sEle = EA.spriteLutador(cEle, ele, 'idle');
    sMe.cfg.loop = true; sEle.cfg.loop = true;
    function meioDe(l, p, e) { var k = corpo(l); return { x: p.x, y: p.y - (k[1] - k[2]) * e / 2, topo: p.y - (k[1] - k[2]) * e } }
    var aMe = meioDe(me, MON_PERTO, EM), aEle = meioDe(ele, MON_LONGE, E);
    /* entrada: o adversário já está lá; o nosso se forma do ar. As perguntas só aparecem depois */
    var entrada = Promise.resolve();
    if (ctx.estatico) { sMe.fixa(0); sEle.fixa(0) }
    else {
      if (EA.Musica && q.musica) EA.Musica.tocar(q.musica, ctx.projeto);
      cMe.style.visibility = 'hidden'; jan.style.visibility = 'hidden';
      entrada = new Promise(function (ok) {
        var voltas = 0;
        (function pronto() { if (sMe.k >= 0 || voltas++ > 120) ok(); else requestAnimationFrame(pronto) })();
      }).then(function () { return espera(350) }).then(function () { return EA.Quiz.desintegra(cMe, sMe, cena, true, true) }).then(function () { jan.style.visibility = '' });
    }
    /* mesma regra do RPG: uma parte da barra por pergunta nos dois lados; vence quem tem mais vida e, no empate, quem bateu por último */
    var total = q.perguntas.length, vMe = total, vEle = total, serie = 0, vencedor = null, timers = [], chamados = [];
    /* ao abrir cada pergunta os dois dão um passinho à frente e voltam, cada um com o seu grito */
    function chamada() {
      function passo(m, dx, dy) { var a = m.animate([{ transform: 'none' }, { transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 500, easing: 'ease-in-out' }); chamados.push(a) }
      passo(mMe, 55, -14); EA.Som.grito(me.id);
      timers.push(setTimeout(function () { passo(mEle, -33, 8); EA.Som.grito(ele.id, me.id === ele.id) }, 500));
    }
    function paraChamada() { timers.forEach(clearTimeout); timers = []; chamados.forEach(function (a) { a.cancel() }); chamados = [] }
    function golpe(g, cx, cy, tam) {
      if (!g) return;
      var c = EA.el('canvas', 'fx-solto'); c.style.cssText = 'left:' + (cx - tam / 2) + 'px;top:' + (cy - tam / 2) + 'px;width:' + tam + 'px;height:' + tam + 'px';
      cena.appendChild(c);
      var s = new EA.Sprite(c, { src: EA.url(g.caminho), w: 96, h: 96, n: 4, dt: .085, loop: false, quadro: function (k) { return { x: k * 96, y: 0 } } });
      s.aoFim = function () { c.remove() };
    }
    function dano(c) { c.animate([{ filter: 'brightness(3) saturate(0)', opacity: 1 }, { filter: 'none', opacity: .35 }, { opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 480, easing: 'steps(5)' }) }
    function treme() { cena.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-8px,4px)' }, { transform: 'translate(8px,-4px)' }, { transform: 'translate(0,0)' }], { duration: 240 }) }
    function acaba() { if (EA.Musica && q.musica) EA.Musica.parar(1.2) }
    /* opc.final: este golpe mata na hora em que acerta */
    function atacaEu(crit, opc) {
      opc = opc || {};
      var morte = null;
      return new Promise(function (ok) {
        sMe.anim('attack', function () { sMe.anim('idle', null, true) }, false);
        setTimeout(function () {
          EA.Som.tocar(crit ? 'critico' : 'golpe'); golpe(q.golpeImg, aEle.x, aEle.y, crit ? 480 : 380); treme();
          textoFlutua(raiz, opc.texto || (crit ? 'CRÍTICO!' : 'Acertou!'), aEle.x, Math.max(90, aEle.topo), crit || opc.texto ? 'crit' : '');
          if (opc.final) { vEle = 0; barra(bEle, 0); acaba(); morte = EA.Quiz.desintegra(cEle, sEle, cena, false); return }
          dano(cEle); vEle = Math.max(0, vEle - 1); barra(bEle, vEle / total);
        }, MON_IMPACTO);
        setTimeout(ok, MON_ATAQUE);
      }).then(function () { return morte });
    }
    function atacaEle(opc) {
      opc = opc || {};
      var morte = null;
      return new Promise(function (ok) {
        sEle.anim('attack', function () { sEle.anim('idle', null, true) }, false);
        setTimeout(ok, MON_ATAQUE);
        setTimeout(function () {
          EA.Som.tocar('dano'); golpe(q.golpeIni || q.golpeImg, aMe.x, aMe.y, 420); treme();
          flash.style.background = '#ff3b4e'; flash.animate([{ opacity: .5 }, { opacity: 0 }], { duration: 240 });
          textoFlutua(raiz, opc.texto || 'Errou!', aMe.x, Math.max(90, aMe.topo), opc.texto ? 'crit' : 'ruim');
          if (opc.final) { vMe = 0; barra(bMe, 0); acaba(); morte = EA.Quiz.desintegra(cMe, sMe, cena, true); return }
          dano(cMe); vMe = Math.max(0, vMe - 1); barra(bMe, vMe / total);
        }, MON_IMPACTO);
      }).then(function () { return morte });
    }
    return {
      mostra: function (i, p) {
        /* 09/11: os textos do quiz são texto puro; escapados, "a < b" ou "<div>" aparecem como foram escritos */
        eP.innerHTML = EA.esc(p.p || 'Escreva a pergunta');
        eO.innerHTML = p.ops.map(function (o, k) { return '<button class="rpg-op" data-k="' + k + '"><b>' + LETRAS[k] + '</b><span>' + EA.esc(o) + '</span></button>' }).join('');
        eO.className = 'rpg-ops n' + p.ops.length;
        eE.className = 'rpg-exp'; eE.innerHTML = ''; jan.classList.remove('resp');
        if (ctx.estatico) return;
        entrada.then(function () {
          jan.animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'steps(5)' });
          chamada();
        });
      },
      responde: function (i, p, k) {
        return entrada.then(function () {
          paraChamada();
          var certo = k === p.certa, bs = eO.children;
          [].forEach.call(bs, function (x) { x.disabled = true; x.classList.add('apagado') });
          bs[p.certa].classList.remove('apagado'); bs[p.certa].classList.add('certa');
          if (!certo) { bs[k].classList.remove('apagado'); bs[k].classList.add('errada') }
          EA.Som.tocar(certo ? 'certo' : 'errado');
          var quem = certo ? 'me' : 'ele', vence = null;
          if (i === total - 1) {
            var a = vMe - (certo ? 0 : 1), b = vEle - (certo ? 1 : 0);
            vence = a > b ? 'me' : b > a ? 'ele' : quem;
            vencedor = vence;
          }
          if (certo) { serie++; eC.textContent = serie > 1 ? 'Série ×' + serie : '' } else { serie = 0; eC.textContent = '' }
          function luta() {
            var f = vence === quem, d = certo ? atacaEu(serie >= 3, { final: f }) : atacaEle({ final: f });
            /* quem levou a pior nesta rodada não bate por último: o vencedor responde com o golpe final */
            if (vence && !f) d = d.then(function () { return vence === 'me' ? atacaEu(false, { final: true, texto: 'Golpe final!' }) : atacaEle({ final: true, texto: 'Golpe final!' }) });
            return d;
          }
          /* a janela mostra a resposta por um instante e sai; só volta com todos de novo nos seus lugares */
          return espera(300).then(function () {
            var sai = jan.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(30px)', opacity: 0 }], { duration: 220, easing: 'steps(4)', fill: 'forwards' });
            return luta().then(function () { sai.cancel(); jan.animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'steps(5)' }) });
          }).then(function () {
            eE.innerHTML = '<b>' + (certo ? 'Certo!' : 'Resposta certa: ' + LETRAS[p.certa] + '.') + '</b> ' + EA.esc(p.exp || '') + '<span class="rpg-seg">Continuar ▸</span>';
            eE.className = 'rpg-exp ver'; jan.classList.add('resp');
          });
        });
      },
      fim: function (acertos, tot, resultado) {
        var ganhou = vencedor ? vencedor === 'me' : resultado !== 'perdeu';
        jan.style.display = 'none';
        fimJogo(raiz, q, ganhou, acertos, tot, ganhou ? 'Vitória!' : 'Derrota…', 'Batalhar de novo');
      }
    };
  }

  /* ---------- tiro em primeira pessoa: cada inimigo carrega uma resposta ---------- */
  function montaFps(raiz, q, ctx) {
    var T = q.tema;
    if (!ctx.estatico && EA.Musica && q.musica) EA.Musica.tocar(q.musica, ctx.projeto);
    raiz.className = 'quiz quiz-rpg quiz-fps';
    raiz.innerHTML = '<canvas class="fps-3d" width="320" height="180"></canvas><div class="fps-alvos"></div><canvas class="fps-arma"></canvas><canvas class="fps-sangue" width="320" height="180"></canvas><div class="fps-escuro"></div><div class="fps-hud"><img class="fps-mun-i" alt=""><span class="fps-mun"></span></div>' +
      '<div class="rpg-jan fps-jan"><div class="rpg-p"></div><div class="rpg-exp"></div></div><i class="fps-mira"></i><div class="rpg-flash"></div>';
    var cv = raiz.querySelector('.fps-3d'), x = cv.getContext('2d'), alvos = raiz.querySelector('.fps-alvos'), eP = raiz.querySelector('.rpg-p'), eE = raiz.querySelector('.rpg-exp'), jan = raiz.querySelector('.fps-jan'), flash = raiz.querySelector('.rpg-flash'), mira = raiz.querySelector('.fps-mira'), eM = raiz.querySelector('.fps-mun'), cA = raiz.querySelector('.fps-arma'), cS = raiz.querySelector('.fps-sangue'), gS = cS.getContext('2d'), escuro = raiz.querySelector('.fps-escuro');
    var sprites = [];

    /* ---------- salas desenhadas por raios, em 320 × 180 ----------
       A cena tem duas salas: a atual e a seguinte, que está de verdade atrás da porta. Primeiro vai a seguinte, inteira;
       por cima vai a atual, com a fresta da porta transparente. Assim a sala nova aparece quando a porta abre, com a perspectiva certa, e dá para atravessar. */
    /* suave (padrão): o dobro de pontos e a imagem amaciada ao ampliar. Pixelado: 320 × 180, como no início */
    var ESC3 = q.cenarioPixelado ? 1 : 2, W3 = 320 * ESC3, H3 = 180 * ESC3, HOR = 84 * ESC3, K = 88 * ESC3, PORTA_L = .75, ENTRADA = 1.2, TEXEL = .01154;
    cv.width = W3; cv.height = H3; x.imageSmoothingEnabled = false; if (ESC3 > 1) cv.classList.add('suave');
    var tex = {}, ok3d = false, z = 0, olho = 1, aberta = 0, proxPronta = null;
    var chave3d = ESC3 + '|' + T.salas.map(function (s) { return s.id }).join(',');
    var SALAS = {}, sala = null, prox = null, ligacao = null;
    T.salas.forEach(function (s) { SALAS[s.id] = s });
    function folha() { var c = document.createElement('canvas'); c.width = W3; c.height = H3; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; return { c: c, g: g, im: g.createImageData(W3, H3) } }
    var bAtual = folha(), bProx = folha();
    function pixels(img) { var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; var g = c.getContext('2d'); g.drawImage(img, 0, 0); return { w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data } }
    function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] }
    function ind(P, u, v) { return (((v - Math.floor(v)) * P.h | 0) * P.w + ((u - Math.floor(u)) * P.w | 0)) * 4 }
    function desenhaSala(b, S, zc, porta, pf, faixa) {
      var sxA = 0, sxB = W3;
      if (faixa) { sxA = Math.max(0, Math.floor(W3 / 2 * (1 - faixa)) - 2); sxB = Math.min(W3, Math.ceil(W3 / 2 * (1 + faixa)) + 2) }
      var d = b.im.data, sx, sy, o, s, c1 = hex(S.ceu[0]), c2 = hex(S.ceu[1]), P = tex[S.parede], F = tex[S.fundoT || S.parede], C = tex[S.chao], Te = S.teto ? tex[S.teto] : null, D = porta ? tex[porta] : null, Co = S.copa ? tex[S.copa] : null, Ce = S.ceuImg ? tex[S.ceuImg] : null, ceuU = S.ceuU || 0, copaAlt = S.copaAlt || 1;
      var dist = Math.max(.15, S.fundo - zc), teto = S.altura + .9 * (1 - olho), bx = .9 * olho, topoPorta = HOR - K / dist * (1.9 - bx), V = S.parV || 1, gap = PORTA_L * pf, chaoF = bx * K;
      function atras(sy, dx, zz) {   /* o que se vê pelos buracos da parede: céu ou chão */
        if (sy <= HOR && Ce) { var cq = ind(Ce, dx * .125 + .5 + ceuU, Math.min(.999, Math.max(0, sy / HOR))); d[o] = Ce.d[cq]; d[o + 1] = Ce.d[cq + 1]; d[o + 2] = Ce.d[cq + 2]; return }
        if (sy <= HOR) { var f = sy / HOR; d[o] = c1[0] + (c2[0] - c1[0]) * f; d[o + 1] = c1[1] + (c2[1] - c1[1]) * f; d[o + 2] = c1[2] + (c2[2] - c1[2]) * f; return }
        var t = chaoF / (sy - HOR), q = ind(C, dx * t + 50, t + zz), l = Math.max(.25, 1 - t / S.luz);
        d[o] = C.d[q] * l; d[o + 1] = C.d[q + 1] * l; d[o + 2] = C.d[q + 2] * l;
      }
      for (sx = sxA; sx < sxB; sx++) {
        var dx = (sx - W3 / 2) / (W3 / 2), adx = Math.abs(dx), tL = adx < .001 ? 1e9 : S.meia / adx, lado = tL < dist, tp = lado ? tL : dist, topo = HOR - K / tp * teto, base = HOR + K / tp * bx, xp = dx * dist, ax = Math.abs(xp), f = Math.max(.25, 1 - tp / S.luz), topoCopa = Co ? HOR - K / tp * (teto + copaAlt) : 0, uCol = lado ? (zc + tp) / 2 : xp / 2 + .5;
        for (sy = 0; sy < H3; sy++) {
          o = (sy * W3 + sx) * 4; d[o + 3] = 255;
          if (sy < topo) {
            if (Te) { var t = K * teto / (HOR - sy), q = ind(Te, dx * t + 50, t + zc), l = Math.max(.2, 1 - t / S.luz); d[o] = Te.d[q] * l; d[o + 1] = Te.d[q + 1] * l; d[o + 2] = Te.d[q + 2] * l }
            else if (Co && sy >= topoCopa) {
              s = ind(Co, uCol, Math.min(.999, (sy - topoCopa) / (topo - topoCopa)));
              if (Co.d[s + 3] < 128) atras(sy, dx, zc); else { d[o] = Co.d[s] * f; d[o + 1] = Co.d[s + 1] * f; d[o + 2] = Co.d[s + 2] * f }
            }
            else atras(sy, dx, zc);
          } else if (sy < base) {
            var vv = (sy - topo) / (base - topo);
            if (lado) {
              s = ind(P, (zc + tp) / 2, vv * V);
              if (P.d[s + 3] < 128) atras(sy, dx, zc); else { d[o] = P.d[s] * f; d[o + 1] = P.d[s + 1] * f; d[o + 2] = P.d[s + 2] * f }
            } else if (D && ax < PORTA_L + .07 && sy >= topoPorta - 1) {
              if (ax >= PORTA_L || sy < topoPorta) { d[o] = 26 * f; d[o + 1] = 24 * f; d[o + 2] = 22 * f }
              else if (ax < gap) d[o + 3] = 0;
              else {
                s = ind(D, (xp + (xp < 0 ? gap : -gap) + PORTA_L) / (2 * PORTA_L), (sy - topoPorta) / (base - topoPorta));
                if (D.d[s + 3] < 128) d[o + 3] = 0; else { d[o] = D.d[s] * f; d[o + 1] = D.d[s + 1] * f; d[o + 2] = D.d[s + 2] * f }
              }
            } else {
              s = ind(F, xp / 2 + .5, vv * V);
              if (F.d[s + 3] < 128) atras(sy, dx, zc); else { d[o] = F.d[s] * f; d[o + 1] = F.d[s + 1] * f; d[o + 2] = F.d[s + 2] * f }
            }
          } else atras(sy, dx, zc);
        }
      }
      /* clima: névoa com a distância e sombra onde parede e chão se encontram */
      {
        var nv = hex(S.teto ? '#23262b' : S.ceu[1]), fundoT = dist;
        for (sx = sxA; sx < sxB; sx++) {
          var dx2 = (sx - W3 / 2) / (W3 / 2), adx2 = Math.abs(dx2), tL2 = adx2 < .001 ? 1e9 : S.meia / adx2, tp2 = Math.min(tL2, fundoT), topo2 = HOR - K / tp2 * teto, base2 = HOR + K / tp2 * bx;
          for (sy = 0; sy < H3; sy++) {
            o = (sy * W3 + sx) * 4;
            if (!d[o + 3]) continue;
            var t2, ao = 1;
            if (sy >= base2) {
              t2 = chaoF / (sy - HOR);
              var lat = S.meia - Math.abs(dx2 * t2), fim2 = fundoT - t2;
              if (lat < .7) ao = .5 + .5 * Math.max(0, lat) / .7;
              if (fim2 < .6) ao *= .55 + .45 * Math.max(0, fim2) / .6;
            } else if (sy >= topo2) {
              t2 = tp2;
              var alto = (sy - topo2) / (base2 - topo2);
              if (alto > .78) ao = 1 - .45 * (alto - .78) / .22;
            } else if (Te) {
              t2 = K * teto / (HOR - sy);
              var lat2 = S.meia - Math.abs(dx2 * t2);
              if (lat2 < .7) ao = .6 + .4 * Math.max(0, lat2) / .7;
            } else continue;
            var nf = Math.min(.62, t2 / (S.luz * 1.05));
            d[o] = d[o] * ao * (1 - nf) + nv[0] * nf; d[o + 1] = d[o + 1] * ao * (1 - nf) + nv[1] * nf; d[o + 2] = d[o + 2] * ao * (1 - nf) + nv[2] * nf;
          }
        }
      }
      b.g.putImageData(b.im, 0, 0);
      /* objetos: dos mais longe aos mais perto; os que a câmera já passou somem */
      S.objs.slice().sort(function (a, c) { return c.z - a.z }).forEach(function (ob) {
        var t = ob.z - zc, img = EA.imagem(EA.url(ob.i));
        if (t < .55 || !img.naturalWidth) return;
        var e = K / t * TEXEL * ob.e, w = img.naturalWidth * e, h = img.naturalHeight * e;
        b.g.drawImage(img, Math.round(W3 / 2 + ob.x / t * W3 / 2 - w / 2), Math.round(HOR + K * .9 * olho / t - h), Math.ceil(w), Math.ceil(h));
      });
    }
    function pinta() {
      if (!ok3d || !sala) return;
      var dist = Math.max(.15, sala.fundo - z);
      /* com a porta fechada a sala seguinte fica escondida: basta desenhá-la uma vez */
      if (aberta > 0 || proxPronta !== prox) { desenhaSala(bProx, prox, -(dist + ENTRADA), null, 0, Math.min(1, (PORTA_L + .07) / dist)); proxPronta = prox }
      desenhaSala(bAtual, sala, z, ligacao.porta, aberta);
      x.clearRect(0, 0, W3, H3); x.drawImage(bProx.c, 0, 0); x.drawImage(bAtual.c, 0, 0);
    }
    /* a seguinte sai das ligações da sala: conversa com a anterior, mas varia */
    function sorteiaSaida() {
      var op = sala.liga;
      ligacao = ctx.estatico ? op[0] : op[Math.floor(Math.random() * op.length)];
      prox = SALAS[ligacao.para];
    }
    function pecasDasSalas() {
      var l = {};
      T.salas.forEach(function (s) { [s.chao, s.parede, s.fundoT, s.teto, s.copa, s.ceuImg].forEach(function (c) { if (c) l[c] = 1 }); s.objs.forEach(function (o) { l[o.i] = 1 }); s.liga.forEach(function (k) { l[k.porta] = 1 }) });
      return Object.keys(l);
    }
    function prepara3d() {
      var lista = pecasDasSalas(), imgs = lista.map(function (c) { return EA.imagem(EA.url(c)) });
      sala = ctx.estatico ? T.salas[0] : T.salas[Math.floor(Math.random() * T.salas.length)];
      sorteiaSaida();
      x.fillStyle = sala.ceu[0]; x.fillRect(0, 0, W3, H3);
      /* a miniatura é sempre a mesma cena: desenha uma vez só */
      if (ctx.estatico && CENAS_3D[chave3d]) { x.drawImage(CENAS_3D[chave3d], 0, 0); return }
      EA.preCarrega(lista.map(function (c) { return EA.url(c) })).then(function () {
        try {
          lista.forEach(function (c, i) { tex[c] = TEXTURAS[c] || (TEXTURAS[c] = pixels(imgs[i])) }); ok3d = true; pinta();
          if (ctx.estatico) { var g = document.createElement('canvas'); g.width = W3; g.height = H3; g.getContext('2d').drawImage(cv, 0, 0); CENAS_3D[chave3d] = g }
        } catch (e) { /* sem textura: fica o céu */ }
      });
    }
    function animaPorta(alvo, ms) {
      if (ctx.estatico) { aberta = alvo; pinta(); return Promise.resolve() }
      EA.Som.tocar('porta');
      return new Promise(function (fim) {
        var de = aberta, ini = performance.now();
        (function p() {
          var f = Math.min(1, (performance.now() - ini) / ms);
          aberta = de + (alvo - de) * f; pinta();
          if (f < 1 && raiz.isConnected) requestAnimationFrame(p); else fim();
        })();
      });
    }
    /* entre uma pergunta e outra: anda até a porta, ela abre, atravessa e para já dentro da sala nova */
    function anda() {
      if (ctx.estatico) return Promise.resolve();
      return new Promise(function (fim) {
        var ini = performance.now(), ateAPorta = sala.fundo - .15, total = ateAPorta + ENTRADA, DUR = 700 + total * 260, passou = false, abriu = false, ultPasso = -1;
        (function p() {
          var t = performance.now() - ini, f = Math.min(1, t / DUR), e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2, ande = e * total, nPasso = Math.floor(t / 430);
          if (nPasso !== ultPasso && f < .97) { ultPasso = nPasso; EA.Som.tocar('passo') }
          if (ande < ateAPorta) {
            z = ande;
            var dist = sala.fundo - z;
            aberta = Math.max(0, Math.min(1, (3.4 - dist) / 1.6));
            if (aberta > 0 && !abriu) { abriu = true; EA.Som.tocar('porta') }
          } else {
            if (!passou) { passou = true; sala = prox; aberta = 0; sorteiaSaida() }
            z = -(total - ande);
          }
          cv.style.transform = 'translateY(' + Math.sin(t / 95) * 3 + 'px) scale(1.03)';
          /* a arma balança com os passos: um lado a cada passo e desce no meio dele, como um oito deitado */
          var forca = Math.min(1, f * 6, (1 - f) * 6), oito = t / 430 * Math.PI;
          sw.bx = Math.sin(oito) * 22 * forca; sw.by = Math.abs(Math.cos(oito)) * -14 * forca + 14 * forca; poeArma();
          pinta();
          if (f < 1 && raiz.isConnected) requestAnimationFrame(p); else { z = 0; sw.bx = sw.by = 0; poeArma(); cv.style.transform = ''; pinta(); fim() }
        })();
      });
    }

    /* ---------- arma, munição e mira ---------- */
    var CARGA = 12, municao = CARGA;
    function municaoHud() { eM.textContent = municao }
    function armaFixa(k) {
      var a = T.arma, img = EA.imagem(EA.url(a.caminho)), g = cA.getContext('2d');
      cA.width = a.w; cA.height = a.h; g.imageSmoothingEnabled = false;
      var d = function () { g.clearRect(0, 0, a.w, a.h); g.drawImage(img, k * a.w, 0, a.w, a.h, 0, 0, a.w, a.h) };
      if (img.complete && img.naturalWidth) d(); else img.addEventListener('load', d, { once: true });
    }
    function sequencia(lista, ms) {
      return new Promise(function (fim) {
        var i = 0;
        (function p() { if (i >= lista.length) { fim(); return } armaFixa(lista[i++]); setTimeout(p, ctx.estatico ? 0 : ms) })();
      });
    }
    function atira() {
      EA.Som.tocar(T.arma.som || 'tiro');
      municao = Math.max(0, municao - 1); municaoHud();
      return sequencia(T.arma.tiro, 70).then(function () { armaFixa(0) });
    }
    /* a arma acompanha a mira com um atraso macio; "q" é o quanto ela desceu quando o jogador cai */
    var sw = { x: 0, y: 0, ax: 0, ay: 0, q: 0, aq: 0, bx: 0, by: 0 }, balancando = false;
    function poeArma() { var d = T.desl || [0, 0]; cA.style.transform = 'translate(' + Math.round(d[0] + sw.x + sw.bx) + 'px,' + Math.round(d[1] + sw.y + sw.q + sw.by) + 'px)' }
    function balanca() {
      if (balancando) return;
      balancando = true;
      (function p() {
        sw.x += (sw.ax - sw.x) * .14; sw.y += (sw.ay - sw.y) * .14; sw.q += (sw.aq - sw.q) * .09;
        poeArma();
        if (raiz.isConnected && Math.abs(sw.ax - sw.x) + Math.abs(sw.ay - sw.y) + Math.abs(sw.aq - sw.q) > .4) requestAnimationFrame(p); else balancando = false;
      })();
    }
    armaFixa(0); poeArma();
    var iM = raiz.querySelector('.fps-mun-i'); iM.src = EA.url(T.municao); iM.style.width = T.municaoTam[0] * 2 + 'px'; iM.style.height = T.municaoTam[1] * 2 + 'px';
    municaoHud();
    /* 09/11: com nome, para sair ao recomeçar (antes ficava uma escuta a mais por partida) */
    function moveMira(e) {
      var r = raiz.getBoundingClientRect(), f = r.width / EA.W, mx = (e.clientX - r.left) / f, my = (e.clientY - r.top) / f;
      mira.style.left = mx + 'px'; mira.style.top = my + 'px';
      sw.ax = (mx - 640) / 640 * 16; sw.ay = (my - 360) / 360 * 9; balanca();
    }
    raiz.addEventListener('pointermove', moveMira);

    /* ---------- sangue na tela: pontos grandes, no mesmo tamanho dos 320 × 180 da sala ---------- */
    var pingos = [], pingando = false;
    function sorte(a, b) { return a + Math.random() * (b - a) }
    function bordaSangue() {
      gS.fillStyle = '#5c0810';
      for (var y = 0; y < 180; y += 2) for (var x = 0; x < 320; x += 2) {
        var d = Math.max(Math.abs(x - 160) / 160, Math.abs(y - 90) / 90);
        if (d > .78 && Math.random() < (d - .78) * 3.2) gS.fillRect(x, y, 2, 2);
      }
    }
    function mancha() {
      var e = Math.floor(sorte(0, 4)), cx = e === 0 ? sorte(12, 70) : e === 1 ? sorte(250, 308) : sorte(30, 290), cy = e === 2 ? sorte(6, 40) : e === 3 ? sorte(125, 170) : sorte(20, 150), r = sorte(13, 26), k, a, d;
      [['#7d0c16', 1], ['#a8121f', .62]].forEach(function (cam) {
        gS.fillStyle = cam[0];
        for (k = 0; k < r * r * 1.5; k++) { a = sorte(0, 6.283); d = r * cam[1] * Math.sqrt(Math.random()); gS.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), 2, 2) }
      });
      gS.fillStyle = '#a8121f';
      for (k = 0; k < 14; k++) { a = sorte(0, 6.283); d = r * sorte(1.1, 1.9); gS.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), 2, 2) }
      for (k = 0; k < 4; k++) pingos.push({ x: Math.round(cx + sorte(-r, r) * .8), y: cy + sorte(0, r * .5), v: sorte(.5, 1.5), ate: cy + sorte(25, 80), l: Math.random() < .3 ? 3 : 2 });
      escorre();
    }
    function escorre() {
      if (pingando) return;
      pingando = true;
      (function p() {
        var vivo = false;
        gS.fillStyle = '#8a0f1a';
        pingos.forEach(function (g) { if (g.y < g.ate) { g.y += g.v; gS.fillRect(g.x, Math.round(g.y), g.l, 2); vivo = true } });
        if (vivo && raiz.isConnected) requestAnimationFrame(p); else pingando = false;
      })();
    }
    function limpaSangue() { pingos = []; gS.clearRect(0, 0, 320, 180) }
    function atingido() {
      EA.Som.tocar('dano');
      flash.style.background = '#ff3b4e'; flash.animate([{ opacity: .55 }, { opacity: 0 }], { duration: 260 });
      mancha();
      treme();
    }
    function treme() { [cv, alvos, cA].forEach(function (n) { if (n !== cA || !caido) n.animate([{ translate: '-10px 5px' }, { translate: '10px -5px' }, { translate: '0 0' }], { duration: 220 }) }) }
    /* queda de verdade: o olho desce até o chão com a sala redesenhada a cada quadro, a cabeça tomba de lado e quica uma vez.
       Quem está de pé sobe na tela na mesma medida, porque o chão fica mais perto do horizonte.
       A arma desce com a animação de guardar: os pacotes não têm dano das mãos */
    var caido = false;
    function poeQueda(h, giro) {
      olho = h; pinta();
      var cobre = 1 + Math.abs(giro) * .011;
      cv.style.transform = 'rotate(' + giro + 'deg) scale(' + cobre + ')';
      alvos.style.transform = 'rotate(' + giro + 'deg) scale(' + cobre + ') translateY(' + Math.round(-234 * (1 - h)) + 'px)';
    }
    function cameraCai() {
      caido = true;
      [].forEach.call(alvos.children, function (a) { a.querySelector('button').style.visibility = 'hidden' });
      sw.aq = 460; balanca();
      var DESCE = 560, QUICA = 260, CHAO = .14, GIRO = -13, ini = performance.now(), bateu = false;
      var armaDesce = sequencia(T.arma.guarda, 70);
      var corpo = new Promise(function (fim) {
        (function p() {
          var t = performance.now() - ini, f = Math.min(1, t / DESCE), h = 1 - (1 - CHAO) * f * f, giro = GIRO * f * f;
          if (t >= DESCE) {
            if (!bateu) { bateu = true; EA.Som.tocar('baque') }
            var v = Math.min(1, (t - DESCE) / QUICA);
            h = CHAO + .07 * Math.sin(v * Math.PI); giro = GIRO * (1 + .12 * Math.sin(v * Math.PI));
            if (v >= 1 || !raiz.isConnected) { poeQueda(CHAO, GIRO); fim(); return }
          }
          poeQueda(h, giro);
          requestAnimationFrame(p);
        })();
      });
      return Promise.all([armaDesce, corpo]);
    }
    function levanta() {
      caido = false; olho = 1; pinta();
      cv.style.transform = ''; alvos.style.transform = '';
      sw.aq = 0; balanca();
    }

    /* ---------- inimigos ---------- */
    var L = T.inimigo, ESC = L.esc || 3, ia = [], geracao = 0;
    function criaAlvos(p) {
      paraIa();
      alvos.innerHTML = ''; sprites = [];
      var n = p.ops.length, passo = Math.min(300, 1180 / n), x0 = 640 - passo * (n - 1) / 2;
      p.ops.forEach(function (o, k) {
        var a = EA.el('div', 'fps-alvo'), cx = x0 + k * passo;
        a.dataset.k = k; a.style.left = cx + 'px';
        a.innerHTML = '<button class="rpg-op" tabindex="-1"><b>' + LETRAS[k] + '</b><span>' + EA.esc(o) + '</span></button><canvas style="width:' + L.w * ESC + 'px;height:' + L.h * ESC + 'px"></canvas>';
        alvos.appendChild(a);
        var s = EA.spriteLutador(a.querySelector('canvas'), L, 'parado'); s.cfg.loop = true; sprites.push(s);
        if (ctx.estatico) s.fixa(0);
        else {
          s.t0 = -k * 90 - Math.random() * 400;
          a.animate([{ transform: 'translate(-50%,40px)', opacity: 0 }, { transform: 'translate(-50%,0)', opacity: 1 }], { duration: 560, delay: k * 120, fill: 'backwards', easing: 'cubic-bezier(.3,.7,.2,1)' });
          passeia(k, geracao);
        }
      });
    }
    /* cada um decide sozinho: fica parado ou dá uns passinhos, sempre com o andar do lado para onde vai.
       A profundidade segue a perspectiva do chão: 28 pontos para trás no palco deixam o corpo 12% menor */
    function passeia(k, g) {
      var a = alvos.children[k], c = a.querySelector('canvas'), s = sprites[k], px = 0, pz = 0;
      function agenda() { ia.push(setTimeout(decide, sorte(900, 3400))) }
      function decide() {
        if (g !== geracao || !raiz.isConnected) return;
        if (Math.random() < .3) { agenda(); return }
        var anim, dur;
        if (Math.random() < .6) {
          var d = Math.random() < .5 ? -1 : 1, anda = sorte(12, 26);
          if (Math.abs(px + d * anda) > 30) d = -d;
          px += d * anda; dur = anda * 40; anim = d < 0 ? 'ladoE' : 'ladoD';
        } else {
          var novo = sorte(.35, .7) * (pz > .15 ? -1 : pz < -.15 ? 1 : Math.random() < .5 ? -1 : 1);
          novo = Math.max(-1, Math.min(1, pz + novo));
          dur = Math.abs(novo - pz) * 900; anim = novo > pz ? 'passo' : 'volta'; pz = novo;
        }
        dur = Math.round(dur);
        c.style.transition = 'transform ' + dur + 'ms linear';
        c.style.transform = 'translate(' + px + 'px,' + pz * 28 + 'px) scale(' + (1 + pz * .12) + ')';
        s.anim(anim, null, true);
        ia.push(setTimeout(function () { if (g !== geracao) return; s.anim('parado', null, true); agenda() }, dur));
      }
      agenda();
    }
    /* param onde estão: todo mundo olha para o tiro */
    function paraIa() {
      geracao++; ia.forEach(clearTimeout); ia = [];
      [].forEach.call(alvos.children, function (a, j) {
        var c = a.querySelector('canvas'), t = getComputedStyle(c).transform;
        c.style.transition = 'none'; c.style.transform = t === 'none' ? '' : t;
        if (sprites[j] && !sprites[j].morto) sprites[j].anim('parado', null, true);
      });
    }
    function folhaSolta(w, h) {
      var c = document.createElement('canvas'), g; c.width = w; c.height = h; g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      c.style.cssText = 'position:absolute;left:0;top:0;z-index:7;image-rendering:pixelated;pointer-events:none;transform-origin:50% 50%';
      raiz.appendChild(c); return { c: c, g: g };
    }
    /* arma de arremesso: a estrela sai da mão e diminui com a distância; ao chegar, toca o efeito de impacto e o inimigo é atingido */
    function lanca(k) {
      var P = T.arma.projetil;
      if (!P || ctx.estatico) return Promise.resolve();
      var img = EA.imagem(EA.url(P.caminho)), cn = alvos.children[k].querySelector('canvas'), r = raiz.getBoundingClientRect(), e = r.width / EA.W, b = cn.getBoundingClientRect();
      var xf = (b.left + b.width / 2 - r.left) / e, yf = (b.top + b.height * .55 - r.top) / e, xi = 700, yi = 610, s = folhaSolta(P.w, P.h);
      return new Promise(function (fim) {
        var ini = performance.now(), DUR = 240;
        (function p() {
          var f = Math.min(1, (performance.now() - ini) / DUR), esc = 3.2 - 2.2 * f;
          s.g.clearRect(0, 0, P.w, P.h);
          if (img.naturalWidth) s.g.drawImage(img, 0, 0);
          s.c.style.transform = 'translate(' + (xi + (xf - xi) * f - P.w / 2) + 'px,' + (yi + (yf - yi) * f - P.h / 2) + 'px) scale(' + esc + ')';
          if (f < 1 && raiz.isConnected) requestAnimationFrame(p); else { s.c.remove(); impacto(xf, yf); fim() }
        })();
      });
    }
    function impacto(cx, cy) {
      var I = T.arma.impacto; if (!I) return;
      var img = EA.imagem(EA.url(I.caminho)), s = folhaSolta(I.w, I.h), ini = performance.now();
      s.c.style.transform = 'translate(' + (cx - I.w / 2) + 'px,' + (cy - I.h / 2) + 'px) scale(2)';
      (function p() {
        var q = Math.floor((performance.now() - ini) / 55);
        if (q >= I.n || !raiz.isConnected) { s.c.remove(); return }
        s.g.clearRect(0, 0, I.w, I.h);
        if (img.naturalWidth) s.g.drawImage(img, q * I.w, 0, I.w, I.h, 0, 0, I.w, I.h);
        requestAnimationFrame(p);
      })();
    }
    function morre(k) { var s = sprites[k]; s.morto = true; return new Promise(function (fim) { s.anim('dano', function () { s.anim('morte', fim, false) }, false) }) }
    /* os que sobram correm de costas até a porta, ela abre, eles passam por ela e ela fecha atrás deles */
    function fogem(k) {
      EA.Som.tocar('passo');
      var noChao = (HOR + K * .9 / sala.fundo) * 4 / ESC3, e = 1.354 / sala.fundo;
      [].forEach.call(alvos.children, function (a, j) {
        if (j === k) return;
        var c = a.querySelector('canvas'), de = getComputedStyle(c).transform, dx = 640 - a.offsetLeft, destino = 'translate(' + dx + 'px,' + (noChao - 570) + 'px) scale(' + e + ')';
        sprites[j].anim('foge', null, true);
        a.querySelector('button').animate([{ opacity: .4 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
        c.animate([{ transform: de, opacity: 1 }, { transform: destino, opacity: 1, offset: .9 }, { transform: destino, opacity: 0 }], { duration: sorte(1350, 1650), delay: sorte(0, 140), easing: 'cubic-bezier(.35,.1,.75,.75)', fill: 'both' });
      });
      animaPorta(1, 350);
      return espera(1820).then(function () { return animaPorta(0, 380) });
    }
    /* o protagonista segue em frente: os balões somem na hora e quem ficou no chão passa por baixo da câmera */
    function ficaParaTras() {
      [].forEach.call(alvos.children, function (a, j) {
        var c = a.querySelector('canvas'), dx = (a.offsetLeft - 640) * 1.5;
        a.querySelector('button').style.visibility = 'hidden';
        if (!sprites[j].morto) { c.style.visibility = 'hidden'; return }   /* os outros já foram embora pela porta */
        /* o corpo fica na parte de baixo do quadro: precisa descer bastante para sair da imagem */
        c.animate([{ transform: getComputedStyle(c).transform }, { transform: 'translate(' + dx + 'px,560px) scale(2.6)' }], { duration: 650, easing: 'ease-in', fill: 'forwards' });
        setTimeout(function () { c.style.visibility = 'hidden' }, 640);
      });
    }
    /* todos os que sobraram atiram; cada tiro que chega deixa a sua marca */
    function fuzilam(k) {
      var quem = [], a = L.anims.ataque, dur = a.n / a.fps * 1000;
      sprites.forEach(function (s, j) { if (j !== k) quem.push(s) });
      return Promise.all(quem.map(function (s, n) {
        var d = n * sorte(90, 170);
        return espera(d).then(function () {
          s.anim('ataque', function () { s.anim('parado', null, true) }, false);
          return espera(dur * .35);
        }).then(function () { EA.Som.tocar(T.arma.som || 'tiro'); return espera(60) }).then(atingido);
      }));
    }
    function telaTentar(p) {
      return new Promise(function (fim) {
        EA.Som.tocar('derrota');
        mira.style.display = 'none'; raiz.classList.add('fim');
        var f = EA.el('div', 'rpg-fim perdeu', '<h2>Você morreu</h2><p>A mesma pergunta volta.</p><div><button class="rpg-b prim">Tentar de novo</button></div>'), b = f.querySelector('button');
        raiz.appendChild(f);
        f.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.06)', opacity: 1, offset: .7 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], { duration: 420, easing: 'steps(8)', fill: 'both' });
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          f.remove(); raiz.classList.remove('fim'); mira.style.display = '';
          limpaSangue();
          escuro.classList.remove('on');
          levanta();
          municao = CARGA; municaoHud();
          sequencia(T.arma.guarda.slice().reverse(), 70).then(function () { armaFixa(0) });
          EA.Som.tocar('surgir');
          criaAlvos(p);
          fim('repete');
        });
        b.focus();
      });
    }
    var alvosProntos = false;
    return {
      pronto: function () { return alvosProntos },
      desmonta: function () { raiz.removeEventListener('pointermove', moveMira) },
      mostra: function (i, p) {
        var avanca = i && !ctx.estatico;
        /* 09/11: enquanto anda até os próximos alvos, tecla de resposta não vale (respondia às cegas a pergunta seguinte) */
        alvosProntos = false;
        if (avanca) { ficaParaTras(); jan.style.visibility = 'hidden' }
        (avanca ? anda() : Promise.resolve()).then(function () {
          jan.style.visibility = '';
          /* 09/11: os textos do quiz são texto puro; escapados, "a < b" ou "<div>" aparecem como foram escritos */
          eP.innerHTML = EA.esc(p.p || 'Escreva a pergunta');
          eE.className = 'rpg-exp'; eE.innerHTML = ''; jan.classList.remove('resp');
          if (!municao) municao = CARGA;
          municaoHud(); criaAlvos(p); alvosProntos = true;
          if (!ctx.estatico) jan.animate([{ transform: 'translateY(-30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 240, easing: 'steps(5)' });
        });
      },
      responde: function (i, p, k) {
        var certo = k === p.certa;
        paraIa();
        /* errando, nada aponta a certa: a pergunta vai voltar */
        [].forEach.call(alvos.children, function (a, j) { delete a.dataset.k; a.querySelector('button').classList.add(j !== k ? 'apagado' : certo ? 'certa' : 'errada') });
        var tiro = atira(), bate = espera((T.arma.acerta || 0) * 70);
        if (certo) {
          EA.Som.tocar('certo');
          textoFlutua(raiz, 'Na mosca!', alvos.children[k].offsetLeft, 220, 'crit');
          return Promise.all([tiro, bate.then(function () { return lanca(k) }).then(function () { return morre(k) })]).then(function () { return fogem(k) }).then(function () {
            eE.innerHTML = '<b>Certo!</b> ' + EA.esc(p.exp || '') + '<span class="rpg-seg">Continuar ▸</span>';
            eE.className = 'rpg-exp ver'; jan.classList.add('resp');
          });
        }
        EA.Som.tocar('errado');
        return Promise.all([tiro, bate.then(function () { return lanca(k) }).then(function () { return morre(k) })]).then(function () { return espera(120) }).then(function () { bordaSangue(); return fuzilam(k) }).then(cameraCai).then(function () { escuro.classList.add('on'); return espera(650) }).then(function () { return telaTentar(p) });
      },
      fim: function (acertos, tot) {
        if (EA.Musica && q.musica) EA.Musica.parar(1.2);
        jan.style.display = 'none'; alvos.innerHTML = ''; mira.style.display = 'none';
        raiz.classList.add('fim');
        /* aqui não há derrota: só sai quem acertou todas. A nota conta as certas de primeira */
        fimJogo(raiz, q, true, acertos, tot, 'Missão cumprida!', 'Jogar de novo');
      },
      inicia3d: prepara3d
    };
  }
  /* o motor só chama mostra: a sala é preparada na hora de montar */
  EA.Quiz.MONTA.mon = montaMon;
  EA.Quiz.MONTA.fps = function (raiz, q, ctx) { var t = montaFps(raiz, q, ctx); t.inicia3d(); return t };
})();
