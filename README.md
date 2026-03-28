
# F-1 稅務文件 PDF 自動填充後端服務

這是一個基於 Next.js 的後端服務，旨在自動填充美國稅務局 (IRS) 的 `Form 8843` 和 `Form 1040-NR` 表單。

## 功能

- 透過 API 請求，動態填充指定的 PDF 稅務表單。
- 支援 `Form 8843` 和 `Form 1040-NR`。
- 產生的 PDF 可直接下載，方便與前端整合或進行後續處理。

## 環境啟動

1.  **安裝依賴**:
    ```bash
    npm install
    ```

2.  **啟動開發伺服器**:
    ```bash
    npm run dev
    ```
    服務將會運行在 `http://localhost:3001` (或您指定的其他埠)。

## API 使用說明

### 端點 (Endpoint)

`POST /api/generate-pdf`

### 請求主體 (Request Body)

請求主體必須是一個 JSON 物件，包含 `formType` 和 `data` 兩個欄位。

- `formType`: 指定要填充的表單類型。有效值為 `"8843"` 或 `"1040nr"`。
- `data`: 一個物件，包含要填入表單的具體資訊。其結構根據 `formType` 而有所不同。

#### 範例 1: 產生 Form 8843

```json
{
  "formType": "8843",
  "data": {
    "firstName": "Alexy",
    "lastName": "Chen",
    "tin": "F-1",
    "addressInUS": "123 University Ave, Palo Alto, CA 94301",
    "addressInCountryOfResidence": "456 Home Rd, Taipei, Taiwan",
    "visaType": "F-1",
    "nonimmigrantStatus": "F-1 Student",
    "citizenCountry": "Taiwan",
    "passportCountry": "Taiwan",
    "passportNumber": "P123456789",
    "daysIn2023": "0",
    "daysIn2024": "0",
    "academicInstitutionInfo": "CLAREMONT MCKENNA COLLEGE, 500 EAST NINTH STREET, CLAREMONT, CA, 91711, 9096218109",
    "directorInfo": "ERICA HONGO, 500 EAST NINTH STREET, CLAREMONT, CA, 91711, 9096077386",
    "line12_moreThan5Years": false,
    "line13_appliedForLPR": false
  }
}
```

#### 範例 2: 產生 Form 1040-NR

```json
{
  "formType": "1040nr",
  "data": {
    "year": "2025",
    "firstName": "Alexy",
    "lastName": "Chen",
    "identifyingNumber": "999-99-9999",
    "address": "500 E 9th St",
    "aptNo": "APT 123",
    "cityTownPostOffice": "Claremont",
    "state": "CA",
    "zipCode": "91711",
    "foreignCountry": "Taiwan",
    "foreignProvince": "Taipei",
    "foreignPostalCode": "106",
    "filingStatus": "single",
    "hadDigitalAssets": false,
    "w2_income": "50000",
    "total_income": "50000",
    "adjusted_gross_income": "50000",
    "total_tax": "7000",
    "w2_withholding": "8000",
    "total_payments": "8000",
    "overpaid": "1000",
    "refund": "1000",
    "amount_you_owe": "0"
  }
}
```

### 成功回應

- **狀態碼**: `200 OK`
- **內容**: 回傳一個 PDF 檔案的二進位流。

## 檔案結構

- `app/api/generate-pdf/route.ts`: API 的主要進入點，負責解析請求、讀取 PDF 模板並呼叫對應的填充函式。
- `app/lib/pdf-fillers/`: 包含所有 PDF 填充邏輯的模組。
  - `f8843-filler.ts`: `Form 8843` 的填充邏輯與資料介面。
  - `f1040nr-filler.ts`: `Form 1040-NR` 的填充邏輯與資料介面。
- `public/forms/`: 存放原始的、可填寫的 PDF 模板。
  - `f8843.pdf`
  - `f1040nr_v2.pdf` (注意：這是經過驗證可用的版本)
- `test-api.js`: 一個 Node.js 腳本，用於快速測試 API 功能。

