"use strict";

/*
The LimpetGE Game Engine javascript program

    A set of library functions used for WebGL games
    Copyright (C) 2019  Edward Macnaghten

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

Depends on gl-matrix.js being there

Uses WebGL - cannot really "separate" that using SOLID principals as
it is so intertwined with shaders and so on, it would be
more confusing if it were, however the "application" game stuff
need not be aware of that
*/

const LCANVAS_ID = "limpetge_canvas";

const LR90 = Math.PI / 2;
const LR180 = Math.PI;
const LR270 = Math.PI * 3 / 2;
const LR360 = Math.PI * 2;

// To identify sides

const LI_FRONT = 0;
const LI_BACK = 1;

const LI_SIDE = 2;      // The side for cylinder

const LI_TOP = 2;
const LI_RIGHT = 3;
const LI_BOTTOM = 4;
const LI_LEFT = 5;


// The Static / Dynamic / Collisions

const LSTATIC = 1;
const LDYNAMIC = 2;
const LNONE = 0;

const LBUT_WIDTH = 50;
const LBUT_HEIGHT = 50;

const LMESTIME = 5;     // Time messages appear on screen

// Asset download control

const LASSET_THREADS = 5;
const LASSET_RETRIES = 5;

// Smoothing amount to consolidate near-by vertices
const LOBJFILE_SMOOTH = 10000;
// lGl is global, defined at beginning
// I like it being const, but maybe tidy up sometime

var lGl;
var lCamera = null;
var lScene = null;

const lSScene = {
    directionalVector: vec3.create()
};



var _lStructureNum = 0;
const _lStructures = [];
var _lObjnum = 1;

function LAssets(assets)
{
    this.total = 0;
    this.started = 0;
    this.ended = 0;
    this.succeeded = 0;
    this.failed = 0;

    this.onend = function() {alert("Assets downloaded, need to specify callback");};
    this.inprogress = function() {console.log(this.total, this.started, this.succeeded, this.failed)};

    this.assets = {};
    this.list = [];

    this.next = 0;
    this.data = {};

    for(var name in assets) {
        var asset = assets[name];
        if(typeof(asset) == "string") {
            asset = {url:asset};
        }
        var obj = new _LAsset(name, asset.url, asset.type);
        this.list.push(obj);
        this.assets[name] = obj;
        this.total += 1;
    }
}


LAssets.prototype = {
    constuctor: LAssets,

    download: function(obj)
    {
        if(obj.onend) this.onend = obj.onend;
        if(obj.inprogress) this.inprogress = obj.inprogress;

        var todo = LASSET_THREADS;
        if(this.total < todo) todo = this.total;

        for(var i = 0; i < todo; i++) this.download_next();
    },

    download_next: function()
    {
        var asset = this.list[this.next];
        this.next += 1;

        var self = this;

        function _cb(out)
        {
            if(out.ok) {
                self.succeeded += 1;
                self.ended += 1;
                asset.downloaded = true;
                asset.data = out.data;
                self.data[asset.name] = out.data;
                self.inprogress();
                if(self.ended >= self.total) {
                    self.onend();
                } else if (self.started < self.total) {
                    self.download_next();
                }
            } else if(asset.attempts >= LASSET_RETRIES) {
                self.ended += 1;
                self.failed += 1;
                self.inprogress();
                if(self.ended >= self.total) {
                    self.onend();
                } else if (self.started < self.total) {
                    self.download_next();
                }
            } else {
                asset.attempts += 1;
                self.inprogress();
                asset.download(_cb);
            }
        }
        this.started += 1;
        asset.download(_cb);
    },

    getdata: function(name)
    {
        return this.assets[name].data;
    }
}
               

function _LAsset(name, url, mimetype)
{
    this.name = name;
    this.url = url;
    if(!mimetype) mimetype = /[a-zA_Z0-9]*$/.exec(url)[0].toLowerCase();
    this.mimetype = mimetype;
    this.attempts = 0;
    this.downloaded = false;
    this.data = null;
    this.istext = false;
    if(this.mimetype == "obj") this.istext = true;
}

_LAsset.prototype = {
    constructor: _LAsset,

    download: function(callback)
    {
        // Keep all the "http" stuff here
        var self = this;
        var _cb = function(xhttp) {
            var out = {}
            var data;
            try {
                out.ok = true;
                out.status = parseInt(xhttp.status);
                out.error = xhttp.statusText;
                if(out.status >= 200 && out.status < 400) {
                    if(self.istext)
                        data = xhttp.responseText;
                    else
                        data = xhttp.response;
                    if(!data)
                        out.data = null;
                    else
                        out.data = data;
                }
                else
                {
                    out.error = xhttp.statusText;
                    if (!out.error) {
                        out.error = xhttp.responseText;
                        if(!out.error) {
                            out.error = "Network error occured";
                        }
                        out.error += ": Status: " + out.status.toString();
                    }
                    out.ok = false;
                    out.data = null;
                    out.text = xhttp.responseText;
                }
            } catch(err) {
                out.ok = false;
                out.status = 999;
                out.error = err.message;
                out.data = null;
            }
            return callback(out);
        }

        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
        // if (xhttp.readyState == 4 && xhttp.status == 200) {
        if (xhttp.readyState == 4) {
            _cb(xhttp);
            }
        };
        
        xhttp.open("GET", this.url, true);
        if(this.istext)
            xhttp.responseType = "text";
        else
            xhttp.responseType = "blob";
        xhttp.send();
    }
}
function LAudios(src, num, dbg)
{
    // I should use to get blob then load source
    // at some point
    // In the meantime hopefully browser caches OK
    this.num = num;
    this.audio = [];

    for(var i = 0; i < num; i++)
    {
        this.audio[i] = new Audio();
        if(src instanceof Blob)
            this.audio[i].src = URL.createObjectURL(src);
        else
            this.audio[i].src = src;
    }
    this.idx = 0;
}
LAudios.prototype = {
    constructor: LAudios,
    play: function()
    {
        this.audio[this.idx].play();
        this.idx++;
        if(this.idx >= this.num) this.idx = 0;
    }
}

function LAudioLoop(src)
{
    this.audio = new Audio();
    if (src instanceof Blob)
        this.audio.src = URL.createObjectURL(src);
    else
        this.audio.src = src;
    this.audio.loop = true;
    this.num = 0;
}
LAudioLoop.prototype = {
    constructor: LAudioLoop,
    play: function()
    {
        if(this.num == 0)
            this.audio.play();
        this.num += 1;
    },
    pause: function()
    {
        if(this.num > 0) {
            this.num -= 1;
            if(this.num == 0)
                this.audio.pause();
        }
    },
    stop: function()
    {
        if(this.num != 0) {
            this.num = 0;
            this.audio.pause();
        }
    }
}

function lInit()
{
    window.onresize = lCanvasResize;
    const canvas = document.getElementById(LCANVAS_ID);
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;
    lGl = canvas.getContext("webgl");
    if (!lGl) {
        alert("No WebGL!!");
        return null;
    }

    // Can compile stuff here

    for(var i = 0; i < lShader_objects.length; i++) {
        lShader_objects[i].compile();
    }
        
}

function lClear()
{
    _lStructures.length = 0;
    _lStructureNum = 0;
    _lObjnum = 0;
    lScene = null;
}

function lStructureSetup()
{
    const clen = _lStructures.length;
    for(var i = 0; i < clen; i++) {
        var str = _lStructures[i];
        if(!str.compiled) {
            _lStructures[i].shader.doInitBuffer(str);
            str.compiled = true;
        }
    }
}
// The LScenes class, 
// Register a callback that checks things

function LBase(args)
{
    if(!args) args = {};

    this.lChildren = [];

    // To do - initialise?
    this.lRestart = function () { };     // Not prototype - restart

    if(!args.lDirectionalVector) {
        this.lDirectionalVector = vec3.fromValues(1, 1, 1);
    } else {
        this.lDirectionalVector = vec3.clone(args.lDirectionalVector);
    }
    vec3.normalize(this.lDirectionalVector, this.lDirectionalVector);

    // Objects have gone, so....
    _lObjnum = 0;
    this._lSClear();

    this.lInit();

    this._lTMessage = document.getElementById("lTMessage");
    this._lTTitle = document.getElementById("lTTitle");
    this._lTMestime = 0;

    this._lShaders = {};

    // Collision stuff, all start withj _lC[A-Z]

    var blf = lCoalesce(args.lCFrom, [-1000, -1000, -1000]);
    var trf = lCoalesce(args.lCTo, [1000, 1000, 1000]);
    var rsize = lCoalesce(args.lCSize, 1.0);
    var incsize = lCoalesce(args.lCIncrement, 0.1);
    // Following can change blf and trf
    for(var i = 0; i < 3; i++)
    {
        if(blf[i] > trf[i]) {
            const t = blf[i];
            blf[i] = trf[i];
            trf[i] = t;
        }
    }
    this._lCStaticZones = [];        // Divide things into zones
    this._lCStaticAreas = [];  // Where to put the Static Areas

    this._lCIncsize = incsize;
    this._lCIncsize2 = incsize * incsize;
    this._lCRsize = rsize;
    this._lCRsize2 = rsize * rsize;
    this._lCCleft = blf[0] - rsize;
    this._lCCbottom = blf[1] - rsize;
    this._lCCback = blf[2] - rsize;
    this._lCCtop = trf[1] + rsize;
    this._lCCright = trf[0] + rsize;
    this._lCCfront = trf[2] + rsize;

    this._lCToty = Math.ceil((this._lCCright - this._lCCleft) / rsize);  // Multiply Ys by (Number of xs)
    this._lCTotz = Math.ceil((this._lCCtop - this._lCCbottom) / rsize) * this._lCToty;   // Multiply Zs by


    this._lCDynamicZones = [];

    lScene = this;
    this.lCamera = new LCamera(args);
    this.lDefaultMessage = "Press ? for help";

    this._lSavedObjnum = 0;  // Save object number for switching
    this._lSavedSScene = {};  // Saved lSScene
    this._lTitleString = "";    // The current title
}


LBase.prototype = {
    constructor: LBase,

    lLoop: function(delta) {alert("Need to overwrite this.lLoop(delta)"); return false;},

    lInit: function() { },  // overide to initialise things

    lMain: function()
    {
        
        self = this;
        const children = this.lChildren;

        // Lets compile these

        const draw = function()
        {
            // Clear things up a bit
            lGl.clearColor(0.0, 0.0, 0.0, 1.0);
            lGl.clearDepth(1.0);
            lGl.enable(lGl.DEPTH_TEST);
            lGl.depthFunc(lGl.LEQUAL);
            lGl.enable(lGl.CULL_FACE);
            lGl.clear(lGl.COLOR_BUFFER_BIT | lGl.DEPTH_BUFFER_BIT);
            lGl.enable(lGl.BLEND);
            lGl.blendFunc(lGl.SRC_ALPHA, lGl.ONE_MINUS_SRC_ALPHA);
    
            lCamera.getview();
    
            /*
            const position = mat4.create();
            const clen = children.length;
            for(var i = 0; i < clen; i++) {
                children[i].draw(position);
            }
             */
            self._lSProcess();
        };

        var then = 0;
        lStructureSetup();
        function _mstart(now)
        {
            // Set up then
            then = now * 0.001;
            requestAnimationFrame(_mloop);
        }

        function _mloop(now)
        {
            now *= 0.001;
            const delta = now - then;
            then = now;

            if(self._lTMestime > 0) {
                self._lTMestime -= delta;
                if(self._lTMestime <= 0) {
                    self._lTMestime = 0;
                    self._lTMessage.innerText = self.lDefaultMessage;
                    self._lTMessage.style.color = "lightblue";
                }
            }

            if(self.lLoop(delta))
            {
                draw();
                requestAnimationFrame(_mloop);
            } else {
                // Tidy up?
                lGl.clearColor(0.0, 0.0, 0.0, 1.0);
                lGl.clearDepth(1.0);
                lGl.enable(lGl.DEPTH_TEST);
                lGl.depthFunc(lGl.LEQUAL);
                lGl.clear(lGl.COLOR_BUFFER_BIT | lGl.DEPTH_BUFFER_BIT);
                lScene.lRestart();
            }
        }
        requestAnimationFrame(_mstart);
    },

    lAddChild: function(child, position)
    {
        if(child.parent != null) {
            if(child.parent == this)
                return;
            else;
                child.remove();
        }
        this.lChildren.push(child);
        child.parent = this;
        child.initialPosition = position;

    },

    lPlace: function(child, position)
    {
        // Places at origin then moves to position
        this.lAddChild(child, mat4.create())
        var ve = vec3.create();
        var qu = quat.create();
        mat4.getTranslation(ve, position);
        mat4.getRotation(child.quat, position);
        child.x = ve[0];
        child.y = ve[1];
        child.z = ve[2];
        child.ox = ve[0];
        child.oy = ve[1];
        child.oz = ve[2];
    },
        
    lSetup: function()
    {
        // this.lPos();
        const children = this.lChildren;
        var clen = children.length;
        var out = [];
        for(var i = 0; i < clen; i++) {
            children[i].getStaticCollision(out, mat4.create());
        }
        clen = out.length;
        for (var i = 0; i < clen; i++) {
            const coll = out[i];
            lScene.lCAddStaticArea(coll[0], coll[1], coll[2]);
        }
        lCamera._rotateScene();
    },
    lClear: function()
    {
        // This deregisters all objects as well
        this.lChildren = [];
        this._lSClear();
    },
    lPos: function()
    {
        const position = mat4.create();
        const children = this.lChildren;
        const clen = children.length;
        for(var i = 0; i < clen; i++) {
            children[i].recdraw(position);
        }
    },
    lMessage: function(mes, color)
    {
        var hasmess = true;
        if(!mes) mes = "";
        if(mes == "")  {
            var hasmess = false;
            mes = this.lDefaultMessage;
            color = "lightblue";
        }
        if(!color) color = "red";
        if(this._lTMessage) {
            this._lTMessage.style.color = color;
            this._lTMessage.innerText = mes;
            if(!hasmess)
                this._lTMestime = 0;
            else
                this._lTMestime = LMESTIME;
        }
    },

    lSetTitle: function(title)
    {
        if(this._lTTitle) {
            this._lTTitle.innerText = title;
        }
        this._lTitleString = title;
    },

    // Shader Lists
    _lSAdd: function(obj)
    {
        var structure = obj.structure;
        if(!structure) return;
        var shader = structure.shader;
        if(!shader) return;
        if(!(shader.key in this._lShaders)) 
            this._lShaders[shader.key] = [shader, {}];

        var buffers = this._lShaders[shader.key][1];

        if(!(structure.key in buffers))
            buffers[structure.key] = [structure.buffer, []];

        buffers[structure.key][1].push(obj);
    },

    _lSProcess: function()
    {
        for(var skey in this._lShaders) {
            var shader = this._lShaders[skey];
            var pshader = shader[0];
            var bufs = shader[1]
            pshader.useProgram();
            for(var ikey in bufs) {
                var buf = bufs[ikey];
                var sbuf = buf[0];
                var objs = buf[1];
                pshader.useBuffer(sbuf);
                var olen = objs.length;
                for(var j = 0; j < olen; j++) {
                    var obj = objs[j];
                    if(obj.isvisible)
                        pshader.doDraw(sbuf, obj.position, obj.control);
                }
            }
        }
    },

    /*
    compile: function()
    {
        // Compiles the _lShaders
        for(var skey in this._lShaders) {
            this._lShaders[skey][0].compile();
        }
    },
    */

    _lSClear: function()
    {
        this._lShaders = {};
    },

    lSwitch: function()
    {
        // Switch to this scene
        if(lScene) {
            lScene._lSavedObjnum = _lObjnum;
            lScene._lSavedSScene = {};
            for(var key in lSScene) {
                lScene._lSavedSScene[key] = lSScene[key];
            }
        }
        _lObjnum = this._lSavedObjnum;
        lCamera = this.lCamera;
        lSScene = {};
        for(var key in this._lSavedSScene) {
            lSScene[key] = this._lSavedSScene[key];
        }
        lScene = this;
        this.lSetTitle(this._lTitleString);
    },


    // The Collision Stuff

    lCAddStaticArea: function(ca, cb, obj)
    {
        // Area to add

        // Sewap things if neccessary

        const zones = this._lCStaticZones;
        const self = this;

        for(var i = 0; i < 3; i++)
        {
            if(ca[i] > cb[i]) {
                const t = ca[i];
                ca[i] = cb[i];
                cb[i] = t;
            }
        }

        const area = [ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], obj];

        // Put it straight in zone coordinates

        var aleft = Math.floor((ca[0] - this._lCCleft) / this._lCRsize)
        var abottom = Math.floor((ca[1] - this._lCCbottom) / this._lCRsize)
        var aback = Math.floor((ca[2] - this._lCCback) / this._lCRsize)
        var aright = Math.floor((cb[0] - this._lCCleft) / this._lCRsize)
        var atop = Math.floor((cb[1] - this._lCCbottom) / this._lCRsize)
        var afront = Math.floor((cb[2]- this._lCCback)  / this._lCRsize)

        // To do this, and avoid duplicates, create an initial sparse array
        // then put that in duplicates

        const tzone = [];

        function _az(x, y, z)
        {
            tzone[self._lCGetpidx(x, y, z)] = true;
        }

        // Eight corners, four entries each

        const rax = []; rax[-1] = aleft;   rax[1] = aright;
        const ray = []; ray[-1] = abottom; ray[1] = atop;
        const raz = []; raz[-1] = aback;   raz[1] = afront;

        function _caz(dx, dy, dz)
        {
            const x = rax[dx];
            const y = ray[dy];
            const z = raz[dz];

            _az(x, y, z);
            _az(x + dx, y, z);
            _az(x, y + dy, z);
            _az(x, y, z + dz);
            _az(x, y + dy, z + dz);
            _az(x + dx, y, z + dz);
            _az(x + dx, y + dy, z);
            _az(x + dx, y + dy, z + dz);
        }
        for(var i = -1; i < 2; i += 2) {
            for(var j = -1; j < 2; j += 2) {
                for(var k = -1; k < 2; k += 2) {
                    _caz(i, j, k);
                }
            }
        }
        // 12 Edges ( not doing corners)

        function _eaz(x, dx, y, dy, z, dz)
        {
            _az(x, y, z);
            if(dx == 0) {
                _az(x, y, z + dz);
                _az(x, y + dy, z);
                _az(x, y + dy, z + dz);
            }
            if(dy == 0) {
                _az(x, y, z + dz);
                _az(x + dx, y, z);
                _az(x + dx, y, z + dz);
            }
            if(dz == 0) {
                _az(x, y + dy, z);
                _az(x + dx, y, z);
                _az(x + dx, y + dy, z);
            }
        }

        for(var x = aleft + 1; x <= aright - 1; x++) {
            _eaz(x, 0, abottom, -1, aback, -1);
            _eaz(x, 0, atop,     1, aback, -1);
            _eaz(x, 0, abottom, -1, afront, 1);
            _eaz(x, 0, atop,     1, afront, 1);
        }
        for(var y = abottom + 1; y <= atop - 1; y++) {
            _eaz(aleft, -1, y, 0, aback, -1);
            _eaz(aright, 1, y, 0, aback, -1);
            _eaz(aleft, -1, y, 0, afront, 1);
            _eaz(aright, 1, y, 0, afront, 1);
        }
        for(var z = aback + 1; z <= afront - 1; z++) {
            _eaz(aleft, -1, abottom, -1, z, 0);
            _eaz(aright, 1, abottom, -1, z, 0);
            _eaz(aleft, -1, atop, 1, z, 0);
            _eaz(aright, 1, atop, 1, z, 0);
        }

        // 6 Faces, (Not doing edges), but inside as well

        for(var y = abottom + 1; y <= atop - 1; y++) {
            for(var z = aback + 1; z <= afront - 1; z++) {
                _az(aleft, y, z);
                _az(aleft - 1, y, z);
                _az(aleft + 1, y, z);   // Inside
                _az(aright, y, z);
                _az(aright + 1, y, z);
                _az(aright - 1, y, z);  // Inside
            }
        }
        for(var x = aleft + 1; x <= aright - 1; x++) {
            for(var z = aback + 1; z <= afront - 1; z++) {
                _az(x, abottom, z);
                _az(x, abottom - 1, z);
                if(x != aleft && x != aright)
                    _az(x, abottom + 1, z); // Inside
                _az(x, atop, z);
                _az(x, atop + 1, z);
                if(x != aleft && x != aright)
                    _az(x, atop - 1, z);    // Inside
            }
        }
        for(var x = aleft + 1; x <= aright - 1; x++) {
            for(var y = abottom + 1; y <= atop - 1; y++) {
                _az(x, y, aback);
                _az(x, y, aback - 1);
                if(x != aleft && x != aright && y != atop && y != abottom)
                    _az(x, y, aback + 1);   // Inside
                _az(x, y, afront);
                _az(x, y, afront + 1);
                if(x != aleft && x != aright && y != atop && y != abottom)
                    _az(x, y, afront - 1);  // Inside
            }
        }

        // Thats the tzone done, transfer them

        for(var key in tzone) {
            var zn = zones[key];
            if(!zn) {
                zn = [];
                zones[key] = zn;
            }
            zn.push(area);
        }
    },

    lCStaticPointDetect: function(obj, dist)
    {
        // Point detects
        // With rays
        var signore = obj.ignore;
        obj.ignore = true;
        var coor = obj.getSceneXYZ();
        var x = coor[0];
        var y = coor[1];
        var z = coor[2];

        var ox = obj.ox;
        var oy = obj.oy;
        var oz = obj.oz;
        
        var dx = x - ox;
        var dy = y - oy;
        var dz = z - oz;

        obj.ox = x;
        obj.oy = y;
        obj.oz = z;

        var fact = ((dx * dx) + (dy * dy) + (dz * dz));

        if(fact <= this._lCIncsize2)
        {
            obj.ignore = signore;
            return this.lCStaticPDC(x, y, z, dist);
        }

        // Now for rays
        fact = Math.ceil(Math.sqrt(fact) / this._lCIncsize);

        dx = dx / fact;
        dy = dy / fact;
        dz = dz / fact;

        for(var i = 0; i < fact; i++) {
            var out = this.lCStaticPDC(ox + (dx * i), oy + (dy * i), oz + (dz * i), dist);
            if(out !== null) {
                obj.ignore = signore;
                return out;
            }
        }
        obj.ignore = signore;
        return null;
    },

    lCAllStaticPointDetect: function(obj, dist, cback)
    {
        // Point detects
        // With rays

        var signore = obj.ignore;
        obj.ignore = true;
        var coor = obj.getSceneXYZ();
        var x = coor[0];
        var y = coor[1];
        var z = coor[2];

        var ox = obj.ox;
        var oy = obj.oy;
        var oz = obj.oz;
        
        var dx = x - ox;
        var dy = y - oy;
        var dz = z - oz;

        obj.ox = x;
        obj.oy = y;
        obj.oz = z;

        var fact = ((dx * dx) + (dy * dy) + (dz * dz));

        if(fact <= this._lCIncsize2) {
            this.lCAllStaticPDC(x, y, z, dist, cback);
            obj.ignore = signore;
            return;
        }

        // Now for rays
        fact = Math.ceil(Math.sqrt(fact) / this._lCIncsize);

        dx = dx / fact;
        dy = dy / fact;
        dz = dz / fact;

        for(var i = 0; i < fact; i++) {
            this.lCAllStaticPDC(ox + (dx * i), oy + (dy * i), oz + (dz * i), dist, cback);
        }
        obj.ignore = signore;
    },

    lCStaticPDC: function(cox, coy, coz, dist)
    {
        // Static PDC

        var zones = this._lCStaticZones;

        var area = zones[this._lCGetidx(cox, coy, coz)];
        if(!area) return null;

        var alen = area.length;
        for(var i = 0; i < alen; i++)
        {
            var sar = area[i];
            var obj = sar[6];
            if(obj.isvisible && (!obj.ignore)) {
                if (  cox >= sar[0] - dist && cox <= sar[3] + dist &&
                        coy >= sar[1] - dist && coy <= sar[4] + dist &&
                        coz >= sar[2] - dist && coz <= sar[5] + dist) {
                    return sar[6];
                }
            }
        }
        return null;
    },

    lCAllStaticPDC: function(cox, coy, coz, dist, cback)
    {
        // Static PDC

        var zones = this._lCStaticZones;

        var area = zones[this._lCGetidx(cox, coy, coz)];
        if(!area) return null;

        var alen = area.length;
        for(var i = 0; i < alen; i++)
        {
            var sar = area[i];
            var obj = sar[6];
            if(obj.isvisible && (!obj.ignore)) {
                var sar = area[i];
                if (  cox >= sar[0] - dist && cox <= sar[3] + dist &&
                        coy >= sar[1] - dist && coy <= sar[4] + dist &&
                        coz >= sar[2] - dist && coz <= sar[5] + dist) {
                    cback(obj, [sar, cox, sar[0], sar[3],  coz,  sar[2], sar[5], dist]);
                }
            }
        }
    },

