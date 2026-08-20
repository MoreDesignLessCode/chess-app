# The Chesser online server (WebSocket matchmaking + World chat + /api/pay).
# Host-agnostic image — works on Fly.io, Render, Koyeb, Railway, etc.
FROM node:20-alpine
WORKDIR /app

# The server only needs the `ws` library.
RUN npm install ws@8.18.0 --no-package-lock --no-audit --no-fund

COPY online-server.js ./

# No desktop here, so don't try to pop open a browser; listen on the host's port.
ENV CHESSUP_NO_BROWSER=1
ENV PORT=8080
EXPOSE 8080

CMD ["node", "online-server.js"]
