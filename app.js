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
const mongoStore = require('connect-mongo')(session);
require('dotenv').config();

const morgan = require('morgan');
const rfs = require('rotating-file-stream'); // version 2.x

const isProduction = process.env.NODE_ENV === 'debug';
const app = express();
var server = require('http').Server(app);


app.use(cors({
	origin: process.env.FRONT_URL,
	credentials: true
}));

const accessLogStream = rfs.createStream('access.log', {
	interval: '1d', // rotate daily
	path: path.join(__dirname, 'log')
});

app.use(morgan('combined', {stream: accessLogStream}));

const sessionStore = new mongoStore({
	mongooseConnection: mongoose.connection,
	touchAfter: 24 * 3600
});

const sessionMware = session({
	name: "locall.sess",
	store: sessionStore,
	secret: "Very secret secret",
	resave: false,
	saveUninitialized: true,
	cookie: {maxAge: 1000 * 60 * 60 * 24}
});

app.use(sessionMware);
app.use(cookieParser());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!isProduction) {
	app.use(errorHandler());
}

require('./models/users');
require('./models/businesses');
require('./models/application');
require('./models/events');
require('./models/blockedMessages');
require('./models/donations');
require('./config/passport');
app.use("/", require('./routes'));

if (!isProduction) {
	app.use((err, req, res, next) => {
		res.status(err.status || 500);

		res.json({
			error: {
				message: err.code === "LIMIT_FILE_SIZE" ? "Bitte lade nur Dateien unter 2MB hoch." : err.message,
				error: err,
			},
		});
	});
}

app.use((err, req, res, next) => {
	res.status(err.status || 500);

	res.json({
		error: {
			message: err.message,
			error: {},
		},
	});
});

app.use(express.static('public'));


const mongoDB = "mongodb" + (!!process.env.MONGO_DB_SRV ? process.env.MONGO_DB_SRV : "") + "://" + process.env.MONGO_DB_USERNAME + ":" + process.env.MONGO_DB_PASSWORD + "@" + process.env.MONGO_DB_URL + "/" + process.env.MONGO_DB_NAME;

const options = {
	useNewUrlParser: true,
	reconnectTries: Number.MAX_VALUE,
	reconnectInterval: 500,
	connectTimeoutMS: 10000,
};

mongoose.connect(mongoDB, options);
mongoose.promise = global.Promise;
//mongoose.set('debug', true);

module.exports = app;


