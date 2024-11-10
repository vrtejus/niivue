import { Rectangle, QuadTree } from './quadtree.js'
import { Vec2, Vec4, Color, LineStyle, LineTerminator } from './types.js'
import { NVRenderer } from './nvrenderer.js'
import { NVFont } from './nvfont.js'
import { NVBitmap } from './nvbitmap.js'
import { BaseContainerComponent } from './components/basecontainercomponent.js'
import { AnimationManager } from './animationmanager.js'
import { BitmapComponent } from './components/bitmapcomponent.js'
// import { NVAsset } from './nvasset.js'
import { ButtonComponent } from './components/buttoncomponent.js'
import { CaliperComponent } from './components/calipercomponent.js'
import { CircleComponent } from './components/circlecomponent.js'
import { LineComponent } from './components/linecomponent.js'
import { TextBoxComponent } from './components/textboxcomponent.js'
import { ToggleComponent } from './components/togglecomponent.js'
import { TriangleComponent } from './components/trianglecomponent.js'
import { TextComponent } from './components/textcomponent.js'
import { IUIComponent } from './interfaces.js'
// import { BaseUIComponent } from './components/baseuicomponent.js'

export class NVUI {
  private gl: WebGL2RenderingContext
  private renderer: NVRenderer
  private quadTree: QuadTree<IUIComponent>
  private _redrawRequested?: () => void

  // Style field
  public style: {
    textColor: Color
    foregroundColor: Color
    backgroundColor: Color
    textSize: number
  }

  private canvasWidth: number
  private canvasHeight: number
  private dpr: number
  private resizeListener: () => void

  // Static enum for line terminators
  public static lineTerminator = LineTerminator
  public static lineStyle = LineStyle

  private lastHoveredComponents: Set<IUIComponent> = new Set()

  public get redrawRequested(): (() => void) | undefined {
    return this._redrawRequested
  }

