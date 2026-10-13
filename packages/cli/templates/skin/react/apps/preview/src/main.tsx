import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/skin.css';
import './preview.css';
import { Player } from './player';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="preview-player">
      <Player />
    </div>
  </StrictMode>
);
