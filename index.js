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
        id: rooms.length
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

io.on('connection', socket => {
    console.log(`new connection: ${socket.id}`);

    // create room
    socket.on('create_room', (data) => {
        // console.log(data)
        // console.log(`${data.name} \(${socket.id}\) has created the room "${data.room_name}"`);
        socket.in(socket.id).socketsJoin(data.room_name);
        let r = addRoom(data.room_name);
        r.p1_sock_id = socket.id;


        socket.emit('room_created', {
            room: r,
            rooms: rooms
        });

        console.log("--------------------------------------------------");
        console.log(rooms);
        console.log("--------------------------------------------------");
        //console.log(io.in("room1"));
    })

    // join room
    socket.on('join_room', (data) => {
        if (roomExists(data.room_name)) {
            // join to the room
            socket.in(socket.id).socketsJoin(data.room_name);
            // add to the rooms array only if there are less than 2 clients in it
            if (rooms[data.room_name].length <= 1) {
                rooms[data.room_name].push({
                    id: socket.id,
                    name: data.name,
                    isAdmin: false
                });
                // console log who is joining which room
                console.log(`${data.name} \(${socket.id}\) is joining "${data.room_name}"`);
            } else {
                console.log('there are already 2 clients in this room!');
            }
            // send response
            socket.to(socket.id).emit('room_joined', {
                id: socket.id,
                name: data.name,
                room_name: data.room_name
            })
        } else {
            console.log('invalid room name!');
            socket.emit('invalid_room', {
                id: socket.id,
                name: data.name,
                room_name: data.room_name
            });
        }
    })

    // show rooms
    socket.on('show_rooms', (data) => {
        socket.emit('room_show', {
            rooms: rooms
        });
    })

    socket.on('get_users', (data) => {
        roomId = data.roomId;
        console.log(`Getting Users for room ${roomId}`);
    });

    // recieve data and broadcast it to the other player
    socket.on('data_ts', (data) => {
        data.id = socket.id;
        socket.broadcast.emit('data_tc', data);

        //console.log(`recieving data: ${data.y} from: ${socket.id}`);
    });

    // console.log(connections);
});
