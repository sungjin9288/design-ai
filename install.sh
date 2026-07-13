#!/usr/bin/env bash
# install.sh — install design-ai globally for Claude Code via symlinks
# Idempotent: safe to re-run; updates symlinks to current path.
#
# Usage:
#   ./install.sh                # install
#   ./install.sh --uninstall    # remove symlinks
#   ./install.sh --status       # show what's installed
#
# After install, all 21 skills, 16 commands, and 4 agents are available
# in any Claude Code session, prefixed with "design-".

set -euo pipefail

DESIGN_AI_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"
PREFIX="${DESIGN_AI_PREFIX:-design-}"

SKILLS_DIR="$CLAUDE_HOME/skills"
AGENTS_DIR="$CLAUDE_HOME/agents"
COMMANDS_DIR="$CLAUDE_HOME/commands"

# Colors
if [ -n "${NO_COLOR:-}" ] || [ ! -t 1 ]; then
  GREEN=''
  YELLOW=''
  RED=''
  BLUE=''
  NC=''
else
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  BLUE='\033[0;34m'
  NC='\033[0m'
fi

log_info()    { printf "${BLUE}ℹ${NC}  %s\n" "$1"; }
log_success() { printf "${GREEN}✓${NC}  %s\n" "$1"; }
log_warn()    { printf "${YELLOW}⚠${NC}  %s\n" "$1"; }
log_error()   { printf "${RED}✗${NC}  %s\n" "$1"; }

print_header() {
  printf "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}\n"
  printf "${BLUE}║${NC}  design-ai installer                                         ${BLUE}║${NC}\n"
  printf "${BLUE}║${NC}  Senior product designer for Claude Code                     ${BLUE}║${NC}\n"
  printf "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n\n"
}

ensure_dirs() {
  mkdir -p "$SKILLS_DIR" "$AGENTS_DIR" "$COMMANDS_DIR"
}

install_skills() {
  local count=0
  for skill_dir in "$DESIGN_AI_ROOT"/skills/*/; do
    [ -d "$skill_dir" ] || continue
    local name; name=$(basename "$skill_dir")
    local target="$SKILLS_DIR/${PREFIX}${name}"

    # Remove stale symlink / dir
    [ -L "$target" ] && rm "$target"

    if [ -e "$target" ] && [ ! -L "$target" ]; then
      log_warn "Skipping ${PREFIX}${name}: a non-symlink already exists at $target"
      continue
    fi

    ln -sf "$skill_dir" "$target"
    count=$((count + 1))
  done
  log_success "Installed $count skills (prefix: ${PREFIX})"
}

install_agents() {
  local count=0
  for agent_file in "$DESIGN_AI_ROOT"/agents/*.md; do
    [ -f "$agent_file" ] || continue
    local base; base=$(basename "$agent_file")
    [ "$base" = "README.md" ] && continue

    local target="$AGENTS_DIR/${PREFIX}${base}"
    [ -L "$target" ] && rm "$target"

    if [ -e "$target" ] && [ ! -L "$target" ]; then
      log_warn "Skipping ${PREFIX}${base}: a non-symlink already exists at $target"
      continue
    fi

    ln -sf "$agent_file" "$target"
    count=$((count + 1))
  done
  log_success "Installed $count agents (prefix: ${PREFIX})"
}

install_commands() {
  local count=0
  for cmd_file in "$DESIGN_AI_ROOT"/commands/*.md; do
    [ -f "$cmd_file" ] || continue
    local base; base=$(basename "$cmd_file")
    [ "$base" = "README.md" ] && continue

    local target="$COMMANDS_DIR/${PREFIX}${base}"
    [ -L "$target" ] && rm "$target"

    if [ -e "$target" ] && [ ! -L "$target" ]; then
      log_warn "Skipping ${PREFIX}${base}: a non-symlink already exists at $target"
      continue
    fi

    ln -sf "$cmd_file" "$target"
    count=$((count + 1))
  done
  log_success "Installed $count slash commands (prefix: /${PREFIX})"
}

uninstall() {
  print_header
  log_info "Uninstalling design-ai from $CLAUDE_HOME"
  local count=0

  for dir in "$SKILLS_DIR" "$AGENTS_DIR" "$COMMANDS_DIR"; do
    [ -d "$dir" ] || continue
    while IFS= read -r -d '' link; do
      local target_path
      target_path=$(readlink "$link" 2>/dev/null || true)
      if [[ "$target_path" == "$DESIGN_AI_ROOT"* ]]; then
        rm "$link"
        count=$((count + 1))
      fi
    done < <(find "$dir" -maxdepth 1 -type l -print0)
  done

  log_success "Removed $count design-ai symlinks"
}

status() {
  print_header
  log_info "design-ai source: $DESIGN_AI_ROOT"
  log_info "Claude Code home: $CLAUDE_HOME"
  log_info "Symlink prefix:   ${PREFIX}"
  echo

  for dir in "$SKILLS_DIR" "$AGENTS_DIR" "$COMMANDS_DIR"; do
    [ -d "$dir" ] || { log_warn "$dir does not exist"; continue; }
    local kind; kind=$(basename "$dir")
    local count=0
    while IFS= read -r -d '' link; do
      local target_path
      target_path=$(readlink "$link" 2>/dev/null || true)
      if [[ "$target_path" == "$DESIGN_AI_ROOT"* ]]; then
        count=$((count + 1))
      fi
    done < <(find "$dir" -maxdepth 1 -type l -print0)
    log_success "$kind: $count installed"
  done
}

main() {
  case "${1:-install}" in
    --uninstall|uninstall)
      uninstall
      ;;
    --status|status)
      status
      ;;
    --help|-h|help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      ;;
    install|*)
      print_header
      log_info "Installing from: $DESIGN_AI_ROOT"
      log_info "Target:          $CLAUDE_HOME"
      log_info "Symlink prefix:  ${PREFIX}"
      echo
      ensure_dirs
      install_skills
      install_agents
      install_commands
      echo
      log_success "Done. Restart Claude Code (or open a new session) to pick up changes."
      log_info "Try: ${PREFIX}component-spec, ${PREFIX}motion-design, ${PREFIX}spatial"
      log_info "Override prefix:  DESIGN_AI_PREFIX=mydesign- ./install.sh"
      log_info "Override target:  CLAUDE_HOME=/some/dir   ./install.sh"
      ;;
  esac
}

main "$@"
