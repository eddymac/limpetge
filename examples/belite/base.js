"use strict";

/*
The base classes, functions and variables for the game

This games uses David braben / Ian Bell (as well as Christian Pinder's) work.  I have separated that out
to be primarily in "edb.js" and "eships.js".  The latter of these uses base classes as defined here
(as well as the main game).  

*/

import { LAssets, LImage, LAudios, LAudioLoop, LBase, LCamera, LObject, LIObject, LWObject, LStaticGroup, LGroupDef,
    LStructureDef, LTextureControl, LVirtObject, LGroup, LStructure, LKey, lInput, lInText, LObjImport, LComponent,
    lInit, lClear, lStructureSetup, lTextureColor, lTextureColorAll, lTextureList, lLoadTexture, lReloadTexture, lLoadTColor,
    lReloadTColor, lLoadTColors, lReloadTColors, lLoadTCanvas, lReloadTCanvas, lInitShaderProgram, lElement, lAddButton, lCanvasResize,
    lFromXYZR, lFromXYZ, lFromXYZPYR, lExtendarray, lGetPosition, lAntiClock, lCoalesce, lIndArray,
    LPRNG, LPRNGD, LCANVAS_ID, LR90, LR180, LR270, LR360, LI_FRONT, LI_BACK, LI_SIDE, LI_TOP, LI_RIGHT, LI_BOTTOM, LI_LEFT, LSTATIC,
    LDYNAMIC, LNONE, LBUT_WIDTH, LBUT_HEIGHT, LMESTIME, LASSET_THREADS, LASSET_RETRIES, LOBJFILE_SMOOTH, LTMP_MAT4A, LTMP_MAT4B,
    LTMP_MAT4C, LTMP_QUATA, LTMP_QUATB, LTMP_QUATC, LTMP_VEC3A, LTMP_VEC3B, LTMP_VEC3C, lSScene, LTEXCTL_STATIC,
    LTEXCTL_STATIC_LIST, lGl, lCamera, lScene, lDoDown, lDoUp, lShader_objects, mat4, vec3, vec4, quat} from "../../libs/limpetge.js"

import {
    ShaderSun,
    ShaderPlanet,
    ShaderSimple,
    ShaderCockpit,
    ShaderSolid,
    ShaderScanLine,
    ShaderSolidTrans,
    ShaderDust,
    ShaderDial
} from "./shader_belite.js";

import {
    EDB_TRADE_LENGTH,
    EDB_T_ALLOYS,
    EDB_T_MINERALS,
    EDB_T_THARGON,
    ECommander,
    EDWorld,
    EDSun
} from "./edb.js";

const BASEDIR = "./belite/";

const g_prng = new LPRNG(Math.random() * 10000);
const g_prngd = new LPRNGD(Math.random() * 10000);

const BEZCIRCLE = 0.551915024494;

const structures = {};

const SLOTSIZE_2_2 = 1;
const SLOTSIZE_3_3 = 2;
const SLOTSIZE_6_3 = 3;
const SLOTSIZE_8_5 = 4;
const SLOTSIZE_8_15 = 5;

const SLOTSIZE_MAX = SLOTSIZE_8_15;

    // Size         Num   Z    firstX   SubX
const SLOTS = [
    [SLOTSIZE_2_2,   24,  29],
    [SLOTSIZE_8_15,   6,  20.5],
    [SLOTSIZE_8_5,    6,  10.5],
    [SLOTSIZE_3_3,    16,   6.5],
    [SLOTSIZE_8_15,   6,  -3.5],
    [SLOTSIZE_8_5,    6,  -13.5],
    [SLOTSIZE_6_3,    8,  -17.5],
    [SLOTSIZE_2_2,   24,  -20],
    [SLOTSIZE_3_3,    16,  -22.5],
    [SLOTSIZE_3_3,    16,  -25.5],
    [SLOTSIZE_6_3,    8,  -28.5],
];

const HOLDPOS = vec3.fromValues(0, 0, 15);  // Holding position for take off and landing

const ETRADER = 0;
const ESMUGGLER = 1;
const EHUNTER = 2;
const EPIRATE = 3;
const EMINER = 4;
const EPOLICE = 5;
const ETRANSPORT = 6;
const EHERMIT = 7;
const ETHARGOID = 8;
const ESOLO = 9

const STATION_ROTATE = 0.2;
const STANDARD_MAXVEL = 20.0;

const FCANFIRE = 400;
const FOPTIMAL = 200;
const FTURN = 300;
const FTOONEAR = 100;

const ECM_ENERGY = 30;
const ECM_DELAY = 10;

class ThingBase {
    constructor(scancolor)
    {
        this.velocity = 0;  // Between 1 and 20 (10 to 200 meters / second
        this.velacc = 0;  // Acceleration

        this.velpitch = 0;  // Pitch velocity
        this.maxvelpitch = 1.0;
        this.accelpitch = 1.0;

        this.velroll = 0;  // Pitch velocity
        this.maxvelroll = 1.0;
        this.accelroll = 1.0;
        // this.velocity = 0;  // Between 1 and 20 (10 to 200 meters / second
        this.haslanded = false;
        this.islanding = false;

        this.scan = this.getscan(scancolor);
    
        this.slotsize = 0;
        this.centerz = 0;
        this.centery = 0;
        this.bottom = 0;
        this.width = 2;     // Width of the ship for lasers
        this.slotsize = 0;
        // Station Position
    
        this.hasroom = true;
        this.mrelpos = vec3.create();  // Vector from me to other
    
        this.station = null;
    
        this.bangsize = 50;
        this.exists = false;
        this.crash = false;

        this.maxvelocity = 20;

        // Hyperspace - do for all

        this.invposition = mat4.create();

        this.shields = 100;
        this.maxshields = 100;
        this.integrity = 100;
        this.maxintegrity = 100;

        this.damage = 100;

        this.islocking = false;
        this.wantlocking = false;

        this.isnocrime = true;

        this.description = "Object"
        this.bounty = 0;
        this.ship = this;

        this.worth = 0;     // Score when damabed
    }

    // Retrieve the scan object - use method so cockpit can overide it
    getscan(scancolor)
    {
        return new Scan(scancolor, this);
    }

    /*
     * Artificial intligence
     * The "other" ship is o
     " I am "m"
     * shared is s
     */

    postinit()
    {
        this.obj.mkvisible(false);
        this.scan.mkvisible(false);
        this.exists = false;

        this.integrity = this.maxintegrity;
        this.shields = this.maxshields;
    }

    /*
     * Default locking and unlocking do nothing
     */
    seerange(ind) { }
    unlock() { }
    lock() { }

    domessage(s) { }
    offmessage(s) { }
    missmess(nd) {}    

    appear(x, y, z, q)
    {
        if(!this.exists) {
            if(this instanceof NPCBase)
            {
                if(this.wing) this.wing.numalive += 1;
            }
            this.exists = true;
        }

        this.obj.moveHere(x, y, z);
        quat.copy(this.obj.quat, q);
        this.obj.mkvisible(true);
        this.scan.mkvisible(true);
        this.obj.warp();
        this.obj.procpos();
        mat4.invert(this.invposition, this.obj.position);
        return true;
    }
    disappear()
    {
        if(!(this.exists)) return;
        this.exists = false;
        this.obj.x = 0;
        this.obj.y = 0;
        this.obj.z = 0;
        quat.identity(this.obj.quat);
        this.obj.mkvisible(false);
        this.unlock();
        this.scan.mkvisible(false);
        if(this instanceof NPCBase) {
            if(this.wing) {
                this.wing.numalive -= 1;
                if(this.inrange) this.wing.numinrange -= 1;
                if(this.wing.numalive <= 0 || this.wing.numinrange <= 0) this.wing.disappear();
            }
        }
    }

    procmove(delta)
    {
        if(this.crash) return;

        this.obj.move(0, 0, -this.velocity * delta);
        this.obj.rotate(delta * this.velpitch, 0, (delta * this.velroll));
        this.obj.procpos();

        var self = this;

        function _cback(cob)
        {
            if(self.crash) return;
            var ctl = cob.control;
            if (ctl instanceof StationBase) {
                if(!ctl.seecolide(self)) {
                    self.crash = true;
                    return;
                }
                self.hasroom = self.land(ctl);
            } else if(ctl instanceof FlotsamBase) {
                if(!ctl.seecolide(self)) {
                    if(ctl.born <= 0) {
                        self.hitme(ctl);
                        ctl.explode();
                    }
                }
            } else if (ctl instanceof AsteroidBase) {
                let sobj = self.obj;
                let dist = Math.hypot(sobj.x - cob.x, sobj.y - cob.y, sobj.z - cob.z);
                if(dist + sobj.distance <= 95) {
                    self.crash = true;
                }
            } else if(ctl instanceof ThargonBase) {
                if(!ctl.seecolide(self)) {
                    self.hitme(ctl);
                    ctl.explode();
                }
            } else if(ctl instanceof ThingBase) {
                self.crash = true;
                ctl.crash = true;
                ctl.explode();
            } else if (ctl instanceof VirtStation) {
                throw "Unexpected virtual station in normal space";
                return;
            }
        }

        if(!this.ispark) {
            mat4.invert(this.invposition, this.obj.position);
            this.obj.ignore = true;
            lScene.lCAllPointDetect(this.obj, 1.00, _cback);
            this.obj.ignore = false;
            if(this.crash) {
                this.obj.rotate(-delta * this.velpitch, 0, -(delta * this.velroll));
                this.obj.move(0, 0, this.velocity * delta);
                this.obj.procpos();
                this.explode();
            }
        }
    }

    move(x, y, z)
    {
        this.obj.move(x, y, z);
    }
    rotate(rx, ry, rz)
    {
        this.obj.rotate(rx, ry, rz);
    }
    getquat()
    {
        return this.obj.quat;
    }

    moverelpos()
    {
        // This takes the position of ship, and creates a relative position
        // of the ship

        if((!this.haslanded) && (this.obj.isvisible)) {
            lScene.setscan(this);
        }
    }

    explode()
    {
        if(this.bangsize < 0) return;
        var exp = lScene.explosions.next();
        exp.bang(this, this.bangsize, this.obj.x, this.obj.y, this.obj.z);
        g_ass.explode.play();
        this.disappear();
        if(this.ispark) this.parkobj.destroy();
    }


    hitme(what)
    {
        this.integrity -= (what.damage + g_prngd.next(what.damage) + g_prngd.next(what.damage));
        if(this.integrity < 0) {
            this.integrity = 0;
            this.beenhit(what);
        }
    }

    beenhit(resp)
    {
        this.explode();
    }

    addcrime(damage) { }        // No crime if just a thing
    maketerrorist() { }        // No crime if just a thing
};

class FlotsamBase extends ThingBase {
    constructor(scancolour)
    {
        super(scancolour);
    
        this.xvel = 0;
        this.yvel = 0;
        this.zvel = 0;
    
        this.xrot = 0;
        this.yrot = 0;
        this.zrot = 0;

        this.damage = 10;
        this.maxshields = 0;
        this.shields = 0;
        this.maxintegrity = 10;
        this.integrity = 10;
        this.rechargerate = 0;
        this.what = -1; // Say it is nothing

        this.born = 0.0;    // Needs to be indestructable for a second

    }

    seecolide(ship)
    {
        // What happens if something collides with me
        if(ship instanceof PersonBase) {        //
            if(ship.canpickup()) {
                vec3.transformMat4(LTMP_VEC3A, this.obj.getVec(LTMP_VEC3A), ship.invposition);
                if(LTMP_VEC3A[1] < 0) {
                    return ship.pickup(this);
                }
            }
        }
        return false;
    }

    appear(x, y, z)
    {
        this.obj.mkvisible(true);
        this.obj.moveHere(x, y, z);
        this.iobj.rotateHere(g_prngd.next(LR90), g_prngd.next(LR90),g_prngd.next(LR90));

        this.xvel = 0.7 - g_prngd.next(1.4);
        this.yvel = 0.7 - g_prngd.next(1.4);
        this.zvel = 0.7 - g_prngd.next(1.4);

        this.xrot = 1 - g_prngd.next(2.0);
        this.yrot = 1 - g_prngd.next(2.0);
        this.zrot = 1 - g_prngd.next(2.0);

        this.obj.warp();
        this.obj.procpos();
        this.exists = true;

        this.born = 3;

        return true;
    }

    process(delta)
    {
        if(!this.exists) return;
        if(this.born > 0) {
            if(this.born > delta) {
                this.born -= delta;
            } else {
                this.born = 0;
            }
        }
        this.obj.move(this.xvel * delta, this.yvel * delta, this.zvel * delta);
        this.iobj.rotate(this.xrot * delta, this.yrot * delta, this.zrot * delta);
        this.obj.procpos();
        this.moverelpos();
    }

}

class EscapeBase extends FlotsamBase {
    constructor(scancolour)
    {
        super(scancolour);
    }

    beenhit(resp)
    {
        if(resp.ship) {
            resp.ship.addcrime(20);
        }
        super.beenhit(resp);
    }

    seecolide(ship)
    {
        // What happens if something collides with me
        if(ship instanceof PersonBase) {        //
            if(ship.canpickup()) {
                vec3.transformMat4(LTMP_VEC3A, this.obj.getVec(LTMP_VEC3A), ship.invposition);
                if(LTMP_VEC3A[1] < 0) {
                    return ship.pickup(this);
                }
            }
        }
        return false;
    }

    appear(x, y, z)
    {
        this.obj.mkvisible(true);
        this.obj.moveHere(x, y, z);
        this.iobj.rotateHere(g_prngd.next(LR90), g_prngd.next(LR90),g_prngd.next(LR90));

        let vec = vec3.normalize(LTMP_VEC3A, lScene.player.jumpvec);
        vec[0] = 0 - vec[0];
        vec[1] = 0 - vec[1];
        vec[2] = 0 - vec[2];

        this.xvel = vec[0] * 5;
        this.yvel = vec[1] * 5;
        this.zvel = vec[2] * 5;

        this.xrot = 1 - g_prngd.next(2.0);
        this.yrot = 1 - g_prngd.next(2.0);
        this.zrot = 1 - g_prngd.next(2.0);

        this.obj.warp();
        this.obj.procpos();
        this.exists = true;

        this.born = 3;

        return true;
    }
}

/*
Asteroids and boulders like flotsam, do not crash into anything, but things can crash into it.
 */
 
class AsteroidBase extends ThingBase {
    constructor(scancolor)
    {
        super(scancolor);
        this.hittime = 0;
        this.hashit = false;
        this.ishermit = false;
    }
    appear(x, y, z, q)
    {
        super.appear(x, y, z, q);
        this.xrot = 0.3 - g_prngd.next(0.6);
        this.yrot = 0.3 - g_prngd.next(0.6);
        this.zrot = 0.3 - g_prngd.next(0.6);
        this.hittime = 3;
        this.exists = true;
    }
    process(delta)
    {
        if(this.hittime > 0) {
            if(delta < this.hittime) {
                this.hittime -= delta;
            } else {
                this.hittime = 0;
            }
        }
        this.obj.rotate(this.xrot * delta, this.yrot * delta, this.zrot * delta);
        this.obj.procpos();
        this.moverelpos();
    }
    hitme(what)
    {
        if(this.ishermit) {
            if(!this.hashit) {
                this.hashit = true;
                if(what.ship) {
                    if(!lScene.winghermit.exists) {
                        let aobj = this.obj;
                        lScene.winghermit.appear(what.ship, aobj.x, aobj.y, aobj.z);
                    }
                }
            }
        }
        
        if(this.hittime == 0) {
            this.hittime = 2;
            if(g_prng.next(15) > 0) return;
            if(what.ship) what = what.ship;
            let wx = what.obj.x;
            let wy = what.obj.y;
            let wz = what.obj.z;

            let bld = lScene.boulders.next();
            // Need to find where we hit, move OUT, and travel out that way

            let rx = 1.2 - g_prngd.next(0.4);
            let ry = 1.2 - g_prngd.next(0.4);
            let rz = 1.2 - g_prngd.next(0.4);

            vec3.scale(LTMP_VEC3C,
                vec3.normalize(LTMP_VEC3B,
                    vec3.set(LTMP_VEC3B, rx * (wx - this.obj.x), ry * (wy - this.obj.y), rz * (wz - this.obj.z)),
                     ),
                4);

            vec3.scale(LTMP_VEC3A, LTMP_VEC3B, 90);

            bld.appear(this.obj.x + LTMP_VEC3A[0], this.obj.y + LTMP_VEC3A[1], this.obj.z + LTMP_VEC3A[2],
                quat.identity(LTMP_QUATA));

            quat.copy(bld.iobj.quat, quat.fromEuler(LTMP_QUATA, g_prngd.next(180), g_prngd.next(180), g_prngd.next(180)));

            bld.xvel = LTMP_VEC3C[0];
            bld.yvel = LTMP_VEC3C[1];
            bld.zvel = LTMP_VEC3C[2];

            bld.xrot = 1 - g_prngd.next(2.0);
            bld.yrot = 1 - g_prngd.next(2.0);
            bld.zrot = 1 - g_prngd.next(2.0);

            this.hittime = g_prngd.next(60) + 30;
        }
    }
}

class BoulderBase extends ThingBase {
    constructor(scancolor)
    {
        super(scancolor);
        this.born = 10;

        this.xvel = 0;
        this.yvel = 0;
        this.zvel = 0;
        this.xrot = 0;
        this.yrot = 0;
        this.zrot = 0;

        this.bangsize = 40;

    }
    appear(x, y, z, q)
    {
        super.appear(x, y, z, q);
        this.exists = true;
        return true;
    }
    process(delta)
    {
        if(this.born > 0) {
            if(this.born > delta)
                this.born -= delta;
            else
                this.born = 0;
        }
        
        this.obj.move(this.xvel * delta, this.yvel * delta, this.zvel * delta);
        this.iobj.rotate(this.xrot * delta, this.yrot * delta, this.zrot * delta);
        this.obj.procpos();
        this.moverelpos();
    }

