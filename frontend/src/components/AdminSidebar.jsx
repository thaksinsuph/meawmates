import { Link, useLocation } from "react-router-dom";

export default function AdminSidebar() {
  const { pathname } = useLocation();

  const menu = [
    { icon: "/images/dashboard.png", label: "Dashboard", path: "/admin" },
    { icon: "/images/profile.png", label: "Users", path: "/admin/users" },
    { icon: "/images/cat.png", label: "Pets", path: "/admin/pets" },
    { icon: "/images/edit.png", label: "Posts", path: "/admin/posts" },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col px-5 py-6 gap-5">
      {/* Header Logo */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src="/images/paw-decor.png"
          className="w-10 h-10 rounded-full bg-purple-100 object-cover"
        />
        <div>
          <p className="font-bold text-purple-600 text-lg">MeowMates</p>
          <p className="text-xs text-gray-400">Admin Center</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium
                transition-all
                ${
                  active
                    ? "bg-purple-200 text-purple-800 shadow-inner"
                    : "text-gray-600 hover:bg-purple-50"
                }
              `}
            >
              <img
                src={item.icon}
                className="w-6 h-6 object-contain opacity-90"
                alt={item.label}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
