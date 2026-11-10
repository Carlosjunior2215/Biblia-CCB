// Ponto de entrada: aplica preferências, cuida da navegação entre telas e registra o modo offline.
import { store } from './store.js';
import { $$ } from './util.js';
import { fecharFolha } from './sheet.js';
import { aplicarPrefs } from './tema.js';
import { telaInicio } from './views/inicio.js';
import { telaLivros } from './views/livros.js';
import { telaLeitura } from './views/leitura.js';
import { telaBusca } from './views/busca.js';
import { telaSalvos } from './views/salvos.js';
import { telaHinario, telaHino } from './views/hinario.js';
import { telaSobre } from './views/sobre.js';

const view = document.getElementById('view');

// Rotas: #/  #/livros  #/ler/sl/23  #/buscar?q=amor  #/salvos  #/hinario  #/hino/13  #/sobre
const ROTAS = [
  { re: /^\/?$/, aba: 'inicio', tela: () => telaInicio() },
  { re: /^\/livros(?:\/(\w+))?$/, aba: 'ler', tela: (m) => telaLivros(m[1]) },
  { re: /^\/ler$/, aba: 'ler', tela: () => irParaUltimo() },
  { re: /^\/ler\/(\w+)\/(\d+)(?:\/(\d+))?$/, aba: 'ler', tela: (m) => telaLeitura(m[1], +m[2], m[3] ? +m[3] : null) },
  { re: /^\/buscar$/, aba: 'buscar', tela: (m, q) => telaBusca(q) },
  { re: /^\/salvos$/, aba: 'salvos', tela: (m, q) => telaSalvos(q) },
  { re: /^\/hinario$/, aba: 'hinario', tela: (m, q) => telaHinario(q) },
  { re: /^\/hino\/(\d+)$/, aba: 'hinario', tela: (m) => telaHino(+m[1]) },
  { re: /^\/sobre$/, aba: 'inicio', tela: () => telaSobre() },
];

function irParaUltimo() {
  const u = store.ultimo();
  location.replace(u ? `#/ler/${u.livro}/${u.cap}` : '#/livros');
}

let rodada = 0;
async function rotear() {
  fecharFolha();
  const bruto = location.hash.replace(/^#/, '') || '/';
  const [caminho, busca = ''] = bruto.split('?');
  const q = new URLSearchParams(busca);
  const rota = ROTAS.find((r) => r.re.test(caminho)) || ROTAS[0];
  const m = caminho.match(rota.re) || [];

  $$('.tabbar a').forEach((a) => {
    if (a.dataset.tab === rota.aba) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  const minha = ++rodada;
  try {
    const resultado = await rota.tela(m, q);
    if (minha !== rodada || resultado == null) return; // o usuário já foi para outra tela
    const { html, titulo, montar, rolarPara } = resultado;
    view.innerHTML = html;
    document.title = titulo ? `${titulo} · Bíblia CCB` : 'Bíblia CCB';
    if (montar) montar(view);
    if (rolarPara) {
      const { sel, block } = typeof rolarPara === 'string' ? { sel: rolarPara, block: 'center' } : rolarPara;
      const alvo = view.querySelector(sel);
      if (alvo) alvo.scrollIntoView({ block });
    } else {
      window.scrollTo(0, 0);
    }
  } catch (e) {
    console.error(e);
    if (minha !== rodada) return;
    view.innerHTML = `<div class="vazio">Não foi possível abrir esta parte agora.<br>Verifique a internet e tente de novo.<br><br><a class="btn" href="#/">Voltar ao início</a></div>`;
  }
}

aplicarPrefs();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', aplicarPrefs);
window.addEventListener('hashchange', rotear);
rotear();

// Modo offline e instalação no celular.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker não registrado', e));
  });
}
