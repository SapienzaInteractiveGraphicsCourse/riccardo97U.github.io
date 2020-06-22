"use strict";

import TWEEN from './node_modules/tween/tween.esm.js';
import * as THREE from './node_modules/three/build/three.module.js';
import {OrbitControls} from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({canvas});
renderer.outputEncoding = THREE.sRGBEncoding;

const fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 5000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 3;
camera.position.y = 0;


const controls = new OrbitControls(camera, canvas);
// controls.target.set(0, 5, 0);
controls.update();

const scene = new THREE.Scene();
scene.background = new THREE.Color('black');


let robotParts = [];

let corridor;

let groupRun = new TWEEN.Group();

function main() {
    let ratio = window.devicePixelRatio;
    renderer.setSize( window.innerWidth*ratio, window.innerHeight*ratio );

    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 5, 4);
    scene.add(light);


    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/res/models/biped_robot/scene.gltf', (gltf) => {
      const root = gltf.scene;
    //   console.log(dumpObject(root).join('\n'));
      root.scale.set(0.01,0.01,0.01);
      root.position.set(0,-1,0);
      scene.add(root);

      traverse(root, robotParts);
      console.log(robotParts);
    
      const box = new THREE.Box3().setFromObject(root);
      let boxCenter = box.getCenter(new THREE.Vector3());
            
      controls.target.copy(boxCenter);
      controls.update();

      running();
    });

    gltfLoader.load('/res/models/corridor/scene.gltf', (gltf) => {
        const root = gltf.scene;
        console.log(dumpObject(root).join('\n'));
       // root.scale.set(0.01,0.01,0.01);
        root.position.set(-20,2,0);

        corridor = root;
        scene.add(root);

        new TWEEN.Tween(corridor.children[0]
            .children[0].children[0], groupRun).to({position: {y:-21}}, 3000).start();
    
        // walking();
      });
  
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

function traverse(part, dest) {
    if (part == null) return;
    else if (part instanceof Array) for(let i of part) traverse(i, dest);
    else if (part.children != null)
    {
        dest.push(part);
        traverse(part.children, dest);
    }
    else dest.push(part);
}

