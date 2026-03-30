
import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Clapperboard, 
  PenTool, 
  Zap, 
  ArrowRight, 
  PlayCircle, 
  CheckCircle2,
  HelpCircle,
  Video
} from 'lucide-react';

interface UserGuideModuleProps {
  onNavigate: (tab: 'single' | 'series' | 'story' | 'analysis' | 'marketing' | 'sales' | 'direct-sales' | 'fashion-ai') => void;
}

const UserGuideModule: React.FC<UserGuideModuleProps> = ({ onNavigate }) => {
  const guides = [
    {
      id: 'single',
      title: 'Prompt Đơn (Cinematic)',
      icon: Sparkles,
      color: 'bg-orange-500',
      description: 'Tạo prompt video AI chuyên nghiệp từ ý tưởng tiếng Việt. Tối ưu cho Jimeng, Luma, Runway.',
      steps: [
        'Nhập ý tưởng video bằng tiếng Việt (ví dụ: Một con rồng bay trên mây).',
        'Chọn nhân vật từ danh sách hoặc thêm mới để giữ tính nhất quán về ngoại hình.',
        'Hệ thống tự động dịch sang tiếng Anh chuyên ngành điện ảnh và tối ưu cấu trúc prompt.',
        'Sử dụng các nút "Copy" để lấy prompt và dán vào công cụ tạo video AI của bạn.',
        'Mẹo: Sử dụng nút "Làm mới" (RotateCcw) ở thanh menu nếu muốn bắt đầu lại từ đầu.'
      ]
    },
    {
      id: 'series',
      title: 'Phim Võ Thuật (Series)',
      icon: Clapperboard,
      color: 'bg-red-500',
      description: 'Xây dựng kịch bản phim hành động dài tập với logic va chạm vật lý cực mạnh.',
      steps: [
        'Nhập ý tưởng phim hoặc chọn từ danh sách xu hướng phim võ thuật.',
        'Phát triển kịch bản tổng thể (Outline) cho nhiều tập phim liên kết nhau.',
        'Chia nhỏ từng tập thành các cảnh quay ngắn (khoảng 12 giây mỗi cảnh).',
        'Tạo prompt có tính liên kết (Continuity) giúp nhân vật không bị thay đổi giữa các cảnh.',
        'Kiểm tra kỹ phần "Cameo" để đảm bảo trang phục nhân vật đồng nhất.'
      ]
    },
    {
      id: 'story',
      title: 'Xưởng Truyện (Story Studio)',
      icon: PenTool,
      color: 'bg-blue-500',
      description: 'Sáng tác truyện đa dạng chủ đề: Chủ tịch, Tình cảm, Kinh dị, Nấu ăn...',
      steps: [
        'Chọn chủ đề truyện mong muốn từ danh sách gợi ý phong phú.',
        'Nhấn "Gợi ý ý tưởng" để AI đưa ra các cốt truyện hấp dẫn hoặc tự nhập nội dung.',
        'Quản lý nhân vật: Đặt tên, chọn giới tính và trang phục (mặc định là Cameo).',
        'Phát triển kịch bản chi tiết từng cảnh quay kèm lời thoại và mô tả hành động.',
        'Review toàn bộ prompt ở Bước 3 trước khi xuất file hoặc copy sử dụng.'
      ]
    },
    {
      id: 'analysis',
      title: 'Phân tích Video (Video Analyzer)',
      icon: Video,
      color: 'bg-orange-400',
      description: 'Tải video lên để AI phân tích thoại, cảnh quay và tự động tạo kịch bản mới.',
      steps: [
        'Tải video cần phân tích lên hệ thống (Hỗ trợ MP4, WebM, tối đa 20MB).',
        'Nhấn "PHÂN TÍCH VIDEO" để AI trích xuất lời thoại và mô tả từng cảnh quay kèm timestamp.',
        'AI sẽ tự động đưa ra cốt truyện (Plot) tổng thể dựa trên nội dung video đã phân tích.',
        'Nhấn "TẠO KỊCH BẢN" để AI xây dựng một kịch bản phim mới (chia thành các tập 12s).',
        'Nhấn "CHIA PROMPT (12S)" ở mỗi tập để nhận prompt video AI chuyên nghiệp cho cảnh đó.'
      ]
    },
    {
      id: 'sales',
      title: 'Bán Hàng (Sales Module)',
      icon: Zap,
      color: 'bg-yellow-500',
      description: 'Tạo kịch bản video ngắn bán hàng, review sản phẩm theo các mô hình tâm lý khách hàng.',
      steps: [
        'Nhập thông tin sản phẩm/dịch vụ chi tiết (Tên, tính năng, lợi ích).',
        'Chọn chủ đề phim (ví dụ: Chủ tịch giả nghèo, Hợp đồng hôn nhân...) để lồng ghép sản phẩm.',
        'AI sẽ tạo kịch bản kịch tính, thu hút người xem từ những giây đầu tiên.',
        'Tùy chỉnh nhân vật và trang phục để phù hợp với thương hiệu của bạn.',
        'Xuất prompt video AI để tạo ra các clip quảng cáo chuyên nghiệp, chi phí thấp.'
      ]
    },
    {
      id: 'direct-sales',
      title: 'Bán hàng trực tiếp (Direct Sales)',
      icon: Video,
      color: 'bg-orange-600',
      description: 'Tạo prompt video Jimeng chuyên nghiệp cho bán hàng trực tiếp với thời lượng tùy chỉnh.',
      steps: [
        'Nhập thông tin sản phẩm chi tiết (Tên, đặc điểm, giá bán).',
        'Chọn vùng miền (Bắc, Trung, Nam) để AI tối ưu giọng điệu và văn hóa.',
        'Chọn phong cách bán hàng (Nói giá ngay, Trải nghiệm thực tế, Bí mật...).',
        'Tùy chỉnh thời lượng video theo bước nhảy 12 giây (12s, 24s, 36s...) để tối ưu cho Jimeng.',
        'Nhấn "TẠO PROMPT JIMENG" để nhận 5 phiên bản prompt (Anh, Việt, Trung) chuyên nghiệp.'
      ]
    },
    {
      id: 'fashion-ai',
      title: 'AI THỜI TRANG (Fashion AI)',
      icon: Sparkles,
      color: 'bg-purple-500',
      description: 'Tạo video thời trang chuyên nghiệp với người mẫu AI và bối cảnh được tối ưu tự động.',
      steps: [
        'Chọn phong cách quay phim thời trang (Runway, Studio, Street Style...).',
        'Tùy chỉnh thời lượng video (12s, 24s, 36s...) để tối ưu cho Jimeng.',
        'Nhấn "PHÂN TÍCH NGƯỜI MẪU" để AI tự động đề xuất người mẫu và bối cảnh phù hợp.',
        'Kiểm tra và tùy chỉnh thông tin người mẫu, trang phục và môi trường.',
        'Nhấn "TẠO PROMPT CHI TIẾT" để nhận 5 phân cảnh trình diễn thời trang đẳng cấp.'
      ]
    },
    {
      id: 'marketing',
      title: 'Giải pháp Marketing',
      icon: Zap,
      color: 'bg-indigo-500',
      description: 'Hệ sinh thái công cụ hỗ trợ doanh nghiệp tăng trưởng doanh số tự động.',
      steps: [
        'Khám phá các giải pháp Chatbot AI tự động trả lời bình luận và tin nhắn.',
        'Tối ưu hóa quy trình chăm sóc khách hàng đa kênh (Fanpage, Zalo, Website).',
        'Sử dụng công cụ gửi tin nhắn hàng loạt để tiếp cận khách hàng cũ hiệu quả.',
        'Tích hợp các giải pháp tự động hóa quy trình (Automation) giúp tiết kiệm nhân sự.',
        'Liên hệ trực tiếp để được demo và tư vấn giải pháp đo ni đóng giày cho doanh nghiệp.'
      ]
    }
  ];

  return (
    <div className="w-full px-2 md:px-4 py-6 md:py-12 space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100"
        >
          <HelpCircle className="w-4 h-4" />
          Trung tâm hỗ trợ người dùng
        </motion.div>
        <p className="text-slate-500 text-sm md:text-lg font-medium leading-relaxed">
          Khám phá sức mạnh của AI trong việc sáng tạo nội dung video và giải pháp Marketing. 
          Dưới đây là hướng dẫn chi tiết để bạn bắt đầu hành trình của mình.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {guides.map((guide, index) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-slate-100 rounded-[40px] p-8 md:p-10 shadow-sm hover:shadow-xl transition-all group flex flex-col"
          >
            <div className="flex items-start justify-between mb-8">
              <div className={`w-16 h-16 ${guide.color} rounded-2xl flex items-center justify-center shadow-lg shadow-current/20`}>
                <guide.icon className="w-8 h-8 text-white" />
              </div>
              <button
                onClick={() => onNavigate(guide.id as any)}
                className="p-4 bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-2xl transition-all group/btn"
              >
                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-4">{guide.title}</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">
              {guide.description}
            </p>

            <div className="space-y-4 mb-10 flex-grow">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Các bước thực hiện:</h4>
              {guide.steps.map((step, sIndex) => (
                <div key={sIndex} className="flex items-start gap-3">
                  <div className="mt-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  </div>
                  <span className="text-xs text-slate-600 font-bold leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate(guide.id as any)}
              className={`w-full py-5 ${guide.color} text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-current/20 hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-[0.98]`}
            >
              <PlayCircle className="w-5 h-5" />
              Bắt đầu sử dụng ngay
            </button>
          </motion.div>
        ))}
      </div>

      {/* FAQ / Tips Section */}
      <div className="bg-white border border-slate-100 rounded-[40px] p-8 md:p-12 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">Mẹo & Câu hỏi thường gặp</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-700">Làm sao để giữ nhân vật nhất quán?</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Sử dụng bảng quản lý nhân vật ở Bước 1. Khi bạn đặt tên và mô tả ngoại hình (ví dụ: "Nam, mặc vest đen"), AI sẽ tự động lồng ghép các chi tiết này vào mọi cảnh quay có mặt nhân vật đó.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-700">Tại sao prompt lại là tiếng Anh?</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Hầu hết các công cụ tạo video AI hiện nay (Jimeng, Runway, Luma) đều hiểu tốt nhất bằng tiếng Anh. Hệ thống của chúng tôi giúp bạn dịch và tối ưu hóa từ tiếng Việt sang tiếng Anh chuyên môn điện ảnh.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-700">Nút "Làm mới" dùng khi nào?</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Khi bạn muốn xóa sạch các dữ liệu tạm thời (kịch bản đang viết, ý tưởng đang làm dở) để bắt đầu một dự án hoàn toàn mới. Lưu ý: API Key của bạn vẫn được giữ nguyên.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-700">Quản lý nhiều API Key như thế nào?</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Bạn có thể thêm nhiều API Key trong phần Cài đặt (biểu tượng bánh răng). Hệ thống sẽ tự động xoay vòng (Rotate) các key này để tránh bị giới hạn lượt dùng (Rate limit) từ Google.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Support */}
      <div className="bg-orange-50 rounded-[40px] p-8 md:p-12 border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left">
          <h3 className="text-2xl font-black text-slate-800">Cần hỗ trợ thêm?</h3>
          <p className="text-slate-500 text-sm font-medium max-w-md">
            Nếu bạn gặp bất kỳ khó khăn nào trong quá trình sử dụng, đừng ngần ngại liên hệ với đội ngũ kỹ thuật của chúng tôi.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://zalo.me/0981028794"
            target="_blank"
            rel="noreferrer"
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all text-center"
          >
            Hỗ trợ Zalo
          </a>
          <div className="px-10 py-4 bg-white border border-orange-200 text-orange-600 rounded-2xl font-black uppercase tracking-widest text-xs text-center">
            Hotline: 098.102.8794
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModule;
