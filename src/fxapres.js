/* Efeitos de apresentação: vetoriais, sóbrios, na cor do tema. Desenhados aqui mesmo, sem arquivo de fora. Vai no HTML exportado. */
(function () {
  var EA = window.EA;
  function svg(W, H, dentro) { return '<svg class="ob-preenche fxa" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + dentro + '</svg>' }
  /* sorteio repetível: o desenho não muda a cada vez que redesenha */
  function dado(s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280 } }
  function r(n) { return Math.round(n * 10) / 10 }
  function atraso(s) { return 'style="animation-delay:' + s + 's"' }

  function resultado(desenho) {
    return function (W, H) {
      var m = Math.min(W, H), x = (W - m) / 2, y = (H - m) / 2, e = m / 100;
      return svg(W, H, '<g transform="translate(' + r(x) + ' ' + r(y) + ') scale(' + r(e * 100) / 100 + ')"><circle class="fxa-bg" cx="50" cy="50" r="42"/><circle class="fxa-traco" pathLength="1" cx="50" cy="50" r="42" stroke-width="6" transform="rotate(-90 50 50)"/>' + desenho + '</g>');
    };
  }
  EA.FX_APRES = {
    /* ---------- destacar ---------- */
    anel: { nome: 'Anel chamando', cat: 'Destacar', w: 220, h: 220, f: function (W, H) { var m = Math.min(W, H) / 2 - 3; return svg(W, H, [0, .55, 1.1].map(function (d) { return '<circle class="fxa-anel" cx="' + W / 2 + '" cy="' + H / 2 + '" r="' + r(m) + '" stroke-width="3" ' + atraso(d) + '/>' }).join('') + '<circle class="fxa-cheio fxa-respira" cx="' + W / 2 + '" cy="' + H / 2 + '" r="' + r(m * .16) + '"/>') } },
    circulo: { nome: 'Círculo em volta', cat: 'Destacar', w: 380, h: 170, f: function (W, H) { return svg(W, H, '<ellipse class="fxa-traco" pathLength="1" cx="' + W / 2 + '" cy="' + H / 2 + '" rx="' + (W / 2 - 6) + '" ry="' + (H / 2 - 6) + '" stroke-width="5"/>') } },
    sublinha: { nome: 'Sublinhado', cat: 'Destacar', w: 420, h: 20, f: function (W, H) { return svg(W, H, '<path class="fxa-traco" pathLength="1" d="M' + H / 2 + ' ' + H / 2 + ' H' + (W - H / 2) + '" stroke-width="' + r(H * .45) + '"/>') } },
    marca: { nome: 'Marca-texto', cat: 'Destacar', w: 420, h: 60, f: function (W, H) { return svg(W, H, '<rect class="fxa-marca" width="' + W + '" height="' + H + '" rx="7"/>') } },
    moldura: { nome: 'Moldura de foco', cat: 'Destacar', w: 340, h: 220, f: function (W, H) {
      var a = Math.min(W, H) * .2, s = 5, c = [['M' + s + ' ' + a + ' V' + s + ' H' + a, '-8px', '-8px'], ['M' + (W - a) + ' ' + s + ' H' + (W - s) + ' V' + a, '8px', '-8px'], ['M' + (W - s) + ' ' + (H - a) + ' V' + (H - s) + ' H' + (W - a), '8px', '8px'], ['M' + a + ' ' + (H - s) + ' H' + s + ' V' + (H - a), '-8px', '8px']];
      return svg(W, H, c.map(function (q) { return '<path class="fxa-canto" d="' + q[0] + '" stroke-width="5" style="--dx:' + q[1] + ';--dy:' + q[2] + '"/>' }).join(''));
    } },
    holofote: { nome: 'Holofote', cat: 'Destacar', w: 1280, h: 720, html: true, f: function () { return '<div class="ob-preenche fxa-luz"></div>' } },
    seta: { nome: 'Seta apontando', cat: 'Destacar', w: 180, h: 80, f: function (W, H) { return svg(W, H, '<path class="fxa-vai fxa-linha" d="M6 ' + H / 2 + ' H' + (W - 12) + ' M' + (W - H * .42) + ' ' + H * .14 + ' L' + (W - 10) + ' ' + H / 2 + ' L' + (W - H * .42) + ' ' + H * .86 + '" stroke-width="' + r(H * .13) + '"/>') } },
    seta_curva: { nome: 'Seta que se desenha', cat: 'Destacar', w: 260, h: 180, f: function (W, H) { var fx = W - 14, fy = H * .22; return svg(W, H, '<path class="fxa-traco" pathLength="1" d="M12 ' + (H - 14) + ' C' + r(W * .2) + ' ' + r(H * .25) + ' ' + r(W * .55) + ' ' + r(H * .1) + ' ' + fx + ' ' + fy + '" stroke-width="6"/><path class="fxa-surge fxa-linha" d="M' + (fx - 26) + ' ' + (fy - 18) + ' L' + fx + ' ' + fy + ' L' + (fx - 20) + ' ' + (fy + 24) + '" stroke-width="6"/>') } },
    cursor: { nome: 'Clique do mouse', cat: 'Destacar', w: 150, h: 150, f: function (W, H) {
      var e = Math.min(W, H) / 100;
      return svg(W, H, '<g transform="scale(' + r(e * 100) / 100 + ')"><circle class="fxa-clique" cx="38" cy="36" r="30" stroke-width="3"/><circle class="fxa-clique" cx="38" cy="36" r="30" stroke-width="2" style="animation-delay:.14s"/><g class="fxa-aperta"><path d="M38 36 L38 84 L50 72 L60 94 L70 89 L60 68 L78 67 Z" fill="var(--tinta)" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/></g></g>');
    } },
    toque: { nome: 'Toque na tela', cat: 'Destacar', w: 130, h: 130, f: function (W, H) { var m = Math.min(W, H) / 2; return svg(W, H, '<circle class="fxa-clique" cx="' + W / 2 + '" cy="' + H / 2 + '" r="' + r(m - 3) + '" stroke-width="3"/><circle class="fxa-aperta fxa-toque" cx="' + W / 2 + '" cy="' + H / 2 + '" r="' + r(m * .38) + '"/>') } },

    /* ---------- resultado ---------- */
    check: { nome: 'Certo', cat: 'Resultado', w: 170, h: 170, cor: 'var(--verde)', f: resultado('<path class="fxa-traco fxa-depois" pathLength="1" d="M31 52 L45 66 L71 37" stroke-width="7"/>') },
    erro: { nome: 'Errado', cat: 'Resultado', w: 170, h: 170, cor: 'var(--vermelho)', f: resultado('<path class="fxa-traco fxa-depois" pathLength="1" d="M35 35 L65 65" stroke-width="7"/><path class="fxa-traco fxa-depois2" pathLength="1" d="M65 35 L35 65" stroke-width="7"/>') },
    alerta: { nome: 'Atenção', cat: 'Resultado', w: 170, h: 170, cor: 'var(--ambar)', f: function (W, H) { var m = Math.min(W, H), e = m / 100; return svg(W, H, '<g transform="translate(' + r((W - m) / 2) + ' ' + r((H - m) / 2) + ') scale(' + r(e * 100) / 100 + ')"><path class="fxa-traco" pathLength="1" d="M50 12 L92 86 H8 Z" stroke-width="6" stroke-linejoin="round"/><path class="fxa-surge fxa-linha" d="M50 40 V62" stroke-width="7"/><circle class="fxa-surge fxa-cheio" cx="50" cy="74" r="4.2"/></g>') } },
    selo: { nome: 'Selo aprovado', cat: 'Resultado', w: 180, h: 180, f: function (W, H) { var m = Math.min(W, H), e = m / 100; return svg(W, H, '<g transform="translate(' + r((W - m) / 2) + ' ' + r((H - m) / 2) + ') scale(' + r(e * 100) / 100 + ')"><circle class="fxa-gira fxa-linha" cx="50" cy="50" r="45" stroke-width="3" stroke-dasharray="3 7"/><circle class="fxa-cheio fxa-pop" cx="50" cy="50" r="35"/><path class="fxa-pop" d="M34 51 L46 63 L67 39" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>') } },

    /* ---------- andamento ---------- */
    spinner: { nome: 'Carregando', cat: 'Andamento', w: 120, h: 120, f: function (W, H) { var m = Math.min(W, H) / 2 - 6; return svg(W, H, '<circle class="fxa-linha" style="opacity:.16" cx="' + W / 2 + '" cy="' + H / 2 + '" r="' + r(m) + '" stroke-width="7"/><circle class="fxa-gira fxa-linha" pathLength="100" stroke-dasharray="28 72" cx="' + W / 2 + '" cy="' + H / 2 + '" r="' + r(m) + '" stroke-width="7"/>') } },
    pontos: { nome: 'Três pontinhos', cat: 'Andamento', w: 120, h: 50, f: function (W, H) { var e = r(H * .2); return svg(W, H, [.2, .5, .8].map(function (x, i) { return '<circle class="fxa-cheio fxa-pula" cx="' + r(W * x) + '" cy="' + H * .6 + '" r="' + e + '" ' + atraso(i * .16) + '/>' }).join('')) } },
    som: { nome: 'Ondas de voz', cat: 'Andamento', w: 140, h: 80, f: function (W, H) { var n = 7, b = W / (n * 2 - 1); var s = ''; for (var i = 0; i < n; i++) s += '<rect class="fxa-cheio fxa-sobe" x="' + r(i * b * 2) + '" y="0" width="' + r(b) + '" height="' + H + '" rx="' + r(b / 2) + '" ' + atraso(r(i * .11)) + '/>'; return svg(W, H, s) } },
    barra_ind: { nome: 'Barra em andamento', cat: 'Andamento', w: 420, h: 14, html: true, f: function () { return '<div class="ob-preenche fxa-trilho"><i></i></div>' } },
    conector: { nome: 'Linha ligando', cat: 'Andamento', w: 340, h: 34, f: function (W, H) { return svg(W, H, '<path class="fxa-corre fxa-linha" d="M3 ' + H / 2 + ' H' + (W - H * .6) + '" stroke-width="4" stroke-dasharray="11 11"/><path class="fxa-linha" d="M' + (W - H * .7) + ' ' + H * .12 + ' L' + (W - 4) + ' ' + H / 2 + ' L' + (W - H * .7) + ' ' + H * .88 + '" stroke-width="4"/>') } },
    viajante: { nome: 'Ponto viajando', cat: 'Andamento', w: 420, h: 30, html: true, f: function () { return '<div class="ob-preenche fxa-via"><i></i></div>' } },
    radar: { nome: 'Radar', cat: 'Andamento', w: 220, h: 220, f: function (W, H) {
      var m = Math.min(W, H), e = m / 100;
      return svg(W, H, '<g transform="translate(' + r((W - m) / 2) + ' ' + r((H - m) / 2) + ') scale(' + r(e * 100) / 100 + ')"><circle class="fxa-linha" style="opacity:.25" cx="50" cy="50" r="47" stroke-width="1.5"/><circle class="fxa-linha" style="opacity:.25" cx="50" cy="50" r="30" stroke-width="1.5"/><circle class="fxa-linha" style="opacity:.25" cx="50" cy="50" r="13" stroke-width="1.5"/><path class="fxa-gira fxa-feixe" d="M50 50 L50 3 A47 47 0 0 1 90.7 26.5 Z"/><circle class="fxa-cheio fxa-respira" cx="68" cy="30" r="3"/><circle class="fxa-cheio fxa-respira" cx="30" cy="66" r="3" style="animation-delay:.8s"/></g>');
    } },

    /* ---------- comemorar, com moderação ---------- */
    confete: { nome: 'Confete discreto', cat: 'Comemorar', w: 500, h: 360, f: function (W, H) {
      var d = dado(17), cs = ['var(--azul)', 'var(--azul)', '#5aa2f0', '#bcd8fb', 'var(--verde)', 'var(--ambar)'], s = '';
      for (var i = 0; i < 36; i++) { var x = r(d() * W), t = r(5 + d() * 8), v = r(1.8 + d() * 1.6); s += '<rect class="fxa-cai" x="' + x + '" y="-16" width="' + t + '" height="' + r(t * .55) + '" fill="' + cs[i % cs.length] + '" style="--h:' + (H + 30) + 'px;--g:' + Math.round(d() * 720 - 360) + 'deg;animation-delay:' + r(d() * 1.7) + 's;animation-duration:calc(' + v + 's / var(--vel,1))"/>' }
      return svg(W, H, s);
    } },
    brilhos: { nome: 'Brilhos', cat: 'Comemorar', w: 300, h: 220, f: function (W, H) {
      var d = dado(5), s = '';
      for (var i = 0; i < 7; i++) { var x = r(20 + d() * (W - 40)), y = r(20 + d() * (H - 40)), t = r(8 + d() * 14); s += '<path class="fxa-cheio fxa-brilho" d="M' + x + ' ' + (y - t) + ' Q' + x + ' ' + y + ' ' + (x + t) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + t) + ' Q' + x + ' ' + y + ' ' + (x - t) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - t) + ' Z" ' + atraso(r(i * .27)) + '/>' }
      return svg(W, H, s);
    } },
    raios: { nome: 'Raios saindo', cat: 'Comemorar', w: 240, h: 240, f: function (W, H) {
      var cx = W / 2, cy = H / 2, m = Math.min(W, H) / 2, s = '';
      for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6, c = Math.cos(a), n = Math.sin(a); s += '<path class="fxa-raio" pathLength="1" d="M' + r(cx + c * m * .42) + ' ' + r(cy + n * m * .42) + ' L' + r(cx + c * (m - 3)) + ' ' + r(cy + n * (m - 3)) + '" stroke-width="4"/>' }
      return svg(W, H, s);
    } },

    /* ---------- fundo ---------- */
    grade: { nome: 'Grade de pontos', cat: 'Fundo', w: 640, h: 360, f: function (W, H) {
      var s = '', cols = 14, lins = 8;
      for (var y = 0; y < lins; y++) for (var x = 0; x < cols; x++) s += '<circle class="fxa-cheio fxa-onda" cx="' + r((x + .5) * W / cols) + '" cy="' + r((y + .5) * H / lins) + '" r="2.6" ' + atraso(r((x + y) * .1)) + '/>';
      return svg(W, H, s);
    } },
    ondas: { nome: 'Ondas suaves', cat: 'Fundo', w: 1280, h: 200, html: true, f: function () {
      var d = 'M0 60 C160 10 320 110 480 60 S800 10 960 60 S1280 110 1440 60 S1760 10 1920 60 V200 H0 Z';
      return '<div class="ob-preenche fxa-mar"><svg viewBox="0 0 1920 200" preserveAspectRatio="none"><path d="' + d + '"/></svg><svg viewBox="0 0 1920 200" preserveAspectRatio="none" style="animation-duration:calc(13s / var(--vel,1));top:18%"><path d="' + d + '"/></svg></div>';
    } },
    particulas: { nome: 'Pontos subindo', cat: 'Fundo', w: 500, h: 400, f: function (W, H) {
      var d = dado(29), s = '';
      for (var i = 0; i < 24; i++) s += '<circle class="fxa-cheio fxa-ar" cx="' + r(d() * W) + '" cy="' + (H + 8) + '" r="' + r(1.5 + d() * 4) + '" style="--h:' + -(H + 20) + 'px;animation-delay:' + r(d() * 6) + 's;animation-duration:calc(' + r(4 + d() * 4) + 's / var(--vel,1))"/>';
      return svg(W, H, s);
    } },
    listras: { nome: 'Listras diagonais', cat: 'Fundo', w: 640, h: 360, html: true, f: function () { return '<div class="ob-preenche fxa-listras"></div>' } }
  };

  EA.conteudoApres = function (o, ctx) {
    var p = o.props, d = EA.FX_APRES[p.ef]; if (!d) return '';
    var rep = (ctx && ctx.estatico) || p.repetir !== false, cor = p.cor || d.cor || 'var(--azul)';
    return '<div class="ob-preenche fxa-caixa" style="color:' + cor + ';--rep:' + (rep ? 'infinite' : '1') + ';--fim:' + (rep ? 0 : 1) + ';--vel:' + (p.vel || 1) + '">' + d.f(o.w, o.h) + '</div>';
  };
})();
