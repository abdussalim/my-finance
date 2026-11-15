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
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-safe shadow-[0_-2px_12px_rgba(15,23,42,0.03)]"
    >
      <div className="flex items-center justify-around h-15 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 relative transition-colors duration-120 cursor-pointer press-scale select-none focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:outline-none ${
                  isActive ? "text-[#4338CA]" : "text-slate-500 hover:text-slate-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <div
                      aria-hidden="true"
                      className="absolute -top-1 w-8 h-[2.5px] bg-[#4338CA] rounded-full shadow-[0_1px_4px_rgba(67,56,202,0.4)]"
                    />
                  ) : null}
                  <Icon
                    aria-hidden="true"
                    className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`}
                  />
                  <span
                    className={`text-[10px] tracking-tight ${
                      isActive ? "font-bold text-[#4338CA]" : "font-medium"
                    }`}
                  >
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
