import { vec3, vec2, mat4, vec4 } from "gl-matrix";
import { UIModelComponent } from "./nvui-component.js";

export class NVModelComponent implements UIModelComponent {
    public isVisible: boolean;
    private modelPosition: vec3 // 3D position in model space
    private projectedPosition: vec2
    private hideDepth: number // clip space depth to hide control
    public isRenderedIn2D: boolean
    public isRenderedIn3D: boolean
    public isVisibleIn2D = false
    public isVisibleIn3D = false

    constructor(modelPosition: vec3, hideDepth: number = 0, isRenderedIn2D = true, isRenderedIn3D = true, isVisible = true) {
        this.modelPosition = modelPosition
        this.hideDepth = hideDepth
        this.isRenderedIn2D = isRenderedIn2D
        this.isRenderedIn3D = isRenderedIn3D
        this.isVisible = isVisible
        this.projectedPosition = vec2.create()
    }

    getModelPosition(): vec3 {
        return this.modelPosition
    }
    getHideDepth(): number {
        return this.hideDepth
    }
    setProjectedPosition(point: vec2): void {
        this.projectedPosition = point
    }
    updateProjectedPosition(leftTopWidthHeight: number[], mvpMatrix: mat4) {
        const modelPoint = this.getModelPosition()
        const clipPoint = vec4.create()
        // Multiply the 3D point by the model-view-projection matrix
        vec4.transformMat4(clipPoint, vec4.fromValues(modelPoint[0], modelPoint[1], modelPoint[2], 1.0), mvpMatrix)

        // Convert the 4D point to 2D screen coordinates
        if (clipPoint[3] !== 0.0) {
            const screenPoint = vec4.clone(clipPoint)
            screenPoint[0] = (screenPoint[0] / screenPoint[3] + 1.0) * 0.5 * leftTopWidthHeight[2]
            screenPoint[1] = (1.0 - screenPoint[1] / screenPoint[3]) * 0.5 * leftTopWidthHeight[3]
            screenPoint[2] /= screenPoint[3]

            screenPoint[0] += leftTopWidthHeight[0]
            screenPoint[1] += leftTopWidthHeight[1]
            this.projectedPosition = vec2.fromValues(screenPoint[0], screenPoint[1])
        }
        else {
            this.isVisible = false
        }
    }
    getProjectedPosition(): vec2 {
        return this.projectedPosition
    }

}