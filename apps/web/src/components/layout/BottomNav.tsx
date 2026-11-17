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
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 ios-tab-bar pb-safe"
    >
      <div className="flex items-center justify-around h-[50px] px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all duration-120 cursor-pointer select-none ios-press focus-visible:outline-none ${
                  isActive ? "text-[#0A84FF]" : "text-[#8E8E93] hover:text-[#D1D1D6]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    aria-hidden="true"
                    className={`w-[21px] h-[21px] transition-transform duration-120 ${
                      isActive ? "stroke-[2.2] scale-[1.05]" : "stroke-[1.6]"
                    }`}
                  />
                  <span
                    className={`text-[10px] tracking-tight mt-0.5 leading-none transition-colors ${
                      isActive ? "font-semibold text-[#0A84FF]" : "font-normal text-[#8E8E93]"
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
