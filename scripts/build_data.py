"""Gera os arquivos de dados do app a partir do JSON da Bíblia Livre.

Uso:
    python3 scripts/build_data.py caminho/para/biblialivrecorrecao1.json

Saída:
    data/livros.json         índice dos 66 livros (id, nome, abreviação, testamento, nº de capítulos)
    data/biblia/<abrev>.json um arquivo por livro: lista de capítulos, cada um uma lista de versículos

Fonte: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio e Marco Teles,
licença Creative Commons Atribuição 4.0. Arquivo JSON de Everson Silva
(github.com/eversondeveloper/bibialivrejson).
"""
import ast
import re
import json
import sys
from pathlib import Path

# Abreviações curtas e estáveis usadas nas URLs do app (#/ler/<abrev>/<cap>).
ABREVS = [
    "gn", "ex", "lv", "nm", "dt", "js", "jz", "rt", "1sm", "2sm", "1rs", "2rs", "1cr", "2cr",
    "ed", "ne", "et", "jo", "sl", "pv", "ec", "ct", "is", "jr", "lm", "ez", "dn", "os", "jl",
    "am", "ob", "jn", "mq", "na", "hc", "sf", "ag", "zc", "ml",
    "mt", "mc", "lc", "joa", "at", "rm", "1co", "2co", "gl", "ef", "fp", "cl", "1ts", "2ts",
    "1tm", "2tm", "tt", "fm", "hb", "tg", "1pe", "2pe", "1jo", "2jo", "3jo", "jd", "ap",
]
TOTAL_VERSICULOS = 31102


def limpar(v: str) -> str:
    """Só ajusta espaços (ex.: "Davi:O SENHOR" -> "Davi: O SENHOR"); não muda palavras."""
    v = " ".join(v.split())
    return re.sub(r"(?<=[a-zà-ú]):(?=[A-ZÀ-Ú])", ": ", v)


def main(src: str) -> None:
    raw = json.loads(Path(src).read_text(encoding="utf-8-sig"))
    livros = [b for b in raw if b.get("nome")]
    if len(livros) != 66:
        sys.exit(f"Esperava 66 livros, encontrei {len(livros)}")

    root = Path(__file__).resolve().parent.parent / "data"
    (root / "biblia").mkdir(parents=True, exist_ok=True)

    indice, total = [], 0
    for i, (livro, abrev) in enumerate(zip(livros, ABREVS)):
        caps = livro["capitulos"]
        if isinstance(caps, str):
            caps = ast.literal_eval(caps)  # o arquivo de origem guarda a lista como texto
        caps = [[limpar(v) for v in cap] for cap in caps]
        total += sum(len(c) for c in caps)
        (root / "biblia" / f"{abrev}.json").write_text(
            json.dumps(caps, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
        indice.append({
            "id": abrev,
            "nome": livro["nome"],
            "t": "AT" if i < 39 else "NT",
            "caps": len(caps),
            "versos": [len(c) for c in caps],
        })

    if total != TOTAL_VERSICULOS:
        sys.exit(f"Contagem de versículos inesperada: {total}")
    (root / "livros.json").write_text(
        json.dumps(indice, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(f"OK: 66 livros, {total} versículos")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
