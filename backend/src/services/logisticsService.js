/**
 * logisticsService.js
 * 
 * Remote Logistics, Spare Parts Inventory, and Expedition Resupply Intelligence
 * for Indian Antarctic Research Stations (Bharati & Maitri).
 * 
 * Directly addresses the 4th pillar of the Ministry of Earth Sciences (MoES) / NCPOR
 * Problem Statement: "integrating infrastructure, energy, logistics and environmental monitoring".
 */

const bharatiSpares = [
    {
        id: 'SP-BHR-01',
        name: 'CAT-C32 Crankshaft Bearing Assembly',
        partNumber: 'CAT-245-8120-POLAR',
        category: 'MECHANICAL_CRITICAL',
        compatibleAssets: ['DG-001', 'DG-002'],
        quantityOnHand: 2,
        minThreshold: 1,
        unit: 'Set',
        location: 'Workshop Bay 2 - Bin M-14',
        condition: 'SEALED_PRESERVED',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Pre-treated with arctic anti-corrosion grease.'
    },
    {
        id: 'SP-BHR-02',
        name: 'High-Pressure Fuel Injection Pump & Solenoid',
        partNumber: 'CAT-380-4591-HP',
        category: 'FUEL_SYSTEM',
        compatibleAssets: ['DG-001', 'DG-002', 'FUEL-01'],
        quantityOnHand: 1,
        minThreshold: 1,
        unit: 'Assembly',
        location: 'Storage Container C-4',
        condition: 'READY_IN_RESERVE',
        status: 'LOW',
        reorderLeadDays: 280,
        notes: 'Critical spare. Minimum threshold reached.'
    },
    {
        id: 'SP-BHR-03',
        name: 'Chiller Scroll Compressor & R410a Polar Seal Kit',
        partNumber: 'DAIKIN-SC-410A-EXT',
        category: 'HVAC_LIFE_SUPPORT',
        compatibleAssets: ['HVAC-01', 'HVAC-02', 'HVAC-03'],
        quantityOnHand: 1,
        minThreshold: 1,
        unit: 'Unit',
        location: 'HVAC Mechanical Plant Annex',
        condition: 'INSPECTED',
        status: 'LOW',
        reorderLeadDays: 280,
        notes: 'Essential for Server Room & Life-Support Habitat cooling.'
    },
    {
        id: 'SP-BHR-04',
        name: 'Magnetic Impeller & Viton Shaft Seals',
        partNumber: 'GRUNDFOS-PMP-150L',
        category: 'COOLING_PUMP',
        compatibleAssets: ['PUMP-01', 'PUMP-02'],
        quantityOnHand: 3,
        minThreshold: 2,
        unit: 'Kit',
        location: 'Pump House Bay Alpha',
        condition: 'SEALED_PRESERVED',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Full rebuild kit for main coolant circulation pumps.'
    },
    {
        id: 'SP-BHR-05',
        name: '24V LiFePO4 Smart Battery Balancer Module',
        partNumber: 'VIC-BMS-24V-ARCTIC',
        category: 'ELECTRICAL_STORAGE',
        compatibleAssets: ['BAT-01', 'BAT-02'],
        quantityOnHand: 4,
        minThreshold: 2,
        unit: 'Module',
        location: 'Electrical Room Alpha - Rack B',
        condition: 'TESTED_READY',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Microprocessor controlled cell balancer with low-temp charge cutoff.'
    },
    {
        id: 'SP-BHR-06',
        name: 'Ku-Band 25W Block Upconverter (BUC) & Transceiver',
        partNumber: 'SAT-KU-25W-EXTREME',
        category: 'COMMUNICATIONS',
        compatibleAssets: ['COM-01'],
        quantityOnHand: 1,
        minThreshold: 1,
        unit: 'Unit',
        location: 'Satellite Radome Lower Cabin',
        condition: 'SEALED_PRESERVED',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Mainland uplink transmitter spare for Ku-band dome.'
    },
    {
        id: 'SP-BHR-07',
        name: 'Bulk Fuel Coalescing Filter Element (10 Micron)',
        partNumber: 'RACOR-1000FH-POLAR',
        category: 'CONSUMABLE_CRITICAL',
        compatibleAssets: ['FUEL-01', 'DG-001', 'DG-002'],
        quantityOnHand: 14,
        minThreshold: 6,
        unit: 'Elements',
        location: 'Fuel Bunker Storage Bay',
        condition: 'NEW_IN_BOX',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Removes water ice crystals and particulate from Arctic Jet A-1 / Diesel.'
    },
    {
        id: 'SP-BHR-08',
        name: 'Vaisala AWS310 Ultrasonic Anemometer & De-icing Head',
        partNumber: 'VAI-WMT700-HEAT',
        category: 'METEOROLOGY',
        compatibleAssets: ['ENV-01'],
        quantityOnHand: 1,
        minThreshold: 1,
        unit: 'Sensor Head',
        location: 'Science Instrumentation Locker',
        condition: 'CALIBRATED',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Calibrated at NCPOR Goa metrology lab before deployment.'
    }
];

