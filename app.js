"use strict";

var rocketDefinition = {
    parts: [
        { 
            name: "Nosecone",
            type: "nosecone",
            connection: "aft",
            connectionOffset: 0.0,
            getForwardOffset: function() { return this.length / 2; },
            getAftOffset: function() { return this.length / -2; },
            outerDiameter: 58.42,
            length: 241.30
        },
        {
            name: "Airframe",
            type: "tube",
            connection: "aft",
            connectionOffset: 0.0,
            getForwardOffset: function() { return this.length / 2; },
            getAftOffset: function() { return this.length / -2; },
            outerDiameter: 58.42,
            length: 304.80,

            parts: [
                {
                    name: "Fins",
                    type: "fins",
                    connection: "aft",
                    connectionOffset: 110.0,
                    getForwardOffset: function() { return this.rootChord / 2; },
                    getAftOffset: function() { return this.rootChord / -2; },
                    semiSpan: 66.7,
                    rootChord: 104.8,
                    tipChord: 25.5,
                    sweepLength: 117.5,
                    thickness: 4,
                    count: 3,
                    radiusOffset: 58.42 / 2
                }
            ]
        }
    ]
};


angular.module('rocket-modeler.services', [])
    .service('materialsProvider', [function() {
        var materials = {
            "default": new THREE.MeshLambertMaterial( { color: 0x0000ff } ),
            "wireframe": new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } )
        };
        var activeMaterial = materials["default"];
        var materialsProviderService = {
            active: function () { 
                return activeMaterial; 
            },
            setActive: function(name) {
                var newMaterial = materials[name];
                if (newMaterial) {
                    activeMaterial = newMaterial;
                }
            }
        };
        return materialsProviderService;
    }])
    .service('rocket3DBuilder', ['materialsProvider', function(materials) {
        var partBuilders = {
            nosecone: function (data) {
                var geometry = new RocketClubs.TangentOgiveGeometry(data.outerDiameter, data.length, 36, 25, false);
                var mesh = new THREE.Mesh( geometry, materials.active() );
                mesh.translateY(-data.getForwardOffset());
                return mesh;
            },
            tube: function (data) {
                var radius = data.outerDiameter / 2;
                var length = data.length;
                var geometry = new THREE.CylinderGeometry(radius, radius, length, 36, 1, false);
                var mesh = new THREE.Mesh( geometry, materials.active() );
                mesh.translateY(-data.getForwardOffset());
                return mesh;
            },
            fins: function (data) {
                var fins = new THREE.Object3D();
                var finGeometry = new RocketClubs.FinGeometry(data.rootChord, data.tipChord, data.semiSpan, data.sweepLength, data.thickness);
                for(var i = 0; i < data.count; i++) {
                    var finPivot = new THREE.Object3D();
                    finPivot.rotation.y = 2 * Math.PI * (i / data.count);
                    var finMesh = new THREE.Mesh( finGeometry, materials.active() );
                    finMesh.translateX(data.radiusOffset);
                    finMesh.translateY(-data.getForwardOffset() + data.connectionOffset);
                    finPivot.add(finMesh);
                    fins.add(finPivot);
                }
                return fins;
            }
        };
        function buildRocket(rocketInfo) {
            var rocket = new THREE.Object3D();
            var attachPoints = {
                forward: rocket,
                aft: rocket
            };
            for(var partIndex in rocketInfo.parts) {
                buildPart(attachPoints, rocketInfo.parts[partIndex], true);
            }        
            return rocket;
        }
        function buildPart(attachPoints, part, replaceAttachPoints) {
            var partObject = partBuilders[part.type](part);
            var partAttachPoints = createAttachPoints(part.getForwardOffset(), part.getAftOffset());
            partObject.add(partAttachPoints.forward);
            partObject.add(partAttachPoints.aft);
            attachPoints[part.connection].add(partObject);
            if (replaceAttachPoints) {
                attachPoints.forward = partAttachPoints.forward;
                attachPoints.aft = partAttachPoints.aft;
            }
            if (part.parts !== undefined) {
                for(var childPartIndex in part.parts) {
                    var childPart = part.parts[childPartIndex];
                    buildPart(attachPoints, childPart, false);
                }
            }
        }
        function createAttachPoints(forwardOffset, aftOffset) {
            var attachPoints = {
                forward: new THREE.Object3D(),
                aft: new THREE.Object3D()
            };
            attachPoints.forward.translateY(forwardOffset);
            attachPoints.aft.translateY(aftOffset);
            return attachPoints;
        }
        var rocketBuilderService = {
            buildRocket: buildRocket
        };
        return rocketBuilderService;
    }]);

