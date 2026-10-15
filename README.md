# Nexus

Nexus is a personal web dashboard for organizing frequently used websites, applications, and services in one place.

The goal is to build a customizable homepage with useful widgets, service integrations, and tools for managing personal projects and infrastructure.

Nexus is part of **Fulcrum**, my broader self-hosted infrastructure project.

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** CSS
- **Icons:** Lucide React
- **Backend (planned):** C#, ASP.NET Core
- **Hosting (planned):** Oracle Cloud, Ubuntu Linux
- **Version Control:** Git, GitHub

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Local Development

Clone the repository:

`git clone https://github.com/moerdgid/nexus.git`

Navigate to the frontend directory:

`cd nexus/frontend`

Install dependencies:

`npm install`

Start the development server:

`npm run dev`

Open the local address provided in the terminal.

## Current Features

- React frontend with reusable TypeScript components
- Categorized website links with Lucide icons
- Vertical navigation sidebar with active-page highlighting
- Shared navigation state managed through React
- Custom light and dark themes
- CSS variables for consistent styling
- Roboto typography

## Planned Features

- Functional navigation between dashboard sections
- Customizable homepage with interactive widgets
- Project and task management
- Search functionality
- Weather and calendar information
- Discord integration and voice channel activity
- Minecraft server status, player activity, and BlueMap integration
- Integration with other personal applications and services
- Fulcrum server monitoring and management
- Backend API with persistent data storage
- Authentication and secure remote access

## Development Status

**Early Development**

The initial React frontend is configured, and the basic dashboard layout is in place.

The application currently includes categorized website links, a navigation sidebar, and a custom theme system. Sidebar selection is functional, but individual pages have not yet been implemented.

Current development is focused on connecting navigation to the main workspace, building the initial dashboard components, and establishing the structure for future features.

Backend development and deployment will follow once the frontend is further along.

## Fulcrum

Fulcrum is my self-hosted infrastructure environment, intended to host Nexus and other personal services.

Nexus will provide a web interface for accessing those services, viewing information, and eventually monitoring and managing my Fulcrum environment.