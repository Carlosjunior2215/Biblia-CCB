import { SIMBOLO } from '../arte.js';
import { esc, $$, ICONE } from '../util.js';
import { store, CORES } from '../store.js';
import { livros, versiculo } from '../dados.js';

let aba = 'favoritos';
let corFiltro = null;

async function montarItens(mapa, comCor) {
  const ls = await livros();
  const nomes = Object.fromEntries(ls.map((l) => [l.id, l.nome]));
  const entradas = Object.entries(mapa)
    .map(([k, v]) => ({ k, em: comCor ? v.em : v, cor: comCor ? v.cor : null }))
    .filter((e) => !comCor || !corFiltro || e.cor === corFiltro)
    .sort((a, b) => b.em - a.em);
  return Promise.all(
    entradas.map(async (e) => {
      const [livro, cap, vs] = e.k.split('/');
      const texto = await versiculo(livro, +cap, +vs).catch(() => null);
      return { ...e, livro, cap, vs, nome: nomes[livro] || livro, texto };
    }),
  );
}

function quando(ts) {
  const dias = Math.floor((Date.now() - ts) / 86400000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 7) return `${dias} dias`;
  return new Date(ts).toLocaleDateString('pt-BR');
}

export async function telaSalvos() {
  const render = async () => {
    const comCor = aba === 'marcas';
    const itens = await montarItens(comCor ? store.marcas() : store.favoritos(), comCor);
    const corDe = (id) => CORES.find((c) => c.id === id)?.solida || 'var(--accent)';
    const lista = itens.length
      ? itens
          .map(
            (it) => `<div class="item-salvo">
              <div class="barra-cor" style="background:${comCor ? corDe(it.cor) : 'var(--accent)'}"></div>
              <a href="#/ler/${it.livro}/${it.cap}/${it.vs}">
                <span style="display:flex;justify-content:space-between;gap:8px"><span class="ref">${esc(it.nome)} ${it.cap}:${it.vs}</span><span style="font-size:12px;color:var(--muted)">${quando(it.em)}</span></span>
                <span class="txt">${esc(it.texto || '')}</span>
              </a>
              <button class="icone" data-remover="${esc(it.k)}" aria-label="Remover ${esc(it.nome)} ${it.cap}:${it.vs}">${ICONE.lixo}</button>
            </div>`,
          )
          .join('')
      : `<div class="vazio">${
          comCor
            ? corFiltro
              ? 'Nenhum versículo com esta cor.'
              : 'Você ainda não marcou versículos.<br>Na leitura, toque num versículo e escolha uma cor.'
            : 'Você ainda não tem favoritos.<br>Na leitura, toque num versículo e depois em Favorito.'
        }</div>`;
    return lista;
  };

  const html = `
    <header class="topo"><h1>Salvos</h1>${SIMBOLO.salvos}</header>
    <div class="conteudo" style="padding-top:4px;gap:12px">
      <div class="segmento" role="tablist">
        <button role="tab" data-aba="favoritos" aria-selected="${aba === 'favoritos'}">Favoritos</button>
        <button role="tab" data-aba="marcas" aria-selected="${aba === 'marcas'}">Marcações</button>
      </div>
      <div class="bolinhas" id="filtro-cor" ${aba === 'marcas' ? '' : 'hidden'} role="group" aria-label="Filtrar por cor">
        <span style="font-size:12px;color:var(--muted)">Filtrar por cor</span>
        ${CORES.map((c) => `<button class="bolinha" data-cor="${c.id}" aria-label="${c.nome}" aria-pressed="${corFiltro === c.id}" style="background:${c.solida}"></button>`).join('')}
      </div>
      <div id="lista" style="display:flex;flex-direction:column;gap:10px">${await render()}</div>
      <p class="creditos">Ficam salvos neste aparelho, sem precisar de login.</p>
    </div>`;

  return {
    titulo: 'Salvos',
    html,
    montar(el) {
      const lista = el.querySelector('#lista');
      const filtro = el.querySelector('#filtro-cor');
      const atualizar = async () => {
        lista.innerHTML = await render();
      };
      $$('[role="tab"]', el).forEach((b) =>
        b.addEventListener('click', () => {
          aba = b.dataset.aba;
          $$('[role="tab"]', el).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
          filtro.hidden = aba !== 'marcas';
          atualizar();
        }),
      );
      $$('[data-cor]', filtro).forEach((b) =>
        b.addEventListener('click', () => {
          corFiltro = corFiltro === b.dataset.cor ? null : b.dataset.cor;
          $$('[data-cor]', filtro).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.cor === corFiltro)));
          atualizar();
        }),
      );
      lista.addEventListener('click', (e) => {
        const b = e.target.closest('[data-remover]');
        if (!b) return;
        const k = b.dataset.remover;
        if (aba === 'marcas') store.marcar([k], null);
        else store.removerFavorito(k);
        atualizar();
      });
    },
  };
}
