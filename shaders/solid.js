
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
const ShaderSolid = {
    key: 4,
    fragSource: `
        uniform sampler2D uSampler;

        varying highp vec2 vCoords;

        void main() {
            gl_FragColor = texture2D(uSampler, vCoords);
        }
    `,

    vertexSource: `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoords;

        uniform mat4 uPositionMatrix;   // Position of object relative to lCamera
        uniform mat4 uViewMatrix;       // View of object (above + projection)
        uniform mat4 uNormalMatrix;     // Normal matrix

        varying highp vec2 vCoords;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;
            vCoords = aTextureCoords;
        }
    `,

    // This is called on load
    compile: function()
    {
        _lShaderId += 1;
        ShaderSolid.key = _lShaderId;

        const prog = lInitShaderProgram(ShaderSolid.vertexSource, ShaderSolid.fragSource);
        ShaderSolid.shader = prog;
        ShaderSolid.locations = {
            // attributes
            aVertexPosition: lGl.getAttribLocation(prog, 'aVertexPosition'),
            aTextureCoords: lGl.getAttribLocation(prog, 'aTextureCoords'),

            // uniforms
            uPositionMatrix: lGl.getUniformLocation(prog, 'uPositionMatrix'),
            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),

        };

        // I cannot think of a reason not to enable them here
        lGl.enableVertexAttribArray(
            ShaderSolid.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            ShaderSolid.locations.aVertexNormal
        );
        lGl.enableVertexAttribArray(
            ShaderSolid.locations.aTextureCoords
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
        lGl.useProgram(ShaderSolid.shader);
    },

    useBuffer: function(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            ShaderSolid.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            ShaderSolid.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.uniform1i(ShaderSolid.locations.uSampler, 0);
    },

    doDraw: function(buffer, position, control)
    {

        const ma = mat4.create();
        mat4.multiply(ma, lCamera.position, position);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, ma);
        mat4.transpose(normalMatrix, normalMatrix);

        mat4.multiply(ma, lCamera.currview, position);
        lGl.uniformMatrix4fv(ShaderSolid.locations.uViewMatrix, false, ma);
        mat4.multiply(ma, lCamera.position, position);
        lGl.uniformMatrix4fv(ShaderSolid.locations.uPositionMatrix, false, ma);

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    },
}
