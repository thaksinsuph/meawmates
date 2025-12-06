import { useEffect, useState } from "react";
import api from "../api";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ State สำหรับ Edit Modal
  const [editModal, setEditModal] = useState({
    open: false,
    user: null,
  });

  const loadUsers = async () => {
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Users load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      loadUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const toggleBan = async (id, currentStatus) => {
    if (!confirm(currentStatus ? "Unban this user?" : "Ban this user?")) return;

    try {
      await api.put(`/api/admin/users/${id}/ban`, { banned: !currentStatus });
      loadUsers();
    } catch (err) {
      alert("Failed to update ban status");
    }
  };

  // ⭐ เปิด Modal
  const openEditModal = (user) => {
    setEditModal({
      open: true,
      user: { ...user }, // copy object
    });
  };

  // ⭐ ปิด Modal
  const closeEditModal = () => {
    setEditModal({
      open: false,
      user: null,
    });
  };

  // ⭐ บันทึกข้อมูลไป backend
  const saveEdit = async () => {
    try {
      await api.put(
        `/api/admin/users/${editModal.user._id}`,
        editModal.user
      );

      closeEditModal();
      loadUsers();
    } catch (err) {
      console.error("Edit user error:", err);
      alert("Failed to edit user");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-purple-600 mb-4 flex items-center gap-2">
        <img src="/images/profile.png" className="w-6 h-6 object-contain" />
        Manage Users
      </h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b bg-purple-50">
          <p className="text-sm text-gray-600">
            Total users:{" "}
            <span className="font-semibold text-purple-700">
              {users.length}
            </span>
          </p>
        </div>

        {loading ? (
          <p className="p-4 text-sm text-gray-500">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-purple-100 text-purple-700">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr
                    key={u._id}
                    className={`border-t ${
                      idx % 2 === 0 ? "bg-white" : "bg-purple-50/40"
                    }`}
                  >
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      {u.banned ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right flex gap-2 justify-end">

                      {/* EDIT */}
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs hover:bg-blue-600"
                      >
                        Edit
                      </button>

                      {/* BAN / UNBAN */}
                      <button
                        onClick={() => toggleBan(u._id, u.banned)}
                        className={`px-3 py-1.5 rounded-full text-xs text-white ${
                          u.banned
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                      >
                        {u.banned ? "Unban" : "Ban"}
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => deleteUser(u._id)}
                        className="px-3 py-1.5 rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                      >
                        Delete
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ⭐ EDIT MODAL ⭐ */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-purple-600 mb-4">
              Edit User
            </h3>

            <div className="space-y-3">

              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  className="w-full p-2 border rounded-xl"
                  value={editModal.user.name}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      user: { ...editModal.user, name: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  className="w-full p-2 border rounded-xl"
                  value={editModal.user.email}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      user: { ...editModal.user, email: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Role</label>
                <select
                  className="w-full p-2 border rounded-xl"
                  value={editModal.user.role}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      user: { ...editModal.user, role: e.target.value },
                    })
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                onClick={closeEditModal}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
                onClick={saveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
