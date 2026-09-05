const moderationState = {
    bannedUsers: [],
    timeouts: [],
    bannedSongs: [],
    activeUsers: [],
    selectedUser: null,
    selectedTimeoutMinutes: 10
};


// ============================================================
// ELEMENTS
// ============================================================

const manageBansButton =
    document.getElementById(
        "manage-bans-button"
    );

const bansModal =
    document.getElementById(
        "bans-modal"
    );

const bansModalClose =
    document.getElementById(
        "bans-modal-close"
    );


const banTabUsers =
    document.getElementById(
        "ban-tab-users"
    );

const banTabTimeouts =
    document.getElementById(
        "ban-tab-timeouts"
    );

const banTabSongs =
    document.getElementById(
        "ban-tab-songs"
    );


const banPanelUsers =
    document.getElementById(
        "ban-panel-users"
    );

const banPanelTimeouts =
    document.getElementById(
        "ban-panel-timeouts"
    );

const banPanelSongs =
    document.getElementById(
        "ban-panel-songs"
    );


const bannedUsersSearch =
    document.getElementById(
        "banned-users-search"
    );

const timeoutsSearch =
    document.getElementById(
        "timeouts-search"
    );

const bannedSongsSearch =
    document.getElementById(
        "banned-songs-search"
    );

const activeUsersSearch =
    document.getElementById(
        "active-users-search"
    );


const bannedUsersList =
    document.getElementById(
        "banned-users-list"
    );

const timeoutsList =
    document.getElementById(
        "timeouts-list"
    );

const bannedSongsList =
    document.getElementById(
        "banned-songs-list"
    );

const activeUsersList =
    document.getElementById(
        "active-users-list"
    );


// ============================================================
// TIMEOUT MODAL ELEMENTS
// ============================================================

const timeoutModal =
    document.getElementById(
        "timeout-modal"
    );

const timeoutModalClose =
    document.getElementById(
        "timeout-modal-close"
    );

const timeoutUserName =
    document.getElementById(
        "timeout-user-name"
    );

const timeoutUserAvatar =
    document.getElementById(
        "timeout-user-avatar"
    );

const moderationReason =
    document.getElementById(
        "moderation-reason"
    );

const moderationUserId =
    document.getElementById(
        "moderation-user-id"
    );

const moderationDuration =
    document.getElementById(
        "moderation-duration"
    );

const timeoutBanUserButton =
    document.getElementById(
        "timeout-ban-user-button"
    );

const moderationMessage =
    document.getElementById(
        "moderation-message"
    );

const timeoutOptions =
    Array.from(
        document.querySelectorAll(
            ".timeout-option"
        )
    );


// ============================================================
// NOTIFICATION
// ============================================================

const notification =
    document.getElementById(
        "notification"
    );

let notificationTimer = null;


// ============================================================
// API
// ============================================================

