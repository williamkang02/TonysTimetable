import React, { useState, useEffect } from 'react';
import { MultiSelect } from 'primereact/multiselect'; // Import PrimeReact MultiSelect
import { supabase } from '../../utils/supabaseClient';
import '../../styles/popup.css';
import 'primereact/resources/themes/saga-blue/theme.css'; // PrimeReact theme
import 'primereact/resources/primereact.min.css'; // PrimeReact core CSS

const AddClassPopup = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState('');
    const [selectedClassTypes, setSelectedClassTypes] = useState([]); // Multi-select state for class types
    const [campuses, setCampuses] = useState([]);
    const [selectedCampus, setSelectedCampus] = useState('');

    // Define available class types
    const classTypeOptions = [
        { label: 'Tutorial', value: 'Tutorial' },
        { label: 'Practical', value: 'Practical' },
        { label: 'Lecture', value: 'Lecture' },
    ];

    // Fetch campuses for campus selection
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (name.trim() !== '' && capacity.trim() !== '' && selectedClassTypes.length > 0 && selectedCampus.trim() !== '') {
            try {
                const { data, error } = await supabase
                    .from('Locations') 
                    .insert([{ name, capacity, class_types: selectedClassTypes, campus_id: selectedCampus }]) // Insert class_types array
                    .select();

                if (error) {
                    console.error('Error adding classroom:', error);
                } else {
                    onSubmit(data[0]); 
                }
            } catch (error) {
                console.error('Error adding classroom:', error.message);
            }
            onClose();
        }
    };

    return (
        <div className="popup-container">
            <div className="popup">
                <div className='popup-h2'>Add Classroom</div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Classroom Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Enter Classroom Name"
                        />
                    </label>

                    <label>
                        Capacity:
                        <input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            required
                            placeholder="Enter Capacity"
                        />
                    </label>

                    <label>
                        Class Types:
                        <MultiSelect
                            value={selectedClassTypes}
                            options={classTypeOptions} // Use the predefined options
                            onChange={(e) => setSelectedClassTypes(e.value)} // Update state when options are selected
                            placeholder="Select Class Types"
                            display="chip"
                            className="multiselect-custom"
                        />
                    </label>

                    <label>
                        Select Campus:
                        <select
                            value={selectedCampus}
                            onChange={(e) => setSelectedCampus(e.target.value)}
                            required
                        >
                            <option value="" disabled hidden className="placeholder-option">Select a Campus</option>
                            {campuses.map((campus) => (
                                <option key={campus.id} value={campus.id}>
                                    {campus.name}
                                </option>
                            ))}
                        </select>
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

export default AddClassPopup;

