M.AutoInit();
$(function(){
   	//make connection
	var socket = io.connect('http://localhost:3000')

	//buttons and inputs
	let username = $("#input_username")
	let room = $("#input_room_id")
	let join_room = $("#join_room")
	let create_room = $("#create_room")

	let connected_users = $("#MainView")
	let raise_hand = $("#raise_hand")

	let poll_prompt = $("#poll_prompt")
	let poll_results = $("#poll_results")
	let poll_results_content = $("#poll_results_content")

	let emote_poll = $("#emote_poll")
	let emote_poll_prompts_smile = $("#emote_poll_prompts_smile")
	let emote_poll_prompts_meh = $("#emote_poll_prompts_meh")
	let emote_poll_prompts_frown = $("#emote_poll_prompts_frown")

	let question_poll = $("#question_poll")
	let questione_poll_prompts_yes = $("#question_poll_prompts_smile")
	let question_poll_prompts_maybe = $("#question_poll_prompts_maybe")
	let question_poll_prompts_no = $("#question_poll_prompts_no")

	let oneten_poll = $("#oneten_poll")
	let boolean_poll = $("#boolean_poll")
	let yesno_poll = $("#yesno_poll")
	
	let handRaised  = false;
	let myRoom;
	let myUsername;



	//=============================================
	//			JOIN A ROOM
	//=============================================


	join_room.click(function(){
		if( username.val() )
			socket.emit('join_room', {'username' : username.val(), 'room' : room.val()})
		else
			M.toast({html: 'Please enter a name'})
	})

	socket.on('joined', (data) =>{
		myRoom = data.room;
		myUsername = data.username;
		$("#room_id").append(myRoom);
		$("#CreateJoin").hide();
		$("#RoomView").show();
		$("#MemberFooter").show();
		
		M.toast({html: `Joined room ${data.room}`})
	})

	//=============================================
	//			LEAVE A ROOM
	//=============================================

	socket.on('leave_room', (data) => {
		alert("Session has ended. The room owner has left the room.")
		window.location.reload(true); 
		//owner left room, room is no longer valid, send them back to the homepage
	})
	

	//=============================================
	//			CREATE A ROOM
	//=============================================
	create_room.click(function(){
		if( username.val() )
			socket.emit('create_room', {'username' : username.val()});
		else
			M.toast({html: 'Please enter a name'})
		
	})
	socket.on('created', (data) =>{
		myRoom = data.room;
		myUsername = data.username;
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
		$("#OwnerFooter").hide();
		socket.emit('start_poll', {'poll_type' : 'emote_poll'});
		M.toast({html: `Started emote poll, poll will be over in 5 seconds`});
		setTimeout(function () {
			socket.emit('get_poll_results', {'poll_type' : 'emote_poll'});
			$("#OwnerFooter").show();
		}, 5000);
		
	})
	question_poll.click(function(){
		$("#OwnerFooter").hide();
		socket.emit('start_poll', {'poll_type' : 'question_poll'});
		M.toast({html: `Started question poll, poll will be over in 5 seconds`});
		setTimeout(function () {
			socket.emit('get_poll_results', {'poll_type' : 'question_poll'});
			$("#OwnerFooter").show();
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
				$("#emote_poll_prompts").show();
				break;
			case 'question_poll':
				$("#question_poll_prompts").show();
				break;
			default: return;
		}          
	})
	socket.on('poll_results', (data) => {
		switch (data.poll_type){
			case 'emote_poll':
			$("#emote_poll_prompts").hide();
			poll_results.show();

			//=========CHARTIST.JS=========
			new Chartist.Bar('.ct-chart', {
				labels: ['😄', '🙂', '😕'],
				series: [data.smile_count, data.meh_count, data.frown_count]
			}, {distributeSeries: true });
			  
			$("#poll_participation").html(`<p>Participation: ${data.response_count} / ${data.member_count}`)
			break;
			case 'question_poll':
				$("#question_poll_prompts").hide();
				poll_results.show();
	
				//=========CHARTIST.JS=========
				new Chartist.Bar('.ct-chart', {
					labels: ['Yes', 'Maybe/Not Sure', 'No'],
					series: [data.yes_count, data.maybe_count, data.no_count]
				}, {distributeSeries: true });
				  
				$("#poll_participation").html(`<p>Participation: ${data.response_count} / ${data.member_count}`)
	
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
	//--------------QUESTION----------------------------
	question_poll_prompts_yes.click(function(){
		socket.emit('poll_response', { 'poll_type' : 'question_poll', 'response' : 'yes'});
		$("#question_poll_prompts").hide();
	})
	question_poll_prompts_no.click(function(){
		socket.emit('poll_response', { 'poll_type' : 'question_poll', 'response' : 'no'});
		$("#question_poll_prompts").hide();
	})
	question_poll_prompts_maybe.click(function(){
		socket.emit('poll_response', { 'poll_type' : 'question_poll', 'response' : 'maybe'});
		$("#question_poll_prompts").hide();
	})


	//=============================================
	//			ERROR
	//=============================================
	socket.on('client_error', (data) => {
		M.toast({html: `Error: ${data}`});
     
	})	

});