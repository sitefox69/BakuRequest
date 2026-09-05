from flask import Flask, jsonify, request, send_from_directory
import json
import os
import socket

from queue import (
    get_queue,
    add_to_queue,
    remove_from_queue,
    remove_user_songs,
    remove_last_user_song,
    clear_queue
)

from library import (
    get_song,
    search_songs
)

from moderation import (
    ban_user,
    unban_user,
    timeout_user,
    remove_timeout,
    get_banned_users,
    get_timeouts,
    ban_song,
    unban_song,
    get_banned_songs,
    is_user_banned,
    is_user_timed_out,
    is_song_banned
)

from active_users import (
    touch_user,
    get_active_users
)

from settings import (
    get_settings,
    update_settings
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "web")

CONTROL_SOCKET = "/tmp/music-engine-control.sock"


app = Flask(
    __name__,
    static_folder=WEB_DIR
)


# =========================
# ENGINE COMMUNICATION
# =========================

def send_engine_command(command, data=None):
    try:
        with socket.socket(
            socket.AF_UNIX,
            socket.SOCK_STREAM
        ) as sock:

            sock.settimeout(3)
            sock.connect(CONTROL_SOCKET)

            request_data = {
                "command": command,
                "data": data or {}
            }

            sock.sendall(
                (
                    json.dumps(
                        request_data
                    )
                    + "\n"
                ).encode()
            )

            response = sock.recv(
                4096
            ).decode()

            if not response:
                return {
                    "success": False,
                    "error": "empty_response"
                }

            return json.loads(
                response
            )

    except Exception as error:
        return {
            "success": False,
            "error": str(error)
        }


# =========================
# HELPERS
# =========================

def normalize_user_name(value):
    return str(
        value or ""
    ).strip().lower()


def count_user_queue_songs(user_name):
    normalized_user = normalize_user_name(
        user_name
    )

    if not normalized_user:
        return 0

    count = 0

    for song in get_queue():
        added_by = normalize_user_name(
            song.get(
                "addedBy",
                ""
            )
        )

        if added_by == normalized_user:
            count += 1

    return count


def moderate_user_music(user_name):
    normalized_user = normalize_user_name(
        user_name
    )

    result = {
        "removedSongs": [],
        "removedCount": 0,
        "skippedCurrentSong": False
    }

    if not normalized_user:
        return result

    current_result = send_engine_command(
        "current"
    )

    current_song = None

    if isinstance(
        current_result,
        dict
    ):
        current_song = current_result.get(
            "song"
        )

        if current_song is None:
            current_song = current_result.get(
                "current"
            )

        if current_song is None:
            current_song = current_result.get(
                "currentSong"
            )

    current_added_by = ""

    if isinstance(
        current_song,
        dict
    ):
        current_added_by = normalize_user_name(
            current_song.get(
                "addedBy",
                ""
            )
        )

    removed_songs = remove_user_songs(
        user_name
    )

    result[
        "removedSongs"
    ] = removed_songs

    result[
        "removedCount"
    ] = len(
        removed_songs
    )

    if (
        current_added_by
        and current_added_by
        == normalized_user
    ):
        skip_result = send_engine_command(
            "skip"
        )

        result[
            "skipResult"
        ] = skip_result

        result[
            "skippedCurrentSong"
        ] = bool(
            isinstance(
                skip_result,
                dict
            )
            and skip_result.get(
                "success"
            )
        )

    return result


# =========================
# BANNED SONG DETAILS
# =========================

def get_banned_song_details():
    banned_song_ids = (
        get_banned_songs()
    )

    results = []

    for song_id in banned_song_ids:
        song_id = str(
            song_id
        ).strip()

        if not song_id:
            continue

        song = get_song(
            song_id
        )

        if song is None:
            results.append({
                "id": song_id,
                "songId": song_id,
                "title": song_id,
                "artist": "",
                "thumbnail": None,
                "foundInLibrary": False
            })

            continue

        results.append({
            "id": song_id,
            "songId": song_id,
            "title": (
                song.get("title")
                or song_id
            ),
            "artist": (
                song.get("artist")
                or ""
            ),
            "thumbnail": song.get(
                "thumbnail"
            ),
            "duration": song.get(
                "duration"
            ),
            "url": song.get(
                "url"
            ),
            "source": song.get(
                "source"
            ),
            "foundInLibrary": True
        })

    return results


# =========================
# WEB
# =========================

