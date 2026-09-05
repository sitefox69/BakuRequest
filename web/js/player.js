let currentPlayerState = {
    song: null,
    playing: false,
    paused: false,
    position: 0,
    duration: 0,
    progress: 0
};


/* =========================================================
   ELEMENTY
========================================================= */

const playerTitle =
    document.getElementById("player-title");

const playerAddedBy =
    document.getElementById("player-added-by");

const playerThumbnail =
    document.getElementById("player-thumbnail");

const playerProgressBar =
    document.getElementById("player-progress-bar");

const playerCurrentTime =
    document.getElementById("player-current-time");

const playerDuration =
    document.getElementById("player-duration");

const playerPreviousButton =
    document.getElementById("player-previous");

const playerPlayPauseButton =
    document.getElementById("player-play-pause");

const playerSkipButton =
    document.getElementById("player-skip");

const playerMessage =
    document.getElementById("player-message");

const connectionStatus =
    document.getElementById("connection-status");


/* =========================================================
   API
========================================================= */

async function playerGet(path) {
    const response = await fetch(
        path,
        {
            method: "GET",
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    return await response.json();
}


async function playerPost(path, body = {}) {
    const response = await fetch(
        path,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(body)
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            `HTTP ${response.status}`
        );
    }

    return data;
}


/* =========================================================
   CONNECTION STATUS
========================================================= */

function setConnectionStatus(online) {
    if (!connectionStatus) {
        return;
    }

    const text =
        connectionStatus.querySelector(
            "span"
        );

    if (online) {
        connectionStatus.classList.remove(
            "offline"
        );

        connectionStatus.classList.add(
            "online"
        );

        if (text) {
            text.textContent =
                "System online";
        }

        return;
    }

    connectionStatus.classList.remove(
        "online"
    );

    connectionStatus.classList.add(
        "offline"
    );

    if (text) {
        text.textContent =
            "System offline";
    }
}


/* =========================================================
   FORMATOWANIE CZASU
========================================================= */

function formatPlayerTime(seconds) {
    const safeSeconds =
        Number.isFinite(Number(seconds))
            ? Math.max(
                0,
                Number(seconds)
            )
            : 0;

    const totalSeconds =
        Math.floor(safeSeconds);

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const remainingSeconds =
        totalSeconds % 60;

    return (
        String(minutes) +
        ":" +
        String(
            remainingSeconds
        ).padStart(
            2,
            "0"
        )
    );
}


/* =========================================================
   PROGRESS
========================================================= */

function clampProgress(value) {
    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(
        0,
        Math.min(
            100,
            number
        )
    );
}


/* =========================================================
   MESSAGE
========================================================= */

function setPlayerMessage(
    message,
    isError = false
) {
    if (!playerMessage) {
        return;
    }

    playerMessage.textContent =
        message || "";

    playerMessage.dataset.error =
        isError
            ? "true"
            : "false";
}


/* =========================================================
   THUMBNAIL
========================================================= */

function setPlayerThumbnail(song) {
    if (!playerThumbnail) {
        return;
    }

    const thumbnail =
        song &&
        song.thumbnail
            ? String(
                song.thumbnail
            ).trim()
            : "";

    if (!thumbnail) {
        playerThumbnail.removeAttribute(
            "src"
        );

        playerThumbnail.style.display =
            "none";

        return;
    }

    if (
        playerThumbnail.getAttribute(
            "src"
        ) !== thumbnail
    ) {
        playerThumbnail.src =
            thumbnail;
    }

    playerThumbnail.style.display =
        "block";
}


if (playerThumbnail) {
    playerThumbnail.addEventListener(
        "error",
        function () {
            playerThumbnail.removeAttribute(
                "src"
            );

            playerThumbnail.style.display =
                "none";
        }
    );
}


/* =========================================================
   SONG URL
========================================================= */

function getPlayerSongUrl(song) {
    if (
        !song ||
        typeof song !== "object"
    ) {
        return "";
    }

    return String(
        song.url ||
        ""
    ).trim();
}


function renderPlayerTitle(song) {
    if (!playerTitle) {
        return;
    }

    if (!song) {
        playerTitle.textContent =
            "Nic nie gra";

        playerTitle.removeAttribute(
            "role"
        );

        playerTitle.removeAttribute(
            "tabindex"
        );

        playerTitle.removeAttribute(
            "title"
        );

        playerTitle.style.cursor =
            "";

        return;
    }

    playerTitle.textContent =
        song.title ||
        "Nieznany utwór";

    const songUrl =
        getPlayerSongUrl(
            song
        );

    playerTitle.removeAttribute(
        "role"
    );

    playerTitle.removeAttribute(
        "tabindex"
    );

    playerTitle.removeAttribute(
        "title"
    );

    playerTitle.style.cursor =
        "";

    /*
        Nie zmieniamy koloru ani wyglądu tytułu.
        Jedyną wizualną zmianą jest kursor po najechaniu.
    */

    if (!songUrl) {
        return;
    }

    playerTitle.setAttribute(
        "role",
        "link"
    );

    playerTitle.setAttribute(
        "tabindex",
        "0"
    );

    playerTitle.setAttribute(
        "title",
        "Otwórz utwór na YouTube"
    );

    playerTitle.style.cursor =
        "pointer";
}


function openCurrentSongUrl() {
    const songUrl =
        getPlayerSongUrl(
            currentPlayerState.song
        );

    if (!songUrl) {
        return;
    }

    window.open(
        songUrl,
        "_blank",
        "noopener,noreferrer"
    );
}


if (playerTitle) {
    playerTitle.addEventListener(
        "click",
        function () {
            openCurrentSongUrl();
        }
    );

    playerTitle.addEventListener(
        "keydown",
        function (event) {
            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            event.preventDefault();

            openCurrentSongUrl();
        }
    );
}


/* =========================================================
   ADDED BY / MODERATION
========================================================= */

function getPlayerAddedBy(song) {
    if (
        !song ||
        typeof song !== "object"
    ) {
        return "";
    }

    return String(
        song.addedBy ||
        song.added_by ||
        song.requestedBy ||
        song.requested_by ||
        ""
    ).trim();
}


function renderPlayerAddedBy(song) {
    if (!playerAddedBy) {
        return;
    }

    const addedBy =
        getPlayerAddedBy(
            song
        );

    playerAddedBy.textContent =
        addedBy ||
        (
            song &&
            song.artist
                ? song.artist
                : "—"
        );

    playerAddedBy.removeAttribute(
        "role"
    );

    playerAddedBy.removeAttribute(
        "tabindex"
    );

    playerAddedBy.removeAttribute(
        "title"
    );

    playerAddedBy.style.cursor =
        "";

    playerAddedBy.style.textDecoration =
        "";

    playerAddedBy.style.color =
        "";

    if (!addedBy) {
        return;
    }

    playerAddedBy.setAttribute(
        "role",
        "button"
    );

    playerAddedBy.setAttribute(
        "tabindex",
        "0"
    );

    playerAddedBy.setAttribute(
        "title",
        `Moderuj użytkownika ${addedBy}`
    );

    playerAddedBy.style.cursor =
        "pointer";

    playerAddedBy.style.color =
        "#9147ff";
}


function openPlayerUserModeration() {
    const song =
        currentPlayerState.song;

    const addedBy =
        getPlayerAddedBy(
            song
        );

    if (!addedBy) {
        return;
    }

    if (
        typeof openTimeoutModal !==
        "function"
    ) {
        setPlayerMessage(
            "Panel moderacji nie jest dostępny.",
            true
        );

        return;
    }

    openTimeoutModal(
        addedBy
    );
}


if (playerAddedBy) {
    playerAddedBy.addEventListener(
        "click",
        function () {
            openPlayerUserModeration();
        }
    );

    playerAddedBy.addEventListener(
        "keydown",
        function (event) {
            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            event.preventDefault();

            openPlayerUserModeration();
        }
    );
}


/* =========================================================
   PLAY / PAUSE BUTTON
========================================================= */

function renderPlayPauseButton() {
    if (!playerPlayPauseButton) {
        return;
    }

    if (
        currentPlayerState.playing &&
        !currentPlayerState.paused
    ) {
        playerPlayPauseButton.textContent =
            "⏸ Play / Pause";

        playerPlayPauseButton.classList.add(
            "active"
        );

        return;
    }

    playerPlayPauseButton.textContent =
        "▶ Play / Pause";

    playerPlayPauseButton.classList.remove(
        "active"
    );
}


/* =========================================================
   RENDER PLAYER
========================================================= */

function renderPlayer() {
    const song =
        currentPlayerState.song;

    if (!song) {
        renderPlayerTitle(
            null
        );

        renderPlayerAddedBy(
            null
        );

        setPlayerThumbnail(null);

        if (playerProgressBar) {
            playerProgressBar.style.width =
                "0%";
        }

        if (playerCurrentTime) {
            playerCurrentTime.textContent =
                "0:00";
        }

        if (playerDuration) {
            playerDuration.textContent =
                "0:00";
        }

        renderPlayPauseButton();

        return;
    }

    renderPlayerTitle(
        song
    );

    renderPlayerAddedBy(
        song
    );

    setPlayerThumbnail(song);

    const progress =
        clampProgress(
            currentPlayerState.progress
        );

    if (playerProgressBar) {
        playerProgressBar.style.width =
            `${progress}%`;
    }

    if (playerCurrentTime) {
        playerCurrentTime.textContent =
            formatPlayerTime(
                currentPlayerState.position
            );
    }

    if (playerDuration) {
        playerDuration.textContent =
            formatPlayerTime(
                currentPlayerState.duration
            );
    }

    renderPlayPauseButton();
}


/* =========================================================
   REFRESH
========================================================= */

async function refreshPlayer() {
    try {
        const data =
            await playerGet(
                "/sr/current"
            );

        currentPlayerState = {
            song:
                data.song ||
                null,

            playing:
                Boolean(
                    data.playing
                ),

            paused:
                Boolean(
                    data.paused
                ),

            position:
                Number(
                    data.position ||
                    0
                ),

            duration:
                Number(
                    data.duration ||
                    0
                ),

            progress:
                Number(
                    data.progress ||
                    0
                )
        };

        setConnectionStatus(true);

        renderPlayer();

    } catch (error) {
        setConnectionStatus(false);

        currentPlayerState = {
            song: null,
            playing: false,
            paused: false,
            position: 0,
            duration: 0,
            progress: 0
        };

        renderPlayer();
    }
}


/* =========================================================
   PREVIOUS
========================================================= */

async function previousPlayer() {
    if (
        !currentPlayerState.song
    ) {
        setPlayerMessage(
            "Nic obecnie nie gra.",
            true
        );

        return;
    }

    if (playerPreviousButton) {
        playerPreviousButton.disabled =
            true;
    }

    try {
        const data =
            await playerPost(
                "/sr/previous"
            );

        if (
            data.success === false
        ) {
            throw new Error(
                data.error ||
                "Nie udało się cofnąć utworu."
            );
        }

        if (
            data.action ===
            "previous_song"
        ) {
            setPlayerMessage(
                "Wrócono do poprzedniego utworu."
            );
        } else {
            setPlayerMessage(
                data.previousAvailable
                    ? "Utwór od początku. Kliknij Previous ponownie, aby wrócić do poprzedniego utworu."
                    : "Utwór od początku."
            );
        }

        await refreshPlayer();

    } catch (error) {
        setPlayerMessage(
            "Nie udało się cofnąć utworu.",
            true
        );

    } finally {
        if (playerPreviousButton) {
            playerPreviousButton.disabled =
                false;
        }
    }
}


/* =========================================================
   PLAY / PAUSE ACTION
========================================================= */

async function togglePlayPause() {
    if (
        !currentPlayerState.song
    ) {
        setPlayerMessage(
            "Nic obecnie nie gra.",
            true
        );

        return;
    }

    if (
        currentPlayerState.playing &&
        !currentPlayerState.paused
    ) {
        await pausePlayer();

        return;
    }

    await resumePlayer();
}


/* =========================================================
   PAUSE
========================================================= */

async function pausePlayer() {
    if (playerPlayPauseButton) {
        playerPlayPauseButton.disabled =
            true;
    }

    try {
        const data =
            await playerPost(
                "/sr/pause"
            );

        if (
            data.success === false
        ) {
            throw new Error(
                data.error ||
                "Nie udało się zatrzymać odtwarzania."
            );
        }

        currentPlayerState.playing =
            false;

        currentPlayerState.paused =
            true;

        setPlayerMessage(
            "Pauza."
        );

        renderPlayer();

        await refreshPlayer();

    } catch (error) {
        setPlayerMessage(
            "Nie udało się włączyć pauzy.",
            true
        );

    } finally {
        if (playerPlayPauseButton) {
            playerPlayPauseButton.disabled =
                false;
        }
    }
}


/* =========================================================
   RESUME / PLAY
========================================================= */

async function resumePlayer() {
    if (playerPlayPauseButton) {
        playerPlayPauseButton.disabled =
            true;
    }

    try {
        const data =
            await playerPost(
                "/sr/play"
            );

        if (
            data.success === false
        ) {
            throw new Error(
                data.error ||
                "Nie udało się wznowić odtwarzania."
            );
        }

        currentPlayerState.playing =
            true;

        currentPlayerState.paused =
            false;

        setPlayerMessage(
            "Odtwarzanie wznowione."
        );

        renderPlayer();

        await refreshPlayer();

    } catch (error) {
        setPlayerMessage(
            "Nie udało się wznowić odtwarzania.",
            true
        );

    } finally {
        if (playerPlayPauseButton) {
            playerPlayPauseButton.disabled =
                false;
        }
    }
}


/* =========================================================
   SKIP
========================================================= */

async function skipPlayer() {
    if (playerSkipButton) {
        playerSkipButton.disabled =
            true;
    }

    try {
        const data =
            await playerPost(
                "/sr/skip"
            );

        if (
            data.success === false
        ) {
            throw new Error(
                data.error ||
                "Nie udało się pominąć utworu."
            );
        }

        setPlayerMessage(
            "Utwór pominięty."
        );

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    300
                )
        );

        await refreshPlayer();

    } catch (error) {
        setPlayerMessage(
            "Nie udało się pominąć utworu.",
            true
        );

    } finally {
        if (playerSkipButton) {
            playerSkipButton.disabled =
                false;
        }
    }
}


/* =========================================================
   EVENTS
========================================================= */

if (playerPreviousButton) {
    playerPreviousButton.addEventListener(
        "click",
        previousPlayer
    );
}


if (playerPlayPauseButton) {
    playerPlayPauseButton.addEventListener(
        "click",
        togglePlayPause
    );
}


if (playerSkipButton) {
    playerSkipButton.addEventListener(
        "click",
        skipPlayer
    );
}


/* =========================================================
   START
========================================================= */

refreshPlayer();

setInterval(
    refreshPlayer,
    1000
);
