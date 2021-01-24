"use strict";

import {LAssets, LImage, LAudios, LAudioLoop, LBase, LCamera, LObject, LIObject, LWObject, LStaticGroup, LGroupDef,
    LStructureDef, LTextureControl, LVirtObject, LGroup, LStructure, LKey, lInput, lInText, LObjImport, LComponent,
    lInit, lClear, lStructureSetup, lTextureColor, lTextureColorAll, lTextureList, lLoadTexture, lReloadTexture, lLoadTColor,
    lReloadTColor, lLoadTColors, lReloadTColors, lLoadTCanvas, lReloadTCanvas, lInitShaderProgram, lElement, lAddButton, lCanvasResize,
    lFromXYZR, lFromXYZ, lFromXYZPYR, lExtendarray, lGetPosition, lAntiClock, lCoalesce, lIndArray,
    LPRNG, LPRNGD, LCANVAS_ID, LR90, LR180, LR270, LR360, LI_FRONT, LI_BACK, LI_SIDE, LI_TOP, LI_RIGHT, LI_BOTTOM, LI_LEFT, LSTATIC,
    LDYNAMIC, LNONE, LBUT_WIDTH, LBUT_HEIGHT, LMESTIME, LASSET_THREADS, LASSET_RETRIES, LOBJFILE_SMOOTH, LTMP_MAT4A, LTMP_MAT4B,
    LTMP_MAT4C, LTMP_QUATA, LTMP_QUATB, LTMP_QUATC, LTMP_VEC3A, LTMP_VEC3B, LTMP_VEC3C, lSScene, LTEXCTL_STATIC,
    LTEXCTL_STATIC_LIST, lGl, lCamera, lScene, lDoDown, lDoUp, lShader_objects, mat4, vec3, vec4, quat} from "../../libs/limpetge.js";

import { EKronky, Wall, GlassPartition, Post, Exit, Flower, Lift, DodgyBridge, DodgyBridge2, Cage, PushMe,
Zip11, Zip21, FlowerStand, Glass, Door, Portcullis, Rope, DKeyHole, XKeyHole, Rocket, DKey, XKey, Pillar, Pedestal,
Floor, PFloor, RFloor, RPFloor, Wire, WireQ} from "./kronky.js";

const cLevels = [
    {
        description: "Tutorial - Take the flower to the exit",
        intro: "intros/tutorial1.html",
        map: function()
        {
            lScene.walls(-.5, -1, .5, 1, 0);
            new Floor(0, 5, -10, 0);
            new Floor(0, 0, -10, 0);
            new Floor(0, 0, 0, 0);
            new Floor(0, 0, 10, 0);

            new Lift(0, 0, -4.5, 0);
    
            new Exit(0, 5, -13, LR180).open();
            new Flower(-2, 0, 6, 0);
            new FlowerStand(-2, 0, 6, 0);

            lCamera.moveFlat(0, 0, 14);
        },
    },
    {
        description: "Tutorial - Unlock door then...",
        intro: "intros/tutorial2.html",
        map: function()
        {
            lScene.walls(-.5, -1, .5, 1, 0);
            new Floor(0, 5, -10, 0);
            new Floor(0, 0, -10, 0);
            new Floor(0, 0, 0, 0);
            new Floor(0, 0, 10, 0);
    
            new Lift(0, 0, -4.5, 0);
    
            var exit = new Exit(0, 5, -13, LR180)
            new Flower(-2, 0, 6, 0);
            new FlowerStand(-2, 0, 6, 0);
    
            new DKey(2, 0, 6, 0);
            new DKeyHole(2, 5, -11, 0);
    
            lCamera.moveFlat(0, 0, 14);
            lScene.do_achieve = function() {
                if (lScene.achievements.dkey >= 1) exit.open();
            }
        },
    },
    {
        intro: "intros/tutorial3.html",
        description: "Tutorial - First Kronky Challenge",
        map: function()
        {
            lScene.walls(-.5, -1, .5, 1, 0);
            new Floor(0, 5, -10, 0);
            new Floor(0, 0, -10, 0);
            new Floor(0, 0, 0, 0);
            new Floor(0, 0, 10, 0);
            new Floor(0, 5, 10, 0);
    
            new Lift(0, 0, -4.5, 0);
    
            var exit = new Exit(0, 5, -13, LR180)
            new Flower(-2, 5, 6, 0);
            new FlowerStand(-2, 5, 6, 0);
    
            new DKey(2, 5, 6, 0);
            new DKeyHole(2, 5, -11, 0);
    
            lCamera.moveFlat(0, 5, 14);
            lScene.do_achieve = function() {
                if (lScene.achievements.dkey >= 1) exit.open();
            }
        },
    },
    {
        intro: "intros/rocketguy.html",
        description: "Rocket Guy",
        map: function()
        {
            lScene.walls(-0.5, -1.5, 0.5, 1.5, 0);
            new Floor(0, 0, -20, 0);
            new Floor(0, 0, 0, 0);
            new Floor(0, 0, 20, 0);
            new Floor(0, 0, 30, 0);
            new Pillar(0, 5, 20, 0);
            new Pillar(0, 5, 30, 0);
    
            (new Exit(0, 0, -20, LR180)).open();
            new Flower(1, 0, 20, 0);
            new FlowerStand(1, 0, 20, 0);

            // new Glass(0, 0, 24, 0);
    
            new Rocket(-1, 0, 3, 0);
            lCamera.moveFlat(0, 0, -3);
        },
    },
    {
        intro: "intros/wherekey.html",
        description: "Where is the other key?",
        map: function()
        {
    
            lScene.walls(-0.5, -0.5, 0.5, 0.5, 0);
            new Flower(-2, 0, 2, 0);
            new FlowerStand(-2, 0, 2, 0);
            new DKey(2, 0, 2, 0);
    
            var exit = new Exit(0, 0, -9, LR180);
    
            new Floor(0, 0,  10, 0);
            new Floor(0, 0, 0, 0);
            new Floor(0, 0, -10, 0);
    
            new DKeyHole(-1.5, 0, -7, 0);
            new DKeyHole(1.5, 0, -7, 0);
    
            lScene.do_achieve = function() {
                if (lScene.achievements.dkey >= 2) exit.open();
            }
            lCamera.moveHere(0, 0, 8);
        },
    },
    {
        intro: "intros/cage1.html",
        description: "Cage Challenge",
        map: function()
        {
            lScene.walls(-.5, -1.5, .5, 1.5, 0);
            new Floor(0, 0, -20, 0);
            new Floor(0, 0, 20, 0);
    
            new Cage(-4, 0, 16, 0);
            new PushMe(4, 0, 16, 0);
    
    
            new Exit(0, 0, -23, LR180).open();
            new Flower(0, 0, 16, 0);
            new FlowerStand(0, 0, 16, 0);
    
            lCamera.moveFlat(0, 0, 24);
        },
    },
    {
        intro: "intros/cagekey.html",
        description: "Cage and key",
        map: function()
        {
            lScene.walls(-1.5, -2.0, .5, 1.0, 0);
    
            new Floor(0, 0, 10, 0);
            new Floor(0, 0, 0, 0);
    
            new Floor(-20, 0, -24, 0);
            new Floor(-20, 0, -34, 0);
    
    
            var exit = new Exit(-20, 0, -37, LR180);
            new DKeyHole(-18, 0, -35, 0);
    
    
            new Cage(-4, 0, -4, 0);
            new DKey(4, 0, -4, 0);
            new PushMe(-4, 0, 4, 0);
    
            new Flower(4, 0, 4, 0);
            new FlowerStand(4, 0, 4, 0);
    
            lScene.do_achieve = function() {
                if (lScene.achievements.dkey >= 1) exit.open();
            }
    
            lCamera.moveFlat(0, 0, 13);
        },
    },

    {
        description: "The Dodgy Bridge",
        intro: "intros/dodgybridge.html",
        map: function()
        {
            lScene.walls(-.5, -1, .5, 2, 0);

            new Floor(0, 5, 40, 0);
            new Pillar(0, 0, 40, 0);

            var fdoor = new Door(0, 5, 38, LR180);
            new DKeyHole(2, 5, 36, LR180);
            new Floor(0, 5, 30, 0);
            new Pillar(0, 0, 30, 0);
            new Floor(0, 0, 20, 0);
            new Floor(0, 0, 10, 0);
            new Floor(0, 0, -10, 0);

            new XKey(0, 0, 10, 0),
            new FlowerStand(-3, 5, 40, 0),
            new Flower(-3, 5, 40, 0),

            new DodgyBridge(-3, 0, 0, 0);
            new DodgyBridge(3, 0, 0, 0);

            new DKey(2, 0, -11, 0);
            new XKeyHole(-2, 0, -11, 0);
            // new XKeyHole(2, 0, -11, 0);

            var exit = new Exit(0, 0, -13, LR180);
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1) exit.open();
                if (lScene.achievements.dkey >= 1) fdoor.open();
            }
            lCamera.moveFlat(0, 5, 33);
        }
    },

    {
        intro: "intros/target.html",
        description: "Target practice",
        map: function()
        {
    
            lScene.walls(-1, -1, 1, 1, 0);
    
            new Floor(-10, 0, 10, 0);
            new Floor(0,   0, 10, 0);
            new Floor(10,  0, 10, 0);
            new Floor(0,   5, 10, 0);
    
            new Pillar(0, 0, -10, 0);
            new Floor(0, 5, -10, 0);
    
            new DodgyBridge(0, 5, 0, 0);
    
            new DKey(-10, 0, 10, 0);
            new XKey(10, 0, 10, 0);
    
            new DKeyHole(-4, 5, -5.5, 0);
            new XKeyHole(4, 5, -5.5, 0);
            
            new Flower(0, 0, 10, 0);
            new FlowerStand(0, 0, 10, 0);
    
            var exit = new Exit(0, 5, -10, LR180);
    
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1 && lScene.achievements.dkey >= 1) exit.open();
            }
    
            lCamera.moveFlat(0, 5, 14);
        },
            
    },

    {
        description: "Zip it up",
        intro: "intros/zipitup.html",
        map: function()
        {
            lScene.walls(-1, -1.5, 1, 1.5, 0);
            new Floor(20, 0, 5, 0);
            new Floor(10, 0, 5, 0);
            new Floor(0, 0, 5, 0);
            new Floor(-10, 0, 5, 0);
            new Floor(0, 5, 5, 0);
            new Floor(-10, 5, 5, 0);

            new Floor(20, 0, -5, 0);
            new Floor(10, 0, -5, 0);
            new Floor(0, 0, -5, 0);
            new Floor(-10, 0, -5, 0);
            new Floor(0, 5, -5, 0);
            new Floor(-10, 5, -5, 0);

            new Floor(-20, 5, 0, 0);
            new Pillar(-20, 0, 0, 0);

            new Floor(10, 0, -35, 0);
            new Floor(10, 5, -35, 0);
            new Floor(0, 0, -35, 0);
            new Floor(-10, 5, -35, 0);
            new Floor(-10, 0, -35, 0);

            new DodgyBridge2(-7, 5, -20, 0);

            new Lift(4.5, 0, -35, 0);
            new Lift(-4.5, 0, -35, 0);

            new Zip21(0, 5, -9.5, 0);
            new Zip21(10, 5, -30.5, LR180);

            new Pillar(0, 0, 35, 0);
            new Floor(0, 5, 35, 0);

            new Cage(0, 5, 9, 0);

            var door = new Door(-17, 5, 0, LR90);
            new DKeyHole(-15,  5, -2.5, LR90).setachieve("door");

            new XKey(2, 5, 32, 0);
            new FlowerStand(-21, 5, 0, 0);
            new Flower(-21, 5, 0, 0);

            new DKey(10, 5, -36, 0);

            new XKeyHole(-12, 5, -36, 0).setachieve("exit");


            var exit = new Exit(-10, 5, -38, LR180);
            new PushMe(-20, 5, 3, 0);

            lScene.do_achieve = function() {
                if (lScene.achievements.door >= 1) door.open();
                if (lScene.achievements.exit >= 1) exit.open();
            }
            lCamera.moveFlat(0, 5, 0);
        
        },
    },
    {
        description: "A game of catch",
        intro: "intros/catch.html",
        map: function()
        {
            lScene.walls(-1, -1, 1, 1, 0);
            new Floor(-10, 0, -30, 0);
            new Floor(-10, 0, -20, 0);
            new Floor(10,  0, -30, 0);
            new Floor(10,  0, -20, 0);
            new Floor(-10, 0, 10, 0);
            new Floor(0,   0, 10, 0);
            new Floor(10,  0, 10, 0);
            new Floor(-10, 5, 10, 0);
            new Floor(0,   5, 10, 0);
            new Floor(10,  5, 10, 0);
    
            new Zip21(-10, 5, 5.5, 0);
            new Zip21(10, 5, 5.5, 0);
    
            var exit = new Exit(-10, 0, -32, LR180);
            new Flower(-7, 0, -28, 0);
            new FlowerStand(-7, 0, -28, 0);
    
            new XKeyHole(-12, 0, -28, 0);
            new XKey(10, 0, -28, 0);
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1) exit.open();
            }
    
            lCamera.moveFlat(0, 5, 6);
        },
    },
    {
        description: "Simple wire",
        intro: "intros/wire.html",
        map: function()
        {

            lScene.walls(-.5, -1.5, .5, 1.5, 0);

            new Pillar(-5, 0, 20, 0);
            new Pillar(5, 0, 20, 0);
            new Floor(-5, 5, 20, 0);
            new Floor(5, 5, 20, 0);
            new Zip21(-5, 5, 15.5, 0);

            new Floor(5, 0, 10, 0);
            // new Wire(0.1, 0, 10, LR90);
            new Floor(5, 0, 0, 0);
            new Wire(0.1, 0, 0, LR90);

            new Floor(5, 0, -10, 0);
            new Floor(-5, 0, -10, 0);
            new Wire(0, 0, -10, LR90);

            new Exit(-5, 0, -13, LR180).open();

            new FlowerStand(-1, 5, 16, 0);
            new Flower(-1, 5, 16, 0);

            lCamera.moveFlat(1, 5, 24);
        }
    },
    {
        intro: "intros/rfloor.html",
        description: "Cage and key again",
        map: function()
        {
            lScene.walls(-.5, -2.0, .5, 1.0, 0);
    
            new Floor(0, 0, 10, 0);
            new Floor(0, 0, 0, 0);
            new RFloor(0, 0, -10, 0);
    
            new RFloor(-17, 0, -27, 0);
            new RFloor(-17, 0, -37, 0);
    
    
            var exit = new Exit(-17, 0, -34, LR180);
            new DKeyHole(-15, 0, -32, 0);
    
    
            new Cage(-4, 0, -14, 0);
            new DKey(4, 0, -4, 0);
            new PushMe(-3, 0, 2, 0);
    
            new Flower(3, 0, 2, 0);
            new FlowerStand(3, 0, 2, 0);
    
            lScene.do_achieve = function() {
                if (lScene.achievements.dkey >= 1) exit.open();
            }
    
            lCamera.moveFlat(0, 0, 8);
        },
    },

    {
        intro: "intros/portcullis.html",
        description: "Gated assets",
        map: function()
        {
            lScene.walls(-.5, -1.0, 1.5, 1.0, 0);
    
            new Floor(0, 0, 10, 0);
            new Floor(0, 0, 0, 0);

            var port = new Portcullis(0, 0, 0, 0);
            new Rope(-1, 0, 3, 0).setPort(port);

            new Floor(0, 0, -10, 0);
            new Cage(4, 0, -8, 0);
            new PushMe(2, 0, -8, 0);

            new Floor(30, 0, -5, 0);

            var port2 = new Portcullis(30, 0, -3, LR180);
            new Rope(31, 0, -6, LR180).setPort(port2);

            new XKey(30, 0, -2, 0);

            new Flower(-2, 0, 8, 0);
            new FlowerStand(-2, 0, 8, 0);

            var exit = new Exit(0, 0, -13, LR180);
            new XKeyHole(-2, 0, -11, 0);
    
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1) exit.open();
            }
    
            lCamera.moveFlat(0, 0, 14);
        },
    },

    {
        description: "Pass the parcel",
        intro: "intros/ekronky.html",
        map: function()
        {
            lScene.walls(-1, -2, 1, 1, 0);
            new Floor(-20, 5, 10, 0);
            new Pillar(-20, 0, 10, 0);
            new Floor(20,  5, 10, 0);
            new Pillar(20,  0, 10, 0);
            new Floor(-10, 5, 10, 0);
            new Pillar(-10,  0, 10, 0);
            new Floor(0, 5, 10, 0);
            new Pillar(0, 0, 10, 0);
            new Floor(10, 5, 10, 0);
            new Pillar(10,  0, 10, 0);
    
            new Floor(-20, 0, -30, 0);
            new Floor(-20, 0, -20, 0);
    
            new Floor(0, 0, -30, 0);
            new Floor(0, 0, -20, 0);
    
            new Floor(20, 0, -30, 0);
            new Floor(20, 0, -20, 0);
    
            new Zip21(-20, 5, 5.5, 0);
            new Zip21(0, 5, 5.5, 0);
            new Zip21(20, 5, 5.5, 0);
    
    
            var exit = new Exit(20, 0, -32, LR180);
            new Flower(20, 0, -20, 0);
            new FlowerStand(20, 0, -20, 0);
    
            new DKeyHole(22, 0, -28, 0);
            new DKey(-20, 0, -30, 0);
    
            new EKronky(0, 5, 10, 0);
    
            lScene.do_achieve = function() {
                if (lScene.achievements.dkey >= 1) exit.open();
            }
    
            lCamera.moveFlat(0, 5, 14);
        },
    },

    {
        description: "Dodgy Wires",
        intro: "intros/conclusion.html",
        map: function()
        {

            lScene.walls(-.5, -2.5, 1.5, 1.5, 0);

            new Pillar(-5, 0, 40, 0);
            new Floor(-5, 5, 40, 0);

            new FlowerStand(-1, 5, 36, 0);
            new Flower(-1, 5, 36, 0);

            new DodgyBridge(-5, 5, 30, 0);

            new Floor(5, 0, 40, 0);
            new Floor(5, 0, 10, 0);
            new Pillar(-5, 0, 20, 0);

            new Zip11(-5, 5, 15.5, 0);
            new Floor(-5, 5, 20, 0);
            new Wire(-0.1, 5, 20, LR90);
            new Wire(0.1, 0, 10, LR90);
            new Wire(0.1, 2.5, 10, LR90);
            new Wire(0.1, 5, 10, LR90);

            new DodgyBridge2(5, 0, 25, 0);
            new Floor(5, 0, 0, 0);
            new Wire(-0.1, 2.5, 0, LR90);
            new Wire(0.1, 5, 0, LR90);
            new Lift(5, 0, 5.5, 0);
            new Floor(5, 0, 0, 0);
            new Floor(-5, 0, 0, 0);
            new Floor(5, 5, 0, 0);
            new Zip11(5, 5, -4.5, 0);

            new PushMe(5, 0, -20, 0);

            new Wire(-0.1, 0, -0, LR90);
            new Wire(0.1, 5, -0, LR90);

            new DodgyBridge(-5, 0, -10, 0);
            new Floor(-5, 0, -20, 0);
            new Floor(5, 0, -20, 0);
            new Wire(-0.1, 0, -20, LR90);

            new Wire(-0.2, 0, -30, LR90);
            new Floor(-3, 0, -30, 0);
            new Cage(1, 0, -30, 0);

            new Floor(30, 0, -30, 0);
            var exit = new Exit(33, 0, -30, LR90).open();

            lCamera.moveFlat(-6, 5, 44);
        }
    },
    {
        description: "High Checkers",
        map: function()
        {
            lScene.walls(-2.5, -1.5, 2.5, 2.5, 1);
            new Floor(-40, 5, -10, 0);
            new Pillar(-40, 0, -10, 0);
            new Floor(-50, 10, 0, 0);
            new Pillar(-50, 5, 0, 0);
            new Pillar(-50, 0, 0, 0);
            new Floor(-40, 20, 10, 0);
            new Pillar(-40, 15, 10, 0);
            new Pillar(-40, 10, 10, 0);
            new Pillar(-40, 5, 10, 0);
            new Pillar(-40, 0, 10, 0);
            new Floor(-30, 20, 20, 0);
            new Pillar(-30, 15, 20, 0);
            new Pillar(-30, 10, 20, 0);
            new Pillar(-30, 5, 20, 0);
            new Pillar(-30, 0, 20, 0);
            new Floor(-20, 20, 30, 0);
            new Pillar(-20, 15, 30, 0);
            new Pillar(-20, 10, 30, 0);
            new Pillar(-20, 5, 30, 0);
            new Pillar(-20, 0, 30, 0);
            new Floor(-10, 15, 40, 0);
            new Pillar(-10, 10, 40, 0);
            new Pillar(-10, 5, 40, 0);
            new Pillar(-10, 0, 40, 0);
    
            new Pillar(40, 0, -10, 0);
            new Floor(40, 5, -10, 0);
            new Pillar(50, 5, 0, 0);
            new Floor(50, 10, 0, 0);
            new Pillar(50, 0, 0, 0);
            new Floor(40, 20, 10, 0);
            new Pillar(40, 15, 10, 0);
            new Pillar(40, 10, 10, 0);
            new Pillar(40, 5, 10, 0);
            new Pillar(40, 0, 10, 0);
            new Floor(30, 20, 20, 0);
            new Pillar(30, 15, 20, 0);
            new Pillar(30, 10, 20, 0);
            new Pillar(30, 5, 20, 0);
            new Pillar(30, 0, 20, 0);
            new Floor(20, 20, 30, 0);
            new Pillar(20, 15, 30, 0);
            new Pillar(20, 10, 30, 0);
            new Pillar(20, 5, 30, 0);
            new Pillar(20, 0, 30, 0);
            new Floor(10, 15, 40, 0);
            new Pillar(10, 10, 40, 0);
            new Pillar(10, 5, 40, 0);
            new Pillar(10, 0, 40, 0);
    
            new Floor(0, 10, 50, 0);
            new Pillar(0, 5, 50, 0);
            new Pillar(0, 0, 50, 0);
    
            new Floor(0, 5, -30, 0);
            new Pillar(0, 0, -30, 0);
            new Floor(10, 5, -20, 0);
            new Pillar(10, 0, -20, 0);
            new Floor(-10, 5, -20, 0);
            new Pillar(-10, 0, -20, 0);
            new Floor(0, 5, -10, 0);
            new Pillar(-10, 0, 0, 0);
            new Floor(0, 20, 10, 0);
            new Pillar(0, 15, 10, 0);
            new Pillar(0, 10, 10, 0);
            new Pillar(0, 5, 10, 0);
    
            new Pillar(10, 0, 0, 0);
            new Pillar(10, 5, 0, 0);
            new Pillar(10, 10, 0, 0);
            new Pillar(10, 15, 0, 0);
            new Floor(10, 20, 0, 0);
            new Pillar(-10, 0, 0, 0);
            new Pillar(-10, 5, 0, 0);
            new Pillar(-10, 10, 0, 0);
            new Pillar(-10, 15, 0, 0);
            new Floor(-10, 20, 0, 0);

            new Rocket(10, 20, 0, 0);
            var exit = new Exit(0, 5, -33, LR180);
    
            new DKey(-40, 20, 10, 0);
            new DKeyHole(-40, 5, -14, 0);
            new XKey(40, 20, 10, 0);
            new XKeyHole(40, 5, -14, 0);
    
            new FlowerStand(0, 10, 50, 0);
            new Flower(0, 10, 50, 0);
    
    
            lCamera.moveFlat(0, 20, 10);
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1 && lScene.achievements.dkey >= 1) exit.open();
            }
        },
    },
    {
        description: "Another game of catch",
        map: function()
        {
    
            lScene.walls(-1, -1, 1, 1, 0);
    
            new Floor(-10, 0, -30, 0);
            new Floor(-10, 0, -20, 0);
            new Floor(10,  0, -30, 0);
            new Floor(10,  0, -20, 0);
            new Floor(-10, 0, 10, 0);
            new Floor(0,   0, 10, 0);
            new Floor(10,  0, 10, 0);
            new Floor(-10, 5, 10, 0);
            new Floor(0,   5, 10, 0);
            new Floor(10,  5, 10, 0);
    
            new Zip21(-10, 5, 5.5, 0);
            new Zip21(10, 5, 5.5, 0);
    
            var exit = new Exit(-10, 0, -32, LR180);
            new Flower(-13, 0, -28, 0);
            new FlowerStand(-13, 0, -28, 0);
    
            new XKeyHole(10, 0, -28, 0);
            new XKey(-7, 0, -28, 0);
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1) exit.open();
            }
    
            lCamera.moveFlat(0, 5, 6);
        },
    },
    {
        description: "A larger puzzle",
        map: function()
        {
            lScene.walls(-1, -2, 1, 1, 0);
            new Floor(-20, 5, 10, 0);
            new Floor(-20, 0, 10, 0);
            new Floor(20,  0, 10, 0);
            new Floor(20,  5, 10, 0);
            new Floor(-10, 0, 0, 0);
            new Floor(0,   0, 0, 0);
            new Floor(10,  0, 0, 0);
            new Floor(-10, 0, 10, 0);
            new Floor(0,   0, 10, 0);
            new Floor(10,  0, 10, 0);
    
            new Floor(-20, 0, -30, 0);
            new Floor(-20, 0, -20, 0);
    
            new Floor(0, 0, -30, 0);
            new Floor(0, 0, -20, 0);
    
            new Floor(20, 0, -30, 0);
            new Floor(20, 0, -20, 0);
    
            new Zip21(-20, 5, 5.5, 0);
            new Zip21(20, 5, 5.5, 0);
    
            new DodgyBridge(0, 0, -10, 0);
            
    
            var exit = new Exit(0, 0, -32, LR180);
            new Flower(0, 0, -20, 0);
            new FlowerStand(0, 0, -20, 0);
    
            new XKeyHole(-2, 0, -28, 0);
            new DKeyHole(2, 0, -28, 0);
    
            new XKey(17, 0, -28, 0);
            new DKey(-17, 0, -28, 0);
    
            new Lift(-14.5, 0, 10, 0);
            new Lift(14.5, 0, 10, 0);
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1 && lScene.achievements.dkey >= 1) exit.open();
            }
    
            lCamera.moveFlat(0, 0, 0);
        },
    },
    {
        description: "Road to go",
        map: function()
        {
            lScene.walls(-2.0, -3.0, 2.0, 1.0, 0);
            new RFloor(-40, 0, 14, 0);
            new RFloor(-50, 0, 14, 0);
            new RFloor(-30, 0, 0, 0);
            new RFloor(-30, 0, 10, 0);
            new RFloor(-25, 0, 20, 0);
            new RFloor(-20, 0, 30, 0);
            new Lift(-15.5, 0, 30, 0);
            new RFloor(-10, 0, 30, 0);
            new RFloor(-10, 5, 30, 0);
            new Lift(-5.5, 5, 30, 0);

            new Zip11(5.5, 5, 30, LR90);

    

            new Pillar(0, 0, 30, 0);
            new Pillar(0, 5, 30, 0);
            new RFloor(0, 10, 30, 0);

            new RFloor(10, 5, 30, 0);
            new RFloor(10, 0, 30, 0);
            new Lift(15.5, 0, 30, 0);
            new RFloor(20, 0, 30, 0);
            new RFloor(20, 0, 20, 0);
            new RFloor(30, 0, 14, 0);
            new Pillar(-20, 0, 0, 0);
            new RFloor(-20, 5, 0, 0);
            new DodgyBridge(-10, 5, 3, LR90);
            new DodgyBridge(-10, 5, -4, LR90);

            new Wire(-20, 5, -2.8, 0);
            new Wire(-30, 5, -2.8, 0);
            new Wire(-30, 2.5, -2.8, 0);
            new Wire(-30, 0, -2.8, 0);
    
            new Pillar(0, 0, 0, 0);
            new Floor(0, 5, 0, 0);
            new RFloor(10, 0, 0, 0);
            new Floor(20, 0, 0, 0);
    
            new Lift(5.5, 0, 4, 0);
            new PushMe(24, 0, -4, 0);
    
            new Cage(-32, 0, -4, 0);

            new Post(-24, -5, -10, LR90);
            new GlassPartition(-24, 0, -10, LR90);
            new Post(-24, -5, -30, LR90);
            new GlassPartition(-24, 0, -30, LR90);
            new Post(-34, -5, -20, LR90);
            new GlassPartition(-34, 0, -20, LR90);
            new Post(-34, -5, -40, LR90);
            new GlassPartition(-34, 0, -40, LR90);
    
            new XKeyHole(20.5, 0, 4.4, LR90).setachieve("dkdoor");
            new XKey(0, 5, -4, 0);

            new RFloor(-30, 0, -54, 0);
            new RFloor(-45, 0, -45, 0);
            new RFloor(-40, 0, -55, 0);
            new RFloor(-20, 0, -50, 0);
            new Floor(-10, 0, -50, 0);
            new RFloor(0, 0, -50, 0);
            new RFloor(0, 5, -50, 0);
            new RFloor(0, 0, -60, 0);
            new RFloor(-20, 5, -50, 0);
    
            new Lift(-25.5, 0, -54, 0);
            new XKeyHole(-11, 0, -47, -LR90).setachieve("dkdoor2");
    
            new PushMe(-9, 0, -54, 0);
            new DKey(-9, 0, -46, 0);
    
            new DKeyHole(-22, 0, -52, LR90).setachieve("dkdoor3");

            new DodgyBridge(-10, 5, -50, LR90);
    
            new Cage(4, 0, -59, 0);
    
            new RFloor(20, 0, -50, 0);
            new RFloor(20, 0, -60, 0);
            new RFloor(30, 0, -50, 0);
    
            new DKeyHole(27, 0, -47, -LR90).setachieve("dkdoor4");
    
            new FlowerStand(34, 0, -50, 0);
            new Flower(34, 0, -50, 0);


            new Floor(38, 0, -70, 0);
            new Cage(34, 0, -54, 0);
            new EKronky(38, 0, -70, 0);
    
            var exit = new Exit(33, 0, 14, LR90).open();
            // new XKeyHole(31, 0, 10, -LR90).setachieve("exit");
            // new DKeyHole(31, 0, 18, -LR90).setachieve("exit");
    
            var door = new Door(20, 0, 0, LR90);
            var door2 = new Door(-10, 0, -50, -LR90);
            var door3 = new Door(-23, 0, -50, -LR90);
            var door4 = new Door(30, 0, -50, -LR90);
    
                
            lCamera.moveFlat(0, 5, 4, 0);
    
            lScene.do_achieve = function() {
                if (lScene.achievements.dkdoor >= 1) door.open();
                if (lScene.achievements.dkdoor2 >= 1) door2.open();
                if (lScene.achievements.dkdoor3 >= 1) door3.open();
                if (lScene.achievements.dkdoor4 >= 1) door4.open();
                // if (lScene.achievements.exit >= 2) exit.open();
            }
    
        },
    
    },
    {
        description: "Where are the non-gated keys?",
        map: function()
        {
            lScene.walls(-1.5, -1, .5, 1, 0);
            new DKey(2, 5, 16, 0);
            new Flower(-2, 5, 16, 0);
            new FlowerStand(-2, 5, 16, 0);

            new Pillar(0, 0, 20, 0);
            new Floor(0, 5, 20, 0);
            new Floor(0, 0, -10, 0);
            new Floor(0, 0, -20, 0);
            new Floor(0, 0, 0, 0);
            new Floor(0, 0, 10, 0);
            new Floor(-30, 0, -20, 0);

            var port = new Portcullis(0, 0, -1, 0);

            new Rope(-1, 0, 2, 0).setPort(port);

            new DKeyHole(-3, 0, -6.5, 0);
            new DKeyHole(3, 0, -6.5, 0);

            var door = new Door(0, 0, -10, 0);

            new Cage(-4, 0, -18, 0);
            new PushMe(4, 0, -18, 0);

            new XKey(-34, 0, -24, 0);

            new XKeyHole(-2, 0, -21, 0);
            new XKeyHole(2, 0, -21, 0);
            var exit = new Exit(0, 0, -23, LR180);
            lScene.do_achieve = function() {
                if (lScene.achievements.dkey >= 2) door.open();
                if (lScene.achievements.xkey >= 2) exit.open();
            }

            lCamera.moveFlat(0, 5, 24);
        },
    },
    {
        description: "Cage key puzzle for two",
        map: function()
        {
            lScene.walls(-1, -1.5, 1, 1.5, 0);
            new Floor(0, 0, 0, 0);
            new Floor(0, 0, 10, 0);
            new Floor(0, 0, 20, 0);
            new Floor(0, 5, 20, 0);
            new Floor(-30, 0, 10, 0);
            new Floor(-30, 0, 0, 0);
            var port2 = new Portcullis(-30, 0, 4, 0);
            new Rope(-31, 0, 7, 0).setPort(port2);
    
            new Cage(-4, 0, 10, 0);
            new PushMe(4, 0, 4, 0);
    
            new DKeyHole(2, 0, -1, 0);
            new XKeyHole(-2, 0, -1, 0);
            new DKey(-27, 0, 0, 0);
            new XKey(-33, 0, 0, 0);
    
            var exit = new Exit(0, 0, -3, LR180);
    
            new Flower(0, 5, 16, 0);
            new FlowerStand(0, 5, 16, 0);
            new EKronky(0, 5, 20, 0);
    
            lCamera.moveFlat(0, 5, 24);
            lScene.do_achieve = function() {
                if (lScene.achievements.dkey >= 1 && lScene.achievements.xkey >= 1) exit.open();
            }
        },
    },
    {
        description: "Rocket get down",
        map: function()
        {
            lScene.walls(-2, -2, 2, 2, 1);
    
            new Floor(0, 0, 0, 0);
            new Floor(10, 0, 0, 0);
            new Floor(-10, 0, 0, 0);
            new Floor(0, 0, 10, 0);
            new Floor(0, 0, -10, 0);
            new Floor(10, 0, 10, 0);
            new Floor(10, 0, -10, 0);
            new Floor(-10, 0, 10, 0);
            new Floor(-10, 0, -10, 0);
    
    
            var exit = new Exit(0, 0, -10, LR180);
    
            new Flower(0, 0, 10, 0);
            new FlowerStand(0, 0, 10, 0);
    
            new Pillar(-40, 0, 0, 0);
            new Pillar(40, 0, 0, 0);
            new Pillar(-40, 5, 0, 0);
            new Pillar(40, 5, 0, 0);
            new Pillar(-40, 10, 0, 0);
            new Pillar(40, 10, 0, 0);
            new Floor(-40, 15, 0, 0);
            new Floor(40, 15, 0, 0);
    
            new DKey(-40, 15, 4, 0);
            new DKeyHole(40, 15, -4, 0);
            new XKey(40, 15, 4, 0);
            new XKeyHole(-40, 15, -4, 0);
    
            
            new Pillar(0, 0, 40, 0);
            new Pillar(0, 0, 40, 0);
            new Pillar(0, 5, 40, 0);
            new Pillar(0, 5, 40, 0);
            new Pillar(0, 10, 40, 0);
            new Pillar(0, 10, 40, 0);
            new Floor(0, 15, 40, 0);
            new Floor(0, 15, 40, 0);
    
            new Rocket(0, 15, 36, 0);
    
    
            new Post(-25, -5, -20, LR90);
            new Post(-25, -5, -10, LR90);
            new Post(-25, -5, 0, LR90);
            new Post(-25, -5, 10, LR90);
            new Post(-25, -5, 20, LR90);
            new Post(25, -5, -20, LR90);
            new Post(25, -5, -10, LR90);
            new Post(25, -5, 0, LR90);
            new Post(25, -5, 10, LR90);
            new Post(25, -5, 20, LR90);
            new Post(-20, -5, 25, 0);
            new Post(-10, -5, 25, 0);
            new Post(0, -5, 25, 0);
            new Post(10, -5, 25, 0);
            new Post(20, -5, 25, 0);
            new Post(-20, -5, -25, 0);
            new Post(-10, -5, -25, 0);
            new Post(0, -5, -25, 0);
            new Post(10, -5, -25, 0);
            new Post(20, -5, -25, 0);
            new GlassPartition(-25, 0, -20, LR90);
            new GlassPartition(-25, 0, -10, LR90);
            new GlassPartition(-25, 0, 0, LR90);
            new GlassPartition(-25, 0, 10, LR90);
            new GlassPartition(-25, 0, 20, LR90);
            new GlassPartition(25, 0, -20, LR90);
            new GlassPartition(25, 0, -10, LR90);
            new GlassPartition(25, 0, 0, LR90);
            new GlassPartition(25, 0, 10, LR90);
            new GlassPartition(25, 0, 20, LR90);
            new GlassPartition(-20, 0, 25, 0);
            new GlassPartition(-10, 0, 25, 0);
            new GlassPartition(0, 0, 25, 0);
            new GlassPartition(10, 0, 25, 0);
            new GlassPartition(20, 0, 25, 0);
            new GlassPartition(-20, 0, -25, 0);
            new GlassPartition(-10, 0, -25, 0);
            new GlassPartition(0, 0, -25, 0);
            new GlassPartition(10, 0, -25, 0);
            new GlassPartition(20, 0, -25, 0);
    
            lCamera.moveFlat(0, 15, 44);
    
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1 && lScene.achievements.dkey >= 1) exit.open();
            }
        },
    
    },
    {
        description: "Keys for just two",
        map: function()
        {
            lScene.walls(-2, -2.0, 1, 2.0, 0);

            new Floor(20, 0, 50, 0);
            new Floor(10, 0, 50, 0);
            new Pillar(0, 0, 50, 0);
            new Floor(0, 5, 50, 0);
            new EKronky(0, 5, 46, 0);
            new Zip21(0, 5, 45.5, 0);
            new Floor(0, 0, 20, 0);
            new Floor(0, 0, 10, 0);
            new Floor(0, 0, 0, 0);
            new Floor(0, 0, -10, 0);

            new DodgyBridge2(-15, 0, 18, LR90);
            new DodgyBridge2(-15, 0, -8, LR90);

            new Floor(-30, 0, 20, 0);
            new Floor(-30, 0, 30, 0);

            var xdoor = new Door(-30, 0, 25, LR180);
            new XKeyHole(-28, 0, 23, LR180).setachieve("xdoor");

            new DKey(-30, 0, 30, 0);

            new Floor(-30, 0, -10, 0);
            new Floor(-30, 0, -20, 0);

            new XKey(-30, 0, -10, 0);

            var ddoor = new Door(-30, 0, -15, 0);
            new DKeyHole(-32, 0, -13, 0).setachieve("ddoor");


            new Flower(-30, 0, -20, 0);
            new FlowerStand(-30, 0, -20, 0);
            
            new Floor(-30, 0, 20, 0);
    
            new Cage(-30, 0, 16, 0);
            new PushMe(-3, 0, 18, 0);
            new PushMe(-3, 0, -8, 0);
    
    
            var exit = new Exit(20, 0, 50, LR90).open();
    
            // new Glass(0, 0, 30, 0);

    
            lCamera.moveFlat(0, 5, 50);
            lScene.do_achieve = function() {
                if (lScene.achievements.xdoor >= 1) xdoor.open();
                if (lScene.achievements.ddoor >= 1) ddoor.open();
            }
        },
    },
    {
        description: "Cage with lock way over there",
        map: function()
        {
            lScene.walls(-1, -1.5, 1, 1.5, 0);
            new Floor(0, 0, 30, 0);
            new DodgyBridge(-2, 0, 20, 0);
            new DodgyBridge(2, 0, 20, 0);
            new RFloor(0, 0, 10, 0);
            new RFloor(0, 0, 0, 0);
            new RFloor(-30, 0, 10, 0);
            new RFloor(-30, 0, 0, 0);
    
            new Cage(-4, 0, 10, 0);
            new PushMe(4, 0, 26, 0);
    
            new DKey(-4, 0, 26, 0);
            new DKeyHole(-26, 0, 0, 0);
    
            var exit = new Exit(0, 0, -3, LR180);
    
            new Flower(-4, 0, 34, 0);
            new FlowerStand(-4, 0, 34, 0);

            new EKronky(4, 0, 34, 0);
    
            lCamera.moveFlat(0, 0, 10);
            lScene.do_achieve = function() {
                if (lScene.achievements.dkey >= 1) exit.open();
            }
        },
    },
    {
        description: "Fenced areas",
        map: function()
        {

            lScene.walls(-2, -2, 2, 3, 0);

            new RFloor(0, 0, 46, 0);
            new Floor(0, 0, 36, 0);
            new RFloor(0, 0, 26, 0);
            var port2 = new Portcullis(0, 0, 30, 0);
            new Rope(-1, 0, 33, 0).setPort(port2);
            new Wire(-5, 0, 36, LR90);
            new Wire(5, 0, 36, LR90);
            // new Wire(0, 0, 41.6, 0);
            var portba = new Portcullis(0, 0, 42, LR180);
            new Rope(1, 0, 39, LR180).setPort(portba);


            new Exit(-2, 0, 49, 0).open();

            new Rocket(3, 0, 32, 0);
        

            new RFloor(0, 0, 0, 0);
            new RFloor(5, 0, -10, 0);
            new RFloor(5, 0, -20, 0);
            new RFloor(-5, 0, -10, 0);
            new RFloor(-5, 0, -20, 0);
            new RFloor(0, 0, -30, 0);
            new Cage(4, 0, -28, 0);
            var door = new Door(0, 0, -15, 0);
            new DKeyHole(2, 0, -13, 0).setachieve("md");;

            new Wire(2.8, 0, -30, LR90);
            new Wire(2.8, 0, -20, LR90);
            new Wire(-2.8, 0, -30, LR90);
            new Wire(-2.8, 0, -20, LR90);
            new Wire(0, 0, -35, 0);

            new RFloor(-30, 0, 0, 0);
            new Floor(-40, 0, 0, 0);
            var portd = new Portcullis(-34, 0, 0, LR90);
            new Rope(-31, 0, 1, LR90).setPort(portd);
            new Wire(-40, 0, -5, 0);
            new Wire(-40, 0, 5, 0);
            new Wire(-45, 0, 0, LR90);
            new EKronky(-40, 0, 0, 0);

            new RFloor(30, 0, 0, 0);
            new Floor(40, 0, 0, 0);
            var portk = new Portcullis(34, 0, 0, -LR90);
            new Rope(31, 0, 1, -LR90).setPort(portk);
            new Wire(40, 0, -5, 0);
            new Wire(40, 0, 5, 0);
            new Wire(45.1, 0, 0, LR90);
            new DKey(40, 0, 0, 0);

            new RFloor(-30, 0, -30, 0);
            new RFloor(-40, 0, -30, 0);
            new Floor(-50, 0, -30, 0);
            new Wire(-50, 0, -35, 0);
            new Wire(-50, 0, -25, 0);
            new Wire(-55, 0, -30, LR90);
            var port3 = new Portcullis(-44, 0, -30, LR90);
            new Rope(-41, 0, -29, LR90).setPort(port3);
            new Wire(-38, 0, -25, 0);
            new Wire(-38, 0, -35, 0);
            var port4 = new Portcullis(-32, 0, -30, LR90);
            new Rope(-29, 0, -29, LR90).setPort(port4);
            new PushMe(-50, 0, -30, 0);

            new Cage(-26, 0, -32, 0);

            // new RFloor(30, 0, -30, 0);
            new RFloor(40, 0, -30, 0);
            new FlowerStand(40, 0, -30, 0);
            new Flower(40, 0, -30, 0);

            lScene.do_achieve = function() {
                if (lScene.achievements.md >= 1) door.open();
            }


            lCamera.moveFlat(-2, 0, 41);
        },
    },
    {
        description: "A more complex puzzle",
        map: function()
        {
            lScene.walls(-1, -2, 1, 1, 0);
            new RFloor(-20, 5, 10, 0);
            new RFloor(-20, 0, 10, 0);
            new RFloor(20,  0, 10, 0);
            new RFloor(20,  5, 10, 0);
            new RFloor(-10, 0, 0, 0);
            new RFloor(0,   0, 0, 0);
            new RFloor(10,  0, 0, 0);
            new RFloor(-10, 0, 10, 0);
            new RFloor(0,   0, 10, 0);
            new RFloor(10,  0, 10, 0);
    
            new Floor(-20, 0, -30, 0);
            new RFloor(-20, 0, -20, 0);
    
            new RFloor(0, 0, -30, 0);
            new RFloor(0, 0, -20, 0);
    
            new Floor(20, 0, -30, 0);
            new RFloor(20, 0, -20, 0);
    
            new Zip21(-20, 5, 5.5, 0);
            new Zip21(20, 5, 5.5, 0);
    
            new DodgyBridge(0, 0, -10, 0);
    
            var exit = new Exit(0, 0, -32, LR180);
            new Flower(0, 0, -20, 0);
            new FlowerStand(0, 0, -20, 0);
    
            new XKeyHole(-2, 0, -28, 0);
            new DKeyHole(2, 0, -28, 0);
    
            new XKey(17, 0, -28, 0);
            new DKey(-17, 0, -28, 0);
    
            new Lift(-14.5, 0, 10, 0);
            new Lift(14.5, 0, 10, 0);
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1 && lScene.achievements.dkey >= 1) exit.open();
            }
    
            lCamera.moveFlat(0, 0, 0);
        },
    
    },
    {
        description: "High King Checkers",
        map: function()
        {
            lScene.walls(-2.5, -1.5, 2.5, 2.5, 2);
            new Pillar(-40, 0, -10, 0);
            new RFloor(-40, 5, -10, 0);
            new Floor(-50, 10, 0, 0);
            new Pillar(-50, 5, 0, 0);
            new Pillar(-50, 0, 0, 0);
            new RFloor(-40, 20, 10, 0);
            new Pillar(-40, 15, 10, 0);
            new Pillar(-40, 10, 10, 0);
            new Pillar(-40, 5, 10, 0);
            new Pillar(-40, 0, 10, 0);
            new RFloor(-30, 20, 20, 0);
            new Pillar(-30, 15, 20, 0);
            new Pillar(-30, 10, 20, 0);
            new Pillar(-30, 5, 20, 0);
            new Pillar(-30, 0, 20, 0);
            new RFloor(-20, 20, 30, 0);
            new Pillar(-20, 15, 30, 0);
            new Pillar(-20, 10, 30, 0);
            new Pillar(-20, 5, 30, 0);
            new Pillar(-20, 0, 30, 0);
            new Floor(-10, 15, 40, 0);
            new Pillar(-10, 10, 40, 0);
            new Pillar(-10, 5, 40, 0);
            new Pillar(-10, 0, 40, 0);
    
            new RFloor(40, 5, -10, 0);
            new Pillar(40, 0, -10, 0);
            new Floor(50, 10, 0, 0);
            new Pillar(50, 5, 0, 0);
            new Pillar(50, 0, 0, 0);
            new RFloor(40, 20, 10, 0);
            new Pillar(40, 15, 10, 0);
            new Pillar(40, 10, 10, 0);
            new Pillar(40, 5, 10, 0);
            new Pillar(40, 0, 10, 0);
            new RFloor(30, 20, 20, 0);
            new Pillar(30, 15, 20, 0);
            new Pillar(30, 10, 20, 0);
            new Pillar(30, 5, 20, 0);
            new Pillar(30, 0, 20, 0);
            new RFloor(20, 20, 30, 0);
            new Pillar(20, 15, 30, 0);
            new Pillar(20, 10, 30, 0);
            new Pillar(20, 5, 30, 0);
            new Pillar(20, 0, 30, 0);
            new Floor(10, 15, 40, 0);
            new Pillar(10, 10, 40, 0);
            new Pillar(10, 5, 40, 0);
            new Pillar(10, 0, 40, 0);
    
            new Floor(0, 10, 50, 0);
            new Pillar(0, 5, 50, 0);
            new Pillar(0, 0, 50, 0);
    
            new Pillar(0, 0, -30, 0);
            new Pillar(10, 0, -20, 0);
            new Pillar(-10, 0, -20, 0);
            new Pillar(0, 0, -10, 0);
            new Floor(0, 5, -30, 0);
            new Floor(10, 5, -20, 0);
            new Floor(-10, 5, -20, 0);
            new Floor(0, 5, -10, 0);

            new Pillar(10, 0, 0, 0);
            new Pillar(10, 5, 0, 0);
            new Pillar(10, 10, 0, 0);
            new Pillar(10, 15, 0, 0);
            new RFloor(10, 20, 0, 0);
            new Pillar(-10, 0, 0, 0);
            new Pillar(-10, 5, 0, 0);
            new Pillar(-10, 10, 0, 0);
            new Pillar(-10, 15, 0, 0);
            new RFloor(-10, 20, 0, 0);

            new RFloor(0, 20, 10, 0);
            new Pillar(0, 15, 10, 0);
            new Pillar(0, 10, 10, 0);
            new Pillar(0, 5, 10, 0);
    
            new Rocket(4, 5, -34, 0);
            var exit = new Exit(0, 5, -33, LR180);
    
            new XKey(-50, 10, 0, 0);
            new XKeyHole(40, 5, -14, 0);
            new DKey(50, 10, 0, 0);
            new DKeyHole(-40, 5, -14, 0);
    
            new FlowerStand(0, 10, 50, 0);
            new Flower(0, 10, 50, 0);
    
    
            lCamera.moveFlat(0, 20, 10);
            lScene.do_achieve = function() {
                if (lScene.achievements.xkey >= 1 && lScene.achievements.dkey >= 1) exit.open();
            }
        },
    },
    {
        description: "Three lane highway",
        map: function()
        {
            lScene.walls(-2, -5, 2, 3, 0);
            new Floor(0, 5, 60, 0);
            new Pillar(0, 0, 60, 0);
            new DodgyBridge(-2, 5, 50, 0);
            new DodgyBridge(2, 5, 50, 0);
            new PushMe(0, 5, 56, 0);
            new RFloor(0, 5, 40, 0);
            new Pillar(0, 0, 40, 0);
            new FlowerStand(0, 5, 58, 0);
            new Flower(0, 5, 58, 0);
            new Cage(0, 5, 36, 0);
        

            new Pedestal(30, 0, 0, 0);
            new RPFloor(30, 5, 0, 0);

            new Pedestal(-30, 0, 0, 0);
            new RPFloor(-30, 5, 0, 0);

            new Pedestal(0, 0, -10, 0);
            new RPFloor(0, 5, -10, 0);
            new DodgyBridge(0, 5, -20, 0);
            new Floor(0, 0, -20, 0);
            new Floor(-5, 0, -30, 0);
            new Floor(5, 0, -30, 0);
            // new DodgyBridge(0, 5, -20, 0);


            new Floor(-25, 0, -30, 0);
            new Zip21(-28, 5, -4.5, 0);
            new DKey(-22, 0, -33, 0);
            new EKronky(-28, 0, -33, 0);

            new Floor(25, 0, -30, 0);
            new Zip21(28, 5, -4.5, 0);
            new XKey(22, 0, -33, 0);
            new EKronky(28, 0, -33, 0);

            new Floor(-30, 0, -40, 0);
            var ld1 = new Door(-30, 0, -40, 0);
            new XKeyHole(-27, 0, -38, 0).setachieve("ld1");

            new Floor(30, 0, -40, 0);
            var rd1 = new Door(30, 0, -40, 0);
            new DKeyHole(27, 0, -38, 0).setachieve("rd1");

            new Lift(5.5, 0, -30, 0);
            new Lift(-5.5, 0, -30, 0);
            new Pedestal(0, 0, -30, 0);
            new RPFloor(0, 5, -30, 0);

            // var mport = new Portcullis(0, 0, -40, 0);
            // new Rope(-1, 0, -37, 0).setPort(mport);

            new Lift(-30, 0, -44.5, 0);
            new Lift(30, 0, -44.5, 0);
            new Pedestal(-30, 0, -50, 0);
            new Pedestal(30, 0, -50, 0);
            new RPFloor(-30, 5, -50, 0);
            new RPFloor(30, 5, -50, 0);

            new DodgyBridge2(-4, 5, -45, 0);
            new DodgyBridge2(4, 5, -45, 0);

            new RFloor(-8, 5, -60, 0);
            new RFloor(8, 5, -60, 0);
            new Pillar(-8, 0, -60, 0);
            new Pillar(8, 0, -60, 0);

            new Cage(-4, 0, -60, 0);
            new Cage(4, 0, -60, 0);


            new Floor(0, 0, -60.1, 0);
            new Floor(0, 0, -70.1, 0);
            new Lift(0, 0, -74.5, 0);
            new Pedestal(0, 0, -80, 0);
            new PFloor(0, 5, -80, 0);
            new Zip11(0, 5, -84.5, 0);
            new RFloor(0, 0, -100, 0);

            new DodgyBridge(0, 0, -110, 0);

            new RFloor(0, 0, -120, 0);
            // new RFloor(0, 5, -120, 0);
            new RFloor(0, 0, -130, 0);
            new Cage(4, 0, -127, 0);
            new Cage(-4, 0, -127, 0);

            var exit = new Exit(0, 0, -133, LR180);
            new DKeyHole(2, 0, -131, 0).setachieve("exit");
            new XKeyHole(-2, 0, -131, 0).setachieve("exit");

            var md1 = new Door(0, 0, -70, 0);
            new XKeyHole(2, 0, -68, 0).setachieve("md1");
            new DKeyHole(-2, 0, -68, 0).setachieve("md1");

            new Floor(-30, 0, -60, 0);
            new Floor(30, 0, -60, 0);

            new Lift(30, 0, -64.5, 0);
            new Pedestal(30, 0, -70, 0);
            new RPFloor(30, 5, -70, 0);
            new Zip11(26, 5, -74.5, 0);
            new RFloor(26, 0, -90, 0);



            new DodgyBridge2(22.5, 0, -105, 0);
            new RFloor(20, 0, -120, 0);
            new RFloor(20, 5, -120, 0);
            new RFloor(20, 0, -130, 0);

            new Lift(-30, 0, -64.5, 0);
            new Pedestal(-30, 0, -70, 0);
            new RPFloor(-30, 5, -70, 0);
            new Zip11(-26, 5, -74.5, 0);
            new RFloor(-26, 0, -90, 0);

            new DodgyBridge2(-22.5, 0, -105, 0);
            new RFloor(-20, 0, -120, 0);
            new RFloor(-20, 5, -120, 0);
            new RFloor(-20, 0, -130, 0);

            lScene.do_achieve = function() {
                if (lScene.achievements.ld1 >= 1) ld1.open();
                if (lScene.achievements.rd1 >= 1) rd1.open();
                if (lScene.achievements.md1 >= 2) md1.open();
                if (lScene.achievements.exit >= 2) exit.open();
            }


            lCamera.moveFlat(4, 5, 64);

        },
    },
    {
        description: "Party Time",

        map: function()
        {
            lScene.walls(-4, -4, 4, 4, 1);


            // The end first

            new RPFloor(40, 0, -50, 0);
            new RPFloor(50, 0, -50, 0);
            var exit = new Exit(50, 0, -53, LR180);
            new DKeyHole(48, 0, -51, 0).setachieve("dexit");
            new XKeyHole(52, 0, -51, 0).setachieve("xexit");


            new RPFloor(50, 0, -10, 0);
            new RPFloor(50, 0, -20, 0);

            // new RPFloor(10, 0, 0, 0);
            new RPFloor(22, 0, 0, 0);
            new RPFloor(32, 0, 0, 0);
            new RPFloor(42, 0, 0, 0);


            new RPFloor(20, 5, -20, 0);
            new Pedestal(20, 0, -20, 0);
            new RPFloor(30, 5, -20, 0);
            new Pedestal(30, 0, -20, 0);

            new DodgyBridge(10, 5, -20, LR90);

            new PFloor(0, 5, -20, 0);
            new Pedestal(0, 0, -20, 0);

            // Wire near side for cage

            new Wire(42, 0, -2.8, 0);
            new WireQ(37, 0, -3.75, LR90);
            new Cage(42, 0, -4, 0);

            new Zip11(34.5, 5, -18, -LR90);
            new Zip11(32, 5, -15.5, LR180);


            var bigp = new Portcullis(25, 0, 0, LR90);
            new Rope(28, 0, -1, LR90).setPort(bigp);


            new Pedestal(0, 0, 30, 0);
            new Pedestal(0, 0, 40, 0);
            new RPFloor(0, 5, 30, 0);
            new RPFloor(0, 5, 40, 0);
            new Pedestal(-20, 0, 42, 0);
            new RPFloor(-20, 5, 42, 0);
            new RPFloor(-30, 0, 47, 0);
            new PFloor(-30, 5, 47, 0);

            new DodgyBridge(-10, 5, 43, LR90);
            new DKey(-30, 5, 50, 0);
            new EKronky(-30, 5, 44, 0);


            new Pedestal(0, 0, 50, 0);
            new RPFloor(0, 5, 50, 0);
            new Pedestal(0, 5, 60, 0);
            new PFloor(0, 10, 60, 0);
            var pent = new Portcullis(0, 5, 45, 0);
            new Rope(-1, 5, 48, 0).setPort(pent);

            new FlowerStand(-2, 10, 57, 0);
            new Flower(-2, 10, 57, 0);

            new RPFloor(6, 0, 10, 0);
            new RPFloor(16, 0, 10, 0);

            new Wire(16, 0, 5, 0);
            new Wire(21, 0, 10, LR90);
            // new RPFloor(-17, 0, 0, 0);


            var first = new Door(0, 5, 35, 0);
            new DKeyHole(2, 5, 36, 0).setachieve("first");
            new Pedestal(10, 0, 30, 0);
            new RPFloor(10, 5, 30, 0);
            new Zip11(14.5, 5, 28, -LR90);
            new RPFloor(30, 0, 30, 0);
            new RPFloor(40, 0, 30, 0);


            var second = new Door(35, 0, 30, -LR90);
            new DKeyHole(33, 0, 28, -LR90).setachieve("second");

            new PFloor(50, 0, 30, 0);

            new Wire(55, 0, 30, LR90);
            new Wire(50, 0, 25, 0);
            new Wire(50, 0, 35, 0);

            new Rocket(50, 0, 30, 0);

            var portrocket = new Portcullis(45, 0, 30, -LR90);
            new Rope(42, 0, 29, -LR90).setPort(portrocket);
            
           
            var third = new Door(0, 5, 25, 0);
            new XKeyHole(2, 5, 26, 0).setachieve("third");
            new Pedestal(0, 0, 20, 0);
            new PFloor(0, 5, 20, 0);

            new Cage(-4, 5, 16, 0);


            new RPFloor(-76, 0, -16, 0);
            new RPFloor(-74, 0, -6, 0);
            new Lift(-71.5, 0, -12, 0);
            new Lift(-76, 0, -20.5, 0);
            new Lift(-69.5, 0, -1.5, 0);

            new Pedestal(-66, 0, -12, 0);
            new PFloor(-66, 5, -12, 0);

            new Pedestal(-64, 0, 2, 0);
            new PFloor(-64, 5, 2, 0);
            new XKey(-60, 5, -2, 0);
            new EKronky(-60, 5, 6, 0);

            new PushMe(-62, 5, -16, 0);
            new EKronky(-62, 5, -8, 0);

            new Pedestal(-73, 0, -26, 0);
            new RPFloor(-73, 5, -26, 0);
            new Cage(-69, 5, -26, 0);

            new Pedestal(-35, 0, 12, 0);
            new Pedestal(-35, 5, 12, 0);
            new Pedestal(-35, 10, 12, 0);
            new Pedestal(-35, 15, 12, 0);

            var lport = new Portcullis(-73, 5, -26, -LR90);
            new Rope(-76, 5, -25, -LR90).setPort(lport);

            new RPFloor(-58, 0, -60, 0);
            new PFloor(-58, 5, -60, 0);
            new EKronky(-58, 5, -60, 0);

            lCamera.moveFlat(2, 10, 64);
            // lCamera.moveFlat(-61, 10, -7);
            // lCamera.moveFlat(0, 5, 16);
            // new PushMe(-65, 5, -22, 0);
            // new Cage(-62, 5, -16, 0);
            // lScene.numkronky = 5;

            lScene.do_achieve = function() {
                if (lScene.achievements.first >= 1) first.open();
                if (lScene.achievements.second >= 1) second.open();
                if (lScene.achievements.third >= 1) third.open();
                if (lScene.achievements.dexit >= 1 && lScene.achievements.xexit >= 1) exit.open();
                
            }
        }
    },
];

export {cLevels};
