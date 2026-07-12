import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { X, Upload } from 'lucide-react';
import API from '../api/axiosConfig';

export default function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Software & Subscriptions');
  const [description, setDescription] = useState('');

  // Auth Protection
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  // Fetch Expenses from Backend
  const fetchExpenses = async () => {
    try {
      const response = await API.get('/expenses/');
      setExpenses(response.data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Handle Save Expense
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Matches FastAPI ExpenseCreate schema
      await API.post('/expenses/', {
        amount: parseFloat(amount),
        category: category,
        description: description,
        expense_date: date
      });
      setIsOpen(false);
      resetForm();
      fetchExpenses(); // Refresh the list
    } catch (error) {
      alert("Failed to save expense.");
      console.error(error);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDate('');
    setCategory('Software & Subscriptions');
    setDescription('');
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Sidebar />
      <main className="flex-1 p-8 relative">
        <h1 className="text-2xl font-bold mb-8">Expenses</h1>

        <div className="bg-[#12121a] rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-[#12121a] border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No expenses found. Add one!</td></tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-gray-800 hover:bg-[#1e1e2e] transition-colors">
                    <td className="px-6 py-4 font-medium">{exp.description || 'No description'}</td>
                    <td className="px-6 py-4 text-gray-400">{exp.category}</td>
                    <td className="px-6 py-4 text-gray-400">{exp.expense_date}</td>
                    <td className="px-6 py-4 font-medium text-red-400">-${exp.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full">Completed</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Expense Modal */}
        {isOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#12121a] w-full max-w-md p-6 rounded-xl border border-gray-700 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Add Expense</h2>
                <button onClick={() => { setIsOpen(false); resetForm(); }}><X size={24} className="text-gray-400 hover:text-white" /></button>
              </div>
              
              <form onSubmit={handleSave}>
                <div className="text-center p-6 bg-[#1e1e2e] rounded-lg border border-gray-700 mb-6">
                  <p className="text-gray-400 text-sm">AMOUNT</p>
                  <p className="text-4xl font-bold mt-1">${amount ? parseFloat(amount).toFixed(2) : '0.00'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">DATE</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">CATEGORY</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                      <option>Software & Subscriptions</option>
                      <option>Food</option>
                      <option>Transport</option>
                      <option>Entertainment</option>
                      <option>Office</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">DESCRIPTION</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
                </div>

                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-gray-500 transition-colors mb-6">
                  <Upload size={24} className="mb-2" />
                  <p className="text-sm">Drag or click to upload receipt</p>
                </div>

                <div className="flex space-x-4">
                  <button type="button" onClick={() => { setIsOpen(false); resetForm(); }} className="flex-1 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Save Expense</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}