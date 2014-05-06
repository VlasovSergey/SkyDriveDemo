/**
 * Created by sergey.vlasov on 2/18/14.
 */

function GoogleDriveManager(clientId, redirectUri) {
    var ROOT_DIRECTORY = "root",
        DRIVE_NAME = "googleDrive",
        TOKEN_INVALID_CODE = "401",
        signOutRedirectUrl = "https://accounts.google.com/ServiceLogin",
        signOutEvent = "loadstop",
        storage = CloudStorage(clientId, redirectUri),

        sanitizeReponseData = function (response) {
            response.items.forEach(function (item) {

                if (item.mimeType == 'application/vnd.google-apps.folder') {
                    item.type = 'folder';
                    // Require separate request to count child items
                    //item.count = ""; // Just stub
                } else {
                    item.type = 'file';
                }
                if (item.downloadUrl) {
                    console.log(item.downloadUrl);
                    item.source = item.downloadUrl + "&" + storage.getAccessToken();
                }

                item.updated_time = item.updated_time || item.modifiedDate;
                // Dont work, item size did not shown in interface
                item.size = item.size || item.fileSize;
                item.name = item.name || item.title;
                // TODO: try exportLinks property
                //item.source = item.source || item.downloadUrl;

                //
            });
        },

        processLoadedData = function(response) {
            sanitizeReponseData(response);
            response.items.sort(function(a, b) {
                return (b.type == 'folder') - (a.type == 'folder');
            });

            return response.items;
        };

    storage.generateUrls = function() {
        var clientId = storage.getClientId(),
            accessToken = storage.getAccessToken(),
            searchString = storage.getSearchString(),
            redirectUri = storage.getRedirectUri(),

            userInfoUrl = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&" + accessToken,
            filesUrlForDirectory = "https://www.googleapis.com/drive/v2/files?q='%folderID%'%20in%20parents%20and%20(trashed%20=%20false)&callback=JSONP&" + accessToken,
            singOutUrl = "https://accounts.google.com/logout?",
            signInUrl = "https://accounts.google.com/o/oauth2/auth?" +
                "client_id=" + clientId +
                "&response_type=token" +
                "&scope=openid%20profile%20https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/drive%20https://www.googleapis.com/auth/userinfo.profile" +
                "&state=redirect_type=auth" +
                "&redirect_uri=" + redirectUri,
            searchUrl = "https://www.googleapis.com/drive/v2/files?callback=JSONP&q=title%20contains%20'" + searchString + "'&" + accessToken;
        storage.setUrls(userInfoUrl, filesUrlForDirectory, signInUrl, singOutUrl, searchUrl);
    };

    storage.setup(DRIVE_NAME, ROOT_DIRECTORY, TOKEN_INVALID_CODE, signOutRedirectUrl, signOutEvent, processLoadedData);

    return storage;
}