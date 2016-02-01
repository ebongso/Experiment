"use strict"
const TWITCHAPISEARCHSTREAMURL = 'https://api.twitch.tv/kraken/search/streams';
var currentState = { "q": "", "page": 0, "limit": 5, "totalPage": 0 }

document.getElementById('searchBtn').onclick = function() {
	var q = document.getElementById('searchQuery').value;
	currentState.page = 0; //reset to page 1
	search(q, currentState.page, currentState.limit);
};

document.getElementById('pageLeftArrow').onclick = function() {
	var q = document.getElementById('searchQuery').value;
	var page = currentState.page - 1;

	if(page <= 0) {		
		showPageLeftArrow(false);
		showPageRightArrow(true);
	} else if(page > 0) {
		showPageLeftArrow(true);
		showPageRightArrow(true);
	}
	search(q, page, currentState.limit);
};

document.getElementById('pageRightArrow').onclick = function() {
	var q = document.getElementById('searchQuery').value;
	var page = currentState.page + 1;

	if (page >= currentState.totalPage - 1) {
		showPageRightArrow(false);
		showPageLeftArrow(true);
	} else if(page > 0) {
		showPageLeftArrow(true);
		showPageRightArrow(true);
	} 
	search(q, page, currentState.limit);
};

function showPageLeftArrow(show) {
	document.getElementById('pageLeftArrow').setAttribute('style', 
		'visibility: ' + (show ? 'visible' : 'hidden') + '; cursor: pointer;');
}

function showPageRightArrow(show) {
	document.getElementById('pageRightArrow').setAttribute('style', 
		'visibility: ' + (show ? 'visible' : 'hidden') + '; cursor: pointer;');
}

function search(q, page, limit) {
	//Build the querystring
	var queryString = '?callback=searchCallback';
	if(q != '') { //add the search term
		queryString += '&q=' + q;
	}
	if(page > 0) { //add the offset. Twitch API starts with 0 then increments by limit
		queryString += '&offset=' + (page * limit);
	}
	if(limit >= 100) { //add the number of items returned per page. Max is 100
		queryString += '&limit=100';
	} else if(limit >= 1) {
		queryString += '&limit=' + limit;
	}

	makeSearchRequest(queryString);
}

function makeSearchRequest(queryString) {
	var scriptTag = document.createElement('script');
	scriptTag.src = TWITCHAPISEARCHSTREAMURL + queryString;
	document.body.appendChild(scriptTag);
}

function searchCallback(response) {
	if(response != null) {
		var stringJson = JSON.stringify(response);
		var json = JSON.parse(stringJson);
		if(json.hasOwnProperty('status')) { //only failed calls have the status key
			console.log('Error: ' + json.status + ' ' + json.error + ' - ' + json.message);
		} else {
			document.getElementById('totalItems').innerHTML = json._total;

			var currentLink = json._links.self;
			updateState(currentLink, json._total);
			if(currentState.totalPage <= 0) {
				showPageRightArrow(false);
			}

			document.getElementById('currentPage').innerHTML = 
				currentState.totalPage == 0 ? currentState.page : currentState.page + 1;
			document.getElementById('totalPage').innerHTML = currentState.totalPage;

			var streams = json.streams;
			var listItem = document.createDocumentFragment();

			var numStreams = streams.length;
			for(let i = 0; i < numStreams; i++) {
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

	function updateState(link, totalItems) {
		var qString = link.split('&');
		var offset = 0;
		for(let i = 0; i < qString.length; i++) {
			var q = qString[i].split('=');
			if(q[0] == 'q') {
				currentState.q = q[1];
			} else if(q[0] == 'limit') {
				currentState.limit = q[1];
			} else if(q[0] == 'offset') {
				offset = q[1];
			}
		}
		currentState.page = offset / currentState.limit;
		currentState.totalPage = Math.ceil(totalItems / currentState.limit);
	}

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
	}
}