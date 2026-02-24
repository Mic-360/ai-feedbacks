# AI Feedbacks 🤖✨

AI Feedbacks is a state-of-the-art web application designed to transform application issues and bugs into actionable prompts for coding agents. Built with **Next.js 15**, **Tailwind CSS v4**, and powered by **Google's Gemini 3 Flash Preview**, it offers a seamless way to bridge the gap between reporting an issue and fixing it.

![Banner](public/image.png)


## 🚀 Features

-   **AI Prompt Generation**: Upload a screenshot and provide a description of any bug. Gemini analyzes the visual and textual context to craft a perfect, copy-pasteable prompt for your favorite coding agent.
-   **Extension Integration**: An optional Chrome Extension captures precisely cropped screenshots, unhandled promise rejections, DOM state, and network logs straight from your active browser tab allowing you to skip manual uploads.
-   **Natural Language Search**: Don't remember the exact issue? Search through feedbacks using semantic, natural language queries powered by AI.
-   **Monochrome Aesthetic**: A premium, high-contrast monochrome design system (Black, White, and `#87ae73` accent) with light and dark mode support.
-   **Modern Interaction**: Smooth animations with `framer-motion` and a responsive, glassmorphic layout.
-   **Optimistic UI**: Instant feedback on form submissions for a snappy user experience.

## 🛠️ Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **AI Engine**: [Google Gemini 3 Flash Preview](https://deepmind.google/technologies/gemini/) via [Vercel AI SDK](https://sdk.vercel.ai/)
-   **Components**: [Shadcn UI](https://ui.shadcn.com/)
-   **State & Forms**: [@tanstack/react-form](https://tanstack.com/form/latest)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Extension**: Manifest V3, React, [Vite CRX](https://crxjs.dev/vite-plugin)

## 🔑 Getting Started

### 1. Prerequisites

Ensure you have [Bun](https://bun.sh/) or Node.js installed on your system.

### 2. Installation

Clone the repository and install dependencies:

```bash
bun install
```

### 3. Configuration (Gemini API Key)

To use the AI features, you need a Gemini API key.

1.  Go to the [Google AI Studio](https://aistudio.google.com/) and create a new API key.
2.  Create a `.env.local` file in the root of your project.
3.  Add your API key to the file:

```env
GEMINI_AI_API_KEY=your_actual_api_key_here
```

### 4. Running the Development Server

Start the app locally:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) to see the result.

## 🧩 Extension Setup (Optional)

AI Feedbacks includes a powerful companion Chrome Extension that you can use to capture issues seamlessly. 

1. Navigate to the extension folder and install dependencies:
```bash
cd extension
bun install
```

2. Build the extension bundle:
```bash
bun run build
```

3. Open your Chromium-based browser (Chrome, Edge, Brave, etc).
4. Go to `chrome://extensions/`
5. Turn on **Developer mode** in the top right.
6. Click **Load unpacked** in the top left.
7. Select the `extension/dist` folder from this project directory.
8. Start capturing bugs directly from any webpage you are working on!

## 📁 Project Structure

-   `app/api/`: Backend routes handling AI logic and storage.
-   `components/`: Reusable UI components and layout elements.
-   `lib/`: Core utilities including local JSON storage logic.
-   `public/`: Static assets including your custom logo and uploads.
-   `data/`: Local persistent store for feedback entries.

## 📝 License

Built with 💖 by bhaumic. Enjoy hacking!
