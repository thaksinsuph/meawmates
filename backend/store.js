import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

export const users = [
  // default admin
  {
    id: 1,
    name: "Admin",
    email: "admin@meow.com",
    role: "admin",
    banned: false,
    passwordHash: bcrypt.hashSync("admin", 10),
    phone: "", city: "", bio: ""
  },
  {
    id: 2,
    name: "User A",
    email: "a@meow.com",
    role: "user",
    banned: false,
    passwordHash: bcrypt.hashSync("user123", 10),
    phone: "", city: "", bio: ""
  }
]

export const posts = [
  {
    id: 1,
    title: "Jane",
    snippet: "Gentle tabby, vaccinated, indoor only.",
    body: "Jane is a gentle tabby, vaccinated, loves cuddles.",
    img: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=1200&auto=format&fit=crop",
    status: "not_paired",
    author: "Eric Garcia",
    authorAvatar: "https://i.pravatar.cc/32?img=11",
    likes: 520,
    comments: 2,
    bookmarks: 8,
    location: "Prachin Buri",
    category: "Adopt",
    created_at: "2025-10-01",
    likedBy: new Set(),        // userId who liked
    savedBy: new Set(),        // userId who saved
    commentsList: []           // {id, userId, name, text, time}
  },
  {
    id: 2,
    title: "Jubee",
    snippet: "Playful British Shorthair. Good with kids.",
    body: "Jubee is playful, good with kids, vaccinated.",
    img: "https://images.unsplash.com/photo-1556679343-c7306c2b6b5d?q=80&w=1200&auto=format&fit=crop",
    status: "paired",
    author: "Pedri Gonsalez",
    authorAvatar: "https://i.pravatar.cc/32?img=22",
    likes: 5400,
    comments: 3,
    bookmarks: 11,
    location: "Chon Buri",
    category: "Adopt",
    created_at: "2025-09-26",
    likedBy: new Set([2]),
    savedBy: new Set([]),
    commentsList: []
  }
]

export let reports = [
  // { id, postId, byUserId, reason, time }
]

export const threads = [
  // sample message threads for Messages page
  { id: "t1", name: "Admin", last: "Welcome!", time: "09:00" }
]
export const messagesByThread = {
  t1: [
    { text: "Welcome!", from_me: false },
    { text: "Thanks!", from_me: true }
  ]
}

export function toggleLike(post, userId) {
  if (!post || !userId) return
  if (post.likedBy.has(userId)) {
    post.likedBy.delete(userId)
    post.likes = Math.max(0, post.likes - 1)
  } else {
    post.likedBy.add(userId)
    post.likes += 1
  }
}
export function toggleSave(post, userId) {
  if (!post || !userId) return
  if (post.savedBy.has(userId)) {
    post.savedBy.delete(userId)
    post.bookmarks = Math.max(0, (post.bookmarks || 0) - 1)
  } else {
    post.savedBy.add(userId)
    post.bookmarks = (post.bookmarks || 0) + 1
  }
}
export function addComment(post, user, text) {
  if (!post || !user || !text.trim()) return
  const id = uuidv4()
  const time = new Date().toISOString()
  post.commentsList.push({ id, userId: user.id, name: user.name, text, time })
  post.comments = (post.comments || 0) + 1
}
export function addReport(postId, byUserId, reason) {
  const id = uuidv4()
  const time = new Date().toISOString()
  reports.push({ id, postId, byUserId, reason, time })
}
