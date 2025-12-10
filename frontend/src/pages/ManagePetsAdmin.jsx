import { useEffect, useState } from "react";
import api from "../api";

export default function ManagePetsAdmin() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  // ⭐ ใช้ backend URL จาก env
  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  const fixURL = (img) => {
    if (!img) return "";
    if (img.startsWith("data:")) return img;       // base64
    if (img.startsWith("http")) return img;        // external url
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`; // backend upload
  };

  const loadPets = async () => {
    try {
      // สันนิษฐานว่า endpoint นี้มีการ populate ข้อมูล User และดึงข้อมูลจังหวัดมาแล้ว
      const res = await api.get("/api/admin/pets");
      setPets(res.data);
    } catch (err) {
      console.error("Pets load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deletePet = async (id) => {
    if (!confirm("Delete this pet?")) return;
    try {
      await api.delete(`/api/admin/pets/${id}`);
      loadPets();
    } catch (err) {
      console.error("Delete pet error:", err);
      alert("Failed to delete pet");
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-purple-600 mb-4 flex items-center gap-2">
        <img src="/images/cat.png" className="w-6 h-6 object-contain" />
        Manage Pets
      </h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading pets…</p>
      ) : pets.length === 0 ? (
        <p className="text-sm text-gray-500">No pets found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pets.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3"
            >
              {/* ⭐ Cat Image */}
              {p.image && (
                <img
                  onClick={() => setPreviewImage(fixURL(p.image))}
                  src={fixURL(p.image)}
                  className="w-full h-80 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                />
              )}

              {/* ⭐ Vaccine Image */}
              {p.vaccineImage && (
                <div>
                  <p className="text-xs text-gray-500 mt-2 mb-1 flex items-center gap-1">
                    <img src="/images/vaccine.png" className="w-4 h-4" />
                    Vaccine Record
                  </p>

                  <img
                    onClick={() => setPreviewImage(fixURL(p.vaccineImage))}
                    src={fixURL(p.vaccineImage)}
                    className="w-full h-48 object-cover rounded-xl border border-blue-200 cursor-pointer hover:opacity-90 transition"
                  />
                </div>
              )}

              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {p.name || "Unnamed"}
                </p>
                <p className="text-xs text-gray-500">
                  Breed: {p.breed || "-"} • Color: {p.color || "-"}
                </p>
                {/* ⭐ NEW: แสดงจังหวัด (Province) */}
                <p className="text-xs text-gray-500">
                    Province: {p.province || "-"} • Gender: {p.gender || "-"}
                </p>
                {/* ⭐ MODIFIED: รวม Slot และ Age ไว้ด้วยกัน */}
                <p className="text-xs text-gray-400 mt-1">
                  Slot #{p.slot} • Age: {p.age ?? "-"} yrs
                </p>
              </div>

              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  Owner:{" "}
                  <span className="font-medium">
                    {p.user?.email || p.user?.name || "Unknown"}
                  </span>
                </div>

                <button
                  onClick={() => deletePet(p._id)}
                  className="px-3 py-1.5 rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ⭐ Fullscreen Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}