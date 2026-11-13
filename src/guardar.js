/* Guarda o material só neste computador: no banco do navegador (automático) e em arquivo .aulao (quando você pede). Nada vai para a internet. */
(function () {
  var EA = window.EA, banco = null;
  function abre() {
    if (banco) return Promise.resolve(banco);
    return new Promise(function (ok, erro) {
      var r = indexedDB.open('estudio-aulao', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('projetos', { keyPath: 'id' }) };
      r.onsuccess = function () { banco = r.result; ok(banco) };
      r.onerror = function () { erro(r.error) };
    });
  }
  function limpa(p) {
    var c = Object.assign({}, p, { midia: {} });
    /* 09/11: a medida (w, h) vai junto; sem ela, depois de reabrir, o painel Mídia colocava a imagem em 640 × 360 */
    Object.keys(p.midia || {}).forEach(function (k) { var m = p.midia[k], n = c.midia[k] = { tipo: m.tipo, nome: m.nome, dados: m.dados }; if (m.w && m.h) { n.w = m.w; n.h = m.h } });
    return c;
  }
  /* 09/11: as abas avisam umas às outras quando guardam ou apagam um material (quem ouve decide o que fazer) */
  var canal = null, ouvintes = [];
  try { if (window.BroadcastChannel) { canal = new BroadcastChannel('estudio-aulao'); canal.onmessage = function (e) { ouvintes.forEach(function (f) { try { f(e.data) } catch (x) { } }) } } } catch (x) { canal = null }
  function avisa(m) { try { if (canal) canal.postMessage(m) } catch (x) { } }
  EA.Guardar = {
    ouve: function (f) { ouvintes.push(f) },
    salva: function (p) {
      p.mudado = Date.now();
      /* 09/11: sem espaço no disco a gravação é abortada sem dar erro: sem o onabort ficava em "Salvando…" para sempre */
      var id = p.id;
      return abre().then(function (b) { return new Promise(function (ok, erro) { var t = b.transaction('projetos', 'readwrite'); t.oncomplete = function () { avisa({ t: 'salvou', id: id }); ok() }; t.onerror = t.onabort = function () { erro(t.error || new Error('gravação interrompida')) }; t.objectStore('projetos').put(limpa(p)) }) });
    },
    lista: function () {
      return abre().then(function (b) { return new Promise(function (ok, erro) { var r = b.transaction('projetos').objectStore('projetos').getAll(); r.onsuccess = function () { ok(r.result.sort(function (x, y) { return y.mudado - x.mudado })) }; r.onerror = function () { erro(r.error) } }) });
    },
    apaga: function (id) {
      /* 09/11: apagar também responde quando falha */
      return abre().then(function (b) { return new Promise(function (ok, erro) { var t = b.transaction('projetos', 'readwrite'); t.oncomplete = function () { avisa({ t: 'apagou', id: id }); ok() }; t.onerror = t.onabort = function () { erro(t.error || new Error('não apagou')) }; t.objectStore('projetos').delete(id) }) });
    },
    /* salva em arquivo: pergunta o lugar quando o navegador deixa; senão baixa */
    salvaArquivo: function (texto, nome, tipo, ext) {
      var blob = new Blob([texto], { type: tipo });
      if (window.showSaveFilePicker) {
        return window.showSaveFilePicker({ suggestedName: nome, types: [{ description: 'Arquivo', accept: (function () { var a = {}; a[tipo] = [ext]; return a })() }] }).then(function (h) { return h.createWritable().then(function (w) { return w.write(blob).then(function () { return w.close() }) }) }).then(function () { return true }, function (e) { if (e && e.name === 'AbortError') return false; return EA.Guardar.baixa(blob, nome) });
      }
      return Promise.resolve(EA.Guardar.baixa(blob, nome));
    },
    baixa: function (blob, nome) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href) }, 5000);
      return true;
    },
    paraTexto: function (p) { return JSON.stringify(limpa(p)) },
    nomeArquivo: function (t) { return String(t || 'material').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'material' }
  };
})();
