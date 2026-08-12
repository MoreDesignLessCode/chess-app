#!/usr/bin/env python3
"""Serve Chesser, open it in Chrome, and auto-stop after 1 hour of no requests."""
import http.server
import os
import subprocess
import sys
import threading
import time

PORT = int(os.environ.get("CHESSUP_PORT", "4178"))
ROOT = os.path.dirname(os.path.abspath(__file__))
# Shut down after this many seconds with no HTTP requests (default 1 hour).
IDLE_LIMIT = int(os.environ.get("CHESSUP_IDLE", "3600"))
URL = f"http://localhost:{PORT}"

_last_activity = time.time()
_lock = threading.Lock()


def touch():
    global _last_activity
    with _lock:
        _last_activity = time.time()


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.wasm': 'application/wasm',
        '.js': 'text/javascript',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def handle_one_request(self):
        touch()
        super().handle_one_request()

    def log_message(self, *args):
        pass  # keep the console quiet


def open_in_chrome():
    if os.environ.get("CHESSUP_NO_BROWSER"):
        return
    # Prefer Chrome; fall back to the default browser if it's not installed.
    if subprocess.call(["open", "-a", "Google Chrome", URL]) != 0:
        subprocess.call(["open", URL])


def monitor(httpd):
    interval = min(30, max(1, IDLE_LIMIT))
    while True:
        time.sleep(interval)
        with _lock:
            idle = time.time() - _last_activity
        if idle > IDLE_LIMIT:
            print(f"\nNo activity for {IDLE_LIMIT // 60} minutes — shutting down Chesser.")
            httpd.shutdown()
            return


def main():
    try:
        httpd = http.server.ThreadingHTTPServer(("", PORT), Handler)
    except OSError:
        # Port already in use — assume the app is already running and just open it.
        print(f"Chesser already appears to be running. Opening {URL}")
        open_in_chrome()
        return

    httpd.allow_reuse_address = True
    threading.Thread(target=monitor, args=(httpd,), daemon=True).start()
    open_in_chrome()
    print(f"Chesser running at {URL}")
    print("Auto-stops after 1 hour of inactivity. Press Ctrl+C to stop now.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Chesser.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    sys.exit(main())
