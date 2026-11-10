import { ICONE } from '../util.js';
import { LINK_GEM } from './inicio.js';

export async function telaSobre() {
  return {
    titulo: 'Sobre',
    html: `
      <header class="barra">
        <a class="icone" href="#/" aria-label="Voltar ao início">${ICONE.voltar}</a>
        <h1>Sobre o app</h1>
        <span style="width:44px"></span>
      </header>
      <div class="conteudo" style="line-height:1.6;font-size:15px">
        <section class="cartao">
          <strong>Bíblia CCB</strong>
          <span>App gratuito, sem login e sem propaganda no meio da leitura. Funciona sem internet depois da primeira visita e pode ser instalado no celular (no navegador, toque em “Adicionar à tela inicial”).</span>
          <span>Seus favoritos, marcações e capítulos lidos ficam guardados só neste aparelho.</span>
        </section>
        <section class="cartao">
          <strong>Texto bíblico</strong>
          <span>Bíblia Livre (BLIVRE) © Diego Santos, Mario Sérgio e Marco Teles. Licença <a href="https://creativecommons.org/licenses/by/4.0/deed.pt-br" target="_blank" rel="noopener">Creative Commons Atribuição 4.0</a>. O texto foi apenas reorganizado em arquivos para o app, sem alterar as palavras. Mais informações em <a href="https://sites.google.com/site/biblialivre/" target="_blank" rel="noopener">sites.google.com/site/biblialivre</a>.</span>
        </section>
        <a class="gem" href="${LINK_GEM}" target="_blank" rel="noopener">
          <span class="ic">${ICONE.musica}</span>
          <div><strong>Você é encarregado de música?</strong><span>Conheça o CCB Gestão do GEM</span></div>
          ${ICONE.seta}
        </a>
      </div>`,
  };
}
