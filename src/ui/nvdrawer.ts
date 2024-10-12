import { Shader } from '../shader.js';
import { vertTriangleShader, fragTriangleShader, vertCircleShader, fragCircleShader, fragRectShader, vertLineShader, vertRectShader } from '../shader-srcs.js';

export class NVDrawer {
    private gl: WebGL2RenderingContext;
    private lineShader: Shader;
    private canvas: HTMLCanvasElement;

    protected static triangleShader: Shader;
    protected static circleShader: Shader;
    protected static rectShader: Shader;
    protected static genericVAO: WebGLVertexArrayObject;

    /**
     * Creates an instance of NVDrawer.
     * @param gl - The WebGL2RenderingContext to be used for rendering.
     */
    constructor(gl: WebGL2RenderingContext) {
        // Initialize static shaders and buffers if not already initialized
        this.gl = gl;
        this.canvas = gl.canvas as HTMLCanvasElement;
        this.lineShader = new Shader(gl, vertLineShader, fragRectShader);

        if (!NVDrawer.triangleShader) {
            NVDrawer.triangleShader = new Shader(gl, vertTriangleShader, fragTriangleShader);
        }

        if (!NVDrawer.circleShader) {
            NVDrawer.circleShader = new Shader(gl, vertCircleShader, fragCircleShader);
        }

        if (!NVDrawer.rectShader) {
            NVDrawer.rectShader = new Shader(gl, vertRectShader, fragRectShader);
        }

        if (!NVDrawer.genericVAO) {
            const rectStrip = [
                1, 1, 0, // RAI
                1, 0, 0, // RPI
                0, 1, 0, // LAI
                0, 0, 0  // LPI
            ];

            const vao = gl.createVertexArray()!;
            const vbo = gl.createBuffer()!;

            gl.bindVertexArray(vao);
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectStrip), gl.STATIC_DRAW);

            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

