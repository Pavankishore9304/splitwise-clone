import React, { useState, useEffect } from 'react';
import GroupManagement from './components/GroupManagement';
import ExpenseManagement from './components/ExpenseManagement';
import BalanceView from './components/BalanceView';
import SettlementManagement from './components/SettlementManagement';
import ChatBot from './components/ChatBot';
import UserManagement from './components/UserManagement';

import { User, Group, groupAPI, userAPI } from './api';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'expenses' | 'balances' | 'settlements'>('users');

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await groupAPI.getAll();
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleUserCreated = () => {
    loadUsers();
  };

  const handleGroupCreated = () => {
    loadGroups();
  };

  const handleExpenseAdded = () => {
    if (selectedGroup) {
      // Refresh group data if needed
    }
  };

  const tabs = [
    { id: 'users', label: 'User Management' },
    { id: 'groups', label: 'Group Management' },
    { id: 'expenses', label: 'Add Expense' },
    { id: 'balances', label: 'View Balances' },
    { id: 'settlements', label: 'Settle Up' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">Splitwise</h1>
            </div>
            <nav className="hidden md:flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-8">
            {activeTab === 'users' && <UserManagement onUserCreated={handleUserCreated} users={users} />}
            {activeTab === 'groups' && <GroupManagement onGroupCreated={handleGroupCreated} users={users} groups={groups} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />}
            {activeTab === 'expenses' && selectedGroup && <ExpenseManagement group={selectedGroup} onExpenseAdded={handleExpenseAdded} />}
            {activeTab === 'balances' && selectedGroup && <BalanceView group={selectedGroup} users={users} />}
            {activeTab === 'settlements' && selectedGroup && <SettlementManagement group={selectedGroup} />}

            {!selectedGroup && (activeTab === 'expenses' || activeTab === 'balances' || activeTab === 'settlements') && (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <h3 className="text-lg font-medium text-gray-700">Please select a group first</h3>
                <p className="text-sm text-gray-500 mt-2">You need to select a group from the 'Group Management' tab to see expenses, balances, or settlements.</p>
              </div>
            )}
          </div>

          <aside className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-4">Current Selection</h3>
              {selectedGroup ? (
                <div>
                  <p className="font-semibold text-blue-700">{selectedGroup.name}</p>
                  <p className="text-sm text-gray-500">{selectedGroup.members.length} members</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No group selected.</p>
              )}
            </div>
          </aside>

        </div>
      </main>

      <ChatBot />
    </div>
  );
}

export default App;