"use strict"

var app = (function(state, uiModel) {
  const CONFIG = {
    "ACTIVE": 'active',
    "CURRENT_PAGE": 'currentPage',
    "INACTIVE": 'inactive',
    "ITEM_STATUS": 'itemStatus',
    "ITEM_SUBTITLE": 'itemSubtitle',
    "LIMIT": 'limit',
    "LOADING_MASK": 'loadingMask',
    "PAGE_LEFT_ARROW": 'pageLeftArrow',
    "PAGE_RIGHT_ARROW": 'pageRightArrow',
    "SEARCH_BTN": 'searchBtn',
    "SEARCH_ITEMS": 'searchItems',
    "SEARCH_QUERY": 'searchQuery',
    "TOTAL_ITEMS": 'totalItems',
    "TOTAL_PAGE": 'totalPage',
    "TWITCH_API_SEARCH_STREAM_URL": 'https://api.twitch.tv/kraken/search/streams'
  };

  var State = function () {
    var mState;
    function init() {  
      return {
      "q": "", 
      "page": 0, 
      "limit": 25, 
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
  };

  var UiModel = function() {
    function getItemsPerPage() {
      return document.getElementById(CONFIG.LIMIT);
    };

    function getItemsPerPageSelection() {
      return getItemsPerPage().value;
    };

    function getPageLeftArrow() {
      return document.getElementById(CONFIG.PAGE_LEFT_ARROW);
    };

    function getPageRightArrow() {
      return document.getElementById(CONFIG.PAGE_RIGHT_ARROW);
    };

    function getSearchBtn() {
      return document.getElementById(CONFIG.SEARCH_BTN);
    };

    function getSearchQuery() {
      return document.getElementById(CONFIG.SEARCH_QUERY);
    };

    function getSearchQueryInput() {
      return getSearchQuery().value;
    };

    function setItemsPerPage(value) {
      var itemsPerPageDdl = getItemsPerPage();
      var itemsPerPageLength = itemsPerPageDdl.options.length;
      for (var i = 0; i < itemsPerPageLength; i++) {
        if (itemsPerPageDdl.options[i].text === value) {
          itemsPerPageDdl.selectedIndex = i;
          break;
        }
      }
    };
    
    function setSearchQueryInput(value) {
      getSearchQuery().value = value;
    };

    function setTotalItemField(value) {
      document.getElementById(CONFIG.TOTAL_ITEMS).innerHTML = value;
    };

    function showLoadingMask(show) {
        document.getElementById(CONFIG.LOADING_MASK).setAttribute('class', 
          (show ? CONFIG.LOADING_MASK : CONFIG.INACTIVE));
      };

    function updateListItem(listItem) {
      var ul = document.getElementById(CONFIG.SEARCH_ITEMS);
      while(ul.firstChild) { //clear out the list on the page
        ul.removeChild(ul.firstChild);
      }
      ul.appendChild(listItem);
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

      document.getElementById(CONFIG.CURRENT_PAGE).innerHTML = 
        (totalPage == 0) ? currentPage : currentPage + 1;
      document.getElementById(CONFIG.TOTAL_PAGE).innerHTML = totalPage;

      function showPageLeftArrow(show) {
        getPageLeftArrow().setAttribute('class', 
          (show ? CONFIG.ACTIVE : CONFIG.INACTIVE));
      };

      function showPageRightArrow(show) {
        getPageRightArrow().setAttribute('class', 
          (show ? CONFIG.ACTIVE : CONFIG.INACTIVE));
      };
    };
    
    return {
      getItemsPerPage: getItemsPerPage,
      getItemsPerPageSelection: getItemsPerPageSelection,
      getPageLeftArrow: getPageLeftArrow,
      getPageRightArrow: getPageRightArrow,
      getSearchBtn: getSearchBtn,
      getSearchQuery: getSearchQuery,
      getSearchQueryInput: getSearchQueryInput,
      setItemsPerPage: setItemsPerPage,
      setSearchQueryInput: setSearchQueryInput,
      setTotalItemField: setTotalItemField,
      showLoadingMask: showLoadingMask,
      updateListItem: updateListItem,
      updatePaging: updatePaging
    };
  };

  var state = state || new State();
  var uiModel = uiModel || new UiModel();

  var parseSearchQueryString = function(link, totalItems) {    
    var qString = link.substring(link.indexOf('?') + 1).split('&');
    var offset = 0;
    var offsetAvailable = false;
    var parsedParams = { 
      "q": "", 
      "page": 0, 
      "limit": 25, 
      "totalPage": 0
    };
    for(var i = 0, count = qString.length; i < count; i++) {
      var params = qString[i].split('=');
      if(params[0] == 'q') {
        parsedParams.q = params[1];
      } else if(params[0] == 'limit') {
        parsedParams.limit = parseInt(params[1]);
      } else if(params[0] == 'offset') {
        offset = params[1];
        offsetAvailable = true;
      } else if(params[0] == 'page') {
        parsedParams.page = parseInt(params[1]);
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
    uiModel.showLoadingMask(true);
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
      scriptTag.src = CONFIG.TWITCH_API_SEARCH_STREAM_URL + 
        queryString + '&callback=app.searchCallback';
      document.body.appendChild(scriptTag);    
    };
  };

  function getState() {
    return state.get();
  };

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
    subtitleSpanTag.setAttribute('class', CONFIG.ITEM_SUBTITLE);
    subtitleSpanTag.innerHTML = gameName + ' - ' + viewers + ' viewers';
    liTag.appendChild(subtitleSpanTag);

    var statusSpanTag = document.createElement('span');
    statusSpanTag.setAttribute('class', CONFIG.ITEM_STATUS);
    statusSpanTag.innerHTML = status;
    liTag.appendChild(statusSpanTag);

    return liTag;
  };
  
  function init() {
    //After the page is reload, check if there's querystring in the URL
    if(window.location.search) {
      refresh();
    };

    //Reload the page when the back/forward button is pressed
    window.onpopstate = function(event) {
      refresh();
    };

    function refresh() {  
      var currentState = parseSearchQueryString(window.location.search.slice(1), 0);
      uiModel.setSearchQueryInput((decodeURI(currentState.q)).replace(/\+/g, ' '));
      makeSearchRequest(currentState.q, currentState.page, currentState.limit);
    };

    uiModel.getItemsPerPage().onchange = function(event) {
      var currentState = getState();
      var selectedValue = parseInt(uiModel.getItemsPerPageSelection());

      if(currentState.limit != selectedValue) {
        search(currentState.q, 0, selectedValue); //reset to page 1
      }
    };

    //Invoke the searchBtn click event when the "Enter" key is pressed
    uiModel.getSearchQuery().onkeypress = function(event) {
      if(event.keyCode == 13) { //The "Enter" key
        uiModel.getSearchBtn().click();
      }
    };
    uiModel.getSearchBtn().onclick = function() {
      var q = uiModel.getSearchQueryInput();
      //Remove the whole script tag in the search query
      q = q.replace(/<script.*?>.*?<\/script>/ig, '');
      if(q == '') {
        alert("This is not a valid query. Please try again.");
      } else {
        var currentState = getState();
        search(q, 0, currentState.limit); //reset to page 1
      }
    }; 

    uiModel.getPageLeftArrow().onclick = function() {
      var currentState = getState();
      search(currentState.q, currentState.page - 1, currentState.limit);
    };

    uiModel.getPageRightArrow().onclick = function() {  
      var currentState = getState();
      search(currentState.q, currentState.page + 1, currentState.limit);
    };
  };
  
  return {
    init: init,
    searchCallback: function (json) {
      try {
        if(json && typeof json === "object" && json !== null) {    
          if(json.hasOwnProperty('status')) { //only failed calls have the status key
            alert('Error: ' + json.status + ' ' + json.error + ' - ' + json.message);
          } else {
            uiModel.setTotalItemField(json._total);

            var currentLink = json._links.self;
            //This only updates when the response is returned
            var currentState = parseSearchQueryString(currentLink, json._total); 
            updateState(currentState);
            uiModel.updatePaging(currentState.page, currentState.totalPage);
            uiModel.setItemsPerPage(String(currentState.limit));

            var streams = json.streams;
            var listItem = document.createDocumentFragment();

            for(var i = 0, numStreams = streams.length; i < numStreams; i++) {
              var previewImage = streams[i].preview.template;
              previewImage = previewImage.replace('{width}', '100');
              previewImage = previewImage.replace('{height}', '100');

              var item = createItem(previewImage, streams[i].channel.display_name,
                streams[i].game, streams[i].viewers, streams[i].channel.status)
              listItem.appendChild(item);
            }
            uiModel.updateListItem(listItem);

            setTimeout(function(){
              uiModel.showLoadingMask(false);
            }, 500);
          }
        }
      } catch (ex) {
        alert("Invalid JSON data");
        console.log(ex);
      }
    }
  };
})();
app.init();