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

import {ShaderSimple, ShaderSolid} from "./shader_squish.js";


var g_prngd = new LPRNGD(Math.random() * 10000);
var g_prng = new LPRNG(Math.random() * 10000);

var g_structures = {};
var g_level = 0;

function corridorStructure()
{
    // Walls form a corridor, with the ends left out.
    var colors = [
        [3.0, 0.2, 0.1, 1.0],   // red-brown
        [0.8, 1.0, 1.0, 1.0],   // cyan
        [0.0, 0.3, 0.0, 1.0],   // darkish green
        [1.0, 1.0, 1.0, 1.0],   // White for lines
        [0.5, 0.1, 0.1, 1.0],   // Dark brown
        [0.15, 0.03, 0.03, 1.0],   // Shadow brown  // Dark brown * 0.3 (Ambient light)
        [0.1, 0.1, 0.0, 1.0],   // Dark tree
        [0.4, 0.5, 0.5, 1.0],   // Dark cyan
    ]

    var brown = lTextureColor(8, 0);
    var cyan = lTextureColor(8, 1);
    var green = lTextureColor(8, 2);
    var white = lTextureColor(8, 3);
    var darkbrown = lTextureColor(8, 4);
    var shadowbrown = lTextureColor(8, 5);
    var darkgreen = lTextureColor(8, 6);
    var shadowcyan = lTextureColor(8, 7);

    // Unit is a meter
    // Person is 2 meters high (to eye level)
    // Floor is 2 meter below, Ceiling 3 meter above
    // Floor is 40 meters wide
    // Corridor is 400 meters long


    var struct = new LStructureDef(ShaderSimple, {colors: colors, collision: LSTATIC});

    // Also will require to draw things in shadow.
    // Will use "ShaderSolid" here.  Although this is really for transparent shadows, can be used
    // here too as nothing transparent is displayed in front of it

    var shadow = new LStructureDef(ShaderSolid, {colors: colors});

    // Walls
    // The center needs to be positioned +- 20 meters either side, 0.5 meters above "eye level" (y = 0.0)
    // "size" is from center for addBlock, so it is actually double.
    // Make allowances for thickness of walls.
    // 

    // Have this as a window
    struct.addBlock({position: lFromXYZ(-20.1, -0.75, 0), size: [.1, 1.25, 120], texturecontrols: lIndArray([[LI_RIGHT, brown]])});
    struct.addBlock({position: lFromXYZ(-20.1, 2.75, 0), size: [.1, 0.25, 120], texturecontrols: lIndArray([[LI_RIGHT, brown], [LI_BOTTOM, brown]]), corners: null});

    struct.addBlock({position: lFromXYZ(20.1, -0.75, 0), size: [.1, 1.25, 120], texturecontrols: lIndArray([[LI_LEFT, brown]])});
    struct.addBlock({position: lFromXYZ(20.1, 2.75, 0), size: [.1, 0.25, 120], texturecontrols: lIndArray([[LI_LEFT, brown], [LI_BOTTOM, brown]]), corners: null});


    // Floor needs to be 2 meters below eye level
    // Taking this out of collision detection (corners: null) as all happens when Y is 0 anyway.
    struct.addBlock({position: lFromXYZ(0, -2.1, 0), size: [20, 0.1, 120], texturecontrols: lIndArray([[LI_TOP, green]]), corners: null});

    // Ceiling is three meters above eye level
    // Taking this out of collision detection (corners: null) as all happens when Y is 0 anyway.
    struct.addBlock({position: lFromXYZ(0, 3.1, 12), size: [20, 0.1, 114], texturecontrols: lIndArray([[LI_BOTTOM, cyan]]), corners: null});
    // And a bit beyond where the balls come in
    struct.addBlock({position: lFromXYZ(0, 3.1, -116), size: [20, 0.1, 4], texturecontrols: lIndArray([[LI_BOTTOM, cyan]]), corners: null});

    // Put an end in, up to 2.5M high
    struct.addBlock({
             position: lFromXYZ(0, -0.75, -120),    // Center 120 meters in frnyt of origin, .75 meters below "eye level"
             size: [20, 1.25, .1],                // Across the back, 2,5M high, 20 CM thick
             texturecontrols: lIndArray([[LI_FRONT, brown]]), // Color it brown
              corners: null // No collision detection
        });

    // Half meter "band" at top
    struct.addBlock({
             position: lFromXYZ(0, 2.75, -120),    // Center 120 meters in frnyt of origin, 2.75 meters above "eye level"
             size: [20, 0.25, .1],                // Across the back, .5 M high 20 CMM thick
             texturecontrols: lIndArray([[LI_FRONT, brown], [LI_BOTTOM, brown]]), // Color it brown
              corners: null // No collision detection
        });

    // 0.5 Meter window separators every 10 M (starting at ends)

    for(var i = -20; i <= 20; i += 10) {
        // Filler between 2.5 to 4.5 meters high
        struct.addBlock({
                position: lFromXYZ(i, 0.5, -120),    // Post position, 120 meters in front of origin, 3.5 meters above "eye level"
                size: [0.25, 2.5, .15],                // Where the post needs to be, the back, 2 M high 20 CM thick
                texturecontrols: lIndArray([[LI_FRONT, darkbrown], [LI_LEFT, darkbrown], [LI_RIGHT, darkbrown]]), // Color it brown
                corners: null // No collision detection
        });
    }


    for(var i = -120; i <= 120; i += 10) {
        if(i != -100)  // Not for finish line
            struct.addBlock({position: lFromXYZ(0, -2.0, i), size: [20, 0.001, 0.1], texturecontrols: lIndArray([[LI_TOP, white]]), corners: null});

        struct.addBlock({
            position: lFromXYZ(-20.1, 0.5, i),    // Post position, 120 meters in front of origin, 3.5 meters above "eye level"
            size: [0.15, 2.5, .15],                // Where the post needs to be, the back, 2 M high 20 CM thick
            texturecontrols: lIndArray([[LI_FRONT, darkbrown], [LI_RIGHT, darkbrown]]), // Color it brown
            corners: null // No collision detection
        });

        // Right hand side posts more complex.  The bits "behind" the wall are in shadow, so ue the shadow structure
        // for that

        // First - the bit in the light

        struct.addBlock({
            position: lFromXYZ(20.1, 1.5, i),    // Post position, 120 meters in front of origin, 3.5 meters above "eye level"
            size: [0.15, 1, .15],                // Where the post needs to be, the back, 2 M high 20 CM thick
            texturecontrols: lIndArray([[LI_FRONT, darkbrown], [LI_LEFT, darkbrown]]), // Color it brown
            corners: null // No collision detection
        });

        // Now for the bits at top and bottom in the shade

        shadow.addBlock({
                position: lFromXYZ(20.1, 2.75, i),    // Post position, 120 meters in front of origin, 3.5 meters above "eye level"
                size: [0.15, .25, 0.15],                // Where the post needs to be, the back, 2 M high 20 CM thick
                texturecontrols: lIndArray([[LI_FRONT, shadowbrown], [LI_LEFT, shadowbrown]]), // Color it brown
                corners: null // No collision detection
        });
        shadow.addBlock({
                position: lFromXYZ(20.1, -0.75, i),    // Post position, 120 meters in front of origin, 3.5 meters above "eye level"
                size: [0.15, 1.25, 0.15],                // Where the post needs to be, the back, 2 M high 20 CM thick
                texturecontrols: lIndArray([[LI_FRONT, shadowbrown], [LI_LEFT, shadowbrown]]), // Color it brown
                corners: null // No collision detection
        });
        //}
    }
    struct.addBlock({position: lFromXYZ(0, -2.0, -101), size: [20, 0.001, 1], texturecontrols: lIndArray([[LI_TOP, white]]), corners: null});

    // Let us add a whole lot of cylinders outside

    for(var i = 0; i < 100; i++) {
        var x = g_prngd.next(10) - 35;
        var z = g_prngd.next(250) - 150;
        struct.addCylinder({position: lFromXYZPYR(x, 10, z, LR90, 0, 0), radius: g_prngd.next(.5) + 1, depth: 10, texturecontrols: lIndArray([[LI_SIDE, darkgreen]])});
        struct.addCylinder({position: lFromXYZPYR(-x, 10, z, LR90, 0, 0), radius: g_prngd.next(.5) + 1, depth: 10, texturecontrols: lIndArray([[LI_SIDE, darkgreen]])});
    }

    // Backgroubnd cylinders at the end
    for(var i = 0; i < 20; i++) {
        var x = g_prngd.next(40) - 20;
        var z = g_prngd.next(10) - 140;
        struct.addCylinder({position: lFromXYZPYR(x, 50, z, LR90, 0, 0), radius: g_prngd.next(.5) + 1, depth: 50, texturecontrols: lIndArray([[LI_SIDE, darkgreen]])});
    }


    // Put something on the ceiling.  A few slightly lighter squares to pretend they are kinda skylights  Use the "solid" (shadow structure) for this.

    for(var z = -95; z <= 95; z += 10) {
        for(x = -15; x <= 15; x += 10) {
            shadow.addBlock({position: lFromXYZ(x, 3.1, z), size: [1, .2, 1], texturecontrols: lIndArray([[LI_BOTTOM, shadowcyan]])});
        }
    }

    return [struct, shadow];
}