async function moderationGet(path) {
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


async function moderationPost(
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
// NOTIFICATION
// ============================================================

function showNotification(
    message,
    error = false
) {
    if (!notification) {
        return;
    }

    if (notificationTimer) {
        clearTimeout(
            notificationTimer
        );
    }

    notification.textContent =
        message || "";

    notification.dataset.error =
        error
            ? "true"
            : "false";

    notification.classList.add(
        "show"
    );

    notificationTimer =
        setTimeout(
            function () {
                notification.classList.remove(
                    "show"
                );
            },
            2800
        );
}


// ============================================================
// MODERATION MESSAGE
// ============================================================

function setModerationMessage(
    message,
    error = false
) {
    if (!moderationMessage) {
        return;
    }

    moderationMessage.textContent =
        message || "";

    moderationMessage.dataset.error =
        error
            ? "true"
            : "false";
}


// ============================================================
// HELPERS
// ============================================================

function normalizeText(value) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}


function safeText(value) {
    return String(
        value ?? ""
    );
}


function getUserId(user) {
    if (
        typeof user === "string"
    ) {
        return user;
    }

    if (
        !user ||
        typeof user !== "object"
    ) {
        return "";
    }

    return safeText(
        user.userId ??
        user.username ??
        user.name ??
        user.id ??
        ""
    ).trim();
}


function getUserName(user) {
    if (
        typeof user === "string"
    ) {
        return user;
    }

    if (
        !user ||
        typeof user !== "object"
    ) {
        return "Nieznany użytkownik";
    }

    return safeText(
        user.username ??
        user.displayName ??
        user.userName ??
        user.userId ??
        user.name ??
        user.id ??
        "Nieznany użytkownik"
    ).trim();
}


function getUserAvatarLetter(user) {
    const name =
        getUserName(
            user
        );

    if (!name) {
        return "U";
    }

    return name
        .charAt(0)
        .toUpperCase();
}


function getSongId(song) {
    if (
        typeof song === "string"
    ) {
        return song;
    }

    if (
        !song ||
        typeof song !== "object"
    ) {
        return "";
    }

    return safeText(
        song.id ||
        song.songId ||
        ""
    ).trim();
}


function getSongTitle(song) {
    if (
        typeof song === "string"
    ) {
        return song;
    }

    if (
        !song ||
        typeof song !== "object"
    ) {
        return "Nieznany utwór";
    }

    return safeText(
        song.title ||
        song.id ||
        song.songId ||
        "Nieznany utwór"
    ).trim();
}


function formatDate(value) {
    if (!value) {
        return "";
    }

    let date = null;

    if (
        typeof value === "number"
    ) {
        const timestamp =
            value < 100000000000
                ? value * 1000
                : value;

        date =
            new Date(
                timestamp
            );

    } else {
        date =
            new Date(
                value
            );
    }

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "pl-PL"
    );
}


function isUserModerated(userId) {
    const normalizedId =
        normalizeText(
            userId
        );

    if (!normalizedId) {
        return false;
    }


    const banned =
        moderationState.bannedUsers.some(
            function (user) {
                return (
                    normalizeText(
                        getUserId(
                            user
                        )
                    ) ===
                    normalizedId
                );
            }
        );


    if (banned) {
        return true;
    }


    const timedOut =
        moderationState.timeouts.some(
            function (user) {
                return (
                    normalizeText(
                        getUserId(
                            user
                        )
                    ) ===
                    normalizedId
                );
            }
        );


    return timedOut;
}


// ============================================================
// NORMALIZE BACKEND DATA
// ============================================================

function applyModerationData(data) {
    const source =
        data || {};


    moderationState.bannedUsers =
        Array.isArray(
            source.bannedUsers
        )
            ? source.bannedUsers
            : [];


    moderationState.timeouts =
        Array.isArray(
            source.timeouts
        )
            ? source.timeouts
            : [];


    moderationState.bannedSongs =
        Array.isArray(
            source.bannedSongs
        )
            ? source.bannedSongs
            : [];
}


// ============================================================
// RENDER BANNED USERS
// ============================================================

function renderBannedUsers() {
    if (!bannedUsersList) {
        return;
    }


    const query =
        normalizeText(
            bannedUsersSearch
                ? bannedUsersSearch.value
                : ""
        );


    const users =
        moderationState.bannedUsers.filter(
            function (user) {
                if (!query) {
                    return true;
                }

                const text =
                    normalizeText(
                        `${getUserName(user)} ${getUserId(user)}`
                    );

                return text.includes(
                    query
                );
            }
        );


    bannedUsersList.innerHTML =
        "";


    if (!users.length) {
        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty";

        empty.textContent =
            query
                ? "Brak pasujących użytkowników."
                : "Brak zbanowanych użytkowników.";

        bannedUsersList.appendChild(
            empty
        );

        return;
    }


    users.forEach(
        function (user) {
            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "moderation-item";


            const label =
                document.createElement(
                    "span"
                );

            label.textContent =
                getUserName(
                    user
                );


            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                "ODBLOKUJ";


            button.addEventListener(
                "click",
                async function () {
                    await unbanUser(
                        getUserId(
                            user
                        )
                    );
                }
            );


            row.appendChild(
                label
            );

            row.appendChild(
                button
            );

            bannedUsersList.appendChild(
                row
            );
        }
    );
}


