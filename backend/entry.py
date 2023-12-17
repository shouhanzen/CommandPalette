import contextlib
import time
import threading
import uvicorn
import subprocess
import socket
import threading
import os
import logging
import argparse

import multiprocessing

from src.main import app

logging.basicConfig(
    filename="uvicorn.log",
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", port))
            return False
        except socket.error:
            logging.warning(f"Port {port} is in use")
            return True


class Server(uvicorn.Server):
    def install_signal_handlers(self):
        pass

    @contextlib.contextmanager
    def run_in_thread(self):
        thread = threading.Thread(target=self.run)
        thread.start()
        try:
            while not self.started:
                time.sleep(1e-3)
            yield
        finally:
            self.should_exit = True
            thread.join()


def run_server(port, reload):
    # If the port is taken
    if is_port_in_use(port):
        # Find a free port
        port = 0

    logging.info(f"Starting server on port {port}")

    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",
        port=port,
        log_level="debug",
        reload=reload,
    )
    server = uvicorn.Server(config=config)
    server.run()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, help="Set the port for run_server")
    parser.add_argument(
        "--reload",
        type=bool,
        default=False,
        help="Set to True to enable server reloading",
    )
    args = parser.parse_args()

    if args.port is None:
        args.port = 0

    if args.reload is None:
        args.reload = False

    os.environ["SPOTIFY_CLIENT_SECRET"] = "0379541199f84282a275faeed8e2a1d5"
    run_server(args.port, args.reload)
