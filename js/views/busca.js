import { SIMBOLO } from '../arte.js';
import { esc, normalizar, $$, ICONE } from '../util.js';
import { buscar, interpretarReferencia, livro } from '../dados.js';

let filtroAtual = 'todos';

/** Destaca os termos no texto, ignorando acentos ("joao" destaca "João"). */
function destacar(texto, termos) {
  const chars = [...texto];
  const norm = chars.map((c) => normalizar(c) || c).join('');
  // Só funciona quando cada letra continua uma letra depois de tirar o acento (o caso comum em português).
  if (norm.length !== chars.length) return esc(texto);
  const marca = new Array(chars.length).fill(false);
  for (const t of termos) {
    let i = norm.indexOf(t);
    while (i !== -1) {
      for (let j = i; j < i + t.length; j++) marca[j] = true;
      i = norm.indexOf(t, i + t.length);
    }
  }
  let out = '';
  let aberto = false;
  chars.forEach((c, i) => {
    if (marca[i] && !aberto) {
      out += '<mark>';
      aberto = true;
    }
    if (!marca[i] && aberto) {
      out += '</mark>';
      aberto = false;
    }
    out += esc(c);
  });
  return aberto ? `${out}</mark>` : out;
}

export async function telaBusca(q) {
  const termo = q.get('q') || '';
  return {
    titulo: 'Buscar',
    html: `
      <header class="topo"><h1>Buscar</h1>${SIMBOLO.buscar}</header>
      <div class="conteudo" style="padding-top:4px;gap:12px">
        <form class="campo" role="search" id="form">
          ${ICONE.busca}
          <label for="q" class="sr-only">Palavra ou referência</label>
          <input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Palavra ou referência (ex.: João 3:16)" value="${esc(termo)}">
        </form>
        <div class="chips" role="group" aria-label="Onde buscar">
          ${[['todos', 'Toda a Bíblia'], ['AT', 'Antigo T.'], ['NT', 'Novo T.']]
            .map(([id, n]) => `<button class="chip" data-f="${id}" aria-pressed="${filtroAtual === id}">${n}</button>`)
            .join('')}
        </div>
      </div>
      <div class="resultados" id="res" aria-live="polite"></div>`,
    montar(el) {
      const input = el.querySelector('#q');
      const res = el.querySelector('#res');
      let timer;
      let rodada = 0;

      async function executar() {
        const texto = input.value.trim();
        history.replaceState(null, '', texto ? `#/buscar?q=${encodeURIComponent(texto)}` : '#/buscar');
        const minha = ++rodada;
        if (texto.length < 2) {
          res.innerHTML = `<div class="vazio">Digite uma palavra (ex.: <b>pastor</b>) ou uma referência (ex.: <b>Salmos 23</b>, <b>jo 3:16</b>).</div>`;
          return;
        }
        res.innerHTML = '<p class="aviso">Buscando…</p>';
        const [ref, r] = await Promise.all([interpretarReferencia(texto), buscar(texto, filtroAtual)]);
        if (minha !== rodada) return;

        let topo = '';
        if (ref) {
          const l = await livro(ref.livro);
          const alvo = `#/ler/${ref.livro}/${ref.cap}${ref.vs ? `/${ref.vs}` : ''}`;
          topo = `<a class="resultado" href="${alvo}"><span class="ref">Ir para</span><span class="txt" style="font-family:var(--font-ui);font-weight:600">${esc(l.nome)} ${ref.cap}${ref.vs ? `:${ref.vs}` : ''} →</span></a>`;
        }
        if (!r.total && !ref) {
          res.innerHTML = `<div class="vazio">Nada encontrado para “${esc(texto)}”.<br>Tente outra palavra.</div>`;
          return;
        }
        const resumo = r.total
          ? `<p class="aviso">${r.total} ${r.total === 1 ? 'versículo encontrado' : 'versículos encontrados'}${r.cortado ? ` (mostrando os ${r.itens.length} primeiros)` : ''}</p>`
          : '';
        res.innerHTML =
          topo +
          resumo +
          r.itens
            .map(
              (it) => `<a class="resultado" href="#/ler/${it.livro}/${it.cap}/${it.vs}">
                <span class="ref">${esc(it.nome)} ${it.cap}:${it.vs}</span>
                <span class="txt">${destacar(it.texto, r.termos)}</span>
              </a>`,
            )
            .join('');
      }

      input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(executar, 300);
      });
      el.querySelector('#form').addEventListener('submit', (e) => {
        e.preventDefault();
        clearTimeout(timer);
        input.blur();
        executar();
      });
      $$('[data-f]', el).forEach((b) =>
        b.addEventListener('click', () => {
          filtroAtual = b.dataset.f;
          $$('[data-f]', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          executar();
        }),
      );
      executar();
      if (!termo) input.focus();
    },
  };
}
