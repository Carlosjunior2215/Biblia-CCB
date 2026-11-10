// Gera a imagem do versículo (1080 x 1350, formato bom para WhatsApp/Status) e compartilha.

export const FUNDOS = [
  { id: 'azul', nome: 'Azul', cor: '#1F4E79', cor2: '#163A5C' },
  { id: 'verde', nome: 'Verde', cor: '#2F5D46', cor2: '#224634' },
  { id: 'grafite', nome: 'Grafite', cor: '#2B2F36', cor2: '#1C1F24' },
];

const L = 1080;
const A = 1350;

function quebrarLinhas(ctx, texto, largura) {
  const palavras = texto.split(/\s+/);
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > largura && atual) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Desenha no canvas informado (que pode ser a prévia pequena ou a imagem final). */
export function desenhar(canvas, { texto, ref }, fundoId = 'azul') {
  const f = FUNDOS.find((x) => x.id === fundoId) || FUNDOS[0];
  canvas.width = L;
  canvas.height = A;
  const ctx = canvas.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, A);
  g.addColorStop(0, f.cor);
  g.addColorStop(1, f.cor2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L, A);

  const margem = 110;
  const largura = L - margem * 2;
  const serif = 'Literata, Georgia, "Times New Roman", serif';
  const sans = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  // Ajusta o tamanho da letra para o texto caber.
  const citacao = `“${texto}”`;
  let tam = 64;
  let linhas;
  for (; tam >= 30; tam -= 2) {
    ctx.font = `${tam}px ${serif}`;
    linhas = quebrarLinhas(ctx, citacao, largura);
    if (linhas.length * tam * 1.45 <= A - 520) break;
  }
  const alturaTexto = linhas.length * tam * 1.45;
  let y = (A - alturaTexto) / 2 - 20;

  // Ícone de livro aberto no topo
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  const ix = margem;
  const iy = 120;
  ctx.beginPath();
  ctx.moveTo(ix + 40, iy + 12);
  ctx.bezierCurveTo(ix + 30, iy + 4, ix + 15, iy, ix, iy);
  ctx.lineTo(ix, iy + 56);
  ctx.bezierCurveTo(ix + 15, iy + 56, ix + 30, iy + 60, ix + 40, iy + 68);
  ctx.bezierCurveTo(ix + 50, iy + 60, ix + 65, iy + 56, ix + 80, iy + 56);
  ctx.lineTo(ix + 80, iy);
  ctx.bezierCurveTo(ix + 65, iy, ix + 50, iy + 4, ix + 40, iy + 12);
  ctx.lineTo(ix + 40, iy + 68);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'top';
  ctx.font = `${tam}px ${serif}`;
  for (const ln of linhas) {
    ctx.fillText(ln, margem, y);
    y += tam * 1.45;
  }

  ctx.font = `700 44px ${sans}`;
  ctx.fillText(ref, margem, A - 240);
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.font = `400 30px ${sans}`;
  ctx.fillText('Bíblia CCB · Bíblia Livre', margem, A - 180);
}

/** Cria o arquivo PNG e abre o compartilhamento do celular (WhatsApp etc.). Sem suporte, baixa a imagem. */
export async function compartilharImagem(dados, fundoId) {
  const canvas = document.createElement('canvas');
  desenhar(canvas, dados, fundoId);
  const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/png'));
  const nome = `${dados.ref.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;
  const arquivo = new File([blob], nome, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], text: `${dados.ref} — Bíblia CCB` });
      return 'compartilhado';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelado';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'baixado';
}
