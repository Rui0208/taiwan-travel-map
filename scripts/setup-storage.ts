async function setupStorage() {
  try {
    console.log("正在連接到 API...");
    const response = await fetch("http://localhost:3000/api/storage/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("API 回應狀態:", response.status);
    const text = await response.text();
    console.log("API 回應內容:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("無法解析 API 回應為 JSON:", e);
      return;
    }

    if (response.ok) {
      console.log("✅ Storage bucket 設定成功！");
    } else {
      console.error("❌ Storage bucket 設定失敗:", data.error);
    }
  } catch (error) {
    console.error("❌ 執行腳本時發生錯誤:", error);
    if (error instanceof Error) {
      console.error("錯誤訊息:", error.message);
      console.error("錯誤堆疊:", error.stack);
    }
  }
}

setupStorage();
