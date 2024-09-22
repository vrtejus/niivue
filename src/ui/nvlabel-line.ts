import { NVFont } from './nvfont.js'
import { vec2, vec3 } from 'gl-matrix'
import { NVUIModelComponent } from './nvui-component.js'
import { NVScreenText } from './nvtext.js'
import { NVModelLine } from './nvline.js'

export class NVLabelLine extends NVScreenText implements NVUIModelComponent {
    private modelPosition: vec3 // 3D position in model space
    private hideDepth: number // clip space depth to hide control
    private modelLine: NVModelLine

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
        this.hideDepth = hideDepth
        this.modelLine = new NVModelLine(gl, screenPosition, modelPosition, thickness, color, hideDepth)
        this.modelPosition = vec3.fromValues(modelPosition[0], modelPosition[1], modelPosition[2])
    }

    // Return the model position
    public getModelPosition(): vec3 {
        return this.modelPosition
    }

    public getHideDepth(): number {
        return this.hideDepth
    }

    public render(): void {
        const lineStart = this.modelLine.getStart()
        const lineEnd = this.modelLine.getEnd()
        const lineDownward = lineEnd[1] > lineStart[1]

        const screenPosition = this.getScreenPosition()
        const labelHeight = this.getScreenHeight()
        // move the start point of the lines below the label if the end point is below the label
        lineStart[1] = screenPosition[1]
        if (lineDownward) {
            lineStart[1] += labelHeight
        }


        // move to the middle of the label
        lineStart[0] = screenPosition[0] + this.getScreenWidth() / 2

        this.modelLine.setStart(lineStart)
        this.modelLine.render()

        // draw our line from our screen position
        super.render()
    }

    public updateProjectedPosition(point: vec2): void {
        this.modelLine.updateProjectedPosition(point)
    }

}
