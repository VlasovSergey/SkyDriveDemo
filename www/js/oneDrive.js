/**
 * Created by sergey.vlasov on 2/18/14.
 *
 * {http://skydrivesuperdemo.com/skyDrive/index.html#access_token=EwA4Aq1DBAAUGCCXc8wU/zFu9QnLdZXy+YnElFkAAdqlexTU7ZSo4VEOw1AG0+qq5werlglXA9MPwniDH8AUgjFwDmDDXsKHW04ZBuGbpaKqe7QCY/+4MHsDpvPKASiG1tkk1nz9fPKKBu0GuEgnI9QagBFKyFwFPbLTKjEh+qeRt40BA0mqTbvDjnDV2VOFc2s4eqvm1jZIV5zsuPcKBXIs2r0uNH6BhCOppK1F6+AqWrjCuKFBRQY3JInxB7XY/QJ1Mn/0G+wUIA1RFAQjCC5/uKzRVwsL+fdQpnjBp7v9PNZsV0oyj0fMO1OMheWRIS2Al7hNfyFEqVaKU1cvybBMcaTj/c5cJ46B7EsGsW3y31hDE48Lz2pwpI2djjgDZgAACHmiR3MWltDhCAHDp7gHzM2oTZ7HbW/7YvVEH8O/BQ19vhbQuIqEv5XsvIKSas18AMgeN3XmFjI9xyJusa+bWDsYsT0gv4ihUteYTu6+8RHVu2jpv/DOpd3K0VCeWnMmffkzHrSDwPXq3WA+a5wnSJAg9zQ+vXv/d6lUs9mUo4WCADXP+WS8wK7RwyTwCG298pO6SM9mJGZtaRZIiIGYAf5Mu0B4aYrxotrWgBDOBwtLQcQEgYN4dGn+1QEmd1nuhMeD0HK0Qr0xe1iAbnidkyQY6MZIhWd+y9QAFrMJzEjAmJn1gRm7BmaxCQiYCw6YvMxYvxVS25fbqT3Da1nzdAMnEg/REqfYalv65W85uJmxKIMAAA==&authentication_token=eyJhbGciOiJIUzI1NiIsImtpZCI6IjEiLCJ0eXAiOiJKV1QifQ.eyJ2ZXIiOjEsImlzcyI6InVybjp3aW5kb3dzOmxpdmVpZCIsImV4cCI6MTM5MjgyNjc1NywidWlkIjoiZGM2ZWI0YjA1M2FlNDc5ZTBhNzgxN2RjYmFkODNhZmUiLCJhdWQiOiJza3lkcml2ZXN1cGVyZGVtby5jb20iLCJ1cm46bWljcm9zb2Z0OmFwcHVyaSI6ImFwcGlkOi8vMDAwMDAwMDA0ODExMzQ0NCIsInVybjptaWNyb3NvZnQ6YXBwaWQiOiIwMDAwMDAwMDQ4MTEzNDQ0In0.HJe2GRNhnjvisIE-RDPwepuPu6vWbwGzXlUa_7ppj_A&token_type=bearer&expires_in=3600&scope=wl.skydrive wl.signin wl.skydrive_update wl.basic wl.share&state=redirect_type=auth&display=touch&request_ts=1392740288950&redirect_uri=x-wmapp0%253Awww%252Findex.html&response_method=url&secure_cookie=false}
 */

window.getOneDriveInstance = function (http, q) {

    var SKYDRIVE_CLIENT_ID = "0000000048113444",
        SKYDRIVE_REDIRECT_URI = "http://skydrivesuperdemo.com/skyDrive/index.html";

    if (!window.__oneDrive) {
        window.__oneDrive = new OneDriveManager(SKYDRIVE_CLIENT_ID, SKYDRIVE_REDIRECT_URI);
        window.__oneDrive.onControllerCreated(http, q);
    }

    return window.__oneDrive;
}

