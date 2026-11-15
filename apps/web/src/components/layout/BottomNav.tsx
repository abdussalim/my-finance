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
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white border-t border-slate-200 pb-safe"
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
                `flex flex-col items-center justify-center flex-1 py-1 relative transition-colors duration-120 cursor-pointer press-scale select-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none ${
                  isActive ? "text-[#2563EB]" : "text-slate-500 hover:text-slate-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <div
                      aria-hidden="true"
                      className="absolute -top-1 w-8 h-0.5 bg-[#2563EB] rounded-full"
                    />
                  ) : null}
                  <Icon
                    aria-hidden="true"
                    className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`}
                  />
                  <span
                    className={`text-[10px] tracking-tight ${
                      isActive ? "font-bold text-[#2563EB]" : "font-medium"
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
