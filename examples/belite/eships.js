"use strict";

/*
BELITE ship definitions
Based on the BBC Elite
Originally written by David Braben and Bob Bell
This derived from Christian Pinder's "NewKind" version of Elite, which
he reversed engineered from the original BBC release

Copyright (I think) belongs to Frontier Developments plc
*/

import { LAssets, LImage, LAudios, LAudioLoop, LBase, LCamera, LObject, LIObject, LWObject, LStaticGroup, LGroupDef,
    LStructureDef, LTextureControl, LVirtObject, LGroup, LStructure, LKey, lInput, lInText, LObjImport, LComponent,
    lInit, lClear, lStructureSetup, lTextureColor, lTextureColorAll, lTextureList, lLoadTexture, lReloadTexture, lLoadTColor,
    lReloadTColor, lLoadTColors, lReloadTColors, lLoadTCanvas, lReloadTCanvas, lInitShaderProgram, lElement, lAddButton, lCanvasResize,
    lFromXYZR, lFromXYZ, lFromXYZPYR, lExtendarray, lGetPosition, lAntiClock, lCoalesce, lIndArray,
    LPRNG, LPRNGD, LCANVAS_ID, LR90, LR180, LR270, LR360, LI_FRONT, LI_BACK, LI_SIDE, LI_TOP, LI_RIGHT, LI_BOTTOM, LI_LEFT, LSTATIC,
    LDYNAMIC, LNONE, LBUT_WIDTH, LBUT_HEIGHT, LMESTIME, LASSET_THREADS, LASSET_RETRIES, LOBJFILE_SMOOTH, LTMP_MAT4A, LTMP_MAT4B,
    LTMP_MAT4C, LTMP_QUATA, LTMP_QUATB, LTMP_QUATC, LTMP_VEC3A, LTMP_VEC3B, LTMP_VEC3C, lSScene, LTEXCTL_STATIC,
    LTEXCTL_STATIC_LIST, lGl, lCamera, lScene, lDoDown, lDoUp, lShader_objects, mat4, vec3, vec4, quat} from "../../libs/limpetge.js"

import {
    ShaderSimple,
    ShaderShip,
    ShaderSolid,        // This has some transparents in it
    ShaderPlanet
} from "./shader_belite.js";


import { SLOTSIZE_2_2, SLOTSIZE_3_3, SLOTSIZE_6_3, SLOTSIZE_8_5, SLOTSIZE_8_15, SLOTSIZE_MAX, SLOTS, HOLDPOS,
    ETRADER, ESMUGGLER, EHUNTER, EPIRATE, EMINER, EPOLICE, ETRANSPORT, EHERMIT,
    ThingBase, AsteroidBase, BoulderBase, FlotsamBase, EscapeBase, JohnDoeBase, PoliceBase, BadAssBase, StationBase, MinistationBase,
    ThargoidBase, ThargonBase, 
    Scan, MockScan, Slots, Parked, Autodock, ExplosionPart, Explosion, Laser,
    MissileBase, RadarBeam, VirtStation, SphereBase, base_structures, g_prng, g_prngd, BASEDIR} from "./base.js";

import {
    EDB_TRADE_LENGTH,
    EDB_T_ALLOYS,
    EDB_T_MINERALS,
    EDB_T_SLAVES,
    EDB_T_ILLEGALS,
    ECommander,
    EDWorld,
    EDSun
} from "./edb.js";

/*
Following "lifted" from the pixmap whose colour map  Christian Pinder uses for his Newkind program
 */

const COLORS = [
    /* Color 0 */ [0.0, 0.0, 0.0, 1.0],
    /* Color 1 */ [0.5, 0.0, 0.0, 1.0],
    /* Color 2 */ [0.0, 0.5, 0.0, 1.0],
    /* Color 3 */ [0.5, 0.5, 0.0, 1.0],
    /* Color 4 */ [0.0, 0.0, 0.5, 1.0],
    /* Color 5 */ [0.5, 0.0, 0.5, 1.0],
    /* Color 6 */ [0.0, 0.5, 0.5, 1.0],
    /* Color 7 */ [0.75, 0.75, 0.75, 1.0],
    /* Color 8 */ [0.75, 0.86, 0.75, 1.0],
    /* Color 9 */ [0.65, 0.8, 0.94, 1.0],
    /* Color 10 */ [0.0, 0.13, 0.8, 1.0],
    /* Color 11 */ [0.0, 1.0, 0.8, 1.0],
    /* Color 12 */ [0.26, 0.26, 0.26, 1.0],
    /* Color 13 */ [0.26, 0.39, 0.0, 1.0],
    /* Color 14 */ [0.26, 0.39, 0.8, 1.0],
    /* Color 15 */ [0.26, 0.8, 0.26, 1.0],
    /* Color 16 */ [0.39, 0.19, 0.0, 1.0],
    /* Color 17 */ [0.39, 0.68, 0.0, 1.0],
    /* Color 18 */ [0.39, 1.0, 0.39, 1.0],
    /* Color 19 */ [0.42, 0.26, 0.31, 1.0],
    /* Color 20 */ [0.48, 0.29, 0.31, 1.0],
    /* Color 21 */ [0.48, 0.48, 0.48, 1.0],
    /* Color 22 */ [0.52, 0.32, 0.03, 1.0],
    /* Color 23 */ [0.52, 0.52, 0.52, 1.0],
    /* Color 24 */ [0.55, 0.35, 0.03, 1.0],
    /* Color 25 */ [0.55, 0.68, 0.94, 1.0],
    /* Color 26 */ [0.55, 0.94, 0.0, 1.0],
    /* Color 27 */ [0.58, 0.39, 0.0, 1.0],
    /* Color 28 */ [0.61, 0.0, 0.0, 1.0],
    /* Color 29 */ [0.65, 0.42, 0.0, 1.0],
    /* Color 30 */ [0.68, 0.32, 0.0, 1.0],
    /* Color 31 */ [0.68, 0.48, 0.0, 1.0],
    /* Color 32 */ [0.71, 0.52, 0.0, 1.0],
    /* Color 33 */ [0.74, 0.55, 0.0, 1.0],
    /* Color 34 */ [0.74, 0.74, 0.74, 1.0],
    /* Color 35 */ [0.77, 0.78, 0.78, 1.0],
    /* Color 36 */ [0.8, 0.0, 0.8, 1.0],
    /* Color 37 */ [0.8, 0.61, 0.0, 1.0],
    /* Color 38 */ [0.84, 0.65, 0.0, 1.0],
    /* Color 39 */ [0.87, 0.71, 0.0, 1.0],
    /* Color 40 */ [0.94, 0.94, 0.94, 1.0],
    /* Color 41 */ [0.38, 0.38, 0.38, 1.0],
    /* Color 42 */ [0.0, 0.62, 0.62, 1.0],
    /* Color 43 */ [0.52, 0.14, 0.94, 1.0],
    /* Color 44 */ [0.0, 0.46, 0.46, 1.0],
    /* Color 45 */ [0.003, 0.29, 0.64, 1.0],
    /* Color 46 */ [0.0, 0.0, 0.55, 1.0],
    /* Color 47 */ [0.07, 0.70, 0.005, 1.0],
    /* Color 48 */ [0.86, 0.43, 0.0, 1.0],
    /* Color 49 */ [0.8, 0.0, 0.0, 1.0],
    /* Color 50 */ [0.69, 0.69, 0.69, 1.0],
    /* Color 51 */ [0.5, 0.25, 0.0, 1.0],
    /* Color 52 */ [1.0, 1.0, 0.5, 1.0],
    /* Color 53 */ [0.4, 0.8, 0.0, 1.0],
    /* Color 54 */ [0.6, 0.8, 0.0, 1.0],
    /* Color 55 */ [0.8, 0.8, 0.0, 1.0],
    /* Color 56 */ [1.0, 0.8, 0.0, 1.0],
    /* Color 57 */ [0.4, 1.0, 0.0, 1.0],
    /* Color 58 */ [0.6, 1.0, 0.0, 1.0],
    /* Color 59 */ [0.8, 1.0, 0.0, 1.0],
    /* Color 60 */ [0.0, 0.0, 0.2, 1.0],
    /* Color 61 */ [0.2, 0.0, 0.2, 1.0],
    /* Color 62 */ [0.4, 0.0, 0.2, 1.0],
    /* Color 63 */ [0.6, 0.0, 0.2, 1.0],
    /* Color 64 */ [0.8, 0.0, 0.2, 1.0],
    /* Color 65 */ [1.0, 0.0, 0.2, 1.0],
    /* Color 66 */ [0.0, 0.2, 0.2, 1.0],
    /* Color 67 */ [0.2, 0.2, 0.2, 1.0],
    /* Color 68 */ [0.4, 0.2, 0.2, 1.0],
    /* Color 69 */ [0.6, 0.2, 0.2, 1.0],
    /* Color 70 */ [0.8, 0.2, 0.2, 1.0],
    /* Color 71 */ [1.0, 0.2, 0.2, 1.0],
    /* Color 72 */ [0.0, 0.4, 0.2, 1.0],
    /* Color 73 */ [0.2, 0.4, 0.2, 1.0],
    /* Color 74 */ [0.4, 0.4, 0.2, 1.0],
    /* Color 75 */ [0.6, 0.4, 0.2, 1.0],
    /* Color 76 */ [0.8, 0.4, 0.2, 1.0],
    /* Color 77 */ [1.0, 0.4, 0.2, 1.0],
    /* Color 78 */ [0.0, 0.6, 0.2, 1.0],
    /* Color 79 */ [0.2, 0.6, 0.2, 1.0],
    /* Color 80 */ [0.4, 0.6, 0.2, 1.0],
    /* Color 81 */ [0.6, 0.6, 0.2, 1.0],
    /* Color 82 */ [0.8, 0.6, 0.2, 1.0],
    /* Color 83 */ [1.0, 0.6, 0.2, 1.0],
    /* Color 84 */ [0.0, 0.8, 0.2, 1.0],
    /* Color 85 */ [0.2, 0.8, 0.2, 1.0],
    /* Color 86 */ [0.4, 0.8, 0.2, 1.0],
    /* Color 87 */ [0.6, 0.8, 0.2, 1.0],
    /* Color 88 */ [0.8, 0.8, 0.2, 1.0],
    /* Color 89 */ [1.0, 0.8, 0.2, 1.0],
    /* Color 90 */ [0.2, 1.0, 0.2, 1.0],
    /* Color 91 */ [0.4, 1.0, 0.2, 1.0],
    /* Color 92 */ [0.6, 1.0, 0.2, 1.0],
    /* Color 93 */ [0.8, 1.0, 0.2, 1.0],
    /* Color 94 */ [1.0, 1.0, 0.2, 1.0],
    /* Color 95 */ [0.0, 0.0, 0.4, 1.0],
    /* Color 96 */ [0.2, 0.0, 0.4, 1.0],
    /* Color 97 */ [0.4, 0.0, 0.4, 1.0],
    /* Color 98 */ [0.6, 0.0, 0.4, 1.0],
    /* Color 99 */ [0.8, 0.0, 0.4, 1.0],
    /* Color 100 */ [1.0, 0.0, 0.4, 1.0],
    /* Color 101 */ [0.0, 0.2, 0.4, 1.0],
    /* Color 102 */ [0.2, 0.2, 0.4, 1.0],
    /* Color 103 */ [0.4, 0.2, 0.4, 1.0],
    /* Color 104 */ [0.6, 0.2, 0.4, 1.0],
    /* Color 105 */ [0.8, 0.2, 0.4, 1.0],
    /* Color 106 */ [1.0, 0.2, 0.4, 1.0],
    /* Color 107 */ [0.0, 0.4, 0.4, 1.0],
    /* Color 108 */ [0.2, 0.4, 0.4, 1.0],
    /* Color 109 */ [0.4, 0.4, 0.4, 1.0],
    /* Color 110 */ [0.6, 0.4, 0.4, 1.0],
    /* Color 111 */ [0.8, 0.4, 0.4, 1.0],
    /* Color 112 */ [0.0, 0.6, 0.4, 1.0],
    /* Color 113 */ [0.2, 0.6, 0.4, 1.0],
    /* Color 114 */ [0.4, 0.6, 0.4, 1.0],
    /* Color 115 */ [0.6, 0.6, 0.4, 1.0],
    /* Color 116 */ [0.8, 0.6, 0.4, 1.0],
    /* Color 117 */ [1.0, 0.6, 0.4, 1.0],
    /* Color 118 */ [0.0, 0.8, 0.4, 1.0],
    /* Color 119 */ [0.2, 0.8, 0.4, 1.0],
    /* Color 120 */ [0.6, 0.8, 0.4, 1.0],
    /* Color 121 */ [0.8, 0.8, 0.4, 1.0],
    /* Color 122 */ [1.0, 0.8, 0.4, 1.0],
    /* Color 123 */ [0.0, 1.0, 0.4, 1.0],
    /* Color 124 */ [0.2, 1.0, 0.4, 1.0],
    /* Color 125 */ [0.6, 1.0, 0.4, 1.0],
    /* Color 126 */ [0.8, 1.0, 0.4, 1.0],
    /* Color 127 */ [1.0, 0.0, 0.8, 1.0],
    /* Color 128 */ [0.8, 0.0, 1.0, 1.0],
    /* Color 129 */ [0.0, 0.6, 0.6, 1.0],
    /* Color 130 */ [0.6, 0.2, 0.6, 1.0],
    /* Color 131 */ [0.6, 0.0, 0.6, 1.0],
    /* Color 132 */ [0.8, 0.0, 0.6, 1.0],
    /* Color 133 */ [0.0, 0.0, 0.6, 1.0],
    /* Color 134 */ [0.2, 0.2, 0.6, 1.0],
    /* Color 135 */ [0.4, 0.0, 0.6, 1.0],
    /* Color 136 */ [0.8, 0.2, 0.6, 1.0],
    /* Color 137 */ [1.0, 0.0, 0.6, 1.0],
    /* Color 138 */ [0.0, 0.4, 0.6, 1.0],
    /* Color 139 */ [0.2, 0.4, 0.6, 1.0],
    /* Color 140 */ [0.4, 0.2, 0.6, 1.0],
    /* Color 141 */ [0.6, 0.4, 0.6, 1.0],
    /* Color 142 */ [0.8, 0.4, 0.6, 1.0],
    /* Color 143 */ [1.0, 0.2, 0.6, 1.0],
    /* Color 144 */ [0.2, 0.6, 0.6, 1.0],
    /* Color 145 */ [0.4, 0.6, 0.6, 1.0],
    /* Color 146 */ [0.6, 0.6, 0.6, 1.0],
    /* Color 147 */ [0.8, 0.6, 0.6, 1.0],
    /* Color 148 */ [1.0, 0.6, 0.6, 1.0],
    /* Color 149 */ [0.0, 0.8, 0.6, 1.0],
    /* Color 150 */ [0.2, 0.8, 0.6, 1.0],
    /* Color 151 */ [0.4, 0.8, 0.4, 1.0],
    /* Color 152 */ [0.6, 0.8, 0.6, 1.0],
    /* Color 153 */ [0.8, 0.8, 0.6, 1.0],
    /* Color 154 */ [1.0, 0.8, 0.6, 1.0],
    /* Color 155 */ [0.0, 1.0, 0.6, 1.0],
    /* Color 156 */ [0.2, 1.0, 0.6, 1.0],
    /* Color 157 */ [0.4, 0.8, 0.6, 1.0],
    /* Color 158 */ [0.6, 1.0, 0.6, 1.0],
    /* Color 159 */ [0.8, 1.0, 0.6, 1.0],
    /* Color 160 */ [1.0, 1.0, 0.6, 1.0],
    /* Color 161 */ [0.0, 0.0, 0.8, 1.0],
    /* Color 162 */ [0.2, 0.0, 0.6, 1.0],
    /* Color 163 */ [0.4, 0.0, 0.8, 1.0],
    /* Color 164 */ [0.6, 0.0, 0.8, 1.0],
    /* Color 165 */ [0.8, 0.0, 0.8, 1.0],
    /* Color 166 */ [0.0, 0.2, 0.6, 1.0],
    /* Color 167 */ [0.2, 0.2, 0.8, 1.0],
    /* Color 168 */ [0.4, 0.2, 0.8, 1.0],
    /* Color 169 */ [0.6, 0.2, 0.8, 1.0],
    /* Color 170 */ [0.8, 0.2, 0.8, 1.0],
    /* Color 171 */ [1.0, 0.2, 0.8, 1.0],
    /* Color 172 */ [0.0, 0.4, 0.8, 1.0],
    /* Color 173 */ [0.2, 0.4, 0.8, 1.0],
    /* Color 174 */ [0.4, 0.4, 0.6, 1.0],
    /* Color 175 */ [0.6, 0.4, 0.8, 1.0],
    /* Color 176 */ [0.8, 0.4, 0.8, 1.0],
    /* Color 177 */ [1.0, 0.4, 0.6, 1.0],
    /* Color 178 */ [0.0, 0.6, 0.8, 1.0],
    /* Color 179 */ [0.2, 0.6, 0.8, 1.0],
    /* Color 180 */ [0.4, 0.6, 0.8, 1.0],
    /* Color 181 */ [0.6, 0.6, 0.8, 1.0],
    /* Color 182 */ [0.8, 0.6, 0.8, 1.0],
    /* Color 183 */ [1.0, 0.6, 0.8, 1.0],
    /* Color 184 */ [0.0, 0.8, 0.8, 1.0],
    /* Color 185 */ [0.2, 0.8, 0.8, 1.0],
    /* Color 186 */ [0.4, 0.8, 0.8, 1.0],
    /* Color 187 */ [0.6, 0.8, 0.8, 1.0],
    /* Color 188 */ [0.8, 0.8, 0.8, 1.0],
    /* Color 189 */ [1.0, 0.8, 0.8, 1.0],
    /* Color 190 */ [0.0, 1.0, 0.8, 1.0],
    /* Color 191 */ [0.2, 1.0, 0.8, 1.0],
    /* Color 192 */ [0.4, 1.0, 0.6, 1.0],
    /* Color 193 */ [0.6, 1.0, 0.8, 1.0],
    /* Color 194 */ [0.8, 1.0, 0.8, 1.0],
    /* Color 195 */ [1.0, 1.0, 0.8, 1.0],
    /* Color 196 */ [0.2, 0.0, 0.8, 1.0],
    /* Color 197 */ [0.4, 0.0, 1.0, 1.0],
    /* Color 198 */ [0.6, 0.0, 1.0, 1.0],
    /* Color 199 */ [0.0, 0.2, 0.8, 1.0],
    /* Color 200 */ [0.2, 0.2, 1.0, 1.0],
    /* Color 201 */ [0.4, 0.2, 1.0, 1.0],
    /* Color 202 */ [0.6, 0.2, 1.0, 1.0],
    /* Color 203 */ [0.8, 0.2, 1.0, 1.0],
    /* Color 204 */ [1.0, 0.2, 1.0, 1.0],
    /* Color 205 */ [0.0, 0.4, 1.0, 1.0],
    /* Color 206 */ [0.8, 0.0, 0.0, 1.0],
    /* Color 207 */ [0.4, 0.4, 0.8, 1.0],
    /* Color 208 */ [0.6, 0.4, 1.0, 1.0],
    /* Color 209 */ [0.8, 0.4, 1.0, 1.0],
    /* Color 210 */ [1.0, 0.4, 0.8, 1.0],
    /* Color 211 */ [0.0, 0.6, 1.0, 1.0],
    /* Color 212 */ [0.2, 0.6, 1.0, 1.0],
    /* Color 213 */ [0.4, 0.6, 1.0, 1.0],
    /* Color 214 */ [0.6, 0.6, 1.0, 1.0],
    /* Color 215 */ [0.8, 0.6, 1.0, 1.0],
    /* Color 216 */ [1.0, 0.6, 1.0, 1.0],
    /* Color 217 */ [0.0, 0.8, 1.0, 1.0],
    /* Color 218 */ [0.2, 0.8, 1.0, 1.0],
    /* Color 219 */ [0.4, 0.8, 1.0, 1.0],
    /* Color 220 */ [0.6, 0.8, 1.0, 1.0],
    /* Color 221 */ [0.8, 0.8, 1.0, 1.0],
    /* Color 222 */ [1.0, 0.8, 1.0, 1.0],
    /* Color 223 */ [0.2, 1.0, 1.0, 1.0],
    /* Color 224 */ [0.4, 1.0, 0.8, 1.0],
    /* Color 225 */ [0.6, 1.0, 1.0, 1.0],
    /* Color 226 */ [0.8, 1.0, 1.0, 1.0],
    /* Color 227 */ [1.0, 0.4, 0.4, 1.0],
    /* Color 228 */ [0.4, 1.0, 0.4, 1.0],
    /* Color 229 */ [1.0, 1.0, 0.4, 1.0],
    /* Color 230 */ [0.4, 0.4, 1.0, 1.0],
    /* Color 231 */ [1.0, 0.4, 1.0, 1.0],
    /* Color 232 */ [0.4, 1.0, 1.0, 1.0],
    /* Color 233 */ [0.65, 0.0, 0.13, 1.0],
    /* Color 234 */ [0.37, 0.37, 0.37, 1.0],
    /* Color 235 */ [0.47, 0.47, 0.47, 1.0],
    /* Color 236 */ [0.53, 0.53, 0.53, 1.0],
    /* Color 237 */ [0.59, 0.59, 0.59, 1.0],
    /* Color 238 */ [0.80, 0.80, 0.80, 1.0],
    /* Color 239 */ [0.70, 0.70, 0.70, 1.0],
    /* Color 240 */ [0.84, 0.84, 0.84, 1.0],
    /* Color 241 */ [0.87, 0.87, 0.87, 1.0],
    /* Color 242 */ [0.89, 0.90, 0.89, 1.0],
    /* Color 243 */ [0.92, 0.92, 0.92, 1.0],
    /* Color 244 */ [0.95, 0.95, 0.95, 1.0],
    /* Color 245 */ [0.97, 0.97, 0.97, 1.0],
    /* Color 246 */ [1.0, 0.98, 0.94, 1.0],
    /* Color 247 */ [0.63, 0.63, 0.64, 1.0],
    /* Color 248 */ [0.5, 0.5, 0.5, 1.0],
    /* Color 249 */ [1.0, 0.0, 0.0, 1.0],
    /* Color 250 */ [0.0, 1.0, 0.0, 1.0],
    /* Color 251 */ [1.0, 1.0, 0.0, 1.0],
    /* Color 252 */ [0.0, 0.0, 1.0, 1.0],
    /* Color 253 */ [1.0, 0.0, 1.0, 1.0],
    /* Color 254 */ [0.0, 1.0, 1.0, 1.0],
    /* Color 255 */ [1.0, 1.0, 1.0, 1.0],
];

