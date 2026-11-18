/* Bonecos de ossos no palco: desenha, dá vida e, se a pessoa quiser, deixa mexer junta por junta. */
(function () {
  var EA = window.EA, M = window.EA_RIG_MOTOR, RAD = Math.PI / 180;
  function numId(id) { var h = 0, s = String(id || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
  function chDe(p) { return Object.assign({}, M.DEF, p.ch || {}) }
  function corpoDe(ch) { return M.BUILDS[ch.bd] || M.BUILDS.mid }
  function quem(p, id) { return { id: numId(id), mv: p.mv || 'idle', hm: p.hm, mm: p.mm, mood: p.mood } }
  /* a pose do instante: a do movimento escolhido ou, se ligada, a feita à mão (rosto e piscada continuam vivos) */
  function poseEm(p, id, t) {
    var ch = chDe(p), B = corpoDe(ch), e = quem(p, id);
    if (!p.posar || !p.pose) return M.target(e, ch, B, t * (p.vel || 1));
    e.mv = 'idle'; e.hm = 'none';
    var P = M.target(e, ch, B, t);
    P.arms = p.pose.arms; P.legs = p.pose.legs; P.body = p.pose.body; P.ph = p.pose.ph || 0; P.air = p.pose.air || 0;
    P.face.look = p.pose.body.look || 0;
    return P;
  }
  function tempoParado(p) { return !p.mv || p.mv === 'idle' || p.mv === 'none' ? 0 : .15 }

  /* a mesma moldura do Quadro Vivo: caixa 100 x 200, boneco reduzido dentro dela */
  var K = .3425, DX = -4, DY = 18;
  function moldura(w, h, vira) {
    var sc = Math.min(w / 100, h / 200), ox = (w - 100 * sc) / 2, oy = (h - 200 * sc) / 2;
    return {
      fora: function (x, y) { var X = (x + DX) * K * sc + ox; return [vira ? w - X : X, (y + DY) * K * sc + oy] },
      dentro: function (X, Y) { if (vira) X = w - X; return [(X - ox) / sc / K - DX, (Y - oy) / sc / K - DY] }
    };
  }
  function roda(x, y, cx, cy, graus) { var a = graus * RAD, c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c] }

  /* juntas no desenho do boneco, com o corpo já inclinado e deslocado */
  function juntasRig(p) {
    var P = p.pose, ch = chDe(p), B = corpoDe(ch), b = P.body, j = {};
    function fim(x, y, tronco) { var q = tronco ? roda(x, y, 150, 252, b.lean) : [x, y]; return [q[0] + b.sx, q[1] + b.by] }
    ['R', 'L'].forEach(function (sd) {
      var A = P.arms[sd], ul = A.ul == null ? 1 : A.ul, sx = M.CX + 37 * B.tk, sy = 166 - b.shr, ex = sx + M.UPL * ul * Math.cos(A.up * RAD), ey = sy + M.UPL * ul * Math.sin(A.up * RAD), wx = ex + M.FOL * Math.cos(A.fore * RAD), wy = ey + M.FOL * Math.sin(A.fore * RAD);
      var mx = function (x) { return sd === 'L' ? 2 * M.CX - x : x };
      j['ombro' + sd] = fim(mx(sx), sy, true); j['cotovelo' + sd] = fim(mx(ex), ey, true); j['pulso' + sd] = fim(mx(wx), wy, true);
      var L = P.legs[sd], hx = M.CX + 18 * B.lk, hy = 252, kx = hx + M.TH * L.fl * Math.cos(L.hip * RAD), ky = hy + M.TH * L.fl * Math.sin(L.hip * RAD), sl = L.sl == null ? 1 : L.sl, ax = kx + M.SLN * sl * Math.cos(L.knee * RAD), ay = ky + M.SLN * sl * Math.sin(L.knee * RAD);
      j['quadril' + sd] = fim(mx(hx), hy, false); j['joelho' + sd] = fim(mx(kx), ky, false); j['tornozelo' + sd] = fim(mx(ax), ay, false);
    });
    var cp = roda(M.HPX + b.hx, 28 + b.hy, M.HPX + b.hx, M.HPY + b.hy, b.hr);
    j.cabeca = fim(cp[0], cp[1], true); j.pescoco = fim(150, 150, true);
    j.tronco = fim(150, 192, true); j.cintura = fim(150, 252, false);
    return j;
  }
  var SO_LINHAS = { ombroR: 1, ombroL: 1, quadrilR: 1, quadrilL: 1, pescoco: 1, cintura: 1 };
  var OSSOS = [['pescoco', 'cabeca'], ['cintura', 'tronco'], ['tronco', 'pescoco'], ['ombroR', 'cotoveloR'], ['cotoveloR', 'pulsoR'], ['ombroL', 'cotoveloL'], ['cotoveloL', 'pulsoL'], ['quadrilR', 'joelhoR'], ['joelhoR', 'tornozeloR'], ['quadrilL', 'joelhoL'], ['joelhoL', 'tornozeloL']];

  var vivos = [], rodando = false, ultimo = 0;
  function quadro(ts) {
    if (!vivos.length) { rodando = false; return }
    requestAnimationFrame(quadro);
    if (ts - ultimo < 33) return;
    ultimo = ts;
    vivos = vivos.filter(function (v) { return v.g.isConnected });
    vivos.forEach(function (v) {
      if (!v.g.getBoundingClientRect().width) return;     /* escondido: não gasta */
      var p = v.o.props; M.apply(v.g, M.dyn(chDe(p), poseEm(p, v.o.id, ts / 1000)));
    });
  }

  EA.Rig = {
    /* o boneco desenhado parado, como texto */
    html: function (p, id) {
      var ch = chDe(p), P = poseEm(p, id, tempoParado(p));
      return '<svg class="ob-preenche ob-rig" viewBox="0 0 100 200" overflow="visible" style="overflow:visible' + (p.vira ? ';transform:scaleX(-1)' : '') + '"><g transform="scale(' + K + ') translate(' + DX + ' ' + DY + ')">' + M.markup(ch, P, '') + '</g></svg>';
    },
    liga: function (raiz, o) {
      var g = raiz.querySelector('.r2'); if (!g) return;
      vivos.push({ g: g, o: o });
      if (!rodando) { rodando = true; requestAnimationFrame(quadro) }
    },
    aplica: function (raiz, o) { var g = raiz && raiz.querySelector('.r2'); if (g) M.apply(g, M.dyn(chDe(o.props), poseEm(o.props, o.id, performance.now() / 1000))) },
    /* a pose manual começa de onde o movimento escolhido estava */
    poseInicial: function (p, id) {
      var ch = chDe(p), P = M.target(quem(p, id), ch, corpoDe(ch), tempoParado(p));
      return EA.clona({ arms: P.arms, legs: P.legs, body: P.body, ph: P.ph || 0, air: P.air || 0 });
    },
    /* bolinhas e ossos em pixels da caixa do objeto */
    juntas: function (p, w, h) {
      var m = moldura(w, h, p.vira), j = juntasRig(p), r = { bolas: [], ossos: [] };
      Object.keys(j).forEach(function (k) { if (!SO_LINHAS[k]) { var q = m.fora(j[k][0], j[k][1]); r.bolas.push({ k: k, x: q[0], y: q[1] }) } });
      OSSOS.forEach(function (o) { var a = m.fora(j[o[0]][0], j[o[0]][1]), b = m.fora(j[o[1]][0], j[o[1]][1]); r.ossos.push([a[0], a[1], b[0], b[1]]) });
      return r;
    },
    /* arrastou a junta até o ponto (em pixels da caixa): o osso de cima dela gira; o de baixo acompanha */
    arrasta: function (p, junta, X, Y, w, h) {
      var P = p.pose, ch = chDe(p), B = corpoDe(ch), b = P.body, q = moldura(w, h, p.vira).dentro(X, Y), x = q[0] - b.sx, y = q[1] - b.by;
      var sd = junta.slice(-1), n;
      function ang(ax, ay) { return Math.atan2(y - ay, x - ax) / RAD }
      if (junta === 'cabeca' || junta === 'tronco') {
        if (junta === 'tronco') { b.lean = EA.limita(Math.atan2(x - 150, 252 - y) / RAD, -50, 50); return }
        var u = roda(x, y, 150, 252, -b.lean);
        b.hr = EA.limita(Math.atan2(u[0] - (M.HPX + b.hx), M.HPY + b.hy - u[1]) / RAD, -45, 45); return;
      }
      if (/^(cotovelo|pulso)/.test(junta)) {
        var v = roda(x, y, 150, 252, -b.lean), A = P.arms[sd], ul = A.ul == null ? 1 : A.ul;
        x = sd === 'L' ? 2 * M.CX - v[0] : v[0]; y = v[1];
        var sx = M.CX + 37 * B.tk, sy = 166 - b.shr;
        if (junta.indexOf('cotovelo') === 0) { n = ang(sx, sy); A.fore += n - A.up; A.up = n }
        else A.fore = ang(sx + M.UPL * ul * Math.cos(A.up * RAD), sy + M.UPL * ul * Math.sin(A.up * RAD));
        return;
      }
      var L = P.legs[sd], hx = M.CX + 18 * B.lk;
      if (sd === 'L') x = 2 * M.CX - x;
      if (junta.indexOf('joelho') === 0) { n = ang(hx, 252); L.knee += n - L.hip; L.hip = n }
      else L.knee = ang(hx + M.TH * L.fl * Math.cos(L.hip * RAD), 252 + M.TH * L.fl * Math.sin(L.hip * RAD));
    },
    /* troca o gesto da mão sem mexer no braço */
    maoEm: function (p, sd, gesto) {
      var A = p.pose.arms[sd], n = M.mkA(A.up, A.fore, gesto); n.ul = A.ul; p.pose.arms[sd] = n; p.pose['mao' + sd] = gesto;
    }
  };
})();
