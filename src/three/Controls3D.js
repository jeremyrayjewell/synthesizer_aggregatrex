// Controls3D.js
// Handles 3D interaction logic
class Controls3D {
  constructor(camera, rendererDomElement) {
    this.camera = camera;
    this.domElement = rendererDomElement;
    
    // We're not using OrbitControls anymore since we have ZoomControls
    this.enabled = false;
  }

  // Method to allow for API compatibility
  update() {
    // No update needed as we use ZoomControls component
    return;
  }
  
  // Disable any controls
  dispose() {
    this.enabled = false;
  }
}

export default Controls3D;
