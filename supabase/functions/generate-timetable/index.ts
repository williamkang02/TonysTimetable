// Automatically generate the timetable using simulated annealing
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { corsHeaders } from '../_shared/cors.ts'

const MIN_HOUR = 8; // Earliest a class can start
const MAX_HOUR = 20; // Latest a class can finish

const IDEAL_HOUR = 13; // Ideal time for a class to start
const K_MAX = 1000; // Number of iterations for simulated annealing
const INIT_TEMP = 100; // Initial temperature for simulated annealing

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!, 
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
    // Needed to invoke from browser
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Attempt to fetch campuses
        const { data: campuses, error } = await supabase
            .from('Campuses')
            .select('id');
        if (error) throw new Error(error.message);

        // Generate timetable for each campus seperately
        // This ensures that classes are only assigned rooms in the correct campus
        if (campuses) {
            for (const campus of campuses) { 
                const data = await fetchData(campus.id);
                let timetable = await getInitialState(data);
                timetable = runSimulatedAnnealing(timetable, data);
                await updateDatabase(timetable, data);
            }
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ message: 'Timetable generated successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
});

// Checks if a class can be allocated to a given room at a given time
function canAllocate(classIndex, roomIndex, time, timetable, data): boolean {
    // Make sure the class isn't allocated too early
    if (time % 48 < MIN_HOUR*2) return false;

    // Make sure room is of the same type as the class
    if (!data.rooms[roomIndex].class_types.includes(data.classes[classIndex].class_type)) return false;

    for (let i = 0; i < data.classes[classIndex].duration_30mins; i++) {
        // Make sure the class isn't allocated too late
        if ((time + i) % 48 >= MAX_HOUR*2) return false;

        // Check if another class is already allocated to this room at this time
        if (timetable[time + i][roomIndex] !== null) return false;

        // Check if the class clashes with another class allocated at this time
        for (let j = 0; j < data.rooms.length; j++) {
            if (timetable[time + i][j] === null) continue;
            if (data.clashes.has(`${classIndex}-${timetable[time + i][j]}`)) return false;
        }
    }
    return true;
}

// Fetch class data from the database and determine which classes clash
async function fetchData(campusId) {
    const { data: rooms, roomsError } = await supabase
        .from('Locations')
        .select(`id, campus_id, class_types`)
        .eq('campus_id', campusId);

    if (roomsError) throw new Error(`Error fetching rooms: ${roomsError.message}`);

    const { data: classes, classesError } = await supabase
        .from('Classes')
        .select(`
            id, start_time, duration_30mins, class_type,
            Subjects!inner(Courses!inner(campus_id))
        `)
        .eq('Subjects.Courses.campus_id', campusId)
        .order('duration_30mins', { ascending: false });

    if (classesError) throw new Error(`Error fetching classes: ${classesError.message}`);

    if (rooms.length == 0 && classes.length > 0) throw new Error(`Campus with id ${campusId} has no rooms but at least one class.`);
    
    const { data: enrolments, enrolmentsError } = await supabase
        .from('StudentSubject')
        .select(`student_id, subject_id`);
    console.log(enrolments);

    if (enrolmentsError) throw new Error('Error fetching student enrolments: ' + enrolmentsError.message);
    
    const clashes = new Set();

    // Teaching staff clashes
    for (let i = 0; i < classes.length; i++) {
        for (let j = i + 1; j < classes.length; j++) {
            if (classes[i].staff_id == classes[j].staff_id) {
                clashes.add(`${i}-${j}`)
                clashes.add(`${j}-${i}`);
            }
        }
    }

    // Student clash
    for (let i = 0; i < enrolments.length; i++) {
        for (let j = i + 1; j < enrolments.length; j++) {
            if (enrolments[i].student_id == enrolments[j].student_id) {
                clashes.add(`${i}-${j}`)
                clashes.add(`${j}-${i}`);
            }
        }
    }

    return { rooms: rooms, classes: classes, clashes: clashes }
}

