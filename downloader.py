import json
import os
import sys

import yt_dlp


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MUSIC_DIR = os.path.join(
    BASE_DIR,
    "music"
)

LIBRARY_FILE = os.path.join(
    BASE_DIR,
    "library.json"
)

os.makedirs(
    MUSIC_DIR,
    exist_ok=True
)


def load_library():
    if not os.path.exists(LIBRARY_FILE):
        return {
            "songs": []
        }

    try:
        with open(
            LIBRARY_FILE,
            "r",
            encoding="utf-8"
        ) as file:
            return json.load(file)

    except (
        json.JSONDecodeError,
        OSError
    ):
        return {
            "songs": []
        }


def save_library(library):
    with open(
        LIBRARY_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            library,
            file,
            ensure_ascii=False,
            indent=2
        )


def download_song(
    url,
    added_by="test"
):

    options = {
        "format": "bestaudio/best",

        "outtmpl": os.path.join(
            MUSIC_DIR,
            "%(id)s.%(ext)s"
        ),

        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192"
            }
        ],

        "noplaylist": True,
    }

    with yt_dlp.YoutubeDL(options) as ydl:

        info = ydl.extract_info(
            url,
            download=True
        )

    song_id = info.get("id")

    song = {
        "id": song_id,
        "title": (
            info.get("title")
            or "Nieznany tytuł"
        ),
        "artist": (
            info.get("artist")
            or info.get("uploader")
            or info.get("channel")
            or "Nieznany wykonawca"
        ),
        "duration": info.get(
            "duration"
        ),
        "file": (
            f"music/{song_id}.mp3"
        ),
        "thumbnail": info.get(
            "thumbnail"
        ),
        "source": "youtube",
        "url": (
            info.get("webpage_url")
            or url
        ),
        "addedBy": added_by
    }

    library = load_library()

    library["songs"] = [
        item
        for item in library["songs"]
        if item.get("id") != song_id
    ]

    library["songs"].append(song)

    save_library(library)

    print()
    print("==============================")
    print("       UTWÓR DODANY")
    print("==============================")
    print(
        "Tytuł:",
        song["title"]
    )
    print(
        "Wykonawca:",
        song["artist"]
    )
    print(
        "ID:",
        song["id"]
    )
    print(
        "MP3:",
        song["file"]
    )
    print(
        "Miniatura:",
        song["thumbnail"]
    )
    print("==============================")
    print()


if __name__ == "__main__":

    if len(sys.argv) < 2:

        print(
            'Użycie: python downloader.py "URL" [DODAŁ]'
        )

        sys.exit(1)

    url = sys.argv[1]

    added_by = (
        sys.argv[2]
        if len(sys.argv) >= 3
        else "test"
    )

    download_song(
        url,
        added_by
    )
