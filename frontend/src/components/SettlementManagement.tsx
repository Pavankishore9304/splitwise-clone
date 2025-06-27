import React, { useState, useEffect, useCallback } from 'react';
import { Group, Settlement, groupAPI, settlementAPI } from '../api';

interface SettlementManagementProps {
  group: Group;
}

const SettlementManagement: React.FC<SettlementManagementProps> = ({ group }) => {
  const [showForm, setShowForm] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    payer_id: 0,
    payee_id: 0,
    amount: 0,
    description: ''
  });

  const loadSettlements = useCallback(async () => {
    if (!group) return;
    
    try {
      const response = await groupAPI.getSettlements(group.id);
      setSettlements(response.data);
    } catch (error) {
      console.error('Error loading settlements:', error);
    }
  }, [group]);

  useEffect(() => {
    if (group) {
      loadSettlements();
    } else {
      setSettlements([]); // Clear settlements if no group selected
    }
  }, [group, loadSettlements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || formData.payer_id === 0 || formData.payee_id === 0 || formData.amount <= 0) {
      return;
    }

    if (formData.payer_id === formData.payee_id) {
      alert('Payer and payee cannot be the same person');
      return;
    }

    setLoading(true);
    try {
      await groupAPI.addSettlement(group.id, {
        payer_id: formData.payer_id,
        payee_id: formData.payee_id,
        amount: formData.amount,
        description: formData.description
      });
      setFormData({
        payer_id: 0,
        payee_id: 0,
        amount: 0,
        description: ''
      });
      setShowForm(false);
      loadSettlements();
    } catch (error) {
      console.error('Error adding settlement:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        const errorMessage = axiosError.response?.data?.detail || 'Failed to add settlement';
        alert(`Error adding settlement: ${errorMessage}`);
      } else {
        alert('Error adding settlement: Unable to connect to server');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSettlement = async (settlementId: number) => {
    if (!window.confirm('Are you sure you want to delete this settlement? This action cannot be undone.')) {
      return;
    }

    try {
      await settlementAPI.delete(settlementId);
      loadSettlements();
    } catch (error) {
      console.error('Error deleting settlement:', error);
      alert('Error deleting settlement');
    }
  };

  const groupMembers = group?.members || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Settlements</h2>
        {group && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Record Payment
          </button>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-green-900">
              Settlements for {group.name}
            </h3>
            <p className="text-green-700">
              Record payments made outside the app
            </p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Record Payment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="payer" className="block text-sm font-medium text-gray-700">
                Who Paid
              </label>
              <select
                id="payer"
                value={formData.payer_id}
                onChange={(e) => setFormData({ ...formData, payer_id: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value={0}>Select who made the payment</option>
                {groupMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="payee" className="block text-sm font-medium text-gray-700">
                Who Received
              </label>
              <select
                id="payee"
                value={formData.payee_id}
                onChange={(e) => setFormData({ ...formData, payee_id: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value={0}>Select who received the payment</option>
                {groupMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount ($)
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Cash payment for dinner"
              />
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
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Payment History for {group.name} ({settlements.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {settlements.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No settlements recorded. Record payments made outside the app to keep balances accurate.
            </div>
          ) : (
            settlements.map((settlement) => (
              <div key={settlement.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {settlement.payer.name} paid {settlement.payee.name}
                    </h4>
                    {settlement.description && (
                      <p className="text-sm text-gray-500 mt-1">{settlement.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(settlement.settled_at).toLocaleDateString()} at {new Date(settlement.settled_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        ${settlement.amount.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSettlement(settlement.id)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SettlementManagement;
