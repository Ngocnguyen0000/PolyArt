

import React from 'react';
import { Settings, Sampler, ColorSpace } from '../types';
import { Slider, Select, Checkbox, FileInput, Button, Section } from './ui';
import { GithubIcon, DownloadIcon, PlayIcon, JsonIcon, SvgIcon, PngIcon, WandIcon } from './ui';

interface ControlPanelProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onDownloadJSON: () => void;
  onDownloadSVG: () => void;
  onDownloadPNG: () => void;
  hasData: boolean;
  isGenerating: boolean;
  sourceImageLoaded: boolean;
  sourceImageSrc: string | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  setSettings,
  onFileChange,
  onGenerate,
  onDownloadJSON,
  onDownloadSVG,
  onDownloadPNG,
  hasData,
  isGenerating,
  sourceImageLoaded,
  sourceImageSrc,
}) => {
  const handleSettingChange = <K extends keyof Settings,>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const randomizeSeed = () => {
    handleSettingChange('seed', Math.floor(Math.random() * 100000));
  };

  return (
    <aside className="w-full md:w-96 bg-gray-800 text-gray-200 p-6 flex-shrink-0 space-y-6 overflow-y-auto max-h-screen">
      <header className="flex items-center justify-between border-b border-gray-700 pb-4">
        <div className="flex items-center gap-3">
            <WandIcon className="w-8 h-8 text-indigo-400"/>
            <h1 className="text-2xl font-bold text-white">Trình tạo Low Poly</h1>
        </div>
        <a href="https://github.com/google/generative-ai-docs/tree/main/app-development/web" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
          <GithubIcon className="w-6 h-6" />
        </a>
      </header>

      <Section title="1. Hình ảnh đầu vào" defaultOpen>
        <div className="space-y-4">
          <FileInput onChange={onFileChange} />
          {sourceImageSrc && (
            <div>
              <span className="text-xs text-gray-400 block mb-2">Xem trước:</span>
              <img 
                src={sourceImageSrc} 
                alt="Input preview" 
                className="rounded-md border border-gray-600"
              />
            </div>
          )}
        </div>
      </Section>

      <Section title="2. Cài đặt tạo hình" defaultOpen>
        <div className="space-y-4">
          <Slider
            label="Kích thước ảnh tối đa"
            min={256}
            max={2048}
            step={128}
            value={settings.maxSize}
            onChange={(v) => handleSettingChange('maxSize', v)}
            unit="px"
          />
          <Slider
            label="Số lượng điểm"
            min={100}
            max={10000}
            step={100}
            value={settings.points}
            onChange={(v) => handleSettingChange('points', v)}
          />
          <Select
            label="Trình lấy mẫu điểm"
            value={settings.sampler}
            onChange={(v) => handleSettingChange('sampler', v as Sampler)}
            options={[
              { value: Sampler.EDGE_AWARE, label: 'Nhận biết cạnh' },
              { value: Sampler.POISSON, label: 'Đĩa Poisson' },
              { value: Sampler.GRID, label: 'Lưới' },
            ]}
          />
          {settings.sampler === Sampler.EDGE_AWARE && (
            <Slider
              label="Trọng số cạnh"
              min={0.1}
              max={1.0}
              step={0.1}
              value={settings.edgeWeight}
              onChange={(v) => handleSettingChange('edgeWeight', v)}
            />
          )}
          <div className="flex items-center space-x-2">
            <label className="block text-sm font-medium text-gray-300 w-full">
              Seed ngẫu nhiên
              <input
                type="number"
                value={settings.seed}
                onChange={(e) => handleSettingChange('seed', parseInt(e.target.value, 10))}
                className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
              />
            </label>
            <button onClick={randomizeSeed} className="mt-6 p-2 bg-gray-600 hover:bg-gray-500 rounded-md" title="Tạo seed ngẫu nhiên">
              <WandIcon className="w-5 h-5" />
            </button>
          </div>
           <Select
            label="Không gian màu"
            value={settings.colorSpace}
            onChange={(v) => handleSettingChange('colorSpace', v as ColorSpace)}
            options={[
              { value: ColorSpace.LAB, label: 'CIELAB (Cảm nhận)' },
              { value: ColorSpace.RGB, label: 'RGB (Trực tiếp)' },
            ]}
          />
        </div>
      </Section>
      
      <div className="pt-4">
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating || !sourceImageLoaded} 
          className="w-full"
        >
          <PlayIcon className="w-5 h-5 mr-2" />
          {isGenerating ? 'Đang tạo...' : 'Tạo hình'}
        </Button>
      </div>

      <Section title="3. Đầu ra & Xem trước" defaultOpen>
         <div className="space-y-4">
            <Checkbox
                label="Bao gồm dữ liệu lân cận"
                checked={settings.withNeighbors}
                onChange={(c) => handleSettingChange('withNeighbors', c)}
                />
            <Checkbox
                label="Hiển thị viền xem trước"
                checked={settings.previewOutline}
                onChange={(c) => handleSettingChange('previewOutline', c)}
                />
            <Checkbox
                label="Hiển thị ID tam giác"
                checked={settings.showPointIds}
                onChange={(c) => handleSettingChange('showPointIds', c)}
            />
            <div className="pt-4 space-y-2">
                 <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DownloadIcon className="w-5 h-5" />
                    Tải xuống tài sản
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                     <Button variant="secondary" onClick={onDownloadJSON} disabled={!hasData || isGenerating}>
                        <JsonIcon className="w-4 h-4 mr-2" />
                        JSON
                     </Button>
                     <Button variant="secondary" onClick={onDownloadSVG} disabled={!hasData || isGenerating}>
                        <SvgIcon className="w-4 h-4 mr-2" />
                        SVG
                     </Button>
                     <Button variant="secondary" onClick={onDownloadPNG} disabled={!hasData || isGenerating}>
                        <PngIcon className="w-4 h-4 mr-2" />
                        PNG
                     </Button>
                 </div>
            </div>
        </div>
      </Section>
    </aside>
  );
};