(function StorageManager(ns) {
    var ONEDRIVE_CLIENT_ID = "0000000048113444",
        ONEDRIVE_REDIRECT_URI = "http://skydrivesuperdemo.com/skyDrive/index.html",
        GOOGLEDRIVE_CLIENT_ID = "608994791757-mnhak64khir5gggp6328bbn6tovclmc9.apps.googleusercontent.com",
        GOOGLEDRIVE_REDIRECT_URI = "https://www.example.com/oauth2callback",

        storageList = {},
        storage,

        http,
        q,

        isInitialized = function() {
            return !!http && !!q;
        };

        ns.StorageManager = {
            STORAGE_ONE_DRIVE : "OneDrive",
            STORAGE_GOOGLE_DRIVE : "GoogleDrive",

            initialize: function($http, $q) {
                http = $http;
                q = $q;
            },

            getStorageInstance: function(storageName) {
                if (!isInitialized()) throw new Error("StorageManager has not been initialized");

                if (!storageList[storageName]) {
                    switch (storageName) {
                        case this.STORAGE_ONE_DRIVE:
                            storage = new OneDriveManager(ONEDRIVE_CLIENT_ID, ONEDRIVE_REDIRECT_URI);
                            break;
                        case this.STORAGE_GOOGLE_DRIVE:
                            storage = new GoogleDriveManager(GOOGLEDRIVE_CLIENT_ID, GOOGLEDRIVE_REDIRECT_URI);
                            break;
                        default:
                            throw new Error("unsupported storage: " + storageName);
                    }

                    if (!storage) throw new Error ("storage instance has not been created: " + storageName);

                    storage.initialize(http, q);
                    storageList[storageName] = storage;
                }

                return storageList[storageName];
            }
    };
})(window);
