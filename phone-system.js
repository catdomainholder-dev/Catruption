
// ============================================
// PHONE SYSTEM / SITE BOOTLOADER
// ============================================
//
// First visit:
//
//     phone rings
//          ↓
//     click phone
//          ↓
//     phone image changes
//          ↓
//     wait
//          ↓
//     play clicking sound
//          ↓
//     type dialogue
//          ↓
//     wait between lines
//          ↓
//     desktop.html
//
// Returning visit:
//
//     desktop.html immediately
//
// ============================================

console.log("☎️ Phone System loaded");


// ============================================
// CONFIG
// ============================================

const PHONE_CONFIG = {

    normalSrc:
        "/images/desktop/dialing.webp",

    ringingSrc:
        "/images/desktop/ringing.webp",

    ringingSound:
        "https://files.catbox.moe/g9bs17.mp3",

    messageReceivedSound:
        "/audio/sounds/messaged.mp3",

    // Sound played after the phone is answered,
    // before the first line appears.
    clickSound:
        "https://files.catbox.moe/xpk1pt.mp3",

    // How long dialing.webp gets to play
    // before the dialogue begins.
    clickDelay:
        1000,

    // Delay after a line finishes before
    // checking for the next line.
    lineDelay:
        3000,

    // Time between each typed character.
    //
    // 75 = fairly quick
    // 100 = normal
    // 150 = slow
    typingSpeed:
        200,

    // Dialogue lines.
    //
    // Add more lines here later.
    dialogue: [
        "...",
        "Hello..?",
        "This site contains gore and flashing colors",
        "Stay safe...",

    ],

    cacheKey:
        "catruption_phone_answered_v1"

};


// ============================================
// PHONE SYSTEM
// ============================================

class PhoneSystem {

    constructor() {

        this.phoneElement = null;

        this.isRinging = false;

        this.ringingAudio = null;

        this.messageReceivedAudio = null;

        this.clickAudio = null;

        this.audioUnlocked = false;

        this.desktopLoaded = false;

        this.dialogueElement = null;

        this.isDialogueRunning = false;

        this._initialize();

    }


    // ========================================
    // INITIALIZE
    // ========================================

    _initialize() {

        this.phoneElement =
            document.querySelector(
                '#phone-boot-layer .desktop-icon'
            );

        if (!this.phoneElement) {

            console.error(
                "☎️ Phone boot element not found."
            );

            return;

        }


        // ------------------------------------
        // Create audio
        // ------------------------------------

        this.ringingAudio =
            new Audio(
                PHONE_CONFIG.ringingSound
            );

        this.ringingAudio.loop =
            true;


        this.messageReceivedAudio =
            new Audio(
                PHONE_CONFIG.messageReceivedSound
            );


        this.clickAudio =
            new Audio(
                PHONE_CONFIG.clickSound
            );


        // ------------------------------------
        // Phone starts with normal image.
        // ------------------------------------

        this._setPhoneImage(
            PHONE_CONFIG.normalSrc
        );


        // ------------------------------------
        // Unlock audio on first interaction.
        // ------------------------------------

        this._bindAudioUnlock();


        // ------------------------------------
        // Phone click.
        // ------------------------------------

        this.phoneElement.addEventListener(
            'click',
            () => {

                if (!this.isRinging) {
                    return;
                }

                this.stopRinging();

            }
        );


        // ------------------------------------
        // Already answered?
        // ------------------------------------

        if (this.hasBeenAnswered()) {

            console.log(
                "☎️ Phone already answered. Booting desktop."
            );

            this._bootDesktop();

            return;

        }


        // ------------------------------------
        // FIRST VISIT
        // ------------------------------------

        console.log(
            "☎️ First visit. Phone is ringing."
        );

        this.startRinging();

    }


    // ========================================
    // AUDIO UNLOCK
    // ========================================

    _bindAudioUnlock() {

        const unlock =
            () => {

                if (this.audioUnlocked) {
                    return;
                }

                this.audioUnlocked =
                    true;


                console.log(
                    "🔊 Audio unlocked."
                );


                if (this.isRinging) {

                    this._playRingingSound();

                }


                document.removeEventListener(
                    'pointerdown',
                    unlock
                );

                document.removeEventListener(
                    'keydown',
                    unlock
                );

                document.removeEventListener(
                    'touchstart',
                    unlock
                );

            };


        document.addEventListener(
            'pointerdown',
            unlock,
            {
                passive: true
            }
        );

        document.addEventListener(
            'keydown',
            unlock,
            {
                passive: true
            }
        );

        document.addEventListener(
            'touchstart',
            unlock,
            {
                passive: true
            }
        );

    }


    // ========================================
    // SET PHONE IMAGE
    // ========================================

    _setPhoneImage(src) {

        const image =
            this.phoneElement?.querySelector(
                'img'
            );

        if (!image) {
            return;
        }

        image.src =
            src;

    }


