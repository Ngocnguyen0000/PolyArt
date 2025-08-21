

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Settings, Sampler, ColorSpace, LowPolyOutput } from './types';
import { generateLowPolyData } from './services/lowpoly';
import { ControlPanel } from './components/ControlPanel';
import { Preview } from './components/Preview';
import { SpinnerIcon } from './components/ui';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    maxSize: 1024,
    points: 2000,
    sampler: Sampler.EDGE_AWARE,
    seed: 42,
    edgeWeight: 0.8,
    colorSpace: ColorSpace.LAB,
    withNeighbors: true,
    previewOutline: true,
    showPointIds: false,
  });

  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string>('input.png');
  const [lowPolyData, setLowPolyData] = useState<LowPolyOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);

  const svgRef = useRef<SVGSVGElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSourceFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setSourceImage(img);
          setLowPolyData(null);
          setError(null);
        };
        img.onerror = () => {
            setError("Không thể tải tệp hình ảnh. Vui lòng thử một tệp khác.");
        }
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!sourceImage) {
      setError("Vui lòng tải lên một hình ảnh trước.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setLowPolyData(null);

    try {
        const startTime = performance.now();
        const data = await generateLowPolyData(sourceImage, sourceFileName, settings);
        const endTime = performance.now();
        setProcessingTime(endTime - startTime);
        setLowPolyData(data);
    } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định trong quá trình tạo.");
    } finally {
        setIsLoading(false);
    }
  }, [sourceImage, sourceFileName, settings]);
  
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!lowPolyData) return;
    const jsonString = JSON.stringify(lowPolyData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    triggerDownload(blob, 'output.json');
  };
  
  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    triggerDownload(blob, 'preview.svg');
  };

  const handleDownloadPNG = () => {
    if (!svgRef.current || !lowPolyData) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const { width, height } = lowPolyData.image;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if(blob) triggerDownload(blob, 'preview.png');
      }, 'image/png');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  };

  // Preload a sample image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setSourceImage(img);
        };
        img.src = "https://picsum.photos/seed/lowpoly/1024/768";
        setSourceFileName("sample.jpg");
    }, []);


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-800 font-sans">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
            <SpinnerIcon className="w-16 h-16 animate-spin text-indigo-400" />
            <p className="text-lg text-white mt-4">Đang tạo hình nghệ thuật Low Poly...</p>
        </div>
      )}

      <ControlPanel 
        settings={settings}
        setSettings={setSettings}
        onFileChange={handleFileChange}
        onGenerate={handleGenerate}
        onDownloadJSON={handleDownloadJSON}
        onDownloadSVG={handleDownloadSVG}
        onDownloadPNG={handleDownloadPNG}
        hasData={!!lowPolyData}
        isGenerating={isLoading}
        sourceImageLoaded={!!sourceImage}
        sourceImageSrc={sourceImage?.src || null}
      />
      
      <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center bg-gray-900 overflow-auto">
        <Preview 
          sourceImage={sourceImage}
          lowPolyData={lowPolyData}
          settings={settings}
          svgRef={svgRef}
          error={error}
        />
        {lowPolyData && (
             <div className="mt-4 text-xs text-gray-400">
                Đã tạo {lowPolyData.triangles.length} tam giác trong {Math.round(processingTime)}ms.
             </div>
        )}
      </main>
    </div>
  );
};

export default App;