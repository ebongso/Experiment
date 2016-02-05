"use strict"

//The State object to store the query, page#, limit, and total page
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