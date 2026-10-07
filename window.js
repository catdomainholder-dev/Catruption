console.log("window system loaded");

// ============================================
// DESKTOP WINDOW
// ============================================

class DesktopWindow {
    constructor(options = {}) {

        // ========================================
        // WINDOW DATA
        // ========================================

        this.options = options;
        this.themeName = options.theme || "default";
        this.theme = null;
        this.themeImage = null;
        this.triangleImage = null;
        this.contentOffset = { x: 0, y: 0 };

        // Remember which desktop object created this window.
        this._parentObject = options._parent || null;

        this.x = options.x ?? 100;
        this.y = options.y ?? 100;
        this.width = options.width ?? 500;
        this.height = options.height ?? 300;

        // ========================================
        // WINDOW STATE
        // ========================================

        this.isMinimized = false;
        this.isMaximized = false;
        this._savedRect = null;
        this.defaultSizeSet = false;

        // ========================================
        // SIZE CONSTRAINTS
        // ========================================

        this.minWidth = 100;
        this.minHeight = 80;
        this.maxWidth = Infinity;
        this.maxHeight = Infinity;

        // ========================================
        // CREATE WINDOW ELEMENT
        // ========================================

        this.element = document.createElement("div");
        this.element.className = "window";

        this.element.style.position = "fixed";
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.boxSizing = "border-box";
        this.element.style.overflow = "hidden";
        this.element.style.zIndex = "9999";

        // ========================================
        // CREATE WINDOW PARTS
        // ========================================

        this.createStructure();

        // ========================================
        // ADD TO DOCUMENT
        // ========================================

        document.body.appendChild(this.element);

        // ========================================
        // SET DOCUMENT CONTENT
        // ========================================

        if (options.document) {
            if (options.document.type === "html") {
                this.document.innerHTML = options.document.content || "";
            } else if (options.document.type === "text") {
                this.document.textContent = options.document.content || "";
            } else {
                console.warn("Unsupported document type:", options.document.type);
            }
        } else if (options.innerText !== undefined) {
            this.document.textContent = options.innerText;
        }

        // ========================================
        // INITIALIZE RENDERER (SKIP IF REQUESTED)
        // ========================================

        // ---- NEW: skip renderer if flag is set ----
        if (!options.skipRenderer && typeof WindowRenderer !== "undefined") {
            WindowRenderer.setup(this);
        }

        // ========================================
        // INITIALIZE INTERACTIONS
        // ========================================

        if (typeof WindowInteractions !== "undefined") {
            WindowInteractions.setup(this);
        }

        // ========================================
        // PREVENT MIDDLE-CLICK PASTE
        // ========================================

        this.element.addEventListener("mousedown", (event) => {
            if (event.button === 1) {
                const input = document.getElementById("talk-input");
                if (input && document.activeElement === input) {
                    input.blur();
                }
            }
        });

        document.addEventListener("auxclick", (event) => {
            if (event.button === 1) {
                const input = document.getElementById("talk-input");
                if (input && document.activeElement === input) {
                    event.preventDefault();
                    input.blur();
                }
            }
        });
    }

    // ============================================
    // CREATE WINDOW STRUCTURE
    // ============================================

    createStructure() {

        // ========================================
        // THEME CANVAS (always created, but may be unused)
        // ========================================

        this.canvas = document.createElement("canvas");
        this.canvas.className = "window-decoration";
        this.canvas.style.position = "absolute";
        this.canvas.style.left = "0";
        this.canvas.style.top = "0";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.style.pointerEvents = "none";
        this.canvas.style.zIndex = "0";
        this.element.appendChild(this.canvas);

        // ========================================
        // TITLE BAR
        // ========================================

        this.titleBar = document.createElement("div");
        this.titleBar.style.position = "absolute";
        this.titleBar.style.zIndex = "100";
        this.titleBar.style.top = "10px";
        this.titleBar.style.left = "50%";
        this.titleBar.style.transform = "translateX(-50%)";
        this.titleBar.style.pointerEvents = "auto";
        this.titleBar.style.cursor = "move";
        this.titleBar.style.userSelect = "none";
        this.titleBar.style.whiteSpace = "nowrap";
        this.titleBar.textContent = this.options.title ?? "Window";
        this.element.appendChild(this.titleBar);

        // ========================================
        // WINDOW ICON
        // ========================================

        this.createWindowIcon();

        // ========================================
        // CONTROLS
        // ========================================

        this.createControls();

        // ========================================
        // CONTENT VIEWPORT
        // ========================================

        this.content = document.createElement("div");
        this.content.className = "window-content";
        this.content.style.position = "absolute";
        this.content.style.zIndex = "2";
        this.content.style.boxSizing = "border-box";
        this.content.style.display = "block";
        this.content.style.overflow = "hidden";
        this.content.style.pointerEvents = "auto";
        this.element.appendChild(this.content);

        // ========================================
        // DOCUMENT
        // ========================================

        this.document = document.createElement("div");
        this.document.className = "window-document";
        this.document.style.width = "100%";
        this.document.style.height = "100%";
        this.document.style.boxSizing = "border-box";
        this.document.style.overflow = "auto";
        this.document.style.pointerEvents = "auto";
        this.document.style.textAlign = "left";
        this.document.style.fontWeight = "normal";
        this.content.appendChild(this.document);
    }

