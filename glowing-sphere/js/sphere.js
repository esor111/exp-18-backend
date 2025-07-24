// Create the sphere
function createSphere() {
    // Create geometry
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    
    // Create material with custom shader for better glow effect
    const material = new THREE.MeshStandardMaterial({
        color: 0x0088ff,        // Base color (blue)
        emissive: 0x0044aa,     // Emissive color (darker blue)
        emissiveIntensity: 0.5, // Initial emissive intensity
        metalness: 0.3,         // Slight metalness for reflections
        roughness: 0.4,         // Medium roughness
        flatShading: false      // Smooth shading
    });
    
    // Create the mesh
    const sphere = new THREE.Mesh(geometry, material);
    
    // Add a point light inside the sphere for extra glow
    const innerLight = new THREE.PointLight(0x0088ff, 1, 10);
    innerLight.position.set(0, 0, 0);
    sphere.add(innerLight);
    
    // Store the inner light for later adjustment
    sphere.userData.innerLight = innerLight;
    
    return sphere;
}

// Update sphere glow based on hover state
function updateSphereGlow(intensity) {
    if (!sphere) return;
    
    // Get the material
    const material = sphere.material;
    
    // Update emissive intensity
    material.emissiveIntensity = intensity;
    
    // Update inner light intensity
    sphere.userData.innerLight.intensity = intensity * 2;
    
    // Update bloom strength
    if (window.bloomPass) {
        window.bloomPass.strength = 0.5 + intensity;
    }
}

// Calculate distance from mouse to sphere center
function calculateMouseSphereDistance(mouseX, mouseY) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2(
        (mouseX / window.innerWidth) * 2 - 1,
        -(mouseY / window.innerHeight) * 2 + 1
    );
    
    // Create a raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections
    const intersects = raycaster.intersectObject(sphere);
    
    // Return true if mouse is over the sphere
    return intersects.length > 0;
}

// Handle mouse movement for hover effect
function handleMouseMove(event) {
    // Get mouse position
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Check if mouse is over the sphere
    const hovering = calculateMouseSphereDistance(mouseX, mouseY);
    
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

// Add color pulsing effect
function pulseColor() {
    if (!sphere) return;
    
    // Get the material
    const material = sphere.material;
    
    // Calculate color based on time
    const time = Date.now() * 0.001; // Convert to seconds
    const r = Math.sin(time * 0.3) * 0.5 + 0.5;
    const g = Math.sin(time * 0.5) * 0.5 + 0.5;
    const b = Math.sin(time * 0.7) * 0.5 + 0.5;
    
    // Update colors
    material.color.setRGB(r * 0.5, g * 0.5, b);
    material.emissive.setRGB(r * 0.2, g * 0.2, b * 0.5);
    sphere.userData.innerLight.color.setRGB(r, g, b);
}