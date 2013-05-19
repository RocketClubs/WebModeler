RocketClubs.FinGeometry = function ( rootChord, tipChord, semiSpan, sweepLength, thickness ) {

	THREE.Geometry.call( this );

	var scope = this;

	var halfDepth = thickness / 2;

	var frontRootTop = new THREE.Vector3();
	frontRootTop.z = -halfDepth;
	frontRootTop.x = 0;
	frontRootTop.y = rootChord / 2;

	var frontRootBottom = new THREE.Vector3();
	frontRootBottom.z = -halfDepth;
	frontRootBottom.x = 0;
	frontRootBottom.y = frontRootTop.y - rootChord;

	var frontTipTop = new THREE.Vector3();
	frontTipTop.z = -halfDepth;
	frontTipTop.x = semiSpan;
	frontTipTop.y = frontRootTop.y - sweepLength;

	var frontTipBottom = new THREE.Vector3();
	frontTipBottom.z = -halfDepth;
	frontTipBottom.x = semiSpan;
	frontTipBottom.y = frontTipTop.y - tipChord;

	var backRootTop = frontRootTop.clone();
	backRootTop.z = -backRootTop.z;

	var backRootBottom = frontRootBottom.clone();
	backRootBottom.z = -backRootBottom.z;

	var backTipTop = frontTipTop.clone();
	backTipTop.z = -backTipTop.z;

	var backTipBottom = frontTipBottom.clone();
	backTipBottom.z = -backTipBottom.z;

	scope.vertices.push(frontRootTop);
	scope.vertices.push(frontRootBottom);
	scope.vertices.push(frontTipTop);
	scope.vertices.push(frontTipBottom);
	scope.vertices.push(backRootTop);
	scope.vertices.push(backRootBottom);
	scope.vertices.push(backTipTop);
	scope.vertices.push(backTipBottom);

	buildPlane( 0, 2, 3, 1, 0 );
	buildPlane( 0, 4, 6, 2, 1 );
	buildPlane( 4, 0, 1, 5, 2 );
	buildPlane( 2, 6, 7, 3, 3 );
	buildPlane( 3, 7, 5, 1, 4 );
	buildPlane( 6, 4, 5, 7, 5 );

	function buildPlane( v1, v2, v3, v4, normal, materialIndex ) {
		var face = new THREE.Face4( v1, v2, v3, v4 );
		face.materialIndex = materialIndex;
		scope.faces.push( face );
	}

	this.computeFaceNormals();
	this.computeVertexNormals();
	this.computeCentroids();
	this.mergeVertices();

};

RocketClubs.FinGeometry.prototype = Object.create( THREE.Geometry.prototype );