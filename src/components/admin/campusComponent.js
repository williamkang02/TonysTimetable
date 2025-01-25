import React, { useState, useEffect } from 'react';
import AddCampusPopup from '../popups/addCampusPopup'; // Popup for adding campuses
import EditCampusPopup from '../popups/editCampusPopup'; // Popup for editing campuses
import RemovePopup from '../popups/removePopup'; // Import the RemovePopup
import { supabase } from '../../utils/supabaseClient';
import '../../styles/adminPage.css';

const CampusComponent = () => {
    const [campuses, setCampuses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddCampusPopup, setShowAddCampusPopup] = useState(false);
    const [showEditCampusPopup, setShowEditCampusPopup] = useState(false);
    const [selectedCampus, setSelectedCampus] = useState(null);
    const [showRemovePopup, setShowRemovePopup] = useState(false); // State for RemovePopup
    const [campusToDelete, setCampusToDelete] = useState(null); // Campus ID to delete

    // Fetch campuses from Supabase when the component mounts
    useEffect(() => {
        const fetchCampuses = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('Campuses')
                    .select('*');

                if (error) {
                    console.error('Error fetching campuses:', error);
                } else {
                    setCampuses(data); // Store the campuses data
                }
            } finally {
                setIsLoading(false); // Loading state ends
            }
        };

        fetchCampuses();
    }, []);

    const addCampus = (newCampus) => {
        setCampuses([...campuses, newCampus]); // Add new campus to the list
    };

    const handleDeleteCampus = (campusId) => {
        setCampusToDelete(campusId); // Set the campus ID to delete
        setShowRemovePopup(true); // Show the remove confirmation popup
    };

    const confirmDeleteCampus = async (campusId) => {
        try {
            // Step 1: Remove any courses associated with this campus
            const { error: coursesError } = await supabase
                .from('Courses')
                .delete()
                .eq('campus_id', campusId); // Delete courses where campus_id matches

            if (coursesError) {
                console.error('Error deleting courses related to campus:', coursesError);
                return; // Exit if there's an error in removing the related courses
            }

            // Step 2: Delete the campus record
            const { error: deleteError } = await supabase
                .from('Campuses')
                .delete()
                .eq('id', campusId);

            if (deleteError) {
                console.error('Error deleting campus:', deleteError);
            } else {
                setCampuses(campuses.filter((campus) => campus.id !== campusId)); // Remove campus from the list
            }
        } catch (error) {
            console.error('Error deleting campus:', error);
        } finally {
            setShowRemovePopup(false); // Close the remove popup
            setCampusToDelete(null); // Reset campus to delete
        }
    };

    const handleEditCampus = (campus) => {
        setSelectedCampus(campus); // Store the selected campus
        setShowEditCampusPopup(true); // Show the edit popup
    };

    const updateCampus = (updatedCampus) => {
        setCampuses(campuses.map((campus) => (campus.id === updatedCampus.id ? updatedCampus : campus)));
    };

    return (
        <div className="admin-section">
            {isLoading ? (
                <div className='courses-list'>   
                    <div className='course-row'>
                        <p>Loading Campuses</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="courses-list">
                        {campuses.map((campus, index) => (
                            <div key={index} className="course-row">
                                <div className="course-info">
                                    <div className="course-name">{campus.name}</div>
                                    <div className="course-code">{campus.venue_name || 'No Venue'}</div> {/* Display venue name or 'No Venue' */}
                                </div>
                                <div className="course-actions">
                                    <button className="more-options" onClick={() => handleEditCampus(campus)}>
                                        Edit
                                    </button>
                                    <button className="more-options" onClick={() => handleDeleteCampus(campus.id)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <br />

            <button className="more-options" type="button" onClick={() => setShowAddCampusPopup(true)}>
                Add Campus
            </button>

            {showAddCampusPopup && (
                <AddCampusPopup
                    onClose={() => setShowAddCampusPopup(false)}
                    onSubmit={addCampus}
                />
            )}

            {showEditCampusPopup && selectedCampus && (
                <EditCampusPopup
                    campus={selectedCampus}
                    onClose={() => setShowEditCampusPopup(false)}
                    onSubmit={updateCampus}
                />
            )}

            {showRemovePopup && (
                <RemovePopup
                    onClose={() => setShowRemovePopup(false)}
                    onConfirm={() => confirmDeleteCampus(campusToDelete)} // Pass the ID directly
                />
            )}
        </div>
    );
};

export default CampusComponent;
