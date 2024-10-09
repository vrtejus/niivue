import { mat4, vec2, vec3 } from 'gl-matrix'
import { getProjectedPosition, UIModelComponent, ProjectedScreenObject, NVRenderDimensions } from './nvui-component.js'
import { NVScreenText } from './nvtext.js'
import { NVModelLine } from './nvline.js'
import { NVFont } from './nvfont.js'

export class NVLabelLine extends NVScreenText implements UIModelComponent, ProjectedScreenObject {
    private modelPosition: vec3 // 3D position in model space
    private hideDepth: number // clip space depth to hide control
    private modelLine: NVModelLine

    // Properties required for the ProjectedScreenObject interface
    public screenDepth: number = -1.0
    public isVisibleIn2D: boolean = true
    public isVisibleIn3D: boolean = true
    public isRenderedIn2D: boolean = true
    public isRenderedIn3D: boolean = true

    constructor(
        gl: WebGL2RenderingContext,
        text: string,
        font: NVFont,
        screenPosition: vec2,
        modelPosition: vec3 | number[],
        color: number[] = [1.0, 0.0, 0.0, 1.0],
        scale?: number,
        thickness?: number,
        hideDepth?: number
    ) {
        super(text, screenPosition, font, color, scale)
        this.hideDepth = hideDepth ?? -1.0
        this.modelPosition = vec3.fromValues(modelPosition[0], modelPosition[1], modelPosition[2])
        this.modelLine = new NVModelLine(gl, screenPosition, this.modelPosition, thickness, color, hideDepth)
    }

    // Return the model position
    public getModelPosition(): vec3 {
        return this.modelPosition
    }

    public getHideDepth(): number {
        return this.hideDepth
    }

    public getProjectedPosition(): vec2 {
        return this.modelLine.getEnd()
    }

    public setProjectedPosition(position: vec2): void {
        // Update the end point of the model line only
        this.modelLine.setEnd(position)
        // Update the line start point based on the new projected position
        this.updateLineStartPoint()
    }

    // Update the projected position using the given transformation matrix and screen dimensions
    public updateProjectedPosition(leftTopWidthHeight: number[], mvpMatrix: mat4): void {
        const projectedPoint = getProjectedPosition(this.modelPosition, leftTopWidthHeight, mvpMatrix)
        this.setProjectedPosition(vec2.fromValues(projectedPoint[0], projectedPoint[1]))

        // Set the screen depth based on the projected Z value
        this.screenDepth = projectedPoint[2]

        // Update the line start point based on the new projected position
        this.updateLineStartPoint()
    }

    public setScreenPosition(position: vec2): void {
        // Update the screen position of the label and adjust the line start point based on the label's bounding box
        super.setScreenPosition(position)
        this.updateLineStartPoint()
    }

    private updateLineStartPoint(): void {
        const textPosition = this.getScreenPosition()
        const labelWidth = this.getScreenWidth()
        const labelHeight = this.getScreenHeight()
        const lineEnd = this.modelLine.getEnd()

        const lineStart = vec2.clone(textPosition)

        // Determine where the line should start based on the relationship of lineEnd to the label
        if (lineEnd[1] > textPosition[1] + labelHeight) {
            // End point is below the label, start from bottom middle of label
            lineStart[1] = textPosition[1] + labelHeight
        } else if (lineEnd[1] < textPosition[1]) {
            // End point is above the label, start from top middle of label
            lineStart[1] = textPosition[1]
        } else {
            // End point is in line with the label vertically, start from middle height of label
            lineStart[1] = textPosition[1] + labelHeight / 2
        }

        if (lineEnd[0] > textPosition[0] + labelWidth) {
            // End point is to the right of the label, start from right edge of label
            lineStart[0] = textPosition[0] + labelWidth
        } else if (lineEnd[0] < textPosition[0]) {
            // End point is to the left of the label, start from left edge of label
            lineStart[0] = textPosition[0]
        } else {
            // End point is in line with the label horizontally, start from middle width of label
            lineStart[0] = textPosition[0] + labelWidth / 2
        }

        // Set the updated start position to the model line
        this.modelLine.setStart(lineStart)
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

        // Render the model line from the start point to the projected end point
        this.modelLine.render(dimensions)

        // Render the label text at its screen position
        super.render()
    }
}
