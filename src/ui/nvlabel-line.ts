import { NVFont } from './nvfont.js'
import { vec2, vec3 } from 'gl-matrix'
import { NVUIModelComponent } from './nvui-component.js'
import { NVScreenText } from './nvtext.js'

export class NVLabelLine extends NVScreenText implements NVUIModelComponent {
    private modelPosition: vec3 // 3D position in model space
    private hideDepth: number // clip space depth to hide control
    constructor(
        text: string,
        font: NVFont,
        modelPosition: vec3 | number[],
        color: number[] = [1.0, 0.0, 0.0, 1.0],
        scale?: number,
        hideDepth?: number
    ) {
        super(text, vec2.create(), font, color, scale)
        this.hideDepth = hideDepth
        this.modelPosition = vec3.fromValues(modelPosition[0], modelPosition[1], modelPosition[2])
    }

    // Return the model position
    public getModelPosition(): vec3 {
        return this.modelPosition
    }

    public getHideDepth(): number {
        return this.hideDepth
    }

}
