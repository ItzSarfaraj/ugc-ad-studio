import Navbar from './components/Navbar';
import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import { Route, Routes } from 'react-router-dom';
import Generator from './pages/Generator';
import Result from './pages/Result';
import MyGenerations from './pages/MyGenerations';
import Community from './pages/Community';
import Plans from './pages/Plans';
import Loading from './pages/Loading';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoutes';
import {Toaster} from 'react-hot-toast'

function App() {
	return (
		<>
		    <Toaster toastOptions={{style:{background:'#333', color:"#fff"}}}/>
			<SoftBackdrop />
			<LenisScroll />
			<Navbar />

			<Routes>
				<Route  path='/' element={<Home />} />
				<Route  path='/login' element={<Login />} />
				<Route  path='/signup' element={<Signup />} />
				<Route  path='/generate' element={<ProtectedRoute><Generator /></ProtectedRoute>} />
				<Route  path='/result/:projectId' element={<ProtectedRoute><Result /></ProtectedRoute>} />
				<Route  path='/my-generations' element={<ProtectedRoute><MyGenerations /></ProtectedRoute>} />
				<Route  path='/community' element={<Community />} />
				<Route  path='/plans' element={<Plans />} />
				<Route  path='/loading' element={<ProtectedRoute><Loading /></ProtectedRoute>} />
			</Routes>
			<Footer />
		</>
	);
}
export default App;