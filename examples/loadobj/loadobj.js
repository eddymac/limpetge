"use strict";

var g_structures = {};

var g_assets = new LAssets({
    t1: "loadobj/al.obj"
});

function g_loadassets()
{
    function onend()
    {
        document.getElementById("playbutton").disabled = false;
    }
    g_assets.download({onend: onend});
    
}

function loadStructure()
{
    var colors = [
        [0.9, 0.7, 0.7, 1.0],   // skin
        [1.0, 0.5, 0.8, 1.0],   // fldkred
        [0.0, 0.0, 0.3, 1.0],   // dkblue
        [0.1, 0.1, 0.1, 1.0],   // black
        [0.3, 0.3, 0.1, 1.0],   // brownhair
        [0.6, 0.6, 0.3, 1.0],   // brown
        [0.3, 0.3, 0.3, 1.0],   // dkgrey
        [1.0, 1.0, 1.0, 1.0],   // white
        [0.0, 0.7, 0.0, 1.0],   // deepgreen
        [1.0, 1.0, 1.0, 1.0],   // white
        [1.0, 1.0, 1.0, 1.0],   // white
        [1.0, 1.0, 1.0, 1.0],   // white
        [1.0, 1.0, 1.0, 1.0],   // white
        [1.0, 1.0, 1.0, 1.0],   // white
        [1.0, 1.0, 1.0, 1.0],   // white
        [1.0, 1.0, 1.0, 1.0],   // white
    ]

    var skin = lTextureColor(16, 0);
    var fldkred = lTextureColor(16, 1);
    var dkblue = lTextureColor(16, 2);
    var black = lTextureColor(16, 3);
    var brownhair = lTextureColor(16, 4);
    var brown = lTextureColor(16, 5);
    var dkgrey = lTextureColor(16, 6);
    var white = lTextureColor(16, 7);
    var deepgreen = lTextureColor(16, 8);


    // Unit is a meter
    // Person is 2 meters high (to eye level)
    // Floor is 2 meter below, Ceiling 3 meter above
    // Floor is 40 meters wide
    // Corridor is 400 meters long


    var struct = new LStructureDef(ShaderSimple,{colors:colors, shininess:100, collision:LSTATIC});
    var iobj = new LObjImport(g_assets.data.t1);
    var cmp = iobj.component("", "skin");
    struct.addImport({data:cmp, texturecontrol: skin});
    cmp = iobj.component("", "fldkred");
    struct.addImport({data:cmp, texturecontrol: fldkred});
    cmp = iobj.component("", "dkblue_pure");
    struct.addImport({data:cmp, texturecontrol: dkblue});
    cmp = iobj.component("", "black");
    struct.addImport({data:cmp, texturecontrol: black});
    cmp = iobj.component("", "brnhair");
    struct.addImport({data:cmp, texturecontrol: brownhair});
    cmp = iobj.component("", "brown");
    struct.addImport({data:cmp, texturecontrol: brown});
    cmp = iobj.component("", "dkgrey");
    struct.addImport({data:cmp, texturecontrol: dkgrey});
    cmp = iobj.component("", "white");
    struct.addImport({data:cmp, texturecontrol: white});
    cmp = iobj.component("", "deepgreen");
    struct.addImport({data:cmp, texturecontrol: deepgreen});
    cmp = iobj.component("", "white");
    struct.addImport({data:cmp, texturecontrol: white});

    return struct;
}



function Scene(args)
{
    LBase.call(this, args);

    // Set up the keys
    this.kMDown = lInput.press(77);   // Key W
    this.kMUp = lInput.press(75);      // key S
    this.kMLeft = lInput.press(65);   // Key W
    this.kMRight = lInput.press(68);      // key S
    this.kForward = lInput.press(87);   // Key W
    this.kBack = lInput.press(83);      // key S
    this.kRight = lInput.press(190);      // key  > or .
    this.kLeft = lInput.press(188);      // key  < or ,

    lInput.usekeys();
}

Scene.prototype = Object.assign(Object.create(LBase.prototype), {
    constructor: Scene,

    lLoop: function(delta)
    {
        var z = 0;
        var y = 0;
        var x = 0;
        var ry = 0;
        // Using the "val" property more efficient then "ison()" method
        if(this.kMUp.val)  y  += delta;                 // How fast we run forward
        if(this.kMDown.val)  y -= delta;                // Run backwards half speed
        if(this.kMLeft.val)  x  -= delta;                 // How fast we run forward
        if(this.kMRight.val)  x += delta;                // Run backwards half speed
        if(this.kForward.val)  z  -= delta;                 // How fast we run forward
        if(this.kBack.val)  z += delta;                // Run backwards half speed
        if(this.kLeft.val)  ry += delta;                 // Same sideways, but slow down forward
        if(this.kRight.val)  ry -= delta;                

        lCamera.moveFlat(x, y, z);
        lCamera.rotateFlat(0, ry, 0);

        if(this.lCStaticPointDetect(lCamera, 0.2)) {
            lCamera.moveFlat(-x, -y, -z);
            lCamera.rotateFlat(0, -ry, 0);
        }


        // Continue game
        return true;
    },
});
        
function Load()
{
    this.obj = new LWObject(g_structures.Load, this);
    lScene.lPlace(this.obj, mat4.create());
}

function g_playgame()
{
    document.getElementById("mform").style.display = "none";
    document.getElementById("mgame").style.display = "block";
    lInit();

    // Retrieve and place structure definitions where they can
    // be accessed later

    g_structures.Load = loadStructure();
    g_playlevel();
}

function g_playlevel()
{
    new Scene({lCSize: 5.0, lLDynamic: true, lLDistance: 0.3});

    lScene.lDefaultMessage = "W: Forward, S: Back, <: Left, >: Right"

    // Set up lightings required
    lScene.ambientLight = vec3.fromValues(0.3, 0.3, 0.3);
    lScene.directionalLightColor = vec3.fromValues(1.0, 1.0, 1.0);

    // Create the wall and ceiling
    new Load();


    lCamera.moveHere(0, 0, 10);
    lScene.lSetup();
    lScene.lMessage("");

    lScene.lMain();

}
