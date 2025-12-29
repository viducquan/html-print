import { Utils } from './dom.js';
import { FontManager } from './fonts.js';
import { Editor, editors } from './editor.js';
import { ImageManager } from './images.js';

export const Renderer = {
    createPrintHTML() {
        let htmlContent = Editor.getValue('html');
        
        // Replace image paths with data URLs
        for (const [id, img] of Object.entries(ImageManager.images)) {
            const patterns = [
                `images/${img.name}`,
                `images/${id}.${img.name.split('.').pop()}`
            ];
            
            for (const pattern of patterns) {
                htmlContent = htmlContent.replace(
                    new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
                    img.dataUrl
                );
            }
        }
        
        return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Print Preview</title>
<style>
${FontManager.generateFontFace()}

@page { 
  size: A4; 
  margin: 2.5cm; 
}

body { 
  font-family: 'Times New Roman', serif; 
  font-size: 12pt; 
  line-height: 1.6; 
  background: #2a2a2a; 
  padding: 20px; 
  margin: 0;
}

${Editor.getValue('css')}

@media screen {
  .pagedjs_pages { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    gap: 20px; 
    margin: 0 auto;
    padding: 20px;
  }
  .pagedjs_page { 
    background: white !important; 
    box-shadow: 0 0 0 1px #666, 0 0 0 3px #999, 0 5px 15px rgba(0,0,0,0.7) !important; 
    margin: 0 auto !important;
  }
}

@media print {
  html, body { 
    background: white !important; 
    padding: 0 !important; 
    margin: 0 !important; 
  }
  .pagedjs_pages { 
    gap: 0 !important; 
  }
  .pagedjs_page { 
    box-shadow: none !important; 
    page-break-after: always !important; 
  }
}
</style>
</head>
<body>
${htmlContent}
<script>${Editor.getValue('js')}<\/script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"><\/script>
</body>
</html>`;
    },
    
    async render(targetFrame) {
        Utils.showLoading(true);
        Utils.showStatus('⏳ Render...', 0);
        
        try {
            if (Object.keys(FontManager.families).length > 0) {
                await document.fonts.ready;
            }
            
            const frame = targetFrame || document.getElementById('framePreview');
            if (!frame) {
                console.error('Frame not found');
                Utils.showLoading(false);
                Utils.showStatus('❌ Không tìm thấy frame');
                return;
            }
            
            // Force recreation of iframe
            const parent = frame.parentElement;
            const newFrame = document.createElement('iframe');
            newFrame.id = frame.id;
            newFrame.style.cssText = frame.style.cssText;
            parent.replaceChild(newFrame, frame);
            
            // Wait a bit for iframe to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const doc = newFrame.contentDocument || newFrame.contentWindow.document;
            const html = this.createPrintHTML();
            
            doc.open();
            doc.write(html);
            doc.close();
            
            // Wait for Paged.js to render
            await Utils.waitForCondition(() => {
                return doc.querySelectorAll('.pagedjs_page').length > 0;
            }, 10000);
            
            await Utils.delay(500);
            
            // Add extra styling after Paged.js renders
            const style = doc.createElement('style');
            style.textContent = `
                .pagedjs_pages {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    gap: 20px !important;
                    padding: 20px !important;
                    margin: 0 auto !important;
                }
                .pagedjs_page {
                    background: white !important;
                    box-shadow: 0 0 0 1px #666, 0 0 0 3px #999, 0 5px 15px rgba(0,0,0,0.7) !important;
                    margin: 0 auto !important;
                }
            `;
            doc.head.appendChild(style);
            
            Utils.showLoading(false);
            Utils.showStatus('✅ Xong!');
            
        } catch (error) {
            console.error('Render error:', error);
            Utils.showLoading(false);
            Utils.showStatus('❌ Lỗi render');
        }
    },
    
    openPrintPreview() {
        Utils.showLoading(true);
        Utils.showStatus('⏳ Đang chuẩn bị in...', 0);
        
        const html = this.createPrintHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '0';
        iframe.style.height = '0';
        document.body.appendChild(iframe);
        
        iframe.src = url;
        
        iframe.onload = () => {
            setTimeout(() => {
                Utils.showLoading(false);
                Utils.showStatus('📄 Đang mở hộp thoại in...', 2000);
                
                try {
                    iframe.contentWindow.print();
                } catch (e) {
                    console.error('Print error:', e);
                    Utils.showStatus('❌ Lỗi khi in', 2000);
                }
                
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 1000);
            }, 2000);
        };
    }
};

export const Exporter = {
    async export() {
        Utils.showLoading(true);
        Utils.showStatus('📦 Tạo ZIP...', 0);
        
        try {
            const zip = new JSZip();
            const opts = { indent_size: 2, end_with_newline: true };
            
            let fontCSS = '';
            if (Object.keys(FontManager.families).length > 0) {
                for (const [name, family] of Object.entries(FontManager.families)) {
                    for (const v of family.variants) {
                        fontCSS += `@font-face {\n  font-family: '${name}';\n  src: url('fonts/${name}/${v.filename}') format('${v.format}');\n  font-weight: ${v.weight};\n  font-style: ${v.style};\n}\n\n`;
                    }
                }
            }
            
            const htmlWithImagePaths = ImageManager.replaceDataUrlsForExport(Editor.getValue('html'));
            
            zip.file('document.html', html_beautify(htmlWithImagePaths, opts));
            zip.file('styles.css', css_beautify(fontCSS + Editor.getValue('css'), opts));
            zip.file('script.js', js_beautify(Editor.getValue('js'), opts));
            
            if (Object.keys(FontManager.families).length > 0) {
                const fonts = zip.folder('fonts');
                for (const [name, family] of Object.entries(FontManager.families)) {
                    const fam = fonts.folder(name);
                    for (const v of family.variants) {
                        const b64 = v.dataUrl.split(',')[1];
                        const bin = atob(b64);
                        const arr = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
                        fam.file(v.filename, arr);
                    }
                }
            }
            
            ImageManager.exportToZip(zip);
            
            const blob = await zip.generateAsync({ 
                type: 'blob', 
                compression: 'DEFLATE', 
                compressionOptions: { level: 9 } 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `paged-${Date.now()}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            
            Utils.showLoading(false);
            Utils.showStatus('✅ Export OK');
        } catch (e) {
            Utils.showLoading(false);
            Utils.showStatus('❌ Lỗi');
            console.error(e);
        }
    }
};

