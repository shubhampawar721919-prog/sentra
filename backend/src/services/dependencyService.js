/**
 * dependencyService.js
 * 
 * Canonical Dependency Graph Service for POLARIS Antarctic Research Stations.
 * Models physical, electrical, and thermal dependencies between station assets
 * to calculate cascade risk propagation and upstream/downstream impact chains.
 */

// Bharati Station (BHR) Canonical Dependency Graph
// Matches Python dependency_service.py topology and Antarctic infrastructure
const BHARATI_DEPENDENCIES = {
    // Parent Asset -> Array of dependent Child Assets
    "FUEL-01": ["DG-001", "DG-002"],
    "DG-001": ["BAT-01", "BAT-02", "HVAC-01", "HVAC-02", "PUMP-01", "COM-01"],
    "DG-002": ["BAT-02", "HVAC-03", "PUMP-02"],
    "BAT-01": ["COM-01"],
    "BAT-02": ["HVAC-02"],
    "PUMP-01": ["DG-001"], // Thermal cooling feedback loop
};

// Maitri Station (MTR) Canonical Dependency Graph
const MAITRI_DEPENDENCIES = {
    "MTR-FUEL-01": ["MTR-DG-01", "MTR-DG-02"],
    "MTR-DG-01": ["MTR-BAT-01", "MTR-HVAC-01", "MTR-PUMP-01"],
    "MTR-DG-02": ["MTR-BAT-01", "MTR-HVAC-01"],
    "MTR-BAT-01": ["MTR-HVAC-01"],
};

// Maitri-II (MTR2) Canonical Dependency Graph (MoES 2029 Polar Microgrid Blueprint)
const MAITRI_2_DEPENDENCIES = {
    "M2-WIND-01": ["M2-BESS-01"],
    "M2-SOLAR-01": ["M2-BESS-01"],
    "M2-H2-01": ["M2-BESS-01"],
    "M2-BESS-01": ["M2-HVAC-01", "M2-PUMP-01", "M2-COM-01", "M2-LAB-01"],
    "M2-HVAC-01": ["M2-HAB-01"],
    "M2-PUMP-01": ["M2-HAB-01", "M2-LAB-01"]
};

// Logical Station Zones for 2D Operational Digital Twin Schematic
const STATION_ZONES = [
    { id: 'POWER_GENERATION', name: 'Power Generation Complex', icon: 'Zap' },
    { id: 'ENERGY_STORAGE', name: 'Energy Storage & UPS', icon: 'Battery' },
    { id: 'CLIMATE_CONTROL', name: 'HVAC & Climate Control', icon: 'Wind' },
    { id: 'FUEL_STORAGE', name: 'Primary Fuel Reservoir', icon: 'Fuel' },
    { id: 'CRITICAL_FACILITIES', name: 'Coolant & Life Support Pumps', icon: 'Activity' },
    { id: 'COMMUNICATIONS', name: 'Satellite Uplink & Comms', icon: 'Radio' },
    { id: 'HABITATION', name: 'Crew Habitat & Living Quarters', icon: 'Home' },
    { id: 'METEOROLOGY', name: 'Meteorological & AWS Sensor', icon: 'CloudRain' },
];

/**
 * Returns raw adjacency list for the specified station code.
 */
function getGraphByStation(stationCode = 'BHR') {
    if (stationCode === 'MTR2') return MAITRI_2_DEPENDENCIES;
    return stationCode === 'MTR' ? MAITRI_DEPENDENCIES : BHARATI_DEPENDENCIES;
}

/**
 * Returns complete graph structure with nodes, directed edges, and zone definitions.
 */
function getStationDependencies(stationCode = 'BHR', assets = []) {
    const depMap = getGraphByStation(stationCode);
    const edges = [];

    Object.entries(depMap).forEach(([parent, children]) => {
        children.forEach(child => {
            edges.push({
                source: parent,
                target: child,
                id: `dep-${parent}->${child}`
            });
        });
    });

    // Map each asset to its logical operational zone
    const assetZoneMap = {};
    assets.forEach(asset => {
        assetZoneMap[asset.assetId] = assignAssetToZone(asset);
    });

    return {
        stationCode,
        zones: STATION_ZONES,
        edges,
        adjacencyList: depMap,
        assetZoneMap
    };
}

/**
 * Dynamically assigns an asset document to one of the 8 standard 2D schematic zones.
 */
function assignAssetToZone(asset) {
    const id = asset.assetId || '';
    const type = (asset.type || '').toLowerCase();
    const name = (asset.name || '').toLowerCase();

    if (id.includes('DG') || id.includes('WIND') || id.includes('SOLAR') || id.includes('H2') || type.includes('generator') || type.includes('turbine')) {
        return 'POWER_GENERATION';
    }
    if (id.includes('BAT') || id.includes('BESS') || type.includes('battery') || type.includes('storage')) {
        return 'ENERGY_STORAGE';
    }
    if (id.includes('FUEL') || type.includes('fuel')) {
        return 'FUEL_STORAGE';
    }
    if (id.includes('HVAC') || type.includes('hvac') || type.includes('climate') || type.includes('chiller')) {
        if (id.includes('03') || name.includes('quarters') || name.includes('living')) {
            return 'HABITATION';
        }
        return 'CLIMATE_CONTROL';
    }
    if (id.includes('PUMP') || type.includes('pump') || type.includes('water')) {
        return 'CRITICAL_FACILITIES';
    }
    if (id.includes('COM') || type.includes('communication') || type.includes('uplink') || type.includes('radio')) {
        return 'COMMUNICATIONS';
    }
    if (id.includes('ENV') || id.includes('AWS') || type.includes('environmental') || type.includes('weather') || type.includes('sensor')) {
        return 'METEOROLOGY';
    }
    if (id.includes('HAB') || id.includes('LAB') || name.includes('hab') || name.includes('lab')) {
        return 'HABITATION';
    }
    return 'CRITICAL_FACILITIES';
}

/**
 * Returns downstream cascade chain separated into Direct and Secondary impact tiers.
 */
function getDownstreamChain(assetId, stationCode = 'BHR') {
    const depMap = getGraphByStation(stationCode);
    const direct = depMap[assetId] || [];
    const secondary = new Set();

    direct.forEach(child => {
        const grandChildren = depMap[child] || [];
        grandChildren.forEach(gc => {
            if (gc !== assetId && !direct.includes(gc)) {
                secondary.add(gc);
            }
        });
    });

    return {
        rootAsset: assetId,
        directImpact: direct,
        secondaryImpact: Array.from(secondary),
        totalAffectedCount: direct.length + secondary.size
    };
}

/**
 * Returns upstream parent assets that supply the given asset.
 */
function getUpstreamChain(assetId, stationCode = 'BHR') {
    const depMap = getGraphByStation(stationCode);
    const upstream = [];

    Object.entries(depMap).forEach(([parent, children]) => {
        if (children.includes(assetId)) {
            upstream.push(parent);
        }
    });

    return upstream;
}

module.exports = {
    STATION_ZONES,
    getStationDependencies,
    getDownstreamChain,
    getUpstreamChain,
    assignAssetToZone
};
