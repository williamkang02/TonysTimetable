import React, { useState, useEffect } from 'react';
import AddStaffPopup from '../popups/addStaffPopup';
import EditStaffPopup from '../popups/editStaffPopup';
import RemovePopup from '../popups/removePopup'; // Import the RemovePopup component
import { supabase } from '../../utils/supabaseClient';
import '../../styles/adminPage.css';

const StaffComponent = () => {
    const [staff, setStaff] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddStaffPopup, setShowAddStaffPopup] = useState(false);
    const [showEditStaffPopup, setShowEditStaffPopup] = useState(false);
    const [showRemovePopup, setShowRemovePopup] = useState(false); // State for showing the remove popup
    const [selectedStaff, setSelectedStaff] = useState(null); // Store selected staff for editing or removing

    // Fetch staff from Supabase when the component mounts
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('Staff')
                    .select('*');

                if (error) {
                    console.error('Error fetching staff:', error);
                } else {
                    setStaff(data); // Store the staff data
                }
            } finally {
                setIsLoading(false); // Loading state ends
            }
        };

        fetchStaff();
    }, []);

    // Adds staff to state
    const addStaff = (newStaff) => {
        setStaff([...staff, newStaff]); // Add new staff to the list
    };

    // Handles staff removal from database
    const handleDeleteStaff = async (staffId) => {
        try {
            // Step 1: Nullify the staff_id in the Classes table where the staff member is referenced
            const { error: nullifyError } = await supabase
                .from('Classes')
                .update({ staff_id: null }) // Nullify staff_id in Classes table
                .eq('staff_id', staffId);   // Where the staff_id matches the staff being deleted

            if (nullifyError) {
                console.error('Error nullifying staff_id in Classes table:', nullifyError);
                return; // Exit if there is an error
            }

            // Step 2: Delete the staff record
            const { error: deleteError } = await supabase
                .from('Staff')
                .delete()
                .eq('id', staffId);

            if (deleteError) {
                console.error('Error deleting staff:', deleteError);
            } else {
                setStaff(staff.filter((member) => member.id !== staffId)); // Remove staff from the list
            }
        } catch (error) {
            console.error('Error deleting staff:', error);
        } finally {
            setShowRemovePopup(false); // Close the remove popup after deletion
        }
    };

    // Popup Handling
    const handleEditStaff = (staff) => {
        setSelectedStaff(staff); // Store the selected staff
        setShowEditStaffPopup(true); // Show the edit popup
    };

    const handleRemoveClick = (staff) => {
        setSelectedStaff(staff); // Store the selected staff for removal
        setShowRemovePopup(true); // Show the remove popup
    };

    const updateStaff = (updatedStaff) => {
        setStaff(staff.map((member) => (member.id === updatedStaff.id ? updatedStaff : member)));
    };

    return (
        <div className="admin-section">
            {isLoading ? (
                <div className='courses-list'>   
                    <div className='course-row'>
                        <p>Loading Staff</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="courses-list">
                        {staff.map((member, index) => (
                            <div key={index} className="course-row">
                                <div className="course-info">
                                    <div className="course-name">{member.name}</div>
                                    <div className='course-details'>
                                        <div className="course-code">{member.university_email}</div>
                                    </div>
                                </div>
                                <div className="course-actions">
                                    <button className="more-options" onClick={() => handleEditStaff(member)}>
                                        Edit
                                    </button>
                                    <button className="more-options" onClick={() => handleRemoveClick(member)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <br />

            <button className="more-options" type="button" onClick={() => setShowAddStaffPopup(true)}>
                Add Staff
            </button>

            {showAddStaffPopup && (
                <AddStaffPopup
                    onClose={() => setShowAddStaffPopup(false)}
                    onSubmit={addStaff}
                />
            )}

            {showEditStaffPopup && selectedStaff && (
                <EditStaffPopup
                    staff={selectedStaff}
                    onClose={() => setShowEditStaffPopup(false)}
                    onSubmit={updateStaff}
                />
            )}

            {showRemovePopup && selectedStaff && (
                <RemovePopup
                    onClose={() => setShowRemovePopup(false)}
                    onConfirm={() => handleDeleteStaff(selectedStaff.id)}
                />
            )}
        </div>
    );
};

export default StaffComponent;

