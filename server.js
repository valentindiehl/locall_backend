const app = require('./app');
const mongoose = require('mongoose');

mongoose.connection.once('open', function () {
    app.emit('ready');
});

app.on('ready', function () {
    app.listen(8000, () => console.debug('Server running on http://localhost:8000/'));
});