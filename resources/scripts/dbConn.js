let db;

export function getDB(){
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('rssDatabase', 4);

    request.onsuccess = function(event) {
      db = request.result;
      resolve(db);
    };

    request.onerror = function(event) {
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
        objectStore.createIndex('rssFeed','rssFeed')
      }

      if (!db.objectStoreNames.contains('meta')) {
        const metaStore = db.createObjectStore('meta', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('rssFeeds')) {
        const feedStore = db.createObjectStore('rssFeeds', {
          keyPath: 'id',
          autoIncrement: true
        })
        feedStore.createIndex('url', 'url')
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

export function saveRssItem(db, title, desc, pubDate, rssFeed) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['rssObj'], 'readwrite');
    const store = transaction.objectStore('rssObj');

    const request = store.add({title, desc, pubDate, rssFeed });

    request.onsuccess = function(event) {
      resolve(event.target.result);
    }

    request.onerror = function(event) {
      console.error("Error saving RSS item: ", event.target.error);
      reject(event.target.error);
    }
  })
}

export function getAllRssItems(){
  return getDB().then(db => {
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

export function saveRssFeedUrl(db, url) {
  const transaction = db.transaction(['rssFeeds'], 'readwrite');
  const store = transaction.objectStore('rssFeeds');
  return store.add({ url });
}

export function getAllRssFeedUrls() {
  return getDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['rssFeeds'], 'readonly');
      const store = transaction.objectStore('rssFeeds');
      const request = store.getAll();

      request.onsuccess = function(event) {
        resolve(request.result);
      }

      request.onerror = function(event) {
        reject(event.target.errorCode);
      }
    })
  })
}