    hitme(what)
    {
        if(this.born == 0) {
            let num = g_prng.next(4) + 2;

            if(lScene.asteroid.ishermit) {
                for(let i = 0; i < num; i++) {
                    if(g_prngd.next(3) < 2) {
                        let rock = lScene.rocks.next();
                        rock.appear(this.obj.x + (0.15 - g_prngd.next(0.3)),
                                    this.obj.y + (0.15 - g_prngd.next(0.3)),
                                    this.obj.z + (0.15 - g_prngd.next(0.3)));
                        rock.obj.rotate(g_prngd.next(LR180), g_prngd.next(LR180), g_prngd.next(LR180));
                        rock.what = lScene.commander.lgl_gettreasure(20, g_prngd.next(100));
                    } else {
                        let cargo = lScene.cargos.next();
                        cargo.appear(this.obj.x + (0.15 - g_prngd.next(0.3)),
                                    this.obj.y + (0.15 - g_prngd.next(0.3)),
                                    this.obj.z + (0.15 - g_prngd.next(0.3)));
                        cargo.obj.rotate(g_prngd.next(LR180), g_prngd.next(LR180), g_prngd.next(LR180));
                        cargo.what = lScene.commander.lgl_gethermitcargo(g_prng);
                    }
                }
            } else {
                for(let i = 0; i < num; i++) {
                    let rock = lScene.rocks.next();
                    rock.appear(this.obj.x + (0.15 - g_prngd.next(0.3)),
                                this.obj.y + (0.15 - g_prngd.next(0.3)),
                                this.obj.z + (0.15 - g_prngd.next(0.3)));
                    rock.obj.rotate(g_prngd.next(LR180), g_prngd.next(LR180), g_prngd.next(LR180));
                    rock.what = lScene.commander.lgl_gettreasure(5, g_prngd.next(100));
                }
            }
            this.explode();
        }
    }
}

class PersonBase extends ThingBase {
    constructor(scancolor)
    {
        super(scancolor);
        this.alloys = 2;
        this.lasered = 0;       // Countdown from laser
        this.cargospill = 0;
        this.isauto = false;
        this.ispark = false;
        this.canparkreset = false;
        this.autoobj = null;
        this.parkobj = null;
        if(lScene.station !== null) {
            this.autoobj = new Autodock(this, lScene.station);
            this.parkobj = new Parked(this, lScene.station);
        }
        this.acceleration = 5;
        this.ishyper = false;
        this.isgalactic = false;
        this.isescape = false;
        this.hypertimer = 0.0;
        this.hyperseconds = 0.0;
        this.laserdamage = 10;
        this.lasercapacity = 1;     // Amount of capacity laser has
        this.lasermaxcapacity = 1;     // Max capacity of laser
        this.worth = 1;
        this.laserrapid = 0.25;            // Amount of time between "shots"
        this.laserlast = 0.0;

        this.rechargerate = 1;

        this.scoop = false;
        this.cargo_capacity = 20;
        this.cargo_used = 0;

        this.ecm = false;

        this.misstarget = null;

        this.istarget = false;
        this.isarmed = false;
        this.isprimed = false;

        this.radar = new RadarBeam(this);

        this.inrange = false;

        this.waypoint = vec3.create();
        this.waypsens = 20;
        this.bounty = 0;
        this.ship = this;
        this.lockcolor = [1.0, 0.8, 0.8, 1.0];
        this.isinnocent = false;        // True if can shoot people

        this.ecmdelay = 0;

        this.ship = this;       // Makes life easier here
        this.wing = null;       // The wing I belong to

        this.escapeind = false;
    }

    newme() { }

    disappear()
    {
        if(this === lScene.cockpit.misstarget) {
            lScene.cockpit.untargetmissile();
        }
        super.disappear();
    }

    postinit()
    {
        this.obj.mkvisible(false);
        this.scan.mkvisible(false);
        this.exists = false;
    }
    canpickup()
    {
        return this.scoop;
    }

    pickup(what)
    {
        if(!what.exists) return;
        // First, see if cargo underneath
        if(vec3.transformMat4(LTMP_VEC3A, what.obj.getVec(LTMP_VEC3A), this.invposition)[1] >= 0) {
            return false;
        } else if(this.cargo_used >= this.cargo_capacity) {
            this.domessage("Insufficient cargo space");
            return false;
        } else {
            if(this instanceof CockpitBase) {
                this.domessage(this.commander.lgl_cargoadd(what.what));
                g_ass.pickup.play();
            }
            what.disappear();
            this.cargo_used += 1;
            return true;
        }
    }

    parkappear(x, y, z, q)
    {
       super.appear(x, y, z, q);
    }


    hypermessage() {}
    escapemessage() {}

    hypergo() 
    {
        this.disappear();
    }

    escapego()
    {
        let esc = lScene.escapes.next();
        esc.appear(this.obj.x, this.obj.y, this.obj.z);
        let vec = vec3.normalize(lScene.jumpvec);
        vec[0] = 0 - vec[0];
        vec[1] = 0 - vec[1];
        vec[2] = 0 - vec[2];

        esc.xvel = vec[0] * 5;
        esc.yvel = vec[1] * 5;
        esc.zvel = vec[2] * 5;
    }

    hitme(what)
    {
        let ship = what.ship;

        if(ship instanceof PersonBase) {
            if(lScene.issafe) {
                ship.maketerrorist();
                lScene.callpolice(what.ship);
            } else {
                if((!this.isnocrime) && (!ship.isinnocent)) {
                    lScene.callpolice(what.ship);
                    ship.addcrime(what.damage);
                }
            }
        }

        this.shields -= (what.damage + g_prngd.next(what.damage));
        if(this.shields < 0) {
            this.integrity += (this.shields - g_prngd.next(what.damage));
            this.shields = 0;
            if(this.integrity < 0) {
                this.integrity = 0;
                this.beenhit(what);
                return;
            }
        }
    }

    addcrime(damage)
    {
        this.bounty += damage / 10;
        if(this.bounty > 10) this.bounty = 10;
        this.isnocrime = true;
    }

    maketerrorist()
    {
        this.bounty = 10;
        this.isterrorist = true;
        this.isnocrime = true;
    }
    lock()
    {
        if(!(this.islocking)) {
            if(lScene.numlocks == 0) {
                if(!lScene.issafe)
                    lScene.cockpit.switchletter("l");
            }
            lScene.numlocks += 1;
            this.islocking = true;
        }
    }
    setlock()
    {
        this.wantlocking = true;
        this.scan.setcolor(this.lockcolor);
    }

    unlock()
    {
        if(this.islocking) {
            lScene.numlocks -= 1;
            this.islocking = false;
            if(lScene.numlocks == 0) {
                if(!lScene.issafe)
                    lScene.cockpit.switchletter("n");
            }
        }
    }

    setunlock()
    {
        this.wantlocking = false;
        this.scan.setcolor(this.scan.scancolor);
    }

    hyperspace()
    {
        this.ishyper = true;
        this.hypertimer = 15;
        this.hyperseconds = 15;
        this.isauto = false;
        this.autophase = 0;
    }
    
    galactic()
    {
        this.ishyper = true;
        this.isgalactic = true;
        this.hypertimer = 20;
        this.hyperseconds = 20;
        this.isauto = false;
        this.autophase = 0;
    }

    escapepod()
    {
        this.ishyper = true;
        this.isescape = true;
        this.hypertimer = 1;
        this.hyperseconds = 1;
        this.isauto = false;
        this.autophase = 0;
    }
    

    autodock()
    {
        if(this.autoobj !== null)
            if(!this.isauto) 
                this.autoobj.autodock();
    }
    land(station)
    {
        if(this.ispark) {
            return this.parkobj.ok;
        } else {
            this.parkobj.land(this.obj.position);
            if(!this.parkobj.ok) {
                 return false;
            }
            this.isauto = false;

            if(this instanceof CockpitBase) {
                /*
                lScene.keys.go_forward = false;
                lScene.keys.go_back = false;
                lScene.keys.pitch_up = false;
                lScene.keys.pitch_down = false;
                lScene.keys.roll_clock = false;
                lScene.keys.roll_anti = false;
                */
                this.stopdust();
                g_ass.danube.stop();
            }
            this.ispark = true;
            return true;
        }
    }
    rprocess(delta, keys)
    {
        // Process things

        // Delta amount of energy
        // If lasers required, use that first

        if(this.laserlast > 0) {
            if(this.laserlast > delta)
                this.laserlast -= delta;
            else
                this.laserlast = 0;
        }

        let energy = delta * this.rechargerate;

        if(this.lasercapacity <  this.lasermaxcapacity) {
            this.lasercapacity += delta;
            if(this.lasercapacity > this.lasermaxcapacity) {
                energy = this.lasercapacity - this.lasermaxcapacity;
                this.lasercapacity = this.lasermaxcapacity;
            } else {
                energy -= delta;
            }
        }

        // Next do shields

        if(energy > 0) {
            if(this.shields  < this.maxshields) {
                this.shields += energy;
                if(this.shields > this.maxshields) {
                    energy = this.shields - this.maxshields;
                    this.shields = this.maxshields;
                } else {
                    energy = 0;
                }
            }

            // Last do integrity 

            if(energy > 0) {
                if(this.integrity < this.maxintegrity) {
                    this.integrity += energy;
                    if(this.integrity > this.maxintegrity) this.integrity = this.maxintegrity;
                }
            }
        }
        if(this instanceof CockpitBase) {
            this.displasers();
            this.dispintegrity();
        }

        if(this.ecmdelay > 0) {
            if(delta > this.ecmdelay)
                this.ecmdelay = 0;
            else
                this.ecmdelay -= delta;
        }

        if(keys.pitch_up) {
            this.velpitch += delta * this.accelpitch;
            if(this.velpitch > this.maxvelpitch) this.velpitch = this.maxvelpitch;
        } else {
            if(this.velpitch > 0) {
                this.velpitch -= delta * this.accelpitch;
                if(this.velpitch < 0) this.velpitch = 0;
            }
        }
            
        if(keys.pitch_down) {
            this.velpitch -= delta * this.accelpitch;
            if(this.velpitch < -this.maxvelpitch) this.velpitch = -this.maxvelpitch
        } else {
            if(this.velpitch < 0) {
                this.velpitch += delta * this.accelpitch;
                if(this.velpitch > 0) this.velpitch = 0;
            }
        }

        if(keys.roll_anti) {
            this.velroll += delta * this.accelroll;
            if(this.velroll > this.maxvelroll) this.velroll = this.maxvelroll
        } else {
            if(this.velroll > 0) {
                this.velroll -= delta * this.accelroll;
                if(this.velroll < 0) this.velroll = 0;
            }
        }
            
        if(keys.roll_clock) {
            this.velroll -= delta * this.accelroll;
            if(this.velroll < -this.maxvelroll) this.velroll = -this.maxvelroll
        } else {
            if(this.velroll < 0) {
                this.velroll += delta * this.accelroll;
                if(this.velroll > 0) this.velroll = 0;
            }
        }

        if(keys.do_fire) {
            if(!(this.ishyper) && (!(this.isauto))) {
                if(this.lasermaxcapacity == 0)
                    this.domessage("No lasers mounted");
                else
                    lScene.firelaser(this, delta);
            }
        }

        if(keys.do_target)
        {
            if(!(this.ishyper) && (!(this.isauto))) {
                this.targetmissile();
            }
        }

        if(keys.do_untarget)
        {
            this.untargetmissile();
        }

        if(keys.do_ecm) this.fireecm();

        if(keys.do_missfire) this.missfire();

    }

    manoeuver(delta, keys, away, waypsens)
    {

        keys.roll_clock = false;
        keys.roll_anti = false;
        keys.pitch_up = false;
        keys.pitch_down = false;
        keys.go_forward = false;
        keys.go_back = false;

        const mrelpos = vec3.transformMat4(this.mrelpos,  away, this.invposition)     // How "other" looks from "me"
    
        let x = mrelpos[0];
        let y = mrelpos[1];
        let z = mrelpos[2];

        let tdist = Math.hypot(x, y, z);
        if(tdist < 1 && this.velocity < 1) {
            return;
        }
        let velroll = this.velroll;
        let toroll = 0;

        let xp = Math.abs(x);
        let yp = Math.abs(y);
        let zp = Math.abs(z);

        if(xp > zp / waypsens) {
            if(y > 0) {
                toroll = -Math.atan(x / y);
            } else if (y < 0) {
                toroll = Math.atan(x / y);
            } else {
                toroll = LR90;
            }
            if(Math.sign(toroll) != Math.sign(velroll) || velroll * velroll < Math.abs(toroll * this.accelroll)) {
                if(x > 0) keys.roll_clock = true;
                if(x < 0) keys.roll_anti = true;
            }
        }
        if(z >= 0)
        {
            if(y >= 0) keys.pitch_up = true;
            if(y < 0) keys.pitch_down = true;
        }
        else
            {
            if(yp >= zp / (2 * waypsens)) {
                let velpitch = this.velpitch;
                let topitch = -Math.abs(Math.atan(y / z));
                if(Math.abs(velroll) < 0.1 && (Math.abs(toroll)  < LR90 / 2) && (Math.sign(velpitch) != Math.sign(y) || velpitch * velpitch < Math.abs(2 * topitch * this.accelpitch))) {
                    if(y > 0) keys.pitch_up = true;
                    if(y < 0) keys.pitch_down = true;
                }
            }
                // if(this.radar.ping(away[0], away[1], away[2], 500) === null)
            let hit = this.radar.ping(away[0], away[1], away[2], 500);
            if(hit === null) {
                if(z / tdist < -0.5) {
                    keys.go_back = false;
                    keys.go_forward = true;
                } else {
                    keys.go_back = true;
                    keys.go_forward = false;
                }
                if(waystop) {
                    if(this.velocity * this.velocity >= this.acceleration * tdist / 2) {      // d = ((a ^ 2) * t ) / 2,  v = a i* t, therefore (v ^ 2)  = 2 * a * d
                        keys.go_forward = false;
                        keys.go_back = true;
                    }
                }
            } else {
                keys.go_back = true;
                keys.go_forward = false;
            }

        }
    }
    gotowayp(delta, keys, away, waypsens, waystop)
    {

        keys.roll_clock = false;
        keys.roll_anti = false;
        keys.pitch_up = false;
        keys.pitch_down = false;
        keys.go_forward = false;
        keys.go_back = false;

        const mrelpos = vec3.transformMat4(this.mrelpos,  away, this.invposition)     // How "other" looks from "me"
    
        let x = mrelpos[0];
        let y = mrelpos[1];
        let z = mrelpos[2];

        let tdist = Math.hypot(x, y, z);
        if(tdist < 1 && this.velocity < 1) {
            return;
        }
        let velroll = this.velroll;
        let toroll = 0;

        let xp = Math.abs(x);
        let yp = Math.abs(y);
        let zp = Math.abs(z);

        if(xp > zp / waypsens) {
            if(y > 0) {
                toroll = -Math.atan(x / y);
            } else if (y < 0) {
                toroll = Math.atan(x / y);
            } else {
                toroll = LR90;
            }
            if(Math.sign(toroll) != Math.sign(velroll) || velroll * velroll < Math.abs(toroll * this.accelroll)) {
                if(x > 0) keys.roll_clock = true;
                if(x < 0) keys.roll_anti = true;
            }
        }
        if(z >= 0)
        {
            if(y >= 0) keys.pitch_up = true;
            if(y < 0) keys.pitch_down = true;
        }
        else
            {
            if(yp >= zp / (2 * waypsens)) {
                let velpitch = this.velpitch;
                let topitch = -Math.abs(Math.atan(y / z));
                if(Math.abs(velroll) < 0.1 && (Math.abs(toroll)  < LR90 / 2) && (Math.sign(velpitch) != Math.sign(y) || velpitch * velpitch < Math.abs(2 * topitch * this.accelpitch))) {
                    if(y > 0) keys.pitch_up = true;
                    if(y < 0) keys.pitch_down = true;
                }
            }
                // if(this.radar.ping(away[0], away[1], away[2], 500) === null)
            let hit = this.radar.ping(away[0], away[1], away[2], 500);
            if(hit === null) {
                if(z / tdist < -0.5) {
                    keys.go_back = false;
                    keys.go_forward = true;
                } else {
                    keys.go_back = true;
                    keys.go_forward = false;
                }
                if(waystop) {
                    if(this.velocity * this.velocity >= this.acceleration * tdist / 2) {      // d = ((a ^ 2) * t ) / 2,  v = a i* t, therefore (v ^ 2)  = 2 * a * d
                        keys.go_forward = false;
                        keys.go_back = true;
                    }
                }
            } else {
                keys.go_back = true;
                keys.go_forward = false;
            }

        }
    }
    fireecm()
    {
        if(this.ecmdelay > 0) {
            if(this.ecmdelay < 8)
                this.domessage("ECM just fired - please wait");
            return false;
        }
        if(this.integrity > ECM_ENERGY) {
            this.integrity -= ECM_ENERGY;
            lScene.doecmfield();
            this.ecmdelay = ECM_DELAY;
            return true;
        } else {
            this.domessage("Insufficinet energy for ECM");
            return false;
        }
        return false;
    }
}
    

class NPCBase extends PersonBase {
    constructor(scancolor)
    {
        if(!scancolor) scancolor = [1.0, 1.0, 0.0, 1.0];        // Ships are yellow
        super(scancolor);
    
        this.wkeys = {
            pitch_up: false,
            pitch_down: false,
            roll_clock: false,
            roll_anti: false,
        };
    
        // Planning
    
        this.angryat = null;     // Who I want to kill
        this.mdirection = vec3.create();
        this.odirection = vec3.create();
        this.istoaway = false;          // Going to disappear to hyperspace
        this.orelpos = vec3.create();  // Vector from other to me
        this.mrelpos = vec3.create();  // Temporary position
        this.mlookingat = vec3.create();  // Normalised Vector from me to other
        this.olookingat = vec3.create();  // Normalised Vector from other to me

        this.pingobj = new LVirtObject(this, 0, 0, 0, 0);
    
        this.rtimeout = 0;              // A timeout for boosting
    
        this.bravery = g_prngd.next(1.0);                // How brave are we feeling today?
        this.ftoonear = FTOONEAR * (1.0 - this.bravery);
        this.isattack = false;
        this.isrunaway = false;
        this.isagressive = false;

        this.iscoward = false;  // If set to True - does not fight

        this.ischarge = true;           // Charge towards target

        this.prog1 = 0.0;   // Arbitary timers for escape
        this.key1 = 0.0;
        this.prog2 = 0.0;
        this.key2 = 0.0;

        this.keyesc = (g_prng.next(2) * 2) - 1;

        this.isafterlaunch = 0;     // Which wayb to go after launch

        this.isnocrime = false;     // Not a crime to hit 

        if(g_prngd.next(1) < 0.1)
            this.hasecm = true;
        else
            this.hasecm = false;

        this.tempships = [];

        this.hasescapepod = false;
        if(g_prngd.next(10) < 1) this.hasescapepod = true;

        switch(g_prng.next(9)) {
        case 0:
        case 1:
        case 2:
        case 3:
            this.laserdamage = 10;
            this.lasercapacity = 1;
            this.worth = 1;
            break;
        case 4:
        case 5:
        case 6:
            this.laserdamage = 5;
            this.lasercapacity = 5;
            this.worth = 2;
            break;
        case 7:
            this.laserdamage = 13;
            this.lasercapacity = 3;
            this.worth = 3;
            break;
        case 8:
            this.laserdamage = 20;
            this.lasercapacity = 2;
            this.worth = 4;
            break;
        }
        this.lasermaxcapacity = this.lasercapacity;     // Max capacity of laser
    }

