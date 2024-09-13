import { getAllRssFeedUrls, saveRssFeedUrl, deleteRssFeedByUrl, getDb} from "./dbConn.js";
import { fetchNewRssItems, fetchAllRssItems } from "./rssFetcher.js";

export function processAllFeeds(fetchAll = false) {
  getDb('rssDatabase').then(function(dbObj) {
    getAllRssFeedUrls(dbObj).then(function(rssUrls) {
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
  });
}

export function addRssUrl(rssUrl) {
  getDb('rssDatabase').then(function(dbObj) {
    saveRssFeedUrl(dbObj, rssUrl);
  });
}

export function delRssUrl(rssUrl) {
  getDb('rssDatabase').then(function(dbObj) {
    deleteRssFeedUrl(dbObj, rssUrl);
  });
}
