// ============================================
// BOOK WINDOW – Aspect‑Locked Canvas (cover)
// ============================================

console.log("📖 Book Window System loaded");

const BookWindow = {

    create(windowInstance, object, bookSrc) {

        if (!windowInstance) {
            console.warn("⚠️ BookWindow.create() received no window.");
            return;
        }

        console.log("📖 Creating book window:", windowInstance.themeName);

        this._injectScrollbarStyle();

        windowInstance._isBook = true;

        // ----- State -----
        windowInstance._bookContent = [];
        windowInstance._bookImage = null;
        windowInstance._bookAspect = null;
        windowInstance._bookCanvas = null;
        windowInstance._bookLayer = null;
        windowInstance._bookLeftPage = null;
        windowInstance._bookRightPage = null;
        windowInstance._bookResizeObserver = null;
        windowInstance._bookWrapper = null;
        windowInstance._bookImageWidth = 0;
        windowInstance._bookImageHeight = 0;

        // ----- Get content element -----
        const content = windowInstance.content;
        if (!content) {
            console.error("❌ Book window has no content element.");
            return;
        }

        // ----- Make content fill the entire window -----
        content.innerHTML = "";
        content.style.position = "absolute";
        content.style.top = "0";
        content.style.left = "0";
        content.style.width = "100%";
        content.style.height = "100%";
        content.style.padding = "0";
        content.style.margin = "0";
        content.style.overflow = "hidden";
        content.style.background = "transparent";
        content.style.boxSizing = "border-box";
        // No flex centering – wrapper will fill the window directly
        content.style.display = "block";

        // ----- WRAPPER (fills window, aspect‑locked via cropping) -----
        const wrapper = document.createElement("div");
        wrapper.className = "book-wrapper";
        wrapper.style.position = "absolute";
        wrapper.style.left = "50%";
        wrapper.style.top = "50%";
        wrapper.style.transform = "translate(-50%, -50%)";
        wrapper.style.overflow = "hidden";
        wrapper.style.backgroundColor = "#1a1a2e";
        // Width/height set in _redraw
        content.appendChild(wrapper);
        windowInstance._bookWrapper = wrapper;

        // ----- Background Canvas -----
        const canvas = document.createElement("canvas");
        canvas.className = "book-background-canvas";
        canvas.style.position = "absolute";
        canvas.style.left = "0";
        canvas.style.top = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "0";
        wrapper.appendChild(canvas);
        windowInstance._bookCanvas = canvas;

        // ----- Content Layer (holds pages) -----
        const bookLayer = document.createElement("div");
        bookLayer.className = "book-content-layer";
        bookLayer.style.position = "absolute";
        bookLayer.style.left = "0";
        bookLayer.style.top = "0";
        bookLayer.style.width = "100%";
        bookLayer.style.height = "100%";
        bookLayer.style.pointerEvents = "auto";
        bookLayer.style.zIndex = "1";
        bookLayer.style.overflow = "hidden";
        wrapper.appendChild(bookLayer);
        windowInstance._bookLayer = bookLayer;

        // ----- Left Page -----
        const leftPage = document.createElement("div");
        leftPage.className = "book-page book-page-left";
        leftPage.style.position = "absolute";
        leftPage.style.left = "0";
        leftPage.style.top = "0";
        leftPage.style.width = "50%";
        leftPage.style.height = "100%";
        leftPage.style.overflow = "auto";
        leftPage.style.pointerEvents = "auto";
        bookLayer.appendChild(leftPage);
        windowInstance._bookLeftPage = leftPage;

        // ----- Right Page -----
        const rightPage = document.createElement("div");
        rightPage.className = "book-page book-page-right";
        rightPage.style.position = "absolute";
        rightPage.style.left = "50%";
        rightPage.style.top = "0";
        rightPage.style.width = "50%";
        rightPage.style.height = "100%";
        rightPage.style.overflow = "auto";
        rightPage.style.pointerEvents = "auto";
        bookLayer.appendChild(rightPage);
        windowInstance._bookRightPage = rightPage;

        // ----- Load Background Image -----
        if (bookSrc) {
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Loaded book image: ${bookSrc} (${img.width}×${img.height})`);
                windowInstance._bookImage = img;
                windowInstance._bookImageWidth = img.width;
                windowInstance._bookImageHeight = img.height;
                windowInstance._bookAspect = img.width / img.height;
                this._redraw(windowInstance);
            };
            img.onerror = () => {
                console.warn(`⚠️ Failed to load book image: ${bookSrc}`);
                windowInstance._bookImage = null;
                windowInstance._bookImageWidth = 0;
                windowInstance._bookImageHeight = 0;
                this._redraw(windowInstance);
            };
            img.src = String(bookSrc).trim();
        } else {
            this._redraw(windowInstance);
        }

        // ----- Load Text (optional) -----
        const textFile = object?.element?.dataset?.bookText;
        const textLimit = parseInt(object?.element?.dataset?.bookTextLimit, 10);
        if (textFile) {
            fetch(textFile.trim())
                .then(r => r.text())
                .then(text => {
                    this.addPageContent(
                        windowInstance,
                        "📖 Chapter 1",
                        1000,
                        50,
                        { fontSize: 32, color: "#ffd700", fontFamily: "serif", width: 400,  height: 100, page: "left" }
                    );
                    const cropped = Number.isFinite(textLimit) && textLimit > 0 && textLimit < text.length;
                    const chapterText = cropped ? text.slice(0, textLimit) + "..." : text;
                    this.addPageContent(windowInstance, chapterText, 400, 200, { fontSize: 60, width: 1450, height: 2300, page: "left" });

                    this.addPageContent(
                        windowInstance,
                        "Visuals",
                        1000,
                        50,
                        { fontSize: 32, color: "#ffd700", fontFamily: "serif", width: 400,  height: 100, page: "right" }
                    );
                    // Placeholder while the visuals system isn't built yet.
                    const displayText = "Not working yet causes vectors are ass";
                    this.addPageContent(windowInstance, displayText, 400, 200, { fontSize: 60, width: 1450, height: 2300, page: "right" });
                    this._redraw(windowInstance);
                })
                .catch(err => {
                    console.error("❌ Book text load error:", err);
                    this.addPageContent(windowInstance, "Error loading text.", 50, 100);
                    this._redraw(windowInstance);
                });
        } else {
            this._redraw(windowInstance);
        }

        // ----- Resize Observer -----
        if (window.ResizeObserver) {
            const observer = new ResizeObserver(() => {
                console.log("📖 ResizeObserver triggered");
                this._redraw(windowInstance);
            });
            observer.observe(windowInstance.element);
            windowInstance._bookResizeObserver = observer;
        }

        // ----- Initial Draw -----
        requestAnimationFrame(() => this._redraw(windowInstance));
        setTimeout(() => this._redraw(windowInstance), 100);
    },

    // ----- Themed scrollbars for scrollable text boxes -----
    _injectScrollbarStyle() {
        if (document.getElementById("book-page-scrollbar-style")) return;
        const style = document.createElement("style");
        style.id = "book-page-scrollbar-style";
        style.textContent = `
            .book-page-content {
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.35) transparent;
            }
            .book-page-content::-webkit-scrollbar {
                width: 8px;
            }
            .book-page-content::-webkit-scrollbar-track {
                background: transparent;
            }
            .book-page-content::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.35);
                border-radius: 4px;
            }
            .book-page-content::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.55);
            }
        `;
        document.head.appendChild(style);
    },

    // ----- Content management -----
    addPageContent(windowInstance, content, x, y, options = {}) {
        if (!windowInstance._bookContent) windowInstance._bookContent = [];
        const item = {
            content,
            x: Number(x) || 0,
            y: Number(y) || 0,
            width: options.width !== undefined ? Number(options.width) : null,
            height: options.height !== undefined ? Number(options.height) : null,
            page: options.page === "left" || options.page === "right" ? options.page : "both",
            options: {
                fontSize: options.fontSize !== undefined ? Number(options.fontSize) : 24,
                color: options.color || "#ffffff",
                textAlign: options.textAlign || "left",
                fontFamily: options.fontFamily || "serif",
                lineHeight: options.lineHeight !== undefined ? Number(options.lineHeight) : 1.2,
                opacity: options.opacity !== undefined ? Number(options.opacity) : 1,
                fontWeight: options.fontWeight || "normal",
                fontStyle: options.fontStyle || "normal",
                background: options.background || "rgba(0, 0, 0, 0.3)",
                border: options.border || "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: options.borderRadius || "8px",
                padding: options.padding || "12px 24px",
                boxShadow: options.boxShadow || "0 0 20px rgba(0,0,0,0.5)",
                textShadow: options.textShadow || "0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7)",
                scroll: options.scroll !== undefined ? Boolean(options.scroll) : true
            }
        };
        windowInstance._bookContent.push(item);
        this._renderPageContent(windowInstance);
        return item;
    },

    clearPageContent(windowInstance) {
        if (!windowInstance) return;
        windowInstance._bookContent = [];
        this._renderPageContent(windowInstance);
    },

    // ----- Rendering with scaling -----
    _renderPageContent(windowInstance) {
        const leftPage = windowInstance._bookLeftPage;
        const rightPage = windowInstance._bookRightPage;
        const wrapper = windowInstance._bookWrapper;
        if (!leftPage || !rightPage || !wrapper) return;

        leftPage.innerHTML = "";
        rightPage.innerHTML = "";

        const wrapperW = wrapper.clientWidth;
        const wrapperH = wrapper.clientHeight;
        if (wrapperW <= 0 || wrapperH <= 0) return;

        const imgW = windowInstance._bookImageWidth || 1;
        const scale = wrapperW / imgW;

        const items = windowInstance._bookContent || [];
        items.forEach(item => {
            const page = item.page || "both";

            if (page === "both" || page === "left") {
                this._placeLeft(leftPage, item, scale);
            }
            if (page === "both" || page === "right") {
                this._placeMirroredRight(rightPage, item, scale, wrapperW);
            }
        });
    },

    // ----- Direct placement (left-page coordinate space) -----
    _placeLeft(page, item, scale) {
        const el = this._createContentElement(item, scale);
        page.appendChild(el);
        el.style.left = `${item.x * scale}px`;
        el.style.top = `${item.y * scale}px`;
        this._applyAlign(el, item);
        return el;
    },

    // ----- Mirrored placement (flips left-page coordinates onto the right page) -----
    _placeMirroredRight(page, item, scale, wrapperW) {
        const el = this._createContentElement(item, scale);
        page.appendChild(el);

        const scaledY = item.y * scale;
        let width = item.width;
        if (width && Number.isFinite(width)) {
            width = width * scale;
        } else {
            width = el.offsetWidth;
        }

        const pageWidth = wrapperW / 2;
        const mirroredX = pageWidth - (item.x * scale) - width;
        el.style.left = `${mirroredX}px`;
        el.style.top = `${scaledY}px`;
        this._applyAlign(el, item);
        return el;
    },

    _applyAlign(el, item) {
        const align = item.options.textAlign;
        if (align === "right" || align === "center" || align === "left") {
            el.style.textAlign = align;
        }
    },

    _createContentElement(item, scale) {
        const el = document.createElement("div");
        el.className = "book-page-content";
        el.style.position = "absolute";
        el.style.boxSizing = "border-box";
        el.style.margin = "0";
        el.style.padding = this._scaleValue(item.options.padding, scale);
        el.style.overflowY = item.options.scroll ? "auto" : "hidden";
        el.style.overflowX = "hidden";
        el.style.background = item.options.background;
        el.style.border = this._scaleBorder(item.options.border, scale);
        el.style.borderRadius = this._scaleValue(item.options.borderRadius, scale);
        el.style.boxShadow = this._scaleShadow(item.options.boxShadow, scale);
        el.style.textShadow = item.options.textShadow;

        el.style.color = item.options.color;
        el.style.fontSize = `${item.options.fontSize * scale}px`;
        el.style.fontFamily = item.options.fontFamily;
        el.style.fontWeight = item.options.fontWeight;
        el.style.fontStyle = item.options.fontStyle;
        el.style.lineHeight = String(item.options.lineHeight);
        el.style.opacity = String(item.options.opacity);
        el.style.textAlign = item.options.textAlign;
        el.style.whiteSpace = "pre-wrap";
        el.style.userSelect = "text";

        if (item.width && Number.isFinite(item.width)) {
            el.style.width = `${item.width * scale}px`;
        }
        if (item.height && Number.isFinite(item.height)) {
            el.style.height = `${item.height * scale}px`;
        }

        if (typeof item.content === "string") {
            el.textContent = item.content;
        } else if (item.content instanceof Node) {
            el.appendChild(item.content.cloneNode(true));
        } else {
            el.textContent = String(item.content ?? "");
        }
        return el;
    },

    _scaleValue(value, scale) {
        if (!value) return value;
        if (typeof value === "number") return `${value * scale}px`;
        const match = value.match(/^([\d.]+)(px)?$/);
        if (match) {
            const num = parseFloat(match[1]);
            return `${num * scale}px`;
        }
        return value;
    },

    _scaleBorder(border, scale) {
        if (!border) return border;
        return border.replace(/([\d.]+)px/, (match, p1) => `${parseFloat(p1) * scale}px`);
    },

    _scaleShadow(shadow, scale) {
        if (!shadow) return shadow;
        return shadow.replace(/([\d.]+)px/g, (match, p1) => `${parseFloat(p1) * scale}px`);
    },

    _redraw(windowInstance) {
        if (!windowInstance) return;

        const wrapper = windowInstance._bookWrapper;
        const canvas = windowInstance._bookCanvas;
        const content = windowInstance.content;

        if (!wrapper || !canvas || !content) return;

        const cw = content.clientWidth;
        const ch = content.clientHeight;

        if (cw <= 0 || ch <= 0) return;

        // ========================================
        // ASPECT-LOCK BOOK CONTENT
        // ========================================

        const img = windowInstance._bookImage;
        let aspect = (img && img.width > 0 && img.height > 0) ? img.width / img.height : 1;

        // Fit the book INSIDE the available window. Unlike cover, neither
        // dimension is allowed to exceed the window, giving the book a
        // real aspect-locked coordinate space.
        let wrapperW = cw;
        let wrapperH = wrapperW / aspect;
        if (wrapperH > ch) {
            wrapperH = ch;
            wrapperW = wrapperH * aspect;
        }

        // ========================================
        // APPLY WRAPPER SIZE
        // ========================================

        wrapper.style.width = `${wrapperW}px`;
        wrapper.style.height = `${wrapperH}px`;
        wrapper.style.left = "50%";
        wrapper.style.top = "50%";
        wrapper.style.transform = "translate(-50%, -50%)";
        wrapper.style.aspectRatio = String(aspect); // Explicitly preserve aspect ratio.

        // ========================================
        // CANVAS
        // ========================================

        canvas.width = Math.round(wrapperW);
        canvas.height = Math.round(wrapperH);

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (img && img.width > 0 && img.height > 0) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.font = "24px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Book image not loaded", canvas.width / 2, canvas.height / 2);
        }

        // ========================================
        // DEBUG CENTER LINE
        // ========================================

        if (windowInstance._bookDebug) {
            ctx.save();
            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
            ctx.restore();
        }

        // ========================================
        // PAGE CONTENT
        // ========================================

        this._renderPageContent(windowInstance);
    },

    setDebug(windowInstance, enabled) {
        if (!windowInstance) return;
        windowInstance._bookDebug = Boolean(enabled);
        this._redraw(windowInstance);
    },

    destroy(windowInstance) {
        if (!windowInstance) return;
        if (windowInstance._bookResizeObserver) {
            windowInstance._bookResizeObserver.disconnect();
            windowInstance._bookResizeObserver = null;
        }
        windowInstance._bookCanvas = null;
        windowInstance._bookLayer = null;
        windowInstance._bookLeftPage = null;
        windowInstance._bookRightPage = null;
        windowInstance._bookImage = null;
        windowInstance._bookContent = [];
        windowInstance._isBook = false;
        windowInstance._bookWrapper = null;
        windowInstance._bookImageWidth = 0;
        windowInstance._bookImageHeight = 0;
    }
};

window.BookWindow = BookWindow;

// Patch window close to clean up
if (typeof DesktopWindow !== "undefined" && DesktopWindow.prototype) {
    const prevClose = DesktopWindow.prototype.close;
    DesktopWindow.prototype.close = function() {
        if (this._isBook && typeof BookWindow.destroy === "function") {
            BookWindow.destroy(this);
        }
        if (typeof prevClose === "function") {
            prevClose.call(this);
        } else if (this.element) {
            this.element.remove();
        }
    };
}

console.log("✅ Book Window System ready");