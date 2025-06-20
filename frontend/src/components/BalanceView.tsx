import React, { useState, useEffect } from 'react';
import { User, Group, GroupBalance, UserBalance, groupAPI, userAPI } from '../api';

interface BalanceViewProps {
  groups: Group[];
  users: User[];
  selectedGroup: Group | null;
  onGroupSelected: (group: Group | null) => void;
}

const BalanceView: React.FC<BalanceViewProps> = ({
  groups,
  users,
  selectedGroup,
  onGroupSelected,
}) => {
  const [groupBalance, setGroupBalance] = useState<GroupBalance | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<'group' | 'user'>('group');
  const loadGroupBalance = React.useCallback(async () => {
    if (!selectedGroup) return;
    
    setLoading(true);
    try {
      const response = await groupAPI.getBalances(selectedGroup.id);
      setGroupBalance(response.data);
    } catch (error) {
      console.error('Error loading group balance:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  const loadUserBalance = React.useCallback(async () => {
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
    if (selectedGroup && viewType === 'group') {
      loadGroupBalance();
    }
  }, [selectedGroup, viewType, loadGroupBalance]);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Balances</h2>
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

      {viewType === 'group' ? (
        <>
          {!selectedGroup ? (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select a Group</h3>
              <p className="text-gray-600 mb-4">Choose a group to view balances:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => onGroupSelected(group)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300"
                  >
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{group.members.length} members</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">
                      Balances for {selectedGroup.name}
                    </h3>
                    <p className="text-blue-700">
                      {selectedGroup.members.length} members
                    </p>
                  </div>
                  <button
                    onClick={() => onGroupSelected(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Change Group
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="bg-white shadow-md rounded-lg p-6 text-center">
                  <div className="text-gray-500">Loading balances...</div>
                </div>
              ) : groupBalance ? (
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
              ) : (
                <div className="bg-white shadow-md rounded-lg p-6 text-center">
                  <div className="text-gray-500">No balance data available</div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {!selectedUser ? (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select a User</h3>
              <p className="text-gray-600 mb-4">Choose a user to view their balances across all groups:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-green-300"
                  >
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
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

              {loading ? (
                <div className="bg-white shadow-md rounded-lg p-6 text-center">
                  <div className="text-gray-500">Loading balances...</div>
                </div>
              ) : userBalance ? (
                <>
                  <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Overall Balance</h3>
                      <div className={`text-3xl font-bold ${getBalanceColor(userBalance.total_net_balance)}`}>
                        {userBalance.total_net_balance >= 0 ? '+' : ''}${userBalance.total_net_balance.toFixed(2)}
                      </div>
                      <p className={`text-sm mt-1 ${getBalanceColor(userBalance.total_net_balance)}`}>
                        {getBalanceText(userBalance.total_net_balance)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {userBalance.group_balances.map((groupBalance) => {
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
                </>
              ) : (
                <div className="bg-white shadow-md rounded-lg p-6 text-center">
                  <div className="text-gray-500">No balance data available</div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BalanceView;
