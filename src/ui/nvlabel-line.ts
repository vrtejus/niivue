import { NVDrawer } from './nvdrawer.js'
import { NVFont } from './nvfont.js'
import { vec2, vec3, vec4, mat4 } from 'gl-matrix'
import { UIModelComponent, ProjectedScreenObject, NVRenderDimensions } from './nvui-component.js'

export class NVLabelLine implements UIModelComponent, ProjectedScreenObject {
    public isVisible: boolean = true // Visibility flag for ProjectedScreenObject
    private modelPosition: vec3
    private screenPosition: vec2 // 2D screen position where the text will be rendered
    private projectedPosition: vec2 // 2D projected position where the line will be drawn to
    private drawer: NVDrawer // NVDrawer instance for rendering
    public text: string // The label text
    public isVisibleIn2D: boolean = false
    public isVisibleIn3D: boolean = false
    public font: NVFont
    public screenDepth: number = -1 // Depth value for occlusion

    constructor(
        gl: WebGL2RenderingContext,
        text: string,
        font: NVFont,
        screenPosition: vec2,
        modelPosition: vec3 | number[],
        private color: number[] = [1.0, 0.0, 0.0, 1.0], // Default color (red)
        public scale: number = 1.0,
        public thickness: number = 1.0,
        public hideDepth: number = 0.1,
        private backgroundColor: number[] = [0, 0, 0, 0.2], // Default background color (semi-transparent black)
        private margin: number = 5, // Default margin for text positioning
        public isRenderedIn2D: boolean = true, // Render flag for 2D
        public isRenderedIn3D: boolean = true // Render flag for 3D
    ) {
        this.drawer = new NVDrawer(gl)
        this.text = text
        this.font = font
        this.screenPosition = vec2.clone(screenPosition)
        this.projectedPosition = vec2.clone(screenPosition) // Initially set projected position to screen position
        this.modelPosition = vec3.fromValues(modelPosition[0], modelPosition[1], modelPosition[2])
    }

    // Getters and setters for positions and scaling
    getScreenPosition(): vec2 {
        return this.screenPosition
    }

    setScreenPosition(position: vec2): void {
        vec2.copy(this.screenPosition, position)
    }

    getModelPosition(): vec3 {
        return this.modelPosition
    }

    getProjectedPosition(): vec2 {
        return this.projectedPosition
    }

    setProjectedPosition(position: vec2): void {
        vec2.copy(this.projectedPosition, position)
    }

    getHideDepth(): number {
        return this.hideDepth
    }

    // Getters for the width and height of the label and its enclosing rectangle
    getScreenWidth(): number {
        console.log('margin is ' + this.margin)
        return this.font.getTextWidth(this.scale, this.text) + 2 * this.margin
    }

    getScreenHeight(): number {
        return this.font.getTextHeight(this.scale, this.text) + 2 * this.margin
    }

    updateProjectedPosition(leftTopWidthHeight: number[], mvpMatrix: mat4): void {
        // Calculate the new screen position using the mvpMatrix
        const newScreenPosition = vec2.create()
        const projected = vec4.create()
        vec4.transformMat4(projected, vec4.fromValues(this.modelPosition[0], this.modelPosition[1], this.modelPosition[2], 1.0), mvpMatrix)

        if (projected[3] !== 0) {
            newScreenPosition[0] = (projected[0] / projected[3] + 1) * 0.5 * leftTopWidthHeight[2] + leftTopWidthHeight[0]
            newScreenPosition[1] = (1 - projected[1] / projected[3]) * 0.5 * leftTopWidthHeight[3] + leftTopWidthHeight[1]
            this.screenDepth = projected[2] / projected[3]
        }

        this.setProjectedPosition(newScreenPosition)
    }

    // Render the label and the line using NVDrawer
    render(dimensions: NVRenderDimensions = NVRenderDimensions.NONE): void {
        // Check if the label should be rendered based on visibility
        if (!this.isVisibleIn2D && dimensions === NVRenderDimensions.TWO) return
        if (!this.isVisibleIn3D && dimensions === NVRenderDimensions.THREE) return
        const endPoint = this.projectedPosition
        const startPoint = vec2.clone(this.screenPosition)
        const rectWidth = this.getScreenWidth() // Width of the rectangle enclosing the text
        const rectHeight = this.getScreenHeight() // Height of the rectangle enclosing the text

        let edgeMidPoints = [
            vec2.fromValues(this.screenPosition[0] + rectWidth / 2, this.screenPosition[1]), // Top edge midpoint
            vec2.fromValues(this.screenPosition[0] + rectWidth / 2, this.screenPosition[1] + rectHeight), // Bottom edge midpoint
            vec2.fromValues(this.screenPosition[0], this.screenPosition[1] + rectHeight / 2), // Left edge midpoint
            vec2.fromValues(this.screenPosition[0] + rectWidth, this.screenPosition[1] + rectHeight / 2) // Right edge midpoint
        ]
        let lineStartPoint = edgeMidPoints[0]
        let minDistance = vec2.distance(lineStartPoint, this.projectedPosition)
        for (let i = 1; i < edgeMidPoints.length; i++) {
            const distance = vec2.distance(edgeMidPoints[i], this.projectedPosition)
            if (distance < minDistance) {
                minDistance = distance
                lineStartPoint = edgeMidPoints[i]
            }
        }

        // Draw the connecting line
        this.drawer.drawLine(
            [lineStartPoint[0], lineStartPoint[1], endPoint[0], endPoint[1]],
            this.thickness, // Line thickness
            this.color as [number, number, number, number]
        )

        // Render the background rect at the start point
        this.drawer.drawRect(
            [startPoint[0], startPoint[1], rectWidth, rectHeight],
            this.backgroundColor as [number, number, number, number]
        )

        const descenderDepth = this.font.getDescenderDepth(this.scale, this.text)
        console.log('descender depth', descenderDepth)
        // Adjust the position of the text with a margin, ensuring it's vertically centered
        const textPosition = [
            this.screenPosition[0] + this.margin,
            this.screenPosition[1] + this.margin + descenderDepth
        ]

        // Render the text
        this.font.drawText(textPosition, this.text, this.scale, this.color)
    }
}