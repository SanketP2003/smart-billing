# Smart Billing Application

An enterprise-grade SaaS billing management system built with Spring Boot, React, Vite, and Tailwind CSS.

## Architecture

This application follows a modern monolithic architecture divided into two primary services:

### Backend
- **Framework**: Spring Boot 3
- **Language**: Java 17
- **Database**: H2 (In-Memory/File-Based Relational Database)
- **Authentication**: JWT (JSON Web Tokens) with Spring Security
- **AI Integration**: Google Gemini API for actionable insights and natural language processing

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn UI
- **State Management**: React Hooks & Context
- **Routing**: React Router DOM
- **Data Visualization**: Recharts

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Java (JDK 17+)
- Maven

### Environment Variables
Configure the following properties in `backend/src/main/resources/application.properties`:
- `gemini.api-key`: Your Google Gemini API Key

### Local Development

#### Starting the Backend
```bash
cd backend
mvn spring-boot:run
```
The backend will run on `http://localhost:8080`.

#### Starting the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Docker Deployment

This repository includes a full Docker configuration for easy deployment.

### Using Docker Compose
To build and run both the frontend and backend services simultaneously:
```bash
docker-compose up --build
```
- The frontend will be accessible at `http://localhost:80`
- The backend will be accessible at `http://localhost:8080`

## AI Features
- **Actionable Dashboard Insights**: Analyzes raw revenue and stats to output strategic business recommendations using Gemini 3.5 Flash.
- **Smart Product Descriptions**: Generates SEO-friendly marketing copy from technical product details.
- **Natural Language Search**: Interprets conversational queries into structured JSON filters.
