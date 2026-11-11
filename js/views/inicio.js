import { esc, ICONE } from '../util.js';
import { store } from '../store.js';
import { livro, versiculoDoDia } from '../dados.js';
import { abrirOpcoesLeitura } from './opcoes.js';
import { abrirCompartilhar } from './compartilhar.js';
import { arteCapa, ORNAMENTO } from '../arte.js';

// Endereço do app pago que esta Bíblia divulga.
export const LINK_GEM = 'https://musicaccb.com.br';
// Site oficial da CCB, onde a pessoa procura a congregação mais perto.
const LINK_CCB = 'https://www.congregacaocristanobrasil.org.br/';

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export async function telaInicio() {
  const u = store.ultimo();
  const [ultimoLivro, vd] = await Promise.all([u ? livro(u.livro) : null, versiculoDoDia()]);
  const refVd = `${vd.nome} ${vd.cap}:${vd.vs}`;
  const fav = !!store.favoritos()[`${vd.livro}/${vd.cap}/${vd.vs}`];

  const continuar = ultimoLivro
    ? `<a class="continuar" href="#/ler/${u.livro}/${u.cap}">
        <span class="ic">${ICONE.livro}</span>
        <div><small>Continuar lendo</small><strong>${esc(ultimoLivro.nome)} ${u.cap}</strong></div>
        ${ICONE.seta}
      </a>`
    : `<a class="continuar" href="#/ler/gn/1">
        <span class="ic">${ICONE.livro}</span>
        <div><small>Comece a ler</small><strong>Gênesis 1</strong></div>
        ${ICONE.seta}
      </a>`;

  return {
    titulo: 'Início',
    html: `
      <div class="conteudo" style="padding-top:16px">
        <section class="capa" aria-label="Bíblia CCB">
          <div class="cab">
            <div><div class="sub">${saudacao()}</div><h1>Bíblia CCB</h1><p class="lema">A Palavra de Deus sempre com você</p></div>
            <button class="icone borda" id="ajustes" aria-label="Tamanho da letra e tema">${ICONE.ajustes}</button>
          </div>
          ${arteCapa()}
          ${continuar}
        </section>
        <section class="cartao vdia" aria-labelledby="vd-titulo">
          <span class="rotulo" id="vd-titulo">Versículo do dia</span>
          ${ORNAMENTO}
          <p class="texto-biblico">“${esc(vd.texto)}”</p>
          <div class="linha">
            <a class="ref" href="#/ler/${vd.livro}/${vd.cap}/${vd.vs}">${esc(refVd)}</a>
            <div style="display:flex;gap:8px">
              <button class="icone borda" id="vd-fav" aria-label="Favoritar" aria-pressed="${fav}">${ICONE.coracao}</button>
              <button class="icone borda" id="vd-share" aria-label="Compartilhar como imagem">${ICONE.compartilhar}</button>
            </div>
          </div>
        </section>
        <nav class="atalhos" aria-label="Atalhos">
          <a href="#/livros">${ICONE.lista}<span>Livros</span></a>
          <a href="#/buscar">${ICONE.busca}<span>Buscar</span></a>
          <a href="#/salvos">${ICONE.salvo}<span>Salvos</span></a>
        </nav>
        <a class="congregacao" href="${LINK_CCB}" target="_blank" rel="noopener">
          <span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span>
          <div><strong>Encontrar congregação</strong><span>Abre o site oficial da CCB</span></div>
          ${ICONE.seta}
        </a>
        <a class="gem" href="${LINK_GEM}" target="_blank" rel="noopener">
          <img class="notas" src="img/notas.svg" alt="">
          <span class="ic">${ICONE.musica}</span>
          <div><strong>Você é encarregado de música?</strong><span>Conheça o CCB Gestão do GEM</span></div>
          ${ICONE.seta}
        </a>
        <p class="creditos">Texto bíblico: Bíblia Livre (BLIVRE), licença CC BY 4.0. <a href="#/sobre">Sobre o app</a></p>
      </div>`,
    montar(el) {
      el.querySelector('#ajustes').addEventListener('click', () => abrirOpcoesLeitura());
      const bFav = el.querySelector('#vd-fav');
      const pintar = (on) => {
        bFav.setAttribute('aria-pressed', String(on));
        bFav.style.color = on ? '#C2410C' : '';
        bFav.querySelector('svg').style.fill = on ? 'currentColor' : 'none';
      };
      pintar(fav);
      bFav.addEventListener('click', () => pintar(store.alternarFavoritos([`${vd.livro}/${vd.cap}/${vd.vs}`])));
      el.querySelector('#vd-share').addEventListener('click', () => abrirCompartilhar({ texto: vd.texto, ref: refVd }));
    },
  };
}
