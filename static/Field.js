class Field extends THREE.Mesh {
	static size = 40;

	constructor(info) {
		super();
		this.info = info;

		this.highlightedMaterial = new THREE.MeshPhongMaterial({
			color: 0x23b167,
			shininess: 25,
			side: THREE.DoubleSide,
			map: this.info.texture,
		});

		this.init();
	}

	init() {
		this.geometry = new THREE.BoxGeometry(Field.size, 4, Field.size);

		if (this.info.color == "black") {
			this.normalMaterial = new THREE.MeshPhongMaterial({
				color: 0x7b483a,
				shininess: 125,
				side: THREE.DoubleSide,
				map: this.info.texture,
			});
		} else {
			this.normalMaterial = new THREE.MeshPhongMaterial({
				color: 0xffe9c3,
				shininess: 125,
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

export default Field;
