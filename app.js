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

const { Schema } = mongoose;

const isProduction = process.env.NODE_ENV === 'debug';
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

var dev_db_url = "mongodb://dev:kaffeebohne@54.93.107.7/locall_dev";
var mongoDB = process.env.MONGODB_URI || dev_db_url;
var options = {
  useNewUrlParser: true
};

mongoose.connect(mongoDB, options);
mongoose.promise = global.Promise;
mongoose.set('debug', true);
require('./models/Users');
require('./config/passport');
app.use("/", require('./routes'));

if(!isProduction) {
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

io.on('connection', function (socket) {
	console.log("New Connection!");
	socket.on('message', function () {
		// TODO
	});
});

server.listen(8000, () => console.log('Server running on http://localhost:8000/'));


