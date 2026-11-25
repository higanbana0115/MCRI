# M.C.R.I. 怪奇生物研究所｜V1.0

黑暗科幻風格的互動式怪奇生物研究所網站。使用 HTML、CSS、JavaScript 與 JSON，無需建置工具。

## 功能
- 首頁與研究所部門導覽
- 12 隻原創生物角色（獨立 SVG 插畫）
- 生物搜尋、分類篩選、詳細檔案
- 餵食、撫摸、觀察、掃描互動
- 好感度、研究點數、經驗與等級
- 研究任務與獎勵
- 隨機異常事件與分支選擇
- LocalStorage 自動存檔
- JSON 存檔匯出、匯入、重置
- 響應式版面，支援手機與桌面

## 本機預覽
建議使用 VS Code 的 Live Server：
1. 解壓縮專案。
2. 使用 VS Code 開啟 `MCRI` 資料夾。
3. 安裝/啟用 Live Server。
4. 在 `index.html` 按右鍵，選擇 **Open with Live Server**。

也可以使用 Python：
```bash
python -m http.server 8000
```
然後瀏覽 `http://localhost:8000`。

> 請勿直接以 `file://` 開啟，因為瀏覽器可能會限制 `fetch()` 讀取 JSON。

## 部署到 GitHub Pages
1. 在 GitHub 建立一個新的 Repository，例如 `mcri-creature-lab`。
2. 將本資料夾內所有檔案與資料夾上傳至 Repository 根目錄。
3. 進入 Repository 的 **Settings → Pages**。
4. 在 **Build and deployment** 選擇 **Deploy from a branch**。
5. Branch 選擇 `main`，資料夾選 `/ (root)`，按 Save。
6. 等待部署完成，使用 Pages 顯示的網址開啟網站。

## 存檔注意
- V1.0 使用瀏覽器 LocalStorage，資料只存在目前瀏覽器/裝置。
- 清除網站資料、無痕模式結束或更換裝置可能造成進度遺失。
- 建議定期使用「研究紀錄 → 匯出存檔」備份 JSON。
- 匯入存檔會以匯入內容覆蓋目前遊戲狀態。

## 後續可擴充
- Firebase / Supabase 帳號與雲端同步
- 更多生物、探索地圖與主線章節
- 收容管理、研究材料與 DNA 小遊戲
- IoT 感測器資料串接
