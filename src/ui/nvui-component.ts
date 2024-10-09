import { mat4, vec2, vec3, vec4 } from 'gl-matrix'

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
    isVisible: boolean
    render(dimensions?: NVRenderDimensions): void

    // Moved from UIModelComponent
    isRenderedIn2D: boolean
    isRenderedIn3D: boolean
}

export function isUIComponent(obj: any): obj is UIComponent {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof obj.getScreenPosition === 'function' &&
        typeof obj.setScreenPosition === 'function' &&
        typeof obj.getScreenWidth === 'function' &&
        typeof obj.getScreenHeight === 'function' &&
        typeof obj.isVisible === 'boolean' &&
        typeof obj.isRenderedIn2D === 'boolean' &&
        typeof obj.isRenderedIn3D === 'boolean' &&
        typeof obj.render === 'function'
    )
}

// New interface for components that support color operations
export interface ColorableComponent {
    getColor(): vec4
    setColor(color: vec4): void
}

// Type guard for ColorableComponent
export function isColorableComponent(obj: any): obj is ColorableComponent {
    return (
        obj &&
        typeof obj.getColor === 'function' &&
        typeof obj.setColor === 'function'
    )
}

export interface UIComponentContainer {
    children: UIComponent[]
    updateChildrenProjectedPositions(leftTopWidthHeight: number[], mvpMatrix: mat4): void
}

export function isContainerComponent(obj: any): obj is UIComponentContainer {
    return obj && Array.isArray(obj.children)
}

export interface UIModelComponent {
    getModelPosition(): vec3 // Model position control is attached to
    getHideDepth(): number // Clip space depth to hide control
    setProjectedPosition(point: vec2): void // Update points attached to model
    getProjectedPosition(): vec2 // Projected position of the associated model point
    updateProjectedPosition(leftTopWidthHeight: number[], mvpMatrix: mat4)
    isVisibleIn2D: boolean
    isVisibleIn3D: boolean
}

export function isModelComponent(obj: any): obj is UIModelComponent {
    return (
        obj &&
        typeof obj.getModelPosition === 'function' &&
        typeof obj.getHideDepth === 'function' &&
        typeof obj.updateProjectedPosition === 'function' &&
        typeof obj.isVisibleIn2D === 'boolean' &&
        typeof obj.isVisibleIn3D === 'boolean' &&
        typeof obj.setProjectedPosition === 'function' &&
        typeof obj.getProjectedPosition === 'function'
    )
}

export interface AlignableComponent {
    align(dimensions: NVRenderDimensions, leftTopWidthHeight: number[]): void
}

export function isAlignableComponent(obj: any): obj is AlignableComponent {
    return obj && typeof obj.align === 'function'
}

export interface AnchoredComponent extends UIComponent {
    topLeftAnchor: NVAnchorPoint
    bottomRightAnchor: NVAnchorPoint
}

export function isAnchoredComponent(obj: any): obj is AnchoredComponent {
    return obj && obj.topLeftAnchor !== undefined && obj.bottomRightAnchor !== undefined
}

export interface ProjectedScreenObject extends UIComponent {
    screenDepth: number
}

export function isProjectedScreenObject(obj: any): obj is ProjectedScreenObject {
    return typeof obj.screenDepth === 'number' && isUIComponent(obj)
}

export function getProjectedPosition(position: vec3, leftTopWidthHeight: number[], mvpMatrix: mat4): vec3 {
    const clipPoint = vec4.create()
    // Multiply the 3D point by the model-view-projection matrix
    vec4.transformMat4(clipPoint, vec4.fromValues(position[0], position[1], position[2], 1.0), mvpMatrix)
    const projectedPoint = vec3.create()
    // Convert the 4D point to 2D screen coordinates
    if (clipPoint[3] !== 0.0) {
        const screenPoint = vec4.clone(clipPoint)
        screenPoint[0] = (screenPoint[0] / screenPoint[3] + 1.0) * 0.5 * leftTopWidthHeight[2]
        screenPoint[1] = (1.0 - screenPoint[1] / screenPoint[3]) * 0.5 * leftTopWidthHeight[3]
        screenPoint[2] /= screenPoint[3]

        screenPoint[0] += leftTopWidthHeight[0]
        screenPoint[1] += leftTopWidthHeight[1]

        projectedPoint[0] = screenPoint[0]
        projectedPoint[1] = screenPoint[1]
        projectedPoint[2] = screenPoint[2]
    }
    else {
        projectedPoint[0] = -1
        projectedPoint[1] = -1
        projectedPoint[2] = -1
    }
    return projectedPoint
}

