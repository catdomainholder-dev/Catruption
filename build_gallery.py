#!/usr/bin/env python3

import os
import json
import hashlib
from pathlib import Path
from datetime import datetime
from html import escape

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("⚠️ Pillow not installed. Image dimensions will be omitted.")


IMAGE_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.bmp', '.svg', '.ico', '.tiff', '.tif',
    '.mp4', '.mov'
}

TEXT_EXTENSIONS = {
    '.txt'
}

PDF_EXTENSIONS = {
    '.pdf'
}

IGNORE_DIRS = {
    '.git', '__pycache__', 'node_modules',
    '.vscode', 'venv', 'env'
}

GALLERY_FOLDER = Path('images/gallery')
OUTPUT_FILE = Path('images/manifest.json')
HTML_OUTPUT_FILE = Path('images/gallery.html')


# ============================================================
# IMAGE INFORMATION
# ============================================================

def image_info(path):
    if not HAS_PIL:
        return {}

    try:
        with Image.open(path) as img:
            return {
                'width': img.width,
                'height': img.height,
                'aspect_ratio': (
                    img.width / img.height
                    if img.height else 1
                ),
                'format': img.format
            }
    except Exception:
        return {}


# ============================================================
# FILE HASH
# ============================================================

def file_hash(path):
    try:
        with open(path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()[:8]
    except Exception:
        return None


# ============================================================
# FOLDER SCANNING
# ============================================================

def scan_folder(folder):
    images = []
    texts = []
    pdfs = []
    subfolders = []

    for item in sorted(folder.iterdir(), key=lambda p: p.name.lower()):

        if item.name.startswith('.') or item.name in IGNORE_DIRS:
            continue

        if item.is_dir():
            sub = scan_folder(item)

            if (
                sub['images'] or
                sub['texts'] or
                sub['pdfs'] or
                sub['subfolders']
            ):
                subfolders.append(sub)

            continue

        extension = item.suffix.lower()

        # ----------------------------------------------------
        # IMAGE
        # ----------------------------------------------------

        if extension in IMAGE_EXTENSIONS:

            data = {
                'filename': item.name,
                'path': item.as_posix(),
                'ext': extension,
                'size': item.stat().st_size,
                'size_kb': round(item.stat().st_size / 1024, 1),
                'modified': datetime.fromtimestamp(
                    item.stat().st_mtime
                ).isoformat(),
                'hash': file_hash(item)
            }

            data.update(image_info(item))
            images.append(data)

            continue

        # ----------------------------------------------------
        # TEXT FILE
        # ----------------------------------------------------

        if extension in TEXT_EXTENSIONS:

            data = {
                'filename': item.name,
                'path': item.as_posix(),
                'ext': extension,
                'type': 'text',
                'size': item.stat().st_size,
                'size_kb': round(item.stat().st_size / 1024, 1),
                'modified': datetime.fromtimestamp(
                    item.stat().st_mtime
                ).isoformat(),
                'hash': file_hash(item)
            }

            texts.append(data)
            continue

        # ----------------------------------------------------
        # PDF FILE
        # ----------------------------------------------------

        if extension in PDF_EXTENSIONS:

            data = {
                'filename': item.name,
                'path': item.as_posix(),
                'ext': extension,
                'type': 'pdf',
                'size': item.stat().st_size,
                'size_kb': round(item.stat().st_size / 1024, 1),
                'modified': datetime.fromtimestamp(
                    item.stat().st_mtime
                ).isoformat(),
                'hash': file_hash(item)
            }

            pdfs.append(data)

    return {
        'name': folder.name,
        'path': folder.as_posix(),

        'images': images,
        'texts': texts,
        'pdfs': pdfs,

        'subfolders': subfolders,

        'total_images': (
            len(images) +
            sum(x['total_images'] for x in subfolders)
        ),

        'total_texts': (
            len(texts) +
            sum(x['total_texts'] for x in subfolders)
        ),

        'total_pdfs': (
            len(pdfs) +
            sum(x['total_pdfs'] for x in subfolders)
        ),

        'total_files': (
            len(images) +
            len(texts) +
            len(pdfs) +
            sum(x['total_files'] for x in subfolders)
        )
    }


# ============================================================
# TITLES
# ============================================================

def make_title(name):
    if name in {'2d', '3d'}:
        return name.upper()

    return (
        name
        .replace('_', ' ')
        .replace('-', ' ')
        .title()
    )


# ============================================================
# FLATTEN IMAGE TREE
# ============================================================

def collect_all_images(folder):
    images = []

    images.extend(folder['images'])

    for subfolder in folder['subfolders']:
        images.extend(
            collect_all_images(subfolder)
        )

    return images


# ============================================================
# GALLERY ITEM GENERATION
# ============================================================

def generate_gallery_fragment(images):

    items = []

    for image in images:

        path = escape(
            image['path'],
            quote=True
        )

        filename = escape(
            image['filename'],
            quote=True
        )

        width = image.get('width')
        height = image.get('height')

        if width and height:

            attrs = (
                f' data-width="{width}"'
                f' data-height="{height}"'
            )

        else:
            attrs = ''

        items.append(
            f'''    <div class="gallery-image">
        <img{attrs} src="{path}" alt="{filename}" loading="lazy">
    </div>'''
        )

    return '\n'.join(items)


# ============================================================
# GALLERY HTML
# ============================================================

def build_gallery_html(images):

    items_html = generate_gallery_fragment(images)

    html = f'''<!-- Gallery fragment for window system -->

<div
    data-gallery-layout
    class="gallery-images"
>
{items_html}
</div>

<style>

    .gallery-images {{
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        align-content: flex-start;
        align-items: flex-start;
        justify-content: center;

        gap: 10px;
        padding: 10px;

        width: 100%;
        height: 100%;

        box-sizing: border-box;

        min-width: 0;
        min-height: 0;

        overflow-x: hidden;
        overflow-y: auto;

        contain: layout;
    }}

    .gallery-image {{
        width: 100%;
        max-width: 100%;

        height: auto;

        box-sizing: border-box;

        min-width: 0;
        min-height: 0;

        overflow: hidden;

        flex-shrink: 1;
    }}

    .gallery-image img {{
        display: block;

        width: 100%;
        height: auto;

        max-width: 100%;
        max-height: none;

        box-sizing: border-box;

        object-fit: contain;
    }}

    .gallery-image img[src$=".mp4"],
    .gallery-image img[src$=".mov"] {{
        width: 100%;
        height: auto;
    }}

</style>
'''

    return html


# ============================================================
# MANIFEST
# ============================================================

def build_manifest():

    print("🎨 Gallery Builder")
    print("==================")
    print(f"📂 Scanning: {GALLERY_FOLDER}/")

    if not GALLERY_FOLDER.exists():

        print(
            f"❌ Missing: {GALLERY_FOLDER}/"
        )

        return

    root = scan_folder(
        GALLERY_FOLDER
    )

    if root['total_files'] == 0:

        print(
            "⚠️ No gallery files found."
        )

        return

    manifest = {

        'version': '2.2',

        'generated':
            datetime.now().isoformat(),

        'base_folder':
            GALLERY_FOLDER.as_posix(),

        'galleries': {},

        'total_images':
            root['total_images'],

        'total_texts':
            root['total_texts'],

        'total_pdfs':
            root['total_pdfs'],

        'total_files':
            root['total_files']
    }

    for folder in root['subfolders']:

        gallery = {

            'id':
                folder['name'],

            'title':
                make_title(
                    folder['name']
                ),

            'path':
                folder['path'],

            'images':
                folder['images'],

            'texts':
                folder['texts'],

            'pdfs':
                folder['pdfs'],

            'subfolders': [],

            'image_count':
                len(folder['images']),

            'text_count':
                len(folder['texts']),

            'pdf_count':
                len(folder['pdfs']),

            'total_count':
                folder['total_files']
        }

        for sub in folder['subfolders']:

            gallery['subfolders'].append({

                'id':
                    sub['name'],

                'title':
                    make_title(
                        sub['name']
                    ),

                'path':
                    sub['path'],

                'images':
                    sub['images'],

                'texts':
                    sub['texts'],

                'pdfs':
                    sub['pdfs'],

                'image_count':
                    len(sub['images']),

                'text_count':
                    len(sub['texts']),

                'pdf_count':
                    len(sub['pdfs']),

                'total_count':
                    sub['total_files']
            })

        manifest['galleries'][
            folder['name']
        ] = gallery

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    # ========================================================
    # WRITE MANIFEST
    # ========================================================

    with open(
        OUTPUT_FILE,
        'w',
        encoding='utf-8'
    ) as f:

        json.dump(
            manifest,
            f,
            indent=2
        )

    # ========================================================
    # WRITE GALLERY HTML
    # ========================================================

    all_images = collect_all_images(
        root
    )

    gallery_html = build_gallery_html(
        all_images
    )

    with open(
        HTML_OUTPUT_FILE,
        'w',
        encoding='utf-8'
    ) as f:

        f.write(
            gallery_html
        )

    # ========================================================
    # OUTPUT
    # ========================================================

    print(
        f"✅ Created {OUTPUT_FILE}"
    )

    print(
        f"🌐 Created {HTML_OUTPUT_FILE}"
    )

    print(
        f"🖼️ {root['total_images']} images"
    )

    print(
        f"📄 {root['total_texts']} text files"
    )

    print(
        f"📕 {root['total_pdfs']} PDF files"
    )

    print(
        f"📁 {len(root['subfolders'])} galleries"
    )

    for name, gallery in manifest[
        'galleries'
    ].items():

        print(
            f"   📁 {gallery['title']}: "
            f"{gallery['image_count']} images, "
            f"{gallery['text_count']} text files, "
            f"{gallery['pdf_count']} PDFs"
        )

    print(
        "\n✅ Done."
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':

    try:

        build_manifest()

    except KeyboardInterrupt:

        print(
            "\n⚠️ Cancelled."
        )

    except Exception as e:

        print(
            f"\n❌ Error: {e}"
        )

        raise