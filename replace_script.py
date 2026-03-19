import sys

filepath = '/Users/adityagupta/Desktop/ROOMS/modern-auth-ui/index.html'

with open(filepath, 'r') as f:
    content = f.read()

start_str = '// --- Canvas Premium "Nothing OS Glitch Snake" Animation ---'
start_idx = content.find(start_str)

if start_idx == -1:
    print("Could not find start_str")
    sys.exit(1)

end_idx = content.find('</script>', start_idx)

new_script = """// --- Canvas Premium "Sleek Digital Grid Beams" Animation ---
// Inspired by official Vercel/Stripe/Linear landing pages
const canvas = document.getElementById('neuralCanvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Grid settings
const cellSize = 60; // Sleek, spacious grid
const speed = 2; // Smooth, continuous pixel movement

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// Premium brand colors
const colors = [
    '#ffffff', // Clean white
    '#ffffff', 
    '#ffffff', 
    '#00f0ff', // Cyber cyan
    '#7000ff', // Deep violet
    '#ff0055'  // Neon pink/red
];

class LightBeam {
    constructor() {
        this.reset(true);
    }

    reset(randomizeStart = false) {
        // Snap to grid
        this.x = Math.floor(Math.random() * ((width / cellSize) + 2)) * cellSize - cellSize;
        this.y = Math.floor(Math.random() * ((height / cellSize) + 2)) * cellSize - cellSize;
        
        this.dir = Math.floor(Math.random() * 4); // 0:R, 1:D, 2:L, 3:U
        this.vx = 0;
        this.vy = 0;
        this.updateVelocity();
        
        this.history = [];
        // Long, elegant fading trails
        this.targetLength = Math.floor(Math.random() * 150) + 100;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.isDead = false;

        if (randomizeStart) {
            // Simulate having already moved so they don't all spawn as dots
            const advance = Math.floor(Math.random() * this.targetLength);
            for(let i=0; i<advance; i++) this.updatePosition();
        }
    }

    updateVelocity() {
        if (this.dir === 0) { this.vx = speed; this.vy = 0; }
        else if (this.dir === 1) { this.vx = 0; this.vy = speed; }
        else if (this.dir === 2) { this.vx = -speed; this.vy = 0; }
        else if (this.dir === 3) { this.vx = 0; this.vy = -speed; }
    }

    updatePosition() {
        this.x += this.vx;
        this.y += this.vy;

        this.history.unshift({x: this.x, y: this.y});
        if (this.history.length > this.targetLength) {
            this.history.pop();
        }

        // Check if exactly at a grid intersection
        if (this.x % cellSize === 0 && this.y % cellSize === 0) {
            // Prevent going out of bounds by dying and respawning if entirely off-screen
            // This prevents the visual "wrap around" jump which looks unpolished
            if (this.x < -cellSize * 2 || this.x > width + cellSize * 2 || 
                this.y < -cellSize * 2 || this.y > height + cellSize * 2) {
                this.isDead = true;
                return;
            }

            // Smooth randomized turns at intersections (30% chance)
            if (Math.random() < 0.3) {
                // Determine left or right turn
                const turnDir = Math.random() < 0.5 ? 1 : 3;
                this.dir = (this.dir + turnDir) % 4;
                this.updateVelocity();
            }
        }
    }

    update() {
        if (this.isDead) {
            // Shrink tail
            this.history.pop();
            this.history.pop(); // shrink twice as fast
            if (this.history.length <= 0) {
                this.reset();
            }
        } else {
            this.updatePosition();
        }
    }

    draw() {
        if (this.history.length < 2) return;

        // Draw the sleek fading tail
        // To make it incredibly smooth, we draw small line segments connecting history points
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Performance optimization: we don't need to draw every single 2px segment individually.
        // But for a perfect alpha fade, segmenting is easiest.
        // Let's use step=4 to reduce paths by 4x, maintaining visual perfection
        const step = 4;
        for (let i = 0; i < this.history.length - step; i += step) {
            const p1 = this.history[i];
            const p2 = this.history[i + step];
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            // Fade alpha based on position in trail
            ctx.globalAlpha = Math.max(0, 1 - (i / this.history.length));
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.8; // Sleek thin line
            
            // Add slight glow close to the head
            if (i < 20) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
            } else {
                ctx.shadowBlur = 0;
            }
            
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        
        // Draw the glowing head
        const head = this.history[0];
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; // Intensely bright white core for head
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

const beams = [];
// More beams for a denser, more active premium background (like Stripe)
for (let i = 0; i < 40; i++) {
    beams.push(new LightBeam());
}

function drawGridLayer() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; // Extremely subtle, premium grid
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let x = 0; x <= width + cellSize; x += cellSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height + cellSize; y += cellSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Premium detail: Little plus signs or brighter dots at intersections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let x = 0; x <= width + cellSize; x += cellSize) {
        for (let y = 0; y <= height + cellSize; y += cellSize) {
            ctx.fillRect(x - 1, y - 1, 2, 2);
        }
    }
}

function animate() {
    // Sleek, deep dark premium gradient background
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height) * 0.8);
    gradient.addColorStop(0, '#0f1015'); // Slightly lighter, cool bluish-grey dark center
    gradient.addColorStop(1, '#020205'); // Deep abyss edge
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawGridLayer();

    ctx.globalCompositeOperation = 'screen'; // Makes beams glow nicely when overlapping
    for (let b of beams) {
        b.update();
        b.draw();
    }
    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(animate);
}

animate();
"""

new_content = content[:start_idx] + new_script + content[end_idx:]

with open(filepath, 'w') as f:
    f.write(new_content)

print("Successfully replaced canvas script with Sleek Digital Grid Beams")
