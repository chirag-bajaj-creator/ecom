import { useState, useEffect } from 'react';
import api from '../../api/axios';
import AdminSidebar from '../../components/layout/AdminSidebar';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (roleFilter) params.append('role', roleFilter);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleColors = {
    user: '#3b82f6',
    delivery: '#f59e0b',
    admin: '#e94560'
  };

  const roleLabels = {
    user: 'Customer',
    delivery: 'Delivery Boy',
    admin: 'Admin'
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Users <span className="total-count">({total})</span></h1>
          <div className="order-filters">
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="status-filter-select"
            >
              <option value="">All Roles</option>
              <option value="user">Customers</option>
              <option value="delivery">Delivery Boys</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading users...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-avatar" style={{ background: roleColors[user.role] }}>
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    </td>
                    <td className="user-name-cell">{user.name}</td>
                    <td className="user-email-cell">{user.email}</td>
                    <td>{user.phone || '-'}</td>
                    <td>
                      <span className="role-badge" style={{ background: roleColors[user.role] }}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="date-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="no-data">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsers;