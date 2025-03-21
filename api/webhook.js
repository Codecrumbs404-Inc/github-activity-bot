const axios = require('axios');
const crypto = require('crypto');
const { DISCORD_WEBHOOK_URL2, WEBHOOK_SECRET } = process.env;

// Verify the GitHub webhook signature
function verifySignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    
    // Ensure req.body is defined
    const body = req.body ? JSON.stringify(req.body) : '';
    hmac.update(body);
    
    const computedSignature = `sha256=${hmac.digest('hex')}`;

    if (signature !== computedSignature) {
        throw new Error('Signature verification failed');
    }
}

// Truncate strings to ensure they meet Discord's limits
function truncateString(str, maxLength) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
}

function formatMessage(event, payload) {
    try {
        // Initialize basic embed structure with safe access to properties
        const embed = {
            color: 3066993, // A cool blue color for Discord embed
            author: {
                name: truncateString(payload.sender?.login || 'Unknown', 256),
                icon_url: payload.sender?.avatar_url || '',
            },
            title: truncateString(`GitHub Event: ${event}`, 256),
            url: payload.repository?.html_url || '',
            fields: [],
            timestamp: new Date(),
        };

        // Set thumbnail based on what's available
        if (payload.organization?.avatar_url) {
            embed.thumbnail = { url: payload.organization.avatar_url };
        } else if (payload.repository?.owner?.avatar_url) {
            embed.thumbnail = { url: payload.repository.owner.avatar_url };
        }

        // Helper function to add common repository fields if repository exists
        const addRepositoryFields = () => {
            if (payload.repository) {
                embed.fields.push(
                    { 
                        name: 'Repository', 
                        value: truncateString(`[${payload.repository.name || 'Unknown'}](${payload.repository.html_url || '#'})`, 1024), 
                        inline: true 
                    },
                    { 
                        name: 'Repository Owner', 
                        value: truncateString(payload.repository.owner?.login || 'Unknown', 1024), 
                        inline: true 
                    }
                );
                
                if (payload.repository.language) {
                    embed.fields.push({ 
                        name: 'Language', 
                        value: truncateString(payload.repository.language, 1024), 
                        inline: true 
                    });
                }
            }
        };

        // Limit the number of fields to stay under Discord's limit
        const addField = (name, value, inline = false) => {
            if (embed.fields.length < 25) { // Discord has a limit of 25 fields per embed
                embed.fields.push({
                    name: truncateString(name, 256),
                    value: truncateString(value, 1024),
                    inline: inline
                });
            }
        };

        switch (event) {
            case 'meta':
                embed.title = 'GitHub Webhook Management';
                addField('Action', payload.action || 'Unknown', true);
                
                if (payload.hook) {
                    addField('Hook ID', payload.hook_id?.toString() || 'Unknown', true);
                    addField('Hook Type', payload.hook?.type || 'Unknown', true);
                }
                
                if (payload.organization) {
                    addField('Organization', payload.organization.login || 'Unknown', true);
                    
                    embed.footer = {
                        text: truncateString(`Organization: ${payload.organization.login}`, 2048),
                        icon_url: payload.organization.avatar_url || '',
                    };
                } else {
                    addRepositoryFields();
                }
                break;

            case 'push':
                if (payload.head_commit) {
                    addField('Commit Message', payload.head_commit.message || 'N/A', false);
                    addField('Commit ID', `[${payload.head_commit.id?.substring(0, 7) || 'N/A'}](${payload.head_commit.url || '#'})`, true);
                    addField('Branch', payload.ref || 'N/A', true);
                    
                    // Only add these fields if they aren't empty arrays
                    if (payload.head_commit.added?.length > 0) {
                        const addedFiles = payload.head_commit.added.join(', ');
                        addField('Files Added', addedFiles, false);
                    }
                    
                    if (payload.head_commit.modified?.length > 0) {
                        const modifiedFiles = payload.head_commit.modified.join(', ');
                        addField('Files Modified', modifiedFiles, false);
                    }
                    
                    if (payload.head_commit.removed?.length > 0) {
                        const removedFiles = payload.head_commit.removed.join(', ');
                        addField('Files Removed', removedFiles, false);
                    }
                    
                    if (payload.head_commit.timestamp) {
                        addField('Commit Date', new Date(payload.head_commit.timestamp).toLocaleString(), false);
                    }
                }
                addRepositoryFields();
                break;

            case 'pull_request':
                if (payload.pull_request) {
                    addField('PR Title', payload.pull_request.title || 'N/A', true);
                    addField('Action', payload.action || 'N/A', true);
                    addField('PR URL', `[Link to PR](${payload.pull_request.html_url || '#'})`, false);
                    
                    if (payload.pull_request.user) {
                        addField('PR Author', payload.pull_request.user.login || 'Unknown', true);
                    }
                    
                    if (payload.pull_request.head && payload.pull_request.base) {
                        addField('PR Branch', `${payload.pull_request.head.ref || 'Unknown'} → ${payload.pull_request.base.ref || 'Unknown'}`, true);
                    }
                }
                addRepositoryFields();
                break;

            case 'issues':
                if (payload.issue) {
                    addField('Issue Title', payload.issue.title || 'N/A', true);
                    addField('Action', payload.action || 'N/A', true);
                    addField('Issue URL', `[Link to Issue](${payload.issue.html_url || '#'})`, false);
                    
                    if (payload.issue.user) {
                        addField('Issue Author', payload.issue.user.login || 'Unknown', true);
                    }
                    
                    if (payload.issue.labels && payload.issue.labels.length > 0) {
                        const labels = payload.issue.labels.map(label => label.name).join(', ');
                        addField('Labels', labels || 'None', true);
                    }
                }
                addRepositoryFields();
                break;

            case 'star':
            case 'watch':
            case 'fork':
            case 'create':
            case 'delete':
            case 'deployment':
            case 'deployment_status':
            case 'pull_request_review':
            case 'pull_request_review_comment':
            case 'installation':
                // Just add basic information for these events
                addField('Action', payload.action || 'Unknown', true);
                addRepositoryFields();
                break;

            default:
                // For unknown event types, provide a simplified output
                try {
                    // Create a simplified version of the payload
                    const simplifiedPayload = {
                        action: payload.action,
                        // Include only essential information
                        sender: payload.sender?.login,
                        // Add other critical fields as needed
                    };
                    
                    let details = JSON.stringify(simplifiedPayload, null, 2);
                    addField('Event Type', event, true);
                    addField('Details', `\`\`\`json\n${details}\n\`\`\``, false);
                } catch (e) {
                    addField('Event Type', event, true);
                    addField('Details', 'Error parsing payload data', false);
                }
                
                if (payload.repository || payload.organization) {
                    addRepositoryFields();
                }
                break;
        }

        // Add appropriate footer
        if (payload.repository?.owner) {
            embed.footer = {
                text: truncateString(`Repository Owner: ${payload.repository.owner.login || 'Unknown'}${payload.repository.language ? ` | Language: ${payload.repository.language}` : ''}`, 2048),
                icon_url: payload.repository.owner.avatar_url || '',
            };
        } else if (payload.organization) {
            embed.footer = {
                text: truncateString(`Organization: ${payload.organization.login || 'Unknown'}`, 2048),
                icon_url: payload.organization.avatar_url || '',
            };
        }

        // Ensure total character count is within Discord's limits (6000 characters total across all embed fields)
        let totalCharCount = 0;
        if (embed.title) totalCharCount += embed.title.length;
        if (embed.description) totalCharCount += embed.description.length;
        if (embed.footer?.text) totalCharCount += embed.footer.text.length;
        
        for (const field of embed.fields) {
            totalCharCount += (field.name?.length || 0) + (field.value?.length || 0);
        }
        
        // If we're exceeding Discord's character limit, simplify the message
        if (totalCharCount > 6000) {
            // Create a simplified embed with just the most important information
            return {
                embeds: [{
                    color: 3066993,
                    title: truncateString(`GitHub Event: ${event}`, 256),
                    description: "Event received with large payload. See GitHub for details.",
                    fields: [
                        { name: 'Event Type', value: event, inline: true },
                        { name: 'Action', value: payload.action || 'Unknown', inline: true }
                    ],
                    timestamp: new Date()
                }]
            };
        }

        return { embeds: [embed] };
    } catch (error) {
        console.error('Error formatting message:', error);
        // Return a simpler embed if we encounter any errors
        return {
            embeds: [{
                color: 15158332, // Red color for errors
                title: `GitHub Event: ${event} (Error Processing)`,
                description: "There was an error processing this webhook event.",
                fields: [
                    { name: 'Event Type', value: event || 'Unknown', inline: true }
                ],
                timestamp: new Date()
            }]
        };
    }
}

module.exports = async (req, res) => {
    try {
        const event = req.headers['x-github-event'];
        const payload = req.body;

        // Verify signature
        verifySignature(req);

        // Log event for debugging
        console.log(`Received GitHub webhook: ${event}`);

        // Format the message
        const message = formatMessage(event, payload);

        // Log the formatted message for debugging
        console.log('Formatted message:', JSON.stringify(message).substring(0, 200) + '...');
        
        // Log the size of the message for debugging
        const messageSize = JSON.stringify(message).length;
        console.log(`Message size: ${messageSize} bytes`);

        // Discord has a payload size limit (actually 8MB, but we're being more conservative)
        if (messageSize > 6000000) {
            console.warn('Message too large for Discord webhook');
            
            // Send a simplified message instead
            const simplifiedMessage = {
                embeds: [{
                    color: 3066993,
                    title: `GitHub Event: ${event}`,
                    description: "Event received, but payload was too large to display details.",
                    fields: [
                        { name: 'Event Type', value: event, inline: true },
                        { name: 'Action', value: payload.action || 'Unknown', inline: true }
                    ],
                    timestamp: new Date()
                }]
            };
            
            await axios.post(DISCORD_WEBHOOK_URL2, simplifiedMessage);
            console.log(`Sent simplified ${event} notification to Discord due to payload size`);
            return res.status(200).send('Simplified webhook notification sent to Discord');
        }

        try {
            // Send the message to Discord with better error handling
            const response = await axios.post(DISCORD_WEBHOOK_URL2, message);
            console.log(`Successfully sent ${event} notification to Discord, status: ${response.status}`);
            res.status(200).send('Webhook notification sent to Discord');
        } catch (discordError) {
            console.error('Discord API Error:', discordError.response?.data || discordError.message);
            
            // Try sending a simplified message as fallback
            try {
                const fallbackMessage = {
                    embeds: [{
                        color: 15158332, // Red
                        title: `GitHub Event: ${event} (Error)`,
                        description: "Failed to send detailed notification to Discord.",
                        fields: [
                            { name: 'Event Type', value: event, inline: true }
                        ],
                        timestamp: new Date()
                    }]
                };
                
                await axios.post(DISCORD_WEBHOOK_URL2, fallbackMessage);
                console.log(`Sent fallback notification for ${event} after initial error`);
                res.status(200).send('Fallback webhook notification sent to Discord');
            } catch (fallbackError) {
                console.error('Failed to send fallback message:', fallbackError.message);
                throw discordError; // Re-throw the original error
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal server error');
    }
};