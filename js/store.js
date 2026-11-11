// Tudo o que o usuário salva fica no próprio aparelho (localStorage). Sem login, sem servidor.
// Se o navegador bloquear o armazenamento (modo anônimo, por exemplo), o app continua funcionando, só não lembra.

const PREFIXO = 'bccb:';

function ler(chave, padrao) {
  try {
    const v = localStorage.getItem(PREFIXO + chave);
    return v == null ? padrao : JSON.parse(v);
  } catch {
    return padrao;
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    /* armazenamento indisponível ou cheio: ignora */
  }
}

/** Chave de um versículo: "jo/3/16" (livro/capítulo/versículo). */
export const chaveVerso = (livro, cap, vs) => `${livro}/${cap}/${vs}`;

export const CORES = [
  { id: 'amarelo', nome: 'Amarelo', solida: '#E3B830' },
  { id: 'verde', nome: 'Verde', solida: '#4CAF6E' },
  { id: 'azul', nome: 'Azul', solida: '#4A86C8' },
  { id: 'rosa', nome: 'Rosa', solida: '#D46A97' },
  { id: 'laranja', nome: 'Laranja', solida: '#E08A3C' },
];

export const store = {
  // Preferências: tamanho da letra (1 a 4) e tema ('auto' | 'claro' | 'escuro').
  prefs() {
    return { letra: 2, tema: 'escuro', ...ler('prefs', {}) };
  },
  salvarPrefs(p) {
    gravar('prefs', { ...this.prefs(), ...p });
  },

  // Último capítulo aberto, para o "Continuar lendo".
  ultimo() {
    return ler('ultimo', null);
  },
  salvarUltimo(livro, cap) {
    gravar('ultimo', { livro, cap });
  },

  // Marcações com cor: { "jo/3/16": { cor: "amarelo", em: 1731262000000 } }
  marcas() {
    return ler('marcas', {});
  },
  marcar(chaves, cor) {
    const m = this.marcas();
    const agora = Date.now();
    for (const k of chaves) {
      if (cor) m[k] = { cor, em: agora };
      else delete m[k];
    }
    gravar('marcas', m);
  },

  // Favoritos: { "jo/3/16": 1731262000000 }
  favoritos() {
    return ler('favoritos', {});
  },
  /** Liga ou desliga o favorito de um conjunto de versículos. Retorna o novo estado. */
  alternarFavoritos(chaves) {
    const f = this.favoritos();
    const todos = chaves.every((k) => f[k]);
    const agora = Date.now();
    for (const k of chaves) {
      if (todos) delete f[k];
      else f[k] = agora;
    }
    gravar('favoritos', f);
    return !todos;
  },
  removerFavorito(chave) {
    const f = this.favoritos();
    delete f[chave];
    gravar('favoritos', f);
  },

  // Capítulos lidos: { "sl": [1, 2, 23] }
  lidos() {
    return ler('lidos', {});
  },
  alternarLido(livro, cap) {
    const l = this.lidos();
    const lista = new Set(l[livro] || []);
    if (lista.has(cap)) lista.delete(cap);
    else lista.add(cap);
    l[livro] = [...lista].sort((a, b) => a - b);
    gravar('lidos', l);
    return lista.has(cap);
  },

  // Hinos favoritos: { "13": 1731262000000 }
  hinosFav() {
    return ler('hinosFav', {});
  },
  alternarHinoFav(n) {
    const f = this.hinosFav();
    if (f[n]) delete f[n];
    else f[n] = Date.now();
    gravar('hinosFav', f);
    return !!f[n];
  },
  hinosRecentes() {
    return ler('hinosRecentes', []);
  },
  registrarHino(n) {
    const r = this.hinosRecentes().filter((x) => x !== n);
    r.unshift(n);
    gravar('hinosRecentes', r.slice(0, 30));
  },
};
