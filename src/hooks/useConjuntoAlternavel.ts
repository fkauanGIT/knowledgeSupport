import { useState } from 'react'

/** Um Set<string> com toggle — usado pra controlar quais itens de uma lista estão "abertos". */
export function useConjuntoAlternavel() {
  const [conjunto, setConjunto] = useState<Set<string>>(new Set())

  const alternar = (chave: string) =>
    setConjunto((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(chave)) proximo.delete(chave)
      else proximo.add(chave)
      return proximo
    })

  return [conjunto, alternar, setConjunto] as const
}
