import { store } from './store.js';

/** Aplica tema (claro/escuro) e tamanho de letra salvos. */
export function aplicarPrefs() {
  const p = store.prefs();
  let tema = p.tema;
  if (tema === 'auto') tema = matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  document.documentElement.dataset.tema = tema;
  document.documentElement.dataset.letra = String(p.letra);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = tema === 'escuro' ? '#1a2a4a' : '#1c2c4c';
}
