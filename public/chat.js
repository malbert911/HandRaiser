var users;
$(function(){
   	//make connection
	var socket = io.connect('http://localhost:3000')

	//buttons and inputs
	var message = $("#message")
	var username = $("#username")
	var room = $("#room")
	var join_room = $("#join_room")
	var create_room = $("#create_room")
	var send_message = $("#send_message")
	var send_username = $("#send_username")
	var chatroom = $("#chatroom")
	var feedback = $("#feedback")
	var connected_users = $("#connected_users")
	var raise_hand = $("#raise_hand")
	var poll_prompt = $("#poll_prompt")
	var emote_poll = $("#emote_poll")
	var oneten_poll = $("#oneten_poll")
	var boolean_poll = $("#boolean_poll")
	var yesno_poll = $("#yesno_poll")
	
	let handRaised  = false;
	let myRoom;
	let myUsername;



	//=============================================
	//			JOIN A ROOM
	//=============================================


	join_room.click(function(){
		//TODO
		//make sure input is valid
		socket.emit('join_room', {'username' : username.val(), 'room' : room.val()})
	})

	socket.on('joined', (data) =>{
		myRoom = data.room;
		myUsername = data.username;
		//go to room page
	})
	socket.on('joined_failed', (data) =>{
		//oops
		alert("sorry we coulnt join ya, double check your room number buddy")
	})

	//=============================================
	//			LEAVE A ROOM
	//=============================================

	socket.on('leave_room', (data) => {
		alert("session has ended")
		//owner left room, room is no longer valid, send them back to the homepage
	})
	

	//=============================================
	//			CREATE A ROOM
	//=============================================
	create_room.click(function(){
		//TODO
		//make sure field not empty
		socket.emit('create_room', {'username' : username.val()});
	})
	socket.on('created', (data) =>{
		myRoom = data.room;
		myUsername = data.username;
		alert(myRoom);
		//go to owner layout
		//prompt to share room id?
	})

	//=============================================
	//			INTERACTIONS
	//=============================================

	//-------------MEMBER--------------------------

	raise_hand.click(function(){
		handRaised = !handRaised;
		socket.emit('hand_changed', { 'handState' : handRaised})
	})

	//------------OWNER----------------------------

	emote_poll.click(function(){
		socket.emit('start_poll', {'poll_type' : 'emote_poll'})
	})

	//=============================================
	//			UPDATE PAGE
	//=============================================

	socket.on('update_page', (data) =>{
		connected_users.html(data.html);
	})

	//---------POLLS--------------------------------
	socket.on('ask_poll', (data) => {
        switch (data){
			case 'emote_poll':
				//setup new emote poll
				poll_prompt.html = '';
				poll_prompt.append(`<button onclick="poll_prompt.html=''; socket.emit('poll_response', { 'poll_type' : 'emote_poll', 'response' : 'smile'});">smile</button>`)
				poll_prompt.append(`<button onclick="poll_prompt.html=''; socket.emit('poll_response', { 'poll_type' : 'emote_poll', 'response' : 'meh'});">meh</button>`)
				poll_prompt.append(`<button onclick="poll_prompt.html=''; socket.emit('poll_response', { 'poll_type' : 'emote_poll', 'response' : 'frown'});">frown</button>`)
				break;

			default: return;
		}

            
    })

});


