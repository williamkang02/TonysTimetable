import React, { useState, useEffect } from 'react';
import AddStudentPopup from '../popups/addStudentPopup';
import EditStudentPopup from '../popups/editStudentPopup';
import RemovePopup from '../popups/removePopup';
import ErrorPopup from '../popups/errorPopup';
import { supabase } from '../../utils/supabaseClient';
import { handleFileUpload } from '../../utils/csvFileHandle';
import '../../styles/adminPage.css';
import '../../styles/courseComponent.css';

/**
 * StudentComponent - A component to manage students. This includes displaying, adding, editing, and removing students.
 * The component also supports CSV uploads for bulk student data management.
 * @param {Object} filters - Object containing filter criteria for students.
 */
const StudentComponent = ({ filters }) => {
    // State hooks
    const [students, setStudents] = useState([]);                  // List of students
    const [isLoading, setIsLoading] = useState(true);              // Loading indicator
    const [courses, setCourses] = useState([]);                    // List of courses
    const [campuses, setCampuses] = useState([]);                  // List of campuses
    const [filtered_student, setFilteredStudent] = useState([]);   // Filtered list of students
    const [showStudentPopup, setShowStudentPopup] = useState(false); // Controls Add Student popup
    const [showEditStudentPopup, setShowEditStudentPopup] = useState(false); // Controls Edit Student popup
    const [showRemovePopup, setShowRemovePopup] = useState(false); // Controls Remove popup
    const [selectedStudent, setSelectedStudent] = useState(null);  // Currently selected student for edit or removal
    const [showErrorPopup, setShowErrorPopup] = useState(false);   // Controls Error popup
    const [errorMessages, setErrorMessages] = useState([]);        // List of error messages

    /**
     * useEffect - Fetches students, courses, and campuses from Supabase when the component mounts.
     */
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setIsLoading(true);

                // Fetch courses
                const { data: coursesData, error: coursesError } = await supabase
                    .from('Courses')
                    .select('*');
                if (coursesError) {
                    console.error('Error fetching courses:', coursesError);
                } else {
                    setCourses(coursesData);
                }

                // Fetch campuses
                const { data: campusesData, error: campusesError } = await supabase
                    .from('Campuses')
                    .select('*');
                if (campusesError) {
                    console.error('Error fetching campuses:', campusesError);
                } else {
                    setCampuses(campusesData);
                }

                // Fetch students
                const { data, error } = await supabase
                    .from('Students')
                    .select(`
                        id,
                        student_id,
                        name,
                        university_email,
                        course_id,
                        Courses (
                            name,
                            campus_id,
                            Campuses (
                                name
                            )
                        )
                    `);
                if (error) {
                    console.error('Error fetching students:', error);
                } else {
                    setStudents(data);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, []);

    /**
     * useEffect - Filters students based on selected filters.
     */
    useEffect(() => {
        const filtered_student = students.filter(student => {
            const matchesStudent = filters.courseId ? student.course_id === filters.courseId : true;
            return matchesStudent;
        });

        setFilteredStudent(filtered_student);
    }, [filters, students]);

    /**
     * addStudent - Adds a new student to the students state.
     * @param {Object} studentData - Data for the new student.
     */
    const addStudent = (studentData) => {
        setStudents(prevStudents => [...prevStudents, studentData]);
    };

    /**
     * updateStudentList - Updates a student's details in the students state.
     * @param {Object} updatedStudent - Updated student object.
     */
    const updateStudentList = (updatedStudent) => {
        setStudents((prevStudents) => 
            prevStudents.map((student) => 
                student.id === updatedStudent.id ? updatedStudent : student
            )
        );
    };

    /**
     * handleStudentsUpdated - Handles updates from CSV upload by adding or updating students in state.
     * @param {Object} student - Student data from the CSV file.
     */
    const handleStudentsUpdated = (student) => {
        setStudents(prevStudents => {
            const existingIndex = prevStudents.findIndex(s => s.student_id === student.student_id);
            if (existingIndex !== -1) {
                // Update existing student
                return prevStudents.map(s => (s.student_id === student.student_id ? student : s));
            } else {
                // Add new student
                return [...prevStudents, student];
            }
        });
    };

    /**
     * handleUploadButtonClick - Triggers the file input for CSV upload.
     */
    const handleUploadButtonClick = () => {
        document.getElementById('file-input').click();
    };

    /**
     * handleDeleteStudent - Deletes a student and related entries from the database.
     * @param {string} studentId - ID of the student to be deleted.
     */
    const handleDeleteStudent = async (studentId) => {
        try {
            // Delete from StudentSubject join table
            const { error: joinTableError } = await supabase
                .from('StudentSubject')
                .delete()
                .eq('student_id', studentId);   
            if (joinTableError) {
                console.error('Error deleting from join table:', joinTableError);
                return;
            }

            // Delete student
            const { error: studentError } = await supabase
                .from('Students')
                .delete()
                .eq('id', studentId);
            if (studentError) {
                console.error('Error deleting student:', studentError);
            } else {
                setStudents(students.filter((student) => student.id !== studentId));
            }
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    /**
     * Popup Handling Functions.
     */
    const handleEditStudent = (student) => {
        setSelectedStudent(student);
        setShowEditStudentPopup(true);
    };

    const closeErrorPopup = () => {
        setShowErrorPopup(false);
        setErrorMessages([]);
    };

    const handleConfirmRemove = async () => {
        if (selectedStudent) {
            await handleDeleteStudent(selectedStudent.id);
            setShowRemovePopup(false);
        }
    };

    const handleRemoveClick = (student) => {
        setSelectedStudent(student);
        setShowRemovePopup(true);
    };

    return (
        <div className="admin-section">
            {isLoading ? (
                <div className='courses-list'>   
                    <div className='course-row'>
                        <p>Loading Students</p>
                    </div>
                </div>
            ) : (
                <div className="courses-list">
                    {filtered_student.map((student, index) => (
                        <div key={index} className="course-row">
                            <div className="course-info">
                                <div className="course-name">{student.name}</div>
                                <div className='course-details'>
                                    <div className="course-code">{student.student_id}</div>
                                    <div className="course-code">{student.Courses?.name || 'No Course'}</div>
                                    <div className="course-code">{student.Courses?.Campuses?.name || 'No Campus'}</div>
                                </div>
                            </div>
                            <div className="student-actions">
                                <button className="more-options" onClick={() => handleEditStudent(student)}>Edit</button>
                                <button className="more-options" onClick={() => handleRemoveClick(student)}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <br />

            <button className='more-options' type="button" onClick={() => setShowStudentPopup(true)}>
                Add Student
            </button>

            <button className='more-options' type="button" onClick={handleUploadButtonClick}>
                Upload CSV
            </button>

            <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={(event) => handleFileUpload(event, setErrorMessages, setShowErrorPopup, handleStudentsUpdated)}
                style={{ display: 'none' }} 
            />

            {showStudentPopup && (
                <AddStudentPopup
                    onClose={() => setShowStudentPopup(false)}
                    onSubmit={addStudent}
                />
            )}

            {showEditStudentPopup && selectedStudent && (
                <EditStudentPopup
                    student={selectedStudent}
                    onClose={() => setShowEditStudentPopup(false)}
                    onSubmit={updateStudentList}
                />
            )}

            {showErrorPopup && (
                <ErrorPopup
                    errors={errorMessages}
                    onClose={closeErrorPopup}
                />
            )}

            {showRemovePopup && selectedStudent && (
                <RemovePopup
                    onClose={() => setShowRemovePopup(false)}
                    onConfirm={handleConfirmRemove}
                />
            )}
        </div>
    );
};

export default StudentComponent;
