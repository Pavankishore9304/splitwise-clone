import React, { useState, useEffect, useCallback } from 'react';
import { User, Group, GroupBalance, UserBalance, groupAPI, userAPI } from '../api';

interface BalanceViewProps {
  group: Group;
  users: User[];
}

const BalanceView: React.FC<BalanceViewProps> = ({ group, users }) => {
  const [groupBalance, setGroupBalance] = useState<GroupBalance | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<'group' | 'user'>('group');

  const loadGroupBalance = useCallback(async () => {
    if (!group) return;
    
    setLoading(true);
    try {
      const response = await groupAPI.getBalances(group.id);
      setGroupBalance(response.data);
    } catch (error) {
      console.error('Error loading group balance:', error);
    } finally {
      setLoading(false);
    }
  }, [group]);

  const loadUserBalance = useCallback(async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await userAPI.getBalances(selectedUser.id);
      setUserBalance(response.data);
    } catch (error) {
      console.error('Error loading user balance:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (group && viewType === 'group') {
      loadGroupBalance();
    } else {
      setGroupBalance(null); // Clear group balance if no group or not in group view
    }
  }, [group, viewType, loadGroupBalance]);

  useEffect(() => {
    if (selectedUser && viewType === 'user') {
      loadUserBalance();
    }
  }, [selectedUser, viewType, loadUserBalance]);

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600'; // They are owed money
    if (balance < 0) return 'text-red-600';   // They owe money
    return 'text-gray-600';                   // Settled
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) return `is owed $${balance.toFixed(2)}`;
    if (balance < 0) return `owes $${Math.abs(balance).toFixed(2)}`;
    return 'is settled up';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Balances</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewType('group')}
            className={`px-4 py-2 rounded-md ${
              viewType === 'group'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Group View
          </button>
          <button
            onClick={() => setViewType('user')}
            className={`px-4 py-2 rounded-md ${
              viewType === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            User View
          </button>
        </div>
      </div>

      {viewType === 'group' && (
        <div>
          {!group && (
            <p className="text-center text-gray-500">Select a group to see balances.</p>
          )}
          {group && loading && <p>Loading balances...</p>}
          {groupBalance && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">
                      Balances for {group.name}
                    </h3>
                    <p className="text-blue-700">
                      {group.members.length} members
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Member Balances</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {groupBalance.balances.map((balance) => (
                    <div key={balance.user_id} className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {balance.user_name}
                          </h4>
                          <p className={`text-sm ${getBalanceColor(balance.net_balance)}`}>
                            {getBalanceText(balance.net_balance)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${getBalanceColor(balance.net_balance)}`}>
                            ${Math.abs(balance.net_balance).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Owes: ${balance.owes.toFixed(2)} | Owed: ${balance.owed.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewType === 'user' && (
        <div>
          <div className="mb-4">
            <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">Select User</label>
            <select
              id="user-select"
              value={selectedUser?.id || ''}
              onChange={(e) => setSelectedUser(users.find(u => u.id === parseInt(e.target.value)) || null)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="" disabled>-- Select a user --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          {loading && <p>Loading balances...</p>}
          {userBalance && selectedUser && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-green-900">
                      Balances for {selectedUser.name}
                    </h3>
                    <p className="text-green-700">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Change User
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {userBalance.group_balances.map((groupBalance) => {
                  if (!selectedUser) return null;
                  const userBalanceInGroup = groupBalance.balances.find(
                    b => b.user_id === selectedUser.id
                  );
                  
                  return (
                    <div key={groupBalance.group_id} className="bg-white shadow-md rounded-lg overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-medium text-gray-900">
                          {groupBalance.group_name}
                        </h4>
                      </div>
                      <div className="px-6 py-4">
                        {userBalanceInGroup ? (
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`text-sm ${getBalanceColor(userBalanceInGroup.net_balance)}`}>
                                {getBalanceText(userBalanceInGroup.net_balance)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Owes: ${userBalanceInGroup.owes.toFixed(2)} | 
                                Owed: ${userBalanceInGroup.owed.toFixed(2)}
                              </p>
                            </div>
                            <div className={`text-xl font-semibold ${getBalanceColor(userBalanceInGroup.net_balance)}`}>
                              {userBalanceInGroup.net_balance >= 0 ? '+' : ''}${userBalanceInGroup.net_balance.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">No balance data</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BalanceView;
