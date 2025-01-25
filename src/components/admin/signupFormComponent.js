import '../../styles/signupFormComponent.css';
import 'boxicons'
import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import VITLogo from '../../assets/VITLogo.png'

const SignupFormComponent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        
        // Check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        // Call Supabase signUp function
        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccessMessage("Signup successful! Check your email for verification.");
            setError(null); // Clear error if signup is successful
        }
    };

    return (
        <div className="signup-form-container">

            <div className='signup-logo-border'>
                <div className="signup-form">
                    <form onSubmit={handleSignup}>
                        <h1>Create Your Account</h1>

                        {error && <p className="error-message">{error}</p>}
                        {successMessage && <p className="success-message">{successMessage}</p>}

                        <label>Email:</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            placeholder='Enter VIT Email'
                        />

                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter Password"
                        />

                        <label>Confirm Password:</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Enter Password"
                        />
        
                        <p className="signup-agreement">
                            By clicking Join now, you agree to VIT's User agreement, Privacy Policy, and Cookie Policy
                        </p>

                        <button type="submit" className="signup-button">
                            CREATE ACCOUNT
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignupFormComponent;
