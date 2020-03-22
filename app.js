const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');

mongoose.promise = global.Promise;

const isProduction = process.env.NODE_ENV === 'production';
const app = express();
var server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(cors());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'sec', cookie: {maxAge: 60000}, resave: false, saveUninitialized: false}));

if (!isProduction) {
	app.use(errorHandler());
}

mongoose.connect('mongodb://locallmasterblaster:tivxos-vYpfo3-nehreq@docdb-2020-03-21-23-23-08.cluster-chjfvfcgw69a.eu-central-1.docdb.amazonaws.com:27017/?ssl=true&ssl_ca_certs=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false');
mongoose.set('debug', true);
require('./models/Users');
require('./config/passport');
app.use(require('./routes'));

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

// IO Events

io.on('connection', function (socket) {
	console.log("New Connection!");
	socket.on('message', function () {
		// TODO
	});
});

server.listen(8000, () => console.log('Server running on http://localhost:8000/'));


