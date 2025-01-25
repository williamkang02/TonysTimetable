import '../../styles/loginFormComponent.css';
import VITLogo from '../../assets/VITLogo.png';
import { Link } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const LoginFormComponent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    // Load remembered email when component mounts
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // Remember email if "Remember me" is checked
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (error) {
            alert(error.message); // Display error message in default popup
        } else {
            navigate('/admin');
        }
    };

    return (
        <div className="login-form-container">
            <div className="login-logo-border grid-cols-3 gap-1">
                <form onSubmit={handleLogin} className="login-form">
                    <h1>Welcome!</h1>
                    <label>Email Address: </label>
                    <input
                        type="email"
                        value={email}
                        placeholder="Enter VIT Email"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label>Password: </label>
                    <input
                        type="password"
                        value={password}
                        placeholder="Enter Password"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="forgot-remember">
                        <div className="remember-container">
                            <input 
                                type="checkbox" 
                                id="remember-me"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember-me"> Remember me</label>
                        </div>
                        <Link to="/forgot-password">
                            {"Forgot Password?"}
                        </Link>
                    </div>
                    <button type="submit">SIGN IN</button>
                </form>  
                <div className="login-hero-image">
                    <img src={VITLogo} alt="VIT Logo" />
                </div>
            </div>
        </div>
    );
};

export default LoginFormComponent;
