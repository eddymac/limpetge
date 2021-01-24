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

import {Maze, XP, XN, YP, YN, ZP, ZN, WALLS, SL20, PRESL20, USED, STARTUSED, ENDUSED, DEADEND} from "./maze.js";

import {ShaderSelf, ShaderStrand, ShaderSelfTrans} from "./shader_sl20.js";

const BASEDIR = "sl20/";

var maze = null;    // Current maze
var g_prng = new LPRNG(Math.random() * 10000);


const LEVELS = [
[3, 2, 3],
[4, 2, 3],
[3, 3, 3],
[4, 2, 4],
[4, 3, 3],
[4, 3, 4],
[5, 3, 4],
[4, 4, 4],
[5, 3, 5],
[5, 4, 4],
[5, 4, 5],
[6, 4, 5],
[5, 5, 5],
[6, 4, 6],
[6, 5, 5],
[6, 5, 6],
[7, 5, 6],
[6, 6, 6],
null,
]


var g_atlevel = 0;
var g_strandhit = 4.0;  // how close to hit the strand
var g_shotbase = 40;
var g_shotrand = 60;
var g_lastfired = 0.5;
var g_howfast = 2.0

const g_assets_obj = new LAssets({
    injured: {url: BASEDIR + "sounds/injured.wav", number: 5},
    sbang: {url: BASEDIR + "sounds/sbang.wav", number: 5},
    fire: {url: BASEDIR + "sounds/fire.wav", number: 5},
    slurp: {url: BASEDIR + "sounds/slurp.wav", number: 5},
    scrape: {url: BASEDIR + "sounds/scrape.wav", loop: true},
    endbang: {url: BASEDIR + "sounds/endbang.wav", number: 1},
    flush: {url: BASEDIR + "sounds/flush.wav", number: 1},
    wallads: BASEDIR + "wallads.jpg",
    floorceil: BASEDIR + "floorceil.jpg",
    sl20: BASEDIR + "sl20.jpg",
});

const g_assets = g_assets_obj.assets;

// Utility function - hashcode
// Shamelessly copied from the web, uses the Java
// hashCode formula, optomised for JS

function hashCode(str)
{
    var slen = str.length;
    var hash = 0;
    for(var i = 0; i < slen;)
    {
        hash = ((hash << 5) - hash + str.charCodeAt(i++)) | 0;
    }
    return hash;
}

class Fuels {
    constructor(num)
    {
        this.fuelDef = new LStructureDef(ShaderSelfTrans, {color: [1.0, 1.0, 0.5, 0.4], collision: LDYNAMIC});
        this.fuelDef.addSphere({position: mat4.create(), radius: 2.0});
        this.fuels = [];
        this.total = num;
        this.idx = 0;
        for(var i = 0; i < num; i++)
            this.fuels.push(new Fuel(this.fuelDef));
    }

    create(x, y, z)
    {
        this.fuels[this.idx].birth(x, y, z);
        this.idx++;
        if(this.idx >= this.total) this.idx = 0;
    }
}

class Fuel {
    constructor(fueldef)
    {
        const obj = new LObject(fueldef, this);
        this.obj = obj;
        obj.distance = 2;
        obj.mkvisible(false);
        lScene.lAddChild(obj, mat4.create());
    }

    birth(x, y, z)
    {
        this.obj.moveHere(x, y, z);
        this.obj.mkvisible(true);
        this.obj.procpos();
        lScene.lCMove(this.obj);
    }
    die()
    {
        this.obj.mkvisible(false);
    }
    slurp()
    {
        this.die();
        g_assets.slurp.play();
        lScene.life += 2;
    }
}


