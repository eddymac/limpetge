"use strict";

const BASEDIR = "kronky/";

const MFORWARD = 0x00000001;
const MBACK    = 0x00000002;
const MLEFT    = 0x00000004;
const MRIGHT   = 0x00000008;
const MJUMP    = 0x00000010;

const NOOP     = 0x00000020;


const RLEFT    = 0x00000100;
const RRIGHT   = 0x00000200;
const RUP      = 0x00000400;
const RDOWN    = 0x00000800;

const OPICK    = 0x00010000;
const ODROP    = 0x00020000;
const OFIRE    = 0x00040000;
const OCHUCK   = 0x00080000;



const CRESET   = 0x01000000;
const CSAVE    = 0x02000000;
const CRESTORE = 0x04000000;
const CHELP    = 0x08000000;

const COMMANDS = 0x0F000000;

const CFORWARD = 0x10000000;
const CRECORD  = 0x20000000;
const CPLAY    = 0x40000000;

const CEND     = 0x80000000;

const WALLADS = BASEDIR + "wallads.jpg";
const SLICK = BASEDIR + "slick1.jpg";
const SKY = BASEDIR + "sky.jpg";
const KEXIT = BASEDIR + "kexit.jpg";
const KFLOOR = BASEDIR + "kfloor.jpg";
const KRFLOOR = BASEDIR + "krfloor.jpg";

const SQRT2 = Math.sqrt(2);
const SQRT2x2 = SQRT2 * 2;

const g_assets = new LAssets({
    whoosh: BASEDIR + "sounds/whoosh.wav",
    pickupflower: BASEDIR + "sounds/pickupflower.wav",
    lift: BASEDIR + "sounds/lift.wav",
    flush1: BASEDIR + "sounds/flush1.wav",
    pickup: BASEDIR + "sounds/pickup.wav",
    drophere: BASEDIR + "sounds/drophere.wav",
    chuck: BASEDIR + "sounds/chuck.wav",
    unlock: BASEDIR + "sounds/unlock.wav",
    smash: BASEDIR + "sounds/smash.wav",
    splash: BASEDIR + "sounds/splash.wav",
    gong: BASEDIR + "sounds/gong.wav",
    rocket: BASEDIR + "sounds/rocket.wav",
    thud: BASEDIR + "sounds/thuda.wav",
    kkstart: BASEDIR + "sounds/kkstart.wav",
    kkplay: BASEDIR + "sounds/kkplay.wav",
    door: BASEDIR + "sounds/door.wav",
    cagefly: BASEDIR + "sounds/cagefly.wav",
    pushme: BASEDIR + "sounds/pushme.wav",
    click: BASEDIR + "sounds/click.wav",
    clunk: BASEDIR + "sounds/clunk.wav",
    hit: BASEDIR + "sounds/hit.wav",
    footstep: BASEDIR + "sounds/footstep.wav",
    fanfare: BASEDIR + "sounds/fanfare.wav",
    zip: BASEDIR + "sounds/zip.wav",
    ratchet: BASEDIR + "sounds/ratchet.wav",
    rumble:  BASEDIR + "sounds/rumble.wav",
    landing: BASEDIR + "sounds/landing.wav",
    twang: BASEDIR + "sounds/twang.wav",
    bump: BASEDIR + "sounds/bump.wav",
    shuffle:  BASEDIR + "sounds/shuffle.wav",
    csave: BASEDIR + "sounds/csave.wav",
    crestore: BASEDIR + "sounds/crestore.wav",
    ticktock: BASEDIR + "sounds/ticktock.wav",
});


const sounds = { };

function g_loadassets()
{
    function onend()
    {
        document.getElementById("playbutton").disabled=false;
        document.getElementById("onloading").innerText = "All assets Loaded";

        var ass = g_assets.data;

        sounds.whoosh = new LAudios(ass.whoosh, 1, 1);
        sounds.pickupflower = new LAudios(ass.pickupflower, 1, 2);
        sounds.lift = new LAudios(ass.lift, 5, 3);
        sounds.flush = new LAudios(ass.flush1, 1, 4);
        sounds.pickup = new LAudios(ass.pickup, 5, 5);
        sounds.drophere = new LAudios(ass.drophere, 5, 6);
        sounds.chuck = new LAudios(ass.chuck, 5, 7);
        sounds.unlock = new LAudios(ass.unlock, 5, 8);
        sounds.smash = new LAudios(ass.smash, 5, 9);
        sounds.splash = new LAudios(ass.splash, 5, 10);
        sounds.gong = new LAudios(ass.gong, 1);
        sounds.rocket = new LAudioLoop(ass.rocket);
        sounds.thud = new LAudios(ass.thud, 5);
        sounds.kkstart = new LAudios(ass.kkstart, 5);
        sounds.kkplay = new LAudios(ass.kkplay, 5);
        sounds.door = new LAudioLoop(ass.door);
        sounds.cagefly = new LAudioLoop(ass.cagefly);
        sounds.pushme = new LAudios(ass.pushme, 5);
        sounds.click = new LAudios(ass.click, 5);
        sounds.clunk = new LAudios(ass.clunk, 5);
        sounds.hit = new LAudios(ass.hit, 5);
        sounds.footstep = new LAudios(ass.footstep, 5);
        sounds.fanfare = new LAudios(ass.fanfare, 5);
        sounds.zip = new LAudioLoop(ass.zip);
        sounds.ratchet = new LAudioLoop(ass.ratchet);
        sounds.rumble = new LAudioLoop(ass.rumble);
        sounds.landing = new LAudios(ass.landing, 5);
        sounds.twang = new LAudios(ass.twang, 5);
        sounds.bump = new LAudios(ass.bump, 1);    // Intentionally 1
        sounds.shuffle = new LAudioLoop(ass.shuffle);
        sounds.csave = new LAudios(ass.csave, 1);
        sounds.crestore = new LAudios(ass.crestore, 1);
        sounds.ticktock = new LAudioLoop(ass.ticktock);
        var llen = cLevels.length;
        var sel = document.getElementById("kronkylevel");

        for(var i = 0; i < llen; i++)
        {
            var atts = {value: i};
            if(i == 0) atts.selected = "selected";
            sel.appendChild(lElement("option", atts, (i + 1).toString() + ": " + cLevels[i].description));
        }
    }

    function inprogress()
    {
        document.getElementById("onloading").innerText = g_assets.succeeded.toString() + " out of " + g_assets.total.toString() + " assets Loaded";
    }

    g_assets.download({onend:onend, inprogress:inprogress});
}

var g_LevelNum = 0;
var cLevelPlaying = true;
var gCloseGame = false;

function BaseThing(structure, shadind, x, y, z, ry)
{
    this.islive = false;
    this.isfloor = false;
    this.iswire = false;

    this.obj = new LWObject(structure[0], this);
    this.aobj = new LObject(structure[1], this);
    this.iscarried = null;
    this.isstanding = true;

    if(shadind) {
        this.obj.mkvisible(false);
        this.shadowobj = new LObject(structs.shadowStruct, this);
        this.obj.addChild(this.shadowobj, mat4.create());
        this.shadowobj.mkvisible(true);
    }

    this.standrot = 0;

    this.obj.addChild(this.aobj, mat4.create());
    lScene.lAddChild(this.obj, mat4.create());
    this.place(x, y, z, ry);

    this.canpickup = true;
    lScene.pickups.push(this);
    lScene.animates.push(this);


    this.chuckheight = 0;
    this.ischucking = false;
    this.chuckby = null;
    this.chuckcoll = new LVirtObject(this, 0, 0, 0, 0.2);
    this.dropcoll = new LVirtObject(this, 0, 0, 0, 0.2);
    this.chuckry = 0;

    this.statestatic = false;

    this.istravel = false;
    this.iscage = false;
}

BaseThing.prototype = {
    constructor: BaseThing,
    save: function()
    {
        var obj = this.obj;
        var ret = {
                 obj: this.obj.save(),
                 islive: this.islive,
                 ischucking: this.ischucking,
                 chuckvel: this.chuckvel,
                 chuckry: this.chuckry,
                 iscarried: this.iscarried,
                 isstanding: this.isstanding,
                 canpickup: this.canpickup};
        this.vsave(ret);
        return ret;
        
    },

    vsave: function(ret) {},       // Virtual function to save specific stuff

    restore: function(saved)
    {
        this.obj.restore(saved.obj);

        this.islive = saved.islive;
        this.canpickup = saved.canpickup;
        this.isstanding = saved.isstanding;

        this.ischucking = saved.ischucking;
        this.chuckvel = saved.chuckvel;
        this.chuckry = saved.chuckry;

        // Carrying modified after restorestate

        this.iscarried = saved.iscarried;

        /*
        if(saved.iscarried) {
            saved.iscarried.carrying = this;
            this.pickup(saved.iscarried);
        } else {
            this.iscarried = null;
            this.aobj.moveHere(0, 0, 0);
            if(this.isstanding)
                this.shadowobj.mkvisible(true);
        }
        */
        this.vrestore(saved);
    },

    vrestore: function(saved) {},

    pickup: function(pobj) {
        // if(this.iscarried) 
            // pobj.carrying = null;
        this.iscarried = pobj;
        this.isstanding = false;
        this.shadowobj.mkvisible(false);
        this.aobj.rotateHere(0, 0, 0);

        this.ischucking = false;

        sounds.pickup.play();
        if(pobj instanceof Player) {
            this.aobj.moveHere(0.2, -0.4, -0.1);
        }
        else if(pobj instanceof Kronky) {
            this.aobj.moveHere(0.3, -0.8, -0);;
             pobj.rtarm.rotateHere(-LR90 / 2, LR90 / 2, LR90 / 2);
             pobj.rbarm.rotateHere(LR90, 0, 0);
             pobj.ltarm.rotateHere(LR90 / 1.6, -LR90 / 2, LR90 / 4);
             pobj.lbarm.rotateHere(LR90 / 2.4, LR90 / 2, LR90 / 4);
             // pobj.ltarm.rotateHere(LR90 / 2, LR90 / 2, -LR90 / 2);
             // pobj.lbarm.rotateHere(-LR90, 0, 0);
             // pobj.rtarm.rotateHere(-LR90 / 1.6, -LR90 / 2, -LR90 / 4);
             // pobj.rbarm.rotateHere(-LR90 / 2.4, LR90 / 2, -LR90 / 4);
        }

        //mat4.translate(mb, mb, vec4.fromValues(-.3, -.8, 1.0, 1.0));
        // mat4.translate(mb, mb, vec4.fromValues(0, 0, 1.5, 1.0));
        // mat4.translate(mb, mb, vec4.fromValues(.2, -.4, -1.5, 1.0));
        // mat4.translate(mb, mb, vec4.fromValues(0, 0, -1.5, 1.0));
    },

    resetpickup: function(pobj)
    {
       this.iscarried = null;
       this.isstanding = true;
       this.shadowobj.mkvisible(true);
    },


    place: function(x, y, z, ry)
    {
        this.islive = true;
        this.obj.moveHere(x, y, z);
        this.obj.rotateHere(0, ry, 0);
        this.obj.rotate(LR90, 0, 0);
        this.obj.mkvisible(true);
        this.shadowobj.mkvisible(true);
        this.isstanding = true;
        this.obj.procpos();
    },

    chuck: function(person)
    {
        var pobj = person.obj;
        var obj = this.obj;

        pobj.ignore = true;
        obj.ignore = true;

        this.aobj.moveHere(0, 0, 0);

        obj.moveHere(pobj.x, pobj.y, pobj.z);
        obj.rotateFlatHere(0, pobj.ry, 0);

        obj.warp();

        obj.moveFlat(0, 0, -1);
        var hit = false;
        function cback(cob) {
            if((!cob.control.isfloor) && (!cob.control.iswire) && (!cob.control.iscage)) hit = true;
        }
        lScene.lCAllPointDetect(obj, 0.2, cback);
        pobj.ignore = false;
        obj.ignore = false;
        if(hit) {
            person.carrying = null;
            this.end();
            sounds.smash.play();
            return(false);
        }
            
        this.ischucking = true;
        this.chuckby = person;
        this.chuckvel = 4.5;

        this.chuckcoll.relative(this.obj, 0, -2.5, 0);
        this.chuckry = obj.ry;

        person.carrying = null;
        this.iscarried = null;

        person.displaydrop();

        this.canpickup = true;

        sounds.chuck.play();

        return true;
        
    },

    chucking: function(delta)
    {

        // Save distance to floor on old 
        // Going up - above peoples heads if over 0.2 (unlikey)
        // Going down - start height and end height
        // Know distance to floor at end of flight
        // Work out distance at start
        var obj = this.obj;

        this.chuckcoll.relative(obj, 0, 0, 0);

        obj.rotateFlatHere(0, this.chuckry, 0);
        obj.rotateFlat(Math.atan(this.chuckvel / 10), 0, 0);
        obj.moveFlat(0, this.chuckvel * delta, -delta * 6);

        this.chuckvel -= (delta * 6);
        this.obj.procpos();


        //Now for collision
        this.chuckby.obj.ignore = true;
        obj.ignore = true;
        var hit = false;
        var dfloor = 100;
        var fits = false;
        var self = this;

        function cback(cob) {
            if(cob.control.isfloor) {
                dfloor = obj.y - cob.y;
                if(dfloor < -2.4) {
                    hit = true;
                }
            } else if(self.fits(cob.control)) {
                fits = true;
            } else if ((!cob.control.iswire) && (!cob.control.iscage)) {
                hit = true;
            }
        }

        lScene.lCAllPointDetect(obj, 0.2, cback);
        obj.ignore = false;
        this.chuckby.obj.ignore = false;

        if(fits) {
            this.ischucking = false;
            this.obj.procpos();
            return;
        }

        if(hit) {
            // SMASH
            sounds.smash.play();
            this.end();
            return;
        }

        if (obj.y < -7.5) {
            sounds.splash.play();
            this.end();
            return;
        }

        // If got to here, dfloor is where the object has ended
        // The way this works, the object is going DOWN at this point

        if(dfloor < 0) { // We know it will be >= -2.4
            function acback(cob)
            {
                if(!cob.control.isfloor) {
                    if(self.fits(cob.control)) {
                        fits = true;
                    } else if ((!cob.control.iswire) && (!cob.control.iscage)) {
                        hit = true;
                    }
                }
            }
            hit = false;

            this.chuckcoll.relative(obj, 0, dfloor, 0);
            // Horixontal only
            this.chuckcoll.y = obj.y - dfloor;
            this.chuckcoll.oy = this.chuckcoll.y;
            obj.ignore = true;
            this.chuckby.obj.ignore = true;
            lScene.lCAllPointDetect(this.chuckcoll, 0.2, acback);
            obj.ignore = false;
            this.chuckby.obj.ignore = false;
            if(fits) {
                this.ischucking = false;
                this.obj.procpos();
                return;
            }
            if(hit) {
                // SMASH
                this.end();
                return;
            }
        }
    },

    end: function()
    {
        this._baseend();
    }, 

    _baseend: function()
    {
        this.islive = false;
        this.obj.mkvisible(false);
        if(this.iscarried) {
            this.iscarried.carrying = null;
            this.iscarried.displaydrop();
            this.iscarried = null;
        }
        this.obj.procpos();
    },
    

    drophere: function(pobj, x, y, z, ry)
    {
        if(this.iscarried) {

            var obj = this.obj;
            var ma = mat4.create();
            var mb = mat4.create();
            var va = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

            mat4.fromYRotation(mb, ry)
            mat4.translate(mb, mb, vec4.fromValues(0, 0, -0.61, 1.0));
            vec4.transformMat4(va, va, mb);

            x += va[0];
            y += va[1];
            z += va[2];

            // TODO - Test to see if floor

            var canhere = false;
            var nothere = false;
            function _see(cob)
            {
                if(cob.control.isfloor) {
                    if(cob.control.candrop) {
                        canhere = true;
                    } else {
                        lScene.lMessage("Cannot place object on this floor");
                        canhere = false;
                    }
                } else if (!cob.control.iscage) {
                   lScene.lMessage("Cannot place object here");
                    nothere = true;
                }
            }

            obj.ignore = true;
            pobj.ignore = true;

            this.dropcoll.setPosition(x, y, z);

            lScene.lCAllPointDetect(this.dropcoll, 0.2, _see);

            obj.ignore = false;
            pobj.ignore = false;

            if((!canhere) || nothere) return false;

            this.aobj.moveHere(0, 0, 0);
            obj.moveHere(x, y, z);
            // obj.rotateHere(0, ry, 0);
            obj.rotateHere(LR90, 0, 0);
            this.iscarried = null;
            this.shadowobj.mkvisible(true);
            obj.procpos();

            sounds.drophere.play();

            return true;
        } else {
            return false;
        }
    },


    animate: function(delta)
    {
        if(!this.islive) return;
        if(this.iscarried) return;

        // Chucking - ry is direction
        if(this.ischucking)
        {
            this.chucking(delta);

        } else {

            this.standrot -= delta;
            if(this.standrot < 0) this.standrot += LR360
            this.aobj.rotateHere(0, 0, -this.standrot);
            this.aobj.procpos();
        }
    },
    fits: function(xobj) {return false;},

    kronkycarry: function(kronky)
    {
        var obj = this.obj;
        var crobj = kronky.obj;

        var ma = mat4.create();
        var mb = mat4.create();
        var va = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        mat4.fromYRotation(mb, crobj.ry)
        //mat4.translate(mb, mb, vec4.fromValues(-.3, -.8, 1.0, 1.0));
        mat4.translate(mb, mb, vec4.fromValues(0, 0, -1.0, 1.0));
        vec4.transformMat4(va, va, mb);

        obj.moveHere(crobj.x + va[0], crobj.y + va[1], crobj.z + va[2]);
        obj.rotateFlatHere(0,  crobj.ry, 0);
        // obj.rotateFlat(crobj.rx, 0, 0);

        obj.procpos();
    },

    playercarry: function(person)
    {
        var obj = this.obj;

        var ma = mat4.create();
        var va = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

        mat4.fromYRotation(ma, lCamera.ry);
        mat4.translate(ma, ma, vec4.fromValues(0, 0, -1.0, 1.0));
        vec4.transformMat4(va, va, ma);


        obj.moveHere(lCamera.x + va[0], lCamera.y + va[1], lCamera.z + va[2]);
        obj.rotateFlatHere(0, lCamera.ry, 0);
        obj.procpos();
    },

    fire: function(person) {},
}

function Person()
{
    this.dojump = false;
    this.carrying = null;
    this.pmode = 0;
    this.travelling = null;
    this.zipdist = 0;
    this.okctrl = 0;
    this.swing = 0;
    this.isshuffling = false;
    this.picked = false;
}

Person.prototype = {
    constructor: Person,

    move: function(x, y, z)
    {
        this.obj.moveFlat(x, y, z);
        this.obj.procpos();
    },

    rotateFlat: function(rx, ry)
    {
        this.obj.rotateFlat(rx, ry);
    },

    bounce: function(delta)
    {
        this.vvel = -(delta + (this.vvel * 0.8));
    },

    fall: function(delta)
    {
        this.vvel -= delta;
        return this.vvel * delta;
    },

    seeswing: function(z)
    {
        if(z == 0) {
            this.stopswing();
        } else {
            this.swingarms(z);
        }
    },

    swingarms: function(delta)
    {
        var nswing = this.swing + (delta * 2);
        if(this.swing >= 4)
        {
            nswing -= 4;
            sounds.footstep.play();
        }
        else if(this.swing < 0)
        {
            sounds.footstep.play();
            nswing += 4;
        } else if (this.swing <= 2 && nswing > 2) {
            sounds.footstep.play();
        } else if (this.swing >= 2 && nswing < 2) {
            sounds.footstep.play();
        }

        this.swing = nswing;
    }, 
    stopswing: function() {},

    pickupobj: function()
    {
        if(this.carrying) {
            if(!this.picked) {
                if(this instanceof Player) {
                    lScene.lMessage("Need to drop what you are holding first...");
                }
            }
            return;
        }
        var obj = this.obj;
        this.carrying = lScene.findpickup(obj.x, obj.y, obj.z, obj.ry);
        if(this.carrying) {
            this.picked = true;
            if(this.carrying.iscarried) {
                var cac = this.carrying.iscarried;  // BUG - iscarried is "this" - the kronky
                cac.carrying = null;
                cac.displaydrop();
                this.carrying.iscarried = null;
            }
            this.carrying.pickup(this);
        }
    },
    drophereobj: function()
    {
        if(!this.carrying) return;
        if(this.ride) return;
        var obj = this.obj;
        if(this.carrying.drophere(this, obj.x, obj.y, obj.z, obj.ry))
        {
            this.carrying = null;
            this.displaydrop();
        }
    },
    displaydrop: function() {},
    displayzip: function(zip) {},
    zipstart: function(zip) {},
    zipend: function(zip) {},
    zipgo: function(zip) {},

    loop: function(delta, nkctrl)
    {

        var obj = this.obj;
        var x = 0;
        var y = 0;
        var z = 0;
        var rx = 0;
        var ry = 0;
        var rz = 0;

        var ya = 0;

        var dmove = delta;
        var move = dmove * 2

        var dojump = false;
        var shuffling = false;

        if((nkctrl & OPICK) != 0)
            this.pickupobj();
        else if(this.picked)
            this.picked = false;
        if((nkctrl & ODROP) != 0) this.drophereobj();

        if((nkctrl & RLEFT) != 0) {ry += dmove; shuffling = true; }
        if((nkctrl & RRIGHT) != 0) {ry -= dmove; shuffling = true; }
        if((nkctrl & RUP) != 0) rx += dmove;
        if((nkctrl & RDOWN) != 0) rx -= dmove;
        if((nkctrl & MFORWARD) != 0) z -= move;
        if((nkctrl & MBACK) != 0) z += move;
        if((nkctrl & MLEFT) != 0) {x -= move; shuffling = true; }
        if((nkctrl & MRIGHT) != 0) {x += move; shuffling = true; }
        if((nkctrl & MJUMP) != 0)
        {
            if(!this.dojump)
            {
                dojump = true;
                this.dojump = true;
            }
        } else {
            this.dojump = false;
        }

        if(shuffling) {
            if(!this.isshuffling) {
                this.isshuffling = true;
                sounds.shuffle.play();
            }
        } else {
            if(this.isshuffling) {
                this.isshuffling = false;
                sounds.shuffle.pause();
            }
        }
        if((nkctrl & OFIRE) != 0) {
            if ((this.okctrl & OFIRE) == 0) {
                if(this.carrying) {
                    this.carrying.fire(this);
                }
            }
        }
        if((nkctrl & OCHUCK) != 0) {
            if ((this.okctrl & OCHUCK) == 0) {
                if(this.carrying) {
                    this.carrying.chuck(this);
                }
            }
        }

        if(this.islift) {
            sounds.lift.play();
            this.vvel = .5;
            this.hvel = 1;
            this.hry = this.obj.ry;
        }

        if((nkctrl & CRECORD) != 0) {
            if ((this.okctrl & CRECORD) == 0) {
                this.lrecord(delta, nkctrl);
            }
        }


        if((nkctrl & CPLAY) != 0) {
            if ((this.okctrl & CPLAY) == 0) {
                this.lplay(delta, nkctrl);
            }
        }

        this.okctrl = nkctrl;

        if(this.travelling) {
            this.travelling.travel(this, delta, x, z, rx, ry);
            return true;
        }

        // Moving
        var dfloor = 100;
        var moveback = false;

        var vvel = this.vvel;

        if(this.ride) {
            obj.rotateFlat(rx, ry);
            this.ride.riding(this, delta);
            if(obj.x > 1000 || obj.x < -1000 || obj.z > 1000 || obj.z < -1000 || obj.y < -7.5)
            {
                sounds.splash.play();
                this.die();
            }
            return false;
        }

        obj.moveFlat(x, vvel, z);
        this.seeswing(z);
        obj.procpos();

        if(obj.y < -7.5) {
            sounds.splash.play();
            this.die();
            return false;
        }

        this.carrything();

        var pinst = this.cbinst;
        pinst.reset(this);
        var dfloor = 0;

        if(this.carrying) {
            this.rotateFlat(rx, ry);
            obj.procpos();

            var acarry = this.carrying;
            var carryobj = acarry.obj;

            function nacback(cob) {pinst.empty(cob);}
            function cacback(cob) {pinst.carry(cob);}

            carryobj.ignore = true;
            obj.ignore = true;
            lScene.lCAllPointDetect(obj, 0.2, nacback);
            dfloor = pinst.dfloor;
            lScene.lCAllPointDetect(carryobj, 0.2, cacback);
            carryobj.ignore = false;
            obj.ignore = false;

            if(pinst.moveback) {
                if(this.carrying) {
                    if(pinst.wire) {
                        sounds.twang.play();
                    } else {
                        sounds.bump.play();
                    }
                }
                // obj.moveFlat(-x, vvel * delta, -z);
                obj.moveFlat(-x, 0, -z);
                // this.vvel = 0;
                this.rotateFlat(-rx, -ry);
                obj.procpos();
            }
        } else {

            function ncback(cob) {pinst.empty(cob);}
            obj.ignore = true;
            lScene.lCAllPointDetect(obj, 0.2, ncback);
            obj.ignore = false;
            dfloor = pinst.dfloor;
            if(pinst.moveback) {
                if(pinst.wire) {
                    sounds.twang.play();
                } else {
                    sounds.bump.play();
                }
                obj.moveFlat(-x, 0, -z);
                // obj.moveFlat(-x, vvel * delta, -z);
                // this.vvel = 0;
            }
            this.rotateFlat(rx, ry);
            obj.procpos();
        }

        this.islift = pinst.islift;

        if(pinst.onbridge) {
            pinst.onbridge.onthis();
        }

        if(pinst.travelling) {
            this.travelling = pinst.travelling;
            this.travelling.start(this);
            return;
        }

        var canjump = false;

        if(dfloor == 0) {
            // On the floor!
            canjump = true;
            if(vvel != 0)  {
                sounds.thud.play();
                this.vvel = 0;
            }
        } else if (dfloor < 0) {
            // Just unbder floor, gone too far
            // Should never have hit anything else here
            obj.moveHere(obj.x, pinst.wy, obj.z);  // Gone too far, fix, do this way to stop round thrashing
            obj.procpos();
            if(vvel != 0) {
                sounds.thud.play();
                 this.vvel = 0;
            }
            canjump = true;
        } else {
            // Falling - have a look at objects below me that are not floor

            // TODO - Simplify, have a point on head as per normal for floor,
            // and a point at feet for anything else

            // Might miss dynamics, but basically do not are
            // If either feet or head it then OK

            this.fall(delta); // Fall

            var jcoll = this.jumpcoll;
            var notfall = false;

            function _seej(cob)
            {
                var control = cob.control;
                if((!(control.isfloor)) && (!(control instanceof Lift)) && (!(control.iscage))) 
                {
                    notfall = true;
                }
            }
            obj.ignore = true;
            if(dfloor > 1)  {
                jcoll.relative(obj, 0, -2.5, -0);
                lScene.lCAllPointDetect(jcoll, 0.2, _seej);
                if(notfall) {
                    obj.moveFlat(0, -vvel, 0);
                    obj.procpos();
                    this.bounce(delta);
                }
            } else {
                // Not landing on anything - bounce back
                jcoll.relative(obj, 0, -dfloor, -0);
                lScene.lCAllPointDetect(jcoll, 0.2, _seej);
                if(notfall) {
                    // This should only happen if we are jumping "into" something
                    // This means x and/or z should be something
                    // If not, make it so
                    if(x == 0 && z == 0) z = -move;
                    obj.moveFlat(-x, -vvel, -z);
                    obj.procpos();
                    this.bounce(delta);
                }
            }
            obj.ignore = true;
        }

        if(canjump && dojump) this.jump();
    },

    /*
     * Ridecoll does various collision tests
     */

    ridecoll: function(z)
    {
        var pobj = this.obj;
        var wobj = this.carrying.obj;

        pobj.moveFlat(0, 0, z);
        pobj.procpos();
        pobj.ignore = true;
        wobj.ignore = true;
        this.carrything();

        var hit = false;
        var wire = false;
        var above = 0;
        var alevel = -1;
        var hitflower = null;
        var hitrocket = null;       // Only used if hit a travelling rocket

        function  _common(control)
        {
            if(control instanceof Flower)
                hitflower = control;
            else if(control instanceof Rocket) {
                if(control.isfired) {
                    hitrocket = control;
                }
            } else if (control instanceof Person) {
                if(control.ride) {
                    hitrocket = control.ride;
                }
            }
        }

        function _pcback(cob)
        {
            var control = cob.control;
            if(control.isfloor) {
                // We shoul be travelling parralell to ground
                if(cob.y != pobj.y) {
                    if(pobj.y < cob.y)  // Below 2.5 meters
                        alevel = cob.y;
                    else
                        above = cob.y - pobj.y;
                }
            } else if(!control.istravel) {
                hit = true;
                if (control.iswire)
                    wire = true;
                else
                    _common(control);
            }
        }

        function _wcback(cob)
        {
            var control = cob.control;
            if((!control.isfloor)  && (!control.iswire) && (!control.istravel)) {
                hit = true;
                _common(control);
            } 
        }

        var ox = pobj.ox;
        var oz = pobj.oz;
        lScene.lCAllPointDetect(pobj, 0.2, _pcback);
        if(!hit) {
            if(above > 0) {     // See if my feet have hit something
                var jcoll = this.jumpcoll;
                jcoll.x = pobj.x;
                jcoll.z = pobj.z;
                jcoll.y = pobj.y - above;
                jcoll.ox = ox;
                jcoll.oz = oz;
                jcoll.oy = y - above;
                lScene.lCAllPointDetect(jcoll, 0.2, _pcback);
            }
            if(!hit)
            {
                lScene.lCAllPointDetect(wobj, 0.2, _wcback);
            }
        }
        wobj.ignore = false;
        pobj.ignore = false;
        return {hit: hit, wire: wire, above: above, alevel: alevel, hitflower: hitflower, hitrocket: hitrocket};
    },

    ridelevel(y)
    {
        var pobj = this.obj;
        var wobj = this.carrying.obj;

        if(wobj) {
            var wy = y - pobj.y;
            wobj.moveFlatHere(wobj.x, wobj.y + wy, wobj.z);
            wobj.procpos();
        }
        pobj.moveFlatHere(pobj.x, y, pobj.z);
        pobj.procpos();
    },

    ridemove(z)
    {
        var pobj = this.obj;
        // var wobj = this.carrying.obj;

        pobj.moveFlat(0, 0, z);
        pobj.procpos();
        this.carrything();
    },
    rideheight(y)
    {
        var pobj = this.obj;
        // var wobj = this.carrying.obj;

        pobj.moveHere(pobj.x, y, pobj.z);
        pobj.procpos();
        this.carrything();
    },
    end: function()
    {
        this.die();
    },
}

