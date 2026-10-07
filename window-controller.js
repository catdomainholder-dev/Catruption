// ============================================
// WINDOW CONTROLLER
// ============================================
//
// Handles the relationship between interactive
// objects and DesktopWindow.
//
// Page Images does NOT create, close, focus,
// toggle, or command windows directly.
//
// This system does that.
// ============================================

console.log("🪟 Window Controller loaded");


class WindowController {

    constructor() {

        // InteractiveObject -> DesktopWindow
        this.windows = new Map();

        console.log(
            "✅ Window Controller ready"
        );
    }


    // ========================================
    // GET WINDOW
    // ========================================

    getWindow(object) {

        return this.windows.get(object) || null;
    }


    // ========================================
    // CREATE WINDOW CONFIG
    // ========================================

    _createConfig(object) {

        const element = object.element;

        let documentConfig = null;

        // ------------------------------------
        // WINDOW HTML SYSTEM
        // ------------------------------------

        if (
            typeof WindowHTML !== "undefined" &&
            typeof WindowHTML.parseConfig === "function"
        ) {

            documentConfig =
            WindowHTML.parseConfig(
                element,
                object.originalHTML
            );
        }

        // ------------------------------------
        // NO HTML SYSTEM
        // ------------------------------------

        if (!documentConfig) {

            documentConfig = {
                type: "html",
                content:
                object.originalHTML || ""
            };
        }

        return {

            action:
            element.dataset.windowAction ||
            object.action ||
            "open",

            x:
            parseInt(
                element.dataset.windowX
            ) || 100,

            y:
            parseInt(
                element.dataset.windowY
            ) || 100,

            width:
            parseInt(
                element.dataset.windowWidth
            ) || 500,

            height:
            parseInt(
                element.dataset.windowHeight
            ) || 300,

            theme:
            element.dataset.windowTheme ||
            "steel",

            title:
            element.dataset.windowTitle ||
            "Window",

            document:
            documentConfig
        };
    }


    // ========================================
    // OPEN
    // ========================================

    open(object) {

        if (!object) {
            return null;
        }

        // Already open
        if (this.windows.has(object)) {

            const existing = this.windows.get(object);

            this.focus(object);

            return existing;
        }

        // ------------------------------------
        // GALLERY WINDOW
        // ------------------------------------

        if (object.action === "gallery") {

            const gallerySrc =
            object.gallerySrc ||
            object.element?.dataset?.gallerySrc ||
            "images/manifest.json";

            const galleryName =
            object.galleryName ||
            object.element?.dataset?.gallery ||
            null;

            const galleryFolder =
            object.galleryFolder ||
            object.element?.dataset?.galleryFolder ||
            null;

            return this._createGalleryWindow(
                object,
                gallerySrc,
                galleryName,
                galleryFolder
            );
        }

        // ------------------------------------
        // BOOK WINDOW
        // ------------------------------------

        if (object.action === "book") {
            return this._createBookWindow(object);
        }

        // ------------------------------------
        // MUST HAVE WINDOW CONFIGURATION
        // ------------------------------------

        if (
            !object.element.dataset.window
        ) {

            console.warn(
                `No window configuration for ${object.id}`
            );

            return null;
        }

        const config = this._createConfig(object);

        // ------------------------------------
        // PREPARE HTML / IFRAME
        // ------------------------------------

        let documentConfig = config.document;

        let loadUrl = null;

        if (
            documentConfig &&
            documentConfig.type === "url"
        ) {

            loadUrl = documentConfig.content;
        }

        if (
            typeof WindowHTML !== "undefined" &&
            typeof WindowHTML.prepareDocument ===
            "function"
        ) {

            documentConfig =
            WindowHTML.prepareDocument(
                documentConfig
            );
        }

        // ------------------------------------
        // CREATE DESKTOP WINDOW
        // ------------------------------------

        const options = {

            ...config,

            document:
            documentConfig,

            _parent:
            object
        };

        const windowInstance =
        new DesktopWindow(
            options
        );

        windowInstance._parentObject = object;

        // ------------------------------------
        // STORE
        // ------------------------------------

        this.windows.set(
            object,
            windowInstance
        );

        // ------------------------------------
        // LOAD EXTERNAL HTML
        // ------------------------------------

        if (
            loadUrl &&
            typeof WindowHTML !== "undefined" &&
            typeof WindowHTML.load === "function"
        ) {

            WindowHTML.load(
                windowInstance,
                loadUrl,
                object
            );
        }

        // ------------------------------------
        // CLOSE HANDLER
        // ------------------------------------

        const originalClose =
        windowInstance.close.bind(
            windowInstance
        );

        windowInstance.close = () => {

            this.windows.delete(
                object
            );

            originalClose();
        };

        return windowInstance;
    }


