

import React, { useState } from 'react';
import { Settings, LowPolyOutput } from '../types';
import { UploadIcon } from './ui';

interface PreviewProps {
  sourceImage: HTMLImageElement | null;
  lowPolyData: LowPolyOutput | null;
  settings: Settings;
  svgRef: React.RefObject<SVGSVGElement>;
  error: string | null;
}

export const Preview: React.FC<PreviewProps> = ({
  sourceImage,
  lowPolyData,
  settings,
  svgRef,
  error
}) => {
  const [viewMode, setViewMode] = useState<'image' | 'svg' | 'json'>('image');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [strokeColor, setStrokeColor] = useState('#111111');

  // Tạo SVG string từ lowPolyData
  const getSVGString = () => {
    if (!lowPolyData) return '';
    const { width, height, triangles } = lowPolyData.image;
    let svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'>`;
    svg += '<g>';
    lowPolyData.triangles.forEach(tri => {
      svg += `<polygon points='${tri.vertices.map(p => p.join(',')).join(' ')}' fill='rgb(${tri.avg_color.join(',')})' stroke='${strokeColor}' stroke-width='${strokeWidth}' />`;
    });
    svg += '</g></svg>';
    return svg;
  };

  const renderContent = () => {
    if (error) {
      return <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>;
    }

    // Tabs chuyển chế độ xem
    const tabs = [
      { key: 'image', label: 'Ảnh' },
      { key: 'svg', label: 'SVG' },
      { key: 'json', label: 'JSON' }
    ];

    return (
      <div className="flex flex-col gap-2 w-full h-full">
        <div className="flex gap-2 mb-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`px-3 py-1 rounded ${viewMode === tab.key ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setViewMode(tab.key as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Stroke controls */}
        <div className="flex gap-4 items-center mb-2">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            Độ dày viền
            <input
              type="range"
              min={1}
              max={16}
              value={strokeWidth}
              onChange={e => setStrokeWidth(Number(e.target.value))}
              className="w-32"
            />
            <span className="w-8 text-center">{strokeWidth}</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            Màu viền
            <input
              type="color"
              value={strokeColor}
              onChange={e => setStrokeColor(e.target.value)}
              className="w-8 h-8 p-0 border-none bg-transparent"
            />
            <span className="ml-1">{strokeColor}</span>
          </label>
        </div>
        <div className="flex-1 w-full h-full overflow-auto bg-gray-900 rounded-lg p-2">
          {viewMode === 'image' && (
            lowPolyData ? (
              <svg
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${lowPolyData.image.width} ${lowPolyData.image.height}`}
                className="max-w-full max-h-full rounded-lg shadow-lg bg-gray-900"
              >
                <g>
                  {lowPolyData.triangles.map((tri) => (
                    <polygon
                      key={tri.id}
                      points={tri.vertices.map(p => p.join(',')).join(' ')}
                      fill={`rgb(${tri.avg_color.join(',')})`}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                  ))}
                </g>
                {settings.showPointIds && (
                  <g>
                    {lowPolyData.triangles.map((tri) => (
                      <text
                        key={tri.id}
                        x={tri.centroid[0]}
                        y={tri.centroid[1]}
                        fontSize="8"
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none"
                        style={{mixBlendMode: 'difference'}}
                      >
                        {tri.id}
                      </text>
                    ))}
                  </g>
                )}
              </svg>
            ) : sourceImage ? (
              <img
                src={sourceImage.src}
                alt="Source"
                className="max-w-full max-h-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500">
                <UploadIcon className="w-16 h-16 mb-4" />
                <p className="text-xl">Tải lên một hình ảnh để bắt đầu</p>
                <p>Hoặc sử dụng hình ảnh mẫu được tải sẵn.</p>
              </div>
            )
          )}
          {viewMode === 'svg' && lowPolyData && (
            <div className="flex flex-col gap-2">
              <button
                className="self-end px-4 py-1 mb-2 rounded bg-green-700 text-white hover:bg-green-800"
                onClick={() => {
                  const svgString = getSVGString();
                  const blob = new Blob([svgString], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'lowpoly.svg';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >Tải SVG</button>
              <textarea
                className="w-full h-96 bg-gray-800 text-green-200 p-2 rounded resize-none font-mono text-xs"
                readOnly
                value={getSVGString()}
              />
            </div>
          )}
          {viewMode === 'json' && lowPolyData && (
            <pre className="w-full h-96 bg-gray-800 text-yellow-200 p-2 rounded overflow-auto text-xs">
              {JSON.stringify(lowPolyData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full h-[80vh] flex items-center justify-center flex-grow p-4 bg-gray-900 rounded-lg">
      <div className="w-full h-full max-w-none max-h-none aspect-auto">
        {renderContent()}
      </div>
    </div>
  );
};