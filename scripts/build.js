import fs from 'node:fs';
import path from 'node:path';

// 設定資料夾路徑
const contentDir = path.join(process.cwd(), 'content', 'nodes');
const outputDir = path.join(process.cwd(), 'docs'); // GitHub Pages 最愛讀這個資料夾

// 如果沒有 docs 資料夾，就建一個
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 讀取所有 markdown 檔案
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
let nodesData = [];

// 解析每一個檔案
files.forEach(file => {
  const content = fs.readFileSync(path.join(contentDir, file), 'utf-8');
  
  // 手刻超簡易正則表達式，把標頭(Frontmatter)跟內文分開
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return;

  const frontmatter = match[1];
  const markdownBody = match[2].trim();

  // 抓取屬性
  const title = frontmatter.match(/title:\s*"(.*?)"/)?.[1] || 'Untitled';
  const date = frontmatter.match(/date:\s*"(.*?)"/)?.[1] || '';
  const status = frontmatter.match(/status:\s*"(.*?)"/)?.[1] || 'archive';

  // 超簡易 Markdown 轉 HTML (只處理換行變成段落)
  const htmlContent = markdownBody.split('\n\n').map(p => `<p>${p}</p>`).join('');

  nodesData.push({ title, date, status, htmlContent });
});

// 按照日期排序（最新的在最上面）
nodesData.sort((a, b) => new Date(b.date) - new Date(a.date));

// 把資料組裝成 HTML 節點
let nodesHtml = '';
nodesData.forEach(node => {
  nodesHtml += `
    <div class="node ${node.status}">
      <div class="date">${node.date}</div>
      <div class="content">
        <h2>${node.title}</h2>
        ${node.htmlContent}
      </div>
    </div>
  `;
});

// 這是你的網站 HTML 骨架與基礎 CSS Vibe
const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Now Page</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #fafafa; color: #333; }
    h1 { text-align: center; margin-bottom: 40px; }
    .timeline { border-left: 3px solid #ddd; margin-left: 20px; padding-left: 30px; }
    .node { margin-bottom: 40px; position: relative; }
    /* 畫時間軸的圈圈 */
    .node::before { content: ''; width: 14px; height: 14px; background: #ddd; border-radius: 50%; position: absolute; left: -39px; top: 6px; }
    /* 現在狀態 (current) 會發亮！ */
    .node.current::before { background: #ff6b6b; box-shadow: 0 0 12px #ff6b6b; }
    .date { font-size: 0.9em; color: #888; letter-spacing: 1px; }
    .content h2 { margin: 5px 0 10px 0; font-size: 1.4em; }
    .content p { line-height: 1.6; color: #555; }
  </style>
</head>
<body>
  <h1>✧ ₍ᐢ.ˬ.⑅ᐢ₎ʚଓ<br>Now Page</h1>
  <div class="timeline">
    ${nodesHtml}
  </div>
</body>
</html>
`;

// 寫出最終的 HTML 檔案
fs.writeFileSync(path.join(outputDir, 'index.html'), htmlTemplate, 'utf8');
console.log('✅ Vibe 打包完成！請去 docs/index.html 查看你的網站！');