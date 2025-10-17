import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye,
  Package,
  Truck,
  Check,
  X,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { adminAPI, API_SERVER_URL } from '../../services/api';
import toast from 'react-hot-toast';

const OrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const statusOptions = [
    { value: 'all', label: 'Tutti gli stati' },
    { value: 'pending', label: 'In attesa' },
    { value: 'paid', label: 'Pagato' },
    { value: 'processing', label: 'In elaborazione' },
    { value: 'shipped', label: 'Spedito' },
    { value: 'delivered', label: 'Consegnato' },
    { value: 'cancelled', label: 'Annullato' },
    { value: 'refunded', label: 'Rimborsato' }
  ];

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.currentPage]);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...filters
      };
      
      if (filters.status === 'all') {
        delete params.status;
      }

      const response = await adminAPI.getOrders(params);
      setOrders(response.data.orders);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Errore nel caricamento ordini');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    fetchOrders(page);
  };

  const handleStatusChange = async (orderId, newStatus, trackingNumber = '') => {
    try {
      await adminAPI.updateOrderStatus(orderId, { 
        status: newStatus,
        ...(trackingNumber && { trackingNumber })
      });
      
      toast.success('Stato ordine aggiornato con successo');
      fetchOrders(pagination.currentPage);
      setShowModal(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Errore nell\'aggiornamento dello stato');
    }
  };

  const handleRefund = async (orderId, amount = null) => {
    if (!window.confirm('Sei sicuro di voler procedere con il rimborso?')) {
      return;
    }

    try {
      await adminAPI.refundOrder(orderId, { amount });
      toast.success('Rimborso elaborato con successo');
      fetchOrders(pagination.currentPage);
      setShowModal(false);
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Errore nell\'elaborazione del rimborso');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
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

  const getStatusText = (status) => {
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: <CreditCard size={16} />,
      paid: <Check size={16} />,
      processing: <RefreshCw size={16} />,
      shipped: <Truck size={16} />,
      delivered: <Package size={16} />,
      cancelled: <X size={16} />,
      refunded: <RefreshCw size={16} />
    };
    return icons[status] || <Package size={16} />;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-primary-200 rounded animate-pulse"></div>
        <div className="card p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-primary-200 rounded"></div>
                  <div className="h-4 bg-primary-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">Gestione Ordini</h1>
        <p className="text-primary-600 mt-1">
          {pagination.total} {pagination.total === 1 ? 'ordine' : 'ordini'} totali
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca per numero ordine, cliente..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input w-auto min-w-48"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Ordine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Prodotti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Totale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-primary-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-primary-900">#{order.orderNumber}</p>
                      {order.trackingNumber && (
                        <p className="text-sm text-primary-500">
                          Tracking: {order.trackingNumber}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-primary-900">
                        {order.user?.firstName} {order.user?.lastName}
                      </p>
                      <p className="text-sm text-primary-500">{order.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                    {new Date(order.createdAt).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                    {order.items.length} {order.items.length === 1 ? 'prodotto' : 'prodotti'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{getStatusText(order.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 flex items-center"
                    >
                      <Eye size={16} className="mr-1" />
                      Gestisci
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl text-primary-300 mb-4">📋</div>
            <h3 className="text-lg font-medium text-primary-900 mb-2">Nessun ordine trovato</h3>
            <p className="text-primary-500">
              Non ci sono ordini che corrispondono ai filtri selezionati.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {[...Array(pagination.totalPages)].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    page === pagination.currentPage
                      ? 'bg-primary-800 text-white'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Management Modal */}
      {showModal && selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setShowModal(false)}
          onStatusChange={handleStatusChange}
          onRefund={handleRefund}
        />
      )}
    </div>
  );
};

// Order Management Modal
const OrderModal = ({ order, onClose, onStatusChange, onRefund }) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const canRefund = () => {
    return ['paid', 'processing', 'shipped'].includes(order.status);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <h2 className="text-xl font-bold text-primary-900">
            Gestione Ordine #{order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-primary-400 hover:text-primary-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-4">
              <h3 className="font-semibold text-primary-900 mb-3">Informazioni Cliente</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-primary-600">Nome:</span> {order.user?.firstName} {order.user?.lastName}</p>
                <p><span className="text-primary-600">Email:</span> {order.user?.email}</p>
                <p><span className="text-primary-600">Data ordine:</span> {new Date(order.createdAt).toLocaleDateString('it-IT')}</p>
                <p><span className="text-primary-600">Metodo pagamento:</span> {order.paymentMethod}</p>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-primary-900 mb-3">Indirizzo di Spedizione</h3>
              <div className="text-sm text-primary-700">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Tel: {order.shippingAddress.phone}</p>}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <div className="p-4 border-b border-primary-200">
              <h3 className="font-semibold text-primary-900">Prodotti Ordinati</h3>
            </div>
            <div className="p-0">
              <div className="divide-y divide-primary-200">
                {order.items.map((item, index) => (
                  <div key={index} className="p-4 flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-lg overflow-hidden">
                      {item.image ? (
                        <img
                          src={`${API_SERVER_URL}${item.image}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-400">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-primary-900">{item.name}</h4>
                      <p className="text-sm text-primary-600">
                        {item.variant.size} - {item.variant.color}
                      </p>
                      <p className="text-sm text-primary-500">SKU: {item.variant.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary-900">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                      <p className="text-sm font-semibold text-primary-800">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Totals */}
              <div className="p-4 bg-primary-50 border-t border-primary-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Subtotale:</span>
                    <span className="text-primary-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600">Spedizione:</span>
                      <span className="text-primary-900">{formatCurrency(order.shippingCost)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600">Tasse:</span>
                      <span className="text-primary-900">{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t border-primary-200 pt-2">
                    <span className="text-primary-900">Totale:</span>
                    <span className="text-primary-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="card p-4">
            <h3 className="font-semibold text-primary-900 mb-4">Gestione Stato Ordine</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Stato Ordine
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input"
                >
                  <option value="pending">In attesa</option>
                  <option value="paid">Pagato</option>
                  <option value="processing">In elaborazione</option>
                  <option value="shipped">Spedito</option>
                  <option value="delivered">Consegnato</option>
                  <option value="cancelled">Annullato</option>
                </select>
              </div>

              {(newStatus === 'shipped' || order.status === 'shipped') && (
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Numero di Tracking
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="input"
                    placeholder="Inserisci numero tracking"
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => onStatusChange(order._id, newStatus, trackingNumber)}
                  className="btn-primary"
                  disabled={newStatus === order.status}
                >
                  Aggiorna Stato
                </button>
                
                {canRefund() && (
                  <button
                    onClick={() => onRefund(order._id)}
                    className="btn-danger"
                  >
                    Rimborsa Ordine
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="card p-4">
              <h3 className="font-semibold text-primary-900 mb-2">Note</h3>
              <p className="text-sm text-primary-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersAdmin;