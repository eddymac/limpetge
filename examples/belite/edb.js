"use strict";

import {LPRNG, LPRNGD, LR90, LR180, LR360, lElement, vec3} from "../../libs/limpetge.js" ;

/*
ELITE Database
Based on the BBC Elite
Originally written by David Braben and Bob Bell
This derived from Christian Pinder's "NewKind" version of Elite, which
he reversed engineered from the original BBC release

Copyright belongs to Frontier Developments plc
*/


// const g_prngd = new LPRNGD(Math.random() * 10000);
import {g_prngd} from "./base.js";

const EDBBIS = "ABOUSEITILETSTONLONUTHNOALLEXEGEZACEBISOUSESARMAINDIREA?ERATENBERALAVETIEDORQUANTEISRION";

const EDB_ID1 = ["Large ", "Fierce ", "Small "];
const EDB_ID2 = ["Green ", "Red ", "Yellow ", "Blue ", "Black ", "Harmless "];
const EDB_ID3 = ["Slimy ", "Bug-Eyed ", "Horned ", "Bony ", "Fat ", "Furry "];
const EDB_ID4 = ["Rodent", "Frog", "Lizard", "Lobster", "Bird", "Humanoid", "Feline", "Insect"];


const EDB_DL =
[
/*  0   */  ["fabled", "notable", "well known", "famous", "noted"],
/*  1   */  ["very", "mildly", "most", "reasonably", ""],
/*  2   */  ["ancient", "<20>", "great", "vast", "pink"],
/*  3   */  ["<29> <28> plantations", "mountains", "<27>", "<19> forests", "oceans"],
/*  4   */  ["shyness", "silliness", "mating traditions", "loathing of <5>", "love for <5>"],
/*  5   */  ["food blenders", "tourists", "poetry", "discos", "<13>"],
/*  6   */  ["talking tree", "crab", "bat", "lobst", "%R"],
/*  7   */  ["beset", "plagued", "ravaged", "cursed", "scourged"],
/*  8   */  ["<21> civil war", "<26> <23> <24>s", "a <26> disease", "<21> earthquakes", "<21> solar activity"],
/*  9   */  ["its <2> <3>", "the %I <23> <24>","its inhabitants' <25> <4>", "<32>", "its <12> <13>"],
/* 10   */  ["juice", "brandy", "water", "brew", "gargle blasters"],
/* 11   */  ["%R", "%I <24>", "%I %R", "%I <26>", "<26> %R"],
/* 12   */  ["fabulous", "exotic", "hoopy", "unusual", "exciting"],
/* 13   */  ["cuisine", "night life", "casinos", "sit coms", " <32> "],
/* 14   */  ["%H", "The planet %H", "The world %H", "This planet", "This world"],
/* 15   */  ["n unremarkable", " boring", " dull", " tedious", " revolting"],
/* 16   */  ["planet", "world", "place", "little planet", "dump"],
/* 17   */  ["wasp", "moth", "grub", "ant", "%R"],
/* 18   */  ["poet", "arts graduate", "yak", "snail", "slug"],
/* 19   */  ["tropical", "dense", "rain", "impenetrable", "exuberant"],
/* 20   */  ["funny", "wierd", "unusual", "strange", "peculiar"],
/* 21   */  ["frequent", "occasional", "unpredictable", "dreadful", "deadly"],
/* 22   */  ["<1> <0> for <9>", "<1> <0> for <9> and <9>", "<7> by <8>", "<1> <0> for <9> but <7> by <8>"," a<15> <16>"],
/* 23   */  ["<26>", "mountain", "edible", "tree", "spotted"],
/* 24   */  ["<30>", "<31>", "<6>oid", "<18>", "<17>"],
/* 25   */  ["ancient", "exceptional", "eccentric", "ingrained", "<20>"],
/* 26   */  ["killer", "deadly", "evil", "lethal", "vicious"],
/* 27   */  ["parking meters", "dust clouds", "ice bergs", "rock formations", "volcanoes"],
/* 28   */  ["plant", "tulip", "banana", "corn", "%Rweed"],
/* 29   */  ["%R", "%I %R", "%I <26>", "inhabitant", "%I %R"],
/* 30   */  ["shrew", "beast", "bison", "snake", "wolf"],
/* 31   */  ["leopard", "cat", "monkey", "goat", "fish"],
/* 32   */  ["<11> <10>", "%I <30> <33>","its <12> <31> <33>", "<34> <35>", "<11> <10>"],
/* 33   */  ["meat", "cutlet", "steak", "burgers", "soup"],
/* 34   */  ["ice", "mud", "Zero-G", "vacuum", "%I ultra"],
/* 35   */  ["hockey", "cricket", "karate", "polo", "tennis"]
];

const EDB_RANK = [
    [0x0000, "Harmless"],
    [0x0008, "Mostly Harmless"],
    [0x0010, "Poor"],
    [0x0020, "Average"],
    [0x0040, "Above Average"],
    [0x0080, "Competent"],
    [0x0200, "Dangerous"],
    [0x0A00, "Deadly"],
    [0x1900, "- E L I T E -"]
]


const EDB_T_FOOD = 0;
const EDB_T_TEXTILES = 1;
const EDB_T_RADIOACTIVES = 2;
const EDB_T_ALCOHOL = 3;
const EDB_T_LUXURIES = 4;
const EDB_T_MACHINERY = 5;
const EDB_T_COMPUTERS = 6;
const EDB_T_FURS = 7;
const EDB_T_ALLOYS = 8;
const EDB_T_MINERALS = 9;
const EDB_T_SLAVES = 10;
const EDB_T_NARCOTICS = 11;
const EDB_T_FIREARMS = 12;
const EDB_T_GOLD = 13;
const EDB_T_PLATINUM = 14;
const EDB_T_SILVER = 15;
const EDB_T_THARGON = 16;

const EDB_HERMITCARGO = [
    EDB_T_FOOD,
    EDB_T_RADIOACTIVES,
    EDB_T_ALCOHOL,
    EDB_T_MACHINERY,
    EDB_T_COMPUTERS,
    EDB_T_NARCOTICS,
    EDB_T_FIREARMS];

const EDB_T_ILLEGALS = [
    EDB_T_SLAVES,
    EDB_T_NARCOTICS,
    EDB_T_FIREARMS];

const EDB_T_ILLEGALS_LENGTH = EDB_T_ILLEGALS.length;

const EDB_HERMITCARGO_LEN = EDB_HERMITCARGO.length;


// Goods
// Description - Price - from to variance (mask)  diff Unit >illegal
// Market bits are I/A, R/P, C/V
// P=Poor, R=Rich, V=Village, C=City, A=Aggricultural, I=Industrial

const EDB_TRADE = [
    ["Food",         7.60,  7,  0, 0.2, 7, false],   // PVA -> RCI
    ["Textiles",     8.00,  4,  2, 0.2, 7, false],   // RCA -> PCI
    ["Radioactives",26.00,  3,  2, 0.15, 7, false],  // PVI -> PVA
    ["Liquor/Wines",34.00,  5,  3, 0.15, 7, false],  // RVA -> PVI
    ["Luxuries",    39.20,  2,  5, 0.1, 7, false],   // PCI -> RVA
    ["Machinary",   46.80,  1,  4, 0.15, 7, false],  // RVI -> RCA
    ["Computers",   61.60,  0,  6, 0.1, 7, false],   // RCI -> PCA
    ["Furs",        70.40,  6,  1, 0.1, 7, false],   // PCA -> RVI

    ["Alloys",       3.10,  0,  4, 0.02, 4, false],   // I -> A
    ["Minerals",     2.30,  4,  0, 0.02, 4, false],   // A -> I

    ["Slaves",      16.00,  2,  0, 0.4,  2, 0, true],   // P -> R
    ["Narcotics",   94.00,  0,  1, 0.3,  1, 1, true],   // V -> C
    ["Firearms",    49.60,  0,  4, 0.35, 4, 2, true],   // I -> A

    ["Gold",        38.80,  0,  0, 0.02, -1, false],
    ["Platinum",    68.40,  0,  0, 0.02, -1, false],
    ["Silver",      18.00,  0,  0, 0.02, -1, false],
    ["Alien Items", 21.20,  0,  0, 0.02, -1, false],
];

const EDB_TRADE_LENGTH = EDB_TRADE.length;


const EDB_ECONOMY  = ["Rich industrial cities",        // 0
                      "Rich industrial villages",      // 1
                      "Poor industrial cities",         //2
                      "Poor industrial villages",      // 3
                      "Rich agricultural cities",       // 4
                      "Rich agricultural villages",     // 5
                      "Poor agricultural cities",       //6 
                      "Poor agricultural villages"];     // 7

const EDB_SUPPLY_DEMAND = [
    /* RCI */ [EDB_T_COMPUTERS,         EDB_T_FOOD],
    /* RVI */ [EDB_T_MACHINERY,         EDB_T_FURS],
    /* PCI */ [EDB_T_LUXURIES,          EDB_T_TEXTILES],
    /* PVI */ [EDB_T_RADIOACTIVES,      EDB_T_ALCOHOL],
    /* RCA */ [EDB_T_TEXTILES,          EDB_T_MACHINERY],
    /* RVA */ [EDB_T_ALCOHOL,           EDB_T_LUXURIES],
    /* PCA */ [EDB_T_FURS,              EDB_T_COMPUTERS],
    /* PVA */ [EDB_T_FOOD,              EDB_T_RADIOACTIVES]
];

const EDB_GOVERNMENT = [
    // Description                          Bounty  Police_off    Police_fug  IllegalGoods
    ["Anarchy (No security)",               false,   0,              0,          true,],
	["Feudal (Hardly any security)",        false,   0,              1,          true,],
	["Multi-Government (Minimal security)", true,    0,              1,          false,],
	["Dictatorship (Low security)",         true,    1,              1,          false,],
	["Communist (Some security)",           true,    1,              2,          false,],
	["Confederacy (Above average security", true,    2,              2,          false,],
	["Democracy (Good security)",           true,    2,              3,          false,],
	["Corporate State (High security)",     true,    3,              3,          false,],
    ];


const NO_LASER = 0x00;
const PULSE_LASER = 0x0F;
const BEAM_LASER = 0x8F;
const MILITARY_LASER = 0x97;
const POWER_LASER = 0x32;


    //Tech   Price  Description            Property  RefValue format
const EDB_EQUIPMENT_MARKET = [
     [0,    0.2, "Fuel",                    "fuel", 0],
     [0,   30.0, "Missile",                 "missiles", 0],
     [2,  400.0, "Pulse Laser",             "pulse_laser", PULSE_LASER],
     [3, 1000.0, "Beam Laser",              "beam_laser", BEAM_LASER],
     [9, 2000.0, "Power Laser",             "power_laser", POWER_LASER],
     [9, 6000.0, "Military Laser",          "military_laser", MILITARY_LASER],
     [0,  400.0, "Large Cargo Bay",         "large_cargo", 0],
     [1,  600.0, "E.C.M. System",           "ecm", 0],
     [4,  525.0, "Fuel/Cargo Scoops",       "fuel_scoop", 0],
     [5, 1000.0, "Escape Pod",              "escape_pod", 0],
     [6,  900.0, "Energy Bomb",             "energy_bomb", 0],
     [7, 1500.0, "Extra Energy Unit",       "energy_unit", 0],
     [8, 1500.0, "Docking Computers",       "docking_computer", 0],
     [9, 5000.0, "Galactic Hyperdrive",     "galactic_hyperdrive", 0],
];

