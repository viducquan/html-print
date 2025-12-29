import { $, Utils } from './dom.js';

export const ImageManager = {
    images: {}, // { id: { name, dataUrl, size } }
    
    generateId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    async upload(files) {
        Utils.showLoading(true);
        Utils.showStatus('📤 Đang tải ảnh...', 0);
        
        let count = 0;
        for (const file of files) {
            try {
                if (!file.type.startsWith('image/')) continue;
                
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                
                const id = this.generateId();
                this.images[id] = {
                    name: file.name,
                    dataUrl: dataUrl,
                    size: file.size
                };
                
                count++;
            } catch (error) {
                console.error('Error loading image:', file.name, error);
            }
        }
        
        this.renderList();
        Utils.showLoading(false);
        Utils.showStatus(`✅ Đã tải ${count} ảnh`);
    },
    
    renderList() {
        const container = $.imageListContainer;
        
        if (Object.keys(this.images).length === 0) {
            container.innerHTML = '<div class="empty-state">Chưa có ảnh</div>';
            return;
        }
        
        container.innerHTML = '';
        for (const [id, img] of Object.entries(this.images)) {
            const item = document.createElement('div');
            item.className = 'image-item';
            
            item.innerHTML = `
                <div class="image-preview">
                    <img src="${img.dataUrl}" alt="${img.name}">
                </div>
                <div class="image-info">
                    <div class="image-name" title="${img.name}">${img.name}</div>
                    <div class="image-details">${(img.size / 1024).toFixed(1)} KB</div>
                    <div class="image-path">images/${img.name}</div>
                </div>
                <div class="image-actions">
                    <button class="img-btn" onclick="ImageManager.copyPath('${img.name}')" title="Copy đường dẫn">📋</button>
                    <button class="img-btn" onclick="ImageManager.insertImage('${id}')" title="Chèn vào HTML">➕</button>
                    <button class="img-btn delete" onclick="ImageManager.deleteImage('${id}')" title="Xóa">🗑️</button>
                </div>
            `;
            
            container.appendChild(item);
        }
    },
    
    copyPath(filename) {
        const path = `images/${filename}`;
        navigator.clipboard.writeText(path).then(() => {
            Utils.showStatus('✅ Đã copy: ' + path);
        }).catch(() => {
            const temp = document.createElement('textarea');
            temp.value = path;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            Utils.showStatus('✅ Đã copy: ' + path);
        });
    },
    
    insertImage(id) {
        const img = this.images[id];
        if (!img) return;
        
        // Dùng tên file gốc thay vì ID
        const imgTag = `<img src="images/${img.name}" alt="${img.name}" style="max-width: 100%; height: auto;">`;
        
        const textarea = $.html;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        
        textarea.value = before + imgTag + after;
        textarea.selectionStart = textarea.selectionEnd = start + imgTag.length;
        
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
        
        const htmlTab = document.querySelector('.tab[onclick*="html"]');
        if (htmlTab) htmlTab.click();
        
        Utils.showStatus('✅ Đã chèn ảnh');
    },
    
    deleteImage(id) {
        if (confirm('Xóa ảnh này?')) {
            delete this.images[id];
            this.renderList();
            Utils.showStatus('✅ Đã xóa ảnh');
        }
    },
    
    exportToZip(zip) {
        if (Object.keys(this.images).length === 0) return;
        
        const imagesFolder = zip.folder('images');
        
        for (const [id, img] of Object.entries(this.images)) {
            const base64 = img.dataUrl.split(',')[1];
            const binary = atob(base64);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            
            // Dùng tên file gốc
            imagesFolder.file(img.name, array);
        }
    },
    
    async importFromZip(zip) {
        const imageFiles = Object.keys(zip.files).filter(name => 
            name.startsWith('images/') && 
            !name.endsWith('/') &&
            /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(name)
        );
        
        if (imageFiles.length === 0) return;
        
        for (const path of imageFiles) {
            try {
                const file = zip.file(path);
                if (!file) continue;
                
                const filename = path.split('/').pop();
                
                const blob = await file.async('blob');
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(blob);
                });
                
                const id = this.generateId();
                this.images[id] = {
                    name: filename,
                    dataUrl: dataUrl,
                    size: blob.size
                };
            } catch (error) {
                console.error('Error loading image:', path, error);
            }
        }
        
        this.renderList();
    },
    
    // Replace image data URLs in HTML with relative paths for export
    replaceDataUrlsForExport(html) {
        let modifiedHtml = html;
        
        for (const [id, img] of Object.entries(this.images)) {
            // Thay data URL bằng đường dẫn tương đối với tên file gốc
            modifiedHtml = modifiedHtml.replace(
                new RegExp(img.dataUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                `images/${img.name}`
            );
        }
        
        return modifiedHtml;
    }
};

window.ImageManager = ImageManager;