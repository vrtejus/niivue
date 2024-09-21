import { vec2 } from 'gl-matrix';
import { NVUIComponent, NVUIComponentContainer } from './nvui-component.js';

export class NVList implements NVUIComponent, NVUIComponentContainer {
    public children: NVUIComponent[] = [];
    private screenPosition: vec2 = vec2.create();  // Screen position of the container
    private spacing: number = 0;  // Spacing between components
    public isVisible: boolean;

    constructor(screenPosition: vec2 | number[], spacing = 0, isVisible = true) {
        this.screenPosition = vec2.fromValues(screenPosition[0], screenPosition[1])
        this.spacing = spacing
        this.isVisible = isVisible
    }

    // Set the screen point of the container
    public setScreenPosition(point: vec2): void {
        vec2.copy(this.screenPosition, point);
    }

    // Get the screen point of the container
    public getScreenPosition(): vec2 {
        return this.screenPosition;
    }

    // Set spacing between components
    public setSpacing(spacing: number): void {
        this.spacing = spacing;
    }

    /**
     * Get the total width of the container based on visible child components.
     * Only considers components with `isVisible` set to true.
     * 
     * @returns The total width of the container based on visible components.
     */
    public getScreenWidth(): number {
        return this.children.reduce((maxWidth, component) => {
            // Only consider the component if it is visible
            if (component.isVisible) {
                return Math.max(maxWidth, component.getScreenWidth());
            }
            return maxWidth;  // Skip components that are not visible
        }, 0);
    }

    /**
     * Get the total height of the container based on visible child components.
     * Only considers components with `isVisible` set to true.
     * 
     * @returns The total height of the container based on visible components.
     */
    public getScreenHeight(): number {
        return this.children.reduce((totalHeight, component) => {
            // Only consider the component if it is visible
            if (component.isVisible) {
                return totalHeight + component.getScreenHeight();
            }
            return totalHeight;  // Skip components that are not visible
        }, 0);
    }

    // Arrange components vertically and render them
    public render(): void {
        let currentY = this.screenPosition[1];  // Start at the container's screen point

        // Iterate through each component
        for (const component of this.children) {
            if (!component.isVisible) {
                continue
            }
            // Set the component's position based on the current Y position
            const screenPoint: vec2 = vec2.fromValues(this.screenPosition[0], currentY);
            component.setScreenPosition(screenPoint);

            // Render the component
            component.render();

            // Update the y position based on the component's height and spacing
            currentY += component.getScreenHeight() + this.spacing;
        }
    }
}