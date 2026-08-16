import { User, HealthRecord, Request, Medicine, Expense, Notification, AuditLog, BackupRecord, MedicineDispensing } from '../types';

// Colleges
const colleges = ['College of Engineering', 'College of Business', 'College of Nursing', 'College of Education', 'College of Arts', 'College of Science', 'College of Law', 'College of Medicine'];
const offices = ['Finance Office', 'Registrar Office', 'Human Resources', 'IT College', 'Library Services', 'Research Office', 'Student Affairs', 'Procurement Office'];

// Blood types distribution
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Common allergies
const commonAllergies = ['Penicillin', 'Shellfish', 'Dust', 'Pollen', 'Sulfa drugs', 'Aspirin', 'Latex', 'Nuts', 'Dairy', 'Eggs'];

// Common conditions
const commonConditions = ['Asthma', 'Hypertension', 'Diabetes Type 2', 'Migraine', 'Dysmenorrhea', 'Anemia', 'Hyperthyroidism', 'Hypothyroidism', 'Arthritis', 'Sinusitis'];

// Medicine categories and medicines
const medicineData = [
  { name: 'Paracetamol 500mg', category: 'Analgesic', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Paracetamol 250mg (Pediatric)', category: 'Analgesic', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Ibuprofen 400mg', category: 'NSAID', unit: 'tablets', supplier: 'HealthPlus' },
  { name: 'Ibuprofen 200mg', category: 'NSAID', unit: 'tablets', supplier: 'HealthPlus' },
  { name: 'Mefenamic Acid 500mg', category: 'NSAID', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Aspirin 100mg', category: 'NSAID', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Amoxicillin 250mg', category: 'Antibiotic', unit: 'capsules', supplier: 'MedSupply Co.' },
  { name: 'Amoxicillin 500mg', category: 'Antibiotic', unit: 'capsules', supplier: 'MedSupply Co.' },
  { name: 'Ampicillin 500mg', category: 'Antibiotic', unit: 'capsules', supplier: 'BioPharma' },
  { name: 'Azithromycin 500mg', category: 'Antibiotic', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Cephalexin 500mg', category: 'Antibiotic', unit: 'capsules', supplier: 'PharmaCorp' },
  { name: 'Ciprofloxacin 500mg', category: 'Antibiotic', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Salbutamol Inhaler', category: 'Bronchodilator', unit: 'inhalers', supplier: 'HealthPlus' },
  { name: 'Salbutamol Syrup 2mg/5ml', category: 'Bronchodilator', unit: 'bottles', supplier: 'HealthPlus' },
  { name: 'Ipratropium Inhaler', category: 'Bronchodilator', unit: 'inhalers', supplier: 'BioPharma' },
  { name: 'Amlodipine 5mg', category: 'Antihypertensive', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Amlodipine 10mg', category: 'Antihypertensive', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Losartan 50mg', category: 'Antihypertensive', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Losartan 100mg', category: 'Antihypertensive', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Metoprolol 50mg', category: 'Antihypertensive', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Captopril 25mg', category: 'Antihypertensive', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Metformin 500mg', category: 'Antidiabetic', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Metformin 850mg', category: 'Antidiabetic', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Gliclazide 80mg', category: 'Antidiabetic', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Glipizide 5mg', category: 'Antidiabetic', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Omeprazole 20mg', category: 'Gastrointestinal', unit: 'capsules', supplier: 'PharmaCorp' },
  { name: 'Omeprazole 40mg', category: 'Gastrointestinal', unit: 'capsules', supplier: 'PharmaCorp' },
  { name: 'Ranitidine 150mg', category: 'Gastrointestinal', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Antacid Suspension', category: 'Gastrointestinal', unit: 'bottles', supplier: 'HealthPlus' },
  { name: 'Cetirizine 10mg', category: 'Antihistamine', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Loratadine 10mg', category: 'Antihistamine', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Diphenhydramine 25mg', category: 'Antihistamine', unit: 'tablets', supplier: 'HealthPlus' },
  { name: 'Cetirizine Syrup', category: 'Antihistamine', unit: 'bottles', supplier: 'PharmaCorp' },
  { name: 'Ferrous Sulfate 325mg', category: 'Hematologic', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Ferrous Sulfate + Folic Acid', category: 'Hematologic', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Folic Acid 5mg', category: 'Hematologic', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Vitamin B Complex', category: 'Vitamin', unit: 'tablets', supplier: 'HealthPlus' },
  { name: 'Vitamin C 500mg', category: 'Vitamin', unit: 'tablets', supplier: 'HealthPlus' },
  { name: 'Vitamin C 1000mg', category: 'Vitamin', unit: 'tablets', supplier: 'HealthPlus' },
  { name: 'Multivitamins', category: 'Vitamin', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Vitamin D 1000IU', category: 'Vitamin', unit: 'capsules', supplier: 'MedSupply Co.' },
  { name: 'Calcium Carbonate 500mg', category: 'Vitamin', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Oral Rehydration Salt', category: 'Electrolyte', unit: 'sachets', supplier: 'PharmaCorp' },
  { name: 'Potassium Chloride', category: 'Electrolyte', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Dextrose 50% (IV)', category: 'Electrolyte', unit: 'vials', supplier: 'BioPharma' },
  { name: 'Diazepam 5mg', category: 'Sedative', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Alprazolam 0.5mg', category: 'Sedative', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Carbocisteine 375mg', category: 'Respiratory', unit: 'capsules', supplier: 'MedSupply Co.' },
  { name: 'Ambroxol 30mg', category: 'Respiratory', unit: 'tablets', supplier: 'HealthPlus' },
  { name: 'Dextromethorphan Syrup', category: 'Respiratory', unit: 'bottles', supplier: 'PharmaCorp' },
  { name: 'Hydrochlorothiazide 25mg', category: 'Diuretic', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Furosemide 40mg', category: 'Diuretic', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Atorvastatin 20mg', category: 'Lipid-lowering', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Simvastatin 20mg', category: 'Lipid-lowering', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Clopidogrel 75mg', category: 'Cardiovascular', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Isosorbide Dinitrate 5mg', category: 'Cardiovascular', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Hydralazine 25mg', category: 'Cardiovascular', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Levothyroxine 50mcg', category: 'Thyroid', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Levothyroxine 100mcg', category: 'Thyroid', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Methimazole 5mg', category: 'Thyroid', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Prednisone 5mg', category: 'Corticosteroid', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Prednisone 20mg', category: 'Corticosteroid', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Dexamethasone 4mg', category: 'Corticosteroid', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Hydrocortisone Cream 1%', category: 'Corticosteroid', unit: 'tubes', supplier: 'HealthPlus' },
  { name: 'Miconazole Cream 2%', category: 'Antifungal', unit: 'tubes', supplier: 'HealthPlus' },
  { name: 'Clotrimazole Cream 1%', category: 'Antifungal', unit: 'tubes', supplier: 'PharmaCorp' },
  { name: 'Ketoconazole Shampoo', category: 'Antifungal', unit: 'bottles', supplier: 'MedSupply Co.' },
  { name: 'Fluconazole 150mg', category: 'Antifungal', unit: 'capsules', supplier: 'BioPharma' },
  { name: 'Metronidazole 500mg', category: 'Antiprotozoal', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Albendazole 400mg', category: 'Antiprotozoal', unit: 'tablets', supplier: 'PharmaCorp' },
  { name: 'Diclofenac 50mg', category: 'NSAID', unit: 'tablets', supplier: 'HealthPlus' },
  { name: 'Naproxen 250mg', category: 'NSAID', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Mefenamic Acid 250mg', category: 'NSAID', unit: 'tablets', supplier: 'HealthPlus' },
  { name: 'Tizanidine 2mg', category: 'Muscle Relaxant', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Thiocolchicoside 4mg', category: 'Muscle Relaxant', unit: 'tablets', supplier: 'MedSupply Co.' },
  { name: 'Baclofen 10mg', category: 'Muscle Relaxant', unit: 'tablets', supplier: 'BioPharma' },
  { name: 'Bandages (3")', category: 'First Aid', unit: 'rolls', supplier: 'MedEquip Inc.' },
  { name: 'Bandages (4")', category: 'First Aid', unit: 'rolls', supplier: 'MedEquip Inc.' },
  { name: 'Gauze Pads 4x4', category: 'First Aid', unit: 'pieces', supplier: 'MedEquip Inc.' },
  { name: 'Medical Tape 1"', category: 'First Aid', unit: 'rolls', supplier: 'MedEquip Inc.' },
  { name: 'Medical Gloves (100 pairs)', category: 'First Aid', unit: 'boxes', supplier: 'MedEquip Inc.' },
  { name: 'Antiseptic Solution', category: 'First Aid', unit: 'bottles', supplier: 'HealthPlus' },
  { name: 'Povidone-Iodine 10%', category: 'First Aid', unit: 'bottles', supplier: 'PharmaCorp' },
  { name: 'Alcohol 70%', category: 'First Aid', unit: 'bottles', supplier: 'HealthPlus' },
  { name: 'Betadine Ointment', category: 'First Aid', unit: 'tubes', supplier: 'PharmaCorp' },
  { name: 'Burn Ointment', category: 'First Aid', unit: 'tubes', supplier: 'HealthPlus' },
];

// Filipino first names and last names
const firstNames = {
  male: ['Jose', 'Juan', 'Pedro', 'Carlos', 'Manuel', 'Luis', 'Antonio', 'Miguel', 'Rafael', 'Gabriel', 'Diego', 'Marco', 'Angelo', 'Francisco', 'Daniel', 'Alexander', 'Christopher', 'Vincent', 'Patrick', 'Mark', 'Joseph', 'Andrew', 'Michael', 'James', 'Richard', 'Robert', 'William', 'David', 'Benjamin', 'Samuel', 'Nathaniel', 'Timothy', 'Raymond', 'Eugene', 'Lawrence', 'Raymond', 'Roderick', 'Fernando', 'Eduardo', 'Ricardo', 'Rogelio', 'Benjamin', 'Guillermo', 'Ernesto', 'Federico', 'Augustine', 'Armando', 'Gerald', 'Rolando', 'Marcelino'],
  female: ['Maria', 'Ana', 'Rosa', 'Carmen', 'Elena', 'Isabel', 'Teresa', 'Lourdes', 'Grace', 'Faith', 'Hope', 'Joy', 'Rose', 'Mary', 'Jane', 'Anna', 'Christina', 'Patricia', 'Elizabeth', 'Jennifer', 'Michelle', 'Stephanie', 'Catherine', 'Margaret', 'Sofia', 'Victoria', 'Alexandra', 'Gabriella', 'Amelia', 'Isabella', 'Valentina', 'Camilla', 'Francesca', 'Beatrice', 'Angelica', 'Clarissa', 'Bianca', 'Danielle', 'Erica', 'Vanessa', 'Monica', 'Angela', 'Paola', 'Jasmine', 'Lyka', 'Marian', 'Marisol', 'Rosario', 'Concepcion', 'Guadalupe']
};

const lastNames = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Villanueva', 'Aquino', 'Torres', 'Fernandez', 'Pascual', 'Dela Cruz', 'Gonzales', 'Hernandez', 'Lopez', 'Martinez', 'Rodriguez', 'Sanchez', 'Ramirez', 'Flores', 'Rivera', 'Castillo', 'Morales', 'Ortiz', 'Jimenez', 'Ramos', 'Navarro', 'Vargas', 'Aguilar', 'Castro', 'Moreno', 'Romero', 'Alvarez', 'Serrano', 'Herrera', 'Medina', 'Delgado', 'Molina', 'Suarez', 'Domingo', 'Padilla', 'Barrera', 'Santiago', 'Perez', 'Valencia', 'Vega', 'Polo', 'Noble', 'Acosta', 'Diaz', 'Morales', 'Mendez', 'Cabrera', 'Leon', 'Velasco', 'Salazar', 'Camacho', 'Soto', 'Rojas', 'Guerrero', 'Trujillo', 'Cortes', 'Naranjo', 'Rios', 'Mejia', 'Paredes', 'Benitez', 'Munoz', 'Hidalgo', 'Vasquez', 'Valenzuela', 'Esteban', 'Candelaria'];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDate(startYear: number, endYear: number): string {
  const year = randomInt(startYear, endYear);
  const month = randomInt(1, 12).toString().padStart(2, '0');
  const day = randomInt(1, 28).toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateRecentDate(): string {
  const today = new Date();
  const daysAgo = randomInt(0, 60);
  const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

// Generate users
function generateUsers(): User[] {
  const users: User[] = [
    { id: 'u1', name: 'Dr. Maria Santos', email: 'admin@gmail.com', role: 'admin', department: 'Administration', adminId: 'ADM-2024-001', status: 'active', createdAt: '2024-01-10' },
    { id: 'u2', name: 'Nurse Ana Reyes', email: 'officer@gmail.com', role: 'health_officer', department: 'Health Services', officerId: 'HOF-2024-001', status: 'active', createdAt: '2024-01-12' },
    { id: 'u3', name: 'John Dela Cruz', email: 'student@gmail.com', role: 'student', department: 'College of Engineering', studentId: 'STU-2024-001', status: 'active', createdAt: '2024-02-01' },
    { id: 'u4', name: 'Jane Bautista', email: 'staff@gmail.com', role: 'staff', department: 'Library Services', employeeId: 'STF-2024-001', status: 'active', createdAt: '2024-02-05' },
    { id: 'u5', name: 'Carlos Mendoza', email: 'carlos@gmail.com', role: 'student', department: 'College of Business', studentId: 'STU-2024-002', status: 'active', createdAt: '2024-02-10' },
    { id: 'u6', name: 'Pedro Villanueva', email: 'pedro@gmail.com', role: 'faculty', department: 'IT College', facultyId: 'FAC-2024-001', status: 'active', createdAt: '2024-03-01' },
    { id: 'u7', name: 'Rosa Aquino', email: 'employee@gmail.com', role: 'employee', department: 'Finance Office', employeeId: 'EMP-2024-001', status: 'active', createdAt: '2024-03-10' },
    { id: 'u8', name: 'Manuel Torres', email: 'manuel@gmail.com', role: 'employee', department: 'Registrar Office', employeeId: 'EMP-2024-002', status: 'active', createdAt: '2024-03-15' },
    { id: 'u9', name: 'Prof. Luz Fernandez', email: 'faculty@gmail.com', role: 'faculty', department: 'College of Education', facultyId: 'FAC-2024-002', status: 'active', createdAt: '2024-03-20' },
    { id: 'u10', name: 'Anna Pascual', email: 'anna@gmail.com', role: 'student', department: 'College of Nursing', studentId: 'STU-2024-003', status: 'active', createdAt: '2024-04-01' },
  ];

  let userIdCounter = 11;
  let studentIdCounter = 4;
  let facultyIdCounter = 3;
  let employeeIdCounter = 3;

  // Generate 350+ students
  for (let i = 0; i < 280; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = randomElement(firstNames[gender]);
    const lastName = randomElement(lastNames);
    users.push({
      id: `u${userIdCounter++}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/ /g, '')}${studentIdCounter}@student.health.edu`,
      role: 'student',
      department: randomElement(colleges),
      studentId: `STU-2024-${(studentIdCounter++).toString().padStart(3, '0')}`,
      status: Math.random() > 0.08 ? 'active' : 'inactive',
      createdAt: generateDate(2024, 2025),
    });
  }

  // Generate 50+ faculty
  for (let i = 0; i < 45; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = randomElement(firstNames[gender]);
    const lastName = randomElement(lastNames);
    users.push({
      id: `u${userIdCounter++}`,
      name: `${gender === 'male' ? 'Prof.' : 'Prof.'} ${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/ /g, '')}${facultyIdCounter}@faculty.health.edu`,
      role: 'faculty',
      department: randomElement(colleges),
      facultyId: `FAC-2024-${(facultyIdCounter++).toString().padStart(3, '0')}`,
      status: Math.random() > 0.05 ? 'active' : 'inactive',
      createdAt: generateDate(2024, 2025),
    });
  }

  // Generate 30+ staff
  for (let i = 0; i < 28; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = randomElement(firstNames[gender]);
    const lastName = randomElement(lastNames);
    users.push({
      id: `u${userIdCounter++}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/ /g, '')}${i}@staff.health.edu`,
      role: 'staff',
      department: randomElement(offices),
      status: Math.random() > 0.06 ? 'active' : 'inactive',
      createdAt: generateDate(2024, 2025),
    });
  }

  // Generate 30+ employees
  for (let i = 0; i < 25; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = randomElement(firstNames[gender]);
    const lastName = randomElement(lastNames);
    users.push({
      id: `u${userIdCounter++}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/ /g, '')}${employeeIdCounter}@employee.health.edu`,
      role: 'employee',
      department: randomElement(offices),
      employeeId: `EMP-2024-${(employeeIdCounter++).toString().padStart(3, '0')}`,
      status: Math.random() > 0.07 ? 'active' : 'inactive',
      createdAt: generateDate(2024, 2025),
    });
  }

  return users;
}

// Generate inventory
function generateInventory(): Medicine[] {
  const inventory: Medicine[] = medicineData.map((med, index) => ({
    id: `m${index + 1}`,
    name: med.name,
    category: med.category,
    quantity: randomInt(20, 500),
    unit: med.unit,
    minStock: randomInt(20, 100),
    expiryDate: generateDate(2025, 2028),
    supplier: med.supplier,
    lastUpdated: generateRecentDate(),
    primaryKeyDate: generateDate(2024, 2025),
  }));

  // Ensure some items are low stock
  for (let i = 0; i < 8; i++) {
    const idx = randomInt(0, inventory.length - 1);
    inventory[idx].quantity = Math.floor(inventory[idx].minStock * 0.3);
  }

  return inventory;
}

// Generate health records
function generateHealthRecords(users: User[], dispensing: MedicineDispensing[]): HealthRecord[] {
  const healthRecords: HealthRecord[] = [];
  const patientUsers = users.filter(u => ['student', 'staff', 'faculty', 'employee'].includes(u.role));

  // Generate 1240+ health records
  const numRecords = Math.min(patientUsers.length * 3 + 100, 1300);

  for (let i = 0; i < numRecords; i++) {
    const user = patientUsers[i % patientUsers.length];
    const height = randomInt(150, 190);
    const weight = randomInt(45, 100);
    const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);

    const numAllergies = Math.random() > 0.6 ? randomInt(0, 3) : 0;
    const numConditions = Math.random() > 0.65 ? randomInt(0, 2) : 0;
    const numMedications = numConditions > 0 ? randomInt(1, 3) : 0;

    // Get dispensing history for this patient
    const patientDispensing = dispensing.filter(d => d.patientId === user.id);

    healthRecords.push({
      id: `hr${i + 1}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      department: user.department,
      studentId: user.studentId,
      employeeId: user.employeeId,
      facultyId: user.facultyId,
      bloodType: randomElement(bloodTypes),
      allergies: numAllergies > 0 ? Array.from({ length: numAllergies }, () => randomElement(commonAllergies)).filter((v, i, a) => a.indexOf(v) === i) : [],
      conditions: numConditions > 0 ? Array.from({ length: numConditions }, () => randomElement(commonConditions)).filter((v, i, a) => a.indexOf(v) === i) : [],
      medications: numMedications > 0 ? Array.from({ length: numMedications }, () => randomElement(medicineData.slice(0, 20).map(m => m.name))).filter((v, i, a) => a.indexOf(v) === i) : [],
      height: `${height} cm`,
      weight: `${weight} kg`,
      bmi: bmi,
      vision: Math.random() > 0.3 ? `20/${randomInt(15, 30)}` : `20/${randomInt(30, 50)} (corrected)`,
      dentalStatus: Math.random() > 0.25 ? 'Good' : 'Needs follow-up',
      lastCheckup: generateDate(2024, 2025),
      nextCheckup: generateDate(2025, 2026),
      emergencyContact: `${randomElement([...firstNames.male, ...firstNames.female])} ${randomElement(lastNames)} (${Math.random() > 0.5 ? 'Parent' : 'Spouse'})`,
      emergencyPhone: `09${randomInt(10, 39)}${randomInt(1000000, 9999999)}`,
      notes: Math.random() > 0.5 ? 'Patient is in good health. Regular monitoring recommended.' : 'No significant findings during checkup.',
      dispensingHistory: patientDispensing,
      createdAt: generateDate(2023, 2025),
      updatedAt: generateDate(2024, 2025),
      archived: Math.random() > 0.95,
    });
  }

  return healthRecords;
}

// Generate requests
function generateRequests(users: User[]): Request[] {
  const requests: Request[] = [];
  const requestTypes: Request['type'][] = ['medical', 'dental', 'medicine'];
  const statuses: Request['status'][] = ['pending', 'processing', 'approved', 'rejected', 'released', 'forwarded'];
  const requestors = users.filter(u => ['student', 'staff', 'faculty', 'employee'].includes(u.role));

  // Generate 500+ requests
  for (let i = 0; i < 520; i++) {
    const requestor = randomElement(requestors);
    const type = randomElement(requestTypes);
    const status = randomElement(statuses);
    const date = generateRecentDate();

    const request: Request = {
      id: `req${i + 1}`,
      userId: requestor.id,
      userName: requestor.name,
      userRole: requestor.role,
      type,
      description: type === 'medical' ? 'General medical consultation and checkup request.' :
                   type === 'dental' ? 'Dental consultation and oral health assessment request.' :
                   'Request for medicine from clinic stock.',
      status,
      attachments: Math.random() > 0.7 ? [randomElement(medicineData).name + '.pdf'] : [],
      submittedAt: date,
      updatedAt: date,
      reviewedBy: ['approved', 'released', 'rejected', 'processing'].includes(status) ? 'Nurse Ana Reyes' : undefined,
      reviewNotes: status === 'approved' ? 'Approved. Please proceed to clinic.' :
                   status === 'rejected' ? 'Incomplete requirements. Please resubmit.' :
                   status === 'processing' ? 'Under review.' : undefined,
      remarks: status === 'approved' || status === 'released' ? 'Please proceed to clinic during office hours.' : undefined,
    };

    requests.push(request);
  }

  // Sort by date (most recent first)
  requests.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return requests;
}

// Generate dispensing history
function generateDispensingHistory(users: User[], inventory: Medicine[]): MedicineDispensing[] {
  const dispensing: MedicineDispensing[] = [];
  const patientUsers = users.filter(u => ['student', 'staff', 'faculty', 'employee'].includes(u.role));
  const reasons = ['Fever and headache', 'Cold and flu symptoms', 'Musculoskeletal pain', 'Stomach upset', 'Allergic reaction', 'Monthly maintenance supply', 'Dysmenorrhea', 'Minor injury', 'Hypertension maintenance', 'Diabetes maintenance'];

  const nurse = users.find(u => u.role === 'health_officer');
  const nurseName = nurse?.name || 'Nurse Ana Reyes';

  // Generate 300+ dispensing records
  for (let i = 0; i < 320; i++) {
    const patient = randomElement(patientUsers);
    const medicine = randomElement(inventory.slice(0, 30)); // Use top 30 medicines
    const quantity = randomInt(1, 30);

    dispensing.push({
      id: `disp${i + 1}`,
      medicineId: medicine.id,
      medicineName: medicine.name,
      patientId: patient.id,
      patientName: patient.name,
      patientRole: patient.role,
      quantity,
      unit: medicine.unit,
      dispensedBy: nurseName,
      dispensedAt: generateRecentDate(),
      reason: randomElement(reasons),
    });
  }

  return dispensing;
}

// Generate expenses
function generateExpenses(): Expense[] {
  const expenses: Expense[] = [];
  const descriptions = [
    { desc: 'Paracetamol restock', cat: 'medicines' as const },
    { desc: 'Ibuprofen restock', cat: 'medicines' as const },
    { desc: 'Stethoscope replacement', cat: 'equipment' as const },
    { desc: 'Blood pressure monitor', cat: 'equipment' as const },
    { desc: 'Medical gloves procurement', cat: 'supplies' as const },
    { desc: 'Bandages and gauze', cat: 'supplies' as const },
    { desc: 'Laboratory testing services', cat: 'services' as const },
    { desc: 'Medical equipment maintenance', cat: 'services' as const },
    { desc: 'Antibiotics purchase', cat: 'medicines' as const },
    { desc: 'Vitamin supplements procurement', cat: 'medicines' as const },
  ];

  for (let i = 0; i < 85; i++) {
    const item = randomElement(descriptions);
    const status = randomElement(['recorded', 'verified', 'liquidated'] as const);

    expenses.push({
      id: `exp${i + 1}`,
      description: item.desc,
      amount: randomInt(500, 15000),
      category: item.cat,
      date: generateRecentDate(),
      recordedBy: 'Nurse Ana Reyes',
      receiptNo: `OR-2024-${(i + 1).toString().padStart(4, '0')}`,
      status,
      reviewedBy: status !== 'recorded' ? 'Dr. Maria Santos' : undefined,
      reviewNotes: status === 'verified' ? 'Verified and approved.' : undefined,
      liquidatedAt: status === 'liquidated' ? generateRecentDate() : undefined,
    });
  }

  return expenses;
}

// Generate notifications
function generateNotifications(): Notification[] {
  const notifications: Notification[] = [
    {
      id: 'notif1', title: 'Annual Physical Examination Schedule',
      message: 'All students, faculty, staff and employees are required to undergo annual physical examination from November 20-30, 2024. Please bring your health records.',
      recipientRoles: ['student', 'staff', 'faculty', 'employee'], sentBy: 'Dr. Maria Santos', sentAt: '2024-11-08', type: 'announcement', read: false,
    },
    {
      id: 'notif2', title: 'Low Stock Alert: Salbutamol Inhaler',
      message: 'Salbutamol Inhalers are running low (15 remaining). Please initiate reorder.',
      recipientRoles: ['admin'], sentBy: 'System', sentAt: '2024-11-06', type: 'alert', read: false,
    },
    {
      id: 'notif3', title: 'Health Clearance Reminder',
      message: 'This is a reminder that health clearances for Q4 2024 are due by November 30.',
      recipientRoles: ['student', 'staff', 'faculty', 'employee'], sentBy: 'Dr. Maria Santos', sentAt: '2024-11-01', type: 'reminder', read: true,
    },
  ];

  // Add more system notifications
  for (let i = 4; i <= 50; i++) {
    notifications.push({
      id: `notif${i}`,
      title: randomElement(['Clinic Holiday Schedule', 'Flu Vaccination Campaign', 'Health Awareness Week', 'Medical Certificate Update', 'Office Hours Change', 'Important Health Advisory']),
      message: 'Please be advised of the upcoming health services schedule and requirements.',
      recipientRoles: ['student', 'staff', 'faculty', 'employee'],
      sentBy: randomElement(['Dr. Maria Santos', 'Nurse Ana Reyes', 'System']),
      sentAt: generateRecentDate(),
      type: randomElement(['announcement', 'reminder', 'status_update'] as const),
      read: Math.random() > 0.4,
    });
  }

  return notifications;
}

// Generate audit logs
function generateAuditLogs(users: User[]): AuditLog[] {
  const logs: AuditLog[] = [];
  const actions = [
    { action: 'User Login', module: 'Authentication', type: 'login' as const },
    { action: 'User Logout', module: 'Authentication', type: 'logout' as const },
    { action: 'Create Health Record', module: 'Health Records', type: 'create' as const },
    { action: 'Update Health Record', module: 'Health Records', type: 'update' as const },
    { action: 'View Health Record', module: 'Health Records', type: 'view' as const },
    { action: 'Submit Request', module: 'Request Management', type: 'create' as const },
    { action: 'Update Request Status', module: 'Request Management', type: 'update' as const },
    { action: 'Dispense Medicine', module: 'Inventory', type: 'create' as const },
    { action: 'Update Inventory', module: 'Inventory', type: 'update' as const },
    { action: 'Record Expense', module: 'Liquidation', type: 'create' as const },
    { action: 'Verify Expense', module: 'Liquidation', type: 'update' as const },
    { action: 'Send Notification', module: 'Notifications', type: 'create' as const },
    { action: 'Generate Report', module: 'Reports', type: 'view' as const },
    { action: 'Create User Account', module: 'User Management', type: 'create' as const },
    { action: 'Update User Role', module: 'User Management', type: 'update' as const },
  ];

  // Generate 200+ audit logs
  for (let i = 0; i < 220; i++) {
    const user = randomElement(users);
    const actionItem = randomElement(actions);
    const hours = randomInt(7, 18).toString().padStart(2, '0');
    const minutes = randomInt(0, 59).toString().padStart(2, '0');
    const seconds = randomInt(0, 59).toString().padStart(2, '0');

    logs.push({
      id: `al${i + 1}`,
      userId: user.id,
      userName: user.name,
      action: actionItem.action,
      module: actionItem.module,
      details: `${actionItem.action} performed.`,
      ipAddress: `192.168.1.${randomInt(10, 99)}`,
      timestamp: `${generateRecentDate()} ${hours}:${minutes}:${seconds}`,
      type: actionItem.type,
    });
  }

  // Sort by timestamp descending
  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return logs;
}

// Generate backup records
function generateBackupRecords(): BackupRecord[] {
  const records: BackupRecord[] = [];

  for (let i = 0; i < 30; i++) {
    const daysAgo = i * 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    records.push({
      id: `bk${i + 1}`,
      filename: `healthsys_backup_${dateStr}_03-00.sql`,
      size: `${(2 + Math.random() * 0.5).toFixed(1)} MB`,
      createdAt: `${dateStr} 03:00:00`,
      createdBy: i === 5 ? 'Dr. Maria Santos' : 'System (Scheduled)',
      status: i === 3 ? 'failed' : 'completed',
      type: i === 5 ? 'manual' : 'scheduled',
    });
  }

  return records;
}

// Export generated data
export const mockUsers = generateUsers();
export const runtimeUsers: User[] = [...mockUsers];

export const mockCredentials: Record<string, string> = {
  'admin@gmail.com': 'admin123',
  'officer@gmail.com': 'officer123',
  'student@gmail.com': 'student123',
  'staff@gmail.com': 'staff123',
  'employee@gmail.com': 'employee123',
  'manuel@gmail.com': 'manuel123',
  'faculty@gmail.com': 'faculty123',
  'carlos@gmail.com': 'carlos123',
  'pedro@gmail.com': 'pedro123',
  'anna@gmail.com': 'anna123',
};

export const mockInventory = generateInventory();

// Generate dependent data
export const mockDispensingHistory = generateDispensingHistory(mockUsers, mockInventory);

export const mockHealthRecords = generateHealthRecords(mockUsers, mockDispensingHistory);

export const mockRequests = generateRequests(mockUsers);

export const mockExpenses = generateExpenses();

export const mockNotifications = generateNotifications();

export const mockAuditLogs = generateAuditLogs(mockUsers);

export const mockBackupRecords = generateBackupRecords();

// Legacy exports for backward compatibility
export { mockUsers as mockUsersOriginal };
