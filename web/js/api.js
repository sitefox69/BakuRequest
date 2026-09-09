const API_BASE = "http://127.0.0.1:8787";

async function apiRequest(path, options = {}) {
    const response = await fetch(
        API_BASE + path,
        {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        }
    );

    let data;

    try {
        data = await response.json();
    } catch (error) {
        throw new Error("Serwer zwrócił nieprawidłową odpowiedź.");
    }

    if (!response.ok || data.success === false) {
        throw new Error(
            data.error || `HTTP ${response.status}`
        );
    }

    return data;
}

async function getCurrentSong() {
    return apiRequest("/sr/current");
}

async function playSong() {
    return apiRequest(
        "/sr/play",
        {
            method: "POST"
        }
    );
}

async function pauseSong() {
    return apiRequest(
        "/sr/pause",
        {
            method: "POST"
        }
    );
}

async function previousSong() {
    return apiRequest(
        "/sr/previous",
        {
            method: "POST"
        }
    );
}

async function skipSong() {
    return apiRequest(
        "/sr/skip",
        {
            method: "POST"
        }
    );
}

async function getQueue() {
    return apiRequest("/sr/queue");
}

async function requestSong(songId, addedBy) {
    return apiRequest(
        "/sr/request",
        {
            method: "POST",
            body: JSON.stringify({
                songId,
                addedBy
            })
        }
    );
}

async function removeQueueSong(songId) {
    return apiRequest(
        "/sr/queue/remove",
        {
            method: "POST",
            body: JSON.stringify({
                songId
            })
        }
    );
}

async function voteSkip(userId) {
    return apiRequest(
        "/sr/voteskip",
        {
            method: "POST",
            body: JSON.stringify({
                userId
            })
        }
    );
}

async function getVoteSkipStatus() {
    return apiRequest("/sr/voteskip");
}

async function getModeration() {
    return apiRequest("/sr/bans");
}

async function banUser(userId, reason = "") {
    return apiRequest(
        "/sr/ban-user",
        {
            method: "POST",
            body: JSON.stringify({
                userId,
                reason
            })
        }
    );
}

async function unbanUser(userId) {
    return apiRequest(
        "/sr/unban-user",
        {
            method: "POST",
            body: JSON.stringify({
                userId
            })
        }
    );
}

async function timeoutUser(
    userId,
    durationMinutes,
    reason = "",
    ban = false
) {
    return apiRequest(
        "/sr/timeout",
        {
            method: "POST",
            body: JSON.stringify({
                userId,
                durationMinutes,
                reason,
                ban
            })
        }
    );
}

async function removeTimeout(userId) {
    return apiRequest(
        "/sr/remove-timeout",
        {
            method: "POST",
            body: JSON.stringify({
                userId
            })
        }
    );
}

async function banSong(songId, reason = "") {
    return apiRequest(
        "/sr/ban-song",
        {
            method: "POST",
            body: JSON.stringify({
                songId,
                reason
            })
        }
    );
}

async function unbanSong(songId) {
    return apiRequest(
        "/sr/unban-song",
        {
            method: "POST",
            body: JSON.stringify({
                songId
            })
        }
    );
}
