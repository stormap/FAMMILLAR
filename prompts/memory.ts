export const P_MEM_S2M = `<Nén ký ức-Ngắn sang Trung>
Vui lòng nén 【Danh sách ký ức ngắn hạn】 dưới đây, chuyển đổi thành 【Ký ức trung hạn】.

**Yêu cầu định dạng đầu ra nghiêm ngặt**:
1. **Phạm vi thời gian**: "Ngày X HH:MM-Ngày Y HH:MM: Một câu tóm tắt sự kiện cốt lõi trong khoảng thời gian này"
2. **Chi tiết quan trọng**:
   - [Ngày X HH:MM]: Sự kiện A|Sự kiện B|Sự kiện C
   - [Ngày X HH:MM]: Sự kiện D|Sự kiện E
   *(Chỉ ghi lại các sự kiện then chốt liên quan đến thay đổi số liệu, tiến triển quan hệ nhân际, kết quả chiến đấu quan trọng, bỏ qua đối thoại hàng ngày vụn vặt)*

**Yêu cầu cứng**:
- Chỉ xuất văn bản thuần túy, không JSON, không khối mã.
- Giữ nguyên định dạng ngày tháng "Ngày X HH:MM-Ngày Y HH:MM" và " - [Ngày X HH:MM]: ...|...".

**Giải thích dữ liệu đầu vào**:
Đầu vào là "Ký ức ngắn hạn" (Tóm tắt hành động mỗi lượt) của N lượt vừa qua. Hãy tích hợp chúng thành đoạn văn liền mạch.
</Nén ký ức-Ngắn sang Trung>`;

export const P_MEM_M2L = `<Nén ký ức-Trung sang Dài>
Vui lòng tích hợp sâu 【Danh sách ký ức trung hạn】 dưới đây, chuyển đổi thành 【Ký ức dài hạn】.

**Yêu cầu định dạng đầu ra nghiêm ngặt (Giống ký ức trung hạn)**:
1. **Phạm vi thời gian**: "Ngày X HH:MM-Ngày Y HH:MM: Một câu tóm tắt sự kiện cốt lõi trong khoảng thời gian này"
2. **Chi tiết quan trọng**:
   - [Ngày X HH:MM]: Sự kiện A|Sự kiện B|Sự kiện C
   - [Ngày X HH:MM]: Sự kiện D|Sự kiện E
   *(Chỉ ghi lại các sự kiện then chốt có ảnh hưởng lâu dài đến sự phát triển của nhân vật, lược bỏ chi tiết vụn vặt và dòng chảy sự việc)*

**Yêu cầu cứng**:
- Chỉ xuất văn bản thuần túy, không JSON, không khối mã.
- Giữ nguyên định dạng ngày tháng "Ngày X HH:MM-Ngày Y HH:MM" và " - [Ngày X HH:MM]: ...|...".

**Mục tiêu tích hợp**:
- Loại bỏ kiểu ghi chép nhật ký dòng chảy, cô đọng các nút thắt cuộc đời quan trọng.
- Quy nạp các trận Boss, sự kiện thăng cấp, thành tựu lớn và thay đổi quan hệ.
- Tổ chức ký ức theo "cảm giác chương hồi", nhưng chỉ xuất nội dung theo định dạng cố định nêu trên.
</Nén ký ức-Trung sang Dài>`;
