import { NVText, NVScreenText, NVModelText } from './nvtext.js'

export class NVButton {
    private textInstance: NVText // Could be NVScreenText or NVModelText
    private width: number
    private height: number
    private onClick: (() => void) | null

    constructor(
        textInstance: NVText, // NVScreenText for 2D or NVModelText for 3D
        width: number,
        height: number,
        onClick?: () => void
    ) {
        this.textInstance = textInstance
        this.width = width
        this.height = height
        this.onClick = onClick || null
    }

    // Set the onClick handler
    public setOnClick(handler: () => void): void {
        this.onClick = handler
    }

    // Check if a click is inside the button's boundaries (2D or 3D)
    public checkClick(x: number, y: number): boolean {
        const position = this.getPosition()
        const minX = position.x
        const maxX = position.x + this.width
        const minY = position.y
        const maxY = position.y + this.height

        return x >= minX && x <= maxX && y >= minY && y <= maxY
    }

    // Get the position of the button (screen or model space)
    private getPosition(): { x: number, y: number } {
        if (this.textInstance instanceof NVScreenText) {
            return this.textInstance.getScreenPosition()
        } else if (this.textInstance instanceof NVModelText) {
            const { x, y } = this.textInstance.getModelPosition()
            return { x, y }
        }
        return { x: 0, y: 0 } // Fallback in case it's neither
    }

    // Check if the text associated with the button is visible
    private isTextVisible(): boolean {
        if (this.textInstance instanceof NVModelText) {
            return this.textInstance['isPointVisible']() // Check visibility for NVModelText
        }
        return true // NVScreenText is always visible (no clipping plane)
    }

    // Simulate click action (x, y are click coordinates)
    public click(x: number, y: number): void {
        if (this.checkClick(x, y) && this.onClick && this.isTextVisible()) {
            this.onClick()
        } else {
            console.log("Button cannot be clicked because it's either not visible or the click is outside the button.")
        }
    }

    // Render the button, only if the associated 3D text point is visible
    public render(): void {
        if (this.isTextVisible()) {
            console.log(`Rendering button with text: "${this.textInstance['text']}"`)
            this.textInstance.render()
        } else {
            console.log(`Button text: "${this.textInstance['text']}" is not visible and will not be rendered.`)
        }
    }
}
