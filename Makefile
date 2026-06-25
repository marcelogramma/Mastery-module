help: ## Show this help.
	@egrep -h '\s##\s' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; { if ($$1 == "$@") printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2; exit;}'
	@egrep -h '\s##\s' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; { if ($$1 != "$@") printf "%-30s|%s\n", $$1, $$2}' \
		| LC_COLLATE=C sort --ignore-case \
		| awk -F '|' '{printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'
.PHONY: help

all:
	@echo "Please choose a task."
.PHONY: all

ENVIRONMENT := "development"

lint: lint-markdown lint-yaml lint-xml lint-json lint-aws-cloudformation lint-aws-sam ## Lint.
.PHONY: lint

lint-markdown: ## Lint - markdownlint.
	@markdownlint .
.PHONY: lint-markdown

lint-json: INDENTATION := "    "
lint-json: SHELL := /bin/bash
lint-json: ## Lint - JSON Lint.
	@EXIT_CODE=0; \
	for FILE in $$(find . -type f \
		-name '*.json' \
		-not -path './.cache/*' \
		-not -path './.mypy_cache/*' \
		-not -path './.pylint/*' \
		-not -path './.venv/*' \
		-not -path './dist/*' \
		| sed 's|^./||' \
	); do \
		ORIGINAL="$$(cat "$${FILE}")"; \
		RESULT="$$(jsonlint --indent '${INDENTATION}' "$${FILE}")"; \
		if [ "$${ORIGINAL}" != "$${RESULT}" ]; then \
			EXIT_CODE=1; \
			FINDINGS="$$(diff \
				--minimal \
				--old-line-format='' \
				--new-line-format='' \
				--old-group-format='' \
				--new-group-format='%dF:%(F=L?:%dL) \
%>' \
				--changed-group-format='%df:%(f=l?%df:%dl) \
%>' \
				--unchanged-group-format='' \
				<(echo "$${ORIGINAL}") <(echo "$${RESULT}"))"; \
			for FINDING in $${FINDINGS}; do \
				if [ 'github' = "${ENVIRONMENT}" ]; then \
					echo "$${FINDING}" | awk --assign FILE="$$FILE" --field-separator=':' \
						'{ print "::error file=" FILE ",line=" $$1 ",endLine=" $$2 "::Wrong indentation." }'; \
				else \
					echo "$${FINDING}" | awk --assign FILE="$$FILE" --field-separator=':' \
						'{ print "File \"" FILE "\" is using wrong indentation from line " $$1 " to " $$2 "." }'; \
				fi; \
			done; \
		fi; \
	done; \
	exit $${EXIT_CODE};
.PHONY: lint-json

lint-yaml: ## Lint - YAMLlint.
	@if [ 'github' = "${ENVIRONMENT}" ]; then \
		RESULT="$$(yamllint --strict --format github .)"; \
		EXIT_CODE=$$?; \
		if [ $${EXIT_CODE} -ne 0 ]; then \
			echo "$${RESULT}" | sed --regexp-extended 's|( file=\|::group::)./|\1|'; \
		fi; \
		exit $${EXIT_CODE}; \
	else \
		yamllint --strict .; \
	fi;
.PHONY: lint-yaml

lint-xml: ## Lint - xmllint.
	@find . \( -name '*.xml' \) \
		-not -path './.cache/*' \
		-not -path './.mypy_cache/*' \
		-not -path './.pylint/*' \
		-not -path './.venv/*' \
		-not -path './dist/*' \
		| while read xmlFile; \
	do \
		XMLLINT_INDENT='    ' xmllint --encode UTF-8 --format "$$xmlFile"|diff - "$$xmlFile"; \
		if [ $$? -ne 0 ] ;then echo "$$xmlFile" && exit 1; fi; \
	done
.PHONY: lint-xml

lint-xml-github: SHELL := /bin/bash
lint-xml-github: ## Lint - xmllint (GitHub Actions output format).
	@HAS_ERRORS=0; \
	while read xmlFile; \
	do \
		XMLLINT_INDENT='    ' xmllint --encode UTF-8 --format "$$xmlFile"|diff \
			--minimal \
			--old-line-format='' \
			--new-line-format='' \
			--old-group-format='' \
			--new-group-format=$$xmlFile':%dF:%(F=L?:%dL): %<format error \
%>' \
			--changed-group-format=$$xmlFile':%df:%(f=l?%df:%dl): %<format error \
%>' \
			--unchanged-group-format='' \
			- "$$xmlFile"; \
		if [ $$? -ne 0 ]; then HAS_ERRORS=1; fi; \
	done <<<$$(find . \( -name '*.xml' -or -name '*.xliff' -or -name '*.xlf' \) \
		-not -path './.cache/*' \
		-not -path './.mypy_cache/*' \
		-not -path './.pylint/*' \
		-not -path './.venv/*' \
		-not -path './dist/*' \
	); \
	exit $${HAS_ERRORS};
.PHONY: lint-xml-github

cs-fix-xml: ## Fix coding standard issues - xmllint.
	@find . \( -name '*.xml' \) \
		-not -path './.cache/*' \
		-not -path './.mypy_cache/*' \
		-not -path './.pylint/*' \
		-not -path './.venv/*' \
		-not -path './dist/*' \
		| while read xmlFile; \
	do \
		XMLLINT_INDENT='    ' xmllint --encode UTF-8 --format "$$xmlFile" --output "$$xmlFile"; \
	done
.PHONY: cs-fix-xml

lint-aws-cloudformation: ## Lint - cfn-lint.
	@cfn-lint --config-file .aws/sam/.cfnlintrc.yaml
.PHONY: lint-aws-cloudformation

lint-aws-cfn-guard: ## Lint - cfn-guard (CloudFormation policy guards).
	@cfn-guard validate \
		--data .aws/sam/ \
		--rules .aws/sam/guards/ \
		--show-summary all
.PHONY: lint-aws-cfn-guard

test-aws-cfn-guard: RULES_DIR := .aws/sam/guards
test-aws-cfn-guard: TEST_DIR := tests/aws/cloudformation/guards
test-aws-cfn-guard: ## Test - cfn-guard unit tests (tests/aws/cloudformation/guards/).
	@set -e; \
	for RULE in $(wildcard $(RULES_DIR)/*.guard); do \
		FILENAME=$$(basename "$${RULE}"); \
		TEST_FILE="$(TEST_DIR)/$${FILENAME}.test.yaml"; \
		if [ ! -f "$${TEST_FILE}" ]; then \
			echo "Missing test data for $${FILENAME}: $${TEST_FILE}" >&2; \
			exit 1; \
		fi; \
		echo "Testing $${FILENAME}..."; \
		cfn-guard test \
			--rules-file "$${RULE}" \
			--test-data "$${TEST_FILE}"; \
	done
.PHONY: test-aws-cfn-guard

lint-aws-cloudformation-cfn-nag: ## Lint - cfn_nag.
	@if [ 'github' = "${ENVIRONMENT}" ]; then \
		RESULT="$$(cfn_nag_scan \
			--input-path .aws/sam/ \
			--template-pattern '.*\.yaml$$' \
			--output-format json \
			--isolate-custom-rule-exceptions \
			--deny-list-path .aws/sam/.cfn_nag_deny_list.yaml \
			--fail-on-warnings \
		)"; \
		EXIT_CODE=$$?; \
		echo "$${RESULT}" \
			| jq -cr '.[] | .filename as $$filename | .file_results.violations[] | "::error file=\($$filename),line=\(.line_numbers[])::\(.id) \(.message)"'; \
	else \
		RESULT="$$(cfn_nag_scan \
			--input-path .aws/sam/ \
			--template-pattern '.*\.yaml$$' \
			--isolate-custom-rule-exceptions \
			--deny-list-path .aws/sam/.cfn_nag_deny_list.yaml \
			--fail-on-warnings \
		)"; \
		EXIT_CODE=$$?; \
		echo "$${RESULT}"; \
	fi; \
	exit $${EXIT_CODE};
.PHONY: lint-aws-cloudformation-cfn-nag

lint-aws-sam: ## Lint - AWS SAM.
	@sam validate --lint --config-file .aws/sam/samconfig.toml
.PHONY: lint-aws-sam

spellcheck: ## Lint - CSpell.
	@cspell lint --config .cspell/cspell.yaml
.PHONY: spellcheck

lint-spellcheck-dictionaries: ## Lint - CSpell dictionaries.
	@EXIT_CODE=0; \
	for TXT_FILE in $$(ls .cspell/*.txt); do \
		TERMS_ACTUAL=$$(cat "$${TXT_FILE}"); \
		TERMS_SORTED=$$(LC_COLLATE=C sort "$${TXT_FILE}" --ignore-case); \
		if [ "$${TERMS_ACTUAL}" != "$${TERMS_SORTED}" ]; then \
			EXIT_CODE=1; \
			MESSAGE="Terms at \"$${TXT_FILE}\" are not declared with the expected sort."; \
			if [ 'github' = "${ENVIRONMENT}" ]; then \
				echo "::error file=$${TXT_FILE},line=1::$${MESSAGE}"; \
			else \
				echo "$${MESSAGE}"; \
			fi; \
		fi; \
		if [ -n "$$(sort $${TXT_FILE} | uniq --count --repeated)" ]; then \
			EXIT_CODE=1; \
			MESSAGE="Some terms at \"$${TXT_FILE}\" are duplicated."; \
			if [ 'github' = "${ENVIRONMENT}" ]; then \
				echo "::error file=$${TXT_FILE},line=1::$${MESSAGE}"; \
			else \
				echo "$${MESSAGE}"; \
			fi; \
		fi; \
		LOCAL_DICT="$$(basename "$${TXT_FILE}" '.txt')"; \
		TERM_LIST="$$(cat "$${TXT_FILE}" | tr '\n' ' ' | sed '$$s/ $$/\n/')"; \
		if [ -z "$${TERM_LIST}" ]; then \
			continue; \
		fi; \
		BUILT_IN_DICTS=$$(NODE_OPTIONS='--no-deprecation' cspell trace --config .cspell/cspell.yaml --only-found --no-ignore-case $${TERM_LIST}); \
		for TERM in $${TERM_LIST}; do \
			FOUND="$$(echo "$${BUILT_IN_DICTS}" \
				| awk --assign TERM="$${TERM}" --assign LOCAL_DICT="$${LOCAL_DICT}" 'TERM == $$1 && "*" == $$2 && LOCAL_DICT"*" != $$3 {print $$3}' \
				| tr '\n' ' ' | sed '$$s/ $$/\n/' \
			)"; \
			if [ -n "$${FOUND}" ]; then \
				EXIT_CODE=1; \
				DICT_LIST=''; \
				for DICT in $${FOUND}; do \
					if [ -n "$${DICT_LIST}" ]; then \
						DICT_LIST="$${DICT_LIST}, "; \
					fi; \
					DICT_LIST="$${DICT_LIST}\"$${DICT}\""; \
				done; \
				MESSAGE="The term \"$${TERM}\" declared in the local dictionary \"$${LOCAL_DICT}\" already exists in the following built-in dictionaries: $${DICT_LIST}."; \
				if [ 'github' = "${ENVIRONMENT}" ]; then \
					LINE="$$(awk --assign TERM="^$${TERM}$$" '$$0 ~ TERM{ print NR; exit }' "$${TXT_FILE}")"; \
					echo "::error file=$${TXT_FILE},line=$${LINE}::$${MESSAGE}"; \
				else \
					echo "$${MESSAGE}"; \
				fi; \
			fi; \
		done; \
	done; \
	exit $${EXIT_CODE};
.PHONY: lint-spellcheck-dictionaries

package: ## Package app for deployment.
	# @see: https://docs.aws.amazon.com/lambda/latest/dg/python-package.html#python-package-create-dependencies.
	@rm -rf .aws/sam/build/Fede RL03-skeleton-aws-lambda-python.zip \
	&& mkdir --parents .aws/sam/build/ \
	&& cd .venv/lib/python3.12/site-packages/ \
	&& zip -r ../../../../.aws/sam/build/Fede RL03-skeleton-aws-lambda-python.zip . -x "*.dist-info/*" \
	&& cd ../../../../src/ \
	&& zip ../.aws/sam/build/Fede RL03-skeleton-aws-lambda-python.zip model_enum/* app.py \
	&& cd ../
.PHONY: package

LAMBDAS_SRC := src/lambdas_code
LAMBDAS_BUILD := .aws/sam/build-lambda
LAMBDA_DIRS := $(wildcard $(LAMBDAS_SRC)/*)

package-lambdas: ## Package all Lambda functions as individual zip files.
	@rm -rf $(LAMBDAS_BUILD) && mkdir -p $(LAMBDAS_BUILD)
	@for LAMBDA_DIR in $(LAMBDA_DIRS); do \
		LAMBDA_NAME=$$(basename "$$LAMBDA_DIR"); \
		echo "Packaging $$LAMBDA_NAME..."; \
		cd "$$LAMBDA_DIR" && zip -r "../../../$(LAMBDAS_BUILD)/$$LAMBDA_NAME.zip" . -x "__pycache__/*" && cd "../../.."; \
	done
	@echo "All lambdas packaged in $(LAMBDAS_BUILD)/"
.PHONY: package-lambdas
