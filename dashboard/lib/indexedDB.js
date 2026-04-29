const dbName = 'AuthMonitorDB';
const storeName = 'logs';

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function addLog(logData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(logData);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllLogs() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteLogs(ids) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    ids.forEach(id => store.delete(id));
    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => reject(e.target.error);
  });
}