/*
Names to the above
 */

const BLACK = lTextureColor(256, 0);
const DARK_RED = lTextureColor(256, 28);
const WHITE = lTextureColor(256, 255);
const GOLD = lTextureColor(256, 39);
const RED = lTextureColor(256, 49);
const CYAN = lTextureColor(256, 11);
const GREY_1 = lTextureColor(256, 248);
const GREY_2 = lTextureColor(256, 235);
const GREY_3 = lTextureColor(256, 234);
const GREY_4 = lTextureColor(256, 237);
const BLUE_1 = lTextureColor(256, 45);
const BLUE_2 = lTextureColor(256, 46);
const BLUE_3 = lTextureColor(256, 133);
const BLUE_4 = lTextureColor(256, 4);
const RED_3 = lTextureColor(256, 1);
const RED_4 = lTextureColor(256, 71);
const WHITE_2 = lTextureColor(256, 242);
const YELLOW_1 = lTextureColor(256, 37);
const YELLOW_2 = lTextureColor(256, 39);
const YELLOW_3 = lTextureColor(256, 89);
const YELLOW_4 = lTextureColor(256, 160);
const YELLOW_5 = lTextureColor(256, 251);
const YELLOW_6 = lTextureColor(256, 110);   // Internal yellow/orange
const GE_1 = lTextureColor(256, 76);
const GE_2 = lTextureColor(256, 77);
const GE_3 = lTextureColor(256, 122);
const GREEN_1 = lTextureColor(256, 2);
const GREEN_2 = lTextureColor(256, 17);
const GREEN_3 = lTextureColor(256, 86);
const GREEN_4 = lTextureColor(256, 108);    // Internal green
const DARK_GREEN = lTextureColor(256, 66);    // Dark green
const PINK_1 = lTextureColor(256, 183);
const PURPLE = lTextureColor(256, 5);       // Internal back

const BEZCIRCLE = 0.551915024494;

const EADDER = 0;
const EANACONDA = 1;
const EASP = 2;
const EBOA = 3;
const ECOBRA1 = 4;
const ECOBRA3 = 5;
const EFERDELANCE = 6;
const EGECKO = 7;
const EKRAIT = 8;
const EMAMBA = 9;
const EMORAY = 10;
const EPYTHON = 11;
const ESHUTTLE = 12;
const ETHARGON = 13;
const ETRANSPORTER = 14;
const EVIPER = 15;

const structures = {};

function missileDef()
{
    // No collision for missiles, things do not go into it, it goes into things
    var gdef = new LGroupDef({collision: LNONE});
    var struct = new LStructureDef(ShaderSimple, {colors: COLORS, collision: LNONE});

    struct.addCylinder({depth: 0.125, radius: 0.015, texturecontrol: GREY_3});

    struct.addTriangle({depth: 0.001, coords: [[0, 0.1], [0, 0], [0.0125, 0]], position: lFromXYZPYR(0.015, 0, 0.125, -LR90, 0, 0), texturecontrol: RED});
    struct.addTriangle({depth: 0.001, coords: [[0, 0], [0, 0.1], [-0.0125, 0]], position: lFromXYZPYR(-0.015, 0, 0.125, -LR90, 0, 0), texturecontrol: RED});
    struct.addTriangle({depth: 0.001, coords: [[0, 0.1], [0, 0], [0.0125, 0]], position: lFromXYZPYR(0, 0.015, 0.125, 0, -LR90, LR90), texturecontrol: RED});
    struct.addTriangle({depth: 0.001, coords: [[0, 0], [0, 0.1], [-0.0125, 0]], position: lFromXYZPYR(0, -0.015, 0.125, 0, -LR90, LR90), texturecontrol: RED});
    // struct.addTriangle({depth: 0.001, coords: [[0, 0], [0, 0.5], [0.0625, 0]], position: lFromXYZPYR(0, -0.075, -0.625, LR90, LR90, 0), texturecontrol: RED});

    var radius = 0.015;
    var anchor = 0.015 * BEZCIRCLE;

    var bpa1 = [
        [[-radius, 0, 0], [-radius, 0.0, anchor], [-anchor, 0.0, radius], [0, 0, radius]],
        [[0, -0.025, 0], [0, -0.025, 0], [0, -0.025, 0], [0, -0.025, 0]]
    ];
    var bpa2 = [
        [[0, 0, radius], [anchor, 0.0, radius], [radius, 0.0, anchor], [radius, 0, 0]],
        [[0, -0.025, 0], [0, -0.025, 0], [0, -0.025, 0], [0, -0.025, 0]]
    ];
    var bpa3 = [
        [[radius, 0, 0], [radius, 0.0, -anchor], [anchor, 0.0, -radius], [0, 0, -radius]],
        [[0, -0.025, 0], [0, -0.025, 0], [0, -0.025, 0], [0, -0.025, 0]]
    ];
    var bpa4 = [
        [[0, 0, -radius], [-anchor, 0.0, -radius], [-radius, 0.0, -anchor], [-radius, 0, 0]],
        [[0, -0.025, 0], [0, -0.025, 0], [0, -0.025, 0], [0, -0.025, 0]]
    ];

    struct.addBezierPatch({coords: bpa1, texturecontrol: RED, position: lFromXYZPYR(0, 0, -0.125, LR90, 0, 0)});
    struct.addBezierPatch({coords: bpa2, texturecontrol: RED, position: lFromXYZPYR(0, 0, -0.125, LR90, 0, 0)});
    struct.addBezierPatch({coords: bpa3, texturecontrol: RED, position: lFromXYZPYR(0, 0, -0.125, LR90, 0, 0)});
    struct.addBezierPatch({coords: bpa4, texturecontrol: RED, position: lFromXYZPYR(0, 0, -0.125, LR90, 0, 0)});


    return [gdef, struct];
    
}

class Missile extends MissileBase {
    constructor ()
    {
        super([1.0, 0.0, 0.0, 1.0]);    // Missiils deep red
    
        var struct = structures.missile;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
    
        this.obj.addChild(bobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
    
        this.bangsize = 1;
        this.alloys = 0;
        this.postinit();
    }
}

function stasidesDef()
{
    var sidestruct = new LStructureDef(ShaderSolid, {canvas: document.getElementById("canvasstasides"), collision: LNONE});
    // Internal
    let lleft = new LTextureControl([2, 8], [0, 7], [1, 1]);
    let lright = new LTextureControl([2, 8], [1, 7], [1, 1]);
    let ltop = new LTextureControl([2, 8], [0, 3], [1, 4]);
    let lbottom = new LTextureControl([2, 8], [1, 3], [1, 4]);

    sidestruct.addBlockPatch({size: [30, 8], position: lFromXYZPYR(24, 0, 0, 0, -LR90, 0), texturecontrol: lleft, corners: null});
    sidestruct.addBlockPatch({size: [30, 8], position: lFromXYZPYR(-24, 0, 0, 0, LR90, 0), texturecontrol: lright, corners: null});
    sidestruct.addBlockPatch({size: [24, 30], position: lFromXYZPYR(0, -8, 0, -LR90, 0, 0), texturecontrol: ltop, corners: null});
    sidestruct.addBlockPatch({size: [24, 30], position: lFromXYZPYR(0, 8, 0, LR90, 0, 0), texturecontrol: lbottom, corners: null});

    let ftop = new LTextureControl([2, 8], [1, 1], [1, 0.8]);
    let fbottom = new LTextureControl([2, 8], [1, 2.2], [1, 0.8]);

    let fpadl = new LTextureControl([2, 8], [1, 1.8], [5 / 12, 0.4]);
    let fpadr = new LTextureControl([2, 8], [19 / 12, 1.8], [5 / 12, 0.4]);

    let rear = new LTextureControl([2, 8], [0, 1], [1, 2]);

    sidestruct.addBlockPatch({size: [24, 3.2], position: lFromXYZPYR(0, -4.8, 30, 0, LR180, 0), texturecontrol: ftop, corners: null});
    sidestruct.addBlockPatch({size: [24, 3.2], position: lFromXYZPYR(0, 4.8, 30, 0, LR180, 0), texturecontrol: fbottom, corners: null});

    sidestruct.addBlockPatch({size: [10, 1.6], position: lFromXYZPYR(14, 0, 30, 0, LR180, 0), texturecontrol: fpadl, corners: null});
    sidestruct.addBlockPatch({size: [10, 1.6], position: lFromXYZPYR(-14, 0, 30, 0, LR180, 0), texturecontrol: fpadr, corners: null});

    sidestruct.addBlockPatch({size: [24, 8], position: lFromXYZPYR(0, 0, -30, 0, 0, 0), texturecontrol: rear, corners: null});

    return sidestruct;
}


function  corriolisDef()
{
    var gdef = new LGroupDef({collision: LSTATIC});
    var struct = new LStructureDef(ShaderSimple, {colors: COLORS, collision: LSTATIC});
    var istruct = new LStructureDef(ShaderSolid, {colors: COLORS, collision: LNONE});

    struct.useCorners([[-32, -32, -32], [32, 32, 32]], {});

    struct.addWTrianglePatch({coords: [[32.0, -32.0, 0.0], [32.0, 0.0, 32.0], [0.0, -32.0, 32.0]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[32.0, 0.0, 32.0], [32.0, 32.0, 0.0], [0.0, 32.0, 32.0]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 32.0, 32.0], [-32.0, 32.0, 0.0], [-32.0, 0.0, 32.0]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[-32.0, 0.0, 32.0], [-32.0, -32.0, 0.0], [0.0, -32.0, 32.0]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[32.0, -32.0, 0.0], [0.0, -32.0, 32.0], [-32.0, -32.0, 0.0]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[32.0, -32.0, 0.0], [-32.0, -32.0, 0.0], [0.0, -32.0, -32.0]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[32.0, 0.0, -32.0], [32.0, 32.0, 0.0], [32.0, 0.0, 32.0]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[32.0, 0.0, -32.0], [32.0, 0.0, 32.0], [32.0, -32.0, 0.0]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[-32.0, 0.0, -32.0], [-32.0, -32.0, 0.0], [-32.0, 0.0, 32.0]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[-32.0, 0.0, -32.0], [-32.0, 0.0, 32.0], [-32.0, 32.0, 0.0]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 32.0, 32.0], [32.0, 32.0, 0.0], [0.0, 32.0, -32.0]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 32.0, 32.0], [0.0, 32.0, -32.0], [-32.0, 32.0, 0.0]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -32.0, -32.0], [-32.0, -32.0, 0.0], [-32.0, 0.0, -32.0]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -32.0, -32.0], [32.0, 0.0, -32.0], [32.0, -32.0, 0.0]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 32.0, -32.0], [32.0, 32.0, 0.0], [32.0, 0.0, -32.0]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[-32.0, 0.0, -32.0], [-32.0, 32.0, 0.0], [0.0, 32.0, -32.0]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -32.0, -32.0], [-32.0, 0.0, -32.0], [0.0, 32.0, -32.0]], texturecontrol: GREY_1, corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -32.0, -32.0], [0.0, 32.0, -32.0], [32.0, 0.0, -32.0]], texturecontrol: GREY_1, corners: null});


    struct.addWTrianglePatch({coords: [[-30.4, 1.6, 32], [30.4, 1.6, 32], [0, 32.0, 32]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[30.4, -1.6, 32], [-30.4, -1.6, 32], [0, -32.0, 32]], texturecontrol: GREY_2, corners: null});

    struct.addWTrianglePatch({coords: [[-32, 0, 32], [-30.4, -1.6, 32], [-30.4, 1.6, 32]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[32, 0, 32], [30.4, 1.6, 32], [30.4, -1.6, 32]], texturecontrol: GREY_2, corners: null});

    struct.addPolygonPatch({coords: [[-25.4, 1.6], [-25.4, -1.6], [1, -1.6], [1, 1.6]], position: lFromXYZ(-5, 0, 32), texturecontrol: GREY_2, corners: null});
    struct.addPolygonPatch({coords: [[25.4, -1.6], [25.4, 1.6], [-1, 1.6], [-1, -1.6]], position: lFromXYZ(5, 0, 32), texturecontrol: GREY_2, corners: null});


    struct.addBlock({size: [4.0, 0.001, 1.5], position: lFromXYZ(0, 1.6, 31.5), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [4.0, 0.001, 1.5], position: lFromXYZ(0, -1.6, 31.5), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.001, 1.6, 1.5], position: lFromXYZ(-4.0, 0, 31.5), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.001, 1.6, 1.5], position: lFromXYZ(4.0, 0, 31.5), texturecontrol: GREY_1, corners: null});





    // Add traffic light holders
    struct.addBlock({size: [0.5195, 0.5195, 0.5], position: lFromXYZ(4.52, 2.12, 32.5), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.5], position: lFromXYZ(0, 2.12, 32.5), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.5], position: lFromXYZ(-4.52, 2.12, 32.5), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.5], position: lFromXYZ(4.52, -2.12, 32.5), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.5], position: lFromXYZ(0, -2.12, 32.5), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.5], position: lFromXYZ(-4.52, -2.12, 32.5), texturecontrol: GREY_1, corners: null});
    // Add traffic lights by having three different objects and changing visibility
    const redlight = new LStructureDef(ShaderSolid, {color: [1.0, 0.5, 0.5, 1.0], collision: LNONE});
    const yellowlight = new LStructureDef(ShaderSolid, {color: [1.0, 1.0, 0.0, 1.0], collision: LNONE});
    const greenlight = new LStructureDef(ShaderSolid, {color: [0.5, 1.0, 0.5, 1.0], collision: LNONE});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, -2.12, 33)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, 2.12, 33)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, -2.12, 33)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, 2.12, 33)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, -2.12, 33)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, 2.12, 33)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, -2.12, 33)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, 2.12, 33)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, -2.12, 33)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, 2.12, 33)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, -2.12, 33)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, 2.12, 33)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, -2.12, 33)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, 2.12, 33)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, -2.12, 33)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, 2.12, 33)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, -2.12, 33)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, 2.12, 33)});

    return  [gdef, struct, istruct, greenlight, yellowlight, redlight]

}
class Corriolis extends StationBase {
    constructor()
    {
        super(structures.corriolis, structures.stasides);
        this.launchpoint = 42;
        this.description = "Corriolis Station";
    }
}


function escapepodDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 1.1});
    var struct = new LStructureDef(ShaderSimple, {colors: COLORS, collision: LNONE, distance: 0.175});

    struct.addWTrianglePatch({coords: [[-0.175, 0.0, 0.0], [0.058, -0.117, 0.1], [0.058, 0.117, 0.1]], texturecontrol: RED});
    struct.addWTrianglePatch({coords: [[0.058, 0.0, -0.3], [-0.175, 0.0, 0.0], [0.058, 0.117, 0.1]], texturecontrol: DARK_RED});
    struct.addWTrianglePatch({coords: [[0.058, 0.0, -0.3], [0.058, -0.117, 0.1], [-0.175, 0.0, 0.0]], texturecontrol: RED_3});
    struct.addWTrianglePatch({coords: [[0.058, 0.0, -0.3], [0.058, 0.117, 0.1], [0.058, -0.117, 0.1]], texturecontrol: RED_4});

    return [gdef, struct]
}

class Escapepod extends EscapeBase {
    constructor()
    {
        super([0.8, 1.0, 0.3, 1.0]);
        this.description = "Escape Pod";
        var struct = structures.escapepod;
        this.obj = new LWObject(struct[0], this);
        this.iobj = new LObject(struct[1], this);
        this.bangsize = 1.0;
        this.alloys = 0;
        this.cargospill = 0;
        this.nummissiles = 0;
        this.what = EDB_T_SLAVES;
    
        this.obj.addChild(this.iobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function sidewinderDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 1.2});
    var struct = new LStructureDef(ShaderShip, {colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.0, 0.286, 0.5], [0.571, 0.0, -0.643], [-0.571, 0.0, -0.643]], texturecontrol: YELLOW_1});
    struct.addWTrianglePatch({coords: [[-0.0, 0.286, 0.5], [1.143, 0.0, 0.5], [0.571, 0.0, -0.643]], texturecontrol: GOLD});
    struct.addWTrianglePatch({coords: [[-1.143, 0.0, 0.5], [-0.0, 0.286, 0.5], [-0.571, 0.0, -0.643]], texturecontrol: GOLD});
    struct.addWTrianglePatch({coords: [[-1.143, 0.0, 0.5], [-0.0, -0.286, 0.5], [1.143, 0.0, 0.5]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-1.143, 0.0, 0.5], [1.143, 0.0, 0.5], [-0.0, 0.286, 0.5]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.0, -0.286, 0.5], [0.571, 0.0, -0.643], [1.143, 0.0, 0.5]], texturecontrol: YELLOW_1});
    struct.addWTrianglePatch({coords: [[-0.571, 0.0, -0.643], [0.571, 0.0, -0.643], [-0.0, -0.286, 0.5]], texturecontrol: GOLD});
    struct.addWTrianglePatch({coords: [[-1.143, 0.0, 0.5], [-0.571, 0.0, -0.643], [-0.0, -0.286, 0.5]], texturecontrol: YELLOW_1});
    solid.addWTriangle({depth: 0.001, coords: [[-0.214, -0.107, 0.5], [0.214, -0.107, 0.5], [0.214, 0.107, 0.5]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[-0.214, -0.107, 0.5], [0.214, 0.107, 0.5], [-0.214, 0.107, 0.5]], texturecontrol: RED});

    return  [gdef, struct, solid]
}

