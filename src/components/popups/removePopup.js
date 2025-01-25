import React, { useEffect } from 'react';
import '../../styles/popup.css';

const RemovePopup = ({ onClose, onConfirm }) => {

    // Add an event listener to handle "Escape" key press to close the popup
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
                <div className='popup-h2'>Are you sure</div>
                <div className="popup-message">
                    Do you want to remove this entry. <br />All related data will also be removed.
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

export default RemovePopup;
