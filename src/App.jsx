import { ThemeProvider } from './hooks/useTheme'
import Home from './pages/Home'

function App() {
  return (
    <ThemeProvider>
      <Home />
    </ThemeProvider>
  )
}

export default App
