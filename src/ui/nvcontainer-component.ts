import { vec2, mat4 } from 'gl-matrix'
import {
    UIComponent,
    isModelComponent,
    UIComponentContainer,
    ProjectedScreenObject,
    isProjectedScreenObject,
    NVRenderDimensions,
    AlignableComponent,
    AnchoredComponent,
    isContainerComponent,
    NVAnchorPoint,
    UIModelComponent,
    isAnchoredComponent
} from './nvui-component.js'

export class NVArcContainer implements AlignableComponent, AnchoredComponent, UIComponentContainer {
    public children: UIComponent[] = []
    public isVisible: boolean = true
    public isRenderedIn2D: boolean
    public isRenderedIn3D: boolean

    // Implementing the AnchoredComponent properties
    public topLeftAnchor: NVAnchorPoint
    public bottomRightAnchor: NVAnchorPoint

    // Screen positions for the top-left and bottom-right anchors
    private topLeftScreenPosition: vec2 = vec2.create()
    private bottomRightScreenPosition: vec2 = vec2.create()

    constructor(topLeft: NVAnchorPoint, bottomRight: NVAnchorPoint, isVisible = true, isRenderedIn2D = true, isRenderedIn3D = true) {
        this.topLeftAnchor = topLeft
        this.bottomRightAnchor = bottomRight
        this.isVisible = isVisible
        this.isRenderedIn2D = isRenderedIn2D
        this.isRenderedIn3D = isRenderedIn3D
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

    render(dimensions: NVRenderDimensions = NVRenderDimensions.NONE): void {
        if (!this.isVisible) return

        let renderedChildren = this.children
        if (dimensions != NVRenderDimensions.NONE) {
            switch (dimensions) {
                case NVRenderDimensions.TWO:
                    renderedChildren = renderedChildren.filter(x => x.isVisible && x.isRenderedIn2D)
                    break
                case NVRenderDimensions.THREE:
                    renderedChildren = renderedChildren.filter(x => x.isVisible && x.isRenderedIn3D)
                    break
            }
        }

        // Filter out occluded ProjectedScreenObject and UIModelComponent children
        const visibleComponents = this.filterVisibleComponents(renderedChildren)

        // Render only the non-occluded components
        for (const child of visibleComponents) {
            child.render(dimensions)
        }
    }

    // Set the screen position for the top-left anchor point
    setTopLeftScreenPosition(position: vec2): void {
        this.topLeftScreenPosition = vec2.clone(position)
    }

    // Set the screen position for the bottom-right anchor point
    setBottomRightScreenPosition(position: vec2): void {
        this.bottomRightScreenPosition = vec2.clone(position)
    }

    // Align children components in an arc pattern based on their projected positions
    align(dimensions: NVRenderDimensions, leftTopWidthHeight: number[]): void {
        if (this.children.length === 0) return

        const [left, top, canvasWidth, canvasHeight] = leftTopWidthHeight

        // Calculate the center and radius of the arc based on the rendering bounds
        const centerX = left + canvasWidth / 2
        const centerY = top + canvasHeight / 2
        const radius = Math.min(canvasWidth, canvasHeight) / 2

        // Calculate the angle step based on the number of visible components
        const visibleChildren = this.children.filter(child => {
            if (!child.isVisible) return false
            if (isModelComponent(child)) {
                if (dimensions === NVRenderDimensions.TWO && !child.isRenderedIn2D) return false
                if (dimensions === NVRenderDimensions.THREE && !child.isRenderedIn3D) return false
            }
            return true
        })

        if (visibleChildren.length === 0) return

        const angleStep = (2 * Math.PI) / visibleChildren.length
        let angle = Math.PI * .75

        // Array to store components with their precomputed projected positions
        const projectedPositions: { component: UIComponent, projectedPos: vec2, width: number, height: number }[] = []

        // Generate array of projected positions for each visible child
        for (const child of visibleChildren) {
            if (isModelComponent(child)) {
                const projectedPos = vec2.clone(child.getProjectedPosition())
                const width = child.getScreenWidth()
                const height = child.getScreenHeight()
                projectedPositions.push({ component: child, projectedPos, width, height })
            }
        }

        // Distribute components evenly in an arc based on closest proximity
        for (let i = 0; i < visibleChildren.length; i++) {
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)

            // Calculate the screen position considering the component's width and height
            const screenPos = vec2.fromValues(x, y)

            // Find the closest component to this screen position
            let closestIndex = -1
            let closestDistance = Number.MAX_VALUE

            for (let j = 0; j < projectedPositions.length; j++) {
                const { projectedPos, width, height } = projectedPositions[j]

                // Calculate the distance from the screen position to the center of the component's bounding box
                const centerXPos = projectedPos[0] + width / 2
                const centerYPos = projectedPos[1] + height / 2
                const distance = vec2.distance(screenPos, vec2.fromValues(centerXPos, centerYPos))

                if (distance < closestDistance) {
                    closestDistance = distance
                    closestIndex = j
                }
            }

            // If a closest component was found, assign it to the current screen position
            if (closestIndex !== -1) {
                const closestComponent = projectedPositions[closestIndex].component

                // Adjust the screen position to keep the component fully within bounds
                let adjustedX = screenPos[0]
                let adjustedY = screenPos[1]

                // Prevent the component from being positioned outside the left or right bounds
                adjustedX = Math.max(left, Math.min(adjustedX, left + canvasWidth - closestComponent.getScreenWidth() * 1.5))

                // Prevent the component from being positioned outside the top or bottom bounds
                adjustedY = Math.max(top, Math.min(adjustedY, top + canvasHeight - closestComponent.getScreenHeight() * 1.5))

                // Set the adjusted screen position to the component
                closestComponent.setScreenPosition(vec2.fromValues(adjustedX, adjustedY))

                // Remove the assigned component from the list to avoid duplicate assignments
                projectedPositions.splice(closestIndex, 1)
            }

            // Increment the angle for the next position
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
    }

    // Remove a child component from the container
    removeChild(child: UIComponent): void {
        const index = this.children.indexOf(child)
        if (index !== -1) {
            this.children.splice(index, 1)
        }
    }

    // Filter visible components based on occlusion
    private filterVisibleComponents(renderedChildren: UIComponent[]): UIComponent[] {
        const sortedComponents = renderedChildren
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
