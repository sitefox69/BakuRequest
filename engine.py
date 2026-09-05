import os
import threading
import time

from player import Player
from queue import (
    pop_next_song,
    add_to_front
)
from engine_control import EngineControl
from voteskip import reset_votes


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PREVIOUS_DOUBLE_CLICK_SECONDS = 3.0


class MusicEngine:

    def __init__(self):
        self.player = Player()
        self.running = True
        self.control = EngineControl(
            self
        )

        self.current_song = None
        self.previous_song = None

        self.previous_click_time = 0.0

        self.state_lock = (
            threading.RLock()
        )

    def print_header(self):
        print()
        print("==============================")
        print("        MUSIC ENGINE")
        print("==============================")
        print("Silnik uruchomiony.")
        print("==============================")
        print()

    def start_control(self):
        thread = threading.Thread(
            target=self.control.start,
            daemon=True
        )

        thread.start()

    def play_next(self):

        song = pop_next_song()

        if song is None:
            return False

        file_path = os.path.join(
            BASE_DIR,
            song["file"]
        )

        if not os.path.isfile(
            file_path
        ):

            print()
            print("BRAK PLIKU:")
            print(file_path)
            print()

            return True

        with self.state_lock:

            if self.current_song is not None:
                self.previous_song = dict(
                    self.current_song
                )

            self.current_song = dict(
                song
            )

            self.previous_click_time = 0.0

        print()
        print("Następny utwór:")
        print(
            song["title"]
        )
        print(
            song["artist"]
        )
        print()

        reset_votes(
            song["id"]
        )

        success = self.player.play(
            song["id"],
            song
        )

        if not success:
            print(
                "Nie udało się uruchomić utworu."
            )

        return True

    def wait_for_song(self):

        while self.running:

            if not self.player.is_running():
                return

            time.sleep(
                1
            )

    def run(self):

        self.print_header()

        self.start_control()

        while self.running:

            if not self.player.is_running():

                has_song = (
                    self.play_next()
                )

                if not has_song:

                    print(
                        "Kolejka pusta. Czekam..."
                    )

                    time.sleep(
                        2
                    )

                    continue

            self.wait_for_song()

            if self.running:

                print()
                print(
                    "Utwór zakończony."
                )
                print()

    def previous(self):

        with self.state_lock:

            if not self.player.is_running():

                print(
                    "Nic obecnie nie gra."
                )

                self.previous_click_time = 0.0

                return {
                    "success": False,
                    "command": "previous",
                    "error": "nothing_playing"
                }

            now = time.monotonic()

            second_click = (
                self.previous_click_time > 0
                and (
                    now
                    - self.previous_click_time
                )
                <= PREVIOUS_DOUBLE_CLICK_SECONDS
            )

            if (
                second_click
                and self.previous_song
                is not None
            ):

                current_song = (
                    self.current_song
                )

                if current_song is None:
                    current_song = (
                        self.player.current()
                    )

                target_song = dict(
                    self.previous_song
                )

                if current_song is not None:

                    add_to_front(
                        dict(
                            current_song
                        )
                    )

                self.previous_song = None

                self.current_song = dict(
                    target_song
                )

                self.previous_click_time = 0.0

                reset_votes(
                    target_song["id"]
                )

                print()
                print(
                    "PREVIOUS:"
                )
                print(
                    target_song[
                        "title"
                    ]
                )
                print()

                success = self.player.play(
                    target_song["id"],
                    target_song
                )

                if not success:

                    print(
                        "Nie udało się "
                        "odtworzyć poprzedniego "
                        "utworu."
                    )

                    return {
                        "success": False,
                        "command": "previous",
                        "action": "previous_song",
                        "error": "play_failed"
                    }

                return {
                    "success": True,
                    "command": "previous",
                    "action": "previous_song",
                    "song": target_song,
                    "previousAvailable": False
                }

            success = (
                self.player.seek_start()
            )

            if not success:

                self.previous_click_time = 0.0

                return {
                    "success": False,
                    "command": "previous",
                    "action": "restart",
                    "error": "seek_failed"
                }

            self.previous_click_time = now

            current_song = (
                self.current_song
            )

            if current_song is None:
                current_song = (
                    self.player.current()
                )

            if current_song is not None:

                reset_votes(
                    current_song.get(
                        "id"
                    )
                )

            print(
                "PREVIOUS: powrót do 0:00."
            )

            return {
                "success": True,
                "command": "previous",
                "action": "restart",
                "previousAvailable": (
                    self.previous_song
                    is not None
                ),
                "doubleClickWindowSeconds":
                    PREVIOUS_DOUBLE_CLICK_SECONDS
            }

    def skip(self):

        if not self.player.is_running():

            print(
                "Nic obecnie nie gra."
            )

            return False

        with self.state_lock:
            self.previous_click_time = 0.0

        print(
            "SKIP..."
        )

        result = (
            self.player.skip()
        )

        if result:

            print(
                "SKIP wykonany."
            )

        else:

            print(
                "Nie udało się wykonać SKIP."
            )

        return result

    def pause(self):

        result = (
            self.player.pause()
        )

        if result:

            print(
                "PAUZA."
            )

        return result

    def resume(self):

        result = (
            self.player.resume()
        )

        if result:

            print(
                "WZNOWIENIE."
            )

        return result

    def stop(self):

        self.running = False

        self.player.stop()


if __name__ == "__main__":

    engine = MusicEngine()

    try:

        engine.run()

    except KeyboardInterrupt:

        print()
        print(
            "Zatrzymywanie MUSIC ENGINE..."
        )

        engine.stop()
