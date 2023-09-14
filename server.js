import express from "express";
import path from "path";
import http from 'http';
import { Server } from 'socket.io';
import { formatMessage } from "./utils/messages.js";
import { userJoin,getCurrentUser,userLeave,getRoomUsers } from "./utils/users.js";


const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine","ejs");

const botName = "Bot";

app.get("/", (req,res)=> {
  res.render("index");
});

app.get("/room", (req,res)=>{
  res.render("chat");
})


io.on("connection", (socket) => {

  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);


    socket.emit("message", formatMessage(`${botName} `, "Welcome to Chatex!"));

    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName + ' ', `${user.username} has joined the chat`)
      );

  
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username + ' ' , msg));
    
  });

  
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName + ' ', ` ${user.username}  has left the chat`)
      );

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`)
});
