# Interactive Glowing 3D Sphere

A web-based 3D sphere that spins, glows, and responds to mouse movements. Built with Three.js.

## Features

- **Spinning 3D Sphere**: The sphere rotates automatically when not being interacted with.
- **Interactive Rotation**: Click and drag to rotate the sphere in any direction.
- **Dynamic Glow Effect**: The sphere's glow intensity increases when you hover over it.
- **Color Pulsing**: The sphere smoothly transitions between different colors.
- **Responsive Design**: Works on different screen sizes.

## How to Use

1. Open `index.html` in a modern web browser.
2. Hover over the sphere to increase its glow intensity.
3. Click and drag to rotate the sphere manually.
4. When you release the mouse button, the sphere will resume its automatic rotation.

## Technical Details

This project uses:

- **Three.js**: A JavaScript 3D library that makes WebGL simpler.
- **HTML5 Canvas**: For rendering the 3D graphics.
- **CSS3**: For styling and responsive design.
- **JavaScript ES6+**: For interactivity and animation.

### Implementation Highlights

- **Post-processing Effects**: Uses Three.js EffectComposer and UnrealBloomPass for the glow effect.
- **OrbitControls**: Implements Three.js OrbitControls for smooth rotation.
- **Custom Lighting**: Combines ambient, directional, and point lights for realistic illumination.
- **Color Animation**: Uses sine waves with different frequencies to create smooth color transitions.

## Browser Compatibility

Tested and working in:
- Chrome
- Firefox
- Edge
- Safari

## Project Structure

```
glowing-sphere/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styling for the application
├── js/
│   ├── main.js         # Main application logic
│   ├── sphere.js       # Sphere creation and effects
│   └── controls.js     # Mouse interaction handling
└── README.md           # This documentation file
```

## Future Improvements

Potential enhancements for the future:
- Add touch support for mobile devices
- Implement additional visual effects
- Add sound effects that respond to interactions
- Create multiple spheres that interact with each other