/**
 * server.js - SyncDoc Socket.IO Server
 * ─────────────────────────────────────────────────────────────
 * This server handles real-time synchronization between users.
 * Deploy this to Render or similar Node.js hosting.
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
        origin: "*", // Adjust this to your DOMAIN_URL in production
        methods: ["GET", "POST"]
    }
});

// Rooms state (optional: you could store active page per room here)
const roomData = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room based on the file hash
    socket.on('joinRoom', (data) => {
        const { room } = data;
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);

        // Track user count in room
        if (!roomData[room]) roomData[room] = { users: 0 };
        roomData[room].users++;

        io.to(room).emit('userCount', roomData[room].users);
    });

    // Handle Page Change Sync
    socket.on('pageChange', (data) => {
        const { room, pageNum } = data;
        socket.to(room).emit('pageChange', { pageNum });
    });

    // Handle Scroll Sync
    socket.on('scrollSync', (data) => {
        const { room, scrollTop, scrollLeft, totalHeight, totalWidth } = data;
        socket.to(room).emit('scrollSync', { scrollTop, scrollLeft, totalHeight, totalWidth });
    });

    // Handle Highlight Sync
    socket.on('highlightSync', (data) => {
        const { room, pageNum, rect } = data;
        socket.to(room).emit('highlightSync', { pageNum, rect });
    });

    // Cleanup on disconnect
    socket.on('disconnecting', () => {
        socket.rooms.forEach(room => {
            if (roomData[room]) {
                roomData[room].users--;
                io.to(room).emit('userCount', roomData[room].users);
                
                // Remove room data if empty
                if (roomData[room].users <= 0) {
                    delete roomData[room];
                }
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`SyncDoc Socket Server running on port ${PORT}`);
});
