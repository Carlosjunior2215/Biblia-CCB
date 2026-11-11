// Folha "Aa": tamanho da letra e tema (automático, claro, escuro).
import { store } from '../store.js';
import { abrirFolha } from '../sheet.js';
import { $$ } from '../util.js';
import { aplicarPrefs } from '../tema.js';
import { temVoz, carregarVozes, vozesPt, vozEscolhida, nomeVoz, falarExemplo } from '../voz.js';
import { esc } from '../util.js';

const LETRAS = ['Pequena', 'Normal', 'Grande', 'Muito grande'];
const TEMAS = [['escuro', 'Noite'], ['claro', 'Dia'], ['auto', 'Automático']];

export function abrirOpcoesLeitura() {
  const p = store.prefs();
  abrirFolha(
    `<div class="cab"><strong>Leitura</strong></div>
     <div style="display:flex;flex-direction:column;gap:10px">
       <span class="rotulo">Tamanho da letra</span>
       <div class="opcoes-letra">
         ${LETRAS.map((n, i) => `<button data-letra="${i + 1}" aria-label="Letra ${n}" aria-pressed="${p.letra === i + 1}" style="font-size:${13 + i * 3}px">A</button>`).join('')}
       </div>
     </div>
     <div style="display:flex;flex-direction:column;gap:10px">
       <span class="rotulo">Aparência</span>
       <div class="opcoes-tema">
         ${TEMAS.map(([id, n]) => `<button data-tema="${id}" aria-pressed="${p.tema === id}">${n}</button>`).join('')}
       </div>
     </div>
     ${temVoz() ? `<div style="display:flex;flex-direction:column;gap:10px">
       <span class="rotulo">Voz do botão Ouvir</span>
       <div class="vozes" id="vozes"><span class="aviso">Procurando as vozes do aparelho…</span></div>
     </div>` : ''}`,
    {
      titulo: 'Tamanho da letra e aparência',
      aoMontar(sheet) {
        $$('[data-letra]', sheet).forEach((b) =>
          b.addEventListener('click', () => {
            store.salvarPrefs({ letra: +b.dataset.letra });
            $$('[data-letra]', sheet).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            aplicarPrefs();
          }),
        );
        montarVozes(sheet);
        $$('[data-tema]', sheet).forEach((b) =>
          b.addEventListener('click', () => {
            store.salvarPrefs({ tema: b.dataset.tema });
            $$('[data-tema]', sheet).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            aplicarPrefs();
          }),
        );
      },
    },
  );
}

async function montarVozes(sheet) {
  const box = sheet.querySelector('#vozes');
  if (!box) return;
  await carregarVozes();
  const lista = vozesPt();
  if (!lista.length) {
    box.innerHTML = `<p class="aviso">Este aparelho não tem voz em português instalada. No Android: Configurações › Acessibilidade › Conversão de texto em voz › baixe "Português (Brasil)". No Windows: Configurações › Hora e idioma › Fala › Adicionar vozes.</p>`;
    return;
  }
  const atual = vozEscolhida();
  box.innerHTML =
    lista
      .map(
        (v, i) => `<button class="voz" data-i="${i}" aria-pressed="${v === atual}">
          <span>${esc(nomeVoz(v))}</span><b aria-hidden="true">▶</b></button>`,
      )
      .join('') + `<p class="aviso">Toque numa voz para ouvir um exemplo; ela fica escolhida. As vozes dependem do aparelho.</p>`;
  $$('.voz', box).forEach((b) =>
    b.addEventListener('click', () => {
      const v = lista[+b.dataset.i];
      store.salvarPrefs({ voz: v.voiceURI });
      $$('.voz', box).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      falarExemplo(v);
    }),
  );
}
