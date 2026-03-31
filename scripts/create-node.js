import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const contentDir = path.join(process.cwd(), 'content', 'nodes');

if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("=========================================");
console.log("  ✧ ₍ᐢ.ˬ.⑅ᐢ₎ʚଓ 歡迎來到生活節點產生器  ");
console.log("=========================================\n");

// 第一題：問頁面上顯示的標題（可包含中文）
rl.question('✏️  這個節點的標題是？ (可輸入中文，例如：2026 4月回顧)： ', (title) => {
  
  // 第二題：問檔案名稱（強制要求英文）
  rl.question('🔗 請輸入檔案/網址名稱 (請用英文小寫與連字號，例如：2026-april-update)： ', (slug) => {
    
    // 第三題：問狀態
    rl.question('📌 這是目前的狀態 (current) 還是歷史回顧 (archive)？ [預設: current / 輸入 a 切換 archive]： ', (statusInput) => {
      
      const status = statusInput.toLowerCase() === 'a' ? 'archive' : 'current';
      const date = new Date().toISOString().split('T')[0]; 
      
      // 使用你輸入的英文 slug 來當作檔名，並過濾掉不小心打進去的空格
      const cleanSlug = slug.trim().replace(/\s+/g, '-').toLowerCase() || 'untitled-node';
      const fileName = `${date}-${cleanSlug}.md`; 
      const filePath = path.join(contentDir, fileName);

      const template = `---
title: "${title}"
date: "${date}"
status: "${status}"
---

# ${title}

在這裡寫下你這個月發生的酷事情吧 ꉂ ˋ ˇˊ 𐤔
`;

      fs.writeFileSync(filePath, template, 'utf8');
      
      console.log(`\n✅ 太棒惹！成功建立節點檔案：`);
      console.log(`📂 路徑：${filePath}`);
      console.log(`\n趕快打開編輯器開始記錄吧 🚀`);
      
      rl.close();
    });
  });
});