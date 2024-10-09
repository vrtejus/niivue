import { mat4, vec2, vec3, vec4 } from 'gl-matrix'
import { UIModelComponent, UIComponent, ColorableComponent, NVRenderDimensions } from './nvui-component.js'
import { Shader } from '../shader.js'
import { vertLineShader, fragRectShader } from '../shader-srcs.js'

export class NVScreenLine implements UIComponent, ColorableComponent {
    private gl: WebGL2RenderingContext
    private start: vec2
    private end: vec2
    private thickness: number
    private lineColor: number[] | Float32Array
    private lineShader: Shader
    private cuboidVertexBuffer?: WebGLBuffer
    private genericVAO: WebGLVertexArrayObject | null = null // used for 2D slices, 2D lines, 2D Fonts
    private unusedVAO = null

    public isVisible: boolean
    public isRenderedIn2D: boolean = true // Default value set to true
    public isRenderedIn3D: boolean = true // Default value set to true

    constructor(gl: WebGL2RenderingContext, start: vec2, end: vec2, thickness: number = 1, lineColor: number[] | Float32Array = [1.0, 0.0, 0.0, 1.0]) {
        this.gl = gl
        this.lineShader = new Shader(gl, vertLineShader, fragRectShader)

        this.start = start
        this.end = end
        this.thickness = thickness
        this.lineColor = lineColor

        this.isVisible = true

        const rectStrip = [
            1, 1, 0, // RAI
            1, 0, 0, // RPI
            0, 1, 0, // LAI
            0, 0, 0 // LPI
        ]

        this.cuboidVertexBuffer = gl.createBuffer()!
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cuboidVertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectStrip), gl.STATIC_DRAW)
        this.genericVAO = gl.createVertexArray()! // 2D slices, fonts, lines
        gl.bindVertexArray(this.genericVAO)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cuboidVertexBuffer)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
        gl.bindVertexArray(this.unusedVAO) // switch off to avoid tampering with settings
    }

    getColor(): vec4 {
        return vec4.fromValues(...this.lineColor as [number, number, number, number])
    }

    setColor(color: vec4): void {
        this.lineColor = Array.from(color)
    }

    getStart(): vec2 {
        return this.start
    }

    setStart(point: vec2 | number[]): void {

        this.start = vec2.fromValues(point[0], point[1])
        // console.log('starting point', this.start)
    }

    getEnd(): vec2 {
        return this.end
    }

    setEnd(point: vec2 | number[]): void {
        this.end = vec2.fromValues(point[0], point[1])
    }

    getScreenPosition(): vec2 {
        return this.start
    }

    setScreenPosition(point: vec2): void {
        this.start = point
    }

    getScreenWidth(): number {
        return Math.abs(this.start[0] - this.end[0])
    }

    getScreenHeight(): number {
        return Math.abs(this.start[1] - this.end[1])
    }

    render(dimensions: NVRenderDimensions): void {
        switch (dimensions) {
            case NVRenderDimensions.TWO:
                if (!this.isRenderedIn2D) {
                    return
                }
                break
            case NVRenderDimensions.THREE:
                if (!this.isRenderedIn3D) {
                    return
                }
        }
        // console.log('drawing a line from to', this.start, this.end)
        this.gl.bindVertexArray(this.genericVAO)
        if (!this.lineShader) {
            throw new Error('lineShader undefined')
        }
        this.lineShader.use(this.gl)

        this.gl.uniform4fv(this.lineShader.uniforms.lineColor, this.lineColor)
        this.gl.uniform2fv(this.lineShader.uniforms.canvasWidthHeight, [this.gl.canvas.width, this.gl.canvas.height])
        // Draw line
        this.gl.uniform1f(this.lineShader.uniforms.thickness, this.thickness)
        this.gl.uniform4fv(this.lineShader.uniforms.startXYendXY, [this.start[0], this.start[1], this.end[0], this.end[1]])
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
        this.gl.bindVertexArray(this.unusedVAO) // set vertex attributes
    }
}

export class NVModelLine extends NVScreenLine implements UIModelComponent, UIComponent {
    private modelPosition: vec3 // 3D position in model space
    private hideDepth: number // Clip space depth to hide control

    public isVisibleIn2D: boolean = true // Default value set to true
    public isVisibleIn3D: boolean = true // Default value set to true

    constructor(gl: WebGL2RenderingContext, start: vec2, modelPosition: vec3 | number[], thickness: number = 1, lineColor: number[] | Float32Array = [1.0, 0.0, 0.0, 1.0], hideDepth = 0) {
        super(gl, start, vec2.create(), thickness, lineColor)
        this.modelPosition = vec3.fromValues(modelPosition[0], modelPosition[1], modelPosition[2])
        this.hideDepth = hideDepth
    }

    getProjectedPosition(): vec2 {
        return this.getEnd()
    }

    updateProjectedPosition(leftTopWidthHeight: number[], mvpMatrix: mat4): void {
        throw new Error('Method not implemented.')
    }

    // Return the model position
    public getModelPosition(): vec3 {
        return this.modelPosition
    }

    public getHideDepth(): number {
        return this.hideDepth
    }

    public setProjectedPosition(point: vec2): void {
        this.setEnd(point)
    }
}
