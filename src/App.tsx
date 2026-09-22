import { RouterProvider } from 'react-router';
import router from './routes/Router';
import { StudyProvider } from './context/study-context/StudyContext';
import './css/globals.css';

function App() {
  return (
    <StudyProvider>
      <RouterProvider router={router} />
    </StudyProvider>
  );
}

export default App;
