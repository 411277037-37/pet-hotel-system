寵物旅館與美容管理系統 - HTML/CSS/JavaScript 原型

使用方式：
1. 解壓縮 zip。
2. 直接用瀏覽器開啟 index.html。
3. 不需要安裝套件，也不需要 npm。

示範帳號：
- 飼主：owner / 123
- 櫃檯人員：staff / 123
- 美容師：groomer / 123
- 系統管理員：admin / 123

主要功能：
- 登入 / 註冊
- 飼主管理寵物資料
- 預約住宿 / 美容
- 模擬付款、取消與退款
- 櫃檯確認訂單、Check-in、Check-out
- 美容師更新服務狀態與回報異常
- 管理員管理帳號、服務價格、房間與查看報表
- 使用 localStorage 儲存操作資料

如果想恢復初始資料：
在瀏覽器開發者工具 Console 輸入：
localStorage.removeItem('petHotelSystemData_v1')
然後重新整理頁面。
