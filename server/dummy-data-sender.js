/**
 * Dummy Energy Data Sender for n8n
 * 
 * Uses pattern-based generation from Excel history.
 * 
 * Threshold: 10-17 kWh (determined by n8n, not here)
 * 
 * Usage:
 *   node dummy-data-sender.js           # Send random data once
 *   node dummy-data-sender.js --auto    # Auto-send every 30 seconds
 *   node dummy-data-sender.js --breach  # Force high consumption value
 */

// Configuration
const dataService = require('./dataService');
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/energy-data';
const SEND_INTERVAL = 30000; // 30 seconds

// Only 2 equipment systems
const EQUIPMENT_LIST = ['MFM 1', 'MFM 2'];

/**
 * Generate simple consumption data
 * @param {boolean} forceBreach - If true, generate value above 17 kWh
 */
function generateEnergyData(forceBreach = false) {
    // Randomly pick MFM 1 or MFM 2
    const deviceName = EQUIPMENT_LIST[Math.floor(Math.random() * EQUIPMENT_LIST.length)];
    const deviceId = deviceName.includes('1') ? '1' : '2'; // Map name to ID

    // Use dataService to generate realistic pattern
    let data;
    try {
        data = dataService.generateDummyData(deviceId);
    } catch (e) {
        console.error("Error generating pattern data:", e.message);
        // Fallback
        return {
            equipment: deviceName,
            consumption: 10 + Math.random() * 5,
            timestamp: new Date().toISOString()
        };
    }

    let consumption = data.maxDemand; // Using demand as the main value for 'consumption' field in dummy sender context, or specific param

    if (forceBreach) {
        // Force a value significantly higher than stats
        consumption = (data.stats.demand.max || 20) * 1.5;
    }

    // STRICT: Only send essential telemetry
    return {
        equipment: deviceName,
        consumption: Number(consumption.toFixed(2)),
        timestamp: new Date().toISOString()
    };
}

/**
 * Send energy data to n8n webhook
 */
async function sendToN8n(data) {
    console.log(`[${new Date().toISOString()}] Sending: ${data.equipment} | ${data.consumption} kWh`);

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.log(`   ❌ Error: ${response.status}`);
            return { success: false, error: `Status ${response.status}` };
        }

        // Success - say nothing extra
        return { success: true };

    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const autoMode = args.includes('--auto');
    const breachMode = args.includes('--breach');

    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   Energy Data Sender for n8n Automation   ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║   Equipment: MFM 1, MFM 2                 ║');
    console.log('║   Mode: Cyclic Reporting (Every 30s)      ║');
    console.log('╚═══════════════════════════════════════════╝');

    if (breachMode) {
        console.log('\n🚨 BREACH MODE: Forcing high consumption value');
        const data = generateEnergyData(true);
        await sendToN8n(data);
        return;
    }

    if (autoMode) {
        console.log(`\n🔄 AUTO MODE: Sending all devices every ${SEND_INTERVAL / 1000} seconds`);
        console.log('   Press Ctrl+C to stop\n');

        const sendAllDevices = async () => {
            console.log(`--- Cycle Start [${new Date().toLocaleTimeString()}] ---`);
            for (const device of EQUIPMENT_LIST) {
                // Generate specific data for this device
                const data = generateEnergyData();
                data.equipment = device; // Override random choice to ensure coverage
                await sendToN8n(data);
                // Small delay to prevent race conditions in n8n webhooks
                await new Promise(r => setTimeout(r, 1000));
            }
        };

        // Send immediately
        await sendAllDevices();

        // Then interval
        setInterval(sendAllDevices, SEND_INTERVAL);
    } else {
        console.log('\n📤 Sending single data packet...');
        const data = generateEnergyData();
        await sendToN8n(data);
        console.log('\n💡 Use --auto for continuous sending');
    }
}

// Export for use as module
module.exports = { generateEnergyData, sendToN8n };

// Run if executed directly
if (require.main === module) {
    main();
}
