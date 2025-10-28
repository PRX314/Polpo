import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Lock, 
  Truck, 
  MapPin, 
  User, 
  Mail, 
  Phone,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Package
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI } from '../services/api';
import { getProductImageUrl } from '../utils/imageHelper';
import { toast } from 'react-hot-toast';

const CheckoutPage = () => {
  const { cart, cartTotal, clearCart, loading: cartLoading } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({
    // Shipping Address
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address?.street || '',
    city: user?.address?.city || '',
    postalCode: user?.address?.postalCode || '',
    province: user?.address?.province || '',
    country: user?.address?.country || 'Italy',
    
    // Payment Method
    paymentMethod: 'card',
    
    // Card Details (simulated)
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Order Notes
    notes: ''
  });

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Effettua il login per completare l\'acquisto');
      navigate('/login');
      return;
    }
    
    if (!cartLoading && (!cart?.items || cart.items.length === 0)) {
      toast.error('Il carrello è vuoto');
      navigate('/cart');
      return;
    }
  }, [isAuthenticated, cart, cartLoading, navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateShipping = () => {
    const shippingThreshold = 50;
    return cartTotal >= shippingThreshold ? 0 : 5.99;
  };

  const calculateTotal = () => {
    return cartTotal + calculateShipping();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
    
    // Required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 
      'address', 'city', 'postalCode', 'province'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'Questo campo è obbligatorio';
      }
    });
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Inserisci un email valida';
    }
    
    // Phone validation
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Inserisci un numero di telefono valido';
    }
    
    // Card validation (simulated)
    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber.replace(/\s/g, '')) {
        newErrors.cardNumber = 'Numero carta obbligatorio';
      } else if (formData.cardNumber.replace(/\s/g, '').length < 16) {
        newErrors.cardNumber = 'Numero carta non valido';
      }
      
      if (!formData.expiryDate) {
        newErrors.expiryDate = 'Data scadenza obbligatoria';
      }
      
      if (!formData.cvv) {
        newErrors.cvv = 'CVV obbligatorio';
      } else if (formData.cvv.length < 3) {
        newErrors.cvv = 'CVV non valido';
      }
      
      if (!formData.cardName.trim()) {
        newErrors.cardName = 'Nome sulla carta obbligatorio';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setFormData(prev => ({ ...prev, cardNumber: formatted }));
    }
  };

  const handleExpiryDateChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setFormData(prev => ({ ...prev, expiryDate: formatted }));
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setFormData(prev => ({ ...prev, cvv: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Correggi gli errori nel modulo');
      return;
    }
    
    setOrderProcessing(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: cart.items.map(item => ({
          product: item.product._id,
          variant: item.variant._id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          street: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          province: formData.province,
          country: formData.country,
          phone: formData.phone
        },
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        subtotal: cartTotal,
        shipping: calculateShipping(),
        total: calculateTotal()
      };
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create order
      const response = await ordersAPI.createOrder(orderData);
      
      if (response.data.success) {
        // Clear cart
        await clearCart();
        
        // Show success message
        toast.success('Ordine completato con successo!');
        
        // Redirect to order confirmation
        navigate(`/order-confirmation/${response.data.order._id}`);
      } else {
        throw new Error(response.data.message || 'Errore nella creazione dell\'ordine');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Errore nel processare l\'ordine. Riprova.');
    } finally {
      setOrderProcessing(false);
    }
  };

  if (!isAuthenticated || cartLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-primary-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="h-32 bg-primary-200 rounded"></div>
              <div className="h-40 bg-primary-200 rounded"></div>
            </div>
            <div className="h-64 bg-primary-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/cart')}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-900 mb-4"
        >
          <ArrowLeft size={16} />
          <span>Torna al carrello</span>
        </button>
        <h1 className="text-3xl font-bold text-primary-900">Checkout</h1>
        <p className="text-primary-600 mt-1">
          Completa il tuo ordine in modo sicuro
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Shipping Address */}
            <div className="card p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="text-primary-600" size={20} />
                <h2 className="text-lg font-semibold text-primary-900">
                  Indirizzo di Spedizione
                </h2>
              </div>
              
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
                    placeholder="Mario"
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
                    placeholder="Rossi"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    placeholder="mario.rossi@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Telefono *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`input ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+39 123 456 7890"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Indirizzo *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`input ${errors.address ? 'border-red-500' : ''}`}
                  placeholder="Via Roma 123"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Città *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`input ${errors.city ? 'border-red-500' : ''}`}
                    placeholder="Milano"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    CAP *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className={`input ${errors.postalCode ? 'border-red-500' : ''}`}
                    placeholder="20100"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className={`input ${errors.province ? 'border-red-500' : ''}`}
                    placeholder="MI"
                  />
                  {errors.province && (
                    <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="text-primary-600" size={20} />
                <h2 className="text-lg font-semibold text-primary-900">
                  Metodo di Pagamento
                </h2>
              </div>
              
              {/* Payment Options */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center p-3 border border-primary-200 rounded-lg cursor-pointer hover:bg-primary-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <CreditCard size={16} className="mr-2 text-primary-600" />
                  <span className="text-primary-900">Carta di Credito/Debito</span>
                </label>
                
                <label className="flex items-center p-3 border border-primary-200 rounded-lg cursor-pointer hover:bg-primary-50 opacity-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    disabled
                    className="mr-3"
                  />
                  <div className="w-4 h-4 mr-2 bg-blue-600 rounded text-white text-xs flex items-center justify-center">P</div>
                  <span className="text-primary-600">PayPal (Prossimamente)</span>
                </label>
              </div>
              
              {/* Card Details */}
              {formData.paymentMethod === 'card' && (
                <div className="space-y-4 p-4 bg-primary-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Numero Carta *
                    </label>
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      className={`input ${errors.cardNumber ? 'border-red-500' : ''}`}
                      placeholder="1234 5678 9012 3456"
                    />
                    {errors.cardNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Scadenza *
                      </label>
                      <input
                        type="text"
                        value={formData.expiryDate}
                        onChange={handleExpiryDateChange}
                        className={`input ${errors.expiryDate ? 'border-red-500' : ''}`}
                        placeholder="MM/AA"
                      />
                      {errors.expiryDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        value={formData.cvv}
                        onChange={handleCvvChange}
                        className={`input ${errors.cvv ? 'border-red-500' : ''}`}
                        placeholder="123"
                      />
                      {errors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Nome sulla Carta *
                    </label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className={`input ${errors.cardName ? 'border-red-500' : ''}`}
                      placeholder="Mario Rossi"
                    />
                    {errors.cardName && (
                      <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Notes */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                Note per l'Ordine (Opzionale)
              </h3>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="input resize-none"
                placeholder="Inserisci eventuali note per la spedizione o l'ordine..."
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-6">
                Riepilogo Ordine
              </h2>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images[0] ? (
                        <img
                          src={getProductImageUrl(item.product, 0)}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-400">
                          <Package size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-primary-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-primary-600">
                        {item.variant.size} • {item.variant.color}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-primary-500">
                          Qtà: {item.quantity}
                        </span>
                        <span className="text-sm font-medium text-primary-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="space-y-3 border-t border-primary-200 pt-4 mb-6">
                <div className="flex justify-between text-primary-700">
                  <span>Subtotale ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} prodotti)</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>

                <div className="flex justify-between text-primary-700">
                  <span>Spedizione</span>
                  <span>
                    {calculateShipping() === 0 ? (
                      <span className="text-green-600 font-medium">Gratuita</span>
                    ) : (
                      formatCurrency(calculateShipping())
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-semibold text-primary-900 border-t border-primary-200 pt-3">
                  <span>Totale</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={orderProcessing}
                className="w-full btn-primary text-lg py-4 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {orderProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Completa Ordine</span>
                  </>
                )}
              </button>

              {/* Security Notice */}
              <div className="mt-4 flex items-start space-x-2 text-xs text-primary-500">
                <Lock size={12} className="mt-0.5 flex-shrink-0" />
                <p>
                  I tuoi dati di pagamento sono protetti con crittografia SSL a 256 bit. 
                  Non memorizziamo i dettagli della carta di credito.
                </p>
              </div>

              {/* Trust Badges */}
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
                    VISA
                  </div>
                  <div className="w-6 h-4 bg-red-600 rounded text-white text-xs flex items-center justify-center">
                    MC
                  </div>
                  <div className="w-6 h-4 bg-primary-800 rounded text-white text-xs flex items-center justify-center">
                    S
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="card mt-6 p-4">
              <div className="flex items-center space-x-2 text-primary-600 mb-2">
                <Truck size={16} />
                <span className="text-sm font-medium">Informazioni Spedizione</span>
              </div>
              <div className="text-xs text-primary-500 space-y-1">
                <p>• Spedizione gratuita per ordini superiori a €50</p>
                <p>• Consegna in 2-3 giorni lavorativi</p>
                <p>• Tracking incluso</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;