import type { Server } from "http";
import { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import type { Match } from "../generated/prisma/client";

function sendJson(socket: WebSocket, payload: object) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcast(wss: WebSocketServer, payload: object) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    client.send(message);
  }
}

export function attachWebsocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  const isAlive = new WeakMap<WebSocket, boolean>();

  function onPong(this: WebSocket) {
    isAlive.set(this, true);
  }

  // Heartbeat interval
  const heartBeat = setInterval(() => {
    for (const client of wss.clients) {
      if (client.readyState !== WebSocket.OPEN) continue;

      if (isAlive.get(client) === false) {
        client.terminate();
        continue;
      }

      isAlive.set(client, false);
      client.ping();
    }
  }, 30_000);

  wss.on("connection", (socket: WebSocket) => {
    isAlive.set(socket, true);
    socket.on("pong", onPong);
    socket.on("error", console.error);
    sendJson(socket, { type: "welcome" });
  });

  wss.on("close", () => clearInterval(heartBeat));

  function broadcastMatchCreated(match: Match) {
    broadcast(wss, { type: "match_created", data: match });
  }

  return { broadcastMatchCreated };
}
