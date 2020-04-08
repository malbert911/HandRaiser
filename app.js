const express = require('express')
const app = express()
let rooms = [];
const MINROOM = 10000;
const MAXROOM = 99999
const MAXNAMELENGTH = 15;


//========================================================================
//                              CLASSES
//========================================================================
//------------------------------POLL CLASSES------------------------------
class EmotePoll {
    constructor(memberCount) {
        this.memberCount = memberCount;
        this.smileCount = 0;
        this.mehCount = 0;
        this.frownCount = 0;
        this.responsesCount = 0;
    }
    addSmile() {
        if (this.responsesCount < this.memberCount) {
            this.smileCount++;
            this.responsesCount++;
        }
    }
    addMeh() {
        if (this.responsesCount < this.memberCount) {
            this.mehCount++;
            this.responsesCount++;
        }
    }
    addFrown() {
        if (this.responsesCount < this.memberCount) {
            this.frownCount++;
            this.responsesCount++;
        }
    }


}
class QuestionPoll {
    constructor(memberCount) {
        this.memberCount = memberCount;
        this.yesCount = 0;
        this.noCount = 0;
        this.maybeCount = 0;
        this.responsesCount = 0;
    }
    addYes() {
        if (this.responsesCount < this.memberCount) {
            this.yesCount++;
            this.responsesCount++;
        }
    }
    addNo() {
        if (this.responsesCount < this.memberCount) {
            this.noCount++;
            this.responsesCount++;
        }
    }
    addMaybe() {
        if (this.responsesCount < this.memberCount) {
            this.maybeCount++;
            this.responsesCount++;
        }
    }
}
class MultipleChoicePoll {
    constructor(memberCount) {
        this.memberCount = memberCount;
        this.aCount = 0;
        this.bCount = 0;
        this.cCount = 0;
        this.dCount = 0;
        this.responsesCount = 0;
    }
    addA() {
        if (this.responsesCount < this.memberCount) {
            this.aCount++;
            this.responsesCount++;
        }
    }
    addB() {
        if (this.responsesCount < this.memberCount) {
            this.bCount++;
            this.responsesCount++;
        }
    }
    addC() {
        if (this.responsesCount < this.memberCount) {
            this.cCount++;
            this.responsesCount++;
        }
    }
    addD() {
        if (this.responsesCount < this.memberCount) {
            this.dCount++;
            this.responsesCount++;
        }
    }


}
//--------------------------MAIN CLASSES-----------------------------------
class Room {
    constructor(roomId, ownerName, ownerId) {
        this.id = roomId;
        this.ownerName = ownerName;
        this.ownerId = ownerId;
        this.members = [];
        this.ongoingPoll = false;
        this.emote_poll;
        this.question_poll;
        this.multiplechoice_poll;
    }

    setMemberHand(memberId, handState) {
        for (let i = 0; i < this.members.length; i++) {
            if (this.members[i].id == memberId) {
                this.members[i].handRaised = handState;
                return true;
            }
        }
        return false;
    }

