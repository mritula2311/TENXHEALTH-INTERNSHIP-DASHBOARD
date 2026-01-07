// n8n Configuration
// Update these values with your self-hosted n8n instance details

module.exports = {
    n8n: {
        // Your self-hosted n8n base URL (without trailing slash)
        baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',

        // Webhook endpoints - Update these with your actual n8n webhook URLs
        webhooks: {
            // Webhook to trigger ticket generation from energy alerts
            energyAlert: process.env.N8N_ENERGY_ALERT_WEBHOOK || '/webhook/energy-alert',

            // Webhook for manual ticket submission
            ticketSubmit: process.env.N8N_TICKET_WEBHOOK || '/webhook/ticket-submit',

            // Webhook for data sync requests
            dataSync: process.env.N8N_DATA_SYNC_WEBHOOK || '/webhook/data-sync'
        }
    },

    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        // Your dashboard webhook URL that n8n will call back
        webhookCallbackUrl: process.env.DASHBOARD_WEBHOOK_URL || 'http://localhost:3000/webhook'
    }
};
