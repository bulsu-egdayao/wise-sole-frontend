import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminApp from './pages/AdminApp.tsx'
import ProductDetail from './pages/ProductDetail.tsx'
import Shop from './pages/Shop.tsx'
import Favorites from './pages/Favorites.tsx'
import CategoryPage from './pages/CategoryPage.tsx'
import FAQ from './pages/FAQ.tsx'

const path = window.location.pathname

function Root() {
  if (path.startsWith('/admin')) {
    return <AdminApp />
  }

  if (path.startsWith('/product/')) {
    const slug = path.replace('/product/', '').replace(/\/$/, '')
    return <ProductDetail slug={slug} />
  }

  if (path.startsWith('/category/')) {
    const slug = path.replace('/category/', '').replace(/\/$/, '')
    return <CategoryPage slug={slug} />
  }

  if (path.startsWith('/favorites')) {
    return <Favorites />
  }

  if (path.startsWith('/faq')) {
    return <FAQ />
  }

  if (path.startsWith('/shop')) {
    return <Shop />
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)