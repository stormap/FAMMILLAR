export const P_JUDGMENT_EASY = `<Hệ thống phán quyết-Dễ>
【Hệ thống phán quyết: Dễ (Easy)】
Chế độ này là phán quyết nới lỏng, cho phép một chút "may mắn", nhưng không được vi phạm nhân quả và chênh lệch cấp độ.

## Yêu cầu đầu ra phán quyết
**Bắt buộc sử dụng đối tượng logs có cấu trúc để xuất phán quyết**, định dạng như sau:
\`\`\`json
{
  "sender": "【Phán quyết】",
  "text": "Tên hành động｜Kết quả｜Giá trị check 158/Độ khó 120｜Cơ bản 130 (Lv.Bonus)｜Môi trường +18 (Địa hình/Tầm nhìn)｜Trạng thái -0 (Thể năng/Thương tích)｜May mắn +10"
}
\`\`\`
- Thứ tự trường cố định: Tên hành động → Kết quả → Giá trị check/Độ khó → Cơ bản → Môi trường → Trạng thái → May mắn (Có thể thêm "｜Trang bị +Q (Giải thích)" vào cuối nếu có sửa đổi từ trang bị).
- Kết quả chỉ cho phép: Thành công / Thất bại / Đại thành công / Đại thất bại.
- Trong bối cảnh NSFW vẫn bắt buộc thực hiện phán quyết nội bộ, nhưng mặc định không xuất dòng "【Phán quyết】" thông thường vào logs.
- Chỉ khi xuất hiện kết quả rủi ro cao như không thể chống cự/cưỡng chế mất kiểm soát/vắt kiệt/mê hoặc sa ngã, mới cho phép xuất dòng phán quyết chuyên dụng '"sender":"【Phán quyết NSFW】"' để hiển thị popup frontend.

---

## 1. Công thức cốt lõi (Formula)
\`\`\`
Giá trị phán quyết cuối = (Năng lực cơ bản + Ẩn số cấp độ) + May mắn + Sửa đổi môi trường + Sửa đổi trạng thái + Sửa đổi trang bị
\`\`\`

### A. Giá trị cơ bản (Base)
Cơ bản = Chỉ số thuộc tính cốt lõi(0-999) + (Cấp độ Level × 100)
**Thưởng cấp độ (Level Bonus)**:
- Lv.1: +0
- Lv.2: +300
- Lv.3: +600
- Lv.4: +1000

**Đối chiếu thuộc tính**:
- Tấn công cận chiến: Sức mạnh(Str) + Khéo léo(Dex)/2
- Tầm xa/Kỹ thuật: Khéo léo(Dex) + May mắn
- Phòng thủ/Sức bền: Độ bền(End) + Ý chí
- Né tránh/Chạy trốn: Nhanh nhẹn(Agi)
- Tấn công phép thuật: Ma lực(Mag) + Tinh thần(Liên quan tổng MP)

### B. Ngưỡng độ khó (Difficulty)
- Chiến đấu đồng cấp:
  - Đơn giản (Lính lác): Giá trị check cần > Trung bình thuộc tính - 100
  - Bình thường (Tinh anh): Giá trị check cần > Trung bình thuộc tính
  - Khó (Chủ tầng): Giá trị check cần > Trung bình thuộc tính + 200
- Thử thách vượt cấp:
  - Cao hơn 1 cấp: Ngưỡng đồng cấp +400
  - Cao hơn 2 cấp: Ngưỡng đồng cấp +800

### C. Hướng dẫn DC hành động phi chiến đấu (Ví dụ)
- Đơn giản: 80~120 (Giao thiệp thường/Leo trèo đơn giản)
- Trung bình: 120~170 (Giao thiệp phức tạp/Leo trèo nguy hiểm)
- Khó: 170~230 (Phá khóa nhanh/Né tránh tốc độ cao)
- Cực khó: 230+ (Thao tác chính xác cao trong thời gian ngắn)

### D. Giá trị sửa đổi (Modifiers)
- **Môi trường**:
  - Sân nhà/Địa hình quen thuộc: +30
  - Tối tăm/Chật hẹp/Khắc nghiệt: -30 ~ -50
  - Đồng đội hỗ trợ: +20 ~ +50
- **Trang bị**:
  - Trang bị áp chế/Khắc chế: +10 ~ +40
  - Trang bị hỏng/Độ bền không đủ: -10 ~ -30
- **Trạng thái**:
  - Bị thương (HP < 50%): -20
  - Hấp hối (HP < 20%): -50
  - Thể lực không đủ (Thể lực < 30%): -15
  - Mệt mỏi cao (Độ mệt mỏi > 70%): -15
  - Đói/Khát: -10 ~ -20
  - Hình phạt thể lực và mệt mỏi không cộng dồn, lấy cái cao hơn

---

## 2. Bảng phán quyết kết quả (Result Table)
| Chênh lệch (Giá trị check - Độ khó) | Kết quả | Hậu quả |
|-------------------|------|------|
| < -200            | Đại thất bại | Trọng thương nhẹ / Tổn thất tài nguyên |
| < 0               | Thất bại | Bị thương nhẹ / Buộc phải rút lui |
| ≥ 0               | Thành công | Gây sát thương hiệu quả |
| ≥ 150             | Đại thành công | Chí mạng / Phá hủy bộ phận |
| ≥ 300             | Hoàn hảo | Một kích tất sát / Đòn đánh anh hùng |

---

## 3. Quy trình và Quy tắc
1. Xác định loại hành động và thuộc tính cốt lõi.
2. Tính giá trị cơ bản và thưởng cấp độ.
3. Chọn ngưỡng độ khó theo cường độ địch hoặc DC.
4. Cộng dồn sửa đổi môi trường/trang bị/trạng thái.
5. Đưa ra kết quả phán quyết và ghi vào dòng phán quyết.

## 4. Ví dụ bối cảnh
- Ví dụ 1 (Giao thiệp): Cơ bản 120 + Môi trường +10 + Trạng thái -0 → Check 130, so với DC 110, Thành công.
- Ví dụ 2 (Chiến đấu): Cơ bản 160 + Trang bị +20 + Môi trường -10 → Check 170, so với ngưỡng Tinh anh 150, Thành công.

## 5. Quy tắc Dễ (Bắt buộc)
- Chênh lệch ≥ -30 có thể coi là "Miễn cưỡng thành công".
- Hậu quả thất bại cho phép làm nhẹ, nhưng phải thực tế.
- Không cho phép vượt cấp áp đảo vô lý.
</Hệ thống phán quyết-Dễ>`;

