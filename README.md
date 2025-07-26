# Judson Saji - Creator: A Dynamic Digital Portfolio

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_NETLIFY_SITE_ID_HERE/deploy-status)](https://app.netlify.com/sites/judsonsaji/deploys)
[![Built with HTML, CSS, JavaScript](https://img.shields.io/badge/Built%20with-HTML%2C%20CSS%2C%20JavaScript-blueviolet)](https://github.com/Judson-web)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

---

## ✨ Introduction

Welcome to the repository for **Judson Saji - Creator**, a unique and interactive digital portfolio designed to showcase the intersection of art, code, and minimalist philosophy. This website serves as a dynamic expression of a creator's journey, blending personal insights with cutting-edge AI integrations and engaging user experiences.

Explore a space where creativity meets technology, offering a glimpse into projects, thoughts, and interactive experiments.

## 🚀 Features

This website is packed with interactive and dynamic elements:

* **Dynamic Backgrounds:** Experience subtle Starfield (dark theme) and Bubbles (light theme) animations that create an immersive atmosphere.
* **Theme Toggle:** Seamlessly switch between dark and light modes to suit your preference.
* **Personalized Greeting:** An AI-powered greeting on the main profile card welcomes returning visitors with a unique message.
* **Real-time Status Widgets:** Stay updated with current time, local weather, and live GitHub statistics (followers and public repositories).
* **Now Playing Music Integration:** See what Judson is currently listening to via Last.fm integration.
* **Interactive GitHub Projects:**
    * Fetches and displays the latest GitHub repositories.
    * **AI-Summarized Project Descriptions:** Get a concise, AI-generated summary for each project with a click.
    * **AI Project Idea Generator:** Spark creativity with AI-generated project ideas directly on the projects page.
* **Generative Art Lab:** A dedicated interactive canvas where you can manipulate a particle system with various controls (count, size, speed, repulsion, lines, colors) and even generate AI-suggested color palettes.
* **CLI (Contact Terminal):** A command-line interface for direct interaction, including commands like:
    * `help`: Displays available commands.
    * `clear`: Clears the terminal screen.
    * `whoami`: Provides user information.
    * `date`: Shows current date and time.
    * `contact`: Displays contact information.
    * `social`: Shows social media links.
    * `theme`: Toggles website theme.
    * `ip`: Shows your public IP address.
    * `status`: Displays session statistics (uptime, AI queries, theme, AI mood).
    * `ask`: Engage in general AI questions.
    * `dream`: Ask the AI to interpret a dream whimsically.
    * `cmd`: Opens the command palette.
    * `exit`: Closes the terminal.
* **Chatbot AI:** A separate, dedicated modal for direct, conversational interaction with an AI assistant. It maintains chat history and includes save/load functionality.
* **Responsive Navigation Drawer:** A sleek hamburger menu for mobile devices, dynamically populated with navigation links and featuring consistent website branding.
* **Custom Right-Click Context Menu:** Replaces the default browser context menu with custom actions (change theme, open CLI, copy page URL).
* **Subtle Animations:** Enhanced hover effects (including a unique glitch effect on buttons) and dynamic updates for status icons.
* **Dynamic Cursor Trail:** A subtle particle trail that follows the mouse across the page, adapting to the current theme.
* **Scroll-Triggered Animations:** Elements subtly fade and slide into view as you scroll down the page, enhancing visual flow.

## 🛠️ Technical Stack

* **Frontend:**
    * HTML5, CSS3, Vanilla JavaScript
    * [Feather Icons](https://feathericons.com/) for sleek SVG icons
    * [Tone.js](https://tonejs.github.io/) for interactive audio feedback
* **Backend (Serverless Functions):**
    * [Netlify Functions](https://docs.netlify.com/functions/overview/) (Node.js) for secure API proxying.
* **APIs Integrated (via Netlify Functions):**
    * **Google Gemini API:** Powers AI-generated content (project ideas, CLI responses, generative art palettes).
    * **Last.fm API:** Fetches "Now Playing" music data.
    * **wttr.in:** Provides local weather information.
    * **GitHub API:** Retrieves project and profile statistics.
    * **ipinfo.io:** Used for public IP address lookup.
* **Deployment:** [Netlify](https://www.netlify.com/) for continuous deployment and serverless function hosting.

## 🚀 Getting Started

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Judson-web/mybio.git](https://github.com/Judson-web/mybio.git) # Replace with your actual repo URL
    cd mybio
    ```
2.  **Install Netlify CLI (if you don't have it):**
    ```bash
    npm install -g netlify-cli
    ```
3.  **Set up Environment Variables:**
    You need to set up the following environment variables in your Netlify site settings (or locally via a `.env` file if using Netlify CLI for local functions testing):
    * `GEMINI_API_KEY` (from [Google AI Studio](https://aistudio.google.com/app/apikey))
    * `LASTFM_API_KEY` (from [Last.fm API](https://www.last.fm/api/account/create))
    * `LASTFM_USERNAME` (your Last.fm username)
    
    **Important:** Never commit your API keys directly to your repository!
    For local testing with Netlify CLI, you can create a `.env` file in the root of your project:
    ```
    GEMINI_API_KEY="your_gemini_api_key_here"
    LASTFM_API_KEY="your_lastfm_api_key_here"
    LASTFM_USERNAME="your_lastfm_username_here"
    ```
4.  **Run Locally:**
    Since this is primarily a static site with Netlify Functions, you can serve it with Netlify CLI:
    ```bash
    netlify dev
    ```
    This will start a local development server and proxy your Netlify Functions.

## 💡 Usage

Simply open `index.html` in your browser or visit the live Netlify deployment. Interact with the various modals, try out the CLI commands, and explore the generative art lab!

## 🤝 Contributing

Feel free to fork the repository, open issues, or submit pull requests. Any contributions to enhance this digital experience are welcome!

## 📄 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

## 📞 Contact

* **Live Website:** [judsonsaji.netlify.app](https://judsonsaji.netlify.app/)
* **GitHub:** [Judson-web](https://github.com/Judson-web)
* **Twitter:** [@greyvrita](https://twitter.com/greyvrita)
* **Instagram:** [@judson_saji](https://www.instagram.com/judson_saji)

---