// Dzone
/*
{
    key: key,
    x:  X cordintes
    y:  Y coordintes
    z:  Z coordinates
    idx: Index
}
*/

    lCAdd: function(obj) {
        var coor = obj.getSceneXYZ();
        var x = coor[0];
        var y = coor[1];
        var z = coor[2];

        var idx = this._lCGetidx(x, y, z);
        var dzs = this._lCDynamicZones[idx];
        if(!dzs) {
            dzs = [];
            this._lCDynamicZones[idx] = dzs;
        }
        dzs[obj.key] = obj;
        var dzone = obj.dzone;
        dzone.x = x;
        dzone.y = y;
        dzone.z = z;
        dzone.idx = idx;
    },
    lCRemove: function(obj)
    {
        var dzs = this._lCDynamicZones[obj.dzone.idx];
        if(dzs) {
            delete dzs[obj.key];
            if(dzs.length == 0) delete this._lCDynamicZones[obj.dzone.idx];
            obj.dzone.idx = -1;
        }
    },

    lCMove: function(obj)
    {
        var coor = obj.getSceneXYZ();
        var x = coor[0];
        var y = coor[1];
        var z = coor[2];

        var dzone = obj.dzone;
        if(dzone.x == x && dzone.y == y && dzone.z == z) return;

        var idx = this._lCGetidx(x, y, z);
        if(idx == dzone.idx) return;
        var dzs = this._lCDynamicZones[dzone.idx];
        if(dzs) {
            delete dzs[dzone.key];
            if (dzs.length == 0)
                delete this._lCDynamicZones[dzone.idx];
        }
        dzone.idx = idx;
        dzone.x = x;
        dzone.y = y;
        dzone.z = z;
        dzs = this._lCDynamicZones[dzone.idx];
        if(!dzs) {
            dzs = [];
            this._lCDynamicZones[dzone.idx] = dzs;
        }
        dzs[dzone.key] = obj;

    },

    _lCGetidx: function(x, y, z)
    {
        return Math.floor((x - this._lCCleft) / this._lCRsize) +
               (Math.floor((y - this._lCCbottom) / this._lCRsize) * this._lCToty) +
               (Math.floor((z - this._lCCback) / this._lCRsize) * this._lCTotz);
    },

    _lCGetpidx: function(x, y, z)
    {
        return x + (y * this._lCToty) + (z * this._lCTotz);
    },

    lCDynamicPointDetect: function(obj, d)
    {
        var signore = obj.ignore;
        obj.ignore = true;

        var coor = obj.getSceneXYZ();

        var x = coor[0];
        var y = coor[1];
        var z = coor[2];

        var ox = obj.ox;
        var oy = obj.oy;
        var oz = obj.oz;

        var dx = x - ox;
        var dy = y - oy;
        var dz = z - oz;

        var dist = (dx * dx) + (dy * dy) + (dz * dz);

        if (dist <= this._lCIncsize2) {
            obj.ignore = signore;
            return this.lCDynamicPDC(x, y, z, d);
        }
        
        var num = Math.ceil(Math.sqrt(dist) / this._lCIncsize);
        var ix = dx / num;
        var iy = dy / num;
        var iz = dz / num;

        for(var i = 0; i < num; i++)
        {
            ox += ix;
            oy += iy;
            oz += iz;

            var out = this.lCDynamicPDC(ox, oy, oz, d);
            if(out !== null) {
                obj.ignore = signore;
                return out;
            }
        }
        obj.ox = x;
        obj.oy = y;
        obj.oz = z;
        obj.ignore = signore;
        return null;
    },

    lCAllDynamicPointDetect: function(obj, d, cback)
    {
        var signore = obj.ignore;
        obj.ignore = true;
        var coor = obj.getSceneXYZ();
        var x = coor[0];
        var y = coor[1];
        var z = coor[2];

        var ox = obj.ox;
        var oy = obj.oy;
        var oz = obj.oz;

        var dx = x - ox;
        var dy = y - oy;
        var dz = z - oz;

        var dist = (dx * dx) + (dy * dy) + (dz * dz);

        if (dist <= this._lCIncsize2) {
            this.lCAllDynamicPDC(x, y, z, d, cback);
            obj.ignore = signore;
            return;
        }
        
        var num = Math.ceil(Math.sqrt(dist) / this._lCIncsize);
        var ix = dx / num;
        var iy = dy / num;
        var iz = dz / num;

        for(var i = 0; i < num; i++)
        {
            ox += ix;
            oy += iy;
            oz += iz;

            this.lCAllDynamicPDC(ox, oy, oz, d, cback);
        }

        obj.ignore = signore;
        obj.ox = x;
        obj.oy = y;
        obj.oz = z;
    },

    lCDynamicPDC: function(x, y, z, d)
    {
        var rsize = this._lCRsize;
        var idx = this._lCGetidx(x, y, z);
        var toty = this._lCToty;
        var totz = this._lCTotz;
        var zones = this._lCDynamicZones;


        function _pdc(jd)
        {
            var dzs = zones[jd];
            if(!dzs) return null;
            for(var key in dzs) {
                var obj = dzs[key];
                if((!obj.ignore) && obj.isvisible) {
                    if(obj.getDistance(x, y, z) < d) {
                        return obj;
                    }
                }
            }
            return null;
        }
        // center

        var out = _pdc(idx); if(out !== null) return out;

        // Center faces (6)
        out = _pdc(idx + 1); if(out !== null) return out;
        out = _pdc(idx - 1); if(out !== null) return out;
        out = _pdc(idx + toty); if(out !== null) return out;
        out = _pdc(idx - toty); if(out !== null) return out;
        out = _pdc(idx + totz); if(out !== null) return out;
        out = _pdc(idx - totz); if(out !== null) return out;


        // Edge faces (12)
        out = _pdc(idx + 1 + toty); if(out !== null) return out;
        out = _pdc(idx + 1 - toty); if(out !== null) return out;
        out = _pdc(idx - 1 + toty); if(out !== null) return out;
        out = _pdc(idx - 1 - toty); if(out !== null) return out;

        out = _pdc(idx + 1 + toty); if(out !== null) return out;
        out = _pdc(idx + 1 - toty); if(out !== null) return out;
        out = _pdc(idx - 1 + toty); if(out !== null) return out;
        out = _pdc(idx - 1 - toty); if(out !== null) return out;

        out = _pdc(idx + 1 + totz); if(out !== null) return out;
        out = _pdc(idx + 1 - totz); if(out !== null) return out;
        out = _pdc(idx - 1 + totz); if(out !== null) return out;
        out = _pdc(idx - 1 - totz); if(out !== null) return out;

        out = _pdc(idx + toty + totz); if(out !== null) return out;
        out = _pdc(idx + toty - totz); if(out !== null) return out;
        out = _pdc(idx - toty + totz); if(out !== null) return out;
        out = _pdc(idx - toty - totz); if(out !== null) return out;

        // Corners - (8)

        out = _pdc(idx + 1 + toty + totz); if(out !== null) return out;
        out = _pdc(idx + 1 + toty - totz); if(out !== null) return out;
        out = _pdc(idx + 1 - toty + totz); if(out !== null) return out;
        out = _pdc(idx + 1 - toty - totz); if(out !== null) return out;
        out = _pdc(idx - 1 + toty + totz); if(out !== null) return out;
        out = _pdc(idx - 1 + toty - totz); if(out !== null) return out;
        out = _pdc(idx - 1 - toty + totz); if(out !== null) return out;
        out = _pdc(idx - 1 - toty - totz); if(out !== null) return out;

        return null;
    },

    lCAllDynamicPDC: function(x, y, z, d, cback)
    {
        var rsize = this._lCRsize;
        var idx = this._lCGetidx(x, y, z);
        var toty = this._lCToty;
        var totz = this._lCTotz;
        var zones = this._lCDynamicZones;


        function _pdc(jd)
        {
            var dzs = zones[jd];
            if(!dzs) return null;
            for(var key in dzs) {
                var obj = dzs[key];
                if((!obj.ignore) && obj.isvisible) {
                    if(obj.getDistance(x, y, z) < d) {
                        cback(obj, [d, x, y, z]);
                    }
                }
            }
            return null;
        }
        // center

        _pdc(idx);

        // Center faces (6)
        _pdc(idx + 1);
        _pdc(idx - 1);
        _pdc(idx + toty);
        _pdc(idx - toty);
        _pdc(idx + totz);
        _pdc(idx - totz);


        // Edge faces (12)
        _pdc(idx + 1 + toty);
        _pdc(idx + 1 - toty);
        _pdc(idx - 1 + toty);
        _pdc(idx - 1 - toty);

        _pdc(idx + 1 + toty);
        _pdc(idx + 1 - toty);
        _pdc(idx - 1 + toty);
        _pdc(idx - 1 - toty);

        _pdc(idx + 1 + totz);
        _pdc(idx + 1 - totz);
        _pdc(idx - 1 + totz);
        _pdc(idx - 1 - totz);

        _pdc(idx + toty + totz);
        _pdc(idx + toty - totz);
        _pdc(idx - toty + totz);
        _pdc(idx - toty - totz);

        // Corners - (8)

        _pdc(idx + 1 + toty + totz);
        _pdc(idx + 1 + toty - totz);
        _pdc(idx + 1 - toty + totz);
        _pdc(idx + 1 - toty - totz);
        _pdc(idx - 1 + toty + totz);
        _pdc(idx - 1 + toty - totz);
        _pdc(idx - 1 - toty + totz);
        _pdc(idx - 1 - toty - totz);
    },

    lCPointDetect: function(obj, d)
    {
        var signore = obj.ignore;
        obj.ignore = true;
        var coor = obj.getSceneXYZ();
        var x = coor[0];
        var y = coor[1];
        var z = coor[2];


        var ox = obj.ox;
        var oy = obj.oy;
        var oz = obj.oz;

        var dx = x - ox;
        var dy = y - oy;
        var dz = z - oz;


        var dist = (dx * dx) + (dy * dy) + (dz * dz);

        if (dist <= this._lCIncsize2) {
            var out = this.lCStaticPDC(x, y, z, d);
            if(out == null) out = this.lCDynamicPDC(x, y, z, d);
            obj.ignore = signore;
            return out;
        }

        
        var num = Math.ceil(Math.sqrt(dist) / this._lCIncsize);
        var ix = dx / num;
        var iy = dy / num;
        var iz = dz / num;

        for(var i = 0; i < num; i++)
        {
            ox += ix;
            oy += iy;
            oz += iz;

            var out = this.lCStaticPDC(ox, oy, oz, d);
            if(out == null) out = this.lCDynamicPDC(ox, oy, oz, d);
            if(out !== null) {
                obj.ignore = signore;
                return out;
            }
        }

        obj.ox = x;
        obj.oy = y;
        obj.oz = z;
        obj.ignore = signore;

        return null;
    },
    lCAllPointDetect: function(obj, d, cback)
    {
        var signore = obj.ignore;
        obj.ignore = true;
        var coor = obj.getSceneXYZ();
        var x = coor[0];
        var y = coor[1];
        var z = coor[2];


        var ox = obj.ox;
        var oy = obj.oy;
        var oz = obj.oz;

        var dx = x - ox;
        var dy = y - oy;
        var dz = z - oz;

        var dist = (dx * dx) + (dy * dy) + (dz * dz);

        if (dist <= this._lCIncsize2) {
            this.lCAllStaticPDC(x, y, z, d, cback);
            this.lCAllDynamicPDC(x, y, z, d, cback);
        }

        
        var num = Math.ceil(Math.sqrt(dist) / this._lCIncsize);
        var ix = dx / num;
        var iy = dy / num;
        var iz = dz / num;

        for(var i = 0; i < num; i++)
        {
            ox += ix;
            oy += iy;
            oz += iz;

            this.lCAllStaticPDC(ox, oy, oz, d, cback);
            this.lCAllDynamicPDC(ox, oy, oz, d, cback);
        }

        obj.ox = x;
        obj.oy = y;
        obj.oz = z;
        obj.ignore = signore;

    },
};


