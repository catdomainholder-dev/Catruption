// ============================================
// GALLERY SYSTEM - Packery + ResizeObserver
// ============================================

console.log("🖼️ Gallery System loaded (Packery + ResizeObserver)");

class GallerySystem {

    constructor() {
        this.manifest = null;
        this.manifestPath = null;
        this.container = null;
        this.currentGallery = null;
        this.history = [];
        this.packeryInstances = [];
        this._resizeObserver = null;
        this._resizeTimer = null;
        this._observedContainer = null;
    }

    // ========================================
    // LOAD MANIFEST
    // ========================================

    async loadManifest(path = "images/manifest.json") {
        if (this.manifest && this.manifestPath === path) {
            return this.manifest;
        }
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.manifest = await response.json();
            this.manifestPath = path;
            console.log("✅ Manifest loaded:", path);
            return this.manifest;
        } catch (error) {
            console.error("❌ Failed to load manifest:", path, error);
            return null;
        }
    }

    // ========================================
    // CREATE VIEWER
    // ========================================

    async createGalleryViewer(container, manifestPath = "images/manifest.json") {
        const manifest = await this.loadManifest(manifestPath);
        this.container = container;
        if (!manifest || !manifest.galleries) {
            container.innerHTML = `<div class="gallery-error">No galleries found.</div>`;
            return;
        }
        this._setupResizeObserver(container);
        this.showIndex();
    }

    // ========================================
    // RESIZE OBSERVER
    // ========================================

    _setupResizeObserver(element) {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (!window.ResizeObserver) {
            console.warn("⚠️ ResizeObserver not supported. Fallback to window.resize.");
            this._attachWindowResizeFallback();
            return;
        }
        this._resizeObserver = new ResizeObserver((entries) => {
            clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => {
                this._relayoutAll();
            }, 100);
        });
        this._resizeObserver.observe(element);
        this._observedContainer = element;
        console.log("📏 ResizeObserver attached to gallery container");
    }

    _attachWindowResizeFallback() {
        if (this._resizeBound) return;
        this._resizeBound = this._handleResizeFallback.bind(this);
        window.addEventListener('resize', this._resizeBound);
    }

    _handleResizeFallback() {
        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(() => {
            this._relayoutAll();
        }, 100);
    }

    _relayoutAll() {
        this.packeryInstances.forEach(pckry => {
            if (pckry && typeof pckry.layout === 'function') {
                pckry.layout();
            }
        });
        console.log("🔄 Relayout all Packery instances");
    }

    // ========================================
    // INDEX (Folder view)
    // ========================================

    showIndex() {
        const galleries = this.manifest?.galleries || {};
        this.currentGallery = null;
        this.history = [];
        this.container.innerHTML = "";

        const index = document.createElement("div");
        index.className = "gallery-index";
        index.style.display = "flex";
        index.style.flexWrap = "wrap";
        index.style.gap = "10px";
        index.style.padding = "10px";
        index.style.width = "100%";
        index.style.height = "100%";
        index.style.overflowY = "auto";
        index.style.overflowX = "hidden";
        index.style.boxSizing = "border-box";

        for (const [id, gallery] of Object.entries(galleries)) {
            if (gallery.images?.length || gallery.texts?.length || gallery.pdfs?.length || gallery.subfolders?.length) {
                index.appendChild(
                    this.createFolder(id, gallery, () => this.showGallery(id))
                );
            }
        }

        this.container.appendChild(index);
    }

    // ========================================
    // GALLERY (Main gallery view)
    // ========================================

    showGallery(id) {
        const gallery = this.manifest?.galleries?.[id];
        if (!gallery) return;

        if (this.currentGallery !== null) {
            this.history.push(this.currentGallery);
        }
        this.currentGallery = id;

        this.container.innerHTML = "";

        const view = document.createElement("div");
        view.className = "gallery-view";
        view.style.display = "flex";
        view.style.flexDirection = "column";
        view.style.width = "100%";
        view.style.height = "100%";
        view.style.boxSizing = "border-box";
        view.style.overflow = "hidden";

        // Header
        const header = document.createElement("div");
        header.className = "gallery-header";
        header.style.flexShrink = "0";
        header.style.padding = "10px 15px";
        header.style.background = "rgba(0,0,0,0.6)";
        header.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.gap = "10px";

        const back = document.createElement("button");
        back.className = "gallery-back";
        back.textContent = "← Back";
        back.style.background = "none";
        back.style.border = "1px solid rgba(255,255,255,0.2)";
        back.style.color = "#8be9fd";
        back.style.padding = "6px 14px";
        back.style.borderRadius = "6px";
        back.style.cursor = "pointer";
        back.style.fontFamily = "monospace";
        back.style.fontSize = "14px";
        back.onclick = () => this.goBack();

        const title = document.createElement("span");
        title.className = "gallery-title";
        title.textContent = gallery.title || id;
        title.style.color = "white";
        title.style.fontFamily = "monospace";
        title.style.fontSize = "18px";
        title.style.fontWeight = "bold";

        header.append(back, title);

        // Body
        const body = document.createElement("div");
        body.className = "gallery-content";
        body.style.flex = "1";
        body.style.minHeight = "0";
        body.style.overflowY = "auto";
        body.style.overflowX = "hidden";
        body.style.position = "relative";
        body.style.padding = "10px";

        // Collect all items (images + texts + pdfs)
        const allItems = [];
        
        if (gallery.images) {
            gallery.images.forEach(img => {
                allItems.push({ type: 'image', data: img });
            });
        }
        
        if (gallery.texts) {
            gallery.texts.forEach(txt => {
                allItems.push({ type: 'text', data: txt });
            });
        }

        if (gallery.pdfs) {
            gallery.pdfs.forEach(pdf => {
                allItems.push({ type: 'pdf', data: pdf });
            });
        }

        // Subfolders
        const subfolders = gallery.subfolders || [];
        if (subfolders.length) {
            const folders = document.createElement("div");
            folders.className = "gallery-folders";
            folders.style.display = "flex";
            folders.style.flexWrap = "wrap";
            folders.style.gap = "10px";
            folders.style.padding = "10px";
            folders.style.marginBottom = "10px";
            subfolders.forEach(folder => {
                folders.appendChild(
                    this.createFolder(folder.id, folder, () => this.showSubGallery(folder))
                );
            });
            body.appendChild(folders);
        }

        // Items (images + texts + pdfs mixed together)
        if (allItems.length) {
            const itemList = document.createElement("div");
            itemList.className = "gallery-items";
            itemList.style.position = "relative";
            itemList.style.width = "100%";

            allItems.forEach(item => {
                if (item.type === 'image') {
                    itemList.appendChild(this.createImage(item.data));
                } else if (item.type === 'text') {
                    itemList.appendChild(this.createTextItem(item.data));
                } else if (item.type === 'pdf') {
                    itemList.appendChild(this.createPDFItem(item.data));
                }
            });

            body.appendChild(itemList);

            requestAnimationFrame(() => {
                this.initPackery(itemList);
            });
        }

        if (!subfolders.length && !allItems.length) {
            const empty = document.createElement("div");
            empty.className = "gallery-empty";
            empty.textContent = "No files.";
            empty.style.color = "#888";
            empty.style.fontFamily = "monospace";
            empty.style.padding = "40px";
            empty.style.textAlign = "center";
            body.appendChild(empty);
        }

        view.append(header, body);
        this.container.appendChild(view);
    }

    // ========================================
    // SUBFOLDER
    // ========================================

    showSubGallery(folder) {
        this.history.push(this.currentGallery);
        this.currentGallery = null;

        this.container.innerHTML = "";

        const view = document.createElement("div");
        view.className = "gallery-view";
        view.style.display = "flex";
        view.style.flexDirection = "column";
        view.style.width = "100%";
        view.style.height = "100%";
        view.style.boxSizing = "border-box";
        view.style.overflow = "hidden";

        const header = document.createElement("div");
        header.className = "gallery-header";
        header.style.flexShrink = "0";
        header.style.padding = "10px 15px";
        header.style.background = "rgba(0,0,0,0.6)";
        header.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.gap = "10px";

        const back = document.createElement("button");
        back.className = "gallery-back";
        back.textContent = "← Back";
        back.style.background = "none";
        back.style.border = "1px solid rgba(255,255,255,0.2)";
        back.style.color = "#8be9fd";
        back.style.padding = "6px 14px";
        back.style.borderRadius = "6px";
        back.style.cursor = "pointer";
        back.style.fontFamily = "monospace";
        back.style.fontSize = "14px";
        back.onclick = () => this.goBack();

        const title = document.createElement("span");
        title.className = "gallery-title";
        title.textContent = folder.title || folder.id;
        title.style.color = "white";
        title.style.fontFamily = "monospace";
        title.style.fontSize = "18px";
        title.style.fontWeight = "bold";

        header.append(back, title);

        const body = document.createElement("div");
        body.className = "gallery-content";
        body.style.flex = "1";
        body.style.minHeight = "0";
        body.style.overflowY = "auto";
        body.style.overflowX = "hidden";
        body.style.position = "relative";
        body.style.padding = "10px";

        const allItems = [];
        
        if (folder.images) {
            folder.images.forEach(img => {
                allItems.push({ type: 'image', data: img });
            });
        }
        
        if (folder.texts) {
            folder.texts.forEach(txt => {
                allItems.push({ type: 'text', data: txt });
            });
        }

        if (folder.pdfs) {
            folder.pdfs.forEach(pdf => {
                allItems.push({ type: 'pdf', data: pdf });
            });
        }

        if (allItems.length) {
            const itemList = document.createElement("div");
            itemList.className = "gallery-items";
            itemList.style.position = "relative";
            itemList.style.width = "100%";

            allItems.forEach(item => {
                if (item.type === 'image') {
                    itemList.appendChild(this.createImage(item.data));
                } else if (item.type === 'text') {
                    itemList.appendChild(this.createTextItem(item.data));
                } else if (item.type === 'pdf') {
                    itemList.appendChild(this.createPDFItem(item.data));
                }
            });

            body.appendChild(itemList);

            requestAnimationFrame(() => {
                this.initPackery(itemList);
            });
        } else {
            const empty = document.createElement("div");
            empty.className = "gallery-empty";
            empty.textContent = "No files.";
            empty.style.color = "#888";
            empty.style.fontFamily = "monospace";
            empty.style.padding = "40px";
            empty.style.textAlign = "center";
            body.appendChild(empty);
        }

        view.append(header, body);
        this.container.appendChild(view);
    }

    // ========================================
    // PACKERY INITIALIZATION
    // ========================================

    initPackery(container) {
        if (typeof Packery === 'undefined') {
            console.warn("⚠️ Packery not loaded");
            return;
        }
        if (container.packery) {
            container.packery.destroy();
            const idx = this.packeryInstances.indexOf(container.packery);
            if (idx > -1) this.packeryInstances.splice(idx, 1);
            delete container.packery;
        }

        const images = container.querySelectorAll('img');
        let loaded = 0;
        const total = images.length;
        if (total === 0) {
            this._initPackeryNow(container);
            return;
        }

        const onImageLoad = () => {
            loaded++;
            if (loaded >= total) {
                this._initPackeryNow(container);
            }
        };

        images.forEach(img => {
            if (img.complete) {
                onImageLoad();
            } else {
                img.addEventListener('load', onImageLoad);
                img.addEventListener('error', onImageLoad);
            }
        });
    }

    _initPackeryNow(container) {
        setTimeout(() => {
            const pckry = new Packery(container, {
                itemSelector: '.gallery-image',
                gutter: 10,
                transitionDuration: '0.4s'
            });
            container.packery = pckry;
            this.packeryInstances.push(pckry);
            console.log("📦 Packery initialized on", container);
        }, 50);
    }

    // ========================================
    // CREATE FOLDER
    // ========================================

    createFolder(id, folder, onClick) {
        const item = document.createElement("div");
        item.className = "gallery-folder";
        item.style.width = "140px";
        item.style.height = "140px";
        item.style.flexShrink = "0";
        item.style.position = "relative";
        item.style.overflow = "hidden";
        item.style.borderRadius = "6px";
        item.style.cursor = "pointer";
        item.style.background = "#1a1a1a";

        const preview = folder.images?.[0]?.path || folder.pdfs?.[0]?.path || folder.texts?.[0]?.path;
        if (preview && folder.images?.[0]) {
            const img = document.createElement("img");
            img.src = preview;
            img.alt = folder.title || id;
            img.loading = "lazy";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.display = "block";
            img.style.objectFit = "cover";
            item.appendChild(img);
        } else if (folder.pdfs?.length) {
            // Show PDF icon for folders with only PDFs
            const icon = document.createElement("div");
            icon.textContent = "📕";
            icon.style.width = "100%";
            icon.style.height = "100%";
            icon.style.display = "flex";
            icon.style.alignItems = "center";
            icon.style.justifyContent = "center";
            icon.style.fontSize = "48px";
            icon.style.background = "#1a1a1a";
            item.appendChild(icon);
        } else if (folder.texts?.length) {
            const icon = document.createElement("div");
            icon.textContent = "📄";
            icon.style.width = "100%";
            icon.style.height = "100%";
            icon.style.display = "flex";
            icon.style.alignItems = "center";
            icon.style.justifyContent = "center";
            icon.style.fontSize = "48px";
            icon.style.background = "#1a1a1a";
            item.appendChild(icon);
        } else {
            const empty = document.createElement("div");
            empty.className = "gallery-folder-empty";
            empty.textContent = "📁";
            empty.style.width = "100%";
            empty.style.height = "100%";
            empty.style.display = "flex";
            empty.style.alignItems = "center";
            empty.style.justifyContent = "center";
            empty.style.fontSize = "48px";
            item.appendChild(empty);
        }

        const label = document.createElement("div");
        label.className = "gallery-folder-label";
        label.textContent = folder.title || id;
        label.style.position = "absolute";
        label.style.left = "0";
        label.style.right = "0";
        label.style.bottom = "0";
        label.style.padding = "4px 6px";
        label.style.background = "rgba(0, 0, 0, 0.6)";
        label.style.color = "#fff";
        label.style.fontSize = "12px";
        label.style.textAlign = "center";
        label.style.whiteSpace = "nowrap";
        label.style.overflow = "hidden";
        label.style.textOverflow = "ellipsis";
        label.style.boxSizing = "border-box";
        item.appendChild(label);

        item.onclick = onClick;
        return item;
    }

    // ========================================
    // CREATE IMAGE
    // ========================================

    createImage(data) {
        const item = document.createElement("div");
        item.className = "gallery-image";

        const img = document.createElement("img");
        img.src = data.path;
        img.alt = data.filename || "";
        img.loading = "lazy";
        img.style.display = "block";
        img.style.width = "100%";
        img.style.height = "auto";

        if (data.width && data.height) {
            const ratio = data.width / data.height;
            let baseWidth = 200;
            if (ratio > 1.5) {
                baseWidth = Math.min(300, baseWidth * 1.4);
            } else if (ratio < 0.6) {
                baseWidth = Math.max(120, baseWidth * 0.8);
            }
            item.style.width = baseWidth + "px";
            item.dataset.ratio = ratio;
        } else {
            item.style.width = "200px";
        }

        item.appendChild(img);
        item.onclick = () => this.openImage(data.path);
        return item;
    }

    // ========================================
    // CREATE TEXT ITEM
    // ========================================

    createTextItem(data) {
        const item = document.createElement("div");
        item.className = "gallery-image gallery-text-item";
        item.style.width = "200px";
        item.style.cursor = "pointer";
        item.style.background = "#1a1a1a";
        item.style.borderRadius = "4px";
        item.style.overflow = "hidden";
        item.style.border = "1px solid rgba(255,255,255,0.1)";
        item.style.display = "flex";
        item.style.flexDirection = "column";
        item.style.alignItems = "center";

        const imageContainer = document.createElement("div");
        imageContainer.style.width = "100%";
        imageContainer.style.height = "150px";
        imageContainer.style.display = "flex";
        imageContainer.style.alignItems = "center";
        imageContainer.style.justifyContent = "center";
        imageContainer.style.background = "#111";
        imageContainer.style.overflow = "hidden";
        imageContainer.style.flexShrink = "0";

        const img = document.createElement("img");
        img.alt = data.filename || "Text file";
        img.loading = "lazy";
        img.style.display = "block";
        img.style.maxWidth = "100%";
        img.style.maxHeight = "100%";
        img.style.width = "auto";
        img.style.height = "auto";
        img.style.objectFit = "contain";

        const baseName = data.filename.replace(/\.[^.]+$/, '');
        const sources = [
            data.path.replace(/\.[^.]+$/, '.png'),
            data.path.replace(/\.[^.]+$/, '.jpg'),
            data.path.replace(/\.[^.]+$/, '.webp'),
            'images/desktop/txt-preview.webp',
            'images/desktop/txt.webp'
        ];

        let srcIndex = 0;
        const tryNextSource = () => {
            if (srcIndex < sources.length) {
                img.src = sources[srcIndex++];
            }
        };
        img.onerror = tryNextSource;
        tryNextSource();

        imageContainer.appendChild(img);

        const label = document.createElement("div");
        label.textContent = data.filename || "untitled.txt";
        label.style.padding = "8px 10px";
        label.style.fontSize = "12px";
        label.style.fontFamily = "monospace";
        label.style.color = "#aaa";
        label.style.textAlign = "center";
        label.style.whiteSpace = "nowrap";
        label.style.overflow = "hidden";
        label.style.textOverflow = "ellipsis";
        label.style.background = "rgba(0,0,0,0.3)";
        label.style.borderTop = "1px solid rgba(255,255,255,0.05)";
        label.style.width = "100%";
        label.style.flexShrink = "0";

        const size = document.createElement("div");
        size.textContent = `${data.size_kb || 0} KB`;
        size.style.fontSize = "10px";
        size.style.color = "#666";
        size.style.textAlign = "center";
        size.style.padding = "2px 0 6px 0";
        size.style.fontFamily = "monospace";
        size.style.width = "100%";
        size.style.flexShrink = "0";

        item.appendChild(imageContainer);
        item.appendChild(label);
        item.appendChild(size);

        item.onclick = () => {
            this.openTextFile(data.path, data.filename);
        };

        return item;
    }

    // ========================================
    // CREATE PDF ITEM
    // ========================================

    createPDFItem(data) {
        const item = document.createElement("div");
        item.className = "gallery-image gallery-pdf-item";
        item.style.width = "200px";
        item.style.cursor = "pointer";
        item.style.background = "#1a1a1a";
        item.style.borderRadius = "4px";
        item.style.overflow = "hidden";
        item.style.border = "1px solid rgba(255,255,255,0.1)";
        item.style.display = "flex";
        item.style.flexDirection = "column";
        item.style.alignItems = "center";

        const imageContainer = document.createElement("div");
        imageContainer.style.width = "100%";
        imageContainer.style.height = "150px";
        imageContainer.style.display = "flex";
        imageContainer.style.alignItems = "center";
        imageContainer.style.justifyContent = "center";
        imageContainer.style.background = "#111";
        imageContainer.style.overflow = "hidden";
        imageContainer.style.flexShrink = "0";

        const img = document.createElement("img");
        img.alt = data.filename || "PDF file";
        img.loading = "lazy";
        img.style.display = "block";
        img.style.maxWidth = "100%";
        img.style.maxHeight = "100%";
        img.style.width = "auto";
        img.style.height = "auto";
        img.style.objectFit = "contain";

        // Try to find a preview image with the same name
        const baseName = data.filename.replace(/\.[^.]+$/, '');
        const sources = [
            data.path.replace(/\.[^.]+$/, '.png'),
            data.path.replace(/\.[^.]+$/, '.jpg'),
            data.path.replace(/\.[^.]+$/, '.webp'),
            'images/desktop/pdf-preview.webp',
            'images/desktop/pdf.webp'
        ];

        // If pdf.webp doesn't exist, use a generic PDF icon
        // You can create one or use an emoji

        let srcIndex = 0;
        const tryNextSource = () => {
            if (srcIndex < sources.length) {
                img.src = sources[srcIndex++];
            } else {
                // Ultimate fallback - use an emoji or inline SVG
                img.style.display = "none";
                const fallback = document.createElement("div");
                fallback.textContent = "📕";
                fallback.style.fontSize = "48px";
                fallback.style.display = "flex";
                fallback.style.alignItems = "center";
                fallback.style.justifyContent = "center";
                fallback.style.width = "100%";
                fallback.style.height = "100%";
                imageContainer.appendChild(fallback);
            }
        };
        img.onerror = tryNextSource;
        tryNextSource();

        imageContainer.appendChild(img);

        const label = document.createElement("div");
        label.textContent = data.filename || "untitled.pdf";
        label.style.padding = "8px 10px";
        label.style.fontSize = "12px";
        label.style.fontFamily = "monospace";
        label.style.color = "#ff6b6b"; // Red tint for PDFs
        label.style.textAlign = "center";
        label.style.whiteSpace = "nowrap";
        label.style.overflow = "hidden";
        label.style.textOverflow = "ellipsis";
        label.style.background = "rgba(0,0,0,0.3)";
        label.style.borderTop = "1px solid rgba(255,255,255,0.05)";
        label.style.width = "100%";
        label.style.flexShrink = "0";

        const size = document.createElement("div");
        size.textContent = `${data.size_kb || 0} KB`;
        size.style.fontSize = "10px";
        size.style.color = "#666";
        size.style.textAlign = "center";
        size.style.padding = "2px 0 6px 0";
        size.style.fontFamily = "monospace";
        size.style.width = "100%";
        size.style.flexShrink = "0";

        item.appendChild(imageContainer);
        item.appendChild(label);
        item.appendChild(size);

        // Click to open PDF in new tab
        item.onclick = () => {
            this.openPDF(data.path, data.filename);
        };

        return item;
    }

    // ========================================
    // OPEN PDF
    // ========================================

    openPDF(path, filename) {
        if (!path) return;
        
        // Open PDF in new tab
        window.open(path, '_blank');
        
        console.log(`📕 Opening PDF: ${filename || path}`);
    }

    // ========================================
    // OPEN TEXT FILE
    // ========================================

    openTextFile(path, filename) {
        if (!path) return;
        
        if (typeof WindowHTML !== "undefined" && typeof WindowHTML.openTextDocument === "function") {
            fetch(path)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.text();
                })
                .then(text => {
                    WindowHTML.openTextDocument(path, text);
                })
                .catch(error => {
                    console.error("❌ Failed to load text file:", error);
                    WindowHTML.openTextDocument(path, `Error loading file: ${error.message}`);
                });
            return;
        }

        alert(`Opening text file: ${filename || path}`);
    }

    // ========================================
    // BACK
    // ========================================

    goBack() {
        const previous = this.history.pop();
        if (previous) {
            this.showGallery(previous);
        } else {
            this.showIndex();
        }
    }

    // ========================================
    // LIGHTBOX
    // ========================================

    openImage(path) {
        if (!path) return;
        if (typeof WindowHTML !== "undefined" && typeof WindowHTML.openGalleryImage === "function") {
            WindowHTML.openGalleryImage(path);
            return;
        }
        const overlay = document.createElement("div");
        overlay.className = "gallery-lightbox";
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.background = "rgba(0,0,0,0.85)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "99999";
        overlay.style.cursor = "pointer";
        
        const img = document.createElement("img");
        img.src = path;
        img.style.maxWidth = "90%";
        img.style.maxHeight = "90%";
        img.style.objectFit = "contain";
        img.style.borderRadius = "8px";
        overlay.appendChild(img);
        overlay.onclick = () => overlay.remove();
        document.body.appendChild(overlay);
    }

    // ========================================
    // DESTROY
    // ========================================

    destroy() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._resizeBound) {
            window.removeEventListener('resize', this._resizeBound);
            this._resizeBound = null;
        }
        clearTimeout(this._resizeTimer);
        this.packeryInstances.forEach(p => p.destroy());
        this.packeryInstances = [];
        if (this.container) {
            this.container.innerHTML = "";
        }
        this.container = null;
        this.manifest = null;
        this.manifestPath = null;
        this.currentGallery = null;
        this.history = [];
    }
}

// ============================================
// GLOBAL INSTANCE
// ============================================

let gallerySystem = null;

function getGallerySystem() {
    if (!gallerySystem) {
        gallerySystem = new GallerySystem();
    }
    return gallerySystem;
}

window.GallerySystem = GallerySystem;
window.getGallerySystem = getGallerySystem;

console.log("✅ Gallery System ready (Packery + ResizeObserver)");