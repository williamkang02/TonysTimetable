import Papa from 'papaparse';
import { supabase } from './supabaseClient';

export const handleFileUpload = (event, setErrorMessages, setShowErrorPopup, onStudentsUpdated) => {
    const file = event.target.files[0];
    const errors = [];

    if (file) {
        alert("CSV uploaded, please wait...");

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                console.log('Parsed Results: ', results);

                if (results && results.data && results.data.length > 0) {
                    for (const student of results.data) {
                        const studentId = student['StudentID'] || null;
                        const name = student['Student Name'] || null;
                        const university_email = student['University Email'] || null;
                        const courseName = student['Course Name'] || null;
                        const campusName = student['Campus'] ? student['Campus'].trim() : null;

                        if (!validateStudentData({ studentId, name, courseName, campusName })) {
                            const errorMessage = `Missing required data for student ${name || 'Unknown'}.`;
                            console.error(errorMessage);
                            errors.push(errorMessage);
                            continue;
                        }

                        try {
                            const existingStudent = await checkIfStudentExists(studentId);
                            const courseData = await fetchCourseAndCampus(courseName, campusName);

                            if (!courseData) {
                                errors.push(`Error fetching course or campus for ${name}.`);
                                continue;
                            }

                            const { courseId, fetchedCampusName } = courseData;

                            if (!validateCampusName(fetchedCampusName, campusName)) {
                                const errorMessage = `Campus mismatch for student ${name}. Expected ${campusName}, but found ${fetchedCampusName}.`;
                                console.error(errorMessage);
                                errors.push(errorMessage);
                                continue;
                            }

                            const subjectsExist = await checkSubjectsExist(student);
                            if (!subjectsExist) {
                                const errorMessage = `One or more subjects do not exist for student ${name}.`;
                                console.error(errorMessage);
                                errors.push(errorMessage);
                                continue;
                            }

                            let studentIdDb;
                            let updatedStudent;
                            let isNewStudent = false; // Track if the student is new

                            if (existingStudent) {
                                // Check if any updates are needed for the existing student
                                const needsUpdate = existingStudent.name !== name ||
                                                    existingStudent.university_email !== university_email ||
                                                    existingStudent.course_id !== courseId;

                                if (needsUpdate) {
                                    await updateStudentInDatabase(existingStudent.id, { name, university_email, courseId });
                                    studentIdDb = existingStudent.id;
                                    console.log(`Student ${name} updated successfully.`);
                                } else {
                                    console.log(`Student ${name} already up to date. Skipping update.`);
                                    continue; // Skip adding to state if no updates are made
                                }
                            } else {
                                // New student - insert into the database
                                studentIdDb = await insertStudent({ studentId, name, university_email, courseId });
                                console.log(`Student ${name} inserted successfully.`);
                                isNewStudent = true;
                            }

                            updatedStudent = {
                                id: studentIdDb,
                                student_id: studentId,
                                name,
                                university_email,
                                course_id: courseId,
                                Courses: courseData
                            };

                            // Clear existing subject enrollments
                            await clearExistingEnrollments(studentIdDb);

                            // Enroll the student in subjects
                            await enrollStudentInSubjects(studentIdDb, student);
                            console.log(`Student ${name} enrolled in subjects successfully.`);

                            // Only update the parent component's state if the student is new or was updated
                            if (isNewStudent || existingStudent) {
                                onStudentsUpdated(updatedStudent);
                            }

                        } catch (error) {
                            const errorMessage = `Error processing student ${name}: ${error.message}`;
                            console.error(errorMessage);
                            errors.push(errorMessage);
                        }
                    }

                    // If there are any errors, show the error popup
                    if (errors.length > 0) {
                        setErrorMessages(errors);
                        setShowErrorPopup(true);
                    }
                } else {
                    const errorMessage = 'Error: Parsed data is not in the expected format.';
                    console.error(errorMessage);
                    errors.push(errorMessage);
                    setErrorMessages(errors);
                    setShowErrorPopup(true);
                }
            },
            error: (error) => {
                const errorMessage = `Error parsing CSV file: ${error.message}`;
                console.error(errorMessage);
                errors.push(errorMessage);
                setErrorMessages(errors);
                setShowErrorPopup(true);
            }
        });
    }
};

// Helper function to clear existing subject enrollments for a student
export const clearExistingEnrollments = async (studentId) => {
    const { error: deleteError } = await supabase
        .from('StudentSubject')
        .delete()
        .eq('student_id', studentId);

    if (deleteError) {
        console.error(`Error clearing existing subject enrollments for student ${studentId}:`, deleteError);
    } else {
        console.log(`Existing subject enrollments for student ${studentId} cleared.`);
    }
};

