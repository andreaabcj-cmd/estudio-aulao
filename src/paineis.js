/* Painéis de inserir: modelos, texto, formas, ícones, elementos, personagens, efeitos, mídia, gravar, sons, quiz. */
(function () {
  var EA = window.EA, ic = function (n) { return EA.ic(n) }, $ = function (s, r) { return (r || document).querySelector(s) };
  var aberto = null;
  function abre(nome) {
    var p = $('#painel');
    if (aberto === nome) { fecha(); return }
    aberto = nome; p.hidden = false; p.innerHTML = '';
    [].forEach.call(document.querySelectorAll('[data-painel]'), function (b) { b.classList.toggle('on', b.dataset.painel === nome) });
    var d = PAINEIS[nome];
    p.innerHTML = '<div class="pn-topo"><h3>' + d.tit + (EA.Ed.trocando ? ' · trocar objeto' : '') + '</h3><button class="ed-x" title="Fechar">' + ic('x') + '</button></div><div class="pn-corpo"></div>';
    $('.ed-x', p).onclick = fecha;
    d.f($('.pn-corpo', p));
    window.dispatchEvent(new Event('resize'));
  }
  function fecha() {
    aberto = null; var p = $('#painel'); if (!p) return; p.hidden = true; p.innerHTML = '';
    [].forEach.call(document.querySelectorAll('[data-painel]'), function (b) { b.classList.remove('on') });
    window.dispatchEvent(new Event('resize'));
  }
  function busca(ph, aoMudar) { var i = EA.el('input', 'pn-busca'); i.placeholder = ph; i.type = 'search'; i.oninput = function () { aoMudar(i.value.trim().toLowerCase()) }; return i }
  function grupo(t) { return EA.el('h4', 'pn-grupo', t) }

  var PAINEIS = {
    modelos: { tit: 'Modelos de slide', f: function (c) {
      var g = EA.el('div', 'pn-modelos');
      function poe(m) {
        var b = EA.el('button', 'pn-modelo'); b.title = m.nome;
        var keep = EA.projetoAtual;
        b.appendChild(EA.slideEstatico(m.f(), EA.projetoAtual, 142));
        EA.projetoAtual = keep;
        b.appendChild(EA.el('span', '', m.nome));
        b.onclick = function () { EA.novoDeModelo(m) };
        g.appendChild(b);
      }
      function monta() {
        g.innerHTML = '';
        var todos = EA.MODELOS.filter(function (m) { return !m.precisa || m.precisa() });
        todos.filter(function (m) { return m.id === 'branco' }).forEach(poe);
        g.appendChild(EA.el('h4', 'modelo-sub', 'Com pessoas'));
        var pr = EA.modelosPessoasProntos();
        pr.forEach(poe);
        if (pr.length < EA.MODELOS_PESSOAS.length) g.appendChild(EA.el('p', 'pn-nada', pr.length + ' de ' + EA.MODELOS_PESSOAS.length + ' prontos. Os outros aparecem aqui conforme as fotos forem saindo.'));
        g.appendChild(EA.el('h4', 'modelo-sub', 'Essenciais'));
        todos.filter(function (m) { return !m.quiz && m.id !== 'branco' }).forEach(poe);
        g.appendChild(EA.el('h4', 'modelo-sub', 'Dinâmica'));
        ['quiz', 'rpg', 'mon', 'fps', 'penalti', 'tatico'].forEach(function (id) { todos.filter(function (m) { return m.id === id }).forEach(poe) });
      }
      c.appendChild(g);
      monta();
      EA.relePessoas(function () { if (EA.modelosPessoasProntos().length !== g.querySelectorAll('.pn-modelo').length - EA.MODELOS.filter(function (m) { return !m.precisa || m.precisa() }).length) monta() });
    } },
    texto: { tit: 'Texto', f: function (c) {
      [['Título grande', 'Título', 52, 650, 900, 80, { espaco: -.04, altura: 1.1 }], ['Subtítulo', 'Subtítulo da cena', 34, 650, 760, 56, { espaco: -.02 }], ['Parágrafo', 'Escreva aqui um texto curto e direto.', 22, 400, 640, 110, { cor: 'var(--suave)', altura: 1.45 }], ['Legenda', 'Uma legenda pequena', 14, 400, 360, 30, { cor: 'var(--suave)' }], ['Código', 'fbq(\'track\', \'PageView\');', 20, 400, 560, 40, { fonte: 'mono' }], ['Pixel', 'TEXTO EM PIXEL', 48, 400, 560, 60, { fonte: 'pixel' }]].forEach(function (t) {
        var b = EA.el('button', 'pn-texto'); b.innerHTML = '<span style="font-size:' + Math.min(t[2], 30) + 'px;font-weight:' + t[3] + ';' + (t[6].fonte ? 'font-family:' + EA.FONTES[t[6].fonte] : '') + '">' + EA.esc(t[0]) + '</span>';
        b.onclick = function () { EA.insere(EA.novoObjeto('texto', Object.assign({ html: t[1], tam: t[2], peso: t[3] }, t[6]), { w: t[4], h: t[5], entra: 'subir' })) };
        c.appendChild(b);
      });
    } },
    formas: { tit: 'Formas', f: function (c) {
      var g = EA.el('div', 'pn-formas');
      EA.FORMAS.forEach(function (f) {
        var o = EA.novoObjeto('forma', { forma: f[0] === 'pilula' ? 'ret' : f[0], raio: f[0] === 'pilula' ? 99 : 14 }, { w: f[2], h: f[3], entra: 'pop' });
        var b = EA.el('button', 'pn-forma', '<div class="pn-forma-v"></div><span>' + f[1] + '</span>');
        var vv = $('.pn-forma-v', b); vv.innerHTML = EA.conteudo(o, {}); vv.style.cssText = '--azul:#0064e0;width:60px;height:' + Math.max(4, 60 * f[3] / f[2]) + 'px;position:relative';
        b.onclick = function () { EA.insere(EA.clona(o)) };
        g.appendChild(b);
      });
      c.appendChild(g);
    } },
    icones: { tit: 'Ícones', f: function (c) {
      var nomes = Object.keys(window.ICONES_TABLER), g = EA.el('div', 'pn-icones'), mais;
      var abas = EA.el('div', 'pn-abas', '<button data-t="linha">Em linha</button><button data-t="cores">Coloridos</button>'), filtro = '';
      function semAcento(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() }
      function coloridos(q) {
        g.className = 'pn-colhidos'; g.innerHTML = '';
        var cats = {}, nq = semAcento(q);
        window.QV_ICONES.filter(function (i) { return !nq || semAcento(i.nome + ' ' + i.kw + ' ' + i.cat).indexOf(nq) >= 0 }).forEach(function (i) { (cats[i.cat] = cats[i.cat] || []).push(i) });
        Object.keys(cats).forEach(function (ct) {
          g.appendChild(grupo(ct));
          var gr = EA.el('div', 'pn-coloridos');
          cats[ct].forEach(function (i) {
            var b = EA.el('button', '', '<svg class="ob-desenho" viewBox="0 0 ' + i.vw + ' ' + i.vh + '">' + i.svg + '</svg>'); b.title = i.nome;
            b.onclick = function () { var r = 160 / Math.max(i.vw, i.vh); EA.insere(EA.novoObjeto('desenho', { nome: i.nome, svg: i.svg, vw: i.vw, vh: i.vh }, { w: Math.round(i.vw * r), h: Math.round(i.vh * r), entra: 'pop' })) };
            gr.appendChild(b);
          });
          g.appendChild(gr);
        });
        if (!Object.keys(cats).length) g.appendChild(EA.el('p', 'pn-nada', 'Nada com esse nome. Tente "nuvem", "chave", "gráfico".'));
      }
      var SUG = ['bulb', 'rocket', 'target', 'check', 'x', 'alert-triangle', 'info-circle', 'star', 'heart', 'bolt', 'flag', 'trophy', 'users', 'user', 'message', 'mail', 'phone', 'device-mobile', 'device-desktop', 'world', 'search', 'settings', 'lock', 'shield-check', 'key', 'credit-card', 'shopping-cart', 'chart-bar', 'chart-line', 'clock', 'calendar', 'photo', 'video', 'code', 'link', 'arrow-right', 'thumb-up', 'mood-smile', 'gift', 'coin', 'wallet', 'home'];
      function emLinha(q) {
        g.className = 'pn-icones';
        var l = q ? nomes.filter(function (n) { return n.indexOf(q) >= 0 }) : SUG.filter(function (n) { return ICONES_TABLER[n] });
        g.innerHTML = l.slice(0, 160).map(function (n) { return '<button data-n="' + n + '" title="' + n + '">' + ic(n) + '</button>' }).join('') || '<p class="pn-nada">Nada com esse nome. Os nomes são em inglês: tente "rocket", "chart", "user".</p>';
      }
      g.onclick = function (e) { var b = e.target.closest('[data-n]'); if (b) EA.insere(EA.novoObjeto('icone', { nome: b.dataset.n, svg: ICONES_TABLER[b.dataset.n], traco: 1.8 }, { w: 120, h: 120, entra: 'pop' })) };
      var ent = busca('', function (q) { filtro = q; mostra() });
      function mostra() {
        var aba = EA.Paineis.abaIcone || 'linha';
        [].forEach.call(abas.children, function (b) { b.classList.toggle('on', b.dataset.t === aba) });
        ent.placeholder = aba === 'cores' ? 'Buscar: nuvem, chave, gráfico…' : 'Buscar em inglês: rocket, chart, user…';
        (aba === 'cores' ? coloridos : emLinha)(filtro);
      }
      abas.onclick = function (e) { var b = e.target.closest('[data-t]'); if (b) { EA.Paineis.abaIcone = b.dataset.t; mostra() } };
      c.appendChild(ent); c.appendChild(abas); c.appendChild(g); mostra();
    } },
    elementos: { tit: 'Elementos de interface', f: function (c) {
      function secao(titulo, chaves) {
        var g = EA.el('div', 'pn-elementos');
        chaves.forEach(function (k) {
          var d = EA.ELEMENTOS[k], o = EA.novoObjeto('ui', { modelo: k, campos: EA.clona(d.campos) }, { w: d.w, h: d.h, entra: 'subir' });
          var b = EA.el('button', 'pn-elem');
          var cx = EA.el('div', 'pn-elem-v'), f = Math.min(130 / d.w, 76 / d.h, 1), ins = EA.el('div', 'palco estatico');
          ins.style.cssText = 'position:absolute;background:transparent;width:' + d.w + 'px;height:' + d.h + 'px;transform-origin:0 0;transform:scale(' + f + ');left:' + (140 - d.w * f) / 2 + 'px;top:' + (84 - d.h * f) / 2 + 'px';
          EA.aplicaTema(ins, EA.projetoAtual.tema);
          ins.innerHTML = EA.conteudo(o, {});
          cx.appendChild(ins); b.appendChild(cx); b.appendChild(EA.el('span', '', d.nome));
          b.onclick = function () { EA.insere(EA.clona(o)) };
          g.appendChild(b);
        });
        c.appendChild(grupo(titulo)); c.appendChild(g);
      }
      /* 10/11: variantes (oculto: true) não entram na lista; a troca é pelo Estilo no painel Design */
      var todos = Object.keys(EA.ELEMENTOS).filter(function (k) { return !EA.ELEMENTOS[k].oculto });
      secao('Gráficos e métricas', todos.filter(function (k) { return EA.ELEMENTOS[k].grupo === 'graficos' }));
      c.appendChild(EA.el('p', 'pn-nota', 'Os números ficam no painel da direita: mudou o valor, o desenho acompanha.'));
      secao('Cartões e telas', todos.filter(function (k) { return EA.ELEMENTOS[k].grupo === 'telas' }));
      c.appendChild(EA.el('p', 'pn-nota', 'A foto de exemplo troca no painel da direita: escolha uma ou suba a sua.'));
      /* 11/11: uma seção só de interativos (os antigos e os novos juntos) */
      secao('Interativos', todos.filter(function (k) { var g = EA.ELEMENTOS[k].grupo; return g === 'interativos' || g === 'hf' }));
      c.appendChild(EA.el('p', 'pn-nota', 'Ganham vida na apresentação: clicar, arrastar, abrir. No Design ficam paradinhos.'));
      secao('Mapas', todos.filter(function (k) { return EA.ELEMENTOS[k].grupo === 'mapas' }));
      c.appendChild(EA.el('p', 'pn-nota', 'Na apresentação: no mapa-múndi, clique num país para abrir o mapa dele com os estados.'));
      secao('Interface', todos.filter(function (k) { return !EA.ELEMENTOS[k].grupo }));
    } },
    personagens: { tit: 'Personagens', f: painelPersonagens },
    efeitos: { tit: 'Efeitos animados', f: function (c) {
      var g = EA.el('div', 'pn-fx'), cats = {};
      window.FX_INDEX.filter(function (f) { return !f.boneco }).forEach(function (f) { cats[f.cat] = 1 });
      var filtro = '', cat = 'Interface';
      var ent = busca('', function (q) { filtro = q; mostra() });
      var abas = EA.el('div', 'pn-abas', '<button data-t="apres">Presentation Effects</button><button data-t="game">Game Effects</button>');
      var sel = EA.el('select', 'pn-sel', Object.keys(cats).sort().map(function (k) { return '<option' + (k === cat ? ' selected' : '') + '>' + k + '</option>' }).join(''));
      var nota = EA.el('p', 'pn-nota');
      /* as folhas são grandes: só carrega o que está à vista, uma por vez e sem travar a tela; o que sai de vista pausa */
      var vistos = null, filaFx = [], carregando = false;
      function proximoFx() {
        if (carregando || !filaFx.length) return;
        var b = filaFx.shift();
        if (!b.isConnected) { proximoFx(); return }
        carregando = true;
        var im = EA.imagem(EA.url('assets/fx/' + b._fx.arq));
        var pronto = function () { carregando = false; if (b.isConnected) { b._sp = EA.spriteFx($('canvas', b), b._fx, { loop: true }); b._sp.parado = !b._ver } proximoFx() };
        (im.decode ? im.decode() : Promise.resolve()).then(pronto, pronto);
      }
      function mostraGame() {
        g.className = 'pn-fx';
        if (vistos) vistos.disconnect();
        filaFx = [];
        vistos = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            var b = e.target; b._ver = e.isIntersecting;
            if (b._sp) b._sp.parado = !b._ver;
            else if (b._ver && !b._fila) { b._fila = true; filaFx.push(b) }
          });
          proximoFx();
        }, { rootMargin: '120px' });
        var l = window.FX_INDEX.filter(function (f) { return !f.boneco && (filtro ? f.nome.indexOf(filtro) >= 0 : f.cat === cat) }).slice(0, 40);
        l.forEach(function (f) {
          var b = EA.el('button', 'pn-fx-b', '<canvas></canvas><span>' + EA.esc(f.nome) + '</span>');
          var cv = $('canvas', b);
          cv.width = f.w; cv.height = f.h; b._fx = f;
          b.onclick = function () { var r = Math.min(360 / f.w, 360 / f.h, 2.5); EA.insere(EA.novoObjeto('efeito', { fx: f, repetir: f.loop, vel: 1 }, { w: Math.round(f.w * r), h: Math.round(f.h * r) })) };
          g.appendChild(b); vistos.observe(b);
        });
        if (!l.length) g.appendChild(EA.el('p', 'pn-nada', 'Nada com esse nome. Os nomes são em inglês.'));
      }
      function mostraApres() {
        g.className = 'pn-fxa-lista';
        var porCat = {};
        Object.keys(EA.FX_APRES).forEach(function (k) { var d = EA.FX_APRES[k]; if (filtro && (d.nome + ' ' + d.cat).toLowerCase().indexOf(filtro) < 0) return; (porCat[d.cat] = porCat[d.cat] || []).push(k) });
        Object.keys(porCat).forEach(function (ct) {
          g.appendChild(grupo(ct));
          var gr = EA.el('div', 'pn-fxa');
          porCat[ct].forEach(function (k) {
            var d = EA.FX_APRES[k], o = EA.novoObjeto('apres', { ef: k, repetir: true, vel: 1 }, { w: d.w, h: d.h, entra: 'aparecer' });
            var b = EA.el('button', 'pn-fxa-b'), cx = EA.el('div', 'pn-fxa-v'), f = Math.min(116 / d.w, 72 / d.h, 1.2), ins = EA.el('div', 'palco');
            ins.style.cssText = 'position:absolute;background:transparent;overflow:visible;width:' + d.w + 'px;height:' + d.h + 'px;transform-origin:0 0;transform:scale(' + f + ');left:' + (125 - d.w * f) / 2 + 'px;top:' + (80 - d.h * f) / 2 + 'px';
            EA.aplicaTema(ins, EA.projetoAtual.tema);
            ins.innerHTML = EA.conteudo(o, {});
            cx.appendChild(ins); b.appendChild(cx); b.appendChild(EA.el('span', '', d.nome));
            b.onclick = function () { EA.insere(EA.clona(o)) };
            gr.appendChild(b);
          });
          g.appendChild(gr);
        });
        if (!Object.keys(porCat).length) g.appendChild(EA.el('p', 'pn-nada', 'Nada com esse nome.'));
      }
      function mostra() {
        g.innerHTML = '';
        var jogo = EA.Paineis.abaFx === 'game';
        [].forEach.call(abas.children, function (b) { b.classList.toggle('on', (b.dataset.t === 'apres') !== jogo) });
        ent.placeholder = jogo ? 'Buscar em inglês: fire, star, coin…' : 'Buscar: clique, certo, confete…';
        sel.hidden = !jogo; sel.disabled = !!filtro;
        nota.textContent = jogo ? 'Efeitos em pixel art, para jogos e momentos divertidos. No palco eles repetem para você ver; na apresentação seguem o que você escolher no painel da direita.' : 'Efeitos mais sérios, no visual desta plataforma. Mudam de cor e de velocidade no painel da direita.';
        (jogo ? mostraGame : mostraApres)();
      }
      abas.onclick = function (e) { var b = e.target.closest('[data-t]'); if (b) { EA.Paineis.abaFx = b.dataset.t; mostra() } };
      sel.onchange = function () { cat = sel.value; mostra() };
      c.appendChild(ent); c.appendChild(abas); c.appendChild(sel); c.appendChild(g); c.appendChild(nota); mostra();
    } },
    midia: { tit: 'Imagem, vídeo e áudio', f: function (c) {
      c.innerHTML = '<label class="pn-solta">' + ic('upload') + '<b>Escolher arquivo</b><small>Imagem (GIF animado também), vídeo ou áudio. Também dá para arrastar para o palco ou colar com Ctrl+V.</small><input type="file" accept="image/*,video/*,audio/*" multiple hidden></label><p class="pn-nota">Tudo que entra aqui fica guardado só neste computador e vai dentro do HTML exportado. Vídeo grande deixa o HTML grande.</p><div id="pnMidias" class="pn-midias"></div>';
      /* 09/11: aceita vários arquivos de uma vez, e também soltar o arquivo em cima deste botão */
      $('input', c).onchange = function () { [].forEach.call(this.files, function (f) { EA.Paineis.arquivoMidia(f) }); this.value = '' };
      var solta = $('.pn-solta', c);
      solta.addEventListener('dragover', function (e) { e.preventDefault() });
      solta.addEventListener('drop', function (e) { e.preventDefault(); [].forEach.call(e.dataTransfer.files || [], function (f) { EA.Paineis.arquivoMidia(f) }) });
      var l = $('#pnMidias', c), m = EA.projetoAtual.midia;
      Object.keys(m).filter(function (k) { return m[k].tipo === 'imagem' }).forEach(function (k) {
        var b = EA.el('button', '', '<img alt="" src="' + EA.urlMidia(EA.projetoAtual, k) + '">'); b.onclick = function () { insereImagem(k, m[k].w || 640, m[k].h || 360) }; l.appendChild(b);
      });
    } },
    gravar: { tit: 'Gravar imagem e tela', f: function (c) {
      c.innerHTML = '<button class="pn-grande" id="gFoto">' + ic('camera') + '<b>Capturar imagem da tela</b><small>Escolha uma janela: a foto entra no slide.</small></button><button class="pn-grande" id="gVideo">' + ic('video') + '<b>Gravar para o slide</b><small>Escolha o que gravar. Ao parar, o vídeo entra no slide.</small></button><button class="pn-grande" id="gArquivo">' + ic('download') + '<b>Gravar e salvar no computador</b><small>Não entra no slide. Ao parar, o vídeo vai leve para a pasta Downloads (até uns 15 MB por minuto).</small></button><p class="pn-nota" id="gUltima" hidden></p><label class="pn-op"><input type="checkbox" id="gMic"> Gravar minha voz (microfone)</label>' + (EA.IA ? '<label class="pn-op"><input type="checkbox" id="gCam"> Minha câmera no canto</label><select id="gCamModo" class="pn-sel" hidden><option value="desfoca">Fundo desfocado</option><option value="recorte">Sem fundo (só eu)</option><option value="normal">Fundo normal</option></select>' : '') + '<label class="pn-op"><input type="checkbox" id="gSom"> Gravar o som da aba ou da tela</label><p class="pn-nota">O navegador sempre pergunta o que compartilhar. Dica: 1 minuto de vídeo dá uns 19 MB no HTML exportado.</p>';
      $('#gFoto', c).onclick = function () {
        EA.Gravar.foto().then(function (f) { var id = EA.uid(); EA.projetoAtual.midia[id] = { tipo: 'imagem', nome: 'Captura', dados: f.dados, w: f.w, h: f.h }; insereImagem(id, f.w, f.h); EA.aviso('Captura colocada no slide.') }).catch(erroCaptura);
      };
      function botaoGravar(bt, arquivo, aoFim) {
        var nome = $('b', bt).textContent;
        bt.onclick = function () {
          if (EA.Paineis.gravando) { EA.Paineis.gravando.parar(); return }
          EA.Paineis.gravando = EA.Gravar.gravar({ arquivo: arquivo, mic: $('#gMic', c).checked, somTela: $('#gSom', c).checked, aoComecar: function () { bt.classList.add('gravando'); $('b', bt).textContent = 'Parar a gravação'; barraGravando(true) } }, function (v) {
            EA.Paineis.gravando = null; barraGravando(false);
            bt.classList.remove('gravando'); $('b', bt).textContent = nome;
            aoFim(v);
          }, function (e) { EA.Paineis.gravando = null; barraGravando(false); bt.classList.remove('gravando'); $('b', bt).textContent = nome; erroCaptura(e) }); /* 09/11: falha no meio da gravação desfazia só metade */
        };
      }
      /* minha câmera: ao marcar, abre a janelinha de prévia (fica por cima de tudo e não entra no vídeo) */
      if ($('#gCam', c)) {
        var gc = $('#gCam', c), gm = $('#gCamModo', c);
        gc.checked = EA.Gravar.monitorAberto(); gm.hidden = !gc.checked; gm.value = EA.Gravar.cam.modo;
        gc.onchange = function () {
          gm.hidden = !gc.checked;
          if (gc.checked) EA.Gravar.abreMonitor(function () { var x = $('#gCam'); if (x) { x.checked = false; $('#gCamModo').hidden = true } });
          else EA.Gravar.fechaMonitor();
        };
        gm.onchange = function () { EA.Gravar.cam.modo = gm.value };
      }
      botaoGravar($('#gArquivo', c), true, function (v) {
        var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n }, nome = 'Gravacao ' + d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + 'h' + z(d.getMinutes()) + '.' + v.ext;
        var mb = (v.tamanho / 1048576).toFixed(1), u = $('#gUltima', c);
        if (EA.Paineis.urlGravacao) URL.revokeObjectURL(EA.Paineis.urlGravacao);
        var url = EA.Paineis.urlGravacao = URL.createObjectURL(v.blob), a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
        /* deixa um link: se o download for bloqueado, a gravação não se perde */
        u.hidden = false; u.innerHTML = 'Última gravação: <b>' + EA.esc(nome) + '</b>, ' + mb + ' MB. <a href="' + url + '" download="' + EA.esc(nome) + '">Baixar de novo</a>';
        EA.aviso('Gravação salva em Downloads (' + mb + ' MB).');
      });
      botaoGravar($('#gVideo', c), false, function (v) {
          var id = EA.uid(); EA.projetoAtual.midia[id] = { tipo: 'video', nome: 'Gravação', dados: v.dados, w: v.w, h: v.h };
          var r = Math.min(960 / v.w, 540 / v.h);
          EA.insere(EA.novoObjeto('video', { midia: id }, { w: Math.round(v.w * r), h: Math.round(v.h * r) }));
          EA.aviso('Gravação de ' + Math.round(v.duracao) + ' s no slide (' + (v.tamanho / 1048576).toFixed(1) + ' MB).');
      });
    } },
    sons: { tit: 'Efeitos sonoros', f: function (c) {
      var nota = EA.el('p', 'pn-nota');
      c.appendChild(nota);
      /* 07/11: os antigos de apresentação pareciam de jogo e foram para Game; Presentation tem a família suave (ap: 1, em som.js) */
      var APRES = Object.keys(EA.SONS).filter(function (k) { return EA.SONS[k].ap });
      if (!APRES.length) APRES = ['clique', 'pop', 'surgir', 'sumir', 'certo', 'errado', 'campainha', 'digitar', 'suspense'];   /* navegador com som.js antigo guardado: não deixa a aba vazia */
      var abas = EA.el('div', 'pn-abas', '<button data-t="apres">Presentation</button><button data-t="game">Game</button><button data-t="musicas">Músicas</button>'), g = EA.el('div', 'pn-sons');
      function mostra() {
        var aba = EA.Paineis.abaSom || 'apres', apres = aba === 'apres';
        [].forEach.call(abas.children, function (b) { b.classList.toggle('on', b.dataset.t === aba) });
        g.innerHTML = '';
        g.className = aba === 'musicas' ? 'pn-mus' : 'pn-sons';
        nota.hidden = aba === 'musicas';
        nota.textContent = 'Toque para ouvir. Para usar: selecione um objeto e escolha o som em Animação, ou use "Som ao entrar" no slide.';
        if (aba === 'musicas') { abaMusicas(g, mostra); return }
        Object.keys(EA.SONS).filter(function (k) { return (APRES.indexOf(k) >= 0) === apres }).forEach(function (k) { var b = EA.el('button', '', ic('volume') + EA.SONS[k].nome); b.onclick = function () { EA.Som.tocar(k) }; g.appendChild(b) });
      }
      abas.onclick = function (e) { var b = e.target.closest('[data-t]'); if (b) { EA.Paineis.abaSom = b.dataset.t; mostra() } };
      c.appendChild(abas); c.appendChild(g); mostra();
      EA.Paineis.redesenhaMus = function () { if (g.isConnected && EA.Paineis.abaSom === 'musicas') mostra() };
    } }
  };
  function barraGravando(ver) {
    var b = $('#gravBarra');
    if (!ver) { if (b) b.remove(); return }
    b = EA.el('button', 'grav-barra', '<i></i>Gravando… clique para parar'); b.id = 'gravBarra';
    b.onclick = function () { if (EA.Paineis.gravando) EA.Paineis.gravando.parar() };
    document.body.appendChild(b);
  }
  function erroCaptura(e) {
    if (e && e.name === 'NotAllowedError') EA.aviso('Captura cancelada.');
    else EA.aviso((e && e.message) || 'Não consegui capturar a tela.');
  }
  function insereImagem(id, w, h) {
    var r = Math.min(800 / w, 460 / h, 1);
    EA.insere(EA.novoObjeto('imagem', { midia: id }, { w: Math.round(w * r), h: Math.round(h * r), entra: 'aparecer' }));
  }

  /* ---------- personagens ---------- */
  var ANIM_NOMES = { idle2: 'Parado 2', idle3: 'Parado 3', idle4: 'Parado 4', agacha: 'Agachado', pulo: 'Pulo', pulinho: 'Pulinhos', re: 'De ré', idle: 'Parado', walk: 'Andando', run: 'Correndo', attack1: 'Golpe', attack2: 'Estocada', attack3: 'Magia', shoot: 'Atirar', hurt: 'Dano', death: 'Cair', wave: 'Acenar', cheer: 'Comemorar', sit: 'Sentado', attack: 'Ataque', costas: 'De costas' };
  EA.ANIM_NOMES = ANIM_NOMES;
  var aba = 'pessoas';
  function painelPersonagens(c) {
    c.innerHTML = '<div class="pn-abas"><button data-aba="pessoas">Pessoas</button><button data-aba="bonecos">Bonecos</button><button data-aba="turma">Desenhados</button><button data-aba="games">Games</button></div><div class="pn-aba"></div>';
    function vai(a) {
      aba = a;
      [].forEach.call(c.querySelectorAll('[data-aba]'), function (b) { b.classList.toggle('on', b.dataset.aba === a) });
      var x = $('.pn-aba', c); x.innerHTML = '';
      ({ turma: abaTurma, pessoas: abaPessoas, games: abaGames, bonecos: abaBonecos })[a](x);
    }
    c.onclick = function (e) { var b = e.target.closest('[data-aba]'); if (b) vai(b.dataset.aba) };
    vai(aba);
  }
  /* elenco do RPG: entra no slide como personagem animado; a animação se escolhe no painel Design */
  function abaGames(x) {
    if (!window.JOGOS) { x.appendChild(EA.el('p', 'pn-nada', 'Os personagens de jogo vêm dos pacotes deste PC.')); return }
    x.appendChild(EA.el('p', 'pn-nota', 'Personagens dos jogos. Clique para colocar no slide e escolha a animação no painel Design.'));
    function junta() { var l = []; [].forEach.call(arguments, function (o) { if (o) Object.keys(o).forEach(function (k) { if (!o[k].oculto) l.push(o[k]) }) }); return l }
    [['RPG', junta(JOGOS.rpg.herois, JOGOS.rpg.inimigos)], ['Monstrinhos', junta(JOGOS.mon && JOGOS.mon.monstros)]].forEach(function (par) {
      if (!par[1].length) return;
      x.appendChild(grupo(par[0]));
      var gr = EA.el('div', 'pn-games');
      par[1].forEach(function (lut) {
        var b = EA.el('button', '', '<div><canvas></canvas></div><span>' + EA.esc(lut.nome) + '</span><small>' + Object.keys(lut.anims).length + ' animações</small>');
        var cv = b.querySelector('canvas'), r = Math.min(100 / lut.w, 76 / lut.h);
        cv.width = lut.w; cv.height = lut.h; cv.style.width = lut.w * r + 'px'; cv.style.height = lut.h * r + 'px';
        EA.spriteLutador(cv, lut, 'idle').fixa(0);
        b.onclick = function () {
          var e = lut.esc || 4, w = lut.w * e, h = lut.h * e, f = Math.min(1, 760 / w, 480 / h);
          EA.insere(EA.novoObjeto('lutador', { lut: EA.clona(lut), anim: 'idle' }, { w: Math.round(w * f), h: Math.round(h * f), entra: 'aparecer' }));
        };
        gr.appendChild(b);
      });
      x.appendChild(gr);
    });
  }
  /* ---------- músicas: começar e parar por slide ---------- */
  function abaMusicas(g, redesenha) {
    var p = EA.projetoAtual, s = EA.slideAtual(), n = p.slides.indexOf(s), M = EA.Musica, agora = M.doSlide(p, n);
    var cab = EA.el('div', 'pn-mus-agora', '<b>Slide ' + (n + 1) + '</b><span>' + (s.musica === 'parar' ? 'A música para neste slide.' : s.musica ? 'Começa aqui: ' + EA.esc(M.nome(s.musica)) : agora ? 'Segue tocando: ' + EA.esc(M.nome(agora)) : 'Sem música.') + '</span>');
    g.appendChild(cab);
    /* 09/11: depois de desfazer ou duplicar, o slide guardado aqui já não era o do material: a marca se perdia. Agora pega o slide aberto na hora do clique */
    function marca(v) { var sa = EA.slideAtual(); if (v) sa.musica = v; else delete sa.musica; EA.mudou(); EA.listaSlides(); redesenha() }
    if (s.musica) { var tira = EA.el('button', 'pn-mus-b', ic('arrow-back-up') + 'Tirar esta marca'); tira.onclick = function () { marca('') }; g.appendChild(tira) }
    else if (agora) { var pa = EA.el('button', 'pn-mus-b', ic('music-off') + 'Parar a música neste slide'); pa.onclick = function () { marca('parar') }; g.appendChild(pa) }
    function linhaM(k, nome) {
      var ouvindo = M.tocando() === k, aqui = s.musica === k, l = EA.el('div', 'pn-mus-l' + (agora === k ? ' on' : ''));
      var o = EA.el('button', 'pn-mus-o', ic(ouvindo ? 'player-stop' : 'player-play')); o.title = ouvindo ? 'Parar' : 'Ouvir';
      o.onclick = function () { if (ouvindo) M.parar(); else M.tocar(k); redesenha() };
      var c = EA.el('button', 'pn-mus-c' + (aqui ? ' on' : ''), aqui ? 'Começa aqui' : 'Começar aqui');
      c.onclick = function () { marca(EA.slideAtual().musica === k ? '' : k) };
      l.appendChild(o); l.appendChild(EA.el('span', '', EA.esc(nome))); l.appendChild(c);
      g.appendChild(l);
    }
    function grupoM(titulo, chaves) { if (!chaves.length) return; g.appendChild(grupo(titulo)); chaves.forEach(function (k) { linhaM(k, M.nome(k)) }) }
    var todas = Object.keys(EA.MUSICAS);
    grupoM('Para apresentação', todas.filter(function (k) { return EA.MUSICAS[k].grupo === 'apres' }));
    grupoM('Para jogos', todas.filter(function (k) { return EA.MUSICAS[k].grupo === 'jogo' }));
    grupoM('Minhas músicas', Object.keys(p.midia).filter(function (k) { return p.midia[k].tipo === 'audio' }).map(function (k) { return 'midia:' + k }));
    var vol = EA.el('label', 'in-campo', '<span>Volume da música</span>'), vi = EA.el('input');
    vi.type = 'range'; vi.min = 0; vi.max = 100; vi.value = Math.round((p.musicaVol == null ? .7 : p.musicaVol) * 100);
    vi.oninput = function () { p.musicaVol = +vi.value / 100; M.volume(p.musicaVol) }; vi.onchange = function () { EA.mudou() };
    vol.appendChild(vi); g.appendChild(vol);
    g.appendChild(grupo('Música na apresentação'));
    M.trechos(p).forEach(function (t) {
      var b = EA.el('button', 'pn-mus-t' + (n >= t.de && n <= t.ate ? ' on' : ''), '<b>' + (t.de === t.ate ? 'Slide ' + (t.de + 1) : 'Slides ' + (t.de + 1) + ' a ' + (t.ate + 1)) + '</b><span>' + (t.m ? EA.esc(M.nome(t.m)) : 'Sem música') + '</span>');
      b.onclick = function () { EA.irSlide(t.de) };
      g.appendChild(b);
    });
    g.appendChild(EA.el('p', 'pn-nota', 'Vá ao slide onde a música deve entrar e clique em Começar aqui. Ela segue pelos próximos slides até você começar outra ou parar. Batalhas com música própria tocam a delas e depois a sua volta.'));
  }
  /* os bonecos do Quadro Vivo: tudo muda no painel da direita, inclusive a pose, junta por junta */
  function abaBonecos(x) {
    x.appendChild(EA.el('p', 'pn-nota', 'Mude roupa, cabelo e movimento no painel Design. Lá também dá para posar o boneco à mão.'));
    var g = EA.el('div', 'pn-bonecos');
    window.QV_ELENCO.forEach(function (d) {
      var pr = { nome: d.nome, ch: EA.clona(d.ch), mv: d.mv, mood: d.mood, mm: d.mm };
      var b = EA.el('button', '', '<div>' + EA.Rig.html(pr, d.id) + '</div><span>' + EA.esc(d.nome) + '</span>');
      b.title = d.nome;
      b.onclick = function () { EA.insere(EA.novoObjeto('rig', EA.clona(pr), { w: 210, h: 420, entra: 'subir' })) };
      g.appendChild(b);
    });
    x.appendChild(g);
  }
  function abaTurma(x) {
    x.appendChild(grupo('Turma'));
    var g = EA.el('div', 'pn-turma');
    ['marina', 'rafa', 'pixel'].forEach(function (n) {
      var q = PECAS_BONECO.TURMA[n], b = EA.el('button', '', '<div>' + q.feliz + '</div><span>' + n[0].toUpperCase() + n.slice(1) + '</span>');
      b.onclick = function () { EA.insere(EA.novoObjeto('boneco', { turma: n, quadro: 'base', quadros: q }, { w: 160, h: 250, entra: 'quicar' })) };
      g.appendChild(b);
    });
    x.appendChild(g);
    abaNossos(x);
  }
  /* personagens flat gerados na Ali (ferramentas/promove_desenhados.py). Entram como imagem; a pose troca no Design */
  function abaNossos(x) {
    var l = window.EA_DESENHADOS || [];
    if (!l.length) return;
    x.appendChild(grupo('Nossos personagens'));
    x.appendChild(EA.el('p', 'pn-nota', 'Clique para colocar no slide. A pose muda no painel Design.'));
    var g = EA.el('div', 'pn-pessoas pn-desenhados');
    l.forEach(function (d) {
      var p0 = d.poses[0], b = EA.el('button', '', '<img loading="lazy" alt="" src="' + EA.url(p0.src) + '"><span>' + EA.esc(d.nome) + '</span>');
      b.title = d.nome + ' (' + d.poses.length + ' poses)';
      b.onclick = function () {
        var alt = 420, w = Math.round(p0.w * alt / p0.h);
        EA.insere(EA.novoObjeto('imagem', { src: p0.src, nomeFoto: d.nome, pers: d.id, pose: p0.id }, { w: w, h: alt, entra: 'subir' }));
      };
      g.appendChild(b);
    });
    x.appendChild(g);
  }
  EA.desenhado = function (id) { return (window.EA_DESENHADOS || []).filter(function (d) { return d.id === id })[0] };
  /* fotos geradas na máquina (ferramentas/gerar_pessoas.py). O catálogo cresce enquanto o lote roda: relê ao abrir */
  function relePessoas(pronto) {
    var s = document.createElement('script');
    s.src = 'assets/pessoas/catalogo.js?t=' + Date.now();
    s.onload = s.onerror = function () { s.remove(); pronto() };
    document.head.appendChild(s);
  }
  EA.relePessoas = relePessoas;
  function abaPessoas(x) {
    var g = EA.el('div'), filtro = '';
    function mostra() {
      g.innerHTML = '';
      var l = (window.EA_PESSOAS || []).filter(function (p) { return !filtro || (p.nome + ' ' + p.cat).toLowerCase().indexOf(filtro) >= 0 }), cats = {};
      l.forEach(function (p) { (cats[p.cat] = cats[p.cat] || []).push(p) });
      Object.keys(cats).forEach(function (ct) {
        g.appendChild(grupo(ct));
        var gr = EA.el('div', 'pn-pessoas' + (ct === 'Ambientes' ? ' largo' : ''));
        cats[ct].forEach(function (p) {
          var b = EA.el('button', '', '<img loading="lazy" alt="" src="' + p.src + '"><span>' + EA.esc(p.nome) + '</span>');
          b.onclick = function () {
            var alt = p.recorte ? 560 : 400, r = alt / p.h, w = Math.round(p.w * r);
            EA.insere(EA.novoObjeto('imagem', { src: p.src, nomeFoto: p.nome }, { w: w, h: alt, entra: p.recorte ? 'subir' : 'aparecer' }));
          };
          gr.appendChild(b);
        });
        g.appendChild(gr);
      });
      if (!l.length) g.appendChild(EA.el('p', 'pn-nada', (window.EA_PESSOAS || []).length ? 'Nada com esse nome.' : 'As fotos ainda estão sendo geradas. Acompanhe na barrinha da área de trabalho.'));
    }
    x.appendChild(EA.el('p', 'pn-nota', 'Pessoas inventadas, geradas no seu PC. Na direita dá para deixar em preto e branco ou em tom azul.'));
    x.appendChild(busca('Buscar: atendimento, celular, dúvida…', function (q) { filtro = q; mostra() }));
    x.appendChild(g);
    mostra();
    relePessoas(mostra);
  }
  EA.Paineis = {
    abre: abre, fecha: fecha, gravando: null,
    /* busca a imagem pelo endereço; devolve um arquivo se for GIF (ou qualquer imagem, com qualquer=true), senão null */
    gifDoEndereco: function (url, qualquer) {
      var para = new AbortController(), t = setTimeout(function () { para.abort() }, 8000);
      return fetch(url, { signal: para.signal }).then(function (r) { return r.ok ? r.blob() : null }).then(function (b) {
        clearTimeout(t); if (!b) return null;
        return b.slice(0, 4).text().then(function (cab) {
          var ehGif = cab.indexOf('GIF8') === 0;
          if (!ehGif && !(qualquer && /^image\//.test(b.type))) return null;
          var tipo = ehGif ? 'image/gif' : b.type, nome = (url.split(/[?#]/)[0].split('/').pop() || 'imagem').slice(0, 60);
          return new File([b], ehGif && !/\.gif$/i.test(nome) ? nome + '.gif' : nome, { type: tipo });
        });
      }).catch(function () { clearTimeout(t); return null });
    },
    arquivoMidia: function (f) {
      var tipo = f.type.indexOf('image/') === 0 ? 'imagem' : f.type.indexOf('video/') === 0 ? 'video' : f.type.indexOf('audio/') === 0 ? 'audio' : null;
      if (!tipo) { EA.aviso('Este tipo de arquivo não entra no slide.'); return }
      /* 09/11: formato que o navegador não abre (foto HEIC, vídeo .mov/.mkv) agora avisa, e o arquivo só entra no material
         depois de abrir: antes ficava guardado sem uso, pesando em cada salvamento */
      function falha() { EA.aviso('Não consegui abrir "' + f.name + '": o navegador não lê este formato. Converta para JPG ou PNG (imagem) ou MP4 (vídeo).') }
      EA.Gravar.paraDataUrl(f).then(function (d) {
        var id = EA.uid(), pr = EA.projetoAtual, m = pr.midia;
        if (tipo === 'imagem') { var i = new Image(); i.onload = function () { if (EA.projetoAtual !== pr) return; m[id] = { tipo: tipo, nome: f.name, dados: d, w: i.naturalWidth, h: i.naturalHeight }; insereImagem(id, i.naturalWidth, i.naturalHeight) }; i.onerror = falha; i.src = d }
        else if (tipo === 'video') { var v = document.createElement('video'); v.onloadedmetadata = function () { if (EA.projetoAtual !== pr) return; m[id] = { tipo: tipo, nome: f.name, dados: d }; var r = Math.min(960 / (v.videoWidth || 960), 540 / (v.videoHeight || 540)); EA.insere(EA.novoObjeto('video', { midia: id }, { w: Math.round((v.videoWidth || 960) * r), h: Math.round((v.videoHeight || 540) * r) })) }; v.onerror = falha; v.src = d }
        else { m[id] = { tipo: tipo, nome: f.name, dados: d }; EA.mudou(); EA.Inspetor.mostra(); EA.aviso('Áudio guardado. Escolha ele em "Som" na Animação ou no Slide.') }
      }, function (e) { console.error(e); EA.aviso('Não consegui ler o arquivo "' + f.name + '".') });
    }
  };
})();