class Strand {
    constructor(control)
    {
        this.obj = new LGroup({}, control);
        
        var intop = new LStructure(ShaderStrand, {color: [g_prng.next(5)/30, g_prng.next(5)/10, g_prng.next(5)/30, 1.0], wcolor: [0.5 + g_prng.next(5)/10, g_prng.next(5)/10, g_prng.next(5)/10, 1.0]}, control);
        intop.structure.addCylinder({position: lFromXYZPYR(0.0, 1.0, 0.0, LR90, 0.0, 0.0), depth: 1.0, radius: 0.1, segments: 8, hold: [LI_FRONT, LI_BACK]});
        var outop = new LStructure(ShaderStrand, {color: [g_prng.next(5)/30, g_prng.next(5)/10, g_prng.next(5)/30, 1.0], wcolor: [0.5 + g_prng.next(5)/10, g_prng.next(5)/10, g_prng.next(5)/10, 1.0]}, control);
        outop.structure.addCylinder({position: lFromXYZPYR(0.0, 1.0, 0.0, LR90, 0.0, 0.0), depth: 1.0, radius: 0.1, segments: 8, hold: [LI_FRONT, LI_BACK]});
        intop.addChild(outop, lFromXYZ(0.0, 2.0, 0.0));
        this.obj.addChild(intop, mat4.create());
    
        var inbot = new LStructure(ShaderStrand, {color: [g_prng.next(5)/30, g_prng.next(5)/10, g_prng.next(5)/30, 1.0], wcolor: [0.5 + g_prng.next(5)/10, g_prng.next(5)/10, g_prng.next(5)/10, 1.0]}, control);
        inbot.structure.addCylinder({position: lFromXYZPYR(0.0, 1.0, 0.0, LR90, 0.0, 0.0), depth: 1.0, radius: 0.1, segments: 8, hold: [LI_FRONT, LI_BACK]});
        var oubot = new LStructure(ShaderStrand, {color: [g_prng.next(5)/30, g_prng.next(5)/10, g_prng.next(5)/30, 1.0], wcolor: [0.5 + g_prng.next(5)/10, g_prng.next(5)/10, g_prng.next(5)/10, 1.0]}, control);
        oubot.structure.addCylinder({position: lFromXYZPYR(0.0, 1.0, 0.0, LR90, 0.0, 0.0), depth: 1.0, radius: 0.1, segments: 8, hold: [LI_FRONT, LI_BACK]});
        inbot.addChild(oubot, lFromXYZ(0.0, 2.0, 0.0));
        this.obj.addChild(inbot, lFromXYZPYR(0.0, 0.0, 0.0, LR180, 0.0, 0.0));
    
        this.objs = [
            [intop, 0, 3 + g_prng.next(4), 1],
            [outop, 0, 4 + g_prng.next(4), 2],
            [inbot, 0, 3 + g_prng.next(4), 2],
            [oubot, 0, 4 + g_prng.next(4), 1],
        ];
    
        this.yrot = 0.5 + (g_prng.next(8) / 16);
    }

    move(delta)
    {
        this.obj.rotate(0.0, delta * this.yrot, 0.0);

        for(var i = 0; i < 4; i++) {
            var ln = this.objs[i];

            ln[1] += ln[2] * delta;
            if(ln[1] > LR90) {
                ln[1] = LR90;
                if(ln[2] > 0) ln[2] = 0 - ln[2];
            }
            else if(ln[1] < -LR90) {
                ln[1] = -LR90;
                if(ln[2] < 0) ln[2] = 0 - ln[2];
            }
            var obj = ln[0];
            quat.identity(obj.quat);
            if(ln[3] == 1)
                obj.rotate(ln[1], 0.0, 0.0)
            else
                obj.rotate(0.0, 0.0, ln[1])
        }
        this.obj.procpos();
    }
}

/* The walls */
const RSWALLP = [XP, YP, ZP, ZN, YN, XN];
/* The directions */
const RSDIR = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0], [-1, 0, 0]];

class RStrand {
    constructor(idx)
    {
        // Remote strand - goes places
    
        this.strand = new Strand(this);
        this.obj = new LGroup({collision: LDYNAMIC}, this);
        this.obj.descr = "RSTRAND";
        this.obj.addChild(this.strand.obj, mat4.create());
        this.obj.mkvisible(false);
        this.obj.dynamic = true;
        this.obj.distance = 2;
        this.active = false;
        this.direction = 0;      // Where am I going?
        this.cell = null;
        this.targetcell = null;     // Cell where I am going
        this.inout = 0;      // -1 exiting 0 center 1 entering
        this.targetpath = [];          // A list of cells to target
    
        this.id = g_prng.next(1000);
        this.idx = idx;
    
        this.life = 100;
    
        this.alttexture = lLoadTColor([1.0, 0.0, 0.0, 1.0]);
    
        this.olddist = 20;      // Bang if we are going away from beetle
        this.oldsame = false;   // Were we in the same cell?

        lScene.lAddChild(this.obj, mat4.create());
    }

    birth(home)
    {
        var obj = this.obj;
        const cell = [0, 0, 0];
        if(home) {
            cell[0] = maze.endhere[0];
            cell[1] = maze.endhere[1];
            cell[2] = maze.endhere[2];
        } else {
            cell[0] = g_prng.next(maze.dims[0]);
            cell[1] = g_prng.next(maze.dims[1]);
            cell[2] = g_prng.next(maze.dims[2]);
        }
        this.cell = cell;

        this.obj.moveHere((cell[0] * 10) + 5, (cell[1] * 10) + 5, (cell[2] * 10) + 5);
        this.obj.procpos();
        this.obj.warp();
        this.direction = 0;     // Going nowhere
        this.inout = 0;         // To go somewhere
        this.active = true;
        this.obj.mkvisible(true);
        this.life = 100;
        this.olddist = 20;      // Bang if we are going away from beetle
        this.oldsame = false;   // Were we in the same cell?
    }

