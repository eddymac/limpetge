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

var _lShaderId = 0;

class ShaderSimple {
    static key = -1;
    static fragSource = `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uDirectionalVector;
        uniform highp vec3 uAmbientLight;
        uniform lowp float uShininess;
        uniform sampler2D uSampler;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main() {
            highp vec3 normal = normalize(vNormal);

            lowp float refd = max(dot(normal, uDirectionalVector), 0.0);
            lowp float spec = 0.0;

            if(refd > 0.0) {
                highp vec3 ref = reflect(-uDirectionalVector, normal);
                highp vec3 view = normalize(-vPosition);
                lowp float spangle = max(dot(ref, view), 0.0);
                spec = pow(spangle, uShininess);
            }
            highp vec4 color = texture2D(uSampler, vCoords);

            gl_FragColor = vec4(
                ((uAmbientLight * color.xyz)
                + ((uDirectionalLightColor * color.xyz) * refd))
                + (uDirectionalLightColor * spec),
                        color.w);
            
        }
    `;

    static vertexSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoords;

        uniform mat4 uPositionMatrix;   // Position of object relative to lCamera
        uniform mat4 uViewMatrix;       // View of object (above + projection)

        // Following could be constants, but will put them here anyways
        uniform vec3 uDirectionalLightColor;
        uniform vec3 uDirectionalVector;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            // gl_Position = uProjectionMatrix * uViewMatrix * aVertexPosition;
            gl_Position = uViewMatrix * aVertexPosition;

