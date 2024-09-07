import { getAllRssFeedUrls, saveRssFeedUrl, deleteRssFeedUrl, getDb} from "./dbConn.js";
import { fetchNewRssItems, fetchAllRssItems } from "./rssFetcher.js";

export function processAllFeeds(fetchAll = false) {
  getAllRssFeedUrls().then(function(rssUrls) {
    rssUrls.forEach((rssUrl) => { 
      rssUrl = rssUrl.url
      if(fetchAll){
        fetchAllRssItems(rssUrl);
      }
      else{
        fetchNewRssItems(rssUrl);
      }
    });
  });
}

export function addRssUrl(rssUrl) {
  getDb().then(function(dbObj) {
    saveRssFeedUrl(dbObj, rssUrl);
  });
}

export function delRssUrl(rssUrl) {
  getDb().then(function(dbObj) {
    deleteRssFeedUrl(dbObj, rssUrl);
  });
}

const RSS_URL = "https://feeds.megaphone.fm/newheights"
addRssUrl(RSS_URL)
processAllFeeds(true);
