import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { MultiSelect } from 'primereact/multiselect';
import '../../styles/popup.css';

const EditStudentPopup = ({ student, onClose, onSubmit }) => {
    const [name, setName] = useState(student.name);
    const [email, setEmail] = useState(student.university_email);
    const [selectedCourse, setSelectedCourse] = useState(student.course_id);
    const [studentId, setStudentId] = useState(student.student_id);
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);

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

    // Fetch courses when the component mounts
    useEffect(() => {
        const fetchCoursesAndCampuses = async () => {
            const { data, error } = await supabase
                .from('Courses')
                .select(`
                    id,
                    name,
                    campus_id,
                    Campuses ( name )
                `);

            if (error) {
                console.error('Error fetching courses and campuses:', error);
            } else {
                console.log('Fetched courses:', data); // Log the fetched courses data
                setCourses(data || []);
            }
        };

        fetchCoursesAndCampuses();
    }, []);

    // Fetch subjects based on the selected course and course changes
    useEffect(() => {
        const fetchSubjects = async () => {
            if (selectedCourse) {
                console.log('Selected course ID:', selectedCourse); // Log selected course ID
                const { data, error } = await supabase
                    .from('Subjects')
                    .select('*')
                    .eq('course_id', selectedCourse);

                if (error) {
                    console.error('Error fetching subjects:', error);
                } else {
                    console.log('Fetched subjects for course:', data); // Log the fetched subjects
                    if (data.length > 0) {
                        setSubjects(data);
                    } else {
                        console.log('No subjects found for the selected course');
                        setSubjects([]); // Clear subjects if none found
                    }
                }
            }
        };

        // Fetch subjects when the component mounts and when selectedCourse changes
        fetchSubjects();
    }, [selectedCourse]);

    // Pre-fill the subjects the student is already enrolled in when the component mounts
    useEffect(() => {
        const fetchStudentSubjects = async () => {
            const { data: studentSubjectsData, error: studentSubjectsError } = await supabase
                .from('StudentSubject')
                .select('subject_id')
                .eq('student_id', student.id);

            if (studentSubjectsError) {
                console.error('Error fetching student subjects:', studentSubjectsError);
            } else {
                console.log('Fetched student subjects:', studentSubjectsData); // Log student subjects
                const prefilledSubjects = studentSubjectsData.map((ss) => ss.subject_id);
                setSelectedSubjects(prefilledSubjects);
            }
        };

        // Fetch the student's currently enrolled subjects
        fetchStudentSubjects();
    }, [student.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Ensure the student ID is valid (4 digits)
        if (!/^\d{4}$/.test(studentId)) {
            alert('Please enter a valid 4-digit Student ID.');
            return;
        }

        if (name.trim() !== '' && email.trim() !== '' && selectedCourse !== '' && selectedSubjects.length > 0) {
            try {
                // Step 1: Update the student's basic info including the student ID
                const { data, error } = await supabase
                    .from('Students')
                    .update({ name, university_email: email, course_id: selectedCourse, student_id: studentId })
                    .eq('id', student.id)
                    .select();

                if (error) {
                    console.error('Error updating student:', error);
                } else {
                    console.log('Student updated:', data);

                    // Step 2: Delete the existing subjects from StudentSubject
                    const { error: deleteError } = await supabase
                        .from('StudentSubject')
                        .delete()
                        .eq('student_id', student.id);

                    if (deleteError) {
                        console.error('Error deleting student subjects:', deleteError);
                    } else {
                        // Step 3: Insert the updated subjects into StudentSubject
                        const subjectEntries = selectedSubjects.map((subjectId) => ({
                            student_id: student.id,
                            subject_id: subjectId,
                        }));

                        const { error: insertError } = await supabase
                            .from('StudentSubject')
                            .insert(subjectEntries);

                        if (insertError) {
                            console.error('Error inserting student subjects:', insertError);
                        } else {
                            console.log('Student subjects updated successfully');
                            onSubmit(data[0]);
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating student:', error.message);
            }
            onClose();
        }
    };

    // Handle course change and clear the subjects
    const handleCourseChange = (e) => {
        setSelectedCourse(e.target.value);
        setSelectedSubjects([]); // Clear selected subjects when course changes
        setSubjects([]); // Clear subjects to prevent stale data
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Edit Student</div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Enter Student Name"
                        />
                    </label>

                    <label>
                        Email:
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter Student Email"
                        />
                    </label>

                    <label>
                        Student ID:
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            required
                            placeholder="Enter 4-digit Student ID"
                            maxLength={4}
                            pattern="\d{4}"
                            title="Please enter exactly 4 digits"
                        />
                    </label>

                    <label>
                        Course:
                        <select
                            value={selectedCourse}
                            onChange={handleCourseChange} // Handle course change
                            required
                        >
                            <option value="" disabled hidden className="placeholder-option">Select a Course</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.name} - {course.Campuses?.name} {/* course-campus format */}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Select Subjects:
                        <MultiSelect
                            value={selectedSubjects}
                            options={subjects.map((subject) => ({
                                id: subject.id,
                                name: subject.name || 'Unnamed Subject',
                            }))}
                            onChange={(e) => setSelectedSubjects(e.value)}
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select subjects"
                            display="chip"
                            filter
                            className="multiselect-custom"
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

export default EditStudentPopup;

