import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import SignUp from '../pages/Signup'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'

const AppRoutes = () => {
  return (
    <Routes>
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
    </Routes>
  )
}

export default AppRoutes