// ============================================================
// RENDER TIMEOUTS
// ============================================================

function renderTimeouts() {
    if (!timeoutsList) {
        return;
    }


    const query =
        normalizeText(
            timeoutsSearch
                ? timeoutsSearch.value
                : ""
        );


    const users =
        moderationState.timeouts.filter(
            function (user) {
                if (!query) {
                    return true;
                }

                const text =
                    normalizeText(
                        `${getUserName(user)} ${getUserId(user)}`
                    );

                return text.includes(
                    query
                );
            }
        );


    timeoutsList.innerHTML =
        "";


    if (!users.length) {
        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty";

        empty.textContent =
            query
                ? "Brak pasujących timeoutów."
                : "Brak aktywnych timeoutów.";

        timeoutsList.appendChild(
            empty
        );

        return;
    }


    users.forEach(
        function (user) {
            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "moderation-item";


            const label =
                document.createElement(
                    "span"
                );


            const expires =
                user.expiresAt ??
                user.until ??
                user.expires ??
                null;


            const formatted =
                formatDate(
                    expires
                );


            label.textContent =
                formatted
                    ? `${getUserName(user)} — do ${formatted}`
                    : getUserName(user);


            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                "USUŃ TIMEOUT";


            button.addEventListener(
                "click",
                async function () {
                    await removeTimeout(
                        getUserId(
                            user
                        )
                    );
                }
            );


            row.appendChild(
                label
            );

            row.appendChild(
                button
            );

            timeoutsList.appendChild(
                row
            );
        }
    );
}


// ============================================================
// RENDER BANNED SONGS
// ============================================================

function renderBannedSongs() {
    if (!bannedSongsList) {
        return;
    }


    const query =
        normalizeText(
            bannedSongsSearch
                ? bannedSongsSearch.value
                : ""
        );


    const songs =
        moderationState.bannedSongs.filter(
            function (song) {
                if (!query) {
                    return true;
                }

                const text =
                    normalizeText(
                        `${getSongTitle(song)} ${getSongId(song)}`
                    );

                return text.includes(
                    query
                );
            }
        );


    bannedSongsList.innerHTML =
        "";


    if (!songs.length) {
        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty";

        empty.textContent =
            query
                ? "Brak pasujących utworów."
                : "Brak zbanowanych utworów.";

        bannedSongsList.appendChild(
            empty
        );

        return;
    }


    songs.forEach(
        function (song) {
            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "moderation-item";


            const label =
                document.createElement(
                    "span"
                );

            label.textContent =
                getSongTitle(
                    song
                );


            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                "ODBLOKUJ";


            button.addEventListener(
                "click",
                async function () {
                    await unbanSong(
                        getSongId(
                            song
                        )
                    );
                }
            );


            row.appendChild(
                label
            );

            row.appendChild(
                button
            );

            bannedSongsList.appendChild(
                row
            );
        }
    );
}


// ============================================================
// RENDER ACTIVE USERS
// ============================================================

function renderActiveUsers() {
    if (!activeUsersList) {
        return;
    }


    const query =
        normalizeText(
            activeUsersSearch
                ? activeUsersSearch.value
                : ""
        );


    const users =
        moderationState.activeUsers
            .filter(
                function (user) {
                    const userId =
                        getUserId(
                            user
                        );

                    if (!userId) {
                        return false;
                    }

                    if (
                        isUserModerated(
                            userId
                        )
                    ) {
                        return false;
                    }

                    return true;
                }
            )
            .filter(
                function (user) {
                    if (!query) {
                        return true;
                    }

                    const text =
                        normalizeText(
                            `${getUserName(user)} ${getUserId(user)}`
                        );

                    return text.includes(
                        query
                    );
                }
            );


    activeUsersList.innerHTML =
        "";


    if (!users.length) {
        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty";

        empty.textContent =
            query
                ? "Brak pasujących użytkowników."
                : "Brak aktywnych użytkowników.";

        activeUsersList.appendChild(
            empty
        );

        return;
    }


    users.forEach(
        function (user) {
            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "user-row";


            const avatar =
                document.createElement(
                    "div"
                );

            avatar.className =
                "user-avatar";

            avatar.textContent =
                getUserAvatarLetter(
                    user
                );


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "user-row-info";


            const name =
                document.createElement(
                    "strong"
                );

            name.textContent =
                getUserName(
                    user
                );


            const status =
                document.createElement(
                    "span"
                );

            status.textContent =
                "Aktywny";


            info.appendChild(
                name
            );

            info.appendChild(
                status
            );


            const timeoutButton =
                document.createElement(
                    "button"
                );

            timeoutButton.type =
                "button";

            timeoutButton.className =
                "user-timeout-button";

            timeoutButton.textContent =
                "Timeout";


            timeoutButton.addEventListener(
                "click",
                function () {
                    openTimeoutModal(
                        user
                    );
                }
            );


            row.appendChild(
                avatar
            );

            row.appendChild(
                info
            );

            row.appendChild(
                timeoutButton
            );


            activeUsersList.appendChild(
                row
            );
        }
    );
}


// ============================================================
// REFRESH
// ============================================================

async function refreshModeration() {
    try {
        const results =
            await Promise.all([
                moderationGet(
                    "/sr/bans"
                ),

                moderationGet(
                    "/sr/active-users"
                )
            ]);


        const bansData =
            results[0];

        const activeData =
            results[1];


        applyModerationData(
            bansData
        );


        moderationState.activeUsers =
            Array.isArray(
                activeData.users
            )
                ? activeData.users
                : (
                    Array.isArray(
                        activeData.activeUsers
                    )
                        ? activeData.activeUsers
                        : []
                );


        renderBannedUsers();
        renderTimeouts();
        renderBannedSongs();
        renderActiveUsers();

    } catch (error) {
        console.error(
            "Nie udało się odświeżyć moderacji:",
            error
        );
    }
}


// ============================================================
// UNBAN USER
// ============================================================

async function unbanUser(
    userId
) {
    if (!userId) {
        return;
    }

    try {
        await moderationPost(
            "/sr/unban-user",
            {
                userId: userId
            }
        );


        showNotification(
            "Użytkownik został odblokowany."
        );


        await refreshModeration();

    } catch (error) {
        console.error(
            "Nie udało się odblokować użytkownika:",
            error
        );


        showNotification(
            "Nie udało się odblokować użytkownika.",
            true
        );
    }
}


// ============================================================
// REMOVE TIMEOUT
// ============================================================

async function removeTimeout(
    userId
) {
    if (!userId) {
        return;
    }

    try {
        await moderationPost(
            "/sr/remove-timeout",
            {
                userId: userId
            }
        );


        showNotification(
            "Timeout został usunięty."
        );


        await refreshModeration();

    } catch (error) {
        console.error(
            "Nie udało się usunąć timeoutu:",
            error
        );


        showNotification(
            "Nie udało się usunąć timeoutu.",
            true
        );
    }
}


// ============================================================
// UNBAN SONG
// ============================================================

async function unbanSong(
    songId
) {
    if (!songId) {
        return;
    }

    try {
        await moderationPost(
            "/sr/unban-song",
            {
                songId: songId
            }
        );


        showNotification(
            "Utwór został odblokowany."
        );


        await refreshModeration();

    } catch (error) {
        console.error(
            "Nie udało się odblokować utworu:",
            error
        );


        showNotification(
            "Nie udało się odblokować utworu.",
            true
        );
    }
}


// ============================================================
// OPEN / CLOSE BANS
// ============================================================