function LCamera(args)
{
    // One of these, so a dictionary object
    this.projection =  mat4.create();

    this.perspargs = {};
    this.setperspective();

    // Moving lCamera, easy to store coordinates then add accordingly

    this.x = 0.0;
    this.y = 0.0;
    this.z = 0.0;

    this.rx = 0.0;
    this.ry = 0.0;

    this.ox = 0.0;
    this.oy = 0.0;
    this.oz = 0.0;

    this.quat = quat.create();
    this.position = mat4.create();  // Current Position of matrix
    this.currview =  mat4.create();      // View for drawing
    this.ignore = false;
    this.isvisible = true;
    this.control = lCoalesce(args.lLControl, this);
    this.dynamic = lCoalesce(args.lLDynamic, false);
    _lObjnum += 1;
    this.key = _lObjnum;
    this.distance = lCoalesce(args.lLDistance, 0);
    this.dzone = {key: _lObjnum, x: 0, y: 0, z: 0, idx: -1};

    if(this.dynamic) {
        lScene.lCAdd(this);
    }
    lCamera = this;

    
}

LCamera.prototype = {
    constructor: LCamera,

    save: function()
    {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            ox: this.ox,
            oy: this.oy,
            oz: this.oz,
            rx: this.rx,
            ry: this.ry,
            ignore: this.ignore,
            quat: quat.clone(this.quat),
        };
    },

    restore: function(saved)
    {
        this.x = saved.x;
        this.y = saved.y;
        this.z = saved.z;
        this.ox = saved.ox;
        this.oy = saved.oy;
        this.oz = saved.oz;
        this.rx = saved.rx;
        this.ry = saved.ry;
        this.quat = quat.clone(saved.quat);
        this.ignore = saved.ignore;
        if(this.dynamic) {
            lScene.lCMove(this);
        }
    },

    setperspective: function(args)
    {
        if(!args)
            args = this.perspargs;
        else
            this.perspargs = args;
        
        mat4.perspective(
            this.projection,
            lCoalesce(args.lLAngle, 45) * Math.PI / 180,     // Field of view
            lGl.canvas.clientWidth / lGl.canvas.clientHeight, // Aspect
            lCoalesce(args.lLNear, 0.1),                    // Near
            lCoalesce(args.lLFar, 2000.0));                 // Far
    },

    getview: function()
    {
        // Retrieves the Matrix to pre-multiply drawing
        const matout = mat4.create();
        
        mat4.fromTranslation(matout, vec4.fromValues(-this.x, -this.y, -this.z, 1.0));

        const matr = mat4.create();
        mat4.fromQuat(matr, this.quat);
        // mat4.rotate(matr, matr, -this.rz, [0, 0, 1]);

        mat4.multiply(this.position, matr, matout);
        mat4.multiply(this.currview, this.projection, this.position);

        return this.currview;

    },

    rotate: function(mrx, mry, mrz)
    {
        if(mrx == 0 && mry == 0 && mrz == 0) return;
        var q = quat.create();
        var m = mat4.create();
        var p = mat4.create();
        if(mrx != 0.0) quat.rotateX(q, q, -mrx);
        if(mry != 0.0) quat.rotateY(q, q, -mry);
        if(mrz != 0.0) quat.rotateZ(q, q, -mrz);
        mat4.fromQuat(m, q);
        mat4.fromQuat(p, this.quat);
        mat4.multiply(p, m, p);
        mat4.getRotation(this.quat, p);
        quat.normalize(this.quat, this.quat);
        this._rotateScene();
    },


    rotateFlatHere: function(mrx, mry)
    {
        quat.identity(this.quat);
        this.rx = 0;
        this.ry = 0;
        this.rotateFlat(mrx, mry);
    },

    rotateFlat: function(mrx, mry)
    {

        // Flat rotates - does not rotate Z direction (roll)
        // And on Y access, (pitch) only 90 degrees
        // Can only look up or down 90 degrees

        // First the matrix

        // First - adjust rotation for each access
        var dor = false;
        if(mry != 0) {
            this.ry += mry;
            if(this.ry > LR180) {
                this.ry = this.ry - LR360;
            } else if (this.ry < -LR180) {
                this.ry = LR360 + this.ry;
            }
            dor = true;
        }
        if(mrx != 0) {
            this.rx += mrx;
            if(this.rx > LR90) {
                mrx = this.rx - LR90;
                this.rx = LR90;
                
            } else if (this.rx < -LR90) {
                mrx = this.rx + LR90;
                this.rx = -LR90;
            }
            dor = true;
        }
        if(dor) {
            quat.identity(this.quat);
            quat.rotateX(this.quat, this.quat, -this.rx);
            quat.rotateY(this.quat, this.quat, -this.ry);

            this._rotateScene();
        }
    },

    _rotateScene: function()
    {
        const wdl = lScene.lDirectionalVector;
        const wdv = lSScene.directionalVector;

        const md = mat4.create();
        const mq = mat4.create();
        mat4.fromQuat(mq, this.quat);
        mat4.fromTranslation(md, vec4.fromValues(wdl[0], wdl[1], wdl[2], 1.0));
        mat4.multiply(md, mq, md);
        vec3.transformMat4(wdv, vec3.fromValues(0, 0, 0), md);
        vec3.normalize(wdv, wdv);
    },

    moveFlat: function(mx, my, mz)
    {
        // Move it on x/y access (floors) - Z is vertical (lifts)

        if(mx == 0.0 && my == 0 && mz == 0) return;

        const currm = mat4.create();
        const matr = mat4.create();

        // Movement
        //Coordinates
        mat4.fromYRotation(matr, this.ry);
        mat4.fromTranslation(currm, vec4.fromValues(mx, my, mz, 1.0));
        mat4.multiply(currm, matr, currm);

        // Get Coordinates
        const mvec =  vec3.create();
        mat4.getTranslation(mvec, currm);

        this.x += mvec[0];
        this.y += mvec[1];
        this.z += mvec[2];

        if(this.dynamic) lScene.lCMove(this);

    },

    moveHere: function(mx, my, mz)
    {
        this.x = mx;
        this.y = my;
        this.z = mz;
        if(this.dynamic) lScene.lCMove(this);
    },

    moveAbs: function(mx, my, mz)
    {
        this.x += mx;
        this.y += my;
        this.z += mz;
        if(this.dynamic) lScene.lCMove(this);
    },

    move: function(mx, my, mz)
    {
        if(mx == 0.0 && my == 0.0 && mz == 0,0) return;
        var mata = mat4.create();
        var matb = mat4.create();

        var q = quat.create();
        quat.invert(q, this.quat);

        mat4.fromQuat(mata, q);
        mat4.fromTranslation(matb, vec4.fromValues(mx, my, mz, 1.0));

        mat4.multiply(mata, mata, matb);    // Move then rotate (wrong way), so we know how far we have gone
        // Extract the x,y,z coordinates
        var v = vec3.create();
        mat4.getTranslation(v, mata);

        this.x += v[0];
        this.y += v[1];
        this.z += v[2];
        if(this.dynamic) lScene.lCMove(this);
    },

    warp: function()
    {
        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;
    },

    getSceneXYZ: function()
    {
        return [this.x, this.y, this.z, 1.0];
    },

    getDistance: function(x, y, z)
    {
        return Math.hypot(this.x - x, this.y - y, this.z - z) - this.distance;
    },

    procpos: function()
    {
        if(this.dynamic) lScene.lCMove(this);
    },
};
        

/*
 * LObject is a "thing" to display
 */
function LObject(structure, control)
{
    this.initialPosition = mat4.create();      // The initial position of this

    // Initial x,y,z to speed up dynamic collission stuff

    this.children = [];                     // What children this has
    this.structure = structure;

    this.x = 0.0;
    this.y = 0.0;
    this.z = 0.0;

    // Old - for static stuff
    this.ox = 0.0;
    this.oy = 0.0;
    this.oz = 0.0;

    // Flat stuff
    this.rx = 0;
    this.ry = 0;

    this.quat = quat.create();
    this.dynamic = false;

    _lObjnum += 1;
    this.key = _lObjnum;

    if(structure.collision == LDYNAMIC)
    {
        this.dynamic = true;
        this.dzone = {key: _lObjnum, x: 0, y: 0, z: 0, idx: -1}
    }
    this.ignore = false;

    this.distance = structure.distance;      // For distance collisions
    this.isvisible = true;    // I am visible
    this.control = control;

    this.position = mat4.create();
    this.baseposition = mat4.create();

    this.hascoords = false;
    this.xyzcoords = vec4.create();
    this.parent = null;

    lScene._lSAdd(this);
}

LObject.prototype = {
    constructor: LObject,

    save: function()
    {
        var kids = [];
        var clen = this.children.length;
        for(var i = 0; i < clen; i++) {
            kids.push(this.children[i].save());
        }
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            ox: this.ox,
            oy: this.oy,
            oz: this.oz,
            rx: this.rx,
            ry: this.ry,
            quat: quat.clone(this.quat),
            isvisible: this.isvisible,
            ignore: this.ignore,
            hascoords: this.hascoords,
            xyzcoords: vec4.clone(this.xyzcoords),
            position: mat4.clone(this.position),
            children: kids,
        };
    },

    restore: function(saved)
    {
        this._rrestore(saved);
        if(this.isvisible) {
            this.procpos();
        }
    },

    _rrestore: function(saved)
    {
        this.x = saved.x,
        this.y = saved.y,
        this.z = saved.z,
        this.ox = saved.ox,
        this.oy = saved.oy,
        this.oz = saved.oz,
        this.rx = saved.rx,
        this.ry = saved.ry,
        this.quat = quat.clone(saved.quat);
        this.hascoords = saved.hascoords,
        this.xyzcoords = vec4.clone(saved.xyzcoords),
        this.position = mat4.clone(saved.position)

        if(this.dynamic) {
            if(this.isvisible == saved.isvisible) {
                if(this.isvisible) {
                    lScene.lCMove(this);
                }
            } else {
                this.isvisible = saved.isvisible;
                if(this.isvisible) {
                    lScene.lCMove(this);  // Should be add, but move handles if not deleted
                } else {
                    lScene.lCRemove(this);
                }
            }
        } else {
            this.isvisible = saved.isvisible;
        }

        this.ignore = saved.ignore;

        var kids = saved.children;
        var children = this.children;
        var klen = children.length;
        for(var i = 0; i < klen; i++)
            children[i]._rrestore(kids[i]);
            
    },

    mkvisible: function(visible)
    {
        this.isvisible = visible;
        var children = this.children;
        var clen = children.length;
        for(var i = 0; i < clen; i++)
            children[i].mkvisible(visible);
        if(this.dynamic) {
            if(visible)
                lScene.lCAdd(this);
            else
                lScene.lCRemove(this);
            
        }
    },

    warp:function()
    {
        var coor = this.getSceneXYZ();
        this.ox = coor[0];
        this.oy = coor[1];
        this.oz = coor[2];
    },

    move: function(mx, my, mz)
    {
        if(mx == 0.0 && my == 0.0 && mz == 0,0) return;
        var mata = mat4.create();
        var matb = mat4.create();

        mat4.fromQuat(mata, this.quat);
        mat4.fromTranslation(matb, vec4.fromValues(mx, my, mz, 1.0));

        mat4.multiply(mata, mata, matb);    // Move then rotate (wrong way), so we know how far we have gone
        // Extract the x,y,z coordinates
        var v = vec3.create();
        mat4.getTranslation(v, mata);

        this.x += v[0];
        this.y += v[1];
        this.z += v[2];
    },

    moveMat: function(matrix)
    {
        var mata = mat4.create();
        var matb = mat4.create();

        mat4.fromQuat(mata, this.quat);
        mat4.multiply(mata, mata, matrix);    // Move then rotate (wrong way), so we know how far we have gone

        var v = vec3.create();
        mat4.getTranslation(v, mata);

        this.x += v[0];
        this.y += v[1];
        this.z += v[2];

        mat4.getRotation(this.quat, mata);
    },

    moveFlat: function(mx, my, mz)
    {
        if(mx == 0.0 && my == 0.0 && mz == 0,0) return;
        var mata = mat4.create();
        var matb = mat4.create();

        mat4.fromYRotation(mata, this.ry);
        mat4.fromTranslation(matb, vec4.fromValues(mx, my, mz, 1.0));

        mat4.multiply(mata, mata, matb);    // Move then rotate (wrong way), so we know how far we have gone
        // Extract the x,y,z coordinates
        var v = vec3.create();
        mat4.getTranslation(v, mata);

        this.x += v[0];
        this.y += v[1];
        this.z += v[2];

    },

    getSceneXYZ: function()
    {
        if(!this.hascoords) {
            var cor = this.xyzcoords;
            vec4.set(cor, 0, 0, 0, 1);
            vec4.transformMat4(cor, cor, this.position);
            this.hascoords = true;
        }
        return this.xyzcoords;
    },

    moveAbs: function(mx, my, mz)
    {
        // if(mx == 0.0 && my == 0.0 && mz == 0,0) return;
        this.x += mx;
        this.y += my;
        this.z += mz;
    },

    moveHere: function(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    },

    rotate: function(mrx, mry, mrz)
    {
        if(mrx == 0 && mry == 0 && mrz == 0) return;
        var q = quat.create();
        var m = mat4.create();
        var p = mat4.create();
        if(mrx != 0.0) quat.rotateX(q, q, mrx);
        if(mry != 0.0) quat.rotateY(q, q, mry);
        if(mrz != 0.0) quat.rotateZ(q, q, mrz);
        mat4.fromQuat(m, q);
        mat4.fromQuat(p, this.quat);
        mat4.multiply(p, p, m);
        mat4.getRotation(this.quat, p);
        quat.normalize(this.quat, this.quat);
    },

    rotateHere: function(mrx, mry, mrz)
    {
        quat.identity(this.quat);
        const q = this.quat;
        if(mrx != 0.0) quat.rotateX(q, q, mrx);
        if(mry != 0.0) quat.rotateY(q, q, mry);
        if(mrz != 0.0) quat.rotateZ(q, q, mrz);
        quat.normalize(this.quat, this.quat);
    },

    rotateFlat: function(mrx, mry)
    {
        if(mrx == 0 && mry == 0) return;

        if(mry != 0) {
            this.ry += mry;
            if(this.ry > LR180) this.ry -= LR360;
            else if(this.ry < -LR180) this.ry += LR360
        }

        if(mrx != 0) {
            this.rx += mrx;
            if(this.rx > LR90) {
                mrx = LR90 - (this.rx - mrx);
                this.rx = LR90
            } else if (this.rx < -LR90) {
                mrx = -(LR90 + (this.rx - mrx));
                this.rx = -LR90;
            }
        }
       
        var q = quat.create();
        var m = mat4.create();
        var p = mat4.create();
        if(mrx != 0.0) quat.rotateX(q, q, mrx);
        if(mry != 0.0) quat.rotateY(q, q, mry);
        mat4.fromQuat(m, q);
        mat4.fromQuat(p, this.quat);
        mat4.multiply(p, p, m);
        mat4.getRotation(this.quat, p);
        quat.normalize(this.quat, this.quat);
    },

    rotateFlatHere: function(mrx, mry)
    {
        this.rx = mrx;
        this.ry = mry;
        quat.identity(this.quat);
        const q = this.quat;
        if(mrx != 0.0) quat.rotateX(q, q, mrx);
        if(mry != 0.0) quat.rotateY(q, q, mry);
        quat.normalize(this.quat, this.quat);
    },
    procpos: function()
    {
        this.recdraw(this.baseposition);
        if(this.dynamic) lScene.lCMove(this);
    },

    recdraw: function(baseposition)
    {
        if(!this.isvisible) return;
        this.baseposition = baseposition;
        this.hascoords = false;

        const ma = mat4.create();
        mat4.fromTranslation(ma, vec4.fromValues(this.x, this.y, this.z, 1.0));
        const mb = mat4.create();
        mat4.fromQuat(mb, this.quat);
        mat4.multiply(ma, ma, mb);
        mat4.multiply(ma, this.initialPosition, ma);
        mat4.multiply(ma, baseposition, ma);

        this.position = ma;

        const clen = this.children.length;
        for(var i = 0; i < clen; i++) {
            this.children[i].recdraw(ma);
        }
    },

    getStaticCollision: function(out, baseposition)
    {
        this.baseposition = baseposition;
        this.hascoords = false;

        const pos = mat4.create();
        mat4.fromTranslation(pos, vec4.fromValues(this.x, this.y, this.z, 1.0));
        const mb = mat4.create();
        mat4.fromQuat(mb, this.quat);
        mat4.multiply(pos, pos, mb);
        mat4.multiply(pos, this.initialPosition, pos);
        mat4.multiply(pos, baseposition, pos);

        this.position = pos;

        var clen = this.children.length;
        if(this.structure.collision == LSTATIC) {
            this.doGetStaticCollision(out, pos);
        } else if(this.dynamic) {
            lScene.lCMove(this);
        }
        for(var i = 0; i < clen; i++) {
            this.children[i].getStaticCollision(out, pos);
            if(this.dynamic)
                this.warp();
        }
    },

    addChild: function(child, position)
    {
        // Adds a child
        if(child.parent != null) {
            // console.trace();
            if(child.parent == this)
                return;
            else;
                child.remove();
        }
        this.children.push(child);
        child.parent = this;
        child.initialPosition = position;
        mat4.copy(child.baseposition, position);
        
    },
    remove: function()
    {
        // Removes from the child
        if(this.parent == null) return;      // Do not try and remove twice

        var parent = this.parent;

        const clen = parent.children.length;
        const newchildren = [];
        for(var i = 0; i < clen; i++) {
            if (parent.children[i] != this) {
                newchildren.push(parent.children[i]);
            }
        }
        parent.children = newchildren;
        this.parent = null;
        this.initialPosition = mat4.create();
    },

    doGetStaticCollision: function(out, pos)
    {
        var corners = this.structure.corners;
        var clen = corners.length;

        /*
        // Get the position
        var pos = mat4.create();
        var tmp = mat4.create();

        mat4.fromTranslation(pos, vec4.fromValues(this.x, this.y, this.z, 1));
        // mat4.multiply(pos, tmp, position);
        mat4.fromQuat(tmp, this.quat);
        mat4.multiply(pos, pos, tmp);

        mat4.multiply(pos, pos, position);
        */


        for(var i = 0; i < clen; i++)
        {
            var minx = 0;
            var maxx = 0;
            var miny = 0;
            var maxy = 0;
            var minz = 0;
            var maxz = 0;

            var corner = corners[i];

            var first = true;

            for(var key in corner) {
                var loc = corner[key];

                var coord = vec4.fromValues(loc[0], loc[1], loc[2], 1.0);


                vec4.transformMat4(coord, coord, pos);

                if(first) {
                    minx = coord[0];
                    miny = coord[1];
                    minz = coord[2];
                    maxx = minx;
                    maxy = miny;
                    maxz = minz;
                    first = false;
                } else {
                    if(coord[0] < minx) minx = coord[0];
                    else if(coord[0] > maxx) maxx = coord[0];
                    if(coord[1] < miny) miny = coord[1];
                    else if(coord[1] > maxy) maxy = coord[1];
                    if(coord[2] < minz) minz = coord[2];
                    else if(coord[2] > maxz) maxz = coord[2];
                }

            }

            out.push([[minx, miny, minz], [maxx, maxy, maxz], this]);
        }
        return out;
    },

    setDistance: function(diam)
    {
        this.distance = diam;
    },

    getDistance: function(x, y, z)
    {
        var ve = this.getSceneXYZ();
        return Math.hypot(ve[0] - x, ve[1] - y, ve[2] - z) - this.distance;
    }
};


