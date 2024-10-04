import { mat4, vec2, vec3, vec4 } from 'gl-matrix'
import { NVScreenText } from './nvtext.js'

export enum HorizontalAlignment {
    NONE = 'none',
    LEFT = 'left',
    RIGHT = 'right',
    CENTER = 'center'
}

export enum VerticalAlignment {
    NONE = 'none',
    TOP = 'top',
    MIDDLE = 'middle',
    BOTTOM = 'bottom'
}

export enum NVAnchorFlag {
    NONE = 0,
    LEFT = 1 << 0,
    CENTER = 1 << 1,
    RIGHT = 1 << 2,
    TOP = 1 << 3,
    MIDDLE = 1 << 4,
    BOTTOM = 1 << 5
}


export enum NVAnchorPoint {
    NONE = NVAnchorFlag.NONE,
    TOPLEFT = NVAnchorFlag.TOP | NVAnchorFlag.LEFT,
    TOPCENTER = NVAnchorFlag.TOP | NVAnchorFlag.CENTER,
    TOPRIGHT = NVAnchorFlag.TOP | NVAnchorFlag.RIGHT,
    MIDDLELEFT = NVAnchorFlag.MIDDLE | NVAnchorFlag.LEFT,
    MIDDLECENTER = NVAnchorFlag.MIDDLE | NVAnchorFlag.CENTER,
    MIDDLERIGHT = NVAnchorFlag.MIDDLE | NVAnchorFlag.RIGHT,
    BOTTOMLEFT = NVAnchorFlag.BOTTOM | NVAnchorFlag.LEFT,
    BOTTOMCENTER = NVAnchorFlag.BOTTOM | NVAnchorFlag.CENTER,
    BOTTOMRIGHT = NVAnchorFlag.BOTTOM | NVAnchorFlag.RIGHT
}

export enum NVRenderDimensions {
    NONE = 0,
    TWO = 2,
    THREE = 3
}

export interface UIComponent {
    getScreenPosition(): vec2
    setScreenPosition(point: vec2): void
    getScreenWidth(): number
    getScreenHeight(): number
    getColor(): vec4
    setColor(color: vec4): void
    isVisible: boolean
    render(dimsions?: NVRenderDimensions): void
}

export function isUIComponent(obj: any): obj is UIComponent {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof obj.getScreenPosition === 'function' &&
        typeof obj.setScreenPosition === 'function' &&
        typeof obj.getScreenWidth === 'function' &&
        typeof obj.getScreenHeight === 'function' &&
        typeof obj.getColor === 'function' &&
        typeof obj.setColor === 'function' &&
        typeof obj.isVisible === 'boolean' &&
        typeof obj.render === 'function'
    )
}

export interface UIComponentContainer {
    children: UIComponent[]
    updateChildrenProjectedPositions(leftTopWidthHeight: number[], mvpMatrix: mat4): void
}

export function isContainerComponent(obj: any): obj is UIComponentContainer {
    return obj && Array.isArray(obj.children) && typeof obj.updateChildrenScreenPositions === 'function'
}

export interface UIModelComponent {
    getModelPosition(): vec3 // model position control is attached to
    getHideDepth(): number // clip space depth to hide control
    setProjectedPosition(point: vec2): void // update points attached to model
    getProjectedPosition(): vec2 // projected position of the associated model point
    updateProjectedPosition(leftTopWidthHeight: number[], mvpMatrix: mat4)
    isRenderedIn2D: boolean
    isRenderedIn3D: boolean
    isVisibleIn2D: boolean
    isVisibleIn3D: boolean
}

export function isModelComponent(obj: any): obj is UIModelComponent {

    return obj &&
        typeof obj.getModelPosition === 'function' && typeof obj.getHideDepth === 'function' &&
        typeof obj.updateProjectedPosition === 'function' && typeof obj.isRenderedIn2D === 'boolean' &&
        typeof obj.isRenderedIn3D === 'boolean' && typeof obj.setProjectedPosition === 'function' &&
        typeof obj.getProjectedPosition === 'function'
}

export interface AlignableComponent {
    align(): void
}

export function isAlignableComponent(obj: any): obj is AlignableComponent {
    return obj && typeof obj.align === 'function'
}

export interface AnchoredComponent extends UIComponent {
    anchor(): void
}

export function isAnchoredComponent(obj: any): obj is AlignableComponent {
    return obj && typeof obj.anchor === 'function'
}

export interface ProjectedScreenObject extends UIComponent {
    screenDepth: number
}

export function isProjectedScreenObject(obj: any): obj is ProjectedScreenObject {
    return (
        typeof obj.screenDepth === 'number' &&
        isUIComponent(obj)
    )
}