    postinit()
    {
        if(this.nummissiles == 0)
            this.loadmissiles = 0;
        else
            this.loadmissiles = g_prng.next(this.nummissiles);
        super.postinit();
    }
    seerange(ind)
    {
        if(ind || this.ispark || this.isauto) {
            if(!this.inrange) {
                this.inrange = true;
                this.wing.numinrange += 1;
            }
        } else {
            if(this.inrange) {
                this.inrange = false;
                this.wing.numinrange -= 1;
            }
        }
        if(this.wing.numinrange <= 0) this.wing.disappear();
    }

    beenhit(resp)
    {
        if(resp.ship instanceof CockpitBase) {
            if(lScene.commander.lgl_score(this.worth))
            {
                setTimeout(function() {lScene.player.domessage("Right on commander!");}, 3)
            }
            if(this.bounty) {
                resp.ship.recbounty(this);
            }
        }


        var nc = g_prngd.next(this.cargospill);
        for(var i = 0; i < nc; i++)
            lScene.gencargo(this.obj.x, this.obj.y, this.obj.z);
        nc = g_prngd.next(this.alloys) + 1;
        for(var i = 0; i < nc; i++)
             lScene.genalloy(this.obj.x, this.obj.y, this.obj.z);
        super.beenhit();
    }

    think()
    {
        var other = this.angryat;   // This will not be null here

        // Can I read the other's mind
        if(other.thought) {
            if(other.angryat === this) {
                this.sdistance = other.sdistance;
                vec3.copy(this.odirection, other.mdirection);
                vec3.copy(this.mdirection, other.odirection);
                vec3.copy(this.mrelpos, other.orelpos);
                vec3.copy(this.orelpos, other.mrelpos);
                return;
            }
        }

        // Need to work it out myself
        
        // Which way am I looking
        var oobj = other.obj;
        var mobj = this.obj;

        const mrelpos = vec3.transformMat4(this.mrelpos, oobj.getVec(this.mrelpos), this.invposition);     // How "other" looks from "me"
        const orelpos = vec3.transformMat4(this.orelpos, mobj.getVec(this.orelpos), other.invposition);     // How "me" looks from "other"

        this.sdistance = Math.hypot(oobj.x - mobj.x, oobj.y - mobj.y, oobj.z - mobj.z);

        vec3.normalize(this.mlookingat, mrelpos);   // Direction of "other" from "me"
        vec3.normalize(this.olookingat, orelpos);   // Direction of "me " from "other"

        this.thought = true;

    }

    plan(delta, keys)
    {
        const self = this;

        // Escaping
        if(this.escapeind) return;

        // If being chased by a missile - RUNAWAY
        if(this.chasingmissile) {
            if(this.chasingreact > 0) {
                this.chasingreact -= delta;
            } else {
                let chit = false;
                if(this.hasecm) chit = this.fireecm();
                if(!chit) {
                    if(this.wantlocking) {
                        this.setunlock();
                        this.unlock();
                        this.isattack = false;
                    }
                    
                    const chasobj = this.chasingmissile.obj;
                    const away = vec3.scale(LTMP_VEC3A, vec3.transformMat4(LTMP_VEC3A, vec3.set(LTMP_VEC3A, chasobj.x, chasobj.y, chasobj.z), this.invposition), -100);
                    self.gotowayp(delta, keys, away, 10, false);
                    return;
                }
            }
        }

        if(this.isagressive) {
            if(!this.isattack) {
                if(this.shields + this.integrity > this.maxintegrity) {
                    this.isattack = true;
                    this.isrunaway = false;
                    this.setlock();
                }
            }
        }

        if(!this.angryat) return;
        if(!(this.angryat.exists)) {
            if(this.angryat.wing) {
                if(this.wing) {
                    if(!this.wing.chooseangry(this.angryat.wing)) {
                        this.angryat = null;
                        return;
                    }
                } else {
                    if(!this.chooseangry(this.angryat.wing)) {
                        this.angryat = null;
                        return;
                    }
                }
            } else {
                this.angryat = null;
                return;
            }
        }

        // Plan isattack  or isrunaway

        // To isattack, got to what you are angry at less 100 M and fire away

        function _moveto()
        {
            const oobj = self.angryat.obj;
            const qdir = self.angryat.obj.quat;

            vec3.set(self.waypoint, oobj.x, oobj.y, oobj.z);

            let awayvel = self.angryat.velocity * self.olookingat[2]; 

            self.gotowayp(delta, keys, self.waypoint, 100, (awayvel > 5));
        }

        // Running away - full steam in any direction -

        function _moveaway()
        {
            keys.go_forward = true;

            self.pingobj.setPosition(self.obj.x, self.obj.y, self.obj.z);

            let hit = false;

            if(self.prog1 <= 0) {
                self.prog1 = g_prngd.next(2.0);
                self.key1 = g_prng.next(3) - 1;
            }
            if(self.prog2 <= 0) {
                self.prog2 = g_prngd.next(2.0);
                if(g_prngd.next(1) < 0.5) {
                    self.key2 = g_prng.next(3) - 1;
                } else {
                    self.key2 = 0;
                }
            }

            self.prog1 -= delta;
            self.prog2 -= delta;
            
            function _cback(cob)
            {
                if(cob === self.obj) return;
                hit = true;
            }

            vec3.transformQuat(LTMP_VEC3A, vec3.set(LTMP_VEC3A, 0, 0, -200), self.obj.quat);
            self.pingobj.moveHere(LTMP_VEC3A[0], LTMP_VEC3A[1], LTMP_VEC3A[2]);

            lScene.lCAllPointDetect(self.pingobj, 10, _cback);

            if(hit) {
                if(self.keyesc > 0)
                    keys.pitch_up = true;
                else
                    keys.pitch_down = true;
            } else {
                if(self.key2 > 0)
                    keys.pitch_up = true;
                else if(self.key2 < 0)
                    keys.pitch_down = true;
                if(self.key1 > 0)
                    keys.roll_clock = true;
                else if(self.key1 < 0)
                    keys.roll_anti = true;
            }
        }

        this.think();

        const sdistance = this.sdistance;
        const mlookingat = this.mlookingat

        if(this.isattack) {                       // ATTACK
            if(sdistance > FTURN) {        // If more than optimal distance, always go to, possibly firing
                if(!this.ischarge) this.ischarge = true;
                _moveto();
                if(mlookingat[2] < 0) {
                    keys.go_forward = true;
                    if(sdistance <= FCANFIRE) {
                        if(mlookingat[2] < -0.95) keys.do_fire = true;
                    }
                } else {
                    keys.go_back = true;
                }
            } else if(sdistance > FOPTIMAL) {        // If more than optimal distance, always go to, possibly firing
                if(this.ischarge) {
                    _moveto();
                    if(mlookingat[2] < 0) {
                        keys.go_forward = true;
                        if(mlookingat[2] < -0.95) keys.do_fire = true;
                    } else {
                        keys.go_back = true;
                    }
                } else {
                    _moveaway();
                }
            } else if(sdistance > this.ftoonear) {        // Not too near
                // Look at other 

                if (this.olookingat[2] < mlookingat[2] - this.bravery) {  // He is looking at me more than I him :-(
                    this.ischarge = false;
                    _moveaway();
                    /* Boost out */ ;
                } else {
                    _moveto();
                    keys.go_back = true;
                    if(mlookingat[2] < -0.95) keys.do_fire = true;
                }
            } else {
                _moveaway();
            }
        }
        if(this.isrunaway) {
            _moveaway();
            if(this.loadmissiles > 0) {
                if(g_prngd.next(this.integrity / this.maxintegrity) < (delta * 0.1 * this.loadmissiles)) {
                    this.misstargfire(this.angryat);
                    this.angryat.missmess(true);
                    this.loadmissiles -= 1;
                }
            }
            if(this.hasescapepod) {
                if(!this.isescape) {
                    if(this.shields + this.integrity <= 20) this.escapepod();
                }
            }
        }
    }

    getthoughts(other)
    {
        if(other === this.angryat) {
            if(other.thought) {
                if(other.angryat === this) {
                    this.sdistance = other.sdistance;
                    this.odirection = other.mdirection;
                    this.mdirection = other.odirection;
                    this.odot = other.mdot;
                    return true;
                }
            }
        }
        return false;
    }


    process(delta)
    {

        if(!this.exists) return;
        var keys = {};

        if(this.isauto) {
            this.autoobj.process(delta, keys);
        } else if (this.istoaway) {
            if(Math.hypot(this.obj.z, this.obj.y, this.obj.z) > 500) {
                this.istoaway = false;
                this.disappear();
                return;
            }
            if(!this.ispark)
                this.gotowayp(delta, keys, this.waypoint, 20, false);
        } else if (this.isafterlaunch != 0) {
            // Up or down until pointing in correct direction
            const mrelpos = vec3.transformMat4(this.mrelpos, this.waypoint, this.invposition);
            if((this.obj.x * this.obj.x) + (this.obj.y * this.obj.y) > 400) {
                if(this instanceof PoliceBase)
                    this.istoaway = false;
                else
                    this.istoaway = true;
                this.isafterlaunch = 0;
            } else {
                keys.go_forward = true;
                if(Math.abs(mrelpos[1]) > Math.abs(mrelpos[2])) {
                    if(this.isafterlaunch > 1) {
                        keys.pitch_up = true;
                    } else {
                        keys.pitch_down = true;
                    }
                }
            }
        }
            
        if(this.ishyper) {
            if(this.isescape) {
                if(!this.escapeprocess(delta)) return;
            } else {
                if(!this.hyperprocess(delta)) return;
            }
        }

        this.plan(delta, keys);

        this.rprocess(delta, keys);

        if(keys.go_forward) {
            this.velocity += delta * this.acceleration ;
            if (this.velocity > this.maxvelocity)
                this.velocity = this.maxvelocity;
        }
        if(keys.go_back) {
            this.velocity -= delta * this.acceleration;
            if(this.velocity < 0)
                this.velocity = 0;
        }

        this.procmove(delta);

        this.moverelpos();
        if(this.ispark) {        // In a station
            this.parkobj.process(delta);
            this.obj.procpos();
            mat4.invert(this.invposition, this.obj.position);
            if(keys.do_front) {
                this.parkobj.launch();
            }
            return;
        }
    }
    hitme(what)
    {
        super.hitme(what);
        if(this.angryat != what.ship) {
            if(this.angryat) {
                if(this.isattack && (!(this.angryat.isattack))) {
                    this.wing.mkangry(what.ship);
                }
            } else {
                this.wing.mkangry(what.ship);
            }
        }

        if(this.shields <= 0) {
            this.isattack = false;
            this.isrunaway = true;
            this.setunlock();
            this.unlock();
        }
    }

    appear(x, y, z, q)
    {
        if(!(this.exists)) {
            this.obj.moveHere(x, y, z);
            this.obj.warp();
            let see = lScene.lCPointDetect(this.obj, 10);
            if(see !== null) return false;
            super.appear(x, y, z, q);

            if(this.bounty > 0) {
                this.isnocrime = true;
            } else {
                this.isnocrime = false;
            }

            if(this.nummissiles == 0)
                this.loadmissiles = 0;
            else
                this.loadmissiles = g_prng.next(this.nummissiles);
        }
        this.angryat = null;
        this.isattack = false;
        this.isrunaway = false;
        this.setunlock();
        this.unlock();
        this.ecmdelay = 0;
        return true;
    }
    iswanted()
    {
        return this.bounty > 0;
    }
    isfugitive()
    {
        return this.wing.wingtype == EPIRATE;
    }

    misstargfire(target)
    {
        lScene.missiles.next().fire(this, target);
    }

    hyperprocess(delta)
    {
        this.hypertimer -= delta;
        if(this.hypertimer >= 0) {
            if(this.hypertimer < this.hyperseconds) {
                this.hypermessage();
                this.hyperseconds -= 1.0;
            }
        } else {
            this.hypertimer = 0.0;
            this.hypergo();
            return false;
        }
        this.obj.procpos();
        return true;
    }

    escapeprocess(delta)
    {
        this.hypertimer -= delta;
        if(this.hypertimer >= 0.0) {
            if(this.hypertimer < this.hyperseconds) {
                this.escapemessage();
                this.hyperseconds -= 1.0;
            }
            this.obj.procpos();
        } else if(!this.escapeind) {
            this.escapeind = true;
            this.hasescapepod = false;
            let esc = lScene.escapes.next();
            esc.appear(this.obj.x, this.obj.y, this.obj.z);
        }
        return true;
    }

    chooseangry(wing)
    {
        // Make this ship angry at one of the ships of the wing
        if(wing.wingtype == ESOLO) {
            if(wing.ship.exists) {
                this.mkangry(wing.ship);
                return true;
            } else {
                return false;
            }
        } else {
            this.tempships.length = 0;
            let num = 0;
            for(let ship of wing.ships) {
                if(ship.exists) {
                    this.tempships.push(ship);
                    num += 1;
                }
            }
            if(num == 0) {
                return false;
            } else {
                this.mkangry(this.tempships[g_prng.next(num)]);
                return true;
            }
        }
    }

    mkangry(ship)
    {
        if(this.wing !== ship.wing) {
            this.angryat = ship;
            if(this.iscoward) {
                this.isagressive = false;
                this.isattack = false;
                this.isrunaway = true;
            } else {
                this.isagressive = true;
                this.isattack = true;
                this.isrunaway = false;
            }
        }
    }
}

class JohnDoeBase extends NPCBase {
    constructor(scancolor) {
        super(scancolor);
    }
}

class PoliceBase extends NPCBase {
    constructor(scancolor)
    {
        super([0.5, 0.5, 1.0, 1.0]);
        this.lockcolor = [0.5, 0.5, 1.0, 1.0];
        this.hasecm = true;
        this.isagressive = true;

        this.laserdamage = 20;
        this.lasercapacity = 2;     // Amount of capacity laser has
        this.worth = 4;
        this.lasermaxcapacity = this.lasercapacity;     // Max capacity of laser
        this.laserrapid = 0.25;            // Amount of time between "shots"
        this.maxvelocity = 30;              // Police need to KICK ASS
    }
    plan(delta, keys)
    {
        super.plan(delta, keys);
        if(!this.ispark) {
            if(this.angryat && (!this.runaway)) {
                if(this.angryat.exists) {
                    if(this.loadmissiles > 0) {
                        if(g_prngd.next(this.integrity / this.maxintegrity) < (delta * 0.1 * this.loadmissiles)) {
                            this.misstargfire(this.angryat);
                            this.angryat.missmess(true);
                            this.loadmissiles -= 1;
                        }
                    }
                }
            }
        }
    }

    hitme(what)
    {
        if(what.damage < 10) return;
        super.hitme(what);
    }
    explode()
    {
        this.ishyper = false;
        this.isauto = false;
        this.autophase = 0;
        super.explode();
    }
    maketerrorist() { }
}
class BadAssBase extends NPCBase {
    constructor(scancolor)
    {
        super();
        this.hasecm = true;
        this.isagressive = true;

        this.laserdamage = 20;
        this.lasercapacity = 2;     // Amount of capacity laser has
        this.worth = 4;
        this.lasermaxcapacity = this.lasercapacity;     // Max capacity of laser
        this.laserrapid = 0.25;            // Amount of time between "shots"
        this.maxvelocity = 20;              // Same as me

        this.bravery = 0.9;
        this.ftoonear = (FTOONEAR * 0.1);
    }

    explode()
    {
        this.ishyper = false;
        this.isauto = false;
        this.autophase = 0;
        super.explode();
        if(lScene.player.missobj) lScene.player.missobj.explode(lScene, this);
    }
    hitme(what)
    {
        if(what.damage > 15) super.hitme(what);
    }
}

class ThargoidBase extends NPCBase {
    constructor()
    {
        super([1.0, 0.5, 0.5, 1.0]);
        this.isnocrime = true;
        this.numthargons = 0;
        this.maxthargons = 0;
        this.timetorelease = 0;
        this.thargons = [];
        this.laserdamage = 5;
        this.worth = 1;
        this.hasecm = true;
    }

    putback()
    {
        if(this.numthargons == 0)
            this.timetorelease = 5 + g_prng.next(5);
        this.numthargons += 1;
    }
    appear(x, y, z, q)
    {
        this.obj.mkvisible(true);
        this.obj.moveHere(x, y, z);
        quat.copy(this.obj.quat, q);
        this.obj.warp();
        this.obj.procpos();

        this.exists = true;
        this.maxthargons = 3 + g_prng.next(3);
        this.numthargons = 0;
        this.timetorelease = 5 + g_prng.next(5);

        this.isagressive = true;
        this.isattack = true;

        this.timetorelease = 5 + g_prng.next(5);
        return true;
    }
    process(delta)
    {
        if(!this.exists) return;
        if(this.numthargons < this.maxthargons) {
            if(this.timetorelease <= delta) {
                this.next_thargon()
                this.numthargons += 1;
                this.timetorelease = 5 + g_prng.next(5);
            } else {
                this.timetorelease -= delta;
            }
        }
        super.process(delta);
    }
    beenhit(what)
    {
        super.beenhit(what);
    }
    explode()
    {
        for(let thargon of this.thargons) {
            thargon.deactivate();
        }
        super.explode();
    }
    next_thargon()
    {
        let thargon = null;
        for(let thar of this.thargons) {
            if(thargon === null) {
                if(!thar.exists) {
                    thargon = thar;
                    vec3.transformMat4(LTMP_VEC3A, vec3.set(LTMP_VEC3A, -10, 0, 0), this.obj.position);
                    thargon.appear(LTMP_VEC3A[0], LTMP_VEC3A[1], LTMP_VEC3A[2], this.angryat);
                    break;
                }
            }
        }
    }
}

class ThargonBase extends NPCBase {
    constructor()
    {
        super([1.00, 0.75, 0.75, 1.0]);
        this.xvel = 0;
        this.yvel = 0;
        this.zvel = 0;
    
        this.xrot = 0;
        this.yrot = 0;
        this.zrot = 0;

        this.isnocrime = true;
        this.thargoid = null;
        this.isactive = true;
        this.laserdamage = 5;
        this.worth = 1;
        this.hasecm = true;
        this.what = EDB_T_THARGON;
    }
    process(delta)
    {

        if(this.isactive) return super.process(delta);
        if(!this.exists) return;
        if(this.born > 0) {
            if(this.born > delta) {
                this.born -= delta;
            } else {
                this.born = 0;
            }
        }
        this.obj.move(this.xvel * delta, this.yvel * delta, this.zvel * delta);
        this.iobj.rotate(this.xrot * delta, this.yrot * delta, this.zrot * delta);
        this.obj.procpos();
        this.moverelpos();
    }
        
