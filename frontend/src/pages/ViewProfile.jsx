import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";

export default function ViewProfile() {
  const { id } = useParams();
  const currentUser = getUser();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBio, setEditBio] = useState("");

  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followList, setFollowList] = useState([]);
  const [followMode, setFollowMode] = useState("followers");

  // ⭐ Backend URL root เช่น https://meawmates.onrender.com
  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  /* ===================================================
      IMAGE HANDLERS
  =================================================== */
  const avatarURL = (avatar) => {
    if (!avatar) return "/images/profile.png";
    if (avatar.startsWith("/images/")) return avatar;
    if (avatar.startsWith("data:")) return avatar;
    if (avatar.startsWith("http")) return avatar;

    // backend uploads เช่น /uploads/x.png
    return `${backendBase}${avatar.startsWith("/") ? avatar : "/" + avatar}`;
  };

  const imageURL = (img) => {
    if (!img) return "https://placekitten.com/400/300";
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`;
  };

  /* ===================================================
      FETCH PROFILE + POSTS
  =================================================== */
  const fetchProfile = async () => {
    try {
      const resUser = await api.get(`/api/users/${id}`);
      const resPosts = await api.get(`/api/posts/user/${id}`);

      setProfile(resUser.data);
      setPosts(resPosts.data);

      if (currentUser?._id) {
        const isFollow = resUser.data.followers?.some(
          (u) => u._id?.toString() === currentUser._id.toString()
        );
        setIsFollowing(isFollow);
      }
    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading)
    return <div className="py-40 text-center text-gray-500 text-xl">Loading...</div>;

  if (!profile)
    return <div className="py-40 text-center text-red-500 text-xl">User not found.</div>;

  /* ===================================================
      FOLLOW / UNFOLLOW
  =================================================== */
  const toggleFollow = async () => {
    try {
      if (!isFollowing) {
        await api.post(`/api/users/${id}/follow`);
        setIsFollowing(true);

        setProfile((prev) => ({
          ...prev,
          followers: [...prev.followers, { _id: currentUser._id }],
        }));
      } else {
        await api.post(`/api/users/${id}/unfollow`);
        setIsFollowing(false);

        setProfile((prev) => ({
          ...prev,
          followers: prev.followers.filter((u) => u._id !== currentUser._id),
        }));
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  /* ===================================================
      FOLLOWERS / FOLLOWING LIST
  =================================================== */
  const openFollowList = async (mode) => {
    setFollowMode(mode);
    try {
      const res = await api.get(`/api/users/${id}/${mode}`);
      setFollowList(res.data);
      setShowFollowModal(true);
    } catch (err) {
      console.error("Follow list error:", err);
    }
  };

  /* ===================================================
      SAVE SETTINGS
  =================================================== */
  const convertToBase64 = (file, cb) => {
    const r = new FileReader();
    r.onloadend = () => cb(r.result);
    r.readAsDataURL(file);
  };

  const openSettings = () => {
    setEditName(profile.name);
    setEditAvatar(profile.avatar);
    setEditBio(profile.bio || "");
    setShowSettings(true);
  };

  const handleSaveSettings = async () => {
    try {
      await api.put("/api/users/me", {
        name: editName,
        avatar: editAvatar,
        bio: editBio,
      });

      setShowSettings(false);
      fetchProfile();
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to save changes.");
    }
  };

  /* ===================================================
      RENDER UI
  =================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">

      {/* PROFILE CARD */}
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-12 relative">

        {currentUser?._id === profile._id && (
          <button onClick={openSettings} className="absolute top-4 right-4">
            <img src="/images/Settings.png" className="w-8 h-8 opacity-80 hover:opacity-100" />
          </button>
        )}

        <img
          src={avatarURL(profile.avatar)}
          className="w-32 h-32 mx-auto rounded-full object-cover shadow-lg mb-4 border-4 border-pink-200"
        />

        <h1 className="text-3xl font-bold text-gray-800 mb-1">{profile.name}</h1>

        {/* FOLLOW BUTTON */}
        {currentUser?._id !== profile._id && (
          <button
            onClick={toggleFollow}
            className={`px-5 py-2 mt-2 rounded-xl font-semibold transition shadow
              ${isFollowing ? "bg-gray-300 text-gray-700" : "bg-pink-500 text-white"}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}

        <p className="text-gray-600 text-sm max-w-md mx-auto mt-4 mb-4 leading-relaxed">
          {profile.bio || "This user hasn’t added a bio yet 💬"}
        </p>

        <div className="flex justify-center gap-10 mt-6">
          <ProfileStat num={posts.length} label="Posts" />

          <ProfileStat
            num={profile.followers?.length}
            label="Followers"
            onClick={() => openFollowList("followers")}
          />

          <ProfileStat
            num={profile.following?.length}
            label="Following"
            onClick={() => openFollowList("following")}
          />
        </div>
      </div>

      {/* POSTS */}
      <h3 className="text-2xl font-semibold mb-6">Posts by {profile.name}</h3>

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {posts.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl shadow hover:shadow-xl transition p-4">
              <Link to={`/post/${p._id}`}>
                <img src={imageURL(p.image)} className="w-full h-64 object-cover rounded-xl mb-3" />
              </Link>
              <p className="text-gray-700 text-sm">{p.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* FOLLOW MODAL */}
      {showFollowModal && (
        <FollowModal
          followList={followList}
          followMode={followMode}
          avatarURL={avatarURL}
          setShowFollowModal={setShowFollowModal}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          editAvatar={editAvatar}
          editName={editName}
          editBio={editBio}
          setEditAvatar={setEditAvatar}
          setEditName={setEditName}
          setEditBio={setEditBio}
          convertToBase64={convertToBase64}
          handleSaveSettings={handleSaveSettings}
          setShowSettings={setShowSettings}
        />
      )}

    </div>
  );
}

