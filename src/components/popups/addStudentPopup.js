import React, { useState, useEffect } from 'react';
import { MultiSelect } from 'primereact/multiselect'; // Import PrimeReact MultiSelect
import { supabase } from '../../utils/supabaseClient';
import '../../styles/popup.css';
import 'primereact/resources/themes/saga-blue/theme.css'; // Import the PrimeReact theme
import 'primereact/resources/primereact.min.css';         // Core CSS for PrimeReact components
import 'primeicons/primeicons.css';       

const AddStudentPopup = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [studentId, setStudentId] = useState(''); // New state for student ID
    const [selectedCourse, setSelectedCourse] = useState('');
    const [courses, setCourses] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]); // Now optional
    const [subjects, setSubjects] = useState([]);

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

    // Fetch the courses and campuses from the database
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
                setCourses(data || []);
            }
        };

        fetchCoursesAndCampuses();
    }, []);

    // Fetch subjects when a course is selected
    useEffect(() => {
        const fetchSubjects = async () => {
            if (selectedCourse) {
                const { data, error } = await supabase
                    .from('Subjects')
                    .select('*')
                    .eq('course_id', selectedCourse);

                if (error) {
                    console.error('Error fetching subjects:', error);
                } else {
                    setSubjects(data || []);
                }
            }
        };

        fetchSubjects();
    }, [selectedCourse]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Ensure that the studentId is a 4-digit number
        if (!/^\d{4}$/.test(studentId)) {
            alert('Please enter a valid 4-digit student ID.');
            return;
        }

        if (name.trim() !== '' && email.trim() !== '' && selectedCourse !== '') {
            try {
                const { data: studentData, error: studentError } = await supabase
                    .from('Students')
                    .insert([{ student_id: studentId, name, university_email: email, course_id: selectedCourse }])
                    .select();

                if (studentError) {
                    console.error('Error adding student:', studentError);
                } else {
                    const studentId = studentData[0]?.id;

                    // Insert multiple records into StudentSubject table only if there are selected subjects
                    if (selectedSubjects.length > 0) {
                        const studentSubjectEntries = selectedSubjects.map(subject => ({
                            student_id: studentId,
                            subject_id: subject.id 
                        }));

                        const { error: studentSubjectError } = await supabase
                            .from('StudentSubject')
                            .insert(studentSubjectEntries);

                        if (studentSubjectError) {
                            console.error('Error adding student-subject relations:', studentSubjectError);
                        }
                    }

                    console.log('Student added (with or without subjects):', studentData);

                    // Pass the new student data back to the parent component to update the state
                    onSubmit(studentData[0]); 
                }
            } catch (error) {
                console.error('Error adding student:', error.message);
            }
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Add New Student</div>
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
                        Select Course:
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            required
                        >
                            <option disabled hidden value="">Select a course</option>
                            {courses?.map((course) => (
                                <option key={course?.id} value={course?.id}>
                                    {course?.name} - {course?.Campuses?.name} {/* Display course-campus */}
                                </option>
                            ))}
                        </select>
                    </label>

                    {selectedCourse && (
                        <label>
                            Select Subjects:
                            <MultiSelect
                                value={selectedSubjects}
                                options={subjects.map(subject => ({
                                    id: subject.id,
                                    name: subject.name || 'Unnamed Subject'
                                }))}
                                onChange={(e) => setSelectedSubjects(e.value)}
                                optionLabel="name"  
                                placeholder="Select subjects"
                                display="chip"
                                filter
                                className="multiselect-custom" 
                            />
                        </label>
                    )}

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

export default AddStudentPopup;
