"use strict";

/*
The Elite game, an implementation of the original 1984 game by David Braben and Ian Bell
Elite coda, data, ships etc derived from the "Newkind" game, reversed engineered from that, by Christian Pinder
 */

import {LAssets, LImage, LAudios, LAudioLoop, LBase, LCamera, LObject, LIObject, LWObject, LStaticGroup, LGroupDef,
    LStructureDef, LTextureControl, LVirtObject, LGroup, LStructure, LKey, lInput, lInText, LInField, lInAny, LObjImport, LComponent,
    lInit, lClear, lStructureSetup, lTextureColor, lTextureColorAll, lTextureList, lLoadTexture, lReloadTexture, lLoadTColor,
    lReloadTColor, lLoadTColors, lReloadTColors, lLoadTCanvas, lReloadTCanvas, lInitShaderProgram, lElement, lAddButton, lCanvasResize,
    lFromXYZR, lFromXYZ, lFromXYZPYR, lExtendarray, lGetPosition, lAntiClock, lCoalesce, lIndArray,
    LPRNG, LPRNGD, LCANVAS_ID, LR90, LR180, LR270, LR360, LI_FRONT, LI_BACK, LI_SIDE, LI_TOP, LI_RIGHT, LI_BOTTOM, LI_LEFT, LSTATIC,
    LDYNAMIC, LNONE, LBUT_WIDTH, LBUT_HEIGHT, LMESTIME, LASSET_THREADS, LASSET_RETRIES, LOBJFILE_SMOOTH, LTMP_MAT4A, LTMP_MAT4B,
    LTMP_MAT4C, LTMP_QUATA, LTMP_QUATB, LTMP_QUATC, LTMP_VEC3A, LTMP_VEC3B, LTMP_VEC3C, lSScene, LTEXCTL_STATIC,
    LTEXCTL_STATIC_LIST, lGl, lCamera, lScene, lDoDown, lDoUp, lShader_objects, mat4, vec3, vec4, quat, LKEY} from "../../libs/limpetge.js"

import {
    ShaderSun,
    ShaderPlanet,
    ShaderSimple,
    ShaderCockpit,
    ShaderSolid,        // This has some transparents in it
    ShaderScanLine,
    ShaderDust
} from "./shader_belite.js";

import {ECommander, EDWorld, EDSun, EDStation, EDStars, EDB_TRADE_LENGTH, EDB_T_ALLOYS, EDB_T_MINERALS, EDB_T_ILLEGALS, EDB_T_ILLEGALS_LENGTH} from "./edb.js";

import { SLOTSIZE_2_2, SLOTSIZE_3_3, SLOTSIZE_6_3, SLOTSIZE_8_5, SLOTSIZE_8_15, SLOTSIZE_MAX, SLOTS, HOLDPOS,
    ETRADER, ESMUGGLER, EHUNTER, EPIRATE, EMINER, EPOLICE, EHERMIT, ETRANSPORT, ETHARGOID, ESOLO, ECM_DELAY,
    ThingBase, FlotsamBase, PersonBase, NPCBase, StationBase, MinistationBase, ThargoidBase, ThargonBase, 
    Scan, MockScan, Slots, Parked, Autodock, ExplosionPart, Explosion, Laser,
    MissileBase, RadarBeam, VirtStation, SphereBase, CockpitBase, base_structures, g_prng, g_prngd, BASEDIR
    } from "./base.js";

import {mission_get} from "./missions.js";


import {eship_structures, newvbig, newbig, newship, newfighter, newpirate, newfpirate, newstations, newpolice,
    newthargoid, newthargon, newmission1, 
    newcargo, newhermit, newasteroid, newboulder, newrock, newalloy, newmissile, newescape, newtransport, sidestruct, newme} from "./eships.js";

const structures = {};

var gPlayer;

var g_atlevel = 0;
var g_strandhit = 4.0;  // how close to hit the strand
var g_shotbase = 40;
var g_shotrand = 60;
var g_lastfired = 0.5;
var g_howfast = 2.0;


/*
 * Modes of entry
 * NOTE - These are duplicated in missions.js
 * to save re-i mporting there
 */
const S_DOCK = 0;     // To dock (from save)
const S_SPACE = 1;   // To space (from jump)
const S_HOME = 2;   // To space at station
const S_JUMP = 3; // To jump from space
const S_KJUMP = 4; // To jump from space
const S_TOHYPER = 5; // To hyper
const S_FROMHYPER = 6; // From Hyper
const S_LOCK = 7;   // From jump space to here instigated by lock
const S_CRASH = 8;   // From jump space - Crashing!!

const SS_NORMAL = 1;
const SS_JUMP = 2;
const SS_WITCH = 3;

/*
 * Keys used
 */
const pckeys = {
    KEY_ARROW_DOWN: 40,
    KEY_ARROW_UP: 38,
    KEY_ARROW_LEFT: 37,
    KEY_ARROW_RIGHT: 39,

    KEY_PITCH_DOWN: 40,
    KEY_PITCH_UP: 38,
    KEY_ROLL_ANTI: 37,
    KEY_ROLL_CLOCK: 39,

    KEY_GO_FORWARD: 87,
    KEY_GO_BACK: 83,

    KEY_DO_FIRE: 81,   // Q
    KEY_DO_TARGET: 84,   // T
    KEY_DO_UNTARGET: 85,   // U
    KEY_DO_MISSFIRE: 77,   // M
    KEY_DO_ECM: 69,        // E

    KEY_DO_FRONT: 49, // 6 for short range
    KEY_SEE_LEFTT: 50,
    KEY_SEE_RIGHTT: 51,
    KEY_SEE_UPT: 52,
    KEY_SEE_DOWNT: 53,
    KEY_DO_SHORT: 54, // 6 for short range
    KEY_DO_LONG: 55, // 7 for long range
    KEY_DO_EQUIPMENT: 56, // 8 For equipment
    KEY_DO_TRADES: 57, // 9 For trades
    KEY_DO_STATUS: 48, // 0 For status

    KEY_DO_JUMP: 74, // J (letter)
    KEY_DO_KJUMP: 75,   // K
    KEY_DO_UNJUMP: 78, // N (letter)

    KEY_DO_HYPER: 72,      // H
    KEY_DO_GALACTIC: 71,   // G
    KEY_DO_ESCAPE: 80,     // P
    KEY_DO_COMPUTER: 67,   // C
    KEY_DO_COMPUTER_OFF: 68,   // Q letter
    KEY_DO_BOMB: 66,   // B
    KEY_DO_DUMP: 86,       // V
    KEY_DO_LAST: 76,       // L

    KEY_DO_ENTER: 13,  //Enter
    KEY_DO_ORIGIN: 79, // O (letter)
    KEY_DO_INFO: 73,   // I
    KEY_DO_FIND: 70,   // F

    KEY_SEE_UP: 104,        //Keypad 8
    KEY_SEE_DOWN: 98,       // Keypad 2
    KEY_SEE_LEFT: 100,      // Keypad 4
    KEY_SEE_RIGHT: 102,     // Keypad 6
    KEY_SEE_STRAIGHT: 101,  // Keypad 5

    KEY_DO_KEYHELP: 187,    // =

    KEY_DO_QUIT: 8,   // Back space
    swapped_pitch: false   // COntrol swapped pitch keys
}

const tradkeys = Object.assign({}, pckeys, {

    KEY_PITCH_DOWN: 83,     // S
    KEY_PITCH_UP: 88,       // X`
    KEY_ROLL_ANTI: 188,     // <
    KEY_ROLL_CLOCK: 190,    // >

    KEY_GO_FORWARD: 32,     // Space
    KEY_GO_BACK: 191,       // ?, /

    KEY_DO_FIRE: 65,        // A
});

/*
 * From the front form
 * Save to commander
 */

var g_ukeys;

function apply_keyboard(kboard, swap_pitch)
{
    let cmdr = new ECommander();
    cmdr.load(0);
    cmdr.keyboard_layout = (parseInt(kboard) << 3) | (swap_pitch ? 1 : 0);
    cmdr.save(0);
    display_keyboard(cmdr.keyboard_layout);
}
    
/*
 * Display the keyboard help
 * Also returns keyboard
 */
function display_keyboard(iklayout)
{
    let kbd;
    let swap_pitch = ((iklayout & 0x01) == 1);
    let klayout = iklayout >>> 3;

    switch(klayout) {
    case 1:
        kbd = tradkeys;
        break;
    case 0:
    default:
        kbd = pckeys;
        break;
    }
    if(swap_pitch != kbd.swapped_pitch) {
        kbd.swapped_pitch = swap_pitch;
        let tmp = kbd.KEY_PITCH_DOWN;
        kbd.KEY_PITCH_DOWN = kbd.KEY_PITCH_UP;
        kbd.KEY_PITCH_UP = tmp;
    }

    function _to_char(code)
    {
        let output = ""
        switch(code) {
        case 13: output = "ENTER";break;
        case 32: output = "SPACE";break;
        case 40: output = String.fromCharCode(0x2193); break;
        case 38: output = String.fromCharCode(0x2191); break;
        case 37: output = String.fromCharCode(0x2190); break;
        case 39: output = String.fromCharCode(0x2192); break;
        case 188: output = "<"; break;
        case 190: output = ">"; break;
        case 191: output = "?"; break;
        default:
            if(code >= 33 && code < 127) {
                output = String.fromCharCode(code);
            }
        }
        return output;
    }

    for(let key in kbd) {
        if(key.substring(0, 4) == "KEY_") {
            
            let ele = document.getElementById(key.toLowerCase());
            if(ele) {
                ele.innerText = _to_char(kbd[key]);
            }
        }
    }
    document.getElementById("keyboard_layout").value = klayout;
    document.getElementById("swap_pitch").checked = swap_pitch;
    g_ukeys = kbd;
}

function sunDef()
{
    var struct = new LStructureDef(ShaderSun, {canvas: document.getElementById("canvassun"), collision: LNONE});
    struct.addSphere({radius: 50});
    return struct;
}


class Sun extends SphereBase {
    constructor()
    {
        super(structures.sun, 51, [1.0, 1.0, 0.8, 1.0]) // Collision 1000 KM above surface
    }
}
    
function planetDef()
{
    var struct = new LStructureDef(ShaderPlanet, {shininess: -1, canvas: document.getElementById("canvasplanet"), collision: LNONE});
    struct.addSphere({radius: 16, position: lFromXYZPYR(0, 0, 0, 0, LR180, 0)});
    return struct;
}

class Planet extends SphereBase {
    constructor()
    {
        super(structures.planet, 17, [0.0, 1.0, 0.0, 1.0])  // Collision 500 KM above surface
        this.cvPoint = vec3.create();
    }
}

function starsDef()
{
    var colors = [
        [1.0,  0.9,  0.9,  1.0],       //red
        [0.9,  1.0,  0.9,  1.0],       // green
        [0.9,  0.9,  1.0,  1.0],       // Blue
        [0.8,  1.0,  1.0,  1.0],       // turquoise
        [1.0,  0.8,  1.0,  1.0],       // Purple
        [1.0,  1.0,  0.8,  1.0],       // yellow
        [0.97, 0.97, 0.97, 1.0],       // Whiteish
        [0.0,  0.0,  0.0,  1.0],       // Black hole for 8 :-)
    ];
    var numcolors = 7;

    var loc = mat4.create();
    var qua = mat4.create();

    var prng = new LPRNG(123);
    var prngd = new LPRNGD(456);

    var structs = [];

    for(var j = 0; j < 4; j++)
    {
        var struct = new LStructureDef(ShaderSun, {colors: colors, collision: LNONE});
        for(var i = 0; i < 500; i++)
        {
            var r = LR180 - prngd.next(LR360);  // Radius - random
            var y = prngd.next(1);
            y = y * y * y;      // Near 0
            if(prng.next(2) == 0) y = 0 - y;
            // Change to degrees
            y *= LR90;
    
            var x = Math.sin(r);
            var z = Math.cos(r);
    
            mat4.identity(loc);
            mat4.rotateY(loc, loc, r);
            mat4.rotateX(loc, loc, y);
            mat4.translate(loc, loc, [0, 0, -19000]);
    
            struct.addCylinder({depth: 0.1, radius: prng.next(20) + 10, segments: 6, position: loc, texturecontrols: [lTextureColor(8, prng.next(7))]});
        }
        structs.push(struct);
    }
    return structs;
}


class Stars {
    constructor(seed)
    {
        var prngd = new LPRNGD(seed);
        let angle = prngd.next(LR360);
        for(var struct of structures.stars)
        {
            let obj = new LWObject(struct, this);
            let rot = mat4.fromXRotation(mat4.create(), angle);
            mat4.rotateY(rot, rot,  prngd.next(LR360));
            lScene.lPlace(obj, rot);
            // obj.procpos();
        }
        this.scale = 1.0;
        this.fixed = true;
    }
}

class Player {

    constructor()
    {
        this.commander = new ECommander();       // Wakes up in Lave initially
        this.cockpit = null;
        // Can safetly do this as no GL stuff done on initialisation of this
    
    
        this.where = 0;     // 0 is docked, 1 in normal space, 2 in jumpspace, 3 in whitchspace, 4 in hyperspace, 5 in gal hyperspace, 6 is dead
        this.instatus = false;
        this.intrade = false;
        this.inequipment = false;
        this.inlong = false;
        this.ininfo = false;
        this.infind = false;
        this.kpressed = false;
        this.inmaint = false;

        this.missobj = null;    // The mission object
        
        // this.obj = new LGroup(collision: LNONE);
        // lScene.place(this.obj, mat4.create());
    
        this.longdiv = document.getElementById("displong");
        this.infodiv = document.getElementById("dispinfo");
        this.finddiv = document.getElementById("dispfind");
        this.enterdiv = document.getElementById("enterfind");
        this.shortdiv = document.getElementById("dispshort");
        this.statusdiv = document.getElementById("dispstatus");
        this.tradediv = document.getElementById("disptrades");
        this.equipmentdiv = document.getElementById("dispequipment");
        this.thetradediv = document.getElementById("thetrades");
        this.longcanvas = document.getElementById("longcanvas");
        this.shortcanvas = document.getElementById("shortcanvas");
        this.planetdata = document.getElementById("dispplandata");
        this.shortdata = document.getElementById("dispshortdata");
        this.infodata = document.getElementById("dispinfodata");
        this.missiondiv = document.getElementById("dispmission");
        this.missiontextdiv = document.getElementById("dispmissiontext");
        this.keyboarddiv = document.getElementById("dkeyboard_layout");
        this.keyboardtab = document.getElementById("tkeyboard_layout");
        this.longctx = this.longcanvas.getContext("2d");
        this.shortctx = this.shortcanvas.getContext("2d");
        this.gdispmessage = document.getElementById("dispmessage");
    
        // Jumpvec is in MegaMeters,
        // Each "Section" is 200M by 200M (0.2 MM)
        this.jumpvec = vec3.create();       // This is in 50 KM cubes
        this.jumpdir = vec3.fromValues(0, 0, -1);
        this.jumpquat = quat.create();   // The direction in which we are going
        this.homerel = vec3.fromValues(0, 0, 1);
        this.velocity = 0;

        this.messageid = null;

        this.commander.load(0);

        this.missobj = mission_get(this.commander);

        this.planet - this.commander.planet;
        this.planetcanvas = document.getElementById("canvasplanet");
        this.suncanvas = document.getElementById("canvassun");
        this.stasidescanvas = document.getElementById("canvasstasides");
        this.starscanvas = document.getElementById("canvasstars");
        this.planetctx = this.planetcanvas.getContext("2d");
        this.sunctx = this.suncanvas.getContext("2d");
        this.stasidesctx = this.stasidescanvas.getContext("2d");
        this.starsctx = this.starscanvas.getContext("2d");

        this.undispall();

        this.dispstatus();
        this.inmaint = true;

        this.finobj = null;

        this.commander.lgl_getvarstart(this);

        this.newme = null;  // To show escapes

        this.missionmess = lElement("div", {}, "", []);
        this.missind = false;
        this.keyhelpind = false;
    }

