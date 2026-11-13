/* Gráficos e métricas animados. Os números saem dos campos do elemento: mudou o valor, o desenho muda junto. Vai no HTML exportado. */
(function () {
  var EA = window.EA;
  function c(campos, k, conta) { return '<span data-campo="' + k + '"' + (conta ? ' data-conta' : '') + '>' + (campos[k] == null ? '' : campos[k]) + '</span>' }
  function limpa(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ') }
  function lista(s) { return limpa(s).split(/[,;\n]+/).map(function (x) { return x.trim() }).filter(Boolean) }
  function nums(s) { return lista(s).map(function (x) { return parseFloat(x.replace(/[^\d.\-]/g, '')) }).filter(function (n) { return !isNaN(n) }) }
  function pct(s) { var n = parseFloat(limpa(s).replace(',', '.').replace(/[^\d.\-]/g, '')); return EA.limita(isNaN(n) ? 0 : n, 0, 100) }
  function r1(n) { return Math.round(n * 10) / 10 }
  var CORES = ['var(--azul)', '#5aa2f0', 'var(--verde)', 'var(--ambar)', 'var(--vermelho)', 'var(--suave)', '#7b61d9', '#14a3a8'];

  /* curva suave ligando os pontos */
  function curva(p) {
    var d = 'M' + r1(p[0][0]) + ' ' + r1(p[0][1]);
    for (var i = 1; i < p.length; i++) { var mx = r1((p[i - 1][0] + p[i][0]) / 2); d += ' C' + mx + ' ' + r1(p[i - 1][1]) + ' ' + mx + ' ' + r1(p[i][1]) + ' ' + r1(p[i][0]) + ' ' + r1(p[i][1]) }
    return d;
  }
  function pontos(v, W, H, mx, my) {
    var a = Math.min.apply(null, v), b = Math.max.apply(null, v), f = (b - a) || 1, n = Math.max(1, v.length - 1);
    return v.map(function (y, i) { return [mx + (W - mx * 2) * i / n, my + (H - my * 2) * (1 - (y - a) / f)] });
  }
  function linha(p, o, tom) {
    var W = (o ? o.w : 520) - 44, nm = lista(p.campos.nomes), H = (o ? o.h : 300) - 32 - 46 - (nm.length ? 22 : 0), v = nums(p.campos.dados);
    if (v.length < 2) v = [0, 1];
    var q = pontos(v, W, H, 8, 12), d = curva(q), u = q[q.length - 1], grade = '';
    for (var k = 1; k <= 3; k++) grade += '<line x1="0" x2="' + W + '" y1="' + r1(H * k / 4) + '" y2="' + r1(H * k / 4) + '" stroke="var(--linha)" stroke-width="1"/>';
    return '<div class="gr-card" style="--tom:' + (p.cor ? 'var(--azul)' : tom) + '"><div class="gr-topo">' + c(p.campos, 't') + '<b>' + c(p.campos, 'v', true) + '</b></div>' +
      '<svg class="gr-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + grade + '<path class="gr-area" d="' + d + ' L' + r1(u[0]) + ' ' + H + ' L' + r1(q[0][0]) + ' ' + H + ' Z"/><path class="gr-linha" pathLength="1" d="' + d + '"/><circle class="gr-brilho" cx="' + r1(u[0]) + '" cy="' + r1(u[1]) + '" r="11"/><circle class="gr-ponto" cx="' + r1(u[0]) + '" cy="' + r1(u[1]) + '" r="5.5"/></svg>' +
      (nm.length ? '<div class="gr-eixo">' + nm.map(function (x) { return '<span>' + EA.esc(x) + '</span>' }).join('') + '</div>' : '') + '</div>';
  }
  function fatias(v, nm) {
    v = v.map(function (x) { return Math.max(x, 0) });   // 09/11: número negativo vale zero (senão a fatia anda para trás e cobre as outras)
    var soma = v.reduce(function (a, b) { return a + b }, 0) || 1, ac = 0;
    return v.map(function (x, i) { var f = x / soma * 100, r = { p: f, ini: ac, nome: nm[i] || 'Item ' + (i + 1), cor: CORES[i % CORES.length], atraso: ac / 100 * .9 }; ac += f; return r });
  }
  function legenda(l) {
    return '<ul class="gr-leg">' + l.map(function (f) { return '<li><i style="background:' + f.cor + '"></i><span>' + EA.esc(f.nome) + '</span><b>' + Math.round(f.p) + '%</b></li>' }).join('') + '</ul>';
  }
  var G = {
    g_subida: { nome: 'Gráfico de subida', w: 520, h: 300, campos: { t: 'Vendas por mês', v: '+38%', dados: '12, 18, 15, 24, 30, 42', nomes: 'Jan, Fev, Mar, Abr, Mai, Jun' }, html: function (p, o) { return linha(p, o, 'var(--verde)') } },
    g_descida: { nome: 'Gráfico de descida', w: 520, h: 300, campos: { t: 'Custo por venda', v: '−24%', dados: '42, 36, 38, 28, 24, 18', nomes: 'Jan, Fev, Mar, Abr, Mai, Jun' }, html: function (p, o) { return linha(p, o, 'var(--vermelho)') } },
    g_barras: { nome: 'Barras', w: 520, h: 300, campos: { t: 'Resultado por trimestre', dados: '30, 45, 60, 80', nomes: 'T1, T2, T3, T4' }, html: function (p) {
      var v = nums(p.campos.dados), nm = lista(p.campos.nomes), mx = Math.max.apply(null, v.concat([1]));
      return '<div class="gr-card"><div class="gr-topo">' + c(p.campos, 't') + '</div><div class="gr-cols">' + v.map(function (x, i) { var ult = i === v.length - 1; return '<div class="gr-col"><div class="gr-tubo"><i style="height:' + r1(Math.max(x, 0) / mx * 100) /* 09/11: negativo não vira altura negativa */ + '%;animation-delay:' + i * .1 + 's;' + (ult ? '' : 'background:color-mix(in srgb,var(--azul) 42%,#fff)') + '"><b>' + x + '</b></i></div><span>' + EA.esc(nm[i] || '') + '</span></div>' }).join('') + '</div></div>';
    } },
    g_lista: { nome: 'Barras comparando', w: 520, h: 260, campos: { t: 'De onde vêm as vendas', dados: '62, 48, 27', nomes: 'Instagram, WhatsApp, Site' }, html: function (p) {
      var v = nums(p.campos.dados), nm = lista(p.campos.nomes), mx = Math.max.apply(null, v.concat([1]));
      return '<div class="gr-card"><div class="gr-topo">' + c(p.campos, 't') + '</div><div class="gr-hs">' + v.map(function (x, i) { return '<div class="gr-h"><span>' + EA.esc(nm[i] || '') + '</span><div><i style="--v:' + r1(Math.max(x, 0) / mx * 100) /* 09/11: negativo não vira largura negativa */ + '%;animation-delay:' + i * .12 + 's;background:' + CORES[i % CORES.length] + '"></i></div><b>' + x + '</b></div>' }).join('') + '</div></div>';
    } },
    g_pizza: { nome: 'Pizza', w: 460, h: 280, campos: { t: 'Divisão do orçamento', dados: '45, 30, 25', nomes: 'Anúncios, Conteúdo, Equipe' }, html: function (p) {
      var l = fatias(nums(p.campos.dados), lista(p.campos.nomes));
      return '<div class="gr-card"><div class="gr-topo">' + c(p.campos, 't') + '</div><div class="gr-pz"><svg viewBox="0 0 100 100"><g transform="rotate(-90 50 50)">' + l.map(function (f) { return '<circle class="gr-fatia" cx="50" cy="50" r="25" pathLength="100" stroke="' + f.cor + '" style="--p:' + r1(f.p) + ';stroke-dashoffset:' + r1(-f.ini) + ';animation-delay:' + r1(f.atraso) + 's"/>' }).join('') + '</g></svg>' + legenda(l) + '</div></div>';
    } },
    g_rosca: { nome: 'Rosca com valor', w: 240, h: 240, campos: { v: '72%', t: 'da meta' }, html: function (p) {
      var n = pct(p.campos.v);
      return '<div class="gr-rosca"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="gr-tr"/><circle cx="50" cy="50" r="42" pathLength="100" class="gr-arco" style="--p:' + n + '" transform="rotate(-90 50 50)"/></svg><div><b>' + c(p.campos, 'v', true) + '</b>' + c(p.campos, 't') + '</div></div>';
    } },
    g_medidor: { nome: 'Medidor', w: 320, h: 220, campos: { v: '68%', t: 'Satisfação' }, html: function (p) {
      var n = pct(p.campos.v);
      return '<div class="gr-med"><svg viewBox="0 0 100 58"><path d="M8 52 A42 42 0 0 1 92 52" class="gr-tr"/><path d="M8 52 A42 42 0 0 1 92 52" pathLength="100" class="gr-arco" style="--p:' + n + '"/><g class="gr-agulha" style="--a:' + r1(-90 + 180 * n / 100) + 'deg"><path d="M50 18 L52.2 52 H47.8 Z" fill="var(--tinta)"/></g><circle cx="50" cy="52" r="4" fill="var(--tinta)"/></svg><b>' + c(p.campos, 'v', true) + '</b>' + c(p.campos, 't') + '</div>';
    } },
    g_metrica: { nome: 'Cartão de métrica', w: 340, h: 170, campos: { t: 'Vendas no mês', n: 'R$ 48,2 mil', v: '+12%', dados: '20, 24, 22, 30, 28, 36, 42' }, html: function (p, o) {
      var W = (o ? o.w : 340) - 44, H = 46, s = nums(p.campos.dados), cai = /^\s*[-−]/.test(limpa(p.campos.v)), tom = cai ? 'var(--vermelho)' : 'var(--verde)';
      if (s.length < 2) s = [0, 1];
      var d = curva(pontos(s, W, H, 3, 5));
      return '<div class="gr-card gr-kpi" style="--tom:' + tom + '"><div class="gr-kpi-t">' + c(p.campos, 't') + '<em>' + (cai ? '↓' : '↑') + ' ' + c(p.campos, 'v') + '</em></div><b class="gr-kpi-n">' + c(p.campos, 'n', true) + '</b><svg class="gr-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path class="gr-linha" pathLength="1" d="' + d + '"/></svg></div>';
    } },
    g_funil: { nome: 'Funil', w: 460, h: 300, campos: { t: 'Do clique à compra', dados: '1000, 640, 280, 90', nomes: 'Visitas, Carrinho, Pagamento, Compra' }, html: function (p) {
      var v = nums(p.campos.dados), nm = lista(p.campos.nomes), mx = Math.max.apply(null, v.concat([1]));
      return '<div class="gr-card"><div class="gr-topo">' + c(p.campos, 't') + '</div><div class="gr-funil">' + v.map(function (x, i) { var a = Math.max(26, x / mx * 100); return '<div style="width:' + r1(a) + '%;animation-delay:' + i * .12 + 's;background:color-mix(in srgb,var(--azul) ' + (100 - i * (55 / Math.max(1, v.length - 1))) + '%,#fff)"><span>' + EA.esc(nm[i] || '') + '</span><b>' + x + '</b></div>' }).join('') + '</div></div>';
    } }
  };
  Object.keys(G).forEach(function (k) { G[k].grupo = 'graficos'; EA.ELEMENTOS[k] = G[k] });

  /* número que sobe contando quando o objeto entra na apresentação */
  EA.contaNumeros = function (raiz, atraso) {
    [].forEach.call(raiz.querySelectorAll('[data-conta]'), function (s) {
      var orig = s.textContent, m = orig.match(/^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/);
      if (!m) return;
      var alvo = parseFloat(m[2].replace(',', '.')), casas = (m[2].split(/[.,]/)[1] || '').length, sep = m[2].indexOf(',') >= 0 ? ',' : '.', t0 = null, dur = 1100, ini = (atraso || 0) * 1000;
      function pinta(v) { s.textContent = m[1] + v.toFixed(casas).replace('.', sep) + m[3] }
      pinta(0);
      (function passo(t) {
        if (t0 === null) t0 = t;
        var f = EA.limita((t - t0 - ini) / dur, 0, 1), e = 1 - Math.pow(1 - f, 3);
        if (f >= 1) { s.textContent = orig; return }
        pinta(alvo * e); requestAnimationFrame(passo);
      })(performance.now());
    });
  };
})();
