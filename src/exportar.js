/* Exporta o material num único HTML: abre em qualquer navegador, sem internet e sem pedir nada para fora.
   Leva junto só os efeitos, lutadores e mídias que o material usa. */
(function () {
  var EA = window.EA;
  var CODIGO = ['src/nucleo.js', 'src/som.js', 'src/musica.js', 'src/render.js', 'src/mapa.js', 'src/interativos.js', 'src/hf_base.js', 'src/hf_a.js', 'src/hf_b.js', 'src/hf_c.js', 'src/rig_motor.js', 'src/rig.js', 'src/graficos.js', 'src/fxapres.js', 'src/anim.js', 'src/quiz.js', 'src/quiz_jogos.js', 'src/quiz_ia.js', 'src/player.js'];
  var FONTES = { '../assets/fontes/lexend-latin-wght-normal.woff2': 'assets/fontes/lexend-latin-wght-normal.woff2', '../assets/fontes/m5x7.ttf': 'assets/fontes/m5x7.ttf', '../assets/fontes/dancing-script-latin-wght-normal.woff2': 'assets/fontes/dancing-script-latin-wght-normal.woff2' };
  function texto(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error('Não achei ' + u); return r.text() }) }
  function dataUrl(u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error('Não achei ' + u); return r.blob() }).then(function (b) {
      return new Promise(function (ok, erro) { var f = new FileReader(); f.onload = function () { ok(/\.webp$/i.test(u) ? f.result.replace(/^data:[^;]*;/, 'data:image/webp;') : f.result) }; f.onerror = function () { erro(f.error) }; f.readAsDataURL(b) });
    });
  }
  function caminhoLut(l) { return l.src ? null : (l.caminho || ((l.pasta || 'assets/lutadores/') + l.arq)) }

  /* o que este material usa de fato */
  EA.Exportar = {
    inventario: function (p) {
      var arquivos = {}, fx = {}, midia = {}, mapas = {};
      function usaLut(l) { if (!l) return; var c = caminhoLut(l); if (c) arquivos[c] = 1; else midia[l.src.slice(6)] = 1 }
      function usaFx(id) { var m = EA.fxMeta(id); if (m) { fx[id] = m; arquivos['assets/fx/' + m.arq] = 1 } }
      function usaMus(k) {
        if (!k || k === 'parar') return;
        if (k.indexOf('midia:') === 0) { midia[k.slice(6)] = 1; return }
        var d = EA.MUSICAS[k]; if (d && d.arq) arquivos[d.arq] = 1;
      }
      var temTroca = false;
      p.slides.forEach(function (s) {
        if (s.fundo && s.fundo.midia) midia[s.fundo.midia] = 1;
        if (s.overlay && EA.OVERLAYS[s.overlay.tipo] && EA.OVERLAYS[s.overlay.tipo].arq) arquivos[EA.OVERLAYS[s.overlay.tipo].arq] = 1;
        if (s.som && s.som.indexOf('midia:') === 0) midia[s.som.slice(6)] = 1;
        usaMus(s.musica); if (s.quiz) usaMus(EA.Quiz.musicaPadrao(s.quiz));
        if (s.quiz) { EA.Quiz.atualizaCenario(s.quiz); EA.Quiz.fxUsados(s.quiz).forEach(usaFx); EA.Quiz.lutadoresUsados(s.quiz).forEach(usaLut); EA.Quiz.arquivosUsados(s.quiz).forEach(function (c) { arquivos[c] = 1 }) }
        s.objs.forEach(function (o) {
          var q = o.props || {};
          if (q.midia) midia[q.midia] = 1;
          if (q.src) arquivos[q.src] = 1;
          if (q.midia2) midia[q.midia2] = 1;
          if (q.src2) arquivos[q.src2] = 1;
          /* 10/11: fotos de elementos com várias (midia3, src4… e listas de itens com midia/src) */
          (function anda(x, fundo) { if (!x || typeof x !== 'object' || fundo > 4) return; Object.keys(x).forEach(function (k) { var v = x[k];
            if (typeof v === 'string' && /^midia\d*$/.test(k)) midia[v] = 1; else if (typeof v === 'string' && /^src\d*$/.test(k) && v.indexOf('assets/') === 0) arquivos[v] = 1; else if (v && typeof v === 'object' && k !== 'campos') anda(v, fundo + 1) }) })(o.tipo === 'ui' ? q : null, 0);
          if (o.tipo === 'efeito' && q.fx) { fx[q.fx.id] = q.fx; arquivos['assets/fx/' + q.fx.arq] = 1 }
          if (o.tipo === 'lutador') usaLut(q.lut);
          if (EA.Mapa && EA.Mapa.ehMapa(o)) {   /* mapas: só os contornos e bandeiras que podem aparecer */
            var Mp = EA.Mapa, bd = function (k) { arquivos['assets/mapas/bandeiras/' + k.toLowerCase() + '.svg'] = 1 };
            if (Mp.modo(o) === 'pais') { var iso = q.pais || 'BR'; mapas[iso] = 1; if (!Mp.temEstados(iso)) mapas.mundo = 1; if (q.bandeira !== false) bd(iso) }
            else { mapas.mundo = 1; Object.keys(Mp.PAISES).forEach(function (k) { mapas[k] = 1; bd(k) }) }
          }
          (o.kf || []).forEach(function (f) { if (f.som && f.som.indexOf('midia:') === 0) midia[f.som.slice(6)] = 1 });
          if (o.entrada && o.entrada.som && o.entrada.som.indexOf('midia:') === 0) midia[o.entrada.som.slice(6)] = 1;
          if (o.troca && o.troca.por) temTroca = true;
          /* 09/11: o som da troca de objeto também vai junto (antes a troca ficava muda no HTML exportado) */
          if (o.troca && o.troca.som && o.troca.som.indexOf('midia:') === 0) midia[o.troca.som.slice(6)] = 1;
          if (o.acao && o.acao.som && o.acao.som.indexOf('midia:') === 0) midia[o.acao.som.slice(6)] = 1;
        });
      });
      return { mapas: Object.keys(mapas), arquivos: Object.keys(arquivos), fx: Object.keys(fx).map(function (k) { return fx[k] }), midia: Object.keys(midia) };
    },
    gerar: function (p, aviso) {
      var inv = EA.Exportar.inventario(p), embutidos = {};
      aviso = aviso || function () { };
      aviso('Juntando os recursos…');
      var trabalhos = inv.arquivos.map(function (c) { return dataUrl(c).then(function (d) { embutidos[c] = d }) });
      var fontes = {};
      Object.keys(FONTES).forEach(function (u) { trabalhos.push(dataUrl(FONTES[u]).then(function (d) { fontes[u] = d })) });
      var js = '', css = '', mapas = {}, codigo = (inv.mapas.length ? ['assets/mapas/d3-array.min.js', 'assets/mapas/d3-geo.min.js'] : []).concat(CODIGO);
      inv.mapas.forEach(function (k) { trabalhos.push(EA.Mapa.carrega(k).then(function (j) { mapas[k] = j })) });
      trabalhos.push(Promise.all(codigo.map(texto)).then(function (l) { js = l.join('\n') }));
      trabalhos.push(texto('src/palco.css').then(function (t) { css = t }));
      return Promise.all(trabalhos).then(function () {
        Object.keys(fontes).forEach(function (u) { css = css.split('url(' + u + ')').join('url(' + fontes[u] + ')') });
        var saida = EA.clona({ titulo: p.titulo, tema: p.tema, slides: p.slides, musicaVol: p.musicaVol });
        saida.midia = {};
        inv.midia.forEach(function (id) { var m = p.midia[id]; if (m) saida.midia[id] = { tipo: m.tipo, nome: m.nome, dados: m.dados } });
        function js_(o) { return JSON.stringify(o).replace(/</g, '\\u003c') }
        var inicio = "(function(){var P=window.EA_PROJETO;Object.keys(P.midia).forEach(function(k){var m=P.midia[k];if(m.tipo==='video'||m.tipo==='audio'){try{var a=m.dados.split(','),b=atob(a[1]),n=b.length,u=new Uint8Array(n);while(n--)u[n]=b.charCodeAt(n);m.url=URL.createObjectURL(new Blob([u],{type:a[0].split(':')[1].split(';')[0]}))}catch(e){}}});new EA.Player(document.getElementById('app'),P,{})})();";
        var html = '<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src \'none\'; base-uri \'none\'; form-action \'none\'">' +
          '<meta name="robots" content="noindex"><title>' + EA.esc(p.titulo) + '</title><style>html,body{margin:0;height:100%;overflow:hidden;background:#0b1424}\n' + css + '</style></head><body><div id="app"></div>' +
          '<script>window.EA={base:""};window.EA_EMBUTIDOS=' + js_(embutidos) + ';window.EA_FX_META=' + js_(inv.fx) + ';window.EA_MAPAS=' + js_(mapas) + ';window.EA_PROJETO=' + js_(saida) + ';<\/script>\n<script>' + js.replace(/<\/script/gi, '<\\/script') + '\n<\/script>\n<script>' + inicio + '<\/script></body></html>';
        return html;
      }).catch(function (e) {
        /* 09/11: material pesado demais estoura o limite de texto do navegador; o aviso agora diz isso em vez de "Invalid string length" */
        if (e && (e instanceof RangeError || /string length|allocation|memory/i.test(e.message || ''))) throw new Error('o material ficou grande demais para caber num arquivo só (os vídeos e áudios pesam muito). Diminua ou corte os vídeos e tente de novo.');
        throw e;
      });
    }
  };
})();
