import { NVRenderer } from '../nvrenderer.js'
import { Vec4, Color, LineTerminator, LineStyle } from '../types.js'
import { BaseUIComponent } from './baseuicomponent.js'

export class LineComponent extends BaseUIComponent {
  protected startEnd: Vec4
  protected thickness: number
  protected lineColor: Color
  protected terminator: LineTerminator
  protected lineStyle: LineStyle // New property for line style
  protected dashDotLength: number // New property for dash/dot length

  constructor(
    startEnd: Vec4,
    thickness = 1,
    lineColor: Color = [1, 0, 0, -1],
    terminator: LineTerminator = LineTerminator.NONE,
    lineStyle: LineStyle = LineStyle.NORMAL, // Default to solid line
    dashDotLength: number = 5 // Default dash/dot length
  ) {
    super()
    this.startEnd = startEnd
    this.thickness = thickness
    this.lineColor = lineColor
    this.terminator = terminator
    this.lineStyle = lineStyle
    this.dashDotLength = dashDotLength
  }

  draw(renderer: NVRenderer): void {
    renderer.drawLine(
      this.startEnd,
      this.thickness,
      this.lineColor,
      this.terminator,
      this.lineStyle, // Pass line style to renderer
      this.dashDotLength // Pass dash/dot length to renderer
    )
  }

  // toJSON method to serialize the LineComponent instance
  toJSON(): object {
    return {
      ...super.toJSON(), // Serialize base properties from BaseUIComponent
      className: 'LineComponent', // Class name for identification
      startEnd: Array.from(this.startEnd), // Convert Vec4 to array
      thickness: this.thickness, // Serialize thickness
      lineColor: Array.from(this.lineColor), // Convert Color to array
      terminator: this.terminator, // Serialize the LineTerminator
      lineStyle: this.lineStyle, // Serialize the LineStyle
      dashDotLength: this.dashDotLength // Serialize dash/dot length
    }
  }

  public static fromJSON(data: any): LineComponent {
    const startEnd: Vec4 = data.startEnd || [0, 0, 0, 0]
    const thickness: number = data.thickness || 1
    const lineColor: Color = data.lineColor || [1, 0, 0, -1]
    const terminator: LineTerminator = data.terminator || LineTerminator.NONE
    const lineStyle: LineStyle = data.lineStyle || LineStyle.NORMAL
    const dashDotLength: number = data.dashDotLength || 5

    return new LineComponent(startEnd, thickness, lineColor, terminator, lineStyle, dashDotLength)
  }
}