export const P_JUDGMENT_NORMAL = `<Hệ thống phán quyết-Bình thường>
【Hệ thống phán quyết: Bình thường (Normal)】
Chế độ này là phán quyết tiêu chuẩn, kết quả và cái giá tương ứng nghiêm ngặt.

## Yêu cầu đầu ra phán quyết
**Bắt buộc sử dụng đối tượng logs có cấu trúc để xuất phán quyết**, định dạng như sau:
\`\`\`json
{
  "sender": "【Phán quyết】",
  "text": "Tên hành động｜Kết quả｜Giá trị check 158/Độ khó 120｜Cơ bản 130 (Lv.Bonus)｜Môi trường +18 (Địa hình/Tầm nhìn)｜Trạng thái -0 (Thể năng/Thương tích)｜May mắn +10"
}
\`\`\`
- Thứ tự trường cố định: Tên hành động → Kết quả → Giá trị check/Độ khó → Cơ bản → Môi trường → Trạng thái → May mắn (Có thể thêm "｜Trang bị +Q (Giải thích)" vào cuối nếu có sửa đổi từ trang bị).
- Kết quả chỉ cho phép: Thành công / Thất bại / Đại thành công / Đại thất bại.
- Trong bối cảnh NSFW vẫn bắt buộc thực hiện phán quyết nội bộ, nhưng mặc định không xuất dòng "【Phán quyết】" thông thường vào logs.
- Chỉ khi xuất hiện kết quả rủi ro cao như không thể chống cự/cưỡng chế mất kiểm soát/vắt kiệt/mê hoặc sa ngã, mới cho phép xuất dòng phán quyết chuyên dụng '"sender":"【Phán quyết NSFW】"' để hiển thị popup frontend.

---

## 1. Công thức cốt lõi (Formula)
\`\`\`
Giá trị phán quyết cuối = (Năng lực cơ bản + Ẩn số cấp độ) + May mắn + Sửa đổi môi trường + Sửa đổi trạng thái + Sửa đổi trang bị
\`\`\`

### A. Giá trị cơ bản (Base)
Cơ bản = Chỉ số thuộc tính cốt lõi(0-999) + (Cấp độ Level × 100)
**Thưởng cấp độ (Level Bonus)**:
- Lv.1: +0
- Lv.2: +300
- Lv.3: +600
- Lv.4: +1000

**Đối chiếu thuộc tính**:
- Tấn công cận chiến: Sức mạnh(Str) + Khéo léo(Dex)/2
- Tầm xa/Kỹ thuật: Khéo léo(Dex) + May mắn
- Phòng thủ/Sức bền: Độ bền(End) + Ý chí
- Né tránh/Chạy trốn: Nhanh nhẹn(Agi)
- Tấn công phép thuật: Ma lực(Mag) + Tinh thần(Liên quan tổng MP)

### B. Ngưỡng độ khó (Difficulty)
- Chiến đấu đồng cấp:
  - Đơn giản (Lính lác): Giá trị check cần > Trung bình thuộc tính - 100
  - Bình thường (Tinh anh): Giá trị check cần > Trung bình thuộc tính
  - Khó (Chủ tầng): Giá trị check cần > Trung bình thuộc tính + 200
- Thử thách vượt cấp:
  - Cao hơn 1 cấp: Ngưỡng đồng cấp +500
  - Cao hơn 2 cấp: Ngưỡng đồng cấp +1000

### C. Hướng dẫn DC hành động phi chiến đấu (Ví dụ)
- Đơn giản: 100~140 (Giao thiệp thường/Leo trèo đơn giản)
- Trung bình: 140~190 (Giao thiệp phức tạp/Leo trèo nguy hiểm)
- Khó: 190~250 (Phá khóa tinh vi/Né tránh tốc độ cao)
- Cực khó: 250+ (Thao tác chính xác cao trong thời gian ngắn)

### D. Giá trị sửa đổi (Modifiers)
- **Môi trường**:
  - Sân nhà/Địa hình quen thuộc: +30
  - Tối tăm/Chật hẹp/Khắc nghiệt: -30 ~ -50
  - Đồng đội hỗ trợ: +20 ~ +50
- **Trang bị**:
  - Trang bị áp chế/Khắc chế: +10 ~ +40
  - Trang bị hỏng/Độ bền không đủ: -10 ~ -30
- **Trạng thái**:
  - Bị thương (HP < 50%): -20
  - Hấp hối (HP < 20%): -50
  - Thể lực không đủ (Thể lực < 30%): -20
  - Mệt mỏi cao (Độ mệt mỏi > 70%): -20
  - Đói/Khát: -20 ~ -30
  - Hình phạt thể lực và mệt mỏi không cộng dồn, lấy cái cao hơn

---

## 2. Bảng phán quyết kết quả (Result Table)
| Chênh lệch (Giá trị check - Độ khó) | Kết quả | Hậu quả |
|-------------------|------|------|
| < -200            | Đại thất bại | Trọng thương / Trang bị hỏng / Mất tài nguyên |
| < 0               | Thất bại | Bị thương / Hành động thất bại |
| ≥ 0               | Thành công | Gây sát thương hiệu quả |
| ≥ 150             | Đại thành công | Chí mạng / Phá hủy bộ phận |
| ≥ 300             | Hoàn hảo | Một kích tất sát / Đòn đánh anh hùng |

---

## 3. Quy trình và Quy tắc
1. Xác định loại hành động và thuộc tính cốt lõi.
2. Tính giá trị cơ bản và thưởng cấp độ.
3. Chọn ngưỡng độ khó theo cường độ địch hoặc DC.
4. Cộng dồn sửa đổi môi trường/trang bị/trạng thái.
5. Đưa ra kết quả phán quyết và ghi vào dòng phán quyết.

## 4. Ví dụ bối cảnh
- Ví dụ 1 (Chiến đấu): Cơ bản 170 + Trang bị +15 + Môi trường -10 = 175, so với ngưỡng Tinh anh 160, Thành công.
- Ví dụ 2 (Giao thiệp): Cơ bản 120 + May mắn +10 + Trạng thái -20 = 110, so với DC 140, Thất bại.

## 5. Quy tắc Bình thường (Bắt buộc)
- Thất bại bắt buộc phải mang lại cái giá thực tế.
- Chênh lệch cấp độ vẫn là tuyệt đối.
</Hệ thống phán quyết-Bình thường>`;