/*
 * The following reference index of the above
 */
const EDB_RLASER = [];
EDB_RLASER[PULSE_LASER] = 2;
EDB_RLASER[BEAM_LASER] = 3;
EDB_RLASER[POWER_LASER] = 4;
EDB_RLASER[MILITARY_LASER] = 5;

const EI_PULSE_LASER = 2
const EI_BEAM_LASER = 3
const EI_MILITARY_LASER = 4
const EI_POWER_LASER = 5


class _EStr {
    constructor(str)
    {
        this.str = str;
        this.ptr = 0;
        this.len = str.length;
    }

    nextbyte()
    {
        if(this.ptr > this.len - 2) {
            throw("Ran out of input string nb: " + this.ptr.toString());
        }
        this.ptr += 2;
        return parseInt(this.str.slice(this.ptr - 2, this.ptr), 16)
    }
    nextstr(len)
    {
        if(this.ptr > this.len - len) {
            throw("Ran out of input string ns " + this.ptr.toString());
        }
        let str = this.str.slice(this.ptr, this.ptr + len);
        this.ptr += len;
        return str.trim();
    }
    nextbool()
    {
        if(this.ptr >= this.len) {
            throw("Ran out of input string nbool "  + this.ptr.toString());
        }
        let chr = this.str[this.ptr];
        this.ptr += 1;
        if(chr == "1")
            return true;
        else
            return false;
    }
    nextdigit()
    {
        if(this.ptr >= this.len) {
            throw("Ran out of input string nd "  + this.ptr.toString());
        }
        let chr = this.str[this.ptr];

        let ord = this.str.charCodeAt(this.ptr);
        this.ptr += 1;

        if(ord >= 0x30 && ord <= 0x39)
            return ord - 0x30;
        else if(ord >= 0x41 && ord <= (0x41 + 26))
            return ord + 10 -  0x41;
        else if(ord >= 0x61 && ord <= (0x61 + 26))
            return ord + 36 -  0x61;
        else
            throw("Invalid digit in read string");
    }

    nextint()
    {
        return (this.nextbyte() * 16777216)
                        + (this.nextbyte() * 65536)
                        + (this.nextbyte() * 256)
                        + this.nextbyte();
    }
        
    add_byte(num)
    {
        num = num & 255;
        let ss = num.toString(16);
        if(ss.length == 0) 
            ss = "00";
        else if(ss.length == 1) 
            ss = "0" + ss;

        this.str += ss;
        this.len += 2;
    }
    add_str(str, len)
    {
        this.len += len;

        let slen = str.length;
        while(slen < len) {
            str = str + " ";
            slen += 1;
        }
        this.str = this.str + str.slice(0, len);
        this.len += len;
    }
    add_bool(inp)
    {
        if(inp)
            this.str = this.str + "1";
        else
            this.str = this.str + "0";
        this.len += 1;
    }
    add_digit(num)
    {

        if(num >= 0 && num <= 9)
            this.str += String.fromCharCode(0x30 + num);
        else if(num >= 10 && num <= 35) 
            this.str += String.fromCharCode(0x41 + num - 10);
        else if(num >= 36 && num <= 61)
            this.str += String.fromCharCode(0x61 + num - 36);
        else
            throw("Invalid digit in out of range");
    }

    add_int(num)
    {
        this.add_byte((num >> 24) & 0xff);
        this.add_byte((num >> 16) & 0xff);
        this.add_byte((num >> 8) & 0xff);
        this.add_byte(num & 0xff);
    }
}

/*
 * A commander
 */

class ECommander {
    constructor()
    {
        this.reset();
    }

    reset()
    {
        this._ok = true;
    	this.name = "JAMESON";									/* Name 			*/
    	this.mission_number = 0;										/* Mission Number 	*/
    	this.mission_state = 0;									/* State of mission 	*/
        this.planet_number = 7;                                 // LAVE
    	this.credits = 100;										/* Credits * 100		*/
    	this.fuel = 7;											/* Fuel	* 10		*/
    	this.galaxy_number = 0;											/* Galaxy - 1		*/
    	this.laser_mounting = PULSE_LASER;								/* Front Laser		*/
    	this.cargo_capacity = 20;											/* Cargo Capacity	*/
        this.cargo_used = 0;                                                /* Amount being used */
    	this.current_cargo = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];		/* Current Cargo	*/
    	this.ecm = false;											/* ECM				*/
    	this.fuel_scoop = false;									/* Fuel Scoop		*/
    	this.energy_bomb = false;									/* Energy Bomb		*/
    	this.energy_unit = 0;									/* Energy Unit		*/
    	this.docking_computer = false;								/* Docking Computer */
    	this.galactic_hyperdrive = false;							/* Galactic H'Drive	*/
    	this.escape_pod = false;									/* Escape Pod		*/
        this.large_cargo = false;                               /* Large cargo bay */
    	this.missiles = 3;											/* No. of Missiles	*/
    	this.legal_status = 0;											/* Legal Status		*/
    	this.market_rnd = 0;											/* Fluctuation		*/
    	this.score = 0;											/* Score			*/
        this.keyboard_layout = 0                                /* Keyboard Layout */
    
