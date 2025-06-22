import React, { useState } from 'react';
import { 
  Cuboid, 
  Cherry, 
  Cylinder, 
  Cone, 
  Pyramid, 
  ChevronDown,
  ChevronRight,
  TreePine,
  Flower,
  Leaf,
  Mountain,
  Home,
  Car,
  Lightbulb,
  Coffee,
  Heart,
  Star,
  Hexagon,
  Triangle,
  Circle,
  Square,
  Diamond,
  Zap
} from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';
import * as THREE from 'three';

interface ObjectCategory {
  name: string;
  icon: React.ComponentType<any>;
  objects: {
    name: string;
    icon: React.ComponentType<any>;
    geometry: () => THREE.BufferGeometry | THREE.Group;
    color?: string;
  }[];
}

const ObjectLibrary: React.FC = () => {
  const { addObject } = useSceneStore();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Basic Shapes']);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Helper function to create tree geometry
  const createTreeGeometry = () => {
    const group = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513' });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.5;
    group.add(trunk);
    
    // Leaves (multiple spheres)
    const leafMaterial = new THREE.MeshStandardMaterial({ color: '#228B22' });
    for (let i = 0; i < 3; i++) {
      const leafGeometry = new THREE.SphereGeometry(0.4 - i * 0.1, 8, 6);
      const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
      leaves.position.y = 1.2 + i * 0.3;
      group.add(leaves);
    }
    
    return group;
  };

  // Helper function to create bush geometry
  const createBushGeometry = () => {
    const group = new THREE.Group();
    const leafMaterial = new THREE.MeshStandardMaterial({ color: '#32CD32' });
    
    // Multiple overlapping spheres for bush effect
    for (let i = 0; i < 5; i++) {
      const leafGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 6);
      const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
      leaves.position.set(
        (Math.random() - 0.5) * 0.8,
        Math.random() * 0.4,
        (Math.random() - 0.5) * 0.8
      );
      group.add(leaves);
    }
    
    return group;
  };

  // Helper function to create flower geometry
  const createFlowerGeometry = () => {
    const group = new THREE.Group();
    
    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: '#228B22' });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.4;
    group.add(stem);
    
    // Flower center
    const centerGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const centerMaterial = new THREE.MeshStandardMaterial({ color: '#FFD700' });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.y = 0.8;
    group.add(center);
    
    // Petals
    const petalMaterial = new THREE.MeshStandardMaterial({ color: '#FF69B4' });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const petalGeometry = new THREE.SphereGeometry(0.06, 6, 4);
      const petal = new THREE.Mesh(petalGeometry, petalMaterial);
      petal.position.set(
        Math.cos(angle) * 0.12,
        0.8,
        Math.sin(angle) * 0.12
      );
      group.add(petal);
    }
    
    return group;
  };

  // Helper function to create rock geometry
  const createRockGeometry = () => {
    const geometry = new THREE.DodecahedronGeometry(0.5);
    // Add some randomness to vertices for organic look
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      vertex.multiplyScalar(0.8 + Math.random() * 0.4);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  };

  const objectCategories: ObjectCategory[] = [
    {
      name: 'Basic Shapes',
      icon: Cuboid,
      objects: [
        {
          name: 'Cube',
          icon: Cuboid,
          geometry: () => new THREE.BoxGeometry(1, 1, 1),
        },
        {
          name: 'Sphere',
          icon: Cherry,
          geometry: () => new THREE.SphereGeometry(0.5, 32, 16),
        },
        {
          name: 'Cylinder',
          icon: Cylinder,
          geometry: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
        },
        {
          name: 'Cone',
          icon: Cone,
          geometry: () => new THREE.ConeGeometry(0.5, 1, 32),
        },
        {
          name: 'Tetrahedron',
          icon: Pyramid,
          geometry: () => new THREE.TetrahedronGeometry(0.7),
        },
        {
          name: 'Torus',
          icon: Circle,
          geometry: () => new THREE.TorusGeometry(0.5, 0.2, 16, 100),
        },
        {
          name: 'Octahedron',
          icon: Diamond,
          geometry: () => new THREE.OctahedronGeometry(0.6),
        },
        {
          name: 'Dodecahedron',
          icon: Hexagon,
          geometry: () => new THREE.DodecahedronGeometry(0.5),
        }
      ]
    },
    {
      name: 'Nature & Organic',
      icon: TreePine,
      objects: [
        {
          name: 'Tree',
          icon: TreePine,
          geometry: createTreeGeometry,
          color: '#228B22'
        },
        {
          name: 'Bush',
          icon: Leaf,
          geometry: createBushGeometry,
          color: '#32CD32'
        },
        {
          name: 'Flower',
          icon: Flower,
          geometry: createFlowerGeometry,
          color: '#FF69B4'
        },
        {
          name: 'Rock',
          icon: Mountain,
          geometry: createRockGeometry,
          color: '#696969'
        }
      ]
    },
    {
      name: 'Architecture',
      icon: Home,
      objects: [
        {
          name: 'House Base',
          icon: Home,
          geometry: () => new THREE.BoxGeometry(2, 1, 1.5),
          color: '#D2691E'
        },
        {
          name: 'Pillar',
          icon: Square,
          geometry: () => new THREE.CylinderGeometry(0.2, 0.2, 2, 12),
          color: '#F5F5DC'
        },
        {
          name: 'Roof',
          icon: Triangle,
          geometry: () => new THREE.ConeGeometry(1.2, 0.8, 4),
          color: '#8B0000'
        }
      ]
    },
    {
      name: 'Decorative',
      icon: Star,
      objects: [
        {
          name: 'Star',
          icon: Star,
          geometry: () => {
            const shape = new THREE.Shape();
            const outerRadius = 0.5;
            const innerRadius = 0.2;
            const points = 5;
            
            for (let i = 0; i < points * 2; i++) {
              const angle = (i / (points * 2)) * Math.PI * 2;
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              if (i === 0) {
                shape.moveTo(x, y);
              } else {
                shape.lineTo(x, y);
              }
            }
            
            return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
          },
          color: '#FFD700'
        },
        {
          name: 'Heart',
          icon: Heart,
          geometry: () => {
            const shape = new THREE.Shape();
            const x = 0, y = 0;
            shape.moveTo(x, y);
            shape.bezierCurveTo(x, y - 0.3, x - 0.6, y - 0.3, x - 0.6, y);
            shape.bezierCurveTo(x - 0.6, y + 0.3, x, y + 0.6, x, y + 1);
            shape.bezierCurveTo(x, y + 0.6, x + 0.6, y + 0.3, x + 0.6, y);
            shape.bezierCurveTo(x + 0.6, y - 0.3, x, y - 0.3, x, y);
            
            return new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.02 });
          },
          color: '#FF1493'
        },
        {
          name: 'Lightning',
          icon: Zap,
          geometry: () => {
            const shape = new THREE.Shape();
            shape.moveTo(0, 0.8);
            shape.lineTo(-0.2, 0.2);
            shape.lineTo(0.1, 0.2);
            shape.lineTo(-0.1, -0.8);
            shape.lineTo(0.2, -0.2);
            shape.lineTo(-0.1, -0.2);
            shape.closePath();
            
            return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
          },
          color: '#FFFF00'
        }
      ]
    },
    {
      name: 'Everyday Objects',
      icon: Coffee,
      objects: [
        {
          name: 'Mug',
          icon: Coffee,
          geometry: () => {
            const group = new THREE.Group();
            
            // Main body
            const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.6, 16);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#FFFFFF' });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.3;
            group.add(body);
            
            // Handle
            const handleGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16, Math.PI);
            const handleMaterial = new THREE.MeshStandardMaterial({ color: '#FFFFFF' });
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.position.set(0.35, 0.3, 0);
            handle.rotation.z = Math.PI / 2;
            group.add(handle);
            
            return group;
          },
          color: '#FFFFFF'
        },
        {
          name: 'Light Bulb',
          icon: Lightbulb,
          geometry: () => {
            const group = new THREE.Group();
            
            // Bulb
            const bulbGeometry = new THREE.SphereGeometry(0.3, 16, 12);
            const bulbMaterial = new THREE.MeshStandardMaterial({ color: '#FFFACD', transparent: true, opacity: 0.8 });
            const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
            bulb.position.y = 0.3;
            group.add(bulb);
            
            // Base
            const baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.2, 12);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: '#C0C0C0' });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = -0.1;
            group.add(base);
            
            return group;
          },
          color: '#FFFACD'
        }
      ]
    }
  ];

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleObjectCreate = (objectDef: any) => {
    const geometryOrGroup = objectDef.geometry();
    
    // Check if it's a THREE.Group or THREE.BufferGeometry
    if (geometryOrGroup instanceof THREE.Group) {
      // It's already a complete group, add it directly
      geometryOrGroup.position.set(0, 0, 0);
      addObject(geometryOrGroup, objectDef.name);
    } else {
      // It's a BufferGeometry, create a mesh with material
      const material = new THREE.MeshStandardMaterial({ color: objectDef.color || '#44aa88' });
      const mesh = new THREE.Mesh(geometryOrGroup, material);
      mesh.position.set(0, 0, 0);
      addObject(mesh, objectDef.name);
    }
  };

  return (
    <div className="absolute top-20 left-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsLibraryOpen(!isLibraryOpen)}
        className="bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5 transition-all duration-200 flex items-center gap-2 text-white/90"
        title="3D Object Library"
      >
        <Cuboid className="w-5 h-5" />
        <span className="text-sm font-medium">Object Library</span>
        {isLibraryOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Library Panel */}
      {isLibraryOpen && (
        <div className="mt-2 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 border border-white/5 w-80 max-h-[70vh] overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white/90 mb-4">3D Object Library</h2>
            
            <div className="space-y-2">
              {objectCategories.map((category) => (
                <div key={category.name} className="border border-white/5 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors flex items-center justify-between text-white/90"
                  >
                    <div className="flex items-center gap-2">
                      <category.icon className="w-5 h-5" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    {expandedCategories.includes(category.name) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {expandedCategories.includes(category.name) && (
                    <div className="p-2 bg-[#1a1a1a] grid grid-cols-2 gap-2">
                      {category.objects.map((obj) => (
                        <button
                          key={obj.name}
                          onClick={() => handleObjectCreate(obj)}
                          className="p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-all duration-200 flex flex-col items-center gap-2 text-white/90 hover:scale-105 active:scale-95"
                          title={`Add ${obj.name}`}
                        >
                          <obj.icon className="w-6 h-6" />
                          <span className="text-xs font-medium text-center">{obj.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectLibrary;