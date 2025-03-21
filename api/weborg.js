const axios = require('axios');
const crypto = require('crypto');
const { DISCORD_WEBHOOK_URL, WEBHOOK_SECRET } = process.env;

// Verify the GitHub webhook signature
function verifySignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(JSON.stringify(req.body));
    const computedSignature = `sha256=${hmac.digest('hex')}`;

    if (signature !== computedSignature) {
        throw new Error('Signature verification failed');
    }
}

function formatMessage2(event, payload) {
    const embed = {
        color: 3066993, // A cool blue color for Discord embed
        author: {
            name: payload.sender.login,
            icon_url: payload.sender.avatar_url,
        },
        title: `GitHub Organization Event: ${event}`,
        url: payload.repository ? payload.repository.html_url : '',
        thumbnail: {
            url: payload.organization.avatar_url,
        },
        fields: [],
        timestamp: new Date(),
    };

    switch (event) {
        case 'meta':
            embed.fields.push(
                { name: 'Action', value: payload.action, inline: true },
                { name: 'Organization', value: payload.organization.login, inline: true },
                { name: 'Hook Name', value: payload.hook.name, inline: true },
                { name: 'Hook ID', value: payload.hook_id.toString(), inline: true },
                { name: 'Details', value: `Webhook was ${payload.action}`, inline: false }
            );
            break;
            
        case 'star':
            embed.fields.push(
                { name: 'Repository Starred', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true },
                { name: 'Starred By', value: payload.sender.login, inline: true }
            );
            break;
    
        case 'fork':
            embed.fields.push(
                { name: 'Repository Forked', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true },
                { name: 'Forked By', value: payload.sender.login, inline: true },
                { name: 'Forked Repository URL', value: `[Forked Repo](${payload.repository.html_url})`, inline: false }
            );
            break;
    
        case 'push':
            embed.fields.push(
                { name: 'Repository', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true },
                { name: 'Commit Message', value: payload.head_commit.message, inline: true },
                { name: 'Commit ID', value: `[${payload.head_commit.id.substring(0, 7)}](${payload.head_commit.url})`, inline: false },
                { name: 'Branch', value: payload.ref, inline: true },
                { name: 'Files Added', value: payload.head_commit.added.join(', ') || 'None', inline: true },
                { name: 'Files Modified', value: payload.head_commit.modified.join(', ') || 'None', inline: true },
                { name: 'Files Removed', value: payload.head_commit.removed.join(', ') || 'None', inline: true },
                { name: 'Commit Date', value: new Date(payload.head_commit.timestamp).toLocaleString(), inline: false }
            );
            break;
    
        case 'release':
            embed.fields.push(
                { name: 'Release', value: payload.release.name, inline: true },
                { name: 'Action', value: payload.action, inline: true },
                { name: 'Release URL', value: payload.release.html_url, inline: false },
                { name: 'Tag', value: payload.release.tag_name, inline: true }
            );
            break;
    
        case 'repository':
            embed.fields.push(
                { name: 'Repository', value: payload.repository.name, inline: true },
                { name: 'Action', value: payload.action, inline: true },
                { name: 'Repository URL', value: payload.repository.html_url, inline: false },
                { name: 'Description', value: payload.repository.description || 'No description', inline: true }
            );
            break;
    
        case 'create':
            embed.fields.push(
                { name: 'Created', value: `${payload.ref_type} ${payload.ref}`, inline: true },
                { name: 'In Repo', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true }
            );
            break;
    
        case 'delete':
            embed.fields.push(
                { name: 'Deleted', value: `${payload.ref_type} ${payload.ref}`, inline: true },
                { name: 'In Repo', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true }
            );
            break;
    
        case 'commit_comment':
            embed.fields.push(
                { name: 'Commit Comment', value: payload.comment.body, inline: true },
                { name: 'Commit', value: payload.commit_id.substring(0, 7), inline: true },
                { name: 'Repository', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true }
            );
            break;
    
        case 'label':
            embed.fields.push(
                { name: 'Label', value: payload.label.name, inline: true },
                { name: 'Action', value: payload.action, inline: true },
                { name: 'Repository', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true }
            );
            break;
    
        case 'milestone':
            embed.fields.push(
                { name: 'Milestone', value: payload.milestone.title, inline: true },
                { name: 'Action', value: payload.action, inline: true },
                { name: 'Repository', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true }
            );
            break;
    
        case 'pull_request':
            embed.fields.push(
                { name: 'PR Title', value: payload.pull_request.title, inline: true },
                { name: 'Action', value: payload.action, inline: true },
                { name: 'PR URL', value: `[Link to PR](${payload.pull_request.html_url})`, inline: false },
                { name: 'PR Author', value: payload.pull_request.user.login, inline: true },
                { name: 'PR Branch', value: `${payload.pull_request.head.ref} → ${payload.pull_request.base.ref}`, inline: true }
            );
            break;
    
        case 'pull_request_review':
            embed.fields.push(
                { name: 'Review Action', value: payload.action, inline: true },
                { name: 'Reviewer', value: payload.review.user.login, inline: true },
                { name: 'PR Title', value: payload.pull_request.title, inline: true },
                { name: 'PR URL', value: payload.pull_request.html_url, inline: false }
            );
            break;
    
        case 'pull_request_review_comment':
            embed.fields.push(
                { name: 'Comment Action', value: payload.action, inline: true },
                { name: 'Reviewer', value: payload.comment.user.login, inline: true },
                { name: 'PR Title', value: payload.pull_request.title, inline: true },
                { name: 'PR URL', value: payload.pull_request.html_url, inline: false },
                { name: 'Comment', value: payload.comment.body, inline: true }
            );
            break;
    
        case 'repository_dispatch':
            embed.fields.push(
                { name: 'Action', value: payload.action, inline: true },
                { name: 'Repository', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true },
                { name: 'Payload', value: JSON.stringify(payload.client_payload, null, 2), inline: false }
            );
            break;
    
        case 'workflow_run':
            embed.fields.push(
                { name: 'Workflow Run', value: payload.workflow_run.name, inline: true },
                { name: 'Status', value: payload.workflow_run.status, inline: true },
                { name: 'Repository', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true },
                { name: 'Workflow Run URL', value: payload.workflow_run.html_url, inline: false }
            );
            break;
    
        case 'deployment':
            embed.fields.push(
                { name: 'Deployment Action', value: payload.action, inline: true },
                { name: 'Environment', value: payload.deployment.environment, inline: true },
                { name: 'Deployment URL', value: payload.deployment.url, inline: false },
                { name: 'Repository', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true }
            );
            break;
    
        case 'deployment_status':
            embed.fields.push(
                { name: 'Deployment Status Action', value: payload.state, inline: true },
                { name: 'Environment', value: payload.deployment_status.environment, inline: true },
                { name: 'Status URL', value: payload.deployment_status.target_url, inline: false },
                { name: 'Repository', value: `[${payload.repository.name}](${payload.repository.html_url})`, inline: true }
            );
            break;

        case 'membership':
            embed.fields.push(
                { name: 'Organization', value: payload.organization.login, inline: true },
                { name: 'User', value: payload.sender.login, inline: true },
                { name: 'Action', value: payload.action, inline: false }
            );
            break;

        case 'team_add':
            embed.fields.push(
                { name: 'Team', value: payload.team.name, inline: true },
                { name: 'Action', value: 'Team Added', inline: true },
                { name: 'Team URL', value: payload.team.url, inline: false }
            );
            break;

        case 'team_remove':
            embed.fields.push(
                { name: 'Team', value: payload.team.name, inline: true },
                { name: 'Action', value: 'Team Removed', inline: true },
                { name: 'Team URL', value: payload.team.url, inline: false }
            );
            break;

        case 'team_update':
            embed.fields.push(
                { name: 'Team', value: payload.team.name, inline: true },
                { name: 'Action', value: 'Team Updated', inline: true },
                { name: 'Team URL', value: payload.team.url, inline: false }
            );
            break;

        case 'repository_add':
            embed.fields.push(
                { name: 'Repository', value: payload.repository.name, inline: true },
                { name: 'Action', value: 'Repository Added to Organization', inline: true },
                { name: 'Repository URL', value: payload.repository.html_url, inline: false }
            );
            break;

        case 'repository_remove':
            embed.fields.push(
                { name: 'Repository', value: payload.repository.name, inline: true },
                { name: 'Action', value: 'Repository Removed from Organization', inline: true },
                { name: 'Repository URL', value: payload.repository.html_url, inline: false }
            );
            break;

        case 'repository_transfer':
            embed.fields.push(
                { name: 'Repository', value: payload.repository.name, inline: true },
                { name: 'Action', value: 'Repository Transferred', inline: true },
                { name: 'From Organization', value: payload.organization.login, inline: true },
                { name: 'To Organization', value: payload.organization.login, inline: true },
                { name: 'Repository URL', value: payload.repository.html_url, inline: false }
            );
            break;

        case 'member_added':
            embed.fields.push(
                { name: 'Organization', value: payload.organization.login, inline: true },
                { name: 'User', value: payload.member.login, inline: true },
                { name: 'Action', value: 'User Added to Organization', inline: true }
            );
            break;

        case 'member_removed':
            embed.fields.push(
                { name: 'Organization', value: payload.organization.login, inline: true },
                { name: 'User', value: payload.member.login, inline: true },
                { name: 'Action', value: 'User Removed from Organization', inline: true }
            );
            break;

        // Additional events related to GitHub Organizations
        case 'team_add_to_repository':
            embed.fields.push(
                { name: 'Team', value: payload.team.name, inline: true },
                { name: 'Repository', value: payload.repository.name, inline: true },
                { name: 'Action', value: 'Team Added to Repository', inline: true }
            );
            break;

        case 'team_remove_from_repository':
            embed.fields.push(
                { name: 'Team', value: payload.team.name, inline: true },
                { name: 'Repository', value: payload.repository.name, inline: true },
                { name: 'Action', value: 'Team Removed from Repository', inline: true }
            );
            break;

        case 'project_create':
            embed.fields.push(
                { name: 'Project', value: payload.project.name, inline: true },
                { name: 'Organization', value: payload.organization.login, inline: true },
                { name: 'Action', value: 'Project Created', inline: true }
            );
            break;

        case 'project_update':
            embed.fields.push(
                { name: 'Project', value: payload.project.name, inline: true },
                { name: 'Organization', value: payload.organization.login, inline: true },
                { name: 'Action', value: 'Project Updated', inline: true }
            );
            break;

        case 'project_delete':
            embed.fields.push(
                { name: 'Project', value: payload.project.name, inline: true },
                { name: 'Organization', value: payload.organization.login, inline: true },
                { name: 'Action', value: 'Project Deleted', inline: true }
            );
            break;

            default:
                // Make sure we don't exceed Discord's character limits
                const details = JSON.stringify(payload, null, 2);
                const truncatedDetails = details.length > 1000 ? details.substring(0, 997) + '...' : details;
                
                embed.fields.push(
                    { name: 'Event Type', value: event, inline: true },
                    { name: 'Details', value: `\`\`\`json\n${truncatedDetails}\n\`\`\``, inline: false }
                );
                break;
        }
    
        embed.footer = {
            text: `Organization: ${payload.organization.login}`,
            icon_url: payload.organization.avatar_url,
        };
    
        return { embeds: [embed] };
    }
    

    module.exports = async (req, res) => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }
    
        try {
            // Verify the signature
            verifySignature(req);
    
            const event = req.headers['x-github-event'];
            const payload = req.body;
    
            const message = formatMessage2(event, payload);
    
            // Send the message to Discord
            await axios.post(DISCORD_WEBHOOK_URL, message);
            console.log(`Successfully sent ${event} notification to Discord`);
            return res.status(200).send('Organization notification sent to Discord');
        } catch (error) {
            console.error('Error processing webhook:', error);
            return res.status(500).send('Failed to process webhook');
        }
    };