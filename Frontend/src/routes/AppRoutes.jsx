import React from 'react'
import { Routes, Route } from 'react-router-dom'

import LandingPage from '../pages/LandingPage'
import SignUp from '../pages/auth/Signup'
import Login from '../pages/auth/Login'
import Dashboard from '../pages/dashboard/Dashboard'
import Profile from '../pages/dashboard/Profile'
import Applications from '../pages/dashboard/Applications'
import Network from '../pages/dashboard/Network'
import JobSearch from '../pages/dashboard/JobSearch'

import ProtectedRoutes from './ProtectedRoutes'
import DashboardLayout from '../components/layout/DashboardLayout'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<LandingPage />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/login' element={<Login />} />

      <Route element={
        <ProtectedRoutes>
          <DashboardLayout />
        </ProtectedRoutes>
      }>
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/applications' element={<Applications />} />
        <Route path='/network' element={<Network />} />
        <Route path='/jobsearch' element={<JobSearch />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
