const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const router = require('./router');

const { addUser, getUser, removeUser, getUsersInRoom } = require('./users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const cors = require('cors');

io.on('connect', (socket) => {
    socket.on('join', ({ name, room }) => {
        const {error, user} = addUser({ id: socket.id, name, room })

        if(error) return callback(error);

        socket.emit('message', {user: 'admin', text: `${user.name}, Welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined`});

        io.to(user.room).emit('roomData', {room: user.roo, users: getUsersInRoom(user.room)});

        socket.join(user.room);
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});
        io.to(user.room).emit('roomData', {room: user.roo, users: getUsersInRoom(user.room)});

        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', {user:'admin', text:`${user.ame} has left.`} )
        }
    })
})

app.use(router);
app.use(cors());

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`)
})