import json
import os


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

LIBRARY_FILE = os.path.join(
    BASE_DIR,
    "library.json"
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


def get_all_songs():
    library = load_library()

    return library.get(
        "songs",
        []
    )


def get_song(song_id):
    songs = get_all_songs()

    for song in songs:
        if song.get("id") == song_id:
            return song

    return None


def add_song(song):
    library = load_library()

    songs = library.get(
        "songs",
        []
    )

    songs = [
        item
        for item in songs
        if item.get("id") != song.get("id")
    ]

    songs.append(song)

    library["songs"] = songs

    save_library(library)


def remove_song(song_id):
    library = load_library()

    songs = library.get(
        "songs",
        []
    )

    new_songs = [
        song
        for song in songs
        if song.get("id") != song_id
    ]

    if len(new_songs) == len(songs):
        return False

    library["songs"] = new_songs

    save_library(library)

    return True


def search_songs(query):
    query = query.strip().lower()

    if not query:
        return get_all_songs()

    results = []

    for song in get_all_songs():

        title = str(
            song.get("title", "")
        ).lower()

        artist = str(
            song.get("artist", "")
        ).lower()

        if (
            query in title
            or query in artist
        ):
            results.append(song)

    return results


if __name__ == "__main__":

    songs = get_all_songs()

    print()
    print("==============================")
    print("          BIBLIOTEKA")
    print("==============================")

    if not songs:
        print("Biblioteka jest pusta.")

    else:
        for song in songs:
            print(
                f'{song["id"]} | '
                f'{song["title"]} | '
                f'{song["artist"]}'
            )

    print("==============================")
    print(
        f"Liczba utworów: {len(songs)}"
    )
    print()
