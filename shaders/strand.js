/*
ShaderStrand : Used for "strands" in the SL20 game.

This is similar to "ShaderSelf", but two textures collages are supplied.
The amount the first texture is "blended" out, and the second "blended"
in depends on the "control" property "life", a value between 0.0 to 100.0

doInitBuffer(structure)
    structure.args:

        One of:
            texture: url string
            rawrtexture: loaded texture
            color: vec4 color
            colors: array of vec4 colors

        wtexture: url string - the "second" texture

        As well as the standard arrays

doDraw(buffer, position, control)
    lScene.ambienLight  - A vec3 representing the ambient light
    lScene.directionalLightColor
                        - A vec3 representing the directional light color
                          (the toch).
    control.life        - From 100.0 o 0.0, 100 = First texture used, 0 = Second texture 
                          used, anything in between the appropriate proportion is
                          used.
 */
const ShaderStrand = {
    key: 1,
    fragSource: `
        uniform highp vec3 uDirectionalLightColor;
        uniform highp vec3 uDirectionalVector;
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

            lowp float directtorch = max((lpos.z - 0.8) * 5.0, 0.0);    // How "front" this is for diffuse

            lowp float distance = max(length(vPosition), 0.1); //how far

            lowp float spec = pow(max(dot(normal, lpos), 0.0), 50.0) * 10.0 / (distance * distance);
            lowp float diffuse = min(100.0 / (distance * distance), 1.0);    // Cannot go above 1

            lowp float ambw = min(distance / 20.0, 1.0);

            highp vec4 color = (texture2D(uSampler, vCoords) * uLife) + (texture2D(uWSampler, vCoords) * (1.0 - uLife));

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

        uniform vec3 uDirectionalLightColor;
        uniform vec3 uDirectionalVector;

        varying highp vec3 vLighting;
        varying highp vec3 vNormal;
        varying highp vec3 vPosition;
        varying highp vec2 vCoords;

        void main(void) {
            gl_Position = uViewMatrix * aVertexPosition;

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
            uDirectionalVector: lGl.getUniformLocation(prog, 'uDirectionalVector'),

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
            buffer.texture = lLoadTColors(args.colors, args.colors.length, 1);
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
        lGl.uniform3fv(ShaderStrand.locations.uDirectionalVector, vec);
    },

    doDraw: function(buffer, position, control)
    {
        const ma = mat4.create();
        mat4.multiply(ma, lCamera.position, position);

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, ma);
        mat4.transpose(normalMatrix, normalMatrix);


        lGl.uniform1f(ShaderStrand.locations.uLife, (control.life / 100));

        mat4.multiply(ma, lCamera.currview, position);
        lGl.uniformMatrix4fv(ShaderStrand.locations.uViewMatrix, false, ma);
        mat4.multiply(ma, lCamera.position, position);
        lGl.uniformMatrix4fv(ShaderStrand.locations.uPositionMatrix, false, ma);
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
