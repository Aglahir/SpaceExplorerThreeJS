/**
 * https://github.com/Aglahir/SpaceExplorerThreeJS
 */

import { EffectComposer } from './node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { FilmPass } from './node_modules/three/examples/jsm/postprocessing/FilmPass.js';
import { BloomPass } from './node_modules/three/examples/jsm/postprocessing/BloomPass.js';
import { PointerLockControls } from './node_modules/three/examples/jsm/controls/PointerLockControls.js';


const textureLoader = new THREE.TextureLoader();
let composer, clock;
let uniforms, goal, controls;
let scene, camera, renderer, rocket;
let obstacles = [];
let obstacles2 = [];
const centerOfWorldObject = new THREE.Object3D();

let raycaster;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

function applyShaders() {
    uniforms = {
        "fogDensity": { value: 0 },
        "fogColor": { value: new THREE.Vector3(0, 0, 0) },
        "time": { value: 1.0 },
        "uvScale": { value: new THREE.Vector2(3.0, 1.0) },
        "texture1": { value: textureLoader.load('./node_modules/three/examples/jsm/textures/lava/cloud.png') },
        "texture2": { value: textureLoader.load('./node_modules/three/examples/jsm/textures/lava/lavatile.jpg') }

    };

    uniforms["texture1"].value.wrapS = uniforms["texture1"].value.wrapT = THREE.RepeatWrapping;
    uniforms["texture2"].value.wrapS = uniforms["texture2"].value.wrapT = THREE.RepeatWrapping;

    const maxsize = 150;

    const materialTorus = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent

    });

    textureLoader.load('assets/lavatile.jpg', function (texture) {
        const materialSphere = new THREE.MeshBasicMaterial({
            map: texture,
            opacity: 0.8
        });

        for (var i = 0; i < 13; i++) {
            var size = Math.random();
            const geometrySphere = new THREE.SphereGeometry(size * maxsize, 32, 32);
            const torusGeometry = new THREE.TorusBufferGeometry(size * (maxsize + 70), size * 20, 30, 30);
            const sphere = new THREE.Mesh(geometrySphere, materialSphere);
            const torus = new THREE.Mesh(torusGeometry, materialTorus);

            sphere.position.x = torus.position.x = -1000 + Math.random() * 2000;
            sphere.position.y = torus.position.y = Math.random() * 2000;
            sphere.position.z = torus.position.z = -1000 + Math.random() * 2000;

            obstacles.push({
                sphere: sphere,
                torus: torus,
                rx: Math.random(),
                ry: Math.random(),
                rz: Math.random()
            });

            scene.add(sphere);
            scene.add(torus);

            centerOfWorldObject.add(sphere);
            centerOfWorldObject.add(torus);

            addLight(sphere.position.x, sphere.position.y, sphere.position.z);
        }
    });
}

function loadControls() {
    controls = new PointerLockControls(rocket, renderer.domElement);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {

        controls.lock();

    }, false);

    controls.addEventListener('lock', function () {

        instructions.style.display = 'none';
        blocker.style.display = 'none';

    });

    controls.addEventListener('unlock', function () {

        blocker.style.display = 'block';
        instructions.style.display = '';

    });

    scene.add(controls.getObject());

    const onKeyDown = function (event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
        }
    };

    const onKeyUp = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
}

function loadRocket() {
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.load('./assets/Rocket/Rocket.mtl', function (materials) {
        materials.preload();

        // Load the object
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('assets/Rocket/Rocket.obj', function (object) {
            object.scale.x = object.scale.y = object.scale.z = 0.05;
            object.position.y = 0;
            object.position.x = 0;
            object.position.z = 0;
            object.rotation.x -= Math.PI / 2;
            object.castShadow = true;
            object.receiveShadow = true;
            rocket = object;
            goal = new THREE.Object3D();
            rocket.add(goal);
            goal.position.set(0, -300, 200);

            scene.add(rocket);
            centerOfWorldObject.add(rocket);

            object.traverse(function (node) { if (node instanceof THREE.Mesh) { node.castShadow = true; } });

            // Setup controls
            loadControls();
        });
    });
}