    // ============================================
    // CREATE WINDOW ICON
    // ============================================

    createWindowIcon() {

        this.windowIcon = document.createElement("img");
        this.windowIcon.className = "window-icon";

        const parent = this._parentObject;

        if (parent && parent.src) {
            this.windowIcon.src = parent.src;
        } else if (parent && parent.element) {
            this.windowIcon.src = parent.element.src;
        } else if (this.options.icon) {
            this.windowIcon.src = this.options.icon;
        }

        this.windowIcon.alt = "";
        this.windowIcon.draggable = false;

        this.windowIcon.style.position = "absolute";
        this.windowIcon.style.zIndex = "100";
        this.windowIcon.style.display = "none";
        this.windowIcon.style.objectFit = "contain";
        this.windowIcon.style.pointerEvents = "none";
        this.windowIcon.style.userSelect = "none";

        this.windowIcon.addEventListener("dragstart", (e) => {
            e.preventDefault();
        });

        this.element.appendChild(this.windowIcon);
    }

    // ============================================
    // CREATE CONTROLS
    // ============================================

    createControls() {
        this.controls = document.createElement("div");
        this.controls.style.position = "absolute";
        this.controls.style.zIndex = "101";
        this.controls.style.pointerEvents = "auto";
        this.controls.style.opacity = "0";
        this.controls.style.display = "block";

        // Use the theme name for the image path
        const themePath = this.themeName || 'steel';
        
        const buttonConfigs = [
            { id: "close", action: () => this.close() },
            { id: "minimize", action: () => this.minimize() },
            { id: "maximize", action: () => this.maximize() }
        ];

        this.buttons = {};

        buttonConfigs.forEach((config) => {
            const btn = document.createElement("img");
            
            // Try to find the right extension
            const ext = this.findImageExtension(themePath, config.id);
            btn.src = `images/themes/${themePath}/${config.id}${ext}`;
            btn.alt = config.id;

            btn.style.position = "absolute";
            btn.style.top = "0px";
            btn.style.objectFit = "contain";
            btn.style.cursor = "pointer";
            btn.style.pointerEvents = "auto";
            btn.style.display = "block";
            btn.style.userSelect = "none";

            // Store the normal src
            btn.dataset.normalSrc = btn.src;

            btn.addEventListener("mouseenter", () => {
                // Try highlighted version
                const highlightExt = this.findImageExtension(themePath, `${config.id}-highlighted`);
                if (highlightExt) {
                    const highlightSrc = `images/themes/${themePath}/${config.id}-highlighted${highlightExt}`;
                    fetch(highlightSrc, { method: "HEAD" })
                        .then(res => {
                            if (res.ok) btn.src = highlightSrc;
                        })
                        .catch(() => {});
                }
            });

            btn.addEventListener("mouseleave", () => {
                btn.src = btn.dataset.normalSrc;
            });

            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                config.action();
            });

            btn.addEventListener("dragstart", (e) => {
                e.preventDefault();
            });

            this.controls.appendChild(btn);
            this.buttons[config.id] = btn;
        });

        this.element.appendChild(this.controls);

        console.log("✅ Controls created with", buttonConfigs.length, "buttons");
    }

    findImageExtension(themePath, baseName) {
        if (themePath === 'steel') {
            return '.webp';
        }
        return '.png';
    }

    // ============================================
    // REDRAW – can be overridden by book
    // ============================================

    redraw() {
        if (this._isBook) {
            // Book window handles its own redraw
            if (typeof BookWindow !== 'undefined' && BookWindow._redraw) {
                BookWindow._redraw(this);
            }
            return;
        }
        if (typeof WindowRenderer !== "undefined") {
            WindowRenderer.drawTheme(this);
        }
    }

    // ============================================
    // SET CONTENT
    // ============================================

    setContent(content, type = "html") {
        console.log("📄 Setting content, type:", type);
        
        // Clear existing content
        this.document.innerHTML = "";
        
        if (content instanceof HTMLElement) {
            this.document.appendChild(content);
        } else if (type === "html") {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            while (tempDiv.firstChild) {
                this.document.appendChild(tempDiv.firstChild);
            }
            console.log(`✅ HTML content set, ${this.document.children.length} children`);
        } else {
            this.document.textContent = content;
            console.log(`✅ Text content set`);
        }
        
        // Fix relative paths
        const images = this.document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && img.src.startsWith('../')) {
                img.src = img.src.replace(/^\.\.\//, '');
            }
        });
        
        const links = this.document.querySelectorAll('a[href]');
        links.forEach(link => {
            if (link.href && link.href.startsWith('../')) {
                link.href = link.href.replace(/^\.\.\//, '');
            }
        });
        
        this.document.style.display = "block";
        this.content.style.display = "block";
        
        setTimeout(() => {
            if (typeof WindowRenderer !== "undefined") {
                WindowRenderer.updateContentPosition(this);
                WindowRenderer.drawTheme(this);
            }
        }, 10);
    }

    // ============================================
    // WINDOW CONTROL METHODS
    // ============================================

    close() {
        console.log("❌ Closing window");

        if (typeof WindowInteractions !== "undefined") {
            WindowInteractions.cleanup(this);
        }

        this.element.style.transition = "all 0.3s ease";
        this.element.style.transform = "scale(0.8)";
        this.element.style.opacity = "0";

        setTimeout(() => {
            this.element.remove();
        }, 300);
    }

    minimize() {
        console.log("➖ Minimizing window");

        this.isMinimized = !this.isMinimized;

        if (this.isMinimized) {
            this._savedRect = {
                width: this.element.style.width,
                height: this.element.style.height,
                left: this.element.style.left,
                top: this.element.style.top
            };

            this.element.style.transition = "all 0.3s ease";
            this.element.style.width = "200px";
            this.element.style.height = "40px";
            this.element.style.left = `${window.innerWidth - 220}px`;
            this.element.style.top = `${window.innerHeight - 60}px`;
            this.element.style.opacity = "0.6";

            this.content.style.display = "none";
            this.titleBar.style.opacity = "0.6";
            this.titleBar.style.fontSize = "14px";
            this.controls.style.opacity = "0";

            if (this.windowIcon && this.theme?.icon?.hideWhenMinimized === true) {
                this.windowIcon.style.display = "none";
            }
        } else {
            this.element.style.transition = "all 0.3s ease";
            this.element.style.width = this._savedRect.width;
            this.element.style.height = this._savedRect.height;
            this.element.style.left = this._savedRect.left;
            this.element.style.top = this._savedRect.top;
            this.element.style.opacity = "1";

            this.content.style.display = "block";
            this.titleBar.style.opacity = "1";
            this.titleBar.style.fontSize = "20px";
            this.controls.style.opacity = "1";

            setTimeout(() => {
                this.redraw();
            }, 350);
        }
    }

    maximize() {
        console.log("⬜ Maximizing window");

        if (this.isMaximized) {
            this.isMaximized = false;

            if (!this._savedRect) return;

            const savedRect = { ...this._savedRect };

            this.element.style.transition = "all 0.3s ease";
            this.element.style.width = savedRect.width;
            this.element.style.height = savedRect.height;
            this.element.style.left = savedRect.left;
            this.element.style.top = savedRect.top;
            this.element.style.borderRadius = "";

            const start = performance.now();

            const animateRestore = (now) => {
                if (this.isMaximized) return;
                this.redraw();
                if (now - start < 300) {
                    requestAnimationFrame(animateRestore);
                } else {
                    this.redraw();
                    this.element.style.transition = "";
                    this.element.style.width = savedRect.width;
                    this.element.style.height = savedRect.height;
                    this.element.style.left = savedRect.left;
                    this.element.style.top = savedRect.top;
                    this._savedRect = null;
                }
            };
            requestAnimationFrame(animateRestore);
            return;
        }

        this._savedRect = {
            width: this.element.style.width,
            height: this.element.style.height,
            left: this.element.style.left,
            top: this.element.style.top
        };

        this.isMaximized = true;

        // For book windows, we skip the decoration adjustment
        if (!this._isBook) {
            const img = this.themeImage;
            let decorationSide = 0;
            if (img) {
                decorationSide = img.width * 0.125;
            }
            // fit to screen with negative offset
            const targetLeft = -decorationSide;
            const targetTop = -decorationSide;
            const targetWidth = window.innerWidth + decorationSide * 2;
            const targetHeight = window.innerHeight + decorationSide * 2;
            this.element.style.transition = "all 0.3s ease";
            this.element.style.left = `${targetLeft}px`;
            this.element.style.top = `${targetTop}px`;
            this.element.style.width = `${targetWidth}px`;
            this.element.style.height = `${targetHeight}px`;
            this.element.style.borderRadius = "0";
        } else {
            // For book windows, simply fill the screen
            this.element.style.transition = "all 0.3s ease";
            this.element.style.left = "0";
            this.element.style.top = "0";
            this.element.style.width = `${window.innerWidth}px`;
            this.element.style.height = `${window.innerHeight}px`;
            this.element.style.borderRadius = "0";
        }

        const start = performance.now();
        const animateMaximize = (now) => {
            if (!this.isMaximized) return;
            this.redraw();
            if (now - start < 300) {
                requestAnimationFrame(animateMaximize);
            }
        };
        requestAnimationFrame(animateMaximize);
    }

    // ============================================
    // GET CONTENT BOUNDS (used by interactions)
    // ============================================

    getContentBounds() {
        const w = this.element.clientWidth;
        const h = this.element.clientHeight;
        const theme = this.theme || {};
        const img = this.themeImage;
        const tri = this.triangleImage;

        let decorationSide = 0;
        if (this._isBook) {
            decorationSide = 0;
        } else if (img) {
            decorationSide = img.width * 0.125;
        } else if (tri) {
            decorationSide = tri.width * 0.125;
        } else {
            decorationSide = 20;
        }

        const inset = theme.inset || 20;
        const topInsetMultiplier = theme.topInsetMultiplier || 2;
        const topInset = inset * topInsetMultiplier;
        const offset = this.contentOffset || { x: 0, y: 0 };

        const left = decorationSide + (offset.x || 0) + inset;
        const top = decorationSide + (offset.y || 0) + topInset;
        const right = w - decorationSide + (offset.x || 0) - inset;
        const bottom = h - decorationSide + (offset.y || 0) - inset;

        const contentWidth = Math.max(0, right - left);
        const contentHeight = Math.max(0, bottom - top);

        return {
            left,
            top,
            right,
            bottom,
            width: contentWidth,
            height: contentHeight
        };
    }

    // ============================================
    // GET SIZE LIMITS
    // ============================================

    getSizeLimits() {
        const maxWidth = this.calculateMaxWidth();
        const maxHeight = this.calculateMaxHeight();

        const minWidth = Math.max(this.minWidth || 100, 80);
        const minHeight = Math.max(this.minHeight || 80, 60);

        return {
            minWidth,
            minHeight,
            maxWidth,
            maxHeight
        };
    }

    // ============================================
    // MAXIMUM WINDOW SIZE
    // ============================================

    calculateMaxWidth() {
        const img = this.themeImage || this.triangleImage;
        if (!img) return window.innerWidth;
        const cellW = img.width / 4;
        return (cellW * 4) - 1;
    }

    calculateMaxHeight() {
        const img = this.themeImage || this.triangleImage;
        if (!img) return window.innerHeight;
        const cellH = img.height / 4;
        return (cellH * 4) - 1;
    }
}

// ============================================
// PUBLIC WINDOW FUNCTION
// ============================================

function createWindow(options = {}) {
    return new DesktopWindow(options);
}

window.DesktopWindow = DesktopWindow;
window.createWindow = createWindow;