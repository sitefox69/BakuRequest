let queueRefreshTimer = null;
let clearQueueInProgress = false;


// ============================================================
// ELEMENTS
// ============================================================

const clearQueueButton =
    document.getElementById(
        "clear-queue-button"
    );

const clearQueueModal =
    document.getElementById(
        "clear-queue-modal"
    );

const clearQueueModalClose =
    document.getElementById(
        "clear-queue-modal-close"
    );

const clearQueueCancelButton =
    document.getElementById(
        "clear-queue-cancel"
    );

const clearQueueConfirmButton =
    document.getElementById(
        "clear-queue-confirm"
    );

const clearQueueMessage =
    document.getElementById(
        "clear-queue-message"
    );


// ============================================================
// CLEAR QUEUE MESSAGE
// ============================================================

function setClearQueueMessage(
    message,
    error = false
) {
    if (!clearQueueMessage) {
        return;
    }

    clearQueueMessage.textContent =
        message || "";

    clearQueueMessage.dataset.error =
        error
            ? "true"
            : "false";
}


// ============================================================
// OPEN CLEAR QUEUE MODAL
// ============================================================

function openClearQueueModal() {
    if (!clearQueueModal) {
        return;
    }

    setClearQueueMessage("");

    clearQueueModal.classList.add(
        "open"
    );

    document.body.style.overflow =
        "hidden";
}


// ============================================================
// CLOSE CLEAR QUEUE MODAL
// ============================================================

function closeClearQueueModal() {
    if (
        !clearQueueModal ||
        clearQueueInProgress
    ) {
        return;
    }

    clearQueueModal.classList.remove(
        "open"
    );

    document.body.style.overflow =
        "";

    setClearQueueMessage("");
}


// ============================================================
// CLEAR QUEUE API
// ============================================================

