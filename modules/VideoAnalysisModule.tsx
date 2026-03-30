import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Video, 
  FileSearch, 
  Wand2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Scissors,
  Copy,
  RotateCcw
} from 'lucide-react';
import { analyzeVideo, generateScreenplay, generateFinalPrompt } from '../services/promptService';
import { VideoAnalysisResult, Screenplay } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const VideoAnalysisModule: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [generatedScript, setGeneratedScript] = useState<Screenplay | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState<Record<number, boolean>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError("Dung lượng video tối đa là 20MB.");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setAnalysis(null);
      setGeneratedScript(null);
      setGeneratingPrompts({});
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeVideo(base64, file.type);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi phân tích video. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!analysis) return;
    setIsGeneratingScript(true);
    try {
      // Use the plot from analysis to generate a screenplay
      // Each episode is 12s (0.2 minutes)
      const res = await generateScreenplay(analysis.plot, 10, 0.2); 
      setGeneratedScript(res);
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi tạo kịch bản.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleSplitPrompt = async (episodeId: number) => {
    if (!generatedScript) return;
    const episode = generatedScript.episodes.find(e => e.id === episodeId);
    if (!episode) return;

    setGeneratingPrompts(prev => ({ ...prev, [episodeId]: true }));
    try {
      // For video analysis, we use a simpler prompt generation logic
      // We can use generateFinalPrompt from promptService
      const context = `PHIM PHÂN TÍCH TỪ VIDEO: ${generatedScript.overallPlot}\nTẬP ${episodeId}: ${episode.title}`;
      
      // We don't have character management here yet, so we pass empty array
      // But we can try to detect them from the summary if we want to be fancy
      // For now, let's keep it simple as requested
      const res = await generateFinalPrompt(
        episode.summary,
        context,
        [], // No characters for now
        'action-drama',
        undefined,
        undefined
      );

      setGeneratedScript(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          episodes: prev.episodes.map(e => {
            if (e.id === episodeId) {
              return {
                ...e,
                scenes: [{
                  id: `analysis-scene-${episodeId}`,
                  description: e.summary,
                  finalPrompt: res
                }]
              };
            }
            return e;
          })
        };
      });
    } catch (err) {
      console.error(err);
      setError(`Lỗi khi tạo prompt cho tập ${episodeId}`);
    } finally {
      setGeneratingPrompts(prev => ({ ...prev, [episodeId]: false }));
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setGeneratedScript(null);
    setGeneratingPrompts({});
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Đã copy vào bộ nhớ tạm!");
  };

  return (
    <div className="w-full space-y-8">
      <div className="luxury-card p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 shadow-sm">
            <Video className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Phân tích Video & Tạo kịch bản</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">AI Video Analyzer</p>
          </div>
        </div>

        {!analysis && !file && (
          <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-orange-300 transition-colors group relative">
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-orange-50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-orange-500" />
              </div>
              <div>
                <p className="text-slate-600 font-bold">Tải video lên để phân tích</p>
                <p className="text-slate-400 text-xs mt-1">Hỗ trợ MP4, WebM (Tối đa 20MB)</p>
              </div>
            </div>
          </div>
        )}

        {file && !analysis && (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video max-w-2xl mx-auto">
              <video src={previewUrl!} controls className="w-full h-full" />
              <button 
                onClick={reset}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="btn-primary px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <FileSearch className="w-5 h-5" />
                    ANALYZE VIDEO
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {analysis && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Plot Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Cốt truyện trích xuất</h3>
                </div>
                <div className="p-6 bg-orange-50/50 border border-orange-100 rounded-3xl text-slate-700 leading-relaxed italic">
                  "{analysis.plot}"
                </div>
                
                {!generatedScript && (
                  <button
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                    className="w-full btn-secondary py-4"
                  >
                    {isGeneratingScript ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Wand2 className="w-5 h-5" />
                    )}
                    GENERATE SCRIPT FROM PLOT
                  </button>
                )}
              </div>

              {/* Scenes & Dialogue */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Chi tiết thoại & Cảnh</h3>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {analysis.scenes.map((scene, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx} 
                      className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-orange-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {scene.timestamp}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mb-1">{scene.description}</p>
                      <p className="text-xs text-slate-500 italic">"{scene.dialogue}"</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Script Section */}
            {generatedScript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 border-t border-slate-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold text-slate-800">Kịch bản đã tạo</h3>
                  </div>
                  <button 
                    onClick={() => setGeneratedScript(null)}
                    className="text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors"
                  >
                    Refresh script
                  </button>
                </div>

                <div className="space-y-6">
                  {generatedScript.episodes.map((ep) => (
                    <div key={ep.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div>
                          <h4 className="font-bold text-slate-800 mb-2">Tập {ep.id}: {ep.title}</h4>
                          <p className="text-sm text-slate-600">{ep.summary}</p>
                        </div>
                        <button
                          onClick={() => handleSplitPrompt(ep.id)}
                          disabled={generatingPrompts[ep.id]}
                          className="btn-secondary py-2 px-4 text-xs flex-shrink-0"
                        >
                          {generatingPrompts[ep.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Scissors className="w-4 h-4" />
                          )}
                          SPLIT PROMPT (12S)
                        </button>
                      </div>

                      {ep.scenes && ep.scenes.length > 0 && ep.scenes[0].finalPrompt && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-4 bg-white border border-orange-100 rounded-2xl space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Prompt Video AI (12s)</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => copyToClipboard(ep.scenes[0].finalPrompt!.chinesePrompt)}
                                className="p-2 hover:bg-orange-50 rounded-lg text-orange-500 transition-colors"
                                title="Copy Prompt Trung"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Jimeng/Veo Prompt:</p>
                              <p className="text-xs text-slate-700 font-mono break-words">{ep.scenes[0].finalPrompt.chinesePrompt}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">English Prompt:</p>
                              <p className="text-xs text-slate-700 font-mono break-words">{ep.scenes[0].finalPrompt.prompt}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                  
                  <div className="p-6 bg-orange-500 text-white rounded-3xl shadow-lg shadow-orange-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold">Kịch bản đã sẵn sàng!</p>
                      <p className="text-xs opacity-90">Bạn có thể sử dụng cốt truyện này để tiếp tục chia cảnh chi tiết.</p>
                    </div>
                    <button 
                      onClick={() => {
                        alert("Kịch bản đã được lưu. Bạn có thể chuyển sang tab 'Prompt Đơn' để tiếp tục.");
                      }}
                      className="px-6 py-2 bg-white text-orange-50 rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors"
                    >
                      USE NOW
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="flex justify-center pt-4">
              <button 
                onClick={reset}
                className="flex items-center gap-2 text-slate-400 hover:text-orange-500 transition-colors text-xs font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                ANALYZE ANOTHER VIDEO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoAnalysisModule;
