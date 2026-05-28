// import { WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import { env } from "bun";
import { matchRouter } from "./routes/match.route";

const HTTP_PORT = env.HTTP_PORT ? Number(env.HTTP_PORT) : undefined;
// const WS_PORT = env.WS_PORT ? Number(env.WS_PORT) : undefined;

const app = express();
app.use(cors());
app.use(express.json());

// const wss = new WebSocketServer({
//   port: WS_PORT,
// });

// wss.on("connection", (socket, request) => {
//   socket.send("Hey there from websocket...");
//   console.log(`Websocket connection on ws://localhost:${WS_PORT}`);
// });

app.get("/", (req, res) => {
  console.log("Hi there from get '/' route");
  res.status(200).json({
    message: "Health check",
  });
});

app.use("/api/v1/matches", matchRouter);

app.listen(HTTP_PORT, () => {
  console.log(`Server is running on http://localhost:${HTTP_PORT}`);
});