function OneDriveManager(_clientId, _redirectUri) {
    var ROOT_DIRECTORY = "me/skydrive",
        accessToken,
        userInfoUrl ,
        filesUrlForDirectory,
        singOutUrl,
        clientId,
        signInUrl,
        redirectUri,
        http,
        q,
        searchUrl,
        nameSearch,

        doLoad = function(url) {
            var deferred = q.defer();

            http({
                    method: 'GET',
                    url: url}
            ).success(
                function (response) {
                    response.data.forEach(function(item) {
                        if (item.type == 'album') {
                            item.type = 'folder';
                        }
                    });
                    deferred.resolve(response.data);
                }).error(function (e) {
                    console.log(JSON.stringify(e));
                    deferred.resolve([]);
                });

            return deferred.promise;
        },

        getAccessTokenFromURL = function(url) {
            url = url.substr(url.indexOf('access_token='));
            if (url.length === 0) {
                return null;
            }
            if (url.indexOf('&') !== -1) {
                return url.substr(0, url.indexOf('&'));
            } else {
                return url;
            }
        },

        createDirectoryForPath= function(path, fileSystem) {
            var dirArgs = path.split('/'),
                tmpPath = dirArgs[0],
                deferred = q.defer(),
                createDir = function(i) {
                    if (i < dirArgs.length) {
                        fileSystem.root.getDirectory(tmpPath , {create: true}, function(){
                            if (i < dirArgs.length - 2){
                                tmpPath += '/' + dirArgs[i + 1];
                                createDir(i + 1);
                            } else {
                                deferred.resolve();
                            }
                        });
                    }
                };
            createDir(0);
            return deferred.promise;
        },

        generateURLs = function() {
            userInfoUrl = "https://apis.live.net/v5.0/me/?method=GET&interface_method=undefined&pretty=false&return_ssl_resources=false&x_http_live_library=Web%2Fchrome_5.5&suppress_redirects=true&"+accessToken;
            filesUrlForDirectory = "https://apis.live.net/v5.0/%folderID%/files?method=GET&interface_method=undefined&pretty=false&return_ssl_resources=false&x_http_live_library=Web%2Fchrome_5.5&suppress_redirects=true&"+accessToken;
            singOutUrl = "http://login.live.com/oauth20_logout.srf?" + accessToken + "&client_id=" + clientId + "&display=touch&locale=en&response_type=token&scope=wl.skydrive&state=redirect_type=auth&display=touch&request_ts=1392886026466&redirect_uri=x-wmapp0%253Awww%252Findex.html&response_method=url&secure_cookie=false&redirect_uri=" + redirectUri;
            signInUrl = "https://login.live.com/oauth20_authorize.srf?client_id=" + clientId + "&display=touch&locale=en&response_type=token&scope=wl.skydrive&state=redirect_type=auth&display=touch&redirect_uri=x-wmapp0%253Awww%252Findex.html&response_method=url&secure_cookie=false&redirect_uri=" + redirectUri;
            searchUrl =   "https://apis.live.net/v5.0/me/skydrive/search?q=" + nameSearch + "&method=GET&interface_method=undefined&pretty=false&return_ssl_resources=false&x_http_live_library=Web%2Fchrome_5.5&suppress_redirects=true&"+accessToken;
               // "https://apis.live.net/v5.0/me/skydrive/search?q=*&method=GET&interface_method=undefined&pretty=false&return_ssl_resources=false&x_http_live_library=Web%2Fchrome_5.5&access_token=EwBwAq1DBAAUGCCXc8wU%2FzFu9QnLdZXy%2BYnElFkAAaESto%2Fjf0osaWnlxjUTApKudk2Lly%2BBd5EH01yrvICrAKWfjyfzwcL3yT%2BLzR3qCxlhjYY%2BR79gdkJut3qDSjU4bTYZmT0SHPgDYS1Tj30t64jk6gkLxgJmR2GwhonvoX7xYvysPmYPB5bknfmVt1YVkQzmaWmXCt8FUzBhcvjzqIE%2Fm8gH0MHO7a%2FdDZOHDT9ou106YxAGSpu0wZa2XRw%2BvXKvMO53nXJFV0lsHWN3OtWE%2B%2BXdVo8HJsAvOUCA8Ye413g2M8Ul4Ncry5SYZVGFJ8Yb6dcZat9d1lRqfDIdRU%2BKWiYzW4r65BT1OTf%2BksO1XafN48xIlcGKTjfYOTsDZgAACHBiZRIaAuYBQAEV7LPgtz8tZUy61IDFiJ3cMZOOIAEOWh%2FaRi905M3PATwj4Qt6tu7dGbtLcyaBRzDKsHPSB2iKSeaAtn0g9iOC8ryzA%2Be%2FrKdTrBR4JY7fJVYFO8n977zYqEIOxp2mZ3rCJO7X39XqBVTzoM2aWXWog4QNOOEY%2BS%2Bqae%2Bwmw8uLVmm5K4SeVVMBxU2YwuW8oXu9M0qdEvisvgx%2FUr8MKi4NofvGHcEWx6PjYYkayx3b%2FnYhCmTfnCqeL%2BjUjdXAsBRo92WgJhgdaeehdliwlBXauF7tZdyA0K2z6qlP0tqUMKmHRefHFuavQg8eVa%2Ff4vji8aFNjlVjoEz7h12aYZPqK3pdhfAdY5QyeNQvfphy%2FdJIK3m61K7CzxrYMShY%2B8OwBe557UEkDQmbPlxnr4sMK7BY2r8LjmdZF%2BzSdqU20sB&callback=WL.Internal.jsonp.WLAPI_REQ_1_1398434574120&suppress_redirects=true";
        };
    clientId = _clientId;
    redirectUri = _redirectUri;
    //accessToken = getAccessTokenFromURL();
    generateURLs();

    return {
        setAccessToken: function(aToken) {
            accessToken = aToken;
            generateURLs();
        },

        getAccessToken: function() {
            return accessToken;
        },

        getUserInfoURL: function() {
            return userInfoUrl;
        },

        getClientId: function() {
            return clientId;
        },

        setClientId: function(cliId) {
            clientId = cliId;
            generateURLs();
        },

        getRedirectUri: function() {
            return redirectUri;
        },

        setRedirectUri: function(redUri) {
            redirectUri = redUri;
            generateURLs();
        },

        signIn: function(onSuccess) {
            ProgressIndicator.hide();
            //window.open(signInUrl, '_blank', 'location=no');
            //alert(signInUrl);
            var inAppBrowser = window.open(signInUrl,'_blank', 'location=no'),
                deferred = q.defer();
            ProgressIndicator.show(true);
            inAppBrowser.addEventListener('loadstop',function(e){
                                          //alert('loadstop');
                ProgressIndicator.hide();
            });
            
            /*inAppBrowser.addEventListener('loaderror', function(e){
                                          alert('loaderror::'+e.message);
                                          });*/
            
            inAppBrowser.addEventListener('loadstart', function (e) {
                //alert('staart url='+e.url);
                if (e.url.indexOf("access_token=") > 0) {
                    accessToken = getAccessTokenFromURL(e.url);
                    deferred.resolve(accessToken);
                    inAppBrowser.close();
                }
            });

            inAppBrowser.addEventListener('exit', function(e) {
                if(!accessToken){
                    deferred.reject();
                }
            });

            return deferred.promise;
        },

        signOut: function() {
            var deferred = q.defer();
            var inAppBrowser = window.open(singOutUrl, '_blank', 'location=no');
            ProgressIndicator.show(true);
            inAppBrowser.addEventListener('loadstart', function(e) {
                if (e.url.indexOf(redirectUri) === 0) {
                    inAppBrowser.close();
                    deferred.resolve();
                }
            });
            return deferred.promise;
        },

        onControllerCreated: function ($http, $q) {
            http = $http;
            q = $q;
        },

        loadFilesData : function(request) {
            var url = filesUrlForDirectory.replace("%folderID%", request||ROOT_DIRECTORY);

            return doLoad.call(this, url);
        },

        fileSearch: function (searName) {
            console.log('OneDrive: search start');
            var deferred = q.defer();
            nameSearch = searName;
            generateURLs();

            if(!accessToken) {
                deferred.resolve([]);
            } else {
                doLoad.call(this, searchUrl).then(
                    function(searchResult) {
                        deferred.resolve(searchResult);
                    }
                );
            }

            return deferred.promise;
        },

        loadUserInfo: function() {
            generateURLs();
            var deferred = q.defer();
            http({
                method: 'GET',
                url: userInfoUrl }
            ).success(
                function (userInfo) {
                    deferred.resolve(userInfo);
                }
            );
            return deferred.promise;
        },

        downloadFile: function (uriString, fileName, onSuccess , onError, onProgress) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
                createDirectoryForPath(fileName, fileSystem).then( function() {
                    fileSystem.root.getFile(fileName, { create: true }, function (targetFile){
                        var onSuccessThis = function(res){
                                onSuccess(targetFile.toNativeURL());
                            },
                            downloader = new BackgroundTransfer.BackgroundDownloader(),
                            // Create a new download operation.
                            download = downloader.createDownload(uriString, targetFile);
                        // Start the download and persist the promise to be able to cancel the download.
                        download.startAsync().then(onSuccessThis, onError, onProgress);
                    });
                });
            });
        }
    }
};

