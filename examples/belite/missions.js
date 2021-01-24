"use strict";

/*
 * These are diuplicated from belite.js
 */

import {lElement} from "../../libs/limpetge.js";

const S_DOCK = 0;     // To dock (from save)
const S_SPACE = 1;   // To space (from jump)
const S_HOME = 2;   // To space at station
const S_JUMP = 3; // To jump from space
const S_KJUMP = 4; // To jump from space
const S_TOHYPER = 5; // To hyper
const S_FROMHYPER = 6; // From Hyper
const S_LOCK = 7;   // From jump space to here instigated by lock
const S_CRASH = 8;   // From jump space - Crashing!!

/*
When initialisation of program, get appropriate mission on init
*/

function mission_get(cmdr)
{
    if(cmdr.mission_number >= missions.length) return null;
    return missions[cmdr.mission_number];
}

function mission_next(cmdr)
{
    cmdr.mission_number += 1;
    cmdr.mission_state = 0;
    return mission_get(cmdr);
}


class MissionBase {
    constructor() { }

    /*
    The op_mission called when landing at a station in the mission
    */
    op_mission(scene) { return false;}

    /*
     * Display last message in case I forgot
     */
    last_message(scene) { return false;}


    /*
    The jump_init called when loading the JumpScene 
     */
    jump_init(scene) { }

        
    /*
    The jump_tweak called when looping jump scene
     */
    jump_tweak(scene) { }

    /*
    The normal_init called when loading the Normal scene
     */
    normal_init(player, scene, g_prng) {return 0; }

        
    /*
    The jump_tweak called when looping Normal scene
     */
    normal_tweak(scene) { }

    explode(scene, ship) { }
}

