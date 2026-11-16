import { NavLink } from "react-router";
import { LayoutDashboard, Briefcase, ArrowLeftRight, HandCoins, Settings } from "lucide-react";

export function BottomNav() {
  const tabs = [
    { to: "/", label: "Ringkasan", icon: LayoutDashboard },
    { to: "/projects", label: "Proyek", icon: Briefcase },
    { to: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
    { to: "/debts", label: "Hutang", icon: HandCoins },
    { to: "/settings", label: "Setelan", icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Utama"
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#0C0F17]/90 backdrop-blur-2xl border-t border-white/[0.08] pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.7)]"
    >
      <div className="flex items-center justify-around h-15 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-150 cursor-pointer press-scale select-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none ${
                  isActive ? "text-[#818CF8]" : "text-slate-400 hover:text-slate-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <div
                      aria-hidden="true"
                      className="absolute -top-1 w-7 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                    />
                  ) : null}
                  <div
                    className={`p-1 rounded-xl transition-all duration-150 ${
                      isActive ? "bg-indigo-500/15" : ""
                    }`}
                  >
                    <Icon
                      aria-hidden="true"
                      className={`w-4.5 h-4.5 ${
                        isActive ? "stroke-[2.5] text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "stroke-[1.75]"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[9.5px] tracking-tight mt-0.5 ${
                      isActive ? "font-bold text-indigo-300" : "font-medium"
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