    removeMember(id) {
        for (let i = 0; i < this.members.length; i++) {
            if (this.members[i].id == id) {
                this.members.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    toString() {
        let tmp = `<div class="Owner">${this.ownerName}</div>`;
        tmp += `<div class="StudentDesks">`;
        //Get the raised hand first so they appear on the top of the UI
        for (let i = 0; i < this.members.length; i++) {
            if (this.members[i].handRaised)
                tmp += `<div class="RaisedDesk">✋ ${this.members[i].username}</div>`;
        }
        for (let i = 0; i < this.members.length; i++) {
            if (!this.members[i].handRaised)
                tmp += `<div class="Desk">${this.members[i].username}</div>`
        }
        tmp += "</div>";
        if(this.members.length == 1 )   //Doing this check for grammar
            tmp += "<br/><p>1 Participant</p>";
        else
        tmp += `<br/><p>${this.members.length} Participants<p>`;
        return tmp;
    }
}
class Member {
    constructor(username, id) {
        this.username = username;
        this.handRaised = false;
        this.id = id;
    }
}

//========================================================================
//                              PRELIMINARIES
//========================================================================

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


//========================================================================
//                          MAIN CONNECTION
//========================================================================
//listen on every connection
io.on('connection', (socket) => {

    //-----------------"CONSTRUCTOR"--------------------------
    console.log(socket.id + ' connected')
    socket.room = 'default';
    socket.join('default')
    socket.isOwner = false;

    //========================================================================
    //                          ROOM MGMT
    //========================================================================
    //---------------------------------CREATE---------------------------------
    socket.on('create_room', (data) => {
        try {
            let newRoom;
            let myUsername = data.username.replace(/(<([^>]+)>)/ig,"");
            myUsername = myUsername.substring(0,MAXNAMELENGTH);

            //Find a new room
            do {
                newRoom = Math.floor(Math.random() * (MINROOM * 10));
            }
            while (!(typeof rooms[newRoom / MINROOM] == 'undefined' && newRoom > MINROOM && newRoom < MAXROOM))
            //what if no more rooms available?

            socket.leave('default');
            socket.join(newRoom);
            socket.room = newRoom;
            socket.isOwner = true;
            rooms[newRoom / MINROOM] = new Room(newRoom, myUsername, socket.id);
            console.log("Created Room" + newRoom);
            socket.emit('created', { room: newRoom, username: myUsername });
            io.in(newRoom).emit('update_page', rooms[newRoom / MINROOM].toString())
        }
        catch (error) {
            console.error(error);
            socket.emit('client_error', "Could not create room.");
        }

    })

    //---------------------------------JOIN---------------------------------
    socket.on('join_room', (data) => {
        try {
            if(socket.room == 'default'){
                let myUsername = data.username.replace(/(<([^>]+)>)/ig,"");     //Santize username
                //Username profanity filter could be added here
                myUsername = myUsername.substring(0,MAXNAMELENGTH);             //Truncate if it is too long (there is a client side check for this as well)
                if(isFinite(data.room) && (data.room > MINROOM) && (data.room < MAXROOM)){      //Make sure the room is a valid number
                    let myRoom = data.room;
                    if (!(rooms[myRoom / MINROOM] == null)) {   //Does the room exist?
                        socket.username = myUsername;           //Save the santized info to the socket itself
                        socket.room = myRoom;
                        socket.leave('default');
                        socket.join(myRoom);                    //Join the socket.io room
                        rooms[myRoom / MINROOM].members.push(new Member(myUsername, socket.id));            //Join the Room object
                        socket.emit('joined', { room: myRoom, username: myUsername })                       //Send join confirmation with santized info
                        io.in(myRoom).emit('update_page', { 'html': rooms[myRoom / MINROOM].toString() })   //Send the updated UI to all room memebers
                        console.log(myUsername + socket.id + " joined room " + myRoom);
                    }
                    else {
                        socket.emit('client_error', "Room not found.")
                    }
                }
                else{
                    socket.emit('client_error', "Invalid room entered.")    //Room was not a number or out of range
                }

            }
            else{
                socket.emit('client_error', "You are already part of a room. Refresh the page if this message persists.")
            }

        }
        catch (error) {
            console.error(error);
            socket.emit('client_error', "Could not join room.");
        }
    })
    //---------------------------------LEAVE---------------------------------
    socket.on('left_room', (data) => {
        try {
            socket.leave(socket.room);
            socket.room = 'default';
            socket.username = null;
            socket.join('default');
        }
        catch (error) {
            console.error(error);
            socket.emit('client_error', "Could not leave room.");
        }
    })





    //========================================================================
    //                          POLLS
    //========================================================================
    socket.on('start_poll', (data) => {
        try {
            //make sure request came from room owner
            if (rooms[socket.room / MINROOM].ownerId == socket.id) {
                switch (data.poll_type) {
                    case 'emote_poll':
                        //setup new emote poll
                        rooms[socket.room / MINROOM].emote_poll = new EmotePoll(rooms[socket.room / MINROOM].members.length);
                        rooms[socket.room / MINROOM].ongoingPoll = true;
                        //send to all except sender
                        socket.to(socket.room).emit('ask_poll', "emote_poll");
                        break;
                    case 'question_poll':
                        rooms[socket.room / MINROOM].question_poll = new QuestionPoll(rooms[socket.room / MINROOM].members.length);
                        rooms[socket.room / MINROOM].ongoingPoll = true;
                        //send to all except sender(room owner)
                        socket.to(socket.room).emit('ask_poll', "question_poll");
                        break;
                    case 'multiplechoice_poll':
                        rooms[socket.room / MINROOM].multiplechoice_poll = new MultipleChoicePoll(rooms[socket.room / MINROOM].members.length);
                        rooms[socket.room / MINROOM].ongoingPoll = true;
                        //send to all except sender(room owner)
                        socket.to(socket.room).emit('ask_poll', "multiplechoice_poll");
                        break;

                    default: return;
                }

                
            }
        }
        catch (error) {
            console.error(error);
            socket.emit('client_error', "Could not start poll.");
        }
    })

    socket.on('poll_response', (data) => {
        try {
            if (rooms[socket.room / MINROOM].ongoingPoll){
                switch (data.poll_type) {
                    case 'emote_poll':
                        
                            switch (data.response) {
                                case 'smile':
                                    rooms[socket.room / MINROOM].emote_poll.addSmile();
                                    break;
                                case 'meh':
                                    rooms[socket.room / MINROOM].emote_poll.addMeh();
                                    break;
                                case 'frown':
                                    rooms[socket.room / MINROOM].emote_poll.addFrown();
                                    break;
                                default:
                                    socket.emit('client_error', "Invalid response of this type of poll"); 
                                    break;
                            }
                        break;
                    case 'question_poll':
                            switch (data.response) {
                                case 'yes':
                                    rooms[socket.room / MINROOM].question_poll.addYes();
                                    break;
                                case 'no':
                                    rooms[socket.room / MINROOM].question_poll.addNo();
                                    break;
                                case 'maybe':
                                    rooms[socket.room / MINROOM].question_poll.addMaybe();
                                    break;
                                default:
                                    socket.emit('client_error', "Invalid response of this type of poll"); 
                                    break;
                            }
                        break;
                    case 'multiplechoice_poll':
                            switch (data.response) {
                                case 'a':
                                    rooms[socket.room / MINROOM].multiplechoice_poll.addA();
                                    break;
                                case 'b':
                                    rooms[socket.room / MINROOM].multiplechoice_poll.addB();
                                    break;
                                case 'c':
                                    rooms[socket.room / MINROOM].multiplechoice_poll.addC();
                                    break;
                                case 'd':
                                    rooms[socket.room / MINROOM].multiplechoice_poll.addD();
                                    break;
                                default:
                                    socket.emit('client_error', "Invalid response of this type of poll"); 
                                    break;
                            }
                        break;
                    default:
                        socket.emit('client_error', "Invalid poll type"); 
                        break;
                }
            }
            else{
                socket.emit('client_error', "Poll has already ended"); 
            }

        }
        catch (error) {
            console.error(error);
            socket.emit('client_error', "Could not process response.");
        }
    })
    socket.on('get_poll_results', (data) => {
        try {
            //make sure request came from room owner
            if (rooms[socket.room / MINROOM].ownerId == socket.id){
                switch (data.poll_type) {
                    case 'emote_poll':
                        if (rooms[socket.room / MINROOM].ongoingPoll) {
                            console.log("Sending emote poll results for room " + socket.room);
                            io.in(socket.room).emit('poll_results', { 'poll_type': 'emote_poll', 'member_count': rooms[socket.room / MINROOM].emote_poll.memberCount, 'response_count': rooms[socket.room / MINROOM].emote_poll.responsesCount, 'smile_count': rooms[socket.room / MINROOM].emote_poll.smileCount, 'meh_count': rooms[socket.room / MINROOM].emote_poll.mehCount, 'frown_count': rooms[socket.room / MINROOM].emote_poll.frownCount });
                            rooms[socket.room / MINROOM].emote_poll = null;
                            rooms[socket.room / MINROOM].ongoingPoll = false;
                        }
                        break;
                    case 'question_poll':
                        if (rooms[socket.room / MINROOM].ongoingPoll) {
                            rooms[socket.room / MINROOM].question_poll.ongoing = false;
                            console.log("Sending question poll results for room " + socket.room);
                            io.in(socket.room).emit('poll_results', { 'poll_type': 'question_poll', 'member_count': rooms[socket.room / MINROOM].question_poll.memberCount, 'response_count': rooms[socket.room / MINROOM].question_poll.responsesCount, 'yes_count': rooms[socket.room / MINROOM].question_poll.yesCount, 'maybe_count': rooms[socket.room / MINROOM].question_poll.maybeCount, 'no_count': rooms[socket.room / MINROOM].question_poll.noCount });
                            rooms[socket.room / MINROOM].question_poll = null;
                            rooms[socket.room / MINROOM].ongoingPoll = false;
                        }
                        break;
                    case 'multiplechoice_poll':
                        if (rooms[socket.room / MINROOM].ongoingPoll) {
                            console.log("Sending multiplechoice poll results for room " + socket.room);
                            io.in(socket.room).emit('poll_results', { 'poll_type': 'multiplechoice_poll', 'member_count': rooms[socket.room / MINROOM].multiplechoice_poll.memberCount, 'response_count': rooms[socket.room / MINROOM].multiplechoice_poll.responsesCount, 'a_count': rooms[socket.room / MINROOM].multiplechoice_poll.aCount, 'b_count': rooms[socket.room / MINROOM].multiplechoice_poll.bCount, 'c_count': rooms[socket.room / MINROOM].multiplechoice_poll.cCount, 'd_count': rooms[socket.room / MINROOM].multiplechoice_poll.dCount });
                            rooms[socket.room / MINROOM].question_poll = null;
                            rooms[socket.room / MINROOM].ongoingPoll = false;
                        }
                        break;
                    default: return;
                }
            }
            
        }
        catch (error) {
            console.error(error);
            socket.emit('client_error', "Could not get poll results.");
        }
    })

    //========================================================================
    //                          MISC.
    //========================================================================
    socket.on('hand_changed', (data) => {
        try {
            let myRoom = socket.room;
            //to do, make sure handstate is a bool. Is this really though?
            console.log(socket.username + " changed their hand");
            if (!(rooms[myRoom / MINROOM] == null)) {
                if (rooms[myRoom / MINROOM].setMemberHand(socket.id, data.handState))
                    io.in(myRoom).emit('update_page', { 'html': rooms[myRoom / MINROOM].toString() })
                    if(data.handState)
                        io.in(rooms[myRoom / MINROOM].ownerId).emit('member_hand_raised', socket.username);
            }
        }
        catch (error) {
            console.error(error);
            socket.emit('client_error', "Could not change hand state.");
        }

    })


    socket.on('disconnect', function () {
        try {
            //Was the client part of a room?
            if (socket.room != 'default') {
                //Did the owner just leave?
                if (socket.isOwner) {
                    io.in(socket.room).emit('leave_room')       //broadcast to all users to go back to home screen
                    rooms[socket.room / MINROOM] = null;        //nullify the room so it can be used latter
                    console.log("Room " + socket.room + " has been removed")


                }
                else {
                    //Not room owner, just a regular user
                    //Is their room null? (Already Deleted)
                    if(!(rooms[socket.room / MINROOM] == null)){
                        rooms[socket.room / MINROOM].removeMember(socket.id);   //Room is still active, remove the user
                        io.in(socket.room).emit('update_page', { 'html': rooms[socket.room / MINROOM].toString() });//Update others in room that they have left
                    }
                        
                }
            }
        }
        catch (error) {
            console.error(error);
        }



    });

})
