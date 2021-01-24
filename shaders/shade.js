/*
ShaderShade - The "SHADE" shader

This will show the object as though always in the shade (ambient lighting).

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
    lScene.ambienLight  - A vec3 representing the ambient light
*/
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

    static vertexSource: `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoords;

        uniform mat4 uViewMatrix;       // View of object (above + projection)
        // uniform mat4 uProjectionMatrix;

        varying highp vec2 vCoords;

        void main(void) {
            // gl_Position = uProjectionMatrix * uViewMatrix * aVertexPosition;
            gl_Position = uViewMatrix * aVertexPosition;

            vCoords = aTextureCoords;
        }
    `;

    // This is called on load
    static compile()
    {
        _lShaderId += 1;
        ShaderShade.key = _lShaderId;

        const prog = lInitShaderProgram(ShaderShade.vertexSource, ShaderShade.fragSource);
        ShaderShade.shader = prog;
        ShaderShade.locations = {
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
            ShaderShade.locations.aVertexPosition,
        );
        lGl.enableVertexAttribArray(
            ShaderShade.locations.aTextureCoords
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
        lGl.useProgram(ShaderShade.shader);
    }

    static useBuffer(buffer)
    {
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.point);
        lGl.vertexAttribPointer(
            ShaderShade.locations.aVertexPosition,
            3,      // number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Offset
        );


        // Coords
        lGl.bindBuffer(lGl.ARRAY_BUFFER, buffer.coords);
        lGl.vertexAttribPointer(
            ShaderShade.locations.aTextureCoords,
            2,          // Number of components
            lGl.FLOAT,   // Type
            false,      // Normalize
            0,          // Stride
            0           // Float
	    );

        lGl.activeTexture(lGl.TEXTURE0);
        lGl.bindTexture(lGl.TEXTURE_2D, buffer.texture);

        lGl.uniform3fv(ShaderShade.locations.uAmbientLight, lScene.ambientLight);
        lGl.uniform1i(ShaderShade.locations.uSampler, 0);
    }

    static positionMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {
        // Base position is the transpose matrix for parent
        // Camera is an object with perspective and movement there
        // newpos is now the position relative to parent

        lGl.uniformMatrix4fv(ShaderShade.locations.uViewMatrix, false,
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
