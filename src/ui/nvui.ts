import { text } from 'stream/consumers'
import { Shader } from '../shader.js'
import {
  fragRectShader,
  fragRoundedRectShader,
  fragStadiumShader,
  vertLineShader,
  vertRectShader,
  vertStadiumShader
} from '../shader-srcs.js'
import { NVFont, TEXTURE_FONT } from './nvfont.js'

export class NVUI {
  private gl: WebGL2RenderingContext
  private lineShader: Shader
  protected static triangleShader: Shader
  protected static circleShader: Shader
  protected static rectShader: Shader
  protected static roundedRectShader: Shader
  protected static stadiumShader: Shader
  protected static genericVAO: WebGLVertexArrayObject

  /**
   * Creates an instance of NVUI.
   * @param gl - The WebGL2RenderingContext to be used for rendering.
   */
  constructor(gl: WebGL2RenderingContext) {
    // Initialize static shaders and buffers if not already initialized
    this.gl = gl
    this.lineShader = new Shader(gl, vertLineShader, fragRectShader)

    if (!NVUI.rectShader) {
      NVUI.rectShader = new Shader(gl, vertRectShader, fragRectShader)
    }

    if (!NVUI.roundedRectShader) {
      NVUI.roundedRectShader = new Shader(gl, vertStadiumShader, fragRoundedRectShader)
    }

    if (!NVUI.stadiumShader) {
      NVUI.stadiumShader = new Shader(gl, vertStadiumShader, fragStadiumShader)
    }

    if (!NVUI.genericVAO) {
      const rectStrip = [
        1,
        1,
        0, // RAI
        1,
        0,
        0, // RPI
        0,
        1,
        0, // LAI
        0,
        0,
        0 // LPI
      ]

      const vao = gl.createVertexArray()!
      const vbo = gl.createBuffer()!

      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectStrip), gl.STATIC_DRAW)

      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)

      NVUI.genericVAO = vao
    }
  }

  // Function to support drawing characters, including RTL
  public drawChar(font: NVFont, xy: number[], size: number, char: string): number {
    if (!font.fontShader) {
      throw new Error('fontShader undefined')
    }
    // draw single character, never call directly: ALWAYS call from drawText()
    const metrics = font.fontMets!.mets[char]!
    if (!metrics) {
      return 0
    }
    const l = xy[0] + size * metrics.lbwh[0]
    const b = -(size * metrics.lbwh[1])
    const w = size * metrics.lbwh[2]
    const h = size * metrics.lbwh[3]
    const t = xy[1] + size - h + b
    this.gl.uniform4f(font.fontShader.uniforms.leftTopWidthHeight, l, t, w, h)
    this.gl.uniform4fv(font.fontShader.uniforms.uvLeftTopWidthHeight!, metrics.uv_lbwh)
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
    return size * metrics.xadv
  }

  // Updated drawText to support RTL strings
  public drawText(font: NVFont, xy: number[], str: string, scale = 1.0, color: Float32List | null = null): void {
    if (!font.isFontLoaded) {
      console.log('font not loaded')
    }

    if (!font.fontShader) {
      throw new Error('fontShader undefined')
    }

    // bind our font texture
    const gl = this.gl
    gl.activeTexture(TEXTURE_FONT)
    gl.bindTexture(gl.TEXTURE_2D, font.getFontTexture())

    font.fontShader.use(this.gl)
    const size = font.textHeight * Math.min(this.gl.canvas.height, this.gl.canvas.width) * scale
    this.gl.enable(this.gl.BLEND)
    this.gl.uniform2f(font.fontShader.uniforms.canvasWidthHeight, this.gl.canvas.width, this.gl.canvas.height)
    if (color === null) {
      color = font.fontColor
    }
    this.gl.uniform4fv(font.fontShader.uniforms.fontColor, color as Float32List)
    let screenPxRange = (size / font.fontMets!.size) * font.fontMets!.distanceRange
    screenPxRange = Math.max(screenPxRange, 1.0) // screenPxRange() must never be lower than 1
    this.gl.uniform1f(font.fontShader.uniforms.screenPxRange, screenPxRange)
    this.gl.bindVertexArray(NVUI.genericVAO)

    // Automatically detect if the string is RTL
    const rtl = /[\u0590-\u06FF]/.test(str)
    const chars = rtl ? Array.from(str).reverse() : Array.from(str)
    for (let i = 0; i < chars.length; i++) {
      xy[0] += this.drawChar(font, xy, size, chars[i])
    }
    this.gl.bindVertexArray(null)
  }

  /**
   * Draws a line.
   * @param startXYendXY - The start and end coordinates of the line.
   * @param thickness - The thickness of the line.
   * @param lineColor - The color of the line.
   */
  drawLine(startXYendXY: number[], thickness = 1, lineColor = [1, 0, 0, -1]): void {
    const gl = this.gl

    this.lineShader.use(gl)
    gl.enable(gl.BLEND)
    gl.uniform4fv(this.lineShader.uniforms.lineColor, lineColor)
    gl.uniform2fv(this.lineShader.uniforms.canvasWidthHeight, [gl.canvas.width, gl.canvas.height])
    gl.uniform1f(this.lineShader.uniforms.thickness, thickness)
    gl.uniform4fv(this.lineShader.uniforms.startXYendXY, startXYendXY)

    gl.bindVertexArray(NVUI.genericVAO)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.bindVertexArray(null) // set vertex attributes
  }

  /**
   * Draws a rectangle.
   * @param leftTopWidthHeight - The bounding box of the rectangle (left, top, width, height).
   * @param lineColor - The color of the rectangle.
   */
  drawRect(leftTopWidthHeight: number[], lineColor: Float32List = [1, 0, 0, -1]): void {
    if (!NVUI.rectShader) {
      throw new Error('rectShader undefined')
    }
    const gl = this.gl

    // Calculate the NDC width and height based on actual canvas size
    const dpr = window.devicePixelRatio || 1
    const canvas = gl.canvas as HTMLCanvasElement
    const canvasWidth = canvas.clientWidth * dpr
    const canvasHeight = canvas.clientHeight * dpr

    gl.viewport(0, 0, canvasWidth, canvasHeight)

    NVUI.rectShader.use(this.gl)
    this.gl.enable(this.gl.BLEND)
    this.gl.uniform4fv(NVUI.rectShader.uniforms.lineColor, lineColor)
    this.gl.uniform2fv(NVUI.rectShader.uniforms.canvasWidthHeight, [this.gl.canvas.width, this.gl.canvas.height])
    this.gl.uniform4f(
      NVUI.rectShader.uniforms.leftTopWidthHeight,
      leftTopWidthHeight[0],
      leftTopWidthHeight[1],
      leftTopWidthHeight[2],
      leftTopWidthHeight[3]
    )
    this.gl.bindVertexArray(NVUI.genericVAO)
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
    this.gl.bindVertexArray(null) // switch off to avoid tampering with settings
  }

  drawTextBox(
    font: NVFont,
    xy: number[],
    str: string,
    textColor: Float32List | null = null,
    backgroundColor: Float32List = [0.0, 0.0, 0.0, 0.3],
    scale = 1.0,
    margin: number = 5
  ): void {
    const textWidth = font.getTextWidth(str, scale)
    const textHeight = font.getTextHeight(str, scale)
    const rectWidth = textWidth // + 2 * margin * scale
    const rectHeight = font.getTextHeight(str, scale) // + 2 * margin * scale // Height of the rectangle enclosing the text
    console.log('text height', textHeight)
    console.log('rectHeight', rectHeight)
    const leftTopWidthHeight = [xy[0], xy[1], rectWidth, rectHeight]

    this.drawRect(leftTopWidthHeight, backgroundColor)

    const descenderDepth = font.getDescenderDepth(str, scale)
    console.log('descender depth', descenderDepth)

    const size = font.textHeight * Math.min(this.gl.canvas.height, this.gl.canvas.width) * scale
    // Adjust the position of the text with a margin, ensuring it's vertically centered
    const textPosition = [
      xy[0], // + margin,
      xy[1] + textHeight - size + descenderDepth
    ]

    // Render the text
    this.drawText(font, textPosition, str, scale, textColor)
  }

  /**
   * Draws a rounded rectangle.
   * @param leftTopWidthHeight - The bounding box of the rounded rectangle (left, top, width, height).
   * @param fillColor - The fill color of the rectangle.
   * @param outlineColor - The outline color of the rectangle.
   */
  drawRoundedRect(leftTopWidthHeight: number[], fillColor: Float32List, outlineColor: Float32List): void {
    if (!NVUI.roundedRectShader) {
      throw new Error('roundedRectShader undefined')
    }
    console.log('drawRoundedRect', leftTopWidthHeight, fillColor, outlineColor)

    const gl = this.gl

    // Use the rounded rectangle shader program
    NVUI.roundedRectShader.use(gl)

    // Enable blending for transparency
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // Set the necessary uniforms
    const shader = NVUI.roundedRectShader

    // Set the roundness of the corners
    const radius = 0.02 // Adjust this value as needed for rounded corners
    gl.uniform4fv(NVUI.roundedRectShader.uniforms.u_cornerRadii, [radius, radius, radius, radius])

    // Set the fill color
    const fillColorLocation = gl.getUniformLocation(shader.program, 'u_fillColor')
    gl.uniform4fv(fillColorLocation, fillColor)

    // Set the outline color
    const outlineColorLocation = gl.getUniformLocation(shader.program, 'u_outlineColor')
    gl.uniform4fv(outlineColorLocation, outlineColor)

    // Set the rectangle position and size (using existing uniform from vertex shader)
    const canvasWidthHeightLocation = gl.getUniformLocation(shader.program, 'canvasWidthHeight')
    gl.uniform2fv(canvasWidthHeightLocation, [gl.canvas.width, gl.canvas.height])

    const leftTopWidthHeightLocation = gl.getUniformLocation(shader.program, 'leftTopWidthHeight')
    gl.uniform4f(
      leftTopWidthHeightLocation,
      leftTopWidthHeight[0],
      leftTopWidthHeight[1],
      leftTopWidthHeight[2],
      leftTopWidthHeight[3]
    )

    // Calculate the NDC width and height based on actual canvas size
    const dpr = window.devicePixelRatio || 1
    const canvas = gl.canvas

    canvas.width = Math.floor((canvas as HTMLCanvasElement).clientWidth * dpr)
    canvas.height = Math.floor((canvas as HTMLCanvasElement).clientHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)

    // Canvas dimensions
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    // Calculate NDC position of the top-left corner
    const ndcX = (2 * leftTopWidthHeight[0]) / canvasWidth - 1
    const ndcY = 1 - (2 * leftTopWidthHeight[1]) / canvasHeight

    // Convert width and height to NDC
    const ndcWidth = (2 * leftTopWidthHeight[2]) / canvasWidth
    const ndcHeight = (2 * leftTopWidthHeight[3]) / canvasHeight

    // Set uniforms for the shader
    const u_rectPos = [ndcX + ndcWidth / 2, ndcY - ndcHeight / 2] // Center position in NDC
    gl.uniform2f(NVUI.roundedRectShader.uniforms.u_rectPos, u_rectPos[0], u_rectPos[1])
    gl.uniform2f(NVUI.roundedRectShader.uniforms.u_rectSize, ndcWidth / 2, ndcHeight / 2)

    // Set the outline width
    const u_outlineWidth = Math.min(ndcWidth, ndcHeight) * 0.03 // Example: 5% of the smallest dimension
    const outlineWidthLocation = gl.getUniformLocation(shader.program, 'u_outlineWidth')
    gl.uniform1f(outlineWidthLocation, u_outlineWidth)

    // Bind the VAO that contains the vertex data and attribute pointers
    gl.bindVertexArray(NVUI.genericVAO)

    // Draw the rounded rectangle using TRIANGLE_STRIP (assuming this VAO holds the appropriate vertex data)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // Unbind the VAO to avoid accidental modification
    gl.bindVertexArray(null)
  }

  drawRoundedTextBox(
    font: NVFont,
    xy: number[],
    str: string,
    textColor: Float32List | null = null,
    outlineColor: Float32List | null = [1.0, 1.0, 1.0, 1.0],
    fillColor: Float32List = [0.0, 0.0, 0.0, 0.3],
    scale = 1.0,
    margin: number = 15
  ): void {
    const textWidth = font.getTextWidth(str, scale)
    const textHeight = font.getTextHeight(str, scale)
    const rectWidth = textWidth + 2 * margin * scale + textHeight
    const rectHeight = font.getTextHeight(str, scale) + 4 * margin * scale // Height of the rectangle enclosing the text

    const leftTopWidthHeight = [xy[0], xy[1], rectWidth, rectHeight]
    this.drawRoundedRect(leftTopWidthHeight, fillColor, outlineColor)

    const descenderDepth = font.getDescenderDepth(str, scale)

    const size = font.textHeight * Math.min(this.gl.canvas.height, this.gl.canvas.width) * scale
    // Adjust the position of the text with a margin, ensuring it's vertically centered
    const textPosition = [
      leftTopWidthHeight[0] + margin * scale + textHeight / 2,
      leftTopWidthHeight[1] + 2 * margin * scale + textHeight - size + descenderDepth
    ]

    // Render the text
    this.drawText(font, textPosition, str, scale, textColor)
  }

  /**
   * Draws a rounded rectangle.
   * @param leftTopWidthHeight - The bounding box of the rounded rectangle (left, top, width, height).
   * @param fillColor - The fill color of the rectangle.
   * @param outlineColor - The outline color of the rectangle.
   */
  drawStadium(
    leftTopWidthHeight: number[],
    fillColor: Float32List,
    outlineColor: Float32List,
    roundness: number = 0.0
  ): void {
    if (!NVUI.stadiumShader) {
      throw new Error('roundedRectShader undefined')
    }
    console.log('drawRoundedRect', leftTopWidthHeight, fillColor, outlineColor)

    const gl = this.gl

    // Use the rounded rectangle shader program
    NVUI.stadiumShader.use(gl)

    // Enable blending for transparency
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // Set the necessary uniforms
    const shader = NVUI.stadiumShader

    // Set the fill color
    const fillColorLocation = gl.getUniformLocation(shader.program, 'u_fillColor')
    gl.uniform4fv(fillColorLocation, fillColor)

    // Set the outline color
    const outlineColorLocation = gl.getUniformLocation(shader.program, 'u_outlineColor')
    gl.uniform4fv(outlineColorLocation, outlineColor)

    // Set the rectangle position and size (using existing uniform from vertex shader)
    const canvasWidthHeightLocation = gl.getUniformLocation(shader.program, 'canvasWidthHeight')
    gl.uniform2fv(canvasWidthHeightLocation, [gl.canvas.width, gl.canvas.height])

    const leftTopWidthHeightLocation = gl.getUniformLocation(shader.program, 'leftTopWidthHeight')
    gl.uniform4f(
      leftTopWidthHeightLocation,
      leftTopWidthHeight[0],
      leftTopWidthHeight[1],
      leftTopWidthHeight[2],
      leftTopWidthHeight[3]
    )

    // Calculate the NDC width and height based on actual canvas size
    const dpr = window.devicePixelRatio || 1
    const canvas = gl.canvas

    canvas.width = Math.floor((canvas as HTMLCanvasElement).clientWidth * dpr)
    canvas.height = Math.floor((canvas as HTMLCanvasElement).clientHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)

    // Canvas dimensions
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    // Calculate NDC position of the top-left corner
    const ndcX = (2 * leftTopWidthHeight[0]) / canvasWidth - 1
    const ndcY = 1 - (2 * leftTopWidthHeight[1]) / canvasHeight

    // Convert width and height to NDC
    const ndcWidth = (2 * leftTopWidthHeight[2]) / canvasWidth
    const ndcHeight = (2 * leftTopWidthHeight[3]) / canvasHeight

    // const defaultRoundness = Math.min(ndcWidth / 2, ndcHeight / 2)
    // gl.uniform1f(NVUI.stadiumShader.uniforms.u_roundness, defaultRoundness)

    const defaultRoundnessScale = 0.0
    gl.uniform1f(NVUI.stadiumShader.uniforms.u_roundnessScale, roundness)

    // Set uniforms for the shader
    const u_rectPos = [ndcX + ndcWidth / 2, ndcY - ndcHeight / 2] // Center position in NDC
    gl.uniform2f(NVUI.stadiumShader.uniforms.u_rectPos, u_rectPos[0], u_rectPos[1])
    gl.uniform2f(NVUI.stadiumShader.uniforms.u_rectSize, ndcWidth / 2, ndcHeight / 2)

    // Set the outline width
    const u_outlineWidth = Math.min(ndcWidth, ndcHeight) * 0.03 // Example: 5% of the smallest dimension
    const outlineWidthLocation = gl.getUniformLocation(shader.program, 'u_outlineWidth')
    gl.uniform1f(outlineWidthLocation, u_outlineWidth)

    // Bind the VAO that contains the vertex data and attribute pointers
    gl.bindVertexArray(NVUI.genericVAO)

    // Draw the rounded rectangle using TRIANGLE_STRIP (assuming this VAO holds the appropriate vertex data)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // Unbind the VAO to avoid accidental modification
    gl.bindVertexArray(null)
  }

  drawTextStadiumCenteredOn(
    font: NVFont,
    xy: number[],
    str: string,
    textColor: Float32List | null = null,
    outlineColor: Float32List | null = [1.0, 1.0, 1.0, 1.0],
    fillColor: Float32List = [0.0, 0.0, 0.0, 0.3],
    margin: number = 15,
    roundness: number = 1.0,
    scale = 1.0
  ): void {
    const textWidth = font.getTextWidth(str, scale)
    const textHeight = font.getTextHeight(str, scale)
    const rectWidth = textWidth + 2 * margin * scale + textHeight
    const rectHeight = font.getTextHeight(str, scale) + 4 * margin * scale // Height of the rectangle enclosing the text

    const centeredPos = [xy[0] - rectWidth / 2, xy[1] - rectHeight / 2]
    this.drawTextStadium(font, centeredPos, str, textColor, outlineColor, fillColor, margin, roundness, scale)
  }

  drawTextStadium(
    font: NVFont,
    xy: number[],
    str: string,
    textColor: Float32List | null = null,
    outlineColor: Float32List | null = [1.0, 1.0, 1.0, 1.0],
    backgroundColor: Float32List = [0.0, 0.0, 0.0, 0.3],
    margin: number = 15,
    roundness: number = 1.0,
    scale = 1.0
  ): void {
    const textWidth = font.getTextWidth(str, scale)
    const textHeight = font.getTextHeight(str, scale)
    const rectWidth = textWidth + 2 * margin * scale + textHeight
    const rectHeight = font.getTextHeight(str, scale) + 4 * margin * scale // Height of the rectangle enclosing the text

    const leftTopWidthHeight = [xy[0], xy[1], rectWidth, rectHeight]
    this.drawStadium(leftTopWidthHeight, backgroundColor, outlineColor, roundness)

    const descenderDepth = font.getDescenderDepth(str, scale)

    const size = font.textHeight * Math.min(this.gl.canvas.height, this.gl.canvas.width) * scale
    // Adjust the position of the text with a margin, ensuring it's vertically centered
    const textPosition = [
      leftTopWidthHeight[0] + margin * scale + textHeight / 2,
      leftTopWidthHeight[1] + 2 * margin * scale + textHeight - size + descenderDepth
    ]

    // Render the text
    this.drawText(font, textPosition, str, scale, textColor)
  }
}