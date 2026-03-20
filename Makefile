include .env

# =============================
# Build dependencies
# =============================
init:
	@$(MAKE) prepare

prepare:
	pnpm i
ifeq ($(NODE_ENV),production)
	@echo "Preparing production container..."
	docker compose -f docker-compose.prod.yml build
else
	@echo "Preparing development container..."
	docker compose -f docker-compose.dev.yml build
endif

start:
ifeq ($(NODE_ENV),production)
	@echo "Starting production container..."
	docker compose -f docker-compose.prod.yml up -d
else
	@echo "Starting development container..."
	docker compose -f docker-compose.dev.yml up
endif

stop:
	docker stop kuzu-app

logs:
	docker logs -f kuzu-app

bash:
	docker exec -it kuzu-app sh
