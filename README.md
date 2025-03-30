When2Meet Clone

A React application built using Vite that allows users to create and share schedules with friends to find the best time to meet. Inspired by the popular When2Meet tool, but with enhanced features such as user authentication, friend systems, and Notion calendar integration.

📖 Description

The When2Meet Clone aims to make scheduling meetups with friends easier by providing a streamlined UI and the ability to import schedules from platforms like Google Calendar or Notion. The app supports creating accounts, adding friends, viewing their schedules, and finding common available times.

🚀 Features

✅ User Authentication (Login/Register)

✅ Friend System (Add/Remove Friends)

✅ Schedule Import from Notion

✅ Dynamic Calendar UI

✅ Free-Time Finder using AI

✅ Responsive Design using TailwindCSS

📦 Installation

Clone the repository

git clone <your-repo-url>
cd when2meet

Install dependencies

npm install

Run the app

npm run dev

The app will run at http://localhost:3000.

🔑 Environment Variables

The app uses a .env file to store sensitive information. Create a .env file in the root directory with the following content:

VITE_API_URL=http://localhost:5000/api
REACT_APP_NOTION_CLIENT_ID=your_notion_client_id
REACT_APP_NOTION_CLIENT_SECRET=your_notion_client_secret
REACT_APP_NOTION_REDIRECT_URI=http://localhost:3000/callback

📚 Usage

Visit the app at http://localhost:3000.

Register or log in to access the scheduling features.

Connect your Notion account via OAuth to import schedules.

Add friends and compare schedules to find free times.

Use the AI feature to suggest best meeting times.

🛠️ Technologies Used

React (Frontend Framework)

Vite (Build Tool)

TailwindCSS (Styling)

Notion API (Schedule Integration)

ESLint (Code Linting)

📜 License

This project is licensed under the MIT License. See the LICENSE file for details.

📌 Note

This project is currently under development. New features and improvements are being added regularly.