    seecolide(ship)
    {
        // What happens if something collides with me
        if(ship instanceof PersonBase) {        //
            if(ship.canpickup()) {
                vec3.transformMat4(LTMP_VEC3A, this.obj.getVec(LTMP_VEC3A), ship.invposition);
                if(LTMP_VEC3A[1] < 0) {
                    return ship.pickup(this);
                }
            }
        }
        return false;
    }
    beenhit(what)
    {
        this.explode();
        this.thargoid.putback();
    }

    deactivate()
    {
        this.isactive = false;
        this.integrity = 10;
        this.born = 3;
        this.thargoid.numthargons -= 1;
        this.scan.setcolor([0.75, 1.00, 0.75, 1.0]);
        this.xvel = 0.7 - g_prngd.next(1.4);
        this.yvel = 0.7 - g_prngd.next(1.4);
        this.zvel = 0.7 - g_prngd.next(1.4);

        this.xrot = 1 - g_prngd.next(2.0);
        this.yrot = 1 - g_prngd.next(2.0);
        this.zrot = 1 - g_prngd.next(2.0);
    }
    appear(x, y, z, ship)
    {
        this.obj.mkvisible(true);
        this.obj.moveHere(x, y, z);
        this.obj.rotateHere(g_prngd.next(LR90), g_prngd.next(LR90),g_prngd.next(LR90));
        quat.identity(this.iobj.quat);

        this.xvel = 0;
        this.yvel = 0;
        this.zvel = 0;

        this.xrot = 0;
        this.yrot = 0;
        this.zrot = 0;

        this.obj.warp();
        this.obj.procpos();
        this.exists = true;
        this.angryat = ship;
        this.isagressive = true;
        this.isattack = true;

        return true;
    }
    process(delta)
    {
        if(!this.exists) return;
        if(this.isactive) return super.process(delta);
        this.obj.move(this.xvel * delta, this.yvel * delta, this.zvel * delta);
        this.iobj.rotate(this.xrot * delta, this.yrot * delta, this.zrot * delta);
        this.obj.procpos();
        this.moverelpos();
    }
}

class StationBase extends ThingBase {
    constructor(struct, sidestruct)
    {
        super([0.0, 1.0, 1.0, 1]);          // Station can be cyan

        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var iobj = new LObject(struct[2], this);

        this.sides = new LObject(sidestruct, this);
    
        this.green = new LObject(struct[3], this);
        this.yellow = new LObject(struct[4], this);
        this.red = new LObject(struct[5], this);
    
        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(iobj, mat4.create());
        this.obj.addChild(this.sides, mat4.create());
        this.obj.addChild(this.green, mat4.create());
        this.obj.addChild(this.red, mat4.create());
        this.obj.addChild(this.yellow, mat4.create());
    
        this.numyellow = 0;
        this.numred = 0;
        this.countdown = 0;
    
        lScene.lPlace(this.obj, mat4.create());
        this.velocity = 0;  // Between 1 and 20 (10 to 200 meters / second
        this.rz = 0;
        // Slots are 20, 30, 40,  meters wide
        // Slots are 150, 100, 60, 30, 15  long
    
        // On top
        // Front row, police (20 x 20)  12 of them
        // Followed by biggies (40 * 150) - 6 - total 170
    
        this.slots = new Slots();
    
        this.exitqueue = [];        // The exit queue
        this.entering = 0;          // Number of people entering
        this.launchnum = 0;         // Keep track of numbers of launches
        this.lights = 0;            // 0 OK, 1 Amber, 2 Red
        this.ispark = true;
        this.wantlocking = false;
        this.postinit();

        this.autoships = [];
        this.autoidx = 0;
    }

    autonextidx(ship)
    {
        let idx = this.autoships.length;
        this.autoships.push(ship);
        return idx;
    }

    autoshiftidx(iship)
    {
        // Inefficient - but complicated
        var idx = 0;
        let newships = [];
        for(let ship of this.autoships) {
            if(ship.exists && (ship != iship)) {
                ship.autoobj.autodetr(idx);
                newships.push(ship);
                idx += 1;
            }
        }
        this.autoships = newships;
    }


    appear()
    {
        if(this.exists) return;
        this.obj.mkvisible(true);
        this.scan.mkvisible(true);
        this.exists = true;
        this.obj.warp();
        this.obj.procpos();

        for(let wing of lScene.wings) {
            if(!wing.exists) {
                if(g_prng.next(2) == 0) {
                    wing.appear(true, 0, 0, 0, LTMP_QUATA);
                }
            }
        }

        /*
        for(let viper of lScene.policewing.ships) {
            let dopark = g_prng.next(6);
            if(dopark != 0) {
                viper.parkobj.park();
            }
        }
        */

        this.green.mkvisible(true);
        this.yellow.mkvisible(false);
        this.red.mkvisible(false);
        return true;
    }

    // Ship dissapears, but also all ships on it
    disappear()
    {
        if(!(this.exists)) return;
        this.obj.mkvisible(false);
        this.scan.mkvisible(false);
        this.exists = false;
        this.exitqueue.length = 0;        // The exit queue
        this.numyellow = 0;
        this.numred = 0;
        this.countdown = 0;
        this.entering = 0;          // Number of people entering
        this.launchnum = 0;         // Keep track of numbers of launches
        this.lights = 0;            // 0 OK, 1 Amber, 2 Red
        this.slots = new Slots();

        for(var thing of lScene.things) {
            if(thing !== this) {
                if(thing.ispark || thing.isauto) {
                    thing.disappear();
                    thing.ispark = false;
                    thing.isauto = false;
                }
            }
        }
    }

    seecolide(ship)
    {
        // Probably only for player
        // This either lands or crashes

        // Are we in a station?
        if(ship.ispark) return ship.parkobj.ok;

        // If red light, then No
        if(this.numred > 0) return false;

        const obj = ship.obj;
        if(obj.z < 28 || obj.x > 4 || obj.x < -4 || obj.y > 4 || obj.y < -4) return false;

        // Using station RZ - Unrotate ship and station round center

        // Unrotate this by the ship's rotation
        mat4.multiply(LTMP_MAT4A, mat4.fromZRotation(LTMP_MAT4A, -this.rz), ship.obj.position);

        const w = ship.width;
        const h = ship.height;

        function _seeclear(iw, ih)
        {
            vec3.transformMat4(LTMP_VEC3A, vec3.fromValues(iw, ih, 0), LTMP_MAT4A);
            if(LTMP_VEC3A[0] < -4 || LTMP_VEC3A[0] > 4 || LTMP_VEC3A[1] < -1.6 || LTMP_VEC3A[1] > 1.6)
                return false;
            else
                return true;
        }

        return _seeclear(w, h) && _seeclear(w, -h) && _seeclear(-w, h) && _seeclear(-w, -h);

    }

    explode() { }  // No!

    hitme(what)
    {
        super.hitme(what);
        if(what.ship instanceof CockpitBase) {
            if(lScene.issafe) {
                let ship = what.ship;
                if(!(ship.repcrime)) {
                    ship.repcrime = true;
                    ship.domessage("It is a crime to fire at the station.  It has been reported");
                }
                ship.commander.lgl_maketerrorist();
                ship.isterrorist = true;
            }
        }
    }

    process(delta)
    {
        if(!this.obj.isvisible) return;
        delta = delta * STATION_ROTATE;
        this.rz += delta;
        if (this.rz > LR180)
            this.rz -= LR360;
        this.obj.rotate(0, 0, delta);
        this.obj.procpos();

        this.moverelpos();
    }
    _showlights()
    {
        if (this.numred > 0) {
            this.green.mkvisible(false);
            this.yellow.mkvisible(false);
            this.red.mkvisible(true);
            this.red.procpos();
        } else if (this.numyellow > 0) {
            this.green.mkvisible(false);
            this.yellow.mkvisible(true);
            this.yellow.procpos();
            this.red.mkvisible(false);
        } else  {
            this.green.mkvisible(true);
            this.green.procpos();
            this.yellow.mkvisible(false);
            this.red.mkvisible(false);
        }
    }

    switchyellow(ind)
    {
        if(ind)
            this.numyellow += 1;
        else
            this.numyellow -= 1;
        this._showlights();
    }

    switchred(ind)
    {
        if(ind)
            this.numred += 1;
        else
            this.numred -= 1;
        this._showlights();
    }
    lock()
    {
        if(!(this.islocking)) {
            lScene.numlocks += 1;
            this.islocking = true;
        }
    }
    unlock()
    {
        if(this.islocking) {
            lScene.numlocks -= 1;
            this.islocking = false;
        }
    }
}
class MissileBase extends ThingBase {
    constructor (scancolor)
    {
        super(scancolor);    // Missiils deep red
    
        this.ship = null;
        this.target = null;
        this.mrelpos = vec3.create();
        this.svec = vec3.fromValues(0, -0.2, 0);
        this.curpos = vec3.create();
        this.damage = 100;
        this.velocity = 30;
        this.ttl = 60;          // Time to live
    
    }

    fire(ship, target)
    {
        this.ship = ship;
        this.target = target;
        this.ttl = 60;

        const svec = vec3.transformMat4(LTMP_VEC3A, this.svec, ship.obj.position);

        this.appear(svec[0], svec[1], svec[2], ship.obj.quat);

        if(!target.chasingmissile) {
            target.chasingmissile = this;
            target.chasingreact = g_prngd.next(1.0) + 0.5;
        }
    }

    disappear()
    {
        if(this.target) {
            if(this.target.chasingmissile == this) {
                this.target.chasingmissile = null;
            }
        }
        super.disappear();
    }
            
