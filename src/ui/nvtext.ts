import { mat4, vec2, vec3, vec4 } from 'gl-matrix'
import { NVFont } from './nvfont.js'
import { NVRenderDimensions, ProjectedScreenObject, UIComponent, UIModelComponent } from './nvui-component.js'

export class NVScreenText implements UIComponent {
    protected font: NVFont
    public scale: number
    public text: string
    public color: number[] | Float32Array
    protected screenPosition: vec2 // 2D position on the screen
    public isVisible: boolean
    public isRenderedIn2D = true
    public isRenderedIn3D = true

    constructor(
        text: string,
        screenPosition: vec2 | number[],
        font: NVFont,
        color?: number[] | Float32Array,
        scale?: number,
    ) {
        this.text = text
        this.font = font
        this.color = color
        this.scale = scale
        this.isVisible = true
        this.screenPosition = vec2.fromValues(screenPosition[0], screenPosition[1])

    }


    getScreenPosition(): vec2 {
        return this.screenPosition
    }

    setScreenPosition(point: vec2): void {
        this.screenPosition = point
    }

    getColor(): vec4 {
        return vec4.fromValues(...(this.color as [number, number, number, number]))
    }

    setColor(color: vec4 | number[] | Float32Array): void {
        this.color = Float32Array.from(color)
    }

    public getScreenWidth(): number {
        return this.font.getTextWidth(this.scale, this.text)
    }

    public getScreenHeight(): number {
        return this.font.getTextHeight(this.scale, this.text)
    }

    // Render text on the screen (2D context)
    public render(): void {
        // console.log(`Rendering screen text: ${this.text} at position (${this.screenPosition}) with scale ${this.scale}`)
        this.font.drawText([this.screenPosition[0], this.screenPosition[1]], this.text, this.scale, this.color)
    }
}

export class NVModelText extends NVScreenText implements UIModelComponent, ProjectedScreenObject {
    private modelPosition: vec3 // 3D position in model space
    private hideDepth: number // clip space depth to hide control
    public isVisibleIn2D = false
    public isVisibleIn3D = false
    public screenDepth = -1

    constructor(
        text: string,
        font: NVFont,
        modelPosition: vec3 | number[],
        color: number[] = [1.0, 0.0, 0.0, 1.0],
        scale?: number,
        hideDepth?: number,
        isRenderedIn2D = true,
        isRenderedIn3D = true
    ) {
        super(text, vec2.create(), font, color, scale)
        this.hideDepth = hideDepth
        this.modelPosition = vec3.fromValues(modelPosition[0], modelPosition[1], modelPosition[2])
        this.isRenderedIn2D = isRenderedIn2D
        this.isRenderedIn3D = isRenderedIn3D
    }

    // NVUiComponent Interface
    // Get the 2D screen position
    public getProjectedPosition(): vec2 {
        return this.screenPosition
    }

    // Set the 2D screen position
    public setProjectedPosition(position: vec2): void {
        this.screenPosition = position
    }

    updateProjectedPosition(leftTopWidthHeight: number[], mvpMatrix: mat4): void {
        const modelPoint = this.getModelPosition()
        const clipPoint = vec4.create()
        // Multiply the 3D point by the model-view-projection matrix
        vec4.transformMat4(clipPoint, vec4.fromValues(modelPoint[0], modelPoint[1], modelPoint[2], 1.0), mvpMatrix)

        // Convert the 4D point to 2D screen coordinates
        if (clipPoint[3] !== 0.0) {
            const screenPoint = vec4.clone(clipPoint)
            screenPoint[0] = (screenPoint[0] / screenPoint[3] + 1.0) * 0.5 * leftTopWidthHeight[2]
            screenPoint[1] = (1.0 - screenPoint[1] / screenPoint[3]) * 0.5 * leftTopWidthHeight[3]
            screenPoint[2] /= screenPoint[3]

            screenPoint[0] += leftTopWidthHeight[0]
            screenPoint[1] += leftTopWidthHeight[1]

            this.screenDepth = screenPoint[2]
            this.screenPosition = vec2.fromValues(screenPoint[0], screenPoint[1])
        }
    }

    // Return the model position
    public getModelPosition(): vec3 {
        return this.modelPosition
    }

    public getHideDepth(): number {
        return this.hideDepth
    }

    public render(dimensions: NVRenderDimensions = NVRenderDimensions.NONE): void {
        if (!this.isVisible) return

        switch (dimensions) {
            case NVRenderDimensions.TWO:
                if (!this.isVisibleIn2D) {
                    return
                }
                break
            case NVRenderDimensions.THREE:
                if (!this.isVisibleIn3D) {
                    return
                }
        }

        // Render the text at its screen position
        super.render()
    }
}
