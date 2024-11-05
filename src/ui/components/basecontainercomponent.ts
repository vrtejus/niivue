import { BaseUIComponent } from './baseuicomponent.js'
import { NVRenderer } from '../nvrenderer.js'
import { Vec2, Vec4 } from '../types.js'
import { QuadTree, Rectangle } from '../quadtree.js'
import { IUIComponent } from '../interfaces.js'

export abstract class BaseContainerComponent extends BaseUIComponent {
    protected components: BaseUIComponent[] = []
    protected isHorizontal: boolean
    protected padding: number
    protected _quadTree: QuadTree<IUIComponent>
    protected maxWidth: number = 0
    protected maxHeight: number = 0

    constructor(position: Vec2, canvas: HTMLCanvasElement, isHorizontal: boolean = true, padding: number = 10) {
        super()
        this.setPosition(position)
        this.isHorizontal = isHorizontal
        this.padding = padding
        const bounds = new Rectangle(0, 0, canvas.width, canvas.height)
        this._quadTree = new QuadTree<IUIComponent>(bounds)
    }

    set quadTree(quadTree: QuadTree<IUIComponent>) {
        this.components.forEach(child => {
            quadTree.insert(child)
        })
        this._quadTree.getAllElements().forEach(child => {
            this._quadTree.remove(child)
        })
        this._quadTree = quadTree
    }

    get quadTree(): QuadTree<IUIComponent> {
        return this._quadTree
    }

    addComponent(component: BaseUIComponent): void {
        this.components.push(component)
        this._quadTree.insert(component)
        this.updateLayout()
    }

    removeComponent(component: BaseUIComponent): void {
        const index = this.components.indexOf(component)
        if (index > -1) {
            this.components.splice(index, 1)
            this._quadTree.remove(component)
            this.updateLayout()
        }
    }

    updateLayout(): void {
        let offset = this.padding
        this.components.forEach((component, index) => {
            if (this.isHorizontal) {
                component.setPosition([this.position[0] + offset, this.position[1] + this.padding])
                offset += component.getBounds()[2] + this.padding
            } else {
                component.setPosition([this.position[0] + this.padding, this.position[1] + offset])
                offset += component.getBounds()[3] + this.padding
            }
        })
        this.updateBounds()
    }

    updateBounds(): void {
        if (this.components.length > 0) {
            let totalWidth = 0
            let totalHeight = 0

            if (this.isHorizontal) {
                totalWidth = this.components.reduce((sum, component) => sum + component.getBounds()[2], 0) + (this.padding * (this.components.length + 1))
                totalHeight = Math.max(...this.components.map(component => component.getBounds()[3])) + 2 * this.padding
            } else {
                totalWidth = Math.max(...this.components.map(component => component.getBounds()[2])) + 2 * this.padding
                totalHeight = this.components.reduce((sum, component) => sum + component.getBounds()[3], 0) + (this.padding * (this.components.length + 1))
            }

            this.setBounds([this.position[0], this.position[1], totalWidth, totalHeight])
        } else {
            this.setBounds([this.position[0], this.position[1], 0, 0])
        }
    }

    draw(renderer: NVRenderer): void {
        if (!this.isVisible) return
        this.components.forEach(component => {
            const [x, y, width, height] = component.getBounds()
            const [containerX, containerY, containerWidth, containerHeight] = this.getBounds()

            // Check for overflow conditions
            if (
                (this.maxWidth > 0 && x + width > containerX + this.maxWidth) ||
                (this.maxHeight > 0 && y + height > containerY + this.maxHeight)
            ) {
                return // Skip drawing this component if it exceeds maxWidth or maxHeight
            }

            if (component.isVisible) {
                component.draw(renderer)
            }
        })
    }

    setPosition(position: Vec2): void {
        super.setPosition(position)
        this.updateLayout()
    }
}
