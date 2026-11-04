const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Test = require('../models/Test');
const ProductSpecification = require('../models/ProductSpecification');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const COARecord = require('../models/COARecord');
const { connectDB } = require('../config/db');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Starting database seeding process...');

    // Clean existing collections (use raw collection for AuditLog to bypass Mongoose immutability hook)
    await Promise.all([
      User.deleteMany({}),
      Batch.deleteMany({}),
      Test.deleteMany({}),
      ProductSpecification.deleteMany({}),
      AuditLog.collection.deleteMany({}),
      Notification.deleteMany({}),
      COARecord.deleteMany({}),
    ]);

    console.log('[Seed] Cleared existing data.');

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const usersData = [
      {
        username: 'admin',
        email: 'admin@foodlab.lims',
        passwordHash: await bcrypt.hash('Admin@123', salt),
        fullName: 'Alexander Wright',
        role: 'Admin',
        department: 'System Administration & IT',
        isActive: true,
      },
      {
        username: 'labmanager',
        email: 'manager@foodlab.lims',
        passwordHash: await bcrypt.hash('Manager@123', salt),
        fullName: 'Dr. Richard Vance',
        role: 'Lab Manager',
        department: 'Laboratory Operations & Safety',
        isActive: true,
      },
      {
        username: 'analyst',
        email: 'analyst@foodlab.lims',
        passwordHash: await bcrypt.hash('Analyst@123', salt),
        fullName: 'Sarah Jenkins',
        role: 'Lab Analyst',
        department: 'Analytical Chemistry & Microbiology',
        isActive: true,
      },
      {
        username: 'qualitymgr',
        email: 'quality@foodlab.lims',
        passwordHash: await bcrypt.hash('Quality@123', salt),
        fullName: 'Elena Rostova',
        role: 'Quality Manager',
        department: 'Quality Assurance & Regulatory Compliance',
        isActive: true,
      },
      {
        username: 'production',
        email: 'production@foodlab.lims',
        passwordHash: await bcrypt.hash('Prod@123', salt),
        fullName: 'Marcus Chen',
        role: 'Production Staff',
        department: 'Food Manufacturing & Packaging',
        isActive: true,
      },
      {
        username: 'viewer',
        email: 'viewer@foodlab.lims',
        passwordHash: await bcrypt.hash('Viewer@123', salt),
        fullName: 'David Kowalski',
        role: 'Viewer',
        department: 'External Auditing & Oversight',
        isActive: true,
      },
    ];

    const users = await User.insertMany(usersData);
    const userMap = {};
    users.forEach((u) => {
      userMap[u.username] = u;
    });

    console.log(`[Seed] Created ${users.length} user accounts.`);

    // 2. Create Product Specifications
    const specificationsData = [
      // Dairy & Milk Products - Chemical
      {
        productCategory: 'Dairy & Milk Products',
        testCategory: 'Chemical Analysis',
        version: 'v2026.1',
        regulatoryReference: 'Codex Stan 243 / FSSAI Dairy Standards',
        parameters: [
          { name: 'pH Value', unit: 'pH', standardMethod: 'AOAC 981.12', minLimit: 6.4, maxLimit: 6.8, description: 'Normal fresh milk acidity indicator' },
          { name: 'Moisture Content', unit: '%', standardMethod: 'AOAC 990.20', minLimit: 10.0, maxLimit: 14.0, description: 'Total moisture by vacuum oven drying' },
          { name: 'Milk Fat Content', unit: '%', standardMethod: 'Gerber Method / ISO 2446', minLimit: 3.2, maxLimit: 4.5, description: 'Butterfat percentage' },
          { name: 'Protein Content', unit: '%', standardMethod: 'Kjeldahl AOAC 991.20', minLimit: 3.0, maxLimit: 3.8, description: 'Crude protein N x 6.38' },
          { name: 'Titratable Acidity (as Lactic Acid)', unit: '%', standardMethod: 'AOAC 947.05', minLimit: 0.12, maxLimit: 0.16, description: 'Freshness index' },
        ],
      },
      // Dairy & Milk Products - Microbiological
      {
        productCategory: 'Dairy & Milk Products',
        testCategory: 'Microbiological Testing',
        version: 'v2026.1',
        regulatoryReference: 'ISO 4833-1 / FDA BAM Ch 3',
        parameters: [
          { name: 'Total Plate Count (TPC)', unit: 'CFU/g', standardMethod: 'ISO 4833-1', minLimit: 0, maxLimit: 10000, description: 'Aerobic mesophilic bacteria count' },
          { name: 'Escherichia coli', unit: 'per 25g', standardMethod: 'ISO 16649-2', minLimit: null, maxLimit: null, textLimit: 'Absent / 25g', description: 'Fecal coliform indicator' },
          { name: 'Salmonella spp.', unit: 'per 25g', standardMethod: 'ISO 6579-1', minLimit: null, maxLimit: null, textLimit: 'Absent / 25g', description: 'Enteric pathogen' },
          { name: 'Yeast and Mold Count', unit: 'CFU/g', standardMethod: 'ISO 21527-1', minLimit: 0, maxLimit: 50, description: 'Fungal contamination' },
        ],
      },
      // Dairy & Milk Products - Heavy Metals
      {
        productCategory: 'Dairy & Milk Products',
        testCategory: 'Heavy Metals and Contaminants',
        version: 'v2026.1',
        regulatoryReference: 'Codex General Standard for Contaminants Codex Stan 193-1995',
        parameters: [
          { name: 'Lead (Pb)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.02, description: 'Toxic heavy metal limit' },
          { name: 'Arsenic (As)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.1, description: 'Inorganic arsenic' },
          { name: 'Mercury (Hg)', unit: 'ppm', standardMethod: 'Cold Vapor AAS', minLimit: 0, maxLimit: 0.01, description: 'Toxic metal' },
          { name: 'Cadmium (Cd)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.05, description: 'Renal toxic heavy metal' },
        ],
      },
      // Beverages & Juices - Chemical
      {
        productCategory: 'Beverages & Juices',
        testCategory: 'Chemical Analysis',
        version: 'v2026.1',
        regulatoryReference: 'Codex Stan 247 for Fruit Juices',
        parameters: [
          { name: 'Brix / Soluble Solids', unit: '°Bx', standardMethod: 'Refractometer AOAC 932.12', minLimit: 10.5, maxLimit: 12.5, description: 'Total soluble sugar density' },
          { name: 'pH Value', unit: 'pH', standardMethod: 'AOAC 981.12', minLimit: 3.2, maxLimit: 4.0, description: 'Acidic beverage stabilization' },
          { name: 'Titratable Acidity (as Citric Acid)', unit: '%', standardMethod: 'AOAC 942.15', minLimit: 0.6, maxLimit: 1.2, description: 'Citric acid equivalence' },
          { name: 'Ascorbic Acid (Vitamin C)', unit: 'mg/100ml', standardMethod: 'HPLC AOAC 967.21', minLimit: 30.0, maxLimit: 80.0, description: 'Natural antioxidant level' },
        ],
      },
      // Beverages & Juices - Microbiological
      {
        productCategory: 'Beverages & Juices',
        testCategory: 'Microbiological Testing',
        version: 'v2026.1',
        regulatoryReference: 'FDA BAM Ch 3 & 18',
        parameters: [
          { name: 'Total Plate Count (TPC)', unit: 'CFU/ml', standardMethod: 'ISO 4833-1', minLimit: 0, maxLimit: 500, description: 'Standard plate count' },
          { name: 'Coliforms & E. coli', unit: 'CFU/ml', standardMethod: 'ISO 4832', minLimit: null, maxLimit: null, textLimit: 'Absent / 25ml', description: 'Hygiene indicator' },
          { name: 'Yeast and Mold Count', unit: 'CFU/ml', standardMethod: 'ISO 21527-1', minLimit: 0, maxLimit: 20, description: 'Spoilage fungi' },
        ],
      },
      // Beverages & Juices - Heavy Metals
      {
        productCategory: 'Beverages & Juices',
        testCategory: 'Heavy Metals and Contaminants',
        version: 'v2026.1',
        regulatoryReference: 'Codex Stan 193-1995',
        parameters: [
          { name: 'Lead (Pb)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.05, description: 'Heavy metal residue' },
          { name: 'Arsenic (As)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.05, description: 'Toxic metalloid' },
          { name: 'Patulin Mycotoxin', unit: 'ppb', standardMethod: 'HPLC AOAC 995.10', minLimit: 0, maxLimit: 50.0, description: 'Fungal toxin' },
        ],
      },
      // Meat, Poultry & Seafood - Chemical
      {
        productCategory: 'Meat, Poultry & Seafood',
        testCategory: 'Chemical Analysis',
        version: 'v2026.1',
        regulatoryReference: 'USDA-FSIS / Codex Meat Standards',
        parameters: [
          { name: 'Moisture Content', unit: '%', standardMethod: 'AOAC 950.46', minLimit: 65.0, maxLimit: 75.0, description: 'Lean muscle water content' },
          { name: 'Crude Protein Content', unit: '%', standardMethod: 'Kjeldahl AOAC 928.08', minLimit: 19.0, maxLimit: 26.0, description: 'Essential protein ratio' },
          { name: 'Total Crude Fat', unit: '%', standardMethod: 'Soxhlet AOAC 960.39', minLimit: 1.0, maxLimit: 12.0, description: 'Lipid percentage' },
          { name: 'Total Volatile Basic Nitrogen (TVB-N)', unit: 'mg/100g', standardMethod: 'Steam Distillation ISO 937', minLimit: 0, maxLimit: 25.0, description: 'Freshness degradation index' },
        ],
      },
      // Meat, Poultry & Seafood - Microbiological
      {
        productCategory: 'Meat, Poultry & Seafood',
        testCategory: 'Microbiological Testing',
        version: 'v2026.1',
        regulatoryReference: 'ISO 6579 / ISO 11290',
        parameters: [
          { name: 'Total Viable Count', unit: 'CFU/g', standardMethod: 'ISO 4833-1', minLimit: 0, maxLimit: 100000, description: 'Surface bacterial load' },
          { name: 'Salmonella spp.', unit: 'per 25g', standardMethod: 'ISO 6579-1', minLimit: null, maxLimit: null, textLimit: 'Absent / 25g', description: 'Zero tolerance pathogen' },
          { name: 'Listeria monocytogenes', unit: 'per 25g', standardMethod: 'ISO 11290-1', minLimit: null, maxLimit: null, textLimit: 'Absent / 25g', description: 'Psychrotrophic pathogen' },
        ],
      },
      // Meat, Poultry & Seafood - Heavy Metals
      {
        productCategory: 'Meat, Poultry & Seafood',
        testCategory: 'Heavy Metals and Contaminants',
        version: 'v2026.1',
        regulatoryReference: 'EU Regulation 1881/2006 / Codex Stan 193',
        parameters: [
          { name: 'Histamine (Biogenic Amine)', unit: 'ppm', standardMethod: 'HPLC AOAC 977.13', minLimit: 0, maxLimit: 50.0, description: 'Scombroid toxin indicator' },
          { name: 'Total Mercury (Hg)', unit: 'ppm', standardMethod: 'Cold Vapor AAS', minLimit: 0, maxLimit: 0.5, description: 'Bioaccumulated toxin' },
          { name: 'Lead (Pb)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.3, description: 'Trace toxic metal' },
          { name: 'Cadmium (Cd)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.1, description: 'Marine benthic contaminant' },
        ],
      },
      // Bakery & Confectionery - Chemical
      {
        productCategory: 'Bakery & Confectionery',
        testCategory: 'Chemical Analysis',
        version: 'v2026.1',
        regulatoryReference: 'Codex Stan 152 for Wheat Flour',
        parameters: [
          { name: 'Moisture Content', unit: '%', standardMethod: 'AOAC 925.10', minLimit: 8.0, maxLimit: 13.0, description: 'Water activity regulator' },
          { name: 'Total Ash Content', unit: '%', standardMethod: 'AOAC 923.03', minLimit: 0.3, maxLimit: 0.7, description: 'Mineral purity index' },
          { name: 'Crude Protein', unit: '%', standardMethod: 'Kjeldahl AOAC 979.09', minLimit: 11.0, maxLimit: 15.0, description: 'Gluten network capability' },
          { name: 'pH Value', unit: 'pH', standardMethod: 'AOAC 943.02', minLimit: 5.2, maxLimit: 6.2, description: 'Crumb structure acidity' },
        ],
      },
      // Canned & Preserved Foods - Chemical
      {
        productCategory: 'Canned & Preserved Foods',
        testCategory: 'Chemical Analysis',
        version: 'v2026.1',
        regulatoryReference: 'Codex Stan 119 for Canned Fish / 21 CFR 113',
        parameters: [
          { name: 'pH Equilibrium', unit: 'pH', standardMethod: 'AOAC 981.12', minLimit: 5.5, maxLimit: 6.5, description: 'Commercial stability index' },
          { name: 'Sodium Chloride (Salt)', unit: '%', standardMethod: 'Volhard AOAC 971.27', minLimit: 1.0, maxLimit: 2.2, description: 'Preservative salinity' },
          { name: 'Net Drained Weight', unit: '%', standardMethod: 'Codex Method', minLimit: 65.0, maxLimit: 85.0, description: 'Solid meat ratio' },
          { name: 'Headspace Vacuum', unit: 'inHg', standardMethod: 'Bourdon Vacuum Gauge', minLimit: 8.0, maxLimit: 20.0, description: 'Hermetic seal integrity' },
        ],
      },
      // Canned & Preserved Foods - Heavy Metals
      {
        productCategory: 'Canned & Preserved Foods',
        testCategory: 'Heavy Metals and Contaminants',
        version: 'v2026.1',
        regulatoryReference: 'Codex Stan 193-1995',
        parameters: [
          { name: 'Histamine (Fish Scombroid)', unit: 'ppm', standardMethod: 'HPLC AOAC 977.13', minLimit: 0, maxLimit: 50.0, description: 'Decomposition amine' },
          { name: 'Inorganic Tin (Sn)', unit: 'ppm', standardMethod: 'AAS AOAC 985.16', minLimit: 0, maxLimit: 150.0, description: 'Can lacquer migration' },
          { name: 'Lead (Pb)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.2, description: 'Solder/environmental limit' },
        ],
      },
    ];

    await ProductSpecification.insertMany(specificationsData);
    console.log(`[Seed] Created ${specificationsData.length} product specification profiles.`);

    // 3. Create Realistic Food Batches
    const today = new Date();
    const subDays = (d, days) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000);
    const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

    const batchesData = [
      // 1. Fully Approved Batch with COA
      {
        batchId: 'BATCH-2026-1001',
        productName: 'Ultra-Pasteurised Organic Whole Milk 3.5%',
        productCategory: 'Dairy & Milk Products',
        manufacturingDate: subDays(today, 18),
        expiryDate: addDays(today, 42),
        storageTemperature: '4°C ± 1°C',
        storageHumidity: '< 70% RH',
        storageConditions: 'Refrigerated (2-8°C)',
        description: 'Grade-A homogenized certified organic milk from certified pasture herd Lot #4.',
        quantity: 5000,
        unit: 'L',
        status: 'Approved',
        samplingDate: subDays(today, 17),
        sampleLocation: 'Silo Discharge Valve A-2',
        createdBy: userMap['production']._id,
        approvedBy: userMap['qualitymgr']._id,
        approvalDate: subDays(today, 14),
      },
      // 2. Under Lab Testing - Expiring Soon (8 days left)
      {
        batchId: 'BATCH-2026-1002',
        productName: 'Artisan Sourdough Country Loaf',
        productCategory: 'Bakery & Confectionery',
        manufacturingDate: subDays(today, 4),
        expiryDate: addDays(today, 8), // Expiring within 30 days!
        storageTemperature: 'Ambient (20-22°C)',
        storageHumidity: '< 55% RH',
        storageConditions: 'Controlled Dry & Cool',
        description: 'Wild yeast sourdough hearth baked boule with French T65 flour.',
        quantity: 1200,
        unit: 'units',
        status: 'Under Lab Testing',
        samplingDate: subDays(today, 3),
        sampleLocation: 'Cooling Tunnel Conveyor Section 3',
        createdBy: userMap['production']._id,
      },
      // 3. Approved Beverage Batch
      {
        batchId: 'BATCH-2026-1003',
        productName: 'Cold-Pressed Valencia Orange Juice',
        productCategory: 'Beverages & Juices',
        manufacturingDate: subDays(today, 10),
        expiryDate: addDays(today, 25), // Expiring in 25 days!
        storageTemperature: '2°C - 4°C',
        storageHumidity: '< 65% RH',
        storageConditions: 'Refrigerated (2-8°C)',
        description: '100% freshly extracted Valencia oranges, cold HPP treated.',
        quantity: 3500,
        unit: 'L',
        status: 'Approved',
        samplingDate: subDays(today, 9),
        sampleLocation: 'Aseptic Filling Line 1 Tank',
        createdBy: userMap['production']._id,
        approvedBy: userMap['qualitymgr']._id,
        approvalDate: subDays(today, 7),
      },
      // 4. Quarantined Batch (Contaminant Test Failed)
      {
        batchId: 'BATCH-2026-1004',
        productName: 'Yellowfin Tuna Chunks in Olive Oil',
        productCategory: 'Canned & Preserved Foods',
        manufacturingDate: subDays(today, 25),
        expiryDate: addDays(today, 340),
        storageTemperature: 'Ambient (18-25°C)',
        storageHumidity: '< 65% RH',
        storageConditions: 'Ambient (18-25°C)',
        description: 'Pre-cooked yellowfin loins canned with Spanish EVOO.',
        quantity: 8000,
        unit: 'units',
        status: 'Quarantined',
        samplingDate: subDays(today, 24),
        sampleLocation: 'Retort Cooker Basket C-4',
        createdBy: userMap['production']._id,
        quarantineReason: 'Quarantined due to elevated Histamine concentration (68 ppm vs legal max 50 ppm).',
      },
      // 5. Under Lab Testing (Submitted for QA Review)
      {
        batchId: 'BATCH-2026-1005',
        productName: 'Hickory Smoked Premium Chicken Breast',
        productCategory: 'Meat, Poultry & Seafood',
        manufacturingDate: subDays(today, 3),
        expiryDate: addDays(today, 15), // Expiring in 15 days!
        storageTemperature: '0°C - 3°C',
        storageHumidity: '< 75% RH',
        storageConditions: 'Refrigerated (2-8°C)',
        description: 'Whole muscle chicken breasts naturally smoked with hickory wood chips.',
        quantity: 2400,
        unit: 'kg',
        status: 'Under Lab Testing',
        samplingDate: subDays(today, 2),
        sampleLocation: 'Vacuum Seal Station B',
        createdBy: userMap['production']._id,
      },
      // 6. Registered Batch (Just created, pending test assignment)
      {
        batchId: 'BATCH-2026-1006',
        productName: 'Organic Strawberry Greek Yogurt 150g',
        productCategory: 'Dairy & Milk Products',
        manufacturingDate: subDays(today, 1),
        expiryDate: addDays(today, 30),
        storageTemperature: '4°C ± 1°C',
        storageHumidity: '< 65% RH',
        storageConditions: 'Refrigerated (2-8°C)',
        description: 'Strained whole milk yogurt with fruit compote bottom.',
        quantity: 4000,
        unit: 'units',
        status: 'Registered',
        samplingDate: subDays(today, 1),
        sampleLocation: 'Packaging Carousel 2',
        createdBy: userMap['production']._id,
      },
      // 7. Expired Batch (Testing expiry alert highlights!)
      {
        batchId: 'BATCH-2026-1007',
        productName: 'Cultured Probiotic Buttermilk 500ml',
        productCategory: 'Dairy & Milk Products',
        manufacturingDate: subDays(today, 45),
        expiryDate: subDays(today, 5), // EXPIRED 5 days ago!
        storageTemperature: '4°C',
        storageHumidity: '< 65% RH',
        storageConditions: 'Refrigerated (2-8°C)',
        description: 'Traditional cultured buttermilk with active probiotic strains.',
        quantity: 850,
        unit: 'units',
        status: 'Quarantined',
        samplingDate: subDays(today, 44),
        sampleLocation: 'Cold Room Shelf D',
        createdBy: userMap['production']._id,
        quarantineReason: 'Product shelf-life has expired; quarantined pending safe destruction disposal.',
      },
    ];

    const batches = await Batch.insertMany(batchesData);
    const batchMap = {};
    batches.forEach((b) => {
      batchMap[b.batchId] = b;
    });

    console.log(`[Seed] Created ${batches.length} realistic food batches.`);

    // 4. Create Detailed Lab Tests with Parameters
    const testsData = [
      // Test 1: Chemical for BATCH-2026-1001 (Passed)
      {
        testId: 'TEST-CH-2026-1001',
        batch: batchMap['BATCH-2026-1001']._id,
        batchId: 'BATCH-2026-1001',
        sampleDescription: 'Pasteurised Whole Milk Core Sample',
        testCategory: 'Chemical Analysis',
        sampleCollectionDate: subDays(today, 17),
        analysisStartDate: subDays(today, 16),
        analysisCompletionDate: subDays(today, 15),
        analyst: userMap['analyst']._id,
        analystName: 'Sarah Jenkins',
        parameters: [
          { name: 'pH Value', unit: 'pH', standardMethod: 'AOAC 981.12', minLimit: 6.4, maxLimit: 6.8, observedValue: 6.64, status: 'Pass', remarks: 'Optimal neutral milk pH' },
          { name: 'Moisture Content', unit: '%', standardMethod: 'AOAC 990.20', minLimit: 10.0, maxLimit: 14.0, observedValue: 12.1, status: 'Pass', remarks: 'In compliance' },
          { name: 'Milk Fat Content', unit: '%', standardMethod: 'Gerber Method', minLimit: 3.2, maxLimit: 4.5, observedValue: 3.58, status: 'Pass', remarks: 'Meets whole milk standard' },
          { name: 'Protein Content', unit: '%', standardMethod: 'Kjeldahl AOAC 991.20', minLimit: 3.0, maxLimit: 3.8, observedValue: 3.32, status: 'Pass', remarks: 'Good protein density' },
          { name: 'Titratable Acidity', unit: '%', standardMethod: 'AOAC 947.05', minLimit: 0.12, maxLimit: 0.16, observedValue: 0.14, status: 'Pass', remarks: 'Fresh milk acidity' },
        ],
        overallOutcome: 'Pass',
        qaReview: {
          reviewedBy: userMap['qualitymgr']._id,
          reviewerName: 'Elena Rostova',
          reviewDate: subDays(today, 14),
          decision: 'Approved',
          comments: 'Chemical profile conforms to Codex Stan 243 standards.',
        },
      },
      // Test 2: Microbiological for BATCH-2026-1001 (Passed)
      {
        testId: 'TEST-MB-2026-1001',
        batch: batchMap['BATCH-2026-1001']._id,
        batchId: 'BATCH-2026-1001',
        sampleDescription: 'Aseptic Filling Silo Sample',
        testCategory: 'Microbiological Testing',
        sampleCollectionDate: subDays(today, 17),
        analysisStartDate: subDays(today, 16),
        analysisCompletionDate: subDays(today, 15),
        analyst: userMap['analyst']._id,
        analystName: 'Sarah Jenkins',
        parameters: [
          { name: 'Total Plate Count (TPC)', unit: 'CFU/g', standardMethod: 'ISO 4833-1', minLimit: 0, maxLimit: 10000, observedValue: 240, status: 'Pass', remarks: 'Well below 10,000 threshold' },
          { name: 'Escherichia coli', unit: 'per 25g', standardMethod: 'ISO 16649-2', textLimit: 'Absent / 25g', observedValue: 'Absent / 25g', status: 'Pass', remarks: 'Negative' },
          { name: 'Salmonella spp.', unit: 'per 25g', standardMethod: 'ISO 6579-1', textLimit: 'Absent / 25g', observedValue: 'Absent / 25g', status: 'Pass', remarks: 'Negative' },
          { name: 'Yeast and Mold Count', unit: 'CFU/g', standardMethod: 'ISO 21527-1', minLimit: 0, maxLimit: 50, observedValue: 4, status: 'Pass', remarks: 'Clean' },
        ],
        overallOutcome: 'Pass',
        qaReview: {
          reviewedBy: userMap['qualitymgr']._id,
          reviewerName: 'Elena Rostova',
          reviewDate: subDays(today, 14),
          decision: 'Approved',
          comments: 'Microbiological safety confirmed. Safe for commercial release.',
        },
      },
      // Test 3: Heavy Metals for BATCH-2026-1001 (Passed)
      {
        testId: 'TEST-HM-2026-1001',
        batch: batchMap['BATCH-2026-1001']._id,
        batchId: 'BATCH-2026-1001',
        sampleDescription: 'Bulk Tanker Homogenized Composite',
        testCategory: 'Heavy Metals and Contaminants',
        sampleCollectionDate: subDays(today, 17),
        analysisStartDate: subDays(today, 16),
        analysisCompletionDate: subDays(today, 14),
        analyst: userMap['analyst']._id,
        analystName: 'Sarah Jenkins',
        parameters: [
          { name: 'Lead (Pb)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.02, observedValue: 0.003, status: 'Pass', remarks: 'Trace negligible' },
          { name: 'Arsenic (As)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.1, observedValue: 0.008, status: 'Pass', remarks: 'Conforms' },
          { name: 'Mercury (Hg)', unit: 'ppm', standardMethod: 'Cold Vapor AAS', minLimit: 0, maxLimit: 0.01, observedValue: 0.001, status: 'Pass', remarks: 'Complies' },
          { name: 'Cadmium (Cd)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.05, observedValue: 0.002, status: 'Pass', remarks: 'Complies' },
        ],
        overallOutcome: 'Pass',
        qaReview: {
          reviewedBy: userMap['qualitymgr']._id,
          reviewerName: 'Elena Rostova',
          reviewDate: subDays(today, 14),
          decision: 'Approved',
          comments: 'All heavy metals well below maximum limits.',
        },
      },
      // Test 4: Chemical for BATCH-2026-1002 (In Progress)
      {
        testId: 'TEST-CH-2026-1002',
        batch: batchMap['BATCH-2026-1002']._id,
        batchId: 'BATCH-2026-1002',
        sampleDescription: 'Finished Sourdough Crumb Sample',
        testCategory: 'Chemical Analysis',
        sampleCollectionDate: subDays(today, 3),
        analysisStartDate: subDays(today, 2),
        analyst: userMap['analyst']._id,
        analystName: 'Sarah Jenkins',
        parameters: [
          { name: 'Moisture Content', unit: '%', standardMethod: 'AOAC 925.10', minLimit: 8.0, maxLimit: 13.0, observedValue: 11.4, status: 'Pass', remarks: 'Moisture compliant' },
          { name: 'Total Ash Content', unit: '%', standardMethod: 'AOAC 923.03', minLimit: 0.3, maxLimit: 0.7, observedValue: 0.52, status: 'Pass', remarks: 'Mineral ash within norm' },
          { name: 'Crude Protein', unit: '%', standardMethod: 'Kjeldahl AOAC 979.09', minLimit: 11.0, maxLimit: 15.0, observedValue: 12.8, status: 'Pass', remarks: 'Strong gluten flour' },
          { name: 'pH Value', unit: 'pH', standardMethod: 'AOAC 943.02', minLimit: 5.2, maxLimit: 6.2, observedValue: '', status: 'Pending', remarks: 'Incubation in progress' },
        ],
        overallOutcome: 'In Progress',
      },
      // Test 5: Chemical for BATCH-2026-1003 (Passed)
      {
        testId: 'TEST-CH-2026-1003',
        batch: batchMap['BATCH-2026-1003']._id,
        batchId: 'BATCH-2026-1003',
        sampleDescription: 'Fresh Valencia Juice Bottle Extract',
        testCategory: 'Chemical Analysis',
        sampleCollectionDate: subDays(today, 9),
        analysisStartDate: subDays(today, 8),
        analysisCompletionDate: subDays(today, 7),
        analyst: userMap['analyst']._id,
        analystName: 'Sarah Jenkins',
        parameters: [
          { name: 'Brix / Soluble Solids', unit: '°Bx', standardMethod: 'AOAC 932.12', minLimit: 10.5, maxLimit: 12.5, observedValue: 11.8, status: 'Pass', remarks: 'Rich citrus brix' },
          { name: 'pH Value', unit: 'pH', standardMethod: 'AOAC 981.12', minLimit: 3.2, maxLimit: 4.0, observedValue: 3.65, status: 'Pass', remarks: 'Natural acidity' },
          { name: 'Titratable Acidity', unit: '%', standardMethod: 'AOAC 942.15', minLimit: 0.6, maxLimit: 1.2, observedValue: 0.88, status: 'Pass', remarks: 'Balanced flavor' },
          { name: 'Ascorbic Acid (Vitamin C)', unit: 'mg/100ml', standardMethod: 'HPLC AOAC 967.21', minLimit: 30.0, maxLimit: 80.0, observedValue: 48.5, status: 'Pass', remarks: 'High natural vitamin C' },
        ],
        overallOutcome: 'Pass',
        qaReview: {
          reviewedBy: userMap['qualitymgr']._id,
          reviewerName: 'Elena Rostova',
          reviewDate: subDays(today, 7),
          decision: 'Approved',
          comments: 'Exceeds retail quality benchmarks.',
        },
      },
      // Test 6: Heavy Metals for BATCH-2026-1004 (FAILED - Quarantined batch)
      {
        testId: 'TEST-HM-2026-1004',
        batch: batchMap['BATCH-2026-1004']._id,
        batchId: 'BATCH-2026-1004',
        sampleDescription: 'Canned Tuna Retort Composite Can #14',
        testCategory: 'Heavy Metals and Contaminants',
        sampleCollectionDate: subDays(today, 24),
        analysisStartDate: subDays(today, 23),
        analysisCompletionDate: subDays(today, 22),
        analyst: userMap['analyst']._id,
        analystName: 'Sarah Jenkins',
        parameters: [
          { name: 'Histamine (Fish Scombroid)', unit: 'ppm', standardMethod: 'HPLC AOAC 977.13', minLimit: 0, maxLimit: 50.0, observedValue: 68.4, status: 'Fail', remarks: 'OUT OF SPECIFICATION: Exceeds 50 ppm safety ceiling' },
          { name: 'Inorganic Tin (Sn)', unit: 'ppm', standardMethod: 'AAS AOAC 985.16', minLimit: 0, maxLimit: 150.0, observedValue: 18.2, status: 'Pass', remarks: 'Can lining intact' },
          { name: 'Lead (Pb)', unit: 'ppm', standardMethod: 'ICP-MS EPA 200.8', minLimit: 0, maxLimit: 0.2, observedValue: 0.04, status: 'Pass', remarks: 'Within limit' },
        ],
        overallOutcome: 'Fail',
        qaReview: {
          reviewedBy: userMap['qualitymgr']._id,
          reviewerName: 'Elena Rostova',
          reviewDate: subDays(today, 21),
          decision: 'Rejected',
          comments: 'REJECTED: Histamine level of 68.4 ppm poses biogenic amine poisoning risk. Entire batch quarantined.',
        },
      },
      // Test 7: Chemical for BATCH-2026-1005 (SUBMITTED for QA Review)
      {
        testId: 'TEST-CH-2026-1005',
        batch: batchMap['BATCH-2026-1005']._id,
        batchId: 'BATCH-2026-1005',
        sampleDescription: 'Hickory Smoked Chicken Breast Fillet Sample',
        testCategory: 'Chemical Analysis',
        sampleCollectionDate: subDays(today, 2),
        analysisStartDate: subDays(today, 2),
        analysisCompletionDate: subDays(today, 1),
        analyst: userMap['analyst']._id,
        analystName: 'Sarah Jenkins',
        parameters: [
          { name: 'Moisture Content', unit: '%', standardMethod: 'AOAC 950.46', minLimit: 65.0, maxLimit: 75.0, observedValue: 69.2, status: 'Pass', remarks: 'Juicy texture retention' },
          { name: 'Crude Protein Content', unit: '%', standardMethod: 'Kjeldahl AOAC 928.08', minLimit: 19.0, maxLimit: 26.0, observedValue: 23.4, status: 'Pass', remarks: 'High protein content' },
          { name: 'Total Crude Fat', unit: '%', standardMethod: 'Soxhlet AOAC 960.39', minLimit: 1.0, maxLimit: 12.0, observedValue: 4.2, status: 'Pass', remarks: 'Lean poultry specification' },
          { name: 'Total Volatile Basic Nitrogen', unit: 'mg/100g', standardMethod: 'ISO 937', minLimit: 0, maxLimit: 25.0, observedValue: 11.5, status: 'Pass', remarks: 'Very fresh meat indicator' },
        ],
        overallOutcome: 'Submitted', // Awaiting QA Manager review
      },
      // Test 8: Microbiological for BATCH-2026-1005 (SUBMITTED for QA Review)
      {
        testId: 'TEST-MB-2026-1005',
        batch: batchMap['BATCH-2026-1005']._id,
        batchId: 'BATCH-2026-1005',
        sampleDescription: 'Smoked Chicken Swab & Core Composite',
        testCategory: 'Microbiological Testing',
        sampleCollectionDate: subDays(today, 2),
        analysisStartDate: subDays(today, 2),
        analysisCompletionDate: subDays(today, 1),
        analyst: userMap['analyst']._id,
        analystName: 'Sarah Jenkins',
        parameters: [
          { name: 'Total Viable Count', unit: 'CFU/g', standardMethod: 'ISO 4833-1', minLimit: 0, maxLimit: 100000, observedValue: 1800, status: 'Pass', remarks: 'Well below 100,000 threshold' },
          { name: 'Salmonella spp.', unit: 'per 25g', standardMethod: 'ISO 6579-1', textLimit: 'Absent / 25g', observedValue: 'Absent / 25g', status: 'Pass', remarks: 'Negative' },
          { name: 'Listeria monocytogenes', unit: 'per 25g', standardMethod: 'ISO 11290-1', textLimit: 'Absent / 25g', observedValue: 'Absent / 25g', status: 'Pass', remarks: 'Negative' },
        ],
        overallOutcome: 'Submitted', // Awaiting QA review
      },
    ];

    const tests = await Test.insertMany(testsData);
    console.log(`[Seed] Created ${tests.length} laboratory test records.`);

    // 5. Create Official Certificate of Analysis for BATCH-2026-1001
    const coaData = {
      certificateNumber: 'COA-2026-00101',
      batch: batchMap['BATCH-2026-1001']._id,
      batchId: 'BATCH-2026-1001',
      productName: 'Ultra-Pasteurised Organic Whole Milk 3.5%',
      productCategory: 'Dairy & Milk Products',
      manufacturingDate: batchMap['BATCH-2026-1001'].manufacturingDate,
      expiryDate: batchMap['BATCH-2026-1001'].expiryDate,
      storageConditions: 'Refrigerated (2-8°C) (4°C ± 1°C)',
      sampleInfo: {
        sampleId: 'SMP-BATCH-2026-1001',
        collectionDate: subDays(today, 17),
        sampleLocation: 'Silo Discharge Valve A-2',
      },
      testResults: {
        chemical: [
          { parameter: 'pH Value', unit: 'pH', method: 'AOAC 981.12', specification: '6.4 - 6.8 pH', observed: 6.64, result: 'PASS' },
          { parameter: 'Moisture Content', unit: '%', method: 'AOAC 990.20', specification: '10 - 14 %', observed: 12.1, result: 'PASS' },
          { parameter: 'Milk Fat Content', unit: '%', method: 'Gerber Method', specification: '3.2 - 4.5 %', observed: 3.58, result: 'PASS' },
          { parameter: 'Protein Content', unit: '%', method: 'Kjeldahl AOAC 991.20', specification: '3.0 - 3.8 %', observed: 3.32, result: 'PASS' },
          { parameter: 'Titratable Acidity', unit: '%', method: 'AOAC 947.05', specification: '0.12 - 0.16 %', observed: 0.14, result: 'PASS' },
        ],
        microbiological: [
          { parameter: 'Total Plate Count (TPC)', unit: 'CFU/g', method: 'ISO 4833-1', specification: 'Max 10000 CFU/g', observed: 240, result: 'PASS' },
          { parameter: 'Escherichia coli', unit: 'per 25g', method: 'ISO 16649-2', specification: 'Absent / 25g', observed: 'Absent / 25g', result: 'PASS' },
          { parameter: 'Salmonella spp.', unit: 'per 25g', method: 'ISO 6579-1', specification: 'Absent / 25g', observed: 'Absent / 25g', result: 'PASS' },
          { parameter: 'Yeast and Mold Count', unit: 'CFU/g', method: 'ISO 21527-1', specification: 'Max 50 CFU/g', observed: 4, result: 'PASS' },
        ],
        heavyMetals: [
          { parameter: 'Lead (Pb)', unit: 'ppm', method: 'ICP-MS EPA 200.8', specification: 'Max 0.02 ppm', observed: 0.003, result: 'PASS' },
          { parameter: 'Arsenic (As)', unit: 'ppm', method: 'ICP-MS EPA 200.8', specification: 'Max 0.1 ppm', observed: 0.008, result: 'PASS' },
          { parameter: 'Mercury (Hg)', unit: 'ppm', method: 'Cold Vapor AAS', specification: 'Max 0.01 ppm', observed: 0.001, result: 'PASS' },
          { parameter: 'Cadmium (Cd)', unit: 'ppm', method: 'ICP-MS EPA 200.8', specification: 'Max 0.05 ppm', observed: 0.002, result: 'PASS' },
        ],
      },
      overallVerdict: 'CONFORMS TO FSSAI & CODEX REGULATORY SPECIFICATIONS - APPROVED FOR COMMERCIAL RELEASE',
      issuedBy: userMap['qualitymgr']._id,
      issuedByName: 'Elena Rostova',
      issueDate: subDays(today, 14),
      accreditationStandard: 'ISO/IEC 17025:2017 Testing Laboratory Accreditation (NABL / ILAC MRA)',
      status: 'Issued',
      notes: 'All test samples verified under strict GMP protocols. Zero trace contaminants observed.',
    };

    await COARecord.create(coaData);
    console.log('[Seed] Created Certificate of Analysis record COA-2026-00101.');

    // 6. Create Audit Trail Logs
    const auditLogsData = [
      {
        username: 'production',
        userRole: 'Production Staff',
        userId: userMap['production']._id,
        action: 'BATCH_CREATE',
        entityType: 'Batch',
        entityId: 'BATCH-2026-1001',
        description: 'Registered new batch BATCH-2026-1001 (Ultra-Pasteurised Organic Whole Milk 3.5%).',
        timestamp: subDays(today, 18),
      },
      {
        username: 'analyst',
        userRole: 'Lab Analyst',
        userId: userMap['analyst']._id,
        action: 'TEST_CREATE',
        entityType: 'Test',
        entityId: 'TEST-CH-2026-1001',
        description: 'Initiated Chemical Analysis for BATCH-2026-1001.',
        timestamp: subDays(today, 16),
      },
      {
        username: 'analyst',
        userRole: 'Lab Analyst',
        userId: userMap['analyst']._id,
        action: 'TEST_SUBMIT',
        entityType: 'Test',
        entityId: 'TEST-CH-2026-1001',
        description: 'Analyst Sarah Jenkins submitted Chemical Analysis readings for QA review.',
        timestamp: subDays(today, 15),
      },
      {
        username: 'qualitymgr',
        userRole: 'Quality Manager',
        userId: userMap['qualitymgr']._id,
        action: 'QA_APPROVE',
        entityType: 'Test',
        entityId: 'TEST-CH-2026-1001',
        description: 'QA Manager Elena Rostova approved Chemical Analysis test TEST-CH-2026-1001.',
        timestamp: subDays(today, 14),
      },
      {
        username: 'qualitymgr',
        userRole: 'Quality Manager',
        userId: userMap['qualitymgr']._id,
        action: 'BATCH_STATUS_CHANGE',
        entityType: 'Batch',
        entityId: 'BATCH-2026-1001',
        description: 'Batch BATCH-2026-1001 status changed from Under Lab Testing to Approved.',
        timestamp: subDays(today, 14),
      },
      {
        username: 'qualitymgr',
        userRole: 'Quality Manager',
        userId: userMap['qualitymgr']._id,
        action: 'COA_GENERATE',
        entityType: 'COA',
        entityId: 'COA-2026-00101',
        description: 'Issued official Certificate of Analysis COA-2026-00101 for BATCH-2026-1001.',
        timestamp: subDays(today, 14),
      },
      {
        username: 'analyst',
        userRole: 'Lab Analyst',
        userId: userMap['analyst']._id,
        action: 'TEST_SUBMIT',
        entityType: 'Test',
        entityId: 'TEST-HM-2026-1004',
        description: 'Submitted Heavy Metals and Contaminants test for BATCH-2026-1004.',
        timestamp: subDays(today, 22),
      },
      {
        username: 'qualitymgr',
        userRole: 'Quality Manager',
        userId: userMap['qualitymgr']._id,
        action: 'QA_REJECT',
        entityType: 'Test',
        entityId: 'TEST-HM-2026-1004',
        description: 'QA Manager Elena Rostova rejected test TEST-HM-2026-1004 due to out-of-spec Histamine.',
        timestamp: subDays(today, 21),
      },
      {
        username: 'qualitymgr',
        userRole: 'Quality Manager',
        userId: userMap['qualitymgr']._id,
        action: 'BATCH_STATUS_CHANGE',
        entityType: 'Batch',
        entityId: 'BATCH-2026-1004',
        description: 'Batch BATCH-2026-1004 placed in QUARANTINE due to Histamine non-compliance.',
        timestamp: subDays(today, 21),
      },
      {
        username: 'analyst',
        userRole: 'Lab Analyst',
        userId: userMap['analyst']._id,
        action: 'TEST_SUBMIT',
        entityType: 'Test',
        entityId: 'TEST-CH-2026-1005',
        description: 'Analyst Sarah Jenkins submitted Chemical Analysis for BATCH-2026-1005 for QA sign-off.',
        timestamp: subDays(today, 1),
      },
    ];

    await AuditLog.insertMany(auditLogsData);
    console.log(`[Seed] Created ${auditLogsData.length} immutable audit logs.`);

    // 7. Create Notifications
    const notificationsData = [
      {
        recipientRole: 'Quality Manager',
        title: 'Tests Awaiting QA Review',
        message: 'Batch BATCH-2026-1005 (Smoked Chicken Breast) has 2 analytical tests submitted and awaiting review.',
        type: 'warning',
        link: '/qa-review',
        entityId: 'BATCH-2026-1005',
        createdAt: subDays(today, 1),
      },
      {
        recipientRole: 'All',
        title: 'CRITICAL: Batch Quarantined',
        message: 'Batch BATCH-2026-1004 (Yellowfin Tuna Chunks) was placed in Quarantine due to elevated Histamine (68.4 ppm).',
        type: 'danger',
        link: '/batches/BATCH-2026-1004',
        entityId: 'BATCH-2026-1004',
        createdAt: subDays(today, 21),
      },
      {
        recipientRole: 'All',
        title: 'Batch Approved & COA Issued',
        message: 'Batch BATCH-2026-1001 (Organic Whole Milk) passed all laboratory tests. COA-2026-00101 is available.',
        type: 'success',
        link: '/coa?batchId=BATCH-2026-1001',
        entityId: 'BATCH-2026-1001',
        createdAt: subDays(today, 14),
      },
      {
        recipientRole: 'Production Staff',
        title: 'Product Expiring Soon Alert',
        message: 'Batch BATCH-2026-1002 (Sourdough Loaf) will reach expiry in 8 days. Plan distribution immediately.',
        type: 'warning',
        link: '/expiry-monitoring',
        entityId: 'BATCH-2026-1002',
        createdAt: today,
      },
    ];

    await Notification.insertMany(notificationsData);
    console.log(`[Seed] Created ${notificationsData.length} system notifications.`);

    console.log('[Seed] Seeding completed successfully!');
  } catch (error) {
    console.error('[Seed Error]', error);
  }
};

// Allow standalone execution: `node seed/seedData.js`
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  connectDB().then(async () => {
    await seedDatabase();
    process.exit(0);
  });
}

module.exports = seedDatabase;
