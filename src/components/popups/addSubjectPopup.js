import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { MultiSelect } from 'primereact/multiselect'; // Ensure PrimeReact is installed
import '../../styles/popup.css';

const AddSubjectPopup = ({ onClose, onSubmit }) => {
    const [subjectName, setSubjectName] = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [courses, setCourses] = useState([]); // To store the fetched courses
    const [campuses, setCampuses] = useState([]); // To store the fetched campuses
    const [selectedCourses, setSelectedCourses] = useState([]); // To store the selected courses

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
    
    useEffect(() => {
        const fetchCampuses = async () => {
            try {
                const { data: campusesData, error: campusesError } = await supabase
                    .from('Campuses')
                    .select('id, name'); // Fetch campus id and name

                if (campusesError) {
                    console.error('Error fetching campuses:', campusesError);
                } else {
                    setCampuses(campusesData); // Store campuses in state
                    fetchCourses(campusesData); // After fetching campuses, fetch courses
                }
            } catch (error) {
                console.error('Error while fetching campuses:', error);
            }
        };

        const fetchCourses = async (campuses) => {
            try {
                const { data: coursesData, error: coursesError } = await supabase
                    .from('Courses')
                    .select('id, name, campus_id'); // Fetch course id, name, and campus_id (foreign key)

                if (coursesError) {
                    console.error('Error fetching courses:', coursesError);
                } else {
                    const mappedCourses = coursesData.map((course) => {
                        const campusName = campuses.find((campus) => campus.id === course.campus_id)?.name || 'Unknown Campus';
                        return {
                            id: course.id,
                            name: `${course.name} - ${campusName}`, // Combine course name with campus name
                        };
                    });
                    setCourses(mappedCourses); // Set courses in state
                }
            } catch (error) {
                console.error('Error while fetching courses:', error);
            }
        };

        fetchCampuses(); // Fetch campuses first, then courses
    }, []);

    const insertSubjectToSupabase = async (subjectName, subjectCode, selectedCourses) => {
        try {
            const subjectEntries = selectedCourses.map((courseId) => ({
                name: subjectName,
                code: subjectCode,
                course_id: courseId, // Associate the subject with the course
            }));

            const { data, error } = await supabase
                .from('Subjects')
                .insert(subjectEntries)
                .select();

            if (error) {
                console.error('Error inserting subject:', error);
            } else {
                console.log('Subjects added:', data);
            }
        } catch (error) {
            console.error('Error inserting subject to Supabase:', error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (subjectName.trim() !== '' && subjectCode.trim() !== '' && selectedCourses.length > 0) {
            await insertSubjectToSupabase(subjectName, subjectCode, selectedCourses);
            onSubmit(subjectName);
            setSubjectName('');
            setSubjectCode('');
            setSelectedCourses([]);
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Add New Unit</div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Unit Name:
                        <input
                            type="text"
                            value={subjectName}
                            onChange={(e) => setSubjectName(e.target.value)}
                            required
                            placeholder="Enter Unit Name"
                        />
                    </label>

                    <label>
                        Unit Code:
                        <input
                            type="text"
                            value={subjectCode}
                            onChange={(e) => setSubjectCode(e.target.value)}
                            required
                            placeholder="Enter Unit Code"
                        />
                    </label>

                    <label>
                        Select Courses:
                        <MultiSelect
                            value={selectedCourses} // Should be an array of course IDs
                            options={courses.map((course) => ({
                                id: course.id,
                                name: course.name, // Display course name and campus
                            }))}
                            onChange={(e) => setSelectedCourses(e.value)} // Update the selected courses state
                            optionLabel="name"
                            optionValue="id" // Ensure the value matches course.id
                            placeholder="Select courses"
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

export default AddSubjectPopup;