        this.galaxy = new EGalaxy(0);
        this.planet = this.galaxy.planets[7];                        /* Planet number */
        this.cross = this.planet.get_coordinates();
    	this.bs_cargo = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];	/* buy/sell cargo	*/
    
        this.sel_number = this.planet_number;
        this.sel_planet = this.planet;
        this.hyper_planet = null;       // Planet hyper to

        this.old_planet = null;         // Planet hyper from
        this.iswitchspace = false;
        this.witchx = 0;
        this.witchy = 0;
        this.witchcoords = [0, 0];
    }

    impexp(num)
    {
        let str = this._getCookie("elite" + num.toString());
        let sstr = str;
        str = prompt("Copy Paste data from/to here", str);
        if(str != "" && str != null) {
            if(this._loaddata(str))
                this._putCookie("elite" + num.toString(), str);
            else if(!  this._loaddata(sstr)) 
                alert("Error inputting data");
        }
    }


    load(num)
    {
        this._ok = true;

        let str = this._getCookie("elite" + num.toString());

        if(str == "") return false;

        return this._loaddata(str)
    }

    _loaddata(str)
    {
        try {
            let estr = new _EStr(str);

            this.name = estr.nextstr(8);
            this.mission_number = estr.nextdigit();
            this.mission_state = estr.nextdigit();
            this.planet_number = estr.nextbyte();
            this.credits = estr.nextint() / 100;
    
            this.fuel = estr.nextint() / 100;
            this.galaxy_number = estr.nextdigit();
            this.laser_mounting = estr.nextbyte();
            this.current_cargo = [
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte(),
                estr.nextbyte()
            ];
    
    	    this.ecm = estr.nextbool();
    	    this.fuel_scoop = estr.nextbool();
    	    this.large_cargo = estr.nextbool();
    	    this.energy_bomb = estr.nextbool();
    	    this.energy_unit = estr.nextdigit();
    	    this.docking_computer = estr.nextbool();
    	    this.galactic_hyperdrive = estr.nextbool();
    	    this.escape_pod = estr.nextbool();
    
    	    this.missiles = estr.nextdigit();
    	    this.legal_status = estr.nextbyte();
    
            this.market_rnd = estr.nextbyte();
            this.score = estr.nextint();

            this.sel_number = estr.nextbyte();


            this.keyboard_layout = estr.nextdigit();
            // Three byte spare

            estr.nextdigit();
            estr.nextdigit();
            estr.nextdigit();

            if(estr.nextint() != 0xbe114e) {
                throw("Invalid end of save marker");
            }

            if(this.large_cargo)
                this.cargo_capacity = 35;
            else
                this.cargo_capacity = 20;

            this.cargo_used = 0;
            for(let itm of this.current_cargo) {
                this.cargo_used += itm;
            }

            // Load things up
            this.galaxy = new EGalaxy(this.galaxy_number);
            this.planet = this.galaxy.planets[this.planet_number];
            this.sel_planet = this.galaxy.planets[this.sel_number];
            this.cross = this.sel_planet.get_coordinates();
        } catch(err) {
            alert("ERROR LOADING COMMANDER\n\n" + err);
            return false;
        }
        return true;
    }

    // Following shamelessly stolen from w3schools.com
    _getCookie(cname)
    {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    _putCookie(name, value)
    {
        let d = new Date();
        d.setTime(d.getTime() + (24*60*60*1000*365));  // 1 Years...
        let expires = "expires="+ d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires
    }

    _delCookie(name)
    {
        let d = new Date();
        d.setTime(d.getTime() - (24*60*60*365));  // 1 year ago
        let expires = "expires="+ d.toUTCString();
        document.cookie = name + "=DELETED;" + expires
    }


    save(num)
    {
        let estr = new _EStr("");
        estr.add_str(this.name, 8);
        estr.add_digit(this.mission_number);
        estr.add_digit(this.mission_state);
        estr.add_byte(this.planet_number);

        estr.add_int(Math.round(this.credits * 100));

        estr.add_int(Math.round(this.fuel * 100));
        estr.add_digit(this.galaxy_number);
        estr.add_byte(this.laser_mounting);

        estr.add_byte(this.current_cargo[0]);
        estr.add_byte(this.current_cargo[1]);
        estr.add_byte(this.current_cargo[2]);
        estr.add_byte(this.current_cargo[3]);
        estr.add_byte(this.current_cargo[4]);
        estr.add_byte(this.current_cargo[5]);
        estr.add_byte(this.current_cargo[6]);
        estr.add_byte(this.current_cargo[7]);
        estr.add_byte(this.current_cargo[8]);
        estr.add_byte(this.current_cargo[9]);
        estr.add_byte(this.current_cargo[10]);
        estr.add_byte(this.current_cargo[11]);
        estr.add_byte(this.current_cargo[12]);
        estr.add_byte(this.current_cargo[13]);
        estr.add_byte(this.current_cargo[14]);
        estr.add_byte(this.current_cargo[15]);
        estr.add_byte(this.current_cargo[16]);

	    estr.add_bool(this.ecm);
	    estr.add_bool(this.fuel_scoop);
	    estr.add_bool(this.large_cargo);
	    estr.add_bool(this.energy_bomb);
	    estr.add_digit(this.energy_unit);
	    estr.add_bool(this.docking_computer);
	    estr.add_bool(this.galactic_hyperdrive);
	    estr.add_bool(this.escape_pod);

	    estr.add_digit(this.missiles);
	    estr.add_byte(this.legal_status);

        estr.add_byte(this.market_rnd);
        estr.add_int(this.score);

        estr.add_byte(this.sel_number);

        estr.add_digit(this.keyboard_layout);
        estr.add_digit(0);
        estr.add_digit(0);
        estr.add_digit(0);

        estr.add_int(0xbe114e);

        this._putCookie("elite" + num.toString(), estr.str);
    }

    find_planet(x, y)
    {
        return this.galaxy.find_planet(x, y);
    }

    nfmt(num)
    {
            let whole = Math.floor(num);
            let frac = Math.round((num - whole) * 100);
            let fracs = frac.toString();
            if(frac < 10)
                fracs = "0" + fracs;
            return whole.toString() + "." + fracs;
    } 

    dispcredits()
    {
        return this.nfmt(this.credits);
    }

    disprank()
    {
        let rank = 0;
        for(let dst of EDB_RANK) {
            if(this.score >= dst[0]) rank += 1;
        }
        return EDB_RANK[rank - 1][1]
    }

    lgl_resetbs(planet)
    {
        for(let i = 0; i < EDB_TRADE_LENGTH; i++) this.bs_cargo[i] = 0;
    }

    lgl_status_screen()
    {
        // No good way of doing equipment
        let eline = [];
        let rank = 0;
        for(let dst of EDB_RANK) {
            if(this.score >= dst[0]) rank += 1;
        }
        // To do - in hyperspace
        eline.push(["Commander:", this.name]);
        eline.push(["Location:", this.planet.capitalise_name(this.planet.name)]);
        eline.push(["Credits:", this.nfmt(this.credits)]);
        eline.push(["Rank:", EDB_RANK[rank - 1][1]]);        
        let estatus = "Clean";
        if(this.legal_status > 500)
            estatus = "Fugitive  (Bounty: " + this.nfmt(this.lgl_bounty()) + ")";
        else if (this.legal_status > 0)
            estatus = "Offender (Bounty: " + this.nfmt(this.lgl_bounty()) + ")";
        eline.push(["Legal Status:", estatus]);
        eline.push(["Fuel:", this.nfmt(this.fuel)]);
        let laserinst = "None";
        switch(this.laser_mounting) {
        case PULSE_LASER: laserinst = "Pulse Laser";break;
        case BEAM_LASER: laserinst = "Beam Laser";break;
        case MILITARY_LASER: laserinst = "Military Laser";break;
        case POWER_LASER: laserinst = "Power Laser";break;
        }
        eline.push(["Equipment:", laserinst]);;
        if(this.ecm) eline.push(["", "ECM"]);
        if(this.missiles > 0) 
            if(this.missiles == 1)
                eline.push(["", this.missiles.toString() + " Missile"]);
            else
                eline.push(["", this.missiles.toString() + " Missiles"]);
        if(this.fuel_scoop) eline.push(["", "Fuel Scoop"]);
        if(this.large_cargo) eline.push(["", "Large Cargo Bay"]);
        if(this.escape_pod) eline.push(["", "Escape Pod"]);
        if((this.energy_unit & 2) == 2) eline.push(["", "Extra Energy Unit"]);
        if(this.docking_computer) eline.push(["", "Docking Computer"]);
        if(this.galactic_hyperdrive) eline.push(["", "Galactic Hyperdrive"]);
        if(this.energy_bomb) eline.push(["", "Energy Bomb"]);


        let outele = [];
        for(let line of eline) {
            outele.push(lElement("tr", {class: "status"}, "", [
                lElement("td", {class: "status_title"}, line[0]),
                lElement("td", {class: "status_desc"}, line[1])
            ]))
        }

        return lElement("div", {class: "status"}, "", [
            lElement("table", {class: "status"}, "", outele)
        ])
    }

    lgl_equipment()
    {
        let planet = this.planet;
        if(planet == -1) return lElement("div", {"class": "equipment"}, "", [
            lElement("div", {}, "ERROR ERROR ERROR ERROR", []),
            lElement("div", {}, "ERROR ERROR ERROR ERROR", []),
            lElement("div", {}, "ERROR ERROR ERROR ERROR", []),
            lElement("div", {}, "ERROR ERROR ERROR ERROR", []),
            lElement("div", {}, "ERROR ERROR ERROR ERROR", []),
            lElement("div", {}, "ERROR ERROR ERROR ERROR", []),
            ]);

        this.eeles = [];
        let out = []

        this.eqline = [];

        this.lgl_equipmentsel = 0;

        this.lgl_ele_pulse = null;
        this.lgl_ele_beam = null;
        this.lgl_ele_power = null;
        this.lgl_ele_military = null;

        let self = this;

        let tlines = [
            lElement("tr", {class: "equipment_title"}, "", [
                lElement("td", {class: "equipment_title", colspan: 3}, this.planet.name + " Equipment"), 
            ]),
            lElement("tr", {class: "equipment_head"}, "", [
                lElement("td", {class: "equipment_f_title"}, "Item"),
                lElement("td", {class: "equipment_n_title"}, "Price"),
                lElement("td", {class: "equipment_n_title"}, "Equipped")
            ])
        ]

        function _yn(_i)
        {
            if(_i)
                return "Yes";
            else
                return "No";
        }

        function _iele(_e, _t, _i)
        {
            _e.innerText = _t;
            self.eeles.push(_e);
            self.eqline.push(_i);
        }

        this.lgl_equipsel = 0;
        let plantech = planet.techlevel;
        let idx = 0;
        for(let tline of EDB_EQUIPMENT_MARKET) {
            let etech = tline[0];
            let eprice = tline[1];
            let edescr = tline[2];
            let ename = tline[3];
            let eequip = "";

            let ele = lElement("td", {class: "equipment_n_line", id: "equipment_e_" + ename}, "");

            let val;


            switch(ename) {
            case "fuel":
                _iele(ele, this.nfmt(this.fuel), idx);
                break;
            case "missiles":
                _iele(ele, this.missiles.toString(), idx);
                break;
            case "pulse_laser":
                _iele(ele, _yn(this.laser_mounting === PULSE_LASER), idx);
                this.lgl_ele_pulse = ele;
                break
            case "beam_laser":
                val = (this.laser_mounting === BEAM_LASER);
                if(val ||  plantech >= etech) {
                    _iele(ele, _yn(val), idx);
                    this.lgl_ele_beam = ele;
                }
                break
            case "power_laser":
                val = (this.laser_mounting === POWER_LASER);
                if(val ||  plantech >= etech) {
                    _iele(ele, _yn(val), idx);
                    this.lgl_ele_power = ele;
                }
                break
            case "military_laser":
                val = (this.laser_mounting === MILITARY_LASER);
                if(val ||  plantech >= etech) {
                    _iele(ele, _yn(val), idx);
                    this.lgl_ele_military = ele;
                }
                break
            default:
                val = this[ename];
                if(val || planet.techlevel >= etech)
                    _iele(ele, _yn(val), idx);
            }
            idx += 1;
        }

        idx = 0;
        for(let eele of this.eeles) {
            let eline = EDB_EQUIPMENT_MARKET[this.eqline[idx]];
            if(idx == 0)
                var cname = "equipment high";
            else
                var cname = "equipment unhigh";
            tlines.push(
                lElement("tr", {class: cname, "id": "equipment_line_" + idx.toString()}, "", [
                    lElement("td", {class: "equipment_f_line"}, eline[2]),
                    lElement("td", {class: "equipment_n_line"}, this.nfmt(eline[1])),
                    eele,
                ])
            );
            idx += 1;
        }
        tlines.push(
            lElement("tr", {class: "equipment_total", "id": "equipment_total"}, "", [
                lElement("td", {class: "equipment_total", colspan: 3}, "", [
                    lElement("span", {}, "Credits: "),
                    lElement("span", {id: "equipment_credits"},  this.nfmt(this.credits)),
                    lElement("span", {}, " "),
                    lElement("span", {class: "equipment_error", id: "equipment_error"}, ""),
                ])
            ])
        );
            
        return lElement("div", {class: "equipment"}, "", [
            lElement("table", {class: "equipment"}, "", tlines)
        ]);

    }

    lgl_highlight_equipment(way)
    {
        // way is + or - 1
        if(this.lgl_equipmentsel + way >= this.eqline.length) return;
        if(this.lgl_equipmentsel + way < 0) return;
        document.getElementById("equipment_error").innerText = "";

        document.getElementById("equipment_line_" + this.lgl_equipmentsel.toString()).className = "equipment unhigh";
        this.lgl_equipmentsel += way;
        document.getElementById("equipment_line_" + this.lgl_equipmentsel.toString()).className = "equipment high";
    }

    lgl_equip(ship, player)
    {
        let eline = EDB_EQUIPMENT_MARKET[this.eqline[this.lgl_equipmentsel]];
        let ename = eline[3];
        let eprice = eline[1];

        let nocred = false;
        let hasequip = "";

        function _yn(_i) {
            if(_i)
                return "Yes";
            else
                return "No";
        }
        

        switch(ename) {
        case "fuel": 
            if(this.fuel <= 6) {
                if(this.credits >= eprice) {
                    this.fuel += 1;
                    this.credits -= eprice;
                } else if (this.credits > 0) {
                    this.fuel += this.credits / eprice;
                    this.credits = 0;
                } else  {
                    nocred = true;
                }
            } else if (this.fuel < 7.0) {
                let tofill = 7.0 - this.fuel;
                if (this.credits > eprice * tofill) {
                    this.fuel = 7;
                    this.credits -= tofill * eprice;
                } else if (this.credits > 0) {
                    this.fuel += this.credits / eprice;
                    this.credits = 0;
                } else {
                    nocred = true;
                }
            } else {
                hasequip = "Already at maximum fuel capacity"
            }
            this.eeles[this.lgl_equipmentsel].innerText = this.nfmt(this.fuel);
            ship.fuellevel(this.fuel, 7.0);
            break;
        case "missiles":
            if(this.missiles == 4) {
                hasequip = "All missile launchers already loaded"
            } else if(this.credits >= eprice) {
                this.missiles += 1;
                this.credits -= eprice;
            } else {
                nocred = true;
            }
            this.eeles[this.lgl_equipmentsel].innerText = this.missiles.toString();
            ship.restockmiss(this.missiles);
            break;
        case "energy_unit":
            if((this.energy_unit & 2) == 2) {
                hasequip = "Extra Energy Unit already fitted";
            } else if(eprice <= this.credits) {
                this.credits -= eprice;
                this.energy_unit |= 2;
            } else {
                nocred = true;
            }
            this.eeles[this.lgl_equipmentsel].innerText = _yn((this.energy_unit & 2) == 2);

            ship.rechargerate = 1 + (this.energy_unit / 2);
            ship.maxintegrity = ship.rechargerate * 100;
            ship.integrity = ship.rechargerate * 100;
            this.lgl_getintegrity(ship);
            break;
        case "pulse_laser":
        case "beam_laser":
        case "military_laser":
        case "power_laser":
            let laser = this.laser_mounting;
            if(laser != 0) {
                let lline = EDB_EQUIPMENT_MARKET[EDB_RLASER[laser]];
                if(EDB_RLASER[laser] === lline[3]) {
                    hasequip = lline[2] + " already mounted";
                } else {
                    var dcred = eprice - lline[1];
                    if(this.credits >= dcred) {
                        this.laser_mounting = eline[4];
                        this.credits -= dcred;
                    } else {
                        nocred = true;
                    }
                }
            } else if(this.credits >= eprice) {
                this.laser_mounting = eline[4];
                this.credits -= eprice;
            } else {
                nocred = true;
            }

            if(this.lgl_ele_pulse) this.lgl_ele_pulse.innerText = _yn(this.laser_mounting === PULSE_LASER);
            if(this.lgl_ele_power)this.lgl_ele_power.innerText = _yn(this.laser_mounting === POWER_LASER);
            if(this.lgl_ele_beam) this.lgl_ele_beam.innerText = _yn(this.laser_mounting === BEAM_LASER);
            if(this.lgl_ele_military) this.lgl_ele_military.innerText = _yn(this.laser_mounting === MILITARY_LASER);

            this.lgl_getlasers(ship);

            break;
        default:
            if(this[ename]) {
                hasequip = eline[2] + " already equipped";
            } else if(eprice <= this.credits) {
                this.credits -= eprice;
                this[ename] = true;
                if(ename == "fuel_scoop") ship.scoop = true;
                if(ename == "large_cargo") {
                    ship.cargo_capacity = 35;
                    this.cargo_capacity = 35;
                }
            } else {
                nocred = true;
            }
            this.eeles[this.lgl_equipmentsel].innerText = _yn(this[ename]);

            this.lgl_getscoop(ship);
            this.lgl_getecm(ship);
            break;
        }
            
        if(nocred) {
            document.getElementById("equipment_error").innerText = "*** Not enough credits ***";
        }
        else if(hasequip != "") {
            document.getElementById("equipment_error").innerText = hasequip;
        } else {
            document.getElementById("equipment_error").innerText = "";
        }
        document.getElementById("equipment_credits").innerText = this.nfmt(this.credits);
    }

    lgl_unequip(ship, player)
    {
        let eline = EDB_EQUIPMENT_MARKET[this.eqline[this.lgl_equipmentsel]];
        let ename = eline[3];
        let eprice = eline[1];

        let noequip = "";

        function _yn(_i) {
            if(_i)
                return "Yes";
            else
                return "No";
        }
        

        switch(ename) {
        case "fuel": 
            if(this.fuel >= 1) {
                this.credits += eprice;
                this.fuel -= 1;
            } else if(this.fuel > 0) {
                this.credits += eprice * this.fuel;
                this.fuel = 0;
            } else {
                noequip = "No fuel in tank";
            }
            this.eeles[this.lgl_equipmentsel].innerText = this.nfmt(this.fuel);
            ship.fuellevel(this.fuel, 7.0);
            break;
        case "missiles":
            if(this.missiles == 0) {
                noequip = "No missiles loaded";
            } else {
                this.missiles -= 1;
                this.credits += eprice;
            }
            this.eeles[this.lgl_equipmentsel].innerText = this.missiles.toString();
            ship.restockmiss(this.missiles);
            break;

        case "pulse_laser":
        case "beam_laser":
        case "military_laser":
        case "power_laser":
            if(this.laser_mounting != eline[4]) {
                noequip = eline[2] + " not mounted";
            } else {
                this.laser_mounting = 0;
                this.credits += eprice;
            }
            if(this.lgl_ele_pulse) this.lgl_ele_pulse.innerText = _yn(this.laser_mounting === PULSE_LASER);
            if(this.lgl_ele_power)this.lgl_ele_power.innerText = _yn(this.laser_mounting === POWER_LASER);
            if(this.lgl_ele_beam) this.lgl_ele_beam.innerText = _yn(this.laser_mounting === BEAM_LASER);
            if(this.lgl_ele_military) this.lgl_ele_military.innerText = _yn(this.laser_mounting === MILITARY_LASER);
            this.lgl_getlasers(ship);
            break;
        case "energy_unit":
            if((this.energy_unit & 2) != 2) {
                hasequip = lline[2] + " not equipped";
            } else {
                this.credits += eprice;
                this.energy_unit &= ~(2);
            }
            this.eeles[this.lgl_equipmentsel].innerText = _yn((this.energy_unit & 2) == 2);

            ship.rechargerate = 1 + (this.energy_unit / 2);
            ship.maxintegrity = ship.rechargerate * 100;
            ship.integrity = ship.rechargerate * 100;
            this.lgl_getintegrity(ship);
            break;
        default:
            if(!(this[ename])) {
                noequip = eline[2] + " not equipped";
            } else {
                if(ename == "large_cargo") {
                    if (this.cargo_used > 20) {
                        noequip = "Too much cargo carried to unequip large cargo bay";
                    } else {
                        this.cargo_capacity = 20;
                        ship.cargo_capacity = 20;
                    }
                }
                if(noequip == "")
                {
                    this.credits += eprice;
                    this[ename] = false;
                    if(ename == "fuel_scoop") ship.scoop = true;
                }
            }
            this.eeles[this.lgl_equipmentsel].innerText = _yn(this[ename]);
            break;
        }
            
        if(noequip != "") {
            document.getElementById("equipment_error").innerText = noequip;
        } else {
            document.getElementById("equipment_error").innerText = "";
        }
        document.getElementById("equipment_credits").innerText = this.nfmt(this.credits);

        this.lgl_getlasers(ship);
        this.lgl_getscoop(ship);
        this.lgl_getecm(ship);
        this.lgl_getintegrity(ship);
    }

    lgl_trades()
    {
        let market = this.planet.lgl_markets(this.market_rnd);
        let idx = 0;
        let out = [];

        let tlines = [
            lElement("tr", {class: "trade_title"}, "", [
                lElement("td", {class: "trade_title", colspan: 4}, this.planet.name + " Market"), 
            ]),
            lElement("tr", {class: "trade_head"}, "", [
                lElement("td", {class: "trade_f_title"}, "Goods"),
                lElement("td", {class: "trade_n_title"}, "Sell Price"),
                lElement("td", {class: "trade_n_title"}, "Buy Price"),
                lElement("td", {class: "trade_n_title"}, "In Cargo")
            ])
        ];

        this.lgl_tradesel = 0;
        for(let tline of EDB_TRADE) {

            if(idx == 0)
                var cname = "trade high";
            else
                var cname = "trade unhigh";
            
            tlines.push(
                lElement("tr", {class: cname, "id": "trade_line_" + idx.toString()}, "", [
                    lElement("td", {class: "trade_f_line"}, tline[0]),
                    lElement("td", {class: "trade_n_line"}, this.nfmt(market[idx][1])),
                    lElement("td", {class: "trade_n_line"}, this.nfmt(market[idx][0])),
                    lElement("td", {class: "trade_n_line", id: "trade_stock_" + idx.toString()}, this.current_cargo[idx].toString())
                ])
            );
            idx += 1;
        }
        tlines.push(
            lElement("tr", {class: "trade_total", "id": "trade_total"}, "", [
                lElement("td", {class: "trade_total", colspan: 4}, "", [
                    lElement("span", {}, "Credits: "),
                    lElement("span", {id: "trade_credits"},  this.nfmt(this.credits)),
                    lElement("span", {}, " "),
                    lElement("span", {class: "trade_error", id: "trade_error"}, ""),
                ])
            ])
        );
            
        return lElement("div", {class: "trades"}, "", [
            lElement("table", {class: "trades"}, "", tlines)
        ]);
    }

    lgl_highlight_trade(way)
    {
        // way is + or - 1
        if(this.lgl_tradesel + way >= EDB_TRADE_LENGTH) return;
        if(this.lgl_tradesel + way < 0) return;
        document.getElementById("trade_error").innerText = "";

        document.getElementById("trade_line_" + this.lgl_tradesel.toString()).className = "trade unhigh";
        this.lgl_tradesel += way;
        document.getElementById("trade_line_" + this.lgl_tradesel.toString()).className = "trade high";
    }

    lgl_buy(ship)
    {
        let bsc = this.bs_cargo[this.lgl_tradesel];
        let market = this.planet.lgl_markets(this.market_rnd);
        let illegal = 0;
        if(bsc > 0) {
            var buy = market[this.lgl_tradesel][1];
            illegal = -1;
        } else {
            var buy = market[this.lgl_tradesel][0];
            illegal = 1;
        }
        if(!this.planet.govillegals) {
            if(EDB_TRADE[this.lgl_tradesel][6]) {
                this.lgl_addcrime(illegal);
            }
        }
        if(buy > this.credits) {
            document.getElementById("trade_error").innerText = "*** Not enough credits ***";
            return;
        }
        if(this.cargo_used >= this.cargo_capacity) {
            document.getElementById("trade_error").innerText = "*** Not enough cargo space ***";
            return;
        }
        document.getElementById("trade_error").innerText = "";
        this.credits -= buy;
        this.current_cargo[this.lgl_tradesel] += 1;
        this.bs_cargo[this.lgl_tradesel] -= 1;
        this.cargo_used += 1;
        ship.cargo_used += 1;
        if(!this.planet.govillegals) {
            if(EDB_TRADE[this.lgl_tradesel][6]) {
                this.lgl_addcrime(1);
            }
        }
        document.getElementById("trade_stock_" + this.lgl_tradesel.toString()).innerText = this.current_cargo[this.lgl_tradesel].toString();
        document.getElementById("trade_credits").innerText = this.nfmt(this.credits);
    }

    lgl_sell(ship)
    {
        let bsc = this.bs_cargo[this.lgl_tradesel];

        if(this.current_cargo[this.lgl_tradesel] <= 0) {
            document.getElementById("trade_error").innerText = "*** No such cargo in Cargo Bay ***";
            return;
        }
        document.getElementById("trade_error").innerText = "";
        let market = this.planet.lgl_markets(this.market_rnd);
        if(bsc < 0)
            var sell = market[this.lgl_tradesel][0];
        else
            var sell = market[this.lgl_tradesel][1];
        this.credits += sell;
        this.current_cargo[this.lgl_tradesel] -= 1;
        this.bs_cargo[this.lgl_tradesel] += 1;
        this.cargo_used -= 1;
        ship.cargo_used -= 1;

        if(!this.planet.govillegals) {
            if(EDB_TRADE[this.lgl_tradesel][6]) {
                this.lgl_addcrime(1);
            }
        }
            
        document.getElementById("trade_stock_" + this.lgl_tradesel.toString()).innerText = this.current_cargo[this.lgl_tradesel].toString();
        document.getElementById("trade_credits").innerText = this.nfmt(this.credits);
    }
    lgl_dump(ship)
    {
        let bsc = this.bs_cargo[this.lgl_tradesel];

        if(this.current_cargo[this.lgl_tradesel] <= 0) {
            document.getElementById("trade_error").innerText = "*** No such cargo in Cargo Bay ***";
            return -1;
        }
        document.getElementById("trade_error").innerText = "";
        let market = this.planet.lgl_markets(this.market_rnd);
        this.current_cargo[this.lgl_tradesel] -= 1;
        this.bs_cargo[this.lgl_tradesel] += 1;
        this.cargo_used -= 1;
        ship.cargo_used -= 1;

        document.getElementById("trade_stock_" + this.lgl_tradesel.toString()).innerText = this.current_cargo[this.lgl_tradesel].toString();
        document.getElementById("trade_credits").innerText = this.nfmt(this.credits);

        return this.lgl_tradesel;
    }
    lgl_reset_cross()
    {
        let coords = this.planet.get_coordinates();
        this.cross[0] = coords[0];
        this.cross[1] = coords[1];
    }

    lgl_cross_inc(x, y)
    {
        x += this.cross[0];
        y += this.cross[1];

        if(x > 102.3) x = 102.3
        if(x < 0) x = 0;
        if(y > 51.1) y = 51.1;
        if(y < 0) y = 0;

        this.cross[0] = x;
        this.cross[1] = y;
    }
    lgl_drawgalaxy(canvas, ctx)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for(let i = 0; i < 256; i++) {
            let planet = this.galaxy.planets[i];
            let name = planet.name_planet();
            let bsize = planet.get_blob_size();
            let coords = planet.get_coordinates();
            ctx.beginPath();
            ctx.arc(coords[0] * 10, coords[1] * 10, bsize / 3, 0, 2 * Math.PI);
            ctx.fillStyle = "yellow";
            ctx.strokeStyle = "yellow";
            ctx.fill();
            ctx.stroke();
        }
        let cx = this.cross[0];
        let cy = this.cross[1];
        if(cx >= 0 && cy >= 0)
        {
            cx *= 10;
            cy *= 10;
            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.moveTo(cx + 20, cy);
            ctx.lineTo(cx - 20, cy);
            ctx.stroke();
            ctx.moveTo(cx, cy - 20);
            ctx.lineTo(cx, cy + 20);
            ctx.stroke();
        }
        let cds = this.planet.get_coordinates();
        ctx.beginPath();
        ctx.arc(cds[0] * 10, cds[1] * 10, 10 * this.fuel, 0, 2 * Math.PI);
        ctx.strokeStyle = "white";
        ctx.stroke();
    }
    lgl_drawlocal(canvas, ctx)
    {
        let ocoords = this.planet.get_coordinates();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for(let i = 0; i < 256; i++) {
            let planet = this.galaxy.planets[i];
    
            if(planet.get_square(this.planet) < 10.0)
            {
                let coords = planet.get_coordinates();
                let x = 10 + coords[0] - ocoords[0];
                let y = 10 + coords[1] - ocoords[1];
                let bsize = planet.get_blob_size();
                ctx.beginPath();
                ctx.arc(x * 25.5, y * 25.5, bsize, 0, 2 * Math.PI);
                ctx.fillStyle = "yellow";
                ctx.strokeStyle = "yellow";
                ctx.fill();
                ctx.stroke();
                ctx.font = "15px Arial";
                ctx.fillText(planet.capitalise_name(planet.name), (x * 25.5) + 5, y * 25.5);
            }
        }
        ctx.beginPath();
        ctx.arc(255, 255, 25.5 * this.fuel, 0, 2 * Math.PI);
        ctx.strokeStyle = "white";
        ctx.stroke();
        let cx = this.cross[0];
        let cy = this.cross[1];

        // Should really check if we can see this, but canvas ctx seem to take care of it
        if(cx >= 0 && cy >= 0)
        {
            cx = 10 + cx - ocoords[0];
            cy = 10 + cy - ocoords[1];
            cx *= 25.5;
            cy *= 25.5;
            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.moveTo(cx + 20, cy);
            ctx.lineTo(cx - 20, cy);
            ctx.stroke();
            ctx.moveTo(cx, cy - 20);
            ctx.lineTo(cx, cy + 20);
            ctx.stroke();
        }
    }
    lgl_getlasers(ship)
    {
        let damage = 0;
        let capacity = 0;
        switch(this.laser_mounting) {
        case PULSE_LASER:
            damage = 10;
            capacity = 1.0;
            break;
        case BEAM_LASER:
            damage = 5;
            capacity = 5.0
            break;
        case POWER_LASER:
            damage = 13;
            capacity = 3.0
            break;
        case MILITARY_LASER:
            damage = 20;
            capacity = 2.0;
            break;
        }
        ship.laserdamage = damage;
        ship.lasermaxcapacity = capacity;
        ship.lasercapacity = capacity;
    }

    lgl_getvarstart(player)
    {
        // start variables
        switch(this.laser_mounting) {
        case PULSE_LASER:
            player.lasercapacity = 1.0;
            break;
        case BEAM_LASER:
            player.lasercapacity = 5.0
            break;
        case POWER_LASER:
            player.lasercapacity = 3.0
            break;
        case MILITARY_LASER:
            player.lasercapacity = 2.0;
            break;
        default:
            player.lasercapacity = 0.0;
        }
        player.integrity = (1 + (this.energy_unit/2)) * 100;
        player.shields = 100;
        player.temperature = 10;
    }
        
    lgl_getintegrity(ship)
    {
        ship.rechargerate = 1 + (this.energy_unit / 2);
        ship.maxintegrity = ship.rechargerate * 100;
        ship.integrity = ship.rechargerate * 100;
    }
    lgl_getscoop(ship)
    {
        ship.scoop = this.fuel_scoop;
    }
    lgl_getecm(ship)
    {
        ship.ecm = this.ecm;
    }
    lgl_firemissile()
    {
        if(this.missiles > 0) this.missiles -= 1;
    }
    lgl_fuelscoop(amt)
    {
        this.fuel += amt;
        if(this.fuel > 7) this.fuel = 7;
    }
    lgl_cargoadd(what)
    {
        if(what >= 0) {
            this.cargo_used += 1;
            this.current_cargo[what] += 1;
            return EDB_TRADE[what][0];
        }
        return "";
    }
    lgl_addcrime(damage)
    {
        this.legal_status += damage;
        if(this.legal_status > 1000) this.legal_status = 1000;
        if(this.legal_status < 0) this.legal_status = 0;
        return this.lgl_bounty();
    }
    lgl_bounty()
    {
        return this.legal_status / 100;
    }
    lgl_iswanted()
    {
        return this.legal_status > 0;
    }
    lgl_isfugitive()
    {
        return this.legal_status >= 500;
    }
    lgl_maketerrorist()
    {
        this.legal_status = 1000;
        return 10;
    }
    lgl_gettreasure(prob, tst)
    {
        // Probability percentage
        // Silver - That
        // Gold - Half that
        // Platinum - Half that

        if(tst < prob / 4)
            return EDB_T_PLATINUM;
        else if(tst < prob / 2)
            return EDB_T_GOLD;
        else if (tst < prob)
            return EDB_T_SILVER;
        else
            return EDB_T_MINERALS;
    }

    lgl_gethermitcargo(g_prng)
    {
        return EDB_HERMITCARGO[g_prng.next(EDB_HERMITCARGO_LEN)];
    }
    lgl_score(num)
    {
        // Returns true if goes above 256 or multiple
        let oscore = this.score;
        this.score += num;
        return ((this.score >>> 8) != (oscore >>> 8));
    }
    lgl_hasecm()
    {
        return this.ecm;
    }
    lgl_hasdocking()
    {
        return this.docking_computer;
    }

    lgl_hasgalactic()
    {
        return this.galactic_hyperdrive;

    }

    lgl_hasescapepod()
    {
        return this.escape_pod;
    }

    lgl_hasbomb()
    {
        return this.energy_bomb;
    }

    lgl_galaxygo()
    {
        this.galactic_hyperdrive = false;
        this.galaxy_number += 1;
        this.galaxy_number &= 7;

        this.galaxy = new EGalaxy(this.galaxy_number);
        this.planet = this.galaxy.find_planet(0x30, 0x15);

        this.planet_number = this.planet.number;
        this.sel_planet = this.planet
        this.sel_number = this.planet.number;
        this.cross = this.planet.get_coordinates();
        this.legal_status = 0;
        this.planet.lgl_entry(this.planet);
    }

    lgl_hypergo()
    {
        this.fuel -= this.planet.get_distance(this.hyper_planet);
        this.planet = this.hyper_planet;
        this.planet_number = this.planet.number;
        this.planet.lgl_entry(this.old_planet);
        this.sel_planet = this.planet;
        this.sel_number = this.planet_number;
        this.iswitchspace = false;
    }

    lgl_witchgo()
    {
        if(this.iswitchspace) return;
        this.iswitchspace = true;
        this.fuel -= this.planet.get_distance(this.hyper_planet) / 2;
        this.lgl_locentry = [0, 0, 0];
        this.witchcoords = this.planet.get_midpoint(this.hyper_planet);
        this.cross[0] = this.witchcoords[0];
        this.cross[1] = this.witchcoords[1];
        this.planet = new EWitch(this.planet, this.hyper_planet);
        this.sel_planet = this.planet;
        this.planet_number = -1;
        this.sel_number = -1;
    }

    lgl_escapego()
    {
        this.escape_pod = false;
        this.legal_status = 0;
        let len = this.current_cargo.length;
        for(var i = 0; i < len; i++) this.current_cargo[i] = 0;
    }
    lgl_bombgo()
    {
        this.energy_bomb = false;
    }
}


