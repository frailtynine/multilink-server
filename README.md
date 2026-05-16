# Multilink Server

Every single music multilink service went down because Spotify changed their API rate limits. So, here's something you can host ypourself. Scrapes data from Spotify, Bandcamp, Apple Music and Deezer, for Tidal you need dev credentials. The API is protected by a token, so you can keep it private or share it with friends. Wouldn't recommend running it with thousands of requests per minute, but should be fine as a personal service.

## What this service does

Multilink Server is a Node.js/TypeScript API that takes a Spotify or Bandcamp album URL and returns matching links for other music platforms. The API is documented at `/docs`, and the generated OpenAPI document is available at `/openapi.json`.

## Deployment requirements

### Runtime stack

- Docker with Buildx support
- Docker Compose on the deployment host
- A Linux host reachable over SSH
- Node.js 22 only if you want to run the app outside Docker

### Network and hosting

The production compose file binds the container to `127.0.0.1:${EXTERNAL_PORT}:3000`, so the service is only exposed on localhost by default. For a public deployment, put it behind a reverse proxy such as Nginx, Caddy, or Traefik.

### Required server files

The deployment host must contain this repository at the path referenced by the GitHub Actions secret `DEPLOY_PATH`. That directory must include:

- `docker-compose.prod.yml`
- a production `.env` file

## Required configuration

### GitHub Actions secrets

The CI/CD workflow publishes a Docker image to Docker Hub and then deploys it over SSH. Configure these repository secrets:

| Secret | Purpose |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub username or org used for `docker login` |
| `DOCKERHUB_TOKEN` | Docker Hub access token with permission to push |
| `DOCKER_IMAGE` | Full image name, for example `frailtynine/multilink-server:latest` |
| `SERVER_HOST` | SSH host for the deployment machine |
| `SERVER_USER` | SSH username |
| `SSH_PRIVATE_KEY` | Private key used by the deploy action |
| `SERVER_PASSWORD` | SSH key passphrase if the key is encrypted |
| `DEPLOY_PATH` | Absolute path to the checked-out app on the server |

`DOCKER_IMAGE` must match the Docker Hub namespace you authenticate with. Example: if `DOCKERHUB_USERNAME` is `frailtynine`, use an image such as `frailtynine/multilink-server:latest`.

### Production `.env`

Create a `.env` file on the deployment host with the values your runtime needs:

| Variable | Required | Notes |
| --- | --- | --- |
| `PORT` | No | Defaults to `3000` inside the container |
| `EXTERNAL_PORT` | No | Host port mapped to container port 3000 |
| `API_TOKEN` | Yes | Required for authenticated API access |
| `TIDAL_CLIENT_ID` | Yes | Required for Tidal lookups |
| `TIDAL_CLIENT_SECRET` | Yes | Required for Tidal lookups |
| `LOG_LEVEL` | No | Defaults to `INFO` |
| `LOKI_URL` | No | Enables Loki log shipping when set |
| `LOKI_USER` | No | Loki username |
| `LOKI_API_KEY` | No | Loki API key |
| `REDIS_URL` | No | Reserved for future use |

Do not commit production secrets to the repository.

## CI/CD flow

On every pull request to `main`, GitHub Actions installs dependencies and runs `npm test`. On every push to `main`, it also:

1. Builds a multi-arch Docker image from `Dockerfile`
2. Pushes the image to Docker Hub using `DOCKER_IMAGE`
3. Connects to the server over SSH
4. Runs `docker compose -f docker-compose.prod.yml pull`
5. Recreates the service with `docker compose -f docker-compose.prod.yml up -d`

## Manual deployment

If you need to deploy without GitHub Actions, run this on the server from the repo directory:

```bash
export DOCKER_IMAGE=frailtynine/multilink-server:latest
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Post-deploy checks

- `GET /openapi.json` should return HTTP 200
- `GET /docs` should load the Swagger UI
- Protected endpoints must receive the `Authorization` header with `API_TOKEN` or `Bearer <API_TOKEN>`
