A simple web app that calls the TWITCH.TV Search Stream endpoint.

#### Features:

1. Search for a stream on TWITCH.TV using the "Search" button or "Enter" key on the keyboard.
2. Change the "Items per page" returned in a page.
3. Move to the next page using the right-arrow.
4. Move to the previous page using the left-arrow.
5. If coming back to the page using a bookmarked URL, the app does a search using the querystring in the URL.
6. If navigating using the browser's back/forward button, the app does a search using the querystring in the URL.
7. Clicking each preview image opens up the stream in a new tab.

#### Known issues on the Search Stream endpoint:

1. Inconsistent search results returned. Sometimes the streams in the search results are fewer than the "limit" returned by the endpoint.
2. Sometimes the service is down and returns the "(503) Service Unavailable" error message.
3. Sometimes searching for any query returns 0 result. A bug was reported: [https://github.com/justintv/Twitch-API/issues/495].

#### Potential enhancements:

1. Count the streams returned and make another request if they are fewer.
2. Better error handling on the UI.
3. Add Twitter Bootstrap to enhance the UI. 

This app is hosted at [http://ebongso.github.io].

[http://ebongso.github.io]:http://ebongso.github.io
[https://github.com/justintv/Twitch-API/issues/495]:https://github.com/justintv/Twitch-API/issues/495