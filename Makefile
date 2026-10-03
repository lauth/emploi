# Entry point for every common task (adrs/0007-makefile-as-command-entry-point.md).
# `make help` lists the targets.

SHELL := /bin/bash
.DEFAULT_GOAL := help

CLUSTER   := emploi
NAMESPACE := emploi
KUBECTL   := kubectl --context k3d-$(CLUSTER) --namespace $(NAMESPACE)
CERT_DIR  := .certs
API_URL   := https://api.emploi.localhost

.PHONY: help
help: ## List the targets
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

##@ Code

.PHONY: install
install: ## Install dependencies (pnpm workspace)
	pnpm install

.PHONY: build
build: ## Build back and front
	pnpm --recursive build

.PHONY: lint
lint: ## Lint every package
	pnpm --recursive lint

.PHONY: lint-fix
lint-fix: ## Lint every package and apply automatic fixes
	pnpm --recursive lint:fix

.PHONY: format
format: ## Format every file with Prettier
	pnpm format

.PHONY: format-check
format-check: ## Check formatting
	pnpm format:check

.PHONY: typecheck
typecheck: ## Type-check every package
	pnpm --recursive typecheck

.PHONY: test
test: ## Run unit tests (back and front)
	pnpm --recursive test

.PHONY: test-e2e
test-e2e: ## Run back e2e tests
	pnpm --filter back test:e2e

.PHONY: test-back
test-back: ## Run back unit tests, filtered with T=<path or name>, e.g. make test-back T=health
	pnpm --filter back exec vitest run $(T)

.PHONY: test-front
test-front: ## Run front tests, filtered with T=<path or name>, e.g. make test-front T=page
	pnpm --filter front exec vitest run $(T)

.PHONY: check
check: format-check lint typecheck test test-e2e ## Run every check; must pass before a change is done

##@ Browser tests (Playwright, against the running cluster)

.PHONY: browser-install
browser-install: ## Download the Chromium build used by Playwright (once per machine)
	pnpm --filter e2e browser:install

.PHONY: test-browser
test-browser: ## Run the browser tests, filtered with T=<file or name>, e.g. make test-browser T=offers
	pnpm --filter e2e test:browser $(T)

.PHONY: browser-report
browser-report: ## Open the report of the last browser test run
	pnpm --filter e2e report

##@ Database (needs back/.env and a running cluster)

.PHONY: db-generate
db-generate: ## Generate the Prisma client from the schema
	pnpm --filter back prisma:generate

.PHONY: db-migrate
db-migrate: ## Create and apply a migration, then regenerate the client: make db-migrate NAME=<change>
	@test -n "$(NAME)" || { echo "Usage: make db-migrate NAME=<change>"; exit 1; }
	pnpm --filter back prisma:migrate --name $(NAME)
	pnpm --filter back prisma:generate

.PHONY: db-deploy
db-deploy: ## Apply pending migrations to the cluster database
	pnpm --filter back prisma:deploy

.PHONY: db-studio
db-studio: ## Open Prisma Studio on the cluster database
	pnpm --filter back prisma:studio

##@ Local cluster (k3d)

.PHONY: up
up: cluster-create secrets certs images deploy db-deploy ## Create the cluster and deploy everything
	@echo "Ready: https://emploi.localhost and $(API_URL)"

.PHONY: down
down: cluster-delete ## Delete the cluster and its data

.PHONY: cluster-create
cluster-create: ## Create the k3d cluster if it does not exist
	@k3d cluster get $(CLUSTER) >/dev/null 2>&1 || k3d cluster create --config k8s/k3d-cluster.yaml
	kubectl --context k3d-$(CLUSTER) apply -f k8s/namespace.yaml

.PHONY: cluster-delete
cluster-delete: ## Delete the k3d cluster
	k3d cluster delete $(CLUSTER)

.PHONY: cluster-start
cluster-start: ## Start the stopped cluster
	k3d cluster start $(CLUSTER)

.PHONY: cluster-stop
cluster-stop: ## Stop the cluster (data is kept)
	k3d cluster stop $(CLUSTER)

.PHONY: secrets
secrets: ## Create the database secret from .env
	@test -f .env || { echo "Missing .env: cp .env.example .env"; exit 1; }
	@set -a && source ./.env && set +a && \
	$(KUBECTL) create secret generic emploi-db \
		--from-literal=POSTGRES_USER="$$POSTGRES_USER" \
		--from-literal=POSTGRES_PASSWORD="$$POSTGRES_PASSWORD" \
		--from-literal=POSTGRES_DB="$$POSTGRES_DB" \
		--from-literal=DATABASE_URL="postgresql://$$POSTGRES_USER:$$POSTGRES_PASSWORD@postgres:5432/$$POSTGRES_DB" \
		--dry-run=client --output yaml | $(KUBECTL) apply -f -

$(CERT_DIR)/emploi.pem:
	mkdir -p $(CERT_DIR)
	mkcert -cert-file $(CERT_DIR)/emploi.pem -key-file $(CERT_DIR)/emploi-key.pem \
		emploi.localhost api.emploi.localhost '*.emploi.localhost'

.PHONY: certs
certs: $(CERT_DIR)/emploi.pem ## Generate the mkcert certificate and store it as the TLS secret
	$(KUBECTL) create secret tls emploi-tls \
		--cert $(CERT_DIR)/emploi.pem --key $(CERT_DIR)/emploi-key.pem \
		--dry-run=client --output yaml | $(KUBECTL) apply -f -

.PHONY: images
images: ## Build the back and front images and import them into the cluster
	docker build --file back/Dockerfile --tag emploi-back:dev .
	docker build --file front/Dockerfile --tag emploi-front:dev .
	k3d image import --cluster $(CLUSTER) emploi-back:dev emploi-front:dev

.PHONY: deploy
deploy: ## Apply the manifests and restart the apps on the imported images
	$(KUBECTL) apply --kustomize k8s
	$(KUBECTL) rollout status statefulset/postgres --timeout 180s
	$(KUBECTL) rollout restart deployment/back deployment/front
	$(KUBECTL) rollout status deployment/back --timeout 180s
	$(KUBECTL) rollout status deployment/front --timeout 180s

.PHONY: status
status: ## Show the cluster resources
	$(KUBECTL) get pods,services,ingress

.PHONY: logs
logs: ## Follow the logs of an app: make logs APP=back|front|postgres
	@test -n "$(APP)" || { echo "Usage: make logs APP=back|front|postgres"; exit 1; }
	$(KUBECTL) logs --follow --selector app.kubernetes.io/name=$(APP)
