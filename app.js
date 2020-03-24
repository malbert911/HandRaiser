const express = require('express')
const app = express()
let rooms = [];
const MINROOM = 10000;
const MAXROOM = 99999

class EmotePoll{
    constructor(memberCount){
        this.memberCount = memberCount;
        this.smileCount = 0;
        this.mehCount = 0;
        this.frownCount = 0;
        this.responsesCount = 0;
        this.ongoing = true;
    }
    addSmile(){
        if(this.responsesCount < this.memberCount){
            this.smileCount++;
            this.responsesCount++;
        }
    }
    addMeh(){
        if(this.responsesCount < this.memberCount){
            this.mehCount++;
            this.responsesCount++;
        }
    }
    addFrown(){
        if(this.responsesCount < this.memberCount){
            this.frownCount++;
            this.responsesCount++;
        }
    }


}

class Room{
    constructor(roomId, ownerName, ownerId){
        this.id = roomId;
        this.ownerName = ownerName;
        this.ownerId = ownerId;
        this.members = [];
        this.emote_poll;
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

    socket.on('start_poll', (data) => {
        //make sure request came from room owner
        if(rooms[socket.room/MINROOM].ownerId == socket.id){
            switch (data.poll_type){
                case 'emote_poll':
                    //setup new emote poll
                    rooms[socket.room/MINROOM].emote_poll = new EmotePoll(rooms[socket.room/MINROOM].members.length);
                    //send to all except sender
                    socket.to(socket.room).emit('ask_poll',"emote_poll");
                    break;

                default: return;
            }
        }
    })

    socket.on('poll_response', (data) =>{
        console.log("client responded")
        switch(data.poll_type){
            case 'emote_poll':
                if(rooms[socket.room/MINROOM].emote_poll.ongoing)
                    switch (data.response){
                        case 'smile':
                            rooms[socket.room/MINROOM].emote_poll.addSmile();
                            break;
                        case 'meh':
                            rooms[socket.room/MINROOM].emote_poll.addMeh();
                            break;
                        case 'frown':
                            rooms[socket.room/MINROOM].emote_poll.addFrown();
                            break;
                        default: return;                                        
                }
                break;
            default: return;
        }
    })
    socket.on('get_poll_results', (data) =>{
        console.log("poll times up")
        switch(data.poll_type){
            case 'emote_poll':
                if(rooms[socket.room/MINROOM].emote_poll.ongoing){
                    rooms[socket.room/MINROOM].emote_poll.ongoing = false;
                    console.log("sending poll results");
                    io.in(socket.room).emit('poll_results',{ 'poll_type' : 'emote_poll', 'member_count': rooms[socket.room/MINROOM].emote_poll.memberCount , 'response_count' : rooms[socket.room/MINROOM].emote_poll.responsesCount, 'smile_count':rooms[socket.room/MINROOM].emote_poll.smileCount, 'meh_count': rooms[socket.room/MINROOM].emote_poll.mehCount, 'frown_count' : rooms[socket.room/MINROOM].emote_poll.frownCount });
                    rooms[socket.room/MINROOM].emote_poll = null;
                }
            break;

            default: return;
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