  public set redrawRequested(callback: (() => void) | undefined) {
    const canvas = this.gl.canvas as HTMLCanvasElement
    if (callback) {
      canvas.removeEventListener('pointerdown', this.handlePointerDown.bind(this))
      canvas.removeEventListener('pointermove', this.handlePointerMove.bind(this))
      window.removeEventListener('resize', this.resizeListener)
    } else {
      canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this))
      canvas.addEventListener('pointermove', this.handlePointerMove.bind(this))
      window.addEventListener('resize', this.resizeListener)
    }
    this._redrawRequested = callback
  }

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.renderer = new NVRenderer(gl)
    this.dpr = window.devicePixelRatio || 1
    const canvas = this.gl.canvas as HTMLCanvasElement
    const rect = canvas.parentElement.getBoundingClientRect()
    this.canvasWidth = rect.width
    this.canvasHeight = rect.height

    this.style = {
      textColor: [0, 0, 0, 1],
      foregroundColor: [1, 1, 1, 1],
      backgroundColor: [0, 0, 0, 1],
      textSize: 12
    }
    const bounds = new Rectangle(0, 0, this.canvasWidth * this.dpr, this.canvasHeight * this.dpr)
    this.quadTree = new QuadTree<IUIComponent>(bounds)

    const animationManager = AnimationManager.getInstance()
    animationManager.setRequestRedrawCallback(this.requestRedraw.bind(this))

    this.resizeListener = this.handleWindowResize.bind(this)
    window.addEventListener('resize', this.resizeListener)

    canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this))
    canvas.addEventListener('pointerup', this.handlePointerUp.bind(this))
    canvas.addEventListener('pointermove', this.handlePointerMove.bind(this))
  }

  // Method to add a component to the QuadTree
  public addComponent(component: IUIComponent): void {
    if (component instanceof BaseContainerComponent) {
      component.quadTree = this.quadTree
    }
    component.requestRedraw = this.requestRedraw.bind(this)
    this.quadTree.insert(component)
  }

  getComponents(
    boundsInScreenCoords?: Vec4,
    tags: string[] = [],
    useAnd: boolean = true,
    useNot: boolean = false
  ): IUIComponent[] {
    const candidates = boundsInScreenCoords
      ? this.quadTree.query(Rectangle.fromVec4(boundsInScreenCoords))
      : this.quadTree.getAllElements()

    return candidates.filter((component) => {
      // If tags array is empty, return only components without tags
      if (tags.length === 0) {
        return component.tags.length === 0
      }
      console.log('looking for tag in component', tags, component)
      const hasTags = useAnd
        ? tags.every((tag) => component.tags.includes(tag))
        : tags.some((tag) => component.tags.includes(tag))

      return useNot ? !hasTags : hasTags
    })
  }

  public draw(leftTopWidthHeight?: Vec4, tags: string[] = []): void {
    this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeight)

    // Set up bounds for filtering and positioning
    const bounds = leftTopWidthHeight ? Rectangle.fromVec4(leftTopWidthHeight) : null

    // Retrieve components that match the specified tags and are within bounds
    const components = this.getComponents(
      leftTopWidthHeight,
      tags,
      true // Match all specified tags
    )

    for (const component of components) {
      // Align component within bounds if specified
      if (bounds) {
        component.align(leftTopWidthHeight)
      }
      // Draw the component using NVRenderer
      if (component.isVisible) {
        component.draw(this.renderer)
      }
    }
  }

  // Method to request a redraw
  private requestRedraw(): void {
    if (this._redrawRequested) {
      this._redrawRequested()
    } else {
      // no host
      this.draw()
    }
  }

  public processPointerMove(x: number, y: number, event: PointerEvent): void {
    const point: Vec2 = [x * this.dpr, y * this.dpr]
    const components = new Set(this.quadTree.queryPoint(point).filter((component) => component.isVisible))
    for (const component of components) {
      if (!component.isVisible) {
        continue
      }
      if (!this.lastHoveredComponents.has(component)) {
        component.applyEventEffects('pointerenter', event)
      }
    }
    for (const component of this.lastHoveredComponents) {
      if (!components.has(component)) {
        component.applyEventEffects('pointerleave', event)
      }
    }
    this.lastHoveredComponents = components
  }

  public processPointerDown(_x: number, _y: number, _button: number): void {}

  public processPointerUp(x: number, y: number, event: PointerEvent): void {
    const point: Vec2 = [x * this.dpr, y * this.dpr]
    const components = this.quadTree.queryPoint(point)
    for (const component of components) {
      if (component.isVisible) {
        component.applyEventEffects('pointerup', event)
      }
    }
  }

  // Method to handle window resize events
  public handleWindowResize(): void {
    const canvas = this.gl.canvas as HTMLCanvasElement
    const width = canvas.clientWidth * this.dpr
    const height = canvas.clientHeight * this.dpr

    // Update canvasWidth and canvasHeight
    this.canvasWidth = width
    this.canvasHeight = height

    const bounds = new Rectangle(0, 0, this.canvasWidth * this.dpr, this.canvasHeight * this.dpr)
    this.quadTree.updateBoundary(bounds)
  }

  // Handler for pointer down events
  private handlePointerDown(event: PointerEvent): void {
    const pos = this.getCanvasRelativePosition(event)
    if (pos) {
      this.processPointerDown(pos.x, pos.y, event.button)
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    const pos = this.getCanvasRelativePosition(event)
    if (pos) {
      this.processPointerUp(pos.x, pos.y, event)
    }
  }

  // Handler for pointer move events
  private handlePointerMove(event: PointerEvent): void {
    const pos = this.getCanvasRelativePosition(event)
    if (pos) {
      this.processPointerMove(pos.x, pos.y, event)
    }
  }

  // Utility method to calculate position relative to the canvas
  private getCanvasRelativePosition(event: PointerEvent): { x: number; y: number } | null {
    const canvas = this.gl.canvas as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) * this.dpr
    const y = (event.clientY - rect.top) * this.dpr
    return { x, y }
  }

  public destroy(): void {
    window.removeEventListener('resize', this.resizeListener)
    const canvas = this.gl.canvas as HTMLCanvasElement
    canvas.removeEventListener('pointerdown', this.handlePointerDown.bind(this))
    canvas.removeEventListener('pointermove', this.handlePointerMove.bind(this))
  }

  // Proxy methods for renderer's draw calls

  public drawText(
    font: NVFont,
    position: Vec2,
    text: string,
    scale = 1.0,
    color: Color = [1, 1, 1, 1],
    maxWidth = 0
  ): void {
    this.renderer.drawText(font, position, text, scale, color, maxWidth)
  }

  public drawBitmap(bitmap: NVBitmap, position: Vec2, scale: number): void {
    this.renderer.drawBitmap(bitmap, position, scale)
  }

  public drawLine(
    startEnd: Vec4,
    thickness = 1,
    lineColor: Color = [1, 0, 0, 1],
    terminator: LineTerminator = LineTerminator.NONE
  ): void {
    this.renderer.drawLine(startEnd, thickness, lineColor, terminator)
  }

  public drawRect(leftTopWidthHeight: Vec4, lineColor: Color = [1, 0, 0, 1]): void {
    this.renderer.drawRect(leftTopWidthHeight, lineColor)
  }

  public drawRoundedRect(
    leftTopWidthHeight: Vec4,
    fillColor: Color,
    outlineColor: Color,
    cornerRadius: number = -1,
    thickness: number = 10
  ): void {
    this.renderer.drawRoundedRect(leftTopWidthHeight, fillColor, outlineColor, cornerRadius, thickness)
  }

  public drawCircle(leftTopWidthHeight: Vec4, circleColor: Color = [1, 1, 1, 1], fillPercent = 1.0): void {
    this.renderer.drawCircle(leftTopWidthHeight, circleColor, fillPercent)
  }

  public drawToggle(position: Vec2, size: Vec2, isOn: boolean, onColor: Color, offColor: Color): void {
    this.renderer.drawToggle(position, size, isOn, onColor, offColor)
  }

  public drawTriangle(headPoint: Vec2, baseMidPoint: Vec2, baseLength: number, color: Color): void {
    this.renderer.drawTriangle(headPoint, baseMidPoint, baseLength, color)
  }

  public drawRotatedText(
    font: NVFont,
    position: Vec2,
    text: string,
    scale = 1.0,
    color: Color = [1, 0, 0, 1],
    rotation = 0.0, // Rotation in radians
    outlineColor: Color = [0, 0, 0, 1],
    outlineThickness: number = 1
  ): void {
    this.renderer.drawRotatedText(font, position, text, scale, color, rotation, outlineColor, outlineThickness)
  }

  // Updated drawTextBox method to support maxWidth and word wrapping
  // Updated drawTextBox method to support maxWidth and word wrapping
  drawTextBox(
    font: NVFont,
    xy: Vec2,
    str: string,
    textColor: Color = [0, 0, 0, 1.0],
    outlineColor: Color = [1.0, 1.0, 1.0, 1.0],
    fillColor: Color = [0.0, 0.0, 0.0, 0.3],
    margin: number = 15,
    roundness: number = 0.0,
    scale = 1.0,
    maxWidth = 0,
    fontOutlineColor: Color = [0, 0, 0, 1],
    fontOutlineThickness: number = 1
  ): void {
    this.renderer.drawTextBox(
      font,
      xy,
      str,
      textColor,
      outlineColor,
      fillColor,
      margin,
      roundness,
      scale,
      maxWidth,
      fontOutlineColor,
      fontOutlineThickness
    )
  }

  drawTextBoxCenteredOn(
    font: NVFont,
    xy: Vec2,
    str: string,
    textColor: Color = [0, 0, 0, 1.0],
    outlineColor: Color = [1.0, 1.0, 1.0, 1.0],
    fillColor: Color = [0.0, 0.0, 0.0, 0.3],
    margin: number = 15,
    roundness: number = 0.0,
    scale = 1.0,
    maxWidth = 0,
    fontOutlineColor: Color = [0, 0, 0, 1],
    fontOutlineThickness: number = 1
  ): void {
    const textWidth = font.getTextWidth(str, scale)
    const textHeight = font.getTextHeight(str, scale)
    const padding = textHeight > textWidth ? textHeight - textWidth : 0
    const rectWidth = textWidth + 2 * margin * scale + textHeight + padding
    const rectHeight = font.getTextHeight(str, scale) + 4 * margin * scale // Height of the rectangle enclosing the text
    const centeredPos = [xy[0] - rectWidth / 2, xy[1] - rectHeight / 2] as Vec2

    this.drawTextBox(
      font,
      centeredPos,
      str,
      textColor,
      outlineColor,
      fillColor,
      margin,
      roundness,
      scale,
      maxWidth,
      fontOutlineColor,
      fontOutlineThickness
    )
  }

  public drawCalendar(
    font: NVFont,
    startX: number,
    startY: number,
    cellWidth: number,
    cellHeight: number,
    selectedDate: Date,
    selectedColor: Color,
    firstDayOfWeek: number = 0 // 0 represents Sunday
  ): void {
    this.renderer.drawCalendar(font, startX, startY, cellWidth, cellHeight, selectedDate, selectedColor, firstDayOfWeek)
  }

  drawCaliper(
    pointA: Vec2,
    pointB: Vec2,
    length: number,
    units: string,
    font: NVFont,
    textColor: Color = [1, 0, 0, 1],
    lineColor: Color = [0, 0, 0, 1],
    lineThickness: number = 1,
    offset: number = 40,
    scale: number = 1.0
  ): void {
    this.renderer.drawCaliper(pointA, pointB, length, units, font, textColor, lineColor, lineThickness, offset, scale)
  }

  public drawRotatedRectangularFill(
    leftTopWidthHeight: Vec4,
    rotation: number,
    fillColor: Color,
    gradientCenter: Vec2,
    gradientRadius: number,
    gradientColor: Color
  ): void {
    this.renderer.drawRotatedRectangularFill(
      leftTopWidthHeight,
      rotation,
      fillColor,
      gradientCenter,
      gradientRadius,
      gradientColor
    )
  }

  public drawRectangle(
    tx: number,
    ty: number,
    sx: number,
    sy: number,
    color: [number, number, number, number],
    rotation: number = 0,
    mixValue: number = 0.5
  ): void {
    this.renderer.drawRectangle(tx, ty, sx, sy, color, rotation, mixValue)
  }

  public async serializeComponents(): Promise<string> {
    const components = this.quadTree.getAllElements()
    const serializedComponents = []
    const assets = { fonts: {}, bitmaps: {} } // Separate nodes for fonts and bitmaps

    for (const component of components) {
      if ('getFont' in component && typeof component.getFont === 'function') {
        const font = component.getFont()
        if (font && font.getBase64Texture) {
          const base64Texture = await font.getBase64Texture()
          if (base64Texture) {
            assets.fonts[font.id] = {
              ...font.toJSON(),
              texture: base64Texture
            }
          }
        }
      }
      if ('getBitmap' in component && typeof component.getBitmap === 'function') {
        const bitmap = component.getBitmap()
        if (bitmap && bitmap.getBase64Texture) {
          const base64Texture = await bitmap.getBase64Texture()
          if (base64Texture) {
            assets.bitmaps[bitmap.id] = {
              ...bitmap.toJSON(),
              texture: base64Texture
            }
          }
        }
      }
      serializedComponents.push(await component.toJSON())
    }

    return JSON.stringify({ components: serializedComponents, assets }, null, 2)
  }

  public static async fromJSON(json: any, gl: WebGL2RenderingContext): Promise<NVUI> {
    const ui = new NVUI(gl)

    // Deserialize fonts and bitmaps
    const fonts: { [key: string]: NVFont } = {}
    if (json.assets && json.assets.fonts) {
      for (const [fontId, fontData] of Object.entries(json.assets.fonts)) {
        const font = await NVFont.fromJSON(gl, fontData)
        fonts[fontId] = font
      }
    }

    const bitmaps: { [key: string]: NVBitmap } = {}
    if (json.assets && json.assets.bitmaps) {
      for (const [bitmapId, bitmapData] of Object.entries(json.assets.bitmaps)) {
        const bitmap = await NVBitmap.fromJSON(gl, bitmapData)
        bitmaps[bitmapId] = bitmap
      }
    }

    // Deserialize components
    if (json.components) {
      json.components.forEach((componentData: any) => {
        let component
        switch (componentData.className) {
          case 'BitmapComponent':
            component = BitmapComponent.fromJSON(componentData, bitmaps)
            break
          case 'TextBoxComponent':
            component = TextBoxComponent.fromJSON(componentData, gl, fonts)
            break
          case 'TextComponent':
            component = TextComponent.fromJSON(componentData, fonts)
            break
          case 'ButtonComponent':
            component = ButtonComponent.fromJSON(componentData, gl, fonts)
            break
          case 'CircleComponent':
            component = CircleComponent.fromJSON(componentData)
            break
          case 'TriangleComponent':
            component = TriangleComponent.fromJSON(componentData)
            break
          case 'LineComponent':
            component = LineComponent.fromJSON(componentData)
            break
          case 'ToggleComponent':
            component = ToggleComponent.fromJSON(componentData)
            break
          case 'CaliperComponent':
            component = CaliperComponent.fromJSON(componentData, gl, fonts)
            break
          default:
            console.warn(`Unknown component class: ${componentData.className}`)
            return
        }
        if (component) {
          ui.addComponent(component)
        }
      })
    }

    return ui
  }
}
