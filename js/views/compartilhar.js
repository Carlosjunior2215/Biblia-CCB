// Folha de compartilhar versículo como imagem (com prévia e escolha de fundo).
import { abrirFolha } from '../sheet.js';
import { esc, avisar, $$, ICONE } from '../util.js';
import { FUNDOS, desenhar, compartilharImagem } from '../imagem.js';

let ultimoFundo = 'azul';

export function abrirCompartilhar(dados) {
  abrirFolha(
    `<div class="cab"><strong>${esc(dados.ref)}</strong><span>Imagem para WhatsApp</span></div>
     <div class="previa-img">
       <canvas aria-label="Prévia da imagem"></canvas>
       <div>
         <span class="rotulo">Fundo</span>
         <div class="fundos">
           ${FUNDOS.map((f) => `<button data-fundo="${f.id}" aria-label="Fundo ${f.nome}" aria-pressed="${f.id === ultimoFundo}" style="background:${f.cor}"></button>`).join('')}
         </div>
         <div style="flex:1"></div>
         <button class="btn whats" id="enviar">${ICONE.compartilhar} Enviar</button>
       </div>
     </div>`,
    {
      titulo: 'Compartilhar versículo como imagem',
      aoMontar(sheet, fechar) {
        const cv = sheet.querySelector('canvas');
        const redesenhar = () => desenhar(cv, dados, ultimoFundo);
        redesenhar();
        $$('[data-fundo]', sheet).forEach((b) =>
          b.addEventListener('click', () => {
            ultimoFundo = b.dataset.fundo;
            $$('[data-fundo]', sheet).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            redesenhar();
          }),
        );
        sheet.querySelector('#enviar').addEventListener('click', async () => {
          const r = await compartilharImagem(dados, ultimoFundo);
          if (r === 'baixado') avisar('Imagem salva. Envie pelo WhatsApp a partir da galeria.');
          if (r !== 'cancelado') fechar();
        });
      },
    },
  );
}
