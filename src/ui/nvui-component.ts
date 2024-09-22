import { vec2, vec3 } from 'gl-matrix'

export interface NVUIComponent {
    getScreenPosition(): vec2
    setScreenPosition(point: vec2): void
    getScreenWidth(): number
    getScreenHeight(): number
    isVisible: boolean
    render(): void
}

export interface NVUIComponentContainer {
    children: NVUIComponent[]
}

export function isContainerComponent(obj: any): obj is NVUIComponentContainer {
    return obj && Array.isArray(obj.children)
}

export interface NVUIModelComponent extends NVUIComponent {
    getModelPosition(): vec3 // model position control is attached to
    getHideDepth(): number // clip space depth to hide control
    updateProjectedPosition(point: vec2): void // update points attached to model
}

export function isModelComponent(obj: any): obj is NVUIModelComponent {
    return obj && typeof obj.getModelPosition === 'function' && typeof obj.getHideDepth === 'function';
}
