import React from 'react'

export function Input({ label, ...props }) {
  return (
    <label className="block">
      {label && <div className="text-sm mb-1">{label}</div>}
      <input {...props} className="w-full rounded-xl border p-2 focus:outline-none focus:ring-2 focus:ring-slate-300" />
    </label>
  )
}

export function Password({ label, value, onChange }) {
  const [show, setShow] = React.useState(false)
  return (
    <label className="block">
      {label && <div className="text-sm mb-1">{label}</div>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </label>
  )
}
