/* Mapas (07/11): país com estados para colorir e mapa-múndi plano (o globo saiu: pesado demais).
   Desenho todo em código (d3-geo + contornos do Natural Earth). Os dados carregam só quando usados:
   no site vêm de assets/mapas; no HTML exportado já vêm dentro (window.EA_MAPAS).
   Estados de 239 países (Natural Earth 1:10m simplificado). */
(function () {
  var EA = window.EA, esc = EA.esc;
  var M = EA.Mapa = { dados: window.EA_MAPAS || {}, carregando: {}, reg: {}, pincel: null };
  /* países com estados (arquivo em assets/mapas/paises) e o nome em português — gerado de _baixados/mapas */
  M.PAISES = {"AD":"Andorra","AE":"Emirados Árabes Unidos","AF":"Afeganistão","AG":"Antígua e Barbuda","AI":"Anguilla","AL":"Albânia","AM":"Arménia","AO":"Angola","AR":"Argentina","AS":"Samoa Americana","AT":"Áustria","AU":"Austrália","AW":"Aruba","AX":"Åland","AZ":"Azerbaijão","BA":"Bósnia e Herzegovina","BB":"Barbados","BD":"Bangladesh","BE":"Bélgica","BF":"Burkina Faso","BG":"Bulgária","BH":"Bahrein","BI":"Burundi","BJ":"Benim","BL":"Coletividade de São Bartolomeu","BM":"Bermudas","BN":"Brunei","BO":"Bolívia","BR":"Brasil","BS":"Bahamas","BT":"Butão","BW":"Botsuana","BY":"Bielorrússia","BZ":"Belize","CA":"Canadá","CD":"República Democrática do Congo","CF":"República Centro-Africana","CG":"República do Congo","CH":"Suíça","CI":"Costa do Marfim","CK":"Ilhas Cook","CL":"Chile","CM":"Camarões","CN":"China","CO":"Colômbia","CR":"Costa Rica","CU":"Cuba","CV":"Cabo Verde","CW":"Curaçao","CY":"Chipre","CZ":"Chéquia","DE":"Alemanha","DJ":"Djibouti","DK":"Dinamarca","DM":"Dominica","DO":"República Dominicana","DZ":"Argélia","EC":"Equador","EE":"Estónia","EG":"Egito","EH":"Sara Ocidental","ER":"Eritreia","ES":"Espanha","ET":"Etiópia","FI":"Finlândia","FJ":"Fiji","FK":"Ilhas Malvinas","FM":"Micronésia","FO":"Ilhas Feroe","FR":"França","GA":"Gabão","GB":"Reino Unido","GD":"Granada","GE":"Geórgia","GG":"Guernsey","GH":"Gana","GI":"Gibraltar","GL":"Groenlândia","GM":"Gâmbia","GN":"Guiné","GQ":"Guiné Equatorial","GR":"Grécia","GS":"Ilhas Geórgia do Sul e Sandwich do Sul","GT":"Guatemala","GU":"Guam","GW":"Guiné-Bissau","GY":"Guiana","HK":"Hong Kong","HM":"Ilha Heard e Ilhas McDonald","HN":"Honduras","HR":"Croácia","HT":"Haiti","HU":"Hungria","ID":"Indonésia","IE":"República da Irlanda","IL":"Israel","IM":"Ilha de Man","IN":"Índia","IO":"Território Britânico do Oceano Índico","IQ":"Iraque","IR":"Irão","IS":"Islândia","IT":"Itália","JE":"Jersey","JM":"Jamaica","JO":"Jordânia","JP":"Japão","KE":"Quénia","KG":"Quirguistão","KH":"Camboja","KI":"Kiribati","KM":"Comores","KN":"São Cristóvão e Nevis","KP":"Coreia do Norte","KR":"Coreia do Sul","KW":"Kuwait","KY":"Ilhas Caimão","KZ":"Cazaquistão","LA":"Laos","LB":"Líbano","LC":"Santa Lúcia","LI":"Liechtenstein","LK":"Sri Lanka","LR":"Libéria","LS":"Lesoto","LT":"Lituânia","LU":"Luxemburgo","LV":"Letónia","LY":"Líbia","MA":"Marrocos","MC":"Mónaco","MD":"Moldávia","ME":"Montenegro","MF":"São Martinho","MG":"Madagáscar","MH":"Ilhas Marshall","MK":"Macedónia do Norte","ML":"Mali","MM":"Myanmar","MN":"Mongólia","MO":"Macau","MP":"Ilhas Marianas do Norte","MR":"Mauritânia","MS":"Montserrat","MT":"Malta","MU":"Maurícia","MV":"Maldivas","MW":"Malawi","MX":"México","MY":"Malásia","MZ":"Moçambique","NA":"Namíbia","NC":"Nova Caledónia","NE":"Níger","NF":"Ilha Norfolk","NG":"Nigéria","NI":"Nicarágua","NL":"Países Baixos","NO":"Noruega","NP":"Nepal","NR":"Nauru","NU":"Niue","NZ":"Nova Zelândia","OM":"Omã","PA":"Panamá","PE":"Peru","PF":"Polinésia Francesa","PG":"Papua-Nova Guiné","PH":"Filipinas","PK":"Paquistão","PL":"Polónia","PM":"Saint-Pierre e Miquelon","PN":"Ilhas Pitcairn","PR":"Porto Rico","PS":"Palestina","PT":"Portugal","PW":"Palau","PY":"Paraguai","QA":"Catar","RO":"Roménia","RS":"Sérvia","RU":"Rússia","RW":"Ruanda","SA":"Arábia Saudita","SB":"Ilhas Salomão","SC":"Seychelles","SD":"Sudão","SE":"Suécia","SG":"Singapura","SH":"Santa Helena","SI":"Eslovénia","SK":"Eslováquia","SL":"Serra Leoa","SM":"San Marino","SN":"Senegal","SO":"Somália","SR":"Suriname","SS":"Sudão do Sul","ST":"São Tomé e Príncipe","SV":"El Salvador","SX":"São Martinho","SY":"Síria","SZ":"Essuatíni","TC":"Turks e Caicos","TD":"Chade","TF":"Terras Austrais e Antárticas Francesas","TG":"Togo","TH":"Tailândia","TJ":"Tajiquistão","TK":"Toquelau","TL":"Timor-Leste","TM":"Turquemenistão","TN":"Tunísia","TO":"Tonga","TR":"Turquia","TT":"Trinidad e Tobago","TV":"Tuvalu","TW":"Taiwan","TZ":"Tanzânia","UA":"Ucrânia","UG":"Uganda","UM":"Ilhas Menores dos EUA","US":"Estados Unidos","UY":"Uruguai","UZ":"Uzbequistão","VA":"Vaticano","VC":"São Vicente e Granadinas","VE":"Venezuela","VG":"Ilhas Virgens Britânicas","VI":"Ilhas Virgens Americanas","VN":"Vietname","VU":"Vanuatu","WF":"Wallis e Futuna","WS":"Samoa","XK":"Kosovo","YE":"Iémen","ZA":"África do Sul","ZM":"Zâmbia","ZW":"Zimbábue"};
  var CINZAS = ['#d4d4d4', '#bebebe', '#a9a9a9', '#9b9b9b', '#c9c9c9', '#b3b3b3'];
  function cinza(id) { var h = 0, s = String(id); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return CINZAS[Math.abs(h) % CINZAS.length] }
  M.cinza = cinza;
  function d3ok() { return !!(window.d3 && d3.geoPath) }

  /* ---------- dados ---------- */
  function inverte(g) { if (g.type === 'Polygon') g.coordinates.forEach(function (r) { r.reverse() }); else if (g.type === 'MultiPolygon') g.coordinates.forEach(function (q) { q.forEach(function (r) { r.reverse() }) }) }
  function arruma(j) { if (d3ok()) (j.features || []).forEach(function (f) { if (f.geometry && d3.geoArea(f) > 2 * Math.PI) inverte(f.geometry) }); return j }
  Object.keys(M.dados).forEach(function (k) { arruma(M.dados[k]) });
  M.caminho = function (k) { return k === 'mundo' ? 'assets/mapas/mundo.json' : 'assets/mapas/paises/' + k + '.json' };
  M.temEstados = function (iso) { return !!M.PAISES[iso] };
  M.carrega = function (k) {
    if (M.dados[k]) return Promise.resolve(M.dados[k]);
    if (M.carregando[k]) return M.carregando[k];
    return (M.carregando[k] = fetch(EA.url(M.caminho(k))).then(function (r) { if (!r.ok) throw new Error(k); return r.json() }).then(function (j) {
      M.dados[k] = arruma(j); delete M.carregando[k]; M.renova(); return j;
    }).catch(function () { M.dados[k] = { features: [], falhou: true }; delete M.carregando[k]; M.renova(); return M.dados[k] }));
  };
  M.pega = function (k) { if (M.dados[k]) return M.dados[k]; M.carrega(k); return null };
  M.paisMundo = function (iso) { var m = M.dados.mundo; return m && m.features.filter(function (f) { return f.properties.id === iso })[0] };
  M.nome = function (iso) { var f = M.paisMundo(iso); return M.PAISES[iso] || (f ? f.properties.n : iso) };
  M.bandeira = function (iso) { return EA.url('assets/mapas/bandeiras/' + String(iso).toLowerCase() + '.svg') };
  /* o que já esperava dados e agora tem: desenha de novo no lugar */
  var renovar = null;
  M.renova = function () {
    if (renovar) return;
    renovar = setTimeout(function () {
      renovar = null;
      var trocou = false;
      document.querySelectorAll('.mp-espera').forEach(function (e) { var r = M.reg[e.dataset.oid]; if (!r) return; var h = html(r.p, r.o, r.ctx); if (h.indexOf('mp-espera') < 0) { e.outerHTML = h; trocou = true } });
      if (trocou && EA.listaSlides && document.getElementById('lista') && !document.body.classList.contains('apresentando')) EA.listaSlides();
    }, 30);
  };

  /* ---------- molde de um país ---------- */
  function feicoesPais(iso) {
    var g = M.dados[iso];
    if (g && g.features && g.features.length) return perto(iso, g.features);
    var f = M.paisMundo(iso);
    return f ? [{ type: 'Feature', properties: { id: iso, n: f.properties.n }, geometry: f.geometry }] : [];
  }
  /* tira o que fica longe demais do corpo do país (Guiana Francesa, Ilha de Páscoa…), senão o país vira um pontinho.
     Os EUA não precisam: usam o formato clássico, com Alasca e Havaí em cantinhos. */
  var pertoCache = {};
  function perto(iso, fs) {
    if (iso === 'US' || fs.length < 2) return fs;
    if (pertoCache[iso] && pertoCache[iso].de === fs) return pertoCache[iso].fs;
    /* o corpo do país = o maior grupo de regiões vizinhas (na França a Guiana sozinha é maior que qualquer região, mas o grupo da Europa ganha) */
    var ar = fs.map(function (f) { return d3.geoArea(f) }), ce = fs.map(function (f) { return d3.geoCentroid(f) }), viz = 15 * Math.PI / 180;
    var peso = ce.map(function (c) { return ce.reduce(function (t, d, j) { return t + (d3.geoDistance(c, d) < viz ? ar[j] : 0) }, 0) });
    var mi = peso.indexOf(Math.max.apply(0, peso)), c0 = ce[mi], b = d3.geoBounds(fs[mi]);
    var lg = b[1][0] - b[0][0]; if (lg < 0) lg += 360;
    var lim = Math.max(20, Math.max(lg, b[1][1] - b[0][1]) * 2.5) * Math.PI / 180;
    var r = fs.filter(function (f) { return d3.geoDistance(d3.geoCentroid(f), c0) <= lim });
    pertoCache[iso] = { de: fs, fs: r };
    return r;
  }
  function projecao(iso, fs) {
    if (iso === 'US') return d3.geoAlbersUsa();
    var c = d3.geoCentroid({ type: 'FeatureCollection', features: fs });
    return d3.geoMercator().rotate([-c[0], 0]);   /* centrado no país: quem cruza a linha de data (Rússia, Fiji) não se parte */
  }
  /* svg do país na medida W x H. op: { cores, rotulos, bandeira, titulo, pad } */
  M.svgPais = function (iso, W, H, op) {
    op = op || {};
    var fs = feicoesPais(iso); if (!fs.length) return '<div class="mp-vazio">Mapa indisponível</div>';
    var pad = op.pad == null ? Math.round(Math.min(W, H) * .06) : op.pad, topo = op.titulo ? Math.round(H * .12) : 0;
    var proj = projecao(iso, fs).fitExtent([[pad, pad + topo], [W - pad, H - pad]], { type: 'FeatureCollection', features: fs }), path = d3.geoPath(proj).digits(1);
    var cores = op.cores || {}, s = '<svg class="mp-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
    fs.forEach(function (f) { var id = f.properties.id; s += '<path class="mp-uf" data-uf="' + esc(id) + '" data-n="' + esc(f.properties.n) + '" fill="' + esc(cores[id] || cinza(id)) + '" d="' + path(f) + '"/>' });
    if (op.rotulos) {
      var tam = Math.max(9, Math.round(Math.min(W, H) / 52));
      fs.forEach(function (f) { var a = path.area(f); if (a < tam * tam * 14) return; var c = path.centroid(f); if (isNaN(c[0])) return; s += '<text class="mp-rot" x="' + c[0].toFixed(1) + '" y="' + c[1].toFixed(1) + '" font-size="' + tam + '">' + esc(f.properties.n) + '</text>' });
    }
    s += '</svg>';
    if (op.titulo) s += '<div class="mp-titulo">' + esc(M.nome(iso)) + '</div>';
    if (op.bandeira) s += '<img class="mp-bandeira" alt="" draggable="false" src="' + esc(M.bandeira(iso)) + '" onerror="this.remove()">';
    return s;
  };

  /* ---------- elemento ---------- */
  function espera(o, txt) { return '<div class="ui-mapa mp-espera" data-oid="' + esc(o ? o.id : '') + '"><span>' + (txt || 'Carregando o mapa…') + '</span></div>' }
  function html(p, o, ctx) {
    var modo = p.modo === 'globo' ? 'mundo' : (p.modo || 'pais'), W = Math.round(o ? o.w : 700), H = Math.round(o ? o.h : 600);
    if (o) M.reg[o.id] = { p: p, o: o, ctx: ctx };
    if (!d3ok()) return espera(o, 'Mapa indisponível');
    if (modo === 'pais') {
      var iso = p.pais || 'BR';
      if (!M.pega(iso) || (!M.temEstados(iso) && !M.pega('mundo'))) return espera(o);
      return '<div class="ui-mapa mp-pais" data-oid="' + esc(o ? o.id : '') + '">' + M.svgPais(iso, W, H, { cores: p.cores, rotulos: p.rotulos, bandeira: p.bandeira !== false }) + '</div>';
    }
    var mu = M.pega('mundo'); if (!mu) return espera(o);
    /* mapa-múndi plano */
    var fs = mu.features.filter(function (f) { return f.properties.id !== 'AQ' }), pad = Math.round(Math.min(W, H) * .03);
    var proj = d3.geoNaturalEarth1().fitExtent([[pad, pad], [W - pad, H - pad]], { type: 'FeatureCollection', features: fs }), path = d3.geoPath(proj).digits(1);
    var s = '<svg class="mp-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
    fs.forEach(function (f) { var id = f.properties.id; s += '<path class="mp-uf mp-p" data-iso="' + esc(id) + '" data-n="' + esc(f.properties.n) + '" fill="' + esc((p.cores || {})[id] || cinza(id)) + '" d="' + path(f) + '"/>' });
    return '<div class="ui-mapa mp-mundo" data-oid="' + esc(o ? o.id : '') + '">' + s + '</svg></div>';
  }
  M.html = html;
  EA.ELEMENTOS.mapa = { nome: 'País com estados', grupo: 'mapas', w: 700, h: 600, campos: {}, html: function (p, o, ctx) { return html(Object.assign({ modo: 'pais' }, p), o, ctx) } };
  EA.ELEMENTOS.mundo = { nome: 'Mapa-múndi', grupo: 'mapas', w: 1000, h: 520, campos: {}, html: function (p, o, ctx) { return html(Object.assign({ modo: 'mundo' }, p), o, ctx) } };
  /* o modo escolhido no Design (p.modo) vale mais que o modelo */
  M.ehMapa = function (o) { return o && o.tipo === 'ui' && /^(mapa|mundo|globo)$/.test(o.props.modelo) };
  EA.ELEMENTOS.globo = { nome: 'Mapa-múndi', grupo: 'antigo', w: 1000, h: 520, campos: {}, html: function (p, o, ctx) { return html(Object.assign({}, p, { modo: 'mundo' }), o, ctx) } };
  M.modo = function (o) { var m = o.props.modo || { mapa: 'pais', mundo: 'mundo', globo: 'mundo' }[o.props.modelo]; return m === 'globo' ? 'mundo' : m };

  /* ---------- vida: dica com o nome, clique abre o país ---------- */
  function dica(wrap) { var d = wrap.querySelector(':scope>.mp-dica'); if (!d) { d = EA.el('div', 'mp-dica'); wrap.appendChild(d) } return d }
  function poeDica(wrap, ev, txt) {
    var d = dica(wrap); if (!txt) { d.classList.remove('on'); return }
    var r = wrap.getBoundingClientRect(), k = r.width / wrap.clientWidth || 1;
    d.textContent = txt; d.style.left = (ev.clientX - r.left) / k + 'px'; d.style.top = (ev.clientY - r.top) / k + 'px'; d.classList.add('on');
  }
  function ligaDicas(wrap) {
    wrap.addEventListener('pointermove', function (ev) { var u = ev.target.closest && ev.target.closest('.mp-uf'); poeDica(wrap, ev, u && u.dataset.n) });
    wrap.addEventListener('pointerleave', function () { dica(wrap).classList.remove('on') });
  }
  /* camada do país por cima do mapa: aparece crescendo do lugar clicado; o botão volta */
  M.abreCamada = function (wrap, iso, p, de, aoVoltar) {
    var W = wrap.clientWidth, H = wrap.clientHeight, cam = EA.el('div', 'mp-camada');
    if (de) cam.style.transformOrigin = de[0] + 'px ' + de[1] + 'px';
    wrap.appendChild(cam);
    function mostra() {
      cam.innerHTML = '<div class="mp-camada-c">' + M.svgPais(iso, W, H, { cores: p.cores, titulo: true, bandeira: true, pad: null }) + '</div><button class="mp-volta" type="button">‹ Voltar</button>';
      cam.querySelector('.mp-volta').addEventListener('click', function (ev) { ev.stopPropagation(); fecha() });
      requestAnimationFrame(function () { requestAnimationFrame(function () { cam.classList.add('on') }) });
    }
    function fecha() { cam.classList.remove('on'); setTimeout(function () { cam.remove() }, 450); if (aoVoltar) aoVoltar() }
    cam.addEventListener('pointerdown', function (ev) { ev.stopPropagation() });
    cam.addEventListener('click', function (ev) { ev.stopPropagation(); marca(ev) });
    if (M.temEstados(iso)) M.carrega(iso).then(mostra, mostra); else mostra();
    return cam;
  };

  function marca(ev) { var u = ev.target.closest && ev.target.closest('.mp-uf'); if (!u) return false; u.classList.toggle('mp-marcado'); return true }
  function vive(wrap) {
    if (wrap.dataset.vivo) return; wrap.dataset.vivo = 1;
    var r = M.reg[wrap.dataset.oid]; if (!r) return;
    var p = r.p, emCena = !!wrap.closest('.apresenta');
    if (!emCena) return;
    ligaDicas(wrap);
    /* país com estados: clicar num estado deixa ele destacado; clicar de novo tira (e não passa o slide) */
    if (wrap.classList.contains('mp-pais')) wrap.addEventListener('click', function (ev) { if (marca(ev)) ev.stopPropagation() });
    if (wrap.classList.contains('mp-mundo')) {
      wrap.addEventListener('click', function (ev) {
        var u = ev.target.closest('.mp-p'); if (!u || wrap.querySelector('.mp-camada')) return;
        ev.stopPropagation();
        var b = wrap.getBoundingClientRect(), k = b.width / wrap.clientWidth || 1;
        M.abreCamada(wrap, u.dataset.iso, p, [(ev.clientX - b.left) / k, (ev.clientY - b.top) / k]);
      });
    }
  }

  /* qualquer mapa que entra na tela (palco, miniatura, apresentação) ganha vida sozinho */
  function procura(n) {
    if (n.nodeType !== 1) return;
    if (n.matches('.ui-mapa:not(.mp-espera)')) vive(n);
    n.querySelectorAll && n.querySelectorAll('.ui-mapa:not(.mp-espera)').forEach(vive);
  }
  function comeca() {
    new MutationObserver(function (l) { l.forEach(function (m) { m.addedNodes.forEach(procura) }) }).observe(document.body, { childList: true, subtree: true });
    procura(document.body);
  }
  if (document.body) comeca(); else document.addEventListener('DOMContentLoaded', comeca);

  /* ---------- Design: pintar os estados clicando no palco ---------- */
  document.addEventListener('pointerdown', function (ev) {
    var pc = M.pincel; if (!pc) return;
    var u = ev.target.closest && ev.target.closest('#palco .mp-uf'), ob = u && u.closest('.ob');
    if (!u || !ob || ob.dataset.id !== pc.oid) return;
    var o = EA.objAtual && EA.objAtual(); if (!o || o.id !== pc.oid) return;
    ev.stopPropagation(); ev.preventDefault();
    var id = u.dataset.uf || u.dataset.iso, cs = o.props.cores = o.props.cores || {};
    if (pc.borracha) delete cs[id]; else cs[id] = pc.cor;
    u.setAttribute('fill', cs[id] || cinza(id));
    EA.mudou(); EA.miniatura && EA.miniatura();
  }, true);
})();
