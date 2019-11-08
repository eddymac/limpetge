"use strict";

const BASEDIR = "squish/";

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
    ]

    var brown = lTextureColor(4, 0);
    var cyan = lTextureColor(4, 1);
    var green = lTextureColor(4, 2);
    var white = lTextureColor(4, 3);

    // Unit is a meter
    // Person is 2 meters high (to eye level)
    // Floor is 2 meter below, Ceiling 3 meter above
    // Floor is 40 meters wide
    // Corridor is 400 meters long


    var struct = new LStructureDef(ShaderSimple, {colors: colors, collision: LSTATIC});

    // Walls
    // The center needs to be positioned +- 20 meters either side, 0.5 meters above "eye level" (y = 0.0)
    // "size" is from center for addBlock, so it is actually double.
    // Make allowances for thickness of walls.
    // 
    struct.addBlock({position: lFromXYZ(-20.1, 0.5, 0), size: [.1, 2.5, 120], texturecontrols: lIndArray([[LI_RIGHT, brown]])});
    struct.addBlock({position: lFromXYZ(20.1, 0.5, 0), size: [.1, 2.5, 120], texturecontrols: lIndArray([[LI_LEFT, brown]])});

    // Floor needs to be 2 meters below eye level
    // Taking this out of collision detection (corners: null) as all happens when Y is 0 anyway.
    struct.addBlock({position: lFromXYZ(0, -2.1, 0), size: [20, 0.1, 120], texturecontrols: lIndArray([[LI_TOP, green]]), corners: null});

    // Ceiling is three meters above eye level
    // Taking this out of collision detection (corners: null) as all happens when Y is 0 anyway.
    struct.addBlock({position: lFromXYZ(0, 3.1, 0), size: [20, 0.1, 120], texturecontrols: lIndArray([[LI_BOTTOM, cyan]]), corners: null});

    for(var i = -120; i <= 120; i += 10) {
        struct.addBlock({position: lFromXYZ(-20.0, 0.5, i), size: [.001, 2.5, 0.1], texturecontrols: lIndArray([[LI_RIGHT, white]]), corners: null});
        struct.addBlock({position: lFromXYZ(20.0, 0.5, i), size: [.001, 2.5, 0.1], texturecontrols: lIndArray([[LI_LEFT, white]]), corners: null});
        struct.addBlock({position: lFromXYZ(0, -2.0, i), size: [20, 0.001, 0.1], texturecontrols: lIndArray([[LI_TOP, white]]), corners: null});
    }
    // Finish line
    struct.addBlock({position: lFromXYZ(0, -2.0, -101), size: [20, 0.001, 1], texturecontrols: lIndArray([[LI_TOP, white]]), corners: null});
    struct.addBlock({position: lFromXYZ(-20.0, 0.5, -101), size: [.001, 2.5, 1], texturecontrols: lIndArray([[LI_RIGHT, white]]), corners: null});
    struct.addBlock({position: lFromXYZ(20.0, 0.5, -101), size: [.001, 2.5, 1], texturecontrols: lIndArray([[LI_LEFT, white]]), corners: null});

    return struct;
}


function sphereStructure()
{
    var structs = [];

    /*
     * The spheres, as they are, are 2 meters in radius, or 4 meters in diameter
     */

    for(var i = 0; i < 4; i++) {
        var stru = new LStructureDef(ShaderSimple, {texture: "squish/bsphere.jpg", collision: LDYNAMIC, distance: 2.0});
        
        stru.addSphere({
                 position: lFromXYZPYR(0, 0, 0, 0, 0, Math.PI * i / 4), // Rotate a little z axis to make spheres more "random"
                 radius: 2.0,
            });
        structs.push(stru);
    }
    return structs;
}

function Corridor()
{
    this.obj = new LWObject(g_structures.Corridor, this);
    lScene.lPlace(this.obj, mat4.create());
}

// Spheres, need at least 200

function Sphere(angle)
{
    this.obj = new LWObject(g_structures.Sphere[angle], this);
    this.obj.mkvisible(false);
    lScene.lPlace(this.obj, mat4.create());
    this.velocity = 0;  // To be created in "makesphere"

    // For celebrating
    this.endx = g_prngd.next(20) - 10;
    this.endy = g_prngd.next(20) - 10;
    this.endz = g_prngd.next(20) - 10;
}

