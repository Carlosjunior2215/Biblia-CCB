// Folha que sobe da parte de baixo da tela (opções do versículo, tamanho da letra...).

let aberta = null;

/**
 * Abre a folha com o HTML informado. `aoMontar(el)` liga os botões.
 * `aoFechar()` é chamado quando ela fecha (toque fora, Esc, botão voltar do celular).
 */
export function abrirFolha(html, { titulo = 'Opções', aoMontar, aoFechar, modal = true } = {}) {
  fecharFolha();
  const root = document.getElementById('sheet-root');
  // modal=false: sem fundo escuro, a tela de trás continua tocável (ex.: selecionar mais versículos).
  const overlay = document.createElement('div');
  overlay.className = modal ? 'overlay' : '';
  const sheet = document.createElement('section');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  if (modal) sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', titulo);
  sheet.tabIndex = -1;
  sheet.innerHTML = `<div class="alca" aria-hidden="true"></div>${html}`;
  root.append(overlay, sheet);

  const anterior = document.activeElement;
  const fechar = () => {
    if (aberta !== estado) return;
    aberta = null;
    overlay.remove();
    sheet.remove();
    document.removeEventListener('keydown', tecla);
    if (anterior && anterior.focus) anterior.focus({ preventScroll: true });
    if (aoFechar) aoFechar();
  };
  const tecla = (e) => {
    if (e.key === 'Escape') fechar();
  };
  overlay.addEventListener('click', fechar);
  document.addEventListener('keydown', tecla);
  const estado = { fechar, sheet };
  aberta = estado;
  if (aoMontar) aoMontar(sheet, fechar);
  if (modal) sheet.focus({ preventScroll: true });
  return estado;
}

export function fecharFolha() {
  if (aberta) aberta.fechar();
}

export const folhaAberta = () => !!aberta;