function eKronkyStructure()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.3});
    var stru = new LStructureDef(ShaderSimple, {color: vec4.fromValues(0.3, 0.2, 0.1, 1.0), collision: LNONE});
    stru.addCylinder({position: lFromXYZPYR(0, 0, 0, LR90, 0, 0), radius: 0.2, depth: 0.2})
    stru.addCylinder({position: lFromXYZPYR(0, 0, 0, 0, LR90, 0), radius: 0.2, depth: 0.2})
    stru.addBlock({position: lFromXYZPYR(-0.19, 0, 0.6, 0, 0, 0), size: [0.01, 0.1, .6]})
    stru.addPolygon({position: lFromXYZPYR(0.01, 0, .95, LR90, 0, 0), coords: [[-0.19, -0.24], [-0.19, -.25], [0.19, .24], [0.19, .25]], depth: 0.1});
    stru.addPolygon({position: lFromXYZPYR(0.01, 0, .45, -LR90, 0, 0), coords: [[-0.19, -0.24], [-0.19, -.25], [0.19, .24], [0.19, .25]], depth: 0.1});
    return [gdef, stru];
}

function EKronky(x, y, z, ry)
{
    BaseThing.call(this, structs.EKronky, true, x, y, z, ry);
    lScene.stateobjs.push(this);
    this.active = true;
}

EKronky.prototype = Object.assign(Object.create(BaseThing.prototype), {
    constructor: EKronky,

    pickup: function(person)
    {
        person.carrying = null;
        this.obj.mkvisible(false);
        if(person instanceof Player) {
            if(this.active) {
                this.active = false;
                lScene.numkronky += 1;
                g_total.innerText = lScene.numkronky;
                lScene.lMessage("**** New Kronky charge added ****", "lightgreen");
                sounds.fanfare.play();
            } else {
                lScene.lMessage("Already added this Kronky charge unit");
            }
        }
    },

    drophere: function(pobj, x, y, z, ry) {},

    vsave: function(ret)
    {
        ret.active = this.active;
    },
    vrestore: function(saved)
    {
        // Only make unactive here if swapping kronnkies
        if(lScene.kswap) {
            if(!saved.active) 
                this.active = false;
        } else {
            this.active = saved.active;
        }
    },

    respawn: function() { },
});



function kronkyStructure()
{
    var stru = new LStructureDef(ShaderSimple, {color: vec4.fromValues(0.3, 0.2, 0.1, 1.0), collision: LDYNAMIC, distance: 0.3});

    var fbody = [
        [[0.25, 0.3, -0.05], [0.25, 0.4, -0.05], [-0.25, 0.4, -0.05], [-0.25, 0.3, -0.05]],
        [[0.25, 0.2, -0.05], [0.25, 0.4, -0.55], [-0.25, 0.4, -0.55], [-0.25, 0.2, -0.05]],
        [[0.25, 0.0, -0.05], [0.25, 0.0, -0.35], [-0.25, 0.0, -0.35], [-0.25, 0.0, -0.05]],
        [[0.25, -0.3, -0.05], [0.25, -0.3, -0.35], [-0.25, -0.3, -0.35], [-0.25, -0.3, -0.05]],
        ];

    var bbody = [
        [[-0.25, 0.3, 0.05], [-0.25, 0.4, 0.0], [0.25, 0.4, -.0], [0.25, 0.3, 0.05]],
        [[-0.25, 0.1, 0.05], [-0.25, 0.4, 0.20], [0.25, 0.4, 0.20], [0.25, 0.1, -0.05]],
        [[-0.25, -0.1, 0.05], [-0.25, -0.1, 0.20], [0.25, -0.1, 0.20], [0.25, -0.1, 0.05]],
        [[-0.25, -0.3, 0.05], [-0.25, -0.3, 0.20], [0.25, -0.3, 0.20], [0.25, -0.3, 0.05]],
        ];

    var lbody = [
        [[-0.25, 0.3, -0.05], [-0.25, 0.2, 0.0], [-0.25, 0.3, 0.05]],
        [[-0.25, 0.2, -0.05], [-0.25, 0.2, -0.0], [-0.25, 0.1, 0.05]],
        [[-0.25, 0.0, -0.05], [-0.25, 0.0, -0.0], [-0.25, -0.1, 0.05]],
        [[-0.25, -0.3, -0.05], [-0.25, -0.3, 0.0], [-0.25, -0.3, 0.05]]
    ];

    var rbody = [
        [[0.25, 0.3, 0.05], [0.25, 0.2, 0.0], [0.25, 0.3, -0.05]],
        [[0.25, 0.2, 0.05], [0.25, 0.2, 0.0], [0.25, 0.1, -0.05]],
        [[0.25, 0.0, 0.05], [0.25, 0.0, 0.0], [0.25, -0.1, -0.05]],
        [[0.25, -0.3, 0.05], [0.25, -0.3, 0.0], [0.25, -0.3, -0.05]]
    ];

    var tbody = [
        [[0.25, 0.3, 0.05], [0.25, 0.4, 0.0], [-0.25, 0.4, 0.0], [-0.25, 0.3, 0.05]],
        [[0.25, 0.3, -0.05], [0.25, 0.4, -0.05], [-0.25, 0.4, -0.05], [-0.25, 0.3, -0.05]],
    ];

    var ubody = [
        [[-0.25, -0.3, 0.05], [-0.25, -0.3, 0.20], [0.25, -0.3, 0.20], [0.25, -0.3, 0.05]],
        [[-0.25, -0.3, 0.05], [-0.25, -0.8, 0.20], [0.25, -0.8, 0.20], [0.25, -0.3, 0.05]],
        [[-0.25, -0.3, -0.05], [-0.25, -0.8, -0.35], [0.25, -0.8, -0.35], [0.25, -0.3, -0.05]],
        [[-0.25, -0.3, -0.05], [-0.25, -0.3, -0.35], [0.25, -0.3, -0.35], [0.25, -0.3, -0.05]],
        ];

    var headaf = [
        [[0.2, 0.0, 0.0], [0.2, 0.15, 0.0], [0.15, 0.3, 0.0], [0.0, 0.3, 0.0]],
        [[0.2, -0.15, 0.0],[0.2, 0.0, -0.3], [0.0, 0.3, -0.3],   [-0.15, 0.3, 0.0]],
        [[0.15, -0.3, 0.0], [0.0, -0.3, -0.5], [-0.2, 0.0, -0.5], [-0.2, 0.15, 0.0]],
        [[0.0, -0.3, 0.0], [-0.15, -0.3, 0.0], [-0.2, -0.15, 0.0], [-0.2, 0.0, 0.0]],
    ];

    var headab = [
        [[-0.2, 0.0, 0.0], [-0.2, 0.15, 0.0], [-0.15, 0.3, 0.0], [0.0, 0.3, 0.0]],
        [[-0.2, -0.15, 0.0],[-0.2, 0.0, 0.1], [0.0, 0.3, 0.1],   [0.15, 0.3, 0.0]],
        [[-0.15, -0.3, 0.0], [0.0, -0.3, 0.1], [0.2, 0.0, 0.1], [0.2, 0.15, 0.0]],
        [[0.0, -0.3, 0.0], [0.15, -0.3, 0.0], [0.2, -0.15, 0.0], [0.2, 0.0, 0.0]],
        ];

    var headq1 = [
        [[0.2, 0.0, 0.1], [0.2, 0.15, 0.1], [0.15, 0.3, 0.1], [0.0, 0.3, 0.1]],
        [[0.2, 0.0, -0.1], [0.2, 0.15, -0.1], [0.15, 0.3, -0.1], [0.0, 0.3, -0.1]],
        ];

    var headq2 = [
        [[-0.2, 0.0, -0.1], [-0.2, 0.15, -0.1], [-0.15, 0.3, -0.1], [0.0, 0.3, -0.1]],
        [[-0.2, 0.0, 0.1], [-0.2, 0.15, 0.1], [-0.15, 0.3, 0.1], [0.0, 0.3, 0.1]],
        ];

    var headq3 = [
        [[-0.2, 0.0, 0.1], [-0.2, -0.15, 0.1], [-0.15, -0.3, 0.1], [0.0, -0.3, 0.1]],
        [[-0.2, 0.0, -0.1], [-0.2, -0.15, -0.1], [-0.15, -0.3, -0.1], [0.0, -0.3, -0.1]],
        ];

    var headq4 = [
        [[0.2, 0.0, -0.1], [0.2, -0.15, -0.1], [0.15, -0.3, -0.1], [0.0, -0.3, -0.1]],
        [[0.2, 0.0, 0.1], [0.2, -0.15, 0.1], [0.15, -0.3, 0.1], [0.0, -0.3, 0.1]],
        ];

    stru.addBezierPatch({position: lFromXYZ(0, -0.7, 0), coords: fbody, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, -0.7, 0), coords: bbody, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, -0.7, 0), coords: lbody, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, -0.7, 0), coords: rbody, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, -0.7, 0), coords: tbody, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, -0.7, 0), coords: ubody, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, 0.0, -0.1), coords: headaf, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, 0.0, 0.1), coords: headab, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, 0.0, 0), coords: headq1, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, 0.0, 0), coords: headq2, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, 0.0, 0), coords: headq3, xsegments: 8, ysegments: 8})
    stru.addBezierPatch({position: lFromXYZ(0, 0.0, 0), coords: headq4, xsegments: 8, ysegments: 8})
    stru.addCylinder({position: lFromXYZPYR(0.0, -0.35, 0.0, LR90, 0, 0), radius: 0.1, depth: 0.1});
    stru.addSphere({position: lFromXYZ(0.3, -0.45, 0.0), radius: 0.12});
    stru.addSphere({position: lFromXYZ(-0.3, -0.45, 0.0), radius: 0.12});

    var starm = new LStructureDef(ShaderSimple, {color: vec4.fromValues(0.3, 0.2, 0.1, 1.0)});
    starm.addCylinder({position: lFromXYZPYR(0.0, -0.2, 0.0, LR90, 0, 0), radius: 0.08, depth: 0.21});
    starm.addSphere({position: lFromXYZPYR(0.0, -0.42, 0.0, LR90, 0, 0), radius: 0.09});

    var suleg = new LStructureDef(ShaderSimple, {color: vec4.fromValues(0.3, 0.2, 0.1, 1.0)});
    suleg.addCylinder({position: lFromXYZPYR(0.0, -0.35, 0.0, LR90, 0, 0), radius: 0.11, depth: 0.35});
    suleg.addSphere({position: lFromXYZPYR(0.0, -0.7, 0.0, LR90, 0, 0), radius: 0.125});

    var slleg = new LStructureDef(ShaderSimple, {color: vec4.fromValues(0.3, 0.2, 0.1, 1.0)});
    slleg.addCylinder({position: lFromXYZPYR(0.0, -0.35, 0.0, -LR90, 0, 0), radius: 0.11, depth: 0.35});
    slleg.addTriangle({position: lFromXYZPYR(0.0, -0.7, -0.0, 0, LR90, 0), coords: [[0, 0], [0.30, 0], [0, 0.15]], depth: 0.11});


    return {stru: stru, starm: starm, suleg: suleg, slleg: slleg};
}


function Kronky()
{

    Person.call(this);
    var strs = structs.Kronky;

    var obj = new LWObject(strs.stru, this);
    this.obj = obj;
    var aobj = new LObject(strs.starm, this);
    obj.addChild(aobj, lFromXYZ(-0.33, -0.45, 0.0));
    this.ltarm = aobj;
    var aobj = new LObject(strs.starm, this);
    obj.addChild(aobj, lFromXYZ(0.33, -0.45, 0.0));
    this.rtarm = aobj;

    var aobj =  new LObject(strs.starm, this);
    this.ltarm.addChild(aobj, lFromXYZ(0, -0.42, 0.0));
    this.lbarm = aobj;

    var aobj =  new LObject(strs.starm, this);
    this.rtarm.addChild(aobj, lFromXYZ(0, -0.42, 0.0));
    this.rbarm = aobj;

    
    var aobj =  new LObject(strs.suleg, this);
    obj.addChild(aobj, lFromXYZ(-0.13, -1.0, 0.0));
    this.luleg = aobj

    var aobj =  new LObject(strs.suleg, this);
    obj.addChild(aobj, lFromXYZ(0.13, -1.0, 0.0));
    this.ruleg = aobj



    var aobj =  new LObject(strs.slleg, this);
    this.luleg.addChild(aobj, lFromXYZ(0.0, -0.7, 0.0));
    this.llleg = aobj

    var aobj =  new LObject(strs.slleg, this);
    this.ruleg.addChild(aobj, lFromXYZ(0.0, -0.7, 0.0));
    this.rlleg = aobj

    this.pid = 1;
    this.carrying = null;

    this.obj.mkvisible(false);
    this.islive = false;
    this.ry = 0;
    this.rx = 0;

    this.cbinst = new ColCB(this, this.obj);
    this.vvel = 0;
    this.dojump = false;
    this.jumpcoll = new LVirtObject(this, 0, 0, 0, 0);

    this.isfloor = false;
    this.iswire = false;
    this.istravel = false;
    this.iscage = false;

    lScene.stateobjs.push(this);

    this.rec_actions = [];
    this.rec_progress = 0;       // progress recording
    this.rec_playback = 0;      // Playback
    this.rec_playidx = 0;
    this.rec_recidx = 0;        

    this.rec_curraction = 0;    // next action
    this.rec_currprog = 0.0;    // progress next action is activated
    this.rec_oldaction = 0;     // Performing action
    this.rec_isrecording = false;
    this.rec_isplaying = false;

    this.rec_okctrl = 0;
}

Kronky.prototype = Object.assign(Object.create(Person.prototype), {
    constructor: Kronky,

    save: function()
    {
        var sact = this.rec_actions;
        var dact = [];
        var rlen = sact.length;
        for(var i = 0; i < rlen; i++) dact.push(sact[i]);

        return {
            obj: this.obj.save(),
            swing: this.swing,
            carrying: this.carrying,
            islive: this.islive,
            ry: this.ry,
            rx: this.rx,
            jumpcoll: this.jumpcoll.save(),
            isfloor: this.isfloor,
            iscage: this.iscage,
            travelling: this.travelling,
            zipdist: this.zipdist,
            vvel: this.vvel,

            rec_actions: dact,
            rec_progress: this.rec_progress,
            rec_playback: this.rec_playback,
            rec_playidx: this.rec_playidx,
            rec_recidx: this.rec_recidx,
        
            rec_curraction: this.rec_curraction,
            rec_currprog: this.rec_currprog,
            rec_oldaction: this.rec_oldaction,
            rec_isrecording: this.rec_isrecording,
            rec_isplaying: this.rec_isplaying,
            rec_okctrl: this.rec_okctrl,
        }
    },

    restore: function(saved)
    {
        if(this.travelling) {
            if(this.travelling instanceof ZipBase) {
                sounds.zip.pause();
            }
        }
        var diff = 0;
        if(this.obj.isvisible) diff = -1;
        this.obj.restore(saved.obj);
        this.swing = saved.swing;
        this.carrying = saved.carrying;
        this.islive = saved.islive;
        this.ry = saved.ry;
        this.rx = saved.rx;
        this.jumpcoll.restore(saved.jumpcoll);
        this.isfloor = saved.isfloor;
        this.iscage = saved.iscage;
        this.travelling = saved.travelling;
        this.vvel = saved.vvel;


        if(this.travelling) {
            if(this.travelling instanceof ZipBase) {
                sounds.zip.play();
            }
        }
            
        // Do not want to restore playback if recording

        if((!this.rec_isrecording) || (!lScene.kswap)) {

            var sact = saved.rec_actions;
            var dact = [];
            var rlen = sact.length;
            for(var i = 0; i < rlen; i++) dact.push(sact[i]);
            this.rec_actions = dact;

            this.rec_progress = saved.rec_progress;
            this.rec_playback = saved.rec_playback;
            this.rec_playidx = saved.rec_playidx;
            this.rec_recidx = saved.rec_recidx;

            this.rec_curraction = saved.rec_curraction;
            this.rec_currprog = saved.rec_currprog;
            this.rec_oldaction = saved.rec_oldaction;
            this.rec_isrecording = saved.rec_isrecording;
            this.rec_isplaying = saved.rec_isplaying;
            this.rec_okctrl = saved.rec_okctrl;
        }

        if(this.obj.isvisible) diff += 1;

        if(diff != 0 && (lScene.kswap)) {
            lScene.playkronky += diff;
        }
    },

    rotateFlat: function(rx, ry)
    {
        this.obj.rotateFlat(0, ry);
    },

    displaydrop: function()
    {
        this.rtarm.rotateHere(0, 0, 0);
        this.rbarm.rotateHere(0, 0, 0);
        this.ltarm.rotateHere(0, 0, 0);
        this.lbarm.rotateHere(0, 0, 0);
        this.rtarm.procpos();
        this.rbarm.procpos();
    },

    zipstart: function(zip) {
        zip.cobj.mkvisible(true);
    },
        
    zipend: function(zip) {
        zip.cobj.mkvisible(false);
    },
        
    zipgo: function(zip)
    {
        zip.cobj.moveHere(this.obj.x, this.obj.y + 0.5, this.obj.z);
        zip.cobj.procpos();
    },


    displayzip: function(zip)
    {
        this.rtarm.rotateHere(LR180, 0, 0);
        this.rbarm.rotateHere(0, 0, 0);
        this.ltarm.rotateHere(LR180, 0, 0);
        this.lbarm.rotateHere(0, 0, 0);

    },

    swingarms: function(delta)
    {
        var nswing = this.swing + (delta * 2);
        if(this.swing >= 4)
        {
            nswing -= 4;
            sounds.footstep.play();
        }
        else if(this.swing < 0)
        {
            sounds.footstep.play();
            nswing += 4;
        } else if (this.swing <= 2 && nswing > 2) {
            sounds.footstep.play();
        } else if (this.swing >= 2 && nswing < 2) {
            sounds.footstep.play();
        }

        this.swing = nswing;


        var swamt = this.swing;

        var swla = 0;
        var swra = 0;

        var lknee = 0;
        var rknee = 0;

        if(swamt >= 0 && swamt < 1) {
            lknee = 1 - swamt;
            rknee = 0;
            swra = swamt;
        } else if(swamt >= 1 && swamt < 2) {
            lknee = 0;
            rknee = swamt -1;
            swra = 2 - swamt;
        } else if(swamt >= 2 && swamt < 3) {
            lknee = 0;
            rknee = 3 - swamt;
            swra = 2 - swamt;
        } else if(swamt >= 3 && swamt < 4) {
            lknee = 0;
            rknee = swamt - 3;
            swra = swamt - 4;
        }

        swla = -swra;

        var ewla = 0.5 + (swla * 0.5);
        var ewra = 0.5 + (swra * 0.5);
        
        var lshoulder = swla * LR90 / 2
        var rshoulder = swra * LR90 / 2

        if(!this.carrying) {
            this.ltarm.rotateHere(-lshoulder, 0, 0);
            this.rtarm.rotateHere(-rshoulder, 0, 0);

            this.lbarm.rotateHere(ewla * LR90 / 3, 0, 0);
            this.rbarm.rotateHere(ewra * LR90 / 3, 0, 0);
        }

        this.luleg.rotateHere(lshoulder, 0, 0);
        this.ruleg.rotateHere(rshoulder, 0, 0);

        this.llleg.rotateHere(LR90 * -lknee  * .75, 0, 0);
        this.rlleg.rotateHere(LR90 * -rknee  * .75, 0, 0);
    },

    stopswing: function()
    {
        if(this.swing == 0) return;
        if(!this.carrying) {
            this.ltarm.rotateHere(0, 0, 0);
            this.rtarm.rotateHere(0, 0, 0);

            this.lbarm.rotateHere(0, 0, 0);
            this.rbarm.rotateHere(0, 0, 0);
        }

        this.luleg.rotateHere(0, 0, 0);
        this.ruleg.rotateHere(0, 0, 0);

        this.llleg.rotateHere(0, 0, 0);
        this.rlleg.rotateHere(0, 0, 0);

        this.swing = 0;
    },

    carrything: function()
    {
        if(this.carrying) this.carrying.kronkycarry(this);
    },

    mklive: function()
    {
        this.stopswing();
        this.obj.mkvisible(true);
        this.obj.procpos();

        // Bug
        if(this.carrying)
            this.carrying = null;
    },

    die: function()
    {
        this.endlive();
    },

    endlive: function()
    {
        if(this.obj.isvisible) {
            this.obj.mkvisible(false);

            if(this.carrying) {
                this.carrying.end();
                this.carrying = null;
            }
            this.ride = null;
            this.stopswing();
            this.displaydrop();
            this.rec_reset();
            lScene.playkronky -= 1;
            g_playing.innerText = lScene.playkronky;
        }
    },
    jump: function(delta)
    {
        if(this.vvel <= 0)
            this.vvel += .2;
    },

    lplay: function(delta)
    {
        this.endlive();
    },
    lrecord: function(delta, nkctrl) {},

    rec_update: function(delta, nkctrl)
    {
        this.rec_progress += delta;
        if(nkctrl != this.rec_okctrl) {
            this.rec_okctrl = nkctrl;
            this.rec_recidx += 1;
            this.rec_actions.push([this.rec_progress, nkctrl]);
        }
    },

    rec_play: function(delta, cback)
    {
        if(!this.rec_isplaying) return;
        var opb = this.rec_playback;
        this.rec_playback += delta;


        for(;;)
        {
            if(this.rec_currprog > this.rec_playback)
            {
                // No change, carry on (after loop)
                break;
            }

            // Change - first carry on for lease time
            var idelta = this.rec_currprog - opb; 
            delta -= idelta;
            opb = this.rec_currprog;
            cback(idelta, this.rec_oldaction);

            this.rec_oldaction = this.rec_curraction;

            this.rec_playidx++;
            if(this.rec_playidx >= this.rec_recidx) {
                // cback(delta, this.rec_oldaction);
                cback(0, CEND | CPLAY);
                return;
            }
            this.rec_currprog = this.rec_actions[this.rec_playidx][0];
            this.rec_curraction = this.rec_actions[this.rec_playidx][1];
        }
        if(delta > 0) cback(delta, this.rec_oldaction);
    },

    rec_reset: function()
    {
        this.rec_actions = [];
        this.rec_progress = 0;       // progress recording
        this.rec_playback = 0;      // Playback
        this.rec_playidx = 0;
        this.rec_recidx = 0;

        this.rec_curraction = 0;
        this.rec_currprog = 0.0;
        this.rec_oldaction = 0;
        this.rec_isrecording = false;
        this.rec_isplaying = false;
    },
});


