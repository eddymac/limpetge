"use strict";

// A 3d Maze generator
// Used for SL20

import {LPRNG, vec3, mat4, vec4, quat} from "../../libs/limpetge.js";


const XP = 0x0001;
const XN = 0x0002;
const YP = 0x0004;
const YN = 0x0008;
const ZP = 0x0010;
const ZN = 0x0020;
const WALLS = 0x003f
const SL20 = 0x0040;
const PRESL20 = 0x0080;

const USED = 0x0100;
const STARTUSED = 0x0200; 
const ENDUSED = 0x0400;
const DEADEND = 0x0800; // This is part of a "Dead End tunnel"


class Maze {
    constructor(dims, seed)
    {
        if(!seed) seed = Math.floor(Math.random() * 10000);
        var prng = new LPRNG(seed);
        this.prng = prng;
    
        this.dims = vec3.create();
        this.dims = vec3.clone(dims);
    
        var numcells = dims[0] * dims[1] * dims[2];
        var numused = 0;
    
        this.numcells = numcells;
    
        this.walls = [];
    
    
        this.beginhere = vec3.create();
    
        // walln and reverse is f - index
        var walln = [XP, YP, ZP, ZN, YN, XN];
        var vecn = [vec3.fromValues(1, 0, 0), vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 1), vec3.fromValues(0, 0, -1), vec3.fromValues(0, -1, 0), vec3.fromValues(-1, 0, 0)];
    
    
        // Find Where target goes, 2 thirds to oposite corner
    
        var target = vec3.fromValues(Math.floor(2 * dims[0] / 3),Math.floor(2 * dims[1] / 3),Math.floor(2 * dims[2] / 3));
        this.endhere = vec3.clone(target);
    
        var tardir = -1;
        var endtarget = vec3.create();      // This will be the adjacent
        // Find an adjacent
        for(;;) {
            tardir = prng.next(6);
            vec3.add(endtarget, target, vecn[tardir]);  // So you cannot see "into" SL20
            if(!(this.inrange(endtarget))) continue;
            break;
        }
        this.setwall(target, SL20 | (WALLS & (~(walln[tardir]))) | ENDUSED | USED); // Traget sorted
        numused += 1;
    
        var ntardir = -1;
    
        var temptar = vec3.create();
    
        for(;;) {
            ntardir = prng.next(6);
            if(ntardir == tardir || ntardir == (5 - tardir)) continue;    // SL20 or oposite
            vec3.add(temptar, endtarget, vecn[ntardir]);   // Adjacent
            if(!(this.inrange(temptar))) continue;      // Outside
            break;      // Found it
        }
    
        this.setwall(endtarget, USED | ENDUSED | PRESL20 | WALLS & (~(walln[5 - tardir] | walln[ntardir])));   // Set the walls of adjacent to target
        endtarget = temptar;
        this.setwall(endtarget, USED | ENDUSED | WALLS & (~(walln[5 - ntardir])));         // Set walls of new "endtarget
    
        numused += 2;
    
        
        var starttarget = vec3.fromValues(0.0, 0.0, 0.0);       // Start is easy
        this.setwall(starttarget, walln[0] | walln[1] | walln[2] | STARTUSED | USED);   // Build walls - Positive only
        numused += 1;
    
        this.beginhere = vec3.clone(starttarget);        // This is always [0, 0, 0] so maybe remove
    
        // need to advance start by one
    
        var tdir = prng.next(3);
    
        this.delwall(starttarget, walln[tdir]);
        vec3.add(starttarget, starttarget, vecn[tdir]);
        this.setwall(starttarget, USED | STARTUSED | (WALLS & (~(walln[5 - tdir]))));
    
        numused += 1;
    
        // Advancing tunnels
        var met = false;        // Variables to say tunnels have met
        var tunnel = [];        // A list of tunnel locations - used to create spurs
    
        var self = this;
    
        // Function to advance a tunnel
        function advance(curtarget, thisused, otherused)
        {
            var npos;
            for(;;) {   // Loop for start advanced
                var tdir = prng.next(6);
                var fdir =  1;
                if(prng.next(2) == 0) fdir = -1;
                var success = false;
                for(let i = 0; i < 6; i++) {   // See what direction we can go
                    tdir += fdir;
                    if(tdir < 0) tdir += 6;
                    if(tdir >= 6) tdir -= 6;
                    npos = vec3.create();
                    vec3.add(npos, curtarget, vecn[tdir]);
                    if(!(self.inrange(npos))) continue;                         // out of maze
                    else {                                                      // In Maze
                        var wallsit = self.getwall(npos);
                        if((wallsit & thisused) != 0) continue;                 // Crashing into start tunnel (including dead ends)
                        if((wallsit & (SL20 | PRESL20)) != 0) continue;    // Crashing into SL20 or adjacent
                        // Anythong below here is a success - continue
                        if((wallsit & otherused) != 0) {                   // Found other tunnel - Mission complete - met
                            // Bingo!
                            met = true;
                            success = true;
                            self.delwall(npos, walln[5 - tdir]);                    // Remove wall we crashed into
                            self.delwall(curtarget, walln[tdir]);                  // Smash a wall from "start" tunnel
                        } else {                                                  // Other condition - in empty space
                            success = true;
                            self.delwall(curtarget, walln[tdir]);                  // Smash a wall from "start" tunnel
                            self.setwall(npos, USED | thisused | WALLS & ~(walln[5 - tdir])); // Build walls in new cell except for where we came, and set to thisused
                            var tloc = vec3.create();
                            tloc = vec3.clone(npos);
                            tunnel.push(tloc);
                            numused += 1;
                        }
                        if(success) break;
                    }
                }
                if(success) {         // Increased start tunnel 
                    curtarget = npos;
                    break;
                } else {                // Start tunnel cannot go anywhere - dead end - go back
                    self.setwall(curtarget, DEADEND);         // Set self to a Dead End
                    var ssit = self.getwall(curtarget);           // Look at walls
                    var bdir = -1;                              // Direction to go unknown
                    var bvec = vec3.create();
                    for(let j = 0; j < 6; j++) {            // For every direction
                        if((ssit & walln[j]) != 0) continue;      // Wall here - cannot advance
                        vec3.add(bvec, curtarget, vecn[j]);   // Go there
                        if(!(self.inrange(bvec))) continue;         // Out of maze (should never happen - but what the hell)
                        var bsit = self.getwall(bvec);                  // Look at where we are going
                        if((bsit & DEADEND) != 0) continue;         // IF it is back from dead end not interested
                        bdir = j;                                   // Found back
                        j = 6;
                        break;
                    }
                    if(bdir == -1) {            // Should never happen
                        alert("Error crating maze"); 
                        break;
                    }
                    curtarget = bvec;
                }
                if(success) break;  // We have advanced
            }
            return curtarget;
        }
    
