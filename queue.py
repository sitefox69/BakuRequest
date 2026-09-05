import json
import os


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

QUEUE_FILE = os.path.join(
    BASE_DIR,
    "queue.json"
)


def load_queue():
    if not os.path.exists(
        QUEUE_FILE
    ):
        return []

    try:
        with open(
            QUEUE_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(
                file
            )

    except (
        json.JSONDecodeError,
        OSError
    ):
        return []


def save_queue(
    queue
):
    with open(
        QUEUE_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            queue,
            file,
            ensure_ascii=False,
            indent=2
        )


def add_to_queue(
    song
):
    queue = load_queue()

    queue.append(
        song
    )

    save_queue(
        queue
    )

    return queue


def add_to_front(
    song
):
    queue = load_queue()

    queue.insert(
        0,
        song
    )

    save_queue(
        queue
    )

    return queue


def get_queue():
    return load_queue()


def clear_queue():
    save_queue(
        []
    )


def remove_from_queue(
    song_id
):
    queue = load_queue()

    new_queue = [
        song
        for song in queue
        if song.get("id") != song_id
    ]

    removed = (
        len(new_queue)
        != len(queue)
    )

    save_queue(
        new_queue
    )

    return removed


def remove_user_songs(
    user_name
):
    normalized_user = str(
        user_name or ""
    ).strip().lower()

    if not normalized_user:
        return []

    queue = load_queue()

    new_queue = []
    removed_songs = []

    for song in queue:
        added_by = str(
            song.get(
                "addedBy",
                ""
            )
            or ""
        ).strip().lower()

        if added_by == normalized_user:
            removed_songs.append(
                song
            )
        else:
            new_queue.append(
                song
            )

    save_queue(
        new_queue
    )

    return removed_songs


def remove_last_user_song(
    user_name
):
    """
    Wrong Song / !ws

    Usuwa ostatni OCZEKUJĄCY utwór
    dodany przez konkretnego użytkownika.

    Szukanie zaczyna się od końca kolejki,
    dzięki czemu usuwany jest jego
    najnowszy request.

    Nie rusza aktualnie grającego utworu,
    ponieważ current song nie znajduje się
    już w queue.json.

    Porównanie nicku jest case-insensitive.
    """

    normalized_user = str(
        user_name or ""
    ).strip().lower()

    if not normalized_user:
        return None

    queue = load_queue()

    for index in range(
        len(queue) - 1,
        -1,
        -1
    ):
        song = queue[index]

        added_by = str(
            song.get(
                "addedBy",
                ""
            )
            or ""
        ).strip().lower()

        if added_by != normalized_user:
            continue

        removed_song = queue.pop(
            index
        )

        save_queue(
            queue
        )

        return removed_song

    return None


def get_next_song():
    queue = load_queue()

    if not queue:
        return None

    return queue[0]


def pop_next_song():
    queue = load_queue()

    if not queue:
        return None

    song = queue.pop(
        0
    )

    save_queue(
        queue
    )

    return song


if __name__ == "__main__":

    queue = get_queue()

    print()
    print("==============================")
    print("           KOLEJKA")
    print("==============================")

    if not queue:
        print(
            "Kolejka jest pusta."
        )

    else:
        for number, song in enumerate(
            queue,
            start=1
        ):

            print(
                f'{number}. '
                f'{song["title"]} | '
                f'{song["artist"]}'
            )

    print("==============================")
    print(
        f"Liczba utworów: {len(queue)}"
    )
    print()
