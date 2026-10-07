console.log("window renderer loaded");

// ============================================
// WINDOW RENDERER
// ============================================

const WindowRenderer = {

    // ========================================
    // SETUP
    // ========================================

    setup(windowInstance) {
        console.log(
            "🎨 Setting up window renderer for:",
            windowInstance.themeName
        );

        this.loadThemeFromJSON(windowInstance);
    },

    // ========================================
    // LOAD THEME FROM JSON
    // ========================================

    loadThemeFromJSON(windowInstance) {
        const themeName = windowInstance.themeName;
        const jsonPath = `themes/${themeName}.json`;

        console.log(`📂 Loading theme from: ${jsonPath}`);

        fetch(jsonPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(themeData => {
                console.log(`✅ Loaded theme from JSON:`, themeData);
                windowInstance.theme = themeData;
                this.applyThemeStyles(windowInstance);
                
                // Load images from the new structure
                this.loadThemeImagesFromConfig(windowInstance);
            })
            .catch(error => {
                console.error(`❌ Failed to load theme from ${jsonPath}:`, error);
                console.log("⚠️ Using default theme settings");
                windowInstance.theme = {};
                this.applyThemeStyles(windowInstance);
                this.loadThemeImage(windowInstance); // Fallback to old method
                this.loadTriangleImage(windowInstance);
            });
    },

    // ========================================
    // LOAD THEME IMAGES FROM CONFIG
    // ========================================

    loadThemeImagesFromConfig(windowInstance) {
        const theme = windowInstance.theme || {};
        const themeName = windowInstance.themeName;
        const imagesConfig = theme.images || {};

        // Load corners image (squares)
        if (imagesConfig.corners) {
            this.loadCornerImage(windowInstance, imagesConfig.corners, themeName);
        } else {
            // Fallback to old method
            this.loadThemeImage(windowInstance);
        }

        // Load edges image (triangles)
        if (imagesConfig.edges) {
            this.loadEdgeImage(windowInstance, imagesConfig.edges, themeName);
        } else {
            // Fallback to old method
            this.loadTriangleImage(windowInstance);
        }
    },

    // ========================================
    // IMAGE PATH BUILDING (shared by corner/edge/legacy loaders)
    // ========================================

    buildImagePaths(config, defaultName, themeName) {
        const imagePath = (config && config.path) || defaultName;

        let fullPath;
        if (config && config.basePath) {
            fullPath = `${config.basePath}/${imagePath}`;
        } else if (imagePath.includes('/')) {
            fullPath = imagePath;
        } else {
            fullPath = `images/themes/${themeName}/${imagePath}`;
        }

        const extensions = (config && config.extensions) || ['.webp', '.png'];
        const base = fullPath.replace(/\.[^.]+$/, '');
        const paths = extensions.map(ext => `${base}${ext}`);
        if (!paths.includes(fullPath)) paths.push(fullPath);
        return paths;
    },

    // ========================================
    // GENERIC IMAGE LOADER (tries each path until one succeeds)
    // ========================================

    loadImageWithFallback(paths, onSuccess, onFail) {
        const tryNext = (index) => {
            if (index >= paths.length) {
                if (onFail) onFail();
                return;
            }
            const path = paths[index];
            if (!path) { tryNext(index + 1); return; }

            const image = new Image();
            image.onload = () => onSuccess(image, path);
            image.onerror = () => tryNext(index + 1);
            image.src = path;
        };
        tryNext(0);
    },

    // ========================================
    // LOAD CORNER IMAGE
    // ========================================

    loadCornerImage(windowInstance, config, themeName) {
        const paths = this.buildImagePaths(config, 'squares.webp', themeName);

        this.loadImageWithFallback(paths, (image) => {
            windowInstance.themeImage = image;
            windowInstance.cornerConfig = config;

            const grid = config.grid || { columns: 4, rows: 4 };
            const [cornerCols, cornerRows] = (config.cornerSize || '2x2').split('x').map(Number);
            windowInstance.cornerGrid = {
                columns: grid.columns,
                rows: grid.rows,
                cornerCols: cornerCols || 2,
                cornerRows: cornerRows || 2
            };

            this.updateSizeConstraints(windowInstance);
            this.drawTheme(windowInstance);
        }, () => {
            console.error(`❌ Corner image failed for "${windowInstance.themeName}".`);
        });
    },

    // ========================================
    // LOAD EDGE IMAGE
    // ========================================

    loadEdgeImage(windowInstance, config, themeName) {
        const paths = this.buildImagePaths(config, 'triangles.webp', themeName);

        this.loadImageWithFallback(paths, (image) => {
            windowInstance.triangleImage = image;
            windowInstance.edgeConfig = config;
            windowInstance.edgeType = config.edgeType || 'diagonal';

            if (!windowInstance.maxWidth || windowInstance.maxWidth === Infinity) {
                this.updateSizeConstraints(windowInstance);
            }
            this.drawTheme(windowInstance);
        }, () => {
            console.warn(`⚠️ Edge image failed for "${windowInstance.themeName}".`);
            windowInstance.triangleImage = null;
        });
    },

    // ========================================
    // APPLY THEME STYLES
    // ========================================

    applyThemeStyles(windowInstance) {
        const theme = windowInstance.theme || {};
        const windowStyle = theme.window || {};
        const contentStyle = theme.innerContent || theme.content || {};
        const titleStyle = theme.titleBar || {};

        const element = windowInstance.element;

        // ----------------------------------------
        // WINDOW
        // ----------------------------------------

        element.style.background =
            windowStyle.background !== undefined
                ? windowStyle.background
                : "rgba(20, 20, 30, 0.95)";

        element.style.border =
            windowStyle.border !== undefined
                ? windowStyle.border
                : "3px solid white";

        element.style.boxShadow =
            windowStyle.boxShadow !== undefined
                ? windowStyle.boxShadow
                : "none";

        element.style.color =
            windowStyle.color !== undefined
                ? windowStyle.color
                : "white";

        // ----------------------------------------
        // TITLE BAR
        // ----------------------------------------

        const titleBar = windowInstance.titleBar;

        titleBar.style.fontSize =
            titleStyle.fontSize !== undefined
                ? titleStyle.fontSize
                : "20px";

        titleBar.style.fontWeight =
            titleStyle.fontWeight !== undefined
                ? titleStyle.fontWeight
                : "bold";

        titleBar.style.color =
            titleStyle.color !== undefined
                ? titleStyle.color
                : "white";

        titleBar.style.textShadow =
            titleStyle.textShadow !== undefined
                ? titleStyle.textShadow
                : "0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7)";

        // ----------------------------------------
        // CONTENT
        // ----------------------------------------

        const content = windowInstance.content;

        content.style.color =
            contentStyle.color !== undefined
                ? contentStyle.color
                : "white";

        content.style.fontSize =
            contentStyle.fontSize !== undefined
                ? contentStyle.fontSize
                : "24px";

        content.style.fontWeight =
            contentStyle.fontWeight !== undefined
                ? contentStyle.fontWeight
                : "bold";

        content.style.textShadow =
            contentStyle.textShadow !== undefined
                ? contentStyle.textShadow
                : "0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7)";

        content.style.background =
            contentStyle.background !== undefined
                ? contentStyle.background
                : "rgba(0, 0, 0, 0.3)";

        content.style.border =
            contentStyle.border !== undefined
                ? contentStyle.border
                : "2px solid rgba(255, 255, 255, 0.3)";

        content.style.borderRadius =
            contentStyle.borderRadius !== undefined
                ? contentStyle.borderRadius
                : "8px";

        content.style.padding =
            contentStyle.padding !== undefined
                ? contentStyle.padding
                : "12px 24px";

        if (contentStyle.boxShadow !== undefined) {
            content.style.boxShadow = contentStyle.boxShadow;
        }

        if (contentStyle.maxWidth !== undefined) {
            content.style.maxWidth = contentStyle.maxWidth;
        }

        if (contentStyle.maxHeight !== undefined) {
            content.style.maxHeight = contentStyle.maxHeight;
        }

        if (contentStyle.borderTop !== undefined) {
            content.style.borderTop = contentStyle.borderTop;
        }

        if (contentStyle.borderBottom !== undefined) {
            content.style.borderBottom = contentStyle.borderBottom;
        }

        // ----------------------------------------
        // BLEND
        // ----------------------------------------

        if (theme.blend && theme.blend.alpha !== undefined) {
            element.style.opacity = theme.blend.alpha;
        }

        // ----------------------------------------
        // WINDOW ICON
        // ----------------------------------------

        this.applyWindowIconTheme(windowInstance);

        // ============================================
        // 🔥 Position content immediately (fix for no‑image case)
        // ============================================
        this.updateContentPosition(windowInstance);
    },

    // ========================================
    // WINDOW ICON THEME
    // ========================================

    applyWindowIconTheme(windowInstance) {
        const icon = windowInstance.windowIcon;
        if (!icon) return;

        const iconStyle = (windowInstance.theme || {}).icon || {};
        const enabled = iconStyle.enabled !== false;
        icon.style.display = enabled && icon.src ? "block" : "none";
        if (!enabled) return;

        if (iconStyle.size !== undefined) {
            const size = iconStyle.size;
            icon.style.width = typeof size === "string" ? size : `${size}px`;
            icon.style.height = typeof size === "string" ? size : `${size}px`;
        }
        if (iconStyle.opacity !== undefined) {
            icon.style.opacity = iconStyle.opacity;
        }
        if (iconStyle.objectFit !== undefined) {
            icon.style.objectFit = iconStyle.objectFit;
        }
        this.updateWindowIconPosition(windowInstance);
    },

    // ========================================
    // UPDATE WINDOW ICON POSITION
    // ========================================

    updateWindowIconPosition(windowInstance) {
        const icon = windowInstance.windowIcon;
        if (!icon || icon.style.display === "none") return;

        const theme = windowInstance.theme || {};
        const iconStyle = theme.icon || {};
        const element = windowInstance.element;
        const w = element.clientWidth;
        const h = element.clientHeight;
        const size = iconStyle.size !== undefined
            ? (typeof iconStyle.size === "number" ? iconStyle.size : parseFloat(iconStyle.size) || 64)
            : 64;
        const offsetX = iconStyle.offsetX !== undefined ? Number(iconStyle.offsetX) : 0;
        const offsetY = iconStyle.offsetY !== undefined ? Number(iconStyle.offsetY) : 0;
        const position = iconStyle.position || "top-right";

        let left = 0, top = 0;
        switch (position) {
            case "top-left":
                left = offsetX;
                top = offsetY;
                break;
            case "top-center":
                left = (w - size) / 2 + offsetX;
                top = offsetY;
                break;
            case "top-right":
            default:
                left = w - size + offsetX;
                top = offsetY;
                break;
            case "bottom-left":
                left = offsetX;
                top = h - size + offsetY;
                break;
            case "bottom-center":
                left = (w - size) / 2 + offsetX;
                top = h - size + offsetY;
                break;
            case "bottom-right":
                left = w - size + offsetX;
                top = h - size + offsetY;
                break;
        }
        icon.style.position = "absolute";
        icon.style.left = `${left}px`;
        icon.style.top = `${top}px`;
        icon.style.width = `${size}px`;
        icon.style.height = `${size}px`;
        icon.style.zIndex = iconStyle.zIndex !== undefined ? iconStyle.zIndex : "100";
    },

    // ========================================
    // UPDATE CONTENT POSITION – Full version with fix
    // ========================================

    updateContentPosition(windowInstance) {
        const element = windowInstance.element;
        const theme = windowInstance.theme || {};
        const img = windowInstance.themeImage;
        const tri = windowInstance.triangleImage;

        // ========================================
        // FIX: Use proper fallback when images aren't loaded
        // ========================================
        
        let decorationSide = 0;
        
        // Use loaded images if available
        if (img && img.width > 0 && img.height > 0) {
            decorationSide = img.width * 0.125;
        } else if (tri && tri.width > 0 && tri.height > 0) {
            decorationSide = tri.width * 0.125;
        } else {
            // Images not loaded yet - use a fixed reasonable value
            // This prevents the "reverse movement" bug
            const minDim = Math.min(element.clientWidth, element.clientHeight);
            decorationSide = Math.max(40, minDim * 0.08);
        }

        const w = element.clientWidth;
        const h = element.clientHeight;
        const inset = theme.inset || 20;
        const topInsetMultiplier = theme.topInsetMultiplier || 2;
        const topInset = inset * topInsetMultiplier;
        const contentOffset = windowInstance.contentOffset || { x: 0, y: 0 };

        const contentLeft = decorationSide + (contentOffset.x || 0) + inset;
        const contentTop = decorationSide + (contentOffset.y || 0) + topInset;
        const contentRight = w - decorationSide + (contentOffset.x || 0) - inset;
        const contentBottom = h - decorationSide + (contentOffset.y || 0) - inset;
        const contentWidth = Math.max(0, contentRight - contentLeft);
        const contentHeight = Math.max(0, contentBottom - contentTop);

        const content = windowInstance.content;
        content.style.left = `${contentLeft}px`;
        content.style.top = `${contentTop}px`;
        content.style.width = `${Math.max(0, contentWidth)}px`;
        content.style.height = `${Math.max(0, contentHeight)}px`;

        // ----------------------------------------
        // TITLE BAR
        // ----------------------------------------
        const titleBar = windowInstance.titleBar;
        const titleStyle = theme.titleBar || {};
        const titlePosition = titleStyle.position || "top-center";
        const titleOffsetX = titleStyle.offsetX !== undefined ? titleStyle.offsetX : 0;
        const titleOffsetY = titleStyle.offsetY !== undefined ? titleStyle.offsetY : 0;
        const titleBarHeight = 20;
        const titleWidth = titleBar.offsetWidth || 100;

        let titleLeft, titleTop;
        switch (titlePosition) {
            case "top-left":
                titleLeft = contentLeft + titleOffsetX;
                titleTop = contentTop - titleBarHeight - 8 + titleOffsetY;
                titleBar.style.transform = "none";
                break;
            case "top-center":
            default:
                titleLeft = contentLeft + (contentWidth / 2) + titleOffsetX;
                titleTop = contentTop - titleBarHeight - 8 + titleOffsetY;
                titleBar.style.transform = "translateX(-50%)";
                break;
            case "top-right":
                titleLeft = contentRight + titleOffsetX;
                titleTop = contentTop - titleBarHeight - 8 + titleOffsetY;
                titleBar.style.transform = "translateX(-100%)";
                break;
            case "bottom-left":
                titleLeft = contentLeft + titleOffsetX;
                titleTop = contentBottom + 8 + titleOffsetY;
                titleBar.style.transform = "none";
                break;
            case "bottom-center":
                titleLeft = contentLeft + (contentWidth / 2) + titleOffsetX;
                titleTop = contentBottom + 8 + titleOffsetY;
                titleBar.style.transform = "translateX(-50%)";
                break;
            case "bottom-right":
                titleLeft = contentRight + titleOffsetX;
                titleTop = contentBottom + 8 + titleOffsetY;
                titleBar.style.transform = "translateX(-100%)";
                break;
        }
        titleBar.style.display = "block";
        titleBar.style.left = `${titleLeft}px`;
        titleBar.style.top = `${titleTop}px`;
        titleBar.style.maxWidth = `${contentWidth}px`;
        titleBar.style.opacity = "1";

        // ----------------------------------------
        // WINDOW ICON
        // ----------------------------------------
        this.updateWindowIconPosition(windowInstance);

        // ----------------------------------------
        // CONTROLS
        // ----------------------------------------
        if (windowInstance.controls) {
            const controls = windowInstance.controls;
            const controlStyle = (windowInstance.theme || {}).controls || {};
            const position = controlStyle.position || "top-center";
            const offsetX = controlStyle.offsetX !== undefined ? controlStyle.offsetX : 0;
            const offsetY = controlStyle.offsetY !== undefined ? controlStyle.offsetY : 0;
            const buttonSize = controlStyle.size || 80;
            const overlap = controlStyle.overlap || 25;
            const totalWidth = buttonSize * 3 - overlap * 2;
            const buttons = controls.querySelectorAll("img");
            buttons.forEach((btn, index) => {
                btn.style.left = `${index * (buttonSize - overlap)}px`;
                btn.style.top = "0px";
                btn.style.width = `${buttonSize}px`;
                btn.style.height = `${buttonSize}px`;
            });
            controls.style.width = `${totalWidth}px`;
            controls.style.height = `${buttonSize}px`;

            let controlsLeft, controlsTop;
            switch (position) {
                case "top-left":
                    controlsLeft = offsetX;
                    controlsTop = offsetY;
                    break;
                case "top-center":
                default:
                    controlsLeft = (w - totalWidth) / 2 + offsetX;
                    controlsTop = offsetY;
                    break;
                case "top-right":
                    controlsLeft = w - totalWidth + offsetX;
                    controlsTop = offsetY;
                    break;
                case "bottom-left":
                    controlsLeft = offsetX;
                    controlsTop = h - buttonSize + offsetY;
                    break;
                case "bottom-center":
                    controlsLeft = (w - totalWidth) / 2 + offsetX;
                    controlsTop = h - buttonSize + offsetY;
                    break;
                case "bottom-right":
                    controlsLeft = w - totalWidth + offsetX;
                    controlsTop = h - buttonSize + offsetY;
                    break;
            }
            controls.style.position = "absolute";
            controls.style.left = `${controlsLeft}px`;
            controls.style.top = `${controlsTop}px`;
            controls.style.transform = "none";
            controls.style.margin = "0";
            controls.style.opacity = controlStyle.enabled === false ? "0" : "1";
        }

        // ----------------------------------------
        // HIDE CONTENT WHEN TOO SMALL
        // ----------------------------------------
        content.style.opacity = (contentWidth < 20 || contentHeight < 20) ? "0" : "1";
    },

    // ========================================
    // APPLY CONTROL THEME
    // ========================================

    applyControlTheme(windowInstance) {
        const theme = windowInstance.theme || {};
        const controls = windowInstance.controls;
        if (!controls) return;
        const themeName = windowInstance.themeName || 'steel';
        const imagePath = `images/themes/${themeName}`;
        windowInstance.controlImagePath = imagePath;
        const buttons = controls.querySelectorAll("img");
        buttons.forEach((btn) => {
            const id = btn.alt;
            const ext = '.png';
            const normalName = id === "close" ? `close${ext}` :
                              id === "minimize" ? `minimize${ext}` :
                              `maximize${ext}`;
            btn.src = `${imagePath}/${normalName}`;
            btn.dataset.normalSrc = btn.src;
        });
    },

    // ========================================
    // LOAD THEME IMAGE (SQUARES) - Legacy support
    // ========================================

    loadThemeImage(windowInstance) {
        const themeName = windowInstance.themeName;
        let imagePath = windowInstance.options.imagePath || (windowInstance.theme || {}).image;
        if (imagePath && !imagePath.includes("/")) {
            imagePath = `images/themes/${themeName}/${imagePath}`;
        }

        const paths = imagePath
            ? [imagePath]
            : [
                `images/themes/${themeName}/squares.webp`,
                `images/themes/${themeName}/squares.png`,
                `images/themes/default/squares.webp`
            ];

        this.loadImageWithFallback(paths, (image) => {
            windowInstance.themeImage = image;
            this.updateSizeConstraints(windowInstance);
            this.drawTheme(windowInstance);
        }, () => {
            console.error(`❌ Theme image failed for "${themeName}".`);
        });
    },

    // ========================================
    // LOAD TRIANGLE IMAGE - Legacy support
    // ========================================

    loadTriangleImage(windowInstance) {
        const themeName = windowInstance.themeName;
        const paths = [
            `images/themes/${themeName}/triangles.webp`,
            `images/themes/${themeName}/triangles.png`,
            `images/themes/default/triangles.webp`
        ];

        this.loadImageWithFallback(paths, (image) => {
            windowInstance.triangleImage = image;
            if (!windowInstance.maxWidth || windowInstance.maxWidth === Infinity) {
                this.updateSizeConstraints(windowInstance);
            }
            this.drawTheme(windowInstance);
        }, () => {
            console.warn(`⚠️ No triangles image found for theme "${themeName}".`);
            windowInstance.triangleImage = null;
        });
    },

    // ========================================
    // UPDATE SIZE CONSTRAINTS
    // ========================================

    updateSizeConstraints(windowInstance) {
        const img = windowInstance.themeImage || windowInstance.triangleImage;
        if (!img) {
            console.warn("⚠️ No image loaded yet, cannot set max size");
            return;
        }

        // Use the grid configuration if available
        const grid = windowInstance.cornerGrid || { columns: 4, rows: 4, cornerCols: 2, cornerRows: 2 };
        const cellW = img.width / grid.columns;
        const cellH = img.height / grid.rows;
        const cornerW = cellW * grid.cornerCols;
        const cornerH = cellH * grid.cornerRows;

        windowInstance.maxWidth = (cornerW * 2) - 1;
        windowInstance.maxHeight = (cornerH * 2) - 1;
        
        if (windowInstance.minWidth < 80) windowInstance.minWidth = 80;
        if (windowInstance.minHeight < 80) windowInstance.minHeight = 80;

        console.log("📏 Size constraints updated:");
        console.log(`  Min: ${windowInstance.minWidth}x${windowInstance.minHeight}`);
        console.log(`  Max: ${windowInstance.maxWidth}x${windowInstance.maxHeight}`);

        if (!windowInstance.defaultSizeSet) {
            windowInstance.defaultSizeSet = true;
            const defaultWidth = Math.max(windowInstance.minWidth, windowInstance.maxWidth * 0.8);
            const defaultHeight = Math.max(windowInstance.minHeight, windowInstance.maxHeight * 0.8);
            if (!windowInstance.options.width && !windowInstance.options.height) {
                windowInstance.element.style.width = `${defaultWidth}px`;
                windowInstance.element.style.height = `${defaultHeight}px`;
                console.log(`📐 Setting default size to 80% of max: ${defaultWidth}x${defaultHeight}`);
            }
        }

        // Clamp current size to new max/min
        const currentWidth = parseInt(windowInstance.element.style.width) || 0;
        const currentHeight = parseInt(windowInstance.element.style.height) || 0;
        if (currentWidth > windowInstance.maxWidth) {
            windowInstance.element.style.width = `${windowInstance.maxWidth}px`;
        }
        if (currentWidth < windowInstance.minWidth) {
            windowInstance.element.style.width = `${windowInstance.minWidth}px`;
        }
        if (currentHeight > windowInstance.maxHeight) {
            windowInstance.element.style.height = `${windowInstance.maxHeight}px`;
        }
        if (currentHeight < windowInstance.minHeight) {
            windowInstance.element.style.height = `${windowInstance.minHeight}px`;
        }
    },

    // ========================================
    // DRAW THEME (SQUARES + TRIANGLES)
    // ========================================

    drawTheme(windowInstance) {
        const canvas = windowInstance.canvas;
        const ctx = canvas.getContext("2d");
        const element = windowInstance.element;
        const w = element.clientWidth;
        const h = element.clientHeight;

        canvas.width = w;
        canvas.height = h;

        ctx.clearRect(0, 0, w, h);

        // Get layering configuration
        const theme = windowInstance.theme || {};
        const layerOrder = theme.layerOrder || ['corners', 'edges'];
        
        // Create render functions for each layer type
        const renderFunctions = {
            'corners': () => this.drawCorners(windowInstance, ctx, w, h),
            'edges': () => this.drawEdges(windowInstance, ctx, w, h)
        };

        // Render in the specified order
        layerOrder.forEach(layerName => {
            if (renderFunctions[layerName]) {
                renderFunctions[layerName]();
            }
        });

        // Update content positions (title bar, controls, icon, etc.)
        this.updateContentPosition(windowInstance);
        this.updateClickOverlay(windowInstance);
    },

    // ========================================
    // DRAW CORNERS (SQUARES)
    // ========================================

    drawCorners(windowInstance, ctx, w, h) {
        const img = windowInstance.themeImage;
        if (!img) return;

        const grid = windowInstance.cornerGrid || { columns: 4, rows: 4, cornerCols: 2, cornerRows: 2 };
        const cellW = img.width / grid.columns;
        const cellH = img.height / grid.rows;
        const cornerW = cellW * grid.cornerCols;
        const cornerH = cellH * grid.cornerRows;
        const overlapX = Math.max(0, cornerW - w / 2);
        const overlapY = Math.max(0, cornerH - h / 2);

        const drawQuadrant = (sx, sy, dx, dy, cropLeft, cropRight, cropTop, cropBottom) => {
            const visibleW = cornerW - cropLeft - cropRight;
            const visibleH = cornerH - cropTop - cropBottom;
            if (visibleW <= 0 || visibleH <= 0) return;
            ctx.drawImage(
                img,
                sx + cropLeft, sy + cropTop,
                visibleW, visibleH,
                dx + cropLeft, dy + cropTop,
                visibleW, visibleH
            );
        };

        const cropRight = Math.min(overlapX, cornerW);
        const cropLeft = Math.min(overlapX, cornerW);
        const cropBottom = Math.min(overlapY, cornerH);
        const cropTop = Math.min(overlapY, cornerH);

        drawQuadrant(0, 0, 0, 0, 0, cropRight, 0, cropBottom);
        drawQuadrant(cornerW, 0, w - cornerW, 0, cropLeft, 0, 0, cropBottom);
        drawQuadrant(0, cornerH, 0, h - cornerH, 0, cropRight, cropTop, 0);
        drawQuadrant(cornerW, cornerH, w - cornerW, h - cornerH, cropLeft, 0, cropTop, 0);
    },

    // ========================================
    // DRAW EDGES (TRIANGLES)
    // ========================================

    drawEdges(windowInstance, ctx, w, h) {
        const img = windowInstance.triangleImage;
        if (!img) return;

        const sw = img.width;
        const sh = img.height;
        if (sw <= 0 || sh <= 0) return;

        const edgeType = windowInstance.edgeType || 'diagonal';
        
        if (edgeType === 'diagonal') {
            this.drawDiagonalEdges(windowInstance, ctx, w, h, img, sw, sh);
        } else {
            this.drawDiagonalEdges(windowInstance, ctx, w, h, img, sw, sh);
        }
    },

    // ========================================
    // DRAW DIAGONAL EDGES
    // ========================================

    drawDiagonalEdges(windowInstance, ctx, w, h, img, sw, sh) {
        const lhs = w * sh;
        const rhs = h * sw;

        let top, right, bottom, left;

        if (lhs <= rhs) {
            const topApexY = (w * sh) / (2 * sw);
            const bottomApexY = h - topApexY;
            const apexX = w / 2;

            top    = [[0, 0], [w, 0], [apexX, topApexY]];
            bottom = [[w, h], [0, h], [apexX, bottomApexY]];
            left   = [[0, 0], [apexX, topApexY], [apexX, bottomApexY], [0, h]];
            right  = [[w, 0], [apexX, topApexY], [apexX, bottomApexY], [w, h]];
        } else {
            const leftApexX = (h * sw) / (2 * sh);
            const rightApexX = w - leftApexX;
            const apexY = h / 2;

            left   = [[0, 0], [0, h], [leftApexX, apexY]];
            right  = [[w, 0], [w, h], [rightApexX, apexY]];
            top    = [[0, 0], [w, 0], [rightApexX, apexY], [leftApexX, apexY]];
            bottom = [[0, h], [w, h], [rightApexX, apexY], [leftApexX, apexY]];
        }

        const edgePieces = {
            top:    { dx: (w - sw) / 2, dy: 0 },
            right:  { dx: w - sw,       dy: (h - sh) / 2 },
            bottom: { dx: (w - sw) / 2, dy: h - sh },
            left:   { dx: 0,            dy: (h - sh) / 2 }
        };

        const regions = [
            { poly: top,    piece: edgePieces.top },
            { poly: right,  piece: edgePieces.right },
            { poly: bottom, piece: edgePieces.bottom },
            { poly: left,   piece: edgePieces.left }
        ];

        const SEAM_OVERLAP = 0.75;
        const expand = (pts) => {
            const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
            const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
            return pts.map(([x, y]) => {
                const dx = x - cx, dy = y - cy;
                const len = Math.hypot(dx, dy) || 1;
                return [x + (dx / len) * SEAM_OVERLAP, y + (dy / len) * SEAM_OVERLAP];
            });
        };

        regions.forEach(({ poly, piece }) => {
            const clipPoly = expand(poly);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(clipPoly[0][0], clipPoly[0][1]);
            for (let i = 1; i < clipPoly.length; i++) {
                ctx.lineTo(clipPoly[i][0], clipPoly[i][1]);
            }
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, piece.dx, piece.dy);
            ctx.restore();
        });
    },

    // ========================================
    // UPDATE CLICK OVERLAY
    // ========================================

    updateClickOverlay(windowInstance) {
        const element = windowInstance.element;
        const content = windowInstance.content;
        const w = element.clientWidth;
        const h = element.clientHeight;

        if (windowInstance.clickOverlays) {
            windowInstance.clickOverlays.forEach(el => el.remove());
        }
        windowInstance.clickOverlays = [];

        const contentLeft = parseInt(content.style.left) || 0;
        const contentTop = parseInt(content.style.top) || 0;
        const contentWidth = parseInt(content.style.width) || 0;
        const contentHeight = parseInt(content.style.height) || 0;
        const contentRight = contentLeft + contentWidth;
        const contentBottom = contentTop + contentHeight;
        const handleSize = 8;

        const overlayLeft = Math.max(0, contentLeft - handleSize);
        const overlayTop = Math.max(0, contentTop - handleSize);
        const overlayRight = Math.min(w, contentRight + handleSize);
        const overlayBottom = Math.min(h, contentBottom + handleSize);

        const relayMousedown = (e) => {
            const target = e.target;
            if (target !== windowInstance.titleBar &&
                !windowInstance.titleBar.contains(target) &&
                target !== windowInstance.controls &&
                !windowInstance.controls.contains(target)) {
                const newEvent = new MouseEvent("mousedown", {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    button: e.button,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                    bubbles: true,
                    cancelable: true
                });
                windowInstance.element.dispatchEvent(newEvent);
            }
        };

        const makeStrip = (left, top, width, height) => {
            if (width <= 0 || height <= 0) return;
            const strip = document.createElement("div");
            strip.style.position = "absolute";
            strip.style.left = `${left}px`;
            strip.style.top = `${top}px`;
            strip.style.width = `${width}px`;
            strip.style.height = `${height}px`;
            strip.style.pointerEvents = "auto";
            strip.style.zIndex = "1";
            strip.style.background = "transparent";
            strip.style.border = "none";
            strip.style.outline = "none";
            strip.addEventListener("mousedown", relayMousedown);
            element.appendChild(strip);
            windowInstance.clickOverlays.push(strip);
        };

        // Four border strips instead of one full-coverage rectangle.
        // This only catches clicks in the resize-handle band around the
        // content edges - it never sits on top of the content interior,
        // so wheel/click/drag events over actual content (scrolling,
        // gallery clicks, etc.) reach `content` normally instead of
        // getting swallowed by a transparent div sitting above it.
        makeStrip(overlayLeft, overlayTop, overlayRight - overlayLeft, contentTop - overlayTop);            // top
        makeStrip(overlayLeft, contentBottom, overlayRight - overlayLeft, overlayBottom - contentBottom);   // bottom
        makeStrip(overlayLeft, contentTop, contentLeft - overlayLeft, contentBottom - contentTop);          // left
        makeStrip(contentRight, contentTop, overlayRight - contentRight, contentBottom - contentTop);       // right

        element.style.pointerEvents = "none";
        windowInstance.canvas.style.pointerEvents = "none";
        content.style.pointerEvents = "auto";
        windowInstance.titleBar.style.pointerEvents = "auto";
        windowInstance.titleBar.style.cursor = "move";
        if (windowInstance.controls) {
            windowInstance.controls.style.pointerEvents = "auto";
        }
        if (windowInstance.windowIcon) {
            windowInstance.windowIcon.style.pointerEvents = "none";
        }
    },

    // ========================================
    // UPDATE
    // ========================================

    update(windowInstance) {
        this.drawTheme(windowInstance);
    }
};

// ============================================
// PUBLIC ACCESS
// ============================================

window.WindowRenderer = WindowRenderer;