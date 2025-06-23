import { create } from 'zustand';
import * as THREE from 'three';

type EditMode = 'vertex' | 'edge' | 'paint' | null;
type CameraPerspective = 'perspective' | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

type BrushType = 'solid' | 'airbrush' | 'splatter' | 'lines' | 'dots' | 'noise' | 'gradient';

interface PaintSettings {
  brushType: BrushType;
  color: string;
  size: number;
  opacity: number;
  intensity: number;
  spacing: number;
  angle: number;
  randomness: number;
}

interface Group {
  id: string;
  name: string;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
  objectIds: string[];
}

interface HistoryState {
  objects: Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
  }>;
  groups: Group[];
}

interface SceneState {
  objects: Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
  }>;
  groups: Group[];
  selectedObject: THREE.Object3D | null;
  transformMode: 'translate' | 'rotate' | 'scale' | null;
  editMode: EditMode;
  cameraPerspective: CameraPerspective;
  cameraZoom: number;
  selectedElements: {
    vertices: number[];
    edges: number[];
    faces: number[];
  };
  draggedVertex: {
    indices: number[];
    position: THREE.Vector3;
    initialPosition: THREE.Vector3;
  } | null;
  draggedEdge: {
    indices: number[][];
    positions: THREE.Vector3[];
    initialPositions: THREE.Vector3[];
    connectedVertices: Set<number>;
    midpoint: THREE.Vector3;
  } | null;
  isDraggingEdge: boolean;
  history: HistoryState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  // Paint system state
  paintSettings: PaintSettings;
  isPainting: boolean;
  paintCanvas: HTMLCanvasElement | null;
  paintTexture: THREE.Texture | null;
  paintContext: CanvasRenderingContext2D | null;
  lastPaintPosition: THREE.Vector2 | null;
  paintStrokes: Array<{
    positions: THREE.Vector2[];
    settings: PaintSettings;
  }>;
  // Placement state
  placementMode: boolean;
  pendingObject: {
    geometry: () => THREE.BufferGeometry | THREE.Group;
    name: string;
    color?: string;
  } | null;
  addObject: (object: THREE.Object3D, name: string) => void;
  removeObject: (id: string) => void;
  setSelectedObject: (object: THREE.Object3D | null) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale' | null) => void;
  setEditMode: (mode: EditMode) => void;
  setCameraPerspective: (perspective: CameraPerspective) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  updateObjectName: (id: string, name: string) => void;
  updateObjectProperties: () => void;
  updateObjectColor: (color: string) => void;
  updateObjectOpacity: (opacity: number) => void;
  setSelectedElements: (type: 'vertices' | 'edges' | 'faces', indices: number[]) => void;
  startVertexDrag: (index: number, position: THREE.Vector3) => void;
  updateVertexDrag: (position: THREE.Vector3) => void;
  endVertexDrag: () => void;
  startEdgeDrag: (vertexIndices: number[], positions: THREE.Vector3[], midpoint: THREE.Vector3) => void;
  updateEdgeDrag: (position: THREE.Vector3) => void;
  endEdgeDrag: () => void;
  setIsDraggingEdge: (isDragging: boolean) => void;
  updateCylinderVertices: (vertexCount: number) => void;
  updateSphereVertices: (vertexCount: number) => void;
  // Paint system functions
  setPaintSettings: (settings: Partial<PaintSettings>) => void;
  initializePaintTexture: (object: THREE.Object3D) => void;
  startPainting: () => void;
  stopPainting: () => void;
  paintAtPosition: (uv: THREE.Vector2, pressure?: number) => void;
  clearPaintTexture: () => void;
  // Group management
  createGroup: (name: string, objectIds?: string[]) => void;
  removeGroup: (groupId: string) => void;
  addObjectToGroup: (objectId: string, groupId: string) => void;
  removeObjectFromGroup: (objectId: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  toggleGroupVisibility: (groupId: string) => void;
  toggleGroupLock: (groupId: string) => void;
  updateGroupName: (groupId: string, name: string) => void;
  moveObjectsToGroup: (objectIds: string[], groupId: string | null) => void;
  // Action functions
  undo: () => void;
  redo: () => void;
  duplicateObject: () => void;
  mirrorObject: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  // Placement functions
  startObjectPlacement: (objectDef: { geometry: () => THREE.BufferGeometry | THREE.Group; name: string; color?: string }) => void;
  placeObjectAt: (position: THREE.Vector3) => void;
  cancelObjectPlacement: () => void;
  // Helper functions
  isObjectLocked: (objectId: string) => boolean;
  canSelectObject: (object: THREE.Object3D) => boolean;
  saveToHistory: () => void;
}