// Helper function to enroll student in subjects
export const enrollStudentInSubjects = async (studentId, student) => {
    const subjectCodes = Object.keys(student).filter(key => /\d/.test(key)); // Find columns that contain subject codes

    for (const subjectCode of subjectCodes) {
        const enrollmentStatus = student[subjectCode];

        if (enrollmentStatus === 'ENRL') {
            const { data: subjectData, error: subjectError } = await supabase
                .from('Subjects')
                .select('id')
                .eq('code', subjectCode)
                .single();

            if (subjectError || !subjectData) {
                console.error(`Error: Subject with code ${subjectCode} does not exist.`);
                continue;
            }

            const subjectId = subjectData.id;

            // Insert into studentSubjects table
            const { data: enrollmentData, error: enrollmentError } = await supabase
                .from('StudentSubject')
                .insert([{ student_id: studentId, subject_id: subjectId }])
                .select();

            if (enrollmentError) {
                console.error(`Error enrolling student ${studentId} in subject ${subjectCode}:`, enrollmentError);
                continue;
            }

            console.log(`Student ${studentId} enrolled in subject ${subjectCode} successfully.`);
        }
    }
};

// Helper function to validate student data
export const validateStudentData = ({ studentId, name, courseName, campusName }) => {
    return studentId && name && courseName && campusName;
};

// Helper function to check if the student already exists
export const checkIfStudentExists = async (studentId) => {
    const { data: existingStudentData, error: existingStudentError } = await supabase
        .from('Students')
        .select('*')
        .eq('student_id', studentId)
        .single();

    if (existingStudentError && existingStudentError.code !== 'PGRST116') {
        console.error(`Error checking if student exists for student_id ${studentId}:`, existingStudentError);
        return null;
    }

    return existingStudentData;
};

// Helper function to fetch course and campus information
export const fetchCourseAndCampus = async (courseName, campusName) => {
    const { data: courseData, error: courseError } = await supabase
        .from('Courses')
        .select('id, campus_id')
        .eq('name', courseName)
        .single();

    if (courseError || !courseData) {
        console.error(`Error fetching course for ${courseName}:`, courseError);
        return null;
    }

    const { data: campusData, error: campusError } = await supabase
        .from('Campuses')
        .select('name')
        .eq('id', courseData.campus_id)
        .single();

    if (campusError || !campusData) {
        console.error(`Error fetching campus for campus_id ${courseData.campus_id}:`, campusError);
        return null;
    }

    return { courseId: courseData.id, campusId: courseData.campus_id, fetchedCampusName: campusData.name.trim() };
};

// Helper function to validate the campus name
export const validateCampusName = (fetchedCampusName, campusName) => {
    return fetchedCampusName.toLowerCase() === campusName.toLowerCase();
};

// Helper function to check if all the subjects exist
export const checkSubjectsExist = async (student) => {
    const subjectCodes = Object.keys(student).filter(key => /\d/.test(key)); // Find columns that contain subject codes
    let allSubjectsExist = true;

    for (const subjectCode of subjectCodes) {
        const enrollmentStatus = student[subjectCode];

        if (enrollmentStatus === 'ENRL') {
            const { data: subjectData, error: subjectError } = await supabase
                .from('Subjects')
                .select('id')
                .eq('code', subjectCode)
                .single();

            if (subjectError || !subjectData) {
                console.error(`Error: Subject with code ${subjectCode} does not exist.`);
                allSubjectsExist = false;
                break;
            }
        }
    }

    return allSubjectsExist;
};

// Helper function to insert a new student
export const insertStudent = async ({ studentId, name, university_email, courseId }) => {
    const { data: studentData, error: studentError } = await supabase
        .from('Students')
        .insert([{ student_id: studentId, name, university_email, course_id: courseId }])
        .select();

    if (studentError) {
        console.error(`Error inserting student ${name}:`, studentError);
        return null;
    }

    return studentData[0].id;
};

// Helper function to update student data in the database
export const updateStudentInDatabase = async (studentIdDb, { name, university_email, courseId }) => {
    const { data: updatedStudentData, error: updateError } = await supabase
        .from('Students')
        .update({ name, university_email, course_id: courseId })
        .eq('id', studentIdDb)
        .select();

    if (updateError) {
        console.error(`Error updating student with id ${studentIdDb}:`, updateError);
        return null;
    }

    return updatedStudentData[0];
};
