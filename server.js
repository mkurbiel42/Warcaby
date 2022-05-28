var express = require("express");
var app = express();
const PORT = process.env.PORT || 3000;
var path = require("path");

app.use(express.json());
app.use(express.static("static")); // serwuje stronę index.html

let loggedUsers = [];
let currentMove = "white";
let timeLeft = 30;
let timerInterval;
let lastMove;
let winner;

// const INIT_BOARD = [
// 	[0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 2, 0],
// 	[0, 1, 0, 1, 0, 1, 0, 1],
// 	[1, 0, 1, 0, 1, 0, 1, 0],
// ];

const INIT_BOARD = [
	[0, 2, 0, 2, 0, 2, 0, 2],
	[2, 0, 2, 0, 2, 0, 2, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 1, 0, 1, 0, 1, 0, 1],
	[1, 0, 1, 0, 1, 0, 1, 0]
];

let currentBoard = [...INIT_BOARD];

const startTimer = () => {
	timeLeft = 30;
	if (timerInterval) clearInterval(timerInterval);

	timerInterval = setInterval(() => {
		if (timeLeft != 0) {
			timeLeft--;
			return;
		}

		winner = currentMove == "white" ? "black" : "white";
		clearInterval(timerInterval);
	}, 1000);
};

app.post("/login", (req, res) => {
	let newUsername = req.body.username;

	if (loggedUsers.length == 2) {
		res.send({
			status: "LOGIN_INVALID",
			status_message: "W grze uczestniczy już dwóch graczy"
		});
		return;
	}

	if (newUsername == "") {
		res.send({
			status: "LOGIN_INVALID",
			status_message: "Nazwa użytkownika nie może być pusta"
		});
		return;
	}

	if (loggedUsers.includes(newUsername)) {
		res.send({
			status: "LOGIN_INVALID",
			status_message: "Podana nazwa użytkownika jest już zajęta"
		});
		return;
	}

	loggedUsers.push(newUsername);

	if (loggedUsers.length == 1) {
		res.send({
			status: "LOGIN_VALID - FIRST",
			status_message: `Witaj, ${newUsername}. Grasz białymi`,
			player: loggedUsers.length
		});
	} else {
		startTimer();
		res.send({
			status: "LOGIN_VALID - SECOND",
			status_message: `Witaj, ${newUsername}. Grasz czarnymi`,
			player: loggedUsers.length
		});
	}
});

app.post("/playersCount", (req, res) => {
	res.send({
		players: loggedUsers.length,
		names: loggedUsers
	});
});

app.post("/playerMoved", (req, res) => {
	currentBoard = req.body.board;

	if (
		JSON.stringify(currentBoard).indexOf("1") == -1 ||
		JSON.stringify(currentBoard).indexOf("2") == -1
	) {
		winner = currentMove;
	}

	currentMove = currentMove === "white" ? "black" : "white";
	startTimer();
	lastMove = {
		oldPos: req.body.oldPos,
		newPos: req.body.newPos
	};

	res.send({
		status: "MOVE_VALID",
		currentMove,
		currentBoard
	});
});

app.post("/getCurrentData", (req, res) => {
	res.send({ currentBoard, currentMove, lastMove, winner });
});

app.post("/getTimeLeft", (req, res) => {
	res.send({ timeLeft });
});

app.post("/reset", (req, res) => {
	loggedUsers = [];
	currentBoard = [...INIT_BOARD];
	currentMove = "white";
	winner = null;
	res.send({
		status: "LOGINS_RESET",
		status_message: "Gra została zresetowana"
	});
});

app.listen(PORT, function () {
	console.log("start serwera na porcie " + PORT);
});
