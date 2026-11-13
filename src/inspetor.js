/* Painel da direita: Design, Animação, Slide e Quiz. */
(function () {
  var EA = window.EA, $ = function (s, r) { return (r || document).querySelector(s) }, aba = 'design';
  function ic(n) { return EA.ic(n) }
  var COR_TOK = [['var(--azul)', '#0064e0'], ['var(--tinta)', '#1c2b33'], ['var(--suave)', '#526772'], ['var(--verde)', '#087e58'], ['var(--vermelho)', '#ac3340'], ['var(--ambar)', '#9a5b00'], ['var(--palido)', '#edf5ff'], ['#ffffff', '#ffffff']];

  /* pequenos construtores de campo */
  function campo(rot, el) { var l = EA.el('label', 'in-campo', '<span>' + rot + '</span>'); l.appendChild(el); return l }
  function num(v, f, min, max, passo) { var i = EA.el('input'); i.type = 'number'; i.value = v == null ? '' : v; if (min != null) i.min = min; if (max != null) i.max = max; if (passo) i.step = passo; /* 09/11: número digitado respeita o mínimo e o máximo do campo (antes só as setinhas respeitavam) */ function lim(n) { if (min != null && n < min) n = min; if (max != null && n > max) n = max; return n } i.oninput = function () { var n = parseFloat(i.value); if (!isNaN(n)) f(lim(n)) }; i.onchange = function () { var n = parseFloat(i.value); if (!isNaN(n) && lim(n) !== n) i.value = lim(n); EA.mudou() }; return i }
  function faixa(rot, v, f, min, max, suf) {
    var l = EA.el('label', 'in-campo', '<span>' + rot + '<b class="in-val">' + v + (suf || '') + '</b></span>'), i = EA.el('input'), n = l.querySelector('.in-val');
    i.type = 'range'; i.min = min; i.max = max; i.value = v;
    i.oninput = function () { n.textContent = i.value + (suf || ''); f(+i.value) }; i.onchange = function () { EA.mudou(); EA.miniatura() };
    l.appendChild(i); return l;
  }
  function sel(v, op, f) { var s = EA.el('select'); s.innerHTML = op.map(function (o) { return '<option value="' + EA.esc(o[0]) + '">' + EA.esc(o[1]) + '</option>' }).join(''); s.value = v == null ? '' : v; s.onchange = function () { f(s.value) }; return s }
  function txt(v, f, ph) { var i = EA.el('input'); i.type = 'text'; i.value = v == null ? '' : v; if (ph) i.placeholder = ph; i.oninput = function () { f(i.value) }; i.onchange = function () { EA.mudou() }; return i }
  function area(v, f, ph, lin) { var i = EA.el('textarea'); i.value = v == null ? '' : v; i.rows = lin || 3; if (ph) i.placeholder = ph; i.oninput = function () { f(i.value) }; i.onchange = function () { EA.mudou() }; return i }
  function ck(rot, v, f) { var l = EA.el('label', 'in-ck'), i = EA.el('input'); i.type = 'checkbox'; i.checked = !!v; i.onchange = function () { f(i.checked) }; l.appendChild(i); l.appendChild(document.createTextNode(' ' + rot)); return l }
  function cor(v, f) {
    var w = EA.el('div', 'in-cores');
    COR_TOK.forEach(function (c) { var b = EA.el('button', v === c[0] ? 'on' : ''); b.style.background = c[1]; b.type = 'button'; b.onclick = function () { f(c[0]); EA.mudou(); EA.Inspetor.mostra() }; w.appendChild(b) });
    var i = EA.el('input'); i.type = 'color'; i.value = /^#/.test(v || '') ? v : '#0064e0'; i.title = 'Outra cor'; i.oninput = function () { f(i.value) }; i.onchange = function () { EA.mudou(); EA.Inspetor.mostra() }; w.appendChild(i);
    return w;
  }
  function grupo(t) { return EA.el('h4', 'in-grupo', t) }
  function linha() { var d = EA.el('div', 'in-linha'); [].slice.call(arguments).forEach(function (x) { d.appendChild(x) }); return d }
  /* os de apresentação primeiro; os de jogo depois, marcados */
  var SONS_OP = function () { var ks = Object.keys(EA.SONS), l = [['', 'Sem som']].concat(ks.filter(function (k) { return EA.SONS[k].ap }).map(function (k) { return [k, EA.SONS[k].nome] }), ks.filter(function (k) { return !EA.SONS[k].ap }).map(function (k) { return [k, '🎮 ' + EA.SONS[k].nome] })); var m = EA.projetoAtual.midia; Object.keys(m).forEach(function (k) { if (m[k].tipo === 'audio') l.push(['midia:' + k, '♪ ' + m[k].nome]) }); return l };
  /* com a linha do tempo aberta e a agulha adiante, o que se escolhe fica marcado naquele instante */
  function instante() { return EA.Ed && EA.Ed.timeline && EA.Ed.t > .05 }
  function naMarca(o, campo, v) {
    var m = EA.Ed.marcaAqui(o);
    if (v === '' || v == null) delete m[campo]; else m[campo] = v;
    EA.mudou(); EA.redesenha(); EA.timeline(); EA.Inspetor.mostra();
  }
  function tempoTxt() { return EA.Ed.t.toFixed(1).replace('.', ',') + ' s' }
  function refaz(o) { var e = $('#palco [data-id="' + o.id + '"]'); EA.redesenha() }

  /* ---------- aba Design ---------- */
  function design(c) {
    designCorpo(c);
    var o = EA.objAtual();
    if (EA.IA && o && (o.tipo === 'texto' || EA.IA.temTexto(o))) c.appendChild(iaTexto(o));
    if (EA.IA) c.appendChild(iaTranscreve());
  }
  function designCorpo(c) {
    var os = EA.objsSel(), o = EA.objAtual();
    if (!os.length) { c.appendChild(EA.el('p', 'in-vazio', 'Clique em algo no palco para editar. Dois cliques num texto para escrever.')); return }
    if (!o) {
      c.appendChild(grupo(os.length + ' objetos'));
      var al = EA.el('div', 'in-alinha');
      [['esq', 'layout-align-left'], ['centrar', 'layout-align-center'], ['dir', 'layout-align-right'], ['topo', 'layout-align-top'], ['meio', 'layout-align-middle'], ['base', 'layout-align-bottom']].forEach(function (a) { var b = EA.el('button', '', ic(a[1])); b.title = 'Alinhar'; b.onclick = function () { EA.acao(a[0]) }; al.appendChild(b) });
      c.appendChild(al); return;
    }
    c.appendChild(grupo(EA.nomeObj(o)));
    var pr = o.props;
    if (o.tipo === 'texto') {
      c.appendChild(campo('Fonte', sel(pr.fonte || 'aulao', [['aulao', 'Segoe UI (Aulão)'], ['lexend', 'Lexend'], ['mono', 'Código'], ['pixel', 'Pixel'], ['caligrafia', 'Caligrafia']], function (v) { pr.fonte = v; refaz(o); EA.mudou() })));
      /* 12/11: tamanho digitado ou escolhido na lista de tamanhos de sempre (como no PowerPoint) */
      var nTam = num(pr.tam || 28, function (v) { pr.tam = v; refaz(o) }, 8, 300), cxTam = EA.el('div', 'in-tam');
      var lsTam = sel('', [['', '▾']].concat([10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 72, 80, 96, 120].map(function (n) { return [String(n), String(n)] })), function (v) { if (!v) return; pr.tam = +v; nTam.value = v; lsTam.value = ''; refaz(o); EA.mudou() });
      lsTam.title = 'Tamanhos de sempre'; cxTam.appendChild(nTam); cxTam.appendChild(lsTam);
      c.appendChild(linha(campo('Tamanho', cxTam), campo('Peso', sel(String(pr.peso || 400), [['400', 'Normal'], ['600', 'Médio'], ['650', 'Título'], ['700', 'Forte'], ['800', 'Extra']], function (v) { pr.peso = +v; refaz(o); EA.mudou() }))));
      var fm = EA.el('div', 'in-alinha');
      [['bold', 'bold', 'Negrito'], ['italic', 'italic', 'Itálico'], ['underline', 'underline', 'Sublinhado'], ['insertUnorderedList', 'list', 'Lista com marcadores'], ['insertOrderedList', 'list-numbers', 'Lista numerada']].forEach(function (a) { /* 12/11: listas */ var b = EA.el('button', '', ic(a[1])); b.title = a[2] + ': no trecho selecionado ou, sem seleção, na caixa inteira'; b.onmousedown = function (ev) { ev.preventDefault(); EA.formataTexto(o, a[0]) }; fm.appendChild(b) });
      [['left', 'align-left'], ['center', 'align-center'], ['right', 'align-right']].forEach(function (a) { var b = EA.el('button', (pr.alinha || 'left') === a[0] ? 'on' : '', ic(a[1])); b.onclick = function () { pr.alinha = a[0]; refaz(o); EA.mudou(); EA.Inspetor.mostra() }; fm.appendChild(b) });
      c.appendChild(fm);
      c.appendChild(campo('Cor', cor(pr.cor || 'var(--tinta)', function (v) { pr.cor = v; refaz(o) })));
      c.appendChild(linha(campo('Altura da linha', num(pr.altura || 1.3, function (v) { pr.altura = v; refaz(o) }, .8, 3, .05)), campo('Espaço letras', num(pr.espaco || 0, function (v) { pr.espaco = v; refaz(o) }, -.1, .5, .01))));
    }
    if (o.tipo === 'forma') {
      c.appendChild(campo('Cor', cor(pr.cor || 'var(--azul)', function (v) { pr.cor = v; refaz(o) })));
      c.appendChild(ck('Degradê', !!pr.grad, function (v) { if (v) pr.grad = { cor2: '#004faa', ang: 135 }; else delete pr.grad; refaz(o); EA.mudou(); EA.Inspetor.mostra() }));
      if (pr.grad) {
        c.appendChild(campo('Até a cor', cor(pr.grad.cor2, function (v) { pr.grad.cor2 = v; refaz(o) })));
        c.appendChild(faixa('Direção', pr.grad.ang == null ? 135 : pr.grad.ang, function (v) { pr.grad.ang = v; EA.refazConteudo(o) }, 0, 360, '°'));
      }
      c.appendChild(faixa('Borda', pr.borda || 0, function (v) { pr.borda = v; EA.refazConteudo(o) }, 0, 30, ' px'));
      /* quem escolhe a cor quer ver a borda: sem espessura, ela ganha 2 px */
      c.appendChild(campo('Cor da borda', cor(pr.corBorda || 'var(--tinta)', function (v) { pr.corBorda = v; if (!pr.borda) pr.borda = 2; refaz(o) })));
      c.appendChild(ck('Sombra', pr.sombra, function (v) { pr.sombra = v; refaz(o); EA.mudou() }));
    }
    if (o.tipo === 'icone') {
      c.appendChild(campo('Cor', cor(pr.cor || 'var(--azul)', function (v) { pr.cor = v; refaz(o) })));
      c.appendChild(campo('Espessura', num(pr.traco || 2, function (v) { pr.traco = v; refaz(o) }, .5, 4, .1)));
    }
    /* personagem desenhado: troca a pose mantendo altura, pés e centro */
    var dz = o.tipo === 'imagem' && pr.pers && EA.desenhado && EA.desenhado(pr.pers);
    if (dz) {
      c.appendChild(grupo('Pose'));
      var gp = EA.el('div', 'in-poses');
      dz.poses.forEach(function (ps) {
        var b = EA.el('button', ps.id === pr.pose ? 'on' : '', '<img loading="lazy" alt="" src="' + EA.url(ps.src) + '">');
        b.type = 'button'; b.title = ps.nome;
        b.onclick = function () {
          var cx = o.x + o.w / 2;
          pr.src = ps.src; pr.pose = ps.id;
          o.w = Math.round(o.h * ps.w / ps.h); o.x = Math.round(cx - o.w / 2);
          EA.redesenha(); EA.mudou(); EA.Inspetor.mostra();
        };
        gp.appendChild(b);
      });
      c.appendChild(gp);
    }
    /* GIF animado: repetir sempre ou tocar uma vez (08/11) */
    if (o.tipo === 'imagem' && EA.ehGif(EA.urlMidia(EA.projetoAtual, pr.midia))) {
      c.appendChild(grupo('GIF animado'));
      c.appendChild(campo('Repetição', sel(pr.gif || 'sempre', [['sempre', 'Repetir sempre'], ['uma', 'Tocar uma vez (para no fim)']], function (v) { if (v === 'sempre') delete pr.gif; else pr.gif = v; refaz(o); EA.mudou() })));
      c.appendChild(EA.el('p', 'in-nota', 'Na apresentação ele começa quando a peça aparece. Para ver de novo aqui, clique em Tocar de novo.'));
      var deNovo = EA.el('button', 'in-botao', 'Tocar de novo'); deNovo.type = 'button';
      deNovo.onclick = function () { [].forEach.call(document.querySelectorAll('#palco [data-id="' + o.id + '"] img[data-gif]'), EA.reiniciaGif) };
      c.appendChild(deNovo);
    }
    if (o.tipo === 'imagem' && EA.IA) c.appendChild(iaFundo(o));
    if (o.tipo === 'video' && EA.IA) c.appendChild(iaLegenda(o));
    if (o.tipo === 'camera' && EA.IA) iaCamera(c, o);
    if (o.tipo === 'imagem') {
      c.appendChild(grupo('Máscara'));
      var gm = EA.el('div', 'in-mascaras');
      function botaoMasc(k, nome, clip) {
        var b = EA.el('button', (EA.MASCARAS[pr.masc] === EA.MASCARAS[k] || (!pr.masc && !k)) ? 'on' : '', '<i' + (clip ? ' style="clip-path:' + clip + '"' : ' class="sem"') + '></i>');
        b.title = nome; b.type = 'button'; b.onclick = function () { EA.Ed.poeMascara(o, k) };
        return b;
      }
      gm.appendChild(botaoMasc('', 'Sem máscara', ''));
      Object.keys(EA.MASCARAS).forEach(function (k) { gm.appendChild(botaoMasc(k, EA.MASCARAS[k].nome, EA.MASCARAS[k].ic)) });
      c.appendChild(gm);
      if (pr.masc) {
        c.appendChild(ck('Cor atrás da foto', !!pr.fundoMasc, function (v) { if (v) pr.fundoMasc = 'var(--azul)'; else delete pr.fundoMasc; refaz(o); EA.mudou(); EA.Inspetor.mostra() }));
        if (pr.fundoMasc) c.appendChild(cor(pr.fundoMasc, function (v) { pr.fundoMasc = v; refaz(o) }));
        c.appendChild(zoomFoto(o, ''));
        var aj = EA.el('button', 'in-botao prim', ic('arrows-move') + (EA.Ed.ajustando === o.id ? 'Terminar ajuste' : 'Ajustar a foto'));
        aj.title = 'Também abre com dois cliques na foto.';
        aj.onclick = function () { if (EA.Ed.ajustando === o.id) EA.Ed.fimAjuste(); else EA.Ed.comecaAjuste(o) };
        c.appendChild(aj);
        var cz2 = EA.el('button', 'in-botao', ic('focus-centered') + 'Centralizar a foto');
        cz2.onclick = function () { if (EA.Ed.ajustando === o.id) EA.Ed.fimAjuste(); delete pr.corte; pr.fx = 50; pr.fy = 50; pr.zoom = 1; refaz(o); EA.mudou(); EA.Inspetor.mostra() };
        c.appendChild(cz2);
        c.appendChild(EA.el('p', 'in-nota', 'Dois cliques na foto: arraste para qualquer lado e use a rodinha do mouse para aproximar.'));
      }
    }
    /* corte, em tudo que é imagem. Com máscara, os botões já estão no bloco dela */
    if (EA.Ed.cortavel(o) && !pr.masc) {
      c.appendChild(grupo('Corte'));
      var bc = EA.el('button', 'in-botao' + (EA.Ed.ajustando === o.id ? ' prim' : ''), ic('crop') + (EA.Ed.ajustando === o.id ? 'Terminar o corte' : 'Cortar'));
      bc.title = 'Também abre com dois cliques na imagem.';
      bc.onclick = function () { if (EA.Ed.ajustando === o.id) EA.Ed.fimAjuste(); else EA.Ed.comecaAjuste(o) };
      c.appendChild(bc);
      if (pr.corte) { var dc = EA.el('button', 'in-botao', ic('arrow-back-up') + 'Desfazer o corte'); dc.onclick = function () { if (EA.Ed.ajustando === o.id) EA.Ed.fimAjuste(); delete pr.corte; refaz(o); EA.mudou(); EA.Inspetor.mostra() }; c.appendChild(dc) }
    }
    if (o.tipo === 'imagem' && pr.masc) {
      c.appendChild(campo('Cor da foto', sel(pr.filtro || '', [['', 'Original'], ['pb', 'Preto e branco'], ['azul', 'Tom azul'], ['claro', 'Mais clara']], function (v) { pr.filtro = v; refaz(o); EA.mudou() })));
    } else if (o.tipo === 'imagem' || o.tipo === 'video') {
      c.appendChild(campo('Encaixe', sel(pr.ajuste || 'contain', [['contain', 'Inteira'], ['cover', 'Cobrir'], ['fill', 'Esticar']], function (v) { pr.ajuste = v; refaz(o); EA.mudou() })));
      if (o.tipo === 'imagem') c.appendChild(campo('Cor da foto', sel(pr.filtro || '', [['', 'Original'], ['pb', 'Preto e branco'], ['azul', 'Tom azul'], ['claro', 'Mais clara']], function (v) { pr.filtro = v; refaz(o); EA.mudou() })));
      if (o.tipo === 'imagem' && (pr.ajuste === 'cover')) c.appendChild(ck('Mostrar a parte de cima', pr.topo, function (v) { pr.topo = v; refaz(o); EA.mudou() }));
      if (o.tipo === 'imagem') c.appendChild(ck('Pixel nítido', pr.pixel, function (v) { pr.pixel = v; refaz(o); EA.mudou() }));
      else { c.appendChild(ck('Repetir', pr.repetir, function (v) { pr.repetir = v; EA.mudou() })); c.appendChild(ck('Sem som', pr.mudo, function (v) { pr.mudo = v; EA.mudou() })); c.appendChild(ck('Tocar sozinho', pr.tocar !== false, function (v) { pr.tocar = v; EA.mudou() })); }
    }
    if (o.tipo === 'boneco') {
      c.appendChild(campo('Expressão', sel(pr.quadro || 'base', [['base', 'Normal'], ['feliz', 'Feliz'], ['fala', 'Falando'], ['surpresa', 'Surpresa'], ['duvida', 'Dúvida'], ['preocupado', 'Preocupado'], ['pisca', 'Piscando']], function (v) { pr.quadro = v; refaz(o); EA.mudou() })));
    }
    if (o.tipo === 'lutador' && pr.lut) {
      var listaAn = Object.keys(pr.lut.anims).filter(function (a) { return a !== 'walk' || pr.lut.doll }).map(function (a) { return [a, EA.ANIM_NOMES[a] || a] });
      if (instante()) {
        var mqD = EA.kfMarca(o, EA.Ed.t);
        c.appendChild(EA.el('p', 'in-nota', 'A escolha fica marcada na linha do tempo, em ' + tempoTxt() + '.'));
        c.appendChild(campo('Animação em ' + tempoTxt(), sel(mqD && mqD.anim || '', [['', 'Continuar como está']].concat(listaAn), function (v) { naMarca(o, 'anim', v) })));
      } else {
      c.appendChild(campo('Animação', sel(pr.anim || 'idle', listaAn, function (v) { pr.anim = v; refaz(o); EA.mudou() })));
      if (pr.lut.doll) c.appendChild(campo('Olhando', sel(pr.dir || 'baixo', [['baixo', 'De frente'], ['direita', 'Direita'], ['esquerda', 'Esquerda'], ['cima', 'De costas']], function (v) { pr.dir = v; refaz(o); EA.mudou() })));
      }
    }
    if (o.tipo === 'efeito') {
      c.appendChild(ck('Repetir sem parar', pr.repetir, function (v) { pr.repetir = v; EA.mudou() }));
      if (!pr.repetir) c.appendChild(ck('Ficar parado no último quadro', pr.ficar, function (v) { pr.ficar = v; EA.mudou() }));
      c.appendChild(campo('Velocidade', sel(String(pr.vel || 1), [['0.5', 'Lenta'], ['1', 'Normal'], ['1.5', 'Rápida'], ['2', 'Muito rápida']], function (v) { pr.vel = +v; refaz(o); EA.mudou() })));
    }
    if (o.tipo === 'apres') {
      var defA = EA.FX_APRES[pr.ef] || {};
      c.appendChild(campo('Cor', cor(pr.cor || defA.cor || 'var(--azul)', function (v) { pr.cor = v; refaz(o) })));
      c.appendChild(ck('Repetir sem parar', pr.repetir !== false, function (v) { pr.repetir = v; refaz(o); EA.mudou() }));
      c.appendChild(campo('Velocidade', sel(String(pr.vel || 1), [['0.5', 'Lenta'], ['1', 'Normal'], ['1.5', 'Rápida'], ['2', 'Muito rápida']], function (v) { pr.vel = +v; refaz(o); EA.mudou() })));
      c.appendChild(EA.el('p', 'in-nota', 'Sem repetir, ele toca uma vez quando entra e fica na tela. Escolha quando entra na aba Animação.'));
    }
    if (o.tipo === 'ui' && pr.modelo === 'chave') {
      c.appendChild(campo('Estado', sel(pr.ligado === false ? 'nao' : 'sim', [['sim', 'Ligado'], ['nao', 'Desligado']], function (v) {
        pr.ligado = v === 'sim';
        if (pr.campos.t === 'Opção ligada' || pr.campos.t === 'Opção desligada') pr.campos.t = pr.ligado ? 'Opção ligada' : 'Opção desligada';
        refaz(o); EA.mudou(); EA.Inspetor.mostra();
      })));
    }
    if (o.tipo === 'ui' && pr.modelo === 'balao') {
      var cd = pr.cauda = pr.cauda || EA.clona(EA.CAUDA_PADRAO);
      c.appendChild(grupo('Rabinho'));
      c.appendChild(ck('Mostrar rabinho', !cd.sem, function (v) { cd.sem = !v; refaz(o); EA.mudou(); EA.Inspetor.mostra() }));
      if (!cd.sem) {
        c.appendChild(campo('Largura da base', num(cd.b || 26, function (v) { cd.b = v; refaz(o) }, 6, 200)));
        var cz = EA.el('button', 'in-botao', ic('focus-centered') + 'Base seguindo a ponta');
        cz.title = 'A base volta a acompanhar a ponta do rabinho.';
        cz.onclick = function () { cd.pos = null; refaz(o); EA.mudou() };
        c.appendChild(cz);
        c.appendChild(EA.el('p', 'in-nota', 'No palco: arraste a bolinha laranja para mover e esticar a ponta. A bolinha menor desliza a base pela borda.'));
      }
    }
    if (o.tipo === 'desenho') {
      if (/var\(--c/.test(pr.svg || '')) {
        c.appendChild(campo('Cor', cor(pr.cor || '', function (v) { pr.cor = v; refaz(o) })));
        if (pr.cor) { var vc = EA.el('button', 'in-botao', ic('arrow-back-up') + 'Voltar à cor original'); vc.onclick = function () { delete pr.cor; refaz(o); EA.mudou(); EA.Inspetor.mostra() }; c.appendChild(vc) }
      }
    }
    if (o.tipo === 'rig') painelRig(c, o);
    if (o.tipo === 'ui') {
      var dfUi = EA.ELEMENTOS[pr.modelo] || {};
      (dfUi.fotos || []).forEach(function (f) { lugarFoto(c, o, f[0], f[1]) });
      Object.keys(pr.campos || {}).forEach(function (k) {
        var longo = String(pr.campos[k]).length > 34 || k === 't' && pr.modelo === 'codigo';
        var rot = { t: 'Texto', d: 'Descrição', i: 'Marca', n: 'Número', v: 'Valor', m: 'Letra', a: 'Etiqueta 1', b: 'Etiqueta 2', url: 'Endereço', nome: 'Nome do perfil', sub: 'Abaixo do nome', bt: 'Texto do botão', tit: 'Título', rot: 'Rótulo', dados: 'Valores (separe por vírgula)', nomes: 'Nomes (separe por vírgula)' }[k] || k;
        if (EA.ELEMENTOS[pr.modelo] && EA.ELEMENTOS[pr.modelo].grupo === 'graficos' && k === 't') rot = 'Título';
        if (/^g_(rosca|medidor)$/.test(pr.modelo) && k === 't') rot = 'Legenda';
        if (pr.modelo === 'post' && k === 't') rot = 'Texto da publicação';
        if (pr.modelo === 'cartaofoto' && k === 't') rot = 'Título';
        if (pr.modelo === 'chat') rot = k === 'a' ? 'Nome da outra pessoa' : 'Seu nome';
        if (pr.modelo === 'pontoclique') rot = { n: 'Número no ponto', t: 'Título da caixa', d: 'Texto da caixa' }[k];
        if (pr.modelo === 'antesdepois') rot = k === 'a' ? 'Rótulo do antes' : 'Rótulo do depois';
        if (pr.modelo === 'cartas') rot = k === 'e' ? 'Lado esquerdo (não)' : 'Lado direito (sim)';
        if (pr.modelo === 'navegador' && k === 't') rot = 'Texto na página';
        if (/^g_(rosca|medidor)$/.test(pr.modelo) && k === 'v') rot = 'Valor (0 a 100%)';
        if (pr.modelo === 'g_metrica' && k === 'v') rot = 'Variação (use − para queda)';
        if (pr.modelo === 'g_metrica' && k === 'n') rot = 'Número em destaque';
        if (pr.modelo === 'g_metrica' && k === 'dados') rot = 'Linha pequena (valores)';
        if (dfUi.rotulos && dfUi.rotulos[k]) rot = dfUi.rotulos[k]; /* 10/11: elemento diz o nome dos próprios campos */
        var f = function (v) { pr.campos[k] = v.replace(/</g, '&lt;').replace(/\n/g, pr.modelo === 'codigo' ? '\n' : '<br>'); refaz(o) };
        var vi = String(pr.campos[k]).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<br>/g, '\n');
        c.appendChild(campo(rot, longo ? area(vi, f, '', k === 't' && pr.modelo === 'codigo' ? 6 : 3) : txt(vi, f)));
      });
      if (pr.modelo !== 'dialogo') c.appendChild(campo(dfUi.corRot || 'Cor de destaque', cor(pr.cor || dfUi.corPad || 'var(--azul)', function (v) { pr.cor = v; refaz(o) })));
      (dfUi.cores || []).forEach(function (q) { c.appendChild(campo(q[1], cor(pr[q[0]] || q[2], function (v) { pr[q[0]] = v; refaz(o) }))) });
      if (dfUi.tamTexto) c.appendChild(faixa('Tamanho do texto', pr.tamTexto || (pr.modelo === 'chat' ? 16 : 20), function (v) { pr.tamTexto = v; EA.refazConteudo(o) }, 10, 48, ' px'));
      if (pr.modelo === 'chat') painelChat(c, o);
      if (pr.modelo === 'codigo') painelRealces(c, o);
      if (EA.Mapa && EA.Mapa.ehMapa(o)) painelMapa(c, o);
      if (dfUi.grupo === 'interativos') painelInterativo(c, o);
      /* 10/11: elementos novos (hf_*.js) montam o próprio pedaço do painel com as ferramentas daqui */
      /* 13/11: som opcional, nasce desligado */
      if (dfUi.grupo === 'hf') c.appendChild(ck('Com som', pr.som, function (v) { pr.som = v; refaz(o); EA.mudou() }));
      if (dfUi.painel) try { dfUi.painel(c, o, { campo: campo, faixa: faixa, sel: sel, txt: txt, area: area, ck: ck, cor: cor, grupo: grupo, listaItens: listaItens, lugarFoto: lugarFoto,
        refaz: function () { refaz(o) }, muda: function () { refaz(o); EA.mudou() }, mostra: function () { EA.Inspetor.mostra() }, nota: function (t) { c.appendChild(EA.el('p', 'in-nota', t)) } }) } catch (x) { console.error(x) }
    }
    c.appendChild(grupo('Posição e tamanho'));
    var g = o.kf && o.kf.length ? EA.estadoEm(o, EA.Ed.t) : o;
    function geo(k) { return function (v) { var n = {}; n[k] = v; var g0c = Object.assign({}, EA.objAtual() === o && o.kf && o.kf.length ? EA.estadoEm(o, EA.Ed.t) : o), c0c = (k === 'w' || k === 'h') && o.tipo !== 'ui' && pr.corte ? Object.assign({}, pr.corte) : null; EA.aplicaGeo(o, n); if (c0c) EA.Ed.reescalaCorte(o, c0c, g0c, Object.assign({}, g0c, n)); var e = $('#palco [data-id="' + o.id + '"]'); if (e) EA.geometria(e, o.kf && o.kf.length ? EA.estadoEm(o, EA.Ed.t) : o); if (k === 'w' || k === 'h') EA.refazConteudo(o); EA.desenhaSel() } }
    var lx = linha(campo('X', num(g.x, geo('x'))), campo('Y', num(g.y, geo('y')))), lt = linha(campo('Largura', num(g.w, geo('w'), 8)), campo('Altura', num(g.h, geo('h'), 8)));
    /* travado: lugar e tamanho ficam só para ver (08/11) */
    if (o.travado) [lx, lt].forEach(function (q) { [].forEach.call(q.querySelectorAll('input'), function (i) { i.disabled = true; i.title = 'Destrave no cadeado para mudar' }) });
    c.appendChild(lx); c.appendChild(lt);
    c.appendChild(faixa('Opacidade', Math.round((g.op == null ? 1 : g.op) * 100), function (v) { geo('op')(v / 100) }, 0, 100, '%'));
    var at = EA.el('div', 'in-alinha');
    var virado = !!(instante() ? EA.efetivoEm(o, EA.Ed.t).vira : pr.vira);
    [['centrar', 'layout-align-center', 'Centro horizontal'], ['meio', 'layout-align-middle', 'Centro vertical'], ['frente', 'ea-frente', 'Trazer para a frente de tudo'], ['tras', 'ea-tras', 'Levar para trás de tudo'], ['virar', 'flip-vertical', 'Virar para o outro lado'], ['trava', o.travado ? 'lock' : 'lock-open', o.travado ? 'Travado: clique para destravar' : 'Travar (não sai do lugar sem querer)'], ['duplicar', 'copy', 'Duplicar'], ['apagar', 'trash', 'Apagar']].forEach(function (a) { var b = EA.el('button', (a[0] === 'virar' && virado) || (a[0] === 'trava' && o.travado) ? 'on' : '', ic(a[1])); b.title = a[2]; b.onclick = function () { EA.acao(a[0]) }; at.appendChild(b) });
    c.appendChild(at);
    var tr = EA.el('button', 'in-botao', ic('replace') + 'Trocar este objeto por outro');
    tr.title = 'Mantém o lugar e as animações. Depois escolha o novo no painel.';
    tr.onclick = function () { EA.Ed.trocando = true; document.body.classList.add('trocando'); EA.aviso('Escolha o novo objeto nos botões de cima. Esc cancela.') };
    c.appendChild(tr);
  }

  /* ---------- 07/11 conversa: estilo e mensagens (uma linha por mensagem: de quem, texto, hora) ---------- */
  function painelChat(c, o) {
    var pr = o.props;
    if (!pr.msgs) pr.msgs = EA.clona(EA.CHAT_PADRAO);
    function muda() { refaz(o); EA.mudou() }
    c.appendChild(campo('Estilo', sel(pr.estilo || 'pessoal', EA.CHAT_ESTILOS, function (v) { pr.estilo = v; muda(); EA.Inspetor.mostra() })));
    c.appendChild(ck('Mensagens aparecem uma por uma', pr.umaUma, function (v) { pr.umaUma = v; muda() }));
    c.appendChild(grupo('Mensagens'));
    var horas = (pr.estilo || 'pessoal') !== 'pessoal';
    pr.msgs.forEach(function (m, i) {
      var cx = EA.el('div', 'in-msg' + (m.de === 'b' ? ' eu' : ''));
      var topo = EA.el('div', 'in-msg-t');
      topo.appendChild(sel(m.de, [['a', pr.campos.a ? String(pr.campos.a).replace(/<[^>]+>/g, '') : 'Outra pessoa'], ['b', (pr.campos.b ? String(pr.campos.b).replace(/<[^>]+>/g, '') : 'Você') + ' (você)']], function (v) { m.de = v; muda(); EA.Inspetor.mostra() }));
      if (horas) { var h = txt(m.h || '', function (v) { m.h = v; refaz(o) }, 'hora'); h.className = 'in-msg-h'; topo.appendChild(h) }
      [['arrow-up', 'Subir', -1], ['arrow-down', 'Descer', 1]].forEach(function (q) {
        var b = EA.el('button', '', ic(q[0])); b.title = q[1]; b.disabled = !pr.msgs[i + q[2]];
        b.onclick = function () { var j = i + q[2]; pr.msgs[i] = pr.msgs[j]; pr.msgs[j] = m; muda(); EA.Inspetor.mostra() };
        topo.appendChild(b);
      });
      var ap = EA.el('button', '', ic('trash')); ap.title = 'Apagar esta mensagem';
      ap.onclick = function () { pr.msgs.splice(i, 1); muda(); EA.Inspetor.mostra() };
      topo.appendChild(ap);
      cx.appendChild(topo);
      cx.appendChild(area(m.t, function (v) { m.t = v; refaz(o) }, 'Escreva a mensagem', 2));
      c.appendChild(cx);
    });
    var nv = EA.el('button', 'in-botao', ic('message-plus') + 'Nova mensagem');
    nv.onclick = function () { var u = pr.msgs[pr.msgs.length - 1]; pr.msgs.push({ de: u && u.de === 'a' ? 'b' : 'a', t: '', h: u && u.h || '' }); muda(); EA.Inspetor.mostra() };
    c.appendChild(nv);
  }
  /* ---------- 07/11 mapas: tipo, país, bandeira, nomes e pintar os estados clicando no palco ---------- */
  function painelMapa(c, o) {
    var pr = o.props, M = EA.Mapa, modo = M.modo(o);
    function muda() { refaz(o); EA.mudou() }
    if (!M.dados.mundo) M.carrega('mundo').then(function () { if (EA.objAtual() === o) EA.Inspetor.mostra() });
    c.appendChild(campo('Tipo de mapa', sel(modo, [['pais', 'País com estados'], ['mundo', 'Mapa-múndi']], function (v) { M.pincel = null; pr.modo = v; muda(); EA.Inspetor.mostra() })));
    var nomes = Object.keys(M.PAISES).map(function (k) { return [k, M.PAISES[k]] }).sort(function (a, b) { return a[1].localeCompare(b[1]) });
    if (modo === 'pais') {
      c.appendChild(campo('País', sel(pr.pais || 'BR', nomes, function (v) { pr.pais = v; M.pincel = null; muda(); EA.Inspetor.mostra() })));
      c.appendChild(ck('Mostrar a bandeira', pr.bandeira !== false, function (v) { pr.bandeira = v; muda() }));
      c.appendChild(ck('Nomes dos estados', pr.rotulos, function (v) { pr.rotulos = v; muda() }));
    }
    {
      c.appendChild(grupo(modo === 'pais' ? 'Colorir os estados' : 'Colorir os países'));
      var pc = M.pincel && M.pincel.oid === o.id ? M.pincel : null;
      var cor0 = (pc && pc.cor) || pr.corPincel || '#2563eb';
      c.appendChild(campo('Cor do pincel', cor(cor0, function (v) { pr.corPincel = v; if (M.pincel && M.pincel.oid === o.id) { M.pincel.cor = v; M.pincel.borracha = false } })));
      var bts = EA.el('div', 'in-linha');
      var bP = EA.el('button', 'in-botao' + (pc && !pc.borracha ? ' on' : ''), ic('brush') + (pc && !pc.borracha ? 'Parar de pintar' : 'Pintar no palco'));
      bP.onclick = function () { M.pincel = pc && !pc.borracha ? null : { oid: o.id, cor: pr.corPincel || '#2563eb' }; EA.Inspetor.mostra() };
      var bB = EA.el('button', 'in-botao' + (pc && pc.borracha ? ' on' : ''), ic('eraser') + 'Borracha');
      bB.onclick = function () { M.pincel = pc && pc.borracha ? null : { oid: o.id, borracha: true }; EA.Inspetor.mostra() };
      bts.appendChild(bP); bts.appendChild(bB); c.appendChild(bts);
      c.appendChild(EA.el('p', 'in-nota', 'Com o pincel ligado, clique nos estados no palco. Sem cor, cada um fica num tom de cinza.'));
      if (pr.cores && Object.keys(pr.cores).length) { var lp = EA.el('button', 'in-botao', ic('arrow-back-up') + 'Voltar tudo ao cinza'); lp.onclick = function () { pr.cores = {}; muda(); EA.Inspetor.mostra() }; c.appendChild(lp) }
    }
    c.appendChild(EA.el('p', 'in-nota', modo === 'pais' ? 'Na apresentação, passar o mouse mostra o nome do estado.' : 'Na apresentação: clique num país para abrir o mapa dele, com os estados e a bandeira.'));
  }
  /* ---------- 07/11 interativos: ponto, palavras, antes e depois, abas/sanfona, cartas ---------- */
  /* lista editável: cada item vira uma caixinha com seus campos, setas para mudar a ordem e lixeira */
  function listaItens(c, o, arr, tit, campos, novo, rotNovo) {
    function muda() { refaz(o); EA.mudou() }
    c.appendChild(grupo(tit));
    arr.forEach(function (q, i) {
      var cx = EA.el('div', 'in-msg' + (q.lado === 'd' ? ' eu' : '')), topo = EA.el('div', 'in-msg-t');
      campos.forEach(function (f) {
        if (f.tipo === 'sel') topo.appendChild(sel(q[f.k] || '', f.op, function (v) { q[f.k] = v; muda(); EA.Inspetor.mostra() }));
        else if (f.tipo === 'linha') { var t = txt(q[f.k] || '', function (v) { q[f.k] = v; refaz(o) }, f.ph); t.className = 'in-msg-cod'; topo.appendChild(t) }
      });
      [['arrow-up', 'Subir', -1], ['arrow-down', 'Descer', 1]].forEach(function (s) {
        var b = EA.el('button', '', ic(s[0])); b.title = s[1]; b.disabled = !arr[i + s[2]];
        b.onclick = function () { var j = i + s[2]; arr[i] = arr[j]; arr[j] = q; muda(); EA.Inspetor.mostra() };
        topo.appendChild(b);
      });
      var ap = EA.el('button', '', ic('trash')); ap.title = 'Apagar'; ap.onclick = function () { arr.splice(i, 1); muda(); EA.Inspetor.mostra() };
      topo.appendChild(ap); cx.appendChild(topo);
      campos.forEach(function (f) { if (f.tipo === 'area') cx.appendChild(area(q[f.k] || '', function (v) { q[f.k] = v; refaz(o) }, f.ph, 2)) });
      c.appendChild(cx);
    });
    var nv = EA.el('button', 'in-botao', ic('plus') + rotNovo); nv.onclick = function () { arr.push(novo()); muda(); EA.Inspetor.mostra() }; c.appendChild(nv);
  }
  function painelInterativo(c, o) {
    var pr = o.props, m = pr.modelo;
    function muda() { refaz(o); EA.mudou() }
    if (m === 'pontoclique') {
      c.appendChild(campo('A caixa abre para', sel(pr.lado || 'direita', [['direita', 'A direita'], ['esquerda', 'A esquerda'], ['cima', 'Cima'], ['baixo', 'Baixo']], function (v) { pr.lado = v; muda() })));
      c.appendChild(faixa('Largura da caixa', pr.larguraCaixa || 280, function (v) { pr.larguraCaixa = v; refaz(o) }, 160, 520, ' px'));
      c.appendChild(ck('Ver a caixa aberta aqui no Design', pr.verCaixa, function (v) { pr.verCaixa = v; muda() }));
      c.appendChild(EA.el('p', 'in-nota', 'Na apresentação o ponto cintila; clicar abre e fecha a caixa. Deixe o "Número" vazio para um ponto sem número.'));
    }
    if (m === 'glossario') {
      if (!pr.palavras) pr.palavras = [{ t: 'Pixel', d: 'Um código da Meta no site que avisa quando alguém compra.' }, { t: 'CTR', d: 'De cada 100 pessoas que veem o anúncio, quantas clicam.' }];
      listaItens(c, o, pr.palavras, 'Palavras explicadas', [{ k: 't', tipo: 'linha', ph: 'palavra (igual ao texto)' }, { k: 'd', tipo: 'area', ph: 'O que aparece ao clicar' }], function () { return { t: '', d: '' } }, 'Nova palavra');
      c.appendChild(EA.el('p', 'in-nota', 'Escreva a palavra do jeito que está no texto. Na apresentação, clicar nela abre o balãozinho; clicar de novo fecha.'));
    }
    if (m === 'antesdepois') {
      c.appendChild(faixa('A barra começa em', pr.pos == null ? 50 : pr.pos, function (v) { pr.pos = v; refaz(o) }, 5, 95, '%'));
      c.appendChild(EA.el('p', 'in-nota', 'Na apresentação, arraste em cima da foto para comparar.'));
    }
    if (m === 'abas') {
      if (!pr.itens) pr.itens = EA.clona(EA.ITENS_PADRAO);
      c.appendChild(campo('Estilo', sel(pr.estilo || 'abas', [['abas', 'Abas (uma de cada vez)'], ['sanfona', 'Sanfona (abre e fecha)']], function (v) { pr.estilo = v; muda() })));
      listaItens(c, o, pr.itens, pr.estilo === 'sanfona' ? 'Partes da sanfona' : 'Abas', [{ k: 't', tipo: 'linha', ph: 'título' }, { k: 'd', tipo: 'area', ph: 'conteúdo' }], function () { return { t: 'Nova parte', d: '' } }, 'Nova parte');
    }
    if (m === 'cartas') {
      if (!pr.cartas) pr.cartas = EA.clona(EA.CARTAS_PADRAO);
      var e = String(pr.campos.e || 'esquerda').replace(/<[^>]+>/g, ''), d = String(pr.campos.d || 'direita').replace(/<[^>]+>/g, '');
      listaItens(c, o, pr.cartas, 'Cartas', [{ k: 'lado', tipo: 'sel', op: [['', 'Sem resposta certa'], ['e', 'Certo: ' + e], ['d', 'Certo: ' + d]] }, { k: 't', tipo: 'area', ph: 'texto da carta' }], function () { return { t: '', lado: '' } }, 'Nova carta');
      c.appendChild(EA.el('p', 'in-nota', 'Na apresentação, arraste a carta para um lado (ou use os botões). Se a carta tem lado certo, ela acende verde ou vermelho e no fim aparece o placar.'));
    }
  }
  /* ---------- 07/11 código: partes que acendem ao passar o mouse na apresentação ---------- */
  function painelRealces(c, o) {
    var pr = o.props, rs = pr.realces = pr.realces || [];
    function muda() { refaz(o); EA.mudou() }
    c.appendChild(grupo('Partes que acendem'));
    c.appendChild(EA.el('p', 'in-nota', 'Na apresentação, ao passar o mouse em cima da parte, ela acende e a explicação aparece embaixo da janela. A cor é a cor de destaque.'));
    rs.forEach(function (q, i) {
      var cx = EA.el('div', 'in-msg'), topo = EA.el('div', 'in-msg-t');
      var t = txt(q.t, function (v) { q.t = v; refaz(o) }, 'trecho do código'); t.className = 'in-msg-cod'; topo.appendChild(t);
      var ap = EA.el('button', '', ic('trash')); ap.title = 'Tirar esta parte'; ap.onclick = function () { rs.splice(i, 1); muda(); EA.Inspetor.mostra() };
      topo.appendChild(ap); cx.appendChild(topo);
      cx.appendChild(area(q.d || '', function (v) { q.d = v }, 'Explicação (opcional)', 2));
      if (q.t && EA.codigoTexto(pr.campos.t).indexOf(q.t) < 0) cx.appendChild(EA.el('p', 'in-nota in-aviso', 'Esse trecho não está no código. Confira espaços e letras.'));
      c.appendChild(cx);
    });
    var nv = EA.el('button', 'in-botao', ic('highlight') + 'Marcar o trecho selecionado');
    nv.title = 'Selecione um pedaço no texto do código, aqui em cima, e clique.';
    nv.onclick = function () {
      var ta = c.querySelector('textarea'), s = ta && ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
      rs.push({ t: s || '', d: '' }); muda(); EA.Inspetor.mostra();
      if (!s) EA.aviso('Escreva no campo o trecho que vai acender (ou selecione no texto do código antes de clicar).');
    };
    c.appendChild(nv);
  }
  function zoomFoto(o, k) {
    var zw = EA.el('label', 'in-campo', '<span>Zoom da foto</span>'), zi = EA.el('input'); zi.type = 'range'; zi.min = 20; zi.max = 400; zi.step = 5; zi.dataset.zoom = k; zi.value = Math.round(EA.Ed.zoomDe(o, k) * 100);
    zi.oninput = function () { EA.Ed.poeZoom(o, k, +zi.value / 100) }; zi.onchange = function () { EA.mudou(); EA.miniatura() };
    zw.appendChild(zi); return zw;
  }
  /* ---------- foto num lugar de um elemento: já vem o modelo; aqui escolhe ou sobe outra e ela entra sozinha ---------- */
  function lugarFoto(c, o, k, nome) {
    var pr = o.props, tem = pr['midia' + k] || pr['src' + k], principal = k === '';
    c.appendChild(grupo(nome));
    function poe(midia, src) {
      if (midia) { pr['midia' + k] = midia; delete pr['src' + k] } else { pr['src' + k] = src; delete pr['midia' + k] }
      delete pr['corte' + k];
      if (principal) { pr.fx = 50; pr.fy = 50; pr.zoom = 1 }
      refaz(o); EA.mudou(); EA.Inspetor.mostra();
    }
    var sobe = EA.el('button', 'in-botao prim', ic('upload') + 'Subir imagem'), inp = EA.el('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.hidden = true;
    sobe.type = 'button'; sobe.onclick = function () { inp.click() };
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      EA.Gravar.paraDataUrl(f).then(function (d) {
        var i = new Image(); i.onload = function () { var id = EA.uid(); EA.projetoAtual.midia[id] = { tipo: 'imagem', nome: f.name, dados: d, w: i.naturalWidth, h: i.naturalHeight }; poe(id) };
        i.onerror = function () { EA.aviso('Não consegui abrir essa imagem.') }; i.src = d;
      });
    };
    c.appendChild(inp); c.appendChild(sobe);
    var m = EA.projetoAtual.midia, doMaterial = Object.keys(m).filter(function (i) { return m[i].tipo === 'imagem' && !m[i].folha });
    if (doMaterial.length) {
      var det1 = EA.el('details', 'in-det', '<summary>Já estão neste material</summary>'), g1 = EA.el('div', 'in-fotos');
      det1.ontoggle = function () {
        if (!det1.open || g1.childNodes.length) return;
        doMaterial.forEach(function (i) { var b = EA.el('button', pr['midia' + k] === i ? 'on' : '', '<img alt="" loading="lazy" src="' + EA.urlMidia(EA.projetoAtual, i) + '">'); b.type = 'button'; b.title = m[i].nome || 'Imagem'; b.onclick = function () { poe(i) }; g1.appendChild(b) });
      };
      det1.appendChild(g1); c.appendChild(det1);
    }
    if ((window.EA_PESSOAS || []).length) {
      var det = EA.el('details', 'in-det', '<summary>Escolher entre as pessoas prontas</summary>'), g2 = EA.el('div', 'in-fotos');
      det.ontoggle = function () {
        if (!det.open || g2.childNodes.length) return;
        window.EA_PESSOAS.forEach(function (q) { var b = EA.el('button', pr['src' + k] === q.src ? 'on' : '', '<img alt="" loading="lazy" src="' + q.src + '">'); b.type = 'button'; b.title = q.nome; b.onclick = function () { poe(null, q.src) }; g2.appendChild(b) });
      };
      det.appendChild(g2); c.appendChild(det);
    }
    if (!tem) return;
    c.appendChild(zoomFoto(o, k));
    var aqui = EA.Ed.ajustando === o.id && (EA.Ed.ajusteK || '') === k;
    var aj = EA.el('button', 'in-botao', ic('arrows-move') + (aqui ? 'Terminar ajuste' : 'Ajustar a foto'));
    aj.title = 'Também abre com dois cliques na foto.';
    aj.onclick = function () { if (aqui) EA.Ed.fimAjuste(); else EA.Ed.comecaAjuste(o, k) };
    c.appendChild(aj);
    var tira = EA.el('button', 'in-botao', ic('trash') + 'Voltar à foto de exemplo');
    tira.onclick = function () { if (EA.Ed.ajustando === o.id) EA.Ed.fimAjuste(); delete pr['midia' + k]; delete pr['src' + k]; delete pr['corte' + k]; if (principal) { delete pr.fx; delete pr.fy; delete pr.zoom } refaz(o); EA.mudou(); EA.Inspetor.mostra() };
    c.appendChild(tira);
  }

  /* ---------- boneco de ossos ---------- */
  var RIG_OP = {
    mv: [['idle', 'Parado'], ['none', 'Congelado'], ['walk', 'Andar'], ['run', 'Correr'], ['wave', 'Acenar'], ['point', 'Apontar'], ['talk', 'Explicar (gesticulando)'], ['present', 'Apresentar'], ['think', 'Pensar'], ['thumbs', 'Joinha'], ['phone', 'Falar no celular'], ['cross', 'Braços cruzados'], ['hips', 'Mãos na cintura'], ['raise', 'Levantar a mão'], ['clap', 'Aplaudir'], ['shrug', 'Dar de ombros'], ['jump', 'Pular de alegria'], ['cheer', 'Comemorar'], ['dance', 'Dançar']],
    hm: [['none', 'Parada'], ['yes', 'Dizer sim'], ['no', 'Dizer não'], ['look', 'Olhar em volta']],
    mm: [['none', 'Fechada'], ['talk', 'Falando']],
    mood: [['neutral', 'Neutro'], ['happy', 'Feliz'], ['confident', 'Confiante'], ['surprised', 'Surpreso'], ['sad', 'Triste'], ['angry', 'Bravo'], ['wink', 'Piscando']],
    hs: [['short', 'Curto'], ['side', 'Social (repartido)'], ['buzz', 'Raspado'], ['long', 'Longo'], ['wavy', 'Ondulado'], ['bob', 'Chanel (curto)'], ['bun', 'Coque'], ['ponytail', 'Rabo de cavalo'], ['afro', 'Volumoso'], ['bald', 'Careca']],
    ts: [['tee', 'Camiseta'], ['polo', 'Polo'], ['tank', 'Regata'], ['long', 'Manga longa'], ['hoodie', 'Moletom'], ['suit', 'Terno'], ['labcoat', 'Jaleco'], ['dress', 'Vestido']],
    bs: [['pants', 'Calça'], ['shorts', 'Bermuda'], ['skirt', 'Saia']],
    bd: [['slim', 'Magro'], ['mid', 'Médio'], ['strong', 'Forte']],
    shs: [['sneaker', 'Tênis'], ['dress', 'Sapato social'], ['boot', 'Bota']],
    prop: [['none', 'Nenhum'], ['phone', 'Celular'], ['clip', 'Prancheta'], ['cup', 'Caneca']],
    mao: [['relaxada', 'Relaxada'], ['aberta', 'Aberta'], ['apontar', 'Apontando'], ['paz', 'Paz'], ['oferecer', 'Oferecendo'], ['punho', 'Fechada'], ['joia', 'Joinha'], ['grip', 'Segurando']]
  };
  function painelRig(c, o) {
    var pr = o.props, def = window.EA_RIG_MOTOR.DEF;
    pr.ch = pr.ch || {};
    c.appendChild(grupo('Pose'));
    c.appendChild(ck('Posar à mão (mexer o esqueleto)', pr.posar, function (v) {
      pr.posar = v;
      if (v && !pr.pose) pr.pose = EA.Rig.poseInicial(pr, o.id);
      refaz(o); EA.mudou(); EA.Inspetor.mostra();
    }));
    if (pr.posar && pr.pose) {
      c.appendChild(EA.el('p', 'in-nota', 'Arraste as bolinhas no palco. Cotovelo e joelho levam o resto do membro junto.'));
      c.appendChild(linha(
        campo('Mão da direita', sel(pr.pose.maoR || 'relaxada', RIG_OP.mao, function (v) { EA.Rig.maoEm(pr, 'R', v); refaz(o); EA.mudou() })),
        campo('Mão da esquerda', sel(pr.pose.maoL || 'relaxada', RIG_OP.mao, function (v) { EA.Rig.maoEm(pr, 'L', v); refaz(o); EA.mudou() }))));
      var rc = EA.el('button', 'in-botao', ic('arrow-back-up') + 'Recomeçar a pose'); rc.title = 'Volta para a posição do movimento escolhido.';
      rc.onclick = function () { pr.pose = EA.Rig.poseInicial(pr, o.id); refaz(o); EA.mudou(); EA.Inspetor.mostra() };
      c.appendChild(rc);
    }
    function muda(k) { return function (v) { pr[k] = v; refaz(o); EA.mudou() } }
    if (!pr.posar) {
      c.appendChild(grupo('Movimento'));
      c.appendChild(campo('Corpo', sel(pr.mv || 'idle', RIG_OP.mv, muda('mv'))));
      c.appendChild(campo('Cabeça', sel(pr.hm || 'none', RIG_OP.hm, muda('hm'))));
      c.appendChild(campo('Velocidade', sel(String(pr.vel || 1), [['0.5', 'Lenta'], ['1', 'Normal'], ['1.5', 'Rápida'], ['2', 'Muito rápida']], function (v) { pr.vel = +v; EA.mudou() })));
    }
    c.appendChild(grupo('Rosto'));
    c.appendChild(linha(campo('Expressão', sel(pr.mood || 'neutral', RIG_OP.mood, muda('mood'))), campo('Boca', sel(pr.mm || 'none', RIG_OP.mm, muda('mm')))));
    c.appendChild(grupo('Aparência'));
    function tinta(k, rot) { var i = EA.el('input'); i.type = 'color'; i.value = pr.ch[k] || def[k]; i.oninput = function () { pr.ch[k] = i.value; refaz(o) }; i.onchange = function () { EA.mudou() }; return campo(rot, i) }
    c.appendChild(linha(tinta('skin', 'Pele'), tinta('hair', 'Cabelo')));
    c.appendChild(linha(tinta('top', 'Roupa'), tinta('bottom', 'Calça/saia')));
    c.appendChild(linha(tinta('shoes', 'Sapato'), campo('Corpo', sel(pr.ch.bd || def.bd, RIG_OP.bd, function (v) { pr.ch.bd = v; refaz(o); EA.mudou() }))));
    function opcao(k, rot) { return campo(rot, sel(pr.ch[k] || def[k], RIG_OP[k], function (v) { pr.ch[k] = v; refaz(o); EA.mudou() })) }
    c.appendChild(opcao('hs', 'Cabelo')); c.appendChild(linha(opcao('ts', 'Parte de cima'), opcao('bs', 'Parte de baixo')));
    c.appendChild(linha(opcao('shs', 'Calçado'), opcao('prop', 'Na mão')));
    var ex = EA.el('div', 'in-cks');
    [['glasses', 'Óculos'], ['shades', 'Óculos escuros'], ['headset', 'Fone'], ['tie', 'Gravata'], ['hat', 'Boné'], ['beard', 'Barba'], ['mustache', 'Bigode'], ['badge', 'Crachá'], ['earring', 'Brinco']].forEach(function (q) { ex.appendChild(ck(q[1], pr.ch[q[0]], function (v) { pr.ch[q[0]] = v; refaz(o); EA.mudou() })) });
    c.appendChild(ex);
  }

  /* ---------- recursos de IA (09/11): cada um num menu que abre e fecha, para não poluir ---------- */
  var iaAberto = {};
  function iaDet(chave, titulo) {
    var d = EA.el('details', 'in-det ia-det', '<summary>' + titulo + '</summary>');
    d.open = !!iaAberto[chave]; d.ontoggle = function () { iaAberto[chave] = d.open };
    return d;
  }
  function iaBarra() { var b = EA.el('div', 'ia-barra', '<i></i>'); b.hidden = true; b.vai = function (f, txt) { b.hidden = false; b.firstChild.style.width = Math.round(f * 100) + '%'; b.title = txt || '' }; return b }
  function selIdioma(v) { return sel(v, EA.IA.IDIOMAS, function () { }) }
  /* 09/11: os ditados do painel ficam anotados; quando o painel é refeito (outra peça, outro slide, outra aba) todos param e o microfone fecha */
  var ditados = [];
  function ditado(aoFinal, aoParcial) { var w = EA.IA.botaoDitado(aoFinal, aoParcial); ditados.push(w); return w }
  function paraDitados() { var l = ditados; ditados = []; l.forEach(function (w) { try { w.para() } catch (e) { } }) }
  /* 09/11: a peça como está agora no material (depois de desfazer ou apagar, a que o painel guardou pode não existir mais) */
  function achaObj(id) { var r = null; EA.projetoAtual.slides.forEach(function (s) { s.objs.forEach(function (x) { if (x.id === id) r = x }) }); return r }
  /* texto: ditar (cada frase vira um parágrafo) e traduzir só esta caixa */
  function iaTexto(o) {
    var pr = o.props, ehTexto = o.tipo === 'texto', d = iaDet('texto', ehTexto ? '🎤 Ditar e traduzir' : '🌎 Traduzir esta peça');
    var ouvindo = EA.el('p', 'in-nota ia-ouve');
    if (ehTexto) d.appendChild(ditado(function (t) {
      if (!t) return; pr.html = (pr.html && pr.html.replace(/<br>|<div><\/div>/g, '').trim() ? pr.html : '') + '<div>' + EA.esc(t) + '</div>'; refaz(o); EA.mudou();
    }, function (p) { ouvindo.textContent = p ? '… ' + p : '' }));
    if (ehTexto) d.appendChild(ouvindo);
    var rot = ehTexto ? '🌎 Traduzir este texto' : '🌎 Traduzir os textos desta peça', de = selIdioma('pt'), para = selIdioma('es'), bt = EA.el('button', 'in-botao', rot), barra = iaBarra();
    bt.type = 'button';
    d.appendChild(linha(campo('De', de), campo('Para', para))); d.appendChild(bt); d.appendChild(barra);
    bt.onclick = function () {
      if (de.value === para.value) { EA.aviso('Escolha dois idiomas diferentes.'); return }
      var vai = function () {
        bt.disabled = true; bt.textContent = 'Traduzindo…';
        /* 09/11: traduz numa cópia e só troca no fim, de uma vez, na peça que existir naquela hora: erro no meio não deixa metade traduzida,
           peça apagada não é escrita, e o resultado ganha ponto de desfazer e é salvo */
        var proj = EA.projetoAtual, antes = EA.clona(pr), copia = EA.clona(pr);
        EA.IA.tradutor(de.value, para.value, function (f) { barra.vai(f) }).then(function (tr) { return EA.IA.traduzEm(tr, [{ o: copia, slide: false }]) }).then(function () {
          if (EA.projetoAtual !== proj) { EA.aviso('A tradução foi descartada: outro material foi aberto enquanto ela rodava.'); return }
          if (EA.fimEdicao) EA.fimEdicao();
          var alvo = achaObj(o.id);
          if (!alvo) { EA.aviso('A tradução foi descartada: a peça não existe mais.'); return }
          Object.keys(copia).forEach(function (k) { if (JSON.stringify(copia[k]) !== JSON.stringify(antes[k])) alvo.props[k] = copia[k] });
          refaz(alvo); EA.mudou(); EA.Inspetor.mostra(); EA.aviso('Traduzido. Ctrl+Z desfaz.');
        }).catch(function (e) { EA.aviso(EA.IA.erro(e)) }).then(function () { bt.disabled = false; bt.textContent = rot; barra.hidden = true });
      };
      EA.IA.primeiraVez('trad_' + de.value + para.value, 'Tradutor', 'Na primeira vez, o navegador baixa o pacote do idioma (alguns MB) e guarda ele.', vai);
    };
    return d;
  }
  /* imagem: tirar o fundo, com volta para a original */
  /* 09/11: quais imagens estão sendo recortadas agora (o painel refeito não oferece o botão de novo no meio do trabalho) */
  var fundoTrab = {};
  function iaFundo(o) {
    var pr = o.props, d = iaDet('fundo', '✂️ Tirar o fundo'), bt = EA.el('button', 'in-botao', 'Tirar o fundo desta imagem'), barra = iaBarra();
    bt.type = 'button';
    if (fundoTrab[o.id]) { bt.disabled = true; bt.textContent = 'Recortando…' }
    d.appendChild(bt); d.appendChild(barra);
    d.appendChild(EA.el('p', 'in-nota', 'Se a rede bloquear o download no Chrome, use o Edge.'));
    if (pr.fundoOriginal) { var volta = EA.el('button', 'in-botao', 'Voltar à imagem com fundo'); volta.type = 'button'; volta.onclick = function () { pr.midia = pr.fundoOriginal.midia; if (pr.fundoOriginal.src) pr.src = pr.fundoOriginal.src; delete pr.fundoOriginal; refaz(o); EA.mudou(); EA.Inspetor.mostra() }; d.appendChild(volta) }
    bt.onclick = function () {
      if (fundoTrab[o.id]) return;
      var src = pr.midia ? EA.urlMidia(EA.projetoAtual, pr.midia) : EA.url(pr.src || '');
      if (!src) { EA.aviso('Esta imagem ainda não tem foto.'); return }
      EA.IA.primeiraVez('fundo', 'Tirar o fundo', 'Na primeira vez, o navegador baixa o recortador de fundo (cerca de 44 a 88 MB) e guarda ele.', function () {
        if (fundoTrab[o.id]) return;
        bt.disabled = true; bt.textContent = 'Preparando…'; barra.vai(0);
        /* 09/11: o recorte só entra se o material e a imagem ainda são os mesmos de quando começou; e a foto original guardada nunca é trocada por um recorte */
        var proj = EA.projetoAtual, mAntes = pr.midia || null, sAntes = pr.src || null;
        fundoTrab[o.id] = true;
        EA.IA.tiraFundo(src, function (f) { barra.vai(f); bt.textContent = 'Baixando ' + Math.round(f * 100) + '%…'; if (f >= 1) bt.textContent = 'Recortando…' }).then(function (r) {
          var alvo = EA.projetoAtual === proj ? achaObj(o.id) : null, ap = alvo && alvo.props;
          if (!ap) { EA.aviso('O recorte foi descartado: a imagem não existe mais.'); return }
          if ((ap.midia || null) !== mAntes || (ap.src || null) !== sAntes) { EA.aviso('O recorte foi descartado: a imagem foi trocada enquanto ele rodava.'); return }
          var id = EA.uid(), nome = ((proj.midia[ap.midia] || {}).nome || 'imagem').replace(/\.\w+$/, '') + ' sem fundo.png';
          proj.midia[id] = { tipo: 'imagem', nome: nome, dados: r.dados, w: r.w, h: r.h };
          if (!ap.fundoOriginal) ap.fundoOriginal = { midia: ap.midia || null, src: ap.src || null };
          ap.midia = id; delete ap.src;
          refaz(alvo); EA.mudou(); EA.aviso('Fundo tirado.');
        }).catch(function (e) { EA.aviso(EA.IA.erro(e)) }).then(function () { delete fundoTrab[o.id]; bt.disabled = false; bt.textContent = 'Tirar o fundo desta imagem'; barra.hidden = true; EA.Inspetor.mostra() });
      });
    };
    return d;
  }
  /* vídeo: legenda automática. O trabalho continua mesmo se o painel for redesenhado (fica guardado aqui) */
  var legTrab = null;
  function iaLegenda(o) {
    var pr = o.props, d = iaDet('legenda', '💬 Legenda'), barra = iaBarra(), st = EA.el('p', 'in-nota ia-st'), lg = sel(pr.legenda ? ({ pt: 'portuguese', es: 'spanish', en: 'english' })[pr.legenda.idioma] || 'portuguese' : 'portuguese', EA.IA.LINGUAS_LEGENDA.map(function (q) { return [q[0], q[1]] }), function () { });
    var bt = EA.el('button', 'in-botao', pr.legenda ? 'Gerar de novo' : 'Gerar legenda'), canc = EA.el('button', 'in-botao', 'Cancelar');
    bt.type = canc.type = 'button'; canc.hidden = true;
    d.appendChild(campo('Idioma falado no vídeo', lg)); d.appendChild(bt); d.appendChild(barra); d.appendChild(st); d.appendChild(canc);
    d.appendChild(EA.el('p', 'in-nota', 'Funciona no Edge. No Chrome da empresa o download pode ser bloqueado.'));
    function mostra() {
      var t = legTrab && legTrab.id === o.id ? legTrab : null;
      bt.disabled = !!(legTrab && !legTrab.fim); canc.hidden = !t || t.fim;
      if (t && !t.fim) { barra.vai(t.f || 0); st.textContent = t.texto || '' } else { barra.hidden = true; st.textContent = legTrab && !legTrab.fim && legTrab.id !== o.id ? 'Outro vídeo está sendo legendado.' : '' }
    }
    d.atualiza = mostra; d.dataset.leg = o.id; d.classList.add('ia-leg');
    mostra();
    bt.onclick = function () {
      var src = EA.urlMidia(EA.projetoAtual, pr.midia); if (!src) return;
      EA.IA.primeiraVez('legenda', 'Legenda automática', 'Na primeira vez, o navegador baixa o legendador (cerca de 76 MB) e guarda ele. Enquanto legenda, você pode continuar mexendo no Estúdio.', function () {
        var q = EA.IA.LINGUAS_LEGENDA.filter(function (x) { return x[0] === lg.value })[0];
        legTrab = { id: o.id, f: 0, texto: 'Começando…', fim: false, t0: performance.now() };
        var job = EA.IA.legenda(src, q[0], function (pg) { legTrab.f = pg.f; legTrab.texto = pg.texto; [].forEach.call(document.querySelectorAll('.ia-leg'), function (x) { x.atualiza && x.atualiza() }) });
        legTrab.cancela = job.cancela; mostra();
        job.promessa.then(function (r) {
          var obj = null; EA.projetoAtual.slides.forEach(function (s) { s.objs.forEach(function (x) { if (x.id === o.id) obj = x }) });
          if (!obj) return;
          obj.props.legenda = { idioma: q[2], cues: r.cues, mostrar: true };
          EA.refazConteudo ? EA.refazConteudo(obj) : 0; EA.redesenha(); EA.mudou();
          EA.aviso(r.cues.length ? 'Legenda pronta: ' + r.cues.length + ' frases em ' + Math.round((performance.now() - legTrab.t0) / 1000) + ' s.' : 'Não ouvi fala neste vídeo.');
        }, function (e) { if (!/cancelado/.test(e.message)) EA.aviso(EA.IA.erro(e)) }).then(function () { legTrab.fim = true; EA.Inspetor.mostra() });
      });
    };
    canc.onclick = function () { if (legTrab && legTrab.cancela) { legTrab.cancela(); legTrab.fim = true; EA.aviso('Legenda cancelada.'); EA.Inspetor.mostra() } };
    if (pr.legenda && pr.legenda.cues) {
      d.appendChild(ck('Mostrar a legenda', pr.legenda.mostrar !== false, function (v) { pr.legenda.mostrar = v; refaz(o); EA.redesenha(); EA.mudou() }));
      var lista = EA.el('div', 'ia-cues');
      pr.legenda.cues.forEach(function (cq) {
        var l = EA.el('label', 'ia-cue', '<small>' + Math.floor(cq.i / 60) + ':' + ('0' + Math.floor(cq.i % 60)).slice(-2) + '</small>'), t = EA.el('input'); t.value = cq.t;
        t.oninput = function () { cq.t = t.value }; t.onchange = function () { refaz(o); EA.redesenha(); EA.mudou() };
        l.appendChild(t); lista.appendChild(l);
      });
      d.appendChild(lista);
      var apaga = EA.el('button', 'in-botao', 'Apagar a legenda'); apaga.type = 'button';
      apaga.onclick = function () { delete pr.legenda; refaz(o); EA.redesenha(); EA.mudou(); EA.Inspetor.mostra() };
      d.appendChild(apaga);
    }
    return d;
  }
  /* câmera ao vivo: fundo, forma, espelho, e ver aqui no editor */
  function iaCamera(c, o) {
    var pr = o.props, m = EA.projetoAtual.midia, ims = Object.keys(m).filter(function (k) { return m[k].tipo === 'imagem' && !m[k].folha });
    c.appendChild(campo('Fundo', sel(pr.modo || 'desfoca', [['desfoca', 'Desfocado'], ['imagem', 'Uma imagem'], ['recorte', 'Sem fundo (só a pessoa)'], ['normal', 'Normal']], function (v) { pr.modo = v; EA.redesenha(); EA.mudou(); EA.Inspetor.mostra() })));
    if (pr.modo === 'imagem') c.appendChild(campo('Imagem do fundo', sel(pr.fundoMidia || '', [['', ims.length ? 'Escolher…' : 'Primeiro coloque uma imagem em Mídia']].concat(ims.map(function (k) { return [k, m[k].nome] })), function (v) { pr.fundoMidia = v; EA.redesenha(); EA.mudou() })));
    c.appendChild(campo('Forma', sel(pr.forma === 'ret' ? 'ret' : 'redonda', [['redonda', 'Redonda'], ['ret', 'Retângulo']], function (v) { pr.forma = v; EA.redesenha(); EA.mudou() })));
    c.appendChild(ck('Espelhar (como no espelho)', pr.espelho !== false, function (v) { pr.espelho = v; EA.redesenha(); EA.mudou() }));
    c.appendChild(ck('Ver a câmera aqui no editor', !!pr.verAqui, function (v) { pr.verAqui = v; EA.redesenha(); EA.mudou() }));
    c.appendChild(EA.el('p', 'in-nota', 'Ela precisa estar em cada slide onde você quer aparecer (copie e cole nos outros slides); em cada um dá para mudar de lugar e de tamanho. Liga sozinha na apresentação. Só funciona dentro do Estúdio: no HTML baixado a câmera não aparece.'));
  }
  /* transcrever: sobe ou cola um print; o texto aparece embaixo para copiar */
  /* 09/11: guarda também a caixa de texto e a barra do painel que está na tela: o resultado vai para elas, mesmo se o painel foi refeito no meio da leitura */
  var transc = { src: '', txt: '', blob: '', vez: 0, lendo: false, f: 0, saida: null, barra: null };
  function iaTranscreve() {
    var d = iaDet('transc', '🔎 Transcrever uma imagem'), o = EA.objAtual();
    var inp = EA.el('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.hidden = true;
    var sobe = EA.el('button', 'in-botao', ic('upload') + 'Subir imagem'), cola = EA.el('textarea', 'ia-cola'), prev = EA.el('img', 'ia-prev'), barra = iaBarra(), saida = EA.el('textarea', 'ia-saida'), copia = EA.el('button', 'in-botao', 'Copiar o texto');
    sobe.type = 'button'; copia.type = 'button'; cola.rows = 1; cola.placeholder = 'ou clique aqui e cole o print (Ctrl+V)'; saida.rows = 6; saida.placeholder = 'O texto da imagem aparece aqui.';
    prev.alt = ''; prev.hidden = !transc.src; if (transc.src) prev.src = transc.src; saida.value = transc.lendo ? 'Lendo…' : transc.txt;
    transc.saida = saida; transc.barra = barra; if (transc.lendo) barra.vai(transc.f);
    d.appendChild(inp); d.appendChild(sobe); d.appendChild(cola);
    if (o && o.tipo === 'imagem' && (o.props.midia || o.props.src)) { var usa = EA.el('button', 'in-botao', 'Usar a imagem selecionada'); usa.type = 'button'; usa.onclick = function () { le(o.props.midia ? EA.urlMidia(EA.projetoAtual, o.props.midia) : EA.url(o.props.src)) }; d.appendChild(usa) }
    d.appendChild(prev); d.appendChild(barra); d.appendChild(saida); d.appendChild(copia);
    function le(src, ehBlob) {
      /* 09/11: a imagem anterior subida ou colada é liberada da memória quando chega outra */
      if (transc.blob && transc.blob !== src) { try { URL.revokeObjectURL(transc.blob) } catch (e) { } }
      transc.blob = ehBlob ? src : '';
      transc.src = src; prev.src = src; prev.hidden = false;
      EA.IA.primeiraVez('transc', 'Transcrever uma imagem', 'Na primeira vez, o navegador baixa o leitor de texto em português (cerca de 7 MB) e guarda ele.', function () {
        var vez = ++transc.vez;
        transc.lendo = true; transc.f = 0; transc.saida.value = 'Lendo…'; transc.barra.vai(0);
        EA.IA.transcreve(src, function (f) { if (vez === transc.vez) { transc.f = f; transc.barra.vai(f) } }).then(function (t) { if (vez !== transc.vez) return; transc.txt = t; transc.saida.value = t || '(não achei texto nesta imagem)' }, function (e) { if (vez !== transc.vez) return; transc.saida.value = ''; EA.aviso(EA.IA.erro(e)) }).then(function () { if (vez !== transc.vez) return; transc.lendo = false; transc.barra.hidden = true });
      });
    }
    sobe.onclick = function () { inp.click() };
    inp.onchange = function () { if (inp.files[0]) le(URL.createObjectURL(inp.files[0]), true); inp.value = '' };
    cola.addEventListener('paste', function (ev) {
      var it = [].filter.call(ev.clipboardData.items || [], function (i) { return i.type.indexOf('image/') === 0 })[0];
      ev.preventDefault(); ev.stopPropagation(); cola.value = '';
      if (it) le(URL.createObjectURL(it.getAsFile()), true); else EA.aviso('Copie uma imagem (print) antes de colar.');
    });
    saida.oninput = function () { if (!transc.lendo) transc.txt = saida.value };
    copia.onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(saida.value) : Promise.reject()).then(function () { EA.aviso('Texto copiado.') }, function () { saida.select(); document.execCommand('copy') }) };
    return d;
  }
  /* material inteiro: traduz no lugar, de uma vez; Ctrl+Z desfaz tudo */
  function iaMaterial(p) {
    var d = iaDet('mat', '🌎 Traduzir o material inteiro'), de = selIdioma('pt'), para = selIdioma('es'), bt = EA.el('button', 'in-botao prim', 'Traduzir tudo'), barra = iaBarra();
    bt.type = 'button';
    d.appendChild(linha(campo('De', de), campo('Para', para))); d.appendChild(bt); d.appendChild(barra);
    d.appendChild(EA.el('p', 'in-nota', 'Traduz textos, elementos, quiz, notas e nomes dos slides de todos os slides. Ctrl+Z desfaz.'));
    bt.onclick = function () {
      if (de.value === para.value) { EA.aviso('Escolha dois idiomas diferentes.'); return }
      var vai = function () {
        bt.disabled = true; bt.textContent = 'Preparando o idioma…';
        /* traduz numa cópia e troca de uma vez no fim: se der erro no meio, nada fica pela metade */
        /* 09/11: guarda quais slides eram e como estavam; no fim só troca os que ninguém mexeu durante a espera */
        var orig = p.slides.slice(), antes = orig.map(function (s) { return JSON.stringify(s) }), copia = EA.clona(orig);
        EA.IA.tradutor(de.value, para.value, function (f) { barra.vai(f) }).then(function (tr) {
          return EA.IA.traduzEm(tr, copia.map(function (s) { return { o: s, slide: true } }), function (n, t) { barra.vai(n / t); bt.textContent = 'Traduzindo ' + n + ' de ' + t + '…' });
        }).then(function (n) {
          if (EA.projetoAtual !== p) { EA.aviso('A tradução foi descartada: outro material foi aberto enquanto ela rodava.'); return }
          if (EA.fimEdicao) EA.fimEdicao();
          var pulados = 0;
          orig.forEach(function (s, i) {
            if (p.slides.indexOf(s) < 0 || JSON.stringify(s) !== antes[i]) { pulados++; return }
            Object.keys(copia[i]).forEach(function (k) { s[k] = copia[i][k] });
          });
          EA.mudou(); EA.tudo();
          if (pulados === orig.length) EA.aviso('Nada foi trocado: o material mudou enquanto a tradução rodava. Traduza de novo sem mexer nele.');
          else EA.aviso('Material traduzido para ' + EA.IA.nomeIdioma(para.value).toLowerCase() + '. Ctrl+Z desfaz.' + (pulados ? ' ' + pulados + (pulados > 1 ? ' slides em que você mexeu durante a tradução ficaram' : ' slide em que você mexeu durante a tradução ficou') + ' como estava.' : ''));
        }).catch(function (e) { EA.aviso(EA.IA.erro(e)) }).then(function () { bt.disabled = false; bt.textContent = 'Traduzir tudo'; barra.hidden = true });
      };
      EA.IA.primeiraVez('trad_' + de.value + para.value, 'Tradutor', 'Na primeira vez, o navegador baixa o pacote do idioma (alguns MB) e guarda ele.', vai);
    };
    return d;
  }

  /* ---------- aba Animação ---------- */
  /* 13/11: uma cor por número de clique (mesmo número = mesma cor), nos números do palco, nos botões e nas barras */
  var CORES_PASSO = ['#0064e0', '#087e58', '#c2410c', '#7c3aed', '#be185d', '#0e7490', '#9a5b00', '#4d7c0f'];
  EA.corPasso = function (v) { return v >= 1 ? CORES_PASSO[(Math.round(v) - 1) % CORES_PASSO.length] : '#9aa9b3' };
  /* 13/11 (2ª versão): em que clique entra, num campo de número inteiro como o da Duração.
     0 = já aparece quando o slide começa; 1, 2, 3… = o clique; mesmo número = entram juntos */
  function campoPasso(os) {
    var s = EA.slideAtual(), r = EA.numerosEntrada(s), vs = os.map(function (o) { return r.n[o.id] || 0 }), um = vs.every(function (v) { return v === vs[0] }) ? vs[0] : null;
    var max = Math.floor(r.max) + 1, i = EA.el('input', 'in-passo-n');
    i.type = 'number'; i.min = 0; i.max = max; i.step = 1;
    if (um == null) i.placeholder = 'vários'; else i.value = Math.round(um);
    i.title = 'Em que clique entra. 0 = já aparece quando o slide começa. Mesmo número = entram juntos';
    if (um != null && um >= 1) i.style.boxShadow = 'inset 4px 0 0 ' + EA.corPasso(um);
    i.onchange = function () {
      var n = Math.round(parseFloat(i.value));
      if (isNaN(n)) return;
      n = Math.max(0, Math.min(max, n));
      poePasso(os, n);
      var novo = document.querySelector('.in-passo-n'); if (novo) novo.focus();
    };
    var d = EA.el('div');
    d.appendChild(campo('Entra no clique', i));
    d.appendChild(EA.el('p', 'in-nota', '0 = já aparece quando o slide abre. Mesmo número = entram juntos.'));
    return d;
  }
  function poePasso(os, v) {
    EA.fixaNumeros(EA.slideAtual());
    os.forEach(function (o) { o.entrada = o.entrada || { tipo: 'nenhuma', dur: .5, atraso: 0, quando: 'auto', som: '' }; o.entrada.passo = v; o.entrada.quando = v ? 'clique' : 'auto' });
    fechaBuracos(EA.slideAtual());
    EA.mudou(); EA.Inspetor.mostra();
  }
  /* 13/11: "Anda no clique": a partir de que clique da fila o clique (em qualquer lugar) mostra os passos dele.
     Independe do "Entra no clique". Vazio = só anda clicando em cima dele */
  function campoAnda(o) {
    var s = EA.slideAtual(), r = EA.numerosEntrada(s), an = EA.andaNo(o, r.n[o.id]), max = Math.floor(r.max) + 1, i = EA.el('input', 'in-anda-n');
    i.type = 'number'; i.min = 0; i.max = max; i.step = 1; i.placeholder = 'só clicando nele';
    if (an != null) { i.value = Math.round(an); if (an >= 1) i.style.boxShadow = 'inset 4px 0 0 ' + EA.corPasso(an) }
    i.title = 'Em que clique ele começa a andar, com clique em qualquer lugar. Apague o número para ele só andar clicando em cima';
    i.onchange = function () {
      EA.fixaNumeros(s);
      var n = Math.round(parseFloat(i.value));
      o.props.andaNo = isNaN(n) ? false : Math.max(0, Math.min(max, n));
      fechaBuracos(s); EA.mudou(); EA.Inspetor.mostra();
      var nv = document.querySelector('.in-anda-n'); if (nv) nv.focus();
    };
    var d = EA.el('div');
    d.appendChild(campo('Anda no clique', i));
    d.appendChild(EA.el('p', 'in-nota', 'A partir deste clique, clicar em qualquer lugar mostra os passos dele, um por clique; depois do último, a fila segue. Vazio = só anda clicando nele.'));
    return d;
  }
  /* sem buracos: se ninguém mais entra no 2, o 3 vira 2 (entradas, saídas e trocas andam juntas; a ordem não muda) */
  function fechaBuracos(s) {
    var vs = [];
    function junta(v) { if (v >= 1 && isFinite(v) && vs.indexOf(v) < 0) vs.push(v) }
    s.objs.forEach(function (o) { junta((o.entrada || {}).passo); if (o.saida) junta(o.saida.passo); if (o.troca && o.troca.por) junta(o.troca.depois); if (o.props && typeof o.props.andaNo === 'number') junta(o.props.andaNo) });
    vs.sort(function (a, b) { return a - b });
    function novo(v) { var k = vs.indexOf(v); return k < 0 ? v : k + 1 }
    s.objs.forEach(function (o) {
      if (o.entrada && o.entrada.passo != null) o.entrada.passo = novo(o.entrada.passo);
      if (o.saida && o.saida.passo != null) o.saida.passo = novo(o.saida.passo);
      if (o.troca && o.troca.por && o.troca.depois != null) o.troca.depois = novo(o.troca.depois);
      if (o.props && typeof o.props.andaNo === 'number') o.props.andaNo = novo(o.props.andaNo);
    });
  }
  function animacao(c) {
    var o = EA.objAtual();
    if (!o) {
      var vs = EA.objsSel();
      /* 13/11: várias peças escolhidas: o número do clique vale para todas (entram juntas) */
      if (vs.length > 1) { c.appendChild(grupo(vs.length + ' objetos')); c.appendChild(campoPasso(vs)); return }
      c.appendChild(EA.el('p', 'in-vazio', 'Selecione um objeto para animar.')); return;
    }
    if (instante()) marcaNoInstante(c, o);
    else {
    var en = o.entrada = o.entrada || { tipo: 'nenhuma', dur: .5, atraso: 0, quando: 'auto', som: '' };
    c.appendChild(grupo('Como ele entra'));
    var g = EA.el('div', 'in-anims');
    Object.keys(EA.ENTRADAS).forEach(function (k) {
      var b = EA.el('button', en.tipo === k ? 'on' : '', EA.ENTRADAS[k].nome);
      b.onclick = function () { en.tipo = k; EA.mudou(); EA.Inspetor.mostra(); testa(o) };
      g.appendChild(b);
    });
    c.appendChild(g);
    /* 13/11: no lugar da lista "Quando": o número do clique */
    c.appendChild(campoPasso([o]));
    /* 13/11: só nos interativos novos (o Ponto clicável não): em que clique da fila ele anda */
    if (EA.andaNo(o, 0) != null || (o.tipo === 'ui' && (EA.ELEMENTOS[o.props.modelo] || {}).grupo === 'hf')) c.appendChild(campoAnda(o));
    c.appendChild(linha(campo('Duração (s)', num(en.dur, function (v) { en.dur = v }, .05, 10, .05)), campo('Espera (s)', num(en.atraso || 0, function (v) { en.atraso = v }, 0, 30, .05))));
    c.appendChild(campo('Som', sel(en.som || '', SONS_OP(), function (v) { en.som = v; EA.mudou(); EA.Som.tocar(v) })));
    var t = EA.el('button', 'in-botao', ic('player-play') + 'Testar entrada'); t.onclick = function () { testa(o) }; c.appendChild(t);

    c.appendChild(grupo('Enquanto está na tela'));
    var lp = o.loop = o.loop || { tipo: 'nenhum', vel: 1 };
    c.appendChild(campo('Movimento', sel(lp.tipo, Object.keys(EA.LOOPS).map(function (k) { return [k, EA.LOOPS[k].nome] }), function (v) { lp.tipo = v; EA.mudou(); var e = $('#palco [data-id="' + o.id + '"] .ob-l'); if (e) { e.getAnimations().forEach(function (a) { a.cancel() }); EA.tocaLoop($('#palco [data-id="' + o.id + '"]'), o); setTimeout(function () { e.getAnimations().forEach(function (a) { a.cancel() }) }, 2400) } })));

    }
    c.appendChild(grupo('Caminho (keyframes)'));
    var kb = EA.el('button', 'in-botao', ic('timeline') + (o.kf && o.kf.length > 1 ? 'Abrir linha do tempo (' + o.kf.length + ' marcas)' : 'Animar com a linha do tempo'));
    kb.onclick = function () { var bt = $('#bTempo'); if (!EA.Ed.timeline) bt.click() };
    c.appendChild(kb);

    c.appendChild(grupo('Troca de objeto'));
    var outros = EA.slideAtual().objs.filter(function (x) { return x.id !== o.id });
    c.appendChild(campo('No clique, vira', sel(o.troca ? o.troca.por : '', [['', 'Não troca']].concat(outros.map(function (x) { return [x.id, EA.nomeObj(x)] })), function (v) { o.troca = v ? Object.assign({ efeito: 'cruzar', som: '' }, o.troca || {}, { por: v }) : null; EA.mudou(); EA.Inspetor.mostra() })));
    if (o.troca) {
      c.appendChild(campo('Efeito', sel(o.troca.efeito === 'poof' ? 'virar' : o.troca.efeito, Object.keys(EA.TROCAS).map(function (k) { return [k, EA.TROCAS[k].nome] }), function (v) { o.troca.efeito = v; EA.mudou() })));
      c.appendChild(campo('Som', sel(o.troca.som || '', SONS_OP(), function (v) { o.troca.som = v; EA.mudou() })));
    }
    c.appendChild(grupo('Ao clicar nele (na apresentação)'));
    var ac = o.acao;
    c.appendChild(campo('Ação', sel(ac ? ac.tipo : '', [['', 'Nada'], ['proximo', 'Próximo slide'], ['slide', 'Ir para um slide'], ['som', 'Tocar som'], ['link', 'Abrir link']], function (v) { o.acao = v ? { tipo: v } : null; EA.mudou(); EA.Inspetor.mostra() })));
    if (ac && ac.tipo === 'slide') c.appendChild(campo('Slide', sel(ac.alvo || '', [['', 'Escolher…']].concat(EA.projetoAtual.slides.map(function (s, k) { return [s.id, (k + 1) + '. ' + (s.nome || 'Slide')] })), function (v) { ac.alvo = v; EA.mudou() })));
    if (ac && ac.tipo === 'som') c.appendChild(campo('Som', sel(ac.som || '', SONS_OP(), function (v) { ac.som = v; EA.mudou() })));
    if (ac && ac.tipo === 'link') c.appendChild(campo('Endereço', txt(ac.url || '', function (v) { ac.url = v }, 'https://…')));
  }
  /* a mesma aba Animação, mas tudo vale só para o instante da agulha */
  function marcaNoInstante(c, o) {
    var m = EA.kfMarca(o, EA.Ed.t) || {};
    c.appendChild(grupo('Em ' + tempoTxt() + ' na linha do tempo'));
    c.appendChild(EA.el('p', 'in-nota', 'Para mudar a entrada do começo, leve a agulha de volta ao zero.'));
    var g = EA.el('div', 'in-anims');
    Object.keys(EA.ENTRADAS).filter(function (k) { return !EA.ENTRADAS[k].especial }).forEach(function (k) {
      var b = EA.el('button', (m.efeito || 'nenhuma') === k ? 'on' : '', k === 'nenhuma' ? 'Sem efeito' : EA.ENTRADAS[k].nome);
      b.onclick = function () {
        naMarca(o, 'efeito', k === 'nenhuma' ? '' : k);
        var def = EA.ENTRADAS[k], e = $('#palco [data-id="' + o.id + '"]');
        if (def.k && e) $('.ob-i', e).animate(def.k, { duration: (m.efeitoDur || .5) * 1000, easing: def.e || 'ease-out' });
      };
      g.appendChild(b);
    });
    c.appendChild(g);
    if (m.efeito) c.appendChild(campo('Duração do efeito (s)', num(m.efeitoDur || .5, function (v) { m.efeitoDur = v }, .05, 10, .05)));
    c.appendChild(campo('Som', sel(m.som || '', SONS_OP(), function (v) { naMarca(o, 'som', v); EA.Som.tocar(v) })));
    c.appendChild(campo('Movimento', sel(m.loop || '', [['', 'Continuar como está']].concat(Object.keys(EA.LOOPS).map(function (k) { return [k, k === 'nenhum' ? 'Parar o movimento' : EA.LOOPS[k].nome] })), function (v) { naMarca(o, 'loop', v) })));
  }
  function testa(o, atraso) {
    var e = $('#palco [data-id="' + o.id + '"]'); if (!e) return;
    atraso = atraso || 0;
    var i = $('.ob-i', e); i.getAnimations().forEach(function (a) { a.cancel() });
    if ((o.entrada || {}).tipo === 'digitar') { var nov = EA.criaObjeto(o, { projeto: EA.projetoAtual, estatico: true }); e.replaceWith(nov); e = nov }
    /* 13/11: tocando o clique inteiro, quem não tem animação de entrada fica escondido até a espera dele acabar */
    var def = EA.ENTRADAS[(o.entrada || {}).tipo];
    if (atraso && !(def && (def.k || def.especial))) $('.ob-i', e).animate([{ opacity: 0 }, { opacity: 0 }], { duration: atraso * 1000 });
    EA.tocaEntrada(e, o, { atraso: atraso });
    setTimeout(function () { $('.ob-i', e).getAnimations().forEach(function (a) { a.cancel() }) }, (atraso + (o.entrada.dur || .5)) * 1000 + 300);
  }

  /* ---------- aba Slide ---------- */
  function slideAba(c) {
    var s = EA.slideAtual(), p = EA.projetoAtual;
    c.appendChild(grupo('Este slide'));
    c.appendChild(campo('Nome no índice', txt(s.nome, function (v) { s.nome = v })));
    if (!s.quiz) c.appendChild(campo('Formato', sel(s.orient === 'v' ? 'v' : 'h', [['h', 'Horizontal'], ['v', 'Vertical']], function (v) { EA.Ed.orientar(v) })));
    var f = s.fundo = s.fundo || { tipo: 'tema' };
    c.appendChild(campo('Fundo', sel(f.tipo, [['tema', 'Do tema'], ['cor', 'Uma cor'], ['gradiente', 'Degradê'], ['imagem', 'Imagem']], function (v) { f.tipo = v; EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() })));
    function corFundo(k, def) { var i = EA.el('input'); i.type = 'color'; i.value = f[k] && /^#/.test(f[k]) ? f[k] : def; i.oninput = function () { f[k] = i.value; EA.redesenha() }; i.onchange = function () { EA.mudou() }; return i }
    if (f.tipo === 'cor') c.appendChild(campo('Cor', corFundo('cor', '#f4f7fa')));
    if (f.tipo === 'gradiente') { c.appendChild(linha(campo('De', corFundo('cor', '#f7fbff')), campo('Até', corFundo('cor2', '#dcebff')))); c.appendChild(campo('Ângulo', num(f.ang == null ? 135 : f.ang, function (v) { f.ang = v; EA.redesenha() }, 0, 360))) }
    if (f.tipo === 'imagem') {
      var m = p.midia, ims = Object.keys(m).filter(function (k) { return m[k].tipo === 'imagem' && !m[k].folha });
      c.appendChild(campo('Imagem', sel(f.midia || '', [['', ims.length ? 'Escolher…' : 'Primeiro coloque uma imagem em Mídia']].concat(ims.map(function (k) { return [k, m[k].nome] })), function (v) { f.midia = v; EA.mudou(); EA.redesenha() })));
    }
    /* overlay: película por cima do slide inteiro, sem pegar cliques (08/11) */
    c.appendChild(grupo('Overlay (por cima de tudo)'));
    var ov = s.overlay, gr = EA.el('div', 'in-ovs');
    [['', 'Nenhum']].concat(Object.keys(EA.OVERLAYS).map(function (k) { return [k, EA.OVERLAYS[k].nome] })).forEach(function (q) {
      var b = EA.el('button', 'in-ov' + ((ov ? ov.tipo : '') === q[0] ? ' on' : '')), am = EA.el('i', 'in-ov-am');
      b.type = 'button'; b.title = q[1]; b.appendChild(am); b.appendChild(EA.el('span', '', EA.esc(q[1])));
      /* amostra: um slide de mentira em tamanho real, encolhido (as linhas e pontos ficam na proporção certa) */
      var pal = EA.el('div', 'in-ov-pal', '<b></b><em></em><em></em><u></u>'); am.appendChild(pal);
      if (q[0]) EA.pintaOverlay(pal, { overlay: { tipo: q[0], forca: Math.min(1, EA.OVERLAYS[q[0]].forca * 1.3) } });
      b.onclick = function () { if (q[0]) s.overlay = { tipo: q[0], forca: EA.OVERLAYS[q[0]].forca }; else delete s.overlay; EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() };
      gr.appendChild(b);
    });
    /* as amostras ficam num menu que abre e fecha (como "Já estão neste material"); lembra se estava aberto */
    var det = EA.el('details', 'in-det', '<summary>' + (ov && EA.OVERLAYS[ov.tipo] ? 'Overlay: ' + EA.esc(EA.OVERLAYS[ov.tipo].nome) : 'Escolher um overlay') + '</summary>');
    det.appendChild(gr); det.open = !!EA.Inspetor.ovAberto;
    var mede = function () { [].forEach.call(gr.querySelectorAll('.in-ov-am'), function (a) { if (a.clientWidth) a.firstChild.style.setProperty('--k', a.clientWidth / 1280) }) };
    det.ontoggle = function () { EA.Inspetor.ovAberto = det.open; if (det.open) requestAnimationFrame(mede) };
    c.appendChild(det);
    if (det.open) requestAnimationFrame(mede);
    if (ov && EA.OVERLAYS[ov.tipo]) {
      c.appendChild(faixa('Força', Math.round((ov.forca == null ? EA.OVERLAYS[ov.tipo].forca : ov.forca) * 100), function (v) { ov.forca = v / 100; EA.redesenha() }, 5, 100, '%'));
      var todos = EA.el('button', 'in-botao', 'Usar em todos os slides');
      todos.onclick = function () { p.slides.forEach(function (q) { q.overlay = { tipo: ov.tipo, forca: ov.forca } }); EA.mudou(true); EA.tudo(); EA.Inspetor.mostra() };
      c.appendChild(todos);
    }
    if (p.slides.filter(function (q) { return q.overlay }).length > 1) {
      var tira = EA.el('button', 'in-botao', 'Tirar de todos os slides');
      tira.onclick = function () { p.slides.forEach(function (q) { delete q.overlay }); EA.mudou(true); EA.tudo(); EA.Inspetor.mostra() };
      c.appendChild(tira);
    }
    var tr = s.trans = s.trans || { tipo: 'cruzar', dur: .5 };
    c.appendChild(grupo('Como este slide chega'));
    c.appendChild(campo('Transição', sel(tr.tipo, Object.keys(EA.TRANSICOES).map(function (k) { return [k, EA.TRANSICOES[k].nome] }), function (v) { tr.tipo = v; EA.mudou() })));
    c.appendChild(campo('Duração (s)', num(tr.dur, function (v) { tr.dur = v }, 0, 5, .1)));
    if (tr.tipo === 'magico') c.appendChild(EA.el('p', 'in-nota', 'Duplique o slide e mude os objetos de lugar: eles andam sozinhos de um slide para o outro.'));
    c.appendChild(campo('Som ao entrar', sel(s.som || '', SONS_OP(), function (v) { s.som = v; EA.mudou(); EA.Som.tocar(v) })));
    var opM = [['', 'Seguir a que já está tocando'], ['parar', 'Parar a música aqui']];
    Object.keys(EA.MUSICAS).forEach(function (k) { opM.push([k, 'Começar: ' + EA.MUSICAS[k].nome]) });
    Object.keys(p.midia).forEach(function (k) { if (p.midia[k].tipo === 'audio') opM.push(['midia:' + k, 'Começar: ' + p.midia[k].nome]) });
    c.appendChild(campo('Música', sel(s.musica || '', opM, function (v) { if (v) s.musica = v; else delete s.musica; EA.mudou(); if (EA.listaSlides) EA.listaSlides() })));
    c.appendChild(grupo('Notas de quem apresenta'));
    var na = area(s.notas, function (v) { s.notas = v }, 'Só você vê (tecla N ao apresentar).', 4); c.appendChild(na);
    if (EA.IA) c.appendChild(ditado(function (t) { s.notas = (s.notas ? s.notas.replace(/\s*$/, ' ') : '') + t; na.value = s.notas; EA.mudou() }));
    c.appendChild(grupo('Todo o material'));
    c.appendChild(campo('Tema', sel(p.tema, Object.keys(EA.TEMAS).map(function (k) { return [k, EA.TEMAS[k].nome] }), function (v) { p.tema = v; EA.mudou(true); EA.tudo() })));
    if (EA.IA) c.appendChild(iaMaterial(p));
  }

  /* ---------- aba Quiz ---------- */
  /* com os pacotes do PC, só os mapas escolhidos. Um slide antigo com outro mapa continua mostrando o dele */
  function listaCenarios(q) {
    if (!window.JOGOS) return Object.keys(EA.CENARIOS).map(function (k) { return [k, EA.CENARIOS[k]] });
    var l = Object.keys(JOGOS.cenarios).filter(function (k) { return !JOGOS.cenarios[k].oculto }).map(function (k) { return ['img:' + k, JOGOS.cenarios[k].nome] });
    if (q.cenImg && JOGOS.cenarios[q.cenId] && JOGOS.cenarios[q.cenId].oculto) l.unshift(['img:' + q.cenId, JOGOS.cenarios[q.cenId].nome + ' (o atual)']);
    if (!q.cenImg) l.unshift([q.cenario || 'floresta', (EA.CENARIOS[q.cenario] || 'Floresta') + ' (o atual)']);
    return l;
  }
  function trocaLut(q, chave, l) { q[chave] = { nome: q[chave] && q[chave].nome && q[chave].nome !== q[chave].lut.nome ? q[chave].nome : l.nome, lut: l }; EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() }
  function quizAba(c) {
    var s = EA.slideAtual(), q = s.quiz;
    var t = EA.el('button', 'in-botao prim', ic('player-play') + 'Jogar este quiz'); t.onclick = function () { EA.apresentar(EA.Ed.si) }; c.appendChild(t);
    c.appendChild(campo('Modelo', sel(q.modelo, [['padrao', 'Pergunta e resposta'], ['rpg', 'Batalha RPG']].concat(window.JOGOS ? [['mon', 'Batalha de monstrinhos'], ['fps', 'Tiro em 1ª pessoa']] : []).concat(window.JOGOS && JOGOS.ia ? [['penalti', 'Pênalti'], ['tatico', 'Missão tática']] : []), function (v) {
      q.modelo = v;
      if (v === 'rpg' && (!q.heroi || (q.heroi.lut && q.heroi.lut.tipo === 'mon'))) { var d = EA.MODELOS.find(function (m) { return m.id === 'rpg' }).f().quiz; q.heroi = d.heroi; q.inimigo = d.inimigo; q.cenario = d.cenario; q.golpe = d.golpe }
      if (v === 'mon' && (!q.fundoImg || !q.heroi || q.heroi.lut.tipo !== 'mon')) { var dm = EA.MODELOS.find(function (m) { return m.id === 'mon' }).f().quiz; q.heroi = dm.heroi; q.inimigo = dm.inimigo; q.fundoImg = dm.fundoImg; q.golpeImg = dm.golpeImg }
      if (v === 'fps' && !q.tema) q.tema = JOGOS.fps.soldado;
      if ((v === 'penalti' || v === 'tatico')) { var dp = EA.MODELOS.find(function (m) { return m.id === v }).f().quiz; q.arte = dp.arte; if (v === 'penalti') q.time = q.time || dp.time; else { q.nomeA = q.nomeA || dp.nomeA; if (q.tempo == null) q.tempo = dp.tempo; if (q.nTerr == null) { q.nTerr = dp.nTerr; q.nBomba = dp.nBomba } } }
      EA.mudou(); EA.redesenha(); EA.Inspetor.mostra();
    })));
    function musicaBatalha() {
      if (q.musica == null) q.musica = EA.Quiz.musicaPadrao(q);
      var opMus = [['', 'Sem música de batalha']].concat(Object.keys(EA.MUSICAS).filter(function (k) { return EA.MUSICAS[k].grupo === 'jogo' }).map(function (k) { return [k, EA.MUSICAS[k].nome] }));
      c.appendChild(campo('Música da batalha', sel(q.musica || '', opMus, function (v) {
        q.musica = v; EA.mudou();
        if (v && EA.Musica.tocando()) EA.Musica.tocar(v); else if (!v) EA.Musica.parar();
        EA.Inspetor.mostra();
      })));
      if (q.musica) {
        var ouve = EA.Musica.tocando() === q.musica, bOuve = EA.el('button', 'in-botao', ic(ouve ? 'player-stop' : 'player-play') + (ouve ? 'Parar música' : 'Ouvir música'));
        bOuve.onclick = function () { if (EA.Musica.tocando()) EA.Musica.parar(); else EA.Musica.tocar(q.musica); EA.Inspetor.mostra() };
        c.appendChild(bOuve);
      }
    }
    if (q.modelo === 'rpg') {
      c.appendChild(grupo('Batalha'));
      c.appendChild(linha(campo('Cenário', sel(q.cenImg ? 'img:' + q.cenId : (q.cenario || 'floresta'), listaCenarios(q), function (v) { if (v.indexOf('img:') === 0) { q.cenId = v.slice(4); q.cenImg = JOGOS.cenarios[q.cenId] } else { q.cenario = v; q.cenImg = null; q.cenId = null } EA.mudou(); EA.redesenha() })), campo('Golpe', sel(q.golpe || 'corte', Object.keys(EA.GOLPES).map(function (k) { return [k, EA.GOLPES[k].nome] }), function (v) { q.golpe = v; EA.mudou() }))));
      musicaBatalha();
      if (q.cenImg && q.cenImg.camadas.length > 1) c.appendChild(ck('Mapa animado (parallax)', !q.cenFixo, function (v) { q.cenFixo = !v; EA.mudou(); EA.redesenha() }));
      c.appendChild(campo('Nome do herói', txt(q.heroi && q.heroi.nome, function (v) { q.heroi.nome = v; EA.redesenha() })));
      /* herói: os que estão em teste. O pacote grande só entra se os pacotes do PC não estiverem aqui */
      var hs = [];
      var m = EA.projetoAtual.midia;
      Object.keys(m).filter(function (k) { return m[k].folha }).forEach(function (k) { hs.push({ v: 'm:' + k, n: '★ ' + m[k].nome.replace(' (folha)', ''), l: EA.lutDoll(m[k].nome.replace(' (folha)', ''), 'midia:' + k) }) });
      function daLista(lista, g) { Object.keys(g).forEach(function (k) { if (!g[k].oculto) lista.push({ v: 'j:' + k, n: (g[k].pacote ? g[k].pacote + ' · ' : '') + g[k].nome, l: g[k] }) }) }
      if (window.JOGOS) daLista(hs, JOGOS.rpg.herois);
      if (!window.JOGOS) Object.keys(LUTADORES).filter(function (k) { return LUTADORES[k].tipo === 'heroi' }).forEach(function (k) { hs.push({ v: 'g:' + k, n: LUTADORES[k].nome, l: LUTADORES[k] }) });
      var atualH = hs.find(function (x) { var a = q.heroi && q.heroi.lut; return a && (x.l.caminho === a.caminho && x.l.src === a.src && x.l.arq === a.arq) });
      if (!atualH && q.heroi && q.heroi.lut) { atualH = { v: 'atual', n: q.heroi.lut.nome + ' (o atual)', l: q.heroi.lut }; hs.unshift(atualH) }
      c.appendChild(campo('Herói', sel(atualH ? atualH.v : '', hs.map(function (x) { return [x.v, x.n] }), function (v) { trocaLut(q, 'heroi', hs.find(function (x) { return x.v === v }).l) })));
      var is = [];
      if (window.JOGOS) daLista(is, JOGOS.rpg.inimigos);
      if (!window.JOGOS) Object.keys(LUTADORES).filter(function (k) { return LUTADORES[k].tipo !== 'heroi' }).forEach(function (k) { is.push({ v: 'g:' + k, n: LUTADORES[k].nome, l: LUTADORES[k] }) });
      is.sort(function (a, b) { return a.n.localeCompare(b.n) });
      var atualI = is.find(function (x) { var a = q.inimigo && q.inimigo.lut; return a && x.l.arq === a.arq && x.l.caminho === a.caminho });
      if (!atualI && q.inimigo && q.inimigo.lut) { atualI = { v: 'atual', n: q.inimigo.lut.nome + ' (o atual)', l: q.inimigo.lut }; is.unshift(atualI) }
      c.appendChild(campo('Inimigo', sel(atualI ? atualI.v : '', is.map(function (x) { return [x.v, x.n] }), function (v) { var l = is.find(function (x) { return x.v === v }).l; q.inimigo = { nome: l.nome, lut: l }; EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() })));
      var cH = q.heroi && q.heroi.lut && (q.heroi.lut.col || 'p'), cI = q.inimigo && q.inimigo.lut && (q.inimigo.lut.col || 'p');
      if (cH !== cI) c.appendChild(EA.el('p', 'in-nota aviso', 'Herói e inimigo são de pacotes diferentes. Pode testar, mas para não virar salada escolha os dois do mesmo pacote.'));
    }
    if (q.modelo === 'mon') {
      var M = JOGOS.mon, mons = Object.keys(M.monstros).map(function (k) { return [k, M.monstros[k].nome] });
      c.appendChild(grupo('Batalha'));
      musicaBatalha();
      c.appendChild(campo('Seu monstrinho', sel(q.heroi.lut.id, mons, function (v) { var o = M.monstros[v]; q.heroi = { nome: o.nome, lut: o }; EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() })));
      c.appendChild(campo('Adversário', sel(q.inimigo.lut.id, mons, function (v) { var o = M.monstros[v]; q.inimigo = { nome: o.nome, lut: o }; EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() })));
      c.appendChild(campo('Lugar', sel(q.fundoImg, M.fundos.map(function (f, k) { return [f, ['Campina', 'Mar', 'Vulcão', 'Selva'][k] || 'Lugar ' + (k + 1)] }), function (v) { q.fundoImg = v; EA.mudou(); EA.redesenha() })));
      var opGolpe = M.golpes.map(function (g) { return [g.caminho, g.nome] });
      c.appendChild(linha(campo('Golpe do aliado', sel(q.golpeImg.caminho, opGolpe, function (v) { q.golpeImg = M.golpes.find(function (g) { return g.caminho === v }); EA.mudou() })), campo('Golpe do adversário', sel((q.golpeIni || q.golpeImg).caminho, opGolpe, function (v) { q.golpeIni = M.golpes.find(function (g) { return g.caminho === v }); EA.mudou() }))));
    }
    if (q.modelo === 'penalti') {
      c.appendChild(grupo('Partida'));
      c.appendChild(campo('Modo', sel(q.modoPen === 'duelo' ? 'duelo' : 'turma', [['turma', 'A turma toda joga junta'], ['duelo', 'Dois times (disputa de pênaltis)']], function (v) { q.modoPen = v === 'duelo' ? 'duelo' : ''; EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() })));
      c.appendChild(campo(q.modoPen === 'duelo' ? 'Time 1' : 'Nome do time', txt(q.time, function (v) { q.time = v; EA.redesenha() })));
      if (q.modoPen === 'duelo') c.appendChild(campo('Time 2', txt(q.time2 || 'Visitante', function (v) { q.time2 = v; EA.redesenha() })));
      c.appendChild(EA.el('p', 'in-nota', 'Cada alternativa é um canto do gol: A e B à esquerda, C e D à direita. Certa é sempre gol; errada vai no goleiro, na trave ou para fora.' + (q.modoPen === 'duelo' ? ' Os times se alternam a cada pergunta, trocando de uniforme entre atacante e goleiro.' : '')));
    }
    if (q.modelo === 'tatico') {
      c.appendChild(grupo('Missão'));
      c.appendChild(campo('Nome da equipe', txt(q.nomeA, function (v) { q.nomeA = v; EA.redesenha() })));
      if (q.nTerr == null) { var mt = Math.min(4, Math.ceil(q.perguntas.length / 2)); q.nTerr = mt; q.nBomba = Math.min(4, q.perguntas.length - mt) }
      /* faltando pergunta para o número escolhido, cria em branco; sobrando, ficam guardadas e fora do jogo */
      var acerta = function () { while (q.perguntas.length < q.nTerr + q.nBomba) q.perguntas.push({ p: 'Escreva a pergunta', ops: ['Certa', 'Errada'], certa: 0, exp: '' }); EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() };
      var opQt = [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']];
      c.appendChild(linha(campo('Com terroristas', sel(String(q.nTerr), opQt, function (v) { q.nTerr = +v; acerta() })), campo('Na bomba (fios)', sel(String(q.nBomba), opQt, function (v) { q.nBomba = +v; acerta() }))));
      c.appendChild(campo('Tempo do desarme (s, 0 = sem tempo)', num(q.tempo == null ? 20 : q.tempo, function (v) { q.tempo = v }, 0, 59)));
      var sobra = q.perguntas.length - q.nTerr - q.nBomba;
      c.appendChild(EA.el('p', 'in-nota', 'As primeiras ' + q.nTerr + ' perguntas são com terroristas; as ' + q.nBomba + ' seguintes cortam um fio cada. Errou, o jogador morre ou a bomba explode e a mesma pergunta volta.' + (sobra > 0 ? ' As ' + sobra + ' últimas da lista ficam fora do jogo.' : '')));
    }
    if (q.modelo === 'fps') {
      EA.Quiz.atualizaCenario(q);   /* slide com um tema que saiu da lista volta para os Soldados */
      c.appendChild(grupo('Missão'));
      musicaBatalha();
      c.appendChild(campo('Tema', sel(q.tema.id, Object.keys(JOGOS.fps).map(function (k) { return [k, JOGOS.fps[k].nome] }), function (v) { q.tema = JOGOS.fps[v]; EA.mudou(); EA.redesenha() })));
      c.appendChild(campo('Cenário', sel(q.cenarioPixelado ? 'pixel' : 'suave', [['suave', 'Suave'], ['pixel', 'Pixelado']], function (v) { q.cenarioPixelado = v === 'pixel'; EA.mudou(); EA.redesenha() })));
      c.appendChild(EA.el('p', 'in-nota', 'Cada inimigo carrega uma resposta. Errou, os outros atiram, o jogador morre e a mesma pergunta volta.'));
    }
    if (q.modelo !== 'padrao' && q.perguntas.some(function (p) { return EA.Quiz.tipo(p) !== 'uma' })) c.appendChild(EA.el('p', 'in-nota aviso', 'Nos jogos só entram perguntas de uma resposta certa. As de marcar várias e de ligar ficam de fora aqui.'));
    if (q.modelo === 'padrao') {   /* 07/11: recursos do quiz sério */
      c.appendChild(grupo('Opções'));
      c.appendChild(campo('Tempo para cada pergunta', sel(String(q.tempoPerg || 0), [['0', 'Sem tempo'], ['10', '10 segundos'], ['15', '15 segundos'], ['20', '20 segundos'], ['30', '30 segundos'], ['45', '45 segundos'], ['60', '1 minuto']], function (v) { q.tempoPerg = +v; EA.mudou() })));
      c.appendChild(ck('No fim: botão "Refazer as erradas"', q.refazErradas, function (v) { q.refazErradas = v; EA.mudou() }));
      c.appendChild(ck('No fim: resumo de todas as respostas', q.resumo, function (v) { q.resumo = v; EA.mudou() }));
    }
    c.appendChild(grupo('Perguntas (' + q.perguntas.length + ')'));
    q.perguntas.forEach(function (p, i) {
      var d = EA.el('details', 'in-perg'); if (i === (quizAberta || 0)) d.open = true;
      d.innerHTML = '<summary>' + (i + 1) + '. ' + EA.esc(p.p.slice(0, 44) || 'Pergunta') + '</summary>';
      d.ontoggle = function () { if (d.open) quizAberta = i };
      d.appendChild(area(p.p, function (v) { p.p = v; EA.redesenha() }, 'Escreva a pergunta', 2));
      var tp = EA.Quiz.tipo(p);
      if (q.modelo === 'padrao') d.appendChild(campo('Formato da resposta', sel(tp, [['uma', 'Uma certa'], ['varias', 'Várias certas (múltipla escolha)'], ['ligar', 'Ligar o correto'], ['completar', 'Completar a frase']], function (v) {
        p.tipo = v === 'uma' ? undefined : v;
        if (v === 'completar') { if (p.resp == null) p.resp = ''; if (!/_{2,}/.test(p.p || '')) p.p = (p.p ? p.p + ' ' : 'O ') + '___' }
        if (v === 'varias') { p.ops = p.ops && p.ops.length >= 2 ? p.ops : ['', '', '']; p.certas = [p.certa < p.ops.length ? p.certa : 0] }
        if (v === 'ligar' && !(p.pares && p.pares.length)) { p.pares = (p.ops || []).filter(Boolean).slice(0, 4).map(function (o) { return { a: o, b: '' } }); while (p.pares.length < 3) p.pares.push({ a: '', b: '' }) }
        if (v === 'uma' && !(p.ops && p.ops.length >= 2)) { p.ops = ['', '']; p.certa = 0 }
        EA.mudou(); EA.redesenha(); EA.Inspetor.mostra();
      })));
      var mais, del = EA.el('button', 'in-mini', ic('trash') + 'Apagar pergunta'); del.disabled = q.perguntas.length <= 1; del.onclick = function () { q.perguntas.splice(i, 1); quizAberta = 0; EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() };
      if (tp === 'completar') {
        d.appendChild(EA.el('p', 'in-nota', 'Na frase, escreva ___ (três traços) no lugar da palavra que falta. A pessoa digita a resposta; maiúsculas e acentos não importam.'));
        d.appendChild(campo('Resposta certa (aceita mais de uma: separe com |)', txt(p.resp || '', function (v) { p.resp = v }, 'ex.: Pixel | o Pixel')));
        mais = EA.el('span');
      } else if (tp === 'ligar') {
        d.appendChild(EA.el('p', 'in-nota', 'Escreva cada par na mesma linha. Na tela a coluna da direita aparece embaralhada.'));
        p.pares.forEach(function (par, k) {
          var l = EA.el('div', 'in-par');
          l.appendChild(txt(par.a, function (v) { par.a = v; EA.redesenha() }, 'Esquerda')); l.appendChild(txt(par.b, function (v) { par.b = v; EA.redesenha() }, 'Direita'));
          var x = EA.el('button', '', ic('x')); x.title = 'Tirar este par'; x.disabled = p.pares.length <= 2; x.onclick = function () { p.pares.splice(k, 1); EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() };
          l.appendChild(x); d.appendChild(l);
        });
        mais = EA.el('button', 'in-mini', ic('plus') + 'Par'); mais.disabled = p.pares.length >= 6; mais.onclick = function () { p.pares.push({ a: '', b: '' }); EA.mudou(); EA.Inspetor.mostra() };
      } else {
        p.ops.forEach(function (o, k) {
          var cts = EA.Quiz.certas(p), marcada = tp === 'varias' ? cts.indexOf(k) >= 0 : p.certa === k;
          var l = EA.el('div', 'in-op' + (marcada ? ' certa' : ''));
          var r = EA.el('input'); r.type = tp === 'varias' ? 'checkbox' : 'radio'; r.name = 'certa' + i; r.checked = marcada; r.title = 'Esta é certa';
          r.onchange = function () {
            if (tp === 'varias') { var c2 = EA.Quiz.certas(p).slice(), ix = c2.indexOf(k); if (ix >= 0) { if (c2.length > 1) c2.splice(ix, 1) } else c2.push(k); p.certas = c2.sort(); p.certa = c2[0] } else p.certa = k;
            EA.mudou(); EA.redesenha(); EA.Inspetor.mostra();
          };
          l.appendChild(r); l.appendChild(txt(o, function (v) { p.ops[k] = v; EA.redesenha() }, 'Resposta ' + 'ABCD'[k]));
          var x = EA.el('button', '', ic('x')); x.title = 'Tirar esta resposta'; x.disabled = p.ops.length <= 2;
          x.onclick = function () { p.ops.splice(k, 1); if (p.certa >= p.ops.length) p.certa = 0; else if (p.certa > k) p.certa--; if (p.certas) { p.certas = p.certas.filter(function (c3) { return c3 !== k }).map(function (c3) { return c3 > k ? c3 - 1 : c3 }); if (!p.certas.length) p.certas = [0] } EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() };
          l.appendChild(x); d.appendChild(l);
        });
        mais = EA.el('button', 'in-mini', ic('plus') + 'Resposta'); mais.disabled = p.ops.length >= 4; mais.onclick = function () { p.ops.push(''); EA.mudou(); EA.Inspetor.mostra() };
      }
      d.appendChild(campo('Explicação (aparece depois de responder)', area(p.exp, function (v) { p.exp = v }, 'Por que esta é a certa', 2)));
      d.appendChild(linha(mais, del));
      c.appendChild(d);
    });
    var ad = EA.el('button', 'in-botao', ic('plus') + 'Nova pergunta'); ad.onclick = function () { q.perguntas.push({ p: '', ops: ['', ''], certa: 0, exp: '' }); quizAberta = q.perguntas.length - 1; EA.mudou(); EA.redesenha(); EA.Inspetor.mostra() }; c.appendChild(ad);
    var col = EA.el('button', 'in-botao', ic('clipboard-text') + 'Colar várias de uma vez'); col.onclick = function () { colar(q) }; c.appendChild(col);
  }
  var quizAberta = 0;
  /* formato: uma pergunta por bloco; a certa tem * */
  function colar(q) {
    var f = EA.el('div', 'ed-modal');
    f.innerHTML = '<div class="ed-modal-c"><button class="ed-x" data-x>' + ic('x') + '</button><h2>Colar perguntas</h2><p>Uma linha em branco separa as perguntas. Marque a resposta certa com * no começo (mais de um * vira múltipla escolha). Para ligar, escreva Esquerda = Direita em cada linha. Uma linha começando com # vira a explicação.</p><textarea id="colaT" rows="12" placeholder="Qual é a capital do Brasil?&#10;*Brasília&#10;São Paulo&#10;Rio de Janeiro&#10;# Brasília é a capital desde 1960.&#10;&#10;Próxima pergunta?&#10;Sim&#10;*Não"></textarea><div class="col-b"><label class="in-ck"><input type="checkbox" id="colaTroca"> Trocar as atuais</label><button class="prim" id="colaOk">Colocar no quiz</button></div></div>';
    document.body.appendChild(f);
    f.querySelector('[data-x]').onclick = function () { f.remove() };
    f.querySelector('#colaOk').onclick = function () {
      var sobrou = 0;
      var novos = f.querySelector('#colaT').value.split(/\n\s*\n/).map(function (b) {
        var l = b.split('\n').map(function (x) { return x.trim() }).filter(Boolean); if (l.length < 3) return null;
        var p = { p: l[0], ops: [], certa: 0, exp: '' };
        var pares = l.slice(1).filter(function (x) { return x[0] !== '#' && / = /.test(x) });
        if (pares.length >= 2) { p.tipo = 'ligar'; p.pares = pares.slice(0, 6).map(function (x) { var w = x.split(' = '); return { a: w[0].trim(), b: w.slice(1).join(' = ').trim() } }); l.forEach(function (x) { if (x[0] === '#') p.exp = x.slice(1).trim() }); return p }
        var cts = [];
        l.slice(1).forEach(function (x) {
          if (x[0] === '#') { p.exp = x.slice(1).trim(); return }
          x = x.replace(/^[A-Da-d][\).:]\s*/, '');
          var marcada = x[0] === '*'; if (marcada) x = x.slice(1).trim();
          if (!x) return;
          var k = p.ops.length;
          if (k >= 4) {
            /* só cabem 4 respostas. Uma certa que veio depois toma o lugar da última errada, para não se perder */
            sobrou++; if (!marcada) return;
            for (k = 3; k >= 0 && cts.indexOf(k) >= 0; k--);
            if (k < 0) return;
            p.ops[k] = x;
          } else p.ops.push(x);
          if (marcada) cts.push(k);
        });
        cts.sort(function (a, b) { return a - b });
        if (cts.length) p.certa = cts[0];
        if (cts.length > 1) { p.tipo = 'varias'; p.certas = cts }
        return p.ops.length >= 2 ? p : null;
      }).filter(Boolean);
      if (!novos.length) { EA.aviso('Não achei perguntas nesse texto: precisa de uma pergunta e pelo menos duas respostas.'); return }
      if (sobrou) setTimeout(function () { EA.aviso('Cada pergunta leva até 4 respostas: ' + sobrou + (sobrou > 1 ? ' respostas a mais ficaram' : ' resposta a mais ficou') + ' de fora.') }, 2600);
      if (f.querySelector('#colaTroca').checked) q.perguntas = novos; else q.perguntas = q.perguntas.concat(novos);
      f.remove(); EA.mudou(); EA.redesenha(); EA.Inspetor.mostra(); EA.aviso(novos.length + ' perguntas no quiz.');
    };
  }

  EA.Inspetor = {
    liga: function () {},
    mostra: function () {
      var i = $('#insp'); if (!i) return;
      paraDitados();
      var s = EA.slideAtual(), temObj = EA.objsSel().length > 0, abas = [];
      if (s.quiz) abas.push(['quiz', 'Quiz']);
      abas.push(['design', 'Design'], ['anim', 'Animação'], ['slide', 'Slide']);
      if (!abas.some(function (a) { return a[0] === aba })) aba = s.quiz ? 'quiz' : 'design';
      if (s.quiz && !temObj && (aba === 'design' || aba === 'anim')) aba = 'quiz';
      if (!s.quiz && !temObj && aba === 'quiz') aba = 'design';
      var r = document.activeElement, focoEm = i.contains(r) ? r.tagName : null, rolagem = ($('.in-corpo', i) || {}).scrollTop || 0;
      /* 07/11: listas com rolagem própria (poses dos desenhados…) ficam onde estavam ao redesenhar */
      var rolInternas = {};
      [].forEach.call(i.querySelectorAll('.in-corpo [class]'), function (e) { if (e.scrollTop > 0) rolInternas[e.className] = e.scrollTop });
      i.innerHTML = '<div class="in-abas">' + abas.map(function (a) { return '<button data-aba="' + a[0] + '" class="' + (aba === a[0] ? 'on' : '') + '">' + a[1] + '</button>' }).join('') + '</div><div class="in-corpo"></div>';
      [].forEach.call(i.querySelectorAll('[data-aba]'), function (b) { b.onclick = function () { aba = b.dataset.aba; EA.Inspetor.mostra() } });
      var c = $('.in-corpo', i);
      ({ design: design, anim: animacao, slide: slideAba, quiz: quizAba })[aba](c);
      c.scrollTop = rolagem;
      Object.keys(rolInternas).forEach(function (k) { var e = c.getElementsByClassName(k)[0]; if (e) e.scrollTop = rolInternas[k] });
      /* 13/11: os números de clique no palco só aparecem na aba Animação */
      if (EA.desenhaSel && document.getElementById('caixaSel')) EA.desenhaSel();
    },
    aba: function () { return aba },
    atualizaGeo: function () { if (aba === 'design') EA.Inspetor.mostra() }
  };
})();