function sphereStructure()
{
    var structs = [];

    /*
     * The spheres, as they are, are 2 meters in radius, or 4 meters in diameter
     */

    var mainstruct = new LGroupDef({collision: LDYNAMIC, distance: 2.0});
    var anglestruct = new LGroupDef();
    var ballstruct = new LStructureDef(ShaderSimple, {texture: "./squish/bsphere.jpg"});
    ballstruct.addSphere({radius: 2.0});
    var shadowstruct = new LStructureDef(ShaderSolid, {color: [0.0, 0.0, 0.0, 0.7]});
    shadowstruct.addCylinder({position: lFromXYZPYR(0, -2.0, 0, LR90, 0, 0), radius: 2.0, depth: 0.002, hold: [LI_FRONT, LI_SIDE]})
    return [mainstruct, anglestruct, ballstruct, shadowstruct];
}

class Corridor {
    constructor()
    {
        this.obj = new LWObject(g_structures.Corridor[0], this);
        this.solids = new LWObject(g_structures.Corridor[1], this);
        lScene.lPlace(this.obj, mat4.create());
        lScene.lPlace(this.solids, mat4.create());
    }
}

// Spheres, need at least 200

class Sphere {
    constructor()
    {
        this.obj = new LWObject(g_structures.Sphere[0], this);
        this.angle = new LObject(g_structures.Sphere[1], this);
        this.ball = new LObject(g_structures.Sphere[2], this);
        this.shadow = new LObject(g_structures.Sphere[3], this);
        lScene.lPlace(this.obj, mat4.create());
        this.obj.addChild(this.angle, mat4.create());
        this.angle.addChild(this.ball, lFromXYZPYR(0, 0, 0, g_prngd.next(Math.PI), g_prngd.next(Math.PI), g_prngd.next(Math.PI)));
        this.obj.addChild(this.shadow, mat4.create());
    
        this.obj.mkvisible(false);
    
        this.velocity = 0;  // To be created in "makesphere"
    
        // For celebrating
        this.endx = g_prngd.next(20) - 10;
        this.endy = g_prngd.next(20) - 10;
        this.endz = g_prngd.next(20) - 10;
    }


