import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, X, List, Save, Check, Radar, Globe, Users, Brain } from 'lucide-react';
import { AIEndpointConfig, GlobalAISettings } from '../../../../types';

interface SettingsAIServicesProps {
    settings: GlobalAISettings;
    enableIntersectionPrecheck?: boolean;
    enableNpcBacklinePreUpdate?: boolean;
    onToggleIntersectionPrecheck?: (enabled: boolean) => void;
    onToggleNpcBacklinePreUpdate?: (enabled: boolean) => void;
    onUpdate: (newSettings: GlobalAISettings) => void;
    onSave?: (newSettings: GlobalAISettings) => void;
}

export const SettingsAIServices: React.FC<SettingsAIServicesProps> = ({ settings, enableIntersectionPrecheck, enableNpcBacklinePreUpdate, onToggleIntersectionPrecheck, onToggleNpcBacklinePreUpdate, onUpdate, onSave }) => {
    const [localConfig, setLocalConfig] = useState<GlobalAISettings>(settings);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        setLocalConfig(settings);
        setHasUnsavedChanges(false);
    }, [settings]);

    const handleConfigChange = (newConfig: AIEndpointConfig, path: string) => {
        const nextState = JSON.parse(JSON.stringify(localConfig));
        if (path === 'unified') {
            nextState.unified = newConfig;
        } else {
            nextState.services[path] = newConfig;
        }
        setLocalConfig(nextState);
        onUpdate(nextState);
        setHasUnsavedChanges(true);
    };

    const handleServiceOverrideToggle = (key: keyof GlobalAISettings['services'], enabled: boolean) => {
        const nextState = JSON.parse(JSON.stringify(localConfig));
        if (!nextState.serviceOverridesEnabled) nextState.serviceOverridesEnabled = {};
        nextState.serviceOverridesEnabled[key] = enabled;
        setLocalConfig(nextState);
        onUpdate(nextState);
        setHasUnsavedChanges(true);
    };

    const saveChanges = () => {
        if (onSave) onSave(localConfig);
        else onUpdate(localConfig);
        setHasUnsavedChanges(false);
        alert("Cấu hình API đã được lưu");
    };
    const handleIntersectionToggle = (enabled: boolean) => {
        onToggleIntersectionPrecheck?.(enabled);
        setHasUnsavedChanges(true);
    };
    const handleNpcBacklinePreUpdateToggle = (enabled: boolean) => {
        onToggleNpcBacklinePreUpdate?.(enabled);
        setHasUnsavedChanges(true);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                    <Cpu className="text-purple-600" />
                    <h3 className="text-2xl font-display uppercase italic text-black">Cấu hình Dịch vụ API</h3>
                </div>
                <button 
                    onClick={saveChanges}
                    disabled={!hasUnsavedChanges}
                    className={`flex items-center gap-2 px-4 py-2 font-bold uppercase transition-all shadow-md
                        ${hasUnsavedChanges ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}
                    `}
                >
                    {hasUnsavedChanges ? <Save size={18} /> : <Check size={18} />}
                    {hasUnsavedChanges ? "Lưu thay đổi" : "Đã đồng bộ"}
                </button>
            </div>
            
            <div className="bg-white p-6 border border-zinc-200 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <label className="block text-xs font-bold uppercase mb-2 text-zinc-500">API Cốt truyện chính (Mặc định)</label>
                    <AIConfigForm 
                        label="Cấu hình API Cốt truyện chính"
                        config={localConfig.unified}
                        onChange={(c) => handleConfigChange(c, 'unified')}
                    />
                </div>

                <div className="mb-6 flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="nativeThinkingChain"
                        checked={localConfig.nativeThinkingChain !== false}
                        onChange={e => {
                            const newConfig = { ...localConfig, nativeThinkingChain: e.target.checked };
                            setLocalConfig(newConfig);
                            setHasUnsavedChanges(true);
                        }}
                        className="w-4 h-4 text-red-600 border-zinc-300 rounded focus:ring-red-500"
                    />
                    <label htmlFor="nativeThinkingChain" className="text-xs font-bold uppercase text-zinc-600 select-none cursor-pointer">
                        Kích hoạt chuỗi suy nghĩ gốc (Native Thinking Chain)
                    </label>
                </div>
                <div className="mb-6 flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="multiStageThinking"
                        checked={localConfig.multiStageThinking === true}
                        onChange={e => {
                            const newConfig = { ...localConfig, multiStageThinking: e.target.checked };
                            setLocalConfig(newConfig);
                            setHasUnsavedChanges(true);
                        }}
                        className="w-4 h-4 text-red-600 border-zinc-300 rounded focus:ring-red-500"
                    />
                    <label htmlFor="multiStageThinking" className="text-xs font-bold uppercase text-zinc-600 select-none cursor-pointer">
                        Đa tầng suy nghĩ (3 giai đoạn: Quy hoạch/Nháp/Cốt truyện hoàn chỉnh)
                    </label>
                </div>

                <div className="space-y-6">
                    <ModuleConfigCard
                        title="Biến động thế giới"
                        description="Khi bật, biến động thế giới được duy trì bởi API riêng; tắt sẽ do cốt truyện chính xử lý."
                        icon={<Globe size={16} />}
                        enabled={localConfig.serviceOverridesEnabled?.world === true}
                        onToggle={(enabled) => handleServiceOverrideToggle('world', enabled)}
                    >
                        <AIConfigForm config={localConfig.services.world} onChange={(c) => handleConfigChange(c, 'world')} disabled={localConfig.serviceOverridesEnabled?.world !== true} />
                    </ModuleConfigCard>

                    <ModuleConfigCard
                        title="Xã hội và Ký ức NPC"
                        description="Khi bật, xã hội và ký ức NPC được duy trì bởi API riêng; tắt sẽ do cốt truyện chính xử lý."
                        icon={<Users size={16} />}
                        enabled={localConfig.serviceOverridesEnabled?.social === true}
                        onToggle={(enabled) => handleServiceOverrideToggle('social', enabled)}
                    >
                        <AIConfigForm config={localConfig.services.social} onChange={(c) => handleConfigChange(c, 'social')} disabled={localConfig.serviceOverridesEnabled?.social !== true} />
                    </ModuleConfigCard>

                    <ModuleConfigCard
                        title="Theo dõi ngầm NPC"
                        description="Khi bật, theo dõi ngầm được duy trì bởi API riêng; tắt sẽ do cốt truyện chính xử lý."
                        icon={<Brain size={16} />}
                        enabled={localConfig.serviceOverridesEnabled?.npcBrain === true}
                        onToggle={(enabled) => handleServiceOverrideToggle('npcBrain', enabled)}
                        extra={
                            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200">
                                <div>
                                    <div className="text-xs font-bold uppercase text-zinc-600">Cập nhật trước khi nhập lượt tiếp theo</div>
                                    <div className="text-[10px] text-zinc-500">Khi bật, mỗi lần người chơi nhập liệu sẽ kích hoạt làm mới NPC ngầm trước.</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={enableNpcBacklinePreUpdate === true}
                                    onChange={e => handleNpcBacklinePreUpdateToggle(e.target.checked)}
                                    className="w-4 h-4 text-red-600 border-zinc-300 rounded focus:ring-red-500"
                                />
                            </div>
                        }
                    >
                        <AIConfigForm config={localConfig.services.npcBrain} onChange={(c) => handleConfigChange(c, 'npcBrain')} disabled={localConfig.serviceOverridesEnabled?.npcBrain !== true} />
                    </ModuleConfigCard>

                    <ModuleConfigCard
                        title="Quy hoạch nhập liệu cốt truyện"
                        description="Dùng cho phán đoán giao hội và quy hoạch đầu vào. Có thể chọn bật xác nhận nhắc nhở."
                        icon={<Radar size={16} />}
                        enabled={localConfig.serviceOverridesEnabled?.npcSync === true}
                        onToggle={(enabled) => handleServiceOverrideToggle('npcSync', enabled)}
                        extra={
                            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200">
                                <div>
                                    <div className="text-xs font-bold uppercase text-zinc-600">Bật xác nhận nhắc nhở giao hội</div>
                                    <div className="text-[10px] text-zinc-500">Khi bật, nếu trúng từ khóa/dự đoán sẽ hiện popup xác nhận, có thể sửa trước khi gửi cốt truyện chính.</div>
                                </div>
                                    <input
                                        type="checkbox"
                                        checked={enableIntersectionPrecheck === true}
                                        onChange={e => handleIntersectionToggle(e.target.checked)}
                                        className="w-4 h-4 text-red-600 border-zinc-300 rounded focus:ring-red-500"
                                    />
                            </div>
                        }
                    >
                        <AIConfigForm config={localConfig.services.npcSync} onChange={(c) => handleConfigChange(c, 'npcSync')} disabled={localConfig.serviceOverridesEnabled?.npcSync !== true} />
                    </ModuleConfigCard>
                </div>
            </div>
        </div>
    );
};

