import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  User,
  Mail,
  Calendar,
  Shield,
  ShieldOff,
  MoreVertical
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.currentPage]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...filters
      };

      const response = await adminAPI.getUsers(params);
      setUsers(response.data.users);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Errore nel caricamento utenti');
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
    fetchUsers(page);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    
    if (!window.confirm(`Sei sicuro di voler ${newStatus ? 'attivare' : 'disattivare'} questo utente?`)) {
      return;
    }

    try {
      await adminAPI.updateUserStatus(userId, { isActive: newStatus });
      toast.success(`Utente ${newStatus ? 'attivato' : 'disattivato'} con successo`);
      fetchUsers(pagination.currentPage);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Errore nell\'aggiornamento dello stato utente');
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-primary-200 rounded animate-pulse"></div>
        <div className="card p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-200 rounded-full"></div>
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
        <h1 className="text-3xl font-bold text-primary-900">Gestione Utenti</h1>
        <p className="text-primary-600 mt-1">
          {pagination.total} {pagination.total === 1 ? 'utente registrato' : 'utenti registrati'}
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="relative">
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-opacity duration-200 ${
            filters.search ? 'opacity-0' : 'opacity-100'
          }`}>
            <Search className="text-primary-400 w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Cerca per nome, cognome o email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input pl-10"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user._id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-800 font-semibold text-sm">
                    {getInitials(user.firstName, user.lastName)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-primary-600">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    <Shield size={12} className="mr-1" />
                    Admin
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  user.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Attivo' : 'Disattivo'}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center text-sm text-primary-600">
                <Mail size={16} className="mr-2" />
                <span className="truncate">{user.email}</span>
              </div>
              
              <div className="flex items-center text-sm text-primary-600">
                <Calendar size={16} className="mr-2" />
                <span>Registrato il {formatDate(user.createdAt)}</span>
              </div>

              {user.address && (user.address.city || user.address.country) && (
                <div className="flex items-center text-sm text-primary-600">
                  <User size={16} className="mr-2" />
                  <span>
                    {user.address.city && user.address.country 
                      ? `${user.address.city}, ${user.address.country}`
                      : user.address.city || user.address.country
                    }
                  </span>
                </div>
              )}

              {user.phone && (
                <div className="text-sm text-primary-600">
                  <strong>Tel:</strong> {user.phone}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-primary-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-primary-500">
                  Ultimo accesso: {formatDate(user.updatedAt)}
                </div>
                
                {user.role !== 'admin' && (
                  <button
                    onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      user.isActive
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {user.isActive ? (
                      <>
                        <ShieldOff size={14} />
                        <span>Disattiva</span>
                      </>
                    ) : (
                      <>
                        <Shield size={14} />
                        <span>Attiva</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-4xl text-primary-300 mb-4">👥</div>
          <h3 className="text-lg font-medium text-primary-900 mb-2">Nessun utente trovato</h3>
          <p className="text-primary-500">
            Non ci sono utenti che corrispondono ai filtri di ricerca.
          </p>
        </div>
      )}

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

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {users.filter(u => u.isActive).length}
          </div>
          <div className="text-sm text-primary-600">Utenti Attivi</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-red-600 mb-2">
            {users.filter(u => !u.isActive).length}
          </div>
          <div className="text-sm text-primary-600">Utenti Disattivi</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-sm text-primary-600">Amministratori</div>
        </div>
      </div>
    </div>
  );
};

export default UsersAdmin;