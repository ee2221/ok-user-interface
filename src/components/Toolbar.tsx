import React from 'react';
import { 
  Move, 
  RotateCw, 
  Maximize, 
  Projector as Vector, 
  Link
} from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';
import * as THREE from 'three';

const Toolbar: React.FC = () => {
  const { 
    setTransformMode, 
    transformMode, 
    setEditMode,
    editMode,
    selectedObject
  } = useSceneStore();

  const transformTools = [
    {
      icon: Move,
      mode: 'translate',
      title: 'Move Tool',
      type: 'transform'
    },
    {
      icon: RotateCw,
      mode: 'rotate',
      title: 'Rotate Tool',
      type: 'transform'
    },
    {
      icon: Maximize,
      mode: 'scale',
      title: 'Scale Tool',
      type: 'transform'
    },
  ] as const;

  // Check if edge editing should be disabled for the current object
  const isEdgeEditingDisabled = () => {
    if (!selectedObject || !(selectedObject instanceof THREE.Mesh)) return true;
    
    const geometry = selectedObject.geometry;
    return (
      geometry instanceof THREE.CylinderGeometry ||
      geometry instanceof THREE.ConeGeometry ||
      geometry instanceof THREE.SphereGeometry
    );
  };

  const editTools = [
    {
      icon: Vector,
      mode: 'vertex',
      title: 'Edit Vertices',
      type: 'edit',
      disabled: false
    },
    {
      icon: Link,
      mode: 'edge',
      title: 'Edit Edges',
      type: 'edit',
      disabled: isEdgeEditingDisabled()
    }
  ] as const;

  return (
    <div className="absolute top-4 left-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5">
      <div className="flex flex-col gap-3">
        {/* Transform Tools */}
        <div className="space-y-1 border-b border-white/10 pb-3">
          <div className="px-2 py-1">
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">Transform</h3>
          </div>
          {transformTools.map(({ icon: Icon, mode, title }) => (
            <button
              key={mode}
              onClick={() => {
                setTransformMode(mode);
                setEditMode(null);
              }}
              className={`p-2 rounded-lg transition-colors w-full flex items-center gap-2 ${
                transformMode === mode && !editMode 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-white/90 hover:bg-white/5'
              }`}
              title={title}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{title}</span>
            </button>
          ))}
        </div>

        {/* Edit Tools */}
        <div className="space-y-1">
          <div className="px-2 py-1">
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">Edit Mode</h3>
          </div>
          {editTools.map(({ icon: Icon, mode, title, disabled }) => (
            <button
              key={mode}
              onClick={() => {
                if (!disabled) {
                  setEditMode(mode);
                  setTransformMode(null);
                }
              }}
              disabled={disabled}
              className={`p-2 rounded-lg transition-colors w-full flex items-center gap-2 ${
                disabled
                  ? 'text-white/30 cursor-not-allowed'
                  : editMode === mode 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-white/90 hover:bg-white/5'
              }`}
              title={disabled ? `${title} (Not available for this object type)` : title}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;