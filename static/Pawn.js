class Pawn extends THREE.Mesh {
	static size = 30;

	constructor(info) {
		super();
		this.info = { ...info, isQueen: false };
		this.selectedPawnMaterial = new THREE.MeshPhongMaterial({
			color: 0x2367b1,
			shininess: 25,
			side: THREE.DoubleSide,
			map: this.info.texture,
		});

		this.init();
	}

	init() {
		this.geometry = new THREE.CylinderGeometry(
			Pawn.size / 2,
			Pawn.size / 2,
			6,
			Pawn.size,
			Pawn.size
		);

		if (this.info.color == "black") {
			this.normalMaterial = new THREE.MeshPhongMaterial({
				color: 0xae2a43,
				shininess: 25,
				side: THREE.DoubleSide,
				map: this.info.texture,
			});

			this.queenMaterial = new THREE.MeshPhongMaterial({
				color: 0xe33676,
				shininess: 25,
				side: THREE.DoubleSide,
				map: this.info.texture,
			});
		}

		if (this.info.color == "white") {
			this.normalMaterial = new THREE.MeshPhongMaterial({
				color: 0xeac193,
				shininess: 25,
				side: THREE.DoubleSide,
				map: this.info.texture,
			});

			this.queenMaterial = new THREE.MeshPhongMaterial({
				color: 0xffd875,
				shininess: 25,
				side: THREE.DoubleSide,
				map: this.info.texture,
			});
		}

		this.material = this.normalMaterial;
	}

	getBoardPos() {
		return {
			x: this.info.boardX,
			z: this.info.boardZ,
		};
	}
}

export default Pawn;