function openBansModal() {
    if (!bansModal) {
        return;
    }

    bansModal.classList.add(
        "open"
    );

    document.body.style.overflow =
        "hidden";

    refreshModeration();
}


function closeBansModal() {
    if (!bansModal) {
        return;
    }

    bansModal.classList.remove(
        "open"
    );

    document.body.style.overflow =
        "";
}


// ============================================================
// TABS
// ============================================================

function switchBanTab(tabName) {
    const tabs = {
        users: {
            button:
                banTabUsers,
            panel:
                banPanelUsers
        },

        timeouts: {
            button:
                banTabTimeouts,
            panel:
                banPanelTimeouts
        },

        songs: {
            button:
                banTabSongs,
            panel:
                banPanelSongs
        }
    };


    Object.entries(
        tabs
    ).forEach(
        function ([name, elements]) {
            if (
                elements.button
            ) {
                elements.button.classList.toggle(
                    "active",
                    name === tabName
                );
            }

            if (
                elements.panel
            ) {
                elements.panel.classList.toggle(
                    "active",
                    name === tabName
                );
            }
        }
    );
}


// ============================================================
// TIMEOUT MODAL
// ============================================================

function openTimeoutModal(user) {
    if (!timeoutModal) {
        return;
    }


    moderationState.selectedUser =
        user;


    moderationState.selectedTimeoutMinutes =
        10;


    const userId =
        getUserId(
            user
        );


    const userName =
        getUserName(
            user
        );


    if (timeoutUserName) {
        timeoutUserName.textContent =
            userName;
    }


    if (timeoutUserAvatar) {
        timeoutUserAvatar.textContent =
            getUserAvatarLetter(
                user
            );
    }


    if (moderationUserId) {
        moderationUserId.value =
            userId;
    }


    if (moderationDuration) {
        moderationDuration.value =
            "10";
    }


    if (moderationReason) {
        moderationReason.value =
            "";
    }


    setModerationMessage(
        ""
    );


    timeoutOptions.forEach(
        function (button) {
            const minutes =
                Number(
                    button.dataset.minutes
                );

            button.classList.toggle(
                "active",
                minutes === 10
            );
        }
    );


    timeoutModal.classList.add(
        "open"
    );

    document.body.style.overflow =
        "hidden";
}


function closeTimeoutModal() {
    if (!timeoutModal) {
        return;
    }


    timeoutModal.classList.remove(
        "open"
    );


    moderationState.selectedUser =
        null;


    document.body.style.overflow =
        "";


    setModerationMessage(
        ""
    );
}


// ============================================================
// APPLY TIMEOUT
// ============================================================

async function applyTimeout(
    minutes
) {
    const user =
        moderationState.selectedUser;


    if (!user) {
        return;
    }


    const userId =
        getUserId(
            user
        );


    if (!userId) {
        return;
    }


    const reason =
        moderationReason
            ? moderationReason.value.trim()
            : "";


    setModerationMessage(
        "Nakładanie timeoutu..."
    );


    try {
        const result =
            await moderationPost(
                "/sr/timeout-user",
                {
                    userId: userId,
                    minutes: minutes,
                    reason: reason
                }
            );


        if (
            result.success === false
        ) {
            throw new Error(
                result.error ||
                "Nie udało się nałożyć timeoutu."
            );
        }


        showNotification(
            `Timeout: ${minutes} min.`
        );


        closeTimeoutModal();


        await refreshModeration();

    } catch (error) {
        console.error(
            "Nie udało się nałożyć timeoutu:",
            error
        );


        setModerationMessage(
            "Nie udało się nałożyć timeoutu.",
            true
        );
    }
}


// ============================================================
// BAN USER
// ============================================================