async function clearWaitingQueue() {
    if (clearQueueInProgress) {
        return;
    }

    clearQueueInProgress = true;

    if (clearQueueConfirmButton) {
        clearQueueConfirmButton.disabled =
            true;
    }

    if (clearQueueCancelButton) {
        clearQueueCancelButton.disabled =
            true;
    }

    if (clearQueueModalClose) {
        clearQueueModalClose.disabled =
            true;
    }

    setClearQueueMessage(
        "Czyszczenie kolejki..."
    );


    try {
        const response =
            await fetch(
                "/sr/queue/clear",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({})
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


        if (data.success === false) {
            throw new Error(
                data.error ||
                "Nie udało się wyczyścić kolejki."
            );
        }


        const removedCount =
            Number(
                data.removedCount ?? 0
            );


        renderQueue(
            Array.isArray(data.queue)
                ? data.queue
                : []
        );


        const countElement =
            document.querySelector(
                "#queue-count"
            );

        if (countElement) {
            countElement.textContent =
                "0";
        }


        setConnectionStatus(true);


        if (
            typeof showNotification ===
            "function"
        ) {
            if (removedCount === 1) {
                showNotification(
                    "Usunięto 1 utwór z kolejki."
                );

            } else if (
                removedCount >= 2 &&
                removedCount <= 4
            ) {
                showNotification(
                    `Usunięto ${removedCount} utwory z kolejki.`
                );

            } else {
                showNotification(
                    `Usunięto ${removedCount} utworów z kolejki.`
                );
            }
        }


        clearQueueModal.classList.remove(
            "open"
        );

        document.body.style.overflow =
            "";


        await refreshQueue();

    } catch (error) {
        console.error(
            "Nie udało się wyczyścić kolejki:",
            error
        );


        setClearQueueMessage(
            "Nie udało się wyczyścić kolejki.",
            true
        );


        setConnectionStatus(false);

    } finally {
        clearQueueInProgress =
            false;


        if (clearQueueConfirmButton) {
            clearQueueConfirmButton.disabled =
                false;
        }


        if (clearQueueCancelButton) {
            clearQueueCancelButton.disabled =
                false;
        }


        if (clearQueueModalClose) {
            clearQueueModalClose.disabled =
                false;
        }
    }
}


// ============================================================
// REFRESH QUEUE
// ============================================================

async function refreshQueue() {
    try {
        const data =
            await getQueue();


        const queue =
            Array.isArray(data.queue)
                ? data.queue
                : [];


        renderQueue(
            queue
        );


        const countElement =
            document.querySelector(
                "#queue-count"
            );


        if (countElement) {
            countElement.textContent =
                String(
                    queue.length
                );
        }


        setConnectionStatus(true);

    } catch (error) {
        console.error(
            "Nie udało się pobrać kolejki:",
            error
        );


        setConnectionStatus(false);
    }
}


// ============================================================
// RENDER QUEUE
// ============================================================

function renderQueue(queue) {
    const container =
        document.querySelector(
            "#queue-list"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!queue.length) {
        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty";


        empty.textContent =
            "Kolejka jest pusta.";


        container.appendChild(
            empty
        );


        return;
    }


    queue.forEach(
        (song, index) => {
            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "queue-item";


            // ------------------------------------------------
            // INFO
            // ------------------------------------------------

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "queue-info";


            const number =
                document.createElement(
                    "span"
                );


            number.className =
                "queue-number";


            number.textContent =
                `${index + 1}.`;


            const title =
                document.createElement(
                    "span"
                );


            title.className =
                "queue-title";


            title.textContent =
                song.title ||
                "Nieznany tytuł";


            const artist =
                document.createElement(
                    "div"
                );


            artist.className =
                "queue-artist";


            artist.textContent =
                song.artist ||
                "Nieznany wykonawca";


            const addedBy =
                document.createElement(
                    "div"
                );


            addedBy.className =
                "queue-added-by";


            addedBy.textContent =
                `Dodano przez: ${
                    song.addedBy ||
                    "viewer"
                }`;


            info.appendChild(
                number
            );


            info.appendChild(
                title
            );


            info.appendChild(
                artist
            );


            info.appendChild(
                addedBy
            );


            // ------------------------------------------------
            // ACTIONS
            // ------------------------------------------------

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "queue-actions";


            // ------------------------------------------------
            // REMOVE
            // ------------------------------------------------

            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.textContent =
                "×";


            removeButton.title =
                "Usuń z kolejki";


            removeButton.addEventListener(
                "click",
                async () => {
                    try {
                        await removeQueueSong(
                            song.id
                        );


                        await refreshQueue();

                    } catch (error) {
                        console.error(
                            "Nie udało się usunąć utworu:",
                            error
                        );


                        if (
                            typeof showPlayerMessage ===
                            "function"
                        ) {
                            showPlayerMessage(
                                error.message,
                                true
                            );
                        }
                    }
                }
            );


            // ------------------------------------------------
            // BAN
            // ------------------------------------------------

            const banButton =
                document.createElement(
                    "button"
                );


            banButton.type =
                "button";


            banButton.textContent =
                "BAN";


            banButton.title =
                "Zablokuj utwór";


            banButton.addEventListener(
                "click",
                async () => {
                    const confirmed =
                        confirm(
                            `Zbanować utwór:\n\n${song.title}?`
                        );


                    if (!confirmed) {
                        return;
                    }


                    try {
                        await banSong(
                            song.id,
                            "Ban z kolejki"
                        );


                        await refreshQueue();


                        if (
                            typeof refreshModeration ===
                            "function"
                        ) {
                            await refreshModeration();
                        }


                        if (
                            typeof showPlayerMessage ===
                            "function"
                        ) {
                            showPlayerMessage(
                                "Utwór został zbanowany."
                            );
                        }

                    } catch (error) {
                        console.error(
                            "Nie udało się zbanować utworu:",
                            error
                        );


                        if (
                            typeof showPlayerMessage ===
                            "function"
                        ) {
                            showPlayerMessage(
                                error.message,
                                true
                            );
                        }
                    }
                }
            );


            actions.appendChild(
                removeButton
            );


            actions.appendChild(
                banButton
            );


            item.appendChild(
                info
            );


            item.appendChild(
                actions
            );


            container.appendChild(
                item
            );
        }
    );
}


// ============================================================
// EVENTS — CLEAR QUEUE
// ============================================================

if (clearQueueButton) {
    clearQueueButton.addEventListener(
        "click",
        openClearQueueModal
    );
}


if (clearQueueModalClose) {
    clearQueueModalClose.addEventListener(
        "click",
        closeClearQueueModal
    );
}


if (clearQueueCancelButton) {
    clearQueueCancelButton.addEventListener(
        "click",
        closeClearQueueModal
    );
}


if (clearQueueConfirmButton) {
    clearQueueConfirmButton.addEventListener(
        "click",
        clearWaitingQueue
    );
}


if (clearQueueModal) {
    clearQueueModal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                clearQueueModal
            ) {
                closeClearQueueModal();
            }
        }
    );
}


// ============================================================
// ESC
// ============================================================

document.addEventListener(
    "keydown",
    function (event) {
        if (
            event.key !== "Escape"
        ) {
            return;
        }


        if (
            clearQueueModal &&
            clearQueueModal.classList.contains(
                "open"
            )
        ) {
            closeClearQueueModal();
        }
    }
);


// ============================================================
// START QUEUE REFRESH
// ============================================================

function startQueueRefresh() {
    if (queueRefreshTimer) {
        clearInterval(
            queueRefreshTimer
        );
    }


    refreshQueue();


    queueRefreshTimer =
        setInterval(
            refreshQueue,
            3000
        );
}


// ============================================================
// INITIALIZE
// ============================================================

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        startQueueRefresh
    );

} else {
    startQueueRefresh();
}
