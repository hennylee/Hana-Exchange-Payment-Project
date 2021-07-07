const path = require('path');
const express = require('express');
const http = require('http')
const app = express();
const server = http.Server(app);
const io = require('socket.io')(app);

app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'index.html'));
})

setInterval(() => {
    io.emit('image', 'some data');
}, 1000);

server.listen(3000);