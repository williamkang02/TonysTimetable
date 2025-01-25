import React, { useEffect } from 'react';
import '../../styles/popup.css';

const CourseSelectionPopup = ({ onClose }) => {
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
                <div className='popup-h2'>Course not selected</div>
                <div className="popup-message">
                    Select a course before exporting!
                </div>
                <div className="popup-buttons">
                    <button
                        type="button"
                        onClick={onClose}
                        className="confirm-button"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseSelectionPopup;