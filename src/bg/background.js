function getAllWindows() {
  return new Promise(function(resolve) {
    chrome.windows.getAll({windowTypes: ['normal']}, function (windows) {
      resolve(windows);
    });
  });
}

function getAllTabsInWindow(win) {
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

function getProcessInfo(processIds) {
  return new Promise(function(resolve) {
    chrome.processes.getProcessInfo(processIds, true, function(processes) {
      resolve(processes);
    });
  });
}

function getAllTabs() {
  return new Promise(function(resolve, reject) {
    let all = [];

    getAllWindows()
      .then(function(wins) {
        promisedTabs = wins.map(getAllTabsInWindow);
        Promise.all(promisedTabs)
          .then(function(allTabs) {
            for(let tabs of allTabs) {
              for(let tab of tabs) {
                if (!tab.pinned) {
                  all.push(tab);
                }
              }
            }
            resolve(all);
          });
      });
  });
}

function getWorstMemoryProcess() {
  return new Promise(function(resolve) {
    getAllTabs()
      .then(function(tabs) {
        promisedProcessIds = tabs.map(getProcessIdForTab);
        Promise.all(promisedProcessIds)
          .then(function(processIds) {
            let allProcessIds = [];
            for(let processId of processIds) {
              allProcessIds.push(processId);
            }
            return allProcessIds;
          })
          .then(function(allProcessIds) {
            getProcessInfo(allProcessIds)
              .then(function(processes) {
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
                resolve(wasteProcess);
              });
          });
      });
  });
}

function setWasteProcessNotification(process) {
  chrome.tabs.get(process.tabs[0], function(tab) {
    chrome.browserAction.setTitle({title: tab.title});
    chrome.notifications.create({
      title: tab.title,
      type: "basic",
      message: parseInt(process.privateMemory/1024/1024) + "MB used",
      iconUrl:"icons/icon128.png",
      isClickable: true
    });
  });
}

chrome.browserAction.onClicked.addListener(function(tab) {
  getWorstMemoryProcess()
    .then(function(process) {
      chrome.tabs.get(process.tabs[0], function(tab) {
        chrome.tabs.update(tab.id, {selected: true});
      });
    });
});

// init
(function() {
  chrome.alarms.onAlarm.addListener(function(alarm) {
    getWorstMemoryProcess()
      .then(function(process) {
        setWasteProcessNotification(process);
      });
  });

  chrome.alarms.create("check", {"periodInMinutes":10});

  getWorstMemoryProcess()
    .then(function(process) {
      setWasteProcessNotification(process);
    });
})();