async function banSelectedUser() {
    const user =
        moderationState.selectedUser;


    if (!user) {
        return;
    }


    const userId =
        getUserId(
            user
        );


    if (!userId) {
        return;
    }


    const reason =
        moderationReason
            ? moderationReason.value.trim()
            : "";


    const confirmed =
        confirm(
            `Zbanować użytkownika:\n\n${getUserName(user)}?`
        );


    if (!confirmed) {
        return;
    }


    setModerationMessage(
        "Banowanie użytkownika..."
    );


    try {
        const result =
            await moderationPost(
                "/sr/ban-user",
                {
                    userId: userId,
                    reason: reason
                }
            );


        if (
            result.success === false
        ) {
            throw new Error(
                result.error ||
                "Nie udało się zbanować użytkownika."
            );
        }


        showNotification(
            "Użytkownik został zbanowany."
        );


        closeTimeoutModal();


        await refreshModeration();

    } catch (error) {
        console.error(
            "Nie udało się zbanować użytkownika:",
            error
        );


        setModerationMessage(
            "Nie udało się zbanować użytkownika.",
            true
        );
    }
}


// ============================================================
// EVENTS — BANS MODAL
// ============================================================

if (manageBansButton) {
    manageBansButton.addEventListener(
        "click",
        openBansModal
    );
}


if (bansModalClose) {
    bansModalClose.addEventListener(
        "click",
        closeBansModal
    );
}


if (bansModal) {
    bansModal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                bansModal
            ) {
                closeBansModal();
            }
        }
    );
}


// ============================================================
// EVENTS — TABS
// ============================================================

if (banTabUsers) {
    banTabUsers.addEventListener(
        "click",
        function () {
            switchBanTab(
                "users"
            );
        }
    );
}


if (banTabTimeouts) {
    banTabTimeouts.addEventListener(
        "click",
        function () {
            switchBanTab(
                "timeouts"
            );
        }
    );
}


if (banTabSongs) {
    banTabSongs.addEventListener(
        "click",
        function () {
            switchBanTab(
                "songs"
            );
        }
    );
}


// ============================================================
// EVENTS — SEARCH
// ============================================================

if (bannedUsersSearch) {
    bannedUsersSearch.addEventListener(
        "input",
        renderBannedUsers
    );
}


if (timeoutsSearch) {
    timeoutsSearch.addEventListener(
        "input",
        renderTimeouts
    );
}


if (bannedSongsSearch) {
    bannedSongsSearch.addEventListener(
        "input",
        renderBannedSongs
    );
}


if (activeUsersSearch) {
    activeUsersSearch.addEventListener(
        "input",
        renderActiveUsers
    );
}


// ============================================================
// EVENTS — TIMEOUT
// ============================================================

if (timeoutModalClose) {
    timeoutModalClose.addEventListener(
        "click",
        closeTimeoutModal
    );
}


if (timeoutModal) {
    timeoutModal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                timeoutModal
            ) {
                closeTimeoutModal();
            }
        }
    );
}


timeoutOptions.forEach(
    function (button) {
        button.addEventListener(
            "click",
            async function () {
                const minutes =
                    Number(
                        button.dataset.minutes
                    );


                if (
                    !Number.isInteger(minutes) ||
                    minutes < 1
                ) {
                    return;
                }


                moderationState.selectedTimeoutMinutes =
                    minutes;


                if (moderationDuration) {
                    moderationDuration.value =
                        String(
                            minutes
                        );
                }


                timeoutOptions.forEach(
                    function (option) {
                        option.classList.toggle(
                            "active",
                            option === button
                        );
                    }
                );


                await applyTimeout(
                    minutes
                );
            }
        );
    }
);


if (timeoutBanUserButton) {
    timeoutBanUserButton.addEventListener(
        "click",
        banSelectedUser
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
            timeoutModal &&
            timeoutModal.classList.contains(
                "open"
            )
        ) {
            closeTimeoutModal();

            return;
        }


        if (
            bansModal &&
            bansModal.classList.contains(
                "open"
            )
        ) {
            closeBansModal();
        }
    }
);


// ============================================================
// INITIALIZE
// ============================================================

switchBanTab(
    "users"
);


refreshModeration();


setInterval(
    refreshModeration,
    5000
);
