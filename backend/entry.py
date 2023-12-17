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


def run_server(port=51326, reload=False):
    # If the port is taken
    if is_port_in_use(port):
        # Find a free port
        port = 0

    logging.info(f"Starting server on port {port}")

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=port,
        log_level="debug",
        # reload=True,
    )


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

    os.environ["SPOTIFY_CLIENT_SECRET"] = "0379541199f84282a275faeed8e2a1d5"
    run_server(args.port, args.reload)
