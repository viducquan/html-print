import { Editor } from './editor.js';
import { FontManager } from './fonts.js';
import { initEvents } from './ui.js';
import { ImageManager } from './images.js';

const App = {
    async init() {
        console.log('App initializing...');
        
        await Editor.init();
        console.log('Editor ready');
        
        FontManager.renderList();
        ImageManager.renderList();
        initEvents();
        
        console.log('✅ Ready with Ace Editor!');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}