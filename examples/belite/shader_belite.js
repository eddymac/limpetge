
"use strict";

import { LAssets, LImage, LAudios, LAudioLoop, LBase, LCamera, LObject, LIObject, LWObject, LStaticGroup, LGroupDef,
    LStructureDef, LTextureControl, LVirtObject, LGroup, LStructure, LKey, lInput, lInText, LObjImport, LComponent,
    lInit, lClear, lStructureSetup, lTextureColor, lTextureColorAll, lTextureList, lLoadTexture, lReloadTexture, lLoadTColor,
    lReloadTColor, lLoadTColors, lReloadTColors, lLoadTCanvas, lReloadTCanvas, lInitShaderProgram, lElement, lAddButton, lCanvasResize,
    lFromXYZR, lFromXYZ, lFromXYZPYR, lExtendarray, lGetPosition, lAntiClock, lCoalesce, lIndArray,
    LPRNG, LPRNGD, LCANVAS_ID, LR90, LR180, LR270, LR360, LI_FRONT, LI_BACK, LI_SIDE, LI_TOP, LI_RIGHT, LI_BOTTOM, LI_LEFT, LSTATIC,
    LDYNAMIC, LNONE, LBUT_WIDTH, LBUT_HEIGHT, LMESTIME, LASSET_THREADS, LASSET_RETRIES, LOBJFILE_SMOOTH, LTMP_MAT4A, LTMP_MAT4B,
    LTMP_MAT4C, LTMP_QUATA, LTMP_QUATB, LTMP_QUATC, LTMP_VEC3A, LTMP_VEC3B, LTMP_VEC3C, lSScene, LTEXCTL_STATIC,
    LTEXCTL_STATIC_LIST, lGl, lCamera, lScene, lDoDown, lDoUp, lShader_objects, mat4, vec3, vec4, quat} from "../../libs/limpetge.js"

/*
shader_template - A template for shaders.

 */

// Last shader used
var _lShaderId = 0;

/*

Copy the shader files here

*/
/*
ShaderSimple : A "SIMPLE" shader 

A very simple shader.  Just uses a directional light and ambient one.

doInitBuffer(structure)
    structure.args:

        One of:
            texture: url string
            rawrtexture: loaded texture
            color: vec4 color
            colors: array of vec4 colors

        As well as the standard arrays

doDraw(buffer, position, control)
    lScene.ambienLight  - A vec3 representing the ambient light
    lScene.directionalLightColor
                        - A vec3 representing the direcrtional light color
                          (the sun).
    lSScene.directionalVector
                        - The direction of the light taking into consideration
                          where the camera is pointing.  LimpetGE updates this
                          automatically if the direction is set using the
                          "lScene.lDirectionalVector" ("vec3") is set.


 */
class ShaderSimple  {
    static key = 0;
    static fragSource = `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uDirectionalVector;
        uniform highp vec3 uAmbientLight;
        uniform lowp float uShininess;
        uniform sampler2D uSampler;

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
                if(uShininess > 0.0)
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
        // uniform mat4 uNormalMatrix;     // Normal matrix

        uniform vec3 uDirectionalLightColor;
        uniform vec3 uDirectionalVector;

        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;

            // vNormal = (uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz;
            vNormal = (uPositionMatrix * vec4(aVertexNormal, 0.0)).xyz;
            vPosition = (uPositionMatrix * aVertexPosition).xyz;
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
            aVertexNormal: lGl.getAttribLocation(prog, 'aVertexNormal'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            // uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),
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
        else if(args.canvas) {
            buffer.texture = lLoadTCanvas(args.canvas);
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
        lGl.uniform1i(this.locations.uSampler, 0);
        lGl.uniform3fv(this.locations.uDirectionalLightColor, lScene.directionalLightColor);
    }

    // Variables used in doDraw

    static positionMatrix = mat4.create();
    static viewMatrix = mat4.create();
    static eyesPos = vec3.create();
    static oneForward = vec3.fromValues(0, 0, -1);  // Same as cabin light direction

    static doDraw(buffer, position, control)
    {
        lGl.uniform3fv(this.locations.uDirectionalVector, lSScene.directionalVector);
        const mp = mat4.multiply(this.positionMatrix, lCamera.position, position);

        // const normalMatrix = mat4.create();
        // mat4.invert(normalMatrix, ma);
        // mat4.transpose(normalMatrix, normalMatrix);

        const mv = mat4.multiply(this.viewMatrix, lCamera.currview, position);
        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false, mv);
        lGl.uniformMatrix4fv(this.locations.uPositionMatrix, false, mp);
        // lGl.uniformMatrix4fv(this.locations.uNormalMatrix, false, mp); 

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

class ShaderShip  {
    static key = 0;
    static fragSource = `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uDirectionalVector;
        uniform highp vec3 uAmbientLight;
        uniform lowp float uShininess;
        uniform sampler2D uSampler;

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
                if(uShininess > 0.0)
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
        // uniform mat4 uNormalMatrix;     // Normal matrix