            // Gets the "normal"
            vNormal = (uPositionMatrix * vec4(aVertexNormal, 0.0)).xyz;
            vPosition = (uPositionMatrix * aVertexPosition).xyz;
            vCoords = aTextureCoords;
            // highp float directional = max(dot(transformedNormal.xyz, uDirectionalVector), 0.0);
            // vLighting = uAmbientLight + (uDirectionalLightColor * directional);
        }
    `;

    // This is called on load
    static compile()
    {
        _lShaderId += 1;
        this.key = _lShaderId;

        const prog = lInitShaderProgram(this.vertexSource, this.fragSource);
        this.shader = prog;
        this.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aVertexNormal: lGl.getAttribLocation(prog, 'aVertexNormal'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uColor: lGl.getUniformLocation(prog, 'uColor'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),

            uAmbientLight: lGl.getUniformLocation(prog, 'uAmbientLight'),
            uDirectionalLightColor: lGl.getUniformLocation(prog, 'uDirectionalLightColor'),
            uDirectionalVector: lGl.getUniformLocation(prog, 'uDirectionalVector'),
            uShininess: lGl.getUniformLocation(prog, 'uShininess'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            this.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            this.locations.aVertexNormal
        );
        lGl.enableVertexAttribArray(
            this.locations.aTextureCoords
        );
    }

    static doInitBuffer(structure)
    {

        const buffer = structure.buffer;
        // Fix following shit at some point
        const  args = structure.args;

        if(args.rawtexture) {
            buffer.texture = args.rawtexture;
        }
        if(args.texture) {
            buffer.texture = lLoadTexture(args.texture);
        }
        else if(args.colors) {
            buffer.texture = lLoadTColors(args.colors, args.colors.length, 1);
        }
        else if(args.color) {
            buffer.texture = lLoadTColor(args.color);
        }

        if(args.shininess) {
            buffer.shininess = args.shininess;
        } else {
            buffer.shininess = 5;
        }

        // Set up the points
        const pointBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, pointBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.pointsArray), lGl.STATIC_DRAW);
        buffer.point = pointBuffer;

        const normalBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, normalBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.normalsArray), lGl.STATIC_DRAW);
        buffer.normal = normalBuffer;

        const coordBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, coordBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.coordsArray), lGl.STATIC_DRAW);
        buffer.coords = coordBuffer;

        const indexBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        lGl.bufferData(lGl.ELEMENT_ARRAY_BUFFER, new Uint16Array(structure.pointsIndex), lGl.STATIC_DRAW);
        buffer.index = indexBuffer;
        buffer.numentries = structure.numentries;

    }

    static useProgram()
    {
        lGl.useProgram(this.shader);
    }

    static useBuffer(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            this.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Normals
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.normal);
        lGl.vertexAttribPointer(
            this.locations.aVertexNormal,
            3,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            this.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.uniform1f(this.locations.uShininess, buffer.shininess);
        lGl.uniform3fv(this.locations.uAmbientLight, lScene.ambientLight);
        lGl.uniform3fv(this.locations.uDirectionalLightColor, lScene.directionalLightColor);
        lGl.uniform1i(this.locations.uSampler, 0);
    }

    static positionMatrix = mat4.create();
    static viewMatrix = mat4.create();
    // normalsMatrix: mat4.create(),

    static doDraw(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        // What we need to transpose normal matrix by

        lGl.uniform3fv(this.locations.uDirectionalVector, lSScene.directionalVector);


        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false,
            mat4.multiply(this.viewMatrix, lCamera.currview, position));

        lGl.uniformMatrix4fv(this.locations.uPositionMatrix, false,
            mat4.multiply(this.positionMatrix, lCamera.position, position));

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

class ShaderLight  {
    static key = -1;
    static fragSource = `
        uniform sampler2D uSampler;
        uniform highp float uHeight;
        varying highp vec2 vCoords;
        varying highp float vHeight;


        void main() {

            highp vec4 fcolor = texture2D(uSampler, vCoords);
            gl_FragColor = vec4(fcolor.xyz, abs(fract((vHeight - (uHeight / 4.0)) * 4.0) - 0.5));
            
        }
    `;

    static vertexSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoords;

        uniform mat4 uViewMatrix;       // View of object (above + projection)

        varying highp vec2 vCoords;
        varying highp float vHeight;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;
            vHeight = aVertexPosition.y;

            vCoords = aTextureCoords;
        }
    `;

    // This is called on load
    static compile()
    {
        _lShaderId += 1;
        this.key = _lShaderId;

        const prog = lInitShaderProgram(this.vertexSource, this.fragSource);
        this.shader = prog;
        this.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),
            uHeight: lGl.getUniformLocation(prog, 'uHeight'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            this.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            this.locations.aTextureCoords
        );
    }

    static doInitBuffer(structure)
    {

        const buffer = structure.buffer;
        // Fix following shit at some point
        const  args = structure.args;

        if(args.rawtexture) {
            buffer.texture = args.rawtexture;
        }
        if(args.texture) {
            buffer.texture = lLoadTexture(args.texture);
        }
        else if(args.colors) {
            buffer.texture = lLoadTColors(args.colors, args.colors.length, 1);
        }
        else if(args.color) {
            buffer.texture = lLoadTColor(args.color);
        }

        // Set up the points
        const pointBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, pointBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.pointsArray), lGl.STATIC_DRAW);
        buffer.point = pointBuffer;

        const coordBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, coordBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.coordsArray), lGl.STATIC_DRAW);
        buffer.coords = coordBuffer;

        const indexBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        lGl.bufferData(lGl.ELEMENT_ARRAY_BUFFER, new Uint16Array(structure.pointsIndex), lGl.STATIC_DRAW);
        buffer.index = indexBuffer;
        buffer.numentries = structure.numentries;

    }

    static useProgram()
    {
        lGl.useProgram(this.shader);
    }

    static useBuffer(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            this.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            this.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.uniform1i(this.locations.uSampler, 0);
    }

    static viewMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        // What we need to transpose normal matrix by


        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false,
            mat4.multiply(this.viewMatrix, lCamera.currview, position));
        
        lGl.uniform1f(this.locations.uHeight, control.lightheight);
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

class ShaderShade {
    static key = -1;
    static fragSource = `
        uniform highp vec3 uAmbientLight;
        uniform sampler2D uSampler;

        varying highp vec2 vCoords;

        void main() {
            highp vec4 color = texture2D(uSampler, vCoords);

            gl_FragColor = vec4(
                (uAmbientLight * color.xyz), color.w);
            
        }
    `;

    static vertexSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoords;

        uniform mat4 uViewMatrix;       // View of object (above + projection)
        // uniform mat4 uProjectionMatrix;

        varying highp vec2 vCoords;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;

