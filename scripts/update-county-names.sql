-- 更新縣市名稱格式 - 去除市縣後綴
-- 執行前請先備份資料庫！

-- 更新 visited_places 表中的縣市名稱
UPDATE visited_places 
SET county = CASE 
  WHEN county = '臺北市' THEN '臺北'
  WHEN county = '新北市' THEN '新北'
  WHEN county = '桃園市' THEN '桃園'
  WHEN county = '臺中市' THEN '臺中'
  WHEN county = '臺南市' THEN '臺南'
  WHEN county = '高雄市' THEN '高雄'
  WHEN county = '基隆市' THEN '基隆'
  WHEN county = '新竹市' THEN '新竹'
  WHEN county = '嘉義市' THEN '嘉義'
  WHEN county = '新竹縣' THEN '新竹'
  WHEN county = '苗栗縣' THEN '苗栗'
  WHEN county = '彰化縣' THEN '彰化'
  WHEN county = '南投縣' THEN '南投'
  WHEN county = '雲林縣' THEN '雲林'
  WHEN county = '嘉義縣' THEN '嘉義'
  WHEN county = '屏東縣' THEN '屏東'
  WHEN county = '宜蘭縣' THEN '宜蘭'
  WHEN county = '花蓮縣' THEN '花蓮'
  WHEN county = '臺東縣' THEN '臺東'
  WHEN county = '澎湖縣' THEN '澎湖'
  WHEN county = '金門縣' THEN '金門'
  WHEN county = '連江縣' THEN '連江'
  ELSE county
END
WHERE county IN (
  '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市', '基隆市',
  '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣',
  '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣'
);

-- 檢查更新結果
SELECT county, COUNT(*) as count 
FROM visited_places 
GROUP BY county 
ORDER BY county;

-- 顯示更新統計
SELECT 
  '更新完成' as status,
  COUNT(*) as total_records,
  COUNT(DISTINCT county) as unique_counties
FROM visited_places; 