class Sidewinder extends JohnDoeBase {
    constructor()
    {
    // Width = -1.143 to 1.143,  Length = -0.643 to 0.5,   Width = 2.286, Length = 1.143, MP = -0.07150000000000001
    // Bottom: -0.286, CenterY 0.0, CenterZ -0.07150000000000001
    
        super();
        this.description = "Sidewinder";
        this.slotsize = SLOTSIZE_3_3;
        this.centerz = -0.0715;
        this.centery = 0.0;
        this.bottom = 0.291;
        var struct = structures.sidewinder;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        this.bangsize = 6;
        this.nummissiles = 2;
        this.alloys = 1;
        this.width = 1;
    
        this.cargospill = 1;

        this.acceleration = 6;
        this.maxvelocity = 17;
        this.accelroll = 1.2;
        this.accelpitch = 1.2;
        this.maxvelroll = 1.2;
        this.maxvelpitch = 1.2;

        this.shields = 80;
        this.maxshields = 80;
        this.integrity = 80;
        this.maxintegrity = 80;
        this.rechargerate = 0.8;


        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}


function cobra3Def()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 2.2});
    var struct = new LStructureDef(ShaderShip, {colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[0.571, 0.0, -1.357], [-0.571, 0.0, -1.357], [-0.0, 0.464, -0.429]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[1.571, 0.286, 0.714], [0.571, 0.0, -1.357], [-0.0, 0.464, -0.429]], texturecontrol: BLUE_1});
    struct.addWTrianglePatch({coords: [[-0.0, 0.464, -0.429], [-0.571, 0.0, -1.357], [-1.571, 0.286, 0.714]], texturecontrol: BLUE_1});
    struct.addWTrianglePatch({coords: [[2.143, -0.054, 0.143], [0.571, 0.0, -1.357], [1.571, 0.286, 0.714]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-1.571, 0.286, 0.714], [-0.571, 0.0, -1.357], [-2.143, -0.054, 0.143]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[1.571, 0.286, 0.714], [-0.0, 0.464, -0.429], [-0.0, 0.464, 0.714]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.0, 0.464, 0.714], [-0.0, 0.464, -0.429], [-1.571, 0.286, 0.714]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[2.286, -0.143, 0.714], [2.143, -0.054, 0.143], [1.571, 0.286, 0.714]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-1.571, 0.286, 0.714], [-2.143, -0.054, 0.143], [-2.286, -0.143, 0.714]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-1.571, 0.286, 0.714], [-2.286, -0.143, 0.714], [-0.571, -0.429, 0.714]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.571, 0.286, 0.714], [-0.571, -0.429, 0.714], [0.571, -0.429, 0.714]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.571, 0.286, 0.714], [0.571, -0.429, 0.714], [2.286, -0.143, 0.714]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.571, 0.286, 0.714], [2.286, -0.143, 0.714], [1.571, 0.286, 0.714]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.571, 0.286, 0.714], [1.571, 0.286, 0.714], [-0.0, 0.464, 0.714]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[0.571, -0.429, 0.714], [0.571, 0.0, -1.357], [2.143, -0.054, 0.143]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.571, -0.429, 0.714], [2.143, -0.054, 0.143], [2.286, -0.143, 0.714]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.571, -0.429, 0.714], [-0.571, -0.429, 0.714], [-0.571, 0.0, -1.357]], texturecontrol: DARK_RED});
    struct.addWTrianglePatch({coords: [[0.571, -0.429, 0.714], [-0.571, 0.0, -1.357], [0.571, 0.0, -1.357]], texturecontrol: DARK_RED});
    struct.addWTrianglePatch({coords: [[-2.286, -0.143, 0.714], [-2.143, -0.054, 0.143], [-0.571, 0.0, -1.357]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-2.286, -0.143, 0.714], [-0.571, 0.0, -1.357], [-0.571, -0.429, 0.714]], texturecontrol: GREY_3});

    solid.addWTriangle({depth: 0.001, coords: [[-0.143, -0.286, 0.714], [-0.143, 0.214, 0.714], [-0.643, 0.143, 0.714]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[-0.143, -0.286, 0.714], [-0.643, 0.143, 0.714], [-0.643, -0.214, 0.714]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[0.643, -0.214, 0.714], [0.643, 0.143, 0.714], [0.143, 0.214, 0.714]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[0.643, -0.214, 0.714], [0.143, 0.214, 0.714], [0.143, -0.286, 0.714]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[1.429, 0.107, 0.714], [1.429, -0.107, 0.714], [1.571, 0.0, 0.714]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[-1.429, -0.107, 0.714], [-1.429, 0.107, 0.714], [-1.571, 0.0, 0.714]], texturecontrol: RED});

    struct.addCylinder({depth: 0.4, radius: .01, position: lFromXYZ(0, 0, -1.757), texturecontrol: WHITE});

    return [gdef, struct, solid]
}

   
class Cobra3 extends JohnDoeBase {
    constructor()
    {
    // Width = -2.286 to 2.286,  Length = -1.357 to 0.714,   Width = 4.572, Length = 2.0709999999999997, MP = -0.3214999999999999
    // Bottom: -0.429, CenterY 0.017500000000000016, CenterZ -0.3214999999999999
    
    
        super();
        this.description = "Cobra Mk III";
        this.slotsize = SLOTSIZE_6_3;
        this.centerz = -0.3215;
        this.centery = 0.0175;
        this.bottom = 0.434;
        var struct = structures.cobra3;
        this.obj = new LWObject(struct[0], this);
        let bobj = new LObject(struct[1], this);
        let sobj = new LObject(struct[2], this);
    
        this.bangsize = 40;
        this.alloys = 2;
        this.width = 2;
    
        this.cargospill = 4;
        this.nummissiles = 4;

        this.acceleration = 5;
        this.maxvelocity = 20;
        this.accelroll = 1;
        this.accelpitch = 1;
        this.maxvelroll = 1;
        this.maxvelpitch = 1;

        this.shields = 100;
        this.maxshields = 100;
        this.integrity = 100;
        this.maxintegrity = 100;
        this.rechargerate = 1.0;


        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function alloyDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 1.0});
    var struct = new LStructureDef(ShaderSimple, {colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.21, -0.34, -0.14], [-0.21, 0.49, -0.14], [0.24,   0.4,   0.17]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.21, -0.34, -0.14], [0.24,  0.4,   0.17], [0.15,  -0.71,  0.09]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[0.15, -0.71,   0.09], [0.24,  0.4,   0.17], [-0.21,  0.49, -0.14]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.15, -0.71,   0.09], [-0.21, 0.49, -0.14], [-0.21, -0.34, -0.14]], texturecontrol: GREY_3});

    return [gdef, struct];
}
    
class Alloy extends FlotsamBase {
    constructor()
    {
        super([0.5, 1.0, 0.5, 1.0]);
        this.description = "Alloy Sheet";
        var struct = structures.alloy;
        this.obj = new LWObject(struct[0], this);
        this.iobj = new LObject(struct[1], this);
    
        this.bangsize = 1;
        this.alloys = 0;
    
        this.obj.addChild(this.iobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.what = EDB_T_ALLOYS;
        this.postinit();
        
    }
}


function cargoDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 1.0});
    var struct = new LStructureDef(ShaderSimple, {colors: COLORS, collision: LNONE});

    struct.addPolygon({depth: 0.125, coords: [[-0.025, 0.05], [-0.05, 0.025], [-0.05, -0.025], [-0.025, -0.05], [0.025, -0.05], [0.05, -0.025], [0.05, 0.025], [0.025, 0.05]],
        texturecontrols: [
            lTextureColor(256, 140),
            lTextureColor(256, 140),
            lTextureColor(256, 161),
            lTextureColor(256, 238),
            lTextureColor(256, 161),
            lTextureColor(256, 238),
            lTextureColor(256, 161),
            lTextureColor(256, 238),
            lTextureColor(256, 161),
            lTextureColor(256, 238),
        ]});


    return [gdef, struct];
}

class Cargo extends FlotsamBase {
    constructor()
    {
        super([0.5, 1.0, 0.5, 1.0]);
        this.description = "Cargo Canister";
        var struct = structures.cargo;
        this.obj = new LWObject(struct[0], this);
        this.iobj = new LObject(struct[1], this);
    
        this.bangsize = 1;
        this.alloys = 0;
    
        this.obj.addChild(this.iobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.what = -1;
        this.postinit();
    }
}

function boulderDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 3.6});
    var struct = new LStructureDef(ShaderSimple, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[1.64, 3.36, 1.0], [2.55, 3.09, 2.73], [-0.45, -0.91, -1.18]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[1.64, 3.36, 1.0], [-0.45, -0.91, -1.18], [-2.73, 0.64, -1.09]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[-2.73, 0.64, -1.09], [-0.45, -0.91, -1.18], [-2.55, -0.64, 1.09]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-2.55, -0.64, 1.09], [-0.45, -0.91, -1.18], [-0.18, 0.0, 3.55]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[-0.18, 0.0, 3.55], [-0.45, -0.91, -1.18], [2.55, 3.09, 2.73]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[-2.73, 0.64, -1.09], [-1.82, 1.55, 2.73], [1.64, 3.36, 1.0]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-2.55, -0.64, 1.09], [-1.82, 1.55, 2.73], [-2.73, 0.64, -1.09]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[-0.18, 0.0, 3.55], [-1.82, 1.55, 2.73], [-2.55, -0.64, 1.09]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[2.55, 3.09, 2.73], [-1.82, 1.55, 2.73], [-0.18, 0.0, 3.55]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-1.82, 1.55, 2.73], [2.55, 3.09, 2.73], [1.64, 3.36, 1.0]], texturecontrol: lTextureColor(256, 248)});


    return [gdef, struct];
}

class Boulder extends BoulderBase {
    constructor()
    {
        super([0.9, 1.0, 1.0, 1.0]);
        this.description = "Boulder";
        var struct = structures.boulder;
        this.obj = new LWObject(struct[0], this);
        this.iobj = new LObject(struct[1], this);
    
        this.alloys = 0;
    
        this.obj.addChild(this.iobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function asteroidDef()
{
    var gdef = new LGroupDef({collision: LSTATIC});
    var struct = new LStructureDef(ShaderSimple, {shininess: -1, colors: COLORS, collision: LNONE});
    gdef.useCorners([[-80, -80, -80], [80, 80, 80]], {});

    struct.addWTrianglePatch({coords: [[-50.0, 0.0, -60.0], [-0.0, 80.0, 0.0], [40.0, 0.0, -70.0]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-0.0, -80.0, 0.0], [-50.0, 0.0, -60.0], [40.0, 0.0, -70.0]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[40.0, 0.0, -70.0], [-0.0, 80.0, 0.0], [80.0, -10.0, 0.0]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-0.0, -80.0, 0.0], [40.0, 0.0, -70.0], [80.0, -10.0, 0.0]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-70.0, -40.0, 0.0], [-50.0, 0.0, -60.0], [-0.0, -80.0, 0.0]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-60.0, 50.0, 0.0], [-50.0, 0.0, -60.0], [-70.0, -40.0, 0.0]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[-0.0, 80.0, 0.0], [-50.0, 0.0, -60.0], [-60.0, 50.0, 0.0]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[80.0, -10.0, 0.0], [-0.0, 80.0, 0.0], [-0.0, 30.0, 75.0]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[80.0, -10.0, 0.0], [-0.0, 30.0, 75.0], [-0.0, -50.0, 60.0]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[-70.0, -40.0, 0.0], [-0.0, -50.0, 60.0], [-0.0, 30.0, 75.0]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[80.0, -10.0, 0.0], [-0.0, -50.0, 60.0], [-0.0, -80.0, 0.0]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-70.0, -40.0, 0.0], [-0.0, -80.0, 0.0], [-0.0, -50.0, 60.0]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-60.0, 50.0, 0.0], [-70.0, -40.0, 0.0], [-0.0, 30.0, 75.0]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-60.0, 50.0, 0.0], [-0.0, 30.0, 75.0], [-0.0, 80.0, 0.0]], texturecontrol: lTextureColor(256, 248), corners: null});


    return [gdef, struct];
}

class Asteroid extends AsteroidBase {
    constructor()
    {
        super([0.9, 1.0, 1.0, 1.0]);
        this.description = "Asteroid";
        var struct = structures.asteroid;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
    
        this.bangsize = -1;
        this.alloys = 0;
    
        this.obj.addChild(bobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}


function rockDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.3});
    var struct = new LStructureDef(ShaderSimple, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.086, 0.3, -0.05], [-0.079, -0.043, -0.014], [-0.0, 0.086, 0.071]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[0.171, -0.179, -0.114], [-0.079, -0.043, -0.014], [-0.086, 0.3, -0.05]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-0.086, 0.3, -0.05], [-0.0, 0.086, 0.071], [0.171, -0.179, -0.114]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[0.171, -0.179, -0.114], [-0.0, 0.086, 0.071], [-0.079, -0.043, -0.014]], texturecontrol: lTextureColor(256, 237)});

    return [gdef, struct];
}


class Rock extends FlotsamBase {
    constructor()
    {
        super([0.9, 1.0, 1.0, 1.0]);
        this.description = "Mineral Rock";
        var struct = structures.rock;
        this.obj = new LWObject(struct[0], this);
        this.iobj = new LObject(struct[1], this);
    
        this.obj.addChild(this.iobj, mat4.create());
        this.bangsize = 1;
        this.alloys = 0;
        lScene.lPlace(this.obj, mat4.create());
        this.what = EDB_T_MINERALS;
        this.postinit();
    }
}

function shuttleDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.7});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.0, -0.304, -0.411], [0.357, -0.357, 0.482], [-0.357, -0.357, 0.482]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[0.304, 0.0, -0.411], [0.357, -0.357, 0.482], [-0.0, -0.304, -0.411]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[0.304, 0.0, -0.411], [0.357, 0.357, 0.482], [0.357, -0.357, 0.482]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.0, 0.321, -0.411], [0.357, 0.357, 0.482], [0.304, 0.0, -0.411]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-0.0, 0.321, -0.411], [-0.357, 0.357, 0.482], [0.357, 0.357, 0.482]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.321, 0.0, -0.411], [-0.357, 0.357, 0.482], [-0.0, 0.321, -0.411]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-0.321, 0.0, -0.411], [-0.357, -0.357, 0.482], [-0.357, 0.357, 0.482]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.0, -0.304, -0.411], [-0.357, -0.357, 0.482], [-0.321, 0.0, -0.411]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-0.357, -0.357, 0.482], [0.357, -0.357, 0.482], [0.357, 0.357, 0.482]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-0.357, -0.357, 0.482], [0.357, 0.357, 0.482], [-0.357, 0.357, 0.482]], texturecontrol: GREY_3});
    solid.addWTriangle({depth: 0.001, coords: [[-0.0, 0.054, 0.482], [-0.089, 0.0, 0.482], [-0.0, -0.036, 0.482]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[-0.0, 0.054, 0.482], [-0.0, -0.036, 0.482], [0.089, 0.0, 0.482]], texturecontrol: RED});
    struct.addWTrianglePatch({coords: [[-0.0, -0.304, -0.411], [-0.0, -0.161, -0.625], [0.304, 0.0, -0.411]], texturecontrol: GREY_4});
    struct.addWTrianglePatch({coords: [[0.304, 0.0, -0.411], [-0.0, -0.161, -0.625], [-0.0, 0.321, -0.411]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.0, 0.321, -0.411], [-0.0, -0.161, -0.625], [-0.321, 0.0, -0.411]], texturecontrol: GREY_4});
    struct.addWTrianglePatch({coords: [[-0.321, 0.0, -0.411], [-0.0, -0.161, -0.625], [-0.0, -0.304, -0.411]], texturecontrol: GREY_1});
    struct.addWTriangle({depth: 0.001, coords: [[-0.071, 0.196, -0.446], [-0.054, -0.018, -0.554], [-0.196, 0.071, -0.446]], texturecontrol: BLUE_1});
    struct.addWTriangle({depth: 0.001, coords: [[0.179, 0.071, -0.446], [0.054, -0.018, -0.554], [0.054, 0.196, -0.446]], texturecontrol: BLUE_1});

    return [gdef, struct, solid];
}


class Shuttle extends JohnDoeBase {
    constructor()
    {
    // Width = -0.357 to 0.357,  Length = -0.625 to 0.482,   Width = 0.714, Length = 1.107, MP = -0.07150000000000001
    // Bottom: -0.357, CenterY 0.0, CenterZ -0.07150000000000001
    
    
        super();
        this.description = "Shuttle";
        this.slotsize = SLOTSIZE_2_2;
        this.centerz = -0.0715
        this.centery = 0.0;
        this.bottom = 0.362;
        this.bangsize = 2;
        this.alloys = 1;
        var struct = structures.shuttle;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        this.cargospill = 2;
        this.nummissiles = 0;
        this.width = 0.3;
    
        this.acceleration = 3;
        this.maxvelocity = 15;
        this.accelroll = 1;
        this.accelpitch = 1;
        this.maxvelroll = 1;
        this.maxvelpitch = 1;

        this.shields = 60;
        this.maxshields = 60;
        this.integrity = 60;
        this.maxintegrity = 60;
        this.rechargerate = 0.6;

        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function transporterDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 1.2});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-1.036, -0.107, 0.929], [-0.929, -0.286, 0.929], [0.893, -0.286, 0.929]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[-1.036, -0.107, 0.929], [0.893, -0.286, 0.929], [1.0, -0.107, 0.929]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[-1.036, -0.107, 0.929], [1.0, -0.107, 0.929], [0.893, 0.143, 0.929]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[-1.036, -0.107, 0.929], [0.893, 0.143, 0.929], [-0.0, 0.357, 0.929]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[-1.036, -0.107, 0.929], [-0.0, 0.357, 0.929], [-0.929, 0.143, 0.929]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[1.179, -0.286, -0.429], [1.071, -0.036, -0.429], [0.893, 0.143, 0.929]], texturecontrol: lTextureColor(256, 45)});
    struct.addWTrianglePatch({coords: [[1.179, -0.286, -0.429], [0.893, 0.143, 0.929], [1.0, -0.107, 0.929]], texturecontrol: lTextureColor(256, 45)});
    struct.addWTrianglePatch({coords: [[0.893, -0.286, 0.929], [1.179, -0.286, -0.429], [1.0, -0.107, 0.929]], texturecontrol: lTextureColor(256, 46)});
    struct.addWTrianglePatch({coords: [[-0.5, -0.286, -1.071], [0.464, -0.286, -1.071], [1.179, -0.286, -0.429]], texturecontrol: lTextureColor(256, 4)});
    struct.addWTrianglePatch({coords: [[-0.5, -0.286, -1.071], [1.179, -0.286, -0.429], [0.893, -0.286, 0.929]], texturecontrol: lTextureColor(256, 4)});
    struct.addWTrianglePatch({coords: [[-0.5, -0.286, -1.071], [0.893, -0.286, 0.929], [-0.929, -0.286, 0.929]], texturecontrol: lTextureColor(256, 4)});
    struct.addWTrianglePatch({coords: [[-0.5, -0.286, -1.071], [-0.929, -0.286, 0.929], [-1.179, -0.286, -0.429]], texturecontrol: lTextureColor(256, 4)});
    struct.addWTrianglePatch({coords: [[-1.036, -0.107, 0.929], [-1.179, -0.286, -0.429], [-0.929, -0.286, 0.929]], texturecontrol: lTextureColor(256, 46)});
    struct.addWTrianglePatch({coords: [[-1.071, -0.036, -0.429], [-1.179, -0.286, -0.429], [-1.036, -0.107, 0.929]], texturecontrol: lTextureColor(256, 45)});
    struct.addWTrianglePatch({coords: [[-1.071, -0.036, -0.429], [-1.036, -0.107, 0.929], [-0.929, 0.143, 0.929]], texturecontrol: lTextureColor(256, 45)});
    struct.addWTrianglePatch({coords: [[-0.929, 0.143, 0.929], [-0.0, 0.357, 0.929], [-0.0, 0.214, -0.429]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[-0.929, 0.143, 0.929], [-0.0, 0.214, -0.429], [-1.071, -0.036, -0.429]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[1.071, -0.036, -0.429], [-0.0, 0.214, -0.429], [-0.0, 0.357, 0.929]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[1.071, -0.036, -0.429], [-0.0, 0.357, 0.929], [0.893, 0.143, 0.929]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[0.464, -0.286, -1.071], [0.393, -0.071, -1.071], [1.071, -0.036, -0.429]], texturecontrol: lTextureColor(256, 45)});
    struct.addWTrianglePatch({coords: [[0.464, -0.286, -1.071], [1.071, -0.036, -0.429], [1.179, -0.286, -0.429]], texturecontrol: lTextureColor(256, 45)});
    struct.addWTrianglePatch({coords: [[-0.393, -0.071, -1.071], [-0.5, -0.286, -1.071], [-1.179, -0.286, -0.429]], texturecontrol: lTextureColor(256, 45)});
    struct.addWTrianglePatch({coords: [[-0.393, -0.071, -1.071], [-1.179, -0.286, -0.429], [-1.071, -0.036, -0.429]], texturecontrol: lTextureColor(256, 45)});
    struct.addWTrianglePatch({coords: [[1.071, -0.036, -0.429], [0.393, -0.071, -1.071], [-0.0, 0.214, -0.429]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[-0.0, 0.214, -0.429], [-0.393, -0.071, -1.071], [-1.071, -0.036, -0.429]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-0.0, 0.214, -0.429], [0.393, -0.071, -1.071], [-0.393, -0.071, -1.071]], texturecontrol: lTextureColor(256, 237)});
    struct.addWTrianglePatch({coords: [[-0.393, -0.071, -1.071], [0.393, -0.071, -1.071], [0.464, -0.286, -1.071]], texturecontrol: lTextureColor(256, 242)});
    struct.addWTrianglePatch({coords: [[-0.393, -0.071, -1.071], [0.464, -0.286, -1.071], [-0.5, -0.286, -1.071]], texturecontrol: lTextureColor(256, 242)});
    solid.addWTriangle({depth: 0.001, coords: [[-0.321, 0.107, 0.929], [-0.464, -0.107, 0.929], [0.464, -0.107, 0.929]], texturecontrol: lTextureColor(256, 28)});
    solid.addWTriangle({depth: 0.001, coords: [[-0.321, 0.107, 0.929], [0.464, -0.107, 0.929], [0.286, 0.107, 0.929]], texturecontrol: lTextureColor(256, 28)});

    return [gdef, struct, solid];
}


