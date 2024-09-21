import { vec2 } from 'gl-matrix'

export interface NVUiComponent {
    getScreenPoint(): vec2
    setScreenPoint(point: vec2): void
    getScreenWidth(): number
    getScreenHeight(): number
    render(): void
}