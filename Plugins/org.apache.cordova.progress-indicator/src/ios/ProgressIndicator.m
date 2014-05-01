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

#import "ProgressIndicator.h"

@implementation ProgressIndicator {
    bool ignoreNextError;
}

//@synthesize session;
//@synthesize downloadTask;

- (void)show:(CDVInvokedUrlCommand*)command
{
	@try {
		if(self.progressBar != NULL) {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK ];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        }
        
		BOOL boolValue = [[command.arguments objectAtIndex:0] boolValue];
        self.progressBar = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
        if ([command.arguments objectAtIndex:2] != nil) {
            NSString *stringColor = [command.arguments objectAtIndex:2];
            UIColor *color;
            NSUInteger red, green, blue;
            @try {
                sscanf([stringColor UTF8String], "#%02X%02X%02X", &red, &green, &blue);
                color = [UIColor colorWithRed:red green:green blue:blue alpha:1];
                self.progressBar.color = color;
            }
            @catch (NSException * e) {
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString: @"Color string invalid."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }
        }
		
		[self.webView.superview.superview addSubview:self.progressBar];
		self.progressBar.center = self.webView.superview.superview.center;
		

		dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0), ^{
			dispatch_async(dispatch_get_main_queue(), ^{
				self.webView.userInteractionEnabled = !boolValue;
				[self.progressBar startAnimating];
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString: @""];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
			});
		});
	}
	@catch (NSException * e) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString: e.reason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
	}    
}

- (void)hide:(CDVInvokedUrlCommand*)command
{
	@try {
		if(self.progressBar == NULL){
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString: @""];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        }
		dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0), ^{
			dispatch_async(dispatch_get_main_queue(), ^{
				[self.progressBar stopAnimating];
				self.webView.userInteractionEnabled = true;
				self.progressBar = NULL;
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString: @""];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
			});
		});
	}
	@catch (NSException * e) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString: e.reason];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
     
	}
    
}

@end