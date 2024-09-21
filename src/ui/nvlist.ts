// import { vec2 } from 'gl-matrix';
// import { NVUIComponent, NVUIComponentContainer } from './nvui-component.js';

// export class NVList implements NVUIComponent, NVUIComponentContainer {
//     public children: NVUIComponent[] = [];
//     private screenPoint: vec2 = vec2.create();  // Screen position of the container
//     private spacing: number = 0;  // Spacing between components

//     // Set the screen point of the container
//     public setScreenPosition(point: vec2): void {
//         vec2.copy(this.screenPoint, point);
//     }

//     // Get the screen point of the container
//     public getScreenPosition(): vec2 {
//         return this.screenPoint;
//     }

//     // Set spacing between components
//     public setSpacing(spacing: number): void {
//         this.spacing = spacing;
//     }

//     // Get the width of the container (determined by the widest component)
//     public getScreenWidth(): number {
//         return this.children.reduce((width, component) => Math.max(width, component.getScreenWidth()), 0);
//     }

//     // Get the height of the container based on the total height of the components and spacing
//     public getScreenHeight(): number {
//         const totalComponentHeight = this.children.reduce((height, component) => height + component.getScreenHeight(), 0);
//         const totalSpacing = this.spacing * (this.children.length - 1);  // Total spacing between components
//         return totalComponentHeight + totalSpacing;
//     }

//     // Arrange components vertically and render them
//     public render(): void {
//         let currentY = this.screenPoint[1];  // Start at the container's screen point

//         // Iterate through each component
//         for (let component of this.children) {
//             // Set the component's position based on the current Y position
//             const screenPoint: vec2 = vec2.fromValues(this.screenPoint[0], currentY);
//             component.setScreenPosition(screenPoint);

//             // Render the component
//             component.render();

//             // Update the y position based on the component's height and spacing
//             currentY += component.getScreenHeight() + this.spacing;
//         }
//     }
// }