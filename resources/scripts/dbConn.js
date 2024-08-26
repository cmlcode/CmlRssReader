let db;

export function getDB(){
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('rssDatabase', 3);

    request.onsuccess = function(event) {
      db = request.result;
      resolve(db);
    };

    request.onerror = function(event) {
      console.error('Database error: ', request.errorCode);
      reject(event.target.errorCode)
    };

    request.onupgradeneeded = function(event) {
      // Create table
      const db = request.result;
      if (!db.objectStoreNames.contains('rssObj')) {
        const objectStore = db.createObjectStore('rssObj', {
          keyPath: 'rssId',
          autoIncrement: true 
        });
        objectStore.createIndex('title', 'title')
        objectStore.createIndex('desc', 'desc')
        objectStore.createIndex('pubDate', 'pubDate');
      }

      if (!db.objectStoreNames.contains('meta')) {
        const metaStore = db.createObjectStore('meta', { keyPath: 'id' });
      }
    };
  });
}

export function storeLastRunTime() {
  getDB().then(db => {
    const transaction = db.transaction(['meta'], 'readwrite');
    const store = transaction.objectStore('meta');
    const lastRunTime = new Date().toISOString();

    store.put({ id: 'lastRunTime', value: lastRunTime });
  }).catch(error => {
    console.error('Error storing last run time: ', error);
  });
}

export function getLastRunTime() {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['meta'], 'readonly');
      const store = transaction.objectStore('meta');
      const request = store.get('lastRunTime');

      request.onsuccess = function(event) {
        resolve(request.result ? new Date(request.result.value) : null);
      };

      request.onerror = function(event) {
        reject(event.target.errorCode);
      };
    });
  });
}

export function isPubDateAfterLastRun(pubDate) {
  return getLastRunTime().then(lastRunTime => {
    if (!lastRunTime) {
      return true;
    }
    const pubDateObj = new Date(pubDate);
    return pubDateObj > lastRunTime;
  }).catch(error => {
    console.error('Error comparing pubDate with last run time: ', error);
    return false;
  })
}

export function saveRssItem(db, title, desc, pubDate) {
  const transaction = db.transaction(['rssObj'], 'readwrite');
  const store = transaction.objectStore('rssObj');
  return store.add({title, desc, pubDate});
}

export function getAllRssItems(){
  return getDB(). then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['rssObj'], 'readonly');
      const store = transaction.objectStore('rssObj');
      const request = store.getAll();

      request.onsuccess = function(event) {
        resolve(request.result);
      };

      request.onerror = function(event) {
        reject(event.target.errorCode);
      };
    });
  })
}