    domessage(message, timeout)
    {
        if(typeof timeout == "undefined") timeout = 5000;

        let gdimess = this.gdispmessage;
        let self = this;
        function _clear()
        {
            gdimess.innerText = "";
            self.messageid = null;
        }

        if(this.messageid !== null) {
            clearTimeout(this.messageid);
            _clear();
        }

        gdimess.style.width = message.length.toString() + "em";
        gdimess.innerText = message;
        if(timeout !== 0 && message != "")
            this.messageid = setTimeout(_clear, timeout)
    }

    create()
    {
        this.cockpit = new Cockpit();
        lScene.cockpit = this.cockpit;
        lScene.cockobj = this.cockpit.obj;

        this.commander.lgl_getlasers(this.cockpit);
        this.commander.lgl_getintegrity(this.cockpit);
        this.commander.lgl_getscoop(this.cockpit);
        this.commander.lgl_getecm(this.cockpit);

        // Variables
        this.cockpit.integrity = gPlayer.integrity;
        this.cockpit.shields = gPlayer.shields;
        this.cockpit.temperature = gPlayer.temperature;
        this.cockpit.lasercapacity = gPlayer.lasercapacity;

        this.cockpit.temperature = this.temperature;

        this.cockpit.fuellevel(this.commander.fuel, 7.0);
        this.cockpit.restockmiss(this.commander.missiles);

        this.cockpit.cargo_capacity = this.commander.cargo_capacity;
        this.cockpit.cargo_used = this.commander.cargo_used;

        this.cockpit.commander = this.commander;

        this.cockpit.bounty = this.commander.lgl_bounty();
        if(this.cockpit.bounty == 0)
            this.cockpit.isnocrime = false;
        else
            this.cockpit.isnocrime = false;
        lScene.player = this;
        lScene.commander = this.commander;

    }

    apply_keyboard(kboard, swap_pitch)
    {
        let kbd;
        switch(parseInt(kboard)) {
        case 1:
            kbd = tradkeys;
            break;
        case 0:
        default:
            kbd = pckeys;
            break;
        }
        if(swap_pitch != kbd.swapped_pitch) {
            kbd.swapped_pitch = swap_pitch;
            let tmp = kbd.KEY_PITCH_DOWN;
            kbd.KEY_PITCH_DOWN = kbd.KEY_PITCH_UP;
            kbd.KEY_PITCH_UP = tmp;
        }
    
        // Now to display the thing
    
        function _to_char(code)
        {
            let output = ""
            switch(code) {
            case 32: output = "SPACE";break;
            case 40: output = String.fromCharCode(0x2191); break;
            case 38: output = String.fromCharCode(0x2193); break;
            case 37: output = String.fromCharCode(0x2190); break;
            case 39: output = String.fromCharCode(0x2192); break;
            case 188: output = "<"; break;
            case 190: output = ">"; break;
            case 191: output = "?"; break;
            default:
                if(code >= 33 && code < 127) {
                    output = String.fromCharCode(code);
                }
            }
            return output;
        }
    
        for(let key in kbd) {
            if(key.substring(0, 4) == "KEY_") {
                
                let ele = document.getElementById(key.toLowerCase());
                if(ele) {
                    ele.innerText = _to_char(kbd[key]);
                }
            }
        }
        this.ukeys = kbd;
    }