    // ========================================
    // START RINGING
    // ========================================

    startRinging() {

        if (this.isRinging) {
            return;
        }

        this.isRinging =
            true;


        this._setPhoneImage(
            PHONE_CONFIG.ringingSrc
        );


        this._playRingingSound();


        console.log(
            "☎️ Phone is ringing."
        );

    }


    // ========================================
    // PLAY RINGING SOUND
    // ========================================

    _playRingingSound() {

        if (!this.ringingAudio) {
            return;
        }

        if (!this.isRinging) {
            return;
        }


        this.ringingAudio.loop =
            true;


        this.ringingAudio.currentTime =
            0;


        const promise =
            this.ringingAudio.play();


        if (
            promise &&
            typeof promise.catch ===
            'function'
        ) {

            promise.catch(
                error => {

                    if (
                        error.name !==
                        'NotAllowedError'
                    ) {

                        console.warn(
                            "☎️ Ringing audio failed:",
                            error
                        );

                    }

                }
            );

        }

    }


    // ========================================
    // STOP RINGING / ANSWER PHONE
    // ========================================

    stopRinging() {

        if (!this.isRinging) {
            return;
        }

        this.isRinging =
            false;


        // ------------------------------------
        // Stop ringing sound
        // ------------------------------------

        if (this.ringingAudio) {

            this.ringingAudio.pause();

            this.ringingAudio.currentTime =
                0;

        }


        // ------------------------------------
        // Switch to dialing image.
        // ------------------------------------

        this._setPhoneImage(
            PHONE_CONFIG.normalSrc
        );


        console.log(
            "☎️ Phone answered."
        );


        // ------------------------------------
        // Wait for the configurable amount
        // of time before playing the click.
        // ------------------------------------

        setTimeout(
            () => {

                this._startDialogueSequence();

            },
            PHONE_CONFIG.clickDelay
        );

    }


    // ========================================
    // PLAY CLICKING SOUND
    // ========================================

    _playClickSound() {

        if (!this.clickAudio) {
            return;
        }


        this.clickAudio.currentTime =
            0;


        const promise =
            this.clickAudio.play();


        if (
            promise &&
            typeof promise.catch ===
            'function'
        ) {

            promise.catch(
                error => {

                    if (
                        error.name !==
                        'NotAllowedError'
                    ) {

                        console.warn(
                            "☎️ Clicking sound failed:",
                            error
                        );

                    }

                }
            );

        }

    }


    // ========================================
    // START DIALOGUE
    // ========================================

    _startDialogueSequence() {

        if (this.isDialogueRunning) {
            return;
        }

        this.isDialogueRunning =
            true;


        // ------------------------------------
        // Clicking sound happens first.
        // ------------------------------------

        this._playClickSound();


        // ------------------------------------
        // Create dialogue element.
        // ------------------------------------

        this._createDialogueElement();


        // ------------------------------------
        // Begin first line.
        // ------------------------------------

        this._processDialogueLine(
            0
        );

    }


    // ========================================
    // CREATE DIALOGUE ELEMENT
    // ========================================

    _createDialogueElement() {

        if (this.dialogueElement) {
            this.dialogueElement.remove();
        }


        const element =
            document.createElement('div');


        element.id =
            'phone-dialogue';


        element.style.position =
            'fixed';

        element.style.left =
            '50%';

        element.style.top =
            '50%';

        element.style.transform =
            'translate(-50%, -50%)';


        element.style.zIndex =
            '99999';


        element.style.color =
            'white';


        element.style.fontFamily =
            'monospace';


        element.style.fontSize =
            '2rem';


        element.style.textAlign =
            'center';


        element.style.whiteSpace =
            'pre-wrap';


        element.style.pointerEvents =
            'none';


        element.style.userSelect =
            'none';


        element.textContent =
            '';


        document.body.appendChild(
            element
        );


        this.dialogueElement =
            element;

    }


    // ========================================
    // PROCESS ONE LINE
    // ========================================

    _processDialogueLine(index) {

        const lines =
            PHONE_CONFIG.dialogue;


        // ------------------------------------
        // No more lines.
        // ------------------------------------

        if (
            index >= lines.length
        ) {

            this._finishDialogue();

            return;

        }


        const line =
            String(
                lines[index] ?? ""
            );


        this._typeLine(
            line,
            () => {

                // --------------------------------
                // Wait before checking for the
                // next line.
                // --------------------------------

                setTimeout(
                    () => {

                        this._processDialogueLine(
                            index + 1
                        );

                    },
                    PHONE_CONFIG.lineDelay
                );

            }
        );

    }


    // ========================================
    // TYPE ONE LINE
    // ========================================

