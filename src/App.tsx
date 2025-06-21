import React from 'react';
import Scene from './components/Scene';
import Toolbar from './components/Toolbar';
import LayersPanel from './components/LayersPanel';
import ObjectProperties from './components/ObjectProperties';
import EditControls from './components/EditControls';
import CameraPerspectivePanel from './components/CameraPerspectivePanel';

function App() {
  return (
    <div className="w-full h-screen relative">
      <Scene />
      <Toolbar />
      <LayersPanel />
      <ObjectProperties />
      <EditControls />
      <CameraPerspectivePanel />
    </div>
  );
}

export default App;