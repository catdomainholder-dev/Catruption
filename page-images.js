// ============================================
// PAGE IMAGES SYSTEM
// ============================================
//
// Finds elements with data-src / data-window
// and turns them into interactive objects.
//
// This system is responsible for:
//
//   - Images
//   - Positioning
//   - Hover behavior
//   - Click behavior
//   - Object state
//   - Calling other systems
//   - Special object behavior
//
// ============================================

console.log("🖼️ Page Images System loaded");


// ============================================
// INTERACTIVE OBJECT
// ============================================

class InteractiveObject {

    constructor(element) {

        this.element =
            element;

        // ----------------------------------------
        // ORIGINAL HTML
        // ----------------------------------------

        this.originalHTML =
            element.innerHTML || "";

        // ----------------------------------------
        // BASIC CONFIG
        // ----------------------------------------

        this.id =
            element.dataset.id ||
            `obj_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`;

        this.src =
            element.dataset.src ||
            element.src ||
            "";

        this.hoverSrc =
            element.dataset.hoverSrc ||
            this.src;

        this.activeSrc =
            element.dataset.activeSrc ||
            this.src;

        this.disabledSrc =
            element.dataset.disabledSrc ||
            this.src;

        // ----------------------------------------
        // POSITION
        // ----------------------------------------

        this.x =
            element.dataset.x !== undefined
                ? element.dataset.x
                : 50;

        this.y =
            element.dataset.y !== undefined
                ? element.dataset.y
                : 50;

        this.width =
            element.dataset.width !== undefined
                ? element.dataset.width
                : 200;

        this.hoverScale =
            parseFloat(
                element.dataset.hoverScale
            ) || 1.08;

        // ----------------------------------------
        // ACTION
        // ----------------------------------------

        this.action =
            element.dataset.action ||
            null;

        // ----------------------------------------
        // LINK
        // ----------------------------------------

        this.linkUrl =
            element.dataset.linkUrl ||
            null;

        this.linkTarget =
            element.dataset.linkTarget ||
            "_blank";

        // ----------------------------------------
        // COMMAND
        // ----------------------------------------

        this.command =
            element.dataset.command ||
            null;

        this.commandData =
            element.dataset.commandData ||
            null;

        // ----------------------------------------
        // GALLERY CONFIG
        // ----------------------------------------

        this.gallerySrc =
            element.dataset.gallerySrc ||
            element.dataset.galleryManifest ||
            "images/manifest.json";

        this.galleryName =
            element.dataset.gallery ||
            element.dataset.galleryName ||
            null;

        this.galleryFolder =
            element.dataset.galleryFolder ||
            null;

        // ----------------------------------------
        // PHONE CONFIG
        // ----------------------------------------

        this.isPhone =
            this.id === "phone";

        this.phoneNormalSrc =
            "/images/desktop/dialing.webp";

        this.phoneRingingSrc =
            "/images/desktop/ringing.webp";

        this.isPhoneRinging =
            false;

        // ----------------------------------------
        // STATE
        // ----------------------------------------

        this.state =
            "normal";

        this.isInitialized =
            false;

        // ----------------------------------------
        // DISPLAY SIZE
        // ----------------------------------------

        this.renderedHeight =
            null;

        // ----------------------------------------
        // SETUP
        // ----------------------------------------

        this._setupElement();

        if (this.action || this.isPhone) {
            this._bindEvents();
        }

        this.isInitialized =
            true;

        console.log(
            `✅ Interactive object initialized: ${this.id}`
        );
    }


    // ============================================
    // SETUP ELEMENT
    // ============================================

    _setupElement() {

        // ----------------------------------------
        // CONVERT TO IMAGE
        // ----------------------------------------

        if (
            this.element.tagName !== "IMG"
        ) {

            const oldElement =
                this.element;

            const img =
                document.createElement("img");

            img.src =
                this.isPhone
                    ? this.phoneNormalSrc
                    : this.src;

            img.alt =
                oldElement.dataset.alt ||
                "";

            for (
                const attr of oldElement.attributes
            ) {

                if (
                    attr.name === "data-src" ||
                    attr.name === "src"
                ) {
                    continue;
                }

                img.setAttribute(
                    attr.name,
                    attr.value
                );
            }

            oldElement.parentNode.replaceChild(
                img,
                oldElement
            );

            this.element =
                img;
        }

        // ----------------------------------------
        // IMAGE
        // ----------------------------------------

        if (this.isPhone) {

            this.element.src =
                this.phoneNormalSrc;

        } else {

            this.element.src =
                this.src;
        }

        // ----------------------------------------
        // POSITION
        // ----------------------------------------

        this.element.style.position =
            "fixed";

        this.element.style.left =
            this._positionValue(this.x);

        this.element.style.top =
            this._positionValue(this.y);

        // ----------------------------------------
        // WIDTH
        // ----------------------------------------

        this.element.style.width =
            this._sizeValue(this.width);

        // ----------------------------------------
        // HEIGHT
        // ----------------------------------------

        this.element.style.height =
            "auto";

        this.element.style.display =
            "block";

        // ----------------------------------------
        // IMAGE BEHAVIOR
        // ----------------------------------------

        this.element.style.objectFit =
            "fill";

        this.element.style.verticalAlign =
            "top";

        // ----------------------------------------
        // APPEARANCE
        // ----------------------------------------

        this.element.style.cursor =
            "pointer";

        this.element.style.transition =
            this.isPhone
                ? "none"
                : "transform 0.3s ease";

        this.element.style.transform =
            "translate(-50%, -50%)";

        this.element.style.transformOrigin =
            "center center";

        this.element.style.zIndex =
            "5";

        this.element.style.pointerEvents =
            "auto";

        this.element.classList.add(
            "interactive-object"
        );

        // ----------------------------------------
        // PHONE SPECIAL BEHAVIOR
        // ----------------------------------------

        if (this.isPhone) {

            this.element.style.animation =
                "none";

            this.element.style.transform =
                "translate(-50%, -50%)";

            this.element.style.transition =
                "none";
        }

        // ----------------------------------------
        // LOCK HEIGHT
        // ----------------------------------------

        this._lockRenderedHeight();
    }


    // ============================================
    // LOCK RENDERED HEIGHT
    // ============================================

    _lockRenderedHeight() {

        const lock = () => {

            if (
                this.renderedHeight !== null
            ) {
                return;
            }

            const height =
                this.element
                    .getBoundingClientRect()
                    .height;

            if (
                height > 0 &&
                Number.isFinite(height)
            ) {

                this.renderedHeight =
                    height;

                this.element.style.height =
                    `${height}px`;

                console.log(
                    `📐 Locked ${this.id} height to ${height}px`
                );
            }
        };


        if (this.element.complete) {

            requestAnimationFrame(
                lock
            );

        } else {

            this.element.addEventListener(
                "load",
                () => {
                    requestAnimationFrame(
                        lock
                    );
                },
                {
                    once: true
                }
            );
        }
    }


    // ============================================
    // POSITION / SIZE
    // ============================================

    _positionValue(value) {

        if (
            typeof value === "string" &&
            value.includes("%")
        ) {
            return value;
        }

        return `${value}px`;
    }


    _sizeValue(value) {

        if (
            typeof value === "string" &&
            (
                value.includes("%") ||
                value.includes("px") ||
                value.includes("vw") ||
                value.includes("vh")
            )
        ) {
            return value;
        }

        return `${value}px`;
    }


    // ============================================
    // IMAGE
    // ============================================

    _setImage(src) {

        if (!src) {
            return;
        }

        this.element.src =
            src;

        if (
            this.renderedHeight !== null
        ) {

            this.element.style.height =
                `${this.renderedHeight}px`;
        }
    }


    // ============================================
    // TRANSFORMS
    // ============================================

    _setNormalTransform() {

        this.element.style.transform =
            "translate(-50%, -50%)";
    }


    _setHoverTransform() {

        // Phones NEVER hover-scale.

        if (this.isPhone) {
            this._setNormalTransform();
            return;
        }

        this.element.style.transform =
            `translate(-50%, -50%) scale(${this.hoverScale})`;
    }


