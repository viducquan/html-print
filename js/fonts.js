import { $, Utils } from './dom.js';

const FontParser = {
    parse(filename) {
        const name = filename.replace(/\.(ttf|otf|woff|woff2)$/i, '');
        const lower = name.toLowerCase();
        
        let weight = 400, style = 'normal';
        
        if (lower.includes('thin')) weight = 100;
        else if (lower.includes('extralight') || lower.includes('ultralight')) weight = 200;
        else if (lower.includes('light')) weight = 300;
        else if (lower.includes('medium')) weight = 500;
        else if (lower.includes('semibold') || lower.includes('demibold')) weight = 600;
        else if (lower.includes('extrabold') || lower.includes('ultrabold')) weight = 800;
        else if (lower.includes('black') || lower.includes('heavy')) weight = 900;
        else if (lower.includes('bold')) weight = 700;
        
        if (lower.includes('italic') || lower.includes('oblique')) style = 'italic';
        
        let familyName = name
            .replace(/-(Thin|ExtraLight|UltraLight|Light|Regular|Medium|SemiBold|DemiBold|Bold|ExtraBold|UltraBold|Black|Heavy)/gi, '')
            .replace(/-(Italic|Oblique)/gi, '')
            .trim();
        
        return { familyName, weight, style };
    },
    
    getWeightName: (w) => ({100:'Thin',200:'ExtraLight',300:'Light',400:'Regular',500:'Medium',600:'SemiBold',700:'Bold',800:'ExtraBold',900:'Black'}[w] || w),
    
    getFormat: (ext) => ({ttf:'truetype',otf:'opentype',woff:'woff',woff2:'woff2'}[ext.toLowerCase()])
};

export const FontManager = {
    families: {},
    
    generateFontFace() {
        let css = '';
        for (const [name, family] of Object.entries(this.families)) {
            for (const v of family.variants) {
                css += `\n@font-face {\n  font-family: '${name}';\n  src: url('${v.dataUrl}') format('${v.format}');\n  font-weight: ${v.weight};\n  font-style: ${v.style};\n}\n`;
            }
        }
        return css;
    },
    
    renderList() {
        if (Object.keys(this.families).length === 0) {
            $.fontListContainer.innerHTML = '<div class="empty-state">Chưa có font</div>';
            return;
        }
        
        let styleEl = document.getElementById('preview-fonts');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'preview-fonts';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = this.generateFontFace();
        
        $.fontListContainer.innerHTML = '';
        for (const [name, family] of Object.entries(this.families)) {
            const item = document.createElement('div');
            item.className = 'font-family-item';
            
            let variants = '';
            family.variants.forEach((v, i) => {
                const wName = FontParser.getWeightName(v.weight);
                const sName = v.style === 'italic' ? 'Italic' : '';
                variants += `<div class="font-variant"><div class="variant-info"><strong>${wName} ${sName}</strong> <span style="color:#888">(${v.format.toUpperCase()}, ${(v.size/1024).toFixed(1)}KB)</span></div><div class="variant-actions"><button class="font-btn" onclick="FontManager.editVariant('${name}',${i})">✏️</button><button class="font-btn delete" onclick="FontManager.deleteVariant('${name}',${i})">🗑️</button></div></div>`;
            });
            
            item.innerHTML = `<div class="font-family-header"><div class="font-family-info"><div class="font-family-name" contenteditable="true" onblur="FontManager.renameFamily(this,'${name}')">${name}</div><div class="font-family-usage">font-family: '${name}'</div></div><button class="font-btn delete" onclick="FontManager.deleteFamily('${name}')">🗑️ Xóa family</button></div><div class="font-variants">${variants}</div><div class="font-preview" style="font-family:'${name}',serif"><span style="font-weight:300">Light</span> <span style="font-weight:400">Regular</span> <span style="font-weight:700">Bold</span> <span style="font-weight:400;font-style:italic">Italic</span><br>Chữ Việt: áàảãạ ÁÀẢÃẠ êệếề</div>`;
            
            $.fontListContainer.appendChild(item);
        }
    },
    
    renameFamily(el, old) {
        const newName = el.textContent.trim();
        if (newName && newName !== old && !this.families[newName]) {
            this.families[newName] = this.families[old];
            delete this.families[old];
            this.renderList();
            Utils.showStatus('✅ Đã đổi tên');
        } else el.textContent = old;
    },
    
    editVariant(name, idx) {
        const v = this.families[name].variants[idx];
        const src = prompt('Nhập URL font:', v.dataUrl.substring(0,100)+'...');
        if (src?.trim()) {
            v.dataUrl = src.trim();
            this.renderList();
            Utils.showStatus('✅ Đã cập nhật');
        }
    },
    
    deleteVariant(name, idx) {
        if (confirm('Xóa variant?')) {
            this.families[name].variants.splice(idx, 1);
            if (this.families[name].variants.length === 0) delete this.families[name];
            this.renderList();
            Utils.showStatus('✅ Đã xóa');
        }
    },
    
    deleteFamily(name) {
        if (confirm(`Xóa "${name}"?`)) {
            delete this.families[name];
            this.renderList();
            Utils.showStatus('✅ Đã xóa');
        }
    },
    
    async upload(files) {
        Utils.showLoading(true);
        Utils.showStatus('📤 Đang tải...', 0);
        
        let count = 0;
        for (const file of files) {
            try {
                const ext = file.name.split('.').pop();
                const format = FontParser.getFormat(ext);
                if (!format) continue;
                
                const dataUrl = await new Promise((resolve, reject) => {
                    const r = new FileReader();
                    r.onload = (e) => resolve(e.target.result);
                    r.onerror = reject;
                    r.readAsDataURL(file);
                });
                
                const { familyName, weight, style } = FontParser.parse(file.name);
                if (!this.families[familyName]) this.families[familyName] = { variants: [] };
                
                this.families[familyName].variants.push({ weight, style, dataUrl, format, size: file.size, filename: file.name });
                count++;
            } catch (e) {
                console.error('Font error:', file.name, e);
            }
        }
        
        this.renderList();
        Utils.showLoading(false);
        Utils.showStatus(`✅ Tải ${count} font`);
    }
};

window.FontManager = FontManager;
export { FontParser };