
import React, { useState, useEffect } from 'react';
import { 
  Video, 
  FileText, 
  Send, 
  Settings, 
  ShieldCheck, 
  Copy, 
  Check,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  Mic2,
  X,
  Plus,
  Minus,
  Film,
  Zap,
  ArrowLeft,
  User as UserIcon,
  Download,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { getAiClient } from '../services/keyService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import PromptEditor from '../components/PromptEditor';
import { CinematicPrompt } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const REGIONS = [
  { id: 'north', label: 'Bắc (Hà Nội)', description: 'Chỉn chu, thuyết phục' },
  { id: 'central', label: 'Trung (Nghệ An)', description: 'Gần gũi, chân chất' },
  { id: 'south', label: 'Nam (TP.HCM)', description: 'Năng động, hào sảng' }
];

const STYLES = [
  { id: 'price_shock', category: 'Tập trung Chốt đơn', label: 'Nói giá ngay giây đầu tiên (Shock)', description: 'Tạo cú sốc về giá để giữ chân người xem' },
  { id: 'flash_sale', category: 'Tập trung Chốt đơn', label: 'Xả kho (Bùng nổ giá)', description: 'Tạo sự khan hiếm và gấp gáp' },
  { id: 'real_test', category: 'Thực tế & Trải nghiệm', label: 'Trải nghiệm/Test sản phẩm thực tế', description: 'Chứng minh hiệu quả bằng hành động' },
  { id: 'before_after', category: 'Thực tế & Trải nghiệm', label: 'So sánh Before & After', description: 'Sự thay đổi rõ rệt trước và sau khi dùng' },
  { id: 'vlog_packing', category: 'Thực tế & Trải nghiệm', label: 'Hậu trường đóng hàng (Vlog)', description: 'Tạo sự tin tưởng về quy mô và uy tín' },
  { id: 'secret', category: 'Gây chú ý cực mạnh', label: 'BÍ MẬT (90% không biết...)', description: 'Kích thích sự tò mò về thông tin ít người biết' },
  { id: 'problem_solution', category: 'Cơ bản', label: 'Vấn đề & Giải pháp', description: 'Nêu nỗi đau và đưa ra cách giải quyết' },
];

const DirectSalesModule: React.FC = () => {
  const [productInfo, setProductInfo] = useState('');
  const [region, setRegion] = useState('south');
  const [style, setStyle] = useState('problem_solution');
  const [contentType, setContentType] = useState<'dialogue' | 'no-dialogue'>('dialogue');
  const [duration, setDuration] = useState(12);
  const [step, setStep] = useState(1);
  const [videoIdeas, setVideoIdeas] = useState<{ title: string; hook: string; content: string }[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [characterAnalysis, setCharacterAnalysis] = useState<{
    name: string;
    gender: string;
    costume: string;
    location: string;
    time: string;
    useCameoOutfit: boolean;
  } | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<CinematicPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingScenes, setLoadingScenes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<{ index: number; type: 'prompt' | 'translation' | 'chinese' } | null>(null);

  const handleDownloadAll = () => {
    if (generatedPrompts.length === 0) return;
    
    const content = generatedPrompts.map((p, i) => {
      return `--- PHÂN CẢNH ${i + 1} ---\n` +
             `NHÂN VẬT: ${p.characterName}\n\n` +
             `PROMPT (ENGLISH):\n${p.prompt}\n\n` +
             `DỊCH (VIETNAMESE):\n${p.translation}\n\n` +
             `CHINESE PROMPT:\n${p.chinesePrompt}\n\n` +
             `--------------------------\n\n`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `direct-sales-prompts-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDurationChange = (amount: number) => {
    setDuration(prev => Math.max(12, prev + amount));
  };

  const callGeminiIdeas = async (retryCount = 0) => {
    if (!productInfo.trim()) return;
    
    setLoading(true);
    setError(null);
    setVideoIdeas([]);
    setSelectedIdeaIndex(null);

    const selectedRegion = REGIONS.find(r => r.id === region)?.label;
    const selectedStyle = STYLES.find(s => s.id === style);
    
    const systemPrompt = `
      BẠN LÀ CHUYÊN GIA SÁNG TẠO Ý TƯỞNG VIDEO MARKETING & BÁN HÀNG TRỰC TIẾP.
      NHIỆM VỤ: Tạo ra 3-5 ý tưởng kịch bản video ngắn (Short-form video) hấp dẫn cho sản phẩm.
      
      CHẾ ĐỘ NỘI DUNG: ${contentType === 'dialogue' ? 'CÓ THOẠI (Dialogue)' : 'KHÔNG THOẠI (No Dialogue - Body Language focus)'}
      VÙNG MIỀN: ${selectedRegion}
      PHONG CÁCH: ${selectedStyle?.label}
      THỜI LƯỢNG: ${duration} giây.

      YÊU CẦU:
      1. Mỗi ý tưởng phải có Tiêu đề (title), Câu Hook (hook) và Nội dung tóm tắt (content).
      2. Nội dung phải phù hợp với phong cách và vùng miền đã chọn.
      3. Nếu là video có thoại, hãy phác thảo lời thoại chính.
      4. Nếu không thoại, hãy phác thảo các hành động then chốt.

      Trả về định dạng JSON mảng 'ideas' chứa 'title', 'hook', 'content'.
    `;

    const userPrompt = `Hãy tạo 3-5 ý tưởng video cho sản phẩm: ${productInfo}`;

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ideas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    hook: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["title", "hook", "content"]
                }
              }
            },
            required: ["ideas"]
          }
        }
      });

      const result = JSON.parse(response.text || '{"ideas":[]}');
      if (result.ideas && result.ideas.length > 0) {
        setVideoIdeas(result.ideas);
      } else {
        throw new Error("Không nhận được ý tưởng từ AI.");
      }
    } catch (err) {
      console.error(err);
      if (retryCount < 2) {
        setTimeout(() => callGeminiIdeas(retryCount + 1), 1000);
      } else {
        setError("Không thể kết nối với AI để tạo ý tưởng. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const callGeminiAnalysis = async (retryCount = 0) => {
    if (selectedIdeaIndex === null) return;
    
    setLoadingAnalysis(true);
    setError(null);

    const selectedIdea = videoIdeas[selectedIdeaIndex];
    
    const systemPrompt = `
      BẠN LÀ CHUYÊN GIA PHÂN TÍCH NHÂN VẬT VÀ BỐI CẢNH VIDEO MARKETING.
      NHIỆM VỤ: Dựa trên ý tưởng video, hãy đề xuất thông tin nhân vật và bối cảnh để đảm bảo tính đồng nhất cho toàn bộ video.
      
      Ý TƯỞNG: ${selectedIdea.title} - ${selectedIdea.content}
      
      YÊU CẦU:
      1. Tên nhân vật: Phải phù hợp với sản phẩm và vùng miền.
      2. Giới tính: Nam hoặc Nữ.
      3. Trang phục: Mô tả trang phục chi tiết, chuyên nghiệp, phù hợp với sản phẩm.
      4. Bối cảnh (Location): Địa điểm quay video chính.
      5. Thời gian (Time): Sáng, trưa, chiều, tối hoặc ánh sáng cụ thể.
      
      Trả về định dạng JSON: { "name": "...", "gender": "...", "costume": "...", "location": "...", "time": "..." }
    `;

    const userPrompt = `Phân tích nhân vật và bối cảnh cho ý tưởng: ${selectedIdea.title}`;

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              gender: { type: Type.STRING },
              costume: { type: Type.STRING },
              location: { type: Type.STRING },
              time: { type: Type.STRING }
            },
            required: ["name", "gender", "costume", "location", "time"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.name) {
        setCharacterAnalysis({ ...result, useCameoOutfit: true });
        setStep(2);
      } else {
        throw new Error("Không nhận được phân tích từ AI.");
      }
    } catch (err) {
      console.error(err);
      if (retryCount < 2) {
        setTimeout(() => callGeminiAnalysis(retryCount + 1), 1000);
      } else {
        setError("Không thể kết nối với AI để phân tích nhân vật. Vui lòng thử lại.");
      }
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const callGeminiScenes = async (retryCount = 0) => {
    if (selectedIdeaIndex === null || !characterAnalysis) return;
    
    setLoadingScenes(true);
    setError(null);

    const selectedIdea = videoIdeas[selectedIdeaIndex];
    const selectedRegion = REGIONS.find(r => r.id === region)?.label;
    
    const systemPrompt = `
      BẠN LÀ CHUYÊN GIA VIẾT PROMPT VIDEO AI (JIMENG) CHI TIẾT.
      NHIỆM VỤ: Dựa trên ý tưởng video và thông tin nhân vật/bối cảnh đã chốt, hãy tạo ra 5 phân cảnh chi tiết để tạo video AI.
      
      Ý TƯỞNG CHỌN: ${selectedIdea.title} - ${selectedIdea.content}
      CHẾ ĐỘ NỘI DUNG: ${contentType === 'dialogue' ? 'CÓ THOẠI (Dialogue)' : 'KHÔNG THOẠI (No Dialogue - Body Language focus)'}
      
      THÔNG SỐ ĐỒNG NHẤT (BẮT BUỘC SỬ DỤNG TRONG TẤT CẢ CÁC CẢNH):
      - Nhân vật: ${characterAnalysis.name} (${characterAnalysis.gender})
      - Trang phục: ${characterAnalysis.useCameoOutfit ? "Cameo original outfit" : characterAnalysis.costume}
      - Bối cảnh: ${characterAnalysis.location}
      - Thời gian: ${characterAnalysis.time}
      
      YÊU CẦU NGHIÊM NGẶT (STRICT REQUIREMENTS):
      - GIỮ NGUYÊN HÌNH DÁNG, CHI TIẾT SẢN PHẨM (Keep product shape and details exactly).
      - GIỮ NGUYÊN CHỮ VÀ LOGO TRÊN SẢN PHẨM (Keep all text and logos on the product unchanged).
      - TUYỆT ĐỐI KHÔNG THAY ĐỔI CHI TIẾT SẢN PHẨM (Absolutely no changes to product details).
      
      QUY TẮC VIẾT PROMPT (BẮT BUỘC):
      1. CẤU TRÚC PROMPT (TIẾNG ANH):
         - Location: ${characterAnalysis.location}
         - Time: ${characterAnalysis.time}
         - Style: Commercial Cinematic 8k, high-end product photography style
         - Character: ${characterAnalysis.name}, ${characterAnalysis.gender}, wearing ${characterAnalysis.useCameoOutfit ? "original outfit" : characterAnalysis.costume}
         - Action: [Mô tả hành động chi tiết, góc máy, ánh sáng, chuyển động]
      
      2. QUY TẮC PHÂN CẢNH: Chia nhỏ video thành 5 phân cảnh logic để tạo thành một video hoàn chỉnh dài ${duration} giây.
      3. LOGIC BÁN HÀNG: Tập trung vào sự hấp dẫn của sản phẩm và cảm xúc người dùng.
      4. NGÔN NGỮ: 
         - 'prompt': Tiếng Anh chuyên ngành AI Video (Rất chi tiết). ${contentType === 'dialogue' ? "BẮT BUỘC: Phải đưa lời thoại tiếng Việt vào phần Action (ví dụ: Character speaks in Vietnamese: '...')." : ""}
         - 'translation': Tiếng Việt (Prompt chi tiết cho Jimeng bằng tiếng Việt, mô tả rõ bối cảnh và hành động).
         - 'chinese': Tiếng Trung (Giản thể - Tối ưu cho Jimeng). ${contentType === 'dialogue' ? "BẮT BUỘC: Phải đưa lời thoại tiếng Việt vào phần mô tả hành động (ví dụ: 角色用越南语说: '...')." : ""}
         ${contentType === 'dialogue' ? "- 'script': Lời thoại tiếng Việt cụ thể cho phân cảnh đó." : ""}
         - 'characterName': Tên nhân vật thoại cảnh đó (nếu có).
      
      Trả về định dạng JSON mảng 'data' chứa 'prompt', 'translation', 'chinese', 'characterName'${contentType === 'dialogue' ? ", 'script'" : ""}.
    `;

    const userPrompt = `Hãy tạo 5 phân cảnh chi tiết cho ý tưởng: ${selectedIdea.title}`;

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              data: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    prompt: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    chinese: { type: Type.STRING },
                    script: { type: Type.STRING },
                    characterName: { type: Type.STRING }
                  },
                  required: ["prompt", "translation", "chinese"]
                }
              }
            },
            required: ["data"]
          }
        }
      });

      const result = JSON.parse(response.text || '{"data":[]}');
      if (result.data && result.data.length > 0) {
        const formattedPrompts = result.data.map((item: any) => ({
          prompt: item.prompt,
          translation: item.script ? `${item.script}\n\n${item.translation}` : item.translation,
          chinesePrompt: item.script ? `${item.script}\n\n${item.chinese}` : item.chinese,
          characterName: item.characterName || characterAnalysis.name
        }));
        setGeneratedPrompts(formattedPrompts);
        setStep(3);
      } else {
        throw new Error("Không nhận được phân cảnh từ AI.");
      }
    } catch (err) {
      console.error(err);
      if (retryCount < 2) {
        setTimeout(() => callGeminiScenes(retryCount + 1), 1000);
      } else {
        setError("Không thể kết nối với AI để tạo phân cảnh. Vui lòng thử lại.");
      }
    } finally {
      setLoadingScenes(false);
    }
  };

  const copyToClipboard = (text: string, index: number, type: 'prompt' | 'translation' | 'chinese') => {
    navigator.clipboard.writeText(text);
    setCopiedIndex({ index, type });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const updateScenePrompt = (index: number, updatedPrompt: CinematicPrompt) => {
    setGeneratedPrompts(prev => prev.map((p, i) => i === index ? updatedPrompt : p));
  };

  const reset = () => {
    setStep(1);
    setVideoIdeas([]);
    setSelectedIdeaIndex(null);
    setCharacterAnalysis(null);
    setGeneratedPrompts([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-8 w-full px-4">
        {[
          { n: 1, label: 'Ý TƯỞNG', icon: FileText },
          { n: 2, label: 'NHÂN VẬT', icon: UserIcon },
          { n: 3, label: 'PHÂN CẢNH', icon: Film }
        ].map((s) => (
          <div key={s.n} className="flex flex-col items-center relative flex-1">
            <motion.div 
              initial={false}
              animate={{
                scale: step === s.n ? 1.05 : 1,
                backgroundColor: step >= s.n ? "#EA580C" : "#FFFFFF",
                borderColor: step >= s.n ? "#EA580C" : "#E2E8F0",
                color: step >= s.n ? "#FFFFFF" : "#94A3B8"
              }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 z-10 shadow-sm",
                step === s.n && "shadow-lg shadow-orange-500/40"
              )}
            >
              <s.icon className="w-5 h-5" />
            </motion.div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest mt-3 transition-colors duration-500",
              step >= s.n ? "text-orange-600" : "text-slate-400"
            )}>{s.label}</span>
            {s.n < 3 && (
              <div className="absolute top-5 left-[50%] w-full h-[1px] -z-0">
                <div className={cn(
                  "h-full transition-all duration-700",
                  step > s.n ? "bg-orange-200" : "bg-slate-100"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: Input */}
            <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Thông tin sản phẩm</h2>
            </div>
            
            <textarea
              className="w-full h-64 p-4 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all outline-none resize-none bg-slate-50 focus:bg-white"
              placeholder="Nhập tên sản phẩm, đặc điểm nổi bật, giá bán..."
              value={productInfo}
              onChange={(e) => setProductInfo(e.target.value)}
            />
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Cấu hình Video</h2>
            </div>

            {/* Duration Control */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Thời lượng Video (Jimeng)</label>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <button 
                  onClick={() => handleDurationChange(-12)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-90"
                >
                  <Minus className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-black text-slate-900">{duration}s</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Giây</p>
                </div>
                <button 
                  onClick={() => handleDurationChange(12)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-all active:scale-90"
                >
                  <Plus className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic text-center">Mỗi lần tăng/giảm 12 giây theo logic Jimeng</p>
            </div>

            {/* Content Type Selection */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Loại nội dung</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'dialogue', label: 'Có thoại (Tiếng Việt)', icon: Mic2 },
                  { id: 'no-dialogue', label: 'Không thoại (Hình thể)', icon: UserIcon }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setContentType(t.id as any)}
                    className={cn(
                      "p-3 flex items-center justify-center gap-2 text-[10px] sm:text-xs rounded-xl border transition-all",
                      contentType === t.id ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Vùng miền</label>
              <div className="grid grid-cols-3 gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRegion(r.id)}
                    className={cn(
                      "p-2 text-[10px] sm:text-xs rounded-lg border transition-all text-center",
                      region === r.id ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

          </section>
        </div>

        {/* Right Column: Ideas & Style */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {videoIdeas.length > 0 ? (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Ý tưởng Video gợi ý</h2>
                  </div>
                  <button 
                    onClick={() => setVideoIdeas([])}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Làm mới
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  {videoIdeas.map((idea, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedIdeaIndex(idx)}
                      className={cn(
                        "p-5 text-left rounded-2xl border transition-all relative group",
                        selectedIdeaIndex === idx 
                          ? 'border-orange-500 bg-orange-50 shadow-md' 
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={cn("font-bold text-base", selectedIdeaIndex === idx ? 'text-orange-700' : 'text-slate-800')}>
                           {idx + 1}. {idea.title}
                        </h3>
                        {selectedIdeaIndex === idx && (
                          <div className="bg-orange-500 text-white p-1 rounded-full">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-orange-600 font-bold mb-2 uppercase tracking-wider">Hook: {idea.hook}</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{idea.content}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => callGeminiAnalysis()}
                  disabled={loadingAnalysis || selectedIdeaIndex === null}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl uppercase tracking-widest",
                    loadingAnalysis || selectedIdeaIndex === null 
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                  )}
                >
                  {loadingAnalysis ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 text-yellow-400" />}
                  {loadingAnalysis ? 'Đang phân tích...' : '2. PHÂN TÍCH NHÂN VẬT'}
                </button>
              </motion.section>
            ) : (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <Film className="w-5 h-5 text-purple-500" />
                  <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Phong cách Bán hàng</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={cn(
                        "p-4 text-left rounded-xl border transition-all flex flex-col gap-1",
                        style === s.id ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.category}</span>
                        {style === s.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                      </div>
                      <span className={cn("text-sm font-bold", style === s.id ? 'text-orange-700' : 'text-slate-700')}>{s.label}</span>
                      <span className="text-xs text-slate-500">{s.description}</span>
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <div className="mt-8 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-3xl">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium max-w-xs">
                    Nhập thông tin sản phẩm bên trái và chọn phong cách để bắt đầu quy trình chuyên nghiệp.
                  </p>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => callGeminiIdeas()}
                    disabled={loading || !productInfo.trim()}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl uppercase tracking-widest",
                      loading || !productInfo.trim() 
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                        : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                    )}
                  >
                    {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 text-yellow-400" />}
                    {loading ? 'Đang tạo ý tưởng...' : '1. TẠO Ý TƯỞNG VIDEO'}
                  </button>
                </div>
              </section>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
        ) : step === 2 ? (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-600/20">
                    <UserIcon className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Phân tích Nhân vật & Bối cảnh</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Đảm bảo tính đồng nhất cho toàn bộ video</p>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(1)}
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200 text-slate-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {characterAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Thông tin Nhân vật</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tên nhân vật</label>
                        <input 
                          type="text"
                          value={characterAnalysis.name}
                          onChange={(e) => setCharacterAnalysis({...characterAnalysis, name: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Giới tính</label>
                        <div className="flex gap-2">
                          {['Nam', 'Nữ'].map(g => (
                            <button
                              key={g}
                              onClick={() => setCharacterAnalysis({...characterAnalysis, gender: g})}
                              className={cn(
                                "flex-1 py-2 rounded-lg border text-xs font-bold transition-all",
                                characterAnalysis.gender === g ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-slate-200 text-slate-600"
                              )}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Trang phục</label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <input 
                              type="checkbox"
                              checked={characterAnalysis.useCameoOutfit}
                              onChange={(e) => setCharacterAnalysis({...characterAnalysis, useCameoOutfit: e.target.checked})}
                              className="w-4 h-4 accent-orange-600"
                            />
                            <span className="text-xs font-bold text-slate-700">Giữ trang phục Cameo gốc</span>
                          </div>
                          
                          {!characterAnalysis.useCameoOutfit && (
                            <textarea 
                              value={characterAnalysis.costume}
                              onChange={(e) => setCharacterAnalysis({...characterAnalysis, costume: e.target.value})}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                              placeholder="Mô tả trang phục tùy chọn..."
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Môi trường & Bối cảnh</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Bối cảnh (Location)</label>
                        <input 
                          type="text"
                          value={characterAnalysis.location}
                          onChange={(e) => setCharacterAnalysis({...characterAnalysis, location: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Thời gian (Time)</label>
                        <input 
                          type="text"
                          value={characterAnalysis.time}
                          onChange={(e) => setCharacterAnalysis({...characterAnalysis, time: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-12 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                      <p className="text-xs text-orange-800 leading-relaxed italic">
                        * Các thông số này sẽ được áp dụng đồng nhất cho tất cả 5 phân cảnh để đảm bảo video không bị nhảy bối cảnh hoặc nhân vật.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => callGeminiScenes()}
                  disabled={loadingScenes}
                  className={cn(
                    "px-12 py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl uppercase tracking-widest",
                    loadingScenes ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                  )}
                >
                  {loadingScenes ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 text-yellow-400" />}
                  {loadingScenes ? 'Đang tạo prompt...' : '3. TẠO PROMPT CHI TIẾT'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-600/20">
                    <Video className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">5 Phân cảnh Video AI</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Ý tưởng: {videoIdeas[selectedIdeaIndex!]?.title} | Chế độ: {contentType === 'dialogue' ? 'Có thoại' : 'Không thoại'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {generatedPrompts.length > 0 && (
                    <button 
                      onClick={handleDownloadAll}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                      title="Download all prompts"
                    >
                      <Download className="w-4 h-4" />
                      DOWNLOAD ALL
                    </button>
                  )}
                  <button 
                    onClick={() => setStep(2)}
                    className="p-3 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200 text-slate-600"
                    title="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={reset}
                    className="p-3 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200 text-slate-600"
                    title="Làm mới tất cả"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {generatedPrompts.map((item, index) => (
                  <article key={index} className="bg-slate-50/50 rounded-3xl border border-slate-200 overflow-hidden">
                    <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-900/20">
                          {index + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-800 text-xs font-black uppercase tracking-widest">Phân cảnh {index + 1}</span>
                          {item.characterName && (
                            <span className="text-[10px] text-orange-600 font-bold uppercase">Nhân vật: {item.characterName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <PromptEditor 
                        prompt={item} 
                        onUpdate={(updated) => updateScenePrompt(index, updated)} 
                        sceneId={`sales-scene-${index}`}
                      />
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-12 flex justify-center">
                <button 
                  onClick={() => setStep(1)}
                  className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl uppercase tracking-widest active:scale-95"
                >
                  FINISH & BACK
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DirectSalesModule;
