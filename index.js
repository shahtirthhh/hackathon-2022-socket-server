const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv/config");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

const PORT = process.env.PORT;
let connected_citizens = [];

io.on("connection", (socket) => {
  socket.emit("connection_sucess");
  console.log("\n\t  New connection 💖");
  socket.on(
    "citizen-ready-to-join",
    ({ citizen_socket, citizen_id, clerk_socket, application }) => {
      console.log("--------------- Citizen ready to join called");
      if (!io.sockets.sockets.get(clerk_socket)) {
        console.log(citizen_socket);
        io.to(citizen_socket).emit("clerk-socket-not-connected");
      } else {
        connected_citizens.push(citizen_socket);
        socket.to(clerk_socket).emit("citizen-ready-to-join", {
          citizen_socket,
          citizen_id,
          application,
        });
        console.log(
          "--------------- citizen-ready-join-emmited to " + clerk_socket
        );
      }
    }
  );
  socket.on("callUser", ({ userToCall, signalData, from }) => {
    socket.to(userToCall).emit("callUser", { signal: signalData, from: from });
  });
  socket.on("answerCall", (data) => {
    socket.to(data.to).emit("callAccepted", data.signal);
  });
  socket.on("end-video-verification", (citizen_socket) => {
    socket.to(citizen_socket).emit("video-verification-ended");
  });
  socket.on("disconnect", () => {
    const found_socket = connected_citizens.find((id) => id === socket.id);
    if (found_socket) {
      console.log("------------------------ A citizen disconnected");
      connected_citizens = connected_citizens.filter(
        (id) => id !== found_socket
      );
      io.emit("citizen-disconnected", found_socket);
    }
  });
});

server.listen(PORT, () => {
  console.clear();
  console.log(" ___________________________________");
  console.log("|                                   |");
  console.log(`|   Socket server live on ${PORT}      |`);
  console.log("|                                   |");
});
