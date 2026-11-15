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
    <nav
      aria-label="Navigasi Bawah Utama"
      className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-40 pointer-events-auto"
    >
      <div className="glass-nav rounded-full p-1.5 flex items-center justify-between shadow-[0_12px_36px_-6px_rgba(15,23,42,0.14)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-full transition-colors duration-150 cursor-pointer press-scale select-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none ${
                  isActive
                    ? "bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.35)]"
                    : "text-slate-400 hover:text-slate-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 mb-0.5 transition-transform duration-150 ${
                      isActive ? "scale-110" : ""
                    }`}
                  />
                  <span className={`text-[10px] tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
