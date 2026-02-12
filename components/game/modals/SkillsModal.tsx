import React, { useState } from 'react';
import { X, Star, Zap, Sparkles } from 'lucide-react';
import { Skill, MagicSpell } from '../../../types';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  magic: MagicSpell[];
}

type AbilityTab = 'SKILL' | 'MAGIC';

const formatValue = (value: any) => {
  if (Array.isArray(value)) return value.map(String).join(' / ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const normalizeTags = (tags?: string[] | string) => {
  if (!tags) return [];
  return Array.isArray(tags) ? tags.map(String) : [String(tags)];
};

const formatCost = (cost: any) => {
  if (cost === undefined || cost === null || cost === '') return undefined;
  if (typeof cost === 'object') {
    const parts: string[] = [];
    if (cost.精神 !== undefined && cost.精神 !== null && cost.精神 !== '') parts.push(`MP ${cost.精神}`);
    if (cost.体力 !== undefined && cost.体力 !== null && cost.体力 !== '') parts.push(`Thể lực ${cost.体力}`);
    if (cost.代价) parts.push(`Cái giá ${cost.代价}`);
    return parts.join(' / ');
  }
  return String(cost);
};

export const SkillsModal: React.FC<SkillsModalProps> = ({ isOpen, onClose, skills, magic }) => {
  const [activeTab, setActiveTab] = useState<AbilityTab>('SKILL');

  if (!isOpen) return null;

  const renderSkillCard = (skill: Skill, index: number) => {
    const cost = formatCost(skill.消耗);
    const tags = [...normalizeTags(skill.标签), skill.稀有 ? 'Hiếm' : null].filter(Boolean) as string[];
    const metaItems = [
      { label: 'Loại', value: skill.类别 },
      { label: 'Cấp độ', value: skill.等级 },
      { label: 'Kích hoạt', value: skill.触发 },
      { label: 'Thời lượng', value: skill.持续 },
      { label: 'Hồi chiêu', value: skill.冷却 },
      { label: 'Phạm vi', value: skill.范围 },
      { label: 'Chính xác', value: skill.命中 },
      { label: 'Áp dụng', value: skill.适用 },
      { label: 'Liên kết', value: skill.关联发展能力 }
    ].filter(item => item.value !== undefined && item.value !== null && item.value !== '');

    return (
      <div key={skill.id || `${skill.名称}_${index}`} className="group relative bg-zinc-950 p-6 border border-zinc-800 hover:border-blue-600 transition-all overflow-hidden">
        <div className="absolute -right-4 -bottom-4 text-zinc-800 group-hover:text-blue-900/30 transition-colors transform rotate-12">
          <Zap size={96} />
        </div>

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl text-white font-bold group-hover:text-blue-400 transition-colors">{skill.名称 || 'Kỹ năng chưa đặt tên'}</h3>
                {skill.稀有 && <Star className="text-yellow-400" size={16} fill="currentColor" />}
              </div>
              {skill.类别 && (
                <div className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">
                  {skill.类别}
                </div>
              )}
            </div>
            {cost && (
              <span className="text-xs font-mono text-cyan-300 border border-cyan-900 px-2 py-0.5">
                Tiêu hao {cost}
              </span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-widest text-blue-200/80">
              {tags.map((tag, idx) => (
                <span key={`${tag}_${idx}`} className="border border-blue-900/70 px-2 py-0.5 bg-blue-950/30">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(skill.描述 || skill.效果) && (
            <div className="text-zinc-300 text-sm leading-relaxed">
              {skill.描述 && <p>{skill.描述}</p>}
              {skill.效果 && (
                <div className="mt-3 border border-blue-900/60 bg-blue-950/30 p-2 text-xs text-blue-100">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-blue-300 mb-1">Hiệu quả</div>
                  <div className="leading-relaxed">{skill.效果}</div>
                </div>
              )}
            </div>
          )}

          {metaItems.length > 0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-zinc-400 border-t border-zinc-800 pt-3">
              {metaItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500">{item.label}</span>
                  <span className="text-zinc-300 text-right">{formatValue(item.value)}</span>
                </div>
              ))}
            </div>
          )}

          {(skill.限制 || skill.备注) && (
            <div className="text-[11px] text-zinc-500 border-t border-zinc-800 pt-3">
              {skill.限制 && <div>Hạn chế: {formatValue(skill.限制)}</div>}
              {skill.备注 && <div>Ghi chú: {formatValue(skill.备注)}</div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMagicCard = (spell: MagicSpell, index: number) => {
    const cost = formatCost(spell.消耗);
    const tags = [...normalizeTags(spell.标签), spell.稀有 ? 'Hiếm' : null].filter(Boolean) as string[];
    const metaItems = [
      { label: 'Loại', value: spell.类别 },
      { label: 'Thuộc tính', value: spell.属性 },
      { label: 'Phạm vi', value: spell.范围 },
      { label: 'Tầm xa', value: spell.射程 },
      { label: 'Hồi chiêu', value: spell.冷却 },
      { label: 'Điều kiện', value: spell.施放条件 }
    ].filter(item => item.value !== undefined && item.value !== null && item.value !== '');

    return (
      <div key={spell.id || `${spell.名称}_${index}`} className="group relative bg-zinc-950 p-6 border border-zinc-800 hover:border-cyan-500 transition-all overflow-hidden">
        <div className="absolute -right-4 -bottom-4 text-zinc-800 group-hover:text-cyan-900/30 transition-colors transform rotate-12">
          <Sparkles size={96} />
        </div>

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl text-white font-bold group-hover:text-cyan-300 transition-colors">{spell.名称 || 'Phép thuật chưa đặt tên'}</h3>
                {spell.稀有 && <Star className="text-yellow-400" size={16} fill="currentColor" />}
              </div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">
                {[spell.类别, spell.属性].filter(Boolean).join(' / ')}
              </div>
            </div>
            {cost && (
              <span className="text-xs font-mono text-cyan-200 border border-cyan-900 px-2 py-0.5">
                Tiêu hao {cost}
              </span>
            )}
          </div>

          {spell.咏唱 && (
            <div className="border border-cyan-900/60 bg-cyan-950/30 p-2 text-[11px] text-cyan-100 leading-relaxed">
              <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300 mb-1">Niệm chú</div>
              <div className="whitespace-pre-wrap">{spell.咏唱}</div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-widest text-cyan-200/80">
              {tags.map((tag, idx) => (
                <span key={`${tag}_${idx}`} className="border border-cyan-900/70 px-2 py-0.5 bg-cyan-950/30">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(spell.描述 || spell.效果) && (
            <div className="text-zinc-300 text-sm leading-relaxed">
              {spell.描述 && <p>{spell.描述}</p>}
              {spell.效果 && (
                <div className="mt-3 border border-cyan-900/60 bg-cyan-950/30 p-2 text-xs text-cyan-100">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300 mb-1">Hiệu quả</div>
                  <div className="leading-relaxed">{spell.效果}</div>
                </div>
              )}
            </div>
          )}

          {metaItems.length > 0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-zinc-400 border-t border-zinc-800 pt-3">
              {metaItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500">{item.label}</span>
                  <span className="text-zinc-300 text-right">{formatValue(item.value)}</span>
                </div>
              ))}
            </div>
          )}

          {spell.备注 && (
            <div className="text-[11px] text-zinc-500 border-t border-zinc-800 pt-3">
              Ghi chú: {formatValue(spell.备注)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const list = activeTab === 'SKILL' ? skills : magic;
  const emptyText = activeTab === 'SKILL' ? 'Chưa học kỹ năng nào' : 'Chưa học phép thuật nào';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-zinc-900 border-t-8 border-blue-600 relative shadow-[0_20px_50px_rgba(37,99,235,0.3)] max-h-[80vh] flex flex-col">
        <div className="p-6 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-black">
          <div className="flex flex-col">
            <span className="text-blue-600 font-display text-lg uppercase tracking-widest">Skill & Magic</span>
            <h2 className="text-4xl md:text-5xl font-display uppercase tracking-wider text-white italic">Kỹ năng / Phép thuật</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-black/60 border border-zinc-700 rounded-full p-1">
              <button
                onClick={() => setActiveTab('SKILL')}
                className={`px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${activeTab === 'SKILL' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                Kỹ năng
              </button>
              <button
                onClick={() => setActiveTab('MAGIC')}
                className={`px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${activeTab === 'MAGIC' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                Phép thuật
              </button>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-10 h-10" />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {list.length > 0 ? (
              activeTab === 'SKILL'
                ? list.map((skill, index) => renderSkillCard(skill as Skill, index))
                : list.map((spell, index) => renderMagicCard(spell as MagicSpell, index))
            ) : (
              <div className="col-span-full text-center text-zinc-500 font-display text-2xl py-20">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};