    _typeLine(text, onComplete) {

        if (!this.dialogueElement) {

            onComplete?.();

            return;

        }


        this.dialogueElement.textContent =
            '';


        let characterIndex =
            0;


        const typeNextCharacter =
            () => {

                if (
                    characterIndex >=
                    text.length
                ) {

                    onComplete?.();

                    return;

                }


                this.dialogueElement.textContent +=
                    text[characterIndex];


                characterIndex++;


                setTimeout(
                    typeNextCharacter,
                    PHONE_CONFIG.typingSpeed
                );

            };


        typeNextCharacter();

    }


    // ========================================
    // FINISH DIALOGUE
    // ========================================

    _finishDialogue() {

        this.isDialogueRunning =
            false;


        // ------------------------------------
        // Remove dialogue.
        // ------------------------------------

        if (this.dialogueElement) {

            this.dialogueElement.remove();

            this.dialogueElement =
                null;

        }


        // ------------------------------------
        // NOW the phone sequence has actually
        // been completed, so cache it.
        // ------------------------------------

        this.markAsAnswered();


        console.log(
            "☎️ Phone sequence complete."
        );


        // ------------------------------------
        // Continue to desktop.
        // ------------------------------------

        this._bootDesktop();

    }


    // ========================================
    // CACHE
    // ========================================

    hasBeenAnswered() {

        return (
            localStorage.getItem(
                PHONE_CONFIG.cacheKey
            ) === 'true'
        );

    }


    markAsAnswered() {

        localStorage.setItem(
            PHONE_CONFIG.cacheKey,
            'true'
        );

    }


    // ========================================
    // BOOT DESKTOP
    // ========================================

    async _bootDesktop() {

        if (this.desktopLoaded) {
            return;
        }

        this.desktopLoaded =
            true;


        const root =
            document.getElementById(
                'desktop-root'
            );

        if (!root) {

            console.error(
                "☎️ Desktop root not found."
            );

            this.desktopLoaded =
                false;

            return;

        }


        try {

            const response =
                await fetch(
                    'desktop.html',
                    {
                        cache: 'no-store'
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `desktop.html returned HTTP ${response.status}`
                );

            }


            const html =
                await response.text();


            // --------------------------------
            // Insert desktop HTML.
            // --------------------------------

            root.innerHTML =
                html;


            // --------------------------------
            // Execute desktop scripts.
            // --------------------------------

            await this._executeScripts(
                root
            );


            // --------------------------------
            // Switch boot state.
            // --------------------------------

            document.body.classList.remove(
                'phone-booting'
            );

            document.body.classList.add(
                'phone-ready'
            );


            console.log(
                "🖥️ Desktop boot complete."
            );


        } catch (error) {

            this.desktopLoaded =
                false;

            console.error(
                "🖥️ Failed to boot desktop:",
                error
            );

        }

    }


    // ========================================
    // EXECUTE SCRIPTS
    // ========================================

    async _executeScripts(container) {

        const scripts =
            Array.from(
                container.querySelectorAll(
                    'script'
                )
            );


        for (
            const oldScript of scripts
        ) {

            const newScript =
                document.createElement(
                    'script'
                );


            for (
                const attribute
                of oldScript.attributes
            ) {

                newScript.setAttribute(
                    attribute.name,
                    attribute.value
                );

            }


            if (oldScript.src) {

                await new Promise(
                    (resolve, reject) => {

                        newScript.onload =
                            resolve;

                        newScript.onerror =
                            reject;

                        document.head.appendChild(
                            newScript
                        );

                    }
                );

            } else {

                newScript.textContent =
                    oldScript.textContent;

                document.body.appendChild(
                    newScript
                );

            }


            oldScript.remove();

        }

    }


    // ========================================
    // MESSAGE RECEIVED
    // ========================================

    playMessageReceived() {

        if (!this.messageReceivedAudio) {
            return;
        }


        this.messageReceivedAudio.currentTime =
            0;


        const promise =
            this.messageReceivedAudio.play();


        if (
            promise &&
            typeof promise.catch ===
            'function'
        ) {

            promise.catch(
                error => {

                    console.warn(
                        "☎️ Message sound failed:",
                        error
                    );

                }
            );

        }

    }


    // ========================================
    // DEVELOPMENT RESET
    // ========================================
    //
    // Console:
    //
    //     phoneSystem.reset()
    //
    // Then reload.
    //
    // ========================================

    reset() {

        localStorage.removeItem(
            PHONE_CONFIG.cacheKey
        );


        console.log(
            "☎️ Phone cache cleared."
        );

    }

}


// ============================================
// GLOBAL INSTANCE
// ============================================

let phoneSystem =
    new PhoneSystem();


// ============================================
// PUBLIC API
// ============================================

window.PhoneSystem =
    PhoneSystem;

window.getPhoneSystem =
    () => phoneSystem;

window.phoneSystem =
    phoneSystem;


console.log(
    "☎️ Phone System ready"
);

