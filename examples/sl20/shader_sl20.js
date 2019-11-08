"use strict";
/*
 * Shaders: Three separate things
 * 1 - Shader sources and locations - Compile them once
 * 2 - Class objects - Initialise buffes after structure ceation
 * 3 - Objects - Draw them
 *
 * Shaders (1)can have multiple "class" objects(2)
 * Class objects(2) can have multiple Objects
 *
 * At the moment, do 1, then combine 2 and 3
 */

// Last shader used
var _lShaderId = 0;

const ShaderSelf = {
    key: 0,
    fragSource: `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uAmbientLight;
        uniform sampler2D uSampler;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main() {
            highp vec3 normal = normalize(vNormal);

            highp vec3 lpos = normalize(-vPosition);

            // 2 Directions, one for shine, the other diffuse
            // lowp float directshine = max((lpos.z - 0.8) * 5.0, 0.0);    // How "front" this is for spec
            lowp float directtorch = max((lpos.z - 0.8) * 5.0, 0.0);    // How "front" this is for diffuse

            lowp float distance = max(length(vPosition), 0.1); //how far

            lowp float spec = pow(max(dot(normal, lpos), 0.0), 50.0) * 10.0 / (distance * distance);
            // lowp float diffuse = max(dot(normal, lpos), 0.0) * 10.0 / (distance * distance);
            lowp float diffuse = min(100.0 / (distance * distance), 1.0);    // Cannot go above 1

            // Ambience is grey, turn it off as we come near
            lowp float ambw = min(distance / 20.0, 1.0);

            // Get the color from the texture
            highp vec4 color = texture2D(uSampler, vCoords);

            // And out
            gl_FragColor = vec4(uAmbientLight * ambw + (directtorch * diffuse * uDirectionalLightColor.rgb * color.rgb) + (directtorch * spec * uDirectionalLightColor), color.a);

        }
    `,

    vertexSource: `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoords;

        uniform mat4 uPositionMatrix;   // Position of object relative to lCamera
        uniform mat4 uViewMatrix;       // View of object (above + projection)
        uniform mat4 uNormalMatrix;     // Normal matrix
        // uniform mat4 uProjectionMatrix;

        // Following could be constants, but will put them here anyways
        uniform vec3 uDirectionalLightColor;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            // gl_Position = uProjectionMatrix * uViewMatrix * aVertexPosition;
            gl_Position = uViewMatrix * aVertexPosition;

            // Gets the "normal"
            vNormal = (uNormalMatrix * vec4(aVertexNormal, 1.0)).xyz;
            vPosition = (uPositionMatrix * aVertexPosition).xyz;
            vCoords = aTextureCoords;
            // vLighting = uAmbientLight + (uDirectionalLightColor * directional);
        }
    `,

    // This is called on load
    compile: function()
    {
        _lShaderId += 1;
        ShaderSelf.key = _lShaderId;

        const prog = lInitShaderProgram(ShaderSelf.vertexSource, ShaderSelf.fragSource);
        ShaderSelf.shader = prog;
        ShaderSelf.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aVertexNormal: lGl.getAttribLocation(prog, 'aVertexNormal'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),
            uColor: lGl.getUniformLocation(prog, 'uColor'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),

            uAmbientLight: lGl.getUniformLocation(prog, 'uAmbientLight'),
            uDirectionalLightColor: lGl.getUniformLocation(prog, 'uDirectionalLightColor'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            ShaderSelf.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            ShaderSelf.locations.aVertexNormal
        );
        lGl.enableVertexAttribArray(
            ShaderSelf.locations.aTextureCoords
        );
    },

    doInitBuffer: function(structure)
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
            buffer.texture = lLoadTColors(args.colors, args.cwidth, args.cheight);
        }
        else if(args.color) {
            buffer.texture = lLoadTColor(args.color);
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
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.textureCoords), lGl.STATIC_DRAW);
        buffer.coords = coordBuffer;

        const indexBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        lGl.bufferData(lGl.ELEMENT_ARRAY_BUFFER, new Uint16Array(structure.pointsIndex), lGl.STATIC_DRAW);
        buffer.index = indexBuffer;
        buffer.numentries = structure.numentries;

    },

    useProgram: function()
    {
        lGl.useProgram(ShaderSelf.shader);
    },

    useBuffer: function(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            ShaderSelf.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Normals
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.normal);
        lGl.vertexAttribPointer(
            ShaderSelf.locations.aVertexNormal,
            3,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            ShaderSelf.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);
        lGl.uniform1i(ShaderSelf.locations.uSampler, 0);
        lGl.uniform3fv(ShaderSelf.locations.uAmbientLight, lScene.ambientLight);
        lGl.uniform3fv(ShaderSelf.locations.uDirectionalLightColor, lScene.directionalLightColor);

        var vec = vec3.fromValues(0, 0, 1);
        // vec3.transformQuat(vec, vec, lCamera.quat);
        // lGl.uniform4fv(this.locations.uColor, this.color); 

    },

    doDraw: function(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        // What we need to transpose normal matrix by

        const ma = mat4.create();
        mat4.multiply(ma, lCamera.position, position);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, ma);
        mat4.transpose(normalMatrix, normalMatrix);

        // Apply things to it
        
        // Take into account lCamera location

        //Assemble stuff, run shaders

        // First the positions


        mat4.multiply(ma, lCamera.currview, position);
        lGl.uniformMatrix4fv(ShaderSelf.locations.uViewMatrix, false, ma);
        mat4.multiply(ma, lCamera.position, position);
        lGl.uniformMatrix4fv(ShaderSelf.locations.uPositionMatrix, false, ma);
        // lGl.uniformMatrix4fv(this.locations.uProjectionMatrix, false, lCamera.currview);
        lGl.uniformMatrix4fv(ShaderSelf.locations.uNormalMatrix, false, normalMatrix); 

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    },
}
const ShaderSelfTrans = {
    key: 0,
    fragSource: `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uAmbientLight;
        uniform sampler2D uSampler;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main() {
            highp vec3 normal = normalize(vNormal);

            highp vec3 lpos = normalize(-vPosition);

            // 2 Directions, one for shine, the other diffuse
            // lowp float directshine = max((lpos.z - 0.8) * 5.0, 0.0);    // How "front" this is for spec
            lowp float directtorch = max((lpos.z - 0.8) * 5.0, 0.0);    // How "front" this is for diffuse

            lowp float distance = max(length(vPosition), 0.1); //how far

            lowp float spec = pow(max(dot(normal, lpos), 0.0), 50.0) * 10.0 / (distance * distance);
            // lowp float diffuse = max(dot(normal, lpos), 0.0) * 10.0 / (distance * distance);
            lowp float diffuse = min(100.0 / (distance * distance), 1.0);    // Cannot go above 1

            // Ambience is grey, turn it off as we come near
            lowp float ambw = min(distance / 20.0, 1.0);

            // Get the color from the texture
            highp vec4 color = texture2D(uSampler, vCoords);

            // And out
            gl_FragColor = vec4(uAmbientLight * ambw + (directtorch * diffuse * uDirectionalLightColor.rgb * color.rgb) + (directtorch * spec * uDirectionalLightColor), color.a);

        }
    `,

    vertexSource: `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoords;

        uniform mat4 uPositionMatrix;   // Position of object relative to lCamera
        uniform mat4 uViewMatrix;       // View of object (above + projection)
        uniform mat4 uNormalMatrix;     // Normal matrix
        // uniform mat4 uProjectionMatrix;

        // Following could be constants, but will put them here anyways
        uniform vec3 uDirectionalLightColor;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            // gl_Position = uProjectionMatrix * uViewMatrix * aVertexPosition;
            gl_Position = uViewMatrix * aVertexPosition;

            // Gets the "normal"
            vNormal = (uNormalMatrix * vec4(aVertexNormal, 1.0)).xyz;
            vPosition = (uPositionMatrix * aVertexPosition).xyz;
            vCoords = aTextureCoords;
            // vLighting = uAmbientLight + (uDirectionalLightColor * directional);
        }
    `,

    // This is called on load
    compile: function()
    {
        _lShaderId += 1;
        ShaderSelfTrans.key = _lShaderId;

        const prog = lInitShaderProgram(ShaderSelfTrans.vertexSource, ShaderSelfTrans.fragSource);
        ShaderSelfTrans.shader = prog;
        ShaderSelfTrans.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aVertexNormal: lGl.getAttribLocation(prog, 'aVertexNormal'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),
            uColor: lGl.getUniformLocation(prog, 'uColor'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),

            uAmbientLight: lGl.getUniformLocation(prog, 'uAmbientLight'),
            uDirectionalLightColor: lGl.getUniformLocation(prog, 'uDirectionalLightColor'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            ShaderSelfTrans.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            ShaderSelfTrans.locations.aVertexNormal
        );
        lGl.enableVertexAttribArray(
            ShaderSelfTrans.locations.aTextureCoords
        );
    },

    doInitBuffer: function(structure)
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
            buffer.texture = lLoadTColors(args.colors, args.cwidth, args.cheight);
        }
        else if(args.color) {
            buffer.texture = lLoadTColor(args.color);
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
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.textureCoords), lGl.STATIC_DRAW);
        buffer.coords = coordBuffer;

        const indexBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        lGl.bufferData(lGl.ELEMENT_ARRAY_BUFFER, new Uint16Array(structure.pointsIndex), lGl.STATIC_DRAW);
        buffer.index = indexBuffer;
        buffer.numentries = structure.numentries;

    },

    useProgram: function()
    {
        lGl.useProgram(ShaderSelfTrans.shader);
    },

    useBuffer: function(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            ShaderSelfTrans.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Normals
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.normal);
        lGl.vertexAttribPointer(
            ShaderSelfTrans.locations.aVertexNormal,
            3,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            ShaderSelfTrans.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);
        lGl.uniform1i(ShaderSelfTrans.locations.uSampler, 0);
        lGl.uniform3fv(ShaderSelfTrans.locations.uAmbientLight, lScene.ambientLight);
        lGl.uniform3fv(ShaderSelfTrans.locations.uDirectionalLightColor, lScene.directionalLightColor);

        var vec = vec3.fromValues(0, 0, 1);
        // vec3.transformQuat(vec, vec, lCamera.quat);
        // lGl.uniform4fv(this.locations.uColor, this.color); 

    },

    doDraw: function(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        // What we need to transpose normal matrix by

        const ma = mat4.create();
        mat4.multiply(ma, lCamera.position, position);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, ma);
        mat4.transpose(normalMatrix, normalMatrix);

        // Apply things to it
        
        // Take into account lCamera location

        //Assemble stuff, run shaders

        // First the positions


        mat4.multiply(ma, lCamera.currview, position);
        lGl.uniformMatrix4fv(ShaderSelfTrans.locations.uViewMatrix, false, ma);
        mat4.multiply(ma, lCamera.position, position);
        lGl.uniformMatrix4fv(ShaderSelfTrans.locations.uPositionMatrix, false, ma);
        // lGl.uniformMatrix4fv(this.locations.uProjectionMatrix, false, lCamera.currview);
        lGl.uniformMatrix4fv(ShaderSelfTrans.locations.uNormalMatrix, false, normalMatrix); 

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    },
}
const ShaderStrand = {
    key: 1,
    fragSource: `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uAmbientLight;
        uniform sampler2D uSampler;
        uniform sampler2D uWSampler;
        uniform lowp float uLife;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main() {
            highp vec3 normal = normalize(vNormal);

            highp vec3 lpos = normalize(-vPosition);

            // 2 Directions, one for shine, the other diffuse
            // lowp float directshine = max((lpos.z - 0.8) * 5.0, 0.0);    // How "front" this is for spec
            lowp float directtorch = max((lpos.z - 0.8) * 5.0, 0.0);    // How "front" this is for diffuse

            lowp float distance = max(length(vPosition), 0.1); //how far

            lowp float spec = pow(max(dot(normal, lpos), 0.0), 50.0) * 10.0 / (distance * distance);
            // lowp float diffuse = max(dot(normal, lpos), 0.0) * 10.0 / (distance * distance);
            lowp float diffuse = min(100.0 / (distance * distance), 1.0);    // Cannot go above 1

            // Ambience is grey, turn it off as we come near
            lowp float ambw = min(distance / 20.0, 1.0);

            // Get the color from the textures
            highp vec4 color = (texture2D(uSampler, vCoords) * uLife) + (texture2D(uWSampler, vCoords) * (1.0 - uLife));

            // And out
            gl_FragColor = vec4(uAmbientLight * ambw + (directtorch * diffuse * uDirectionalLightColor.rgb * color.rgb) + (directtorch * spec * uDirectionalLightColor), color.a);

        }
    `,

    vertexSource: `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoords;

        uniform mat4 uPositionMatrix;   // Position of object relative to lCamera
        uniform mat4 uViewMatrix;       // View of object (above + projection)
        uniform mat4 uNormalMatrix;     // Normal matrix
        // uniform mat4 uProjectionMatrix;

        // Following could be constants, but will put them here anyways
        uniform vec3 uDirectionalLightColor;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            // gl_Position = uProjectionMatrix * uViewMatrix * aVertexPosition;
            gl_Position = uViewMatrix * aVertexPosition;

            // Gets the "normal"
            vNormal = (uNormalMatrix * vec4(aVertexNormal, 1.0)).xyz;
            vPosition = (uPositionMatrix * aVertexPosition).xyz;
            vCoords = aTextureCoords;
            // vLighting = uAmbientLight + (uDirectionalLightColor * directional);
        }
    `,

    // This is called on load
    compile: function()
    {
        _lShaderId += 1;
        ShaderStrand.key = _lShaderId;

        const prog = lInitShaderProgram(ShaderStrand.vertexSource, ShaderStrand.fragSource);
        ShaderStrand.shader = prog;
        ShaderStrand.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aVertexNormal: lGl.getAttribLocation(prog, 'aVertexNormal'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),
            uColor: lGl.getUniformLocation(prog, 'uColor'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),
            uWSampler: lGl.getUniformLocation(prog, 'uWSampler'),
            uLife: lGl.getUniformLocation(prog, 'uLife'),

            uAmbientLight: lGl.getUniformLocation(prog, 'uAmbientLight'),
            uDirectionalLightColor: lGl.getUniformLocation(prog, 'uDirectionalLightColor'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            ShaderStrand.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            ShaderStrand.locations.aVertexNormal
        );
        lGl.enableVertexAttribArray(
            ShaderStrand.locations.aTextureCoords
        );
    },

    doInitBuffer: function(structure)
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
            buffer.texture = lLoadTColors(args.colors, args.cwidth, args.cheight);
        }
        else if(args.color) {
            buffer.texture = lLoadTColor(args.color);
        }

        buffer.wtexture = lLoadTColor(args.wcolor);

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
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.textureCoords), lGl.STATIC_DRAW);
        buffer.coords = coordBuffer;

        const indexBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        lGl.bufferData(lGl.ELEMENT_ARRAY_BUFFER, new Uint16Array(structure.pointsIndex), lGl.STATIC_DRAW);
        buffer.index = indexBuffer;
        buffer.numentries = structure.numentries;

    },

    useProgram: function()
    {
        lGl.useProgram(ShaderStrand.shader);
    },

    useBuffer: function(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            ShaderStrand.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Normals
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.normal);
        lGl.vertexAttribPointer(
            ShaderStrand.locations.aVertexNormal,
            3,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            ShaderStrand.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.activeTexture(lGl.TEXTURE1);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.wtexture);
        lGl.uniform3fv(ShaderStrand.locations.uAmbientLight, lScene.ambientLight);
        lGl.uniform3fv(ShaderStrand.locations.uDirectionalLightColor, lScene.directionalLightColor);
        lGl.uniform1i(ShaderStrand.locations.uSampler, 0);
        lGl.uniform1i(ShaderStrand.locations.uWSampler, 1);

        var vec = vec3.fromValues(0, 0, 1);
        // vec3.transformQuat(vec, vec, lCamera.quat);


    },

    doDraw: function(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        // What we need to transpose normal matrix by

        const ma = mat4.create();
        mat4.multiply(ma, lCamera.position, position);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, ma);
        mat4.transpose(normalMatrix, normalMatrix);

        // Apply things to it
        
        // Take into account lCamera location

        //Assemble stuff, run shaders

        // First the positions

        lGl.uniform1f(ShaderStrand.locations.uLife, (control.life / 100));

        mat4.multiply(ma, lCamera.currview, position);
        lGl.uniformMatrix4fv(ShaderStrand.locations.uViewMatrix, false, ma);
        mat4.multiply(ma, lCamera.position, position);
        lGl.uniformMatrix4fv(ShaderStrand.locations.uPositionMatrix, false, ma);
        // lGl.uniformMatrix4fv(this.locations.uProjectionMatrix, false, lCamera.currview);
        lGl.uniformMatrix4fv(ShaderStrand.locations.uNormalMatrix, false, normalMatrix); 

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    },
}


const lShader_objects = [
    ShaderSelf,
    ShaderStrand,
    ShaderSelfTrans,
];

