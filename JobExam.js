/**
 * 🚀 DISC 職場行為風格測驗 - 自動化 PDF 報告生成系統
 * 本程式碼用於 Google Sheets，當表單提交時自動觸發。
 */

// ==========================================
// 1. 全域設定檔 (Configuration)
// ==========================================
const CONFIG = {
  // 請填入您的 Gemini API Key (建議未來可改用 Script Properties 隱藏金鑰)
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE', 
  
  // 請填入準備好的 Google Doc 報告範本 ID (網址列 /d/ 到 /edit 之間的字串)
  // 範本內需預留標籤：{{Name}}, {{Score}}, {{Section1}}, {{Section2}}, {{Section3}}, {{Section4}}
  TEMPLATE_DOC_ID: 'YOUR_GOOGLE_DOC_TEMPLATE_ID_HERE',
  
  // 產出 PDF 的目標雲端硬碟資料夾 ID
  OUTPUT_FOLDER_ID: 'YOUR_OUTPUT_FOLDER_ID_HERE',
  
  // 呼叫的 Gemini 模型 (建議使用 flash 版本兼顧速度與品質)
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};


// ==========================================
// 2. 主觸發流程 (Main Trigger Function)
// ==========================================
/**
 * 設定於「提交表單時」觸發的函式
 * @param {Object} e - 表單提交事件物件
 */
function onFormSubmit(e) {
  try {
    // 2.1 取得受測者資料與分數 (假設欄位順序：時間戳記, 姓名, D分, I分, S分, C分)
    // 實務上需依據您的試算表欄位索引進行調整
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    // 取得最新一筆資料
    const timestamp = sheet.getRange(lastRow, 1).getValue();
    const applicantName = sheet.getRange(lastRow, 2).getValue();
    const scoreD = sheet.getRange(lastRow, 3).getValue();
    const scoreI = sheet.getRange(lastRow, 4).getValue();
    const scoreS = sheet.getRange(lastRow, 5).getValue();
    const scoreC = sheet.getRange(lastRow, 6).getValue();
    
    // 組合為 AI 需要的格式 (例如：8;2;4;5)
    const scoreString = `${scoreD};${scoreI};${scoreS};${scoreC}`;
    Logger.log(`開始處理 [${applicantName}] 的評測，分數：${scoreString}`);

    // 2.2 呼叫 Gemini API 取得分析報告 (JSON 格式)
    const aiResponse = callGeminiAPI(scoreString);
    if (!aiResponse) throw new Error("AI 回應為空，請檢查 API 狀態。");

    // 2.3 解析 JSON
    const reportData = parseLLMResponse(aiResponse);

    // 2.4 產出 PDF 報告並存檔
    const pdfUrl = generatePDFReport(applicantName, scoreString, reportData);
    Logger.log(`✅ 報告生成成功！檔案位置：${pdfUrl}`);
    
    // (可選) 2.5 將 PDF 連結回寫到試算表的最後一個欄位
    // sheet.getRange(lastRow, 7).setValue(pdfUrl);

  } catch (error) {
    Logger.log(`❌ 執行發生錯誤: ${error.toString()}`);
  }
}


// ==========================================
// 3. AI 串接模組 (AI Integration Module)
// ==========================================
/**
 * 呼叫 Gemini API 進行 DISC 分析
 * @param {string} scoreString - 分數字串 (ex: "8;2;4;5")
 * @return {string} LLM 回傳的原始文字
 */
function callGeminiAPI(scoreString) {
  // 將我們先前確認過的系統提示詞與數據組合
  const promptText = `
  # Role: DISC 職場行為風格深度診斷專家 (資深人資顧問 HRBP)
  
  (此處插入我們先前優化好的完整 Prompt 提示詞規則...)
  
  現在，請依據以下受測者數據產出報告：
  數據：${scoreString}
  
  請務必只回傳符合規範的 JSON 格式，不要包含任何其他說明文字或 Markdown 標記 (\`\`\`json)。
  `;

  const requestBody = {
    "contents": [{
      "parts": [{ "text": promptText }]
    }],
    // 為了確保格式正確，可強制設定 response_mime_type 為 application/json (Gemini 支援)
    "generationConfig": {
      "temperature": 0.3, // 降低隨機性，確保顧問語氣穩定
      "response_mime_type": "application/json"
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(requestBody)
  };

  const url = `${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`;
  const response = UrlFetchApp.fetch(url, options);
  const jsonResponse = JSON.parse(response.getContentText());
  
  // 提取 Gemini 的文字回應
  return jsonResponse.candidates[0].content.parts[0].text;
}

/**
 * 清理並解析 LLM 回傳的 JSON 格式
 * (作為防呆機制，避免 LLM 偶爾回傳 Markdown 標記)
 */
function parseLLMResponse(rawText) {
  let cleanText = rawText.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  }
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  
  return JSON.parse(cleanText.trim());
}


// ==========================================
// 4. PDF 產出模組 (PDF Generation Module)
// ==========================================
/**
 * 複製範本、填入資料並匯出為 PDF
 * @param {string} name - 受測者姓名
 * @param {string} score - 分數字串
 * @param {Object} reportData - 解析後的 JSON 報告物件
 * @return {string} 最終產出的 PDF 檔案網址
 */
function generatePDFReport(name, score, reportData) {
  const folder = DriveApp.getFolderById(CONFIG.OUTPUT_FOLDER_ID);
  
  // 4.1 複製 Google Doc 範本
  const templateFile = DriveApp.getFileById(CONFIG.TEMPLATE_DOC_ID);
  const tempDocName = `[DISC報告]_${name}_${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd")}`;
  const newDocFile = templateFile.makeCopy(tempDocName, folder);
  const docId = newDocFile.getId();
  
  // 4.2 開啟新文件並替換標籤內容
  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();
  
  body.replaceText("{{Name}}", name);
  body.replaceText("{{Score}}", score);
  
  // 將 JSON 的四個 Section 填入範本對應位置
  body.replaceText("{{Section1}}", reportData.AI_Section1 || "無資料");
  body.replaceText("{{Section2}}", reportData.AI_Section2 || "無資料");
  body.replaceText("{{Section3}}", reportData.AI_Section3 || "無資料");
  body.replaceText("{{Section4}}", reportData.AI_Section4 || "無資料");
  
  doc.saveAndClose();
  
  // 4.3 將排版好的 Doc 轉換為 PDF (等待 2 秒確保儲存完畢)
  Utilities.sleep(2000); 
  const pdfBlob = newDocFile.getAs(MimeType.PDF);
  pdfBlob.setName(`${tempDocName}.pdf`);
  const pdfFile = folder.createFile(pdfBlob);
  
  // 4.4 刪除暫存的 Google Doc (維持資料夾乾淨)
  newDocFile.setTrashed(true);
  
  return pdfFile.getUrl();
}