import WebGL from 'three/examples/jsm/capabilities/WebGL'

import { SceneController } from './SceneController'

function main() {
  if (WebGL.isWebGLAvailable()) {
    const sceneController = new SceneController(window.innerWidth, window.innerHeight)

    sceneController.animate()
  } else {
    const warning = WebGL.getWebGLErrorMessage()
    document.getElementById('container')?.appendChild(warning)
  }
}

main()
