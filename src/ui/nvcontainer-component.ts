import { vec2, mat4, vec4 } from 'gl-matrix'
import { UIComponent, isModelComponent, UIComponentContainer, ProjectedScreenObject, isProjectedScreenObject, NVRenderDimensions, AlignableComponent, AnchoredComponent, isContainerComponent, NVAnchorPoint, UIModelComponent } from './nvui-component.js'

export class NVArcContainer implements AlignableComponent, AnchoredComponent, UIComponentContainer {
    public children: UIComponent[] = []
    public isVisible: boolean = true

    // Implementing the AnchoredComponent properties
    public topLeftAnchor: NVAnchorPoint
    public bottomRightAnchor: NVAnchorPoint

    // Screen positions for the top-left and bottom-right anchors
    private topLeftScreenPosition: vec2 = vec2.create()
    private bottomRightScreenPosition: vec2 = vec2.create()

    constructor(topLeft: NVAnchorPoint, bottomRight: NVAnchorPoint) {
        this.topLeftAnchor = topLeft
        this.bottomRightAnchor = bottomRight
    }

    getScreenPosition(): vec2 {
        return vec2.clone(this.topLeftScreenPosition)
    }

    setScreenPosition(point: vec2): void {
        console.warn('Set screen position should be handled by anchors. Use setTopLeftScreenPosition or setBottomRightScreenPosition.')
    }

    getScreenWidth(): number {
        return this.bottomRightScreenPosition[0] - this.topLeftScreenPosition[0]
    }

    getScreenHeight(): number {
        return this.bottomRightScreenPosition[1] - this.topLeftScreenPosition[1]
    }

    getColor(): vec4 {
        return vec4.fromValues(1.0, 1.0, 1.0, 1.0)
    }

    setColor(color: vec4): void {
        // Optional: Implement container-specific color setting if needed
    }

    render(dimensions: NVRenderDimensions = NVRenderDimensions.NONE): void {
        if (!this.isVisible) return

        // Filter out occluded ProjectedScreenObject and UIModelComponent children
        const visibleComponents = this.filterVisibleComponents()

        // Render only the non-occluded components
        for (const child of visibleComponents) {
            child.render(dimensions)
        }
    }

    // Set the screen position for the top-left anchor point
    setTopLeftScreenPosition(position: vec2): void {
        this.topLeftScreenPosition = vec2.clone(position)
        this.align()
    }

    // Set the screen position for the bottom-right anchor point
    setBottomRightScreenPosition(position: vec2): void {
        this.bottomRightScreenPosition = vec2.clone(position)
        this.align()
    }

    // Align children components in an arc pattern based on the updated anchor screen positions
    align(): void {
        if (this.children.length === 0) return

        const centerX = (this.topLeftScreenPosition[0] + this.bottomRightScreenPosition[0]) / 2
        const centerY = (this.topLeftScreenPosition[1] + this.bottomRightScreenPosition[1]) / 2
        const radius = Math.min(this.getScreenWidth(), this.getScreenHeight()) / 2

        const angleStep = (2 * Math.PI) / this.children.length
        let angle = 0

        for (const child of this.children) {
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)
            child.setScreenPosition(vec2.fromValues(x, y))
            angle += angleStep
        }
    }

    // Update children's projected positions based on a given transformation matrix
    updateChildrenProjectedPositions(leftTopWidthHeight: number[], mvpMatrix: mat4): void {
        for (const child of this.children) {
            if (isModelComponent(child)) {
                child.updateProjectedPosition(leftTopWidthHeight, mvpMatrix)
            }
            // If child is a container, recursively update its children's positions
            if (isContainerComponent(child)) {
                child.updateChildrenProjectedPositions(leftTopWidthHeight, mvpMatrix)
            }
        }
    }

    // Add a new child component to the container
    addChild(child: UIComponent): void {
        this.children.push(child)
        this.align()
    }

    // Remove a child component from the container
    removeChild(child: UIComponent): void {
        const index = this.children.indexOf(child)
        if (index !== -1) {
            this.children.splice(index, 1)
            this.align()
        }
    }

    // Filter visible components based on occlusion
    private filterVisibleComponents(): UIComponent[] {
        const sortedComponents = this.children
            .filter((child): child is ProjectedScreenObject & UIModelComponent =>
                isProjectedScreenObject(child) && isModelComponent(child)
            )
            .slice()
            .sort((a, b) => a.screenDepth - b.screenDepth)

        // Keep track of visible regions on the screen
        const visibleComponents: (ProjectedScreenObject & UIModelComponent)[] = []
        const occupiedRegions: { [key: string]: boolean } = {}

        for (const component of sortedComponents) {
            const position = component.getScreenPosition()
            const width = component.getScreenWidth()
            const height = component.getScreenHeight()

            let isOccluded = false

            // Determine if any part of this component's screen region is already occupied
            for (let x = Math.floor(position[0]); x <= Math.ceil(position[0] + width); x++) {
                for (let y = Math.floor(position[1]); y <= Math.ceil(position[1] + height); y++) {
                    const key = `${x},${y}`
                    if (occupiedRegions[key]) {
                        isOccluded = true
                        break
                    }
                }
                if (isOccluded) break
            }

            // If not occluded, mark the region as occupied and add the component to visibleComponents
            if (!isOccluded) {
                for (let x = Math.floor(position[0]); x <= Math.ceil(position[0] + width); x++) {
                    for (let y = Math.floor(position[1]); y <= Math.ceil(position[1] + height); y++) {
                        const key = `${x},${y}`
                        occupiedRegions[key] = true
                    }
                }
                visibleComponents.push(component)
            }
        }

        // Include non-occluded ProjectedScreenObject and UIModelComponent components
        return this.children.filter(
            (child) => !isProjectedScreenObject(child) || !isModelComponent(child) || visibleComponents.includes(child)
        )
    }
}
