import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface GoogleConnectionCardProps {
  sessionToken: string;
  isConnected: boolean;
  googleAnalyticsPropertyId?: string;
  searchConsoleUrl?: string;
}

export function GoogleConnectionCard({
  sessionToken,
  isConnected,
  googleAnalyticsPropertyId,
  searchConsoleUrl,
}: GoogleConnectionCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const generateGoogleAuthUrl = useMutation(api.dashboard.generateGoogleAuthUrl);
  const disconnectGoogle = useMutation(api.dashboard.disconnectGoogle);
  const fetchGoogleData = useAction(api.googleApi.fetchGoogleData);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await generateGoogleAuthUrl({ sessionToken });
      
      // Open popup window for OAuth
      const popup = window.open(
        result.authUrl,
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      // Poll for popup closure
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          // Refresh the page to update connection status
          window.location.reload();
        }
      }, 1000);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect to Google");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectGoogle({ sessionToken });
      toast.success("Disconnected from Google services");
      // Refresh to update UI
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleFetchData = async () => {
    setIsFetching(true);
    try {
      await fetchGoogleData({ sessionToken });
      toast.success("Successfully fetched latest data from Google");
      // Refresh to show new data
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Google Services</h3>
            <p className="text-sm text-gray-400">
              {isConnected 
                ? "Connected to Google Analytics & Search Console" 
                : "Connect to get real-time data from Google Analytics and Search Console"
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <>
              <button
                onClick={handleFetchData}
                disabled={isFetching}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isFetching ? "Fetching..." : "Fetch Latest Data"}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? "Connecting..." : "Connect Google"}
            </button>
          )}
        </div>
      </div>
      
      {isConnected && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-300">
              Your dashboard is now showing real data from Google Analytics and Search Console.
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-green-800 text-xs text-gray-400 space-y-1">
            <p>
              <span className="font-semibold">Analytics Property ID:</span>{" "}
              {googleAnalyticsPropertyId || <span className="text-yellow-400">Not Set</span>}
            </p>
            <p>
              <span className="font-semibold">Search Console URL:</span>{" "}
              {searchConsoleUrl || <span className="text-yellow-400">Not Set</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