/*
 * An object that can only go on scene,
 * This is optimised not to do parents
 */

function LWObject(structure, control)
{
    LObject.call(this, structure, control);
}
    

LWObject.prototype = Object.assign(Object.create(LObject.prototype), {
    constructor: LWObject,

    warp: function(obj)
    {
        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;
    },

    setOld: function(obj)
    {
        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;
    },

    getSceneXYZ: function()
    {
        return [this.x, this.y, this.z];
    },

    recdraw: function(baseposition)
    {
        if(!this.isvisible) return;
        this.baseposition = baseposition;
        this.hascoords = false;

        const ma = mat4.create();
        mat4.fromTranslation(ma, vec4.fromValues(this.x, this.y, this.z, 1.0));
        const mb = mat4.create();
        mat4.fromQuat(mb, this.quat);
        mat4.multiply(ma, ma, mb);
        mat4.multiply(ma, this.initialPosition, ma);
        // mat4.multiply(ma, baseposition, ma);

        this.position = ma;

        const clen = this.children.length;
        for(var i = 0; i < clen; i++) {
            this.children[i].recdraw(ma);
        }
    },

    setDistance: function(diam)
    {
        this.distance = diam;
    },

    getDistance: function(x, y, z)
    {
        return Math.hypot(this.x - x,this.y - y, this.z - z) - this.distance;
    }
});


/*
 * A static group does not have positions or movement, just passes things 
 * down to children as efficiently as possible
 */

function LStaticGroup()
{
    this.baseposition = mat4.create();
    this.children = [];
}

LStaticGroup.prototype = {
    constructor: LStaticGroup,
    procpos: function()
    {
        this.recdraw(this.baseposition);
    },
    recdraw: function(baseposition)
    {
        this.baseposition = baseposition;
        const clen = this.children.length;
        for(var i = 0; i < clen; i++) {
            this.children[i].recdraw(baseposition);
        }
    },

    getStaticCollision: function(out, baseposition)
    {
        var clen = this.children.length;
        for(var i = 0; i < clen; i++) {
            this.children[i].getStaticCollision(out, baseposition);
        }
    },

    addChild: function(child, position)
    {
        // Adds a child
        if(child.parent != null) {
            if(child.parent == this)
                return;
            else;
                child.remove();
        }
        this.children.push(child);
        child.parent = this;
        child.initialPosition = position;
        mat4.copy(child.baseposition, position);

    },
    remove: function(parent)
    {
        // Removes from the child
        if(this.parent == null) return;      // Do not try and remove twice
        const clen = parent.children.length;
        const newchildren = [];
        for(var i = 0; i < clen; i++) {
            if (parent.children[i] != this) {
                newchildren.push(parent.children[i]);
            }
        }
        parent.children = newchildren;
        this.parent = null;
        this.initialPosition = mat4.create();
    },
};


function LGroupDef(args)
{
    _lSGCreate(this, args);
}

LGroupDef.prototype = {
    constructor: LGroupDef,

    // Virtuals
    // doGetStaticCollision: function(out, baseposition) {},
};



function _lSGCreate(structure, args)
{
    if(!args) args = {};
    structure.corners = [];     // Collision areas _ Static areas
    structure.distance = 0;      // Distance for dynamic ones
    structure.collision = LNONE;  // Collision type
    var collision = args.collision;
    if(collision) structure.collision = collision;
    var distance = args.distance;
    if(distance) structure.distance = distance;
}

function LStructureDef(shader, args)
{
    this.shader = shader;
    this.args = args; // Any arguments, processed by doInitBuffer
    this.numblocks = 0;     // Number of blocks
    this.numentries = 0;    // Number of Array entries (numblocks * 36)
    this.numindexes = 0;    // Number of Array entries (numblocks * 36)
    this.pointsArray = [];
    this.normalsArray = [];
    this.pointsIndex = [];
    this.textureCoords = [];    // Matrix of texture coordinates
    this.buffer = {}


    _lSGCreate(this, args);

        
    _lStructures.push(this);
    _lStructureNum += 1;
    this.key = _lStructureNum;
    this.compiled = false;
}

