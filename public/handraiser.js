M.AutoInit();
$(function () {

	const MAXNAMELENGTH = 15;
	//make connection
	let socket = io.connect('http://localhost:3000')

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
	let question_poll_prompts_yes = $("#question_poll_prompts_yes")
	let question_poll_prompts_maybe = $("#question_poll_prompts_maybe")
	let question_poll_prompts_no = $("#question_poll_prompts_no")

	let multiplechoice_poll = $("#multiplechoice_poll")
	let multiplechoice_poll_prompts_a = $("#multiplechoice_poll_prompts_a")
	let multiplechoice_poll_prompts_b = $("#multiplechoice_poll_prompts_b")
	let multiplechoice_poll_prompts_c = $("#multiplechoice_poll_prompts_c")
	let multiplechoice_poll_prompts_d = $("#multiplechoice_poll_prompts_d")


	let handRaised = false;
	let myRoom;
	let myUsername;
	let soundOn = true;

	//https://notificationsounds.com/notification-sounds/when-604
	//https://creativecommons.org/licenses/by/4.0/legalcode
	let handRaisedSound = new Audio('handRaisedSound.mp3');

	let currentNotif;
	let lastNotif = null;

	//https://stackoverflow.com/questions/31109581/javascript-timer-progress-bar
	function createProgressbar(id, duration, callback) {
		// We select the div that we want to turn into a progressbar
		var progressbar = document.getElementById(id);
		progressbar.className = 'progressbar';
	  
		// We create the div that changes width to show progress
		var progressbarinner = document.createElement('div');
		progressbarinner.className = 'inner';
	  
		// Now we set the animation parameters
		progressbarinner.style.animationDuration = duration;
	  
		// Eventually couple a callback
		if (typeof(callback) === 'function') {
		  progressbarinner.addEventListener('animationend', callback);
		}
	  
		// Append the progressbar to the main progressbardiv
		progressbar.appendChild(progressbarinner);
	  
		// When everything is set up we start the animation
		progressbarinner.style.animationPlayState = 'running';
	  }
	  

	//=============================================
	//			JOIN A ROOM
	//=============================================


	join_room.click(function () {
		if (username.val() && username.val().length <= MAXNAMELENGTH)
			socket.emit('join_room', { 'username': username.val(), 'room': room.val() })
		else
			M.toast({ html: 'Please enter a valid/ shorter name' })
	})

	socket.on('joined', (data) => {
		myRoom = data.room;
		myUsername = data.username;
		$("#room_id").append(myRoom);
		$("#CreateJoin").hide();
		$("#RoomView").show();
		$("#MemberFooter").show();

		M.toast({ html: `Joined room ${data.room}` })
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
	create_room.click(function () {
		if (username.val() && username.val().length <= MAXNAMELENGTH)
			socket.emit('create_room', { 'username': username.val() });
		else
			M.toast({ html: 'Please enter a valid/ shorter name' })

	})
	socket.on('created', (data) => {
		myRoom = data.room;
		myUsername = data.username;
		$("#room_id").append(myRoom);
		$("#CreateJoin").hide();
		$("#RoomView").show();
		$("#OwnerFooter").show();
		$("#sound_toggle").show();
		M.toast({ html: `Created room ${data.room}` })
		
		//prompt to share room id?
	})

	//=============================================
	//			INTERACTIONS
	//=============================================

	//-------------MEMBER--------------------------

	raise_hand.click(function () {
		handRaised = !handRaised;
		socket.emit('hand_changed', { 'handState': handRaised })
	})

	//------------OWNER----------------------------

	socket.on('member_hand_raised', (data) => {
		M.toast({html: `${data} raised their hand`})
		if(soundOn)
			handRaisedSound.play();
		//Visual notification
		//if a new notification appeared close the other one
		if(lastNotif != null){
			lastNotif.then(function(notification) {
				notification.close();
			});
		}
		//show notification
		currentNotif = Push.create(data+ " raised their hand", {
			silent: true
		});
		lastNotif = currentNotif;
	})

	$("#sound_toggle_button").click(function (){
		if(soundOn){
			soundOn = false;				//Sound is on, disable it and change the icon
			$("#sound_toggle_icon").html("volume_off");
		}
		else{
			soundOn = true;				//Sound is off, enable it and change the icon
			$("#sound_toggle_icon").html("volume_up");
		}
	})

	emote_poll.click(function () {
		$("#OwnerFooter").hide();
		socket.emit('start_poll', { 'poll_type': 'emote_poll' });
		M.toast({ html: `Started emote poll, poll will be over in 10 seconds` });
		createProgressbar('progressbar1', '10s');
		setTimeout(function () {
			socket.emit('get_poll_results', { 'poll_type': 'emote_poll' });
			$("#OwnerFooter").show();
		}, 10000);

	})
	question_poll.click(function () {
		$("#OwnerFooter").hide();
		socket.emit('start_poll', { 'poll_type': 'question_poll' });
		M.toast({ html: `Started question poll, poll will be over in 10 seconds` });
		createProgressbar('progressbar1', '10s');
		setTimeout(function () {
			socket.emit('get_poll_results', { 'poll_type': 'question_poll' });
			$("#OwnerFooter").show();
		}, 10000);

	})
	multiplechoice_poll.click(function () {
		$("#OwnerFooter").hide();
		socket.emit('start_poll', { 'poll_type': 'multiplechoice_poll' });
		M.toast({ html: `Started multiple choice poll, poll will be over in 10 seconds` });
		createProgressbar('progressbar1', '10s');
		setTimeout(function () {
			socket.emit('get_poll_results', { 'poll_type': 'multiplechoice_poll' });
			$("#OwnerFooter").show();
		}, 10000);

	})

	//=============================================
	//			UPDATE PAGE
	//=============================================

	socket.on('update_page', (data) => {
		connected_users.html(data.html);
	})

	//---------POLLS--------------------------------
	socket.on('ask_poll', (data) => {
		switch (data) {
			case 'emote_poll':
				$("#emote_poll_prompts").show();
				break;
			case 'question_poll':
				$("#question_poll_prompts").show();
				break;
			case 'multiplechoice_poll':
				$("#multiplechoice_poll_prompts").show();
				break;
			default: return;
		}
		createProgressbar('progressbar1', '10s');
	})
	socket.on('poll_results', (data) => {
		switch (data.poll_type) {
			case 'emote_poll':
				$("#emote_poll_prompts").hide();
				poll_results.show();

				//=========CHARTIST.JS=========
				new Chartist.Bar('.ct-chart', {
					labels: ['😄', '🙂', '😕'],
					series: [data.smile_count, data.meh_count, data.frown_count]
				}, 
				{ 
					distributeSeries: true, 
					axisY: {
						onlyInteger: true,
						offset: 20
					  } 
				});

				$("#poll_participation").html(`<p>Participation: ${data.response_count} / ${data.member_count}`)
				break;
			case 'question_poll':
				$("#question_poll_prompts").hide();
				poll_results.show();

				//=========CHARTIST.JS=========
				new Chartist.Bar('.ct-chart', {
					labels: ['Yes', 'Maybe/Not Sure', 'No'],
					series: [data.yes_count, data.maybe_count, data.no_count]
				}, 
				{ 
					distributeSeries: true, 
					axisY: {
						onlyInteger: true,
						offset: 20
					  } 
				});
				$("#poll_participation").html(`<p>Participation: ${data.response_count} / ${data.member_count}`)

				break;
			case 'multiplechoice_poll':
				$("#multiplechoice_poll_prompts").hide();
				poll_results.show();

				//=========CHARTIST.JS=========
				new Chartist.Bar('.ct-chart', {
					labels: ['A', 'B', 'C', 'D'],
					series: [data.a_count, data.b_count, data.c_count, data.d_count]
				}, 
				{ 
					distributeSeries: true, 
					axisY: {
						onlyInteger: true,
						offset: 20
					  } 
				});
				
				$("#poll_participation").html(`<p>Participation: ${data.response_count} / ${data.member_count}`)

				break;
			default: return;
		}
		$("#progressbar1").empty();
	})

	//--------------POLL RESPONSES-------------------
	//--------------EMOTE----------------------------
	emote_poll_prompts_smile.click(function () {
		socket.emit('poll_response', { 'poll_type': 'emote_poll', 'response': 'smile' });
		$("#emote_poll_prompts").hide();
	})
	emote_poll_prompts_meh.click(function () {
		socket.emit('poll_response', { 'poll_type': 'emote_poll', 'response': 'meh' });
		$("#emote_poll_prompts").hide();
	})
	emote_poll_prompts_frown.click(function () {
		socket.emit('poll_response', { 'poll_type': 'emote_poll', 'response': 'frown' });
		$("#emote_poll_prompts").hide();
	})
	//--------------QUESTION----------------------------
	question_poll_prompts_yes.click(function () {
		socket.emit('poll_response', { 'poll_type': 'question_poll', 'response': 'yes' });
		$("#question_poll_prompts").hide();
	})
	question_poll_prompts_no.click(function () {
		socket.emit('poll_response', { 'poll_type': 'question_poll', 'response': 'no' });
		$("#question_poll_prompts").hide();
	})
	question_poll_prompts_maybe.click(function () {
		socket.emit('poll_response', { 'poll_type': 'question_poll', 'response': 'maybe' });
		$("#question_poll_prompts").hide();
	})
	//--------------MULTIPLE CHOICE--------------------
	multiplechoice_poll_prompts_a.click(function () {
		socket.emit('poll_response', { 'poll_type': 'multiplechoice_poll', 'response': 'a' });
		$("#multiplechoice_poll_prompts").hide();
	})
	multiplechoice_poll_prompts_b.click(function () {
		socket.emit('poll_response', { 'poll_type': 'multiplechoice_poll', 'response': 'b' });
		$("#multiplechoice_poll_prompts").hide();
	})
	multiplechoice_poll_prompts_c.click(function () {
		socket.emit('poll_response', { 'poll_type': 'multiplechoice_poll', 'response': 'c' });
		$("#multiplechoice_poll_prompts").hide();
	})
	multiplechoice_poll_prompts_d.click(function () {
		socket.emit('poll_response', { 'poll_type': 'multiplechoice_poll', 'response': 'd' });
		$("#multiplechoice_poll_prompts").hide();
	})


	//=============================================
	//			ERROR
	//=============================================
	socket.on('client_error', (data) => {
		M.toast({ html: `Error: ${data}` });

	})

});