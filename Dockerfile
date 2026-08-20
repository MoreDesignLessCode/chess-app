# The Chesser online server (WebSocket matchmaking + World chat + /api/pay).
# Host-agnostic image — works on Render, Koyeb, Railway, Fly.io, etc.
FROM node:20-alpine
WORKDIR /app

# The server only needs the `ws` library.
RUN npm install ws@8.18.0 --no-package-lock --no-audit --no-fund

COPY online-server.js ./

# No desktop here, so don't try to pop open a browser. The host (Render) provides PORT;
# online-server.js reads process.env.PORT and falls back to 4180 for local `docker run`.
ENV CHESSUP_NO_BROWSER=1
EXPOSE 4180

CMD ["node", "online-server.js"]
