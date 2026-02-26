import { Routes, Route } from 'react-router-dom'
import ForumList from '../features/forum/pages/ForumList'
import ForumForm from '../features/forum/pages/ForumForm'
import ForumDetail from '../features/forum/pages/ForumDetail'

const Forum = () => {
  return (
    <Routes>
      <Route path="/" element={<ForumList />} />
      <Route path="create" element={<ForumForm />} />
      <Route path=":id" element={<ForumDetail />} />
      <Route path=":id/edit" element={<ForumForm />} />
    </Routes>
  )
}

export default Forum