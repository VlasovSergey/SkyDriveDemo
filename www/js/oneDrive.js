/**
 * Created by sergey.vlasov on 2/18/14.
 *
 * {http://skydrivesuperdemo.com/skyDrive/index.html#access_token=EwA4Aq1DBAAUGCCXc8wU/zFu9QnLdZXy+YnElFkAAdqlexTU7ZSo4VEOw1AG0+qq5werlglXA9MPwniDH8AUgjFwDmDDXsKHW04ZBuGbpaKqe7QCY/+4MHsDpvPKASiG1tkk1nz9fPKKBu0GuEgnI9QagBFKyFwFPbLTKjEh+qeRt40BA0mqTbvDjnDV2VOFc2s4eqvm1jZIV5zsuPcKBXIs2r0uNH6BhCOppK1F6+AqWrjCuKFBRQY3JInxB7XY/QJ1Mn/0G+wUIA1RFAQjCC5/uKzRVwsL+fdQpnjBp7v9PNZsV0oyj0fMO1OMheWRIS2Al7hNfyFEqVaKU1cvybBMcaTj/c5cJ46B7EsGsW3y31hDE48Lz2pwpI2djjgDZgAACHmiR3MWltDhCAHDp7gHzM2oTZ7HbW/7YvVEH8O/BQ19vhbQuIqEv5XsvIKSas18AMgeN3XmFjI9xyJusa+bWDsYsT0gv4ihUteYTu6+8RHVu2jpv/DOpd3K0VCeWnMmffkzHrSDwPXq3WA+a5wnSJAg9zQ+vXv/d6lUs9mUo4WCADXP+WS8wK7RwyTwCG298pO6SM9mJGZtaRZIiIGYAf5Mu0B4aYrxotrWgBDOBwtLQcQEgYN4dGn+1QEmd1nuhMeD0HK0Qr0xe1iAbnidkyQY6MZIhWd+y9QAFrMJzEjAmJn1gRm7BmaxCQiYCw6YvMxYvxVS25fbqT3Da1nzdAMnEg/REqfYalv65W85uJmxKIMAAA==&authentication_token=eyJhbGciOiJIUzI1NiIsImtpZCI6IjEiLCJ0eXAiOiJKV1QifQ.eyJ2ZXIiOjEsImlzcyI6InVybjp3aW5kb3dzOmxpdmVpZCIsImV4cCI6MTM5MjgyNjc1NywidWlkIjoiZGM2ZWI0YjA1M2FlNDc5ZTBhNzgxN2RjYmFkODNhZmUiLCJhdWQiOiJza3lkcml2ZXN1cGVyZGVtby5jb20iLCJ1cm46bWljcm9zb2Z0OmFwcHVyaSI6ImFwcGlkOi8vMDAwMDAwMDA0ODExMzQ0NCIsInVybjptaWNyb3NvZnQ6YXBwaWQiOiIwMDAwMDAwMDQ4MTEzNDQ0In0.HJe2GRNhnjvisIE-RDPwepuPu6vWbwGzXlUa_7ppj_A&token_type=bearer&expires_in=3600&scope=wl.skydrive wl.signin wl.skydrive_update wl.basic wl.share&state=redirect_type=auth&display=touch&request_ts=1392740288950&redirect_uri=x-wmapp0%253Awww%252Findex.html&response_method=url&secure_cookie=false}
 */

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