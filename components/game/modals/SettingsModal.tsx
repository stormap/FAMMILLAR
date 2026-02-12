import React, { useState, useEffect, useRef } from 'react';
import { X, Settings as SettingsIcon, LogOut, Save, User, ArrowLeft, ChevronRight, HardDrive, Eye, Cpu, Globe, Brain, Zap, Search, RefreshCw, Download, Plus, Trash2, ToggleLeft, ToggleRight, Edit2, Check, Upload, Database, FileJson, History, FileUp, FileDown, Folder, LayoutList, List, Copy, Code, Clock, ArrowUp, ArrowDown, EyeOff, Radio, Crown, Type, Sword, Server, AlertTriangle, MousePointer2, Activity, Shield } from 'lucide-react';
import { AppSettings, GameState, SaveSlot, PromptModule, PromptUsage, GlobalAISettings } from '../../../types';
import { DEFAULT_PROMPT_MODULES, assembleFullPrompt } from '../../../utils/ai';
import { DEFAULT_SETTINGS } from '../../../hooks/useAppSettings';
import { buildSaveExportPayload, downloadSaveAsZip, parseSaveFile } from '../../../utils/saveArchive';
import { clearAllSaveSlots, estimateSaveStorageBytes, getAllSaveSlots } from '../../../utils/saveStore';
import { P5Dropdown } from '../../ui/P5Dropdown';
import { GAME_SCHEMA_DOCS } from './schemaDocs';

// Sub-components
import { SettingsAIServices } from './settings/SettingsAIServices';
import { SettingsContext } from './settings/SettingsContext';

interface MenuButtonProps {
    icon: React.ReactNode;
    label: string;
    subLabel: string;
    onClick: () => void;
    color: string;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, subLabel, onClick, color }) => (
    <button 
        onClick={onClick}
        className={`group flex items-center gap-4 p-6 border-2 transition-all duration-300 bg-white hover:scale-[1.02] shadow-sm hover:shadow-md ${color}`}
    >
        <div className="text-3xl shrink-0 group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <div className="text-left">
            <div className="text-xl font-display uppercase tracking-wider leading-none mb-1 group-hover:tracking-widest transition-all">
                {label}
            </div>
            <div className="text-xs font-mono opacity-60 uppercase">
                {subLabel}
            </div>
        </div>
    </button>
);

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  avatarUrl: string;
  onSaveSettings: (newSettings: AppSettings) => void;
  onSaveGame: (slotId?: number | string) => void;
  onLoadGame: (slotId: number | string) => void;
  onUpdateAvatar: (url: string) => void;
  onExitGame: () => void;
  gameState: GameState;
  onUpdateGameState: (newState: GameState) => void;
  initialView?: SettingsView;
}