const maitriSpares = [
    {
        id: 'SP-MTR-01',
        name: 'Kirloskar 800kW Injector Pump & Nozzle Overhaul Set',
        partNumber: 'KIR-INJ-800-ARCTIC',
        category: 'MECHANICAL_CRITICAL',
        compatibleAssets: ['MTR-DG-01', 'MTR-DG-02'],
        quantityOnHand: 2,
        minThreshold: 1,
        unit: 'Set',
        location: 'Maitri Generator Complex Bay 1',
        condition: 'SEALED_PRESERVED',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Main generator overhaul kit.'
    },
    {
        id: 'SP-MTR-02',
        name: 'Priyadarshini Lake Deep-Well Submersible Pump Head',
        partNumber: 'KSB-PUMP-SUB-120L',
        category: 'LIFE_SUPPORT_WATER',
        compatibleAssets: ['MTR-PUMP-01'],
        quantityOnHand: 1,
        minThreshold: 1,
        unit: 'Unit',
        location: 'Priyadarshini Lake Pump Station Hut',
        condition: 'READY_IN_RESERVE',
        status: 'LOW',
        reorderLeadDays: 280,
        notes: 'Vital drinking and utility water liftoff pump. Only 1 spare on station.'
    },
    {
        id: 'SP-MTR-03',
        name: 'Maitri Habitat Ducted Air Handler Heating Elements',
        partNumber: 'HEAT-ELEM-24KW-415V',
        category: 'HVAC_LIFE_SUPPORT',
        compatibleAssets: ['MTR-HVAC-01'],
        quantityOnHand: 2,
        minThreshold: 2,
        unit: 'Pair',
        location: 'Maitri Core Habitation Module',
        condition: 'INSPECTED',
        status: 'LOW',
        reorderLeadDays: 280,
        notes: 'Essential for crew quarters heating during -45°C katabatic winds.'
    },
    {
        id: 'SP-MTR-04',
        name: 'Deep-Cycle Tubular Gel Battery Cell (2V 500Ah)',
        partNumber: 'EXIDE-TUB-500AH-GEL',
        category: 'ELECTRICAL_STORAGE',
        compatibleAssets: ['MTR-BAT-01'],
        quantityOnHand: 6,
        minThreshold: 4,
        unit: 'Cells',
        location: 'Battery House North Annex',
        condition: 'FLOAT_CHARGED',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Tested monthly under float voltage.'
    },
    {
        id: 'SP-MTR-05',
        name: 'Heated Trace-Line Fuel Pipe Joint & Valve Spare',
        partNumber: 'RAYCHEM-TRACE-FUEL-50M',
        category: 'FUEL_SYSTEM',
        compatibleAssets: ['MTR-FUEL-01'],
        quantityOnHand: 2,
        minThreshold: 1,
        unit: 'Assembly',
        location: 'Maitri Bulk Tank Compound',
        condition: 'NEW_IN_BOX',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Prevents diesel gelling at temperatures below -35°C.'
    }
];

const maitri2Spares = [
    {
        id: 'SP-M2-01',
        name: 'Northern Polar 120kW Pitch Actuator & Blade De-icer',
        partNumber: 'EWT-ACTUATOR-POLAR',
        category: 'WIND_TURBINE',
        compatibleAssets: ['M2-WIND-01'],
        quantityOnHand: 2,
        minThreshold: 1,
        unit: 'Kit',
        location: 'Maitri-II Technical Hangar Bay 1',
        condition: 'SEALED_PRESERVED',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Microgrid wind turbine yaw and pitch overhaul assembly.'
    },
    {
        id: 'SP-M2-02',
        name: 'PEM Electrolyzer & Fuel Cell Stack Membrane',
        partNumber: 'HORIZON-PEM-100KW',
        category: 'HYDROGEN_ENERGY',
        compatibleAssets: ['M2-H2-01'],
        quantityOnHand: 1,
        minThreshold: 1,
        unit: 'Stack',
        location: 'Green Hydrogen Storage Vault',
        condition: 'NITROGEN_PURGED',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Zero-carbon backup power cell stack.'
    },
    {
        id: 'SP-M2-03',
        name: 'Liquid Cooling Inverter & 1.2MWh BMS Controller',
        partNumber: 'TESLA-MEGAPACK-INV-POLAR',
        category: 'ELECTRICAL_STORAGE',
        compatibleAssets: ['M2-BESS-01'],
        quantityOnHand: 2,
        minThreshold: 1,
        unit: 'Module',
        location: 'Maitri-II Battery Complex',
        condition: 'FLOAT_CHARGED',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Direct replacement for primary BESS microgrid inverter.'
    },
    {
        id: 'SP-M2-04',
        name: 'Geothermal Ground-Loop Circulation Pump',
        partNumber: 'WILO-GEO-PUMP-EXT',
        category: 'HVAC_LIFE_SUPPORT',
        compatibleAssets: ['M2-HVAC-01'],
        quantityOnHand: 2,
        minThreshold: 1,
        unit: 'Unit',
        location: 'Maitri-II Thermal Utility Bay',
        condition: 'READY_IN_RESERVE',
        status: 'OPTIMAL',
        reorderLeadDays: 280,
        notes: 'Extracts deep permafrost thermal energy for living module heating.'
    }
];

