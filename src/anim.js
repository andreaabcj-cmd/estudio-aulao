/* Animações: entradas, repetições, keyframes, troca de objeto e transições entre slides. Vai junto no HTML exportado. */
(function () {
  var EA = window.EA;
  var FORA = { transform: 'none' };
  EA.ENTRADAS = {
    nenhuma: { nome: 'Sem animação' },
    aparecer: { nome: 'Aparecer', k: [{ opacity: 0 }, { opacity: 1 }] },
    subir: { nome: 'Subir', k: [{ opacity: 0, transform: 'translateY(34px)' }, { opacity: 1, transform: 'none' }], e: 'cubic-bezier(.2,.8,.2,1)' },
    descer: { nome: 'Descer', k: [{ opacity: 0, transform: 'translateY(-34px)' }, { opacity: 1, transform: 'none' }], e: 'cubic-bezier(.2,.8,.2,1)' },
    esquerda: { nome: 'Vir da esquerda', k: [{ opacity: 0, transform: 'translateX(-60px)' }, { opacity: 1, transform: 'none' }], e: 'cubic-bezier(.2,.8,.2,1)' },
    direita: { nome: 'Vir da direita', k: [{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'none' }], e: 'cubic-bezier(.2,.8,.2,1)' },
    pop: { nome: 'Pop', k: [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1.08)', offset: .65 }, FORA], e: 'ease-out' },
    zoom: { nome: 'Zoom', k: [{ opacity: 0, transform: 'scale(1.35)' }, { opacity: 1, transform: 'none' }], e: 'cubic-bezier(.2,.8,.2,1)' },
    girar: { nome: 'Girar', k: [{ opacity: 0, transform: 'rotate(-120deg) scale(.5)' }, { opacity: 1, transform: 'none' }], e: 'cubic-bezier(.2,.8,.2,1)' },
    quicar: { nome: 'Quicar', k: [{ opacity: 0, transform: 'translateY(-90px)' }, { opacity: 1, transform: 'translateY(0)', offset: .45 }, { transform: 'translateY(-26px)', offset: .65 }, { transform: 'translateY(0)', offset: .82 }, { transform: 'translateY(-8px)', offset: .91 }, FORA], e: 'ease-in' },
    pixel: { nome: 'Pixelado', k: [{ opacity: 0, filter: 'blur(10px) contrast(3)' }, { opacity: 1, filter: 'blur(4px) contrast(2)', offset: .5 }, { opacity: 1, filter: 'none' }], e: 'steps(5)' },
    cortina: { nome: 'Revelar', k: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], e: 'cubic-bezier(.6,0,.2,1)' },
    digitar: { nome: 'Digitar (texto)', especial: 'digitar' }
  };
  EA.LOOPS = {
    nenhum: { nome: 'Nenhuma' },
    flutuar: { nome: 'Flutuar', k: [{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], d: 2.6 },
    pulsar: { nome: 'Pulsar', k: [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], d: 1.5 },
    balancar: { nome: 'Balançar', k: [{ transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-4deg)' }], d: 2 },
    girar: { nome: 'Girar sem parar', k: [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], d: 6, e: 'linear' },
    brilhar: { nome: 'Brilhar', k: [{ filter: 'brightness(1)' }, { filter: 'brightness(1.3)' }, { filter: 'brightness(1)' }], d: 1.6 },
    tremer: { nome: 'Tremer', k: [{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], d: .35, e: 'linear' },
    pular: { nome: 'Pular', k: [{ transform: 'translateY(0)' }, { transform: 'translateY(-18px)', offset: .3 }, { transform: 'translateY(0)', offset: .6 }, { transform: 'translateY(0)' }], d: 1.4 }
  };
  EA.TROCAS = {
    cruzar: { nome: 'Cruzar' }, virar: { nome: 'Virar como carta' }, encolher: { nome: 'Encolher e crescer' }, deslizar: { nome: 'Deslizar' }
  };
  EA.TRANSICOES = {
    nenhuma: { nome: 'Corte seco' }, cruzar: { nome: 'Cruzar' }, empurrar: { nome: 'Empurrar' }, subir: { nome: 'Subir' }, zoom: { nome: 'Zoom' },
    iris: { nome: 'Íris' }, persiana: { nome: 'Persiana' }, pixel: { nome: 'Pixels' }, magico: { nome: 'Mover mágico' }
  };
  EA.EASES = { suave: 'ease-in-out', reta: 'linear', chegar: 'cubic-bezier(.2,.8,.2,1)', saltar: 'cubic-bezier(.34,1.56,.64,1)', degraus: 'steps(6)' };

  /* 09/11: a peça já saiu de cena (slide trocado ou apresentação fechada)? Então os sons dela que estavam marcados não tocam mais */
  function saiu(e) { return !e.isConnected || !!e.closest('[data-saiu]') }
  function digita(raiz, dur, atraso, som) {
    var t = raiz.querySelector('.ob-texto'); if (!t) return;
    var letras = [];
    (function anda(n) {
      [].slice.call(n.childNodes).forEach(function (f) {
        if (f.nodeType === 3) {
          var fr = document.createDocumentFragment();
          f.nodeValue.split('').forEach(function (ch) { var s = document.createElement('span'); s.textContent = ch; s.style.opacity = 0; fr.appendChild(s); letras.push(s) });
          n.replaceChild(fr, f);
        } else anda(f);
      });
    })(t);
    var passo = Math.max(14, dur * 1000 / Math.max(1, letras.length));
    letras.forEach(function (s, k) { setTimeout(function () { s.style.opacity = 1; if (som && k % 3 === 0 && !saiu(raiz)) EA.Som.tocar('digitar') }, atraso * 1000 + k * passo) });
  }

  /* entrada de um objeto já na tela */
  EA.tocaEntrada = function (e, o, opts) {
    var en = o.entrada || {}, def = EA.ENTRADAS[en.tipo], atraso = (opts && opts.atraso) != null ? opts.atraso : (en.atraso || 0), alvo = e.querySelector('.ob-i');
    if (en.som) setTimeout(function () { if (!saiu(e)) EA.Som.tocar(en.som) }, atraso * 1000);
    /* gráficos e efeitos começam agora, e não quando o slide abriu escondido */
    if (e.getAnimations) e.getAnimations({ subtree: true }).forEach(function (a) { if (window.CSSAnimation && a instanceof CSSAnimation) { a.cancel(); a.play(); a.currentTime = -atraso * 1000 } });
    if (EA.contaNumeros) EA.contaNumeros(e, atraso);
    /* GIF começa do primeiro quadro quando a peça aparece */
    if (EA.reiniciaGif) [].forEach.call(e.querySelectorAll('img[data-gif]'), function (im) { setTimeout(function () { EA.reiniciaGif(im) }, atraso * 1000) });
    if (def && def.especial === 'digitar') digita(e, en.dur || 1, atraso, true);
    else if (def && def.k) alvo.animate(def.k, { duration: (en.dur || .5) * 1000, delay: atraso * 1000, easing: def.e || 'ease-out', fill: 'both' });
  };
  /* repetição enquanto o slide está na tela */
  EA.tocaLoop = function (e, o) {
    var lp = o.loop || {}, def = EA.LOOPS[lp.tipo];
    if (def && def.k) e.querySelector('.ob-l').animate(def.k, { duration: def.d * 1000 / (lp.vel || 1), iterations: Infinity, easing: def.e || 'ease-in-out' });
  };

  /* ---------- keyframes simplificados: lugar, tamanho, giro e transparência em alguns instantes ---------- */
  EA.temKf = function (o) { return o.kf && o.kf.length > 1 };
  EA.kfDur = function (o) { return o.kf && o.kf.length ? o.kf[o.kf.length - 1].t : 0 };
  var CAMPOS = ['x', 'y', 'w', 'h', 'rot', 'op'];
  function suaviza(t, nome) {
    if (nome === 'reta') return t;
    if (nome === 'chegar') return 1 - Math.pow(1 - t, 3);
    if (nome === 'saltar') { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) }
    if (nome === 'degraus') return Math.floor(t * 6) / 6;
    return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  EA.estadoEm = function (o, t) {
    var r = { x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot, op: o.op }, kf = o.kf || [];
    if (!kf.length) return r;
    if (t <= kf[0].t) { CAMPOS.forEach(function (c) { r[c] = kf[0][c] }); return r }
    for (var i = 0; i < kf.length - 1; i++) {
      var a = kf[i], b = kf[i + 1];
      if (t <= b.t) {
        var f = suaviza((t - a.t) / Math.max(.001, b.t - a.t), b.ease || 'suave');
        CAMPOS.forEach(function (c) { r[c] = a[c] + (b[c] - a[c]) * f });
        return r;
      }
    }
    CAMPOS.forEach(function (c) { r[c] = kf[kf.length - 1][c] });
    return r;
  };
  /* além do lugar, uma marca pode guardar: anim e vira (aba Design), efeito, efeitoDur e loop (aba Animação) e som */
  EA.kfMarca = function (o, t) { return (o.kf || []).find(function (f) { return Math.abs(f.t - t) < .06 }) };
  EA.kfTemEvento = function (f) { return !!(f.anim || f.vira != null || f.efeito || f.loop || f.som) };
  /* como o personagem está neste instante: vale a última marca que mudou cada coisa */
  EA.efetivoEm = function (o, t) {
    var p = o.props || {}, r = { anim: p.anim || 'idle', vira: !!p.vira };
    (o.kf || []).forEach(function (f) { if (f.t <= t + .06) { if (f.anim) r.anim = f.anim; if (f.vira != null) r.vira = f.vira } });
    return r;
  };
  EA.comEfetivo = function (o, t) {
    if (!o.kf || !o.kf.length) return o;
    var r = EA.efetivoEm(o, t), n = { vira: r.vira };
    if (o.tipo === 'lutador') n.anim = r.anim;
    return Object.assign({}, o, { props: Object.assign({}, o.props, n) });
  };
  function eventosKf(e, o, atraso, projeto) {
    var timers = [], ativo = true, dur = EA.kfDur(o);
    function sprite() { var c = e.querySelector('.ob-sprite'); return c && c.sprite }
    function dispara(f) {
      if (!ativo || !e.isConnected) return;
      var s = sprite(), c = e.querySelector('.ob-sprite');
      if (f.anim && s && s.anim) s.anim(f.anim, null, true);
      if (f.vira != null) EA.aplicaVira(e, o, f.vira);
      var def = EA.ENTRADAS[f.efeito];
      if (def && def.k) e.querySelector('.ob-i').animate(def.k, { duration: (f.efeitoDur || .5) * 1000, easing: def.e || 'ease-out' });
      if (f.loop) { e.querySelector('.ob-l').getAnimations().forEach(function (a) { a.cancel() }); EA.tocaLoop(e, { loop: { tipo: f.loop, vel: 1 } }) }
      if (f.som) EA.Som.tocar(f.som, projeto);
    }
    function ciclo() {
      o.kf.forEach(function (f) { if (EA.kfTemEvento(f)) timers.push(setTimeout(function () { dispara(f) }, f.t * 1000)) });
      if (o.kfRepete) timers.push(setTimeout(function () {
        if (!ativo || !e.isConnected) return;
        /* na repetição tudo volta a ser como no começo */
        var s = sprite(), c = e.querySelector('.ob-sprite'), p = o.props || {};
        if (s && s.anim) s.anim(p.anim || 'idle', null, true);
        EA.aplicaVira(e, o, !!p.vira);
        e.querySelector('.ob-l').getAnimations().forEach(function (a) { a.cancel() }); EA.tocaLoop(e, o);
        ciclo();
      }, dur * 1000));
    }
    timers.push(setTimeout(ciclo, atraso * 1000));
    return function () { ativo = false; timers.forEach(clearTimeout) };
  }
  EA.tocaKf = function (e, o, atraso, projeto) {
    if (!EA.temKf(o)) return null;
    var kf = o.kf, dur = EA.kfDur(o);
    var quadros = kf.map(function (q, k) {
      var pr = kf[k + 1];
      return { left: q.x + 'px', top: q.y + 'px', width: q.w + 'px', height: q.h + 'px', transform: 'rotate(' + (q.rot || 0) + 'deg)', opacity: q.op, offset: dur ? q.t / dur : 0, easing: pr ? (EA.EASES[pr.ease] || 'ease-in-out') : 'linear' };
    });
    var an = e.animate(quadros, { duration: dur * 1000, delay: (atraso || 0) * 1000, iterations: o.kfRepete ? Infinity : 1, fill: 'both', direction: o.kfRepete === 'vai-volta' ? 'alternate' : 'normal' });
    var paraEv = eventosKf(e, o, atraso || 0, projeto);
    return { para: function () { paraEv(); an.cancel() } };
  };

  /* ---------- troca de objeto: A vira B na apresentação ---------- */
  EA.tocaTroca = function (a, b, efeito, palco) {
    var dur = 450;
    /* 08/11: a fumaça de pixel saiu (pedido); materiais antigos com ela viram carta */
    if (efeito === 'poof') efeito = 'virar';
    b.style.visibility = '';
    var ia = a.querySelector('.ob-i'), ib = b.querySelector('.ob-i');
    if (efeito === 'virar') {
      ia.animate([{ transform: 'perspective(800px) rotateY(0)' }, { transform: 'perspective(800px) rotateY(90deg)' }], { duration: dur / 2, fill: 'both', easing: 'ease-in' });
      ib.animate([{ transform: 'perspective(800px) rotateY(-90deg)' }, { transform: 'perspective(800px) rotateY(0)' }], { duration: dur / 2, delay: dur / 2, fill: 'both', easing: 'ease-out' });
    } else if (efeito === 'encolher') {
      ia.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], { duration: dur / 2, fill: 'both', easing: 'ease-in' });
      ib.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .7 }, { transform: 'scale(1)', opacity: 1 }], { duration: dur / 1.4, delay: dur / 2, fill: 'both', easing: 'ease-out' });
    } else if (efeito === 'deslizar') {
      ia.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(-50px)', opacity: 0 }], { duration: dur, fill: 'both', easing: 'ease-in-out' });
      ib.animate([{ transform: 'translateX(50px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: dur, fill: 'both', easing: 'ease-in-out' });
    } else {
      ia.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, fill: 'both' });
      ib.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, fill: 'both' });
    }
    setTimeout(function () { a.style.pointerEvents = 'none' }, dur);
  };

  /* ---------- transição entre dois slides. velho e novo são camadas do mesmo tamanho; devolve uma promessa ---------- */
  EA.tocaTransicao = function (tipo, velho, novo, dur, palco) {
    dur = (dur == null ? .5 : dur) * 1000;
    if (!velho || tipo === 'nenhuma' || dur <= 0) { if (velho) velho.remove(); return Promise.resolve() }
    var e = 'cubic-bezier(.65,0,.35,1)', op = { duration: dur, easing: e, fill: 'both' }, fim;
    velho.style.pointerEvents = 'none';
    switch (tipo) {
      case 'empurrar':
        velho.animate([{ transform: 'none' }, { transform: 'translateX(-100%)' }], op);
        fim = novo.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], op); break;
      case 'subir':
        velho.animate([{ transform: 'none' }, { transform: 'translateY(-100%)' }], op);
        fim = novo.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], op); break;
      case 'zoom':
        velho.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.25)', opacity: 0 }], op);
        fim = novo.animate([{ transform: 'scale(.85)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], op); break;
      case 'iris':
        novo.style.zIndex = 3;
        fim = novo.animate([{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }], op); break;
      case 'persiana':
        novo.style.zIndex = 3;
        var q = [], de = [], ate = [];
        for (var i = 0; i < 8; i++) { de.push('0 ' + i * 12.5 + '%,100% ' + i * 12.5 + '%,100% ' + i * 12.5 + '%,0 ' + i * 12.5 + '%'); ate.push('0 ' + i * 12.5 + '%,100% ' + i * 12.5 + '%,100% ' + (i + 1) * 12.5 + '%,0 ' + (i + 1) * 12.5 + '%') }
        fim = novo.animate([{ clipPath: 'polygon(' + de.join(',') + ')' }, { clipPath: 'polygon(' + ate.join(',') + ')' }], op); break;
      case 'pixel':
        fim = pixelado(palco, velho, novo, dur); break;
      default:
        velho.style.zIndex = 1; novo.style.zIndex = 2;
        fim = novo.animate([{ opacity: 0 }, { opacity: 1 }], op);
    }
    var pr = fim.finished || fim;
    return Promise.resolve(pr).catch(function () { }).then(function () { velho.remove(); novo.style.zIndex = ''; novo.style.clipPath = '' });
  };
  /* cobre a tela com blocos, troca e descobre */
  function pixelado(palco, velho, novo, dur) {
    var cs = getComputedStyle(palco), cor = cs.getPropertyValue('--azul') || '#0064e0';
    var c = EA.el('canvas', 'trans-pixel'); c.width = 32; c.height = 18; palco.appendChild(c);
    var x = c.getContext('2d'), ordem = [];
    for (var i = 0; i < 576; i++) ordem.push(i);
    ordem.sort(function () { return Math.random() - .5 });
    novo.style.visibility = 'hidden';
    return new Promise(function (ok) {
      var t0 = 0;
      function passo(t) {
        if (!t0) t0 = t;
        var f = (t - t0) / dur;
        x.clearRect(0, 0, 32, 18); x.fillStyle = cor;
        var n = Math.floor((f < .5 ? f * 2 : (1 - f) * 2) * 576);
        if (f >= .5) { velho.style.visibility = 'hidden'; novo.style.visibility = '' }
        for (var k = 0; k < n; k++) x.fillRect(ordem[k] % 32, Math.floor(ordem[k] / 32), 1, 1);
        if (f < 1) requestAnimationFrame(passo); else { c.remove(); ok() }
      }
      requestAnimationFrame(passo);
    });
  }
  /* mover mágico: objeto com a mesma ligação nos dois slides anda de um lugar ao outro */
  EA.moverMagico = function (velhoSlide, novoSlide, novoEl, dur) {
    var mapa = {}, liga = {};
    velhoSlide.objs.forEach(function (o) { if (o.liga) mapa[o.liga] = o });
    var usados = {};
    novoSlide.objs.forEach(function (o) {
      var a = mapa[o.liga], e = novoEl.querySelector('[data-id="' + o.id + '"]');
      if (!a || !e) return;
      usados[o.id] = 1;
      var i = e.querySelector('.ob-i');
      if (i) i.getAnimations().forEach(function (an) { an.cancel() });
      e.animate([{ left: a.x + 'px', top: a.y + 'px', width: a.w + 'px', height: a.h + 'px', transform: 'rotate(' + (a.rot || 0) + 'deg)', opacity: a.op }, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px', transform: 'rotate(' + (o.rot || 0) + 'deg)', opacity: o.op }], { duration: dur * 1000, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' });
    });
    return usados;
  };
})();
