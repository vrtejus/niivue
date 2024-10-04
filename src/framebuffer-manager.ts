export class FramebufferManager {
  private gl: WebGL2RenderingContext
  private framebuffer: WebGLFramebuffer | null = null
  private texture: WebGLTexture | null = null
  private renderbuffer: WebGLRenderbuffer | null = null
  private width: number
  private height: number

  constructor(gl: WebGL2RenderingContext, width: number, height: number) {
    this.gl = gl
    this.width = width
    this.height = height
    this.initFramebuffer()
  }

  // Initialize the framebuffer, texture, and renderbuffer (only done once)
  private initFramebuffer(): void {
    const gl = this.gl

    // Create and bind the framebuffer
    this.framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)

    // Create and configure the texture for color attachment
    this.texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // Attach the texture to the framebuffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0)

    // Create and configure the renderbuffer for depth and stencil
    this.renderbuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, this.width, this.height)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer)

    // Unbind the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  // Bind the framebuffer before rendering
  public bindFramebuffer(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer)
    this.gl.viewport(0, 0, this.width, this.height) // Adjust the viewport
  }

  // Unbind the framebuffer when done
  public unbindFramebuffer(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
  }

  // Cleanup resources when no longer needed
  public cleanup(): void {
    if (this.framebuffer) {
      this.gl.deleteFramebuffer(this.framebuffer)
    }
    if (this.texture) {
      this.gl.deleteTexture(this.texture)
    }
    if (this.renderbuffer) {
      this.gl.deleteRenderbuffer(this.renderbuffer)
    }
  }
}