    // ============================================
    // PHONE
    // ============================================

    ring() {

        if (!this.isPhone) {
            return;
        }

        if (this.isPhoneRinging) {
            return;
        }

        this.isPhoneRinging =
            true;

        this.setState(
            "ringing"
        );

        this._setImage(
            this.phoneRingingSrc
        );

        this._setNormalTransform();

        console.log(
            "📞 Phone is ringing"
        );
    }


    stopRinging() {

        if (!this.isPhone) {
            return;
        }

        this.isPhoneRinging =
            false;

        this.setState(
            "normal"
        );

        this._setImage(
            this.phoneNormalSrc
        );

        this._setNormalTransform();

        console.log(
            "📞 Phone stopped ringing"
        );
    }


    // ============================================
    // EVENTS
    // ============================================

    _bindEvents() {

        // ----------------------------------------
        // MOUSE ENTER
        // ----------------------------------------

        this.element.addEventListener(
            "mouseenter",
            () => {

                if (
                    this.state === "disabled"
                ) {
                    return;
                }

                // Phone has no hover behavior.

                if (this.isPhone) {
                    return;
                }

                this.setState(
                    "hover"
                );

                this._setHoverTransform();
            }
        );


        // ----------------------------------------
        // MOUSE LEAVE
        // ----------------------------------------

        this.element.addEventListener(
            "mouseleave",
            () => {

                if (
                    this.state === "disabled"
                ) {
                    return;
                }

                // Phone has no hover behavior.

                if (this.isPhone) {
                    return;
                }

                this.setState(
                    "normal"
                );

                this._setNormalTransform();
            }
        );


        // ----------------------------------------
        // CLICK
        // ----------------------------------------

        this.element.addEventListener(
            "click",
            event => {

                if (
                    this.state === "disabled"
                ) {
                    return;
                }

                // --------------------------------
                // PHONE
                // --------------------------------

                if (this.isPhone) {

                    this._handlePhoneClick(
                        event
                    );

                    return;
                }

                // --------------------------------
                // NORMAL OBJECT
                // --------------------------------

                this.setState(
                    "active"
                );

                this._handleClick(
                    event
                );

                setTimeout(
                    () => {

                        if (
                            this.state !== "active"
                        ) {
                            return;
                        }

                        this.setState(
                            "normal"
                        );

                        this._setNormalTransform();

                    },
                    200
                );
            }
        );


        // ----------------------------------------
        // RIGHT CLICK
        // ----------------------------------------

        this.element.addEventListener(
            "contextmenu",
            event => {

                event.preventDefault();

                if (
                    this.state === "disabled"
                ) {
                    return;
                }

                this.element.dispatchEvent(
                    new CustomEvent(
                        "object-rightclick",
                        {
                            detail: {
                                object:
                                    this,

                                originalEvent:
                                    event
                            }
                        }
                    )
                );
            }
        );
    }


    // ============================================
    // PHONE CLICK
    // ============================================

    _handlePhoneClick(event) {

        if (!this.isPhoneRinging) {
            return;
        }

        console.log(
            "📞 Phone answered"
        );

        this.stopRinging();

        this.element.dispatchEvent(
            new CustomEvent(
                "phone-answered",
                {
                    bubbles: true,

                    detail: {
                        object:
                            this,

                        originalEvent:
                            event
                    }
                }
            )
        );
    }


    // ============================================
    // CLICK
    // ============================================

    _handleClick(event) {

        switch (this.action) {

            // ------------------------------------
            // WINDOW
            // ------------------------------------

            case "open":
            case "toggle":
            case "close":
            case "focus":

                this._handleWindowAction();

                break;

            // ------------------------------------
            // COMMAND
            // ------------------------------------

            case "command":

                this._sendCommand();

                break;

            // ------------------------------------
            // LINK
            // ------------------------------------

            case "link":

                this._handleLinkAction();

                break;

            // ------------------------------------
            // PAGE
            // ------------------------------------

            case "page":

                this._handlePageAction();

                break;

            // ------------------------------------
            // GALLERY
            // ------------------------------------

            case "gallery":

                this._handleGalleryAction();

                break;

            // ------------------------------------
            // BOOK (NEW)
            // ------------------------------------

            case "book":

                this._handleBookAction();

                break;

            // ------------------------------------
            // CUSTOM
            // ------------------------------------

            default:

                this._dispatchAction(
                    event
                );

                break;
        }
    }


