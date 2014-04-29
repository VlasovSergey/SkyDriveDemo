// Copyright (c) Sergey Grebnov.  Licensed under the MIT license. 

using akvelon.cordova.oneDriveDemoApp;
using Microsoft.Phone.Controls;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO.IsolatedStorage;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Windows.Storage;
using WPCordovaClassLib.Cordova.Commands;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class ProgressIndicator : BaseCommand
    {
        private const string GRID_NAME = "LayoutRoot";
        private const string CORDOVA_BROWSER_NAME = "CordovaBrowser";
        
        ProgressBar progressBar;

        public void addProgressBar(String colorStr)
        {
            if (progressBar != null ) return;

            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                progressBar = new ProgressBar();
                progressBar.IsIndeterminate = true;
                progressBar.Visibility = Visibility.Visible;
                if (colorStr != null)
                {
                    try
                    {
                        var brush = new SolidColorBrush(
                                Color.FromArgb(
                                    255,
                                    Convert.ToByte(colorStr.Substring(1, 2), 16),
                                    Convert.ToByte(colorStr.Substring(3, 2), 16),
                                    Convert.ToByte(colorStr.Substring(5, 2), 16)
                                )
                            );
                        progressBar.Foreground = brush;
                    }
                    catch (Exception ex)
                    {
                        this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Invalid color string."));
                    }
                }

                PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                if (frame != null)
                {
                    PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                    if (page != null)
                    {
                        Grid grid = page.FindName(GRID_NAME) as Grid;

                        grid.Children.Add(progressBar);
                    }
                }
            });
        }

        private void removeProgressBar()
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                if (frame != null)
                {
                    PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                    if (page != null)
                    {
                        Grid grid = page.FindName(GRID_NAME) as Grid;
                        grid.Children.Remove(progressBar);
                        progressBar = null;
                    }
                }
            });
        }

        private void displayDisable()
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                if (frame != null)
                {
                    PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                    if (page != null)
                    {
                        WebBrowser wb = page.FindName(CORDOVA_BROWSER_NAME) as WebBrowser;
                        wb.IsEnabled = false;
                    }
                }
            });
        }

        private void setBrowserEnable(bool IsEnabled)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                if (frame != null)
                {
                    PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                    if (page != null)
                    {
                        CordovaView cView = page.FindName("CordovaView") as CordovaView;
                        if(cView != null)
                        {
                            WebBrowser wb = cView.Browser;
                            wb.IsEnabled = IsEnabled;
                        }
                    }
                }
            });
        }

        public void show(string options)
        {
            try
            {
                var optStings = JSON.JsonHelper.Deserialize<string[]>(options);

                bool tapDisable = Convert.ToBoolean(optStings[0]);
                if (tapDisable)
                {
                    setBrowserEnable(false);
                }
                addProgressBar(optStings[2]);
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
            } catch (Exception ex)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ex.Message));
            }

        }

        public void hide(string options)
        {
            try
            {
                removeProgressBar();
                setBrowserEnable(true);
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
            } catch (Exception ex)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ex.Message));
            }
        }
    }
}