const ConstrictorMission = function()
{
    /*
    Messages
    */
    const CONSTRICTOR_PRE_A = "".concat(
        "Greetings Commander, I am Captain Curruthers of ",
        "Her Majesty's Space Navy and I beg a moment of your ",
        "valuable time.  We would like you to do a little job ",
        "for us.  The ship you see here is a new model, the ",
        "Constrictor, equiped with a top secret new shield ",
        "generator.  Unfortunately it's been stolen.  ");
    
    const CONSTRICTOR_PRE_B0 =  "".concat(
        "It went missing from our ship yard on Xeer five months ago ",
        "and was last seen at Reesdice. Your mission should you decide ",
        "to accept it, is to seek and destroy this ship. You are ",
        "cautioned that only Military or Power Lasers will get through the new ",
        "shields and that the Constrictor is fitted with an E.C.M. ",
        "System. Good Luck, Commander.");
    
    const CONSTRICTOR_PRE_B1 =  "".concat(
        "It went missing from our ship yard on Xeer five months ago ",
        "and is believed to have jumped to this galaxy. ",
        "Your mission should you decide to accept it, is to seek and ",
        "destroy this ship. You are cautioned that only Military or Power Lasers ",
        "will get through the new shields and that the Constrictor is ",
        "fitted with an E.C.M. System. Good Luck, Commander.");
    
    const CONSTRICTOR_OPS = {
        xeer: "THE CONSTRICTOR WENT MISSING FROM XEER, COMMANDER.",
        reesdice: "THE CONSTRICTOR WAS LAST SEEN AT REESDICE, COMMANDER.",
        arexe: "A STRANGE LOOKING SHIP LEFT HERE A WHILE BACK. LOOKED BOUND FOR AREXE.",
        galactic: "YEP, AN UNUSUAL NEW SHIP HAD A GALACTIC HYPERDRIVE FITTED HERE, USED IT TOO.",
        errius: "I HEAR A WEIRD LOOKING SHIP WAS SEEN AT ERRIUS.",
        inbibe: "THIS STRANGE SHIP DEHYPED HERE FROM NOWHERE, SUN SKIMMED AND JUMPED. I HEAR IT WENT TO INBIBE.",
        ausar: "ROGUE SHIP WENT FOR ME AT AUSAR. MY LASERS DIDN'T EVEN SCRATCH ITS HULL.",
        usleri: "OH DEAR ME YES. A FRIGHTFUL ROGUE WITH WHAT I BELIEVE YOU PEOPLE CALL A LEAD POSTERIOR SHOT UP LOTS OF THOSE BEASTLY PIRATES AND WENT TO USLERI.",
        orarra: "YOU CAN TACKLE THE VICIOUS SCOUNDREL IF YOU LIKE. HE'S AT ORARRA.",
        here: "THERE'S A REAL DEADLY PIRATE OUT THERE.",
        wrong: "BOY ARE YOU IN THE WRONG GALAXY!",
        thisgal: "RUMOUR HAS IT A WEIRD BAD_ASS SHIP HAS ENTERED THIS GALAXY",
        onegal: "I AM SURE GLAD THAT DAMN SHIP JUMPED OUT OF THIS GALAXY",
        nextgal: "THE UNUSUAL SHIP HAD A GALACTIC HYPERDRIVE FITTED AND USED IT"
    };
    const CONSTRICTOR_DEBRIEF = "".concat(
	    "There will always be a place for you in Her Majesty's Space Navy. ",
	    "And maybe sooner than you think... ---MESSAGE ENDS.");
    
    
    class _ConstrictorMission extends MissionBase {
        constructor()
        {
            super();
        }
    
        op_mission(scene)
        {
            let cmdr = scene.commander;
            if(cmdr.mission_state == 0 && cmdr.score >= 256 && cmdr.galaxy_number < 2) {
                cmdr.mission_state = 1;
                let player = scene.player;
                if(cmdr.galaxy_number == 0) {
                    var message = lElement("div", {}, CONSTRICTOR_PRE_A + CONSTRICTOR_PRE_B0);
                } else {
                    var message = lElement("div", {}, CONSTRICTOR_PRE_A + CONSTRICTOR_PRE_B1);
                }

                message = lElement("div", {}, "", [
                    message,
                    lElement("div", {style: "width:100%;text-align: center"}, "", [
                        lElement("img", {src: "belite/constrictor.gif"}, "", [])
                    ])
                ]);
                player.missionmess = lElement("div", {}, "", [
                    lElement("div", {style: "font-size: 120%;text-align: center"}, "INCOMING MESSAGE"),
                    lElement("br", {}),
                    message]);
                return true;
            }
            if(cmdr.mission_state == 20) {
                player.missobj = mission_next(cmdr);
                player.missionmess = lElement("div", {}, CONSTRICTOR_DEBRIEF);
                return true;
            }
            
            if(cmdr.mission_state > 0 && cmdr.mission_state < 10) {
                let key = "_NONE";
                switch(cmdr.galaxy_number) {
                case 0:
                    switch(cmdr.planet_number) {
                    case 150:
                        if(cmdr.mission_state < 2) {
                            key = "reesdice";
                            cmdr.mission_state = 2;
                        }
                        break;
                    case 36:
                        if(cmdr.mission_state < 3) {
                            key = "arexe";
                            cmdr.mission_state = 3;
                        }
                        break;
                    case 28:
                        if(cmdr.mission_state < 4) {
                            key = "galactic";
                            cmdr.mission_state = 4;
                        }
                        break;
                    default:
                        break;
                    }
                    break;
                case 1:
                    switch(cmdr.planet_number) {
                    case 32:
                    case 68:
                    case 164:
                    case 220:
                    case 106:
                    case 16:
                    case 162:
                    case 3:
                    case 107:
                    case 26:
                    case 192:
                    case 184:
                    case 5:
                        if(cmdr.mission_state < 5) {
                            cmdr.mission_state = 5;
                            key = "errius";
                        }
                        break;
                    case 253:
                        if(cmdr.mission_state < 6) {
                            cmdr.mission_state = 6;
                            key = "inbibe";
                        }
                        break;
                    case 79:
                        if(cmdr.mission_state < 7) {
                            cmdr.mission_state = 7;
                            key = "ausar";
                        }
                        break;
                    case 53:
                        if(cmdr.mission_state < 8) {
                            cmdr.mission_state = 8;
                            key = "usleri";
                        }
                        break;
                    case 118:
                        if(cmdr.mission_state < 9) {
                            cmdr.mission_state = 9;
                            key = "orarra";
                        }
                        break;
                    case 193:
                        if(cmdr.mission_state <= 10) {
                            cmdr.mission_state = 10;
                            key = "here";
                        }
                        break;
                    default:
                        break;
                    }
                    break;
                case 2:
                    if(cmdr.planet_number == 101) key = "wrong";
                    break;
                }
                if(key in CONSTRICTOR_OPS) {
                    scene.player.missionmess = lElement("div", {}, CONSTRICTOR_OPS[key]);
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
        last_message(scene)
        {
            let cmdr = scene.commander;

            if(cmdr.mission_state == 0) return false;
            let key = "";
            switch(cmdr.galaxy_number) {
            case 0:
                switch(cmdr.mission_state) {
                case 1: key = "xeer"; break;
                case 2: key = "reesdice"; break;
                case 3: key = "arexe"; break;
                default: key = "nextgal"; break;
                }
                break;
            case 1:
                switch(cmdr.mission_state) {
                case 1:
                case 2:
                case 3:
                case 4:
                    key = "thisgal";
                    break;
                case 5: key = "errius";break;
                case 6: key = "inbibe";break;
                case 7: key = "ausar";break;
                case 8: key = "usleri";break;
                case 9: key = "orarra";break;
                case 10: key = "orarra";break;
                }
                break;
            default:
                key = "wrong";
                break;
            }
            if(key in CONSTRICTOR_OPS) {
                scene.player.missionmess = lElement("div", {}, CONSTRICTOR_OPS[key]);
                return true;
            } else {
                return false;
            }
        }
        normal_init(player, scene, g_prng)
        {
            let cmdr = player.commander;
            if(cmdr.galaxy_number == 1 && cmdr.planet_number == 193 && scene.cmode == S_LOCK && cmdr.mission_state < 11)
            {
                if(g_prng.next(2) == 0) {
                    return 1;
                }
            }
            return 0;
        }
        explode(scene, ship)
        {
            let cmdr = scene.player.commander;
            cmdr.mission_state = 20;
        }
    }
    return _ConstrictorMission;
}();

const ThargoidMission = function()
{
    const MESS_A = "".concat(
        "Attention Commander, I am Captain Fortesque of Her Majesty's Space Navy. ",
	    "We have need of your services again. If you would be so good as to go to ",
	    "Ceerdi you will be briefed.If succesful, you will be rewarded. ---MESSAGE ENDS,");

    const MESS_B1 = "".concat(
	    "Good Day Commander. I am Agent Blake of Naval Intelligence. As you know, ",
	    "the Navy have been keeping the Thargoids off your ass out in deep space ",
	    "for many years now. Well the situation has changed. Our boys are ready ",
	    "for a push right to the home system of those murderers.");

    const MESS_B2 = "".concat(
	    "I have obtained the defence plans for their Hive Worlds. The beetles ",
	    "know we've got something but not what. If I transmit the plans to our ",
	    "base on Birera they'll intercept the transmission. I need a ship to ",
	    "make the run. You're elected. The plans are unipulse coded within ",
	    "this transmission. You will be paid. Good luck Commander. ---MESSAGE ENDS.");

    const MESS_DEBRIEF = "".concat(
	    "You have served us well and we shall remember. ",
	    "We did not expect the Thargoids to find out about you.",
	    "For the moment please accept this Enhanced Extra Energy Converter as payment. ",
	    "---MESSAGE ENDS.");

    class _ThargoidMission extends MissionBase {
        constructor()
        {
            super();
        }

        op_mission(scene)
        {
            let cmdr = scene.commander;
            if(cmdr.mission_state == 0 && cmdr.score >= 1280 && cmdr.galaxy_number == 2) {
                cmdr.mission_state = 1;
                let message = lElement("div", {}, MESS_A, []);
                scene.player.missionmess = lElement("div", {}, "", [
                    lElement("div", {style: "font-size: 120%;text-align: center"}, "INCOMING MESSAGE"),
                    lElement("br", {}),
                    message]);
                return true;
            }

            if(cmdr.mission_state == 1 && cmdr.galaxy_number == 2 && cmdr.planet_number == 83) {
                cmdr.mission_state = 2;
                let message = lElement("div", {}, "", [
                    lElement("div", {}, MESS_B1, []),
                    lElement("div", {}, MESS_B2, [])
                ]);
                scene.player.missionmess = lElement("div", {}, "", [
                    lElement("div", {style: "font-size: 120%;text-align: center"}, "INCOMING MESSAGE"),
                    lElement("br", {}),
                    message]);
                return true;
            }

            if(cmdr.mission_state == 2 && cmdr.galaxy_number == 2 && cmdr.planet_number == 36) {
                scene.player.missobj = mission_next(cmdr);
                cmdr.energy_unit |= 1;
                cmdr.lgl_getintegrity(scene.cockpit);
                let message = lElement("div", {}, MESS_DEBRIEF);
                scene.player.missionmess = lElement("div", {}, "", [
                    lElement("div", {style: "font-size: 120%;text-align: center"}, "INCOMING MESSAGE"),
                    lElement("br", {}),
                    message]);
                return true;
            }
        }

        last_message(scene)
        {
            let cmdr = scene.commander;
            switch(cmdr.mission_state) {
            case 1:
                scene.player.missionmess = lElement("div", {}, MESS_A, []);
                break;
            case 2:
                scene.player.missionmess = lElement("div", {}, "", [
                    lElement("div", {}, MESS_B1, []),
                    lElement("div", {}, MESS_B2, [])
                ]);
                break;
            default:
                return false;
                break;
            }
            return true;
        }

        normal_init(player, scene, g_prng)
        {
            let cmdr = scene.commander;
            if(cmdr.mission_state == 2)
                scene.chanceforwitch = 2;
            return 0;
        }
    }
    return _ThargoidMission;
}();
    

const missions = [
    new ConstrictorMission(),
    new ThargoidMission()
    ];

export {mission_get};