    // ============================================
    // WINDOW ACTION
    // ============================================

    _handleWindowAction() {

        if (
            typeof windowController ===
            "undefined"
        ) {

            console.warn(
                "WindowController is not loaded."
            );

            return;
        }

        switch (this.action) {

            case "open":

                windowController.open(
                    this
                );

                break;


            case "toggle":

                windowController.toggle(
                    this
                );

                break;


            case "close":

                windowController.close(
                    this
                );

                break;


            case "focus":

                windowController.focus(
                    this
                );

                break;
        }
    }


    // ============================================
    // COMMAND
    // ============================================

    _sendCommand() {

        if (
            typeof windowController ===
            "undefined"
        ) {

            console.warn(
                "WindowController is not loaded."
            );

            return;
        }

        windowController.command(
            this
        );
    }


    // ============================================
    // LINK
    // ============================================

    _handleLinkAction() {

        if (!this.linkUrl) {
            return;
        }

        window.open(
            this.linkUrl,
            this.linkTarget
        );
    }


    // ============================================
    // PAGE
    // ============================================

    _handlePageAction() {

        const pageId =
            this.element.dataset.page;

        if (!pageId) {

            console.warn(
                `No data-page specified for ${this.id}`
            );

            return;
        }

        if (
            typeof window.showPage ===
            "function"
        ) {

            window.showPage(
                pageId
            );

            return;
        }

        console.warn(
            "showPage() is not available."
        );
    }


    // ============================================
    // GALLERY ACTION
    // ============================================

    _handleGalleryAction() {

        const gallerySystem =
            window.getGallerySystem?.();

        if (!gallerySystem) {

            console.warn(
                "Gallery system not loaded"
            );

            return;
        }

        if (
            typeof windowController !==
            "undefined"
        ) {

            windowController.open(
                this
            );
        }
    }


    // ============================================
    // BOOK ACTION (NEW)
    // ============================================

    _handleBookAction() {

        if (
            typeof windowController ===
            "undefined"
        ) {

            console.warn(
                "WindowController is not loaded."
            );

            return;
        }

        windowController.open(
            this
        );
    }


    // ============================================
    // GENERIC ACTION EVENT
    // ============================================

    _dispatchAction(event) {

        this.element.dispatchEvent(
            new CustomEvent(
                "interactive-object-action",
                {
                    bubbles: true,

                    detail: {
                        object:
                            this,

                        action:
                            this.action,

                        originalEvent:
                            event
                    }
                }
            )
        );
    }


    // ============================================
    // STATE
    // ============================================

    setState(newState) {

        const oldState =
            this.state;

        this.state =
            newState;

        this.element.dispatchEvent(
            new CustomEvent(
                "object-state-change",
                {
                    detail: {
                        object:
                            this,

                        oldState,

                        newState
                    }
                }
            )
        );
    }


    // ============================================
    // UPDATE
    // ============================================

    update(config = {}) {

        if (config.src) {

            this.src =
                config.src;
        }

        if (config.hoverSrc) {

            this.hoverSrc =
                config.hoverSrc;
        }

        if (
            config.width !== undefined
        ) {

            this.renderedHeight =
                null;

            this.element.style.height =
                "auto";

            this.element.style.width =
                this._sizeValue(
                    config.width
                );

            this._lockRenderedHeight();
        }

        if (
            config.position
        ) {

            if (
                config.position.x !== undefined
            ) {

                this.element.style.left =
                    this._positionValue(
                        config.position.x
                    );
            }

            if (
                config.position.y !== undefined
            ) {

                this.element.style.top =
                    this._positionValue(
                        config.position.y
                    );
            }
        }

        if (
            config.hoverScale !== undefined
        ) {

            this.hoverScale =
                parseFloat(
                    config.hoverScale
                ) || 1.08;
        }

        this._setImage(
            this.src
        );
    }


