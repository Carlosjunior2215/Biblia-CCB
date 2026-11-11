// Rolagem automática e leitura em voz alta do capítulo aberto.
// O áudio usa a voz do próprio celular (speechSynthesis): grátis e, na maioria dos aparelhos, funciona sem internet.
import { store } from '../store.js';
import { avisar, $$ } from '../util.js';
import { temVoz, vozEscolhida, carregarVozes } from '../voz.js';

const VEL_ROLAR = [12, 20, 30, 45, 65]; // pixels por segundo
const VEL_VOZ = [0.8, 0.9, 1, 1.15, 1.3];
const CHAVE_SEGUIR = 'bccb:seguirAudio';

const IC = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>',
  parar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
  fone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/></svg>',
  rolar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v14M7 13l5 5 5-5"/><path d="M5 21h14"/></svg>',
  menos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>',
  mais: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg>',
};


/** HTML dos botões que ficam logo depois do texto do capítulo. */
export function botoesLeitor() {
  return `<div class="leitor" id="leitor">
    <div class="leitor-botoes">
      <button class="btn" id="b-rolar">${IC.rolar}Rolar sozinho</button>
      ${temVoz() ? `<button class="btn" id="b-ouvir">${IC.fone}Ouvir</button>` : ''}
    </div>
    <div class="leitor-painel" id="painel" hidden>
      <button class="icone" id="p-pausa" aria-label="Pausar">${IC.pausa}</button>
      <div class="leitor-vel">
        <span id="p-titulo">Velocidade</span>
        <div><button class="icone" id="p-menos" aria-label="Mais devagar">${IC.menos}</button><b id="p-vel">3</b><button class="icone" id="p-mais" aria-label="Mais rápido">${IC.mais}</button></div>
      </div>
      <button class="icone" id="p-parar" aria-label="Parar">${IC.parar}</button>
    </div>
  </div>`;
}

/** Liga os botões. `proximo` é o endereço do próximo capítulo (ou null). */
export function montarLeitor(el, { versos, titulo, proximo }) {
  const painel = el.querySelector('#painel');
  const botoes = el.querySelector('.leitor-botoes');
  const bPausa = el.querySelector('#p-pausa');
  const velEl = el.querySelector('#p-vel');
  let modo = null; // 'rolar' | 'ouvir'
  let pausado = false;
  let raf = 0;
  let ultimo = 0;
  let resto = 0;
  let vsAtual = 0;
  let vivo = true;
  let geracao = 0; // evita que uma fala cancelada dispare a próxima

  const nivel = () => {
    const p = store.prefs();
    return modo === 'ouvir' ? p.velVoz ?? 2 : p.velRolar ?? 2;
  };
  const mostrarVel = () => (velEl.textContent = String(nivel() + 1));
  const iconePausa = () => {
    bPausa.innerHTML = pausado ? IC.play : IC.pausa;
    bPausa.setAttribute('aria-label', pausado ? 'Continuar' : 'Pausar');
  };

  function abrirPainel(m) {
    modo = m;
    pausado = false;
    botoes.hidden = true;
    painel.hidden = false;
    el.querySelector('#p-titulo').textContent = m === 'ouvir' ? 'Velocidade da voz' : 'Velocidade da rolagem';
    iconePausa();
    mostrarVel();
  }

  function calar() {
    geracao++;
    if (temVoz()) speechSynthesis.cancel();
  }

  function parar() {
    cancelAnimationFrame(raf);
    calar();
    $$('.vs.lendo', el).forEach((x) => x.classList.remove('lendo'));
    modo = null;
    painel.hidden = true;
    botoes.hidden = false;
  }

  // ----- Rolagem -----
  function passo(t) {
    if (!vivo || modo !== 'rolar' || pausado) return;
    if (ultimo) {
      resto += (VEL_ROLAR[nivel()] * (t - ultimo)) / 1000;
      const px = Math.floor(resto);
      if (px) {
        resto -= px;
        window.scrollBy(0, px);
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        parar();
        avisar('Fim do capítulo');
        return;
      }
    }
    ultimo = t;
    raf = requestAnimationFrame(passo);
  }
  function iniciarRolar() {
    parar();
    abrirPainel('rolar');
    ultimo = 0;
    raf = requestAnimationFrame(passo);
  }

  // ----- Voz -----
  function falar(i) {
    if (!vivo || modo !== 'ouvir') return;
    $$('.vs.lendo', el).forEach((x) => x.classList.remove('lendo'));
    if (i >= versos.length) {
      parar();
      if (proximo) {
        sessionStorage.setItem(CHAVE_SEGUIR, '1');
        location.hash = proximo;
      }
      return;
    }
    vsAtual = i;
    const span = el.querySelector(`#v${i + 1}`);
    if (span) {
      span.classList.add('lendo');
      span.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const minha = geracao;
    const u = new SpeechSynthesisUtterance((i === 0 ? `${titulo}. ` : '') + versos[i]);
    const v = vozEscolhida();
    u.lang = v ? v.lang : 'pt-BR';
    if (v) u.voice = v;
    u.rate = VEL_VOZ[nivel()];
    u.onend = () => {
      if (minha === geracao && modo === 'ouvir' && !pausado) falar(i + 1);
    };
    speechSynthesis.speak(u);
  }
  function iniciarOuvir(desde = 0) {
    if (!temVoz()) return;
    parar();
    abrirPainel('ouvir');
    carregarVozes().then(() => falar(desde));
  }

  el.querySelector('#b-rolar').addEventListener('click', iniciarRolar);
  el.querySelector('#b-ouvir')?.addEventListener('click', () => {
    // Começa do versículo que estiver no meio da tela (ou do primeiro, se estiver no topo).
    const meio = window.innerHeight / 2;
    const i = $$('.vs', el).findIndex((s) => s.getBoundingClientRect().bottom > meio);
    iniciarOuvir(window.scrollY < 50 || i < 0 ? 0 : i);
  });
  el.querySelector('#p-parar').addEventListener('click', parar);
  bPausa.addEventListener('click', () => {
    pausado = !pausado;
    iconePausa();
    if (modo === 'rolar' && !pausado) {
      ultimo = 0;
      raf = requestAnimationFrame(passo);
    }
    if (modo === 'ouvir') {
      if (pausado) calar();
      else falar(vsAtual);
    }
  });
  const mudarVel = (d) => {
    const n = Math.min(4, Math.max(0, nivel() + d));
    store.salvarPrefs(modo === 'ouvir' ? { velVoz: n } : { velRolar: n });
    mostrarVel();
    // A voz só muda de velocidade numa fala nova: recomeça o versículo atual.
    if (modo === 'ouvir' && !pausado) {
      calar();
      falar(vsAtual);
    }
  };
  el.querySelector('#p-menos').addEventListener('click', () => mudarVel(-1));
  el.querySelector('#p-mais').addEventListener('click', () => mudarVel(1));

  // Tocar no texto durante a rolagem pausa, para ler com calma.
  el.querySelector('.leitura').addEventListener(
    'touchstart',
    () => {
      if (modo === 'rolar' && !pausado) bPausa.click();
    },
    { passive: true },
  );

  // Ao sair da tela, para tudo.
  const sair = () => {
    vivo = false;
    cancelAnimationFrame(raf);
    calar();
    window.removeEventListener('hashchange', sair);
  };
  window.addEventListener('hashchange', sair);

  // Veio ouvindo do capítulo anterior: continua sozinho.
  if (sessionStorage.getItem(CHAVE_SEGUIR)) {
    sessionStorage.removeItem(CHAVE_SEGUIR);
    setTimeout(() => iniciarOuvir(0), 400);
  }
}
