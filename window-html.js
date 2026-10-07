// ============================================
// WINDOW HTML SYSTEM
// ============================================
//
// Handles HTML/iframe content for DesktopWindow.
//
// This system does NOT create interactive images,
// handle clicking, dragging, resizing, etc.
//
// Its job is:
//
//   - Parse HTML window configuration
//   - Prepare iframe content
//   - Load HTML files
//   - Put loaded HTML into a DesktopWindow
//   - Execute scripts contained in loaded HTML
//   - Provide shared gallery behavior
//   - Initialize gallery layouts
//   - Scale gallery images based on source dimensions
// ============================================

console.log("📄 Window HTML System loaded");


// ============================================
// MAIN OBJECT
// ============================================

const WindowHTML = {

    // ========================================
    // PARSE WINDOW HTML CONFIG
    // ========================================

    parseConfig(element, originalHTML = "") {

        if (!element.dataset.window) {
            return null;
        }

        const htmlFile = element.dataset.windowHtml || null;

        const windowUrl = element.dataset.windowUrl || null;

        let content = null;
        let contentType = "html";


        // ------------------------------------
        // EXTERNAL WEBSITE / IFRAME
        // ------------------------------------

        if (windowUrl) {

            contentType = "iframe";
            content = windowUrl;

            console.log(
                `🌐 Window will display website: ${windowUrl}`
            );
        }


        // ------------------------------------
        // HTML FILE / URL
        // ------------------------------------

        else if (htmlFile) {

            contentType = "url";
            content = htmlFile;

            console.log(
                `📄 Window will load HTML: ${htmlFile}`
            );
        }


        // ------------------------------------
        // INLINE HTML
        // ------------------------------------

        else {

            content =
                element.dataset.windowContent !== undefined
                    ? element.dataset.windowContent
                    : originalHTML;

            if (!content || content.trim() === "") {

                content = `
                    <div style="
                        padding:20px;
                        color:white;
                    ">
                        <h3>Window</h3>
                        <p>No content defined for this window.</p>
                    </div>
                `;
            }
        }


        return {
            type: contentType,
            content
        };
    },


    // ========================================
    // PREPARE DOCUMENT
    // ========================================

    prepareDocument(documentConfig) {

        if (!documentConfig) {
            return {
                type: "html",
                content: ""
            };
        }


        // ------------------------------------
        // IFRAME
        // ------------------------------------

        if (
            documentConfig.type === "iframe" &&
            documentConfig.content
        ) {

            const url = documentConfig.content;

            console.log(
                `🌐 Preparing iframe: ${url}`
            );

            return {
                type: "html",

                content: `
                    <div style="
                        position:absolute;
                        inset:0;
                        width:100%;
                        height:100%;
                        margin:0;
                        padding:0;
                        overflow:hidden;
                        background:#000;
                    ">
                        <iframe
                            src="${url}"
                            style="
                                display:block;
                                width:100%;
                                height:100%;
                                border:0;
                                margin:0;
                                padding:0;
                            "
                            frameborder="0"
                            allowfullscreen>
                        </iframe>
                    </div>
                `
            };
        }


        // ------------------------------------
        // HTML FILE
        // ------------------------------------

        if (
            documentConfig.type === "url" &&
            documentConfig.content
        ) {

            return {
                type: "html",

                content: `
                    <div style="
                        padding:20px;
                        color:white;
                        text-align:center;
                    ">
                        <p>Loading content...</p>

                        <div style="
                            margin-top:20px;
                            font-size:2em;
                        ">
                            ⏳
                        </div>
                    </div>
                `
            };
        }


        // ------------------------------------
        // NORMAL INLINE HTML
        // ------------------------------------

        return {
            type: "html",
            content: documentConfig.content || ""
        };
    },


    // ========================================
    // LOAD HTML FILE
    // ========================================

    load(windowInstance, url, ownerObject) {

        if (!windowInstance || !url) {
            return;
        }

        if (windowInstance.galleryContainer) {
            console.log(
                "🖼️ Skipping HTML load for gallery window"
            );

            return;
        }

        console.log(
            `📥 Fetching window HTML: ${url}`
        );

        fetch(url)

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`
                    );
                }

                return response.text();
            })

            .then(html => {

                console.log(
                    `✅ Loaded window HTML: ${url}`
                );

                if (!windowInstance) {
                    return;
                }

                windowInstance.setContent(
                    html,
                    "html"
                );


                // --------------------------------
                // EXECUTE SCRIPTS
                // --------------------------------

                WindowHTML.executeScripts(
                    windowInstance
                );


                // --------------------------------
                // INITIALIZE STATIC GALLERIES
                // --------------------------------
                // Guarded: initializeGallery isn't defined anywhere in this
                // codebase yet. Calling it unconditionally threw on every
                // single window load (gallery or not), and the throw was
                // caught by the .catch() below, silently replacing whatever
                // had just loaded correctly with the error box.

                if (typeof WindowHTML.initializeGallery === "function") {
                    WindowHTML.initializeGallery(
                        windowInstance
                    );
                }


                // --------------------------------
                // REDRAW WINDOW THEME
                // --------------------------------

                setTimeout(() => {

                    if (
                        windowInstance &&
                        typeof WindowRenderer !== "undefined"
                    ) {

                        WindowRenderer.drawTheme(
                            windowInstance
                        );
                    }

                }, 50);


                // --------------------------------
                // CONTENT LOADED EVENT
                // --------------------------------

                windowInstance.element.dispatchEvent(
                    new CustomEvent(
                        "window-content-loaded",
                        {
                            detail: {
                                window: windowInstance,
                                id: ownerObject?.id,
                                url,
                                content: html
                            }
                        }
                    )
                );
            })

            .catch(error => {

                console.error(
                    `❌ Failed to load window HTML from ${url}:`,
                    error
                );

                if (!windowInstance) {
                    return;
                }

                windowInstance.setContent(

                    `
                        <div style="
                            padding:20px;
                            color:#ff6b6b;
                            text-align:center;
                        ">

                            <h3>
                                Error loading content
                            </h3>

                            <p>
                                Failed to load: ${url}
                            </p>

                            <p style="
                                font-size:12px;
                                color:#888;
                            ">
                                ${error.message}
                            </p>

                        </div>
                    `,

                    "html"
                );
            });
    },


    // ========================================
    // EXECUTE SCRIPTS
    // ========================================

    executeScripts(windowInstance) {

        if (!windowInstance) {
            return;
        }

        const root = windowInstance.element;

        if (!root) {
            return;
        }

        const scripts = root.querySelectorAll("script");

        if (scripts.length === 0) {

            console.log(
                "ℹ️ No scripts found in window HTML"
            );

            return;
        }

        console.log(
            `▶️ Executing ${scripts.length} script(s) from window HTML`
        );


        scripts.forEach(oldScript => {

            const newScript = document.createElement("script");

            Array.from(
                oldScript.attributes
            ).forEach(attribute => {

                newScript.setAttribute(
                    attribute.name,
                    attribute.value
                );

            });

            newScript.textContent = oldScript.textContent;

            oldScript.parentNode.replaceChild(
                newScript,
                oldScript
            );

        });

    },


    // ========================================
    // LIGHTBOX
    // ========================================

    openGalleryImage(path) {

        if (!path) {
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

        overlay.style.cursor = "default";

        overlay.style.overflow = "hidden";

        // 3D viewing context for the tilt effect - lives on the parent,
        // not the image, per how CSS `perspective` is meant to be used.
        overlay.style.perspective = "1000px";


        const img = document.createElement("img");

        img.src = path;

        img.draggable = false;

        img.style.maxWidth = "90%";

        img.style.maxHeight = "90%";

        img.style.objectFit = "contain";

        img.style.borderRadius = "8px";

        img.style.boxShadow = "0 0 40px rgba(0,0,0,0.8)";

        img.style.userSelect = "none";

        img.style.cursor = "grab";

        img.style.willChange = "transform";

        img.style.transformOrigin = "50% 50%";


        // --------------------------------
        // INTERACTIVE STATE
        // --------------------------------

        let zoom = 1;
        let panX = 0, panY = 0;
        let rotX = 0, rotY = 0;

        let panning = false;
        let panStartX = 0, panStartY = 0;
        let panOriginX = 0, panOriginY = 0;

        let tilting = false;
        let tiltStartX = 0, tiltStartY = 0;

        const MAX_ZOOM = 5;
        const MAX_TILT = 35; // degrees

        const applyTransform = (smooth) => {
            img.style.transition = smooth
                ? "transform 0.25s ease-out"
                : "none";

            img.style.transform =
                `translate(${panX}px, ${panY}px) ` +
                `scale(${zoom}) ` +
                `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        };

        // --------------------------------
        // ZOOM - mouse wheel, toward cursor
        // --------------------------------

        const onWheel = (e) => {
            e.preventDefault();

            const prevZoom = zoom;
            const delta = -e.deltaY * 0.0015;
            zoom = Math.min(
                MAX_ZOOM,
                Math.max(1, zoom + zoom * delta)
            );

            const rect = img.getBoundingClientRect();
            const cx = e.clientX - (rect.left + rect.width / 2);
            const cy = e.clientY - (rect.top + rect.height / 2);
            const ratio = zoom / prevZoom;

            panX -= cx * (ratio - 1);
            panY -= cy * (ratio - 1);

            if (zoom <= 1.001) {
                zoom = 1;
                panX = 0;
                panY = 0;
            }

            applyTransform(false);
        };

        img.addEventListener("wheel", onWheel, { passive: false });

        // --------------------------------
        // PAN - left-click drag (useful once zoomed in)
        // --------------------------------

        // --------------------------------
        // TILT - middle-click (scroll-wheel button) drag near a corner
        // --------------------------------

        const startTilt = (e) => {
            tilting = true;
            tiltStartX = e.clientX;
            tiltStartY = e.clientY;

            const rect = img.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;

            // Which corner is nearest where the drag began - that's the
            // corner being "grabbed". Anchor the tilt at the opposite one
            // so it reads as that specific corner lifting toward you.
            const grabbedRight = localX > rect.width / 2;
            const grabbedBottom = localY > rect.height / 2;

            img.style.transformOrigin =
                `${grabbedRight ? "0%" : "100%"} ${grabbedBottom ? "0%" : "100%"}`;
        };

        const startPan = (e) => {
            panning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panOriginX = panX;
            panOriginY = panY;
            img.style.cursor = "grabbing";
        };

        img.addEventListener("mousedown", (e) => {
            if (e.button === 1) {
                startTilt(e);
                e.preventDefault();
            } else if (e.button === 0) {
                startPan(e);
                e.preventDefault();
            }
        });

        // Middle-click normally scrolls/auto-scrolls in most browsers -
        // block that so it can be used for tilt instead.
        img.addEventListener("auxclick", (e) => e.preventDefault());
        img.addEventListener("contextmenu", (e) => e.preventDefault());

        const onMouseMove = (e) => {
            if (panning) {
                panX = panOriginX + (e.clientX - panStartX);
                panY = panOriginY + (e.clientY - panStartY);
                applyTransform(false);
            }

            if (tilting) {
                const rect = img.getBoundingClientRect();
                const dx = e.clientX - tiltStartX;
                const dy = e.clientY - tiltStartY;

                rotY = Math.max(-MAX_TILT, Math.min(MAX_TILT,
                    (dx / rect.width) * MAX_TILT * 2));
                rotX = Math.max(-MAX_TILT, Math.min(MAX_TILT,
                    -(dy / rect.height) * MAX_TILT * 2));

                applyTransform(false);
            }
        };

        document.addEventListener("mousemove", onMouseMove);

        const onMouseUp = () => {
            if (panning) {
                panning = false;
                img.style.cursor = "grab";
            }

            if (tilting) {
                tilting = false;
                // Ease back to flat, then recenter the pivot for next time.
                rotX = 0;
                rotY = 0;
                applyTransform(true);
                img.style.transformOrigin = "50% 50%";
            }
        };

        document.addEventListener("mouseup", onMouseUp);

        // --------------------------------
        // RESET - double-click
        // --------------------------------

        img.addEventListener("dblclick", () => {
            zoom = 1;
            panX = 0;
            panY = 0;
            rotX = 0;
            rotY = 0;
            img.style.transformOrigin = "50% 50%";
            applyTransform(true);
        });

        // --------------------------------
        // CLOSE - explicit button + click on the backdrop
        // --------------------------------
        // (Clicking the image itself no longer closes the lightbox,
        // since it's now the interactive surface for zoom/pan/tilt.)

        const closeBtn = document.createElement("div");

        closeBtn.textContent = "✕";
        closeBtn.style.position = "fixed";
        closeBtn.style.top = "20px";
        closeBtn.style.right = "30px";
        closeBtn.style.fontSize = "28px";
        closeBtn.style.color = "#fff";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.opacity = "0.8";
        closeBtn.style.userSelect = "none";
        closeBtn.style.zIndex = "100000";

        const cleanup = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            overlay.remove();
        };

        closeBtn.addEventListener("click", cleanup);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) cleanup();
        });

        overlay.appendChild(img);
        overlay.appendChild(closeBtn);

        document.body.appendChild(
            overlay
        );
    },

    // ========================================