    // ============================================
    // ENABLE
    // ============================================

    enable() {

        this.setState(
            "normal"
        );

        this.element.style.pointerEvents =
            "auto";

        this.element.style.opacity =
            "1";

        if (this.isPhone) {

            this.isPhoneRinging =
                false;

            this._setImage(
                this.phoneNormalSrc
            );

        } else {

            this._setImage(
                this.src
            );
        }

        this._setNormalTransform();
    }


    // ============================================
    // DISABLE
    // ============================================

    disable() {

        this.setState(
            "disabled"
        );

        this.element.style.pointerEvents =
            "none";

        this.element.style.opacity =
            "0.5";

        if (this.isPhone) {

            this.isPhoneRinging =
                false;

            this._setImage(
                this.phoneNormalSrc
            );

        } else {

            this._setImage(
                this.disabledSrc
            );
        }

        this._setNormalTransform();
    }


    // ============================================
    // DESTROY
    // ============================================

    destroy() {

        if (
            typeof windowController !==
            "undefined"
        ) {

            windowController.close(
                this
            );
        }

        if (
            this.element &&
            this.element.parentNode
        ) {

            this.element.remove();
        }
    }
}


// ============================================
// PAGE IMAGE SYSTEM
// ============================================

class PageImageSystem {

    constructor() {

        this.objects =
            [];

        this.selector =
            ".interactive-object, [data-src], [data-window]";

        this.init();
    }


    // ========================================
    // INITIALIZE / RESCAN
    // ========================================

    init() {

        console.log(
            "🔍 Scanning for interactive objects..."
        );

        const elements =
            document.querySelectorAll(
                this.selector
            );

        if (
            elements.length === 0
        ) {

            console.log(
                "ℹ️ No interactive objects found."
            );

            return;
        }

        console.log(
            `📦 Found ${elements.length} potential interactive objects`
        );


        elements.forEach(
            (element, index) => {

                if (
                    element._interactiveObject
                ) {
                    return;
                }

                try {

                    const object =
                        new InteractiveObject(
                            element
                        );

                    object.element
                        ._interactiveObject =
                        object;

                    this.objects.push(
                        object
                    );

                    console.log(
                        `  ${index + 1}. ✅ ${object.id}`
                    );

                } catch (error) {

                    console.error(
                        `  ${index + 1}. ❌ Failed to initialize:`,
                        error
                    );
                }
            }
        );


        console.log(
            `✅ Page Image System now has ${this.objects.length} objects`
        );


        document.dispatchEvent(
            new CustomEvent(
                "page-images-ready",
                {
                    detail: {
                        objects:
                            this.objects
                    }
                }
            )
        );
    }


    // ========================================
    // GET OBJECT
    // ========================================

    getObject(id) {

        return this.objects.find(
            object =>
                object.id === id
        );
    }


    // ========================================
    // GET ALL
    // ========================================

    getObjects() {

        return this.objects;
    }


    // ========================================
    // DESTROY ALL
    // ========================================

    destroyAll() {

        this.objects.forEach(
            object =>
                object.destroy()
        );

        this.objects =
            [];
    }
}


// ============================================
// GLOBAL SYSTEM
// ============================================

let pageImageSystem =
    null;


// ============================================
// DOM READY
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (!pageImageSystem) {

            pageImageSystem =
                new PageImageSystem();
        }
    }
);


// ============================================
// SCRIPT LOADED AFTER DOM READY
// ============================================

if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
) {

    if (!pageImageSystem) {

        pageImageSystem =
            new PageImageSystem();
    }
}


// ============================================
// PUBLIC API
// ============================================

window.PageImageSystem =
    PageImageSystem;

window.InteractiveObject =
    InteractiveObject;

window.getPageImageSystem =
    () => pageImageSystem;

window.createInteractiveObject =
    element =>
        new InteractiveObject(element);

window.pageImageSystem =
    pageImageSystem;


console.log(
    "✅ Page Images System ready"
);