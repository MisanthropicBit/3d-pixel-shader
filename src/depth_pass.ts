import * as three from 'three'
import { ShaderMaterial, RGBAFormat, Vector2, WebGLRenderTarget, Scene, Camera, WebGLRenderer } from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass'

import { createRenderTarget } from './render_target'

/**
 * A simple depth pass
 */
export class DepthPass extends Pass {
  private fsQuad: FullScreenQuad
  private pixelSize: number
  private resolution: Vector2
  private renderResolution: Vector2
  private scene: Scene
  private camera: three.PerspectiveCamera
  private rgbaRenderTarget: WebGLRenderTarget

  constructor(
    width: number,
    height: number,
    pixelSize: number,
    scene: Scene,
    camera: three.PerspectiveCamera
  ) {
    super()

    console.log(camera.near, camera.far)

    const shaderMaterial = new ShaderMaterial({
      uniforms: {
        texDepth: { value: null },
        near: { value: camera.near },
        far: { value: camera.far },
      },
      vertexShader: `
        varying vec2 _uv;

        void main() {
          _uv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        #include <packing>

        varying vec2 _uv;
        uniform float near;
        uniform float far;
        uniform sampler2D texDepth;

        void main() {
          float depth = texture2D(texDepth, _uv).x;

          // We need to transfer the implementation-dependent packed depth
          // buffer value into a linear value
          float viewZ = perspectiveDepthToViewZ(depth, near, far);
          float linearDepth = viewZToOrthographicDepth(viewZ, near, far);

          gl_FragColor = vec4(linearDepth, linearDepth, linearDepth, 1.0);
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