class Transporter extends JohnDoeBase {
    constructor()
    {
    // Width = -1.179 to 1.179,  Length = -1.071 to 0.929,   Width = 2.358, Length = 2.0, MP = -0.07099999999999995
    // Bottom: -0.286, CenterY 0.035499999999999976, CenterZ -0.07099999999999995
    
    
        super();
        this.description = "Transporter";
        this.slotsize = SLOTSIZE_3_3;
        this.centerz = -0.0701;
        this.centery = 0.03455;
        this.bottom = 0.291;
        var struct = structures.transporter;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        this.cargospill = 5;
        this.nummissiles = 0;
        this.width = 1;
    
        this.bangsize = 3;
        this.alloys = 2;

        this.acceleration = 3;
        this.maxvelocity = 15;
        this.accelroll = 1;
        this.accelpitch = 1;
        this.maxvelroll = 1;
        this.maxvelpitch = 1;
    
        this.shields = 60;
        this.maxshields = 60;
        this.integrity = 60;
        this.maxintegrity = 60;
        this.rechargerate = 0.6;

        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function pythonDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 5});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.0, 0.0, -7.226], [-0.0, 1.548, -1.548], [3.097, 0.0, 0.516]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-3.097, 0.0, 0.516], [-0.0, 1.548, -1.548], [-0.0, 0.0, -7.226]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.0, 0.0, -7.226], [3.097, 0.0, 0.516], [-0.0, -1.548, -1.548]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.0, -1.548, -1.548], [-3.097, 0.0, 0.516], [-0.0, 0.0, -7.226]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[3.097, 0.0, 0.516], [-0.0, 1.548, -1.548], [-0.0, 1.548, 1.032]], texturecontrol: YELLOW_1});
    struct.addWTrianglePatch({coords: [[-0.0, 1.548, 1.032], [-0.0, 1.548, -1.548], [-3.097, 0.0, 0.516]], texturecontrol: GOLD});
    struct.addWTrianglePatch({coords: [[3.097, 0.0, 0.516], [-0.0, -1.548, 1.032], [-0.0, -1.548, -1.548]], texturecontrol: GOLD});
    struct.addWTrianglePatch({coords: [[-0.0, -1.548, -1.548], [-0.0, -1.548, 1.032], [-3.097, 0.0, 0.516]], texturecontrol: YELLOW_1});
    struct.addWTrianglePatch({coords: [[3.097, 0.0, 0.516], [-0.0, 1.548, 1.032], [-0.0, 0.774, 3.613]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[3.097, 0.0, 0.516], [-0.0, 0.774, 3.613], [1.548, 0.0, 3.613]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-3.097, 0.0, 0.516], [-1.548, 0.0, 3.613], [-0.0, 0.774, 3.613]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-3.097, 0.0, 0.516], [-0.0, 0.774, 3.613], [-0.0, 1.548, 1.032]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-3.097, 0.0, 0.516], [-0.0, -1.548, 1.032], [-0.0, -0.774, 3.613]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-3.097, 0.0, 0.516], [-0.0, -0.774, 3.613], [-1.548, 0.0, 3.613]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[3.097, 0.0, 0.516], [1.548, 0.0, 3.613], [-0.0, -0.774, 3.613]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[3.097, 0.0, 0.516], [-0.0, -0.774, 3.613], [-0.0, -1.548, 1.032]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.0, -0.774, 3.613], [1.548, 0.0, 3.613], [-0.0, 0.774, 3.613]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-0.0, -0.774, 3.613], [-0.0, 0.774, 3.613], [-1.548, 0.0, 3.613]], texturecontrol: GREY_3});

    solid.addPolygon({depth: 0.001, coords: [[-1.2, 0], [0, -0.55], [1.2, 0], [0, 0.55]], position: lFromXYZ(0, 0, 3.613), texturecontrol: RED, hold: [LI_FRONT]});


    return [gdef, struct, solid];
}


class Python extends JohnDoeBase {
    constructor()
    {
    // Width = -3.097 to 3.097,  Length = -7.226 to 3.613,   Width = 6.194, Length = 10.839, MP = -1.8065000000000002
    // Bottom: -1.548, CenterY 0.0, CenterZ -1.8065000000000002
    
        super();
        this.description = "Python";
        this.slotsize = SLOTSIZE_8_15;
        this.centerz = -1.0865
        this.centery = 0.0;
        this.bottom = 1.53;
        this.bangsize = 150;
        this.alloys = 3;
        var struct = structures.python;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        this.nummissiles = 6;

        this.width = 2.5;
    
        this.cargospill = 6;

        this.acceleration = 4;
        this.maxvelocity = 17;
        this.accelroll = 0.8;
        this.accelpitch = 0.8;
        this.maxvelroll = 0.8;
        this.maxvelpitch = 0.8;
    
        this.shields = 120;
        this.maxshields = 120;
        this.integrity = 120;
        this.maxintegrity = 120;
        this.rechargerate = 1.0;

        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function boaDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 7});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.812, -0.268, 6.688], [-0.0, 0.208, 6.688], [-0.0, 1.19, 5.438]], texturecontrol: BLUE_4, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-0.812, -0.268, 6.688], [-0.0, 1.19, 5.438], [-2.375, 1.19, 3.688]], texturecontrol: BLUE_4, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-0.812, -0.268, 6.688], [-2.375, 1.19, 3.688], [-3.875, 0.0, 4.188]], texturecontrol: BLUE_4, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-0.812, -0.268, 6.688], [-3.875, 0.0, 4.188], [-2.375, -0.744, 6.188]], texturecontrol: BLUE_4, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[0.812, -0.268, 6.688], [-0.812, -0.268, 6.688], [-2.375, -0.744, 6.188]], texturecontrol: BLUE_2, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[0.812, -0.268, 6.688], [-2.375, -0.744, 6.188], [-1.5, -1.935, 4.938]], texturecontrol: BLUE_2, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[0.812, -0.268, 6.688], [-1.5, -1.935, 4.938], [1.5, -1.935, 4.938]], texturecontrol: BLUE_2, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[0.812, -0.268, 6.688], [1.5, -1.935, 4.938], [2.375, -0.744, 6.188]], texturecontrol: BLUE_2, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[2.375, -0.744, 6.188], [3.875, 0.0, 4.188], [2.375, 1.19, 3.688]], texturecontrol: BLUE_3, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[2.375, -0.744, 6.188], [2.375, 1.19, 3.688], [-0.0, 1.19, 5.438]], texturecontrol: BLUE_3, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[2.375, -0.744, 6.188], [-0.0, 1.19, 5.438], [-0.0, 0.208, 6.688]], texturecontrol: BLUE_3, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[2.375, -0.744, 6.188], [-0.0, 0.208, 6.688], [0.812, -0.268, 6.688]], texturecontrol: BLUE_3, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-2.375, 1.19, 3.688], [-0.0, 1.19, 5.438], [2.375, 1.19, 3.688]], texturecontrol: BLUE_4, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-1.5, -1.935, 4.938], [-2.375, -0.744, 6.188], [-3.875, 0.0, 4.188]], texturecontrol: BLUE_2, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[2.375, -0.744, 6.188], [1.5, -1.935, 4.938], [3.875, 0.0, 4.188]], texturecontrol: BLUE_3, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-2.375, 1.19, 3.688], [2.375, 1.19, 3.688], [-0.0, 0.0, -5.812]], texturecontrol: GREY_1, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[3.875, 0.0, 4.188], [1.5, -1.935, 4.938], [-0.0, 0.0, -5.812]], texturecontrol: GREY_1, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-1.5, -1.935, 4.938], [-3.875, 0.0, 4.188], [-0.0, 0.0, -5.812]], texturecontrol: GREY_1, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-0.0, 0.0, -5.812], [2.375, 1.19, 3.688], [3.875, 0.0, 4.188]], texturecontrol: GREY_2, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-0.0, 0.0, -5.812], [1.5, -1.935, 4.938], [-1.5, -1.935, 4.938]], texturecontrol: GREY_2, position: lFromXYZ(0, 0.3725, 0)});
    struct.addWTrianglePatch({coords: [[-0.0, 0.0, -5.812], [-3.875, 0.0, 4.188], [-2.375, 1.19, 3.688]], texturecontrol: GREY_2, position: lFromXYZ(0, 0.3725, 0)});
    solid.addWTrianglePatch({coords: [[0.812, -0.268, 6.688], [-0.0, 0.208, 6.688], [-0.812, -0.268, 6.688]], texturecontrol: RED, position: lFromXYZ(0, 0.3725, 0)});
    return [gdef, struct, solid];
}

class Boa extends JohnDoeBase {
    constructor()
    {
    // Bottom: -1.935, CenterY -0.37250000000000005, CenterZ 0.4379999999999997
    
        super();
        this.description = "Boa";
        this.slotsize = SLOTSIZE_8_15;
        this.centerz = -0.438;
        this.bottom = 1.5675;
        this.centery = -0.3725;
        var struct = structures.boa;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        this.width = 3.3;

        this.nummissiles = 8;
    
        this.acceleration = 4;
        this.maxvelocity = 16;
        this.accelroll = 0.7;
        this.accelpitch = 0.7;
        this.maxvelroll = 0.7;
        this.maxvelpitch = 0.7;

        this.shields = 130;
        this.maxshields = 130;
        this.integrity = 130;
        this.maxintegrity = 130;
        this.rechargerate = 1.0;


        this.bangsize = 300;
        this.cargospill = 6;
        this.alloys = 3;
    
        this.fighters = [];
    
        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function anacondaDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 10});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-1.182, -1.495, 0.136], [1.182, -1.495, 0.136], [1.955, -0.414, 1.682]], texturecontrol: GREEN_1, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-1.182, -1.495, 0.136], [1.955, -0.414, 1.682], [-0.0, 0.223, 2.636]], texturecontrol: GREEN_1, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-1.182, -1.495, 0.136], [-0.0, 0.223, 2.636], [-1.955, -0.414, 1.682]], texturecontrol: GREEN_1, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[3.136, 0.477, 0.682], [1.955, 1.686, 1.045], [-0.0, 1.527, 2.227]], texturecontrol: GREEN_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[3.136, 0.477, 0.682], [-0.0, 1.527, 2.227], [-0.0, 0.223, 2.636]], texturecontrol: GREEN_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[3.136, 0.477, 0.682], [-0.0, 0.223, 2.636], [1.955, -0.414, 1.682]], texturecontrol: GREEN_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[1.955, -1.241, -1.818], [3.136, -0.032, -1.455], [3.136, 0.477, 0.682]], texturecontrol: GREEN_3, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[1.955, -1.241, -1.818], [3.136, 0.477, 0.682], [1.955, -0.414, 1.682]], texturecontrol: GREEN_3, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[1.955, -1.241, -1.818], [1.955, -0.414, 1.682], [1.182, -1.495, 0.136]], texturecontrol: GREEN_3, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-1.955, -1.241, -1.818], [-0.0, 0.0, -11.545], [1.955, -1.241, -1.818]], texturecontrol: GREY_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-1.955, -1.241, -1.818], [1.955, -1.241, -1.818], [1.182, -1.495, 0.136]], texturecontrol: GREY_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-1.955, -1.241, -1.818], [1.182, -1.495, 0.136], [-1.182, -1.495, 0.136]], texturecontrol: GREY_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-3.136, 0.477, 0.682], [-3.136, -0.032, -1.455], [-1.955, -1.241, -1.818]], texturecontrol: GREEN_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-3.136, 0.477, 0.682], [-1.955, -1.241, -1.818], [-1.182, -1.495, 0.136]], texturecontrol: GREEN_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-3.136, 0.477, 0.682], [-1.182, -1.495, 0.136], [-1.955, -0.414, 1.682]], texturecontrol: GREEN_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-3.136, 0.477, 0.682], [-1.955, -0.414, 1.682], [-0.0, 0.223, 2.636]], texturecontrol: GREEN_3, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-3.136, 0.477, 0.682], [-0.0, 0.223, 2.636], [-0.0, 1.527, 2.227]], texturecontrol: GREEN_3, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-3.136, 0.477, 0.682], [-0.0, 1.527, 2.227], [-1.955, 1.686, 1.045]], texturecontrol: GREEN_3, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[1.955, 1.686, 1.045], [-1.955, 1.686, 1.045], [-0.0, 1.527, 2.227]], texturecontrol: GREEN_1, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[1.955, 1.686, 1.045], [3.136, 0.477, 0.682], [3.136, -0.032, -1.455]], texturecontrol: GREY_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[1.955, 1.686, 1.045], [3.136, -0.032, -1.455], [-0.0, 0.0, -11.545]], texturecontrol: GREY_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[1.955, -1.241, -1.818], [-0.0, 0.0, -11.545], [3.136, -0.032, -1.455]], texturecontrol: GREY_1, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-1.955, -1.241, -1.818], [-3.136, -0.032, -1.455], [-0.0, 0.0, -11.545]], texturecontrol: GREY_1, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-3.136, 0.477, 0.682], [-1.955, 1.686, 1.045], [-0.0, 0.0, -11.545]], texturecontrol: GREY_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[-3.136, 0.477, 0.682], [-0.0, 0.0, -11.545], [-3.136, -0.032, -1.455]], texturecontrol: GREY_2, corners: null, position: lFromXYZ(0, -0.0955, 0)});
    struct.addWTrianglePatch({coords: [[1.955, 1.686, 1.045], [-0.0, 0.0, -11.545], [-1.955, 1.686, 1.045]], texturecontrol: GREY_1, corners: null, position: lFromXYZ(0, -0.0955, 0)});

    struct.addTriangle({depth: 1, coords: [[0, 0.261], [-0.6, -0.261], [0.6, -0.261]], position: lFromXYZ(0, -0.3765, 1.636), texturecontrols: [null, null, GREEN_1, GREEN_1, GREEN_1] })  // x orig is .219
    struct.addTriangle({depth: 1, coords: [[0, 0.261], [-0.6, -0.261], [0.6, -0.261]], position: lFromXYZPYR(0.43, 0.3735, 1.636, 0, 0, LR360 * .35), texturecontrols: [null, null, GREEN_2, GREEN_2, GREEN_2] })  // x orig is .219
    struct.addTriangle({depth: 1, coords: [[0, 0.261], [-0.6, -0.261], [0.6, -0.261]], position: lFromXYZPYR(-0.43, 0.3735, 1.636, 0, 0, -LR360 * .35), texturecontrols: [null, null, GREEN_2, GREEN_2, GREEN_2] })  // x orig is .219

    solid.addTriangle({depth: 1, coords: [[0, 0.261], [-0.6, -0.261], [0.6, -0.261]], position: lFromXYZ(0, -0.3765, 1.636), texturecontrols: [RED, null, null, null, null] })  // x orig is .219
    solid.addTriangle({depth: 1, coords: [[0, 0.261], [-0.6, -0.261], [0.6, -0.261]], position: lFromXYZPYR(0.43, 0.3735, 1.636, 0, 0, LR360 * .35), texturecontrols: [RED, null, null, null, null] })  // x orig is .219
    solid.addTriangle({depth: 1, coords: [[0, 0.261], [-0.6, -0.261], [0.6, -0.261]], position: lFromXYZPYR(-0.43, 0.3735, 1.636, 0, 0, -LR360 * .35), texturecontrols: [RED, null, null, null, null] })  // x orig is .219

    return [gdef, struct, solid];
}

class Anaconda extends JohnDoeBase {
    constructor()
    {
        // Width = -3.136 to 3.136,  Length = -11.545 to 2.636,   Width = 6.272, Length = 14.181000000000001, MP = -4.4545
        // Bottom: -2.136, CenterY 0.13649999999999984, CenterZ -4.4545
    
        super();
        this.description = "Anaconda";
        this.slotsize = SLOTSIZE_8_15;
        this.centerz = -4.4545;
        this.centery = 0.0955;
        this.bottom = 1.5955;
        var struct = structures.anaconda;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        this.fighters = [];
        this.nummissiles = 7;
        this.width = 2.5;
    
        this.acceleration = 3.5;
        this.maxvelocity = 18;
        this.accelroll = 0.85;
        this.accelpitch = 0.85;
        this.maxvelroll = 0.85;
        this.maxvelpitch = 0.85;

        this.shields = 125;
        this.maxshields = 125;
        this.integrity = 125;
        this.maxintegrity = 125;
        this.rechargerate = 1.0;

        this.bangsize = 250;
        this.cargospill = 6;
        this.alloys = 3;
    
        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function hermitDef()
{
    var gdef = new LGroupDef({collision: LSTATIC});
    var struct = new LStructureDef(ShaderSimple, {shininess: -1, colors: COLORS, collision: LNONE});

    gdef.useCorners([[-80, -80, -80], [80, 80, 80]], {});

    struct.addWTrianglePatch({coords: [[-50.0, 0.0, -60.0], [-0.0, 80.0, 0.0], [40.0, 0.0, -70.0]], texturecontrol: lTextureColor(256, 183)});
    struct.addWTrianglePatch({coords: [[-0.0, -80.0, 0.0], [-50.0, 0.0, -60.0], [40.0, 0.0, -70.0]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[40.0, 0.0, -70.0], [-0.0, 80.0, 0.0], [80.0, -10.0, 0.0]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-0.0, -80.0, 0.0], [40.0, 0.0, -70.0], [80.0, -10.0, 0.0]], texturecontrol: lTextureColor(256, 183)});
    struct.addWTrianglePatch({coords: [[-70.0, -40.0, 0.0], [-50.0, 0.0, -60.0], [-0.0, -80.0, 0.0]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-60.0, 50.0, 0.0], [-50.0, 0.0, -60.0], [-70.0, -40.0, 0.0]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[-0.0, 80.0, 0.0], [-50.0, 0.0, -60.0], [-60.0, 50.0, 0.0]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[80.0, -10.0, 0.0], [-0.0, 80.0, 0.0], [-0.0, 30.0, 75.0]], texturecontrol: lTextureColor(256, 183)});
    struct.addWTrianglePatch({coords: [[80.0, -10.0, 0.0], [-0.0, 30.0, 75.0], [-0.0, -50.0, 60.0]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[-70.0, -40.0, 0.0], [-0.0, -50.0, 60.0], [-0.0, 30.0, 75.0]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[80.0, -10.0, 0.0], [-0.0, -50.0, 60.0], [-0.0, -80.0, 0.0]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-70.0, -40.0, 0.0], [-0.0, -80.0, 0.0], [-0.0, -50.0, 60.0]], texturecontrol: lTextureColor(256, 183)});
    struct.addWTrianglePatch({coords: [[-60.0, 50.0, 0.0], [-70.0, -40.0, 0.0], [-0.0, 30.0, 75.0]], texturecontrol: lTextureColor(256, 183)});
    struct.addWTrianglePatch({coords: [[-60.0, 50.0, 0.0], [-0.0, 30.0, 75.0], [-0.0, 80.0, 0.0]], texturecontrol: lTextureColor(256, 248)});

    return [gdef, struct];
}