        uniform vec3 uDirectionalLightColor;
        uniform vec3 uDirectionalVector;

        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;

            // vNormal = (uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz;
            vNormal = (uPositionMatrix * vec4(aVertexNormal, 0.0)).xyz;
            vPosition = (uPositionMatrix * aVertexPosition).xyz;
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
            aVertexNormal: lGl.getAttribLocation(prog, 'aVertexNormal'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            // uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),
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
        else if(args.canvas) {
            buffer.texture = lLoadTCanvas(args.canvas);
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
        lGl.uniform1i(this.locations.uSampler, 0);
        lGl.uniform3fv(this.locations.uDirectionalLightColor, lScene.directionalLightColor);
    }

    // Variables used in doDraw

    static positionMatrix = mat4.create();
    static viewMatrix = mat4.create();
    static eyesPos = vec3.create();
    static oneForward = vec3.fromValues(0, 0, -1);  // Same as cabin light direction

    static doDraw(buffer, position, control)
    {
        if (control.ispark) {
            let ans = this.eyesPos;
            vec3.transformMat4(ans, this.oneForward, mat4.fromQuat(LTMP_MAT4A, lScene.eyesquat));
            ans[2] = 0 - ans[2];
            lGl.uniform3fv(this.locations.uDirectionalVector, ans);
        } else {
            lGl.uniform3fv(this.locations.uDirectionalVector, lSScene.directionalVector);
        }
            

        const mp = mat4.multiply(this.positionMatrix, lCamera.position, position);

        // const normalMatrix = mat4.create();
        // mat4.invert(normalMatrix, ma);
        // mat4.transpose(normalMatrix, normalMatrix);

        const mv = mat4.multiply(this.viewMatrix, lCamera.currview, position);
        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false, mv);
        lGl.uniformMatrix4fv(this.locations.uPositionMatrix, false, mp);
        // lGl.uniformMatrix4fv(this.locations.uNormalMatrix, false, mp); 

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}


/*

Shader direction actually uses a point of light
However, this point is always a long way away, so
therefore rthe direction can be established at a structure
level before the thing is displayed.
*/
class ShaderCockpit
{

    static key = 0;
    static fragSource = `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uDirectionalVector;
        uniform highp vec3 uAmbientLight;
        uniform lowp float uShininess;
        uniform sampler2D uSampler;

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
                if(uShininess > 0.0)
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
        // uniform mat4 uNormalMatrix;     // Normal matrix

        uniform vec3 uDirectionalLightColor;
        uniform vec3 uDirectionalVector;

        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;

            // vNormal = (uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz;
            vNormal = (uPositionMatrix * vec4(aVertexNormal, 0.0)).xyz;
            vPosition = (uPositionMatrix * aVertexPosition).xyz;
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
            aVertexNormal: lGl.getAttribLocation(prog, 'aVertexNormal'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            // uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),
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
        else if(args.canvas) {
            buffer.texture = lLoadTCanvas(args.canvas);
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
    static cockpitVec = vec3.create();
    static cameraVec = vec3.create();
    static oneForward = vec3.fromValues(0, 0, -1);  // Same as cabin light direction
    static oneBack = vec3.fromValues(0, 0, 1);  // Same as cabin light direction

    static doDraw(buffer, position, control)
    {
        // Will do calculation of diectional light here as the entire structure
        // is pobably a single control

        const mp = mat4.multiply(this.positionMatrix, lCamera.position, position);
        const mv = mat4.multiply(this.viewMatrix, lCamera.currview, position);
        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false, mv);
        lGl.uniformMatrix4fv(this.locations.uPositionMatrix, false, mp);

        const obj = control.obj;

        vec3.transformMat4(this.cockpitVec, this.oneForward, mat4.fromQuat(LTMP_MAT4A, obj.quat));
        // this.cockpitVec where we are pointing

        if(lScene.injump) {
            // Single light source for entire scene
            var ans = control.cvPoint;
            // ans is where sun is shining
            var dot = -control.ccDir[2];
        } else if (control.ispark) {
            var ans = control.direct;
            vec3.transformMat4(ans, this.oneForward, mat4.fromQuat(LTMP_MAT4A, control.eyes.quat));
            ans[2] = 0 - ans[2];
            var dot = -1;
        } else {
            var ans = lSScene.directionalVector;
            var tdir = lScene.lDirectionalVector;
            var dot = vec3.dot(this.cockpitVec, tdir);
        }
        
        lGl.uniform3fv(this.locations.uDirectionalVector, ans);

        // See what angle camera is compared to cockpit

        mat4.getTranslation(this.cockpitVec, mat4.translate(LTMP_MAT4A, mat4.fromQuat(LTMP_MAT4B, control.obj.quat), this.oneForward))
        // mat4.getTranslation(this.cameraVec, mat4.translate(LTMP_MAT4A, mat4.fromQuat(LTMP_MAT4B, lCamera.quat), this.oneForward))



        if(dot < -0.1)        // Light from behind
            if(control.ispark)
                lGl.uniform3fv(this.locations.uDirectionalLightColor, lScene.cabinLightColor);
            else
                lGl.uniform3fv(this.locations.uDirectionalLightColor, lScene.noLightColor);
        else
            lGl.uniform3fv(this.locations.uDirectionalLightColor, lScene.directionalLightColor);


        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

 


/*
ShaderSolid : A "SOLID" shader for "light" objects.

This makes the object look like a simple light source.


doInitBuffer(structure)
    structure.args:

        One of:
            texture: url string
            rawrtexture: loaded texture
            color: vec4 color
            colors: array of vec4 colors

        As well as the standard arrays

doDraw(buffer, position, control)
    No argument looked at


 */
class ShaderSolid {
    static key=  4;
    static fragSource =  `
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
        else if(args.image) {
            buffer.texture = args.image.load();
        }
        else if(args.canvas) {
            buffer.texture = lLoadTCanvas(args.canvas);
        }

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

    static reloadImage(buffer, image)
    {
        image.reload(buffer.texture);
    }

    static reloadTexture(structure)
    {
        const buffer = structure.buffer;
        // Fix following shit at some point
        const  args = structure.args;
        lReloadTCanvas(buffer.texture, args.canvas);
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

    static positionMatrix =  mat4.create();

    static doDraw(buffer, position, control)
    {

        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false,
            mat4.multiply(this.positionMatrix, lCamera.currview, position));

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

class ShaderSolidTrans  {
    static key =  4;
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
        else if(args.image) {
            buffer.texture = args.image.load();
        }

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

    static reloadImage(buffer, image)
    {
        image.reload(buffer.texture);
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

    static positionMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {

        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false,
            mat4.multiply(this.positionMatrix, lCamera.currview, position));

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

class ShaderDust {
    static key = 4;
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
        uniform highp float uVelocity;

        varying highp vec2 vCoords;

        void main(void) {
            highp vec4 vert = aVertexPosition;
            vert.z *= uVelocity;
            gl_Position = uViewMatrix * vert;
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
            uVelocity: lGl.getUniformLocation(prog, 'uVelocity'),
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

    static positionMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {
        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false,
            mat4.multiply(this.positionMatrix, lCamera.currview, position));
        lGl.uniform1f(this.locations.uVelocity, control.velocity  / control.maxvelocity);
        

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

/*
ShaderSun : A "Sun" shader for "light" objects.

Like shader sun but can adjust the size


doDraw(buffer, position, control)
    No argument looked at


 */
class ShaderSun {
    static key = 4;
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
        uniform highp float uScale;


        varying highp vec2 vCoords;

        void main(void) {
            highp vec4 vert = aVertexPosition;
            vert.x *= uScale;
            vert.y *= uScale;
            vert.z *= uScale;

            gl_Position = uViewMatrix * vert;
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
            uScale: lGl.getUniformLocation(prog, 'uScale'),

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
        else if(args.canvas) {
            buffer.texture = lLoadTCanvas(args.canvas);
        }

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

    static reloadTexture(structure)
    {
        const buffer = structure.buffer;
        const  args = structure.args;
        lReloadTCanvas(buffer.texture, args.canvas);
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

    static doDraw(buffer, position, control)
    {

        const ma = mat4.create();

        if (control.fixed)
            mat4.multiply(ma, lCamera.fixedview, position);
        else
            mat4.multiply(ma, lCamera.currview, position);

        lGl.uniform1f(this.locations.uScale, control.scale);
        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false, ma);

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

/*
Planet - Like simple but with a scale
 */

class ShaderPlanet  {
    static key = 2;
    static fragSource = `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uDirectionalVector;
        uniform highp vec3 uAmbientLight;
        uniform lowp float uShininess;
        uniform sampler2D uSampler;

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
                if(uShininess > 0.0)
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

    // Planets translate only, no normal calculation neccessary

    static vertexSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoords;

        uniform mat4 uPositionMatrix;   // Position of object relative to lCamera
        uniform mat4 uViewMatrix;       // View of object (above + projection)
        // uniform mat4 uNormalMatrix;     // Normal matrix

        uniform vec3 uDirectionalLightColor;
        uniform vec3 uDirectionalVector;

        uniform highp float uScale;

        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            highp vec4 vert = aVertexPosition;
            vert.x *= uScale;
            vert.y *= uScale;
            vert.z *= uScale;
            gl_Position = uViewMatrix * vert;

            vNormal = aVertexNormal;
            // vNormal = (uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz;
            vPosition = (uPositionMatrix * aVertexPosition).xyz;
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
            aVertexNormal: lGl.getAttribLocation(prog, 'aVertexNormal'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            // uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),
            uColor: lGl.getUniformLocation(prog, 'uColor'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),
            uScale: lGl.getUniformLocation(prog, 'uScale'),

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
        else if(args.canvas) {
            buffer.texture = lLoadTCanvas(args.canvas);
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

    static reloadTexture(structure)
    {
        const buffer = structure.buffer;
        // Fix following shit at some point
        const  args = structure.args;
        lReloadTCanvas(buffer.texture, args.canvas);
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
    static lightVector = vec3.create();

    // Planets only translated - no normal matrix neccessary

    static doDraw(buffer, position, control)
    {

        if (control.fixed)
        {
            lGl.uniform3fv(this.locations.uDirectionalVector, lScene.lDirectionalVector);
            mat4.multiply(this.viewMatrix, lCamera.fixedview, position);
            lGl.uniformMatrix4fv(this.locations.uPositionMatrix, false, position);
        }
        else
        {
            lGl.uniform3fv(this.locations.uDirectionalVector, control.cvPoint);
            mat4.multiply(this.viewMatrix, lCamera.currview, position);
            lGl.uniformMatrix4fv(this.locations.uPositionMatrix, false,
                    mat4.multiply(this.positionMatrix, lCamera.position, position));
        }

        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false, this.viewMatrix);

        lGl.uniform1f(this.locations.uScale, control.scale);
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

class ShaderScanLine {
    static key = 4;
    static fragSource = `
        uniform highp vec4 uColor;

        void main() {
            gl_FragColor = uColor;
        }
    `;

    static vertexSource = `
        attribute vec4 aVertexPosition;

        uniform mat4 uViewMatrix;       // View of object (above + projection)
        uniform highp float uHeight;

        void main(void) {
            highp vec4 vert = aVertexPosition;
            vert.y *= uHeight;
            gl_Position = uViewMatrix * vert;
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

            // uniforms
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uColor: lGl.getUniformLocation(prog, 'uColor'),
            uHeight: lGl.getUniformLocation(prog, 'uHeight'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            this.locations.aVertexPosition,
        );
    }

    static doInitBuffer(structure)
    {
        const buffer = structure.buffer;
        const  args = structure.args;

        /*
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
        */

        const pointBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, pointBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.pointsArray), lGl.STATIC_DRAW);
        buffer.point = pointBuffer;

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
    }

    static positionMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {
        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false, 
                mat4.multiply(this.positionMatrix, lCamera.currview, position));

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);
        lGl.uniform1f(this.locations.uHeight, control.height);
        lGl.uniform4fv(this.locations.uColor, control.color);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}

class ShaderDial {
    static key = 4;
    static fragSource = `
        uniform highp vec4 uColor;
        void main() {
            gl_FragColor = uColor;
        }
    `;

    static vertexSource = `
        attribute vec4 aVertexPosition;

        uniform mat4 uViewMatrix;       // View of object (above + projection)
        uniform highp float uWidth;

        void main(void) {
            highp vec4 vert = aVertexPosition;
            vert.x *= uWidth;
            gl_Position = uViewMatrix * vert;
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

            // uniforms
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uColor: lGl.getUniformLocation(prog, 'uColor'),
            uWidth: lGl.getUniformLocation(prog, 'uWidth'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            this.locations.aVertexPosition,
        );
    }

    static doInitBuffer(structure)
    {

        const buffer = structure.buffer;
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

        const pointBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, pointBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.pointsArray), lGl.STATIC_DRAW);
        buffer.point = pointBuffer;

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
    }

    static positionMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {
        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false, 
                mat4.multiply(this.positionMatrix, lCamera.currview, position));

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);
        lGl.uniform1f(this.locations.uWidth, control.width);
        lGl.uniform4fv(this.locations.uColor, control.color);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}


lExtendarray(lShader_objects, [
    /*
    List the shader references here
    */

    ShaderSun,
    ShaderPlanet,
    ShaderSimple,
    ShaderShip,
    ShaderCockpit,
    ShaderSolid,    
    ShaderScanLine,
    ShaderSolidTrans,
    ShaderDust,
    ShaderDial
    // ShaderSimpleTrans,
]);


export {
    ShaderSun,
    ShaderPlanet,
    ShaderSimple,
    ShaderShip,
    ShaderCockpit,
    ShaderSolid,        // This has some transparents in it
    ShaderScanLine,
    ShaderSolidTrans,
    ShaderDust,
    ShaderDial
};

