/* Service Worker ของ Daily List
   - หน้าแอป (index.html): ดึงจากเน็ตก่อน ถ้าไม่มีเน็ตใช้ตัวที่เก็บไว้ → อัปเดตแอปได้เองเมื่อออนไลน์
   - ไฟล์อื่น (ไอคอน, ฟอนต์): ใช้ตัวที่เก็บไว้ก่อน แล้วค่อยอัปเดตเบื้องหลัง
   เมื่อแก้ไฟล์แอป ให้เปลี่ยนเลข VERSION เพื่อล้างแคชเก่า */
const VERSION = 'daily-list-v1.0.0';
const SHELL = ['./', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put('index.html', copy));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
