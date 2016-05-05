A simple web app that calls the TWITCH.TV Search Stream endpoint.

#### Features:

1. Search for a stream on TWITCH.TV using the "Search" button or "Enter" key on the keyboard.
2. Change the "Items per page" (10, 25, 50, 75, 100) returned in a page. Max items returned by the endpoint in a request is 100.
3. Move to the next page using the right-arrow.
4. Move to the previous page using the left-arrow.
5. If coming back to the app using a bookmarked URL, the app does a search using the querystring in the URL.
6. If navigating using the browser's back/forward button, the app does a search using the querystring in the URL.
7. Clicking each preview image or stream name opens up the stream in a new tab.
8. Display the search results using a list view
9. The page number resets to 1 when a new query is searched or the "Items per page" is changed.
10. Do not allow search with no query or query with script tag.

#### Known issues on the Search Stream endpoint:

1. Inconsistent search results returned. Sometimes the streams in the search results are fewer than the "limit" returned by the endpoint. (No workaround. There are issues reported, but no resolution: [https://discuss.dev.twitch.tv/t/is-the-search-streams-part-of-the-api-broken/2385].)
2. Sometimes the service is down and returns the "(503) Service Unavailable" error message. (No workaround. Have to try later.)
3. Sometimes searching for any query returns 0 result. A bug was reported: [https://github.com/justintv/Twitch-API/issues/495]. (No workaround. Have to report as a bug, so the TWITCH.TV support can restart the service.)

#### Potential enhancements:

1. Count the streams returned and make another request if they are fewer.
2. Better error handling on the UI.
3. Add Twitter Bootstrap to enhance the UI. 
4. Make a grid view display.

[https://github.com/justintv/Twitch-API/issues/495]:https://github.com/justintv/Twitch-API/issues/495
[https://discuss.dev.twitch.tv/t/is-the-search-streams-part-of-the-api-broken/2385]:https://discuss.dev.twitch.tv/t/is-the-search-streams-part-of-the-api-broken/2385
