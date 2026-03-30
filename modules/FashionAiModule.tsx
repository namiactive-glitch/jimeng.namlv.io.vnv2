
import React, { useState, useEffect } from 'react';
import { 
  Video, 
  FileText, 
  Settings, 
  Check,
  RefreshCw,
  Sparkles,
  AlertCircle,
  X,
  Plus,
  Minus,
  Film,
  Zap,
  ArrowLeft,
  User as UserIcon,
  Image as ImageIcon,
  Upload,
  Camera,
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

const FASHION_STYLES = [
  { id: 'runway', label: 'Runway Walk', description: 'Người mẫu sải bước trên sàn catwalk chuyên nghiệp' },
  { id: 'studio_pose', label: 'Studio Posing', description: 'Tạo dáng trong studio với ánh sáng high-fashion' },
  { id: 'street_style', label: 'Street Style', description: 'Phong cách dạo phố năng động, tự nhiên' },
  { id: 'lookbook', label: 'Lookbook Video', description: 'Quay cận cảnh chi tiết trang phục và chất liệu' },
  { id: 'cinematic_fashion', label: 'Cinematic Fashion', description: 'Phim thời trang nghệ thuật với góc quay sáng tạo' },
  { id: 'slow_mo', label: 'High-Speed Slow Motion', description: 'Quay chậm tốc độ cao bắt trọn chuyển động vải vóc' },
  { id: 'handheld', label: 'Handheld Documentary', description: 'Góc máy cầm tay chân thực, gần gũi như phim tài liệu' },
  { id: 'drone', label: 'Drone Aerial Fashion', description: 'Góc quay từ trên cao bao quát bối cảnh hùng vĩ' },
  { id: 'orbit', label: '360 Degree Orbit', description: 'Máy quay xoay tròn quanh người mẫu tạo hiệu ứng không gian' },
  { id: 'vintage', label: 'Vintage Film 16mm', description: 'Hiệu ứng phim nhựa cổ điển, hạt phim hoài niệm' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', description: 'Ánh sáng neon rực rỡ, phong cách tương lai' },
  { id: 'minimalist', label: 'Minimalist Studio', description: 'Phông nền đơn sắc, tập trung tối đa vào phom dáng' },
  { id: 'ethereal', label: 'Nature Ethereal', description: 'Thiên nhiên huyền ảo với ánh sáng mềm mại' },
  { id: 'noir', label: 'Noir Monochrome', description: 'Đen trắng tương phản mạnh, cổ điển bí ẩn' },
  { id: 'vogue', label: 'Vogue Editorial', description: 'Ánh sáng gắt, tạo dáng góc cạnh đẳng cấp' },
  { id: 'dreamy', label: 'Dreamy Soft Focus', description: 'Mờ ảo, lãng mạn với hiệu ứng nhòe sáng' },
  { id: 'macro', label: 'Macro Detail Focus', description: 'Quay cực cận vào phụ kiện, chất liệu vải' }
];

const FashionAiModule: React.FC = () => {
  const [style, setStyle] = useState('studio_pose');
  const [duration, setDuration] = useState(12);
  const [step, setStep] = useState(1);
  const [costumeImageDescription, setCostumeImageDescription] = useState<string>('Ảnh trang phục tham chiếu');
  const [costumeSource, setCostumeSource] = useState<'text' | 'image'>('text');
  const [characterAnalysis, setCharacterAnalysis] = useState<{
    name: string;
    gender: string;
    costume: string;
    location: string;
    time: string;
  } | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<CinematicPrompt[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingScenes, setLoadingScenes] = useState(false);
  const [loadingContextSuggestion, setLoadingContextSuggestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<{ index: number; type: 'prompt' | 'translation' | 'chinese' } | null>(null);

  const handleDownloadAll = () => {
    if (generatedPrompts.length === 0) return;
    
    const content = generatedPrompts.map((p, i) => {
      return `--- PHÂN CẢNH ${i + 1} ---\n` +
             `NHÂN VẬT: ${p.characterName}\n\n` +
             `PROMPT (TIẾNG ANH):\n${p.prompt}\n\n` +
             `DỊCH (TIẾNG VIỆT):\n${p.translation}\n\n` +
             `PROMPT (TIẾNG TRUNG):\n${p.chinesePrompt}\n\n` +
             `--------------------------\n\n`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fashion-ai-prompts-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDurationChange = (amount: number) => {
    setDuration(prev => Math.max(12, prev + amount));
  };

  const callGeminiAnalysis = async (retryCount = 0) => {
    setLoadingAnalysis(true);
    setError(null);

    const selectedStyle = FASHION_STYLES.find(s => s.id === style);
    
    const systemPrompt = `
      BẠN LÀ CHUYÊN GIA PHÂN TÍCH NGƯỜI MẪU VÀ BỐI CẢNH THỜI TRANG.
      NHIỆM VỤ: Dựa trên phong cách quay phim thời trang, hãy đề xuất thông tin người mẫu và bối cảnh phù hợp nhất.
      
      PHONG CÁCH: ${selectedStyle?.label} - ${selectedStyle?.description}
      
      YÊU CẦU:
      1. Tên người mẫu (Model Name): Mặc định là "NAM" nếu giới tính Nam, "NGỌC" nếu giới tính Nữ.
      2. Giới tính (Gender): Nam hoặc Nữ.
      3. Trang phục (Costume): Mô tả trang phục đẳng cấp phù hợp với phong cách ${selectedStyle?.label}.
      4. Bối cảnh (Location): Studio, Urban, Nature, v.v. (Mô tả không quá 6 từ).
      5. Thời gian (Time): Ánh sáng cụ thể (Golden hour, Studio lighting, v.v.) (Mô tả không quá 6 từ).
      
      Trả về định dạng JSON: { "name": "...", "gender": "...", "costume": "...", "location": "...", "time": "..." }
    `;

    const userPrompt = `Đề xuất người mẫu và bối cảnh cho phong cách thời trang: ${selectedStyle?.label}`;

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
        setCharacterAnalysis(result);
        setStep(2);
      } else {
        throw new Error("Không nhận được phân tích từ AI.");
      }
    } catch (err) {
      console.error(err);
      if (retryCount < 2) {
        setTimeout(() => callGeminiAnalysis(retryCount + 1), 1000);
      } else {
        setError("Không thể kết nối với AI để phân tích người mẫu. Vui lòng thử lại.");
      }
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const callGeminiContextSuggestion = async () => {
    if (!characterAnalysis) return;
    setLoadingContextSuggestion(true);
    setError(null);

    const selectedStyle = FASHION_STYLES.find(s => s.id === style);
    
    const systemPrompt = `
      BẠN LÀ CHUYÊN GIA BỐI CẢNH PHIM THỜI TRANG.
      NHIỆM VỤ: Đề xuất bối cảnh (Location) và thời gian/ánh sáng (Time) phù hợp nhất cho video thời trang.
      
      PHONG CÁCH: ${selectedStyle?.label}
      NGƯỜI MẪU: ${characterAnalysis.name} (${characterAnalysis.gender})
      TRANG PHỤC: ${costumeSource === 'image' ? costumeImageDescription : characterAnalysis.costume}
      
      YÊU CẦU:
      1. Bối cảnh (Location): Mô tả địa điểm quay phim ấn tượng, THẬT NGẮN GỌN VÀ CHI TIẾT (Không quá 6 từ).
      2. Thời gian (Time): Mô tả ánh sáng và thời điểm cụ thể để tôn vinh trang phục, THẬT NGẮN GỌN VÀ CHI TIẾT (Không quá 6 từ).
      
      Trả về định dạng JSON: { "location": "...", "time": "..." }
    `;

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: "Hãy gợi ý bối cảnh và thời gian phù hợp." }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              time: { type: Type.STRING }
            },
            required: ["location", "time"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.location && result.time) {
        setCharacterAnalysis({
          ...characterAnalysis,
          location: result.location,
          time: result.time
        });
      }
    } catch (err) {
      console.error(err);
      setError("Không thể gợi ý bối cảnh. Vui lòng thử lại.");
    } finally {
      setLoadingContextSuggestion(false);
    }
  };

  const callGeminiScenes = async (retryCount = 0) => {
    if (!characterAnalysis) return;
    
    setLoadingScenes(true);
    setError(null);

    const selectedStyle = FASHION_STYLES.find(s => s.id === style);
    const numScenes = Math.max(1, Math.floor(duration / 12));
    
    const systemPrompt = `
      BẠN LÀ MỘT GIÁM ĐỐC ĐẠO DIỄN (DIRECTOR) VÀ GIÁM ĐỐC HÌNH ẢNH (DP) ĐẲNG CẤP THẾ GIỚI.
      NHIỆM VỤ: Tạo ra ${numScenes} phân cảnh chi tiết cho video thời trang chân thật nhất, đẹp nhất và mang tính điện ảnh (cinematic) cao nhất.
      
      THÔNG TIN BẮT BUỘC PHẢI ĐƯA VÀO TẤT CẢ CÁC PHÂN CẢNH (PROMPTS):
      - PHONG CÁCH QUAY: ${selectedStyle?.label}
      - NGƯỜI MẪU: ${characterAnalysis.name} (${characterAnalysis.gender})
      - BỐI CẢNH: ${characterAnalysis.location}
      - THỜI GIAN/ÁNH SÁNG: ${characterAnalysis.time}
      - TRANG PHỤC: ${costumeSource === 'image' ? costumeImageDescription : characterAnalysis.costume}
      - THỜI LƯỢNG TỔNG: ${duration} giây.
      
      YÊU CẦU NGHIÊM NGẶT (STRICT REQUIREMENTS):
      1. MỖI PHÂN CẢNH (PROMPT) PHẢI BẮT ĐẦU BẰNG VIỆC NHẮC LẠI ĐẦY ĐỦ: Tên người mẫu, giới tính, trang phục, bối cảnh và ánh sáng để đảm bảo tính nhất quán.
      2. GIỮ NGUYÊN HÌNH DÁNG, CHI TIẾT SẢN PHẨM (Keep product shape and details exactly).
      3. GIỮ NGUYÊN CHỮ VÀ LOGO TRÊN SẢN PHẨM (Keep all text and logos on the product unchanged).
      4. TUYỆT ĐỐI KHÔNG THAY ĐỔI CHI TIẾT SẢN PHẨM (Absolutely no changes to product details).
      5. LƯU Ý QUAN TRỌNG: Tên nhân vật (${characterAnalysis.name}) và thông tin trang phục (${costumeSource === 'image' ? costumeImageDescription : characterAnalysis.costume}) PHẢI ĐƯỢC GIỮ NGUYÊN (không dịch, không thay đổi) trong cả bản tiếng Anh (prompt) và tiếng Trung (chinese).
      
      YÊU CẦU VỀ PHONG CÁCH VIẾT PROMPT:
      - NGẮN GỌN NHƯNG CHI TIẾT: Viết súc tích, tập trung vào hành động vật lý và hình ảnh điện ảnh. Tránh diễn giải dài dòng.
      - RIÊNG BẢN DỊCH TIẾNG VIỆT (translation): Phải CỰC KỲ NGẮN GỌN, XÚC TÍCH, chỉ tập trung vào các hành động chính và đặc điểm hình ảnh quan trọng nhất. Loại bỏ các từ nối hoặc mô tả phụ không cần thiết.
      
      YÊU CẦU CHI TIẾT CHO MỖI PHÂN CẢNH:
      1. ĐÓNG VAI ĐẠO DIỄN: Mô tả hành động và cảm xúc của nhân vật một cách tinh tế.
      2. KHÔNG CÓ THOẠI: Sử dụng ngôn ngữ hình thể (body language), ánh mắt và biểu cảm khuôn mặt.
      3. PHÂN CHIA THỜI GIAN (Timeline): Mỗi phân cảnh dài đúng 12 giây. Chia chi tiết cử chỉ và hành động theo các mốc:
         - 0-3s: [Hành động/Cử chỉ]
         - 3-6s: [Hành động/Cử chỉ]
         - 6-9s: [Hành động/Cử chỉ]
         - 9-12s: [Hành động/Cử chỉ]
      4. GÓC QUAY (DP): Mô tả góc máy, chuyển động camera (slow motion, tracking, close-up) và ánh sáng cinematic.
      
      Ngôn ngữ: 'prompt' (Tiếng Anh chi tiết), 'translation' (Tiếng Việt - CỰC KỲ NGẮN GỌN & XÚC TÍCH), 'chinese' (Tiếng Trung).
      Trả về định dạng JSON mảng 'data' chứa 'prompt', 'translation', 'chinese', 'characterName'.
    `;

    const parts: any[] = [{ text: `Hãy tạo ${numScenes} phân cảnh thời trang điện ảnh cho phong cách ${selectedStyle?.label} với người mẫu ${characterAnalysis.name}. Bối cảnh: ${characterAnalysis.location}, Ánh sáng: ${characterAnalysis.time}.` }];
    
    if (costumeSource === 'image' && costumeImageDescription) {
      parts.push({ text: `MÔ TẢ TRANG PHỤC DỰA TRÊN ẢNH THAM CHIẾU: ${costumeImageDescription}. HÃY SỬ DỤNG THÔNG TIN NÀY CHO NGƯỜI MẪU.` });
    } else {
      parts.push({ text: `Mô tả trang phục: ${characterAnalysis.costume}` });
    }
    
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts }],
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
          translation: item.translation,
          chinesePrompt: item.chinese,
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

  const reset = () => {
    setStep(1);
    setCharacterAnalysis(null);
    setGeneratedPrompts([]);
    setError(null);
    setCostumeImageDescription('Ảnh trang phục tham chiếu');
    setCostumeSource('text');
  };

  const updateScenePrompt = (index: number, updatedPrompt: CinematicPrompt) => {
    setGeneratedPrompts(prev => prev.map((p, i) => i === index ? updatedPrompt : p));
  };

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-8 w-full px-4">
        {[
          { n: 1, label: 'CẤU HÌNH', icon: Settings },
          { n: 2, label: 'NGƯỜI MẪU', icon: UserIcon },
          { n: 3, label: 'PHÂN CẢNH', icon: Film }
        ].map((s) => (
          <div key={s.n} className="flex flex-col items-center relative flex-1">
            <motion.div 
              initial={false}
              animate={{
                scale: step === s.n ? 1.05 : 1,
                backgroundColor: step >= s.n ? "#F97316" : "#FFFFFF",
                borderColor: step >= s.n ? "#F97316" : "#E2E8F0",
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Configuration */}
              <div className="lg:col-span-4 space-y-6">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 h-full">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-500" />
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

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gợi ý</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Chọn phong cách quay phim phù hợp với bộ sưu tập của bạn. AI sẽ tự động đề xuất người mẫu, trang phục và bối cảnh tối ưu nhất.
                    </p>
                  </div>
                </section>
              </div>

              {/* Right Column: Style */}
              <div className="lg:col-span-8 space-y-6">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-6">
                    <Camera className="w-5 h-5 text-orange-500" />
                    <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Phong cách Quay phim</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {FASHION_STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={cn(
                          "p-4 text-left rounded-xl border transition-all flex flex-col gap-1",
                          style === s.id ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Style</span>
                          {style === s.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                        </div>
                        <span className={cn("text-sm font-bold leading-tight", style === s.id ? 'text-orange-700' : 'text-slate-700')}>{s.label}</span>
                        <span className="text-[10px] text-slate-500 line-clamp-2">{s.description}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="flex justify-center pt-8">
              <button
                onClick={() => callGeminiAnalysis()}
                disabled={loadingAnalysis}
                className={cn(
                  "w-full max-w-3xl py-7 rounded-3xl font-black text-lg flex items-center justify-center gap-4 transition-all shadow-2xl uppercase tracking-[0.25em] relative overflow-hidden group",
                  loadingAnalysis 
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.97] hover:shadow-orange-500/20'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-amber-600/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                {loadingAnalysis ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : (
                  <div className="relative flex items-center gap-4">
                    <Zap className="w-7 h-7 text-yellow-400 fill-yellow-400 animate-pulse" />
                    <span>BƯỚC TIẾP: PHÂN TÍCH NGƯỜI MẪU</span>
                    <ChevronRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                  </div>
                )}
              </button>
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
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Thông tin Người mẫu & Bối cảnh</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Đảm bảo thần thái và phong cách thời trang</p>
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
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Thông tin Người mẫu</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tên người mẫu</label>
                        <input 
                          type="text"
                          value={characterAnalysis.name}
                          onChange={(e) => setCharacterAnalysis({...characterAnalysis, name: e.target.value})}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Giới tính</label>
                          <div className="flex gap-2">
                            {['Nam', 'Nữ'].map(g => (
                              <button
                                key={g}
                                onClick={() => {
                                  const isDefaultName = !characterAnalysis.name || characterAnalysis.name === 'Nam' || characterAnalysis.name === 'Nữ';
                                  setCharacterAnalysis({
                                    ...characterAnalysis, 
                                    gender: g,
                                    name: isDefaultName ? g : characterAnalysis.name
                                  });
                                }}
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
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trang phục</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                            <button
                              onClick={() => setCostumeSource('text')}
                              className={cn(
                                "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                                costumeSource === 'text' ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"
                              )}
                            >
                              Mô tả
                            </button>
                            <button
                              onClick={() => setCostumeSource('image')}
                              className={cn(
                                "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                                costumeSource === 'image' ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"
                              )}
                            >
                              Ảnh tham chiếu
                            </button>
                          </div>
                        </div>

                        {costumeSource === 'text' ? (
                          <textarea 
                            value={characterAnalysis.costume}
                            onChange={(e) => setCharacterAnalysis({...characterAnalysis, costume: e.target.value})}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                            placeholder="Mô tả trang phục chi tiết..."
                          />
                        ) : (
                          <textarea 
                            value={costumeImageDescription}
                            onChange={(e) => setCostumeImageDescription(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                            placeholder="Ảnh trang phục tham chiếu..."
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Môi trường & Bối cảnh</h3>
                      <button
                        onClick={callGeminiContextSuggestion}
                        disabled={loadingContextSuggestion}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                          loadingContextSuggestion 
                            ? "bg-slate-50 text-slate-300 border-slate-100" 
                            : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 active:scale-95"
                        )}
                      >
                        {loadingContextSuggestion ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        AI GỢI Ý BỐI CẢNH
                      </button>
                    </div>
                    
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
                  </div>
                </div>
              )}

              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-[0.98] uppercase tracking-widest"
                >
                  <ArrowLeft className="w-5 h-5" />
                  QUAY LẠI
                </button>
                <button
                  onClick={() => callGeminiScenes()}
                  disabled={loadingScenes}
                  className={cn(
                    "w-full sm:w-auto px-12 py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl uppercase tracking-widest",
                    loadingScenes ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                  )}
                >
                  {loadingScenes ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 text-yellow-400" />}
                  {loadingScenes ? 'Đang tạo prompt...' : 'BƯỚC TIẾP: TẠO PROMPT'}
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
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">5 Phân cảnh Video Thời trang</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Phong cách: {FASHION_STYLES.find(s => s.id === style)?.label} | Người mẫu: {characterAnalysis?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {generatedPrompts.length > 0 && (
                    <button 
                      onClick={handleDownloadAll}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                      title="Tải xuống tất cả prompt"
                    >
                      <Download className="w-4 h-4" />
                      TẢI XUỐNG TẤT CẢ
                    </button>
                  )}
                  <button 
                    onClick={() => setStep(2)}
                    className="p-3 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200 text-slate-600"
                    title="Quay lại"
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
                          <span className="text-[10px] text-orange-600 font-bold uppercase">Người mẫu: {item.characterName}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <PromptEditor 
                        prompt={item} 
                        onUpdate={(updated) => updateScenePrompt(index, updated)} 
                        sceneId={`fashion-scene-${index}`}
                      />
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-10 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  QUAY LẠI
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5 text-green-400" />
                  HOÀN TẤT & QUAY LẠI
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FashionAiModule;
