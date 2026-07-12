import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import API from '../api/axiosConfig';

export default function Budgets() {
  const navigate = useNavigate();
  
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.toISOString().slice(0, 7)); 
  const [budgets, setBudgets] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // State for the loading spinner
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMonth, setNewMonth] = useState(currentMonth);

  // Auth Protection
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  // Fetch Budgets from Backend
  const fetchBudgets = async () => {
    try {
      const response = await API.get(`/budgets/?month=${currentMonth}`);
      setBudgets(response.data);
    } catch (error) {
      console.error("Failed to fetch budgets", error);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [currentMonth]);

  // Handle Save New Budget
  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!newCategory || !newAmount) {
      return;
    }

    setLoading(true); // Start circular loading

    try {
      await API.post('/budgets/', {
        month: newMonth,
        category: newCategory,
        budget_amount: parseFloat(newAmount)
      });
      
      setIsModalOpen(false); // Close modal only AFTER successful save
      resetModal();
      fetchBudgets(); 
    } catch (error) {
      console.error("Failed to save budget.", error);
    } finally {
      setLoading(false); // Stop circular loading
    }
  };

  const resetModal = () => {
    setNewCategory('');
    setNewAmount('');
    setNewMonth(currentMonth);
  };

  // Month Navigation Logic
  const changeMonth = (direction) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction);
    const newMonthStr = date.toISOString().slice(0, 7);
    setCurrentMonth(newMonthStr);
    setNewMonth(newMonthStr);
  };

  // Format YYYY-MM to "October 2023"
  const formatMonth = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + '-01T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate Totals for bottom bar
  const totalBudget = budgets.reduce((acc, item) => acc + item.budget_amount, 0);
  const totalSpent = budgets.reduce((acc, item) => acc + item.used_amount, 0);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />
      <main className="flex-1 p-8 relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Budgets</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[#12121a] px-4 py-2 rounded-lg border border-gray-800 text-sm">
              <ChevronLeft size={16} className="text-gray-400 cursor-pointer hover:text-white" onClick={() => changeMonth(-1)} />
              <span className="text-gray-300 min-w-[120px] text-center">{formatMonth(currentMonth)}</span>
              <ChevronRight size={16} className="text-gray-400 cursor-pointer hover:text-white" onClick={() => changeMonth(1)} />
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add budget
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500 py-12 bg-[#12121a] rounded-xl border border-gray-800">
              No budgets set for this month. Click "Add budget" to create one!
            </div>
          ) : (
            budgets.map((item) => {
              const isOver = item.remaining_amount < 0;
              const barColor = isOver ? 'bg-red-500' : 'bg-blue-500';
              const percentageWidth = Math.min(item.percentage_consumed, 100);

              return (
                <div key={item.id} className="bg-[#12121a] p-6 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-200">{item.category}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${isOver ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {item.percentage_consumed.toFixed(1)}%
                    </span>
                  </div>
                  
                  <p className="text-2xl font-bold mb-1">
                    ${item.used_amount.toFixed(2)} <span className="text-sm font-normal text-gray-500">/ ${item.budget_amount.toFixed(2)}</span>
                  </p>
                  
                  <p className={`text-sm mb-4 ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                    {isOver ? `Over by $${Math.abs(item.remaining_amount).toFixed(2)}` : `Remaining $${item.remaining_amount.toFixed(2)}`}
                  </p>

                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${barColor}`}
                      style={{ width: `${percentageWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Summary Bar */}
        {budgets.length > 0 && (
          <div className="mt-8 bg-[#12121a] p-6 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm">Total Budget</p>
              <p className="text-2xl font-bold">${totalBudget.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Actual Spend</p>
              <p className="text-2xl font-bold text-blue-400">${totalSpent.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Add Budget Modal */}
        {isModalOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[100]">
            <div className="bg-[#12121a] w-full max-w-md p-6 rounded-xl border border-gray-700 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Add New Budget</h2>
                <button onClick={() => { setIsModalOpen(false); resetModal(); }} disabled={loading}><X size={24} className="text-gray-400 hover:text-white" /></button>
              </div>
              
              <form onSubmit={handleAddBudget}>
                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">CATEGORY</label>
                  <input 
                    type="text" 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)} 
                    placeholder="e.g., Groceries, Housing" 
                    className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                    required 
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">MONTH</label>
                  <input 
                    type="month" 
                    value={newMonth} 
                    onChange={(e) => setNewMonth(e.target.value)} 
                    className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]" 
                    required 
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs text-gray-400 mb-2">BUDGET AMOUNT ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newAmount} 
                    onChange={(e) => setNewAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                    required 
                  />
                </div>

                <div className="flex space-x-4">
                  <button type="button" onClick={() => { setIsModalOpen(false); resetModal(); }} disabled={loading} className="flex-1 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">Cancel</button>
                  
                  {/* Circular Loading Spinner added here */}
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Budget"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}