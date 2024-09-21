export interface GlyphMetrics {
    xadv: number
    uv_lbwh: [number, number, number, number] // UV coordinates (left, bottom, width, height)
    lbwh: [number, number, number, number] // Plane coordinates (left, bottom, width, height)
}
