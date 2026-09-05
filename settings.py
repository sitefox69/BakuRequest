import json
import os


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

SETTINGS_FILE = os.path.join(
    BASE_DIR,
    "settings.json"
)


DEFAULT_SETTINGS = {
    "maxSongLengthSeconds": 600,
    "maxSongsPerUser": 3
}


def normalize_settings(data):
    if not isinstance(data, dict):
        data = {}

    settings = dict(
        DEFAULT_SETTINGS
    )

    # Maksymalna długość utworu
    try:
        max_song_length = int(
            data.get(
                "maxSongLengthSeconds",
                DEFAULT_SETTINGS[
                    "maxSongLengthSeconds"
                ]
            )
        )

        if max_song_length < 1:
            max_song_length = (
                DEFAULT_SETTINGS[
                    "maxSongLengthSeconds"
                ]
            )

    except (
        TypeError,
        ValueError
    ):
        max_song_length = (
            DEFAULT_SETTINGS[
                "maxSongLengthSeconds"
            ]
        )

    settings[
        "maxSongLengthSeconds"
    ] = max_song_length

    # Maksymalna liczba oczekujących
    # utworów na użytkownika
    try:
        max_songs_per_user = int(
            data.get(
                "maxSongsPerUser",
                DEFAULT_SETTINGS[
                    "maxSongsPerUser"
                ]
            )
        )

        if max_songs_per_user < 1:
            max_songs_per_user = (
                DEFAULT_SETTINGS[
                    "maxSongsPerUser"
                ]
            )

    except (
        TypeError,
        ValueError
    ):
        max_songs_per_user = (
            DEFAULT_SETTINGS[
                "maxSongsPerUser"
            ]
        )

    settings[
        "maxSongsPerUser"
    ] = max_songs_per_user

    return settings


def save_settings(settings):
    settings = normalize_settings(
        settings
    )

    with open(
        SETTINGS_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            settings,
            file,
            ensure_ascii=False,
            indent=2
        )

    return settings


def load_settings():
    if not os.path.exists(
        SETTINGS_FILE
    ):
        return save_settings(
            DEFAULT_SETTINGS
        )

    try:
        with open(
            SETTINGS_FILE,
            "r",
            encoding="utf-8"
        ) as file:
            data = json.load(
                file
            )

    except (
        json.JSONDecodeError,
        OSError
    ):
        return save_settings(
            DEFAULT_SETTINGS
        )

    settings = normalize_settings(
        data
    )

    if settings != data:
        save_settings(
            settings
        )

    return settings


def get_settings():
    return load_settings()


def update_settings(
    max_song_length_seconds=None,
    max_songs_per_user=None
):
    settings = load_settings()

    if max_song_length_seconds is not None:
        try:
            value = int(
                max_song_length_seconds
            )

        except (
            TypeError,
            ValueError
        ):
            return {
                "success": False,
                "error": "invalid_max_song_length"
            }

        if value < 1:
            return {
                "success": False,
                "error": "invalid_max_song_length"
            }

        settings[
            "maxSongLengthSeconds"
        ] = value

    if max_songs_per_user is not None:
        try:
            value = int(
                max_songs_per_user
            )

        except (
            TypeError,
            ValueError
        ):
            return {
                "success": False,
                "error": "invalid_max_songs_per_user"
            }

        if value < 1:
            return {
                "success": False,
                "error": "invalid_max_songs_per_user"
            }

        settings[
            "maxSongsPerUser"
        ] = value

    settings = save_settings(
        settings
    )

    return {
        "success": True,
        "settings": settings
    }


if __name__ == "__main__":
    settings = get_settings()

    print()
    print("==============================")
    print("        USTAWIENIA SR")
    print("==============================")
    print(
        "Maksymalna długość:",
        settings[
            "maxSongLengthSeconds"
        ],
        "sekund"
    )
    print(
        "Limit na użytkownika:",
        settings[
            "maxSongsPerUser"
        ]
    )
    print("==============================")
    print()
