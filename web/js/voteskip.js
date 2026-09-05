let voteSkipRefreshTimer = null;
let voteSkipSaving = false;
let lastValidVoteSkipThreshold = 3;


// ============================================================
// ELEMENTS
// ============================================================

const voteSkipEnabledElement =
    document.getElementById(
        "voteskip-enabled"
    );

const srSettingsButton =
    document.getElementById(
        "sr-settings-button"
    );

const srSettingsModal =
    document.getElementById(
        "sr-settings-modal"
    );

const srSettingsModalClose =
    document.getElementById(
        "sr-settings-modal-close"
    );

const srMaxSongLengthElement =
    document.getElementById(
        "sr-max-song-length"
    );

const srMaxSongsPerUserElement =
    document.getElementById(
        "sr-max-songs-per-user"
    );

const srVoteSkipThresholdElement =
    document.getElementById(
        "sr-voteskip-threshold"
    );

const srSettingsSaveButton =
    document.getElementById(
        "sr-settings-save"
    );

const srSettingsMessage =
    document.getElementById(
        "sr-settings-message"
    );


// ============================================================
// API
// ============================================================

async function voteSkipGet(path) {
    const response =
        await fetch(
            path,
            {
                method: "GET",
                cache: "no-store"
            }
        );

    let data = {};

    try {
        data =
            await response.json();
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


async function voteSkipPost(
    path,
    body = {}
) {
    const response =
        await fetch(
            path,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(
                    body
                )
            }
        );

    let data = {};

    try {
        data =
            await response.json();
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


// ============================================================
// CONNECTION
// ============================================================

function setVoteSkipConnectionStatus(
    online
) {
    if (
        typeof setConnectionStatus ===
        "function"
    ) {
        setConnectionStatus(
            online
        );
    }
}


// ============================================================
// SETTINGS MESSAGE
// ============================================================

function setSrSettingsMessage(
    message,
    error = false
) {
    if (!srSettingsMessage) {
        return;
    }

    srSettingsMessage.textContent =
        message || "";

    srSettingsMessage.dataset.error =
        error
            ? "true"
            : "false";
}


// ============================================================
// RENDER VOTE SKIP
// ============================================================

function renderVoteSkip(data) {
    const required =
        Number(
            data.required ??
            data.threshold ??
            3
        );

    const enabled =
        data.enabled !== false;


    if (
        Number.isInteger(required) &&
        required >= 1 &&
        required <= 1000
    ) {
        lastValidVoteSkipThreshold =
            required;
    }


    if (voteSkipEnabledElement) {
        voteSkipEnabledElement.checked =
            enabled;
    }


    if (
        srVoteSkipThresholdElement &&
        document.activeElement !==
            srVoteSkipThresholdElement
    ) {
        srVoteSkipThresholdElement.value =
            String(
                lastValidVoteSkipThreshold
            );
    }
}


// ============================================================
// REFRESH VOTE SKIP
// ============================================================

async function refreshVoteSkip() {
    if (voteSkipSaving) {
        return;
    }

    try {
        const data =
            await voteSkipGet(
                "/sr/voteskip"
            );

        renderVoteSkip(
            data
        );

        setVoteSkipConnectionStatus(
            true
        );

    } catch (error) {
        console.error(
            "Nie udało się pobrać Vote Skip:",
            error
        );

        setVoteSkipConnectionStatus(
            false
        );
    }
}


// ============================================================
// ENABLE / DISABLE
// ============================================================

async function saveVoteSkipEnabled() {
    if (!voteSkipEnabledElement) {
        return;
    }

    const enabled =
        Boolean(
            voteSkipEnabledElement.checked
        );


    voteSkipSaving = true;

    voteSkipEnabledElement.disabled =
        true;


    try {
        const data =
            await voteSkipPost(
                "/sr/voteskip/settings",
                {
                    enabled: enabled
                }
            );


        renderVoteSkip(
            data
        );


        setVoteSkipConnectionStatus(
            true
        );

    } catch (error) {
        console.error(
            "Nie udało się zmienić Vote Skip:",
            error
        );


        voteSkipEnabledElement.checked =
            !enabled;


        setVoteSkipConnectionStatus(
            false
        );

    } finally {
        voteSkipEnabledElement.disabled =
            false;

        voteSkipSaving =
            false;

        await refreshVoteSkip();
    }
}


// ============================================================
// OPEN SETTINGS
// ============================================================

async function openSrSettingsModal() {
    if (!srSettingsModal) {
        return;
    }


    setSrSettingsMessage(
        "Ładowanie ustawień..."
    );


    srSettingsModal.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";


    try {
        const results =
            await Promise.all([
                voteSkipGet(
                    "/sr/settings"
                ),
                voteSkipGet(
                    "/sr/voteskip"
                )
            ]);


        const srData =
            results[0];

        const voteData =
            results[1];


        const settings =
            srData.settings || {};


        const maxSongLengthSeconds =
            Number(
                settings.maxSongLengthSeconds ??
                600
            );


        const maxSongsPerUser =
            Number(
                settings.maxSongsPerUser ??
                3
            );


        const voteThreshold =
            Number(
                voteData.required ??
                voteData.threshold ??
                3
            );


        if (srMaxSongLengthElement) {
            srMaxSongLengthElement.value =
                String(
                    Math.max(
                        1,
                        Math.round(
                            maxSongLengthSeconds / 60
                        )
                    )
                );
        }


        if (srMaxSongsPerUserElement) {
            srMaxSongsPerUserElement.value =
                String(
                    Math.max(
                        1,
                        Math.round(
                            maxSongsPerUser
                        )
                    )
                );
        }


        if (
            Number.isInteger(voteThreshold) &&
            voteThreshold >= 1 &&
            voteThreshold <= 1000
        ) {
            lastValidVoteSkipThreshold =
                voteThreshold;
        }


        if (srVoteSkipThresholdElement) {
            srVoteSkipThresholdElement.value =
                String(
                    lastValidVoteSkipThreshold
                );
        }


        setSrSettingsMessage(
            ""
        );


        setVoteSkipConnectionStatus(
            true
        );

    } catch (error) {
        console.error(
            "Nie udało się pobrać ustawień SR:",
            error
        );


        setSrSettingsMessage(
            "Nie udało się pobrać ustawień.",
            true
        );


        setVoteSkipConnectionStatus(
            false
        );
    }
}


// ============================================================
// CLOSE SETTINGS
// ============================================================

function closeSrSettingsModal() {
    if (
        !srSettingsModal ||
        voteSkipSaving
    ) {
        return;
    }


    srSettingsModal.classList.remove(
        "open"
    );


    document.body.style.overflow =
        "";


    setSrSettingsMessage(
        ""
    );
}


// ============================================================
// VALIDATE SETTINGS
// ============================================================

function getSrSettingsValues() {
    if (
        !srMaxSongLengthElement ||
        !srMaxSongsPerUserElement ||
        !srVoteSkipThresholdElement
    ) {
        return null;
    }


    const maxMinutes =
        Number(
            srMaxSongLengthElement.value
        );


    const maxSongs =
        Number(
            srMaxSongsPerUserElement.value
        );


    const voteThreshold =
        Number(
            srVoteSkipThresholdElement.value
        );


    if (
        !Number.isInteger(maxMinutes) ||
        maxMinutes < 1
    ) {
        return {
            error:
                "Maksymalna długość utworu musi być pełną liczbą minut większą od 0."
        };
    }


    if (
        !Number.isInteger(maxSongs) ||
        maxSongs < 1
    ) {
        return {
            error:
                "Limit utworów na użytkownika musi być pełną liczbą większą od 0."
        };
    }


    if (
        !Number.isInteger(voteThreshold) ||
        voteThreshold < 1 ||
        voteThreshold > 1000
    ) {
        return {
            error:
                "Liczba głosów Vote Skip musi być liczbą od 1 do 1000."
        };
    }


    return {
        maxSongLengthSeconds:
            maxMinutes * 60,

        maxSongsPerUser:
            maxSongs,

        voteThreshold:
            voteThreshold
    };
}


// ============================================================
// SAVE SETTINGS
// ============================================================

async function saveSrSettings() {
    if (voteSkipSaving) {
        return;
    }


    const values =
        getSrSettingsValues();


    if (!values) {
        return;
    }


    if (values.error) {
        setSrSettingsMessage(
            values.error,
            true
        );

        return;
    }


    voteSkipSaving =
        true;


    if (srSettingsSaveButton) {
        srSettingsSaveButton.disabled =
            true;
    }


    if (srMaxSongLengthElement) {
        srMaxSongLengthElement.disabled =
            true;
    }


    if (srMaxSongsPerUserElement) {
        srMaxSongsPerUserElement.disabled =
            true;
    }


    if (srVoteSkipThresholdElement) {
        srVoteSkipThresholdElement.disabled =
            true;
    }


    setSrSettingsMessage(
        "Zapisywanie..."
    );


    try {
        const results =
            await Promise.all([
                voteSkipPost(
                    "/sr/settings",
                    {
                        maxSongLengthSeconds:
                            values.maxSongLengthSeconds,

                        maxSongsPerUser:
                            values.maxSongsPerUser
                    }
                ),

                voteSkipPost(
                    "/sr/voteskip/settings",
                    {
                        threshold:
                            values.voteThreshold
                    }
                )
            ]);


        const srResult =
            results[0];

        const voteResult =
            results[1];


        if (
            srResult.success === false
        ) {
            throw new Error(
                srResult.error ||
                "Nie udało się zapisać ustawień SR."
            );
        }


        if (
            voteResult.success === false
        ) {
            throw new Error(
                voteResult.error ||
                "Nie udało się zapisać ustawień Vote Skip."
            );
        }


        lastValidVoteSkipThreshold =
            values.voteThreshold;


        renderVoteSkip(
            voteResult
        );


        setSrSettingsMessage(
            "Ustawienia zapisane."
        );


        setVoteSkipConnectionStatus(
            true
        );


        if (
            typeof showNotification ===
            "function"
        ) {
            showNotification(
                "Ustawienia SR zapisane."
            );
        }


        setTimeout(
            function () {
                if (
                    srSettingsModal &&
                    srSettingsModal.classList.contains(
                        "open"
                    )
                ) {
                    srSettingsModal.classList.remove(
                        "open"
                    );

                    document.body.style.overflow =
                        "";

                    setSrSettingsMessage(
                        ""
                    );
                }
            },
            500
        );

    } catch (error) {
        console.error(
            "Nie udało się zapisać ustawień SR:",
            error
        );


        setSrSettingsMessage(
            "Nie udało się zapisać ustawień.",
            true
        );


        setVoteSkipConnectionStatus(
            false
        );

    } finally {
        voteSkipSaving =
            false;


        if (srSettingsSaveButton) {
            srSettingsSaveButton.disabled =
                false;
        }


        if (srMaxSongLengthElement) {
            srMaxSongLengthElement.disabled =
                false;
        }


        if (srMaxSongsPerUserElement) {
            srMaxSongsPerUserElement.disabled =
                false;
        }


        if (srVoteSkipThresholdElement) {
            srVoteSkipThresholdElement.disabled =
                false;
        }


        await refreshVoteSkip();
    }
}


// ============================================================
// EVENTS — VOTE SKIP
// ============================================================

if (voteSkipEnabledElement) {
    voteSkipEnabledElement.addEventListener(
        "change",
        saveVoteSkipEnabled
    );
}


// ============================================================
// EVENTS — SETTINGS
// ============================================================

if (srSettingsButton) {
    srSettingsButton.addEventListener(
        "click",
        openSrSettingsModal
    );
}


if (srSettingsModalClose) {
    srSettingsModalClose.addEventListener(
        "click",
        closeSrSettingsModal
    );
}


if (srSettingsSaveButton) {
    srSettingsSaveButton.addEventListener(
        "click",
        saveSrSettings
    );
}


if (srSettingsModal) {
    srSettingsModal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                srSettingsModal
            ) {
                closeSrSettingsModal();
            }
        }
    );
}


// ============================================================
// ENTER IN SETTINGS
// ============================================================

[
    srMaxSongLengthElement,
    srMaxSongsPerUserElement,
    srVoteSkipThresholdElement
]
    .filter(Boolean)
    .forEach(
        function (element) {
            element.addEventListener(
                "keydown",
                function (event) {
                    if (
                        event.key !==
                        "Enter"
                    ) {
                        return;
                    }


                    event.preventDefault();


                    saveSrSettings();
                }
            );
        }
    );


// ============================================================
// ESC
// ============================================================

document.addEventListener(
    "keydown",
    function (event) {
        if (
            event.key !==
            "Escape"
        ) {
            return;
        }


        if (
            srSettingsModal &&
            srSettingsModal.classList.contains(
                "open"
            )
        ) {
            closeSrSettingsModal();
        }
    }
);


// ============================================================
// START
// ============================================================

function startVoteSkipRefresh() {
    if (voteSkipRefreshTimer) {
        clearInterval(
            voteSkipRefreshTimer
        );
    }


    refreshVoteSkip();


    voteSkipRefreshTimer =
        setInterval(
            refreshVoteSkip,
            3000
        );
}


if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        startVoteSkipRefresh
    );

} else {
    startVoteSkipRefresh();
}