var modeler = angular.module('rocket-modeler', ['rocket-modeler.services', 'angularUnits']);

modeler.run(['$rootScope', function ($rootScope) {
    $rootScope.rocket = rocketDefinition;
    $rootScope.setDisplayUnits = function (units) {
        $rootScope.displayUnits = units;
    }
    $rootScope.setDisplayUnits('mm');
}]);

modeler.controller('EditController', ['$scope', function ($scope) {
    $scope.setActivePart = function (part) {
        $scope.activePart = part;
    };
    var parts = $scope.rocket.parts;
    var initialPart = parts && parts.length > 0 ? parts[0] : null;
    $scope.setActivePart(initialPart);
}]);

modeler.controller('RenderController', ['$scope', '$element', 'rocket3DBuilder', function ($scope, $element, rocket3DBuilder) {
    var renderContainer = $element.find('#render-container');
    var renderer = new THREE.CanvasRenderer();
    renderContainer.append( renderer.domElement );
    window.addEventListener( 'resize', renderRocket, false );

    function renderRocket() {
        var camera = new THREE.OrthographicCamera( -100, 100, 100, -100, 0, 1000 );
        var scene = new THREE.Scene();

        var ambientLight = new THREE.AmbientLight( 0xffffff );
        scene.add( ambientLight );

        var rocket3D = rocket3DBuilder.buildRocket($scope.rocket);
        rocket3D.rotation = $scope.activeOrientation;
        scene.add( rocket3D );

        adjustCamera(camera, rocket3D);
        renderer.render( scene, camera );
    }

    function adjustCamera(camera, rocket3D) {
        // set render size
        var renderWidth = renderContainer.width();
        var renderHeight = renderContainer.height();
        var screenRatio = renderWidth / renderHeight;
        renderer.setSize( renderWidth, renderHeight );

        // update camera
        var cameraBox = getComplexBoundingBox(rocket3D);
        
        var middle = cameraBox.max.clone().add(cameraBox.min).divideScalar(2);
        camera.position = middle;

        var dimensions = cameraBox.max.clone().sub(cameraBox.min);
        var rocketRatio = dimensions.x / dimensions.y;
        if (screenRatio > rocketRatio) {
            dimensions.x = dimensions.y * screenRatio;
        } else if (screenRatio < rocketRatio) {
            dimensions.y = dimensions.x / screenRatio;
        }

        var offsets = dimensions.divideScalar(2);
        camera.left = -offsets.x;
        camera.right = offsets.x;
        camera.top = offsets.y;
        camera.bottom = -offsets.y;
        camera.near = -offsets.z;
        camera.far = offsets.z;

        camera.updateProjectionMatrix();
    }

    function getComplexBoundingBox(object3D) {
        var box = null;
        object3D.traverse(function (obj3D) {
            if (obj3D.matrixWorldNeedsUpdate) obj3D.updateMatrixWorld();
            var geometry = obj3D.geometry;
            if (geometry === undefined) return null;
            var workableGeometry = geometry.clone();
            workableGeometry.applyMatrix(obj3D.matrixWorld);
            workableGeometry.computeBoundingBox();
            if (box === null) {
                box = workableGeometry.boundingBox;
            } else {
                box.union(workableGeometry.boundingBox);
            }
        });
        return box;
    }

    var orientations = {
        finSpread: new THREE.Vector3(0.5*Math.PI,0.5*Math.PI,0),
        longWays: new THREE.Vector3(0,0,0.5*Math.PI)
    };

    $scope.setOrientation = function(orientationId) {
        $scope.activeOrientation = orientations[orientationId];
        renderRocket();
    };

    $scope.setOrientation('longWays');
    $scope.$watch('rocket', renderRocket, true);
}]);