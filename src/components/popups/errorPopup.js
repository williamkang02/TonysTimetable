import React from 'react';
import '../../styles/popup.css';

const ErrorPopup = ({ errors, onClose }) => {
    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Upload Errors</div>
                <ul>
                    {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
                <div className="popup-buttons">
                    <button type="button" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorPopup;