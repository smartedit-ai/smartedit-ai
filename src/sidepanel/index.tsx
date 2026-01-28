import { createRoot } from 'react-dom/client'
import SidePanel from './SidePanel'
import './sidepanel.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<SidePanel />)
}