/* ==========================================
    SMALL COMPONENTS
========================================== */

function ProfileStat({ num = 0, label, onClick }) {
  return (
    <div
      className={`text-center ${onClick ? "cursor-pointer hover:opacity-70" : ""}`}
      onClick={onClick}
    >
      <p className="text-xl font-bold">{num}</p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}

/* FOLLOW MODAL */
function FollowModal({ followList, followMode, avatarURL, setShowFollowModal }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-80 p-5 rounded-2xl shadow-xl">

        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          {followMode === "followers" ? "Followers" : "Following"}
        </h2>

        <div className="max-h-80 overflow-y-auto space-y-3">
          {followList.map((u) => (
            <Link
              key={u._id}
              to={`/profile/${u._id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setShowFollowModal(false)}
            >
              <img src={avatarURL(u.avatar)} className="w-10 h-10 rounded-full object-cover border" />
              <p className="font-medium">{u.name}</p>
            </Link>
          ))}
        </div>

        <button
          onClick={() => setShowFollowModal(false)}
          className="mt-4 w-full py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* SETTINGS MODAL */
function SettingsModal({
  editAvatar,
  editName,
  editBio,
  setEditAvatar,
  setEditName,
  setEditBio,
  convertToBase64,
  handleSaveSettings,
  setShowSettings,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-96 p-6 rounded-2xl shadow-xl">

        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

        <div className="flex flex-col items-center mb-4">
          <img
            src={editAvatar}
            className="w-28 h-28 rounded-full object-cover border-4 border-pink-300 shadow"
          />

          <button
            onClick={() => document.getElementById("uploadAvatar").click()}
            className="mt-3 px-4 py-1.5 bg-pink-500 text-white rounded-lg shadow hover:bg-pink-600"
          >
            Change Photo
          </button>

          <input
            id="uploadAvatar"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              convertToBase64(e.target.files[0], (b64) => setEditAvatar(b64))
            }
          />
        </div>

        <label className="font-medium mb-1">Name</label>
        <input
          type="text"
          className="w-full border rounded-xl p-2 mb-4"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
        />

        <label className="font-medium mb-1">Bio</label>
        <textarea
          className="w-full border rounded-xl p-2 h-24"
          value={editBio}
          onChange={(e) => setEditBio(e.target.value)}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowSettings(false)}
            className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}
