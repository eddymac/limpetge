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

import {
    ShaderSimple,
    ShaderPanorama,
    ShaderShade,
    ShaderSolid,
    ShaderLight,
    ShaderSimpleTrans,
} from "./shader_loadobj.js";

var g_structures = {};

var g_assets = new LAssets({
    t1: "./loadobj/furniture.obj"
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
    var iobj = new LObjImport(g_assets.assets.t1);

    var cmp = iobj.component("", "");
    struct.addImport({data:cmp, texturecontrol: brown});
    /*
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
    */

    console.log(struct);

    return struct;
}



class Scene extends LBase {
    constructor(args){
        super(args);

        // Set up the keys
        this.kMDown = lInput.press(83);   // Key S
        this.kMUp = lInput.press(87);      // key S
        this.kMLeft = lInput.press(65);   // Key A
        this.kMRight = lInput.press(68);      // key D
        this.kForward = lInput.press(82);   // Key R
        this.kBack = lInput.press(70);      // key F
        this.kRRight = lInput.press(39);      // key  right arrow
        this.kRLeft = lInput.press(37);      // key  left arro
        this.kRUp = lInput.press(38);      // key up arrow
        this.kRDown = lInput.press(40);      // key right rrow
        this.kRClock = lInput.press(190);      // >
        this.kRAnti = lInput.press(188);      // <

        lInput.usekeys();
    }

    lLoop(delta)
    {
        var z = 0;
        var y = 0;
        var x = 0;
        var ry = 0;
        var rx = 0;
        var rz = 0;
        // Using the "val" property more efficient then "ison()" method
        if(this.kMUp.val)  y  += delta;                 // How fast we run forward
        if(this.kMDown.val)  y -= delta;                // Run backwards half speed
        if(this.kMLeft.val)  x  -= delta;                 // How fast we run forward
        if(this.kMRight.val)  x += delta;                // Run backwards half speed
        if(this.kForward.val)  z  -= delta;                 // How fast we run forward
        if(this.kBack.val)  z += delta;                // Run backwards half speed
        if(this.kRLeft.val)  ry += delta;                 // Same sideways, but slow down forward
        if(this.kRRight.val)  ry -= delta;                 // Same sideways, but slow down forward
        if(this.kRClock.val)  rz -= delta;                 // Same sideways, but slow down forward
        if(this.kRAnti.val)  rz += delta;                
        if(this.kRUp.val)  rx += delta;                 // Same sideways, but slow down forward
        if(this.kRDown.val)  rx -= delta;                

        lCamera.move(x, y, z);


        this.thing.obj.rotate(rx, ry, rz);
        this.thing.obj.procpos();
        
        if(this.lCStaticPointDetect(lCamera, 0.2)) {
            lCamera.moveFlat(-x, -y, -z);
            this.thing.obj.rotate(-rx, -ry, -rz);
            this.thing.obj.procpos();
        }

        return true;
    }
}
        
function Load()
{
    this.obj = new LWObject(g_structures.Load, this);
    lScene.lPlace(this.obj, mat4.create());
}

function panoramaStructure()
{
    var struct = new LStructureDef(ShaderPanorama, {texture: "loadobj/landscape.jpg"});
    struct.addCylinder({position: lFromXYZPYR(0, 0, 0, LR90, LR180, 0), radius: 1000, depth: 500, insideout: true, hold:[LI_FRONT, LI_BACK]});
    return struct;
}

function Panorama()
{
    this.obj = new LWObject(g_structures.Panorama, this);
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
    g_structures.Panorama = panoramaStructure();
    g_playlevel();
}

function g_playlevel()
{
    new Scene({lCSize: 5.0, lLDynamic: true, lLDistance: 0.3});
    new Panorama();

    lScene.lDefaultMessage = "W: Forward, S: Back, <: Left, >: Right"

    // Set up lightings required
    lScene.ambientLight = vec3.fromValues(0.3, 0.3, 0.3);
    lScene.directionalLightColor = vec3.fromValues(1.0, 1.0, 1.0);

    // Create the wall and ceiling
    lScene.thing = new Load();


    lCamera.moveHere(0, 0, 30);
    lScene.lSetup();
    lScene.lMessage("");

    lScene.lMain();

}

window.g_loadassets = g_loadassets;
window.g_playgame = g_playgame;