class EStatic_PRNG {
    constructor(a, b, c, d)
    {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    next()
    {
        let x = (this.a * 2) & 0xFF;
        let a = x + this.c;
        if (this.a > 127)
            a++;
        this.a = a & 0xFF;
        this.c = x;
    
        a = Math.floor(a / 256);
        x = this.b;
        a = (a + x + this.d) & 0xFF;
        this.b = a;
        this.d = x;
        return a;
    }
}

class EBody {
    constructor(a, b, c, d, e, f)
    {
        this.a = a;
        this.b = b; // Y coordinates
        this.c = c;
        this.d = d; // X coordinates
        this.e = e;
        this.f = f;
    }

    waggle()
    {
        let x;
        let y;
        let cf;

        x = this.a + this.c;
        y = this.b + this.d;

        if (x > 0xFF)
            y++;
    
        x &= 0xFF;
        y &= 0xFF;

        this.a = this.c;
        this.b = this.d;
        this.c = this.e;
        this.d = this.f;

        x += this.c;
        y += this.d;


        if (x > 0xFF)
            y++;

        if (y > 0xFF)
            cf = 1;
        else
            cf = 0;

        x &= 0xFF;
        y &= 0xFF;

        this.e = x;
        this.f = y;
        return cf;
    }
    pcopy()
    {
        return new EPlanet(this.a, this.b, this.c, this.d, this.e, this.f);
    }
    gcopy()
    {
        return new EGalaxy(this.number);
    }
    bcopy()
    {
        return new EBody(this.a, this.b, this.c, this.d, this.e, this.f);
    }
}


class EGalaxy  extends EBody{
    constructor(num)
    {
        num = num & 0x07;
        let seed = [0x4a, 0x5a, 0x48, 0x02, 0x53, 0xb7];		/* Base EGalaxy Seed		*/

        for(let i = 0; i < num; i++) {
            for(let j = 0; j < 6; j++) {
                seed[j] =  0xff & ((seed[j] << 1) | ((seed[j] & 0x80) >> 7));
            }
        }

        super(seed[0],
              seed[1],
              seed[2],
              seed[3],
              seed[4],
              seed[5]);

    
        this.number = num;
    
        this.planets = [];
        this.create_planets();
        
    }

