"use strict";

import TWEEN from './node_modules/tween/tween.esm.js';
import * as THREE from './node_modules/three/build/three.module.js';
// import {OrbitControls} from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {SkeletonUtils} from './node_modules/three/examples/jsm/utils/SkeletonUtils.js';

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({canvas});
renderer.shadowMap.enabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;

let started = false;
let running = false;
let jumping = false;
let sliding = false;
let exploding = false;

let gameSpeed=5000;


const fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 180;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;
camera.position.y = 3;

// const controls = new OrbitControls(camera, canvas);
// controls.update();

const scene = new THREE.Scene();
scene.background = new THREE.Color('black');

let robotParts = [];
let spiderParts = [];
let robotMesh = [];

let collidableMeshList=[];
let corridorCounter=0;

let robot;
let corridor;
let spider;
let explosion;

let groupRun = new TWEEN.Group();
let groupJump = new TWEEN.Group();
let groupSlide = new TWEEN.Group();

canvas.style.display = 'none';

const manager = new THREE.LoadingManager();
manager.onLoad = init;

const progressBar = document.getElementById('progressbar');
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  progressBar.style.width = `${itemsLoaded / itemsTotal * 100 | 0}%`;
};

const models = {
  robot:    { url: '/res/models/biped_robot/scene.gltf' },
  corridor:    { url: '/res/models/corridor2/scene.gltf' },
  spider:    { url: '/res/models/spider_bot/scene.gltf'},
};
{
  const gltfLoader = new GLTFLoader(manager);
  for (const model of Object.values(models)) {
    gltfLoader.load(model.url, (gltf) => {
      model.gltf = gltf;
    });
  }
}


function init() {

    let ratio = window.devicePixelRatio;
    renderer.setSize( window.innerWidth*ratio, window.innerHeight*ratio );

    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 5, 4);
    light.castShadow = true;
    scene.add(light);

    Object.values(models).forEach((model, ndx) => {
        const clonedModel = SkeletonUtils.clone(model.gltf.scene);
        const root = new THREE.Object3D();

        switch(model.url){
            case models.robot.url : 
                clonedModel.scale.set(0.01,0.01,0.01);
                clonedModel.position.set(0,0,0);
                clonedModel.rotation.set(0,3.15,0);
                clonedModel.traverse( function ( node ) {
                    if (node.isMesh){ 
                        node.castShadow = true;
                        robotMesh.push(node);
                    }
                    robotParts.push(node);
                });
                console.log(robotParts);
                robot = clonedModel;
                break;
            
            case  models.corridor.url:
                clonedModel.position.set(0,0,0);
                corridor = clonedModel;
                clonedModel.traverse( function ( node ) {
                    if (node.isMesh) node.receiveShadow = true;
                    if (node.isLight) node.castShadow = true;
                });
                createCorridor();
                break;

            // case models.spider.url:
            //     clonedModel.children[0].position.set(0,0.7,-100);
            //     clonedModel.children[0].scale.set(0.2,0.2,0.2);
            //     spider = root //clonedModel.children[0];
            //     clonedModel.children[0].traverse( function ( node ) {
            //         if (node.isMesh) {
            //             node.receiveShadow = true;
            //             node.castShadow = true;
            //         }
            //         if (node.isLight) node.castShadow = true;
            //         spiderParts.push(node);
            //     });
            //     console.log(spiderParts);

            //     // collidableMeshList.push(clonedModel.children[0]);
            //     break;

        }
        root.add(clonedModel);
        scene.add(root);
    });

    let material = new THREE.ShaderMaterial( {
        uniforms: {
            tExplosion: {
                type: "t",
                value: new THREE.TextureLoader().load( './res/explosion.png' )
            }
        },
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    });

    explosion = new THREE.Mesh(new THREE.IcosahedronGeometry( 20, 4 ), material);

    laser(-60);

    // hide loading bar
    const loadingElem = document.querySelector('#loading');
    canvas.style.display = 'block';
    loadingElem.style.display = 'none';

    requestAnimationFrame(render);
}


function dumpObject(obj, lines = [], isLast = true, prefix = '') 
{
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
      const isLast = ndx === lastNdx;
      dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}

function run(){
    var speed = gameSpeed/30;
    // arms
    let leftArm = robotParts[24];
    let rightArm = robotParts[37];

    let startLeftArm = new TWEEN.Tween(leftArm, groupRun).to(
        {rotation:{x:0.6, y:+0.8, z:0.1},
        children :[{
            rotation : {x:0.1,z:-2 }
        }]}, speed);
    
    let moveLeftArm = new TWEEN.Tween(leftArm, groupRun).to({rotation:{x:[-0.6,0.6]}}, speed*4).repeat(Infinity);
   
    let startRightArm = new TWEEN.Tween(rightArm, groupRun).to(
        {rotation:{x:0.6, y:-0.7, z:0.1},
        children :[{
            rotation : {x:-0.3, y:-0.5 ,z:-2 }
        }]}, speed);
    
    let moveRightArm = new TWEEN.Tween(rightArm, groupRun).to({rotation:{x:[-0.6,0.6]}}, speed*4).repeat(Infinity);

    startLeftArm.chain(moveLeftArm);
    startRightArm.chain(moveRightArm);
   
    //legs
    let leftLeg = robotParts[11];
    let rightLeg = robotParts[16];

    let startLeftLeg = new TWEEN.Tween(leftLeg, groupRun).to(
        {rotation:{x:-3.1, y:-0.05, z:-3},
        children :[{
            rotation : {z:-1.2},
            children :[{
                rotation : {z:0.5},
                children :[{
                    rotation : {y:-0.1, z:-0.3}
                }]
            }]
        }]}, speed);
    let moveLeftLeg = new TWEEN.Tween(leftLeg, groupRun).to(
        {rotation:{z:[-1.9, -3]},
        children :[{
            rotation : {z:[-2.2,-1.2]},
            children :[{
                rotation : {z:[0.8,0.5]},
                children :[{
                    rotation : {z:[0.5, -0.3]}
                }]
            }]
        }]}, speed*4).repeat(Infinity);
   
    let startRightLeg = new TWEEN.Tween(rightLeg, groupRun).to(
        {rotation:{x:3.05, y:0.05, z:+4.3},
        children :[{
            rotation : {z:-2.2},
            children :[{
                rotation : {z:0.7},
                children :[{
                    rotation : {y:-0.1, z:-0.2}
                }]
            }]
        }]}, speed);

    let moveRightLeg = new TWEEN.Tween(rightLeg, groupRun).to(
        {rotation:{z:[+3.2, 4.3]},
        children :[{
            rotation : {z:[-1.2,-2.2]},
            children :[{
                rotation : {z:[0.4,0.8]},
                children :[{
                    rotation : {z:[0.5, -0.2]}
                }]
            }]
        }]}, speed*4).repeat(Infinity);

    startLeftLeg.chain(moveLeftLeg);
    startRightLeg.chain(moveRightLeg);

    //spine
    let spine = robotParts[10].rotation;
    let rotateSpine = new TWEEN.Tween(spine, groupRun).to({z:0.08}, speed*2);
    rotateSpine.start();
    let rotateSpine2 = new TWEEN.Tween(robotParts[21], groupRun).to({rotation: {y:0.07}}, speed);
    rotateSpine2.chain(new TWEEN.Tween(robotParts[21], groupRun).to({rotation: {y:[-0.07,0.07]}}, 4*speed).repeat(Infinity));
    rotateSpine2.start();

    startRightArm.start();
    startLeftLeg.start();

    startLeftArm.start();    
    startRightLeg.start();
    
    running = true;
}

function jump(speed = gameSpeed/25){

    // arms
    let leftArm = robotParts[24];
    let rightArm = robotParts[37];

    let startLeftArm = new TWEEN.Tween(leftArm, groupJump).to(
        {rotation:{x:-0.9, y:+0.3, z:-1},
        children :[{
            rotation : {x:0.1, z:-1.5 }
        }]}, speed*2);
       
    let startRightArm = new TWEEN.Tween(rightArm, groupJump).to(
        {rotation:{x:1.1, y:-0.1, z:-0.8},
        children :[{
            rotation : {x:-0.3, y:-0.5 ,z:-2 }
        }]}, speed*2);

    //legs
    let leftLeg = robotParts[11];
    let rightLeg = robotParts[16];

    let startLeftLeg = new TWEEN.Tween(leftLeg, groupJump).to(
        {rotation:{x:-3.1, y:-0.05, z:-1.9},
        children :[{
            rotation : {z:-2.2},
            children :[{
                rotation : {z:-0.1},
                children :[{
                    rotation : {y:-0.1, z:-0.3}
                }]
            }]
        }]}, speed*2);
   
    let startRightLeg = new TWEEN.Tween(rightLeg, groupJump).to(
        {rotation:{x:3.0, y:0.05, z:+4.9},
        children :[{
            rotation : {z:-2.2},
            children :[{
                rotation : {z:-0.5},
                children :[{
                    rotation : {y:-0.1, z:-0.2}
                }]
            }]
        }]}, speed*2);

    let moveRobot = new TWEEN.Tween(robot, groupJump).to({position: {y:'+2.6'}}, speed*2.5);
    let moveRobot2 = new TWEEN.Tween(robot, groupJump).to({position: {y:'-2.6'}}, speed*2.5).onComplete(
        function(){
            groupJump.removeAll();
            jumping = false;
            run();
            running = true;
        }
    );
    moveRobot.chain(moveRobot2);
    moveRobot.start();
    
    startRightArm.start();
    startLeftLeg.start();

    startLeftArm.start();    
    startRightLeg.start();
    
    jumping = true;
}

function slide(speed = gameSpeed/30){

    // arms
    let leftArm = robotParts[24];
    let rightArm = robotParts[37];

    let startLeftArm = new TWEEN.Tween(leftArm, groupSlide).to(
        {rotation:{x:-0.9, y:+0.3, z:-1},
        children :[{
            rotation : {x:0.1, z:-1.5 }
        }]}, speed*2);
       
    let startRightArm = new TWEEN.Tween(rightArm, groupSlide).to(
        {rotation:{x:1.1, y:-0.1, z:-0.9},
        children :[{
            rotation : {x:-0.3, y:-0.5 ,z:-2 }
        }]}, speed*2);

    //legs
    let leftLeg = robotParts[11];
    let rightLeg = robotParts[16];

    let startLeftLeg = new TWEEN.Tween(leftLeg, groupSlide).to(
        {rotation:{x:-3.1, y:-0.05, z:-1.9},
        children :[{
            rotation : {z:-1.3},
            children :[{
                rotation : {z:-0.1},
                children :[{
                    rotation : {y:-0.1, z:-0.3}
                }]
            }]
        }]}, speed);
   
    let startRightLeg = new TWEEN.Tween(rightLeg, groupSlide).to(
        {rotation:{x:3.0, y:0.05, z:+4.9},
        children :[{
            rotation : {z:-2.2},
            children :[{
                rotation : {z:-0.5},
                children :[{
                    rotation : {y:-0.1, z:-0.2}
                }]
            }]
        }]}, speed);

    let moveRobot = new TWEEN.Tween(robot, groupSlide).to({rotation: {x:'+1.5'}, position:{y:'+0.1'}}, speed*1.7)
        .onComplete(
            function(){
                let rotateSpine = new TWEEN.Tween(robotParts[10].rotation, groupSlide).to({z:0.3}, speed*1.6).delay(250);
                let rotateSpine2 = new TWEEN.Tween(robotParts[21].rotation, groupSlide).to({z:0.3}, speed*1.6).delay(250);
                rotateSpine.start();
                rotateSpine2.start();
            }
        );
    let moveRobot2 = new TWEEN.Tween(robot, groupSlide).to({rotation: {x:'-1.5'}, position:{y:'-0.1'}}, speed*1.8).delay(300)
    .onComplete(
        function(){
            groupSlide.removeAll();
            sliding = false;
            run();
            running = true;
        }
    );
    moveRobot.chain(moveRobot2);

    sliding = true;

    moveRobot.start();    
    startRightArm.start();
    startLeftLeg.start();
    startLeftArm.start();    
    startRightLeg.start();
}

const render = function() {
    
    let newSize = window.innerWidth / window.innerHeight;
    if (newSize != camera.aspect)
    {
        camera.aspect = newSize;
        camera.updateProjectionMatrix();
        let ratio = window.devicePixelRatio;
        renderer.setSize( window.innerWidth*ratio, window.innerHeight*ratio );
    }     

    requestAnimationFrame(render);

    if(robot!=null ){
        if(robot.position.z < new THREE.Box3().setFromObject(corridor).min.z+180)
            createCorridor();

        var robotBox = new THREE.Box3().setFromObject(robot);
        robotBox.expandByScalar(-0.2);
        
        // var helper = new THREE.Box3Helper(robotBox, 0xffff00 );
        // scene.add( helper );
        if(!exploding && collide(new THREE.Box3().setFromObject(robot)))
            explode();
    }

    if (running) groupRun.update();
    if (jumping) groupJump.update();
    if (sliding) groupSlide.update();

    TWEEN.update();
    renderer.render(scene, camera);  
  }

