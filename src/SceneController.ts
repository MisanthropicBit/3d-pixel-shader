import * as three from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Pass } from 'three/examples/jsm/postprocessing/Pass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'

import { PixelationPass } from './pixelation_pass'
import { DepthPass } from './depth_pass'

enum ControlKey {
  COLOR = 'color',
  DEPTH = 'depth',
  PIXELATE = 'pixelate',
  NORMAL = 'normal',
}

export class SceneController {
  private pixelSize: number = 1.0
  private resolution: three.Vector2
  private renderResolution: three.Vector2
  private scene: three.Scene
  private camera: three.PerspectiveCamera
  private renderer: three.WebGLRenderer
  private effectComposer: EffectComposer
  private passMapping: Record<string, Pass> = {}

  constructor(width: number, height: number) {
    this.resolution = new three.Vector2(width, height)

    // TODO: Change to orthographic camera
    this.camera = new three.PerspectiveCamera(75, this.resolution.x / this.resolution.y, 0.1, 8)

    // Move the camera a bit away from the center of the scene so we can see it
    this.camera.position.z = 5

    this.renderer = new three.WebGLRenderer()
    this.renderer.setSize(this.resolution.x, this.resolution.y)

    this.effectComposer = new EffectComposer(this.renderer)

    this.setupScene()
    this.setupPasses()
    this.setupControls()
    this.updateActivePass(this.passMapping[ControlKey.COLOR])

    document.body.appendChild(this.renderer.domElement)
  }

  private setupScene(): void {
    const geometry = new three.BoxGeometry(1, 1, 1)
    const material = new three.MeshBasicMaterial({ color: 0xa5548a })

    this.scene = new three.Scene()
    this.scene.background = new three.Color(0x43476c)
    this.scene.add(new three.Mesh(geometry, material))
  }

  private setupPasses(): void {
    this.passMapping[ControlKey.COLOR] = new RenderPass(this.scene, this.camera)
    this.passMapping[ControlKey.DEPTH] = new DepthPass(this.resolution.x, this.resolution.y, 1.0, this.scene, this.camera)
    // const pixelationPass = new PixelationPass(width, height, 1.0, scene, camera)
  }

  private setupControls(): void {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.update()

    document.onkeydown = event => {
      const pass = this.passMapping[event.key]

      if (pass != null) {
        this.updateActivePass(pass)
      }
    }

    const dropdown = document.getElementById('dropdown')

    dropdown.addEventListener('change', event => {
      // @ts-ignore
      const value = event.target.value

      this.updateActivePass(this.passMapping[value])
    })
  }

  private onWindowResize(): void {
    // TODO: window.addEventListener('resize', onWindowResize)
  }

  private updateActivePass(pass: Pass): void {
    const passes = this.effectComposer.passes

    if (passes.length > 0) {
      this.effectComposer.removePass(this.effectComposer.passes[0])
    }

    this.effectComposer.addPass(pass)
  }

  public animate(): void {
    requestAnimationFrame(this.animate.bind(this))

    this.effectComposer.render()
  }
}
