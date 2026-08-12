#!/usr/bin/env bash
# Start Chesser on its own server (serves the app + live online + payments),
# then open it in the browser. One command — everything just works.
cd "$(dirname "$0")"
exec node online-server.js