function Player()
{
    Person.call(this);
    this.pid = 0;
    this.carrying = null;

    this.movedown = 0;

    this.cbinst = null; // Do not know if camera is called yet
    this.vvel = 0;
    this.dojump = false;
    this.ride = null;
    this.jumpcoll = new LVirtObject(this, 0, 0, 0, 0);
    this.jumpcoll.ignore = true;
    this.obj = null;    // Fix later
    this.isfloor = false;
    this.iswire = false;
}
Player.prototype = Object.assign(Object.create(Person.prototype), {
    constructor: Player,

    save: function()
    {
        return {
            obj: this.obj.save(),
            swing: this.swing,
            carrying: this.carrying,
            islive: this.islive,
            ry: this.ry,
            rx: this.rx,
            jumpcoll: this.jumpcoll.save(),
            isfloor: this.isfloor,
            iscage: this.iscage,
            travelling: this.travelling,
            zipdist: this.zipdist,
            vvel: this.vvel,
        }
    }, 

    restore: function(saved)
    {
        if(this.travelling) {
            if(this.travelling instanceof ZipBase) {
                sounds.zip.pause();
            }
        }
        this.obj.restore(saved.obj);
        this.swing = saved.swing;
        this.carrying = saved.carrying;
        this.islive = saved.islive;
        this.ry = saved.ry;
        this.rx = saved.rx;
        this.jumpcoll.restore(saved.jumpcoll);
        this.isfloor = saved.isfloor;
        this.iscage = saved.iscage;
        this.travelling = saved.travelling;
        this.vvel = saved.vvel;

        if(this.travelling) {
            if(this.travelling instanceof ZipBase) {
                sounds.zip.play();
            }
        }
    },

    gotcha: function(obj)
    {
        console.log("Gotcha ", obj);
    },

    move: function(x, y, z)
    {
        lCamera.moveFlat(x, y, z);
    },

    carrything: function()
    {
        if(this.carrying) this.carrying.playercarry(this);
    },
    jump: function()
    {
        if(this.vvel <= 0)
            this.vvel += .2;
    },

    lrecord: function(delta, nkctrl)
    {
        // Only do record if on terra firma (not riding anything)
        // 
        
        if(this.ride) return;

        if(lScene.record) {
            lScene.lMessage("Already recording a Kronky");
            return;
        }

        var usek = -1;
        var kronky = null;

        for(var i = 0; i < lScene.numkronky; i++) {
            kronky = lScene.kronky[i];
            if((!kronky.rec_isrecording) && ((!kronky.rec_isplaying))) {
                kronky.rec_isrecording = true;
                kronky.rec_oldaction = nkctrl;
                kronky.rec_curraction = nkctrl;
                lScene.record = kronky;
                i = 10;
                break;
            }
        }

        if(!lScene.record) {
            if(lScene.numkronky == 1)
                lScene.lMessage("Kronky is currently active");
            else
                lScene.lMessage("All Kronkys are currently active");
            return;
        }


        var crobj = kronky.obj;
        var ma = mat4.create();
        var mb = mat4.create();
        var va = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

        mat4.fromYRotation(ma, lCamera.ry);
        mat4.fromTranslation(mb, vec4.fromValues(0.0, 0.0, -2.6, 1.0)); mat4.multiply(ma, ma, mb);
        vec4.transformMat4(va, va, ma);

        crobj.moveHere(lCamera.x, lCamera.y, lCamera.z);
        crobj.warp();
        crobj.moveAbs(va[0], va[1], va[2]);
        crobj.rotateFlatHere(0, lCamera.ry + LR180);

        // Test if can go
        crobj.ox = lCamera.x;
        crobj.oy = lCamera.y;
        crobj.oz = lCamera.z;
        var hit= false;
        function xcback(cob)
        {
            if(!cob.control.isfloor) hit = true;
        }
        if(this.carrying) this.carrying.obj.ignore = true;
        crobj.ignore = true;
        this.obj.ignore = true;
        lScene.lCAllPointDetect(crobj, 0.3, xcback);

        if(hit) {
            kronky.rec_isrecording = false;
            lScene.record = null;
        } else {

            var isfloor = false;
            function ycback(cob)
            {
                if(cob.control.isfloor) {
                    if(cob.y - 0.3 <= crobj.y) {
                         crobj.y = cob.y;
                         isfloor = true;
                    }
                }
            }
            lScene.lCAllPointDetect(crobj, 0.3, ycback);
            if(isfloor) {

                kronky.mklive();

                this.rec_kronky_rx = crobj.rx;
                this.rec_kronky_ry = crobj.ry;
                this.rec_kronky_x = crobj.x;
                this.rec_kronky_y = crobj.y;
                this.rec_kronky_z = crobj.z;
                this.rec_kronky_quat = quat.clone(crobj.quat);
                this.rec_kronky_carrying = kronky.carrying;

                this.rec_camera_x = lCamera.x;
                this.rec_camera_y = lCamera.y;
                this.rec_camera_z = lCamera.z;
                this.rec_camera_ry = lCamera.ry;
                this.rec_camera_rx = lCamera.rx;
                this.rec_player_carrying = this.carrying;
                lScene.state = lScene.savestate();
                g_record.innerText = "R";
                sounds.kkstart.play();
            } else {
                lScene.record = null;
                kronky.rec_isrecording = false;
            }
        }
        if(this.carrying) this.carrying.obj.ignore = false;
        this.obj.ignore = false;
        crobj.ignore = false;
    },

    lplay: function(delta, nkctrl)
    {

        if(!lScene.record) {
            lScene.lMessage("Not recording a Kronky");
            return;
        }

        var kronky = lScene.record;
        var crobj = kronky.obj;

        if((kronky.rec_isrecording) && ((!kronky.rec_isplaying))) {
            lScene.record = null;

            var tempc = null;
            if(this.carrying) {
                tempc = this.carrying.respawn();
                // kronky.carrying.resetpickup(kronky);
                // kronky.carrying = null;
            }

            lScene.kswap = true;
            lScene.restorestate(lScene.state);
            lScene.kswap = false;

            kronky.islive = true;

            kronky.rec_isrecording = false;
            kronky.rec_isplaying = true;

            g_playing.innerText = lScene.playkronky;

            lCamera.moveHere(this.rec_kronky_x, this.rec_kronky_y, this.rec_kronky_z);
            lCamera.rotateFlatHere(0, this.rec_kronky_ry);
            lCamera.warp();

            // If carrying stuff, spawn it for new
            crobj.moveHere(this.rec_camera_x, this.rec_camera_y, this.rec_camera_z);
            crobj.rotateFlatHere(0, this.rec_camera_ry);
            crobj.warp();
            crobj.mkvisible(true);
            crobj.procpos();

            if(tempc) {
                tempc.obj.mkvisible(true);
                tempc.islive = true;
                this.carrying = tempc;
                tempc.pickup(this);
                tempc.playercarry(this);
                tempc.obj.warp();
                // lScene.pickups.push(tempc);
                // lScene.animates.push(tempc);
            }
            

            if(this.rec_player_carrying) {
                var cth = this.rec_player_carrying;
                cth.obj.mkvisible(true);
                cth.islive = true;
                kronky.carrying = cth;
                cth.iscarried = null;
                cth.pickup(kronky);
                cth.kronkycarry(kronky);
                cth.obj.warp();
            } else {
                
                kronky.displaydrop();
            }
            lScene.playkronky += 1;
            g_playing.innerText = lScene.playkronky;
            g_record.innerText = "";
            sounds.kkplay.play();
        }
    },

    die: function()
    {
        // Simply stop all play loops - easier than working out which ones are playing
        lScene.stopsounds();
        if(this.carrying) {
            this.carrying.end();
            this.carrying = null;
        }
        if(!lScene.isdead) {
            sounds.flush.play();
            lScene.seefinished = true;
            lScene.isdead = true;
            lScene.timer = 2;
            lScene.lMessage("Died");
        }
    },

    end: function()
    {
        this.die();
    },
});

// Helper callbacks for collisions


function ColCB(person, obj)
{
    this.dfloor = 100;
    this.moveback = false;
    this.person = person;
    this.carrying = person.carrying;
    this.obj = obj;
    this.wy = 0;
    this.islift = null;
    this.travelling = null;
    this.onbridge = null;
    this.wire = null;
}

ColCB.prototype = {
    constructor: ColCB,
    carry: function(cob)
    {
        var control = cob.control;
        if((!control.isfloor) && (!control.istravel)  && (!control.iscage) && (!control.iswire)) {
            this.moveback = true;
            if(this.carrying) {
                if(this.carrying.fits(control)) {
                    this.carrying.iscarried = null;
                    this.person.carrying = null;
                    this.carrying = null;
                }
            }
        }
    },

    empty: function (cob)
    {
        var control = cob.control;
        if(control.isfloor) {
            var df = this.obj.y - cob.y;
            if(df < this.dfloor) {
                this.dfloor = df;
                if(df > -0.8 && df < 0) {
                    this.wy = cob.y;
                }
            }
            if(control instanceof DodgyBridgeBase) {
                this.onbridge = control;
            }
        } else if (control.istravel) {
            if (control instanceof Lift) {
                this.islift = cob.control;
            }
        } else if (!control.iscage) {
            this.moveback = true;
            if (cob.control instanceof WireLine) {
                this.wire = cob;
            }
        }
    },

    reset: function(person)
    {
        this.dfloor = 100;
        this.moveback = false;
        this.islift = null;
        this.carrying = person.carrying;
        this.wy = 0;
        this.onbridge = null;
        this.wire = null;
    },
}

function Scene(args)
{

    this.player = new Player();
    args.lLControl = this.player;
    args.lDirectionalVector = vec3.fromValues(0.6, 0.7, 0.8);

    LBase.call(this, args);

    this.player.cbinst = new ColCB(lScene.player, lCamera);
    this.player.obj = lCamera;

    this.ambientLight =  null;
    this.directionalLightColor = null;
    this.restorelight();

    var keys = {
        ctrl: 0
    };


    // Register keys as functions for performance
    lInput.register(77, function(ind)  {if(ind) keys.ctrl |= RDOWN; else keys.ctrl &= ~(RDOWN);});
    lInput.register(75, function(ind)  {if(ind) keys.ctrl |= RUP  ; else keys.ctrl &= ~(RUP);});
    // lInput.register(188, function(ind) {keys.roll_anti = ind;});
    // lInput.register(190, function(ind) {keys.roll_clock = ind;});
    lInput.register(87, function(ind)  {if(ind) keys.ctrl |= MFORWARD  ; else keys.ctrl &= ~(MFORWARD);});
    lInput.register(83, function(ind) {if(ind) keys.ctrl |= MBACK  ; else keys.ctrl &= ~(MBACK);});
    lInput.register(68, function(ind)  {if(ind) keys.ctrl |= MRIGHT  ; else keys.ctrl &= ~(MRIGHT);});
    lInput.register(65, function(ind) {if(ind) keys.ctrl |= MLEFT  ; else keys.ctrl &= ~(MLEFT);});

    lInput.register(66, function(ind) {if(ind) keys.ctrl |= NOOP  ; else keys.ctrl &= ~(NOOP);});

    lInput.register(32, function(ind) {if(ind) keys.ctrl |= MJUMP  ; else keys.ctrl &= ~(MJUMP);});

    lInput.register(188, function(ind)  {if(ind) keys.ctrl |= RLEFT  ; else keys.ctrl &= ~(RLEFT);});
    lInput.register(190, function(ind)  {if(ind) keys.ctrl |= RRIGHT ; else keys.ctrl &= ~(RRIGHT);});

    lInput.register(73, function(ind)  {if(ind) keys.ctrl |= CRECORD ; else keys.ctrl &= ~(CRECORD);});
    lInput.register(80, function(ind)  {if(ind) keys.ctrl |= CPLAY ; else keys.ctrl &= ~(CPLAY);});
    // lInput.register(27, function(ind) {if(ind) lScene.doescape()});
    // lInput.register(65, function(ind) {if(ind) keys.fire = true;});
    lInput.register(69, function(ind)  {if(ind) keys.ctrl |= OPICK; else keys.ctrl &= ~(OPICK);});
    lInput.register(81, function(ind)  {if(ind) keys.ctrl |= ODROP; else keys.ctrl &= ~(ODROP);});
    lInput.register(88, function(ind)  {if(ind) keys.ctrl |= OFIRE; else keys.ctrl &= ~(OFIRE);});
    lInput.register(67, function(ind)  {if(ind) keys.ctrl |= OCHUCK; else keys.ctrl &= ~(OCHUCK);});

    lInput.register(27,  function(ind)  {if(ind) keys.ctrl |= CRESET; else keys.ctrl &= ~(CRESET);});
    lInput.register(13, function(ind)  {if(ind) keys.ctrl |= CSAVE; else keys.ctrl &= ~(CSAVE);});
    lInput.register(8, function(ind)  {if(ind) keys.ctrl |= CRESTORE; else keys.ctrl &= ~(CRESTORE);});
    lInput.register(71, function(ind)  {if(ind) keys.ctrl |= CFORWARD; else keys.ctrl &= ~(CFORWARD);});
    lInput.register(72, function(ind)  {if(ind) keys.ctrl |= CHELP; else keys.ctrl &= ~(CHELP);});
    lInput.register(191, function(ind)  {if(ind) keys.ctrl |= CHELP; else keys.ctrl &= ~(CHELP);});

    // Use them
    lInput.usekeys();

    this.keys = keys;
    this.okctrl = 0;

    this.record = null;
    this.state = [];

    this.success = false;
    this.isdead = false;
    this.seefinished = false;
    this.flowerstands = [];

    this.achievements = {
        dkey: 0
    };
    this.stateobjs = [];
    this.pickups = [];
    this.animates = [];

    this.prngd = new LPRNGD(Math.random() * 10000);
    this.prng = new LPRNG(1000 + g_LevelNum);

    this.timer = 0;

    this.minx = -1000;
    this.minz = -1000;
    this.maxx = 1000;
    this.maxz = 1000;

    this.kronky = [];
    this.numkronky = 1;
    this.playkronky = 0;

    this.kswap = false;     // When restoring - swap kronky and player

    this.gamedata = null;
    this.isincommand = false;
    this.isinforward = false;
    this.doingforward = false;
    this.ishelp = false;
    this.flowers = [];

}

Scene.prototype = Object.assign(Object.create(LBase.prototype), {
    constructor: Scene,

    restorelight: function()
    {
        // Hard code for now
        this.ambientLight =  vec3.fromValues(0.3, 0.3, 0.3);
        this.directionalLightColor = vec3.fromValues(1.0, 1.0, 1.0);
    },

    save: function()
    {
        return {
            okctrl: this.okctrl,
            record: this.record,
            sucess: this.success,
            isdead: this.isdead,
            seefinished: this.seefinished,
            timer: this.timer,
            numkronky: this.numkronky,
            playkronky: this.playkronky,
            player: this.player.save(),
            state: this.state,
        }
    },

    restore: function(saved)
    {
        this.okctrl = saved.okctrl;
        this.record = saved.record;
        this.sucess = saved.success;
        this.isdead = saved.isdead;
        this.seefinished = saved.seefinished;
        this.timer = saved.timer;
        this.numkronky = saved.numkronky;
        this.playkronky = saved.playkronky;
        this.player.restore(saved.player);
        this.state = saved.state;
        g_total.innerText = lScene.numkronky;
        g_playing.innerText = lScene.playkronky;
        if(this.record)
            g_record.innerText = "R";
        else
            g_record.innerText = "";
    },

    walls: function(xf, zf, xt, zt, ys)
    {
        this.minx = (xf * 30) - 15;
        this.minz = (zf * 30) - 15;
        this.maxx = (xt * 30) + 15;
        this.maxz = (zt * 30) + 15;
        for(var y = 0; y <= ys; y++) {
            for(var i = xf; i <= xt; i++) {
                new Wall(i * 30, y * 30, this.minz,  0);
                new Wall(i * 30, y * 30, this.maxz, LR180);
            }
            for(var j = zf; j <= zt; j++) {
                new Wall(this.minx, y * 30, j * 30, LR90);
                new Wall(this.maxx, y * 30, j * 30, -LR90);
            }
        }
        for(var i = xf; i <= xt; i++) {
            for(var j = zf; j <= zt; j++) {
                new Dunk(i * 30, -7.4, j * 30, 0);
                new Sky(i * 30, (ys * 30) + 15, j * 30, 0);
            }
        }
    },

    nextwall: function()
    {
        return this.prng.next(9);
    },
        
    lLoop: function(delta)
    {

        // Celebrate if neccessary
        var nkctrl = this.keys.ctrl;

        if((nkctrl & COMMANDS) != 0) {

            if(!this.isincommand) {
                if((nkctrl & CHELP) != 0) {
                    this.seefinished = true;
                    this.ishelp = true;
                    document.getElementById("mhelp").style.display = "block";
                } 
                if(this.ishelp) return true;
                if((nkctrl & CSAVE) != 0) {
                    sounds.csave.play();
                    this.gamedata = this.savegame();
                    this.lMessage("Position saved", "yellow");
                 }
                 if((nkctrl & CRESTORE) != 0) {
                    if(!this.gamedata) {
                        this.lMessage("No position data saved");
                    } else {
                        sounds.crestore.play();
                        this.restoregame(this.gamedata);
                        this.lMessage("Position restored", "yellow");
                    }
                }
        
                if((nkctrl & CRESET) != 0) {
                    sounds.flush.play();
                    this.isdead = true;
                    this.seefinished = true;
                    this.timer = 2;
                    this.gamedata = null;
                    this.lMessage("Quit");
                    gCloseGame = true;
                    this.stopsounds();
                }

            
                this.isincommand = true;
            }
        } else {
            if(this.isincommand) this.isincommand = false;
        }

        if((nkctrl & CFORWARD) != 0) {
            if((!this.seefinished)) {
                if(!this.isinforward) {
                    sounds.ticktock.play();
                    this.isinforward = true;
                    g_forward.innerText = " F ";
                }
                if((!this.doingforward)) {
                    this.doingforward = true;
                    for(var i = 0; i < 5; i++) {
                        this.lLoop(delta);
                        if(this.seefinished) break;
                    }
                    this.doingforward = false;
                    return true;
                }
            }
        }  else {
            if(this.isinforward) {
                sounds.ticktock.stop();
                this.isinforward = false;
                g_forward.innerText = "";
            }
        }


        if(this.seefinished) {
            if(this.ishelp) {
                if((nkctrl & NOOP) != 0) {
                    document.getElementById("mhelp").style.display = "none";
                    this.seefinished = false;
                    this.ishelp = false;
                }
                return true;
            }
            if(this.success) {
                return this.celebrate(delta);
            }
            // Deaded
            if(this.isdead) {
                if(!this.havedied(delta)) {
                    if(!this.gamedata) {
                        g_LevelNum -= 1;
                        if(g_LevelNum < 0) g_LevelNum = 0;
                        return false;
                    } else {
                        this.restorelight();
                        this.restoregame(this.gamedata);
                        this.lMessage("Died - but position restored", "yellow");
                    }
                } else {
                    return true;
                }
            }
        }

        // First - record
        var record = this.record;

        // Record this
        if(record) record.rec_update(delta, nkctrl);
            
        // Do the player
        this.player.loop(delta, nkctrl);
    
        // Do Kronky

        var kronky = null;
        var kronkys = this.kronky;

        for(var i = 0; i < 5; i++) {
            kronky = kronkys[i];
            kronky.rec_play(delta, function(idelta, ictrl) {kronky.loop(idelta, ictrl);});
        }

        // Animations
        var dobjs = this.animates;
        var dlen = dobjs.length;
        for(var i = 0; i < dlen; i++) {
            dobjs[i].animate(delta);
        }

        return true;

    },

    findpickup: function(x, y, z, ry)
    {
        var ma = mat4.create();
        var mb = mat4.create();
        var ca = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

       // First of all - vector from camrera, way we are looking
        mat4.fromYRotation(ma, ry);
        mat4.fromTranslation(mb, vec4.fromValues(0.0, 0.0, -1.0, 1.0));
        mat4.multiply(ma, ma, mb);
        vec4.transformMat4(ca, ca, ma);

        var cx = x;
        var cy = y;
        var cz = z;


        var dobjs = this.pickups;
        var dlen = dobjs.length;

        var curlen = 999;
        var curthing = null;
        for(var i = 0; i < dlen; i++)
        {
            var thing = dobjs[i];
            if(!thing.canpickup) continue;
            var obj = thing.obj;
            if(!obj.isvisible) continue;
            // As we always put these on at identity,
            // initial position is origin

            var ox = obj.x - cx;
            var oy = obj.y - cy;
            var oz = obj.z - cz;

            if(oy < -2.5 || oy > 1) continue;      // Not on same level

            var tlen = (ox * ox) + (oz * oz);

            if(tlen > 1.0) continue;

            var oa = vec3.fromValues(ox, oy, oz);
            vec3.normalize(oa, oa);

            if(vec3.dot(oa, ca) < 0) continue;

            if(tlen < curlen) {
                curlen = tlen;
                curthing = thing;
            }
        }
        return curthing;
        // HERE
    },


    savestate: function()
    {
        var dobjs = this.stateobjs;
        var dlen = dobjs.length;
        var things = [];

        for(var i = 0;  i < dlen; i++)
        {
            var obj = dobjs[i];
            things.push([obj, obj.save()]);
        }

        var achievements = {};
        for(var key in lScene.achievements) {
            achievements[key] = lScene.achievements[key];
        }
        return {
            things: things,
            achievements: achievements,
        };
    },

    restorestate: function(state)
    {
        var things = state.things;
        var achievements = state.achievements;
        var slen = things.length;
        for(var i = 0;  i < slen; i++)
        {
            var sta = things[i];
            sta[0].restore(sta[1]);
        }
        var sobs = this.pickups;
        var slen = sobs.length;
        for(var i = 0; i < slen; i++) {
            sobs[i].obj.procpos();
        }
        lScene.achievements = {};
        for(var key in achievements) {
            lScene.achievements[key] = achievements[key];
        }
    },

    restoregame: function(state)
    {
        var sobs = this.pickups;
        var slen = sobs.length;
        for(var i = 0; i < slen; i++) {
            if(!sobs[i].statestatic)
                sobs[i].obj.mkvisible(false);
        }
        this.restorestate(state);
        this.restore(state.scene);
    },

    savegame: function()
    {
        var gamedata = this.savestate();
        gamedata.scene = this.save();
        return gamedata;
    },

    achieve: function(key, ind)
    {
        if(!(key in this.achievements)) this.achievements[key] = 0;
        this.achievements[key] += ind;
        this.do_achieve();
    },
    celebrate: function(delta)
    {
        lCamera.rotateFlatHere(-LR90, lCamera.ry);
        lCamera.moveFlat(0, delta * 30, 0);
        if(lCamera.y > 200)
            return false;
        else
            return true;
    },

    havedied: function(delta)
    {
        this.timer -= delta;
        if(this.timer <= 0) {
            if (gCloseGame) {
                document.getElementById("mform").style.display = "block";
                document.getElementById("mgame").style.display = "none";
            }
            return false;
        }
        var amb = this.timer / 16.66;
        var dir = this.timer / 5.0;
        this.ambientLight =  vec3.fromValues(amb * 2, amb / 1.5, amb / 1.5);
        this.directionalLightColor = vec3.fromValues(dir * 2, dir / 1.5, dir / 1.5);
        return true;
    },

    stopsounds: function()
    {
        sounds.ticktock.stop();
        sounds.shuffle.stop();
        sounds.rumble.stop();
        sounds.door.stop();
        sounds.cagefly.stop();
        sounds.zip.stop();
        sounds.ratchet.stop();
        sounds.rocket.stop();
    },
});

function skyStructure()
{
    var stru = new LStructureDef(ShaderShade, {color: [0.66, 0.66, 0.66, 1.0]});
    stru.addBlock({size: [15, 0.01, 15], hold: [LI_FRONT, LI_BACK, LI_LEFT, LI_RIGHT, LI_TOP]});
    return stru;
}

function Sky(x, y, z, ry)
{
    this.obj = new LWObject(structs.Sky, this);
    lScene.lPlace(this.obj, lFromXYZ(x, y, z));
    this.obj.procpos();
}
    

function dunkStructure()
{
    var stru = new LStructureDef(ShaderShade, {texture: SLICK});
    stru.addBlock({size: [15, 0.01, 15], hold: [LI_FRONT, LI_BACK, LI_LEFT, LI_RIGHT, LI_BOTTOM]});
    return stru;
}

function Dunk(x, y, z, ry)
{
    this.obj = new LWObject(structs.Dunk, this);
    lScene.lPlace(this.obj, lFromXYZ(x, y, z));
    this.obj.procpos();
}
    

function wallStructures()
{
    var imsize = [1024, 1024];
    var third = 341;
    var third2 = 682;

    var psize = [third, third];


    var wads = [
        new LTextureControl(imsize, [1, 1], psize),
        new LTextureControl(imsize, [1, third], psize),
        new LTextureControl(imsize, [1, third2], psize),
        new LTextureControl(imsize, [third, 1], psize),
        new LTextureControl(imsize, [third, third], psize),
        new LTextureControl(imsize, [third, third2], psize),
        new LTextureControl(imsize, [third2, 1], psize),
        new LTextureControl(imsize, [third2, third], psize),
        new LTextureControl(imsize, [third2, third2], psize),
    ];
    var wade = new LTextureControl(imsize, [third2, third2], [3, third]);


    var ostrus = [];
    for(var i = 0; i < 9; i ++) {
        var stru = new LStructureDef(ShaderShade, {texture: WALLADS, collision: LSTATIC});
        stru.addBlock({texturecontrols: [wads[i], wads[i], null, null, null, null], size: [15, 15, .01]});
        ostrus.push(stru);
    }
    return ostrus;
}

