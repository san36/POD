
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppStatus, ProcessingResult } from './types';
import { processPatternImage } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startProcessing = useCallback(async (base64: string) => {
    try {
      setStatus(AppStatus.GENERATING);
      const { templateImage, description } = await processPatternImage(base64);
      
      setResult({
        originalImage: base64,
        templateImage,
        description,
        timestamp: Date.now()
      });
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "处理过程中发生未知错误，请确保 API 密钥配置正确。");
      setStatus(AppStatus.ERROR);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(AppStatus.UPLOADING);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      startProcessing(base64);
    };
    reader.onerror = () => {
      setError("读取文件失败。");
      setStatus(AppStatus.ERROR);
    };
    reader.readAsDataURL(file);
  };

  // 监听粘贴事件
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setStatus(AppStatus.UPLOADING);
            setError(null);
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              startProcessing(base64);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [startProcessing]);

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.templateImage;
    link.download = `印刷模版-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col pattern-bg">
      {/* 导航栏 */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-2 rounded-xl shadow-sm">
                <i className="fas fa-layer-group text-white text-xl"></i>
              </div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tighter">
                PatternStudio <span className="text-blue-600 font-black">Pro</span>
              </h1>
            </div>
            <div className="hidden md:flex space-x-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>色彩零偏差</span>
              <span>•</span>
              <span>规整矩形</span>
              <span>•</span>
              <span>印刷就绪</span>
            </div>
          </div>
        </div>
      </nav>

      {/* 主体内容 */}
      <main className="flex-grow container mx-auto px-4 py-12 max-w-5xl">
        <header className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            图案 <span className="text-blue-600 italic">高保真提取与还原</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            色彩同步 ｜ 强制裁切 ｜ 边缘找平 ｜ 支持直接粘贴图片
          </p>
        </header>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden transition-all duration-300">
          {status === AppStatus.IDLE && (
            <div className="p-8 md:p-12">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-24 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group relative"
              >
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <i className="fas fa-paste text-blue-600 text-4xl"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">点击上传 或 直接粘贴</h3>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">使用 <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-300 font-sans text-xs">Ctrl+V</kbd> 粘贴截图，系统将自动切除无效边距并提取图案。</p>
                <button className="bg-slate-900 text-white px-12 py-4 rounded-xl font-black shadow-xl hover:bg-blue-600 transition-all">
                  选择图案照片
                </button>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*"
                />
              </div>
            </div>
          )}

          {(status === AppStatus.GENERATING || status === AppStatus.UPLOADING) && (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50/30">
              <div className="relative mb-12">
                <div className="w-32 h-32 border-[6px] border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600">
                  <i className="fas fa-microchip text-3xl animate-pulse"></i>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">
                {status === AppStatus.UPLOADING ? '正在读取图案...' : '正在进行工业级数字还原...'}
              </h3>
              <p className="text-slate-400 font-bold italic">正在移除褶皱并确保边缘平直...</p>
            </div>
          )}

          {status === AppStatus.ERROR && (
            <div className="text-center py-24 px-8">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-circle-exclamation text-rose-500 text-3xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">处理失败</h3>
              <p className="text-rose-600 mb-8 bg-rose-50 py-3 px-6 rounded-lg inline-block border border-rose-100 font-medium italic">{error}</p>
              <br/>
              <button 
                onClick={reset}
                className="bg-slate-900 text-white px-12 py-4 rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg"
              >
                返回重试
              </button>
            </div>
          )}

          {status === AppStatus.COMPLETED && result && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
                <div className="flex items-center space-x-3 font-black uppercase tracking-widest text-[10px]">
                  <i className="fas fa-check-circle text-blue-400"></i>
                  <span>高精度提取完成 ｜ 色彩已锁定</span>
                </div>
                <div className="text-[10px] opacity-60 font-medium italic">处理于 {new Date(result.timestamp).toLocaleTimeString()}</div>
              </div>
              
              <div className="p-8 md:p-12 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">物理照片参考</span>
                      <i className="fas fa-camera text-slate-200 text-xs"></i>
                    </div>
                    <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 ring-4 ring-slate-100/50">
                      <img src={result.originalImage} alt="Original" className="w-full h-full object-cover grayscale-[20%]" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">印刷级输出稿</span>
                        <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">规整矩形</span>
                      </div>
                      <i className="fas fa-print text-blue-300 text-xs"></i>
                    </div>
                    <div className="aspect-square rounded-2xl overflow-hidden border-[4px] border-blue-500 shadow-2xl shadow-blue-100/50 relative group bg-white ring-8 ring-blue-50">
                      <img src={result.templateImage} alt="Template" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
                         <button onClick={downloadImage} className="bg-white text-blue-600 p-6 rounded-3xl shadow-2xl hover:scale-110 transition-transform mb-4">
                            <i className="fas fa-download text-2xl"></i>
                         </button>
                         <p className="text-white font-black text-sm tracking-widest uppercase">点击保存无边距模版</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-10 border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                    <i className="fas fa-print text-9xl"></i>
                  </div>
                  <h4 className="font-black text-slate-800 mb-8 flex items-center text-xl">
                    <i className="fas fa-clipboard-check text-blue-600 mr-4"></i>
                    提取报告
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">几何处理</p>
                      <p className="text-sm font-black text-slate-700">边缘直角找平</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">色彩校验</p>
                      <p className="text-sm font-black text-slate-700">100% 原始色谱</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">边距状态</p>
                      <p className="text-sm font-black text-slate-700">强制剪裁无边框</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">干扰过滤</p>
                      <p className="text-sm font-black text-slate-700">褶皱与杂物已清除</p>
                    </div>
                  </div>
                  <p className="mt-8 pt-8 border-t border-slate-200 text-slate-400 text-xs italic font-medium">
                    说明：{result.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 border-t border-slate-100">
                  <button 
                    onClick={downloadImage}
                    className="bg-blue-600 text-white px-16 py-6 rounded-2xl font-black shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center group"
                  >
                    <i className="fas fa-file-export mr-4 text-xl group-hover:scale-125 transition-transform"></i>
                    导出印刷模版 (PNG)
                  </button>
                  <button 
                    onClick={reset}
                    className="bg-white text-slate-600 border-2 border-slate-200 px-16 py-6 rounded-2xl font-black hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center"
                  >
                    <i className="fas fa-redo-alt mr-4"></i>
                    处理下一张
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-slate-200 py-16 mt-24">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-3 mb-8 opacity-20 grayscale">
             <i className="fas fa-layer-group text-slate-900"></i>
             <span className="font-black tracking-widest uppercase">PatternStudio Pro</span>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
            © 2025 PatternStudio Pro • 高保真数字图案数字化引擎
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