            NVDrawer.genericVAO = vao;
        }
    }

    /**
     * Draws a line with a triangle at the end.
     * @param startXYendXY - The start and end coordinates of the line.
     * @param thickness - The thickness of the line.
     * @param lineColor - The color of the line.
     * @param triangleColor - The color of the triangle.
     */
    drawLineWithTriangle(startXYendXY: number[], thickness: number, lineColor: [number, number, number, number], triangleColor: [number, number, number, number]) {
        const [glStartX, glStartY] = this.convertToGLCoordinates(startXYendXY[0], startXYendXY[1]);
        const [glEndX, glEndY] = this.convertToGLCoordinates(startXYendXY[2], startXYendXY[3]);

        // Draw the bisecting line first
        this.drawLine([glStartX, glStartY, glEndX, glEndY], thickness, lineColor);

        // Calculate the direction of the line
        const dirX = glEndX - glStartX;
        const dirY = glEndY - glStartY;

        // Normalize direction
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        const normDirX = dirX / length;
        const normDirY = dirY / length;

        // Calculate the triangle points
        const triHeight = 0.1 * thickness; // Height of the triangle proportional to thickness
        const triWidth = 0.05 * thickness; // Width of the triangle proportional to thickness

        const baseX = glEndX;
        const baseY = glEndY;

        // Calculate the other two vertices of the triangle
        const perpX = -normDirY;
        const perpY = normDirX;

        const leftX = baseX + perpX * triWidth - normDirX * triHeight;
        const leftY = baseY + perpY * triWidth - normDirY * triHeight;

        const rightX = baseX - perpX * triWidth - normDirX * triHeight;
        const rightY = baseY - perpY * triWidth - normDirY * triHeight;

        // Draw the triangle
        this.drawTriangle([baseX, baseY, leftX, leftY, rightX, rightY], triangleColor);
    }

    /**
     * Draws a line with a circle at the end.
     * @param startXYendXY - The start and end coordinates of the line.
     * @param thickness - The thickness of the line.
     * @param lineColor - The color of the line.
     * @param circleColor - The color of the circle.
     * @param diameter - The diameter of the circle.
     */
    drawLineWithCircle(startXYendXY: number[], thickness: number, lineColor: [number, number, number, number], circleColor: [number, number, number, number], diameter: number) {
        const [glStartX, glStartY] = this.convertToGLCoordinates(startXYendXY[0], startXYendXY[1]);
        const [glEndX, glEndY] = this.convertToGLCoordinates(startXYendXY[2], startXYendXY[3]);

        // Draw the line first
        this.drawLine([glStartX, glStartY, glEndX, glEndY], thickness, lineColor);

        // Draw the circle at the endpoint
        this.drawCircle([glEndX - diameter / 2, glEndY - diameter / 2, diameter, diameter], circleColor, 1.0); // Using square buffer for the circle
    }

    /**
     * Draws a line.
     * @param startXYendXY - The start and end coordinates of the line.
     * @param thickness - The thickness of the line.
     * @param lineColor - The color of the line.
     */
    drawLine(startXYendXY: number[], thickness = 1, lineColor = [1, 0, 0, -1]): void {
        const gl = this.gl;

        this.lineShader.use(gl);
        gl.enable(gl.BLEND);
        gl.uniform4fv(this.lineShader.uniforms.lineColor, lineColor);
        gl.uniform2fv(this.lineShader.uniforms.canvasWidthHeight, [gl.canvas.width, gl.canvas.height]);
        gl.uniform1f(this.lineShader.uniforms.thickness, thickness);
        gl.uniform4fv(this.lineShader.uniforms.startXYendXY, startXYendXY);

        gl.bindVertexArray(NVDrawer.genericVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null); // set vertex attributes
    }

    /**
     * Draws a rectangle.
     * @param leftTopWidthHeight - The bounding box of the rectangle (left, top, width, height).
     * @param lineColor - The color of the rectangle.
     */
    drawRect(leftTopWidthHeight: number[], lineColor = [1, 0, 0, -1]): void {
        if (!NVDrawer.rectShader) {
            throw new Error('rectShader undefined');
        }
        NVDrawer.rectShader.use(this.gl);
        this.gl.enable(this.gl.BLEND);
        this.gl.uniform4fv(NVDrawer.rectShader.uniforms.lineColor, lineColor);
        this.gl.uniform2fv(NVDrawer.rectShader.uniforms.canvasWidthHeight, [this.gl.canvas.width, this.gl.canvas.height]);
        this.gl.uniform4f(
            NVDrawer.rectShader.uniforms.leftTopWidthHeight,
            leftTopWidthHeight[0],
            leftTopWidthHeight[1],
            leftTopWidthHeight[2],
            leftTopWidthHeight[3]
        );
        this.gl.bindVertexArray(NVDrawer.genericVAO);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.bindVertexArray(null); // switch off to avoid tampering with settings
    }

    /**
     * Draws a triangle.
     * @param vertices - The coordinates of the triangle vertices.
     * @param color - The color of the triangle.
     */
    private drawTriangle(vertices: number[], color: [number, number, number, number]) {
        const gl = this.gl;

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        NVDrawer.triangleShader.use(gl);

        const coord = gl.getAttribLocation(NVDrawer.triangleShader.program, "coordinates");
        const colorLocation = gl.getUniformLocation(NVDrawer.triangleShader.program, "color");
        gl.uniform4fv(colorLocation, color);

        gl.enableVertexAttribArray(coord);
        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /**
       * Draws a circle.
       * @param leftTopWidthHeight - The bounding box of the circle (left, top, width, height).
       * @param circleColor - The color of the circle.
       * @param fillPercent - The fill percentage of the circle.
       */
    private drawCircle(leftTopWidthHeight: number[], circleColor: number[], fillPercent = 1.0): void {
        const gl = this.gl;

        NVDrawer.circleShader.use(gl);

        this.gl.enable(this.gl.BLEND);
        this.gl.uniform4fv(NVDrawer.circleShader.uniforms.circleColor, circleColor);
        this.gl.uniform2fv(NVDrawer.circleShader.uniforms.canvasWidthHeight, [this.gl.canvas.width, this.gl.canvas.height]);
        this.gl.uniform4f(
            NVDrawer.circleShader.uniforms.leftTopWidthHeight,
            leftTopWidthHeight[0],
            leftTopWidthHeight[1],
            leftTopWidthHeight[2],
            leftTopWidthHeight[3]
        );
        this.gl.uniform1f(NVDrawer.circleShader.uniforms.fillPercent, fillPercent);

        gl.bindVertexArray(NVDrawer.genericVAO);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    /**
     * Converts canvas coordinates to WebGL coordinates.
     * @param x - The x-coordinate in canvas space.
     * @param y - The y-coordinate in canvas space.
     * @returns The coordinates in WebGL space.
     */
    private convertToGLCoordinates(x: number, y: number): [number, number] {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const glX = (x / canvasWidth) * 2 - 1;
        const glY = 1 - (y / canvasHeight) * 2;

        return [glX, glY];
    }
}