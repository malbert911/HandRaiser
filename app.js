const express = require('express')
const app = express()
let rooms = [];
const MINROOM = 10000;
const MAXROOM = 99999

class Room{
    constructor(roomId, ownerName, ownerId){
        this.id = roomId;
        this.ownerName = ownerName;
        this.ownerId = ownerId;
        this.members = [];
    }

    setMemberHand(memberId, handState){
        for(let i=0; i < this.members.length; i++){
            if(this.members[i].id == memberId){
                this.members[i].handRaised = handState;
                return true;
            }
        }
        return false;
    }

    removeMember(id){
        for(let i=0; i < this.members.length; i++){
            if(this.members[i].id == id){
                this.members.splice(i);
                //this.members[i].handRaised = handState;
                //DELETE THIS
                return true;
            }
        }
        return false;
    }

    toString(){
        let tmp = `<div class="owner">${this.ownerName}</div>`;
        tmp += `<div class="members">`;
        for(let i=0; i < this.members.length; i++){
            console.log(this.members[i]);
            console.log(this.members);
            tmp+= `<div class="member">${this.members[i].username}`;
            if(this.members[i].handRaised)
                tmp+="RAISED"
            tmp+= `</div>`;
        }
        tmp += `</div>`;
        return tmp;
    }
}
class Member{
    constructor(username, id){
        this.username = username;
        this.handRaised = false;
        this.id = id;
    }
}

//set the template engine ejs
app.set('view engine', 'ejs')

//middlewares
app.use(express.static('public'))


//routes
app.get('/', (req, res) => {
	res.render('index')
})

//Listen on port 3000
server = app.listen(3000)



//socket.io instantiation
const io = require("socket.io")(server)


//listen on every connection
io.on('connection', (socket) => {
    console.log(socket.id + ' connected')
    
    socket.room = 'default';
    socket.join('default')

    socket.on('create_room', (data) =>{
        let newRoom;
        let myUsername = data.username;
        
        do{
            newRoom = Math.floor(Math.random() * (MINROOM*10));
            //console.log(newRoom);
        }
        while(!(typeof rooms[newRoom/MINROOM] == 'undefined' && newRoom > MINROOM && newRoom < MAXROOM))
        //what if no more rooms available?

        socket.leave('default');
        socket.join(newRoom);

        socket.room = newRoom;

        rooms[newRoom/MINROOM] = new Room(newRoom, myUsername, socket.id);
        console.log("Created Room" + newRoom);
        socket.emit('created', {room : newRoom , username : myUsername});
        io.in(newRoom).emit('update_page', rooms[newRoom/MINROOM].toString())

    })


    socket.on('left_room', (data) => {
        socket.leave(socket.room);
        socket.room = 'default';
        socket.username = null;
        socket.join('default');
    })

    socket.on('join_room', (data) => {
        let myUsername = data.username;
        let myRoom = data.room;
        socket.username = myUsername;
        socket.room = myRoom;

        if(!(rooms[myRoom/MINROOM] == null)){
            socket.leave('default');
            socket.join(myRoom)
            rooms[myRoom/MINROOM].members.push(new Member(myUsername, socket.id));
            socket.emit('joined', {room : myRoom , username : myUsername})
            io.in(myRoom).emit('update_page', {'html' : rooms[myRoom/MINROOM].toString()})
        }
        else{
            socket.emit('joined_failed', {message : "room 404"})
        }
        console.log(myUsername+socket.id+ " joined room "+myRoom);
        //socket.broadcast.emit('user_connected', {username : socket.username})
    })

    socket.on('hand_changed', (data) =>{
        //let myRoom = data.room;
        let myRoom = socket.room;
        //to do, make sure handstate is a bool
        console.log(socket.username+" changed their hand");
        if(!(rooms[myRoom/MINROOM] == null)){
            if(rooms[myRoom/MINROOM].setMemberHand(socket.id, data.handState))
                io.in(myRoom).emit('update_page', {'html' : rooms[myRoom/MINROOM].toString()})

            
        }

    })

    socket.on('disconnect', function() {
        console.log('Got disconnected!');

        if((socket.room !='default') && !(typeof rooms[socket.room/MINROOM] == 'undefined' || rooms[socket.room/MINROOM] == null)){
            console.log(rooms[socket.room/MINROOM])
            if(rooms[socket.room/MINROOM].ownerId == socket.id){
                io.in(socket.room).emit('leave_room')
                rooms[socket.room/MINROOM] = null;
            //broadcast to all users to go back to home screen
            //nullify the room
            }
            else{
            //not room owner, just a regular user
                rooms[socket.room/MINROOM].removeMember(socket.id);
                io.in(socket.room).emit('update_page', {'html' : rooms[socket.room/MINROOM].toString()})
            }
        }
        


     });

})
