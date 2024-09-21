import { NVText } from './nvtext.js'
import { NVButton } from './nvbutton.js'

export class NVPanel {
    private leftTopWidthHeight: number[] // [left, top, width, height]
    private lineColor: number[]
    private texts: NVText[] // Array to hold NVText instances
    private buttons: NVButton[] // Array to hold NVButton instances

    constructor(leftTopWidthHeight: number[], lineColor = [1, 0, 0, -1]) {
        this.leftTopWidthHeight = leftTopWidthHeight
        this.lineColor = lineColor
        this.texts = []
        this.buttons = []
    }

    // Add an NVText instance to the panel
    public addText(text: NVText): void {
        this.texts.push(text)
    }

    // Add an NVButton instance to the panel
    public addButton(button: NVButton): void {
        this.buttons.push(button)
    }

    // Render the panel (draw the rectangle and its contents)
    public render(gl: WebGL2RenderingContext, rectShader: any, genericVAO: any, unusedVAO: any): void {
        // Draw the panel's rectangle
        this.drawRect(gl, rectShader, genericVAO, unusedVAO)

        // Render each NVText instance
        for (const text of this.texts) {
            text.render()
        }

        // Render each NVButton instance
        for (const button of this.buttons) {
            button.render()
        }
    }

    // Draw the panel's rectangle
    private drawRect(gl: WebGL2RenderingContext, rectShader: any, genericVAO: any, unusedVAO: any): void {
        if (this.lineColor[3] < 0) {
            // Default color if alpha is less than 0
            this.lineColor = [1.0, 0.0, 0.0, 1.0] // Default red color
        }

        rectShader.use(gl)
        gl.enable(gl.BLEND)
        gl.uniform4fv(rectShader.uniforms.lineColor, this.lineColor)
        gl.uniform2fv(rectShader.uniforms.canvasWidthHeight, [gl.canvas.width, gl.canvas.height])
        gl.uniform4f(
            rectShader.uniforms.leftTopWidthHeight,
            this.leftTopWidthHeight[0], // Left
            this.leftTopWidthHeight[1], // Top
            this.leftTopWidthHeight[2], // Width
            this.leftTopWidthHeight[3] // Height
        )
        gl.bindVertexArray(genericVAO)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        gl.bindVertexArray(unusedVAO) // Unbind the VAO after drawing
    }

    // Handle clicks within the panel, delegating to buttons
    public handleClick(x: number, y: number): void {
        // Delegate click events to the buttons
        for (const button of this.buttons) {
            button.click(x, y)
        }
    }
}
