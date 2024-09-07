import { getAllRssFeedUrls, saveRssFeedUrl, deleteRssFeedUrl, getDb, saveRssItem } from "../scripts/dbConn.js";

var failedTests = 0;
var runTests = 0;

const TEST_URL_1 = "https://feeds.megaphone.fm/newheights";
const TEST_TILE = "TEST_RSS_TILE";
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
  const dbObj = await getDb();
  const rssUrls = await getAllRssFeedUrls(dbObj)
  if (rssUrls.length != 0){
    failedTests++;
    console.log("FAIL: test_getAllRssFeedUrls_empty");
  }
}

async function test_saveRssFeedUrl() {
  runTests += 1;
  const dbObj = await getDb();
  saveRssFeedUrl(dbObj, TEST_URL_1);
  let rssUrls = await getAllRssFeedUrls(dbObj);
  if (rssUrls.length != 1){
    failedTests++;
    console.log("FAIL: test_saveRssFeedUrl:saveRssFeedUrl");
  }
  deleteRssFeedUrl(dbObj, TEST_URL_1);
  rssUrls = await getAllRssFeedUrls(dbObj);
  if (rssUrls.length != 0){
    failedTests++;
    console.log("FAIL: test_saveRssFeedUrl:deleteRssFeedUrl");
  }
}

async function test_saveRssItem() {
  runTests += 1;
  const dbObj = await getDb();
  saveRssItem(dbObj, TEST_TITLE, TEST_DESC, TEST_OLD_PUB_DATE, TEST_URL_1);

  if (rssUrls.length != 1){
    failedTests++;
    console.log("FAIL: test_saveRssItem:Failed to save rssUrl");
  }
  deleteRssFeedUrl(dbObj, TEST_URL_1);
  rssUrls = await getAllRssFeedUrls(dbObj);
  if (rssUrls.length != 0){
    failedTests++;
    console.log("FAIL: test_saveRssItem:deleteRssFeedUrl");
  }
  

}

async function runTestSuite() {
  const databaseName = 'rssDatabase';
  await set_test_env(databaseName)
  await test_getAllRssFeedUrls_empty();
  await test_saveRssFeedUrl();
  console.log("TESTS FAILD: " + failedTests);
  console.log("FAILURE RATE: " + failedTests/runTests*100 + "%");
}

runTestSuite();
