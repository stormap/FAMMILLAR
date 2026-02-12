export const P_SYS_COMMANDS = `<Bối cảnh & Ví dụ lệnh>
# 【Bối cảnh & Ví dụ lệnh】

[Bối cảnh BẮT BUỘC tạo lệnh]
□ Thay đổi Thời gian/Ngày/Địa điểm → set gameState.游戏时间 (Giờ game) / set gameState.当前日期 (Ngày hiện tại) / set gameState.当前地点 (Địa điểm hiện tại)
□ Nhận vật phẩm (Nhặt/Được tặng/Bỏ vào túi) → push gameState.背包 (Bắt buộc tạo cấu trúc InventoryItem hoàn chỉnh, id phải duy nhất)
□ Vật phẩm rơi nhưng CHƯA nhặt → Chỉ mô tả trong văn bản, KHÔNG tạo lệnh.
□ Tiêu hao vật phẩm → add gameState.背包[i].数量 -1 (Nếu số lượng về 0, thì delete gameState.背包[i])
□ Sát thương chiến đấu → add gameState.角色.生命值 -X / add gameState.角色.身体部位.胸部.当前 -X
□ Thay đổi chỉ số → add gameState.角色.能力值.力量 1 (Chỉ khi cập nhật Falna/Ân huệ)
□ Thay đổi xã hội → add gameState.社交[i].好感度 X / push gameState.社交 (NPC mới) / set gameState.社交[i].是否在场 true
□ Ký ức tương tác NPC → Hễ có Đối thoại/Giao dịch/Chiến đấu/Tin nhắn/Ủy thác/Chào hỏi với NPC, bắt buộc push gameState.社交[i].记忆 (Đảm bảo dòng cuối là tương tác lần này)
□ Cập nhật nhiệm vụ → set gameState.任务[i].状态 "completed"

[Kiểm tra điều kiện tiên quyết (Có trước sửa sau)]
□ Trước khi thêm Ký ức/Sửa hảo cảm NPC → Xác nhận NPC đã tồn tại trong gameState.社交; nếu chưa, phải push NPC mới trước, rồi mới thực hiện lệnh nhớ/hảo cảm.
□ Phân giải Index Xã hội (CRITICAL) → Trước tiên lập ánh xạ từ \`Index/Tên/ID\` trong [Trạng thái Xã hội & NPC], sau đó mới viết \`gameState.社交[i].*\`; CẤM đoán mò index i dựa theo thứ tự xuất hiện trong văn bản.
□ Trước khi sửa gameState.背包[i].数量 → Xác nhận vật phẩm đã có; nếu chưa, push vật phẩm hoàn chỉnh trước, sau đó mới add/set số lượng.
□ Trước khi sửa Nhiệm vụ[i]/Khế ước[i]/Chiến đấu.Địch[i] → Xác nhận index tồn tại; nếu chưa, phải tạo mục mới trước, cấm thao tác trực tiếp lên index rỗng.
□ Thứ tự lệnh trong cùng lượt: Lệnh TẠO trước, lệnh SỬA sau (Create → Update).

[Thư viện ví dụ thao tác lệnh]

**A. Ví dụ lệnh Vật phẩm**
- **Nhận vật phẩm (Cấu trúc hoàn chỉnh)**:
  \`{"action":"push", "key":"gameState.背包", "value":{"id":"Itm_gen_01", "名称":"Sừng Bicorn", "描述":"Vật liệu cứng.", "数量":1, "类型":"material", "品质":"Common", "价值":500}}\`
- **Tiêu hao vật phẩm (Chỉ định Index)**:
  \`{"action":"add", "key":"gameState.背包[2].数量", "value":-1}\`
- **Thay đổi tiền tệ**:
  \`{"action":"add", "key":"gameState.角色.法利", "value":-1200}\`

**B. Ví dụ lệnh Falna/Chỉ số năng lực**
- **Cập nhật chỉ số**:
  \`{"action":"add", "key":"gameState.角色.能力值.力量", "value": 5}\`
- **Học kỹ năng (Skill)**:
  \`{"action":"push", "key":"gameState.角色.技能", "value":{"id":"Skl_Argonaut", "名称":"Argonaut (Anh Hùng Nguyện Vọng)", "类别":"Chủ động", "描述":"Tụ lực cho hành động chủ động...", "效果":"Sau khi tụ lực hoàn tất nhận sát thương bùng nổ cực lớn", "触发":"Tụ lực chủ động", "持续":"Ngắn", "冷却":"Trung bình", "消耗":{"体力":"Trung bình","精神":"Thấp"}, "标签":["Tụ lực"], "稀有":true}}\`
- **Học ma pháp (Magic)**:
  \`{"action":"push", "key":"gameState.角色.魔法", "value":{"id":"Mag_Firebolt", "名称":"Firebolt", "咏唱":"Hỡi tinh linh lửa, hãy hóa thành mũi tên rực cháy.", "类别":"Tấn công", "属性":"Lửa", "描述":"Ma pháp đạn đạo hệ lửa niệm chú cực nhanh", "效果":"Sát thương lửa đơn mục tiêu", "射程":"Trung bình", "范围":"Đơn thể", "消耗":{"精神":30}}}\`

**C. Ví dụ lệnh NPC**
- **Yêu cầu điền hồ sơ**: Hồ sơ cần bao gồm「Định vị thân phận/Đặc điểm ngoại hình/Đặc trưng tính cách/Trải nghiệm quá khứ/Quan hệ với người chơi hoặc trạng thái hiện tại」. NPC "Quan tâm đặc biệt" phải cụ thể và đầy đủ; Quan hệ bình thường có thể tóm tắt nhưng cần bao gồm ít nhất Thân phận + Tính cách + Hiện trạng.
- **Tạo NPC (Quan hệ thường, chỉ hồ sơ)**:
  \`{"action":"push", "key":"gameState.社交", "value":{"id":"Char_Ryu", "姓名":"Ryuu Lion", "种族":"Elf", "年龄":21, "身份":"Nhân viên quán rượu", "眷族":"Astraea (Cũ)", "等级":4, "好感度":20, "关系状态":"Quen biết", "是否在场":true, "特别关注":false, "记忆":[], "档案":"Nhân viên quán rượu điềm tĩnh, đang trực tại quầy bar."}}\`
- **Tạo NPC (Quan tâm đặc biệt, bổ sung hồ sơ)**:
  \`{"action":"push", "key":"gameState.社交", "value":{"id":"Char_Syr", "姓名":"Syr", "种族":"Human", "年龄":18, "身份":"Nhân viên quán rượu", "眷族":"Freya", "等级":2, "好感度":10, "关系状态":"Quen biết", "是否在场":true, "特别关注":true, "记忆":[], "档案":"Thiếu nữ quán rượu hoạt bát thân thiện, tóc ngắn màu hạt dẻ, nụ cười rạng rỡ, tính cách nhiệt tình nhạy bén, xuất thân không rõ, làm việc tại quán rượu và quen thuộc với giới mạo hiểm giả."}}\`
- **Thay đổi hảo cảm**:
  \`{"action":"add", "key":"gameState.社交[3].好感度", "value":5}\`
- **Ghi nhớ tương tác**:
  \`{"action":"push", "key":"gameState.社交[3].记忆", "value":{"内容":"Đối phương hỏi về ủy thác hiện tại và hẹn sẽ trả lời sau.","时间戳":"Thời gian hiện tại"}}\`
- **Khi NPC chưa tồn tại, tạo trước rồi mới ghi nhớ (Thứ tự đúng)**:
  \`{"action":"push", "key":"gameState.社交", "value":{"id":"Char_New_01", "姓名":"Nhân vật mới", "种族":"Human", "年龄":20, "身份":"Mạo hiểm giả", "眷族":"Không", "等级":1, "好感度":0, "关系状态":"Sơ giao", "是否在场":true, "特别关注":false, "记忆":[], "档案":"Mạo hiểm giả tân thủ lần đầu gặp tại sảnh Guild."}}\`
  \`{"action":"push", "key":"gameState.社交[4].记忆", "value":{"内容":"Hoàn thành giao tiếp lần đầu với người chơi và trao đổi tên họ.","时间戳":"Thời gian hiện tại"}}\` (Trong ví dụ giả sử index mới = 4)
- **Ví dụ sai (CẤM)**:
  Trong văn bản nhắc đến "Ais" liền viết ngay \`gameState.社交[7].好感度\` (Khi chưa xác nhận index trong ánh xạ xã hội).
</Bối cảnh & Ví dụ lệnh>`;
