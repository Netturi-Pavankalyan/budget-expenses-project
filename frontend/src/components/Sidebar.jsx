import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-[#12121a] border-r border-gray-800 flex flex-col p-6">
      <div>
        <h1 className="text-xl font-bold text-white mb-10">
          Budget <span className="text-blue-500">Tracker</span>
        </h1>
        <nav className="space-y-2">
          {[
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/expenses', icon: Receipt, label: 'Expenses' },
            { to: '/budgets', icon: Wallet, label: 'Budgets' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}