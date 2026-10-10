/**
 * scadaBridgeService.js
 * 
 * Industrial SCADA & Modbus TCP / IEC 60870-5-104 Telemetry Gateway Bridge.
 * 
 * Demonstrates physical-layer integration between station PLCs / RTUs
 * (Siemens S7-1500 / Modbus TCP Gateway at Bharati & Maitri power stations)
 * and POLARIS WebSockets/REST ingestion pipeline.
 */

// Simulated PLC State & Register Memory Map
const MODBUS_REGISTER_MAP = [
    { register: 40001, address: '0x0000', name: 'Generator Line Voltage V_ab', unit: 'V', scale: 1.0, type: 'UINT16', defaultVal: 415 },
    { register: 40002, address: '0x0001', name: 'Generator Line Current I_rms', unit: 'A', scale: 0.1, type: 'UINT16', defaultVal: 685 },
    { register: 40003, address: '0x0002', name: 'Active Real Power Output P_act', unit: 'kW', scale: 1.0, type: 'UINT16', defaultVal: 485 },
    { register: 40004, address: '0x0003', name: 'AC Electrical Grid Frequency f_grid', unit: 'Hz', scale: 0.01, type: 'UINT16', defaultVal: 5000 },
    { register: 40005, address: '0x0004', name: 'Main Crankshaft Bearing Temp T_brg', unit: '°C', scale: 0.1, type: 'UINT16', defaultVal: 785 },
    { register: 40006, address: '0x0005', name: 'Engine Vibration Velocity RMS V_vib', unit: 'mm/s', scale: 0.01, type: 'UINT16', defaultVal: 14 },
    { register: 40007, address: '0x0006', name: 'Generator Mechanical Load Ratio', unit: '%', scale: 0.1, type: 'UINT16', defaultVal: 720 },
    { register: 40008, address: '0x0007', name: 'Primary Reservoir Fuel Level L_fuel', unit: '%', scale: 0.1, type: 'UINT16', defaultVal: 730 },
    { register: 40009, address: '0x0008', name: 'Coolant Loop Hydraulic Pressure', unit: 'bar', scale: 0.01, type: 'UINT16', defaultVal: 380 },
    { register: 40010, address: '0x0009', name: 'Secondary DG Synchronization Flag', unit: 'State', scale: 1.0, type: 'BOOL', defaultVal: 0 }
];

let packetsScanned = 184520;
let lastScanTime = Date.now();

/**
 * Returns the current SCADA gateway status and decoded Modbus TCP registers.
 * Dynamically reflects recent telemetry if provided.
 */
function getScadaGatewayStatus(latestTelemetry = null, stationCode = 'BHR') {
    const isBharati = stationCode === 'BHR';
    packetsScanned += Math.floor(Math.random() * 5) + 1;
    lastScanTime = Date.now();

    // Map latest telemetry into raw Modbus registers
    const registers = MODBUS_REGISTER_MAP.map(reg => {
        let rawVal = reg.defaultVal;

        if (latestTelemetry) {
            if (reg.register === 40003 && latestTelemetry.powerOutput !== undefined) {
                rawVal = Math.round(latestTelemetry.powerOutput);
            } else if (reg.register === 40005 && latestTelemetry.temperature !== undefined) {
                rawVal = Math.round(latestTelemetry.temperature * 10);
            } else if (reg.register === 40006 && latestTelemetry.vibration !== undefined) {
                rawVal = Math.round(latestTelemetry.vibration * 100);
            } else if (reg.register === 40007 && latestTelemetry.generatorLoad !== undefined) {
                rawVal = Math.round(latestTelemetry.generatorLoad * 10);
            } else if (reg.register === 40008 && latestTelemetry.fuelLevel !== undefined) {
                rawVal = Math.round(latestTelemetry.fuelLevel * 10);
            }
        }

        const decodedVal = (rawVal * reg.scale).toFixed(reg.scale < 1 ? (reg.scale === 0.01 ? 2 : 1) : 0);
        const hexRepresentation = '0x' + rawVal.toString(16).toUpperCase().padStart(4, '0');

        return {
            ...reg,
            rawValue: rawVal,
            hex: hexRepresentation,
            decodedValue: Number(decodedVal)
        };
    });

    return {
        gatewayStatus: 'ONLINE_CONNECTED',
        plcModel: isBharati ? 'Siemens Simatic S7-1500 (CPU 1516-3 PN/DP)' : 'Schneider Modicon M580 ePAC',
        busProtocol: 'Modbus TCP / IEC 60870-5-104 over Optical Polar Fiber',
        stationLocation: isBharati ? 'Bharati Main Power House (Larsemann Hills)' : 'Maitri Generator Complex (Schirmacher Oasis)',
        ipEndpoint: isBharati ? '192.168.40.10:502' : '192.168.50.10:502',
        baudRate: '100 Mbps (Full Duplex Polar Optical Ring)',
        scanCycleMs: 100,
        lastScanTimestamp: new Date(lastScanTime).toISOString(),
        packetStats: {
            framesProcessed: packetsScanned,
            crcErrors: 0,
            errorRatePercent: 0.0,
            latencyMs: 3.2
        },
        registers
    };
}

module.exports = {
    getScadaGatewayStatus,
    MODBUS_REGISTER_MAP
};
