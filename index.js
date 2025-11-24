const express = require('express');
const app = express();

// start listening to localhost
const port = process.env.PORT || 80;
const server = app.listen(port, () => console.log(`Started listening on http://localhost:${port}`));

// host all the files in public
app.use(express.static('public'));

// import socket.io
const socket = require('socket.io');
// connect the socket to the server
const io = socket(server);

const rooms = [];

function addRoom(name) {
    let room = {
        name: name,
        id: rooms.length,
        players: [],
    };

    rooms.push(room);

    return room;
}

function roomExists(name) {
    for (let i = 0; i < rooms.length; ++i) {
        const r = rooms[i];

        if (r.name == name) {
            return true;
        }
    }
    return false;
}

function getRoom(name) {
    for (let i = 0; i < rooms.length; ++i) {
        const r = rooms[i];

        if (r.name == name) {
            return r;
        }
    }
    return undefined;
}

function roomIsFull(room) {
    return room.players.length >= 2;
}

function doesPlayerExist(sock, room, pname) {
    for (const p of room.players) {
        if (p.sock_id == sock.id) {
            return true;
        }
    }
    return false;
}

function sockJoinRoom(sock, room, pname) {
    if (doesPlayerExist(sock, room, pname)) {
        return false;
    }
    room.players.push({
        sock_id: sock.id,
        name: pname,
    });

    sock.join(room.name);
    return true;
}

io.on('connection', socket => {
    console.log(`[connection] ${socket.id}`);
    // create room
    socket.on('room_create', (data) => {
        if (roomExists(data.room_name)) {
            socket.emit('room_created', {
                room_exists: true,
                room_name: data.room_name,
            });
            return;
        }
        console.log(`[room_create] ${data.name} \(${socket.id}\) has created the room "${data.room_name}"`);
        let r = addRoom(data.room_name);
        let success = sockJoinRoom(socket, r, data.name);
 
        if (success) {
            socket.emit('room_created', {
                room: r,
                rooms: rooms,
            });
        }
        io.emit('rooms_update', {
            rooms: rooms,
        });
    })

     // join room
     socket.on('room_join', (data) => {
         if (roomExists(data.room_name)) {
             let room = getRoom(data.room_name);
             if (room == undefined) {
                 console.error(`Room ${data.room_name} doesn't exist!`);
               return;
             }
             if (doesPlayerExist(socket, room, data.name)) {
                 return;
             }
             if (sockJoinRoom(socket, room, data.name)) 
                 console.log(`[room_join] ${data.name} \(${socket.id}\) is joining "${data.room_name}"`);

             socket.emit('room_joined', {
                 room: room,
                 rooms: rooms,
             })
         } else {
             socket.emit('room_joined', {
                 room_name: data.room_name,
                 room: null,
             })
         }
        io.emit('rooms_update', {
            rooms: rooms,
        });

     })
 
    // show rooms
    socket.on('rooms_show', (data) => {
        socket.emit('rooms_showed', {
            rooms: rooms
        });
    })

    socket.on('is_room_full', (data) => {
        const r = getRoom(data.room.name);
        socket.emit('is_room_full_response', {
            is_room_full: r.players.length >= 2,
        });
    });

    socket.on('disconnecting', () => {
        console.log(`[disconnecting] ${socket.id}`);
        for (const room of rooms) {
            for (let i = 0; i < room.players.length; ++i) {
                const p = room.players[i];
                if (p.sock_id === socket.id) {
                    room.players.splice(i, 1);
                    console.log(`Removing player with id: ${p.sock_id}`);
                }
            }
        }
        console.log(rooms);

        io.emit('rooms_update', {
            rooms: rooms,
        });
    });
});


