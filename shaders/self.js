"use strict;"

/*
ShaderSelf : A "SELF" or "TORCH" shader

This shader gives the impression of a torch from the camera.

The further the object is away from the torch, the darker (to ambientLight) it is.

It also "greys" the object as it gets further away to try and get an impression
of "fogginess" or "smoginess".

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
                        - A vec3 representing the light color from
                            the "torch


 */
class ShaderSelf {
    static key = -1;
    static fragSource = `
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

            lowp float directtorch = max((lpos.z - 0.8) * 5.0, 0.0);    // How "front" this is for diffuse

            lowp float distance = max(length(vPosition), 0.1); //how far

            lowp float spec = pow(max(dot(normal, lpos), 0.0), 50.0) * 10.0 / (distance * distance);
            lowp float diffuse = min(100.0 / (distance * distance), 1.0);    // Cannot go above 1

            lowp float ambw = min(distance / 20.0, 1.0);

            highp vec4 color = texture2D(uSampler, vCoords);

            gl_FragColor = vec4(uAmbientLight * ambw + (directtorch * diffuse * uDirectionalLightColor.rgb * color.rgb) + (directtorch * spec * uDirectionalLightColor), color.a);

        }
    `;

    static vertexSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoords;

        uniform mat4 uPositionMatrix;   // Position of object relative to lCamera

        // Uncomment following if transforming by non scalar position matrices
        // uniform mat4 uNormalMatrix;   // Position of normal object

        uniform mat4 uViewMatrix;       // View of object (above + projection)

        // Following could be constants, but will put them here anyways
        uniform vec3 uDirectionalLightColor;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;

            // Gets the "normal"

            // Uncomment following if transforming by non scalar position matrices
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

            // Uncomment following if transforming by non scalar position matrices
            // uNormalMatrix: lGl.getUniformLocation(prog, 'uNormalMatrix'),

            uViewMatrix: lGl.getUniformLocation(prog, 'uViewMatrix'),
            uColor: lGl.getUniformLocation(prog, 'uColor'),
            uSampler: lGl.getUniformLocation(prog, 'uSampler'),

            uAmbientLight: lGl.getUniformLocation(prog, 'uAmbientLight'),
            uDirectionalLightColor: lGl.getUniformLocation(prog, 'uDirectionalLightColor'),

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
        lGl.uniform1i(this.locations.uSampler, 0);
        lGl.uniform3fv(this.locations.uAmbientLight, lScene.ambientLight);
        lGl.uniform3fv(this.locations.uDirectionalLightColor, lScene.directionalLightColor);
    }

    static viewMatrix = mat4.create();
    static positionMatrix = mat4.create();

    // Uncomment following if transforming by non scalar position matrices
    //static normalMatrix = mat4.create();

    static doDraw(buffer, position, control)
    {
        lGl.uniformMatrix4fv(this.locations.uViewMatrix, false,
            mat4.multiply(this.viewMatrix, lCamera.currview, position));

        lGl.uniformMatrix4fv(this.locations.uPositionMatrix, false,
            mat4.multiply(this.positionMatrix, lCamera.position, position));

        // Uncomment following 3 lines if transforming by non scalar position matrices
        // lGl.uniformMatrix4fv(this.locations.uNormalMatrix, false,
        //      mat4.transpose(this.normalMatrix, 
        //          mat4.invert(this.normalMatrix, this.positionMatrix)));

        lGl.bindBuffer(lGl.ELEMENT_ARRAY_BUFFER, buffer.index);

        lGl.drawElements(
                    lGl.TRIANGLES,       // Yeah, these
                    buffer.numentries,    // Count
                    lGl.UNSIGNED_SHORT,  // type
                    0                   // Offset
        );
    }
}
