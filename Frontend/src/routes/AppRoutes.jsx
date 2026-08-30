import React from 'react'
import { Routes, Route } from 'react-router-dom'

import LandingPage from '../pages/LandingPage'
import SignUp from '../pages/auth/Signup'
import Login from '../pages/auth/Login'
import Dashboard from '../pages/dashboard/Dashboard'
import Profile from '../pages/dashboard/Profile'
import Applications from '../pages/dashboard/Applications'
import Network from '../pages/dashboard/Network'

import ProtectedRoutes from './ProtectedRoutes'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<LandingPage />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/login' element={<Login />} />

      <Route path='/dashboard' element={
        <ProtectedRoutes>
          <Dashboard />
        </ProtectedRoutes>
      } />
      <Route path='/profile' element={
        <ProtectedRoutes>
          <Profile />
        </ProtectedRoutes>
      } />
      <Route path='/applications' element={
        <ProtectedRoutes>
          <Applications />
        </ProtectedRoutes>
      } />
      <Route path='/network' element={
        <ProtectedRoutes>
          <Network />
        </ProtectedRoutes>
      } />
    </Routes>
  )
}

export default AppRoutes
