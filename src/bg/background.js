function getAllTabs() {
  var all = [];

  function getAllWindows() {
    return new Promise(function(resolve) {
      chrome.windows.getAll({windowTypes: ['normal']}, function (windows) {
        resolve(windows);
      });
    });
  }

  function getTabsInWindow(id) {
    return new Promise(function(resolve) {
      chrome.tabs.getAllInWindow(id, function(tabs) {
        resolve(tabs);
      });
    });
  }

  getAllWindows()
    .then(function(wins) {
      for(let w of wins) {
        getTabsInWindow(w.id)
          .then(function(tabs) {
            all.push(tabs);
          });
      }
      console.log(all);
    })

}

getAllTabs();
