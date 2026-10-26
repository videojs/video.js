"""Concatenate one LibriVox book's 64kbps MP3s into a single MP3 and emit chapter offsets.

Usage: python3 -I concat.py <book_json> <item_dir> <out_prefix>
Writes <out_prefix>.m4a, <out_prefix>.json (book + chapters with exact start/end), <out_prefix>.vtt (chapters).
"""
import json, subprocess, sys, pathlib

book_json, item_dir, out = sys.argv[1], pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
book = json.load(open(book_json))['books'][0]

def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,sample_rate,channels,bit_rate',
                        '-of', 'json', str(path)], capture_output=True, text=True, check=True)
    j = json.loads(r.stdout)
    s = j['streams'][0]
    return float(j['format']['duration']), (s.get('codec_name'), s.get('sample_rate'), s.get('channels'), s.get('bit_rate'))

files = []
for sec in book['sections']:
    name = sec['listen_url'].rsplit('/', 1)[-1]
    p = item_dir / name
    assert p.is_file() and p.stat().st_size > 0, p
    files.append((sec, p))

params = {probe(p)[1] for _, p in files}
print('stream params', params)

chapters, t = [], 0.0
for sec, p in files:
    dur, _ = probe(p)
    chapters.append({'index': int(sec['section_number']) - 1, 'title': sec['title'], 'start': round(t, 3), 'end': round(t + dur, 3),
                     'readers': [r['display_name'] for r in sec['readers']], 'source': sec['listen_url']})
    t += dur

listfile = out.with_suffix('.txt')
listfile.write_text(''.join(f"file '{p.resolve()}'\n" for _, p in files))
# Multi-reader books mix sample rates and channel counts, so decode and re-encode to one AAC stream.
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(listfile), '-vn', '-map_metadata', '-1',
                '-af', 'aresample=44100', '-ac', '1', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(out.with_suffix('.m4a'))], check=True)
total, _ = probe(out.with_suffix('.m4a'))

def ts(x):
    h, m, s = int(x // 3600), int(x % 3600 // 60), x % 60
    return f'{h:02d}:{m:02d}:{s:06.3f}'

vtt = 'WEBVTT\n\n' + ''.join(f"{c['index'] + 1}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['title']}\n\n" for c in chapters)
out.with_suffix('.vtt').write_text(vtt)
meta = {
    'librivoxId': book['id'], 'title': book['title'], 'authors': [f"{a['first_name']} {a['last_name']}".strip() for a in book['authors']],
    'year': book['copyright_year'], 'language': book['language'], 'genres': [g['name'] for g in book.get('genres', [])],
    'description': book.get('description'), 'librivoxUrl': book['url_librivox'], 'archiveUrl': book['url_iarchive'],
    'textSource': book['url_text_source'], 'readers': sorted({r for c in chapters for r in c['readers']}),
    'duration': round(total, 3), 'librivoxTotalSecs': int(book['totaltimesecs']), 'chapters': chapters,
}
out.with_suffix('.json').write_text(json.dumps(meta, indent=2))
print(out.name, 'chapters', len(chapters), 'sum', round(t, 1), 'concat', round(total, 1), 'librivox', book['totaltimesecs'],
      'size MB', round(out.with_suffix('.m4a').stat().st_size / 1e6, 1))
