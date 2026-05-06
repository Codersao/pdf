/**
 * server.js - SyncDoc Socket.IO Server (Updated with Drawing)
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const roomData = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (data) => {
        const { room } = data;
        socket.join(room);
        
        if (!roomData[room]) roomData[room] = { users: 0 };
        roomData[room].users++;
        io.to(room).emit('userCount', roomData[room].users);
    });

    socket.on('pageChange', (data) => {
        socket.to(data.room).emit('pageChange', { pageNum: data.pageNum });
    });

    socket.on('scrollSync', (data) => {
        socket.to(data.room).emit('scrollSync', data);
    });

    socket.on('highlightSync', (data) => {
        socket.to(data.room).emit('highlightSync', data);
    });

    // Handle Real-time Drawing
    socket.on('drawSync', (data) => {
        socket.to(data.room).emit('drawSync', data);
    });

    // Handle Clear Marks
    socket.on('clearSync', (data) => {
        socket.to(data.room).emit('clearSync', data);
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(room => {
            if (roomData[room]) {
                roomData[room].users--;
                io.to(room).emit('userCount', roomData[room].users);
                if (roomData[room].users <= 0) delete roomData[room];
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`SyncDoc Socket Server running on port ${PORT}`);
});
