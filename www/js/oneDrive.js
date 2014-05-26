function OneDriveManager(clientId, redirectUri) {
    var ROOT_DIRECTORY = "me/skydrive",
        TOKEN_INVALID_CODE = "request_token_invalid",
        DRIVE_NAME = 'OneDrive',
        signOutRedirectUrl = redirectUri,
        signOutEvent = "loadstart",
        storage = CloudStorage(clientId, redirectUri),

        getDownloadUrlByFileId = function(id) {
            return "https://apis.live.net/v5.0/" + id + "/content?access_token=" + storage.getAccessToken();
        },

        getPreviewUrl = function(id){
            return  "https://apis.live.net/v5.0/" + id + "/picture?type=thumbnail&access_token="+ storage.getAccessToken();
        },

        processLoadedData = function(response) {
            response.data.forEach(function(item) {
                if (item.type == 'album') {
                    item.type = 'folder';
                }
                if(item.source) {
                    item.source = getDownloadUrlByFileId(item.id);
                }
                if (item.type == "photo" || item.type == "video" ) {
                    item.previewUrl = getPreviewUrl(item.id);
                }
            });
            return response.data;
        };

    storage.generateUrls = function() {
        var clientId = storage.getClientId(),
            accessToken = storage.getAccessToken(),
            searchString = storage.getSearchString(),
            redirectUri = storage.getRedirectUri(),

            userInfoUrl = "https://apis.live.net/v5.0/me/?method=GET&interface_method=undefined&pretty=false&return_ssl_resources=false&x_http_live_library=Web%2Fchrome_5.5&suppress_redirects=true&callback=JSONP&access_token="+accessToken,
            filesUrlForDirectory = "https://apis.live.net/v5.0/%folderID%/files?method=GET&interface_method=undefined&pretty=false&return_ssl_resources=false&x_http_live_library=Web%2Fchrome_5.5&suppress_redirects=true&callback=JSONP&access_token=" + accessToken,
            singOutUrl = "http://login.live.com/oauth20_logout.srf?access_token=" + accessToken + "&client_id=" + clientId + "&display=touch&locale=en&response_type=token&scope=wl.skydrive&state=redirect_type=auth&display=touch&request_ts=1392886026466&redirect_uri=x-wmapp0%253Awww%252Findex.html&response_method=url&secure_cookie=false&redirect_uri=" + redirectUri,
            signInUrl = "https://login.live.com/oauth20_authorize.srf?client_id=" + clientId + "&display=touch&locale=en&response_type=token&scope=wl.skydrive&state=redirect_type=auth&display=touch&redirect_uri=x-wmapp0%253Awww%252Findex.html&response_method=url&secure_cookie=false&redirect_uri=" + redirectUri,
            searchUrl = "https://apis.live.net/v5.0/me/skydrive/search?q=" + searchString + "&method=GET&interface_method=undefined&pretty=false&return_ssl_resources=false&x_http_live_library=Web%2Fchrome_5.5&suppress_redirects=true&callback=JSONP&access_token="+accessToken;

        storage.setUrls(userInfoUrl, filesUrlForDirectory, signInUrl, singOutUrl, searchUrl);
    };

    storage.setup(DRIVE_NAME, ROOT_DIRECTORY, TOKEN_INVALID_CODE, signOutRedirectUrl, signOutEvent, processLoadedData);

    return storage;
}