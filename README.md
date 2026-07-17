# Zero no Suika 🍉

A **Tribe Nine** fanmade Suika (Watermelon) game built with React and Matter.js physics.

> This is a non-profit fanmade game for the series Tribe Nine. Both Tribe Nine and Suika game belongs to their respective owner.

## 🎮 How to Play

1. **Drop mascots** into the box by clicking or tapping.
2. When **two identical mascots** collide, they **merge** into the next tier.
3. Work your way up through all **9 tiers** of evolution.
4. Merging two **top-tier mascots** triggers a celebration and awards a **+1000 bonus**.
5. Don't let the mascots overflow past the warning line — you have **2 seconds** before **Game Over**!

## ✨ Features

- **9 unique Tribe Nine mascots** with tiered evolution system
- **Matter.js physics** for realistic drop and collision mechanics
- **Daily Top 3 leaderboard** (local storage, resets daily)
- **Background music** and sound effects (merge, drop, game over)
- **Bilingual support** — English / Japanese (EN/JP toggle)
- **Responsive design** — works on desktop and mobile
- **Evolution Wheel** — visual chart showing all mascot tiers
- **Confetti celebrations** when reaching the highest tier
- **Futuristic cyberpunk UI** with neon glow aesthetics
- **Asset preloader** with interactive loading screen

## 🛠️ Tech Stack

- **React** — UI framework
- **Vite** — build tool and dev server
- **Matter.js** — 2D physics engine
- **canvas-confetti** — celebration effects
- **Lucide React** — icon library
- **GitHub Pages** — automated deployment via GitHub Actions

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Installation

```bash
git clone https://github.com/Quiet-Crab-Company/zero-suika.git
cd zero-suika
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## 📁 Project Structure

```
├── public/
│   ├── assets/          # Mascot images (1.webp - 9.webp)
│   ├── game-over.mp3    # Game over sound effect
│   └── すやすやタイム.mp3  # Background music
├── src/
│   ├── components/
│   │   ├── GameCanvas.jsx   # Main game canvas with physics engine
│   │   ├── ScoreBoard.jsx   # Score panel, daily scores, controls
│   │   └── MergeChart.jsx   # Evolution wheel visualization
│   ├── config/
│   │   └── mascots.js       # Mascot tier definitions
│   ├── App.jsx              # Root application component
│   ├── index.css            # Global styles and design system
│   └── main.jsx             # Entry point
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages deployment
└── index.html               # HTML entry point
```

## 👤 Credits

- **Created by** [Nisie | カニシズ](https://x.com/qkz_iroiro)
- **Tribe Nine** © Akatsuki / Too Kyo Games
- **Suika Game** © Aladdin X

## 📄 License

This is a non-profit fanmade project. All intellectual property belongs to their respective owners.
