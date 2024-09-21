import { vec2 } from 'gl-matrix';
import { NVUIComponent, NVUIComponentContainer } from './nvui-component.js';

// NVSpan class: Arranges components horizontally with spacing between them
export class NVSpan implements NVUIComponent, NVUIComponentContainer {
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
        // For a horizontal layout, the width is the sum of the widths of all visible components
        return this.children.reduce((totalWidth, component) => {
            if (component.isVisible) {
                return totalWidth + component.getScreenWidth();
            }
            return totalWidth;  // Skip components that are not visible
        }, 0);
    }

    /**
     * Get the total height of the container based on visible child components.
     * Only considers components with `isVisible` set to true.
     * 
     * @returns The total height of the container based on the tallest visible component.
     */
    public getScreenHeight(): number {
        // For a horizontal layout, the height is determined by the tallest visible component
        return this.children.reduce((maxHeight, component) => {
            if (component.isVisible) {
                return Math.max(maxHeight, component.getScreenHeight());
            }
            return maxHeight;  // Skip components that are not visible
        }, 0);
    }

    // Arrange components vertically and render them
    public render(): void {
        let currentX = this.screenPosition[0];  // Start at the container's screen point

        // Iterate through each component
        for (const component of this.children) {
            if (!component.isVisible) {
                continue
            }
            // Set the component's position based on the current Y position
            const screenPoint: vec2 = vec2.fromValues(currentX, this.screenPosition[1]);
            component.setScreenPosition(screenPoint);

            // Render the component
            component.render();

            // Update the x position based on the component's width and spacing
            currentX += component.getScreenWidth() + this.spacing;
        }
    }
}


