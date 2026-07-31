import React from 'react'
import { useState, useEffect } from 'react'
import { BrowserRouter, createBrowserRouter } from 'react-router-dom'

import AppRoutes from "./routes/AppRoutes"



const App = () => {
  return (
    <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath:true}}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App



//  useEffect(() => {
//     fetch("http://localhost:5000/api/hello")
//       .then(res => res.json())
//       .then(data => console.log(data));
//   }, []);

