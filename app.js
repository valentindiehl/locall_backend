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
const {Schema} = mongoose;
const redis = require('redis')
let RedisStore = require('connect-redis')(session);
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'debug';
const app = express();
var server = require('http').Server(app);

app.use(cors({
	origin: process.env.FRONT_URL,
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

// Redis Stuff
let redisClient = redis.createClient({
	host: 'localhost',
	port: 6379,
	password: process.env.REDIS_PASSWORD,
	db: 1
});

redisClient.unref()
redisClient.on('error', console.log);

const sessionMiddleware = session({
	store: new RedisStore({client: redisClient}),
	secret: 'This is a super secret secret'
});

// socket.io handling
const io = require('socket.io')(server);


io.use(function (socket, next) {
	sessionMiddleware(socket.request, socket.request.res || {}, next)
});

app.use(sessionMiddleware);

const roomHandler = require('./handlers/RoomHandler');
const signalHandler = require('./handlers/SignalHandler');

// IO Events

io.on('connection', function (socket) {
	console.log('New client!', socket.id);
	console.log("Session", socket.request.session.userId);

	roomHandler.init(io, socket);
	signalHandler.init(io, socket);

	socket.on('disconnect', function () {
		console.log('Client left!', socket.id);
		roomHandler.handleDisconnect(io, socket);
	});
});

server.on('ready', function () {
	server.listen(8000, () => console.log('Server running on http://localhost:8000/'));
});

const mongoDB = process.env.MONGODB_URI;
const options = {
	useNewUrlParser: true,
	reconnectTries: Number.MAX_VALUE,
	reconnectInterval: 500,
	connectTimeoutMS: 10000,
};

mongoose.connect(mongoDB, options);
mongoose.promise = global.Promise;
mongoose.set('debug', true);
mongoose.connection.once('open', function () {
	server.emit('ready');
});