/**
 * 44th Indian Scientific Expedition to Antarctica (ISEA) Resupply Vessel Data.
 * Chartered by National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences.
 */
function getResupplyVesselStatus(stationCode = 'BHR') {
    const isBharati = stationCode === 'BHR';
    
    // Austral summer resupply window timeline
    return {
        vesselName: 'MV Vasiliy Golovnin',
        callSign: 'UBRV',
        vesselType: 'Ice-Strengthened Polar Cargo / Research Vessel',
        iceClass: 'DNV 1A Super / Russian Polar Class Arc7',
        charterer: 'National Centre for Polar and Ocean Research (NCPOR), GoI',
        expedition: '44th Indian Scientific Expedition to Antarctica (ISEA)',
        homePort: 'Cape Town, South Africa (Gateway Port to East Antarctica)',
        destinationPort: isBharati 
            ? 'Larsemann Hills (Bharati Fast-Ice Berth, 69°24\'S, 76°11\'E)' 
            : 'Schirmacher Oasis via India Bay (Maitri Ice Shelf, 70°00\'S, 11°55\'E)',
        voyagePhase: 'EN_ROUTE_SOUTHERN_OCEAN',
        voyagePhaseLabel: 'En Route in Southern Ocean (Crossing 54°S Roaring Forties)',
        currentCoordinates: {
            latitude: -54.2185,
            longitude: isBharati ? 46.8520 : 22.1400
        },
        speedKnots: 13.4,
        headingDegrees: isBharati ? 148 : 172,
        distanceRemainingNm: isBharati ? 1480 : 1820,
        departureDate: '2026-11-28',
        estimatedBerthingDate: '2026-12-29',
        daysUntilArrival: 92, // Resupply window countdown
        polarWindowStatus: 'WINDOW_APPROACHING',
        polarWindowLabel: 'Austral Summer Window Opens in ~90 Days',
        polarWindowCloseDate: '2027-03-12',
        windowClosureRisk: 'LOW',
        cargoManifest: {
            polarDieselLitres: isBharati ? 280000 : 210000,
            criticalSparesCrates: isBharati ? 22 : 16,
            dryAndCryoRationsDays: 480,
            scientificPayloadTons: 38.5,
            specialEquipment: [
                'CAT-C32 Scheduled 10,000-Hour Overhaul Block',
                'Dual Bell 407 Polar Helicopter Transshipment Support',
                'Priyadarshini Lake Backup Submersible Sump Assembly',
                'Modular Clean-Room Laboratory Container'
            ]
        }
    };
}

/**
 * Calculates station-level consumable runways and resupply risk index.
 */
