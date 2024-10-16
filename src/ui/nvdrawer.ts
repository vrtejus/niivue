import { Shader } from '../shader.js';
import { vertTriangleShader, fragTriangleShader, vertCircleShader, fragCircleShader, fragRectShader, fragStadiumShader, vertLineShader, vertRectShader, vertRoundedRectShader } from '../shader-srcs.js';

export class NVDrawer {
    private gl: WebGL2RenderingContext;
    private lineShader: Shader;
    private canvas: HTMLCanvasElement;

    protected static triangleShader: Shader;
    protected static circleShader: Shader;
    protected static rectShader: Shader;
    protected static genericVAO: WebGLVertexArrayObject;
    protected static roundedRectShader: Shader;

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

        if (!NVDrawer.roundedRectShader) {
            NVDrawer.roundedRectShader = new Shader(gl, vertRoundedRectShader, fragStadiumShader);
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

    calculateNDCValues(rectWidthPixels: number, rectHeightPixels: number, canvasWidth: number, canvasHeight: number) {
        const ndcWidth = (2.0 * rectWidthPixels) / canvasWidth;
        const ndcHeight = (2.0 * rectHeightPixels) / canvasHeight;

        // Calculate appropriate values for roundness and outline width based on the rectangle size
        const u_roundness = Math.min(ndcWidth, ndcHeight) * 0.2; // Example: 20% of the smallest dimension
        const u_outlineWidth = Math.min(ndcWidth, ndcHeight) * 0.05; // Example: 5% of the smallest dimension

        return {
            u_rectSize: [ndcWidth * 0.5, ndcHeight * 0.5],
            u_roundness,
            u_outlineWidth
        };
    }


    /** 
     * Draws a rounded rectangle.
     * @param leftTopWidthHeight - The bounding box of the rounded rectangle (left, top, width, height).
     * @param roundness - The roundness of the corners.
     * @param fillColor - The fill color of the rectangle.
     * @param outlineColor - The outline color of the rectangle.
     * @param outlineWidth - The width of the outline.
    */
    drawStadium(
        leftTopWidthHeight: number[],
        roundness: number,
        fillColor: [number, number, number, number],
        outlineColor: [number, number, number, number],
        outlineWidth = 1.0
    ): void {
        if (!NVDrawer.roundedRectShader) {
            throw new Error('roundedRectShader undefined');
        }

        const gl = this.gl;

        // Use the rounded rectangle shader program
        NVDrawer.roundedRectShader.use(gl);

        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Set the necessary uniforms
        const shader = NVDrawer.roundedRectShader;

        // Set the roundness of the corners
        const radius = 0.02; // Adjust this value as needed for rounded corners
        gl.uniform4fv(NVDrawer.roundedRectShader.uniforms.u_cornerRadii, [radius, radius, radius, radius]);

        // Set the fill color
        const fillColorLocation = gl.getUniformLocation(shader.program, 'u_fillColor');
        gl.uniform4fv(fillColorLocation, fillColor);

        // Set the outline color
        const outlineColorLocation = gl.getUniformLocation(shader.program, 'u_outlineColor');
        gl.uniform4fv(outlineColorLocation, outlineColor);



        // Set the rectangle position and size (using existing uniform from vertex shader)
        const canvasWidthHeightLocation = gl.getUniformLocation(shader.program, 'canvasWidthHeight');
        gl.uniform2fv(canvasWidthHeightLocation, [gl.canvas.width, gl.canvas.height]);

        const leftTopWidthHeightLocation = gl.getUniformLocation(shader.program, 'leftTopWidthHeight');
        gl.uniform4f(
            leftTopWidthHeightLocation,
            leftTopWidthHeight[0],
            leftTopWidthHeight[1],
            leftTopWidthHeight[2],
            leftTopWidthHeight[3]
        );

        // Calculate the NDC width and height based on actual canvas size
        const dpr = window.devicePixelRatio || 1;
        const canvas = gl.canvas as HTMLCanvasElement;
        const canvasWidth = canvas.clientWidth * dpr;
        const canvasHeight = canvas.clientHeight * dpr;

        gl.viewport(0, 0, canvasWidth, canvasHeight);
        // Calculate NDC position of the top-left corner
        const ndcX = (2 * leftTopWidthHeight[0] / canvasWidth) - 1;
        const ndcY = 1 - (2 * leftTopWidthHeight[1] / canvasHeight);

        // Convert width and height to NDC
        const ndcWidth = (2 * leftTopWidthHeight[2]) / canvasWidth;
        const ndcHeight = (2 * leftTopWidthHeight[3]) / canvasHeight;

        // Set uniforms for the shader
        const u_rectPos = [ndcX + ndcWidth / 2, ndcY - ndcHeight / 2]; // Center position in NDC
        const u_rectSize = [ndcWidth / 2, ndcHeight / 2];
        console.log('pos and size', u_rectPos, u_rectSize);
        gl.uniform2f(NVDrawer.roundedRectShader.uniforms.u_rectPos, u_rectPos[0], u_rectPos[1]);
        const aspectRatio = canvasWidth / canvasHeight;
        const correctedWidth = ndcWidth / (aspectRatio > 1.0 ? aspectRatio : 1.0);
        const correctedHeight = ndcHeight / (aspectRatio < 1.0 ? 1.0 / aspectRatio / 2 : 1.0);
        // gl.uniform2f(NVDrawer.roundedRectShader.uniforms.u_rectSize, correctedWidth / 2, correctedHeight / 2);
        gl.uniform2f(NVDrawer.roundedRectShader.uniforms.u_rectSize, ndcWidth / 2.04, ndcHeight / 4.9);

        // Set the outline width in NDC units
        const outlineWidthNDC = Math.min(ndcWidth, ndcHeight) * 0.04; // Adjust for visible outline
        gl.uniform1f(NVDrawer.roundedRectShader.uniforms.u_outlineWidth, outlineWidthNDC);



        // Set default outline width (2% of the smallest dimension in NDC)
        const defaultOutlineWidth = 0.03 * Math.min(ndcWidth, ndcHeight);
        gl.uniform1f(NVDrawer.roundedRectShader.uniforms.u_outlineWidth, defaultOutlineWidth);


        // Set canvas resolution
        gl.uniform2f(NVDrawer.roundedRectShader.uniforms.iResolution, canvasWidth, canvasHeight);

        // Set roundness (at least half of height for stadium ends)
        const defaultRoundness = Math.min(ndcWidth / 2, ndcHeight / 2) * 0.5;
        gl.uniform1f(NVDrawer.roundedRectShader.uniforms.u_roundness, defaultRoundness);



        // Bind the VAO that contains the vertex data and attribute pointers
        gl.bindVertexArray(NVDrawer.genericVAO);

        // Draw the rounded rectangle using TRIANGLE_STRIP (assuming this VAO holds the appropriate vertex data)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Unbind the VAO to avoid accidental modification
        gl.bindVertexArray(null);
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