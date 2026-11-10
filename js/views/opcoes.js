// Folha "Aa": tamanho da letra e tema (automático, claro, escuro).
import { store } from '../store.js';
import { abrirFolha } from '../sheet.js';
import { $$ } from '../util.js';
import { aplicarPrefs } from '../tema.js';

const LETRAS = ['Pequena', 'Normal', 'Grande', 'Muito grande'];
const TEMAS = [['auto', 'Automático'], ['claro', 'Claro'], ['escuro', 'Escuro']];

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
     </div>`,
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
