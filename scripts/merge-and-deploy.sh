#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔄 Merge Dev to Main and Deploy Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# This script automates the entire process of merging dev to main and deploying.
# It includes safety checks and rollback capabilities.
#
# Usage: ./scripts/merge-and-deploy.sh
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
MAIN_DIR="/home/reyerchu/hack/hack"
DEV_DIR="/home/reyerchu/hack/hack-dev"
DEPLOY_SCRIPT="$MAIN_DIR/scripts/deploy-main.sh"

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Pre-flight checks
preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check if we're in main branch
    cd $MAIN_DIR
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        log_error "Not on main branch! Current: $current_branch"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_error "Uncommitted changes detected in main branch"
        git status --short
        exit 1
    fi
    
    # Check dev branch exists
    if ! git show-ref --verify --quiet refs/heads/dev; then
        log_error "Dev branch does not exist"
        exit 1
    fi
    
    log_success "Pre-flight checks passed"
}

# Backup current state
backup_state() {
    log_info "Creating backup of current main state..."
    cd $MAIN_DIR
    
    local backup_branch="backup-main-$(date +%Y%m%d-%H%M%S)"
    git branch $backup_branch
    
    log_success "Created backup branch: $backup_branch"
    echo "$backup_branch" > /tmp/merge_backup_branch
}

# Merge dev to main
merge_branches() {
    log_info "Merging dev into main..."
    cd $MAIN_DIR
    
    # Fetch latest
    git fetch origin dev 2>/dev/null || true
    
    # Merge
    if git merge dev --no-edit; then
        log_success "Merge successful"
    else
        log_error "Merge failed - conflicts detected"
        log_warning "Please resolve conflicts manually and run:"
        log_warning "  git merge --continue"
        log_warning "  ./scripts/deploy-main.sh"
        exit 1
    fi
}

# Deploy to production
deploy_production() {
    log_info "Deploying to production..."
    
    if [ ! -f "$DEPLOY_SCRIPT" ]; then
        log_error "Deploy script not found: $DEPLOY_SCRIPT"
        exit 1
    fi
    
    bash "$DEPLOY_SCRIPT"
}

# Rollback on failure
rollback() {
    log_error "Deployment failed! Rolling back..."
    
    cd $MAIN_DIR
    local backup_branch=$(cat /tmp/merge_backup_branch 2>/dev/null || echo "")
    
    if [ -n "$backup_branch" ]; then
        log_info "Resetting to backup branch: $backup_branch"
        git reset --hard $backup_branch
        log_success "Rollback complete"
    else
        log_warning "No backup branch found - please rollback manually"
    fi
}

# Main
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔄 Merge Dev to Main and Deploy"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Set up trap for errors
    trap rollback ERR
    
    # Step 1: Pre-flight checks
    preflight_checks
    echo ""
    
    # Step 2: Backup
    backup_state
    echo ""
    
    # Step 3: Merge
    merge_branches
    echo ""
    
    # Step 4: Deploy
    deploy_production
    echo ""
    
    # Cleanup
    rm -f /tmp/merge_backup_branch
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Merge and Deployment Complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

main "$@"

