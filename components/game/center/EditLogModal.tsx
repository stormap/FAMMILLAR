import React from 'react';
import { X, Edit2, RotateCcw, Type, Terminal } from 'lucide-react';

interface EditLogModalProps {
  onClose: () => void;
  onApply: (content: string, type: 'REWRITE' | 'TEXT_ONLY') => void;
  initialContent: string;
  mode: 'AI_RAW' | 'USER_TEXT';
}

export const EditLogModal: React.FC<EditLogModalProps> = ({ onClose, onApply, initialContent, mode }) => {
    const [content, setContent] = React.useState(initialContent);

    const isUserMode = mode === 'USER_TEXT';

    return (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col p-8 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-zinc-700 pb-4 mb-4">
                <h3 className={`font-display uppercase text-2xl flex items-center gap-2 ${isUserMode ? 'text-blue-500' : 'text-green-500'}`}>
                    {isUserMode ? <Edit2 /> : <Terminal />} 
                    {isUserMode ? 'Sửa đổi ghi chép' : 'Chỉnh sửa dữ liệu gốc (Raw Edit)'}
                </h3>
                <button type="button" onClick={onClose} className="text-white hover:text-blue-500"><X size={24} /></button>
            </div>
            
            <div className={`p-4 mb-4 text-xs font-mono border ${isUserMode ? 'bg-blue-900/20 text-blue-300 border-blue-700' : 'bg-green-900/20 text-green-300 border-green-700'}`}>
                {isUserMode 
                    ? "Vui lòng chọn chế độ sửa đổi: [Chỉ sửa văn bản] sẽ không ảnh hưởng đến cốt truyện sau này; [Viết lại lịch sử] sẽ quay ngược thời gian và tạo lại các diễn biến tiếp theo." 
                    : "⚠️ Sửa dữ liệu: Sửa phản hồi JSON gốc của AI. Sẽ phân tích lại và áp dụng thay đổi trạng thái, việc này không kích hoạt tạo lại nội dung."}
            </div>

            <textarea 
                className={`flex-1 bg-zinc-900 font-mono text-xs p-4 border border-zinc-700 outline-none resize-none mb-4 ${isUserMode ? 'text-white focus:border-blue-600' : 'text-green-400 focus:border-green-600'}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
            />
            
            <div className="flex justify-end gap-4">
                <button onClick={onClose} className="px-6 py-2 border border-zinc-600 text-zinc-400 hover:text-white">Hủy</button>
                
                {isUserMode ? (
                    <>
                        <button 
                            onClick={() => onApply(content, 'TEXT_ONLY')} 
                            className="px-4 py-2 text-white font-bold bg-zinc-700 hover:bg-zinc-600 transition-all flex items-center gap-2"
                        >
                            <Type size={16} /> Chỉ sửa văn bản
                        </button>
                        <button 
                            onClick={() => onApply(content, 'REWRITE')} 
                            className="px-4 py-2 text-white font-bold bg-blue-600 hover:bg-blue-500 shadow-lg transition-all flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> Xác nhận viết lại (Time Travel)
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => onApply(content, 'REWRITE')} 
                        className="px-6 py-2 text-white font-bold bg-green-600 hover:bg-green-500 shadow-lg transition-all"
                    >
                        Áp dụng sửa đổi
                    </button>
                )}
            </div>
        </div>
    );
};