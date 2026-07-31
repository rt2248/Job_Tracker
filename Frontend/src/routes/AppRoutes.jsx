import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import SignUp from '../pages/Signup'

const AppRoutes = () => {
  return (
    <Routes>
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/signup' element={<SignUp/>}/>
    </Routes>
  )
}

export default AppRoutes