LStructureDef.prototype = {
    constructor: LStructureDef,

    // Importing foreign stuff
    // Currently just use objectname, materialname to get entry

    addImport: function(args)
    {
        this._procargs(args, 1);
        var position = args.position;
        var data = args.data;
        var texturecontrol = args.texturecontrol;
        if(!data) return;   // Nothing to import

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        var normals = this.normalsArray;
        var points = this.pointsArray;
        var indexes = this.pointsIndex;
        var coords = this.textureCoords;

        var onumind = this.numindexes;

        // Data is a LIST of LComponent instances

        var dlen = data.length;
        for(var j = 0; j < dlen; j++)
        {
            var numindexes = this.numindexes;
            var numentries = this.numentries;
            var dline = data[j];
            var inumindexes = dline.numindexes;
            var inumentries = dline.numentries;
            var inormals = dline.normalsArray;
            var ipoints = dline.pointsArray;
            var iindexes = dline.pointsIndex;
            var icoords = dline.textureCoords;
    
            var vi = 0;
            var vc = 0;
    
            for(var i = 0; i < inumindexes; i++) {
                vi = i * 3;
                vc = i * 2;
    
                lExtendarray(points, lGetPosition(ipoints[vi], ipoints[vi + 1], ipoints[vi + 2], position));
                lExtendarray(normals, lGetPosition(inormals[vi], inormals[vi + 1], inormals[vi + 2], normalMatrix));
                lExtendarray(coords, texturecontrol.coords(icoords[vc], icoords[vc + 1]));
            }
            for(var i = 0; i < inumentries; i++) {
                indexes.push(iindexes[i] + numindexes);
            }
    
            this.numentries += inumentries;
            this.numindexes += inumindexes;
        }
        // process corners

        if(this.collision == LSTATIC) {
            var tind = this.numindexes;
            if(tind > onumind) {
                if(!("corners" in args)) {
                    var minx = points[tind];
                    var miny = points[tind + 1];
                    var minz = points[tind + 2];
                    var maxx = points[tind];
                    var maxy = points[tind + 1];
                    var maxz = points[tind + 2];
                    for(var i = onumind + 3; i < tind; i+=3) {
                        if(points[i] < minx) minx = points[i];
                        if(points[i+1] < miny) miny = points[i+1];
                        if(points[i+2] < minz) minz = points[i+2];
                        if(points[i] > maxx) maxx = points[i];
                        if(points[i+1] > maxy) maxy = points[i+1];
                        if(points[i+2] > maxz) maxz = points[i+2];
                    }

                    this.useCorners([[minx, miny, minz], [maxx, maxy, maxz]], args);
                }
            }
        }
    },

    addBlock: function(args)
    {
        this._procargs(args, 6);

        var position = args.position;
        var point = args.size;
        var hold = args.hold;
        var textcontrols = args.texturecontrols;

        // Two oposite corners of a cartesian block
        // Reurns points array for triangle fill
        // order returned is front, back, top, bottom, left, right

        // For the buffers, the points are the only thing that are dynamic
        // here.  The Normals are not, (though may be in future if otherwise)
    
        // TODO - Put transfoirmation matrices here??

        var pointa = [];
        var pointb = [];
        for(var i = 0; i < 3; i++)
        {
            var p = point[i];
            if(p == 0.0) {
                alert("addBlock point cannot be 0");
                return;
            }
            if(p < 0.0) p = 0.0 - p;
            pointa[i] = p;
            pointb[i] = -p;
        }
    
        const a_x = pointa[0];
        const a_y = pointa[1];
        const a_z = pointa[2];

        const b_x = pointb[0];
        const b_y = pointb[1];
        const b_z = pointb[2];

        var numindexes = this.numindexes;
        var numentries = this.numentries;
        var normals = this.normalsArray;
        var points = this.pointsArray;
        var indexes = this.pointsIndex;
        var coords = this.textureCoords;

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        function _setpoints(a, b, c, d, norm, sple)
        {
            lExtendarray(points, a);
            lExtendarray(points, b);
            lExtendarray(points, c);
            lExtendarray(points, d);
            lExtendarray(normals, norm);
            lExtendarray(normals, norm);
            lExtendarray(normals, norm);
            lExtendarray(normals, norm);
            lExtendarray(coords, textcontrols[sple].clockwise());
            
            lExtendarray(indexes, [numindexes, numindexes + 2, numindexes + 3, numindexes + 2, numindexes, numindexes + 1]);
            numindexes += 4;
            numentries += 6;
        }

        // Initial position of the thing
        // f = front h = hind     (Z Axis)
        // t = top, b = bottom  (Y AXIS)
        // l = left r = right (X axis)
        const crn = {
            ftr: lGetPosition(a_x, a_y, a_z, position),
            fbr: lGetPosition(a_x, b_y, a_z, position),
            fbl: lGetPosition(b_x, b_y, a_z, position),
            ftl: lGetPosition(b_x, a_y, a_z, position),
    
            htr: lGetPosition(a_x, a_y, b_z, position),
            hbr: lGetPosition(a_x, b_y, b_z, position),
            hbl: lGetPosition(b_x, b_y, b_z, position),
            htl: lGetPosition(b_x, a_y, b_z, position),
        };

        if(!hold.includes(LI_FRONT))
            _setpoints(crn.ftl, crn.fbl, crn.fbr, crn.ftr,  lGetPosition(0, 0, 1, normalMatrix), LI_FRONT); //Front
        if(!hold.includes(LI_BACK))
            _setpoints(crn.htr, crn.hbr, crn.hbl, crn.htl, lGetPosition(0, 0, -1, normalMatrix), LI_BACK);  // Reverse
        if(!hold.includes(LI_TOP))
            _setpoints(crn.htl, crn.ftl, crn.ftr, crn.htr, lGetPosition(0, 1, 0, normalMatrix), LI_TOP);   //Top
        if(!hold.includes(LI_RIGHT))
            _setpoints(crn.ftr, crn.fbr, crn.hbr, crn.htr, lGetPosition(1, 0, 0, normalMatrix), LI_RIGHT);   // Right
        if(!hold.includes(LI_BOTTOM))
            _setpoints(crn.fbl, crn.hbl, crn.hbr, crn.fbr, lGetPosition(0, -1, 0, normalMatrix), LI_BOTTOM);  // Bottom
        if(!hold.includes(LI_LEFT))
            _setpoints(crn.htl, crn.hbl, crn.fbl, crn.ftl, lGetPosition(-1, 0, 0, normalMatrix), LI_LEFT);  // Left

        // crn represents 8 corners, - remember them for collisions

        this.useCorners(crn, args);

        // Looking out, this needs to go clockwise

        // Do the normals
        this.numblocks += 1;
        this.numentries  = numentries;
        this.numindexes = numindexes;
    },
    addBlockPatch: function(args)
    {

        this._procargs(args, 1);

        var position = args.position;
        var point = args.size;
        var textcontrol = args.texturecontrol;

        // Two oposite corners of a cartesian block
        // Reurns points array for triangle fill
        // order returned is front, back, top, bottom, left, right

        // For the buffers, the points are the only thing that are dynamic
        // here.  The Normals are not, (though may be in future if otherwise)
    
        // TODO - Put transfoirmation matrices here??

        var pointa = [];
        var pointb = [];

        for(var i = 0; i < 2; i++)
        {
            var p = point[i];
            if(p == 0.0) {
                alert("BlockPatch point cannot be 0");
                return;
            }
            if(p < 0.0) p = 0.0 - p;
            pointa[i] = p;
            pointb[i] = -p;
        }
    
        const a_x = pointa[0];
        const a_y = pointa[1];

        const b_x = pointb[0];
        const b_y = pointb[1];

        var numindexes = this.numindexes;
        var numentries = this.numentries;
        var normals = this.normalsArray;
        var points = this.pointsArray;
        var indexes = this.pointsIndex;
        var coords = this.textureCoords;

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        function _setpoints(a, b, c, d, norm)
        {
            lExtendarray(points, a);
            lExtendarray(points, b);
            lExtendarray(points, c);
            lExtendarray(points, d);
            lExtendarray(normals, norm);
            lExtendarray(normals, norm);
            lExtendarray(normals, norm);
            lExtendarray(normals, norm);
            lExtendarray(coords, textcontrol.clockwise());
            
            lExtendarray(indexes, [numindexes, numindexes + 2, numindexes + 3, numindexes + 2, numindexes, numindexes + 1]);
            numindexes += 4;
            numentries += 6;
        }

        // Initial position of the thing
        // f = front h = hind     (Z Axis)
        // t = top, b = bottom  (Y AXIS)
        // l = left r = right (X axis)
        const crn = {
            ftr: lGetPosition(a_x, a_y, 0, position),
            fbr: lGetPosition(a_x, b_y, 0, position),
            fbl: lGetPosition(b_x, b_y, 0, position),
            ftl: lGetPosition(b_x, a_y, 0, position),
    
        };

        _setpoints(crn.ftl, crn.fbl, crn.fbr, crn.ftr,  lGetPosition(0, 0, 1, normalMatrix)); //Front

        // crn represents 8 corners, - remember them for collisions

        this.useCorners(crn, args);

        // Looking out, this needs to go clockwise

        // Do the normals
        this.numblocks += 1;
        this.numentries  = numentries;
        this.numindexes = numindexes;
    },

    addCylinder: function(args)
    {
        this._procargs(args, 3);
        var position = args.position;
        var radius = args.radius;
        var depth = args.depth;
        var hold = args.hold;

        var segments = args.segments;
        if(!segments) segments = 32;

        var textures = args.texturecontrols;

        // Cylinder, needs depth, radius

        var points = this.pointsArray;
        var normals = this.normalsArray;
        var coords = this.textureCoords;
        var indexes = this.pointsIndex;
        var numindexes = this.numindexes;
        var numentries = this.numentries;

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        if(!hold.includes(LI_SIDE))
        {
            var tsides = textures[LI_SIDE];
            // First going around anti clockwise around Z, from bottom
            for(var i = 0; i <= segments; i++)
            {
                var ang = Math.PI * 2 * i / segments;
                var x = 0 - Math.sin(ang);
                var y = Math.cos(ang);
    
                // Back first
                lExtendarray(points, lGetPosition(x * radius, y * radius, -depth, position));
                lExtendarray(points, lGetPosition(x * radius, y * radius, depth, position));
                lExtendarray(normals, lGetPosition(x, y, 0, normalMatrix));
                lExtendarray(normals, lGetPosition(x, y, 0, normalMatrix));
                lExtendarray(coords, tsides.coords(i / segments, 1));
                lExtendarray(coords, tsides.coords(i / segments, 0.0));
    
                if(i < segments) {
                    var bl = i * 2;
                    var tl = bl + 1;
                    var br = tl + 1;
                    var tr = br + 1;
                    lExtendarray(indexes, 
                        [numindexes + bl, numindexes + tr, numindexes + tl, numindexes + tr, numindexes + bl, numindexes + br]
                    );
                    numentries += 6;
                }
            }
            numindexes += (2 * (segments + 1));
        }

        if(!hold.includes(LI_BACK))
        {
            const tback = textures[LI_BACK];
            const tnorm = lGetPosition(0.0, 0.0, -1.0, normalMatrix);
            lExtendarray(points, lGetPosition(0.0, 0.0, -depth, position));
            lExtendarray(normals, tnorm);
            lExtendarray(coords, tback.coords(0.5, 0.5));
            const origi = numindexes;
            numindexes += 1;
            for(var i = 0; i < segments; i++)
            {
                var ang = Math.PI * 2 * i / segments;
                var x = 0 - Math.sin(ang);
                var y = Math.cos(ang);
                lExtendarray(points, lGetPosition(x * radius, y * radius, -depth, position));
                lExtendarray(normals, tnorm);
                lExtendarray(coords, tback.coords(0.5 - x/2, 0.5 + y/2));    // Switched around
                var j = i + 1;
                if(j >= segments) j = 0;
                lExtendarray(indexes, [origi, j + numindexes, i + numindexes]);  // Oposite to front
                numentries += 3;
            }
            numindexes += segments;
        }
        if(!hold.includes(LI_FRONT))
        {
            const tback = textures[LI_FRONT];
            const tnorm = lGetPosition(0.0, 0.0, 1.0, normalMatrix);
            lExtendarray(points, lGetPosition(0.0, 0.0, depth, position));
            lExtendarray(normals, tnorm);
            lExtendarray(coords, tback.coords(0.5, 0.5));
            const origi = numindexes;
            numindexes += 1;
            for(var i = 0; i < segments; i++)
            {
                var ang = Math.PI * 2 * i / segments;
                var x = 0 - Math.sin(ang);
                var y = Math.cos(ang);
                lExtendarray(points, lGetPosition(x * radius, y * radius, depth, position));
                lExtendarray(normals, tnorm);
                lExtendarray(coords, tback.coords(0.5 + x/2, 0.5 + y/2));
                var j = i + 1;
                if(j >= segments) j = 0;
                lExtendarray(indexes, [origi, i + numindexes, j + numindexes]);  // opposite to back
                numentries += 3;
            }
            numindexes += segments;
        }

        this.numindexes = numindexes;
        this.numentries = numentries;
        this.numblocks += 1;

        this.useCorners(
        {
            ftr: lGetPosition( radius,   radius,  depth, position),
            fbr: lGetPosition( radius,  -radius,  depth, position),
            fbl: lGetPosition(-radius,  -radius,  depth, position),
            ftl: lGetPosition(-radius,   radius,  depth, position),
    
            htr: lGetPosition( radius, radius,  -depth, position),
            hbr: lGetPosition( radius, -radius,  -depth, position),
            hbl: lGetPosition(-radius, -radius,  -depth, position),
            htl: lGetPosition(-radius, radius,  -depth, position),
        }, args);

    },

    addPolygon: function(args)
    {
        // Cor is an array of 2d coordintes (each is a 2d array)
        // Criteria - coords 0.0 point must be INSIDE polygoon, (and cannot BE 0.0) (not counting position of course)
        //      Needs also to be convex
        //      cor is in anticlockwise order

        // Normal matrix

        var cor = args.coords;
        var depth = args.depth;
        var numsides = cor.length;        // Number of coordinates
        var ilen = numsides + 2;
        this._procargs(args, ilen);
        var hold = args.hold;
        var textcontrols = args.texturecontrols;
        var position = args.position;

        var texcors = new _L2Coords(cor);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);
        // Helper functions here

        function postrans(c, d)
        {
            const out = lGetPosition(c[0], c[1], d, position);
            return [out[0], out[1], out[2]];
        }

        function normtrans(n)
        {
            const out = lGetPosition(n[0], n[1], n[2], normalMatrix);
            return [out[0], out[1], out[2]];
        }

            

        if(typeof position == "undefined")
            position = null;
        if(position === null)
            position = mat4.create();

        if(depth < 0.0) depth = 0.0 - depth;


        var hcor = [];
        var fcor = [];

        var mins = [0.0, 0.0, 0.0];
        var maxs = [0.0, 0.0, 0.0];

        // Get the coordinates
        for(var i = 0; i < numsides; i++) {
            var hc = postrans(cor[i], depth);
            var fc = postrans(cor[i], -depth);

            hcor[i] = hc;
            fcor[i] = fc;

            for(var j = 0; j < 3; j++) {
                if(i == 0)
                {
                    if(hc[j] < fc[j]) mins[j] = hc[j];
                    else mins[j] = fc[j];
                    if(hc[j] > fc[j]) maxs[j] = hc[j];
                    else maxs[j] = fc[j];
                } else {
                    if(hc[j] < mins[j]) mins[j] = hc[j];
                    if(fc[j] < mins[j]) mins[j] = fc[j];
                    if(hc[j] > maxs[j]) maxs[j] = hc[j];
                    if(fc[j] > maxs[j]) maxs[j] = fc[j];
                }
            }
        }


        var normals = [];
        var points = []
        var indexes = [];
        var coords = [];

        // First he origins

        var oforward = postrans([0.0, 0.0], -depth);
        var oback = postrans([0.0, 0.0], depth);
        var onforward = normtrans([0.0, 0.0, -1.0]);
        var onback = normtrans([0.0, 0.0, 1.0]);
        var numindexes = this.numindexes;
        var numentries = this.numentries;   // Set up the indexes so we do not need to do later

        var fcen = -1;
        var hcen = -1;

        if(!hold.includes(LI_FRONT)) {
            lExtendarray(points, oforward);
            lExtendarray(coords, textcontrols[LI_FRONT].coords(texcors.coords(0, 0, false)));
            lExtendarray(normals, onforward);       
            fcen = numindexes;
            numindexes += 1;
        }
        if(!hold.includes(LI_BACK)) {
            lExtendarray(points, oback);
            lExtendarray(coords, textcontrols[LI_BACK].coords(texcors.coords(0, 0, true)));
            lExtendarray(normals, onback);       
            hcen = numindexes;
            numindexes += 1;
        }


        var hicor = [];
        var ficor = [];

        // front
        var texts = textcontrols[LI_FRONT];
        for(var i = 0; i < numsides; i++)
        {
            lExtendarray(points, fcor[i]);
            lExtendarray(normals, onforward);
            lExtendarray(coords, texts.coorda(texts.coorda(cor[i], false)));
            ficor[i] = numindexes;
            numindexes += 1;
        }

        texts = textcontrols[LI_BACK];
        for(var i = 0; i < numsides; i++)
        {
            lExtendarray(points, hcor[i]);
            lExtendarray(normals, onback);
            lExtendarray(coords, texts.coorda(texts.coorda(cor[i], true)));
            hicor[i] = numindexes;
            numindexes += 1;
        }


        for(var i = 0; i < numsides; i++)
        {
            var ti = i + 2;
            if(!hold.includes(ti)) {
                var j = i + 1;
                if(j == numsides) j = 0;
                if(!hold.includes(LI_FRONT)) {
                    indexes.push(fcen);
                    indexes.push(ficor[j]);
                    indexes.push(ficor[i]);
                    numentries += 3;
                }
                if(!hold.includes(LI_BACK)) {
                    indexes.push(hcen);
                    indexes.push(hicor[i]);
                    indexes.push(hicor[j]);
                    numentries += 3;
                }
            }
        }

        var vecs = [];

        for(var i = 0; i < numsides; i++)
        {
            var ti = i + 2;
            if(hold.includes(ti)) continue;

            var texs = textcontrols[ti];

            var j = i + 1;
            if(j == numsides) j = 0;
            

            var cx = cor[j][0] - cor[i][0];
            var cy = cor[j][1] - cor[i][1];

            var h = Math.hypot(cx, cy);

            var snorm = normtrans([cy /h, -cx/h, 0.0], normalMatrix);        // The Normal

            lExtendarray(points, fcor[i]);
            lExtendarray(points, fcor[j]);
            lExtendarray(points, hcor[j]);
            lExtendarray(points, hcor[i]);

            lExtendarray(normals, snorm);
            lExtendarray(normals, snorm);
            lExtendarray(normals, snorm);
            lExtendarray(normals, snorm);

            lExtendarray(coords, texs.coords(1, 0));
            lExtendarray(coords, texs.coords(0, 0));
            lExtendarray(coords, texs.coords(1, 1));
            lExtendarray(coords, texs.coords(0, 1));

            lExtendarray(indexes, [numindexes + 2, numindexes, numindexes + 1, numindexes, numindexes + 2, numindexes + 3]);
            numindexes += 4;
            numentries += 6;
        }

        this.pointsArray = this.pointsArray.concat(points);
        this.normalsArray = this.normalsArray.concat(normals);
        this.pointsIndex = this.pointsIndex.concat(indexes);
        this.textureCoords = this.textureCoords.concat(coords);

        this.numentries = numentries;
        this.numindexes = numindexes;

        // Do the corners

        this.useCorners({
            ftr: [maxs[0], maxs[1], maxs[2]],
            fbr: [maxs[0], mins[1], maxs[2]],
            fbl: [mins[0], mins[1], maxs[2]],
            ftl: [mins[0], maxs[1], maxs[2]],
   
            htr: [maxs[0], maxs[1], mins[2]],
            hbr: [maxs[0], mins[1], mins[2]],
            hbl: [mins[0], mins[1], mins[2]],
            htl: [mins[0], maxs[1], mins[2]],
        }, args);
    },


    addWTriangle(args)
    {
        this._procargs(args, 5);
        var position = args.position;
        var pcoords = args.coords;
        var depth = args.depth;
        var hold = args.hold;
        var textcontrols = args.texturecontrols;

        var indexes = this.pointsIndex;
        var points = this.pointsArray;
        var normals = this.normalsArray;
        var coords = this.textureCoords;

        var numentries = this.numentries;
        var numindexes = this.numindexes;

        var ca = pcoords[0];
        var cb = pcoords[1];
        var cc = pcoords[2];

        var tcoords = new _L2Coords(pcoords);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        function _normalise(n)
        {
            var h = Math.hypot(n[0], n[1], n[2]);
            return lGetPosition(n[0] / h, n[1] / h, n[2] / h, normalMatrix);
        }

        // Calculate normal of a triangle
        var nb = [cb[0] - ca[0], cb[1] - ca[1], cb[2] - ca[2]];
        var nc = [cc[0] - ca[0], cc[1] - ca[1], cc[2] - ca[2]];

        var normf = _normalise([(nb[1] * nc[2]) - (nb[2] * nc[1]), 
                    (nb[2] * nc[0]) - (nb[0] * nc[2]),
                    (nb[0] * nc[1]) - (nb[1] * nc[0])]);

        var normb = [-normf[0], -normf[1], -normf[2]];


        // For side normals, z axis is 0
        var nab = _normalise([cb[1] - ca[1], ca[0] - cb[0], 0.0]);
        var nbc = _normalise([cc[1] - cb[1], cb[0] - cc[0], 0.0]);
        var nca = _normalise([ca[1] - cc[1], cc[0] - ca[0], 0.0]);


        // Here goes
        function _adddepth(cor, dep)
        {
            return lGetPosition(cor[0], cor[1], cor[2] + dep, position);
        }

        var cab = _adddepth(ca, -depth);
        var cbb = _adddepth(cb, -depth);
        var ccb = _adddepth(cc, -depth);
        var caf = _adddepth(ca,  depth);
        var cbf = _adddepth(cb,  depth);
        var ccf = _adddepth(cc,  depth);

        function _dodraw(p, op, n, tex, rev)
        {
            for(var i = 0; i < 3; i++) {
                lExtendarray(points, p[0]);
                lExtendarray(normals, n);
                lExtendarray(coords, tex.coorda(tcoords.coorda(op[a])));
            }
            lExtendarray(indexes, [numindexes, numindexes + 1, numindexes + 2]);
            numentries += 3;
            numindexes += 3;
        }

        _dodraw([caf, cbf, ccf], [ca, cb, cc], normf, textcontrols[LI_FRONT], false);
        _dodraw(ccb, cbb, cab, [cc, cb, ca], normb, textcontrols[LI_BACK], true);

        function _doside(fa, ba, fb, bb, n, tex)
        {
            lExtendarray(points, fa);
            lExtendarray(points, ba);
            lExtendarray(points, fb);
            lExtendarray(points, bb);
            lExtendarray(normals, n);
            lExtendarray(normals, n);
            lExtendarray(normals, n);
            lExtendarray(normals, n);
            lExtendarray(indexes, [numindexes, numindexes + 3, numindexes + 2, numindexes + 3, numindexes, numindexes + 1]);
            lExtendarray(coords, tex.coords(1, 0));
            lExtendarray(coords, tex.coords(1, 1));
            lExtendarray(coords, tex.coords(0, 0));
            lExtendarray(coords, tex.coords(0, 1));
            
            numindexes += 4;
            numentries += 6;
        }
        
        _doside(caf, cab, cbf, cbb, nab);
        _doside(cbf, cbb, ccf, ccb, nbc);
        _doside(ccf, ccb, caf, cab, nca);

        this.numentries = numentries;
        this.numindexes = numindexes;
        // Corners, can tried 2 corners same
        this.useCorners({
            ftr: ccf,
            fbr: caf,
            fbl: cbf,
            ftl: ccf,
    
            htr: ccb,
            hbr: cab,
            hbl: cbb,
            htl: ccb,
        }, args);

    },

    /*
    Following returns an array of textue coordinates for each vertex for each face
    */

    addTriangle(args)
    {
        this._procargs(args, 5);
        var position = args.position;
        var tcoords = args.coords;
        var depth = args.depth;
        var hold = args.hold;
        var textcontrols = args.texturecontrols;

        var indexes = this.pointsIndex;
        var points = this.pointsArray;
        var normals = this.normalsArray;
        var coords = this.textureCoords;

        var numentries = this.numentries;
        var numindexes = this.numindexes;

        var ca = tcoords[0];
        var cb = tcoords[1];
        var cc = tcoords[2];

        var texcors = new _L2Coords(tcoords);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        function _normalise(n)
        {
            var h = Math.hypot(n[0], n[1]);
            return lGetPosition(n[0] / h, n[1] / h, 0.0, normalMatrix);
        }

        var normf = lGetPosition(0, 0, 1, normalMatrix);
        var normb = lGetPosition(0, 0, -1, normalMatrix);


        // For side normals, z axis is 0
        var nab = _normalise([cb[1] - ca[1], ca[0] - cb[0], 0.0]);
        var nbc = _normalise([cc[1] - cb[1], cb[0] - cc[0], 0.0]);
        var nca = _normalise([ca[1] - cc[1], cc[0] - ca[0], 0.0]);


        // Here goes
        function _adddepth(cor, dep)
        {
            return lGetPosition(cor[0], cor[1], dep, position);
        }

        var cab = _adddepth(ca, -depth);
        var cbb = _adddepth(cb, -depth);
        var ccb = _adddepth(cc, -depth);
        var caf = _adddepth(ca,  depth);
        var cbf = _adddepth(cb,  depth);
        var ccf = _adddepth(cc,  depth);

        function _dodraw(pts, opts, nrm, tex, tr)
        {
            for(var i = 0; i < 3; i++) {
                lExtendarray(points, pts[i]);
                lExtendarray(normals, nrm);
                lExtendarray(coords, tex.coorda(texcors.coorda(opts[i], tr)));
            }

            lExtendarray(indexes, [numindexes, numindexes + 1, numindexes + 2]);

            numentries += 3;
            numindexes += 3;
        }

        if(!hold.includes(LI_FRONT))
            _dodraw([caf, cbf, ccf], [ca, cb, cc], normf, textcontrols[LI_FRONT], false);
        if(!hold.includes(LI_BACK))
            _dodraw([ccb, cbb, cab], [cc, cb, ca], normb, textcontrols[LI_BACK], true);


        function _doside(fa, ba, fb, bb, n, tex)
        {
            lExtendarray(points, fa);
            lExtendarray(points, ba);
            lExtendarray(points, fb);
            lExtendarray(points, bb);
            lExtendarray(normals, n);
            lExtendarray(normals, n);
            lExtendarray(normals, n);
            lExtendarray(normals, n);

            lExtendarray(coords, tex.coords(1, 0));
            lExtendarray(coords, tex.coords(1, 1));
            lExtendarray(coords, tex.coords(0, 0));
            lExtendarray(coords, tex.coords(0, 1));

            lExtendarray(indexes, [numindexes, numindexes + 3, numindexes + 2, numindexes + 3, numindexes, numindexes + 1]);
            numindexes += 4;
            numentries += 6;
        }
        
        if(!hold.includes(LI_SIDE + 0)) _doside(caf, cab, cbf, cbb, nab, textcontrols[LI_SIDE + 0]);
        if(!hold.includes(LI_SIDE + 1)) _doside(cbf, cbb, ccf, ccb, nbc, textcontrols[LI_SIDE + 1]);
        if(!hold.includes(LI_SIDE + 2)) _doside(ccf, ccb, caf, cab, nca, textcontrols[LI_SIDE + 2]);

        this.numentries = numentries;
        this.numindexes = numindexes;
        // Corners, can tried 2 corners same
        this.useCorners({
            ftr: ccf,
            fbr: caf,
            fbl: cbf,
            ftl: ccf,
    
            htr: ccb,
            hbr: cab,
            hbl: cbb,
            htl: ccb,
        }, args);
    },
    addTrianglePatch(args)
    {
        this._procargs(args, 1);
        var position = args.position;
        var tcoords = args.coords;
        var textcontrol = args.texturecontrol;

        var indexes = this.pointsIndex;
        var points = this.pointsArray;
        var normals = this.normalsArray;
        var coords = this.textureCoords;

        var numentries = this.numentries;
        var numindexes = this.numindexes;

        var ca = tcoords[0];
        var cb = tcoords[1];
        var cc = tcoords[2];

        var texcors = new _L2Coords(tcoords);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        var normf = lGetPosition(0, 0, 1, normalMatrix);

        // Here goes
        function _add(cor)
        {
            return lGetPosition(cor[0], cor[1], 0, position);
        }

        var caf = _add(ca);
        var cbf = _add(cb);
        var ccf = _add(cc);

        function _dodraw(pts, opts, nrm, tex, tr)
        {
            for(var i = 0; i < 3; i++) {
                lExtendarray(points, pts[i]);
                lExtendarray(normals, nrm);
                lExtendarray(coords, tex.coorda(texcors.coorda(opts[i], tr)));
            }

            lExtendarray(indexes, [numindexes, numindexes + 1, numindexes + 2]);

            numentries += 3;
            numindexes += 3;
        }

        _dodraw([caf, cbf, ccf], [ca, cb, cc], normf, textcontrol, false);

        this.numentries = numentries;
        this.numindexes = numindexes;
        // Corners, can tried 2 corners same
        this.useCorners({
            sa: ccf,
            sb: caf,
            sc: cbf,
        }, args);
    },
    addSphere(args)
    {
        this._procargs(args, 1);
        // Use partition sphere instead of icohendron because of texture
        // not so even distribution of triangles, but better shaped 
        // for displaying textures

        var position = args.position;
        var radius = args.radius;
        var div = args.segments;
        if(!div) div = 32;

        if(radius < 0) radius = 0 - radius;

        var textctrl = args.texturecontrol;

        var div2 = div * 2;
        var divh = div / 2;

        var numentries = this.numentries;
        var numindexes = this.numindexes;
        var points = this.pointsArray;
        var normals = this.normalsArray;
        var indexes = this.pointsIndex;
        var coords = this.textureCoords;

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);


        for(var i = 0; i <= div2; i++) {
            var ang = Math.PI * i  * 2 / div2;
            var sa = Math.sin(ang);
            var ca = Math.cos(ang);
            var s = i / div2;
            for(var j = 0; j <= div; j ++) {
                var bng = Math.PI * j / div;
                var sb = Math.sin(bng);
                var cb = Math.cos(bng);

                // SB is always positive
                // I plane (around Y axis) starts at back goes round.  Z starts neg, X goes neg at beginning
                // J axis (Up/down Y) starts at bottom (neg) goes positive

                var x = 0 - (sa * sb);
                var y = 0 - cb;
                var z = 0 - (ca * sb);

                var t = j / div;

                lExtendarray(normals, lGetPosition(x, y, z, normalMatrix));
                lExtendarray(points, lGetPosition(x * radius, y * radius, z * radius, position));
                lExtendarray(coords, textctrl.coords(s, t));

                if(i < div2 && j < div) {
                    var bl = (i * (div + 1)) + j;
                    var br = bl + div + 1;
                    var tl = bl + 1;
                    var tr = br + 1;
                    lExtendarray(indexes, [
                        numindexes + tl, numindexes + br, numindexes + tr, numindexes + br, numindexes + tl, numindexes + bl
                    ]);
                    numentries += 6;
                }
            }
        }

        numindexes += (div2 + 1) * (div + 1);

        this.numentries = numentries;
        this.numindexes = numindexes;
        this.numblocks += 1;

        this.useCorners({
            ftr: lGetPosition(radius, radius, radius, position),
            fbr: lGetPosition(radius, -radius, radius, position),
            fbl: lGetPosition(-radius, -radius, radius, position),
            ftl: lGetPosition(-radius, radius, radius, position),
    
            htr: lGetPosition(radius, radius, -radius, position),
            hbr: lGetPosition(radius, -radius, -radius, position),
            hbl: lGetPosition(-radius, -radius, -radius, position),
            htl: lGetPosition(-radius, radius, -radius, position),
            
        }, args);
    },


    addBezierPatch: function(args)
    {
        this._procargs(args, 1);
        var position = args.position;

        var matr = args.coords;
        var xsegments = args.xsegments;
        var ysegments = args.ysegments;
    
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        if(!xsegments) xsegments = 16;
        if(!ysegments) ysegments = 16;
    
        var tcontrol = args.texturecontrol;
    
        this.matr = matr;
    
        var mlen = matr.length;
        var bmatr = [];
        var nlen = matr[0].length;
    
        var natr = [];

        for(var j = 0; j < nlen; j++) natr.push([]);
    
        for(var i = 0; i < mlen; i++)
        {
            var imatr = matr[i];
            if(imatr.length != nlen) alert("Bezier surface norm error");
            bmatr.push(new _LBLine(matr[i]));
            for(var j = 0; j < nlen; j++)
                natr[j].push(imatr[j]);
        }
    
        var bnatr = [];
        for(var j = 0; j < nlen; j++) {
            bnatr.push(new _LBLine(natr[j]));
        }

        this.bmatr = bmatr;
    
        // Segments - Do these curves for now
    
        var smatr = [];
        var snatr = [];
    
        var dx = 1 / xsegments;
        // Create all curves required
        for(var x = 0; x <= xsegments; x++) {
            var tx = dx * x;
            var bts = [];
            for(var i = 0; i < mlen; i++)
                bts.push(bmatr[i].pos(tx));
            smatr.push(new _LBLine(bts));
        }
    
        var dy = 1 / ysegments;
        for(var y = 0; y <= ysegments; y++) {
            var ty = dy * y;
            var bts = [];
            for(var j = 0; j < nlen; j++)
                bts.push(bnatr[j].pos(ty));
            snatr.push(new _LBLine(bts));
        }
    
        var points = this.pointsArray;
        var normals = this.normalsArray
        var indexes = this.pointsIndex;
        var coords = this.textureCoords;

        var numindexes = this.numindexes;
        var numentries = this.numentries;
    
        var norm = vec3.create();

        var minx = 0;
        var miny = 0;
        var minz = 0;
        var maxx = 0;
        var maxy = 0;
        var maxz = 0;

        var first = true;

        function _llGetPosition(x, y, z)
        {
            var lp = lGetPosition(x, y, z, position);
            var lx = lp[0];
            var ly = lp[1];
            var lz = lp[2];
            if(first) {
                minx = lx;
                miny = ly;
                minz = lz;
                maxx = lx;
                maxy = ly;
                maxz = lz;
                first = false;
            } else {
                if(lx < minx) minx = lx;
                if(ly < miny) miny = ly;
                if(lz < minz) minz = lz;
                if(lx > maxx) maxx = lx;
                if(ly > maxy) maxy = ly;
                if(lz > maxz) maxz = lz;
            }
            return lp;
        }
    
        for(var x = 0; x <= xsegments; x++) {
            var xts = smatr[x];
            var tx = dx * x;
            for(var y = 0; y <= ysegments; y++) {
                var ty = dy * y;
                var pox = xts.pos(ty);
                lExtendarray(points, _llGetPosition(pox[0], pox[1], pox[2]))
    
                var xtang = xts.tang(ty);
                var ytang = snatr[y].tang(tx);
    
                vec3.cross(norm, xtang, ytang);
                vec4.normalize(norm, norm);
                lExtendarray(normals, lGetPosition(norm[0], norm[1], norm[2], normalMatrix));

                lExtendarray(coords, tcontrol.coords(tx, ty));
            }
        }
    
        // Indexes - Square at a time
    
        for(var x = 0; x < xsegments; x++) {
            var bx = x * (ysegments + 1);
            for(var y = 0; y < ysegments; y++) {
                var by = bx + y + numindexes;    // + numindexes
                lExtendarray(indexes, [by, by + ysegments + 2, by + ysegments + 1, by + ysegments + 2, by, by + 1]);
            }
        }

        numindexes += ((xsegments + 1) * (ysegments + 1));
        numentries += (xsegments * ysegments) * 6;

        this.numindexes = numindexes;
        this.numentries = numentries;
        this.numblocks += 1;

        this.useCorners({
            ftr: [maxx, maxy, maxz],
            fbr: [maxx, miny, maxz],
            fbl: [minx, miny, maxz],
            ftl: [minx, maxy, maxz],
    
            htr: [maxx, maxy, minz],
            hbr: [maxx, miny, minz],
            hbl: [minx, miny, minz],
            htl: [minx, maxy, minz],
        }, args);
    },

    addBezierBlock: function(args)
    {
        this._procargs(args, 6);
        var position = args.position;
        var hold = args.hold;
        var textcontrols = args.texturecontrols;

        var matr = args.coords;
        var xsegments = args.xsegments;
        var ysegments = args.ysegments;

        var depth = args.depth;

        var vecf = vec3.fromValues(0, 0, depth);
        var vecb = vec3.fromValues(0, 0, -depth);
    
        if(!xsegments) xsegments = 16;
        if(!ysegments) ysegments = 16;
    

        this.matr = matr;
    
        var mlen = matr.length;
        var bmatr = [];
        var nlen = matr[0].length;
    
        var natr = [];

        for(var j = 0; j < nlen; j++) natr.push([]);
    
        for(var i = 0; i < mlen; i++)
        {
            var imatr = matr[i];
            if(imatr.length != nlen) alert("Bezier surface norm error");
            bmatr.push(new _LBLine(matr[i]));
            for(var j = 0; j < nlen; j++)
                natr[j].push(imatr[j]);
        }
    
        var bnatr = [];
        for(var j = 0; j < nlen; j++) {
            bnatr.push(new _LBLine(natr[j]));
        }

        this.bmatr = bmatr;
    
        // Segments - Do these curves for now
    
        var smatr = [];
        var snatr = [];
    
        var dx = 1 / xsegments;
        // Create all curves required
        for(var x = 0; x <= xsegments; x++) {
            var tx = dx * x;
            var bts = [];
            for(var i = 0; i < mlen; i++)
                bts.push(bmatr[i].pos(tx));
            smatr.push(new _LBLine(bts));
        }
    
        var dy = 1 / ysegments;
        for(var y = 0; y <= ysegments; y++) {
            var ty = dy * y;
            var bts = [];
            for(var j = 0; j < nlen; j++)
                bts.push(bnatr[j].pos(ty));
            snatr.push(new _LBLine(bts));
        }
    
        var points = this.pointsArray;
        var normals = this.normalsArray
        var indexes = this.pointsIndex;
        var coords = this.textureCoords;

        var numindexes = this.numindexes;
        var numentries = this.numentries;
    
        var norm = vec3.create();

        var minx = 0;
        var miny = 0;
        var minz = 0;
        var maxx = 0;
        var maxy = 0;
        var maxz = 0;

        var first = true;

        function _llGetPosition(x, y, z, tposition)
        {
            var lp = lGetPosition(x, y, z, tposition);
            var lx = lp[0];
            var ly = lp[1];
            var lz = lp[2];
            if(first) {
                minx = lx;
                miny = ly;
                minz = lz;
                maxx = lx;
                maxy = ly;
                maxz = lz;
                first = false;
            } else {
                if(lx < minx) minx = lx;
                if(ly < miny) miny = ly;
                if(lz < minz) minz = lz;
                if(lx > maxx) maxx = lx;
                if(ly > maxy) maxy = ly;
                if(lz > maxz) maxz = lz;
            }
            return lp;
        }
    
        var nrms = mat4.create();

        mat4.invert(nrms, position);
        mat4.transpose(nrms, nrms);

        function _procpoints(inner, tcontrol)
        {
            for(var x = 0; x <= xsegments; x++) {
                var xts = smatr[x];
                var tx = dx * x;
                for(var y = 0; y <= ysegments; y++) {
                    var ty = dy * y;
                    var pos = xts.pos(ty);
        
                    var xtang = xts.tang(ty);
                    var ytang = snatr[y].tang(tx);
        
                    if(inner)
                        vec3.cross(norm, ytang, xtang);
                    else
                        vec3.cross(norm, xtang, ytang);
                    vec3.normalize(norm, norm);

                    // if(isthick) {
                    var thm = mat4.create();
                    var ntra = vec3.create();
                    vec3.scale(ntra, norm, depth);
                    mat4.fromTranslation(thm, ntra);
                    mat4.multiply(thm, position, thm);

                    lExtendarray(points, _llGetPosition(pos[0], pos[1], pos[2], thm))
                    // } else {
                        // lExtendarray(points, _llGetPosition(pox[0], pox[1], pox[2], tpos))
                    // }

                    var tnrm = mat4.create();
                    mat4.invert(tnrm, thm);
                    mat4.transpose(tnrm, tnrm);
            
                    lExtendarray(normals, lGetPosition(norm[0], norm[1], norm[2], nrms));
                    lExtendarray(coords, tcontrol.coords(tx, ty));
                }
            }
        
            // Indexes - Square at a time
        
            for(var x = 0; x < xsegments; x++) {
                var bx = x * (ysegments + 1);
                for(var y = 0; y < ysegments; y++) {
                    var by = bx + y + numindexes;    // + numindexes
                    if(inner)
                        lExtendarray(indexes, [by, by + ysegments + 2, by + 1, by + ysegments + 2, by, by + ysegments + 1]);
                    else
                        lExtendarray(indexes, [by, by + ysegments + 2, by + ysegments + 1, by + ysegments + 2, by, by + 1]);
                }
            }
            numindexes += ((xsegments + 1) * (ysegments + 1));
            numentries += (xsegments * ysegments) * 6;
        }

        if(!hold.includes(LI_FRONT)) _procpoints(false, textcontrols[LI_FRONT]);
        if(!hold.includes(LI_BACK)) _procpoints(true, textcontrols[LI_BACK]);


        function _side(pts, vptsm, wside)
        {
            if(hold.includes(wside)) return;
            var tcontrol = textcontrols[wside];

            var rnr = false;
            var segments = 0;
            var asegments = 0;
            var ridx = 0;

            switch (wside) {
            case LI_LEFT:   rnr = false; ridx = 0; segments = ysegments; break;
            case LI_RIGHT:  rnr = true;  ridx = 1; segments = ysegments; break;
            case LI_BOTTOM: rnr = true;  ridx = 1; segments = xsegments; break;
            case LI_TOP:    rnr = false; ridx = 0; segments = xsegments; break;
            }
        
            var sf = 1 / segments;
            var j = segments;

            for(var i = 0; i <= segments; i++)
            {
                
                var vpts = vptsm[i];
                var df = sf * i;
                var pos = pts.pos(df);
                var tan = pts.tang(df);
                var vtan = vpts.tang(ridx);

                var thf = mat4.create();
                var thb = mat4.create();
                var ntra = vec3.create();

                if(!rnr)
                    vec3.subtract(vtan, vec3.fromValues(0, 0, 0), vtan);

                vec3.cross(norm, vtan, tan);
                vec3.normalize(norm, norm);

                
                vec3.scale(ntra, norm, depth);
                mat4.fromTranslation(thf, ntra);
                mat4.multiply(thf, position, thf);

                vec3.scale(ntra, norm, -depth);
                mat4.fromTranslation(thb, ntra);
                mat4.multiply(thb, position, thb);

                lExtendarray(points, lGetPosition(pos[0], pos[1], pos[2], thf));
                lExtendarray(points, lGetPosition(pos[0], pos[1], pos[2], thb));

                vec3.cross(vtan, tan, norm);
                vec3.normalize(vtan, vtan);

                var vnrm = lGetPosition(vtan[0], vtan[1], vtan[2], nrms);

                lExtendarray(normals, vnrm);
                lExtendarray(normals, vnrm);
                lExtendarray(coords, tcontrol.coords(0, df));
                lExtendarray(coords, tcontrol.coords(1, df));
            }

            for(var i = 0; i < segments; i++)
            {
                lExtendarray(indexes, [numindexes, numindexes + 3, numindexes + 2, numindexes + 3, numindexes, numindexes + 1]);
                numindexes += 2;
            }
            numindexes += 2;
            numentries += (6 * segments);
        }

        _side(smatr[0], snatr, LI_LEFT);
        _side(smatr[xsegments], snatr, LI_RIGHT);
        _side(snatr[0], smatr, LI_TOP);
        _side(snatr[ysegments], smatr, LI_BOTTOM);

        this.numindexes = numindexes;
        this.numentries = numentries;
        this.numblocks += 1;

        this.useCorners({
            ftr: [maxx, maxy, maxz],
            fbr: [maxx, miny, maxz],
            fbl: [minx, miny, maxz],
            ftl: [minx, maxy, maxz],
    
            htr: [maxx, maxy, minz],
            hbr: [maxx, miny, minz],
            hbl: [minx, miny, minz],
            htl: [minx, maxy, minz],
        }, args);
    },

    _procargs: function(args, numtex)
    {
        // Pre processes arguments
        // args are that
        // numtext is number of textures, 1 is no hold

        if(!args.position) args.position = mat4.create();
        if(!args.hold) {
            args.hold = [];
        }
        var hold = args.hold;

        if(numtex == 1) {
            if(!args.texturecontrol) {
                if(args.texturecontrols) {
                    arg.texturecontrol = args.texturecontrols[0];
                }
                if(!args.texturecontrol) {
                    args.texturecontrol = LTEXCTL_STATIC;
                }
            }
        } else {
            if(!args.texturecontrols) {
                if(!args.texturecontrol) {
                    args.texturecontrols = LTEXCTL_STATIC_LIST;
                } else {
                    args.texturecontrols = lTextureList(args.texturecontrol);
                }
            }
            for(var i = 0; i < numtex; i++) {
                if(!(args.texturecontrols[i])) {
                    if(!hold.includes(i)) hold.push(i);
                }
            }
        }
        this.compiled = false;
    },

    useCorners: function(crn, args)
    {
        if(!this.collision == LSTATIC) return
        if(args.corners) crn = args.corners;
        if(args.corners === null) return;
        if(args.corners === false) return;
        if(!crn) return;
        var csize = args.collsize;

        if(csize < 0) return;

        if(!csize) {
            this.corners.push(crn);
            return;
        }

        var minx = 0;
        var maxx = 0;
        var miny = 0;
        var maxy = 0;
        var minz = 0;
        var maxz = 0;

        var first = true;

        for(var key in crn) {
            var itm = crn[key];
            if(first) {
                minx = itm[0];
                maxx = itm[0];
                miny = itm[1];
                maxy = itm[1];
                minz = itm[2];
                maxz = itm[2];
                first = false;
            } else {
                if(itm[0] < minx) minx = itm[0];
                if(itm[1] < miny) miny = itm[1];
                if(itm[2] < minz) minz = itm[2];
                if(itm[0] > maxx) maxx = itm[0];
                if(itm[1] > maxy) maxy = itm[1];
                if(itm[2] > maxz) maxz = itm[2];
            }
        }

        var tx = Math.ceil((maxx - minx) / csize);
        var ty = Math.ceil((maxy - miny) / csize);
        var tz = Math.ceil((maxz - minz) / csize);

        if(!tx) tx = 1;
        if(!ty) ty = 1;
        if(!tz) tz = 1;
        if(tx == 0) tx = 1;
        if(ty == 0) ty = 1;
        if(tz == 0) tz = 1;


        if(tx == 1 && ty == 1 && tz == 1) {
            this.corners.push(crn)
            return;
        }

        // Helper functions
        function _inc(sv, ev, xd, td)
        {

            var svx = sv[0];
            var svy = sv[1];
            var svz = sv[2];

            var evx = ev[0];
            var evy = ev[1];
            var evz = ev[2];

            var iix = svx + (xd * ((evx - svx) / td));
            var iiy = svy + (xd * ((evy - svy) / td));
            var iiz = svz + (xd * ((evz - svz) / td));

            if(svx > evx) {
                if(iix < evx) {
                    iix = evx;
                }
            } else {
                if(iix > evx) {
                    iix = evx;
                }
            }
                    
            if(svy > evy)  {
                if(iiy < evy) {
                    iiy = evy;
                }
            } else {
                if(iiy > evy) {
                    iiy = evy;
                }
            }
            if(svz > evz) {
                if(iiz < evz) {
                    iiz = evz;
                }
            } else {
                if(iiz > evz) {
                    iiz = evz;
                }
            }

                    
            return [iix, iiy, iiz];
        }
            

        var wcrn = [crn];
        if(tx > 1) 
        {
            var txcrn = [];
            var ocrn = {
                htr: crn.htl,
                ftr: crn.ftl,
                hbr: crn.hbl,
                fbr: crn.fbl,
            };

            for(var i = 1; i <= tx; i++) {
                var nxcrn = {
                htl: ocrn.htr,
                ftl: ocrn.ftr,
                hbl: ocrn.hbr,
                fbl: ocrn.fbr,
                htr: _inc(crn.htl, crn.htr, i, tx),
                ftr: _inc(crn.ftl, crn.ftr, i, tx),
                hbr: _inc(crn.hbl, crn.hbr, i, tx),
                fbr: _inc(crn.fbl, crn.fbr, i, tx),
                };
                ocrn = nxcrn;
                txcrn.push(nxcrn);
            }
            wcrn = txcrn;
        }

        if(ty > 1)
        {
            var tycrn = [];
            for(var i = 0; i < tx; i++) {
                var xcrn = wcrn[i];
                var ocrn = {
                        htl: xcrn.hbl,
                        htr: xcrn.hbr,
                        ftl: xcrn.fbl,
                        ftr: xcrn.fbr,
                };

                for(var j = 1; j <= ty; j++) {
                    var nycrn = {
                    hbl: ocrn.htl,
                    hbr: ocrn.htr,
                    fbl: ocrn.ftl,
                    fbr: ocrn.ftr,

                    htl: _inc(xcrn.hbl, xcrn.htl, j, ty),
                    htr: _inc(xcrn.hbr, xcrn.htr, j, ty),
                    ftl: _inc(xcrn.fbl, xcrn.ftl, j, ty),
                    ftr: _inc(xcrn.fbr, xcrn.ftr, j, ty),
                    };
                    ocrn = nycrn;
                    tycrn.push(nycrn);
                }
            }
            wcrn = tycrn;
        }

        if(tz > 1) {
            var tzcrn = [];
            var xy = tx * ty;
            for(var ij = 0; ij < xy; ij++) {
                var zcrn = wcrn[ij];
                var ocrn = {
                        fbl: zcrn.hbl,
                        fbr: zcrn.hbr,
                        ftl: zcrn.htl,
                        ftr: zcrn.htr,
                };
                for(var k = 1; k <= tz; k++) {
                    var nzcrn = {
                        hbl: ocrn.fbl,
                        hbr: ocrn.fbr,
                        htl: ocrn.ftl,
                        htr: ocrn.ftr,
                        fbl:_inc(zcrn.hbl, zcrn.fbl, k, tz),
                        fbr:_inc(zcrn.hbr, zcrn.fbr, k, tz),
                        ftl:_inc(zcrn.htl, zcrn.ftl, k, tz),
                        ftr:_inc(zcrn.htr, zcrn.ftr, k, tz),
                    };
                    ocrn = nzcrn;
                    tzcrn.push(nzcrn);
                }
            }
            wcrn = tzcrn;
        }

        var wlen = wcrn.length;
        for(var i = 0; i < wlen; i++)
            this.corners.push(wcrn[i]);
    },

    consolidateCorners: function(args)
    {
        var corners = this.corners;

        var first = true;

        var minx = 0;
        var miny = 0;
        var minz = 0;
        var maxx = 0;
        var maxy = 0;
        var maxz = 0;

        var clen = corners.length;
        for(var i = 0; i < clen; i++) {
            var crn = corners[i];
            for(var key in crn) {
                var coord = crn[key];
                if(first) {
                    minx = coord[0];
                    miny = coord[1];
                    minz = coord[2];
                    maxx = minx;
                    maxy = miny;
                    maxz = minz;
                    first = false;
                } else {
                    if(coord[0] < minx) minx = coord[0];
                    else if(coord[0] > maxx) maxx = coord[0];
                    if(coord[1] < miny) miny = coord[1];
                    else if(coord[1] > maxy) maxy = coord[1];
                    if(coord[2] < minz) minz = coord[2];
                    else if(coord[2] > maxz) maxz = coord[2];
                }
            }
        }
        this.corners = [];

        if(!first)
            this.useCorners(
            [
                [minx, miny, minz],
                [maxx, maxy, maxz],
            ], args);
    }
        
};