// OPEN TEXT DOCUMENT
// ========================================

openTextDocument(path, text) {

    if (text === undefined || text === null) {
        text = "";
    }

    const overlay = document.createElement("div");

    overlay.className = "text-document-viewer";

    overlay.style.position = "fixed";

    overlay.style.inset = "0";

    overlay.style.background = "rgba(0,0,0,0.85)";

    overlay.style.zIndex = "99999";

    overlay.style.display = "flex";

    overlay.style.alignItems = "center";

    overlay.style.justifyContent = "center";

    overlay.style.padding = "30px";

    overlay.style.boxSizing = "border-box";


    const documentBox = document.createElement("div");

    documentBox.style.width = "min(1000px, 100%)";

    documentBox.style.height = "min(90vh, 100%)";

    documentBox.style.background = "#111";

    documentBox.style.color = "#fff";

    documentBox.style.border = "1px solid #444";

    documentBox.style.borderRadius = "6px";

    documentBox.style.display = "flex";

    documentBox.style.flexDirection = "column";

    documentBox.style.overflow = "hidden";


    // ------------------------------------
    // HEADER
    // ------------------------------------

    const header = document.createElement("div");

    header.style.flexShrink = "0";

    header.style.padding = "10px 14px";

    header.style.background = "#1d1d1d";

    header.style.borderBottom = "1px solid #333";

    header.style.display = "flex";

    header.style.justifyContent = "space-between";

    header.style.alignItems = "center";


    const title = document.createElement("span");

    title.textContent =
        path.split("/").pop() ||
        "Text document";


    const close = document.createElement("button");

    close.textContent = "✕";

    close.style.cursor = "pointer";


    // ------------------------------------
    // DOCUMENT CONTENT
    // ------------------------------------

    const content = document.createElement("pre");

    content.textContent = text;

    content.style.flex = "1";

    content.style.minHeight = "0";

    content.style.margin = "0";

    content.style.padding = "25px";

    content.style.overflow = "auto";

    content.style.whiteSpace = "pre-wrap";

    content.style.wordBreak = "break-word";

    content.style.boxSizing = "border-box";

    content.style.fontFamily = "monospace";

    content.style.fontSize = "14px";

    content.style.lineHeight = "1.5";


    header.append(
        title,
        close
    );

    documentBox.append(
        header,
        content
    );

    overlay.appendChild(
        documentBox
    );


    // ------------------------------------
    // CLOSE
    // ------------------------------------

    const cleanup = () => overlay.remove();

    close.onclick = cleanup;

    overlay.onclick =
        event => {

            if (
                event.target ===
                overlay
            ) {

                cleanup();
            }
        };


    document.body.appendChild(
        overlay
    );
}

};


// ============================================
// GLOBAL EXPOSURE
// ============================================

window.WindowHTML = WindowHTML;

window.openGalleryImage = WindowHTML.openGalleryImage;


console.log(
    "✅ Window HTML System ready"
);