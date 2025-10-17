import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Euro,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import StatsCard from '../../components/admin/StatsCard';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.stats);
      setRecentOrders(response.data.recentOrders);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getOrderStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getOrderStatusText = (status) => {
    const texts = {
      pending: 'In attesa',
      paid: 'Pagato',
      processing: 'In elaborazione',
      shipped: 'Spedito',
      delivered: 'Consegnato',
      cancelled: 'Annullato',
      refunded: 'Rimborsato'
    };
    return texts[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">Dashboard</h1>
        <p className="text-primary-600 mt-1">
          Benvenuto nel pannello di amministrazione
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Utenti Totali"
          value={stats?.totalUsers || 0}
          icon={Users}
          loading={loading}
        />
        <StatsCard
          title="Prodotti Attivi"
          value={stats?.totalProducts || 0}
          icon={Package}
          loading={loading}
        />
        <StatsCard
          title="Ordini Totali"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          loading={loading}
        />
        <StatsCard
          title="Fatturato"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={Euro}
          loading={loading}
        />
      </div>

      {/* Alert for pending orders */}
      {stats?.pendingOrders > 0 && (
        <div className="card p-4 bg-yellow-50 border border-yellow-200">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              Ci sono <strong>{stats.pendingOrders}</strong> ordini in attesa di elaborazione.
            </p>
            <Link 
              to="/admin/orders"
              className="ml-auto text-yellow-800 hover:text-yellow-900 font-medium"
            >
              Visualizza →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-900">
                  Ordini Recenti
                </h2>
                <Link
                  to="/admin/orders"
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  Vedi tutti →
                </Link>
              </div>
            </div>
            
            <div className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-primary-200 rounded w-3/4"></div>
                        <div className="h-4 bg-primary-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="p-6 text-center text-primary-500">
                  Nessun ordine trovato
                </div>
              ) : (
                <div className="divide-y divide-primary-200">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="p-4 hover:bg-primary-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-primary-900">
                              #{order.orderNumber}
                            </p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>
                              {getOrderStatusText(order.status)}
                            </span>
                          </div>
                          <p className="text-sm text-primary-600 mt-1">
                            {order.user?.firstName} {order.user?.lastName} • {' '}
                            {order.items.length} {order.items.length === 1 ? 'prodotto' : 'prodotti'}
                          </p>
                          <p className="text-xs text-primary-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary-900">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">
              Azioni Rapide
            </h2>
            <div className="space-y-3">
              <Link
                to="/admin/products"
                className="flex items-center p-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <Package className="w-5 h-5 text-primary-600 mr-3" />
                <span className="font-medium text-primary-900">Gestisci Prodotti</span>
              </Link>
              <Link
                to="/admin/orders"
                className="flex items-center p-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-primary-600 mr-3" />
                <span className="font-medium text-primary-900">Visualizza Ordini</span>
              </Link>
              <Link
                to="/admin/users"
                className="flex items-center p-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <Users className="w-5 h-5 text-primary-600 mr-3" />
                <span className="font-medium text-primary-900">Gestisci Utenti</span>
              </Link>
              <Link
                to="/admin/analytics"
                className="flex items-center p-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-primary-600 mr-3" />
                <span className="font-medium text-primary-900">Visualizza Analytics</span>
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">
              Stato Sistema
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-600">Database</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-600">API Server</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Operativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-600">Pagamenti</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Stripe OK
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;