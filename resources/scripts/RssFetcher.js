import { getDB, storeLastRunTime, isPubDateAfterLastRun, saveRssItem,
  getAllRssItems } from "./dbConn.js";

// Fetch and parse RSS Feed
function fetchRssFeed(rssUrl) {
  return fetch(rssUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }
      return response.text();
    })
    .then(str => {
      if (str.trim() === "") {
        throw new Error("Document is empty");
      }
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(str, "text/xml");
      const parseError = doc.getElementsByTagName("parsererror");

      if (parseError.length > 0) {
        throw new Error("Error parsing XML: ", parseError[0].textContent);
      }
      return doc;
    })
    .catch(error => {
      console.error("Error fetching and parsing RSS feed:", error);
      throw error;
    });
}

// Process and Save RSS Items
function processRssItems(items, shouldSaveItem) {
  return getDB().then(db => {
    items.forEach(item => {
      const title = item.querySelector("title")?.textContent || "No title";
      const desc = item.querySelector("description")?.textContent || "No description";
      const pubDate = item.querySelector("pubDate")?.textContent || null;
      
      shouldSaveItem(pubDate).then(shouldSave => {
        if (shouldSave) {
          saveRssItem(db, title, desc, pubDate).then(() => {
            console.log(`Saved item: ${title}`);
          }).catch(error => {
            console.error('Error saving RSS item:', error);
          });
        }
      });
    });

    storeLastRunTime();
  }).catch(error => {
    console.error("Error opening the database", error);
  });
}

function fetchAndProcessRSSItems(rssUrl, shouldSaveItem) {
  fetchRssFeed(rssUrl).then(doc => {
    const items = doc.querySelectorAll("item");
    processRssItems(items, shouldSaveItem);
  }).catch(error => {
    console.error('Error during RSS processing', error);
  });
}

export function fetchNewRssItems(rssUrl) {
  fetchAndProcessRSSItems(rssUrl, pubDate => {
    if (pubDate) {
      return isPubDateAfterLastRun(pubDate);
    }
    return Promise.resolve(false)
  });
}

export function fetchAllRssItems(rssUrl) {
  fetchAndProcessRssItems(rssUrl, () => Promise.resolve(true));
}

fetchNewRssItems('https://feeds.megaphone.fm/newheights')
