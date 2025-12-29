export const $ = {
    // Mode views
    editMode: document.getElementById('editMode'),
    previewMode: document.getElementById('previewMode'),
    
    // Frames
    framePreview: document.getElementById('framePreview'),
    
    // Editor elements
    html: document.getElementById('htmlCode'),
    css: document.getElementById('cssCode'),
    js: document.getElementById('jsCode'),
    htmlHighlight: document.getElementById('htmlHighlight'),
    cssHighlight: document.getElementById('cssHighlight'),
    jsHighlight: document.getElementById('jsHighlight'),
    
    // UI elements
    status: document.getElementById('status'),
    loading: document.getElementById('loading'),
    fontListContainer: document.getElementById('fontListContainer'),
    imageInput: document.getElementById('imageInput'),
    imageListContainer: document.getElementById('imageListContainer')
};

export const Utils = {
    showLoading(show = true) {
        $.loading.classList.toggle('show', show);
    },
    showStatus(msg, duration = 2000) {
        $.status.textContent = msg;
        if (duration > 0) setTimeout(() => $.status.textContent = '', duration);
    },
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    async waitForCondition(checkFn, timeout = 10000, interval = 100) {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (checkFn()) { clearInterval(check); resolve(true); }
            }, interval);
            setTimeout(() => { clearInterval(check); resolve(false); }, timeout);
        });
    }
};