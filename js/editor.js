export let editors = {};

export const Editor = {
    async init() {
        console.log('Initializing Ace editors...');
        
        // Wait for Ace to load
        await new Promise(resolve => {
            if (typeof ace !== 'undefined') {
                resolve();
            } else {
                const interval = setInterval(() => {
                    if (typeof ace !== 'undefined') {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            }
        });
        
        console.log('Ace loaded, creating editors...');
        
        // HTML Editor
        const htmlContainer = document.getElementById('htmlEditor');
        if (htmlContainer) {
            editors.html = ace.edit(htmlContainer);
            editors.html.setTheme('ace/theme/monokai');
            editors.html.session.setMode('ace/mode/html');
            editors.html.setFontSize(14);
            editors.html.setOptions({
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                showPrintMargin: false,
                wrap: true
            });
            editors.html.setValue(`<h1 style="text-align: center; margin-bottom: 2em;">Tiêu đề chính</h1>
<div class="date">Ngày 28 tháng 12 năm 2025</div>

<p>Đây là đoạn văn đầu tiên. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>

<p>Đoạn văn thứ hai với nhiều nội dung hơn. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>

<p>Nội dung tiếp theo sẽ tự động xuống trang mới nếu hết chỗ. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.</p>

<div class="end">— Kết thúc —</div>`, -1);
            console.log('HTML editor created');
        } else {
            console.error('HTML container not found');
        }

        // CSS Editor
        const cssContainer = document.getElementById('cssEditor');
        if (cssContainer) {
            editors.css = ace.edit(cssContainer);
            editors.css.setTheme('ace/theme/monokai');
            editors.css.session.setMode('ace/mode/css');
            editors.css.setFontSize(14);
            editors.css.setOptions({
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                showPrintMargin: false
            });
            editors.css.setValue(`/* Cấu hình trang A4 dọc */
@page {
  size: A4 portrait;
  margin: 2.5cm;
  
  @bottom-center {
    content: counter(page) " / " counter(pages);
    font-size: 10pt;
    color: #666;
  }
}

/* Trang ngang - Thêm class "landscape" vào phần tử */
@page landscape {
  size: A4 landscape;
  margin: 2.5cm;
}
.landscape {
  page: landscape;
}

/* Ngăn phân trang giữa các phần tử */
h1, h2, h3 {
  page-break-after: avoid;
  break-after: avoid;
}

p {
  margin: 0 0 1em 0;
  text-align: justify;
  orphans: 3;
  widows: 3;
}

/* Kiểu văn bản */
.date {
  text-align: center;
  font-size: 10pt;
  margin-bottom: 1.5em;
  color: #666;
}

.end {
  text-align: right;
  margin-top: 3em;
  font-style: italic;
}`, -1);
            console.log('CSS editor created');
        } else {
            console.error('CSS container not found');
        }

        // JS Editor
        const jsContainer = document.getElementById('jsEditor');
        if (jsContainer) {
            editors.js = ace.edit(jsContainer);
            editors.js.setTheme('ace/theme/monokai');
            editors.js.session.setMode('ace/mode/javascript');
            editors.js.setFontSize(14);
            editors.js.setOptions({
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                showPrintMargin: false
            });
            editors.js.setValue(`// JavaScript chạy TRƯỚC khi Paged.js render
document.addEventListener('DOMContentLoaded', () => {
  const dateEl = document.querySelector('.date');
  if (dateEl) {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    dateEl.textContent = \`Ngày \${now.getDate()} tháng \${now.getMonth() + 1} năm \${now.getFullYear()} - \${hours}:\${minutes}:\${seconds}\`;
  }
});`, -1);
            console.log('JS editor created');
        } else {
            console.error('JS container not found');
        }
        
        console.log('All Ace editors created:', editors);
    },
    
    getValue(editor) {
        if (!editors[editor]) {
            console.error(`Editor ${editor} not found`);
            return '';
        }
        return editors[editor].getValue();
    },
    
    setValue(editor, value) {
        if (!editors[editor]) {
            console.error(`Editor ${editor} not found`);
            return;
        }
        editors[editor].setValue(value, -1);
    }
};

export const Tabs = {
    switch(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const clickedTab = document.querySelector(`[data-tab="${tab}"]`);
        if (clickedTab) clickedTab.classList.add('active');
        
        const content = document.getElementById(tab);
        if (content) content.classList.add('active');
    }
};

// Setup tab switching
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            Tabs.switch(tab.dataset.tab);
        });
    });
});