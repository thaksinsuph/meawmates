
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

  // Settings Modal
  const [showSettings, setShowSettings] = useState(false);

  // Follow UI state
  const [isFollowing, setIsFollowing] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBio, setEditBio] = useState("");

  // Followers modal
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followList, setFollowList] = useState([]);
  const [followMode, setFollowMode] = useState("followers");

  const avatarURL = (avatar) => {
  if (!avatar) return "/images/profile.png";           // default local
  if (avatar.startsWith("/images/")) return avatar;    // local static image
  if (avatar.startsWith("data:")) return avatar;       // base64
  return avatar;                                       // google avatar OR backend path if any
};





  const imageURL = (img) =>
  !img || typeof img !== "string"
    ? "https://placekitten.com/400/300"
    : img.startsWith("data:")
    ? img
    : `http://localhost:4000${img.replace(/\\/g, "/")}`;


  /* ===================================================
        FETCH PROFILE + POSTS
  =================================================== */
  const fetchProfile = async () => {
    try {
      const resUser = await api.get(`/api/users/${id}`);
      const resPosts = await api.get(`/api/posts/user/${id}`);

      setProfile(resUser.data);
      setPosts(resPosts.data);

      // check following state correctly
      if (currentUser?._id) {
        setIsFollowing(
          resUser.data.followers?.some(
            (u) => u._id?.toString() === currentUser._id
          )
        );
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

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

  /* ===================================================
        FOLLOW / UNFOLLOW FUNCTION
  =================================================== */
  const toggleFollow = async () => {
    try {
      if (!isFollowing) {
        await api.post(`/api/users/${id}/follow`);
        setIsFollowing(true);

        // update UI
        setProfile((prev) => ({
          ...prev,
          followers: [...prev.followers, currentUser._id],
        }));
      } else {
        await api.post(`/api/users/${id}/unfollow`);
        setIsFollowing(false);

        setProfile((prev) => ({
          ...prev,
          followers: prev.followers.filter(
            (fid) => fid.toString() !== currentUser._id.toString()
          ),
        }));
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  /* ===================================================
        OPEN FOLLOW LIST
  =================================================== */
  const openFollowList = async (mode) => {
    setFollowMode(mode);

    try {
      const res = await api.get(`/api/users/${id}/${mode}`);
      setFollowList(res.data);
      setShowFollowModal(true);
    } catch (err) {
      console.error("Load follow list error:", err);
    }
  };

  /* ===================================================
        SAVE SETTINGS
  =================================================== */
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

  const convertToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const openSettings = () => {
    setEditName(profile.name);
    setEditAvatar(profile.avatar);
    setEditBio(profile.bio || "");
    setShowSettings(true);
  };

  /* ===================================================
        RENDER
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
              ${isFollowing ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
                : "bg-pink-500 text-white hover:bg-pink-600"}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}

        <p className="text-gray-600 text-sm max-w-md mx-auto mt-4 mb-4 leading-relaxed">
          {profile.bio || "This user hasn’t added a bio yet 💬"}
        </p>

        <div className="flex justify-center gap-10 mt-6">

          <div className="text-center">
            <p className="text-xl font-bold">{posts.length}</p>
            <p className="text-gray-500 text-sm">Posts</p>
          </div>

          <div
            className="text-center cursor-pointer hover:opacity-70"
            onClick={() => openFollowList("followers")}
          >
            <p className="text-xl font-bold">{profile.followers?.length || 0}</p>
            <p className="text-gray-500 text-sm">Followers</p>
          </div>

          <div
            className="text-center cursor-pointer hover:opacity-70"
            onClick={() => openFollowList("following")}
          >
            <p className="text-xl font-bold">{profile.following?.length || 0}</p>
            <p className="text-gray-500 text-sm">Following</p>
          </div>

        </div>
      </div>

      {/* POSTS */}
      <div className="border-t border-gray-200 my-10" />

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

      {/* FOLLOW LIST MODAL */}
      {showFollowModal && (
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
                  <img
                    src={avatarURL(u.avatar)}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
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
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-96 p-6 rounded-2xl shadow-xl relative">

            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Edit Profile
            </h2>

            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Profile Picture
            </label>

            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                <img
                  src={editAvatar || "/images/default-avatar.png"}
                  className="w-28 h-28 rounded-full object-cover border-4 border-pink-300 shadow"
                />
                <button
                  onClick={() => document.getElementById("uploadAvatar").click()}
                  className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow border hover:bg-pink-100"
                >
                  <img src="/images/pictures.png" className="w-5 h-5 opacity-80" />
                </button>
              </div>

              <input
                id="uploadAvatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  convertToBase64(e.target.files[0], (b64) => setEditAvatar(b64))
                }
              />

              <button
                onClick={() => document.getElementById("uploadAvatar").click()}
                className="mt-3 px-4 py-1.5 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 shadow"
              >
                Change Photo
              </button>
            </div>

            <label className="font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              className="w-full border rounded-xl p-2 mb-4"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <label className="font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              className="w-full border rounded-xl p-2 h-24"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
