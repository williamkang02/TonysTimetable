import '../../styles/forgotPasswordFormComponent.css'
import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordFormComponent = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const navigateHome = () => navigate('/');

    const handlePasswordReset = async (e) => {
        e.preventDefault();

        const redirectUrl = `${window.location.origin}/resetpassword`;

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl 
        });

        if (error) {
            setError(error.message);
            setMessage('');
        } else {
            setMessage('Password reset email has been sent.');
            setError('');
            setEmail('');
        }
    };

    return (
        <div className="forgot-password-container">
            <div className='forgot-password-border'>
                <div className="forgot-password-form">
                    <div className="box-icon-container" onClick={navigateHome}>
                        <box-icon name='left-arrow-alt' color='#e87070' size='md'></box-icon>
                    </div>
                    <form onSubmit={handlePasswordReset}>
                        <h1>Reset Your Password</h1>
                        <div className='recovery-requirements'>
                            Enter your email address and we will send you a link to reset your account.
                        </div>

                        <hr className='custom-line'/>

                        <label>Email Address: </label>
                        <input 
                            type="email" 
                            placeholder="Enter VIT Email Address" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />

                        <button type="submit" id="forgotResetButton">
                            Reset Password
                        </button>
                        {message && <p className='recovery-message'>{message}</p>}
                        {error && <p className='recovery-error'>{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordFormComponent;