    find_planet(cx, cy)
    {
        cx /= 0.4;
        cy /= 0.2;

        let min_dist = 10000;
        let planet = null;
        let distance = 0;
    
        for (let i = 0; i < 256; i++)
        {
            let glx = this.planets[i];
    
            let dx = Math.abs(cx - glx.d);
            let dy = Math.abs(cy - glx.b);
    
            if (dx > dy)
                distance = (dx + dx + dy) / 2;
            else
                distance = (dx + dy + dy) / 2;
    
            if (distance < min_dist)
            {
                min_dist = distance;
                planet = glx;
            }
    
        }
        return planet;
    }

    find_by_name(name)
    {
        name = name.toUpperCase();
    	
    	var found = false;
        let glx = null;
    	
    	for (let i = 0; i < 256; i++)
    	{
            glx = this.planets[i];
            let qname = glx.name_planet();

            if (qname == name)
    		{
    			found = true;
    			break;
    		}
    
    	}
    
    	if (!found)
    	{
    		return null;
    	}
        return glx;
    
    }

    create_planets()
    {
        let out = this.planets;
        out.length = 0;
        let plan = this.pcopy();
        for(let i = 0; i < 256; i++) {
            let pa = plan.pcopy();
            pa.number = i;
            pa._getdata();
            out.push(pa);
            plan.waggle();
            plan.waggle();
            plan.waggle();
            plan.waggle();
        }
    }
}

class ELocationBase extends EBody {
    constructor(a, b, c, d, e, f)
    {
        super(a, b, c, d, e, f);
    }
    get_coordinates()
    {
        // Get X, Y coordines
        // b and d is 0 to 255

        // Cordinates from top left hand corner as light years

        return [this.d * 0.4, this.b * 0.2];
    }