    beenshot()
    {
       this.life -= (g_shotbase + g_prng.next(g_shotrand));
       if(this.life <= 0)
       {
           lScene.fuels.create(this.obj.x, this.obj.y, this.obj.z);
           this.die();
       }
    }

    die()
    {
        this.active = false;
    	this.targetpath = [];   // Otherwise we perhaps can walk through walls
        this.obj.mkvisible(false);
        this.birth(true);

    }

    shootbeam()
    {
        // Shoots a beam and creates a line of "targets"
        // To go for
        // If return true we are next to target

        var obj = this.obj;

        var ox = obj.x;
        var oy = obj.y;
        var oz = obj.z;

        var dx = lCamera.x - ox;
        var dy = lCamera.y - oy;
        var dz = lCamera.z - oz;

        var distance = Math.hypot(dx, dy, dz);

        if(distance < 4.8) {
            g_assets.injured.play();
            lScene.life -= 5;
            lScene.mkhurt();
            return true;       // We are here! - Kaboom
        }

        var fact = Math.ceil(distance / 0.2);      // Granular enough

        var path = [];
        var ocell = [this.cell[0], this.cell[1], this.cell[2]];

        var ix = dx / fact;
        var iy = dy / fact;
        var iz = dz / fact;

        var mx = 0;
        var my = 0;
        var mz = 0;

        for(var i = 0; i < fact; i++) {
            ox += ix;
            oy += iy;
            oz += iz;

            if(lScene.lCStaticPDC(ox, oy, oz, 0.2) != null) {
                // this.olddist = 20;      // Reset distance Only set of oldsame is
                // this.oldsame = false;   // No (longer) neighbours - Should never be set
                return false;
            }
            mx = Math.floor(ox / 10);
            my = Math.floor(oy / 10);
            mz = Math.floor(oz / 10);

            if(mx != ocell[0] || my != ocell[1] || mz != ocell[2]) {
                ocell = [mx, my, mz];
                path.push(ocell);
            }
        }

        // We can be seen if we reach here

        if(this.oldsame) {              // We were in the same cell
            if(distance <= this.olddist) { // But we are going away
                g_assets.injured.play();      // Bang
                lScene.life  -= 5 - (this.olddist / 5);
                lScene.mkhurt();
                return true;       // We are here (in corner), strand in center of cell - Kaboom
            }
        }

        // We can see but are not going bang
        if(path.length == 0) {
            this.oldsame = true;        // We will be going BANG
            this.olddist = distance;
            return false;               // Do not follow targets
        }

        this.targetpath = path;


        // If see, adjust direction to next cell

        var tnext = this.targetpath[0];
        var tvec = [
            tnext[0] - this.cell[0],
            tnext[1] - this.cell[1],
            tnext[2] - this.cell[2]
        ];

        // Required direction
        
        var reqdirect = 0;
        if(tvec[0] > 0) reqdirect = 0;
        else if(tvec[1] > 0) reqdirect = 1;
        else if(tvec[2] > 0) reqdirect = 2;
        else if(tvec[2] < 0) reqdirect = 3;
        else if(tvec[1] < 0) reqdirect = 4;
        else if(tvec[0] < 0) reqdirect = 5;

        if(this.direction == reqdirect) {
            if(this.inout == -1) this.targetpath.shift();
            return;     // Carry on moving
        } else if (reqdirect == 5 - this.direction) {
            // Going in oposite direction
            this.direction = reqdirect;
            this.inout = (0 - this.inout);
            if(this.inout == -1) this.targetpath.shift();
            return
        } else if (this.inout == -1) {  // Perpendicular, got to center
            this.direction = 5 - this.direction;
            this.inout = 1;
        }   // else Going to center anyway
    }

