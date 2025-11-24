let p;
let opp;
let ball;
let socket;
let start = false;
let other_id;
let name_input;
let room_input;
let show_users_btn;
let create_room_btn;
let join_room_btn;
let show_room_btn;
let debug = true;
let isAdmin = false;
let canStart = false;
let currentRoom;
let currentRoomLabel = document.createElement('p');
let rooms_list = document.createElement('ul');
const setup_fs = document.getElementById('setup');

function setCurrentRoom(room) {
    currentRoom = room;
    if (!currentRoom) {
        currentRoomLabel.innerHTML = "Not in any Room";
    } else {
        currentRoomLabel.innerHTML = `Current Room: ${currentRoom.name} [${currentRoom.id}]`;
    }
}

function showError(err) {
    window.alert(err);
}

function addBreak(times) {
    for (let i = 0; i < times; i++) {
        setup_fs.append(document.createElement('br'));
    }
}

function updateRoomsList(rooms) {
    rooms_list.innerHTML = "";
    for (let i = 0; i < rooms.length; ++i) {
        const li = document.createElement('li');
        const r = rooms[i];
        li.innerHTML = `${r.name}`;
        rooms_list.append(li);
    }
}

function setup() {
    const p5_canvas = createCanvas(800, 400);
    p5_canvas.id('p5_canvas');

    p = new Player(width - 50, height / 2);
    opp = new Player(50, height / 2);
    ball = new Ball();

    // connect to the sockets
    socket = io.connect('http://localhost:80');

    setup_fs.append(currentRoomLabel);
    setCurrentRoom(currentRoom);

    // Name input
    name_input = document.createElement('input');
    name_input.placeholder = 'Enter Your name...';
    setup_fs.append(name_input);

    addBreak(2);

    // Room input
    room_input = document.createElement('input');
    room_input.placeholder = 'Enter Room name...';
    setup_fs.append(room_input);

    addBreak(2);

    // create & join buttons
    create_room_btn = document.createElement('button');
    create_room_btn.innerHTML = 'Create';
    setup_fs.append(create_room_btn);
    join_room_btn = document.createElement('button');
    join_room_btn.innerHTML = 'Join';
    setup_fs.append(join_room_btn);


    addBreak(1);

    // debug
    if (debug){
        show_room_btn = document.createElement('button');
        show_room_btn.innerHTML = 'Show rooms';
        setup_fs.append(show_room_btn);
        show_room_btn.onclick = () =>{
            socket.emit('show_rooms', {});
        }

        show_users_btn = document.createElement('button');
        show_users_btn.innerHTML = 'Show Users';
        setup_fs.append(show_users_btn);

        show_users_btn.onclick = () => {
            showError("Not Implemented Yet!");
        }
    }

    addBreak(1);

    setup_fs.append(rooms_list);

    create_room_btn.onclick = () => {
        socket.emit('create_room', {
            room_name: room_input.value,
            name: name_input.value
        })
    }

    join_room_btn.onclick = () => {
        socket.emit('join_room', {
            room_name: room_input.value,
            name: name_input.value
        })
    }

    // recieve from the server if this is the admin
    socket.on('room_created', data => {
        setCurrentRoom(data.room);
        updateRoomsList(data.rooms);
    })

    socket.on('room_show', (data) => {
        updateRoomsList(data.rooms);
    });
}

function draw() {

    //console.log(`sending data: ${data.y}`);
    socket.emit('data_ts', {
        y: p.pos.y,
        score: p.score
    });

    socket.on('data_tc', data => {
        opp.pos.y = data.y;
        opp.score = data.score;
        if (!other_id) {
            other_id = data.id;
        }
    })

    background(0);

    if (isAdmin){
        ball.show();
        ball.update();
    }

    //console.log(start);
    // show and update player
    p.show();
    p.edges();
    p.controls();

    opp.show('opp');

    // show the scores
    textAlign(CENTER);
    textSize(24);
    fill(255);
    text(`${opp.score}₧`, width / 2 - 100, 50);
    text(`${p.score}₧`, width / 2 + 100, 50);

    // scoring
    if (ball.pos.x > p.pos.x + 50) {
        opp.score++;
        ball.reset();
    }
    if (ball.pos.x < opp.pos.x - 50) {
        p.score++;
        ball.reset();
    }

    stroke(255);
    line(width / 2, 0, width / 2, height);
}
