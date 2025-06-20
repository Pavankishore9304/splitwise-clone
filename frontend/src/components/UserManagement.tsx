import React, { useState } from 'react';
import { User, userAPI } from '../api';

interface UserManagementProps {
  users: User[];
  onUserCreated: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUserCreated }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    setLoading(true);
    try {
      await userAPI.create(formData);
      setFormData({ name: '', email: '' });
      setShowForm(false);
      onUserCreated();    } catch (error) {
      console.error('Error creating user:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
        console.error('Request URL:', axiosError.config?.url);
        
        // Show more specific error message
        const errorMessage = axiosError.response?.data?.detail || 
                           axiosError.response?.statusText || 
                           axiosError.message || 
                           'Unknown error occurred';
        alert(`Error creating user: ${errorMessage}`);
      } else {
        alert('Error creating user: Unable to connect to server');
      }
    } finally {
      setLoading(false);    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await userAPI.delete(userId);
      onUserCreated(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        const errorMessage = axiosError.response?.data?.detail || 'Failed to delete user';
        alert(`Error deleting user: ${errorMessage}`);
      } else {
        alert('Error deleting user: Unable to connect to server');
      }
    }
  };
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">👥</span>
          </div>
          <div>            <h2 className="text-3xl font-bold text-gray-900">
              Users
            </h2>
            <p className="text-gray-600">Manage all users in your expense groups</p>
          </div>
        </div>        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold border-0"
        >
          ✨ Add User
        </button>
      </div>      {showForm && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">✨</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Create New User</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-3 text-gray-900 placeholder-gray-500"
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-3 text-gray-900 placeholder-gray-500"
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                Cancel
              </button>              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg border-0"
                style={{ color: 'white' }}
              >
                {loading ? 'Creating...' : '✨ Create User'}
              </button>
            </div>
          </form>
        </div>      )}

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">👥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">All Users ({users.length})</h3>
          </div>
        </div>
        
        {users.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">👥</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">No users found</h4>
            <p className="text-gray-500 text-lg">Create your first user to get started with expense tracking.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              ✨ Add First User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">ID: #{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-500">✉️</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          <div className="text-xs text-gray-500">Email Address</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 shadow-sm">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <button className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition-all duration-200 border border-blue-200">
                          <span className="mr-1">👁️</span>
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md text-white"
                        >
                          <span className="mr-1">🗑️</span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