function running(){
    // arms
    var leftUpperArm = robotParts[24];
    var rightUpperArm = robotParts[37];

    var startLeft = new TWEEN.Tween(leftUpperArm, groupRun).to(
        {rotation:{x:0.6, y:+0.8, z:0.1},
        children :[{
            rotation : {x:0.1,z:-2 }
        }]}, 150);
    
    var forwardLeft = new TWEEN.Tween(leftUpperArm, groupRun).to({rotation:{x:[-0.6,0.6]}}, 600).repeat(Infinity);
    // var backwardLeft = new TWEEN.Tween(leftUpperArm, groupRun).to({rotation:{x:"+1"}}, 300);

    var startRight = new TWEEN.Tween(rightUpperArm, groupRun).to(
        {rotation:{x:0.6, y:+0.8, z:0.1},
        children :[{
            rotation : {x:0.1,z:-2 }
        }]}, 150);
    
    // var forwardRight = new TWEEN.Tween(rightUpperArm, groupRun).to({rotation:{x:"+1"}}, 300);
    var backwardRight = new TWEEN.Tween(rightUpperArm, groupRun).to({rotation:{x:"-1"}}, 300);

    startLeft.chain(forwardLeft);
    // startRight.chain(backwardRight);
    // backwardLeft.chain(forwardLeft);
    // forwardLeft.chain(backwardLeft);
    // backwardRight.chain(forwardRight);
    // forwardRight.chain(backwardRight);

    //legs
    var leftThigh = robotParts[11];
    var rightThigh = robotParts[16];

    var startLeftLeg = new TWEEN.Tween(leftThigh, groupRun).to(
        // {rotation:{z:"+0.9", x:"-0.3", y:"+0.1"},
        // children :[{
        //     rotation : {z:"-1.4"},
        //     children :[{
        //         rotation : {z:"+0.1"},
        //         children :[{
        //             rotation : {x:"+0.1", y: "+0.1", z:"-0.2"}
        //         }]
        //     }]
        // }]}, 150);
        {rotation:{x:3.1, y:0, z:-3},
        children :[{
            rotation : {z:-1.2},
            children :[{
                rotation : {z:0.8},
                children :[{
                    rotation : {y:-0.1, z:0.3}
                }]
            }]
        }]}, 150);
    var forwardLeftLeg = new TWEEN.Tween(leftThigh, groupRun).to(
        // {rotation:{z:"-1.4"},
        // children :[{
        //     rotation : {z:"+1.6"},
        //     children :[{
        //         rotation : {z:"+0.1"},
        //         children :[{
        //             rotation : {z:"+0.6"}
        //         }]
        //     }]
        // }]}, 300);
        {rotation:{z:[-1.9, -3]},
        children :[{
            rotation : {z:[-2.2,-1.2]},
            children :[{
                rotation : {z:[0.9,0.5]},
                children :[{
                    rotation : {z:[-0.6, 0.5]}
                }]
            }]
        }]}, 600).repeat(Infinity);
    // var backwardLeftLeg = new TWEEN.Tween(leftThigh, groupRun).to(
    //     {rotation:{z:"+1.4"},
    //     children :[{
    //         rotation : {z:"-1.6"},
    //         children :[{
    //             rotation : {z:"-0.1"},
    //             children :[{
    //                 rotation : {z:"-0.6"}
    //             }]
    //         }]
    //     }]}, 300);

    var startRightLeg = new TWEEN.Tween(rightThigh, groupRun).to(
        // {rotation:{x:"+0.3", y:"-0.2", z:"+0.3"},
        // children :[{
        //     rotation : {z:"-0.3"},
        //     children :[{
        //         rotation : {z:"+0.1"},
        //         children :[{
        //             rotation : {x:"+0.15", y: "-0.15", z:"+0.1"}
        //         }]
        //     }]
        // }]}, 150);
        {rotation:{x:3.1, y:0, z:-1.9},
        children :[{
            rotation : {z:-2.2},
            children :[{
                rotation : {z:0.7},
                children :[{
                    rotation : {y:-0.1, z:-0.2}
                }]
            }]
        }]}, 150);

    // var forwardRightLeg = new TWEEN.Tween(rightThigh, groupRun).to(
    //     {rotation:{z:"-1.2"},
    //     children :[{
    //         rotation : {z:"+1.6"},
    //         children :[{
    //             rotation : {z:"+0.1"},
    //             children :[{
    //                 rotation : {z:"+0.6"}
    //             }]
    //         }]
    //     }]}, 300);

    var backwardRightLeg = new TWEEN.Tween(rightThigh, groupRun).to(
        // {rotation:{z:["+1.2", "-1.2"]},
        // children :[{
        //     rotation : {z:["-1.0","+1.0"]},
        //     children :[{
        //         rotation : {z:["-0.1","+0.1"]},
        //         children :[{
        //             rotation : {z:["-0.6", "+0.6"]}
        //         }]
        //     }]
        // }]}, 600).repeat(Infinity);
        {rotation:{z:[-3, -1.9]},
        children :[{
            rotation : {z:[-1.2,-2.2]},
            children :[{
                rotation : {z:[0.4,0.8]},
                children :[{
                    rotation : {z:[0.5, -0.5]}
                }]
            }]
        }]}, 600).repeat(Infinity);

    startLeftLeg.chain(forwardLeftLeg);
    startRightLeg.chain(backwardRightLeg);
    // backwardLeftLeg.chain(forwardLeftLeg);
    // forwardLeftLeg.chain(backwardLeftLeg);
    // backwardRightLeg.chain(forwardRightLeg);
    // forwardRightLeg.chain(backwardRightLeg);

    //spine
    var spine = robotParts[10].rotation;
    var rotateSpine = new TWEEN.Tween(spine, groupRun).to({z:0.08}, 150);
    rotateSpine.chain(new TWEEN.Tween(robotParts[21], groupRun).to(
                        {rotation: {y:[0.07,0,-0.07,0]}}, 600
                    )
                    .repeat(Infinity)
                    .delay(150)
                    .repeatDelay(0));
    
    rotateSpine.start();

    var pelvis = robotParts[9];
    var moverun = new TWEEN.Tween(pelvis, groupRun).to({rotation: {y:3.15}}, 0);
    // var moverun2 = new TWEEN.Tween(pelvis, groupRun).to({position: {x:-1000}}, 4000);
    // var moveCam = new TWEEN.Tween(camera, groupRun).to({position: {z:-5}}, 4000);
    // moverun.chain(moverun2)

    moverun.start();
    // moveCam.start(); 
    

    startRight.start();
    startLeftLeg.start();

    startLeft.start();    
    startRightLeg.start();

    // for(var t of groupRun.getAll())
    //     t.easing(TWEEN.Easing.Bouncing.Out);


}

const render = function() {
    // if(robotParts.length != 0)
    //     for(let part of robotParts)
    //         if(part.name.includes("Pelvis"))
    //             part.rotation.y += 0.00;
    
    var newSize = window.innerWidth / window.innerHeight;
    if (newSize != camera.aspect)
    {
        camera.aspect = newSize;
        camera.updateProjectionMatrix();
        let ratio = window.devicePixelRatio;
        renderer.setSize( window.innerWidth*ratio, window.innerHeight*ratio );
    }     

    requestAnimationFrame(render);



    groupRun.update();
    TWEEN.update();
    renderer.render(scene, camera);  
  }


window.onload = main();