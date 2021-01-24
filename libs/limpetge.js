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


import "./gl-matrix.js";

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;
const quat = glMatrix.quat;
const quat2 = glMatrix.quat2;

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

const LTMP_MAT4A = mat4.create();
const LTMP_MAT4B = mat4.create();
const LTMP_MAT4C = mat4.create();

const LTMP_QUATA = quat.create();
const LTMP_QUATB = quat.create();
const LTMP_QUATC = quat.create();

const LTMP_VEC3A = vec3.create();
const LTMP_VEC3B = vec3.create();
const LTMP_VEC3C = vec3.create();

var lGl;
var lCamera = null;
var lScene = null;

const lSScene = {
    directionalVector: vec3.create()
};

var _lStructureNum = 0;
const _lStructures = [];
var _lObjnum = 1;

// Define LKEY (Key numbers) here..
const LKEY = {
    CANCEL: 3,
    HELP: 6,
    BACK_SPACE: 8,
    TAB: 9,
    CLEAR: 12,
    RETURN: 13,
    ENTER: 14,
    SHIFT: 16,
    CONTROL: 17,
    ALT: 18,
    PAUSE: 19,
    CAPS_LOCK: 20,
    ESCAPE: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    PRINTSCREEN: 44,
    INSERT: 45,
    DELETE: 46,
    N0: 48,
    N1: 49,
    N2: 50,
    N3: 51,
    N4: 52,
    N5: 53,
    N6: 54,
    N7: 55,
    N8: 56,
    N9: 57,
    SEMICOLON: 59,
    EQUALS: 61,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    CONTEXT_MENU: 93,
    NUMPAD0: 96,
    NUMPAD1: 97,
    NUMPAD2: 98,
    NUMPAD3: 99,
    NUMPAD4: 100,
    NUMPAD5: 101,
    NUMPAD6: 102,
    NUMPAD7: 103,
    NUMPAD8: 104,
    NUMPAD9: 105,
    MULTIPLY: 106,
    ADD: 107,
    SEPARATOR: 108,
    SUBTRACT: 109,
    DECIMAL: 110,
    DIVIDE: 111,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    F13: 124,
    F14: 125,
    F15: 126,
    F16: 127,
    F17: 128,
    F18: 129,
    F19: 130,
    F20: 131,
    F21: 132,
    F22: 133,
    F23: 134,
    F24: 135,
    NUM_LOCK: 144,
    SCROLL_LOCK: 145,
    COMMA: 188,
    PERIOD: 190,
    SLASH: 191,
    LT: 188,
    GT: 190,
    QUESTION: 191,
    BACK_QUOTE: 192,
    OPEN_BRACKET: 219,
    BACK_SLASH: 220,
    CLOSE_BRACKET: 221,
    QUOTE: 222,
    META: 224,
};


/*
A set of classes to handle assets, pictures (textures), sounds,
OBJ files etc
*/

class LAssets {
    constructor(assets)
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
    
