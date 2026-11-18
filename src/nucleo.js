/* Núcleo do Estúdio Aulão: modelo do material, temas e utilidades. Este arquivo vai junto no HTML exportado. */
(function () {
  var EA = window.EA = window.EA || {};
  EA.W = 1280; EA.H = 720;
  /* slide em pé troca as medidas; jogos e quizzes são desenhados deitados e ficam sempre assim */
  EA.dimSlide = function (s) { return s && s.orient === 'v' && !s.quiz ? { w: EA.H, h: EA.W } : { w: EA.W, h: EA.H } };
  EA.uid = function () { return Math.random().toString(36).slice(2, 9) };
  EA.clona = function (o) { return JSON.parse(JSON.stringify(o)) };
  EA.limita = function (v, a, b) { return Math.max(a, Math.min(b, v)) };
  EA.esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) };
  EA.el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e };

  /* cores: as do aulao-meta-pixel.html; os outros temas só trocam o destaque ou invertem claro e escuro */
  EA.TEMAS = {
    aulao: { nome: 'Aulão azul', azul: '#0064e0', azul2: '#004faa', tinta: '#1c2b33', suave: '#526772', linha: '#d8e1e8', palido: '#edf5ff', verde: '#087e58', vermelho: '#ac3340', ambar: '#9a5b00', fundo: '#f4f7fa', cartao: '#ffffff' },
    verde: { nome: 'Aulão verde', azul: '#087e58', azul2: '#05613f', tinta: '#1c2b33', suave: '#526772', linha: '#d8e1e8', palido: '#e8f6ef', verde: '#087e58', vermelho: '#ac3340', ambar: '#9a5b00', fundo: '#f4f7fa', cartao: '#ffffff' },
    roxo: { nome: 'Aulão roxo', azul: '#5b3cc4', azul2: '#4530a0', tinta: '#1f2340', suave: '#5a5f7d', linha: '#dfdcf0', palido: '#f0edff', verde: '#087e58', vermelho: '#ac3340', ambar: '#9a5b00', fundo: '#f6f5fb', cartao: '#ffffff' },
    noite: { nome: 'Azul-noite', azul: '#4fa3ff', azul2: '#2f7fdc', tinta: '#e8eef6', suave: '#9db0c8', linha: '#26364d', palido: '#16263d', verde: '#3ecf8e', vermelho: '#ff6b81', ambar: '#ffb847', fundo: '#0b1424', cartao: '#111d31' }
  };
  EA.aplicaTema = function (el, nome) {
    var t = EA.TEMAS[nome] || EA.TEMAS.aulao;
    ['azul', 'azul2', 'tinta', 'suave', 'linha', 'palido', 'verde', 'vermelho', 'ambar', 'fundo', 'cartao'].forEach(function (k) { el.style.setProperty('--' + k, t[k]) });
  };

  /* geometria padrão de um objeto novo */
  EA.novoObjeto = function (tipo, props, geo) {
    var g = geo || {};
    return { id: EA.uid(), liga: EA.uid(), tipo: tipo, x: g.x == null ? 440 : g.x, y: g.y == null ? 260 : g.y, w: g.w || 400, h: g.h || 200, rot: g.rot || 0, op: g.op == null ? 1 : g.op,
      props: props || {}, entrada: { tipo: g.entra || 'nenhuma', dur: .5, atraso: g.atraso || 0, quando: g.quando || 'auto', som: '' }, loop: { tipo: 'nenhum', vel: 1 }, kf: [], kfRepete: false, troca: null, acao: null };
  };
  EA.novoSlide = function (objs, extra) {
    var s = { id: EA.uid(), nome: '', fundo: { tipo: 'tema', cor: '' }, trans: { tipo: 'cruzar', dur: .5 }, objs: objs || [], notas: '', som: '', quiz: null };
    for (var k in (extra || {})) s[k] = extra[k];
    return s;
  };
  EA.novoProjeto = function (titulo) {
    return { versao: 1, id: EA.uid(), titulo: titulo || 'Meu aulão', tema: 'aulao', slides: [], midia: {}, somLigado: true, criado: Date.now(), mudado: Date.now() };
  };

  /* caminho de um recurso: no app é o arquivo; no HTML exportado, o que veio embutido */
  EA.embutidos = window.EA_EMBUTIDOS || {};
  EA.url = function (caminho) { return EA.embutidos[caminho] || (EA.base || '') + caminho };
  EA.urlMidia = function (projeto, id) { var m = projeto && projeto.midia && projeto.midia[id]; return m ? (m.url || m.dados) : '' };

  /* imagens de sprite: uma por arquivo, e as telas esperam ela carregar */
  var imgs = {};
  EA.imagem = function (src) {
    if (imgs[src]) return imgs[src];
    var i = new Image(); i.src = src; imgs[src] = i; return i;
  };
  EA.preCarrega = function (lista) {
    return Promise.all(lista.map(function (s) { var i = EA.imagem(s); return i.complete && i.naturalWidth ? null : new Promise(function (r) { i.addEventListener('load', r); i.addEventListener('error', r) }) }));
  };

  /* ---------- ritmo único de todos os sprites da tela ---------- */
  var sprites = [], rodando = false;
  function tique(t) {
    for (var i = sprites.length - 1; i >= 0; i--) {
      var s = sprites[i];
      if (s.canvas.isConnected) s.ligado = true;
      else {                                     // saiu da tela (ou nem entrou ainda: dá 3 s de folga)
        if (!s.criado) s.criado = t;
        if (s.ligado || t - s.criado > 3000) sprites.splice(i, 1);
        continue;
      }
      if (s.noEditor == null) s.noEditor = !!s.canvas.closest('#app');
      if (!s.parado && !(EA.editorOculto && s.noEditor)) s.tique(t);
    }
    if (sprites.length) requestAnimationFrame(tique); else rodando = false;
  }
  /* Sprite: um canvas que desenha um quadro de uma folha.
     quadro(k) devolve {x,y} na folha. Termina chamando aoFim, a não ser que repita. */
  EA.Sprite = function (canvas, cfg) {
    var self = this;
    this.canvas = canvas; this.cfg = cfg; this.k = -1; this.t0 = 0; this.podeSair = true; this.vel = 1; this.parado = false;
    canvas.width = cfg.w; canvas.height = cfg.h;
    var ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    this.img = EA.imagem(cfg.src);
    this.desenha = function (k) {
      if (!self.img.complete || !self.img.naturalWidth) return false;
      var q = cfg.quadro(k);
      ctx.clearRect(0, 0, cfg.w, cfg.h);
      ctx.drawImage(self.img, q.x, q.y, cfg.w, cfg.h, 0, 0, cfg.w, cfg.h);
      return true;
    };
    this.tique = function (t) {
      var c = self.cfg;
      if (!self.t0) self.t0 = t;
      var pos = (t - self.t0) * self.vel / 1000 / c.dt, k = Math.floor(pos);
      if (k >= c.n) {
        if (c.loop) k = k % c.n;
        else { k = c.n - 1; if (!self.acabou) { self.acabou = true; if (self.desenha(k)) self.k = k; if (self.aoFim) self.aoFim(); return } }
      }
      if (k !== self.k && self.desenha(k)) self.k = k;
    };
    this.recomeca = function () { self.t0 = 0; self.k = -1; self.acabou = false };
    this.fixa = function (k) { self.parado = true; var d = function () { if (!self.desenha(k)) self.img.addEventListener('load', d, { once: true }) }; d() };
    sprites.push(this);
    if (!rodando) { rodando = true; requestAnimationFrame(tique) }
  };
  EA.spriteFx = function (canvas, fx, opts) {
    opts = opts || {};
    var cols = fx.cols || 1;
    return new EA.Sprite(canvas, { src: EA.url('assets/fx/' + fx.arq), w: fx.w, h: fx.h, n: fx.n, dt: fx.dt / (opts.vel || 1), loop: opts.loop == null ? fx.loop : opts.loop, quadro: function (k) { return { x: (k % cols) * fx.w, y: Math.floor(k / cols) * fx.h } } });
  };
  /* lutador: uma folha com uma linha por animação; trocar de animação usa o mesmo canvas */
  EA.srcLutador = function (lut) {
    if (lut.src && lut.src.indexOf('midia:') === 0) return EA.urlMidia(EA.projetoAtual, lut.src.slice(6));
    return EA.url(lut.caminho || ((lut.pasta || 'assets/lutadores/') + lut.arq));
  };
  /* personagem do gerador: uma folha 6 × 64 de quadros 32×32. Em cada animação as linhas são baixo, cima, direita, esquerda; a base aqui é "direita" */
  EA.ANIMS_DOLL = {
    idle: { l: 2, n: 4, fps: 4, loop: true }, walk: { l: 6, n: 6, fps: 8, loop: true }, run: { l: 10, n: 6, fps: 12, loop: true },
    attack1: { l: 14, n: 5, fps: 12, loop: false }, attack2: { l: 18, n: 5, fps: 12, loop: false }, shoot: { l: 22, n: 5, fps: 10, loop: false }, attack3: { l: 26, n: 5, fps: 10, loop: false },
    hurt: { l: 30, n: 3, fps: 10, loop: false }, death: { l: 34, n: 6, fps: 8, loop: false }, sit: { l: 54, n: 1, fps: 1, loop: true }, wave: { l: 58, n: 3, fps: 6, loop: true }, cheer: { l: 62, n: 3, fps: 8, loop: true }
  };
  EA.DIRECOES = { direita: 0, esquerda: 1, baixo: -2, cima: -1 };
  EA.lutDoll = function (nome, caminhoOuMidia) {
    var l = { nome: nome, tipo: 'heroi', w: 32, h: 32, anims: EA.ANIMS_DOLL, pe: 2, doll: true };
    if (caminhoOuMidia.indexOf('midia:') === 0) l.src = caminhoOuMidia; else l.caminho = caminhoOuMidia;
    return l;
  };
  EA.spriteLutador = function (canvas, lut, anim, aoFim, dir) {
    var estado = { a: lut.anims[anim] || lut.anims.idle, dir: lut.doll ? (EA.DIRECOES[dir] || 0) : 0 };
    var s = new EA.Sprite(canvas, { src: EA.srcLutador(lut), w: lut.w, h: lut.h, n: estado.a.n, dt: 1 / estado.a.fps, loop: estado.a.loop, quadro: function (k) { return { x: k * lut.w, y: (estado.a.l + estado.dir) * lut.h } } });
    s.aoFim = aoFim;
    s.anim = function (nome, fim, repetir) {
      var a = lut.anims[nome]; if (!a) { if (fim) fim(); return }
      estado.a = a; s.cfg.n = a.n; s.cfg.dt = 1 / a.fps; s.cfg.loop = repetir == null ? a.loop : repetir; s.aoFim = fim || null; s.recomeca();
    };
    return s;
  };
})();
