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
      // if (typeof processes[processId].privateMemory !== "undefined") {
      //   var memoryUsage = processes[processId].privateMemory/1024/1024;
      //   console.log(tab.title, memoryUsage);
      for(let id of allProcessIds) {
        let process = processes[id];
        if (typeof process !== "undefined") {
          console.log(process.title, process.privateMemory);
        }
      }
    });
  });

var timer = chrome.alarms.create("timer", {periodInMinutes:1});
  console.log(timer);
timer.onAlarm = function(alarm) {
  getAllTabs();
}