    // Inistigating a sphere
    start()
    {
        this.velocity = 5.0 + g_prngd.next(5.0);    // Set velocity between 5 and 10

        /*
         * Move to - X = laterally somewhere random in the corridor, not touching the walls
         *           Y = 10 above
         *           Z = Start of run
         */
        var x = 19 - g_prngd.next(38);  // Get a number between -19 and 19
        if(x > 18) x = 18;  // Cannot be grater than 18
        if(x < -18) x = -18;  // or less than -18
        this.obj.moveHere(x, 10,  -110);

        // Make sure it is not hitting anything, If it is move back 2.1
        // Wash rinse repeat...

        var collision = false;
        function _see(cob)
        {
            collision = true;
        }
        for(;;) {
            this.obj.warp();    // Warp here - no ray tracing
            collision = false;
            lScene.lCAllDynamicPointDetect(this.obj, 2.0, _see);
            if(collision) {
                this.obj.moveFlat(0, 2.1, 0);
            } else {
                break;
            }
        }

        // Move the object up by 10
        // It will fall at velocity of 20, and min velocity forward is 5
        // Therefore half second to fall, move forward 2.5 as well


        // Has already warped here in for loop, if have not need to do this
        // otherwise ray tracing occurs from where it last was!.

        this.obj.mkvisible(true);
        this.obj.procpos();
    }