class Hermit extends AsteroidBase {
    constructor()
    {
        super([0.9, 1.0, 1.0, 1.0]);
        this.description = "Hermit Asteroid";
        var struct = structures.hermit;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
    
        this.obj.addChild(bobj, mat4.create());
        this.bangsize = -1;
        this.alloys = 0;
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function viperDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 1.1});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE, distance: 0.9});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE, distance: 0.9});

    struct.addWTrianglePatch({coords: [[-0.429, 0.286, 0.429], [0.429, 0.286, 0.429], [-0.0, 0.286, -0.429]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[0.429, 0.286, 0.429], [0.857, 0.0, 0.429], [-0.0, 0.0, -1.286]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[0.429, 0.286, 0.429], [-0.0, 0.0, -1.286], [-0.0, 0.286, -0.429]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-0.857, 0.0, 0.429], [-0.429, 0.286, 0.429], [-0.0, 0.286, -0.429]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-0.857, 0.0, 0.429], [-0.0, 0.286, -0.429], [-0.0, 0.0, -1.286]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-0.0, -0.286, -0.429], [-0.0, 0.0, -1.286], [0.857, 0.0, 0.429]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-0.0, -0.286, -0.429], [0.857, 0.0, 0.429], [0.429, -0.286, 0.429]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-0.0, 0.0, -1.286], [-0.0, -0.286, -0.429], [-0.429, -0.286, 0.429]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-0.0, 0.0, -1.286], [-0.429, -0.286, 0.429], [-0.857, 0.0, 0.429]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-0.0, -0.286, -0.429], [0.429, -0.286, 0.429], [-0.429, -0.286, 0.429]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[0.857, 0.0, 0.429], [0.429, 0.286, 0.429], [-0.429, 0.286, 0.429]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[0.857, 0.0, 0.429], [-0.429, 0.286, 0.429], [-0.857, 0.0, 0.429]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[0.857, 0.0, 0.429], [-0.857, 0.0, 0.429], [-0.429, -0.286, 0.429]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[0.857, 0.0, 0.429], [-0.429, -0.286, 0.429], [0.429, -0.286, 0.429]], texturecontrol: GREY_1});
    solid.addWTriangle({depth: 0.001, coords: [[0.143, 0.143, 0.429], [0.143, -0.143, 0.429], [0.571, 0.0, 0.429]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[-0.571, 0.0, 0.429], [-0.143, -0.143, 0.429], [-0.143, 0.143, 0.429]], texturecontrol: RED});


    return [gdef, struct, solid];
}

class Viper extends PoliceBase {
    constructor()
    {
    // Width = -0.857 to 0.857,  Length = -1.286 to 0.429,   Width = 1.714, Length = 1.715, MP = -0.42850000000000005
    // Bottom: -0.286, CenterY 0.0, CenterZ -0.42850000000000005
    
    
        super();
        this.description = "Viper";
        this.slotsize = SLOTSIZE_2_2;
        this.centerz = -0.4285;
        this.centery = 0.0;
        this.bottom = 0.291;
        var struct = structures.viper;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        
        this.bangsize = 4;
        this.cargospill = 0;
        this.alloys = 1;
        this.nummissiles = 6;
    
        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function mambaDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 3.2});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[3.2, -0.4, 1.6], [-3.2, -0.4, 1.6], [-0.0, 0.0, -3.2]], texturecontrol: GREEN_1});
    struct.addWTrianglePatch({coords: [[1.6, 0.4, 1.6], [-0.0, 0.0, -3.2], [-1.6, 0.4, 1.6]], texturecontrol: GREEN_3});
    struct.addWTrianglePatch({coords: [[3.2, -0.4, 1.6], [-0.0, 0.0, -3.2], [1.6, 0.4, 1.6]], texturecontrol: GREEN_2});
    struct.addWTrianglePatch({coords: [[-1.6, 0.4, 1.6], [-0.0, 0.0, -3.2], [-3.2, -0.4, 1.6]], texturecontrol: GREEN_2});
    struct.addWTrianglePatch({coords: [[3.2, -0.4, 1.6], [1.6, 0.4, 1.6], [-1.6, 0.4, 1.6]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[3.2, -0.4, 1.6], [-1.6, 0.4, 1.6], [-3.2, -0.4, 1.6]], texturecontrol: GREY_1});

    struct.addWTriangle({depth: 0.001, coords: [[1.2, -0.35, 1.0], [0.8, -0.35, 1.0], [1.0, -0.2, -0.8]], texturecontrol: BLUE_1});
    struct.addWTriangle({depth: 0.001, coords: [[-0.4, -0.2, 1.6], [0.4, -0.2, 1.6], [0.4, 0.2, 1.6]], texturecontrol: RED});
    struct.addWTriangle({depth: 0.001, coords: [[-0.4, -0.2, 1.6], [0.4, 0.2, 1.6], [-0.4, 0.2, 1.6]], texturecontrol: RED});

    struct.addWTriangle({depth: 0.001, coords: [[-0.4, 0.15, -1.4], [-0.2, 0.2, -0.8], [0.2, 0.2, -0.8]], texturecontrol: BLUE_2});
    struct.addWTriangle({depth: 0.001, coords: [[-0.4, 0.15, -1.4], [0.2, 0.2, -0.8], [0.4, 0.15, -1.4]], texturecontrol: BLUE_2});
    struct.addWTriangle({depth: 0.001, coords: [[-0.8, -0.35, 1.0], [-1.2, -0.35, 1.0], [-1.0, -0.2, -0.8]], texturecontrol: BLUE_1});
    solid.addWTriangle({depth: 0.001, coords: [[-1.6, 0.2, 1.6], [-1.9, 0.0, 1.6], [-1.8, -0.2, 1.6]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[1.8, -0.2, 1.6], [1.9, 0.0, 1.6], [1.6, 0.2, 1.6]], texturecontrol: RED});


    return [gdef, struct, solid];
}

class Mamba extends JohnDoeBase {
    constructor()
    {
    // Width = -3.2 to 3.2,  Length = -3.2 to 1.6,   Width = 6.4, Length = 4.800000000000001, MP = -0.8000000000000003
    // Bottom: -0.4, CenterY 0.0, CenterZ -0.8000000000000003
    
        super();
        this.description = "Mamba";
        this.slotsize = SLOTSIZE_8_5;
        this.centerz = -0.8;
        this.centery = 0.0;
        this.bottom = 0.405
        var struct = structures.mamba;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        this.width = 3;

        this.nummisiles = 5;
    
        this.bangsize = 20;
        this.cargospill = 2;
        this.alloys = 1;

        this.acceleration = 5.5;
        this.maxvelocity = 21;
        this.accelroll = 1;
        this.accelpitch = 1;
        this.maxvelroll = 1;
        this.maxvelpitch = 1;
    
        this.shields = 80;
        this.maxshields = 80;
        this.integrity = 80;
        this.maxintegrity = 80;
        this.rechargerate = 0.9;

        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}


function kraitDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 3.3});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.0, 0.0, -3.429], [-3.214, 0.0, 0.107], [-0.0, 0.643, 1.714]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-0.0, -0.643, 1.714], [-3.214, 0.0, 0.107], [-0.0, 0.0, -3.429]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-0.0, 0.0, -3.429], [3.214, 0.0, 0.107], [-0.0, -0.643, 1.714]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-0.0, 0.643, 1.714], [3.214, 0.0, 0.107], [-0.0, 0.0, -3.429]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-3.214, 0.0, 0.107], [-0.0, -0.643, 1.714], [-0.0, 0.643, 1.714]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[3.214, 0.0, 0.107], [-0.0, 0.643, 1.714], [-0.0, -0.643, 1.714]], texturecontrol: GREY_1});

    solid.addWTriangle({depth: 0.001, coords: [[-0.643, -0.393, 1.393], [-0.643, 0.393, 1.393], [-1.286, 0.0, 1.071]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[1.286, 0.0, 1.071], [0.643, 0.393, 1.393], [0.643, -0.393, 1.393]], texturecontrol: RED});

    struct.addWTrianglePatch({coords: [[-0.0, 0.179, -1.893], [-0.643, 0.25, -0.679], [-0.0, 0.25, -1.357]], texturecontrol: WHITE});
    struct.addWTrianglePatch({coords: [[-0.0, 0.25, -1.357], [0.643, 0.25, -0.679], [-0.0, 0.179, -1.893]], texturecontrol: WHITE});


    struct.addCylinder({depth: 1.763, radius: 0.01, position: lFromXYZ(3.214, 0, -1.658), texturecontrol: WHITE});
    struct.addCylinder({depth: 1.763, radius: 0.01, position: lFromXYZ(-3.214, 0, -1.658), texturecontrol: WHITE});

    return [gdef, struct, solid];
}

class Krait extends JohnDoeBase {
    constructor()
    {
    // Width = -3.214 to 3.214,  Length = -3.429 to 1.714,   Width = 6.428, Length = 5.143, MP = -0.8574999999999999
    // Bottom: -0.643, CenterY 0.0, CenterZ -0.8574999999999999
    
    
        super();
        this.description = "Krait";
        this.slotsize = SLOTSIZE_8_15;
        this.centerz = -0.8575
        this.centery = 0.0
        this.bottom = 0.648;
        var struct = structures.krait;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);

        this.width = 3;
    
        this.bangsize = 40;
        this.cargospill = 4;
        this.alloys = 2;
        this.nummisiles = 5;
    
        this.acceleration = 4.8;
        this.maxvelocity = 19.5;
        this.accelroll = 1;
        this.accelpitch = 1;
        this.maxvelroll = 1;
        this.maxvelpitch = 1;

        this.shields = 105;
        this.maxshields = 105;
        this.integrity = 105;
        this.maxintegrity = 105;
        this.rechargerate = 1.0;

        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function adderDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.8});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});



    struct.addWTrianglePatch({coords: [[0.321, 0.0, -0.714], [-0.321, 0.0, -0.714], [-0.321, 0.125, -0.232]], texturecontrol: GREY_1, corners: null});
    struct.addWTrianglePatch({coords: [[0.321, 0.0, -0.714], [-0.321, 0.125, -0.232], [0.321, 0.125, -0.232]], texturecontrol: GREY_1, corners: null});
    struct.addWTrianglePatch({coords: [[-0.321, 0.0, -0.714], [0.321, 0.0, -0.714], [0.321, -0.125, -0.232]], texturecontrol: GREY_1, corners: null});
    struct.addWTrianglePatch({coords: [[-0.321, 0.0, -0.714], [0.321, -0.125, -0.232], [-0.321, -0.125, -0.232]], texturecontrol: GREY_1, corners: null});
    struct.addWTrianglePatch({coords: [[-0.536, 0.0, 0.429], [-0.321, 0.125, -0.232], [-0.321, 0.0, -0.714]], texturecontrol: RED_4, corners: null});
    struct.addWTrianglePatch({coords: [[-0.321, 0.0, -0.714], [-0.321, -0.125, -0.232], [-0.536, 0.0, 0.429]], texturecontrol: RED, corners: null});
    struct.addWTrianglePatch({coords: [[-0.321, 0.125, 0.714], [-0.321, 0.125, -0.232], [-0.536, 0.0, 0.429]], texturecontrol: DARK_RED, corners: null});
    struct.addWTrianglePatch({coords: [[-0.321, 0.125, 0.714], [-0.536, 0.0, 0.429], [-0.536, 0.0, 0.714]], texturecontrol: DARK_RED, corners: null});
    struct.addWTrianglePatch({coords: [[-0.536, 0.0, 0.714], [-0.536, 0.0, 0.429], [-0.321, -0.125, -0.232]], texturecontrol: RED_3, corners: null});
    struct.addWTrianglePatch({coords: [[-0.536, 0.0, 0.714], [-0.321, -0.125, -0.232], [-0.321, -0.125, 0.714]], texturecontrol: RED_3, corners: null});
    struct.addWTrianglePatch({coords: [[0.321, 0.125, -0.232], [0.321, 0.125, 0.714], [0.536, 0.0, 0.714]], texturecontrol: DARK_RED, corners: null});
    struct.addWTrianglePatch({coords: [[0.321, 0.125, -0.232], [0.536, 0.0, 0.714], [0.536, 0.0, 0.429]], texturecontrol: DARK_RED, corners: null});
    struct.addWTrianglePatch({coords: [[0.536, 0.0, 0.429], [0.536, 0.0, 0.714], [0.321, -0.125, 0.714]], texturecontrol: RED_3, corners: null});
    struct.addWTrianglePatch({coords: [[0.536, 0.0, 0.429], [0.321, -0.125, 0.714], [0.321, -0.125, -0.232]], texturecontrol: RED_3, corners: null});
    struct.addWTrianglePatch({coords: [[0.321, 0.125, -0.232], [0.536, 0.0, 0.429], [0.321, 0.0, -0.714]], texturecontrol: RED_4, corners: null});
    struct.addWTrianglePatch({coords: [[0.321, 0.0, -0.714], [0.536, 0.0, 0.429], [0.321, -0.125, -0.232]], texturecontrol: RED, corners: null});
    struct.addWTrianglePatch({coords: [[-0.536, 0.0, 0.714], [-0.321, -0.125, 0.714], [0.321, -0.125, 0.714]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[-0.536, 0.0, 0.714], [0.321, -0.125, 0.714], [0.536, 0.0, 0.714]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[-0.536, 0.0, 0.714], [0.536, 0.0, 0.714], [0.321, 0.125, 0.714]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[-0.536, 0.0, 0.714], [0.321, 0.125, 0.714], [-0.321, 0.125, 0.714]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[0.321, 0.125, -0.232], [-0.321, 0.125, -0.232], [-0.321, 0.125, 0.714]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[0.321, 0.125, -0.232], [-0.321, 0.125, 0.714], [0.321, 0.125, 0.714]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[0.321, -0.125, 0.714], [-0.321, -0.125, 0.714], [-0.321, -0.125, -0.232]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[0.321, -0.125, 0.714], [-0.321, -0.125, -0.232], [0.321, -0.125, -0.232]], texturecontrol: GREY_2, corners: null});
    struct.addWTriangle({depth: 0.001, coords: [[0.196, 0.071, -0.429], [0.196, 0.054, -0.518], [-0.196, 0.054, -0.518]], texturecontrol: BLUE_1, corners: null});
    struct.addWTriangle({depth: 0.001, coords: [[0.196, 0.071, -0.429], [-0.196, 0.054, -0.518], [-0.196, 0.071, -0.429]], texturecontrol: BLUE_1, corners: null});

    solid.addBlock({size: [0.3, 0.07, 0.001], position: lFromXYZ(0, 0, 0.714), texturecontrol: RED});

    return [gdef, struct, solid];
}

class Adder extends JohnDoeBase {
    constructor()
    {
    // Bottom: -0.125, CenterY 0.0, CenterZ 0.0
        super();
        this.description = "Adder";
        this.slotsize = SLOTSIZE_2_2;
        this.centerz = 0.0;
        this.centery = 0.0;
        this.bottom = 0.13;

        this.width = 0.5;
    
        var struct = structures.adder;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        this.bangsize = 4;
        this.cargospill = 1;
        this.alloys = 1;
        this.nummisiles = 2;

        this.acceleration = 5;
        this.maxvelocity = 16;
        this.accelroll = 1.1;
        this.accelpitch = 1.1;
        this.maxvelroll = 1.1;
        this.maxvelpitch = 1.1;

        this.shields = 70;
        this.maxshields = 70;
        this.integrity = 70;
        this.maxintegrity = 70;
        this.rechargerate = 1.2;

        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function geckoDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 0.9});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.286, 0.143, 0.411], [0.286, 0.143, 0.411], [0.179, -0.071, -0.839]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-0.286, 0.143, 0.411], [0.179, -0.071, -0.839], [-0.179, -0.071, -0.839]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-0.286, 0.143, 0.411], [-0.179, -0.071, -0.839], [-1.179, 0.0, 0.054]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-1.179, 0.0, 0.054], [-0.179, -0.071, -0.839], [-0.357, -0.25, 0.411]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-0.179, -0.071, -0.839], [0.179, -0.071, -0.839], [0.357, -0.25, 0.411]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.179, -0.071, -0.839], [0.357, -0.25, 0.411], [-0.357, -0.25, 0.411]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[1.179, 0.0, 0.054], [0.357, -0.25, 0.411], [0.179, -0.071, -0.839]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.179, -0.071, -0.839], [0.286, 0.143, 0.411], [1.179, 0.0, 0.054]], texturecontrol: GREY_1});
    solid.addWTrianglePatch({coords: [[1.179, 0.0, 0.054], [0.286, 0.143, 0.411], [0.357, -0.25, 0.411]], texturecontrol: RED});
    solid.addWTrianglePatch({coords: [[0.286, 0.143, 0.411], [-0.286, 0.143, 0.411], [-0.357, -0.25, 0.411]], texturecontrol: RED});
    solid.addWTrianglePatch({coords: [[0.286, 0.143, 0.411], [-0.357, -0.25, 0.411], [0.357, -0.25, 0.411]], texturecontrol: RED});
    solid.addWTrianglePatch({coords: [[-1.179, 0.0, 0.054], [-0.357, -0.25, 0.411], [-0.286, 0.143, 0.411]], texturecontrol: RED});


    return [gdef, struct, solid];
}