export const Importer = {
    async import(file) {
        Utils.showLoading(true);
        Utils.showStatus('📂 Đọc ZIP...', 0);
        
        try {
            const zip = await JSZip.loadAsync(file);
            
            const html = zip.file('document.html');
            if (html) {
                const content = await html.async('string');
                const match = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                if (match) {
                    Editor.setValue('html', match[1].trim().replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').trim());
                } else {
                    Editor.setValue('html', content);
                }
            }
            
            const css = zip.file('styles.css');
            if (css) {
                let content = await css.async('string');
                content = content.replace(/@font-face\s*\{[^}]*\}/g, '').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
                Editor.setValue('css', content);
            }
            
            const js = zip.file('script.js');
            if (js) {
                Editor.setValue('js', await js.async('string'));
            }
            
            const fontFiles = Object.keys(zip.files).filter(n => 
                n.startsWith('fonts/') && 
                !n.endsWith('/') && 
                /\.(ttf|otf|woff|woff2)$/i.test(n)
            );
            
            for (const path of fontFiles) {
                try {
                    const parts = path.split('/');
                    if (parts.length < 3) continue;
                    
                    const familyName = parts[1];
                    const filename = parts[2];
                    const ext = filename.split('.').pop();
                    const format = FontManager.getFormat(ext);
                    
                    if (!format) continue;
                    
                    const file = zip.file(path);
                    const blob = await file.async('blob');
                    const dataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(blob);
                    });
                    
                    const { weight, style } = FontManager.parseFilename(filename);
                    
                    if (!FontManager.families[familyName]) {
                        FontManager.families[familyName] = { variants: [] };
                    }
                    
                    FontManager.families[familyName].variants.push({
                        weight,
                        style,
                        dataUrl,
                        format,
                        size: blob.size,
                        filename
                    });
                } catch (error) {
                    console.error('Error loading font:', path, error);
                }
            }
            
            await ImageManager.importFromZip(zip);
            
            FontManager.renderList();
            ImageManager.renderList();
            
            Utils.showLoading(false);
            Utils.showStatus('✅ Import OK');
            
            if (Object.keys(FontManager.families).length > 0) await Utils.delay(800);
            
            const currentMode = document.querySelector('.mode-btn.active')?.dataset.mode;
            if (currentMode === 'preview') {
                await Renderer.render(document.getElementById('framePreview'));
            }
        } catch (e) {
            Utils.showLoading(false);
            Utils.showStatus('❌ Lỗi');
            console.error(e);
        }
    }
};