Sphere.prototype = {
    constructor: Sphere,

    // Inistigating a sphere
    start: function()
    {
        this.velocity = 5.0 + g_prngd.next(5.0);    // Set velocity between 5 and 10

        /*
         * Move to - X = laterally somewhere random in the corridor, not touching the walls
         *           Y = Center of sphere 1 
         *           Z = Start of run
         */
        var x = 19 - g_prngd.next(38);  // Get a number between -19 and 19
        if(x > 18) x = 18;  // Cannot be grater than 18
        if(x < -18) x = -18;  // or less than -18
        this.obj.moveHere(x, 0,  -110);

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
                this.obj.moveAbs(0, 0, -2.1);
            } else {
                break;
            }
        }

        // Has already warped here in for loop, if have not need to do this
        // otherwise ray tracing occurs from where it last was!.

        this.obj.mkvisible(true);
        this.obj.procpos();
    },

    /*
     * What happens when a sphere moves
     */
    move: function(delta)
    {

        if(!this.obj.isvisible) return;

        /*
         * Adjust the velocity to that of the sphere
         */

        delta *= this.velocity;

        /*
         * Moving, spheres roll, so cannot use the "move" or "moveFlat" methods
         * as they move in the direction the object is pointing, which can be 
         * anywhere as it rolls.
         * A quick and dirty way to "fix" this is to use the "moveAbs" method
         * which moves relative to the scene (or the origin).  As we are only
         * moving one way (down Z axis, positive) we can get away with that here.
         * A more "correct" solution, that llows proper rolling, is in the next tutorial.
         */
    
        this.obj.moveAbs(0, 0, delta);

        /*
         * Since we mentioned it, lets roll this.
         * You cannot see that if a single color, but put a texture on the sphere...
         *
         * divide by 2 * Pi * radius so it rolls the speed it is travelling
         */

        this.obj.rotate(delta / 2, 0, 0);

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
            this.obj.moveAbs(0, 0, -delta);
            this.obj.rotate(-delta / 2, 0, 0);

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
    },

    die: function()
    {
        // Just make invisible for this game
        this.obj.mkvisible(false);
    },

}


function Scene(args)
{
    LBase.call(this, args);

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

Scene.prototype = Object.assign(Object.create(LBase.prototype), {
    constructor: Scene,

    lLoop: function(delta)
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
    },

    makesphere: function()
    {
        // Use the next sphere in list, regardless if it is still live

        this.spheres[this.sidx].start();
        this.sidx += 1;
        if(this.sidx >= 200) this.sidx = 0;
    },

    celebrate: function()
    {
        // Move to space and display all spheres
        this.lMessage("Made it!", "lightgreen");
        this.isend = true;

        lCamera.moveHere(0, 0, -200);

        for(var i = 0; i< 200; i++) {
            var sphere = this.spheres[i];
            sphere.obj.moveHere(sphere.endx * 2, sphere.endy * 2, sphere.endz - 250);
            sphere.obj.mkvisible(true);
            sphere.obj.procpos();
        }
    },

    celebrating: function(delta)
    {
        this.endtime -= delta;
        if(this.endtime <= 0) return false;
        for(var i = 0; i < 200; i++) {
            var sphere = this.spheres[i];
            sphere.obj.move(sphere.endx * delta, sphere.endy * delta, sphere.endz * delta);
            sphere.obj.procpos();
        }
        return true;
    },

    die: function()
    {
        this.lMessage("Squished!");
        this.directionalLightColor = vec3.fromValues(1.0, 0.0, 0.0);
        this.isend = true;
    },
        

    dieing: function(delta)
    {
        this.endtime -= delta;
        if(this.endtime <= 0) return false;
        
        this.directionalLightColor = vec3.fromValues(this.endtime / 5.0, 0.0, 0.0);
        this.ambientLight = vec3.fromValues(0.3 * this.endtime / 5.0, 0.3 * this.endtime / 5.0, 0.3 * this.endtime / 5.0);
        return true;
    },

});
        
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

    // Create the wall and ceiling
    new Corridor();

    // Create sphere objects
    for(var i = 0; i < 200; i++)
        lScene.spheres.push(new Sphere(i % 4));

    lCamera.moveHere(0, 0, 98);

    lScene.lSetup();

    lScene.lSetTitle("Level: " + (g_level + 1).toString());
    lScene.lMessage("");

    lScene.lMain();
}