    get_midpoint(other)
    {
        return [(this.d + other.d) * 0.2, (this.b + other.b) * 0.1];
    }

    get_distance(other)
    {
        return Math.hypot((this.d - other.d) * 0.4, (this.b - other.b) * 0.2);
    }

    get_square(other)
    {
        let d = Math.abs(this.d - other.d) * 0.4;
        let b = Math.abs(this.b - other.b) * 0.2;
        if(d > b)
            return d;
        else
            return b;
    }
    capitalise_name (name)
    {
        return name[0].toUpperCase() + name.toLowerCase().slice(1)
    }

}

class EWitch extends ELocationBase {
    constructor(plana, planb)
    {
        super(
            (plana.a + planb.a) >> 1,
            (plana.b + planb.b) >> 1,
            (plana.c + planb.c) >> 1,
            (plana.d + planb.d) >> 1,
            (plana.e + planb.e) >> 1,
            (plana.f + planb.f) >> 1);
        this._getdata();
    }
    _getdata()
    {
        let seed = this.a;
        seed += (this.b << 5) * 11;
        seed += (this.c << 9) * 13;
        seed += (this.d << 13) * 17;
        seed += (this.e << 17) * 19;
        seed += (this.f << 21) * 23;
        this.name = "Whicth space"
        this.government = "None"
        this.economy = "None"
        this.population = 0;
        this.techlevel = 0;
        this.productivity = 0;
        this.radius = 0;
        this.seed = seed;
        this.description = "Nobody here"

        /*
        this.govbounty = EDB_GOVERNMENT[gov][1];
        this.govpoloffender = EDB_GOVERNMENT[gov][2];
        this.govpolfugitive = EDB_GOVERNMENT[gov][3];
        this.govillegals = EDB_GOVERNMENT[gov][4];
        */

        // this.lgl_locations();
    }

    refundfuel(cmdr)
    {
        let da = this.get_distance(cmdr.old_planet);
        let db = this.get_distance(cmdr.hyper_planet);

        cmdr.fuel += (da + db) / 2;
    }

    lgl_show_data(oplanet)
    {
        return lElement("div", {}, "", [
            lElement("div", {}, "ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR"),
            lElement("div", {}, "ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR"),
            lElement("div", {}, "ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR"),
            lElement("div", {}, "ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR"),
            lElement("div", {}, "ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR"),
            lElement("div", {}, "ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR"),
            lElement("div", {}, "ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR"),
            lElement("div", {}, "ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR")]);
    }
    lgl_markets(seed)
    {
        let out = [];
        for(let trade of EDB_TRADE) {
            out.push([999.99, 999.99]);
        }
        return out;
    }
}

class EPlanet  extends ELocationBase {
    constructor(a, b, c, d, e, f)
    {
        super(a, b, c, d, e, f);
        this.carry_flag = 0;   //Set to 0 or 1 after name generation
        this.number = -1;
    }

    _getdata()
    {

        let gov = (this.c / 8) & 7;
        let eco =  this.b & 7;
        if(gov < 2) eco |= 2;
        let tech = (eco ^ 7) + (this.d & 3) + Math.floor(gov / 2) + (gov & 1)
        let pop = (tech * 4) + gov + eco + 1;
        let prod = ((eco ^ 7) + 3)
        prod *= (gov + 4);
        prod *= (pop)
        prod *= 8;
        let radius = (((this.f & 15) + 11) * 256) + this.d;
    
        let seed = this.a;
        seed += (this.b << 5) * 11;
        seed += (this.c << 9) * 13;
        seed += (this.d << 13) * 17;
        seed += (this.e << 17) * 19;
        seed += (this.f << 21) * 23;
    
        this.name = this.name_planet();
        this.government = gov
        this.economy = eco;
        this.population = pop;
        this.techlevel = tech;
        this.productivity = prod;
        this.radius = radius;
        this.seed = seed;
        this.description = this.describe_planet();

        this.govbounty = EDB_GOVERNMENT[gov][1];
        this.govpoloffender = EDB_GOVERNMENT[gov][2];
        this.govpolfugitive = EDB_GOVERNMENT[gov][3];
        this.govillegals = EDB_GOVERNMENT[gov][4];

        this.lgl_locations();
    }


    name_planet()
    {
        let size;
        let gname = "";
        let glx = this.pcopy();
        let cf = 0;

        if ((glx.a & 0x40) == 0)
            size = 3;
        else
            size = 4;

        for (let i = 0; i < size; i++)
        {
            let x = glx.f & 0x1F;
            if (x != 0)
            {
                x += 12;
                x *= 2;
                gname += EDBBIS[x];
                if (EDBBIS[x+1] != '?')
                    gname += EDBBIS[x+1];
            }

            cf = glx.waggle();
        }
        this.carry_flag = cf;
        return gname;
    }

    describe_inhabitants()
    {
        let inhab;
        
        let str = "(";
        
        if (this.e < 128)
        {
            str += "Human Colonial";
        }
        else
        {
            inhab = Math.floor(this.f / 4) & 7;
            if (inhab < 3)
                str += EDB_ID1[inhab];
    
            inhab = Math.floor(this.f / 32);
            if (inhab < 6)
                str += EDB_ID2[inhab];
    
            inhab = (this.d ^ this.b) & 7;
            if (inhab < 6)
                str += EDB_ID3[inhab];
    
            inhab = (inhab + (this.f & 3)) & 7;
            str += EDB_ID4[inhab];
        }
    
        str += "s)";
        return str;
    }

    describe_planet()
    {
        let prnd = new EStatic_PRNG(this.c, this.d, this.e, this.f);
        return this._expand_description (prnd, "<14> is <22>.");
    }
    
    _expand_description(prnd, source)
    {
    	var str = "";
    	var num;
    	var rnd;
    	var option;
    	var i;
        let len;
        let x;
        let ptr = "";
        let out = "";
    
        let slen = source.length;
        for(let si = 0; si < slen; si++) {
            let c = source.charAt(si);
    		if (c == '<')
    		{
    			si += 1;
                c = source.charAt(si);
                let str = "";
    			while (c != '>') {
    				str += c;
                    si += 1;
                    c = source.charAt(si);
                }
                // si += 1;
    			num = parseInt(str);
    			
    	        rnd = prnd.next();
    		    option = 0;
    			if (rnd >= 0x33) option++;
    			if (rnd >= 0x66) option++;
    			if (rnd >= 0x99) option++;
    			if (rnd >= 0xCC) option++;
    			
    			out += this._expand_description (prnd, EDB_DL[num][option]);
    			continue;
    		}
    
    		if (c == '%')
    		{
                si += 1;
                c = source.charAt(si);
    			switch (c)
    			{
				case 'H':
					str = this.capitalise_name(this.name_planet());
                    out += str;
					break;

				case 'I':
					str = this.capitalise_name(this.name_planet());
                    out += str.slice(0, -1) + "ian";
					break;

				case 'R':
					len = prnd.next() & 3;
					for (i = 0; i <= len; i++)
					{
						x = prnd.next() & 0x3e;
						if (i == 0)
						    out += EDBBIS[x];
						else
							out += EDBBIS[x];
						out += EDBBIS[x+1];
					}
    			}
    			continue;
    		}
    
    		out += c;
    	}
        return out;
    }

    show_planet_data(oplanet)
    {
        const supdem = EDB_SUPPLY_DEMAND[this.economy];
        return [
            ["Name", this.name],
            ["Distance", (Math.round(this.get_distance(oplanet) * 10) /10).toString() + " light years"],
            ["Economy", EDB_ECONOMY[this.economy]],
            ["Government",  EDB_GOVERNMENT[this.government][0]],
            ["Tech Level",  (this.techlevel + 1).toString()],
            ["Population",  Math.floor(this.population / 10) + "." + (this.population % 10) + " Billion " + this.describe_inhabitants()],
            ["Gross Productivity",  + (this.productivity).toString() + " M CR"],
            ["Average Radius",  + (this.radius).toString() + " KM"],
            ["Market",  "Supply: " + EDB_TRADE[supdem[0]][0] + ", Demand: " + EDB_TRADE[supdem[1]][0]],
            [this.describe_planet()],
            // ["GalCorp Ref",  this.number.toString()],
        ]
    }

