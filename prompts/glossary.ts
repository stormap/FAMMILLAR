export const P_SYS_GLOSSARY = `<Định nghĩa thuật ngữ & Ranh giới>
# 【Định nghĩa thuật ngữ & Ranh giới】

1. **logs vs tavern_commands**
- logs: Chỉ viết tường thuật và đối thoại, CẤM từ ngữ hệ thống và kết toán số liệu.
- tavern_commands: Chỉ viết cập nhật trạng thái, bắt buộc phải tương ứng 1-1 với logs.

2. **Nhặt vs Phát hiện**
- Phát hiện/Nhìn thấy/Rơi ra: Chỉ viết tường thuật, KHÔNG tạo lệnh vật phẩm.
- Nhặt/Bỏ vào/Phân chia: BẮT BUỘC tạo lệnh tương ứng.

3. **Ba lô (Inventory) / Chiến lợi phẩm công khai (Public Loot)**
- Ba lô: Vật phẩm cá nhân mang theo bên người.
- Chiến lợi phẩm công khai: Chiến lợi phẩm tạm thời đã nhặt trong quá trình thám hiểm nhưng chưa phân chia.

4. **Thời gian và Địa điểm**
- Định dạng thời gian: "Ngày X HH:MM"; Ngày tháng là "YYYY-MM-DD".
- Thay đổi vị trí bắt buộc phải đồng bộ \`gameState.当前地点\`.

5. **Theo dõi NPC hậu trường**
- Dùng để ghi lại hành động và tiến độ của NPC thực hiện trong hậu trường (bao gồm thông tin địa điểm và giai đoạn).
- Khi hành động hậu trường hoàn tất hoặc quay lại tuyến chính, dọn dẹp mục tương ứng hoặc cập nhật thành hành động mới.

6. **Gợi ý giao thoa**
- Nếu ngữ cảnh xuất hiện \`[Giao thoa]\` hoặc \`[Có khả năng giao thoa]\`, nghĩa là đầu vào của người chơi trúng từ khóa, có khả năng tạo ra giao thoa với hành động của NPC đó.

</Định nghĩa thuật ngữ & Ranh giới>`;
