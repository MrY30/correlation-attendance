import { saveSignature } from '../api.js';

// Signature functionality
class SignatureHandler {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.hasSignature = false;
        this.placeholder = document.getElementById('canvas-placeholder');
        
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        // Set actual canvas size to match display size
        const rect = this.canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        
        this.canvas.width = 500 * scale;
        this.canvas.height = 200 * scale;
        
        this.ctx.scale(scale, scale);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        
        // Fill with white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile devices
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX / (window.devicePixelRatio || 1),
            y: (e.clientY - rect.top) * scaleY / (window.devicePixelRatio || 1)
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        
        // Hide placeholder on first draw
        if (!this.hasSignature) {
            this.placeholder.classList.add('hidden');
            this.hasSignature = true;
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }
    
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ctx.beginPath();
        }
    }
    
    reset() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasSignature = false;
        this.placeholder.classList.remove('hidden');
    }
    
    getSignatureData() {
        return this.canvas.toDataURL('image/png');
    }
    
    isEmpty() {
        return !this.hasSignature;
    }
}

// Global signature handler instance
let signatureHandler;

let currentStudent = null;
let currentSessionId = null;
let currentStatusColumn = null;

// Modal functions
export function openSignatureModal(student, sessionId, statusColumn) {
  currentStudent = student;
  currentSessionId = sessionId;
  currentStatusColumn = statusColumn;

  const overlay = document.getElementById('signature-overlay');
  overlay.classList.remove('hidden');

  if (!signatureHandler) {
    signatureHandler = new SignatureHandler('signature-canvas');
  } else {
    signatureHandler.reset();
  }

  document.getElementById('signature-success').classList.remove('show');
}

function closeSignatureModal() {
    const overlay = document.getElementById('signature-overlay');
    overlay.classList.add('hidden');
}

function resetSignature() {
    if (signatureHandler) {
        signatureHandler.reset();
    }
}

async function submitSignature() {
  if (!signatureHandler || signatureHandler.isEmpty()) {
    alert('Please provide a signature before submitting.');
    return;
  }

  if (!currentStudent || !currentSessionId || !currentStatusColumn) {
    alert('Missing context for signature save');
    return;
  }

  const signatureData = signatureHandler.getSignatureData();

  try {
    const res = await saveSignature(
      currentStudent.school_id,
      currentSessionId,
      currentStatusColumn,
      signatureData
    );

    if (res.success && res.status === 'present') {
      // ✅ Attendance automatically marked
      document.getElementById('attendance-message').className =
        'attendance-status status-present';
      document.getElementById('attendance-message').innerHTML =
        '<i class="bx bx-check-circle"></i> Attendance Recorded Successfully!';

      const successMsg = document.getElementById('signature-success');
      successMsg.classList.add('show');

      setTimeout(() => {
        closeSignatureModal();
      }, 1500);
    }
  } catch (err) {
    console.error('Error saving signature:', err);
    alert('Error saving signature. Please try again.');
  }
}

// Close modal when clicking outside
document.getElementById('signature-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSignatureModal();
    }
});

// Keyboard support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSignatureModal();
    }
});

// document.getElementById('click-this').addEventListener('click', openSignatureModal);
document.getElementById('btn-reset').addEventListener('click', resetSignature);
document.getElementById('btn-submit').addEventListener('click', submitSignature);
document.getElementById('btn-cancel').addEventListener('click', closeSignatureModal);