        for(;;) {
            starttarget = advance(starttarget, STARTUSED, ENDUSED);     // Advance start
            if(met) break;      // We have built tunnels
            endtarget = advance(endtarget, ENDUSED, STARTUSED);     // Advance end
            if(met) break;      // We have built tunnels
        }
    
        // We have a tunnel from one place to next, in tunnel
        // Now to spur from there
        // A spur will go in a random direction, until it hits someting
    
        function mkspurs(places)
        {
            var spurs = [];
            
            for(;;) {
                var tlen = places.length;
                if(tlen == 0) break;
                var idx = prng.next(tlen);
                var pos = places[idx];
                places.splice(idx, 1);
    
                spurs.push(pos);
        
                for(;;) {
                    var npos = vec3.create();
                    var way = prng.next(6);
        
                    vec3.add(npos, pos, vecn[way]);
                    if(!(self.inrange(npos))) break;        // Out of maze
                    var sit = self.getwall(npos);
                    if((sit & USED) != 0)   break;          // Used
        
                    self.delwall(pos, walln[way]);
                    self.setwall(npos, (WALLS  & (~(walln[5 - way]))) | USED);
                    numused += 1;
                    spurs.push(npos);
                    pos = npos;
                }
            }
            return spurs;
        }
    
        var tl = Math.ceil(numcells * 3 / (dims[0] + dims[1], + dims[2]));
    
        for(let i = 0; i < tl; i++)
            mkspurs(tunnel);
    
        var tvec = vec3.create();
    
        while(numused < numcells) {
            for(let i = 0; i < dims[0]; i++) {
                for(let j = 0; j < dims[1]; j++) {
                    for(let k = 0; k < dims[2]; k++) {
                        var cell = vec3.fromValues(i, j, k);
                        var sit = self.getwall(cell);
                        if((sit & USED) == 0) {
                            var inc = 1;
                            if(prng.next(2) == 0) inc = -1;
                            var way = prng.next(6);
                            var done = false;
                            for(let l = 0; l < 6; l++) {
                                way += inc;
                                if(way < 0) way += 6;
                                if(way >= 6) way -= 6;
                                vec3.add(tvec, cell, vecn[way]);
                                if(!(self.inrange(tvec))) continue;     // outside
                                var nsit = self.getwall(tvec);
                                if((nsit & (SL20 | PRESL20)) != 0) continue;        // Not center or next
                                if((nsit & USED) != 0) {
                                    done = true;
                                    self.setwall(cell, USED | (WALLS & (~(walln[way]))))
                                    self.delwall(tvec, walln[5 - way]);
                                    numused += 1;
                                    l = 6;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    
        // We now have a maze - maybe 
    }
    
    setwall(wall, value)
    {
        var pos = this.walls;
        var ncell = pos[wall[0]];
        if(!ncell) {
            ncell = [];
            pos[wall[0]] = ncell;
        }
        pos = ncell;
        ncell = pos[wall[1]];
        if(!ncell) {
            ncell = [];
            pos[wall[1]] = ncell;
        }
        pos = ncell;
        ncell = pos[wall[2]];
        if(!pos) {
            ncell = 0x0;
        }
        pos[wall[2]] |= value;
    }

    delwall(wall, value)
    {
        var pos = this.walls;
        var ncell = pos[wall[0]];
        if(!ncell) {
            return;
        }
        pos = ncell;
        ncell = pos[wall[1]];
        if(!ncell) {
            return;
        }
        pos = ncell;
        ncell = pos[wall[2]];
        if(!pos) {
            return;
        }
        pos[wall[2]] &= (~value);
    }

    getwall(wall)
    {
        var pos = this.walls;
        var ncell = pos[wall[0]];
        if(!ncell) {
            return 0x0;
        }
        pos = ncell;
        ncell = pos[wall[1]];
        if(!ncell) {
            return 0x0;
        }
        pos = ncell;
        ncell = pos[wall[2]];
        if(!pos) {
            return 0x0;
        }
        return ncell;
    }

    inrange(wall)
    {
        if(wall[0] < 0 || wall[0] >= this.dims[0] || wall[1] < 0 || wall[1] >= this.dims[1] || wall[2] < 0 || wall[2] >= this.dims[2])
            return false;
        else
            return true;
    }
}
    
export {Maze, XP, XN, YP, YN, ZP, ZN, WALLS, SL20, PRESL20, USED, STARTUSED, ENDUSED, DEADEND};
