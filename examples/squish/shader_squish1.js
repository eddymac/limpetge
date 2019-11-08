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

const ShaderSimple = {
    key: 2,
    fragSource: `
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
        uniform vec3 uDirectionalVector;

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
            // highp float directional = max(dot(transformedNormal.xyz, uDirectionalVector), 0.0);
            // vLighting = uAmbientLight + (uDirectionalLightColor * directional);
        }
    `,

    // This is called on load
    compile: function()
    {
        _lShaderId += 1;
        ShaderSimple.key = _lShaderId;

        const prog = lInitShaderProgram(ShaderSimple.vertexSource, ShaderSimple.fragSource);
        ShaderSimple.shader = prog;
        ShaderSimple.locations = {
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
            uDirectionalVector: lGl.getUniformLocation(prog, 'uDirectionalVector'),
            uShininess: lGl.getUniformLocation(prog, 'uShininess'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            ShaderSimple.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            ShaderSimple.locations.aVertexNormal
        );
        lGl.enableVertexAttribArray(
            ShaderSimple.locations.aTextureCoords
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
        lGl.useProgram(ShaderSimple.shader);
    },

    useBuffer: function(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            ShaderSimple.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Normals
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.normal);
        lGl.vertexAttribPointer(
            ShaderSimple.locations.aVertexNormal,
            3,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            ShaderSimple.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.uniform1f(ShaderSimple.locations.uShininess, buffer.shininess);
        lGl.uniform3fv(ShaderSimple.locations.uAmbientLight, lScene.ambientLight);
        lGl.uniform3fv(ShaderSimple.locations.uDirectionalLightColor, lScene.directionalLightColor);
        lGl.uniform1i(ShaderSimple.locations.uSampler, 0);
    },

    doDraw: function(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        // What we need to transpose normal matrix by

        lGl.uniform3fv(ShaderSimple.locations.uDirectionalVector, lSScene.directionalVector);

        const ma = mat4.create();
        mat4.multiply(ma, lCamera.position, position);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, ma);
        mat4.transpose(normalMatrix, normalMatrix);

        mat4.multiply(ma, lCamera.currview, position);
        lGl.uniformMatrix4fv(ShaderSimple.locations.uViewMatrix, false, ma);
        mat4.multiply(ma, lCamera.position, position);
        lGl.uniformMatrix4fv(ShaderSimple.locations.uPositionMatrix, false, ma);
        // lGl.uniformMatrix4fv(this.locations.uProjectionMatrix, false, lCamera.currview);
        lGl.uniformMatrix4fv(ShaderSimple.locations.uNormalMatrix, false, normalMatrix); 

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
    ShaderSimple,
];

