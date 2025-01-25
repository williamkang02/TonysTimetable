import React, { useEffect } from 'react';
import '../../styles/popup.css';

const GenerateTimetablePopup = ({ onClose, onConfirm }) => {

    // Event listener to handle "Escape" key press to close popup
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Are you sure?</div>
                <div className="popup-message">
                    The current timetable will be overwritten and cannot be recovered! 
                </div>
                <div className="popup-buttons">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="confirm-button"
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cancel-button"
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateTimetablePopup;
