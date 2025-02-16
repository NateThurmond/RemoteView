# Remote View

This project is a **remote web sharing application** utilizing **DOM diffing technology**, similar to what is found in React Native. It traverses the DOM tree to detect differences over time and transmits them via **WebSockets** to be rendered within the Remote View service application.

- The **server folder** contains the application needed to service support requests.
- The **client folder** contains the build script for the support service library JavaScript file that can be included in other websites.

---

## Getting Started

### Prerequisites
Ensure you have the following installed:
- **Docker Desktop** (or equivalent for your system)
- **Node.js & npm** (if running locally without Docker)

---

### Installation & Setup

#### 1. Clone the Repository
```sh
git clone https://github.com/NateThurmond/remoteView.git
cd remoteView
```

#### 2. Set Up Environment Variables
Copy the `.env.example` file and modify it as needed:
```sh
cp .env.example .env
```

#### 3. Build & Run the Application
To start the application using Docker:
```sh
docker-compose up --build -d
```

To shut down and clean up:
```sh
docker-compose down --rmi all --volumes --remove-orphans
docker system prune -a --volumes --force
```

---

## Development Workflow

### Running the Client Build
If you only need to rebuild the **client-side code**:
```sh
docker-compose run --rm client-builder npm run build
```

### Restarting the Server Without Rebuilding the Client
```sh
docker-compose up server --build
```

### Available npm Commands
You can also use the npm scripts from `package.json`:

| Command | Description |
|---------|-------------|
| `npm run dockerClean` | Remove all Docker images, volumes, and containers |
| `npm run dockerUpFresh` | Build and start everything from scratch |
| `npm run clientBuild` | Rebuild the client-side code |
| `npm run serverUp` | Start the server without rebuilding |
| `npm run serverDown` | Stop the server |
| `npm run serverBuild` | Rebuild and restart the server |

---

## Version History

- **0.2**
  - Consolidated Client/Server repositories
  - Modernized and containerized the application
- **0.1**
  - Initial Development, Demoable

---

## License

This project is licensed under the **Apache License, Version 2.0**.

## Authors

[@NateThurmond](https://github.com/NateThurmond)