type SettingsView = 'MAIN' | 'PROMPTS' | 'VISUALS' | 'DATA' | 'AI_SERVICES' | 'VARIABLES' | 'MEMORY' | 'SCHEMA' | 'AI_CONTEXT' | 'STORAGE' | 'FULL_LOGS' | 'LIBRARY';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  avatarUrl,
  onSaveSettings, 
  onSaveGame,
  onLoadGame,
  onUpdateAvatar,
  onExitGame,
  gameState,
  onUpdateGameState,
  initialView
}) => {
  const [currentView, setCurrentView] = useState<SettingsView>('MAIN');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
  
  // Prompt Manager States
  const [selectedGroup, setSelectedGroup] = useState<string | null>('Cài đặt hệ thống');
  const [activePromptModuleId, setActivePromptModuleId] = useState<string | null>(null);

  // Variable Editor State
  const [variableCategory, setVariableCategory] = useState<string>('角色');
  const [jsonEditText, setJsonEditText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Save Feedback
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVED'>('IDLE');
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [autoSlots, setAutoSlots] = useState<SaveSlot[]>([]);

  // Storage Management State
  const [storageItems, setStorageItems] = useState<{key: string, size: number, label: string, type: string, details?: string[]}[]>([]);
  const [storageSummary, setStorageSummary] = useState<{ total: number; cache: number; saves: number; settings: number; api: number }>({
      total: 0,
      cache: 0,
      saves: 0,
      settings: 0,
      api: 0
  });
  const [contextStats, setContextStats] = useState<{ tokens: number; chars: number; bytes: number }>({
      tokens: 0,
      chars: 0,
      bytes: 0
  });
  const [logSearch, setLogSearch] = useState('');
  const [libraryMode, setLibraryMode] = useState<'UI' | 'JSON'>('UI');

  // File Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptFileInputRef = useRef<HTMLInputElement>(null);

  // Init Data
  const wasOpenRef = useRef(false);
  useEffect(() => {
      if (isOpen && !wasOpenRef.current) {
          setCurrentView(initialView || 'MAIN');
          setFormData(settings); // Sync settings on open only
          loadSaveSlots().catch(() => {});
      }
      if (!isOpen) {
          wasOpenRef.current = false;
          return;
      }
      wasOpenRef.current = true;
  }, [isOpen, initialView]);

  const loadSaveSlots = async () => {
      const all = await getAllSaveSlots();
      const manual = all.filter(s => s.type === 'MANUAL');
      const auto = all.filter(s => s.type === 'AUTO').sort((a,b) => b.timestamp - a.timestamp);
      setSaveSlots(manual);
      setAutoSlots(auto);
  };

  const scanStorage = async () => {
      const items: {key: string, size: number, label: string, type: string, details?: string[]}[] = [];
      const summary = { total: 0, cache: 0, saves: 0, settings: 0, api: 0 };
      for(let i=0; i<localStorage.length; i++) {
          const key = localStorage.key(i);
          if(key && (key.startsWith('danmachi_') || key.startsWith('phantom_'))) {
              const value = localStorage.getItem(key) || '';
              const size = new Blob([value]).size; 
              let label = key;
              let type = 'CACHE';
              let details: string[] = [];

              if (key === 'danmachi_settings') {
                  label = 'Cài đặt hệ thống (Settings)';
                  type = 'SETTINGS';
                  try {
                      const parsed = JSON.parse(value);
                      const prompts = Array.isArray(parsed.promptModules) ? parsed.promptModules : [];
                      const active = prompts.filter((m: any) => m && m.isActive).length;
                      const contextMods = Array.isArray(parsed.contextConfig?.modules) ? parsed.contextConfig.modules.length : 0;
                      const apiSize = new Blob([JSON.stringify(parsed.aiConfig || {})]).size;
                      details.push('Mô-đun Prompt: ' + prompts.length + ' (Đang bật ' + active + ')');
                      details.push('Mô-đun ngữ cảnh: ' + contextMods);
                      details.push('Hình nền: ' + (parsed.backgroundImage ? 'Đã lưu' : 'Chưa lưu'));
                      details.push('Cài đặt API: ' + formatBytes(apiSize));
                      summary.api += apiSize;
                  } catch (e) {}
              } else if (key.includes('save_auto')) {
                  label = `Lưu tự động cũ (Legacy Auto ${key.split('_').pop()})`;
                  type = 'SAVE_LEGACY';
              } else if (key.includes('save_manual')) {
                  label = `Lưu thủ công cũ (Legacy Manual ${key.split('_').pop()})`;
                  type = 'SAVE_LEGACY';
              }

              if (type === 'SAVE_LEGACY') {
                  try {
                      const parsed = JSON.parse(value);
                      const state = parsed?.data || parsed;
                      const avatar = state?.角色?.头像;
                      const name = state?.角色?.姓名;
                      const level = state?.角色?.等级;
                      if (name) details.push('Nhân vật: ' + name);
                      if (level !== undefined) details.push('Cấp độ: ' + level);
                      details.push('Avatar: ' + (avatar ? 'Đã lưu' : 'Không có'));
                  } catch (e) {}
              }

              items.push({ key, size, label, type, details: details.length > 0 ? details : undefined });
              summary.total += size;
              if (type === 'CACHE') summary.cache += size;
              if (type === 'SETTINGS') summary.settings += size;
              if (type === 'SAVE_LEGACY') summary.cache += size;
          }
      }
      const saveBytes = await estimateSaveStorageBytes();
      summary.saves = saveBytes;
      summary.total += saveBytes;
      if (saveBytes > 0) {
          items.push({
              key: 'indexeddb:saves',
              size: saveBytes,
              label: 'IndexedDB File lưu (Saves)',
              type: 'SAVE_DB'
          });
      }
      // Sort by type then key
      items.sort((a, b) => a.type.localeCompare(b.type) || a.key.localeCompare(b.key));
      setStorageItems(items);
      setStorageSummary(summary);
  };

  useEffect(() => {
      if (currentView === 'STORAGE') {
          scanStorage().catch(() => {});
          refreshContextStats();
      }
  }, [currentView]);

  // Init JSON Editor when category changes
  useEffect(() => {
      if (currentView === 'VARIABLES' && gameState) {
          // @ts-ignore
          const data = gameState[variableCategory];
          setJsonEditText(JSON.stringify(data, null, 4));
          setJsonError(null);
      }
  }, [variableCategory, currentView, gameState]);

  if (!isOpen) return null;

  const handleGlobalSave = () => {
    onSaveSettings(formData);
    onUpdateAvatar(avatarPreview);
    setSaveStatus('SAVED');
    setTimeout(() => {
        setSaveStatus('IDLE');
        onClose();
    }, 800);
  };

  const handleBack = () => {
    if (currentView === 'MAIN') {
        onClose();
    } else {
        setCurrentView('MAIN');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'bg') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              if (type === 'avatar') {
                  setAvatarPreview(result);
              } else {
                  setFormData(prev => ({...prev, backgroundImage: result}));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  // --- Export / Import Logic ---
  const handleExportSave = async () => {
      const exportData = buildSaveExportPayload(gameState);
      const fileBase = `danmachi_save_${gameState.角色?.姓名 || 'player'}_${new Date().toISOString().split('T')[0]}`;
      await downloadSaveAsZip(exportData, fileBase);
  };

  const handleImportSave = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const { stateToLoad, summary, timeStr } = await parseSaveFile(file);
          if (window.confirm(`Xác nhận nhập file lưu?\n\nThông tin: ${summary}\nThời gian: ${timeStr}\n\nCảnh báo: Thao tác này sẽ ghi đè tiến trình chưa lưu hiện tại!`)) {
              onUpdateGameState(stateToLoad);
              alert("Nhập file lưu thành công!");
              onClose();
          }
      } catch(err: any) {
          console.error("Import Error:", err);
          alert("Nhập thất bại: " + err.message);
      } finally {
          e.target.value = '';
      }
  };

  // --- Prompt Export / Import ---
  const normalizePromptModules = (modules: PromptModule[]) => {
      return modules.map((m, idx) => ({
          id: m.id || `import_${idx}`,
          name: m.name || `Mô-đun chưa đặt tên_${idx + 1}`,
          group: m.group || 'Chưa phân nhóm',
          usage: (['CORE', 'START', 'MEMORY_S2M', 'MEMORY_M2L'] as PromptUsage[]).includes(m.usage as PromptUsage) ? m.usage : 'CORE',
          isActive: typeof m.isActive === 'boolean' ? m.isActive : true,
          content: typeof m.content === 'string' ? m.content : '',
          order: typeof m.order === 'number' ? m.order : 100
      }));
  };

  const handleExportPrompts = () => {
      const exportData = {
          version: '3.1',
          exportedAt: Date.now(),
          promptModules: formData.promptModules
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danmachi_prompts_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportPrompts = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const content = ev.target?.result as string;
              const parsed = JSON.parse(content);
              const rawModules = Array.isArray(parsed) ? parsed : parsed.promptModules;
              if (!Array.isArray(rawModules)) throw new Error("Định dạng file Prompt sai: Không tìm thấy promptModules");
              const normalized = normalizePromptModules(rawModules);
              if (!window.confirm(`Xác nhận nhập Prompt?\nSẽ ghi đè các mô-đun Prompt hiện tại (${normalized.length} mục).`)) return;
              setFormData({ ...formData, promptModules: normalized });
              setActivePromptModuleId(null);
              alert("Nhập Prompt thành công!");
          } catch (err: any) {
              alert("Nhập Prompt thất bại: " + err.message);
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  // --- Storage Management Logic ---
  const formatBytes = (bytes: number, decimals = 2) => {
      if (!+bytes) return '0 B';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const estimateTokens = (text: string) => {
      if (!text) return 0;
      const compact = text.replace(/\s+/g, ' ').trim();
      if (!compact) return 0;
      const cjkCount = (compact.match(/[\u4E00-\u9FFF]/g) || []).length;
      const nonCjk = compact.length - cjkCount;
      return Math.ceil(cjkCount + nonCjk / 4);
  };

  const buildSettingsWithApi = (apiConfig: GlobalAISettings | null) => {
      const base = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;
      if (!apiConfig) return { ...base, apiProtectionEnabled: formData.apiProtectionEnabled };
      return { ...base, aiConfig: apiConfig, apiProtectionEnabled: formData.apiProtectionEnabled };
  };

  const cloneDefaultPrompts = () => DEFAULT_PROMPT_MODULES.map(m => ({ ...m }));

  const refreshContextStats = () => {
      try {
          const prompt = assembleFullPrompt("（Xem trước đầu vào của người dùng）", gameState, formData);
          setContextStats({
              chars: prompt.length,
              bytes: new Blob([prompt]).size,
              tokens: estimateTokens(prompt)
          });
      } catch (e) {
          setContextStats({ chars: 0, bytes: 0, tokens: 0 });
      }
  };

  const deleteStorageItem = (key: string) => {
      if (confirm(`Bạn có chắc muốn xóa ${key} không? Thao tác này không thể hoàn tác.`)) {
          if (key === 'indexeddb:saves') {
              clearAllSaveSlots().then(() => scanStorage().catch(() => {}));
              loadSaveSlots().catch(() => {});
              return;
          }
          localStorage.removeItem(key);
          // Manually update the list by rescanning to ensure state sync
          setTimeout(() => {
              scanStorage().catch(() => {});
          }, 50); 
      }
  };

  const clearCache = () => {
      if (!confirm("Bạn có chắc muốn xóa bộ nhớ đệm (cache) không? Việc này sẽ xóa dữ liệu tạm thời ngoại trừ file lưu và cài đặt.")) return;
      const keysToRemove: string[] = [];
      for(let i=0; i<localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          const isSave = key.includes('save_auto') || key.includes('save_manual');
          const isSettings = key === 'danmachi_settings';
          if ((key.startsWith('danmachi_') || key.startsWith('phantom_')) && !isSave && !isSettings) {
              keysToRemove.push(key);
          }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      setTimeout(() => {
          scanStorage().catch(() => {});
      }, 50);
  };

  const clearSaves = () => {
      if (!confirm("Bạn có chắc muốn xóa TẤT CẢ các file lưu không? Thao tác này không thể hoàn tác.")) return;
      clearAllSaveSlots().then(() => {
          setTimeout(() => {
              loadSaveSlots().catch(() => {});
              scanStorage().catch(() => {});
          }, 50);
      });
  };

  const restoreDefaultPrompts = () => {
      if (!confirm("Xác nhận khôi phục Prompt mặc định? Việc này sẽ ghi đè cấu hình mô-đun Prompt hiện tại.")) return;
      const next = { ...formData, promptModules: cloneDefaultPrompts() };
      setFormData(next);
      onSaveSettings(next);
      alert("Prompt đã được khôi phục về cấu hình mặc định.");
  };

  const restoreDefaultSettings = () => {
      if (!confirm("Xác nhận khôi phục cài đặt mặc định? Việc này sẽ đặt lại giao diện và cấu hình ngữ cảnh.")) return;
      const preservedApi = formData.apiProtectionEnabled ? formData.aiConfig : null;
      const next = preservedApi ? buildSettingsWithApi(preservedApi) : buildSettingsWithApi(null);
      setFormData(next);
      onSaveSettings(next);
      alert("Cài đặt đã được khôi phục về cấu hình mặc định.");
  };

  const factoryReset = () => {
      if (confirm("⚠️ CẢNH BÁO: KHÔI PHỤC CÀI ĐẶT GỐC\n\nThao tác này sẽ xóa TẤT CẢ file lưu, cài đặt và dữ liệu cache. Trò chơi sẽ được reset về trạng thái ban đầu.\n\nBạn có chắc chắn muốn tiếp tục?")) {
          const keepApi = !!formData.apiProtectionEnabled;
          const preservedApi = keepApi ? formData.aiConfig : null;
          // Clear only game related keys
          const keysToRemove = [];
          for(let i=0; i<localStorage.length; i++) {
              const key = localStorage.key(i);
              if(key && (key.startsWith('danmachi_') || key.startsWith('phantom_'))) {
                  keysToRemove.push(key);
              }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
          if (keepApi && preservedApi) {
              const next = buildSettingsWithApi(preservedApi);
              localStorage.setItem('danmachi_settings', JSON.stringify(next));
          }
          clearAllSaveSlots().finally(() => {
              alert("Dữ liệu đã được xóa. Trang sẽ tự động tải lại.");
              window.location.reload();
          });
      }
  };

  // --- View Renderers ---

  const renderMainMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pb-20">
        <MenuButton 
            icon={<Cpu />} 
            label="Cài đặt API" 
            subLabel="Kết nối API / Chọn Model"
            onClick={() => setCurrentView('AI_SERVICES')} 
            color="border-purple-600 hover:bg-purple-600 hover:text-white text-black"
        />
        <MenuButton 
            icon={<User />} 
            label="Cài đặt Prompt" 
            subLabel="Nhân vật / Thế giới / Quy tắc"
            onClick={() => setCurrentView('PROMPTS')} 
            color="border-blue-500 hover:bg-blue-500 hover:text-white text-black"
        />
        <MenuButton 
            icon={<LayoutList />} 
            label="Lắp ráp Ngữ cảnh" 
            subLabel="Điều chỉnh cấu trúc / Quy tắc xã hội"
            onClick={() => setCurrentView('AI_CONTEXT')} 
            color="border-indigo-600 hover:bg-indigo-600 hover:text-white text-black"
        />
        <MenuButton 
            icon={<FileJson />} 
            label="Cấu trúc Dữ liệu Thực" 
            subLabel="LIVE STATE INSPECTOR"
            onClick={() => setCurrentView('SCHEMA')} 
            color="border-cyan-600 hover:bg-cyan-600 hover:text-white text-black"
        />
        <MenuButton 
            icon={<Database />} 
            label="Thư viện" 
            subLabel="Địa điểm / Cấp độ / Nội dung"
            onClick={() => setCurrentView('LIBRARY')} 
            color="border-emerald-600 hover:bg-emerald-600 hover:text-white text-black"
        />
        <MenuButton 
            icon={<Database />} 
            label="Quản lý Biến" 
            subLabel="Chế độ God / Debug dữ liệu"
            onClick={() => setCurrentView('VARIABLES')} 
            color="border-green-500 hover:bg-green-500 hover:text-white text-black"
        />
        <MenuButton 
            icon={<History />} 
            label="Cấu hình Bộ nhớ" 
            subLabel="Dung lượng / Giới hạn"
            onClick={() => setCurrentView('MEMORY')} 
            color="border-orange-500 hover:bg-orange-500 hover:text-white text-black"
        />
        <MenuButton 
            icon={<Eye />} 
            label="Hình ảnh & Tương tác" 
            subLabel="Avatar / Nền / Tùy chọn"
            onClick={() => setCurrentView('VISUALS')} 
            color="border-yellow-500 hover:bg-yellow-500 hover:text-black text-black"
        />
        <MenuButton 
            icon={<List />} 
            label="Luồng Đối thoại Đầy đủ" 
            subLabel="Xem toàn bộ nội dung tương tác"
            onClick={() => setCurrentView('FULL_LOGS')} 
            color="border-slate-600 hover:bg-slate-800 hover:text-white text-black"
        />
        <MenuButton 
            icon={<HardDrive />} 
            label="Quản lý Lưu trữ" 
            subLabel="Lưu / Tải / Xuất"
            onClick={() => setCurrentView('DATA')} 
            color="border-zinc-500 hover:bg-zinc-800 hover:text-white text-black"
        />
        <MenuButton 
            icon={<Server />} 
            label="Bảo trì Bộ nhớ" 
            subLabel="Xóa Cache / Đặt lại dữ liệu"
            onClick={() => setCurrentView('STORAGE')} 
            color="border-red-500 hover:bg-red-600 hover:text-white text-black"
        />
        <MenuButton 
            icon={<LogOut />} 
            label="Về Tiêu đề" 
            subLabel="Thoát ra Menu Chính"
            onClick={() => {
                if (confirm("Về tiêu đề sẽ kết thúc tiến trình game hiện tại, các nội dung chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?")) {
                    onExitGame();
                }
            }} 
            color="border-black hover:bg-black hover:text-white text-black"
        />
        <div className="col-span-full mt-4 md:mt-8 flex justify-end pb-4">
            <button 
                onClick={handleGlobalSave}
                disabled={saveStatus === 'SAVED'}
                className={`w-full md:w-auto px-10 py-3 font-display text-xl md:text-2xl uppercase tracking-widest transition-all shadow-[5px_5px_0_#000] flex items-center justify-center gap-3
                    ${saveStatus === 'SAVED' ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-red-600 hover:text-white'}
                `}
            >
                {saveStatus === 'SAVED' ? ( <><Check /> Đã lưu</> ) : ( "Xác nhận & Đóng" )}
            </button>
        </div>
    </div>
  );

  const renderStorageView = () => (
      <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
          <SectionHeader title="Bảo trì Bộ nhớ" icon={<Server />} />
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-zinc-100 space-y-6">
              <div className="bg-white border border-zinc-300 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-200 pb-2">
                      <div className="flex items-center gap-2">
                          <Activity className="text-zinc-500" size={20} />
                          <h4 className="font-bold text-sm uppercase text-zinc-700">Tổng quan Lưu trữ & Ngữ cảnh</h4>
                      </div>
                      <button
                          onClick={() => { scanStorage().catch(() => {}); refreshContextStats(); }}
                          className="text-xs font-mono text-blue-600 hover:text-blue-800"
                      >
                          Làm mới
                      </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-zinc-600">
                      <div className="bg-zinc-50 border border-zinc-200 p-3">
                          <div className="text-[10px] uppercase text-zinc-400">Tổng cộng</div>
                          <div className="text-sm font-bold text-zinc-800">{formatBytes(storageSummary.total)}</div>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-200 p-3">
                          <div className="text-[10px] uppercase text-zinc-400">File lưu</div>
                          <div className="text-sm font-bold text-zinc-800">{formatBytes(storageSummary.saves)}</div>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-200 p-3">
                          <div className="text-[10px] uppercase text-zinc-400">Cài đặt</div>
                          <div className="text-sm font-bold text-zinc-800">{formatBytes(storageSummary.settings)}</div>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-200 p-3">
                          <div className="text-[10px] uppercase text-zinc-400">Cache</div>
                          <div className="text-sm font-bold text-zinc-800">{formatBytes(storageSummary.cache)}</div>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-200 p-3">
                          <div className="text-[10px] uppercase text-zinc-400">Cài đặt API</div>
                          <div className="text-sm font-bold text-zinc-800">{formatBytes(storageSummary.api)}</div>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-200 p-3">
                          <div className="text-[10px] uppercase text-zinc-400">Ước tính Ngữ cảnh</div>
                          <div className="text-sm font-bold text-zinc-800">{contextStats.tokens} tokens</div>
                          <div className="text-[10px] text-zinc-400">{formatBytes(contextStats.bytes)} · {contextStats.chars} ký tự</div>
                      </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
                      <div className="flex items-center gap-2 text-zinc-600 text-xs">
                          <Shield size={16} className="text-emerald-600" />
                          <span className="font-bold">Bảo vệ API</span>
                          <span className="text-[10px] text-zinc-400">Bật để giữ lại cài đặt API khi xóa toàn bộ dữ liệu</span>
                      </div>
                      <button
                          onClick={() => setFormData(prev => ({ ...prev, apiProtectionEnabled: !prev.apiProtectionEnabled }))}
                          className={`text-2xl transition-colors ${formData.apiProtectionEnabled ? 'text-green-600' : 'text-zinc-300'}`}
                      >
                          {formData.apiProtectionEnabled ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
                      </button>
                  </div>
              </div>

              <div className="bg-white border border-zinc-300 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-200 pb-2">
                      <Folder className="text-zinc-500" size={20} />
                      <h4 className="font-bold text-sm uppercase text-zinc-700">Bảo trì Nhanh</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <button onClick={clearCache} className="py-2 px-3 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 font-bold uppercase tracking-widest">Xóa Cache</button>
                      <button onClick={clearSaves} className="py-2 px-3 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 font-bold uppercase tracking-widest">Xóa File lưu</button>
                      <button onClick={restoreDefaultPrompts} className="py-2 px-3 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 font-bold uppercase tracking-widest">Khôi phục Prompt mặc định</button>
                      <button onClick={restoreDefaultSettings} className="py-2 px-3 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 font-bold uppercase tracking-widest">Khôi phục Cài đặt mặc định</button>
                  </div>
              </div>
              <div className="bg-white border border-zinc-300 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-200 pb-2">
                      <div className="flex items-center gap-2">
                          <Database className="text-zinc-500" size={20} />
                          <h4 className="font-bold text-sm uppercase text-zinc-700">Trình khám phá Dữ liệu Cục bộ</h4>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">Tổng mục: {storageItems.length}</span>
                  </div>
                  {storageItems.length > 0 ? (
                      <div className="space-y-2">
                          {storageItems.map((item) => (
                              <div key={item.key} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 hover:border-blue-400 transition-colors group">
                                  <div className="flex flex-col min-w-0 flex-1 mr-4">
                                      <span className="font-bold text-xs truncate text-zinc-800" title={item.key}>{item.label}</span>
                                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                          <span className="font-mono bg-zinc-200 px-1 rounded">{item.type}</span>
                                          <span>{formatBytes(item.size)}</span>
                                      </div>
                                      {item.details && item.details.length > 0 && (
                                          <div className="text-[10px] text-zinc-500 mt-1">{item.details.join(' | ')}</div>
                                      )}
                                  </div>
                                  <button onClick={() => deleteStorageItem(item.key)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa"><Trash2 size={16} /></button>
                              </div>
                          ))}
                      </div>
                  ) : <div className="text-center py-8 text-zinc-400 italic text-sm">Bộ nhớ cục bộ trống</div>}
              </div>
              <div className="bg-red-50 border border-red-200 p-6">
                  <h4 className="font-bold text-red-700 uppercase flex items-center gap-2 mb-4"><AlertTriangle size={20} /> Vùng Nguy hiểm (Danger Zone)</h4>
                  <p className="text-xs text-red-600/80 mb-4 leading-relaxed">Thực hiện khôi phục cài đặt gốc sẽ xóa hoàn toàn mọi dữ liệu trò chơi được lưu trong trình duyệt, bao gồm tiến trình, cài đặt và nội dung tùy chỉnh. Thao tác không thể đảo ngược. Nếu bật "Bảo vệ API", cài đặt API sẽ được giữ lại.</p>
                  <button onClick={factoryReset} className="w-full py-3 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 shadow-md flex items-center justify-center gap-2"><RefreshCw size={18} /> Xóa toàn bộ dữ liệu (Khôi phục gốc)</button>
              </div>
          </div>
      </div>
  );

  const renderSchemaView = () => (
      <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
          <SectionHeader title="Tham khảo Cấu trúc Dữ liệu" icon={<FileJson />} />
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 bg-zinc-100">
              {GAME_SCHEMA_DOCS.map((doc, index) => (
                  <div key={index} className="bg-white border border-zinc-300 shadow-sm overflow-hidden group">
                      <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex justify-between items-center">
                          <h3 className="font-bold text-sm text-zinc-800 uppercase">{doc.title}</h3>
                          <code className="hidden md:block text-xs bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded font-mono">{doc.path}</code>
                      </div>
                      <div className="p-4">
                          <p className="text-xs text-zinc-500 mb-3 italic border-l-2 border-cyan-500 pl-2">{doc.desc}</p>
                          <div className="bg-zinc-900 p-3 overflow-x-auto"><pre className="text-[10px] font-mono text-green-400 leading-relaxed">{JSON.stringify(doc.structure, null, 2)}{/* @ts-ignore */}{doc.itemStructure && `\n\n[Cấu trúc phần tử mảng]:\n${JSON.stringify(doc.itemStructure, null, 2)}`}</pre></div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderPromptsView = () => {
      // Group modules
      const groups: Record<string, PromptModule[]> = {};
      formData.promptModules.forEach(m => {
          if (!groups[m.group]) groups[m.group] = [];
          groups[m.group].push(m);
      });

      const handleAddModule = () => {
          const newId = `custom_${Date.now()}`;
          const newModule: PromptModule = {
              id: newId,
              name: 'Mô-đun mới (New)',
              group: 'Tùy chỉnh',
              usage: 'CORE',
              isActive: true,
              content: 'Vui lòng nhập nội dung Prompt...',
              order: 100
          };
          setFormData({ ...formData, promptModules: [...formData.promptModules, newModule] });
          setActivePromptModuleId(newId);
      };

      const handleDeleteModule = (id: string) => {
          if (confirm("Bạn có chắc muốn xóa mô-đun này không?")) {
              const newModules = formData.promptModules.filter(m => m.id !== id);
              setFormData({ ...formData, promptModules: newModules });
              if (activePromptModuleId === id) setActivePromptModuleId(null);
          }
      };

      return (
          <div className="flex flex-col md:flex-row h-full animate-in slide-in-from-right-8 duration-300 overflow-hidden">
              {/* Sidebar List */}
              <div className="w-full md:w-1/3 border-r border-zinc-300 bg-white overflow-y-auto custom-scrollbar flex flex-col">
                  <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                      <h4 className="font-bold uppercase text-zinc-600 flex items-center gap-2">
                          <User size={16} /> Mô-đun Prompt
                      </h4>
                      <div className="flex items-center gap-2">
                          <button onClick={handleExportPrompts} className="p-1 hover:bg-zinc-200 rounded text-zinc-600" title="Xuất Prompt"><FileDown size={16}/></button>
                          <button onClick={() => promptFileInputRef.current?.click()} className="p-1 hover:bg-zinc-200 rounded text-zinc-600" title="Nhập Prompt"><FileUp size={16}/></button>
                          <button onClick={handleAddModule} className="p-1 hover:bg-zinc-200 rounded text-blue-600" title="Thêm mô-đun"><Plus size={18}/></button>
                      </div>
                  </div>
                  <input type="file" ref={promptFileInputRef} className="hidden" accept=".json" onChange={handleImportPrompts} />
                  <div className="flex-1 p-2 space-y-4">
                      {Object.entries(groups).map(([groupName, mods]) => (
                          <div key={groupName} className="space-y-1">
                              <div className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{groupName}</div>
                              {mods.sort((a,b) => a.order - b.order).map(mod => (
                                  <div 
                                      key={mod.id}
                                      onClick={() => setActivePromptModuleId(mod.id)}
                                      className={`p-3 border rounded cursor-pointer transition-all flex justify-between items-center group
                                          ${activePromptModuleId === mod.id 
                                              ? 'bg-blue-50 border-blue-500 shadow-sm' 
                                              : 'bg-white border-zinc-200 hover:border-blue-300'
                                          }
                                      `}
                                  >
                                      <div>
                                          <div className={`font-bold text-xs ${activePromptModuleId === mod.id ? 'text-blue-700' : 'text-zinc-700'}`}>{mod.name}</div>
                                          <div className="text-[10px] text-zinc-400 font-mono">{mod.usage}</div>
                                      </div>
                                      <button 
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              const newModules = formData.promptModules.map(m => 
                                                  m.id === mod.id ? { ...m, isActive: !m.isActive } : m
                                              );
                                              setFormData({ ...formData, promptModules: newModules });
                                          }}
                                          className={`${mod.isActive ? 'text-green-600' : 'text-zinc-300 hover:text-zinc-500'}`}
                                      >
                                          {mod.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                      </button>
                                  </div>
                              ))}
                          </div>
                      ))}
                  </div>
              </div>

              {/* Editor Area */}
              <div className="flex-1 bg-zinc-50 flex flex-col h-full overflow-hidden">
                  {activePromptModuleId ? (() => {
                      const activeMod = formData.promptModules.find(m => m.id === activePromptModuleId);
                      if (!activeMod) return null;
                      
                      const updateField = (key: keyof PromptModule, val: any) => {
                          const newModules = formData.promptModules.map(m => 
                              m.id === activeMod.id ? { ...m, [key]: val } : m
                          );
                          setFormData({ ...formData, promptModules: newModules });
                      };

                      return (
                          <>
                              {/* Metadata Editor */}
                              <div className="p-4 border-b border-zinc-200 bg-white shadow-sm z-10 space-y-3">
                                  <div className="flex justify-between items-center">
                                      <span className="text-xs text-zinc-500 font-mono">ID: {activeMod.id}</span>
                                      <button onClick={() => handleDeleteModule(activeMod.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Tên (Name)</label>
                                          <input 
                                              type="text" 
                                              value={activeMod.name}
                                              onChange={(e) => updateField('name', e.target.value)}
                                              className="w-full border-b border-zinc-300 text-sm font-bold bg-transparent outline-none focus:border-blue-500"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Nhóm (Group)</label>
                                          <input 
                                              type="text" 
                                              value={activeMod.group}
                                              onChange={(e) => updateField('group', e.target.value)}
                                              className="w-full border-b border-zinc-300 text-sm font-bold bg-transparent outline-none focus:border-blue-500"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Thứ tự (Order)</label>
                                          <input 
                                              type="number" 
                                              value={activeMod.order}
                                              onChange={(e) => updateField('order', parseInt(e.target.value))}
                                              className="w-full border-b border-zinc-300 text-sm font-bold bg-transparent outline-none focus:border-blue-500"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Cách dùng (Usage)</label>
                                          <select 
                                              value={activeMod.usage} 
                                              onChange={(e) => updateField('usage', e.target.value as PromptUsage)}
                                              className="w-full border-b border-zinc-300 text-sm bg-transparent outline-none"
                                          >
                                              <option value="CORE">CORE</option>
                                              <option value="START">START</option>
                                              <option value="MEMORY_S2M">MEMORY_S2M</option>
                                              <option value="MEMORY_M2L">MEMORY_M2L</option>
                                          </select>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex-1 relative">
                                  <textarea 
                                      className="w-full h-full p-4 bg-zinc-900 text-green-400 font-mono text-xs outline-none resize-none custom-scrollbar leading-relaxed"
                                      value={activeMod.content}
                                      onChange={(e) => updateField('content', e.target.value)}
                                      spellCheck={false}
                                  />
                              </div>
                          </>
                      );
                  })() : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                          <Edit2 size={48} className="mb-4 opacity-20" />
                          <p className="text-sm font-bold uppercase">Vui lòng chọn một mô-đun để chỉnh sửa</p>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderMemoryView = () => (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 overflow-y-auto custom-scrollbar p-1">
          <SectionHeader title="Cấu hình Bộ nhớ" icon={<History />} />
          <div className="bg-white p-6 border border-zinc-200 shadow-sm space-y-6">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-sm text-blue-800">
                  Lưu ý: Prompt cho chức năng bộ nhớ đã được chuyển thống nhất về phần quản lý 「Cài đặt Prompt」.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                       <label className="block text-xs font-bold uppercase mb-2 text-red-600">Dung lượng Bộ nhớ Tức thời (Instant Limit)</label>
                       <div className="flex items-center gap-4">
                           <input type="range" min="4" max="50" value={formData.memoryConfig?.instantLimit || 10} onChange={(e) => setFormData({...formData, memoryConfig: { ...formData.memoryConfig, instantLimit: parseInt(e.target.value) }})} className="flex-1" />
                           <span className="font-mono font-bold text-lg">{formData.memoryConfig?.instantLimit || 10}</span>
                       </div>
                  </div>
                  <div><label className="block text-xs font-bold uppercase mb-2 text-zinc-500">Giới hạn Bộ nhớ Ngắn hạn</label><input type="number" min="0" max="50" value={formData.memoryConfig?.shortTermLimit || 10} onChange={(e) => setFormData({...formData, memoryConfig: { ...formData.memoryConfig, shortTermLimit: parseInt(e.target.value) || 10 }})} className="w-full bg-zinc-50 border-b-2 border-zinc-300 p-2 font-mono text-sm" /></div>
                  <div><label className="block text-xs font-bold uppercase mb-2 text-zinc-500">Giới hạn Bộ nhớ Trung hạn</label><input type="number" min="0" max="20" value={formData.memoryConfig?.mediumTermLimit || 5} onChange={(e) => setFormData({...formData, memoryConfig: { ...formData.memoryConfig, mediumTermLimit: parseInt(e.target.value) || 5 }})} className="w-full bg-zinc-50 border-b-2 border-zinc-300 p-2 font-mono text-sm" /></div>
              </div>
          </div>
      </div>
  );

  const renderDataView = () => (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 overflow-y-auto custom-scrollbar pb-10">
        <SectionHeader title="Quản lý Lưu trữ" icon={<HardDrive />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                 <h4 className="font-bold text-sm uppercase text-zinc-500 border-b border-zinc-300 pb-1 mb-2">Lưu tự động (Auto Save)</h4>
                 {autoSlots.length > 0 ? autoSlots.map(slot => (
                     <div key={slot.id} className="flex items-center gap-2 bg-zinc-50 border border-zinc-300 p-3 text-xs opacity-80 hover:opacity-100 hover:border-blue-500 transition-all">
                         <Clock size={16} className="text-zinc-400" />
                         <div className="flex-1 min-w-0"><div className="font-bold truncate">{slot.summary}</div><div className="text-zinc-400">{new Date(slot.timestamp).toLocaleString()}</div></div>
                         <button onClick={() => { onLoadGame(slot.id); onClose(); }} className="text-blue-600 hover:underline font-bold">Tải</button>
                     </div>
                 )) : <div className="text-zinc-400 text-xs italic">Chưa có file lưu tự động</div>}
            </div>
            <div className="space-y-2">
                 <h4 className="font-bold text-sm uppercase text-zinc-500 border-b border-zinc-300 pb-1 mb-2">Lưu thủ công (Manual Save)</h4>
                 {[1, 2, 3].map(id => {
                     const slot = saveSlots.find(s => s.id === id);
                     return (
                         <div key={id} className="flex items-center gap-2 bg-white border border-zinc-300 p-4 shadow-sm hover:border-black transition-colors">
                             <div className="font-display text-xl w-8 text-zinc-400">{id}</div>
                             <div className="flex-1 min-w-0">{slot ? ( <><div className="font-bold text-sm truncate">{slot.summary}</div><div className="text-xs text-zinc-400">{new Date(slot.timestamp).toLocaleString()}</div></> ) : ( <div className="text-zinc-300 italic">Slot trống</div> )}</div>
                             <button onClick={async () => { await Promise.resolve(onSaveGame(id)); await loadSaveSlots(); }} className="bg-black text-white px-3 py-1 text-xs font-bold uppercase hover:bg-green-600">Lưu</button>
                             {slot && ( <button onClick={() => { onLoadGame(id); onClose(); }} className="bg-white border border-black text-black px-3 py-1 text-xs font-bold uppercase hover:bg-blue-600 hover:text-white">Tải</button> )}
                         </div>
                     );
                 })}
            </div>
        </div>
        <div className="mt-8 border-t border-zinc-200 pt-6">
            <h4 className="font-bold text-sm uppercase text-zinc-500 border-b border-zinc-300 pb-1 mb-4 flex items-center gap-2"><Database size={16} /> Sao lưu & Di chuyển</h4>
            <div className="flex gap-4">
                <button onClick={handleExportSave} className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-400 hover:border-black hover:bg-zinc-50 transition-all group"><FileDown size={32} className="mb-2 text-zinc-400 group-hover:text-black" /><span className="font-bold uppercase text-sm">Xuất File lưu hiện tại</span><span className="text-[10px] text-zinc-400">Tải xuống .zip</span></button>
                <div onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-400 hover:border-blue-600 hover:bg-blue-50 transition-all group cursor-pointer"><FileUp size={32} className="mb-2 text-zinc-400 group-hover:text-blue-600" /><span className="font-bold uppercase text-sm group-hover:text-blue-600">Nhập File lưu</span><span className="text-[10px] text-zinc-400">Đọc file .zip / .json</span><input type="file" ref={fileInputRef} className="hidden" accept=".zip,.json" onChange={handleImportSave}/></div>
            </div>
        </div>
    </div>
  );

  const renderVariablesView = () => (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 h-full flex flex-col">
            <SectionHeader title="Debug Biến" icon={<Database />} />
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <P5Dropdown label="Chọn Mô-đun Dữ liệu" options={[{ label: 'Nhân vật (Character)', value: '角色' }, { label: 'Ba lô (Inventory)', value: '背包' }, { label: 'Thế giới (World)', value: '世界' }, { label: 'Xã hội (Social)', value: '社交' }, { label: 'Nhiệm vụ (Tasks)', value: '任务' }, { label: 'Cốt truyện (Story)', value: '剧情' }, { label: 'Quyến tộc (Familia)', value: '眷族' }, { label: 'Chiến đấu (Combat)', value: '战斗' }, { label: 'Chiến lợi phẩm chung (Public Loot)', value: '公共战利品' }, { label: 'Bộ nhớ (Memory)', value: '记忆' }, { label: 'Bản đồ (Map)', value: '地图' }]} value={variableCategory} onChange={(val) => setVariableCategory(val)} className="w-full md:w-64" />
                <div className="flex-1 flex items-end justify-end"><button onClick={() => { try { const parsed = JSON.parse(jsonEditText); onUpdateGameState({ ...gameState, [variableCategory]: parsed }); setJsonError(null); alert("Biến đã được cập nhật"); } catch (e: any) { setJsonError(e.message); } }} className="w-full md:w-auto bg-red-600 text-white px-6 py-3 font-bold uppercase hover:bg-red-50 shadow-[4px_4px_0_#000]"><Save className="inline mr-2" size={18} /> Áp dụng thay đổi</button></div>
            </div>
            <div className="flex-1 border-2 border-black bg-zinc-900 relative"><textarea value={jsonEditText} onChange={(e) => setJsonEditText(e.target.value)} className="w-full h-full bg-zinc-900 text-green-500 font-mono text-xs p-4 outline-none resize-none custom-scrollbar" spellCheck="false" />{jsonError && <div className="absolute bottom-0 left-0 w-full bg-red-900/90 text-white p-2 text-xs font-mono">LỖI: {jsonError}</div>}</div>
        </div>
  );

  const renderVisualsView = () => (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 overflow-y-auto custom-scrollbar">
          <SectionHeader title="Hình ảnh & Tương tác" icon={<Eye />} />
          {(() => {
              const isUnlimited = formData.chatLogLimit === null;
              return (
                  <div className="bg-white p-6 border border-zinc-200 shadow-sm mb-4">
                      <h4 className="font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2">
                          <LayoutList size={16} /> Hiển thị Nhật ký Chat
                      </h4>
                      <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 mb-3">
                          <div>
                              <h5 className="font-bold text-sm text-black">Giới hạn số dòng hiển thị</h5>
                              <p className="text-[10px] text-zinc-500">Mặc định chỉ hiển thị 30 dòng chat cuối cùng, có thể chuyển sang không giới hạn.</p>
                          </div>
                          <button 
                              onClick={() => setFormData(prev => ({...prev, chatLogLimit: isUnlimited ? 30 : null}))}
                              className={`text-2xl transition-colors ${isUnlimited ? 'text-zinc-300' : 'text-green-600'}`}
                          >
                              {isUnlimited ? <ToggleLeft size={36}/> : <ToggleRight size={36}/>}
                          </button>
                      </div>
                      <div className="flex items-center gap-4">
                          <input 
                              type="number"
                              min="1"
                              max="500"
                              disabled={isUnlimited}
                              value={isUnlimited ? '' : (formData.chatLogLimit ?? 30)}
                              onChange={(e) => setFormData({...formData, chatLogLimit: parseInt(e.target.value) || 30})}
                              className="w-32 bg-zinc-50 border-b-2 border-zinc-300 p-2 font-mono text-sm disabled:opacity-50"
                          />
                          <span className="text-xs text-zinc-500">dòng / Đặt là không giới hạn để xem toàn bộ lịch sử</span>
                      </div>
                  </div>
              );
          })()}
          
          {/* AI Streaming Toggle (New) */}
          <div className="bg-white p-6 border border-zinc-200 shadow-sm mb-4">
              <h4 className="font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2">
                  <Activity size={16} /> Truyền luồng tin nhắn (Streaming)
              </h4>
              <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200">
                  <div>
                      <h5 className="font-bold text-sm text-black">Bật hiệu ứng máy đánh chữ</h5>
                      <p className="text-[10px] text-zinc-500">Khi bật, phản hồi của AI sẽ hiển thị theo thời gian thực. Tắt đi sẽ đợi tạo xong mới hiện.</p>
                  </div>
                  <button 
                      onClick={() => setFormData(prev => ({...prev, enableStreaming: !prev.enableStreaming}))}
                      className={`text-2xl transition-colors ${formData.enableStreaming ? 'text-purple-600' : 'text-zinc-300'}`}
                  >
                      {formData.enableStreaming ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>}
                  </button>
              </div>
          </div>

          {/* Combat UI Toggle */}
          <div className="bg-white p-6 border border-zinc-200 shadow-sm mb-4">
              <h4 className="font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2">
                  <Sword size={16} /> Cài đặt UI Chiến đấu
              </h4>
              <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200">
                  <div>
                      <h5 className="font-bold text-sm text-black">Bật giao diện chiến đấu đồ họa</h5>
                      <p className="text-[10px] text-zinc-500">Khi bật, bảng trạng thái và nút hành động trực quan sẽ hiện ra khi gặp trận chiến.</p>
                  </div>
                  <button 
                      onClick={() => setFormData(prev => ({...prev, enableCombatUI: !prev.enableCombatUI}))}
                      className={`text-2xl transition-colors ${formData.enableCombatUI ? 'text-green-600' : 'text-zinc-300'}`}
                  >
                      {formData.enableCombatUI ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>}
                  </button>
              </div>
          </div>

          {/* Action Options Toggle */}
          <div className="bg-white p-6 border border-zinc-200 shadow-sm mb-4">
              <h4 className="font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2">
                  <MousePointer2 size={16} /> Gợi ý Hành động Thông minh
              </h4>
              <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200">
                  <div>
                      <h5 className="font-bold text-sm text-black">Bật gợi ý tùy chọn hành động</h5>
                      <p className="text-[10px] text-zinc-500">
                          Khi bật, AI sẽ cung cấp 3-5 gợi ý hành động cụ thể ở cuối mỗi câu trả lời.
                      </p>
                  </div>
                  <button 
                      onClick={() => setFormData(prev => ({...prev, enableActionOptions: !prev.enableActionOptions}))}
                      className={`text-2xl transition-colors ${formData.enableActionOptions ? 'text-blue-600' : 'text-zinc-300'}`}
                  >
                      {formData.enableActionOptions ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>}
                  </button>
              </div>
          </div>

          {/* Font Size */}
          <div className="bg-white p-6 border border-zinc-200 shadow-sm mb-4">
              <h4 className="font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2">
                  <Type size={16} /> Cài đặt Phông chữ (Font Size)
              </h4>
              <div className="flex gap-4">
                  {['small', 'medium', 'large'].map((size) => (
                      <button
                          key={size}
                          onClick={() => setFormData(prev => ({...prev, fontSize: size as any}))}
                          className={`flex-1 py-3 border-2 font-display uppercase tracking-widest transition-all
                              ${formData.fontSize === size 
                                  ? 'bg-black text-white border-black shadow-[4px_4px_0_rgba(255,0,0,0.5)]' 
                                  : 'bg-white text-zinc-400 border-zinc-200 hover:border-black hover:text-black'
                              }
                          `}
                      >
                          {size}
                      </button>
                  ))}
              </div>
          </div>

          {/* 字数要求设置 */}
          <div className="bg-white p-6 border border-zinc-200 shadow-sm mb-4">
              <h4 className="font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2">
                  <Type size={16} /> Yêu cầu Số lượng từ (Word Count Requirement)
              </h4>
              <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200">
                  <div>
                      <h5 className="font-bold text-sm text-black">Bật yêu cầu số lượng từ</h5>
                      <p className="text-[10px] text-zinc-500">Khi bật, AI sẽ kiểm tra độ dài log sau khi người chơi nhập, nếu thiếu sẽ nhắc bổ sung.</p>
                  </div>
                  <button
                      onClick={() => setFormData(prev => ({
                          ...prev,
                          writingConfig: {
                              ...prev.writingConfig,
                              enableWordCountRequirement: !prev.writingConfig.enableWordCountRequirement
                          }
                      }))}
                      className={`text-2xl transition-colors ${formData.writingConfig.enableWordCountRequirement ? 'text-green-600' : 'text-zinc-300'}`}
                  >
                      {formData.writingConfig.enableWordCountRequirement ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>}
                  </button>
              </div>
              <div className="flex items-center gap-4 mt-4">
                  <input
                      type="number"
                      min="1"
                      max="5000"
                      disabled={!formData.writingConfig.enableWordCountRequirement}
                      value={formData.writingConfig.requiredWordCount ?? 800}
                      onChange={(e) => setFormData(prev => ({
                          ...prev,
                          writingConfig: {
                              ...prev.writingConfig,
                              requiredWordCount: parseInt(e.target.value) || 800
                          }
                      }))}
                      className="w-32 bg-zinc-50 border-b-2 border-zinc-300 p-2 font-mono text-sm disabled:opacity-50"
                  />
                  <span className="text-xs text-zinc-500">từ (Mặc định 800)</span>
              </div>
          </div>

          {/* 额外要求提示词设置 */}
          <div className="bg-white p-6 border border-zinc-200 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold uppercase text-zinc-500 flex items-center gap-2">
                      <Edit2 size={16} /> Prompt Yêu cầu Bổ sung (Extra Requirement)
                  </h4>
                  <button
                      onClick={() => setFormData(prev => ({
                          ...prev,
                          writingConfig: {
                              ...prev.writingConfig,
                              extraRequirementPrompt: DEFAULT_SETTINGS.writingConfig.extraRequirementPrompt
                          }
                      }))}
                      className="px-3 py-1 border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-wider"
                  >
                      Khôi phục Mặc định
                  </button>
              </div>
              <div className="p-4 bg-zinc-50 border border-zinc-200">
                  <p className="text-[10px] text-zinc-500 mb-3">
                      Nội dung này sẽ được chèn vào sau phần 「[Đầu vào của người chơi]」 trong ngữ cảnh. Để trống nếu không muốn thêm nội dung cụ thể.
                  </p>
                  <textarea
                      value={formData.writingConfig.extraRequirementPrompt ?? ''}
                      onChange={(e) => setFormData(prev => ({
                          ...prev,
                          writingConfig: {
                              ...prev.writingConfig,
                              extraRequirementPrompt: e.target.value
                          }
                      }))}
                      placeholder="Điền Prompt yêu cầu bổ sung tại đây..."
                      className="w-full min-h-28 bg-white border border-zinc-300 p-3 font-mono text-xs leading-relaxed outline-none focus:border-black custom-scrollbar"
                  />
              </div>
          </div>

          {/* 写作人称管理设置 */}
          <div className="bg-white p-6 border border-zinc-200 shadow-sm mb-4">
              <h4 className="font-bold uppercase text-zinc-500 mb-4 flex items-center gap-2">
                  <User size={16} /> Quản lý Góc nhìn Trần thuật (Narrative Perspective)
              </h4>
              <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200">
                  <div>
                      <h5 className="font-bold text-sm text-black">Bật quản lý góc nhìn trần thuật</h5>
                      <p className="text-[10px] text-zinc-500">Khi bật, AI sẽ điều chỉnh phong cách kể chuyện dựa trên chế độ góc nhìn đã chọn (Ngôi thứ nhất/hai/ba).</p>
                  </div>
                  <button
                      onClick={() => setFormData(prev => ({
                          ...prev,
                          writingConfig: {
                              ...prev.writingConfig,
                              enableNarrativePerspective: !prev.writingConfig.enableNarrativePerspective
                          }
                      }))}
                      className={`text-2xl transition-colors ${formData.writingConfig.enableNarrativePerspective ? 'text-green-600' : 'text-zinc-300'}`}
                  >
                      {formData.writingConfig.enableNarrativePerspective ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>}
                  </button>
              </div>
              <div className="flex items-center gap-4 mt-4">
                  <div className="flex gap-4">
                      <button
                          onClick={() => setFormData(prev => ({
                              ...prev,
                              writingConfig: {
                                  ...prev.writingConfig,
                                  narrativePerspective: 'first'
                              }
                          }))}
                          className={`py-2 px-4 border-2 font-display uppercase tracking-widest transition-all
                              ${formData.writingConfig.narrativePerspective === 'first'
                                  ? 'bg-black text-white border-black shadow-[4px_4px_0_rgba(255,0,0,0.5)]'
                                  : 'bg-white text-zinc-400 border-zinc-200 hover:border-black hover:text-black'
                              }
                          `}
                      >
                          Ngôi thứ nhất
                      </button>
                      <button
                          onClick={() => setFormData(prev => ({
                              ...prev,
                              writingConfig: {
                                  ...prev.writingConfig,
                                  narrativePerspective: 'second'
                              }
                          }))}
                          className={`py-2 px-4 border-2 font-display uppercase tracking-widest transition-all
                              ${formData.writingConfig.narrativePerspective === 'second'
                                  ? 'bg-black text-white border-black shadow-[4px_4px_0_rgba(255,0,0,0.5)]'
                                  : 'bg-white text-zinc-400 border-zinc-200 hover:border-black hover:text-black'
                              }
                          `}
                      >
                          Ngôi thứ hai
                      </button>
                      <button
                          onClick={() => setFormData(prev => ({
                              ...prev,
                              writingConfig: {
                                  ...prev.writingConfig,
                                  narrativePerspective: 'third'
                              }
                          }))}
                          className={`py-2 px-4 border-2 font-display uppercase tracking-widest transition-all
                              ${formData.writingConfig.narrativePerspective === 'third'
                                  ? 'bg-black text-white border-black shadow-[4px_4px_0_rgba(255,0,0,0.5)]'
                                  : 'bg-white text-zinc-400 border-zinc-200 hover:border-black hover:text-black'
                              }
                          `}
                      >
                          Ngôi thứ ba
                      </button>
                  </div>
                  <span className="text-xs text-zinc-500">Mặc định ngôi thứ ba</span>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Avatar Upload */}
              <div className="bg-white p-6 border border-zinc-200 shadow-sm flex flex-col items-center">
                  <h4 className="font-bold uppercase text-zinc-500 mb-4">Avatar Người chơi</h4>
                  <div className="w-48 h-48 bg-zinc-100 border-4 border-black mb-4 overflow-hidden relative group">
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white font-bold text-xs uppercase">Đổi Hình ảnh</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'avatar')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                  </div>
              </div>

              {/* Background Upload */}
              <div className="bg-white p-6 border border-zinc-200 shadow-sm flex flex-col items-center">
                  <h4 className="font-bold uppercase text-zinc-500 mb-4">Hình nền Game</h4>
                  <div className="w-full h-48 bg-zinc-900 border-4 border-black mb-4 overflow-hidden relative group">
                      {formData.backgroundImage ? (
                          <img src={formData.backgroundImage} alt="BG" className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs uppercase">Chưa có hình nền tùy chỉnh</div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white font-bold text-xs uppercase">Đổi Hình nền</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'bg')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                  </div>
                  <button 
                    onClick={() => setFormData(prev => ({...prev, backgroundImage: ''}))}
                    className="mt-2 text-red-600 text-xs underline"
                  >
                      Đặt lại Mặc định
                  </button>
              </div>
          </div>
      </div>
  );

  const renderFullLogsView = () => {
      const keyword = logSearch.trim().toLowerCase();
      const visibleLogs = gameState.日志.filter(log => {
          if (!keyword) return true;
          return `${log.sender} ${log.text}`.toLowerCase().includes(keyword);
      });
      return (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 h-full flex flex-col">
              <SectionHeader title="Luồng Đối thoại Đầy đủ" icon={<List />} />
              <div className="px-6 md:px-0">
                  <input
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      placeholder="Tìm kiếm: Tên nhân vật / Từ khóa..."
                      className="w-full md:w-96 bg-white border border-zinc-300 px-3 py-2 text-xs font-mono outline-none focus:border-black"
                  />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-0">
                  <div className="space-y-3">
                      {visibleLogs.length > 0 ? visibleLogs.map((log, idx) => (
                          <div key={log.id || idx} className="bg-white border border-zinc-200 p-4 shadow-sm">
                              <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase font-mono mb-2">
                                  <span>{log.sender || 'Không xác định'}</span>
                                  <span>{log.gameTime || (log.turnIndex !== undefined ? `Lượt ${log.turnIndex}` : 'Không có thời gian')}</span>
                              </div>
                              <div className="text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed">
                                  {log.text}
                              </div>
                          </div>
                      )) : (
                          <div className="text-zinc-400 text-xs italic text-center py-10">Tạm thời chưa có bản ghi</div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  const renderLibraryView = () => {
      const mapData = gameState.地图;
      const macroLocations = mapData?.macroLocations || [];
      const midLocations = mapData?.midLocations || [];
      const smallLocations = mapData?.smallLocations || [];
      const current = mapData?.current;
      const currentMacro = current?.macroId ? macroLocations.find(m => m.id === current.macroId) : undefined;
      const currentMid = current?.midId ? midLocations.find(m => m.id === current.midId) : undefined;
      const currentSmall = current?.smallId ? smallLocations.find(m => m.id === current.smallId) : undefined;
      return (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <SectionHeader title="Thư viện" icon={<Database />} />
              <div className="flex items-center gap-3 px-6 md:px-0">
                  <button
                      onClick={() => setLibraryMode('UI')}
                      className={`px-4 py-2 text-xs font-bold uppercase border-2 transition-all ${libraryMode === 'UI' ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-300 hover:border-black'}`}
                  >
                      Chế độ UI
                  </button>
                  <button
                      onClick={() => setLibraryMode('JSON')}
                      className={`px-4 py-2 text-xs font-bold uppercase border-2 transition-all ${libraryMode === 'JSON' ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-300 hover:border-black'}`}
                  >
                      Cấu trúc Biến
                  </button>
              </div>
              {libraryMode === 'JSON' ? (
                  <div className="bg-white border border-zinc-300 p-4 shadow-sm">
                      <div className="text-xs font-bold uppercase text-zinc-600 mb-2">Cấu trúc biến đầy đủ (Bản đồ)</div>
                      <pre className="text-[10px] text-zinc-800 font-mono bg-zinc-50 border border-zinc-200 p-3 max-h-[70vh] overflow-auto whitespace-pre-wrap">
                          {JSON.stringify({ 地图: mapData }, null, 2)}
                      </pre>
                  </div>
              ) : (
              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white border border-zinc-300 p-4 shadow-sm text-xs">
                          <div className="text-zinc-500 uppercase font-bold">Khu vực lớn</div>
                          <div className="text-2xl font-display text-black">{macroLocations.length}</div>
                      </div>
                      <div className="bg-white border border-zinc-300 p-4 shadow-sm text-xs">
                          <div className="text-zinc-500 uppercase font-bold">Địa điểm vừa</div>
                          <div className="text-2xl font-display text-black">{midLocations.length}</div>
                      </div>
                      <div className="bg-white border border-zinc-300 p-4 shadow-sm text-xs">
                          <div className="text-zinc-500 uppercase font-bold">Địa điểm nhỏ</div>
                          <div className="text-2xl font-display text-black">{smallLocations.length}</div>
                      </div>
                  </div>
                  <div className="bg-white border border-zinc-300 p-4 shadow-sm space-y-2 text-xs text-zinc-700">
                      <div className="font-bold text-zinc-800">Điều kiện chèn Ngữ cảnh</div>
                      <div>• Thông tin địa điểm là thường trực, bao gồm địa điểm hiện tại và phân cấp của nó (Khu vực lớn/Vừa/Nhỏ).</div>
                      <div>• Chỉ duy trì Tên/Thuộc về/Mô tả/Nội dung, không tạo tọa độ hoặc kích thước bản đồ.</div>
                  </div>
                  <div className="bg-white border border-zinc-300 p-4 shadow-sm text-xs">
                      <div className="text-xs font-bold uppercase text-zinc-600 mb-2">Phân cấp Vị trí Hiện tại</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="border border-zinc-200 p-2">
                              <div className="text-[10px] text-zinc-500 uppercase">Khu vực lớn</div>
                              <div className="font-bold text-black">{currentMacro?.名称 || currentMacro?.地点 || 'Chưa chỉ định'}</div>
                          </div>
                          <div className="border border-zinc-200 p-2">
                              <div className="text-[10px] text-zinc-500 uppercase">Địa điểm vừa</div>
                              <div className="font-bold text-black">{currentMid?.名称 || 'Chưa chỉ định'}</div>
                          </div>
                          <div className="border border-zinc-200 p-2">
                              <div className="text-[10px] text-zinc-500 uppercase">Địa điểm nhỏ</div>
                              <div className="font-bold text-black">{currentSmall?.名称 || 'Chưa chỉ định'}</div>
                          </div>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white border border-zinc-300 p-4 shadow-sm text-xs">
                          <div className="text-xs font-bold uppercase text-zinc-600 mb-2">Khu vực lớn</div>
                          <div className="max-h-64 overflow-auto space-y-2">
                              {macroLocations.length === 0 && <div className="text-zinc-400 italic">Không có dữ liệu</div>}
                              {macroLocations.map(item => (
                                  <div key={item.id} className="border border-zinc-200 p-2">
                                      <div className="font-bold text-black">{item.名称 || item.地点}</div>
                                      {item.地点 && <div className="text-[10px] text-zinc-500">Địa điểm: {item.地点}</div>}
                                      {item.内容 && item.内容.length > 0 && (
                                          <div className="text-[10px] text-zinc-500">Nội dung: {item.内容.join(' | ')}</div>
                                      )}
                                      {item.描述 && <div className="text-[10px] text-zinc-600 mt-1">{item.描述}</div>}
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="bg-white border border-zinc-300 p-4 shadow-sm text-xs">
                          <div className="text-xs font-bold uppercase text-zinc-600 mb-2">Địa điểm vừa</div>
                          <div className="max-h-64 overflow-auto space-y-2">
                              {midLocations.length === 0 && <div className="text-zinc-400 italic">Không có dữ liệu</div>}
                              {midLocations.map(item => (
                                  <div key={item.id} className="border border-zinc-200 p-2">
                                      <div className="font-bold text-black">{item.名称}</div>
                                      {item.归属 && <div className="text-[10px] text-zinc-500">Thuộc về: {item.归属}</div>}
                                      {item.内部建筑 && item.内部建筑.length > 0 && (
                                          <div className="text-[10px] text-zinc-500">Kiến trúc nội bộ: {item.内部建筑.join(' | ')}</div>
                                      )}
                                      {item.描述 && <div className="text-[10px] text-zinc-600 mt-1">{item.描述}</div>}
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="bg-white border border-zinc-300 p-4 shadow-sm text-xs">
                          <div className="text-xs font-bold uppercase text-zinc-600 mb-2">Địa điểm nhỏ</div>
                          <div className="max-h-64 overflow-auto space-y-2">
                              {smallLocations.length === 0 && <div className="text-zinc-400 italic">Không có dữ liệu</div>}
                              {smallLocations.map(item => (
                                  <div key={item.id} className="border border-zinc-200 p-2">
                                      <div className="font-bold text-black">{item.名称}</div>
                                      {item.归属 && <div className="text-[10px] text-zinc-500">Thuộc về: {item.归属}</div>}
                                      {item.描述 && <div className="text-[10px] text-zinc-600 mt-1">{item.描述}</div>}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
              )}
          </div>
      );
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-full md:h-[90vh] bg-zinc-100 relative shadow-2xl overflow-hidden flex flex-col md:flex-row md:border-4 md:border-black">
         
         {/* Mobile Header / Desktop Sidebar */}
         <div className="w-full md:w-28 bg-black flex flex-row md:flex-col items-center justify-between md:justify-start px-4 md:px-0 md:py-6 gap-0 md:gap-6 md:border-r-4 border-b-2 md:border-b-0 border-red-600 z-10 shrink-0 h-16 md:h-auto">
            <SettingsIcon className="text-white animate-spin-slow w-6 h-6 md:w-8 md:h-8" />
            <div className="md:hidden text-red-600 font-display text-lg uppercase tracking-widest">Cấu hình Hệ thống</div>
            {currentView !== 'MAIN' && (
                <button onClick={handleBack} className="text-white hover:text-red-500 transition-colors p-2 md:bg-zinc-900 rounded-full md:mb-4">
                    <ArrowLeft size={24} />
                </button>
            )}
            <button onClick={onClose} className="md:hidden text-white"><X size={24}/></button>
            <div className="hidden md:block flex-1 w-px bg-zinc-800" />
            <div className="hidden md:block text-red-600 font-display text-lg uppercase tracking-widest vertical-rl pb-4" style={{ writingMode: 'vertical-rl' }}>Cấu hình Hệ thống</div>
         </div>

         {/* Content Area */}
         <div className="flex-1 flex flex-col relative bg-zinc-100 text-black overflow-hidden h-full">
             <div className="hidden md:flex bg-black text-white p-4 justify-between items-center shadow-lg z-20 shrink-0">
                 <h2 className="text-2xl font-display uppercase tracking-widest truncate">{currentView === 'SCHEMA' ? 'SCHEMA / CONTEXT' : currentView}</h2>
                 <button onClick={onClose} className="hover:text-red-600 transition-colors"><X size={28} /></button>
             </div>
             <div className="flex-1 p-0 md:p-8 overflow-y-auto custom-scrollbar w-full">
                {currentView === 'MAIN' && renderMainMenu()}
                {currentView === 'PROMPTS' && renderPromptsView()}
                {currentView === 'VISUALS' && renderVisualsView()}
                {currentView === 'DATA' && renderDataView()}
                {currentView === 'STORAGE' && renderStorageView()}
                {currentView === 'AI_SERVICES' && (
                    <SettingsAIServices 
                        settings={formData.aiConfig} 
                        enableIntersectionPrecheck={formData.enableIntersectionPrecheck}
                        enableNpcBacklinePreUpdate={formData.enableNpcBacklinePreUpdate}
                        onToggleIntersectionPrecheck={(enabled) => setFormData(prev => ({ ...prev, enableIntersectionPrecheck: enabled }))}
                        onToggleNpcBacklinePreUpdate={(enabled) => setFormData(prev => ({ ...prev, enableNpcBacklinePreUpdate: enabled }))}
                        onUpdate={(newAiConfig) => setFormData({...formData, aiConfig: newAiConfig})} 
                        onSave={(newAiConfig) => {
                            const next = { ...formData, aiConfig: newAiConfig };
                            setFormData(next);
                            onSaveSettings(next);
                        }}
                    />
                )}
                {currentView === 'VARIABLES' && renderVariablesView()}
                {currentView === 'MEMORY' && renderMemoryView()}
                {currentView === 'SCHEMA' && renderSchemaView()}
                {currentView === 'FULL_LOGS' && renderFullLogsView()}
                {currentView === 'LIBRARY' && renderLibraryView()}
                {currentView === 'AI_CONTEXT' && (
                    <SettingsContext 
                        settings={formData} 
                        onUpdate={setFormData}
                        gameState={gameState}
                        onUpdateGameState={onUpdateGameState}
                    />
                )}
             </div>
         </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-6 pt-6 px-6 md:px-0 md:pt-0">
        <div className="text-red-600">{icon}</div>
        <h3 className="text-2xl md:text-3xl font-display uppercase italic text-black">{title}</h3>
    </div>
);