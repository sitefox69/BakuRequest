import json
import os
import time


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODERATION_FILE = os.path.join(BASE_DIR, "moderation.json")


def load_data():
    if not os.path.exists(MODERATION_FILE):
        return {
            "bannedUsers": [],
            "timeouts": [],
            "bannedSongs": []
        }

    try:
        with open(
            MODERATION_FILE,
            "r",
            encoding="utf-8"
        ) as file:
            data = json.load(file)

    except (json.JSONDecodeError, OSError):
        return {
            "bannedUsers": [],
            "timeouts": [],
            "bannedSongs": []
        }

    data.setdefault("bannedUsers", [])
    data.setdefault("timeouts", [])
    data.setdefault("bannedSongs", [])

    return data


def save_data(data):
    with open(
        MODERATION_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )


def ban_user(user_id, reason=""):
    user_id = str(user_id).strip()

    if not user_id:
        return {
            "success": False,
            "error": "missing_user_id"
        }

    data = load_data()

    if user_id in data["bannedUsers"]:
        return {
            "success": False,
            "error": "already_banned"
        }

    data["bannedUsers"].append(user_id)

    # Pełny ban usuwa ewentualny timeout.
    data["timeouts"] = [
        item
        for item in data["timeouts"]
        if item.get("userId") != user_id
    ]

    save_data(data)

    return {
        "success": True,
        "userId": user_id,
        "reason": reason
    }


def unban_user(user_id):
    user_id = str(user_id).strip()

    data = load_data()

    if user_id not in data["bannedUsers"]:
        return {
            "success": False,
            "error": "not_banned"
        }

    data["bannedUsers"] = [
        item
        for item in data["bannedUsers"]
        if item != user_id
    ]

    save_data(data)

    return {
        "success": True,
        "userId": user_id
    }


def timeout_user(
    user_id,
    duration_minutes,
    reason=""
):
    user_id = str(user_id).strip()

    if not user_id:
        return {
            "success": False,
            "error": "missing_user_id"
        }

    try:
        duration_minutes = int(duration_minutes)
    except (TypeError, ValueError):
        return {
            "success": False,
            "error": "invalid_duration"
        }

    allowed_durations = [
        1,
        5,
        10,
        30,
        60,
        1440
    ]

    if duration_minutes not in allowed_durations:
        return {
            "success": False,
            "error": "invalid_duration",
            "allowedDurations": allowed_durations
        }

    data = load_data()

    # Nie pozwalamy tworzyć timeoutu dla permanentnie zbanowanego użytkownika.
    if user_id in data["bannedUsers"]:
        return {
            "success": False,
            "error": "user_already_banned"
        }

    expires_at = int(
        time.time() + duration_minutes * 60
    )

    timeout = {
        "userId": user_id,
        "expiresAt": expires_at,
        "durationMinutes": duration_minutes,
        "reason": reason
    }

    data["timeouts"] = [
        item
        for item in data["timeouts"]
        if item.get("userId") != user_id
    ]

    data["timeouts"].append(timeout)

    save_data(data)

    return {
        "success": True,
        "timeout": timeout
    }


def remove_timeout(user_id):
    user_id = str(user_id).strip()

    data = load_data()

    original_count = len(data["timeouts"])

    data["timeouts"] = [
        item
        for item in data["timeouts"]
        if item.get("userId") != user_id
    ]

    removed = (
        len(data["timeouts"]) != original_count
    )

    save_data(data)

    if not removed:
        return {
            "success": False,
            "error": "timeout_not_found"
        }

    return {
        "success": True,
        "userId": user_id
    }


def is_user_banned(user_id):
    user_id = str(user_id).strip()

    data = load_data()

    return user_id in data["bannedUsers"]


def is_user_timed_out(user_id):
    user_id = str(user_id).strip()

    data = load_data()

    now = int(time.time())
    active_timeouts = []
    active_timeout = None

    for item in data["timeouts"]:

        if item.get("expiresAt", 0) > now:

            active_timeouts.append(item)

            if item.get("userId") == user_id:
                active_timeout = item

    # Automatyczne usuwanie wygasłych timeoutów.
    if len(active_timeouts) != len(data["timeouts"]):
        data["timeouts"] = active_timeouts
        save_data(data)

    return active_timeout is not None


def get_banned_users():
    data = load_data()

    return data["bannedUsers"]


def get_timeouts():
    data = load_data()

    now = int(time.time())

    active_timeouts = [
        item
        for item in data["timeouts"]
        if item.get("expiresAt", 0) > now
    ]

    if len(active_timeouts) != len(data["timeouts"]):
        data["timeouts"] = active_timeouts
        save_data(data)

    return active_timeouts


def ban_song(song_id, reason=""):
    song_id = str(song_id).strip()

    if not song_id:
        return {
            "success": False,
            "error": "missing_song_id"
        }

    data = load_data()

    if song_id in data["bannedSongs"]:
        return {
            "success": False,
            "error": "song_already_banned"
        }

    data["bannedSongs"].append(song_id)

    save_data(data)

    return {
        "success": True,
        "songId": song_id,
        "reason": reason
    }


def unban_song(song_id):
    song_id = str(song_id).strip()

    data = load_data()

    if song_id not in data["bannedSongs"]:
        return {
            "success": False,
            "error": "song_not_banned"
        }

    data["bannedSongs"] = [
        item
        for item in data["bannedSongs"]
        if item != song_id
    ]

    save_data(data)

    return {
        "success": True,
        "songId": song_id
    }


def is_song_banned(song_id):
    song_id = str(song_id).strip()

    data = load_data()

    return song_id in data["bannedSongs"]


def get_banned_songs():
    data = load_data()

    return data["bannedSongs"]


if __name__ == "__main__":

    data = load_data()

    print()
    print("==============================")
    print("         MODERATION")
    print("==============================")
    print(
        "Zbanowani użytkownicy:",
        len(data["bannedUsers"])
    )
    print(
        "Aktywne timeouty:",
        len(get_timeouts())
    )
    print(
        "Zbanowane utwory:",
        len(data["bannedSongs"])
    )
    print("==============================")
    print()
