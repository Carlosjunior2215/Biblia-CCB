"""Confere os resumos (um por capítulo) e gera data/resumos/livros.json com os livros completos."""
import json, pathlib, sys
raiz = pathlib.Path(__file__).resolve().parent.parent
livros = json.loads((raiz / 'data/livros.json').read_text())
ok, faltam, erro = [], [], False
for l in livros:
    f = raiz / f"data/resumos/{l['id']}.json"
    if not f.exists():
        faltam.append(l['id']); continue
    r = json.loads(f.read_text())
    if len(r) != l['caps'] or any(not isinstance(x, str) or not x.strip() for x in r):
        print(f"ERRO {l['id']}: {len(r)} resumos para {l['caps']} capítulos"); erro = True; continue
    ok.append(l['id'])
(raiz / 'data/resumos/livros.json').write_text(json.dumps(ok))
total = sum(l['caps'] for l in livros if l['id'] in ok)
print(f"{len(ok)} livros, {total} de 1189 capítulos com resumo. Faltam: {' '.join(faltam)}")
sys.exit(1 if erro else 0)
