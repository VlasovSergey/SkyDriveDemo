(function ngOneDriveCtrl() {
    'use strict';
    var controllerId = 'ngCloudDriveCtrl', // Controller name is handy for logging
        rootTitle,
        DOWNLOADED_STATE = 1,
        NOT_DOWNLOADED_STATE = 0,
        PROGRESS_STATE = 2,
        scope,
        http,
        q,
        driveManager,
        accessTokenDb,
        dataBase,
        directoryIds = [],

        showStartDisplay = function() {
            scope.filesAndFolders = null;
            scope.showSignInButton = true;
            scope.search = false;
            if (window.ProgressIndicator) {
                ProgressIndicator.hide();
            }

        },

        hideStartDisplay = function(){
            scope.showSignInButton = false;
        },

        setDriveDirrectory  = function(nameDir) {
            rootTitle = nameDir;
            scope.directory = nameDir;
        },

        onServerErrorWhenRequestingData = function() {
            navigator.notification.alert("Please turn off airplane mode or make sure you're connected to a Wi-Fi or cellular network.", null, 'No network connection');
            showStartDisplay();
        },

        onUseAccessTokenError = function(error, storage, action ) {
            if(error && error.code == storage.getInvalidTokenErrorCode()) {
                driveManager.signIn().then(
                    function(accessToken) {
                        saveAccessTokenInDb(accessToken);
                        action();
                    }
                );
            } else {
                onServerErrorWhenRequestingData();
            }
        },

        accessTokenCheckAndShowStartDisplay = function() {
            if (StorageManager.getStorageInstance(StorageManager.STORAGE_ONE_DRIVE).getAccessToken() == null && StorageManager.getStorageInstance(StorageManager.STORAGE_GOOGLE_DRIVE).getAccessToken() == null) {
                scope.driveManager = false;
            }
            showStartDisplay();
        },

        getFilesByParameter = function(parameter, value) {
            return scope.filesAndFolders.filter(
                function(obj) {
                    return obj[parameter] === value;
                });
        },

        saveAccessTokenInDb = function(accessToken) {
            accessTokenDb.addItem(
                {
                    driveName: driveManager.getStorageName(),
                    accessToken: accessToken
                }
            );
        },

        addDownloadState = function(fileList) {
            fileList.forEach( function(fileInfo) {
                if (fileInfo.type !== 'folder') {
                    setFileState(fileInfo, NOT_DOWNLOADED_STATE);
                }
            });
        },

        setFileState = function(file, state) {
            file.state = state;
        },

        toPreFolder = function() {
            if (scope.showSignInButton && navigator.app) {
                navigator.app.exitApp();
            } else if ( (scope.directory == rootTitle) || scope.search) {
                scope.ShowNoSearchResult = false;
                scope.search = false;
                showStartDisplay();
                scope.$apply();
                return;
            }

            var directoryToLoad = directoryIds.length - 2 >= 0 ? directoryIds[directoryIds.length - 2] : null;

            scope.displayFolder(directoryToLoad, "backward");
        },

        doSearch = function(searchVal) {
            var search = searchVal ? searchVal : $("#searchField").val();

            hideStartDisplay();

            ProgressIndicator.show(true);
            scope.search = true;
            var oneDrive = StorageManager.getStorageInstance(StorageManager.STORAGE_ONE_DRIVE),
                googleDrive = StorageManager.getStorageInstance(StorageManager.STORAGE_GOOGLE_DRIVE);

            oneDrive.fileSearch(search).then(
                function (oneDriveFiles) {
                    console.log('OneDrive: search completed');
                    addDownloadState(oneDriveFiles);

                    googleDrive.fileSearch(search).then(
                        function (googleDriveFiles) {
                            console.log('GoogleDrive: search completed');
                            addDownloadState(googleDriveFiles);
                            scope.filesAndFolders = oneDriveFiles.concat(googleDriveFiles).filter(
                                function(obj) {
                                    return obj.type != 'folder';
                                });
                            scope.ShowNoSearchResult = !scope.filesAndFolders.length;
                            updateStateOfDb();
                        },
                        function(error) {
                            onUseAccessTokenError(error, googleDrive, function() {doSearch(search);});
                        }
                    );
                },
                function(error) {
                    onUseAccessTokenError(error, oneDrive, function() {doSearch(search);});
                }
            );
        },

        updateStateOfDb = function() {
            scope.filesAndFolders.forEach(function(fileInfo){
                if (fileInfo.type != 'folder') {
                    dataBase.readItem(fileInfo.id, function(fileData) {
                        if (!fileData) return;
                        var file = getFilesByParameter('id', fileData.id)[0];
                        setFileState(file, fileData.state);
                        file.localPath = fileData.localPath;
                        if (fileData.url) {
                            file.source = fileData.url;
                        }
                        if (!file.startProgress && file.state == PROGRESS_STATE){
                            downloadFile(file);
                        }
                        scope.$apply();
                    });
                }
            });
            ProgressIndicator.hide();
        },

        downloadFile = function (file) {
            var onSuccess = function (filePath) {
                    var fileNew = getFilesByParameter('name', file.name)[0];
                    fileNew = fileNew?fileNew:file;
                    fileNew.startProgress = false;
                    fileNew.localPath = filePath;
                    fileNew.state = DOWNLOADED_STATE;
                    dataBase.addItem({
                        id: fileNew.id,
                        state: DOWNLOADED_STATE,
                        localPath: fileNew.localPath
                    });
                    scope.$apply();
                },
                onError = function (res) {
                    console.log("Error download: "+res);
                    var fileNew = getFilesByParameter('name', file.name)[0];
                    fileNew.startProgress = false;
                    fileNew.state = NOT_DOWNLOADED_STATE;
                    dataBase.removeItem(fileNew.id);
                    scope.$apply();
                },
                onProgress = function(res){
                    var fileNew = getFilesByParameter('id', file.id)[0];
                    fileNew.state = PROGRESS_STATE;
                    fileNew.progress = res;
                    scope.$apply();
                };
            driveManager.downloadFile(file.source, scope.directory + '/' + file.name, onSuccess, onError, onProgress);
        },

        saveStateToDataBase = function(file){
            file.state = PROGRESS_STATE;
            file.startProgress = true;
            file.progress = "0";
            dataBase.addItem({
                id: file.id,
                state: PROGRESS_STATE,
                url: file.source,
                localPath:file.localPath
            });
        },

        run = function (storage) {
            driveManager = StorageManager.getStorageInstance(storage);
            setDriveDirrectory(storage);
            driveManager.signIn().then(
                function (accessToken) {
                    ProgressIndicator.show(true);
                    driveManager.loadUserInfo().then(
                        function (userInfo) {
                            hideStartDisplay();
                            scope.driveManager = true;
                            scope.userName = userInfo.name;
                            scope.displayFolder();
                            saveAccessTokenInDb(accessToken);
                        },
                        function(error) {
                            onUseAccessTokenError(error, driveManager, function() {run(storage);});
                        }
                    );
                },
                function() {
                    showStartDisplay();
                }
            );
        },

        verificationAccessTokenToDataBase = function(storage) {
            accessTokenDb.readItem(storage, function(data) {
                if (data) {
                    driveManager = StorageManager.getStorageInstance(storage);
                    driveManager.setAccessToken(data.accessToken);
                    scope.driveManager = true;
                    scope.$apply();
                }
            });
        },

        onControllerCreated = function ($scope, $http, $q) {
            scope = $scope;
            http = $http;
            q = $q;

            scope.ShowNoSearchResult = false;
            scope.directory = rootTitle;

            scope.displayFolder = function (folder, direction) {
                if (folder && folder.type && (folder.type !== "folder")) return;

                ProgressIndicator.show(true);
                var folderId = folder ? (folder.id ? folder.id : folder) : null;

                driveManager.loadFilesData(folderId).then(
                    function (data) {
                        addDownloadState(data);
                        scope.filesAndFolders = data;

                        if(direction === "forward") {
                            scope.directory += '/' + folder.name;
                            directoryIds.push(folderId);
                        } else if (direction === "backward") {
                            directoryIds.splice(directoryIds.length - 1, 1);
                            var dirArr = scope.directory.split('/');
                            dirArr.splice(dirArr.length - 1, 1);
                            scope.directory = dirArr.join("/");
                        }
                        updateStateOfDb();
                    },
                    function(error) {
                        onUseAccessTokenError(error, driveManager, function() {scope.displayFolder(folder, direction);});
                    }
                );
            };

            scope.doSearch = function() {
                doSearch();
            };

            scope.StartLogin = function(storage) {
                run(storage);
            };

            scope.signOut = function() {
                driveManager.signOut().then(
                    function() {
                        driveManager.setAccessToken(null);
                        accessTokenDb.removeItem(driveManager.getStorageName());
                        accessTokenCheckAndShowStartDisplay();
                    }, function() {
                        navigator.notification.alert("Failed SignOut", null, 'Failed SignOut');
                        accessTokenCheckAndShowStartDisplay();
                    }
                );
            };

            scope.openFile = function(file) {
                if (file.state == 1) {
                    window.plugins.fileOpener.open(file.localPath);
                    return;
                }

                if (file.embedLink) {
                    window.open(file.embedLink + '?' + driveManager.getAccessToken(), '_blank', 'location=no');
                    return;
                }
            };

            scope.onClickDownloadButton = function(file) {
                saveStateToDataBase(file);
                downloadFile(file);
            };

            scope.stopDownload = function(file) {
                driveManager.stopDownloadFile(file.source);
            },
            
            scope.toPreFolder = function() {
                toPreFolder();
            };
 
            scope.getCurrentDirectory = function() {
                return scope.directory.replace(/[/]/g, "/ ");
            }

            scope.getStyleForType = function (obj) {
                if (obj.thumbnailLink) {
                    return {
                        'background-image': "url(" + obj.thumbnailLink + ")",
                        'background-size': '100%'
                    };
                }
                switch (obj.type) {
                    case "album": return {'background': "#3e4bff"};
                    case "audio":
                        return {
                            'background-image': obj.picture?"url(" + obj.picture + ")":'url("img/audio.png")',
                            'background-size': '100%'
                        };
                    case "file": return {
                        'background-image': 'url("img/file.png")',
                        'background-size': '100%'
                    };
                    case "folder": return {'background': "#3e4bff"};
                    case "photo":
                    case "video":
                        return {
                            'background-image': "url(" + obj.previewUrl + ")",
                            'background-size': '100%',
                            'background-repeat': 'no-repeat'
                        };
                    case "notebook": return {
                        'background-image': 'url("img/oneNote.png")',
                        'background-size': '100%'
                    };
                }
            };

            scope.generateDateTime = function(date) {
                return date.substr(0, 19).replace('T', ' ');
            };

            scope.tabindex = function() { return device.platform.indexOf('Win') != -1 ? "1" : "" }

            showStartDisplay();

            StorageManager.initialize(http, q);

            document.addEventListener("backbutton",
                function() {
                    if (!ProgressIndicator.isShow) toPreFolder();
                }, false);

            DbManager.getDataBase("DriveDataBase",[DbManager.getNewStore('accessToken', 'driveName', ['accessToken']),
                DbManager.getNewStore('storeFiles', 'id', ['state', 'url', 'localPath'])], function(dbAr) {
                accessTokenDb = dbAr[0];
                dataBase = dbAr[1];

                verificationAccessTokenToDataBase(StorageManager.STORAGE_ONE_DRIVE);
                verificationAccessTokenToDataBase(StorageManager.STORAGE_GOOGLE_DRIVE);
            });
        };

    angular.module('app', []).controller(controllerId, ['$scope', '$http', '$q', onControllerCreated]);
})();
