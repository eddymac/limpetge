"use strict;"
/*
ShaderLight : The "LIGHT" shader

The attempt here is to give something the appearence it is "made of light"

What needs to be passed to it:

doInitBuffer(structure)
    structure.args:

        One of:
            texture: url string
            rawrtexture: loaded texture
            color: vec4 color
            colors: array of vec4 colors

        As well as the standard arrays

doDraw(buffer, position, control)
    control.lightheight - A value between 0 and 1, it should increase by
                          (delta * CONSTANT) on each draw, going back to
                          0.0 if it goes above 1.0.
                          It controls the "rising bands" on these objects.
*/

const ShaderLight = {
    key: 3,
    fragSource: `
        uniform sampler2D uSampler;
        uniform highp float uHeight;
        varying highp vec2 vCoords;
        varying highp float vHeight;


        void main() {

            highp vec4 fcolor = texture2D(uSampler, vCoords);
            gl_FragColor = vec4(fcolor.xyz, abs(fract((vHeight - (uHeight / 4.0)) * 4.0) - 0.5));
            
        }
    `,

    vertexSource: `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoords;

        uniform mat4 uPositionMatrix;   // Position of object relative to lCamera
        uniform mat4 uViewMatrix;       // View of object (above + projection)
        uniform mat4 uNormalMatrix;     // Normal matrix

        varying highp vec2 vCoords;
        varying highp float vHeight;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;
            vHeight = aVertexPosition.y;

            vCoords = aTextureCoords;
        }
    `,

    // This is called on load
    compile: function()
    {
        _lShaderId += 1;
        ShaderLight.key = _lShaderId;

        const prog = lInitShaderProgram(ShaderLight.vertexSource, ShaderLight.fragSource);
        ShaderLight.shader = prog;
        ShaderLight.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),
            uHeight: lGl.getUniformLocation(prog, 'uHeight'),

        };

        lGl.enableVertexAttribArray(
            ShaderLight.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            ShaderLight.locations.aVertexNormal
        );
        lGl.enableVertexAttribArray(
            ShaderLight.locations.aTextureCoords
        );
    },

    doInitBuffer: function(structure)
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

        // Set up the points
        const pointBuffer = lGl.createBuffer();
        lGl.bindBuffer(lGl.ARRAY_BUFFER, pointBuffer);
        lGl.bufferData(lGl.ARRAY_BUFFER, new Float32Array(structure.pointsArray), lGl.STATIC_DRAW);
        buffer.point = pointBuffer;

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
        lGl.useProgram(ShaderLight.shader);
    },

    useBuffer: function(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            ShaderLight.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            ShaderLight.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.uniform1i(ShaderLight.locations.uSampler, 0);
    },

    doDraw: function(buffer, position, control)
    {
        const ma = mat4.create();
        mat4.multiply(ma, lCamera.position, position);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, ma);
        mat4.transpose(normalMatrix, normalMatrix);

        mat4.multiply(ma, lCamera.currview, position);
        lGl.uniformMatrix4fv(ShaderLight.locations.uViewMatrix, false, ma);
        mat4.multiply(ma, lCamera.position, position);
        lGl.uniformMatrix4fv(ShaderLight.locations.uPositionMatrix, false, ma);
        lGl.uniform1f(ShaderLight.locations.uHeight, control.lightheight);

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    },
}
