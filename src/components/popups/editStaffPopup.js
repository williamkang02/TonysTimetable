import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import '../../styles/popup.css';

const EditStaffPopup = ({ staff, onClose, onSubmit }) => {
    const [name, setName] = useState(staff.name);
    const [email, setEmail] = useState(staff.university_email);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (name.trim() !== '' && email.trim() !== '') {
            try {
                const { data, error } = await supabase
                    .from('Staff')
                    .update({ name, university_email: email })
                    .eq('id', staff.id)
                    .select();

                if (error) {
                    console.error('Error updating staff:', error);
                } else {
                    onSubmit(data[0]); // Send updated staff data to StaffComponent
                }
            } catch (error) {
                console.error('Error updating staff:', error.message);
            }
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Edit Staff</div>
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

export default EditStaffPopup;
