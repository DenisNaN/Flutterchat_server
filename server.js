const users = {};
const rooms = {};
const hostname = '127.0.0.1';
const port = 3000;

const io = require("socket.io")(
	require("http").createServer(
		function() {}
	).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
	}));

io.on("connection", client => {
	console.log("Connection established with a client");
	
	client.on("validate", (inData, inCallback) => {
		
		const user = users[inData.userName];
		if(user){
			if(user.password === inData.password){
				inCallback({status : "ok" });
			} else {
				inCallback({status : "fail" });
			}
		} else {
			users[inData.userName] = inData;
			
			io.emit("newUser", users);
			inCallback({status : "created" });
		}
	});

	client.on("create", (inData, inCallback) => {
		if(rooms[inData.roomName]){
			inCallback({status : "exists" });
		} else {
			inData.users = {};
			rooms[inData.roomName] = inData;
			
			io.emit("created", rooms);
			inCallback({status : "created", rooms : rooms});
		}
	});

	client.on("listRooms", (inData, inCallback) => {
		inCallback(rooms);
	});

	client.on("listUsers", (inData, inCallback) => {
		inCallback(users);
	});

	client.on("join", (inData, inCallback) => {
		const room = rooms[inData.roomName];
		if(Object.keys(room.users).length >= rooms.maxPeople){
			inCallback({status : "full"});
		} else {
			room.users[inData.userName] = users[inData.userName];
			
			io.emit("joined", room);
			inCallback({status : "joined", room : room});
		}
	});

	client.on("post", (inData, inCallback) => {
		io.emit("posted", inData);
		inCallback({status : "ok"});
	});

	client.on("invite", (inData, inCallback) => {
		io.emit("invited", inData);
		inCallback({status : "ok"});
	});

	client.on("leave", (inData, inCallback) => {
		const room = rooms[inData.roomName];
		console.log(room.users[inData.userName]);
		delete room.users[inData.userName];
		
		console.log(room);
		
		io.emit("left", room);
		inCallback({status : "ok"});
	});

	client.on("close", (inData, inCallback) => {
		delete rooms[inData.roomName];
		
		io.emit("closed", {roomName : inData.roomName, rooms : rooms});
		//io.emit("closed", {roomName : inData.roomName, rooms : rooms});
		inCallback(rooms);
	});

	client.on("kick", (inData, inCallback) => {
		const room = rooms[inData.roomName];
		const users = room.users;
		
		delete users[inData.userName];
		io.emit("kicked", room);
		inCallback({status : "ok"});
	});

});
