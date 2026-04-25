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
  if (document.getElementById('pwa-update-banner')) return;

  // Inject the slide-up animation once.
  if (!document.getElementById('pwa-update-style')) {
    const style = document.createElement('style');
    style.id = 'pwa-update-style';
    style.textContent = `
      @keyframes pwa-update-slide {
        0% { transform: translate(-50%, 120%); opacity: 0; }
        70% { transform: translate(-50%, -8%); opacity: 1; }
        100% { transform: translate(-50%, 0%); opacity: 1; }
      }
      @keyframes pwa-update-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      #pwa-update-btn:active { transform: scale(0.95); }
    `;
    document.head.appendChild(style);
  }

  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #1a2440;
      border: 4px solid #ffffff;
      border-radius: 28px;
      padding: 14px 18px 14px 22px;
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 9999;
      font-family: 'Arial', 'Helvetica', sans-serif;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
      animation: pwa-update-slide 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
      max-width: calc(100vw - 32px);
    ">
      <span style="
        color: #ffd866;
        font-size: 15px;
        font-weight: bold;
        letter-spacing: 0.5px;
        text-shadow: 0 2px 0 rgba(0,0,0,0.4);
      ">New version available</span>
      <button id="pwa-update-btn" style="
        background: #ffcc00;
        color: #3a2400;
        border: 3px solid #ffffff;
        padding: 10px 22px;
        border-radius: 22px;
        font-family: 'Arial', 'Helvetica', sans-serif;
        font-weight: bold;
        font-size: 15px;
        cursor: pointer;
        text-shadow: 0 1px 0 rgba(255,255,255,0.5);
        box-shadow: 0 4px 0 rgba(0,0,0,0.25);
        transition: transform 90ms ease-out;
        animation: pwa-update-pulse 1100ms ease-in-out infinite;
      ">UPDATE</button>
      <button id="pwa-dismiss-btn" style="
        background: none;
        color: #a8d4f0;
        border: none;
        font-family: 'Arial', 'Helvetica', sans-serif;
        font-weight: bold;
        font-size: 13px;
        cursor: pointer;
        padding: 6px 4px;
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
