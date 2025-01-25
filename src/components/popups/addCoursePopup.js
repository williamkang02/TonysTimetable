import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { MultiSelect } from 'primereact/multiselect';
import '../../styles/popup.css';

const AddCoursePopup = ({ onClose, onSubmit }) => {
    const [courseName, setCourseName] = useState('');
    const [courseCode, setCourseCode] = useState(''); // New state for course code
    const [campuses, setCampuses] = useState([]); 
    const [selectedCampuses, setSelectedCampuses] = useState([]); 

    // Add an event listener to handle "Escape" key press
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

    // Fetch campuses from Supabase
    useEffect(() => {
        const fetchCampuses = async () => {
            const { data, error } = await supabase
                .from('Campuses')
                .select('*'); 

            if (error) {
                console.error('Error fetching campuses: ', error);
            } else {
                setCampuses(data); 
            }
        };

        fetchCampuses();
    }, []);

    // Insert course into Supabase
    const insertCourseToSupabase = async (courseName, courseCode, campusIds) => {
        try {
            const courseEntries = campusIds.map((campusId) => ({
                name: courseName,
                course_code: courseCode, // Insert the course code
                campus_id: campusId, 
            }));

            const { data, error } = await supabase
                .from('Courses')
                .insert(courseEntries)
                .select();

            if (error) {
                console.error('Error inserting course: ', error);
            } else {
                console.log('Courses added: ', data);
            }
        } catch (error) {
            console.error('Error inserting course to Supabase: ', error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (courseName.trim() !== '' && courseCode.trim() !== '' && selectedCampuses.length > 0) {
            await insertCourseToSupabase(courseName, courseCode, selectedCampuses);
            onSubmit(courseName); // Call the parent onSubmit with the course name
            setCourseName(''); // Reset course name
            setCourseCode(''); // Reset course code
            setSelectedCampuses([]); // Reset selected campuses
            onClose(); // Close the popup
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Add a New Course</div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Course Name:
                        <input
                            type="text"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            required
                            placeholder="Enter Course Name"
                        />
                    </label>

                    <label>
                        Course Code:
                        <input
                            type="text"
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value)}
                            required
                            placeholder="Enter Course Code"
                        />
                    </label>

                    <label>
                        Select Campuses:
                        <MultiSelect
                            value={selectedCampuses}
                            options={campuses.map((campus) => ({
                                id: campus.id,
                                name: campus.name,
                            }))}
                            onChange={(e) => setSelectedCampuses(e.value)} 
                            optionLabel="name" 
                            optionValue="id"
                            placeholder="Select Campuses"
                            display="chip"
                            filter
                            className="multiselect-custom"
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

export default AddCoursePopup;


