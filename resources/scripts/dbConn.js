let db;

export function getDb(dbName){
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(dbName, 10);

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
        objectStore.createIndex('title', 'title');
        objectStore.createIndex('desc', 'desc');
        objectStore.createIndex('pubDate', 'pubDate');
        objectStore.createIndex('rssFeed','rssFeed');
      }

      if (!db.objectStoreNames.contains('meta')) {
        const metaStore = db.createObjectStore('meta', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('rssFeeds')) {
        const feedStore = db.createObjectStore('rssFeeds', {
          keyPath: 'url',
        });
        feedStore.createIndex('rssObjIds','rssObjIds');
        feedStore.createIndex('rssFeedName', 'rssFeedName');
      }
    };
  });
}

export function storeLastRunTime(dbObj) {
  const transaction = dbObj.transaction(['meta'], 'readwrite');
  const store = transaction.objectStore('meta');
  const lastRunTime = new Date().toISOString();

  store.put({ id: 'lastRunTime', value: lastRunTime });
}

export function getLastRunTime(dbObj) {
  return new Promise((resolve, reject) => {
    const transaction = dbObj.transaction(['meta'], 'readonly');
    const store = transaction.objectStore('meta');
    const request = store.get('lastRunTime');

    request.onsuccess = function(event) {
      resolve(request.result ? new Date(request.result.value) : null);
    };

    request.onerror = function(event) {
      reject(event.target.errorCode);
    };
  });
}

export function isPubDateAfterLastRun(dbObj, pubDate) {
  return getLastRunTime(dbObj).then(lastRunTime => {
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

export function saveRssItem(dbObj, title, desc, pubDate, rssFeed) {
  return new Promise((resolve, reject) => {
    const transaction = dbObj.transaction(['rssObj', 'rssFeeds'], 'readwrite');
    const objStore = transaction.objectStore('rssObj');
    const feedsStore = transaction.objectStore('rssFeeds');
    
    // Add new RSS Item
    const objRequest = objStore.add({ title, desc, pubDate, rssFeed });

    objRequest.onsuccess = function(event) {
      const newObjId = event.target.result;
      const feedRequest = feedsStore.get(rssFeed);

      feedRequest.onsuccess = function(event) {
        const feed = event.target.result;
        // If a feed obj exists with url, add the new item to its list
        if (feed) {
          if (!feed.rssObjIds) {
            feed.rssObjIds = [];
          }
          feed.rssObjIds.push(newObjId);
          const updateFeedRequest = feedsStore.put(feed);
        }
      };
      resolve();
    };

    objRequest.onerror = function(event) {
      //If can't add RSS obj, run error
      console.error("Error saving RSS item: ", event.target.error);
      reject(event.target.error);
    };
  });
}

export function getAllRssItems(dbObj){
  return new Promise((resolve, reject) => {
    const transaction = dbObj.transaction(['rssObj'], 'readonly');
    const store = transaction.objectStore('rssObj');
    const request = store.getAll();

    request.onsuccess = function(event) {
      resolve(request.result);
    };

    request.onerror = function(event) {
      reject(event.target.errorCode);
    };
  });
}

export function saveRssFeedUrl(dbObj, url, feedName) {
  const transaction = dbObj.transaction(['rssFeeds'], 'readwrite');
  const store = transaction.objectStore('rssFeeds');
  return store.add({ url, rssObjIds: [] , rssFeedName: feedName});
}

export function deleteRssFeedByUrl(dbObj, url) {
  const transaction = dbObj.transaction(['rssFeeds', 'rssObj'], 'readwrite');
  const feedStore = transaction.objectStore('rssFeeds');
  const rssObjStore = transaction.objectStore("rssObj");

  const feedLinksRequest = feedStore.get(url);
  
  feedLinksRequest.onsuccess = function(event) {
    const feed = event.target.result;
    if (feed && feed.rssObjIds) {
      feed.rssObjIds.forEach(feedObjId => {
        rssObjStore.delete(feedObjId);
      });
      feedStore.delete(url)
    } else {
      const index = rssObjStore.index('rssFeed');
      const rssFeedRequest = index.openCursor(IDBKeyRange.only(url));

      rssFeedRequest.onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
          rssObjStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    }
  };
}

export function getAllRssFeedUrls(dbObj) {
  return new Promise((resolve, reject) => {
    const transaction = dbObj.transaction(['rssFeeds'], 'readonly');
    const store = transaction.objectStore('rssFeeds');
    const request = store.getAll();

    request.onsuccess = function(event) {
      resolve(request.result);
    };

    request.onerror = function(event) {
      reject(event.target.errorCode);
    };
  });
}

export function getRssFeedLinkedIds(dbObj, rssUrl) {
  return new Promise((resolve, reject) => {
    const transaction = dbObj.transaction(['rssFeeds'], 'readonly');
    const feedStore = transaction.objectStore('rssFeeds');

    const feedLinksRequest = feedStore.get(rssUrl);
    
    feedLinksRequest.onsuccess = function(event) {
      const feed = event.target.result;
      if (feed && feed.rssObjIds) {
        resolve(feed.rssObjIds);
      }
      else {
        resolve([]);
      }
    };
  });
}

export function getRssFeedName(dbObj, rssUrl){
  return new Promise((resolve, reject) => {
    const transaction = dbObj.transaction(['rssFeeds'], 'readonly');
    const feedStore = transaction.objectStore('rssFeeds');
    const feedLinksRequest = feedStore.get(rssUrl);
    
    feedLinksRequest.onsuccess = function(event) {
      const feed = event.target.result;
      if (feed && feed.rssFeedName) {
        resolve(feed.rssFeedName);
      }
      else {
        resolve("");
      }
    };
  });
}
