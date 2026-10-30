#!/usr/bin/env python3
"""Baixa e otimiza fotografias independentes indicadas pelo jogo.

Fontes selecionadas: Pexels (licenca de uso em https://www.pexels.com/license/).
Nao enviar dados do jogador a provedores externos; somente esta tarefa de preparo
baixa as fotos. O jogo pronto serve arquivos locais.
"""
import io
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
OUTPUT = ROOT / "public" / "assets" / "social" / "unique"

# Fonte adicional apenas em caso de problemas transitorios com o CDN.
SOURCE_URL = "https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=1300"


def load_sources():
    html = HTML.read_text(encoding="utf-8")
    match = re.search(r"const originalPhotoSources=(\{.*?\});", html, re.S)
    if not match:
        raise RuntimeError("Mapa originalPhotoSources ausente em index.html")
    sources = json.loads(match.group(1))
    if len(sources) != len(set(sources.values())):
        raise RuntimeError("IDs repetidos! Cada fotografia deve usar fonte diferente.")
    expected = 12 + 12 + 5 + 7
    if len(sources) != expected:
        raise RuntimeError(f"Esperadas {expected} fotografias, encontradas {len(sources)}")
    return sources


def download_photo(photo_id):
    url = SOURCE_URL.format(pid=photo_id)
    req = urllib.request.Request(url, headers={
        "User-Agent": "PorTrasDaOferta/1.0 (educational demo image bundler)"
    })
    for retry in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as response:
                data = response.read(12_000_000)
                if not response.headers.get("Content-Type", "").startswith("image/"):
                    raise ValueError(f"Resposta nao e imagem: {url}")
            return data
        except (urllib.error.URLError, TimeoutError) as exc:
            if retry == 2:
                raise RuntimeError(f"Imagem {photo_id} nao foi encontrada: {exc}") from exc
            time.sleep((retry + 1) * 2)


def save_photo(path, data, portrait):
    image = Image.open(io.BytesIO(data))
    image = ImageOps.exif_transpose(image).convert("RGB")
    maximum = (860, 1400) if portrait else (1100, 1100)
    image.thumbnail(maximum, Image.Resampling.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "JPEG", quality=79, optimize=True, progressive=True)
    if path.stat().st_size > 350_000:
        raise RuntimeError(f"Foto excede limite de peso: {path.name}")
    return image.size, path.stat().st_size


def main():
    sources = load_sources()
    errors = []
    manifest = []
    for name, photo_id in sources.items():
        target = OUTPUT / (name.replace("_", "-") + ".jpg")
        if target.exists():
            with Image.open(target) as existing:
                size = existing.size
            nbytes = target.stat().st_size
            manifest.append({"asset": target.name, "pexels_photo_id": photo_id,
                             "url": f"https://www.pexels.com/photo/{photo_id}/",
                             "resolution": f"{size[0]}x{size[1]}", "bytes": nbytes})
            print(f"OK cached {target.name}: {size}, {nbytes // 1024} KiB")
            continue
        try:
            data = download_photo(photo_id)
            size, nbytes = save_photo(target, data, name.startswith("story_"))
            manifest.append({"asset": target.name, "pexels_photo_id": photo_id,
                             "url": f"https://www.pexels.com/photo/{photo_id}/",
                             "resolution": f"{size[0]}x{size[1]}", "bytes": nbytes})
            print(f"OK {target.name}: {size}, {nbytes // 1024} KiB")
        except Exception as exc:
            errors.append(f"{name}: {exc}")
            print(f"ERROR {name}: {exc}", file=sys.stderr)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "sources.json").write_text(
        json.dumps({"provider": "Pexels", "images": manifest}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    if errors:
        print("\nFalha ao baixar algumas imagens:", file=sys.stderr)
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)
    print(f"\nImagens conferidas: {len(sources)} arquivos locais, IDs distintos.")


if __name__ == "__main__":
    main()
