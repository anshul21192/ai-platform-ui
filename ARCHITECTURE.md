# AI Platform UI – Architecture & Local Development Guide

## Overview

The AI Platform UI is a full-stack application consisting of:

- **Frontend** – React + TypeScript + Vite
- **Backend** – Python FastAPI REST APIs
- **Containerization** – Docker & Docker Compose
- **Deployment Target** – Google Cloud Run

The repository is organized as a monorepo, allowing both frontend and backend to be developed and deployed together.

---

# Repository Structure

```
ai-platform-ui/
│
├── frontend/                 # React + Vite application
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── backend/                  # FastAPI application
│   ├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── data/
│
├── docker-compose.yml        # Local Docker orchestration
├── package.json              # Root scripts
├── run-local.sh              # Linux/macOS helper script
├── run-local.ps1             # Windows PowerShell helper script
└── .github/
    └── workflows/
        └── gcp-deploy.yml    # CI/CD pipeline
```

---

# Application Architecture

```
                +----------------------+
                |   React + Vite UI    |
                |      (Frontend)      |
                +----------+-----------+
                           |
                    HTTP / REST APIs
                           |
                           ▼
                +----------------------+
                |   FastAPI Backend    |
                |  Verification APIs   |
                |  Telemetry APIs      |
                |  AI Services         |
                +----------+-----------+
                           |
          +----------------+----------------+
          |                                 |
          ▼                                 ▼
   Data Storage                    External Services
                                  (Vertex AI / GCP APIs)
```

---

# Components

## Frontend

**Technology**

- React
- TypeScript
- Vite

**Responsibilities**

- User Interface
- Dashboard
- Telemetry Visualization
- Verification Workflows
- API Integration

**Docker**

- Multi-stage build
- Static assets served using **Nginx**
- Internal container port: **80**
- Host port: **5173**

Dockerfile:

```
frontend/Dockerfile
```

---

## Backend

**Technology**

- FastAPI
- Python 3.11
- Uvicorn

**Responsibilities**

- Behaviour telemetry
- Verification APIs
- Incident APIs
- AI service integration
- External API communication

Container Port:

```
8000
```

Dockerfile:

```
backend/Dockerfile
```

---

# Local Development

There are two supported ways to run the application.

---

## Option 1 – Run using Docker (Recommended)

### Prerequisites

- Docker Desktop
- Docker Compose

Verify installation

```bash
docker --version
docker compose version
```

---

## Option 2 – Run using Podman

### Prerequisites

- Podman
- Podman Compose

Verify installation

```bash
podman --version
podman compose version
```

---

### Command Reference

From the project root:

| Action            | Docker                      | Podman                      |
| ----------------- | --------------------------- | --------------------------- |
| Build images      | `docker compose build`      | `podman compose build`      |
| Build & run       | `docker compose up --build` | `podman compose up --build` |
| Run in background | `docker compose up -d`      | `podman compose up -d`      |
| Stop containers   | `docker compose down`       | `podman compose down`       |
| View logs         | `docker compose logs -f`    | `podman compose logs -f`    |

---

### Application URLs

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:8000
```

Swagger API

```
http://localhost:8000/docs
```

---

## Option 3 – Run Locally (Without Containers)

### Frontend

Navigate to the frontend folder

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Start development server

```bash
npm run dev
```

Default URL

```
http://localhost:5173
```

---

### Backend

Navigate to backend

```bash
cd backend
```

Create virtual environment

Windows

```powershell
python -m venv venv
venv\Scripts\activate
```

Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run FastAPI

```bash
uvicorn app.main:app --reload
```

Backend URL

```
http://localhost:8000
```

Swagger

```
http://localhost:8000/docs
```

---

## Root Development Script

The repository also provides a root development script that starts both frontend and backend together.

From the project root

```bash
npm install
npm run dev
```

This command:

- Starts the Vite frontend
- Starts the FastAPI backend
- Runs both processes concurrently

---

# Docker Files

## Frontend

```
frontend/Dockerfile
```

Responsibilities

- Install dependencies
- Build Vite application
- Serve production build using Nginx

---

## Backend

```
backend/Dockerfile
```

Responsibilities

- Install Python dependencies
- Copy application source
- Start FastAPI using Uvicorn

---

# Container Orchestration

```
docker-compose.yml
```

Defines:

- Frontend service
- Backend service
- Port mappings
- Container startup order
- Restart policies

---

# Deployment

Production deployments are automated using GitHub Actions.

Workflow

```
.github/workflows/gcp-deploy.yml
```

Pipeline Responsibilities

- Build Docker images
- Push images to Google Artifact Registry
- Deploy frontend and backend containers
- Deploy services to Google Cloud Run

---

# Common Commands

### Build Container Images

```bash
docker compose build    # or: podman compose build
```

### Run Application

```bash
docker compose up --build    # or: podman compose up --build
```

### Run in Background

```bash
docker compose up -d    # or: podman compose up -d
```

### Stop Containers

```bash
docker compose down    # or: podman compose down
```

### View Logs

```bash
docker compose logs -f    # or: podman compose logs -f
```

### Frontend Only

```bash
cd frontend
npm run dev
```

### Backend Only

```bash
cd backend
uvicorn app.main:app --reload
```

---

# Technology Stack

| Layer            | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Frontend         | React, TypeScript, Vite                        |
| Backend          | FastAPI, Python 3.11                           |
| Containerization | Docker, Docker Compose, Podman, Podman Compose |
| Web Server       | Nginx                                          |
| API Server       | Uvicorn                                        |
| CI/CD            | GitHub Actions                                 |
| Cloud            | Google Cloud Run                               |
