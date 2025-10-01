import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });

    const [errors, setErrors] = useState({ 
        username: "", 
        email: "", 
        password: "" 
    });

    const [passwordStrength, setPasswordStrength] = useState({ 
        strength: 'weak', 
        message: 'Weak', 
        color: 'text-red-400' 
    });

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await axios.post(
                    `${BACKEND_URL}/auth/userVerification`, 
                    {}, 
                    { withCredentials: true }
                );

                if (res.data.status) {
                    navigate('/');
                }
            } catch (error) {
                console.error("Verification error:", error);
                navigate("/signup"); 
            }
        };

        verifyToken();
    }, [navigate]);

    const checkPasswordStrength = (password) => {
        let strength = 'weak';
        let message = 'Weak';
        let color = 'text-red-400';

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        const isLongEnough = password.length >= 8;

        if (password.length === 0) {
            strength = 'weak';
            message = '';
            color = '';
        } else if (isLongEnough && hasUpperCase && hasLowerCase && hasNumbers && hasSymbols) {
            strength = 'strong';
            message = 'Strong';
            color = 'text-green-400';
        } else if (isLongEnough && (hasUpperCase || hasLowerCase) && (hasNumbers || hasSymbols)) {
            strength = 'normal';
            message = 'Normal';
            color = 'text-yellow-400';
        }

        setPasswordStrength({ strength, message, color });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        setErrors({ ...errors, [name]: "" });

        if (name === "username") {
            if (!/^[a-zA-Z]+$/.test(value) && value !== "") {
                setErrors(prevErrors => ({ ...prevErrors, username: "Username must be in alphabets only." }));
            }
        } else if (name === "password") {
            checkPasswordStrength(value);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({ username: "", email: "", password: "" });

        if (!/^[a-zA-Z]+$/.test(formData.username)) {
            setErrors({ ...errors, username: "Username must be in alphabets only." });
            return;
        }

        try {
            const res = await axios.post(`${BACKEND_URL}/auth/signup`,
                formData,
                { withCredentials: true }
            );

            if (res.data.success) {
                setErrors({ username: "", email: "", password: "" });
                setFormData({
                    username: "",
                    email: "",
                    password: ""
                });
                
                setTimeout(() => {
                    navigate('/home');
                }, 500);
            } else {
                if (res.data.message.toLowerCase().includes("email")) {
                    setErrors({ ...errors, email: res.data.message });
                }
                else if (res.data.message.toLowerCase().includes("username")) {
                    setErrors({ ...errors, username: res.data.message });
                } 
                else {
                    setErrors({ ...errors, password: res.data.message });
                }
            }
        } catch (err) {
            setErrors({ ...errors, password: err.response?.data?.message || "An unexpected error occurred. Please try again." });
        }
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="relative z-10 w-full max-w-md">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-white/70">Join us today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <input 
                                type="text"
                                name="username"
                                placeholder="User Name"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 transition-all duration-300 hover:bg-white/15 ${
                                    errors.username ? 'border-red-500 ring-red-500' : 'border-white/20 focus:ring-white/30'
                                }`}
                            />
                            {errors.username && (
                                <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                            )}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>

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
                            {formData.password.length > 0 && (
                                <p className={`text-sm mt-1 ${passwordStrength.color}`}>
                                    Password Strength: {passwordStrength.message}
                                </p>
                            )}
                            {errors.password && (
                                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                            )}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                id="terms" 
                                className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 bg-white bg-opacity-10"
                            />
                            <label htmlFor="terms" className="text-sm text-white text-opacity-70">
                                I agree to the{' '}
                                <button type="button" className="text-white hover:text-purple-300 transition-colors duration-300 underline">
                                    Terms & Conditions
                                </button>
                            </label>
                        </div>

                        <button
                            type="submit" 
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 backdrop-blur-lg border border-white/20"
                        >
                            <span className="relative z-10">Create Account</span>
                        </button>

                        <div className="relative flex items-center justify-center my-6">
                            <div className="border-t border-white/20 w-full"></div>
                            <span className="bg-transparent px-4 text-white/60 text-sm">or</span>
                            <div className="border-t border-white/20 w-full"></div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                className="w-full py-3 px-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white font-medium hover:bg-white/15 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Continue with Google</span>
                            </button>
                        </div>

                        <div className="text-center mt-6">
                            <p className="text-white/70">
                                Already have an account?{' '}
                                <Link to="/Login" className="text-white hover:text-purple-300 font-medium transition-colors duration-300">
                                    Login
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Signup;
