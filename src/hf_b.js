/* hf_b.js (10/11, teste local): corrida de barras, estrelas de avaliação, fluxo desenhado à mão, caminho iluminado,
   texto decifrado, papel rasgado e título escrito à mão. Ideias do HyperFrames, refeitas do zero com CSS e um pouco de JS.
   No Design ficam paradinhos no estado "pronto"; na apresentação começam do zero e andam a cada clique em cima deles.
   10/11: quando a peça termina, o próximo clique nela recomeça do começo (nunca passa o slide); bolinhas no canto mostram os passos. */
(function () {
  var EA = window.EA, HF = EA.HF, esc = HF.esc, txt = HF.txt;
  var MAO = "'Caligrafia','Segoe Script',cursive"; /* 10/11: caligrafia embutida (Dancing Script, OFL), igual em qualquer computador */
  function rnd(s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }
  function r1(n) { return Math.round(n * 10) / 10 }
  function lim(v, a, b) { return Math.max(a, Math.min(b, v)) }
  /* 10/11: a faixa "Tamanho do texto" do painel mostra 20 quando não há valor; guarda o tamanho padrão da peça para ela mostrar o certo */
  function tamPadrao(o, F, v) { if (o.props.tamTexto == null) { o.props.tamTexto = v; setTimeout(F.mostra, 0) } }
  function semTag(campos, k) { return HF.semTag(campos && campos[k]) }
  /* espera a peça ficar visível (quem entra no clique nasce escondido) e chama f uma vez */
  function quandoVisivel(el, f, atraso) {
    (function olha() {
      if (!HF.vivo(el)) return;
      if (getComputedStyle(el).visibility === 'hidden') return setTimeout(olha, 120);
      setTimeout(function () { if (HF.vivo(el)) f() }, atraso || 0);
    })();
  }
  /* sem transição por um instante (para pôr o estado inicial sem animar) */
  function seco(el, f) { el.classList.add('hfb-seco'); f(); void el.offsetWidth; el.classList.remove('hfb-seco') }
  /* quebra o texto em letras (palavras não se partem); devolve a lista de letras */
  function letras(caixa, texto, cls) {
    caixa.innerHTML = '';
    var ls = [];
    String(texto).split('\n').forEach(function (lin, n) {
      if (n) caixa.appendChild(document.createElement('br'));
      lin.split(/( +)/).forEach(function (pal) {
        if (!pal) return;
        if (/^ +$/.test(pal)) { caixa.appendChild(document.createTextNode(pal)); return }
        var w = document.createElement('span'); w.className = 'hfb-pal';
        for (var i = 0; i < pal.length; i++) { var s = document.createElement('span'); s.className = cls; s.textContent = pal[i]; s.dataset.c = pal[i]; w.appendChild(s); ls.push(s) }
        caixa.appendChild(w);
      });
    });
    return ls;
  }

  HF.css(
    '.hfb-seco,.hfb-seco *{transition:none!important}' +
    '.hfb-pal{display:inline-block;white-space:nowrap}' +
    /* corrida */
    '.hfb-cr{position:relative;width:100%;height:100%;display:flex;flex-direction:column;color:var(--tinta);font-size:var(--fs);line-height:1.2}' +
    '.hfb-cr-h{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:.7em}' +
    '.hfb-cr-t{font-size:1.25em;font-weight:700;letter-spacing:-.01em}' +
    '.hfb-cr-p{text-align:right;line-height:1}.hfb-cr-p small{display:block;font-size:.62em;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--suave);margin-bottom:.2em}' +
    '.hfb-cr-p b{display:inline-block;font-size:2.3em;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.hfb-cr-p b.vira{animation:hfb-sobe .45s cubic-bezier(.2,.8,.2,1)}' +
    '.hfb-cr-c{position:relative;flex:1;min-height:0;border-left:2px solid var(--linha);margin-left:22%}' +
    '.hfb-cr-l{position:absolute;left:0;right:0;display:flex;align-items:center;transition:top .7s cubic-bezier(.45,0,.2,1)}' +
    '.hfb-cr-n{position:absolute;right:100%;padding-right:.6em;box-sizing:border-box;text-align:right;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.hfb-cr-tr{position:relative;flex:1;height:72%}' +
    '.hfb-cr-tr i{position:absolute;left:0;top:0;bottom:0;border-radius:0 7px 7px 0;background:var(--co);transition:width .7s cubic-bezier(.45,0,.2,1),background .4s}' +
    '.hfb-cr-l.lider i{background:var(--cr)}' +
    '.hfb-cr-tr b{position:absolute;top:50%;transform:translateY(-50%);padding-left:.45em;font-weight:800;white-space:nowrap;font-variant-numeric:tabular-nums;transition:left .7s cubic-bezier(.45,0,.2,1)}' +
    '@keyframes hfb-sobe{from{transform:translateY(.35em);opacity:0}to{transform:none;opacity:1}}' +
    /* estrelas */
    '.hfb-es{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35em;color:var(--tinta);font-size:var(--fs)}' +
    '.hfb-es-q{font-weight:700;text-align:center;line-height:1.2}' +
    '.hfb-es-r{flex:1;min-height:0;width:100%;display:flex;justify-content:center;align-items:stretch;gap:3%}' +
    '.hfb-es-s{position:relative;height:100%;aspect-ratio:1/1;flex:0 1 auto;cursor:pointer;transition:transform .2s}' +
    '.hfb-es-s svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}' +
    '.hfb-es-s .v path{fill:color-mix(in srgb,var(--ev) 35%,transparent);stroke:var(--ev);stroke-width:1.4;stroke-linejoin:round}' +
    '.hfb-es-f{position:absolute;inset:0;transition:clip-path .45s cubic-bezier(.3,.7,.3,1)}' +
    '.hfb-es-f path{fill:var(--ec);stroke:var(--ec);stroke-width:1.4;stroke-linejoin:round}' +
    '.apresenta .hfb-es-s:hover{transform:scale(1.1)}.hfb-es-s.pop{animation:hfb-pop .5s cubic-bezier(.3,1.6,.5,1)}' +
    '.hfb-es-n{color:var(--suave);font-size:.9em}.hfb-es-n b{color:var(--tinta);font-size:1.5em;font-weight:800;margin-right:.15em}' +
    '@keyframes hfb-pop{0%{transform:scale(1)}40%{transform:scale(1.32) rotate(-8deg)}100%{transform:scale(1)}}' +
    /* fluxo à mão */
    '.hfb-fl{position:relative;width:100%;height:100%}.hfb-fl svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}' +
    '.hfb-fl .cx{fill:none;stroke:var(--ft);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}.hfb-fl .cx.b{stroke-width:1.3;opacity:.45}' +
    '.hfb-fl .se{fill:none;stroke:var(--fc);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}' +
    '.hfb-fl-t{position:absolute;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px 10px;box-sizing:border-box;font-family:' + MAO + ';font-size:var(--fs);line-height:1.15;font-weight:600;color:var(--ft)}' +
    '.apresenta .hfb-fl .d{stroke-dasharray:1 2;stroke-dashoffset:1.01;transition:stroke-dashoffset .8s cubic-bezier(.5,0,.3,1)}.apresenta .hfb-fl .d.b{transition-delay:.35s}' +
    '.apresenta .hfb-fl .se.d{transition-duration:.55s}.apresenta .hfb-fl .d.on{stroke-dashoffset:0}' +
    '.apresenta .hfb-fl-t{opacity:0;transform:translateY(6px) rotate(-2deg);transition:opacity .4s .55s,transform .5s .55s}.apresenta .hfb-fl-t.on{opacity:1;transform:none}' +
    /* caminho iluminado */
    '.hfb-ca{position:relative;width:100%;height:100%;color:var(--tinta);font-size:var(--fs)}' +
    '.hfb-ca-tr,.hfb-ca-fx{position:absolute;border-radius:4px}.hfb-ca-tr{background:var(--linha)}' +
    '.hfb-ca-fx{background:linear-gradient(var(--dir),color-mix(in srgb,var(--cc) 10%,transparent),var(--cc));box-shadow:0 0 14px color-mix(in srgb,var(--cc) 55%,transparent);transition:width .9s cubic-bezier(.6,0,.2,1),height .9s cubic-bezier(.6,0,.2,1)}' +
    '.hfb-ca-ca{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px var(--cc),0 0 18px 6px color-mix(in srgb,var(--cc) 60%,transparent),0 0 40px 12px color-mix(in srgb,var(--cc) 25%,transparent);transition:left .9s cubic-bezier(.6,0,.2,1),top .9s cubic-bezier(.6,0,.2,1);z-index:2}' +
    '.hfb-ca-p{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:var(--cartao);border:3px solid var(--linha);box-sizing:border-box;transition:border-color .3s .5s,background .3s .5s}' +
    '.hfb-ca-p.on{border-color:var(--cc);background:var(--cc)}' +
    '.hfb-ca-r{position:absolute;line-height:1.2;opacity:.45;transition:opacity .4s .45s,color .4s .45s}.hfb-ca-r b{display:block;font-weight:700;transition:transform .4s .45s,color .4s .45s}.hfb-ca-r span{display:block;font-size:.72em;color:var(--suave);margin-top:.25em}' +
    '.hfb-ca-r.on{opacity:.85}.hfb-ca-r.agora{opacity:1}.hfb-ca-r.agora b{color:var(--cc);text-shadow:0 0 18px color-mix(in srgb,var(--cc) 35%,transparent)}' +
    '.hfb-ca.h .hfb-ca-tr,.hfb-ca.h .hfb-ca-fx{top:var(--y);height:6px;margin-top:-3px}.hfb-ca.h .hfb-ca-tr{left:var(--a);width:calc(var(--z) - var(--a))}.hfb-ca.h .hfb-ca-fx{left:var(--a);width:calc(var(--b) - var(--a))}' +
    '.hfb-ca.h .hfb-ca-p,.hfb-ca.h .hfb-ca-ca{top:var(--y)}.hfb-ca.h .hfb-ca-p{left:var(--p)}.hfb-ca.h .hfb-ca-ca{left:var(--b)}' +
    '.hfb-ca.h .hfb-ca-r{top:calc(var(--y) + 26px);left:var(--p);width:var(--lw);transform:translateX(-50%);text-align:center}.hfb-ca.h .hfb-ca-r.agora b{transform:scale(1.08)}' +
    '.hfb-ca.v .hfb-ca-tr,.hfb-ca.v .hfb-ca-fx{left:24px;width:6px;margin-left:-3px}.hfb-ca.v .hfb-ca-tr{top:var(--a);height:calc(var(--z) - var(--a))}.hfb-ca.v .hfb-ca-fx{top:var(--a);height:calc(var(--b) - var(--a))}' +
    '.hfb-ca.v .hfb-ca-p,.hfb-ca.v .hfb-ca-ca{left:24px}.hfb-ca.v .hfb-ca-p{top:var(--p)}.hfb-ca.v .hfb-ca-ca{top:var(--b)}' +
    '.hfb-ca.v .hfb-ca-r{left:56px;right:0;top:var(--p);transform:translateY(-50%)}.hfb-ca.v .hfb-ca-r b{transform-origin:left center}.hfb-ca.v .hfb-ca-r.agora b{transform:scale(1.08)}' +
    '.hfb-ca-ca.anda{animation:hfb-brilha 1.6s ease-in-out infinite}@keyframes hfb-brilha{50%{filter:brightness(1.25) saturate(1.3)}}' +
    /* texto decifrado */
    '.hfb-dc{width:100%;height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.25em;padding:14px 22px;border-radius:18px;background:var(--df);border:1px solid var(--linha);box-shadow:0 8px 24px rgba(28,43,51,.08);text-align:center;color:var(--tinta)}' +
    '.hfb-dc-d{font-size:.4em;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--suave)}' +
    '.hfb-dc-r{font-family:Consolas,"Courier New",monospace;font-weight:700;line-height:1.2;color:var(--dc)}' +
    '.hfb-dc-c{display:inline-block;transition:color .2s}.hfb-dc.mist .hfb-dc-c{color:var(--suave);opacity:.75}.hfb-dc.mist .hfb-dc-c.ok{color:var(--dc);opacity:1;animation:hfb-acha .35s ease-out}' +
    '@keyframes hfb-acha{0%{transform:translateY(-.15em) scale(1.25);text-shadow:0 0 14px var(--dc)}100%{transform:none;text-shadow:none}}' +
    /* papel rasgado */
    '.hfb-ra{position:relative;width:100%;height:100%}' +
    '.hfb-ra-b{position:absolute;inset:0;overflow:hidden;border-radius:inherit;background:var(--rf);display:flex;align-items:center;justify-content:center;text-align:center;padding:18px;box-sizing:border-box;color:var(--rt);font-weight:700;line-height:1.2}' +
    '.hfb-ra-b img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
    '.hfb-ra-m{position:absolute;inset:0;filter:drop-shadow(0 6px 10px rgba(40,30,10,.22))}' +
    '.hfb-ra-m>i,.hfb-ra-m>div{position:absolute;inset:0}.hfb-ra-m>i{background:#fffdf7}' +
    '.hfb-ra-pp{position:absolute;inset:0;background-color:var(--rp);background-image:radial-gradient(rgba(255,255,255,.18) 1px,transparent 1.5px),radial-gradient(rgba(90,60,20,.08) 1px,transparent 1.5px),linear-gradient(160deg,rgba(255,255,255,.22),rgba(0,0,0,.05));background-size:7px 7px,11px 11px,100% 100%;background-position:0 0,3px 5px,0 0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box;color:var(--rpt);font-weight:700;line-height:1.2}' +
    '.hfb-ra.ver .hfb-ra-m{opacity:.12}' +
    '.apresenta .hfb-ra:not(.foi){cursor:pointer}' +
    /* título à mão */
    '.hfb-ti{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;color:var(--tt);font-size:var(--fs);line-height:1.25}' +
    '.hfb-ti-w{position:relative;display:inline-block;max-width:100%;padding-bottom:.28em}' +
    '.hfb-ti-x{font-weight:700}.hfb-ti-x.mao{font-family:' + MAO + ';font-weight:600;letter-spacing:.01em}' +
    '.hfb-ti-u{position:absolute;left:-2%;bottom:0;width:104%;height:.32em;overflow:visible}.hfb-ti-u path{fill:none;stroke:var(--tu);stroke-width:3.2;stroke-linecap:round}' +
    '.hfb-ti-l{display:inline-block}' +
    /* 10/11: na apresentação nasce em branco já no primeiro quadro (sem depender do JS); o risco só anima ao aparecer, ao apagar some na hora */
    '.apresenta .hfb-ti:not(.vivo) .hfb-ti-x,.apresenta .hfb-ti .hfb-ti-l{opacity:0}.apresenta .hfb-ti .hfb-ti-u path{stroke-dasharray:1 2;stroke-dashoffset:1.01;transition:none}' +
    '.apresenta .hfb-ti .hfb-ti-u.on path{stroke-dashoffset:0;transition:stroke-dashoffset .7s cubic-bezier(.5,0,.3,1)}'
  );

  /* ================= 1. corrida de barras ================= */
  var TAB_PADRAO = 'Instagram: 20, 34, 48, 61\nWhatsApp: 32, 39, 44, 70\nTikTok: 4, 22, 51, 66\nSite: 26, 29, 31, 35\nE-mail: 18, 17, 15, 14';
  function dadosCorrida(p) {
    var per = semTag(p.campos, 'per').split(/[,;\n]+/).map(function (x) { return x.trim() }).filter(Boolean), nomes = [], vals = [];
    String(p.tabela == null ? TAB_PADRAO : p.tabela).split('\n').forEach(function (l) {
      var i = l.indexOf(':'); if (i < 0) return;
      var nm = l.slice(0, i).trim(), r = l.slice(i + 1), ps = r.indexOf(';') >= 0 ? r.split(';').map(function (x) { return x.replace(/\./g, '').replace(',', '.') }) : r.split(',');
      var v = ps.map(function (x) { var n = parseFloat(String(x).replace(/[^\d.\-]/g, '')); return isNaN(n) ? null : n });
      if (nm || v.length) { nomes.push(nm); vals.push(v) }
    });
    var K = Math.max(per.length, Math.max.apply(null, vals.map(function (v) { return v.length }).concat([1])));
    while (per.length < K) per.push(String(per.length + 1));
    per = per.slice(0, K);
    /* valor que falta repete o anterior */
    vals = vals.map(function (v) { var o = [], u = 0; for (var k = 0; k < K; k++) { if (v[k] != null) u = v[k]; o.push(u) } return o });
    return { nomes: nomes.slice(0, 12), vals: vals.slice(0, 12), per: per, un: semTag(p.campos, 'un').trim() };
  }
  function fmt(v, un) { return (Math.round(v * 10) / 10).toLocaleString('pt-BR') + (un ? ' ' + un : '') }
  function posCorrida(d, k) {
    var n = d.nomes.length, ord = d.nomes.map(function (x, i) { return i }).sort(function (a, b) { return d.vals[b][k] - d.vals[a][k] || a - b }), mx = Math.max.apply(null, d.vals.map(function (v) { return v[k] }).concat([1e-9])), r = [];
    ord.forEach(function (i, pos) { r[i] = { top: r1(pos * 100 / n), w: r1(Math.max(0, d.vals[i][k]) / mx * 80), lider: pos === 0 } });
    return r;
  }
  HF.elemento('hf_corrida', { nome: 'Corrida de barras', w: 640, h: 380, corRot: 'Cor de quem lidera', corPad: '#e2553f', cores: [['corOutras', 'Cor das outras barras', '#334155']], tamTexto: 1,
    campos: { t: 'Seguidores por rede', rp: 'Ano', per: '2021, 2022, 2023, 2024', un: 'mil' },
    rotulos: { t: 'Título', rp: 'Nome do período', per: 'Períodos (separe por vírgula)', un: 'Depois do número (ex.: mil, %)' },
    html: function (p) {
      var d = dadosCorrida(p), K = d.per.length, k = K - 1, n = d.nomes.length || 1, pos = posCorrida(d, k);
      return '<div class="hfb-cr" data-hf="hf_corrida" data-d="' + esc(JSON.stringify(d)) + '" data-so="' + (p.sozinho ? 1 : '') + '" data-t="' + (p.tempo || 2) + '" style="--cr:' + esc(p.cor || '#e2553f') + ';--co:' + esc(p.corOutras || '#334155') + ';--fs:' + (p.tamTexto || 18) + 'px">' +
        '<div class="hfb-cr-h"><div class="hfb-cr-t">' + HF.c(p.campos, 't') + '</div><div class="hfb-cr-p"><small>' + HF.c(p.campos, 'rp') + '</small><b>' + esc(d.per[k]) + '</b></div></div>' +
        '<div class="hfb-cr-c">' + d.nomes.map(function (nm, i) {
          var q = pos[i];
          return '<div class="hfb-cr-l' + (q.lider ? ' lider' : '') + '" style="top:' + q.top + '%;height:' + r1(100 / n) + '%"><span class="hfb-cr-n" style="width:' + r1(22 / 78 * 100) + '%">' + txt(nm) + '</span><div class="hfb-cr-tr"><i style="width:' + q.w + '%"></i><b style="left:' + q.w + '%">' + esc(fmt(d.vals[i][k], d.un)) + '</b></div></div>';
        }).join('') + '</div></div>';
    },
    painel: function (c, o, F) {
      var pr = o.props;
      tamPadrao(o, F, 18);
      c.appendChild(F.grupo('Tabela da corrida'));
      c.appendChild(F.campo('Uma linha por nome: nome: valor, valor, valor', F.area(pr.tabela == null ? TAB_PADRAO : pr.tabela, function (v) { pr.tabela = v; F.refaz() }, 'Instagram: 10, 20, 30', 6)));
      F.nota('Cada valor é um período, na ordem dos períodos lá em cima. Para número com vírgula (2,5), separe os valores com ponto e vírgula.');
      c.appendChild(F.ck('Corre sozinho na apresentação', pr.sozinho, function (v) { pr.sozinho = v; F.muda(); F.mostra() }));
      if (pr.sozinho) c.appendChild(F.faixa('Tempo de cada período', pr.tempo || 2, function (v) { pr.tempo = v; F.refaz() }, 1, 6, ' s'));
      F.nota('Na apresentação a corrida começa no primeiro período; cada clique em cima dela anda um período (as barras crescem e trocam de lugar). Depois do último, um clique recomeça do primeiro período. Correndo sozinha, ela para no fim e o clique recomeça.');
    }
  }, function (el) {
    var d = JSON.parse(el.dataset.d), K = d.per.length, k = 0, ls = [].slice.call(el.querySelectorAll('.hfb-cr-l')), pb = el.querySelector('.hfb-cr-p b'), atual = d.vals.map(function (v) { return v[0] }), conta = 0;
    function vai(k2, semAnim) {
      var pos = posCorrida(d, k2);
      ls.forEach(function (l, i) { var q = pos[i], tr = l.querySelector('i'), b = l.querySelector('b'); l.style.top = q.top + '%'; l.classList.toggle('lider', q.lider); tr.style.width = q.w + '%'; b.style.left = q.w + '%' });
      pb.textContent = d.per[k2];
      if (semAnim) { atual = d.vals.map(function (v) { return v[k2] }); ls.forEach(function (l, i) { l.querySelector('b').textContent = fmt(atual[i], d.un) }); return }
      pb.classList.remove('vira'); void pb.offsetWidth; pb.classList.add('vira');
      /* números contam até o valor novo */
      var de = atual.slice(), alvo = d.vals.map(function (v) { return v[k2] }), t0 = performance.now(), eu = ++conta;
      (function passo(t) {
        if (!HF.vivo(el) || eu !== conta) return;
        var f = Math.max(0, Math.min(1, (t - t0) / 700)), e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        atual = de.map(function (a, i) { return a + (alvo[i] - a) * e });
        ls.forEach(function (l, i) { l.querySelector('b').textContent = fmt(atual[i], d.un) });
        if (f < 1) requestAnimationFrame(passo);
      })(t0);
    }
    var ind = HF.passos(el), volta = 0, T = (+el.dataset.t || 2) * 1000;
    function anda() { if (k >= K - 1) return false; k++; vai(k); ind(k, K - 1); HF.som(el, 'passo'); return true }
    /* 10/11: correndo sozinha, para no fim; o clique recomeça (e ela volta a correr) */
    function sozinha() { var eu = ++volta; quandoVisivel(el, function laco() { if (!HF.vivo(el) || eu !== volta) return; if (anda()) setTimeout(laco, T) }, T) }
    function inicio() { k = 0; conta++; seco(el, function () { vai(0, true) }); ind(0, K - 1); if (el.dataset.so) sozinha() }
    inicio();
    el.addEventListener('click', function (ev) { HF.para(ev); if (!anda()) { inicio(); HF.som(el, 'toque') } });
  });

  /* ================= 2. estrelas de avaliação ================= */
  var ESTRELA = '<path d="M12 2.6l2.85 6.05 6.6.82-4.88 4.55 1.27 6.55L12 17.3l-5.84 3.27 1.27-6.55L2.55 9.47l6.6-.82z"/>';
  function preencheEstrelas(el, v, escalona) {
    [].forEach.call(el.querySelectorAll('.hfb-es-f'), function (f, i) {
      f.style.transitionDelay = escalona ? i * 0.13 + 's' : '0s';
      f.style.clipPath = 'inset(0 ' + r1(100 - lim(v - i, 0, 1) * 100) + '% 0 0)';
    });
    var b = el.querySelector('.hfb-es-n b'); if (b) b.textContent = String(v).replace('.', ',');
  }
  HF.elemento('hf_estrelas', { nome: 'Estrelas de avaliação', w: 460, h: 170, corRot: 'Cor das estrelas', corPad: '#f5a524', cores: [['corVazia', 'Cor da estrela vazia', '#cbd5e1']], tamTexto: 1,
    campos: { t: 'Como foi a aula de hoje?' },
    rotulos: { t: 'Pergunta (pode deixar vazio)' },
    html: function (p) {
      var n = p.n || 5, v = p.valor == null ? 4.5 : Math.min(p.valor, n), s = '';
      for (var i = 0; i < n; i++) s += '<span class="hfb-es-s" data-i="' + i + '" style="max-width:' + r1(94 / n) + '%"><svg class="v" viewBox="0 0 24 24">' + ESTRELA + '</svg><span class="hfb-es-f" style="clip-path:inset(0 ' + r1(100 - lim(v - i, 0, 1) * 100) + '% 0 0)"><svg viewBox="0 0 24 24">' + ESTRELA + '</svg></span></span>';
      return '<div class="hfb-es" data-hf="hf_estrelas" data-v="' + v + '" style="--ec:' + esc(p.cor || '#f5a524') + ';--ev:' + esc(p.corVazia || '#cbd5e1') + ';--fs:' + (p.tamTexto || 20) + 'px">' +
        (semTag(p.campos, 't').trim() ? '<div class="hfb-es-q">' + HF.c(p.campos, 't') + '</div>' : '') + '<div class="hfb-es-r">' + s + '</div>' +
        (p.numero !== false ? '<div class="hfb-es-n"><b>' + String(v).replace('.', ',') + '</b> de ' + n + '</div>' : '') + '</div>';
    },
    painel: function (c, o, F) {
      var pr = o.props, n = pr.n || 5, ops = [];
      c.appendChild(F.grupo('Estrelas'));
      c.appendChild(F.faixa('Quantas estrelas', n, function (v) { pr.n = v; if (pr.valor > v) pr.valor = v; F.refaz(); clearTimeout(pr.__t); pr.__t = setTimeout(F.mostra, 400) }, 3, 10, '')); /* 10/11: a lista de notas acompanha */
      for (var x = 0; x <= n; x += 0.5) ops.push([String(x), String(x).replace('.', ',')]);
      c.appendChild(F.campo('Nota que aparece', F.sel(String(pr.valor == null ? 4.5 : pr.valor), ops, function (v) { pr.valor = parseFloat(v); F.muda() })));
      c.appendChild(F.ck('Mostrar a nota em número', pr.numero !== false, function (v) { pr.numero = v; F.muda() }));
      F.nota('Na apresentação as estrelas começam vazias. Um clique na peça enche até a nota escolhida. Clicar numa estrela muda a nota na hora (metade esquerda da estrela = meia estrela), bom para a turma votar. Depois de cheias, um clique fora das estrelas esvazia de novo.');
    }
  }, function (el) {
    /* 10/11: o passo é encher; clicar numa estrela muda a nota ao vivo e não conta como passo */
    var encheu = false, ss = el.querySelectorAll('.hfb-es-s'), ind = HF.passos(el);
    function inicio() { encheu = false; seco(el, function () { preencheEstrelas(el, 0) }); ind(0, 1) }
    inicio();
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      var s = ev.target.closest('.hfb-es-s');
      if (s) {
        var r = s.getBoundingClientRect(), i = +s.dataset.i, v = i + ((ev.clientX - r.left) < r.width / 2 ? 0.5 : 1);
        preencheEstrelas(el, v, false);
        [].forEach.call(ss, function (x, k) { if (k <= i) { x.classList.remove('pop'); void x.offsetWidth; x.classList.add('pop') } });
        HF.som(el, 'pop'); return;
      }
      if (encheu) { inicio(); HF.som(el, 'toque'); return }
      encheu = true; ind(1, 1);
      preencheEstrelas(el, +el.dataset.v, true);
      HF.som(el, 'destaque');
    });
  });

  /* ================= 3. fluxo desenhado à mão ================= */
  var PASSOS_PADRAO = [{ t: 'Ideia' }, { t: 'Gravar' }, { t: 'Editar' }, { t: 'Publicar!' }];
  function caixaMao(x, y, w, h, s) {
    var r = Math.min(16, h / 4), J = function (k) { return r1((rnd(s * 50 + k) - .5) * 5) };
    return 'M' + r1(x + r + J(1)) + ' ' + r1(y + J(2)) +
      ' Q' + r1(x + w / 2 + J(3)) + ' ' + r1(y + J(4) - 1.5) + ' ' + r1(x + w - r + J(5)) + ' ' + r1(y + J(6)) +
      ' Q' + r1(x + w + J(7)) + ' ' + r1(y + J(8)) + ' ' + r1(x + w + J(9)) + ' ' + r1(y + r + J(10)) +
      ' Q' + r1(x + w + J(11) + 1.5) + ' ' + r1(y + h / 2 + J(12)) + ' ' + r1(x + w + J(13)) + ' ' + r1(y + h - r + J(14)) +
      ' Q' + r1(x + w + J(15)) + ' ' + r1(y + h + J(16)) + ' ' + r1(x + w - r + J(17)) + ' ' + r1(y + h + J(18)) +
      ' Q' + r1(x + w / 2 + J(19)) + ' ' + r1(y + h + J(20) + 1.5) + ' ' + r1(x + r + J(21)) + ' ' + r1(y + h + J(22)) +
      ' Q' + r1(x + J(23)) + ' ' + r1(y + h + J(24)) + ' ' + r1(x + J(25)) + ' ' + r1(y + h - r + J(26)) +
      ' Q' + r1(x + J(27) - 1.5) + ' ' + r1(y + h / 2 + J(28)) + ' ' + r1(x + J(29)) + ' ' + r1(y + r + J(30)) +
      ' Q' + r1(x + J(31)) + ' ' + r1(y + J(32)) + ' ' + r1(x + r + 14 + J(33)) + ' ' + r1(y - 2 + J(34));
  }
  function setaMao(ax, ay, bx, by, cx, cy) {
    var a = Math.atan2(by - cy, bx - cx), L = 12;
    return 'M' + r1(ax) + ' ' + r1(ay) + ' Q' + r1(cx) + ' ' + r1(cy) + ' ' + r1(bx) + ' ' + r1(by) +
      ' M' + r1(bx - L * Math.cos(a - .5)) + ' ' + r1(by - L * Math.sin(a - .5)) + ' L' + r1(bx) + ' ' + r1(by) + ' L' + r1(bx - L * Math.cos(a + .5)) + ' ' + r1(by - L * Math.sin(a + .5));
  }
  HF.elemento('hf_fluxo', { nome: 'Fluxo desenhado à mão', w: 760, h: 200, corRot: 'Cor das setas', corPad: '#f59e0b', cores: [['corTraco', 'Cor das caixas e do texto', '#1c2b33']], tamTexto: 1, campos: {},
    html: function (p, o) {
      var ps = (p.passos || PASSOS_PADRAO).filter(function (q) { return q }), n = Math.max(1, ps.length), W = (o && o.w) || 760, H = (o && o.h) || 200, em = p.direcao === 'pe', svg = '', tx = '';
      var gap, bw, bh, pad = 8;
      if (!em) { gap = lim(W * .1, 40, 110); bw = (W - pad * 2 - gap * (n - 1)) / n; bh = Math.min(H - pad * 2 - 20, Math.max(56, bw * .6)) }
      else { gap = lim(H * .12, 40, 90); bh = (H - pad * 2 - gap * (n - 1)) / n; bw = Math.min(W - pad * 2 - 40, Math.max(120, bh * 2.6)) }
      ps.forEach(function (q, i) {
        var x = em ? (W - bw) / 2 : pad + i * (bw + gap), y = em ? pad + i * (bh + gap) : (H - bh) / 2;
        if (i) {
          var px = em ? x : x - gap, py = em ? y - gap : y, seta;
          if (!em) seta = setaMao(px + 6, py + bh / 2, x - 6, y + bh / 2, px + gap / 2, py + bh / 2 - Math.min(26, bh * .35));
          else seta = setaMao(x + bw / 2, py + 6, x + bw / 2, y - 6, x + bw / 2 + Math.min(28, bw * .2), py + gap / 2);
          svg += '<path class="se d" data-k="' + i + '" pathLength="1" d="' + seta + '"/>';
        }
        svg += '<path class="cx d" data-k="' + i + '" pathLength="1" d="' + caixaMao(x, y, bw, bh, i + 1) + '"/><path class="cx b d" data-k="' + i + '" pathLength="1" d="' + caixaMao(x + 1.5, y - 1, bw - 2, bh + 1.5, i + 9) + '"/>';
        tx += '<div class="hfb-fl-t" data-k="' + i + '" style="left:' + r1(x / W * 100) + '%;top:' + r1(y / H * 100) + '%;width:' + r1(bw / W * 100) + '%;height:' + r1(bh / H * 100) + '%">' + txt(q.t) + '</div>';
      });
      return '<div class="hfb-fl" data-hf="hf_fluxo" style="--fc:' + esc(p.cor || '#f59e0b') + ';--ft:' + esc(p.corTraco || '#1c2b33') + ';--fs:' + (p.tamTexto || 30) + 'px"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + svg + '</svg>' + tx + '</div>';
    },
    painel: function (c, o, F) {
      var pr = o.props;
      if (!pr.passos) pr.passos = EA.clona(PASSOS_PADRAO);
      tamPadrao(o, F, 30);
      c.appendChild(F.campo('Direção', F.sel(pr.direcao || 'lado', [['lado', 'Deitado (da esquerda para a direita)'], ['pe', 'Em pé (de cima para baixo)']], function (v) { pr.direcao = v; F.muda() })));
      F.listaItens(c, o, pr.passos, 'Etapas', [{ k: 't', tipo: 'linha', ph: 'nome da etapa' }], function () { return { t: 'Nova etapa' } }, 'Nova etapa');
      F.nota('Na apresentação a primeira caixa se desenha sozinha; cada clique em cima do fluxo desenha a seta e a próxima caixa, como se fosse à caneta. Depois da última, um clique apaga tudo e o desenho recomeça.');
    }
  }, function (el) {
    var k = 0, n = el.querySelectorAll('.hfb-fl-t').length, ind = HF.passos(el), volta = 0;
    function mostra(i) { [].forEach.call(el.querySelectorAll('[data-k="' + i + '"]'), function (x) { x.classList.add('on') }) }
    /* 10/11: começo = tudo apagado e a primeira caixa se desenha sozinha (igual a quando o slide abre) */
    function inicio() {
      var eu = ++volta; k = 0;
      seco(el, function () { [].forEach.call(el.querySelectorAll('[data-k].on'), function (x) { x.classList.remove('on') }) });
      ind(0, n - 1);
      quandoVisivel(el, function () { if (eu === volta && k === 0) { mostra(0); HF.som(el, 'surgir') } }, 250);
    }
    inicio();
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      if (k >= n - 1) { inicio(); return }
      mostra(0); k++; mostra(k); ind(k, n - 1); HF.som(el, 'surgir');
    });
  });

  /* ================= 4. caminho iluminado ================= */
  var PONTOS_PADRAO = [{ t: 'Cadastro', d: 'Cria a conta' }, { t: 'Primeira compra', d: 'Testa o produto' }, { t: 'Volta', d: 'Compra de novo' }, { t: 'Fã', d: 'Indica para amigos' }];
  function posCaminho(n, i) { var a = n > 1 ? Math.min(12, 46 / n + 2) : 50; return n > 1 ? a + (100 - a * 2) * i / (n - 1) : 50 }
  function estadoCaminho(el, k) {
    var n = el.querySelectorAll('.hfb-ca-p').length;
    el.style.setProperty('--b', r1(posCaminho(n, k)) + '%');
    [].forEach.call(el.querySelectorAll('.hfb-ca-p'), function (x, i) { x.classList.toggle('on', i <= k) });
    [].forEach.call(el.querySelectorAll('.hfb-ca-r'), function (x, i) { x.classList.toggle('on', i <= k); x.classList.toggle('agora', i === k) });
  }
  HF.elemento('hf_caminho', { nome: 'Caminho iluminado', w: 760, h: 190, corRot: 'Cor da luz', corPad: '#7c3aed', tamTexto: 1, campos: {},
    html: function (p) {
      var ps = p.pontos || PONTOS_PADRAO, n = Math.max(1, ps.length), v = p.direcao === 'pe', k = Math.min(1, n - 1), a = r1(posCaminho(n, 0)), z = r1(posCaminho(n, n - 1));
      var h = '<div class="hfb-ca ' + (v ? 'v' : 'h') + '" data-hf="hf_caminho" style="--cc:' + esc(p.cor || '#7c3aed') + ';--fs:' + (p.tamTexto || 20) + 'px;--dir:' + (v ? '180deg' : '90deg') + ';--y:28%;--a:' + a + '%;--z:' + z + '%;--b:' + r1(posCaminho(n, k)) + '%;--lw:' + r1(Math.min(96 / n, 40)) + '%">' +
        '<i class="hfb-ca-tr"></i><i class="hfb-ca-fx"></i>';
      ps.forEach(function (q, i) {
        var st = 'style="--p:' + r1(posCaminho(n, i)) + '%"';
        h += '<i class="hfb-ca-p' + (i <= k ? ' on' : '') + '" ' + st + '></i><div class="hfb-ca-r' + (i <= k ? ' on' : '') + (i === k ? ' agora' : '') + '" ' + st + '><b>' + txt(q.t) + '</b>' + (q.d ? '<span>' + txt(q.d) + '</span>' : '') + '</div>';
      });
      return h + '<i class="hfb-ca-ca"></i></div>';
    },
    painel: function (c, o, F) {
      var pr = o.props;
      if (!pr.pontos) pr.pontos = EA.clona(PONTOS_PADRAO);
      c.appendChild(F.campo('Direção', F.sel(pr.direcao || 'lado', [['lado', 'Deitado (da esquerda para a direita)'], ['pe', 'Em pé (de cima para baixo)']], function (v) { pr.direcao = v; F.muda() })));
      F.listaItens(c, o, pr.pontos, 'Pontos do caminho', [{ k: 't', tipo: 'linha', ph: 'nome do ponto' }, { k: 'd', tipo: 'area', ph: 'texto pequeno embaixo (pode ficar vazio)' }], function () { return { t: 'Novo ponto', d: '' } }, 'Novo ponto');
      F.nota('Na apresentação a luz começa no primeiro ponto; cada clique em cima do caminho leva a luz até o próximo e acende o nome dele. Depois do último, um clique leva a luz de volta ao começo.');
    }
  }, function (el) {
    var k = 0, n = el.querySelectorAll('.hfb-ca-p').length, ca = el.querySelector('.hfb-ca-ca'), ind = HF.passos(el);
    function inicio() { k = 0; seco(el, function () { estadoCaminho(el, 0) }); ind(0, n - 1) }
    inicio();
    ca.classList.add('anda');
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      if (k >= n - 1) { inicio(); HF.som(el, 'toque'); return }
      k++; estadoCaminho(el, k); ind(k, n - 1); HF.som(el, 'destaque');
    });
  });

  /* ================= 5. texto decifrado ================= */
  var SINAIS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&$@*+?';
  HF.elemento('hf_decifra', { nome: 'Texto decifrado', w: 560, h: 180, corRot: 'Cor da resposta', corPad: '#0f766e', cores: [['fundoUi', 'Fundo do cartão', '#ffffff']], tamTexto: 1,
    campos: { d: 'A senha do dia', t: 'CLIENTE FIEL' },
    rotulos: { d: 'Texto pequeno em cima', t: 'Resposta escondida' },
    html: function (p) {
      return '<div class="hfb-dc" data-hf="hf_decifra" style="--dc:' + esc(p.cor || '#0f766e') + ';--df:' + esc(p.fundoUi || '#ffffff') + ';font-size:' + (p.tamTexto || 44) + 'px">' +
        (semTag(p.campos, 'd').trim() ? '<div class="hfb-dc-d">' + HF.c(p.campos, 'd') + '</div>' : '') + '<div class="hfb-dc-r">' + HF.c(p.campos, 't') + '</div></div>';
    },
    painel: function (c, o, F) {
      tamPadrao(o, F, 44);
      F.nota('Na apresentação a resposta aparece embaralhada, com letras trocando sem parar. Um clique em cima decifra letra por letra, da esquerda para a direita. Depois, um clique embaralha de novo.');
    }
  }, function (el) {
    var r = el.querySelector('.hfb-dc-r'), ls = letras(r, HF.semTag(r.innerHTML), 'hfb-dc-c'), fase = 0, t0 = 0, rel = null, ind = HF.passos(el);
    function sorteia(s) { s.textContent = SINAIS[Math.floor(Math.random() * SINAIS.length)] }
    function roda() {
      clearInterval(rel);
      rel = setInterval(function () {
        if (!HF.vivo(el)) { clearInterval(rel); rel = null; return }
        var agora = performance.now(), falta = 0;
        ls.forEach(function (s, i) {
          if (s.classList.contains('ok')) return;
          if (fase && agora - t0 > 260 + i * 70) { s.textContent = s.dataset.c; s.classList.add('ok'); return }
          falta++;
          if (Math.random() < (fase ? .9 : .3)) sorteia(s);
        });
        if (fase && !falta) { clearInterval(rel); rel = null; HF.som(el, 'confirma') }
      }, 55);
    }
    /* 10/11: recomeçar = embaralha de novo e volta a piscar, como quando o slide abre */
    function inicio() { fase = 0; ls.forEach(function (s) { s.classList.remove('ok'); sorteia(s) }); ind(0, 1); roda() }
    el.classList.add('mist'); inicio();
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      if (!fase) { fase = 1; t0 = performance.now(); ind(1, 1); HF.som(el, 'digitar'); return }
      if (rel) return; /* ainda decifrando */
      inicio(); HF.som(el, 'toque');
    });
  });

  /* ================= 6. papel rasgado ================= */
  function bordaRasgo(s) {
    var ps = [], n = 16;
    for (var i = 0; i <= n; i++) ps.push([r1(50 + (rnd(s + i) - .5) * 9 + (i % 2 ? 1.6 : -1.6)), r1(i * 100 / n)]);
    return ps;
  }
  function poli(pts) { return 'polygon(' + pts.map(function (q) { return q[0] + '% ' + q[1] + '%' }).join(',') + ')' }
  HF.elemento('hf_rasgo', { nome: 'Papel rasgado', w: 520, h: 320, raio: 14, fotos: [['', 'Foto escondida embaixo (opcional)']], corRot: 'Cor do papel', corPad: '#efdcb5',
    cores: [['corPapelTexto', 'Cor do texto no papel', '#6b4f2a'], ['fundoUi', 'Fundo de baixo', '#ffffff'], ['corTexto', 'Cor do texto de baixo', '#1c2b33']], tamTexto: 1,
    campos: { t: 'O que será que tem aqui?', b: 'Surpresa! 30% de desconto' },
    rotulos: { t: 'Texto no papel', b: 'Texto embaixo do papel' },
    html: function (p, o, ctx) {
      var u = EA.urlFoto(p, '', ctx), e = bordaRasgo(7), fs = p.tamTexto || 26;
      var esq = poli([[0, 0]].concat(e, [[0, 100]])), dir = poli(e.concat([[100, 100], [100, 0]]));
      var fe = poli([[0, 0]].concat(e.map(function (q) { return [r1(q[0] + .8), q[1]] }), [[0, 100]])), fd = poli(e.map(function (q) { return [r1(q[0] - .8), q[1]] }).concat([[100, 100], [100, 0]]));
      var papel = '<div class="hfb-ra-pp" style="font-size:' + fs + 'px">' + HF.c(p.campos, 't') + '</div>';
      return '<div class="hfb-ra' + (p.verBaixo ? ' ver' : '') + '" data-hf="hf_rasgo" style="--rp:' + esc(p.cor || '#efdcb5') + ';--rpt:' + esc(p.corPapelTexto || '#6b4f2a') + ';--rf:' + esc(p.fundoUi || '#ffffff') + ';--rt:' + esc(p.corTexto || '#1c2b33') + ';border-radius:inherit">' +
        '<div class="hfb-ra-b" style="font-size:' + r1(fs * 1.35) + 'px">' + (u ? '<img alt="" draggable="false" src="' + esc(u) + '">' : HF.c(p.campos, 'b')) + '</div>' +
        '<div class="hfb-ra-m e"><i style="clip-path:' + fe + '"></i><div style="clip-path:' + esq + '">' + papel + '</div></div>' +
        '<div class="hfb-ra-m d"><i style="clip-path:' + fd + '"></i><div style="clip-path:' + dir + '">' + papel + '</div></div></div>';
    },
    painel: function (c, o, F) {
      var pr = o.props;
      tamPadrao(o, F, 26);
      c.appendChild(F.ck('Ver o que está embaixo aqui no Design', pr.verBaixo, function (v) { pr.verBaixo = v; F.muda() }));
      F.nota('Embaixo do papel fica a foto escolhida acima ou, sem foto, o "Texto embaixo do papel". Na apresentação, um clique em cima rasga o papel ao meio e as duas partes caem, mostrando o que estava escondido. Outro clique põe o papel de volta.');
    }
  }, function (el) {
    var foi = false, ind = HF.passos(el), e = el.querySelector('.hfb-ra-m.e'), d = el.querySelector('.hfb-ra-m.d'), b = el.querySelector('.hfb-ra-b');
    el.classList.remove('ver');
    /* 10/11: recomeçar = o papel volta inteiro (aparece de leve) */
    function inicio(suave) {
      foi = false; el.classList.remove('foi'); ind(0, 1);
      [e, d, b].forEach(function (x) { x.getAnimations().forEach(function (a) { a.cancel() }) });
      if (suave) [e, d].forEach(function (x) { x.animate([{ opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' }) });
    }
    inicio();
    el.addEventListener('click', function (ev) {
      HF.para(ev);
      if (foi) { inicio(true); HF.som(el, 'toque'); return }
      foi = true; el.classList.add('foi'); ind(1, 1); HF.som(el, 'pagina');
      var op = { duration: 1150, easing: 'cubic-bezier(.55,0,.75,.4)', fill: 'forwards' };
      e.style.transformOrigin = '0% 100%'; d.style.transformOrigin = '100% 100%';
      e.animate([{ transform: 'none' }, { transform: 'translate(-2%,0) rotate(-2deg)', offset: .18 }, { transform: 'translate(-45%,70%) rotate(-28deg)', opacity: 0 }], op);
      d.animate([{ transform: 'none' }, { transform: 'translate(2%,-1%) rotate(2.5deg)', offset: .18 }, { transform: 'translate(45%,75%) rotate(30deg)', opacity: 0 }], op);
      b.animate([{ transform: 'scale(.97)', filter: 'brightness(.9)' }, { transform: 'none', filter: 'none' }], { duration: 700, delay: 150, easing: 'ease-out', fill: 'backwards' });
    });
  });

  /* ================= 7. título escrito à mão ================= */
  HF.elemento('hf_titulo', { nome: 'Título escrito à mão', w: 640, h: 120, corRot: 'Cor do título', corPad: '#1c2b33', cores: [['corRisco', 'Cor do risco embaixo', '#f59e0b']],
    campos: { t: 'Vamos começar!' },
    rotulos: { t: 'Título' },
    html: function (p) {
      var al = p.alinha || 'center';
      return '<div class="hfb-ti" data-hf="hf_titulo" data-q="' + (p.quando === 'clique' ? 'clique' : 'abre') + '" data-vel="' + (p.vel || 2) + '" style="--tt:' + esc(p.cor || '#1c2b33') + ';--tu:' + esc(p.corRisco || '#f59e0b') + ';--fs:' + (p.tamTexto || 64) + 'px;align-items:' + (al === 'left' ? 'flex-start' : al === 'right' ? 'flex-end' : 'center') + ';text-align:' + esc(al) + '">' +
        '<div class="hfb-ti-w"><div class="hfb-ti-x' + (p.letra === 'tema' ? '' : ' mao') + '">' + HF.c(p.campos, 't') + '</div>' +
        (p.risco !== false ? '<svg class="hfb-ti-u" viewBox="0 0 200 20" preserveAspectRatio="none"><path pathLength="1" d="M3 12 C 30 6, 55 15, 85 10 S 140 6, 165 11 S 190 12, 197 8"/></svg>' : '') + '</div></div>';
    },
    painel: function (c, o, F) {
      var pr = o.props;
      c.appendChild(F.campo('Quando escreve', F.sel(pr.quando || 'abre', [['abre', 'Sozinho, quando o slide abre'], ['clique', 'No clique em cima do título']], function (v) { pr.quando = v; F.muda() })));
      c.appendChild(F.campo('Letra', F.sel(pr.letra || 'mao', [['mao', 'De mão'], ['tema', 'A mesma dos outros textos']], function (v) { pr.letra = v; F.muda() })));
      c.appendChild(F.campo('Alinhamento', F.sel(pr.alinha || 'center', [['left', 'À esquerda'], ['center', 'No meio'], ['right', 'À direita']], function (v) { pr.alinha = v; F.muda() })));
      c.appendChild(F.faixa('Tamanho do título', pr.tamTexto || 64, function (v) { pr.tamTexto = v; F.refaz() }, 20, 130, ' px'));
      c.appendChild(F.faixa('Velocidade da caneta', pr.vel || 2, function (v) { pr.vel = v; F.refaz() }, 1, 4, ''));
      c.appendChild(F.ck('Risco embaixo do título', pr.risco !== false, function (v) { pr.risco = v; F.muda() }));
      F.nota('Na apresentação o título começa em branco: primeiro o risco embaixo se desenha e logo em seguida o título aparece letra por letra, como se alguém escrevesse com caneta. Clicar no título já escrito apaga tudo e escreve de novo, na mesma ordem.');
    }
  }, function (el) {
    /* 10/11: estado 0 = em branco, 1 = escrevendo, 2 = escrito; clique depois de escrito apaga e escreve de novo */
    var x = el.querySelector('.hfb-ti-x'), u = el.querySelector('.hfb-ti-u'), ls = letras(x, HF.semTag(x.innerHTML), 'hfb-ti-l'), estado = 0, volta = 0, passo = 110 / (+el.dataset.vel || 2), ind = HF.passos(el);
    el.classList.add('vivo'); ind(0, 1);
    /* 10/11: ordem pedida: primeiro o risco se desenha, logo em seguida o texto é escrito */
    function escreve() {
      if (estado) return; estado = 1;
      var eu = ++volta, base = u ? 600 : 0;
      if (u) u.classList.add('on');
      ls.forEach(function (s, i) {
        s.animate([{ clipPath: 'inset(-30% 100% -30% -10%)', opacity: 0, transform: 'translateY(.03em) rotate(-2deg)' }, { opacity: 1, offset: .25 }, { clipPath: 'inset(-30% -20% -30% -10%)', opacity: 1, transform: 'none' }], { duration: passo * 2.4, delay: base + i * passo, easing: 'ease-out', fill: 'both' });
      });
      setTimeout(function () { if (!HF.vivo(el) || eu !== volta) return; estado = 2; ind(1, 1) }, base + ls.length * passo + passo * 2.4);
      setTimeout(function () { if (HF.vivo(el) && eu === volta) HF.som(el, 'digitar') }, base);
    }
    function apaga() { volta++; estado = 0; ls.forEach(function (s) { s.getAnimations().forEach(function (a) { a.cancel() }) }); if (u) { u.classList.remove('on'); void u.getBoundingClientRect() } ind(0, 1) }
    el.addEventListener('click', function (ev) { HF.para(ev); if (estado === 1) return; if (estado === 2) apaga(); escreve() });
    if (el.dataset.q !== 'clique') quandoVisivel(el, escreve, 350);
  });
})();