    move(delta, move)
    {
        this.strand.move(delta);
        var obj = this.obj;

        const self = this;
        function movepos(oldc, cellind)
        {
            oldc += move;
            move = 0;
            if (self.inout == -1) {
                if (Math.floor(oldc / 10) != self.cell[cellind]) {
                    self.cell[cellind] = Math.floor(oldc / 10);
                    if(!maze.inrange(self.cell)) {
                        self.die();
                        return;
                    }
                    self.inout = 1;
                }
            } else if(self.inout == 1) {
                if((oldc % 10) > 5) {
                    move = (oldc % 10) - 5;
                    oldc -= move;
                    self.inout = 0;
                }
            }
            return oldc;
        }
        function moveneg(oldc, cellind)
        {
            oldc -= move;
            move = 0;
            if (self.inout == -1) {
                if (Math.floor(oldc / 10) != self.cell[cellind]) {
                    self.cell[cellind] = Math.floor(oldc / 10);
                    if(!maze.inrange(self.cell)) {
                        self.die();
                        return;
                    }
                    self.inout = 1;
                }
            } else if(self.inout == 1) {
                if((oldc % 10) < 5) {
                    move =  5 - (oldc % 10);
                    oldc += move;
                    self.inout = 0;
                }
            }
            return oldc;
        }

        if(this.inout != 0) {
            switch(this.direction) {
            case 0: obj.x = movepos(obj.x, 0);break;
            case 1: obj.y = movepos(obj.y, 1);break;
            case 2: obj.z = movepos(obj.z, 2);break;
            case 3: obj.z = moveneg(obj.z, 2);break;
            case 4: obj.y = moveneg(obj.y, 1);break;
            case 5: obj.x = moveneg(obj.x, 0);break;
            }
            obj.procpos();
            lScene.lCMove(obj);
            if(this.inout != 0) return;
        }


        // Following only if inout is 0 - Changing direction
        if(this.targetpath.length > 0) {
            var path = this.targetpath.shift();
            var cell = this.cell;
            var ind = (path[0] - cell[0]) + ((path[1] - cell[1]) * 2) + ((path[2] - cell[2]) * 4);
            switch(ind) {
            case 1: this.direction = 0; break;
            case 2: this.direction = 1; break;
            case 4: this.direction = 2; break;
            case -4: this.direction = 3; break;
            case -2: this.direction = 4; break;
            case -1: this.direction = 5; break;
            default: 
                this.targetpath = [];
                ind = 0;
                break;
            }
            if(ind != 0) {
                this.inout = -1;
                return this.move(delta, move);
            }
        }

        // A way of choosing random shit

        var rdirs = [];
        var walls = maze.getwall(this.cell);

        var dir = -1;
        var dirlen = 0;
        for(var i = 0; i < 6; i++) {
            if(i != 5 - this.direction) {
                if((walls & RSWALLP[i]) == 0) {
                    rdirs.push(i);
                    dirlen++;
                }
            }
        }
        if(dirlen == 0)
            this.direction = 5 - this.direction;
        else 
            this.direction = rdirs[g_prng.next(dirlen)];
        
        this.inout = -1;        // Exiting
        return this.move(delta, move);
    }
}

class OSL20 {
    constructor()
    {
        this.obj = new LGroup({collision: LDYNAMIC}, this);
        this.obj.distance = 4;
        this.mstrands = [];
        this.life = 100;
    
        for(var i = 0; i < 32; i++) {
            const strand = new Strand(this);
            this.mstrands.push(strand);
            this.obj.addChild(strand.obj, mat4.create());
        }
    
        const ring = new LStructure(ShaderSelf, {texture: g_assets.sl20}, this);
        ring.structure.addCylinder({position: lFromXYZPYR(0, 0, 0, -LR90, 0, 0), radius: 0.3, depth: 0.3, hold: [LI_FRONT, LI_BACK]});
        this.obj.addChild(ring, mat4.create());
        this.ring = ring;
    
        this.ex = (maze.endhere[0] * 10) + 5;
        this.ey = (maze.endhere[1] * 10) + 5;
        this.ez = (maze.endhere[2] * 10) + 5;
    
        this.shotbase = 11 -  g_atlevel;
        if(this.shotbase < 0) this.shotbase = 0;
        this.shotrand  = 3 + (10 - this.shotbase)
    }

    move(delta)
    {
        if(Math.floor(lCamera.x/10) == maze.endhere[0] && Math.floor(lCamera.y/10) == maze.endhere[1] && Math.floor(lCamera.z/10) == maze.endhere[2]) {
            lScene.life -= 10 * delta;
            g_assets.injured.play();
        }
        for(var i = 0; i < 32; i++) this.mstrands[i].move(delta);
        this.ring.rotate(0, -delta/1.5, 0);
        this.obj.procpos();
    }

    beenshot()
    {
        g_assets.sbang.play();
        this.life -= this.shotbase + g_prng.next(this.shotrand);
        if(this.life < 0)
        {
            lScene.win = true;
            g_atlevel += 1;
            document.getElementById("tmessage").innerText = "*** WIN ***";
            lScene.runme = false;
            lScene.oboom = new Boom();
            g_assets.endbang.play();
            return false;
        }
        else
            return true;
    }
}

