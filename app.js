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

// Aceita o id NOVO e o ANTIGO de proposito. Durante a troca do seletor
// (pista -> categoria) o navegador de quem ja tinha visitado o site
// servia o HTML em cache com o id velho, e a pagina inteira quebrava
// ('Cannot read properties of null'). Com os dois ids, qualquer
// combinacao de HTML/JS em cache continua funcionando ate o cache
// expirar sozinho.
var catSelect = document.getElementById('categoria')
             || document.getElementById('track');
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

// O JSON vem organizado por PISTA -> CATEGORIA. O site mostra o
// contrario (pedido explicito: "em vez de sortear por pistas, sorteia
// por categoria"), entao vira o indice aqui, uma vez, no carregamento.
function porCategoria(data) {
  var idx = {};
  var tracks = data.tracks || {};
  Object.keys(tracks).forEach(function (track) {
    var cats = tracks[track] || {};
    Object.keys(cats).forEach(function (cat) {
      if (!idx[cat]) idx[cat] = {};
      idx[cat][track] = cats[cat];
    });
  });
  return idx;
}

function sortedTracks(byTrack) {
  return Object.keys(byTrack).sort(function (a, b) {
    return prettyTrack(a).localeCompare(prettyTrack(b));
  });
}

function render(idx, category) {
  content.innerHTML = '';
  var byTrack = idx[category];
  if (!byTrack || !Object.keys(byTrack).length) {
    content.appendChild(el('p', 'empty', 'Nenhum recorde nesta categoria ainda.'));
    return;
  }
  sortedTracks(byTrack).forEach(function (track) {
    content.appendChild(buildCard(prettyTrack(track), byTrack[track]));
  });
}

// Recarga automatica. A pagina carregava os dados UMA VEZ so: uma aba
// aberta durante o evento nunca via tempo novo, mesmo quando o arquivo
// mudava. Agora ela rele sozinha.
var RECARGA_MS = 20000;

var idxAtual = null;
var geradoEm = null;

function preencherSeletor(cats) {
  var antes = catSelect.value;
  if (catSelect.options.length === cats.length && antes) return antes;
  catSelect.innerHTML = '';
  cats.forEach(function (c) {
    var o = el('option', null, c);
    o.value = c;
    catSelect.appendChild(o);
  });
  // Mantem a categoria que a pessoa estava vendo, se ainda existir.
  if (antes && cats.indexOf(antes) !== -1) catSelect.value = antes;
  return catSelect.value || cats[0];
}

function mostrarQuando() {
  if (!geradoEm) return;
  var d = new Date(geradoEm.replace(' ', 'T'));
  var seg = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  var quanto;
  if (seg < 90) quanto = 'ha ' + seg + 's';
  else if (seg < 5400) quanto = 'ha ' + Math.round(seg / 60) + ' min';
  else quanto = 'ha ' + Math.round(seg / 3600) + ' h';
  updated.textContent = 'Atualizado ' + quanto + ' (' + fmtDate(geradoEm) + ')';
}

function aplicar(data) {
  idxAtual = porCategoria(data);
  geradoEm = data.generated_at || null;
  var cats = sortedCategories(idxAtual);
  if (!cats.length) {
    catSelect.style.display = 'none';
    content.innerHTML = '';
    content.appendChild(el('p', 'empty',
      'Nenhum recorde registrado ainda. Corra e volte aqui.'));
  } else {
    catSelect.style.display = '';
    render(idxAtual, preencherSeletor(cats));
  }
  mostrarQuando();
}

function buscar(primeira) {
  return fetch('records.json?t=' + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(aplicar)
    .catch(function (e) {
      // Falha na RECARGA nao pode apagar o que ja esta na tela — so' a
      // primeira carga mostra erro.
      if (primeira) {
        content.appendChild(el('p', 'empty',
          'Nao foi possivel carregar os recordes (' + e.message + ').'));
      }
    });
}

catSelect.addEventListener('change', function () {
  if (idxAtual) render(idxAtual, catSelect.value);
});

buscar(true);
setInterval(function () { buscar(false); }, RECARGA_MS);
// O "atualizado ha X" anda sozinho, mesmo entre as buscas.
setInterval(mostrarQuando, 1000);
