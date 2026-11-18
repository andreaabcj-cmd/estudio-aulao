/* Exporta o slide como PNG em alta resolução, igual ao que está no palco, sem biblioteca: o palco vira um SVG com tudo embutido, e o SVG é desenhado num canvas maior. */
(function () {
  var EA = window.EA, ESCALA = 3, VAZIO = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  function comoData(url, guarda) {
    if (/^data:/.test(url)) return Promise.resolve(url);
    /* 09/11: um arquivo que não dá para buscar (imagem de outro site sem permissão) fica de fora; antes derrubava o PNG inteiro */
    if (!guarda[url]) guarda[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error(url); return r.blob() }).then(EA.Gravar.paraDataUrl).catch(function (e) { console.warn('imagem do palco: ficou de fora', url, e); return VAZIO });
    return guarda[url];
  }
  /* troca todo url(...) do texto pelo próprio arquivo embutido */
  function embuteUrls(txt, base, guarda) {
    var re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g, achados = {}, m;
    while ((m = re.exec(txt))) if (!/^(data:|#)/.test(m[2])) achados[m[2]] = 1;
    return Promise.all(Object.keys(achados).map(function (u) { return comoData(new URL(u, base).href, guarda).then(function (d) { achados[u] = d }) })).then(function () {
      return txt.replace(re, function (t, q, u) { return typeof achados[u] === 'string' ? 'url("' + achados[u] + '")' : t });
    });
  }
  /* animação dentro do SVG recomeçaria do zero: cada uma fica parada no ponto em que está na tela */
  function congela(orig, copia) {
    var os = [orig].concat([].slice.call(orig.querySelectorAll('*'))), cs = [copia].concat([].slice.call(copia.querySelectorAll('*')));
    os.forEach(function (o, k) {
      var an = o.getAnimations ? o.getAnimations() : []; if (!an.length) return;
      var est = getComputedStyle(o);
      an.forEach(function (a) {
        if (!a.effect || !a.effect.getKeyframes) return;
        a.effect.getKeyframes().forEach(function (f) {
          Object.keys(f).forEach(function (p) {
            if (/^(offset|computedOffset|easing|composite)$/.test(p)) return;
            var nome = p === 'cssFloat' ? 'float' : p.replace(/[A-Z]/g, function (l) { return '-' + l.toLowerCase() });
            cs[k].style.setProperty(nome, est.getPropertyValue(nome));
          });
        });
      });
    });
  }
  /* 17/11: o SVG não guarda rolagem: quem está rolado (ex.: conversa comprida) vai com o conteúdo deslocado */
  function fixaRolagem(orig, copia) {
    var os = orig.querySelectorAll('*'), cs = copia.querySelectorAll('*');
    [].forEach.call(os, function (o, k) {
      if (!o.scrollTop && !o.scrollLeft) return;
      var c = cs[k]; if (!c) return;
      c.style.overflow = 'hidden';
      [].forEach.call(c.children, function (f) { f.style.translate = (-o.scrollLeft) + 'px ' + (-o.scrollTop) + 'px' });
    });
  }
  /* canvas e vídeo não passam para o SVG: entram como a foto do quadro que está na tela */
  function fixaQuadros(orig, copia) {
    ['canvas', 'video'].forEach(function (tag) {
      var os = orig.querySelectorAll(tag), cs = copia.querySelectorAll(tag);
      [].forEach.call(os, function (o, k) {
        var c = cs[k], src = '';
        try {
          if (tag === 'canvas') src = o.toDataURL('image/png');
          else if (o.videoWidth) { var f = document.createElement('canvas'); f.width = o.videoWidth; f.height = o.videoHeight; f.getContext('2d').drawImage(o, 0, 0); src = f.toDataURL('image/png') }
        } catch (e) { }
        var est = getComputedStyle(o), i = document.createElement(src ? 'img' : 'div');
        i.className = c.className;
        if (src) i.setAttribute('src', src);
        /* regras do CSS feitas para canvas não valem para a foto: ela leva todo o estilo calculado, com posição e tamanho */
        for (var n = 0; n < est.length; n++) i.style.setProperty(est[n], est.getPropertyValue(est[n]));
        c.parentNode.replaceChild(i, c);
      });
    });
  }
  function embuteArquivos(copia, guarda) {
    var trabalhos = [];
    [].forEach.call(copia.querySelectorAll('img'), function (i) {
      var s = i.getAttribute('src'); if (s) trabalhos.push(comoData(new URL(s, location.href).href, guarda).then(function (d) { i.setAttribute('src', d) }));
    });
    [].forEach.call(copia.querySelectorAll('image'), function (i) {
      var s = i.getAttribute('href') || i.getAttribute('xlink:href'); if (s) trabalhos.push(comoData(new URL(s, location.href).href, guarda).then(function (d) { i.setAttribute('href', d) }));
    });
    [copia].concat([].slice.call(copia.querySelectorAll('[style*="url("]'))).forEach(function (e) {
      var s = e.getAttribute('style'); if (s && s.indexOf('url(') >= 0) trabalhos.push(embuteUrls(s, location.href, guarda).then(function (t) { e.setAttribute('style', t) }));
    });
    return Promise.all(trabalhos);
  }
  /* 16/11: op = { escala, cache: {} reaproveitado entre fotos (arquivos e CSS já embutidos), canvas: true devolve o canvas } — usado pelo Exportar animado */
  EA.imagemDoPalco = function (palco, dim, op) {
    op = op || {}; var cache = op.cache || {}, ESC = op.escala || ESCALA;
    var guarda = cache.guarda = cache.guarda || {}, folha = [].find.call(document.styleSheets, function (f) { return f.href && /palco\.css/.test(f.href) });
    var copia = palco.cloneNode(true);
    congela(palco, copia);
    fixaRolagem(palco, copia);
    fixaQuadros(palco, copia);
    copia.style.transform = 'none'; copia.style.position = 'relative'; copia.style.left = '0'; copia.style.top = '0'; copia.style.boxShadow = 'none';
    /* 09/11: sem o arquivo palco.css (folha renomeada ou embutida na página) usa as regras que a página já tem, em vez de quebrar */
    /* 16/11: os interativos novos põem o estilo deles num <style> da página (EA.HF.css): sem isso a peça saía como manchas pretas.
       Cada parte resolve os url() pela sua base (palco.css pela pasta dele; os <style> da página pela página) */
    function estilosDaPagina() { return embuteUrls([].map.call(document.querySelectorAll('style'), function (s) { return s.textContent }).join('\n'), location.href, guarda) }
    var lerCss = cache.css || (folha ? fetch(folha.href).then(function (r) { return r.text() }).then(function (t) {
      return Promise.all([embuteUrls(t, folha.href, guarda), estilosDaPagina()]).then(function (p) { return p.join('\n') });
    }) : embuteUrls([].map.call(document.styleSheets, function (f) {
      try { return [].map.call(f.cssRules, function (q) { return q.cssText }).join('\n') } catch (e) { return '' }
    }).join('\n'), location.href, guarda));
    /* no cache só fica o que deu certo: uma falha não vale para os quadros seguintes */
    if (op.cache && !cache.css) cache.css = lerCss.catch(function (e) { cache.css = null; cache.estXml = null; throw e });
    return Promise.all([lerCss, embuteArquivos(copia, guarda)]).then(function (r) {
      var XS = new XMLSerializer(), est = document.createElement('style');
      /* o estilo (grande, com os arquivos embutidos) vira texto uma vez só por exportação */
      var estXml = op.cache && cache.estXml;
      if (!estXml) { est.textContent = r[0] + '*,*::before,*::after{animation:none!important;transition:none!important}'; estXml = XS.serializeToString(est); if (op.cache) cache.estXml = estXml }
      /* 16/11: foto de um quadro da apresentação: vale o que só aparece (ou some) na apresentação, como os números de edição */
      var abre = op.apresenta ? '<div xmlns="http://www.w3.org/1999/xhtml" class="apresenta" style="position:relative;display:block;inset:auto;background:none;z-index:auto">' : '<div xmlns="http://www.w3.org/1999/xhtml">';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.round(dim.w * ESC) + '" height="' + Math.round(dim.h * ESC) + '" viewBox="0 0 ' + dim.w + ' ' + dim.h + '"><foreignObject x="0" y="0" width="' + dim.w + '" height="' + dim.h + '">' + abre + estXml + XS.serializeToString(copia) + '</div></foreignObject></svg>';
      return EA.Gravar.paraDataUrl(new Blob([svg], { type: 'image/svg+xml' }));
    }).then(function (url) {
      var im = new Image(); im.src = url;
      return im.decode().then(function () {
        var c = document.createElement('canvas'); c.width = Math.round(dim.w * ESC); c.height = Math.round(dim.h * ESC);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        if (op.canvas) return c;
        return new Promise(function (ok, erro) { c.toBlob(function (b) { if (b) ok({ blob: b, w: c.width, h: c.height }); else erro(new Error('sem imagem')) }, 'image/png') });
      });
    });
  };
})();
