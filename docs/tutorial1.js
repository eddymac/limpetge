function do_onload()
{
    document.getElementById("exhtml").innerText =
`<html><head><title>Squish - Devloper Tutorial One</title></head>
<link rel="icon" type="image/png" href="../libs/limpeticon.png"/>
<link rel="shortcut icon" type="image/png" href="../libs/limpeticon.png"/>
<script type="text/javascript" src="../libs/gl-matrix.js"></script>
<script type="text/javascript" src="../libs/limpetge.js"></script>
<script type="text/javascript" src="squish.js"></script>
<script type="text/javascript" src="shader_squish.js"></script>
<style>
    div.top {
        position: absolute;
        top:0;
        left:0;
        font-weight:bold;
        font-size:30;
        color:cyan;
        text-shadow:2px 2px black;
        width: 100%
    }
</style>
<body onload="g_playgame();">
    <div id="mgame">
        <div style="position: relative;">
            <canvas id="limpetge_canvas" width=1000 height=600 style="background-color:black;"></canvas>
            <div id="top" class="top">
                <div><span id=lTTitle></span> | <span id="lTMessage"</span></div>
            </div>
        </div>
    </div>
</body>
</html>
`;


    document.getElementById("ex1").innerText =
`function corridorStructure()
{
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
    // Corridor is 200(ish) meters long

    var struct = new LStructureDef(ShaderSimple, {colors: colors, collision: LSTATIC});

    // Walls
    // The center needs to be positioned +- 20 meters either side, 0.5 meters above "eye level" (y = 0.0)
    // "size" is from center for addBlock, so it is actually double.
    // Make allowances for thickness of walls.
    struct.addBlock({position: lFromXYZ(-20.1, 0.5, 0), size: [0.1, 2.5, 120], texturecontrols: lIndArray([[LI_RIGHT, brown]])});
    struct.addBlock({position: lFromXYZ(20.1, 0.5, 0), size: [0.1, 2.5, 120], texturecontrols: lIndArray([[LI_LEFT, brown]])});

    // Floor needs to be 2 meters below eye level
    // Taking this out of collision detection (corners: null) as all happens when Y is 0 anyway.
    struct.addBlock({position: lFromXYZ(0, -2.1, 0), size: [20, 0.1, 120], texturecontrols: lIndArray([[LI_TOP, green]]), corners: null});

    // Ceiling is three meters above eye level
    // Taking this out of collision detection (corners: null) as all happens when Y is 0 anyway.
    struct.addBlock({position: lFromXYZ(0, 3.1, 0), size: [20, 0.1, 120], texturecontrols: lIndArray([[LI_BOTTOM, cyan]]), corners: null});

    for(var i = -120; i <= 120; i += 10) {
        struct.addBlock({position: lFromXYZ(0, -2.0, i), size: [20, 0.001, 0.1], texturecontrols: lIndArray([[LI_TOP, white]]), corners: null});
        struct.addBlock({position: lFromXYZ(-20.0, 0.5, i), size: [0.001, 2.5, 0.1], texturecontrols: lIndArray([[LI_RIGHT, white]]), corners: null});
        struct.addBlock({position: lFromXYZ(20.0, 0.5, i), size: [0.001, 2.5, 0.1], texturecontrols: lIndArray([[LI_LEFT, white]]), corners: null});
    }

    // Finish line
    struct.addBlock({position: lFromXYZ(0, -2.0, -101), size: [20, 0.001, 1], texturecontrols: lIndArray([[LI_TOP, white]]), corners: null});
    struct.addBlock({position: lFromXYZ(-20.0, 0.5, -101), size: [0.001, 2.5, 1], texturecontrols: lIndArray([[LI_RIGHT, white]]), corners: null});
    struct.addBlock({position: lFromXYZ(20.0, 0.5, -101), size: [0.001, 2.5, 1], texturecontrols: lIndArray([[LI_LEFT, white]]), corners: null});

    return struct;
}`;

    
    document.getElementById("w1").innerText =
`function Scene(args)
{
    LBase.call(this, args);

    // Set up the keys
    this.kForward = lInput.press(87);   // Key W
    this.kBack = lInput.press(83);      // key S
    this.kRight = lInput.press(190);    // key  > or .
    this.kLeft = lInput.press(188);     // key  < or ,

    lInput.usekeys();
}

Scene.prototype = Object.assign(Object.create(LBase.prototype), {
    constructor: Scene,

    lLoop: function(delta)
    {
        var x = 0;
        var z = 0;

        if(this.kForward.val)  z  -= delta * 5;              // How fast we run forward
        if(this.kBack.val)  z += delta * 2.5;                // Run backwards half speed
        if(this.kLeft.val)  x -= delta * 2.5;                // Same sideways, but slow down forward
        if(this.kRight.val)  x += delta * 2.5;                
        if(x != 0) z *= 0.7;

        lCamera.moveFlat(x, 0, z);

        // Need to check if the camera has hit anything
        var hasHitWall = false;
        function _seecam(cob)
        {
            if(cob.control instanceof Corridor) // Hits a wall
                hasHitWall = true;
        }
        this.lCAllPointDetect(lCamera, 0.3, _seecam);

        // Has it hit a wall?
        if(hasHitWall) lCamera.move(-x, 0, 0);
        // Cannot go too far back
        if(lCamera.z >= 100) lCamera.move(0, 0, -z);

        if(lCamera.z <= -100) {
            return false;
        }

        // Continue game
        return true;
    },

});`;
        

}
