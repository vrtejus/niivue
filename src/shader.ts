import { log } from './logger.js'
// shader.js is taken from github user Twinklebear: https://github.com/Twinklebear/webgl-util

// Compile and link the shaders vert and frag. vert and frag should contain
// the shader source code for the vertex and fragment shaders respectively
// Returns the compiled and linked program, or null if compilation or linking failed
export const compileShader = function (gl: WebGL2RenderingContext, vert: string, frag: string): WebGLProgram {
  const vs = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vs, vert)
  gl.compileShader(vs)

  // Check for vertex shader compilation errors
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    log.error('Vertex shader compilation error: ', gl.getShaderInfoLog(vs))
    gl.deleteShader(vs) // Delete the shader if compilation fails
    throw new Error('Vertex shader failed to compile')
  }

  const fs = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fs, frag)
  gl.compileShader(fs)

  // Check for fragment shader compilation errors
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    log.error('Fragment shader compilation error: ', gl.getShaderInfoLog(fs))
    gl.deleteShader(fs) // Delete the shader if compilation fails
    throw new Error('Fragment shader failed to compile')
  }

  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    log.error(gl.getProgramInfoLog(program))
    throw new Error('Shader failed to link, see console for log')
  }
  return program
}

export const getGLExtension = function (gl: WebGL2RenderingContext, ext: string): boolean {
  if (!gl.getExtension(ext)) {
    log.error('Missing ' + ext + ' WebGL extension')
    return false
  }
  return true
}

export class Shader {
  program: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation | null> = {}
  isMatcap?: boolean

  constructor(gl: WebGL2RenderingContext, vertexSrc: string, fragmentSrc: string) {
    this.program = compileShader(gl, vertexSrc, fragmentSrc)

    const regexUniform = /uniform[^;]+[ ](\w+);/g
    const matchUniformName = /uniform[^;]+[ ](\w+);/

    const vertexUnifs = vertexSrc.match(regexUniform)
    const fragUnifs = fragmentSrc.match(regexUniform)

    if (vertexUnifs) {
      vertexUnifs.forEach((unif) => {
        const m = unif.match(matchUniformName)
        this.uniforms[m![1]] = -1 // TODO can we guarantee this?
      })
    }
    if (fragUnifs) {
      fragUnifs.forEach((unif) => {
        const m = unif.match(matchUniformName)
        this.uniforms[m![1]] = -1 // TODO can we guarantee this?
      })
    }

    for (const unif in this.uniforms) {
      this.uniforms[unif] = gl.getUniformLocation(this.program, unif)!
    }
  }

  use(gl: WebGL2RenderingContext): void {
    gl.useProgram(this.program)
  }
}
