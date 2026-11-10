import { NavLink } from "react-router";
import { LayoutDashboard, ArrowLeftRight, HandCoins, Settings } from "lucide-react";

export function BottomNav() {
  const tabs = [
    { to: "/", label: "Ringkasan", icon: LayoutDashboard },
    { to: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
    { to: "/debts", label: "Hutang", icon: HandCoins },
    { to: "/settings", label: "Setelan", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 apple-blur border-t border-black/[0.04] pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-[#007AFF] font-bold scale-105"
                    : "text-gray-400 hover:text-gray-600 font-medium"
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