    /*
     * What happens when a sphere moves
     */
    move(delta)
    {

        if(!this.obj.isvisible) return;

        /*
         * Adjust the velocity to that of the sphere
         */

        delta *= this.velocity;

        // Move possibly 2 ways

        var y = 0;

        if(this.obj.y > 0) {
            var y = delta * 3;
            if(this.obj.y > y) {
                delta = 0;
            } else {
                delta  -= y / 3;
                y = this.obj.y;
            }
        }

        /*
         * Moving, spheres roll, so cannot use the "move" or "moveFlat" methods
         * as they move in the direction the object is pointing, which can be 
         * anywhere as it rolls.
         * A quick and dirty way to "fix" this is to use the "moveAbs" method
         * which moves relative to the scene (or the origin).  As we are only
         * moving one way (down Z axis, positive) we can get away with that here.
         * A more "correct" solution, that llows proper rolling, is in the next tutorial.
         */

        this.obj.moveFlat(0, -y, delta);


        /*
         * Since we mentioned it, lets roll this.
         * You cannot see that if a single color, but put a texture on the sphere...
         *
         * divide by 2 * Pi * radius so it rolls the speed it is travelling
         */

        this.angle.rotate(delta / 2, 0, 0);

        /*
         * In LimpetGE it is really the object that has moved responsibility
         * to see if it has hit anything...
         *  Here, spheres can either hit the camera or another sphere
         */

        var hitsphere = null;
        function _see(cob) {
            if(cob.control instanceof LCamera) {
                lScene.ishit = true;        // Hit camera - Game over
            } else if (cob.control instanceof Sphere) {
                hitsphere = cob.control;
            }
        }
        lScene.lCAllPointDetect(this.obj, 2.0, _see);

        if(hitsphere) {
            // First move back
            this.obj.moveFlat(0, y, -delta);
            this.angle.rotate(-delta / 2, 0, 0);

            // Then swap velocity
            if(this.velocity > hitsphere.velocity) {
                var temp = this.velocity;
                this.velocity = hitsphere.velocity;
                hitsphere.velocity = temp;
            }
        }

        // If we are off the edge, die

        this.obj.procpos();

        if(this.obj.z > 220) this.die();
    }

    die()
    {
        // Just make invisible for this game

        this.obj.mkvisible(false);
    }
}


class Scene extends LBase {
    constructor(args)
    {
        super(args);
    
        this.spheres = [];      // The spheres
        this.sidx = 0;          // phere index
    
        this.ishit = false;
    
        this.nextsphere = 0.0;
    
        // Set up the keys
        this.kForward = lInput.press(87);   // Key W
        this.kBack = lInput.press(83);      // key S
        this.kRight = lInput.press(190);      // key  > or .
        this.kLeft = lInput.press(188);      // key  < or ,
    
        lInput.usekeys();
    
        this.lRestart = function()
        {
            if(!this.ishit) {
                g_level += 1;
            }
    
            g_playlevel(g_level);
        };
    
        this.endtime = 5.0;
        this.isend = false;
    }


