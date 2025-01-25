import '../../styles/forgotPasswordFormComponent.css'
import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const RecoveryComponent = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const navigateHome = () => navigate('/');
    
    // Updates Auth table on Database
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return; 
    }
    
        const { error } = await supabase.auth.updateUser({
        password: password,
        });
    
        if (error) {
        setError(error.message);
        setMessage('');
        } else {
        setMessage('Your password has been updated successfully.');
        setError('');
        setPassword(''); 
        setConfirmPassword('');
        }
    };

    return (
        <div className="forgot-password-container">
            <div className='forgot-password-border'>
                <div className="forgot-password-form">
                    <div className="box-icon-container" onClick={navigateHome}>
                        <box-icon name='left-arrow-alt' color='#e87070' size='md'></box-icon>
                    </div>
                    <form onSubmit={handlePasswordUpdate}>
                        <h1>Reset Your Password</h1>
                        <div className='recovery-requirements'>
                            <p>Password Requirements:<br /><br /></p>
                            <ul>
                                <li>At least 6 characters</li>
                                <li>Both lowercase and uppercase letters</li>
                                <li>At least 1 symbol and 1 number</li>
                            </ul>
                        </div>

                        <hr className='custom-line'/>

                        <label>New Password: </label>
                        <input 
                            type="password" 
                            value={password}
                            placeholder="Enter Password" 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />

                        <label>Confirm New Password: </label>
                        <input 
                            type="password" 
                            placeholder="Enter Password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required 
                        />

                        <button type="submit" id="forgotResetButton">
                            Update Password
                        </button>
                        {message && <p className='recovery-message'>{message}</p>}
                        {error && <p className='recovery-error'>{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RecoveryComponent;