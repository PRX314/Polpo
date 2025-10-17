import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = 'positive',
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-primary-200 rounded w-24"></div>
            <div className="h-8 bg-primary-200 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 bg-primary-200 rounded-lg"></div>
        </div>
        <div className="mt-4 h-4 bg-primary-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{title}</p>
          <p className="text-3xl font-bold text-primary-900 mt-2">{value}</p>
        </div>
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
      </div>
      
      {change !== undefined && (
        <div className="mt-4 flex items-center">
          {changeType === 'positive' ? (
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
          )}
          <span className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="text-sm text-primary-500 ml-1">vs mese scorso</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;