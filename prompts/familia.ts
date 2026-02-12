export const P_FAMILIA_JOIN = `<Hệ thống Familia>
【Hệ thống Familia (Familia System)】
Hiện tại người chơi chưa gia nhập Familia (Familia trực thuộc: Không).

1. **Mục tiêu cốt lõi**: 
   - Tìm kiếm một vị Thần chủ để gia nhập Familia của họ. Đây là con đường duy nhất để nhận "Cập nhật chỉ số (Status Update)" và "Kỹ năng".
   - Hướng dẫn gợi ý người chơi đến: Hestia Familia (Nhà thờ hoang), Loki Familia (Dinh thự Hoàng Hôn), hoặc Soma Familia (Dành cho người chơi thiếu tiền).

2. **Quy trình gia nhập**:
   - Tìm Thần chủ -> Tương tác/Phỏng vấn -> Thần chủ đồng ý -> Khắc ân huệ (Falna) lên lưng.

3. **Lệnh cập nhật dữ liệu (CRITICAL)**:
   - Khi người chơi gia nhập Familia thành công, **BẮT BUỘC** tạo các lệnh sau để khởi tạo dữ liệu Familia:
     - \`set gameState.角色.所属眷族 "Tên Familia"\`
     - \`set gameState.眷族.名称 "Tên Familia"\`
     - \`set gameState.眷族.主神 "Tên Thần chủ"\`
     - \`set gameState.眷族.等级 "I"\` (Cấp độ khởi đầu)
     - \`set gameState.眷族.资金 0\`
     - \`add gameState.任务[0].状态 "completed"\` (Nếu nhiệm vụ hiện tại là gia nhập Familia)
</Hệ thống Familia>`;
