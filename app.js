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

    socket.on('create_room', (data) =>{
        let newRoom;
        let myUsername = data.username;
        
        do{
            newRoom = Math.floor(Math.random() * (MINROOM*10));
            console.log(newRoom);
        }
        while(!(typeof rooms[newRoom/MINROOM] == 'undefined' && newRoom > MINROOM && newRoom < MAXROOM))
        //what if no more rooms available?

        socket.join(newRoom)
        rooms[newRoom/MINROOM] = new Room(newRoom, myUsername, socket.id);
        console.log("Created Room" + newRoom);
        socket.emit('created', {room : newRoom , username : myUsername});
        io.in(newRoom).emit('update_page', rooms[newRoom/MINROOM].toString())

    })


    socket.on('join_room', (data) => {
        let myUsername = data.username;
        let myRoom = data.room;
        socket.username = myUsername;

        if(!(rooms[myRoom/MINROOM] == null)){
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
        let myRoom = data.room;
        //to do, make sure handstate is a bool
        console.log(socket.username+" changed their hand");
        if(!(rooms[myRoom/MINROOM] == null)){
            if(rooms[myRoom/MINROOM].setMemberHand(socket.id, data.handState))
                io.in(myRoom).emit('update_page', {'html' : rooms[myRoom/MINROOM].toString()})

            
        }

    })

})
