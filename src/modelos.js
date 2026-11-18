/* Modelos prontos de slide, no desenho do Aulão. Cada modelo devolve um slide comum: depois de inserido, tudo é editável. */
(function () {
  var EA = window.EA;
  function T(html, x, y, w, h, tam, peso, extra) {
    var p = Object.assign({ html: html, tam: tam, peso: peso }, extra || {}), a = (extra && extra.entra) || 'subir', at = (extra && extra.atraso) || 0, q = extra && extra.quando;
    delete p.entra; delete p.atraso; delete p.quando;
    return EA.novoObjeto('texto', p, { x: x, y: y, w: w, h: h, entra: a, atraso: at, quando: q });
  }
  function U(modelo, x, y, w, h, campos, extra) {
    extra = extra || {};
    var def = EA.ELEMENTOS[modelo], c = Object.assign({}, def.campos, campos || {});
    var o = EA.novoObjeto('ui', { modelo: modelo, campos: c }, { x: x, y: y, w: w || def.w, h: h || def.h, entra: extra.entra || 'subir', atraso: extra.atraso || 0, quando: extra.quando });
    return o;
  }
  function tit(texto, y) { return T(texto, 64, y == null ? 84 : y, 1152, 80, 42, 650, { espaco: -.03, altura: 1.12, atraso: .05 }) }
  function rot(texto) { return U('pilula', 64, 40, 300, 34, { t: texto }, { entra: 'aparecer' }) }
  function pessoa(nome) {
    var t = window.PECAS_BONECO && PECAS_BONECO.TURMA[nome];
    return EA.novoObjeto('boneco', { turma: nome, quadro: 'feliz', quadros: t || {} }, { x: 90, y: 300, w: 192, h: 300, entra: 'quicar' });
  }
  /* ---------- modelos com pessoas: fotos do catálogo gerado no PC ---------- */
  function catalogo(id) { return (window.EA_PESSOAS || []).find(function (p) { return p.id === id }) }
  /* pessoa recortada, com os pés para fora do slide: bx = centro, alt = altura */
  function foto(id, bx, alt, extra) {
    var p = catalogo(id); extra = extra || {};
    var w = Math.round(p.w * alt / p.h), base = extra.base == null ? 736 : extra.base;
    var props = { src: p.src, nomeFoto: p.nome }; if (extra.filtro) props.filtro = extra.filtro;
    return EA.novoObjeto('imagem', props, { x: Math.round(bx - w / 2), y: base - alt, w: w, h: alt, entra: extra.entra || 'subir', atraso: extra.atraso || 0, quando: extra.quando });
  }
  /* foto cortada para caber numa caixa */
  function quadro(id, x, y, w, h, raio, extra) {
    var p = catalogo(id); extra = extra || {};
    var props = { src: p.src, nomeFoto: p.nome, ajuste: 'cover', raio: raio == null ? 16 : raio }; if (extra.topo) props.topo = true; if (extra.filtro) props.filtro = extra.filtro;
    return EA.novoObjeto('imagem', props, { x: x, y: y, w: w, h: h, entra: extra.entra || 'aparecer', atraso: extra.atraso || 0 });
  }
  function F(forma, x, y, w, h, cor, extra) {
    extra = extra || {};
    return EA.novoObjeto('forma', { forma: forma, cor: cor, raio: extra.raio == null ? 14 : extra.raio }, { x: x, y: y, w: w, h: h, entra: extra.entra || 'aparecer', atraso: extra.atraso || 0, op: extra.op });
  }
  var BRANCO = '#fff', CLARO = 'rgba(255,255,255,.82)';
  EA.MODELOS_PESSOAS = [
    { id: 'p_capa', nome: 'Capa com pessoa', usa: ['corp_bracos'], f: function () {
      return EA.novoSlide([F('diagonal', 830, 0, 560, 720, 'var(--azul)', { entra: 'direita' }), F('diagonal', 740, 0, 170, 720, 'var(--palido)', { entra: 'direita', atraso: .08 }),
        U('pilula', 64, 80, 240, 34, { t: 'Treinamento' }, { entra: 'aparecer' }),
        T('Título da aula,<br>direto ao ponto.', 64, 130, 720, 170, 62, 700, { espaco: -.045, altura: 1.08, atraso: .08 }),
        T('Uma frase que diz o que a pessoa vai conseguir fazer no final.', 64, 320, 620, 70, 22, 400, { cor: 'var(--suave)', atraso: .16, altura: 1.4 }),
        U('botao', 64, 420, 260, 60, { t: 'Começar →' }, { atraso: .24 }),
        foto('corp_bracos', 960, 680, { entra: 'subir', atraso: .15 })]);
    } },
    { id: 'p_sobre', nome: 'Sobre, com pessoa', usa: ['corp_tablet'], f: function () {
      return EA.novoSlide([F('circulo', 40, 110, 540, 540, 'var(--palido)', { entra: 'pop' }), F('canto', 0, 0, 180, 180, 'var(--azul)', { entra: 'aparecer' }),
        foto('corp_tablet', 310, 640, { atraso: .1 }), rot2('Quem somos', 640, 70),
        T('Uma frase forte sobre<br>o que fazemos.', 640, 112, 590, 130, 44, 700, { espaco: -.035, altura: 1.12, atraso: .08 }),
        U('certo', 640, 270, 580, 88, { t: 'Primeiro ponto', d: 'Explique em uma linha.' }, { atraso: .2 }),
        U('certo', 640, 372, 580, 88, { t: 'Segundo ponto', d: 'Explique em uma linha.' }, { atraso: .3 }),
        U('certo', 640, 474, 580, 88, { t: 'Terceiro ponto', d: 'Explique em uma linha.' }, { atraso: .4 })]);
    } },
    { id: 'p_equipe', nome: 'Equipe', usa: ['corp_bracos', 'corp_mao_aberta', 'corp_tablet', 'corp_pasta'], f: function () {
      var l = [rot('Equipe'), tit('Quem vai caminhar com você.')], g = [['corp_bracos', 'Nome da pessoa'], ['corp_mao_aberta', 'Nome da pessoa'], ['corp_tablet', 'Nome da pessoa'], ['corp_pasta', 'Nome da pessoa']];
      g.forEach(function (q, k) {
        var x = 76 + k * 292;
        l.push(F('circulo', x, 200, 248, 248, k % 2 ? 'var(--azul)' : 'var(--palido)', { entra: 'pop', atraso: .1 + k * .08 }));
        l.push(quadro(q[0], x, 200, 248, 248, 124, { topo: true, entra: 'pop', atraso: .14 + k * .08 }));
        l.push(T(q[1], x - 14, 466, 276, 36, 22, 700, { alinha: 'center', atraso: .22 + k * .08 }));
        l.push(T('Cargo ou função', x - 14, 502, 276, 30, 16, 400, { alinha: 'center', cor: 'var(--suave)', atraso: .26 + k * .08 }));
      });
      return EA.novoSlide(l);
    } },
    { id: 'p_servicos', nome: 'Pessoa e cartões', usa: ['corp_aponta_lado'], f: function () {
      return EA.novoSlide([F('hexagono', 420, 130, 440, 410, 'var(--palido)', { entra: 'pop' }), rot('O que oferecemos'), tit('Quatro formas de ajudar.'),
        U('cartao', 64, 190, 330, 200, { i: '01', t: 'Primeiro', d: 'Uma frase curta.' }, { entra: 'esquerda', atraso: .15 }), U('cartao', 64, 410, 330, 200, { i: '02', t: 'Segundo', d: 'Uma frase curta.' }, { entra: 'esquerda', atraso: .25 }),
        U('cartao', 886, 190, 330, 200, { i: '03', t: 'Terceiro', d: 'Uma frase curta.' }, { entra: 'direita', atraso: .2 }), U('cartao', 886, 410, 330, 200, { i: '04', t: 'Quarto', d: 'Uma frase curta.' }, { entra: 'direita', atraso: .3 }),
        foto('corp_aponta_lado', 640, 660, { atraso: .1, base: 850 })]);
    } },
    { id: 'p_atendimento', nome: 'Atendimento', usa: ['aten_headset'], f: function () {
      var b = U('balao', 560, 180, 620, 120, { t: 'Olá! Em que tela você está agora?' }, { entra: 'pop', atraso: .3 }), c2 = U('balao', 660, 330, 560, 120, { t: 'Perfeito. Agora toque no botão azul.' }, { entra: 'pop', quando: 'clique' });
      b.props.cauda = { x: -.09, y: .75, b: 28, pos: null }; c2.props.cauda = { x: -.26, y: .3, b: 28, pos: null };
      return EA.novoSlide([F('circulo', 60, 150, 460, 460, 'var(--azul)', { entra: 'pop' }), rot('Atendimento'), tit('Como conversar com o cliente.'), foto('aten_headset', 300, 580, { atraso: .1 }), b, c2,
        U('barra', 560, 510, 660, 70, { t: 'Clientes atendidos no primeiro contato', v: '84%' }, { entra: 'aparecer', atraso: .5 })]);
    } },
    { id: 'p_redes', nome: 'Redes sociais', usa: ['redes_celular'], f: function () {
      return EA.novoSlide([F('diagonal', -150, 0, 620, 720, 'var(--azul)', { entra: 'esquerda' }), foto('redes_celular', 260, 650, { atraso: .1 }), U('pilula', 580, 60, 240, 34, { t: 'Redes sociais' }, { entra: 'aparecer' }),
        T('O que acontece<br>quando você posta.', 580, 104, 660, 130, 44, 700, { espaco: -.035, altura: 1.12, atraso: .08 }),
        U('g_metrica', 580, 262, 310, 160, { t: 'Alcance', n: '24 mil', v: '+31%', dados: '10, 14, 12, 18, 22, 28, 34' }, { entra: 'pop', atraso: .2 }), U('g_metrica', 910, 262, 310, 160, { t: 'Curtidas', n: '3,2 mil', v: '+12%', dados: '8, 9, 11, 10, 12, 13, 15' }, { entra: 'pop', atraso: .3 }),
        U('g_subida', 580, 440, 640, 230, { t: 'Seguidores', v: '+18%', dados: '20, 26, 25, 34, 40, 52', nomes: '' }, { entra: 'subir', atraso: .4 })]);
    } },
    { id: 'p_dados', nome: 'Pessoa explica os números', usa: ['corp_aponta_lado'], f: function () {
      return EA.novoSlide([F('circulo', 880, 150, 480, 480, 'var(--palido)', { entra: 'pop' }), rot('Resultados'), tit('O que os números mostram.'),
        U('g_subida', 64, 190, 480, 300, {}, { entra: 'subir', atraso: .15 }), U('g_rosca', 576, 190, 240, 240, { v: '72%', t: 'da meta' }, { entra: 'pop', atraso: .3 }),
        U('ponto', 64, 520, 760, 100, { n: 'PARA LEVAR', d: 'A conclusão desta cena em uma frase.' }, { atraso: .45 }), foto('corp_aponta_lado', 1080, 760, { atraso: .2, base: 940 })]);
    } },
    { id: 'p_dica', nome: 'Dica em destaque', usa: ['corp_aponta_cima'], f: function () {
      var s = EA.novoSlide([F('diagonal', 780, 0, 620, 720, 'rgba(255,255,255,.1)', { entra: 'direita' }), U('pilula', 80, 170, 150, 34, { t: 'Dica' }, { entra: 'pop' }),
        T('Escreva aqui a dica que a pessoa não pode esquecer.', 80, 220, 660, 240, 52, 700, { cor: BRANCO, espaco: -.035, altura: 1.14, atraso: .1 }), T('Uma linha de explicação, sem pressa.', 80, 470, 640, 40, 22, 400, { cor: CLARO, atraso: .2 }), foto('corp_aponta_cima', 960, 660, { atraso: .12 })]);
      s.fundo = { tipo: 'gradiente', ang: 135, cor: '#0064e0', cor2: '#004faa' }; return s;
    } },
    { id: 'p_problema', nome: 'Problema e solução (troca)', usa: ['emo_duvida', 'emo_comemora'], f: function () {
      var a = foto('emo_duvida', 960, 620, { entra: 'subir' }), b = foto('emo_comemora', 960, 620, { entra: 'nenhuma' }); a.troca = { por: b.id, efeito: 'virar', som: 'acerto' };
      var ta = U('aviso', 64, 240, 640, 120, { t: 'O problema', d: 'Conte em uma frase o que está dando errado.' }, { entra: 'esquerda', atraso: .15 }), tb = U('certo', 64, 390, 640, 120, { t: 'A solução', d: 'Clique para ver a pessoa mudar de cara.' }, { entra: 'esquerda', quando: 'clique' });
      return EA.novoSlide([F('circulo', 720, 120, 500, 500, 'var(--palido)', { entra: 'pop' }), rot('Na prática'), tit('Do problema à solução.'), ta, tb, a, b]);
    } },
    { id: 'p_foto', nome: 'Foto de fundo', usa: ['amb_escritorio'], f: function () {
      return EA.novoSlide([quadro('amb_escritorio', 0, 0, 1280, 720, 0, { entra: 'zoom' }), F('ret', 0, 0, 1280, 720, 'linear-gradient(100deg,rgba(0,60,150,.92),rgba(0,80,190,.62) 55%,rgba(0,100,224,.1))', { raio: 0 }),
        T('02', 90, 170, 300, 110, 96, 700, { cor: 'rgba(255,255,255,.4)', entra: 'esquerda', altura: 1 }), T('Nome do capítulo', 90, 280, 900, 90, 66, 700, { cor: BRANCO, espaco: -.04, atraso: .1, altura: 1.1 }), T('O que vem por aí, numa frase.', 90, 380, 800, 40, 24, 400, { cor: CLARO, atraso: .2 })]);
    } },
    { id: 'p_galeria', nome: 'Galeria de fotos', usa: ['amb_reuniao', 'amb_coworking', 'amb_callcenter', 'amb_apresenta'], f: function () {
      return EA.novoSlide([rot('Na rotina'), tit('Como isso aparece no dia a dia.'), quadro('amb_reuniao', 64, 180, 560, 245, 16, { entra: 'pop', atraso: .1 }), quadro('amb_coworking', 640, 180, 280, 245, 16, { entra: 'pop', atraso: .2 }), quadro('amb_callcenter', 936, 180, 280, 245, 16, { entra: 'pop', atraso: .3 }), quadro('amb_apresenta', 64, 441, 280, 215, 16, { entra: 'pop', atraso: .4 }),
        U('cartao', 360, 441, 856, 215, { i: 'i', t: 'O que observar', d: 'Conte o que a pessoa deve notar nessas fotos.' }, { atraso: .5 })]);
    } },
    { id: 'p_tarefas', nome: 'Tarefas', usa: ['tare_prancheta'], f: function () {
      var l = [F('canto', 1040, 0, 240, 240, 'var(--azul)', { entra: 'aparecer' }), rot('Passo a passo'), tit('O que fazer, nesta ordem.')];
      ['Primeira tarefa', 'Segunda tarefa', 'Terceira tarefa'].forEach(function (t, k) { var c3 = U('chave', 64, 210 + k * 92, 620, 60, { t: t }, { entra: 'subir', quando: 'clique' }); l.push(c3) });
      l.push(U('barra', 64, 510, 620, 70, { t: 'Concluído', v: '66%' }, { entra: 'aparecer', atraso: .3 }));
      l.push(F('circulo', 770, 150, 480, 480, 'var(--palido)', { entra: 'pop' })); l.push(foto('tare_prancheta', 1010, 600, { atraso: .1 }));
      return EA.novoSlide(l);
    } },
    { id: 'p_fim', nome: 'Agradecimento', usa: ['emo_sim'], f: function () {
      return EA.novoSlide([F('diagonal', 830, 0, 560, 720, 'var(--azul)', { entra: 'direita' }), F('diagonal', 740, 0, 170, 720, 'var(--palido)', { entra: 'direita', atraso: .08 }),
        T('Obrigado!', 64, 170, 720, 110, 88, 700, { espaco: -.05, altura: 1.05 }), T('Agora é com você. Qualquer dúvida, é só chamar.', 64, 290, 620, 80, 24, 400, { cor: 'var(--suave)', atraso: .15, altura: 1.4 }), U('botao', 64, 400, 300, 60, { t: 'Falar com a equipe' }, { atraso: .25 }), foto('emo_sim', 960, 680, { atraso: .15 })]);
    } }
  ];
  function rot2(texto, x, y) { return U('pilula', x, y, 240, 34, { t: texto }, { entra: 'aparecer' }) }
  EA.modelosPessoasProntos = function () { return EA.MODELOS_PESSOAS.filter(function (m) { return m.usa.every(catalogo) }) };

  var PERGUNTAS = [
    { p: 'Qual é a primeira coisa a conferir?', ops: ['O que a pessoa está vendo na tela', 'A cor do botão', 'O dia da semana', 'O nome do arquivo'], certa: 0, exp: 'Sempre comece pelo que está na tela da pessoa.' },
    { p: 'Isto é verdadeiro ou falso: errar faz parte de aprender.', ops: ['Verdadeiro', 'Falso'], certa: 0, exp: 'É por isso que o feedback aparece aqui mesmo, no mesmo slide.' },
    { p: 'Depois de responder, o que acontece?', ops: ['Muda de slide', 'Aparece o feedback animado', 'Nada', 'Fecha a aula'], certa: 1, exp: 'Tudo acontece neste slide: você não precisa criar um slide por resposta.' }
  ];
  /* só os arquivos daquele jogo */
  function artesDe(a, b) {
    var r = {}; Object.keys(JOGOS.ia).forEach(function (k) { if (k.indexOf(a + '_') === 0 || k.indexOf(b + '_') === 0 || (a === 'fut' && (k === 'bola' || k === 'trofeu')) || (a === 'tat' && k === 'arma_fp')) r[k] = JOGOS.ia[k].src });
    return r;
  }
  var UMA_CERTA = PERGUNTAS.concat([{ p: 'Quem acerta...', ops: ['Avança no jogo', 'Volta para o começo'], certa: 0, exp: 'Quem acerta bate. Quem erra apanha.' }]);
  var COM_FORMATOS = PERGUNTAS.concat([
    { tipo: 'varias', p: 'Quais destes são meios de falar com o cliente?', ops: ['WhatsApp', 'E-mail', 'Grampeador', 'Telefone'], certa: 0, certas: [0, 1, 3], exp: 'Grampeador não responde mensagem.' },
    { tipo: 'ligar', p: 'Ligue cada problema à primeira coisa a fazer.', ops: [], certa: 0, pares: [{ a: 'Sumiu um botão', b: 'Conferir em que tela a pessoa está' }, { a: 'Página não abre', b: 'Testar a internet' }, { a: 'Senha não entra', b: 'Pedir nova senha' }], exp: 'Comece sempre pelo mais simples de conferir.' }
  ]);
  EA.MODELOS = [
    { id: 'branco', nome: 'Em branco', f: function () { return EA.novoSlide([]) } },
    { id: 'capa', nome: 'Capa', f: function () {
      return EA.novoSlide([U('pilula', 64, 40, 240, 34, { t: '01 · Início' }, { entra: 'aparecer' }),
        T('Título da aula, direto ao ponto.', 64, 84, 1100, 74, 52, 650, { espaco: -.045, altura: 1.1, atraso: .05 }),
        T('Uma frase que diz o que a pessoa vai conseguir fazer no final.', 64, 158, 1000, 36, 20, 400, { cor: 'var(--suave)', atraso: .12 }),
        U('palco', 64, 214, 1152, 440, {}, { entra: 'aparecer', atraso: .15 }),
        U('heroi', 88, 238, 1104, 392, {}, { entra: 'aparecer', atraso: .2 }),
        U('pilula', 124, 300, 200, 34, { t: 'Uma jornada visual' }, { atraso: .3 }),
        T('Da ideia certa<br>ao resultado confiável.', 124, 344, 560, 110, 36, 700, { espaco: -.03, altura: 1.14, atraso: .36 }),
        T('Veja, experimente e explique, tudo na mesma aula.', 124, 454, 540, 60, 18, 400, { cor: 'var(--suave)', atraso: .42 }),
        U('botao', 124, 530, 280, 58, { t: 'Começar →' }, { atraso: .5 }),
        U('orbita', 830, 270, 280, 280, { m: 'A', a: 'Ver', b: 'Fazer', d: 'Explicar' }, { entra: 'pop', atraso: .35 })]);
    } },
    { id: 'capitulo', nome: 'Capítulo', f: function () {
      var s = EA.novoSlide([T('02', 100, 180, 400, 150, 130, 700, { cor: 'rgba(255,255,255,.35)', entra: 'esquerda', altura: 1 }),
        T('Nome do capítulo', 100, 320, 1000, 90, 66, 650, { cor: '#fff', espaco: -.04, atraso: .1, altura: 1.1 }),
        T('O que vem por aí, numa frase.', 100, 420, 900, 40, 24, 400, { cor: 'rgba(255,255,255,.8)', atraso: .2 })]);
      s.fundo = { tipo: 'gradiente', ang: 135, cor: '#0064e0', cor2: '#004faa' }; s.trans = { tipo: 'pixel', dur: .7 }; return s;
    } },
    { id: 'tres', nome: 'Três cartões', f: function () {
      return EA.novoSlide([rot('Capítulo'), tit('Três ideias, uma de cada vez.'),
        U('cartao', 64, 190, 368, 300, { i: '01', t: 'Primeira ideia', d: 'Explique a ideia em uma ou duas frases curtas.' }, { atraso: .15 }),
        U('cartao', 456, 190, 368, 300, { i: '02', t: 'Segunda ideia', d: 'Explique a ideia em uma ou duas frases curtas.' }, { atraso: .25 }),
        U('cartao', 848, 190, 368, 300, { i: '03', t: 'Terceira ideia', d: 'Explique a ideia em uma ou duas frases curtas.' }, { atraso: .35 }),
        U('ponto', 64, 520, 1152, 90, { n: 'PARA LEVAR', d: 'A frase que a pessoa deve lembrar depois desta cena.' }, { atraso: .5 })]);
    } },
    { id: 'duas', nome: 'Texto e tela', f: function () {
      return EA.novoSlide([rot('Na prática'), tit('Mostre onde clicar.'),
        T('Explique em poucas linhas o que a pessoa está vendo.<br><br>Depois diga o que ela deve procurar nessa tela.', 64, 190, 440, 300, 22, 400, { cor: 'var(--suave)', atraso: .12, altura: 1.45 }),
        U('botao', 64, 520, 240, 56, { t: 'Próximo passo →' }, { atraso: .3 }),
        U('navegador', 536, 180, 680, 450, {}, { entra: 'direita', atraso: .15 })]);
    } },
    { id: 'fluxo', nome: 'Fluxo animado', f: function () {
      return EA.novoSlide([rot('Como funciona'), tit('Siga o caminho do começo ao fim.'),
        U('no', 90, 240, 250, 190, { t: 'Começo', d: 'o que dispara' }, { entra: 'pop', atraso: .1 }), U('seta', 352, 312, 90, 44, {}, { entra: 'aparecer', atraso: .25 }),
        U('no', 515, 240, 250, 190, { t: 'Meio', d: 'o que acontece' }, { entra: 'pop', atraso: .3 }), U('seta', 777, 312, 90, 44, {}, { entra: 'aparecer', atraso: .45 }),
        U('no', 940, 240, 250, 190, { t: 'Fim', d: 'o que você vê' }, { entra: 'pop', atraso: .5 }),
        U('pacote', 90, 490, 1100, 44, { t: 'evento' }, { entra: 'aparecer', atraso: .7 })]);
    } },
    { id: 'codigo', nome: 'Código + explicação', f: function () {
      return EA.novoSlide([rot('Código'), tit('Leia o código linha por linha.'),
        U('codigo', 64, 180, 700, 440, {}, { entra: 'esquerda', atraso: .1 }),
        U('cartao', 796, 180, 420, 200, { i: '1', t: 'O que faz', d: 'Explique o que esta parte faz.' }, { quando: 'clique' }),
        U('cartao', 796, 400, 420, 200, { i: '2', t: 'Onde olhar', d: 'Diga o que a pessoa deve conferir.' }, { quando: 'clique' })]);
    } },
    { id: 'passos', nome: 'Passo a passo', f: function () {
      var l = [rot('Passo a passo'), tit('Um clique revela cada passo.')];
      for (var k = 0; k < 4; k++) l.push(U('cartao', 64 + k * 292, 200, 276, 310, { i: String(k + 1), t: 'Passo ' + (k + 1), d: 'O que fazer neste passo.' }, { entra: 'subir', quando: 'clique' }));
      return EA.novoSlide(l);
    } },
    { id: 'antesdepois', nome: 'Antes e depois (troca)', f: function () {
      var a = U('cartao', 400, 200, 480, 300, { i: 'A', t: 'Antes', d: 'Como era. No clique, este cartão vira o outro.' }, { entra: 'pop' });
      var b = U('cartao', 400, 200, 480, 300, { i: 'B', t: 'Depois', d: 'Como ficou. Os dois ficam no mesmo lugar.' }, {});
      b.entrada.tipo = 'nenhuma';
      a.troca = { por: b.id, efeito: 'virar', som: 'surgir' };
      return EA.novoSlide([rot('Comparação'), tit('Antes e depois, no mesmo lugar.'), a, b]);
    } },
    { id: 'numeros', nome: 'Números', f: function () {
      return EA.novoSlide([rot('Em números'), tit('O que os números mostram.'),
        U('numero', 64, 210, 360, 170, { n: '96%', d: 'descrição do número' }, { entra: 'pop', atraso: .1 }), U('numero', 460, 210, 360, 170, { n: '3×', d: 'descrição do número' }, { entra: 'pop', atraso: .25 }), U('numero', 856, 210, 360, 170, { n: '24 h', d: 'descrição do número' }, { entra: 'pop', atraso: .4 }),
        U('barra', 64, 430, 1152, 70, { t: 'Meta do trimestre', v: '72%' }, { entra: 'aparecer', atraso: .55 })]);
    } },
    { id: 'personagem', nome: 'Personagem fala', f: function () {
      return EA.novoSlide([rot('Conversa'), tit('Uma história com alguém de verdade.'), pessoa('marina'),
        U('balao', 320, 300, 560, 130, { t: 'Oi! Sumiu um botão da minha tela. E agora?' }, { entra: 'pop', atraso: .3 }),
        U('balao', 480, 460, 620, 130, { t: 'Calma, vamos olhar juntas: em que tela você está?' }, { entra: 'pop', quando: 'clique' })]);
    } },
    { id: 'celular', nome: 'No celular', f: function () {
      return EA.novoSlide([rot('No celular'), tit('Mostre a tela do celular.'),
        T('Conte o que aparece na tela e o que tocar primeiro.', 64, 200, 620, 160, 26, 400, { cor: 'var(--suave)', atraso: .1, altura: 1.4 }),
        U('aviso', 64, 400, 620, 110, {}, { atraso: .3 }), U('celular', 850, 150, 270, 530, {}, { entra: 'direita', atraso: .15 })]);
    } },
    { id: 'fim', nome: 'Fechamento', f: function () {
      return EA.novoSlide([T('Pronto. O que levar daqui:', 64, 80, 1152, 80, 50, 650, { espaco: -.04 }),
        U('ponto', 64, 210, 368, 150, { n: '01', d: 'Primeira coisa para lembrar.' }, { atraso: .15 }), U('ponto', 456, 210, 368, 150, { n: '02', d: 'Segunda coisa para lembrar.' }, { atraso: .25 }), U('ponto', 848, 210, 368, 150, { n: '03', d: 'Terceira coisa para lembrar.' }, { atraso: .35 }),
        U('certo', 64, 420, 1152, 90, { t: 'Muito bem', d: 'Agora é com você.' }, { atraso: .5 })]);
    } },
    { id: 'quiz', nome: 'Quiz padrão', quiz: true, f: function () {
      return EA.novoSlide([], { nome: 'Quiz', trans: { tipo: 'zoom', dur: .5 }, quiz: { modelo: 'padrao', perguntas: EA.clona(COM_FORMATOS) } });
    } },
    { id: 'mon', nome: 'Batalha de monstrinhos', quiz: true, precisa: function () { return window.JOGOS }, f: function () {
      var M = JOGOS.mon, a = M.monstros.m2, b = M.monstros.m13;
      return EA.novoSlide([], { nome: 'Monstrinhos', trans: { tipo: 'pixel', dur: .7 }, quiz: { modelo: 'mon', fundoImg: M.fundos[0], golpeImg: M.golpes[5], golpeIni: M.golpes[3], heroi: { nome: a.nome, lut: a }, inimigo: { nome: b.nome, lut: b }, perguntas: EA.clona(UMA_CERTA) } });
    } },
    { id: 'fps', nome: 'Tiro em 1ª pessoa', quiz: true, precisa: function () { return window.JOGOS }, f: function () {
      return EA.novoSlide([], { nome: 'Tiro ao alvo', trans: { tipo: 'zoom', dur: .5 }, quiz: { modelo: 'fps', tema: JOGOS.fps.soldado, perguntas: EA.clona(UMA_CERTA) } });
    } },
    { id: 'penalti', nome: 'Pênalti', quiz: true, precisa: function () { return window.JOGOS && JOGOS.ia }, f: function () {
      return EA.novoSlide([], { nome: 'Pênalti', trans: { tipo: 'zoom', dur: .5 }, quiz: { modelo: 'penalti', time: 'Meu time', arte: artesDe('fut', 'gol'), perguntas: EA.clona(UMA_CERTA) } });
    } },
    { id: 'tatico', nome: 'Missão tática', quiz: true, precisa: function () { return window.JOGOS && JOGOS.ia }, f: function () {
      return EA.novoSlide([], { nome: 'Missão tática', trans: { tipo: 'zoom', dur: .5 }, quiz: { modelo: 'tatico', nomeA: 'Minha equipe', tempo: 20, nTerr: 2, nBomba: 2, arte: artesDe('tat', 'riv'), perguntas: EA.clona(UMA_CERTA) } });
    } },
    { id: 'rpg', nome: 'Batalha RPG', quiz: true, f: function () {
      var J = window.JOGOS, he = J ? J.rpg.herois.heroi_mono : Object.assign({ id: 'char_12' }, window.LUTADORES.char_12), ini = J ? J.rpg.inimigos.cogumelo_mono : window.LUTADORES.goblin;
      var q = { modelo: 'rpg', musica: 'investida', cenario: 'floresta', golpe: 'corte', heroi: { nome: he.nome, lut: he }, inimigo: { nome: ini.nome, lut: ini }, perguntas: EA.clona(UMA_CERTA) };
      if (J) { q.cenImg = J.cenarios.planicie; q.cenId = 'planicie' }
      return EA.novoSlide([], { nome: 'Batalha', trans: { tipo: 'pixel', dur: .7 }, quiz: q });
    } }
  ];
})();
