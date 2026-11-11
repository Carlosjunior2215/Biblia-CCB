// Vozes do celular/computador para ler a Bíblia em voz alta.
// Cada aparelho tem as suas; aqui listamos só as de português e escolhemos a salva pela pessoa.
import { store } from './store.js';

export const temVoz = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

// Nomes que costumam ser as vozes mais naturais (Google, Microsoft "Natural/Online", Apple).
const BOAS = /natural|online|neural|google|francisca|antonio|thalita|luciana|felipe|enhanced|premium/i;

/** Espera as vozes carregarem (no Chrome elas chegam depois de um instante). */
export function carregarVozes() {
  if (!temVoz()) return Promise.resolve([]);
  const ja = speechSynthesis.getVoices();
  if (ja.length) return Promise.resolve(ja);
  return new Promise((ok) => {
    const fim = () => ok(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', fim, { once: true });
    setTimeout(fim, 1500);
  });
}

/** Só vozes do português do Brasil (decisão do dono: sem Portugal), as mais naturais primeiro. */
export function vozesPt(vozes = temVoz() ? speechSynthesis.getVoices() : []) {
  const nota = (v) => (BOAS.test(v.name) ? 1 : 0) + (v.localService ? 0.5 : 0);
  return vozes.filter((v) => /^pt[-_]BR$/i.test(v.lang)).sort((a, b) => nota(b) - nota(a));
}

/** A voz salva pela pessoa ou, se não houver, a melhor em português. */
export function vozEscolhida() {
  const lista = vozesPt();
  const salva = store.prefs().voz;
  return lista.find((v) => v.voiceURI === salva) || lista[0] || null;
}

/** Nome curto para mostrar na tela. */
export function nomeVoz(v) {
  const pais = /pt[-_]BR/i.test(v.lang) ? 'Brasil' : /pt[-_]PT/i.test(v.lang) ? 'Portugal' : v.lang;
  const nome = v.name.replace(/^(Microsoft|Google)\s*/i, '').replace(/\s*-\s*Portuguese.*$/i, '').replace(/\s*\(.*\)\s*$/, '').trim();
  const n = nome || v.name;
  const comPais = new RegExp(pais, 'i').test(n) ? n : `${n} · ${pais}`;
  return `${comPais.charAt(0).toUpperCase()}${comPais.slice(1)}${v.localService ? '' : ' · precisa de internet'}`;
}

/** Fala um exemplo curto com a voz informada. */
export function falarExemplo(v) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance('O Senhor é o meu pastor, nada me faltará.');
  u.lang = 'pt-BR';
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
