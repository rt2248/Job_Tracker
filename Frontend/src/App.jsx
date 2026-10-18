import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from "./routes/AppRoutes"
import { ToastProvider } from "./context/ToastContext"

const App = () => {
  return (
    <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App



//  useEffect(() => {
//     fetch("http://localhost:5000/api/hello")
//       .then(res => res.json())
//       .then(data => console.log(data));
//   }, []);

