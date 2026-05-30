import http from "http";
import express from "express";
import cors from "cors";
import { env } from "bun";
import { matchRouter } from "./routes/match.route";
import { attachWebsocketServer } from "./ws/server";

const PORT = Number(env.PORT) || 8000;
const HOST = env.HOST || "0.0.0.0";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Health check");
});

app.use("/api/v1/matches", matchRouter);

const { broadcastMatchCreated } = attachWebsocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0"
      ? `http://localhost:${PORT}`
      : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(
    `WebSocker Server is running on ${baseUrl.replace("http", "ws")}/ws`,
  );
});