    get_blob_size()
    {
        // Retrieve the blob size
        // Needs to be one after name generation
        return (this.f & 1) + 2 + this.carry_flag;
    }

    // This added for my implementation of game

    lgl_show_data(oplanet)
    {
        const lines = [];
        for(let line of this.show_planet_data(oplanet))
        {
            if(line.length == 1) {
                lines.push(lElement("tr", {class: "planline"}, "", [
                    lElement("td", {class: "planetdesc", colspan: 2}, line[0]),
                ]));
            } else {
                lines.push(lElement("tr", {class: "planline"}, "", [
                lElement("td", {class: "planettitle"}, line[0]),
                lElement("td", {class: "planetdata"}, line[1]),
                ]));
            }
        }
        return lElement("table", {}, "", lines);
    }

    _gendist(prngd, d)
    {
        let x = 0;
        let y = 0;
        let z = 0;
        let h = 0;

        for(;;)
        {
            x = 1 - prngd.next(2);
            y = 1 - prngd.next(2);
            z = 1 - prngd.next(2);
            h = Math.hypot(x, y, z);
            if(h != 0) break;
        }

        x = Math.round(x * 100) / 100;
        y = Math.round(y * 100) / 100;
        z = Math.round(z * 100) / 100;

        x = d * x / h;
        y = d * y / h;
        z = d * z / h;
        return [x, y, z];
    }

    lgl_locations()
    {

        let prngd = new LPRNGD(this.seed);

        // Station at center
        // Planet, 35 away 

        this.lgl_locplanet = [0, 0, 35];

        // Entry point 300 away from planet
        // Could be re-written
        
        this.lgl_locentry = this._gendist(prngd, 300);
        this.lgl_locentry[0] += this.lgl_locplanet[0];
        this.lgl_locentry[1] += this.lgl_locplanet[1];
        this.lgl_locentry[2] += this.lgl_locplanet[2];

        // Sun 1500 away from planet

        this.lgl_locsun = this._gendist(prngd, 1500);

        // A complete and utter silly thing here.  Make sure Y is lowest
        // So Ice caps seem OK
        if(this.lgl_locsun[1] > this.lgl_locsun[0])
        {
            let x = this.lgl_locsun[0];
            this.lgl_locsun[0] = this.lgl_locsun[1];
            this.lgl_locsun[1] = x;
        }
        if(this.lgl_locsun[2] > this.lgl_locsun[0])
        {
            let x = this.lgl_locsun[0];
            this.lgl_locsun[0] = this.lgl_locsun[2];
            this.lgl_locsun[2] = x;
        }


        this.lgl_locsun[0] += this.lgl_locplanet[0];
        this.lgl_locsun[1] += this.lgl_locplanet[1];
        this.lgl_locsun[2] += this.lgl_locplanet[2];
    
        this.lgl_asteroids = prngd.next(0.1);
    }

    lgl_entry(old_planet)
    {
        if(old_planet == null) {
            this.lgl_locentry = this._gendist(g_prngd, 300);
        } else {
            let prngd = new LPRNGD(old_planet.seed + this.seed);
            this.lgl_locentry = this._gendist(prngd, 300);
        }
        this.lgl_locentry[0] += this.lgl_locplanet[0];
        this.lgl_locentry[1] += this.lgl_locplanet[1];
        this.lgl_locentry[2] += this.lgl_locplanet[2];
    }

    /*
     * The market is done on entering the galaxy
     */
    lgl_markets(seed)
    {
        const out = [];
        // seed is between 0 and 255

        let prngd = new LPRNGD((seed * 256) + this.number);

        let tnum = 0;
        let supdem = EDB_SUPPLY_DEMAND[this.economy];
        let sup = supdem[0];
        let dem = supdem[1];
        let eco = this.economy;

        function _sd(a, m) { if (m == -1) return false; else {if (a == (eco & m)) return true; else return false;}}

        let tidx = 0;
        for(let trade of EDB_TRADE) {
            let price = trade[1];
            let variance = trade[4];
            price *= 1 + variance -  prngd.next(2 * variance)
            let mask = trade[5];
            let supply = _sd(trade[2], mask);
            let demand = _sd(trade[3], mask);
            if(supply) {
                price *=  1 - (variance + prngd.next(variance/ 2));
            }
            if(demand) {
                price *=  1 + variance + prngd.next(variance / 2);
            }

            price = Math.round(price * 100) / 100;

            let tax = 1 + this.government;
            out.push([Math.round(price * (100 + tax)) / 100, Math.round(price * (100 - tax)) / 100]);
            tidx += 1;
        }
        return out;
    }
    // Stock done when entering system

    lgl_police()
    {
        return this.government;
    }
}

function drawplanets(cmdr)
{
    let c = document.getElementById("canvas");
    let ctx = c.getContext("2d");
    cmdr.lgl_drawgalaxy(ctx);
}


function doonload()
{
    
    let cmdr = new ECommander();
    let plan = cmdr.planet;
    cmdr.save(0);
    drawplanets(cmdr);
    
}

class EDWorld {
    static make(ctx, seed)
    {
        this.ctx = ctx;
        this.prng = new LPRNG(seed);
        this.ocean();
        this.continents();
        this.mountains();
        this.icecap();
    }
    static ocean()
    {
        this.ctx.fillStyle = this._getcolor();
        this.ctx.fillRect(0, 0, 1024, 512);
    }
    static continents()
    {
        const prng = this.prng;
        let numc = 10 + prng.next(30);
        let col = this._getcolor();
        for(var i = 0; i < numc; i++) {
            var size = 50 + prng.next(50);
            var inlet = 10 + prng.next(40);
            this.drawcountry(prng.next(1024), prng.next(512), size, inlet, 20 + prng.next(50), col);
        }
    }
    static icecap()
    {
        const ctx = this.ctx;
        const prng = this.prng;
        var bx = sx;
        var by = sy;
        var col = this._getcolor();
        ctx.beginPath();
        ctx.moveTo(sx, sy);

        var height = 50 + prng.next(50);
        var vheight = 10 + prng.next(7);

        var sx = 0;
        var sy = height + prng.next(vheight);

        var inlet = prng.next(11);
        var segments = 10 + prng.next(20);
        for(var i = 0; i < segments; i++) {
    
            var mx = bx + prng.next(inlet);
            var my = by + prng.next(inlet);
            var nx = bx + prng.next(inlet);
            var ny = by + prng.next(inlet);

            bx = Math.round(i * 1024 / segments);
            by = height + prng.next(vheight);

            ctx.bezierCurveTo(mx, my, nx, ny, bx, by);
        }
        var mx = bx + prng.next(inlet);
        var my = by + prng.next(inlet);
        var nx = bx + prng.next(inlet);
        var ny = by + prng.next(inlet);
        ctx.bezierCurveTo(mx, my, nx, ny, 1024, sy);
        ctx.lineTo(1024, 0);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, sy);
        ctx.fillStyle = col;
        ctx.fill();

        var sx = 0;
        var sy = (512 - height) - prng.next(vheight);
        var bx = sx;
        var by = sy;
        ctx.beginPath();
        ctx.moveTo(sx, sy);

        for(var i = 0; i < segments; i++) {
    
            var mx = bx + prng.next(inlet);
            var my = by - prng.next(inlet);
            var nx = bx + prng.next(inlet);
            var ny = by - prng.next(inlet);

            bx = Math.round(i * 1024 / segments);
            by = (512 - height)  - prng.next(vheight);

            ctx.bezierCurveTo(mx, my, nx, ny, bx, by);
        }
        var mx = bx + prng.next(inlet);
        var my = by - prng.next(inlet);
        var nx = bx + prng.next(inlet);
        var ny = by - prng.next(inlet);
        ctx.bezierCurveTo(mx, my, nx, ny, 1024, sy);
        ctx.lineTo(1024, 512);
        ctx.lineTo(0, 512);
        ctx.lineTo(0, sy);
        ctx.fillStyle = col;
        ctx.fill();
    }

    static mountains()
    {
        const ctx = this.ctx;
        const prng = this.prng;
        const col = this._getcolor();
        for(var i = 0; i < 100 + prng.next(900); i++)
        {
            var size = 1 + prng.next(5);
            var inlet = 4 + prng.next(4);
            this.drawmountain(size + inlet + prng.next(1024 - (2 * (inlet + size))),
                              size + inlet + prng.next(512 - (2 * (inlet + size))), 1 + prng.next(5), size, inlet, col);
        }
    }
            

    static drawcountry(xpos, ypos, size, inlet, segments, col)
    {
        const prng = this.prng;
        const ctx = this.ctx;

        var i2 = (inlet * 2) + 1;

        var points = [];

        var sx = xpos;
        var sy = ypos + prng.next(size);

        var bx = sx;
        var by = sy;

        var mx = 0;
        var my = 0;

        var nx = 0;
        var ny = 0;


        var begin = [bx, by];
    
        for(var i = 0; i < segments; i++) {
        
            bx = Math.round(size * Math.sin(i * LR360 / segments)) + xpos;
            by = Math.round(size * Math.cos(i * LR360 / segments)) + ypos;
    
            mx = bx + (inlet - prng.next(i2));
            my = by + (inlet - prng.next(i2));
            nx = bx + (inlet - prng.next(i2));
            ny = by + (inlet - prng.next(i2));

            bx += (inlet - prng.next(i2));
            by += (inlet - prng.next(i2));
            points.push([mx, my, nx, ny, bx, by]);
        }
        mx = bx + (inlet - prng.next(i2));
        my = by + (inlet - prng.next(i2));
        nx = bx + (inlet - prng.next(i2));
        ny = by + (inlet - prng.next(i2));
        points.push([mx, my, nx, ny, sx, sy]);

        function _dodraw(xoff)
        {
            ctx.beginPath();
            ctx.moveTo(begin[0] + xoff, begin[1]);
            for (let p of points)
                ctx.bezierCurveTo(p[0] + xoff, p[1], p[2] + xoff, p[3], p[4] + xoff, p[5]);
            ctx.fillStyle = col;
            ctx.fill();
        }
        _dodraw(0);

        if(xpos + size + inlet > 1024) _dodraw(-1024);
        if(xpos - (size + inlet) < 0) _dodraw(1024);
    }

    static drawmountain(xpos, ypos, size, inlet, segments, col)
    {
        const prng = this.prng;
        const ctx = this.ctx;

        var i2 = (inlet * 2) + 1;


        var sx = xpos;
        var sy = ypos + prng.next(size);

        var bx = sx;
        var by = sy;

        var mx = 0;
        var my = 0;

        var nx = 0;
        var ny = 0;

    
        ctx.beginPath();
        ctx.moveTo(bx, by);
        for(var i = 0; i < segments; i++) {
        
            bx = Math.round(size * Math.sin(i * LR360 / segments)) + xpos;
            by = Math.round(size * Math.cos(i * LR360 / segments)) + ypos;
    
            mx = bx + (inlet - prng.next(i2));
            my = by + (inlet - prng.next(i2));
            nx = bx + (inlet - prng.next(i2));
            ny = by + (inlet - prng.next(i2));

            bx += (inlet - prng.next(i2));
            by += (inlet - prng.next(i2));
            ctx.bezierCurveTo(mx, my, nx, ny, bx, by);
        }
        mx = bx + (inlet - prng.next(i2));
        my = by + (inlet - prng.next(i2));
        nx = bx + (inlet - prng.next(i2));
        ny = by + (inlet - prng.next(i2));
        ctx.bezierCurveTo(mx, my, nx, ny, sx, sy);
        ctx.fillStyle = col;
        ctx.fill();
    }