    // ========================================
    // CREATE GALLERY WINDOW
    // ========================================

    _createGalleryWindow(
        object,
        gallerySrc,
        galleryName,
        galleryFolder
    ) {

        const gallerySystem = window.getGallerySystem?.();

        if (!gallerySystem) {

            console.warn(
                "Gallery system not loaded"
            );

            return null;
        }

        // ------------------------------------
        // LOAD MANIFEST
        // ------------------------------------

        gallerySystem
        .loadManifest(gallerySrc)

        .then(() => {

            this._renderGalleryWindow(
                object,
                gallerySrc,
                galleryName,
                galleryFolder,
                gallerySystem
            );

        })

        .catch(error => {

            console.error(
                "Failed to load manifest:",
                error
            );

        });

        return null;
    }


    // ========================================
    // CREATE BOOK WINDOW (Self-contained)
    // ========================================

    _createBookWindow(object) {
        // Get book image source from data attribute or use a hardcoded default
        const bookSrc = object.element.dataset.bookSrc || '/images/books/default.jpg';

        // Create the window using the same config as any other window.
        const config = this._createConfig(object);
        const windowInstance = new DesktopWindow({
            ...config,
            document: { type: 'html', content: '' },
            _parent: object,
            skipRenderer: true   // <-- Prevents WindowRenderer from running
        });
        windowInstance._parentObject = object;

        // Delegate book‑specific setup to the BookWindow module.
        if (typeof BookWindow !== 'undefined' && typeof BookWindow.create === 'function') {
            BookWindow.create(windowInstance, object, bookSrc);
        } else {
            // Fallback if book.js isn't loaded – still works.
            windowInstance._isBook = true;
            windowInstance.content.style.backgroundImage = `url(${bookSrc})`;
            windowInstance.content.style.backgroundSize = 'contain';
            windowInstance.content.style.backgroundRepeat = 'no-repeat';
            windowInstance.content.style.backgroundPosition = 'center';
            windowInstance.document.innerHTML = '';
        }

        // Store the window in the controller's map.
        this.windows.set(object, windowInstance);

        // Override close to clean up the map entry.
        const originalClose = windowInstance.close.bind(windowInstance);
        windowInstance.close = () => {
            this.windows.delete(object);
            originalClose();
        };

        // Book window handles its own rendering – no need to call WindowRenderer.
        // However, we still need to ensure interactions are active (they are,
        // because DesktopWindow constructor already called WindowInteractions.setup).

        return windowInstance;
    }


    // ========================================
    // RENDER GALLERY WINDOW
    // ========================================