function createObstacles2() {
    textureLoader.load('./node_modules/three/examples/jsm/textures/planets/moon_1024.jpg', function (texture) {
        textureLoader.load('./node_modules/three/examples/jsm/textures/planets/earth_atmos_2048.jpg', function (texture2) {
            for (var i = 0; i < 300; i++) {
                const geometrySphere = new THREE.SphereGeometry(Math.random() * 100, 32, 32);
                const material = new THREE.MeshPhongMaterial({
                    map: Math.random() < 0.5 ? texture : texture2,
                    opacity: 0.8,
                    flatShading: true
                });
                const sphere = new THREE.Mesh(geometrySphere, material);

                sphere.position.x = -1000 + Math.random() * 2000;
                sphere.position.y = Math.random() * 2000;
                sphere.position.z = -1000 + Math.random() * 2000;

                sphere.castShadow = true;
                sphere.receiveShadow = true;

                obstacles2.push({
                    sphere: sphere,
                    rx: Math.random(),
                    ry: Math.random(),
                    rz: Math.random()
                });

                scene.add(sphere);
                centerOfWorldObject.add(sphere);
            }
        });
    });
}

function addLight(x, y, z) {
    const intensity = 1;
    const distance = 1000;
    const decay = 2.0;

    var colors = [0xff0040, 0x0040ff, 0x80ff80, 0xffaa00, 0x00ffaa, 0xff1100];

    var chosenColor = colors[Math.floor(Math.random() * (colors.length - 1))];
    let light = new THREE.PointLight(chosenColor, intensity, distance, decay);
    light.position.x = x;
    light.position.y = y;
    light.position.z = z;
    light.castShadow = true;
    //Set up shadow properties for the light
    light.shadow.mapSize.width = 1024; // default
    light.shadow.mapSize.height = 1024; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 1000; // default
    scene.add(light);
    centerOfWorldObject.add(light);
}

function loadLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // soft white light
    scene.add(ambientLight);
}

function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.receiveShadow = true;

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 4;

    renderer.setSize(window.innerWidth, window.innerHeight);

    applyShaders(scene);

    const renderModel = new RenderPass(scene, camera);
    const effectBloom = new BloomPass(1.25);
    const effectFilm = new FilmPass(0.35, 0.95, 2048, false);

    composer = new EffectComposer(renderer);

    composer.addPass(renderModel);
    composer.addPass(effectBloom);
    composer.addPass(effectFilm);

    document.body.appendChild(renderer.domElement);

    camera.position.set(0, 100, 100);
    camera.lookAt(scene.position);

    let floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(- Math.PI / 2);


    // Start adding things
    loadRocket(scene);
    loadLights(scene);
    createObstacles2(scene);

    scene.add(centerOfWorldObject);
}

function moveObstacles() {
    for (var obstacle in obstacles) {
        obstacles[obstacle].torus.rotation.x += (0.01 * obstacles[obstacle].rx);
        obstacles[obstacle].torus.rotation.y += (0.05 * obstacles[obstacle].ry);
        obstacles[obstacle].torus.rotation.z += (0.01 * obstacles[obstacle].rz);

        obstacles[obstacle].sphere.rotation.x += (0.01 * obstacles[obstacle].ry);
        obstacles[obstacle].sphere.rotation.y += (0.01 * obstacles[obstacle].rx);
    }

    for (var obstacle in obstacles2) {
        obstacles2[obstacle].sphere.rotation.x += 0.005 * obstacles2[obstacle].rx;
        obstacles2[obstacle].sphere.rotation.y += 0.005 * obstacles2[obstacle].ry;
        obstacles2[obstacle].sphere.rotation.z += 0.005 * obstacles2[obstacle].rz;
    }

    centerOfWorldObject.rotation.y -= 0.0005;
}


function checkMouse() {
    const time = performance.now();

    if (controls.isLocked === true) {

        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 90000.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 20000.0 * delta;

        controls.moveRight(- velocity.x * delta);
        rocket.translateY(-velocity.z / 10000);
        moveObstacles();
    }

    prevTime = time;
}

function update() {
    if (
        scene !== undefined &&
        rocket !== undefined
    ) {
        checkMouse();
        camera.position.lerp(new THREE.Vector3().setFromMatrixPosition(goal.matrixWorld), 0.2);
        camera.lookAt(rocket.position);
    }
}

function render() {
    const delta = 5 * clock.getDelta();

    uniforms['time'].value += delta;
    renderer.clear();
    composer.render(0.01);
}

function animate() {
    requestAnimationFrame(animate);
    update();
    render();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);
init();
animate();