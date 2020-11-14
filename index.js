// var app = require('express')();
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var usernames = ['Alice', 'Bob', 'Charlie', 'Dinah', 'Eve'];
var used_usernames = [];
var chatHistory = [];
// var today = new Date();

//css?
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    //   res.send('<h1>Hello world</h1>');
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    //set initial username
    var randUsername = usernames[Math.floor(Math.random() * usernames.length)];
    while (used_usernames.includes(randUsername)) {
        if (used_usernames.length >= usernames.length) {
            randUsername += "oh no";
            break;
        }
        randUsername = usernames[Math.floor(Math.random() * usernames.length)];
    }
    used_usernames.push(randUsername);
    socket.emit('username', randUsername);

    //initial connect message
    var connectMessage = new Date().toUTCString() + ' | User connected: ' + randUsername;
    console.log(connectMessage);
    io.emit('chat message', connectMessage);
    chatHistory.push(connectMessage);
    io.emit('users', used_usernames);


    socket.on('chat message', (msg) => {
        console.log('message received: ' + msg);
        var newMessage = new Date().toUTCString() + " | " + randUsername + ": " + msg;

        if (msg.startsWith("/name")) {
            var newName = msg.replace("/name", "");
            console.log('name request:' + newName);

            //checking if exists
            var newIndex = used_usernames.indexOf(newName);
            var oldIndex = used_usernames.indexOf(randUsername);
            if (newIndex > -1) { //new username exists
                var rejectString = " | Username exists. Command rejected";
                newMessage = newMessage.concat(rejectString);
                console.log(rejectString);
                //used_usernames.splice(index, 1);
            } else if (oldIndex > -1) {
                used_usernames.splice(oldIndex, 1);
                used_usernames.push(newName);
                randUsername = newName;
                var acceptString = " | Command accepted. Username has been changed.";
                newMessage = newMessage.concat(acceptString);
                io.emit('users', used_usernames);
                //console.log(acceptString);
            } else {
                var weirdRejectString = " | current username doesn't exist? Command rejected";
                newMessage = newMessage.concat(weirdRejectString);
                console.log(weirdRejectString);

            }

        }
        console.log("final message emitted:" + newMessage);
        io.emit('chat message', newMessage);
        chatHistory.push(newMessage);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:' + randUsername);
        var newMessage = new Date().toUTCString() + ' | user disconnected: ' + randUsername;
        io.emit('chat message', newMessage);
        chatHistory.push(newMessage);

        //will be cookies, eventually
        const index = used_usernames.indexOf(randUsername);
        if (index > -1) {
            used_usernames.splice(index, 1);
        }
        console.log('remaining users:' + used_usernames)
        io.emit('users', used_usernames);
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});