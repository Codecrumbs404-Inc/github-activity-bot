
# GitHub Webhook to Discord Integration

This guide demonstrates how to integrate GitHub webhooks with Discord, sending notifications for GitHub events (e.g., pushes, pull requests) to a Discord channel.

---

## Prerequisites

Ensure you have the following before starting:

- **Node.js** (v14 or later)
- **npm** or **yarn**
- **GitHub Account**
- **Discord Account**
- **Vercel Account**
- **GitHub App** created (for webhook handling)

---

## 1. Set Up the Project

### Step 1: Clone the Repository

```bash
git clone https://github.com/Codecrumbs404-Inc/github-activity-bot.git
cd github-activity-bot
```

### Step 2: Install Dependencies

Install the required dependencies:

```bash
npm install
```

---

## 2. Set Up GitHub Webhook

### Step 1: Create a GitHub App

1. Go to [GitHub Developer Settings](https://github.com/settings/apps).
2. Click **New GitHub App** and complete the details:
   - **App name**: Name your app (e.g., "GitHub to Discord").
   - **Webhook URL**: The URL where GitHub will send webhook events (this will be your app's deployed URL).
   - **Webhook Secret**: Generate a secret key for verifying webhook authenticity.
3. Select events to track (e.g., push, pull request, fork, etc.).
4. Save your GitHub App settings and note the **Webhook Secret** and **Webhook URL**.

### Step 2: Copy Webhook Details
- **Webhook Secret**: Copy and save this value (for verifying the authenticity of incoming webhooks).
- **Webhook URL**: You will use this when configuring the GitHub webhook.

---

## 3. Set Up Discord Webhook

### Step 1: Create a Discord Webhook

1. Go to your Discord server's **Settings**.
2. Under **Integrations**, click **Create Webhook**.
3. Choose a name (e.g., "GitHub Notifications") and copy the **Webhook URL**.

---

## 4. Configure the Project

### Step 1: Set Up Environment Variables

Create a `.env` file in your project root to store sensitive data like the GitHub Webhook Secret and Discord Webhook URL:

```env
DISCORD_WEBHOOK_URL2=<YOUR_DISCORD_WEBHOOK_URL_FOR_ORGANIZATION>
DISCORD_WEBHOOK_URL2=<YOUR_DISCORD_WEBHOOK_URL_FOR_INDIVIDUAL>
WEBHOOK_SECRET=<YOUR_GITHUB_WEBHOOK_SECRET>
```

Replace the placeholders with actual values from your Discord and GitHub App settings.

---

## 5. Prepare Webhook Endpoint

Your project should include a server (e.g., using **Express**) to handle incoming GitHub webhooks:

1. Verify the authenticity of GitHub webhook requests using the **Webhook Secret**.
2. Format the event data (e.g., commit messages, pull request details) into a Discord-friendly message.
3. Send the formatted data to the Discord Webhook URL.

---

## 6. Deploy to Vercel

### Step 1: Deploy Using Vercel

1. Create an account on [Vercel](https://vercel.com/) and link your GitHub repository.
2. Deploy the project from GitHub or use the Vercel CLI:
   ```bash
   npm install -g vercel
   vercel
   ```
3. Retrieve the deployed URL (e.g., `https://your-app.vercel.app`).

### Step 2: Update GitHub Webhook

- Go to your GitHub App settings and update the **Webhook URL** to the Vercel-deployed URL (e.g., `https://your-app.vercel.app`).
- Use the same **Webhook Secret** as before.

---

## 7. Test the Webhook Integration

### Step 1: Trigger GitHub Events

Perform actions like pushing code, creating a pull request, or opening an issue in your repository to trigger webhooks.

### Step 2: Check Discord Notifications

Verify that the relevant GitHub event triggers a message in the specified Discord channel, such as:

- **Push event**: Notification with the commit message.
- **Pull request**: Notification with PR details.

---

## 8. Troubleshooting

- **Signature Mismatch**: Ensure that the **Webhook Secret** in your `.env` matches the secret in your GitHub App settings.
- **Discord Webhook Issues**: Ensure the Discord webhook URL is correct and that the server allows incoming webhooks.
- **Vercel Deployment Issues**: Ensure the Vercel deployment was successful and that your app is accessible via the correct URL.

---

## 9. Future Enhancements

- Support additional GitHub events.
- Customize Discord messages with more detailed information.
- Add error handling for edge cases, such as missing data in events.

---

With these steps, your GitHub webhook should successfully integrate with Discord, providing notifications for a variety of GitHub events.
