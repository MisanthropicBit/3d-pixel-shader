import { DepthTexture, NearestFilter, WebGLRenderTarget, WebGLRenderTargetOptions, WebGL2PixelFormat } from 'three'

export function createRenderTarget(
  width: number,
  height: number,
  pixelFormat: WebGL2PixelFormat,
  useDepthTexture: boolean
): WebGLRenderTarget {
  let depthBufferOptions: WebGLRenderTargetOptions | undefined = undefined

  if (useDepthTexture === true) {
    depthBufferOptions = {
      depthTexture: new DepthTexture(width, height),
      depthBuffer: true,
    }
  }

  const renderTarget = new WebGLRenderTarget(
    width,
    height,
    depthBufferOptions
  )

  renderTarget.texture.format = pixelFormat
  renderTarget.texture.minFilter = NearestFilter
  renderTarget.texture.magFilter = NearestFilter
  renderTarget.texture.generateMipmaps = false
  renderTarget.stencilBuffer = false

  return renderTarget
}