    use_keys()
    {
        let keys = {
            pitch_down: false,
            pitch_up: false,
            roll_anti: false,
            roll_clock: false,
            yaw_left: false,
            yaw_right: false,
            go_forward: false,
            go_back: false,
            see_up: false,
            see_down: false,
            see_left: false,
            see_right: false,
            see_upt: false,
            see_downt: false,
            see_leftt: false,
            see_rightt: false,
            see_straight: false,
            do_computer: false,
            do_hyper: false,
            do_trades: false,
            do_equipment: false,
            do_quit: false,
            do_keyhelp: false,

            do_fire: false,

            do_target: false,
            do_untarget: false,
            do_missfire: false,
            do_ecm: false,
            do_find: false,
            do_last: false,

            is_mess: false,

            abort_quit: false,    // A pseudo key
            confirm_quit: false,    // A pseudo key
        };
    
    
        // Register keys as functions for performance

        lInput.clear();
        
        lInput.register(g_ukeys.KEY_PITCH_DOWN, function(ind) {keys.pitch_down = ind;});
        lInput.register(g_ukeys.KEY_PITCH_UP, function(ind) {keys.pitch_up = ind;});
        lInput.register(g_ukeys.KEY_ROLL_ANTI, function(ind) {keys.roll_anti = ind;});
        lInput.register(g_ukeys.KEY_ROLL_CLOCK, function(ind) {keys.roll_clock = ind;});

        lInput.register(g_ukeys.KEY_GO_FORWARD, function(ind) {keys.go_forward = ind;});
        lInput.register(g_ukeys.KEY_GO_BACK, function(ind) {keys.go_back = ind;});
        lInput.register(g_ukeys.KEY_DO_FRONT, function(ind) {keys.do_front = ind;keys.see_straight = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_SHORT, function(ind) {keys.do_short = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_LONG, function(ind) {keys.do_long = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_TRADES, function(ind) {keys.do_trades = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_EQUIPMENT, function(ind) {keys.do_equipment = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_STATUS, function(ind) {keys.do_status = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_ENTER, function(ind) {keys.do_enter = ind;});
        lInput.register(g_ukeys.KEY_DO_ORIGIN, function(ind) {keys.do_origin = ind;});
        lInput.register(g_ukeys.KEY_DO_INFO, function(ind) {keys.do_info = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_JUMP, function(ind) {keys.do_jump = ind;});
        lInput.register(g_ukeys.KEY_DO_KJUMP, function(ind) {keys.do_kjump = ind;});
        lInput.register(g_ukeys.KEY_DO_UNJUMP, function(ind) {keys.do_unjump = ind;});
        lInput.register(g_ukeys.KEY_SEE_UP, function(ind) {keys.see_up = ind;});
        lInput.register(g_ukeys.KEY_SEE_DOWN, function(ind) {keys.see_down = ind;});
        lInput.register(g_ukeys.KEY_SEE_LEFT, function(ind) {keys.see_left = ind;});
        lInput.register(g_ukeys.KEY_SEE_RIGHT, function(ind) {keys.see_right = ind;});
        lInput.register(g_ukeys.KEY_SEE_STRAIGHT, function(ind) {keys.see_straight = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_COMPUTER, function(ind) {keys.do_computer = ind;});
        lInput.register(g_ukeys.KEY_DO_HYPER, function(ind) {keys.do_hyper = ind;});
        lInput.register(g_ukeys.KEY_DO_GALACTIC, function(ind) {keys.do_galactic = ind;});
        lInput.register(g_ukeys.KEY_DO_COMPUTER_OFF, function(ind) {keys.do_computer_off = ind;});
        lInput.register(g_ukeys.KEY_DO_ESCAPE, function(ind) {keys.do_escape = ind;});
        lInput.register(g_ukeys.KEY_SEE_LEFTT, function(ind) {keys.see_left = ind;});
        lInput.register(g_ukeys.KEY_SEE_RIGHTT, function(ind) {keys.see_right = ind;});
        lInput.register(g_ukeys.KEY_SEE_UPT, function(ind) {keys.see_up = ind;});
        lInput.register(g_ukeys.KEY_SEE_DOWNT, function(ind) {keys.see_down = ind;});
        lInput.register(g_ukeys.KEY_DO_FIRE, function(ind) {keys.do_fire = ind;});
        lInput.register(g_ukeys.KEY_DO_TARGET, function(ind) {keys.do_target = ind;});
        lInput.register(g_ukeys.KEY_DO_UNTARGET, function(ind) {keys.do_untarget = ind;});
        lInput.register(g_ukeys.KEY_DO_MISSFIRE, function(ind) {keys.do_missfire = ind;});
        lInput.register(g_ukeys.KEY_DO_ECM, function(ind) {keys.do_ecm = ind;});
        lInput.register(g_ukeys.KEY_DO_FIND, function(ind) {keys.do_find = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_QUIT, function(ind) {keys.do_quit = ind;});
        lInput.register(g_ukeys.KEY_DO_KEYHELP, function(ind) {keys.do_keys = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_BOMB, function(ind) {keys.do_bomb = ind;});
        lInput.register(g_ukeys.KEY_DO_DUMP, function(ind) {keys.do_dump = ind;});
        lInput.register(g_ukeys.KEY_DO_LAST, function(ind) {keys.do_last = ind;keys.is_mess = ind;});

        // Use them
        lInput.usekeys();
        this.keys = keys;
        return keys;
    }

    use_map_keys()
    {
        let keys = {
            arrow_down: false,
            arrow_up: false,
            arrow_left: false,
            arrow_right: false,
            see_up: false,
            see_down: false,
            see_left: false,
            see_right: false,
            see_upt: false,
            see_downt: false,
            see_leftt: false,
            see_rightt: false,
            see_straight: false,
            do_equipment: false,
            do_quit: false,
            do_keyhelp: false,

            do_find: false,
            do_last: false,

            is_mess: false,

            abort_quit: false,    // A pseudo key
            confirm_quit: false,    // A pseudo key
        };
    
    
        // Register keys as functions for performance

        lInput.clear();
        
        lInput.register(g_ukeys.KEY_ARROW_DOWN, function(ind) {keys.arrow_down = ind;});
        lInput.register(g_ukeys.KEY_ARROW_UP, function(ind) {keys.arrow_up = ind;});
        lInput.register(g_ukeys.KEY_ARROW_LEFT, function(ind) {keys.arrow_left = ind;});
        lInput.register(g_ukeys.KEY_ARROW_RIGHT, function(ind) {keys.arrow_right = ind;});

        lInput.register(g_ukeys.KEY_DO_FRONT, function(ind) {keys.do_front = ind;keys.see_straight = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_SHORT, function(ind) {keys.do_short = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_LONG, function(ind) {keys.do_long = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_TRADES, function(ind) {keys.do_trades = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_EQUIPMENT, function(ind) {keys.do_equipment = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_STATUS, function(ind) {keys.do_status = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_ENTER, function(ind) {keys.do_enter = ind;});
        lInput.register(g_ukeys.KEY_DO_ORIGIN, function(ind) {keys.do_origin = ind;});
        lInput.register(g_ukeys.KEY_DO_INFO, function(ind) {keys.do_info = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_SEE_UP, function(ind) {keys.see_up = ind;});
        lInput.register(g_ukeys.KEY_SEE_DOWN, function(ind) {keys.see_down = ind;});
        lInput.register(g_ukeys.KEY_SEE_LEFT, function(ind) {keys.see_left = ind;});
        lInput.register(g_ukeys.KEY_SEE_RIGHT, function(ind) {keys.see_right = ind;});
        lInput.register(g_ukeys.KEY_SEE_STRAIGHT, function(ind) {keys.see_straight = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_SEE_LEFTT, function(ind) {keys.see_left = ind;});
        lInput.register(g_ukeys.KEY_SEE_RIGHTT, function(ind) {keys.see_right = ind;});
        lInput.register(g_ukeys.KEY_SEE_UPT, function(ind) {keys.see_up = ind;});
        lInput.register(g_ukeys.KEY_SEE_DOWNT, function(ind) {keys.see_down = ind;});
        lInput.register(g_ukeys.KEY_DO_FIND, function(ind) {keys.do_find = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_QUIT, function(ind) {keys.do_quit = ind;});
        lInput.register(g_ukeys.KEY_DO_KEYHELP, function(ind) {keys.do_keys = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_LAST, function(ind) {keys.do_last = ind;keys.is_mess = ind;});
        lInput.register(g_ukeys.KEY_DO_DUMP, function(ind) {keys.do_dump = ind;});

        // Use them
        lInput.usekeys();
        this.keys = keys;
        return keys;
    }

    procmaint(delta, keys)
    {
        if(this.infind) {
            lScene.cockpit.domessage("");
            this.enterdiv.innerText = this.findobj.str;
            if(this.findobj.isend) {
                let cmdr = this.commander;
                let name = this.findobj.str;
                planet = cmdr.galaxy.find_by_name(name);
                if(planet === null) {
                    name = name.toUpperCase();
                    lScene.cockpit.domessage("Cannot find planet " + name + " in this galaxy");
                    this.use_keys();
                    this.inmaint = false;
                } else {
                    cmdr.sel_planet = planet;
                    cmdr.sel_number = planet.number;
                    let coords = planet.get_coordinates();
                    cmdr.cross[0] = coords[0];
                    cmdr.cross[1] = coords[1];
                    this.inlong = true;
                    this.use_map_keys();
                    this.displong();
                    this.dispplanet(planet);
                }
                this.findobj = null;
                this.infind = false;
                this.undispfind();
            }
        }
            
        if(this.inlong) {

            var cx = 0;
            var cy = 0;

            if(keys.arrow_down) cy += delta * 10;
            if(keys.arrow_up) cy -= delta * 10;
            if(keys.arrow_right) cx += delta * 10;
            if(keys.arrow_left) cx -= delta * 10;
            if(cx != 0 || cy != 0) {
                this.commander.lgl_cross_inc(cx, cy);
                this.commander.lgl_drawgalaxy(this.longcanvas, this.longctx);
            } else if(keys.do_enter) {
                if(!this.kpressed) {
                    this.kpressed = true;
                    var cmdr = this.commander;
                    var planet = cmdr.find_planet(cmdr.cross[0], cmdr.cross[1]);
                    cmdr.sel_planet = planet;
                    cmdr.sel_number = planet.number;
                    var coords = planet.get_coordinates();
                    cmdr.cross[0] = coords[0];
                    cmdr.cross[1] = coords[1];
                    this.commander.lgl_drawgalaxy(this.longcanvas, this.longctx);
                    this.kpressed = true;
                    this.dispplanet(planet);
                }
            } else if(keys.do_origin) {
                if(!this.kpressed) {
                    this.kpressed = true;
                    var cmdr = this.commander;
                    if(cmdr.iswitchspace) {
                        cmdr.sel_planet = null;
                        cmdr.sel_number = -1;
                        cmdr.cross[0] = cmdr.witchcoords[0];
                        cmdr.cross[1] = cmdr.witchcoords[1];
                    } else {
                        cmdr.sel_planet = cmdr.planet;
                        cmdr.sel_number = cmdr.planet.number;
                        let coords = cmdr.planet.get_coordinates();
                        cmdr.cross[0] = coords[0];
                        cmdr.cross[1] = coords[1];
                    }
                    this.commander.lgl_drawgalaxy(this.longcanvas, this.longctx);
                    this.kpressed = true;
                    this.dispplanet(cmdr.planet);
                }
            } else 
                this.kpressed = false;
            return true;
        }

        if(this.inshort) {

            var cx = 0;
            var cy = 0;

            if(keys.arrow_down) cy += delta * 10;
            if(keys.arrow_up) cy -= delta * 10;
            if(keys.arrow_right) cx += delta * 10;
            if(keys.arrow_left) cx -= delta * 10;
            if(cx != 0 || cy != 0) {
                this.commander.lgl_cross_inc(cx, cy);
                this.commander.lgl_drawlocal(this.shortcanvas, this.shortctx);
            } else if(keys.do_enter) {
                if(!this.kpressed) {
                    this.kpressed = true;
                    var cmdr = this.commander;
                    var planet = cmdr.find_planet(cmdr.cross[0], cmdr.cross[1]);
                    cmdr.sel_planet = planet;
                    cmdr.sel_number = planet.number;
                    var coords = planet.get_coordinates();
                    cmdr.cross[0] = coords[0];
                    cmdr.cross[1] = coords[1];
                    cmdr.lgl_drawlocal(this.shortcanvas, this.shortctx);
                    this.displocal(planet);
                }
            } else if(keys.do_origin) {
                if(!this.kpressed) {
                    this.kpressed = true;
                    var cmdr = this.commander;
                    cmdr.sel_planet = cmdr.planet;
                    cmdr.sel_number = cmdr.planet.number;
                    var coords = cmdr.planet.get_coordinates();
                    cmdr.cross[0] = coords[0];
                    cmdr.cross[1] = coords[1];
                    this.commander.lgl_drawlocal(this.shortcanvas, this.shortctx);
                    this.kpressed = true;
                    this.displocal(cmdr.planet);
                }
            } else 
                this.kpressed = false;
            return true;
        }


        if(this.intrade) {
            if(keys.arrow_down) {
                if(!this.kpressed) {
                    this.commander.lgl_highlight_trade(1);
                    this.kpressed = true;
                }
            } else if (keys.arrow_up) {
                if(!this.kpressed) {
                    this.commander.lgl_highlight_trade(-1);
                    this.kpressed = true;
                }
            } else if (keys.arrow_right) {
                if(!this.kpressed) {
                    if(lScene.cockpit.ispark)
                        this.commander.lgl_buy(lScene.cockpit);
                    else
                        lScene.cockpit.domessage("Need to be docked to trade");
                    this.kpressed = true;
                }
            } else if (keys.arrow_left) {
                if(!this.kpressed) {
                    if(lScene.cockpit.ispark)
                        this.commander.lgl_sell(lScene.cockpit);
                    else
                        lScene.cockpit.domessage("Need to be docked to trade");
                    this.kpressed = true;
                }
            } else if(keys.do_dump) {
                if(!this.kpressed) {
                    if(lScene.cockpit.ispark) {
                       g_ass.boop.play();
                       lScene.cockpit.domessage("Need to be in space to dump canisters");
                    } else {
                        let dmp = this.commander.lgl_dump(lScene.cockpit);
                        if(dmp >= 0) {
                            let crg = lScene.cargos.next();
                            crg.what = dmp;
                            vec3.transformMat4(LTMP_VEC3A, vec3.set(LTMP_VEC3A, 0, -1, 2), lScene.cockpit.obj.position);
                            crg.appear(LTMP_VEC3A[0], LTMP_VEC3A[1], LTMP_VEC3A[2]);
                            g_ass.clunk.play();
                        }
                    }
                    this.kpressed = true;
                }
            } else {
                this.kpressed = false;
            }
            return true;
        }
        if(this.inequipment) {
            if(keys.arrow_down) {
                if(!this.kpressed) {
                    this.commander.lgl_highlight_equipment(1);
                    this.kpressed = true;
                }
            } else if (keys.arrow_up) {
                if(!this.kpressed) {
                    this.commander.lgl_highlight_equipment(-1);
                    this.kpressed = true;
                }
            } else if (keys.arrow_right) {
                if(!this.kpressed) {
                    if(lScene.cockpit.ispark)
                        this.commander.lgl_equip(lScene.cockpit, gPlayer);
                    else
                        lScene.cockpit.domessage("Need to be docked to equip");
                    this.kpressed = true;
                }
            } else if (keys.arrow_left) {
                if(!this.kpressed) {
                    if(lScene.cockpit.ispark)
                       this.commander.lgl_unequip(lScene.cockpit, gPlayer);
                    else
                        lScene.cockpit.domessage("Need to be docked to unequip");
                    this.kpressed = true;
                }
            }
            else
                this.kpressed = false;
            return true;
        }

        // instatus does nothing
    }

    prockeys() {
        /*
        Returns false ot to abort, true maybe abort
        */
        var keys = this.keys;

        // Following returns true
        if(keys.do_quit) {
            if(keys.abort_quit) {
                keys.abort_quit = false;
                keys.do_quit = false;
            } else {
                if(confirm("Quit game?")) {
                    keys.confirm_quit = true;
                } else {
                    keys.abort_quit = true;
                }
            }
            return true;
        }

        if (this.inmaint) {
            if(this.inmission) {
                if(this.missind) {
                    this.missind = false;
                    this.undispmission();
                    this.missionmess = lElement("div", {}, "", []);
                    this.inmission = false;
                    this.inmaint = false;
                    lInput.usekeys();
                }
                return false;
            }
            if(this.inkeyhelp) {
                if(this.keyhelpind) {
                    this.keyhelpind = false;
                    this.undispkeyhelp();
                    this.missionmess = lElement("div", {}, "", []);
                    this.inkeyhelp = false;
                    this.inmaint = false;
                    lInput.usekeys();
                }
                return false;
            }
            if(keys.do_front) {
                this.undispall();
                this.kpressed = false;
                this.inmaint = false;
                lScene.cockpit.eyes.rotateFlatHere(0, 0);
            }
        }

        if(keys.is_mess) {
            if(keys.do_short && (!this.inshort)) {
                this.undispall();
                this.dispshort();
                this.inmaint = true;
                this.inshort = true;
                this.use_map_keys();
                this.kpressed = false;
            } else if(keys.do_long && (!this.inlong)) {
                this.undispall();
                this.displong();
                this.inlong = true;
                this.use_map_keys();
                this.inmaint = true;
                this.kpressed = false;
            } else if(keys.do_info && (!this.ininfo)) {
                this.undispall();
                this.dispinfo();
                this.inmaint = true;
                this.ininfo = true;
                this.kpressed = false;
            } else if(keys.do_find && (!this.infind)) {
                this.undispall();
                this.dispfind();
                this.infind = true;
                this.inmaint = true;
                this.kpressed = false;
                // Switch off found
                this.findobj = new LInField("");
                keys.do_find = false;
            } else if(keys.do_trades && (!this.intrade)) {
                this.undispall();
                this.disptrades();
                this.inmaint = true;
                this.use_map_keys();
                this.intrade = true;
                this.kpressed = false;
            } else if(keys.do_equipment && (!this.inequipment)) {
                this.undispall();
                this.dispequipment();
                this.inmaint = true;
                this.inequipment = true;
                this.use_map_keys();
                this.kpressed = false;
            } else if(keys.do_status && (!this.instatus)) {
                this.undispall();
                this.dispstatus();
                this.inmaint = true;
                this.instatus = true;
                this.kpressed = false;
            } else if(keys.do_last && (!this.inmission)) {
                this.undispall();
                if(this.missobj) {
                    if(this.missobj.last_message(lScene)) {
                        this.inmaint = true;
                        this.inmission = true;
                        this.kpressed = false;
                        keys.do_last = false;
                        this.dispmission();
                    }
                }
            } else if(keys.do_keys && (!this.inkeyhelp)) {
                this.undispall();
                this.inmaint = true;
                this.inkeyhelp = true;
                this.kpressed = false;
                keys.do_keys = false;
                this.dispkeyhelp();
            }
        }
        return false;
    }

    undispall()
    {
        if(this.inshort || this.inlong || this.inequipment || this.intrade)
            this.use_keys();
        this.undisplong();
        this.undispinfo();
        this.undispfind();
        this.undisptrades();
        this.undispequipment();
        this.undispstatus();
        this.undispmission();
        this.undispshort();
        this.undispmission();
        this.inshort = false;
        this.inmission = false;
        this.inkeyhelp = false;
        this.intrade = false;
        this.inequipment = false;
        this.instatus = false;
        this.ininfo = false;
        this.infind = false;
        this.inlong = false;
    }


    dispstatus()
    {
        var div = this.statusdiv;
        div.innerHTML = "";
        div.appendChild(this.commander.lgl_status_screen());
        div.style.display = "block";
    }
    undispstatus()
    {
        var div = this.statusdiv;
        div.innerHTML = "";
        div.style.display = "none";
    }
    disptrades()
    {
        var div = this.tradediv;
        div.innerHTML = "";
        div.appendChild(this.commander.lgl_trades());
        div.style.display = "block";
    }
    dispequipment()
    {
        var div = this.equipmentdiv
        div.innerHTML = "";
        div.appendChild(this.commander.lgl_equipment());
        div.style.display = "block";
    }
    undisptrades()
    {
        var div = document.getElementById("disptrades");
        div.innerHTML = "";
        div.style.display = "none";
    }
    undispequipment()
    {
        var div = document.getElementById("dispequipment");
        div.innerHTML = "";
        div.style.display = "none";
    }
    displong()
    {
        this.longdiv.style.display = "block";
        this.commander.lgl_drawgalaxy(this.longcanvas, this.longctx);
        this.dispplanet(this.commander.sel_planet);
    }
    dispinfo()
    {
        this.infodiv.style.display = "block";
        this.infodata.innerHTML = "";
        this.infodata.appendChild(this.commander.sel_planet.lgl_show_data(this.commander.planet));
    }
    dispfind()
    {
        this.finddiv.style.display = "block";
        this.enterdiv.innerText = "";
    }
    dispplanet(planet)
    {
        if(planet == null) {
            this.planetdata.innerText = "*** PLANET DATA ERROR ***";
        } else {
            this.planetdata.innerHTML = "";
            this.planetdata.appendChild(planet.lgl_show_data(this.commander.planet));
        }
    }
    undisplong()
    {
        this.longdiv.style.display = "none";
    }
    undispinfo()
    {
        this.infodiv.style.display = "none";
    }
    undispfind()
    {
        this.finddiv.style.display = "none";
    }

    dispshort()
    {
        this.shortdiv.style.display = "block";
        this.commander.lgl_drawlocal(this.shortcanvas, this.shortctx);
        this.displocal(this.commander.sel_planet);
    }
    displocal(planet)
    {
        this.shortdata.innerHTML = "";
        this.shortdata.appendChild(planet.lgl_show_data(this.commander.planet));
    }
    undispshort()
    {
        this.shortdiv.style.display = "none";
    }

    dispmission()
    {
        this.missiondiv.style.display = "block";
        this.missiontextdiv.innerHTML = "";
        this.missiontextdiv.appendChild(this.missionmess)
        lInAny.register(function(ind, num) {if((ind) && (num == 32)) gPlayer.missind = true;});
        lInAny.usekeys();
        this.inmaint = true;
    }

    dispkeyhelp()
    {
        this.missiondiv.style.display = "block";
        this.missiontextdiv.innerHTML = "";
        let tkey = this.keyboardtab;
        this.missiontextdiv.appendChild(tkey.parentElement.removeChild(tkey));
        lInAny.register(function(ind, num) {if((ind) && (num == 32)) gPlayer.keyhelpind = true;});
        lInAny.usekeys();
        this.inmaint = true;
    }

    undispmission()
    {
        this.missiondiv.style.display = "none";
        this.missiontextdiv.innerHTML = "";
    }

    undispkeyhelp()
    {
        let tkey = this.keyboardtab;
        this.keyboarddiv.appendChild(tkey.parentElement.removeChild(tkey));
        this.missiondiv.style.display = "none";
        this.missiontextdiv.innerHTML = "";
    }

    normalspace(cmode)
    {
        const obj = lScene.cockobj;
        this.jumpvec[0] = obj.x * 10;
        this.jumpvec[1] = obj.y * 10;
        this.jumpvec[2] = obj.z * 10;
        this.velocity = lScene.cockpit.velocity * 10;
        quat.copy(this.jumpquat, obj.quat);
        lScene.setrestart(SS_NORMAL, cmode);
    }

    dockedspace(cmode)
    {
        const obj = lScene.cockobj;
        this.jumpvec[0] = 0;
        this.jumpvec[1] = 0;
        this.jumpvec[2] = 0;
        this.velocity = 0;
        quat.identity(this.jumpquat);
        lScene.setrestart(SS_NORMAL, S_DOCK);
    }

    jumpspace(cmode)
    {
        const obj = lScene.cockobj;
        quat.copy(this.jumpquat, obj.quat);
        this.velocity = lScene.cockpit.velocity;
        lScene.setrestart(SS_JUMP, cmode);
    }
}

class Cockpit extends CockpitBase {
    constructor()
    {
        super();
        this.wing = new WingSolo(this);
        this.wing.wingtype = ESOLO;
        this.centerz = -0.35;
    }
    addscans()
    {
        const obj = this.obj;
        for(let scan of lScene.scans) {
            obj.addChild(scan, mat4.create());
        }
    }

    noscans()
    {
        for(let scan of lScene.scans) {
            scan.mkvisible(false);
        }
    }
        
    domessage(mess, timeout)
    {
        gPlayer.domessage(mess, timeout);
    }
    process(delta)
    {

        var keys = gPlayer.keys;


        if(keys.do_computer) {
            if(gPlayer.commander.lgl_hasdocking()) {
                if(lScene.station !== null) {
                    if(!this.isauto) {
                        if(!this.ispark) {
                            this.autoobj.autodock();
                            g_ass.danube.stop();
                            g_ass.danube.rewind();
                            g_ass.danube.start();
                        }
                    }
                }
            }
        }

        if(keys.do_hyper) {
            this.hyperspace();
        }

        if(keys.do_galactic) {
            this.galactic();
        }

        if(keys.do_escape) {
            this.escapepod();
        }

        if(keys.do_bomb) {
            this.energybomb();
        }

        if(keys.do_computer_off) {
            if(this.isauto || this.ishyper || this.isescape || this.isgalactic || (this.ispark && this.canresetpark)) {
                g_ass.boop.play();
                if(this.isauto) {
                    g_ass.danube.stop();
                    g_ass.danube.rewind();
                }
            }
            this.autophase = 0;
            this.isauto = false;
            this.ishyper = false;
            this.isescape = false;
            this.isgalactic = false;
            this.hypertimer = 0.0;
            this.domessage("");
            if(this.ispark) {
                if(this.canresetpark) {
                    this.parkobj.reset();
                    this.domessage("");
                }
            }
        }


        var eyes = this.eyes;
        if(keys.see_straight) {
            eyes.rotateFlatHere(0, 0);
        } else {

            var doeyes = false;
            if(keys.see_left || keys.see_leftt) {
                eyes.ry += delta;
                if (eyes.ry > LR90)  eyes.ry = LR90;
                doeyes = true;
            }
            if(keys.see_right || keys.see_rightt) {
                eyes.ry -= delta;
                if (eyes.ry < -LR90)  eyes.ry = -LR90;
                doeyes = true;
            }
            if(keys.see_up || keys.see_upt) {
                
                eyes.rx += delta;
                if (eyes.rx > LR90)  eyes.rx = LR90;
                doeyes = true;
            }
            if(keys.see_down || keys.see_downt) {
                eyes.rx -= delta;
                if (eyes.rx < 0)  eyes.rx = 0;
                doeyes = true;
            }
            if(doeyes) {
                eyes.rotateFlatHere(eyes.rx, eyes.ry);
            }
        }

        if (gPlayer.inmaint) {
            gPlayer.procmaint(delta, keys);
            keys = {};
        }

        if(this.ishyper) {
            if(this.isescape) {
                if(!this.escapeprocess(delta)) return;
            } else {
                if(!this.hyperprocess(delta)) return;
            }
        }


        if(this.ispark) {        // In a station
            this.parkobj.process(delta);
            this.obj.procpos();
            mat4.invert(this.invposition, this.obj.position);
            if(keys.do_front) {
                eyes.rotateFlatHere(0, 0);
                this.parkobj.launch();
            }
            return;
        }

        if(this.isauto) {
            this.autoobj.process(delta, keys);
        }
        this.rprocess(delta, keys);
    
        var cocz = 0;
   
        if(keys.go_forward) {
           this.velocity += delta * this.acceleration;
            if (this.velocity > this.maxvelocity)
                this.velocity = this.maxvelocity;
            else
                cocz -= 1;
        }
        if(keys.go_back) {
            this.velocity -= delta * this.acceleration;
            if(this.velocity < 0)
                this.velocity = 0;
            else
                cocz += 1;
        }

        if(!(this.ispark))
            this.movedust(delta);

        this.procmove(delta);

        var cobj = this.pilot;

        if(cocz == 1) {
            cobj.z -= delta * 0.3;
            if(cobj.z < -0.1) cobj.z = -0.1;
        } else if (cocz == -1) {
            cobj.z += delta * 0.3;
            if(cobj.z > 0.1) cobj.z = 0.1;
        } else {
            if(cobj.z > 0) {
                cobj.z -= delta * 0.3;
                if (cobj.z < 0) cobj.z = 0;
            } else if (cobj.z < 0) {
                cobj.z += delta * 0.3;
                if (cobj.z > 0) cobj.z = 0;
            } else {
                cobj.z = 0;
            }
        }

        cobj.y = -this.velpitch / 10;
        cobj.rotateHere(0, 0, -this.velroll / 10);
        cobj.procpos();

        if(this.missmessind > 0) {
            this.missmesstimer -= delta;
            if(this.missmesstimer <= 0) {
                this.missmesstimer = 2.0;
                this.domessage("*** INCOMING MISSILE ***", 1000);
            }
        }
    }

    seetarget(ship, x, y, z)
    {
        if(!(this.isprimed)) {
            if(z < 0) {
                if((((x * x) + (y * y)) / (z * z)) < 0.001) {
                    this.istarget = false;
                    let mess =  ship.description;
                    if(ship.bounty == 0) {
                        if(ship instanceof NPCBase) {
                            mess += ": Clean";
                        }
                    } else {
                        mess += ", Bounty: " + this.commander.nfmt(ship.bounty);
                        mess = mess.substring(0, mess.length - 1);
                    }
                    this.domessage(mess);
                    if(this.isarmed) {
                        this.isarmed = false;
                        this.isprimed = true;
                        this.misstarget = ship;
                        this.missdisps[this.nummissiles].color = [1.0, 0.0, 0.0, 1.0];
                        g_ass.boop.play();
                    }
                }
            }
        }
    }

    procmove(delta)
    {
        if(!(lScene.injump)) return super.procmove(delta);

        if(this.crash) return;

        this.obj.move(0, 0, -this.velocity * delta);
        var self = this;

        // We really only want to it something if we are pointing at it

        let hit = false;

        function _cback(cob)
        {
            // I only want to crash into it if I am pointing at it
            if(self.crash) return;
            var ctl = cob.control;
            if (ctl instanceof VirtStation) {
                if(ctl.dotdir < 0)  {
                    vec3.normalize(gPlayer.homerel, vec3.set(LTMP_VEC3A, lScene.cockobj.x, lScene.cockobj.y, lScene.cockobj.z));
                    lScene.cockobj.moveHere(0, 0, 0);
                    lScene.cockobj.warp();
                    gPlayer.normalspace(S_HOME);
                    g_ass.boop.play();
                    self.crash = true;
                }
            } else if(ctl instanceof SphereBase) {
                if(!hit) {
                    if(ctl instanceof Planet) {
                        self.domessage("Too near planet");
                        hit = true;
                    }
                    if(ctl instanceof Sun) {
                        self.domessage("Too near sun");
                        hit = true;
                    }
                }
                // if(ctl.dotdir < 0)  {
                    // self.obj.move(0, 0, self.velocity * delta);
                    // gPlayer.normalspace(S_SPACE);
                    // self.crash = true;
                // }
            }
        }

        this.obj.ignore = true;
        lScene.lCAllPointDetect(this.obj, 0.5, _cback);
        this.obj.ignore = false;
        if(hit) {
            this.obj.move(0, 0, this.velocity * delta);
            this.explode();
            this.crash = true;
        } else {
            this.obj.rotate(delta * this.velpitch, 0, -(delta * this.velroll));
        }
        mat4.invert(this.invposition, this.obj.position);

    }

    energybomb()
    {
        if(gPlayer.commander.lgl_hasbomb() && (!this.ispark)) {
            if(lScene.issafe) {
                this.domessage("Cannot deploy energy bomb near station");
                g_ass.boop.play();
            } else {
                for(let npc of lScene.npcs) {
                    if(npc.exists && (!npc.ispark)) npc.explode();
                }
                for(let missile of lScene.missiles.pool) {
                    if(missile.exists) {
                        if(missile.target.exists) {
                            missile.target.missmess(false);
                            missile.explode();
                        }
                    }
                }
                gPlayer.commander.lgl_bombgo();
                this.domessage("Energy bomb deployed");
            }
        }
    }

    escapepod()
    {
        let cmdr = this.commander;
        if(!cmdr.lgl_hasescapepod()) {
            this.domessage("Do not posess an Escape Pod");
            g_ass.boop.play();
            return;
        }
        if(this.ispark) {
            g_ass.boop.play();
            this.domessage("Cannot use the escape pod while in the station");
            return;
        }
        g_ass.beep.play();
        super.escapepod();

        this.bounty = 0;
        this.isnocrime = false;

    }
    hyperspace()
    {
        if(this.ishyper) return;
        if(this.isgalactic) return;
        if(this.ispark) {
            g_ass.boop.play();
            this.domessage("Leave station before going into hyperspace");
            return;
        }
        if(this.isauto) {
            g_ass.boop.play();
            this.domessage("Auto docking, cannot hyperspace");
            return;
        }
        if(lScene instanceof WitchScene) {
            if(lScene.witchlock)  {
                g_ass.boop.play();
                this.domessage("Still locked in witchspace");
                return;
            }
        }

        let cmdr = gPlayer.commander;
        if(cmdr.sel_planet == null || cmdr.sel_number == -1) {
            g_ass.boop.play();
            this.domessage("No system selected");
            return;
        }
        if(cmdr.sel_planet === cmdr.planet) {
            g_ass.boop.play();
            this.domessage("Already at " +  cmdr.planet.capitalise_name(cmdr.planet.name));
            return;
        }

        if(cmdr.planet.get_distance(cmdr.sel_planet) > cmdr.fuel) {
            g_ass.boop.play();
            this.domessage("Not enough fuel to get to " + cmdr.sel_planet.capitalise_name(cmdr.sel_planet.name));
            return;
        }
        g_ass.beep.play();
        cmdr.hyper_planet = cmdr.sel_planet;
        cmdr.old_planet = cmdr.planet;
        super.hyperspace();
    }
    galactic()
    {
        let cmdr = gPlayer.commander;
        if(this.isgalactic) return;
        if(!cmdr.lgl_hasgalactic()) {
            g_ass.boop.play();
            this.domessage("Do not posess a Galactic Hyperdrive");
            return;
        }
        if(this.ispark) {
            g_ass.boop.play();
            this.domessage("Leave station before going into hyperspace");
            return;
        }
        if(this.isauto) {
            g_ass.boop.play();
            this.domessage("Auto docking, cannot hyperspace");
            return;
        }

        g_beep.play();
        super.galactic();
    }

    escapemessage()
    {
            this.domessage("ESCAPE in " + this.hyperseconds.toString());
    }

    hypermessage()
    {
        if(this.isgalactic) {
            this.domessage("Galactic Hyperspace in " + this.hyperseconds.toString());
        } else {
            let plan = gPlayer.commander.hyper_planet;
            this.domessage("Hyperspace to " + plan.capitalise_name(plan.name) +  " in " + this.hyperseconds.toString());
        }
    }

    hypergo()
    {
        let iswitch = false;
        if((gPlayer.keys.pitch_up || g_prng.next(lScene.chanceforwitch) == 0) && lScene instanceof NormalScene)
            iswitch = true;

        if(this.isgalactic) {
            this.bounty = 0;
            this.isnocrime = false;
            gPlayer.commander.lgl_galaxygo();
            gPlayer.domessage("");
        } else {
            if(this.bounty > 0) {
                this.bounty = gPlayer.commander.lgl_addcrime(0 - (g_prng.next(Math.round(this.bounty * 40)) + g_prng.next(100)));
                if(this.bounty == 0)
                    this.isnocrime = false;
                else
                    this.isnocrime = true;
            }
            if(iswitch)
                gPlayer.commander.lgl_witchgo();
            else
                gPlayer.commander.lgl_hypergo();
            gPlayer.domessage("");
        }

        if(iswitch)
            lScene.setrestart(SS_WITCH, S_FROMHYPER);
        else
            lScene.setrestart(SS_NORMAL, S_FROMHYPER);
    }
    escapego()
    {
        this.bounty = 0;
        this.isnocrime = false;
        gPlayer.domessage("");
        gPlayer.commander.lgl_escapego();
        gPlayer.dockedspace();
        this.cmdr_save(0);
    }
    cmdr_save()
    {
        gPlayer.commander.save(0);
    }

    recbounty(ship)
    {
        this.commander.credits += ship.bounty;
        this.domessage("Received bounty of " + this.commander.nfmt(ship.bounty) + " for the " + ship.description);
    }
    newme()
    {
        this.noscans();
        this.stopdust();
        this.obj.mkvisible(false);
        this.obj.isvisible = true;
        this.pilot.isvisible = true;
        this.eyes.isvisible = true;
        this.meobj = newme(this);
        this.obj.addChild(this.meobj, mat4.create());
        this.obj.procpos();
    }
}

class WingInterface {
    constructor()
    {
        this.exists = false;
        this.wingtype = 0;
        this.numalive = 0;
        this.numships = 0;

        this.numpark = 0;
        this.ispark = false;
        this.station = null;

        this.numinrange = 0;
        this.wingangryat = null;
    }
    /*  Interfaces - no need to actually define them here
    parkship() {}
    launchship() {}
    disappear() {}
    launch() {}
    mkangry(ship)
    chooseangry(wing) {}
    */
}

class WingSolo extends WingInterface{
    constructor(ship)
    {
        super();
        this.ship = ship;
    }
    parkship()
    {
        this.numpark = 1;
        this.ispark = true;
    }
    launchship()
    {
        this.numpark = 0;
        this.ispark = false;
    }

    disappear()
    {
        this.ship.disappear();
        this.exists = false;
        this.ispark = false;
        this.numalive = 0;
    }
    process(delta) { }  // Solo is cockpit for now  - No processing
    launch()
    {
        this.ispark = false;
        ship.parkobj.launch();
    } 
    mkangry(ship)
    {
        this.ship.mkangry(ship);
    }
    chooseangry(wing)
    {
        this.wingangryat = wing;
        let ret = false;
        if (this.ship.exists) {
            if(this.ship.chooseangry(wing)) ret = true;
        }
        return ret;
    }
}

class WingBase extends WingInterface {
    constructor() {
        super();
        this.ships = [];
        this.waypoint = vec3.create();
        this.wingdir = 0;
    }

    appear_flying(x, y, z, q)
    {
        let velocity = 5.0 + g_prngd.next(10);      // TODO - Preset wing velocity on slowest ship
        let idx = 0;
        let ox = 1 - g_prngd.next(2);
        let oy = 1 - g_prngd.next(2);
        let oz = Math.sqrt(Math.abs(1 - ((ox * ox) + (oy * oy))))
        if(g_prng.next(2) == 0) oz = 0 - oz;
    
        let fact = 0
        for(let ship of this.ships) {
            for(;;) {
                if(ship.appear(x + (fact * ox), y + (fact * oy), z + (fact * oz), q)) {
                    break;
                }
                fact += 50;
            }
            if(lScene.issafe)
                ship.autoobj.autodock();
            else
                ship.velocity = velocity;
            fact += 50;
        }
        this.numalive = this.numships;
        this.numpark = 0;
        this.ispark = false;
    }

    appear_park(x, y, z, q)
    {
        for(let ship of this.ships) {
            ship.parkappear(x, y, z, q);
            ship.parkobj.park();
        }
        this.ispark = true;
        this.numpark = this.numships;
        this.numalive = this.numships;
        this.station = lScene.station;
    }

    appear(ispark, x, y, z, q)
    {
        if(this.exists) return;
        this.exists = true;
        this.numalive = this.numships;
        if(ispark) {
            this.appear_park(x, y, z, q);
        } else {
            this.appear_flying(x, y, z, q);
        }

        // Seelock when it appears

        let what = lScene.cockpit;
        
        if((!lScene.issafe) && (lScene.cockpit.tempdiff <= 0) && (
             (this.wingtype == EPIRATE)
          || (this.wingtype == EHUNTER && what.iswanted() > 0))) {
            for(let ship of this.ships) {
                ship.angryat = what;
                ship.isattack = true;
                ship.setlock();
                ship.lock();
            }
        } else {
            for(let ship of this.ships) {
                ship.isagressive = false;
                ship.isattack = false;
                ship.setunlock();
                ship.unlock();
            }
        }
    }

    parkship()
    {
        this.numpark += 1;
        if(this.numpark >= this.numships) this.ispark = true;
    }
    launchship()
    {
        if(this.numpark > 0) {
            this.numpark -= 1;
        }
        this.ispark = false;
    }

    disappear()
    {
        for(let ship of this.ships)
            ship.disappear();
        this.exists = false;
        this.ispark = false;
        this.numalive = 0;

        if(this === lScene.policewanted) lScene.policewanted = null;
    }

    _addship(ship)
    {
        ship.wing = this;
        this.ships.push(ship);
        this.numships += 1;
        let cargof = 1.0;
        ship.bounty = 0;
        ship.isnocrime = false;
        ship.wingtype = this.wingtype;
        switch(this.wingtype) {
        case EPIRATE:
            cargof = g_prngd.next(cargof);
            ship.bounty += Math.round(100 + g_prng.next(1000)) / 100;
            ship.isnocrime = true;
            break;
        case ESMUGGLER:
            cargof = g_prngd.next(cargof);  // Balancing issue re smugglers
            ship.bounty += Math.round(100 + g_prng.next(100)) / 100;
            ship.isnocrime = true;
            ship.isinnocent = true; // Smugglers always self defense
            break;
            // No break
        case EHUNTER:
            cargof = 0;     // Hunters have no cargo
            ship.isnocrime = true;
            ship.isinnocent = true; // Hunters only shoot at bounty people
            break;
        }
        ship.cargospill = Math.round(ship.cargospill * cargof);
        ship.isagressive = this.isagressive;
    }
    process(delta)
    {
        if(lScene.issafe) {
            if(this.exists) {
                if(this.ispark) {
                    if(g_prngd.next(1) < 0.002 * delta) {
                        this.launch();
                    }
                }
            }
            else {
                if(g_prngd.next(1) < 0.002 * delta) {
                    LTMP_VEC3A[0] = 0;
                    LTMP_VEC3A[1] = 0;
                    LTMP_VEC3A[2] = 1000 + g_prngd.next(500);
                    vec3.transformQuat(LTMP_VEC3A, LTMP_VEC3A, quat.fromEuler(LTMP_QUATA, g_prngd.next(360), g_prngd.next(360), g_prngd.next(360)));
                    this.appear(false, LTMP_VEC3A[0], LTMP_VEC3A[1], LTMP_VEC3A[2], quat.fromEuler(LTMP_QUATA, g_prngd.next(360), g_prngd.next(360), g_prngd.next(360)));
                
                }
            }
        } else if(!this.exists) {
            if(g_prngd.next(1) < 0.00002 * delta) {     // About once an hour
                let cobj = lScene.cockpit.obj;
                LTMP_VEC3A[0] = 0;
                LTMP_VEC3A[1] = 0;
                LTMP_VEC3A[2] = 400 + g_prngd.next(500);
                vec3.transformQuat(LTMP_VEC3A, LTMP_VEC3A, quat.fromEuler(LTMP_QUATA, g_prngd.next(360), g_prngd.next(360), g_prngd.next(360)));
                this.appear(false, LTMP_VEC3A[0] + cobj.x, LTMP_VEC3A[1] + cobj.y, LTMP_VEC3A[2] + cobj.z, quat.fromEuler(LTMP_QUATA, g_prngd.next(360), g_prngd.next(360), g_prngd.next(360)));
            }
        }
    }

    launch()
    {
        let rad = LR180 - g_prngd.next(LR360);
        vec3.copy(this.waypoint, [Math.sin(rad) * 50000, Math.cos(rad) * 50000, lScene.station.launchpoint]);

        for(let ship of this.ships) {
            if(ship.exists) {
                vec3.copy(ship.waypoint, this.waypoint);
                ship.istoaway = true;
                ship.waypsens = 20;
                ship.waystop = false;
                ship.parkobj.launch();
            }
        }
        this.ispark = false;
    }
    mkangry(ship)
    {
        for(let wship of this.ships) {
            wship.mkangry(ship);
        }
    }
    chooseangry(wing)
    {
        this.wingangryat = wing;
        let ret = false;
        for(let wship of this.ships) {
            if(wship.exists) {
                if(wship.chooseangry(wing)) ret = true;
            }
        }
        return ret;
    }
}

class Wing extends WingBase {
    constructor(dotdir)
    {
        super();
        const planet = gPlayer.commander.planet;
        const state = planet.government;
    
        function _awayfro(p)
        {
            if (g_prngd.next(1) <= p - (p * dotdir * 0.5))
                return true;
            else
                return false;
        }
        function _towards(p)
        {
            if (g_prngd.next(1) <=  p + (p * dotdir * 0.5))
                return true;
            else
                return false;
        }
        function _alwaysa(p)
        {
            if (g_prngd.next(1) <=  p)
                return true;
            else
                return false;
        }

        if(lScene.issafe && (!lScene.injump) && _alwaysa(0.2)) {this.addtransport();return;} 

        switch(state) {
        case 0:     // Anarchy
            if(_towards(0.1)) {this.addpirate(); break;}
            if(_awayfro(0.1)) {this.addsmuggler(); break;}
            if(_alwaysa(0.1)) {this.addhunter(); break;}
            // No break
        case 1:     // Fuedal
            if(_towards(0.1)) {this.addpirate(); break;}
            if(_awayfro(0.1)) {this.addsmuggler(); break;}
            if(_alwaysa(0.1)) {this.addhunter(); break;}
            // No break
        case 2:     // Multi Gov
            if(_towards(0.1)) {this.addpirate(); break;}
            if(_towards(0.1)) {this.addsmuggler(); break;}
            if(_alwaysa(0.1)) {this.addhunter(); break;}
            // No break
        case 3:     // Dictatorship
            if(_alwaysa(0.1)) {this.addhunter(); break;}
            if(_towards(0.1)) {this.addpirate(); break;}
            if(_alwaysa(0.1)) {this.addsmuggler(); break;}
            if(_alwaysa(0.1)) {this.addtrader(); break;}
            // No break
        case 4:     // Communist
            if(_alwaysa(0.1)) {this.addhunter(); break;}
            if(_alwaysa(0.1)) {this.addsmuggler(); break;}
            if(_towards(0.1)) {this.addpirate(); break;}
            if(_alwaysa(0.1)) {this.addtrader(); break;}
            // No break
        case 5:     // Confederacy
            if(_alwaysa(0.1)) {this.addhunter(); break;}
            if(_alwaysa(0.1)) {this.addsmuggler(); break;}
            if(_towards(0.1)) {this.addpirate(); break;}
            if(_alwaysa(0.1)) {this.addtrader(); break;}
            // No break
        case 6:     // Democracy
            if(_alwaysa(0.1)) {this.addtrader(); break;}
            if(_alwaysa(0.1)) {this.addhunter(); break;}
            if(_alwaysa(0.1)) {this.addsmuggler(); break;}
            if(_towards(0.1)) {this.addpirate(); break;}
            // No break
        case 7:     // Corporate State
            if(_alwaysa(0.1)) {this.addtrader(); break;}
            if(_alwaysa(0.1)) {this.addhunter(); break;}
            if(_alwaysa(0.1)) {this.addsmuggler(); break;}
            if(_towards(0.1)) {this.addpirate(); break;}
            // No break
        default:
            if(dotdir < 0)
                this.addtrader();
            else
                this.addhunter();
            break;
        }
    }


    addpirate()
    {
        this.wingtype = EPIRATE;
        this.isagressive = true;
        this.wingdir = -1;     // Going away
        // Pirates can be big, lone or pack
        switch(g_prng.next(5)) {
        case 0: // Big
            this.addbig(newbig(EPIRATE), g_prng.next(4));
            break;
        case 1: // Lone
        case 2: // Lone
            this._addship(newpirate());
            this.numships += 1;
            break;
        case 3:
        case 4:
            var nump = g_prng.next(4) + 1;
            for(var i = 0; i < nump; i++) {
                this._addship(newfpirate());
                this.numships += 1;
            }
            break;
        }
    }

    addhunter()
    {
        this.wingtype = EHUNTER;
        this.isagressive = true;
        this.wingdir = 0;     // Any way
        // Hunters are always loners
        this._addship(newship(EHUNTER));
        this.numships += 1;
    }

    addsmuggler()
    {
        // Smugglers same as pirates with some additions
        this.wingtype = ESMUGGLER;
        this.isagressive = true;
        this.wingdir = 1;     // Towards
        switch(g_prng.next(4)) {
        case 0: // Big
            this.addbig(newbig(ESMUGGLER), g_prng.next(4));
            break;
        case 1: // Lone
        case 2: // Lone
        case 3: // Lone
            this._addship(newship(ESMUGGLER));
            this.numships += 1;
            break;
        }
    }

            
    addtrader()
    {
        this.wingdir = 1;     // Towards
        // Smugglers same as pirates with some additions
        this.wingtype = ETRADER;
        switch(g_prng.next(4)) {
        case 0: // Big
            switch (g_prng.next(3)) {
            case 0:
            case 1:
                this.addbig(newvbig(ETRADER), g_prng.next(6));
                break;
            case 2:
                this.addbig(newbig(ETRADER), g_prng.next(4));
                break;
            }
            break;
        case 1: // Lone
        case 2: // Lone
        case 3: // Lone
            this._addship(newship(ETRADER));
            this.numships += 1;
            break;
        }
    }

    addtransport()
    {
        this.wingtype = ETRANSPORT;
        this.wingdir = 0;
        this._addship(newtransport(ETRANSPORT));
    }

    addbig(ship, numescort)
    {
        for(let i = 0; i < numescort; i++) {
            ship.fighters.push(newfighter(ship)); // No need type - uses parent
        }
        this._addship(ship);
        for(let escort of ship.fighters) 
            this._addship(escort);

        return 1 + numescort;
    }

}

class WingThargoid extends WingBase {
    constructor(num)
    {
        super();

        for(var i = 0; i < num; i++) {
            let thargoid = newthargoid();
            thargoid.wing = this;
            this.ships.push(thargoid);
            let numons = g_prng.next(3) + 2;
            for(var j = 0; j < numons; j++) {
                let thargon = newthargon();
                thargon.thargoid = thargoid;
                thargoid.thargons.push(thargon);
                thargon.wing = this;
            }
        }
        this.numships = num;
        this.wingtype = ETHARGOID;
    }

    appear(ispark, x, y, z, q)
    {
        if(this.exists) return;
        this.exists = true;
        this.numalive = this.numships;
        this.appear_flying(x, y, z, q);

        let what = lScene.cockpit;
        
        for(let ship of this.ships) {
            ship.angryat = what;
            ship.isattack = true;
            ship.setunlock();
            ship.unlock();
        }
    }
}
            


class WingPolice extends WingBase {
    constructor(num)
    {
        super();
        this.isagressive = true;
        this.wingdir = 0;     // Any way
        if(num > 0) {
            if(g_prng.next(1 + num) > 0) {
                num = 1 + g_prng.next(num);
            } else {
                num = 0;
            }
        }
        if(lScene.issafe) num += 5 + g_prng.next(3);
        for(let i = 0; i < num; i++) {
            this.numships += 1;
            this._addship(newpolice());
        }
        this.wingtype = EPOLICE;
    }

    appear(ispark, x, y, z, q)
    {
        if(this.exists) return;
        this.exists = true;
        this.numalive = this.numships;
        if(ispark) {
            this.appear_park(x, y, z, q);
        } else {
            this.appear_flying(x, y, z, q);
        }

        // Seelock when it appears

        let what = lScene.cockpit;
        
        if(lScene.issafe) {
            for(let ship of this.ships) {
                ship.isagressive = true;
                ship.isattack = true;
                ship.setunlock();
                ship.unlock();
            }
        } else {
            for(let ship of this.ships) {
                ship.isagressive = true;
                ship.isattack = true;
                ship.setunlock();
                ship.unlock();
            }
        }
    }
    disappear()
    {
        super.disappear();
        lScene.alertstate = false;
    }
}

class WingHermit extends WingBase {
    constructor(num)
    {
        super();
        this.isagressive = true;
        this.wingdir = 0;
        for(let i = 0; i < num; i++) {
            this.numships += 1;
            this._addship(newfighter(EHERMIT));
        }
        this.wingtype = EHERMIT;
    }
    appear(aship, x, y, z)
    {
        if(this.exists) return;
        this.exists = true;
        this.numalive = this.numships;
        if(this.numships == 0) return;

        let velocity = 5.0 + g_prngd.next(10);      // TODO - Preset wing velocity on slowest ship

        // Need a rotational matrix, 
        LTMP_VEC3A[0] = 1 - g_prngd.next(2);
        LTMP_VEC3A[1] = 1 - g_prngd.next(2);
        LTMP_VEC3A[2] = 1 - g_prngd.next(2);
        vec3.normalize(LTMP_VEC3A, LTMP_VEC3A);
        let angle = g_prngd.next(LR180);

        mat4.fromQuat(LTMP_MAT4A, quat.setAxisAngle(LTMP_QUATA, LTMP_VEC3A, angle));

        let anglediff = LR360 / this.numships;
        let wangle = 0;

        LTMP_VEC3A[0] = 0;
        LTMP_VEC3A[1] = 0;
        LTMP_VEC3A[2] = -1;

        for(let ship of this.ships) {
            if(wangle != 0) {
                mat4.rotateY(LTMP_MAT4A, LTMP_MAT4A, wangle);
                mat4.getRotation(LTMP_QUATA, LTMP_MAT4A);
            }
            vec3.transformMat4(LTMP_VEC3B, LTMP_VEC3A, LTMP_MAT4A);
            vec3.scale(LTMP_VEC3B, LTMP_VEC3B, 110);
            ship.appear(LTMP_VEC3B[0] + x, LTMP_VEC3B[1]+ y, LTMP_VEC3B[2] + z, LTMP_QUATA)
            ship.obj.rotate(0, 0, g_prngd.next(LR180));
            ship.velocity = velocity;
            ship.angryat = aship;
            ship.isagressive = true;
            ship.isattack = true;
            ship.isnocrime = true;      // To rebalance, no police

            
            wangle += anglediff;
        }

        this.numalive = this.numships;
        this.numpark = 0;
        this.ispark = false;
    }
}
        
class WingSpecific extends WingBase {
    constructor(ships)
    {
        super();
        this.isagressive = true;
        this.wingdir = 0;
        for(let s of ships) {
            this.numships += 1;
            this._addship(s);
        }
        this.wingtype = EPIRATE;
    }
    appear(aship, x, y, z)
    {
        if(this.exists) return;
        this.exists = true;
        this.numalive = this.numships;
        if(this.numships == 0) return;

        let velocity = 5.0 + g_prngd.next(10);      // TODO - Preset wing velocity on slowest ship

        // Need a rotational matrix, 
        LTMP_VEC3A[0] = 1 - g_prngd.next(2);
        LTMP_VEC3A[1] = 1 - g_prngd.next(2);
        LTMP_VEC3A[2] = 1 - g_prngd.next(2);
        vec3.normalize(LTMP_VEC3A, LTMP_VEC3A);
        let angle = g_prngd.next(LR180);

        mat4.fromQuat(LTMP_MAT4A, quat.setAxisAngle(LTMP_QUATA, LTMP_VEC3A, angle));

        let anglediff = LR360 / this.numships;
        let wangle = 0;

        LTMP_VEC3A[0] = 0;
        LTMP_VEC3A[1] = 0;
        LTMP_VEC3A[2] = -1;

        for(let ship of this.ships) {
            if(wangle != 0) {
                mat4.rotateY(LTMP_MAT4A, LTMP_MAT4A, wangle);
                mat4.getRotation(LTMP_QUATA, LTMP_MAT4A);
            }
            vec3.transformMat4(LTMP_VEC3B, LTMP_VEC3A, LTMP_MAT4A);
            vec3.scale(LTMP_VEC3B, LTMP_VEC3B, 110);
            ship.appear(LTMP_VEC3B[0] + x, LTMP_VEC3B[1]+ y, LTMP_VEC3B[2] + z, LTMP_QUATA)
            ship.obj.rotate(0, 0, g_prngd.next(LR180));
            ship.velocity = velocity;
            ship.angryat = lScene.cockpit;
            ship.isagressive = true;
            ship.isattack = true;
            ship.isnocrime = true;      // To rebalance, no police
            ship.setlock();
            ship.lock();

            wangle += anglediff;
        }

        this.numalive = this.numships;
        this.numpark = 0;
        this.ispark = false;
    }
}

class Pool {
    constructor(num, func)
    {
        this.num = num;
        this.pool = [];
        this.idx = 0;
        for(var i = 0; i < num; i++) {
            var thing = func();
            lScene.things.push(thing);
            this.pool.push(thing);
        }
    }

    next()
    {
        this.idx += 1;
        if(this.idx >= this.num) {
            this.idx = 0;
        }
        return this.pool[this.idx];
    }
}
        
class SpaceScene extends LBase {
    constructor(args)
    {
        super(args);
        this.cockpit = null;
        this.cockobj = null;
        this.numlocks = 0;
        this.scans = [];
    }

    ssetup()
    {
        gPlayer.create();
        lScene.cockpit.addscans();
        lScene.things.unshift(lScene.cockpit);
    }

    setrestart(type, cmode)
    {
        let cockpit = lScene.cockpit;
        gPlayer.integrity = cockpit.integrity;
        gPlayer.shields = cockpit.shields;
        gPlayer.temperature = cockpit.temperature;
        gPlayer.lasercapacity = cockpit.lasercapacity;
        switch(type) {
        case SS_NORMAL:
            this.lRestart = function() {new NormalScene(cmode); }
            this.isgo = false;
            break;
        case SS_JUMP:
            this.lRestart = function() {new JumpScene(cmode); }
            this.isgo = false;
            break;
        case SS_WITCH:
            this.lRestart = function() {new WitchScene(); }
            this.isgo = false;
            break;
        }
    }

    makesystem(redraw)
    {
        let seed = gPlayer.commander.planet.seed;
        EDWorld.make(gPlayer.planetctx, seed);
        EDSun.make(gPlayer.sunctx, seed);
        // EDStars.make(gPlayer.starsctx, seed);
        EDStation.make(g_assets, gPlayer.stasidesctx, seed);

        if(redraw) {
            ShaderPlanet.reloadTexture(structures.planet);
            ShaderSun.reloadTexture(structures.sun);
            // ShaderSun.reloadTexture(structures.stars);
            ShaderSolid.reloadTexture(sidestruct());
        }
    }
}

class LocalScene  extends SpaceScene {
    constructor(cmode)
    {
        super({
            lCFrom: [-20000, -20000, -20000],
            lCTo: [20000, 20000, 20000],
            lCSize: 20.0,
            lCIncrement: 1.0,
            lLNear: 1,
            lLFar: 20000,
            });
        this.chanceforwitch = 20;

        gPlayer.use_keys();
    }
    firelaser(ship, delta)
    {
        if(ship.lasercapacity < 1.0 ) return;
        if(ship.laserlast > 0) return;

        ship.lasercapacity -= 1;
        var laser = this.lasers.next();
        laser.fire(ship);
        ship.laserlast = ship.laserrapid      // How fast rapid fire

        if(ship instanceof CockpitBase) {
            g_ass.pulse.play();
            ship.displasers();
        }
    }

    gencargo(x, y, z)
    {
        var cargo = this.cargos.next();
        if(this.wingtype == ESMUGGLER)
            cargo.what = EDB_T_ILLEGALS[g_prng.next(EDB_T_ILLEGALS_LENGTH)];
        else
            cargo.what = g_prng.next(EDB_TRADE_LENGTH);
        cargo.appear(x, y, z);
    }

    genalloy(x, y, z)
    {
        var alloy = this.alloys.next();
        alloy.appear(x, y, z);
    }
    
}

class JumpScene extends SpaceScene {
    /*
     * Stars are 19000 away.
     * Sun stars off at 1500 MM away
     * Use MM for now
     * Thoght jumping in/out cubes is to nearest 50KM.
     * Jumping "OUT" it is to + 20KM from center of jumvec
     */
    constructor(cmode)
    {
        super({
            lCFrom: [-10000, -10000, -10000],
            lCTo: [10000, 10000, 10000],
            lCSize: 100.0,
            lCIncrement: 1.0,
            lLNear: 1,
            lLFar: 20000,
            });

        this.injump = true;


        if(cmode == S_FROMHYPER)
        {
            this.makesystem(true);

            vec3.scale(gPlayer.jumpvec, gPlayer.commander.planet.lgl_locentry, 10);
            this.velocity = 1.0;
        }

        new Stars(gPlayer.commander.planet.seed);


        var jumpvec = gPlayer.jumpvec;
        for(var i = 0; i < 3; i++) {
            jumpvec[i] = Math.round(jumpvec[i]);
        }
    
        this.jumpvec = vec3.scale(vec3.create(), gPlayer.jumpvec, 0.1);

        this.station = null;

        this.locSun = vec3.create();
    
        this.ambientLight =  vec3.fromValues(0.3, 0.3, 0.3);
    
        gPlayer.use_keys();
    
        this.jstatvec = vec3.fromValues(0, 0, 0);
    
        this.sun = new Sun();
        this.planet = new Planet();

        this.sun.makereal();
        this.planet.makereal();
    
        this.directionalLightColor = [1.0, 1.0, 1.0];
        this.noLightColor = [0.0, 0.0, 0.0];
        this.cabinLightColor = [1.0, 1.0, 0.5];
        new Stars(gPlayer.commander.planet.seed);
    
        this.setspheres();
    
        this.things = [];       // All ships, lasers etc

        this.vstation = new VirtStation();

        this.explosions = new Pool(1, function(){return new Explosion();});

        this.ssetup();
        this.lSetup();

        lScene.cockobj.move(this.jumpvec[0], this.jumpvec[1], this.jumpvec[2]);  // 10 KMS out
        quat.copy(lScene.cockobj.quat, gPlayer.jumpquat);
        lScene.cockobj.move(0, 0, -0.1);  // 10 KMS out
        lScene.cockobj.warp();
        lScene.cockobj.procpos();
        // How fast
        lScene.cockpit.velocity = gPlayer.velocity / 10;
        // Adjust for jump space
        lScene.cockpit.acceleration /= 10;
        lScene.cockpit.maxvelocity /= 10;
        lScene.cockpit.rechargerate *= 10;

        this.stationdir = vec3.fromValues(0, 0, -1);

        // Sort out planet directional light vector


        const statdir = vec3.transformMat4(this.stationdir, this.jstatvec, mat4.invert(LTMP_MAT4B, lScene.cockobj.position));
        vec3.normalize(statdir, statdir);

        this.posslock = 1.1 + (gPlayer.commander.planet.economy  * 0.033)
        this.posslock *= 0.05;

        if(cmode == S_KJUMP) {
            this.inkjump = true;
            lScene.cockpit.switchletter("k");
            lScene.cockpit.switchjdust();
        } else {
            this.inkjump = false;
            lScene.cockpit.switchletter("j");
            lScene.cockpit.switchjdust();
        }
        this.crash = false;
        this.isgo = true;

        this.lMain();
    
    }

    setspheres()
    {
        const sunpos =  vec3.copy(this.locSun, gPlayer.commander.planet.lgl_locsun);
        this.sun.setscene(sunpos[0], sunpos[1], sunpos[2], 1, false);
        this.sun.vobj.setPosition(sunpos[0], sunpos[1], sunpos[2]);
        this.sun.vobj.ignore = false;
        lScene.lCMove(this.sun.vobj);
        const planpos =  vec3.copy(LTMP_VEC3B, gPlayer.commander.planet.lgl_locplanet);
        this.planet.setscene(planpos[0], planpos[1], planpos[2], 1, false);
        this.planet.vobj.setPosition(planpos[0], planpos[1], planpos[2]);
        this.planet.vobj.ignore = false;
        lScene.lCMove(this.planet.vobj);

        const cvpoint = this.planet.cvPoint;
        cvpoint[0] = sunpos[0] - planpos[0];
        cvpoint[1] = sunpos[1] - planpos[1];
        cvpoint[2] = sunpos[2] - planpos[2];

        vec3.normalize(cvpoint, cvpoint);

    }

    lLoop(delta)
    {

        // Input

        if(gPlayer.prockeys()) {
            if(gPlayer.keys.confirm_quit) {
                lScene.isgo = false;
                lScene.lRestart = endall;
                return false;
            }
            return true;
        }

        if(gPlayer.keys.do_unjump) {
            gPlayer.normalspace(S_SPACE);
            return false;
        }

        lScene.cockpit.process(delta);
        lScene.cockpit.ccDir[0] = this.locSun[0] - lScene.cockobj.x;
        lScene.cockpit.ccDir[1] = this.locSun[1] - lScene.cockobj.y;
        lScene.cockpit.ccDir[2] = this.locSun[2] - lScene.cockobj.z;

        vec3.normalize(lScene.cockpit.ccDir, lScene.cockpit.ccDir);

        vec3.transformQuat(lScene.cockpit.cvPoint, lScene.cockpit.ccDir, lCamera.quat);
        vec3.transformQuat(lScene.cockpit.ccDir, lScene.cockpit.ccDir, quat.invert(LTMP_QUATA, lScene.cockobj.quat));

        const statdir = this.stationdir;
        
        vec3.transformMat4(statdir, this.jstatvec, lScene.cockpit.invposition);

        vec3.normalize(statdir, statdir);

        if(statdir[2] > 0) {
            lScene.cockpit.greendot.mkvisible(false);
            lScene.cockpit.reddot.mkvisible(true);
            lScene.cockpit.reddot.moveHere((statdir[0] * 0.038) + 0.35, (statdir[1] * 0.038) - 0.47, -1.5); 
        } else { 
            lScene.cockpit.reddot.mkvisible(false);
            lScene.cockpit.greendot.mkvisible(true);
            lScene.cockpit.greendot.moveHere((statdir[0] * 0.038) + 0.35, (statdir[1] * 0.038) - 0.47, -1.5); 
        }

        this.sun.jprocess(delta);
        this.planet.jprocess(delta);
        this.vstation.jprocess(delta);

        if(g_prngd.next(1)  < delta * this.posslock * lScene.cockpit.velocity) {
            if(this.isgo && (!this.crash)) {
                g_ass.boop.play();
                gPlayer.normalspace(S_LOCK);
            }
        }

        for(var thing of this.things) {
            thing.process(delta);
        }

        let cobj = lScene.cockobj;
        let vobj = this.planet.vobj;

        let plandist = Math.hypot(vobj.x - cobj.x, vobj.y - cobj.y, vobj.z - cobj.z);
        vobj = this.sun.vobj;
        let sundist = Math.hypot(vobj.x - cobj.x, vobj.y - cobj.y, vobj.z - cobj.z);

        if(plandist < 50) {
            lScene.cockpit.altitude(plandist, 17.5, 30);
        } else if(sundist < 100) {
            lScene.cockpit.altitude(sundist, 51, 50);
        } else {
            lScene.cockpit.altitude(2, 1, 1);
        }

        if(gPlayer.keys.do_kjump) {
            if((!this.kjumppressed) && (!this.cockpit.ishyper) && (!this.cockpit.isgalactic)) {
                this.kjumppressed = true;
                if(sundist < 300 || plandist < 300) {
                    if(this.inkjump) {
                        this.inkjump = false;
                        lScene.cockpit.switchletter("j");
                        lScene.cockpit.switchjdust();
                    }
                    gPlayer.domessage("Planet or sun to close for K-JUMP");
                } else {
                    if(!this.inkjump) {
                        this.inkjump = true;
                        lScene.cockpit.switchletter("k");
                        lScene.cockpit.switchjdust();
                    }
                }
            }
        }
        else if(gPlayer.keys.do_jump) {
            if((!this.kjumppressed) && (!this.cockpit.ishyper) && (!this.cockpit.isgalactic)) {
                this.kjumppressed = true;
                if(this.inkjump) {
                    this.inkjump = false;
                    lScene.cockpit.switchletter("j");
                    lScene.cockpit.switchjdust();
                }
            }
        } else {
            if(this.kjumppressed) {
                this.kjumppressed = false;
            }
        }

        if(this.inkjump) {
            function _move(sphere, dist)
            {
                let sobj = sphere.obj;
                let wdist = delta * lScene.cockpit.velocity * 9;
                if(dist - wdist < 300) {
                    wdist = dist - 300;
                    if(wdist <= 0) {
                        gPlayer.domessage("Arrived at a planet or sun");
                        lScene.kjumppressed = true;
                        if(lScene.inkjump) {
                            lScene.inkjump = false;
                            lScene.cockpit.switchletter("j");
                            lScene.cockpit.switchjdust();
                        }
                    }
                }
                lScene.cockpit.obj.move(0, 0, -wdist);
            }
            if(sundist < plandist) {
                _move(this.sun, sundist);
            } else {
                _move(this.planet, plandist);
            }
        }

        this.cockpit.heatdiff(sundist);
        lScene.cockpit.heatcool(delta, sundist);
        lScene.cockobj.procpos();
        lCamera.setTo(lScene.cockpit.eyes);

        return this.isgo;
    }
    setscan(thing)
    {
        let svec = vec3.transformMat4(LTMP_VEC3A, thing.vobj.getVec(LTMP_VEC3B), this.cockpit.invposition);
        thing.scan.jumpMoveHere(svec[0], svec[1], svec[2]);
        thing.dotdir = svec[2];
    }
}

class WitchScene extends LocalScene {
    constructor()
    {
        super();

        this.station = null;
        this.ministation = null;
    
        this.ambientLight =  vec3.fromValues(0.3, 0.3, 0.3);
    
    
        this.jstatvec = vec3.fromValues(0, 0, 0);
    
        // Create player and do things
        // Coming out - Not center of section
    
        // The jumpvec size is every 200 KM (0.2 MM)
    
    
    
        // If within 100 KM (0.1 MM) of station, we are home
        
    
        this.wingthargoid = new WingThargoid(2 + g_prng.next(4));
    
        this.things = [];       // All ships, lasers etc
        this.npcs = [];       // NPCs 
    
        this.asteroid = null;

        vec3.set(gPlayer.jumpvec, 0, 0, 0);
    
        this.isnearhome = false;
        this.isathome = false;

        var jumpdir = vec3.transformQuat(gPlayer.jumpdir, vec3.set(LTMP_VEC3A, 0, 0, -1), gPlayer.jumpquat);
        
        this.explosions = new Pool(3, function(){return new Explosion();});
        this.lasers = new Pool(50, function(){return new Laser();});
        this.cargos = new Pool(15, function(){return newcargo();});
        this.alloys = new Pool(15, function(){return newalloy();});
        this.missiles = new Pool(5, function(){return newmissile();});
        this.escapes = new Pool(3, function() {return newescape();});
    
        this.directionalLightColor = [1.0, 1.0, 1.0];
        this.noLightColor = [0.0, 0.0, 0.0];
        this.cabinLightColor = [1.0, 1.0, 0.5];
        new Stars(g_prng.next(100000) + 1000);


        for(let thargoid of this.wingthargoid.ships) {
            this.things.push(thargoid);
            this.npcs.push(thargoid);
            for (let thargon of thargoid.thargons) {
                this.things.push(thargon);
                this.npcs.push(thargon);
            }
        }

    
        // lScene.cockpit.setup();
        this.ssetup();
    
        lScene.cockpit.velocity = gPlayer.velocity;

        this.lSetup();

        quat.copy(lScene.cockobj.quat, gPlayer.jumpquat);     // Arrive at center

        lScene.cockpit.switchletter("w");
        lScene.cockobj.procpos();


        LTMP_VEC3A[0] = 1 - g_prngd.next(2);
        LTMP_VEC3A[1] = 1 - g_prngd.next(2);
        LTMP_VEC3A[2] = 1 - g_prngd.next(2);
        vec3.scale(LTMP_VEC3A, vec3.normalize(LTMP_VEC3A, LTMP_VEC3A), g_prngd.next(450) + 500);
        this.wingthargoid.appear(false, LTMP_VEC3A[0], LTMP_VEC3A[1], LTMP_VEC3A[2], quat.fromEuler(LTMP_QUATA, g_prngd.next(360), g_prngd.next(360), g_prngd.next(360)));
        this.wingthargoid.mkangry(lScene.cockpit);
        this.witchlock = true;

        this.isgo = true;

        this.lMain();

    }
    lLoop(delta)
    {


        // Input
        if(gPlayer.prockeys()) {
            if(gPlayer.keys.confirm_quit) {
                lScene.isgo = false;
                lScene.lRestart = endall;
                return false;
            }
            return true;
        }


        if(gPlayer.keys.do_jump || gPlayer.keys.do_kjump ) {
            gPlayer.domessage("Cannot jump in witchspace");
        }

        if(this.witchlock) {
            if(g_prngd.next(120) < delta) {
                this.witchlock = false;
                lScene.cockpit.switchletter("n");
            } else if(this.wingthargoid.numalive <= 0) {
                this.witchlock = false;
                lScene.cockpit.switchletter("n");
            }
        }

        // First - of all - unthink
        for(let npc of this.npcs) {
            if(npc.exists) {
                npc.thought = false;
            }
        }

        // Move things about
        for(let thing of this.things) {
            thing.process(delta);
        }

        // Where to look

        lScene.cockobj.procpos();
        lCamera.setTo(lScene.cockpit.eyes);

        return this.isgo;
    }
    setscan(ship)
    {
        let svec = vec3.transformMat4(LTMP_VEC3A, ship.obj.getVec(LTMP_VEC3B), this.cockpit.invposition);
        ship.scan.normalMoveHere(svec[0], svec[1], svec[2]);
        if (this.cockpit.istarget) {
            if (ship instanceof PersonBase) {
                this.cockpit.seetarget(ship, svec[0], svec[1], svec[2]);
            }
        }
    }
    callpolice(ship) { }
}


class NormalScene extends LocalScene {
    constructor(cmode)
    {
        super();

        this.hasasteroid = false;

        this.cmode = cmode;
        this.injump = false;
        this.nearsphere = false;
        this.nearplanet = false;
        this.nearsun = false;

        this.alertstate = false;

        let cmdr = gPlayer.commander;

        if(cmode == S_FROMHYPER)
        {
            this.makesystem(true);
            vec3.scale(gPlayer.jumpvec, cmdr.planet.lgl_locentry, 10);
            // Debug  for sun
            // vec3.scale(gPlayer.jumpvec, cmdr.planet.lgl_locsun, 10);
            // gPlayer.jumpvec[2] += 2000;
            this.velocity = 1.0;
        }
        if(cmode == S_DOCK)
            this.makesystem(false);

        this.station = null;
        this.ministation = null;
    
        this.ambientLight =  vec3.fromValues(0.3, 0.3, 0.3);
    
    
        if(cmode == S_HOME || cmode == S_DOCK)
            this.issafe = true;
        else
            this.issafe = false;
    
        this.jstatvec = vec3.fromValues(0, 0, 0);
    
        // Create player and do things
        // Coming out - Not center of section
    
        // The jumpvec size is every 200 KM (0.2 MM)
    
        // If within 100 KM (0.1 MM) of station, we are home
    
        this.wings = [];        // Wings
        this.policewing;       // Vipers different to wings
    
        this.things = [];       // All ships, lasers etc
        this.npcs = [];       // NPCs 
    
        this.asteroid = null;
        
        // Normalise the thing to nearest 1
        var jumpvec = gPlayer.jumpvec;
        for(var i = 0; i < 3; i++) {
            jumpvec[i] = Math.round(jumpvec[i]);
        }
    

        let stas = newstations(cmdr);

        this.ministation = stas.mini;
        this.things.push(stas.mini);

        this.stationdir = vec3.fromValues(0, 0, -1);
        this.station = stas.main;

        this.station.description = cmdr.planet.capitalise_name(cmdr.planet.name) + " Station";


        this.things.push(stas.main);
        this.isnearhome = false;
        this.isathome = false;

        var jumpdir = vec3.transformQuat(gPlayer.jumpdir, vec3.set(LTMP_VEC3A, 0, 0, -1), gPlayer.jumpquat);
        
        if(cmode == S_DOCK)
            var dotdir = 0;
        else {
            var dotdir = vec3.normalize(LTMP_VEC3A, vec3.transformQuat(LTMP_VEC3A, gPlayer.jumpvec, quat.invert(LTMP_QUATA, gPlayer.jumpquat)))[2];
        }

        this.explosions = new Pool(3, function(){return new Explosion();});
        this.lasers = new Pool(50, function(){return new Laser();});
        this.cargos = new Pool(15, function(){return newcargo();});
        this.alloys = new Pool(15, function(){return newalloy();});
        this.missiles = new Pool(5, function(){return newmissile();});
        this.escapes = new Pool(3, function() {return newescape();});
    
        this.planet = new Planet();
        this.sun = new Sun();
        this.directionalLightColor = [1.0, 1.0, 1.0];
        this.noLightColor = [0.0, 0.0, 0.0];
        this.cabinLightColor = [1.0, 1.0, 0.5];
        new Stars(cmdr.planet.seed);
    
        this.planet.obj.ignore = true;
        this.sun.obj.ignore = true;
        this.ministation.obj.ignore = true;

        let miss = 0;
        if (gPlayer.missobj) miss = gPlayer.missobj.normal_init(gPlayer, lScene, g_prng);

        switch(miss) {
        case 1:
            this.shipmission1(dotdir);
            break;
        default:
            this.shipcreate(dotdir);
            break;
        }

        // lScene.cockpit.setup();
        this.ssetup();
        this.setspheres();
    
        lScene.cockpit.velocity = gPlayer.velocity;

        this.lSetup();

        if(cmode == S_SPACE) {
            if(gPlayer.jumpvec[0] == 0 && gPlayer.jumpvec[1] == 0 && gPlayer.jumpvec[2] == 0)
                cmode = S_HOME;
            else {
                quat.copy(lScene.cockobj.quat, gPlayer.jumpquat);     // Arrive at center
                this.issafe = false;
            }
        }

        if(cmode == S_HOME)
        {
            lScene.cockpit.switchletter("s");
            vec3.scale(LTMP_VEC3A, gPlayer.homerel, 2000);
            lScene.cockobj.move(LTMP_VEC3A[0], LTMP_VEC3A[1], LTMP_VEC3A[2]);

            quat.copy(lScene.cockobj.quat, gPlayer.jumpquat);
            lScene.cockobj.warp();
            lScene.cockpit.velocity = gPlayer.velocity;
            this.issafe = true
        }
        else if(cmode == S_DOCK) {
            lScene.cockpit.switchletter("s");
            lScene.cockpit.parkobj.park();
            this.issafe = true;
            if(gPlayer.missobj) {
                if(gPlayer.missobj.op_mission(lScene)) {
                    gPlayer.inmission = true;
                    gPlayer.dispmission();
                }
            }
        }
        else if(cmode == S_LOCK) {
            lScene.cockpit.switchletter("n");
            quat.copy(lScene.cockobj.quat, gPlayer.jumpquat);     // Arrive at center
            this.issafe = false
            if(!this.hasasteroid) {
                let wing = this.wings[g_prng.next(this.wings.length)];             // Find a wing
                LTMP_VEC3A[0] = 1 - g_prngd.next(2);
                LTMP_VEC3A[1] = 1 - g_prngd.next(2);
                LTMP_VEC3A[2] = 1 - g_prngd.next(2);
                vec3.scale(LTMP_VEC3A, vec3.normalize(LTMP_VEC3A, LTMP_VEC3A), g_prngd.next(450) + 500);
                wing.appear(false, LTMP_VEC3A[0], LTMP_VEC3A[1], LTMP_VEC3A[2], quat.fromEuler(LTMP_QUATA, g_prngd.next(360), g_prngd.next(360), g_prngd.next(360)));
            }
        } else if(cmode == S_CRASH) {
            lScene.cockpit.switchletter("n");
            quat.copy(lScene.cockobj.quat, gPlayer.jumpquat);     // Arrive at center
            this.issafe = false
        } else {
            lScene.cockpit.switchletter("n");
        }

        for (let ship of this.policewing.ships) {
            this.things.push(ship);
            this.npcs.push(ship);
        }

        // If docked, park these at center
        // if(this.issafe) {
            // this.policewing.appear(true, 0, 0, 0, 0);
        // }
            
        lScene.cockobj.procpos();
        this.isgo = true;

        this.policecalled = false;
        this.policedelay = 0;
        this.policewanted = null;

        // This should work here
        // if(cmode == S_CRASH) this.cockpit.explode();

        this.lMain();
    }

    shipcreate(dotdir)
    {
        let cmdr = gPlayer.commander;
        for(var i = 0; i < 20; i++) {
            let wing = new Wing(dotdir);
            for(let ship of wing.ships) {
                this.things.push(ship);
                this.npcs.push(ship);
            }
            this.wings.push(wing);
        }
    
        for(var i = 0; i < 6; i++) {
            var ship = newpolice();
            this.things.push(ship);
            this.npcs.push(ship);
        }
    
        /*
        Following not quite accurate, it does not
        allow for non-jump wanderring into save zone (or out of)
        This will not happen very much though I think
        */
        this.policewing = new WingPolice(cmdr.planet.lgl_police());

        // TODO - THIS
        // if (gPlayer.missobj) gPlayer.missobj.normal_init(lScene, g_prng);

        // Need to do asteroid here as addscans/setspheres dependancy
        if(this.cmode == S_LOCK) {
            if(g_prngd.next(10 - cmdr.planet.economy) < 1) {
                this.hasasteroid = true;
                if(g_prngd.next(cmdr.planet.economy + 2) < 1) {
                    this.winghermit = new WingHermit(g_prng.next(4) + 2);
                    this.asteroid = newhermit();
                    this.asteroid.ishermit = true;
                    for (ship of this.winghermit.ships) {
                        this.things.push(ship);
                        this.npcs.push(ship);
                        ship.isinnocent = true;
                    }
                } else {
                    this.asteroid = newasteroid();
                }
                lScene.things.push(this.asteroid);
                LTMP_VEC3A[0] = 1 - g_prngd.next(2);
                LTMP_VEC3A[1] = 1 - g_prngd.next(2);
                LTMP_VEC3A[2] = 1 - g_prngd.next(2);
                vec3.scale(LTMP_VEC3A, vec3.normalize(LTMP_VEC3A, LTMP_VEC3A), g_prngd.next(450) + 500);
                this.asteroid.appear(LTMP_VEC3A[0], LTMP_VEC3A[1], LTMP_VEC3A[2],
                    quat.fromEuler(LTMP_QUATA, g_prngd.next(360), g_prngd.next(360), g_prngd.next(360)));

                this.boulders = new Pool(5, function(){return newboulder();});
                this.rocks = new Pool(15, function(){return newrock();});
            }
        }
    }


    /*
     * Put the creation mission1 ship here
     * No police or anything else.  1 on 1 !
     */
    shipmission1(dotdir)
    {
        let wing = new WingSpecific([newmission1()])
        this.wingtype = EPIRATE;
        this.isagressive = true;
        for(let ship of wing.ships) {
            this.things.push(ship);
            this.npcs.push(ship);
        }
        this.wings.push(
            wing
        );
        this.policewing = new WingPolice(0);
    
    }

    callpolice(ship)
    {
        if(!this.policecalled) {
            this.policecalled = true;
            this.policedelay = 30 - (g_prngd.next(gPlayer.commander.planet.lgl_police() + 2) * 3);
            this.policewanted = ship.wing;
        } else if(!this.policewanted) {
            this.policewanted = ship.wing;
            this.policewing.chooseangry(ship.wing);
        }
    }

    setspheres()
    {

        let sunrel =  vec3.subtract(LTMP_VEC3A, vec3.scale(LTMP_VEC3B, gPlayer.commander.planet.lgl_locsun, 10),  gPlayer.jumpvec);
        let sunpos = vec3.normalize(this.lDirectionalVector, sunrel);
        let sundist = vec3.length(sunrel);
        this.sun.setscene(5800 * sunpos[0], 5800 * sunpos[1], 5800 * sunpos[2], 58000  / sundist, true);

        let planrel =  vec3.subtract(LTMP_VEC3A, vec3.scale(LTMP_VEC3B, gPlayer.commander.planet.lgl_locplanet, 10), gPlayer.jumpvec);
        let plandist = vec3.length(planrel);
        let planpos = vec3.normalize(LTMP_VEC3B, planrel)
        this.planet.setscene(5600 * planpos[0], 5600 * planpos[1], 5600 * planpos[2], 56000  / plandist, true);

        let jumpvec = gPlayer.jumpvec;
        let statdist = vec3.length(gPlayer.jumpvec);    
        // In 50 KM - or 0.005 MM, or divide by 200 to get MM
        // Ministation in 100M  - make it to mm * 10000

        if(statdist == 0) {
            this.isathome = true;
            this.isnearhome = false;
            this.ministation.obj.mkvisible(false);
            this.station.appear();
            this.jstatvec[0] = 0;
            this.jstatvec[1] = 0;
            this.jstatvec[2] = 0;
            if(!this.policewing.exists)
                this.policewing.appear(true, 0, 0, 0, 0);
        } else if(statdist <= 10) {
            vec3.scale(this.jstatvec, jumpvec, -10000);  // This is where it is
            this.isnearhome = true;
            this.isathome = false;
            this.station.disappear();
            this.ministation.obj.mkvisible(true);
        } else {
            vec3.scale(this.jstatvec, jumpvec, 1 / statdist);   // Long way away, direction vector
            this.isnearhome = false;
            this.isathome = false;
            this.station.disappear();
            this.ministation.obj.mkvisible(false);
        }

        plandist /= 10;
        sundist /= 10;

        if(plandist < 50) {
            lScene.cockpit.altitude(plandist, 17.5, 30);
        } else if(sundist < 100) {
            lScene.cockpit.altitude(sundist, 51, 50);
        } else {
            lScene.cockpit.altitude(2, 1, 1);
        }

        this.sundist = sundist;
        this.plandist = plandist;
        this.cockpit.heatdiff(sundist);
    }

    setspherestation()
    {
        let a = this.jstatvec;
        let b = lScene.cockobj;

        LTMP_VEC3A[0] = a[0] - b.x;
        LTMP_VEC3A[1] = a[1] - b.y;
        LTMP_VEC3A[2] = a[2] - b.z;

        let dist = vec3.length(LTMP_VEC3A);

        vec3.normalize(LTMP_VEC3B, LTMP_VEC3A);
        vec3.scale(LTMP_VEC3C, LTMP_VEC3B, 5400);
    
        this.ministation.obj.moveHere(LTMP_VEC3C[0], LTMP_VEC3C[1], LTMP_VEC3C[2]);

        // Distance is in local units (10 M) - 
        this.ministation.scale = 54000 / dist;
    }

    lLoop(delta)
    {
        // Input
        if(gPlayer.prockeys()) {
            if(gPlayer.keys.confirm_quit) {
                lScene.isgo = false;
                lScene.lRestart = endall;
                return false;
            }
            return true;
        }

        if(lScene.issafe) {
            if(lScene.cockpit.isterrorist) {
                if(!this.alertstate) {
                    this.alertstate = true;
                    if(this.policewing.ispark && this.policewing.exists) {
                        this.policewing.launch();
                        for(let ship of this.policewing.ships) {
                            ship.mkangry(lScene.cockpit);
                            ship.setlock();
                            ship.lock();
                            // ship.scan.mkvisible(false);
                        }
                    } else {
                        this.policeappear(this.cockpit.wing);
                    }
                }
            }
        } else {
            if(this.policecalled) {
                if(this.policedelay > 0) {
                    this.policedelay -= delta;
                    if(this.policedelay <= 0) {
                        this.policedelay = 0;
                        this.policeappear(this.policewanted);
                    }
                }
            }
        }

        this.movesect(lScene.cockobj);

        if(gPlayer.keys.do_jump || gPlayer.keys.do_kjump ) {
            if(this.isauto) {
                g_ass.boop.play();
                gPlayer.domessage("Auto docking, cannot jump");
            }
            if(this.cockpit.ishyper) {
                g_ass.boop.play();
                gPlayer.domessage("Hyperspace charging, cannot jump");
            }
            else if(this.ispark) {
                g_ass.boop.play();
                gPlayer.domessage("Leave station before trying to jump");
            }
            else if(lScene.numlocks > 0) {
                g_ass.boop.play();
                gPlayer.domessage("Cannot jump, mass locked");
            } else if ((!(lScene.cockpit.ispark)) && (!(lScene.cockpit.isauto))) {
                if(gPlayer.keys.do_kjump) {
                    if(this.sundist < 300 || this.plandist < 300) {
                        this.cockpit.domessage("Too close to a planet or sun for K-JUMP");
                        g_ass.boop.play();
                    } else {
                        g_ass.beep.play();
                        gPlayer.jumpspace(S_KJUMP);
                        this.isgo = false;
                        return false;
                    }
                } else {
                    g_ass.beep.play();
                    gPlayer.jumpspace(S_JUMP);
                    this.isgo = false;
                    return false;
                }
            }
        }

        // First - of all - unthink
        for(let npc of this.npcs) {
            if(npc.exists) {
                npc.thought = false;
            }
        }

        // Move things about
        for(var wing of this.wings) {
            wing.process(delta);
        }

        for(var thing of this.things) {
            thing.process(delta);
        }

        // Where to look

        const statdir = this.stationdir;

        if(this.isnearhome) {
            this.setspherestation();
            mat4.getTranslation(this.stationdir,
                mat4.multiply(LTMP_MAT4A,
                        mat4.invert(LTMP_MAT4B, lScene.cockobj.position),
                        mat4.fromTranslation(LTMP_MAT4C, this.jstatvec)))     // How "other" looks from "me"
            vec3.normalize(this.stationdir, this.stationdir);
        } else if(this.isathome) {
            mat4.getTranslation(this.stationdir,
                mat4.multiply(LTMP_MAT4A,
                        mat4.invert(LTMP_MAT4B, lScene.cockobj.position),
                        mat4.fromTranslation(LTMP_MAT4C, this.jstatvec)))     // How "other" looks from "me"
            vec3.normalize(this.stationdir, this.stationdir);
        } else {
            vec3.transformQuat(statdir, this.jstatvec, quat.invert(LTMP_QUATA, lScene.cockobj.quat));
            statdir[0] = 0 - statdir[0];
            statdir[1] = 0 - statdir[1];
            statdir[2] = 0 - statdir[2];
        }

        if(statdir[2] > 0) {
            if(lScene.cockpit.greendot.isvisible) lScene.cockpit.greendot.mkvisible(false);
            if(!(lScene.cockpit.reddot.isvisible)) lScene.cockpit.reddot.mkvisible(true);
            lScene.cockpit.reddot.moveHere((statdir[0] * 0.038) + 0.35, (statdir[1] * 0.038) - 0.47, -1.5); 
        } else { 
            if(lScene.cockpit.reddot.isvisible) lScene.cockpit.reddot.mkvisible(false);
            if(!(lScene.cockpit.greendot.isvisible)) lScene.cockpit.greendot.mkvisible(true);
            lScene.cockpit.greendot.moveHere((statdir[0] * 0.038) + 0.35, (statdir[1] * 0.038) - 0.47, -1.5); 
        }

        lScene.cockpit.heatcool(delta, this.sundist);
        lScene.cockobj.procpos();
        lCamera.setTo(lScene.cockpit.eyes);

        return this.isgo;
    }

    policeappear(wanted)
    {
        vec3.scale(LTMP_VEC3A, vec3.normalize(LTMP_VEC3A, LTMP_VEC3A), g_prngd.next(450) + 500);
        this.policewing.appear(false,
                    LTMP_VEC3A[0], LTMP_VEC3A[1], LTMP_VEC3A[2],
                    quat.fromEuler(LTMP_QUATA, g_prngd.next(360), g_prngd.next(360), g_prngd.next(360)));
        if(wanted) {
            this.policewing.chooseangry(wanted);
        }
    }

    movesect(obj)
    {
        if(Math.abs(obj.x) > 6000 || Math.abs(obj.y) > 6000 || Math.abs(obj.z) > 6000) {
            if(obj.x > 6000) {
                this.domovesect(1, 0, 0, -10000, 0, 0);
            }
            if(obj.x < -6000) {
                this.domovesect(-1, 0, 0, 10000, 0, 0);
            }
            if(obj.y > 6000) {
                this.domovesect(0, 1, 0, 0, -10000, 0);
            }
            if(obj.y < -6000) {
                this.domovesect(0, -1, 0, 0, 10000, 0);
            }
            if(obj.z > 6000) {
                this.domovesect(0, 0, 1, 0, 0, -10000);
            }
            if(obj.z < -6000) {
                this.domovesect(0, 0, -1, 0, 0, 10000);
            }
        }
    }

    doecmfield()
    {
        g_ass.ecm.play();
        for(let missile of this.missiles.pool) {
            if(missile.exists) {
                missile.target.missmess(false);
                missile.explode();
            }
        }
        this.cockpit.domessage("ECM Field detected");
    }

    domovesect(jx, jy, jz, sx, sy, sz)
    {
        
        const jumpvec = gPlayer.jumpvec;
        jumpvec[0] = Math.round(jx + jumpvec[0]);
        jumpvec[1] = Math.round(jy + jumpvec[1]);
        jumpvec[2] = Math.round(jz + jumpvec[2]);

        if(jumpvec[0] == 0 && jumpvec[1] == 0 && jumpvec[2] == 0) {
            this.issafe = true;
            this.cockpit.switchletter("s");
        } else {
            this.issafe = false;
            if(this.numlocks > 0)
                this.cockpit.switchletter("l");
            else
                this.cockpit.switchletter("n");
        }

        for(var thing of this.things) {
            if(!(thing instanceof SphereBase)) {
                thing.obj.x += sx;
                thing.obj.y += sy;
                thing.obj.z += sz;
                thing.obj.warp();
            }
        }
        this.setspheres();

        // TODO - Reset wings and police and station perhaps
    }

    firelaser(ship, delta)
    {
        if(ship.lasercapacity < 1.0 ) return;
        if(ship.laserlast > 0) return;

        ship.lasercapacity -= 1;
        var laser = this.lasers.next();
        laser.fire(ship);
        ship.laserlast = ship.laserrapid      // How fast rapid fire

        if(ship instanceof CockpitBase) {
            g_ass.pulse.play();
            ship.displasers();
        }
    }

    gencargo(x, y, z)
    {
        var cargo = this.cargos.next();
        if(this.wingtype == ESMUGGLER)
            cargo.what = EDB_T_ILLEGALS[g_prng.next(EDB_T_ILLEGALS_LENGTH)];
        else
            cargo.what = g_prng.next(EDB_TRADE_LENGTH);
        cargo.appear(x, y, z);
    }

    genalloy(x, y, z)
    {
        var alloy = this.alloys.next();
        alloy.appear(x, y, z);
    }
    

    genalloy(x, y, z)
    {
        var alloy = this.alloys.next();
        alloy.appear(x, y, z);
    }

    genwing(state)
    {
        // Generate a wing
        var gov = state.government;

        var totships = 30 + g_prng.next(30);

        while(totships > 0) {

    
            switch(g_prng.next(5)) {
            case 0:
                ships.push(new Adder());
                break;
            }
        }
    }

    setscan(ship)
    {
        let svec = vec3.transformMat4(LTMP_VEC3A, ship.obj.getVec(LTMP_VEC3B), this.cockpit.invposition);
        ship.scan.normalMoveHere(svec[0], svec[1], svec[2]);
        if (this.cockpit.istarget) {
            if (ship instanceof PersonBase) {
                this.cockpit.seetarget(ship, svec[0], svec[1], svec[2]);
            }
        }
    }
}

// Some globals to make life easier


const g_assets = new LAssets({
    ad1: BASEDIR + "ad1.jpg",
    ad2: BASEDIR + "ad2.jpg",
    ad3: BASEDIR + "ad3.jpg",
    ad4: BASEDIR + "ad4.jpg",
    ad5: BASEDIR + "ad5.jpg",
    ad6: BASEDIR + "ad6.jpg",
    ad7: BASEDIR + "ad7.jpg",
    ad8: BASEDIR + "ad8.jpg",
    lets: BASEDIR + "lets.gif",
    letn: BASEDIR + "letn.gif",
    letl: BASEDIR + "letl.gif",
    letj: BASEDIR + "letj.gif",
    leth: BASEDIR + "leth.gif",
    letk: BASEDIR + "letk.gif",
    letw: BASEDIR + "letw.gif",
    labels: BASEDIR + "labels.gif",
    pulse: {url: BASEDIR + "sounds/pulse.wav", number: 5},
    injured: {url: BASEDIR + "sounds/injured.wav", number: 5},
    beep: {url: BASEDIR + "sounds/beep.wav", number: 1},
    boop: {url: BASEDIR + "sounds/boop.wav", number: 1},
    engage: {url: BASEDIR + "sounds/engage.wav", loop: true},
    missile: {url: BASEDIR + "sounds/injured.wav", number: 4},
    ecm: {url: BASEDIR + "sounds/ecm.wav", number: 2},
    explode: {url: BASEDIR + "sounds/explode.wav", number: 3},
    pickup: {url: BASEDIR + "sounds/pickup.wav", number: 1},
    clunk: {url: BASEDIR + "sounds/clunk.wav", number: 1},
    launch: {url: BASEDIR + "sounds/launch.wav", number: 1},
    danube: {url: BASEDIR + "sounds/danube.mp3", loop: true},
    alarm: {url: BASEDIR + "sounds/alarm.wav", loop: true},
    hyper: {url: BASEDIR + "sounds/hyper.wav", number: 1},
});

window.g_ass = g_assets.assets;


const sounds = { };

export function g_loadassets()
{
    dispsaves();
    function onend()
    {
        document.getElementById("playbutton").disabled=false;
        document.getElementById("onloading").innerText = "All assets Loaded";

    }

    function inprogress()
    {
        document.getElementById("onloading").innerText = g_assets.succeeded.toString() + " out of " + g_assets.total.toString() + " assets Loaded";
    }
    g_assets.download({onend:onend, inprogress:inprogress});
}

export function playgame()
{
    document.getElementById("mform").style.display = "none";
    document.getElementById("mgame").style.display = "block";
    document.getElementById("body").style.overflow = "hidden";
    lInit();

    // structures.shuttle = shuttleDef();
    // structures.transporter = transporterDef();
    base_structures(g_assets);
    eship_structures();
    structures.sun = sunDef();
    structures.planet = planetDef();
    structures.stars = starsDef();

    gPlayer = new Player();
    let cmdr = gPlayer.commander;


    // new EDWorld(gPlayer.planetctx, gPlayer.commander.planet.seed);

    function _dogame()
    {
        switch(gPlayer.where) {
        case 0:
        case 1:
            var plan = cmdr.planet;
            if(!plan) alert("Cannot find planet!");
            new NormalScene(S_DOCK);
            break;
        }
    }

    _dogame();
    gPlayer.domessage("Press = for key help");
}

function dispsaves()
{
    let cmdr = new ECommander();

    if (!cmdr.load(0)) {
        cmdr.reset();
        cmdr.save(0);
    }

    display_keyboard(cmdr.keyboard_layout);
    function _line(fid, ele)
    {
        let tde = document.getElementById(fid);
        tde.innerHTML = "";
        tde.appendChild(ele);
    }
    _line("dis_commander",
        lElement("span", {}, "", [
            lElement("span", {}, cmdr.name),
            lElement("span", {}, " "),
            lElement("button", {onclick: "return dispname()"}, "Change")
        ]));
    _line("dis_galaxy", lElement("span", {}, (cmdr.galaxy_number + 1).toString()));
    _line("dis_planet", lElement("span", {}, cmdr.planet.capitalise_name(cmdr.planet.name)));
    _line("dis_rank", lElement("span", {}, cmdr.disprank()));
    _line("dis_credits", lElement("span", {}, cmdr.dispcredits()));
    let rows = [
        lElement("tr", {}, "", [
            lElement("td", {}, ""),
            lElement("td", {}, "Commander"),
            lElement("td", {}, "Galaxy Number"),
            lElement("td", {}, "Planet Name"),
            lElement("td", {}, "Credits"),
            lElement("td", {}, "Rank"),
            lElement("td", {colspan:4}, "Operations"),
        ])];
    for(let i = 1; i < 8; i++) {
        if (!cmdr.load(i)) {
            cmdr.reset();
            cmdr.save(i);
        }
        rows.push(lElement("tr", {}, "", [
            lElement("td", {}, "Save # " + i.toString() + ":"),
            lElement("td", {}, cmdr.name),
            lElement("td", {style: "text-align:center;"}, (cmdr.galaxy_number + 1).toString()),
            lElement("td", {}, cmdr.planet.capitalise_name(cmdr.planet.name)),
            lElement("td", {style: "text-align:right;"}, cmdr.dispcredits()),
            lElement("td", {}, cmdr.disprank()),
            lElement("td", {}, "", [
                lElement("button", {onclick: "return dispuse(" + i.toString() + ")"}, "Use This")
            ]),
            lElement("td", {}, "", [
                lElement("button", {onclick: "return dispover(" + i.toString() + ")"}, "Overwrite"),
            ]),
            lElement("td", {}, "", [
                lElement("button", {onclick: "return dispclear(" + i.toString() + ")"}, "Clear")
            ]),
            lElement("td", {}, "", [
                lElement("button", {onclick: "return dispimex(" + i.toString() + ")"}, "Export/Import")
            ])
        ]));
    }

    document.getElementById("dispsaves").innerHTML = "";
    document.getElementById("dispsaves").appendChild(
        lElement("table", {}, "", rows));
}

function dispclear(num)
{
    var cmdr = new ECommander();
    cmdr.save(num);
    dispsaves();
}
function dispimex(num)
{
    var cmdr = new ECommander();
    cmdr.impexp(num);
    dispsaves();
}
function dispuse(num)
{
    var cmdr = new ECommander();
    if(cmdr.load(num)) {
        cmdr.save(0);
        dispsaves();
    } else {
        alert("Error loading commander");
    }
}
function dispover(num)
{
    var cmdr = new ECommander();
    if(cmdr.load(0)) {
        cmdr.save(num);
        dispsaves();
    } else {
        alert("Error loading current commander");
    }
}

function dispname()
{
    var cmdr = new ECommander();
    cmdr.load(0);
    let name = cmdr.name;
    name = prompt("Enter new name", name);
    if(name == null) return;
    name = name.replace(/[^\w\s]/g, "_");
    cmdr.name = name;
    cmdr.save(0);
    dispsaves();
}

function endall()
{
    let dpar = document.getElementById("dkeyboard_layout");
    let tkey = document.getElementById("tkeyboard_layout");
    dpar.appendChild(tkey.parentElement.removeChild(tkey));
    dispsaves();
    document.getElementById("mform").style.display = "block";
    document.getElementById("mgame").style.display = "none";
    document.getElementById("body").style.overflow = "scroll";
}


window.playgame = playgame;
window.g_loadassets = g_loadassets;
window.dispsaves = dispsaves;
window.dispuse = dispuse;
window.dispover = dispover;
window.dispclear = dispclear;
window.dispname = dispname;
window.dispimex = dispimex;

// Put this somewhere
window.endall = endall;

window.apply_keyboard = apply_keyboard;

