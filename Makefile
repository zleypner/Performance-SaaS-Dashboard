.PHONY: help install dev build start test test-watch test-e2e lint typecheck db-up db-down db-migrate db-seed db-studio clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

start: ## Start production server
	npm run start

test: ## Run unit tests
	npm run test

test-watch: ## Run unit tests in watch mode
	npm run test:watch

test-e2e: ## Run E2E tests
	npm run test:e2e

lint: ## Run linter
	npm run lint

typecheck: ## Run TypeScript type check
	npm run typecheck

db-up: ## Start PostgreSQL database (Docker)
	docker-compose up -d postgres

db-down: ## Stop PostgreSQL database
	docker-compose down

db-migrate: ## Run database migrations
	npm run db:migrate

db-seed: ## Seed the database
	npm run db:seed

db-studio: ## Open Prisma Studio
	npm run db:studio

db-reset: ## Reset database (drop, migrate, seed)
	npx prisma migrate reset --force

clean: ## Clean build artifacts
	rm -rf .next node_modules

setup: install db-up db-migrate db-seed ## Full setup (install deps, start DB, migrate, seed)
	@echo "Setup complete! Run 'make dev' to start the development server."
