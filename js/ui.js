import { Utils } from './dom.js';
import { Renderer, Exporter, Importer } from './document.js';
import { FontManager } from './fonts.js';
import { ImageManager } from './images.js';

const ModeManager = {
    currentMode: 'edit',
    
    async switch(mode) {
        console.log('Switching to mode:', mode);
        
        const editMode = document.getElementById('editMode');
        const previewMode = document.getElementById('previewMode');
        
        // Update buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Switch views
        if (mode === 'edit') {
            editMode.classList.add('active');
            previewMode.classList.remove('active');
        } else if (mode === 'preview') {
            editMode.classList.remove('active');
            previewMode.classList.add('active');
            
            // Wait a bit for the view to render
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Render preview
            const framePreview = document.getElementById('framePreview');
            if (framePreview) {
                console.log('Rendering preview...');
                await Renderer.render(framePreview);
            } else {
                console.error('framePreview not found');
            }
        }
        
        this.currentMode = mode;
        console.log('Mode switched to:', mode);
    },
    
    init() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switch(btn.dataset.mode);
            });
        });
        
        // Set initial mode
        this.switch('edit');
    }
};

const Zoom = {
    level: 1.0,
    min: 0.25,
    max: 3.0,
    step: 0.1,
    
    init() {
        const previewContainer = document.querySelector('.preview-container');
        
        if (!previewContainer) return;
        
        // Zoom with Ctrl + Scroll in preview container
        previewContainer.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                
                const delta = e.deltaY > 0 ? -this.step : this.step;
                this.setLevel(this.level + delta);
            }
        }, { passive: false });
        
        // Prevent default browser zoom in preview
        previewContainer.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
                e.preventDefault();
                e.stopPropagation();
                
                if (e.key === '0') {
                    this.reset();
                } else if (e.key === '+' || e.key === '=') {
                    this.zoomIn();
                } else if (e.key === '-') {
                    this.zoomOut();
                }
            }
        }, { capture: true });
    },
    
    setLevel(level) {
        this.level = Math.max(this.min, Math.min(this.max, level));
        const framePreview = document.getElementById('framePreview');
        if (framePreview) {
            framePreview.style.transform = `scale(${this.level})`;
            framePreview.style.width = `${100 / this.level}%`;
            framePreview.style.height = `${100 / this.level}%`;
        }
        this.updateDisplay();
    },
    
    updateDisplay() {
        const display = document.getElementById('zoomLevel');
        if (display) {
            display.textContent = `${Math.round(this.level * 100)}%`;
        }
    },
    
    zoomIn() {
        this.setLevel(this.level + this.step);
    },
    
    zoomOut() {
        this.setLevel(this.level - this.step);
    },
    
    reset() {
        this.setLevel(1.0);
    }
};

export function initEvents() {
    // Initialize mode manager
    ModeManager.init();
    
    // Initialize zoom
    Zoom.init();
    
    // Zoom buttons
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomResetBtn = document.getElementById('zoomReset');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => Zoom.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => Zoom.zoomOut());
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => Zoom.reset());
    
    // Print button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            Renderer.openPrintPreview();
        });
    }
    
    // Export/Import
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (exportBtn) exportBtn.onclick = () => Exporter.export();
    if (importBtn) importBtn.onclick = () => fileInput.click();
    
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                await Importer.import(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
    
    const fontInput = document.getElementById('fontInput');
    if (fontInput) {
        fontInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) await FontManager.upload(files);
            e.target.value = '';
        });
    }
    
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) await ImageManager.upload(files);
            e.target.value = '';
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', async (e) => {
        // Skip if in preview container
        const previewContainer = document.querySelector('.preview-container');
        if (previewContainer && previewContainer.contains(e.target)) {
            return;
        }
        
        // Ctrl+P: Print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            Renderer.openPrintPreview();
        }
        
        // Ctrl+1: Edit mode
        if ((e.ctrlKey || e.metaKey) && e.key === '1') {
            e.preventDefault();
            ModeManager.switch('edit');
        }
        
        // Ctrl+2 or Ctrl+Enter: Preview mode
        if ((e.ctrlKey || e.metaKey) && (e.key === '2' || e.key === 'Enter')) {
            e.preventDefault();
            ModeManager.switch('preview');
        }
    });
}

window.Zoom = Zoom;
window.ModeManager = ModeManager;