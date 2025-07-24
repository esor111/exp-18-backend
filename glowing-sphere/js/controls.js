// Set up controls for mouse interaction
function setupControls() {
    // Create OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // Configure controls
    controls.enableDamping = true;       // Add smooth damping
    controls.dampingFactor = 0.05;       // Damping factor
    controls.rotateSpeed = 0.5;          // Rotation speed
    controls.enableZoom = false;         // Disable zooming
    controls.enablePan = false;          // Disable panning
    controls.autoRotate = false;         // We'll handle rotation manually
    
    // Add custom property to track dragging state
    controls.isDragging = false;
    
    // Add event listeners for mouse interaction
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    
    // Add touch support for mobile devices
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchmove', onTouchMove);
}

// Handle mouse down event
function onMouseDown() {
    // Update dragging state
    controls.isDragging = true;
    autoRotate = false;
    
    // Update cursor style
    container.classList.add('dragging');
}

// Handle mouse up event
function onMouseUp() {
    // Update dragging state
    controls.isDragging = false;
    autoRotate = true;
    
    // Update cursor style
    container.classList.remove('dragging');
}

// Handle touch start event
function onTouchStart(event) {
    // Prevent default behavior
    event.preventDefault();
    
    // Update dragging state
    controls.isDragging = true;
    autoRotate = false;
    
    // Handle touch move for glow effect
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        handleTouchMove(touch);
    }
}

// Handle touch end event
function onTouchEnd() {
    // Update dragging state
    controls.isDragging = false;
    autoRotate = true;
}

// Handle touch move event
function onTouchMove(event) {
    // Prevent default behavior
    event.preventDefault();
    
    // Handle touch move for glow effect
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        handleTouchMove(touch);
    }
}

// Handle touch move for glow effect
function handleTouchMove(touch) {
    // Get touch position
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    
    // Check if touch is over the sphere
    const hovering = calculateMouseSphereDistance(touchX, touchY);
    
    // Update hover state
    if (hovering !== isHovering) {
        isHovering = hovering;
        
        // Update glow intensity
        if (isHovering) {
            // Increase glow when hovering
            updateSphereGlow(1.0);
        } else {
            // Reset glow when not hovering
            updateSphereGlow(0.5);
        }
    }
}

// Add color pulsing to animation loop
function updateAnimation() {
    // Pulse color for additional visual effect
    pulseColor();
}