const ModuleConfigCard = ({
    title,
    description,
    icon,
    enabled,
    onToggle,
    extra,
    children
}: {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    extra?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="space-y-3 border border-zinc-200 bg-white/70 p-4">
        <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold uppercase text-zinc-700">
                    {icon}
                    <span>{title}</span>
                </div>
                {description && <div className="text-[10px] text-zinc-500">{description}</div>}
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={e => onToggle(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-zinc-300 rounded focus:ring-red-500"
                />
                <span className="text-[10px] font-bold uppercase text-zinc-600">{enabled ? 'API riêng' : 'Dùng API chính'}</span>
            </div>
        </div>
        {extra}
        {children}
    </div>
);

const AIConfigForm = ({ config, onChange, label, disabled }: { config: AIEndpointConfig, onChange: (c: AIEndpointConfig) => void, label?: string; disabled?: boolean }) => {
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [showModelList, setShowModelList] = useState(false);
    const [fetchedModels, setFetchedModels] = useState<string[]>([]);
    const isDisabled = disabled === true;

    const handleFetchModels = async () => {
        if (isDisabled) return;
        if (!config.apiKey) {
            alert("Vui lòng nhập API Key trước");
            return;
        }
        setIsFetchingModels(true);
        setFetchedModels([]);
        try {
            let models: string[] = [];
            if (config.provider === 'gemini') {
                const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.models) {
                    models = data.models.map((m: any) => m.name.replace('models/', ''));
                } else if (data.error) {
                    throw new Error(data.error.message);
                }
            } else if (config.provider === 'deepseek') {
                models = ['deepseek-chat', 'deepseek-reasoner'];
                setFetchedModels(models);
                setShowModelList(true);
                setIsFetchingModels(false);
                return;
            } else {
                const url = `${config.baseUrl.replace(/\/$/, '')}/models`;
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${config.apiKey}` }
                });
                const data = await res.json();
                if (data.data) {
                    models = data.data.map((m: any) => m.id);
                } else if (data.error) {
                    throw new Error(data.error.message);
                }
            }
            setFetchedModels(models.sort());
            setShowModelList(true);
        } catch (e: any) {
            alert(`Lấy danh sách model thất bại: ${e.message}`);
        } finally {
            setIsFetchingModels(false);
        }
    };

    return (
        <div className={`space-y-4 bg-white/50 p-4 border border-zinc-300 relative ${isDisabled ? 'opacity-60' : ''}`}>
            {label && <h4 className="font-display uppercase text-lg text-black">{label}</h4>}
            
            <div>
                 <label className="block text-xs font-bold uppercase mb-1 text-zinc-500">Nhà cung cấp (Provider)</label>
                 <div className="flex flex-wrap gap-2">
                     {['gemini', 'openai', 'deepseek', 'custom'].map(p => (
                         <button 
                            key={p}
                            onClick={() => onChange({...config, provider: p as any, baseUrl: p === 'gemini' ? 'https://generativelanguage.googleapis.com' : p === 'openai' ? 'https://api.openai.com/v1' : p === 'deepseek' ? 'https://api.deepseek.com/v1' : ''})}
                            disabled={isDisabled}
                            className={`px-4 py-2 text-sm font-bold uppercase border-2 ${config.provider === p ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-200'} ${isDisabled ? 'cursor-not-allowed' : ''}`}
                         >
                            {p}
                         </button>
                     ))}
                 </div>
            </div>
            <div>
                <label className="block text-xs font-bold uppercase mb-1 text-zinc-500">Base URL</label>
                <input 
                    type="text" 
                    value={config.baseUrl}
                    onChange={e => onChange({...config, baseUrl: e.target.value})}
                    className="w-full bg-white border-b-2 border-zinc-400 p-2 font-mono text-sm text-black focus:border-red-600 outline-none"
                    placeholder={config.provider === 'custom' ? "Nhập base URL tùy chỉnh..." : "URL mặc định"}
                    disabled={isDisabled || config.provider !== 'custom'}
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase mb-1 text-zinc-500">API Key</label>
                <input 
                    type="password" 
                    value={config.apiKey}
                    onChange={e => onChange({...config, apiKey: e.target.value})}
                    className="w-full bg-white border-b-2 border-zinc-400 p-2 font-mono text-sm text-black focus:border-red-600 outline-none"
                    placeholder="sk-..."
                    disabled={isDisabled}
                />
            </div>
            <div className="relative">
                <label className="block text-xs font-bold uppercase mb-1 text-zinc-500">Model ID</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={config.modelId}
                        onChange={e => onChange({...config, modelId: e.target.value})}
                        className="flex-1 bg-white border-b-2 border-zinc-400 p-2 font-mono text-sm text-black focus:border-red-600 outline-none"
                        placeholder="model-id"
                        disabled={isDisabled}
                    />
                    <button 
                        onClick={handleFetchModels} 
                        disabled={isFetchingModels || isDisabled}
                        className="bg-black text-white px-3 py-1 hover:bg-red-600 transition-colors disabled:opacity-50"
                        title="Lấy danh sách model"
                    >
                        {isFetchingModels ? <RefreshCw className="animate-spin" size={16} /> : <List size={16} />}
                    </button>
                </div>
                
                <div className="mt-2 flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id={`force-json-${label || 'config'}`} 
                        checked={config.forceJsonOutput || false}
                        onChange={e => onChange({...config, forceJsonOutput: e.target.checked})}
                        className="w-4 h-4 text-red-600 border-zinc-300 rounded focus:ring-red-500"
                        disabled={isDisabled}
                    />
                    <label htmlFor={`force-json-${label || 'config'}`} className="text-xs font-bold uppercase text-zinc-600 select-none cursor-pointer">
                        Bắt buộc xuất JSON
                    </label>
                </div>

                {showModelList && fetchedModels.length > 0 && (
                    <div className="absolute top-full right-0 w-full md:w-64 bg-white border-2 border-black z-50 shadow-xl mt-1 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center bg-black text-white p-2 text-xs font-bold sticky top-0">
                            <span>CÁC MODEL KHẢ DỤNG</span>
                            <button onClick={() => setShowModelList(false)}><X size={12}/></button>
                        </div>
                        {fetchedModels.map(model => (
                            <button 
                                key={model}
                                onClick={() => { onChange({...config, modelId: model}); setShowModelList(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-red-50 hover:text-red-600 border-b border-zinc-100 ${config.modelId === model ? 'bg-zinc-100 font-bold' : 'text-black'}`}
                            >
                                {model}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};