import json
import os
import socket
import subprocess
import time

from library import get_song


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

SOCKET_PATH = "/tmp/music-engine-mpv.sock"


class Player:

    def __init__(self):
        self.process = None
        self.current_song = None

    def _request(
        self,
        command
    ):
        if not os.path.exists(
            SOCKET_PATH
        ):
            return None

        try:
            with socket.socket(
                socket.AF_UNIX,
                socket.SOCK_STREAM
            ) as sock:

                sock.settimeout(2)

                sock.connect(
                    SOCKET_PATH
                )

                request = {
                    "command": command
                }

                sock.sendall(
                    (
                        json.dumps(
                            request
                        )
                        + "\n"
                    ).encode()
                )

                response = sock.recv(
                    4096
                ).decode()

                if not response:
                    return None

                data = json.loads(
                    response
                )

                if (
                    data.get("error")
                    != "success"
                ):
                    return None

                return data

        except (
            OSError,
            socket.timeout,
            json.JSONDecodeError
        ):
            return None

    def _send_command(
        self,
        command
    ):
        data = self._request(
            command
        )

        if data is None:
            return False

        return True

    def _get_property(
        self,
        property_name
    ):
        data = self._request([
            "get_property",
            property_name
        ])

        if data is None:
            return None

        return data.get(
            "data"
        )

    def play(
        self,
        song_id,
        song_data=None
    ):
        if song_data is not None:
            song = dict(
                song_data
            )

        else:
            song = get_song(
                song_id
            )

        if song is None:
            print(
                "Nie znaleziono utworu:",
                song_id
            )

            return False

        file_path = os.path.join(
            BASE_DIR,
            song["file"]
        )

        if not os.path.isfile(
            file_path
        ):
            print(
                "Brak pliku:",
                file_path
            )

            return False

        self.stop()

        try:
            os.remove(
                SOCKET_PATH
            )

        except FileNotFoundError:
            pass

        self.current_song = dict(
            song
        )

        self.process = subprocess.Popen([
            "mpv",
            "--no-video",
            "--really-quiet",
            "--pause=no",
            "--input-ipc-server="
            + SOCKET_PATH,
            file_path
        ])

        for _ in range(50):

            if os.path.exists(
                SOCKET_PATH
            ):
                break

            time.sleep(
                0.1
            )

        if not os.path.exists(
            SOCKET_PATH
        ):
            print(
                "MPV nie utworzył socketu IPC."
            )

            self.current_song = None

            return False

        time.sleep(
            0.5
        )

        self._send_command([
            "set_property",
            "pause",
            False
        ])

        print()
        print("==============================")
        print("          ODTWARZANIE")
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
        print("==============================")
        print()

        return True

    def pause(self):
        return self._send_command([
            "set_property",
            "pause",
            True
        ])

    def resume(self):
        return self._send_command([
            "set_property",
            "pause",
            False
        ])

    def seek_start(self):
        if not self.is_running():
            return False

        return self._send_command([
            "seek",
            0,
            "absolute"
        ])

    def skip(self):
        if not self.is_running():
            return False

        return self._send_command([
            "stop"
        ])

    def stop(self):
        if self.process is not None:

            if (
                self.process.poll()
                is None
            ):

                self.process.terminate()

                try:
                    self.process.wait(
                        timeout=2
                    )

                except subprocess.TimeoutExpired:
                    self.process.kill()

            self.process = None

        try:
            os.remove(
                SOCKET_PATH
            )

        except FileNotFoundError:
            pass

        self.current_song = None

    def is_running(self):
        if self.process is None:
            return False

        if (
            self.process.poll()
            is not None
        ):

            self.process = None
            self.current_song = None

            try:
                os.remove(
                    SOCKET_PATH
                )

            except FileNotFoundError:
                pass

            return False

        return True

    def is_paused(self):
        if not self.is_running():
            return False

        pause = self._get_property(
            "pause"
        )

        if pause is None:
            return False

        return bool(
            pause
        )

    def is_playing(self):
        if not self.is_running():
            return False

        return not self.is_paused()

    def get_position(self):
        if not self.is_running():
            return 0

        position = self._get_property(
            "time-pos"
        )

        if position is None:
            return 0

        try:
            return float(
                position
            )

        except (
            TypeError,
            ValueError
        ):
            return 0

    def get_duration(self):
        if not self.is_running():
            return 0

        duration = self._get_property(
            "duration"
        )

        if duration is None:

            if self.current_song:
                return float(
                    self.current_song.get(
                        "duration",
                        0
                    )
                    or 0
                )

            return 0

        try:
            return float(
                duration
            )

        except (
            TypeError,
            ValueError
        ):
            return 0

    def get_progress(self):
        duration = (
            self.get_duration()
        )

        if duration <= 0:
            return 0

        position = (
            self.get_position()
        )

        progress = (
            position / duration
        ) * 100

        return max(
            0,
            min(
                100,
                progress
            )
        )

    def status(self):
        if not self.is_running():

            return {
                "song": None,
                "playing": False,
                "paused": False,
                "position": 0,
                "duration": 0,
                "progress": 0
            }

        return {
            "song": self.current_song,
            "playing": self.is_playing(),
            "paused": self.is_paused(),
            "position": self.get_position(),
            "duration": self.get_duration(),
            "progress": self.get_progress()
        }

    def current(self):
        if not self.is_running():
            return None

        return self.current_song


if __name__ == "__main__":

    player = Player()

    if player.play(
        "V9PVRfjEBTI"
    ):

        print(
            "Player uruchomiony."
        )

        print(
            "Ctrl+C zatrzyma test."
        )

        try:
            while True:

                status = (
                    player.status()
                )

                print(
                    "Pozycja:",
                    round(
                        status[
                            "position"
                        ],
                        1
                    ),
                    "/",
                    round(
                        status[
                            "duration"
                        ],
                        1
                    ),
                    "sek."
                )

                time.sleep(
                    5
                )

        except KeyboardInterrupt:

            print()
            print(
                "Zatrzymywanie..."
            )

            player.stop()
