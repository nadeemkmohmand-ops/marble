import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { useSidebar } from '../../context/SidebarContext'

export default function Layout() {
  const { open } = useSidebar()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className={`transition-all duration-200 ${open ? 'lg:ms-64' : 'lg:ms-[76px]'}`}>
        <Header />
        <main className="p-3 sm:p-5 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