export interface AnchorBoundComponent extends UIComponent {
    setTopLeftScreenPosition(position: vec2): void
    setBottomRightScreenPosition(position: vec2): void
}

export function isAnchorBoundComponent(obj: any): obj is AnchorBoundComponent {
    return (
        obj &&
        typeof obj.setTopLeftScreenPosition === 'function' &&
        typeof obj.setBottomRightScreenPosition === 'function'
    )
}

export function anchorComponents(leftTopWidthHeight: number[], components: UIComponent[]): void {
    const left = leftTopWidthHeight[0]
    const top = leftTopWidthHeight[1]
    const width = leftTopWidthHeight[2]
    const height = leftTopWidthHeight[3]
    const right = left + width
    const bottom = top + height

    for (const component of components) {
        if (isAnchoredComponent(component) && isAnchorBoundComponent(component)) {
            let topLeftPosition: vec2 = vec2.create()
            switch (component.topLeftAnchor) {
                case NVAnchorPoint.TOPLEFT:
                    topLeftPosition = vec2.fromValues(left, top)
                    break
                case NVAnchorPoint.TOPCENTER:
                    topLeftPosition = vec2.fromValues((left + right) / 2, top)
                    break
                case NVAnchorPoint.TOPRIGHT:
                    topLeftPosition = vec2.fromValues(right, top)
                    break
                case NVAnchorPoint.MIDDLELEFT:
                    topLeftPosition = vec2.fromValues(left, (top + bottom) / 2)
                    break
                case NVAnchorPoint.MIDDLECENTER:
                    topLeftPosition = vec2.fromValues((left + right) / 2, (top + bottom) / 2)
                    break
                case NVAnchorPoint.MIDDLERIGHT:
                    topLeftPosition = vec2.fromValues(right, (top + bottom) / 2)
                    break
                case NVAnchorPoint.BOTTOMLEFT:
                    topLeftPosition = vec2.fromValues(left, bottom)
                    break
                case NVAnchorPoint.BOTTOMCENTER:
                    topLeftPosition = vec2.fromValues((left + right) / 2, bottom)
                    break
                case NVAnchorPoint.BOTTOMRIGHT:
                    topLeftPosition = vec2.fromValues(right, bottom)
                    break
                default:
                    break
            }

            if (component.bottomRightAnchor === NVAnchorPoint.NONE) {
                component.setScreenPosition(topLeftPosition)
            } else {
                let bottomRightPosition: vec2 = vec2.create()
                switch (component.bottomRightAnchor) {
                    case NVAnchorPoint.TOPLEFT:
                        bottomRightPosition = vec2.fromValues(left, top)
                        break
                    case NVAnchorPoint.TOPCENTER:
                        bottomRightPosition = vec2.fromValues((left + right) / 2, top)
                        break
                    case NVAnchorPoint.TOPRIGHT:
                        bottomRightPosition = vec2.fromValues(right, top)
                        break
                    case NVAnchorPoint.MIDDLELEFT:
                        bottomRightPosition = vec2.fromValues(left, (top + bottom) / 2)
                        break
                    case NVAnchorPoint.MIDDLECENTER:
                        bottomRightPosition = vec2.fromValues((left + right) / 2, (top + bottom) / 2)
                        break
                    case NVAnchorPoint.MIDDLERIGHT:
                        bottomRightPosition = vec2.fromValues(right, (top + bottom) / 2)
                        break
                    case NVAnchorPoint.BOTTOMLEFT:
                        bottomRightPosition = vec2.fromValues(left, bottom)
                        break
                    case NVAnchorPoint.BOTTOMCENTER:
                        bottomRightPosition = vec2.fromValues((left + right) / 2, bottom)
                        break
                    case NVAnchorPoint.BOTTOMRIGHT:
                        bottomRightPosition = vec2.fromValues(right, bottom)
                        break
                    default:
                        break
                }

                component.setTopLeftScreenPosition(topLeftPosition)
                component.setBottomRightScreenPosition(bottomRightPosition)
            }
        }
    }
}
