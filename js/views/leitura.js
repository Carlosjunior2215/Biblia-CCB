import { esc, avisar, copiarTexto, $$, ICONE } from '../util.js';
import { store, CORES, chaveVerso } from '../store.js';
import { livros, livro as getLivro, capitulo, referencia } from '../dados.js';
import { abrirFolha, fecharFolha } from '../sheet.js';
import { abrirOpcoesLeitura } from './opcoes.js';
import { abrirCompartilhar } from './compartilhar.js';

/** Capítulo anterior/próximo, passando de um livro para o outro. */
async function vizinhos(id, cap) {
  const ls = await livros();
  const i = ls.findIndex((l) => l.id === id);
  const l = ls[i];
  const ant = cap > 1 ? { livro: id, cap: cap - 1, nome: l.nome } : i > 0 ? { livro: ls[i - 1].id, cap: ls[i - 1].caps, nome: ls[i - 1].nome } : null;
  const prox = cap < l.caps ? { livro: id, cap: cap + 1, nome: l.nome } : i < ls.length - 1 ? { livro: ls[i + 1].id, cap: 1, nome: ls[i + 1].nome } : null;
  return { ant, prox };
}

function rotuloCurto(v, atualId) {
  if (!v) return '';
  return v.livro === atualId ? `Capítulo ${v.cap}` : `${v.nome} ${v.cap}`;
}

