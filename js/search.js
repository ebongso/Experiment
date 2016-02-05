"use strict"

//The main app
var app = (function(state, uiModel) {
  var state = state || new State();
  var uiModel = uiModel || new UiModel();
  
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
      var q = uiModel.getSearchQueryInput();
      if(q == '') {
        alert("The search query was not supplied. Please try again.");
        return;
      }
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
        alert("This is not a valid search query. Please try again.");
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

    //let was used instead of var, but Firefox version < 44 doesn't support it
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

  //Build the URL based on the query
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
    
    //Use JSONP when utilizing the Twitch API's
    function makeSearchAPICall() {      
      var scriptTag = document.createElement('script');
      scriptTag.src = CONFIG.TWITCH_API_SEARCH_STREAM_URL + 
        queryString + '&callback=app.searchCallback&client_id=' + CONFIG.CLIENT_ID;
      document.body.appendChild(scriptTag);    
    };
  };

  function getState() {
    return state.get();
  };

  function updateState(params) {
    return state.update(params.q, params.page, params.limit, params.totalPage);
  };

  //Build out the list item
  function createItem(previewImage, displayName, gameName, viewers, status, channelUrl) {
    var liTag = document.createElement('li');
    
    var aTag = document.createElement('a');
    aTag.setAttribute('target', '_blank');
    aTag.setAttribute('href', channelUrl);
    aTag.setAttribute('title', 'Click to watch now: ' + channelUrl);
    var imgTag = document.createElement('img');
    imgTag.src = previewImage;
    aTag.appendChild(imgTag);
    liTag.appendChild(aTag);

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
  
  //Build out the list
  function createListItem(streams) {
    var listItem = document.createDocumentFragment();
    //let was used instead of var, but Firefox version < 44 doesn't support it
    for(var i = 0, numStreams = streams.length; i < numStreams; i++) {
      var previewImage = streams[i].preview.template;
      previewImage = previewImage.replace('{width}', '100');
      previewImage = previewImage.replace('{height}', '100');

      var item = createItem(previewImage, streams[i].channel.display_name,
        streams[i].game, streams[i].viewers, streams[i].channel.status, 
        streams[i].channel.url);
      listItem.appendChild(item);
    }
    return listItem;
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

            var listItem = createListItem(json.streams);
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