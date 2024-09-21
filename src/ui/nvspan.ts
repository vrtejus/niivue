// import { vec2 } from 'gl-matrix';
// import { NVUiComponent } from './nvui-component.js';

// // NVSpan class: Arranges components horizontally with spacing between them
// export class NVSpan implements NVUiComponent {
//     private components: NVUiComponent[] = [];
//     private screenPoint: vec2 = vec2.create();  // Screen position of the container
//     private spacing: number = 0;  // Spacing between components
//     private rectShader: any;  // Shader used to draw the rectangle

//     constructor(rectShader: any) {
//         this.rectShader = rectShader;  // Store the rectShader passed to the constructor
//     }

//     // Add a new component to the span
//     public addComponent(component: NVUiComponent): void {
//         this.components.push(component);
//     }

//     // Set the screen point of the container
//     public setScreenPoint(point: vec2): void {
//         vec2.copy(this.screenPoint, point);
//     }

//     // Get the screen point of the container
//     public getScreenPoint(): vec2 {
//         return this.screenPoint;
//     }

//     // Set spacing between components
//     public setSpacing(spacing: number): void {
//         this.spacing = spacing;
//     }

//     // Get the width of the container based on the total width of the components and spacing
//     public getScreenWidth(): number {
//         const totalComponentWidth = this.components.reduce((width, component) => width + component.getScreenWidth(), 0);
//         const totalSpacing = this.spacing * (this.components.length - 1);  // Total spacing between components
//         return totalComponentWidth + totalSpacing;
//     }

//     // Get the height of the container (determined by the tallest component)
//     public getScreenHeight(): number {
//         return this.components.reduce((height, component) => Math.max(height, component.getScreenHeight()), 0);
//     }

//     // Arrange components horizontally and render them
//     public render(): void {
//         let currentX = this.screenPoint[0];  // Start at the container's screen point

//         // Draw the containing rectangle for the components
//         this.drawContainerRect();

//         // Iterate through each component
//         for (let component of this.components) {
//             // Set the component's position based on the current X position
//             const screenPoint: vec2 = vec2.fromValues(currentX, this.screenPoint[1]);
//             component.setScreenPoint(screenPoint);

//             // Render the component
//             component.render();

//             // Update the x position based on the component's width and spacing
//             currentX += component.getScreenWidth() + this.spacing;
//         }
//     }

//     // Draw a rectangle around the container based on its dimensions and position
//     private drawContainerRect(): void {
//         const width = this.getScreenWidth();
//         const height = this.getScreenHeight();
//         const leftTopWidthHeight = [
//             this.screenPoint[0],        // X position (left)
//             this.screenPoint[1],        // Y position (top)
//             width,                      // Width
//             height                      // Height
//         ];

//         // Call the drawRect function with the calculated rectangle dimensions
//         this.drawRect(leftTopWidthHeight, [1, 0, 0, 1]);  // Example color: Red
//     }

//     // Wrapper function to call the provided drawRect function
//     private drawRect(leftTopWidthHeight: number[], lineColor = [1, 0, 0, -1]): void {
//         if (!this.rectShader) {
//             throw new Error('rectShader undefined');
//         }

//         // Assuming rectShader and drawRect logic is implemented as given in the question
//         this.rectShader.use(this.gl);
//         this.gl.enable(this.gl.BLEND);
//         this.gl.uniform4fv(this.rectShader.uniforms.lineColor, lineColor);
//         this.gl.uniform2fv(this.rectShader.uniforms.canvasWidthHeight, [this.gl.canvas.width, this.gl.canvas.height]);
//         this.gl.uniform4f(
//             this.rectShader.uniforms.leftTopWidthHeight,
//             leftTopWidthHeight[0],
//             leftTopWidthHeight[1],
//             leftTopWidthHeight[2],
//             leftTopWidthHeight[3]
//         );
//         this.gl.bindVertexArray(this.genericVAO);
//         this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
//         this.gl.bindVertexArray(this.unusedVAO);  // switch off to avoid tampering with settings
//     }
// }


