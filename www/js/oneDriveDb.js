/**
 * Created by sergey.vlasov on 3/3/14.*/
(function(){
    var OneDriveDB = function(DB,tablename, _keyPath) {
        var db = DB,
            tableName = tablename,
            keyPath = _keyPath,
            getObjectStore = function(){
                return  db.transaction([tableName], "readwrite").objectStore(tableName);
            },
            addItem = function(data, onsuccess, onerror) {
                readItem(data[keyPath], function(fileData) {
                    if (fileData) {
                        replaceItem(data[keyPath], data, onsuccess, onerror)
                    } else {
                        var transaction = db.transaction([tableName], "readwrite"),
                            objectStore = transaction.objectStore(tableName),
                            request = objectStore.add(data);
                        transaction.onerror = onerror;
                        request.onsuccess = onsuccess;
                        request.onerror = onerror;
                    }
                });
            },

            readItem = function(id, onsuccess){
                getObjectStore().get(id).onsuccess = function(event) {
                    onsuccess(event.target.result);
                };
            },

            removeItem = function(id, onsuccess, onerror) {
                var request = getObjectStore()["delete"](id);
                /*request.onsuccess = onsuccess;
                request.onerror = onerror;*/
            },

            replaceItem = function(id, newObj, onsuccess, onerror) {
                var request = getObjectStore()["delete"](id);
                request.onsuccess = function() {
                    addItem(newObj, onsuccess, onerror);
                };
                request.onerror = onerror;
            };
        return {
            addItem : addItem,
            readItem: readItem,
            removeItem: removeItem,
            replaceItem: replaceItem
        };
        };

        window.DbManager = window.DbManager || {
            getDataBase: function(nameDB, storesArray , onSuccess) {
                var idbRequest = indexedDB.open(nameDB);
                idbRequest.onupgradeneeded =
                    function(event) {
                        var db = event.target.result;
                        storesArray.forEach(function(store){
                            var objectStore = db.createObjectStore(store.storeName, { keyPath: store.keyPath });
                            store.parametersArray.forEach(function(nameIndex) {
                                objectStore.createIndex(nameIndex, nameIndex, { unique: false });
                            });
                        })
                    };
                idbRequest.onsuccess = function(event) {
                    var db = event.target.result,
                        dbArray = [];
                    storesArray.forEach(function(store){
                        dbArray.push(new OneDriveDB(db, store.storeName, store.keyPath));

                    });
                    onSuccess(dbArray);

                }
            },

            deleteDB: function(nameDB) {
                indexedDB.deleteDatabase(nameDB);
            },

            getNewStore: function(storeName, keyPath, parametersArray) {
                return {
                    storeName: storeName,
                    keyPath: keyPath,
                    parametersArray: parametersArray
                }
            }
        };
}());
