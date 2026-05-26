# 🚀 DISC 職場行為風格測驗 - 自動化 PDF 報告生成系統
(DISC Assessment Auto-PDF Generator)

## 📝 專案簡介
本專案旨在將傳統的 DISC 職場行為風格測驗，轉化為**全自動化的「零接觸」評測數據管線**。

透過整合 Google Workspace 與大型語言模型 (如 Gemini API)，系統能自動接收受測者表單、計算分數、執行專業的 HRBP 視角分析，並最終生成排版精美的 PDF 報告存檔。
本系統成功將 HR 繁瑣的「算分與製表」行政庶務（屬於 HAS 量表中的 H1/H2 高度自動化等級）交由系統處理，讓面試官與主管能將寶貴的時間專注於「深度面談與特質對焦」（H3 人機協作等級）。

## 🔄 工作流程 (Workflow)
本系統的核心運作機制分為以下四個自動化階段：

1. **📝 填寫 Google 表單 (Data Input)**
   - 受測者透過行動裝置或電腦，填寫經過「全雙字詞對齊」與「中性化去標籤」優化的 10 題 DISC 強迫選擇題。
   - 確保測驗體驗直覺，並有效降低受測者的社會期許誤差 (Social Desirability Bias)。

2. **📊 Google Sheet 寫入資料 (Data Storage)**
   - 表單送出後，原始作答數據即時寫入 Google 試算表。
   - 試算表內建邏輯自動計算 D、I、S、C 四個維度的常模分數（例如：`8;2;4;5`）。

3. **🧠 GAS 接收資料與 AI 分析 (Data Processing & AI Generation)**
   - 透過 Google Apps Script (GAS) 設定觸發條件 (Trigger)。
   - GAS 自動擷取最新一筆分數，並套用預先封裝好的**「資深人資顧問 (HRBP) 提示詞」**，透過 API 呼叫語言模型。
   - AI 依據核心動機、快慢步調與任務/人際導向，精準產出以下 JSON 格式洞察：
     - `Section 1`: 性格與行為風格重點
     - `Section 2`: 適配度與工作風格預測
     - `Section 3`: 面談追問建議 (行為事例題)
     - `Section 4`: 最佳互動與管理策略

4. **📄 PDF 產出與雲端歸檔 (PDF Export & Archiving)**
   - GAS 將 AI 回傳的 JSON 結構化資料，自動填入預設的 Google 文件 (Google Docs) 報告範本中進行排版。
   - 將完成的文件轉換為 PDF 格式。
   - 將 PDF 自動存檔至指定的 Google Drive 資料夾，並可設定自動發送 Email 通知給用人主管或 HR。

## 🛠️ 技術堆疊 (Tech Stack)
* **前端介面**: Google Forms
* **資料庫與計分**: Google Sheets 
* **後端自動化邏輯**: Google Apps Script (GAS)
* **AI 核心引擎**: Gemini API (或其他 LLM API)
* **文件排版與產出**: Google Docs & Google Drive API

## ✨ 核心特色
* **極簡的部署成本**：無需架設伺服器，完全依賴 Google 雲端生態系。
* **專業的 Prompt Engineering**：內建經過深度校調的 DISC 專家提示詞，確保 AI 產出的報告「無冗言贅字、用人主管秒懂」。
* **標準化 JSON 輸出**：嚴格限制 AI 輸出格式，確保自動化排版過程不會因格式跑掉而中斷。

## 🚀 快速開始 (Getting Started)
*(這裡可以預留空間，未來補充如何複製您的 Google Sheet 範本、如何貼上 GAS 程式碼、以及如何設定 API Key 的步驟說明)*
1. 複製此專案提供的 Google 表單與試算表範本。
2. 進入試算表的 `擴充功能` > `Apps Script`，貼上 `Code.gs` 中的程式碼。
3. 於 GAS 專案屬性中設定您的 `API_KEY` 與 `FOLDER_ID` (目標資料夾 ID)。
4. 設定試算表的「提交表單時」觸發條件 (Trigger)。
5. 完成！享受全自動的 DISC 測驗流程。

---
*Developed with ❤️ for better HR Tech & Human-AI Collaboration.*