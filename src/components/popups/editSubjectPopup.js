import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import '../../styles/popup.css';

const EditSubjectPopup = ({ subject, onClose, onSubmit }) => {
    const [subjectName, setSubjectName] = useState(subject.name);
    const [subjectCode, setSubjectCode] = useState(subject.code);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(subject.course_id); 

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

    // Fetch courses and their related campuses
    useEffect(() => {
        const fetchCoursesAndCampuses = async () => {
            const { data, error } = await supabase
                .from('Courses')
                .select(`
                    id,
                    name,
                    campus_id,
                    Campuses ( name )
                `); // Fetch course name, campus ID, and the associated campus name

            if (error) {
                console.error('Error fetching courses and campuses:', error);
            } else {
                setCourses(data);
            }
        };

        fetchCoursesAndCampuses();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (subjectName.trim() !== '' && subjectCode.trim() !== '' && selectedCourse !== '') {
            try {
                const { data, error } = await supabase
                    .from('Subjects')
                    .update({
                        name: subjectName,
                        code: subjectCode,
                        course_id: selectedCourse,
                    })
                    .eq('id', subject.id) 
                    .select();

                if (error) {
                    console.error('Error updating subject: ', error);
                } else {
                    console.log('Subject updated: ', data);
                    onSubmit(data[0]); 
                }
            } catch (error) {
                console.error('Error updating subject in Supabase:', error.message);
            }
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Edit Unit</div>
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
                        Select Course:
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            required
                        >
                            <option value="" disabled hidden className="placeholder-option">Select a Course</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.name} - {course.Campuses.name} {/* Display course-campus */}
                                </option>
                            ))}
                        </select>
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

export default EditSubjectPopup;
