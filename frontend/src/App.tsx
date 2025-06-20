import React, { useState, useEffect } from 'react';
import { User, Group, groupAPI, userAPI } from './api';
import UserManagement from './components/UserManagement';
import GroupManagement from './components/GroupManagement';
import ExpenseManagement from './components/ExpenseManagement';
import BalanceView from './components/BalanceView';
import SettlementManagement from './components/SettlementManagement';
import ChatBot from './components/ChatBot';
import './App.css';

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
    // Refresh current group data if needed
    if (selectedGroup) {
      // Could update expenses here
    }
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'groups', label: 'Groups', icon: '🏠' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'balances', label: 'Balances', icon: '⚖️' },
    { id: 'settlements', label: 'Settlements', icon: '💸' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 floating-bg">
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Splitwise Clone
                </h1>
                <p className="text-lg text-gray-600 font-medium">Simple expense splitting app</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
                <span className="text-sm font-semibold text-gray-700">✨ AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white/80 backdrop-blur-md shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 min-h-[600px] text-gray-900">
            {activeTab === 'users' && (
              <UserManagement users={users} onUserCreated={handleUserCreated} />
            )}
            
            {activeTab === 'groups' && (
              <GroupManagement
                groups={groups}
                users={users}
                selectedGroup={selectedGroup}
                onGroupCreated={handleGroupCreated}
                onGroupSelected={setSelectedGroup}
              />
            )}
            
            {activeTab === 'expenses' && (
              <ExpenseManagement
                groups={groups}
                users={users}
                selectedGroup={selectedGroup}
                onExpenseAdded={handleExpenseAdded}
                onGroupSelected={setSelectedGroup}
              />
            )}
            
            {activeTab === 'balances' && (
              <BalanceView
                groups={groups}
                users={users}
                selectedGroup={selectedGroup}
                onGroupSelected={setSelectedGroup}
              />
            )}
            
            {activeTab === 'settlements' && (
              <SettlementManagement
                groups={groups}
                users={users}
                selectedGroup={selectedGroup}
                onGroupSelected={setSelectedGroup}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* AI Chatbot - Always visible */}
      <ChatBot />
    </div>
  );
}

export default App;
