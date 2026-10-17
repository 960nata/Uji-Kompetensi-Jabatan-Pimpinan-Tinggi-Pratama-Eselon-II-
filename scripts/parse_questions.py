"""
Konversi PDF naskah soal + kunci jawaban menjadi public/data/questions.json.

Pemakaian:
    pip install pypdf
    python scripts/parse_questions.py <naskah_soal.pdf> <kunci_jawaban.pdf> public/data/questions.json
"""
import re, json, sys
from pypdf import PdfReader

if len(sys.argv) != 4:
    sys.exit(__doc__)
SOAL_PDF, KUNCI_PDF, out = sys.argv[1:]

def pdf_text(path):
    return '\n'.join(p.extract_text() for p in PdfReader(path).pages)

def clean_pages(txt, head):
    lines = txt.split('\n'); res = []; skip = False
    for l in lines:
        if l.startswith(head): skip = True; continue
        if skip:
            if re.match(r'^Halaman \d+', l): skip = False
            continue
        res.append(l)
    return res

def norm(s): return re.sub(r'\s+', ' ', s).strip()

# ---------- soal ----------
L = clean_pages(pdf_text(SOAL_PDF), 'NASKAH SOAL — KODE A')
start = next(i for i,l in enumerate(L) if l.startswith('BAGIAN I —'))
L = L[start:]
sections = [("I","Kebijakan & Regulasi Adminduk"),("II","Pelayanan Publik, Inovasi & Transformasi Digital"),
            ("III","Pencatatan Sipil & Pendaftaran Penduduk"),("IV","Data & Kebijakan Kependudukan"),
            ("V","Sosial Kultural, Wawasan Kebangsaan & Kepemimpinan")]
qs = {}; essays = {}; cur = None; curopt = None; expect = 1
buf_skip_header = False
for l in L:
    if re.match(r'^BAGIAN [IVX]+ —', l) or re.search(r'\(Soal \d+–\d+\)', l) or l.startswith('Petunjuk:') or l.startswith('penilai.'):
        curopt = None
        if cur is not None and not l.startswith('BAGIAN'): pass
        continue
    m = re.match(r'^(\d+)\.\s+(.*)', l)
    if m and int(m.group(1)) == expect:
        n = expect; expect += 1
        cur = {'no': n, 'q': m.group(2), 'opts': {}}
        (qs if n <= 450 else essays)[n] = cur; curopt = None; continue
    m = re.match(r'^([A-E])\.\s+(.*)', l)
    if m and cur and cur['no'] <= 450 and (curopt is None and m.group(1)=='A' or curopt and ord(m.group(1))==ord(curopt)+1):
        curopt = m.group(1); cur['opts'][curopt] = m.group(2); continue
    if cur is None or not l.strip(): continue
    if '— SELAMAT' in l or 'SELESAI' in l: continue
    if '— AKHIR NASKAH' in l: break
    if curopt: cur['opts'][curopt] += ' ' + l
    else: cur['q'] += ' ' + l

# ---------- kunci ----------
K = clean_pages(pdf_text(KUNCI_PDF), 'KUNCI JAWABAN & PEDOMAN PENILAIAN')
kidx = next(i for i,l in enumerate(K) if l.startswith('B. PEDOMAN'))
toks = [t.strip() for t in K[:kidx] if t.strip()]
keys = {}
for a,b in zip(toks, toks[1:]):
    if re.fullmatch(r'\d+', a) and re.fullmatch(r'[A-E]', b): keys[int(a)] = b
pidx = next(i for i,l in enumerate(K) if l.startswith('C. POKOK'))
pok = {}; cur = None; inpok = False
for l in K[pidx+1:]:
    m = re.match(r'^(4[5-9]\d|500)\.\s+', l)
    if m: cur = int(m.group(1)); pok[cur] = ''; inpok = False; continue
    if l.startswith('Pokok jawaban:'): inpok = True; pok[cur] = l[len('Pokok jawaban:'):]; continue
    if 'D. LAMPIRAN' in l or l.strip()=='---': break
    if cur and inpok: pok[cur] += ' ' + l

mc = []
for n in range(1, 451):
    q = qs[n]; o = q['opts']
    assert len(o) == 5, (n, o.keys())
    assert n in keys, n
    mc.append({'id': n, 'section': sections[(n-1)//90][0], 'question': re.sub(r'\s+[A-Z][A-Z ,:&/]{8,}(\(Soal \d+–\d+\))?$', '', norm(q['q'])),
               'options': [norm(o[k]) for k in 'ABCDE'], 'answer': 'ABCDE'.index(keys[n])})
es = []
for n in range(451, 501):
    es.append({'id': n, 'question': norm(essays[n]['q']), 'keyPoints': norm(pok.get(n, '')).rstrip(' -')})
    assert es[-1]['keyPoints'], n
json.dump({'sections': [{'id':a,'title':b} for a,b in sections], 'mc': mc, 'essay': es},
          open(out, 'w'), ensure_ascii=False, indent=1)
print('ok', len(mc), len(es))
