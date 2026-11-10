import { esc, $$ } from '../util.js';
import { store } from '../store.js';
import { livros } from '../dados.js';

let abaAtual = 'AT';

export async function telaLivros(aberto) {
  const ls = await livros();
  const lidos = store.lidos();
  const ultimo = store.ultimo();
  if (aberto) {
    const l = ls.find((x) => x.id === aberto);
    if (l) abaAtual = l.t;
  }

  const blocoCaps = (l) => {
    const feitos = new Set(lidos[l.id] || []);
    const pct = Math.round((feitos.size / l.caps) * 100);
    const botoes = Array.from({ length: l.caps }, (_, i) => {
      const n = i + 1;
      const cls = ultimo && ultimo.livro === l.id && ultimo.cap === n ? 'atual' : feitos.has(n) ? 'lido' : '';
      const rotulo = `${l.nome} capítulo ${n}${feitos.has(n) ? ', lido' : ''}`;
      return `<a href="#/ler/${l.id}/${n}" class="${cls}" aria-label="${esc(rotulo)}">${n}</a>`;
    }).join('');
    return `<div class="caps-box">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)"><span>Toque no capítulo para ler</span><span>${feitos.size} de ${l.caps} lidos</span></div>
        <div class="progresso" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso em ${esc(l.nome)}"><div style="width:${pct}%"></div></div>
        <div class="grade">${botoes}</div>
      </div>`;
  };

  const lista = (t) =>
    ls
      .filter((l) => l.t === t)
      .map(
        (l) => `<div class="livro${l.id === aberto ? ' aberto' : ''}" data-id="${l.id}">
          <button aria-expanded="${l.id === aberto}"><span>${esc(l.nome)}</span><span>${l.caps} cap.</span></button>
          ${l.id === aberto ? blocoCaps(l) : ''}
        </div>`,
      )
      .join('');

  return {
    titulo: 'Livros',
    rolarPara: aberto ? { sel: '.livro.aberto', block: 'start' } : null,
    html: `
      <header class="topo"><h1>Livros</h1></header>
      <div style="padding:4px 20px 12px">
        <div class="segmento" role="tablist">
          <button role="tab" data-t="AT" aria-selected="${abaAtual === 'AT'}">Antigo Testamento</button>
          <button role="tab" data-t="NT" aria-selected="${abaAtual === 'NT'}">Novo Testamento</button>
        </div>
      </div>
      <div class="lista-livros" id="lista">${lista(abaAtual)}</div>`,
    montar(el) {
      const box = el.querySelector('#lista');
      $$('[role="tab"]', el).forEach((b) =>
        b.addEventListener('click', () => {
          abaAtual = b.dataset.t;
          $$('[role="tab"]', el).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
          box.innerHTML = lista(abaAtual);
        }),
      );
      // Abrir/fechar um livro sem recarregar a tela inteira.
      box.addEventListener('click', (e) => {
        const btn = e.target.closest('.livro > button');
        if (!btn) return;
        const id = btn.parentElement.dataset.id;
        const novo = btn.getAttribute('aria-expanded') === 'true' ? '' : id;
        history.replaceState(null, '', novo ? `#/livros/${novo}` : '#/livros');
        aberto = novo;
        box.innerHTML = lista(abaAtual);
        const alvo = box.querySelector('.livro.aberto');
        if (alvo) alvo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    },
  };
}
