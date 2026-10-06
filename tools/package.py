"""Build an extension-only ZIP using an explicit manifest-derived file list."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'manifest.json').read_text())
files = {'manifest.json', 'LICENSE', manifest['background']['service_worker']}
for script in manifest['content_scripts']:
    files.update(script.get('js', []))
    files.update(script.get('css', []))
files.update(manifest.get('icons', {}).values())
files.update(manifest.get('action', {}).get('default_icon', {}).values())
# viewer-ui.js is also imported by the service worker and is already in this list.
for file in files:
    path = (root / file).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError(f'Invalid extension file: {file}')
output = root / 'dist'
output.mkdir(exist_ok=True)
archive = output / f'a-fazenda-viewer-{manifest["version"]}.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    for file in sorted(files):
        info = zipfile.ZipInfo(file, date_time=(2026, 10, 5, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        bundle.writestr(info, (root / file).read_bytes())
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(f'{digest}  {archive.name}\n')
print(f'{archive.name}: {len(files)} files, {archive.stat().st_size} bytes')