            vCoords = aTextureCoords;
        }
    `;

    // This is called on load
    static compile()
    {
        _lShaderId += 1;
        this.key = _lShaderId;

        const prog = lInitShaderProgram(this.vertexSource, this.fragSource);
        this.shader = prog;
        this.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),

            uAmbientLight: lGl.getUniformLocation(prog, 'uAmbientLight'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            this.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            this.locations.aTextureCoords
        );
    }

    static doInitBuffer(structure)
    {
        const buffer = structure.buffer;
        // Fix following shit at some point
        const  args = structure.args;

        if(args.rawtexture) {
            buffer.texture = args.rawtexture;
        }
        if(args.texture) {
            buffer.texture = lLoadTexture(args.texture);
        }
        else if(args.colors) {
            buffer.texture = lLoadTColors(args.colors, args.colors.length, 1);
        }
        else if(args.color) {
            buffer.texture = lLoadTColor(args.color);
        }

        // Set up the points
        const pointBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, pointBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.pointsArray), lGl.STATIC_DRAW);
        buffer.point = pointBuffer;

        const coordBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, coordBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.coordsArray), lGl.STATIC_DRAW);
        buffer.coords = coordBuffer;

        const indexBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        lGl.bufferData(lGl.ELEMENT_ARRAY_BUFFER, new Uint16Array(structure.pointsIndex), lGl.STATIC_DRAW);
        buffer.index = indexBuffer;
        buffer.numentries = structure.numentries;

    }

    static useProgram()
    {
        lGl.useProgram(this.shader);
    }

    static useBuffer(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            this.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            this.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.uniform3fv(this.locations.uAmbientLight, lScene.ambientLight);
        lGl.uniform1i(this.locations.uSampler, 0);
    }

    static viewMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        // What we need to transpose normal matrix by


        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false,
            mat4.multiply(this.viewMatrix, lCamera.currview, position));


        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

class ShaderSolid {
    static key = -1;
    static fragSource = `
        uniform sampler2D uSampler;

        varying highp vec2 vCoords;

        void main() {
            gl_FragColor = texture2D(uSampler, vCoords);
        }
    `;

    static vertexSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoords;

        uniform mat4 uViewMatrix;       // View of object (above + projection)

        varying highp vec2 vCoords;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;

            vCoords = aTextureCoords;
        }
    `;

    // This is called on load
    static compile()
    {
        _lShaderId += 1;
        this.key = _lShaderId;

        const prog = lInitShaderProgram(this.vertexSource, this.fragSource);
        this.shader = prog;
        this.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            this.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            this.locations.aTextureCoords
        );
    }

    static doInitBuffer(structure)
    {

        const buffer = structure.buffer;
        // Fix following shit at some point
        const  args = structure.args;

        if(args.rawtexture) {
            buffer.texture = args.rawtexture;
        }
        if(args.texture) {
            buffer.texture = lLoadTexture(args.texture);
        }
        else if(args.colors) {
            buffer.texture = lLoadTColors(args.colors, args.colors.length, 1);
        }
        else if(args.color) {
            buffer.texture = lLoadTColor(args.color);
        }

        // Set up the points
        const pointBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, pointBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.pointsArray), lGl.STATIC_DRAW);
        buffer.point = pointBuffer;

        const coordBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, coordBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.coordsArray), lGl.STATIC_DRAW);
        buffer.coords = coordBuffer;

        const indexBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        lGl.bufferData(lGl.ELEMENT_ARRAY_BUFFER, new Uint16Array(structure.pointsIndex), lGl.STATIC_DRAW);
        buffer.index = indexBuffer;
        buffer.numentries = structure.numentries;

    }

    static useProgram()
    {
        lGl.useProgram(this.shader);
    }

    static useBuffer(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            this.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            this.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.uniform1i(this.locations.uSampler, 0);
    }

    static viewMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        // What we need to transpose normal matrix by

        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false,
            mat4.multiply(this.viewMatrix, lCamera.currview, position));

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

class ShaderSimpleTrans {
    static key = -1;
    static fragSource = `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uDirectionalVector;
        uniform highp vec3 uAmbientLight;
        uniform lowp float uShininess;
        uniform sampler2D uSampler;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main() {
            highp vec3 normal = normalize(vNormal);

            lowp float refd = max(dot(normal, uDirectionalVector), 0.0);
            lowp float spec = 0.0;

            if(refd > 0.0) {
                highp vec3 ref = reflect(-uDirectionalVector, normal);
                highp vec3 view = normalize(-vPosition);
                lowp float spangle = max(dot(ref, view), 0.0);
                spec = pow(spangle, uShininess);
            }
            highp vec4 color = texture2D(uSampler, vCoords);

            gl_FragColor = vec4(
                ((uAmbientLight * color.xyz)
                + ((uDirectionalLightColor * color.xyz) * refd))
                + (uDirectionalLightColor * spec),
                        color.w);
            
        }
    `;

