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
	
	let handRaised  = false;
	let myRoom;
	let myUsername;


	join_room.click(function(){
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

	socket.on('leave_room', (data) => {
		alert("session has ended")
		//owner left room, room is no longer valid, send them back to the homepage
	})
	
	create_room.click(function(){
		//make sure field not empty
		//
		socket.emit('create_room', {'username' : username.val()});
	})
	socket.on('created', (data) =>{
		myRoom = data.room;
		myUsername = data.username;
		alert(myRoom);
		//go to owner layout
		//prompt to share room id?
	})

	raise_hand.click(function(){
		handRaised = !handRaised;
		socket.emit('hand_changed', { 'handState' : handRaised})
	})

	socket.on('update_page', (data) =>{
		connected_users.html(data.html);
	})

});


