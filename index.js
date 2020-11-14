// var app = require('express')();
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var usernames = ['Alice', 'Bob', 'Charlie', 'Dinah', 'Eve', 'Fred', 'George'];
var inUseUsernames = [];
var chatHistory = [];
var userColors = [];
// var today = new Date();

//css?
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    //   res.send('<h1>Hello world</h1>');
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    //set initial username
    var sessionUsername = usernames[Math.floor(Math.random() * usernames.length)];
    while (inUseUsernames.includes(sessionUsername)) {
        if (inUseUsernames.length >= usernames.length) {
            sessionUsername += "oh no";
            break;
        }
        sessionUsername = usernames[Math.floor(Math.random() * usernames.length)];
    }
    inUseUsernames.push(sessionUsername);
    socket.emit('username', sessionUsername);

    //initial connect message
    var connectMessage = new Date().toUTCString() + ' | System: User connected: ' + sessionUsername;
    console.log(connectMessage);
    //io.emit('chat message', connectMessage);
    io.emit('users', inUseUsernames);
    chatHistory.push(connectMessage);
    io.emit('chat history', chatHistory);
    io.emit('userColors', userColors);


    socket.on('chat message', (msg) => {
        //console.log('message received: ' + msg);
        var receivedMessage = new Date().toUTCString() + " | " + sessionUsername + ": " + msg;
        var systemMessage;
        //rename
        if (msg.startsWith("/name")) {
            var requestedName = msg.replace("/name", "");
            console.log('name request:' + requestedName);
            //var systemMessage = "";

            //checking if exists
            var newIndex = inUseUsernames.indexOf(requestedName);
            var oldIndex = inUseUsernames.indexOf(sessionUsername);
            if (newIndex > -1) { //new username exists
                systemMessage = " | System: Command rejected. Username exists.";
                //newMessage = newMessage.concat(rejectString);
                //console.log(rejectString);
                //used_usernames.splice(index, 1);
            } else if (oldIndex > -1) {//remove old username, push new one.
                //change connected users
                inUseUsernames.splice(oldIndex, 1);
                inUseUsernames.push(requestedName);
                io.emit('users', inUseUsernames);

                //change session's username
                sessionUsername = requestedName;
                socket.emit('username', sessionUsername);

                //newMessage = newMessage.concat(acceptString);
                systemMessage = " | System: Command accepted. Username has been changed.";

                //console.log(acceptString);
            } else {
                systemMessage = " | System: Command rejected. Current username doesn't exist? ";
                //newMessage = newMessage.concat(weirdRejectString);
                //console.log(weirdRejectString);
            }
            //chatHistory.push(new Date().toUTCString() + systemMessage);
            //io.emit('chat history', systemMessage);
        }

        //color
        if (msg.startsWith("/color")) {
            var requestedColor = msg.replace("/color", "");
            console.log('color request:' + requestedColor);
            var systemMessage = "";
            if (requestedColor > 255255255 || requestedColor < 0) {
                systemMessage = " | System: Command rejected. Requested color out of range.";
            } else {
                systemMessage = " | System: Command accepted. Message color changed.";
                const colorIndex = userColors.indexOf(sessionUsername); //TODO: matcher for first?
                if (colorIndex > -1) {
                    userColors.splice(colorIndex, 1);
                }
                var newColorObject = { colorName: sessionUsername, color: requestedColor };
                userColors.push(newColorObject);
                io.emit('userColors', userColors);
            }
            //chatHistory.push(new Date().toUTCString() + systemMessage);
        }

        //console.log("final message emitted:" + newMessage);
        //io.emit('chat message', newMessage);
        chatHistory.push(receivedMessage);
        if (systemMessage) {
            chatHistory.push(new Date().toUTCString() + systemMessage);
        }
        io.emit('chat history', chatHistory);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:' + sessionUsername);
        var disconnectMessage = new Date().toUTCString() + ' | System:  User disconnected: ' + sessionUsername;
        //io.emit('chat message', newMessage);
        chatHistory.push(disconnectMessage);
        io.emit('chat history', chatHistory);

        //removing user from active users
        //will be cookies, eventually
        const index = inUseUsernames.indexOf(sessionUsername);
        if (index > -1) {
            inUseUsernames.splice(index, 1);
        }
        // console.log('remaining users:' + used_usernames)
        io.emit('users', inUseUsernames);
        //todo remove colours too?
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});