import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import '../../styles/popup.css';

const EditCampusPopup = ({ campus, onClose, onSubmit }) => {
    const [name, setName] = useState(campus.name);
    const [venueName, setVenueName] = useState(campus.venue_name || ''); // Handle NULL values for venue_name

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (name.trim() !== '') {
            try {
                // Update the campus record
                const { data, error } = await supabase
                    .from('Campuses')
                    .update({ name, venue_name: venueName })
                    .eq('id', campus.id)
                    .select();

                if (error) {
                    console.error('Error updating campus:', error);
                } else {
                    onSubmit(data[0]); // Send updated campus data to parent component
                }
            } catch (error) {
                console.error('Error updating campus:', error.message);
            }
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Edit Campus</div>
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

export default EditCampusPopup;