    static vertexSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoords;

        uniform mat4 uPositionMatrix;   // Position of object relative to lCamera
        uniform mat4 uViewMatrix;       // View of object (above + projection)

        // Following could be constants, but will put them here anyways
        uniform vec3 uDirectionalLightColor;
        uniform vec3 uDirectionalVector;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            // gl_Position = uProjectionMatrix * uViewMatrix * aVertexPosition;
            gl_Position = uViewMatrix * aVertexPosition;

            // Gets the "normal"
            vNormal = (uPositionMatrix * vec4(aVertexNormal, 0.0)).xyz;
            vPosition = (uPositionMatrix * aVertexPosition).xyz;
            vCoords = aTextureCoords;
            // highp float directional = max(dot(transformedNormal.xyz, uDirectionalVector), 0.0);
            // vLighting = uAmbientLight + (uDirectionalLightColor * directional);
        }
    `;

    // This is called on load
    static compile()
    {
        _lShaderId += 1;
        this.key = _lShaderId;

        const prog = lInitShaderProgram(this.vertexSource, this.fragSource);
        this.shader = prog;
        this.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aVertexNormal: lGl.getAttribLocation(prog, 'aVertexNormal'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uColor: lGl.getUniformLocation(prog, 'uColor'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),

            uAmbientLight: lGl.getUniformLocation(prog, 'uAmbientLight'),
            uDirectionalLightColor: lGl.getUniformLocation(prog, 'uDirectionalLightColor'),
            uDirectionalVector: lGl.getUniformLocation(prog, 'uDirectionalVector'),
            uShininess: lGl.getUniformLocation(prog, 'uShininess'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            this.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            this.locations.aVertexNormal
        );
        lGl.enableVertexAttribArray(
            this.locations.aTextureCoords
        );
    }

    static doInitBuffer(structure)
    {

        const buffer = structure.buffer;
        // Fix following shit at some point
        const  args = structure.args;

        if(args.rawtexture) {
            buffer.texture = args.rawtexture;
        }
        if(args.texture) {
            buffer.texture = lLoadTexture(args.texture);
        }
        else if(args.colors) {
            buffer.texture = lLoadTColors(args.colors, args.colors.length, 1);
        }
        else if(args.color) {
            buffer.texture = lLoadTColor(args.color);
        }

        if(args.shininess) {
            buffer.shininess = args.shininess;
        } else {
            buffer.shininess = 5;
        }

        // Set up the points
        const pointBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, pointBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.pointsArray), lGl.STATIC_DRAW);
        buffer.point = pointBuffer;

        const normalBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, normalBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.normalsArray), lGl.STATIC_DRAW);
        buffer.normal = normalBuffer;

        const coordBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, coordBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.coordsArray), lGl.STATIC_DRAW);
        buffer.coords = coordBuffer;

        const indexBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        lGl.bufferData(lGl.ELEMENT_ARRAY_BUFFER, new Uint16Array(structure.pointsIndex), lGl.STATIC_DRAW);
        buffer.index = indexBuffer;
        buffer.numentries = structure.numentries;

    }

    static useProgram()
    {
        lGl.useProgram(this.shader);
    }

    static useBuffer(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            this.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Normals
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.normal);
        lGl.vertexAttribPointer(
            this.locations.aVertexNormal,
            3,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            this.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.uniform1f(this.locations.uShininess, buffer.shininess);
        lGl.uniform3fv(this.locations.uAmbientLight, lScene.ambientLight);
        lGl.uniform3fv(this.locations.uDirectionalLightColor, lScene.directionalLightColor);
        lGl.uniform1i(this.locations.uSampler, 0);
    }

    static viewMatrix = mat4.create();
    static positionMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        // What we need to transpose normal matrix by

        lGl.uniform3fv(this.locations.uDirectionalVector, lSScene.directionalVector);

        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false,
            mat4.multiply(this.viewMatrix, lCamera.currview, position));

        lGl.uniformMatrix4fv(this.locations.uPositionMatrix, false,
            mat4.multiply(this.positionMatrix, lCamera.position, position));

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

lExtendarray(lShader_objects, [
    ShaderSimple,
    ShaderShade,
    ShaderSolid,
    ShaderLight,
    ShaderSimpleTrans,
]);

export {
    ShaderSimple,
    ShaderShade,
    ShaderSolid,
    ShaderLight,
    ShaderSimpleTrans
};

