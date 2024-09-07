let db;

export function getDb(){
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('rssDatabase', 9);

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
      }
    };
  });
}

export function storeLastRunTime() {
  getDb().then(db => {
    const transaction = db.transaction(['meta'], 'readwrite');
    const store = transaction.objectStore('meta');
    const lastRunTime = new Date().toISOString();

    store.put({ id: 'lastRunTime', value: lastRunTime });
  }).catch(error => {
    console.error('Error storing last run time: ', error);
  });
}

export function getLastRunTime() {
  return getDb().then(db => {
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
    const objTransaction = db.transaction(['rssObj'], 'readwrite');
    const objStore = objTransaction.objectStore('rssObj');
    const objRequest = objStore.add({title, desc, pubDate, rssFeed });

    objRequest.onsuccess = function(event) {
      // When object is created, add to feed obj list
      const rssObjId = event.target.result;
      console.log(rssObjId);
      const feedTransaction = db.transaction(['rssFeeds'], 'readwrite');
      const feedStore = feedTransaction.objectStore("rssFeeds");
      const feedRequest = feedStore.get(rssFeed);

      feedRequest.onsuccess = function(event) {
        // If able to get feed item, add obj to feed list
        const feed = event.target.result;
        if (!feed) {
          // Create feed if it does not exist
          feed = { rssFeed: rssFeedLink, rssObjIds: [rssObjId] };
          feedStore.add(feed).onsuccess = function() {
            resolve(rssObjId);
          }
        } else {
          feed.rssObjIds.push(rssObjId);
          feedStore.put(feed).onsuccess = function() {
            resolve(rssObjId);
          };
        }
      };

      feedRequest.onerror = function(event) {
        // Run error if fail to get feed
        console.error("Error updating RssFeeds: ", event.target.error);
        reject(event.target.error);
      };
    };

    objRequest.onerror = function(event) {
      //If can't add RSS obj, run error
      console.error("Error saving RSS item: ", event.target.error);
      reject(event.target.error);
    };
  });
}

export function getAllRssItems(db){
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
}

export function saveRssFeedUrl(db, url) {
  const transaction = db.transaction(['rssFeeds'], 'readwrite');
  const store = transaction.objectStore('rssFeeds');
  return store.add({ url, rssObjIds: [] });
}

export function deleteRssFeedUrl(db, url) {
  const feedTransaction = db.transaction(['rssFeeds'], 'readwrite');
  const feedStore = feedTransaction.objectStore('rssFeeds');
  
  const feedLinksRequest = feedStore.get(url);

  feedLinksRequest.onsuccess = function(event) {
    let feed = event.target.result;
    if (feed && feed.rssObjIds) {
      let rssObjTransaction = db.transaction(['rssObj'], "readwrite");
      let rssObjStore = rssObjTransaction.objectStore("rssObj");

      feed.rssObjIds.forEach(id => {
        rssObjStore.delete(id);
      });
    }
  }

  return feedStore.delete(url)
}


export function getAllRssFeedUrls() {
  return getDb().then(db => {
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
