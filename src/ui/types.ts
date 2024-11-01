// types.ts

import { vec2, vec3, vec4 } from 'gl-matrix'

// Define Color type for clarity
export type Color = [number, number, number, number] | Float32List

// Define Vec2, Vec3, and Vec4 types
export type Vec2 = vec2 | [number, number]
export type Vec3 = vec3 | [number, number, number]
export type Vec4 = vec4 | [number, number, number, number]

// LineTerminator enum
export enum LineTerminator {
    NONE = 0,
    ARROW = 1,
    CIRCLE = 2,
    RING = 3
}
