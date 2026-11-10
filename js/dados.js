// Acesso ao texto bíblico e ao hinário. Os arquivos ficam em /data e são guardados pelo
// service worker, então depois da primeira visita tudo funciona sem internet.
import { normalizar } from './util.js';

let livrosCache = null;
const textoCache = new Map();
let hinosCache = null;

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Falha ao carregar ${url} (${r.status})`);
  return r.json();
}

/** Lista dos 66 livros: { id, nome, t: 'AT'|'NT', caps, versos: [nº de versículos por capítulo] } */
export async function livros() {
  if (!livrosCache) livrosCache = await json('data/livros.json');
  return livrosCache;
}

export async function livro(id) {
  return (await livros()).find((l) => l.id === id) || null;
}

/** Capítulos de um livro: [[versículo1, versículo2, ...], ...] */
export async function textoLivro(id) {
  if (!textoCache.has(id)) {
    textoCache.set(id, json(`data/biblia/${encodeURIComponent(id)}.json`).catch((e) => {
      textoCache.delete(id);
      throw e;
    }));
  }
  return textoCache.get(id);
}

export async function capitulo(id, cap) {
  const t = await textoLivro(id);
  return t[cap - 1] || null;
}

export async function versiculo(id, cap, vs) {
  const c = await capitulo(id, cap);
  return c ? c[vs - 1] ?? null : null;
}

/** "Salmos 23:1-3" a partir de uma lista de versículos do mesmo capítulo. */
export function referencia(nomeLivro, cap, versos) {
  const v = [...versos].sort((a, b) => a - b);
  if (!v.length) return `${nomeLivro} ${cap}`;
  const partes = [];
  let ini = v[0];
  let ant = v[0];
  for (let i = 1; i <= v.length; i++) {
    if (v[i] === ant + 1) {
      ant = v[i];
      continue;
    }
    partes.push(ini === ant ? `${ini}` : `${ini}-${ant}`);
    ini = ant = v[i];
  }
  return `${nomeLivro} ${cap}:${partes.join(',')}`;
}

// ---------- Referências digitadas ("jo 3:16", "Salmos 23", "1 co 13") ----------

const APELIDOS = {
  gn: 'gn', gen: 'gn', ex: 'ex', exo: 'ex', lv: 'lv', lev: 'lv', nm: 'nm', num: 'nm', dt: 'dt', deut: 'dt',
  js: 'js', jos: 'js', jz: 'jz', jui: 'jz', rt: 'rt', rut: 'rt', job: 'jo', sl: 'sl', sal: 'sl', salmo: 'sl',
  pv: 'pv', prov: 'pv', ec: 'ec', ecl: 'ec', ct: 'ct', cant: 'ct', is: 'is', isa: 'is', jr: 'jr', jer: 'jr',
  lm: 'lm', lam: 'lm', ez: 'ez', eze: 'ez', dn: 'dn', dan: 'dn', os: 'os', ose: 'os', jl: 'jl', am: 'am',
  ob: 'ob', obd: 'ob', jn: 'jn', jon: 'jn', mq: 'mq', miq: 'mq', na: 'na', naum: 'na', hc: 'hc', hab: 'hc',
  sf: 'sf', sof: 'sf', ag: 'ag', zc: 'zc', zac: 'zc', ml: 'ml', mal: 'ml', mt: 'mt', mat: 'mt', mc: 'mc',
  mar: 'mc', lc: 'lc', luc: 'lc', jo: 'joa', joao: 'joa', at: 'at', atos: 'at', rm: 'rm', rom: 'rm',
  gl: 'gl', gal: 'gl', ef: 'ef', efe: 'ef', fp: 'fp', fil: 'fp', cl: 'cl', col: 'cl', tt: 'tt', tit: 'tt',
  fm: 'fm', hb: 'hb', heb: 'hb', tg: 'tg', tia: 'tg', jd: 'jd', jud: 'jd', ap: 'ap', apoc: 'ap',
  sm: 'sm', rs: 'rs', cr: 'cr', co: 'co', ts: 'ts', tm: 'tm', pe: 'pe',
};

let mapaNomes = null;
async function mapa() {
  if (mapaNomes) return mapaNomes;
  const ls = await livros();
  mapaNomes = new Map();
  for (const l of ls) {
    mapaNomes.set(normalizar(l.nome).replace(/\s+/g, ''), l.id);
    mapaNomes.set(l.id, l.id);
  }
  return mapaNomes;
}

/**
 * Tenta entender o texto como referência bíblica.
 * Retorna { livro, cap, vs? } ou null.
 */
export async function interpretarReferencia(texto) {
  const bruto = String(texto || '').trim().toLowerCase();
  const m = bruto.match(/^([1-3])?\s*([a-zà-ú]+)\.?\s*(\d+)?(?:\s*[:., ]\s*(\d+))?$/i);
  if (!m) return null;
  const [, num = '', nome, cap, vs] = m;
  if (!num && nome === 'jó') return montar('jo', cap, vs);
  if (!num && nome === 'jo') return montar('joa', cap, vs); // "jo 3:16" quase sempre é João
  const chave = num + normalizar(nome);
  const mp = await mapa();
  let id = mp.get(chave);
  if (!id) {
    const ap = APELIDOS[normalizar(nome)];
    if (ap) id = mp.get(num + ap) || (num ? null : mp.get(ap));
  }
  if (!id) {
    // prefixo do nome: "gene" -> Gênesis
    for (const [k, v] of mp) {
      if (k.length > 3 && k.startsWith(chave) && chave.length >= 3) {
        id = v;
        break;
      }
    }
  }
  return id ? montar(id, cap, vs) : null;

  async function montar(idLivro, c, v) {
    const l = await livro(idLivro);
    if (!l) return null;
    const capN = Math.min(Math.max(parseInt(c || '1', 10), 1), l.caps);
    const vsN = v ? Math.min(Math.max(parseInt(v, 10), 1), l.versos[capN - 1]) : null;
    return { livro: idLivro, cap: capN, vs: vsN };
  }
}

// ---------- Busca por palavras ----------

/**
 * Procura versículos que tenham TODAS as palavras digitadas (sem diferenciar acento/maiúscula).
 * filtro: 'todos' | 'AT' | 'NT'. Retorna { itens, total, cortado }.
 */
export async function buscar(texto, filtro = 'todos', limite = 300) {
  const termos = normalizar(texto).split(/\s+/).filter((t) => t.length >= 2);
  if (!termos.length) return { itens: [], total: 0, cortado: false };
  const ls = (await livros()).filter((l) => filtro === 'todos' || l.t === filtro);
  const textos = await Promise.all(ls.map((l) => textoLivro(l.id)));
  const itens = [];
  let total = 0;
  ls.forEach((l, i) => {
    textos[i].forEach((cap, ci) => {
      cap.forEach((v, vi) => {
        const n = normalizar(v);
        if (termos.every((t) => n.includes(t))) {
          total++;
          if (itens.length < limite) itens.push({ livro: l.id, nome: l.nome, cap: ci + 1, vs: vi + 1, texto: v });
        }
      });
    });
  });
  return { itens, total, cortado: total > itens.length, termos };
}

// ---------- Versículo do dia ----------

const VERSOS_DO_DIA = [
  ['sl', 23, 1], ['joa', 3, 16], ['fp', 4, 13], ['pv', 3, 5], ['is', 41, 10], ['rm', 8, 28], ['mt', 11, 28],
  ['sl', 46, 1], ['jr', 29, 11], ['js', 1, 9], ['sl', 119, 105], ['mt', 6, 33], ['2tm', 1, 7], ['sl', 37, 5],
  ['1co', 13, 4], ['hb', 11, 1], ['rm', 12, 2], ['sl', 91, 1], ['is', 40, 31], ['joa', 14, 6], ['gl', 5, 22],
  ['ef', 2, 8], ['1jo', 4, 8], ['sl', 121, 1], ['pv', 16, 3], ['mt', 5, 9], ['tg', 1, 5], ['sl', 27, 1],
  ['joa', 14, 27], ['rm', 5, 8], ['sl', 34, 8], ['lm', 3, 22], ['1pe', 5, 7], ['sl', 100, 4], ['cl', 3, 23],
  ['mq', 6, 8], ['sl', 139, 14], ['joa', 15, 5], ['ap', 21, 4], ['nm', 6, 24], ['sl', 133, 1], ['mt', 7, 7],
  ['ef', 6, 10], ['hb', 13, 8], ['sl', 150, 6], ['joa', 11, 25], ['rm', 10, 9], ['is', 26, 3], ['pv', 18, 10],
  ['sl', 55, 22], ['1ts', 5, 16], ['2co', 5, 17], ['dt', 31, 6], ['sl', 103, 2], ['ec', 3, 1], ['mt', 28, 20],
];

/** Escolhe um versículo diferente a cada dia (o mesmo para todo mundo naquele dia). */
export async function versiculoDoDia(data = new Date()) {
  const inicio = new Date(data.getFullYear(), 0, 0);
  const dia = Math.floor((data - inicio) / 86400000);
  const [id, cap, vs] = VERSOS_DO_DIA[(dia + data.getFullYear()) % VERSOS_DO_DIA.length];
  const l = await livro(id);
  const texto = await versiculo(id, cap, vs);
  return { livro: id, nome: l.nome, cap, vs, texto };
}

// ---------- Hinário ----------

/** Lista de hinos: [{ n, titulo, partes: [{ tipo: 'estrofe'|'coro', rotulo, linhas: [] }] }] */
export async function hinos() {
  if (!hinosCache) hinosCache = await json('data/hinos.json');
  return hinosCache;
}