class Bullet {
    constructor(bulletDef)
    {
        const obj = new LObject(bulletDef, null);
        obj.mkvisible(false);
    
        this.obj = obj;
        lScene.lAddChild(obj, mat4.create());
    
        this.fired = false;
        this.position = mat4.create();
        this.life = 0;
    
        // Always ignore this
        this.obj.ignore = true;
        this.obj.descr = "BULLET";
    }

    fire()
    {
        if(this.fired) return;

        lScene.life -= 0.1;

        g_assets.fire.play();

        this.obj.moveHere(lCamera.x, lCamera.y, lCamera.z);

        quat.invert(this.obj.quat, lCamera.quat);
        this.fired = true;
        this.obj.mkvisible(true);
        this.obj.procpos();
        this.obj.warp();
        this.life = 2.5;
    }

    move(delta)
    {
        this.obj.move(0, 0, -delta * 20);
        this.obj.procpos();

        var out = null;;

        function _see(cob) {
            if(!out) {
                if(!(cob.control instanceof Fuel)) {
                    out = cob;
                }
            }
        }

        lScene.lCAllPointDetect(this.obj, 0.2, _see);

        if(out) {
            this.fired = false;
            this.obj.mkvisible(false);
            this.obj.moveHere(0, 0, 0);
            quat.identity(this.obj.quat);
            if(out.control) {
                if(out.control.beenshot) {
                    g_assets.sbang.play();
                    out.control.beenshot();
                }
            }
            this.obj.procpos();
        } else {
            this.life -= delta;
            if(this.life < 0) {
                this.fired = false;
                this.obj.mkvisible(false);
                this.obj.moveHere(0, 0, 0);
                
                quat.identity(this.obj.quat);
                this.obj.procpos();
            }
        }
    }
}
        
class Scene extends LBase {
    constructor(args)
    {
        super(args);
        this.runme = true;
        this.life = 100;
        this.bescape = false;
        this.hurt = 0.0;
    
        this.ambientLight =  vec3.fromValues(0.3, 0.3, 0.3);
        this.directionalLightColor = vec3.fromValues(1.0, 1.0, 1.0);
    
        var keys = {
            pitch_down: false,
            pitch_up: false,
            roll_anti: false,
            roll_clock: false,
            fire: false,
            go_forward: true,
        };
    
    
        // Register keys as functions for performance
        lInput.register(83, function(ind) {keys.pitch_down = ind;});
        lInput.register(88, function(ind) {keys.pitch_up = ind;});
        lInput.register(188, function(ind) {keys.roll_anti = ind;});
        lInput.register(190, function(ind) {keys.roll_clock = ind;});
        lInput.register(32, function(ind) {if(ind) keys.go_forward = true;});
        lInput.register(191, function(ind) {if(ind) keys.go_forward = false;});
        lInput.register(27, function(ind) {if(ind) lScene.doescape()});
        lInput.register(65, function(ind) {if(ind) keys.fire = true;});
    
        // Use them
        lInput.usekeys();
    
        this.keys = keys;
    }

