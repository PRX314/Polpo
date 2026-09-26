import { createContext } from 'react'

export const ToastContext = createContext({ ok: () => {}, err: () => {} })
