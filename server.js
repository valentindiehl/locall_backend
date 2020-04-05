const app = require('./app');
const mongoose = require('mongoose');
const session = require('express-session');
const mongoStore = require('connect-mongo')(session);



const roomHandler = require('./handlers/RoomHandler');
const signalHandler = require('./handlers/SignalHandler');
const voiceHandler = require('./handlers/VoiceHandler');

mongoose.connection.once('open', function () {
    app.emit('ready');
});

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


app.on('ready', function () {
    const server = app.listen(8000, () => console.debug('Server running on http://localhost:8000/'));


    const io = require('socket.io')(server, {'pingInterval': 5000});
    io.use(function (socket, next) {
        sessionMware(socket.handshake, {}, next);
    });

    io.on('connection', function (socket) {
        console.debug('New client!', socket.id);
        roomHandler.init(io, socket);
        signalHandler.init(io, socket);
        voiceHandler.init(io, socket);

        socket.on('disconnect', function (reason) {
            console.debug('Client left!', socket.id, "because", reason);
            roomHandler.handleDisconnect(io, socket);
        });
    });
});

