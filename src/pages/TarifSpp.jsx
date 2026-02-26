import { Routes, Route } from 'react-router-dom'
import TarifSppList from '../features/spp/pages/TarifSppList'
import TarifSppForm from '../features/spp/pages/TarifSppForm'
import TarifSppDetail from '../features/spp/pages/TarifSppDetail'

const TarifSpp = () => {
  return (
    <Routes>
      <Route path="/" element={<TarifSppList />} />
      <Route path="create" element={<TarifSppForm />} />
      <Route path=":id" element={<TarifSppDetail />} />
      <Route path=":id/edit" element={<TarifSppForm />} />
    </Routes>
  )
}

export default TarifSpp