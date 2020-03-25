M.AutoInit();
$(function(){
   	//make connection
	var socket = io.connect('http://localhost:3000')

	//buttons and inputs
	let username = $("#input_username")
	let room = $("#input_room_id")
	let join_room = $("#join_room")
	let create_room = $("#create_room")

	var connected_users = $("#MainView")
	var raise_hand = $("#raise_hand")

	let poll_prompt = $("#poll_prompt")
	let poll_results = $("#poll_results")
	let poll_results_content = $("#poll_results_content")

	var emote_poll = $("#emote_poll")
	var emote_poll_prompts_smile = $("#emote_poll_prompts_smile")
	var emote_poll_prompts_meh = $("#emote_poll_prompts_meh")
	var emote_poll_prompts_frown = $("#emote_poll_prompts_frown")

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
		$("#room_id").append(myRoom);
		$("#CreateJoin").hide();
		$("#RoomView").show();
		$("#MemberFooter").show();
		
		M.toast({html: `Joined room ${data.room}`})
		//go to room page
	})

	//=============================================
	//			LEAVE A ROOM
	//=============================================

	socket.on('leave_room', (data) => {
		alert("session has ended")
		window.location.reload(true); 
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
		$("#room_id").append(myRoom);
		$("#CreateJoin").hide();
		$("#RoomView").show();
		$("#OwnerFooter").show();
		M.toast({html: `Created room ${data.room}`})
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
		socket.emit('start_poll', {'poll_type' : 'emote_poll'});
		M.toast({html: `Started Emote Poll, poll will be over in 5 seconds`});
		setTimeout(function () {
			socket.emit('get_poll_results', {'poll_type' : 'emote_poll'});
		}, 5000);
		
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
				//M.toast({html: `Emote Poll Started, please vote.`});

				$("#emote_poll_prompts").show();
				break;

			default: return;
		}          
	})
	socket.on('poll_results', (data) => {
		console.log("got back poll results");
		switch (data.poll_type){
			case 'emote_poll':
			console.log("was emote poll");
			$("#emote_poll_prompts").hide();
			poll_results.show();
			//=========CHARTIST.JS=========
			  new Chartist.Bar('.ct-chart', {
				labels: ['😄', '🙂', '😕'],
				series: [data.smile_count, data.meh_count, data.frown_count]
			  }, {
				distributeSeries: true
			  });
			  
			
			

			//poll_results_content.html(`<p>Participated: ${data.response_count} / ${data.member_count} Smiles: ${data.smile_count} Meh: ${data.meh_count} Frowns: ${data.frown_count}</p>`);
			console.log("showed results");
			break;
			default: return;
		}
	})

	//--------------POLL RESPONSES-------------------
	//--------------EMOTE----------------------------
	emote_poll_prompts_smile.click(function(){
		socket.emit('poll_response', { 'poll_type' : 'emote_poll', 'response' : 'smile'});
		$("#emote_poll_prompts").hide();
	})
	emote_poll_prompts_meh.click(function(){
		socket.emit('poll_response', { 'poll_type' : 'emote_poll', 'response' : 'meh'});
		$("#emote_poll_prompts").hide();
	})
	emote_poll_prompts_frown.click(function(){
		socket.emit('poll_response', { 'poll_type' : 'emote_poll', 'response' : 'frown'});
		$("#emote_poll_prompts").hide();
	})

	//=============================================
	//			ERROR
	//=============================================
	socket.on('client_error', (data) => {
		M.toast({html: `Error: ${data}`});
     
	})	

});