export const P_JUDGMENT_HARD = `<Hệ thống phán quyết-Khó>
【Hệ thống phán quyết: Khó (Hard)】
Chế độ này nhấn mạnh phán quyết khắc nghiệt và chi phí thất bại cao.

## Yêu cầu đầu ra phán quyết
**Bắt buộc sử dụng đối tượng logs có cấu trúc để xuất phán quyết**, định dạng như sau:
\`\`\`json
{
  "sender": "【Phán quyết】",
  "text": "Tên hành động｜Kết quả｜Giá trị check 158/Độ khó 120｜Cơ bản 130 (Lv.Bonus)｜Môi trường +18 (Địa hình/Tầm nhìn)｜Trạng thái -0 (Thể năng/Thương tích)｜May mắn +10"
}
\`\`\`
- Thứ tự trường cố định: Tên hành động → Kết quả → Giá trị check/Độ khó → Cơ bản → Môi trường → Trạng thái → May mắn (Có thể thêm "｜Trang bị +Q (Giải thích)" vào cuối nếu có sửa đổi từ trang bị).
- Kết quả chỉ cho phép: Thành công / Thất bại / Đại thành công / Đại thất bại.
- Trong bối cảnh NSFW vẫn bắt buộc thực hiện phán quyết nội bộ, nhưng mặc định không xuất dòng "【Phán quyết】" thông thường vào logs.
- Chỉ khi xuất hiện kết quả rủi ro cao như không thể chống cự/cưỡng chế mất kiểm soát/vắt kiệt/mê hoặc sa ngã, mới cho phép xuất dòng phán quyết chuyên dụng '"sender":"【Phán quyết NSFW】"' để hiển thị popup frontend.

---

## 1. Công thức cốt lõi (Formula)
\`\`\`
Giá trị phán quyết cuối = (Năng lực cơ bản + Ẩn số cấp độ) + May mắn + Sửa đổi môi trường + Sửa đổi trạng thái + Sửa đổi trang bị
\`\`\`

### A. Giá trị cơ bản (Base)
Cơ bản = Chỉ số thuộc tính cốt lõi(0-999) + (Cấp độ Level × 100)
**Thưởng cấp độ (Level Bonus)**:
- Lv.1: +0
- Lv.2: +300
- Lv.3: +600
- Lv.4: +1000

**Đối chiếu thuộc tính**:
- Tấn công cận chiến: Sức mạnh(Str) + Khéo léo(Dex)/2
- Tầm xa/Kỹ thuật: Khéo léo(Dex) + May mắn
- Phòng thủ/Sức bền: Độ bền(End) + Ý chí
- Né tránh/Chạy trốn: Nhanh nhẹn(Agi)
- Tấn công phép thuật: Ma lực(Mag) + Tinh thần(Liên quan tổng MP)

### B. Ngưỡng độ khó (Difficulty)
- Chiến đấu đồng cấp:
  - Đơn giản (Lính lác): Giá trị check cần > Trung bình thuộc tính - 100
  - Bình thường (Tinh anh): Giá trị check cần > Trung bình thuộc tính
  - Khó (Chủ tầng): Giá trị check cần > Trung bình thuộc tính + 200
- Thử thách vượt cấp:
  - Cao hơn 1 cấp: Ngưỡng đồng cấp +700
  - Cao hơn 2 cấp: Ngưỡng đồng cấp +1300

### C. Hướng dẫn DC hành động phi chiến đấu (Ví dụ)
- Đơn giản: 120~160
- Trung bình: 160~220
- Khó: 220~280
- Cực khó: 280+

### D. Giá trị sửa đổi (Modifiers)
- **Môi trường**:
  - Sân nhà/Địa hình quen thuộc: +30
  - Tối tăm/Chật hẹp/Khắc nghiệt: -40 ~ -70
  - Đồng đội hỗ trợ: +20 ~ +40
- **Trang bị**:
  - Trang bị áp chế/Khắc chế: +10 ~ +30
  - Trang bị hỏng/Độ bền không đủ: -20 ~ -40
- **Trạng thái**:
  - Bị thương (HP < 50%): -25
  - Hấp hối (HP < 20%): -60
  - Thể lực không đủ (Thể lực < 30%): -25
  - Mệt mỏi cao (Độ mệt mỏi > 70%): -25
  - Đói/Khát: -30 ~ -40
  - Hình phạt thể lực và mệt mỏi không cộng dồn, lấy cái cao hơn

---

## 2. Bảng phán quyết kết quả (Result Table)
| Chênh lệch (Giá trị check - Độ khó) | Kết quả | Hậu quả |
|-------------------|------|------|
| < -200            | Đại thất bại | Thương tật lớn / Trang bị vỡ nát |
| < 0               | Thất bại | Trọng thương / Buộc phải rút lui |
| ≥ 0               | Thành công | Gây sát thương hiệu quả |
| ≥ 150             | Đại thành công | Chí mạng / Phá hủy bộ phận |
| ≥ 300             | Hoàn hảo | Một kích tất sát / Đòn đánh anh hùng |

---

## 3. Quy trình và Quy tắc
1. Xác định loại hành động và thuộc tính cốt lõi.
2. Tính giá trị cơ bản và thưởng cấp độ.
3. Chọn ngưỡng độ khó theo cường độ địch hoặc DC.
4. Cộng dồn sửa đổi môi trường/trang bị/trạng thái.
5. Đưa ra kết quả phán quyết và ghi vào dòng phán quyết.

## 4. Ví dụ bối cảnh
- Ví dụ 1 (Chiến đấu): Cơ bản 190 + Môi trường -30 + Trang bị +10 = 170, so với ngưỡng Tinh anh 190, Thất bại.
- Ví dụ 2 (Chạy trốn): Cơ bản 160 + Trạng thái -25 = 135, so với DC 200, Thất bại.

## 5. Quy tắc Khó (Bắt buộc)
- Thất bại bắt buộc mang lại cái giá rõ ràng và nghiêm trọng.
- Chiến đấu đồng cấp cũng có thể xuất hiện thương vong cực đoan.
</Hệ thống phán quyết-Khó>`;

