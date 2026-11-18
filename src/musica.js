/* Músicas de batalha compostas aqui e tocadas no próprio navegador, com vozes de videogame antigo:
   melodia, acompanhamento, baixo e bateria de ruído. Não têm licença de terceiros e quase não pesam no HTML exportado. */
(function () {
  var EA = window.EA;
  var ACORDES = { Em: 'E G B', C: 'C E G', D: 'D F# A', Am: 'A C E', B: 'B D# F#', G: 'G B D', Dm: 'D F A', Bb: 'Bb D F', A: 'A C# E', Gm: 'G Bb D', F: 'F A C', Cm: 'C Eb G', Ab: 'Ab C Eb', Db: 'Db F Ab', Fm: 'F Ab C' };
  /* melodia: nota:duração em semicolcheias (r = pausa); cada compasso soma 16.
     baixo: 0 fundamental, 5 quinta, 8 oitava. arp: índice da nota do acorde. bateria: 16 passos */
  EA.MUSICAS = {
    investida: {
      nome: 'Investida', grupo: 'jogo', bpm: 152,
      acordes: 'Em Em C D Em C Am B G D Em C Am Em C B',
      melodia: [
        'E5:3 B4:3 E5:2 G5:4 F#5:2 E5:2', 'D5:2 E5:2 r:2 B4:2 G4:4 A4:2 B4:2', 'C5:3 G4:3 C5:2 E5:4 D5:2 C5:2', 'D5:3 A4:3 D5:2 F#5:6 r:2',
        'E5:3 B4:3 E5:2 G5:4 A5:2 B5:2', 'C6:4 B5:2 A5:2 G5:4 E5:4', 'A5:3 G5:3 F#5:2 E5:4 D5:2 C5:2', 'B4:2 D#5:2 F#5:2 B5:6 r:4',
        'D5:2 G5:2 B5:4 A5:2 G5:2 F#5:2 G5:2', 'F#5:2 A5:2 D6:4 C6:2 B5:2 A5:4', 'B5:2 G5:2 E5:4 G5:2 B5:2 E6:4', 'C6:2 B5:2 G5:2 E5:2 C5:4 E5:4',
        'A5:4 C6:2 A5:2 E5:4 A5:4', 'G5:4 B5:2 G5:2 E5:4 G5:4', 'E5:2 G5:2 C6:4 A5:2 G5:2 E5:4', 'F#5:2 D#5:2 B4:2 D#5:2 F#5:4 B5:4'
      ],
      baixo: '0.0.8.0.0.0.8.5.', arp: '0.1.2.1.0.1.2.1.',
      bumbo: 'x.....x.x.......', caixa: '....x.......x...', prato: 'x.x.x.x.x.x.x.x.'
    },
    emboscada: {
      nome: 'Emboscada', grupo: 'jogo', bpm: 126,
      acordes: 'Dm Dm Bb A Dm Dm Gm A F C Dm Bb Gm Dm A A',
      melodia: [
        'r:4 D5:2 F5:2 A5:6 G5:2', 'F5:2 E5:2 D5:4 A4:6 r:2', 'Bb4:2 D5:2 F5:4 G5:2 F5:2 D5:4', 'C#5:2 E5:2 A5:6 G5:2 E5:2 C#5:2',
        'r:4 A5:2 Bb5:2 A5:4 F5:4', 'G5:2 F5:2 E5:2 D5:2 E5:4 F5:4', 'G5:4 Bb5:2 G5:2 D5:4 Bb4:4', 'A4:2 C#5:2 E5:2 G5:2 A5:6 r:2',
        'C5:2 F5:2 A5:4 G5:2 F5:2 A5:4', 'G5:2 E5:2 C5:4 E5:2 G5:2 C6:4', 'A5:4 F5:2 D5:2 F5:2 A5:2 D6:4', 'D6:2 C6:2 Bb5:4 F5:4 D5:4',
        'G5:2 A5:2 Bb5:4 A5:2 G5:2 F5:2 G5:2', 'A5:4 F5:2 D5:2 A4:4 D5:4', 'E5:2 C#5:2 A4:4 C#5:2 E5:2 A5:4', 'G5:2 F5:2 E5:2 C#5:2 A4:8'
      ],
      baixo: '0..0..5.0..0..8.', arp: '0121012101210121',
      bumbo: 'x..x....x..x....', caixa: '........x.......', prato: '..x...x...x...x.'
    },
    chefe: {
      nome: 'Último chefe', grupo: 'jogo', bpm: 172,
      acordes: 'Cm Cm Ab G Cm Cm Db G Fm Cm Ab G Fm Db G G',
      melodia: [
        'C5:2 C5:1 C5:1 Eb5:2 G5:4 F5:2 Eb5:2 D5:2', 'Eb5:2 C5:2 G4:4 C5:2 Eb5:2 G5:4', 'Ab5:3 G5:3 Eb5:2 C5:4 Eb5:2 Ab5:2', 'G5:3 F5:3 D5:2 B4:4 D5:2 G5:2',
        'C6:2 C6:1 C6:1 B5:2 G5:4 Ab5:2 G5:2 Eb5:2', 'F5:2 Eb5:2 D5:2 Eb5:2 C5:4 G4:4', 'Db5:2 F5:2 Ab5:4 Db6:4 C6:2 Ab5:2', 'B5:2 G5:2 D5:2 B4:2 G4:4 r:4',
        'F5:4 Ab5:2 C6:2 F6:4 Eb6:2 C6:2', 'Eb6:4 C6:2 G5:2 Eb5:4 G5:4', 'Ab5:2 C6:2 Eb6:4 Db6:2 C6:2 Ab5:4', 'B5:2 D6:2 G6:4 F6:2 D6:2 B5:4',
        'C6:2 Ab5:2 F5:4 Ab5:2 C6:2 F6:4', 'F6:2 Db6:2 Ab5:4 F5:4 Db5:4', 'D5:1 Eb5:1 F5:1 G5:1 Ab5:1 B5:1 C6:1 D6:1 G6:8', 'F6:2 D6:2 B5:2 G5:2 D5:2 B4:2 G4:4'
      ],
      baixo: '0.0.0.8.0.0.5.8.', arp: '0120120120120120',
      bumbo: 'x.x...x.x.x...x.', caixa: '....x.......x..x', prato: 'xxxxxxxxxxxxxxxx'
    }
  };

  /* trilhas instrumentais geradas com ACE-Step; só entram no HTML exportado as que forem usadas */
  [['corporativo', 'Corporativa'], ['piano', 'Piano suave'], ['acustico', 'Violão leve'], ['lofi', 'Lo-fi calmo'], ['eletronico', 'Eletrônica leve']].forEach(function (t) {
    EA.MUSICAS[t[0]] = { nome: t[1], grupo: 'apres', arq: 'assets/musicas/' + t[0] + '.mp3' };
  });

  /* trilhas dos jogos, em arquivo */
  [['jogo_tiro', 'Rock de ação (16-bit)'], ['jogo_mon_batalha', 'Monstrinhos: batalha'], ['jogo_mon_rota', 'Monstrinhos: batalha rival'], ['jogo_mon_chefe', 'Monstrinhos: batalha final']].forEach(function (t) {
    EA.MUSICAS[t[0]] = { nome: t[1], grupo: 'jogo', arq: 'assets/musicas/' + t[0] + '.mp3' };
  });

  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function classe(n) { return SEMI[n[0]] + (n[1] === '#' ? 1 : n[1] === 'b' ? -1 : 0) }
  function midi(n) { return 12 * (parseInt(n.slice(-1), 10) + 1) + classe(n) }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12) }

  /* transforma a partitura em notas por passo */
  function compila(k) {
    var m = EA.MUSICAS[k];
    if (m.ev) return m;
    var ac = m.acordes.split(' '), ev = {}, passo = 0;
    function poe(p, nota) { (ev[p] = ev[p] || []).push(nota) }
    m.compassos = m.melodia.map(function (linha) {
      var soma = 0;
      linha.split(' ').forEach(function (tk) {
        var par = tk.split(':'), d = +par[1];
        if (par[0] !== 'r') poe(passo + soma, { v: 'lead', m: midi(par[0]), d: d });
        soma += d;
      });
      passo += 16;
      return soma;
    });
    ac.forEach(function (nome, b) {
      var tons = ACORDES[nome].split(' ').map(classe), raiz = tons[0], p0 = b * 16, s;
      var arpT = tons.map(function (t) { var x = 60 + ((t - raiz + 12) % 12) + raiz % 12; return x });
      for (s = 0; s < 16; s++) {
        var cb = m.baixo[s], ca = m.arp[s];
        if (cb !== '.') {
          var dur = 1; while (s + dur < 16 && m.baixo[s + dur] === '.') dur++;
          var nt = 36 + raiz % 12 + (raiz < 0 ? 12 : 0) + (cb === '8' ? 12 : cb === '5' ? ((tons[2] - raiz + 12) % 12) : 0);
          poe(p0 + s, { v: 'baixo', m: nt, d: dur });
        }
        if (ca !== '.') { var da = 1; while (s + da < 16 && m.arp[s + da] === '.') da++; poe(p0 + s, { v: 'arp', m: arpT[+ca], d: da }) }
        if (m.bumbo[s] === 'x') poe(p0 + s, { v: 'bumbo' });
        if (m.caixa[s] === 'x') poe(p0 + s, { v: 'caixa' });
        if (m.prato[s] === 'x') poe(p0 + s, { v: 'prato' });
      }
    });
    m.ev = ev; m.passos = ac.length * 16;
    return m;
  }

  /* ---------- vozes ---------- */
  var ondas = new WeakMap(), ruidos = new WeakMap();
  function pulso(c, duty) {
    var mapa = ondas.get(c); if (!mapa) { mapa = {}; ondas.set(c, mapa) }
    if (mapa[duty]) return mapa[duty];
    var n = 32, re = new Float32Array(n), im = new Float32Array(n), k;
    for (k = 1; k < n; k++) { re[k] = 0; im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty) }
    return (mapa[duty] = c.createPeriodicWave(re, im));
  }
  function ruidoBuf(c) {
    var b = ruidos.get(c);
    if (!b) { b = c.createBuffer(1, c.sampleRate * .4, c.sampleRate); var d = b.getChannelData(0), i; for (i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; ruidos.set(c, b) }
    return b;
  }
  function nota(c, s, f, t, dur, onda, g) {
    var o = c.createOscillator(), a = c.createGain(), fim = t + Math.max(.04, dur);
    if (typeof onda === 'string') o.type = onda; else o.setPeriodicWave(onda);
    o.frequency.setValueAtTime(f, t);
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + .004);
    a.gain.linearRampToValueAtTime(g * .72, t + Math.min(.07, dur * .5));
    a.gain.setValueAtTime(g * .72, fim - .018); a.gain.linearRampToValueAtTime(0, fim);
    o.connect(a); a.connect(s); o.start(t); o.stop(fim + .01);
  }
  function bate(c, s, t, dur, g, tipo, f) {
    var b = c.createBufferSource(), fl = c.createBiquadFilter(), a = c.createGain();
    b.buffer = ruidoBuf(c); fl.type = tipo; fl.frequency.value = f;
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.0008, t + dur);
    b.connect(fl); fl.connect(a); a.connect(s); b.start(t, Math.random() * .2, dur + .02);
  }
  function bumbo(c, s, t) {
    var o = c.createOscillator(), a = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .09);
    a.gain.setValueAtTime(.42, t); a.gain.exponentialRampToValueAtTime(.001, t + .13);
    o.connect(a); a.connect(s); o.start(t); o.stop(t + .15);
  }
  function tocaPasso(c, s, m, p, t, seg) {
    (m.ev[p] || []).forEach(function (e) {
      if (e.v === 'lead') nota(c, s, hz(e.m), t, e.d * seg * .94, pulso(c, .5), .15);
      else if (e.v === 'arp') nota(c, s, hz(e.m), t, e.d * seg * .8, pulso(c, .25), .055);
      else if (e.v === 'baixo') nota(c, s, hz(e.m), t, e.d * seg * .9, 'triangle', .27);
      else if (e.v === 'bumbo') bumbo(c, s, t);
      else if (e.v === 'caixa') bate(c, s, t, .11, .17, 'bandpass', 1900);
      else if (e.v === 'prato') bate(c, s, t, .035, .045, 'highpass', 7000);
    });
  }

  /* ---------- tocador: agenda sempre um pouco à frente, para não falhar com a aba ocupada ---------- */
  var atual = null, FOLGA = 1.2, volMusica = .7;
  function fator() { return EA.Som.mudo() ? 0 : EA.Som.volume() * volMusica / .7 }
  function nivel() { return fator() * .9 }
  function nivelArq() { return Math.min(1, fator() * .7) }
  function agenda() {
    if (!atual || !atual.m) return;
    var c = atual.c, lim = c.currentTime + FOLGA;
    if (atual.t < c.currentTime) atual.t = c.currentTime + .05;
    while (atual.t < lim) {
      tocaPasso(c, atual.saida, atual.m, atual.p, atual.t, atual.seg);
      atual.t += atual.seg; atual.p = (atual.p + 1) % atual.m.passos;
    }
  }
  function urlDe(k, projeto) {
    if (k.indexOf('midia:') === 0) return EA.urlMidia(projeto || EA.projetoAtual, k.slice(6));
    var d = EA.MUSICAS[k]; return d && d.arq ? EA.url(d.arq) : '';
  }
  function funde(a, de, ate, seg, fim) {
    var t0 = performance.now();
    clearInterval(a.fade);
    a.fade = setInterval(function () {
      var f = Math.min(1, (performance.now() - t0) / (seg * 1000));
      try { a.volume = de + (ate - de) * f } catch (e) { }
      if (f >= 1) { clearInterval(a.fade); if (fim) fim() }
    }, 40);
  }
  /* navegador só libera o som depois do primeiro toque: se foi barrado, tenta de novo nele */
  function comeca(a) {
    var p = a.play();
    if (p && p.catch) p.catch(function () {
      function de() { document.removeEventListener('pointerdown', de, true); document.removeEventListener('keydown', de, true); if (atual && atual.a === a) a.play().catch(function () { }) }
      document.addEventListener('pointerdown', de, true); document.addEventListener('keydown', de, true);
    });
  }
  /* 09/11: a música de chip também espera o primeiro toque quando o navegador ainda segura o som (HTML exportado aberto sem clique) */
  function acorda(c) {
    function de() { document.removeEventListener('pointerdown', de, true); document.removeEventListener('keydown', de, true); try { var r = c.resume(); if (r && r.catch) r.catch(function () { }) } catch (e) { } }
    document.addEventListener('pointerdown', de, true); document.addEventListener('keydown', de, true);
  }
  EA.Musica = {
    tocar: function (k, projeto) {
      this.parar(.5);
      var u = urlDe(k, projeto);
      if (u) {
        var a = new Audio(u); a.loop = true; a.volume = 0;
        atual = { k: k, a: a };
        comeca(a); funde(a, 0, nivelArq(), .8);
        return;
      }
      var c = EA.Som.contexto(); if (!c || !EA.MUSICAS[k]) return;
      var m = compila(k), saida = c.createGain();
      saida.gain.value = nivel(); saida.connect(c.destination);
      atual = { k: k, c: c, m: m, saida: saida, p: 0, t: c.currentTime + .08, seg: 60 / m.bpm / 4, id: setInterval(agenda, 120) };
      agenda();
      if (c.state === 'suspended') acorda(c);
    },
    parar: function (fade) {
      if (!atual) return;
      var x = atual, f = fade == null ? .35 : fade;
      atual = null;
      if (x.a) { funde(x.a, x.a.volume, 0, f, function () { x.a.pause(); x.a.src = '' }); return }
      var t = x.c.currentTime;
      clearInterval(x.id);
      x.saida.gain.cancelScheduledValues(t); x.saida.gain.setValueAtTime(x.saida.gain.value, t); x.saida.gain.linearRampToValueAtTime(0, t + f);
      setTimeout(function () { x.saida.disconnect() }, f * 1000 + 80);
    },
    ajusta: function () {
      if (!atual) return;
      if (atual.a) { clearInterval(atual.a.fade); atual.a.volume = nivelArq() } else atual.saida.gain.value = nivel();
    },
    volume: function (v) { if (v != null) { volMusica = v; this.ajusta() } return volMusica },
    tocando: function () { return atual ? atual.k : '' },
    nome: function (k, projeto) {
      if (!k) return '';
      if (k.indexOf('midia:') === 0) { var m = (projeto || EA.projetoAtual).midia[k.slice(6)]; return m ? m.nome : 'Música apagada' }
      return EA.MUSICAS[k] ? EA.MUSICAS[k].nome : k;
    },
    /* cada slide pode marcar: começar uma música, ou "parar". Sem marca, segue o que vinha tocando */
    doSlide: function (projeto, k) {
      for (var j = k; j >= 0; j--) { var m = projeto.slides[j].musica; if (m) return m === 'parar' ? '' : m }
      return '';
    },
    aplica: function (projeto, k) {
      var s = projeto.slides[k];
      if (s.quiz && s.quiz.musica) return;      /* a batalha toca a dela ao abrir */
      var alvo = this.doSlide(projeto, k);
      if (alvo === this.tocando()) return;
      if (alvo) this.tocar(alvo, projeto); else this.parar(.8);
    },
    /* a apresentação em trechos: de qual slide a qual slide toca o quê */
    trechos: function (projeto) {
      var l = [], self = this;
      projeto.slides.forEach(function (s, j) {
        var m = self.doSlide(projeto, j), u = l[l.length - 1];
        if (u && u.m === m) u.ate = j; else l.push({ m: m, de: j, ate: j });
      });
      return l;
    },
    compila: compila, tocaPasso: tocaPasso
  };
})();
