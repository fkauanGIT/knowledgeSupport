import type { Chamado } from '../types/chamado'

interface ChamadoListProps {
  chamados: Chamado[]
}

export default function ChamadoList({ chamados }: ChamadoListProps) {
  if (chamados.length === 0) {
    return <p>Nenhum chamado cadastrado ainda.</p>
  }

  return (
    <table className="chamado-list">
      <thead>
        <tr>
          <th>ID</th>
          <th>Título</th>
          <th>Filial</th>
          <th>Categoria</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {chamados.map((chamado) => (
          <tr key={chamado.id}>
            <td>{chamado.id}</td>
            <td>{chamado.titulo}</td>
            <td>{chamado.filial}</td>
            <td>{chamado.categoria}</td>
            <td>{chamado.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
