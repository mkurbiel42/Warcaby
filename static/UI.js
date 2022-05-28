class UI {
	constructor() {
		this.timerInterval;
		this.UIDrawn = false;
		this.rootElement = document.getElementById("root");

		this.UIBox = document.createElement("div");
		this.UIBox.id = "ui";

		this.loginBox = document.createElement("div");
		this.loginBox.id = "loginBox";

		this.usernameInput = document.createElement("input");
		this.loginButton = document.createElement("button");
		this.resetButton = document.createElement("button");

		this.loginButton.innerText = "LOGUJ";
		this.resetButton.innerText = "RESET";

		this.loginBox.innerText = "LOGOWANIE";
		this.loginBox.appendChild(this.usernameInput);
		this.loginBox.appendChild(this.loginButton);
		this.loginBox.appendChild(this.resetButton);

		this.statusBar = document.createElement("div");
		this.statusBar.id = "statusBar";

		this.status = document.createElement("span");
		this.statusMessage = document.createElement("span");
		this.status.innerText = "STATUS";

		this.statusBar.appendChild(this.status);
		this.statusBar.appendChild(this.statusMessage);

		this.UIBox.appendChild(this.statusBar);
		this.rootElement.appendChild(this.UIBox);

		this.boardPreviewBox = document.createElement("div");
		this.boardPreviewBox.id = "boardPreviewBox";

		this.timerBox = document.createElement("div");
		this.timerBox.id = "timerBox";

		this.timerLabel = document.createElement("div");
		this.timerLabel.id = "timerLabel";
		this.timerLabel.innerText = "Oczekiwanie na ruch przeciwnika...";

		this.timeCounter = document.createElement("div");
		this.timeCounter.id = "timeCounter";

		this.timerBox.appendChild(this.timerLabel);
		this.timerBox.appendChild(this.timeCounter);

		this.opponentAwaitBox = document.createElement("div");
		this.opponentAwaitBox.id = "opponentAwaitBox";

		this.opponentAwaitLabel = document.createElement("span");
		this.opponentAwaitLabel.id = "opponentAwaitLabel";
		this.opponentAwaitLabel.innerText = "Oczekiwanie na przeciwnika...";

		this.opponentAwaitBox.appendChild(this.opponentAwaitLabel);

		this.showLoginBox();
		this.bindEvents();
	}

	bindEvents() {
		this.loginButton.addEventListener("click", () => {
			window.net.logIn(this.getUsername(), (data) => {
				console.log(data);
				if (data.status === "LOGIN_VALID - FIRST") {
					this.destroyLoginBox();
					this.UIBox.appendChild(this.opponentAwaitBox);
					this.waitForOponnent = setInterval(() => {
						window.net.checkForOponnent((data) => {
							if (data.players == 2) {
								clearInterval(this.waitForOponnent);
								window.game.pawnsColor = "white";
								window.game.colorId = 1;
								window.net.waitForUpdates();
								this.destroyUI();
								this.opponentAwaitBox.remove();
								this.renderGame(window.game.pawnsColor);
								this.initBoardPreview();
								this.addToStatusMessage(
									`\nDołączył gracz ${data.names[1]}. Gra czarnymi`
								);
							}
						});
					}, 500);
				}

				if (data.status === "LOGIN_VALID - SECOND") {
					window.game.pawnsColor = "black";
					window.game.colorId = 2;
					this.destroyLoginBox();
					this.destroyUI();
					this.renderGame(window.game.pawnsColor);
					window.net.waitForUpdates();
					this.startTimer();
					this.initBoardPreview();
					this.setStatus(data.status);
					this.setStatusMessage(data.status_message);
					return;
				}

				this.setStatus(data.status);
				this.setStatusMessage(data.status_message);
			});
		});

		this.resetButton.addEventListener("click", () => {
			window.net.reset((data) => {
				console.log(data);
				this.setStatus(data.status);
				this.setStatusMessage(data.status_message);
			});
		});
	}

	showUI() {
		this.UIBox.classList.add("blacked-out");
		this.UIDrawn = true;
	}

	destroyUI() {
		this.UIBox.classList.remove("blacked-out");
		this.UIDrawn = false;
	}

	showLoginBox() {
		this.UIBox.appendChild(this.loginBox);
		this.showUI();
	}

	destroyLoginBox() {
		this.loginBox.remove();
	}

	renderGame(playerPawnsColor) {
		window.game.drawPawns();
		window.game.rotateCameraForPlayer(playerPawnsColor);
	}

	getUsername() {
		return this.usernameInput.value;
	}

	setStatus(status) {
		this.status.innerText = status;
	}

	setStatusMessage(statusMessage) {
		this.statusMessage.innerText = statusMessage;
	}

	addToStatusMessage(statusMessage) {
		this.statusMessage.innerText += statusMessage;
	}

	async startTimer() {
		this.UIBox.appendChild(this.timerBox);
		this.timeCounter.innerText = "30";
		this.UIDrawn = true;
		let timeLeft = await window.net.getTimeLeft();
		this.timerInterval = setInterval(() => {
			if (timeLeft == 0) {
				clearInterval(this.timerInterval);
				this.stopTimer();
			}
			this.timeCounter.innerText = timeLeft;
			timeLeft--;
		}, 1000);

		this.showUI();
	}

	stopTimer() {
		this.timerBox.remove();
		this.destroyUI();
		clearInterval(this.timerInterval);
	}

	initBoardPreview() {
		this.UIBox.appendChild(this.boardPreviewBox);
		this.updateBoardPreview();
	}

	updateBoardPreview() {
		let board = JSON.parse(JSON.stringify(window.game.board));
		this.boardPreviewBox.innerText = "";
		if (window.game.pawnsColor == "white") {
			board.forEach((row) => {
				this.boardPreviewBox.innerText = this.boardPreviewBox.innerText + row.join("  ");
				this.boardPreviewBox.innerText += "\n";
			});
		} else {
			board.reverse().forEach((row) => {
				this.boardPreviewBox.innerText =
					this.boardPreviewBox.innerText + row.reverse().join("  ");
				this.boardPreviewBox.innerText += "\n";
			});
		}
	}

	showOpponentAwaitBox() {
		this.UIBox.appendChild(this.opponentAwaitBox);
	}

	destroyOpponentAwaitBox() {
		this.opponentAwaitBox.remove();
	}

	showEndScreen(winner) {
		this.showUI();
		this.endScreen = document.createElement("div");
		this.endScreen.id = "endScreen";
		this.endScreen.innerText = winner ? "Zwycięstwo!" : "Porażka...";
		this.UIBox.appendChild(this.endScreen);
		this.UIDrawn = true;
	}
}

export default UI;
