# ./node_modules/.bin on the PATH
export PATH := ./node_modules/.bin:$(PATH)

# Use bash not sh
SHELL := /bin/bash

#
# META TASKS
#

.PHONY: test

# DEPLOY SUB-TASKS

npm-publis%: ## npm-publish: Publish this package to npm.
	npm-prepublish --verbose
	npm publish --access public

# BUILD SUB-TASKS

hel%: ## help: Show this help message.
	@echo "usage: make [target] ..."
	@echo ""
	@echo "targets:"
	@grep -Eh '^.+:\ ##\ .+' ${MAKEFILE_LIST} | cut -d ' ' -f '3-' | column -t -s ':'
