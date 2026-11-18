/* Abre apresentações do PowerPoint (.pptx) e do Google Slides (baixado como .pptx) dentro do Estúdio. 07/11/2026 (fases 1 e 2); 08/11 fase 3: tabelas, gráficos e SmartArt.
   Só no editor: não vai junto no HTML exportado. Lê o arquivo no próprio navegador (nada sai do computador).
   Regra: só cria objetos que o Estúdio já tem (texto, forma, desenho, imagem). O que não tem tradução vira uma
   caixinha cinza e entra no relatório; uma peça com problema nunca derruba o slide. */
(function () {
  var EA = window.EA;

  /* ---------- leitor de .zip (o .pptx é um zip de XMLs) ---------- */
  function abreZip(buf) {
    var u8 = new Uint8Array(buf), dv = new DataView(buf), i = u8.length - 22;
    while (i >= 0 && dv.getUint32(i, true) !== 0x06054b50) i--;
    if (i < 0) throw new Error('não é um arquivo .pptx');
    var n = dv.getUint16(i + 10, true), p = dv.getUint32(i + 16, true), ent = {}, td = new TextDecoder();
    for (var k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      var met = dv.getUint16(p + 10, true), cs = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      ent[td.decode(u8.subarray(p + 46, p + 46 + nl))] = { met: met, cs: cs, off: off };
      p += 46 + nl + el + cl;
    }
    function bytes(nome) {
      var e = ent[nome]; if (!e) return Promise.resolve(null);
      var o = e.off, ini = o + 30 + dv.getUint16(o + 26, true) + dv.getUint16(o + 28, true), d = u8.subarray(ini, ini + e.cs);
      if (e.met === 0) return Promise.resolve(d);
      return new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function (b) { return new Uint8Array(b) });
    }
    return { tem: function (n) { return !!ent[n] }, bytes: bytes, texto: function (n) { return bytes(n).then(function (b) { return b ? td.decode(b) : null }) } };
  }

  /* ---------- XML: tudo por nome local, sem se preocupar com prefixo ---------- */
  function xml(t) { return t ? new DOMParser().parseFromString(t, 'application/xml').documentElement : null }
  function fs(el, nome) { var r = []; if (el) for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === nome) r.push(c); return r }
  function f1(el, nome) { if (el) for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === nome) return c; return null }
  function cam(el) { for (var i = 1; i < arguments.length && el; i++) el = f1(el, arguments[i]); return el || null }
  function fundo(el, nome) { return el ? el.getElementsByTagNameNS('*', nome)[0] || null : null }
  function at(el, nome, pad) { var v = el && el.getAttribute(nome); return v == null ? pad : v }
  function num(el, nome, pad) { var v = el && el.getAttribute(nome); return v == null || v === '' ? pad : +v }
  function rid(el, nome) { return el ? el.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', nome) || el.getAttribute('r:' + nome) : null }
  function dir(c) { return c.slice(0, c.lastIndexOf('/') + 1) }
  function resolve(base, alvo) {
    if (!alvo) return '';                              // 09/11: relação sem destino não derruba a leitura
    if (alvo.charAt(0) === '/') return alvo.slice(1);
    var p = (dir(base) + alvo).split('/'), o = [];
    p.forEach(function (s) { if (s === '..') o.pop(); else if (s !== '.') o.push(s) });
    return o.join('/');
  }
  function relsDe(zip, parte) {
    var c = dir(parte) + '_rels/' + parte.slice(dir(parte).length) + '.rels';
    return zip.texto(c).then(function (t) {
      var m = {}, r = xml(t);
      fs(r, 'Relationship').forEach(function (e) { m[e.getAttribute('Id')] = { tipo: (e.getAttribute('Type') || '').split('/').pop(), alvo: e.getAttribute('TargetMode') === 'External' ? e.getAttribute('Target') : resolve(parte, e.getAttribute('Target')), fora: e.getAttribute('TargetMode') === 'External' } });
      /* 09/11: destino escrito com %20 e parecidos ("image%201.png"): se não existe assim no arquivo, tenta com o nome de verdade */
      for (var k in m) if (!m[k].fora && m[k].alvo && m[k].alvo.indexOf('%') >= 0 && !zip.tem(m[k].alvo)) { try { var dec = decodeURIComponent(m[k].alvo); if (zip.tem(dec)) m[k].alvo = dec } catch (e) { } }
      return m;
    });
  }
  function relTipo(rels, tipo) { for (var k in rels) if (rels[k].tipo === tipo) return rels[k]; return null }

  /* ---------- cores ---------- */
  function hexRgb(h) { var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255] }
  function rgbHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6 }
    return [h, s, l];
  }
  function hslRgb(h, s, l) {
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p }
    if (!s) return [l * 255, l * 255, l * 255];
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
  }
  function paraLin(c) { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4) }
  function deLin(v) { v = EA.limita(v, 0, 1); return 255 * (v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - .055) }
  var PRST = { black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF', yellow: 'FFFF00', gray: '808080', grey: '808080', orange: 'FFA500', purple: '800080' };
  /* el = o elemento da cor (srgbClr, schemeClr…). Devolve { c: [r,g,b], a } */
  function corDe(el, T, ph) {
    if (!el) return null;
    var base = null, n = el.localName;
    if (n === 'srgbClr') base = hexRgb(at(el, 'val', '000000'));
    else if (n === 'sysClr') base = hexRgb(at(el, 'lastClr', at(el, 'val') === 'window' ? 'FFFFFF' : '000000'));
    else if (n === 'prstClr') base = hexRgb(PRST[at(el, 'val')] || '000000');
    else if (n === 'scrgbClr') base = [num(el, 'r', 0), num(el, 'g', 0), num(el, 'b', 0)].map(function (v) { return Math.round(255 * Math.pow(v / 1e5, 1 / 2.2)) });
    else if (n === 'hslClr') base = hslRgb(num(el, 'hue', 0) / 21600000, num(el, 'sat', 0) / 1e5, num(el, 'lum', 0) / 1e5);
    else if (n === 'schemeClr') {
      var v = at(el, 'val');
      if (v === 'phClr') { if (!ph) return null; base = ph.c.slice() }
      else { v = T.mapa[v] || v; base = hexRgb(T.cores[v] || '000000') }
    } else return null;
    var a = 1;
    for (var m = el.firstElementChild; m; m = m.nextElementSibling) {
      var q = num(m, 'val', 0) / 1e5, nm = m.localName, hsl;
      if (nm === 'alpha') a = q;
      else if (nm === 'alphaMod') a *= q;
      else if (nm === 'alphaOff') a += q;
      else if (nm === 'lumMod' || nm === 'lumOff' || nm === 'satMod' || nm === 'satOff' || nm === 'hueOff' || nm === 'hueMod') {
        hsl = rgbHsl(base[0], base[1], base[2]);
        if (nm === 'lumMod') hsl[2] *= q; else if (nm === 'lumOff') hsl[2] += q; else if (nm === 'satMod') hsl[1] *= q; else if (nm === 'satOff') hsl[1] += q;
        else if (nm === 'hueOff') hsl[0] += num(m, 'val', 0) / 21600000; else hsl[0] *= q;
        hsl[1] = EA.limita(hsl[1], 0, 1); hsl[2] = EA.limita(hsl[2], 0, 1); hsl[0] = (hsl[0] % 1 + 1) % 1;
        base = hslRgb(hsl[0], hsl[1], hsl[2]);
      }
      /* clarear (tint) e escurecer (shade): o PowerPoint faz na luz "linear", não direto no número da cor (08/11, comparado com a tabela exportada) */
      else if (nm === 'tint') base = base.map(function (c) { return deLin(1 - (1 - paraLin(c)) * q) });
      else if (nm === 'shade') base = base.map(function (c) { return deLin(paraLin(c) * q) });
      else if (nm === 'inv') base = base.map(function (c) { return 255 - c });
      else if (nm === 'gray') { var g = .3 * base[0] + .59 * base[1] + .11 * base[2]; base = [g, g, g] }
    }
    return { c: base.map(function (c) { return EA.limita(Math.round(c), 0, 255) }), a: EA.limita(a, 0, 1) };
  }
  function css(k) { if (!k) return ''; var h = '#' + k.c.map(function (c) { return (c < 16 ? '0' : '') + c.toString(16) }).join(''); return k.a >= .999 ? h : 'rgba(' + k.c.join(',') + ',' + (Math.round(k.a * 1000) / 1000) + ')' }
  function corFilha(el, T, ph) { if (!el) return null; for (var c = el.firstElementChild; c; c = c.nextElementSibling) { var k = corDe(c, T, ph); if (k) return k } return null }

  /* preenchimento de uma forma: { tipo: 'cor'|'grad'|'img'|'nada', … } ou null (não disse nada) */
  function preenchimento(spPr, T, ph) {
    if (!spPr) return null;
    for (var c = spPr.firstElementChild; c; c = c.nextElementSibling) {
      var n = c.localName;
      if (n === 'noFill') return { tipo: 'nada' };
      if (n === 'solidFill') return { tipo: 'cor', cor: corFilha(c, T, ph) };
      if (n === 'pattFill') return { tipo: 'cor', cor: corFilha(f1(c, 'fgClr'), T, ph) };
      if (n === 'grpFill') return { tipo: 'grupo' };
      if (n === 'gradFill') {
        var gs = fs(f1(c, 'gsLst'), 'gs').map(function (g) { return { pos: num(g, 'pos', 0), cor: corFilha(g, T, ph) } }).sort(function (a, b) { return a.pos - b.pos });
        if (!gs.length) return null;
        var lin = f1(c, 'lin'), ang = lin ? num(lin, 'ang', 0) / 60000 : 90;
        return { tipo: 'grad', cor: gs[0].cor, cor2: gs[gs.length - 1].cor, ang: Math.round(ang + 90) % 360, radial: !!f1(c, 'path') };
      }
      if (n === 'blipFill') return { tipo: 'img', blip: f1(c, 'blip'), rect: f1(c, 'srcRect') };
    }
    return null;
  }

  /* ---------- formas: caminhos SVG das formas prontas do PowerPoint ---------- */
  function aj(geo, nome, pad) {
    var g = fs(f1(geo, 'avLst'), 'gd').filter(function (x) { return x.getAttribute('name') === nome })[0];
    if (!g) return pad;
    var m = /val\s+(-?\d+)/.exec(g.getAttribute('fmla') || '');
    return m ? +m[1] : pad;
  }
  function r1(n) { return Math.round(n * 10) / 10 }
  function poli(pts) { return 'M' + pts.map(function (p) { return r1(p[0]) + ' ' + r1(p[1]) }).join(' L') + ' Z' }
  function elip(cx, cy, rx, ry) { return 'M' + r1(cx - rx) + ' ' + r1(cy) + ' A' + r1(rx) + ' ' + r1(ry) + ' 0 1 1 ' + r1(cx + rx) + ' ' + r1(cy) + ' A' + r1(rx) + ' ' + r1(ry) + ' 0 1 1 ' + r1(cx - rx) + ' ' + r1(cy) + ' Z' }
  function cantos(w, h, tl, tr, br, bl) {
    var A = function (r, x, y) { return r ? ' A' + r1(r) + ' ' + r1(r) + ' 0 0 1 ' + r1(x) + ' ' + r1(y) : ' L' + r1(x) + ' ' + r1(y) };
    return 'M' + r1(tl) + ' 0 L' + r1(w - tr) + ' 0' + A(tr, w, tr) + ' L' + r1(w) + ' ' + r1(h - br) + A(br, w - br, h) + ' L' + r1(bl) + ' ' + r1(h) + A(bl, 0, h - bl) + ' L0 ' + r1(tl) + A(tl, tl, 0) + ' Z';
  }
  function chanfros(w, h, tl, tr, br, bl) { return poli([[tl, 0], [w - tr, 0], [w, tr], [w, h - br], [w - br, h], [bl, h], [0, h - bl], [0, tl]]) }
  function balao(w, h, geo, corpo) {
    var tx = w / 2 + w * aj(geo, 'adj1', -20833) / 1e5, ty = h / 2 + h * aj(geo, 'adj2', 62500) / 1e5, b = Math.min(w, h) * .14;
    var dx = tx < 0 ? -tx : tx > w ? tx - w : 0, dy = ty < 0 ? -ty : ty > h ? ty - h : 0, cauda;
    if (dy >= dx && ty > h) { var c = EA.limita(tx, b, w - b); cauda = [[c - b / 2, h - 1], [tx, ty], [c + b / 2, h - 1]] }
    else if (dy >= dx && ty < 0) { c = EA.limita(tx, b, w - b); cauda = [[c - b / 2, 1], [tx, ty], [c + b / 2, 1]] }
    else if (tx > w) { c = EA.limita(ty, b, h - b); cauda = [[w - 1, c - b / 2], [tx, ty], [w - 1, c + b / 2]] }
    else if (tx < 0) { c = EA.limita(ty, b, h - b); cauda = [[1, c - b / 2], [tx, ty], [1, c + b / 2]] }
    return corpo + (cauda ? ' ' + poli(cauda) : '');
  }
  function arcoBloco(w, h, geo) {
    var st = aj(geo, 'adj1', 10800000) / 60000, fim = aj(geo, 'adj2', 0) / 60000, dr = Math.min(w, h) * aj(geo, 'adj3', 25000) / 1e5;
    var sw = ((fim - st) % 360 + 360) % 360 || 360, rx = w / 2, ry = h / 2, ix = Math.max(rx - dr, 0), iy = Math.max(ry - dr, 0), g = Math.PI / 180;
    var pt = function (a, x, y) { return r1(w / 2 + x * Math.cos(a * g)) + ' ' + r1(h / 2 + y * Math.sin(a * g)) }, lg = sw > 180 ? 1 : 0;
    return 'M' + pt(st, rx, ry) + ' A' + r1(rx) + ' ' + r1(ry) + ' 0 ' + lg + ' 1 ' + pt(st + sw, rx, ry) + ' L' + pt(st + sw, ix, iy) + ' A' + r1(ix) + ' ' + r1(iy) + ' 0 ' + lg + ' 0 ' + pt(st, ix, iy) + ' Z';
  }
  /* devolve { d, regra } em pixels da própria forma (w × h) ou null */
  function caminhoPronto(prst, w, h, geo) {
    var ss = Math.min(w, h), a = function (n, p) { return aj(geo, n, p) }, x, y, d;
    switch (prst) {
      case 'rect': case 'flowChartProcess': return { d: poli([[0, 0], [w, 0], [w, h], [0, h]]) };
      case 'roundRect': d = ss * a('adj', 16667) / 1e5; return { d: cantos(w, h, d, d, d, d) };
      case 'flowChartAlternateProcess': d = ss / 6; return { d: cantos(w, h, d, d, d, d) };
      case 'ellipse': case 'flowChartConnector': return { d: elip(w / 2, h / 2, w / 2, h / 2) };
      case 'triangle': x = w * a('adj', 50000) / 1e5; return { d: poli([[x, 0], [w, h], [0, h]]) };
      case 'rtTriangle': return { d: poli([[0, 0], [w, h], [0, h]]) };
      case 'diamond': case 'flowChartDecision': return { d: poli([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]) };
      case 'parallelogram': case 'flowChartInputOutput': x = ss * a('adj', 25000) / 1e5; return { d: poli([[x, 0], [w, 0], [w - x, h], [0, h]]) };
      case 'trapezoid': x = ss * a('adj', 25000) / 1e5; return { d: poli([[0, h], [x, 0], [w - x, 0], [w, h]]) };
      case 'homePlate': x = ss * a('adj', 50000) / 1e5; return { d: poli([[0, 0], [w - x, 0], [w, h / 2], [w - x, h], [0, h]]) };
      case 'chevron': x = ss * a('adj', 50000) / 1e5; return { d: poli([[0, 0], [w - x, 0], [w, h / 2], [w - x, h], [0, h], [x, h / 2]]) };
      case 'pentagon': return { d: poli([[w / 2, 0], [w, h * .38], [w * .81, h], [w * .19, h], [0, h * .38]]) };
      case 'hexagon': x = ss * a('adj', 25000) / 1e5; return { d: poli([[x, 0], [w - x, 0], [w, h / 2], [w - x, h], [x, h], [0, h / 2]]) };
      case 'octagon': x = ss * a('adj', 29289) / 1e5; return { d: poli([[x, 0], [w - x, 0], [w, x], [w, h - x], [w - x, h], [x, h], [0, h - x], [0, x]]) };
      case 'plus': x = ss * a('adj', 25000) / 1e5; return { d: poli([[x, 0], [w - x, 0], [w - x, x], [w, x], [w, h - x], [w - x, h - x], [w - x, h], [x, h], [x, h - x], [0, h - x], [0, x], [x, x]]) };
      case 'star5': case 'heart':
        return { d: poli(EA.FORMA_PONTOS[prst === 'star5' ? 'estrela' : 'coracao'].map(function (p) { return [p[0] * w / 100, p[1] * h / 100] })) };
      case 'rightArrow': case 'leftArrow':
        y = h * a('adj1', 50000) / 2e5; x = ss * a('adj2', 50000) / 1e5;
        var pts = [[0, h / 2 - y], [w - x, h / 2 - y], [w - x, 0], [w, h / 2], [w - x, h], [w - x, h / 2 + y], [0, h / 2 + y]];
        return { d: poli(prst === 'leftArrow' ? pts.map(function (p) { return [w - p[0], p[1]] }) : pts) };
      case 'upArrow': case 'downArrow':
        x = w * a('adj1', 50000) / 2e5; y = ss * a('adj2', 50000) / 1e5;
        pts = [[w / 2 - x, h], [w / 2 - x, y], [0, y], [w / 2, 0], [w, y], [w / 2 + x, y], [w / 2 + x, h]];
        return { d: poli(prst === 'downArrow' ? pts.map(function (p) { return [p[0], h - p[1]] }) : pts) };
      case 'leftRightArrow':
        y = h * a('adj1', 50000) / 2e5; x = ss * a('adj2', 50000) / 1e5;
        return { d: poli([[0, h / 2], [x, 0], [x, h / 2 - y], [w - x, h / 2 - y], [w - x, 0], [w, h / 2], [w - x, h], [w - x, h / 2 + y], [x, h / 2 + y], [x, h]]) };
      case 'snip1Rect': d = ss * a('adj', 16667) / 1e5; return { d: chanfros(w, h, 0, d, 0, 0) };
      case 'snip2SameRect': x = ss * a('adj1', 16667) / 1e5; y = ss * a('adj2', 0) / 1e5; return { d: chanfros(w, h, x, x, y, y) };
      case 'snip2DiagRect': x = ss * a('adj1', 0) / 1e5; y = ss * a('adj2', 16667) / 1e5; return { d: chanfros(w, h, x, y, x, y) };
      case 'round1Rect': d = ss * a('adj', 16667) / 1e5; return { d: cantos(w, h, 0, d, 0, 0) };
      case 'round2SameRect': x = ss * a('adj1', 16667) / 1e5; y = ss * a('adj2', 0) / 1e5; return { d: cantos(w, h, x, x, y, y) };
      case 'round2DiagRect': x = ss * a('adj1', 16667) / 1e5; y = ss * a('adj2', 0) / 1e5; return { d: cantos(w, h, x, y, x, y) };
      case 'diagStripe': x = w * a('adj', 50000) / 1e5; y = h * a('adj', 50000) / 1e5; return { d: poli([[0, y], [x, 0], [w, 0], [0, h]]) };
      case 'halfFrame':
        y = ss * a('adj1', 33333) / 1e5; x = ss * a('adj2', 33333) / 1e5;
        return { d: poli([[0, 0], [w, 0], [w - w * y / h, y], [x, y], [x, h - h * x / w], [0, h]]) };
      case 'frame': d = ss * a('adj1', 12500) / 1e5; return { d: poli([[0, 0], [w, 0], [w, h], [0, h]]) + ' ' + poli([[d, d], [d, h - d], [w - d, h - d], [w - d, d]]), regra: 'evenodd' };
      case 'donut': d = ss * a('adj', 25000) / 1e5; return { d: elip(w / 2, h / 2, w / 2, h / 2) + ' ' + elip(w / 2, h / 2, Math.max(w / 2 - d, 0), Math.max(h / 2 - d, 0)), regra: 'evenodd' };
      case 'blockArc': return { d: arcoBloco(w, h, geo) };
      case 'uturnArrow': {   /* seta em U: perna esquerda sobe, faz a curva e desce com a ponta (aproximada) */
        var th = ss * a('adj1', 25000) / 1e5, hw = ss * a('adj2', 25000) / 1e5, hl = ss * a('adj3', 25000) / 1e5, R = Math.max(ss * a('adj4', 43750) / 1e5, th), ri = Math.max(R - th, 0);
        var xc = w - hw, xr = xc + th / 2, xl = xc - th / 2, tip = h * a('adj5', 75000) / 1e5, yb = tip - hl;
        return { d: 'M0 ' + r1(h) + ' L0 ' + r1(R) + ' A' + r1(R) + ' ' + r1(R) + ' 0 0 1 ' + r1(R) + ' 0 L' + r1(xr - R) + ' 0 A' + r1(R) + ' ' + r1(R) + ' 0 0 1 ' + r1(xr) + ' ' + r1(R) + ' L' + r1(xr) + ' ' + r1(yb) + ' L' + r1(w) + ' ' + r1(yb) + ' L' + r1(xc) + ' ' + r1(tip) + ' L' + r1(xc - hw) + ' ' + r1(yb) + ' L' + r1(xl) + ' ' + r1(yb) + ' L' + r1(xl) + ' ' + r1(th + ri) + (ri ? ' A' + r1(ri) + ' ' + r1(ri) + ' 0 0 0 ' + r1(xl - ri) + ' ' + r1(th) : '') + ' L' + r1(th + ri) + ' ' + r1(th) + (ri ? ' A' + r1(ri) + ' ' + r1(ri) + ' 0 0 0 ' + r1(th) + ' ' + r1(th + ri) : '') + ' L' + r1(th) + ' ' + r1(h) + ' Z' };
      }
      case 'wedgeRectCallout': return { d: balao(w, h, geo, poli([[0, 0], [w, 0], [w, h], [0, h]])) };
      case 'wedgeRoundRectCallout': d = ss * a('adj3', 16667) / 1e5; return { d: balao(w, h, geo, cantos(w, h, d, d, d, d)) };
      case 'wedgeEllipseCallout': return { d: balao(w, h, geo, elip(w / 2, h / 2, w / 2, h / 2)) };
    }
    return null;
  }
  var LINHAS = { line: 1, straightConnector1: 1, bentConnector2: 1, bentConnector3: 1, bentConnector4: 1, curvedConnector3: 1 };
  function caminhoLinha(prst, w, h, geo) {
    if (prst === 'bentConnector3') { var x = w * aj(geo, 'adj1', 50000) / 1e5; return [[0, 0], [x, 0], [x, h], [w, h]] }
    if (prst === 'bentConnector2') return [[0, 0], [w, 0], [w, h]];
    return [[0, 0], [w, h]];
  }

  /* forma livre (custGeom) → caminho SVG nas medidas da forma */
  /* 09/11: guias com fórmula (a:avLst e a:gdLst) de uma forma livre, calculadas nas medidas da forma (W × H); ângulos em 60000 avos de grau */
  function guiasDe(geo, W, H) {
    var ss = Math.min(W, H), G = { w: W, h: H, r: W, b: H, l: 0, t: 0, hc: W / 2, vc: H / 2, wd2: W / 2, hd2: H / 2, wd4: W / 4, hd4: H / 4, wd8: W / 8, hd8: H / 8, ss: ss, ls: Math.max(W, H), ssd2: ss / 2, ssd4: ss / 4, ssd8: ss / 8, cd2: 10800000, cd4: 5400000, cd8: 2700000, '3cd4': 16200000, '3cd8': 8100000, '5cd8': 13500000, '7cd8': 18900000 };
    var val = function (s) { return s == null ? 0 : /^-?\d+(\.\d+)?$/.test(s) ? +s : G[s] != null ? G[s] : 0 }, rad = Math.PI / 10800000;
    ['avLst', 'gdLst'].forEach(function (l) {
      fs(f1(geo, l), 'gd').forEach(function (e) {
        var p = (e.getAttribute('fmla') || '').trim().split(/\s+/), a = val(p[1]), b = val(p[2]), c = val(p[3]), r = 0;
        switch (p[0]) {
          case 'val': r = a; break;
          case '*/': r = a * b / c; break;
          case '+-': r = a + b - c; break;
          case '+/': r = (a + b) / c; break;
          case '?:': r = a > 0 ? b : c; break;
          case 'abs': r = Math.abs(a); break;
          case 'max': r = Math.max(a, b); break;
          case 'min': r = Math.min(a, b); break;
          case 'sqrt': r = Math.sqrt(a); break;
          case 'mod': r = Math.sqrt(a * a + b * b + c * c); break;
          case 'pin': r = b < a ? a : b > c ? c : b; break;
          case 'sin': r = a * Math.sin(b * rad); break;
          case 'cos': r = a * Math.cos(b * rad); break;
          case 'tan': r = a * Math.tan(b * rad); break;
          case 'at2': r = Math.atan2(b, a) / rad; break;
          case 'cat2': r = a * Math.cos(Math.atan2(c, b)); break;
          case 'sat2': r = a * Math.sin(Math.atan2(c, b)); break;
        }
        var nm = e.getAttribute('name'); if (nm) G[nm] = isFinite(r) ? r : 0;
      });
    });
    return G;
  }
  function caminhoLivre(geo, w, h, wEmu, hEmu) {
    var saida = [], g = { w: w, h: h, r: w, b: h, l: 0, t: 0, hc: w / 2, vc: h / 2, wd2: w / 2, hd2: h / 2, ss: Math.min(w, h) }, G = null;
    var guia = function (s) { if (!G) G = guiasDe(geo, wEmu || w, hEmu || h); return G[s] };
    fs(f1(geo, 'pathLst'), 'path').forEach(function (p) {
      /* caminho sem tamanho próprio (comum no SmartArt): as medidas dele são as da forma, em EMU */
      var pw = num(p, 'w', 0) || wEmu || w, ph = num(p, 'h', 0) || hEmu || h, sx = w / pw, sy = h / ph, d = [], cx = 0, cy = 0;
      /* 09/11: medida que aponta para uma guia com fórmula (antes virava 0 e a forma desabava para o canto) */
      var v = function (s, eixo) { if (s == null) return 0; if (/^-?\d+(\.\d+)?$/.test(s)) return +s * (eixo === 'x' ? sx : sy); if (g[s] != null) return g[s]; var q = guia(s); return q != null ? q * (eixo === 'x' ? sx : sy) : 0 };
      var angulo = function (s) { if (s == null || s === '') return 0; var q = /^-?\d+(\.\d+)?$/.test(s) ? +s : guia(s); return (+q || 0) / 60000 * Math.PI / 180 };
      var P = function (pt) { return [v(pt.getAttribute('x'), 'x'), v(pt.getAttribute('y'), 'y')] };
      for (var c = p.firstElementChild; c; c = c.nextElementSibling) {
        var n = c.localName, q;
        /* 09/11: trecho sem ponto é pulado, em vez de perder a forma inteira */
        if (n === 'moveTo' || n === 'lnTo') { var pt1 = f1(c, 'pt'); if (!pt1) continue; q = P(pt1); d.push((n === 'moveTo' ? 'M' : 'L') + r1(q[0]) + ' ' + r1(q[1])); cx = q[0]; cy = q[1] }
        else if (n === 'cubicBezTo' || n === 'quadBezTo') { var ps = fs(c, 'pt').map(P); if (ps.length < (n === 'cubicBezTo' ? 3 : 2)) continue; d.push((n === 'cubicBezTo' ? 'C' : 'Q') + ps.map(function (z) { return r1(z[0]) + ' ' + r1(z[1]) }).join(' ')); cx = ps[ps.length - 1][0]; cy = ps[ps.length - 1][1] }
        else if (n === 'arcTo') {
          var wr = v(c.getAttribute('wR'), 'x'), hr = v(c.getAttribute('hR'), 'y'), st = angulo(c.getAttribute('stAng')), sw = angulo(c.getAttribute('swAng'));
          var ox = cx - wr * Math.cos(st), oy = cy - hr * Math.sin(st), partes = Math.abs(sw) > Math.PI * 1.9 ? 2 : 1;
          for (var k = 1; k <= partes; k++) {
            var e = st + sw * k / partes, ex = ox + wr * Math.cos(e), ey = oy + hr * Math.sin(e);
            d.push('A' + r1(wr) + ' ' + r1(hr) + ' 0 ' + (Math.abs(sw / partes) > Math.PI ? 1 : 0) + ' ' + (sw > 0 ? 1 : 0) + ' ' + r1(ex) + ' ' + r1(ey));
            cx = ex; cy = ey;
          }
        }
        else if (n === 'close') d.push('Z');
      }
      if (d.length) saida.push({ d: d.join(' '), semFundo: p.getAttribute('fill') === 'none', semTraco: p.getAttribute('stroke') === '0' });
    });
    return saida;
  }

  /* ---------- texto ---------- */
  var FONTE_KEY = { lexend: 'lexend', consolas: 'mono', 'courier new': 'mono', 'segoe ui': 'aulao' };
  /* a fonte do arquivo e, se ela não estiver no computador, a família mais próxima ("Verdana Pro Black" → Verdana) */
  var PESO_NOME = /\s+(black|heavy|extrabold|extra bold|bold|semibold|light|thin|condensed|cond|narrow)\b.*$/i;
  /* 09/11: o nome da fonte vem do arquivo e vai parar dentro de style="…" e font-family="…": só passam letras, números, espaço, ponto, hífen e sublinhado
     (nada de aspas, < >, ponto e vírgula, parênteses, barras ou &), para o nome nunca sair de dentro do atributo */
  function nomeFonte(nome) { return String(nome == null ? '' : nome).replace(/[^0-9A-Za-z\u00C0-\uFFFF .\-_]/g, '').replace(/[\u2028\u2029\uFFFE\uFFFF]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) }
  function familiaCss(nome) {
    nome = nomeFonte(nome);
    if (!nome) return '';
    var q = function (n) { return "'" + n.replace(/'/g, '') + "'" }, alt = [q(nome)], sem = nome.replace(PESO_NOME, ''), um = nome.split(' ')[0];
    if (sem !== nome) alt.push(q(sem));
    if (um !== sem && um.length > 3) alt.push(q(um));
    if (/agency|narrow|condensed|cond\b/i.test(nome)) alt.push("'Arial Narrow'");
    return alt.join(',');
  }
  function pesoDoNome(nome) { return /black|heavy|extrabold|extra bold/i.test(nome || '') ? 900 : /semibold/i.test(nome || '') ? 600 : /\bbold\b/i.test(nome || '') ? 700 : /light|thin/i.test(nome || '') ? 300 : 0 }
  /* propriedades de um nível de parágrafo vêm de uma pilha (forma → layout → mestre → padrão); acha a primeira que diz algo */
  function nivel(lista, lvl) { return lista.map(function (l) { return l && f1(l, 'lvl' + (lvl + 1) + 'pPr') }).filter(Boolean) }
  function lePilha(pilhas, f) { for (var i = 0; i < pilhas.length; i++) { var v = f(pilhas[i]); if (v != null) return v } return null }
  var NUMS = {
    arabic: function (n) { return String(n) }, alphaLc: function (n) { return String.fromCharCode(96 + ((n - 1) % 26) + 1) }, alphaUc: function (n) { return String.fromCharCode(64 + ((n - 1) % 26) + 1) },
    romanLc: function (n) { return romano(n).toLowerCase() }, romanUc: function (n) { return romano(n) }
  };
  function romano(n) { var r = '', t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; t.forEach(function (q) { while (n >= q[0]) { r += q[1]; n -= q[0] } }); return r }
  function autoNum(tipo, n) {
    var m = /^(arabic|alphaLc|alphaUc|romanLc|romanUc)(Period|ParenR|ParenBoth|Plain|Minus)?/.exec(tipo || 'arabicPeriod') || [0, 'arabic', 'Period'], s = (NUMS[m[1]] || NUMS.arabic)(n);
    return m[2] === 'ParenR' ? s + ')' : m[2] === 'ParenBoth' ? '(' + s + ')' : m[2] === 'Plain' ? s : m[2] === 'Minus' ? s + ' -' : s + '.';
  }

  /* monta { html, tam, cor, fonte/familia, alinha, altura, peso, vert, nowrap } de um txBody */
  function texto(txBody, pilhaEstilos, ctx, rels, fontRefCor, ehTitulo) {
    var T = ctx.T, k = ctx.ptPx, body = f1(txBody, 'bodyPr'), auto = f1(body, 'normAutofit');
    var escala = auto ? num(auto, 'fontScale', 1e5) / 1e5 : 1, reduz = auto ? num(auto, 'lnSpcReduction', 0) / 1e5 : 0;
    var lst = [f1(txBody, 'lstStyle')].concat(pilhaEstilos);
    var ps = fs(txBody, 'p'), out = [], tamanhos = {}, cores = {}, fontes = {}, contador = {}, links = [], algumTexto = false, todosNegrito = true, alinhaUm = null;
    function propR(rPr, pilhas, nome) { var v = rPr && rPr.getAttribute(nome); if (v != null) return v; return lePilha(pilhas, function (p) { var d = f1(p, 'defRPr'); return d ? d.getAttribute(nome) : null }) }
    function corR(rPr, pilhas) {
      var f = rPr && f1(rPr, 'solidFill'); if (f) return corFilha(f, T);
      /* ordem do PowerPoint: o próprio parágrafo e a lista da forma, depois a cor do estilo da forma (fontRef), depois os padrões */
      var de = function (p) { var d = f1(p, 'defRPr'), s = d && f1(d, 'solidFill'); return s ? corFilha(s, T) : null };
      var c = lePilha(pilhas.filter(function (p) { return p.__proprio }), de);
      return c || fontRefCor || lePilha(pilhas, de) || corDe(xml('<a:schemeClr xmlns:a="a" val="tx1"/>'), T);
    }
    function fonteR(rPr, pilhas) {
      var l = rPr && f1(rPr, 'latin'), v = l && l.getAttribute('typeface');
      if (!v) v = lePilha(pilhas, function (p) { var d = f1(p, 'defRPr'), q = d && f1(d, 'latin'); return q ? q.getAttribute('typeface') : null });
      if (!v || v === '+mn-lt' || v === '+mn-ea' || v === '+mn-cs') v = v && v.indexOf('+mj') === 0 ? T.fonteTit : (v ? T.fonteCorpo : (ehTitulo ? T.fonteTit : T.fonteCorpo));
      else if (v.indexOf('+mj') === 0) v = T.fonteTit;
      return v || '';
    }
    ps.forEach(function (p) {
      var pPr = f1(p, 'pPr'), lvl = num(pPr, 'lvl', 0), pil = [pPr].concat(nivel(lst, lvl)).filter(Boolean);
      if (pPr) pPr.__proprio = true; nivel([lst[0]], lvl).forEach(function (q) { q.__proprio = true });
      var algn = lePilha(pil, function (q) { return q.getAttribute('algn') }) || 'l';
      var marL = +(lePilha(pil, function (q) { return q.getAttribute('marL') }) || 0) * ctx.s, ind = +(lePilha(pil, function (q) { return q.getAttribute('indent') }) || 0) * ctx.s;
      var lnPct = lePilha(pil, function (q) { var l = cam(q, 'lnSpc', 'spcPct'); return l ? num(l, 'val', 1e5) / 1e5 : null }), lnPts = lePilha(pil, function (q) { var l = cam(q, 'lnSpc', 'spcPts'); return l ? num(l, 'val', 0) / 100 : null });
      var antes = lePilha(pil, function (q) { var l = cam(q, 'spcBef', 'spcPts'); return l ? num(l, 'val', 0) / 100 : null }) || 0, depois = lePilha(pil, function (q) { var l = cam(q, 'spcAft', 'spcPts'); return l ? num(l, 'val', 0) / 100 : null }) || 0;
      var buNone = lePilha(pil, function (q) { return f1(q, 'buNone') ? 'nao' : (f1(q, 'buChar') || f1(q, 'buAutoNum')) ? 'sim' : null });
      var buChar = buNone === 'sim' ? lePilha(pil, function (q) { var b = f1(q, 'buChar'); return b ? b.getAttribute('char') : null }) : null;
      var buNum = buNone === 'sim' && !buChar ? lePilha(pil, function (q) { var b = f1(q, 'buAutoNum'); return b ? b : null }) : null;
      var buCor = lePilha(pil, function (q) { var b = f1(q, 'buClr'); return b ? corFilha(b, T) : null });
      var buFonte = lePilha(pil, function (q) { var b = f1(q, 'buFont'); return b ? b.getAttribute('typeface') : null });
      var runs = [], tamP = null, temTexto = false;
      for (var c = p.firstElementChild; c; c = c.nextElementSibling) {
        var n = c.localName;
        if (n === 'r' || n === 'fld' || n === 'br') {
          var rPr = f1(c, 'rPr'), rp = [rPr].concat(pil).filter(Boolean), pilD = pil;
          var sz = +(propR(rPr, pilD, 'sz') || 1800) / 100 * escala, b = propR(rPr, pilD, 'b'), it = propR(rPr, pilD, 'i'), u = propR(rPr, pilD, 'u'), st = propR(rPr, pilD, 'strike'), cap = propR(rPr, pilD, 'cap'), spc = propR(rPr, pilD, 'spc'), bl = propR(rPr, pilD, 'baseline');
          var t = n === 'br' ? null : ((f1(c, 't') || {}).textContent || '');
          if (tamP == null) tamP = sz;
          var cor = corR(rPr, pilD), fo = fonteR(rPr, pilD), lk = rPr && f1(rPr, 'hlinkClick');
          if (t != null && t.length) { temTexto = true; if (/\S/.test(t)) { algumTexto = true; if (!(b === '1' || b === 'true')) todosNegrito = false } }
          runs.push({ br: n === 'br', t: t, sz: sz, b: b === '1' || b === 'true', i: it === '1' || it === 'true', u: u && u !== 'none', st: st && st !== 'noStrike', cap: cap === 'all', small: cap === 'small', spc: spc ? +spc / 100 : 0, bl: bl ? +bl / 1000 : 0, cor: css(cor), fonte: fo, link: lk });
        }
      }
      if (tamP == null) { var end = f1(p, 'endParaRPr'); tamP = +((end && end.getAttribute('sz')) || propR(null, pil, 'sz') || 1800) / 100 * escala }
      runs.forEach(function (r) { if (r.t && /\S/.test(r.t)) { tamanhos[r.sz] = (tamanhos[r.sz] || 0) + r.t.length; cores[r.cor] = (cores[r.cor] || 0) + r.t.length; fontes[r.fonte] = (fontes[r.fonte] || 0) + r.t.length } });
      if (alinhaUm == null && temTexto) alinhaUm = algn;
      out.push({ algn: algn, marL: marL, ind: ind, lnPct: lnPct, lnPts: lnPts, antes: antes, depois: depois, buChar: buChar, buNum: buNum, buCor: css(buCor), buFonte: buFonte, lvl: lvl, runs: runs, tam: tamP, temTexto: temTexto });
    });
    if (!algumTexto) return null;
    function maior(o) { var m = null, v = -1; Object.keys(o).forEach(function (q) { if (o[q] > v) { v = o[q]; m = q } }); return m }
    var tam = +maior(tamanhos) || 18, cor = maior(cores) || '', fonte = maior(fontes) || '';
    var ALG = { l: 'left', ctr: 'center', r: 'right', just: 'justify', dist: 'justify' };
    var alinha = ALG[alinhaUm] || 'left';
    var html = out.map(function (q) {
      var est = [];
      if ((ALG[q.algn] || 'left') !== alinha) est.push('text-align:' + (ALG[q.algn] || 'left'));
      if (q.tam !== tam) est.push('font-size:' + r1(q.tam * k) + 'px');
      var pct = q.lnPct != null ? Math.max(q.lnPct - reduz, .5) : null;
      if (q.lnPts) est.push('line-height:' + r1(q.lnPts * k) + 'px'); else if (pct != null && Math.abs(pct - 1) > .01) est.push('line-height:' + (Math.round(pct * 1.2 * 100) / 100));
      if (q.marL) est.push('padding-left:' + r1(q.marL) + 'px');
      if (q.ind && (q.buChar || q.buNum || q.ind > 0)) est.push('text-indent:' + r1(q.ind) + 'px');
      if (q.antes) est.push('margin-top:' + r1(q.antes * k) + 'px');
      if (q.depois) est.push('margin-bottom:' + r1(q.depois * k) + 'px');
      var bal = '';
      if (q.temTexto && (q.buChar || q.buNum)) {
        var simb = q.buChar || '';
        if (q.buNum) { var chave = q.lvl + '|' + q.buNum.getAttribute('type'); contador[chave] = (contador[chave] || num(q.buNum, 'startAt', 1) - 1) + 1; simb = autoNum(q.buNum.getAttribute('type'), contador[chave]) }
        else if (/wingdings|symbol/i.test(q.buFonte || '')) simb = { 'Ø': '➢', 'ü': '✓', '§': '■', 'q': '❑', 'v': '❖', 'n': '■', 'l': '●', 'Ÿ': '•', 'o': '○' }[simb] || '•';
        var larg = q.ind < 0 ? -q.ind : Math.max(q.tam * k * .9, 12);
        bal = '<span style="display:inline-block;text-indent:0;min-width:' + r1(larg) + 'px' + (q.buCor ? ';color:' + q.buCor : '') + '">' + EA.esc(simb) + '</span>';
      } else if (!q.buChar && !q.buNum) contador = {};
      var corpo = q.runs.map(function (r) {
        if (r.br) return '<br>';
        if (!r.t) return '';
        var s = [];
        if (r.sz !== q.tam) s.push('font-size:' + r1(r.sz * k * (r.bl ? .7 : 1)) + 'px');
        if (r.cor && r.cor !== cor) s.push('color:' + r.cor);
        if (r.fonte && r.fonte !== fonte && familiaCss(r.fonte)) s.push('font-family:' + familiaCss(r.fonte) + ',sans-serif');
        if (r.spc) s.push('letter-spacing:' + r1(r.spc * k) + 'px');
        if (r.cap) s.push('text-transform:uppercase'); if (r.small) s.push('font-variant:small-caps');
        if (r.bl) s.push('vertical-align:' + (r.bl > 0 ? 'super' : 'sub'));
        var tx = EA.esc(r.t);
        if (r.b && !todosNegrito) tx = '<b>' + tx + '</b>';
        if (r.i) tx = '<i>' + tx + '</i>';
        if (r.u) tx = '<u>' + tx + '</u>';
        if (r.st) tx = '<s>' + tx + '</s>';
        if (s.length) tx = '<span style="' + s.join(';') + '">' + tx + '</span>';
        if (r.link) { var rl = rels[rid(r.link, 'id')]; if (rl && rl.fora && /^https?:|^mailto:/i.test(rl.alvo)) tx = '<a href="' + EA.esc(rl.alvo) + '" target="_blank" rel="noopener">' + tx + '</a>'; else links.push(r.link) }
        return tx;
      }).join('');
      return '<div' + (est.length ? ' style="' + est.join(';') + '"' : '') + '>' + bal + (corpo || '<br>') + '</div>';
    }).join('');
    var pr0 = out.filter(function (q) { return q.temTexto })[0] || out[0], pct0 = pr0.lnPct != null ? Math.max(pr0.lnPct - reduz, .5) : 1;
    var fk = FONTE_KEY[fonte.toLowerCase()];
    var anc = at(body, 'anchor', ctx.ancoraPad || 't');
    return {
      props: { html: html, tam: r1(tam * k), cor: cor, peso: pesoDoNome(fonte) || (todosNegrito ? 700 : 400), alinha: alinha, altura: Math.round(pct0 * 1.2 * 100) / 100, fonte: fk || 'aulao', familia: fk ? '' : familiaCss(fonte), vert: anc === 'ctr' ? 'meio' : anc === 'b' ? 'baixo' : '', nowrap: at(body, 'wrap', '') === 'none' },
      fonte: fonte, links: links
    };
  }

  /* ---------- geometria: EMU do PowerPoint → pixels do slide, atravessando grupos ---------- */
  function xfrmDe(spPr) {
    var x = f1(spPr, 'xfrm'); if (!x) return null;
    var off = f1(x, 'off'), ext = f1(x, 'ext');
    return { x: num(off, 'x', 0), y: num(off, 'y', 0), w: num(ext, 'cx', 0), h: num(ext, 'cy', 0), rot: num(x, 'rot', 0) / 60000, fh: at(x, 'flipH') === '1', fv: at(x, 'flipV') === '1', chOff: f1(x, 'chOff'), chExt: f1(x, 'chExt') };
  }
  function giraPt(px, py, cx, cy, ang) { var a = ang * Math.PI / 180, dx = px - cx, dy = py - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)] }
  /* contexto de grupo: leva um ponto do grupo para o slide, e acumula escala, giro e espelho */
  function grupoCtx(pai, g) {
    var cx = num(g.chOff, 'x', 0), cy = num(g.chOff, 'y', 0), cw = num(g.chExt, 'cx', 0) || g.w || 1, chh = num(g.chExt, 'cy', 0) || g.h || 1;
    var sx = g.w ? g.w / cw : 1, sy = g.h ? g.h / chh : 1, mx = g.x + g.w / 2, my = g.y + g.h / 2;
    return {
      mapa: function (x, y) {
        var X = g.x + (x - cx) * sx, Y = g.y + (y - cy) * sy;
        if (g.fh) X = 2 * mx - X; if (g.fv) Y = 2 * my - Y;
        if (g.rot) { var q = giraPt(X, Y, mx, my, g.rot); X = q[0]; Y = q[1] }
        return pai.mapa(X, Y);
      },
      sx: pai.sx * sx, sy: pai.sy * sy, rot: pai.rot + g.rot, fh: pai.fh !== g.fh, fv: pai.fv !== g.fv
    };
  }
  function caixa(gc, x) {
    /* forma girada dentro de grupo esticado: a largura dela segue o eixo para onde ela aponta */
    var ra = x.rot * Math.PI / 180, co = Math.abs(Math.cos(ra)), se = Math.abs(Math.sin(ra));
    var c = gc.mapa(x.x + x.w / 2, x.y + x.h / 2), w = x.w * Math.hypot(gc.sx * co, gc.sy * se), h = x.h * Math.hypot(gc.sx * se, gc.sy * co), espelho = gc.fh !== gc.fv;
    var rot = (espelho ? -x.rot : x.rot) + gc.rot;
    return { cx: c[0], cy: c[1], w: w, h: h, rot: ((rot % 360) + 360) % 360, fh: x.fh !== gc.fh, fv: x.fv !== gc.fv };
  }
  /* caixa em px (x, y, w, h, rot) para um retângulo interno (insets) da forma */
  function geoPx(cx, cy, w, h, rot, ins) {
    ins = ins || [0, 0, 0, 0];
    var ww = Math.max(w - ins[0] - ins[2], 1), hh = Math.max(h - ins[1] - ins[3], 1), dx = (ins[0] - ins[2]) / 2, dy = (ins[1] - ins[3]) / 2;
    var q = rot ? giraPt(cx + dx, cy + dy, cx, cy, rot) : [cx + dx, cy + dy];
    return { x: r1(q[0] - ww / 2), y: r1(q[1] - hh / 2), w: r1(ww), h: r1(hh), rot: Math.round(rot * 10) / 10 };
  }

  /* ---------- imagens: cada arquivo do .pptx vira uma mídia só, mesmo usado várias vezes ---------- */
  var MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', svg: 'image/svg+xml' };
  function paraDataUrl(blob) { return new Promise(function (ok, erro) { var r = new FileReader(); r.onload = function () { ok(r.result) }; r.onerror = erro; r.readAsDataURL(blob) }) }
  /* efeitos de cor da imagem (duas cores, brilho/contraste, cor transparente, preto e branco): já saem prontos na imagem */
  function efeitosDe(blip, T) {
    if (!blip) return null;
    var lista = [], chave = [];
    for (var e = blip.firstElementChild; e; e = e.nextElementSibling) {
      var n = e.localName;
      if (n === 'duotone') { var cs = []; for (var c = e.firstElementChild; c; c = c.nextElementSibling) { var k = corDe(c, T); if (k) cs.push(k.c) } if (cs.length === 2) { lista.push({ t: 'duo', a: cs[0], b: cs[1] }); chave.push('duo' + cs.join()) } }
      else if (n === 'lum') { var br = num(e, 'bright', 0) / 1e5, ct = num(e, 'contrast', 0) / 1e5; if (br || ct) { lista.push({ t: 'lum', br: br, ct: ct }); chave.push('lum' + br + ',' + ct) } }
      else if (n === 'grayscl') { lista.push({ t: 'cinza' }); chave.push('cinza') }
      else if (n === 'biLevel') { lista.push({ t: 'bi', lim: num(e, 'thresh', 5e4) / 1e5 }); chave.push('bi' + num(e, 'thresh', 5e4)) }
      else if (n === 'clrChange') { var de = corFilha(f1(e, 'clrFrom'), T), para = corFilha(f1(e, 'clrTo'), T); if (de && para) { lista.push({ t: 'troca', de: de.c, para: para.c, a: para.a }); chave.push('troca' + de.c + para.c + para.a) } }
    }
    return lista.length ? { lista: lista, chave: chave.join('|') } : null;
  }
  function aplicaEfeitos(cv, ef) {
    var g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
    ef.lista.forEach(function (q) {
      for (var i = 0; i < d.length; i += 4) {
        var r = d[i], gg = d[i + 1], b = d[i + 2], L = (.299 * r + .587 * gg + .114 * b) / 255;
        if (q.t === 'duo') { d[i] = q.a[0] + (q.b[0] - q.a[0]) * L; d[i + 1] = q.a[1] + (q.b[1] - q.a[1]) * L; d[i + 2] = q.a[2] + (q.b[2] - q.a[2]) * L }
        else if (q.t === 'cinza') { d[i] = d[i + 1] = d[i + 2] = L * 255 }
        else if (q.t === 'bi') { d[i] = d[i + 1] = d[i + 2] = L >= q.lim ? 255 : 0 }
        else if (q.t === 'lum') { for (var j = 0; j < 3; j++) { var v = d[i + j] / 255 + q.br; v = (v - .5) * (q.ct >= 0 ? 1 / Math.max(1 - q.ct, .01) : 1 + q.ct) + .5; d[i + j] = v * 255 } }
        else if (q.t === 'troca' && Math.abs(r - q.de[0]) < 8 && Math.abs(gg - q.de[1]) < 8 && Math.abs(b - q.de[2]) < 8) { d[i] = q.para[0]; d[i + 1] = q.para[1]; d[i + 2] = q.para[2]; d[i + 3] *= q.a }
      }
    });
    g.putImageData(im, 0, 0);
  }
  /* som e vídeo do PowerPoint: viram mídia do material (os formatos que o navegador toca) */
  var MIME_AV = { m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', aac: 'audio/aac', mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
  function midiaSom(I, caminho, tipo) {
    var chave = 'av:' + caminho;
    if (I.cache[chave]) return I.cache[chave];
    var ext = caminho.split('.').pop().toLowerCase();
    if (!MIME_AV[ext]) return (I.cache[chave] = Promise.resolve({ erro: 'em ' + ext.toUpperCase() + ' (o navegador não toca)' }));
    return (I.cache[chave] = I.zip.bytes(caminho).then(function (b) {
      if (!b) return { erro: 'faltando no arquivo' };
      return paraDataUrl(new Blob([b], { type: MIME_AV[ext] })).then(function (d) {
        var id = EA.uid(); I.p.midia[id] = { tipo: tipo, nome: caminho.split('/').pop(), dados: d };
        return { id: id };
      });
    }).catch(function () { return { erro: 'que não deu para ler' } }));
  }

  /* ---------- animações do PowerPoint → entradas, marcas da linha do tempo e saídas do Estúdio ---------- */
  function atrasoDe(cTn) { var c = cam(cTn, 'stCondLst', 'cond'), d = c && c.getAttribute('delay'); return d && d !== 'indefinite' ? +d || 0 : 0 }
  function duracaoDe(ec) {
    var m = 0;
    [].forEach.call(ec.getElementsByTagNameNS('*', 'cTn'), function (c) { var d = c.getAttribute('dur'); if (d && d !== 'indefinite') m = Math.max(m, +d + atrasoDe(c)) });
    return m / 1000;
  }
  function leTempo(S) {
    var raiz = fundo(S, 'timing'); if (!raiz) return null;
    var cts = [].slice.call(raiz.getElementsByTagNameNS('*', 'cTn'));
    var main = cts.filter(function (c) { return c.getAttribute('nodeType') === 'mainSeq' })[0];
    var r = { evs: [], interativo: cts.some(function (c) { return c.getAttribute('nodeType') === 'interactiveSeq' }), cliques: 0 };
    if (!main) return r;
    fs(f1(main, 'childTnLst'), 'par').forEach(function (gp, gi) {
      var gc = f1(gp, 'cTn'), auto = gi === 0 && fs(f1(gc, 'stCondLst'), 'cond').some(function (c) { return c.getAttribute('evt') === 'onBegin' });
      var passo = auto ? 0 : ++r.cliques;
      fs(f1(gc, 'childTnLst'), 'par').forEach(function (mp) {
        var mc = f1(mp, 'cTn'), d1 = atrasoDe(mc);
        fs(f1(mc, 'childTnLst'), 'par').forEach(function (ep) {
          var ec = f1(ep, 'cTn'), alvo = fundo(ec, 'spTgt'); if (!alvo) return;
          r.evs.push({ passo: passo, t: (d1 + atrasoDe(ec)) / 1000, cls: ec.getAttribute('presetClass'), id: +ec.getAttribute('presetID') || 0, sub: +ec.getAttribute('presetSubtype') || 0, dur: duracaoDe(ec), spid: alvo.getAttribute('spid'), el: ec, temTexto: !!fundo(alvo, 'txEl') });
        });
      });
    });
    r.evs.sort(function (a, b) { return a.passo - b.passo || a.t - b.t });
    /* ícones de som escondidos durante a apresentação */
    r.escondeMidia = {};
    [].forEach.call(raiz.getElementsByTagNameNS('*', 'cMediaNode'), function (c) { if (c.getAttribute('showWhenStopped') === '0') { var t = fundo(c, 'spTgt'); if (t) r.escondeMidia[t.getAttribute('spid')] = 1 } });
    return r;
  }
  function entradaEstudio(e) {
    var id = e.id, s = e.sub;
    if (id === 2 || id === 12) return s === 8 ? 'esquerda' : s === 2 ? 'direita' : s === 1 ? 'descer' : 'subir';
    if (id === 42 || id === 37 || id === 30) return 'subir';
    if (id === 47) return 'descer';
    if (id === 53 || id === 23 || id === 55 || id === 52) return 'zoom';
    if (id === 31 || id === 49 || id === 21 || id === 19 || id === 45) return 'girar';
    if (id === 26 || id === 25) return 'quicar';
    if (id === 22 || id === 16 || id === 3 || id === 18 || id === 4) return 'cortina';
    if (id === 9 || id === 5 || id === 14) return 'pixel';
    return 'aparecer';
  }
  function fimCaminho(ec) {
    var m = fundo(ec, 'animMotion'), p = m && m.getAttribute('path'); if (!p) return null;
    var n = (p.match(/-?\d*\.?\d+(e-?\d+)?/gi) || []).map(Number);
    return n.length >= 2 ? [n[n.length - 2], n[n.length - 1]] : null;
  }
  /* marcas da linha do tempo de um objeto, contando do instante em que ele aparece */
  function montaKf(I, o, evs, R) {
    var st = { x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot || 0, op: o.op == null ? 1 : o.op }, base = st.op, kf = [Object.assign({ t: 0 }, st)], aprox = false;
    function marca(t, mud, extra) {
      var ult = kf[kf.length - 1]; t = Math.round(Math.max(t, 0) * 100) / 100;
      if (t < ult.t + .07) t = Math.round((ult.t + .07) * 100) / 100;
      Object.assign(st, mud || {}); kf.push(Object.assign({ t: t }, st, extra || {}));
    }
    evs.forEach(function (e) {
      var t = e.t - R, d = Math.max(e.dur, .07);
      if (e.cls === 'exit') { marca(t); marca(t + (e.id === 1 ? .07 : d), { op: 0 }) }
      else if (e.cls === 'entr') { marca(t, { op: 0 }); marca(t + .07, { op: base }, e.id === 1 ? null : { efeito: entradaEstudio(e), efeitoDur: Math.max(e.dur, .2) }) }
      else if (e.cls === 'path') {
        var f = fimCaminho(e.el); if (!f) return;
        marca(t); marca(t + d, { x: Math.round(st.x + f[0] * I.larg), y: Math.round(st.y + f[1] * I.alt) });
      } else if (e.cls === 'emph') {
        var gira = fundo(e.el, 'animRot'), esc = fundo(e.el, 'animScale');
        if (gira) { marca(t); marca(t + d, { rot: st.rot + num(gira, 'by', 0) / 60000 }) }
        else if (esc && f1(esc, 'by')) { var b = f1(esc, 'by'), fx = num(b, 'x', 1e5) / 1e5, fy = num(b, 'y', 1e5) / 1e5, cx = st.x + st.w / 2, cy = st.y + st.h / 2; marca(t); marca(t + d, { w: Math.round(st.w * fx), h: Math.round(st.h * fy), x: Math.round(cx - st.w * fx / 2), y: Math.round(cy - st.h * fy / 2) }) }
        else if (e.id === 32) { var r0 = st.rot; marca(t); marca(t + d * .25, { rot: r0 + 5 }); marca(t + d * .5, { rot: r0 - 5 }); marca(t + d * .75, { rot: r0 + 5 }); marca(t + d, { rot: r0 }) }
        else { marca(t, null, { efeito: 'pop', efeitoDur: Math.max(e.dur, .3) }); aprox = true }
      }
    });
    if (kf.length > 1) o.kf = kf;
    return aprox;
  }
  function aplicaTempo(I, tempo, porId, midias, si) {
    if (!tempo) return;
    if (tempo.interativo) avisa(I, si, 'animação que começa ao clicar numa peça (gatilho)');
    var porSp = {};
    tempo.evs.forEach(function (e) { (porSp[e.spid] = porSp[e.spid] || []).push(e) });
    var aprox = false, partes = false, texto = false;
    Object.keys(porSp).forEach(function (sp) {
      var evs = porSp[sp], md = midias[sp];
      /* som e vídeo: tocar na hora em que o PowerPoint manda */
      var toca = evs.filter(function (e) { return e.cls === 'mediacall' })[0];
      if (md && md.tipo === 'video' && toca) md.obj.props.tocar = true;
      var vis = evs.filter(function (e) { return e.cls === 'entr' || e.cls === 'exit' || e.cls === 'emph' || e.cls === 'path' });
      var objs = porId[sp] || [];
      if (md && md.tipo === 'audio' && md.id) {
        var alvo = objs[0];
        if (!alvo) { alvo = EA.novoObjeto('forma', { forma: 'circulo', cor: 'transparent' }, { x: 0, y: 0, w: 24, h: 24 }); alvo.op = 0; I.extras.push(alvo) }
        if (tempo.escondeMidia[sp]) objs.forEach(function (o) { o.op = 0 });
        if (toca) alvo.entrada = { tipo: 'nenhuma', dur: .01, atraso: toca.t, quando: toca.passo ? 'clique' : 'auto', passo: toca.passo || null, som: 'midia:' + md.id };
        else if (!tempo.escondeMidia[sp]) objs.forEach(function (o) { o.acao = { tipo: 'som', som: 'midia:' + md.id } });
        if (!vis.length) return;
      }
      if (!vis.length || !objs.length) return;
      if (vis.some(function (e) { return e.temTexto })) texto = true;
      var pri = vis[0], escondido = pri.cls === 'entr', passoV = escondido ? pri.passo : 0, R = escondido ? pri.t : 0;
      var resto = escondido ? vis.slice(1) : vis, mesmo = resto.filter(function (e) { return e.passo === passoV }), depois = resto.filter(function (e) { return e.passo > passoV });
      objs.forEach(function (o) {
        if (escondido) {
          var som = o.entrada && o.entrada.som;
          o.entrada = { tipo: pri.id === 1 ? 'aparecer' : entradaEstudio(pri), dur: pri.id === 1 ? .01 : Math.max(pri.dur, .2), atraso: Math.round(pri.t * 100) / 100, quando: passoV ? 'clique' : 'auto', passo: passoV || null, som: som || '' };
        }
        if (montaKf(I, o, mesmo, R)) aprox = true;
        var sai = depois.filter(function (e) { return e.cls === 'exit' })[0];
        if (sai) o.saida = { passo: sai.passo, atraso: Math.round(sai.t * 100) / 100, dur: sai.id === 1 ? .01 : Math.max(sai.dur, .2) };
        if (depois.some(function (e) { return e !== sai })) partes = true;
      });
    });
    if (aprox) avisa(I, si, 'efeito de ênfase aproximado');
    if (partes) avisa(I, si, 'peça que muda em vários cliques (ficou só a primeira mudança)');
    if (texto) avisa(I, si, 'texto que entra por parágrafo (entra a caixa inteira)');
  }
  /* transição do slide: a mais parecida do Estúdio */
  var TRANS = { fade: 'cruzar', reveal: 'cruzar', flash: 'cruzar', cut: 'nenhuma', dissolve: 'pixel', randomBar: 'pixel', checker: 'pixel', push: 'empurrar', pull: 'empurrar', cover: 'empurrar', wipe: 'persiana', split: 'persiana', blinds: 'persiana', strips: 'persiana', comb: 'persiana', zoom: 'zoom', newsflash: 'zoom', circle: 'iris', wheel: 'iris', wedge: 'iris', diamond: 'iris', plus: 'iris', morph: 'magico' };
  function transicaoDe(S) {
    var tr = fundo(S, 'transition'); if (!tr) return { tipo: 'nenhuma', dur: .4 };
    var k = tr.firstElementChild, nome = k ? k.localName : 'cut', ms = tr.getAttribute('dur') || (k && k.getAttribute('dur'));
    var tipo = TRANS[nome] || 'cruzar';
    if (tipo === 'empurrar' && k && /^(u|d)$/.test(k.getAttribute('dir') || '')) tipo = 'subir';
    var dur = ms ? +ms / 1000 : { fast: .5, med: .75, slow: 1 }[tr.getAttribute('spd') || 'fast'] || .5;
    return { tipo: tipo, dur: Math.min(Math.max(dur, .2), 2.5), _nome: nome };
  }

  function midiaDe(I, caminho, ef) {
    var chave = caminho + (ef ? '#' + ef.chave : '');
    if (I.cache[chave]) return I.cache[chave];
    var ext = caminho.split('.').pop().toLowerCase();
    if (!MIME[ext]) return (I.cache[chave] = Promise.resolve({ erro: ext.toUpperCase() }));
    I.cache[chave] = I.zip.bytes(caminho).then(function (b) {
      if (!b) return { erro: 'arquivo faltando' };
      var blob = new Blob([b], { type: MIME[ext] });
      if (ext === 'svg') return paraDataUrl(blob).then(function (d) { return { dados: d, w: 0, h: 0 } });
      return createImageBitmap(blob).then(function (bmp) {
        var w = bmp.width, h = bmp.height, mx = Math.max(w, h);
        /* foto grande vira WebP de até 1920 px: o material não fica pesado */
        /* GIF fica como veio (senão perde a animação), a não ser que tenha efeito de cor do PowerPoint */
        if ((mx > 1920 || b.length > 1200000 || ef) && !(ext === 'gif' && !ef)) {
          var f = Math.min(1, 1920 / mx), cv = document.createElement('canvas');
          cv.width = Math.round(w * f); cv.height = Math.round(h * f);
          cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
          if (bmp.close) bmp.close();                    // 09/11: solta a foto aberta da memória assim que ela foi copiada
          if (ef) aplicaEfeitos(cv, ef);
          var saiu = { dados: ext === 'png' && b.length < 1200000 && mx <= 1920 ? cv.toDataURL('image/png') : cv.toDataURL('image/webp', .9), w: cv.width, h: cv.height };
          cv.width = cv.height = 0;                      // 09/11: e a tela de rascunho também
          return saiu;
        }
        if (bmp.close) bmp.close();                      // 09/11: aqui só serviu para medir
        return paraDataUrl(blob).then(function (d) { return { dados: d, w: w, h: h } });
      });
    }).then(function (m) {
      if (m.erro) return m;
      var id = EA.uid(); I.p.midia[id] = { tipo: 'imagem', nome: caminho.split('/').pop(), dados: m.dados, w: m.w, h: m.h };
      return { id: id, w: m.w, h: m.h };
    }).catch(function () { return { erro: 'imagem que o navegador não abre' } });
    return I.cache[chave];
  }

  /* ---------- tema do mestre ---------- */
  function leTema(xTema, xMestre) {
    var T = { cores: {}, mapa: {}, fonteCorpo: '', fonteTit: '', fills: [], linhas: [] }, cs = fundo(xTema, 'clrScheme');
    if (cs) for (var c = cs.firstElementChild; c; c = c.nextElementSibling) { var k = c.firstElementChild; if (k) T.cores[c.localName] = k.localName === 'srgbClr' ? at(k, 'val') : at(k, 'lastClr', at(k, 'val') === 'window' ? 'FFFFFF' : '000000') }
    var fsq = fundo(xTema, 'fontScheme');
    T.fonteTit = at(cam(f1(fsq, 'majorFont'), 'latin'), 'typeface', ''); T.fonteCorpo = at(cam(f1(fsq, 'minorFont'), 'latin'), 'typeface', '');
    var fmt = fundo(xTema, 'fmtScheme');
    if (fmt) { var fl = f1(fmt, 'fillStyleLst'), ll = f1(fmt, 'lnStyleLst'); if (fl) for (c = fl.firstElementChild; c; c = c.nextElementSibling) T.fills.push(c); if (ll) T.linhas = fs(ll, 'ln') }
    var cm = cam(xMestre, 'clrMap');
    T.mapa = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2' };
    if (cm) for (var i = 0; i < cm.attributes.length; i++) T.mapa[cm.attributes[i].name] = cm.attributes[i].value;
    return T;
  }

  /* 09/11: o mesmo tema com outro mapa de cores (o tema lido fica intacto para os outros slides) */
  function temaComMapa(T, cm) {
    var N = {}, k, i;
    for (k in T) N[k] = T[k];
    N.mapa = {}; for (k in T.mapa) N.mapa[k] = T.mapa[k];
    for (i = 0; i < cm.attributes.length; i++) N.mapa[cm.attributes[i].name] = cm.attributes[i].value;
    return N;
  }

  /* ---------- placeholder: acha o equivalente no layout e no mestre ---------- */
  function phDe(sp) { var nv = sp.firstElementChild; var p = nv && cam(nv, 'nvPr', 'ph'); return p ? { tipo: at(p, 'type', 'body'), idx: at(p, 'idx', null) } : null }
  function achaPh(arvore, ph) {
    if (!arvore || !ph) return null;
    var todos = [].filter.call(arvore.getElementsByTagNameNS('*', 'sp'), function (s) { return phDe(s) }), alvo = null;
    if (ph.idx != null) alvo = todos.filter(function (s) { return phDe(s).idx === ph.idx })[0];
    if (!alvo) alvo = todos.filter(function (s) { var q = phDe(s); return q.tipo === ph.tipo || (ph.tipo === 'ctrTitle' && q.tipo === 'title') || (ph.tipo === 'subTitle' && q.tipo === 'body') })[0];
    return alvo || null;
  }
  function estiloMestre(I, ph) {
    var ts = cam(I.mestre, 'txStyles'); if (!ts) return null;
    if (!ph) return f1(ts, 'otherStyle');
    return f1(ts, ph.tipo === 'title' || ph.tipo === 'ctrTitle' ? 'titleStyle' : ph.tipo === 'body' || ph.tipo === 'subTitle' || ph.tipo === 'obj' ? 'bodyStyle' : 'otherStyle');
  }

  /* ---------- uma forma (sp), imagem (pic), linha (cxnSp), grupo (grpSp) ---------- */
  function linhaDe(spPr, T, estilo) {
    var ln = f1(spPr, 'ln'), r = null;
    if (ln && f1(ln, 'noFill')) return null;
    var cor = ln && f1(ln, 'solidFill') ? corFilha(f1(ln, 'solidFill'), T) : null;
    if (!cor && ln && f1(ln, 'gradFill')) { var g = fs(cam(ln, 'gradFill', 'gsLst'), 'gs')[0]; cor = g ? corFilha(g, T) : null }
    if (!cor && estilo) { var lr = f1(estilo, 'lnRef'); if (lr && num(lr, 'idx', 0) > 0) cor = corFilha(lr, T) }
    if (!cor) return null;
    var w = ln ? num(ln, 'w', null) : null;
    if (w == null && estilo) { var lr2 = f1(estilo, 'lnRef'), base = lr2 && T.linhas[num(lr2, 'idx', 1) - 1]; w = base ? num(base, 'w', 9525) : 9525 }
    r = { cor: cor, w: w == null ? 9525 : w, tracejado: ln ? at(f1(ln, 'prstDash'), 'val', '') : '', ini: ln ? at(f1(ln, 'headEnd'), 'type', 'none') : 'none', fim: ln ? at(f1(ln, 'tailEnd'), 'type', 'none') : 'none' };
    return r;
  }
  function tracejado(t, w) { var m = { dash: [4, 3], sysDash: [3, 1], dot: [1, 1], sysDot: [1, 1], lgDash: [8, 3], dashDot: [4, 3, 1, 3], lgDashDot: [8, 3, 1, 3], sysDashDot: [3, 1, 1, 1] }[t]; return m ? m.map(function (v) { return r1(v * Math.max(w, 1)) }).join(' ') : '' }
  function ponta(tipo, a, b, w, cor) {
    if (!tipo || tipo === 'none') return '';
    var ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.max(w * 3.2, 7), lg = L * .55, p = function (dx, dy) { return [b[0] + dx * Math.cos(ang) - dy * Math.sin(ang), b[1] + dx * Math.sin(ang) + dy * Math.cos(ang)] };
    if (tipo === 'oval') return '<circle cx="' + r1(b[0]) + '" cy="' + r1(b[1]) + '" r="' + r1(lg) + '" fill="' + cor + '"/>';
    if (tipo === 'arrow') return '<path d="M' + p(-L, -lg).map(r1).join(' ') + ' L' + r1(b[0]) + ' ' + r1(b[1]) + ' L' + p(-L, lg).map(r1).join(' ') + '" fill="none" stroke="' + cor + '" stroke-width="' + r1(w) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    return '<path d="' + poli([b, p(-L, -lg), p(-L, lg)]) + '" fill="' + cor + '"/>';
  }

  function nada() {}
  function avisa(I, si, o) { (I.faltas[si] = I.faltas[si] || {})[o] = ((I.faltas[si] || {})[o] || 0) + 1 }
  function caixinha(I, si, bx, motivo) {
    var g = geoPx(bx.cx, bx.cy, Math.max(bx.w, 40), Math.max(bx.h, 24), bx.rot);
    I.objs.push(EA.novoObjeto('forma', { forma: 'ret', cor: 'rgba(148,163,184,.18)', raio: 6, borda: 1, corBorda: '#94a3b8' }, g));
    if (g.w > 60 && g.h > 18) I.objs.push(EA.novoObjeto('texto', { html: '<div>' + EA.esc(motivo) + ' — não veio do PowerPoint</div>', tam: Math.min(14, g.h * .5), cor: '#64748b', alinha: 'center', vert: 'meio', fonte: 'aulao' }, g));
    avisa(I, si, motivo);
  }

  function processaArvore(I, arvore, gc, rels, si, quem) {
    if (!arvore) return;                               // 09/11: layout ou mestre sem árvore de peças não derruba o slide
    for (var c = arvore.firstElementChild; c; c = c.nextElementSibling) {
      try { processaPeca(I, c, gc, rels, si, quem) } catch (e) { console.warn('importar pptx:', e); avisa(I, si, 'peça que deu erro ao ler') }
    }
  }
  function processaPeca(I, el, gc, rels, si, quem) {
    var n = el.localName;
    if (n === 'AlternateContent') { var esc = f1(el, 'Fallback') || f1(el, 'Choice'); if (esc) processaArvore(I, esc, gc, rels, si, quem); return }
    if (n !== 'sp' && n !== 'pic' && n !== 'cxnSp' && n !== 'grpSp' && n !== 'graphicFrame' && n !== 'contentPart') return;
    var nv = el.firstElementChild, cNvPr = nv && f1(nv, 'cNvPr');
    if (at(cNvPr, 'hidden') === '1') return;
    var ph = n === 'sp' || n === 'pic' ? phDe(el) : null;
    if (quem !== 'slide' && ph) return;               // caixas de "clique para editar" do layout/mestre não aparecem na apresentação
    var spPr = f1(el, n === 'grpSp' ? 'grpSpPr' : 'spPr'), x = xfrmDe(spPr), phL = null, phM = null;
    if (ph) { phL = achaPh(I.layoutArv, ph); phM = achaPh(I.mestreArv, ph); }
    if (!x && phL) x = xfrmDe(f1(phL, 'spPr'));
    if (!x && phM) x = xfrmDe(f1(phM, 'spPr'));
    var id = at(cNvPr, 'id', ''), ini = I.objs.length;
    /* guarda quais objetos nasceram de cada peça: as animações do PowerPoint apontam para o número dela */
    var anota = function () { if (quem === 'slide' && id) I.porId[id] = I.objs.slice(ini) };
    /* 09/11: grupo sem medidas próprias (grpSpPr vazio): os filhos ficam nas medidas de quem está em volta, em vez de sumirem */
    if (n === 'grpSp') { processaArvore(I, el, x ? grupoCtx(gc, x) : gc, rels, si, quem); anota(); return }
    if (!x) { if (n === 'graphicFrame') { var gx = f1(el, 'xfrm'); if (gx) x = { x: num(f1(gx, 'off'), 'x', 0), y: num(f1(gx, 'off'), 'y', 0), w: num(f1(gx, 'ext'), 'cx', 0), h: num(f1(gx, 'ext'), 'cy', 0), rot: 0 } } if (!x) return }
    var bx = caixa(gc, x), T = I.T, s = I.s, px = { cx: bx.cx * s + I.ox, cy: bx.cy * s + I.oy, w: bx.w * s, h: bx.h * s, rot: bx.rot };
    var acao = acaoDe(I, cNvPr, rels);
    var antes = I.objs.length;
    if (n === 'graphicFrame') {
      var uri = at(fundo(el, 'graphicData'), 'uri', ''), feito = false;
      if (/table/.test(uri)) feito = pecaTabela(I, el, px, rels, si, gc);
      else if (/chart$/.test(uri)) feito = pecaGrafico(I, el, px, rels, si, gc, x);
      else if (/diagram/.test(uri)) feito = pecaSmartArt(I, el, x, gc, rels, si);
      if (!feito) caixinha(I, si, px, /table/.test(uri) ? 'tabela' : /chartex/.test(uri) ? 'gráfico de tipo novo (cascata, mapa de árvore…)' : /chart/.test(uri) ? 'gráfico' : /diagram/.test(uri) ? 'SmartArt' : /ole/.test(uri) ? 'objeto incorporado' : 'objeto');
    } else if (n === 'contentPart') {
      avisa(I, si, 'desenho à tinta');
    } else if (n === 'pic') {
      peçaImagem(I, el, spPr, px, rels, si, bx);
    } else {
      /* forma de SmartArt: o texto pode ter caixa própria (txXfrm), diferente da forma */
      var txX = f1(el, 'txXfrm'), pxT = null;
      if (txX) { var xo = f1(txX, 'off'), xe = f1(txX, 'ext'), bt = caixa(gc, { x: num(xo, 'x', 0), y: num(xo, 'y', 0), w: num(xe, 'cx', 0), h: num(xe, 'cy', 0), rot: num(txX, 'rot', 0) / 60000, fh: false, fv: false }); pxT = { cx: bt.cx * s + I.ox, cy: bt.cy * s + I.oy, w: bt.w * s, h: bt.h * s, rot: bt.rot } }
      pecaForma(I, el, spPr, px, rels, si, bx, n === 'cxnSp', ph, phL, phM, pxT);
    }
    if (acao) for (var k = antes; k < I.objs.length; k++) I.objs[k].acao = EA.clona(acao);
    anota();
  }
  /* clique no objeto → ação do Estúdio */
  function acaoDe(I, cNvPr, rels) {
    var h = cNvPr && f1(cNvPr, 'hlinkClick'); if (!h) return null;
    var a = h.getAttribute('action') || '', r = rels[rid(h, 'id')];
    if (/hlinksldjump/.test(a) && r) return { tipo: 'slide', alvoArq: r.alvo };
    if (/jump=nextslide/.test(a)) return { tipo: 'proximo' };
    if (/jump=(previousslide|firstslide|lastslide|lastslideviewed)/.test(a)) return { tipo: 'slide', pula: /previous|lastslideviewed/.test(a) ? -1 : /first/.test(a) ? 'primeiro' : 'ultimo' };
    if (/jump=endshow/.test(a)) return null;
    if (r && r.fora && /^https?:/i.test(r.alvo)) return { tipo: 'link', url: r.alvo };
    return null;
  }

  function peçaImagem(I, el, spPr, px, rels, si, bx) {
    var bf = f1(el, 'blipFill'), blip = f1(bf, 'blip'), r = blip && rels[rid(blip, 'embed')];
    var nvPr = cam(el, 'nvPicPr', 'nvPr');
    /* áudio e vídeo: o arquivo vem para dentro do material. Vídeo vira o objeto de vídeo; áudio fica no ícone e toca na hora certa (ver aplicaTempo) */
    var med = nvPr && (fundo(nvPr, 'media') || fundo(nvPr, 'videoFile') || fundo(nvPr, 'audioFile'));
    if (med) {
      var rm = rels[rid(med, 'embed')] || rels[rid(med, 'link')], ehVideo = !!fundo(nvPr, 'videoFile') || /video/.test((rm && rm.tipo) || '');
      var idP = at(cam(el, 'nvPicPr', 'cNvPr'), 'id', '');
      if (rm && !rm.fora) {
        if (ehVideo) {
          var gv = geoPx(px.cx, px.cy, px.w, px.h, px.rot), ov = EA.novoObjeto('video', { ajuste: 'contain', controles: true, tocar: false }, gv);
          I.objs.push(ov);
          I.esperas.push(midiaSom(I, rm.alvo, 'video').then(function (m) { if (m.erro) { avisa(I, si, 'vídeo ' + m.erro); ov.tipo = 'forma'; ov.props = { forma: 'ret', cor: '#0f172a', raio: 6 } } else ov.props.midia = m.id }));
          I.midias[idP] = { tipo: 'video', obj: ov };
          return;
        }
        var info = I.midias[idP] = { tipo: 'audio', pronto: midiaSom(I, rm.alvo, 'audio').then(function (m) { if (m.erro) avisa(I, si, 'áudio ' + m.erro); else info.id = m.id }) };
        I.esperas.push(info.pronto);
      } else avisa(I, si, ehVideo ? 'vídeo da internet ou de outro arquivo' : 'áudio de outro arquivo');
    }
    if (!r) { if (blip && rid(blip, 'link')) caixinha(I, si, px, 'imagem ligada a outro arquivo'); return }
    var prst = at(f1(spPr, 'prstGeom'), 'prst', 'rect');
    poeImagem(I, si, px, bx, r.alvo, f1(bf, 'srcRect'), blip, prst, f1(spPr, 'prstGeom'), linhaDe(spPr, I.T, f1(el, 'style')));
  }
  function poeImagem(I, si, px, bx, caminho, srcRect, blip, prst, geo, ln) {
    var g = geoPx(px.cx, px.cy, px.w, px.h, px.rot), o = EA.novoObjeto('imagem', { ajuste: 'fill' }, g), idx = I.objs.length;
    I.objs.push(o);
    if (bx.fh !== bx.fv && bx.fv) o.rot = (o.rot + 180) % 360;
    if (bx.fh !== bx.fv) o.props.vira = true; else if (bx.fh && bx.fv) o.rot = (o.rot + 180) % 360;
    if (srcRect) {
      var l = num(srcRect, 'l', 0) / 1e5, t = num(srcRect, 't', 0) / 1e5, rr = num(srcRect, 'r', 0) / 1e5, b = num(srcRect, 'b', 0) / 1e5, vw = 1 - l - rr, vh = 1 - t - b;
      if ((l || t || rr || b) && vw > 0 && vh > 0) o.props.corte = { x: -l / vw, y: -t / vh, w: 1 / vw, h: 1 / vh };
    }
    var a = blip && fundo(blip, 'alphaModFix'); if (a) o.op = num(a, 'amt', 1e5) / 1e5;
    var ef = efeitosDe(blip, I.T);
    if (prst === 'ellipse') o.props.masc = 'circulo';
    else if (prst === 'roundRect' || prst === 'flowChartAlternateProcess') { o.props.masc = 'ret'; o.props.raioMasc = r1(Math.min(px.w, px.h) * (prst === 'roundRect' ? aj(geo, 'adj', 16667) / 1e5 : 1 / 6)) }
    else if ({ triangle: 'triangulo', star5: 'estrela', diamond: 'losango', hexagon: 'hexagono', octagon: 'octogono', heart: 'coracao' }[prst]) o.props.masc = { triangle: 'triangulo', star5: 'estrela', diamond: 'losango', hexagon: 'hexagono', octagon: 'octogono', heart: 'coracao' }[prst];
    if (o.props.masc && !o.props.corte) { o.props.fx = 50; o.props.fy = 50 }
    I.esperas.push(midiaDe(I, caminho, ef).then(function (m) {
      if (m.erro) { I.objs.splice(I.objs.indexOf(o), 1); var antes = I.objs.length; caixinha(I, si, px, 'imagem ' + m.erro); var novos = I.objs.splice(antes); I.objs.splice.apply(I.objs, [Math.min(idx, I.objs.length), 0].concat(novos)); return }
      o.props.midia = m.id;
      /* com máscara, a foto preenche a forma (cover); sem máscara, estica como no PowerPoint */
    }));
    if (ln) {
      var lw = Math.max(ln.w * I.s, 1);
      I.objs.push(EA.novoObjeto('forma', { forma: prst === 'ellipse' ? 'circulo' : 'ret', cor: 'transparent', raio: o.props.raioMasc || 0, borda: r1(lw), corBorda: css(ln.cor) }, g));
    }
  }

  function pecaForma(I, el, spPr, px, rels, si, bx, ehLinha, ph, phL, phM, pxT) {
    var T = I.T, estilo = f1(el, 'style'), geoP = f1(spPr, 'prstGeom'), geoL = f1(spPr, 'custGeom');
    if (!geoP && !geoL && phL) { var sl = f1(phL, 'spPr'); geoP = f1(sl, 'prstGeom'); geoL = f1(sl, 'custGeom') }
    var prst = geoP ? at(geoP, 'prst', 'rect') : geoL ? '' : 'rect';
    var fill = preenchimento(spPr, T);
    if (!fill && phL) fill = preenchimento(f1(phL, 'spPr'), T);
    if (!fill && estilo) { var fr = f1(estilo, 'fillRef'); if (fr && num(fr, 'idx', 0) > 0) { var cr = corFilha(fr, T), base = T.fills[num(fr, 'idx', 1) - 1]; fill = base && base.localName === 'noFill' ? { tipo: 'nada' } : { tipo: 'cor', cor: cr } } }
    if (fill && fill.tipo === 'grupo') fill = null;
    var ln = linhaDe(spPr, T, estilo);
    var lw = ln ? Math.max(ln.w * I.s, .75) : 0;
    var g = geoPx(px.cx, px.cy, px.w, px.h, px.rot), vira = bx.fh !== bx.fv, giraExtra = bx.fv ? 180 : 0;
    var sombra = !!fundo(f1(spPr, 'effectLst'), 'outerShdw');

    /* 1. o desenho da forma */
    if (ehLinha || LINHAS[prst]) {
      if (ln) {
        var pts = caminhoLinha(prst, px.w, px.h, geoP);
        if (bx.fh) pts = pts.map(function (p) { return [px.w - p[0], p[1]] });
        if (bx.fv) pts = pts.map(function (p) { return [p[0], px.h - p[1]] });
        var m = Math.max(lw * 3.5, 6), cor = css(ln.cor);
        var svg = '<g transform="translate(' + r1(m) + ' ' + r1(m) + ')"><path d="M' + pts.map(function (p) { return r1(p[0]) + ' ' + r1(p[1]) }).join(' L') + '" fill="none" stroke="' + cor + '" stroke-width="' + r1(lw) + '" stroke-linecap="round" stroke-linejoin="round"' + (ln.tracejado && ln.tracejado !== 'solid' ? ' stroke-dasharray="' + tracejado(ln.tracejado, lw) + '"' : '') + '/>' +
          ponta(ln.fim, pts[pts.length - 2], pts[pts.length - 1], lw, cor) + ponta(ln.ini, pts[1], pts[0], lw, cor) + '</g>';
        var gl = geoPx(px.cx, px.cy, px.w + 2 * m, px.h + 2 * m, px.rot);
        I.objs.push(EA.novoObjeto('desenho', { nome: 'Linha', svg: svg, vw: r1(px.w + 2 * m), vh: r1(px.h + 2 * m), livre: true }, gl));
      }
    } else if (fill && fill.tipo === 'img') {
      var r = fill.blip && rels[rid(fill.blip, 'embed')];
      if (r) poeImagem(I, si, px, bx, r.alvo, fill.rect, fill.blip, prst, geoP, ln);
    } else if ((fill && fill.tipo !== 'nada' && fill.cor) || ln) {
      var corF = fill && fill.tipo !== 'nada' ? css(fill.cor) : 'transparent', grad = fill && fill.tipo === 'grad' && fill.cor2 ? { cor2: css(fill.cor2), ang: fill.ang } : null;
      var bordaCss = ln ? { borda: r1(lw), corBorda: css(ln.cor) } : {};
      var simples = prst === 'rect' || prst === 'roundRect' || prst === 'ellipse' || prst === 'flowChartAlternateProcess';
      if (simples && !(ln && ln.tracejado && ln.tracejado !== 'solid')) {
        var raio = prst === 'roundRect' ? Math.min(px.w, px.h) * aj(geoP, 'adj', 16667) / 1e5 : prst === 'flowChartAlternateProcess' ? Math.min(px.w, px.h) / 6 : 0;
        I.objs.push(EA.novoObjeto('forma', Object.assign({ forma: prst === 'ellipse' ? 'circulo' : 'ret', cor: corF, raio: r1(raio), grad: grad, sombra: sombra }, bordaCss), g));
      } else {
        var xe = xfrmDe(spPr), cam2 = geoL ? caminhoLivre(geoL, px.w, px.h, xe && xe.w, xe && xe.h) : (function () { var q = caminhoPronto(prst, px.w, px.h, geoP); return q ? [{ d: q.d, regra: q.regra }] : null })();
        if (!cam2) { avisa(I, si, 'forma "' + prst + '" (virou retângulo)'); cam2 = [{ d: poli([[0, 0], [px.w, 0], [px.w, px.h], [0, px.h]]) }] }
        var defs = '', tinta = corF;
        if (grad) {
          var gid = 'pg' + EA.uid(), an = grad.ang * Math.PI / 180, sx = Math.sin(an) / 2, sy = Math.cos(an) / 2;
          defs = '<defs><linearGradient id="' + gid + '" x1="' + r1(.5 - sx) + '" y1="' + r1(.5 + sy) + '" x2="' + r1(.5 + sx) + '" y2="' + r1(.5 - sy) + '"><stop offset="0" stop-color="' + corF + '"/><stop offset="1" stop-color="' + grad.cor2 + '"/></linearGradient></defs>';
          tinta = 'url(#' + gid + ')';
        }
        var pad = ln ? lw / 2 + 1 : 0;
        var corpo = cam2.map(function (q) {
          return '<path d="' + q.d + '" fill="' + (q.semFundo ? 'none' : tinta) + '"' + (q.regra ? ' fill-rule="' + q.regra + '"' : '') + (ln && !q.semTraco ? ' stroke="' + css(ln.cor) + '" stroke-width="' + r1(lw) + '" stroke-linejoin="round"' + (ln.tracejado && ln.tracejado !== 'solid' ? ' stroke-dasharray="' + tracejado(ln.tracejado, lw) + '"' : '') : '') + '/>';
        }).join('');
        var gd = geoPx(px.cx, px.cy, px.w + 2 * pad, px.h + 2 * pad, px.rot);
        var od = EA.novoObjeto('desenho', { nome: 'Forma do PowerPoint', svg: defs + (pad ? '<g transform="translate(' + r1(pad) + ' ' + r1(pad) + ')">' + corpo + '</g>' : corpo), vw: r1(px.w + 2 * pad), vh: r1(px.h + 2 * pad), livre: true }, gd);
        if (vira) od.props.vira = true;
        if (giraExtra) od.rot = (od.rot + giraExtra) % 360;
        if (sombra) od.props.sombra = true;
        I.objs.push(od);
      }
      if (vira && I.objs.length && I.objs[I.objs.length - 1].tipo === 'forma' && prst !== 'rect' && prst !== 'ellipse') I.objs[I.objs.length - 1].props.vira = true;
    }

    /* 2. o texto por cima, na caixa interna */
    var tx = f1(el, 'txBody');
    if (tx) {
      var body = f1(tx, 'bodyPr'), bL = phL && cam(phL, 'txBody', 'bodyPr'), bM = phM && cam(phM, 'txBody', 'bodyPr');
      var ins = function (nome, pad) { var v = body && body.getAttribute(nome); if (v == null && bL) v = bL.getAttribute(nome); if (v == null && bM) v = bM.getAttribute(nome); return (v == null ? pad : +v) * I.s };
      var pilha = [phL && cam(phL, 'txBody', 'lstStyle'), phM && cam(phM, 'txBody', 'lstStyle'), estiloMestre(I, ph), I.padraoTexto];
      if (!ph) pilha = [I.padraoTexto];
      var anc = at(body, 'anchor', null) || at(bL, 'anchor', null) || at(bM, 'anchor', null);
      var fRef = estilo && f1(estilo, 'fontRef'), corRef = fRef ? corFilha(fRef, T) : null;
      var t = texto(tx, pilha, { T: T, s: I.s, ptPx: I.ptPx, ancoraPad: anc || 't' }, rels, corRef, ph && /title|ctrTitle/.test(ph.tipo));
      if (t) {
        if (anc && !at(body, 'anchor', null)) t.props.vert = anc === 'ctr' ? 'meio' : anc === 'b' ? 'baixo' : '';
        /* 09/11: forma virada de cabeça para baixo (flipV): no PowerPoint o texto dela gira 180° junto (linhas e caixa de texto própria ficam como estavam) */
        var giraTxt = giraExtra && !pxT && !ehLinha && !LINHAS[prst] ? 180 : 0;
        var pb = pxT || px, gt = geoPx(pb.cx, pb.cy, pb.w, pb.h, (pb.rot + giraTxt) % 360, [ins('lIns', 91440), ins('tIns', 45720), ins('rIns', 91440), ins('bIns', 45720)]);
        var vertTxt = at(body, 'vert', 'horz');
        if (vertTxt === 'vert' || vertTxt === 'eaVert') gt.rot = (gt.rot + 90) % 360;
        else if (vertTxt === 'vert270') gt.rot = (gt.rot + 270) % 360;
        if (vertTxt !== 'horz' && /vert/.test(vertTxt)) { var cxg = gt.x + gt.w / 2, cyg = gt.y + gt.h / 2, tw = gt.w; gt.w = gt.h; gt.h = tw; gt.x = r1(cxg - gt.w / 2); gt.y = r1(cyg - gt.h / 2) }
        var ot = EA.novoObjeto('texto', t.props, gt);
        I.objs.push(ot);
        if (t.fonte) I.fontes[t.fonte] = 1;
        /* link para outro slide dentro do texto: vale para a caixa de texto inteira */
        if (t.links.length && !ot.acao) { var lk0 = t.links[0], act = lk0.getAttribute('action') || '', rr = rels[rid(lk0, 'id')]; if (/hlinksldjump/.test(act) && rr) ot.acao = { tipo: 'slide', alvoArq: rr.alvo }; else if (/nextslide/.test(act)) ot.acao = { tipo: 'proximo' } }
      }
    }
  }

  /* ======================= fase 3: tabelas, gráficos e SmartArt (08/11/2026) ======================= */
  var NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  function corTema(T, nome) { return corDe(xml('<a:schemeClr xmlns:a="' + NS_A + '" val="' + nome + '"/>'), T) }
  /* cor de série quando o arquivo não diz: as 6 cores de destaque do tema, depois mais escuras e mais claras */
  function corAuto(T, i) { var b = corTema(T, 'accent' + (i % 6 + 1)), v = Math.floor(i / 6) % 3; if (v === 1) b.c = b.c.map(function (c) { return c * .6 }); if (v === 2) b.c = b.c.map(function (c) { return c + (255 - c) * .4 }); b.c = b.c.map(Math.round); return b }

  /* --- tabela: fundo e linhas viram um desenho só; o texto de cada célula vira uma caixa de texto editável --- */
  /* estilo padrão do PowerPoint (Médio 2 – Ênfase 1): usado quando o arquivo aponta um estilo e não traz a receita dele */
  var TAB_PADRAO = (function () {
    var l = function (w) { return '<a:ln w="' + w + '"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln>' }, bd = '<a:left>' + l(12700) + '</a:left><a:right>' + l(12700) + '</a:right><a:top>' + l(12700) + '</a:top><a:bottom>' + l(12700) + '</a:bottom><a:insideH>' + l(12700) + '</a:insideH><a:insideV>' + l(12700) + '</a:insideV>';
    var fo = function (c) { return '<a:fill><a:solidFill><a:schemeClr val="accent1">' + c + '</a:schemeClr></a:solidFill></a:fill>' }, forte = '<a:tcTxStyle b="on"><a:schemeClr val="lt1"/></a:tcTxStyle>';
    return '<a:tblStyle xmlns:a="' + NS_A + '"><a:wholeTbl><a:tcTxStyle><a:schemeClr val="dk1"/></a:tcTxStyle><a:tcStyle><a:tcBdr>' + bd + '</a:tcBdr>' + fo('<a:tint val="20000"/>') + '</a:tcStyle></a:wholeTbl>' +
      '<a:band1H><a:tcStyle>' + fo('<a:tint val="40000"/>') + '</a:tcStyle></a:band1H><a:band1V><a:tcStyle>' + fo('<a:tint val="40000"/>') + '</a:tcStyle></a:band1V>' +
      '<a:lastCol>' + forte + '<a:tcStyle>' + fo('') + '</a:tcStyle></a:lastCol><a:firstCol>' + forte + '<a:tcStyle>' + fo('') + '</a:tcStyle></a:firstCol>' +
      '<a:lastRow>' + forte + '<a:tcStyle><a:tcBdr><a:top>' + l(38100) + '</a:top></a:tcBdr>' + fo('') + '</a:tcStyle></a:lastRow><a:firstRow>' + forte + '<a:tcStyle><a:tcBdr><a:bottom>' + l(38100) + '</a:bottom></a:tcBdr>' + fo('') + '</a:tcStyle></a:firstRow></a:tblStyle>';
  })();
  function estiloTabela(I, tblPr) {
    var id = (cam(tblPr, 'tableStyleId') || {}).textContent;
    if (!id) { var dentro = f1(tblPr, 'tableStyle'); return dentro || null }
    if (I.estilosTab && I.estilosTab[id]) return I.estilosTab[id];
    I._tabPadrao = I._tabPadrao || xml(TAB_PADRAO);
    return I._tabPadrao;
  }
  /* quais partes do estilo valem para a célula (da mais fraca para a mais forte) e a região de cada uma */
  function partesCelula(pr, r, c, nr, nc) {
    var on = function (k) { var v = at(pr, k); return v === '1' || v === 'true' }, l = [['wholeTbl', 'tudo']];
    var rb = r - (on('firstRow') ? 1 : 0), cb = c - (on('firstCol') ? 1 : 0);
    if (on('bandCol') && cb >= 0 && !(on('lastCol') && c === nc - 1)) l.push([cb % 2 ? 'band2V' : 'band1V', 'col']);
    if (on('bandRow') && rb >= 0 && !(on('lastRow') && r === nr - 1)) l.push([rb % 2 ? 'band2H' : 'band1H', 'lin']);
    if (on('lastCol') && c === nc - 1) l.push(['lastCol', 'col']);
    if (on('firstCol') && c === 0) l.push(['firstCol', 'col']);
    if (on('lastRow') && r === nr - 1) l.push(['lastRow', 'lin']);
    if (on('firstRow') && r === 0) l.push(['firstRow', 'lin']);
    return l;
  }
  function lnTab(ln, T) {
    if (!ln) return undefined;
    if (ln.localName === 'lnRef') { var cr = corFilha(ln, T); return cr ? { cor: cr, w: 12700 } : undefined }
    if (f1(ln, 'noFill')) return null;
    var cor = corFilha(f1(ln, 'solidFill'), T);
    return cor ? { cor: cor, w: num(ln, 'w', 12700) } : undefined;
  }
  function pecaTabela(I, el, px, rels, si, gc) {
    var T = I.T, tbl = fundo(el, 'tbl'); if (!tbl) return false;
    var pr = f1(tbl, 'tblPr'), est = estiloTabela(I, pr);
    var ks = I.s * gc.sx, ky = I.s * gc.sy, cols = fs(f1(tbl, 'tblGrid'), 'gridCol').map(function (g) { return num(g, 'w', 0) * ks }), linhas = fs(tbl, 'tr');
    var nc = cols.length, nr = linhas.length; if (!nc || !nr) return false;
    var alt = linhas.map(function (tr) { return num(tr, 'h', 0) * ky }), x0 = px.cx - px.w / 2, y0 = px.cy - px.h / 2;
    var cel = [];
    var fake = {};
    function negrito(b, i) { var k = b + '|' + i; if (!fake[k]) { var a = (b ? ' b="1"' : '') + (i ? ' i="1"' : ''), lv = ''; for (var q = 1; q <= 9; q++) lv += '<a:lvl' + q + 'pPr><a:defRPr' + a + '/></a:lvl' + q + 'pPr>'; fake[k] = xml('<a:lstStyle xmlns:a="' + NS_A + '">' + lv + '</a:lstStyle>') } return fake[k] }
    linhas.forEach(function (tr, r) {
      var c = 0;
      fs(tr, 'tc').forEach(function (tc) {
        if (c >= nc) return;
        var cc = c; c++;
        if (at(tc, 'hMerge') === '1' || at(tc, 'vMerge') === '1') return;
        var gs = Math.min(num(tc, 'gridSpan', 1), nc - cc), rs = Math.min(num(tc, 'rowSpan', 1), nr - r), tcPr = f1(tc, 'tcPr');
        var partes = est ? partesCelula(pr, r, cc, nr, nc) : [];
        /* fundo: o da célula ganha; senão a parte mais forte do estilo que diz algo */
        var fundoC = null, f = preenchimento(tcPr, T);
        if (f) fundoC = f.tipo === 'nada' ? null : f.cor;
        else partes.forEach(function (p) { var ts = cam(est, p[0], 'tcStyle'); if (!ts) return; var fi = f1(ts, 'fill'), fr = f1(ts, 'fillRef'); if (fi) { var q = preenchimento(fi, T); if (q) fundoC = q.tipo === 'nada' ? null : q.cor } else if (fr) fundoC = corFilha(fr, T) });
        /* texto: negrito/itálico/cor do estilo, a menos que a própria letra diga outra coisa */
        var b = false, it = false, corT = null;
        partes.forEach(function (p) { var tx = cam(est, p[0], 'tcTxStyle'); if (!tx) return; if (tx.getAttribute('b')) b = tx.getAttribute('b') === 'on'; if (tx.getAttribute('i')) it = tx.getAttribute('i') === 'on'; var co = corFilha(tx, T); if (co) corT = co });
        /* bordas: a da célula ganha; senão a do estilo, conforme a borda está na beira da tabela ou entre células */
        var bord = {};
        [['l', 'lnL'], ['r', 'lnR'], ['t', 'lnT'], ['b', 'lnB']].forEach(function (q) {
          var v = lnTab(f1(tcPr, q[1]), T);
          if (v === undefined) partes.forEach(function (p) {
            var bd = cam(est, p[0], 'tcStyle', 'tcBdr'); if (!bd) return;
            var reg = p[1], lado = q[0], nome;
            var bordaTopo = r === 0, bordaBaixo = r + rs >= nr, bordaEsq = cc === 0, bordaDir = cc + gs >= nc;
            if (lado === 'l') nome = reg === 'col' || bordaEsq ? 'left' : 'insideV';
            else if (lado === 'r') nome = reg === 'col' || bordaDir ? 'right' : 'insideV';
            else if (lado === 't') nome = reg === 'lin' || bordaTopo ? 'top' : 'insideH';
            else nome = reg === 'lin' || bordaBaixo ? 'bottom' : 'insideH';
            var e = f1(bd, nome); if (!e) return;
            var w = lnTab(f1(e, 'ln') || f1(e, 'lnRef'), T); if (w !== undefined) v = w;
          });
          bord[q[0]] = v || null;
        });
        var t = null, txb = f1(tc, 'txBody');
        if (txb) t = texto(txb, [negrito(b, it), I.padraoTexto], { T: T, s: I.s, ptPx: I.ptPx, ancoraPad: at(tcPr, 'anchor', 't') }, rels, corT, false);
        cel.push({ r: r, c: cc, gs: gs, rs: rs, fundo: fundoC, bord: bord, t: t, ins: [num(tcPr, 'marL', 91440) * ks, num(tcPr, 'marT', 45720) * ky, num(tcPr, 'marR', 91440) * ks, num(tcPr, 'marB', 45720) * ky] });
      });
    });
    /* a linha cresce quando o texto não cabe (o PowerPoint faz isso sozinho) */
    var xs = [0]; cols.forEach(function (w, i) { xs.push(xs[i] + w) });
    cel.forEach(function (q) {
      if (!q.t || q.rs > 1) return;
      var w = xs[q.c + q.gs] - xs[q.c] - q.ins[0] - q.ins[2], tam = q.t.props.tam, lin = 0, div = document.createElement('div');
      div.innerHTML = q.t.props.html;
      [].forEach.call(div.children.length ? div.children : [div], function (p) { lin += Math.max(1, Math.ceil(p.textContent.length * tam * .52 / Math.max(w, 10))) });
      var prec = lin * tam * (q.t.props.altura || 1.2) + q.ins[1] + q.ins[3];
      if (prec > alt[q.r]) alt[q.r] = prec;
    });
    var ys = [0]; alt.forEach(function (h, i) { ys.push(ys[i] + h) });
    var W = xs[nc], H = ys[nr], svg = '', traco = '';
    cel.forEach(function (q) {
      var a = xs[q.c], b = ys[q.r], c2 = xs[q.c + q.gs], d = ys[q.r + q.rs];
      if (q.fundo) svg += '<rect x="' + r1(a) + '" y="' + r1(b) + '" width="' + r1(c2 - a) + '" height="' + r1(d - b) + '" fill="' + css(q.fundo) + '"/>';
      var lado = function (l, x1, y1, x2, y2) { if (!l) return; traco += '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="' + css(l.cor) + '" stroke-width="' + r1(Math.max(l.w * I.s, .75)) + '" stroke-linecap="square"/>' };
      lado(q.bord.t, a, b, c2, b); lado(q.bord.b, a, d, c2, d); lado(q.bord.l, a, b, a, d); lado(q.bord.r, c2, b, c2, d);
    });
    var pad = 3;
    I.objs.push(EA.novoObjeto('desenho', { nome: 'Tabela (fundo e linhas)', svg: '<g transform="translate(' + pad + ' ' + pad + ')">' + svg + traco + '</g>', vw: r1(W + 2 * pad), vh: r1(H + 2 * pad), livre: true }, geoPx(x0 + W / 2, y0 + H / 2, W + 2 * pad, H + 2 * pad, 0)));
    cel.forEach(function (q) {
      if (!q.t) return;
      var a = xs[q.c], b = ys[q.r], w = xs[q.c + q.gs] - a, h = ys[q.r + q.rs] - b;
      var o = EA.novoObjeto('texto', q.t.props, geoPx(x0 + a + w / 2, y0 + b + h / 2, w, h, 0, q.ins));
      o.nome = 'Célula ' + (q.r + 1) + '×' + (q.c + 1);
      I.objs.push(o);
      if (q.t.fonte) I.fontes[q.t.fonte] = 1;
    });
    return true;
  }

  /* --- gráfico: vira um desenho fiel (barras, linhas, áreas, pizza e rosca), com eixos e legenda --- */
  function cacheDe(el) {
    if (!el) return [];
    var c = fundo(el, 'strCache') || fundo(el, 'numCache') || fundo(el, 'strLit') || fundo(el, 'numLit') || fundo(el, 'lvl'), out = [];
    fs(c, 'pt').forEach(function (p) { out[num(p, 'idx', 0)] = (f1(p, 'v') || {}).textContent });
    out.fmt = (fundo(el, 'formatCode') || {}).textContent || 'General';
    return out;
  }
  function textoRico(el) { return el ? [].map.call(el.getElementsByTagNameNS('*', 't'), function (t) { return t.textContent }).join('') : '' }
  function estiloTx(el, T, pad) {
    var d = fundo(cam(el, 'txPr'), 'defRPr'), sf = d && f1(d, 'solidFill');
    return { sz: d && d.getAttribute('sz') ? +d.getAttribute('sz') / 100 : pad.sz, cor: sf ? css(corFilha(sf, T)) : pad.cor, b: d ? d.getAttribute('b') === '1' : !!pad.b };
  }
  function formataNum(v, fmt, virgula) {
    if (v == null || isNaN(v)) return '';
    if (/[dmy]{1,4}[\/\-.][dmy]/i.test(fmt) && !/0/.test(fmt.replace(/\[.*?\]/g, ''))) { var d = new Date(Date.UTC(1899, 11, 30) + v * 864e5), z = function (n) { return (n < 10 ? '0' : '') + n }; return z(d.getUTCDate()) + '/' + z(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() }
    var pct = /%/.test(fmt), casas = (fmt.match(/\.(0+)/) || [0, ''])[1].length, n = pct ? v * 100 : v;
    var s = fmt === 'General' || !/0/.test(fmt) ? String(Math.round(n * 1e6) / 1e6) : n.toFixed(casas);
    if (/#,##/.test(fmt) || Math.abs(n) >= 10000) { var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, virgula ? '.' : ','); s = p.join(virgula ? ',' : '.') }
    else if (virgula) s = s.replace('.', ',');
    var pre = (fmt.match(/^"([^"]*)"/) || [0, ''])[1] || (/R\$/.test(fmt) ? 'R$ ' : /\$/.test(fmt) ? '$' : /€/.test(fmt) ? '€ ' : '');
    return pre + s + (pct ? '%' : '');
  }
  function passoBonito(bruto) { if (!(bruto > 0) || !isFinite(bruto)) return 1; var mag = Math.pow(10, Math.floor(Math.log10(bruto))), n = bruto / mag; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag }
  function escalaBonita(mn, mx, alvo, eixo) {
    var smin = eixo && cam(eixo, 'scaling', 'min'), smax = eixo && cam(eixo, 'scaling', 'max'), mu = eixo && f1(eixo, 'majorUnit');
    if (mn > 0) mn = 0; if (mx < 0) mx = 0;
    if (mx === mn) mx = mn + 1;
    alvo = alvo > 2 ? alvo : 2;
    var faixa = mx - mn, passo = mu ? num(mu, 'val', 1) : 0;
    if (!(passo > 0) || !isFinite(passo)) passo = passoBonito(faixa / alvo);
    var a = smin ? num(smin, 'val', 0) : (mn < 0 ? Math.floor((mn - faixa * .05) / passo) * passo : 0);
    var b = smax ? num(smax, 'val', 1) : Math.ceil((mx + faixa * .05) / passo) * passo;
    if (!isFinite(a)) a = 0; if (!isFinite(b)) b = a + passo;
    if (b <= a) b = a + passo;
    /* 09/11: com mínimo ou máximo fixo no eixo, o passo sai da faixa do eixo (não da dos dados); e nunca mais que ~40 marcas */
    if (!mu && (smin || smax) && ((b - a) / passo > alvo * 2 + 2 || (b - a) / passo < .999)) passo = passoBonito((b - a) / alvo);
    if ((b - a) / passo > 40) passo = passoBonito((b - a) / Math.min(alvo, 20));
    var marcas = []; for (var v = a; v <= b + passo * 1e-6 && marcas.length < 60; v += passo) marcas.push(Math.round(v * 1e9) / 1e9);
    return { min: a, max: b, marcas: marcas };
  }
  function graficoSvg(I, C, W, H, k) {
    var T = I.T, ch = cam(C, 'chart'), plot = ch && f1(ch, 'plotArea'); if (!plot) return null;
    var lang = at(cam(C, 'lang'), 'val', 'pt-BR'), virgula = !/^en|^ja|^zh|^ko/i.test(lang);
    var fonte = (familiaCss(T.fonteCorpo) ? familiaCss(T.fonteCorpo) + ',' : '') + "'Segoe UI',Arial,sans-serif", ptPx = function (pt) { return pt * 12700 * k };
    var cinza = css(corDe(xml('<a:schemeClr xmlns:a="' + NS_A + '" val="tx1"><a:lumMod val="65000"/><a:lumOff val="35000"/></a:schemeClr>'), T));
    var base = estiloTx(C, T, { sz: 10, cor: cinza });
    var grupos = [], tipo = null, outros = [];
    for (var e = plot.firstElementChild; e; e = e.nextElementSibling) if (/Chart$/.test(e.localName)) { if (!tipo) tipo = e; grupos.push(e) }
    if (!tipo) return null;
    var nome = tipo.localName.replace('3D', ''), SUP = { barChart: 1, lineChart: 1, areaChart: 1, pieChart: 1, doughnutChart: 1, ofPieChart: 1, scatterChart: 1, radarChart: 0 };
    if (!SUP[nome]) return null;
    grupos.slice(1).forEach(function (g) { outros.push(g.localName) });
    var pizza = nome === 'pieChart' || nome === 'doughnutChart' || nome === 'ofPieChart';
    var series = [];
    grupos.forEach(function (g) {
      var gn = g.localName.replace('3D', '');
      if (gn !== nome && !(gn === 'lineChart' && nome === 'barChart')) return;   // combinação barra+linha: desenha as duas
      fs(g, 'ser').forEach(function (s) {
        var sp = f1(s, 'spPr'), fi = preenchimento(sp, T), ln = f1(sp, 'ln'), lnCor = ln && f1(ln, 'solidFill') ? corFilha(f1(ln, 'solidFill'), T) : null;
        var i = num(f1(s, 'idx'), 'val', series.length), vals = cacheDe(f1(s, 'val') || f1(s, 'yVal')), cats = cacheDe(f1(s, 'cat') || f1(s, 'xVal'));
        var dpt = {}; fs(s, 'dPt').forEach(function (d) { var q = preenchimento(f1(d, 'spPr'), T); if (q && q.cor) dpt[num(f1(d, 'idx'), 'val', 0)] = q.cor });
        var mk = cam(s, 'marker', 'symbol'), dl = f1(s, 'dLbls') || f1(g, 'dLbls');
        series.push({
          nome: textoRico(f1(s, 'tx')) || 'Série ' + (series.length + 1), tipo: gn, vals: vals, cats: cats, fmt: vals.fmt,
          cor: (fi && fi.tipo !== 'nada' && fi.cor) || lnCor || corAuto(T, i), semFundo: fi && fi.tipo === 'nada', lnCor: lnCor, lnW: ln ? num(ln, 'w', 28575) : 28575, semLinha: ln && !!f1(ln, 'noFill'),
          dpt: dpt, marca: mk ? at(mk, 'val', 'none') !== 'none' : (gn === 'lineChart' && at(f1(g, 'marker'), 'val', '0') === '1' && !f1(s, 'marker')),
          rotulo: dl && at(f1(dl, 'showVal'), 'val', '0') === '1', rotPct: dl && at(f1(dl, 'showPercent'), 'val', '0') === '1', rotStx: dl ? estiloTx(dl, T, base) : base
        });
      });
    });
    if (!series.length) return null;
    var nCat = Math.max.apply(null, series.map(function (s) { return Math.max(s.vals.length, s.cats.length) }).concat([1]));
    var cats = series[0].cats.length ? series[0].cats : [];
    var catFmt = series[0].cats.fmt || 'General', catsTxt = []; for (var ci = 0; ci < nCat; ci++) { var cv = cats[ci]; catsTxt.push(cv == null ? String(ci + 1) : (/^-?\d+(\.\d+)?$/.test(cv) && catFmt !== 'General' ? formataNum(+cv, catFmt, virgula) : cv)) }
    var o = '', mede = function (s, pt) { return String(s).length * ptPx(pt) * .55 }, txt = function (x, y, s, st, anc, extra) { return '<text x="' + r1(x) + '" y="' + r1(y) + '" font-size="' + r1(ptPx(st.sz)) + '" fill="' + st.cor + '" font-family="' + fonte + '"' + (st.b ? ' font-weight="700"' : '') + ' text-anchor="' + (anc || 'middle') + '"' + (extra || '') + '>' + EA.esc(String(s)) + '</text>' };
    /* fundo do gráfico */
    var fdC = preenchimento(f1(C, 'spPr'), T); if (fdC && fdC.tipo !== 'nada' && fdC.cor) o += '<rect width="' + r1(W) + '" height="' + r1(H) + '" fill="' + css(fdC.cor) + '"/>';
    var mg = ptPx(9), top = mg, bot = H - mg, esq = mg, dir = W - mg;
    /* título */
    var tit = f1(ch, 'title');
    /* sem título escrito, o PowerPoint põe o nome da série quando o gráfico tem uma série só */
    if (tit || (at(f1(ch, 'autoTitleDeleted'), 'val', '0') !== '1' && series.length === 1)) {
      var tt = textoRico(cam(tit, 'tx', 'rich')) || (series.length === 1 ? series[0].nome : ''), tst = estiloTx(tit, T, { sz: 14, cor: cinza });
      var rr = fundo(cam(tit, 'tx', 'rich'), 'defRPr'); if (rr && rr.getAttribute('sz')) tst.sz = +rr.getAttribute('sz') / 100;
      if (tt) { o += txt(W / 2, top + ptPx(tst.sz), tt, tst); top += ptPx(tst.sz) * 1.6 }
    }
    /* legenda */
    var leg = f1(ch, 'legend'), porPonto = pizza || at(cam(tipo, 'varyColors'), 'val', '0') === '1' && series.length === 1;
    var corPonto = function (s, i) { return s.dpt[i] || (porPonto ? corAuto(T, i) : s.cor) };
    if (leg) {
      var pos = at(cam(leg, 'legendPos'), 'val', 'r'), lst = estiloTx(leg, T, base), itens = porPonto ? catsTxt.map(function (c, i) { return { t: c, cor: corPonto(series[0], i), linha: false } }) : series.map(function (s) { return { t: s.nome, cor: s.tipo === 'lineChart' ? (s.lnCor || s.cor) : s.cor, linha: s.tipo === 'lineChart' } });
      var fpx = ptPx(lst.sz), chave = fpx * .7;
      if (nome === 'barChart' && at(cam(tipo, 'barDir'), 'val', 'col') === 'bar' && !porPonto) itens.reverse();
      if (pos === 'r' || pos === 'l') {
        var lw = Math.max.apply(null, itens.map(function (q) { return mede(q.t, lst.sz) })) + chave + fpx * .8, y = (top + bot) / 2 - itens.length * fpx * 1.5 / 2, xL = pos === 'r' ? dir - lw : esq;
        itens.forEach(function (q, i) { var yy = y + i * fpx * 1.5; o += q.linha ? '<line x1="' + r1(xL) + '" x2="' + r1(xL + chave) + '" y1="' + r1(yy + fpx * .5) + '" y2="' + r1(yy + fpx * .5) + '" stroke="' + css(q.cor) + '" stroke-width="2"/>' : '<rect x="' + r1(xL) + '" y="' + r1(yy + fpx * .15) + '" width="' + r1(chave) + '" height="' + r1(chave) + '" fill="' + css(q.cor) + '"/>'; o += txt(xL + chave + fpx * .35, yy + fpx * .8, q.t, lst, 'start') });
        if (pos === 'r') dir -= lw + fpx; else esq += lw + fpx;
      } else {
        var larg = itens.map(function (q) { return chave + fpx * .3 + mede(q.t, lst.sz) + fpx }), tot = larg.reduce(function (a, b) { return a + b }, 0), x = W / 2 - tot / 2, yl = pos === 't' ? top + fpx : bot - fpx * .3;
        itens.forEach(function (q, i) { o += q.linha ? '<line x1="' + r1(x) + '" x2="' + r1(x + chave) + '" y1="' + r1(yl - fpx * .3) + '" y2="' + r1(yl - fpx * .3) + '" stroke="' + css(q.cor) + '" stroke-width="2"/>' : '<rect x="' + r1(x) + '" y="' + r1(yl - fpx * .3 - chave / 2) + '" width="' + r1(chave) + '" height="' + r1(chave) + '" fill="' + css(q.cor) + '"/>'; o += txt(x + chave + fpx * .3, yl, q.t, lst, 'start'); x += larg[i] });
        if (pos === 't') top += fpx * 1.8; else bot -= fpx * 1.8;
      }
    }
    /* pizza e rosca */
    if (pizza) {
      var s0 = series[0], vs = []; for (var pi = 0; pi < nCat; pi++) vs.push(Math.max(+s0.vals[pi] || 0, 0));
      var soma = vs.reduce(function (a, b) { return a + b }, 0) || 1, cx = (esq + dir) / 2, cy = (top + bot) / 2, R = Math.min(dir - esq, bot - top) / 2 * .92;
      var furo = nome === 'doughnutChart' ? num(cam(tipo, 'holeSize'), 'val', 50) / 100 : 0, ang = num(cam(tipo, 'firstSliceAng'), 'val', 0) * Math.PI / 180;
      var borda = s0.semLinha ? '' : ' stroke="' + css(s0.lnCor || corTema(T, 'lt1')) + '" stroke-width="' + r1(Math.max(s0.lnW * k, .75)) + '" stroke-linejoin="round"';
      var pt = function (a, r) { return r1(cx + r * Math.sin(a)) + ' ' + r1(cy - r * Math.cos(a)) };
      vs.forEach(function (v, i) {
        if (!v) return;
        var a1 = ang, a2 = ang + v / soma * Math.PI * 2, big = a2 - a1 > Math.PI ? 1 : 0, d;
        if (v >= soma * .9999) d = furo ? 'M' + pt(0, R) + ' A' + r1(R) + ' ' + r1(R) + ' 0 1 1 ' + pt(Math.PI, R) + ' A' + r1(R) + ' ' + r1(R) + ' 0 1 1 ' + pt(0, R) + ' Z M' + pt(0, R * furo) + ' A' + r1(R * furo) + ' ' + r1(R * furo) + ' 0 1 0 ' + pt(Math.PI, R * furo) + ' A' + r1(R * furo) + ' ' + r1(R * furo) + ' 0 1 0 ' + pt(0, R * furo) + ' Z' : '';
        else if (furo) d = 'M' + pt(a1, R) + ' A' + r1(R) + ' ' + r1(R) + ' 0 ' + big + ' 1 ' + pt(a2, R) + ' L' + pt(a2, R * furo) + ' A' + r1(R * furo) + ' ' + r1(R * furo) + ' 0 ' + big + ' 0 ' + pt(a1, R * furo) + ' Z';
        else d = 'M' + r1(cx) + ' ' + r1(cy) + ' L' + pt(a1, R) + ' A' + r1(R) + ' ' + r1(R) + ' 0 ' + big + ' 1 ' + pt(a2, R) + ' Z';
        if (!d) d = 'M' + pt(0, R) + ' A' + r1(R) + ' ' + r1(R) + ' 0 1 1 ' + pt(Math.PI, R) + ' A' + r1(R) + ' ' + r1(R) + ' 0 1 1 ' + pt(0, R) + ' Z';
        o += '<path d="' + d + '" fill="' + css(corPonto(s0, i)) + '" fill-rule="evenodd"' + borda + '/>';
        ang = a2;
      });
      if (s0.rotulo || s0.rotPct) {
        ang = num(cam(tipo, 'firstSliceAng'), 'val', 0) * Math.PI / 180;
        vs.forEach(function (v, i) { var a = ang + v / soma * Math.PI; ang += v / soma * Math.PI * 2; if (!v) return; var r = furo ? R * (1 + furo) / 2 : R * .65; o += txt(cx + r * Math.sin(a), cy - r * Math.cos(a) + ptPx(s0.rotStx.sz) * .35, s0.rotPct ? Math.round(v / soma * 100) + '%' : formataNum(v, s0.fmt, virgula), s0.rotStx) });
      }
      return { svg: o, outros: outros };
    }
    /* barras, linhas e áreas: eixos */
    var catAx = f1(plot, 'catAx') || f1(plot, 'dateAx') || fs(plot, 'valAx')[1], valAx = nome === 'scatterChart' ? fs(plot, 'valAx')[0] : f1(plot, 'valAx');
    /* 09/11: dispersão tem dois eixos de valor. O de baixo/cima (axPos b ou t) é o X e o do lado (l ou r) é o Y; sem essa informação, o primeiro é o X */
    var disp = nome === 'scatterChart';
    if (disp) {
      var eixosV = fs(plot, 'valAx'), posAx = function (e) { return at(f1(e, 'axPos'), 'val', '') };
      var eX = eixosV.filter(function (e) { return /^[bt]$/.test(posAx(e)) })[0], eY = eixosV.filter(function (e) { return /^[lr]$/.test(posAx(e)) })[0];
      if (!eX) eX = eixosV.filter(function (e) { return e !== eY })[0];
      if (!eY) eY = eixosV.filter(function (e) { return e !== eX })[0];
      catAx = eX || null; valAx = eY || null;
    }
    var deitado = nome === 'barChart' && at(cam(tipo, 'barDir'), 'val', 'col') === 'bar';
    var agrup = at(cam(tipo, 'grouping'), 'val', nome === 'barChart' ? 'clustered' : 'standard'), empilha = agrup === 'stacked' || agrup === 'percentStacked', pct = agrup === 'percentStacked';
    var principais = series.filter(function (s) { return s.tipo === nome });
    var vmin = Infinity, vmax = -Infinity, somaCat = [];
    for (var c = 0; c < nCat; c++) {
      var pos2 = 0, neg = 0;
      series.forEach(function (s) { var v = +s.vals[c]; if (isNaN(v)) return; if (empilha && s.tipo === nome) { if (v >= 0) pos2 += v; else neg += v } else { vmin = Math.min(vmin, v); vmax = Math.max(vmax, v) } });
      if (empilha) { vmin = Math.min(vmin, neg); vmax = Math.max(vmax, pos2); somaCat[c] = pos2 - neg || 1 }
    }
    if (!isFinite(vmin)) { vmin = 0; vmax = 1 }
    if (pct) { vmin = 0; vmax = 1 }
    var axSt = estiloTx(valAx, T, base), catSt = estiloTx(catAx, T, base), mostraVal = valAx && at(f1(valAx, 'delete'), 'val', '0') !== '1', mostraCat = catAx && at(f1(catAx, 'delete'), 'val', '0') !== '1';
    var compr = deitado ? dir - esq : bot - top, esc = escalaBonita(vmin, vmax, compr / (ptPx(axSt.sz) * (deitado ? 6 : 2.6)), valAx);
    if (pct) esc = { min: 0, max: 1, marcas: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1] };
    var fmtVal = pct ? '0%' : (valAx && at(f1(valAx, 'numFmt'), 'sourceLinked', '1') === '0' ? at(f1(valAx, 'numFmt'), 'formatCode', 'General') : series[0].fmt || 'General');
    var rotV = esc.marcas.map(function (v) { return formataNum(v, fmtVal, virgula) });
    /* espaço dos rótulos dos eixos */
    if (deitado) {
      if (mostraCat) esq += Math.max.apply(null, catsTxt.map(function (q) { return mede(q, catSt.sz) })) + ptPx(catSt.sz) * .6;
      if (mostraVal) bot -= ptPx(axSt.sz) * 1.6;
    } else {
      if (mostraVal) esq += Math.max.apply(null, rotV.map(function (q) { return mede(q, axSt.sz) })) + ptPx(axSt.sz) * .6;
      if (mostraCat) bot -= ptPx(catSt.sz) * 1.7;
    }
    top += ptPx(axSt.sz) * .6; dir -= ptPx(axSt.sz) * .6;
    var valPos = function (v) { var f = (v - esc.min) / (esc.max - esc.min); return deitado ? esq + f * (dir - esq) : bot - f * (bot - top) };
    var entre = !(nome === 'areaChart' || at(cam(valAx, 'crossBetween'), 'val', 'between') === 'midCat') || nome === 'barChart';
    var catPos = function (i) { var L = deitado ? bot - top : dir - esq, n = entre ? nCat : Math.max(nCat - 1, 1), p = entre ? (i + .5) / n : i / n; return deitado ? bot - p * L : esq + p * L };
    /* 09/11: na dispersão cada ponto vai no lugar do valor X dele (antes iam um ao lado do outro, pela ordem); X sem número conta 1, 2, 3… */
    var escX = null, xDe = function (s, i) { var q = s.cats[i], v = +q; return q == null || q === '' || isNaN(v) ? i + 1 : v };
    if (disp) {
      var xmn = Infinity, xmx = -Infinity;
      series.forEach(function (s) { for (var i = 0; i < s.vals.length; i++) { if (isNaN(+s.vals[i])) continue; var v = xDe(s, i); xmn = Math.min(xmn, v); xmx = Math.max(xmx, v) } });
      if (!isFinite(xmn)) { xmn = 0; xmx = 1 }
      escX = escalaBonita(xmn, xmx, (dir - esq) / (ptPx(catSt.sz) * 6), catAx);
    }
    var xPos = function (v) { return esq + (v - escX.min) / (escX.max - escX.min) * (dir - esq) };
    var grade = valAx && f1(valAx, 'majorGridlines');
    if (grade) { var gl = lnTab(cam(grade, 'spPr', 'ln'), T), gc = gl ? css(gl.cor) : '#d9d9d9'; esc.marcas.forEach(function (v) { var p = valPos(v); o += deitado ? '<line x1="' + r1(p) + '" x2="' + r1(p) + '" y1="' + r1(top) + '" y2="' + r1(bot) + '" stroke="' + gc + '" stroke-width="1"/>' : '<line x1="' + r1(esq) + '" x2="' + r1(dir) + '" y1="' + r1(p) + '" y2="' + r1(p) + '" stroke="' + gc + '" stroke-width="1"/>' }) }
    if (mostraVal) esc.marcas.forEach(function (v, i) { var p = valPos(v); o += deitado ? txt(p, bot + ptPx(axSt.sz) * 1.25, rotV[i], axSt) : txt(esq - ptPx(axSt.sz) * .5, p + ptPx(axSt.sz) * .35, rotV[i], axSt, 'end') });
    /* séries */
    var nBar = empilha ? 1 : principais.length, gap = num(cam(tipo, 'gapWidth'), 'val', 150) / 100, ov = empilha ? 1 : num(cam(tipo, 'overlap'), 'val', 0) / 100;
    var faixa = (deitado ? bot - top : dir - esq) / nCat, larB = faixa / (nBar - (nBar - 1) * ov + gap), acPos = [], acNeg = [];
    var desenha = function (s, si2) {
      if (s.tipo === 'barChart') {
        for (var c = 0; c < nCat; c++) {
          var v = +s.vals[c]; if (isNaN(v)) continue;
          if (pct) v = v / somaCat[c];
          var ini = 0;
          if (empilha) { if (v >= 0) { ini = acPos[c] || 0; acPos[c] = ini + v } else { ini = acNeg[c] || 0; acNeg[c] = ini + v } }
          var p0 = valPos(Math.max(Math.min(ini, esc.max), esc.min)), p1 = valPos(Math.max(Math.min(ini + v, esc.max), esc.min));
          var centro = catPos(c), x0b = deitado ? centro + faixa / 2 - larB * gap / 2 - (empilha ? 0 : si2 * larB * (1 - ov)) - larB : centro - faixa / 2 + larB * gap / 2 + (empilha ? 0 : si2 * larB * (1 - ov));
          var cor = css(corPonto(s, c));
          if (deitado) o += '<rect x="' + r1(Math.min(p0, p1)) + '" y="' + r1(x0b) + '" width="' + r1(Math.abs(p1 - p0)) + '" height="' + r1(larB) + '" fill="' + (s.semFundo ? 'none' : cor) + '"/>';
          else o += '<rect x="' + r1(x0b) + '" y="' + r1(Math.min(p0, p1)) + '" width="' + r1(larB) + '" height="' + r1(Math.abs(p1 - p0)) + '" fill="' + (s.semFundo ? 'none' : cor) + '"/>';
          if (s.rotulo) o += deitado ? txt(empilha ? (p0 + p1) / 2 : p1 + ptPx(s.rotStx.sz) * .3, x0b + larB / 2 + ptPx(s.rotStx.sz) * .35, formataNum(+s.vals[c], s.fmt, virgula), s.rotStx, empilha ? 'middle' : 'start') : txt(x0b + larB / 2, empilha ? (p0 + p1) / 2 + ptPx(s.rotStx.sz) * .35 : p1 - ptPx(s.rotStx.sz) * .4, formataNum(+s.vals[c], s.fmt, virgula), s.rotStx);
        }
      } else {
        var pts = [], base0 = [];
        for (var c2 = 0; c2 < nCat; c2++) {
          var v2 = +s.vals[c2]; if (isNaN(v2)) { if (s.tipo === 'areaChart') v2 = 0; else continue }
          if (pct) v2 = v2 / somaCat[c2];
          var b0 = empilha && s.tipo === nome ? (acPos[c2] || 0) : 0;
          if (empilha && s.tipo === nome) acPos[c2] = b0 + v2;
          var xp = disp ? xPos(xDe(s, c2)) : catPos(c2);
          pts.push([xp, valPos(b0 + v2), c2]); base0.push([xp, valPos(b0)]);   // 09/11: o ponto guarda de qual casa veio (para o rótulo)
        }
        if (!pts.length) return;
        var lc = css(s.lnCor || s.cor), lw = r1(Math.max(s.lnW * k, 1));
        if (s.tipo === 'areaChart') o += '<path d="M' + pts.map(function (p) { return r1(p[0]) + ' ' + r1(p[1]) }).join(' L') + ' L' + base0.slice().reverse().map(function (p) { return r1(p[0]) + ' ' + r1(p[1]) }).join(' L') + ' Z" fill="' + css(s.cor) + '"' + (s.lnCor ? ' stroke="' + lc + '" stroke-width="' + lw + '"' : '') + '/>';
        else if (!s.semLinha) o += '<path d="M' + pts.map(function (p) { return r1(p[0]) + ' ' + r1(p[1]) }).join(' L') + '" fill="none" stroke="' + lc + '" stroke-width="' + lw + '" stroke-linejoin="round" stroke-linecap="round"/>';
        if (s.marca || s.tipo === 'scatterChart' && s.semLinha) pts.forEach(function (p) { o += '<circle cx="' + r1(p[0]) + '" cy="' + r1(p[1]) + '" r="' + r1(Math.max(+lw * 1.6, 3)) + '" fill="' + lc + '"/>' });
        /* 09/11: o rótulo usa a casa de onde o ponto veio; com uma casa vazia no meio, os seguintes mostravam o valor do vizinho */
        if (s.rotulo) pts.forEach(function (p) { o += txt(p[0], p[1] - ptPx(s.rotStx.sz) * .6, formataNum(+s.vals[p[2]], s.fmt, virgula), s.rotStx) });
      }
    };
    var nb = 0;
    series.forEach(function (s) { if (s.tipo === 'areaChart') desenha(s, 0) });
    series.forEach(function (s) { if (s.tipo === 'barChart') desenha(s, nb++) });
    acPos = []; series.forEach(function (s) { if (s.tipo === 'lineChart' || s.tipo === 'scatterChart') desenha(s, 0) });
    /* eixo das categorias por cima */
    var eixoLn = catAx && lnTab(cam(catAx, 'spPr', 'ln'), T);
    if (eixoLn && mostraCat) { var pz = valPos(Math.max(esc.min, Math.min(0, esc.max))); o += deitado ? '<line x1="' + r1(pz) + '" x2="' + r1(pz) + '" y1="' + r1(top) + '" y2="' + r1(bot) + '" stroke="' + css(eixoLn.cor) + '" stroke-width="1"/>' : '<line x1="' + r1(esq) + '" x2="' + r1(dir) + '" y1="' + r1(pz) + '" y2="' + r1(pz) + '" stroke="' + css(eixoLn.cor) + '" stroke-width="1"/>' }
    if (mostraCat && disp) {
      /* 09/11: dispersão: embaixo vão os números do eixo X, cada um no lugar do seu valor */
      var fmtX = at(f1(catAx, 'numFmt'), 'sourceLinked', '1') === '0' ? at(f1(catAx, 'numFmt'), 'formatCode', 'General') : series[0].cats.fmt || 'General';
      escX.marcas.forEach(function (v) { o += txt(xPos(v), bot + ptPx(catSt.sz) * 1.25, formataNum(v, fmtX, virgula), catSt) });
    } else if (mostraCat) {
      var cada = 1, maxL = Math.max.apply(null, catsTxt.map(function (q) { return mede(q, catSt.sz) })), espaco = (deitado ? bot - top : dir - esq) / Math.max(entre ? nCat : nCat - 1, 1);
      if (!deitado && maxL > espaco * .95) cada = Math.ceil(maxL / (espaco * .95));
      catsTxt.forEach(function (q, i) { if (i % cada) return; var p = catPos(i); o += deitado ? txt(esq - ptPx(catSt.sz) * .5, p + ptPx(catSt.sz) * .35, q, catSt, 'end') : txt(p, bot + ptPx(catSt.sz) * 1.25, q, catSt) });
    }
    return { svg: o, outros: outros };
  }
  function pecaGrafico(I, el, px, rels, si, gc, xEmu) {
    var r = rels[rid(fundo(el, 'chart'), 'id')], P = r && I.partes && I.partes[r.alvo];
    if (!P || !P.x) return false;
    var k = px.w / Math.max(xEmu.w, 1), g = graficoSvg(I, P.x, px.w, px.h, k);
    if (!g) return false;
    I.nGraficos = (I.nGraficos || 0) + 1;
    I.objs.push(EA.novoObjeto('desenho', { nome: 'Gráfico do PowerPoint', svg: g.svg, vw: r1(px.w), vh: r1(px.h), livre: true }, geoPx(px.cx, px.cy, px.w, px.h, px.rot)));
    if (g.outros.length) avisa(I, si, 'gráfico combinado (só a parte principal veio)');
    return true;
  }

  /* --- SmartArt: o PowerPoint guarda junto o desenho pronto dele; cada forma vira forma + texto, como no resto do slide --- */
  function pecaSmartArt(I, el, x, gc, rels, si) {
    var ids = fundo(el, 'relIds'), dm = ids && rels[rid(ids, 'dm')], D = dm && I.partes && I.partes[dm.alvo], alvo = null;
    var ext = D && D.x && fundo(D.x, 'dataModelExt'), rr = ext && rels[ext.getAttribute('relId')];
    if (rr) alvo = rr.alvo;
    if (!alvo) { var so = Object.keys(rels).map(function (q) { return rels[q] }).filter(function (q) { return q.tipo === 'diagramDrawing' }); if (so.length === 1) alvo = so[0].alvo }
    var G = alvo && I.partes && I.partes[alvo], arv = G && G.x && fundo(G.x, 'spTree');
    if (!arv) return false;
    processaArvore(I, arv, grupoCtx(gc, { x: x.x, y: x.y, w: x.w, h: x.h, rot: 0, fh: false, fv: false, chOff: null, chExt: null }), G.rels, si, 'diagrama');
    return true;
  }

  /* ---------- fundo do slide (do slide, senão do layout, senão do mestre) ---------- */
  function fundoDe(I, arvores, relsLista) {
    for (var i = 0; i < arvores.length; i++) {
      var bg = cam(arvores[i], 'cSld', 'bg'); if (!bg) continue;
      var pr = f1(bg, 'bgPr'), ref = f1(bg, 'bgRef'), f = null;
      if (pr) f = preenchimento(pr, I.T);
      else if (ref) { var cr = corFilha(ref, I.T), idx = num(ref, 'idx', 0); f = idx >= 1001 ? { tipo: 'cor', cor: cr } : { tipo: 'cor', cor: cr } }
      if (!f) continue;
      if (f.tipo === 'cor' && f.cor) return Promise.resolve({ tipo: 'cor', cor: css(f.cor) });
      if (f.tipo === 'grad') return Promise.resolve({ tipo: 'gradiente', cor: css(f.cor), cor2: css(f.cor2), ang: f.ang });
      if (f.tipo === 'img') { var r = f.blip && relsLista[i][rid(f.blip, 'embed')]; if (r) return midiaDe(I, r.alvo).then(function (m) { return m.erro ? { tipo: 'tema', cor: '' } : { tipo: 'imagem', midia: m.id } }) }
      if (f.tipo === 'nada') return Promise.resolve({ tipo: 'cor', cor: '#ffffff' });
    }
    return Promise.resolve({ tipo: 'cor', cor: '#ffffff' });
  }

  function notasDe(zip, rels) {
    var r = relTipo(rels, 'notesSlide'); if (!r) return Promise.resolve('');
    return zip.texto(r.alvo).then(function (t) {
      var x = xml(t); if (!x) return '';
      var corpo = [].filter.call(x.getElementsByTagNameNS('*', 'sp'), function (s) { var p = phDe(s); return p && p.tipo === 'body' })[0];
      if (!corpo) return '';
      return fs(f1(corpo, 'txBody'), 'p').map(function (p) { return [].map.call(p.getElementsByTagNameNS('*', 't'), function (q) { return q.textContent }).join('') }).join('\n').trim();
    }).catch(function (e) { console.warn('importar pptx (anotações):', e); return '' });   // 09/11: anotação que não abre não derruba o slide
  }

  /* ---------- tudo ---------- */
  EA.ImportarPptx = {
    abrir: function (arquivo, progresso) {
      progresso = progresso || nada;
      var I = { cache: {}, faltas: {}, fontes: {}, esperas: [] }, nomeArq = arquivo.name.replace(/\.pptx$/i, '');
      return arquivo.arrayBuffer().then(function (buf) {
        I.zip = abreZip(buf);
        return Promise.all([I.zip.texto('ppt/presentation.xml'), relsDe(I.zip, 'ppt/presentation.xml'), I.zip.texto('ppt/tableStyles.xml')]);
      }).then(function (r) {
        var pres = xml(r[0]), prels = r[1];
        I.estilosTab = {}; fs(xml(r[2]), 'tblStyle').forEach(function (e) { I.estilosTab[e.getAttribute('styleId')] = e });
        if (!pres) throw new Error('não achei a apresentação dentro do arquivo');
        var sz = cam(pres, 'sldSz'), cx = num(sz, 'cx', 12192000), cy = num(sz, 'cy', 6858000);
        I.emPe = cy > cx;
        var W = I.emPe ? EA.H : EA.W, H = I.emPe ? EA.W : EA.H;
        I.s = Math.min(W / cx, H / cy); I.ox = (W - cx * I.s) / 2; I.oy = (H - cy * I.s) / 2; I.ptPx = 12700 * I.s; I.larg = cx * I.s; I.alt = cy * I.s;
        I.padraoTexto = cam(pres, 'defaultTextStyle');
        I.p = EA.novoProjeto(nomeArq);
        I.slidesArq = fs(cam(pres, 'sldIdLst'), 'sldId').map(function (s) { var q = prels[rid(s, 'id')]; return q && q.alvo }).filter(Boolean);
        I.ids = {}; I.slidesArq.forEach(function (a) { I.ids[a] = EA.uid() });
        var cacheParte = {};
        function parte(c) { if (!cacheParte[c]) cacheParte[c] = Promise.all([I.zip.texto(c), relsDe(I.zip, c)]).then(function (q) { return { x: xml(q[0]), rels: q[1], caminho: c } }); return cacheParte[c] }
        var seq = Promise.resolve();
        I.slidesArq.forEach(function (arq, si) {
          seq = seq.then(function () {
            progresso(si + 1, I.slidesArq.length);
            return parte(arq).then(function (S) {
              /* 09/11: slide sem o que precisa (arquivo, layout, mestre) é pulado com aviso, em vez de derrubar a apresentação inteira */
              var rl = relTipo(S.rels, 'slideLayout');
              if (!cam(S.x, 'cSld', 'spTree')) throw new Error('slide sem conteúdo legível');
              if (!rl || !rl.alvo) throw new Error('slide sem layout');
              return parte(rl.alvo).then(function (L) {
                var rm = relTipo(L.rels, 'slideMaster');
                if (!rm || !rm.alvo) throw new Error('layout sem mestre');
                return parte(rm.alvo).then(function (M) {
                  var rt = relTipo(M.rels, 'theme');
                  /* gráficos e SmartArt moram em arquivos à parte: lidos antes de montar o slide */
                  var aParte = Object.keys(S.rels).map(function (q) { return S.rels[q] }).filter(function (q) { return !q.fora && /^(chart|diagramDrawing|diagramData)$/.test(q.tipo) && I.zip.tem(q.alvo) });
                  return Promise.all([rt ? parte(rt.alvo) : Promise.resolve({ x: null })].concat(aParte.map(function (q) { return parte(q.alvo) }))).then(function (lido) {
                    var Tm = lido[0]; I.partes = {}; lido.slice(1).forEach(function (q) { I.partes[q.caminho] = q });
                    if (!Tm.temaLido) Tm.temaLido = leTema(Tm.x, M.x);
                    /* 09/11: slide ou layout que troca o mapa de cores do mestre (clrMapOvr; comum em slide escuro de modelo claro): vale o do slide, senão o do layout */
                    var troca = cam(S.x, 'clrMapOvr', 'overrideClrMapping') || cam(L.x, 'clrMapOvr', 'overrideClrMapping');
                    I.T = troca ? temaComMapa(Tm.temaLido, troca) : Tm.temaLido; I.mestre = M.x; I.mestreArv = cam(M.x, 'cSld', 'spTree'); I.layoutArv = cam(L.x, 'cSld', 'spTree');
                    I.objs = []; I.esperas = []; I.porId = {}; I.midias = {}; I.extras = [];
                    var raiz = { mapa: function (x, y) { return [x, y] }, sx: 1, sy: 1, rot: 0, fh: false, fv: false };
                    var mostraMestre = at(S.x, 'showMasterSp', '1') !== '0';
                    if (mostraMestre && at(L.x, 'showMasterSp', '1') !== '0') processaArvore(I, I.mestreArv, raiz, M.rels, si, 'mestre');
                    if (mostraMestre) processaArvore(I, I.layoutArv, raiz, L.rels, si, 'layout');
                    processaArvore(I, cam(S.x, 'cSld', 'spTree'), raiz, S.rels, si, 'slide');
                    var objs = I.objs, porId = I.porId, midias = I.midias, extras = I.extras, trans = transicaoDe(S.x);
                    if (trans._nome && !TRANS[trans._nome]) avisa(I, si, 'transição "' + trans._nome + '" (virou Cruzar)');
                    delete trans._nome;
                    return Promise.all(I.esperas.concat([fundoDe(I, [S.x, L.x, M.x], [S.rels, L.rels, M.rels]), notasDe(I.zip, S.rels)])).then(function (q) {
                      var notas = q[q.length - 1], fd = q[q.length - 2];
                      /* depois das mídias prontas: animações, sons e vídeos na hora certa */
                      try { I.extras = extras; aplicaTempo(I, leTempo(S.x), porId, midias, si) } catch (e) { console.warn('importar pptx (animações):', e); avisa(I, si, 'animações que deram erro ao ler') }
                      extras.forEach(function (o) { objs.push(o) });
                      var sl = EA.novoSlide(objs, { id: I.ids[arq], fundo: fd, notas: notas, trans: trans });
                      if (I.emPe) sl.orient = 'v';
                      if (at(S.x, 'show', '1') === '0') { sl.nome = '(oculto no PowerPoint)'; avisa(I, si, 'slide estava oculto no PowerPoint') }
                      I.p.slides.push(sl);
                    });
                  });
                });
              });
            }).catch(function (e) {
              console.warn('importar pptx: slide ' + (si + 1) + ' ficou de fora:', e);
              I.faltas[si] = {}; avisa(I, si, 'slide inteiro ficou de fora (não deu para ler)');
              delete I.ids[arq];                         // links que apontavam para ele deixam de valer
            });
          });
        });
        return seq;
      }).then(function () {
        if (I.slidesArq.length && !I.p.slides.length) throw new Error('nenhum slide deu para ler');   // 09/11
        /* links entre slides: agora que todos têm id */
        I.p.slides.forEach(function (s, k) {
          s.objs.forEach(function (o) {
            var a = o.acao; if (!a || a.tipo !== 'slide') return;
            if (a.alvoArq) { a.alvo = I.ids[a.alvoArq] || ''; delete a.alvoArq }
            else if (a.pula != null) { var d = a.pula === 'primeiro' ? 0 : a.pula === 'ultimo' ? I.p.slides.length - 1 : EA.limita(k + a.pula, 0, I.p.slides.length - 1); a.alvo = I.p.slides[d].id; delete a.pula }
            if (!a.alvo) o.acao = null;
          });
        });
        /* fonte instalada? mede um texto com ela e com as reservas: se nunca muda, ela não existe aqui */
        var cv = document.createElement('canvas').getContext('2d'), mede = function (f) { cv.font = '40px ' + f; return cv.measureText('mmmmWWiil 0123 áç').width };
        var faltaFonte = Object.keys(I.fontes).filter(function (f) { return f && !FONTE_KEY[f.toLowerCase()] && ['monospace', 'serif'].every(function (r) { return mede("'" + f.replace(/'/g, '') + "'," + r) === mede(r) }) });
        return { projeto: I.p, faltas: I.faltas, fontes: faltaFonte, graficos: I.nGraficos || 0 };
      });
    },
    /* janela com o que não veio */
    relatorio: function (r) {
      /* o que só vem na fase 2 vira um resumo; a lista por slide fica só com o que realmente não veio */
      var fase2 = {}, linhas = [];
      Object.keys(r.faltas).sort(function (a, b) { return a - b }).forEach(function (si) {
        var f = r.faltas[si], resto = Object.keys(f).filter(function (k) { if (/fase 2/.test(k)) { var n = k.replace(/\s*\(fica.*$/, ''); (fase2[n] = fase2[n] || []).push(+si + 1); return false } return true });
        if (resto.length) linhas.push('<li><b>Slide ' + (+si + 1) + '</b>: ' + resto.map(function (k) { return EA.esc(k) + (f[k] > 1 ? ' (' + f[k] + ')' : '') }).join(', ') + '</li>');
      });
      var depois = Object.keys(fase2).map(function (n) { var l = fase2[n]; return '<li>' + EA.esc(n.charAt(0).toUpperCase() + n.slice(1)) + ': ' + (l.length > 6 ? l.length + ' slides' : (l.length > 1 ? 'slides ' : 'slide ') + l.join(', ')) + '</li>' });
      var m = EA.el('div', 'ed-modal');
      m.innerHTML = '<div class="ed-modal-c imp-rel"><button class="ed-x" data-x>×</button><h2>PowerPoint aberto</h2><p>' + r.projeto.slides.length + ' slides viraram um material do Estúdio. Textos, imagens e formas ficaram editáveis.</p>' +
        (r.fontes.length ? '<p class="imp-av">Fontes que não estão neste computador (usei uma parecida): <b>' + r.fontes.map(EA.esc).join(', ') + '</b></p>' : '') +
        (linhas.length ? '<h3>O que não veio ou ficou diferente</h3><ul>' + linhas.join('') + '</ul><p class="imp-nota">As peças que não vieram aparecem como uma caixinha cinza no lugar delas.</p>' : '<p>Todas as peças dos slides vieram.</p>') +
        (r.graficos ? '<p class="imp-nota">' + (r.graficos > 1 ? 'Os ' + r.graficos + ' gráficos vieram' : 'O gráfico veio') + ' como desenho, igualzinho ao PowerPoint. Para mudar os números, troque por um gráfico do Estúdio (aba Elementos).</p>' : '') +
        (depois.length ? '<h3>Ainda não vem (próxima etapa)</h3><ul>' + depois.join('') + '</ul>' : '') +
        '<div class="imp-bt"><button class="prim" data-x>Entendi</button></div></div>';
      m.onclick = function (e) { if (e.target.closest('[data-x]') || e.target === m) m.remove() };
      document.body.appendChild(m);
    }
  };
})();
