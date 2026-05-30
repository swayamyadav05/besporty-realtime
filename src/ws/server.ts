import type { Server } from "http";
import { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import type { Match } from "../generated/prisma/client";
import type { createCommentarySchema } from "../validations/commentary";
import type { RawData } from "ws";
import type z from "zod";

const matchSubscribers = new Map<string, Set<WebSocket>>();

function subscribe(matchId: string, socket: WebSocket) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId)?.add(socket);
}

function unsubscribe(matchId: string, socket: WebSocket) {
  const subsribers = matchSubscribers.get(matchId);

  if (!subsribers) return;

  subsribers.delete(socket);

  if (subsribers.size === 0) {
    matchSubscribers.delete(matchId);
  }
}

function sendJson(socket: WebSocket, payload: object) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss: WebSocketServer, payload: object) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(message);
  });
}

function broadcastToMatch(matchId: string, payload: object) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify(payload);

  subscribers.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(message);
  });
}

export function attachWebsocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  const isAlive = new WeakMap<WebSocket, boolean>();
  const subscriptions = new WeakMap<WebSocket, Set<string>>();

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

  function cleanupSubscriptions(socket: WebSocket) {
    for (const matchId of subscriptions.get(socket) ?? []) {
      unsubscribe(matchId, socket);
    }
  }

  function handleMessage(socket: WebSocket, data: RawData) {
    let message;

    try {
      message = JSON.parse(data.toString());
    } catch {
      sendJson(socket, { type: "error", message: "Invalid JSON" });
    }

    if (message?.type === "subscribe" && message.matchId) {
      subscribe(message.matchId, socket);
      subscriptions.get(socket)?.add(message.matchId);
      sendJson(socket, {
        type: "subscribed",
        matchId: message.matchId,
      });
    }

    if (message?.type === "unsubscribe" && message.matchId) {
      unsubscribe(message.matchId, socket);
      subscriptions.get(socket)?.delete(message.matchId);
      sendJson(socket, {
        type: "unsubscribed",
        matchId: message.matchId,
      });
    }
  }

  wss.on("connection", (socket: WebSocket) => {
    isAlive.set(socket, true);
    subscriptions.set(socket, new Set());

    socket.on("pong", onPong);

    sendJson(socket, { type: "welcome" });

    socket.on("message", (data) => {
      handleMessage(socket, data);
    });

    socket.on("error", () => socket.terminate());

    socket.on("close", () => cleanupSubscriptions(socket));
  });

  wss.on("close", () => clearInterval(heartBeat));

  function broadcastMatchCreated(match: Match) {
    broadcastToAll(wss, { type: "match_created", data: match });
  }

  function broadcastCommentary(
    matchId: string,
    comment: z.infer<typeof createCommentarySchema>,
  ) {
    broadcastToMatch(matchId, { type: "commentary", data: comment });
  }

  return { broadcastMatchCreated, broadcastCommentary };
}
