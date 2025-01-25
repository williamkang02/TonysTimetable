import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import '../../styles/popup.css';

const EditCoursePopup = ({ course, onClose, onSubmit }) => {
    const [name, setName] = useState(course.name);
    const [courseCode, setCourseCode] = useState(course.course_code);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (name.trim() !== '' && courseCode.trim() !== '') {
            try {
                // Update the course record
                const { data, error } = await supabase
                    .from('Courses')
                    .update({ name, course_code: courseCode })
                    .eq('id', course.id)
                    .select();

                if (error) {
                    console.error('Error updating course:', error);
                } else {
                    onSubmit(data[0]); // Send updated course data to parent component
                }
            } catch (error) {
                console.error('Error updating course:', error.message);
            }
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Edit Course</div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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

export default EditCoursePopup;