class Gecko extends JohnDoeBase {
    constructor()
    {
    // Width = -1.179 to 1.179,  Length = -0.839 to 0.411,   Width = 2.358, Length = 1.25, MP = -0.21400000000000002
    // Bottom: -0.25, CenterY -0.05350000000000002, CenterZ -0.21400000000000002
    
        super();
        this.description = "Gecko";
        this.slotsize = SLOTSIZE_3_3;
        this.centerz = -0.214;
        this.centery = -0.0535
        this.bottom = 0.255;
        var struct = structures.gecko;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
    
        this.acceleration = 5.5;
        this.maxvelocity = 17;
        this.accelroll = 1.1;
        this.accelpitch = 1.1;
        this.maxvelroll = 1.1;
        this.maxvelpitch = 1.1;

        this.width = 1;

        this.shields = 70;
        this.maxshields = 70;
        this.integrity = 70;
        this.maxintegrity = 70;
        this.rechargerate = 1.1;

        this.bangsize = 5;
        this.cargospill = 1;
        this.alloys = 1;
        this.nummisiles = 1;
        
    
        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function cobra1Def()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 2.4});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[0.643, -0.036, -1.786], [-0.643, -0.036, -1.786], [-0.0, 0.429, 0.214]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[1.929, -0.429, 1.357], [-1.929, -0.429, 1.357], [-0.643, -0.036, -1.786]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[1.929, -0.429, 1.357], [-0.643, -0.036, -1.786], [0.643, -0.036, -1.786]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[2.357, 0.0, -0.25], [0.643, -0.036, -1.786], [-0.0, 0.429, 0.214]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[2.357, 0.0, -0.25], [-0.0, 0.429, 0.214], [1.143, 0.429, 1.357]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[1.929, -0.429, 1.357], [0.643, -0.036, -1.786], [2.357, 0.0, -0.25]], texturecontrol: BLUE_4});
    struct.addWTrianglePatch({coords: [[-0.643, -0.036, -1.786], [-2.357, 0.0, -0.25], [-1.143, 0.429, 1.357]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-0.643, -0.036, -1.786], [-1.143, 0.429, 1.357], [-0.0, 0.429, 0.214]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-0.643, -0.036, -1.786], [-1.929, -0.429, 1.357], [-2.357, 0.0, -0.25]], texturecontrol: BLUE_4});
    struct.addWTrianglePatch({coords: [[1.143, 0.429, 1.357], [-0.0, 0.429, 0.214], [-1.143, 0.429, 1.357]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-1.929, -0.429, 1.357], [1.929, -0.429, 1.357], [1.143, 0.429, 1.357]], texturecontrol: BLUE_4});
    struct.addWTrianglePatch({coords: [[-1.929, -0.429, 1.357], [1.143, 0.429, 1.357], [-1.143, 0.429, 1.357]], texturecontrol: BLUE_4});
    struct.addWTrianglePatch({coords: [[2.357, 0.0, -0.25], [1.143, 0.429, 1.357], [1.929, -0.429, 1.357]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-2.357, 0.0, -0.25], [-1.929, -0.429, 1.357], [-1.143, 0.429, 1.357]], texturecontrol: BLUE_2});

    solid.addWTriangle({depth: 0.001, coords: [[-0.143, -0.25, 1.357], [-0.143, 0.107, 1.357], [-0.643, 0.071, 1.357]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[-0.143, -0.25, 1.357], [-0.643, 0.071, 1.357], [-0.643, -0.214, 1.357]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[0.643,  -0.214, 1.357], [0.643,  0.071, 1.357], [0.143, 0.107, 1.357]], texturecontrol: RED});
    solid.addWTriangle({depth: 0.001, coords: [[0.643,  -0.214, 1.357], [0.143,  0.107, 1.357], [0.143, -0.25, 1.357]], texturecontrol: RED});

    struct.addWTriangle({depth: 0.001, coords: [[1.25,   0.0, 1.357], [1.25, -0.214, 1.357], [1.35, -0.107, 1.357]], texturecontrol: DARK_RED});
    struct.addWTriangle({depth: 0.001, coords: [[-1.25, -0.214, 1.357], [-1.25, 0.0, 1.357], [-1.35, -0.107, 1.357]], texturecontrol: DARK_RED});

    struct.addCylinder({radius: 0.01, depth: 0.3, position: lFromXYZ(0, -0.036, -2.086), texturecontrol: WHITE});

    return [gdef, struct, solid];
}

class Cobra1 extends JohnDoeBase {
    constructor()
    {
    // Width = -2.357 to 2.357,  Length = -1.786 to 1.357,   Width = 4.714, Length = 3.143, MP = -0.2144999999999999
    // Bottom: -0.429, CenterY 0.0, CenterZ -0.2144999999999999
    
    
        super();
        this.description = "Cobra Mk I";
        this.slotsize = SLOTSIZE_8_5;
        this.centerz = -0.2145
        this.centery = 0.0
        this.bottom = 0.434;
        var struct = structures.cobra1;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
    
        this.acceleration = 4.9;
        this.maxvelocity = 19;
        this.accelroll = 1;
        this.accelpitch = 1;
        this.maxvelroll = 1;
        this.maxvelpitch = 1;
        this.width = 2;

        this.shields = 95;
        this.maxshields = 95;
        this.integrity = 95;
        this.maxintegrity = 95;
        this.rechargerate = 0.95;

        this.bangsize = 40;
        this.cargospill = 4;
        this.alloys = 2;
        this.nummisiles = 3;
    
        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function wormDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 1.1});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE, distance: 0.6});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE, distance: 0.6});

    struct.addWTrianglePatch({coords: [[0.179, -0.179, -0.625], [-0.179, -0.179, -0.625], [-0.089, 0.107, -0.268]], texturecontrol: lTextureColor(256, 237)});
    struct.addWTrianglePatch({coords: [[0.179, -0.179, -0.625], [-0.089, 0.107, -0.268], [0.089, 0.107, -0.268]], texturecontrol: lTextureColor(256, 237)});
    struct.addWTrianglePatch({coords: [[-0.179, -0.179, -0.625], [-0.268, -0.179, -0.446], [-0.089, 0.107, -0.268]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[0.179, -0.179, -0.625], [0.089, 0.107, -0.268], [0.268, -0.179, -0.446]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[-0.089, 0.107, -0.268], [-0.268, -0.179, -0.446], [-0.464, -0.179, 0.446]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-0.089, 0.107, -0.268], [-0.464, -0.179, 0.446], [-0.143, 0.25, 0.446]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[0.268, -0.179, -0.446], [0.089, 0.107, -0.268], [0.143, 0.25, 0.446]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[0.268, -0.179, -0.446], [0.143, 0.25, 0.446], [0.464, -0.179, 0.446]], texturecontrol: lTextureColor(256, 235)});
    struct.addWTrianglePatch({coords: [[-0.464, -0.179, 0.446], [0.464, -0.179, 0.446], [0.143, 0.25, 0.446]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[-0.464, -0.179, 0.446], [0.143, 0.25, 0.446], [-0.143, 0.25, 0.446]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[-0.268, -0.179, -0.446], [-0.179, -0.179, -0.625], [0.179, -0.179, -0.625]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[-0.268, -0.179, -0.446], [0.179, -0.179, -0.625], [0.268, -0.179, -0.446]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[-0.268, -0.179, -0.446], [0.268, -0.179, -0.446], [0.464, -0.179, 0.446]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[-0.268, -0.179, -0.446], [0.464, -0.179, 0.446], [-0.464, -0.179, 0.446]], texturecontrol: lTextureColor(256, 234)});
    struct.addWTrianglePatch({coords: [[0.143, 0.25, 0.446], [0.089, 0.107, -0.268], [-0.089, 0.107, -0.268]], texturecontrol: lTextureColor(256, 248)});
    struct.addWTrianglePatch({coords: [[0.143, 0.25, 0.446], [-0.089, 0.107, -0.268], [-0.143, 0.25, 0.446]], texturecontrol: lTextureColor(256, 248)});

    solid.addPolygon({depth: 0.001, coords: [[-0.164, 0.143], [-0.321, -0.083], [0.321, -0.083], [0.164, 0.143]], position: lFromXYZ(0, 0, 0.446), texturecontrol: RED});


    return [gdef, struct, solid];
}

class Worm extends JohnDoeBase {
    constructor()
    {
    // Width = -0.464 to 0.464,  Length = -0.625 to 0.446,   Width = 0.928, Length = 1.071, MP = -0.08949999999999997
    // Bottom: -0.179, CenterY 0.035500000000000004, CenterZ -0.08949999999999997
    
    
        super();
        this.description = "Worm";
        this.slotsize = SLOTSIZE_2_2;
        this.centerz = -0.0895;
        this.centery = 0.0355;
        this.bottom = 0.184;
        var struct = structures.worm;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
    
        this.acceleration = 4;
        this.maxvelocity = 16;
        this.accelroll = 1;
        this.accelpitch = 1;
        this.maxvelroll = 1;
        this.maxvelpitch = 1;

        this.width = 0.4;


        this.shields = 75;
        this.maxshields = 75;
        this.integrity = 75;
        this.maxintegrity = 75;
        this.rechargerate = 1.0;

        this.bangsize = 2;
        this.cargospill = 0;
        this.alloys = 1;
        this.nummisiles = 0;
    
        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function aspDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 2.5});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.929, -0.25, -2.607], [0.929, -0.25, -2.607], [1.536, -0.5, -1.0]], texturecontrol: GREY_4, corners: null});
    struct.addWTrianglePatch({coords: [[-0.929, -0.25, -2.607], [1.536, -0.5, -1.0], [-0.0, -0.643, 0.0]], texturecontrol: GREY_4, corners: null});
    struct.addWTrianglePatch({coords: [[-0.929, -0.25, -2.607], [-0.0, -0.643, 0.0], [-1.536, -0.5, -1.0]], texturecontrol: GREY_4, corners: null});
    struct.addWTrianglePatch({coords: [[-2.464, -0.107, 0.0], [-1.536, -0.5, -1.0], [-0.0, -0.643, 0.0]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[-2.464, -0.107, 0.0], [-0.0, -0.643, 0.0], [-0.0, -0.321, 1.607]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[-2.464, -0.107, 0.0], [-0.0, -0.321, 1.607], [-1.536, 0.0, 1.607]], texturecontrol: GREY_2, corners: null});
    struct.addWTrianglePatch({coords: [[-0.0, -0.321, 1.607], [-0.0, -0.643, 0.0], [1.536, -0.5, -1.0]], texturecontrol: GREY_1, corners: null});
    struct.addWTrianglePatch({coords: [[-0.0, -0.321, 1.607], [1.536, -0.5, -1.0], [2.464, -0.107, 0.0]], texturecontrol: GREY_1, corners: null});
    struct.addWTrianglePatch({coords: [[-0.0, -0.321, 1.607], [2.464, -0.107, 0.0], [1.536, 0.0, 1.607]], texturecontrol: GREY_1, corners: null});
    struct.addWTrianglePatch({coords: [[-0.929, -0.25, -2.607], [-1.536, -0.5, -1.0], [-2.464, -0.107, 0.0]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[2.464, -0.107, 0.0], [1.536, -0.5, -1.0], [0.929, -0.25, -2.607]], texturecontrol: GREY_3, corners: null});
    struct.addWTrianglePatch({coords: [[1.536, 0.5, -1.0], [-1.536, 0.5, -1.0], [-0.0, 0.321, 1.607]], texturecontrol: BLUE_2, corners: null});
    struct.addWTrianglePatch({coords: [[0.929, -0.25, -2.607], [-0.929, -0.25, -2.607], [-1.536, 0.5, -1.0]], texturecontrol: BLUE_1, corners: null});
    struct.addWTrianglePatch({coords: [[0.929, -0.25, -2.607], [-1.536, 0.5, -1.0], [1.536, 0.5, -1.0]], texturecontrol: BLUE_1, corners: null});
    struct.addWTrianglePatch({coords: [[2.464, -0.107, 0.0], [1.536, 0.5, -1.0], [-0.0, 0.321, 1.607]], texturecontrol: BLUE_4, corners: null});
    struct.addWTrianglePatch({coords: [[2.464, -0.107, 0.0], [-0.0, 0.321, 1.607], [1.536, 0.0, 1.607]], texturecontrol: BLUE_4, corners: null});
    struct.addWTrianglePatch({coords: [[-1.536, 0.0, 1.607], [-0.0, 0.321, 1.607], [-1.536, 0.5, -1.0]], texturecontrol: BLUE_4, corners: null});
    struct.addWTrianglePatch({coords: [[-1.536, 0.0, 1.607], [-1.536, 0.5, -1.0], [-2.464, -0.107, 0.0]], texturecontrol: BLUE_4, corners: null});
    struct.addWTrianglePatch({coords: [[-2.464, -0.107, 0.0], [-1.536, 0.5, -1.0], [-0.929, -0.25, -2.607]], texturecontrol: BLUE_3, corners: null});
    struct.addWTrianglePatch({coords: [[0.929, -0.25, -2.607], [1.536, 0.5, -1.0], [2.464, -0.107, 0.0]], texturecontrol: BLUE_3, corners: null});
    struct.addWTrianglePatch({coords: [[-1.536, 0.0, 1.607], [-0.0, -0.321, 1.607], [1.536, 0.0, 1.607]], texturecontrol: DARK_RED, corners: null});
    struct.addWTrianglePatch({coords: [[-1.536, 0.0, 1.607], [1.536, 0.0, 1.607], [-0.0, 0.321, 1.607]], texturecontrol: DARK_RED, corners: null});
    solid.addWTriangle({depth: 0.001, coords: [[-0.607, 0.0, 1.607], [-0.0, -0.143, 1.607], [0.607, 0.0, 1.607]], texturecontrol: RED, corners: null});
    solid.addWTriangle({depth: 0.001, coords: [[-0.607, 0.0, 1.607], [0.607, 0.0, 1.607], [-0.0, 0.143, 1.607]], texturecontrol: RED, corners: null});

    struct.addCylinder({depth: 0.35, radius: 0.01, position: lFromXYZ(0, -0.25, -2.957), texturecontrol: WHITE});

    return [gdef, struct, solid];
}

class Asp extends JohnDoeBase {
    constructor()
    {
        super();
        this.description = "Asp";
        this.slotsize = SLOTSIZE_8_5;
        this.centerz = -0.5;
        this.centery = 0.0715;
        this.bottom = 0.648;
        var struct = structures.asp;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
    
        this.acceleration = 4.5;
        this.maxvelocity = 18;
        this.accelroll = 0.9;
        this.accelpitch = 0.9;
        this.maxvelroll = 0.9;
        this.maxvelpitch = 0.9;

        this.width = 2.2;

        this.shields = 120;
        this.maxshields = 120;
        this.integrity = 120;
        this.maxintegrity = 120;
        this.rechargerate = 1.0;


        this.bangsize = 50;
        this.cargospill = 5;
        this.alloys = 2;
        this.nummissiles = 5;
    
        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}


function ferdelanceDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 3.0});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[2.5, 0.875, 0.25], [-0.0, -0.875, -6.75], [-2.5, 0.875, 0.25]], texturecontrol: GREY_1, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[2.5, 0.875, 0.25], [-2.5, 0.875, 0.25], [-0.0, 1.125, 1.25]], texturecontrol: GREY_1, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[-0.0, -0.875, -6.75], [2.5, 0.875, 0.25], [2.5, -0.875, 0.25]], texturecontrol: GREY_2, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[0.75, -0.875, 3.25], [2.5, -0.875, 0.25], [2.5, 0.875, 0.25]], texturecontrol: BLUE_2, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[0.75, -0.875, 3.25], [2.5, 0.875, 0.25], [0.75, 0.125, 3.25]], texturecontrol: BLUE_2, position: lFromXYZ(0, -0.125, 0)});
    solid.addWTrianglePatch({coords: [[-0.75, -0.875, 3.25], [0.75, -0.875, 3.25], [0.75, 0.125, 3.25]], texturecontrol: RED, position: lFromXYZ(0, -0.125, 0)});
    solid.addWTrianglePatch({coords: [[-0.75, -0.875, 3.25], [0.75, 0.125, 3.25], [-0.75, 0.125, 3.25]], texturecontrol: RED, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[-2.5, -0.875, 0.25], [-0.75, -0.875, 3.25], [-0.75, 0.125, 3.25]], texturecontrol: BLUE_2, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[-2.5, -0.875, 0.25], [-0.75, 0.125, 3.25], [-2.5, 0.875, 0.25]], texturecontrol: BLUE_2, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[-2.5, -0.875, 0.25], [-2.5, 0.875, 0.25], [-0.0, -0.875, -6.75]], texturecontrol: GREY_2, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[2.5, 0.875, 0.25], [-0.0, 1.125, 1.25], [0.75, 0.125, 3.25]], texturecontrol: BLUE_3, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[0.75, 0.125, 3.25], [-0.0, 1.125, 1.25], [-0.75, 0.125, 3.25]], texturecontrol: BLUE_2, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[-0.75, 0.125, 3.25], [-0.0, 1.125, 1.25], [-2.5, 0.875, 0.25]], texturecontrol: BLUE_3, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[-2.5, -0.875, 0.25], [-0.0, -0.875, -6.75], [2.5, -0.875, 0.25]], texturecontrol: GREY_3, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[-2.5, -0.875, 0.25], [2.5, -0.875, 0.25], [0.75, -0.875, 3.25]], texturecontrol: GREY_3, position: lFromXYZ(0, -0.125, 0)});
    struct.addWTrianglePatch({coords: [[-2.5, -0.875, 0.25], [0.75, -0.875, 3.25], [-0.75, -0.875, 3.25]], texturecontrol: GREY_3, position: lFromXYZ(0, -0.125, 0)});
    solid.addWTriangle({depth: 0.001, coords: [[-0.0, -0.875, 1.25], [-0.875, -0.875, -2.75], [0.875, -0.875, -2.75]], texturecontrol: GOLD, position: lFromXYZ(0, -0.125, 0)});
    solid.addWTriangle({depth: 0.001, coords: [[1.625, 0.5, -1.125], [0.188, -0.688, -6.062], [1.0, 0.875, 0.25]], texturecontrol: GOLD, position: lFromXYZ(0, -0.125, 0)});
    solid.addWTriangle({depth: 0.001, coords: [[-1.0, 0.875, 0.25], [-0.188, -0.688, -6.062], [-1.625, 0.5, -1.125]], texturecontrol: GOLD, position: lFromXYZ(0, -0.125, 0)});

    return [gdef, struct, solid];
}

class Ferdelance extends JohnDoeBase {
    constructor()
    {
    // Bottom: -0.875, CenterY 0.125, CenterZ -1.75
        super();
        this.description = "Fer de Lance";
        this.slotsize = SLOTSIZE_8_15;
        this.centerz = -1.75;
        this.centery = 0.125;
        this.bottom = 0.88;
        var struct = structures.ferdelance;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);

        this.width = 2.3;
    
        this.acceleration = 6;
        this.maxvelocity = 22;
        this.accelroll = 1.1;
        this.accelpitch = 1.1;
        this.maxvelroll = 1.1;
        this.maxvelpitch = 1.1;

        this.shields = 80;
        this.maxshields = 80;
        this.integrity = 80;
        this.maxintegrity = 80;
        this.rechargerate = 0.8;

        this.bangsize = 100;
        this.cargospill = 7;
        this.alloys = 3;
        this.nummissiles = 3;
    
        this.obj.addChild(sobj, mat4.create());
        this.obj.addChild(bobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function morayDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 1.2});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[-0.268, 0.0, -1.161], [-0.0, 0.321, 0.714], [0.268, 0.0, -1.161]], texturecontrol: BLUE_4});
    struct.addWTrianglePatch({coords: [[0.268, 0.0, -1.161], [-0.0, 0.321, 0.714], [1.071, 0.0, 0.0]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-1.071, 0.0, 0.0], [-0.0, 0.321, 0.714], [-0.268, 0.0, -1.161]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[1.071, 0.0, 0.0], [-0.0, 0.321, 0.714], [0.536, -0.482, 0.179]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[0.536, -0.482, 0.179], [0.0, 0.321, 0.714], [-0.536, -0.482, 0.179]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-0.536, -0.482, 0.179], [0.0, 0.321, 0.714], [-1.071, 0.0, 0.0]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[0.536, -0.482, 0.179], [0.268, 0.0, -1.161], [1.071, 0.0, 0.0]], texturecontrol: BLUE_1});
    struct.addWTrianglePatch({coords: [[0.536, -0.482, 0.179], [-0.536, -0.482, 0.179], [-0.268, 0.0, -1.161]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[0.536, -0.482, 0.179], [-0.268, 0.0, -1.161], [0.268, 0.0, -1.161]], texturecontrol: BLUE_2});
    struct.addWTrianglePatch({coords: [[-1.071, 0.0, 0.0], [-0.268, 0.0, -1.161], [-0.536, -0.482, 0.179]], texturecontrol: BLUE_1});
    struct.addWTrianglePatch({coords: [[-0.161, -0.071, 0.446], [-0.0, -0.321, 0.286], [0.161, -0.071, 0.446]], texturecontrol: DARK_RED});

    struct.addTriangle({depth: 0.1, coords: [[-0.2, -.3], [0.2, -0.3], [0, 0]], position: lFromXYZ(0, 0.25, .614), texturecontrols: [null, null, GREY_1, GREY_1, GREY_1]});
    solid.addTriangle({depth: 0.1, coords: [[-0.2, -.3], [0.2, -0.3], [0, 0]], position: lFromXYZ(0, 0.25, .614), texturecontrols: [RED, null, null, null, null]});

    return [gdef, struct];
}

class Moray extends JohnDoeBase {
    constructor()
    {
    // Width = -1.071 to 1.071,  Length = -1.161 to 0.714,   Width = 2.142, Length = 1.875, MP = -0.22350000000000003
    // Bottom: -0.482, CenterY -0.08049999999999996, CenterZ -0.22350000000000003
    
        super();
        this.description = "Moray";
        this.slotsize = SLOTSIZE_3_3;
        this.centery = -0.805;
        this.bottom = 0.487;
        var struct = structures.moray;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);