function Wall(x, y, z, ry)
{
    this.obj = new LWObject(structs.Wall[lScene.nextwall()], this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.iscage = false;
    this.isfloor = false;
    this.iswire = false;
}


function glassPartitionStructure()
{
    var mstr = new LStructureDef(ShaderSimpleTrans, {color: [0.3, 0.3, 0.6, 0.5], collision: LSTATIC});
    mstr.addBlock({size: [4.95, 2.45, 0.025], corners: [[-5, -5, -.025], [5, 5, .025]]});
    var pstr = new LStructureDef(ShaderSimple, {color: [0.4, 0.2, 0.1, 1.0], collision: LNONE});
    pstr.addBlock({position: lFromXYZ(-4.975, 0, 0), size: [0.025, 2.5, 0.035]});
    pstr.addBlock({position: lFromXYZ(4.975, 0, 0), size: [0.025, 2.5, 0.035]});
    pstr.addBlock({position: lFromXYZ(0, 2.495, 0), size: [5, 0.025, 0.035]});
    pstr.addBlock({position: lFromXYZ(0, -2.495, 0), size: [5, 0.025, 0.035]});

    return [mstr, pstr];
}

function GlassPartition(x, y, z, ry)
{

    this.obj = new LWObject(structs.GlassPartition[0], this);
    this.pobj = new LWObject(structs.GlassPartition[1], this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.lPlace(this.pobj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.pobj.procpos();
    this.iscage = false;
    this.isfloor = false;
    this.iswire = false;
}

function postStructure()
{
    var pstr = new LStructureDef(ShaderSimple, {color: [0.4, 0.2, 0.1, 1.0], collision: LSTATIC});
    pstr.addBlock({position: lFromXYZ(-4.975, 0, 0), size: [0.025, 2.5, 0.035]});
    pstr.addBlock({position: lFromXYZ(4.975, 0, 0), size: [0.025, 2.5, 0.035]});
    pstr.addBlock({position: lFromXYZ(0, 2.495, 0), size: [5, 0.025, 0.035]});
    pstr.addBlock({position: lFromXYZ(0, -2.495, 0), size: [5, 0.025, 0.035]});
    return pstr;
}

function Post(x, y, z, ry)
{
    this.obj = new LWObject(structs.Post, this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.iscage = false;
    this.isfloor = false;
    this.iswire = false;
}

function exitStructure()
{
    var mstructure = new LStructureDef(ShaderSimple, {texture: KEXIT, collision: LSTATIC});

    var tinside = new LTextureControl([512, 512], [0, 0], [256, 512]);
    var toutside = new LTextureControl([512, 512], [256, 0], [256, 512]);
    

    mstructure.addBlock({position: lFromXYZ(-1.005, -0.51, 0), size: [.001, 2.01, 1.005], texturecontrols: [toutside, toutside, toutside, tinside, toutside, toutside]});
    mstructure.addBlock({position: lFromXYZ(1.005, -0.51, 0), size: [.001, 2.01, 1.005], texturecontrols: [toutside, toutside, toutside, toutside, toutside, tinside]});
    mstructure.addBlock({position: lFromXYZ(0, -0.5, 1), size: [1.005, 2, .001],  texturecontrols: [toutside, tinside, toutside, toutside, toutside, toutside]});
    mstructure.addBlock({position: lFromXYZ(0, -2.395, 0), size: [1.004, .005 , 1.004], texturecontrols: lTextureList(toutside), corners: null});

    // var hgrp = new LGroupDef();

    // var doorhold = new LStructureDef(ShaderSimple, {color: [.65, .15, .15, 1.0]});

    // doorhold.addBlock({size: [.25, 2, .0015]});
    // doorhold.addBlock({size: [.25, 2, .0015]});

    var door = new LStructureDef(ShaderSimple, {colors: [[0.6, 0.1, 0.1, 1.0], [0.15, 0.55, 0.15, 1.0]], collision: LSTATIC});

    door.useCorners([[0, -2, -.003], [.5, 2, .003]], {});
    // door.addBlock({position: lFromXYZ(.25, 0, 0), size: [.249, 1.9, .003], texturecontrols: lTextureColorAll(2, 0)}, corners: null);
    door.addBlock({position: lFromXYZ(.03, 0, 0), size: [.029, 1.9, .003], texturecontrols: lTextureColorAll(2, 0), corners: null});
    door.addBlock({position: lFromXYZ(.47, 0, 0), size: [.029, 1.9, .003], texturecontrols: lTextureColorAll(2, 0), corners: null});
    door.addBlock({position: lFromXYZ(.25, 1.85, 0), size: [.249, .05 , .003], texturecontrols: lTextureColorAll(2, 0), corners: null});
    door.addBlock({position: lFromXYZ(.25, -1.85, 0), size: [.249, .05 , .003], texturecontrols: lTextureColorAll(2, 0), corners: null});
    door.addCylinder({position: lFromXYZPYR(0, 0, 0, LR90, 0, 0), radius: .001, depth: 1.9, texturecontrols: lTextureColorAll(2, 1), segments: 6, corners: null});



    // return [mstructure, hgrp, doorhold, door]
    return [mstructure, door]
}


function Exit(x, y, z, ry)
{
    var obj = new LWObject(structs.Exit[0], this);

    // var lgrp = new LObject(structs.Exit[1], this);
    // var rgrp = new LObject(structs.Exit[1], this);

    var lodoor = new LObject(structs.Exit[1], this);
    var rodoor = new LObject(structs.Exit[1], this);
    var lidoor = new LObject(structs.Exit[1], this);
    var ridoor = new LObject(structs.Exit[1], this);

    obj.addChild(lodoor, lFromXYZPYR(-1, -0.5, -1, 0, 0, 0));
    obj.addChild(rodoor, lFromXYZPYR(1, -0.5, -1, 0, LR180, 0));

    lodoor.addChild(lidoor, lFromXYZPYR(.5, 0, 0, 0, 0, 0));
    rodoor.addChild(ridoor, lFromXYZPYR(.5, 0, 0, 0, 0, 0));


    lScene.lPlace(obj, lFromXYZPYR(x, y, z, 0, ry, 0));

    // Need to add some virtuals
    // One hell of a cheat, obj.draw() gets the workposition
    // so getScenePos works
    obj.procpos();
    this.obj = obj;
    this.isopen = false;
    this.isopening = false;
    this.hasopened = 0;
    this.lodoor = lodoor;
    this.rodoor = rodoor;
    this.lidoor = lidoor;
    this.ridoor = ridoor;

    this.isfloor = false;
    this.iswire = false;
    this.istravel = false;
    this.iscage = false;

    lScene.stateobjs.push(this);
    lScene.animates.push(this);

}

Exit.prototype = {
    constructor: Exit,
    open: function()
    {
        if(!this.isopening)
            sounds.door.play();
        if(this.isopen) return;
        this.isopen = true;
        this.isopening = true;
        this.hasopened = 0;

        this._vopen(true);

        return this;
    },

    _vopen: function(ind)
    {
        this.lodoor.ignore = ind;
        this.lidoor.ignore = ind;
        this.rodoor.ignore = ind;
        this.ridoor.ignore = ind;

    },
    save: function()
    {
        return {isopen: this.isopen, isopening: this.isopening, hasopened: this.hasopened};
    },
    restore: function(state)
    {
        if(this.isopening) sounds.door.pause();
        this.isopen = state.isopen;
        this.isopening = state.isopening;
        this.hasopened = state.hasopened;
        this.lodoor.rotateHere(0, -this.hasopened * LR90 * 0.95, 0);
        this.lidoor.rotateHere(0, this.hasopened * LR180 * 0.95, 0);
        this.rodoor.rotateHere(0, this.hasopened * LR90 * 0.95, 0);
        this.ridoor.rotateHere(0, -this.hasopened * LR180 * 0.95, 0);
        this.lodoor.procpos();
        this.rodoor.procpos();
        this._vopen(this.isopen);
        if(this.isopening) sounds.door.play();
    },
    animate: function(delta)
    {
        // Opens in 1 second
        if(!this.isopening) return;
        this.hasopened += delta;
        
        if(this.hasopened >= 1) {
            this.hasopened = 1;
            this.isopening = false;
            sounds.door.pause();
            
        }
        this.lodoor.rotateHere(0, -this.hasopened * LR90 * 0.95, 0);
        this.lidoor.rotateHere(0, this.hasopened * LR180 * 0.95, 0);
        this.rodoor.rotateHere(0, this.hasopened * LR90 * 0.95, 0);
        this.ridoor.rotateHere(0, -this.hasopened * LR180 * 0.95, 0);
        this.lodoor.procpos();
        this.rodoor.procpos();
    }
}

// Chrystal flower (maybe teddy later)
function flowerStructure()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.4});
    var outleaf = [
        [[-0.2, 0.3, -0.25], [-0.1, 0.4, -0.35], [0.1, 0.4, -0.35], [0.2, 0.3, -0.25]],
        [[-0.3, 0.2, -0.15], [-0.15, 0.2, -0.45], [0.15, 0.2, -0.45], [0.3, 0.2, -0.15]],
        [[-0.15, 0.1, -0.15], [-0.125, 0.1, -0.2], [0.125, 0.1, -0.2], [0.15, 0.1, -0.15]],
        [[-0.05, 0, -0.05], [-0.02, 0, -0.095], [0.02, 0, -0.095], [0.05, 0, -0.05]],
        ];
    var stru = new LStructureDef(ShaderSimple, {color: [1.0, 1.0, 0.5, 1.0], shininess: 15});

    stru.addBezierBlock({position: lFromXYZPYR(0, -0.3, 0, 0, LR90 / 2, 0), coords: outleaf, depth: 0.00005});
    stru.addBezierBlock({position: lFromXYZPYR(0, -0.3, 0, LR90 / 10, 3 * LR90 / 2, 0), coords: outleaf, depth: 0.00005});
    stru.addBezierBlock({position: lFromXYZPYR(0, -0.3, 0, 0, 5 * LR90 / 2, 0), coords: outleaf, depth: 0.00005});
    stru.addBezierBlock({position: lFromXYZPYR(0, -0.3, 0, LR90 / 10, 7 * LR90 / 2, 0), coords: outleaf, depth: 0.00005});
    stru.addCylinder({position: lFromXYZPYR(0, -0.29, 0, LR90, 0, 0), radius: 0.08, depth: 0.02});
    stru.addCylinder({position: lFromXYZPYR(0, -0.4, 0, LR90, 0, 0), radius: 0.005, depth: 0.1});
    return [gdef, stru];
}

function Flower(x, y, z, ry)
{
    BaseThing.call(this, structs.Flower, false, x, y, z, ry);
    lScene.stateobjs.push(this);
    this.isstanding = false;        // Stop shadow
    this.istravel = false;
    lScene.flowers.push(this);
}

Flower.prototype = Object.assign(Object.create(BaseThing.prototype), {
    constructor: Flower,
    chuck: function(person)
    {
        if(person instanceof Player) {
            lScene.lMessage("The flower is delicate. Throwing it breaks it.");
        }
        sounds.smash.play();
        this.end();
    },
    animate: function(delta)
    {
        if(!this.islive) return;
        // if(this.iscarried) return;
        this.standrot -= delta;
        if(this.standrot < 0) this.standrot += LR360
        this.aobj.rotateHere(0, this.standrot, 0);
        this.aobj.procpos();
    },
    fits: function(xobj)
    {
        if(xobj instanceof Exit) {
            var ve = vec4.fromValues(0, 0, 0, 1);
            vec4.transformMat4(ve, ve, xobj.obj.position);
            var obj = this.obj;
            if(Math.hypot(ve[0] - obj.x, ve[1] - obj.y, ve[2] - obj.z) <= 1) {
                lScene.stopsounds();
                lScene.success = true;
                lScene.seefinished = true;
                this.obj.moveHere(ve[0], ve[1], ve[2]);
                this.aobj.moveHere(0, 0, 0);
                this.obj.procpos();
                if(this.iscarried instanceof Kronky)
                    lScene.lMessage("Well - Kronky did it actually", "lightgreen");
                else
                    lScene.lMessage("Success!", "lightgreen");
                sounds.gong.play();
                sounds.whoosh.play();
            }
            return false;
        } else {
            return false;
        }
    },
    drophere: function(pobj, x, y, z, ry)
    {
        // Flower stands are done manually
        if(this.iscarried) {

            var ma = mat4.create();
            var mb = mat4.create();
            var va = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

            mat4.fromYRotation(mb, ry)
            mat4.translate(mb, mb, vec4.fromValues(0, 0, -0.9, 1.0));
            vec4.transformMat4(va, va, mb);

            x += va[0];
            y += va[1];
            z += va[2];

            var stand = null;
            var sobj = null;

            var pobj = this.iscarried.obj;

            var flen = lScene.flowerstands.length;
            for(var i = 0; i < flen; i++)
            {
                stand = lScene.flowerstands[i];
                sobj = stand.obj;

                var dis = Math.hypot(sobj.x - x, sobj.y - y, sobj.z - z);
                var pdis = Math.hypot(pobj.x - sobj.x, pobj.y - sobj.y, pobj.z - sobj.z);

                if(pdis <= 0.6) {
                    lScene.lMessage("Currently standing in (or on) a flower stand");
                    return false;
                } else if(dis <= 0.4) {
                    this.obj.moveHere(sobj.x, sobj.y, sobj.z);
                    this.obj.rotateHere(0, 0, 0);
                    this.aobj.moveHere(0, 0, 0);
                    this.obj.procpos();
                    this.iscarried = null;
                    return true;
                }
            }
        }
        lScene.lMessage("Can only place the flower on a flower stand");
        return false
    },

    place: function(x, y, z, ry)
    {
        this.islive = true;
        this.isstanding = false;
        this.obj.mkvisible(true);
        this.obj.moveHere(x, y, z);
        this.obj.procpos();
    },
    pickup: function(pobj)
    {
        // if(this.iscarried) 
            // pobj.carrying = null;
        this.iscarried = pobj;
        sounds.pickupflower.play();
        if(pobj instanceof Player) {
            this.aobj.moveHere(0, -0.3, 0.20);
        } else if(pobj instanceof Kronky) {
            this.aobj.moveHere(0, -0.5, 0.25);
            pobj.ltarm.rotateHere(LR90 * .55, -LR90 * .9, 0);
            pobj.lbarm.rotateHere( LR90 * 0.45, 0, 0);
            pobj.rtarm.rotateHere(LR90 * .55, LR90 * .9, 0);
            pobj.rbarm.rotateHere( LR90 * 0.45, 0, 0);
        }
    },
    resetpickup: function(pobj)
    {
        this.iscarried = null;
    },
    respawn: function()
    {
        var obj = new Flower(0, 0, 0, 0);
        return obj;
    },
    kronkycarry: function(kronky)
    {
        var obj = this.obj;
        var crobj = kronky.obj;

        var ma = mat4.create();
        var mb = mat4.create();
        var va = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        mat4.fromYRotation(mb, crobj.ry)
        mat4.translate(mb, mb, vec4.fromValues(0, 0, -0.90, 1.0));
        // mat4.translate(mb, mb, vec4.fromValues(0, -.5, 0.5, 1.0));
        vec4.transformMat4(va, va, mb);

        obj.rotateFlatHere(0, crobj.ry, 0);
        obj.moveHere(crobj.x + va[0], crobj.y + va[1], crobj.z + va[2]);
        // obj.rotate(kronky.rx, 0, 0);
        // this.aobj.rotateHere(0, 0, 0);
        this.obj.procpos();
    },

    playercarry: function(person)
    {
        var obj = this.obj;

        var ma = mat4.create();
        var mb = mat4.create();
        var va = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
        var q = quat.create();
        quat.invert(q, lCamera.quat);
        mat4.fromQuat(mb, q)
        // mat4.translate(mb, mb, vec4.fromValues(0, -.3, -.7, 1.0));
        mat4.translate(mb, mb, vec4.fromValues(0, 0.0, -0.90, 1.0));
        vec4.transformMat4(va, va, mb);

        obj.moveHere(lCamera.x + va[0], lCamera.y + va[1], lCamera.z + va[2]);
        obj.rotateFlatHere(0, lCamera.ry, 0);
        obj.rotateFlat(lCamera.rx, 0, 0);
        // this.aobj.rotateHere(0, 0, 0);
        this.obj.procpos();
    },
});

function liftStructure()
{

    var gdef = new LGroupDef();
    var stru = new LStructureDef(ShaderLight, {color: [0.4, 1.0, 1.0, 0.5], collision: LSTATIC});
    // stru.addCylinder({position: lFromXYZPYR(-.35, -1, -.35, LR90, 0, 0), radius: .05, depth: 1.5, corners: null, segments: 6});
    // stru.addCylinder({position: lFromXYZPYR(.35, -1, -.35, LR90, 0, 0), radius: .05, depth: 1.5, corners: null, segments: 6});
    // stru.addCylinder({position: lFromXYZPYR(-.35, -1, .35, LR90, 0, 0), radius: .05, depth: 1.5, corners: null, segments: 6});
    // stru.addCylinder({position: lFromXYZPYR(.35, -1, .35, LR90, 0, 0), radius: .05, depth: 1.5, corners: null, segments: 6});
    // stru.addCylinder({position: lFromXYZPYR(0, -1, .5, LR90, 0, 0), radius: .05, depth: 1.5, corners: null, segments: 6});
    // stru.addCylinder({position: lFromXYZPYR(0, -1, -.5, LR90, 0, 0), radius: .05, depth: 1.5, corners: null, segments: 6});
    // stru.addCylinder({position: lFromXYZPYR(.5, -1, 0, LR90, 0, 0), radius: .05, depth: 1.5, corners: null, segments: 6});
    // stru.addCylinder({position: lFromXYZPYR(-.5, -1, 0, LR90, 0, 0), radius: .05, depth: 1.5, corners: null, segments: 6});
    stru.addCylinder({position: lFromXYZPYR(0, -2.4, 0, LR90, 0, 0), radius: 0.55, depth: 0.01, corners: null});

    var ma = [
        [[-.5, -2.5, 0], [-.5, -2.244, -.667], [.5, -2.166, -.667], [.5, -1.9, 0]],
        [[-.5, -2.4, 0], [-.5, -2.144, -.667], [.5, -2.066, -.667], [.5, -1.8, 0]],
        ];

    var mb = [
        [[.5, -1.9, 0], [.5, -1.644, .667], [-.5, -1.566, .667], [-.5, -1.3, 0]],
        [[.5, -1.8, 0], [.5, -1.544, .667], [-.5, -1.466, .667], [-.5, -1.2, 0]],
        ];

    var mc = [
        [[-.5, -1.3, 0], [-.5, -1.044, -.667], [.5, -0.966, -.667], [.5, -0.7, 0]],
        [[-.5, -1.2, 0], [-.5, -0.944, -.667], [.5, -0.866, -.667], [.5, -0.6, 0]],
        ];

    var md = [
        [[.5, -0.7, 0], [.5, -0.444, .667], [-.5, -0.366, .667], [-.5, -0.1, 0]],
        [[.5, -0.6, 0], [.5, -0.344, .667], [-.5, -0.266, .667], [-.5, 0, 0]],
        ];



    stru.addBezierBlock({depth: .02, coords: ma, ysegments: 1, corners: null, hold: [LI_LEFT, LI_RIGHT]});
    stru.addBezierBlock({depth: .02, coords: mb, ysegments: 1, corners: null, hold: [LI_LEFT, LI_RIGHT]});
    stru.addBezierBlock({depth: .02, coords: mc, ysegments: 1, corners: null, hold: [LI_LEFT, LI_RIGHT]});
    stru.addBezierBlock({depth: .02, coords: md, ysegments: 1, corners: null, hold: [LI_LEFT, LI_RIGHT]});
    stru.useCorners([[-.1, -2.4, -.1], [.1, 0, .1]], {});
    return [gdef, stru];
}

function Lift(x, y, z, ry)
{
    this.obj = new LWObject(structs.Lift[0], this);
    this.iobj = new LObject(structs.Lift[1], this);
    this.obj.addChild(this.iobj, mat4.create());
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.animates.push(this);
    this.obj.procpos();
    this.istravel = true;
    this.iscage = false;
    this.lightheight = lScene.prngd.next(1.0);
}

Lift.prototype = {
    constructor: Lift,
    animate: function(delta) {
        this.iobj.rotate(0, delta * 3, 0);
        this.iobj.procpos();
        this.lightheight += delta * .3;
        if(this.lightheight > 1) this.lightheight -= 1;
    }
}


function dodgyBridgeStructure()
{
    var stra = new LStructureDef(ShaderSimple, {color: [0.6, 0.3, 0.3, 1.0], collision: LSTATIC});
    stra.addBlock({position: lFromXYZ(0, -2.5, 0), size: [0.5, 0.1, 5.0], corners: [[-.5, -2.5, -5], [ .5, 0, 5]]});

    var strp = new LStructureDef(ShaderLight, {color: [1.0, 0.8, 0.8, 0.5], collision: LNONE});
    strp.addBlock({position: lFromXYZ(0.45, -1, -4.95), size: [0.05, 1.5, 0.05]});
    strp.addBlock({position: lFromXYZ(-0.45, -1, -4.95), size: [0.05, 1.5, 0.05]});
    strp.addBlock({position: lFromXYZ(0.45, -1, 4.95), size: [0.05, 1.5, 0.05]});
    strp.addBlock({position: lFromXYZ(-0.45, -1, 4.95), size: [0.05, 1.5, 0.05]});

    return [stra, strp];
}

function dodgyBridge2Structure()
{
    var stra = new LStructureDef(ShaderSimple, {color: [0.6, 0.3, 0.3, 1.0], collision: LSTATIC});
    stra.addBlock({position: lFromXYZ(0, -2.5, 0), size: [0.5, 0.1, 10.0], corners: [[-.5, -2.5, -10], [ .5, 0, 10]]});

    var strp = new LStructureDef(ShaderLight, {color: [1.0, 0.8, 0.8, 0.5], collision: LNONE});
    strp.addBlock({position: lFromXYZ(0.45, -1, -9.95), size: [0.05, 1.5, 0.05]});
    strp.addBlock({position: lFromXYZ(-0.45, -1, -9.95), size: [0.05, 1.5, 0.05]});
    strp.addBlock({position: lFromXYZ(0.45, -1, 9.95), size: [0.05, 1.5, 0.05]});
    strp.addBlock({position: lFromXYZ(-0.45, -1, 9.95), size: [0.05, 1.5, 0.05]});

    return [stra, strp];
}

function DodgyBridgeBase(struc, x, y, z, ry)
{
    this.obj = new LWObject(struc[0], this);
    this.mobj = new LWObject(struc[1], this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.lPlace(this.mobj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.istravel = false;
    this.islive = true;
    this.isfloor = true;
    this.iswire = false;
    this.candrop = false;
    this.destroy = 0;
    this.obj.procpos();
    this.mobj.procpos();
    this.iscage = false;
    this.numon = 0;
    this.isdestroying = false;

    lScene.animates.push(this);
    lScene.stateobjs.push(this);
    this.lightheight = lScene.prngd.next(1.0);
}

DodgyBridgeBase.prototype = {
    constructor: DodgyBridgeBase,

    save: function()
    {
        var obj = this.obj;
        return {
            isvisible: obj.isvisible,
            x: obj.x,
            y: obj.y,
            z: obj.z,
            destroy: this.destroy,
            numon: this.numon,
            isdestroying: this.isdestroying,
        };
    },

    restore: function(saved)
    {
        var obj = this.obj;
        obj.x = saved.x;
        obj.y = saved.y;
        obj.z = saved.z;
        obj.isvisible = saved.isvisible;

        if(this.isdestroying) sounds.rumble.pause();

        this.destroy = saved.destroy;
        this.numon = saved.numon;
        this.isdestroying = saved.isdestroying;
        if(obj.isvisible) obj.procpos();
        if(this.isdestroying) sounds.rumble.play();
        
    },

    onthis: function()
    {
        this.numon += 1;
        if(!this.isdestroying) {
            this.isdestroying = true;
            sounds.rumble.play();
        }
    },

    animate: function(delta)
    {
        // TODO with some optimisation
        // Needs to crash if > 1 on bridge
        if(this.isdestroying) {
            if(this.numon == 0) this.numon = 1;
            this.destroy += delta * this.numon * this.desfact;
            var prngd = lScene.prngd;
            var amt = this.destroy * this.shake;
            var amth = amt / 2
            this.obj.moveFlat(prngd.next(amt) - amth, prngd.next(amt) - amth, prngd.next(amt) - amth);
            this.obj.procpos();
    
            if(this.destroy > this.broken) {
                this.obj.isvisible = false;
                this.isdestroying = false;
                this.destroy = 0;
                sounds.rumble.pause();
                sounds.smash.play();
            }
        }
        this.numon = 0;
        this.lightheight += delta * .3;
        if(this.lightheight > 1) this.lightheight -= 1;
    },
}

function DodgyBridge(x, y, z, ry)
{
    DodgyBridgeBase.call(this, structs.DodgyBridge, x, y, z, ry);
    this.desfact = 1;
    this.broken = 6;
    this.shake = 0.03;
}

DodgyBridge.prototype = Object.assign(Object.create(DodgyBridgeBase.prototype), {
    constructor: DodgyBridge,
});

function DodgyBridge2(x, y, z, ry)
{
    DodgyBridgeBase.call(this, structs.DodgyBridge2, x, y, z, ry);
    this.desfact = 0.5;
    this.broken = 5.5;
    this.shake = 0.02;
}
DodgyBridge2.prototype = Object.assign(Object.create(DodgyBridgeBase.prototype), {
    constructor: DodgyBridge2,
});

function cageStructure()
{
    var stru = new LStructureDef(ShaderSimple, {color: [0.4, 0.1, 0.4, 1.0], collision: LDYNAMIC, distance: 1.0});
    // stru.addCylinder({position: lFromXYZPYR(0, -2.395, 0, LR90, 0, 0), radius: 1, depth: 0.05});
    stru.addBlock({position: lFromXYZPYR(-0.95, -2.395, 0, 0, 0, 0), size: [0.05, 0.005, 1]});
    stru.addBlock({position: lFromXYZPYR(0.95, -2.395, 0, 0, 0, 0), size: [0.05, 0.005, 1]});
    stru.addBlock({position: lFromXYZPYR(0, -2.395, -0.95, 0, 0, 0), size: [1, 0.005, 0.05]});
    stru.addBlock({position: lFromXYZPYR(0, -2.395, 0.95, 0, 0, 0), size: [1, 0.005, 0.05]});


    stru.addBlock({position: lFromXYZPYR(-.73889, -2.395, 0, 0, 0, 0), size: [.05, 0.005, 1]});
    stru.addBlock({position: lFromXYZPYR(-.52778, -2.395, 0, 0, 0, 0), size: [.05, 0.005, 1]});
    stru.addBlock({position: lFromXYZPYR(-.31667, -2.395, 0, 0, 0, 0), size: [.05, 0.005, 1]});
    stru.addBlock({position: lFromXYZPYR(-.10556, -2.395, 0, 0, 0, 0), size: [.05, 0.005, 1]});
    stru.addBlock({position: lFromXYZPYR(.10556, -2.395, 0, 0, 0, 0), size: [.05, 0.005, 1]});
    stru.addBlock({position: lFromXYZPYR(.31667, -2.395, 0, 0, 0, 0), size: [.05, 0.005, 1]});
    stru.addBlock({position: lFromXYZPYR(.52778, -2.395, 0, 0, 0, 0), size: [.05, 0.005, 1]});
    stru.addBlock({position: lFromXYZPYR(.73889, -2.395, 0, 0, 0, 0), size: [.05, 0.005, 1]});

    stru.addBlock({position: lFromXYZPYR(0, -2.395, -.73889, 0, 0, 0), size: [1, 0.005, .05]});
    stru.addBlock({position: lFromXYZPYR(0, -2.395, -.52778, 0, 0, 0), size: [1, 0.005, .05]});
    stru.addBlock({position: lFromXYZPYR(0, -2.395, -.31667, 0, 0, 0), size: [1, 0.005, .05]});
    stru.addBlock({position: lFromXYZPYR(0, -2.395, -.10556, 0, 0, 0), size: [1, 0.005, .05]});
    stru.addBlock({position: lFromXYZPYR(0, -2.395, .10556, 0, 0, 0), size: [1, 0.005, .05]});
    stru.addBlock({position: lFromXYZPYR(0, -2.395, .31667, 0, 0, 0), size: [1, 0.005, .05]});
    stru.addBlock({position: lFromXYZPYR(0, -2.395, .52778, 0, 0, 0), size: [1, 0.005, .05]});
    stru.addBlock({position: lFromXYZPYR(0, -2.395, .73889, 0, 0, 0), size: [1, 0.005, .05]});


    var stp = new LStructureDef(ShaderLight, {color: [1.0, 0.50, 1.0, 0.5], collision: LNONE});
    // stp.addCylinder({position: lFromXYZPYR(-.65, -0.85, -.65, LR90, 0, 0), radius: 0.05, depth: 1.5});
    // stp.addCylinder({position: lFromXYZPYR(-.65, -0.85,  .65, LR90, 0, 0), radius: 0.05, depth: 1.5});
    // stp.addCylinder({position: lFromXYZPYR(.65,  -0.85, -.65, LR90, 0, 0), radius: 0.05, depth: 1.5});
    // stp.addCylinder({position: lFromXYZPYR(.65,  -0.85,  .65, LR90, 0, 0), radius: 0.05, depth: 1.5});
    stp.addCylinder({position: lFromXYZPYR(-.95, -0.87, -.95, LR90, 0, 0), radius: 0.05, depth: 1.52});
    stp.addCylinder({position: lFromXYZPYR(-.95, -0.87,  .95, LR90, 0, 0), radius: 0.05, depth: 1.52});
    stp.addCylinder({position: lFromXYZPYR(.95,  -0.87, -.95, LR90, 0, 0), radius: 0.05, depth: 1.52});
    stp.addCylinder({position: lFromXYZPYR(.95,  -0.87,  .95, LR90, 0, 0), radius: 0.05, depth: 1.52});
    stp.addCylinder({position: lFromXYZPYR(-.95, -0.87,  0,    LR90, 0, 0), radius: 0.05, depth: 1.52});
    stp.addCylinder({position: lFromXYZPYR(.95,  -0.87,  0,    LR90, 0, 0), radius: 0.05, depth: 1.52});
    stp.addCylinder({position: lFromXYZPYR(0,     -0.87, -.95, LR90, 0, 0), radius: 0.05, depth: 1.52});
    stp.addCylinder({position: lFromXYZPYR(0,     -0.87, .95,  LR90, 0, 0), radius: 0.05, depth: 1.52});

    stp.addCylinder({position: lFromXYZPYR(0, -1, .99, 0, 0, 0), radius: 0.2, depth: 0.001});
    stp.addCylinder({position: lFromXYZPYR(0, -1, -.99, 0, 0, 0), radius: 0.2, depth: 0.001});
    stp.addCylinder({position: lFromXYZPYR(.99, -1, 0, 0, LR90, 0), radius: 0.2, depth: 0.001});
    stp.addCylinder({position: lFromXYZPYR(-.99, -1, 0, 0, LR90, 0), radius: 0.2, depth: 0.001});
    // stp.addCylinder({position: lFromXYZPYR(.69, -1, .69, 0, LR90 / 2, 0), radius: 0.2, depth: 0.001});
    // stp.addCylinder({position: lFromXYZPYR(-.69, -1, -.69, 0, LR90 / 2, 0), radius: 0.2, depth: 0.001});
    // stp.addCylinder({position: lFromXYZPYR(.69, -1, -.69, 0, -LR90 / 2, 0), radius: 0.2, depth: 0.001});
    // stp.addCylinder({position: lFromXYZPYR(-.69, -1, .69, 0, -LR90 / 2, 0), radius: 0.2, depth: 0.001});
    stp.addCylinder({position: lFromXYZPYR(.99, -1, .99, 0, LR90 / 2, 0), radius: 0.2, depth: 0.001});
    stp.addCylinder({position: lFromXYZPYR(-.99, -1, -.99, 0, LR90 / 2, 0), radius: 0.2, depth: 0.001});
    stp.addCylinder({position: lFromXYZPYR(.99, -1, -.99, 0, -LR90 / 2, 0), radius: 0.2, depth: 0.001});
    stp.addCylinder({position: lFromXYZPYR(-.99, -1, .99, 0, -LR90 / 2, 0), radius: 0.2, depth: 0.001});

    return [stru, stp];
}

function Cage(x, y, z, ry)
{
    this.obj = new LWObject(structs.Cage[0], this);
    var pill = new LObject(structs.Cage[1], this);

    this.obj.addChild(pill, mat4.create());
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.isfloor = false;
    this.iswire = false;
    this.candrop = false;
    this.iscage = true;


    this.ry = 0;
    this.carries = [];
    this.distance = 0;
    this.backdist = 0;
    this.flying = false;
    this.falling = false;
    this.vvel = 0;
    this.shotby = null;
    this.shooting = null;
    this.fact = 1;
    this.persons = [];
    this.carlen = 0;
    this.perlen = 0;
    this.matr = mat4.create();

    // Temporary stuff
    // Initialised here for performance
    this.scoll = new LVirtObject(this, 0, 0, 0, 0);
    this.vec = vec3.create();

    this.pccol = new LVirtObject(this, 0, 0, 0, 0.2);
    this.pccol.ignore = true;

    lScene.animates.push(this);
    lScene.stateobjs.push(this);
    this.lightheight = lScene.prngd.next(1.0);
}

Cage.prototype = {
    constructor: Cage,

    ishit: function(person, matr, ry, diag)
    {
        if(this.flying) return;
        var obj = this.obj;
        // See what is on this

        obj.ignore = true;
        person.obj.ignore = true;
        person.carrying.obj.ignore = true;

        this.carries = [];
        this.persons = [];

        var self = this;

        var tcars = {};
        var tpers = {};

        function _addd(what, thi)
        {
            what[thi.obj.key] = thi;
        }

        var xf = obj.x - 0.9;
        var xt = obj.x + 0.9;
        var zf = obj.z - 0.9;
        var zt = obj.z + 0.9;

        var fact = 1;
        if(diag != 0) fact = SQRT2;
        this.fact = fact;

        var tooclose = false;

        function _sees(cob)
        {
            var thing = cob.control;
            if(!thing.iscarried) {
                if(cob.x >= xf && cob.x <= xt && cob.z >= zf && cob.z <= zt) {
                    _addd(tcars, thing);
                    if(thing instanceof Person) {
                        _addd(tpers, thing);
                        thing.travelling = self;
                        if(thing.carrying) {
                            _addd(tcars, thing.carrying);
                        }
                    }
                } else {
                    tooclose = true;
                }
            }
        }

        obj.warp();
        lScene.lCAllDynamicPointDetect(obj, 1.4, _sees);

        if(!tooclose) {
            if(diag != 0) {
                function _seed(cob)
                {
                    if(!cob.control.isfloor) {
                        if(cob.x < xf || cob.x > xt || cob.z < zf || cob.z > zt) {
                            tooclose = true;
                        }
                    }
                }
    
                var pccol = this.pccol;
                pccol.copy(obj);
                switch(diag) {
                case 1:
                    pccol.setPosition(obj.x - 2, obj.y, obj.z);
                    lScene.lCAllPointDetect(pccol, 1.4, _seed);
                    pccol.setPosition(obj.x, obj.y, obj.z - 2);
                    lScene.lCAllPointDetect(pccol, 1.4, _seed);
                    break;
                case 3:
                    pccol.setPosition(obj.x - 2, obj.y, obj.z);
                    lScene.lCAllPointDetect(pccol, 1.4, _seed);
                    pccol.setPosition(obj.x, obj.y, obj.z + 2);
                    lScene.lCAllPointDetect(pccol, 1.4, _seed);
                    break;
                case 5:
                    pccol.setPosition(obj.x + 2, obj.y, obj.z);
                    lScene.lCAllPointDetect(pccol, 1.4, _seed);
                    pccol.setPosition(obj.x, obj.y, obj.z + 2);
                    lScene.lCAllPointDetect(pccol, 1.4, _seed);
                    break;
                case 7:
                    pccol.setPosition(obj.x + 2, obj.y, obj.z);
                    lScene.lCAllPointDetect(pccol, 1.4, _seed);
                    pccol.setPosition(obj.x, obj.y, obj.z - 2);
                    lScene.lCAllPointDetect(pccol, 1.4, _seed);
                    break;
                }
            }
        }

        obj.ignore = false;
        person.obj.ignore = false;
        person.carrying.obj.ignore = false;

        if(tooclose) {
            for(var i in tpers) tpers[i].travelling = null;
            return false;
        }

        // From here - we are flying

        var player = lScene.player;

        for(var k in tcars) this.carries.push(tcars[k]);
        for(var k in tpers) this.persons.push(tpers[k]);

        this.carlen = this.carries.length;
        this.perlen = this.persons.length;

        this.ry = ry;
        this.matr = matr;

        var ve = vec3.create();
        var ma = mat4.create();

        var scoll = this.scoll;

        var onfloor = false;

        function seef(cob)
        {
            if(cob.control.isfloor)
                onfloor = true;
        }

        mat4.fromTranslation(ma, vec3.fromValues(0.0, 0.0, -3 * fact));
        mat4.multiply(ma, matr, ma);
        mat4.getTranslation(ve, ma);

        scoll.setPosition(obj.x + ve[0], obj.y + ve[1], obj.z + ve[2]);

        mat4.fromTranslation(ma, vec3.fromValues(0.0, 0.0, -fact));
        mat4.multiply(ma, matr, ma);
        mat4.getTranslation(ve, ma);

        var tdist = 4.0;

        for(;;)
        {
            if(scoll.x < lScene.minx || scoll.x > lScene.maxx || scoll.z < lScene.minz || scoll.z > lScene.maxz) break;
            lScene.lCAllStaticPointDetect(scoll, 0.1, seef);
            if(onfloor) {
                break;
            }
            tdist += 1;
            scoll.setPosition(scoll.x + ve[0], scoll.y + ve[1], scoll.z + ve[2]);
        }

        this.distance = tdist * fact;
        this.flying = true;
        this.shooting = person;
        sounds.cagefly.play();
        return true;

    },

    travel: function(person, delta, x, z, rx, ry)
    {
        
        if(rx == 0 && ry == 0) return;
        if(person.carrying) {
            var cobj = person.carrying.obj;
            this.pccol.copy(cobj);
            person.rotateFlat(rx, ry);
            person.obj.procpos();
            person.carrything();
            var hit = false;
            function _see(cob) {
                hit = true;
            }
            person.obj.ignore = true;
            this.obj.ignore = true;
            cobj.ignore = true;
            lScene.lCAllDynamicPointDetect(this.pccol, .2, _see);
            person.obj.ignore = false;
            this.obj.ignore = false;
            cobj.ignore = false;
            if(hit) {
                person.rotateFlat(-rx, -ry);
                person.obj.procpos();
                person.carrything();
                cobj.warp();
            }
        } else {
            person.obj.rotateFlat(rx, ry);
            person.obj.procpos();
        }
    },

    animate: function(delta)
    {
        this.lightheight += delta * .3;
        if(this.lightheight > 1) this.lightheight -= 1;
        if(!this.flying) return;


        var vec = this.vec;
        var wdist = delta * 20;
        if(this.falling) {
            if(this.backdist != 0) {
                this.backdist -= wdist;
                if(this.backdist < 0) {
                    wdist += this.backdist;
                    this.backdist = 0;
                }
                ma = mat4.create();
                mat4.fromTranslation(ma, vec3.fromValues(0.0, 0.0, wdist));
                mat4.multiply(ma, this.matr, ma);
                mat4.getTranslation(vec, ma);
                this.moveall(vec[0], vec[1], vec[2]);
            } else {
                this.vvel += delta;
                this.moveall(0, -this.vvel, 0);
                if(this.obj.y < -7.5) {
                    // for(var i = 0; i < this.perlen; i++) this.persons[i].die();
                    for(var i = 0; i < this.carlen; i++) this.carries[i].end();
                    this.empty();
                    this.obj.mkvisible(false);
                    this.islive = false;
                    sounds.splash.play();
                }
            }
        } else {
            var carries = this.carries;
            var carlen = this.carlen;

            this.distance -= wdist;
            if(this.distance < 0) {
                wdist += this.distance;
                this.distance = 0;
            }

            var ma = mat4.create();
            var ve = vec3.create();
            mat4.fromTranslation(ma, vec3.fromValues(0, 0, -wdist));
            mat4.multiply(ma, this.matr, ma);

            mat4.getTranslation(vec, ma);

            this.moveall(vec[0], vec[1], vec[2]);

            this.obj.ignore = true;
            for(var i = 0; i < carlen; i++) carries[i].obj.ignore = true;
            this.shooting.obj.ignore = true;
            if(this.shooting.carrying) this.shooting.carrying.obj.ignore = true;

            var hitfloor = false;
            var hitthing = false;
            var wire = false;

            var obj = this.obj;

            function _seestat(cob)
            {
                if(cob.control.isfloor) {
                    hitfloor = true;
                } else {
                    hitthing = true;
                    if(cob.control.iswire) {
                        wire = true;
                    }
                }
            }

            this.pccol.copy(this.obj);

            lScene.lCAllStaticPointDetect(this.obj, 1.0, _seestat);
            
            var xf = obj.x - 1.1;
            var xt = obj.x + 1.1;

            var zf = obj.z - 1.1;
            var zt = obj.z + 1.1;

            function _seedyn(cob)
            {
                if(cob.x >= xf && cob.x <= xt && cob.z >= zf && cob.z <= zt) {
                    hitthing = true;
                }
            }

            lScene.lCAllDynamicPointDetect(this.obj, 1.51, _seedyn); // Should work >=1.5 is only relevant to diagonals here

            this.obj.ignore = false;
            for(var i = 0; i < carlen; i++) carries[i].obj.ignore = false;
            this.shooting.obj.ignore = false;
            if(this.shooting.carrying) this.shooting.carrying.obj.ignore = false;

            if(hitthing) {
                this.backdist = wdist + (2 * this.fact);    // Bounce back
                this.falling = true;
                if(wire)
                    sounds.thud.play();
                else
                    sounds.twang.play();
            } else if(hitfloor) {
                if(this.distance == 0) {
                    sounds.landing.play();
                    this.empty();
                }
            }
        }
    },

    empty: function()
    {
        this.flying = false;
        sounds.cagefly.pause();
        for(var i = 0; i < this.perlen; i++) {
            this.persons[i].travelling = null;
        }
        this.shotby.hashit = null;
        this.shotby = null;
    },

    moveall: function(x, y, z)
    {
        this.obj.moveAbs(x, y, z);
        this.obj.procpos();
        for(var i = 0; i < this.carlen; i++) {
            var aobj = this.carries[i].obj;
            aobj.moveAbs(x, y, z);
            aobj.procpos();
        }
    },

    save: function()
    {
        var persons = [];
        for(var i = 0; i < this.perlen; i++) persons.push(this.persons[i]);
        var carries = [];
        for(var i = 0; i < this.carlen; i++) carries.push(this.carries[i]);
        return {
            obj: this.obj.save(),
            islive: this.islive,
            ry: this.ry,
            distance: this.distance,
            backdist: this.backdist,
            flying: this.flying,
            falling: this.falling,
            vvel: this.vvel,
            shotby: this.shotby,
            sooting: this.shooting,
            fact: this.fact,
            persons: persons,
            carries: carries,
            carlen: this.carlen,
            perlen: this.perlen,
            matr: mat4.clone(this.matr),
        };
    },
    restore: function(saved)
    {
        if(this.flying) sounds.cagefly.pause();
        this.obj.restore(saved.obj);

        var persons = [];
        for(var i = 0; i < saved.perlen; i++) persons.push(saved.persons[i]);
        var carries = [];
        for(var i = 0; i < saved.carlen; i++) carries.push(saved.carries[i]);
        
        this.islive = saved.islive;
        this.ry = saved.ry;
        this.distance = saved.distance;
        this.backdist = saved.backdist;
        this.flying = saved.flying;
        this.falling = saved.falling;
        this.vvel = saved.vvel;
        this.shotby = saved.shotby;
        this.sooting = saved.shooting;
        this.fact = saved.fact;
        this.persons = persons;
        this.carries = carries;
        this.carlen = saved.carlen;
        this.perlen = saved.perlen;
        this.matr = mat4.clone(saved.matr);
        if(this.flying) sounds.cagefly.play();
    }
}



function pushMeStructure()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.3});
    var structure = new LStructureDef(ShaderSimple, {color: [0.4, 0.1, 0.4, 1.0], collision: LNONE});
    structure.addCylinder({position: lFromXYZ(-0.07, 0, 0.5), radius: 0.03, depth: 0.5, segments: 6})
    structure.addCylinder({position: lFromXYZ(0, -0.07, 0.5), radius: 0.03, depth: 0.5, segments: 6})
    structure.addCylinder({position: lFromXYZ(0.07, 0, 0.5), radius: 0.03, depth: 0.5, segments: 6})
    structure.addCylinder({position: lFromXYZ(0, 0.07, 0.5), radius: 0.03, depth: 0.5, segments: 6})
    structure.addCylinder({position: lFromXYZ(-0.05, -0.05, 0.5), radius: 0.03, depth: 0.5, segments: 6})
    structure.addCylinder({position: lFromXYZ(0.05, -0.05, 0.5), radius: 0.03, depth: 0.5, segments: 6})
    structure.addCylinder({position: lFromXYZ(-0.05, 0.05, 0.5), radius: 0.03, depth: 0.5, segments: 6})
    structure.addCylinder({position: lFromXYZ(0.05, 0.05, 0.5), radius: 0.03, depth: 0.5, segments: 6})
    structure.addTriangle({position: lFromXYZPYR(0, 0, 1.0, 0, LR90, 0), coords: [[-0.2, 0.2], [-0.2, -0.2], [0.2, 0]], depth: 0.1})
    structure.addBlock({position: lFromXYZ(0,  0, 0.05), size: [0.15, 0.2, 0.05]});
    return [gdef, structure];
}

function PushMe(x, y, z, ry)
{
    BaseThing.call(this, structs.PushMe, true, x, y, z, ry);
    lScene.stateobjs.push(this);
    this.bcoll = new LVirtObject(this, 0, 0, 0, 0.2);

    this.hashit = null;
}

PushMe.prototype = Object.assign(Object.create(BaseThing.prototype), {
    constructor: PushMe,
    vsave: function(ret)
    {
        ret.hashit = this.hashit;
    },
    vrestore: function(saved)
    {
        this.hashit = saved.hashit;
    },

    respawn: function()
    {
        var obj = new PushMe(0, 0, 0, 0);
        return obj;
    },

    fire: function(person)
    {
        if(this.hashit) return;
        var bcoll = this.bcoll;
        var obj = this.obj;
        var pobj = person.obj;

        var ma = mat4.create();
        var mb = mat4.create();
        var ve = vec3.create();

        var mb = mat4.fromYRotation(mb, person.obj.ry);

        var ma = mat4.fromTranslation(ma, vec4.fromValues(0, 0, -2.0, 1));
        mat4.multiply(ma, mb, ma);
        mat4.getTranslation(ve, ma);

        bcoll.setPosition(obj.x + ve[0], obj.y + ve[1], obj.z + ve[2]);

        // var ma = mat4.fromTranslation(ma, vec4.fromValues(0, 0, -4, 1));
        // mat4.multiply(ma, mb, ma);
        // mat4.getTranslation(ve, ma);

        // bcoll.x += ve[0];
        // bcoll.y += ve[1];
        // bcoll.z += ve[2];

        var hitcage = null;

        function _see(cob)
        {
            if(cob.control.iscage)
                if(!cob.control.flying)
                    hitcage = cob.control;
        }

        obj.ignore = true;
        pobj.ignore = true;

        lScene.lCAllDynamicPointDetect(bcoll, 0.1, _see);

        obj.ignore = false;
        pobj.ignore = false;

        if(!hitcage) {
            if(person instanceof Player)
                lScene.lMessage("Missed all cages");
            sounds.click.play();
            return;
        }

        // First of all, check angle 


        var diag = 0;

        var hobj = hitcage.obj;

        var ry = person.obj.ry + (LR90 / 4);
        if(ry < 0) ry += LR360;
        if(ry > LR360) ry -= LR360;

        ry = Math.floor(2 * ry / LR90);

        if ((ry % 2) != 0)
            diag = ry;

        ry *= LR90 / 2;     // Which 45 Degrees

        // ma = mat4.create();
        // mb = mat4.create();
        // ve = vec3.create();

        mat4.fromTranslation(ma, vec4.fromValues(0, 0, -1.8, 1));
        mat4.fromYRotation(mb, ry);
        mat4.multiply(ma, mb, ma);
        mat4.getTranslation(ve, ma);

        bcoll.setPosition(hobj.x + ve[0], hobj.y + ve[1], hobj.z + ve[2]);

        var hit = false;

        function _see2(cob) {
           hit = true;
        }

        lScene.lCAllStaticPointDetect(bcoll, 0.2, _see2);
        if(hit) {
            if(person instanceof Player)
                lScene.lMessage("Cannot push cage in this direction");
            sounds.clunk.play();
            return;
        }

        // We have hit a cage, however, stop if objects are too close

        if(!hitcage.ishit(person, mb, ry, diag)) {
            if(person instanceof Player)
                lScene.lMessage("Object too close to cage");
            sounds.clunk.play();
            return;
        }
        
        hitcage.shotby = this;
        this.hashit = hitcage;
        sounds.pushme.play();
    }
});
    
    

function zip11Structure()
{
    var stru = new LStructureDef(ShaderLight, {color: [0.7, 1.0, 0.7, 0.5], collision: LNONE});
    stru.addCylinder({position: lFromXYZPYR(0, -2.0, -5.5, -0.42663, 0, 0), radius: 0.02, depth: 6.0415});
    stru.addBlock({position: lFromXYZPYR(-.25, -1.01, 0, 0, 0, 0), size: [.02, 1.49, .02]});
    stru.addBlock({position: lFromXYZPYR(.25, -1.01, 0, 0, 0, 0), size: [.02, 1.49, .02]});
    stru.addBlock({position: lFromXYZPYR(0, 0.5, 0, 0, 0, 0), size: [0.27 , 0.02, .02]});
    stru.addBlock({position: lFromXYZPYR(-.25, -6.01, -11, 0, 0, 0), size: [.02, 1.49, .02]});
    stru.addBlock({position: lFromXYZPYR(.25, -6.01, -11, 0, 0, 0), size: [.02, 1.49, .02]});
    stru.addBlock({position: lFromXYZPYR(0, -4.50, -11, 0, 0, 0), size: [0.27, 0.02, .02]});

    var strc = new LStructureDef(ShaderLight, {color: [0.7, 1.0, 0.7, 0.5], collision: LNONE});
    strc.addBlock({size: [0.3, 0.02, 0.02]});

    return [stru, strc];
}

function ZipBase(x, y, z, ry)
{
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.lPlace(this.cobj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.pickups.push(this);
    this.obj.procpos();

    this.ry = ry;
    this.canpickup = true;
    this.cobj.mkvisible(false);
    this.iscage = false;
    this.lightheight = lScene.prngd.next(1.0);

    this.statestatic = true;

    

    var mb = mat4.create();
    mat4.fromYRotation(mb, ry);
    var ma = mat4.create();

    mat4.fromTranslation(ma, vec3.fromValues(0, -this.vertical, -this.horizontal));
    mat4.multiply(ma, mb, ma);
    var ve = vec3.create();
    mat4.getTranslation(ve, ma);

    this.endx = x + ve[0];
    this.endy = y + ve[1];
    this.endz = z + ve[2];

    mat4.fromTranslation(ma, vec3.fromValues(0, -this.vertical, 1-this.horizontal));
    mat4.multiply(ma, mb, ma);
    mat4.getTranslation(ve, ma);

    this.penx = x + ve[0];
    this.peny = y + ve[1];
    this.penz = z + ve[2];


    lScene.animates.push(this);
    
}

ZipBase.prototype = {
    constructor: ZipBase,
    pickup: function(person)
    {
        person.travelling = this;
        person.zipdist = 0;


        var pobj = person.obj;
        pobj.rotateFlatHere(pobj.rx, this.ry, 0);
        pobj.moveHere(this.obj.x, this.obj.y, this.obj.z);
        person.zipstart(this);
        person.displayzip(this);
        pobj.procpos();
        sounds.zip.play();

    },
    travel: function(person, delta, x, z, rx, ry)
    {

        delta = delta * 10;
        person.zipdist += delta;

        var obj = person.obj;

        if(person.zipdist > this.distance)
        {
            obj.moveHere(this.endx, this.endy, this.endz);
            obj.warp();
            person.travelling = null;
            person.carrying = null;
            person.zipdist = 0;
            person.zipend(this);
            person.displaydrop();
            sounds.zip.pause();

            person.obj.ignore = true;

            var hit = lScene.lCDynamicPointDetect(obj, 0.3);
            person.obj.ignore = false;
            if(hit) {
                obj.moveHere(this.penx, this.peny, this.penz);
                obj.warp();
            }
        } else {
            var ratio = delta / this.distance;
            obj.moveFlat(0, -ratio * this.vertical, -ratio * this.horizontal);
            person.zipgo(this);
        }
        obj.procpos();
    }, 

    animate: function(delta)
    {
        this.lightheight += delta * .3;
        if(this.lightheight > 1) this.lightheight -= 1;
    },

    fire: function(person) {},
    chuck: function(person) {},
    playercarry: function(person) {},
    kronkycarry: function(person) {},
    

}

function Zip11(x, y, z, ry)
{
    this.obj = new LWObject(structs.Zip11[0], this);
    this.cobj = new LWObject(structs.Zip11[1], this);
    this.horizontal = 11;
    this.vertical = 5;
    this.distance = 12;

    ZipBase.call(this, x, y, z, ry);
    
}

Zip11.prototype = Object.assign(Object.create(ZipBase.prototype), {
    prototype: Zip11,
});

function zip21Structure()
{
    var stru = new LStructureDef(ShaderLight, {color: [0.7, 1.0, 0.7, 0.5], collision: LNONE});
    stru.addCylinder({position: lFromXYZPYR(0, -2.0, -10.5, -0.23337, 0, 0), radius: 0.02, depth: 10.8});
    stru.addBlock({position: lFromXYZPYR(-.25, -1.01, 0, 0, 0, 0), size: [.02, 1.49, .02]});
    stru.addBlock({position: lFromXYZPYR(.25, -1.01, 0, 0, 0, 0), size: [.02, 1.49, .02]});
    stru.addBlock({position: lFromXYZPYR(0, 0.5, 0, 0, 0, 0), size: [0.27 , 0.02, .02]});
    stru.addBlock({position: lFromXYZPYR(-.25, -6.01, -21, 0, 0, 0), size: [.02, 1.49, .02]});
    stru.addBlock({position: lFromXYZPYR(.25, -6.01, -21, 0, 0, 0), size: [.02, 1.49, .02]});
    stru.addBlock({position: lFromXYZPYR(0, -4.50, -21, 0, 0, 0), size: [0.27, 0.02, .02]});
    var strc = new LStructureDef(ShaderLight, {color: [0.7, 1.0, 0.7, 0.5], collision: LNONE});
    strc.addBlock({size: [0.3, 0.02, 0.02]});

    return [stru, strc];
}

function Zip21(x, y, z, ry)
{
    this.obj = new LWObject(structs.Zip21[0], this);
    this.cobj = new LWObject(structs.Zip21[1], this);
    this.horizontal = 21;
    this.vertical = 5;
    this.distance = 21.7156;


    ZipBase.call(this, x, y, z, ry);
    
}

Zip21.prototype = Object.assign(Object.create(ZipBase.prototype), {
    prototype: Zip21,
});

function flowerStandStructure()
{
    // Fancy stuff so picking it up does not look wierd
    var stru = new LStructureDef(ShaderLight, {color: [0.5, 0.5, 1.0, 0.5], collision: LNONE});
    stru.addCylinder({position: lFromXYZPYR(0, -1.5, 0, LR90, 0, 0), radius: 0.15, depth: 1});

    // stru.addBlock({position: lFromXYZPYR(-1, -1, -.5, 0, 0, 0), size: [.001, 1.5, .5]})
    // stru.addBlock({position: lFromXYZPYR(1, -1, -.5, 0, 0, 0), size: [.001, 1.5, .5]})
// 
    // stru.addBlock({position: lFromXYZPYR(-1, -1, .5, 0, 0, 0), size: [.001, 1.5, .5]})
    // stru.addBlock({position: lFromXYZPYR(1, -1, .5, 0, 0, 0), size: [.001, 1.5, .5]})

    // stru.addBlock({position: lFromXYZPYR(0, -1, -1, 0, 0, 0), size: [1.001, 1.5, .001]})
    return stru;
}

function FlowerStand(x, y, z, ry, nostand)
{
    // If nostand, then not a "Flower Stand" as such
    this.obj = new LWObject(structs.FlowerStand, this);
    lScene.flowerstands.push(this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.istravel = false;
    this.lightheight = lScene.prngd.next(1.0);
    lScene.animates.push(this);
}

FlowerStand.prototype = {
    constructor: FlowerStand,
    place: function(x, y, z, ry)
    {
        this.obj.moveHere(x, y, z);
        this.obj.procpos();
    },
    animate: function(delta)
    {
        this.lightheight += delta * .3;
        if(this.lightheight > 1) this.lightheight -= 1;
    },
    notastand: function()
    {
        lScene.flowerstands.pop();
        return this;
    }

};

function shadowStruct()
{
    var structure = new LStructureDef(ShaderShade, {color: vec4.fromValues(0.0, 0.0, 0.0, 0.7)});
    structure.addCylinder({position: lFromXYZ(0, 0, 2.4), radius: 0.12, depth: 0.01, hold: [LI_BOTTOM, LI_SIDE]});
    return structure;
}


function glassStructure()
{
    var mstr = new LStructureDef(ShaderSimpleTrans, {color: [0.3, 0.3, 0.6, 0.5], collision: LSTATIC});
    mstr.addBlock({position: lFromXYZ(-4.995, -1, 0), size: [0.005, 1.5, 1]});
    mstr.addBlock({position: lFromXYZ(4.995, -1, 0), size: [0.005, 1.5, 1]});
    mstr.addBlock({position: lFromXYZ(0, -1, 0), size: [4.995, 1.5, 0.005]});

    var pstr = new LStructureDef(ShaderSimple, {color: [0.4, 0.2, 0.1, 1.0], collision: LNONE});

    pstr.addBlock({position: lFromXYZPYR(0, 0.510, 0, 0, 0, 0), size :[5, 0.01, 0.01]});

    pstr.addCylinder({position: lFromXYZPYR(-4.995, -1.05, -1, LR90, 0, 0), radius: 0.01, depth: 1.55});
    pstr.addCylinder({position: lFromXYZPYR(-4.995, -1.05, 1, LR90, 0, 0), radius: 0.01, depth: 1.55});
    pstr.addCylinder({position: lFromXYZPYR(4.995, -1.05, -1, LR90, 0, 0), radius: 0.01, depth: 1.55});
    pstr.addCylinder({position: lFromXYZPYR(4.995, -1.05, 1, LR90, 0, 0), radius: 0.01, depth: 1.55});

    pstr.addBlock({position: lFromXYZ(-4.995, 0.510, 0), size :[0.01, 0.01, 1.01]});
    pstr.addBlock({position: lFromXYZ(4.995, 0.510, 0), size :[0.01, 0.01, 1.01]});


    // The doors

    return [mstr, pstr];
}

function Glass(x, y, z, ry)
{
    this.obj = new LWObject(structs.Glass[0], this);
    this.pobj = new LWObject(structs.Glass[1], this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.lPlace(this.pobj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.pobj.procpos();
}

function doorStructure()
{
    var mstr = new LStructureDef(ShaderSimpleTrans, {color: [0.3, 0.3, 0.6, 0.5], collision: LSTATIC});
    mstr.addBlock({position: lFromXYZ(-4.995, -1, 0), size: [0.005, 1.5, 1]});
    mstr.addBlock({position: lFromXYZ(4.995, -1, 0), size: [0.005, 1.5, 1]});

    mstr.addBlock({position: lFromXYZ(-3, -1, 0), size: [1.995, 1.5, 0.005], corners: [[-5, -2.5, -0.01], [-1, 1, 0.025]]});
    mstr.addBlock({position: lFromXYZ(3, -1, 0), size: [1.995, 1.5, 0.005], corners: [[1, -2.5, -0.01], [5, 1, 0.025]]});

    var pstr = new LStructureDef(ShaderSimple, {color: [0.4, 0.2, 0.1, 1.0], collision: LNONE});
    pstr.addBlock({position: lFromXYZPYR(0, 0.510, -0.015, 0, 0, 0), size :[5, 0.01, 0.03]});
    pstr.addCylinder({position: lFromXYZPYR(-1, -1, 0, LR90, 0, 0), radius: 0.01, depth: 1.5});
    pstr.addCylinder({position: lFromXYZPYR(1, -1, 0, LR90, 0, 0), radius: 0.01, depth: 1.5});

    pstr.addCylinder({position: lFromXYZPYR(-4.995, -1.05, -1, LR90, 0, 0), radius: 0.01, depth: 1.55});
    pstr.addCylinder({position: lFromXYZPYR(-4.995, -1.05, 1, LR90, 0, 0), radius: 0.01, depth: 1.55});
    pstr.addCylinder({position: lFromXYZPYR(4.995, -1.05, -1, LR90, 0, 0), radius: 0.01, depth: 1.55});
    pstr.addCylinder({position: lFromXYZPYR(4.995, -1.05, 1, LR90, 0, 0), radius: 0.01, depth: 1.55});

    pstr.addBlock({position: lFromXYZ(-4.995, 0.510, 0), size :[0.01, 0.01, 1.01]});
    pstr.addBlock({position: lFromXYZ(4.995, 0.510, 0), size :[0.01, 0.01, 1.01]});


    // The doors

    var dmstr = new LStructureDef(ShaderSimpleTrans, {color: [0.3, 0.3, 0.6, 0.5], collision: LSTATIC});
    dmstr.addBlock({position: lFromXYZ(0, -1, -0.03), size: [0.48, 1.5, 0.005]});

    var dpstr = new LStructureDef(ShaderSimple, {color: [0.4, 0.2, 0.1, 1.0], collision: LNONE});
    dpstr.addCylinder({position: lFromXYZPYR(-.485, -1, -0.03, LR90, 0, 0), radius: 0.01, depth: 1.5});
    dpstr.addCylinder({position: lFromXYZPYR(-.2425, -1, -0.03, LR90, 0, 0), radius: 0.01, depth: 1.5});
    dpstr.addCylinder({position: lFromXYZPYR(0, -1, -0.03, LR90, 0, 0), radius: 0.01, depth: 1.5});
    dpstr.addCylinder({position: lFromXYZPYR(.2425, -1, -0.03, LR90, 0, 0), radius: 0.01, depth: 1.5});
    dpstr.addCylinder({position: lFromXYZPYR(.485, -1, -0.03, LR90, 0, 0), radius: 0.01, depth: 1.5});

    return [mstr, pstr, dmstr, dpstr];
}

function UnderDoor(control, x, y, z, ry)
{
    // Have a look to see range of things under the door
    var mb = mat4.create();
    var ma = mat4.create();
    var vl = vec3.create();
    var vr = vec3.create();

    mat4.fromYRotation(mb, ry);
    mat4.fromTranslation(ma, vec3.fromValues(-1, 0, 0));
    mat4.multiply(ma, mb, ma);
    mat4.getTranslation(vl, ma);
   
    mat4.fromTranslation(ma, vec3.fromValues(1, 0, 0));
    mat4.multiply(ma, mb, ma);
    mat4.getTranslation(vr, ma);

    vl[0] += x;
    vl[1] += y;
    vl[2] += z;
    vr[0] += x;
    vr[1] += y;
    vr[2] += z;

    var t;

    for(var i = 0; i < 3; i++) {
        if(vl[i] > vr[i]) {
            t = vl[i];
            vl[i] = vr[i];
            vr[i] = t;
        }
        vl[i] -= 0.1;
        vr[i] += 0.1;
    }
    this.control = control;
    this.funder = vl;
    this.tunder = vr;
    this.coll = new LVirtObject(this, x, y, z, 1.2);
}

UnderDoor.prototype = {
    constructor: UnderDoor,
    seecrunch: function()
    {
        var cobs = {}

        function _see(cob)
        {
            cobs[cob.key] = cob;
        }
        var funder = this.funder;
        var tunder = this.tunder;

        lScene.lCAllDynamicPointDetect(this.coll, 1.2, _see);

        for(var key in cobs) {
            var co = cobs[key];
            var cb = co.control;
            var distance = cb.obj.distance;

            if(
                ((co.x + distance) >= funder[0]) && 
                ((co.y + distance) >= funder[1]) && 
                ((co.z + distance) >= funder[2]) && 
                ((co.x - distance) <= tunder[0]) && 
                ((co.y - distance) <= tunder[1]) && 
                ((co.z - distance) <= tunder[2]))
            {
                if(cb instanceof Person) {
                    if(cb.carrying) {
                        cb.carrying.end();
                    }
                    cb.die();
                    sounds.smash.play();
                } else if(cb.obj.isvisible) {
                    cb.end();
                    sounds.smash.play();
                }
            }
        }
    }
}
           
function Door(x, y, z, ry)
{
    this.obj = new LWObject(structs.Door[0], this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.hobj = new LWObject(structs.Door[1], this);
    lScene.lPlace(this.hobj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.hobj.procpos();

    this.ldoor = new LObject(structs.Door[2], this);
    this.obj.addChild(this.ldoor, lFromXYZ(-0.5, 0, 0));
    var pills = new LObject(structs.Door[3], this);
    this.ldoor.addChild(pills, mat4.create());

    this.rdoor = new LObject(structs.Door[2], this);
    this.obj.addChild(this.rdoor, lFromXYZ(0.5, 0, 0));
    pills = new LObject(structs.Door[3], this);
    this.rdoor.addChild(pills, mat4.create());

    this.obj.procpos();

    this.isopen = false;
    this.opening = false;
    this.closing = false;

    this.hasopened = 0;
    this.iscage = false;

    lScene.animates.push(this);
    lScene.stateobjs.push(this);

    this.under = new UnderDoor(this, x, y, z, ry);


}

Door.prototype = {
    constructor: Door,

    open: function()
    {
        if(this.opening || this.isopen) return;
        if(!this.closing)
            sounds.door.play();
        this.opening = true;
        this.closing = false;
        return this;
    },

    close: function()
    {
        if(this.closing || (!this.isopen)) return;
        if(!this.opening)
            sounds.door.play();
        this.closing = true;
        this.opening = false;
        return this;
    },

    animate: function(delta)
    {
        if (this.opening) {
            this.hasopened += delta;
            if(this.hasopened > 0.5) {
                if(!this.isopen) this.setopen(true);
                if(this.hasopened >= 1) {
                    this.hasopened = 1;
                    this.opening = false;
                    sounds.door.pause();
                }
            }
            this.dispdoors();
        }
        if (this.closing) {
            this.hasopened -= delta;
            if(this.hasopened < 0.5) {
                if(this.isopen) {
                    this.setopen(false);
                    this.under.seecrunch();
                }
                if(this.hasopened <= 0) {
                    this.hasopened = 0;
                    this.closing = false;
                    sounds.door.pause();
                    sounds.bump.play();
                } 
            }
            this.dispdoors();
        }
    },

    setopen: function(ind)
    {
        this.ldoor.ignore = ind;
        this.rdoor.ignore = ind;
        this.isopen = ind;
        
    },

    dispdoors: function()
    {
        var amt = this.hasopened;
        this.ldoor.moveHere(-amt, 0, 0);
        this.rdoor.moveHere(amt, 0, 0);
        this.ldoor.procpos();
        this.rdoor.procpos();
    },

    save: function()
    {
        return {
            isopen: this.isopen,
            opening: this.opening,
            closing: this.closing,
            hasopened: this.hasopened
        };
    },
    restore: function(saved)
    {
        if(this.opening || this.closing) sounds.door.pause();
        var cnt = 0;
        this.isopen = saved.isopen;
        this.opening = saved.opening;
        this.closing = saved.closing;
        this.hasopened = saved.hasopened;
        this.setopen(this.isopen);
        this.dispdoors();
        if(this.opening || this.closing) sounds.door.play();
    },
}

function portcullisStructure()
{
    // Glass part of frame
    var mstr = new LStructureDef(ShaderSimpleTrans, {color: [0.3, 0.3, 0.6, 0.5], collision: LSTATIC});
    mstr.addBlock({position: lFromXYZ(-4.995, -1, 0), size: [0.005, 1.5, 1]});
    mstr.addBlock({position: lFromXYZ(4.995, -1, 0), size: [0.005, 1.5, 1]});

    mstr.addBlock({position: lFromXYZ(-3.75, -1, 0), size: [1.245, 1.5, 0.005], corners: [[-5, -2.5, -0.01], [-2.7, 0.5, 0.025]]});
    mstr.addBlock({position: lFromXYZ(3.75, -1, 0), size: [1.245, 1.5, 0.005], corners: [[2.7, -2.5, -0.01], [5, 0.5, 0.025]]});

    mstr.addBlock({position: lFromXYZ(-1.75, -0.5, 0), size: [0.75, 2, 0.005], corners: [[-2.7, -2.5, -0.01], [-1, 1.5, 0.025]]});
    mstr.addBlock({position: lFromXYZ(1.75, -0.5, 0), size: [0.75, 2, 0.005], corners: [[1, -2.5, -0.01], [2.7, 1.5, 0.025]]});
    mstr.useCorners([[-2.7, .5, -0.01], [2.7, 1.5, .025]], {});

    // Non glass part of frame
    var pstr = new LStructureDef(ShaderSimple, {colors: [[0.4, 0.2, 0.1, 1.0], [.1, .05, .05, 1.0]], collision: LNONE});
    pstr.addBlock({position: lFromXYZPYR(0, 1.465, -0.015, 0, 0, 0), size :[2.7, 0.05, 0.10], texturecontrols: lTextureColorAll(2,0)});

    pstr.addBlock({position: lFromXYZPYR(-2.6, .96, -0.015, 0, 0, 0), size :[0.1, 0.455, 0.10], texturecontrols: lTextureColorAll(2,0)});
    pstr.addBlock({position: lFromXYZPYR(2.6, .96, -0.015, 0, 0, 0), size :[0.1, 0.455, 0.10], texturecontrols: lTextureColorAll(2,0)});

    pstr.addBlock({position: lFromXYZPYR(-2.6, -0.995, -0.015, 0, 0, 0), size :[0.1, 1.55, 0.10], texturecontrols: lTextureColorAll(2,0)});
    pstr.addBlock({position: lFromXYZPYR(2.6, -0.995, -0.015, 0, 0, 0), size :[0.1, 1.55, 0.10], texturecontrols: lTextureColorAll(2,0)});

    pstr.addBlock({position: lFromXYZPYR(-3.8475, .555, -0.015, 0, 0, 0), size :[1.1475, 0.05, 0.10], texturecontrols: lTextureColorAll(2,0)});
    pstr.addBlock({position: lFromXYZPYR(3.8475, .555, -0.015, 0, 0, 0), size :[1.1475, 0.05, 0.10], texturecontrols: lTextureColorAll(2,0)});

    pstr.addBlock({position: lFromXYZPYR(-4.8975, -0.995, -0.015, 0, 0, 0), size :[0.09975, 1.55, 0.10], texturecontrols: lTextureColorAll(2,0)});
    pstr.addBlock({position: lFromXYZPYR(4.8975, -0.995, -0.015, 0, 0, 0), size :[0.09975, 1.55, 0.10], texturecontrols: lTextureColorAll(2,0)});

    pstr.addCylinder({position: lFromXYZPYR(-1, -0.5, 0, LR90, 0, 0), radius: 0.01, depth: 2.0, texturecontrols: lTextureColorAll(2,0)});
    pstr.addCylinder({position: lFromXYZPYR(1, -0.5, 0, LR90, 0, 0), radius: 0.01, depth: 2.0, texturecontrols: lTextureColorAll(2,0)});

    pstr.addCylinder({position: lFromXYZPYR(-4.995, -1.05, -1, LR90, 0, 0), radius: 0.01, depth: 1.55, texturecontrols: lTextureColorAll(2,0)});
    pstr.addCylinder({position: lFromXYZPYR(-4.995, -1.05, 1, LR90, 0, 0), radius: 0.01, depth: 1.55, texturecontrols: lTextureColorAll(2,0)});
    pstr.addCylinder({position: lFromXYZPYR(4.995, -1.05, -1, LR90, 0, 0), radius: 0.01, depth: 1.55, texturecontrols: lTextureColorAll(2,0)});
    pstr.addCylinder({position: lFromXYZPYR(4.995, -1.05, 1, LR90, 0, 0), radius: 0.01, depth: 1.55, texturecontrols: lTextureColorAll(2,0)});

    pstr.addBlock({position: lFromXYZ(-4.995, 0.510, 0), size :[0.01, 0.01, 1.01], texturecontrols: lTextureColorAll(2,0)});
    pstr.addBlock({position: lFromXYZ(4.995, 0.510, 0), size :[0.01, 0.01, 1.01], texturecontrols: lTextureColorAll(2,0)});

    pstr.addTriangle({position: lFromXYZ(-0.5, 1.25, -0.03), coords: [[0, -0.25], [0.49, 0.25], [-0.49, 0.25]], depth: 0.007, texturecontrols: lTextureColorAll(2,0)});
    pstr.addTriangle({position: lFromXYZ(0.5, 1.25, -0.03), coords: [[0, -0.25], [0.49, 0.25], [-0.49, 0.25]], depth: 0.007, texturecontrols: lTextureColorAll(2,0)});

    // The doors 
    // Top 2 parts of door
    // var dmstr = new LStructureDef(ShaderSimpleTrans, {color: [0.3, 0.3, 0.6, 0.5], collision: LSTATIC});
    // dmstr.addBlock({position: lFromXYZ(0, -0.75, -0.03), size: [0.47, 0.75, 0.005]});

    var dpstr = new LStructureDef(ShaderSimple, {colors: [[0.4, 0.2, 0.1, 1.0], [0.15, 0.15, 0.2, 1.0], [.1, .05, .05, 1.0]], collision: LSTATIC});
    dpstr.addCylinder({position: lFromXYZ(0, 0, -0.03), radius: 0.44, depth: 0.006,texturecontrols:  lTextureColorAll(3,1), corners: null});
    dpstr.addCylinder({position: lFromXYZ(0, 0, -0.03), radius: 0.1, depth: 0.008, texturecontrols: lTextureColorAll(3,2), corners: null});
    dpstr.addBlock({position: lFromXYZ(0, -0.75, -0.03), size: [0.2, 0.75, 0.005], texturecontrols: lTextureColorAll(3,0), corners: null});
    dpstr.useCorners([[-.5, -2.5, -0.05], [0.5, 1.0, 0.05]], {});
    dpstr.addBlock({position: lFromXYZ(0, -0.5, -0.03), size: [0.435, 0.04, 0.005], texturecontrols: lTextureColorAll(3,0), corners: null});
    dpstr.addBlock({position: lFromXYZ(0, -1, -0.03), size: [0.46, 0.04, 0.005], texturecontrols: lTextureColorAll(3,0), corners: null});
    // dpstr.addCylinder({position: lFromXYZ(0, -1.5, -0.03), radius: 0.44, depth: 0.006});
    // dpstr.addCylinder({position: lFromXYZPYR(-.485, -0.75, -0.03, LR90, 0, 0), radius: 0.01, depth: 0.75});
    // dpstr.addCylinder({position: lFromXYZPYR(.485, -0.75, -0.03, LR90, 0, 0), radius: 0.01, depth: 0.75});

    // Bottom part of door
    var dbstr = new LStructureDef(ShaderSimple, {colors: [[0.4, 0.2, 0.1, 1.0], [0.15, 0.15, 0.2, 1.0], [.1, .05, .05, 1.0]], collision: LNONE});
    dbstr.addCylinder({position: lFromXYZ(0, 0, -0.03), radius: 0.44, depth: 0.006, texturecontrols: lTextureColorAll(3,1)});
    dbstr.addCylinder({position: lFromXYZ(0, 0, -0.03), radius: 0.1, depth: 0.008, texturecontrols: lTextureColorAll(3,2)});
    dbstr.addBlock({position: lFromXYZ(0, -0.75, -0.03), size: [0.2, 0.75, 0.005], texturecontrols: lTextureColorAll(3,0)});
    dbstr.addCylinder({position: lFromXYZ(0, -1.4, -0.03), radius: 0.44, depth: 0.006, texturecontrols: lTextureColorAll(3,1)});
    dbstr.addCylinder({position: lFromXYZ(0, -1.4, -0.03), radius: 0.1, depth: 0.008, texturecontrols: lTextureColorAll(3,2)});
    dbstr.addBlock({position: lFromXYZ(0, -0.5, -0.03), size: [0.46, 0.04, 0.005], texturecontrols: lTextureColorAll(3,0), corners: null});
    dbstr.addBlock({position: lFromXYZ(0, -1, -0.03), size: [0.46, 0.04, 0.005], texturecontrols: lTextureColorAll(3,0), corners: null});
    // dbstr.addCylinder({position: lFromXYZPYR(-.485, -0.75, -0.03, LR90, 0, 0), radius: 0.01, depth: 0.75});
    // dbstr.addCylinder({position: lFromXYZPYR(.485, -0.75, -0.03, LR90, 0, 0), radius: 0.01, depth: 0.75});

    

    return [mstr, pstr, dpstr, dbstr];
}

function Portcullis(x, y, z, ry)
{
    var pills = null;

    this.obj = new LWObject(structs.Portcullis[0], this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.hobj = new LWObject(structs.Portcullis[1], this);
    lScene.lPlace(this.hobj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.hobj.procpos();

    this.ltdoor = new LObject(structs.Portcullis[2], this);
    this.obj.addChild(this.ltdoor, lFromXYZ(-0.5, 1, 0));

    this.lbdoor = new LObject(structs.Portcullis[3], this);
    this.ltdoor.addChild(this.lbdoor, lFromXYZ(0, -1.5, 0));

    this.rtdoor = new LObject(structs.Portcullis[2], this);
    this.obj.addChild(this.rtdoor, lFromXYZ(0.5, 1, 0));

    this.rbdoor = new LObject(structs.Portcullis[3], this);
    this.rtdoor.addChild(this.rbdoor, lFromXYZ(0, -1.5, 0));


    this.obj.procpos();

    this.isopen = false;
    this.opening = false;
    this.closing = false;

    this.hasopened = 0;
    this.iscage = false;

    this.achievekey = "portcullis";

    lScene.animates.push(this);
    lScene.stateobjs.push(this);

    this.under = new UnderDoor(this, x, y, z, ry);
}

Portcullis.prototype = {
    constructor: Portcullis,

    setachieve: function(key)
    {
        this.achievekey = key;
        return this;
    }, 
    open: function()
    {
        if(this.opening || this.isopen) return;
        if(!this.closing)
            sounds.ratchet.play();
        this.opening = true;
        this.closing = false;
        return this;
    },

    close: function()
    {
        if(this.closing || (!this.isopen)) return;
        if(!this.opening)
            sounds.ratchet.play();
        this.closing = true;
        this.opening = false;
        // if(this.isopen) lScene.achieve(this.achievekey, -1);
        return this;
    },

    animate: function(delta)
    {
        if (this.opening) {
            this.hasopened += delta;
            if (this.hasopened > 0.5) {
                if(!this.isopen) this.setopen(true);
                if(this.hasopened >= 1.0) {
                    this.hasopened = 1.0;
                    this.opening = false;
                    sounds.ratchet.pause();
                }
            }
            this.dispdoors();
        }
        if (this.closing) {
            this.hasopened -= delta;
            if (this.hasopened < 0.5) {
                if(this.isopen)
                {
                    this.setopen(false);
                    this.under.seecrunch();
                }
                if(this.hasopened <= 0) {
                    this.hasopened = 0;
                    this.closing = false;
                    sounds.ratchet.pause();
                    sounds.bump.play();
                } 
            }
            this.dispdoors();
        }
    },

    setopen: function(ind)
    {
        this.ltdoor.ignore = ind;
        this.rtdoor.ignore = ind;
        this.isopen = ind;
        
    },

    dispdoors: function()
    {
        var amt = this.hasopened * LR90 * 0.95;
        this.ltdoor.rotateHere(0, 0, -amt);
        this.lbdoor.rotateHere(0, 0, amt);
        this.rtdoor.rotateHere(0, 0, amt);
        this.rbdoor.rotateHere(0, 0, -amt);
        this.ltdoor.procpos();
        this.rtdoor.procpos();
    },

    save: function()
    {
        return {
            isopen: this.isopen,
            opening: this.opening,
            closing: this.closing,
            hasopened: this.hasopened
        };
    },
    restore: function(saved)
    {
        if(this.opening || this.closing) sounds.ratchet.pause();
        var cnt = 0;
        this.isopen = saved.isopen;
        this.opening = saved.opening;
        this.closing = saved.closing;
        this.hasopened = saved.hasopened;
        this.setopen(this.isopen);
        this.dispdoors();
        if(this.opening || this.closing) sounds.ratchet.play();
    },
}


function ropeStructure()
{
    var pstr = new LStructureDef(ShaderSimple, {color: [0.4, 0.2, 0.1, 1.0], collision: LSTATIC});
    pstr.addBlock({position: lFromXYZ(0, 1.465, -1.5), size :[0.1, 0.045, 1.6]});
    var rfstr = new LStructureDef(ShaderLight, {color: [1.0, 0.6, 0.6, 0.5], collision: LNONE});
    rfstr.addCylinder({position: lFromXYZPYR(0, 0, 0, LR90, 0, 0), radius: 0.015, depth: 1.47});
    var rostr = new LStructureDef(ShaderSolid, {color: [1.0, 0.6, 0.6, 0.8], collision: LNONE});
    rostr.addCylinder({position: lFromXYZPYR(0, 0, 0, LR90, 0, 0), radius: 0.015, depth: 1.47});
    return [pstr, rfstr, rostr];
}

function Rope(x, y, z, ry)
{
    this.obj = new LWObject(structs.Rope[0], this);
    this.fobj = new LWObject(structs.Rope[1], this);
    this.oobj = new LWObject(structs.Rope[2], this);


    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.lPlace(this.fobj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.lPlace(this.oobj, lFromXYZPYR(x, y, z, 0, ry, 0));

    this.oobj.mkvisible(false);
    this.obj.procpos();
    this.fobj.procpos();
    this.oobj.procpos();

    this.coll = new LVirtObject(this, 0, 0, 0, 0.3);

    this.lightheight = lScene.prngd.next(1.0);
    this.canpickup = true;

    this.emess = false;

    this.port = null;

    lScene.pickups.push(this);
    lScene.animates.push(this);
    lScene.stateobjs.push(this);

    this.statestatic = true;
}

Rope.prototype = {
    constructor: Rope,

    setPort: function(port)
    {
        this.port = port;
        return this;
    },

    save: function()
    {
        return {
            iscarried: this.iscarried,
            oobj: this.oobj.isvisible,
            fobj: this.fobj.isvisible,
        }
    },

    restore: function(saved)
    {
        this.iscarried = saved.iscarried;
        this.oobj.mkvisible(saved.oobj);
        this.fobj.mkvisible(saved.fobj);
        this.fobj.procpos();
        this.oobj.procpos();
    },

    animate: function(delta)
    {
        this.lightheight += delta * .3;
        if(this.lightheight > 1) this.lightheight -= 1;
    },

    pickup: function(person)
    {
        if(this.iscarried) return;
        var pobj = person.obj;
        var obj = this.obj;
        var coll = this.coll;
        coll.setPosition(obj.x, obj.y, obj.z);

        var ma = mat4.create();
        var mb = mat4.create();
        var ve = vec3.create();
        mat4.fromYRotation(mb, pobj.ry);
        mat4.fromTranslation(ma, vec3.fromValues(0, 0, 0.6));
        mat4.multiply(ma, mb, ma);
        mat4.getTranslation(ve, ma);

        coll.moveAbs(ve[0], ve[1], ve[2]);

        var hit = false;
        function _see(cob)
        {
            if(!cob.control.isfloor) hit = true;
        }

        pobj.ignore = true;
        lScene.lCAllPointDetect(coll, 0.2, _see);
        pobj.ignore = false;

        if(hit) {
            person.carrying = null;
            this.iscarried = null;
            return false;
        }

        person.travelling = this;
        this.iscarried = person;
        pobj.moveHere(coll.x, coll.y, coll.z);

        if(person instanceof Kronky) {
            person.ltarm.rotateHere(LR90 * .55, -LR90 * .9, 0);
            person.lbarm.rotateHere( LR90 * 0.45, 0, 0);
            person.rtarm.rotateHere(LR90 * .55, LR90 * .9, 0);
            person.rbarm.rotateHere( LR90 * 0.45, 0, 0);
        }
        pobj.procpos();
        pobj.warp();

        this.oobj.mkvisible(true);
        this.fobj.mkvisible(false);

        this.port.open();
        // displayrope();
    },

    travel: function(person, delta, x, z, rx, ry)
    {
        if(this.iscarried instanceof Player) {
            if(x != 0 || z != 0 || rx != 0 || ry != 0) {
                if(!this.emess) {
                    lScene.lMessage("Drop the rope before trying to move");
                    this.emess = true;
                }
            } else {
                this.emess = false;
            }
        }
    },

    drophere: function(person, x, y, z, ry)
    {
        if(person) {
            person.travelling = null;
            person.carrying = null;
        }
        this.iscarried = null;
        this.canpickup = true;
        this.oobj.mkvisible(false);
        this.fobj.mkvisible(true);
        this.port.close();
        return true;
    },

    end: function()
    {
        // This will only happen if carrying and PLAY
        this.drophere(this.iscarried, 0, 0, 0, 0);
    },
    respawn: function()
    {
        // Respawn also only happens on "PLAY", so....
        this.end();
        return null;
    },

    playercarry: function () {},
    kronkycarry: function () {},

    fire: function() {},
    chuck: function() {},
    fits: function(cobj) {return false;}
}
       
function BaseKeyHole(struct, x, y, z, ry)
{
    this.aobj = new LWObject(struct[0], this);
    this.bobj = new LWObject(struct[1], this);
    this.oobj = new LWObject(struct[2], this);
    this.nobj = new LWObject(struct[3], this);

    this.nobj.mkvisible(false);

    this.ison = false;
    
    this.isfloor = false;
    this.iswire = false;

    this.ry = 0;
    lScene.stateobjs.push(this);
    this.place(x, y, z, ry);
    this.istravel = false;
    this.achievekey = "dkey";
    this.iscage = false;
    this.lightheight = lScene.prngd.next(1.0);
    lScene.animates.push(this);
    
}
BaseKeyHole.prototype = {
    constructor: BaseKeyHole,

    animate: function(delta)
    {
        this.lightheight += delta * .3;
        if(this.lightheight > 1) this.lightheight -= 1;
    },

    place: function(x, y, z, ry)
    {
        var pos = lFromXYZPYR(x, y, z, 0, ry, 0);
        lScene.lPlace(this.aobj, pos);
        lScene.lPlace(this.bobj, pos);
        lScene.lPlace(this.oobj, pos);
        lScene.lPlace(this.nobj, pos);
        this.ry = ry;
    },

    setachieve: function(key)
    {
        this.achievekey = key;
        return this;
    }, 
    switchon: function()
    {
        if(this.ison) return;
        this.nobj.mkvisible(true);
        this.oobj.mkvisible(false);
        this.nobj.procpos();
        this.ison = true;
        lScene.achieve(this.achievekey, 1);
    },
    switchoff: function()
    {
        if(!this.ison) return;
        this.nobj.mkvisible(false);
        this.oobj.mkvisible(true);
        this.oobj.procpos();
        this.ison = false;
        lScene.achieve(this.achievekey, -1);
    },

    save: function()
    {
        return {ison: this.ison};
    },
    restore: function(state)
    {
        if(this.ison != state.ison) {
            this.ison = state.ison;
            if(this.ison) {
                this.nobj.mkvisible(true);
                this.oobj.mkvisible(false);
            } else {
                this.nobj.mkvisible(false);
                this.oobj.mkvisible(true);
            }
            this.nobj.procpos();
            this.oobj.procpos();
        }
    }
}

function dKeyHoleStructure()
{
    const ma = [
        [[-0.250, 0.27, 0], [-.13, 0.27, 0], [0, 0.27, 0], [.13, 0.27, 0], [0.250, 0.27, 0]],
        [[-0.0607, 0.0807, 0], [-0.0407, 0.091, 0], [0.0, 0.129, 0], [0.0407, 0.091, 0], [0.0607, 0.0807, 0]],
        ];

    const mb = [
        [[-0.0607, -0.0807, 0], [-0.0407, -0.091, 0], [0, -0.129, 0], [0.0407, -0.091, 0], [0.0607, -0.0807, 0]],
        [[-0.250, -0.27, 0], [-.13, -0.27, 0], [0.0, -0.27, 0], [.13, -0.27, 0], [0.250, -0.27, 0]],
        ]

    const mc = [
        [[-0.27, 0.250, 0], [-0.0807, 0.0607, 0]],
        [[-0.27, .13,  0], [-0.091, 0.0407,  0]],
        [[-0.27, 0, 0],   [-0.129, 0, 0]],
        [[-0.27, -.13,  0], [-0.091, -0.0407,  0]],
        [[-0.27, -0.250, 0], [-0.0807, -0.0607, 0]],
        ];

    const md = [
        [[0.0807, 0.0607, 0], [0.27, 0.250, 0]],
        [[0.091, 0.0407,  0], [0.27, .13,  0]],
        [[0.129, 0, 0],       [0.27, 0, 0]],
        [[0.091, -0.0407,  0], [0.27, -.13,  0]],
        [[0.0807, -0.0607, 0], [0.27, -0.250, 0]],
        ];

    const oa = [
        [[-0.271, 0.271, 0], [-0.1754, 0.3675, 0], [0.0, 0.4926, 0], [0.1754, 0.3675, 0], [0.271, 0.271, 0]],
        [[-0.271, 0.27, 0], [-.13, 0.27, 0], [0, 0.27, 0], [.13, 0.27, 0], [0.271, 0.27, 0]]
        ];

    const ob = [
        [[-0.271, -0.27, 0], [-.13, -0.27, 0], [0, -0.27, 0], [.13, -0.27, 0], [0.271, -0.27, 0]],
        [[-0.271, -0.271, 0], [-0.1754, -0.3675, 0], [0.0, -0.4926, 0], [0.1754, -0.3675, 0], [0.271, 0-.271, 0]]
        ];

    const oc = [
               [[-0.271, 0.271, 0],   [-0.27, 0.271, 0]],
               [[-0.3675, 0.1754, 0], [-0.27, .13, 0]],
               [[-0.4926, 0.0, 0],    [-0.27, 0, 0]], 
               [[-0.3675, -0.1754, 0], [-0.27, -.13, 0]],
               [[-0.271, -0.271, 0],   [-0.27, -0.271, 0]]
               ];

    const od = [
                [[0.27, 0.271, 0], [0.271, 0.271, 0]],
                [[0.27, .13, 0],   [0.3675, 0.1754, 0]],
                [[0.27, 0, 0],    [0.4926, 0.0, 0]],
                [[0.27, -.13, 0],  [0.3675, -0.1754, 0]],
                [[0.27, -0.271, 0], [0.271, -0.271, 0]],
               ];

    var blue = new LTextureControl([2, 1], [0, 0], [0, 0]);
    var grey = new LTextureControl([2, 1], [1, 0], [0, 0]);

    var astructure = new LStructureDef(ShaderShade, {colors: [[0.7, 0.7, 1.0, 1.0], [0.4, 0.4, 0.2, 1.0]], cwidth: 2, cheight: 1});
    var bstructure = new LStructureDef(ShaderSimple, {colors: [[0.7, 0.7, 1.0, 1.0], [0.4, 0.4, 0.2, 1.0]], cwidth: 2, cheight: 1, collision: LSTATIC});

    astructure.addBezierBlock({depth: .3, coords: ma, ysegments: 1, texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    astructure.addBezierBlock({depth: .3, coords: mb, ysegments: 1, texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    astructure.addBezierBlock({depth: .3, coords: mc, xsegments: 1, texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    astructure.addBezierBlock({depth: .3, coords: md, xsegments: 1, texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    bstructure.addBezierBlock({depth: .3, coords: oa, ysegments: 1, texturecontrol: blue});
    bstructure.addBezierBlock({depth: .3, coords: ob, ysegments: 1, texturecontrol: blue});
    bstructure.addBezierBlock({depth: .3, coords: oc, xsegments: 1, texturecontrol: blue});
    bstructure.addBezierBlock({depth: .3, coords: od, xsegments: 1, texturecontrol: blue});
    astructure.addTriangle({depth: .3, coords: [[-0.25, 0.27], [-0.27, 0.27], [-0.27, 0.25]], texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    astructure.addTriangle({depth: .3, coords: [[-0.27, -0.25], [-0.27, -0.27], [-0.25, -0.27]], texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    astructure.addTriangle({depth: .3, coords: [[.25, -0.27], [.27, -0.27], [.27, -0.25]], texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});
    astructure.addTriangle({depth: .3, coords: [[.27, 0.25], [.27, 0.27], [.25, 0.27]], texturecontrol: blue, hold: [LI_FRONT, LI_BACK]});

    var dpos = lFromXYZ(0, 0, 0.3);

    bstructure.addBezierPatch({position: dpos, coords: ma, ysegments: 1, texturecontrol: blue});
    bstructure.addBezierPatch({position: dpos, coords: mb, ysegments: 1, texturecontrol: blue});
    bstructure.addBezierPatch({position: dpos, coords: mc, xsegments: 1, texturecontrol: blue});
    bstructure.addBezierPatch({position: dpos, coords: md, xsegments: 1, texturecontrol: blue});
    bstructure.addTrianglePatch({position: dpos, coords: [[-0.25, 0.27], [-0.27, 0.27], [-0.27, 0.25]], texturecontrol: blue});
    bstructure.addTrianglePatch({position: dpos, coords: [[-0.27, -0.25], [-0.27, -0.27], [-0.25, -0.27]], texturecontrol: blue});
    bstructure.addTrianglePatch({position: dpos, coords: [[.25, -0.27], [.27, -0.27], [.27, -0.25]], texturecontrol: blue});
    bstructure.addTrianglePatch({position: dpos, coords: [[.27, 0.25], [.27, 0.27], [.25, 0.27]], texturecontrol: blue});

    astructure.addBlockPatch({position: lFromXYZ(0, 0, -0.199), size: [0.27, 0.27], texturecontrol: grey});
    bstructure.addBlock({position: lFromXYZ(0, -1.115, -.325), size: [0.27, 1.385, 0.025], texturecontrol: grey});

    var offstruct = new LStructureDef(ShaderSimple, {color: [0.1, 0.1, 0.1, 1.0], shininess: 10});
    offstruct.addCylinder({position: lFromXYZ(0, 0.235, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    offstruct.addCylinder({position: lFromXYZ(0, -0.235, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    offstruct.addCylinder({position: lFromXYZ(0.235, 0, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    offstruct.addCylinder({position: lFromXYZ(-0.235, 0, .305), radius: .08, depth: .01, hold: [LI_BACK]});

    var onstruct = new LStructureDef(ShaderSolid, {color: [0.8, 1.0, 0.8, 1.0]});
    onstruct.addCylinder({position: lFromXYZ(0, 0.235, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    onstruct.addCylinder({position: lFromXYZ(0, -0.235, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    onstruct.addCylinder({position: lFromXYZ(0.235, 0, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    onstruct.addCylinder({position: lFromXYZ(-0.235, 0, .305), radius: .08, depth: .01, hold: [LI_BACK]});

    bstructure.consolidateCorners({});

    return [astructure, bstructure, offstruct, onstruct];
}

function DKeyHole(x, y, z, ry)
{
    BaseKeyHole.call(this, structs.DKeyHole, x, y, z, ry);
    this.achievekey = "dkey";
}

DKeyHole.prototype = Object.assign(Object.create(BaseKeyHole.prototype), {
    constructor: DKeyHole,
});

function xKeyHoleStructure()
{
    const ma = [
        [[-0.250, 0.27, 0], [-.13, 0.27, 0], [0, 0.27, 0], [.13, 0.27, 0], [0.250, 0.27, 0]],
        [[-0.0607, 0.0807, 0], [-0.0407, 0.091, 0], [0.0, 0.129, 0], [0.0407, 0.091, 0], [0.0607, 0.0807, 0]],
        ];

    const mb = [
        [[-0.0607, -0.0807, 0], [-0.0407, -0.091, 0], [0, -0.129, 0], [0.0407, -0.091, 0], [0.0607, -0.0807, 0]],
        [[-0.250, -0.27, 0], [-.13, -0.27, 0], [0.0, -0.27, 0], [.13, -0.27, 0], [0.250, -0.27, 0]],
        ]

    const mc = [
        [[-0.27, 0.250, 0], [-0.0807, 0.0607, 0]],
        [[-0.27, .13,  0], [-0.091, 0.0407,  0]],
        [[-0.27, 0, 0],   [-0.129, 0, 0]],
        [[-0.27, -.13,  0], [-0.091, -0.0407,  0]],
        [[-0.27, -0.250, 0], [-0.0807, -0.0607, 0]],
        ];

    const md = [
        [[0.0807, 0.0607, 0], [0.27, 0.250, 0]],
        [[0.091, 0.0407,  0], [0.27, .13,  0]],
        [[0.129, 0, 0],       [0.27, 0, 0]],
        [[0.091, -0.0407,  0], [0.27, -.13,  0]],
        [[0.0807, -0.0607, 0], [0.27, -0.250, 0]],
        ];




/*
    const oa = [
        [[-0.271, 0.271, 0], [-0.1754, 0.3675, 0], [0.0, 0.4926, 0], [0.1754, 0.3675, 0], [0.271, 0.271, 0]],
        [[-0.271, 0.27, 0], [-.13, 0.27, 0], [0, 0.27, 0], [.13, 0.27, 0], [0.271, 0.27, 0]]
        ];

    const ob = [
        [[-0.271, -0.27, 0], [-.13, -0.27, 0], [0, -0.27, 0], [.13, -0.27, 0], [0.271, -0.27, 0]],
        [[-0.271, -0.271, 0], [-0.1754, -0.3675, 0], [0.0, -0.4926, 0], [0.1754, -0.3675, 0], [0.271, 0-.271, 0]]
        ];

    const oc = [
               [[-0.271, 0.271, 0],   [-0.27, 0.271, 0]],
               [[-0.3675, 0.1754, 0], [-0.27, .13, 0]],
               [[-0.4926, 0.0, 0],    [-0.27, 0, 0]], 
               [[-0.3675, -0.1754, 0], [-0.27, -.13, 0]],
               [[-0.271, -0.271, 0],   [-0.27, -0.271, 0]]
               ];

    const od = [
                [[0.27, 0.271, 0], [0.271, 0.271, 0]],
                [[0.27, .13, 0],   [0.3675, 0.1754, 0]],
                [[0.27, 0, 0],    [0.4926, 0.0, 0]],
                [[0.27, -.13, 0],  [0.3675, -0.1754, 0]],
                [[0.27, -0.271, 0], [0.271, -0.271, 0]],
               ];
    */

    var red = new LTextureControl([2, 1], [0, 0], [0, 0]);
    var grey = new LTextureControl([2, 1], [1, 0], [0, 0]);

    var astructure = new LStructureDef(ShaderShade, {colors: [[1.0, 0.7, 0.7, 1.0], [0.4, 0.4, 0.2, 1.0]], cwidth: 2, cheight: 1});
    var bstructure = new LStructureDef(ShaderSimple, {colors: [[1.0, 0.7, 0.7, 1.0], [0.4, 0.4, 0.2, 1.0]], cwidth: 2, cheight: 1, collision: LSTATIC});

    astructure.addBezierBlock({depth: .3, coords: ma, ysegments: 1, texturecontrol: red, hold: [LI_FRONT, LI_BACK]});
    astructure.addBezierBlock({depth: .3, coords: mb, ysegments: 1, texturecontrol: red, hold: [LI_FRONT, LI_BACK]});
    astructure.addBezierBlock({depth: .3, coords: mc, xsegments: 1, texturecontrol: red, hold: [LI_FRONT, LI_BACK]});
    astructure.addBezierBlock({depth: .3, coords: md, xsegments: 1, texturecontrol: red, hold: [LI_FRONT, LI_BACK]});

    bstructure.addTriangle({depth: .3, coords: [[-0.27, 0.27], [0.27, 0.27], [0, 0.542]], texturecontrol: red});
    bstructure.addTriangle({depth: .3, coords: [[-0.27, -0.27], [-0.27, 0.27], [-0.542, 0]], texturecontrol: red});
    bstructure.addTriangle({depth: .3, coords: [[0.27, -0.27], [-0.27, -0.27], [0, -0.542]], texturecontrol: red});
    bstructure.addTriangle({depth: .3, coords: [[0.27, 0.27], [0.27, -0.27], [0.542, 0]], texturecontrol: red});

    astructure.addTriangle({depth: .3, coords: [[-0.25, 0.27], [-0.27, 0.27], [-0.27, 0.25]], texturecontrol: red, hold: [LI_FRONT, LI_BACK]});
    astructure.addTriangle({depth: .3, coords: [[-0.27, -0.25], [-0.27, -0.27], [-0.25, -0.27]], texturecontrol: red, hold: [LI_FRONT, LI_BACK]});
    astructure.addTriangle({depth: .3, coords: [[.25, -0.27], [.27, -0.27], [.27, -0.25]], texturecontrol: red, hold: [LI_FRONT, LI_BACK]});
    astructure.addTriangle({depth: .3, coords: [[.27, 0.25], [.27, 0.27], [.25, 0.27]], texturecontrol: red, hold: [LI_FRONT, LI_BACK]});

    var dpos = lFromXYZ(0, 0, 0.3);

    bstructure.addBezierPatch({position: dpos, coords: ma, ysegments: 1, texturecontrol: red});
    bstructure.addBezierPatch({position: dpos, coords: mb, ysegments: 1, texturecontrol: red});
    bstructure.addBezierPatch({position: dpos, coords: mc, xsegments: 1, texturecontrol: red});
    bstructure.addBezierPatch({position: dpos, coords: md, xsegments: 1, texturecontrol: red});
    bstructure.addTrianglePatch({position: dpos, coords: [[-0.25, 0.27], [-0.27, 0.27], [-0.27, 0.25]], texturecontrol: red});
    bstructure.addTrianglePatch({position: dpos, coords: [[-0.27, -0.25], [-0.27, -0.27], [-0.25, -0.27]], texturecontrol: red});
    bstructure.addTrianglePatch({position: dpos, coords: [[.25, -0.27], [.27, -0.27], [.27, -0.25]], texturecontrol: red});
    bstructure.addTrianglePatch({position: dpos, coords: [[.27, 0.25], [.27, 0.27], [.25, 0.27]], texturecontrol: red});

    astructure.addBlockPatch({position: lFromXYZ(0, 0, -0.199), size: [0.27, 0.27], texturecontrol: grey});
    bstructure.addBlock({position: lFromXYZ(0, -1.115, -.325), size: [0.27, 1.385, 0.025], texturecontrol: grey});

    var offstruct = new LStructureDef(ShaderSimple, {color: [0.1, 0.1, 0.1, 1.0], shininess: 10});
    offstruct.addCylinder({position: lFromXYZ(0, 0.235, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    offstruct.addCylinder({position: lFromXYZ(0, -0.235, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    offstruct.addCylinder({position: lFromXYZ(0.235, 0, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    offstruct.addCylinder({position: lFromXYZ(-0.235, 0, .305), radius: .08, depth: .01, hold: [LI_BACK]});

    var onstruct = new LStructureDef(ShaderSolid, {color: [0.8, 1.0, 0.8, 1.0]});
    onstruct.addCylinder({position: lFromXYZ(0, 0.235, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    onstruct.addCylinder({position: lFromXYZ(0, -0.235, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    onstruct.addCylinder({position: lFromXYZ(0.235, 0, .305), radius: .08, depth: .01, hold: [LI_BACK]});
    onstruct.addCylinder({position: lFromXYZ(-0.235, 0, .305), radius: .08, depth: .01, hold: [LI_BACK]});

    bstructure.consolidateCorners({});

    return [astructure, bstructure, offstruct, onstruct];
}

function XKeyHole(x, y, z, ry)
{
    BaseKeyHole.call(this, structs.XKeyHole, x, y, z, ry);
    this.achievekey = "xkey";
}

XKeyHole.prototype = Object.assign(Object.create(BaseKeyHole.prototype), {
    constructor: XKeyHole,
});

function rocketStructure()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.3});

    var wid = 0.05;
    var hght = 0.5;
    var pscale = 3;

    var dfor8 = wid / Math.tan(Math.PI /  8);  // 4142
    var dforh8 = dfor8 / Math.sqrt(2); // 2929 

    var cht = dfor8 * pscale;
    var clen = Math.sqrt((cht * cht) + (dfor8 * dfor8));
    var ang = -(Math.atan(1 / pscale) + LR90);
    var cone = new LStructureDef(ShaderSimple, {color: [1.0, 1.0, 0.5, 1.0]});

    // Need to multiply in different order here

    function _wpos(x, y, z, rx, ry, rz)
    {
        var ma = mat4.create();
        if(rz != 0) mat4.rotateZ(ma, ma, rz);
        if(ry != 0) mat4.rotateY(ma, ma, ry);
        if(rx != 0) mat4.rotateX(ma, ma, rx);
        var mb = mat4.create();
        mat4.fromTranslation(mb, vec3.fromValues(x, y, z));
        mat4.multiply(ma, mb, ma);
        return ma;
    }
    /*

    cone.addPolygon({coords: [[0, dfor8], [-dforh8, dforh8],  [-dfor8, 0,], [-dforh8, -dforh8],
                              [0, -dfor8], [dforh8, -dforh8], [dforh8, 0], [dforh8, dforh8]], depth: hght});

    */
    
    cone.addBlockPatch({position: _wpos(0,       dfor8,   .5 + clen, -LR90, 0, 0), size: [wid, hght]});
    cone.addBlockPatch({position: _wpos(-dforh8, dforh8,  .5 + clen, -LR90, 0, LR90 / 2), size: [wid, hght]});
    cone.addBlockPatch({position: _wpos(-dfor8,  0,       .5 + clen, -LR90, 0, LR90), size: [wid, hght]});
    cone.addBlockPatch({position: _wpos(-dforh8, -dforh8, .5 + clen, -LR90, 0, (LR90 * 3 / 2)), size: [wid, hght]});
    cone.addBlockPatch({position: _wpos(0,       -dfor8,  .5 + clen, -LR90, 0, LR180), size: [wid, hght]});
    cone.addBlockPatch({position: _wpos(dforh8,  -dforh8, .5 + clen, -LR90, 0, -LR90 * 3 / 2), size: [wid, hght]});
    cone.addBlockPatch({position: _wpos(dfor8,   0,       .5 + clen, -LR90, 0, -LR90), size: [wid, hght]});
    cone.addBlockPatch({position: _wpos(dforh8,  dforh8,  .5 + clen, -LR90, 0, -LR90/ 2), size: [wid, hght]});


    cone.addTrianglePatch({position: lFromXYZ(0, 0, 1.0 + clen), coords: [[0, 0], [wid, dfor8], [-wid, dfor8]]})
    cone.addTrianglePatch({position: lFromXYZ(0, 0, 1.0 + clen), coords: [[0, 0], [-wid, dfor8], [-dfor8, wid]]})
    cone.addTrianglePatch({position: lFromXYZ(0, 0, 1.0 + clen), coords: [[0, 0], [-dfor8, wid], [-dfor8, -wid]]})
    cone.addTrianglePatch({position: lFromXYZ(0, 0, 1.0 + clen), coords: [[0, 0], [-dfor8, -wid], [-wid, -dfor8]]})
    cone.addTrianglePatch({position: lFromXYZ(0, 0, 1.0 + clen), coords: [[0, 0], [-wid, -dfor8], [wid, -dfor8]]})
    cone.addTrianglePatch({position: lFromXYZ(0, 0, 1.0 + clen), coords: [[0, 0], [wid, -dfor8], [dfor8, -wid]]})
    cone.addTrianglePatch({position: lFromXYZ(0, 0, 1.0 + clen), coords: [[0, 0], [dfor8, -wid], [dfor8, wid]]})
    cone.addTrianglePatch({position: lFromXYZ(0, 0, 1.0 + clen), coords: [[0, 0], [dfor8, wid], [wid, dfor8]]})


    var coords = [[wid, 0, 0], [0, clen, 0], [-wid, 0, 0]];
    
    cone.addTrianglePatch({position: _wpos(0,       dfor8,   clen, ang, 0, 0, 0), coords: coords});
    cone.addTrianglePatch({position: _wpos(-dforh8, dforh8,  clen, ang, 0, LR90 / 2, 0), coords: coords});
    cone.addTrianglePatch({position: _wpos(-dfor8 , 0,       clen, ang, 0, LR90, 0), coords: coords});
    cone.addTrianglePatch({position: _wpos(-dforh8, -dforh8, clen, ang, 0, LR90 * 3 / 2, 0), coords: coords});
    cone.addTrianglePatch({position: _wpos(0,      -dfor8,   clen, ang, 0, LR180, 0), coords: coords});
    cone.addTrianglePatch({position: _wpos(dforh8, -dforh8,  clen, ang, 0, -LR90 * 3 / 2, 0), coords: coords});
    cone.addTrianglePatch({position: _wpos(dfor8,  0,        clen, ang, 0, -LR90, 0), coords: coords});
    cone.addTrianglePatch({position: _wpos(dforh8, dforh8,   clen, ang, 0, -LR90/ 2, 0), coords: coords});

    // Add the fins at the back - 0.15 worth 

    coords = [[0,0], [.15, .0], [0, .3]];
    cone.addTriangle({position: _wpos(0,  dfor8, 1 + clen, -LR90, 0, LR90), depth: .005, coords: coords, ahold: [LI_SIDE + 2]});
    cone.addTriangle({position: _wpos(-dfor8,  0, 1 + clen, -LR90, 0, LR180), depth: .005, coords: coords, ahold: [LI_SIDE + 2]});
    cone.addTriangle({position: _wpos(0,  -dfor8, 1 + clen,-LR90, 0, -LR90), depth: .005, coords: coords, ahold: [LI_SIDE + 2]});
    cone.addTriangle({position: _wpos(dfor8,  0, 1 + clen, -LR90, 0, 0), depth: .005, coords: coords, ahold: [LI_SIDE + 2]});

    return [gdef, cone];

}


function Rocket(x, y, z, ry)
{
    BaseThing.call(this, structs.Rocket, true, x, y, z, ry);
    this.hole = null;
    this.achievekey = "rocket";
    lScene.stateobjs.push(this);

    this.isfired = null;
    this.istravel = false;
}

Rocket.prototype = Object.assign(Object.create(BaseThing.prototype), {
    constructor: Rocket,

    respawn: function()
    {
        var obj = new Rocket(0, 0, 0, 0);
        return obj;
    },

    fire: function(person)
    {
        if(!this.isfired) {
            this.isfired = person;
            person.ride = this;
            person.vvel = 0;
            sounds.rocket.play();
        }
    },

    end: function()
    {
        this.stop(null);
        this._baseend();
    },

    stop: function(person)
    {
        if(person)
            person.ride = null;
        this.isfired = null;
        sounds.rocket.pause();
    },

    riding: function(person, delta)
    {
        var donemessage = false;
        var stats = person.ridecoll(delta * -20);
        if(stats.alevel >= 0)
            person.rideheight(stats.alevel);
        if(stats.hit) {
            // Hit something - 1
            person.ridemove(delta * 20);
            this.stop(person);
            sounds.hit.play();

            // Hit the flower - tell them as nuch
            if(stats.hitflower) {
                // Smash
                stats.hitflower.end();
                sounds.smash.play();
                lScene.lMessage("The flower is delicate: You ust rocketed into it and smashed it.");
                donemessage = true;
            }
            // If  near a flower - say so and destroy it.  May also hit flower too

            var obj = this.obj;
            var flowers = lScene.flowers;
            var flen = flowers.length;
            var hitflower = false;
            for(var i = 0; i < flen; i++) {
               var fobj = flowers[i].obj;
                if(fobj.isvisible) {
                    if(Math.hypot(fobj.x - obj.x, fobj.y - obj.y, fobj.z - obj.z) <= 10) {
                        hitflower = true;
                        flowers[i].end();
                    }
                }
            }
            if(hitflower && (!donemessage)) {
                sounds.smash.play();
                lScene.lMessage("iThe flower is delicate: Crashing a rocket near it destroys it");
                donemessage = true;
            }
            if (stats.hitrocket) {
                if(!donemessage)
                    lScene.lMessage("Rocketing into another flying rocket destroys both of them", "yellow");
                stats.hitrocket.stop(stats.hitrocket.isfired);
                stats.hitrocket.end();
                sounds.smash.play();
                this.end();
            }
        }
    },
});

function BaseKey(struct, x, y, z, ry)
{
    BaseThing.call(this, struct, true, x, y, z, ry);
    this.hole = null;
    lScene.stateobjs.push(this);
    this.istravel = false;
}

BaseKey.prototype = Object.assign(Object.create(BaseThing.prototype), {
    constructor: BaseKey,

    vsave: function(ret)
    {
        ret.hole = this.hole;
    },

    vrestore: function(saved)
    {
        if(this.obj.isvisible) {
            if(saved.hole) {
                this.inlock(saved.hole);
            }
        }
    },

    inlock: function(lock)
    {
        this.obj.rotateFlatHere(0, lock.ry, 0);
        this.obj.moveHere(lock.aobj.x, lock.aobj.y, lock.aobj.z);
        this.aobj.moveHere(0, 0, 0);

        this.iscarried = null;
        this.shadowobj.mkvisible(false);

        // A cheat, move the point back

        this.aobj.move(0, 0, -1.0);

        this.obj.moveFlat(0, 0, 0.7);
        this.obj.procpos();

        lock.switchon();
        this.hole = lock;
        this.canpickup = false;

    },
    fits: function(cobj)
    {
        if(this.fitsin(cobj)) {
            if(cobj.ison) return false;
            var dry = cobj.ry - this.obj.ry;
            if(dry > LR360) dry -= LR360;
            if (dry < 0) dry += LR360;

            if(dry >= LR90 * 3.5  || dry <= LR90 / 2) {
                this.inlock(cobj);
                sounds.unlock.play();
                return true;
            }
        }
        return false;
    },
});

function dKeyStructure()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.3});
    var structure = new LStructureDef(ShaderSimple, {color: vec4.fromValues(0.7, 0.7, 1.0, 1.0)});
    structure.addCylinder({position: lFromXYZ(0, 0, 0.5), radius: 0.1, depth: 0.5})
    structure.addCylinder({position: lFromXYZPYR(0, 0, 1.0, 0, LR90, 0), radius: 0.2, depth: 0.1})
    structure.addCylinder({position: lFromXYZPYR(0.18,  0,    0.10, LR90, 0, 0), radius: 0.10, depth: 0.01})
    structure.addCylinder({position: lFromXYZPYR(-0.18, 0,    0.10, LR90, 0, 0), radius: 0.10, depth: 0.01})
    structure.addCylinder({position: lFromXYZPYR(0,     0.18, 0.10, 0, LR90, 0), radius: 0.10, depth: 0.01})
    structure.addCylinder({position: lFromXYZPYR(0,    -0.18, 0.10, 0, LR90, 0), radius: 0.10, depth: 0.01})
    return [gdef, structure];
}

function DKey(x, y, z, ry)
{
    BaseKey.call(this, structs.DKey, x, y, z, ry);
}

DKey.prototype = Object.assign(Object.create(BaseKey.prototype), {
    constructor: DKey,

    respawn: function()
    {
        return new DKey(0, 0, 0, 0);
    },

    fitsin: function(what) {
        return what instanceof DKeyHole;
    }
});

function xKeyStructure()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.3});
    var structure = new LStructureDef(ShaderSimple, {color: vec4.fromValues(1.0, 0.7, 0.7, 1.0)});
    structure.addCylinder({position: lFromXYZ(0, 0, 0.5), radius: 0.1, depth: 0.5});
    structure.addBlock({position: lFromXYZPYR(0, 0, 1.0, LR90 / 2, 0, 0), size: [0.1, 0.2, 0.2]});
    structure.addBlock({position: lFromXYZPYR(0.18,  0,   0.10, 0, LR90 / 2, 0, 0), size: [0.1, 0.01, 0.1]});
    structure.addBlock({position: lFromXYZPYR(-0.18,  0,   0.10, 0, LR90 / 2, 0, 0), size: [0.1, 0.01, 0.1]});
    structure.addBlock({position: lFromXYZPYR(0,  0.18, 0.10, LR90 / 2, 0, 0), size: [0.01, 0.1, 0.1]});
    structure.addBlock({position: lFromXYZPYR(0, -0.18, 0.10, LR90 / 2, 0, 0), size: [0.01, 0.1, 0.1]});
    return [gdef, structure];
}

function XKey(x, y, z, ry)
{
    BaseKey.call(this, structs.XKey, x, y, z, ry);
}

XKey.prototype = Object.assign(Object.create(BaseKey.prototype), {
    constructor: XKey,

    respawn: function()
    {
        return new XKey(0, 0, 0, 0);
    },

    fitsin: function(what) {
        return what instanceof XKeyHole;
    },
});


const structs = {};


function pillarStructure()
{
    var stand = new LStructureDef(ShaderSimple, {color: [0.4, 0.4, 0.2, 1.0], collision: LSTATIC, shininess: 5});
    // Stands only go 4 meter high for collision else it gets in way of jumps
    stand.addBlock({position: lFromXYZ(-4.75, -4.9, -4.75), size: [.25, 2.5, .25]});
    stand.addBlock({position: lFromXYZ(4.75, -4.9, -4.75), size: [.25, 2.5, .25]});
    stand.addBlock({position: lFromXYZ(-4.75, -4.9, 4.75), size: [.25, 2.5, .25]});
    stand.addBlock({position: lFromXYZ(4.75, -4.9, 4.75), size: [.25, 2.5, .25]});
    return stand;
}

function pedestalStructure()
{
    var stand = new LStructureDef(ShaderSimple, {color: [0.4, 0.4, 0.2, 1.0], collision: LSTATIC, shininess: 5});
    // Stands only go 4 meter high for collision else it gets in way of jumps
    stand.addBlock({position: lFromXYZ(0, -4.9, 0), size: [1, 2.5, 1]});
    return stand;
}

function Pillar(x, y, z, ry)
{
    this.obj = new LWObject(structs.Pillar, this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.isfloor = false;
    this.iswire = false;
    this.iscage = false;
}
    
function Pedestal(x, y, z, ry)
{
    this.obj = new LWObject(structs.Pedestal, this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.isfloor = false;
    this.iswire = false;
    this.iscage = false;
}
    
function floorPillarStructure()
{
    var stand = new LStructureDef(ShaderSimple, {color: [0.4, 0.4, 0.2, 1.0], collision: LSTATIC, shininess: 5});
    // Stands only go 4 meter high for collision else it gets in way of jumps

    stand.addBlock({position: lFromXYZ(-4.75, -5, -4.75), size: [.25, 2.4, .25]});
    stand.addBlock({position: lFromXYZ(4.75, -5, -4.75), size: [.25, 2.4, .25]});
    stand.addBlock({position: lFromXYZ(-4.75, -5, 4.75), size: [.25, 2.4, .25]});
    stand.addBlock({position: lFromXYZ(4.75, -5, 4.75), size: [.25, 2.4, .25]});
    // stand.useCorners([[-5, -.35, -5], [5, -2.5, 5]], {});
    return stand;
}

function floorPedestalStructure()
{
    var stand = new LStructureDef(ShaderSimple, {color: [0.4, 0.4, 0.2, 1.0], collision: LSTATIC, shininess: 5});
    // Stands only go 4 meter high for collision else it gets in way of jumps

    stand.addBlock({position: lFromXYZ(0, -5, 0), size: [1, 2.4, 1]});
    // stand.useCorners([[-5, -.35, -5], [5, -2.5, 5]], {});
    return stand;
}

function _FloorPillar(x, y, z, ry)
{
    this.obj = new LWObject(structs._FloorPillar, this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.isfloor = false;
    this.iswire = false;
    this.iscage = false;
}
    
function _FloorPedestal(x, y, z, ry)
{
    this.obj = new LWObject(structs._FloorPedestal, this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.isfloor = false;
    this.iswire = false;
    this.iscage = false;
}
    
function floorStructure()
{
    var floor = new LStructureDef(ShaderSimple, {texture: KFLOOR, collision: LSTATIC, shininess: 5});
    var ttop = new LTextureControl([512, 512], [0, 0], [512, 512]);
    var tbot = new LTextureControl([512, 512], [0, 512], [512, -512]);
    var tleft = new LTextureControl([512, 512], [10, 0], [0, 512]);
    var tright = new LTextureControl([512, 512], [502, 0], [0, 512]);
    var tfront = new LTextureControl([512, 512], [0, 10], [512, 0]);
    var tback = new LTextureControl([512, 512], [512, 502], [-512, 0]);
    floor.addBlock({position: lFromXYZ(0, -2.5, 0), size: [5, .1, 5], corners: [[-5, -2.5, -5], [5, 0, 5]], texturecontrols: [tfront, tback, ttop, tright, tbot, tleft]});
    /*
    floor.useCorners([[-5, -2.5, -5], [-4.5, -3.3, -4.5]], {});
    floor.useCorners([[-5, -2.5, 5], [-4.5, -3.3, 4.5]], {});
    floor.useCorners([[5, -2.5, -5], [4.5, -3.3, -4.5]], {});
    floor.useCorners([[5, -2.5, 5], [4.5, -3.3, 4.5]], {});
    */
    return floor;
}

function Floor(x, y, z, ry)
{
    this.obj = new LWObject(structs.Floor, this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    new _FloorPillar(x, y, z, ry);
    this.isfloor = true;
    this.istravel = false;
    this.candrop = true;
    this.iscage = false;
    this.iswire = false;
}

function PFloor(x, y, z, ry)
{
    this.obj = new LWObject(structs.Floor, this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    new _FloorPedestal(x, y, z, ry);
    this.isfloor = true;
    this.istravel = false;
    this.candrop = true;
    this.iscage = false;
    this.iswire = false;
}

function rFloorStructure()
{
    var floor = new LStructureDef(ShaderSimple, {texture: KRFLOOR, collision: LSTATIC, shininess: 5});
    var ttop = new LTextureControl([512, 512], [0, 0], [512, 512]);
    var tbot = new LTextureControl([512, 512], [0, 512], [512, -512]);
    var tleft = new LTextureControl([512, 512], [10, 0], [0, 512]);
    var tright = new LTextureControl([512, 512], [502, 0], [0, 512]);
    var tfront = new LTextureControl([512, 512], [0, 10], [512, 0]);
    var tback = new LTextureControl([512, 512], [512, 502], [-512, 0]);
    floor.addBlock({position: lFromXYZ(0, -2.5, 0), size: [5, .1, 5], corners: [[-5, -2.5, -5], [5, 0, 5]], texturecontrols: [tfront, tback, ttop, tright, tbot, tleft]});
    /*
    floor.useCorners([[-5, -2.5, -5], [-4.5, -3.3, -4.5]], {});
    floor.useCorners([[-5, -2.5, 5], [-4.5, -3.3, 4.5]], {});
    floor.useCorners([[5, -2.5, -5], [4.5, -3.3, -4.5]], {});
    floor.useCorners([[5, -2.5, 5], [4.5, -3.3, 4.5]], {});
     */
    return floor;
}

function RFloor(x, y, z, ry)
{
    this.obj = new LWObject(structs.RFloor, this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    new _FloorPillar(x, y, z, ry);
    this.isfloor = true;
    this.iswire = false;
    this.istravel = false;
    this.candrop = false;
    this.iscage = false;
}

function RPFloor(x, y, z, ry)
{
    this.obj = new LWObject(structs.RFloor, this);
    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    new _FloorPedestal(x, y, z, ry);
    this.isfloor = true;
    this.iswire = false;
    this.istravel = false;
    this.candrop = false;
    this.iscage = false;
}



function wireStructure()
{
    var pstru = new LStructureDef(ShaderSimple, {collision: LSTATIC, color: [0.4, 0.2, 0.1, 1.0]});
    pstru.addBlock({position: lFromXYZ(-4.9, -1.2, 0), size: [0.098, 1.3, 0.098]});
    pstru.addBlock({position: lFromXYZ(4.9, -1.2, 0), size: [0.098, 1.3, 0.098]});
    var wstru = new LStructureDef(ShaderSolid, {collision: LSTATIC, color: [0.8, 0.8, 0.8, 1.0]});
    wstru.addCylinder({position: lFromXYZPYR(0, 0, 0.06, 0, LR90, 0), radius: 0.02, depth: 4.9, corners: null});
    wstru.addCylinder({position: lFromXYZPYR(0, 0, -0.06, 0, LR90, 0), radius: 0.02, depth: 4.9, corners: null});
    wstru.addCylinder({position: lFromXYZPYR(0, -1.15, 0, 0, LR90, 0), radius: 0.02, depth: 4.9, corners: null});
    wstru.addCylinder({position: lFromXYZPYR(0, -2.0, 0, 0, LR90, 0), radius: 0.02, depth: 4.9, corners: null});
    wstru.useCorners([[-4.9, -2.5, -0.05], [4.9, 0.5, 0.05]], {});

    return [pstru, wstru];
}


function Wire(x, y, z, ry)
{
    this.obj = new LWObject(structs.Wire[0], this);
    this.wobj = new LWObject(structs.Wire[1], new WireLine(this));

    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.lPlace(this.wobj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.wobj.procpos();

    this.isfloor = false;
    this.iscage = false;
    this.istravel = false;
    this.iswire = false;
}

function wireqStructure()
{
    var pstru = new LStructureDef(ShaderSimple, {collision: LSTATIC, color: [0.4, 0.2, 0.1, 1.0]});
    pstru.addBlock({position: lFromXYZ(-1.15, -1.2, 0), size: [0.098, 1.3, 0.098]});
    pstru.addBlock({position: lFromXYZ(1.15, -1.2, 0), size: [0.098, 1.3, 0.098]});
    var wstru = new LStructureDef(ShaderSolid, {collision: LSTATIC, color: [0.8, 0.8, 0.8, 1.0]});
    wstru.addCylinder({position: lFromXYZPYR(0, 0, 0.06, 0, LR90, 0), radius: 0.02, depth: 1.15, corners: null});
    wstru.addCylinder({position: lFromXYZPYR(0, 0, -0.06, 0, LR90, 0), radius: 0.02, depth: 1.15, corners: null});
    wstru.addCylinder({position: lFromXYZPYR(0, -1.15, 0, 0, LR90, 0), radius: 0.02, depth: 1.15, corners: null});
    wstru.addCylinder({position: lFromXYZPYR(0, -2.0, 0, 0, LR90, 0), radius: 0.02, depth: 1.15, corners: null});
    wstru.useCorners([[-1.15, -2.5, -0.05], [1.15, 0.5, 0.05]], {});

    return [pstru, wstru];
}


function WireQ(x, y, z, ry)
{
    this.obj = new LWObject(structs.WireQ[0], this);
    this.wobj = new LWObject(structs.WireQ[1], new WireLine(this));

    lScene.lPlace(this.obj, lFromXYZPYR(x, y, z, 0, ry, 0));
    lScene.lPlace(this.wobj, lFromXYZPYR(x, y, z, 0, ry, 0));
    this.obj.procpos();
    this.wobj.procpos();

    this.isfloor = false;
    this.iscage = false;
    this.istravel = false;
    this.iswire = false;
}

function WireLine(par)
{
    this.isfloor = false;
    this.iscage = false;
    this.istravel = false;
    this.iswire = true;
    this.parent = par;
}

var g_record;
var g_playing;
var g_total;
var g_forward;

function playgame()
{

    
    lInit();
    // lClear();

    g_record = document.getElementById("record");
    g_playing = document.getElementById("playing");
    g_total = document.getElementById("total");
    g_forward = document.getElementById("fastforward");

    structs.Wall = wallStructures();
    structs.Dunk = dunkStructure();
    structs.Sky = skyStructure();
    structs.Kronky = kronkyStructure();
    structs.shadowStruct = shadowStruct();
    structs.DKey = dKeyStructure();
    structs.XKey = xKeyStructure();
    structs.DKeyHole = dKeyHoleStructure();
    structs.XKeyHole = xKeyHoleStructure();
    structs.Exit = exitStructure();
    structs.Rocket = rocketStructure();
    structs.Flower = flowerStructure();
    structs.FlowerStand = flowerStandStructure();
    structs.Floor = floorStructure();
    structs.RFloor = rFloorStructure();
    structs._FloorPillar = floorPillarStructure();
    structs.Pillar = pillarStructure();
    structs._FloorPedestal = floorPedestalStructure();
    structs.Pedestal = pedestalStructure();
    structs.Lift = liftStructure();
    structs.Zip11 = zip11Structure();
    structs.Zip21 = zip21Structure();
    structs.DodgyBridge = dodgyBridgeStructure();
    structs.DodgyBridge2 = dodgyBridge2Structure();
    structs.Cage = cageStructure();
    structs.PushMe = pushMeStructure();
    structs.EKronky = eKronkyStructure();
    structs.Post = postStructure();
    structs.Door = doorStructure();
    structs.Portcullis = portcullisStructure();
    structs.Glass = glassStructure();
    structs.GlassPartition = glassPartitionStructure();
    structs.Wire = wireStructure();
    structs.WireQ = wireqStructure();
    structs.Rope = ropeStructure();

}

var g_hasfirst = false;

function fplaylevel(levelnum)
{
    if(!g_hasfirst) {
        g_hasfirst = true;
        playgame();
    }
    levelnum = parseInt(levelnum);
    document.getElementById("mform").style.display = "none";
    document.getElementById("mgame").style.display = "block";
    playlevel(levelnum);
}

var g_level;


function playlevel(levelnum)
{

    document.getElementById("kronkylevel").value = levelnum;

    g_LevelNum = levelnum;
    g_level = cLevels[g_LevelNum];
    g_LevelNum += 1;
    
    if(!g_level) {
        document.getElementById("lTTitle").innerText = "Finished";
        document.getElementById("lTMessage").innerText = "";
        alert("Success! All levels complete");
        return;
    }

    if((!g_level.intro) || (!document.forms.mform.intros.checked)) {
        d_playlevel();
    } else {
        dispintro()
        return;
    }
}

function d_playlevel()
{

    document.getElementById(LCANVAS_ID).requestPointerLock();
    document.getElementById(LCANVAS_ID).onclick = function() {document.getElementById(LCANVAS_ID).requestPointerLock();};
    
    gCloseGame = false;

    new Scene({
        // Collisions
        lCFrom: [-500, -10, -500],
        lCTo: [500, 100, 500],
        lCSize: 1.5,
        lCInc: 0.2,
        // Camera
        lLDynamic: true,
        lLDistance: 0.3,
        });



    lScene.lRestart = function() {lScene.lMessage(""); lScene.lSetTitle(""); document.exitPointerLock();if(!gCloseGame) playlevel(g_LevelNum);};
    lScene.lSetTitle(g_LevelNum.toString() + ":" + g_level.description);

    g_level.map();

    g_total.innerText = lScene.numkronky;
    g_playing.innerText = lScene.playkronky;
    g_record.innerText = "";

    for(var i = 0; i < 5; i++)
    {
        var kronky = new Kronky();
        var crobj = kronky.obj;
        lScene.lAddChild(crobj, mat4.create());
        lScene.kronky.push(kronky);
    }

    lScene.lSetup();
    lCamera.warp();

    lScene.record = null;
    lScene.lMain();
}

function e_playlevel()
{
    document.getElementById("mgame").style.display = "block";
    document.getElementById("mintro").style.display = "none";
    document.getElementById("mform").style.display = "none";
    d_playlevel();
}

function dispintro()
{
    var intro = g_level.intro;
    var heading = g_LevelNum.toString() + ": " + g_level.description;
    document.getElementById("mgame").style.display = "none";
    document.getElementById("mform").style.display = "none";
    document.getElementById("mintro").style.display = "block";
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            document.getElementById("introcontent").innerHTML = (xhttp.responseText).replace(/"intros\//g, '"' + BASEDIR + '/intros/');
            var headelem = document.getElementById("introheader");
            if(headelem) headelem.innerText = heading;
        }
    };
    xhttp.open("GET", BASEDIR + intro, true);
    xhttp.send();
}

function dispback()
{
    var intro = g_level.intro;
    document.getElementById("mform").style.display = "block";
    document.getElementById("mintro").style.display = "none";
    document.getElementById("mgame").style.display = "none";
    document.getElementById("introcontent").innerHTML = "";
}