    lLoop(delta)
    {
        if(!this.runme) {
            if(this.bescape) return false;     // Finish it NOW
            if(this.win) {
                return this.oboom.doboom(delta);
            } else {
                return this.oflush.doflush(delta);
            }
            return true;
        }


        if(this.hurt > 0.0) {
            if(delta > this.hurt) {
                this.ambientLight = this.saveambientLight;
                this.directionalLightColor = this.savedirectionalLightColor;
            } else {
                this.hurt -= delta;
            }
        }

        var keys = this.keys;

        if(!keys.go_forward) return true;

        var tlife = 0;
        tlife += 0.01;

        var x = 0;
        var y = 0;
        var z = 0;
        var rx = 0;
        var ry = 0;
        var rz = 0;

        var ya = 0;

        var dmove = delta * this.incspeed;
        var move = dmove * 2

        if(
            (!keys.roll_clock) && (!keys.roll_anti) && (!keys.pitch_up) && (!keys.pitch_down)) {
            z -= move;
        } else {
            tlife += 0.04;
        }

        if(keys.pitch_up) rx += dmove;
        if(keys.pitch_down) rx -= dmove;
        if(keys.roll_clock) rz -= dmove;
        if(keys.roll_anti) rz += dmove;

        lCamera.move(x, y, z);

        var lout = lScene.lCPointDetect(lCamera, 0.2);
        if(lout != null)
        {
            if(lout.structure.collision == LSTATIC) {
                lCamera.move(-x, -y, -z);
                tlife += 1;
                if(!this.hit) {
                    g_assets.scrape.start();
                    this.hit = true;
                }
            } else {
                if(lout.control instanceof Fuel) {
                    lout.control.slurp();
                }
                else if (lout.control instanceof RStrand)
                {
                    g_assets.injured.play();
                    this.life -= 5;
                    this.mkhurt();
                    lout.control.die();
                }
           }
        } else if (this.hit) {
            g_assets.scrape.pause();
            this.hit = false;
        }

        lCamera.rotate(rx, ry, rz);

        if(this.lastfired > 0) {
            if(delta > this.lastfired)
                this.lastfired = 0;
            else
                this.lastfired -= delta;
        }

        if(keys.fire) {
            if (this.lastfired <= 0) {
                this.bullets[this.firenext].fire();
                this.firenext += 1;
                if(this.firenext >= 10) this.firenext = 0;
                this.lastfired = g_lastfired;
            }
            keys.fire = false;
        }

        var obj = null;
        var out = null;

        for(var i = 0; i < 10; i++) {
            var bullet = this.bullets[i];
            if(bullet.fired) {
                bullet.move(dmove);
            }
        }

        // Movement

        this.sl20.move(delta);

        var numstrands = this.numstrands;
        for(var i = 0; i < numstrands; i++) {
            var sra = this.strands[i];
            if(sra.active) {
                if(sra.shootbeam())
                    sra.die();
                else
                    sra.move(delta, dmove);
            }
        }

        this.life -= tlife * delta;

        if(this.life < 0) {
            this.win = false;
            document.getElementById("tmessage").innerText = "--- LOSE ----";
            g_assets.flush.play();
            this.runme = false;
            this.oflush = new Flush();
            if(g_atlevel > 0) g_atlevel -= 1;
        }
    
        this.tlife.innerText = Math.round(this.life * 100) / 100;

        return true;
    }

    mkhurt()
    {
        this.hurt = 0.3;
        this.ambientLight = this.hurtAmbientLight;
        this.directionalLightColot = this.hurtDirectionalLightColor;
    }
    doescape()
    {
        // Do things to end
        this.bescape = true;
        this.runme = false;
        // Makes form invisible
        document.getElementById("mform").style.display = "block";
        document.getElementById("mgame").style.display = "none";
    }
}



var g_ismobile = false;
var assets;

function g_loadassets()
{
    const assets = g_assets_obj;
    function inprogress()
    {
        document.getElementById("loading").innerText = assets.succeeded.toString() + " out of " + assets.total.toString() + "assets loaded";
    }
    function onend() {
        document.getElementById("playbutton").disabled = false;
        document.getElementById("loading").innerText = "All assets loaded";
    }
    
    assets.download({onend:onend, inprogress:inprogress});
}

function playgame(mname, mlevel, mobile)
{

    if(mlevel == "") mlevel = 1;
    if(mname == "") mname = "Labarynth";
    mlevel = parseInt(mlevel) - 1;

    var seed = hashCode(mname);
    if(seed == 0) seed = 1;

    document.getElementById("tmazename").innerText = mname;
    
    g_atlevel = mlevel;
    document.getElementById("mform").style.display = "none";
    document.getElementById("mgame").style.display = "block";

    g_ismobile = mobile;
    lInit();

    if(g_ismobile) {
        const canvas = document.getElementById(LCANVAS_ID);
        const frm = document.forms.mobile;
    
        var div = document.forms.buttons;
        div.appendChild(lAddButton("bl", 0, 0,  "v", 88));
        div.appendChild(lAddButton("bl", 1, 0,  "^", 83));
        div.appendChild(lAddButton("bl", 2, 0,  "A", 65));
        div.appendChild(lAddButton("tl", 1, 0, "?", 191));
        div.appendChild(lAddButton("tl", 2, 0, "!", 32));
        div.appendChild(lAddButton("br", 0, 0,  ">", 190));
        div.appendChild(lAddButton("br", 0, 1,  "<", 188));
        div.appendChild(lAddButton("br", 2, 0,  "A", 65));
        div.appendChild(lAddButton("tr", 1, 0, "X", 27));
        document.getElementById("mobileform").style.display = "block";
    } else {
        document.getElementById("mobileform").style.display = "none";
    }
    lClear();
    playloop(seed);

}