window.addEventListener('keydown', (e) => {
    if(e.keyCode == 32) {
        if(started) {
            groupRun.removeAll(); 
            groupJump.removeAll(); 
            TWEEN.removeAll();
            started=false;
            running = false;
        }

        else {
            started = true;
            running = true;
            let moveRobot = new TWEEN.Tween(robot).to({position: {z:'-50'}}, gameSpeed);
            let moveRobot2 = new TWEEN.Tween(robot).to({position: {z:'-50'}}, gameSpeed);
            moveRobot.chain(moveRobot2);
            moveRobot2.chain(moveRobot);
            moveRobot.start();
            let moveCamera = new TWEEN.Tween(camera).to({position: {z:'-50'}}, gameSpeed);
            let moveCamera2 = new TWEEN.Tween(camera).to({position: {z:'-50'}}, gameSpeed);
            moveCamera.chain(moveCamera2);
            moveCamera2.chain(moveCamera);
            moveCamera.start();

            // let moveShip = new TWEEN.Tween(spaceship).to({position: {z:'+60'}}, gameSpeed);
            // let moveShip2 = new TWEEN.Tween(spaceship).to({position: {z:'+60'}}, gameSpeed);
            // moveShip.chain(moveShip2);
            // moveShip2.chain(moveShip);
            // moveShip.start();
        
            run();
        }
    }
    // up arrow
    if(e.keyCode == 38) {
        if(running && !jumping && !sliding) {
            groupRun.removeAll(); 
            // TWEEN.removeAll();
            running = false;
            jumping = true;
            jump();
        }
    }
    // down arrow
    if(e.keyCode == 40) {
        if(running && !jumping && !sliding) {
            groupRun.removeAll(); 
            // TWEEN.removeAll();
            running = false;
            sliding = true;
            slide();
        }
    }
    // left arrow
    if(e.keyCode == 39 && !sliding && !jumping) {
        if(robot.position.x<2) {
            new TWEEN.Tween(robot).to({position: {x:'+1'}}, 100).start();
        }
    }
    // right arrow
    if(e.keyCode == 37 && !sliding && !jumping) {
        if(robot.position.x>-2) {
            new TWEEN.Tween(robot).to({position: {x:'-1'}}, 100).start();
        }
    }

    // 0 num
    if(e.keyCode == 48) {
        explode();
    }
});

function explode(){
    exploding = true;
    TWEEN.removeAll();
    groupRun.removeAll();
    groupJump.removeAll();
    explosion.position.set(robot.position.x,robot.position.y+1,robot.position.z);
    explosion.scale.set(0.01,0.01,0.01);
    scene.add(explosion);
    new TWEEN.Tween(explosion).to({
        scale: {x:0.2,y:0.2,z:0.2},
        rotation: {x:0.8,y:0.8,z:0.8}
    }, 350).start();
}

function collide(objectBox){
    for(var obj of collidableMeshList){
        let box = obj.clone();
        box.scale.set(0.85,0.85,0.85);
        if(new THREE.Box3().setFromObject(box).intersectsBox(objectBox))
            return true;
    }
    return false;
};

function laser(distance){
    var geometry = new THREE.CylinderGeometry(0.06, 0.06, 20, 20);
    var color;
    switch(Math.floor(Math.random()*4)){
        case 0: color = '#ff0000';break;
        case 1: color = '#00ff00';break;
        case 2: color = '#0000ff';break;
        case 3: color = '#00ffff';break;        
    }
    var meshMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color });
    var mesh = new THREE.Mesh(geometry, meshMaterial);

    switch(Math.floor(Math.random()*3)){
        case 0: 
            mesh.position.set(0,1.6,distance);
            mesh.rotation.set(0,0,1.57); 
            scene.add(mesh);
            collidableMeshList.push(mesh);
            var laser2 = mesh.clone();
            laser2.position.set(0,1.9,distance);
            scene.add(laser2);
            collidableMeshList.push(laser2);
            var laser3 = mesh.clone();
            laser3.position.set(0,2.2,distance);
            scene.add(laser3);
            collidableMeshList.push(laser3);
            break;
        case 1:
            mesh.position.set(0,0.8,distance);
            mesh.rotation.set(0,0,1.57); 
            scene.add(mesh);
            collidableMeshList.push(mesh);
            var laser2 = mesh.clone();
            laser2.position.set(0,0.5,distance);
            scene.add(laser2);
            collidableMeshList.push(laser2);
            break;

        case 2:
            var pos = Math.random()*7 -3 ;
            mesh.position.set(pos,0,distance);
            scene.add(mesh);
            collidableMeshList.push(mesh);
            var laser2 = mesh.clone();
            laser2.position.set(pos+0.7,0,distance);
            scene.add(laser2);
            collidableMeshList.push(laser2);
            var laser3 = mesh.clone();
            laser3.position.set(pos-0.7,0,distance);
            scene.add(laser3);
            collidableMeshList.push(laser3);
            break;
    }    
}

function createCorridor(){
    corridorCounter++;
    let cor = corridor.clone();
    cor.position.z = new THREE.Box3().setFromObject(corridor).min.z;
    corridor = cor;
    scene.add(cor);

    let max = new THREE.Box3().setFromObject(corridor).max.z;
    let size = 76; //max - new THREE.Box3().setFromObject(corridor).min.z;
    
    for (let i=0; (i+1)*25<76; i++)
        laser(max-i*25);
    gameSpeed-=100;
}