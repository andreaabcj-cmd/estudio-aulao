/* Base dos elementos "Interativos novos" (10/11, teste local): peças inspiradas no HyperFrames (Apache 2.0), refeitas
   do zero em HTML + CSS + um pouco de JS, sem biblioteca de fora. Cada arquivo hf_*.js registra seus elementos com
   EA.HF.elemento(chave, definicao, vida). Roda no editor e no HTML exportado.
   - definicao: igual a EA.ELEMENTOS (nome, w, h, campos, html(p, o, ctx), corRot, corPad, cores, tamTexto, fotos, rotulos, painel)
     grupo fica 'hf' sozinho. painel(c, o, F) monta campos extras no painel Design (F = ferramentas do inspetor).
   - vida(el, ctx): só na apresentação; el = o elemento com data-hf="chave". Use EA.HF.para(ev) em todo clique tratado
     (para o clique não passar o slide). Use EA.HF.vivo(el) dentro de timers para saber se o slide ainda está na tela. */
(function () {
  var EA = window.EA, esc = EA.esc;
  var HF = EA.HF = { vidas: {}, estilos: '' };
  HF.esc = esc;
  /* texto digitado no painel: sem tags, com quebra de linha */
  HF.txt = function (s) { return esc(String(s == null ? '' : s)).replace(/\n/g, '<br>') };
  /* campo simples (pr.campos): já vem guardado com &lt; e <br> pelo inspetor; editável direto no slide */
  HF.c = function (campos, k) { return '<span data-campo="' + k + '">' + (campos && campos[k] != null ? campos[k] : '') + '</span>' };
  HF.semTag = function (s) { return String(s == null ? '' : s).replace(/<br>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '\u00a0').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') }; /* 10/11: espaço digitado no slide vinha como &nbsp; */
  HF.para = function (ev) { ev.stopPropagation() };
  HF.vivo = function (el) { return el.isConnected && !el.closest('[data-saiu]') };
  /* 13/11: som é opcional e nasce desligado; só toca se a peça estiver com "Com som" (data-hf-som no slide) */
  HF.som = function (el, n) { try { var w = el && el.closest && el.closest('.ob-ui'); if (!w || w.getAttribute('data-hf-som') !== '1') return; if (EA.Som) EA.Som.tocar(n) } catch (e) { } };
  HF.css = function (t) {
    HF.estilos += t;
    var s = document.getElementById('hf-estilos');
    if (!s) { s = document.createElement('style'); s.id = 'hf-estilos'; (document.head || document.documentElement).appendChild(s) }
    s.textContent = HF.estilos;
  };
  /* 10/11: aviso de passos, igual em todos: bolinhas discretas no canto (ou "3/12" quando são muitas).
     ind = HF.passos(el); ind(feitos, total). Quando feitos === total aparece o ↺: o próximo clique recomeça a peça. */
  HF.passos = function (el, canto) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var d = document.createElement('div'); d.className = 'hf-passos' + (canto ? ' ' + canto : ''); d.style.display = 'none'; el.appendChild(d); /* 10/11: nasce escondido (peça vazia não mostra pílula solta) */
    return function (i, n) {
      if (!(n > 0)) { el._hfFim = true; d.style.display = 'none'; return }
      i = Math.max(0, Math.min(n, i));
      var fim = i >= n;
      el._hfFim = fim; /* 13/11: o clique fora do elemento só anda nele enquanto não chegou ao fim */
      /* 10/11: peça de um passo só: nada de bolinha; quando termina aparece só o ↺ */
      if (n < 2) { d.style.display = fim ? '' : 'none'; d.innerHTML = '<span class="hf-passos-r on" title="O próximo clique recomeça">↺</span>'; return }
      d.style.display = '';
      d.innerHTML = (n <= 10 ? Array.apply(null, Array(n)).map(function (x, k) { return '<i class="' + (k < i ? 'f' : '') + '"></i>' }).join('') : '<b>' + i + '/' + n + '</b>') +
        '<span class="hf-passos-r' + (fim ? ' on' : '') + '" title="O próximo clique recomeça">↺</span>';
    };
  };
  HF.css('.hf-passos{position:absolute;right:8px;bottom:-22px;display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:20px;background:rgba(15,23,42,.06);pointer-events:none;z-index:9;font:600 11px "Segoe UI",sans-serif;color:rgba(15,23,42,.55)}' +
    '.hf-passos.dentro{bottom:8px;background:rgba(15,23,42,.35);color:#fff}.hf-passos i{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.3;transition:opacity .25s,transform .25s}' +
    '.hf-passos i.f{opacity:1;transform:scale(1.15)}.hf-passos-r{width:0;overflow:hidden;opacity:0;transition:width .25s,opacity .25s;font-size:12px;line-height:1}.hf-passos-r.on{width:12px;opacity:1}');
  HF.elemento = function (k, d, vida) {
    d.grupo = 'hf';
    EA.ELEMENTOS[k] = d;
    if (vida) HF.vidas[k] = vida;
  };
  /* 10/11: lista grande ("ajuste"): mede se a lista cabe na caixa real; se não, diminui a letra aos poucos até o
     mínimo (70% do tamanho escolhido, nunca abaixo de 14 px); se ainda não couber, divide os itens em páginas.
     o = { grupos: [[itens...], ...] (itens de mesmo índice andam juntos, ex.: as duas colunas), caixas: [elementos que
     não podem transbordar] (padrão: a peça), paginar: false = só diminui a letra, min: px }.
     Devolve { fs, paginas: [[índices]...], mostra(k) }. A peça chama isto em def.cabe(el); a base roda def.cabe quando
     o elemento tem data-hf-cabe, no editor e na apresentação (antes da vida), e guarda o resultado em el._cabe. */
  function seq(a, b) { var r = []; for (var i = a; i < b; i++) r.push(i); return r }
  HF.cabe = function (el, o) {
    o = o || {};
    var caixas = o.caixas || [el], grupos = o.grupos || [], n = grupos.reduce(function (m, g) { return Math.max(m, g.length) }, 0);
    if (!el.dataset.fs0) el.dataset.fs0 = parseFloat(el.style.fontSize) || parseFloat(getComputedStyle(el).fontSize) || 16;
    var fs0 = +el.dataset.fs0, fs = fs0, min = o.min || Math.min(fs0, Math.max(14, Math.round(fs0 * .7)));
    function vis(f) { grupos.forEach(function (g) { g.forEach(function (x, i) { x.style.display = f(i) ? '' : 'none' }) }) }
    function passa() { return caixas.some(function (c) { return c.scrollHeight > c.clientHeight + 1 }) }
    var res = { fs: fs0, paginas: [seq(0, n)] };
    res.mostra = function (k) { var p = res.paginas[k] || []; vis(function (i) { return p.indexOf(i) >= 0 }) };
    var velho = el.querySelector(':scope > .hf-mais'); if (velho) velho.remove();
    el.style.fontSize = fs0 + 'px'; vis(function () { return true });
    if (!el.clientHeight) return res;
    while (passa() && fs > min) { fs = Math.max(min, fs - 1); el.style.fontSize = fs + 'px' }
    res.fs = fs;
    if (passa() && o.paginar !== false && n > 1) {
      var pg = [], s = 0, e;
      while (s < n) {
        e = s + 1;
        while (e < n) { vis(function (i) { return i >= s && i <= e }); if (passa()) break; e++ }
        pg.push(seq(s, e)); s = e;
      }
      res.paginas = pg;
    }
    res.mostra(0); el.classList.toggle('hf-paginado', res.paginas.length > 1);
    /* no editor: aviso discreto de que a lista continua na próxima página */
    if (res.paginas.length > 1 && !el.closest('.apresenta')) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var resto = n - res.paginas[0].length, d = document.createElement('div');
      d.className = 'hf-mais'; d.textContent = '+' + resto + (resto > 1 ? ' itens' : ' item') + (res.paginas.length > 2 ? ' nas próximas ' + (res.paginas.length - 1) + ' páginas' : ' na próxima página');
      el.appendChild(d);
    }
    return res;
  };
  /* troca de página na apresentação: o conteúdo sai para a esquerda, troca e entra pela direita */
  HF.folheia = function (alvos, f) {
    alvos = [].slice.call(alvos.length != null ? alvos : [alvos]);
    if (!alvos.length || !alvos[0].animate) { f(); return }
    alvos.forEach(function (a, i) {
      var s = a.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-28px)' }], { duration: 170, easing: 'ease-in', fill: 'forwards' });
      s.onfinish = function () {
        if (!i) f();
        s.cancel(); a.animate([{ opacity: 0, transform: 'translateX(28px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.3,1)' });
      };
    });
  };
  HF.css('.hf-mais{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);padding:2px 10px;border-radius:20px;background:rgba(15,23,42,.72);color:#fff;font:600 11px "Segoe UI",sans-serif;white-space:nowrap;pointer-events:none;z-index:9}');
  function ajusta(el) {
    var d = EA.ELEMENTOS[el.dataset.hf];
    if (!d || !d.cabe || !el.hasAttribute('data-hf-cabe') || el.dataset.hfOk) return;
    try { el._cabe = d.cabe(el) } catch (e) { console.error('[hf cabe ' + el.dataset.hf + ']', e) }
  }
  /* vida: liga cada peça uma vez, quando ela aparece dentro da apresentação */
  function vive(el) {
    if (el.dataset.hfOk || !el.closest('.apresenta')) return;
    el.dataset.hfOk = 1;
    var f = HF.vidas[el.dataset.hf];
    if (f) try { f(el) } catch (e) { console.error('[hf ' + el.dataset.hf + ']', e) }
  }
  function liga(el) { ajusta(el); vive(el) }
  function procura(n) { if (n.nodeType !== 1) return; if (n.matches('[data-hf]')) liga(n); n.querySelectorAll('[data-hf]').forEach(liga) }
  function comeca() { new MutationObserver(function (l) { l.forEach(function (m) { m.addedNodes.forEach(procura) }) }).observe(document.body, { childList: true, subtree: true }); procura(document.body) }
  if (document.body) comeca(); else document.addEventListener('DOMContentLoaded', comeca);
  /* fontes que chegam atrasadas mudam o tamanho do texto: mede de novo no editor (na apresentação a peça já pode estar andando) */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    [].forEach.call(document.querySelectorAll('[data-hf-cabe]'), function (el) { if (!el.closest('.apresenta')) ajusta(el) });
  });
})();
