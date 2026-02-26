import { Routes, Route } from 'react-router-dom'
import RankingList from '../features/ranking/pages/RankingList'
import RankingForm from '../features/ranking/pages/RankingForm'
import RankingDetail from '../features/ranking/pages/RankingDetail'

const Ranking = () => {
  return (
    <Routes>
      <Route path="/" element={<RankingList />} />
      <Route path="create" element={<RankingForm />} />
      <Route path=":id" element={<RankingDetail />} />
      <Route path=":id/edit" element={<RankingForm />} />
    </Routes>
  )
}

export default Ranking