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
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#0F111A]/95 backdrop-blur-xl border-t border-white/[0.07] pb-safe"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 cursor-pointer press-scale select-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isActive ? "text-indigo-400" : "text-slate-400 hover:text-slate-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-indigo-500/10 text-indigo-400" : ""}`}>
                    <Icon
                      aria-hidden="true"
                      className={`w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.6]"}`}
                    />
                  </div>
                  <span
                    className={`text-[10px] tracking-tight mt-0.5 ${
                      isActive ? "font-semibold text-indigo-400" : "font-medium text-slate-400"
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