    _renderGalleryWindow(
        object,
        gallerySrc,
        galleryName,
        galleryFolder,
        gallerySystem
    ) {

        const element = object.element;

        // ------------------------------------
        // GET NORMAL WINDOW CONFIG
        // ------------------------------------
        //
        // Gallery windows should use the same
        // positioning and sizing system as every
        // other DesktopWindow.
        //
        // Nothing here should invent its own
        // x/y/width/height values.
        // ------------------------------------

        const config = this._createConfig(object);


        // ------------------------------------
        // CREATE WINDOW
        // ------------------------------------

        const windowInstance =
        new DesktopWindow({

            ...config,

            document: {
                type: "html",
                content: ""
            },

            _parent:
            object
        });


        windowInstance._parentObject = object;


        // ------------------------------------
        // SETUP CONTENT
        // ------------------------------------

        const content = windowInstance.content;

        content.innerHTML = "";

        // ---- Do NOT set width/height – let updateContentPosition control them ----
        content.style.padding = "0";
        content.style.margin = "0";
        content.style.overflow = "hidden";
        content.style.background = "rgba(0,0,0,0.1)";
        content.style.display = "flex";
        content.style.flexDirection = "column";


        // ------------------------------------
        // CREATE GALLERY CONTAINER
        // ------------------------------------

        const galleryContainer = document.createElement("div");

        galleryContainer.style.cssText = `
        flex: 1;
        width: 100%;
        height: 100%;
        overflow: hidden;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        `;

        content.appendChild(
            galleryContainer
        );


        // ------------------------------------
        // GET MANIFEST PATH
        // ------------------------------------

        const manifestPath =
        gallerySystem._currentManifestPath ||
        gallerySrc;


        // ------------------------------------
        // CREATE GALLERY VIEWER
        // ------------------------------------

        gallerySystem.createGalleryViewer(
            galleryContainer,
            manifestPath
        );


        // ------------------------------------
        // SHOW SPECIFIC GALLERY
        // ------------------------------------

        if (galleryName) {

            setTimeout(() => {

                gallerySystem.showGallery(
                    galleryName,
                    galleryContainer
                );

            }, 100);
        }


        // ------------------------------------
        // STORE GALLERY REFERENCE
        // ------------------------------------

        windowInstance.galleryContainer = galleryContainer;


        // ------------------------------------
        // STORE WINDOW
        // ------------------------------------

        this.windows.set(
            object,
            windowInstance
        );


        // ------------------------------------
        // NO MANUAL DOM POSITIONING
        // ------------------------------------
        //
        // DesktopWindow already creates the
        // window, positions it, and appends it
        // to the document.
        //
        // Do NOT append it to another layer here.
        // Do NOT force position: fixed here.
        // ------------------------------------


        // ------------------------------------
        // DRAW THEME
        // ------------------------------------

        if (
            typeof WindowRenderer !== "undefined"
        ) {

            WindowRenderer.drawTheme(
                windowInstance
            );

            WindowRenderer.updateContentPosition(
                windowInstance
            );

            WindowRenderer.updateClickOverlay(
                windowInstance
            );
        }


        // ------------------------------------
        // STORE REFERENCES
        // ------------------------------------

        windowInstance.element._windowInstance = windowInstance;

        windowInstance.element._ownerObject = object;


        // ------------------------------------
        // FOCUS
        // ------------------------------------

        this.focus(object);


        // ------------------------------------
        // CLOSE HANDLER
        // ------------------------------------

        const originalClose =
        windowInstance.close.bind(
            windowInstance
        );

        windowInstance.close = () => {

            this.windows.delete(
                object
            );

            originalClose();
        };


        console.log(
            `🖼️ Gallery window created`
        );

        return windowInstance;
    }


    // ========================================
    // TOGGLE
    // ========================================

    toggle(object) {

        if (!object) {
            return;
        }

        if (
            this.windows.has(object)
        ) {

            this.close(object);

        } else {

            this.open(object);
        }
    }


    // ========================================
    // CLOSE
    // ========================================

    close(object) {

        const windowInstance = this.windows.get(object);

        if (!windowInstance) {
            return;
        }

        this.windows.delete(
            object
        );

        windowInstance.close();
    }


    // ========================================
    // FOCUS
    // ========================================

    focus(object) {

        const windowInstance = this.windows.get(object);

        if (!windowInstance) {
            return;
        }

        const windows =
        document.querySelectorAll(
            ".window"
        );

        let maxZ = 9999;

        windows.forEach(
            windowElement => {

                const z =
                parseInt(
                    windowElement.style.zIndex
                ) || 9999;

                if (z > maxZ) {
                    maxZ = z;
                }
            }
        );

        windowInstance.element.style.zIndex = maxZ + 1;
    }


    // ========================================
    // COMMAND
    // ========================================

    command(object) {

        if (!object) {
            return;
        }

        const command = object.command;

        if (!command) {

            console.warn(
                `No command defined for ${object.id}`
            );

            return;
        }

        const send = () => {

            const windowInstance = this.windows.get(object);

            if (!windowInstance) {
                return;
            }

            let data = {};

            if (object.commandData) {

                try {

                    data =
                    JSON.parse(
                        object.commandData
                    );

                } catch (error) {

                    console.warn(
                        "Invalid commandData JSON:",
                        error
                    );
                }
            }

            windowInstance.element.dispatchEvent(
                new CustomEvent(
                    "window-command",
                    {
                        detail: {
                            command,
                            data,
                            source:
                            object.id
                        }
                    }
                )
            );
        };


        // ------------------------------------
        // OPEN FIRST IF NECESSARY
        // ------------------------------------

        if (
            !this.windows.has(object)
        ) {

            this.open(object);

            setTimeout(
                send,
                100
            );

            return;
        }

        send();
    }


    // ========================================
    // CLOSE ALL
    // ========================================

    closeAll() {

        const objects =
        Array.from(
            this.windows.keys()
        );

        objects.forEach(
            object => {

                this.close(object);

            }
        );
    }
}


// ============================================
// GLOBAL
// ============================================

const windowController = new WindowController();

window.WindowController = WindowController;

window.windowController = windowController;

console.log(
    "✅ Window Controller ready"
);