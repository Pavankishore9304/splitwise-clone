import React, { useState, useEffect, useCallback } from 'react';
import { Group, Expense, ExpenseCreate, groupAPI, expenseAPI } from '../api';

interface ExpenseManagementProps {
  group: Group;
  onExpenseAdded: () => void;
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ group, onExpenseAdded }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExpenseCreate>({
    description: '',
    amount: 0,
    paid_by: 0,
    split_type: 'equal',
    splits: []
  });

  const loadExpenses = useCallback(async () => {
    if (!group) return;
    
    try {
      const response = await groupAPI.getExpenses(group.id);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  }, [group]);

  useEffect(() => {
    if (group) {
      loadExpenses();
    } else {
      setExpenses([]); // Clear expenses if no group is selected
    }
  }, [group, loadExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !formData.description.trim() || formData.amount <= 0 || formData.paid_by === 0) {
      return;
    }

    if (formData.split_type === 'percentage' && (!formData.splits || formData.splits.length === 0)) {
      alert('Please specify percentage splits for each member');
      return;
    }

    setLoading(true);
    try {
      await groupAPI.addExpense(group.id, formData);
      setFormData({
        description: '',
        amount: 0,
        paid_by: 0,
        split_type: 'equal',
        splits: []
      });
      setShowForm(false);
      loadExpenses();
      onExpenseAdded();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paid_by,
      split_type: expense.split_type,
      splits: expense.splits.map(split => ({
        user_id: split.user_id,
        percentage: split.percentage || 0
      }))
    });
    setShowForm(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !group || !formData.description.trim() || formData.amount <= 0 || formData.paid_by === 0) {
      return;
    }

    setLoading(true);
    try {
      await expenseAPI.update(editingExpense.id, formData);
      setFormData({
        description: '',
        amount: 0,
        paid_by: 0,
        split_type: 'equal',
        splits: []
      });
      setShowForm(false);
      setEditingExpense(null);
      loadExpenses();
      onExpenseAdded();
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Error updating expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseAPI.delete(expenseId);
      loadExpenses();
      onExpenseAdded();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense');
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: 0,
      paid_by: 0,
      split_type: 'equal',
      splits: []
    });
    setShowForm(false);
  };

  const handleSplitChange = (userId: number, percentage: number) => {
    const newSplits = formData.splits?.filter(s => s.user_id !== userId) || [];
    if (percentage > 0) {
      newSplits.push({ user_id: userId, percentage });
    }
    setFormData({ ...formData, splits: newSplits });
  };

  const getTotalPercentage = () => {
    return formData.splits?.reduce((sum, split) => sum + (split.percentage || 0), 0) || 0;
  };

  const groupMembers = group?.members || [];
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Expenses for <span className='text-blue-600'>{group.name}</span></h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Expense
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>
          <form onSubmit={editingExpense ? handleUpdateExpense : handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Dinner at restaurant"
                required
              />
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div>
              <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700">
                Paid By
              </label>
              <select
                id="paidBy"
                value={formData.paid_by}
                onChange={(e) => setFormData({ ...formData, paid_by: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value={0}>Select who paid</option>
                {groupMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="equal"
                    checked={formData.split_type === 'equal'}
                    onChange={(e) => setFormData({ ...formData, split_type: e.target.value as 'equal' | 'percentage', splits: [] })}
                    className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">Equal split</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="percentage"
                    checked={formData.split_type === 'percentage'}
                    onChange={(e) => setFormData({ ...formData, split_type: e.target.value as 'equal' | 'percentage', splits: [] })}
                    className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">Custom percentage</span>
                </label>
              </div>
            </div>
            
            {formData.split_type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentage Split (Total: {getTotalPercentage().toFixed(1)}%)
                </label>
                <div className="space-y-2">
                  {groupMembers.map((member) => {
                    const split = formData.splits?.find(s => s.user_id === member.id);
                    return (
                      <div key={member.id} className="flex items-center space-x-2">
                        <span className="w-24 text-sm text-gray-700">{member.name}:</span>
                        <input
                          type="number"
                          value={split?.percentage || 0}
                          onChange={(e) => handleSplitChange(member.id, parseFloat(e.target.value) || 0)}
                          className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    );
                  })}
                </div>
                {Math.abs(getTotalPercentage() - 100) > 0.1 && (
                  <p className="text-red-600 text-sm mt-1">
                    Percentages must add up to 100%
                  </p>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={editingExpense ? handleCancelEdit : () => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (formData.split_type === 'percentage' && Math.abs(getTotalPercentage() - 100) > 0.1)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? (editingExpense ? 'Updating...' : 'Adding...') : (editingExpense ? 'Update Expense' : 'Add Expense')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Expenses for {group.name} ({expenses.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {expenses.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No expenses found. Add your first expense to get started.
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{expense.description}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Paid by {expense.paid_by_user.name} • {expense.split_type} split
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(expense.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      ${expense.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {expense.splits.length} participants
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Split details:</span>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {expense.splits.map((split) => (
                        <div key={split.id}>
                          {split.user.name}: ${split.amount.toFixed(2)}
                          {split.percentage && ` (${split.percentage}%)`}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleEditExpense(expense)}
                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseManagement;
