import { BaseContainerComponent } from './basecontainercomponent.js'
import { IUIComponent } from '../interfaces.js'
import { NVRenderer } from '../nvrenderer.js'
import { Vec2, Color } from '../types.js'

export class ContainerButtonComponent extends BaseContainerComponent {
    private onClickHandler?: () => void
    private fillColor: Color
    private highlightColor: Color
    outlineColor: Color
    roundness: number

    constructor(
        position: Vec2,
        canvas: HTMLCanvasElement,
        outlineColor: Color = [1, 1, 1, 1],
        fillColor: Color = [0, 0, 0, 0.3],
        highlightColor: Color = [0.5, 0.5, 0.5, 1.0],
        roundness = 0.0,
        maxWidth = 0,
        maxHeight = 0,
        isHorizontal: boolean = true,
        padding: number = 50
    ) {
        super(position, canvas, isHorizontal, padding)
        this.fillColor = fillColor
        this.highlightColor = highlightColor
        this.outlineColor = outlineColor
        this.roundness = roundness
        this.maxWidth = maxWidth
        this.maxHeight = maxHeight

        // Adding click effects to create a bounce animation

        // Effect 1: Shrink the size of the button on click (bounce effect)
        this.addEventEffect(
            'click',
            this,
            'scale',
            'animateValue',
            1.0,  // start value (normal size)
            0.9,  // target value (shrinked size)
            100,  // duration in milliseconds
            true  // isBounce - true to create a bounce effect
        )

        // Effect 2: Move the button down slightly to maintain the same center point (bounce effect)
        this.addEventEffect(
            'click',
            this,
            'position',
            'animateValue',
            [this.getPosition()[0], this.getPosition()[1]],        // start position
            [this.getPosition()[0], this.getPosition()[1] + 5],    // target position (move down by 5 units)
            100,                                                  // duration in milliseconds
            true                                                  // isBounce - true to create a bounce effect
        )

    }

    handleMouseClick(mousePosition: Vec2): void {
        const [x, y, width, height] = this.getBounds()
        if (
            mousePosition[0] >= x &&
            mousePosition[0] <= x + width &&
            mousePosition[1] >= y &&
            mousePosition[1] <= y + height
        ) {
            this.applyEventEffects('click')
            if (this.onClickHandler) {
                this.onClickHandler()
            }
        }
    }

    draw(renderer: NVRenderer): void {
        if (!this.isVisible) return

        // Draw the button background
        // renderer.drawRect(this.getBounds(), this.fillColor)
        const bounds = this.getBounds()
        renderer.drawRoundedRect(bounds, this.fillColor, this.outlineColor, (Math.min(1.0, this.roundness) / 2) * Math.min(bounds[2], bounds[3]))

        // Draw the child components
        this.components.forEach(component => {
            if (component.isVisible) {
                component.draw(renderer)
            }
        })
    }

    addMouseEffects(): void {
        // Adding mouse enter effect to change fill color to highlight
        this.addEventEffect('mouseEnter', this, 'fillColor', 'setValue', this.highlightColor)

        // Adding mouse leave effect to revert to original fill color
        this.addEventEffect('mouseLeave', this, 'fillColor', 'setValue', this.fillColor)
    }
}
