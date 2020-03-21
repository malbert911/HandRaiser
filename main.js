var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//if TEACHER



//if STUDENT
io.on('connection', function(socket) {
    //add desk to webpage
    var desk = document.createElement("DIV");
    desk.className = "Desk";

    //TODO: Add student name onto desk
    desk.innerHTML = "Name";
    document.body.appendChild(desk);
    
    socket.on('disconnect', function () {
       //remove desk
    });
 });