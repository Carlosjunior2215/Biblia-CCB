// Vozes do celular/computador para ler a Bíblia em voz alta.
// Cada aparelho tem as suas; aqui listamos as do português do Brasil e do inglês e escolhemos a salva pela pessoa.
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

const BR = /^pt[-_]BR$/i;
const EN = /^en([-_]|$)/i;

/** Vozes do português do Brasil (sem Portugal) e do inglês, Brasil primeiro e as mais naturais na frente. */
export function vozesPt(vozes = temVoz() ? speechSynthesis.getVoices() : []) {
  const nota = (v) => (BR.test(v.lang) ? 10 : 0) + (BOAS.test(v.name) ? 1 : 0) + (v.localService ? 0.5 : 0);
  return vozes.filter((v) => BR.test(v.lang) || EN.test(v.lang)).sort((a, b) => nota(b) - nota(a));
}

export const ehIngles = (v) => !!v && EN.test(v.lang);

/** A voz salva pela pessoa ou, se não houver, a melhor em português. */
export function vozEscolhida() {
  const lista = vozesPt();
  const salva = store.prefs().voz;
  return lista.find((v) => v.voiceURI === salva) || lista[0] || null;
}

const PAISES_EN = { US: 'EUA', GB: 'Reino Unido', AU: 'Austrália', IN: 'Índia', CA: 'Canadá', IE: 'Irlanda', ZA: 'África do Sul', NZ: 'Nova Zelândia' };

/** Nome curto para mostrar na tela. */
export function nomeVoz(v) {
  const regiao = (v.lang.split(/[-_]/)[1] || '').toUpperCase();
  const idioma = ehIngles(v) ? `Inglês${PAISES_EN[regiao] ? ` (${PAISES_EN[regiao]})` : ''}` : 'Brasil';
  const nome = v.name
    .replace(/^(Microsoft|Google)\s*/i, '')
    .replace(/\s*-\s*(Portuguese|English).*$/i, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .trim();
  const limpo = ehIngles(v)
    ? nome.replace(/\b(UK|US|GB)\b|\bEnglish\b/gi, '').replace(/\bFemale\b/i, 'feminina').replace(/\bMale\b/i, 'masculina').replace(/\s+/g, ' ').trim()
    : nome;
  const n = limpo || (ehIngles(v) ? 'Voz' : v.name);
  const comIdioma = /brasil|ingl/i.test(n) ? n : `${n} · ${idioma}`;
  return `${comIdioma.charAt(0).toUpperCase()}${comIdioma.slice(1)}${v.localService ? '' : ' · precisa de internet'}`;
}

/** Fala um exemplo curto com a voz informada. */
export function falarExemplo(v) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(
    ehIngles(v) ? 'The Lord is my shepherd; I shall not want.' : 'O Senhor é o meu pastor, nada me faltará.',
  );
  u.lang = v ? v.lang : 'pt-BR';
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
