// ============================================
// WINDOW INTERACTIONS
// ============================================
//
// Handles:
//   - Window movement
//   - Normal resizing
//   - Gesture resizing
// ============================================

const WindowInteractions = {

    // ============================================
    // SETUP - Called from DesktopWindow constructor
    // ============================================

    setup(windowInstance) {
        console.log("🖱️ Setting up window interactions");

        // Store reference
        this._window = windowInstance;

        // Setup all interaction systems
        this.setupResize(windowInstance);
        this.setupWindowGestures(windowInstance);
        this.setupGestureResize(windowInstance);
    },


    // ============================================
    // NORMAL EDGE RESIZE
    // ============================================

    setupResize(windowInstance) {
        let resizing = false;
        let direction = null;
        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;
        let startWidth = 0, startHeight = 0;
        let rafId = null;
        let lastX = null, lastY = null;

        // ----------------------------------------
        // FIND RESIZE DIRECTION
        // ----------------------------------------

        const getResizeDirection = (event) => {
            const rect = windowInstance.element.getBoundingClientRect();
            const bounds = windowInstance.getContentBounds();
            const edgeSize = 10; // Slightly larger for easier grabbing

            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Check if inside content area
            const insideContent = mouseX > bounds.left && mouseX < bounds.right &&
                                  mouseY > bounds.top && mouseY < bounds.bottom;

            if (!insideContent) return null;

            const nearLeft = mouseX < bounds.left + edgeSize && mouseX > bounds.left - edgeSize;
            const nearRight = mouseX > bounds.right - edgeSize && mouseX < bounds.right + edgeSize;
            const nearTop = mouseY < bounds.top + edgeSize && mouseY > bounds.top - edgeSize;
            const nearBottom = mouseY > bounds.bottom - edgeSize && mouseY < bounds.bottom + edgeSize;

            // Corners take priority
            if (nearLeft && nearTop) return "top-left";
            if (nearRight && nearTop) return "top-right";
            if (nearLeft && nearBottom) return "bottom-left";
            if (nearRight && nearBottom) return "bottom-right";

            // Edges
            if (nearLeft) return "left";
            if (nearRight) return "right";
            if (nearTop) return "top";
            if (nearBottom) return "bottom";

            return null;
        };

        // ----------------------------------------
        // CURSOR UPDATE
        // ----------------------------------------

        const updateCursor = (event) => {
            if (resizing) return;

            const newDirection = getResizeDirection(event);
            if (newDirection === direction) return;

            direction = newDirection;

            const cursors = {
                "top-left": "nwse-resize",
                "top-right": "nesw-resize",
                "bottom-left": "nesw-resize",
                "bottom-right": "nwse-resize",
                "left": "ew-resize",
                "right": "ew-resize",
                "top": "ns-resize",
                "bottom": "ns-resize"
            };

            windowInstance.element.style.cursor = cursors[direction] || "default";
        };

        windowInstance.element.addEventListener("mousemove", updateCursor);

        // ----------------------------------------
        // BEGIN RESIZE
        // ----------------------------------------

        const onMouseDown = (event) => {
            if (event.button !== 0) return;
            if (event.shiftKey) return;

            const resizeDirection = getResizeDirection(event);
            if (!resizeDirection) return;

            const rect = windowInstance.element.getBoundingClientRect();

            resizing = true;
            direction = resizeDirection;
            startX = event.clientX;
            startY = event.clientY;
            startLeft = rect.left;
            startTop = rect.top;
            startWidth = rect.width;
            startHeight = rect.height;

            event.preventDefault();
            event.stopPropagation();
        };

        windowInstance.element.addEventListener("mousedown", onMouseDown);

        // ----------------------------------------
        // RESIZE LOOP
        // ----------------------------------------

        const onMouseMove = (event) => {
            if (!resizing) return;

            lastX = event.clientX;
            lastY = event.clientY;

            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                rafId = null;

                const dx = lastX - startX;
                const dy = lastY - startY;

                const limits = windowInstance.getSizeLimits();

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                // ========================================
                // BOOK ASPECT-LOCKED RESIZE
                // ========================================

                if (
                    windowInstance._isBook &&
                    windowInstance._bookImageWidth > 0 &&
                    windowInstance._bookImageHeight > 0
                ) {
                    const aspect =
                        windowInstance._bookImageWidth /
                        windowInstance._bookImageHeight;

                    if (direction.includes("left") || direction.includes("right")) {
                        newWidth = startWidth +
                            (direction.includes("right") ? dx : -dx);

                        newHeight = newWidth / aspect;
                    } else {
                        newHeight = startHeight +
                            (direction.includes("bottom") ? dy : -dy);

                        newWidth = newHeight * aspect;
                    }

                    // Keep the opposite edge fixed.
                    if (direction.includes("left")) {
                        newLeft = startLeft + startWidth - newWidth;
                    }

                    if (direction.includes("top")) {
                        newTop = startTop + startHeight - newHeight;
                    }

                    // Respect limits while keeping the ratio.
                    if (newWidth < limits.minWidth) {
                        newWidth = limits.minWidth;
                        newHeight = newWidth / aspect;
                    }

                    if (newHeight < limits.minHeight) {
                        newHeight = limits.minHeight;
                        newWidth = newHeight * aspect;
                    }

                    if (newWidth > limits.maxWidth) {
                        newWidth = limits.maxWidth;
                        newHeight = newWidth / aspect;
                    }

                    if (newHeight > limits.maxHeight) {
                        newHeight = limits.maxHeight;
                        newWidth = newHeight * aspect;
                    }

                    if (direction.includes("left")) {
                        newLeft = startLeft + startWidth - newWidth;
                    }

                    if (direction.includes("top")) {
                        newTop = startTop + startHeight - newHeight;
                    }

                } else {

                    // Right
                    if (direction.includes("right")) {
                        newWidth = startWidth + dx;
                    }

                    // Left
                    if (direction.includes("left")) {
                        newWidth = startWidth - dx;
                        newLeft = startLeft + dx;
                    }

                    // Bottom
                    if (direction.includes("bottom")) {
                        newHeight = startHeight + dy;
                    }

                    // Top
                    if (direction.includes("top")) {
                        newHeight = startHeight - dy;
                        newTop = startTop + dy;
                    }

                    // Clamp
                    const clampedWidth = Math.max(limits.minWidth, Math.min(limits.maxWidth, newWidth));
                    const clampedHeight = Math.max(limits.minHeight, Math.min(limits.maxHeight, newHeight));

                    // Keep opposite edge fixed
                    if (direction.includes("left")) {
                        newLeft = startLeft + startWidth - clampedWidth;
                    }

                    if (direction.includes("top")) {
                        newTop = startTop + startHeight - clampedHeight;
                    }

                    newWidth = clampedWidth;
                    newHeight = clampedHeight;
                }

                // Apply changes
                const el = windowInstance.element;
                el.style.width = `${newWidth}px`;
                el.style.height = `${newHeight}px`;
                el.style.left = `${newLeft}px`;
                el.style.top = `${newTop}px`;

                // Redraw
                windowInstance.redraw();
            });
        };

        document.addEventListener("mousemove", onMouseMove);

        // ----------------------------------------
        // END RESIZE
        // ----------------------------------------

        const onMouseUp = () => {
            resizing = false;
            direction = null;

            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        document.addEventListener("mouseup", onMouseUp);

        // Store cleanup function
        windowInstance._interactionCleanup = () => {
            windowInstance.element.removeEventListener("mousemove", updateCursor);
            windowInstance.element.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    },


    // ============================================
    // WINDOW MOVEMENT
    // ============================================

    setupWindowGestures(windowInstance) {
        let moving = false;
        let offsetX = 0, offsetY = 0;

        // ----------------------------------------
        // BEGIN MOVE
        // ----------------------------------------

        const onMouseDown = (event) => {
            if (event.button !== 0) return;

            // SHIFT + CLICK anywhere on window
            if (event.shiftKey) {
                const rect = windowInstance.element.getBoundingClientRect();
                moving = true;
                offsetX = event.clientX - rect.left;
                offsetY = event.clientY - rect.top;
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            // Click on title bar (but not on controls)
            const target = event.target;
            if (target === windowInstance.titleBar || windowInstance.titleBar.contains(target)) {
                // Don't move if clicking controls inside title bar
                if (windowInstance.controls.contains(target)) return;

                const rect = windowInstance.element.getBoundingClientRect();
                moving = true;
                offsetX = event.clientX - rect.left;
                offsetY = event.clientY - rect.top;
                event.preventDefault();
                event.stopPropagation();
            }
        };

        windowInstance.element.addEventListener("mousedown", onMouseDown);

        // ----------------------------------------
        // MOVE LOOP
        // ----------------------------------------

        const onMouseMove = (event) => {
            if (!moving) return;

            windowInstance.element.style.left = `${event.clientX - offsetX}px`;
            windowInstance.element.style.top = `${event.clientY - offsetY}px`;
        };

        document.addEventListener("mousemove", onMouseMove);

        // ----------------------------------------
        // END MOVE
        // ----------------------------------------

        const onMouseUp = () => {
            moving = false;
        };

        document.addEventListener("mouseup", onMouseUp);

        // Extend cleanup
        const existingCleanup = windowInstance._interactionCleanup;
        windowInstance._interactionCleanup = () => {
            if (existingCleanup) existingCleanup();
            windowInstance.element.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    },


    // ============================================
    // SHIFT + MIDDLE CLICK - CENTERED GESTURE RESIZE
    // ============================================

    setupGestureResize(windowInstance) {
        let resizing = false;
        let direction = null;
        let startX = 0, startY = 0;
        let startWidth = 0, startHeight = 0;
        let centerX = 0, centerY = 0;

        // ----------------------------------------
        // DETERMINE DIRECTION
        // ----------------------------------------

        const getDirection = (event) => {
            const rect = windowInstance.element.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const horizontalThreshold = Math.min(rect.width * 0.3, 150);
            const verticalThreshold = Math.min(rect.height * 0.3, 150);

            const left = mouseX < horizontalThreshold;
            const right = rect.width - mouseX < horizontalThreshold;
            const top = mouseY < verticalThreshold;
            const bottom = rect.height - mouseY < verticalThreshold;

            let horizontal = null;
            let vertical = null;

            if (left) horizontal = "left";
            else if (right) horizontal = "right";

            if (top) vertical = "top";
            else if (bottom) vertical = "bottom";

            if (vertical && horizontal) return `${vertical}-${horizontal}`;
            if (vertical) return vertical;
            if (horizontal) return horizontal;

            // Middle of window: choose quadrant
            return `${mouseY < rect.height / 2 ? "top" : "bottom"}-${mouseX < rect.width / 2 ? "left" : "right"}`;
        };

        // ----------------------------------------
        // BEGIN GESTURE RESIZE
        // ----------------------------------------

        const onMouseDown = (event) => {
            if (!event.shiftKey) return;
            if (event.button !== 1) return; // Middle button

            const rect = windowInstance.element.getBoundingClientRect();

            direction = getDirection(event);
            resizing = true;

            startX = event.clientX;
            startY = event.clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;

            console.log("🔄 Gesture resize:", direction);

            event.preventDefault();
            event.stopPropagation();
        };

        windowInstance.element.addEventListener("mousedown", onMouseDown);

        // ----------------------------------------
        // GESTURE RESIZE LOOP
        // ----------------------------------------

        const onMouseMove = (event) => {
            if (!resizing) return;

            const dx = event.clientX - startX;
            const dy = event.clientY - startY;

            const limits = windowInstance.getSizeLimits();

            let width = startWidth;
            let height = startHeight;

            // Book windows stay aspect-locked here too.
            if (
                windowInstance._isBook &&
                windowInstance._bookImageWidth > 0 &&
                windowInstance._bookImageHeight > 0
            ) {
                const aspect =
                    windowInstance._bookImageWidth /
                    windowInstance._bookImageHeight;

                const widthDelta =
                    direction.includes("left") || direction.includes("right")
                        ? dx * 2
                        : 0;

                const heightDelta =
                    direction.includes("top") || direction.includes("bottom")
                        ? dy * 2
                        : 0;

                if (Math.abs(widthDelta) >= Math.abs(heightDelta * aspect)) {
                    width = startWidth + widthDelta;
                    height = width / aspect;
                } else {
                    height = startHeight + heightDelta;
                    width = height * aspect;
                }

                width = Math.max(limits.minWidth, Math.min(limits.maxWidth, width));
                height = width / aspect;

                if (height > limits.maxHeight) {
                    height = limits.maxHeight;
                    width = height * aspect;
                }

                if (height < limits.minHeight) {
                    height = limits.minHeight;
                    width = height * aspect;
                }

            } else {

                // Horizontal
                if (direction.includes("left") || direction.includes("right")) {
                    const delta = direction.includes("right") ? dx * 2 : -dx * 2;
                    width = startWidth + delta;
                }

                // Vertical
                if (direction.includes("top") || direction.includes("bottom")) {
                    const delta = direction.includes("bottom") ? dy * 2 : -dy * 2;
                    height = startHeight + delta;
                }

                // Clamp
                width = Math.max(limits.minWidth, Math.min(limits.maxWidth, width));
                height = Math.max(limits.minHeight, Math.min(limits.maxHeight, height));
            }

            // Keep center fixed
            const left = centerX - width / 2;
            const top = centerY - height / 2;

            const el = windowInstance.element;
            el.style.width = `${width}px`;
            el.style.height = `${height}px`;
            el.style.left = `${left}px`;
            el.style.top = `${top}px`;

            windowInstance.redraw();
        };

        document.addEventListener("mousemove", onMouseMove);

        // ----------------------------------------
        // END GESTURE RESIZE
        // ----------------------------------------

        const onMouseUp = () => {
            resizing = false;
            direction = null;
        };

        document.addEventListener("mouseup", onMouseUp);

        // Extend cleanup
        const existingCleanup = windowInstance._interactionCleanup;
        windowInstance._interactionCleanup = () => {
            if (existingCleanup) existingCleanup();
            windowInstance.element.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    },


    // ============================================
    // CLEANUP
    // ============================================

    cleanup(windowInstance) {
        if (windowInstance._interactionCleanup) {
            windowInstance._interactionCleanup();
            delete windowInstance._interactionCleanup;
        }
    }

};

// ============================================
// PUBLIC ACCESS
// ============================================

window.WindowInteractions = WindowInteractions;