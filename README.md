
# Realm of the Everdice: A Storycrafter's Companion for Tabletop Adventures

**Realm of the Everdice** is a comprehensive D&D Dungeon Master companion web application that transforms digital storytelling into an interactive, book-like experience for tabletop roleplaying. 

The application provides advanced character creation and management tools with sophisticated AI-powered generation, dynamic storytelling capabilities, and robust character progression systems. Enhanced with intelligent combat detection, interactive battle tracking, immersive sound effects, and deep world-building features.

## ✨ Key Features

### 🧙‍♂️ Character Creation & Management
* **AI-Powered Character Generation** - Create fully-realized characters with detailed backstories, personality traits, and equipment
* **Custom Character Builder** - Fine-tune every aspect of your character from race and class to alignment and abilities
* **Character Progression System** - Track experience, level ups, and character development
* **Equipment Management** - Interactive inventory system to equip, unequip and manage items

### 🎲 Interactive Gameplay
* **Intelligent Dice Integration** - Clickable ability checks and dice rolls embedded directly in the narrative
* **Ambient Sound System** - Context-aware sound effects and background music that adapts to the narrative
* **Combat Detection** - Automatic battle mode activation when combat is detected in the story
* **Battle Tracker** - Comprehensive combat management with initiative tracking, status effects, and health monitoring

### 🤖 AI Dungeon Master
* **Dynamic Storytelling** - Advanced AI generates rich, engaging narratives and interactive adventures
* **NPC Generation** - Create diverse non-player characters with unique personalities, motivations, and dialogue
* **Adaptive Responses** - The AI learns from player choices and adapts the campaign accordingly
* **Campaign Generation** - Generate complete campaign settings, plots, and adventure hooks

### 🌎 World Building
* **Shared Superworld** - All campaigns exist within the "Everdice" metaverse with interconnected lore
* **World Map Generation** - AI-powered creation of detailed maps for continents, regions, and locations
* **Multiple Worlds Support** - Admins can create and manage separate "Everdice" worlds
* **Persistent Locations** - Track and revisit locations across multiple campaigns

### 🧠 Educational Integration
* **D&D Mechanics Learning** - Seamlessly teaches tabletop RPG mechanics through narrative integration
* **Real Rules Implementation** - Authentic implementation of tabletop RPG rules and systems
* **Learning Resources** - Comprehensive guides and references for new players

### 👥 Social Features
* **Party Planning** - Real-time collaborative interface for group adventure planning
* **Asynchronous Gameplay** - Allow players to participate in campaigns at their convenience
* **Chat System** - WebSocket-powered real-time chat for in-game and out-of-game communication
* **Party Management** - Add and remove players from campaigns with persistent character data

### 🔧 Administrative Features
* **Admin Dashboard** - Comprehensive statistics and management tools for admins
* **User Management** - Control user roles, access, and permissions
* **World Access Management** - Grant and revoke access to specific Everdice worlds
* **System Configuration** - Fine-tune application settings and monitor performance

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* PostgreSQL database
* OpenAI API key (for AI-powered features)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/realm-of-everdice.git
   cd realm-of-everdice
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/everdice
   OPENAI_API_KEY=your_openai_api_key
   SESSION_SECRET=your_session_secret
   ```

4. **Initialize the database**:
   ```bash
   npm run db:push
   ```

5. **Start the application**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   Open your browser and navigate to `http://localhost:5000`

## 🛠️ Technology Stack

### Frontend
* React.js with TypeScript
* Tailwind CSS with shadcn/ui components
* TanStack Query for data fetching
* wouter for routing
* WebSockets for real-time communication

### Backend
* Node.js with Express
* PostgreSQL database
* Drizzle ORM for database interactions
* OpenAI GPT-4o integration
* Passport.js for authentication

### Advanced Features
* WebSocket server for real-time updates
* Real-time audio processing and management
* Session-based authentication with role-based access control

## 📁 Project Structure

```
realm-of-everdice/
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions and services
│   │   ├── pages/           # Application pages
│   │   └── App.tsx          # Main application component
├── server/                  # Backend Express server
│   ├── auth.ts              # Authentication logic
│   ├── db.ts                # Database connection
│   ├── openai.ts            # OpenAI integration
│   ├── routes.ts            # API routes
│   └── storage.ts           # Data access layer
├── shared/                  # Shared code between frontend and backend
│   └── schema.ts            # Database schema and types
├── migrations/              # Database migrations
├── public/                  # Static assets
├── package.json             # Project dependencies and scripts
└── drizzle.config.ts        # Drizzle ORM configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgments

* OpenAI for providing the GPT-4o API that powers our AI features
* The D&D community for inspiration and feedback
* All contributors who have helped shape this project

---

*"In the Realm of Everdice, every roll of the dice opens a new chapter in your story."*