@app.get("/")
def index():
    return send_from_directory(
        WEB_DIR,
        "home.html"
    )


@app.get("/admin")
@app.get("/admin/")
def admin():
    return send_from_directory(
        WEB_DIR,
        "index.html"
    )


@app.get("/viewer")
@app.get("/viewer/")
def viewer():
    return send_from_directory(
        WEB_DIR,
        "viewer.html"
    )


@app.get("/css/<path:filename>")
def css(filename):
    return send_from_directory(
        os.path.join(
            WEB_DIR,
            "css"
        ),
        filename
    )


@app.get("/js/<path:filename>")
def javascript(filename):
    return send_from_directory(
        os.path.join(
            WEB_DIR,
            "js"
        ),
        filename
    )


# =========================
# PLAYER
# =========================

@app.get("/sr/current")
def current():
    result = send_engine_command(
        "current"
    )

    return jsonify(
        result
    )


@app.post("/sr/play")
def play():
    result = send_engine_command(
        "resume"
    )

    return jsonify(
        result
    )


@app.post("/sr/pause")
def pause():
    result = send_engine_command(
        "pause"
    )

    return jsonify(
        result
    )


@app.post("/sr/previous")
def previous():
    result = send_engine_command(
        "previous"
    )

    return jsonify(
        result
    )


@app.post("/sr/skip")
def skip():
    result = send_engine_command(
        "skip"
    )

    return jsonify(
        result
    )


# =========================
# LIBRARY / SEARCH
# =========================

@app.get("/sr/search")
def search():
    query = request.args.get(
        "q",
        ""
    ).strip()

    results = search_songs(
        query
    )

    return jsonify({
        "success": True,
        "query": query,
        "results": results
    })


# =========================
# SETTINGS
# =========================

@app.get("/sr/settings")
def api_get_settings():
    settings = get_settings()

    return jsonify({
        "success": True,
        "settings": settings
    })


@app.post("/sr/settings")
def api_update_settings():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    if (
        "maxSongLengthSeconds" not in data
        and "maxSongsPerUser" not in data
    ):
        return jsonify({
            "success": False,
            "error": "missing_settings"
        }), 400

    result = update_settings(
        max_song_length_seconds=(
            data.get(
                "maxSongLengthSeconds"
            )
            if "maxSongLengthSeconds" in data
            else None
        ),
        max_songs_per_user=(
            data.get(
                "maxSongsPerUser"
            )
            if "maxSongsPerUser" in data
            else None
        )
    )

    if not result.get(
        "success"
    ):
        return jsonify(
            result
        ), 400

    return jsonify(
        result
    )


# =========================
# ACTIVE USERS
# =========================

@app.get("/sr/active-users")
def active_users():
    users = get_active_users()

    return jsonify({
        "success": True,
        "users": users,
        "count": len(users)
    })


# =========================
# QUEUE
# =========================

@app.get("/sr/queue")
def queue():
    return jsonify({
        "success": True,
        "queue": get_queue()
    })


@app.post("/sr/queue/clear")
def api_clear_queue():
    queue_before = get_queue()

    removed_count = len(
        queue_before
    )

    clear_queue()

    return jsonify({
        "success": True,
        "removedCount": removed_count,
        "queue": get_queue()
    })


@app.post("/sr/queue/remove")
def remove_queue_song():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    song_id = str(
        data.get(
            "songId",
            ""
        )
    ).strip()

    if not song_id:
        return jsonify({
            "success": False,
            "error": "missing_song_id"
        }), 400

    removed = remove_from_queue(
        song_id
    )

    if not removed:
        return jsonify({
            "success": False,
            "error": "song_not_in_queue"
        }), 404

    return jsonify({
        "success": True,
        "songId": song_id,
        "queue": get_queue()
    })


# =========================
# WRONG SONG
# =========================

@app.post("/sr/wrong-song")
def wrong_song():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    user_id = str(
        data.get(
            "userId",
            ""
        )
    ).strip()

    if not user_id:
        return jsonify({
            "success": False,
            "error": "missing_user_id"
        }), 400

    removed_song = remove_last_user_song(
        user_id
    )

    if removed_song is None:
        return jsonify({
            "success": False,
            "error": "no_user_song_in_queue",
            "userId": user_id
        }), 404

    return jsonify({
        "success": True,
        "userId": user_id,
        "removedSong": removed_song,
        "queue": get_queue()
    })


