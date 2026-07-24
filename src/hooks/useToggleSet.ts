import { useState } from 'react'

/** A Set<string> with toggle — used to control which items in a list are "open". */
export function useToggleSet() {
  const [set, setSet] = useState<Set<string>>(new Set())

  const toggle = (key: string) =>
    setSet((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return [set, toggle, setSet] as const
}
