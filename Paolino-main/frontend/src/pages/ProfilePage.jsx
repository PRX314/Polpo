import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Package, 
  Calendar,
  Eye,
  Download,
  Truck,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, authAPI, API_SERVER_URL } from '../services/api';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Form data for profile editing
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      postalCode: user?.address?.postalCode || '',
      province: user?.address?.province || '',
      country: user?.address?.country || 'Italy'
    }
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUserOrders();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          postalCode: user.address?.postalCode || '',
          province: user.address?.province || '',
          country: user.address?.country || 'Italy'
        }
      });
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      const response = await ordersAPI.getUserOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Errore nel caricamento degli ordini');
    } finally {
      setOrdersLoading(false);
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
      month: 'short',
      day: 'numeric'
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome obbligatorio';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Cognome obbligatorio';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Correggi gli errori nel modulo');
      return;
    }
    
    try {
      await updateProfile(formData);
      setEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-primary-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="h-96 bg-primary-200 rounded"></div>
            <div className="lg:col-span-2 h-96 bg-primary-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900">Il Mio Profilo</h1>
        <p className="text-primary-600 mt-1">
          Gestisci le tue informazioni e visualizza i tuoi ordini
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-primary-900">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm text-primary-600">{user?.email}</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-primary-100 text-primary-900 font-medium' 
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>Informazioni Personali</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-primary-100 text-primary-900 font-medium' 
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Package size={16} />
                    <span>I Miei Ordini</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card">
              <div className="p-6 border-b border-primary-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-primary-900">
                    Informazioni Personali
                  </h2>
                  {!editingProfile ? (
                    <button 
                      onClick={() => setEditingProfile(true)}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <Edit3 size={16} />
                      <span>Modifica</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setEditingProfile(false)}
                        className="btn-outline"
                      >
                        Annulla
                      </button>
                      <button 
                        onClick={handleProfileUpdate}
                        className="btn-primary"
                      >
                        Salva
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {!editingProfile ? (
                  <div className="space-y-6">
                    {/* Personal Info */}
                    <div>
                      <h3 className="text-sm font-medium text-primary-900 mb-3">
                        Dati Personali
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-primary-400" />
                          <div>
                            <p className="text-sm text-primary-600">Nome</p>
                            <p className="font-medium text-primary-900">
                              {user?.firstName || 'Non specificato'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-primary-400" />
                          <div>
                            <p className="text-sm text-primary-600">Cognome</p>
                            <p className="font-medium text-primary-900">
                              {user?.lastName || 'Non specificato'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <h3 className="text-sm font-medium text-primary-900 mb-3">
                        Contatti
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-primary-400" />
                          <div>
                            <p className="text-sm text-primary-600">Email</p>
                            <p className="font-medium text-primary-900">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-primary-400" />
                          <div>
                            <p className="text-sm text-primary-600">Telefono</p>
                            <p className="font-medium text-primary-900">
                              {user?.phone || 'Non specificato'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Info */}
                    <div>
                      <h3 className="text-sm font-medium text-primary-900 mb-3">
                        Indirizzo
                      </h3>
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-primary-400 mt-1" />
                        <div>
                          <p className="text-sm text-primary-600">Indirizzo di spedizione</p>
                          {user?.address ? (
                            <div className="font-medium text-primary-900">
                              <p>{user.address.street}</p>
                              <p>{user.address.city}, {user.address.province} {user.address.postalCode}</p>
                              <p>{user.address.country}</p>
                            </div>
                          ) : (
                            <p className="font-medium text-primary-900">Non specificato</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Personal Info Form */}
                    <div>
                      <h3 className="text-sm font-medium text-primary-900 mb-3">
                        Dati Personali
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-primary-700 mb-1">
                            Nome *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                          />
                          {errors.firstName && (
                            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-700 mb-1">
                            Cognome *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                          />
                          {errors.lastName && (
                            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info Form */}
                    <div>
                      <h3 className="text-sm font-medium text-primary-900 mb-3">
                        Contatti
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-primary-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`input ${errors.email ? 'border-red-500' : ''}`}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-700 mb-1">
                            Telefono
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Form */}
                    <div>
                      <h3 className="text-sm font-medium text-primary-900 mb-3">
                        Indirizzo
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-primary-700 mb-1">
                            Indirizzo
                          </label>
                          <input
                            type="text"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="Via Roma 123"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-primary-700 mb-1">
                              Città
                            </label>
                            <input
                              type="text"
                              name="address.city"
                              value={formData.address.city}
                              onChange={handleInputChange}
                              className="input"
                              placeholder="Milano"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-primary-700 mb-1">
                              CAP
                            </label>
                            <input
                              type="text"
                              name="address.postalCode"
                              value={formData.address.postalCode}
                              onChange={handleInputChange}
                              className="input"
                              placeholder="20100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-primary-700 mb-1">
                              Provincia
                            </label>
                            <input
                              type="text"
                              name="address.province"
                              value={formData.address.province}
                              onChange={handleInputChange}
                              className="input"
                              placeholder="MI"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="card">
                <div className="p-6 border-b border-primary-200">
                  <h2 className="text-xl font-semibold text-primary-900">
                    I Miei Ordini
                  </h2>
                  <p className="text-primary-600 mt-1">
                    Visualizza lo storico dei tuoi acquisti
                  </p>
                </div>

                <div className="p-0">
                  {ordersLoading ? (
                    <div className="p-6 space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 border-b border-primary-200">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="h-4 bg-primary-200 rounded w-32"></div>
                              <div className="h-3 bg-primary-200 rounded w-24"></div>
                            </div>
                            <div className="h-6 bg-primary-200 rounded w-20"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-8 text-center">
                      <Package className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-primary-900 mb-2">
                        Nessun ordine ancora
                      </h3>
                      <p className="text-primary-600 mb-4">
                        Non hai ancora effettuato alcun ordine. Inizia a esplorare i nostri prodotti!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-primary-200">
                      {orders.map((order) => (
                        <div key={order._id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-primary-900">
                                Ordine #{order.orderNumber}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-primary-600 mt-1">
                                <span className="flex items-center space-x-1">
                                  <Calendar size={14} />
                                  <span>{formatDate(order.createdAt)}</span>
                                </span>
                                <span>{order.items.length} articoli</span>
                                <span className="font-medium">{formatCurrency(order.total)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                              
                              <button
                                onClick={() => handleViewOrder(order)}
                                className="btn-outline btn-sm flex items-center space-x-2"
                              >
                                <Eye size={14} />
                                <span>Dettagli</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {order.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="w-10 h-10 bg-primary-100 rounded overflow-hidden">
                                {item.product?.images?.[0] ? (
                                  <img
                                    src={`${API_SERVER_URL}${item.product.images[0].url}`}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-primary-400">
                                    <Package size={14} />
                                  </div>
                                )}
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-10 h-10 bg-primary-200 rounded flex items-center justify-center text-xs text-primary-600 font-medium">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeOrderModal}></div>

            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary-900">
                    Dettagli Ordine #{selectedOrder.orderNumber}
                  </h3>
                  <p className="text-sm text-primary-600">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={closeOrderModal}
                  className="text-primary-400 hover:text-primary-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-primary-900 mb-3">
                    Indirizzo di Spedizione
                  </h4>
                  <div className="text-sm text-primary-600 space-y-1">
                    <p>{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.province} {selectedOrder.shippingAddress.postalCode}</p>
                    {selectedOrder.shippingAddress.phone && <p>Tel: {selectedOrder.shippingAddress.phone}</p>}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-primary-900 mb-3">
                    Stato Ordine
                  </h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                  {selectedOrder.trackingNumber && (
                    <p className="text-sm text-primary-600 mt-2">
                      Tracking: {selectedOrder.trackingNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-primary-200 pt-6">
                <h4 className="font-medium text-primary-900 mb-4">Articoli</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item._id} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded overflow-hidden flex-shrink-0">
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
                      <div className="flex-1">
                        <h5 className="font-medium text-primary-900">
                          {item.product?.name || 'Prodotto eliminato'}
                        </h5>
                        {item.variant && (
                          <p className="text-sm text-primary-600">
                            {item.variant.size} • {item.variant.color}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-primary-600">Qtà: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-primary-200 pt-4 mt-6">
                <div className="flex justify-between text-lg font-semibold text-primary-900">
                  <span>Totale</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;