        for(let name in assets) {
            let asset = assets[name];
            let obj = _lAsset(name, asset);
            this.list.push(obj);
            this.assets[name] = obj;
            this.total += 1;
        }
    }

    download(obj)
    {
        if(obj.onend) this.onend = obj.onend;
        if(obj.inprogress) this.inprogress = obj.inprogress;

        let todo = LASSET_THREADS;
        if(this.total < todo) todo = this.total;

        for(let i = 0; i < todo; i++) this.download_next();
    }

    download_next()
    {
        let asset = this.list[this.next];
        this.next += 1;

        let self = this;

        function _cb(out)
        {
            if(out.ok) {
                self.succeeded += 1;
                self.ended += 1;
                // asset.data = out.data;
                // self.data[asset.name] = out.data;
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
    }

    get(name)
    {
        return this.assets[name];
    }

    getdata(name)
    {
        return this.assets[name].data;
    }
    getobject(name)
    {
        return this.assets[name].object;
    }
    getimage(name)
    {
        return this.assets[name].image;
    }
}
               

function _lAsset(name, args)
    {
        if(typeof(args) == "string") {
            args = {url:args};
        }
        let url = args.url;

        let mimetype = args.mimetype;
        if(!mimetype) mimetype = args.mime;
        if(!mimetype)
            mimetype = /[a-zA_Z0-9]*$/.exec(url)[0].toLowerCase();
        else
            mimetype = /[a-zA_Z0-9]*$/.exec(mimetype)[0].toLowerCase();
        let attempts = 0;
        let downloaded = false;
        let asset = null;
        let assettype = args.type;
        if(!assettype) {
        switch(mimetype) {
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
        case "image":
            assettype = "image";
            break;
        case "wav":
        case "mp3":
        case "mid":
        case "ra":
            assettype = "sound";
            break;
        case "obj":
        case "txt":
        case "text":
            assettype = "text";    // Text data
            break;
        default:
            assettype = "data";    // Binary data
            break;
        }

        assettype = assettype.toLowerCase();

        switch(assettype) {
        case "image":
            asset = new _LImageAsset(url);
            break;
        case "sound":
            asset = new _LAudioAsset(args);
            break;
        case "text":
            asset = new _LDataAsset(args, true);
            break;
        default:
            asset = new _LDataAsset(args, false);
            break;
        }
        return asset
    }
}

class _LAssetItem {
    constructor(args)
    {
        this.args = args;
        this.hasloaded = false;
        this.data = null;
        this.object = null;
        this.attempts = 0;
    }
    download(callback)
    {
        raise("Need to create derived function download");
    }
    bind(texture)
    {
        raise("The bind methid is not supported for this object");
    }
    getdata()
    {
        raise("The getdata method is not supported for this object");
    }
    getobject()
    {
        raise("The getobject method is not supported for this object");
    }
}



class _LDataAsset extends _LAssetItem{
    constructor(args, istext)
    {
        super(args);
        this.istext = istext;
    }
    download(callback)
    {
        // Keep all the "http" stuff here
        let self = this;
        this.hasloaded = false;
        let _cb = function(xhttp) {
            let out = {}
            try {
                out.ok = true;
                self.hasloaded = true;
                out.status = parseInt(xhttp.status);
                out.error = xhttp.statusText;
                if(out.status >= 200 && out.status < 400) {
                    let data = null;
                    if(self.istext)
                        data = xhttp.responseText;
                    else
                        data = xhttp.response;
                    if(!data)
                        self.data = null;
                    else
                        self.data = data;
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
                    self.data = null;
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

        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
        // if (xhttp.readyState == 4 && xhttp.status == 200) {
        if (xhttp.readyState == 4) {
            _cb(xhttp);
            }
        };

        xhttp.open("GET", this.args.url, true);
        if(this.istext)
            xhttp.responseType = "text";
        else
            xhttp.responseType = "blob";
        xhttp.send();
    }
    getdata()
    {
        return this.data;
    }
}

class _LImageAsset extends _LAssetItem {
    constructor(url)
    {
        super(url);
        this.image = new Image();
        this.thetexture = null;
    }
    download(callback)
    {
        let out = {};
        let self = this;
        let obj = this.image;
        this.hasloaded = false;
        obj.onload = function()
        {
            self.hasloaded = true;
            out.ok = true;
            out.status = 0;
            out.error = "";
            self.data = self.getobject();
            callback(out);

        }
        obj.onerror = function(errmess)
        {
            out.ok = false;
            out.status = 400;
            out.error = errmess;
            callback(out);
        }

        let url = this.args;
        if(url instanceof Blob) {
            obj.src = URL.createObjectURL(url);
        } else {
            obj.src = url;
        }
    }

    bind(texture)
    {
        function isPowerOf2(value)
        {
            return((value & (value - 1)) == 0)
        }
        const level = 0;
        const internalFormat = lGl.RGBA;

        const srcFormat = lGl.RGBA;
        const srcType = lGl.UNSIGNED_BYTE;

        this.thetexture = texture;
        const image = this.image;

        lGl.bindTexture(lGl.TEXTURE_2D, texture);
        if(this.hasloaded) {
            lGl.pixelStorei(lGl.UNPACK_FLIP_Y_WEBGL, true);
            lGl.texImage2D(lGl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
            if(isPowerOf2(image.width) && isPowerOf2(image.height)) {
                lGl.generateMipmap(lGl.TEXTURE_2D);
            } else {
                lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_WRAP_S, lGl.CLAMP_TO_EDGE);
                lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_WRAP_T, lGl.CLAMP_TO_EDGE);
                lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_MIN_FILTER, lGl.LINEAR);
            }
        } else {
            const pixel = new Uint8Array([0, 0, 255, 255]);
            const width = 1;
            const height = 1;
            const border = 0;
            lGl.texImage2D(lGl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
        }
        return texture;
    }
    getobject()
    {
        return this.image;
    }

    load()
    {
        let texture = lGl.createTexture();
        this.bind(texture);
        return texture;
    }

    reload(texture)
    {
        this.bind(texture);
        return texture;
    }
    gettexture()
    {
        return this.thetexture;
    }
}

class _LAudioAsset extends _LDataAsset {
    constructor(args)
    {
        super(args);
        this.audio = new Audio();
        this.laudios = [];
        this.idx = 0;
        this.num = 0;
        this.loopnum = 0;
    }
    download(callback)
    {
        let url = this.args.url;
        if(url instanceof Blob) {
            this.data = url;
            postdownload();
            this.hasloaded = true;
            let out = {};
            out.ok = true;
            out.status = 0;
            out.error = "";
            callback(out);
        } else {
            let self = this;
            super.download(
                function(out)
                {
                    if(out.ok) {
                        self.postdownload();
                    }
                    callback(out);
                });
        }
    }
    getobject()
    {
        return this.audio;
    }

    postdownload()
    {
        this.audio.src = URL.createObjectURL(this.getdata());
        this.laudios[0] = this.audio;
        this.num = 1;
        if(this.args.loop)
            this.audio.loop = true;
        else if(this.args.number) {
            this.setnum(this.args.number);
        }
    }

    start()
    {
        if(this.loopnum == 0) {
            this.audio.play();
        }
        this.loopnum += 1;
    }
    pause()
    {
        if(this.loopnum == 1) 
            this.audio.pause();
        if(this.loopnum > 0)
            this.loopnum -= 1;
    }
    rewind()
    {
        if(this.loopnum == 0) this.audio.currentTime = 0;
    }
    play()
    {
        this.idx += 1;
        if(this.idx >= this.num) this.idx = 0;
        let audio = this.laudios[this.idx];
        audio.play();
    }
    stop()
    {
        if(this.loopnum != 0) {
            this.loopnum = 0;
            this.audio.pause();
        }
    }
    setnum(num)
    {
        this.audio.loop = false;
        for(let i = 1; i < num; i++) {
            this.laudios.push(this.audio.cloneNode());
            this.num += 1;
        }
        return this;
    }
    setloop()
    {
        this.audio.loop = true;
        this.num = 1;
        this.laudios.length = 1;
        return this;
    }
}


/*
 * The following dos a independant image handling outside assets
 * Images we can "do" something with before loaded
 */
class LImage extends _LImageAsset
{
    constructor(url, texture)
    {
        super(url);
        let self = this;
        if(texture)
            this.download(function(x) {self.bind(texture);});
        else
            this.download(function(x){});
    }

}

class LAudios extends _LAudioAsset {
    constructor(src, num)
    {
        // I should use to get blob then load source
        // at some point
        // In the meantime hopefully browser caches OK
        super({url:src, number:num, type: "sound"});
        super.download(function(x) {});
    }
}

class LAudioLoop extends _LAudioAsset{
    constructor(src, num)
    {
        super({url:src, number:num});
        super.download(function(x) {});
    }
    play()
    {
        this.start();
    }
}

function lInit()
{
    window.onresize = lCanvasResize;
    const canvas = document.getElementById(LCANVAS_ID);
    // canvas.width = window.innerWidth - 20;
    // canvas.height = window.innerHeight - 20;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    lGl = canvas.getContext("webgl");
    if (!lGl) {
        alert("No WebGL!!");
        return null;
    }

    // Can compile stuff here

    for(let shobj of lShader_objects) {
        shobj.compile();
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
    for(let str of _lStructures) {
        if(!str.compiled) {
            str.shader.doInitBuffer(str);
            str.compiled = true;
        }
    }
}
// The LScenes class, 
// Register a callback that checks things

class LBase {
    constructor(args)
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
    
        let blf = lCoalesce(args.lCFrom, [-1000, -1000, -1000]);
        let trf = lCoalesce(args.lCTo, [1000, 1000, 1000]);
        let rsize = lCoalesce(args.lCSize, 1.0);
        let incsize = lCoalesce(args.lCIncrement, 0.1);
        // Following can change blf and trf
        for(let i = 0; i < 3; i++)
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
    
        this.lPointVectors = [];    // Point of lights
    }

    lLoop(delta) {alert("Need to overwrite this.lLoop(delta)"); return false;}

    lInit() { }  // overide to initialise things

    lMain()
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

        let then = 0;
        lStructureSetup();

        // A weird bug - first

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
    }

    lAddChild(child, position)
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

    }

    lPlace(child, position)
    {
        // Places at origin then moves to position
        this.lAddChild(child, mat4.create())
        let ve = vec3.create();
        let qu = quat.create();
        mat4.getTranslation(ve, position);
        mat4.getRotation(child.quat, position);
        child.x = ve[0];
        child.y = ve[1];
        child.z = ve[2];
        child.ox = ve[0];
        child.oy = ve[1];
        child.oz = ve[2];
    }
        
    lSetup()
    {
        // this.lPos();
        let out = [];
        for(let child of this.lChildren) {
            child.getStaticCollision(out, mat4.create());
        }

        for (let coll of out) {
            lScene.lCAddStaticArea(coll[0], coll[1], coll[2]);
        }
        lCamera._rotateScene();
    }
    lClear()
    {
        // This deregisters all objects as well
        this.lChildren = [];
        this._lSClear();
    }
    lPos()
    {
        const position = mat4.create();
        for(let child of this.lChildren) {
            child.recdraw(position);
        }
    }
    lMessage(mes, color)
    {
        let hasmess = true;
        if(!mes) mes = "";
        if(mes == "")  {
            hasmess = false;
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
    }

    lSetTitle(title)
    {
        if(this._lTTitle) {
            this._lTTitle.innerText = title;
        }
        this._lTitleString = title;
    }

    // Shader Lists
    _lSAdd(obj)
    {
        let structure = obj.structure;
        if(!structure) return;
        let shader = structure.shader;
        if(!shader) return;
        if(!(shader.key in this._lShaders)) 
            this._lShaders[shader.key] = [shader, {}];

        let buffers = this._lShaders[shader.key][1];

        if(!(structure.key in buffers))
            buffers[structure.key] = [structure.buffer, []];

        buffers[structure.key][1].push(obj);
    }

    _lSProcess()
    {
        for(let skey in this._lShaders) {
            let shader = this._lShaders[skey];
            let pshader = shader[0];
            let bufs = shader[1]
            pshader.useProgram();
            for(let ikey in bufs) {
                let buf = bufs[ikey];
                let sbuf = buf[0];
                pshader.useBuffer(sbuf);
                for(let obj of buf[1]) {
                    if(obj.isvisible)
                        pshader.doDraw(sbuf, obj.position, obj.control);
                }
            }
        }
    }

    /*
    compile()
    {
        // Compiles the _lShaders
        for(var skey in this._lShaders) {
            this._lShaders[skey][0].compile();
        }
    }
    */

    _lSClear()
    {
        this._lShaders = {};
    }

    lSwitch()
    {
        // Switch to this scene
        if(lScene) {
            lScene._lSavedObjnum = _lObjnum;
            lScene._lSavedSScene = {};
            for(let key in lSScene) {
                lScene._lSavedSScene[key] = lSScene[key];
            }
        }
        _lObjnum = this._lSavedObjnum;
        lCamera = this.lCamera;
        lSScene = {};
        for(let key in this._lSavedSScene) {
            lSScene[key] = this._lSavedSScene[key];
        }
        lScene = this;
        this.lSetTitle(this._lTitleString);
    }


    // The Collision Stuff

    lCAddStaticArea(ca, cb, obj)
    {
        // Area to add

        // Sewap things if neccessary

        const zones = this._lCStaticZones;
        const self = this;

        for(let i = 0; i < 3; i++)
        {
            if(ca[i] > cb[i]) {
                const t = ca[i];
                ca[i] = cb[i];
                cb[i] = t;
            }
        }

        const area = [ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], obj];

        // Put it straight in zone coordinates

        let aleft = Math.floor((ca[0] - this._lCCleft) / this._lCRsize)
        let abottom = Math.floor((ca[1] - this._lCCbottom) / this._lCRsize)
        let aback = Math.floor((ca[2] - this._lCCback) / this._lCRsize)
        let aright = Math.floor((cb[0] - this._lCCleft) / this._lCRsize)
        let atop = Math.floor((cb[1] - this._lCCbottom) / this._lCRsize)
        let afront = Math.floor((cb[2]- this._lCCback)  / this._lCRsize)

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
        for(let i = -1; i < 2; i += 2) {
            for(let j = -1; j < 2; j += 2) {
                for(let k = -1; k < 2; k += 2) {
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

        for(let x = aleft + 1; x <= aright - 1; x++) {
            _eaz(x, 0, abottom, -1, aback, -1);
            _eaz(x, 0, atop,     1, aback, -1);
            _eaz(x, 0, abottom, -1, afront, 1);
            _eaz(x, 0, atop,     1, afront, 1);
        }
        for(let y = abottom + 1; y <= atop - 1; y++) {
            _eaz(aleft, -1, y, 0, aback, -1);
            _eaz(aright, 1, y, 0, aback, -1);
            _eaz(aleft, -1, y, 0, afront, 1);
            _eaz(aright, 1, y, 0, afront, 1);
        }
        for(let z = aback + 1; z <= afront - 1; z++) {
            _eaz(aleft, -1, abottom, -1, z, 0);
            _eaz(aright, 1, abottom, -1, z, 0);
            _eaz(aleft, -1, atop, 1, z, 0);
            _eaz(aright, 1, atop, 1, z, 0);
        }

        // 6 Faces, (Not doing edges), but inside as well

        for(let y = abottom + 1; y <= atop - 1; y++) {
            for(let z = aback + 1; z <= afront - 1; z++) {
                _az(aleft, y, z);
                _az(aleft - 1, y, z);
                _az(aleft + 1, y, z);   // Inside
                _az(aright, y, z);
                _az(aright + 1, y, z);
                _az(aright - 1, y, z);  // Inside
            }
        }
        for(let x = aleft + 1; x <= aright - 1; x++) {
            for(let z = aback + 1; z <= afront - 1; z++) {
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
        for(let x = aleft + 1; x <= aright - 1; x++) {
            for(let y = abottom + 1; y <= atop - 1; y++) {
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


        for(let key in tzone) {
            let zn = zones[key];
            if(!zn) {
                zn = [];
                zones[key] = zn;
            }
            zn.push(area);
        }
    }

    lCStaticPointDetect(obj, dist)
    {
        // Point detects
        // With rays
        let signore = obj.ignore;
        obj.ignore = true;
        let coor = obj.getSceneXYZ();
        let x = coor[0];
        let y = coor[1];
        let z = coor[2];

        let ox = obj.ox;
        let oy = obj.oy;
        let oz = obj.oz;
        
        let dx = x - ox;
        let dy = y - oy;
        let dz = z - oz;

        obj.ox = x;
        obj.oy = y;
        obj.oz = z;

        let fact = ((dx * dx) + (dy * dy) + (dz * dz));

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

        for(let i = 0; i < fact; i++) {
            let out = this.lCStaticPDC(ox + (dx * i), oy + (dy * i), oz + (dz * i), dist);
            if(out !== null) {
                obj.ignore = signore;
                return out;
            }
        }
        obj.ignore = signore;
        return null;
    }

    lCAllStaticPointDetect(obj, dist, cback)
    {
        // Point detects
        // With rays

        let signore = obj.ignore;
        obj.ignore = true;
        let coor = obj.getSceneXYZ();
        let x = coor[0];
        let y = coor[1];
        let z = coor[2];

        let ox = obj.ox;
        let oy = obj.oy;
        let oz = obj.oz;
        
        let dx = x - ox;
        let dy = y - oy;
        let dz = z - oz;

        obj.ox = x;
        obj.oy = y;
        obj.oz = z;

        let fact = ((dx * dx) + (dy * dy) + (dz * dz));

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

        for(let i = 0; i < fact; i++) {
            this.lCAllStaticPDC(ox + (dx * i), oy + (dy * i), oz + (dz * i), dist, cback);
        }
        obj.ignore = signore;
    }

    lCStaticPDC(cox, coy, coz, dist)
    {
        // Static PDC

        let zones = this._lCStaticZones;

        let area = zones[this._lCGetidx(cox, coy, coz)];
        if(!area) return null;

        for(let sar of area) {
            let obj = sar[6];
            if(obj.isvisible && (!obj.ignore)) {
                if (  cox >= sar[0] - dist && cox <= sar[3] + dist &&
                        coy >= sar[1] - dist && coy <= sar[4] + dist &&
                        coz >= sar[2] - dist && coz <= sar[5] + dist) {
                    return sar[6];
                }
            }
        }
        return null;
    }

    lCAllStaticPDC(cox, coy, coz, dist, cback)
    {
        // Static PDC

        let zones = this._lCStaticZones;

        let area = zones[this._lCGetidx(cox, coy, coz)];
        if(!area) return null;

        for(let sar of area) {
            let obj = sar[6];
            if(obj.isvisible && (!obj.ignore)) {
                if (  cox >= sar[0] - dist && cox <= sar[3] + dist &&
                        coy >= sar[1] - dist && coy <= sar[4] + dist &&
                        coz >= sar[2] - dist && coz <= sar[5] + dist) {
                    cback(obj, [sar, cox, sar[0], sar[3],  coz,  sar[2], sar[5], dist]);
                }
            }
        }
    }

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

    lCAdd(obj) {
        let coor = obj.getSceneXYZ();
        let x = coor[0];
        let y = coor[1];
        let z = coor[2];

        let idx = this._lCGetidx(x, y, z);
        let dzs = this._lCDynamicZones[idx];
        if(!dzs) {
            dzs = [];
            this._lCDynamicZones[idx] = dzs;
        }
        dzs[obj.key] = obj;
        let dzone = obj.dzone;
        dzone.x = x;
        dzone.y = y;
        dzone.z = z;
        dzone.idx = idx;
    }
    lCRemove(obj)
    {
        let dzs = this._lCDynamicZones[obj.dzone.idx];
        if(dzs) {
            delete dzs[obj.key];
            if(dzs.length == 0) delete this._lCDynamicZones[obj.dzone.idx];
            obj.dzone.idx = -1;
        }
    }

    lCMove(obj)
    {
        let coor = obj.getSceneXYZ();
        let x = coor[0];
        let y = coor[1];
        let z = coor[2];

        let dzone = obj.dzone;
        if(dzone.x == x && dzone.y == y && dzone.z == z) return;

        let idx = this._lCGetidx(x, y, z);
        if(idx == dzone.idx) return;
        let dzs = this._lCDynamicZones[dzone.idx];
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

    }

    _lCGetidx(x, y, z)
    {
        return Math.floor((x - this._lCCleft) / this._lCRsize) +
               (Math.floor((y - this._lCCbottom) / this._lCRsize) * this._lCToty) +
               (Math.floor((z - this._lCCback) / this._lCRsize) * this._lCTotz);
    }

    _lCGetpidx(x, y, z)
    {
        return x + (y * this._lCToty) + (z * this._lCTotz);
    }

    lCDynamicPointDetect(obj, d)
    {
        let signore = obj.ignore;
        obj.ignore = true;

        let coor = obj.getSceneXYZ();

        let x = coor[0];
        let y = coor[1];
        let z = coor[2];

        let ox = obj.ox;
        let oy = obj.oy;
        let oz = obj.oz;

        let dx = x - ox;
        let dy = y - oy;
        let dz = z - oz;

        let dist = (dx * dx) + (dy * dy) + (dz * dz);

        if (dist <= this._lCIncsize2) {
            obj.ignore = signore;
            return this.lCDynamicPDC(x, y, z, d);
        }
        
        let num = Math.ceil(Math.sqrt(dist) / this._lCIncsize);
        let ix = dx / num;
        let iy = dy / num;
        let iz = dz / num;

        for(let i = 0; i < num; i++)
        {
            ox += ix;
            oy += iy;
            oz += iz;

            let out = this.lCDynamicPDC(ox, oy, oz, d);
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
    }

    lCAllDynamicPointDetect(obj, d, cback)
    {
        let signore = obj.ignore;
        obj.ignore = true;
        let coor = obj.getSceneXYZ();
        let x = coor[0];
        let y = coor[1];
        let z = coor[2];

        let ox = obj.ox;
        let oy = obj.oy;
        let oz = obj.oz;

        let dx = x - ox;
        let dy = y - oy;
        let dz = z - oz;

        let dist = (dx * dx) + (dy * dy) + (dz * dz);

        if (dist <= this._lCIncsize2) {
            this.lCAllDynamicPDC(x, y, z, d, cback);
            obj.ignore = signore;
            return;
        }
        
        let num = Math.ceil(Math.sqrt(dist) / this._lCIncsize);
        let ix = dx / num;
        let iy = dy / num;
        let iz = dz / num;

        for(let i = 0; i < num; i++)
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
    }

    lCDynamicPDC(x, y, z, d)
    {
        let rsize = this._lCRsize;
        let idx = this._lCGetidx(x, y, z);
        let toty = this._lCToty;
        let totz = this._lCTotz;
        let zones = this._lCDynamicZones;


        function _pdc(jd)
        {
            let dzs = zones[jd];
            if(!dzs) return null;
            for(let key in dzs) {
                let obj = dzs[key];
                if((!obj.ignore) && obj.isvisible) {
                    if(obj.getDistance(x, y, z) < d) {
                        return obj;
                    }
                }
            }
            return null;
        }
        // center

        let out = _pdc(idx); if(out !== null) return out;

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
    }

    lCAllDynamicPDC(x, y, z, d, cback)
    {
        let rsize = this._lCRsize;
        let idx = this._lCGetidx(x, y, z);
        let toty = this._lCToty;
        let totz = this._lCTotz;
        let zones = this._lCDynamicZones;


        function _pdc(jd)
        {
            let dzs = zones[jd];
            if(!dzs) return null;
            for(let key in dzs) {
                let obj = dzs[key];
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
    }

    lCPointDetect(obj, d)
    {
        let signore = obj.ignore;
        obj.ignore = true;
        let coor = obj.getSceneXYZ();
        let x = coor[0];
        let y = coor[1];
        let z = coor[2];


        let ox = obj.ox;
        let oy = obj.oy;
        let oz = obj.oz;

        let dx = x - ox;
        let dy = y - oy;
        let dz = z - oz;


        let dist = (dx * dx) + (dy * dy) + (dz * dz);

        if (dist <= this._lCIncsize2) {
            let out = this.lCStaticPDC(x, y, z, d);
            if(out == null) out = this.lCDynamicPDC(x, y, z, d);
            obj.ignore = signore;
            return out;
        }

        
        let num = Math.ceil(Math.sqrt(dist) / this._lCIncsize);
        let ix = dx / num;
        let iy = dy / num;
        let iz = dz / num;

        for(let i = 0; i < num; i++)
        {
            ox += ix;
            oy += iy;
            oz += iz;

            let out = this.lCStaticPDC(ox, oy, oz, d);
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
    }
    lCAllPointDetect(obj, d, cback)
    {
        let signore = obj.ignore;
        obj.ignore = true;
        let coor = obj.getSceneXYZ();
        let x = coor[0];
        let y = coor[1];
        let z = coor[2];


        let ox = obj.ox;
        let oy = obj.oy;
        let oz = obj.oz;

        let dx = x - ox;
        let dy = y - oy;
        let dz = z - oz;

        let dist = (dx * dx) + (dy * dy) + (dz * dz);

        if (dist <= this._lCIncsize2) {
            this.lCAllStaticPDC(x, y, z, d, cback);
            this.lCAllDynamicPDC(x, y, z, d, cback);
        }

        
        let num = Math.ceil(Math.sqrt(dist) / this._lCIncsize);
        let ix = dx / num;
        let iy = dy / num;
        let iz = dz / num;

        for(let i = 0; i < num; i++)
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

    }
};


class LCamera {
    constructor(args)
    {
        // One of these, so a dictionary object
        this.projection =  mat4.create();
    
        this.perspargs = {};
        this.setperspective(args);
    
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
        this.quatmat = mat4.create();       // Matrix of quaternian above
        this.position = mat4.create();  // Current Position of matrix
        this.currview =  mat4.create();      // View for drawing
        this.fixedview =  mat4.create();      // View for drawing
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
    
        // Belongs here or in "lScene", here so as not to clutter
    }

    save()
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
    }

    restore(saved)
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
    }

    setperspective(args)
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

    }

    getview()
    {
        // Retrieves the Matrix to pre-multiply drawing
        
        mat4.fromTranslation(LTMP_MAT4A, vec4.fromValues(-this.x, -this.y, -this.z, 1.0));

        mat4.fromQuat(LTMP_MAT4B, this.quat);

        mat4.multiply(this.position, LTMP_MAT4B, LTMP_MAT4A);
        mat4.multiply(this.currview, this.projection, this.position);
        mat4.multiply(this.fixedview, this.projection, LTMP_MAT4B);

        return this.currview;

    }

    rotate(mrx, mry, mrz)
    {
        if(mrx == 0 && mry == 0 && mrz == 0) return;

        quat.identity(LTMP_QUATA);
        if(mrx != 0.0) quat.rotateX(LTMP_QUATA, LTMP_QUATA, -mrx);
        if(mry != 0.0) quat.rotateY(LTMP_QUATA, LTMP_QUATA, -mry);
        if(mrz != 0.0) quat.rotateZ(LTMP_QUATA, LTMP_QUATA, -mrz);
        mat4.fromQuat(LTMP_MAT4A, LTMP_QUATA);
        mat4.fromQuat(LTMP_MAT4B, this.quat);
        mat4.multiply(LTMP_MAT4B, LTMP_MAT4A, LTMP_MAT4B);
        mat4.getRotation(this.quat, LTMP_MAT4B);
        quat.normalize(this.quat, this.quat);
        this._rotateScene();
    }


    rotateFlatHere(mrx, mry)
    {
        quat.identity(this.quat);
        this.rx = 0;
        this.ry = 0;
        this.rotateFlat(mrx, mry);
    }

    rotateFlat(mrx, mry)
    {

        // Flat rotates - does not rotate Z direction (roll)
        // And on Y access, (pitch) only 90 degrees
        // Can only look up or down 90 degrees

        // First the matrix

        // First - adjust rotation for each access
        let dor = false;
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
    }

    _rotateScene()
    {
        const wdl = lScene.lDirectionalVector;
        // This is st to nothing when not used
        if(wdl) {
            const wdv = lSScene.directionalVector;

            vec3.transformQuat(wdv, wdl, this.quat);
    
            /*
            mat4.fromQuat(this.quatmat, this.quat);
            mat4.fromTranslation(LTMP_MAT4A, vec4.fromValues(wdl[0], wdl[1], wdl[2], 1.0));
            mat4.multiply(LTMP_MAT4A, this.quatmat, LTMP_MAT4A);
            vec3.transformMat4(wdv, vec3.fromValues(0, 0, 0), LTMP_MAT4A);
            vec3.normalize(wdv, wdv);
            */
        }
        // For point of lights, I need to change the position of each

        for(let pol of lScene.lPointVectors) {
            let spol = lSScene.pointVectors[idx];
            spol[0] = pol[0] - lCamera.x;
            spol[1] = pol[1] - lCamera.y;
            spol[2] = pol[2] - lCamera.z;
            idx += 1;
        }
    }

    moveFlat(mx, my, mz)
    {
        // Move it on x/y access (floors) - Z is vertical (lifts)

        if(mx == 0.0 && my == 0 && mz == 0) return;

        // Movement
        //Coordinates
        mat4.fromYRotation(LTMP_MAT4B, this.ry);
        mat4.fromTranslation(LTMP_MAT4A, vec4.fromValues(mx, my, mz, 1.0));
        mat4.multiply(LTMP_MAT4A, LTMP_MAT4B, LTMP_MAT4A);

        // Get Coordinates
        const mvec =  vec3.create();
        mat4.getTranslation(mvec, LTMP_MAT4A);

        this.x += mvec[0];
        this.y += mvec[1];
        this.z += mvec[2];

        if(this.dynamic) lScene.lCMove(this);

    }

    moveHere(mx, my, mz)
    {
        this.x = mx;
        this.y = my;
        this.z = mz;
        if(this.dynamic) lScene.lCMove(this);
    }

    moveAbs(mx, my, mz)
    {
        this.x += mx;
        this.y += my;
        this.z += mz;
        if(this.dynamic) lScene.lCMove(this);
    }

    move(mx, my, mz)
    {
        if(mx == 0.0 && my == 0.0 && mz == 0,0) return;

        quat.invert(LTMP_QUATA, this.quat);

        mat4.fromQuat(LTMP_MAT4A, LTMP_QUATA);
        mat4.fromTranslation(LTMP_MAT4B, vec4.fromValues(mx, my, mz, 1.0));

        mat4.multiply(LTMP_MAT4A, LTMP_MAT4A, LTMP_MAT4B);    // Move then rotate (wrong way), so we know how far we have gone
        // Extract the x,y,z coordinates
        mat4.getTranslation(LTMP_VEC3A, LTMP_MAT4A);

        this.x += LTMP_VEC3A[0];
        this.y += LTMP_VEC3A[1];
        this.z += LTMP_VEC3A[2];
        if(this.dynamic) lScene.lCMove(this);
    }

    setTo(obj)
    {
        const opos = obj.position;

        const vo = mat4.getTranslation(LTMP_VEC3A, opos);
        quat.invert(LTMP_QUATA, mat4.getRotation(LTMP_QUATA, opos));

        this.x = vo[0];
        this.y = vo[1];
        this.z = vo[2];

        const qa = this.quat;

        if(qa[0] != LTMP_QUATA[0] || qa[1] != LTMP_QUATA[1] || qa[2] != LTMP_QUATA[2] || qa[3] != LTMP_QUATA[3]) {
            this.rx = obj.rx;
            this.ry = obj.ry;
            quat.copy(qa, LTMP_QUATA);
            this._rotateScene();
        }
        if(this.dynamic) lScene.lCMove(this);
    }

    warp()
    {
        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;
    }

    getSceneXYZ()
    {
        return [this.x, this.y, this.z, 1.0];
    }

    getDistance(x, y, z)
    {
        return Math.hypot(this.x - x, this.y - y, this.z - z) - this.distance;
    }

    procpos()
    {
        if(this.dynamic) lScene.lCMove(this);
    }
};
        

/*
 * LObject is a "thing" to display
 */
class LObject {
    constructor(structure, control)
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

    save()
    {
        let kids = [];
        for(let child of this.children) {
            kids.push(child.save());
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
    }

    restore(saved)
    {
        this._rrestore(saved);
        if(this.isvisible) {
            this.procpos();
        }
    }

    _rrestore(saved)
    {
        this.x = saved.x;
        this.y = saved.y;
        this.z = saved.z;
        this.ox = saved.ox;
        this.oy = saved.oy;
        this.oz = saved.oz;
        this.rx = saved.rx;
        this.ry = saved.ry;
        quat.copy(this.quat, saved.quat);
        this.hascoords = saved.hascoords;
        vec4.copy(this.xyzcoords, saved.xyzcoords);
        mat4.copy(this.position, saved.position);

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

        let kids = saved.children;
        let idx = 0;
        for(let child of this.children) {
            child._rrestore(kids[idx]);
            idx += 1;
        }
            
    }

    mkvisible(visible)
    {
        this.isvisible = visible;
        for(let child of this.children)
            child.rmkvisible(visible);
        if(this.dynamic) {
            if(visible)
                lScene.lCAdd(this);
            else
                lScene.lCRemove(this);
            
        }
    }
    rmkvisible(visible)
    {
        this.isvisible = visible;
        for(let child of this.children)
            child.rmkvisible(visible);
        if(this.dynamic) {
            if(visible)
                lScene.lCAdd(this);
            else
                lScene.lCRemove(this);
            
        }
    }

    warp()
    {
        let coor = this.getSceneXYZ();
        this.ox = coor[0];
        this.oy = coor[1];
        this.oz = coor[2];
    }

    getVec(ovec)
    {
        ovec[0] = this.x;
        ovec[1] = this.y;
        ovec[2] = this.z;
        return ovec;
    }

    move(mx, my, mz)
    {
        if(mx == 0.0 && my == 0.0 && mz == 0,0) return;

        mat4.fromQuat(LTMP_MAT4A, this.quat);
        mat4.fromTranslation(LTMP_MAT4B, vec4.fromValues(mx, my, mz, 1.0));

        mat4.multiply(LTMP_MAT4A, LTMP_MAT4A, LTMP_MAT4B);    // Move then rotate (wrong way), so we know how far we have gone
        // Extract the x,y,z coordinates
        mat4.getTranslation(LTMP_VEC3A, LTMP_MAT4A);

        this.x += LTMP_VEC3A[0];
        this.y += LTMP_VEC3A[1];
        this.z += LTMP_VEC3A[2];
    }

    vecMove(mx, my, mz)
    {
        this.move(v[0], v[1], v[2]);
    }

    moveMat(matrix)
    {
        mat4.fromQuat(LTMP_MAT4A, this.quat);
        mat4.multiply(LTMP_MAT4A, LTMP_MAT4A, matrix);    // Move then rotate (wrong way), so we know how far we have gone

        mat4.getTranslation(LTMP_VEC3A, LTMP_MAT4A);

        this.x += LTMP_VEC3A[0];
        this.y += LTMP_VEC3A[1];
        this.z += LTMP_VEC3A[2];

        mat4.getRotation(this.quat, LTMP_MAT4A);
    }

    moveFlat(mx, my, mz)
    {
        if(mx == 0.0 && my == 0.0 && mz == 0,0) return;

        mat4.fromYRotation(LTMP_MAT4A, this.ry);
        mat4.fromTranslation(LTMP_MAT4B, vec4.fromValues(mx, my, mz, 1.0));

        mat4.multiply(LTMP_MAT4A, LTMP_MAT4A, LTMP_MAT4B);    // Move then rotate (wrong way), so we know how far we have gone
        // Extract the x,y,z coordinates
        mat4.getTranslation(LTMP_VEC3A, LTMP_MAT4A);

        this.x += LTMP_VEC3A[0];
        this.y += LTMP_VEC3A[1];
        this.z += LTMP_VEC3A[2];

    }

    getSceneXYZ()
    {
        if(!this.hascoords) {
            let cor = this.xyzcoords;
            vec4.set(cor, 0, 0, 0, 1);
            vec4.transformMat4(cor, cor, this.position);
            this.hascoords = true;
        }
        return this.xyzcoords;
    }

    moveAbs(mx, my, mz)
    {
        // if(mx == 0.0 && my == 0.0 && mz == 0,0) return;
        this.x += mx;
        this.y += my;
        this.z += mz;
    }

    vecMoveAbs(v)
    {
        // if(mx == 0.0 && my == 0.0 && mz == 0,0) return;
        this.x += v[0];
        this.y += v[1];
        this.z += v[2];
    }

    moveHere(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    vecMoveHere(v)
    {
        this.x = v[0];
        this.y = v[1];
        this.z = v[2];
    }

    rotate(mrx, mry, mrz)
    {
        if(mrx == 0 && mry == 0 && mrz == 0) return;
        quat.identity(LTMP_QUATA);
        if(mrx != 0.0) quat.rotateX(LTMP_QUATA, LTMP_QUATA, mrx);
        if(mry != 0.0) quat.rotateY(LTMP_QUATA, LTMP_QUATA, mry);
        if(mrz != 0.0) quat.rotateZ(LTMP_QUATA, LTMP_QUATA, mrz);
        mat4.fromQuat(LTMP_MAT4A, LTMP_QUATA);
        mat4.fromQuat(LTMP_MAT4B, this.quat);
        mat4.multiply(LTMP_MAT4B, LTMP_MAT4B, LTMP_MAT4A);
        mat4.getRotation(this.quat, LTMP_MAT4B);
        quat.normalize(this.quat, this.quat);
    }

    rotateHere(mrx, mry, mrz)
    {
        const q = quat.identity(this.quat);
        if(mrx != 0.0) quat.rotateX(q, q, mrx);
        if(mry != 0.0) quat.rotateY(q, q, mry);
        if(mrz != 0.0) quat.rotateZ(q, q, mrz);
        quat.normalize(q, q);
    }

    rotateFlat(mrx, mry)
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
       
        quat.identity(LTMP_QUATA);
        if(mrx != 0.0) quat.rotateX(LTMP_QUATA, LTMP_QUATA, mrx);
        if(mry != 0.0) quat.rotateY(LTMP_QUATA, LTMP_QUATA, mry);
        mat4.fromQuat(LTMP_MAT4A, LTMP_QUATA);
        mat4.fromQuat(LTMP_MAT4B, this.quat);
        mat4.multiply(LTMP_MAT4B, LTMP_MAT4B, LTMP_MAT4A);
        mat4.getRotation(this.quat, LTMP_MAT4B);
        quat.normalize(this.quat, this.quat);
    }

    rotateFlatHere(mrx, mry)
    {
        this.rx = mrx;
        this.ry = mry;
        quat.identity(this.quat);
        const q = this.quat;
        if(mry != 0.0) quat.rotateY(q, q, mry);
        if(mrx != 0.0) quat.rotateX(q, q, mrx);
        quat.normalize(q, q);
    }
    procpos()
    {
        this.recdraw(this.baseposition);
        if(this.dynamic) lScene.lCMove(this);
    }

    recdraw(baseposition)
    {
        if(!this.isvisible) return;
        this.baseposition = baseposition;
        this.hascoords = false;

        const ma = this.position;

        mat4.fromQuat(LTMP_MAT4B, this.quat);
        mat4.fromTranslation(ma, vec4.fromValues(this.x, this.y, this.z, 1.0));
        mat4.multiply(ma, ma, LTMP_MAT4B);
        mat4.multiply(ma, this.initialPosition, ma);
        mat4.multiply(ma, baseposition, ma);

        for(let child of this.children) {
            child.recdraw(ma);
        }
    }

    getStaticCollision(out, baseposition)
    {
        this.baseposition = baseposition;
        this.hascoords = false;

        const pos = this.position;
        mat4.fromTranslation(pos, vec4.fromValues(this.x, this.y, this.z, 1.0));
        mat4.fromQuat(LTMP_MAT4B, this.quat);
        mat4.multiply(pos, pos, LTMP_MAT4B);
        mat4.multiply(pos, this.initialPosition, pos);
        mat4.multiply(pos, baseposition, pos);


        if(this.structure.collision == LSTATIC) {
            this.doGetStaticCollision(out, pos);
        } else if(this.dynamic) {
            lScene.lCMove(this);
        }
        for(let child of this.children) {
            child.getStaticCollision(out, pos);
            if(this.dynamic)
                this.warp();
        }
    }

    addChild(child, position)
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
        
    }
    remove()
    {
        // Removes from the child
        if(this.parent == null) return;      // Do not try and remove twice

        let parent = this.parent;

        const newchildren = [];
        for(let child of parent.children) {
            if (child != this) {
                newchildren.push(child);
            }
        }
        parent.children = newchildren;
        this.parent = null;
        mat4.identity(this.initialPosition);
    }

    doGetStaticCollision(out, pos)
    {
        /*
        // Get the position
        let pos = mat4.create();
        let tmp = mat4.create();

        mat4.fromTranslation(pos, vec4.fromValues(this.x, this.y, this.z, 1));
        // mat4.multiply(pos, tmp, position);
        mat4.fromQuat(tmp, this.quat);
        mat4.multiply(pos, pos, tmp);

        mat4.multiply(pos, pos, position);
        */


        for(let corner of this.structure.corners) {
            let minx = 0;
            let maxx = 0;
            let miny = 0;
            let maxy = 0;
            let minz = 0;
            let maxz = 0;

            let first = true;

            for(let key in corner) {
                let loc = corner[key];

                let coord = vec4.fromValues(loc[0], loc[1], loc[2], 1.0);


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
    }

    setDistance(diam)
    {
        this.distance = diam;
    }

    getDistance(x, y, z)
    {
        let ve = this.getSceneXYZ();
        return Math.hypot(ve[0] - x, ve[1] - y, ve[2] - z) - this.distance;
    }
}


/*
 A visually independant object
 needs to specifically decide
 to make it visible
 (rmkvisible ignored)
 */

class LIObject extends LObject {
    constructor(structure, control)
    {
        super(structure, control);
    }
    rmkvisible(vis) { }
}
        
/*
 * An object that can only go on scene,
 * This is optimised not to do parents
 */
class LWObject extends LObject  {
    constructor(structure, control)
    {
        super(structure, control);
    }
    
    warp(obj)
    {
        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;
    }

    setOld(obj)
    {
        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;
    }

    getSceneXYZ()
    {
        return [this.x, this.y, this.z];
    }

    recdraw(baseposition)
    {
        if(!this.isvisible) return;
        this.baseposition = baseposition;
        this.hascoords = false;

        const ma = this.position;
        mat4.fromTranslation(ma, vec4.fromValues(this.x, this.y, this.z, 1.0));
        mat4.fromQuat(LTMP_MAT4B, this.quat);
        mat4.multiply(ma, ma, LTMP_MAT4B);
        mat4.multiply(ma, this.initialPosition, ma);
        // mat4.multiply(ma, baseposition, ma);

        this.position = ma;

        for(let child  of this.children) {
            child.recdraw(ma);
        }
    }

    setDistance(diam)
    {
        this.distance = diam;
    }

    getDistance(x, y, z)
    {
        return Math.hypot(this.x - x,this.y - y, this.z - z) - this.distance;
    }

    setOnTo(obj)
    {
        // Done after procpos 
        if(!this.isvisible) return;
        this.hascoords = false;

        const ma = this.position;
        mat4.fromTranslation(ma, vec4.fromValues(this.x, this.y, this.z, 1.0));
        mat4.fromQuat(LTMP_MAT4B, this.quat);
        mat4.multiply(ma, ma, LTMP_MAT4B);
        mat4.multiply(ma, this.initialPosition, ma);
        mat4.multiply(ma, obj.position, ma);

        mat4.getTranslation(LTMP_VEC3A, ma);
        this.x = LTMP_VEC3A[0];
        this.y = LTMP_VEC3A[1];
        this.z = LTMP_VEC3A[2];

        mat4.getRotation(this.quat, obj.position);
        // MoveFlat not supported on SetTo

    }
}


/*
 * A static group does not have positions or movement, just passes things 
 * down to children as efficiently as possible
 */

class LStaticGroup {
    constructor()
    {
        this.baseposition = mat4.create();
        this.children = [];
    }

    procpos()
    {
        this.recdraw(this.baseposition);
    }
    recdraw(baseposition)
    {
        this.baseposition = baseposition;
        for(let child of this.children) {
            child.recdraw(baseposition);
        }
    }

    getStaticCollision(out, baseposition)
    {
        for(let child of this.children) {
            child.getStaticCollision(out, baseposition);
        }
    }

    addChild(child, position)
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

    }
    remove(parent)
    {
        // Removes from the child
        if(this.parent == null) return;      // Do not try and remove twice
        const clen = parent.children.length;
        const newchildren = [];
        for(let child of parent.children) {
            if (child != this) {
                newchildren.push(parent.children[i]);
            }
        }
        parent.children = newchildren;
        this.parent = null;
        mat4.identity(this.initialPosition);
    }
}

class _LBaseDef {
    constructor(args) {
        if(!args) args = {};
        this.corners = [];     // Collision areas _ Static areas
        this.distance = 0;      // Distance for dynamic ones
        this.collision = LNONE;  // Collision type
        let collision = args.collision;
        if(collision) this.collision = collision;
        if(collision == LDYNAMIC) {
            let distance = args.distance;
            if(distance) this.distance = distance;
        }
    }
    useCorners(crn, args)
    {
        if(!this.collision == LSTATIC) return
        if(args.corners) crn = args.corners;
        if(args.corners === null) return;
        if(args.corners === false) return;
        if(!crn) return;
        let csize = args.collsize;

        if(csize < 0) return;

        if(!csize) {
            this.corners.push(crn);
            return;
        }

        let minx = 0;
        let maxx = 0;
        let miny = 0;
        let maxy = 0;
        let minz = 0;
        let maxz = 0;

        let first = true;

        for(var key in crn) {
            let itm = crn[key];
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

        let tx = Math.ceil((maxx - minx) / csize);
        let ty = Math.ceil((maxy - miny) / csize);
        let tz = Math.ceil((maxz - minz) / csize);

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

            let svx = sv[0];
            let svy = sv[1];
            let svz = sv[2];

            let evx = ev[0];
            let evy = ev[1];
            let evz = ev[2];

            let iix = svx + (xd * ((evx - svx) / td));
            let iiy = svy + (xd * ((evy - svy) / td));
            let iiz = svz + (xd * ((evz - svz) / td));

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
            

        let wcrn = [crn];
        if(tx > 1) 
        {
            let txcrn = [];
            let ocrn = {
                htr: crn.htl,
                ftr: crn.ftl,
                hbr: crn.hbl,
                fbr: crn.fbl,
            };

            for(var i = 1; i <= tx; i++) {
                let nxcrn = {
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
            let tycrn = [];
            for(var i = 0; i < tx; i++) {
                let xcrn = wcrn[i];
                let ocrn = {
                        htl: xcrn.hbl,
                        htr: xcrn.hbr,
                        ftl: xcrn.fbl,
                        ftr: xcrn.fbr,
                };

                for(var j = 1; j <= ty; j++) {
                    let nycrn = {
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
            let tzcrn = [];
            let xy = tx * ty;
            for(var ij = 0; ij < xy; ij++) {
                let zcrn = wcrn[ij];
                let ocrn = {
                        fbl: zcrn.hbl,
                        fbr: zcrn.hbr,
                        ftl: zcrn.htl,
                        ftr: zcrn.htr,
                };
                for(var k = 1; k <= tz; k++) {
                    let nzcrn = {
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

        for(var wcr of wcrn) {
            this.corners.push(wcr);
        }
    }

    consolidateCorners(args)
    {
        let corners = this.corners;

        let first = true;

        let minx = 0;
        let miny = 0;
        let minz = 0;
        let maxx = 0;
        let maxy = 0;
        let maxz = 0;

        for(var crn of corners) {
            for(var key in crn) {
                let coord = crn[key];
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
}
        

class LGroupDef extends _LBaseDef {
    constructor(args)
    {
        super(args);
    }
}



class LStructureDef extends _LBaseDef {
    constructor(shader, args)
    {
        super(args);
        this.shader = shader;
        this.args = args; // Any arguments, processed by doInitBuffer
        this.numblocks = 0;     // Number of blocks
        this.numentries = 0;    // Number of Array entries (numblocks * 36)
        this.numindexes = 0;    // Number of Array entries (numblocks * 36)
        this.pointsArray = [];
        this.normalsArray = [];
        this.pointsIndex = [];
        this.coordsArray = [];    // Matrix of texture coordinates
        this.buffer = {}
    
    
        _lStructures.push(this);
        _lStructureNum += 1;
        this.key = _lStructureNum;
        this.compiled = false;
    }

    // Importing foreign stuff
    // Currently just use objectname, materialname to get entry

    addImport(args)
    {
        this._procargs(args, 1);
        let position = args.position;
        let data = args.data;
        let texturecontrol = args.texturecontrol;
        if(!data) return;   // Nothing to import

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        let normals = this.normalsArray;
        let points = this.pointsArray;
        let indexes = this.pointsIndex;
        let coords = this.coordsArray;

        let onumind = this.numindexes;

        // Data is a LIST of LComponent instances

        let dlen = data.length;
        for(let dline of data) {
            let numindexes = this.numindexes;
            let numentries = this.numentries;
            let inumindexes = dline.numindexes;
            let inumentries = dline.numentries;
            let inormals = dline.normalsArray;
            let ipoints = dline.pointsArray;
            let iindexes = dline.pointsIndex;
            let icoords = dline.coordsArray;
    
            let vi = 0;
            let vc = 0;
    
            for(let i = 0; i < inumindexes; i++) {
                vi = i * 3;
                vc = i * 2;
    
                lExtendarray(points, lGetPosition(ipoints[vi], ipoints[vi + 1], ipoints[vi + 2], position));
                lExtendarray(normals, lGetPosition(inormals[vi], inormals[vi + 1], inormals[vi + 2], normalMatrix));
                lExtendarray(coords, texturecontrol.coords(icoords[vc], icoords[vc + 1]));
            }
            for(let i = 0; i < inumentries; i++) {
                indexes.push(iindexes[i] + numindexes);
            }
    
            this.numentries += inumentries;
            this.numindexes += inumindexes;
        }
        // process corners

        if(this.collision == LSTATIC) {
            let tind = this.numindexes;
            if(tind > onumind) {
                if(!("corners" in args)) {
                    let minx = points[tind];
                    let miny = points[tind + 1];
                    let minz = points[tind + 2];
                    let maxx = points[tind];
                    let maxy = points[tind + 1];
                    let maxz = points[tind + 2];
                    for(let i = onumind + 3; i < tind; i+=3) {
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
    }

    addBlock(args)
    {
        this._procargs(args, 6);

        let position = args.position;
        let point = args.size;
        let hold = args.hold;
        let textcontrols = args.texturecontrols;
        let insideout = lCoalesce(args.insideout, false);

        // Two oposite corners of a cartesian block
        // Reurns points array for triangle fill
        // order returned is front, back, top, bottom, left, right

        // For the buffers, the points are the only thing that are dynamic
        // here.  The Normals are not, (though may be in future if otherwise)
    
        // TODO - Put transfoirmation matrices here??

        let pointa = [];
        let pointb = [];
        for(let i = 0; i < 3; i++)
        {
            let p = point[i];
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

        let numindexes = this.numindexes;
        let numentries = this.numentries;
        let normals = this.normalsArray;
        let points = this.pointsArray;
        let indexes = this.pointsIndex;
        let coords = this.coordsArray;

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
            lExtendarray(coords, textcontrols[sple].anticlockwise());
            
            if(insideout)
                lExtendarray(indexes, [numindexes, numindexes + 3, numindexes + 2, numindexes + 2, numindexes + 1, numindexes]);
            else
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
    }
    addBlockPatch(args)
    {

        this._procargs(args, 1);

        let position = args.position;
        let point = args.size;
        let textcontrol = args.texturecontrol;

        // Two oposite corners of a cartesian block
        // Reurns points array for triangle fill
        // order returned is front, back, top, bottom, left, right

        // For the buffers, the points are the only thing that are dynamic
        // here.  The Normals are not, (though may be in future if otherwise)
    
        // TODO - Put transfoirmation matrices here??

        let pointa = [];
        let pointb = [];

        for(let i = 0; i < 2; i++)
        {
            let p = point[i];
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

        let numindexes = this.numindexes;
        let numentries = this.numentries;
        let normals = this.normalsArray;
        let points = this.pointsArray;
        let indexes = this.pointsIndex;
        let coords = this.coordsArray;

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
            lExtendarray(coords, textcontrol.anticlockwise());

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
    }

    addCylinder(args)
    {
        this._procargs(args, 3);
        let position = args.position;
        let radius = args.radius;
        let depth = args.depth;
        let hold = args.hold;
        let insideout = lCoalesce(args.insideout, false);

        let segments = args.segments;
        if(!segments) segments = 32;

        let textures = args.texturecontrols;

        // Cylinder, needs depth, radius

        let points = this.pointsArray;
        let normals = this.normalsArray;
        let coords = this.coordsArray;
        let indexes = this.pointsIndex;
        let numindexes = this.numindexes;
        let numentries = this.numentries;

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        if(!hold.includes(LI_SIDE))
        {
            let tsides = textures[LI_SIDE];
            // First going around anti clockwise around Z, from bottom
            for(let i = 0; i <= segments; i++)
            {
                let ang = Math.PI * 2 * i / segments;
                let x = 0 - Math.sin(ang);
                let y = Math.cos(ang);
    
                // Back first
                lExtendarray(points, lGetPosition(x * radius, y * radius, -depth, position));
                lExtendarray(points, lGetPosition(x * radius, y * radius, depth, position));
                lExtendarray(normals, lGetPosition(x, y, 0, normalMatrix));
                lExtendarray(normals, lGetPosition(x, y, 0, normalMatrix));
                lExtendarray(coords, tsides.coords(i / segments, 1));
                lExtendarray(coords, tsides.coords(i / segments, 0.0));
    
                if(i < segments) {
                    let bl = i * 2;
                    let tl = bl + 1;
                    let br = tl + 1;
                    let tr = br + 1;
                    if(insideout)
                        lExtendarray(indexes, 
                            [numindexes + bl, numindexes + tl, numindexes + tr, numindexes + tr, numindexes + br, numindexes + bl]
                        );
                    else
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
            for(let i = 0; i < segments; i++)
            {
                let ang = Math.PI * 2 * i / segments;
                let x = 0 - Math.sin(ang);
                let y = Math.cos(ang);
                lExtendarray(points, lGetPosition(x * radius, y * radius, -depth, position));
                lExtendarray(normals, tnorm);
                lExtendarray(coords, tback.coords(0.5 - x/2, 0.5 + y/2));    // Switched around
                let j = i + 1;
                if(j >= segments) j = 0;
                if(insideout)
                    lExtendarray(indexes, [origi, i + numindexes, j + numindexes]);  // Oposite to front
                else
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
            for(let i = 0; i < segments; i++)
            {
                let ang = Math.PI * 2 * i / segments;
                let x = 0 - Math.sin(ang);
                let y = Math.cos(ang);
                lExtendarray(points, lGetPosition(x * radius, y * radius, depth, position));
                lExtendarray(normals, tnorm);
                lExtendarray(coords, tback.coords(0.5 + x/2, 0.5 + y/2));
                let j = i + 1;
                if(j >= segments) j = 0;
                if(insideout)
                    lExtendarray(indexes, [origi, j + numindexes, i + numindexes]);  // opposite to back
                else
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
    }

    addCirclePatch(args)
    {
        this._procargs(args, 1);
        let position = args.position;
        let radius = args.radius;
        let hold = args.hold;
        let insideout = lCoalesce(args.insideout, false);

        let segments = args.segments;
        if(!segments) segments = 32;

        let textcontrol = args.texturecontrol;

        // Cylinder, needs depth, radius

        let points = this.pointsArray;
        let normals = this.normalsArray;
        let coords = this.coordsArray;
        let indexes = this.pointsIndex;
        let numindexes = this.numindexes;
        let numentries = this.numentries;

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        const tback = textcontrol;
        const tnorm = lGetPosition(0.0, 0.0, 1.0, normalMatrix);
        lExtendarray(points, lGetPosition(0.0, 0.0, 0.0, position));
        lExtendarray(normals, tnorm);
        lExtendarray(coords, tback.coords(0.5, 0.5));
        const origi = numindexes;
        numindexes += 1;
        for(let i = 0; i < segments; i++)
        {
            let ang = Math.PI * 2 * i / segments;
            let x = 0 - Math.sin(ang);
            let y = Math.cos(ang);
            lExtendarray(points, lGetPosition(x * radius, y * radius, 0, position));
            lExtendarray(normals, tnorm);
            lExtendarray(coords, tback.coords(0.5 + x/2, 0.5 + y/2));
            let j = i + 1;
            if(j >= segments) j = 0;
            if(insideout)
                lExtendarray(indexes, [origi, j + numindexes, i + numindexes]);  // opposite to back
            else
                lExtendarray(indexes, [origi, i + numindexes, j + numindexes]);  // opposite to back
            numentries += 3;
        }
        numindexes += segments;

        this.numindexes = numindexes;
        this.numentries = numentries;
        this.numblocks += 1;

        this.useCorners(
        {
            ftr: lGetPosition( radius,   radius,  0, position),
            fbr: lGetPosition( radius,  -radius,  0, position),
            fbl: lGetPosition(-radius,  -radius,  0, position),
            ftl: lGetPosition(-radius,   radius,  0, position),
            btr: lGetPosition( radius,   radius,  0, position),
            bbr: lGetPosition( radius,  -radius,  0, position),
            bbl: lGetPosition(-radius,  -radius,  0, position),
            btl: lGetPosition(-radius,   radius,  0, position),
        }, args);

    }

    addPolygon(args)
    {
        // Cor is an array of 2d coordintes (each is a 2d array)
        // Criteria - coords 0.0 point must be INSIDE polygoon, (and cannot BE 0.0) (not counting position of course)
        //      Needs also to be convex
        //      cor is in anticlockwise order

        // Normal matrix

        let cor = args.coords;
        let depth = args.depth;
        let numsides = cor.length;        // Number of coordinates
        let ilen = numsides + 2;
        this._procargs(args, ilen);
        let hold = args.hold;
        let textcontrols = args.texturecontrols;
        let position = args.position;
        let insideout = lCoalesce(args.insideout, false);

        let texcors = new _L2Coords(cor);

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


        let hcor = [];
        let fcor = [];

        let mins = [0.0, 0.0, 0.0];
        let maxs = [0.0, 0.0, 0.0];

        let meanx = 0;
        let meany = 0;

        // Get the coordinates
        for(let i = 0; i < numsides; i++) {
            let hc = postrans(cor[i], depth);
            let fc = postrans(cor[i], -depth);

            meanx += cor[i][0];
            meany += cor[i][0];

            hcor[i] = hc;
            fcor[i] = fc;

            for(let j = 0; j < 3; j++) {
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


        let normals = [];
        let points = []
        let indexes = [];
        let coords = [];

        let center = [meanx / numsides, meany / numsides];


        // First he origins

        let oforward = postrans(center, -depth);
        let oback = postrans(center, depth);
        let onforward = normtrans([0.0, 0.0, -1.0]);
        let onback = normtrans([0.0, 0.0, 1.0]);
        let numindexes = this.numindexes;
        let numentries = this.numentries;   // Set up the indexes so we do not need to do later

        let fcen = -1;
        let hcen = -1;

        if(!hold.includes(LI_FRONT)) {
            lExtendarray(points, oforward);
            lExtendarray(coords, textcontrols[LI_FRONT].coorda(texcors.coords(0, 0, false)));
            lExtendarray(normals, onforward);       
            fcen = numindexes;
            numindexes += 1;
        }
        if(!hold.includes(LI_BACK)) {
            lExtendarray(points, oback);
            lExtendarray(coords, textcontrols[LI_BACK].coorda(texcors.coords(0, 0, true)));
            lExtendarray(normals, onback);       
            hcen = numindexes;
            numindexes += 1;
        }

        let hicor = [];
        let ficor = [];

        // front
        let texts = textcontrols[LI_FRONT];
        for(let i = 0; i < numsides; i++)
        {
            lExtendarray(points, fcor[i]);
            lExtendarray(normals, onforward);
            lExtendarray(coords, texts.coorda(texts.coorda(cor[i], false)));
            ficor[i] = numindexes;
            numindexes += 1;
        }

        texts = textcontrols[LI_BACK];
        for(let i = 0; i < numsides; i++)
        {
            lExtendarray(points, hcor[i]);
            lExtendarray(normals, onback);
            lExtendarray(coords, texts.coorda(texts.coorda(cor[i], true)));
            hicor[i] = numindexes;
            numindexes += 1;
        }

        for(let i = 0; i < numsides; i++)
        {
            let ti = i + 2;
            if(!hold.includes(ti)) {
                let j = i + 1;
                if(j == numsides) j = 0;
                if(!hold.includes(LI_FRONT)) {
                    if(insideout) {
                        indexes.push(fcen);
                        indexes.push(ficor[i]);
                        indexes.push(ficor[j]);
                    } else {
                        indexes.push(fcen);
                        indexes.push(ficor[j]);
                        indexes.push(ficor[i]);
                    }
                    numentries += 3;
                }
                if(!hold.includes(LI_BACK)) {
                    if(insideout) {
                        indexes.push(hcen);
                        indexes.push(hicor[j]);
                        indexes.push(hicor[i]);
                    } else {
                        indexes.push(hcen);
                        indexes.push(hicor[i]);
                        indexes.push(hicor[j]);
                    }
                    numentries += 3;
                }
            }
        }

        let vecs = [];

        for(let i = 0; i < numsides; i++)
        {
            let ti = i + 2;
            if(hold.includes(ti)) continue;

            let texs = textcontrols[ti];

            let j = i + 1;
            if(j == numsides) j = 0;
            

            let cx = cor[j][0] - cor[i][0];
            let cy = cor[j][1] - cor[i][1];

            let h = Math.hypot(cx, cy);

            let snorm = normtrans([cy /h, -cx/h, 0.0], normalMatrix);        // The Normal

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

            if(insideout)
                lExtendarray(indexes, [numindexes + 2, numindexes + 1, numindexes, numindexes, numindexes + 3, numindexes + 2]);
            else
                lExtendarray(indexes, [numindexes + 2, numindexes, numindexes + 1, numindexes, numindexes + 2, numindexes + 3]);
            numindexes += 4;
            numentries += 6;
        }

        this.pointsArray = this.pointsArray.concat(points);
        this.normalsArray = this.normalsArray.concat(normals);
        this.pointsIndex = this.pointsIndex.concat(indexes);
        this.coordsArray = this.coordsArray.concat(coords);

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
    }

    addPolygonPatch(args)
    {
        // Cor is an array of 2d coordintes (each is a 2d array)
        // Criteria - coords 0.0 point must be INSIDE polygoon, (and cannot BE 0.0) (not counting position of course)
        //      Needs also to be convex
        //      cor is in anticlockwise order

        // Normal matrix

        let cor = args.coords;
        let numsides = cor.length;        // Number of coordinates
        let ilen = numsides + 2;
        this._procargs(args, ilen);
        let textcontrols = args.texturecontrols;
        let position = args.position;
        let insideout = lCoalesce(args.insideout, false);

        let texcors = new _L2Coords(cor);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);
        // Helper functions here


        if(typeof position == "undefined")
            position = null;
        if(position === null)
            position = mat4.create();

        const mins = [0.0, 0.0, 0.0];
        const maxs = [0.0, 0.0, 0.0];

        const wcor = [];

        let meanx = 0;
        let meany = 0;
        // Get the coordinates
        for(let i = 0; i < numsides; i++) {

            const ac = cor[i];
            meanx += cor[i][0];
            meany += cor[i][1];

            const wc = lGetPosition(ac[0], ac[1], 0, position);
            wcor[i] = wc;
            for(let j = 0; j < 3; j++) {
                if(i == 0)
                {
                    mins[j] = wc[j];
                    maxs[j] = wc[j];
                } else {
                    if(wc[j] < mins[j]) mins[j] = wc[j];
                    if(wc[j] > maxs[j]) maxs[j] = wc[j];
                }
            }
        }

        meanx /= numsides;
        meany /= numsides;

        let normals = [];
        let points = []
        let indexes = [];
        let coords = [];

        // First he origins

        let oforward = lGetPosition(meanx, meany, 0, position);
        let onforward = lGetPosition(0, 0, 1, normalMatrix);
        let numindexes = this.numindexes;
        let numentries = this.numentries;   // Set up the indexes so we do not need to do later

        let cen = -1;
        let icor = [];

        lExtendarray(points, oforward);
        lExtendarray(coords, textcontrols[LI_FRONT].coorda(texcors.coords(0, 0, false)));
        lExtendarray(normals, onforward);       
        cen = numindexes;
        numindexes += 1;

        // front
        let texts = textcontrols[LI_FRONT];
        for(let i = 0; i < numsides; i++)
        {
            lExtendarray(points, wcor[i]);
            lExtendarray(normals, onforward);
            lExtendarray(coords, texts.coorda(texts.coorda(cor[i], false)));
            icor[i] = numindexes;
            numindexes += 1;
        }


        for(let i = 0; i < numsides; i++)
        {
            let ti = i + 2;
            let j = i + 1;
            if(j == numsides) j = 0;
            if(insideout) {
                indexes.push(cen);
                indexes.push(icor[j]);
                indexes.push(icor[i]);
            } else {
                indexes.push(cen);
                indexes.push(icor[i]);
                indexes.push(icor[j]);
            }
            numentries += 3;
        }
        let vecs = [];

        this.pointsArray = this.pointsArray.concat(points);
        this.normalsArray = this.normalsArray.concat(normals);
        this.pointsIndex = this.pointsIndex.concat(indexes);
        this.coordsArray = this.coordsArray.concat(coords);

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
    }



    /*
    Following returns an array of textue coordinates for each vertex for each face
    */

    addTriangle(args)
    {
        this._procargs(args, 5);
        let position = args.position;
        let tcoords = args.coords;
        let depth = args.depth;
        let hold = args.hold;
        let textcontrols = args.texturecontrols;
        let insideout = lCoalesce(args.insideout, false);

        let indexes = this.pointsIndex;
        let points = this.pointsArray;
        let normals = this.normalsArray;
        let coords = this.coordsArray;

        let numentries = this.numentries;
        let numindexes = this.numindexes;

        let ca = tcoords[0];
        let cb = tcoords[1];
        let cc = tcoords[2];

        let texcors = new _L2Coords(tcoords);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        function _normalise(n)
        {
            let h = Math.hypot(n[0], n[1]);
            return lGetPosition(n[0] / h, n[1] / h, 0.0, normalMatrix);
        }

        let normf = lGetPosition(0, 0, 1, normalMatrix);
        let normb = lGetPosition(0, 0, -1, normalMatrix);


        // For side normals, z axis is 0
        let nab = _normalise([cb[1] - ca[1], ca[0] - cb[0], 0.0]);
        let nbc = _normalise([cc[1] - cb[1], cb[0] - cc[0], 0.0]);
        let nca = _normalise([ca[1] - cc[1], cc[0] - ca[0], 0.0]);


        // Here goes
        function _adddepth(cor, dep)
        {
            return lGetPosition(cor[0], cor[1], dep, position);
        }

        let cab = _adddepth(ca, -depth);
        let cbb = _adddepth(cb, -depth);
        let ccb = _adddepth(cc, -depth);
        let caf = _adddepth(ca,  depth);
        let cbf = _adddepth(cb,  depth);
        let ccf = _adddepth(cc,  depth);

        function _dodraw(pts, opts, nrm, tex, tr)
        {
            for(let i = 0; i < 3; i++) {
                lExtendarray(points, pts[i]);
                lExtendarray(normals, nrm);
                lExtendarray(coords, tex.coorda(texcors.coorda(opts[i], tr)));
            }

            if(insideout)
                lExtendarray(indexes, [numindexes, numindexes + 2, numindexes + 1]);
            else
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

            if(insideout)
                lExtendarray(indexes, [numindexes, numindexes + 2, numindexes + 3, numindexes + 3, numindexes + 1, numindexes]);
            else
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
    }
    addTrianglePatch(args)
    {
        this._procargs(args, 1);
        let position = args.position;
        let tcoords = args.coords;
        let textcontrol = args.texturecontrol;

        let indexes = this.pointsIndex;
        let points = this.pointsArray;
        let normals = this.normalsArray;
        let coords = this.coordsArray;

        let numentries = this.numentries;
        let numindexes = this.numindexes;

        let ca = tcoords[0];
        let cb = tcoords[1];
        let cc = tcoords[2];

        let texcors = new _L2Coords(tcoords);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        let normf = lGetPosition(0, 0, 1, normalMatrix);

        // Here goes
        function _add(cor)
        {
            return lGetPosition(cor[0], cor[1], 0, position);
        }

        let caf = _add(ca);
        let cbf = _add(cb);
        let ccf = _add(cc);

        function _dodraw(pts, opts, nrm, tex, tr)
        {
            for(let i = 0; i < 3; i++) {
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
    }

    addWTriangle(args)
    {
        this._procargs(args, 5);
        let position = args.position;
        let tcoords = args.coords;
        let depth = args.depth;
        let hold = args.hold;
        let textcontrols = args.texturecontrols;
        let insideout = lCoalesce(args.insideout, false);

        let indexes = this.pointsIndex;
        let points = this.pointsArray;
        let normals = this.normalsArray;
        let coords = this.coordsArray;

        let numentries = this.numentries;
        let numindexes = this.numindexes;

        let ca = tcoords[0];
        let cb = tcoords[1];
        let cc = tcoords[2];

        let texcors = new _L2Coords(tcoords);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        function _normalise(n)
        {
            let h = Math.hypot(n[0], n[1]);
            return lGetPosition(n[0] / h, n[1] /h,  0.0,  normalMatrix);
        }


        let normf = vec3.create();
        vec3.cross(normf, [cb[0] - ca[0], cb[1] - ca[1], cb[2] - ca[2]], [cc[0] - ca[0], cc[1] - ca[1], cc[2] - ca[2]])
        vec3.normalize(normf, normf);
        let normb = vec3.fromValues(0 - normf[0], 0 - normf[1], 0 - normf[2]);
    

        // Get a normal

        function _adddepth(cor, nrm, dep)
        {
            return lGetPosition(cor[0] - nrm[0], cor[1] - nrm[1], cor[2] - nrm[2], position);
        }

        let dmat = vec3.create();
        vec3.scale(dmat, normf, depth);

        let cab = _adddepth(ca, dmat);
        let cbb = _adddepth(cb, dmat);
        let ccb = _adddepth(cc, dmat);

        vec3.scale(dmat, normb, depth);

        let caf = _adddepth(ca, dmat);
        let cbf = _adddepth(cb, dmat);
        let ccf = _adddepth(cc, dmat);

        // For side normals,

        function _normside(pc, pa, pb)
        {
            let out = vec3.create();
            vec3.cross(out, [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]], [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]])
            vec3.normalize(out, out);
            return lGetPosition(out[0], out[1],  out[2],  normalMatrix);
        }

        let nab = _normside(caf, cab, cbb);
        let nbc = _normside(cbf, cbb, ccb);
        let nca = _normside(ccf, ccb, cab);


        function _dodraw(pts, opts, nrm, tex, tr)
        {
            for(let i = 0; i < 3; i++) {
                lExtendarray(points, pts[i]);
                lExtendarray(normals, nrm);
                lExtendarray(coords, tex.coorda(texcors.coorda(opts[i], tr)));
            }

            if(insideout)
                lExtendarray(indexes, [numindexes, numindexes + 2, numindexes + 1]);
            else
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

            if(insideout)
                lExtendarray(indexes, [numindexes, numindexes + 2, numindexes + 3, numindexes + 3, numindexes + 1, numindexes]);
            else
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
    }
    addWTrianglePatch(args)
    {
        this._procargs(args, 1);
        let position = args.position;
        let tcoords = args.coords;
        let textcontrol = args.texturecontrol;

        let indexes = this.pointsIndex;
        let points = this.pointsArray;
        let normals = this.normalsArray;
        let coords = this.coordsArray;

        let numentries = this.numentries;
        let numindexes = this.numindexes;

        let ca = tcoords[0];
        let cb = tcoords[1];
        let cc = tcoords[2];

        let texcors = new _L2Coords(tcoords);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        let normf = vec3.create();
        vec3.cross(normf, [cb[0] - ca[0], cb[1] - ca[1], cb[2] - ca[2]], [cc[0] - ca[0], cc[1] - ca[1], cc[2] - ca[2]])
        vec3.normalize(normf, normf);

        // Here goes
        function _add(cor)
        {
            return lGetPosition(cor[0], cor[1], cor[2], position);
        }

        let caf = _add(ca);
        let cbf = _add(cb);
        let ccf = _add(cc);

        function _dodraw(pts, opts, nrm, tex, tr)
        {
            for(let i = 0; i < 3; i++) {
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
    }
    addSphere(args)
    {
        this._procargs(args, 1);
        // Use partition sphere instead of icohendron because of texture
        // not so even distribution of triangles, but better shaped 
        // for displaying textures

        let position = args.position;
        let radius = args.radius;
        let div = args.segments;
        let insideout = lCoalesce(args.insideout, false);
        if(!div) div = 32;

        if(radius < 0) radius = 0 - radius;

        let textctrl = args.texturecontrol;

        let div2 = div * 2;

        let numentries = this.numentries;
        let numindexes = this.numindexes;
        let points = this.pointsArray;
        let normals = this.normalsArray;
        let indexes = this.pointsIndex;
        let coords = this.coordsArray;

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);


        for(let i = 0; i <= div2; i++) {
            let ang = Math.PI * i  * 2 / div2;
            let sa = Math.sin(ang);
            let ca = Math.cos(ang);
            let s = i / div2;
            for(let j = 0; j <= div; j ++) {
                let bng = Math.PI * j / div;
                let sb = Math.sin(bng);
                let cb = Math.cos(bng);

                // SB is always positive
                // I plane (around Y axis) starts at back goes round.  Z starts neg, X goes neg at beginning
                // J axis (Up/down Y) starts at bottom (neg) goes positive

                let x = 0 - (sa * sb);
                let y = 0 - cb;
                let z = 0 - (ca * sb);

                let t = j / div;

                lExtendarray(normals, lGetPosition(x, y, z, normalMatrix));
                lExtendarray(points, lGetPosition(x * radius, y * radius, z * radius, position));
                lExtendarray(coords, textctrl.coords(s, t));

                if(i < div2 && j < div) {
                    let bl = (i * (div + 1)) + j;
                    let br = bl + div + 1;
                    let tl = bl + 1;
                    let tr = br + 1;
                    if(insideout)
                        lExtendarray(indexes, [
                            numindexes + tl, numindexes + tr, numindexes + br, numindexes + br, numindexes + bl, numindexes + tl
                        ]);
                    else
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
    }


    addSphereCube(args)
    {
        this._procargs(args, 6);
        let segments = args.segments;
        let radius = args.radius;
        let position = args.position;
        let hold = args.hold;
        let texturecotnrols = args.texturecontrols;
        let insideout = args.insideout;

        if(!segments) segments = 16;
        let s2 = segments * segments;

        let isstretch = false;
        if(args.stretch) isstretch = true;

        let arc = LR90 / segments;
        let lr45 = LR90 / 2;

        let tpoints = [];
        let tcoords = [];
        let tnorms = [];

        let rz = radius * segments / h

        for(let x = 0; x <= segments; x++) {
            let x2 = x * x;
            let rx = radius * x / h
            for(let y = 0; y <= segments; y++) {
                let h = Math.sqrt(s2 + x2 + (y * y));

                let ry = radius * y / h

                tpoints.push([rx, ry, rz]);

                // On the surface, first cos is the decrease of radius
                // then another cos because cirle is at an angle

                // texture coords a bit complex
                // Two ways, projection (plane on a sphere, light from center of sphere, where the light hits the plane
                //           Stretch (Put on the four corners, stretch the edges, then stretch the center

                let tx = 0;
                let ty = 0;

                if(x == 0) {
                    tx = 0;
                } else if(x == segments)  {
                    tx = 1;
                } else {
                    if(isstretch) {
                        tx = Math.asin((arc * x) - lr45);
                    } else {
                        tx = x / segments;
                    }
                }
                if(y == 0) {
                    ty = 0;
                } else if(y == segments)  {
                    ty = 1;
                } else {
                    if(isstretch) {
                        ty = Math.asin((arc * y) - lr45);
                    } else {
                        ty = y / segments;
                    }
                }
                tcoords.push(tx);
                tcoords.push(ty);

                tnorms.push(vec3.normalize(vec3.create, (rx, ry, rz)));
            }
        }

        let pos = mat4.create();
        let v1 = vec3.create();

        const pointsArray = this.pointsArray;
        const normalsArray = this.normalsArray;
        const coordsArray = this.coordsArray;
        let numindexes = this.numindexes;
        let numentries = this.numentries;

        let corners = [];

        let width = radius / Math.sqrt(2.0);

        function _putpoints(tpos, tcontrol) {
            const normalMatrix = mat4.create();
            mat4.invert(normalMatrix, tpos);
            mat4.transpose(normalMatrix, normalMatrix);

            for(let tpoint of tpoints)  {
                lExtendArray(pointsArray, vec3.transformMat4(vec3.create(), tpoint, tpos));
            }
            for(let tnorm of tnorms)  {
                lExtendArray(normalsArray, vec3.transformMat4(vec3.create(), tnorm, normalMatrix));
            }
            lExtendArrray(coordsArray, tcoords);

            for(var x = 0; x < segments; x++) {
                for(var y = 0; y < segments; y++) {
                    let bl = (y * (segments + 1)) + x;
                    let tl = ((y + 1) * (segments + 1)) + x;
                    let tr =  ((y + 1) * (segments + 1)) + x + 1;
                    let br =  (y * (segments + 1)) + x + 1;

                    if(insideout) {
                        pointsIndex.push(bl + numindexes);
                        pointsIndex.push(tr + numindexes);
                        pointsIndex.push(br + numindexes);
                        pointsIndex.push(tr + numindexes);
                        pointsIndex.push(bl + numindexes);
                        pointsIndex.push(tl + numindexes);
                    } else {
                        pointsIndex.push(bl + numindexes);
                        pointsIndex.push(tr + numindexes);
                        pointsIndex.push(tl + numindexes);
                        pointsIndex.push(tr + numindexes);
                        pointsIndex.push(bl + numindexes);
                        pointsIndex.push(br + numindexes);
                    }
                }
            }
            numentries += (segments * segments * 6);
            numindexes += ((segments + 1) * (segments + 1));

            corners.push(lGetPosition(-width, -width, width, tpos));
            corners.push(lGetPosition(width, -width, width, tpos));
            corners.push(lGetPosition(-width, width, width, tpos));
            corners.push(lGetPosition(width, width, width, tpos));
            corners.push(lGetPosition(-width, -width, radius, tpos));
            corners.push(lGetPosition(width, -width, radius, tpos));
            corners.push(lGetPosition(-width, width, radius, tpos));
            corners.push(lGetPosition(width, width, radius, tpos));
        }
                    
        if(!hold.incudes(LI_FRONT)) _putpoints(mat4.copy(pos, args.position), texturecontrols[LI_FRONT]);
        if(!hold.incudes(LI_BACK)) _putpoints(mat4.rotateY(pos, args.position, LR180), texturecontrols[LI_BACK]);
        if(!hold.incudes(LI_LEFT)) _putpoints(mat4.rotateY(pos, args.position, -LR90), texturecontrols[LI_LEFT]);
        if(!hold.incudes(LI_RIGHT)) _putpoints(mat4.rotateY(pos, args.position, LR90), texturecontrols[LI_RIGHT]);
        if(!hold.incudes(LI_TOP)) _putpoints(mat4.rotateX(pos, args.position, -LR90), texturecontrols[LI_TOP]);
        if(!hold.incudes(LI_BOTTOM)) _putpoints(mat4.rotateX(pos, args.position, LR90), texturecontrols[LI_BOTTOM]);

        this.numindexes = numindexes;
        this.numentries = numentries;
        this.numblocks += 1;

        var fbl = vec3.copy(vec3.create(), corners[0]);
        var htr = vec3.copy(vec3.create(), corners[corners.length - 1]);

        for(let cor of corners) {
            if(cor[0] < fbl[0]) fbl[0] = cor[0];
            if(cor[1] < fbl[1]) fbl[1] = cor[1];
            if(cor[2] < fbl[2]) fbl[2] = cor[2];
            if(cor[0] > htr[0]) htr[0] = cor[0];
            if(cor[1] > htr[1]) htr[1] = cor[1];
            if(cor[2] > htr[2]) htr[2] = cor[2];
        }
        this.useCorners([fbl, htr], args);
    }


    addBezierPatch(args)
    {
        this._procargs(args, 1);
        let position = args.position;

        var matr = args.coords;
        let xsegments = args.xsegments;
        let ysegments = args.ysegments;
    
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, position);
        mat4.transpose(normalMatrix, normalMatrix);

        if(!xsegments) xsegments = 16;
        if(!ysegments) ysegments = 16;
    
        let tcontrol = args.texturecontrol;
    
        this.matr = matr;
    
        let mlen = matr.length;
        let bmatr = [];
        let nlen = matr[0].length;
    
        let natr = [];

        for(var j = 0; j < nlen; j++) natr.push([]);
    
        for(var i = 0; i < mlen; i++)
        {
            let imatr = matr[i];
            if(imatr.length != nlen) alert("Bezier surface norm error");
            bmatr.push(new _LBLine(matr[i]));
            for(var j = 0; j < nlen; j++)
                natr[j].push(imatr[j]);
        }
    
        let bnatr = [];
        for(var j = 0; j < nlen; j++) {
            bnatr.push(new _LBLine(natr[j]));
        }

        this.bmatr = bmatr;
    
        // Segments - Do these curves for now
    
        let smatr = [];
        let snatr = [];
    
        let dx = 1 / xsegments;
        // Create all curves required
        for(var x = 0; x <= xsegments; x++) {
            let tx = dx * x;
            let bts = [];
            for(var i = 0; i < mlen; i++)
                bts.push(bmatr[i].pos(tx));
            smatr.push(new _LBLine(bts));
        }
    
        let dy = 1 / ysegments;
        for(var y = 0; y <= ysegments; y++) {
            let ty = dy * y;
            let bts = [];
            for(var j = 0; j < nlen; j++)
                bts.push(bnatr[j].pos(ty));
            snatr.push(new _LBLine(bts));
        }
    
        let points = this.pointsArray;
        let normals = this.normalsArray
        let indexes = this.pointsIndex;
        let coords = this.coordsArray;

        let numindexes = this.numindexes;
        let numentries = this.numentries;
    
        let norm = vec3.create();

        let minx = 0;
        let miny = 0;
        let minz = 0;
        let maxx = 0;
        let maxy = 0;
        let maxz = 0;

        let first = true;

        function _llGetPosition(x, y, z)
        {
            let lp = lGetPosition(x, y, z, position);
            let lx = lp[0];
            let ly = lp[1];
            let lz = lp[2];
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
            let xts = smatr[x];
            let tx = dx * x;
            for(var y = 0; y <= ysegments; y++) {
                let ty = dy * y;
                let pox = xts.pos(ty);
                lExtendarray(points, _llGetPosition(pox[0], pox[1], pox[2]))
    
                let xtang = xts.tang(ty);
                let ytang = snatr[y].tang(tx);
    
                vec3.cross(norm, xtang, ytang);
                vec3.normalize(norm, norm);
                lExtendarray(normals, lGetPosition(norm[0], norm[1], norm[2], normalMatrix));

                lExtendarray(coords, tcontrol.coords(tx, ty));
            }
        }
    
        // Indexes - Square at a time
    
        for(var x = 0; x < xsegments; x++) {
            let bx = x * (ysegments + 1);
            for(var y = 0; y < ysegments; y++) {
                let by = bx + y + numindexes;    // + numindexes
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
    }

    addBezierBlock(args)
    {
        this._procargs(args, 6);
        let position = args.position;
        let hold = args.hold;
        let textcontrols = args.texturecontrols;
        let insideout = lCoalesce(args.insideout, false);

        let matr = args.coords;
        let xsegments = args.xsegments;
        let ysegments = args.ysegments;

        let depth = args.depth;

        let vecf = vec3.fromValues(0, 0, depth);
        let vecb = vec3.fromValues(0, 0, -depth);
    
        if(!xsegments) xsegments = 16;
        if(!ysegments) ysegments = 16;
    

        this.matr = matr;
    
        let mlen = matr.length;
        let bmatr = [];
        let nlen = matr[0].length;
    
        let natr = [];

        for(var j = 0; j < nlen; j++) natr.push([]);
    
        for(var i = 0; i < mlen; i++)
        {
            let imatr = matr[i];
            if(imatr.length != nlen) alert("Bezier surface norm error");
            bmatr.push(new _LBLine(matr[i]));
            for(var j = 0; j < nlen; j++)
                natr[j].push(imatr[j]);
        }
    
        let bnatr = [];
        for(var j = 0; j < nlen; j++) {
            bnatr.push(new _LBLine(natr[j]));
        }

        this.bmatr = bmatr;
    
        // Segments - Do these curves for now
    
        let smatr = [];
        let snatr = [];
    
        let dx = 1 / xsegments;
        // Create all curves required
        for(var x = 0; x <= xsegments; x++) {
            let tx = dx * x;
            let bts = [];
            for(var i = 0; i < mlen; i++)
                bts.push(bmatr[i].pos(tx));
            smatr.push(new _LBLine(bts));
        }
    
        let dy = 1 / ysegments;
        for(var y = 0; y <= ysegments; y++) {
            let ty = dy * y;
            let bts = [];
            for(var j = 0; j < nlen; j++)
                bts.push(bnatr[j].pos(ty));
            snatr.push(new _LBLine(bts));
        }
    
        let points = this.pointsArray;
        let normals = this.normalsArray
        let indexes = this.pointsIndex;
        let coords = this.coordsArray;

        let numindexes = this.numindexes;
        let numentries = this.numentries;
    
        let norm = vec3.create();

        let minx = 0;
        let miny = 0;
        let minz = 0;
        let maxx = 0;
        let maxy = 0;
        let maxz = 0;

        let first = true;

        function _llGetPosition(x, y, z, tposition)
        {
            let lp = lGetPosition(x, y, z, tposition);
            let lx = lp[0];
            let ly = lp[1];
            let lz = lp[2];
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
    
        let nrms = mat4.create();

        mat4.invert(nrms, position);
        mat4.transpose(nrms, nrms);

        function _procpoints(inner, tcontrol)
        {
            for(var x = 0; x <= xsegments; x++) {
                let xts = smatr[x];
                let tx = dx * x;
                for(var y = 0; y <= ysegments; y++) {
                    let ty = dy * y;
                    let pos = xts.pos(ty);
        
                    let xtang = xts.tang(ty);
                    let ytang = snatr[y].tang(tx);
        
                    if(inner)
                        vec3.cross(norm, ytang, xtang);
                    else
                        vec3.cross(norm, xtang, ytang);
                    vec3.normalize(norm, norm);

                    // if(isthick) {
                    let thm = mat4.create();
                    let ntra = vec3.create();
                    vec3.scale(ntra, norm, depth);
                    mat4.fromTranslation(thm, ntra);
                    mat4.multiply(thm, position, thm);

                    lExtendarray(points, _llGetPosition(pos[0], pos[1], pos[2], thm))
                    // } else {
                        // lExtendarray(points, _llGetPosition(pox[0], pox[1], pox[2], tpos))
                    // }

                    let tnrm = mat4.create();
                    mat4.invert(tnrm, thm);
                    mat4.transpose(tnrm, tnrm);
            
                    lExtendarray(normals, lGetPosition(norm[0], norm[1], norm[2], nrms));
                    lExtendarray(coords, tcontrol.coords(tx, ty));
                }
            }
        
            // Indexes - Square at a time
        
            for(var x = 0; x < xsegments; x++) {
                let bx = x * (ysegments + 1);
                for(var y = 0; y < ysegments; y++) {
                    let by = bx + y + numindexes;    // + numindexes
                    if((inner && (!insideout)) || ((!inner) && insideout))
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
            let tcontrol = textcontrols[wside];

            let rnr = false;
            let segments = 0;
            let asegments = 0;
            let ridx = 0;

            switch (wside) {
            case LI_LEFT:   rnr = false; ridx = 0; segments = ysegments; break;
            case LI_RIGHT:  rnr = true;  ridx = 1; segments = ysegments; break;
            case LI_BOTTOM: rnr = true;  ridx = 1; segments = xsegments; break;
            case LI_TOP:    rnr = false; ridx = 0; segments = xsegments; break;
            }
        
            let sf = 1 / segments;
            let j = segments;

            for(var i = 0; i <= segments; i++)
            {
                
                let vpts = vptsm[i];
                let df = sf * i;
                let pos = pts.pos(df);
                let tan = pts.tang(df);
                let vtan = vpts.tang(ridx);

                let thf = mat4.create();
                let thb = mat4.create();
                let ntra = vec3.create();

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

                let vnrm = lGetPosition(vtan[0], vtan[1], vtan[2], nrms);

                lExtendarray(normals, vnrm);
                lExtendarray(normals, vnrm);
                lExtendarray(coords, tcontrol.coords(0, df));
                lExtendarray(coords, tcontrol.coords(1, df));
            }

            for(var i = 0; i < segments; i++)
            {
                if(insideout)
                    lExtendarray(indexes, [numindexes, numindexes + 2, numindexes + 3, numindexes + 3, numindexes + 1, numindexes]);
                else
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
    }

    _procargs(args, numtex)
    {
        // Pre processes arguments
        // args are that
        // numtext is number of textures, 1 is no hold

        if(!args.position) args.position = mat4.create();
        if(!args.hold) {
            args.hold = [];
        }
        let hold = args.hold;

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
    }

    resetComponents()
    {
        this.numentries = 0;
        this.numindexes = 0;
        this.pointsArray.length=0;
        this.normalsArray.length=0;
        this.pointsIndex.length=0;
        this.coordsArray.length=0;
    }

        
}

class _L2Coords {
    constructor(coords, rev)
    {
        // Initialiser takes list of 2d coordinates
        // Returns between 0 and 1 depending on size
        
        let minx = 0;
        let miny = 0;
        let maxx = 0;
        let maxy = 0;
    
        let first = true;
    
        let x = 0;
        let y = 0;
    
        for(var coord of coords) {
            x = coord[0];
            y = coord[1];
    
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

    coords(x, y, rev)
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
    }
    coorda(a, rev)
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
    let tc = new LTextureControl([size, 1], [num + .5, 0], [0, 0]);
    return new Proxy([], 
    {
        get: function(obj, prop)
        {
            return tc;
        }
    });
}

class LTextureControl {
    constructor(size, sectbase, sectsize)
    {
        //  Initially - texture is a "loaded" texture reference
        this.sizex = size[0];
        this.sizey = size[1];
    
        this.secx = sectsize[0];
        this.secy = sectsize[1];
    
        this.secbasex = sectbase[0];
        this.secbasey = sectbase[1];
    
    }

    coords(x, y)
    {
        return [ ((x * this.secx) + this.secbasex) / this.sizex, ((y * this.secy) + this.secbasey) / this.sizey];
    }
    coorda(a) {
        return this.coords(a[0], a[1])
    }

    clockwise()
    {
        // Corners, in clockwise order
        return [this.secbasex / this.sizex, this.secbasey / this.sizey,
              this.secbasex/ this.sizex, (this.secbasey + this.secy) / this.sizey,
             (this.secbasex + this.secx) / this.sizex, (this.secbasey + this.secy) / this.sizey,
             (this.secbasex + this.secx) / this.sizex, this.secbasey / this.sizey];
    }

    anticlockwise()
    {
        // Corners, in anticlockwise order
        return [
              this.secbasex/ this.sizex, (this.secbasey + this.secy) / this.sizey,
              this.secbasex / this.sizex, this.secbasey / this.sizey,
             (this.secbasex + this.secx) / this.sizex, this.secbasey / this.sizey,
             (this.secbasex + this.secx) / this.sizex, (this.secbasey + this.secy) / this.sizey,
            ];
    }
}

const LTEXCTL_STATIC = {
    coords: function(x, y) {return [x, y];},
    coorda: function(a) {return [a[0], a[1]];},
    clockwise: function() {return [0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0]; },
    anticlockwise: function() {return [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0]; },
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
    const texture = lGl.createTexture();
    return lReloadTexture(texture, url);
}

function lReloadTexture(texture, url)
{
    if(url instanceof _LImageAsset)
        url.bind(texture);
    else if (typeof(url) == "string")
        new LImage(url, texture);
    else
        raise("Unknown texture type");
    return texture;
}

/*
 * Returns a textue that is a 1 pixel color
 */
function lLoadTColor(color)
{
    const texture = lGl.createTexture();

    return lReloadTColor(texture, color)
}

function lReloadTColor(texture, color)
{
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
    const texture = lGl.createTexture();
    return lReloadTColors(texture, colors, x, y)
}

function lReloadTColors(texture, colors, x, y)
{
    function isPowerOf2(value)
    {
        return(value & (value - 1) == 0)
    }
    lGl.bindTexture(lGl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = lGl.RGBA;
    const width = x;
    const height = y;
    const border = 0;

    const srcFormat = lGl.RGBA;
    const srcType = lGl.UNSIGNED_BYTE;

    const newcolors = [];
    let n = 0;
    for(var j = 0; j < y; j++) {
        for(var i = 0; i < x; i++) {
            let ncolor = colors[n];
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

function lLoadTCanvas(canvas)
{
    let texture = lGl.createTexture();
    return lReloadTCanvas(texture, canvas)
}
function lReloadTCanvas(texture, canvas)
{
    lGl.bindTexture(lGl.TEXTURE_2D, texture);

    lGl.pixelStorei(lGl.UNPACK_FLIP_Y_WEBGL, true);

    lGl.texImage2D(lGl.TEXTURE_2D, 0, lGl.RGBA, lGl.RGBA, lGl.UNSIGNED_BYTE, canvas); // This is the important line!
    lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_MAG_FILTER, lGl.LINEAR);
    lGl.texParameteri(lGl.TEXTURE_2D, lGl.TEXTURE_MIN_FILTER, lGl.LINEAR_MIPMAP_NEAREST);
    lGl.generateMipmap(lGl.TEXTURE_2D);
    
    return texture;
}


class _LBLine {
    constructor(pts)
    {
        
        // Formular for bezier = sum((n.C.i) * ((t)^i) * ((1 - t)^(n - i)) * P[i])
        // N is number of points
        // n is N - 1
        //  (where i is 0 up to n)
    
        // Formulae for normal = sum((
        
    
        // a.C.b = (a! / (b!, (a-b)!))
        // t is between 0 and 1 (how far along curve)
        // P is an array of points
    
        let plen = pts.length;
    
        let bins = [];
    
        let tfact = 1;
        for(var i = 2; i < plen; i++)
            tfact *= i;       
    
        let e = tfact
        let s = 1;
    
        i = 0;
        for(;;)
        {
            if(i > 0) s = s * i;
            bins.push(tfact / (e * s));
            i++;
            if(i >= plen) break;
            let j = plen - i;
            e = e / j;
        }
    
        this.bins = bins;
        this.plen = plen;
        this.pts = pts;
    
        // Normals - First of all - new "Weights"
        // Multiply each by n - 1 now to saave time later
    
        let nlen = plen - 1;
        let npts = [];
        let nbins = [];
    
    
        for(var i = 0; i < nlen; i++)
        {
            let v = vec3.create();
            vec3.subtract(v, pts[i+1], pts[i]);
            vec3.scale(v, v, nlen);
            npts.push(v);
        }
        
        tfact = 1;
        for(var i = 2; i <= nlen; i++)
            tfact *= i;       
    
        e = tfact
        s = 1;
        i = 0;
        for(;;)
        {
            if(i > 0) s = s * i;
            nbins.push(tfact / (e * s));
            i++;
            if(i >= nlen) break;
            let j = nlen - i;
            e = e / j;
        }
    
        this.nlen = nlen;
        this.npts = npts;
        this.nbins = nbins;
    
    }


    pos(howfar)
    {
        let plen = this.plen;
        let pts = this.pts;

        let out = vec3.create();
        let ta = vec3.create();


        function pow(v, p)
        {
            let o = 1;
            for(var i = 0; i < p; i++)
                o = o * v;
            return o;
        }
                

        let j = plen - 1;;
        for(var i = 0; i < plen; i++)
        {
            vec3.scale(ta, pts[i], pow(1.0 - howfar, j) * pow(howfar, i) * this.bins[i]);
            vec3.add(out, out, ta);
            j--;
        }
        return out;
    }

    tang(howfar)
    {
        let nlen = this.nlen;
        let npts = this.npts;

        let out = vec3.create();
        let ta = vec3.create();


        function pow(v, p)
        {
            let o = 1;
            for(var i = 0; i < p; i++)
                o = o * v;
            return o;
        }
                

        let j = nlen - 1;;
        for(var i = 0; i < nlen; i++)
        {
            vec3.scale(ta, npts[i], pow(1.0 - howfar, j) * pow(howfar, i) * this.nbins[i]);
            vec3.add(out, out, ta);
            j--;
        }
        vec3.normalize(out, out);
        return out;
    }
}


class LVirtObject {
    constructor(control, x, y, z, d)
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

    save()
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
    }

    restore(saved)
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
    }

    setPosition(x, y, z)
    {
        this.x = x,
        this.y = y,
        this.z = z;
        this.ox = x,
        this.oy = y,
        this.oz = z;
    }
    getDistance(x, y, z)
    {
        return Math.hypot(x - this.x, y - this.y, z - this.z) - this.distance;
    }
    rmkvisible(vis)
    {
        this.isvisible = vis;
    }
    mkvisible(vis)
    {
        this.isvisible = vis;
    }
    getSceneXYZ()
    {
        return [this.x, this.y, this.z, 1.0];
    }
    copy(obj)
    {
        let cor = obj.getSceneXYZ();
        this.x = cor[0];
        this.y = cor[1];
        this.z = cor[2];
        this.ox = obj.ox;
        this.oy = obj.oy;
        this.oz = obj.oz;
        return this;
    }
    relative(obj, dx, dy, dz)
    {
        let ds = obj.getSceneXYZ()
        this.x = ds[0] + dx;
        this.y = ds[1] + dy;
        this.z = ds[2] + dz;
        this.ox = obj.ox + dx;
        this.oy = obj.oy + dy;
        this.oz = obj.oz + dz;
    }

    moveHere(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    moveAbs(x, y, z)
    {
        this.x += x;
        this.y += y;
        this.z += z;
    }

    warp()
    {
        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;
    }

    getVec(ovec)
    {
        ovec[0] = this.x;
        ovec[1] = this.y;
        ovec[2] = this.z;
        return ovec;
    }
}


// For one offs
class LGroup extends LObject {
    constructor(args, control)
    {
        super(new LGroupDef(args), control);
    }
}
           
class LStructure extends LObject {
    constructor(shader, args, control) {
        super(new LStructureDef(shader, args), control);
    }
}


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
        alert("Error: " + lGl.getProgramInfoLog(prog));
        return null;
    }
    return prog;
}

// Keys

var lDoDown = function(num){};
var lDoUp = function(num){};

class LKey {
    constructor()
    {
        this.val = false;
    }
    ison()
    {
        return this.val;
    }
}

// LInput need to be a a static class
class lInput  {
    static keys = {}
    static register(keynum, func)
    {
        lInput.keys[keynum] = func;
    }
    static press(keynum)
    {
        let obj = new LKey();

        lInput.register(keynum, function(ind) {obj.val = ind;});
        return obj;
    }
    static onoff(keyon, keyoff)
    {
        let obj = new LKey();
        
        lInput.register(keyon, function(ind) {if(ind) obj.val = true;});
        lInput.register(keyoff, function(ind) {if(ind) obj.val = false;});
        return obj;
    }
    static keydown(evt)
    {
        let ks = lInput.keys[evt.keyCode];
        if(!ks) return;
        ks(true);
    }
    static keyup(evt)
    {
        let ks = lInput.keys[evt.keyCode];
        if(!ks) return;
        ks(false);
    }
    static dodown(num)
    {
        let ks = lInput.keys[num];
        if(!ks) return ;
        ks(true);
    }

    static doup(num)
    {
        let ks = lInput.keys[num];
        if(!ks) return ;
        ks(false);
    }

    static usekeys()
    {
        document.onkeydown = lInput.keydown;
        document.onkeyup = lInput.keyup;
        lDoUp = lInput.doup;
        lDoDown = lInput.dodown;
    }

    static save()
    {
        return lInput.keys;
    }

    static load(keys)
    {
        if(!keys) keys = {};
        lInput.keys = keys;
    }
    static clear()
    {
        this.load();
    }
}

/*
 * Following just does A-Z, 0-9 and SPACE
 */
class lInText  {
    static ispressed = false;
    static func = null;     // A function will go here

    static register(func)
    {
        lInText.func = func;
    }
    static dodown(num)
    {
        if(this.ispressed) return;
        let chr = "";
        if(num >= 65 && num <= 90)
            chr = String.fromCharCode(32 + num);
        if(num >= 48 && num <= 57) 
            chr = String.fromCharCode(num);
        if(num == 32) chr = " ";
        lInText.ispressed = true;
        lInText.func(num, chr);
    }
    static doup(num)
    {
        lInText.ispressed = false;
    }
    static keydown(evt) 
    {
        lInText.dodown(evt.keyCode);
    }
    static keyup(evt) 
    {
        lInText.doup(evt.keyCode);
    }
    static usekeys()
    {
        document.onkeydown = lInText.keydown;
        document.onkeyup = lInText.keyup;
        lDoUp = lInText.doup;
        lDoDown = lInText.dodown;
    }
}

class lInAny {
    static func = null;
    static ispressed = false;

    static register(func)
    {
        this.func = func;
    }

    static dodown(num)
    {
        if(lInAny.ispressed) return;
        this.ispressed = true;
        this.func(true, num);
    }
    static doup(num)
    {
        if(!lInAny.ispressed) return;
        this.ispressed = false;
        this.func(false, num);
    }
    static keydown(evt)
    {
        lInAny.dodown(evt.keyCode);
    }
    static keyup(evt)
    {
        lInAny.doup(evt.keyCode);
    }
    static usekeys()
    {
        document.onkeydown = lInAny.keydown;
        document.onkeyup = lInAny.keyup;
        lDoUp = lInAny.doup;
        lDoDown = lInAny.dodown;
        this.ispressed = false;
    }
}

class LInField {
    constructor(istr)
    {
        if(istr) {
            this.str = istr;
        } else {
            this.str = "";
        }

        this.isend = false;

        let self = this;
        
        lInText.register(
            function(num, chr) {
                let str = self.str;
                if(num == 8 || num == 46) { // Backspace
                    if(str.length  >= 1) self.str = str.substring(0, str.length - 1);
                    self.isend = false;
                } else if(num == 13 || num == 9)  {
                    self.isend = true;
                } else if (chr != "") {
                    self.str = str + chr;
                    self.isend = false;
                }
            });
        lInText.usekeys();
    }
}

class LObjImport {
    constructor(text)
    {
        if(text instanceof _LAssetItem) {
            text = text.data;
        }
        // OBJ file import
        this.vertices = [];
        this.normals = [];
        this.coords = [];
        this.faces = {};    // An object representing supplied faces
        this.fidx = 0;       // The next face index to enter
        this.indexes = [];  // A list of "keys" to do
    
        this.lines = text.split("\n");
        // Split into words
        let lines = this.lines;
        let tlines = lines.length;
    
        this.tlines = tlines;
    
        this.oname = "_object_0";
        this.uname = "_material_0";
        this.gname = "_group_0";
    
        this.wcnt = 0;
        this.out = []
    
        this.umtl = new _LObjUsemtl("_object_0", "_group_0", "_material_0", "off");
        this.usemtls = {"///off": this.umtl};
    
        let pobj = false;
        let pmat = false;
    
        this.smgroup = "off";       // Starts off
    
        for(var i = 0; i < tlines;i++)
        {
            let line = lines[i].trim();
            if(line == "") continue;
            if(line.charAt(0) == "#") continue;
            let words = line.split(/\s+/);
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

    component(objname, mtlname)
    {
        if(!objname) objname = "";
        if(!mtlname) mtlname = "";
    
        let rets = [];

        for(var oline of this.out) {
            if((objname == "" || objname == oline.oname) && (mtlname == "" || mtlname == oline.uname)) {
                rets.push(oline);
            }
        }
        return rets;
    }

    makesmooth(objname, mtlname)
    {
        if(!objname) objname = "";
        if(!mtlname) mtlname = "";
        for(var oline of this.out) {
            if((objname == "" || objname == oline.oname) && (mtlname == "" || mtlname == oline.uname)) {
                oline.smoother();
            }
        }
    }
    makeflat(objname, mtlname)
    {
        if(!objname) objname = "";
        if(!mtlname) mtlname = "";
        for(var oline of this.out) {
            if((objname == "" || objname == oline.oname) && (mtlname == "" || mtlname == oline.uname)) {
                oline.makenormals();
            }
        }
    }

    list()
    {
        let ent = {};
        for(var ol of this.out) {
            if(ol.pointsIndex.length > 0)
                ent[ol.oname + "/" + ol.uname] = {object: ol.oname, material: ol.uname};
        }
        let ret = [];
        for(var key in ent) ret.push(ent[key]);
        return ret;
    }

                
    _changeobj()
    {
        let key = this.oname + "/" + this.uname + "/" + this.gname + "/" + this.smgroup;
        console.log(key);
        if(!(key in this.usemtls)) {
            this.umtl = new _LObjUsemtl(this.oname, this.uname, this.gname, this.smgroup);
            this.usemtls[key] = this.umtl;
        } else {
            this.umtl = this.usemtls[key];
        }
    }

            
    _procobjs()
    {
        for(var key in this.usemtls) {
            let umtl = this.usemtls[key];
            let comp = this._procumtl(umtl)
            if(comp) {
                if(comp.normalsArray.length == 0) comp.makenormals();
                if(umtl.smgroup != "off")
                    comp.smoother();
                this.out.push(comp);
            }
        }
        console.log(this);
    }

    _procumtl(umtl)
    {

        let newvert = [];
        let newnorm = [];
        let newcoor = [];
        let newinds = [];

        let oldverts = this.vertices;
        let oldnorms = this.normals;
        let oldcoor = this.coords;
        let oldinds = umtl.indexes;
        let faces = umtl.faces;
        let fidx = umtl.fidx;

        if(oldinds.length == 0) return null;

        // Set the new entries

        // Blender fix
        // TODO - If normals exist, they point OUTWARDS
        // Make sure "Anti-clockwise"
        for(var key in faces) {
            let face = faces[key];
            let idx3 = face.idx * 3;
            let idx2 = face.idx * 2;
            let oldv = oldverts[face.v - 1];
            newvert[idx3] = oldv[0];
            newvert[idx3+1] = oldv[1];
            newvert[idx3+2] = oldv[2];
            if(face.vn) {
                let oldn = oldnorms[face.vn - 1]
                newnorm[idx3] = oldn[0];
                newnorm[idx3+1] = oldn[1];
                newnorm[idx3+2] = oldn[2];
            }
            if(face.vt) {
                let oldt = oldcoor[face.vt - 1];
                newcoor[idx2] = oldt[0];
                newcoor[idx2+1] = oldt[1];
            } else {
                newcoor[idx2] = 0;
                newcoor[idx2+1] = 0;
            }
        }

        for(let oi of oldinds)
            newinds.push(oi.idx);

        let ilen = newinds.length;

        let comp = new LComponent();
        comp.oname = umtl.oname;
        comp.uname = umtl.uname;

        comp.pointsArray = newvert;
        comp.normalsArray = newnorm;
        comp.coordsArray = newcoor;
        comp.pointsIndex = newinds;
        comp.numindexes = fidx;
        comp.numentries = ilen;

        return comp;
    }

    _proc_v(words)
    {
        this.vertices.push([lCoalesce(parseFloat(words[1]), 0),
            lCoalesce(parseFloat(words[2]), 0),
            lCoalesce(parseFloat(words[3]), 0)]);
    }
        
    _proc_vn(words)
    {
        // Normals need to be unit vectors in LimpetGE

        let x = lCoalesce(parseFloat(words[1]), 0);
        let y = lCoalesce(parseFloat(words[2]), 0);
        let z = lCoalesce(parseFloat(words[3]), 0);

        if(x != 0 || y != 0 || z != 0) {
            let h = Math.hypot(x, y, z);
            x = x / h;
            y = y / h;
            z = z / h;
        }

        this.normals.push([x, y, z]);
    }

    _proc_vt(words)
    {
        this.coords.push([lCoalesce(parseFloat(words[1]), 0), lCoalesce(parseFloat(words[2]), 0)]);
    }

    _proc_f(words)
    {
        // Assumes this done AFTER the vertices it references
        // Faces can be above 3 each
        // For four - Do a simple "2 triangle"
        // For more - assume convex, find a "central" point, an average of normals and textures, and go with that.
        let umtl = this.umtl;
        let numv = words.length - 1;

        let data = [];
        for(var i = 1; i <= numv; i++)
            data.push(this._getface(words[i]));

        for(var i = 0; i < numv; i++) {
            let dx = data[i];
            if(dx.key in umtl.faces) {
                dx.idx = umtl.faces[dx.key].idx;
            } else {
                umtl.faces[dx.key] = dx;
                dx.idx = umtl.fidx;
                umtl.fidx += 1;
            }
        }

        let idxs = umtl.indexes;

        if(numv < 3) {
            alert("Less that 3 vertex in face");
            return;
        } else {    // Should handle any convex polygon
            for(var n = 0; n < numv - 2; n++) {
                idxs.push(data[0]);
                idxs.push(data[n + 1]);
                idxs.push(data[n + 2]);
            }
        }
    }

    _getface(word)
    {
        let nums = word.split("/");

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

        let v = _gn(nums[0]);
        let vt = _gn(nums[1]);
        let vn = _gn(nums[2]);
        return {
            v: v,
            vt: vt,
            vn: vn,
            key: v.toString() + "/" + vt.toString() + "/" + vn.toString() ,
        };
    }
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
    

class LComponent {
    constructor()
    {
        this.pointsArray = [];
        this.normalsArray = [];
        this.coordsArray = [];
        this.pointsIndex = [];
        this.numentries = 0;
        this.numindexes = 0;
    }

    smoother()
    {
        // Returns "Sparse" array for one normal per vertex
        // Not htere if angle testing to be used
        // One normal per vertex
        // Do on the outs

        let verts = this.pointsArray;
        let norms = this.normalsArray;
        let coors = this.coordsArray;
        let indes = this.pointsIndex;
        let nument = this.numentries;
        let numind = this.numindexes

        let newstuff = {};
        let nidx = 0;
        let ixref = []

        for(var i = 0; i < nument; i++)
        {
            let j = indes[i];
            let i3 = j * 3;
            let i2 = j * 2;
            let v0 = verts[i3];
            let v1 = verts[i3 + 1];
            let v2 = verts[i3 + 2];
            let n0 = norms[i3];
            let n1 = norms[i3 + 1];
            let n2 = norms[i3 + 2];
            let c0 = coors[i2];
            let c1 = coors[i2 + 1];

            let k0 = Math.round(v0 * LOBJFILE_SMOOTH);
            let k1 = Math.round(v1 * LOBJFILE_SMOOTH);
            let k2 = Math.round(v2 * LOBJFILE_SMOOTH);
            // let key = v0.toString() + "/" + v1.toString() + "/" + v2.toString();
            let key = k0.toString() + "/" + k1.toString() + "/" + k2.toString();
            let itm;

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

        let nnorms = [];
        let nverts = [];
        let ncoors = [];

        for(var key in newstuff) {
            let itm = newstuff[key];
            let n0 = 0;
            let n1 = 0;
            let n2 = 0;
            let c0 = 0;
            let c1 = 0;
            let nlst = itm.n;
            let nlen = nlst.length;
            for(var i = 0; i < nlen; i++) {
                n0 += nlst[i][0];
                n1 += nlst[i][1];
                n2 += nlst[i][2];
                c0 += itm.t[i][0];
                c1 += itm.t[i][1];
            }
            let hy = Math.hypot(n0, n1, n2);
            if(hy != 0) {
                n0 /= hy;
                n1 /= hy;
                n2 /= hy;
            }
            let idx3 = itm.i * 3;
            let idx2 = itm.i * 2;

            nverts[idx3] = itm.v[0];
            nverts[idx3 + 1] = itm.v[1];
            nverts[idx3 + 2] = itm.v[2];
            nnorms[idx3] = n0;
            nnorms[idx3 + 1] = n1;
            nnorms[idx3 + 2] = n2;
            ncoors[idx2] = c0 / nlen;
            ncoors[idx2 + 1] = c1 / nlen;
        }


        let ninds = [];
        nument = ixref.length;
        for(var i = 0; i < nument; i++)
            ninds.push(ixref[i]);

        this.pointsArray = nverts;
        this.normalsArray = nnorms;
        this.coordsArray = ncoors;
        this.pointsIndex = ninds;
        this.numindexes = nidx;
        this.numentries = nument;
    }

    makenormals()
    {
        let nverts = [];
        let nnorms = [];
        let ncoors = [];
        let nindex = [];

        let onument = this.numentries;
        let onumind = this.numindexes;
        let overts = this.pointsArray;
        let oindex = this.pointsIndex;
        let ocoors = this.coordsArray;


        for(var i = 0; i < onument; i += 3) {
            let idx = oindex[i];
            let idx3 = idx * 3;
            let idx2 = idx * 2;
            let v00 = overts[idx3];
            let v01 = overts[idx3 + 1];
            let v02 = overts[idx3 + 2];
            let c00 = ocoors[idx2];
            let c01 = ocoors[idx2 + 1];
            idx = oindex[i + 1];
            idx3 = idx * 3;
            idx2 = idx * 2;
            let v10 = overts[idx3];
            let v11 = overts[idx3 + 1];
            let v12 = overts[idx3 + 2];
            let c10 = ocoors[idx2];
            let c11 = ocoors[idx2 + 1];
            idx = oindex[i + 2];
            idx3 = idx * 3;
            idx2 = idx * 2;
            let v20 = overts[idx3];
            let v21 = overts[idx3 + 1];
            let v22 = overts[idx3 + 2];
            let c20 = ocoors[idx2];
            let c21 = ocoors[idx2 + 1];

            let cr = vec3.create();

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
        this.coordsArray = ncoors;
        this.pointsIndex = nindex;
        this.numindexes = onument;
    }
}


/* LPRNG returns integer */
class LPRNG {
    constructor(seed)
    {
        seed = Math.floor(seed) % 2147483647;
        if (seed <= 0) seed += 2147483646;
        this.current = seed;
    }

    next(scope)
    {
        this.current = (this.current * 16807)  % 2147483647
        return Math.floor(scope * this.current / 2147483647);
    }
}
/* LPRNG returns real  */
class LPRNGD {
    constructor(seed)
    {
        seed = Math.floor(seed) % 2147483647;
        if (seed <= 0) seed += 2147483646;
        this.current = seed;
    }

    next(scope)
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
    let ele = document.createElement(etype);
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
            for(var child of children) {
                if (child)
                    ele.appendChild(child);
            }
        }
    }
    return ele;
}


function lAddButton(orient, vpos, hpos, label, code)
{
    let x = 0;
    let y = 0;

    let canvas = document.getElementById(LCANVAS_ID);

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


    let but = document.createElement("button");
    but.appendChild(document.createTextNode(label));

    but.className = "button";

    but.style.position = "absolute";
    but.style.width = LBUT_WIDTH.toString() + "px";
    but.style.height = LBUT_HEIGHT.toString() + "px";
    but.style.left = x.toString() + "px";
    but.style.top = y.toString() + "px";

    let dodown = "return lDoDown(" + code.toString() + ");";
    let doup = "return lDoUp(" + code.toString() + ");";

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
    // canvas.width = window.innerWidth - 20;
    // canvas.height = window.innerHeight - 20;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if(lCamera.setperspective) {
        lCamera.setperspective();
        lScene.lPos();
    }
    lGl.viewport(0, 0, canvas.width, canvas.height);
}

function lFromXYZR(x, y, z, r)
{
    let pos = mat4.create();
    let tmp = mat4.create();
    mat4.fromYRotation(pos, r);
    mat4.fromTranslation(tmp, vec4.fromValues(x, y, z, 1.0));
    mat4.multiply(pos, tmp, pos);
    return pos;
}

function lFromXYZ(x, y, z)
{
    let pos = mat4.create();
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
    for(var bi of b) a.push(bi);
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

    let t = (b[0] * a[1]) + (c[0] * b[1]) + (a[0] * c[1]);
    let u = (a[0] * b[1]) + (b[1] * c[2]) * (c[0] * a[1]);

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
    let out = {};
    for(var arg of args) {
        out[arg[0]] = arg[1];
    }
    return out;
}

const lShader_objects = [];

export {
    LAssets,
    LImage,
    LAudios,
    LAudioLoop,
    LBase,
    LCamera,
    LObject,
    LIObject,
    LWObject,
    LStaticGroup,
    LGroupDef,
    LStructureDef,
    LTextureControl,
    LVirtObject,
    LGroup,
    LStructure,
    LKey,
    lInput,
    lInText,
    LInField,
    lInAny,
    LObjImport,
    LComponent,
    LPRNG,
    LPRNGD,
    LCANVAS_ID,
    LR90,
    LR180,
    LR270,
    LR360,
    LI_FRONT,
    LI_BACK,
    LI_SIDE,
    LI_TOP,
    LI_RIGHT,
    LI_BOTTOM,
    LI_LEFT,
    LSTATIC,
    LDYNAMIC,
    LNONE,
    LBUT_WIDTH,
    LBUT_HEIGHT,
    LMESTIME,
    LASSET_THREADS,
    LASSET_RETRIES,
    LOBJFILE_SMOOTH,
    LTMP_MAT4A,
    LTMP_MAT4B,
    LTMP_MAT4C,
    LTMP_QUATA,
    LTMP_QUATB,
    LTMP_QUATC,
    LTMP_VEC3A,
    LTMP_VEC3B,
    LTMP_VEC3C,
    lSScene,
    LTEXCTL_STATIC,
    LTEXCTL_STATIC_LIST,
    lGl,
    lCamera,
    lScene,
    lDoDown,
    lDoUp,
    lShader_objects,
    lInit,
    lClear,
    lStructureSetup,
    lTextureColor,
    lTextureColorAll,
    lTextureList,
    lLoadTexture,
    lReloadTexture,
    lLoadTColor,
    lReloadTColor,
    lLoadTColors,
    lReloadTColors,
    lLoadTCanvas,
    lReloadTCanvas,
    lInitShaderProgram,
    lElement,
    lAddButton,
    lCanvasResize,
    lFromXYZR,
    lFromXYZ,
    lFromXYZPYR,
    lExtendarray,
    lGetPosition,
    lAntiClock,
    lCoalesce,
    lIndArray,
    mat4,
    vec3,
    vec4,
    quat,
    LKEY
};
    
