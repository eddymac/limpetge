
/*
ShaderSolid : A "SOLID" shader for "light" objects.

This makes the object look like a simple light source.

 */
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

    static viewMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {

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
