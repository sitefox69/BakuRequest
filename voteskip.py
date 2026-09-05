import json
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VOTESKIP_FILE = os.path.join(BASE_DIR, "voteskip.json")

DEFAULT_ENABLED = True
DEFAULT_THRESHOLD = 3

MIN_THRESHOLD = 1
MAX_THRESHOLD = 1000


def default_data():
    return {
        "songId": None,
        "votes": [],
        "enabled": DEFAULT_ENABLED,
        "threshold": DEFAULT_THRESHOLD
    }


def normalize_data(data):
    if not isinstance(data, dict):
        data = {}

    song_id = data.get("songId")

    votes = data.get("votes", [])

    if not isinstance(votes, list):
        votes = []

    enabled = data.get(
        "enabled",
        DEFAULT_ENABLED
    )

    enabled = bool(enabled)

    threshold = data.get(
        "threshold",
        DEFAULT_THRESHOLD
    )

    try:
        threshold = int(threshold)
    except (TypeError, ValueError):
        threshold = DEFAULT_THRESHOLD

    threshold = max(
        MIN_THRESHOLD,
        min(MAX_THRESHOLD, threshold)
    )

    return {
        "songId": song_id,
        "votes": votes,
        "enabled": enabled,
        "threshold": threshold
    }


def load_votes():
    if not os.path.exists(VOTESKIP_FILE):
        data = default_data()
        save_votes(data)
        return data

    try:
        with open(
            VOTESKIP_FILE,
            "r",
            encoding="utf-8"
        ) as file:
            raw_data = json.load(file)

    except (json.JSONDecodeError, OSError):
        data = default_data()
        save_votes(data)
        return data

    data = normalize_data(raw_data)

    if data != raw_data:
        save_votes(data)

    return data


def save_votes(data):
    data = normalize_data(data)

    with open(
        VOTESKIP_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )


def reset_votes(song_id=None):
    current = load_votes()

    data = {
        "songId": song_id,
        "votes": [],
        "enabled": current.get(
            "enabled",
            DEFAULT_ENABLED
        ),
        "threshold": current.get(
            "threshold",
            DEFAULT_THRESHOLD
        )
    }

    save_votes(data)

    return data


def get_votes(song_id=None):
    data = load_votes()

    if (
        song_id is not None
        and data.get("songId") != song_id
    ):
        return {
            "songId": song_id,
            "votes": [],
            "enabled": data.get(
                "enabled",
                DEFAULT_ENABLED
            ),
            "threshold": data.get(
                "threshold",
                DEFAULT_THRESHOLD
            )
        }

    return data


def add_vote(user_id, song_id):
    user_id = str(user_id).strip()
    song_id = str(song_id).strip()

    if not user_id:
        return {
            "success": False,
            "error": "missing_user_id"
        }

    if not song_id:
        return {
            "success": False,
            "error": "missing_song_id"
        }

    data = load_votes()

    if not data.get("enabled", True):
        return {
            "success": False,
            "error": "voteskip_disabled",
            "songId": song_id,
            "votes": [],
            "enabled": False,
            "threshold": data.get(
                "threshold",
                DEFAULT_THRESHOLD
            )
        }

    if data.get("songId") != song_id:
        data = reset_votes(song_id)

    votes = data.get("votes", [])

    if user_id in votes:
        return {
            "success": False,
            "error": "already_voted",
            "songId": song_id,
            "votes": votes,
            "enabled": data.get(
                "enabled",
                True
            ),
            "threshold": data.get(
                "threshold",
                DEFAULT_THRESHOLD
            )
        }

    votes.append(user_id)

    data["songId"] = song_id
    data["votes"] = votes

    save_votes(data)

    return {
        "success": True,
        "songId": song_id,
        "votes": votes,
        "enabled": data.get(
            "enabled",
            True
        ),
        "threshold": data.get(
            "threshold",
            DEFAULT_THRESHOLD
        )
    }


def remove_vote(user_id):
    user_id = str(user_id).strip()

    data = load_votes()

    votes = data.get("votes", [])

    if user_id not in votes:
        return {
            "success": False,
            "error": "not_voted",
            "songId": data.get("songId"),
            "votes": votes,
            "enabled": data.get(
                "enabled",
                True
            ),
            "threshold": data.get(
                "threshold",
                DEFAULT_THRESHOLD
            )
        }

    votes.remove(user_id)

    data["votes"] = votes

    save_votes(data)

    return {
        "success": True,
        "songId": data.get("songId"),
        "votes": votes,
        "enabled": data.get(
            "enabled",
            True
        ),
        "threshold": data.get(
            "threshold",
            DEFAULT_THRESHOLD
        )
    }


def get_settings():
    data = load_votes()

    return {
        "enabled": data.get(
            "enabled",
            DEFAULT_ENABLED
        ),
        "threshold": data.get(
            "threshold",
            DEFAULT_THRESHOLD
        )
    }


def set_settings(
    enabled=None,
    threshold=None
):
    data = load_votes()

    if enabled is not None:
        if isinstance(enabled, str):
            normalized = enabled.strip().lower()

            if normalized in (
                "true",
                "1",
                "yes",
                "on"
            ):
                enabled = True

            elif normalized in (
                "false",
                "0",
                "no",
                "off"
            ):
                enabled = False

            else:
                return {
                    "success": False,
                    "error": "invalid_enabled"
                }

        data["enabled"] = bool(enabled)

    if threshold is not None:
        try:
            threshold = int(threshold)

        except (TypeError, ValueError):
            return {
                "success": False,
                "error": "invalid_threshold"
            }

        if (
            threshold < MIN_THRESHOLD
            or threshold > MAX_THRESHOLD
        ):
            return {
                "success": False,
                "error": "invalid_threshold",
                "minThreshold": MIN_THRESHOLD,
                "maxThreshold": MAX_THRESHOLD
            }

        data["threshold"] = threshold

    save_votes(data)

    return {
        "success": True,
        "enabled": data["enabled"],
        "threshold": data["threshold"]
    }


def vote_count():
    data = load_votes()

    return len(
        data.get(
            "votes",
            []
        )
    )


if __name__ == "__main__":
    data = load_votes()

    print()
    print("==============================")
    print("          VOTESKIP")
    print("==============================")
    print(
        "Włączony:",
        data.get("enabled")
    )
    print(
        "Próg:",
        data.get("threshold")
    )
    print(
        "Song ID:",
        data.get("songId")
    )
    print(
        "Głosy:",
        len(data.get("votes", []))
    )
    print("==============================")
    print()
