import uvicorn
import subprocess
import socket
import threading
import os
import logging

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


def run_server():
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=find_free_port(),
        log_level="debug",
        # reload=True,
    )


if __name__ == "__main__":
    # multiprocessing.freeze_support()

    os.environ["SPOTIFY_CLIENT_SECRET"] = "0379541199f84282a275faeed8e2a1d5"
    run_server()

    # thread = threading.Thread(target=run_server)
    # thread.start()
    # thread.join()  # This will make the main thread wait for the server thread