function _L2Coords(coords, rev)
{
    // Initialiser takes list of 2d coordinates
    // Returns between 0 and 1 depending on size
    
    var minx = 0;
    var miny = 0;
    var maxx = 0;
    var maxy = 0;

    var clen = coords.length;

    var first = true;

    var x = 0;
    var y = 0;

    for(var i = 0; i < clen; i++)
    {
        x = coords[i][0];
        y = coords[i][1];

        if(first) {
            minx = x;
            maxx = x;
            miny = y;
            maxy = y;
            first = false;
        } else {
            if(x < minx) minx = x;
            if(x > maxx) maxx = x;
            if(y < miny) miny = y;
            if(y > maxy) maxy = y;
        }
    }

    this.xr = maxx - minx;
    this.yr = maxy - miny;
    this.minx = minx;
    this.miny = miny;
}
_L2Coords.prototype = {
    constructor: _L2Coords,
    coords: function(x, y, rev)
    {

        if (this.xr != 0)
            x = (x - this.minx) / this.xr;
        if (this.yr != 0)
            y = (y - this.miny) / this.yr;

        if(rev) {
            x = 1 - x;
            y = 1 - y;
        }
        return [x, y];
    },
    coorda: function(a, rev)
    {
        return this.coords(a[0], a[1], rev);
    }

}