function playloop(iseed)
{
    var msize = LEVELS[g_atlevel];
    if(msize == null) msize = [6, 6, 6];

    new Scene({
        lCFrom: [-10, -10, -10],
        lCTo: [(msize[0] * 10) + 10, (msize[1] * 10) + 10, (msize[2] * 10) + 10],
        lCSize: 3.3333,
        lCIncrement: 0.2,
        });

    lScene.lRestart = function() {g_assets.scrape.stop(); if(!lScene.bescape) playloop(iseed); };

    var size = vec3.fromValues(msize[0], msize[1], msize[2]);

    maze = new Maze(size, iseed + g_atlevel);

    document.forms.mform.mazelevel.value = g_atlevel + 1;

    g_strandhit = 4.0 - (g_atlevel / 7);
    if(g_strandhit < 1.0) g_strandhit = 1.0;

    var g_shotbase = 45 - (g_atlevel * 3);
    if(g_shotbase < 10) g_shotbase = 10;
    g_shotrand = 100 - g_shotbase;

    g_lastfired = 0.5 - g_atlevel / 20;
    if(g_lastfired < 0.1) g_lastfired = 0.1;

    g_howfast = 2.0 + g_atlevel / 5;
    if(g_howfast > 8.0) g_howfast = 8.0;

    // These are stored in global variables

    lScene.ambientLight =  vec3.fromValues(0.3, 0.3, 0.3);
    lScene.directionalLightColor = vec3.fromValues(1.0, 1.0, 1.0);

    lScene.hurtAmbientLight =  vec3.fromValues(0.4, 0.4, 0.1);
    lScene.hurtDirectionalLightColor = vec3.fromValues(1.0, 1.0, 0.7);

    lScene.saveambientLight =  lScene.ambientLight;
    lScene.savedirectionalLightColor = lScene.directionalLightColor

    lScene.runme = true;
    document.getElementById("tlevel").innerText = (g_atlevel + 1).toString();
    lScene.tlife = document.getElementById("tlife");
    lScene.tlife.innerText = "100";

    lScene.hit = false;
    lScene.life = 100.0;
    lScene.win = false;


    var imsize = [1024, 1024];
    var third = 341;
    var third2 = 682;

    var psize = [third, third];


    var wad1 = new LTextureControl(imsize, [1, 1], psize);
    var wad2 = new LTextureControl(imsize, [1, third], psize);
    var wad3 = new LTextureControl(imsize, [1, third2], psize);
    var wad4 = new LTextureControl(imsize, [third, 1], psize);
    var wad5 = new LTextureControl(imsize, [third, third], psize);
    var wad6 = new LTextureControl(imsize, [third, third2], psize);
    var wad7 = new LTextureControl(imsize, [third2, 1], psize);
    var wad8 = new LTextureControl(imsize, [third2, third], psize);
    var wad9 = new LTextureControl(imsize, [third2, third2], psize);
    var wads = [wad1, wad2, wad3, wad4, wad5, wad6, wad7, wad8, wad9]
    var wade = new LTextureControl(imsize, [third2, third2], [3, third]);

    var floor = new LTextureControl([512, 256], [0, 0], [256, 256]);
    var ceil = new LTextureControl([512, 256], [256, 0], [256, 256]);

    function get_wad(idx)
    {
        switch(idx) {
        case 0: return [wade, wade, wade, wads[maze.prng.next(9)], wade, wads[maze.prng.next(9)]]; break;
        case 1: return [wade, wade, wads[maze.prng.next(9)], wade, wads[maze.prng.next(9)], wade]; break;
        case 2: return [wads[maze.prng.next(9)], wads[maze.prng.next(9)], wade, wade, wade, wade]; break;
        }
        return [maze.prng.next(9), maze.prng.next(9), maze.prng.next(9), maze.prng.next(9), maze.prng.next(9), maze.prng.next(9)];
    }

    var xobj = new LStructure(ShaderSelf, {texture: g_assets.wallads, collision: LSTATIC}, null)
    var yobj = new LStructure(ShaderSelf, {texture: g_assets.floorceil, collision: LSTATIC}, null);
    var zobj = new LStructure(ShaderSelf, {texture: g_assets.wallads, collision: LSTATIC}, null)
    lScene.lAddChild(xobj, mat4.create());
    lScene.lAddChild(yobj, mat4.create());
    lScene.lAddChild(zobj, mat4.create());

    for(var i = 0; i < size[0]; i++) {
        for(var j = 0; j < size[1]; j++) {
            for(var k = 0; k < size[2]; k++) {
                var cell = vec3.fromValues(i, j, k);
                var sit = maze.getwall(cell);

                var ii = i * 10;
                var jj = j * 10;
                var kk = k * 10;

                if(sit & XP) xobj.structure.addBlock({position: lFromXYZ(ii + 9.94, jj + 5, kk + 5), size: [0.05, 5, 5], texturecontrols: get_wad(0)});
                if(sit & XN) xobj.structure.addBlock({position: lFromXYZ(ii + 0.06, jj + 5, kk + 5), size: [0.05, 5, 5], texturecontrols: get_wad(0)});
                if(sit & YP) yobj.structure.addBlock({position: lFromXYZ(ii + 5, jj + 9.94, kk + 5), size: [5, 0.05, 5], texturecontrols: [ceil, ceil, ceil, ceil, ceil, ceil]});
                if(sit & YN) yobj.structure.addBlock({position: lFromXYZ(ii + 5, jj + 0.06, kk + 5), size: [5, 0.05, 5], texturecontrols: [floor, floor, floor, floor, floor, floor]});
                if(sit & ZP) zobj.structure.addBlock({position: lFromXYZ(ii + 5, jj + 5, kk + 9.94), size: [5, 5, 0.05], texturecontrols: get_wad(2)});
                if(sit & ZN) zobj.structure.addBlock({position: lFromXYZ(ii + 5, jj + 5, kk + 0.06), size: [5, 5, 0.05], texturecontrols: get_wad(2)});
            }
        }
    }

    lScene.booms = [xobj, yobj, zobj];


    const sl20 = new OSL20();
    lScene.lAddChild(sl20.obj, lFromXYZ((maze.endhere[0] * 10) + 5, (maze.endhere[1] * 10) + 5, (maze.endhere[2] * 10) + 5));
    sl20.obj.mkvisible(true);
    lScene.sl20 = sl20;


    const bulletDef = new LStructureDef(ShaderSelf, {color: [1.0, 1.0, 0.0, 1.0], collision:LNONE});
    bulletDef.addCylinder({position: lFromXYZ(0.15, 0.0, 0.0), radius: 0.02,  depth: 0.15, segments: 8});
    bulletDef.addCylinder({position: lFromXYZ(-0.15, 0.0, 0.0), radius: 0.02,  depth: 0.15, segments: 8});
    bulletDef.addCylinder({position: lFromXYZ(0.0, 0.15, 0.0), radius: 0.02,  depth: 0.15, segments: 8});
    bulletDef.addCylinder({position: lFromXYZ(0.0, -0.15, 0.0), radius: 0.02,  depth: 0.15, segments: 8});

    lScene.bullets = [];
    for(var i = 0; i < 10; i++)
        lScene.bullets.push(new Bullet(bulletDef));

    const stras = [];
    const fuels = [];

    var numstrands = Math.floor(maze.numcells / 3);
    lScene.incspeed = 1;

    if(numstrands > 32) {
        lScene.incspeed += (numstrands - 32) / 32;
        numstrands = 32;
    }
    lScene.numstrands = numstrands;

    for(var i = 0; i < numstrands; i++) {
        stras.push(new RStrand(i));
    }

    lScene.strands = stras;
    lScene.fuels = new Fuels(Math.floor(numstrands));

    lScene.firenext = 0;  // Next bullet to fire
    lScene.lastfired = 0;  // Countdown to next fire

    lScene.lSetup();

    lCamera.move(0, 0, 0);
    lCamera.rotate(0, LR180 + (LR90 / 2), 0);
    lCamera.rotate(LR90 / 2, 0, 0);

    lCamera.warp();
    // lCamera.rotate(0, LR180, 0);
    // lCamera.rotate(LR90 / 2, 0, 0);
    lScene.hit = false;

    for(var i = 0; i < numstrands; i++)
        lScene.strands[i].birth();
    
    document.getElementById("tmessage").innerText = "";
    lScene.lMain();
}
                
class Boom {
    constructor()
    {
        this.time = 10.0;
    }

    doboom(delta)
    {
        this.time -= delta;
        if(this.time < 0) return false;
        for(var i = 0; i < 3; i++) {
            lScene.booms[i].move((100 - g_prng.next(100)) * delta, (100 - g_prng.next(100)) * delta, (100 - g_prng.next(100)) * delta);
            lScene.sl20.obj.move((40 - g_prng.next(40)) * delta, (200 - g_prng.next(40)) * delta, (40 - g_prng.next(40)) * delta);
            lCamera.move(0, 0, 10 * delta);
            lScene.lPos();
        }
        return true;
    }
}

class Flush {
    constructor()
    {
        this.time = 5.0;
    }

    doflush(delta)
    {
        this.time -= delta;
        if(this.time <= 0) return false;

        var amb = this.time / 16.66;
        var dir = this.time / 5.0;
        lScene.ambientLight =  vec3.fromValues(amb * 2, amb / 1.5, amb / 1.5);
        lScene.directionalLightColor = vec3.fromValues(dir * 2, dir / 1.5, dir / 1.5);
        return true;
    }
}


window.g_loadassets = g_loadassets;
window.playgame = playgame;
