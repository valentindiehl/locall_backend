const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const fs = require('fs');
const certFileBuf = fs.readFileSync('./rds-combined-ca-bundle.pem');
const cookieParser = require('cookie-parser');


const isProduction = process.env.NODE_ENV === 'production';
const app = express();
var server = require('http').Server(app);
const io = require('socket.io')(server);


app.use(cors({
	origin: [
		`${process.env.FRONT_URL}`,
		'http://localhost:3000',
		'https://mypage.com',
	],
	credentials: true
}));
app.use(cookieParser());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'sec', cookie: {maxAge: 60000}, resave: false, saveUninitialized: false}));

if (!isProduction) {
	app.use(errorHandler());
}

var dev_db_url = "mongodb://localhost/locall_dev";
var mongoDB = process.env.MONGODB_URI || dev_db_url;
var options = {
	useNewUrlParser: true
};

mongoose.connect(mongoDB, options);
mongoose.promise = global.Promise;
mongoose.set('debug', true);
require('./models/Users');
require('./config/passport');
app.use(require('./routes'));

if (!isProduction) {
	app.use((err, req, res, next) => {
		res.status(err.status || 500);

		res.json({
			errors: {
				message: err.message,
				error: err,
			},
		});
	});
}

app.use((err, req, res, next) => {
	res.status(err.status || 500);

	res.json({
		errors: {
			message: err.message,
			error: {},
		},
	});
});

// IO Events

// TODO: Use namespaces for different cafes later

function leaveRoom(socket) {
	roomId = socket.room;
	if (roomId) {
		socket.room = null;
		socket.leave(roomId);
		let room = io.of('/').in().adapter.rooms[roomId];
		console.log("Leave room, now:", room);
		updateAllRooms(socket);
	}
}

function updateAllRooms(socket) {
	const rooms = io.of("/").in().adapter.rooms;
	socket.emit('updateRooms', rooms);
}

io.on('connection', function (socket) {
	console.log("New connection", socket.id)
	socket.on('join', function (data) {
		leaveRoom(socket);
		const roomId = data.roomId;
		console.log("Client wants to join", roomId);
		socket.join(roomId);
		socket.room = roomId;
		const sockets = io.of('/').in().adapter.rooms[roomId];
		if (sockets.length === 1) {
			console.log("Emitting init signal");
			socket.emit('init');
		} else {
			if (sockets.length <= 8) {
				console.log("Emitting ready signal with length", sockets.length)
				io.to(roomId).emit('ready');
			} else {
				leaveRoom(socket);
				socket.emit('full');
			}
		}
		updateAllRooms(socket)
		console.log("Join room, now", sockets, "in chat room");
	});
	socket.on('signal', (data) => {
		io.to(data.room).emit('desc', data.desc);
	});
	socket.on('leaveRoom', () => {
		leaveRoom(socket);
	});
	socket.on('disconnect', () => {
		console.log("Disconnect", socket.id);
		leaveRoom(socket);
	});
	socket.on('requestRooms', function () {
		updateAllRooms(socket);
	});
});


server.listen(8000, () => console.log('Server running on http://localhost:8000/'));


