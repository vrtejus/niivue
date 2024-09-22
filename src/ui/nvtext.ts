import { NVFont } from './nvfont.js'
import { vec2, vec3 } from 'gl-matrix'
import { NVUIModelComponent } from './nvui-component.js'

export class NVText {
    protected font: NVFont
    public scale: number
    public text: string
    public color: number[]
    public isVisible: boolean

    constructor(text: string, font: NVFont, color: number[] = [1.0, 0.0, 0.0, 1.0], scale: number = 1.0, isVisible = true) {
        this.text = text
        this.font = font
        this.color = color
        this.scale = scale
        this.isVisible = true
    }

    public getScreenWidth(): number {
        return this.font.getTextWidth(this.scale, this.text)
    }

    public getScreenHeight(): number {
        return this.font.getTextHeight(this.scale, this.text)
    }

    // Abstract method to be implemented by subclasses for rendering text
    public render(): void {
        throw new Error('Render method must be implemented by subclasses')
    }
}

export class NVScreenText extends NVText {
    private screenPosition: vec2 // 2D position on the screen

    constructor(text: string, screenPosition: vec2 | number[], font: NVFont, color?: number[], scale?: number) {
        super(text, font, color, scale)
        this.screenPosition = vec2.fromValues(screenPosition[0], screenPosition[1])
    }

    // NVUiComponent Interface    
    // Get the 2D screen position
    public getScreenPosition(): vec2 {
        return this.screenPosition
    }

    // Set the 2D screen position
    public setScreenPosition(position: vec2): void {
        this.screenPosition = position
    }

    // Render text on the screen (2D context)
    public render(): void {

        // console.log(`Rendering screen text: ${this.text} at position (${this.screenPosition}) with scale ${this.scale}`)
        this.font.drawText([this.screenPosition[0], this.screenPosition[1]], this.text, this.scale, this.color)
    }
}

export class NVModelText extends NVScreenText implements NVUIModelComponent {
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

    public updateProjectedPosition(point: vec2): void {
        this.setScreenPosition(point)
    }

}

