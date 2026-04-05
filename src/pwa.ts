import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    showUpdateBanner();
  },
  onOfflineReady() {
    console.log('DEATHMARCH ready for offline play');
  },
});

function showUpdateBanner() {
  // Don't duplicate
  if (document.getElementById('pwa-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1a1a2e;
      border: 2px solid #ff4040;
      border-radius: 12px;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 9999;
      font-family: monospace;
      box-shadow: 0 4px 20px rgba(255, 64, 64, 0.3);
    ">
      <span style="color: #fff; font-size: 14px;">New version available!</span>
      <button id="pwa-update-btn" style="
        background: #ff4040;
        color: #fff;
        border: none;
        padding: 8px 20px;
        border-radius: 6px;
        font-family: monospace;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
      ">UPDATE</button>
      <button id="pwa-dismiss-btn" style="
        background: none;
        color: #666;
        border: none;
        font-family: monospace;
        font-size: 12px;
        cursor: pointer;
      ">later</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('pwa-update-btn')!.addEventListener('click', () => {
    updateSW(true);
  });

  document.getElementById('pwa-dismiss-btn')!.addEventListener('click', () => {
    banner.remove();
  });
}
