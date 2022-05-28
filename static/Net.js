class Net {
	constructor() {
		this.postFetchInit = {
			method: "POST",
			headers: { "Content-Type": "application/json" }
		};
	}

	logIn(username, callback) {
		fetch("/login", {
			...this.postFetchInit,
			body: JSON.stringify({
				username
			})
		})
			.then((response) => response.json())
			.then((data) => {
				callback(data);
			});
	}

	checkForOponnent(callback) {
		fetch("/playersCount", {
			...this.postFetchInit
		})
			.then((response) => response.json())
			.then((data) => callback(data));
	}

	reset(callback) {
		fetch("/reset", {
			...this.postFetchInit
		})
			.then((response) => response.json())
			.then((data) => callback(data));
	}

	playerMoved(board, oldPos, newPos) {
		fetch("/playerMoved", {
			...this.postFetchInit,
			body: JSON.stringify({
				board,
				oldPos,
				newPos
			})
		})
			.then((response) => response.json())
			.then((data) => {
				window.game.currentMove = data.currentMove;
				window.ui.updateBoardPreview();
			});
	}

	waitForUpdates() {
		let interval = setInterval(() => {
			fetch("/getCurrentData", {
				...this.postFetchInit
			})
				.then((response) => response.json())
				.then((data) => {
					if (data.winner) {
						window.ui.stopTimer();
						clearInterval(interval);
						if (data.winner == window.game.pawnsColor) {
							window.ui.showEndScreen(true);
						} else {
							window.ui.showEndScreen(false);
						}
					}
					if (JSON.stringify(data.currentBoard) !== JSON.stringify(window.game.board)) {
						window.game.board = [...data.currentBoard];
						window.game.currentMove = data.currentMove;
						window.game.movePawn(data.lastMove.oldPos, data.lastMove.newPos);
						window.ui.updateBoardPreview();
						if (!data.winner) window.ui.stopTimer();
					}
				});
		}, 1000);
	}

	async getTimeLeft() {
		return await fetch("/getTimeLeft", { ...this.postFetchInit })
			.then((response) => response.json())
			.then((data) => data.timeLeft);
	}
}

export default Net;
