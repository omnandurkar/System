# ⚔️ THE SYSTEM (Solo Leveling)

> *"The System will help you grow. Whether you choose to survive or thrive is up to you."*

**The System** is a gamified productivity application inspired by the webtoon *Solo Leveling*. It transforms your daily life into an RPG where you are the protagonist. Complete tasks, conquer dungeons, defeat bosses, and physically level up to become an S-Rank Hunter.

![System Interface Placeholder](https://via.placeholder.com/800x400?text=THE+SYSTEM+UI)

---

## ⚡ Key Features

### 📅 The Daily Loop (Daily Quest)
Every day, **The System** assigns you a set of tasks to complete.
- **Auto-Generated Tasks**: Categories like "Morning", "Work", "Evening", and "Night".
- **Weekend Logic**: "Work" tasks are hidden on weekends. "Gym" and "Boxing" are replaced by Rest or Cardio.
- **Streak System**: Maintain your streak to earn buffs. Failing the Daily Loop (under 100%) triggers a **Penalty Quest**.

### 📊 Stats & Progression
- **Level Up**: Earn XP by completing tasks to increase your Level.
- **Attributes**: Allocate points to **Strength**, **Intelligence**, and **Vitality**.
    - **Vitality > 20** unlocks increased Fatigue capacity.
- **HP & Fatigue**:
    - Manage your **Fatigue** (increases with activity). High fatigue damages your **HP**.
    - **HP** regenerates daily. If HP hits 0, you fail.

### 🏋️ Gym & Physical Training
- **Workout Logs**: Track your lifts with specific days (Push, Pull, Legs, Boxing).
- **Intelligent Tracking**: Completing gym exercises automatically checks off "Gym" tasks in your Daily Loop.

### 👹 Boss Raids (Weekly Challenge)
- **Weekend Events**: Rare Bosses (e.g., *Igris the Blood Red*) appear on weekends.
- **Community / Global HP**: Your tasks deal damage to the Boss.
- **S-Rank Rewards**: Defeating a boss grants massive XP, Gold, and unique Titles.
- **Dynamic Ranks**: Your reward screen reflects your actual Hunter Rank (E to S).

### 🚨 Dungeon Breaks
- **Random Events**: A "Dungeon Break" can occur randomly during the day.
- **Urgent Quests**: Complete a challenge (e.g., "50 Pushups in 30 mins") to close the gate.
- **Consequences**: Success grants XP/Gold. Failure penalizes your HP.

### 🏆 Titles & Achievements
- Unlock specialized titles based on your actions:
    - **"The Early Bird"**: Wake up before 6 AM (XP Buff).
    - **"Iron Body"**: Complete 50 Gym sessions.
    - **"Scholar"**: Complete 20 Study sessions (Gold Buff).

### 💰 Shop & Inventory
- Earn **Gold** by completing quests.
- Buy **Potions** (Fatigue Recovery) or **Frames** for your avatar (Coming Soon).

---

## 🛠️ Technology Stack

Built with a modern, high-performance stack designed for speed and interactivity.

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router & Server Actions)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

Follow these instructions to awaken your System.

### Prerequisites
- Node.js 18+
- A Supabase Project (PostgreSQL)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/system-core.git
    cd system-core
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    # Connect to your Supabase Transaction Pooler (Port 6543) or Direct (5432)
    DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
    
    # Secret for Auth (if using NextAuth/JWT in future)
    NEXTAUTH_SECRET="your-secret-key"
    ```

4.  **Database Migration**
    Push the schema to your database:
    ```bash
    npx prisma db push
    ```
    *This creates tables like `users`, `daily_logs`, `tasks`, `gym_logs`, etc.*

5.  **Run the Server**
    ```bash
    npm run dev
    ```
    Access **The System** at `http://localhost:3000`.

---

## 💡 Player Tips

> [!TIP]
> **Don't Skip Leg Day**: Agility affects your ability to escape Penalty Zones.

> [!IMPORTANT]
> **Penalty System**: If you fail to complete your daily tasks (or earn < 10 XP) compared to yesterday, you will be thrown into a **Penalty Zone** the next day. You must complete a survival task (e.g., "Run 2km") to restore normal function.

> [!NOTE]
> **Weekends**: The System is merciful. "Work" tasks are auto-hidden on Sat/Sun. You can rest... or train harder for the Boss Raid.

---

## 📁 Project Structure

```
├── app/
│   ├── actions.js       # Server Actions (Game Logic, XP, Tasks)
│   ├── gym-action.js    # Gym specific logic
│   ├── layout.js        # Root layout & providers
│   └── page.js          # Main Dashboard
├── components/
│   ├── BossRaidWidget.js  # Boss Battle UI
│   ├── Dashboard.js       # Core Interface
│   ├── RankBadge.js       # Dynamic Rank Display
│   └── ...
├── lib/
│   ├── db.js            # Prisma Singleton
│   ├── rank.js          # Rank Calculation Logic
│   └── utils.js         # CSS Helpers
└── prisma/
    └── schema.prisma    # Database Models
```

---

## 🌟 Contributing

The System is always evolving. If you wish to add new features (e.g., Guilds, PvP, Shadow Extraction), submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/ShadowExtraction`)
3.  Commit your Changes (`git commit -m 'Add Shadow Extraction'`)
4.  Push to the Branch (`git push origin feature/ShadowExtraction`)
5.  Open a Pull Request

---

*"I used to be the weakest. Now... I level up alone."*
