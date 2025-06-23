import React from 'react';
import { 
  Paintbrush, 
  Droplets, 
  Zap, 
  Minus, 
  Circle, 
  Hash, 
  Palette,
  RotateCw,
  Shuffle,
  Eraser,
  X
} from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

const PaintControls: React.FC = () => {
  const { 
    editMode, 
    selectedObject, 
    paintSettings, 
    setPaintSettings,
    clearPaintTexture,
    setEditMode
  } = useSceneStore();

  if (editMode !== 'paint' || !selectedObject) return null;

  const brushTypes = [
    { type: 'solid', icon: Circle, name: 'Solid', description: 'Solid circular brush' },
    { type: 'airbrush', icon: Droplets, name: 'Airbrush', description: 'Soft gradient brush' },
    { type: 'splatter', icon: Zap, name: 'Splatter', description: 'Random paint splatter' },
    { type: 'lines', icon: Minus, name: 'Lines', description: 'Parallel line strokes' },
    { type: 'dots', icon: Circle, name: 'Dots', description: 'Dotted pattern' },
    { type: 'noise', icon: Hash, name: 'Noise', description: 'Random noise texture' },
    { type: 'gradient', icon: Palette, name: 'Gradient', description: 'Gradient fade brush' }
  ] as const;

  const presetColors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ffffff', '#000000', '#808080', '#800000', '#008000', '#000080',
    '#ff8000', '#8000ff', '#ff0080', '#80ff00', '#0080ff', '#ff8080'
  ];

  return (
    <div className="absolute bottom-4 left-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 border border-white/5 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paintbrush className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white/90">Paint Tools</h2>
        </div>
        <button
          onClick={() => setEditMode(null)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
          title="Close Paint Tools"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Brush Type Selection */}
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-2">Brush Type</h3>
          <div className="grid grid-cols-4 gap-1">
            {brushTypes.map(({ type, icon: Icon, name, description }) => (
              <button
                key={type}
                onClick={() => setPaintSettings({ brushType: type })}
                className={`p-2 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 ${
                  paintSettings.brushType === type
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white/90'
                }`}
                title={description}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-2">Color</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="color"
              value={paintSettings.color}
              onChange={(e) => setPaintSettings({ color: e.target.value })}
              className="w-12 h-8 rounded cursor-pointer border border-white/10"
            />
            <input
              type="text"
              value={paintSettings.color}
              onChange={(e) => setPaintSettings({ color: e.target.value })}
              className="flex-1 bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => setPaintSettings({ color })}
                className={`w-8 h-6 rounded border-2 transition-all ${
                  paintSettings.color === color
                    ? 'border-blue-400 scale-110'
                    : 'border-white/20 hover:border-white/40'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Brush Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/70">Brush Settings</h3>
          
          {/* Size */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-white/50">Size</label>
              <span className="text-xs text-white/70">{paintSettings.size}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={paintSettings.size}
              onChange={(e) => setPaintSettings({ size: parseInt(e.target.value) })}
              className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Opacity */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-white/50">Opacity</label>
              <span className="text-xs text-white/70">{Math.round(paintSettings.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={paintSettings.opacity}
              onChange={(e) => setPaintSettings({ opacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Intensity (for noise and splatter) */}
          {(paintSettings.brushType === 'noise' || paintSettings.brushType === 'splatter') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-white/50">Intensity</label>
                <span className="text-xs text-white/70">{Math.round(paintSettings.intensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={paintSettings.intensity}
                onChange={(e) => setPaintSettings({ intensity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Angle (for lines brush) */}
          {paintSettings.brushType === 'lines' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-white/50 flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  Angle
                </label>
                <span className="text-xs text-white/70">{paintSettings.angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                value={paintSettings.angle}
                onChange={(e) => setPaintSettings({ angle: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Randomness */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-white/50 flex items-center gap-1">
                <Shuffle className="w-3 h-3" />
                Randomness
              </label>
              <span className="text-xs text-white/70">{Math.round(paintSettings.randomness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={paintSettings.randomness}
              onChange={(e) => setPaintSettings({ randomness: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <button
            onClick={clearPaintTexture}
            className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Eraser className="w-4 h-4" />
            Clear
          </button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-white/50 bg-[#2a2a2a] rounded-lg p-2">
          <p className="font-medium mb-1">How to Paint:</p>
          <ul className="space-y-1">
            <li>• Click and drag on the object to paint</li>
            <li>• Hold Shift for straight lines</li>
            <li>• Use different brush types for various effects</li>
            <li>• Adjust size and opacity for better control</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaintControls;