// Ilustrações do app (SVG desenhado aqui, sem imagens de terceiros). Dourado do Música CCB.

const OURO = '#f2c14e';

// Brilho de 4 pontas (estrelinha).
const brilho = (x, y, r, op = 1) =>
  `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${OURO}" opacity="${op}"/>`;

/** Bíblia aberta com raios de luz e estrelas — topo da tela inicial. */
export function arteCapa() {
  const raios = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI + (Math.PI * (i + 0.5)) / 11;
    const x = 120 + Math.cos(a) * 120;
    const y = 104 + Math.sin(a) * 120;
    return `<line x1="120" y1="96" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="url(#raio)" stroke-width="${i % 2 ? 1.2 : 2.4}"/>`;
  }).join('');
  return `<svg class="arte" viewBox="0 0 240 150" aria-hidden="true">
    <defs>
      <radialGradient id="halo" cx="50%" cy="62%" r="50%">
        <stop offset="0" stop-color="${OURO}" stop-opacity=".55"/>
        <stop offset="1" stop-color="${OURO}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="raio" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="${OURO}" stop-opacity=".7"/>
        <stop offset="1" stop-color="${OURO}" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="pagina" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fffaf0"/>
        <stop offset="1" stop-color="#f5dc8c"/>
      </linearGradient>
    </defs>
    <ellipse cx="120" cy="96" rx="110" ry="64" fill="url(#halo)"/>
    ${raios}
    <path d="M120 104c-18-12-42-16-70-14v40c28-2 52 2 70 14z" fill="url(#pagina)" stroke="${OURO}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M120 104c18-12 42-16 70-14v40c-28-2-52 2-70 14z" fill="url(#pagina)" stroke="${OURO}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M120 104v40" stroke="#c58a17" stroke-width="2"/>
    <g stroke="#c58a17" stroke-width="1.4" stroke-linecap="round" opacity=".55">
      <path d="M64 102q22-2 44 8M64 112q22-2 44 8M64 122q22-2 44 8"/>
      <path d="M176 102q-22-2-44 8M176 112q-22-2-44 8M176 122q-22-2-44 8"/>
    </g>
    <path d="M150 124c2 6 4 18 0 26l4-3 4 3c-4-8-2-20 0-26z" fill="#a46d0c" opacity=".9"/>
    ${brilho(120, 30, 9)}${brilho(52, 44, 5, .8)}${brilho(196, 40, 6, .9)}${brilho(28, 86, 3.5, .6)}${brilho(214, 84, 4, .7)}${brilho(84, 18, 3, .6)}${brilho(164, 14, 3.5, .7)}
  </svg>`;
}

/** Enfeite dourado entre seções: linha, losango, linha. */
export const ORNAMENTO = `<span class="ornamento" aria-hidden="true"><i></i><svg viewBox="0 0 24 12"><path d="M12 1l5 5-5 5-5-5z" fill="${OURO}" stroke="none"/><circle cx="2" cy="6" r="1.4" fill="${OURO}" stroke="none"/><circle cx="22" cy="6" r="1.4" fill="${OURO}" stroke="none"/></svg><i></i></span>`;

/** Símbolos grandes e suaves no canto do título de cada tela. */
export const SIMBOLO = {
  livros: `<svg class="simbolo" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${OURO}" stroke-width="2" stroke-linejoin="round"><rect x="8" y="14" width="10" height="40" rx="2"/><rect x="20" y="8" width="12" height="46" rx="2"/><rect x="34" y="16" width="9" height="38" rx="2"/><path d="M45 20l9-2 6 36-9 2z"/><path d="M23 16h6M23 46h6M11 22h4M11 46h4"/></g></svg>`,
  buscar: `<svg class="simbolo" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${OURO}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 44h30l6-8H22c-6 0-8 8-8 8z"/><path d="M44 44c6 0 10-4 10-8"/><path d="M30 36c-2-6 4-8 2-14 4 4 6 8 4 14"/><path d="M18 50h28"/></g>${brilho(33, 14, 4)}</svg>`,
  hinario: `<svg class="simbolo" viewBox="0 0 64 64" aria-hidden="true"><g fill="${OURO}"><ellipse cx="17" cy="47" rx="7" ry="5.5" transform="rotate(-22 17 47)"/><rect x="22" y="12" width="2.6" height="36"/><path d="M24.6 12c8 4 13 9 10 19-1-6-5-10-10-11z"/><ellipse cx="42" cy="51" rx="6.5" ry="5" transform="rotate(-22 42 51)"/><ellipse cx="56" cy="45" rx="6.5" ry="5" transform="rotate(-22 56 45)"/><rect x="47" y="22" width="2.4" height="29"/><rect x="60.6" y="16" width="2.4" height="29"/><path d="M47 22l16-6v6l-16 6z"/></g></svg>`,
  salvos: `<svg class="simbolo" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${OURO}" stroke-width="2" stroke-linejoin="round"><path d="M32 54C14 42 8 32 8 23c0-7 5-12 12-12 5 0 9 3 12 7 3-4 7-7 12-7 7 0 12 5 12 12 0 9-6 19-24 31z"/></g>${brilho(50, 10, 4)}${brilho(12, 46, 3, .7)}</svg>`,
};