export async function telaLeitura(id, cap, vsDestaque) {
  const l = await getLivro(id);
  if (!l) {
    location.replace('#/livros');
    return null;
  }
  cap = Math.min(Math.max(cap, 1), l.caps);
  const [versos, viz] = await Promise.all([capitulo(id, cap), vizinhos(id, cap)]);
  store.salvarUltimo(id, cap);

  const marcas = store.marcas();
  const favs = store.favoritos();
  const lido = (store.lidos()[id] || []).includes(cap);

  const htmlVersos = versos
    .map((t, i) => {
      const n = i + 1;
      const k = chaveVerso(id, cap, n);
      const cls = ['vs', marcas[k] ? `mk-${marcas[k].cor}` : '', favs[k] ? 'fav' : ''].filter(Boolean).join(' ');
      return `<span class="${cls}" id="v${n}" data-v="${n}" role="button" tabindex="0" aria-pressed="false"><sup>${n}</sup>${esc(t)}</span>`;
    })
    .join('');

  return {
    titulo: `${l.nome} ${cap}`,
    rolarPara: vsDestaque ? `#v${vsDestaque}` : null,
    html: `
      <header class="barra">
        <a class="icone" href="#/livros/${id}" aria-label="Voltar para os livros">${ICONE.voltar}</a>
        <a class="pilula" href="#/livros/${id}" aria-label="Trocar livro ou capítulo. Atual: ${esc(l.nome)} ${cap}">${esc(l.nome)} ${cap} ${ICONE.baixo}</a>
        <button class="icone" id="aa" aria-label="Tamanho da letra e aparência" style="font-size:17px;font-weight:600">Aa</button>
      </header>
      <article class="leitura" lang="pt-BR" aria-label="${esc(l.nome)} capítulo ${cap}">${htmlVersos}</article>
      <footer class="rodape-cap">
        <a href="${viz.ant ? `#/ler/${viz.ant.livro}/${viz.ant.cap}` : '#/'}" aria-disabled="${!viz.ant}">${ICONE.voltar}${esc(rotuloCurto(viz.ant, id))}</a>
        <button class="btn${lido ? ' lido' : ''}" id="lido" aria-pressed="${lido}">${lido ? `${ICONE.check} Lido` : 'Marcar como lido'}</button>
        <a href="${viz.prox ? `#/ler/${viz.prox.livro}/${viz.prox.cap}` : '#/'}" aria-disabled="${!viz.prox}">${esc(rotuloCurto(viz.prox, id))}${ICONE.seta}</a>
      </footer>`,
    montar(el) {
      el.querySelector('#aa').addEventListener('click', () => abrirOpcoesLeitura());

      const bLido = el.querySelector('#lido');
      bLido.addEventListener('click', () => {
        const on = store.alternarLido(id, cap);
        bLido.classList.toggle('lido', on);
        bLido.setAttribute('aria-pressed', String(on));
        bLido.innerHTML = on ? `${ICONE.check} Lido` : 'Marcar como lido';
        if (on && viz.prox) avisar('Capítulo marcado como lido');
      });

      if (vsDestaque) {
        const v = el.querySelector(`#v${vsDestaque}`);
        if (v) {
          v.classList.add('sel');
          setTimeout(() => v.classList.remove('sel'), 2200);
        }
      }

      // ----- Seleção de versículos -----
      const sel = new Set();
      let folha = null;
      const art = el.querySelector('.leitura');

      const limpar = () => {
        sel.clear();
        $$('.vs.sel', art).forEach((x) => {
          x.classList.remove('sel');
          x.setAttribute('aria-pressed', 'false');
        });
        document.body.classList.remove('com-folha');
      };

      const alternar = (span) => {
        const n = +span.dataset.v;
        if (sel.has(n)) sel.delete(n);
        else sel.add(n);
        span.classList.toggle('sel', sel.has(n));
        span.setAttribute('aria-pressed', String(sel.has(n)));
        if (!sel.size) {
          fecharFolha();
          return;
        }
        if (folha && document.contains(folha.sheet)) atualizarFolha();
        else abrirOpcoesVersos();
      };

      art.addEventListener('click', (e) => {
        const span = e.target.closest('.vs');
        if (span) alternar(span);
      });
      art.addEventListener('keydown', (e) => {
        const span = e.target.closest('.vs');
        if (span && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          alternar(span);
        }
      });

      const chaves = () => [...sel].map((n) => chaveVerso(id, cap, n));
      const refSel = () => referencia(l.nome, cap, [...sel]);
      const textoSel = () =>
        [...sel]
          .sort((a, b) => a - b)
          .map((n) => versos[n - 1])
          .join(' ');

      function atualizarFolha() {
        const s = folha.sheet;
        s.querySelector('#ref-sel').textContent = refSel();
        s.querySelector('#qtd-sel').textContent = sel.size === 1 ? '1 versículo selecionado' : `${sel.size} versículos selecionados`;
        const f = store.favoritos();
        s.querySelector('#fav').setAttribute('aria-pressed', String(chaves().every((k) => f[k])));
        const m = store.marcas();
        const cores = new Set(chaves().map((k) => m[k]?.cor));
        $$('[data-cor]', s).forEach((b) => b.setAttribute('aria-pressed', String(cores.size === 1 && cores.has(b.dataset.cor))));
      }

      function abrirOpcoesVersos() {
        document.body.classList.add('com-folha');
        folha = abrirFolha(
          `<div class="cab">
             <div><strong id="ref-sel"></strong><br><span id="qtd-sel"></span></div>
             <button class="icone" id="fechar" aria-label="Fechar">${ICONE.fechar}</button>
           </div>
           <div style="display:flex;flex-direction:column;gap:10px">
             <span class="rotulo">Marcar com cor</span>
             <div class="cores">
               ${CORES.map((c) => `<button class="cor" data-cor="${c.id}" aria-label="Marcar de ${c.nome}" style="background:var(--mk-${c.id})"></button>`).join('')}
               <button class="cor limpar" id="sem-cor" aria-label="Remover cor">${ICONE.fechar}</button>
             </div>
           </div>
           <div class="acoes">
             <button id="fav" aria-pressed="false">${ICONE.coracao}Favorito</button>
             <button id="copiar">${ICONE.copiar}Copiar</button>
             <button id="img" class="primario">${ICONE.imagem}Imagem</button>
           </div>`,
          {
            titulo: 'Opções do versículo',
            modal: false,
            aoFechar: limpar,
            aoMontar(s, fechar) {
              s.querySelector('#fechar').addEventListener('click', fechar);
              const pintarMarcas = () => {
                const m = store.marcas();
                const f = store.favoritos();
                for (const n of sel) {
                  const span = art.querySelector(`#v${n}`);
                  const k = chaveVerso(id, cap, n);
                  CORES.forEach((c) => span.classList.remove(`mk-${c.id}`));
                  if (m[k]) span.classList.add(`mk-${m[k].cor}`);
                  span.classList.toggle('fav', !!f[k]);
                }
              };
              $$('[data-cor]', s).forEach((b) =>
                b.addEventListener('click', () => {
                  store.marcar(chaves(), b.dataset.cor);
                  pintarMarcas();
                  fechar();
                }),
              );
              s.querySelector('#sem-cor').addEventListener('click', () => {
                store.marcar(chaves(), null);
                pintarMarcas();
                fechar();
              });
              s.querySelector('#fav').addEventListener('click', () => {
                const on = store.alternarFavoritos(chaves());
                pintarMarcas();
                avisar(on ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
                fechar();
              });
              s.querySelector('#copiar').addEventListener('click', async () => {
                const ok = await copiarTexto(`“${textoSel()}”\n${refSel()} (Bíblia Livre)`);
                avisar(ok ? 'Texto copiado' : 'Não foi possível copiar');
                fechar();
              });
              s.querySelector('#img').addEventListener('click', () => {
                const dados = { texto: textoSel(), ref: refSel() };
                fechar();
                abrirCompartilhar(dados);
              });
            },
          },
        );
        atualizarFolha();
      }
    },
  };
}
