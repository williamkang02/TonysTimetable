// MFA Function disabled for now.

import '../styles/mfa.css'
import React, { useState } from 'react';
import {QRCodeCanvas} from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
// import { generateSecret, verifyToken } from './mfa'; 

function MFAComponent() {
  const [secret, setSecret] = useState(null);
  const [token, setToken] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

//Simulation (Replace with backend code)
  const generateSecret = () => {
    return {
      otpauth_url: 'otpauth://totp/YourAppName?secret=YOUR_SECRET_KEY&issuer=YourApp',
      base32: 'YOUR_SECRET_KEY',
    };
  };
  const verifyToken = (secret, token) => {
    return token === '123456'; 
  };


  const handleGenerateSecret = () => {
    const secretData = generateSecret();
    setSecret(secretData);
  };


  const handleVerifyToken = () => {
    const isValid = verifyToken(secret.base32, token);
    // setIsVerified(isValid);
    if (isValid){
      setIsVerified(isValid);
      navigate('/timetable');
    } else{
      setError('Token verification failed')
    }
  };

  return (
    <div>
      <h2>Set up Google Authenticator MFA</h2>
      {!secret && (
        <button onClick={handleGenerateSecret}>
          Generate MFA Secret
        </button>
      )}

      {secret && (
        <div>
          <p>Scan the QR code with your Google Authenticator app:</p>
          <QRCodeCanvas value={secret.otpauth_url} />
          <p>Or enter this secret manually: {secret.base32} </p> 

          <div>
            <label htmlFor="token">Enter Token:</label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button onClick={handleVerifyToken}>Verify Token</button>
          </div>

          {isVerified && <p>Token verified successfully!</p>}
          {!isVerified && token && <p>Token verification failed.</p>}
        </div>
      )}
    </div>
  );
}

export default MFAComponent;
