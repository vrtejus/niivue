import { NVFont } from './nvfont.js'
import { vec2 } from 'gl-matrix'

export class NVText {
    protected font: NVFont
    public scale: number
    public text: string
    public color: number[]


    constructor(text: string, font: NVFont, color: number[] = [1.0, 0.0, 0.0, 1.0], scale: number = 1.0) {
        this.text = text
        this.font = font
        this.color = color
        this.scale = scale

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

        console.log(`Rendering screen text: ${this.text} at position (${this.screenPosition}) with scale ${this.scale}`)
        this.font.drawText([this.screenPosition[0], this.screenPosition[1]], this.text, this.scale, this.color)
    }
}

export class NVModelText extends NVScreenText {
    private modelPosition: { x: number, y: number, z: number } // 3D position in model space
    private clipPlane: [number, number, number, number] // Clip plane in the form [a, b, c, d]
    private azimuth: number
    private elevation: number

    constructor(
        text: string,
        font: NVFont,
        modelPosition: { x: number, y: number, z: number },
        azimuth: number = 0, // Default azimuth (degrees)
        elevation: number = 0, // Default elevation (degrees)
        clipPlane?: [number, number, number, number], // Optional clip plane (a, b, c, d)
        color: number[] = [1.0, 0.0, 0.0, 1.0],
        scale?: number
    ) {
        super(text, vec2.create(), font, color, scale)
        this.modelPosition = modelPosition
        this.clipPlane = clipPlane || [0, 0, 0, 0] // Default clip plane
        this.azimuth = azimuth
        this.elevation = elevation
    }

    // Converts spherical coordinates (azimuth, elevation, depth) to Cartesian and updates the clip plane
    public setClipPlane(depthAzimuthElevation: number[]): void {
        const v = this.sph2cartDeg(depthAzimuthElevation[1] + 180, depthAzimuthElevation[2])
        this.clipPlane = [v[0], v[1], v[2], depthAzimuthElevation[0]]
    }

    // Set the camera azimuth and elevation to calculate the final transformation
    public setAzimuthElevation(azimuth: number, elevation: number): void {
        this.azimuth = azimuth
        this.elevation = elevation
    }

    // Utility function: Converts spherical to Cartesian coordinates (degrees)
    private sph2cartDeg(azimuth: number, elevation: number): [number, number, number] {
        const radAzimuth = (azimuth * Math.PI) / 180
        const radElevation = (elevation * Math.PI) / 180
        const x = Math.cos(radElevation) * Math.cos(radAzimuth)
        const y = Math.cos(radElevation) * Math.sin(radAzimuth)
        const z = Math.sin(radElevation)
        return [x, y, z]
    }

    // Transform the model point to clip space using azimuth and elevation (camera transformation)
    private transformToClipSpace(): { x: number, y: number, z: number } {
        const { x, y, z } = this.modelPosition
        const radAzimuth = (this.azimuth * Math.PI) / 180
        const radElevation = (this.elevation * Math.PI) / 180

        // Apply azimuth rotation around the Y axis
        const rotatedX = x * Math.cos(radAzimuth) - z * Math.sin(radAzimuth)
        const rotatedZ = x * Math.sin(radAzimuth) + z * Math.cos(radAzimuth)

        // Apply elevation rotation around the X axis
        const rotatedY = y * Math.cos(radElevation) - rotatedZ * Math.sin(radElevation)
        const finalZ = y * Math.sin(radElevation) + rotatedZ * Math.cos(radElevation)

        return { x: rotatedX, y: rotatedY, z: finalZ }
    }

    // Check if the transformed model text's point is visible based on the clip plane
    private isPointVisible(): boolean {
        const transformed = this.transformToClipSpace()
        const { x, y, z } = transformed
        const [a, b, c, d] = this.clipPlane

        // Check if the transformed point lies on the visible side of the clip plane using the plane equation
        // Plane equation: a * x + b * y + c * z + d >= 0
        const distance = a * x + b * y + c * z + d
        return distance >= 0
    }

    // Return the model position
    public getModelPosition(): { x: number, y: number, z: number } {
        return this.modelPosition
    }

    // Override render method to only render if the point is visible
    // public render(): void {
    //     if (this.isPointVisible()) {
    //         // console.log(`Rendering model text: ${this.text} at position (${this.modelPosition.x}, ${this.modelPosition.y}, ${this.modelPosition.z}) with scale ${this.scale}`)
    //         // Add your 3D model rendering logic here
    //     } else {
    //         console.log(`Model text: "${this.text}" is not visible because the point is occluded`)
    //     }
    // }
}

