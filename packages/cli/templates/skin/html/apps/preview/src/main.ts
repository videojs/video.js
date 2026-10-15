import '@/skin.css';
import './preview.css';
import { createPlayer } from './player';

const wrapper = document.createElement('div');

wrapper.className = 'preview-player';
wrapper.append(createPlayer());
document.getElementById('root')!.append(wrapper);
