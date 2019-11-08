Various shaders

This README does not handle the programming details of incorporating shaders
or these routines in LimpetGE games.   It explains how to implement
these particular files.

The best way to implement these (IMHO) is, for any game is to:
1 - create a "shader_GAMENAME.js" javascript file, based on the
    shader_template.js here.
2 - Use an editor to copy and paste the shaders required shaders to it
3 - Modify/create the "lShader_objects" constant global array accordingly.

Dealing with point 3 above first.  The lShader_objects is a constant global
array that contains the shaders used in order they are drawn.  It is
something like:

const lShader_objects = [
    ShaderSimple,
    ShaderShade,
    ShaderSolid,
    ShaderLight,
    ShaderSimpleTrans,
];

Note: the transparent shaders need to be displayed after the solid ones.

Each shader file here has what it is, and what is required to implement it, in
a comment at the top.  They were creating by adding to this as and
when new shaders were required when writing the example games.
