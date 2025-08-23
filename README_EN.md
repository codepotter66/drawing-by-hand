# Hand Tracking Drawing Application

A MediaPipe-based hand tracking drawing application that uses camera to track hand movements in real-time for drawing.

[English](README_EN.md) | [中文](README.md)

## 🌐 Try Online

**Live Demo**: [https://drawing-by-hand.vercel.app/](https://drawing-by-hand.vercel.app/)

No installation required! Experience hand tracking drawing directly in your browser!

## Features

- 🎨 Real-time hand tracking drawing
- 🎯 Thumb and index finger pinch detection
- 🖌️ Brush and eraser tools
- 🎨 10 basic colors + custom color picker
- 📏 Three brush sizes (small, medium, large)
- 💾 One-click save canvas as PNG image
- 🧹 One-click clear canvas
- 🎨 8 coloring templates (cat, dog, bird, etc.)

## Installation and Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open browser and visit: `http://localhost:3000`

## Usage Instructions

1. Click "Camera" button to start camera
2. Pinch thumb and index finger to draw
3. Select brush/eraser tool
4. Choose color and brush size
5. Select coloring template for filling
6. Click "Save" to download artwork
7. Click "Clear" to start over

## Project Structure

```
drawing-by-hand/
├── public/
│   ├── index.html      # Main page
│   ├── style.css       # Stylesheet
│   └── script.js       # Main logic
├── server.js           # Express server
├── package.json        # Project configuration
└── README.md          # Project documentation
```

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express
- **Hand Tracking**: MediaPipe Hands
- **Camera**: WebRTC getUserMedia API
- **Responsive Design**: CSS Flexbox, Dynamic Canvas sizing

## Browser Compatibility

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Requirements

- Camera permission required
- Recommended to use in well-lit environment
- Hand should be clearly visible for optimal tracking

## Features in Detail

### Hand Tracking
- Real-time hand landmark detection using MediaPipe
- Precise index finger tip tracking for brush position
- Thumb-index pinch gesture recognition for drawing control

### Drawing Tools
- **Brush Tool**: Free-hand drawing with customizable colors and sizes
- **Eraser Tool**: Remove drawn content with same size options
- **Color Selection**: 10 preset colors plus custom color picker
- **Size Options**: Small (3px), Medium (8px), Large (15px)

### Coloring Templates
- 8 pre-drawn templates: Cat, Dog, Bird, Fish, Flower, Tree, Butterfly, House
- Templates are displayed on separate canvas layer
- Optional template outline inclusion in saved images
- Perfect for children's creative coloring activities

### User Interface
- Modern glassmorphism design
- Responsive layout for all screen sizes
- Intuitive toolbar with organized sections
- Real-time finger position indicator
- Camera placeholder with helpful instructions

### Save & Export
- Automatic canvas flipping for natural orientation
- White background for clean saved images
- PNG format with high quality
- Optional template outline inclusion

## Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### File Structure Details
- `public/index.html`: Main HTML structure with canvas elements and UI
- `public/style.css`: Responsive styling with modern design
- `public/script.js`: Core application logic and MediaPipe integration
- `server.js`: Simple Express server for static file serving

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for educational or commercial purposes.

---

**Perfect for**: Children's art education, interactive drawing applications, gesture-based interfaces, creative learning tools.