function evaluateLogistics(stationCode = 'BHR', fuelRuntimeDays = 19.2) {
    const isBharati = stationCode === 'BHR';
    const isMaitri2 = stationCode === 'MTR2';
    const spares = isMaitri2 ? maitri2Spares : (isBharati ? bharatiSpares : maitriSpares);
    const vessel = getResupplyVesselStatus(stationCode);

    // Count stock statuses
    const totalSpares = spares.length;
    const lowStockCount = spares.filter(s => s.status === 'LOW' || s.quantityOnHand <= s.minThreshold).length;
    const optimalCount = spares.filter(s => s.status === 'OPTIMAL').length;

    // Consumable Runways
    const consumableRunways = {
        fuel: {
            label: 'Polar Diesel (Life Support & Power)',
            daysRemaining: fuelRuntimeDays,
            status: fuelRuntimeDays < 10 ? 'CRITICAL' : (fuelRuntimeDays < 20 ? 'WARNING' : 'HEALTHY'),
            source: 'Primary Insulated Bulk Storage'
        },
        potableWater: {
            label: isBharati ? 'Larsemann Hills Melt-Water Buffer' : 'Priyadarshini Lake Reservoir Buffer',
            daysRemaining: isBharati ? 54 : 41,
            status: 'HEALTHY',
            source: isBharati ? 'Waste-Heat Snow Melt Plant' : 'Lake Priyadarshini Submersible Line'
        },
        foodRations: {
            label: 'Emergency Dehydrated & Cold-Storage Provisions',
            daysRemaining: 340,
            status: 'HEALTHY',
            source: 'Food Storage Module Annex'
        },
        medicalLifeSupport: {
            label: 'Medical Oxygen & Critical Pharmaceuticals',
            daysRemaining: 420,
            status: 'HEALTHY',
            source: 'Station Medical Clinic Vault'
        },
        lubeOil: {
            label: '15W-40 Arctic Engine Lubricating Oil',
            daysRemaining: 68,
            status: 'WARNING',
            source: 'Workshop Lubrication Store'
        }
    };

    // Resupply Risk Index (0 - 100)
    // 0 = completely secure, 100 = critical resupply emergency
    let riskPoints = 0;
    const riskDrivers = [];

    // 1. Fuel runway vs Vessel arrival
    if (fuelRuntimeDays < vessel.daysUntilArrival) {
        const deficit = vessel.daysUntilArrival - fuelRuntimeDays;
        const pts = Math.min(50, Math.round(deficit * 0.6));
        riskPoints += pts;
        riskDrivers.push(`Fuel runway (${fuelRuntimeDays}d) expires before vessel berthing (${vessel.daysUntilArrival}d). Requires generator conservation.`);
    }

    // 2. Low spare parts penalties
    if (lowStockCount > 0) {
        const pts = Math.min(25, lowStockCount * 8);
        riskPoints += pts;
        riskDrivers.push(`${lowStockCount} critical spare parts are operating at or below safety threshold.`);
    }

    // 3. Engine lube oil runway
    if (consumableRunways.lubeOil.daysRemaining < 90) {
        riskPoints += 10;
        riskDrivers.push('Engine lubricating oil stock is below scheduled austral winter replacement reserve.');
    }

    const resupplyRiskScore = Math.max(5, Math.min(95, riskPoints));
    let resupplyRiskLevel = 'LOW';
    if (resupplyRiskScore > 60) resupplyRiskLevel = 'CRITICAL';
    else if (resupplyRiskScore > 35) resupplyRiskLevel = 'ELEVATED';
    else if (resupplyRiskScore > 15) resupplyRiskLevel = 'MODERATE';

    return {
        stationCode,
        stationName: isBharati ? 'Bharati Research Station' : 'Maitri Research Station',
        sparesSummary: {
            totalCatalogItems: totalSpares,
            optimalCount,
            lowStockCount,
            criticalShortages: spares.filter(s => s.quantityOnHand === 0).length
        },
        sparesInventory: spares,
        resupplyVessel: vessel,
        consumableRunways,
        resupplyRisk: {
            score: resupplyRiskScore,
            level: resupplyRiskLevel,
            drivers: riskDrivers.length > 0 ? riskDrivers : ['All polar consumable reserves and spare modules operating within nominal safety thresholds.']
        }
    };
}

/**
 * Returns compatible spare parts on station for a specific asset.
 */
function getSparesForAsset(stationCode = 'BHR', assetId = '') {
    const isBharati = stationCode === 'BHR';
    const isMaitri2 = stationCode === 'MTR2';
    const spares = isMaitri2 ? maitri2Spares : (isBharati ? bharatiSpares : maitriSpares);
    
    return spares.filter(item => {
        return item.compatibleAssets.includes(assetId) ||
               (assetId.includes('DG') && item.category.includes('MECHANICAL')) ||
               (assetId.includes('WIND') && item.category.includes('WIND')) ||
               (assetId.includes('H2') && item.category.includes('HYDROGEN')) ||
               (assetId.includes('BESS') && item.category.includes('ELECTRICAL')) ||
               (assetId.includes('HVAC') && item.category.includes('HVAC')) ||
               (assetId.includes('PUMP') && item.category.includes('PUMP')) ||
               (assetId.includes('BAT') && item.category.includes('ELECTRICAL')) ||
               (assetId.includes('FUEL') && item.category.includes('FUEL'));
    });
}

module.exports = {
    evaluateLogistics,
    getResupplyVesselStatus,
    getSparesForAsset
};
