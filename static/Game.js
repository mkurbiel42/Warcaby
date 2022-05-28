import Pawn from "./Pawn.js";
import Field from "./Field.js";

class Game {
	constructor() {
		this.board = [
			[0, 2, 0, 2, 0, 2, 0, 2],
			[2, 0, 2, 0, 2, 0, 2, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 1, 0, 1, 0, 1, 0, 1],
			[1, 0, 1, 0, 1, 0, 1, 0]
		];

		// this.board = [
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 2, 0],
		// 	[0, 1, 0, 1, 0, 1, 0, 1],
		// 	[1, 0, 1, 0, 1, 0, 1, 0],
		// ];

		this.checkerBoard = [
			[1, 0, 1, 0, 1, 0, 1, 0],
			[0, 1, 0, 1, 0, 1, 0, 1],
			[1, 0, 1, 0, 1, 0, 1, 0],
			[0, 1, 0, 1, 0, 1, 0, 1],
			[1, 0, 1, 0, 1, 0, 1, 0],
			[0, 1, 0, 1, 0, 1, 0, 1],
			[1, 0, 1, 0, 1, 0, 1, 0],
			[0, 1, 0, 1, 0, 1, 0, 1]
		];

		this.possibleMoves = [];

		this.pawnsColor = "";
		this.colorId = 0;
		this.currentMove = "white";
		this.selectedPawn;
		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(
			30,
			window.innerWidth / window.innerHeight,
			0.1,
			10000
		);
		this.camera.position.set(430, 500, 430);
		this.camera.lookAt(this.scene.position);
		this.camera.updateProjectionMatrix();

		this.axes = new THREE.AxesHelper(1000);
		//this.scene.add(this.axes);

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setClearColor(0x001548);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.getElementById("root").append(this.renderer.domElement);

		this.raycaster = new THREE.Raycaster();

		this.drawBoard();
		this.drawLights();
		this.render(); // wywołanie metody render
		this.bindEvents();
	}

	bindEvents = () => {
		window.addEventListener("click", (event) => {
			this.boardClick(event);
		});

		window.addEventListener("resize", () => {
			this.windowResize();
		});
	};

	boardClick = (event) => {
		if (this.pawnsColor != this.currentMove) return;
		let mouseVector = new THREE.Vector2();
		mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;

		this.raycaster.setFromCamera(mouseVector, this.camera);
		const intersects = this.raycaster.intersectObjects(this.scene.children);

		if (intersects.length == 0) return;

		let elem = intersects[0].object;

		if (elem instanceof Pawn && elem.info.color === window.game.pawnsColor) {
			this.unhighlightAllFields();
			if (this.selectedPawn) this.selectedPawn.material = this.selectedPawn.normalMaterial;
			if (elem === this.selectedPawn) {
				this.selectedPawn.material = this.selectedPawn.normalMaterial;
				this.selectedPawn = null;
			} else {
				this.selectedPawn = elem;
				this.selectedPawn.material = this.selectedPawn.selectedPawnMaterial;

				this.calculatePossibleMoves();
			}
		}

		if (elem instanceof Field) {
			if (!this.selectedPawn) return;

			let oldPos = this.selectedPawn.getBoardPos();
			let newPos = elem.getBoardPos();

			let fieldElems = this.possibleMoves.filter(
				(field) => JSON.stringify(field.boardPos) === JSON.stringify(newPos)
			);

			if (fieldElems.length > 0) {
				this.changeBoard(oldPos, newPos);
				this.movePawn(oldPos, newPos);
				this.waitForUpdates(oldPos, newPos);

				this.selectedPawn.material = this.selectedPawn.normalMaterial;
				this.selectedPawn = null;

				this.unhighlightAllFields();
			}
		}
	};

	movePawn = (oldPos, newPos) => {
		let movedPawn = this.getPawnByPos(oldPos);

		animate: {
			let animationLiftUp = new TWEEN.Tween(movedPawn.position)
				.to({ x: newPos.x * Field.size, y: 35, z: newPos.z * Field.size }, 550)
				.easing(TWEEN.Easing.Bounce.Out);

			let animationPutDown = new TWEEN.Tween(movedPawn.position)
				.delay(50)
				.to({ y: 0 }, 150)
				.easing(TWEEN.Easing.Quadratic.In);

			animationLiftUp.chain(animationPutDown);
			animationLiftUp.start();
		}

		let jumpX = newPos.x - oldPos.x;
		let jumpZ = newPos.z - oldPos.z;

		if (Math.abs(jumpX) + Math.abs(jumpZ) > 3)
			this.capturePawn({
				x: newPos.x - (newPos.x - oldPos.x) / Math.abs(newPos.x - oldPos.x),
				z: newPos.z - (newPos.z - oldPos.z) / Math.abs(newPos.z - oldPos.z)
			});

		movedPawn.info.boardX = newPos.x;
		movedPawn.info.boardZ = newPos.z;

		if (
			(newPos.z == 0 && movedPawn.info.color == "white") ||
			(newPos.z == 7 && movedPawn.info.color == "black")
		) {
			if (!movedPawn.info.isQueen) this.makeQueen(movedPawn);
		}
	};

	calculatePossibleMoves = () => {
		let opsColorId = 3 - this.colorId;

		if (this.selectedPawn.info.isQueen) {
			let x = this.selectedPawn.getBoardPos().x;
			let z = this.selectedPawn.getBoardPos().z;
			let colorId = this.selectedPawn.info.colorId;

			this.possibleMoves = [];

			let blockedDirections = [false, false, false, false];

			for (let i = 1; i < 8; i++) {
				[
					{ x: x - i, z: z - i },
					{ x: x - i, z: z + i },
					{ x: x + i, z: z - i },
					{ x: x + i, z: z + i }
				].forEach((field, idx) => {
					if (
						field.x > 0 &&
						field.x < 7 &&
						field.z > 0 &&
						field.z < 7 &&
						this.board[field.z][field.x] == this.selectedPawn.info.colorId
					) {
						blockedDirections[idx] = true;
					}
				});

				this.possibleMoves = [
					...this.possibleMoves,
					...[
						{ x: x - i, z: z - i },
						{ x: x - i, z: z + i },
						{ x: x + i, z: z - i },
						{ x: x + i, z: z + i }
					]
						.filter((field, idx) => !blockedDirections[idx])
						.filter(
							(field) => field.x >= 0 && field.z >= 0 && field.x <= 7 && field.z <= 7
						)
						.map((field) => {
							return { boardPos: { x: field.x, z: field.z }, colorId };
						})
						.filter((field) => this.board[field.boardPos.z][field.boardPos.x] == 0)
				];
			}
		} else {
			let moveDirection = this.pawnsColor == "white" ? -1 : 1;
			let possibleMoveRow = this.selectedPawn.getBoardPos().z + moveDirection;

			if (possibleMoveRow < 0 || possibleMoveRow > 7) return;

			calculations: {
				this.possibleMoves = this.board[possibleMoveRow]

					// lepsza czytelność elementu: colorId, boardPos {x, z}
					.map((elem, x) => {
						return { boardPos: { x, z: possibleMoveRow }, colorId: elem };
					})

					// pozostawienie pól, które są w odległości 1 od pionka
					.filter((field) => {
						return Math.abs(this.selectedPawn.getBoardPos().x - field.boardPos.x) == 1;
					})

					// obliczenie przeskoków nad pionkami przeciwnika
					.map((field) => {
						let fieldsColorId = this.board[field.boardPos.z][field.boardPos.x];
						if (
							opsColorId === fieldsColorId &&
							field.boardPos.x > 0 &&
							field.boardPos.x < 7 &&
							field.boardPos.z > 0 &&
							field.boardPos.z < 7
						) {
							let shiftX = field.boardPos.x - this.selectedPawn.getBoardPos().x;
							let shiftZ = field.boardPos.z - this.selectedPawn.getBoardPos().z;
							field.boardPos.x += shiftX;
							field.boardPos.z += shiftZ;
						}

						return field;
					})

					// pozostawienie pustych pól
					.filter((field) => {
						return this.board[field.boardPos.z][field.boardPos.x] == 0;
					});
			}
		}

		//zaznaczenie możliwości ruchu
		this.possibleMoves.forEach((fieldInfo) => {
			let field = this.fieldsObject.children.filter((oneField) => {
				return JSON.stringify(oneField.getBoardPos()) == JSON.stringify(fieldInfo.boardPos);
			})[0];

			field.material = field.highlightedMaterial;
		});
	};

	makeQueen = (pawn) => {
		pawn.info.isQueen = true;
		pawn.normalMaterial = pawn.queenMaterial;
		pawn.material = pawn.normalMaterial;
	};

	getPawnByPos = (pos) => {
		return this.pawnsObject.children.filter((elem) => {
			return JSON.stringify(elem.getBoardPos()) === JSON.stringify(pos);
		})[0];
	};

	capturePawn = (CPPos) => {
		let capturedPawn = this.getPawnByPos(CPPos);
		if (!capturedPawn) return;

		this.board[CPPos.z][CPPos.x] = 0;

		new TWEEN.Tween(capturedPawn.position)
			.delay(550)
			.to({ y: 250 }, 450)
			.easing(TWEEN.Easing.Linear.None)
			.onComplete(() => {
				this.pawnsObject.remove(capturedPawn);
			})
			.start();
	};

	changeBoard = (oldPos, newPos) => {
		this.board[newPos.z][newPos.x] = this.colorId;
		this.board[oldPos.z][oldPos.x] = 0;
	};

	waitForUpdates = (oldPos, newPos) => {
		window.net.playerMoved(this.board, oldPos, newPos);
		window.ui.startTimer();
		window.ui.updateBoardPreview();
	};

	unhighlightAllFields = () => {
		this.possibleMoves.forEach((fieldInfo) => {
			let field = this.fieldsObject.children.filter((oneField) => {
				return JSON.stringify(oneField.getBoardPos()) == JSON.stringify(fieldInfo.boardPos);
			})[0];

			field.material = field.normalMaterial;
		});

		this.possibleMoves = [];
	};

	windowResize = () => {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	};

	drawBoard = () => {
		this.fieldsObject = new THREE.Object3D();

		this.fieldsObject.position.set(-3.5 * Field.size, 2, -3.5 * Field.size);

		this.scene.add(this.fieldsObject);

		this.checkerBoard.forEach((row, z) =>
			row.forEach((one, x) => {
				let field;
				if (one == 0) {
					field = new Field({
						color: "black",
						boardX: x,
						boardZ: z,
						texture: this.woodTexture()
					});
				} else {
					field = new Field({
						color: "white",
						boardX: x,
						boardZ: z,
						texture: this.woodTexture()
					});
				}
				field.position.set(Field.size * x, 0, Field.size * z);
				this.fieldsObject.add(field);
			})
		);
	};

	drawPawns = () => {
		if (this.pawnsObject) {
			this.pawnsObject.children = [];
		} else {
			this.pawnsObject = new THREE.Object3D();
		}

		this.pawnsObject.position.set(-3.5 * Field.size, 7, -3.5 * Field.size);
		this.scene.add(this.pawnsObject);

		this.board.forEach((row, z) => {
			row.forEach((one, x) => {
				if (one == 0) return;

				let pawn;

				switch (one) {
					case 1:
						pawn = new Pawn({
							color: "white",
							colorId: one,
							boardX: x,
							boardZ: z,
							texture: this.woodTexture()
						});
						break;

					case 2:
						pawn = new Pawn({
							color: "black",
							colorId: one,
							boardX: x,
							boardZ: z,
							texture: this.woodTexture()
						});
						break;

					default:
						break;
				}

				this.pawnsObject.add(pawn);
				pawn.position.set(40 * x, 0, 40 * z);
			});
		});
	};

	drawLights = () => {
		this.dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
		this.dirLight.castShadow = true;
		this.scene.add(this.dirLight);
		this.dirLight.position.set(150, 200, 0);
		this.dirLight.target = this.scene;

		this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		this.scene.add(this.ambientLight);
	};

	rotateCameraForPlayer = (playerPawnsColor) => {
		playerPawnsColor === "white"
			? this.camera.position.set(0, 300, 500)
			: this.camera.position.set(0, 300, -500);
		this.camera.updateProjectionMatrix();
		this.camera.lookAt(this.scene.position);
	};

	render = () => {
		requestAnimationFrame(this.render);
		this.renderer.render(this.scene, this.camera);
		TWEEN.update();
	};

	woodTexture = () => {
		let texture = new THREE.TextureLoader().load("/gfx/woodTexture.jpg");
		texture.offset.set(0.2, 0.15);
		texture.repeat.set(0.5, 0.5);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		return texture;
	};
}

export default Game;
