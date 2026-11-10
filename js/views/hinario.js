import { esc, normalizar, $$, ICONE } from '../util.js';
import { store } from '../store.js';
import { hinos } from '../dados.js';
import { abrirOpcoesLeitura } from './opcoes.js';

let filtro = 'todos';

const nomeHino = (h) => (h.titulo ? h.titulo : `Hino ${h.n}`);

export async function telaHinario(q) {
  const lista = await hinos();
  const busca = q.get('q') || '';

  const linhas = (texto) => {
    const favs = store.hinosFav();
    let base = lista;
    if (filtro === 'favoritos') base = lista.filter((h) => favs[h.n]);
    if (filtro === 'recentes') {
      const rec = store.hinosRecentes();
      base = rec.map((n) => lista.find((h) => h.n === n)).filter(Boolean);
    }
    const t = normalizar(texto.trim());
    if (t) base = base.filter((h) => String(h.n) === t || String(h.n).startsWith(t) || normalizar(h.titulo).includes(t));
    if (!base.length) {
      return `<div class="vazio">${
        filtro === 'favoritos' ? 'Nenhum hino favorito ainda.<br>Abra um hino e toque no coração.' : filtro === 'recentes' ? 'Os hinos que você abrir aparecem aqui.' : 'Nenhum hino encontrado.'
      }</div>`;
    }
    return base
      .slice(0, 500)
      .map(
        (h) => `<a class="hino-linha" href="#/hino/${h.n}">
          <span class="num">${h.n}</span>
          <span class="tit${h.titulo ? '' : ' semtitulo'}">${esc(nomeHino(h))}</span>
          ${favs[h.n] ? `<span style="color:#C2410C" aria-label="favorito">${ICONE.coracao}</span>` : ''}
          ${ICONE.seta}
        </a>`,
      )
      .join('');
  };

  return {
    titulo: 'Hinário',
    html: `
      <header class="topo"><h1>Hinário</h1></header>
      <div class="conteudo" style="padding-top:4px;gap:12px">
        <form class="campo" role="search" id="form">
          ${ICONE.busca}
          <label for="qh" class="sr-only">Número ou título do hino</label>
          <input id="qh" type="search" inputmode="search" autocomplete="off" placeholder="Número ou título do hino" value="${esc(busca)}">
        </form>
        <div class="chips" role="group" aria-label="Mostrar">
          ${[['todos', 'Todos'], ['favoritos', 'Favoritos'], ['recentes', 'Recentes']]
            .map(([id, n]) => `<button class="chip" data-f="${id}" aria-pressed="${filtro === id}">${n}</button>`)
            .join('')}
        </div>
      </div>
      <div class="resultados" id="lista">${linhas(busca)}</div>`,
    montar(el) {
      const input = el.querySelector('#qh');
      const box = el.querySelector('#lista');
      const atualizar = () => {
        history.replaceState(null, '', input.value.trim() ? `#/hinario?q=${encodeURIComponent(input.value.trim())}` : '#/hinario');
        box.innerHTML = linhas(input.value);
      };
      input.addEventListener('input', atualizar);
      el.querySelector('#form').addEventListener('submit', (e) => {
        e.preventDefault();
        const n = parseInt(input.value, 10);
        if (lista.some((h) => h.n === n)) location.hash = `#/hino/${n}`;
      });
      $$('[data-f]', el).forEach((b) =>
        b.addEventListener('click', () => {
          filtro = b.dataset.f;
          $$('[data-f]', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          atualizar();
        }),
      );
    },
  };
}

export async function telaHino(n) {
  const lista = await hinos();
  const i = lista.findIndex((h) => h.n === n);
  if (i < 0) {
    location.replace('#/hinario');
    return null;
  }
  const h = lista[i];
  const ant = lista[i - 1];
  const prox = lista[i + 1];
  store.registrarHino(n);
  const fav = !!store.hinosFav()[n];

  const corpo = h.partes && h.partes.length
    ? h.partes
        .map(
          (p) => `<div class="parte${p.tipo === 'coro' ? ' coro' : ''}">
            <b>${esc(p.rotulo || (p.tipo === 'coro' ? 'Coro' : ''))}</b>
            <p>${esc((p.linhas || []).join('\n'))}</p>
          </div>`,
        )
        .join('')
    : `<div class="cartao" style="font-family:var(--font-ui);font-size:15px;line-height:1.5">
         <strong>Letra ainda não cadastrada</strong>
         <span style="color:var(--muted)">O app já está pronto para mostrar as letras. Elas serão incluídas quando houver autorização para publicá-las.</span>
       </div>`;

  return {
    titulo: nomeHino(h),
    html: `
      <header class="barra">
        <a class="icone" href="#/hinario" aria-label="Voltar ao hinário">${ICONE.voltar}</a>
        <h1>Hino ${h.n}</h1>
        <div style="display:flex">
          <button class="icone" id="fav" aria-label="Favoritar hino" aria-pressed="${fav}">${ICONE.coracao}</button>
          <button class="icone" id="aa" aria-label="Tamanho da letra e aparência" style="font-size:17px;font-weight:600">Aa</button>
        </div>
      </header>
      <article class="hino">
        <div style="display:flex;flex-direction:column;gap:4px">
          <span class="rotulo" style="font-family:var(--font-ui)">Hinário · nº ${h.n}</span>
          <h2>${esc(nomeHino(h))}</h2>
        </div>
        ${corpo}
      </article>
      <footer class="rodape-cap">
        <a href="${ant ? `#/hino/${ant.n}` : '#/hinario'}" aria-disabled="${!ant}">${ICONE.voltar}${ant ? `Hino ${ant.n}` : ''}</a>
        <a href="${prox ? `#/hino/${prox.n}` : '#/hinario'}" aria-disabled="${!prox}">${prox ? `Hino ${prox.n}` : ''}${ICONE.seta}</a>
      </footer>`,
    montar(el) {
      el.querySelector('#aa').addEventListener('click', () => abrirOpcoesLeitura());
      const b = el.querySelector('#fav');
      const pintar = (on) => {
        b.setAttribute('aria-pressed', String(on));
        b.style.color = on ? '#C2410C' : '';
        b.querySelector('svg').style.fill = on ? 'currentColor' : 'none';
      };
      pintar(fav);
      b.addEventListener('click', () => pintar(store.alternarHinoFav(n)));
    },
  };
}
