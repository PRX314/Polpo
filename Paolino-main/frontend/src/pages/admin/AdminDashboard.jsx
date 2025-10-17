import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Dashboard from './Dashboard';
import ProductsAdmin from './ProductsAdmin';
import OrdersAdmin from './OrdersAdmin';
import UsersAdmin from './UsersAdmin';
import AnalyticsAdmin from './AnalyticsAdmin';
import SettingsAdmin from './SettingsAdmin';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsAdmin />} />
        <Route path="orders" element={<OrdersAdmin />} />
        <Route path="users" element={<UsersAdmin />} />
        <Route path="analytics" element={<AnalyticsAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;