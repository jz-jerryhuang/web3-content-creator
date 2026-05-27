# Web3 Content Creator Plugin 🛠️

這是專為 Antigravity 設計的 Web3 社群內容創作助手插件 (Plugin)。它能引導 AI 逐步分析研究報告/輸入源、產出 LinkedIn 長文、IG 輪播圖大綱（Canva 批量生成 CSV 格式）以及自動生成封面圖。

## 📥 安裝與同步更新

當有新版本發佈時，您只需在終端機中運行以下指令，即可自動安裝或同步更新至最新版本。

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -Command "iex (iwr -UseBasicParsing https://raw.githubusercontent.com/jz-jerryhuang/web3-content-creator/main/scripts/install_update.ps1).Content"
```

### macOS / Linux (Bash)
```bash
curl -sSL https://raw.githubusercontent.com/jz-jerryhuang/web3-content-creator/main/scripts/install_update.sh | bash
```

---

## 📂 插件結構說明

- **`plugin.json`**: 插件配置元數據。
- **`skills/content-creator/SKILL.md`**: 定義 AI 運作流程與步驟的 Skill 文件。
- **`scripts/`**: 包含安裝、更新與發布的腳本。
- **`*.js`**: AI 運行的相關輔助程式（如 Gmail 抓取、PDF 解析、Canva 處理等）。