export const P_JUDGMENT_HELL = `<Hệ thống phán quyết-Địa ngục>
【Hệ thống phán quyết: Địa ngục (Hell)】
Chế độ này là phán quyết tàn khốc nhất, nhấn mạnh cái chết và cái giá tuyệt đối.

## Yêu cầu đầu ra phán quyết
**Bắt buộc sử dụng đối tượng logs có cấu trúc để xuất phán quyết**, định dạng như sau:
\`\`\`json
{
  "sender": "【Phán quyết】",
  "text": "Tên hành động｜Kết quả｜Giá trị check 158/Độ khó 120｜Cơ bản 130 (Lv.Bonus)｜Môi trường +18 (Địa hình/Tầm nhìn)｜Trạng thái -0 (Thể năng/Thương tích)｜May mắn +10"
}
\`\`\`
- Thứ tự trường cố định: Tên hành động → Kết quả → Giá trị check/Độ khó → Cơ bản → Môi trường → Trạng thái → May mắn (Có thể thêm "｜Trang bị +Q (Giải thích)" vào cuối nếu có sửa đổi từ trang bị).
- Kết quả chỉ cho phép: Thành công / Thất bại / Đại thành công / Đại thất bại.
- Trong bối cảnh NSFW vẫn bắt buộc thực hiện phán quyết nội bộ, nhưng mặc định không xuất dòng "【Phán quyết】" thông thường vào logs.
- Chỉ khi xuất hiện kết quả rủi ro cao như không thể chống cự/cưỡng chế mất kiểm soát/vắt kiệt/mê hoặc sa ngã, mới cho phép xuất dòng phán quyết chuyên dụng '"sender":"【Phán quyết NSFW】"' để hiển thị popup frontend.

---

## 1. Công thức cốt lõi (Formula)
\`\`\`
Giá trị phán quyết cuối = (Năng lực cơ bản + Ẩn số cấp độ) + May mắn + Sửa đổi môi trường + Sửa đổi trạng thái + Sửa đổi trang bị
\`\`\`

### A. Giá trị cơ bản (Base)
Cơ bản = Chỉ số thuộc tính cốt lõi(0-999) + (Cấp độ Level × 100)
**Thưởng cấp độ (Level Bonus)**:
- Lv.1: +0
- Lv.2: +300
- Lv.3: +600
- Lv.4: +1000

**Đối chiếu thuộc tính**:
- Tấn công cận chiến: Sức mạnh(Str) + Khéo léo(Dex)/2
- Tầm xa/Kỹ thuật: Khéo léo(Dex) + May mắn
- Phòng thủ/Sức bền: Độ bền(End) + Ý chí
- Né tránh/Chạy trốn: Nhanh nhẹn(Agi)
- Tấn công phép thuật: Ma lực(Mag) + Tinh thần(Liên quan tổng MP)

### B. Ngưỡng độ khó (Difficulty)
- Chiến đấu đồng cấp:
  - Đơn giản (Lính lác): Giá trị check cần > Trung bình thuộc tính - 100
  - Bình thường (Tinh anh): Giá trị check cần > Trung bình thuộc tính
  - Khó (Chủ tầng): Giá trị check cần > Trung bình thuộc tính + 200
- Thử thách vượt cấp:
  - Cao hơn 1 cấp: Ngưỡng đồng cấp +900
  - Cao hơn 2 cấp: Ngưỡng đồng cấp +1600

### C. Hướng dẫn DC hành động phi chiến đấu (Ví dụ)
- Đơn giản: 140~200
- Trung bình: 200~260
- Khó: 260~330
- Cực khó: 330+

### D. Giá trị sửa đổi (Modifiers)
- **Môi trường**:
  - Sân nhà/Địa hình quen thuộc: +20
  - Tối tăm/Chật hẹp/Khắc nghiệt: -50 ~ -90
  - Đồng đội hỗ trợ: +10 ~ +30
- **Trang bị**:
  - Trang bị áp chế/Khắc chế: +10 ~ +20
  - Trang bị hỏng/Độ bền không đủ: -30 ~ -60
- **Trạng thái**:
  - Bị thương (HP < 50%): -30
  - Hấp hối (HP < 20%): -80
  - Thể lực không đủ (Thể lực < 30%): -30
  - Mệt mỏi cao (Độ mệt mỏi > 70%): -30
  - Đói/Khát: -40 ~ -60
  - Hình phạt thể lực và mệt mỏi không cộng dồn, lấy cái cao hơn

---

## 2. Bảng phán quyết kết quả (Result Table)
| Chênh lệch (Giá trị check - Độ khó) | Kết quả | Hậu quả |
|-------------------|------|------|
| < -200            | Đại thất bại | Trọng thương chí mạng / Trang bị nát vụn |
| < 0               | Thất bại | Trọng thương hoặc hấp hối |
| ≥ 0               | Thành công | Gây sát thương hiệu quả |
| ≥ 150             | Đại thành công | Chí mạng / Phá hủy bộ phận |
| ≥ 300             | Hoàn hảo | Một kích tất sát / Đòn đánh anh hùng |

---

## 3. Quy trình và Quy tắc
1. Xác định loại hành động và thuộc tính cốt lõi.
2. Tính giá trị cơ bản và thưởng cấp độ.
3. Chọn ngưỡng độ khó theo cường độ địch hoặc DC.
4. Cộng dồn sửa đổi môi trường/trang bị/trạng thái.
5. Đưa ra kết quả phán quyết và ghi vào dòng phán quyết.

## 4. Ví dụ bối cảnh
- Ví dụ 1 (Chiến đấu): Cơ bản 200 + Môi trường -50 + Trang bị +10 = 160, so với ngưỡng Tinh anh 220, Thất bại.
- Ví dụ 2 (Thi triển phép): Cơ bản 180 + Trạng thái -40 = 140, so với DC 260, Thất bại.

## 5. Luật thép Địa ngục (Bắt buộc)
- Chênh lệch cấp độ là tuyệt đối: Kém 1 cấp là khổ chiến, kém 2 cấp là tàn sát.
- Không có bảo hộ cốt truyện, thất bại tức là cái giá thực tế.
- Trọng thương Đầu/Ngực có thể dẫn đến tử vong ngay lập tức.
</Hệ thống phán quyết-Địa ngục>`;
