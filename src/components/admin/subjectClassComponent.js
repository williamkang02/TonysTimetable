import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import EditSubjectClassPopup from '../popups/editSubjectClassPopup'; // Import the new popup
import '../../styles/adminPage.css';

const SubjectListComponent = () => {
    const [courses, setCourses] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showEditPopup, setShowEditPopup] = useState(false);

    // Fetch subject classes from Supabase when the component mounts
    useEffect(() => {
        const fetchData = async () => {
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

                // Fetch subjects
                const { data: subjectsData, error: subjectsError } = await supabase
                    .from('Subjects')
                    .select('*');

                if (subjectsError) {
                    console.error('Error fetching subjects:', subjectsError);
                } else {
                    setSubjects(subjectsData);
                }

            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Finds course name from courseID
    const getCourseName = (courseId) => {
        const course = courses.find((course) => course.id === courseId);
        return course ? course.name : 'Unknown Course';
    };

    // Finds campus name from courseID
    const getCampusName = (courseId) => {
        const course = courses.find((course) => course.id === courseId);
        if (course) {
            const campus = campuses.find((campus) => campus.id === course.campus_id);
            return campus ? campus.name : 'Unknown Campus';
        }
        return 'Unknown Campus';
    };

    // Shows edit popup
    const handleEditSubject = (subject) => {
        setSelectedSubject(subject);
        setShowEditPopup(true);
    };

    return (
        <div className="admin-section">
            {isLoading ? (
                <div className="courses-list">
                    <div className="course-row">
                        <p>Loading Unit Classes</p> 
                    </div>
                </div>
            ) : (
                <div className="courses-list">
                    {subjects.map((subject, index) => (
                        <div key={index} className="course-row">
                            <div className="course-info">
                                <div className="course-name">{subject.name}</div>
                                <div className="course-details">
                                        <div className="course-code">{subject.code}</div>
                                        <div className="course-code">{getCourseName(subject.course_id)}</div>
                                        <div className="course-code">{getCampusName(subject.course_id)}</div>
                                    </div>
                            </div>
                            <div className="subject-actions">
                                <button className="more-options" onClick={() => handleEditSubject(subject)}>
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showEditPopup && selectedSubject && (
                <EditSubjectClassPopup
                    subject={selectedSubject}
                    onClose={() => setShowEditPopup(false)}
                />
            )}
        </div>
    );
};

export default SubjectListComponent;
