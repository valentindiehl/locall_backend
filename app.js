const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const errorHandler = require('errorhandler');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { Schema } = mongoose;
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'debug';
const app = express();
var server = require('http').Server(app);

app.use(cors({
	origin: [
		process.env.FRONT_URL,
		'http://localhost:3000'
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

var mongoDB = process.env.MONGODB_URI;
var options = {
	useNewUrlParser: true
};

mongoose.connect(mongoDB, options);
mongoose.promise = global.Promise;
mongoose.set('debug', true);
require('./models/users');
require('./models/businesses');
require('./config/passport');
app.use("/", require('./routes'));

if (!isProduction) {
	app.use((err, req, res) => {
		res.status(err.status || 500);

		res.json({
			errors: {
				message: err.message,
				error: err,
			},
		});
	});
}

app.use((err, req, res) => {
	res.status(err.status || 500);

	res.json({
		errors: {
			message: err.message,
			error: {},
		},
	});
});

// socket.io handling
const io = require('socket.io')(server);

const roomHandler = require('./handlers/RoomHandler');
const signalHandler = require('./handlers/SignalHandler');

// IO Events

io.on('connection', function (socket) {
	console.log('New client!', socket.id);
	roomHandler.init(io, socket);
	signalHandler.init(io, socket);

	socket.on('disconnect', function () {
		console.log('Client left!', socket.id);
		roomHandler.handleDisconnect(io, socket);
	});
})

server.listen(8000, () => console.log('Server running on http://localhost:8000/'));


