import React, { useState, useEffect } from 'react';
import AddClassPopup from '../popups/addClassPopup';
import EditClassPopup from '../popups/editClassPopup';
import RemovePopup from '../popups/removePopup'; // Import the RemovePopup
import { supabase } from '../../utils/supabaseClient';

const ClassComponent = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddClassPopup, setShowAddClassPopup] = useState(false);
    const [showEditClassPopup, setShowEditClassPopup] = useState(false);
    const [showRemovePopup, setShowRemovePopup] = useState(false); // State to show/hide the remove popup
    const [selectedClassroom, setSelectedClassroom] = useState(null); // Store selected classroom for editing or removing

    // Fetch classrooms from Supabase when the component mounts
    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('Locations') // Fetch from the Locations table
                    .select(`
                        id,
                        name,
                        capacity,
                        campus_id,
                        class_types,
                        Campuses ( name )
                    `); // Join with Campuses table to get the campus name

                if (error) {
                    console.error('Error fetching classrooms:', error);
                } else {
                    setClassrooms(data); // Store the classrooms data
                }
            } finally {
                setIsLoading(false); // Loading state ends
            }
        };

        fetchClassrooms();
    }, []);

    const addClassroom = (newClassroom) => {
        setClassrooms([...classrooms, newClassroom]); // Add new classroom to the list
    };

    const handleDeleteClassroom = async (classroomId) => {
        try {
            const { error } = await supabase
                .from('Locations')
                .delete()
                .eq('id', classroomId);

            if (error) {
                console.error('Error deleting classroom:', error);
            } else {
                setClassrooms(classrooms.filter((classroom) => classroom.id !== classroomId)); // Remove classroom from the list
            }
        } catch (error) {
            console.error('Error deleting classroom:', error);
        } finally {
            setShowRemovePopup(false); // Close the remove popup after deletion
        }
    };

    const handleEditClassroom = (classroom) => {
        setSelectedClassroom(classroom); // Store the selected classroom
        setShowEditClassPopup(true); // Show the edit popup
    };

    const handleRemoveClick = (classroom) => {
        setSelectedClassroom(classroom); // Store the selected classroom for removal
        setShowRemovePopup(true); // Show the remove popup
    };

    const updateClassroom = (updatedClassroom) => {
        setClassrooms(classrooms.map((classroom) => (classroom.id === updatedClassroom.id ? updatedClassroom : classroom)));
    };

    return (
        <div className="admin-section">
            {isLoading ? (
                <div className='courses-list'>
                    <div className='course-row'>
                        <p>Loading Classrooms</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="courses-list">
                        {classrooms.map((classroom, index) => (
                            <div key={index} className="course-row">
                                <div className="course-info">
                                    <div className="course-name">{classroom.name}</div>
                                    <div className='course-details'>
                                        <div className="course-code">
                                            {classroom.class_types.join(', ')}
                                        </div>
                                        <div className="course-code">{classroom.Campuses?.name}</div>
                                        <div className="course-code">Capacity: {classroom.capacity}</div>
                                    </div>
                                </div>
                                <div className="course-actions">
                                    <button className="more-options" onClick={() => handleEditClassroom(classroom)}>
                                        Edit
                                    </button>
                                    <button className="more-options" onClick={() => handleRemoveClick(classroom)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <br />

            <button className="more-options" type="button" onClick={() => setShowAddClassPopup(true)}>
                Add Classroom
            </button>

            {showAddClassPopup && (
                <AddClassPopup
                    onClose={() => setShowAddClassPopup(false)}
                    onSubmit={addClassroom}
                />
            )}

            {showEditClassPopup && selectedClassroom && (
                <EditClassPopup
                    classroom={selectedClassroom}
                    onClose={() => setShowEditClassPopup(false)}
                    onSubmit={updateClassroom}
                />
            )}

            {showRemovePopup && selectedClassroom && (
                <RemovePopup
                    onClose={() => setShowRemovePopup(false)}
                    onConfirm={() => handleDeleteClassroom(selectedClassroom.id)}
                />
            )}
        </div>
    );
};

export default ClassComponent;