    static _getcolor()
    {
        const prng = this.prng;
        return "rgb(" + (30 + prng.next(226)).toString() + ", "  + (30 + prng.next(226)).toString() + ", " + (30 + prng.next(226)).toString() + ")"
    }
}


class EDSun {
    static make(ctx, seed)
    {
        this.prng = new LPRNG(seed);
        // this.prng = new LPRNG(Math.floor(Math.random() * 10000));
        this.ctx = ctx;
        this.ctx.fillStyle = this._getcolor();
        this.ctx.fillRect(0, 0, 1024, 512);
        this.spots();
    }
    static spots()
    {
        const prng = this.prng;
        const ctx = this.ctx;
        var col = this._getcolor();
        for(let i = 0; i < 1000; i++)
        {
            this.drawspot(prng.next(1024), prng.next(512), 1 + prng.next(6), 3 + prng.next(3),  4 + prng.next(4), col);
        }
        var col = this._getcolor();
        for(let i = 0; i < 1000; i++)
        {
            this.drawspot(prng.next(1024), prng.next(512), 1 + prng.next(6), 3 + prng.next(3),  4 + prng.next(4), col);
        }
        var col = this._getcolor();
        for(let i = 0; i < 1000; i++)
        {
            this.drawspot(prng.next(1024), prng.next(512), 1 + prng.next(6), 3 + prng.next(3),  4 + prng.next(4), col);
        }
    }
    static drawspot(xpos, ypos, size, inlet, segments, col)
    {
        const prng = this.prng;
        const ctx = this.ctx;

        var i2 = (inlet * 2) + 1;


        var sx = xpos;
        var sy = ypos + prng.next(size);

        var bx = sx;
        var by = sy;

        var mx = 0;
        var my = 0;

        var nx = 0;
        var ny = 0;

        let xslew = Math.cos((256 - ypos) / 512);
        if(xslew == 0) xslew = 0.1;

        xslew = 1 / xslew;

    
        ctx.beginPath();
        ctx.moveTo(bx * xslew, by);
        for(var i = 0; i < segments; i++) {

            bx = Math.round(xslew * size * Math.sin(i * LR360 / segments)) + xpos;
            by = Math.round(size * Math.cos(i * LR360 / segments)) + ypos;

    
            mx = bx + (inlet - prng.next(i2));
            my = by + (inlet - prng.next(i2));
            nx = bx + (inlet - prng.next(i2));
            ny = by + (inlet - prng.next(i2));

            bx += (inlet - prng.next(i2));
            by += (inlet - prng.next(i2));
            ctx.bezierCurveTo(mx, my, nx, ny, bx, by);
        }
        mx = bx + (inlet - prng.next(i2));
        my = by + (inlet - prng.next(i2));
        nx = bx + (inlet - prng.next(i2));
        ny = by + (inlet - prng.next(i2));
        ctx.bezierCurveTo(mx, my, nx, ny, sx, sy);
        ctx.fillStyle = col;
        ctx.fill();
    }

    static _getcolor()
    {
        const prng = this.prng;
        return "rgb(" + (200 + prng.next(56)).toString() + ", "  + (200 + prng.next(56)).toString() + ", " + (200 + prng.next(56)).toString() + ")"
    }
}

class EDStars {
    static ctx = null;
    static prng = null;

    static make(ctx, seed)
    {
        let prngd = new LPRNGD(seed);
        let prng = new LPRNG(seed);


        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 8192, 4096);


        function _putstar(px, py)
        {
            if(py == 0) py = 1;
            let ss = prng.next(3);
            let sx = Math.round(ss / Math.cos(LR90 * py / 2048));
            if(sx < 0) sx = 0 - sx;
            if(sx == 0) sx = 1;

            py += 2048;

            let scol = "rgb(" + (230 + prng.next(26)).toString() + ", "  + (230 + prng.next(26)).toString() + ", " + (230 + prng.next(26)).toString() + ")"

            ctx.beginPath();

            let rx = px + sx;
            let lx = px - sx;
            let by = py + ss;
            let ty = py - ss;

            switch(ss) {
            case 1:
                ctx.strokeStyle = scol;
                ctx.moveTo(px, py);
                ctx.lineWidth = 1;
                ctx.lineTo(px, py);
                ctx.stroke();
                break;
            default:
                ctx.fillStyle = scol;
                ctx.moveTo(px, ty);
                ctx.lineTo(rx, py);
                ctx.lineTo(px, by);
                ctx.lineTo(lx, py);
                ctx.lineTo(px, ty);
                ctx.fill();
                break;
            }
        }
        
        for(let i = 0; i < 5000; i++)
        {

            // var r = LR180 - prngd.next(LR360);  // Radius - random
            let r = prngd.next(8192);  // Radius - random
            var y = prngd.next(1);
            y = y * y * y * 1700;      // Near 0 
            if(prng.next(2) == 0) y = 0 - y;

            _putstar(r, y);
            if(r < 2) _putstar(8192 + r, y);
            if(r > 8190) _putstar(8192 - r, y);
        }
    }
}


class EDStation {

    static ctx = null;
    static prng = null;
    static assets = null;

    static make(assets, ctx, seed)
    {
        let prng = new LPRNG(seed);

        this.ctx = ctx;
        this.prng = prng;
        this.assets = assets;

        this.sides();
        this.floors();
        this.ends();

    }
    static sides()
    {
        
        let ctx = this.ctx;
        let prng = this.prng;
        let assets = this.assets;

        let red = 64 + prng.next(64);
        let green = 64 + prng.next(64);
        let blue = 64 + prng.next(64);
        
        ctx.fillStyle = "rgb(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ")";
        ctx.fillRect(0, 0, 4096, 520);
        for(let i = 0; i < 8; i++)
        {
            let num = prng.next(10);
            if(num < 8) {
                ctx.drawImage(assets.getimage("ad" + (num + 1).toString()), 103 + (512 * i), 312, 300, 150);
            }
        }
        ctx.rotate(LR180);
        for(let i = 0; i < 8; i++)
        {
            let num = prng.next(10);
            if(num < 8) {
                ctx.drawImage(assets.getimage("ad" + (num + 1).toString()), 103 - (512 * i), -(212), 300, 150);
            }
        }
        ctx.rotate(LR180);

    }
    static floors()
    {
        let ctx = this.ctx;
        let prng = this.prng;

        let red = 48 + prng.next(48);
        let green = 48 + prng.next(48);
        let blue = 48 + prng.next(48);

        ctx.fillStyle = "rgb(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ")";
        ctx.fillRect(0, 512, 2048, 2048);

        this.squares(0, 512);

        red = 48 + prng.next(24);
        green = 48 + prng.next(24);
        blue = 48 + prng.next(24);

        ctx.fillStyle = "rgb(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ")";
        ctx.fillRect(2048, 512, 2048, 2048);

        this.squares(2048, 512);

    }

    static squares(bx, by)
    {
        let ctx = this.ctx;
        let prng = this.prng;
        
        for(let i = 0; i < 50 + prng.next(50); i++) {
            let red = 48 + prng.next(24);
            let green = 48 + prng.next(24);
            let blue = 48 + prng.next(24);

            ctx.fillStyle = "rgb(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ")";
            ctx.fillRect(bx + prng.next(2048), prng.next(2048) + by, 1 + prng.next(512), prng.next(512));

        }
    }

    static ends()
    {
        let ctx = this.ctx;
        let prng = this.prng;

        let red = 48 + prng.next(48);
        let green = 48 + prng.next(48);
        let blue = 48 + prng.next(48);

        ctx.fillStyle = "rgb(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ")";
        ctx.fillRect(2048, 2560, 2048, 1024);

        this.beams(2048, 2560);

        red = 48 + prng.next(48);
        green = 48 + prng.next(48);
        blue = 48 + prng.next(48);

        ctx.fillStyle = "rgb(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ")";
        ctx.fillRect(0, 2560, 2048, 1024);

        red = 208 + prng.next(48);
        green = 208 + prng.next(48);
        blue = 208 + prng.next(48);

        ctx.fillStyle = "rgb(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ")";
        ctx.fillRect(853, 2970, 342, 204);


    }
    static beams(bx, by)
    {
        let ctx = this.ctx;
        let prng = this.prng;
        let red = 100 + prng.next(64);
        let green = 100 + prng.next(64);
        let blue = 100 + prng.next(64);

        let depth = 8;


        let icrnh = 854;
        let icrnv = 410;

        let fill = "rgb(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ")"
        this.diags(fill, 2048, 2048 + icrnh, 2560, 2560 + icrnv, depth, true);
        this.diags(fill, 4096 - icrnh, 4096, 2560, 2560 + icrnv, depth, false);
        this.diags(fill, 2048, 2048 + icrnh, 3584 - icrnv, 3584, depth, false);
        this.diags(fill, 4096 - icrnh, 4096, 3584 - icrnv, 3584, depth, true);

        ctx.fillRect(2894, 2962,  10, 214);
        ctx.fillRect(3240, 2962,  10, 214);

        ctx.fillRect(2894, 2962,  351, 10);
        ctx.fillRect(2894, 3176,  351, 10);
    }

    static diags(fill, l, r, t, b, depth, fwd)
    {

        let ctx = this.ctx;


        ctx.beginPath();
        if(fwd) {
            ctx.moveTo(l + depth, t - depth);
            ctx.lineTo(r + depth, b - depth);
            ctx.lineTo(r - depth, b + depth);
            ctx.lineTo(l - depth, t + depth);
            ctx.lineTo(l + depth, t - depth);
        } else {
            ctx.moveTo(r - depth, t - depth);
            ctx.lineTo(l - depth, b - depth);
            ctx.lineTo(l + depth, b + depth);
            ctx.lineTo(r + depth, t + depth);
            ctx.lineTo(r - depth, t - depth);
        }
        ctx.fillStyle = fill;
        ctx.fill();
        
    }
}



export {
    EDB_TRADE_LENGTH,
    EDB_T_ALLOYS,
    EDB_T_MINERALS,
    EDB_T_SILVER,
    EDB_T_GOLD,
    EDB_T_PLATINUM,
    EDB_T_SLAVES,
    EDB_T_ILLEGALS,
    EDB_T_ILLEGALS_LENGTH,
    EDB_T_THARGON,
    ECommander,
    EDWorld,
    EDSun,
    EDStars,
    EDStation
}

