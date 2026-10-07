
// ============================================
// CHARACTER SYSTEM
// ============================================

console.log("🐱 Character System loaded");


function initializeCharacterSystem() {

    const input =
        document.getElementById('talk-input');

    const status =
        document.getElementById('status');

    const character =
        document.getElementById('character');


    console.log(
        '🐱 Character elements:',
        {
            input: !!input,
            status: !!status,
            character: !!character
        }
    );


    if (!input || !status || !character) {

        console.error(
            '🐱 Character System could not find desktop elements.'
        );

        return;
    }


    let isResponding = false;
    let responses = null;
    let redirectMap = null;

    const wordHistory = [];


    const CONFIG = {

        imageScale: 0.5,

        displayTime: 5000,

        maxWordLength: 20

    };


    // ========================================
    // POSITION CHARACTER
    // ========================================

    function positionCharacter() {

        character.style.left =
            '50%';

        character.style.top =
            '45%';

        character.style.transform =
            'translate(-50%, -50%)';

    }


    positionCharacter();


    let resizeTimeout;


    window.addEventListener(
        'resize',
        () => {

            clearTimeout(
                resizeTimeout
            );

            resizeTimeout =
                setTimeout(
                    positionCharacter,
                    100
                );

        }
    );


    // ========================================
    // DECODER
    // ========================================

    function decodeChar(words) {

        let bits = '';


        for (const word of words) {

            const isUpper =
                word[0] ===
                word[0].toUpperCase();


            bits +=
                isUpper
                    ? '1'
                    : '0';

        }


        const charCode =
            parseInt(
                bits,
                2
            );


        return String.fromCharCode(
            charCode
        );

    }


    function decodeText(encoded) {

        const parts =
            encoded.split('.');


        let result = '';


        for (const part of parts) {

            const trimmed =
                part.trim();


            if (!trimmed) {
                continue;
            }


            const words =
                trimmed.split(/\s+/);


            if (words.length === 8) {

                result +=
                    decodeChar(words);

            }

        }


        return result;

    }


    function decodeTheVoices(content) {

        try {

            const match =
                content.match(
                    /const VOICES = `([\s\S]*?)`;/ 
                );


            if (!match) {

                throw new Error(
                    'Could not find VOICES template in responses.js'
                );

            }


            const encoded =
                match[1]
                    .replace(/\s+/g, ' ');


            const decoded =
                decodeText(encoded);


            if (
                !decoded ||
                decoded.length < 10
            ) {

                throw new Error(
                    `Decoded data is too short (${decoded.length} characters)`
                );

            }


            const data =
                JSON.parse(decoded);


            const decodedResponses = {};
            const redirects = {};


            for (
                const [key, value]
                of Object.entries(data)
            ) {

                if (
                    key.startsWith('_')
                ) {

                    redirects[
                        key.replace('_', '')
                    ] = value;

                } else {

                    decodedResponses[key] = {
                        text: value
                    };

                }

            }


            return {

                responses:
                    decodedResponses,

                redirects

            };


        } catch (e) {

            console.error(
                'Failed to decode responses.js:',
                e
            );

            throw e;

        }

    }


    // ========================================
    // LOAD RESPONSES
    // ========================================

    async function loadTheVoices() {

        try {

            console.log(
                'Loading /responses.js...'
            );


            const response =
                await fetch(
                    '/responses.js',
                    {
                        cache:
                            'no-store'
                    }
                );


            console.log(
                'responses.js status:',
                response.status,
                response.url
            );


            if (!response.ok) {

                throw new Error(
                    `responses.js returned HTTP ${response.status}`
                );

            }


            const content =
                await response.text();


            console.log(
                'responses.js loaded:',
                content.length,
                'characters'
            );


            const decoded =
                decodeTheVoices(
                    content
                );


            if (
                Object.keys(
                    decoded.responses
                ).length <= 10
            ) {

                throw new Error(
                    `Only ${Object.keys(decoded.responses).length} responses decoded`
                );

            }


            responses =
                decoded.responses;


            redirectMap =
                decoded.redirects;


            console.log(
                'Loaded',
                Object.keys(
                    responses
                ).length,
                'responses'
            );


            return true;


        } catch (e) {

            console.error(
                '================================='
            );

            console.error(
                'RESPONSES FAILED TO LOAD'
            );

            console.error(e);

            console.error(
                '================================='
            );


            responses = null;
            redirectMap = null;


            showStatus(
                'Responses failed to load. Check console.',
                '#ff5555'
            );


            return false;

        }

    }


    // ========================================
    // UI FUNCTIONS
    // ========================================

    function showStatus(
        msg,
        color = '#8be9fd'
    ) {

        status.textContent =
            msg;

        status.style.color =
            color;


        setTimeout(
            () => {

                if (
                    status.textContent ===
                    msg
                ) {

                    status.textContent =
                        '';

                }

            },
            3000
        );

    }


    function showResponseImage(
        word,
        response
    ) {

        if (isResponding) {
            return;
        }


        isResponding = true;


        const img =
            document.createElement(
                'img'
            );


        img.src =
            `/images/responses/${word}.webp`;


        img.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform:
                translate(-50%, -50%)
                scale(${CONFIG.imageScale});
            max-width: 80vw;
            max-height: 80vh;
            z-index: 100;
            opacity: 0;
            animation:
                imageAppear
                ${CONFIG.displayTime}ms
                forwards;
        `;


        const textEl =
            document.createElement(
                'div'
            );


        textEl.textContent =
            response.text;


        textEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform:
                translate(-50%, -50%);
            font-size: 3rem;
            font-weight: bold;
            color: white;
            text-shadow:
                -2px -2px 0 #000,
                 2px -2px 0 #000,
                -2px  2px 0 #000,
                 2px  2px 0 #000;
            z-index: 101;
            opacity: 0;
            text-align: center;
            max-width: 80vw;
            animation:
                imageAppear
                ${CONFIG.displayTime}ms
                forwards;
        `;


        img.onload = () => {

            document.body.appendChild(
                img
            );

            document.body.appendChild(
                textEl
            );

        };


        img.onerror = () => {

            console.error(
                `Response image not found: /images/responses/${word}.webp`
            );


            document.body.appendChild(
                textEl
            );

        };


        setTimeout(
            () => {

                img.style.opacity =
                    '0';

                textEl.style.opacity =
                    '0';


                setTimeout(
                    () => {

                        img.remove();

                        textEl.remove();

                        isResponding =
                            false;

                    },
                    300
                );

            },
            CONFIG.displayTime
        );

    }


    // ========================================
    // PROCESS WORD
    // ========================================

    function processWord(word) {

        if (!responses) {

            showStatus(
                'Responses are not loaded.',
                '#ff5555'
            );

            return;

        }


        word =
            word
                .toLowerCase()
                .trim();


        if (!word) {
            return;
        }


        console.log(
            'Input:',
            JSON.stringify(word)
        );


        console.log(
            'Response:',
            responses[word]
        );


        if (
            redirectMap &&
            redirectMap[word]
        ) {

            console.log(
                `Redirect: "${word}" → "${redirectMap[word]}"`
            );


            word =
                redirectMap[word];

        }


        const response =
            responses[word];


        if (!response) {

            console.log(
                `No response found for "${word}"`
            );


            showResponseImage(
                'unknown',
                {
                    text:
                        "I don't know that one."
                }
            );


            return;

        }


        console.log(
            `Response found: "${word}" → "${response.text}"`
        );


        showResponseImage(
            word,
            response
        );

    }


    // ========================================
    // EVENTS
    // ========================================

    input.addEventListener(
        'keypress',
        (e) => {

            if (
                e.key === 'Enter' &&
                !isResponding
            ) {

                const word =
                    input.value.trim();


                input.value =
                    '';


                if (word) {

                    processWord(
                        word
                    );

                }

            }

        }
    );


    character.addEventListener(
        'click',
        () => {

            console.log(
                '🐱 Character clicked'
            );


            showStatus(
                "Don't be shy, say something.",
                "#8be9fd"
            );


            input.focus();

        }
    );


    // ========================================
    // ANIMATION
    // ========================================

    const style =
        document.createElement(
            'style'
        );


    style.textContent = `
        @keyframes imageAppear {

            0% {
                opacity: 0;

                transform:
                    translate(-50%, -50%)
                    translateY(20px);
            }

            15% {
                opacity: 1;

                transform:
                    translate(-50%, -50%)
                    translateY(0);
            }

            85% {
                opacity: 1;

                transform:
                    translate(-50%, -50%)
                    translateY(0);
            }

            100% {
                opacity: 0;

                transform:
                    translate(-50%, -50%)
                    translateY(-20px);
            }

        }
    `;


    document.head.appendChild(
        style
    );


    // ========================================
    // START
    // ========================================

    loadTheVoices()
        .then(
            (success) => {

                if (!success) {
                    return;
                }


                input.focus();


                setTimeout(
                    () => {

                        if (
                            wordHistory.length === 0
                        ) {

                            showStatus(
                                'Try typing "hello" or "name"',
                                '#8be9fd'
                            );

                        }

                    },
                    2000
                );

            }
        );

}


// ============================================
// START SYSTEM
// ============================================
//
// desktop.html is injected dynamically by
// phone-system.js AFTER DOMContentLoaded.
//
// Therefore we cannot wait for DOMContentLoaded
// when this script is loaded by desktop.html.
//
// ============================================

if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initializeCharacterSystem,
        {
            once: true
        }
    );

} else {

    initializeCharacterSystem();

}

