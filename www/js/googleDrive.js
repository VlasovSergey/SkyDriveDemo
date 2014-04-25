/**
 * Created by sergey.vlasov on 2/18/14.
 */

function GoogleDriveManager(_clientId, _redirectUri) {

    var ROOT_DIRECTORY = "root",
        accessToken,
        userInfoUrl,
        filesUrlForDirectory,
        filesUrlForRootDirectory,
        singOutUrl,
        clientId,
        signInUrl,
        redirectUri,
        http,
        q,

        getAccessTokenFromURL = function (url) {
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

        createDirectoryForPath = function (path, fileSystem) {
            var dirArgs = path.split('/'),
                tmpPath = dirArgs[0],
                deferred = q.defer(),
                createDir = function (i) {
                    if (i < dirArgs.length) {
                        fileSystem.root.getDirectory(tmpPath, { create: true }, function () {
                            if (i < dirArgs.length - 2) {
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

        generateURLs = function () {
            userInfoUrl = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&" + accessToken;
            filesUrlForDirectory = "https://www.googleapis.com/drive/v2/files?" +
                "q='%folderID%'%20in%20parents%20and%20(trashed%20=%20false)&" + accessToken;
            filesUrlForRootDirectory = "https://www.googleapis.com/drive/v2/files?" + accessToken;
            singOutUrl = "https://accounts.google.com/o/oauth2/revoke?" + accessToken;
            signInUrl = "https://accounts.google.com/o/oauth2/auth?" +
                "client_id=" + clientId +
                "&response_type=token" +
                "&scope=openid%20profile%20https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/drive%20https://www.googleapis.com/auth/userinfo.profile" +
                "&state=redirect_type=auth" +
                "&redirect_uri=" + redirectUri;
        };

    clientId = _clientId;
    redirectUri = _redirectUri;
    generateURLs();

    return {
        setAccessToken: function (aToken) {
            accessToken = aToken;
            generateURLs();
        },

        getAccessToken: function () {
            return accessToken;
        },

        getUserInfoURL: function () {
            return userInfoUrl;
        },

        getClientId: function () {
            return clientId;
        },

        setClientId: function (cliId) {
            clientId = cliId;
            generateURLs();
        },

        getRedirectUri: function () {
            return redirectUri;
        },

        setRedirectUri: function (redUri) {
            redirectUri = redUri;
            generateURLs();
        },

        signIn: function (onSuccess) {
            ProgressIndicator.hide();
            var inAppBrowser = window.open(signInUrl, '_blank', 'location=no');
            deferred = q.defer();
            ProgressIndicator.show(true);

            inAppBrowser.addEventListener('loadstop', function (e) {
                ProgressIndicator.hide();
            });

            inAppBrowser.addEventListener('loadstart', function (e) {
                //alert('start url='+e.url);
                if (e.url.indexOf("access_token=") > 0) {
                    accessToken = getAccessTokenFromURL(e.url);
                    deferred.resolve(accessToken);
                    inAppBrowser.close();
                }
            });

            inAppBrowser.addEventListener('exit', function (e) {
                if (!accessToken) {
                    deferred.reject();
                }
            });

            return deferred.promise;
        },

        signOut: function () {
            var inAppBrowser = window.open(singOutUrl, '_blank', 'location=no');
            ProgressIndicator.show(true);
            inAppBrowser.addEventListener('loadstart', function (e) {
                if (e.url.indexOf(redirectUri) === 0) {
                    inAppBrowser.close();
                    location.reload();
                }
            });
        },

        onControllerCreated: function ($http, $q) {
            http = $http;
            q = $q;
        },

        loadFilesData: function (request) {
            var deferred = q.defer();
            var url = filesUrlForDirectory.replace("%folderID%", request || ROOT_DIRECTORY);
            http({
                method: 'GET',
                url: url
            }).success(
                function (response) {
                    response.items.forEach(function (item) {

                        if (item.mimeType == 'application/vnd.google-apps.folder') {
                            item.type = 'folder';
                            // Require separate request to count child items
                            item.count = 0; // Just stub
                        } else {
                            item.type = 'file';
                        }

                        item.updated_time = item.updated_time || item.modifiedDate;
                        // Dont work, item size did not shown in interface
                        item.size = item.size || item.fileSize;
                        item.name = item.name || item.title;
                        // TODO: try exportLinks property
                        item.source = item.source || item.downloadUrl;
                    });
                    deferred.resolve(response.items);
                }).error(function (e) { alert(e); });
            return deferred.promise;
        },

        loadUserInfo: function () {
            generateURLs();
            var deferred = q.defer();
            //window.external.Notify('progressbar_on');
            http({
                method: 'GET',
                url: userInfoUrl
            }
            ).success(
                function (userInfo) {
                    deferred.resolve(userInfo);
                }
            );
            return deferred.promise;
        },

        downloadFile: function (uriString, fileName, onSuccess, onError, onProgress) {
            // open target file for download
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                createDirectoryForPath(fileName, fileSystem).then(function () {
                    fileSystem.root.getFile(fileName, { create: true }, function (targetFile) {
                        var onSuccessThis = function (res) {
                            onSuccess(targetFile.toNativeURL());
                        };
                        var downloader = new BackgroundTransfer.BackgroundDownloader();
                        // Create a new download operation.
                        var download = downloader.createDownload(uriString, targetFile);
                        // Start the download and persist the promise to be able to cancel the download.
                        download.startAsync().then(onSuccessThis, onError, onProgress);
                    });
                });
            });
        }
    };
}