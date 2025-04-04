// Simple test script
window.onload = function() {
    console.log("Render test starting...");
    
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Could not get canvas context!");
        return;
    }
    
    // Simple draw test
    console.log("Drawing blue rectangle");
    ctx.fillStyle = 'blue';
    ctx.fillRect(100, 100, 200, 100);
    
    console.log("Drawing red circle");
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(400, 200, 50, 0, Math.PI * 2);
    ctx.fill();
    
    console.log("Drawing green text");
    ctx.fillStyle = 'green';
    ctx.font = '30px Arial';
    ctx.fillText('Canvas Working!', 250, 300);
    
    console.log("Basic rendering test complete");
};