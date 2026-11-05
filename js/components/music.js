
// Component module: classic script, shares app.js globals.
// ---------- musik (PlayButton.tsx) ----------

let hasTriggered = false;

function setMusicIcon(playing) {
    const iconPlay = $("#iconPlay");
    const iconPause = $("#iconPause");
    const btnMusic = $("#btnMusic");

    if (iconPlay) {
        iconPlay.style.display = playing ? "none" : "block";
    }

    if (iconPause) {
        iconPause.style.display = playing ? "block" : "none";
    }

    if (btnMusic) {
        btnMusic.setAttribute(
            "aria-label",
            playing ? "Pause music" : "Play music"
        );
    }
}

function setupAudio() {
    const c = state.data?.dataContent;
    const audio = $("#bgAudio");
    const btnMusic = $("#btnMusic");

    // Pastikan data dan elemen HTML tersedia.
    if (!c || !audio || !btnMusic) return;

    let src = "";

    // Musik utama.
    if (c.songList) {
        src = media(c.songList);
    }

    // Background sound memiliki prioritas jika tersedia.
    if (c.backgroundSoundData?.url) {
        src = media(c.backgroundSoundData.url);
    }

    const hasMusic = Boolean(src);

    if (hasMusic) {
        audio.src = src;
        audio.load();
    } else {
        audio.removeAttribute("src");
        audio.load();
    }

    setMusicIcon(false);

    btnMusic.addEventListener("click", async () => {
        if (!hasMusic || !audio.src) return;

        if (audio.paused) {
            try {
                await audio.play();
                hasTriggered = true;
                setMusicIcon(true);
            } catch (error) {
                console.warn("Music playback failed:", error);
                setMusicIcon(false);
            }
        } else {
            audio.pause();
            setMusicIcon(false);
        }
    });

    // Sinkronkan ikon jika audio berhenti atau berakhir.
    audio.addEventListener("pause", () => {
        setMusicIcon(false);
    });

    audio.addEventListener("play", () => {
        setMusicIcon(true);
    });

    // Pause ketika tab disembunyikan.
    document.addEventListener("visibilitychange", async () => {
        if (!audio.src) return;

        if (document.hidden) {
            if (!audio.paused) {
                audio.pause();
            }
        } else if (hasTriggered && audio.paused) {
            try {
                await audio.play();
            } catch (error) {
                // Browser mungkin membutuhkan interaksi pengguna.
                setMusicIcon(false);
            }
        }
    });
}

async function playMusic() {
    const audio = $("#bgAudio");

    if (!audio || !audio.src) return;

    try {
        await audio.play();
        hasTriggered = true;
        setMusicIcon(true);
    } catch (error) {
        console.warn("Music playback failed:", error);
        setMusicIcon(false);
    }
}
