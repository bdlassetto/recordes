// app.js — le records.json (publicado pelo servidor da VPS) e monta os
// rankings por pista/categoria.
//
// O JSON vem do MESMO dominio (o servidor empurra pro repositorio deste
// site) — por isso nao ha fetch pro servidor de corrida aqui: ele e' http
// puro e o navegador bloquearia (mixed content) a partir do Pages, que e'
// sempre https.

// Ordem fixa de exibicao — mesma lista de src/application/car_category.py.
// Categoria que aparecer no JSON e nao estiver aqui e' mostrada no fim.
var CATEGORY_ORDER = ['STT', 'TOYO', 'LISTA', 'DTA', 'OUTROS'];

// Nome tecnico da pista (vem da pasta do AC) -> nome de gente. O site e'
// publico: ninguem de fora sabe o que e' "bdl_race_valley". O que nao
// estiver aqui cai no tratamento generico de prettyTrack().
var TRACK_NAMES = {
  'bdl_interlagos_toyo_livre': 'Interlagos — Toyo Livre',
  'bdl_interlagos_arrancada': 'Interlagos — Arrancada',
  'bdl_interlagos': 'Interlagos',
  'bdl_curitiba21_drag': 'Curitiba 21',
  'bdl_velopark_dragbdlnoprepclassic': 'Velopark — No Prep Classic',
  'bdl_velopark_dragbdlnoprep': 'Velopark — No Prep',
  'bdl_velopark_dragbdl': 'Velopark',
  'bdl_velopark': 'Velopark',
  'bdl_goiania_': 'Goiania',
  'bdl_goiania': 'Goiania',
  'bdl_spid_prep201': 'SPID — Prep 201',
  'bdl_spid_noprep201': 'SPID — No Prep 201',
  'bdl_spid_especial_prep': 'SPID Especial — Prep',
  'bdl_spid_especial_noprep': 'SPID Especial — No Prep',
  'bdl_spid': 'SPID',
  'bdl_mato_grosso_campeonato': 'Mato Grosso — Campeonato',
  'bdl_mato_grosso_treino': 'Mato Grosso — Treino',
  'bdl_londrina_drag': 'Londrina',
  'bdl_londrina': 'Londrina',
  'bdl_race_valley_noprep': 'Race Valley — No Prep',
  'bdl_race_valley_prep': 'Race Valley — Prep',
  'bdl_race_valley': 'Race Valley',
  'hw_yello_belly_beta_': 'Yello Belly',
  'do_cashdays_v3_': 'Cash Days v3',
  'do_cashdays_v2_': 'Cash Days v2'
};

function prettyTrack(key) {
  if (TRACK_NAMES[key]) return TRACK_NAMES[key];
  // Generico: tira prefixo de pacote, troca "_" por espaco e capitaliza.
  var t = String(key).replace(/^(bdl|hw|do)_/, '').replace(/_+$/, '');
  t = t.replace(/_/g, ' ').trim();
  return t.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}

var trackSelect = document.getElementById('track');
var content = document.getElementById('content');
var updated = document.getElementById('updated');

function fmt(v) {
  return (typeof v === 'number' && isFinite(v)) ? v.toFixed(3) : '—';
}

function fmtDate(s) {
  if (!s) return '';
  return String(s).replace('T', ' ').slice(0, 16);
}

function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function sortedCategories(byCat) {
  var names = Object.keys(byCat);
  names.sort(function (a, b) {
    var ia = CATEGORY_ORDER.indexOf(a);
    var ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1) ia = 999;
    if (ib === -1) ib = 999;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
  });
  return names;
}

function buildCard(category, rows) {
  var card = el('section', 'card');
  card.appendChild(el('h2', null, category));

  var table = el('table');
  var thead = el('thead');
  var htr = el('tr');
  ['#', 'Piloto', 'Tempo', 'RT', 'Soma', 'Data'].forEach(function (h) {
    htr.appendChild(el('th', null, h));
  });
  thead.appendChild(htr);
  table.appendChild(thead);

  var tbody = el('tbody');
  rows.forEach(function (r, i) {
    var tr = el('tr', i === 0 ? 'top' : null);
    tr.appendChild(el('td', 'pos', String(i + 1)));
    tr.appendChild(el('td', 'pilot', r.pilot));
    tr.appendChild(el('td', 'num', fmt(r.t201)));
    tr.appendChild(el('td', 'num', fmt(r.rt)));
    tr.appendChild(el('td', 'num sum', fmt(r.sum)));
    tr.appendChild(el('td', 'date', fmtDate(r.date)));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);
  return card;
}

function render(data, track) {
  content.innerHTML = '';
  var byCat = (data.tracks || {})[track];
  if (!byCat || !Object.keys(byCat).length) {
    content.appendChild(el('p', 'empty', 'Nenhum recorde nesta pista ainda.'));
    return;
  }
  sortedCategories(byCat).forEach(function (cat) {
    content.appendChild(buildCard(cat, byCat[cat]));
  });
}

function boot(data) {
  var tracks = Object.keys(data.tracks || {}).sort();
  if (!tracks.length) {
    trackSelect.style.display = 'none';
    content.appendChild(el('p', 'empty',
      'Nenhum recorde registrado ainda. Corra e volte aqui.'));
  } else {
    tracks.sort(function (x, y) {
      return prettyTrack(x).localeCompare(prettyTrack(y));
    });
    tracks.forEach(function (t) {
      var o = el('option', null, prettyTrack(t));
      o.value = t;
      trackSelect.appendChild(o);
    });
    trackSelect.addEventListener('change', function () {
      render(data, trackSelect.value);
    });
    render(data, tracks[0]);
  }
  if (data.generated_at) {
    updated.textContent = 'Atualizado em ' + fmtDate(data.generated_at);
  }
}

fetch('records.json?t=' + Date.now())
  .then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(boot)
  .catch(function (e) {
    content.appendChild(el('p', 'empty',
      'Nao foi possivel carregar os recordes (' + e.message + ').'));
  });
