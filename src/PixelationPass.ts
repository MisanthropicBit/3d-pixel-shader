import { DepthTexture, NearestFilter, ShaderMaterial, RGBAFormat, Vector2, WebGLRenderTarget, WebGLRenderTargetOptions, Scene, Camera, WebGL2PixelFormat, WebGLRenderer } from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass'

import { createRenderTarget } from './RenderTarget'

export class PixelationPass extends Pass {
  private fsQuad: FullScreenQuad
  private pixelSize: number
  private resolution: Vector2
  private renderResolution: Vector2
  private scene: Scene
  private camera: Camera
  private rgbaRenderTarget: WebGLRenderTarget

  constructor(
    width: number,
    height: number,
    pixelSize: number,
    scene: Scene,
    camera: Camera
  ) {
    super()

    const shaderMaterial = new ShaderMaterial({
      uniforms: {
        texDiffuse: { value: null },
        texDepth: { value: null },
      },
      vertexShader: `
        varying vec2 _uv;

        void main() {
          _uv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec2 _uv;
        uniform sampler2D texDiffuse;
        uniform sampler2D texDepth;

        void main() {
          gl_FragColor.rgb = texture2D(texDiffuse, _uv);
          // gl_FragColor.rgb = 1.0 - vec3(texture2D(texDepth, _uv).r);
          gl_FragColor.a = 1.0;
        }
      `
    })

    this.fsQuad = new FullScreenQuad(shaderMaterial)
    this.pixelSize = pixelSize
    this.resolution = new Vector2()
    this.renderResolution = new Vector2()
    this.setSize(width, height)
    this.scene = scene
    this.camera = camera

    // RGBA render target with depth buffer
    this.rgbaRenderTarget = createRenderTarget(
      this.renderResolution.x,
      this.renderResolution.y,
      RGBAFormat,
      true
    )

    this.rgbaRenderTarget?.setSize(this.renderResolution.x, this.renderResolution.y)
  }

  public dispose(): void {
    this.rgbaRenderTarget.dispose()
    this.fsQuad.dispose()
  }

  public setSize(width: number, height: number) {
    this.resolution.set(width, height)
    this.renderResolution.set((width / this.pixelSize) | 0, (height / this.pixelSize) | 0)

    const { x, y } = this.renderResolution

    this.rgbaRenderTarget?.setSize(x, y)
    // this.normalRenderTarget?.setSize(x, y)
    // this.fsQuad?.material.uniforms.resolution.value.set(x, y, 1 / x, 1 / y)
  }

  setPixelSize() {
  }

  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget): void {
    // Set the render target to the rgba render target and render the scene
    // in color
    renderer.setRenderTarget(this.rgbaRenderTarget)
    renderer.render(this.scene, this.camera)

    // @ts-ignore (uniforms isn't present in the Material type)
    const uniforms = this.fsQuad.material.uniforms
    uniforms.texDiffuse.value = this.rgbaRenderTarget.texture
    uniforms.texDepth.value = this.rgbaRenderTarget.depthTexture

    if (this.renderToScreen) {
      // Reset render target and draw to screen
      renderer.setRenderTarget(null)
    } else {
      renderer.setRenderTarget(writeBuffer)

      if (this.clear) {
        renderer.clear()
      }
    }

    this.fsQuad.render(renderer)
  }
}
