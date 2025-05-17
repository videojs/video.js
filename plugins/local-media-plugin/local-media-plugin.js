// local-media-plugin.js
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// 获取 Video.js 基类
const Plugin = videojs.getPlugin('plugin');
const Button = videojs.getComponent('Button');

class FolderButton extends Button {
  constructor(player, options) {
    super(player, options);
    this.controlText('选择本地文件夹');
    this.el().innerHTML = '📂';  // 也可以自定义图标
    this.on('click', () => this.openFolder());
  }

  openFolder() {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      Object.assign(this.fileInput, {
        type: 'file',
        webkitdirectory: true,
        directory: true,
        multiple: true,
        accept: 'video/*',
        style: 'display:none'
      });
      document.body.appendChild(this.fileInput);
      this.fileInput.addEventListener('change', e => this.handleFiles(e));
    }
    this.fileInput.click();
  }

  async handleFiles(e) {
    const files = Array.from(e.target.files).filter(f => /\.(mp4|webm|ogg)$/i.test(f.name));
    if (!files.length) {
      this.player_.error('未检测到视频文件');
      return;
    }

    // 清空旧列表
    this.options_.containers.previewLeft.innerHTML = '';
    this.options_.containers.videoList.innerHTML = '';

    // 按原逻辑生成缩略 & 列表
    files.forEach((file, idx) => {
      const url = URL.createObjectURL(file);

      // 缩略图：用 video+canvas 抓帧
      const vid = document.createElement('video');
      Object.assign(vid, { src: url, muted: true, preload: 'metadata', style: 'display:none' });
      document.body.appendChild(vid);

      vid.addEventListener('loadedmetadata', async () => {
        vid.currentTime = Math.min(1, vid.duration / 2);
        vid.addEventListener('seeked', () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160; canvas.height = 90;
          canvas.getContext('2d').drawImage(vid, 0, 0, 160, 90);
          document.body.removeChild(vid);

          const thumb = document.createElement('div');
          thumb.className = 'thumb';
          thumb.innerHTML = `
            <img src="${canvas.toDataURL()}" title="${file.name}">
            <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${file.name}
            </div>`;
          thumb.addEventListener('click', () => play(idx));
          this.options_.containers.previewLeft.appendChild(thumb);
        }, { once: true });
      });

      // 列表项
      const li = document.createElement('li');
      li.textContent = file.name;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => play(idx));
      this.options_.containers.videoList.appendChild(li);

      // 播放函数
      const play = i => {
        const f = files[i];
        const src = URL.createObjectURL(f);
        this.player_.src({ src, type: f.type });
        this.player_.play();
        // 高亮
        Array.from(this.options_.containers.videoList.children).forEach((item,j) =>
          item.style.background = j===i ? '#e8f5e9' : ''
        );
        Array.from(this.options_.containers.previewLeft.children).forEach((item,j) =>
          item.style.outline = j===i ? '2px solid #2196f3' : 'none'
        );
      };
    });

    // 首次播放第 0 个
    files.length && (await new Promise(r => setTimeout(r, 100))) && files[0] && (this.player_.src({ src: URL.createObjectURL(files[0]), type: files[0].type }), this.player_.play());
  }
}

class LocalMediaPlugin extends Plugin {
  constructor(player, options = {}) {
    super(player, options);

    // 保留对这两个容器的引用
    const previewLeft = document.createElement('div');
    previewLeft.id = 'preview-left';
    const videoList = document.createElement('ul');
    videoList.id = 'video-list';

    // 插入到 player.el()
    const layout = document.createElement('div');
    layout.id = 'layout';
    layout.style.display = 'flex';
    previewLeft.style.width = '160px';
    videoList.style.width = '160px';
    layout.append(previewLeft, document.createElement('div'), videoList);
    player.el().appendChild(layout);

    // 插件里也可插入 color-select
    if (options.colors) {
      const select = document.createElement('select');
      select.id = 'color-select';
      options.colors.forEach(c => {
        const o = document.createElement('option');
        o.value = c; o.textContent = c;
        select.appendChild(o);
      });
      select.addEventListener('change', () => document.body.style.background = select.value);
      player.controlBar.el().appendChild(select);
    }

    // 注册并添加按钮
    videojs.registerComponent('FolderButton', FolderButton);
    player.controlBar.addChild('FolderButton', {
      containers: { previewLeft, videoList }
    }, options.insertIndex || 0);
  }
}

videojs.registerPlugin('localMedia', LocalMediaPlugin);

export default LocalMediaPlugin;