        this.width = 0.8;
    
        this.acceleration = 4;
        this.maxvelocity = 17;
        this.accelroll = 0.85;
        this.accelpitch = 0.85;
        this.maxvelroll = 0.85;
        this.maxvelpitch = 0.85;

        this.shields = 100;
        this.maxshields = 100;
        this.integrity = 100;
        this.maxintegrity = 100;
        this.rechargerate = 1.0;

        this.bangsize = 4;
        this.cargospill = 1;
        this.alloys = 1;
        this.nummissiles = 2;
    
        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}


function thargoidDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 5.0});
    var struct = new LStructureDef(ShaderSimple, {shininess: -1, colors: COLORS, collision: LNONE, distance: 6});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE, distance: 6});

    solid.addWTrianglePatch({coords: [[-1.143, -2.429, 0.0], [-1.143, -1.714, -1.714], [0.857, -4.143, -4.143]], texturecontrol: DARK_RED});
    solid.addWTrianglePatch({coords: [[-1.143, -2.429, 0.0], [0.857, -4.143, -4.143], [0.857, -5.857, 0.0]], texturecontrol: DARK_RED});
    struct.addWTrianglePatch({coords: [[-1.143, -1.714, 1.714], [-1.143, -2.429, 0.0], [0.857, -5.857, 0.0]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.143, -1.714, 1.714], [0.857, -5.857, 0.0], [0.857, -4.143, 4.143]], texturecontrol: GREY_2});
    solid.addWTrianglePatch({coords: [[-1.143, 0.0, 2.429], [-1.143, -1.714, 1.714], [0.857, -4.143, 4.143]], texturecontrol: DARK_RED});
    solid.addWTrianglePatch({coords: [[-1.143, 0.0, 2.429], [0.857, -4.143, 4.143], [0.857, 0.0, 5.857]], texturecontrol: DARK_RED});
    struct.addWTrianglePatch({coords: [[-1.143, 1.714, 1.714], [-1.143, 0.0, 2.429], [0.857, 0.0, 5.857]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.143, 1.714, 1.714], [0.857, 0.0, 5.857], [0.857, 4.143, 4.143]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.143, -1.714, -1.714], [-1.143, -2.429, 0.0], [-1.143, -1.714, 1.714]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-1.143, -1.714, -1.714], [-1.143, -1.714, 1.714], [-1.143, 0.0, -2.429]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-1.143, -1.714, 1.714], [-1.143, 0.0, 2.429], [-1.143, 1.714, -1.714]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-1.143, -1.714, 1.714], [-1.143, 1.714, -1.714], [-1.143, 0.0, -2.429]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-1.143, 0.0, 2.429], [-1.143, 1.714, 1.714], [-1.143, 2.429, 0.0]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-1.143, 0.0, 2.429], [-1.143, 2.429, 0.0], [-1.143, 1.714, -1.714]], texturecontrol: GREY_3});
    solid.addWTrianglePatch({coords: [[-1.143, 2.429, 0.0], [-1.143, 1.714, 1.714], [0.857, 4.143, 4.143]], texturecontrol: DARK_RED});
    solid.addWTrianglePatch({coords: [[-1.143, 2.429, 0.0], [0.857, 4.143, 4.143], [0.857, 5.857, 0.0]], texturecontrol: DARK_RED});
    struct.addWTrianglePatch({coords: [[-1.143, 1.714, -1.714], [-1.143, 2.429, 0.0], [0.857, 5.857, 0.0]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.143, 1.714, -1.714], [0.857, 5.857, 0.0], [0.857, 4.143, -4.143]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.143, 0.0, -2.429], [-1.143, 1.714, -1.714], [0.857, 4.143, -4.143]], texturecontrol: DARK_RED});
    solid.addWTrianglePatch({coords: [[-1.143, 0.0, -2.429], [0.857, 4.143, -4.143], [0.857, 0.0, -5.857]], texturecontrol: DARK_RED});
    solid.addWTrianglePatch({coords: [[-1.143, -1.714, -1.714], [-1.143, 0.0, -2.429], [0.857, 0.0, -5.857]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.143, -1.714, -1.714], [0.857, 0.0, -5.857], [0.857, -4.143, -4.143]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[0.857, -5.857, 0.0], [0.857, -4.143, -4.143], [0.857, 0.0, -5.857]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.857, -5.857, 0.0], [0.857, 0.0, -5.857], [0.857, -4.143, 4.143]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.857, 0.0, 5.857], [0.857, -4.143, 4.143], [0.857, 0.0, -5.857]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.857, 0.0, 5.857], [0.857, 0.0, -5.857], [0.857, 4.143, -4.143]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.857, 4.143, 4.143], [0.857, 0.0, 5.857], [0.857, 4.143, -4.143]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.857, 4.143, 4.143], [0.857, 4.143, -4.143], [0.857, 5.857, 0.0]], texturecontrol: GREY_3});



    struct.addBlock({size: [0.05, 0.05, 2.24], position: lFromXYZ(0.857, 2.5, 0), texturecontrol: WHITE});
    struct.addBlock({size: [0.05, 0.05, 2.24], position: lFromXYZ(0.857, -2.5, 0), texturecontrol: WHITE});

    return [gdef, struct, solid];
}

class Thargoid extends ThargoidBase {
    constructor()
    {
        super();
        this.description = "Thargoid";
        var struct = structures.thargoid;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);
        this.bangsize = 400;
        this.cargospill = 0;
        this.alloys = 0;
        this.nummissiles = 0;

        this.acceleration = 3;
        this.maxvelocity = 15;
        this.accelroll = 0.7;
        this.accelpitch = 0.7;
        this.maxvelroll = 0.7;
        this.maxvelpitch = 0.7;

        this.shields = 150;
        this.maxshields = 150;
        this.integrity = 150;
        this.maxintegrity = 150;
        this.rechargerate = 0.8;

        this.width = 1;
    
        this.obj.addChild(sobj, mat4.create());
        this.obj.addChild(bobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function thargonDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 1.5});
    var gidef = new LGroupDef({collision: LNONE});
    var struct = new LStructureDef(ShaderSimple, {shininess: -1, colors: COLORS, collision: LNONE, distance: 0.34});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE, distance: 0.34});

    solid.addWTrianglePatch({coords: [[0.075, 0.2, 0.267], [0.075, -0.2, 0.267], [0.075, -0.317, -0.1]], texturecontrol: DARK_RED});
    solid.addWTrianglePatch({coords: [[0.075, 0.2, 0.267], [0.075, -0.317, -0.1], [0.075, 0.0, -0.333]], texturecontrol: DARK_RED});
    solid.addWTrianglePatch({coords: [[0.075, 0.2, 0.267], [0.075, 0.0, -0.333], [0.075, 0.317, -0.1]], texturecontrol: DARK_RED});
    struct.addWTrianglePatch({coords: [[-0.075, -0.083, 0.125], [-0.075, 0.0, 0.067], [0.075, 0.0, -0.333]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.075, -0.083, 0.125], [0.075, 0.0, -0.333], [0.075, -0.317, -0.1]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.075, -0.05, 0.217], [-0.075, -0.083, 0.125], [0.075, -0.317, -0.1]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-0.075, -0.05, 0.217], [0.075, -0.317, -0.1], [0.075, -0.2, 0.267]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-0.075, 0.05, 0.217], [-0.075, -0.05, 0.217], [0.075, -0.2, 0.267]], texturecontrol: GREY_4});
    struct.addWTrianglePatch({coords: [[-0.075, 0.05, 0.217], [0.075, -0.2, 0.267], [0.075, 0.2, 0.267]], texturecontrol: GREY_4});
    struct.addWTrianglePatch({coords: [[-0.075, 0.083, 0.125], [-0.075, 0.05, 0.217], [0.075, 0.2, 0.267]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-0.075, 0.083, 0.125], [0.075, 0.2, 0.267], [0.075, 0.317, -0.1]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[0.075, 0.317, -0.1], [0.075, 0.0, -0.333], [-0.075, 0.0, 0.067]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[0.075, 0.317, -0.1], [-0.075, 0.0, 0.067], [-0.075, 0.083, 0.125]], texturecontrol: GREY_3});
    solid.addWTrianglePatch({coords: [[-0.075, 0.083, 0.125], [-0.075, 0.0, 0.067], [-0.075, -0.083, 0.125]], texturecontrol: DARK_RED});
    solid.addWTrianglePatch({coords: [[-0.075, 0.083, 0.125], [-0.075, -0.083, 0.125], [-0.075, -0.05, 0.217]], texturecontrol: DARK_RED});
    solid.addWTrianglePatch({coords: [[-0.075, 0.083, 0.125], [-0.075, -0.05, 0.217], [-0.075, 0.05, 0.217]], texturecontrol: DARK_RED});

    return [gdef, gidef, struct, solid];
}

class Thargon extends ThargonBase {
    constructor()
    {
        super();
        this.description = "Thargon";
        var struct = structures.thargon;
        this.obj = new LWObject(struct[0], this);
        this.iobj = new LObject(struct[1], this);
        var bobj = new LObject(struct[2], this);
        var sobj = new LObject(struct[3], this);
    
        this.bangsize = 3;
        this.cargospill = 0;
        this.alloys = 0;
        this.nummissiles = 0;

        this.width = 0.05;
    
        this.acceleration = 5;
        this.maxvelocity = 20;
        this.accelroll = 1.3;
        this.accelpitch = 1.3;
        this.maxvelroll = 1.3;
        this.maxvelpitch = 1.3;

        this.shields = 80;
        this.maxshields = 80;
        this.integrity = 80;
        this.maxintegrity = 80;
        this.rechargerate = 1.0;

        this.obj.addChild(this.iobj, mat4.create());
        this.iobj.addChild(bobj, mat4.create());
        this.iobj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function constrictorDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 2.9});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[0.714, -0.25, -2.857], [-0.714, -0.25, -2.857], [-0.714, 0.464, -0.179]], texturecontrol: GREY_4});
    struct.addWTrianglePatch({coords: [[0.714, -0.25, -2.857], [-0.714, 0.464, -0.179], [0.714, 0.464, -0.179]], texturecontrol: GREY_4});
    struct.addWTrianglePatch({coords: [[0.714, -0.25, -2.857], [0.714, 0.464, -0.179], [1.929, -0.25, -1.429]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.714, -0.25, -2.857], [-1.929, -0.25, -1.429], [-0.714, 0.464, -0.179]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-1.929, -0.25, -1.429], [-1.929, -0.25, 1.429], [-0.714, 0.464, -0.179]], texturecontrol: GOLD});
    struct.addWTrianglePatch({coords: [[0.714, 0.464, -0.179], [1.929, -0.25, 1.429], [1.929, -0.25, -1.429]], texturecontrol: GOLD});
    struct.addWTrianglePatch({coords: [[0.714, 0.464, -0.179], [0.714, 0.464, 1.429], [1.929, -0.25, 1.429]], texturecontrol: YELLOW_1});
    struct.addWTrianglePatch({coords: [[-0.714, 0.464, -0.179], [-0.714, 0.464, 1.429], [0.714, 0.464, 1.429]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.714, 0.464, -0.179], [0.714, 0.464, 1.429], [0.714, 0.464, -0.179]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.714, 0.464, -0.179], [-1.929, -0.25, 1.429], [-0.714, 0.464, 1.429]], texturecontrol: YELLOW_1});
    struct.addWTrianglePatch({coords: [[-1.929, -0.25, 1.429], [1.929, -0.25, 1.429], [0.714, 0.464, 1.429]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.929, -0.25, 1.429], [0.714, 0.464, 1.429], [-0.714, 0.464, 1.429]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[1.929, -0.25, 1.429], [-1.929, -0.25, 1.429], [-1.929, -0.25, -1.429]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[1.929, -0.25, 1.429], [-1.929, -0.25, -1.429], [-0.714, -0.25, -2.857]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[1.929, -0.25, 1.429], [-0.714, -0.25, -2.857], [0.714, -0.25, -2.857]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[1.929, -0.25, 1.429], [0.714, -0.25, -2.857], [1.929, -0.25, -1.429]], texturecontrol: GREY_3});
    struct.addWTriangle({depth: 0.001, coords: [[-0.893, -0.25, 0.893], [-0.714, -0.25, -2.214], [-0.536, -0.25, 0.536]], texturecontrol: DARK_RED});
    struct.addWTriangle({depth: 0.001, coords: [[0.536, -0.25, 0.536], [0.714, -0.25, -2.214], [0.893, -0.25, 0.893]], texturecontrol: DARK_RED});

    solid.addPolygon({depth: 0.001, coords: [[-0.6, 0.2], [-1.4, -0.2], [1.4, -0.2], [0.6, 0.2]], position: lFromXYZ(0, 0.1, 1.429), texturecontrol: RED});

    return [gdef, struct, solid];
}

class Constrictor extends BadAssBase {
    constructor()
    {
    // Width = -1.929 to 1.929,  Length = -2.857 to 1.429,   Width = 3.858, Length = 4.2860000000000005, MP = -0.7140000000000002
    // Bottom: -0.25, CenterY 0.10700000000000004, CenterZ -0.7140000000000002
    
    
        super();
        this.description = "Constrictor";
        this.slotsize = SLOTSIZE_8_5;
        this.centerz = -0.714;
        this.centery = 0.107;
        this.bottom = 0.255;
        var struct = structures.constrictor;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[2], this);

        this.width = 1.7;
    
        this.bangsize = 30;
        this.cargospill = 3;
        this.alloys = 1;
        this.nummissiles = 6;

        this.acceleration = 5;
        this.maxvelocity = 20;
        this.accelroll = 1;
        this.accelpitch = 1;
        this.maxvelroll = 1;
        this.maxvelpitch = 1;
    
        this.shields = 110;
        this.maxshields = 110;
        this.integrity = 110;
        this.maxintegrity = 110;
        this.rechargerate = 1.1;

        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}

function cougarDef()
{
    var gdef = new LGroupDef({collision: LDYNAMIC, distance: 3.0});
    var struct = new LStructureDef(ShaderShip, {shininess: -1, colors: COLORS, collision: LNONE});
    var solid = new LStructureDef(ShaderSolid, {shininess: -1, colors: COLORS, collision: LNONE});

    struct.addWTrianglePatch({coords: [[2.0, 0.0, 2.0], [1.0, 0.0, -2.0], [-0.0, 0.25, -3.35]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[2.0, 0.0, 2.0], [-0.0, 0.25, -3.35], [-0.0, 0.7, 2.0]], texturecontrol: GREY_1});
    struct.addWTrianglePatch({coords: [[-0.0, -0.7, 2.0], [1.0, 0.0, -2.0], [2.0, 0.0, 2.0]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-0.0, -0.7, 2.0], [-1.0, 0.0, -2.0], [-0.0, 0.25, -3.35]], texturecontrol: GREY_4});
    struct.addWTrianglePatch({coords: [[-0.0, -0.7, 2.0], [-0.0, 0.25, -3.35], [1.0, 0.0, -2.0]], texturecontrol: GREY_4});
    struct.addWTrianglePatch({coords: [[-2.0, 0.0, 2.0], [-1.0, 0.0, -2.0], [-0.0, -0.7, 2.0]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.0, 0.0, -2.0], [-2.0, 0.0, 2.0], [-0.0, 0.7, 2.0]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-1.0, 0.0, -2.0], [-0.0, 0.7, 2.0], [-0.0, 0.25, -3.35]], texturecontrol: GREY_2});
    struct.addWTrianglePatch({coords: [[-2.0, 0.0, 2.0], [-0.0, -0.7, 2.0], [2.0, 0.0, 2.0]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[-2.0, 0.0, 2.0], [2.0, 0.0, 2.0], [-0.0, 0.7, 2.0]], texturecontrol: GREY_3});
    struct.addWTrianglePatch({coords: [[1.0, 0.0, -2.0], [2.0, 0.0, 2.0], [3.0, 0.0, 1.0]], texturecontrol: YELLOW_1});
    struct.addWTrianglePatch({coords: [[1.0, 0.0, -2.0], [3.0, 0.0, 1.0], [1.8, 0.0, -2.8]], texturecontrol: YELLOW_1});
    solid.addWTrianglePatch({coords: [[1.8, 0.0, -2.8], [3.0, 0.0, 1.0], [2.0, 0.0, 2.0]], texturecontrol: YELLOW_1});
    solid.addWTrianglePatch({coords: [[1.8, 0.0, -2.8], [2.0, 0.0, 2.0], [1.0, 0.0, -2.0]], texturecontrol: YELLOW_1});
    solid.addWTrianglePatch({coords: [[-1.0, 0.0, -2.0], [-2.0, 0.0, 2.0], [-3.0, 0.0, 1.0]], texturecontrol: YELLOW_1});
    solid.addWTrianglePatch({coords: [[-1.0, 0.0, -2.0], [-3.0, 0.0, 1.0], [-1.8, 0.0, -2.8]], texturecontrol: YELLOW_1});
    solid.addWTrianglePatch({coords: [[-1.8, 0.0, -2.8], [-3.0, 0.0, 1.0], [-2.0, 0.0, 2.0]], texturecontrol: YELLOW_1});
    solid.addWTrianglePatch({coords: [[-1.8, 0.0, -2.8], [-2.0, 0.0, 2.0], [-1.0, 0.0, -2.0]], texturecontrol: YELLOW_1});
    struct.addWTrianglePatch({coords: [[-0.0, 0.4, -1.25], [0.6, 0.1, -2.25], [-0.0, 0.35, -1.75]], texturecontrol: BLUE_3});
    struct.addWTrianglePatch({coords: [[-0.0, 0.35, -1.75], [-0.6, 0.1, -2.25], [-0.0, 0.4, -1.25]], texturecontrol: BLUE_2});

    solid.addPolygon({depth: 0.001, coords: [[0, -0.4], [1.2, 0], [0, 0.4], [-1.2, 0]], position: lFromXYZ(0, 0, 2.0), texturecontrol: RED, hold: [LI_FRONT]});

    return [gdef, struct, solid];
}

class Cougar extends JohnDoeBase {
    constructor()
    {
    // Width = -3.0 to 3.0,  Length = -3.35 to 2.0,   Width = 6.0, Length = 5.35, MP = -0.6749999999999998
    // Bottom: -0.7, CenterY 0.0, CenterZ -0.6749999999999998
    
    
        super();
        this.description = "Cougar";
        this.slotsize = SLOTSIZE_8_15;
        this.centerz = -0.675;
        this.centery = 0.0;
        this.bottom = 0.705;
        var struct = structures.cougar;
        this.obj = new LWObject(struct[0], this);
        var bobj = new LObject(struct[1], this);
        var sobj = new LObject(struct[1], this);
        this.bangsize = 50;
        this.cargospill = 4;
        this.alloys = 2;
        this.nummissiles = 6;

        this.width = 1.5;
    
        this.acceleration = 5;
        this.maxvelocity = 20;
        this.accelroll = 1;
        this.accelpitch = 1;
        this.maxvelroll = 1;
        this.maxvelpitch = 1;

        this.shields = 110;
        this.maxshields = 110;
        this.integrity = 110;
        this.maxintegrity = 110;
        this.rechargerate = 1.1;

        this.obj.addChild(bobj, mat4.create());
        this.obj.addChild(sobj, mat4.create());
        lScene.lPlace(this.obj, mat4.create());
        this.postinit();
    }
}


