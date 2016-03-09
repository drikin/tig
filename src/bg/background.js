function getAll() {
  return new Promise(function(resolve) {
    chrome.windows.getAll({windowTypes: ['normal']}, function (windows) {
      resolve(windows);
    });
  });
}

function getAllInWindow(win) {
  return new Promise(function(resolve) {
    chrome.tabs.getAllInWindow(win.id, function(tabs) {
      resolve(tabs);
    });
  });
}

function getProcessIdForTab(tab) {
  return new Promise(function(resolve) {
    chrome.processes.getProcessIdForTab(tab.id, function(processId) {
      resolve(processId);
    });
  });
}

function getAllTabs() {
  return new Promise(function(resolve, reject) {
    let all = [];

    getAll()
      .then(function(wins) {
        promisedTabs = wins.map(getAllInWindow);
        Promise.all(promisedTabs)
          .then(function(allTabs) {
            for(let tabs of allTabs) {
              for(let tab of tabs) {
                all.push(tab);
              }
            }
            resolve(all);
          });
      });
  });
}

function getWorstMemory() {
  getAllTabs()
    .then(function(tabs) {
      let allProcessIds = [];
      promisedProcessIds = tabs.map(getProcessIdForTab);
      Promise.all(promisedProcessIds)
        .then(function(processIds) {
          for(let processId of processIds) {
            allProcessIds.push(processId);
          }
        });
      chrome.processes.getProcessInfo(allProcessIds, true, function(processes) {
        let wasteMemory = 0;
        let wasteProcess = null;
        for(let id of allProcessIds) {
          let process = processes[id];
          if (typeof process !== "undefined") {
            let m = process.privateMemory;
            if (m > wasteMemory) {
              wasteMemory = m;
              wasteProcess = process;
            }
          }
        }
        chrome.tabs.get(wasteProcess.tabs[0], function(tab) {
          console.log(tab);
          chrome.notifications.create({
            title: tab.title,
            type: "basic",
            message:"hoge",
            iconUrl:"icons/icon128.png",
            isClickable: true
          });
        });
      });
    });
}

(function() {
  chrome.alarms.onAlarm.addListener(function(alarm) {
    getWorstMemory();
  });

  chrome.alarms.create("check", {"periodInMinutes":0.5});
})();
