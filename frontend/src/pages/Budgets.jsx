import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../api/axiosConfig';

export default function Budgets() {
  const navigate = useNavigate();
  
  // Get current month in YYYY-MM format for the API
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.toISOString().slice(0, 7)); 
  const [budgets, setBudgets] = useState([]);

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

  // Month Navigation Logic
  const changeMonth = (direction) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction);
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  // Format YYYY-MM to "October 2023"
  const formatMonth = (dateStr) => {
    const date = new Date(dateStr + '-01T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate Totals for bottom bar
  const totalBudget = budgets.reduce((acc, item) => acc + item.budget_amount, 0);
  const totalSpent = budgets.reduce((acc, item) => acc + item.used_amount, 0);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Budgets</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[#12121a] px-4 py-2 rounded-lg border border-gray-800 text-sm">
              <ChevronLeft size={16} className="text-gray-400 cursor-pointer hover:text-white" onClick={() => changeMonth(-1)} />
              <span className="text-gray-300 min-w-[120px] text-center">{formatMonth(currentMonth)}</span>
              <ChevronRight size={16} className="text-gray-400 cursor-pointer hover:text-white" onClick={() => changeMonth(1)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500 py-12 bg-[#12121a] rounded-xl border border-gray-800">
              No budgets set for this month.
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
      </main>
    </div>
  );
}