function dodecDef()
{
    var gdef = new LGroupDef({collision: LSTATIC});
    var struct = new LStructureDef(ShaderSimple, {shininess: -1, colors: COLORS, collision: LSTATIC});
    var istruct = new LStructureDef(ShaderSolid, {colors: COLORS, collision: LNONE});

    struct.useCorners([[-44, -44, -37], [44, 44, 37]], {});

    struct.addTrianglePatch({coords: [[0, 28.302], [-4, 1.6], [4, 1.6]], position: lFromXYZ(0, 0, 36.981), texturecontrol: GREY_4, corners: null});
    struct.addTrianglePatch({coords: [[26.981, 8.679], [0, 28.302], [4, 1.6]], position: lFromXYZ(0, 0, 36.981), texturecontrol: GREY_4, corners: null});
    struct.addTrianglePatch({coords: [[-26.981, 8.679], [-4, 1.6], [0, 28.302]], position: lFromXYZ(0, 0, 36.981), texturecontrol: GREY_4, corners: null});

    struct.addPolygonPatch({coords: [[-4, -1.6], [-16.604, -22.83], [16.604, -22.83], [4, -1.6]], position: lFromXYZ(0, 0, 36.981), texturecontrol: GREY_4, corners: null});
    struct.addPolygonPatch({coords: [[-16.604, -22.83], [-4, -1.6],[-4, 1.6], [-26.981, 8.679]], position: lFromXYZ(0, 0, 36.981), texturecontrol: GREY_4, corners: null});
    struct.addPolygonPatch({coords: [[4, -1.6], [16.604, -22.83], [26.981, 8.679], [4, 1.6]], position: lFromXYZ(0, 0, 36.981), texturecontrol: GREY_4, corners: null});


    struct.addWTrianglePatch({coords: [[43.585, 14.151, 8.679], [26.981, 36.981, -8.679], [0.0, 45.849, 8.679]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[43.585, 14.151, 8.679], [0.0, 45.849, 8.679], [0.0, 28.302, 36.981]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[43.585, 14.151, 8.679], [0.0, 28.302, 36.981], [26.981, 8.679, 36.981]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[26.981, -36.981, 8.679], [43.585, -14.151, -8.679], [43.585, 14.151, 8.679]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[26.981, -36.981, 8.679], [43.585, 14.151, 8.679], [26.981, 8.679, 36.981]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[26.981, -36.981, 8.679], [26.981, 8.679, 36.981], [16.604, -22.83, 36.981]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-26.981, -36.981, 8.679], [0.0, -45.849, -8.679], [26.981, -36.981, 8.679]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-26.981, -36.981, 8.679], [26.981, -36.981, 8.679], [16.604, -22.83, 36.981]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-26.981, -36.981, 8.679], [16.604, -22.83, 36.981], [-16.604, -22.83, 36.981]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-43.585, 14.151, 8.679], [-43.585, -14.151, -8.679], [-26.981, -36.981, 8.679]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[-43.585, 14.151, 8.679], [-26.981, -36.981, 8.679], [-16.604, -22.83, 36.981]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[-43.585, 14.151, 8.679], [-16.604, -22.83, 36.981], [-26.981, 8.679, 36.981]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 45.849, 8.679], [-26.981, 36.981, -8.679], [-43.585, 14.151, 8.679]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 45.849, 8.679], [-43.585, 14.151, 8.679], [-26.981, 8.679, 36.981]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 45.849, 8.679], [-26.981, 8.679, 36.981], [0.0, 28.302, 36.981]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[16.604, 22.83, -36.981], [-16.604, 22.83, -36.981], [-26.981, 36.981, -8.679]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[16.604, 22.83, -36.981], [-26.981, 36.981, -8.679], [0.0, 45.849, 8.679]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[16.604, 22.83, -36.981], [0.0, 45.849, 8.679], [26.981, 36.981, -8.679]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[26.981, -8.679, -36.981], [16.604, 22.83, -36.981], [26.981, 36.981, -8.679]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[26.981, -8.679, -36.981], [26.981, 36.981, -8.679], [43.585, 14.151, 8.679]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[26.981, -8.679, -36.981], [43.585, 14.151, 8.679], [43.585, -14.151, -8.679]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -28.302, -36.981], [26.981, -8.679, -36.981], [43.585, -14.151, -8.679]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -28.302, -36.981], [43.585, -14.151, -8.679], [26.981, -36.981, 8.679]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -28.302, -36.981], [26.981, -36.981, 8.679], [0.0, -45.849, -8.679]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[-26.981, -8.679, -36.981], [0.0, -28.302, -36.981], [0.0, -45.849, -8.679]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-26.981, -8.679, -36.981], [0.0, -45.849, -8.679], [-26.981, -36.981, 8.679]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-26.981, -8.679, -36.981], [-26.981, -36.981, 8.679], [-43.585, -14.151, -8.679]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-16.604, 22.83, -36.981], [-26.981, -8.679, -36.981], [-43.585, -14.151, -8.679]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-16.604, 22.83, -36.981], [-43.585, -14.151, -8.679], [-43.585, 14.151, 8.679]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-16.604, 22.83, -36.981], [-43.585, 14.151, 8.679], [-26.981, 36.981, -8.679]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-16.604, 22.83, -36.981], [16.604, 22.83, -36.981], [26.981, -8.679, -36.981]], texturecontrol: lTextureColor(256, 237), corners: null});
    struct.addWTrianglePatch({coords: [[-16.604, 22.83, -36.981], [26.981, -8.679, -36.981], [0.0, -28.302, -36.981]], texturecontrol: lTextureColor(256, 237), corners: null});
    struct.addWTrianglePatch({coords: [[-16.604, 22.83, -36.981], [0.0, -28.302, -36.981], [-26.981, -8.679, -36.981]], texturecontrol: lTextureColor(256, 237), corners: null});



    // Internal


    struct.addBlock({size: [4, 0.003, 3.75], position: lFromXYZ(0, 1.6, 33.75), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [4, 0.003, 3.75], position: lFromXYZ(0, -1.6, 33.75), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.003, 1.6, 3.75], position: lFromXYZ(-4, 0, 33.75), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.003, 1.6, 3.75], position: lFromXYZ(4, 0, 33.75), texturecontrol: GREY_1, corners: null});


    // Add traffic light holders
    struct.addBlock({size: [0.5195, 0.5195, 0.6], position: lFromXYZ(4.52, 2.12, 36.9), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.6], position: lFromXYZ(0, 2.12, 36.9), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.6], position: lFromXYZ(-4.52, 2.12, 36.9), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.6], position: lFromXYZ(4.52, -2.12, 36.9), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.6], position: lFromXYZ(0, -2.12, 36.9), texturecontrol: GREY_1, corners: null});
    struct.addBlock({size: [0.5195, 0.5195, 0.6], position: lFromXYZ(-4.52, -2.12, 36.9), texturecontrol: GREY_1, corners: null});
    // Add traffic lights by having three different objects and changing visibility
    const redlight = new LStructureDef(ShaderSolid, {color: [1.0, 0.5, 0.5, 1.0], collision: LNONE});
    const yellowlight = new LStructureDef(ShaderSolid, {color: [1.0, 1.0, 0.0, 1.0], collision: LNONE});
    const greenlight = new LStructureDef(ShaderSolid, {color: [0.5, 1.0, 0.5, 1.0], collision: LNONE});

    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, -2.12, 37.5)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, 2.12, 37.5)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, -2.12, 37.5)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, 2.12, 37.5)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, -2.12, 37.5)});
    redlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, 2.12, 37.5)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, -2.12, 37.5)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, 2.12, 37.5)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, -2.12, 37.5)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, 2.12, 37.5)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, -2.12, 37.5)});
    yellowlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, 2.12, 37.5)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, -2.12, 37.5)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(4.52, 2.12, 37.5)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, -2.12, 37.5)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(-4.52, 2.12, 37.5)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, -2.12, 37.5)});
    greenlight.addCylinder({depth: 0.1, radius: 0.5, position: lFromXYZ(0, 2.12, 37.5)});
    return  [gdef, struct, istruct, greenlight, yellowlight, redlight]
}

class Dodec extends StationBase {
    constructor()
    {
        super(structures.dodec, structures.stasides);
        this.launchpoint = 50;
        this.description = "Dodecahendron Station";
    }
}


function minidodecDef()
{
    var struct = new LStructureDef(ShaderPlanet, {shininess: -1, colors: COLORS, collision: LNONE});
    struct.addWTrianglePatch({coords: [[-1.66, -2.283, 3.698], [1.66, -2.283, 3.698], [2.698, 0.868, 3.698]], texturecontrol: lTextureColor(256, 237), corners: null});
    struct.addWTrianglePatch({coords: [[-1.66, -2.283, 3.698], [2.698, 0.868, 3.698], [0.0, 2.83, 3.698]], texturecontrol: lTextureColor(256, 237), corners: null});
    struct.addWTrianglePatch({coords: [[-1.66, -2.283, 3.698], [0.0, 2.83, 3.698], [-2.698, 0.868, 3.698]], texturecontrol: lTextureColor(256, 237), corners: null});
    struct.addWTrianglePatch({coords: [[4.358, 1.415, 0.868], [2.698, 3.698, -0.868], [0.0, 4.585, 0.868]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[4.358, 1.415, 0.868], [0.0, 4.585, 0.868], [0.0, 2.83, 3.698]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[4.358, 1.415, 0.868], [0.0, 2.83, 3.698], [2.698, 0.868, 3.698]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[2.698, -3.698, 0.868], [4.358, -1.415, -0.868], [4.358, 1.415, 0.868]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[2.698, -3.698, 0.868], [4.358, 1.415, 0.868], [2.698, 0.868, 3.698]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[2.698, -3.698, 0.868], [2.698, 0.868, 3.698], [1.66, -2.283, 3.698]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-2.698, -3.698, 0.868], [0.0, -4.585, -0.868], [2.698, -3.698, 0.868]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-2.698, -3.698, 0.868], [2.698, -3.698, 0.868], [1.66, -2.283, 3.698]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-2.698, -3.698, 0.868], [1.66, -2.283, 3.698], [-1.66, -2.283, 3.698]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-4.358, 1.415, 0.868], [-4.358, -1.415, -0.868], [-2.698, -3.698, 0.868]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[-4.358, 1.415, 0.868], [-2.698, -3.698, 0.868], [-1.66, -2.283, 3.698]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[-4.358, 1.415, 0.868], [-1.66, -2.283, 3.698], [-2.698, 0.868, 3.698]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 4.585, 0.868], [-2.698, 3.698, -0.868], [-4.358, 1.415, 0.868]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 4.585, 0.868], [-4.358, 1.415, 0.868], [-2.698, 0.868, 3.698]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 4.585, 0.868], [-2.698, 0.868, 3.698], [0.0, 2.83, 3.698]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[1.66, 2.283, -3.698], [-1.66, 2.283, -3.698], [-2.698, 3.698, -0.868]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[1.66, 2.283, -3.698], [-2.698, 3.698, -0.868], [0.0, 4.585, 0.868]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[1.66, 2.283, -3.698], [0.0, 4.585, 0.868], [2.698, 3.698, -0.868]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[2.698, -0.868, -3.698], [1.66, 2.283, -3.698], [2.698, 3.698, -0.868]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[2.698, -0.868, -3.698], [2.698, 3.698, -0.868], [4.358, 1.415, 0.868]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[2.698, -0.868, -3.698], [4.358, 1.415, 0.868], [4.358, -1.415, -0.868]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -2.83, -3.698], [2.698, -0.868, -3.698], [4.358, -1.415, -0.868]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -2.83, -3.698], [4.358, -1.415, -0.868], [2.698, -3.698, 0.868]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -2.83, -3.698], [2.698, -3.698, 0.868], [0.0, -4.585, -0.868]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[-2.698, -0.868, -3.698], [0.0, -2.83, -3.698], [0.0, -4.585, -0.868]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-2.698, -0.868, -3.698], [0.0, -4.585, -0.868], [-2.698, -3.698, 0.868]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-2.698, -0.868, -3.698], [-2.698, -3.698, 0.868], [-4.358, -1.415, -0.868]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-1.66, 2.283, -3.698], [-2.698, -0.868, -3.698], [-4.358, -1.415, -0.868]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-1.66, 2.283, -3.698], [-4.358, -1.415, -0.868], [-4.358, 1.415, 0.868]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-1.66, 2.283, -3.698], [-4.358, 1.415, 0.868], [-2.698, 3.698, -0.868]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-1.66, 2.283, -3.698], [1.66, 2.283, -3.698], [2.698, -0.868, -3.698]], texturecontrol: lTextureColor(256, 237), corners: null});
    struct.addWTrianglePatch({coords: [[-1.66, 2.283, -3.698], [2.698, -0.868, -3.698], [0.0, -2.83, -3.698]], texturecontrol: lTextureColor(256, 237), corners: null});
    struct.addWTrianglePatch({coords: [[-1.66, 2.283, -3.698], [0.0, -2.83, -3.698], [-2.698, -0.868, -3.698]], texturecontrol: lTextureColor(256, 237), corners: null});

    return struct;
}

class Minidodec extends MinistationBase {
    constructor()
    {
        super(structures.minidodec);
    }
}

function minicorriolisDef()
{
    var struct = new LStructureDef(ShaderPlanet, {shininess: -1, colors: COLORS, collision: LNONE});
    struct.addWTrianglePatch({coords: [[3.2, -3.2, 0.0], [3.2, 0.0, 3.2], [0.0, -3.2, 3.2]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[3.2, 0.0, 3.2], [3.2, 3.2, 0.0], [0.0, 3.2, 3.2]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 3.2, 3.2], [-3.2, 3.2, 0.0], [-3.2, 0.0, 3.2]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-3.2, 0.0, 3.2], [-3.2, -3.2, 0.0], [0.0, -3.2, 3.2]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[3.2, -3.2, 0.0], [0.0, -3.2, 3.2], [-3.2, -3.2, 0.0]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[3.2, -3.2, 0.0], [-3.2, -3.2, 0.0], [0.0, -3.2, -3.2]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[3.2, 0.0, -3.2], [3.2, 3.2, 0.0], [3.2, 0.0, 3.2]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[3.2, 0.0, -3.2], [3.2, 0.0, 3.2], [3.2, -3.2, 0.0]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-3.2, 0.0, -3.2], [-3.2, -3.2, 0.0], [-3.2, 0.0, 3.2]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[-3.2, 0.0, -3.2], [-3.2, 0.0, 3.2], [-3.2, 3.2, 0.0]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 3.2, 3.2], [3.2, 3.2, 0.0], [0.0, 3.2, -3.2]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 3.2, 3.2], [0.0, 3.2, -3.2], [-3.2, 3.2, 0.0]], texturecontrol: lTextureColor(256, 235), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -3.2, -3.2], [-3.2, -3.2, 0.0], [-3.2, 0.0, -3.2]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -3.2, -3.2], [3.2, 0.0, -3.2], [3.2, -3.2, 0.0]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, 3.2, -3.2], [3.2, 3.2, 0.0], [3.2, 0.0, -3.2]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[-3.2, 0.0, -3.2], [-3.2, 3.2, 0.0], [0.0, 3.2, -3.2]], texturecontrol: lTextureColor(256, 234), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -3.2, -3.2], [-3.2, 0.0, -3.2], [0.0, 3.2, -3.2]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[0.0, -3.2, -3.2], [0.0, 3.2, -3.2], [3.2, 0.0, -3.2]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[3.2, 0.0, 3.2], [0.0, 3.2, 3.2], [-3.2, 0.0, 3.2]], texturecontrol: lTextureColor(256, 248), corners: null});
    struct.addWTrianglePatch({coords: [[3.2, 0.0, 3.2], [-3.2, 0.0, 3.2], [0.0, -3.2, 3.2]], texturecontrol: lTextureColor(256, 248), corners: null});

    struct.addBlock({size: [0.4, 0.16, 0.001], position: lFromXYZ(0, 0, 3.2), texturecontrol: BLACK});
    return struct;
}

class Minicorriolis extends MinistationBase {
    constructor()
    {
        super(structures.minicorriolis);
    }
}

// SGetting structures

function eship_structures()
{
    structures.missile = missileDef();
    structures.corriolis =  corriolisDef();
    structures.escapepod = escapepodDef();
    structures.sidewinder =  sidewinderDef();
    structures.cobra3 = cobra3Def();
    structures.alloy = alloyDef();
    structures.cargo = cargoDef();
    structures.boulder = boulderDef();
    structures.asteroid = asteroidDef();
    structures.rock = rockDef();
    structures.shuttle = shuttleDef();
    structures.transporter = transporterDef();
    structures.python = pythonDef();
    structures.boa = boaDef();
    structures.anaconda = anacondaDef();
    structures.hermit = hermitDef();
    structures.viper = viperDef();
    structures.mamba = mambaDef();
    structures.krait = kraitDef();
    structures.adder = adderDef();
    structures.gecko = geckoDef();
    structures.cobra1 = cobra1Def();
    structures.worm = wormDef();
    structures.asp = aspDef();
    structures.ferdelance = ferdelanceDef();
    structures.moray = morayDef();
    structures.thargoid = thargoidDef();
    structures.thargon = thargonDef();
    structures.constrictor = constrictorDef();
    structures.cougar = cougarDef();
    structures.dodec = dodecDef();
    structures.minidodec = minidodecDef();
    structures.minicorriolis = minicorriolisDef();
    structures.stasides = stasidesDef();
}

// Utility functions fo generations

function newvbig(type)
{
    return new Boa(type);
}
function newbig(type)
{
    return new Anaconda(type);
}

function newship(type)
{
    switch (g_prng.next(9)) {
    case 0:
        return new Asp(type);
        break;
    case 1:
        return new Cobra1(type);
        break;
    case 2:
        return new Cobra3(type);
        break;
    case 3:
        return new Ferdelance(type);
        break;
    case 4:
        return new Gecko(type);
        break;
    case 5:
        return new Krait(type);
        break;
    case 6:
        return new Mamba(type);
        break;
    case 7:
        return new Python(type);
        break;
    case 8:
        return new Adder(type);
        break;
    case 9:
        return new Moray(type);
        break;
    }
}

function newfighter(ship)
{
    switch(g_prng.next(2)) {
    case 0:
        return new Sidewinder(ship);
        break;
    case 1:
        return new Worm(ship);
        break;
    }
}

function newpirate()
{
    switch (g_prng.next(8)) {
    case 0:
        return new Asp(EPIRATE);
        break;
    case 1:
        return new Cobra1(EPIRATE);
        break;
    case 2:
        return new Cobra3(EPIRATE);
        break;
    case 3:
        return new Ferdelance(EPIRATE);
        break;
    case 4:
        return new Gecko(EPIRATE);
        break;
    case 5:
        return new Krait(EPIRATE);
        break;
    case 6:
        return new Mamba(EPIRATE);
        break;
    case 7:
        return new Python(EPIRATE);
        break;
    }
}

/*
Pirate fleet
*/
function newfpirate()
{
    switch(g_prng.next(3)) {
    case 0:
        return new Gecko(EPIRATE);
        break;
    case 1:
        return new Krait(EPIRATE);
        break;
    case 2:
        return new Cobra1(EPIRATE);
        break;
    }
}

function newtransport()
{
    switch(g_prng.next(2)) {
    case 0:
        return new Shuttle(ETRANSPORT);
        break;
    case 1:
        return new Transporter(ETRANSPORT);
        break;
    }
}

function newstations(commander)
{
    if(commander.planet.techlevel >= 10) {
        var ministation = new Minidodec();
        var station = new Dodec();
    } else {
        var station = new Corriolis();
        var ministation = new Minicorriolis();
    }
    return {
        mini: ministation,
        main: station
    };
}

function newpolice() { return new Viper(EPOLICE); }
function newcargo() { return new Cargo(); }
function newescape() { return new Escapepod(); }
function newalloy() { return new Alloy(); }
function newmissile() { return new Missile(); }
function newasteroid() { return new Asteroid(); }
function newhermit() { return new Hermit(); }
function newboulder() { return new Boulder(); }
function newrock() { return new Rock(); }
function newthargoid() { return new Thargoid(); }
function newthargon() { return new Thargon(); }

// Mission specials
function newmission1() { return new Constrictor(EPIRATE); }

function newme(cockpit)
{
    let struct = structures.cobra3;
    let obj = new LObject(struct[0], cockpit);
    let bobj = new LObject(struct[1], cockpit);
    let sobj = new LObject(struct[2], cockpit);
    obj.addChild(bobj, mat4.create());
    obj.addChild(sobj, mat4.create());
    return obj;
}

function sidestruct()
{
    return structures.stasides;
}

export {eship_structures, newvbig, newbig, newship, newfighter, newpirate, newfpirate, newstations, newpolice,
        newthargoid, newthargon, 
        newhermit, newasteroid, newboulder, newrock, newcargo, newalloy, newmissile, newescape, newtransport, sidestruct, newme,
        newmission1};
