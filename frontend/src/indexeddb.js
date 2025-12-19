export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pdvDB", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("offlineSales"))
        db.createObjectStore("offlineSales", { keyPath: "id", autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e);
  });
}

export async function saveOfflineSale(sale) {
  const db = await openDB();
  const tx = db.transaction("offlineSales", "readwrite");
  tx.objectStore("offlineSales").add(sale);
}

export async function getOfflineSales() {
  const db = await openDB();
  const tx = db.transaction("offlineSales", "readonly");
  const store = tx.objectStore("offlineSales");
  return new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

export async function clearOfflineSales() {
  const db = await openDB();
  const tx = db.transaction("offlineSales", "readwrite");
  tx.objectStore("offlineSales").clear();
}
