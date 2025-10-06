import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    }); 
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const [errors, setErrors] = useState({ email: "", password: "" });

    useEffect(() => {
        const verifyUser = async () => {
            try {
                const res = await axios.post(
                    `${BACKEND_URL}/auth/userVerification`,
                    {},
                    { withCredentials: true }
                );

                if (res.data.status) {
                    navigate("/"); 
                }
            } catch (error) {
                console.error("Verification error:", error);
                navigate("/login"); 
            }
        };

        verifyUser();
    }, [navigate]);

    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    }

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setErrors({ email: "", password: "" });

        try {
            const res = await axios.post(`${BACKEND_URL}/auth/login`,
                formData,
                { withCredentials: true }
            );

            if (res.data.success) {
                
                setFormData({
                    email: "",
                    password: ""
                });
                
                setTimeout(() => {
                    navigate('/');
                }, 500);
            } else {
                
                if (res.data.message.toLowerCase().includes("email")) {
                    setErrors({ ...errors, email: res.data.message });
                } 
                else if (res.data.message.toLowerCase().includes("password")) {
                    setErrors({ ...errors, password: res.data.message });
                }
            }
        } catch (err) {
            
            setErrors({ ...errors, password: "An unexpected error occurred. Please try again." });
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="relative z-10 w-full max-w-md">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-white/70">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="relative group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 transition-all duration-300 hover:bg-white/15 ${
                                    errors.email ? 'border-red-500 ring-red-500' : 'border-white/20 focus:ring-white/30'
                                }`}
                            />
                            
                            {errors.email && (
                                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                            )}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>


                        <div className="relative group">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 transition-all duration-300 hover:bg-white/15 ${
                                    errors.password ? 'border-red-500 ring-red-500' : 'border-white/20 focus:ring-white/30'
                                }`}
                            />
                            
                            {errors.password && (
                                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                            )}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>

                        <div className="text-right">
                            <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-300">
                                Forgot Password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 backdrop-blur-lg border border-white/20"
                        >
                            <span className="relative z-10">Sign In</span>
                        </button>

                        <div className="relative flex items-center justify-center my-6">
                            <div className="border-t border-white/20 w-full"></div>
                            <span className="bg-transparent px-4 text-white/60 text-sm">or</span>
                            <div className="border-t border-white/20 w-full"></div>
                        </div>



                        <div className="text-center mt-6">
                            <p className="text-white/70">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-white hover:text-purple-300 font-medium transition-colors duration-300">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login;
