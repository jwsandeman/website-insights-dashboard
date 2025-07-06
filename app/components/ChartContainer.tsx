interface ChartData {
  date: string;
  source: string;
  sessions?: number;
  users?: number;
  pageviews?: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
}

interface ChartContainerProps {
  title: string;
  data: ChartData[];
  type: "analytics" | "search";
}

export function ChartContainer({ title, data, type }: ChartContainerProps) {
  // Sort data by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get the last 7 days for the mini chart
  const recentData = sortedData.slice(-7);

  const getMaxValue = () => {
    if (type === "analytics") {
      return Math.max(...recentData.map(d => d.sessions || 0));
    } else {
      return Math.max(...recentData.map(d => d.clicks || 0));
    }
  };

  const maxValue = getMaxValue();

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-medium text-white mb-4">{title}</h3>

      {recentData.length > 0 ? (
        <div className="space-y-4">
          {/* Mini Chart */}
          <div className="h-32 flex items-end space-x-1">
            {recentData.map((item, index) => {
              const value =
                type === "analytics" ? item.sessions || 0 : item.clicks || 0;
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-400"
                    style={{ height: `${height}%`, minHeight: "2px" }}
                  />
                  <span className="text-xs text-gray-400 mt-1">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
            {type === "analytics" ? (
              <>
                <div>
                  <p className="text-sm text-gray-400">Total Sessions</p>
                  <p className="text-lg font-semibold text-white">
                    {recentData
                      .reduce((sum, d) => sum + (d.sessions || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-lg font-semibold text-white">
                    {recentData
                      .reduce((sum, d) => sum + (d.users || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-400">Total Clicks</p>
                  <p className="text-lg font-semibold text-white">
                    {recentData
                      .reduce((sum, d) => sum + (d.clicks || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Impressions</p>
                  <p className="text-lg font-semibold text-white">
                    {recentData
                      .reduce((sum, d) => sum + (d.impressions || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-gray-400">
          No data available
        </div>
      )}
    </div>
  );
}
