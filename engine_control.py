import json
import os
import socket
import threading

from voteskip import (
    add_vote,
    get_votes,
    reset_votes,
    get_settings,
    set_settings
)


SOCKET_PATH = "/tmp/music-engine-control.sock"


class EngineControl:

    def __init__(
        self,
        engine
    ):
        self.engine = engine

    def handle_command(
        self,
        command,
        data=None
    ):
        data = data or {}

        if command == "pause":

            result = (
                self.engine.pause()
            )

            return {
                "success": result,
                "command": "pause"
            }

        if command == "resume":

            result = (
                self.engine.resume()
            )

            return {
                "success": result,
                "command": "resume"
            }

        if command == "previous":

            return (
                self.engine.previous()
            )

        if command == "skip":

            result = (
                self.engine.skip()
            )

            return {
                "success": result,
                "command": "skip"
            }

        if command == "current":

            status = (
                self.engine.player.status()
            )

            return {
                "success": True,
                "command": "current",
                "song": status.get(
                    "song"
                ),
                "playing": status.get(
                    "playing",
                    False
                ),
                "paused": status.get(
                    "paused",
                    False
                ),
                "position": status.get(
                    "position",
                    0
                ),
                "duration": status.get(
                    "duration",
                    0
                ),
                "progress": status.get(
                    "progress",
                    0
                )
            }

        if command == "voteskip":

            return self.handle_voteskip(
                data
            )

        if command == "voteskip_status":

            return (
                self.handle_voteskip_status()
            )

        if command == "voteskip_settings":

            return (
                self.handle_voteskip_settings(
                    data
                )
            )

        if command == "voteskip_reset":

            return (
                self.handle_voteskip_reset()
            )

        return {
            "success": False,
            "error": "unknown_command"
        }

    def handle_voteskip(
        self,
        data
    ):
        user_id = str(
            data.get(
                "userId",
                ""
            )
        ).strip()

        if not user_id:

            return {
                "success": False,
                "error": "missing_user_id"
            }

        settings = (
            get_settings()
        )

        enabled = settings.get(
            "enabled",
            True
        )

        threshold = settings.get(
            "threshold",
            3
        )

        if not enabled:

            return {
                "success": False,
                "error": "voteskip_disabled",
                "command": "voteskip",
                "enabled": False,
                "required": threshold,
                "count": 0,
                "votes": []
            }

        current_song = (
            self.engine.player.current()
        )

        if current_song is None:

            return {
                "success": False,
                "error": "nothing_playing",
                "command": "voteskip",
                "enabled": enabled,
                "required": threshold,
                "count": 0,
                "votes": []
            }

        song_id = (
            current_song.get("id")
        )

        result = add_vote(
            user_id,
            song_id
        )

        votes = result.get(
            "votes",
            []
        )

        count = len(
            votes
        )

        result["command"] = (
            "voteskip"
        )

        result["enabled"] = (
            enabled
        )

        result["required"] = (
            threshold
        )

        result["count"] = count

        if not result.get(
            "success"
        ):
            return result

        if count >= threshold:

            skip_result = (
                self.engine.skip()
            )

            reset_votes(
                None
            )

            result["skip"] = (
                skip_result
            )

            result["triggered"] = True

        else:

            result["triggered"] = False

        return result

    def handle_voteskip_status(
        self
    ):
        settings = (
            get_settings()
        )

        enabled = settings.get(
            "enabled",
            True
        )

        threshold = settings.get(
            "threshold",
            3
        )

        current_song = (
            self.engine.player.current()
        )

        if current_song is None:

            return {
                "success": True,
                "command": "voteskip_status",
                "songId": None,
                "count": 0,
                "required": threshold,
                "threshold": threshold,
                "enabled": enabled,
                "votes": []
            }

        song_id = (
            current_song.get("id")
        )

        data = get_votes(
            song_id
        )

        votes = data.get(
            "votes",
            []
        )

        return {
            "success": True,
            "command": "voteskip_status",
            "songId": song_id,
            "count": len(votes),
            "required": threshold,
            "threshold": threshold,
            "enabled": enabled,
            "votes": votes
        }

    def handle_voteskip_settings(
        self,
        data
    ):
        enabled = data.get(
            "enabled"
        )

        threshold = data.get(
            "threshold"
        )

        result = set_settings(
            enabled=enabled,
            threshold=threshold
        )

        if not result.get(
            "success"
        ):

            result["command"] = (
                "voteskip_settings"
            )

            return result

        current_song = (
            self.engine.player.current()
        )

        if current_song is None:

            result["command"] = (
                "voteskip_settings"
            )

            result["count"] = 0
            result["votes"] = []
            result["triggered"] = False

            return result

        song_id = (
            current_song.get("id")
        )

        vote_data = get_votes(
            song_id
        )

        votes = vote_data.get(
            "votes",
            []
        )

        count = len(
            votes
        )

        result["command"] = (
            "voteskip_settings"
        )

        result["count"] = count
        result["votes"] = votes
        result["triggered"] = False

        if (
            result.get(
                "enabled"
            )
            and count >= result.get(
                "threshold",
                3
            )
        ):

            skip_result = (
                self.engine.skip()
            )

            reset_votes(
                None
            )

            result["skip"] = (
                skip_result
            )

            result["triggered"] = True
            result["count"] = 0
            result["votes"] = []

        return result

    def handle_voteskip_reset(
        self
    ):
        current_song = (
            self.engine.player.current()
        )

        song_id = None

        if current_song is not None:

            song_id = (
                current_song.get(
                    "id"
                )
            )

        data = reset_votes(
            song_id
        )

        return {
            "success": True,
            "command": "voteskip_reset",
            "songId": song_id,
            "count": 0,
            "votes": [],
            "enabled": data.get(
                "enabled",
                True
            ),
            "required": data.get(
                "threshold",
                3
            ),
            "threshold": data.get(
                "threshold",
                3
            )
        }

    def start(
        self
    ):
        try:
            os.remove(
                SOCKET_PATH
            )

        except FileNotFoundError:
            pass

        server = socket.socket(
            socket.AF_UNIX,
            socket.SOCK_STREAM
        )

        server.bind(
            SOCKET_PATH
        )

        os.chmod(
            SOCKET_PATH,
            0o600
        )

        server.listen(
            5
        )

        print(
            "Sterowanie silnikiem:",
            SOCKET_PATH
        )

        while True:

            connection, _ = (
                server.accept()
            )

            thread = threading.Thread(
                target=self.handle_connection,
                args=(
                    connection,
                ),
                daemon=True
            )

            thread.start()

    def handle_connection(
        self,
        connection
    ):
        try:
            data = connection.recv(
                4096
            ).decode()

            if not data:
                return

            request = json.loads(
                data
            )

            command = request.get(
                "command"
            )

            command_data = request.get(
                "data",
                {}
            )

            response = (
                self.handle_command(
                    command,
                    command_data
                )
            )

            connection.sendall(
                (
                    json.dumps(
                        response,
                        ensure_ascii=False
                    )
                    + "\n"
                ).encode()
            )

        except Exception as error:

            response = {
                "success": False,
                "error": str(
                    error
                )
            }

            try:
                connection.sendall(
                    (
                        json.dumps(
                            response,
                            ensure_ascii=False
                        )
                        + "\n"
                    ).encode()
                )

            except Exception:
                pass

        finally:

            connection.close()
