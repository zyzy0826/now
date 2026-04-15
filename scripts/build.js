import fs from 'node:fs';
import path from 'node:path';

// 🌟 改變在這裡：直接把輸出目錄鎖定在 docs 就好，把 nowDir 拔掉！
const contentDir = path.join(process.cwd(), 'content', 'nodes');
const outputDir = path.join(process.cwd(), 'docs');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function renderMarkdown(md) {
  let html = md.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/\r\n/g, '\n');
  html = html.replace(/^(#+ .*$)/gim, '\n\n$1\n\n');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n*)+/g, match => `\n\n<ul class="md-list">\n${match.trim()}\n</ul>\n\n`);
  html = html.replace(/\n{3,}/g, '\n\n');
  
  const blocks = html.split('\n\n');
  return blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul')) return trimmed;
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}

const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
let nodesData = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(contentDir, file), 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return;

  const frontmatter = match[1];
  const markdownBody = match[2].trim();
  const title = frontmatter.match(/title:\s*"(.*?)"/)?.[1] || 'Untitled';
  const date = frontmatter.match(/date:\s*"(.*?)"/)?.[1] || '';
  const status = frontmatter.match(/status:\s*"(.*?)"/)?.[1] || 'archive';
  
  const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '');
  nodesData.push({ title, date, status, htmlContent: renderMarkdown(markdownBody), slug });
});

nodesData.sort((a, b) => new Date(b.date) - new Date(a.date));

// ==========================================
// 1. 產生獨立資料夾 (現在直接生在 docs/slug/ 下面)
// ==========================================
nodesData.forEach(node => {
  const postDir = path.join(outputDir, node.slug);
  if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

  const postHtml = `
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${node.title} - Now Page</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 650px; margin: 40px auto; padding: 20px; background: #fafafa; color: #333; line-height: 1.8; }
      .back-btn { display: inline-block; margin-bottom: 30px; text-decoration: none; color: #888; border: 1px solid #ddd; padding: 6px 16px; border-radius: 20px; font-size: 0.9em; transition: 0.2s; }
      .back-btn:hover { background: #eee; color: #333; }
      .date { color: #ff6b6b; font-size: 0.95em; font-weight: bold; letter-spacing: 1px; }
      .content h1 { font-size: 2em; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
      .content .md-list { background: #fff; padding: 20px 20px 20px 40px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <a href="../" class="back-btn">← 回到 Now 主頁</a>
    <div class="date">${node.date}</div>
    <div class="content">${node.htmlContent}</div>
  </body>
  </html>
  `;
  // 寫入 docs/slug/index.html
  fs.writeFileSync(path.join(postDir, 'index.html'), postHtml, 'utf8');
});

// ==========================================
// 2. 產生主頁 (現在直接生在 docs/index.html)
// ==========================================
let timelineHtml = '';
nodesData.forEach((node, index) => {
  const positionClass = index % 2 === 0 ? 'up' : 'down';
  timelineHtml += `
    <a href="${node.slug}/" class="node-card ${positionClass} ${node.status}">
      <div class="node-date">${node.date}</div>
      <div class="node-title">${node.title}</div>
    </a>
  `;
});

const indexTemplate = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Now Page - zuiyu.me</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #fafafa; color: #333; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
    .timeline-container { position: relative; width: 90vw; max-width: 1000px; display: flex; align-items: center; }
    .timeline-track { position: absolute; top: 50%; left: 0; right: 0; border-top: 2px dashed #bbb; z-index: 1; }
    .nodes-wrapper { display: flex; gap: 60px; padding: 120px 40px; overflow-x: auto; scroll-behavior: smooth; z-index: 2; width: 100%; scrollbar-width: none; }
    .nodes-wrapper::-webkit-scrollbar { display: none; }
    .node-card { position: relative; background: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-decoration: none; color: inherit; min-width: 140px; text-align: center; transition: transform 0.2s; flex-shrink: 0; border: 1px solid #eee; }
    .node-card:hover { transform: scale(1.05); }
    .node-card.up { transform: translateY(-70px); }
    .node-card.up::after { content: ''; position: absolute; left: 50%; bottom: -52px; height: 50px; border-left: 2px dashed #bbb; transform: translateX(-50%); }
    .node-card.down { transform: translateY(70px); }
    .node-card.down::after { content: ''; position: absolute; left: 50%; top: -52px; height: 50px; border-left: 2px dashed #bbb; transform: translateX(-50%); }
    .nav-btn { background: white; border: 1px solid #ddd; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; display: flex; align-items: center; justify-content: center; }
    .nav-left { left: -20px; } .nav-right { right: -20px; }
  </style>
</head>
<body>
  <h1>✧ ₍ᐢ.ˬ.⑅ᐢ₎ʚଓ<br>Zuiyu's Now Page</h1>
  <div class="timeline-container">
    <button class="nav-btn nav-left" id="scroll-left">←</button>
    <div class="timeline-track"></div>
    <div class="nodes-wrapper" id="scroll-wrapper">${timelineHtml}</div>
    <button class="nav-btn nav-right" id="scroll-right">→</button>
  </div>
  <script>
    const wrapper = document.getElementById('scroll-wrapper');
    document.getElementById('scroll-left').addEventListener('click', () => { wrapper.scrollBy({ left: -300, behavior: 'smooth' }); });
    document.getElementById('scroll-right').addEventListener('click', () => { wrapper.scrollBy({ left: 300, behavior: 'smooth' }); });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(outputDir, 'index.html'), indexTemplate, 'utf8');
console.log('✅ 打包完成！結構已直接輸出至 docs/ 根目錄！');