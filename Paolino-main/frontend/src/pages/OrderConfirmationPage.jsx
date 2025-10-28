import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Calendar,
  ArrowRight,
  Download,
  Mail
} from 'lucide-react';
import { ordersAPI } from '../services/api';
import { getProductImageUrl } from '../utils/imageHelper';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getOrder(orderId);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Impossibile trovare l\'ordine');
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'In attesa',
      paid: 'Pagato',
      processing: 'In elaborazione',
      shipped: 'Spedito',
      delivered: 'Consegnato',
      cancelled: 'Annullato',
      refunded: 'Rimborsato'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      paid: 'text-green-600 bg-green-100',
      processing: 'text-blue-600 bg-blue-100',
      shipped: 'text-purple-600 bg-purple-100',
      delivered: 'text-green-700 bg-green-200',
      cancelled: 'text-red-600 bg-red-100',
      refunded: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-primary-200 rounded w-64 mb-8"></div>
          <div className="card p-8">
            <div className="space-y-4">
              <div className="h-32 bg-primary-200 rounded"></div>
              <div className="h-20 bg-primary-200 rounded"></div>
              <div className="h-40 bg-primary-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            Ordine non trovato
          </h2>
          <p className="text-primary-600 mb-6">
            {error || 'L\'ordine che stai cercando non esiste o non hai i permessi per visualizzarlo.'}
          </p>
          <Link to="/products" className="btn-primary">
            Continua Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-primary-900 mb-2">
          Ordine Completato!
        </h1>
        <p className="text-primary-600">
          Grazie per il tuo acquisto. Riceverai una email di conferma a breve.
        </p>
      </div>

      {/* Order Details */}
      <div className="card mb-8">
        <div className="p-6 border-b border-primary-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-900">
                Ordine #{order.orderNumber}
              </h2>
              <p className="text-sm text-primary-600">
                Effettuato il {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Address */}
            <div>
              <h3 className="text-sm font-medium text-primary-900 mb-3 flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                Indirizzo di Spedizione
              </h3>
              <div className="text-sm text-primary-600 space-y-1">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Tel: {order.shippingAddress.phone}</p>}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-sm font-medium text-primary-900 mb-3 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Metodo di Pagamento
              </h3>
              <div className="text-sm text-primary-600">
                <p className="capitalize">{order.paymentMethod}</p>
                <p className="text-green-600 font-medium mt-1">Pagamento confermato</p>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-primary-900 mb-2">
                Note Ordine
              </h3>
              <p className="text-sm text-primary-600 bg-primary-50 p-3 rounded-lg">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="card mb-8">
        <div className="p-6 border-b border-primary-200">
          <h2 className="text-lg font-semibold text-primary-900">
            Articoli Ordinati
          </h2>
        </div>
        
        <div className="p-0">
          <div className="divide-y divide-primary-200">
            {order.items.map((item) => (
              <div key={item._id} className="p-4 flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <img
                      src={getProductImageUrl(item.product, 0)}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-400">
                      <Package size={20} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-primary-900">
                    {item.product?.name || 'Prodotto eliminato'}
                  </h4>
                  {item.variant && (
                    <p className="text-xs text-primary-600 mt-1">
                      {item.variant.size} • {item.variant.color}
                    </p>
                  )}
                  <p className="text-xs text-primary-500 mt-1">
                    SKU: {item.variant?.sku}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-primary-600">
                    Qtà: {item.quantity}
                  </p>
                  <p className="text-sm font-medium text-primary-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="card mb-8">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">
            Riepilogo Totali
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-primary-700">
              <span>Subtotale</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            
            <div className="flex justify-between text-primary-700">
              <span>Spedizione</span>
              <span>
                {order.shipping === 0 ? (
                  <span className="text-green-600 font-medium">Gratuita</span>
                ) : (
                  formatCurrency(order.shipping)
                )}
              </span>
            </div>
            
            <div className="border-t border-primary-200 pt-3">
              <div className="flex justify-between text-lg font-semibold text-primary-900">
                <span>Totale</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">
            Prossimi Passi
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-primary-900">
                  Conferma via email
                </h3>
                <p className="text-sm text-primary-600">
                  Riceverai una email di conferma con tutti i dettagli dell'ordine
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-primary-900">
                  Preparazione ordine
                </h3>
                <p className="text-sm text-primary-600">
                  Il tuo ordine verrà preparato entro 1-2 giorni lavorativi
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-primary-900">
                  Spedizione
                </h3>
                <p className="text-sm text-primary-600">
                  Riceverai il numero di tracking per seguire la spedizione
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          to="/products" 
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <span>Continua Shopping</span>
          <ArrowRight size={16} />
        </Link>
        
        <button className="btn-outline flex items-center justify-center space-x-2">
          <Download size={16} />
          <span>Scarica Ricevuta</span>
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;