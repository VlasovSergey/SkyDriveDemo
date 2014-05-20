/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements. See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership. The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License. You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import "BackgroundDownload.h"

@implementation BackgroundDownload {
    bool ignoreNextError;
}

@synthesize session;

- (void)startAsync:(CDVInvokedUrlCommand*)command
{
    if (nil == self.activeDownloads) {
        self.activeDownloads = [[ NSMutableDictionary alloc] init];
    }
    
    Download *curDownload = [[Download alloc] init];
    [curDownload setTargetFile:[command.arguments objectAtIndex:1]];
    [curDownload setDownloadUri:[command.arguments objectAtIndex:0]];
    [curDownload setCallbackId: command.callbackId];
    [self.activeDownloads setObject:curDownload forKey:[curDownload downloadUri]];

    NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString: [curDownload downloadUri]]];
    
    ignoreNextError = NO;
    
    session = [self backgroundSession];
    
    [session getTasksWithCompletionHandler:^(NSArray *dataTasks, NSArray *uploadTasks, NSArray *downloadTasks) {
        for (NSURLSessionDownloadTask *downloadTask in downloadTasks) {

            if ([[curDownload downloadUri] isEqualToString:downloadTask.currentRequest.URL.absoluteString]) {
                [curDownload setDownloadTask: downloadTask];
            }
        }
        if ([curDownload downloadTask] == nil) {
            [curDownload setDownloadTask: [session downloadTaskWithRequest:request]];
        }

        [[curDownload downloadTask] resume];

    }];
    
}

- (NSURLSession *)backgroundSession
{
    static NSURLSession *backgroundSession = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSURLSessionConfiguration *config = [NSURLSessionConfiguration backgroundSessionConfiguration:@"com.cordova.plugin.BackgroundDownload.BackgroundSession"];
        backgroundSession = [NSURLSession sessionWithConfiguration:config delegate:self delegateQueue:nil];
    });
    return backgroundSession;
}

- (void)stop:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    NSString *url = [command.arguments objectAtIndex:0];
    Download *curDovnload = self.activeDownloads[url];
    if (url != nil) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Arg was null"];
    }
    
    [[curDovnload downloadTask] cancel];
    
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)bytesWritten totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite {
    int64_t progress = 100 * totalBytesWritten / totalBytesExpectedToWrite;
    
    NSMutableDictionary* progressObj = [NSMutableDictionary dictionaryWithCapacity:1];
    [progressObj setObject:[NSNumber numberWithInteger:progress] forKey:@"progress"];
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:progressObj];
    result.keepCallback = [NSNumber numberWithInteger: TRUE];
    
    
    [self.commandDelegate sendPluginResult:result callbackId:[self.activeDownloads[[downloadTask.currentRequest.URL absoluteString]] callbackId]];
}

-(void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error {
    if (ignoreNextError) {
        ignoreNextError = NO;
        return;
    }
    
    Download *curDownload = self.activeDownloads[[task.currentRequest.URL absoluteString]] ;
    if (error != nil) {
        if ((error.code == -999)) {
            NSData* resumeData = [[error userInfo] objectForKey:NSURLSessionDownloadTaskResumeData];
            //resumeData is available only if operation was terminated by the system (no connection or other reason)
            //this happens when application is closed when there is pending download, so we try to resume it
            if (resumeData != nil) {
                ignoreNextError = YES;
                [task cancel];
                task = [self.session downloadTaskWithResumeData:resumeData];
                [task resume];
                return;
            }
        }
        CDVPluginResult* errorResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[error localizedDescription]];
        [self.commandDelegate sendPluginResult:errorResult callbackId:curDownload.callbackId];
    } else {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:curDownload.callbackId];
        
        [self.activeDownloads removeObjectForKey:curDownload.downloadUri] ;
    }
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location {
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSURL *url = downloadTask.currentRequest.URL;
    NSString *urlstr = [url absoluteString];
    Download *curDownload = self.activeDownloads[urlstr];
    
    NSURL *targetFile = [NSURL URLWithString:[self.activeDownloads[[downloadTask.currentRequest.URL absoluteString]] targetFile]];
    
    [fileManager removeItemAtPath:[targetFile path] error: nil];
    [fileManager createFileAtPath:[targetFile path] contents:[fileManager contentsAtPath:[location path]] attributes:nil];
}
@end

@implementation Download
@end