const cloneObject = (obj: THREE.Object3D): THREE.Object3D => {
  if (obj instanceof THREE.Mesh) {
    const clonedGeometry = obj.geometry.clone();
    const clonedMaterial = obj.material instanceof Array 
      ? obj.material.map(mat => mat.clone())
      : obj.material.clone();
    const clonedMesh = new THREE.Mesh(clonedGeometry, clonedMaterial);
    
    clonedMesh.position.copy(obj.position);
    clonedMesh.rotation.copy(obj.rotation);
    clonedMesh.scale.copy(obj.scale);
    
    return clonedMesh;
  }
  return obj.clone();
};

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  groups: [],
  selectedObject: null,
  transformMode: null,
  editMode: null,
  cameraPerspective: 'perspective',
  cameraZoom: 1,
  selectedElements: {
    vertices: [],
    edges: [],
    faces: [],
  },
  draggedVertex: null,
  draggedEdge: null,
  isDraggingEdge: false,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  // Paint system state
  paintSettings: {
    brushType: 'solid',
    color: '#ff0000',
    size: 20,
    opacity: 0.8,
    intensity: 1.0,
    spacing: 1.0,
    angle: 0,
    randomness: 0.0
  },
  isPainting: false,
  paintCanvas: null,
  paintTexture: null,
  paintContext: null,
  lastPaintPosition: null,
  paintStrokes: [],
  // Placement state
  placementMode: false,
  pendingObject: null,

  saveToHistory: () => {
    const state = get();
    const currentState: HistoryState = {
      objects: state.objects.map(obj => ({
        ...obj,
        object: cloneObject(obj.object)
      })),
      groups: JSON.parse(JSON.stringify(state.groups))
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(currentState);

    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false
    });
  },

  addObject: (object, name) =>
    set((state) => {
      const newObjects = [...state.objects, { id: crypto.randomUUID(), object, name, visible: true, locked: false }];
      
      // Save to history after adding
      setTimeout(() => get().saveToHistory(), 0);
      
      return { objects: newObjects };
    }),

  removeObject: (id) =>
    set((state) => {
      // Check if object is locked
      const objectToRemove = state.objects.find(obj => obj.id === id);
      if (objectToRemove?.locked) return state;

      // Check if object is in a locked group
      if (objectToRemove?.groupId) {
        const group = state.groups.find(g => g.id === objectToRemove.groupId);
        if (group?.locked) return state;
      }

      // Remove object from any group
      const updatedGroups = state.groups.map(group => ({
        ...group,
        objectIds: group.objectIds.filter(objId => objId !== id)
      }));

      const newState = {
        objects: state.objects.filter((obj) => obj.id !== id),
        groups: updatedGroups,
        selectedObject: state.objects.find((obj) => obj.id === id)?.object === state.selectedObject
          ? null
          : state.selectedObject,
      };

      // Save to history after removing
      setTimeout(() => get().saveToHistory(), 0);

      return newState;
    }),

  setSelectedObject: (object) => 
    set((state) => {
      // Check if object can be selected (not locked)
      if (object && !get().canSelectObject(object)) {
        return state; // Don't change selection if object is locked
      }

      // Auto-enable vertex mode for sphere, cylinder, and cone
      let newEditMode = state.editMode;
      if (object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        if (geometry instanceof THREE.SphereGeometry ||
            geometry instanceof THREE.CylinderGeometry ||
            geometry instanceof THREE.ConeGeometry) {
          newEditMode = 'vertex';
        }
      }
      
      return { 
        selectedObject: object,
        editMode: newEditMode,
        transformMode: null, // Clear transform mode when selecting object
        // Reset paint state when changing objects
        paintCanvas: null,
        paintTexture: null,
        paintContext: null,
        paintStrokes: []
      };
    }),

  setTransformMode: (mode) => set({ transformMode: mode }),
  
  setEditMode: (mode) => 
    set((state) => {
      // If trying to set edge mode on unsupported geometry, prevent it
      if (mode === 'edge' && state.selectedObject instanceof THREE.Mesh) {
        const geometry = state.selectedObject.geometry;
        if (geometry instanceof THREE.CylinderGeometry ||
            geometry instanceof THREE.ConeGeometry ||
            geometry instanceof THREE.SphereGeometry) {
          return state; // Don't change the edit mode
        }
      }
      return { editMode: mode };
    }),

  setCameraPerspective: (perspective) => set({ cameraPerspective: perspective }),

  toggleVisibility: (id) =>
    set((state) => {
      const objectToToggle = state.objects.find(obj => obj.id === id);
      if (!objectToToggle) return state;

      // Check if object is locked
      if (objectToToggle.locked) return state;

      // Check if object is in a locked group
      if (objectToToggle.groupId) {
        const group = state.groups.find(g => g.id === objectToToggle.groupId);
        if (group?.locked) return state;
      }

      const updatedObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, visible: !obj.visible } : obj
      );
      
      const toggledObject = updatedObjects.find((obj) => obj.id === id);
      
      const newSelectedObject = (toggledObject && !toggledObject.visible && toggledObject.object === state.selectedObject)
        ? null
        : state.selectedObject;

      return {
        objects: updatedObjects,
        selectedObject: newSelectedObject,
      };
    }),

  toggleLock: (id) =>
    set((state) => {
      const objectToToggle = state.objects.find(obj => obj.id === id);
      if (!objectToToggle) return state;

      // Check if object is in a locked group
      if (objectToToggle.groupId) {
        const group = state.groups.find(g => g.id === objectToToggle.groupId);
        if (group?.locked) return state;
      }

      const updatedObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, locked: !obj.locked } : obj
      );
      
      const toggledObject = updatedObjects.find((obj) => obj.id === id);
      
      // Clear selection if selected object becomes locked
      const newSelectedObject = (toggledObject && toggledObject.locked && toggledObject.object === state.selectedObject)
        ? null
        : state.selectedObject;

      return {
        objects: updatedObjects,
        selectedObject: newSelectedObject,
      };
    }),

  updateObjectName: (id, name) =>
    set((state) => {
      const objectToUpdate = state.objects.find(obj => obj.id === id);
      if (!objectToUpdate) return state;

      // Check if object is locked
      if (objectToUpdate.locked) return state;

      // Check if object is in a locked group
      if (objectToUpdate.groupId) {
        const group = state.groups.find(g => g.id === objectToUpdate.groupId);
        if (group?.locked) return state;
      }

      return {
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, name } : obj
        ),
      };
    }),

  updateObjectProperties: () => set((state) => ({ ...state })),

  updateObjectColor: (color) => 
    set((state) => {
      if (state.selectedObject instanceof THREE.Mesh) {
        // Check if selected object is locked
        const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
        if (get().isObjectLocked(selectedObj?.id || '')) return state;

        const material = state.selectedObject.material as THREE.MeshStandardMaterial;
        material.color.setStyle(color);
        material.needsUpdate = true;
      }
      return state;
    }),

  updateObjectOpacity: (opacity) =>
    set((state) => {
      if (state.selectedObject instanceof THREE.Mesh) {
        // Check if selected object is locked
        const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
        if (get().isObjectLocked(selectedObj?.id || '')) return state;

        const material = state.selectedObject.material as THREE.MeshStandardMaterial;
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.needsUpdate = true;
      }
      return state;
    }),

  setSelectedElements: (type, indices) =>
    set((state) => ({
      selectedElements: {
        ...state.selectedElements,
        [type]: indices,
      },
    })),

  startVertexDrag: (index, position) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const overlappingIndices = [];
      const selectedPos = new THREE.Vector3(
        positions.getX(index),
        positions.getY(index),
        positions.getZ(index)
      );

      for (let i = 0; i < positions.count; i++) {
        const pos = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        if (pos.distanceTo(selectedPos) < 0.0001) {
          overlappingIndices.push(i);
        }
      }

      return {
        draggedVertex: {
          indices: overlappingIndices,
          position: position.clone(),
          initialPosition: position.clone()
        },
        selectedElements: {
          ...state.selectedElements,
          vertices: overlappingIndices
        }
      };
    }),

  updateVertexDrag: (position) =>
    set((state) => {
      if (!state.draggedVertex || !(state.selectedObject instanceof THREE.Mesh)) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      
      // Update all overlapping vertices to the new position
      state.draggedVertex.indices.forEach(index => {
        positions.setXYZ(
          index,
          position.x,
          position.y,
          position.z
        );
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return {
        draggedVertex: {
          ...state.draggedVertex,
          position: position.clone()
        }
      };
    }),

  endVertexDrag: () => {
    get().saveToHistory();
    set({ draggedVertex: null });
  },

  startEdgeDrag: (vertexIndices, positions, midpoint) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positionAttribute = geometry.attributes.position;
      const connectedVertices = new Set<number>();
      const edges: number[][] = [];

      // Find all overlapping vertices for each vertex in the edge
      const findOverlappingVertices = (targetIndex: number) => {
        const targetPos = new THREE.Vector3(
          positionAttribute.getX(targetIndex),
          positionAttribute.getY(targetIndex),
          positionAttribute.getZ(targetIndex)
        );

        const overlapping = [targetIndex];
        for (let i = 0; i < positionAttribute.count; i++) {
          if (i === targetIndex) continue;

          const pos = new THREE.Vector3(
            positionAttribute.getX(i),
            positionAttribute.getY(i),
            positionAttribute.getZ(i)
          );

          if (pos.distanceTo(targetPos) < 0.0001) {
            overlapping.push(i);
          }
        }
        return overlapping;
      };

      // Get all overlapping vertices for both edge vertices
      const vertex1Overlapping = findOverlappingVertices(vertexIndices[0]);
      const vertex2Overlapping = findOverlappingVertices(vertexIndices[1]);

      // Add all overlapping vertices to connected set
      vertex1Overlapping.forEach(v => connectedVertices.add(v));
      vertex2Overlapping.forEach(v => connectedVertices.add(v));

      // Create edge pairs
      vertex1Overlapping.forEach(v1 => {
        vertex2Overlapping.forEach(v2 => {
          edges.push([v1, v2]);
        });
      });

      return {
        draggedEdge: {
          indices: edges,
          positions: positions,
          initialPositions: positions.map(p => p.clone()),
          connectedVertices,
          midpoint: midpoint.clone()
        },
        selectedElements: {
          ...state.selectedElements,
          edges: Array.from(connectedVertices)
        }
      };
    }),

  updateEdgeDrag: (position) =>
    set((state) => {
      if (!state.draggedEdge || !(state.selectedObject instanceof THREE.Mesh)) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const offset = position.clone().sub(state.draggedEdge.midpoint);

      // Move all connected vertices by the offset
      state.draggedEdge.connectedVertices.forEach(vertexIndex => {
        const currentPos = new THREE.Vector3(
          positions.getX(vertexIndex),
          positions.getY(vertexIndex),
          positions.getZ(vertexIndex)
        );
        const newPos = currentPos.add(offset);
        positions.setXYZ(vertexIndex, newPos.x, newPos.y, newPos.z);
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return {
        draggedEdge: {
          ...state.draggedEdge,
          midpoint: position.clone()
        }
      };
    }),

  endEdgeDrag: () => {
    get().saveToHistory();
    set({ draggedEdge: null });
  },

  setIsDraggingEdge: (isDragging) => set({ isDraggingEdge: isDragging }),

  updateCylinderVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.CylinderGeometry)) {
        return state;
      }

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.CylinderGeometry(
        oldGeometry.parameters.radiusTop,
        oldGeometry.parameters.radiusBottom,
        oldGeometry.parameters.height,
        vertexCount,
        oldGeometry.parameters.heightSegments,
        oldGeometry.parameters.openEnded,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      get().saveToHistory();

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),

  updateSphereVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.SphereGeometry)) {
        return state;
      }

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.SphereGeometry(
        oldGeometry.parameters.radius,
        vertexCount,
        vertexCount / 2,
        oldGeometry.parameters.phiStart,
        oldGeometry.parameters.phiLength,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      get().saveToHistory();

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),

  // Paint system functions
  setPaintSettings: (settings) =>
    set((state) => ({
      paintSettings: { ...state.paintSettings, ...settings }
    })),

  initializePaintTexture: (object) =>
    set((state) => {
      if (!(object instanceof THREE.Mesh)) return state;

      // Create a high-resolution canvas for painting
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return state;

      // Fill with transparent background to preserve original material
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      texture.flipY = false; // Important for proper UV mapping

      // Store original material properties
      const material = object.material as THREE.MeshStandardMaterial;
      const originalMap = material.map;

      // Create a new material that combines original texture with paint
      if (originalMap) {
        // If there's already a texture, we need to blend it
        material.map = texture;
      } else {
        // If no texture, just apply the paint texture
        material.map = texture;
      }
      
      material.transparent = true;
      material.needsUpdate = true;

      return {
        paintCanvas: canvas,
        paintTexture: texture,
        paintContext: ctx,
        lastPaintPosition: null,
        paintStrokes: []
      };
    }),

  startPainting: () => set({ isPainting: true }),
  stopPainting: () => set({ 
    isPainting: false, 
    lastPaintPosition: null 
  }),

  paintAtPosition: (uv, pressure = 1.0) =>
    set((state) => {
      if (!state.paintCanvas || !state.paintTexture || !state.paintContext) return state;

      const canvas = state.paintCanvas;
      const ctx = state.paintContext;
      const { paintSettings } = state;
      
      // Convert UV coordinates to canvas coordinates
      const x = uv.x * canvas.width;
      const y = (1 - uv.y) * canvas.height; // Flip Y coordinate for proper UV mapping
      
      const currentPosition = new THREE.Vector2(x, y);

      // Apply pressure and settings
      const size = paintSettings.size * pressure;
      const opacity = paintSettings.opacity * pressure;

      // Set up context for painting
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity;

      // If we have a last position, interpolate between points for smooth strokes
      if (state.lastPaintPosition && state.isPainting) {
        const distance = currentPosition.distanceTo(state.lastPaintPosition);
        const steps = Math.max(1, Math.floor(distance / (size * 0.25))); // Ensure smooth strokes
        
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const interpX = state.lastPaintPosition.x + (currentPosition.x - state.lastPaintPosition.x) * t;
          const interpY = state.lastPaintPosition.y + (currentPosition.y - state.lastPaintPosition.y) * t;
          
          drawBrushStroke(ctx, interpX, interpY, size, paintSettings);
        }
      } else {
        drawBrushStroke(ctx, x, y, size, paintSettings);
      }

      // Update texture
      state.paintTexture.needsUpdate = true;

      return {
        lastPaintPosition: currentPosition
      };
    }),

  clearPaintTexture: () =>
    set((state) => {
      if (!state.paintCanvas || !state.paintContext) return state;

      const ctx = state.paintContext;
      
      // Clear the canvas completely
      ctx.clearRect(0, 0, state.paintCanvas.width, state.paintCanvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      ctx.fillRect(0, 0, state.paintCanvas.width, state.paintCanvas.height);

      if (state.paintTexture) {
        state.paintTexture.needsUpdate = true;
      }

      return {
        paintStrokes: []
      };
    }),

  // Group management functions
  createGroup: (name, objectIds = []) =>
    set((state) => {
      const newGroup: Group = {
        id: crypto.randomUUID(),
        name,
        expanded: true,
        visible: true,
        locked: false,
        objectIds: [...objectIds]
      };

      // Update objects to be part of this group
      const updatedObjects = state.objects.map(obj => 
        objectIds.includes(obj.id) 
          ? { ...obj, groupId: newGroup.id }
          : obj
      );

      get().saveToHistory();

      return {
        groups: [...state.groups, newGroup],
        objects: updatedObjects
      };
    }),

  removeGroup: (groupId) =>
    set((state) => {
      const groupToRemove = state.groups.find(g => g.id === groupId);
      if (groupToRemove?.locked) return state;

      // Remove group reference from objects
      const updatedObjects = state.objects.map(obj => 
        obj.groupId === groupId 
          ? { ...obj, groupId: undefined }
          : obj
      );

      get().saveToHistory();

      return {
        groups: state.groups.filter(group => group.id !== groupId),
        objects: updatedObjects
      };
    }),

  addObjectToGroup: (objectId, groupId) =>
    set((state) => {
      const objectToMove = state.objects.find(obj => obj.id === objectId);
      const targetGroup = state.groups.find(g => g.id === groupId);
      
      // Check if object is locked or target group is locked
      if (objectToMove?.locked || targetGroup?.locked) return state;

      const updatedObjects = state.objects.map(obj =>
        obj.id === objectId ? { ...obj, groupId } : obj
      );

      const updatedGroups = state.groups.map(group =>
        group.id === groupId 
          ? { ...group, objectIds: [...group.objectIds, objectId] }
          : group
      );

      return {
        objects: updatedObjects,
        groups: updatedGroups
      };
    }),

  removeObjectFromGroup: (objectId) =>
    set((state) => {
      const obj = state.objects.find(o => o.id === objectId);
      if (!obj?.groupId) return state;

      const group = state.groups.find(g => g.id === obj.groupId);
      
      // Check if object is locked or group is locked
      if (obj.locked || group?.locked) return state;

      const updatedObjects = state.objects.map(o =>
        o.id === objectId ? { ...o, groupId: undefined } : o
      );

      const updatedGroups = state.groups.map(group =>
        group.id === obj.groupId
          ? { ...group, objectIds: group.objectIds.filter(id => id !== objectId) }
          : group
      );

      return {
        objects: updatedObjects,
        groups: updatedGroups
      };
    }),

  toggleGroupExpanded: (groupId) =>
    set((state) => ({
      groups: state.groups.map(group =>
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    })),

  toggleGroupVisibility: (groupId) =>
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group || group.locked) return state;

      const newVisibility = !group.visible;

      // Update group visibility
      const updatedGroups = state.groups.map(g =>
        g.id === groupId ? { ...g, visible: newVisibility } : g
      );

      // Update all objects in the group
      const updatedObjects = state.objects.map(obj =>
        group.objectIds.includes(obj.id) 
          ? { ...obj, visible: newVisibility }
          : obj
      );

      // Clear selection if selected object becomes invisible
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      const newSelectedObject = (selectedObj && group.objectIds.includes(selectedObj.id) && !newVisibility)
        ? null
        : state.selectedObject;

      return {
        groups: updatedGroups,
        objects: updatedObjects,
        selectedObject: newSelectedObject
      };
    }),

  toggleGroupLock: (groupId) =>
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      const newLockState = !group.locked;

      // Update group lock state
      const updatedGroups = state.groups.map(g =>
        g.id === groupId ? { ...g, locked: newLockState } : g
      );

      // Clear selection if selected object is in a group that becomes locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      const newSelectedObject = (selectedObj && group.objectIds.includes(selectedObj.id) && newLockState)
        ? null
        : state.selectedObject;

      return {
        groups: updatedGroups,
        selectedObject: newSelectedObject
      };
    }),

  updateGroupName: (groupId, name) =>
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (group?.locked) return state;

      return {
        groups: state.groups.map(group =>
          group.id === groupId ? { ...group, name } : group
        )
      };
    }),

  moveObjectsToGroup: (objectIds, groupId) =>
    set((state) => {
      // Check if any objects are locked
      const lockedObjects = objectIds.filter(id => {
        const obj = state.objects.find(o => o.id === id);
        return obj?.locked || (obj?.groupId && state.groups.find(g => g.id === obj.groupId)?.locked);
      });

      if (lockedObjects.length > 0) return state;

      // Check if target group is locked
      if (groupId) {
        const targetGroup = state.groups.find(g => g.id === groupId);
        if (targetGroup?.locked) return state;
      }

      // Remove objects from their current groups
      const updatedGroups = state.groups.map(group => ({
        ...group,
        objectIds: group.objectIds.filter(id => !objectIds.includes(id))
      }));

      // Add objects to the new group if specified
      const finalGroups = groupId 
        ? updatedGroups.map(group =>
            group.id === groupId
              ? { ...group, objectIds: [...group.objectIds, ...objectIds] }
              : group
          )
        : updatedGroups;

      // Update objects
      const updatedObjects = state.objects.map(obj =>
        objectIds.includes(obj.id) 
          ? { ...obj, groupId }
          : obj
      );

      return {
        groups: finalGroups,
        objects: updatedObjects
      };
    }),

  // Action functions
  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;

      const previousState = state.history[state.historyIndex - 1];
      
      return {
        ...state,
        objects: previousState.objects,
        groups: previousState.groups,
        historyIndex: state.historyIndex - 1,
        canUndo: state.historyIndex - 1 > 0,
        canRedo: true,
        selectedObject: null // Clear selection on undo
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const nextState = state.history[state.historyIndex + 1];
      
      return {
        ...state,
        objects: nextState.objects,
        groups: nextState.groups,
        historyIndex: state.historyIndex + 1,
        canUndo: true,
        canRedo: state.historyIndex + 1 < state.history.length - 1,
        selectedObject: null // Clear selection on redo
      };
    }),

  duplicateObject: () =>
    set((state) => {
      if (!state.selectedObject) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (!selectedObj || get().isObjectLocked(selectedObj.id)) return state;

      const clonedObject = cloneObject(state.selectedObject);
      clonedObject.position.x += 1; // Offset the duplicate

      const newObject = {
        id: crypto.randomUUID(),
        object: clonedObject,
        name: `${selectedObj.name} Copy`,
        visible: true,
        locked: false,
        groupId: selectedObj.groupId
      };

      // Update group if object belongs to one
      let updatedGroups = state.groups;
      if (selectedObj.groupId) {
        updatedGroups = state.groups.map(group =>
          group.id === selectedObj.groupId
            ? { ...group, objectIds: [...group.objectIds, newObject.id] }
            : group
        );
      }

      get().saveToHistory();

      return {
        objects: [...state.objects, newObject],
        groups: updatedGroups,
        selectedObject: clonedObject
      };
    }),

  mirrorObject: () =>
    set((state) => {
      if (!state.selectedObject) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (!selectedObj || get().isObjectLocked(selectedObj.id)) return state;

      // Mirror along X-axis
      state.selectedObject.scale.x *= -1;

      get().saveToHistory();

      return state;
    }),

  zoomIn: () =>
    set((state) => ({
      cameraZoom: Math.min(state.cameraZoom * 1.2, 5)
    })),

  zoomOut: () =>
    set((state) => ({
      cameraZoom: Math.max(state.cameraZoom / 1.2, 0.1)
    })),

  // Placement functions
  startObjectPlacement: (objectDef) =>
    set({
      placementMode: true,
      pendingObject: objectDef,
      selectedObject: null,
      transformMode: null,
      editMode: null
    }),

  placeObjectAt: (position) =>
    set((state) => {
      if (!state.pendingObject) return state;

      const geometryOrGroup = state.pendingObject.geometry();
      let object: THREE.Object3D;

      // Check if it's a THREE.Group or THREE.BufferGeometry
      if (geometryOrGroup instanceof THREE.Group) {
        // It's already a complete group, use it directly
        object = geometryOrGroup;
      } else {
        // It's a BufferGeometry, create a mesh with material
        const material = new THREE.MeshStandardMaterial({ 
          color: state.pendingObject.color || '#44aa88' 
        });
        object = new THREE.Mesh(geometryOrGroup, material);
      }

      // Set position
      object.position.copy(position);

      // Add to scene
      const newObjects = [...state.objects, { 
        id: crypto.randomUUID(), 
        object, 
        name: state.pendingObject.name, 
        visible: true, 
        locked: false 
      }];

      // Save to history after adding
      setTimeout(() => get().saveToHistory(), 0);

      return {
        objects: newObjects,
        placementMode: false,
        pendingObject: null,
        selectedObject: object
      };
    }),

  cancelObjectPlacement: () =>
    set({
      placementMode: false,
      pendingObject: null
    }),

  // Helper functions
  isObjectLocked: (objectId) => {
    const state = get();
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj) return false;

    // Check if object itself is locked
    if (obj.locked) return true;

    // Check if object is in a locked group
    if (obj.groupId) {
      const group = state.groups.find(g => g.id === obj.groupId);
      return group?.locked || false;
    }

    return false;
  },

  canSelectObject: (object) => {
    const state = get();
    const obj = state.objects.find(o => o.object === object);
    return obj ? !get().isObjectLocked(obj.id) : true;
  },
}));

// Helper function to draw brush strokes
function drawBrushStroke(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, settings: PaintSettings) {
  ctx.fillStyle = settings.color;
  ctx.strokeStyle = settings.color;

  switch (settings.brushType) {
    case 'solid':
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'airbrush':
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
      gradient.addColorStop(0, settings.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'splatter':
      const splatCount = Math.floor(settings.intensity * 20);
      for (let i = 0; i < splatCount; i++) {
        const offsetX = (Math.random() - 0.5) * size * (1 + settings.randomness);
        const offsetY = (Math.random() - 0.5) * size * (1 + settings.randomness);
        const dotSize = Math.random() * 4 + 1;
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'lines':
      ctx.lineWidth = 2;
      const angle = settings.angle * Math.PI / 180;
      const lineLength = size;
      const lineSpacing = 4 * settings.spacing;
      for (let i = -size/2; i < size/2; i += lineSpacing) {
        const randomOffset = settings.randomness * (Math.random() - 0.5) * 10;
        const startX = x + Math.cos(angle + Math.PI/2) * i + randomOffset;
        const startY = y + Math.sin(angle + Math.PI/2) * i + randomOffset;
        const endX = startX + Math.cos(angle) * lineLength;
        const endY = startY + Math.sin(angle) * lineLength;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      break;

    case 'dots':
      const dotCount = Math.floor(settings.intensity * 15);
      for (let i = 0; i < dotCount; i++) {
        const offsetX = (Math.random() - 0.5) * size * (1 + settings.randomness);
        const offsetY = (Math.random() - 0.5) * size * (1 + settings.randomness);
        const dotSize = 2 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'noise':
      const imageData = ctx.getImageData(Math.max(0, x - size/2), Math.max(0, y - size/2), 
                                       Math.min(size, ctx.canvas.width - x + size/2), 
                                       Math.min(size, ctx.canvas.height - y + size/2));
      const data = imageData.data;
      const color = new THREE.Color(settings.color);
      
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < settings.intensity * 0.3) {
          data[i] = color.r * 255;     // Red
          data[i + 1] = color.g * 255; // Green
          data[i + 2] = color.b * 255; // Blue
          data[i + 3] = 255; // Alpha
        }
      }
      
      ctx.putImageData(imageData, Math.max(0, x - size/2), Math.max(0, y - size/2));
      break;

    case 'gradient':
      const gradientRadius = size / 2;
      const gradientFill = ctx.createRadialGradient(x, y, 0, x, y, gradientRadius);
      gradientFill.addColorStop(0, settings.color);
      gradientFill.addColorStop(0.5, settings.color + '80');
      gradientFill.addColorStop(1, 'transparent');
      ctx.fillStyle = gradientFill;
      ctx.beginPath();
      ctx.arc(x, y, gradientRadius, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}