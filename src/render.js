/* Desenha os objetos de um slide. Usado no editor, nas miniaturas e no HTML exportado. */
(function () {
  var EA = window.EA, esc = EA.esc;

  /* ---------- elementos prontos de interface (modelo do Aulão). {campos} vira texto editável ---------- */
  function c(campos, k) { return '<span data-campo="' + k + '">' + (campos[k] == null ? '' : campos[k]) + '</span>' }
  var ICO = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg>',
    seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6l-6 6"/></svg>',
    alerta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7 -3l-8 -14a2 2 0 0 0 -3.4 0"/></svg>'
  };
  EA.ICO = ICO;
  /* traços dos elementos que vieram do Quadro Vivo */
  function tr(d, cor, tam, larg) { return '<svg viewBox="0 0 24 24" width="' + tam + '" height="' + tam + '" fill="none" stroke="' + cor + '" stroke-width="' + (larg || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>' }
  var TR = { heart: '<path d="M12 20S3 14.5 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 14.5 12 20 12 20z"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', send: '<path d="M21 3L3 11l7 3 3 7z"/><path d="M10 14L21 3"/>', bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 18l6-6 4 4 3-3 5 5"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>' };
  /* foto de um lugar do elemento: sem escolha, mostra o modelo cinza. k = '' é a principal, '2' a do perfil */
  /* a imagem inteira, posta em qualquer lugar da moldura: o que sai dela fica escondido */
  EA.corteHtml = function (c, dentro) { return '<div class="ob-corte-i" style="left:' + c.x * 100 + '%;top:' + c.y * 100 + '%;width:' + c.w * 100 + '%;height:' + c.h * 100 + '%">' + dentro + '</div>' };
  function urlFoto(p, k, ctx) { var m = p['midia' + k], s = p['src' + k]; return m ? EA.urlMidia((ctx && ctx.projeto) || EA.projetoAtual, m) : s ? EA.url(s) : '' }
  EA.urlFoto = urlFoto;
  /* 10/11: propriedades que são número vão direto para o estilo; um arquivo .aulao malfeito podia pôr código ali. Só número passa */
  var NUMS = { tamTexto: 1, n: 1, vel: 1, tempo: 1, valor: 1, pos: 1, zoom: 1, fx: 1, fy: 1, x: 1, y: 1, larguraCaixa: 1, raio: 1, altura: 1, espaco: 1, peso: 1, tam: 1 };
  function numeros(q, fundo) {
    if (!q || typeof q !== 'object' || fundo > 3) return;
    Object.keys(q).forEach(function (k) { var v = q[k];
      if ((fundo ? /^(zoom|fx|fy|x|y)\d*$/.test(k) : NUMS[k] || /^(zoom|fx|fy)\d+$/.test(k)) && v != null && typeof v !== 'number') { var f = parseFloat(v); if (isFinite(f)) q[k] = f; else delete q[k] }
      else if (v && typeof v === 'object' && k !== 'campos') numeros(v, fundo + 1) });
  }
  EA.numeros = numeros;
  function foto(p, ctx) {
    var u = urlFoto(p, '', ctx);
    if (u && p.corte) return EA.corteHtml(p.corte, '<img class="ob-preenche" draggable="false" alt="" src="' + esc(u) + '" style="object-fit:fill">');
    return u ? '<img draggable="false" alt="" src="' + esc(u) + '" style="' + EA.posFoto(p).css + '">' : '<span class="ui-foto-vazia">' + tr(TR.image, '#94a3b8', '30%', 1.6) + '</span>';
  }
  /* ---------- 07/11: conversa em 3 estilos — pessoal (messenger), WhatsApp e suporte ----------
     props: estilo, msgs [{de:'a'|'b', t, h}], umaUma (mensagens entram uma por uma). a = a outra pessoa, b = você */
  EA.CHAT_ESTILOS = [['pessoal', 'Pessoal (Messenger)'], ['whats', 'Estilo WhatsApp'], ['suporte', 'Suporte']];
  EA.CHAT_PADRAO = [
    { de: 'a', t: 'Oi! Quero anunciar minha lojinha, mas a Meta me pede um tal de “portfólio empresarial”. É uma loja nova? Vou perder meu Instagram? 😳', h: '17:41' },
    { de: 'b', t: 'Oi, Marina! Calma, não é loja nova e você não perde nada. O portfólio é como uma pasta da sua empresa.', h: '17:42' },
    { de: 'b', t: 'Lá dentro ficam a sua Página, o Instagram, a conta de anúncios e as pessoas que te ajudam.', h: '17:43' }
  ];
  var CI = {
    fone: '<path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"/>',
    video: '<path d="M15 10l4.55 -2.28a1 1 0 0 1 1.45 .9v6.76a1 1 0 0 1 -1.45 .9l-4.55 -2.28v-4z"/><rect x="3" y="6" width="12" height="12" rx="2"/>',
    menos: '<path d="M5 12h14"/>', x: '<path d="M18 6l-12 12M6 6l12 12"/>',
    mic: '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M8 21h8M12 17v4"/>',
    foto: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 18l6-6 4 4 3-3 5 5"/>',
    fig: '<path d="M20 12l-2 .5a6 6 0 0 1 -6.5 -6.5l.5 -2l8 8"/><path d="M20 12a8 8 0 1 1 -8 -8"/>',
    gif: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 10h-2v4h2v-2M13 10v4M16 14v-4h2M16 12h1.5"/>',
    sorriso: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0"/>',
    volta: '<path d="M5 12h14M5 12l6 6M5 12l6 -6"/>', pontos: '<path d="M12 5h.01M12 12h.01M12 19h.01" stroke-width="3"/>',
    clipe: '<path d="M15 7l-6.5 6.5a1.5 1.5 0 0 0 3 3l6.5 -6.5a3 3 0 0 0 -6 -6l-6.5 6.5a4.5 4.5 0 0 0 9 9l6.5 -6.5"/>',
    camera: '<path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2"/><circle cx="12" cy="13" r="3"/>',
    vistos: '<path d="M2 12l5 5l10 -10M12 15l2 2l8 -8"/>'
  };
  function rosto(p, k, ctx, cls) {
    var u = urlFoto(p, k, ctx), cor = k ? ['#a9c2f5', '#3c6fd6'] : ['#f8cfa4', '#e88a2c'];
    if (u) return '<span class="' + cls + '">' + (p['corte' + k] ? EA.corteHtml(p['corte' + k], '<img class="ob-preenche" draggable="false" alt="" src="' + esc(u) + '" style="object-fit:fill">') : '<img draggable="false" alt="" src="' + esc(u) + '">') + '</span>';
    return '<span class="' + cls + '" style="background:linear-gradient(160deg,' + cor[0] + ',' + cor[1] + ')"><svg viewBox="0 0 24 24"><circle cx="12" cy="9.5" r="4.2" fill="' + cor[1] + '"/><path d="M3.5 22c.8-4.6 4.2-7 8.5-7s7.7 2.4 8.5 7z" fill="' + cor[1] + '"/></svg></span>';
  }
  function chatHtml(p, o, ctx) {
    var es = p.estilo || 'pessoal', ms = p.msgs || EA.CHAT_PADRAO, cor = p.cor, nA = c(p.campos, 'a');
    var corpo = ms.map(function (m, i) {
      var eu = m.de === 'b', t = esc(m.t || '').replace(/\n/g, '<br>'), at = p.umaUma ? ' style="animation-delay:' + (i * .7 + .3).toFixed(2) + 's"' : '';
      var fo = rosto(p, eu ? '2' : '', ctx, 'ch-av');
      if (es === 'whats') return '<div class="ch-m' + (eu ? ' eu' : '') + '"' + at + '><div class="ch-b">' + t + '<small>' + esc(m.h || '') + (eu ? '<svg viewBox="0 0 24 24" class="ch-v">' + CI.vistos + '</svg>' : '') + '</small></div></div>';
      if (es === 'suporte') return '<div class="ch-m' + (eu ? ' eu' : '') + '"' + at + '>' + fo + '<div><div class="ch-b"' + (eu && cor ? ' style="background:' + esc(cor) + '"' : '') + '>' + t + '</div><small>' + (eu ? p.campos.b : p.campos.a) + (m.h ? ' · ' + esc(m.h) : '') + '</small></div></div>';
      return '<div class="ch-m' + (eu ? ' eu' : '') + '"' + at + '>' + fo + '<div class="ch-b">' + t + '</div></div>';
    }).join('');
    var ico = function (k, cr) { return '<svg viewBox="0 0 24 24" fill="none" stroke="' + (cr || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + CI[k] + '</svg>' };
    var um = (p.umaUma ? ' ch-uma' : '') + '" style="font-size:' + (p.tamTexto || 16) + 'px';
    if (es === 'whats') {
      var vd = cor || '#008069';
      return '<div class="ui-chat ch-whats' + um + '"><div class="ch-top" style="background:' + esc(vd) + '">' + ico('volta') + rosto(p, '', ctx, 'ch-av') + '<div class="ch-nome"><b>' + nA + '</b><small>online</small></div>' + ico('video') + ico('fone') + ico('pontos') + '</div><div class="ch-corpo">' + corpo + '</div><div class="ch-pe"><div class="ch-campo">' + ico('sorriso', '#54656f') + '<span>Mensagem</span>' + ico('clipe', '#54656f') + ico('camera', '#54656f') + '</div><i class="ch-mic" style="background:' + esc(vd) + '">' + ico('mic', '#fff') + '</i></div></div>';
    }
    if (es === 'suporte') return '<div class="ui-chat ch-suporte' + um + '"><div class="ch-corpo">' + corpo + '</div></div>';
    var rx = cor || '#9b5cf6';
    return '<div class="ui-chat ch-pessoal' + um + '"><div class="ch-top">' + rosto(p, '', ctx, 'ch-av ch-av-g') + '<b class="ch-nome">' + nA + '</b><span class="ch-acoes">' + ico('fone', '#e0245e') + ico('video', '#e0245e') + ico('menos', '#e0245e') + ico('x', '#e0245e') + '</span></div><div class="ch-corpo">' + corpo + '</div><div class="ch-pe">' + ico('mic', rx) + ico('foto', rx) + ico('fig', rx) + ico('gif', rx) + '<div class="ch-campo"><span>Aa</span>' + ico('sorriso', rx) + '</div></div></div>';
  }
  /* 07/11: partes do código marcadas no Design acendem ao passar o mouse na apresentação; a explicação aparece embaixo */
  EA.codigoTexto = function (h) { return String(h == null ? '' : h).replace(/<span class="ui-cod-real"[^>]*>|<\/span>/g, '').replace(/<br>/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&') };
  function codigoRealce(h, rs) {
    var t = EA.codigoTexto(h), marca = [];
    rs.forEach(function (q, n) { var a = String(q.t), i = t.indexOf(a); while (a && i >= 0) { if (!marca.some(function (m) { return i < m[1] && i + a.length > m[0] })) marca.push([i, i + a.length, n]); i = t.indexOf(a, i + a.length) } });
    marca.sort(function (x, y) { return x[0] - y[0] });
    var out = '', at = 0;
    marca.forEach(function (m) { out += esc(t.slice(at, m[0])) + '<span class="ui-cod-real" data-dica="' + esc(rs[m[2]].d || '') + '">' + esc(t.slice(m[0], m[1])) + '</span>'; at = m[1] });
    return out + esc(t.slice(at));
  }
  function luz(h) { var n = parseInt(String(h).slice(1), 16) || 0; return (.299 * (n >> 16 & 255) + .587 * (n >> 8 & 255) + .114 * (n & 255)) / 255 }
  function estiloQv(p) { return 'style="' + (p.fundoUi ? 'background:' + esc(p.fundoUi) + ';' : '') + (p.corTexto ? 'color:' + esc(p.corTexto) + ';' : '') + 'font-size:' + (p.tamTexto || 20) + 'px"' }
  EA.ELEMENTOS = {
    pilula: { nome: 'Etiqueta', w: 220, h: 36, campos: { t: '01 · Capítulo' }, html: function (p) { return '<div class="ui-pilula">' + c(p.campos, 't') + '</div>' } },
    botao: { nome: 'Botão', w: 260, h: 60, campos: { t: 'Experimentar →' }, html: function (p) { return '<div class="ui-botao">' + c(p.campos, 't') + '</div>' } },
    botao2: { nome: 'Botão claro', w: 220, h: 56, campos: { t: 'Saiba mais' }, html: function (p) { return '<div class="ui-botao claro">' + c(p.campos, 't') + '</div>' } },
    cartao: { nome: 'Cartão', w: 340, h: 220, campos: { i: '01', t: 'Título do cartão', d: 'Um texto curto que explica a ideia deste cartão.' }, html: function (p) { return '<div class="ui-cartao"><div class="ui-cartao-i">' + c(p.campos, 'i') + '</div><h3>' + c(p.campos, 't') + '</h3><p>' + c(p.campos, 'd') + '</p></div>' } },
    palco: { nome: 'Palco do Aulão', w: 1100, h: 400, campos: { rot: 'MODELO DIDÁTICO' }, html: function (p) { return '<div class="ui-palco"><span class="ui-palco-rot">' + c(p.campos, 'rot') + '</span></div>' } },
    heroi: { nome: 'Faixa de destaque', w: 1040, h: 340, campos: {}, html: function () { return '<div class="ui-heroi"></div>' } },
    orbita: { nome: 'Órbita animada', w: 320, h: 320, campos: { m: 'P', a: 'PageView', b: 'AddToCart', d: 'Purchase' }, html: function (p) { return '<div class="ui-orbita"><i class="o1"></i><i class="o2"></i><div class="ui-orbita-m">' + c(p.campos, 'm') + '</div><span class="s1">' + c(p.campos, 'a') + '</span><span class="s2">' + c(p.campos, 'b') + '</span><span class="s3">' + c(p.campos, 'd') + '</span></div>' } },
    no: { nome: 'Etapa de fluxo', w: 220, h: 170, campos: { t: 'Etapa', d: 'o que acontece' }, html: function (p) { return '<div class="ui-no"><i class="ui-pulso"></i><b>' + c(p.campos, 't') + '</b><span>' + c(p.campos, 'd') + '</span></div>' } },
    pacote: { nome: 'Pacote viajando', w: 520, h: 44, campos: { t: 'evento' }, html: function (p) { return '<div class="ui-trilha"><div class="ui-pacote">' + c(p.campos, 't') + '</div></div>' } },
    seta: { nome: 'Seta animada', w: 90, h: 44, campos: {}, html: function () { return '<div class="ui-seta">' + ICO.seta + '</div>' } },
    aviso: { nome: 'Aviso', w: 620, h: 100, campos: { t: 'Atenção', d: 'Escreva aqui o que a pessoa não pode esquecer.' }, html: function (p) { return '<div class="ui-aviso"><i>' + ICO.alerta + '</i><div><b>' + c(p.campos, 't') + '</b><p>' + c(p.campos, 'd') + '</p></div></div>' } },
    certo: { nome: 'Confirmação', w: 620, h: 90, campos: { t: 'Tudo certo', d: 'Mensagem de sucesso.' }, html: function (p) { return '<div class="ui-aviso ok"><i>' + ICO.ok + '</i><div><b>' + c(p.campos, 't') + '</b><p>' + c(p.campos, 'd') + '</p></div></div>' } },
    ponto: { nome: 'Ponto-chave', w: 340, h: 110, campos: { n: '01', d: 'Uma frase curta com o que levar desta cena.' }, html: function (p) { return '<div class="ui-ponto"><b>' + c(p.campos, 'n') + '</b><p>' + c(p.campos, 'd') + '</p></div>' } },
    codigo: { nome: 'Janela de código', w: 680, h: 340, campos: { tit: 'código', t: "&lt;script&gt;\n  fbq('track', 'Purchase', {\n    value: 299,\n    currency: 'BRL'\n  });\n&lt;/script&gt;" }, html: function (p) { var r = (p.realces || []).filter(function (q) { return q.t }); return '<div class="ui-codigo"' + (p.cor ? ' style="--real:' + esc(p.cor) + '"' : '') + '><div class="ui-codigo-t"><i></i><i></i><i></i>' + c(p.campos, 'tit') + '</div><pre>' + (r.length ? '<span data-campo="t">' + codigoRealce(p.campos.t, r) + '</span>' : c(p.campos, 't')) + '</pre>' + (r.length ? '<div class="ui-cod-dica"></div>' : '') + '</div>' } },
    navegador: { nome: 'Site', grupo: 'telas', w: 640, h: 400, raio: 12, fotos: [['', 'Imagem da página']], corRot: 'Cor da barra', corPad: '#e5e7eb', cores: [['fundoUi', 'Fundo da página', '#ffffff']], campos: { url: 'www.meusite.com', t: '' }, html: function (p, o, ctx) {
      var bar = /^#/.test(p.cor || '') ? p.cor : '#e5e7eb', clara = luz(bar) > .5, tem = urlFoto(p, '', ctx), texto = p.campos.t && String(p.campos.t).replace(/<[^>]+>/g, '').trim();
      return '<div class="ui-qv ui-site" ' + estiloQv(p) + '><div class="ui-site-b" style="background:' + esc(p.cor || '#e5e7eb') + '"><i style="background:#ef4444"></i><i style="background:#f59e0b"></i><i style="background:#22c55e"></i><div class="ui-site-e" style="background:' + (clara ? '#fff' : 'rgba(255,255,255,.14)') + ';color:' + (clara ? '#475569' : '#e5e7eb') + '">' + tr(TR.lock, clara ? '#64748b' : '#e5e7eb', 16, 2.2) + c(p.campos, 'url') + '</div></div><div class="ui-site-c">' + (tem ? '<div class="ui-foto">' + foto(p, ctx) + '</div>' : '') + '<div class="ui-site-t"' + (texto ? '' : ' data-vazio') + '>' + c(p.campos, 't') + '</div></div></div>';
    } },
    cartaofoto: { nome: 'Cartão com foto', grupo: 'telas', w: 280, h: 330, raio: 14, fotos: [['', 'Foto do cartão']], tamTexto: 1, cores: [['fundoUi', 'Fundo', '#ffffff'], ['corTexto', 'Cor do título', '#0f172a']], campos: { t: 'Título do cartão', d: 'Uma descrição curta para explicar o item.', bt: 'Ver mais' }, html: function (p, o, ctx) {
      return '<div class="ui-qv ui-cf" ' + estiloQv(p) + '><div class="ui-foto ui-cf-f">' + foto(p, ctx) + '</div><div class="ui-cf-c"><b>' + c(p.campos, 't') + '</b><p>' + c(p.campos, 'd') + '</p><span class="ui-cf-b">' + c(p.campos, 'bt') + '</span></div></div>';
    } },
    post: { nome: 'Post de rede social', grupo: 'telas', w: 340, h: 470, raio: 14, fotos: [['', 'Foto do post'], ['2', 'Foto do perfil']], tamTexto: 1, corRot: 'Cor do coração', corPad: '#ef4444', cores: [['fundoUi', 'Fundo', '#ffffff'], ['corTexto', 'Cor do texto', '#0f172a']], campos: { nome: 'Nome do perfil', sub: 'agora · público', t: 'Texto da publicação, escreva aqui.' }, html: function (p, o, ctx) {
      var u2 = urlFoto(p, '2', ctx), cz = p.corTexto || '#334155';
      return '<div class="ui-qv ui-post" ' + estiloQv(p) + '><div class="ui-post-t"><span class="ui-post-a">' + (u2 ? (p.corte2 ? EA.corteHtml(p.corte2, '<img class="ob-preenche" draggable="false" alt="" src="' + esc(u2) + '" style="object-fit:fill">') : '<img draggable="false" alt="" src="' + esc(u2) + '">') : tr(TR.user, '#fff', 20)) + '</span><div><b>' + c(p.campos, 'nome') + '</b><small>' + c(p.campos, 'sub') + '</small></div></div><div class="ui-foto ui-post-f">' + foto(p, ctx) + '</div><div class="ui-post-i">' + tr(TR.heart, p.cor || '#ef4444', 26) + tr(TR.chat, cz, 26) + tr(TR.send, cz, 26) + '<i></i>' + tr(TR.bookmark, cz, 26) + '</div><p>' + c(p.campos, 't') + '</p></div>';
    } },
    carregando: { nome: 'Carregando', grupo: 'telas', w: 120, h: 120, razao: 1, corRot: 'Cor do giro', corPad: '#2563eb', cores: [['corTrilho', 'Cor do trilho', '#e2e8f0'], ['fundoUi', 'Fundo', '#ffffff']], campos: {}, html: function (p) {
      var fd = p.fundoUi || '#fff';
      return '<svg class="ob-preenche ui-carrega" viewBox="0 0 56 56"><circle cx="28" cy="28" r="22" fill="' + esc(fd) + '"/><circle cx="28" cy="28" r="22" fill="#000" opacity=".06"/><circle cx="28" cy="28" r="14" fill="none" stroke="' + esc(p.corTrilho || '#e2e8f0') + '" stroke-width="6"/><g class="ui-carrega-g"><path d="M28 14a14 14 0 0 1 14 14" fill="none" stroke="' + esc(p.cor || '#2563eb') + '" stroke-width="6" stroke-linecap="round"/></g></svg>';
    } },
    chat: { nome: 'Conversa', grupo: 'telas', w: 460, h: 520, fotos: [['', 'Foto da outra pessoa'], ['2', 'Sua foto']], corRot: 'Cor de destaque', tamTexto: 1, campos: { a: 'Marina', b: 'Rafa' }, html: chatHtml },
    celular: { nome: 'Celular', grupo: 'telas', w: 270, h: 540, campos: { t: 'Conteúdo da tela' }, html: function (p) { return '<div class="ui-cel"><div class="ui-cel-t"><i></i></div><div class="ui-cel-c">' + c(p.campos, 't') + '</div></div>' } },
    dialogo: { nome: 'Caixa de diálogo', w: 1232, h: 180, campos: { t: 'Escreva aqui o que o personagem vai dizer.' }, html: function (p) { return '<div class="ui-dialogo">' + c(p.campos, 't') + '</div>' } },
    balao: { nome: 'Balão de fala', w: 380, h: 130, campos: { t: 'Olá! Vamos aprender isso juntos?' }, html: function (p, o) { var W = o ? o.w : 380, H = o ? o.h : 130; return '<div class="ui-balao2"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + EA.balaoPath(W, H, p.cauda) + '"/></svg>' + c(p.campos, 't') + '</div>' } },
    barra: { nome: 'Barra animada', w: 480, h: 70, campos: { t: 'Progresso', v: '72%' }, html: function (p) { var n = parseFloat(String(p.campos.v).replace(/[^\d.]/g, '')) || 0; return '<div class="ui-barra"><div class="ui-barra-t">' + c(p.campos, 't') + '<span data-campo="v" data-conta>' + p.campos.v + '</span></div><div class="ui-barra-f"><i style="--v:' + EA.limita(n, 0, 100) + '%"></i></div></div>' } },
    numero: { nome: 'Número grande', w: 280, h: 150, campos: { n: '96%', d: 'descrição do número' }, html: function (p) { return '<div class="ui-numero"><b><span data-campo="n" data-conta>' + p.campos.n + '</span></b><span>' + c(p.campos, 'd') + '</span></div>' } },
    chave: { nome: 'Interruptor', w: 330, h: 60, campos: { t: 'Opção ligada' }, html: function (p) { return '<div class="ui-chave' + (p.ligado === false ? ' off' : '') + '"><i></i>' + c(p.campos, 't') + '</div>' } },
    campo: { nome: 'Campo de formulário', w: 420, h: 86, campos: { t: 'Nome da loja', v: 'Minha loja' }, html: function (p) { return '<div class="ui-campo"><label>' + c(p.campos, 't') + '</label><div>' + c(p.campos, 'v') + '</div></div>' } }
  };

  /* balão: corpo e rabinho são um desenho só. cauda = { x, y: ponta em frações do balão; b: largura da base; pos: lugar da base na borda (fração) } */
  EA.CAUDA_PADRAO = { x: .12, y: 1.24, b: 26, pos: null };
  EA.balaoLado = function (W, H, q) {
    var tx = q.x * W, ty = q.y * H, d = { o: -tx, l: tx - W, n: -ty, s: ty - H }, lado = '', mx = 0;
    Object.keys(d).forEach(function (k) { if (d[k] > mx) { mx = d[k]; lado = k } });
    if (!lado) return null;
    var hor = lado === 'n' || lado === 's', tam = hor ? W : H, r = Math.min(18, W / 2, H / 2), b = EA.limita(q.b || 26, 6, Math.max(6, tam - r * 2)), ini = r + b / 2, fim = tam - r - b / 2;
    var c = EA.limita(q.pos != null ? q.pos * tam : (hor ? tx : ty), ini, Math.max(ini, fim));
    return { lado: lado, c: c, b: b, tx: tx, ty: ty, r: r };
  };
  EA.balaoPath = function (W, H, cauda) {
    var q = cauda || EA.CAUDA_PADRAO, a = q.sem ? null : EA.balaoLado(W, H, q), r = Math.min(18, W / 2, H / 2), f = function (n) { return Math.round(n * 10) / 10 };
    function ponta(l) {
      if (!a || a.lado !== l) return '';
      var p = ' L' + f(a.tx) + ' ' + f(a.ty) + ' ';
      if (l === 'n') return ' L' + f(a.c - a.b / 2) + ' 0' + p + 'L' + f(a.c + a.b / 2) + ' 0';
      if (l === 'l') return ' L' + W + ' ' + f(a.c - a.b / 2) + p + 'L' + W + ' ' + f(a.c + a.b / 2);
      if (l === 's') return ' L' + f(a.c + a.b / 2) + ' ' + H + p + 'L' + f(a.c - a.b / 2) + ' ' + H;
      return ' L0 ' + f(a.c + a.b / 2) + p + 'L0 ' + f(a.c - a.b / 2);
    }
    return 'M' + r + ' 0' + ponta('n') + ' L' + (W - r) + ' 0 A' + r + ' ' + r + ' 0 0 1 ' + W + ' ' + r + ponta('l') + ' L' + W + ' ' + (H - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (W - r) + ' ' + H + ponta('s') + ' L' + r + ' ' + H + ' A' + r + ' ' + r + ' 0 0 1 0 ' + (H - r) + ponta('o') + ' L0 ' + r + ' A' + r + ' ' + r + ' 0 0 1 ' + r + ' 0 Z';
  };

  /* formas e máscaras usam esta mesma tabela: o contorno de uma é exatamente o da outra (caixa 100 x 100) */
  function pontosCoracao() {
    var l = [], i, t;
    for (i = 0; i < 48; i++) { t = i / 48 * Math.PI * 2; l.push([Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]) }
    var ys = l.map(function (q) { return q[1] }), a = Math.min.apply(0, ys), b = Math.max.apply(0, ys);
    return l.map(function (q) { return [Math.round((50 + 48 * q[0]) * 10) / 10, Math.round((2 + 96 * (q[1] - a) / (b - a)) * 10) / 10] });
  }
  EA.FORMA_PONTOS = {
    triangulo: [[50, 2], [98, 98], [2, 98]],
    estrela: [[50, 2], [63, 36], [98, 38], [71, 60], [80, 96], [50, 76], [20, 96], [29, 60], [2, 38], [37, 36]],
    losango: [[50, 2], [98, 50], [50, 98], [2, 50]],
    seta: [[2, 34], [62, 34], [62, 8], [98, 50], [62, 92], [62, 66], [2, 66]],
    hexagono: [[25, 4], [75, 4], [98, 50], [75, 96], [25, 96], [2, 50]],
    diagonal: [[34, 0], [100, 0], [66, 100], [0, 100]],
    canto: [[0, 0], [100, 0], [0, 100]],
    octogono: [[30, 2], [70, 2], [98, 30], [98, 70], [70, 98], [30, 98], [2, 70], [2, 30]],
    coracao: pontosCoracao(),
    escudo: [[50, 2], [94, 14], [94, 52], [81, 76], [50, 98], [19, 76], [6, 52], [6, 14]],
    etiqueta: [[2, 2], [80, 2], [98, 50], [80, 98], [2, 98]]
  };
  /* k, nome, largura e altura ao nascer, e se a máscara pede caixa quadrada na primeira vez */
  EA.FORMAS = [['ret', 'Retângulo', 320, 200], ['circulo', 'Círculo', 220, 220, 1], ['pilula', 'Pílula', 320, 80], ['triangulo', 'Triângulo', 220, 200, 1], ['estrela', 'Estrela', 220, 220, 1], ['losango', 'Losango', 220, 220, 1], ['hexagono', 'Hexágono', 240, 220, 1], ['octogono', 'Octógono', 220, 220, 1], ['coracao', 'Coração', 220, 220, 1], ['escudo', 'Escudo', 220, 220, 1], ['seta', 'Seta', 300, 140], ['etiqueta', 'Etiqueta', 300, 140], ['linha', 'Linha', 480, 6], ['diagonal', 'Diagonal', 300, 420], ['canto', 'Canto', 240, 240, 1]];
  function caminhoForma(k) { var q = EA.FORMA_PONTOS[k]; return q ? 'M' + q.map(function (a) { return a[0] + ' ' + a[1] }).join(' L') + ' Z' : '' }
  /* máscaras: recortam a foto na forma; dentro dela a foto pode andar (fx, fy em %) e aproximar (zoom) */
  EA.MASCARAS = {};
  EA.FORMAS.forEach(function (f) {
    var k = f[0], q = EA.FORMA_PONTOS[k], c;
    if (k === 'linha') return;
    if (q) c = 'polygon(' + q.map(function (a) { return a[0] + '% ' + a[1] + '%' }).join(',') + ')';
    else c = k === 'circulo' ? 'ellipse(50% 50%)' : k === 'pilula' ? 'inset(0 round 99px)' : 'inset(0 round 14px)';
    EA.MASCARAS[k] = { nome: f[1], c: c, quadrada: !!f[4], ic: k === 'pilula' ? 'inset(24% 0 round 999px)' : k === 'ret' ? 'inset(14% 0 round 4px)' : c };
  });
  /* nomes usados na primeira versão das máscaras */
  Object.defineProperty(EA.MASCARAS, 'redondo', { value: EA.MASCARAS.ret, enumerable: false });
  Object.defineProperty(EA.MASCARAS, 'onda', { value: EA.MASCARAS.etiqueta, enumerable: false });
  EA.clipMascara = function (p) {
    var m = EA.MASCARAS[p.masc];
    if (!m) return '';
    return m === EA.MASCARAS.ret && p.raioMasc != null ? 'inset(0 round ' + p.raioMasc + 'px)' : m.c;
  };
  EA.posFoto = function (p) {
    var x = p.fx == null ? 50 : p.fx, y = p.fy == null ? (p.topo ? 0 : 50) : p.fy, z = p.zoom || 1;
    return { x: x, y: y, z: z, css: 'object-fit:cover;object-position:' + x + '% ' + y + '%;transform-origin:' + x + '% ' + y + '%;transform:scale(' + z + ');' };
  };

  /* desenhos simples */
  var FILTROS = { pb: 'grayscale(1) contrast(1.06)', azul: 'grayscale(1) sepia(1) hue-rotate(172deg) saturate(2.6) brightness(.96)', claro: 'brightness(1.08) saturate(.9)' };
  function forma(p) {
    var cor = p.cor || 'var(--azul)', bor = p.borda ? 'stroke="' + (p.corBorda || 'var(--tinta)') + '" stroke-width="' + p.borda + '" vector-effect="non-scaling-stroke"' : '';
    var d = caminhoForma(p.forma), gr = p.grad;
    if (d) {
      var defs = '', tinta = cor;
      if (gr) {
        /* mesma direção do degradê em CSS: 0 aponta para cima, 90 para a direita */
        var gid = 'g' + EA.uid(), an = (gr.ang == null ? 135 : gr.ang) * Math.PI / 180, sx = Math.sin(an) / 2, sy = Math.cos(an) / 2;
        defs = '<defs><linearGradient id="' + gid + '" x1="' + (.5 - sx) + '" y1="' + (.5 + sy) + '" x2="' + (.5 + sx) + '" y2="' + (.5 - sy) + '"><stop offset="0" style="stop-color:' + cor + '"/><stop offset="1" style="stop-color:' + gr.cor2 + '"/></linearGradient></defs>';
        tinta = 'url(#' + gid + ')';
      }
      return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="ob-preenche">' + defs + '<path d="' + d + '" fill="' + tinta + '" ' + bor + '/></svg>';
    }
    var raio = p.forma === 'circulo' ? '50%' : p.forma === 'linha' ? '99px' : (p.raio == null ? 14 : p.raio) + 'px';
    var sombra = p.sombra ? 'box-shadow:0 8px 25px rgba(28,43,51,.14);' : '';
    var fundo = gr ? 'linear-gradient(' + (gr.ang == null ? 135 : gr.ang) + 'deg,' + cor + ',' + gr.cor2 + ')' : cor;
    return '<div class="ob-preenche" style="background:' + fundo + ';border-radius:' + raio + ';' + (p.borda ? 'border:' + p.borda + 'px solid ' + (p.corBorda || 'var(--tinta)') + ';' : '') + sombra + '"></div>';
  }

  /* ---------- GIF animado (08/11): repetir sempre ou tocar uma vez ----------
     Quem manda nas voltas é um bloquinho dentro do arquivo (NETSCAPE2.0): sem ele o GIF toca uma vez; com 0, repete sempre.
     Aqui o arquivo é reescrito com ou sem esse bloquinho (nada é desenhado de novo, a imagem fica igual). */
  EA.ehGif = function (u) { return typeof u === 'string' && /^data:image\/gif/i.test(u) };
  var cacheGif = {};
  function gifVoltas(bin, sempre) {
    var b = [], i, n = bin.length;
    if (n < 13 || bin.slice(0, 3) !== 'GIF') return null;
    var pos = 13, pk = bin.charCodeAt(10);
    if (pk & 0x80) pos += 3 * (1 << ((pk & 7) + 1));
    var ini = pos, out = bin.slice(0, ini), resto;
    /* tira o bloquinho de voltas, se houver, antes da primeira imagem */
    while (pos < n) {
      var c = bin.charCodeAt(pos);
      if (c === 0x2C || c === 0x3B) break;
      if (c !== 0x21) return null;
      var rot = bin.charCodeAt(pos + 1), q = pos + 2, eNet = rot === 0xFF && bin.substr(q + 1, 11) === 'NETSCAPE2.0';
      while (q < n) { var t = bin.charCodeAt(q); q += 1 + t; if (!t) break }
      if (!eNet) out += bin.slice(pos, q);
      pos = q;
    }
    resto = bin.slice(pos);
    if (sempre) out = out.slice(0, ini) + '\x21\xFF\x0BNETSCAPE2.0\x03\x01\x00\x00\x00' + out.slice(ini);
    return out + resto;
  }
  EA.gifSrc = function (u, modo) {
    var k = (modo === 'uma' ? 'u' : 's') + u.length + u.slice(-40);
    if (cacheGif[k]) return cacheGif[k];
    try {
      var vg = u.indexOf(','), bin = atob(u.slice(vg + 1)), novo = gifVoltas(bin, modo !== 'uma');
      return cacheGif[k] = novo ? 'data:image/gif;base64,' + btoa(novo) : u;
    } catch (e) { return u }
  };
  /* recomeça a animação: o navegador só recomeça com um endereço novo */
  /* 09/11: sem fetch (o HTML exportado não deixa pedir nada, nem endereço data:): o GIF vira Blob aqui mesmo, uma vez só por GIF.
     Os endereços provisórios são soltos quando a imagem recomeça de novo ou sai da tela (antes iam se acumulando na memória) */
  var blobsGif = {}, vivosGif = [];
  function blobDeData(u) {
    var k = u.length + u.slice(-40);
    if (blobsGif[k]) return blobsGif[k];
    var vg = u.indexOf(','), cab = u.slice(5, vg), bin = /;base64$/i.test(cab) ? atob(u.slice(vg + 1)) : decodeURIComponent(u.slice(vg + 1)), n = bin.length, b = new Uint8Array(n);
    while (n--) b[n] = bin.charCodeAt(n);
    return blobsGif[k] = new Blob([b], { type: cab.split(';')[0] || 'image/gif' });
  }
  EA.reiniciaGif = function (img) {
    vivosGif = vivosGif.filter(function (x) { if (x.img.isConnected) return true; URL.revokeObjectURL(x.u); return false });
    if (!img || !img.src || !img.isConnected) return;
    var orig = img.dataset.gifOrig || img.src;
    img.dataset.gifOrig = orig;
    function poe(b) {
      if (!img.isConnected) return;
      var velho = img.dataset.gifBlob, u = URL.createObjectURL(b);
      img.dataset.gifBlob = u; img.src = u; vivosGif.push({ img: img, u: u });
      if (velho) { vivosGif = vivosGif.filter(function (x) { return x.u !== velho }); URL.revokeObjectURL(velho) }
    }
    if (orig.indexOf('data:') === 0) { try { poe(blobDeData(orig)) } catch (e) { } return }
    fetch(orig).then(function (r) { return r.blob() }).then(poe).catch(function () { });
  };

  /* legenda do vídeo (09/11): vira uma trilha de legenda embutida (vai junto no HTML exportado) */
  function tempoVtt(x) { var h = Math.floor(x / 3600), m = Math.floor(x / 60) % 60, q = (x % 60).toFixed(3); return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (q < 10 ? '0' : '') + q }
  EA.vttDe = function (l) { return 'WEBVTT\n\n' + l.cues.map(function (c) { return tempoVtt(c.i) + ' --> ' + tempoVtt(Math.max(c.f, c.i + .3)) + '\n' + String(c.t).replace(/-->/g, '→') }).join('\n\n') + '\n' };
  EA.trilhaLegenda = function (l) {
    var b64 = btoa(unescape(encodeURIComponent(EA.vttDe(l))));
    return '<track kind="subtitles" default srclang="' + esc(l.idioma || 'pt') + '" label="Legenda" src="data:text/vtt;base64,' + b64 + '">';
  };

  /* vídeo cortado no editor de vídeo (09/11): ao tocar, pula os trechos tirados */
  if (!EA.__cortesLigados) {
    EA.__cortesLigados = true;
    var pulaCorte = function (v, dePlay) {
      var c; try { c = JSON.parse(v.dataset.cortes || '[]') } catch (e) { return }
      var t = v.currentTime, d = v.duration || 1e9;
      /* 09/11: corte salvo antes que tira o vídeo inteiro: ignora em vez de ficar pulando */
      if (isFinite(v.duration) && c.reduce(function (s, x) { return s + Math.max(0, x[1] - x[0]) }, 0) >= d - .1) return;
      for (var i = 0; i < c.length; i++) if (t >= c[i][0] - .02 && t < c[i][1]) {
        if (c[i][1] >= d - .05) {
          var ini = c[0][0] <= .05 ? c[0][1] : 0;
          if (v.loop) v.currentTime = ini;
          /* 09/11: parado no corte do fim e apertaram tocar: recomeça do início (antes pausava de novo na hora) */
          else if (dePlay && ini < c[i][0] - .05) v.currentTime = ini;
          /* 09/11: só para e volta um tiquinho se estava tocando; já parado, não mexe mais (ficava reposicionando sem parar) */
          else if (!v.paused) { v.pause(); v.currentTime = Math.max(0, c[i][0] - .01) }
        }
        else v.currentTime = c[i][1];
        return;
      }
    };
    var vigia = function (v) {
      if (v.__vigia) return; v.__vigia = true;
      var passo = function () { if (v.paused || !v.isConnected) { v.__vigia = false; return } pulaCorte(v); if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(passo); else requestAnimationFrame(passo) };
      passo();
    };
    document.addEventListener('play', function (e) { var v = e.target; if (v.tagName === 'VIDEO' && v.dataset.cortes) { pulaCorte(v, true); vigia(v) } }, true);
    document.addEventListener('timeupdate', function (e) { var v = e.target; if (v.tagName === 'VIDEO' && v.dataset.cortes) pulaCorte(v) }, true);
    document.addEventListener('loadedmetadata', function (e) { var v = e.target; if (v.tagName === 'VIDEO' && v.dataset.cortes && v.currentTime < .05) pulaCorte(v) }, true);
  }

  /* conteúdo de um objeto (sem posição) */
  var CORTE_INTEIRO = { boneco: 1, lutador: 1, rig: 1, desenho: 1 };
  EA.conteudo = function (o, ctx) {
    var h = conteudoCru(o, ctx), c = o.props && o.props.corte;
    if (o.tipo === 'imagem' && /src="data:image\/gif/.test(h)) h = h.replace(/<img /g, '<img data-gif ');
    return c && CORTE_INTEIRO[o.tipo] ? '<div class="ob-preenche ob-corte">' + EA.corteHtml(c, h) + '</div>' : h;
  };
  function conteudoCru(o, ctx) {
    var p = o.props, d;
    ctx = ctx || {};
    switch (o.tipo) {
      case 'texto':
        return '<div class="ob-texto" data-campo="html" style="font-size:' + (p.tam || 28) + 'px;font-weight:' + (p.peso || 400) + ';color:' + (p.cor || 'var(--tinta)') + ';text-align:' + (p.alinha || 'left') + ';line-height:' + (p.altura || 1.3) + ';letter-spacing:' + (p.espaco || 0) + 'em;font-family:' + (p.familia ? String(p.familia).replace(/[^\w\s\u00C0-\u024F'.,\-]/g, '') + ',' : '') + (EA.FONTES[p.fonte] || EA.FONTES.aulao) +
          /* vindos do PowerPoint: texto no meio/embaixo da caixa e caixa que não quebra linha */
          (p.vert ? ';display:flex;flex-direction:column;justify-content:' + (p.vert === 'meio' ? 'center' : 'flex-end') : '') + (p.nowrap ? ';white-space:pre' : '') + '">' + (p.html == null ? '' : p.html) + '</div>';
      case 'forma': return forma(p);
      case 'icone':
        return '<svg class="ob-preenche ob-icone" viewBox="0 0 24 24" fill="none" stroke="' + (p.cor || 'var(--azul)') + '" stroke-width="' + (p.traco || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + (p.svg || '') + '</svg>';
      case 'imagem':
        d = p.midia ? EA.urlMidia(ctx.projeto || EA.projetoAtual, p.midia) : EA.url(p.src || '');
        if (EA.ehGif(d)) d = EA.gifSrc(d, p.gif);
        if (p.corte) {
          var imC = EA.corteHtml(p.corte, '<img class="ob-preenche" draggable="false" alt="" src="' + esc(d) + '" style="object-fit:fill;' + (FILTROS[p.filtro] ? 'filter:' + FILTROS[p.filtro] + ';' : '') + (p.pixel ? 'image-rendering:pixelated;' : '') + '">');
          if (EA.MASCARAS[p.masc]) return '<div class="ob-preenche ob-masc" style="clip-path:' + EA.clipMascara(p) + (p.fundoMasc ? ';background:' + esc(p.fundoMasc) : '') + '">' + imC + '</div>';
          return '<div class="ob-preenche ob-corte" style="border-radius:' + (p.raio || 0) + 'px">' + imC + '</div>';
        }
        if (EA.MASCARAS[p.masc]) return '<div class="ob-preenche ob-masc" style="clip-path:' + EA.clipMascara(p) + (p.fundoMasc ? ';background:' + esc(p.fundoMasc) : '') + '"><img class="ob-preenche" draggable="false" alt="" src="' + esc(d) + '" style="' + EA.posFoto(p).css + (FILTROS[p.filtro] ? 'filter:' + FILTROS[p.filtro] + ';' : '') + (p.pixel ? 'image-rendering:pixelated;' : '') + '"></div>';
        return '<img class="ob-preenche" draggable="false" alt="" src="' + esc(d) + '" style="object-fit:' + (p.ajuste || 'contain') + ';' + (p.topo ? 'object-position:center top;' : '') + (FILTROS[p.filtro] ? 'filter:' + FILTROS[p.filtro] + ';' : '') + 'border-radius:' + (p.raio || 0) + 'px;' + (p.pixel ? 'image-rendering:pixelated;' : '') + '">';
      case 'video':
        d = EA.urlMidia(ctx.projeto || EA.projetoAtual, p.midia);
        return '<video class="ob-preenche"' + (p.cortes && p.cortes.length ? ' data-cortes="' + esc(JSON.stringify(p.cortes)) + '"' : '') + ' src="' + esc(d) + '" style="object-fit:' + (p.ajuste || 'contain') + ';border-radius:' + (p.raio || 0) + 'px" playsinline ' + (ctx.estatico ? '' : (p.controles === false ? '' : 'controls ')) + (p.mudo ? 'muted ' : '') + (p.repetir ? 'loop ' : '') + (p.legenda && p.legenda.cues && p.legenda.cues.length && p.legenda.mostrar !== false ? ' crossorigin="anonymous">' + EA.trilhaLegenda(p.legenda) + '</video>' : '></video>');
      case 'camera':
        /* 09/11: câmera ao vivo. Só existe dentro do Estúdio (no HTML baixado não há o módulo de IA, e a peça some) */
        if (!EA.IA) return '';
        return '<div class="ob-preenche ob-cam' + (p.forma === 'ret' ? '' : ' redonda') + '"' + (p.forma === 'ret' ? ' style="border-radius:' + (p.raio == null ? 18 : p.raio) + 'px"' : '') + '><div class="ob-cam-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg><span>Câmera ao vivo</span></div><canvas class="ob-cam-cv"></canvas></div>';
      case 'boneco':
        return '<div class="ob-preenche ob-boneco" data-quadro="' + esc(p.quadro || 'base') + '">' + ((p.quadros && (p.quadros[p.quadro || 'base'] || p.quadros.base)) || '') + '</div>';
      case 'lutador': case 'efeito':
        return '<canvas class="ob-preenche ob-sprite"' + (p.vira ? ' style="transform:scaleX(-1)"' : '') + '></canvas>';
      case 'ui':
        /* materiais feitos entre 07 e 08/11: o ponto clicável também se chamava 'ponto'; ele é pequeno (nasce com 46 px) e o Ponto-chave é largo */
        if (p.modelo === 'ponto' && p.campos && p.campos.t != null && o.w < 200) p.modelo = 'pontoclique';
        numeros(p, 0);
        var el = EA.ELEMENTOS[p.modelo];
        /* 13/11: interativos novos: som opcional (desligado por padrão) */
        return el ? '<div class="ob-preenche ob-ui"' + (el.grupo === 'hf' ? (p.som ? ' data-hf-som="1"' : '') : '') + ' style="' + (p.cor ? '--azul:' + esc(p.cor) + ';' : '') + (el.raio != null ? 'border-radius:' + (p.raio == null ? el.raio : p.raio) + 'px;' : '') + '">' + el.html(p, o, ctx) + '</div>' : '';
      case 'desenho':
        return '<svg class="ob-preenche ob-desenho" viewBox="0 0 ' + p.vw + ' ' + p.vh + '"' + (p.cor || p.sombra ? ' style="' + (p.cor ? '--c:' + esc(p.cor) + ';' : '') + (p.sombra ? 'filter:drop-shadow(0 6px 12px rgba(28,43,51,.18))' : '') + '"' : '') + '>' + (p.svg || '') + '</svg>';
      case 'rig':
        return EA.Rig.html(p, o.id);
      case 'apres':
        return EA.conteudoApres ? EA.conteudoApres(o, ctx) : '';
    }
    return '';
  }
  EA.FONTES = { aulao: "'Segoe UI',Arial,sans-serif", lexend: "'Lexend','Segoe UI',sans-serif", mono: "Consolas,'Courier New',monospace", pixel: "'m5x7',monospace", caligrafia: "'Caligrafia','Segoe Script',cursive" };

  /* põe vida nos sprites depois que o objeto está na tela */
  EA.ligaSprites = function (raiz, o, ctx) {
    ctx = ctx || {};
    if (o.tipo === 'rig') { if (!ctx.estatico) EA.Rig.liga(raiz, o); return null }
    var canvas = raiz.querySelector('.ob-sprite'); if (!canvas) return null;
    var p = o.props, s;
    if (o.tipo === 'efeito' && p.fx) {
      s = EA.spriteFx(canvas, p.fx, { vel: p.vel || 1, loop: ctx.estatico ? true : (p.repetir == null ? p.fx.loop : p.repetir) });
      if (ctx.estatico) { s.fixa(Math.floor(p.fx.n * .45)); return s }
      if (!s.cfg.loop) s.aoFim = function () { canvas.style.opacity = p.ficar ? 1 : 0 };
    } else if (o.tipo === 'lutador' && p.lut) {
      s = EA.spriteLutador(canvas, p.lut, p.anim || 'idle', null, p.dir);
      if (ctx.estatico) { s.fixa(0); return s }
      s.cfg.loop = p.repetir !== false;
      canvas.sprite = s;
    }
    return s;
  };

  /* elemento do objeto: .ob (lugar) > .ob-i (entrada) > .ob-l (repetição) > conteúdo */
  EA.criaObjeto = function (o, ctx) {
    var e = EA.el('div', 'ob ob-' + o.tipo);
    e.dataset.id = o.id;
    EA.geometria(e, o);
    var i = EA.el('div', 'ob-i'), l = EA.el('div', 'ob-l', EA.conteudo(o, ctx));
    i.appendChild(l); e.appendChild(i);
    if (o.props && o.props.vira && !EA.viraProprio(o)) e.classList.add('virado');
    return e;
  };
  /* virar para o outro lado vale para tudo. Sprites de jogo, efeitos e bonecos viram por dentro; o resto espelha o conteúdo (.virado no palco.css) */
  EA.viraProprio = function (o) { return o.tipo === 'efeito' || o.tipo === 'rig' || (o.tipo === 'lutador' && !(o.props.lut && o.props.lut.doll)) };
  /* durante a apresentação (marcas da linha do tempo): v = como deve ficar agora */
  EA.aplicaVira = function (e, o, v) {
    var c = e.querySelector('.ob-sprite');
    if (c && EA.viraProprio(o)) c.style.transform = v ? 'scaleX(-1)' : '';
    else e.classList.toggle('virado', o.tipo === 'rig' ? !!v !== !!(o.props && o.props.vira) : !!v);
  };
  EA.geometria = function (e, g) {
    e.style.left = g.x + 'px'; e.style.top = g.y + 'px'; e.style.width = g.w + 'px'; e.style.height = g.h + 'px';
    e.style.transform = g.rot ? 'rotate(' + g.rot + 'deg)' : ''; e.style.opacity = g.op == null ? 1 : g.op;
  };

  EA.aplicaOrient = function (palco, s) { var d = EA.dimSlide(s); palco.classList.toggle('vertical', d.h > d.w) };
  /* fundo de um slide */
  EA.pintaFundo = function (el, s, projeto) {
    var f = s.fundo || {};
    el.style.background = '';
    if (f.tipo === 'cor' && f.cor) el.style.background = f.cor;
    else if (f.tipo === 'gradiente') el.style.background = 'linear-gradient(' + (f.ang || 135) + 'deg,' + (f.cor || '#f7fbff') + ',' + (f.cor2 || '#dcebff') + ')';
    else if (f.tipo === 'imagem' && f.midia && f.giro && f.giro.midia === f.midia) {
      /* a imagem de fundo girou junto com o slide: vai numa camada própria, deitada por cima das medidas do slide */
      var d = EA.dimSlide(s), cam = EA.el('div', 'fundo-girado');
      cam.style.cssText = 'width:' + d.h + 'px;height:' + d.w + 'px;margin:' + (-d.w / 2) + 'px 0 0 ' + (-d.h / 2) + 'px;transform:rotate(' + f.giro.ang + 'deg);background:center/cover no-repeat url("' + EA.urlMidia(projeto, f.midia) + '")' + (f.pixel ? ';image-rendering:pixelated' : '');
      el.appendChild(cam);
    }
    else if (f.tipo === 'imagem' && f.midia) { el.style.background = 'center/cover no-repeat url("' + EA.urlMidia(projeto, f.midia) + '")'; if (f.pixel) el.style.imageRendering = 'pixelated' }
  };

  /* ---------- overlay: uma película por cima do slide inteiro (textura, luz, linhas). Não pega cliques. 08/11/2026 ---------- */
  function svgUrl(s) { return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")' }
  function ruido(freq, oit, cor, semente) {
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><filter id="r"><feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="' + oit + '" seed="' + (semente || 3) + '" stitchTiles="stitch"/><feColorMatrix values="' + cor + '"/></filter><rect width="100%" height="100%" filter="url(#r)"/></svg>');
  }
  /* sorteio fixo: a poeira cai sempre igual, no editor e na apresentação */
  function poeira() {
    var x = 7, r = function () { x = (x * 16807) % 2147483647; return x / 2147483647 }, o = '';
    for (var i = 0; i < 90; i++) o += '<circle cx="' + Math.round(r() * 1280) + '" cy="' + Math.round(r() * 720) + '" r="' + (r() * 1.6 + .4).toFixed(1) + '" fill="#000" opacity="' + (r() * .5 + .2).toFixed(2) + '"/>';
    for (i = 0; i < 9; i++) { var a = r() * 1280, b = r() * 720; o += '<path d="M' + Math.round(a) + ' ' + Math.round(b) + ' q' + Math.round(r() * 30 - 15) + ' ' + Math.round(r() * 90 + 40) + ' ' + Math.round(r() * 20 - 10) + ' ' + Math.round(r() * 200 + 80) + '" stroke="#000" stroke-width=".8" fill="none" opacity=".25"/>' }
    for (i = 0; i < 14; i++) o += '<path d="M' + Math.round(r() * 1280) + ' ' + Math.round(r() * 720) + ' c4 -3 9 2 6 7 s-8 4 -10 -2" stroke="#000" stroke-width="1" fill="none" opacity=".3"/>';
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="none">' + o + '</svg>');
  }
  /* cada um: nome, css (fundo da película), mistura e força padrão (0–1). arq = arquivo que vai junto no HTML exportado */
  EA.OVERLAYS = {
    papel: { nome: 'Papel amassado', arq: 'assets/overlays/papel_amassado.webp', css: function () { return 'center/cover no-repeat url("' + EA.url('assets/overlays/papel_amassado.webp') + '")' }, mistura: 'hard-light', forca: .6 },
    antigo: { nome: 'Papel antigo', css: function () { return ruido(.9, 3, '0 0 0 0 .55  0 0 0 0 .42  0 0 0 0 .22  0 0 0 .9 0') + ',radial-gradient(ellipse at center,rgba(222,190,130,.25) 40%,rgba(120,80,30,.55))' }, mistura: 'multiply', forca: .6 },
    grao: { nome: 'Grão de filme', css: function () { return ruido(.85, 2, '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.4 -.4') }, forca: .45 },
    poeira: { nome: 'Poeira de filme velho', css: function () { return poeira() + ' center/100% 100% no-repeat,' + ruido(.85, 2, '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.2 -.4') }, forca: .6 },
    vinheta: { nome: 'Vinheta (bordas escuras)', css: function () { return 'radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.65) 100%)' }, forca: .7 },
    tv: { nome: 'TV antiga (linhas)', css: function () { return 'linear-gradient(to bottom,rgba(0,0,0,.3) 50%,transparent 50%) 0 0/100% 5px,radial-gradient(ellipse at center,transparent 60%,rgba(0,0,0,.5))' }, forca: .5 },
    caderno: { nome: 'Folha de caderno', css: function () { return 'linear-gradient(to right,transparent 118px,rgba(220,60,60,.6) 118px 121px,transparent 121px),linear-gradient(to bottom,transparent 37px,rgba(70,130,200,.5) 37px) 0 0/100% 40px' }, mistura: 'multiply', forca: .8 },
    quadriculado: { nome: 'Papel quadriculado', css: function () { return 'linear-gradient(to right,rgba(70,130,200,.4) 2px,transparent 2px) 0 0/32px 32px,linear-gradient(to bottom,rgba(70,130,200,.4) 2px,transparent 2px) 0 0/32px 32px' }, mistura: 'multiply', forca: .8 },
    pontos: { nome: 'Pontinhos de gibi', css: function () { return 'radial-gradient(circle,rgba(0,0,0,.35) 1.6px,transparent 2.2px) 0 0/12px 12px' }, mistura: 'multiply', forca: .35 },
    luz: { nome: 'Luz quente (sol entrando)', css: function () { return 'radial-gradient(circle at 0% 0%,rgba(255,170,60,.85),transparent 45%),radial-gradient(circle at 100% 100%,rgba(255,80,140,.6),transparent 40%),linear-gradient(115deg,transparent 35%,rgba(255,240,200,.35) 45%,transparent 55%)' }, mistura: 'screen', forca: .55 },
    neon: { nome: 'Brilho neon nas bordas', css: function () { return 'radial-gradient(ellipse at center,transparent 58%,rgba(120,60,255,.55) 85%,rgba(0,220,255,.7))' }, mistura: 'screen', forca: .6 },
    pixel: { nome: 'Tela de videogame (pixels)', css: function () { return 'linear-gradient(to right,rgba(0,0,0,.2) 1px,transparent 1px) 0 0/4px 4px,linear-gradient(to bottom,rgba(0,0,0,.2) 1px,transparent 1px) 0 0/4px 4px' }, forca: .6 },
    vidro: { nome: 'Vidro molhado (gotinhas)', css: function () { return 'radial-gradient(circle at 30% 30%,rgba(255,255,255,.7) 1px,rgba(255,255,255,.12) 3px,transparent 5px) 0 0/47px 53px,radial-gradient(circle at 60% 70%,rgba(255,255,255,.6) 1px,rgba(255,255,255,.1) 4px,transparent 7px) 13px 21px/71px 67px,linear-gradient(160deg,rgba(255,255,255,.18),transparent 60%)' }, forca: .7 }
  };
  EA.pintaOverlay = function (el, s) {
    var v = s && s.overlay, d = v && EA.OVERLAYS[v.tipo];
    [].forEach.call(el.querySelectorAll(':scope > .ov-camada'), function (q) { q.remove() });
    if (!d) return null;
    var c = EA.el('div', 'ov-camada');
    c.style.background = d.css();
    if (d.mistura && d.mistura !== 'normal') c.style.mixBlendMode = d.mistura;
    c.style.opacity = v.forca == null ? d.forca : v.forca;
    el.appendChild(c);
    return c;
  };

  /* slide inteiro desenhado parado (miniaturas, modelos) */
  EA.slideEstatico = function (s, projeto, largura, mesmoQuadro) {
    var fora = EA.el('div', 'mini'), palco = EA.el('div', 'palco estatico');
    EA.aplicaOrient(palco, s);
    EA.aplicaTema(palco, projeto ? projeto.tema : 'aulao');
    EA.pintaFundo(palco, s, projeto);
    if (s.quiz && EA.Quiz) palco.appendChild(EA.Quiz.previa(s.quiz, projeto));
    s.objs.forEach(function (o) {
      var e = EA.criaObjeto(o, { estatico: true, projeto: projeto });
      palco.appendChild(e);
      EA.ligaSprites(e, o, { estatico: true });
    });
    EA.pintaOverlay(palco, s);
    var d = EA.dimSlide(s), emPe = d.h > d.w, alt = largura * 9 / 16;
    /* em pé: a lista mostra mais alto; onde os cartões têm altura igual, cabe no mesmo quadro */
    var esc = !emPe ? largura / EA.W : mesmoQuadro ? alt / d.h : alt / d.w;
    palco.style.transform = 'scale(' + esc + ')';
    fora.style.width = (emPe && !mesmoQuadro ? alt : largura) + 'px'; fora.style.height = (emPe && !mesmoQuadro ? largura : alt) + 'px';
    if (emPe && !mesmoQuadro) fora.style.margin = '0 auto';
    if (emPe && mesmoQuadro) palco.style.left = (largura - d.w * esc) / 2 + 'px';
    fora.appendChild(palco);
    return fora;
  };
})();
