const ACCESS_TOKEN = import.meta.env.VITE_FB_ACCESS_TOKEN;
const AD_ACCOUNT_ID = import.meta.env.VITE_FB_AD_ACCOUNT_ID;

const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export async function fetchAdInsights(period = 'last_30d') {
    if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) throw new Error("Faltan credenciales de Meta Ads en .env");

    const rangeParams = getRangeParams(period);
    const fields = 'campaign_name,spend,cpc,ctr,reach,impressions,clicks,actions';
    const url = `${BASE_URL}/act_${AD_ACCOUNT_ID}/insights?level=account&fields=${fields}&${rangeParams}&time_increment=1&access_token=${ACCESS_TOKEN}`;

    return fetchAndFormat(url, 'account');
}

export async function fetchCampaignInsights(period = 'last_30d') {
    if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) throw new Error("Faltan credenciales");

    const rangeParams = getRangeParams(period);
    const fields = 'campaign_name,campaign_id,spend,cpc,ctr,reach,impressions,clicks,actions';
    // level=campaign returns one row per campaign (aggregated for the period)
    const url = `${BASE_URL}/act_${AD_ACCOUNT_ID}/insights?level=campaign&fields=${fields}&${rangeParams}&access_token=${ACCESS_TOKEN}`;

    return fetchAndFormat(url, 'campaign');
}

export async function fetchAdsByCampaign(campaignId, period = 'last_30d') {
    if (!ACCESS_TOKEN) throw new Error("Faltan credenciales");
    const rangeParams = getRangeParams(period);
    const fields = 'ad_name,ad_id,spend,cpc,ctr,reach,impressions,clicks,actions';

    // Filtering by campaign_id
    const url = `${BASE_URL}/act_${AD_ACCOUNT_ID}/insights?level=ad&filtering=[{'field':'campaign.id','operator':'EQUAL','value':'${campaignId}'}]&fields=${fields}&${rangeParams}&access_token=${ACCESS_TOKEN}`;

    return fetchAndFormat(url, 'ad');
}

async function fetchAndFormat(url, level) {
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("Meta API Error:", data.error);
            throw new Error(data.error.message);
        }

        return formatInsights(data.data || [], level);
    } catch (error) {
        console.error("Fetch Error:", error);
        throw error;
    }
}

function formatInsights(data, level) {
    return data.map(item => {
        // Extract messaging conversations
        const actions = item.actions || [];
        const msgStarted = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')?.value || 0;
        const msgStartedTotal = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'onsite_conversion.messaging_conversation_started_28d' || a.action_type === 'onsite_conversion.messaging_conversation_started_1d')?.value || 0;

        // Sometimes "link_click" or "post_engagement" is useful too
        // For fitness coaches, "messaging_conversation_started_7d" is usually the key if running DM campaigns.
        // Fallback to generic "actions" count if specific one missing? No, let's be specific for DM strategy.

        // Try to handle different attribution windows or action types returned by Meta
        const conversations = parseInt(msgStarted || msgStartedTotal || 0);
        const spend = parseFloat(item.spend || 0);
        const costPerConversation = conversations > 0 ? spend / conversations : 0;

        const base = {
            id: item.campaign_id || item.ad_id || item.date_start,
            name: item.campaign_name || item.ad_name || item.date_start,
            status: item.status || 'ACTIVE', // Insights endpoint sometimes doesn't return status unless requested on the object endpoint, but let's try. Actually 'status' field is on the object, not insight. 
            // WAIT: 'status' is not available in insights endpoint directly for Campaigns/Ads usually, only 'effective_status' might be or we need to fetch the object. 
            // However, often for simple dashboards we ignore status or assume active if it has spend. 
            // Let's keep it simple: if spend > 0 it's relevant.

            spend: spend,
            cpc: parseFloat(item.cpc || 0),
            ctr: parseFloat(item.ctr || 0),
            reach: parseInt(item.reach || 0),
            impressions: parseInt(item.impressions || 0),
            clicks: parseInt(item.clicks || 0),
            conversations: conversations,
            costPerConversation: costPerConversation
        };

        if (level === 'account') {
            // For daily charts
            base.date = item.date_start;
            base.shortDate = new Date(item.date_start).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
            base.raw_date = item.date_start;
        }

        return base;
    });
}

function getRangeParams(period) {
    // Meta's "last_X_days" presets typically Exclude today.
    // To include today, we use custom time_range.
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    const until = formatDate(today);

    let sinceDate = new Date();

    if (period === 'today') {
        const since = formatDate(today);
        return `time_range={'since':'${since}','until':'${until}'}`;
    }

    if (period === 'last_7d') {
        sinceDate.setDate(today.getDate() - 7);
    } else if (period === 'last_90d') {
        sinceDate.setDate(today.getDate() - 90);
    } else {
        // Default last 30d
        sinceDate.setDate(today.getDate() - 30);
    }

    const since = formatDate(sinceDate);
    // time_range must be JSON string encoded
    return `time_range={'since':'${since}','until':'${until}'}`;
}