    process(delta)
    {
        if(!this.exists) return;
        this.ttl -= delta;
        if(this.ttl <= 0) {
            this.explode();
            this.disappear();
            this.target.missmess(false);
            return;
        }
            

        const curobj = this.obj;
        if((this.target.exists) && (!(this.target.ispark))) {

            const mrelpos = vec3.transformMat4(this.mrelpos, this.target.obj.getVec(LTMP_VEC3A), mat4.invert(LTMP_MAT4B, curobj.position));

            var x = mrelpos[0];
            var y = mrelpos[1];
            var z = mrelpos[2];

            // Get the normal

            vec3.normalize(mrelpos, mrelpos);

            // Cross for axis of rotation, and angle
            const vecnorm = vec3.cross(LTMP_VEC3A, [0, 0, -1], mrelpos);
            vec3.normalize(vecnorm, vecnorm);
            var angle = LR90 - vec3.dot(vecnorm, mrelpos);
            if(angle > delta) angle = delta;


            const amat = mat4.rotate(LTMP_MAT4A, curobj.position, angle, vecnorm);

            mat4.getRotation(curobj.quat, amat);

            
        }
        curobj.move(0, 0, -this.velocity * delta);
        curobj.procpos();
        this.moverelpos();

        var hit = false;

        var self = this;
        function _cback(cob)
        {
            if(hit) return;
            var ctl = cob.control;
            if(ctl === self.ship) return;
            hit = true;
            ctl.hitme(self);
            self.target.missmess(false);
            self.explode();
            self.disappear();
        }

        lScene.lCAllPointDetect(this.obj, 2, _cback);
    }
}
function cockpitDef(assets)
{
    const colors = [
        [0.5, 0.5, 0.5, 1.0],
        [0.0, 0.0, 0.5, 1.0],
        [1.0, 1.0, 1.0, 1.0],
        [0.47, 0.47, 0.47, 1.0],
        [0.0, 0.2, 0.2, 1.0],

        [0.0, 0.0, 0.0, 1.0],
        [0.0, 0.0, 0.0, 1.0],
        [0.0, 0.0, 0.0, 1.0],
     ];

    const grey = lTextureColor(8, 0);
    const blue = lTextureColor(8, 1);
    const white = lTextureColor(8, 2);
    const dgrey = lTextureColor(8, 3);
    const dgreen = lTextureColor(8, 4);

    let gdef = new LGroupDef({collision: LDYNAMIC, distance: 1});
    let struct = new LStructureDef(ShaderSolid, {colors: colors, collision: LNONE});
    let rstruct = new LStructureDef(ShaderCockpit, {colors:colors, collision: LNONE});
    let nrstruct = new LStructureDef(ShaderCockpit, {colors: colors, collision: LNONE, shininess: -1});
    let cross = new LStructureDef(ShaderSolid, {color: [1.0, 1.0, 1.0, 1.0], collision: LNONE});
    let stati = {
        s: assets.get("lets").load(),
        n: assets.get("letn").load(),
        j: assets.get("letj").load(),
        k: assets.get("letk").load(),
        h: assets.get("leth").load(),
        l: assets.get("letl").load(),
        w: assets.get("letw").load(),
    }

    // Cross hair
    cross.addBlockPatch({size: [.04, .001], position: lFromXYZ(0.05, 1.0, -1.5)});
    cross.addBlockPatch({size: [.04, .001], position: lFromXYZ(-0.05, 1.0, -1.5)});
    cross.addBlockPatch({size: [.001, .04], position: lFromXYZ(0, 1.05, -1.5)});
    cross.addBlockPatch({size: [.001, .04], position: lFromXYZ(0, 0.95, -1.5)});

    rstruct.addCylinder({depth: 0.1, radius: 0.3, position: lFromXYZPYR(0, -0.6, -1.5, -LR90, 0, 0), texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    nrstruct.addCylinder({depth: 0.1, radius: 0.3, position: lFromXYZPYR(0, -0.6, -1.5, -LR90, 0, 0), texturecontrol: blue, hold: [LI_SIDE, LI_BACK]});

    // Scanner grid
    struct.addBlock({size: [0.3, 0.001, 0.001], position: lFromXYZ(0, -0.4, -1.5), texturecontrol: white});
    struct.addBlock({size: [0.001, 0.001, 0.3], position: lFromXYZ(0, -.94, -1.5), texturecontrol: white});

    struct.addBlock({size: [0.001, 0.001, 0.15], position: lFromXYZPYR(0.106, -0.4, -1.606, 0, -LR90/2, 0), texturecontrol: white});
    struct.addBlock({size: [0.001, 0.001, 0.15], position: lFromXYZPYR(-0.106, -0.4, -1.606, 0, LR90/2, 0), texturecontrol: white});


    function _circle(cstruct, inner, outer, args)
    {

        let ancinner = inner * BEZCIRCLE;
        let radinner = inner;
        let ancouter = outer * BEZCIRCLE;
        let radouter = outer;
    
        let bez1 = [
            [[-radouter, 0, 0], [-radouter, ancouter, 0], [-ancouter, radouter, 0], [0, radouter, 0]],
            [[-radinner, 0, 0], [-radinner, ancinner, 0], [-ancinner, radinner, 0], [0, radinner, 0]],
        ];
        let bez2 = [
            [[0, -radouter, 0], [-ancouter, -radouter, 0], [-radouter, -ancouter, 0], [-radouter, 0, 0]],
            [[0, -radinner, 0], [-ancinner, -radinner, 0], [-radinner, -ancinner, 0], [-radinner, 0, 0]]
        ];
        let bez3 = [
            [[radouter, 0, 0], [radouter, -ancouter, 0], [ancouter, -radouter, 0], [0, -radouter, 0]],
            [[radinner, 0, 0], [radinner, -ancinner, 0], [ancinner, -radinner, 0], [0, -radinner, 0]],
        ];
        let bez4 = [
            [[0, radouter, 0], [ancouter, radouter, 0], [radouter, ancouter, 0], [radouter, 0, 0]],
            [[0, radinner, 0], [ancinner, radinner, 0], [radinner, ancinner, 0], [radinner, 0, 0]]
        ];
    
        args.coords = bez1; cstruct.addBezierBlock(args);
        args.coords = bez2; cstruct.addBezierBlock(args);
        args.coords = bez3; cstruct.addBezierBlock(args);
        args.coords = bez4; cstruct.addBezierBlock(args);
    }

    _circle(struct, 0.299, 0.301, {depth: 0.001, position: lFromXYZPYR(0, -0.4, -1.5, -LR90, 0, 0), texturecontrol: white, segments: 16});
    _circle(struct, 0.039, 0.041, {depth: 0.001, position: lFromXYZPYR(.35, -0.47, -1.5, 0, 0, 0), texturecontrol: white, segments: 16});       // Compas

    rstruct.addCylinder({depth: 0.1, radius: 0.04, position: lFromXYZPYR(.35, -0.615, -1.5, -LR90, 0, 0), texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    nrstruct.addCylinder({depth: 0.1, radius: 0.04, position: lFromXYZPYR(.35, -0.615, -1.5, -LR90, 0, 0), texturecontrol: blue, hold: [LI_SIDE, LI_BACK]});

    rstruct.addCylinder({depth: 0.1, radius: 0.04, position: lFromXYZPYR(-.35, -0.615, -1.5, -LR90, 0, 0), texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    nrstruct.addCylinder({depth: 0.1, radius: 0.04, position: lFromXYZPYR(-.35, -0.615, -1.5, -LR90, 0, 0), texturecontrol: blue, hold: [LI_SIDE, LI_BACK]});


    rstruct.addPolygonPatch({coords: [[0, 0.3], [-0.3, 0.3], [-0.6, 0.2], [-2, -0.3], [2, -0.3], [0.6, 0.2], [0.3, 0.3]], 
                position: lFromXYZPYR(0, -0.52, -1.5, -LR90, 0, 0), texturecontrol: grey})

    rstruct.addPolygonPatch({coords: [[-2, 0.02], [2, 0.02], [2, 1], [-2, 1]],  position: lFromXYZ(0, -1.52, -1.2), texturecontrol: dgrey});

    rstruct.addPolygonPatch({coords: [[-1, 0.02], [1.2, 0.02], [1.2, 1], [-1, 1]],  position: lFromXYZPYR(-2, -1.52, 0, 0, LR90, 0), texturecontrol: dgrey});
    rstruct.addPolygonPatch({coords: [[1.2, 1], [1.2, 0.02], [-1, 0.02], [-1, 1]],  position: lFromXYZPYR(2, -1.52, 0, 0, LR90, 0), texturecontrol: dgrey});


    // Upper structs
    var bez = [
        [[0.0, 1.7, 0.0], [0.0, 1.68, 0.0]],
        [[0.0, 1.7, -0.93],[0.0, 1.68, -0.91]],
        [[0.0, 0.93, -1.7],[0.0, 0.91, -1.68]],
        [[0.0, 0.0, -1.7],[0.0, 0.0, -1.68]]
    ]

    // Strait bit
    rstruct.addBlock({size: [0.01, 0.26, 0.01], position: lFromXYZ(-0.6, -0.26, -1.69), texturecontrol: grey});
    rstruct.addBlock({size: [0.01, 0.26, 0.01], position: lFromXYZ(0.6, -0.26, -1.69), texturecontrol: grey});
    // Curved bit
    rstruct.addBezierBlock({depth: .01, coords: bez, position: lFromXYZPYR(-0.6, 0, 0, 0, 0, 0), texturecontrol: grey});
    rstruct.addBezierBlock({depth: .01, coords: bez, position: lFromXYZPYR(0.6, 0, 0, 0, 0, 0), texturecontrol: grey});
    //Top straight bit
    rstruct.addBlock({size: [0.01, 0.01, 0.5], position: lFromXYZ(-0.6, 1.69, 0.5), texturecontrol: grey});
    rstruct.addBlock({size: [0.01, 0.01, 0.5], position: lFromXYZ(0.6, 1.69, 0.5), texturecontrol: grey});


    // Lower structs
    var bezi = [
        [[0.0, 0.85, 0.0], [0.0, 0.83, 0.0]],
        [[0.0, 0.85, -0.67],[0.0, 0.83, -0.65]],
        [[0.0, 0.67, -1.2],[0.0, 0.65, -1.18]],
        [[0.0, 0.0, -1.2],[0.0, 0.0, -1.18]]
    ]
    // Strait bit
    rstruct.addBlock({size: [0.01, 0.26, 0.01], position: lFromXYZ(-2.0, -0.26, -1.19), texturecontrol: grey});
    rstruct.addBlock({size: [0.01, 0.26, 0.01], position: lFromXYZ(2.0, -0.26, -1.19), texturecontrol: grey});
    // Curved bit
    rstruct.addBezierBlock({depth: .01, coords: bezi, position: lFromXYZPYR(-2.0, 0, 0, 0, 0, 0), texturecontrol: grey});
    rstruct.addBezierBlock({depth: .01, coords: bezi, position: lFromXYZPYR(2.0, 0, 0, 0, 0, 0), texturecontrol: grey});
    //Top straight bit
    rstruct.addBlock({size: [0.01, 0.01, 0.5], position: lFromXYZ(-2.0, 0.84, 0.5), texturecontrol: grey});
    rstruct.addBlock({size: [0.01, 0.01, 0.5], position: lFromXYZ(2.0, 0.84, 0.5), texturecontrol: grey});


    rstruct.addPolygonPatch({coords: [[-0.6, 2.68], [-2, 1.85], [-2, -0.5], [2, -0.5], [2, 1.85], [0.6, 2.68]], position: lFromXYZPYR(0, -1, 1, 0, LR180, 0), texturecontrol: grey});

    rstruct.addPolygonPatch({coords: [[-2, 1], [2, 1], [2, -1.2], [-2, -1.2]], position: lFromXYZPYR(0, -1.5, 0, LR90, 0, 0), texturecontrol: dgreen});

    var dust = new LStructureDef(ShaderDust, {color: [0.5, 0.2, 0.2, 0.3], collision: LNONE});
    for(var i = 0; i < 12; i++) {
        dust.addCylinder({radius: 0.05, depth: 0.7, position: lFromXYZ(3 * Math.sin(LR360 * i / 12 ), 3 * Math.cos(LR360 * i / 12 ), 0)});
    }

    var jdust = new LStructureDef(ShaderDust, {color: [0.2, 0.2, 0.8, 0.3], collision: LNONE});
    for(var i = 0; i < 20; i++) {
        jdust.addCylinder({radius: 0.03, depth: 1.5, position: lFromXYZ(3 * Math.sin(LR360 * i / 20 ), 3 * Math.cos(LR360 * i / 20 ), 0)});
    }
    var kdust = new LStructureDef(ShaderDust, {color: [0.4, 0.4, 1.0, 0.3], collision: LNONE});
    for(var i = 0; i < 30; i++) {
        kdust.addCylinder({radius: 0.015, depth: 2.2, position: lFromXYZ(3 * Math.sin(LR360 * i / 30 ), 3 * Math.cos(LR360 * i / 30 ), 0)});
    }

    // Station dots here

    let reddot = new LStructureDef(ShaderSolid, {color: [1.0, 0.5, 0.5, 1.0], collision: LNONE});
    _circle(reddot, 0.002, 0.004, {depth: 0.001});
    let greendot = new LStructureDef(ShaderSolid, {color: [0.5, 1.0, 0.5, 1.0], collision: LNONE});
    greendot.addCirclePatch({radius: 0.003, segments: 8});

    
    let hcolors = [
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [1.0, 0.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
    ]
    let hyper = new LStructureDef(ShaderSolid, {colors: hcolors, collision: LNONE});
    hyper.addCirclePatch({position: lFromXYZ(0, 0, 0), radius: 2.0, texturecontrol: lTextureColor(4, 0)});
    hyper.addCylinder({position: lFromXYZ(0, 0, -5), radius: 2.0, depth: 5, texturecontrol: lTextureColor(4, 0), insideout: true, hold: [LI_FRONT, LI_BACK]});
    hyper.addCirclePatch({position: lFromXYZ(0, 0, -10), radius: 2.0, texturecontrol: lTextureColor(4, 1)});
    hyper.addCylinder({position: lFromXYZ(0, 0, -15), radius: 2.0, depth: 5, texturecontrol: lTextureColor(4, 1), insideout: true, hold: [LI_FRONT, LI_BACK]});
    hyper.addCirclePatch({position: lFromXYZ(0, 0, -20), radius: 2.0, texturecontrol: lTextureColor(4, 2)});
    hyper.addCylinder({position: lFromXYZ(0, 0, -25), radius: 2.0, depth: 5, texturecontrol: lTextureColor(4, 2), insideout: true, hold: [LI_FRONT, LI_BACK]});
    hyper.addCirclePatch({position: lFromXYZ(0, 0, -30), radius: 2.0, texturecontrol: lTextureColor(4, 3)});

    let letter = new LStructureDef(ShaderSolidTrans, {rawtexture: stati.s, collision: LNONE});       // Any texture will do
    letter.addBlockPatch({size: [0.04, 0.04], position: lFromXYZ(-0.35, -0.47, -1.5)});

    let dials = new LStructureDef(ShaderDial, {color: [0.5, 1.0, 0.5, 1.0], collision: LNONE});
    dials.addBlockPatch({size: [0.01, 0.01], position: lFromXYZ(0.01, 0.0, 0.0)});

    let labels = new LStructureDef(ShaderSolidTrans, {rawtexture: assets.get("labels").load(), collision: LNONE});
    labels.addBlockPatch({size: [0.06, 0.06], position: lFromXYZPYR(0.44, -0.445, -1.43, 0, -LR90/4, 0), texturecontrol: new LTextureControl([2, 1], [0, 0], [1, 1])});
    labels.addBlockPatch({size: [0.06, 0.06], position: lFromXYZPYR(-0.632, -0.445, -1.336, 0, LR90/4, 0), texturecontrol: new LTextureControl([2, 1], [1, 0], [1, 1])});

    rstruct.addBlock({size: [0.17, 0.01, 0.01],  position: lFromXYZPYR(0.541, -0.529, -1.388, -LR90, 0, -LR90/4), texturecontrol: blue, hold: [LI_FRONT, LI_BACK, LI_TOP]});
    nrstruct.addBlock({size: [0.17, 0.01, 0.01], position: lFromXYZPYR(0.541, -0.529, -1.388, -LR90, 0, -LR90/4), texturecontrol: blue, hold: [LI_LEFT, LI_RIGHT, LI_TOP, LI_BOTTOM, LI_BACK]});

    rstruct.addBlock({size: [0.17, 0.01, 0.01],  position: lFromXYZPYR(-0.541, -0.529, -1.388, -LR90, 0, LR90/4), texturecontrol: blue, hold: [LI_FRONT, LI_BACK, LI_TOP]});
    nrstruct.addBlock({size: [0.17, 0.01, 0.01], position: lFromXYZPYR(-0.541, -0.529, -1.388, -LR90, 0, LR90/4), texturecontrol: blue, hold: [LI_LEFT, LI_RIGHT, LI_TOP, LI_BOTTOM, LI_BACK]});

    return [gdef, struct, rstruct, nrstruct, dust, jdust, kdust, cross, reddot, greendot, letter, stati, hyper, dials, labels];
}

class CockpitBase extends PersonBase {
    constructor()
    {
        super();

        this.shieldctrl = {
            color: [0.5, 1.0, 0.5, 1.0],
            width: 10
        }

        this.laserctrl = {
            color: [0.5, 1.0, 0.5, 1.0],
            width: 0
        }

        this.integctrl = {
            color: [0.5, 1.0, 0.5, 1.0],
            width: 10
        }

        this.integctrl2 = {
            color: [0.5, 1.0, 0.5, 1.0],
            width: 0
        }

        this.fuelctrl = {
            color: [0.5, 1.0, 0.5, 1.0],
            width: 10
        }

        this.tempctrl = {
            color: [0.1, 0.5, 0.9, 1.0],
            width: 1
        }

        this.altctrl = {
            color: [0.5, 1.0, 0.5, 1.0],
            width: 10
        }


        this.nummissiles = 0;
        this.maxmissiles = 4;

        this.temperature = 10;

        this.missdisps = [];

        for(let i = 0; i < this.maxmissiles; i++)
            this.missdisps[i] = {color: vec4.create(), width: 0};

        this.restockmiss(3);


        let struct = structures.cockpit;
        this.obj = new LWObject(struct[0], this);
        let cobj = new LObject(struct[1], this);
        let robj = new LObject(struct[2], this);
        let nrobj = new LObject(struct[3], this);
        let ndust = struct[4];
        let jdust = struct[5];
        let kdust = struct[6];
        this.pilot = new LObject(struct[7], this);
        this.reddot = new LObject(struct[8], this);
        this.greendot = new LObject(struct[9], this);
        this.letter = new LObject(struct[10], this);
        this.stati = struct[11];
        this.hyper = new LIObject(struct[12], this);
        let shields = new LObject(struct[13], this.shieldctrl);
        let lasers = new LObject(struct[13], this.laserctrl);
        let integrity = new LObject(struct[13], this.integctrl);
        let integrity2 = new LObject(struct[13], this.integctrl2);

        let fueli = new LObject(struct[13], this.fuelctrl);
        let tempi = new LObject(struct[13], this.tempctrl);
        let alti = new LObject(struct[13], this.altctrl);


        let mind = [];
        for(let i = 0; i < 4; i++) mind[i] = new LObject(struct[13], this.missdisps[i]);

        let labels = new LObject(struct[14], this);


        this.hyper.mkvisible(false);

        
        this.fixed = true;
        this.scale = 1;
        lScene.lPlace(this.obj, mat4.create());
        this.obj.addChild(cobj, mat4.create());
        this.obj.addChild(robj, mat4.create());
        this.obj.addChild(nrobj, mat4.create());
        this.obj.addChild(this.letter, mat4.create());
        this.obj.addChild(this.greendot, mat4.create());
        this.obj.addChild(this.reddot, mat4.create());

        this.obj.addChild(lasers, lFromXYZPYR(0.5, -.40, -1.4, 0, -LR90/4, 0));
        this.obj.addChild(shields, lFromXYZPYR(0.5, -.43, -1.4, 0, -LR90/4, 0));
        this.obj.addChild(integrity, lFromXYZPYR(0.5, -.46, -1.4, 0, -LR90/4, 0));
        this.obj.addChild(integrity2, lFromXYZPYR(0.5, -.49, -1.4, 0, -LR90/4, 0));

        this.obj.addChild(fueli, lFromXYZPYR(-0.574, -.40, -1.37, 0, LR90/4, 0));
        this.obj.addChild(tempi, lFromXYZPYR(-0.574, -.43, -1.37, 0, LR90/4, 0));
        this.obj.addChild(alti, lFromXYZPYR(-0.574, -.46, -1.37, 0, LR90/4, 0));

        let diffx = 0.0182;
        let diffz = 0.0076;
        for(let i = 0; i < 4; i++) {
            this.obj.addChild(mind[i], lFromXYZPYR(-0.574 + (i * diffx * 1.5), -.49, -1.37 - (i * diffz * 1.5), 0, LR90/4, 0));
        }


        this.obj.addChild(labels, mat4.create());
    
        // Pilot and eyes
        this.obj.addChild(this.pilot, lFromXYZ(0, -1, 0));
        this.eyes = new LGroup();
        this.pilot.addChild(this.eyes, lFromXYZ(0, 1, 0));

        this.pilot.procpos();

        this.obj.addChild(this.hyper, mat4.create());
        
    
        this.width = 2.2;      // Width of the ship (half)
        this.height = .5;      // Av Height of the ship (half)
    
        this.slotsize = SLOTSIZE_6_3;
        this.centerz = 0;
        this.bottom = 1.01;
    
        this.dusts = [];
        for(let i = 0; i < 4; i++) {
            let obj = new LIObject(ndust, this);
            obj.z = -i * 7;
            this.obj.addChild(obj, mat4.create());
            obj.mkvisible(false);
            obj.procpos();
            this.dusts.push(obj);
        }
        this.dustvisible = false;

        this.jdusts = [];
        for(let i = 0; i < 3; i++) {
            let obj = new LIObject(jdust, this);
            obj.z = -i * 10;
            this.obj.addChild(obj, mat4.create());
            obj.mkvisible(false);
            obj.procpos();
            this.jdusts.push(obj);
        }
        this.kdusts = [];
        for(let i = 0; i < 2; i++) {
            let obj = new LIObject(kdust, this);
            obj.z = -i * 15;
            this.obj.addChild(obj, mat4.create());
            obj.mkvisible(false);
            obj.procpos();
            this.kdusts.push(obj);
        }

        this.jdustvisible = false;
        this.direct = [0.0, 0.0, 0.0];  // Here so it does not need to reallocate
        this.cvPoint = vec3.create();   // Directional light for camera
        this.ccDir = vec3.create();     // Directional light for cockpit

        this.numlocks = 0;

        this.scoop = false;

        lScene.eyesquat = this.eyes.quat;

        this.exists = true;

        this.missmessind = 0;
        this.missmesstimer = 0.0;

        this.chasingmissile = null;
        this.chasereact = 0.0;

        this.isterrorist = false;

        this.meobj = null;
        this.merotx = 0;
        this.meroty = 0;
        this.merotz = 0;

        this.repcrime = false;
        this.tempdiff = 0;

        g_ass.alarm.stop();
    
        // No postinit
    }

    hitme(what)
    {
        super.hitme(what);
        g_ass.injured.play();
        this.shieldctrl.width = (this.shields * 10 / this.maxshields);
        this.dispintegrity();
        if(!this.isnocrime) {
            what.ship.isnocrime = true;
        }
    }

    dispintegrity()
    {
        this.shieldctrl.width = (this.shields * 10 / this.maxshields);

        if(this.maxintegrity > 199)
            this.integctrl.width = (this.integrity * 20 / this.maxintegrity);
        else
            this.integctrl.width = (this.integrity * 10 / this.maxintegrity);
        if(this.integctrl.width > 10) {
            this.integctrl2.width = this.integctrl.width - 10;
            this.integctrl.width = 10;
        } else {
            this.integctrl2.width = 0;
        }
    }

    displasers()
    {
        this.laserctrl.width = (this.lasermaxcapacity - this.lasercapacity) * 10 / this.lasermaxcapacity;
        if(this.lasercapacity > 1) {
            vec4.set(this.laserctrl.color, 0.5, 1.0, 0.5, 1.0);
        } else {
            vec4.set(this.laserctrl.color, 1.0, 0.5, 0.5, 1.0);
        }
    }

    heatdiff(sundist)
    {
        this.tempdiff = (50 / (sundist - 50)) - (sundist / 200)
    }

    heatcool(delta, sundist)
    {
        if(this.temperature == 10 && sundist > 200) return;
        this.temperature +=  delta * this.tempdiff
        if(this.temperature < 10) this.temperature = 10;
        this.tempctrl.width = (this.temperature / 10);
        if(this.temperature > 100) {
            this.temperature = 100;
            this.domessage("Too hot");
            this.crash = true;
            this.explode();
            return;
        }
        vec4.set(this.tempctrl.color, this.temperature / 100, 0.5, (100 - this.temperature) / 100, 1.0);

        if(sundist < 70) {
            if(this.scoop) {
                this.commander.lgl_fuelscoop(delta * (70 - sundist) * 0.1)
                this.fuellevel(this.commander.fuel, 7.0);
            }
        }
    }


    restockmiss(num)
    {
        this.nummissiles = num;
        let i = 0;
        for(let msd of this.missdisps) {
            if(i < num) {
                vec4.set(msd.color, 0.0, 1.0, 0.0, 1.0);
                msd.width = 1;
            } else {
                vec4.set(msd.color, 0.0, 0.0, 0.0, 0.0);
                msd.width = 0;
            }
            i += 1;
        }
        this.istarget = false;
        this.isarmed = false;
        this.isprimed = false;
        this.misstarget = null;
    }


    getscan(scancolor)
    {
        return MockScan;
    }

    /*
     * A setup is required as the station (or anything else) not created when cockpit is
     */
    setup()
    {
        if(lScene.station !== null) {
            this.autoobj = new Autodock(this, lScene.station);
            this.parkobj = new Parked(this, lScene.station);
        }
    }

    stopdust()
    {
        if(this.dustvisible) {
            for (var dust of this.dusts) dust.mkvisible(false);
            this.dustvisible = false;
        }
    }
    jstopdust()
    {
        if(this.jdustvisible) {
            for (var jdust of this.jdusts) jdust.mkvisible(false);
            for (var kdust of this.kdusts) kdust.mkvisible(false);
            this.jdustvisible = false;
        }
    }

    switchjdust()
    {
        if (lScene.inkjump) {
            for (let jdust of this.jdusts) {
                jdust.mkvisible(false);
            }
            for (let kdust of this.kdusts) {
                kdust.mkvisible(true);
            }
        } else {
            for (let jdust of this.jdusts) {
                jdust.mkvisible(true);
            }
            for (let kdust of this.kdusts) {
                kdust.mkvisible(false);
            }
        }
    }

    movedust(delta)
    {
        if(lScene.injump) {
            if(this.velocity == 0) {
                this.jstopdust();
            } else {
                if(!(this.jdustvisible)) {
                    if(lScene.inkjump) {
                        for (let kdust of this.kdusts) {
                            kdust.mkvisible(true);
                        }
                    } else  {
                        for (let jdust of this.jdusts) {
                            jdust.mkvisible(true);
                        }
                    }
                    this.jdustvisible = true;
                }
                if(lScene.inkjump) {
                    for(let kdust of this.kdusts) {
                        kdust.z += this.velocity / this.maxvelocity * delta * 40;
                        if(kdust.z > 0) kdust.z -= 30;        // 5 * 4
                    }
                } else {
                    for(let jdust of this.jdusts) {
                        jdust.z += this.velocity / this.maxvelocity * delta * 20;
                        if(jdust.z > 0) jdust.z -= 30;        // 5 * 4
                        // dust.procpos();
                    }
                }
            }
        } else {
            if(this.velocity == 0) {
                this.stopdust();
            } else {
                if(!(this.dustvisible)) {
                    for (var dust of this.dusts) {
                        dust.mkvisible(true);
                    }
                    this.dustvisible = true;
                }
                for(var dust of this.dusts) {
                    dust.z += this.velocity / this.maxvelocity * delta * 20;
                    if(dust.z > 0) dust.z -= 28;        // 5 * 4
                    // dust.procpos();
                }
            }
        }
    }
        
    missmess(ind)
    {
        if(ind) {
            this.missmessind += 1;
            this.missmesstimer = 2.0;
            g_ass.alarm.start();
        } else {
            this.domessage("");
            if(this.missmessind > 0) {
                g_ass.alarm.pause();
                this.missmessind -= 1;
            }
        }
    }    

    switchletter(letter)
    {
        this.letter.structure.buffer.texture = this.stati[letter];
    }

    explode()
    {
        this.noscans();
        this.ishyper = false;
        this.isauto = false;
        this.autophase = 0;
        g_ass.alarm.stop();
        if(!this.escapeind) super.explode();
    }

    targetmissile()
    {
        if((!(this.istarget)) && (!(this.isprimed))) {
            this.istarget = true;
            if(this.nummissiles > 0) {
                this.isarmed = true;
                this.nummissiles -= 1;
                this.missdisps[this.nummissiles].color = [0.7, 0.7, 0.0, 1.0];
                g_ass.beep.play();
            }
        }
    }
    untargetmissile()
    {
        if(this.isprimed || this.isarmed) {
            this.missdisps[this.nummissiles].color = [0.0, 1.0, 0.0, 1.0];
            this.nummissiles += 1;
            g_ass.beep.play();
        }
        this.istarget = false;
        this.isarmed = false;
        this.isprimed = false;
        this.misstarget = null;
    }

    missfire()
    {
        if(this.misstarget === null) return;
        lScene.missiles.next().fire(this, this.misstarget);
        this.misstarget = null;
        this.isprimed = false;
        this.istarget = false;
        this.isarmed = false;
        this.missdisps[this.nummissiles].color = [0.0, 0.0, 0.0, 0.0];
        this.missdisps[this.nummissiles].width = 0;

        g_ass.missile.play();

        this.commander.lgl_firemissile();
    }

    fuellevel(lvl, total)
    {
        let width = (lvl * 10 / total);
        this.fuelctrl.width = width;

        if(width > 9) {
            this.fuelctrl.color = [0.5, 1.0, 0.5, 1.0];
        } else if(width > 1)  {
            this.fuelctrl.color = [0.5, 0.5, 1.0, 1.0];
        } else {
            this.fuelctrl.color = [1.0, 1.0, 0.0, 1.0];
        }
    }

    altitude(plandist, radius, scope)
    {
        // Altitude is from 17 to 47
        let width = (plandist - radius) * 10 / scope;
        if(width > 10) width = 10;
        this.altctrl.width = width;
        if(width > 9) {
            this.altctrl.color = [0.5, 1.0, 0.5, 1.0];
        } else if(width > 1)  {
            this.altctrl.color = [0.5, 0.5, 1.0, 1.0];
        } else {
            this.altctrl.color = [1.0, 1.0, 0.0, 1.0];
        }
    }
    hyperprocess(delta)
    {
        this.hypertimer -= delta;
        if(this.hypertimer >= 0.0) {
            if(this.hypertimer < this.hyperseconds) {
                this.hypermessage();
                this.hyperseconds -= 1.0;
            }
            this.obj.procpos();
            return true;
        } else if(this.hypertimer > -4.0) {
            if(!this.hyper.isvisible) {
                g_ass.alarm.stop();
                g_ass.hyper.play();
                this.hyper.mkvisible(true);
                this.noscans();
                if(this.isgalactic)
                    this.domessage("In Galactic Hyperspace!!");
                else
                    this.domessage("In Hyperspace!!");
            }
            this.hyper.moveHere(0, 0, (0-(this.hypertimer * 10)) - 11.1)
            this.hyper.procpos();
            return false;
        } else {
            this.hypertimer = 0.0;
            this.hypergo();
            return false;
        }
    }
    escapeprocess(delta)
    {
        this.hypertimer -= delta;
        if(this.hypertimer >= 0.0) {
            if(this.hypertimer < this.hyperseconds) {
                this.escapemessage();
                this.hyperseconds -= 1.0;
            }
            this.obj.procpos();
            return true;
        } else if(this.hypertimer > -4.0) {
            if(!this.escapeind) {
                this.escapeind = true;
                this.noscans();
                this.domessage("Escaped!");
                this.pilot.rotateHere(0, 0, 0)
                this.newme();
                this.merotx = 1 - g_prngd.next(2)
                this.meroty = 1 - g_prngd.next(2)
                this.merotz = 1 - g_prngd.next(2)
                g_ass.launch.play();
                g_ass.alarm.stop();
            }
            this.pilot.move(0, 0, delta * 20)
            this.meobj.rotate(delta * this.merotx, delta * this.meroty, delta * this.merotz);
            this.pilot.procpos();
            return true;
        } else {
            this.hypertimer = 0.0;
            this.escapego();
            return false;
        }
    }
    iswanted()
    {
        return this.commander.lgl_iswanted();
    }
    isfugitive()
    {
        return this.commander.lgl_isfugitive();
    }
    maketerrorist()
    {

        if(!this.repcrime) {
            this.repcrime = true;
            this.domessage("You have committed a serious crime.  It has been reported");
        }
        this.commander.lgl_maketerrorist();
        this.bounty = 10;
        this.isterrorist = true;
        this.isnocrime = true;
    }
    addcrime(damage)
    {
        this.bounty = this.commander.lgl_addcrime(damage);
        this.isnocrime = true;
        if(!this.repcrime) {
            this.repcrime = true;
            this.domessage("You have committed a crime.  It has been reported");
        }
    }
    fireecm()
    {
        if(this.commander.lgl_hasecm()) 
            return super.fireecm();
        else
            return false;
    }
}

function scanDef()
{
    var dot = new LStructureDef(ShaderScanLine, {collision: LNONE});
    dot.addPolygonPatch({coords: [[0.005, 0.005], [-0.005, 0.005], [-0.005, -0.005], [0.005, -0.005]]});
    var line = new LStructureDef(ShaderScanLine, {collision: LNONE});
    line.addBlock({size: [0.002, 0.5, 0.002], position: lFromXYZ(0, 0.5, 0)});
    return [dot, line];
}

class Scan {
    constructor(color, ship)
    {
        if(!color) color = [1.0, 1.0, 0.6, 1.0];

        this.scancolor = color;
        
        var struct = structures.scan;
    
        this.dirctrl = {
            color: vec4.copy(vec4.create(), color),
            height: 1
        }
    
        this.linectrl = {
            color: vec4.copy(vec4.create(), color),
            height: 0
        }
    
        this.dir = new LIObject(struct[0], this.dirctrl);
        this.line = new LIObject(struct[1], this.linectrl);
        this.dir.mkvisible(false);
        this.line.mkvisible(false);
        this.isvisible = false;
        this.ship = ship;
        lScene.scans.push(this.line);
        lScene.scans.push(this.dir);
    }

    mkvisible(ind)
    {
        this.dir.mkvisible(ind);
        this.line.mkvisible(ind);
        this.isvisible = ind;
    }
    normalMoveHere(x, y, z)
    {
        let dist = Math.hypot(x, y, z);

        this.ship.seerange(dist <= 2000);

        if (dist < 1000)  {
            var scanobj = this.obj;
            if(!(this.isvisible)) {
                this.mkvisible(true);
                if(this.ship.wantlocking) this.ship.lock(); 
            }
        } else {
            if(this.isvisible) {
                this.mkvisible(false);
                if(this.ship.islocking) this.ship.unlock(); 
            }
            return false;
        }

        function _log(v) {
            if(v < -10)
                return -Math.log10(-v / 10);
            else if(v > 10)
                return Math.log10(v / 10);
            else
                return 0;
        }

        // 10 = 0, 100 = 1, 1000 = 2

        if(dist == 0)
            var fact = 0;
        else
            var fact = _log(dist) / dist
        
        this.linectrl.height = y * fact / 20;
        x *= fact / 6.667;
        y = this.linectrl.height;
        z = (z * fact  / 6.667) - 1.5;
        this.dir.moveHere(x, y - 0.4, z);
        this.line.moveHere(x, -0.4, z);

        return true;
    }

    jumpMoveHere(x, y, z)
    {
        x *= 50;
        y *= 50;
        z *= 50;


        let dist = Math.hypot(x, y, z);
        if (dist < 100000)  {
            var scanobj = this.obj;
            if(!(this.isvisible))
                this.mkvisible(true);
        } else {
            if(this.isvisible)
                this.mkvisible(false);
            return;
        }

        function _log(v) {
            if(v < -1)
                return -Math.log10(-v);
            else if(v > 1)
                return Math.log10(v);
            else
                return 0;
        }
        if(dist == 0)
            var fact = 0;
        else
            var fact = _log(dist) / dist  // Up to 1 / 2000

        this.linectrl.height = y * fact * 0.02;

        x *= fact * 0.06;
        y = this.linectrl.height;
        z = (z * fact * 0.06) - 1.5;
        this.dir.moveHere(x, y - 0.4, z);
        this.line.moveHere(x, -0.4, z);
    }

/*
     moveHere(x, y, z)
     {
-        this.linectrl.height = y / 9000;
-        x /= 3000;
+        function _log(v) {
+            if(v <= 1)
+                return 0;
+            else
+                return Math.log10(v);
+        }
+        this.linectrl.height = _log(y) / 27;
+        x = _log(x) / 9;
         y = this.linectrl.height;
-        z = (z  / 3000) - 1.5;
+        z = (_log(z)  / 9) - 1.5;
         this.dir.moveHere(x, y - 0.4, z);
         this.line.moveHere(x, -0.4, z);
     }
 */

    setcolor(color)
    {
        vec4.copy(this.linectrl.color, color);
        vec4.copy(this.dirctrl.color, color);
    }
    setheight(height)
    {
        this.linectrl.height = height
    }
}

class MockScan {
    static mkvisible(ind) {}
    static normalMoveHere(x, y, z) {}
    static jumpMoveHere(x, y, z) {}
    static setcolor(color) {}
    static setheight(height) {}
}


// Create a separate class for Slots to make life easier

class SSlot {
    constructor()
    {
        this.orient = 0;
        this.place = [0, 0];
        this.toland = vec3.create();
    }
    reset()
    {
        this.orient = 0;
        this.place[0] = 0;
        this.place[1] = 0;
        vec3.zero(this.toland);
    }
}

const _SLOT_NOT_FOUND = new SSlot();

class Slots {
    constructor()
    {
    
        var tplaces = [];
        var bplaces = [];
        for(var i = 0; i <= SLOTSIZE_MAX; i++) {
            tplaces[i] = [];
            bplaces[i] = [];
        }
    
        var tslots = [];
        var bslots = [];
    
        var idx = 0;
        for(var slot of SLOTS) {
            var row = [];
            var slen = slot[1];
            var sent = slot[0];
            for(var j = 0; j < slen; j++) {
                tplaces[sent].push([idx, j]);
                row.push(false);
            }
            tslots.push(row);
            idx += 1;
        }
    
        var idx = 0;
        for(var slot of SLOTS) {
            var row = [];
            var slen = slot[1];
            var sent = slot[0];
            for(var j = 0; j < slen; j++) {
                bplaces[sent].push([idx, j]);
                row.push(false);
            }
            bslots.push(row);
            idx += 1;
        }
    
        this.tslots = tslots;
        this.bslots = bslots;
        this.tplaces = tplaces;
        this.bplaces = bplaces;
        
    
    }

    find(sslot, ship, orient)
    {
        var size = ship.slotsize;
        var a = -1;
        var b = -1;
        var c = -1;

        if(orient == -1) {
            var places = this.bplaces;
            var slots = this.bslots;
        } else {
            var places = this.tplaces;
            var slots = this.tslots;
        }

        var cango = [];

        for(;;)
        {
            // Find a random slot of that size
            for(var loc of places[size]) {
                if(!slots[loc[0]][loc[1]]) {
                    cango.push(loc);
                }
            }
            if(cango.length > 0)
                break;
            else {
                size += 1;
                if(size > SLOTSIZE_MAX) return _SLOT_NOT_FOUND;
            }
        }

        var cdx = g_prng.next(cango.length);
        var place = cango[cdx];
        slots[place[0]][place[1]] = true;

        var rowdef = SLOTS[place[0]];

        var num = rowdef[1];

        var width = 48 / num;       // Should always go
        num -= 1;
        var x = ((num / 2) - place[1]) * width; 
        var z = rowdef[2] + ship.centerz;
        var y = 8 - ship.bottom;

        if(orient == -1) {      // Bottom
            y = 0 - y;
        }

        sslot.orient = orient;
        sslot.place = place;
        vec3.set(sslot.toland, x, y, z);
        return sslot;
    }

    free(sslot)
    {
        if(sslot.orient == -1) {
            var slots = this.bslots;
        } else {
            var slots = this.tslots;
        }
        const place = sslot.place;
        slots[place[0]][place[1]] = false;
    }
}


/*
 * While landing, origin is middle of Corriolis
 */
class Parked {
    constructor(ship, station)
    {
        // A temp class to handle landings
        // Rotation in 3D is handled by Quats
        // Constructor finds the slot
    
        this.ok = true;
        this.ship = ship;
        const shipobj = ship.obj;
        this.shipobj = shipobj;
        this.station = station;
        this.stationobj = station.obj;
    
        this.relvec = vec3.create();
        this.relquat = quat.create();
        this.srcquat = quat.create();
        this.destquat = quat.create();
        this.relqmat = mat4.create();
    
        this.mode = 0;  // 0 for none, 1 for landing, 2 for parked, 3 for launching
    
        // Initialise phase 1 here
    
    
    
        this.progress = 0.0; // counts down
        this.phase = 0;
    
        // Need the orientation
        this.orient = 0;        // -1 or 1 if bottom or top
    
    
        this.destqmat = mat4.create();  // Destination rotation as matrix

        this.destquat = quat.create();  // destination rotation as quat
        this.srcquat = quat.create();  // destination rotation as quat
    
        this.toland = null;   // Landing point, uses sslot.toland
        this.tolanda = vec3.create();   // Holding point
    
        this.dvec = vec3.create();
    
        this.tdveca = vec3.create();    // Vector of posiution
        this.tdafact = 1;               // Speed 
        this.tdvecb = vec3.create();     // Changing vector where we are
    
        this.relqmat = mat4.create();
        this.relquat = quat.create();
        this.isred = false;
        this.isyellow = false;

        this.sslot = new SSlot();

        this.relprogress = ship.maxvelocity / STANDARD_MAXVEL;
    }

    process(delta)
    {
        switch(this.mode) {
        case 1:
            this.landing(delta);
            break;
        case 2:
            this.parked(delta);
            break;
        case 3:
            this.launching(delta);
            break;
        }
    }

    land(shippos)
    {
        /*
        Landing - shippos is the mat4 position of the ship landing
         */

        // First - get the relative position of ship from station
        // Need to account for rotation, then position

        // Reset missiles
        if(this.istarget || this.isprimed) {
            this.nummissiles += 1;
            this.istarget = false;
            this.isprimed = false;
            this.isarmed = false;
            this.misstarget = null;
        }

        mat4.multiply(LTMP_MAT4A,
            mat4.fromZRotation(LTMP_MAT4A,
                    -this.station.rz),
            shippos);

        mat4.getTranslation(this.relvec, LTMP_MAT4A);
        mat4.getRotation(this.relquat, LTMP_MAT4A);
        mat4.fromQuat(this.relqmat, this.relquat);


        // Destinations - use findposition

        const destqmat = mat4.identity(this.destqmat);
        LTMP_VEC3A[0] = 0;
        LTMP_VEC3A[1] = 1;
        LTMP_VEC3A[2] = 0;
        const wvec = vec3.transformMat4(LTMP_VEC3A, LTMP_VEC3A, this.relqmat);
        if(wvec[1] > 0)
            this.orient = -1;       // Going down
        else {
            this.orient = 1;        // Going up
            mat4.rotateZ(destqmat, destqmat, LR180);
        }


        quat.copy(this.srcquat, this.relquat);
        mat4.getRotation(this.destquat, destqmat);

        mat4.getTranslation(this.dvec, shippos);

        // Subtract holding position (the z value is only one in it)
        this.dvec[2] -= HOLDPOS[2];

        const slt = this.station.slots.find(this.sslot, this.ship, this.orient);
        this.lorient = slt.orient;
        this.lplace = slt.place;
        this.toland = slt.toland;

        if(this.lorient === 0) {
            this.ok = false;
            console.log("NO LANDING SPACES");
            return;
        }
    
        this.tolanda = vec3.fromValues(this.toland[0], 0, this.toland[2]);  //  Above going down

    
        // Going from holding to above going down
        this.tdveca = vec3.fromValues(HOLDPOS[0] - this.toland[0],
                                     HOLDPOS[1],
                                     HOLDPOS[2] - this.toland[2]);
    
        // How fast to go to location
        this.tdafact = Math.ceil(vec3.length(this.tdveca) / 5);
    
        // Vector to go down
        this.tdvecb = vec3.fromValues(0,
                                    HOLDPOS[1] - this.toland[1],
                                     0);
        this.progress = 1.0;
        this.phase = 1;
        this.ok = true;
        this.ship.domessage("Ship registered, Started docking procedure");
        if(this.ship instanceof CockpitBase) {
            g_ass.alarm.stop();
            g_ass.engage.rewind();
            g_ass.engage.start();
        }
        this.station.entering += 1;
        this.station.switchred(true);
        this.isred = true;
        this.islanding = true;
        this.mode = 1;

    }

    landing(delta)
    {
        // This tracks relpos - then puts it on the appropriate location
        const shipobj = this.shipobj;


        switch(this.phase) {
        case 1: // Move to holding internal point, straigftening up
            this.progress -= delta;
            if(this.progress > 0) {

                // Hard manipulate ships quat

                var sf = this.progress;
                var df = 1.0 - this.progress;

                vec3.add(this.relvec, HOLDPOS, vec3.scale(LTMP_VEC3A, this.dvec, sf));
                for(var i = 0; i < 4; i++) {
                    this.relquat[i] = (this.srcquat[i] * sf) + (this.destquat[i] * df)
                }
                mat4.fromQuat(this.relqmat, this.relquat);
            } else {
                this.progress = 1;
                this.phase = 2;
                quat.copy(this.relquat, this.destquat);
                mat4.fromQuat(this.relqmat, this.relquat);

                vec3.copy(this.relvec, HOLDPOS);
                this.ship.domessage("Docking: At rotation point");
            }
            // Relative position

            break;

        case 2:     // Turn around
            this.progress -= delta;
            if(this.progress > 0) {
                mat4.rotateY(this.relqmat, this.destqmat, (1.0 - this.progress) * LR180);
            } else {
                this.progress = 1;
                this.phase = 3;
                mat4.rotateY(this.relqmat, this.destqmat, LR180);
                this.ship.domessage("Docking: Proceding to vacant bay");
            }
            break;

        case 3:     // Go to location (backwards)
            delta /= this.tdafact;
            if(delta <= this.progress) {
                this.progress -= delta;
                vec3.add(this.relvec, this.tolanda, vec3.scale(vec3.create(), this.tdveca, this.progress));
            } else {
                var move = 0;
                this.progress = 1;
                this.phase = 4 ;
                this.ship.domessage("Docking: Landing in bay");
            }
            break;

        case 4:     // Down we go
            if(delta <= this.progress) {
                this.progress -= delta;
                vec3.add(this.relvec, this.toland, vec3.scale(vec3.create(), this.tdvecb, this.progress));
            } else {
                this.ship.domessage("");
                this.ship.scan.mkvisible(false);
                this.ship.haslanded = true;
                this.phase = 0;
                this.mode = 2;
                this.station.entering -= 1;
                this.station.switchred(false);
                this.isred = false;
                this.islanding = false;
                if(this.ship instanceof CockpitBase) {
                    this.ship.cmdr_save(0);
                    g_ass.engage.stop();
                    g_ass.engage.rewind();
                    g_ass.pickup.play();
                    if(lScene.player.missobj) {
                        if(lScene.player.missobj.op_mission(lScene)) {
                            if(!lScene.player.inmission) {
                                lScene.player.inmission = true;
                                lScene.player.dispmission();
                            }
                        }
                    }
                }
                if(this.ship instanceof NPCBase) {
                    this.ship.wing.parkship();
                }
            }
            break;
        }
        this.parked(delta);
        return true;
    }

    park()
    {
        // Park the ship    - Only on creation of the station
        if(g_prng.next(2) > 0)
            this.orient = 1;
        else
            this.orient = -1;

        const slt = this.station.slots.find(this.sslot, this.ship, this.orient);
        this.toland = slt.toland;
        this.lorient = slt.orient;
        this.lplace = slt.place;

        if(this.lorient === 0) {
            this.ok = false;
            console.log("NO LANDING SPACES");
            return;
        }


        const pvec = vec3.copy(this.relvec, this.toland);
        // mat4.identity(this.relqmat);     Should not be needed
        mat4.rotateY(this.relqmat, this.relqmat, LR180);
        if(this.orient == 1)
            mat4.rotateZ(this.relqmat, this.relqmat, LR180);
        this.mode = 2;
        this.ship.haslanded = true;
        this.ship.appear(pvec[0], pvec[1], pvec[2], this.relqmat);
        this.ship.scan.mkvisible(false);
        this.ship.ispark = true;
        this.ship.canresetpark = true;
        this.ship.exists = true;
        
    }

    reset()
    {
        let idx = this.station.exitqueue.indexOf(this.ship);
        if(idx != -1)
            this.station.exitqueue.splice(idx, 1);
        this.mode = 2;
        this.ship.haslanded = true;
        this.ship.scan.mkvisible(false);
        this.ship.ispark = true;
        this.ship.canresetpark = true;
    }

    parked()
    {
        // Do rotate of ship.  We want to move X and Y by RZ as well
        // Do position from relvec and relqmat

        /*
        vec3.transformMat4(LTMP_VEC3A, 
            vec3.transformMat4(LTMP_VEC3A, this.relvec, this.relqmat),
            this.stationobj.position);

        */

        mat4.multiply(LTMP_MAT4A, mat4.fromTranslation(LTMP_MAT4A, this.relvec), this.relqmat);
        mat4.multiply(LTMP_MAT4A, this.stationobj.position, LTMP_MAT4A);

        mat4.getTranslation(LTMP_VEC3A, LTMP_MAT4A);

        var shipobj = this.ship.obj;


        shipobj.x = LTMP_VEC3A[0];
        shipobj.y = LTMP_VEC3A[1];
        shipobj.z = LTMP_VEC3A[2];

        mat4.getRotation(shipobj.quat, LTMP_MAT4A);
    }

    launch()
    {
        if(!(this.ship.haslanded)) return;

        if(this.ship instanceof CockpitBase) {
            this.ship.cmdr_save();
            this.ship.stopdust();
            g_ass.beep.play();
        }
        this.station.exitqueue.push(this.ship);
        this.launchnum = this.station.launchnum - 1;
        this.launchpos = this.station.exitqueue.length + 1;
        this.mode = 3;
        this.phase = 1;
        this.ship.haslanded = false;
        this.ship.domessage("Preparing to launch");
        this.bqueue = this.station.exitqueue.length;
        this.ship.canresetpark = true;
    }
    launching(delta){
        // First get in front of queue
        // Amber light 
        // Wait 10 seconds
        // Red light
        // What for no-one to be entering
        // Launch
        switch(this.phase) {            // Waiting in queue
        case 1:
            // Waiting for clear
            if(this.station.exitqueue[0] === this.ship) {
                this.phase = 2;
                this.progress = 10.0;
                this.bprogress = 10.0;
                this.station.lights = 1;
                this.station.switchyellow(true);
                // no break
            } else {
                if(this.station.launchnum > this.launchnum)
                {
                    if(this.ship instanceof CockpitBase) {
                        this.launchpos -= (this.station.launchnum - this.launchnum);
                        this.launchnum = this.station.launchnum;
                        this.ship.domessage("In launch queue position " + this.launchpos.toString(), 600000);
                    }
                    this.bqueue -= 1;
                }
                this.parked(delta);
                break;
            }
        case 2:                         // Wait 10 secondds
            this.progress -= delta;
            if(this.progress < 0) {
                this.progress = 1;
                this.phase = 3;
                this.ship.domessage("Waiting for entering ships to land", 600000);
                this.station.switchyellow(false);
                this.station.switchred(true);
                this.isred = true;
            } else {
                this.station.countdown = this.progress;
                if(this.progress <= this.bprogress) {
                    this.ship.domessage("Launching in " + this.bprogress.toString());
                    this.bprogress -= 1;
                }
            }
            this.parked(delta);
            break;
        case 3:                     // Waiting for entering to be 0
            if(this.station.entering == 0)
            {
                this.phase = 4;
                this.ship.canresetpark = false;
                this.progress = 1;
                this.station.lights = 2;    // Red lights
                this.curry = this.relvec[1];
                this.ship.domessage("Launching: Take off");
                if(this.ship instanceof CockpitBase) g_ass.engage.start();
                this.ship.wing.launchship();
                // No break
            } else {
                this.parked(delta);
                break;
            }
        case 4:                             // Up we go
            this.progress  -= delta;
            if(this.progress > 0) {
                this.relvec[1] = this.curry * this.progress;
            } else {
                this.ship.domessage("Launching: Proceding to ejection point");
                this.progress = 1;
                this.distance = Math.hypot(this.toland[0] - HOLDPOS[0], this.toland[2] - HOLDPOS[0]);
                this.relvec[1] = 0;
                this.phase = 5;
            }
            this.parked(delta);
            break;
        case 5:     // Holding position
            this.progress -= delta * 7.0 / this.distance;
            if(this.progress < 0) {
                vec3.copy(this.relvec, HOLDPOS);
                this.progress = 1;
                this.phase = 6;
                if(this.ship instanceof CockpitBase) {
                    this.ship.domessage("Launching: Ejection! Prepare to take over control..");
                    g_ass.engage.stop();
                    g_ass.engage.rewind();
                    g_ass.launch.play();
                }
            } else {
                var gone = 1 - this.progress;
                vec3.copy(this.relvec, vec3.fromValues(
                    (this.toland[0] * this.progress) + (HOLDPOS[0] * gone),
                    0,
                    (this.toland[2] * this.progress) + (HOLDPOS[2] * gone)));
            }
            this.parked(delta);
            break;
        case 6:     // Ejecting
            this.progress -= delta * this.relprogress;
            if(this.progress < 0) {             // We are free
                this.ship.domessage("");
                this.ship.velocity = 9 * this.relprogress;      // Speed we were going before
                this.station.lights = 0;        // Lights off
                this.station.exitqueue.shift(); // Shift
                this.progress = 0;
                this.phase = 0;
                this.mode = 0;
                this.ship.obj.warp();
                this.station.launchnum += 1;
                this.station.switchred(false);
                this.isred = false;
                this.ship.velroll = -STATION_ROTATE;
                /*
                if(this.ship instanceof NPCBase) {
                    var rad = LR180 - g_prngd.next(LR360);
                    vec3.copy(this.ship.waypoint, [Math.sin(rad) * 10000, Math.cos(rad) * 10000, this.station.launchpoint]);
                    this.ship.istoaway = true;
                }
                */
                if(this.ship instanceof NPCBase) {
                    this.ship.istoaway = false;
                    const mrelpos = vec3.transformMat4(this.ship.mrelpos, this.ship.waypoint, this.ship.invposition);     // How "other" looks from "me"
                    // Looking down
                    if(Math.sign(mrelpos[1]) > 0)
                        this.ship.isafterlaunch = 1;
                    else
                        this.ship.isafterlaunch = -1;
                }

                this.station.slots.free(this.sslot);
                this.ship.ispark = false;
            } else {
                var gone = 1 - this.progress;
                vec3.copy(this.relvec, vec3.fromValues(
                    0,
                    0,
                    (HOLDPOS[2] * this.progress) + ((1 - this.progress) * this.station.launchpoint)));
                this.parked(delta);
                if(this.ship instanceof CockpitBase) {
                    this.ship.pilot.rotateHere(0, 0, (this.progress - 1) * STATION_ROTATE / 10);
                }
            }
            break;
        }
    }
    destroy()
    {
        // If ship is destroyed
        if(this.isred) this.station.switchred(false);
        if(this.mode == 3) {
            if(this.phase > 0 && this.phase < 7) {
                this.station.exitqueue.shift(); // Shift
            }
        }
        if(this.mode == 2) {
            if(this.phase > 0 && this.phase < 5) {
                this.station.entering -= 1;
            }
        }
        this.station.slots.free(this.sslot);
    }
}

class Autodock {
    constructor(ship, station)
    {
        this.ship = ship;
        this.station = station;
        this.mrelpos = vec3.create();
    
        this.autostop2 = 0;
    
        this.autoway1 = vec3.create();
        this.autoway2 = vec3.create();
        this.autoway3 = vec3.fromValues(0, 0, station.launchpoint + 180);
        this.autoway4 = vec3.fromValues(0, 0, station.launchpoint + 50);

        this.autoway5 = vec3.fromValues(0, 0, 32);       // Center of station entrance
    
        this.autostop2 = station.launchpoint + 160;
        this.autoindex = 0;
    
        this.autophase = 0;
        this.orient = 1;
    }

    autodetr(idx) {
        // Breaking magic here
        
        this.radturn = 550 + (idx * 100);
        this.radway = 560 + (idx * 100);
        
        this.autoway3[2] = this.station.launchpoint + 170 + (100 * idx);
        this.autoway2[0] = this.vx1 * this.radway;
        this.autoway2[1] = this.vy1 * this.radway;
        this.autoway2[2] = this.station.launchpoint + 180 + (100 * idx);
        this.autoway1[0] = this.autoway2[0];
        this.autoway1[1] = this.autoway2[1];
        this.autostop2 = this.station.launchpoint + 160 + (100 * idx);
        this.autoindex = idx;
    }

    autodock()
    {
        
        const sobj = this.ship.obj;
        const station = this.station;

        let x = sobj.x;
        let y = sobj.y;
        let z = sobj.z;

        const autoindex = station.autonextidx(this.ship);
    
        var raddist = Math.hypot(x, y);

        this.message = [
            "Autodocking computer initiated.",
            "Autodocking computer active: Piloting to station traffic rim.",
            "Autodocking computer active: Piloting to rim approach.",
            "Autodocking computer active: Piloting to central approach.",
            "Autodocking computer active: Piloting to final approach.",
            "Autodocking computer active: Aligning to station.",
            "Autodocking computer active: Orienting to station.",
            "Autodocking computer active: Waiting for all clear.",
            "Autodocking computer active: Waiting for entrance to clear.",
            "Autodocking computer active: Final approach.",
        ];

        if(this.raddist == 0) {
            this.vx1 = 1;
            this.vy1 = 0;
        } else {
            this.vx1 = x / raddist
            this.vy1 = y / raddist
        }

        this.radway = 560 + (autoindex + 100);

        const mrelpos = mat4.getTranslation(this.mrelpos, this.ship.invposition);     // How "other" looks from "me"

        if (z >= 200 + (autoindex * 100)) {     // In front of station or clear line to way point
            this.autophase = 3;     
        } else if (z >= 35 && raddist >= 150) {
            mat4.fromTranslation(this.autoway2, [x, y, (this.station.launchpoint + 180 + (100 * autoindex))]);
            this.autophase = 2;
        } else {
            x = this.radway * this.vx1;
            y = this.radway * this.vy1;
            this.autoway2[0] = x;
            this.autoway2[1] = y;
            this.autoway2[2] = station.launchpoint + 180 + (autoindex * 100);
            this.autoway1[0] = x;
            this.autoway1[1] = y;
            this.autoway1[2] = z;
            this.autophase = 1;
        }

        this.radturn = 550 + (autoindex + 100);
        this.autodetr(autoindex);

        if(g_prng.next(2) == 0)
            this.orient = -1;
        else
        this.orient = 1;

        this.ship.isauto = true;
        this.ship.domessage(this.message[this.autophase], 600000);
    }

    process(delta, keys)
    {
        if(this.ship.ispark) {
            this.autophase = 0;
            return;
        }


        keys.roll_clock = false;
        keys.roll_anti = false;
        keys.pitch_up = false;
        keys.pitch_down = false;
        keys.go_forward = false;
        keys.go_back = false;

        let ship = this.ship;

        const sobj = this.ship.obj;
        let raddist = Math.hypot(sobj.x, sobj.y);
        const station = this.station;
        const self = this;
        const mrelpos = this.mrelpos;

        let toroll = 0;

        function _autorotate(mrelpos, away, waypsens)
        {
            let x = mrelpos[0];
            let y = mrelpos[1];
            let z = mrelpos[2];

            let velroll = ship.velroll;

            let xp = Math.abs(x);
            let yp = Math.abs(y);
            let zp = Math.abs(z);

            if(xp > zp / waypsens) {
                if(y > 0) {
                    toroll = -Math.atan(x / y);
                } else if (y < 0) {
                    toroll = Math.atan(x / y);
                } else {
                    toroll = LR90;
                }
                if(Math.sign(toroll) != Math.sign(velroll) || velroll * velroll < Math.abs(toroll * ship.accelroll)) {
                    if(x > 0) keys.roll_clock = true;
                    if(x < 0) keys.roll_anti = true;
                }
            }
            if(z >= 0)
            {
                if(y >= 0) keys.pitch_up = true;
                if(y < 0) keys.pitch_down = true;
            }
            else
            {
                if(yp >= zp / (2 * waypsens)) {
                    var velpitch = ship.velpitch;
                    var topitch = -Math.abs(Math.atan(y / z));
                    if(Math.abs(velroll) < 0.1 && (Math.abs(toroll)  < LR90 / 2) && (Math.sign(velpitch) != Math.sign(y) || velpitch * velpitch < Math.abs(2 * topitch * ship.accelpitch))) {
                        if(y > 0) keys.pitch_up = true;
                        if(y < 0) keys.pitch_down = true;
                    }
                }
                if(away) {
                    // if(ship.radar.ping(away[0], away[1], away[2], 500) === null)
                    let hit = ship.radar.ping(away[0], away[1], away[2], 500);
                    if(hit === null) {
                        keys.go_back = false;
                        keys.go_forward = true;
                    } else {
                        keys.go_back = true;
                        keys.go_forward = false;
                    }
                }
            }
        }


        function _rotatewait()
        {
            // var tvec = mat4.getTranslation(LTMP_VEC3A, mat4.multiply(LTMP_MAT4A, sobj.position, mat4.fromTranslation(LTMP_MAT4B, [0, 1, 0])));
            LTMP_VEC3A[0] = 0;
            LTMP_VEC3A[1] = self.orient;
            LTMP_VEC3A[2] = 0;
            let tvec = vec3.transformMat4(LTMP_VEC3A, LTMP_VEC3A, sobj.position);

            let x = tvec[0];
            let y = tvec[1];


            if(y == 0) {
                var mz = Math.sign(x) * LR90;
            } else {
                var mz = Math.atan(x / y);
                if(x < 0 && y < 0)
                    mz = mz - LR180
                else if(y < 0 && x > 0)
                    mz = LR180 + mz;
            }
            toroll = mz + station.rz;
            while(toroll > LR180) toroll -= LR360;
            while(toroll < 0 - LR180) toroll += LR360;

            let velroll = ship.velroll
            let rvelroll = ship.velroll + STATION_ROTATE;
            if(Math.sign(toroll) != Math.sign(rvelroll) || rvelroll * rvelroll < Math.abs(1.5 * toroll * ship.accelroll)) {      // MARK 2 *
                if(toroll < 0) keys.roll_clock = true;
                if(toroll > 0) keys.roll_anti = true;
            }

            // Pitch up only on the "ascendant - hence the velroll equalling "
            vec3.transformMat4(self.mrelpos, self.autoway5, ship.invposition);
            if(Math.abs(mrelpos[1]) > Math.abs(mrelpos[0]) && (Math.sign(toroll) == Math.sign(mrelpos[0]))) {
                if(mrelpos[1] > 0) {
                    keys.pitch_up = true;
                } else {
                    keys.pitch_down = true;
                }
            }

            keys.go_forward = false;
            keys.go_back = true;
        }


        switch(this.autophase) {
        case 1:                                 // Out away from the station
            if(raddist > this.radturn) {
                this.autophase = 2;
                ship.domessage(this.message[this.autophase], 600000);
                // No break
            } else {
                _autorotate(
                    vec3.transformMat4(this.mrelpos, this.autoway1, ship.invposition),
                    this.autoway1,
                    10
                );
                break;  // Conditional
            }
        case 2:                             // Rim approach 
            if(sobj.z >= this.autostop2) {
                this.autophase = 3;
                ship.domessage(this.message[this.autophase], 600000);
                // no break
            } else {
                _autorotate(
                    vec3.transformMat4(this.mrelpos, this.autoway2, ship.invposition),
                    this.autoway2,
                    10
                );
                break;  // Conditional
            }
        case 3:                         // Go to central approach
            vec3.transformMat4(this.mrelpos, this.autoway3, ship.invposition);
            var tdist = Math.hypot(mrelpos[0], mrelpos[1], mrelpos[2]);
            if(tdist < 1 && ship.velocity < ship.acceleration) {
                this.autophase = 4;
                ship.domessage(this.message[this.autophase], 600000);
                // No break
            } else {
                _autorotate(mrelpos, this.autoway3, 20)
                if(keys.go_forward) {
                    var sp2 = 400;
                    if(sp2 > ship.acceleration * Math.abs(mrelpos[2])) {
                        if(ship.velocity * ship.velocity >= ship.acceleration * Math.abs(mrelpos[2]) / 20)  {      // d = ((a ^ 2) * t ) / 2,  d = v * t, therefore (v ^ 2)  = a * d / 2
                            keys.go_forward = false;
                            keys.go_back = true;
                        }
                    }
                }
                break;  // Conditional
            }
        case 4:                         // Go to final position.  Should initially be pointing correct way
            vec3.transformMat4(this.mrelpos, this.autoway4, ship.invposition);
            if(mrelpos[2] > -5.0 && sobj.z < station.launchpoint + 60) {
                this.autophase = 5;
                ship.domessage(this.message[this.autophase], 600000);
                station.autoshiftidx(ship);
                // No break
            } else {
                _autorotate(mrelpos, this.autoway4, 100)
                if(keys.go_forward) {
                    // var sp2 = ship.maxvelocity * ship.maxvelocity;
                    var sp2 = 400;
                    if(sp2 > ship.acceleration * Math.abs(mrelpos[2])) {
                        if(ship.velocity * ship.velocity >= ship.acceleration * Math.abs(mrelpos[2]) / 20) {      // d = ((a ^ 2) * t ) / 2,  d = v * t, therefore (v ^ 2)  = a * d / 2
                            keys.go_forward = false;
                            keys.go_back = true;
                        }
                    }
                }
                break;  // Conditional
            }
        case 5:                     // Point towards the sation center
            mat4.getTranslation(this.mrelpos, ship.invposition);
            if(Math.abs(mrelpos[0]) < .1 && Math.abs(mrelpos[1]) < .1) {
                this.cangonow = true;
                this.autophase = 6;
                ship.domessage(this.message[this.autophase], 600000);
                // No break
            } else {
                _autorotate(mrelpos, this.autoway5, 5000)   // Ship is about 100 (1000M) away, therefore 100 / waypsens should be lot < .1
                keys.go_forward = false;
                keys.go_back = true;
                break;
            }
        case 6:                     // Point towards the sation, alignment
            _rotatewait();
            if(Math.abs(mrelpos[0]) < 0.1 && Math.abs(mrelpos[1]) < 0.1 && Math.abs(toroll) < 0.1) {
                this.autophase = 7;
                ship.domessage(this.message[this.autophase], 600000);
            } else {
                break;
            }
        case 7:                 // Inwards
            /* Which way up */

            // Do not crash
            if(station.numred || (station.numyellow > 0 && station.countdown < 8)) {
                if(this.cangonow) this.cangonow = false;
                _rotatewait();
                break;
            }  else if(this.cangonow) {
                this.autophase = 9;
                ship.domessage(this.message[this.autophase], 600000);
                this.progress = 0.0;
                // No break
            } else  {
                this.progress = 2.0;
                this.autophase = 8;
                ship.domessage(this.message[this.autophase], 600000);
                // No break
            }
            // No break
        case 8:
            this.progress -= delta;
            if(this.progress < 0) {
                this.progress = 0;
                this.autophase = 9;
                ship.domessage(this.message[this.autophase], 600000);
                // No break
            } else {
                _rotatewait();
                break;
            }
            // No break
                
        case 9:

            // var tvec = mat4.getTranslation(LTMP_VEC3A, mat4.multiply(LTMP_MAT4A, sobj.position, mat4.fromTranslation(LTMP_MAT4B, [0, 1, 0])));
            LTMP_VEC3A[0] = 0;
            LTMP_VEC3A[1] = this.orient;
            LTMP_VEC3A[2] = 0;
            var tvec = vec3.transformMat4(LTMP_VEC3A, LTMP_VEC3A, sobj.position);

            var x = tvec[0] - sobj.x;
            var y = tvec[1] - sobj.y;

            if(y == 0) {
                var mz = Math.sign(x) * LR90;
            } else {
                var mz = Math.atan(x / y);
                if(x < 0 && y < 0)
                    mz = mz - LR180
                else if(y < 0 && x > 0)
                    mz = LR180 + mz;
            }
            var sz = -station.rz;
            toroll = mz - sz;
            while(toroll > LR180) toroll -= LR360;
            while(toroll < 0 - LR180) toroll += LR360;

            var velroll = ship.velroll
            let rvelroll = ship.velroll + STATION_ROTATE;
            if(Math.sign(toroll) == Math.sign(rvelroll) || rvelroll * rvelroll < Math.abs(1.5 * toroll * ship.accelroll)) {  // MARK 2 *
                if(toroll < 0) keys.roll_clock = true;
                if(toroll > 0) keys.roll_anti = true;
            }
            let hit = ship.radar.ping(0, 0, 0, 100);

            if(hit instanceof PersonBase)
                keys.go_back = true;
            else
                keys.go_forward = true;
            break;
        }
    }
}


function explbigDef()
{
    var struct = new LStructureDef(ShaderSolid, {collision: LNONE, color: [0.87, 0.71, 0.0, 1.0]});
    struct.addPolygon({depth: 0.001, coords: [[2, -3], [2.5, 2], [-2.2, 3], [-2.7, -1.6]]});
    return struct;
}

function explmidDef()
{
    var struct = new LStructureDef(ShaderSolid, {collision: LNONE, color: [0.8, 0.0, 0.0, 1.0]});
    struct.addPolygon({depth: 0.001, coords: [[.8, -1.3], [1.1, .6], [-.9, 1.2], [-1.1, -.8]]});
    return struct;
}

function expllitDef()
{
    var struct = new LStructureDef(ShaderSolid, {collision: LNONE, color: [0.8, 0.61, 0.0, 1.0]});
    struct.addPolygon({depth: 0.001, coords: [[.4, -0.6], [.61, .3], [-.49, .62], [-.51, -.38]]});
    return struct;
}

class ExplosionPart {
    constructor(struct)
    {
        this.obj = new LIObject(struct, this);
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.rx = 0;
        this.ry = 0;
        this.rz = 0;
        this.obj.mkvisible(false);
    }
}

function explosionDef()
{
    var struct = new LGroupDef({collision: LNONE});
    return struct;
}

class Explosion {
    constructor()
    {
        this.obj = new LWObject(structures.explosion, this);
        var bigparts = [];
        var midparts = [];
        var litparts = [];
        for(var i = 0; i < 5; i++) {
            var part = new ExplosionPart(structures.explbig);
            this.obj.addChild(part.obj, mat4.create());
            bigparts.push(part);
        }
        for(var i = 0; i < 5; i++) {
            var part = new ExplosionPart(structures.explmid);
            this.obj.addChild(part.obj, mat4.create());
            midparts.push(part);
        }
        for(var i = 0; i < 5; i++) {
            var part = new ExplosionPart(structures.expllit);
            this.obj.addChild(part.obj, mat4.create());
            litparts.push(part);
        }
        lScene.lPlace(this.obj, mat4.create());
        this.bigparts = bigparts;
        this.midparts = midparts;
        this.litparts = litparts;
        this.obj.mkvisible(false);
        this.isbanging = false;
        this.thing = null;
    
    }

    bang(thing, size, x, y, z)
    {
        this.isbanging = true;
        this.timeout = 3;
        this.thing = thing;

        this.obj.isvisible = true;

        function _setuppart(_part, _fact) 
        {
            _part.obj.isvisible = true;
            _part.x = ((2 - g_prngd.next(4)) * _fact);
            _part.y = ((2 - g_prngd.next(4)) * _fact);
            _part.z = ((2 - g_prngd.next(4)) * _fact);
            _part.rx = g_prngd.next(LR360)
            _part.ry = g_prngd.next(LR360)
            _part.rz = g_prngd.next(LR360)
            _part.obj.moveHere(0, 0, 0);
            _part.obj.rotateHere(g_prngd.next(LR90), g_prngd.next(LR90), g_prngd.next(LR90));
        }
        // Size is length
        if(size > 100) {
            for(var part of this.bigparts)
                if(g_prngd.next(size / 100) >= 1)
                    _setuppart(part, 1);
                else
                    part.obj.isvisible = false;
        } else {
            for(var part of this.bigparts) part.obj.isvisible = false;
        }

        if(size > 10) {
            for(var part of this.midparts)
                if(g_prngd.next(size / 10) >= 1)
                    _setuppart(part, 0.3);
                else
                    part.obj.isvisible = false;
        } else {
            for(var part of this.midparts) part.obj.isvisible = false;
        }

        for(var part of this.litparts)
            _setuppart(part, 0.1);

        
        this.obj.moveHere(x, y, z);
        this.obj.procpos();
    }

    process(delta)
    {
        if(!this.isbanging) {
            if(this.thing instanceof CockpitBase) {
                if(lScene.isgo) {
                    lScene.isgo = false;
                    lScene.lRestart = endall;
                    alert("Ship destroyed");
                }
            }
            return;
        }

        function _movepart(_part)
        {
            if(_part.obj.isvisible) {
                _part.obj.rotate(_part.rx * delta, _part.ry * delta, _part.rz * delta);
                _part.obj.move(_part.x * delta, _part.y * delta, _part.z * delta * 10);
            }
        }
        if(!this.isbanging) return;
        this.timeout -= delta;
        if(this.timeout < 0) {
            this.isbanging = false;
            this.obj.mkvisible(false);
            for(var part of this.bigparts) part.obj.isvisible = false;
            for(var part of this.midparts) part.obj.isvisible = false;
            for(var part of this.litparts) part.obj.isvisible = false;
    
            return;
        }
        for (var part of this.bigparts) _movepart(part)
        for (var part of this.midparts) _movepart(part)
        for (var part of this.litparts) _movepart(part)
        this.obj.procpos();
    }
}

function laserDef()
{
    // Lasers are fast "bullets"
    var gdef = new LGroupDef({collision: LNONE});    // Collision is none as nothing goes into this
    var struct = new LStructureDef(ShaderSolid, {color: [1.0, 1.0, 0.9, 1.0], collision: LNONE});
    struct.addCylinder({radius: 0.03, depth: 5, segments: 8});
    return [gdef, struct];
}

class Laser {
    constructor()
    {
        this.ship = null;
        var structs = structures.laser;
        this.obj = new LWObject(structs[0], this);
        this.lhs = new LObject(structs[1], this);
        this.rhs = new LObject(structs[1], this);
        this.obj.addChild(this.rhs, mat4.create());
        this.obj.addChild(this.lhs, mat4.create());
        this.obj.mkvisible(false);
        this.damage = 10;
        lScene.lPlace(this.obj, mat4.create());
    }

    fire(ship)
    {
        this.ship = ship;

        this.obj.x = ship.obj.x;
        this.obj.y = ship.obj.y;
        this.obj.z = ship.obj.z;
        quat.copy(this.obj.quat, ship.obj.quat);
        this.lhs.x = -ship.width;
        this.rhs.x = ship.width;
        if(ship instanceof CockpitBase) {
            this.lhs.y = -1;
            this.rhs.y = -1;
        }
        this.obj.mkvisible(true);
        this.obj.procpos();
        this.obj.warp();
        this.distance = 0;
        ship.lasered = 1;
        ship.laserout += 1;
        this.damage = ship.laserdamage;

        if(ship instanceof CockpitBase)
            this.diameter = 1;
        else
            this.diameter = 3;
    }

    end()
    {
        this.ship.laserout -= 1;
        this.ship = null;
        this.obj.mkvisible(false);
        this.obj.procpos();
    }

    process(delta)
    {
        if(this.ship === null) return;

        delta *= 500;
        this.obj.move(0, 0, -delta);
        this.obj.procpos();
        var hit = null;

        var self = this;

        function _cback(cob)
        {
            if(hit === null && cob.control != self.ship) {
                hit = cob.control;
            }
        }
        lScene.lCAllPointDetect(this.obj, this.diameter, _cback);
        if(hit !== null) {
            if(hit != this.ship) {
                hit.hitme(self);
                this.end();
            }
        }
        this.distance += delta;
        if(this.distance > 1000) this.end();
    }
}

class RadarBeam {
    constructor(ship)
    {
        this.ship = ship;
        this.beam = new LVirtObject(this, 0, 0, 0, 0);
        this.beam.ignore = true;
        this.wpos = mat4.create();
    }

    ping(x, y, z, dist)
    {
        const sobj = this.ship.obj;
        this.beam.setPosition(sobj.x, sobj.y, sobj.z);

        let rx  = x - sobj.x;
        let ry  = y - sobj.y;
        let rz  = z - sobj.z;
        var fact = 0;
        const wdist = Math.hypot(rx, ry, rz);
        if(wdist > dist ) {
            fact = dist / wdist;
            
            x = sobj.x + (rx * fact);
            y = sobj.y + (ry * fact);
            z = sobj.z + (rz * fact);
        }
        this.beam.moveHere(x, y, z);
        var hit = null;
        var self = this;
        var ship = this.ship;
        function _cback(cob, dbg)
        {
            // If pointing away from object do not bother, keep going
            // Give way to station (somehow)
            // If other pointing away slow down
            // One closest to station (origin) has water
            // Xplane, then Yplane, then Zplane
           
            let ctl = cob.control;
            if(ctl.ispark) return;
            if(ctl !== self.ship) {
                if(hit === null) {

                
                    // I am pointing away, Dont care
                    LTMP_VEC3A[0] = cob.x;
                    LTMP_VEC3A[1] = cob.y;
                    LTMP_VEC3A[2] = cob.z;
                    vec3.transformMat4(LTMP_VEC3C, LTMP_VEC3A, self.ship.invposition);     // How "other" looks from "me"
                    if(LTMP_VEC3C[2] > 0) return;

                    // I am a station
                    if(ctl instanceof StationBase) {
                        // hit = ctl;
                        return;
                    }

                    let length = vec3.length(LTMP_VEC3C);
                    if(ship.velocity * ship.velocity < (ship.acceleration * (length - 100)) / 2) {
                        return;
                    }

                    LTMP_VEC3B[0] = sobj.x;
                    LTMP_VEC3B[1] = sobj.y;
                    LTMP_VEC3B[2] = sobj.z;
                    vec3.transformMat4(LTMP_VEC3C, LTMP_VEC3B, ctl.invposition);     // How "I" look to other
                    if(LTMP_VEC3C[2] > 0) {     // Other pointig away - stop
                        hit = ctl;
                        return;
                    }

                    // Who is nearer the station?

                    let otsq = vec3.squaredLength(LTMP_VEC3A);
                    let mesq = vec3.squaredLength(LTMP_VEC3B);

                    if(mesq > otsq) {
                        hit = ctl;
                        return;
                    }

                    if(LTMP_VEC3A[0] > LTMP_VEC3B[0]) { hit = ctl; return; }
                    if(LTMP_VEC3A[0] < LTMP_VEC3B[0]) { return; }
                    if(LTMP_VEC3A[1] > LTMP_VEC3B[1]) { hit = ctl; return; }
                    if(LTMP_VEC3A[1] < LTMP_VEC3B[1]) { return; }
                    if(LTMP_VEC3A[2] > LTMP_VEC3B[2]) { hit = ctl; return; }
                }
            }
        }
        lScene.lCAllPointDetect(this.beam, 20, _cback);
        return hit;
    }
}


class VirtStation {
    constructor()
    {
        this.vobj = new LVirtObject(this, 0, 0, 0, 0);
        this.vobj.mkvisible(true);
        lScene.lCAdd(this.vobj);
        this.scan = new Scan([0.5, 1.0, 0.5, 1], this);
    }
    jprocess(delta)
    {
        this.moverelpos();
    }
    moverelpos()
    {
        lScene.setscan(this);
    }
}


// The base of all things

// Size of spheres is messeared in mega meters
// Scale is to decide how far.
class SphereBase {
    constructor(struct, dist, scancolor)
    {
        this.obj = new LObject(struct, this);
        this.scale = 1;
        this.fixed = true;
        lScene.lPlace(this.obj, mat4.create());
        this.dist = dist;

        if (lScene.injump) {
            this.scan = new Scan(scancolor, this);
        }
    }

    makereal()
    {
        this.vobj = new LVirtObject(this, this.obj.x, this.obj.y, this.obj.z, this.dist);
        this.vobj.ignore = false;
        this.vobj.mkvisible(true);
        lScene.lCAdd(this.vobj);
    }

    setscene(x, y, z, scale, fixed)
    {
        this.scale = scale;
        this.fixed = fixed;
        this.obj.x = x;
        this.obj.y = y;
        this.obj.z = z;
        this.obj.mkvisible(true);
        this.obj.procpos();
    }

    moverelpos()
    {
        // This only in jump mode
        lScene.setscan(this);
    }
    jprocess(delta)
    {
        this.moverelpos();
    }
}

class MinistationBase extends SphereBase {
    constructor(struct) {
        super(struct, 0.05); // Collision within 0.5 KM
    }

    process(delta)
    {
        this.obj.rotate(0, 0, delta * STATION_ROTATE);
        this.obj.procpos();
    }
}

function base_structures(assets)
{
    structures.cockpit = cockpitDef(assets);
    structures.scan = scanDef();
    structures.explosion = explosionDef();
    structures.explbig = explbigDef();
    structures.explmid = explmidDef();
    structures.expllit = expllitDef();
    structures.laser = laserDef();
}

export { SLOTSIZE_2_2, SLOTSIZE_3_3, SLOTSIZE_6_3, SLOTSIZE_8_5, SLOTSIZE_8_15, SLOTSIZE_MAX, SLOTS, HOLDPOS,
    ETRADER, ESMUGGLER, EHUNTER, EPIRATE, EMINER, EPOLICE, EHERMIT,  ETRANSPORT, ETHARGOID, ESOLO, ECM_DELAY,
    ThingBase, AsteroidBase, BoulderBase, FlotsamBase, EscapeBase, PersonBase, NPCBase, JohnDoeBase, PoliceBase, BadAssBase, StationBase, MinistationBase,
    Scan, MockScan, Slots, Parked, Autodock, ExplosionPart, Explosion, Laser, ThargoidBase, ThargonBase, 
    MissileBase, RadarBeam, VirtStation, SphereBase, CockpitBase, base_structures, g_prng, g_prngd, BASEDIR };