function lTextureColor(size, num)
{
    return new LTextureControl([size, 1], [num + .5, 0], [0, 0]);
}

function lTextureColorAll(size, num)
{
    var tc = new LTextureControl([size, 1], [num + .5, 0], [0, 0]);
    return new Proxy([], 
    {
        get: function(obj, prop)
        {
            return tc;
        }
    });
}

function LTextureControl(size, sectbase, sectsize)
{
    //  Initially - texture is a "loaded" texture reference
    this.sizex = size[0];
    this.sizey = size[1];

    this.secx = sectsize[0];
    this.secy = sectsize[1];

    this.secbasex = sectbase[0];
    this.secbasey = sectbase[1];

}

LTextureControl.prototype = {
    constructor: LTextureControl,
    coords: function(x, y)
    {
        return [ ((x * this.secx) + this.secbasex) / this.sizex, ((y * this.secy) + this.secbasey) / this.sizey];
    },
    coorda: function(a) {
        return this.coords(a[0], a[1])
    },

    clockwise: function()
    {
        // Corners, in clockwise order
        return [this.secbasex / this.sizex, this.secbasey / this.sizey,
              this.secbasex/ this.sizex, (this.secbasey + this.secy) / this.sizey,
             (this.secbasex + this.secx) / this.sizex, (this.secbasey + this.secy) / this.sizey,
             (this.secbasex + this.secx) / this.sizex, this.secbasey / this.sizey];
    },
}

const LTEXCTL_STATIC = {
    coords: function(x, y) {return [x, y];},
    coorda: function(a) {return [a[0], a[1]];},
    clockwise: function() {return [0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0]; },
}


const LTEXCTL_STATIC_LIST = new Proxy([],
    {
        get: function(obj, prop)
        {
            return LTEXCTL_STATIC;
        }
    }
);

function lTextureList(tex)
{
    return new Proxy([],
    {
        get: function(obj, prop)
        {
            return tex;
        }
    })
}
            

// Helper functions

function lLoadTexture(url)
{
    function isPowerOf2(value)
    {
        return(value & (value - 1) == 0)
    }
    const texture = lGl.createTexture();
    lGl.bindTexture(lGl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = lGl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;

    const srcFormat = lGl.RGBA;
    const srcType = lGl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);

    lGl.texImage2D(lGl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.onload = function() {
        lGl.bindTexture(lGl.TEXTURE_2D, texture);
        lGl.texImage2D(lGl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        if(isPowerOf2(image.width) && isPowerOf2(image.height)) {
            lGl.generateMipmap(lGl.TEXTURE_2D);
        } else {
            lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_WRAP_S, lGl.CLAMP_TO_EDGE);
            lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_WRAP_T, lGl.CLAMP_TO_EDGE);
            lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_MIN_FILTER, lGl.LINEAR);
        }
    };

    if (url instanceof Blob)
        image.src = URL.createObjectURL(url);
    else
        image.src = url;

    return texture;
}

/*
 * Returns a textue that is a 1 pixel color
 */
function lLoadTColor(color)
{
    const texture = lGl.createTexture();
    lGl.bindTexture(lGl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = lGl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;

    const srcFormat = lGl.RGBA;
    const srcType = lGl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([
            Math.floor(color[0] * 255),
            Math.floor(color[1] * 255),
            Math.floor(color[2] * 255),
            Math.floor(color[3] * 255)]);

    lGl.texImage2D(lGl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    return texture;
}

// Multiple textures - x and y should be 2 ^ n

function lLoadTColors(colors, x, y)
{
    function isPowerOf2(value)
    {
        return(value & (value - 1) == 0)
    }
    const texture = lGl.createTexture();
    lGl.bindTexture(lGl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = lGl.RGBA;
    const width = x;
    const height = y;
    const border = 0;

    const srcFormat = lGl.RGBA;
    const srcType = lGl.UNSIGNED_BYTE;

    const newcolors = [];
    var n = 0;
    for(var j = 0; j < y; j++) {
        for(var i = 0; i < x; i++) {
            var ncolor = colors[n];
            newcolors.push(Math.floor(ncolor[0] * 255));
            newcolors.push(Math.floor(ncolor[1] * 255));
            newcolors.push(Math.floor(ncolor[2] * 255));
            newcolors.push(Math.floor(ncolor[3] * 255));
            n++;
        }
    }

    const pixels = new Uint8Array(newcolors);

    lGl.texImage2D(lGl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixels);
    if(isPowerOf2(x) && isPowerOf2(y)) {
        lGl.generateMipmap(lGl.TEXTURE_2D);
    } else {
        lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_WRAP_S, lGl.CLAMP_TO_EDGE);
        lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_WRAP_T, lGl.CLAMP_TO_EDGE);
        lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_MIN_FILTER, lGl.LINEAR);
    }

    return texture;
}


function _LBLine(pts)
{
    
    // Formular for bezier = sum((n.C.i) * ((t)^i) * ((1 - t)^(n - i)) * P[i])
    // N is number of points
    // n is N - 1
    //  (where i is 0 up to n)

    // Formulae for normal = sum((
    

    // a.C.b = (a! / (b!, (a-b)!))
    // t is between 0 and 1 (how far along curve)
    // P is an array of points

    var pts = pts;
    var plen = pts.length;

    var bins = [];

    var tfact = 1;
    for(var i = 2; i < plen; i++)
        tfact *= i;       

    var e = tfact
    var s = 1;

    i = 0;
    for(;;)
    {
        if(i > 0) s = s * i;
        bins.push(tfact / (e * s));
        i++;
        if(i >= plen) break;
        var j = plen - i;
        e = e / j;
    }

    this.bins = bins;
    this.plen = plen;
    this.pts = pts;

    // Normals - First of all - new "Weights"
    // Multiply each by n - 1 now to saave time later

    var nlen = plen - 1;
    var npts = [];
    var nbins = [];


    for(var i = 0; i < nlen; i++)
    {
        var v = vec3.create();
        vec3.subtract(v, pts[i+1], pts[i]);
        vec3.scale(v, v, nlen);
        npts.push(v);
    }
    
    var tfact = 1;
    for(var i = 2; i <= nlen; i++)
        tfact *= i;       

    var e = tfact
    var s = 1;
    i = 0;
    for(;;)
    {
        if(i > 0) s = s * i;
        nbins.push(tfact / (e * s));
        i++;
        if(i >= nlen) break;
        var j = nlen - i;
        e = e / j;
    }

    this.nlen = nlen;
    this.npts = npts;
    this.nbins = nbins;

}

_LBLine.prototype = {
    constructor: _LBLine,

    pos: function(howfar)
    {
        var plen = this.plen;
        var pts = this.pts;

        var out = vec3.create();
        var ta = vec3.create();


        function pow(v, p)
        {
            var o = 1;
            for(var i = 0; i < p; i++)
                o = o * v;
            return o;
        }
                

        var j = plen - 1;;
        for(var i = 0; i < plen; i++)
        {
            vec3.scale(ta, pts[i], pow(1.0 - howfar, j) * pow(howfar, i) * this.bins[i]);
            vec3.add(out, out, ta);
            j--;
        }
        return out;
    },

    tang: function(howfar)
    {
        var nlen = this.nlen;
        var npts = this.npts;

        var out = vec3.create();
        var ta = vec3.create();


        function pow(v, p)
        {
            var o = 1;
            for(var i = 0; i < p; i++)
                o = o * v;
            return o;
        }
                

        var j = nlen - 1;;
        for(var i = 0; i < nlen; i++)
        {
            vec3.scale(ta, npts[i], pow(1.0 - howfar, j) * pow(howfar, i) * this.nbins[i]);
            vec3.add(out, out, ta);
            j--;
        }
        vec3.normalize(out, out);
        return out;
    },
}


function LVirtObject(control, x, y, z, d)
{
    _lObjnum += 1;
    this.key = _lObjnum;
    this.x = x,
    this.y = y,
    this.z = z;
    this.ox = x,
    this.oy = y,
    this.oz = z;
    this.distance = d;
    this.ignore = false;
    this.isvisible = false;
    this.control = control;
    this.dzone = {
        key: this.key,
        x: 0,
        y: 0,
        z: 0,
        idx: -1,
    };
}

LVirtObject.prototype = {
    constructor: LVirtObject,
    save: function()
    {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            ox: this.ox,
            oy: this.oy,
            oz: this.oz,
            isvisible: this.isvisible,
            ignore: this.ignore
        };
    },

    restore: function(saved)
    {
        this.x = saved.x;
        this.y = saved.y;
        this.z = saved.z;
        this.ox = saved.ox;
        this.oy = saved.oy;
        this.oz = saved.oz;
        this.ignore = saved.ignore;
        this.isvisible = saved.isvisible;

        if(this.isvisible) lScene.lCMove(this);
    },

    setPosition: function(x, y, z)
    {
        this.x = x,
        this.y = y,
        this.z = z;
        this.ox = x,
        this.oy = y,
        this.oz = z;
    },
    getDistance: function(x, y, z)
    {
        return Math.hypot(x - this.x, y - this.y, z - this.z) - this.distance;
    },
    mkvisible: function(vis)
    {
        this.isvisible = vis;
    },
    getSceneXYZ: function()
    {
        return [this.x, this.y, this.z, 1.0];
    },
    copy: function(obj)
    {
        var cor = obj.getSceneXYZ();
        this.x = cor[0];
        this.y = cor[1];
        this.z = cor[2];
        this.ox = obj.ox;
        this.oy = obj.oy;
        this.oz = obj.oz;
        return this;
    },
    relative: function(obj, dx, dy, dz)
    {
        var ds = obj.getSceneXYZ()
        this.x = ds[0] + dx;
        this.y = ds[1] + dy;
        this.z = ds[2] + dz;
        this.ox = obj.ox + dx;
        this.oy = obj.oy + dy;
        this.oz = obj.oz + dz;
    },

    moveHere: function(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    },

    moveAbs: function(x, y, z)
    {
        this.x += x;
        this.y += y;
        this.z += z;
    },

    warp: function()
    {
        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;
    },
}


// For one offs
function LGroup(args, control) {
    LObject.call(this, new LGroupDef(args), control);
}
LGroup.prototype = Object.assign(Object.create(LObject.prototype), {
    constructor: LGroup
});
           
function LStructure(shader, args, control) {
    LObject.call(this, new LStructureDef(shader, args), control);
}
LStructure.prototype = Object.assign(Object.create(LObject.prototype), {
    constructor: LStructure
});