// Randomly generate an initial timetable
function getInitialState(data) {
    const timetable = Array.from({ length: 24*2*5 }, () => new Array(data.rooms.length).fill(null));
    // Attempt to randomly allocate each class.
    // TO DO: attempt limit.
    data.classes.forEach((clazz, classIndex) => {
        while (true) {
            const time = randomInt(0, 5) * 24*2 + randomInt(2*MIN_HOUR, 2*MAX_HOUR);
            const roomIndex = randomInt(0, data.rooms.length);
            if (canAllocate(classIndex, roomIndex, time, timetable, data)) {
                for (let i = 0; i < clazz.duration_30mins; i++) {
                    timetable[time + i][roomIndex] = classIndex;
                }
                break;
            }
      }
    });
    return timetable;
}

// Update the the database with the final timetable
async function updateDatabase(timetable, data) {
    for (let roomIndex = 0; roomIndex < data.rooms.length; roomIndex++) {
        for (let time = 0; time < timetable.length; time++) {
            const classIndex = timetable[time][roomIndex];
            if (classIndex !== null) { 
                const { error } = await supabase
                    .from("Classes")
                    .update({start_time: time, location_id: data.rooms[roomIndex].id})
                    .eq("id", data.classes[classIndex].id);
                if (error) throw new Error(`Error writing to database: ${error.message}`);
                time += data.classes[classIndex].duration_30mins - 1;
          }
        }
    }
}

// Utility function to generate a random integer between min and max (exclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Generates a neighbouring state by randomly deallocating and then reallocating classes
function getNeighbour(timetable, data) {
    const K = Math.ceil(data.classes.length * 0.2)
    const neighbour = JSON.parse(JSON.stringify(timetable));

    // Randomly select K classes to deallocate
    const toDeallocate = new Set<number>();
    while (toDeallocate.size < K) {
        toDeallocate.add(randomInt(0, data.classes.length - 1));
    }

    // Deallocate the classes
    for (let room = 0; room < data.rooms.length; room++) {
        for (let time = 0; time < neighbour.length; time++) {
            if (toDeallocate.has(neighbour[time][room])) neighbour[time][room] = null;
        }
    }

    // Reallocate the classes
    toDeallocate.forEach(classIndex => {
        const clazz = data.classes[classIndex];
        while (true) {
            const time = randomInt(0, 5) * 24*2 + randomInt(2*MIN_HOUR, 2*MAX_HOUR);
            const roomIndex = randomInt(0, data.rooms.length);
            if (canAllocate(classIndex, roomIndex, time, timetable, data)) {
                for (let i = 0; i < clazz.duration_30mins; i++) {
                    neighbour[time + i][roomIndex] = classIndex;
                }
                break;
            }
        }
    });

    return neighbour;
}

// Calculate the energy for a proposed timetable
function getEnergy(timetable, data) {
    let energy = 0;
    for (let roomIndex = 0; roomIndex < data.rooms.length; roomIndex++) {
        for (let time = 0; time < timetable.length; time++) {
            const classIndex = timetable[time][roomIndex];
            if (classIndex === null) continue;
            if (time % 2 == 1) energy += 100; // Prefer to start at a whole hour
            energy += Math.abs(time % 48 - IDEAL_HOUR*2); // Prefer to start close to the ideal hour
            time += data.classes[classIndex].duration_30mins - 1;
        }
    }
    return energy;
}

// Optimise the timetable using simulated annealing
function runSimulatedAnnealing(initialState, data) {
    let currState = initialState;
    let currEnergy = getEnergy(currState, data);
    for (let k = 0; k < K_MAX; k++) {
        const temperature = INIT_TEMP * (1 - (k + 1) / K_MAX);
        const newState = getNeighbour(currState, data);
        const newEnergy = getEnergy(newState, data);
        if (acceptanceProbaility(currEnergy, newEnergy, temperature) > Math.random()) {
            currState = newState;
            currEnergy = newEnergy;
        }
    }
    return currState;
}

// Calculate the probability of moving from the current timetable to a proposed timetable
function acceptanceProbaility(currEnergy, newEnergy, temperature) {
    if (newEnergy < currEnergy) {
        // Always move to a lower energy state
        return 1;
    }
    return Math.exp(-(newEnergy - currEnergy) / temperature);
}




  
 