/* Efeitos sonoros feitos no próprio navegador (Web Audio): não têm licença de terceiros e não pesam no HTML exportado. */
(function () {
  var EA = window.EA, ctx = null, mudo = false, volume = .5, midias = {};
  /* 09/11: os áudios do material ficam guardados, para poderem parar (troca de slide, sair) e obedecer ao mudo */
  function paraMidia(k) { var a = midias[k]; if (!a) return; delete midias[k]; a.onended = a.onerror = null; try { a.pause(); a.src = '' } catch (e) { } }
  function pega() { if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C() } if (ctx.state === 'suspended') ctx.resume(); return ctx }
  function saida(c, g, t, dur) { var n = c.createGain(); n.gain.setValueAtTime(g * volume, t); n.gain.exponentialRampToValueAtTime(.0001, t + dur); n.connect(c.destination); return n }
  function tom(c, f, t, dur, tipo, g, f2) {
    var o = c.createOscillator(); o.type = tipo || 'square'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    o.connect(saida(c, g == null ? .25 : g, t, dur)); o.start(t); o.stop(t + dur + .02);
  }
  function ruido(c, t, dur, g, f, tipoF) {
    var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = c.createBufferSource(); s.buffer = b;
    var fl = c.createBiquadFilter(); fl.type = tipoF || 'lowpass'; fl.frequency.setValueAtTime(f || 2000, t);
    s.connect(fl); fl.connect(saida(c, g == null ? .3 : g, t, dur)); s.start(t);
    return fl;
  }
  function escala(c, notas, passo, tipo, g, dur) { var t = c.currentTime; notas.forEach(function (f, i) { tom(c, f, t + i * passo, dur || passo * 1.5, tipo, g) }) }
  /* ---------- 07/11: sons de apresentação, mais sérios. Ataque macio (sem estalo), ondas lisas e um eco curto ---------- */
  function env(c, g, t, dur, at, dst) {
    var n = c.createGain(); n.gain.setValueAtTime(.0001, t); n.gain.linearRampToValueAtTime(g * volume, t + (at || .008));
    n.gain.exponentialRampToValueAtTime(.0001, t + dur); n.connect(dst || c.destination); return n;
  }
  function sv(c, f, t, dur, tipo, g, f2, dst, at) {
    var o = c.createOscillator(); o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    o.connect(env(c, g, t, dur, at, dst)); o.start(t); o.stop(t + dur + .05);
  }
  function sopro(c, t, dur, g, f1, f2, tipoF, at) {
    var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = c.createBufferSource(); s.buffer = b;
    var fl = c.createBiquadFilter(); fl.type = tipoF || 'bandpass'; fl.Q.value = .8; fl.frequency.setValueAtTime(f1, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    s.connect(fl); fl.connect(env(c, g, t, dur, at || dur * .35)); s.start(t);
  }
  function eco(c) {
    var ent = c.createGain(), dl = c.createDelay(), fb = c.createGain(), lp = c.createBiquadFilter(), mix = c.createGain();
    dl.delayTime.value = .13; fb.gain.value = .3; lp.type = 'lowpass'; lp.frequency.value = 2800; mix.gain.value = .35;
    ent.connect(c.destination); ent.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(mix); mix.connect(c.destination);
    return ent;
  }
  /* nome interno → rótulo e receita */
  EA.SONS = {
    clique: { nome: 'Clique', f: function (c) { tom(c, 900, c.currentTime, .05, 'square', .12, 500) } },
    pop: { nome: 'Pop', f: function (c) { tom(c, 320, c.currentTime, .12, 'sine', .35, 900) } },
    surgir: { nome: 'Surgir', f: function (c) { var fl = ruido(c, c.currentTime, .32, .18, 400, 'bandpass'); fl.frequency.exponentialRampToValueAtTime(3200, c.currentTime + .3) } },
    sumir: { nome: 'Sumir', f: function (c) { var fl = ruido(c, c.currentTime, .3, .16, 3000, 'bandpass'); fl.frequency.exponentialRampToValueAtTime(300, c.currentTime + .3) } },
    certo: { nome: 'Resposta certa', f: function (c) { escala(c, [659, 880, 1319], .09, 'square', .2) } },
    errado: { nome: 'Resposta errada', f: function (c) { var t = c.currentTime; tom(c, 196, t, .18, 'sawtooth', .22); tom(c, 147, t + .17, .34, 'sawtooth', .22) } },
    moeda: { nome: 'Moeda', f: function (c) { var t = c.currentTime; tom(c, 988, t, .08, 'square', .18); tom(c, 1319, t + .08, .3, 'square', .18) } },
    nivel: { nome: 'Subiu de nível', f: function (c) { escala(c, [523, 659, 784, 1047, 1319], .08, 'square', .18) } },
    vitoria: { nome: 'Vitória', f: function (c) { var t = c.currentTime; [523, 523, 523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tom(c, f, t + i * .12, i === 7 ? .6 : .14, 'square', .2) }) } },
    derrota: { nome: 'Derrota', f: function (c) { escala(c, [392, 349, 311, 262, 196], .2, 'triangle', .3, .4) } },
    golpe: { nome: 'Golpe', f: function (c) { var t = c.currentTime; ruido(c, t, .12, .4, 3500); tom(c, 140, t, .14, 'square', .3, 50) } },
    porta: { nome: 'Porta', f: function (c) { var t = c.currentTime, fl = ruido(c, t, .34, .22, 500, 'bandpass'); fl.frequency.exponentialRampToValueAtTime(1100, t + .3); tom(c, 70, t, .22, 'square', .1, 55); tom(c, 90, t + .3, .08, 'square', .16, 50) } },
    baque: { nome: 'Baque no chão', f: function (c) { var t = c.currentTime; tom(c, 120, t, .28, 'sine', .5, 42); ruido(c, t, .14, .3, 500) } },
    tiro: { nome: 'Tiro', f: function (c) { var t = c.currentTime; ruido(c, t, .13, .42, 3800); tom(c, 240, t, .1, 'square', .24, 60) } },
    critico: { nome: 'Golpe crítico', f: function (c) { var t = c.currentTime; ruido(c, t, .22, .5, 6000); tom(c, 220, t, .25, 'sawtooth', .3, 40); tom(c, 1400, t + .02, .15, 'square', .12, 2400) } },
    dano: { nome: 'Levou dano', f: function (c) { var t = c.currentTime; ruido(c, t, .2, .35, 900); tom(c, 180, t, .22, 'sawtooth', .25, 70) } },
    magia: { nome: 'Magia', f: function (c) { var t = c.currentTime; [880, 1175, 1480, 1760, 2093].forEach(function (f, i) { tom(c, f, t + i * .05, .25, 'sine', .14) }) } },
    fogo: { nome: 'Fogo', f: function (c) { var t = c.currentTime; var fl = ruido(c, t, .5, .4, 600); fl.frequency.exponentialRampToValueAtTime(2500, t + .4) } },
    gelo: { nome: 'Gelo', f: function (c) { var t = c.currentTime; [2093, 2637, 3136, 2349].forEach(function (f, i) { tom(c, f, t + i * .05, .12, 'triangle', .14) }); ruido(c, t + .05, .2, .12, 7000, 'highpass') } },
    raio: { nome: 'Raio', f: function (c) { var t = c.currentTime; ruido(c, t, .35, .5, 5000); tom(c, 80, t, .4, 'sawtooth', .3, 40) } },
    explosao: { nome: 'Explosão', f: function (c) { var t = c.currentTime; var fl = ruido(c, t, .7, .6, 1500); fl.frequency.exponentialRampToValueAtTime(120, t + .6); tom(c, 90, t, .5, 'sine', .4, 30) } },
    /* os pontos sobem enquanto o monstrinho se forma (cerca de 1,6 s) e fecham com um acorde quando ele aparece */
    spawn: { nome: 'Monstrinho surgindo', f: function (c) { var t = c.currentTime; for (var i = 0; i < 12; i++) { var f0 = 262 * Math.pow(2, i * 2 / 12); tom(c, f0, t + i * .125, .17, 'square', .2); tom(c, f0 / 2, t + i * .125, .17, 'triangle', .22) } [784, 1047, 1319, 1568].forEach(function (f, i) { tom(c, f, t + 1.5 + i * .05, .55, 'square', .2) }) } },
    passo: { nome: 'Corrida', f: function (c) { var t = c.currentTime; [0, .08, .16].forEach(function (d) { ruido(c, t + d, .05, .18, 700) }) } },
    suspense: { nome: 'Suspense', f: function (c) { var t = c.currentTime; for (var i = 0; i < 6; i++) tom(c, 110, t + i * .16, .1, 'square', .1 + i * .02) } },
    campainha: { nome: 'Campainha', f: function (c) { var t = c.currentTime; tom(c, 1568, t, .5, 'sine', .22); tom(c, 2093, t + .01, .45, 'sine', .14) } },
    digitar: { nome: 'Digitação', f: function (c) { tom(c, 1500 + Math.random() * 500, c.currentTime, .025, 'square', .05) } },
    /* apresentação (sérios) */
    toque: { nome: 'Toque', ap: 1, f: function (c) { var t = c.currentTime; sv(c, 1700, t, .045, 'sine', .14, 1300); sopro(c, t, .025, .05, 5000, 0, 'highpass', .002) } },
    entrada: { nome: 'Entrada suave', ap: 1, f: function (c) { sopro(c, c.currentTime, .5, .13, 350, 2600, 'bandpass', .22) } },
    saidaS: { nome: 'Saída suave', ap: 1, f: function (c) { sopro(c, c.currentTime, .45, .12, 2600, 320, 'bandpass', .12) } },
    pagina: { nome: 'Virar página', ap: 1, f: function (c) { var t = c.currentTime; sopro(c, t, .3, .1, 1800, 6000, 'bandpass', .09); sopro(c, t + .08, .12, .05, 4000, 0, 'highpass', .02) } },
    transicao: { nome: 'Transição', ap: 1, f: function (c) { var t = c.currentTime; sv(c, 220, t, .9, 'sine', .09, 440, null, .35); sopro(c, t, .8, .05, 700, 3200, 'bandpass', .45) } },
    destaque: { nome: 'Destaque (sino)', ap: 1, f: function (c) { var t = c.currentTime, e = eco(c); sv(c, 1318.5, t, 1.3, 'sine', .15, 0, e); sv(c, 2637, t, .5, 'sine', .04, 0, e) } },
    confirma: { nome: 'Confirmação', ap: 1, f: function (c) { var t = c.currentTime, e = eco(c); sv(c, 784, t, .4, 'sine', .14, 0, e); sv(c, 1175, t + .11, .7, 'sine', .14, 0, e) } },
    sucesso: { nome: 'Sucesso', ap: 1, f: function (c) { var t = c.currentTime, e = eco(c); [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { sv(c, f, t + i * .075, 1, 'sine', .1, 0, e) }) } },
    notifica: { nome: 'Notificação', ap: 1, f: function (c) { var t = c.currentTime; sv(c, 1046.5, t, .28, 'sine', .17); sv(c, 4186, t, .05, 'sine', .025); sv(c, 1568, t + .12, .4, 'sine', .15) } },
    mensagem: { nome: 'Mensagem', ap: 1, f: function (c) { sv(c, 620, c.currentTime, .14, 'sine', .17, 1150, null, .01) } },
    alerta: { nome: 'Atenção', ap: 1, f: function (c) { var t = c.currentTime; sv(c, 880, t, .28, 'triangle', .13); sv(c, 659.25, t + .15, .45, 'triangle', .13) } },
    errosuave: { nome: 'Não foi dessa vez', ap: 1, f: function (c) { var t = c.currentTime; sv(c, 311, t, .32, 'sine', .15); sv(c, 233, t + .13, .5, 'sine', .14) } },
    contagem: { nome: 'Contagem', ap: 1, f: function (c) { sv(c, 990, c.currentTime, .14, 'sine', .14) } },
    tictac: { nome: 'Tique-taque', ap: 1, f: function (c) { var t = c.currentTime; sv(c, 2100, t, .03, 'sine', .12); sv(c, 1500, t + .5, .03, 'sine', .1) } },
    teclado: { nome: 'Teclado', ap: 1, f: function (c) { var t = c.currentTime; sopro(c, t, .035, .08, 3200, 0, 'bandpass', .003); sv(c, 170, t, .035, 'triangle', .05) } }
  };
  /* grito de chip: tom curto quase parado que vai morrendo, com um tremido e uma virada de altura. Sai do nome do monstrinho, então cada um tem o seu e é sempre o mesmo. */
  function grito(c, id, grave) {
    var h = 0, k, nome = String(id || 'x') + 'ali';
    for (k = 0; k < nome.length; k++) h = (h * 31 + nome.charCodeAt(k)) >>> 0;
    function r(n) { h = (h * 1664525 + 1013904223) >>> 0; return (h >>> 8) % n }
    var t = c.currentTime, f = (440 + r(11) * 50) * (grave ? .84 : 1), dur = .22 + r(7) * .05, tipo = r(3) === 0 ? 'sawtooth' : 'square';
    var o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), fim = saida(c, .2, t, dur);
    o.type = tipo; o.frequency.setValueAtTime(f * (1 + r(4) * .06), t);
    o.frequency.setValueAtTime(f, t + .05);
    o.frequency.setValueAtTime(f * (r(2) ? 1.12 : .9), t + dur * .55);
    lfo.frequency.value = 14 + r(14); lg.gain.value = f * .018; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(fim); o.start(t); lfo.start(t); o.stop(t + dur + .02); lfo.stop(t + dur + .02);
    tom(c, f / 2, t, dur * .8, 'triangle', .1);
  }
  EA.Som = {
    grito: function (id, grave, c2) { if (mudo) return; var c = c2 || pega(); if (c) grito(c, id, grave) },
    tocar: function (nome, projeto) {
      if (mudo || !nome) return;
      if (nome.indexOf('midia:') === 0) { var src = EA.urlMidia(projeto || EA.projetoAtual, nome.slice(6)); if (src) { paraMidia(nome); /* 09/11: o mesmo som de novo recomeça, não empilha */ var a = new Audio(src); a.volume = volume; midias[nome] = a; a.onended = a.onerror = function () { if (midias[nome] === a) delete midias[nome] }; a.play().catch(function () { }) } return }
      var s = EA.SONS[nome], c = s && pega(); if (c) s.f(c);
    },
    mudo: function (v) { if (v != null) { mudo = v; Object.keys(midias).forEach(function (k) { midias[k].muted = !!v }); if (EA.Musica) EA.Musica.ajusta() } return mudo },
    volume: function (v) { if (v != null) { volume = v; Object.keys(midias).forEach(function (k) { try { midias[k].volume = v } catch (e) { } }); if (EA.Musica) EA.Musica.ajusta() } return volume },
    pararMidias: function () { Object.keys(midias).forEach(paraMidia) },
    contexto: pega
  };
})();
