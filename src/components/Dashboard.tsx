import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MetricCard } from "./MetricCard";
import { ChartContainer } from "./ChartContainer";
import { GoogleConnectionCard } from "./GoogleConnectionCard";

interface DashboardProps {
  sessionToken: string;
  sessionData: {
    client: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    tenant: {
      id: string;
      name: string;
      domain: string;
      isGoogleConnected: boolean;
    };
  };
  onLogout: () => void;
}

export function Dashboard({ sessionToken, sessionData, onLogout }: DashboardProps) {
  const [dateRange, setDateRange] = useState(30);
  const logoutClient = useMutation(api.dashboard.logoutClient);

  const metrics = useQuery(api.dashboard.getDashboardMetrics, {
    sessionToken,
    dateRange,
  });

  const handleLogout = async () => {
    await logoutClient({ sessionToken });
    onLogout();
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">{sessionData.tenant.name}</h1>
                <p className="text-sm text-gray-400">{sessionData.tenant.domain}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">{sessionData.client.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Google Connection Card */}
        {sessionData.client.role === "admin" && (
          <div className="mb-8">
            <GoogleConnectionCard 
              sessionToken={sessionToken}
              isConnected={metrics.isGoogleConnected}
              googleAnalyticsPropertyId={metrics.googleAnalyticsPropertyId}
              searchConsoleUrl={metrics.searchConsoleUrl}
            />
          </div>
        )}

        {/* Analytics Metrics */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Google Analytics
            {!metrics.isGoogleConnected && (
              <span className="ml-2 text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                Demo Data
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Sessions"
              value={metrics.analytics.sessions.toLocaleString()}
              icon="users"
              trend="+12.5%"
            />
            <MetricCard
              title="Users"
              value={metrics.analytics.users.toLocaleString()}
              icon="user"
              trend="+8.2%"
            />
            <MetricCard
              title="Pageviews"
              value={metrics.analytics.pageviews.toLocaleString()}
              icon="eye"
              trend="+15.3%"
            />
            <MetricCard
              title="Bounce Rate"
              value={`${metrics.analytics.bounceRate}%`}
              icon="trending-down"
              trend="-2.1%"
              trendPositive={false}
            />
          </div>
        </div>

        {/* Search Console Metrics */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Google Search Console
            {!metrics.isGoogleConnected && (
              <span className="ml-2 text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                Demo Data
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Clicks"
              value={metrics.searchConsole.clicks.toLocaleString()}
              icon="cursor-click"
              trend="+18.7%"
            />
            <MetricCard
              title="Impressions"
              value={metrics.searchConsole.impressions.toLocaleString()}
              icon="eye"
              trend="+22.1%"
            />
            <MetricCard
              title="CTR"
              value={`${metrics.searchConsole.ctr}%`}
              icon="trending-up"
              trend="+5.4%"
            />
            <MetricCard
              title="Avg. Position"
              value={metrics.searchConsole.position.toString()}
              icon="hashtag"
              trend="-1.2"
              trendPositive={false}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="Traffic Overview"
            data={metrics.chartData.filter(d => d.source === 'analytics')}
            type="analytics"
          />
          <ChartContainer
            title="Search Performance"
            data={metrics.chartData.filter(d => d.source === 'search_console')}
            type="search"
          />
        </div>
      </main>
    </div>
  );
}
