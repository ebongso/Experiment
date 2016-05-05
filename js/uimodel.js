"use strict"

//The UiModel object to get/update the DOM
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