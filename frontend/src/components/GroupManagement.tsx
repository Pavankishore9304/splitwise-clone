import React, { useState } from 'react';
import { User, Group, GroupDetails, groupAPI } from '../api';

interface GroupManagementProps {
  groups: Group[];
  users: User[];
  selectedGroup: Group | null; // Add this back
  onGroupCreated: () => void;
  setSelectedGroup: (group: Group | null) => void;
}

const GroupManagement: React.FC<GroupManagementProps> = ({
  groups,
  users,
  selectedGroup, // Add this back
  onGroupCreated,
  setSelectedGroup,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', user_ids: [] as number[] });
  const [loading, setLoading] = useState(false);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.user_ids.length === 0) return;

    setLoading(true);
    try {
      await groupAPI.create(formData);
      setFormData({ name: '', description: '', user_ids: [] });
      setShowForm(false);
      onGroupCreated();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error creating group');
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: number) => {
    setFormData({
      ...formData,
      user_ids: formData.user_ids.includes(userId)
        ? formData.user_ids.filter(id => id !== userId)
        : [...formData.user_ids, userId]
    });
  };

  const loadGroupDetails = async (group: Group) => {
    try {
      const response = await groupAPI.getById(group.id);
      setGroupDetails(response.data);
      setSelectedGroup(group);
    } catch (error) {
      console.error('Error loading group details:', error);
    }
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!window.confirm(`Are you sure you want to delete group "${groupName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await groupAPI.delete(groupId);
      onGroupCreated(); // Refresh the group list
      // If the deleted group was selected, clear selection
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setGroupDetails(null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        const errorMessage = axiosError.response?.data?.detail || 'Failed to delete group';
        alert(`Error deleting group: ${errorMessage}`);
      } else {
        alert('Error deleting group: Unable to connect to server');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Groups</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Create Group
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Group</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Members
              </label>
              {users.length === 0 ? (
                <p className="text-sm text-gray-500">No users available. Create users first.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.user_ids.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">{user.name} ({user.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.user_ids.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Groups ({groups.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {groups.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No groups found. Create your first group to get started.
              </div>
            ) : (
              <ul className="space-y-2">
                {groups.map((group) => (
                  <li key={group.id}>
                    <div
                      onClick={() => loadGroupDetails(group)}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-l-4 ${selectedGroup?.id === group.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white hover:bg-gray-50 border-transparent'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">{group.name}</p>
                          {group.description && (
                            <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id, group.name);
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-400">
                          {group.members.length} members
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {groupDetails && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Group Details</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{groupDetails.name}</h4>
                {groupDetails.description && (
                  <p className="text-gray-600 mt-1">{groupDetails.description}</p>
                )}
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Members:</h5>
                <div className="space-y-1">
                  {groupDetails.members.map((member) => (
                    <div key={member.id} className="text-sm text-gray-600">
                      {member.name} ({member.email})
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Total Expenses:</span> ${groupDetails.total_expenses.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Created:</span> {new Date(groupDetails.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupManagement;
