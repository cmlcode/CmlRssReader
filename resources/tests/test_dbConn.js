import { getAllRssFeedUrls, saveRssFeedUrl, deleteRssFeedByUrl, getDb,
  saveRssItem, getAllRssItems, getLastRunTime, getRssFeedLinkedIds} from "../scripts/dbConn.js";


var failedTests = 0;
var runTests = 0;

const TEST_URL_1 = "https://feeds.megaphone.fm/newheights";
const TEST_TITLE = "TEST_RSS_TILE";
const TEST_DESC = "TEST_RSS_DESC";
const TEST_OLD_PUB_DATE = "Wed, 19 Jul 2023 09:50:00 -0000";

async function set_test_env(databaseName){
  return new Promise((resolve, reject) => {
    let request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = function() {
      resolve();
    };
    request.onerror = function() {
      reject("Failed to delete database");
    };
    request.onblocked = function() {
      rejet("Operation blocked, failed to delete database");
    };
  });
}

async function test_getAllRssFeedUrls_empty(){
  runTests += 1;
  const dbObj = await getDb('rssDatabase');
  const rssUrls = await getAllRssFeedUrls(dbObj);
  if (rssUrls.length != 0){
    failedTests++;
    console.log("FAIL:test_getAllRssFeedUrls_empty");
  }
}

async function test_saveRssFeedUrl() {
  runTests += 1;
  const dbObj = await getDb('rssDatabase');
  saveRssFeedUrl(dbObj, TEST_URL_1);
  let rssUrls = await getAllRssFeedUrls(dbObj);
  if (rssUrls.length != 1){
    failedTests++;
    console.log("FAIL:test_saveRssFeedUrl:saveRssFeedUrl");
  }
  deleteRssFeedByUrl(dbObj, TEST_URL_1);
  rssUrls = await getAllRssFeedUrls(dbObj);
  if (rssUrls.length != 0){
    failedTests++;
    console.log("FAIL:test_saveRssFeedUrl:deleteRssFeedUrl");
  }
}

async function test_saveRssItem_noFeed() {
  runTests += 1;
  const dbObj = await getDb('rssDatabase');
  saveRssItem(dbObj, TEST_TITLE, TEST_DESC, TEST_OLD_PUB_DATE, TEST_URL_1);

  // rssFeed should not exist
  const rssUrls = await getAllRssFeedUrls(dbObj);
  if (rssUrls.length != 0){
    failedTests++;
    console.log("FAIL:test_getAllRssFeedUrls_empty");
  }

  // Test that rssItem is created
  let rssItems = await getAllRssItems(dbObj);
  if (rssItems.length != 1){
    failedTests++;
    console.log("FAIL:test_saveRssItem_noFeed:Failed to save rssObj");
  }
  // Test that saved rssItem has all information
  const rssObj = rssItems[0];
  if (rssObj['title'] != TEST_TITLE) {
    failedTests++;
    console.log("FAIL:test_saveRssItem_noFeed:Failed to save rssObj title");
  }
  if (rssObj['desc'] != TEST_DESC) {
    failedTests++;
    console.log("FAIL:test_saveRssItem_noFeed:Failed to save rssObj desc");
  }
  if (rssObj['pubDate'] != TEST_OLD_PUB_DATE){
    failedTests++;
    console.log("FAIL:test_saveRssItem_noFeed:Failed to save rssObj pub date");
  } 
  if (rssObj['rssFeed'] != TEST_URL_1){
    failedTests++;
    console.log("FAIL:test_saveRssItem_noFeed:Failed to save rssObj url");
  }

  deleteRssFeedByUrl(dbObj, TEST_URL_1);
  // Test that rssItem is removed
  rssItems = await getAllRssItems(dbObj);
  if (rssItems.length != 0){
    failedTests++;
    console.log("FAIL:test_saveRssItem_noFeed:Failed to delete rssObj")
  }
}

async function test_saveRssItem_feed() {
  runTests += 1;
  const dbObj = await getDb('rssDatabase');
  saveRssFeedUrl(dbObj, TEST_URL_1);
  saveRssItem(dbObj, TEST_TITLE, TEST_DESC, TEST_OLD_PUB_DATE, TEST_URL_1);

  // rssFeed should not exist
  const rssUrls = await getAllRssFeedUrls(dbObj);
  if (rssUrls.length != 1){
    failedTests++;
    console.log("FAIL:test_saveRssItem_feed: Failed to get rssUrl");
  }

  // Test that rssItem is created
  let rssItems = await getAllRssItems(dbObj);
  if (rssItems.length != 1){
    failedTests++;
    console.log("FAIL:test_saveRssItem_feed:Failed to save rssObj");
  }

  // Test that saved rssItem has all information
  const rssObj = rssItems[0];
  if (rssObj['title'] != TEST_TITLE) {
    failedTests++;
    console.log("FAIL:test_saveRssItem_feed:Failed to save rssObj title");
  }
  if (rssObj['desc'] != TEST_DESC) {
    failedTests++;
    console.log("FAIL:test_saveRssItem_feed:Failed to save rssObj desc");
  }
  if (rssObj['pubDate'] != TEST_OLD_PUB_DATE){
    failedTests++;
    console.log("FAIL:test_saveRssItem_feed:Failed to save rssObj pub date");
  } 
  if (rssObj['rssFeed'] != TEST_URL_1){
    failedTests++;
    console.log("FAIL:test_saveRssItem_feed:Failed to save rssObj url");
  }
  // Test that rssItem was linked to rssUrl
  const linkedIds = await getRssFeedLinkedIds(dbObj, TEST_URL_1);
  if (linkedIds.length != 1){
    failedTests++;
    console.log("FAIL:test_saveRssItem_feed:Failed to save RssObj to RssFeedLink");
  }


  deleteRssFeedByUrl(dbObj, TEST_URL_1);
  // Test that rssItem is removed
  rssItems = await getAllRssItems(dbObj);
  if (rssItems.length != 0){
    failedTests++;
    console.log("FAIL:test_saveRssItem_feed:Failed to delete rssObj")
  }
}

async function runTestSuite() {
  const databaseName = 'rssDatabase';
  await set_test_env(databaseName)
  await test_getAllRssFeedUrls_empty();
  await test_saveRssFeedUrl();
  await test_saveRssItem_noFeed();
  await test_saveRssItem_feed();
  console.log("TESTS RUN: " + runTests);
  console.log("TESTS FAILD: " + failedTests);
  console.log("FAILURE RATE: " + failedTests/runTests*100 + "%");
}

runTestSuite();
