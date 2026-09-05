import json
import os
import time


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ACTIVE_USERS_FILE = os.path.join(
    BASE_DIR,
    "active_users.json"
)

ACTIVE_TIME_SECONDS = 30 * 60


def load_data():
    if not os.path.exists(
        ACTIVE_USERS_FILE
    ):
        return {
            "users": []
        }

    try:
        with open(
            ACTIVE_USERS_FILE,
            "r",
            encoding="utf-8"
        ) as file:
            data = json.load(file)

    except (
        json.JSONDecodeError,
        OSError
    ):
        return {
            "users": []
        }

    if not isinstance(data, dict):
        return {
            "users": []
        }

    users = data.get(
        "users",
        []
    )

    if not isinstance(users, list):
        users = []

    return {
        "users": users
    }


def save_data(data):
    with open(
        ACTIVE_USERS_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )


def normalize_user_id(user_id):
    return str(
        user_id or ""
    ).strip()


def cleanup_users():
    data = load_data()

    now = int(
        time.time()
    )

    users = []

    for item in data.get(
        "users",
        []
    ):
        if not isinstance(
            item,
            dict
        ):
            continue

        user_id = normalize_user_id(
            item.get("userId")
        )

        if not user_id:
            continue

        try:
            last_seen = int(
                item.get(
                    "lastSeen",
                    0
                )
            )

        except (
            TypeError,
            ValueError
        ):
            continue

        if (
            now - last_seen
            <= ACTIVE_TIME_SECONDS
        ):
            users.append({
                "userId": user_id,
                "lastSeen": last_seen
            })

    if users != data.get(
        "users",
        []
    ):
        save_data({
            "users": users
        })

    return users


def touch_user(user_id):
    user_id = normalize_user_id(
        user_id
    )

    if not user_id:
        return {
            "success": False,
            "error": "missing_user_id"
        }

    users = cleanup_users()

    now = int(
        time.time()
    )

    found = False

    for item in users:
        if (
            item.get("userId")
            == user_id
        ):
            item["lastSeen"] = now
            found = True
            break

    if not found:
        users.append({
            "userId": user_id,
            "lastSeen": now
        })

    users.sort(
        key=lambda item: item.get(
            "lastSeen",
            0
        ),
        reverse=True
    )

    save_data({
        "users": users
    })

    return {
        "success": True,
        "userId": user_id,
        "lastSeen": now
    }


def get_active_users():
    users = cleanup_users()

    users.sort(
        key=lambda item: item.get(
            "lastSeen",
            0
        ),
        reverse=True
    )

    return users


def remove_user(user_id):
    user_id = normalize_user_id(
        user_id
    )

    if not user_id:
        return False

    data = load_data()

    original_users = data.get(
        "users",
        []
    )

    users = [
        item
        for item in original_users
        if normalize_user_id(
            item.get("userId")
        ) != user_id
    ]

    removed = (
        len(users)
        != len(original_users)
    )

    save_data({
        "users": users
    })

    return removed


def clear_users():
    save_data({
        "users": []
    })


if __name__ == "__main__":
    users = get_active_users()

    print()
    print("==============================")
    print("      ACTIVE USERS")
    print("==============================")

    if not users:
        print(
            "Brak aktywnych użytkowników."
        )

    else:
        for item in users:
            print(
                item.get("userId"),
                "|",
                item.get("lastSeen")
            )

    print("==============================")
    print(
        "Liczba aktywnych:",
        len(users)
    )
    print()