@app.post("/sr/request")
def request_song():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    song_id = str(
        data.get(
            "songId",
            ""
        )
    ).strip()

    added_by = str(
        data.get(
            "addedBy",
            "viewer"
        )
    ).strip()

    if not song_id:
        return jsonify({
            "success": False,
            "error": "missing_song_id"
        }), 400

    if not added_by:
        added_by = "viewer"

    if is_user_banned(
        added_by
    ):
        return jsonify({
            "success": False,
            "error": "user_banned"
        }), 403

    if is_user_timed_out(
        added_by
    ):
        return jsonify({
            "success": False,
            "error": "user_timed_out"
        }), 403

    song = get_song(
        song_id
    )

    if song is None:
        return jsonify({
            "success": False,
            "error": "song_not_found"
        }), 404

    if is_song_banned(
        song_id
    ):
        return jsonify({
            "success": False,
            "error": "song_banned"
        }), 403

    settings = get_settings()

    max_song_length = int(
        settings.get(
            "maxSongLengthSeconds",
            600
        )
    )

    max_songs_per_user = int(
        settings.get(
            "maxSongsPerUser",
            3
        )
    )

    duration = song.get(
        "duration"
    )

    try:
        duration = int(
            duration
        )

    except (
        TypeError,
        ValueError
    ):
        return jsonify({
            "success": False,
            "error": "song_duration_unknown",
            "songId": song_id
        }), 400

    if duration > max_song_length:
        return jsonify({
            "success": False,
            "error": "song_too_long",
            "duration": duration,
            "maxSongLengthSeconds": (
                max_song_length
            )
        }), 400

    user_queue_count = (
        count_user_queue_songs(
            added_by
        )
    )

    if (
        user_queue_count
        >= max_songs_per_user
    ):
        return jsonify({
            "success": False,
            "error": "user_song_limit_reached",
            "currentSongs": user_queue_count,
            "maxSongsPerUser": (
                max_songs_per_user
            )
        }), 400

    song = dict(
        song
    )

    song["addedBy"] = (
        added_by
    )

    queue_data = add_to_queue(
        song
    )

    touch_user(
        added_by
    )

    return jsonify({
        "success": True,
        "song": song,
        "queue": queue_data
    })


# =========================
# VOTESKIP
# =========================

@app.post("/sr/voteskip")
def voteskip():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    user_id = str(
        data.get(
            "userId",
            ""
        )
    ).strip()

    if not user_id:
        return jsonify({
            "success": False,
            "error": "missing_user_id"
        }), 400

    if is_user_banned(
        user_id
    ):
        return jsonify({
            "success": False,
            "error": "user_banned"
        }), 403

    if is_user_timed_out(
        user_id
    ):
        return jsonify({
            "success": False,
            "error": "user_timed_out"
        }), 403

    touch_user(
        user_id
    )

    result = send_engine_command(
        "voteskip",
        {
            "userId": user_id
        }
    )

    return jsonify(
        result
    )


@app.get("/sr/voteskip")
def voteskip_status():
    result = send_engine_command(
        "voteskip_status"
    )

    return jsonify(
        result
    )


@app.post("/sr/voteskip/settings")
def voteskip_settings():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    command_data = {}

    if "enabled" in data:
        command_data[
            "enabled"
        ] = data.get(
            "enabled"
        )

    if "threshold" in data:
        command_data[
            "threshold"
        ] = data.get(
            "threshold"
        )

    if not command_data:
        return jsonify({
            "success": False,
            "error": "missing_settings"
        }), 400

    result = send_engine_command(
        "voteskip_settings",
        command_data
    )

    if not result.get(
        "success"
    ):
        return jsonify(
            result
        ), 400

    return jsonify(
        result
    )


@app.post("/sr/voteskip/reset")
def voteskip_reset():
    result = send_engine_command(
        "voteskip_reset"
    )

    if not result.get(
        "success"
    ):
        return jsonify(
            result
        ), 400

    return jsonify(
        result
    )


# =========================
# MODERATION — USERS
# =========================

@app.post("/sr/ban-user")
def api_ban_user():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    user_id = str(
        data.get(
            "userId",
            ""
        )
    ).strip()

    reason = str(
        data.get(
            "reason",
            ""
        )
    ).strip()

    result = ban_user(
        user_id,
        reason
    )

    if not result.get(
        "success"
    ):
        return jsonify(
            result
        ), 400

    music_result = moderate_user_music(
        user_id
    )

    result[
        "musicModeration"
    ] = music_result

    return jsonify(
        result
    )


