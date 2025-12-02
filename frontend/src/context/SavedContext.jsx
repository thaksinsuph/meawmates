import { createContext, useContext, useEffect, useMemo, useState } from "react"

const SavedCtx = createContext(null)

export function SavedProvider({ children }) {
  const [saved, setSaved] = useState(() => {
    try {
      const raw = localStorage.getItem("saved_posts")
      return raw ? JSON.parse(raw) : { ids: [], byId: {} }
    } catch { return { ids: [], byId: {} } }
  })

  useEffect(() => {
    localStorage.setItem("saved_posts", JSON.stringify(saved))
  }, [saved])

  const isSaved = (id) => saved.ids.includes(id)

  const toggleSave = (post) => {
    setSaved(prev => {
      const ids = new Set(prev.ids)
      const byId = { ...prev.byId }
      if (ids.has(post.id)) {
        ids.delete(post.id)
        delete byId[post.id]
      } else {
        ids.add(post.id)
        byId[post.id] = post
      }
      return { ids: Array.from(ids), byId }
    })
  }

  const removeSaved = (id) => {
    setSaved(prev => {
      const ids = prev.ids.filter(x => x !== id)
      const byId = { ...prev.byId }
      delete byId[id]
      return { ids, byId }
    })
  }

  const value = useMemo(() => ({
    savedIds: saved.ids,
    savedById: saved.byId,
    isSaved,
    toggleSave,
    removeSaved,
  }), [saved])

  return <SavedCtx.Provider value={value}>{children}</SavedCtx.Provider>
}

export function useSaved() {
  const ctx = useContext(SavedCtx)
  if (!ctx) throw new Error("useSaved must be used within SavedProvider")
  return ctx
}