    lLoop(delta)
    {
        // Have we ended - do end animations
        if(this.isend)
        {
            if(this.ishit)
                return this.dieing(delta)
            else
                return this.celebrating(delta);
        }

        // Possibility of new sphere appearing  - Average 1 a second
        if(this.nextsphere <= 0) {
            this.makesphere();
            this.nextsphere = g_prngd.next(10 / (10 + g_level)); // Start average 1 every half second, increase as levels go up
        } else {
            this.nextsphere -= delta;   // Wait for next sphere
        }

        // Move the camera

        var x = 0;
        var z = 0;
        // Using the "val" property more efficient then "ison()" method
        if(this.kForward.val)  z  -= delta * 5;                 // How fast we run forward
        if(this.kBack.val)  z += delta * 2.5;                // Run backwards half speed
        if(this.kLeft.val)  x -= delta * 2.5;                 // Same sideways, but slow down forward
        if(this.kRight.val)  x += delta * 2.5;                
        if(x != 0) z *= 0.7;

        lCamera.moveFlat(x, 0, z);

        // Need to check if the camera has hit anything
        var hasHitWall = false;
        function _seecam(cob)
        {
            if(cob.control instanceof Corridor) // Hits a wall
                hasHitWall = true;
            else if(cob.control instanceof Sphere) {
                lScene.ishit = true;        // "this" will not work in an ebedded function
            }
        }
        this.lCAllPointDetect(lCamera, 0.3, _seecam);

        // Has it hit a wall?
        if(hasHitWall) lCamera.move(-x, 0, 0);
        // Cannot go too far back
        if(lCamera.z >= 100) lCamera.move(0, 0, -z);

        //  Move the spheres
        for(var i = 0; i < 200; i++)
            this.spheres[i].move(delta);

        // See if the game has ended
        // Have been squahed
        if(this.ishit) {
            this.die();
        }
        // Have reached end
        if(lCamera.z <= -100) {
            this.celebrate();
        }

        // Continue game
        return true;
    }

    makesphere()
    {
        // Use the next sphere in list, regardless if it is still live

        this.spheres[this.sidx].start();
        this.sidx += 1;
        if(this.sidx >= 200) this.sidx = 0;
    }

    celebrate()
    {
        // Move to space and display all spheres
        this.lMessage("Made it!", "lightgreen");
        this.isend = true;

        lCamera.moveHere(0, 0, -200);

        for(var i = 0; i< 200; i++) {
            var sphere = this.spheres[i];
            sphere.obj.moveHere(sphere.endx * 2, sphere.endy * 2, sphere.endz - 250);
            sphere.obj.mkvisible(true);
            sphere.shadow.mkvisible(false);
            sphere.obj.procpos();
        }
    }

    celebrating(delta)
    {
        this.endtime -= delta;
        if(this.endtime <= 0) return false;
        for(var i = 0; i < 200; i++) {
            var sphere = this.spheres[i];
            sphere.obj.move(sphere.endx * delta, sphere.endy * delta, sphere.endz * delta);
            sphere.obj.procpos();
        }
        return true;
    }

    die()
    {
        // First, "solid" shader objects ignore light, so for the correct effect,
        // make the wall structure shadoes invisible
        this.corridor.solids.mkvisible(false);
        this.lMessage("Squished!");
        this.directionalLightColor = vec3.fromValues(1.0, 0.0, 0.0);
        this.isend = true;
    }
        

    dieing(delta)
    {
        this.endtime -= delta;
        if(this.endtime <= 0) return false;
        
        this.directionalLightColor = vec3.fromValues(this.endtime / 5.0, 0.0, 0.0);
        this.ambientLight = vec3.fromValues(0.3 * this.endtime / 5.0, 0.3 * this.endtime / 5.0, 0.3 * this.endtime / 5.0);
        return true;
    }

}
        
function g_playgame()
{
    lInit();

    // Retrieve and place tructure definitions where they can
    // be accessed later

    g_structures.Corridor = corridorStructure();
    g_structures.Sphere = sphereStructure();

    g_playlevel(g_level)
}

function g_playlevel(level)
{
    // Create a new scene.
    // Collision sparse array cell size needs to be > 4 here as spheres are 2 wide, and what it collides into has a size too
    // Say a person is 60 CM wide and thick

    new Scene({lCSize: 5.0, lLDynamic: true, lLDistance: 0.3});

    lScene.lDefaultMessage = "W: Forward, S: Back, <: Left, >: Right"

    // Set up lightings required
    lScene.ambientLight = vec3.fromValues(0.3, 0.3, 0.3);
    lScene.directionalLightColor = vec3.fromValues(1.0, 1.0, 1.0);

    // Create the wall and ceiling.  Need to access it in "die" now
    lScene.corridor = new Corridor();

    // Create sphere objects
    for(var i = 0; i < 200; i++)
        lScene.spheres.push(new Sphere());

    lCamera.moveHere(0, 0, 98);

    lScene.lSetup();

    lScene.lSetTitle("Level: " + (g_level + 1).toString());
    lScene.lMessage("");

    lScene.lMain();
}

window.g_playgame = g_playgame;