@app.post("/sr/unban-user")
def api_unban_user():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    user_id = str(
        data.get(
            "userId",
            ""
        )
    ).strip()

    result = unban_user(
        user_id
    )

    if not result.get(
        "success"
    ):
        return jsonify(
            result
        ), 404

    return jsonify(
        result
    )


# =========================
# MODERATION — TIMEOUT
# =========================

@app.post("/sr/timeout")
@app.post("/sr/timeout-user")
def api_timeout():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    user_id = str(
        data.get(
            "userId",
            ""
        )
    ).strip()

    duration_minutes = (
        data.get(
            "durationMinutes"
        )
    )

    if duration_minutes is None:
        duration_minutes = (
            data.get(
                "duration"
            )
        )

    if duration_minutes is None:
        duration_minutes = (
            data.get(
                "minutes"
            )
        )

    reason = str(
        data.get(
            "reason",
            ""
        )
    ).strip()

    result = timeout_user(
        user_id,
        duration_minutes,
        reason
    )

    if not result.get(
        "success"
    ):
        return jsonify(
            result
        ), 400

    if data.get(
        "ban"
    ) is True:
        ban_result = ban_user(
            user_id,
            reason
        )

        result[
            "ban"
        ] = ban_result

    music_result = moderate_user_music(
        user_id
    )

    result[
        "musicModeration"
    ] = music_result

    return jsonify(
        result
    )


@app.post("/sr/remove-timeout")
def api_remove_timeout():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    user_id = str(
        data.get(
            "userId",
            ""
        )
    ).strip()

    result = remove_timeout(
        user_id
    )

    if not result.get(
        "success"
    ):
        return jsonify(
            result
        ), 404

    return jsonify(
        result
    )


# =========================
# MODERATION — LISTS
# =========================

@app.get("/sr/bans")
def bans():
    return jsonify({
        "success": True,
        "bannedUsers": (
            get_banned_users()
        ),
        "timeouts": (
            get_timeouts()
        ),
        "bannedSongs": (
            get_banned_song_details()
        )
    })


# =========================
# MODERATION — SONGS
# =========================

@app.post("/sr/ban-song")
def api_ban_song():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    song_id = str(
        data.get(
            "songId",
            ""
        )
    ).strip()

    reason = str(
        data.get(
            "reason",
            ""
        )
    ).strip()

    if not song_id:
        return jsonify({
            "success": False,
            "error": "missing_song_id"
        }), 400

    song = get_song(
        song_id
    )

    result = ban_song(
        song_id,
        reason
    )

    if not result.get(
        "success"
    ):
        return jsonify(
            result
        ), 400

    removed = remove_from_queue(
        song_id
    )

    result[
        "removedFromQueue"
    ] = removed

    if song is not None:
        result["song"] = {
            "id": song_id,
            "songId": song_id,
            "title": (
                song.get(
                    "title"
                )
                or song_id
            ),
            "artist": (
                song.get(
                    "artist"
                )
                or ""
            ),
            "thumbnail": (
                song.get(
                    "thumbnail"
                )
            )
        }

    else:
        result["song"] = {
            "id": song_id,
            "songId": song_id,
            "title": song_id,
            "artist": "",
            "thumbnail": None
        }

    return jsonify(
        result
    )


@app.post("/sr/unban-song")
def api_unban_song():
    data = (
        request.get_json(
            silent=True
        )
        or {}
    )

    song_id = str(
        data.get(
            "songId",
            ""
        )
    ).strip()

    if not song_id:
        return jsonify({
            "success": False,
            "error": "missing_song_id"
        }), 400

    result = unban_song(
        song_id
    )

    if not result.get(
        "success"
    ):
        return jsonify(
            result
        ), 404

    return jsonify(
        result
    )


# =========================
# START SERVER
# =========================

if __name__ == "__main__":
    print()
    print("==============================")
    print("       BAKUREQUEST API")
    print("==============================")
    print()
    print("Strona główna:")
    print("http://127.0.0.1:8787/")
    print()
    print("Panel admina:")
    print("http://127.0.0.1:8787/admin")
    print()
    print("Panel widza:")
    print("http://127.0.0.1:8787/viewer")
    print()
    print("API:")
    print("http://127.0.0.1:8787/sr/")
    print("==============================")
    print()

    app.run(
        host="127.0.0.1",
        port=8787,
        debug=False
    )