function lInitShaderProgram(vertexSource, fragSource)
{
    function loadShader(type, src)
    {
        const shader = lGl.createShader(type);
        lGl.shaderSource(shader, src);
        lGl.compileShader(shader);
        if(!lGl.getShaderParameter(shader, lGl.COMPILE_STATUS)) {
            alert("Compile error: " + lGl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    const vertexShader = loadShader(lGl.VERTEX_SHADER, vertexSource);
    const fragShader = loadShader(lGl.FRAGMENT_SHADER, fragSource);

    const prog = lGl.createProgram();
    lGl.attachShader(prog, vertexShader);
    lGl.attachShader(prog, fragShader);
    lGl.linkProgram(prog);

    if(!lGl.getProgramParameter(prog, lGl.LINK_STATUS)) {
        alert("Error: " + lGl.shaderInfoLog(prog));
        return null;
    }
    return prog;
}

// Keys

var lDoDown = function(num){};
var lDoUp = function(num){};

function LKey()
{
    this.val = false;
}
LKey.prototype = {
    constructor: LKey,
    ison: function()
    {
        return this.val;
    }
}

// LInput need to be a a static class

const lInput = {
    keys: {},
    register: function(keynum, func)
    {
        lInput.keys[keynum] = func;
    },
    press: function(keynum)
    {
        var obj = new LKey();

        lInput.register(keynum, function(ind) {obj.val = ind;});
        return obj;
    },
    onoff: function(keyon, keyoff)
    {
        var obj = new LKey();
        
        lInput.register(keyon, function(ind) {if(ind) obj.val = true;});
        lInput.register(keyoff, function(ind) {if(ind) obj.val = false;});
        return obj;
    },
    keydown: function(evt)
    {
        var ks = lInput.keys[evt.keyCode];
        if(!ks) return;
        ks(true);
    },
    keyup: function(evt)
    {
        var ks = lInput.keys[evt.keyCode];
        if(!ks) return;
        ks(false);
    },
    dodown: function(num)
    {
        var ks = lInput.keys[num];
        if(!ks) return ;
        ks(true);
    },

    doup: function(num)
    {
        var ks = lInput.keys[num];
        if(!ks) return ;
        ks(false);
    },

    usekeys: function()
    {
        document.onkeydown = lInput.keydown;
        document.onkeyup = lInput.keyup;
        lDoUp = lInput.doup;
        lDoDown = lInput.dodown;
    },
}

function LObjImport(text)
{
    // OBJ file import
    this.vertices = [];
    this.normals = [];
    this.coords = [];
    this.faces = {};    // An object representing supplied faces
    this.fidx = 0;       // The next face index to enter
    this.indexes = [];  // A list of "keys" to do

    this.lines = text.split("\n");
    // Split into words
    var lines = this.lines;
    var tlines = lines.length;

    this.tlines = tlines;

    this.oname = "_object_0";
    this.uname = "_material_0";
    this.gname = "_group_0";

    this.wcnt = 0;
    this.out = []

    this.umtl = new _LObjUsemtl("_object_0", "_group_0", "_material_0", "off");
    this.usemtls = {"///off": this.umtl};

    var pobj = false;
    var pmat = false;

    var tlines = this.tlines;
    var lines = this.lines;

    this.smgroup = "off";       // Starts off

    for(var i = 0; i < tlines;i++)
    {
        var line = lines[i].trim();
        if(line == "") continue;
        if(line.charAt(0) == "#") continue;
        var words = line.split(/\s+/);
        switch(words[0]) {
        case "v":
            this._proc_v(words);
            break;
        case "vt":
            this._proc_vt(words);
            break;
        case "vn":
            this._proc_vn(words);
            break;

        // Using the standard where "f" does not
        // access anything from below it in the file

        case "f":
            this._proc_f(words);
            break;
        case "s":       // Assume once per object/mtl combo
            if(words.length >= 2) {
                this.smgroup = words[1];
            } else {
                this.smgroup = "off";
            }
            this._changeobj();
            break;
        case "o":
            if(words.length <= 1)  {
                this.wcnt += 1;
                this.oname = "_object_" + this.wcnt.toString();
            } else {
                this.oname = words[1];
            }
            this._changeobj();
            break;
        case "g":
            if(words.length <= 1)  {
                this.wcnt += 1;
                this.gname = "_group_" + this.wcnt.toString();
            } else {
                this.gname = words[1];
            }
            this._changeobj();
            break;
        case "usemtl":
            if(words.length <= 1)  {
                this.wcnt += 1;
                this.uname = "_material_" + this.wcnt.toString();
            } else {
                this.uname = words[1];
            }
            this._changeobj();
            break;
        }
    }
    this._procobjs();
    this.lines = void(0);
}

LObjImport.prototype = {
    constructor: LObjImport,

    component: function(objname, mtlname)
    {
        if(!objname) objname = "";
        if(!mtlname) mtlname = "";
    
        var out = this.out;
        var rets = [];

        var olen = out.length;
        for(var i = 0; i < olen; i++) {
            var oline = out[i];
            if((objname == "" || objname == oline.oname) && (mtlname == "" || mtlname == oline.uname)) {
                rets.push(oline);
            }
        }
        return rets;
    },

    list: function()
    {
        var ent = {};
        for(var i = 0; i < this.out.length; i++) {
            var ol = this.out[i];
            if(ol.pointsIndex.length > 0)
                ent[ol.oname + "/" + ol.uname] = {object: ol.oname, material: ol.uname};
        }
        var ret = [];
        for(var key in ent) ret.push(ent[key]);
        return ret;
    },

                
    _changeobj: function()
    {
        var key = this.oname + "/" + this.uname + "/" + this.gname + "/" + this.smgroup;
        if(!(key in this.usemtls)) {
            this.umtl = new _LObjUsemtl(this.oname, this.uname, this.gname, this.smgroup);
            this.usemtls[key] = this.umtl;
        } else {
            this.umtl = this.usemtls[key];
        }
    },

            
    _procobjs: function()
    {
        for(var key in this.usemtls) {
            var umtl = this.usemtls[key];
            var comp = this._procumtl(umtl)
            if(comp) {
                if(comp.normalsArray.length == 0) comp.makenormals();
                if(umtl.smgroup != "off")
                    comp.smoother();
                this.out.push(comp);
            }
        }
    },

    _procumtl: function(umtl)
    {

        var newvert = [];
        var newnorm = [];
        var newcoor = [];
        var newinds = [];

        var oldverts = this.vertices;
        var oldnorms = this.normals;
        var oldcoor = this.coords;
        var oldinds = umtl.indexes;
        var faces = umtl.faces;
        var fidx = umtl.fidx;

        if(oldinds.length == 0) return null;

        // Set the new entries

        for(var key in faces) {
            var face = faces[key];
            var idx3 = face.idx * 3;
            var idx2 = face.idx * 2;
            var oldv = oldverts[face.v - 1];
            newvert[idx3] = oldv[0];
            newvert[idx3+1] = oldv[1];
            newvert[idx3+2] = oldv[2];
            if(face.vn) {
                var oldn;
                var oldn = oldnorms[face.vn - 1]
                newnorm[idx3] = oldn[0];
                newnorm[idx3+1] = oldn[1];
                newnorm[idx3+2] = oldn[2];
            }
            if(face.vt) {
                var oldt = oldcoor[face.vt - 1];
                newcoor[idx2] = oldt[0];
                newcoor[idx2+1] = oldt[1];
            } else {
                newcoor[idx2] = 0;
                newcoor[idx2+1] = 0;
            }
        }

        var ilen = oldinds.length;
        for(var i = 0; i < ilen; i++)
            newinds.push(oldinds[i].idx);

        var comp = new LComponent();
        comp.oname = umtl.oname;
        comp.uname = umtl.uname;

        comp.pointsArray = newvert;
        comp.normalsArray = newnorm;
        comp.textureCoords = newcoor;
        comp.pointsIndex = newinds;
        comp.numindexes = fidx;
        comp.numentries = ilen;

        return comp;
    },

    _proc_v: function(words)
    {
        this.vertices.push([lCoalesce(parseFloat(words[1]), 0),
            lCoalesce(parseFloat(words[2]), 0),
            lCoalesce(parseFloat(words[3]), 0)]);
    },
        
    _proc_vn: function(words)
    {
        // Normals need to be unit vectors in LimpetGE

        var x = lCoalesce(parseFloat(words[1]), 0);
        var y = lCoalesce(parseFloat(words[2]), 0);
        var z = lCoalesce(parseFloat(words[3]), 0);

        if(x != 0 || y != 0 || z != 0) {
            var h = Math.hypot(x, y, z);
            x = x / h;
            y = y / h;
            z = z / h;
        }

        this.normals.push([x, y, z]);
    },

    _proc_vt: function(words)
    {
        this.coords.push([lCoalesce(parseFloat(words[1]), 0), lCoalesce(parseFloat(words[2]), 0)]);
    },

    _proc_f: function(words)
    {
        // Assumes this done AFTER the vertices it references
        // Faces can be above 3 each
        // For four - Do a simple "2 triangle"
        // For more - assume convex, find a "central" point, an average of normals and textures, and go with that.
        var umtl = this.umtl;
        var numv = words.length - 1;

        var data = [];
        for(var i = 1; i <= numv; i++)
            data.push(this._getface(words[i]));

        for(var i = 0; i < numv; i++) {
            var dx = data[i];
            if(dx.key in umtl.faces) {
                dx.idx = umtl.faces[dx.key].idx;
            } else {
                umtl.faces[dx.key] = dx;
                dx.idx = umtl.fidx;
                umtl.fidx += 1;
            }
        }

        var idxs = umtl.indexes;

        if(numv < 3) {
            alert("Less that 3 vertex in face");
            return;
        } else {    // Should handle any cobvex polygon
            for(var n = 0; n < numv - 2; n++) {
                idxs.push(data[0]);
                idxs.push(data[n + 1]);
                idxs.push(data[n + 2]);
            }
        }
    },

    _getface: function(word)
    {
        var nums = word.split("/");

        function _gn(n)
        {
            if(typeof(n) == "undefined")
                return 0;
            else if (n === "")
                return 0;
            else {
                n = parseFloat(n);
                if (isNaN(n))
                    return 0;
                else
                    return n;
                }
        }

        var v = _gn(nums[0]);
        var vt = _gn(nums[1]);
        var vn = _gn(nums[2]);
        return {
            v: v,
            vt: vt,
            vn: vn,
            key: v.toString() + "/" + vt.toString() + "/" + vn.toString() ,
        };
    },
}

function _LObjUsemtl(oname, uname, gname, smgroup)
{
    this.indexes = [];
    this.faces = {};
    this.fidx = 0;
    this.oname = oname;
    this.uname = uname;
    this.gname = gname;
    this.smgroup = smgroup;
}
    

function LComponent()
{
    this.pointsArray = [];
    this.normalsArray = [];
    this.textureCoords = [];
    this.pointsIndex = [];
    this.numentries = 0;
    this.numindexes = 0;
}

LComponent.prototype = {
    constructor: LComponent,
    smoother: function()
    {
        // Returns "Sparse" array for one normal per vertex
        // Not htere if angle testing to be used
        // One normal per vertex
        // Do on the outs

        var verts = this.pointsArray;
        var norms = this.normalsArray;
        var coors = this.textureCoords;
        var indes = this.pointsIndex;
        var nument = this.numentries;
        var numind = this.numindexes

        var newstuff = {};
        var nidx = 0;
        var ixref = []

        for(var i = 0; i < numind; i++)
        {
            var j = indes[i];
            var i3 = j * 3;
            var i2 = j * 2;
            var v0 = verts[i3];
            var v1 = verts[i3 + 1];
            var v2 = verts[i3 + 2];
            var n0 = norms[i3];
            var n1 = norms[i3 + 1];
            var n2 = norms[i3 + 2];
            var c0 = coors[i2];
            var c1 = coors[i2 + 1];

            var k0 = Math.round(v0 * LOBJFILE_SMOOTH);
            var k1 = Math.round(v1 * LOBJFILE_SMOOTH);
            var k2 = Math.round(v2 * LOBJFILE_SMOOTH);
            // var key = v0.toString() + "/" + v1.toString() + "/" + v2.toString();
            var key = k0.toString() + "/" + k1.toString() + "/" + k2.toString();
            var itm;

            if(key in newstuff) {
                itm = newstuff[key];
                itm.n.push([n0, n1, n2]);
                itm.t.push([c0, c1]);
                itm.oi.push(j);
            } else {
                itm = {
                    v: [v0, v1, v2],
                    n: [[n0, n1, n2]],
                    t: [[c0, c1]],
                    i: nidx,
                    oi: [i],
                };
                newstuff[key] = itm;
                nidx += 1;
            }
            ixref.push(itm.i);
        }

        var nnorms = [];
        var nverts = [];
        var ncoors = [];

        for(var key in newstuff) {
            var itm = newstuff[key];
            var n0 = 0;
            var n1 = 0;
            var n2 = 0;
            var c0 = 0;
            var c1 = 0;
            var nlst = itm.n;
            var nlen = nlst.length;
            for(var i = 0; i < nlen; i++) {
                n0 += nlst[i][0];
                n1 += nlst[i][1];
                n2 += nlst[i][2];
                c0 += itm.t[i][0];
                c1 += itm.t[i][1];
            }
            var hy = Math.hypot(n0, n1, n2);
            if(hy != 0) {
                n0 /= hy;
                n1 /= hy;
                n2 /= hy;
            }
            var idx3 = itm.i * 3;
            var idx2 = itm.i * 2;

            nverts[idx3] = itm.v[0];
            nverts[idx3 + 1] = itm.v[1];
            nverts[idx3 + 2] = itm.v[2];
            nnorms[idx3] = n0;
            nnorms[idx3 + 1] = n1;
            nnorms[idx3 + 2] = n2;
            ncoors[idx2] = c0 / nlen;
            ncoors[idx2 + 1] = c1 / nlen;
        }

        var ninds = [];
        for(var i = 0; i < nument; i++)
            ninds.push(ixref[i]);

        this.pointsArray = nverts;
        this.normalsArray = nnorms;
        this.textureCoords = ncoors;
        this.pointsIndex = ninds;
        this.numindexes = nidx;
    },

    makenormals: function()
    {
        var nverts = [];
        var nnorms = [];
        var ncoors = [];
        var nindex = [];

        var onument = this.numentries;
        var onumind = this.numindexes;
        var overts = this.pointsArray;
        var oindex = this.pointsIndex;
        var ocoors = this.textureCoords;


        for(var i = 0; i < onument; i += 3) {
            var idx = oindex[i];
            var idx3 = idx * 3;
            var idx2 = idx * 2;
            var v00 = overts[idx3];
            var v01 = overts[idx3 + 1];
            var v02 = overts[idx3 + 2];
            var c00 = ocoors[idx2];
            var c01 = ocoors[idx2 + 1];
            var idx = oindex[i + 1];
            var idx3 = idx * 3;
            var idx2 = idx * 2;
            var v10 = overts[idx3];
            var v11 = overts[idx3 + 1];
            var v12 = overts[idx3 + 2];
            var c10 = ocoors[idx2];
            var c11 = ocoors[idx2 + 1];
            var idx = oindex[i + 2];
            var idx3 = idx * 3;
            var idx2 = idx * 2;
            var v20 = overts[idx3];
            var v21 = overts[idx3 + 1];
            var v22 = overts[idx3 + 2];
            var c20 = ocoors[idx2];
            var c21 = ocoors[idx2 + 1];

            var cr = vec3.create();

            // Cross multiply should be to point, from point, abti

            vec3.cross(cr, vec3.fromValues(v10 - v00, v11 - v01, v12 - v02), vec3.fromValues(v20 - v00, v21 - v01, v22 - v02));
            vec3.normalize(cr, cr);
            nnorms.push(cr[0]);
            nnorms.push(cr[1]);
            nnorms.push(cr[2]);
            nverts.push(v00);
            nverts.push(v01);
            nverts.push(v02);
            ncoors.push(c00);
            ncoors.push(c01);
   
            vec3.cross(cr, vec3.fromValues(v20 - v10, v21 - v11, v22 - v12), vec3.fromValues(v00 - v10, v01 - v11, v02 - v12));
            vec3.normalize(cr, cr);
            nnorms.push(cr[0]);
            nnorms.push(cr[1]);
            nnorms.push(cr[2]);
            nverts.push(v10);
            nverts.push(v11);
            nverts.push(v12);
            ncoors.push(c10);
            ncoors.push(c11);
    
            vec3.cross(cr, vec3.fromValues(v00 - v20, v01 - v21, v02 - v22), vec3.fromValues(v10 - v20, v11 - v21, v12 - v22));
            vec3.normalize(cr, cr);
            nnorms.push(cr[0]);
            nnorms.push(cr[1]);
            nnorms.push(cr[2]);
            nverts.push(v20);
            nverts.push(v21);
            nverts.push(v22);
            ncoors.push(c20);
            ncoors.push(c21);

            nindex.push(i);
            nindex.push(i+1);
            nindex.push(i+2);
        }

        this.pointsArray = nverts;
        this.normalsArray = nnorms;
        this.textureCoords = ncoors;
        this.pointsIndex = nindex;
        this.numindexes = onument;
    }
}


/* LPRNG returns integer */
function LPRNG(seed)
{
    seed = Math.floor(seed) % 2147483647;
    if (seed <= 0) seed += 2147483646;
    this.current = seed;
}

LPRNG.prototype = {
    constructor: LPRNG,
    next: function(scope)
    {
        this.current = (this.current * 16807)  % 2147483647
        return Math.floor(scope * this.current / 2147483647);
    }
}
/* LPRNG returns real  */
function LPRNGD(seed)
{
    seed = Math.floor(seed) % 2147483647;
    if (seed <= 0) seed += 2147483646;
    this.current = seed;
}

LPRNGD.prototype = {
    constructor: LPRNGD,
    next: function(scope)
    {
        this.current = (this.current * 16807)  % 2147483647
        return scope * this.current / 2147483647;
    }
}


function lElement(etype, eatts, etext, children)
{
    // Helper for creatin elements
    // args:
    //      tag (defaults to div)
    //      attributes (Object, or if string the class)
    //      text
    //      children (as an array, if applicable)
    //      tail - Text after the tag

    if (typeof etype == "undefined") etype = "div";
    if (typeof eatts == "undefined") eclass = "";
    else if(typeof eatts == "string") eatts = {class: eatts};
    if (typeof etext == 'undefined') etext = "";
    var ele = document.createElement(etype);
    if (eatts) {
        if (typeof eatts == "object") {
            for (var key in eatts) {
                ele.setAttribute(key, eatts[key]);
            }
        }
    }
    if(etext != "")
        ele.appendChild(document.createTextNode(etext));

    if(children) {
        if (typeof children == "object") {
            for(var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child)
                    ele.appendChild(child);
            }
        }
    }
    return ele;
}


function lAddButton(orient, vpos, hpos, label, code)
{
    var x = 0;
    var y = 0;

    var canvas = document.getElementById(LCANVAS_ID);

    switch (orient) {
    case "tl":
    case "tc":
    case "tr":
        y = LBUT_HEIGHT * 1.5 * vpos;
        break;
    case "bl":
    case "bc":
    case "br":
        y = (canvas.clientHeight - LBUT_HEIGHT)  - (LBUT_HEIGHT * 1.5 * vpos);
        break;
    }
    switch (orient) {
    case "tl":
    case "bl":
        x = LBUT_WIDTH * 1.5 * hpos;
        break;
    case "tc":
    case "bc":
        x = ((canvas.clientWidth - LBUT_WIDTH) / 2) + (LBUT_WIDTH * 1.5 * hpos);
        break;
    case "tr":
    case "br":
        x = (canvas.clientWidth - LBUT_WIDTH) - (LBUT_WIDTH * 1.5 * hpos);
        break;
    }


    var but = document.createElement("button");
    but.appendChild(document.createTextNode(label));

    but.className = "button";

    but.style.position = "absolute";
    but.style.width = LBUT_WIDTH.toString() + "px";
    but.style.height = LBUT_HEIGHT.toString() + "px";
    but.style.left = x.toString() + "px";
    but.style.top = y.toString() + "px";

    var dodown = "return lDoDown(" + code.toString() + ");";
    var doup = "return lDoUp(" + code.toString() + ");";

    but.setAttribute("onmousedown", dodown);
    but.setAttribute("onmouseup", doup);
    but.setAttribute("onmouseleave", doup);
    but.setAttribute("ontouchstart", dodown);
    but.setAttribute("ontouchend", doup);
    but.setAttribute("ontouchcancel", doup);

    return but;
}
    

function lCanvasResize()
{
    const canvas = lGl.canvas;
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;
    if(lCamera.setperspective) {
        lCamera.setperspective();
        lScene.lPos();
    }
    lGl.viewport(0, 0, canvas.width, canvas.height);
}

function lFromXYZR(x, y, z, r)
{
    var pos = mat4.create();
    var tmp = mat4.create();
    mat4.fromYRotation(pos, r);
    mat4.fromTranslation(tmp, vec4.fromValues(x, y, z, 1.0));
    mat4.multiply(pos, tmp, pos);
    return pos;
}

function lFromXYZ(x, y, z)
{
    var pos = mat4.create();
    mat4.fromTranslation(pos, vec4.fromValues(x, y, z, 1.0));
    return pos;
}

function lFromXYZPYR(x, y, z, dx, dy, dz)
{

    const out = mat4.create();
    const tmp = mat4.create();
    mat4.rotate(out, out, dy, [0.0, 1.0, 0.0]);
    mat4.rotate(out, out, dx, [1.0, 0.0, 0.0]);
    mat4.rotate(out, out, dz, [0.0, 0.0, 1.0]);
    mat4.fromTranslation(tmp, vec4.fromValues(x, y, z, 1.0));
    mat4.multiply(out, tmp, out);
    return out;
}

function lExtendarray(a, b)
{
    // A cheap means of extending an array
    var blen = b.length;
    for(var i = 0; i < blen; i++) a.push(b[i]);
}

function lGetPosition(posx, posy, posz, tmatrix)
{
    // Returnds [x, y, z] coodinates from (x, y, z, mat4)
    // Doubles up as getdirection for normals at the moment
    const coord = vec4.fromValues(posx, posy, posz, 1.0);
    vec4.transformMat4(coord, coord, tmatrix);
    return [coord[0], coord[1], coord[2]];
}

function lAntiClock(a, b, c)
{
    // See if anti clockwise
    // It ignores "z", so translations already done here

    var t = (b[0] * a[1]) + (c[0] * b[1]) + (a[0] * c[1]);
    var u = (a[0] * b[1]) + (b[1] * c[2]) * (c[0] * a[1]);

    if(t < u)
        return true;
    else
        return false;
}

function lCoalesce(a, b)
{
    if(a === 0 || a === false)
        return a;
    else if (a === null || a === "")
        return b;
    else if(!a)
        return b;
    else
        return a;
}

function lIndArray(args)
{
    var out = {};
    var alen = args.length;
    for(var i = 0; i < alen; i++) {
        var arg = args[i];
        out[arg[0]] = arg[1];
    }
    return out;
}
    
       
