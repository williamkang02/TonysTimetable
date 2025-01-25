import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import '../../styles/popup.css';

const AddCampusPopup = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [venueName, setVenueName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (name.trim() !== '') {
            try {
                // Insert new campus record
                const { data, error } = await supabase
                    .from('Campuses')
                    .insert({ name, venue_name: venueName || null }) // Set venue_name to NULL if not provided
                    .select();

                if (error) {
                    console.error('Error adding campus:', error);
                } else {
                    onSubmit(data[0]); // Send the new campus data to the parent component
                }
            } catch (error) {
                console.error('Error adding campus:', error.message);
            }
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Add Campus</div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Enter Campus Name"
                        />
                    </label>

                    <label>
                        Venue Name:
                        <input
                            type="text"
                            value={venueName}
                            onChange={(e) => setVenueName(e.target.value)}
                            placeholder="Enter Venue Name (optional)"
                        />
                    </label>

                    <div className="popup-buttons">
                        <button type="submit">Save</button>
                        <button type="button" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCampusPopup;
