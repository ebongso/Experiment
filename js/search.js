"use strict"
const TWITCHAPISEARCHSTREAMURL = 'https://api.twitch.tv/kraken/search/streams';

var state = (function () {
  var mState;
  function init() {  
    return {
    "q": "", 
    "page": 0, 
    "limit": 5, 
    "totalPage": 0
    };
  };
  
  return {
    get: function() {
      if(!mState) {
      mState = init();
    }
    return mState;
  },
  update: function(q, page, limit, totalPage) {
    mState = {
      "q": q, 
      "page": page, 
      "limit": limit, 
      "totalPage": totalPage
      };
    return mState;
  }
  };
})();

//After the page is reload, check if there's querystring in the URL
if(window.location.search) {
  refresh();
}

//Reload the page when the back/forward button is pressed
window.onpopstate = function(event) {
  refresh();
};

function refresh() {  
  var currentState = parseSearchQueryString(window.location.search.slice(1), 0);
  document.getElementById('searchQuery').value = decodeURI(currentState.q);
  makeSearchRequest(currentState.q, currentState.page, currentState.limit);
};

//Invoke the searchBtn click event when the "Enter" key is pressed
document.getElementById('searchQuery').onkeypress = function(event) {
  if(event.keyCode == 13) { //The "Enter" key
    document.getElementById('searchBtn').click();
  }
};
document.getElementById('searchBtn').onclick = function() {
  var q = document.getElementById('searchQuery').value;
  //Remove the whole script tag in the search query
  q = q.replace(/<script.*?>.*?<\/script>/ig, '');
  if(q == '') {
    alert("This is not a valid query. Please try again.");
  } else {
    var currentState = state.get();
    search(q, 0, currentState.limit); //reset to page 1 due to new search query
  }
};

document.getElementById('pageLeftArrow').onclick = function() {
  var currentState = state.get();
  search(currentState.q, currentState.page - 1, currentState.limit);
};

document.getElementById('pageRightArrow').onclick = function() {  
  var currentState = state.get();
  search(currentState.q, currentState.page + 1, currentState.limit);
};

function parseSearchQueryString(link, totalItems) {
  var qString = link.split('&');
  var offset = 0;
  var offsetAvailable = false;
  var parsedParams = { 
  "q": "", 
  "page": 0, 
  "limit": 5, 
  "totalPage": 0
  };
  for(let i = 0, count = qString.length; i < count; i++) {
    var params = qString[i].split('=');
    if(params[0] == 'q') {
      parsedParams.q = params[1];
    } else if(params[0] == 'limit') {
      parsedParams.limit = params[1];
    } else if(params[0] == 'offset') {
      offset = params[1];
      offsetAvailable = true;
    } else if(params[0] == 'page') {
      parsedParams.page = params[1];
    }
  }
  if(offsetAvailable == true) { //page is not in the querystring
    parsedParams.page = offset / parsedParams.limit;
  }
  parsedParams.totalPage = Math.ceil(totalItems / parsedParams.limit);
  
  return parsedParams;  
};

function search(q, page, limit) {
  //Update the browser history with the querystring. Useful for URL bookmarking
  if (history.pushState) {
      var urlWithQuery = window.location.protocol + "//" + window.location.host + 
        window.location.pathname + '?q=' + q + '&page=' + page + '&limit=' + limit;
      window.history.pushState({ path: urlWithQuery }, 'Twitch Search Stream' , urlWithQuery);
  }
  makeSearchRequest(q, page, limit);
};

function makeSearchRequest(q, page, limit) {
  var queryString = '?';
  makeSearchAPICall(buildSearchQueryString(q, page, limit));  

  function buildSearchQueryString(q, page, limit) {
    if(q != '') { //add the search term
      queryString += 'q=' + q;
    }
    if(page > 0) { //add the offset. Twitch API starts with 0 then increments by limit
      queryString += '&offset=' + (page * limit);
    }
    if(limit >= 100) { //add the number of items returned per page. Max is 100
      queryString += '&limit=100';
    } else if(limit >= 1) {
      queryString += '&limit=' + limit;
    }
  };
  
  function makeSearchAPICall() {
    var scriptTag = document.createElement('script');
    scriptTag.src = TWITCHAPISEARCHSTREAMURL + queryString + '&callback=searchCallback';
    document.body.appendChild(scriptTag);    
  };
};

function searchCallback(json) {
  try {
    if(json && typeof json === "object" && json !== null) {    
      if(json.hasOwnProperty('status')) { //only failed calls have the status key
        alert('Error: ' + json.status + ' ' + json.error + ' - ' + json.message);
      } else {
        document.getElementById('totalItems').innerHTML = json._total;

        var currentLink = json._links.self;
        var currentState = parseSearchQueryString(currentLink, json._total); //This only updates when the response is returned
    updateState(currentState);
        updatePaging(currentState.page, currentState.totalPage);

        var streams = json.streams;
        var listItem = document.createDocumentFragment();

        for(let i = 0, numStreams = streams.length; i < numStreams; i++) {
          var previewImage = streams[i].preview.template;
          previewImage = previewImage.replace('{width}', '100');
          previewImage = previewImage.replace('{height}', '100');

          var item = createItem(previewImage, streams[i].channel.display_name,
            streams[i].game, streams[i].viewers, streams[i].channel.status)
          listItem.appendChild(item);
        }

        var ul = document.getElementById('searchItems');
        while(ul.firstChild) { //clear out the list on the page
          ul.removeChild(ul.firstChild);
        }
        document.getElementById('searchItems').appendChild(listItem);
      }
    }
  } catch (ex) {
    alert("Invalid JSON data");
  }

  function updateState(params) {
    return state.update(params.q, params.page, params.limit, params.totalPage);
  };

  function createItem(previewImage, displayName, gameName, viewers, status) {
    var liTag = document.createElement('li');
    
    var imgTag = document.createElement('img');
    imgTag.src = previewImage;
    liTag.appendChild(imgTag);

    var h3Tag = document.createElement('h3');
    h3Tag.innerHTML = displayName;
    liTag.appendChild(h3Tag);

    var subtitleSpanTag = document.createElement('span');
    subtitleSpanTag.setAttribute('class', 'item-subtitle');
    subtitleSpanTag.innerHTML = gameName + ' - ' + viewers + ' viewers';
    liTag.appendChild(subtitleSpanTag);

    var statusSpanTag = document.createElement('span');
    statusSpanTag.setAttribute('class', 'item-status');
    statusSpanTag.innerHTML = status;
    liTag.appendChild(statusSpanTag);

    return liTag;
  };

  function updatePaging(currentPage, totalPage) {
    if(totalPage <= 1) { //There's only 1 page or no search result
      showPageLeftArrow(false);
      showPageRightArrow(false);
    } else if (currentPage >= totalPage - 1) { //This is the last page
      showPageLeftArrow(true);
      showPageRightArrow(false);
    } else if(currentPage > 0) { //In between pages
      showPageLeftArrow(true);
      showPageRightArrow(true);
    } else if(currentPage <= 0) { //This is the first page
      showPageLeftArrow(false);
      showPageRightArrow(true);
    }  

    document.getElementById('currentPage').innerHTML = 
      totalPage == 0 ? currentPage : currentPage + 1;
    document.getElementById('totalPage').innerHTML = totalPage;

    function showPageLeftArrow(show) {
      document.getElementById('pageLeftArrow').setAttribute('class', 
        (show ? 'active' : 'inactive'));
    };

    function showPageRightArrow(show) {
      document.getElementById('pageRightArrow').setAttribute('class', 
        (show ? 'active' : 'inactive'));
    };
  };
};