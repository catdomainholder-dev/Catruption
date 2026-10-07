// ============================================
// ANIMATED FAVICON
// ============================================

console.log("🔥 Favicon animation loaded");

const FRAME_COUNT = 96;
const FRAME_DELAY = 100;

let frame = 0;


// ============================================
// PRELOAD FRAMES
// ============================================

const frames = [];

for (let i = 0; i < FRAME_COUNT; i++) {

    const image = new Image();

    image.src =
        `/images/favicon/mind${String(i).padStart(4, "0")}.png`;

    frames.push(image);
}

console.log(
    `🎞️ Preloading ${FRAME_COUNT} favicon frames`
);


// ============================================
// CHANGE FAVICON
// ============================================

function setFavicon(index) {

    const oldIcons =
        document.querySelectorAll(
            'link[data-animated-favicon]'
        );


    oldIcons.forEach(
        icon => icon.remove()
    );


    const link =
        document.createElement("link");

    link.rel =
        "icon";

    link.type =
        "image/png";

    link.dataset.animatedFavicon =
        "true";

    link.href =
        `/favicon/mind${String(index).padStart(4, "0")}.png`;


    document.head.appendChild(
        link
    );


    console.log(
        `🎞️ Favicon frame ${index}`
    );
}


// ============================================
// ANIMATE
// ============================================

setFavicon(0);


setInterval(
    () => {

        frame++;

        if (
            frame >= FRAME_COUNT
        ) {

            frame = 0;

        }


        setFavicon(frame);

    },
    FRAME_DELAY
);