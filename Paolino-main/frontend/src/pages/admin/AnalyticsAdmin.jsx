import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Euro,
  Package,
  Users,
  ShoppingCart
} from 'lucide-react';
import { adminAPI, API_SERVER_URL } from '../../services/api';
import StatsCard from '../../components/admin/StatsCard';

const AnalyticsAdmin = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const periodOptions = [
    { value: '7d', label: 'Ultimi 7 giorni' },
    { value: '30d', label: 'Ultimi 30 giorni' },
    { value: '90d', label: 'Ultimi 90 giorni' }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAnalytics({ period });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getTotalSales = () => {
    if (!analytics?.salesData) return 0;
    return analytics.salesData.reduce((total, day) => total + day.totalSales, 0);
  };

  const getTotalOrders = () => {
    if (!analytics?.salesData) return 0;
    return analytics.salesData.reduce((total, day) => total + day.orderCount, 0);
  };

  const getAverageOrderValue = () => {
    const totalSales = getTotalSales();
    const totalOrders = getTotalOrders();
    return totalOrders > 0 ? totalSales / totalOrders : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">Analytics</h1>
          <p className="text-primary-600 mt-1">
            Panoramica delle performance del negozio
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input w-auto"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button className="btn-outline flex items-center space-x-2">
            <Download size={16} />
            <span>Esporta</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Vendite Totali"
          value={formatCurrency(getTotalSales())}
          icon={Euro}
          loading={loading}
        />
        <StatsCard
          title="Ordini Totali"
          value={getTotalOrders()}
          icon={ShoppingCart}
          loading={loading}
        />
        <StatsCard
          title="Valore Medio Ordine"
          value={formatCurrency(getAverageOrderValue())}
          icon={TrendingUp}
          loading={loading}
        />
        <StatsCard
          title="Prodotti più Venduti"
          value={analytics?.topProducts?.length || 0}
          icon={Package}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">
            Andamento Vendite
          </h2>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-primary-400">Caricamento grafico...</div>
            </div>
          ) : analytics?.salesData?.length > 0 ? (
            <div className="space-y-4">
              {/* Simple Bar Chart */}
              <div className="h-48 flex items-end space-x-2">
                {analytics.salesData.map((day, index) => {
                  const maxSales = Math.max(...analytics.salesData.map(d => d.totalSales));
                  const height = maxSales > 0 ? (day.totalSales / maxSales) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-primary-600 rounded-t-sm hover:bg-primary-700 transition-colors cursor-pointer"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`${formatDate(day._id)}: ${formatCurrency(day.totalSales)}`}
                      />
                      <div className="text-xs text-primary-500 mt-2 transform -rotate-45 origin-left">
                        {formatDate(day._id)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-sm text-primary-600">
                <span>0€</span>
                <span>{formatCurrency(Math.max(...analytics.salesData.map(d => d.totalSales)))}</span>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-primary-500">
              Nessun dato disponibile per il periodo selezionato
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">
            Distribuzione Stati Ordini
          </h2>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div className="h-4 bg-primary-200 rounded w-24"></div>
                  <div className="h-4 bg-primary-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : analytics?.orderStatusData?.length > 0 ? (
            <div className="space-y-3">
              {analytics.orderStatusData.map((status) => {
                const total = analytics.orderStatusData.reduce((sum, s) => sum + s.count, 0);
                const percentage = total > 0 ? (status.count / total) * 100 : 0;
                
                const getStatusColor = (statusId) => {
                  const colors = {
                    pending: 'bg-yellow-500',
                    paid: 'bg-green-500',
                    processing: 'bg-blue-500',
                    shipped: 'bg-purple-500',
                    delivered: 'bg-green-600',
                    cancelled: 'bg-red-500',
                    refunded: 'bg-gray-500'
                  };
                  return colors[statusId] || 'bg-gray-400';
                };

                const getStatusLabel = (statusId) => {
                  const labels = {
                    pending: 'In attesa',
                    paid: 'Pagato',
                    processing: 'In elaborazione',
                    shipped: 'Spedito',
                    delivered: 'Consegnato',
                    cancelled: 'Annullato',
                    refunded: 'Rimborsato'
                  };
                  return labels[statusId] || statusId;
                };

                return (
                  <div key={status._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status._id)}`} />
                      <span className="text-sm text-primary-700">
                        {getStatusLabel(status._id)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-primary-900">
                        {status.count}
                      </span>
                      <span className="text-xs text-primary-500 ml-2">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-primary-500 py-8">
              Nessun dato sugli ordini disponibile
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="p-6 border-b border-primary-200">
          <h2 className="text-lg font-semibold text-primary-900">
            Prodotti più Venduti
          </h2>
        </div>
        
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-primary-200 rounded"></div>
                  <div className="h-4 bg-primary-200 rounded w-2/3"></div>
                </div>
                <div className="w-20 h-4 bg-primary-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : analytics?.topProducts?.length > 0 ? (
          <div className="p-0">
            <div className="divide-y divide-primary-200">
              {analytics.topProducts.map((item, index) => (
                <div key={item._id} className="p-4 flex items-center justify-between hover:bg-primary-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img
                          src={`${API_SERVER_URL}${item.product.images[0].url}`}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-400">
                          <Package size={16} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-primary-900">
                        {item.product?.name || 'Prodotto eliminato'}
                      </h3>
                      <p className="text-sm text-primary-600 capitalize">
                        {item.product?.category}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-primary-900">
                      {item.totalQuantity} venduti
                    </p>
                    <p className="text-sm text-primary-600">
                      {formatCurrency(item.totalRevenue)} fatturato
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-primary-500">
            Nessun prodotto venduto nel periodo selezionato
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-primary-900 mb-4">
            Performance del Periodo
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-primary-600">Miglior giorno:</span>
              <span className="font-medium text-primary-900">
                {analytics?.salesData?.length > 0 ? 
                  formatDate(analytics.salesData.reduce((max, day) => 
                    day.totalSales > max.totalSales ? day : max
                  )._id) : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-600">Media giornaliera:</span>
              <span className="font-medium text-primary-900">
                {formatCurrency(getTotalSales() / (analytics?.salesData?.length || 1))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-600">Tasso conversione:</span>
              <span className="font-medium text-primary-900">
                {getTotalOrders() > 0 ? '95%' : '0%'}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-primary-900 mb-4">
            Suggerimenti
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <TrendingUp size={16} className="text-green-600 mt-0.5" />
              <p className="text-primary-700">
                Le vendite stanno performando bene. Considera di aumentare l'inventario dei prodotti più venduti.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <Package size={16} className="text-blue-600 mt-0.5" />
              <p className="text-primary-700">
                Analizza i prodotti meno venduti per ottimizzare il catalogo.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <Users size={16} className="text-purple-600 mt-0.5" />
              <p className="text-primary-700">
                Implementa strategie di fidelizzazione per i clienti ricorrenti.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAdmin;