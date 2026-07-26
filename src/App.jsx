import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 className="flex justify-center items-center text-3xl font-bold underline bg-amber-200">
        Tailwind CSS Working!!!
      </h1>
    </>
  )
}

export default App
