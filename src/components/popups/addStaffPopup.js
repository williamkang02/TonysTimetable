import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import '../../styles/popup.css';

const AddStaffPopup = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (name.trim() !== '' && email.trim() !== '') {
            try {
                const { data, error } = await supabase
                    .from('Staff')
                    .insert([{ name, university_email: email }])
                    .select();

                if (error) {
                    console.error('Error adding staff:', error);
                } else {
                    onSubmit(data[0]); // Send the new staff data to StaffComponent
                }
            } catch (error) {
                console.error('Error adding staff:', error.message);
            }
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Add Staff</div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Enter Staff Name"
                        />
                    </label>

                    <label>
                        Email:
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter Staff Email"
                        />
                    </label>

                    <div className="popup-buttons">
                        <button type="submit">Submit</button>
                        <button type="button" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStaffPopup;
