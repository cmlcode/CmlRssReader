import { getAllRssFeedUrls, saveRssFeedUrl, deleteRssFeedUrl, getDb} from "../scripts/dbConn.js";

var failedTests = 0;
var runTests = 0;

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
}


async function runTestSuite() {
  const databaseName = 'rssDatabase';
  await set_test_env(databaseName)
  await test_getAllRssFeedUrls_empty();
  console.log("TESTS FAILD: " + failedTests);
  console.log("FAILURE PERCENT: "+ failedTests/runTests);
}

runTestSuite();
