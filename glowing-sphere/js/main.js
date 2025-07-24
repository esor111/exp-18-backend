// Wait for all resources to load
window.addEventListener('load', () => {
    // Mark the body as loaded to trigger CSS transitions
    document.body.classList.add('loaded');
    
    // Initialize the application
    init();
});

// Global variables
let scene, camera, renderer, composer;
let sphere;
let controls;
let container;
let isHovering = false;
let autoRotate = true;
let clock = new THREE.Clock();

// Initialize the application
function init() {
    // Get the container element
    container = document.getElementById('container');
    
    // Create the scene
    scene = new THREE.Scene();
    
    // Create the camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 5;
    
    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create the sphere
    sphere = createSphere();
    scene.add(sphere);
    
    // Set up post-processing for glow effect
    setupPostProcessing();
    
    // Set up controls
    setupControls();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    
    // Start the animation loop
    animate();
}

// Handle window resize
function onWindowResize() {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Auto-rotate when not being dragged
    if (autoRotate && !controls.isDragging) {
        sphere.rotation.y += 0.005;
    }
    
    // Update color pulsing effect
    if (typeof updateAnimation === 'function') {
        updateAnimation();
    }
    
    // Render the scene
    composer.render();
}

// Set up post-processing for glow effect
function setupPostProcessing() {
    // Create a render pass
    const renderPass = new THREE.RenderPass(scene, camera);
    
    // Create an unreal bloom pass
    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,  // strength
        0.4,  // radius
        0.85  // threshold
    );
    
    // Create the effect composer
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    
    // Store the bloom pass for later adjustment
    window.bloomPass = bloomPass;
}